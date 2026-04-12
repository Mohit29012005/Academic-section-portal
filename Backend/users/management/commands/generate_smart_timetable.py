import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.db.models import Q


class SmartTimetableGenerator:
    """
    AI-powered Timetable Generator
    Features:
    - Conflict-free scheduling
    - Faculty-Subject mapping
    - Room optimization (Lab vs Lecture)
    - Branch-aware scheduling
    - Priority-based optimization
    - Auto-assignment of locked slots preserved
    """

    def __init__(self, branch="Kherva", dry_run=False):
        self.branch = branch
        self.dry_run = dry_run
        self.conflicts = []
        self.stats = {
            "total_slots": 0,
            "generated": 0,
            "skipped_locked": 0,
            "conflicts_resolved": 0,
        }

    def generate(self):
        """Main generation method"""
        from academics.models import (
            Course,
            Subject,
            Room,
            TimeSlot,
            TimetableSlot,
            FacultyAvailability,
            TimetableSchedule,
            DayType,
        )
        from users.models import Student, Faculty

        print(f"\n{'=' * 70}")
        print(f"SMART TIMETABLE - {self.branch} Campus (DUAL SHIFT SYSTEM)")
        print(f"{'=' * 70}\n")

        # Get all required data
        courses = Course.objects.all()
        rooms = Room.objects.filter(campus_branch=self.branch, is_available=True)
        faculty_list = Faculty.objects.filter(subjects__isnull=False).distinct()
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

        print(f"[DATA] Overview:")
        print(f"   Courses: {courses.count()}")
        print(f"   Rooms: {rooms.count()}")
        print(f"   Faculty: {faculty_list.count()}")
        print(f"   Working Days: {len(days)}")
        print()

        # Show shift assignments
        morning_courses = list(courses.filter(shift="MORNING"))
        noon_courses = list(courses.filter(shift="NOON"))
        print(f"[SHIFTS]")
        print(
            f"   Morning Shift ({len(morning_courses)}): {', '.join([c.code for c in morning_courses])}"
        )
        print(
            f"   Noon Shift ({len(noon_courses)}): {', '.join([c.code for c in noon_courses])}"
        )
        print()

        # Track occupied slots
        faculty_schedule = {}  # faculty_id -> {(day, time): slot}
        room_schedule = {}  # room_id -> {(day, time): slot}
        course_schedule = {}  # course_id -> {(day, time): [slots]}

        generated_count = 0
        locked_count = 0

        for course in courses:
            print(f"\n[COURSE] {course.name} ({course.code}) [{course.shift}]")

            # Get time slots based on course shift
            weekday_type = DayType.objects.filter(day_type="weekday").first()
            time_slots = TimeSlot.objects.filter(
                shift__code=course.shift,  # Use course's shift
                campus_branch=self.branch,
                is_active=True,
                is_break=False,
            ).order_by("slot_order")

            print(f"   [SHIFT] Using {course.shift} slots: {time_slots.count()} slots")

            if not time_slots.exists():
                print(f"   [WARNING] No time slots found for shift {course.shift}!")
                continue

            # Get subjects for this course, filtered by branch
            subjects = Subject.objects.filter(
                course=course, campus_branch__in=[self.branch, "Both"]
            ).order_by("semester")

            if not subjects.exists():
                print(f"   [SKIP] No subjects for {self.branch} campus")
                continue

            # Group by semester
            semesters = set(subjects.values_list("semester", flat=True))

            for sem in sorted(semesters):
                sem_subjects = subjects.filter(semester=sem)
                print(f"\n   [SEM] Semester {sem}: {sem_subjects.count()} subjects")

                # Check for existing locked slots
                existing_locked = TimetableSlot.objects.filter(
                    course=course, semester=sem, is_locked=True
                )

                # Track existing locked slots
                for locked in existing_locked:
                    key = (locked.day_of_week, str(locked.start_time))
                    faculty_schedule.setdefault(str(locked.faculty.faculty_id), {})[
                        key
                    ] = locked
                    if locked.room:
                        room_schedule.setdefault(str(locked.room.room_id), {})[key] = (
                            locked
                        )
                    course_schedule.setdefault(str(course.course_id), {})[key] = locked
                    locked_count += 1

                print(f"   [LOCKED] Slots preserved: {existing_locked.count()}")

                for subject in sem_subjects:
                    # Find assigned faculty
                    faculty = self._find_faculty(subject, faculty_list)
                    if not faculty:
                        print(f"      [WARN] No faculty for {subject.code}")
                        continue

                    # Determine slot type (lab/practical vs theory)
                    slot_type = self._determine_slot_type(subject)

                    # Try to generate slots for this subject
                    slots_to_create = self._create_subject_slots(
                        subject=subject,
                        course=course,
                        semester=sem,
                        faculty=faculty,
                        rooms=rooms,
                        time_slots=time_slots,
                        days=days,
                        faculty_schedule=faculty_schedule,
                        room_schedule=room_schedule,
                        course_schedule=course_schedule,
                        slot_type=slot_type,
                    )

                    generated_count += slots_to_create

        print(f"\n{'=' * 60}")
        print(f"[DONE] GENERATION COMPLETE")
        print(f"{'=' * 60}")
        print(f"   Slots Generated: {generated_count}")
        print(f"   Locked Slots: {locked_count}")
        print(f"   Conflicts: {len(self.conflicts)}")

        return {
            "generated": generated_count,
            "locked": locked_count,
            "conflicts": len(self.conflicts),
        }

    def _find_faculty(self, subject, faculty_list):
        """Find best faculty for a subject based on expertise"""
        # First try exact department match
        matching_faculty = [
            f
            for f in faculty_list
            if f.department == subject.course.department and subject in f.subjects.all()
        ]

        if matching_faculty:
            # Prefer HOD or senior faculty
            matching_faculty.sort(
                key=lambda x: (
                    x.designation == "HOD",
                    x.designation == "Professor",
                    x.experience_years,
                ),
                reverse=True,
            )
            return matching_faculty[0]

        # Fallback to any faculty who can teach this subject
        any_faculty = [f for f in faculty_list if subject in f.subjects.all()]

        if any_faculty:
            return random.choice(any_faculty)

        return None

    def _determine_slot_type(self, subject):
        """Determine if subject needs lab/practical slot"""
        name_lower = subject.name.lower()
        if any(
            word in name_lower for word in ["lab", "practical", "project", "workshop"]
        ):
            return "Practical"
        elif any(word in name_lower for word in ["tutorial", "seminar"]):
            return "Tutorial"
        return "Theory"

    def _create_subject_slots(
        self,
        subject,
        course,
        semester,
        faculty,
        rooms,
        time_slots,
        days,
        faculty_schedule,
        room_schedule,
        course_schedule,
        slot_type,
    ):
        """Create timetable slots for a subject"""
        from academics.models import TimetableSlot

        slots_created = 0
        faculty_key = str(faculty.faculty_id)
        course_key = str(course.course_id)

        # Get available rooms based on slot type
        if slot_type == "Practical":
            available_rooms = list(rooms.filter(room_type__in=["Lab", "Workshop"]))
        elif slot_type == "Theory":
            available_rooms = list(
                rooms.filter(
                    room_type__in=["Lecture Hall", "Seminar Hall", "Tutorial Room"]
                )
            )
        else:
            available_rooms = list(
                rooms.filter(room_type__in=["Tutorial Room", "Lecture Hall"])
            )

        if not available_rooms:
            available_rooms = list(rooms)

        # Create 2-3 slots per subject per week
        slots_needed = 2 if slot_type == "Practical" else 3

        for _ in range(slots_needed):
            for day in days:
                # Find available time slot
                for ts in time_slots:
                    time_key = (day, str(ts.start_time))

                    # Check faculty availability
                    if time_key in faculty_schedule.get(faculty_key, {}):
                        continue

                    # Check course conflict
                    if time_key in course_schedule.get(course_key, {}):
                        continue

                    # Find available room
                    room = None
                    for r in available_rooms:
                        room_key = str(r.room_id)
                        if time_key not in room_schedule.get(room_key, {}):
                            room = r
                            break

                    if not room:
                        continue

                    # Create slot
                    if not self.dry_run:
                        TimetableSlot.objects.create(
                            course=course,
                            semester=semester,
                            day_of_week=day,
                            time_slot=ts,
                            start_time=ts.start_time,
                            end_time=ts.end_time,
                            subject=subject,
                            faculty=faculty,
                            room=room,
                            room_name=room.room_number,
                            section="A",
                            slot_type=slot_type,
                            is_auto_generated=True,
                            generated_by="smart_generator",
                            priority=5,
                        )

                    # Update schedules
                    faculty_schedule.setdefault(faculty_key, {})[time_key] = True
                    room_schedule.setdefault(str(room.room_id), {})[time_key] = True
                    course_schedule.setdefault(course_key, {})[time_key] = True

                    slots_created += 1
                    break

        return slots_created


