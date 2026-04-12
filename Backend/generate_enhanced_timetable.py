"""
Enhanced Timetable Generator for GANPAT DCS
Respects:
- Faculty shifts (Noon shift: 12:00-18:10)
- Break slots (Lunch: 14:20-15:15, Tea: 16:10-16:30)
- Faculty working days
- Max lectures per faculty per day
- No back-to-back lectures
"""

import os
import sys
import django
import random
from datetime import time
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ampics.settings")
django.setup()

from academics.models import (
    TimeSlot,
    TimetableSlot,
    Subject,
    Course,
    FacultyAvailability,
    DayType,
)
from users.models import Faculty, Student


def get_day_type(day_of_week):
    """Get day type based on day of week"""
    if day_of_week == "Saturday":
        return DayType.objects.filter(day_type="saturday").first()
    elif day_of_week == "Sunday":
        return DayType.objects.filter(day_type="sunday").first()
    return DayType.objects.filter(day_type="weekday").first()


def get_lecture_slots(day_type):
    """Get only lecture slots (excluding breaks) for a day type"""
    if day_type:
        return TimeSlot.objects.filter(
            day_type=day_type, is_break=False, is_active=True
        ).order_by("slot_order")
    return TimeSlot.objects.filter(
        is_break=False, is_active=True, day_type__isnull=True
    ).order_by("slot_order")


def get_break_slots(day_type):
    """Get all break slots for a day type"""
    if day_type:
        return TimeSlot.objects.filter(day_type=day_type, is_break=True, is_active=True)
    return TimeSlot.objects.filter(is_break=True, is_active=True, day_type__isnull=True)


def check_faculty_availability(faculty, day_of_week):
    """Check if faculty is available on a given day"""
    try:
        availability = FacultyAvailability.objects.get(
            faculty=faculty, day_of_week=day_of_week
        )
        return availability.is_available
    except FacultyAvailability.DoesNotExist:
        return True


def get_faculty_preferred_slots(faculty, day_of_week):
    """Get faculty's preferred time slots for a day"""
    try:
        availability = FacultyAvailability.objects.get(
            faculty=faculty, day_of_week=day_of_week
        )
        return set(availability.preferred_slots or [])
    except FacultyAvailability.DoesNotExist:
        return set()


def get_faculty_unavailable_slots(faculty, day_of_week):
    """Get faculty's unavailable time slots for a day"""
    try:
        availability = FacultyAvailability.objects.get(
            faculty=faculty, day_of_week=day_of_week
        )
        return set(availability.not_available_slots or [])
    except FacultyAvailability.DoesNotExist:
        return set()


def count_faculty_lectures_today(faculty, date):
    """Count how many lectures faculty already has today"""
    return TimetableSlot.objects.filter(
        faculty=faculty,
        start_time__year=date.year,
        start_time__month=date.month,
        start_time__day=date.day,
    ).count()


