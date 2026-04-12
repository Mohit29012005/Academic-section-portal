"""
GANPAT University DCS - Complete Timetable Generator
Creates timetables for ALL courses using actual database subjects
"""

import os
import sys
import django
from datetime import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ampics.settings")
django.setup()

from academics.models import (
    Course,
    Subject,
    TimetableSlot,
    TimeSlot,
    Shift,
    DayType,
    Room,
)
from users.models import Faculty
from django.db.models import Q


def get_or_create_subject(course, semester, code, name):
    """Get or create a subject"""
    subject = Subject.objects.filter(code=code, course=course).first()
    if not subject:
        subject = Subject.objects.create(
            code=code, name=name, course=course, semester=semester, credits=4
        )
    return subject


def get_faculty_by_short_code(code):
    """Map GANPAT faculty short codes to actual faculty"""
    short_code_map = {
        # BCA Timetable Faculty
        "HCP": "FAC003",
        "RRS": "FAC005",
        "JDP": "FAC002",
        "DBB": "FAC004",
        "BRP": "FAC006",
        "KCP": "FAC004",
        # MSc Faculty
        "NIP": "FAC009",
        "PDP": "FAC010",
        "NKD": "FAC010",
        "JND": "FAC010",
        "BBP": "FAC008",
        "PA": "FAC008",
        # Others
        "DKR": "FAC007",
        "CP": "FAC007",
        "DK": "FAC006",
        "JNP": "FAC009",
        "SAG": "FAC004",
        "SBP": "FAC008",
        "MBP": "FAC007",
        "VM": "FAC007",
        "VWT": "FAC010",
    }
    emp_id = short_code_map.get(code)
    if emp_id:
        return Faculty.objects.filter(employee_id=emp_id).first()
    return None


def get_room(room_number):
    """Get or create room"""
    room = Room.objects.filter(room_number=room_number).first()
    if not room:
        room = Room.objects.create(
            room_number=room_number,
            building="Main Building",
            room_type="Lecture Hall",
            capacity=60,
        )
    return room


def create_timetable_entry(
    course, semester, day, slot_order, start_time, end_time, subject, faculty, room
):
    """Create a single timetable entry"""
    if not subject or not faculty:
        return False

    ts, created = TimetableSlot.objects.get_or_create(
        course=course,
        semester=semester,
        day_of_week=day,
        start_time=start_time,
        end_time=end_time,
        defaults={
            "subject": subject,
            "faculty": faculty,
            "room": room,
            "section": "A",
            "slot_type": "Theory",
            "is_auto_generated": True,
        },
    )
    return created


def generate_all_timetables():
    """Generate timetables for all courses"""

    print("=" * 80)
    print("GENERATING COMPLETE GANPAT DCS TIMETABLE")
    print("=" * 80)

    # Clear auto-generated slots
    TimetableSlot.objects.filter(is_auto_generated=True).delete()
    print("Cleared existing auto-generated timetable data\n")

    # Get courses
    courses = Course.objects.filter(status="Active")
    total_created = 0

    for course in courses:
        print(f"\n{'=' * 60}")
        print(f"Course: {course.name} ({course.code})")
        print(f"Shift: {course.shift}")
        print(f"{'=' * 60}")

        # Get subjects for this course
        subjects = Subject.objects.filter(course=course)
        if not subjects.exists():
            print(f"  No subjects found, skipping...")
            continue

        # Group subjects by semester
        semesters = subjects.values_list("semester", flat=True).distinct()

        for sem in sorted(semesters):
            sem_subjects = subjects.filter(semester=sem)
            print(f"\n  Semester {sem}: {sem_subjects.count()} subjects")

            # Assign faculty to subjects (simplified - based on code patterns)
            subject_faculty_map = {}
            for subj in sem_subjects:
                # Try to find faculty who have this subject
                fac = subj.faculty_members.first()
                if fac:
                    subject_faculty_map[subj.code] = fac
                    print(f"    {subj.code} -> {fac.name}")
                else:
                    # Try to assign based on patterns
                    if any(
                        x in subj.code.upper() for x in ["ML", "AI", "DATA", "PREDICT"]
                    ):
                        fac = Faculty.objects.filter(name__icontains="Kashap").first()
                    elif any(
                        x in subj.code.upper()
                        for x in ["WEB", "JAVA", "PYTHON", "PROGRAM"]
                    ):
                        fac = Faculty.objects.filter(name__icontains="Chetna").first()
                    elif any(
                        x in subj.code.upper() for x in ["CYBER", "SECURITY", "HACK"]
                    ):
                        fac = Faculty.objects.filter(name__icontains="Bharat").first()
                    else:
                        fac = Faculty.objects.filter(status="Active").first()

                    if fac:
                        subject_faculty_map[subj.code] = fac
                        print(f"    {subj.code} -> {fac.name} (auto-assigned)")

            # Generate timetable slots for this semester
            created = generate_semester_timetable(
                course, sem, sem_subjects, subject_faculty_map
            )
            print(f"    Created {created} slots")
            total_created += created

    print("\n" + "=" * 80)
    print("TIMETABLE GENERATION COMPLETE")
    print("=" * 80)
    print(f"Total Slots Created: {total_created}")
    print(f"Total Slots in DB: {TimetableSlot.objects.count()}")


def generate_semester_timetable(course, semester, subjects, subject_faculty_map):
    """Generate timetable for a single semester"""

    DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    # Get time slots based on shift
    if course.shift == "MORNING":
        slot_filter = {"shift__code": "MORNING", "is_break": False, "is_active": True}
    else:
        slot_filter = {"shift__code": "NOON", "is_break": False, "is_active": True}

    slots = list(TimeSlot.objects.filter(**slot_filter).order_by("slot_order"))

    # Assign room based on course and semester
    if course.shift == "MORNING":
        room_map = {
            1: "C-101",
            2: "C-102",
            3: "C-103",
            4: "C-104",
            5: "C-105",
            6: "C-106",
            7: "C-107",
            8: "C-108",
        }
    else:
        room_map = {
            1: "A-101",
            2: "A-102",
            3: "A-103",
            4: "A-104",
            5: "A-105",
            6: "A-106",
            7: "A-107",
            8: "A-108",
        }

    room = get_room(room_map.get(semester, "A-101"))

    created = 0
    subject_list = list(subjects)
    if not subject_list:
        return 0

    subj_idx = 0
    for day in DAYS:
        day_type_filter = "saturday" if day == "Saturday" else "weekday"
        
        # Get slots for this day type and shift
        slots_query = TimeSlot.objects.filter(
            shift__code=course.shift,
            day_type__day_type=day_type_filter,
            is_break=False,
            is_active=True
        ).order_by("slot_order")
        
        day_slots = list(slots_query)
        
        # Limit to half day on Saturday
        if day == "Saturday":
            # Just take half the slots for a half day
            num_slots = max(1, len(day_slots) // 2)
            day_slots = day_slots[:num_slots]

        for slot in day_slots:
            subj = subject_list[subj_idx % len(subject_list)]
            subj_idx += 1
            fac = subject_faculty_map.get(subj.code)

            if fac:
                is_created = create_timetable_entry(
                    course,
                    semester,
                    day,
                    slot.slot_order,
                    slot.start_time.strftime("%H:%M"),
                    slot.end_time.strftime("%H:%M"),
                    subj,
                    fac,
                    room,
                )
                if is_created:
                    created += 1

    return created


if __name__ == "__main__":
    generate_all_timetables()
