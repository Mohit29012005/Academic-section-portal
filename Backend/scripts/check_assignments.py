import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampics.settings')
django.setup()

from users.models import Faculty
from academics.models import Subject, Course

def check_assignments():
    faculties = Faculty.objects.filter(status='Active').exclude(name__icontains='TBA')
    print(f"Total Active Faculty: {faculties.count()}")
    
    for f in faculties:
        subjects = f.subjects.all()
        print(f"Faculty: {f.name} ({f.employee_id}) | Subjects: {subjects.count()}")
        for s in subjects:
            print(f"  - {s.code}: {s.name} ({s.course.code} S{s.semester})")

    subjects_no_faculty = Subject.objects.filter(faculty_members=None)
    print(f"\nSubjects with NO Faculty assigned: {subjects_no_faculty.count()}")
    for s in subjects_no_faculty:
        print(f"  - {s.code}: {s.name} ({s.course.code} S{s.semester})")

if __name__ == "__main__":
    check_assignments()
