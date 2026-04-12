"""
Script to assign faculty to shifts based on their assigned subjects' courses
Morning Shift: BTECH + Masters teachers
Noon Shift: BCA + BSc teachers
"""

import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ampics.settings")
django.setup()

from users.models import Faculty
from academics.models import Course


def assign_faculty_shifts():
    print("=" * 70)
    print("ASSIGNING FACULTY TO SHIFTS")
    print("=" * 70)

    # Define shift assignments
    morning_courses = [
        "BTECH-IT",
        "BTECH-CSE",
        "MCA",
        "MSC-IT",
        "MSC-IMS",
        "MSC-CYBER",
        "MSC-AIML",
    ]
    noon_courses = ["BCA", "BSC-IT", "BSC-IMS", "BSC-CYBER", "BSC-AIML"]

    print("\nShift Assignments:")
    print(f"  Morning: {morning_courses}")
    print(f"  Noon: {noon_courses}")
    print()

    # Get all faculty
    faculty_list = Faculty.objects.filter(status="Active")
    print(f"Total Active Faculty: {faculty_list.count()}")

    assigned_morning = 0
    assigned_noon = 0
    assigned_full = 0

    for faculty in faculty_list:
        # Get faculty's assigned subjects
        subjects = faculty.subjects.all()

        if not subjects.exists():
            # No subjects assigned - check class teacher
            if faculty.class_course:
                course_code = faculty.class_course.code
                if course_code in morning_courses:
                    faculty.working_shift = "Morning"
                    assigned_morning += 1
                else:
                    faculty.working_shift = "Noon"
                    assigned_noon += 1
                faculty.save()
            continue

        # Check which courses faculty teaches
        course_codes = set()
        for subject in subjects:
            course_codes.add(subject.course.code)

        # Determine shift
        morning_teaching = any(c in morning_courses for c in course_codes)
        noon_teaching = any(c in noon_courses for c in course_codes)

        if morning_teaching and noon_teaching:
            # Faculty teaches both shifts
            faculty.working_shift = "Full Day"
            assigned_full += 1
            print(f"  [FULL DAY] {faculty.name} -> {', '.join(sorted(course_codes))}")
        elif morning_teaching:
            faculty.working_shift = "Morning"
            assigned_morning += 1
            print(f"  [MORNING]  {faculty.name} -> {', '.join(sorted(course_codes))}")
        elif noon_teaching:
            faculty.working_shift = "Noon"
            assigned_noon += 1
            print(f"  [NOON]     {faculty.name} -> {', '.join(sorted(course_codes))}")
        else:
            print(f"  [UNKNOWN]  {faculty.name} -> {', '.join(sorted(course_codes))}")

        faculty.save()

    print("\n" + "=" * 70)
    print("ASSIGNMENT SUMMARY")
    print("=" * 70)
    print(f"  Morning Shift Faculty: {assigned_morning}")
    print(f"  Noon Shift Faculty:   {assigned_noon}")
    print(f"  Full Day Faculty:     {assigned_full}")
    print(f"  Total:               {assigned_morning + assigned_noon + assigned_full}")

    # Show faculty by shift
    print("\n" + "=" * 70)
    print("FACULTY BY SHIFT")
    print("=" * 70)

    for shift in ["Morning", "Noon", "Full Day"]:
        faculty_in_shift = Faculty.objects.filter(status="Active", working_shift=shift)
        print(f"\n{shift} ({faculty_in_shift.count()}):")
        for f in faculty_in_shift:
            print(f"  - {f.name} ({f.employee_id})")

    print("\nDone!")


if __name__ == "__main__":
    assign_faculty_shifts()
