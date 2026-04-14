import os
import django
import sys
import pandas as pd

# Django Setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampics.settings')
sys.path.append(os.path.join(os.getcwd(), 'Backend'))
django.setup()

from academics.models import Course, Subject

def final_sync():
    print("--- FINAL SYNC WITH EXCEL COURSES ---")
    
    # 1. Official Mapping from Excel
    excel_to_standard = {
        'BSC(IT)': 'B.Sc. (CA&IT)',
        'BSC-IT(CS)': 'B.Sc. (CA&IT) - CS',
        'BSC-IT(IMS)': 'B.Sc. (IT-IMS)',
        'DD(BCA-MCA)': 'Dual Degree (BCA-MCA)',
        'MCA': 'MCA',
        'MSC(IT)': 'M.Sc. (IT)',
        'MSC-IT(AIML)': 'M.Sc. (AI & ML)',
        'MSC-IT(CS)': 'M.Sc. (IT) - CS',
        'MSC-IT(IMS)': 'M.Sc. (IT) - IMS'
    }

    # 2. Extract unique courses from Excel (clean whitespace and Sem rows)
    df = pd.read_excel('PYQ_ALL_COURSES_DATA/Ganpat_University_All_Courses.xlsx')
    raw_courses = [str(c).strip() for c in df['Course'].unique() if pd.notna(c)]
    
    # Filter only actual courses listed in our standard mapping
    official_courses = []
    for rc in raw_courses:
        if rc.upper() in [k.upper() for k in excel_to_standard.keys()]:
            official_courses.append(rc)
    
    print(f"Detected Official Courses for Sync: {official_courses}")

    # 3. Create/Ensure Official Courses exist
    final_objs = {}
    for rc in official_courses:
        std_name = excel_to_standard[rc]
        obj, _ = Course.objects.get_or_create(
            name=std_name,
            defaults={
                'code': std_name.upper().replace(" ", "").replace(".", "").replace("&", "")[:10],
                'duration': 5 if 'Dual' in std_name else 3 if 'B.Sc' in std_name else 2,
                'total_semesters': 10 if 'Dual' in std_name else 6 if 'B.Sc' in std_name else 4
            }
        )
        final_objs[rc.upper()] = obj

    # 4. Map ALL Subjects to these 9 courses and DELETE others
    all_courses = Course.objects.all()
    for course in all_courses:
        if course.name not in excel_to_standard.values():
            # Try to find a match to move subjects
            matched_std = None
            for rc, std in excel_to_standard.items():
                if rc in course.name.upper() or std.upper() in course.name.upper():
                    matched_std = std
                    break
            
            if matched_std:
                target_obj = Course.objects.get(name=matched_std)
                print(f"Moving Subjects from '{course.name}' -> '{matched_std}'")
                Subject.objects.filter(course=course).update(course=target_obj)
            
            # Delete redundant course
            print(f"Deleting leftover course: {course.name}")
            course.delete()

    print("--- SYNC COMPLETED: 9 UNIQUE COURSES REMAIN ---")

if __name__ == "__main__":
    final_sync()
