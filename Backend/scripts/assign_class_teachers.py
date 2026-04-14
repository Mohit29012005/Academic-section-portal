import os
import django
import random
import sys

# Setup django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampics.settings')
django.setup()

from academics.models import Course
from users.models import Faculty

def assign_class_teachers():
    print("Assigning Class Teachers (1 per Course & Semester)...")
    
    # Get all active faculties
    all_faculties = list(Faculty.objects.filter(status="Active").order_by('?'))
    faculty_index = 0
    total_faculties = len(all_faculties)
    
    if total_faculties == 0:
        print("Error: No active faculties found.")
        return

    # Clear existing class teacher status to avoid constraint issues during bulk re-assignment
    Faculty.objects.all().update(
        is_class_teacher=False, 
        class_course=None, 
        class_semester=None
    )

    courses = Course.objects.all()
    assignments = 0
    
    for course in courses:
        for sem in range(1, course.total_semesters + 1):
            if faculty_index >= total_faculties:
                # Reuse faculties if we run out, but we need to find 
                # those not assigned to THIS specific course/sem (redundant given 1 per course/sem rule)
                # But actually, one faculty can only be a class teacher for ONE thing.
                # So if we run out of faculties, some classes won't have teachers or we stop.
                print(f"Warning: Ran out of unique faculties at {course.code} S{sem}")
                break
            
            faculty = all_faculties[faculty_index]
            faculty.is_class_teacher = True
            faculty.class_course = course
            faculty.class_semester = sem
            
            try:
                faculty.save()
                print(f"[OK] {faculty.name} -> {course.code} Semester {sem}")
                assignments += 1
                faculty_index += 1
            except Exception as e:
                print(f"[ERR] Failed to assign {faculty.name} to {course.code} S{sem}: {e}")
                # Try next faculty for the same sem
                faculty_index += 1
                continue
                
    print(f"\nSuccessfully assigned {assignments} Class Teachers.")

if __name__ == "__main__":
    assign_class_teachers()