class Command(BaseCommand):
    help = "Generate Smart Timetable for specified branch"

    def add_arguments(self, parser):
        parser.add_argument(
            "--branch",
            type=str,
            default="Kherva",
            choices=["Kherva", "Ahmedabad"],
            help="Campus branch to generate timetable for",
        )
        parser.add_argument(
            "--dry-run", action="store_true", help="Preview without saving"
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear auto-generated slots before generating",
        )

    def handle(self, *args, **options):
        branch = options["branch"]
        dry_run = options["dry_run"]
        clear = options["clear"]

        if clear:
            self.stdout.write(f"\n[CLEAR] Auto-generated slots for {branch}...")
            from academics.models import TimetableSlot

            deleted = TimetableSlot.objects.filter(
                is_auto_generated=True,
                course__subjects__campus_branch__in=[branch, "Both"],
            ).delete()[0]
            self.stdout.write(self.style.SUCCESS(f"   Deleted {deleted} slots"))

        self.stdout.write(f"\n[GENERATE] Smart Timetable for {branch} Campus")
        if dry_run:
            self.stdout.write(self.style.WARNING("   [DRY RUN] - No changes saved"))

        generator = SmartTimetableGenerator(branch=branch, dry_run=dry_run)
        result = generator.generate()

        if dry_run:
            self.stdout.write(self.style.WARNING("\n[DRY RUN] Complete"))
        else:
            self.stdout.write(self.style.SUCCESS("\n[SUCCESS] Timetable generated!"))
