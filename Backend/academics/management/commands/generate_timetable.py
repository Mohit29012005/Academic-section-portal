"""Timetable generation with shift-aware timing and conflict-safe allocation."""

from collections import defaultdict

from django.core.management.base import BaseCommand
from django.db import transaction

from academics.models import Course, Room, Subject, TimetableSlot
from users.models import Faculty


class Command(BaseCommand):
    help = "Generate timetable with validated timings, balanced faculty load, and no room/faculty clashes"

    WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    DAYS = WEEKDAYS + ["Saturday"]
    SATURDAY_SLOT_LIMIT = 3

    # Morning shift (8:00 AM - 1:00 PM)
    MORNING_SLOTS = [
        (1, "08:00", "08:55"),
        (2, "08:55", "09:40"),
        (3, "10:15", "11:10"),
        (4, "11:10", "12:00"),
        (5, "12:00", "12:55"),
    ]

    # Noon shift (12:00 PM - 6:10 PM) with break gaps handled in UI
    NOON_SLOTS = [
        (1, "12:00", "12:55"),
        (2, "13:25", "14:20"),
        (3, "15:15", "16:10"),
        (4, "16:30", "17:20"),
        (5, "17:20", "18:10"),
    ]

    MORNING_ROOMS = ["LH-102", "LH-103", "B-LH-02", "A-201", "A-202", "C-101", "C-102"]
    NOON_ROOMS = ["A-105", "A-107", "A-108", "A-205", "A-206", "A-207", "A-208"]

    SEM_SECTIONS = {1: "A", 2: "B", 3: "C", 4: "D", 5: "E", 6: "F", 7: "G", 8: "H"}

    THEORY_COMBINATIONS = [
        ["Monday", "Wednesday", "Friday"],
        ["Monday", "Tuesday", "Thursday"],
        ["Tuesday", "Thursday", "Saturday"],
        ["Wednesday", "Friday", "Monday"],
    ]

    LAB_COMBINATIONS = [
        ["Monday", "Wednesday"],
        ["Tuesday", "Thursday"],
        ["Wednesday", "Friday"],
        ["Thursday", "Saturday"],
    ]

    def _get_shift_rooms(self, shift, room_map):
        preferred = self.MORNING_ROOMS if shift == "morning" else self.NOON_ROOMS
        preferred_available = [room_name for room_name in preferred if room_name in room_map]
        all_rooms = sorted(room_map.keys())
        remaining_rooms = [room_name for room_name in all_rooms if room_name not in preferred_available]
        return preferred_available + remaining_rooms

    def _resolve_shift(self, course):
        shift = (course.shift or "").upper()
        if shift in ("MORNING", "NOON"):
            return shift.lower()

        # Legacy fallback if shift is missing in DB
        code = (course.code or "").upper()
        if any(token in code for token in ["BCA", "BSC", "MSCIT-AIML", "IMS"]):
            return "noon"
        return "morning"

    def _build_faculty_pool(self, shift):
        active = list(Faculty.objects.filter(status="Active").exclude(name__icontains="TBA").order_by("name"))
        if shift == "morning":
            pool = [f for f in active if f.working_shift in ("Morning", "Full Day")]
        else:
            pool = [f for f in active if f.working_shift in ("Noon", "Full Day")]
        preferred_ids = {str(f.faculty_id) for f in pool}
        others = [f for f in active if str(f.faculty_id) not in preferred_ids]
        return pool + others

    def _subject_faculty_candidates(self, subject, shift, fallback_pool, faculty_total_load):
        assigned = list(subject.faculty_members.filter(status="Active"))
        if shift == "morning":
            assigned = [f for f in assigned if f.working_shift in ("Morning", "Full Day")]
        else:
            assigned = [f for f in assigned if f.working_shift in ("Noon", "Full Day")]

        candidates = assigned or fallback_pool
        if not candidates:
            return [], bool(assigned)

        return sorted(
            candidates,
            key=lambda f: (
                faculty_total_load.get(str(f.faculty_id), 0),
                (f.max_lectures_per_day or 6),
                f.name.lower(),
            ),
        ), bool(assigned)

    def _pick_available_room(self, room_numbers, room_map, room_busy, day, start, end):
        for room_name in room_numbers:
            if (room_name, day, start, end) not in room_busy:
                return room_map.get(room_name), room_name
        return None, None

    def _required_sessions(self, subject_name):
        subject_upper = (subject_name or "").upper()
        is_lab = any(token in subject_upper for token in ["LAB", "PRACTICAL", "PROJECT", "WORKSHOP"])
        if is_lab:
            return 1, "Practical", True
        return 2, "Theory", False

    def _pick_home_room(
        self,
        course,
        semester,
        section,
        room_numbers,
        room_map,
        class_room_map,
        room_total_load,
        room_reserved_load,
        class_demand,
        existing_slots,
    ):
        class_key = (str(course.course_id), semester, section)
        if class_key in class_room_map:
            room_name = class_room_map[class_key]
            return room_map.get(room_name), room_name

        existing_room_name = None
        for slot in existing_slots:
            if slot.room_name:
                existing_room_name = slot.room_name
                break
            if slot.room:
                existing_room_name = slot.room.room_number
                break

        if existing_room_name and existing_room_name in room_numbers:
            class_room_map[class_key] = existing_room_name
            room_reserved_load[existing_room_name] += class_demand
            return room_map.get(existing_room_name), existing_room_name

        used_by_course = {
            room_name
            for (course_id, _sem, _section), room_name in class_room_map.items()
            if course_id == str(course.course_id)
        }
        used_globally = set(class_room_map.values())
        ordered_rooms = sorted(
            room_numbers,
            key=lambda room_name: (
                1 if room_name in used_globally else 0,
                1 if room_name in used_by_course else 0,
                room_reserved_load.get(room_name, 0),
                room_total_load.get(room_name, 0),
                room_name,
            ),
        )
        if not ordered_rooms:
            return None, None

        room_name = ordered_rooms[0]
        class_room_map[class_key] = room_name
        room_reserved_load[room_name] += class_demand
        return room_map.get(room_name), room_name

    def handle(self, *args, **options):
        self.stdout.write("=" * 72)
        self.stdout.write("TIMETABLE GENERATION - SHIFT AWARE + CONFLICT SAFE")
        self.stdout.write("=" * 72)

        # Get or create a TBA User to map a generic fallback faculty
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user_tba, _ = User.objects.get_or_create(
            email="tba@ganpatuniversity.ac.in",
            defaults={"role": "faculty"}
        )
        
        # Create a generic TBA faculty to handle mathematically impossible clash-free alignments
        tba_faculty, _ = Faculty.objects.get_or_create(
            user=user_tba,
            defaults={
                "name": "TBA (To Be Assigned)",
                "email": "tba@ganpatuniversity.ac.in",
                "phone": "0000000000",
                "department": "Admin",
                "working_shift": "Full Day",
                "status": "Active",
                "max_lectures_per_day": 99,
            }
        )

        with transaction.atomic():
            TimetableSlot.objects.filter(is_auto_generated=True).delete()
        self.stdout.write("\n[OK] Cleared existing auto-generated slots")

        all_rooms = Room.objects.all().order_by("room_number")
        room_map = {r.room_number: r for r in all_rooms}

        # Track global occupied resources so different courses do not clash.
        faculty_busy = set()
        room_busy = set()
        faculty_day_load = defaultdict(int)
        faculty_total_load = defaultdict(int)
        room_total_load = defaultdict(int)
        room_reserved_load = defaultdict(int)
        class_room_map = {}

        for existing in TimetableSlot.objects.select_related("room", "faculty"):
            start = existing.start_time.strftime("%H:%M")
            end = existing.end_time.strftime("%H:%M")
            day = existing.day_of_week
            faculty_busy.add((str(existing.faculty_id), day, start, end))
            faculty_day_load[(str(existing.faculty_id), day)] += 1
            faculty_total_load[str(existing.faculty_id)] += 1

            room_name = existing.room_name or (
                existing.room.room_number if existing.room else None
            )
            if room_name:
                room_busy.add((room_name, day, start, end))
                room_total_load[room_name] += 1
                room_reserved_load[room_name] += 1

        total_created = 0
        unassigned_subjects = []

        # Custom course ordering
        custom_order = [
            "BCA", "BSCIT", "BSCIT-IMS", "BSCIT-CS", "BTech", "MTech", 
            "MCA", "MSCIT-IMS", "MSCIT-CS", "MSCIT-AIML", "MSCIT"
        ]
        def get_order_index(c):
            try:
                return [x.upper() for x in custom_order].index(c.code.upper())
            except ValueError:
                return 99

        all_courses = list(Course.objects.all())
        all_courses.sort(key=get_order_index)

        for course in all_courses:
            shift = self._resolve_shift(course)
            slots = self.MORNING_SLOTS if shift == "morning" else self.NOON_SLOTS
            rooms = self._get_shift_rooms(shift, room_map)
            faculty_pool = self._build_faculty_pool(shift)

            semesters = sorted(
                Subject.objects.filter(course=course)
                .values_list("semester", flat=True)
                .distinct()
            )
            if not semesters:
                continue

            self.stdout.write(
                f"\n[{course.code}] {course.name} ({shift.upper()}) | faculty pool: {len(faculty_pool)}"
            )

            for sem in semesters:
                if sem == getattr(course, "total_semesters", -1):
                    self.stdout.write(f"  Sem {sem} is the final Project/Internship semester. Skipping lectures.")
                    continue

                section = self.SEM_SECTIONS.get(sem, "A")
                subjects = list(Subject.objects.filter(course=course, semester=sem).order_by("code"))
                if not subjects:
                    continue

                class_demand = sum(self._required_sessions(subject.name)[0] for subject in subjects)

                self.stdout.write(
                    f"  Sem {sem} (Section {section}): {len(subjects)} subjects"
                )

                existing = TimetableSlot.objects.filter(
                    course=course, semester=sem, section=section
                )
                existing = list(existing.select_related("room"))
                used_local = {
                    (s.day_of_week, s.start_time.strftime("%H:%M"), s.end_time.strftime("%H:%M"))
                    for s in existing
                }
                class_day_load = defaultdict(int)
                for slot in existing:
                    class_day_load[slot.day_of_week] += 1

                home_room_obj, home_room_name = self._pick_home_room(
                    course, sem, section, rooms, room_map, class_room_map,
                    room_total_load, room_reserved_load, class_demand, existing,
                )
                if not home_room_name:
                    unassigned_subjects.append(f"{course.code} S{sem}: no classroom available")
                    continue

                self.stdout.write(f"    Classroom: {home_room_name}")

                subject_day_count = defaultdict(int)

                # Bind faculty consistently per subject for the entire semester
                class_subject_faculty = {}
                for subject in subjects:
                    candidates, is_explicit = self._subject_faculty_candidates(
                        subject, shift, faculty_pool, faculty_total_load
                    )
                    required_sessions, slot_type, is_lab = self._required_sessions(subject.name)
                    
                    if is_explicit:
                        bound_faculties = candidates[:2] if is_lab else candidates[:1]
                    else:
                        bound_faculties = candidates[:1] if candidates else []
                        if bound_faculties:
                            faculty_total_load[str(bound_faculties[0].faculty_id)] += required_sessions
                            
                    class_subject_faculty[subject.name] = bound_faculties

                from academics.models import TimeSlot
                all_shift_slots = list(TimeSlot.objects.filter(
                    shift__code__iexact=shift,
                    is_break=False,
                    is_active=True
                ).order_by("slot_order"))

                # The frontend and PDF always use weekday column headers. 
                # We MUST use weekday timings for Saturday as well, otherwise they won't render.
                weekday_slots = [s for s in all_shift_slots if s.day_type and s.day_type.day_type == "weekday"]
                if not weekday_slots:
                    weekday_slots = all_shift_slots

                slots_to_fill = []
                for day in self.DAYS:
                    # Always use weekday timings to match the standard UI columns
                    day_slots = weekday_slots
                    if day == "Saturday":
                        num_sat_slots = 3
                        day_slots = day_slots[:num_sat_slots]
                        
                    for slot in day_slots:
                        start_str = slot.start_time.strftime("%H:%M")
                        end_str = slot.end_time.strftime("%H:%M")
                        slots_to_fill.append((day, start_str, end_str))

                subj_idx = 0
                for day, start, end in slots_to_fill:
                    local_key = (day, start, end)
                    if local_key in used_local:
                        continue

                    valid_assignment = False
                    selected_subject = None
                    selected_faculty = None
                    selected_faculty_key = None

                    # Pass 1: Try to find a subject that has NOT exceeded its daily max AND its faculty is free
                    for _attempt in range(len(subjects)):
                        subject = subjects[subj_idx % len(subjects)]
                        
                        req_sess, _, is_lab = self._required_sessions(subject.name)
                        max_per_day = 2 if is_lab else 1
                        
                        if subject_day_count[(subject.name, day)] < max_per_day:
                            bound_faculties = class_subject_faculty.get(subject.name, [])
                            for faculty in bound_faculties:
                                faculty_key = (str(faculty.faculty_id), day, start, end)
                                if faculty_key not in faculty_busy:
                                    selected_faculty = faculty
                                    selected_faculty_key = faculty_key
                                    break
                                    
                            if selected_faculty:
                                selected_subject = subject
                                valid_assignment = True
                                subj_idx += 1
                                break
                        
                        subj_idx += 1

                    # Pass 2: If no strict subject found, relax the daily limit to fill the mandatory grid slot
                    if not valid_assignment:
                        for _attempt in range(len(subjects)):
                            subject = subjects[subj_idx % len(subjects)]
                            
                            bound_faculties = class_subject_faculty.get(subject.name, [])
                            for faculty in bound_faculties:
                                faculty_key = (str(faculty.faculty_id), day, start, end)
                                if faculty_key not in faculty_busy:
                                    selected_faculty = faculty
                                    selected_faculty_key = faculty_key
                                    break
                                    
                            if selected_faculty:
                                selected_subject = subject
                                valid_assignment = True
                                subj_idx += 1
                                break
                                
                            subj_idx += 1

                    # Pass 3: If ALL assigned faculties are brutally clashing, fallback perfectly to TBA
                    if not valid_assignment:
                        selected_subject = subjects[subj_idx % len(subjects)]
                        subj_idx += 1
                        selected_faculty = tba_faculty
                        selected_faculty_key = None # Do NOT add TBA to busy list

                    if (home_room_name, day, start, end) in room_busy:
                        continue

                    required_sessions, slot_type, is_lab = self._required_sessions(selected_subject.name)

                    TimetableSlot.objects.create(
                        course=course,
                        semester=sem,
                        day_of_week=day,
                        start_time=start,
                        end_time=end,
                        subject=selected_subject,
                        faculty=selected_faculty,
                        room=home_room_obj,
                        room_name=home_room_name,
                        section=section,
                        slot_type=slot_type,
                        is_auto_generated=True,
                        generated_by="command",
                    )

                    used_local.add(local_key)
                    if selected_faculty_key:
                        faculty_busy.add(selected_faculty_key)
                    room_busy.add((home_room_name, day, start, end))
                    faculty_day_load[(str(selected_faculty.faculty_id), day)] += 1
                    faculty_total_load[str(selected_faculty.faculty_id)] += 1
                    room_total_load[home_room_name] += 1
                    class_day_load[day] += 1
                    subject_day_count[(selected_subject.name, day)] += 1
                    total_created += 1

        self.stdout.write("\n" + "=" * 72)
        self.stdout.write(self.style.SUCCESS(f"[DONE] Generated {total_created} slots"))
        if unassigned_subjects:
            self.stdout.write(
                self.style.WARNING(
                    f"[WARN] {len(unassigned_subjects)} subjects could not be fully scheduled"
                )
            )
            for msg in unassigned_subjects[:20]:
                self.stdout.write(f"       - {msg}")
            if len(unassigned_subjects) > 20:
                self.stdout.write("       - ...")
        self.stdout.write("=" * 72)
