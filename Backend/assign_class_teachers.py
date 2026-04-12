"""
Script to randomly assign class teachers to courses and semesters.
Each course+semester combination gets one class teacher.

Usage:
    python manage.py shell < Backend/assign_class_teachers.py
    or
    python Backend/assign_class_teachers.py
"""

import os
import sys
import django
import random

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ampics.settings")
django.setup()

from users.models import Faculty
from academics.models import Course, Subject
from django.db.models import Count


def assign_class_teachers():
    print("=" * 60)
    print("CLASS TEACHER ASSIGNMENT SCRIPT")
    print("=" * 60)

    # Get all courses
    courses = Course.objects.filter(status="Active")
    print(f"\nFound {courses.count()} active courses\n")

    # Get all semesters across all subjects
    semesters_by_course = {}
    for course in courses:
        semesters = (
            Subject.objects.filter(course=course)
            .values_list("semester", flat=True)
            .distinct()
        )
        semesters_by_course[course.course_id] = list(set(semesters))
        print(f"Course: {course.code} - {course.name}")
        print(f"  Semesters: {sorted(semesters_by_course[course.course_id])}")

    # Get all faculty members
    all_faculty = list(Faculty.objects.filter(status="Active"))
    print(f"\nFound {len(all_faculty)} active faculty members")

    if len(all_faculty) == 0:
        print("ERROR: No faculty members found!")
        return

    # Clear existing class teacher assignments
    Faculty.objects.filter(is_class_teacher=True).update(
        is_class_teacher=False, class_course=None, class_semester=None
    )
    print("\nCleared existing class teacher assignments\n")

    # Track assignments
    assignments = []
    faculty_assignments = {f.faculty_id: [] for f in all_faculty}

    # Assign class teachers for each course+semester
    for course in courses:
        course_semesters = semesters_by_course.get(course.course_id, [])

        for semester in course_semesters:
            # Filter faculty who teach this course (have subjects in this course+semester)
            eligible_faculty = [
                f
                for f in all_faculty
                if Subject.objects.filter(
                    course=course, semester=semester, faculty_members=f
                ).exists()
            ]

            # If no faculty teach this specific semester, get faculty who teach any subject in this course
            if not eligible_faculty:
                eligible_faculty = [
                    f
                    for f in all_faculty
                    if Subject.objects.filter(course=course, faculty_members=f).exists()
                ]

            # If still no eligible faculty, use any active faculty
            if not eligible_faculty:
                eligible_faculty = all_faculty
                print(
                    f"  WARNING: No subject-assigned faculty for {course.code} S{semester}, using random faculty"
                )

            # Randomly select one faculty
            selected = random.choice(eligible_faculty)

            # Assign as class teacher
            selected.is_class_teacher = True
            selected.class_course = course
            selected.class_semester = semester
            selected.save()

            assignments.append(
                {
                    "faculty": selected.name,
                    "employee_id": selected.employee_id,
                    "course": f"{course.code} - {course.name}",
                    "semester": semester,
                }
            )

            faculty_assignments[selected.faculty_id].append(
                f"{course.code} S{semester}"
            )

            print(
                f"ASSIGNED: {selected.name} ({selected.employee_id}) -> {course.code} S{semester}"
            )

    # Summary
    print("\n" + "=" * 60)
    print("ASSIGNMENT SUMMARY")
    print("=" * 60)

    print(f"\nTotal assignments: {len(assignments)}")

    # Faculty with most class teacher assignments
    faculty_with_assignments = [
        (f, len(assignments))
        for f, assignments in faculty_assignments.items()
        if assignments
    ]

    if faculty_with_assignments:
        print("\nFaculty class teacher counts:")
        for faculty_id, count in sorted(faculty_with_assignments, key=lambda x: -x[1]):
            faculty = Faculty.objects.get(faculty_id=faculty_id)
            print(f"  {faculty.name}: {count} class(es)")

    print("\n" + "=" * 60)
    print("CLASS TEACHER LIST")
    print("=" * 60)

    class_teachers = Faculty.objects.filter(is_class_teacher=True).select_related(
        "class_course"
    )
    for ct in class_teachers:
        print(f"  {ct.name} ({ct.employee_id})")
        print(
            f"    -> {ct.class_course.code if ct.class_course else 'N/A'} Semester {ct.class_semester}"
        )

    print("\nDone!")


if __name__ == "__main__":
    assign_class_teachers()
