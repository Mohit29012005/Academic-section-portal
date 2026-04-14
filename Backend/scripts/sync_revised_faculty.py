import sys
import os
import django
import pandas as pd
from datetime import datetime

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampics.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import Faculty
from academics.models import Subject, Course

User = get_user_model()

# Paths
FACULTY_XLSX = r'c:\Academic-module\Students_&_Faculty_All_DATA\Ganpat_University_Faculty_Revised (1).xlsx'
FACULTY_PASSWORD = "FCA@123"

DESIGNATION_MAP = {
    'Head of Department': 'HOD',
    'Assistant Professor': 'Assistant Professor',
    'Associate Professor': 'Associate Professor',
    'Senior Lecturer': 'Lecturer',
    'Lab Instructor': 'Lecturer',
    'Lecturer': 'Lecturer',
    'Professor': 'Professor'
}

# Standardized mapping for Excel names to DB codes
COURSE_NAME_TO_CODE = {
    'MCA': 'MCA',
    'M.Sc. (IT)': 'MSC(IT)1',
    'M.Sc. (AI & ML)': 'MSC(AI&ML)',
    'M.Sc. (IT) - CS': 'MSC(IT)C',
    'M.Sc. (IT) - IMS': 'MSC(IT)-IM',
    'B.Sc. (CA&IT)': 'BSC_CAANDI',
    'B.Sc. (CA&IT) - CS': 'B.Sc.(CA&',
    'B.Sc. (IT-IMS)': 'B.Sc.(IT-',
    'Dual Degree (BCA-MCA)': 'DUALDEGREE'
}

def clean_val(val, default=""):
    if pd.isna(val) or val is None or str(val).lower() == 'nan':
        return default
    return str(val).strip()

def sync_faculty():
    print("--- Synchronizing Revised Faculty Data ---")
    
    # 1. Clean up existing Faculty
    print("Deleting old faculty records...")
    Faculty.objects.all().delete()
    User.objects.filter(role='faculty').delete()
    
    # 2. Import Faculty Profiles
    print("Importing new faculty profiles...")
    df_faculty = pd.read_excel(FACULTY_XLSX, sheet_name='Faculty Details', header=1)
    
    faculty_count = 0
    for index, row in df_faculty.iterrows():
        email = clean_val(row.get('Email (Official)'))
        if not email:
            email = clean_val(row.get('Email (Personal)'))
        
        if not email:
            continue
            
        faculty_id = clean_val(row.get('Faculty ID')) # GNU-FCA format
        name = clean_val(row.get('Full Name'))
        
        # Create User
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'role': 'faculty'}
        )
        user.set_password(FACULTY_PASSWORD)
        user.role = 'faculty'
        user.save()
        
        # Profile fields
        raw_designation = clean_val(row.get('Designation'))
        designation = DESIGNATION_MAP.get(raw_designation, 'Assistant Professor')
        dob = row.get('Date of Birth')
        if not isinstance(dob, (datetime, pd.Timestamp)):
            dob = None

        # Faculty Profile
        Faculty.objects.update_or_create(
            user=user,
            defaults={
                'employee_id': faculty_id,
                'name': name,
                'email': email,
                'gender': clean_val(row.get('Gender'), 'Male'),
                'date_of_birth': dob,
                'designation': designation,
                'department': 'Computer Applications',
                'qualification': clean_val(row.get('Qualification')),
                'experience_years': int(row.get('Experience (Yrs)', 0)) if pd.notnull(row.get('Experience (Yrs)')) else 0,
                'working_shift': clean_val(row.get('Shift'), 'Noon'),
                'phone': clean_val(row.get('Contact Number')),
                'address': clean_val(row.get('City')),
                'status': 'Active'
            }
        )
        faculty_count += 1
        print(f"Imported Faculty: {name} ({faculty_id})")

    print(f"Total faculty imported: {faculty_count}")

    # 3. Import Assignments
    print("\n--- Migrating Faculty Course Assignments (Improved) ---")
    df_assignments = pd.read_excel(FACULTY_XLSX, sheet_name='Course Assignments', header=1)
    
    assignment_count = 0
    for index, row in df_assignments.iterrows():
        f_id = clean_val(row.get('Faculty ID'))
        subject_name = clean_val(row.get('Subject'))
        course_string = clean_val(row.get('Courses'))
        semester = row.get('Semester')
        
        if not f_id or not subject_name:
            continue
            
        try:
            faculty = Faculty.objects.get(employee_id=f_id)
        except Faculty.DoesNotExist:
            continue
            
        # Parse courses
        courses_to_check = [c.strip() for c in course_string.split(',')] if course_string else []
        
        found_subject = None
        
        # Attempt to find existing subject in any of the courses
        for c_name in courses_to_check:
            c_code = COURSE_NAME_TO_CODE.get(c_name)
            if not c_code: continue
            
            # Search logic: exact or icontains within this course
            found_subject = Subject.objects.filter(
                course__code=c_code,
                semester=semester,
                name__icontains=subject_name
            ).first()
            if found_subject: break
            
            # Second attempt: just by name in this course
            found_subject = Subject.objects.filter(
                course__code=c_code,
                name__icontains=subject_name
            ).first()
            if found_subject: break

        # If still not found, search globally by name
        if not found_subject:
            found_subject = Subject.objects.filter(name__icontains=subject_name).first()

        # If STILL not found, CREATE IT in the first valid course
        if not found_subject and courses_to_check:
            first_course_name = courses_to_check[0]
            first_course_code = COURSE_NAME_TO_CODE.get(first_course_name)
            if first_course_code:
                course_obj = Course.objects.filter(code=first_course_code).first()
                if course_obj:
                    # Create subject
                    found_subject = Subject.objects.create(
                        code=f"SUB-{subject_name[:5].upper()}-{index}",
                        name=subject_name,
                        course=course_obj,
                        semester=int(semester) if pd.notnull(semester) else 1
                    )
                    print(f"Created missing subject: {subject_name} for {course_obj.name}")

        if found_subject:
            faculty.subjects.add(found_subject)
            assignment_count += 1
            if assignment_count % 10 == 0:
                print(f"Assigned {assignment_count} subjects...")
        else:
            print(f"Warning: Could not assign or create subject '{subject_name}' for faculty {f_id}")

    print(f"Total assignments processed: {assignment_count}")
    print("\nRevised Faculty Migration Successfully Completed!")

if __name__ == "__main__":
    sync_faculty()
