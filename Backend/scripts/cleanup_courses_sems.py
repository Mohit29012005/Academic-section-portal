import os
import django
import sys

# Django Setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampics.settings')
sys.path.append(os.path.join(os.getcwd(), 'Backend'))
django.setup()

from academics.models import Course, Subject

def standardize():
    print("--- STARTING COURSE & SEMESTER STANDARDIZATION ---")
    
    # Mapping table (Old Name Snippet -> Standard Name)
    mapping = {
        'B.Sc. (CA&IT)': 'B.Sc. (CA&IT)',
        'BSC(IT)': 'B.Sc. (CA&IT)',
        'B.Sc. IT': 'B.Sc. (CA&IT)',
        'DATA SCIENCE': 'B.Sc. (CA&IT) - DS',
        'CYBER SECURITY': 'B.Sc. (CA&IT) - CS',
        'IMS': 'B.Sc. (IT-IMS)',
        'MSC-IT(AIML)': 'M.Sc. (AI & ML)',
        'ARTIFICIAL INTELLIGENCE': 'M.Sc. (AI & ML)',
        'DD(BCA-MCA)': 'Dual Degree (BCA-MCA)',
        'DUAL DEGREE': 'Dual Degree (BCA-MCA)',
        'MCA': 'MCA',
        'MSC(IT)': 'M.Sc. (IT)',
        'M.Sc. IT': 'M.Sc. (IT)',
        'MSC-IT(CS)': 'M.Sc. (IT) - CS',
        'MSC-IT(IMS)': 'M.Sc. (IT) - IMS'
    }

    import random
    courses = Course.objects.all()
    for course in courses:
        target_name = None
        for key, val in mapping.items():
            if key in course.name.upper() or course.name.upper() in key:
                target_name = val
                break
        
        if not target_name:
            target_name = course.name.strip()

        # Ensure unique code
        base_code = target_name.upper().replace(".", "").replace(" ", "").replace("-", "")[:8]
        target_code = base_code
        attempt = 1
        while Course.objects.filter(code=target_code).exclude(name=target_name).exists():
            target_code = f"{base_code[:7]}{attempt}"
            attempt += 1

        target_obj, created = Course.objects.get_or_create(
            name=target_name,
            defaults={
                'code': target_code,
                'duration': 3,
                'credits': 120,
                'total_semesters': 6,
                'shift': 'MORNING'
            }
        )
        
        if target_obj.pk != course.pk:
            print(f"Merging '{course.name}' -> '{target_name}'")
            # Move all subjects to the standard course
            Subject.objects.filter(course=course).update(course=target_obj)
            # Delete the redundant course
            course.delete()

    # Final Semester Cleanup: Ensure only 1-8 exist and are integers
    all_subjects = Subject.objects.all()
    for sub in all_subjects:
        if isinstance(sub.semester, str):
            # Extract number from "Sem 2" etc.
            match = "".join(filter(str.isdigit, sub.semester))
            if match:
                sub.semester = int(match)
                sub.save()
        elif sub.semester > 8:
            # Fix outliers
            sub.semester = 1
            sub.save()

    print("--- CLEANUP COMPLETED ---")

if __name__ == "__main__":
    standardize()
