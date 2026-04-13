import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import Student
from academics.models import Course

print("--- STUDENT COUNTS PER SEMESTER ---")
for course in Course.objects.all():
    print(f"\nCourse: {course.name}")
    for sem in range(1, course.total_semesters + 1):
        count = Student.objects.filter(course=course, semester=sem).count()
        print(f"  Sem {sem}: {count} students")
