import sys
import os
import django
import pandas as pd

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampics.settings')
django.setup()

from users.models import Faculty
from academics.models import Subject

FACULTY_XLSX = r'c:\Academic-module\Students_&_Faculty_All_DATA\Ganpat_University_Faculty.xlsx'

def migrate_assignments():
    print("\n--- Migrating Faculty Course Assignments ---")
    df_assignments = pd.read_excel(FACULTY_XLSX, sheet_name='Course Assignments', header=1)
    
    assignment_count = 0
    not_found_faculty = set()
    not_found_subjects = set()
    
    # First clear existing assignments if any
    for f in Faculty.objects.all():
        f.subjects.clear()
        
    for index, row in df_assignments.iterrows():
        employee_id = str(row.get('Faculty ID', '')).strip()
        subject_name = str(row.get('Subject', '')).strip()
        course_name = str(row.get('Course', '')).strip()
        semester = row.get('Semester')
        
        if not employee_id or not subject_name or subject_name == 'nan':
            continue
            
        try:
            faculty = Faculty.objects.get(employee_id=employee_id)
        except Faculty.DoesNotExist:
            not_found_faculty.add(employee_id)
            continue
            
        # Find subject. 
        # Exact match preferred
        subject = Subject.objects.filter(name__iexact=subject_name).first()
        if not subject:
            # Try fuzzy match
            subject = Subject.objects.filter(name__icontains=subject_name).first()
            
        if subject:
            faculty.subjects.add(subject)
            assignment_count += 1
        else:
            not_found_subjects.add(f"{subject_name} ({course_name} S{semester})")

    print(f"Total assignments processed: {assignment_count}")
    if not_found_faculty:
        print(f"Note: Faculty IDs from assignment sheet NOT found in profiles: {sorted(list(not_found_faculty))}")
    if not_found_subjects:
        print(f"Warning: {len(not_found_subjects)} unique Subjects not found in DB! List: {sorted(list(not_found_subjects))[:20]}...")

if __name__ == "__main__":
    migrate_assignments()
