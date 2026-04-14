import sys
import os
import django
import pandas as pd

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampics.settings')
django.setup()

from users.models import Faculty, User

FACULTY_XLSX = r'c:\Academic-module\Students_&_Faculty_All_DATA\Ganpat_University_Faculty.xlsx'

def fix_faculty_ids():
    print("\n--- Fixing Faculty IDs ---")
    df_faculty = pd.read_excel(FACULTY_XLSX, sheet_name='Faculty Details', header=1)
    
    fixed_count = 0
    for index, row in df_faculty.iterrows():
        email = str(row.get('Email (Official)', '')).strip()
        if not email or email == 'nan':
            email = str(row.get('Email (Personal)', '')).strip()
        
        if not email : continue
        
        faculty_id = str(row.get('Faculty ID', '')).strip()
        
        try:
            faculty = Faculty.objects.get(email=email)
            faculty.employee_id = faculty_id
            faculty.save()
            fixed_count += 1
        except Faculty.DoesNotExist:
            print(f"Faculty with email {email} not found in DB.")

    print(f"Fixed {fixed_count} faculty IDs.")

if __name__ == "__main__":
    fix_faculty_ids()