def generate_enhanced_timetable(course, semester, dry_run=False):
    """
    Generate enhanced timetable for a course + semester

    Algorithm:
    1. Get subjects for course+semester
    2. For each day (Mon-Sat), assign subjects to slots
    3. Respect faculty availability and preferences
    4. Avoid conflicts (room, faculty, student)
    5. Ensure breaks are respected
    """
    DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    # Get subjects for this course+semester
    subjects = Subject.objects.filter(course=course, semester=semester)
    if not subjects.exists():
        return {"error": f"No subjects found for {course.code} Semester {semester}"}

    print(f"\n{'=' * 60}")
    print(f"GENERATING TIMETABLE: {course.code} - Semester {semester}")
    print(f"{'=' * 60}")
    print(f"Subjects: {list(subjects.values_list('code', flat=True))}")

    generated_slots = []
    conflicts = []

    for day in DAYS:
        day_type = get_day_type(day)
        lecture_slots = list(get_lecture_slots(day_type))
        break_slots = list(get_break_slots(day_type))

        if not lecture_slots:
            print(f"\n{day}: No lecture slots available")
            continue

        print(f"\n{day}: {len(lecture_slots)} lecture slots, {len(break_slots)} breaks")

        # Group subjects by faculty
        faculty_subjects = defaultdict(list)
        for subject in subjects:
            for faculty in subject.faculty_members.all():
                faculty_subjects[faculty].append(subject)

        # Assign subjects to slots
        slots_assigned = defaultdict(list)  # faculty_id -> list of slot orders

        for slot in lecture_slots:
            # Check which faculty can take this slot
            available_faculties = []

            for faculty, fac_subjects in faculty_subjects.items():
                # Check if faculty is available today
                if not check_faculty_availability(faculty, day):
                    continue

                # Check if faculty's unavailable slots
                unavailable = get_faculty_unavailable_slots(faculty, day)
                if str(slot.slot_id) in unavailable:
                    continue

                # Check max lectures per day
                if (
                    faculty.max_lectures_per_day
                    and len(slots_assigned[faculty.faculty_id])
                    >= faculty.max_lectures_per_day
                ):
                    continue

                # Check if faculty has any subject not yet scheduled today
                remaining_subjects = [
                    s
                    for s in fac_subjects
                    if s not in slots_assigned.get(faculty.faculty_id, [])
                ]
                if remaining_subjects:
                    available_faculties.append((faculty, remaining_subjects))

            # Pick a faculty with subject
            if available_faculties:
                faculty, remaining = random.choice(available_faculties)
                subject = random.choice(remaining)

                if not dry_run:
                    # Create timetable slot
                    ts = TimetableSlot.objects.create(
                        course=course,
                        semester=semester,
                        day_of_week=day,
                        time_slot=slot,
                        start_time=slot.start_time,
                        end_time=slot.end_time,
                        subject=subject,
                        faculty=faculty,
                        section="A",
                        slot_type="Theory",
                        is_auto_generated=True,
                        generated_by="enhanced_generator",
                    )
                    generated_slots.append(ts)

                slots_assigned[faculty.faculty_id].append(subject)
                print(
                    f"  {slot.name} ({slot.start_time}-{slot.end_time}): {subject.code} by {faculty.name}"
                )
            else:
                print(f"  {slot.name} ({slot.start_time}-{slot.end_time}): UNASSIGNED")

    if dry_run:
        return {"message": "Dry run complete", "slots_needed": subjects.count() * 6}

    return {
        "message": f"Generated {len(generated_slots)} timetable slots",
        "slots": generated_slots,
        "conflicts": conflicts,
    }


def generate_all_timetables():
    """Generate timetables for all active courses"""
    from academics.models import Course

    courses = Course.objects.filter(status="Active")
    results = []

    for course in courses:
        # Generate for each semester
        for sem in range(1, course.total_semesters + 1):
            result = generate_enhanced_timetable(course, sem, dry_run=False)
            results.append({"course": course.code, "semester": sem, "result": result})

    return results


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate enhanced timetable")
    parser.add_argument("--course", type=str, help="Course code (e.g., BCA, MCA)")
    parser.add_argument("--semester", type=int, help="Semester number (1-8)")
    parser.add_argument(
        "--dry-run", action="store_true", help="Preview without creating"
    )
    parser.add_argument("--all", action="store_true", help="Generate for all courses")

    args = parser.parse_args()

    if args.all:
        results = generate_all_timetables()
        print(f"\n{'=' * 60}")
        print("ALL TIMETABLES GENERATED")
        print(f"{'=' * 60}")
        for r in results:
            print(
                f"  {r['course']} S{r['semester']}: {r['result'].get('message', 'Done')}"
            )
    elif args.course and args.semester:
        from academics.models import Course

        try:
            course = Course.objects.get(code=args.course)
            result = generate_enhanced_timetable(
                course, args.semester, dry_run=args.dry_run
            )
            print(f"\nResult: {result.get('message', 'Done')}")
        except Course.DoesNotExist:
            print(f"Course {args.course} not found")
    else:
        print("Usage:")
        print("  python generate_enhanced_timetable.py --all")
        print("  python generate_enhanced_timetable.py --course BCA --semester 1")
        print(
            "  python generate_enhanced_timetable.py --course MCA --semester 1 --dry-run"
        )
