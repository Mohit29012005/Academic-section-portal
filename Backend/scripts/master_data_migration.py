import sys
import os
import django
import pandas as pd
import numpy as np
from datetime import datetime

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampics.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import Student, Faculty
from academics.models import Course

User = get_user_model()

# Paths
FACULTY_XLSX = r'c:\Academic-module\Students_&_Faculty_All_DATA\Ganpat_University_Faculty.xlsx'
STUDENT_XLSX = r'c:\Academic-module\Students_&_Faculty_All_DATA\Ganpat_University_Students.xlsx'

# Passwords
STUDENT_PASSWORD = "student@123"
FACULTY_PASSWORD = "FCA@123"

# Course Mapping
COURSE_MAP = {
    'BSc(CA&IT)': 'BSC_CAANDI',
    'BSc(CA&IT)-CS': 'B.Sc.(CA&',
    'BSc(IT-IMS)': 'B.Sc.(IT-',
    'Dual(BCA-MCA)': 'DUALDEGREE',
    'MCA': 'MCA',
    'MSc(IT)': 'MSC(IT)1',
    'MSc(AI&ML)': 'MSC(AI&ML)',
    'MSc(IT)-CS': 'MSC(IT)C',
    'MSc(IT)-IMS': 'MSC(IT)-IM'
}

DESIGNATION_MAP = {
    'Head of Department': 'HOD',
    'Assistant Professor': 'Assistant Professor',
    'Associate Professor': 'Associate Professor',
    'Senior Lecturer': 'Lecturer',
    'Lab Instructor': 'Lecturer',
    'Lecturer': 'Lecturer',
    'Professor': 'Professor',
    'Principal': 'HOD'
}

def clean_val(val, default=""):
    if pd.isna(val) or val is None or str(val).lower() == 'nan':
        return default
    return str(val).strip()

def migrate():
    print("Cleaning up existing Student and Faculty data...")
    # Delete student and faculty profiles first to avoid O2O issues
    Student.objects.all().delete()
    Faculty.objects.all().delete()
    # Delete users with those roles
    User.objects.filter(role__in=['student', 'faculty']).delete()
    print("Cleanup complete.")

    # 1. Migrate Faculty
    print("\n--- Migrating Faculty ---")
    df_faculty = pd.read_excel(FACULTY_XLSX, sheet_name='Faculty Details', header=1)
    
    faculty_count = 0
    for index, row in df_faculty.iterrows():
        email = clean_val(row.get('Email (Official)'))
        if not email:
            email = clean_val(row.get('Email (Personal)'))
        
        if not email:
            continue
            
        employee_id = clean_val(row.get('Employee Code'))
        name = clean_val(row.get('Full Name'))
        
        # Create User
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'role': 'faculty'}
        )
        user.set_password(FACULTY_PASSWORD)
        user.role = 'faculty'
        user.save()
        
        # Designation mapping
        raw_designation = clean_val(row.get('Designation'))
        designation = DESIGNATION_MAP.get(raw_designation, 'Assistant Professor')
        
        # Faculty Profile
        dob = row.get('Date of Birth')
        if not isinstance(dob, (datetime, pd.Timestamp)):
            dob = None
            
        faculty, _ = Faculty.objects.update_or_create(
            user=user,
            defaults={
                'employee_id': employee_id,
                'name': name,
                'email': email,
                'gender': clean_val(row.get('Gender'), 'Male'),
                'date_of_birth': dob,
                'designation': designation,
                'department': 'Computer Applications', # Standardized as seen in Excel
                'qualification': clean_val(row.get('Qualification')),
                'experience_years': int(row.get('Experience (Yrs)', 0)) if pd.notnull(row.get('Experience (Yrs)')) else 0,
                'working_shift': clean_val(row.get('Shift'), 'Noon'),
                'phone': clean_val(row.get('Contact Number')),
                'address': clean_val(row.get('City')),
                'status': 'Active'
            }
        )
        faculty_count += 1
        if faculty_count % 10 == 0:
            print(f"Imported {faculty_count} faculty members...")

    print(f"Total faculty imported: {faculty_count}")

    # 2. Migrate Students
    print("\n--- Migrating Students ---")
    xl_students = pd.ExcelFile(STUDENT_XLSX)
    
    student_count = 0
    for sheet_name in xl_students.sheet_names:
        if sheet_name not in COURSE_MAP:
            print(f"Skipping unknown sheet: {sheet_name}")
            continue
            
        course_code = COURSE_MAP[sheet_name]
        try:
            course_obj = Course.objects.get(code=course_code)
        except Course.DoesNotExist:
            print(f"Course with code {course_code} not found! Checking if it exists with different code...")
            # Fallback search by name if code fails
            course_obj = Course.objects.filter(name__icontains=sheet_name.replace('BSc', 'B.Sc.').replace('MSc', 'M.Sc.')).first()
            if not course_obj:
                print(f"Course {sheet_name} still not found. skipping.")
                continue
            
        print(f"Processing sheet: {sheet_name} (mapped to course: {course_obj.name})")
        df_students = pd.read_excel(STUDENT_XLSX, sheet_name=sheet_name, header=1)
        
        for index, row in df_students.iterrows():
            email = clean_val(row.get('Email ID'))
            enrollment_no = clean_val(row.get('Roll Number'))
            
            if not email:
                 if enrollment_no:
                     email = f"{enrollment_no}@ganpatuniversity.ac.in"
                 else:
                     continue
            
            name = clean_val(row.get('Student Name'))
            
            # Create User
            user, created = User.objects.get_or_create(
                email=email,
                defaults={'role': 'student'}
            )
            user.set_password(STUDENT_PASSWORD)
            user.role = 'student'
            user.save()
            
            # Student Profile
            dob = row.get('Date of Birth')
            if not isinstance(dob, (datetime, pd.Timestamp)):
                dob = None
                
            student, _ = Student.objects.update_or_create(
                user=user,
                defaults={
                    'enrollment_no': enrollment_no,
                    'name': name,
                    'email': email,
                    'gender': clean_val(row.get('Gender'), 'Male'),
                    'date_of_birth': dob,
                    'father_name': clean_val(row.get("Father's Name")),
                    'phone': clean_val(row.get('Contact Number')),
                    'course': course_obj,
                    'semester': int(row.get('Semester', 1)) if pd.notnull(row.get('Semester')) else 1,
                    'current_semester': int(row.get('Semester', 1)) if pd.notnull(row.get('Semester')) else 1,
                    'total_semesters': course_obj.total_semesters,
                    'admission_year': int(row.get('Admission Year', 2024)) if pd.notnull(row.get('Admission Year')) else 2024,
                    'address': clean_val(row.get('City')),
                    'status': 'Active'
                }
            )
            student_count += 1
            if student_count % 100 == 0:
                print(f"Imported {student_count} students...")

    print(f"\nFinal count: Faculty={faculty_count}, Students={student_count}")
    print("Data Migration Successfully Completed!")

if __name__ == "__main__":
    migrate()
