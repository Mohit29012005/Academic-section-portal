"""
Management command to update subjects from Ganpat University Excel file.
Replaces generic "Core X.Y" subject names with real subject names and codes.
Also updates course codes to match the official format.

Usage:
    python manage.py update_subjects_from_excel
"""
import os
from django.core.management.base import BaseCommand
from academics.models import Subject, Course


# Mapping from Excel course names to DB course names
EXCEL_TO_DB_COURSE = {
    "BSC(IT)": "B.Sc. (CA&IT)",
    "BSC-IT(CS)": "B.Sc. (CA&IT) - CS",
    "BSC-IT(IMS)": "B.Sc. (IT-IMS)",
    "MCA": "MCA",
    "MSC(IT)": "M.Sc. (IT)",
    "MSC-IT(CS)": "M.Sc. (IT) - CS",
    "MSC-IT(IMS)": "M.Sc. (IT) - IMS",
    "MSC-IT(AIML)": "M.Sc. (AI & ML)",
    "DD(BCA-MCA)": "Dual Degree (BCA-MCA)",
}

# Updated course codes  
COURSE_CODE_UPDATE = {
    "B.Sc. (CA&IT)": "BSC-IT",
    "B.Sc. (CA&IT) - CS": "BSC-IT-CS",
    "B.Sc. (IT-IMS)": "BSC-IT-IMS",
    "MCA": "MCA",
    "M.Sc. (IT)": "MSC-IT",
    "M.Sc. (IT) - CS": "MSC-IT-CS",
    "M.Sc. (IT) - IMS": "MSC-IT-IMS",
    "M.Sc. (AI & ML)": "MSC-AIML",
    "Dual Degree (BCA-MCA)": "DD-BCA-MCA",
}


class Command(BaseCommand):
    help = "Update subjects from Ganpat University Excel file"

    def handle(self, *args, **options):
        try:
            import openpyxl
        except ImportError:
            self.stderr.write("openpyxl not installed. Run: pip install openpyxl")
            return

        excel_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))),
            "PYQ_ALL_COURSES_DATA",
            "Ganpat_University_All_Courses.xlsx",
        )

        if not os.path.exists(excel_path):
            self.stderr.write(f"Excel file not found at: {excel_path}")
            return

        wb = openpyxl.load_workbook(excel_path)
        ws = wb.active

        # Parse Excel into structured data
        excel_subjects = []  # (course_name, semester_num, subject_name, subject_code)
        for row in ws.iter_rows(min_row=2, values_only=True):
            course, sem, subj_name, subj_code = row
            if course and sem and subj_name and subj_code:
                course = course.strip()
                sem_str = sem.strip()  # e.g. "Sem 1"
                try:
                    sem_num = int(sem_str.replace("Sem", "").strip())
                except ValueError:
                    continue
                excel_subjects.append((course, sem_num, subj_name.strip(), subj_code.strip()))

        self.stdout.write(f"Parsed {len(excel_subjects)} subjects from Excel")

        # Step 1: Update course codes
        updated_courses = 0
        for course in Course.objects.all():
            new_code = COURSE_CODE_UPDATE.get(course.name)
            if new_code and course.code != new_code:
                old_code = course.code
                course.code = new_code
                course.save(update_fields=["code"])
                updated_courses += 1
                self.stdout.write(f"  Course code: {old_code} -> {new_code} ({course.name})")
        self.stdout.write(self.style.SUCCESS(f"Updated {updated_courses} course codes"))

        # Step 2: Build a lookup: (db_course_name, semester) -> list of excel subjects
        course_sem_subjects = {}
        for excel_course, sem_num, subj_name, subj_code in excel_subjects:
            db_course_name = EXCEL_TO_DB_COURSE.get(excel_course)
            if not db_course_name:
                self.stdout.write(self.style.WARNING(f"  No mapping for Excel course: {excel_course}"))
                continue
            key = (db_course_name, sem_num)
            if key not in course_sem_subjects:
                course_sem_subjects[key] = []
            course_sem_subjects[key].append((subj_name, subj_code))

        # Step 3: Delete all existing generic subjects and recreate from Excel
        old_count = Subject.objects.count()
        
        # For each course-semester combo, update or create subjects
        updated = 0
        created = 0
        for (db_course_name, sem_num), subjects_list in sorted(course_sem_subjects.items()):
            try:
                course = Course.objects.get(name=db_course_name)
            except Course.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"  Course not found in DB: {db_course_name}"))
                continue

            # Get existing subjects for this course-semester
            existing = list(Subject.objects.filter(course=course, semester=sem_num).order_by("code"))
            
            for idx, (subj_name, subj_code) in enumerate(subjects_list):
                if idx < len(existing):
                    # Update existing subject
                    subj = existing[idx]
                    subj.name = subj_name
                    subj.code = subj_code
                    subj.save(update_fields=["name", "code"])
                    updated += 1
                else:
                    # Create new subject
                    Subject.objects.create(
                        name=subj_name,
                        code=subj_code,
                        course=course,
                        semester=sem_num,
                        credits=4,
                        campus_branch="Ahmedabad",
                    )
                    created += 1

            # Remove extra subjects that exceed the Excel count
            if len(existing) > len(subjects_list):
                extras = existing[len(subjects_list):]
                for extra in extras:
                    extra.delete()
                self.stdout.write(f"  Removed {len(extras)} extra subjects from {db_course_name} Sem {sem_num}")

        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Updated: {updated}, Created: {created}"
            f"\nTotal subjects now: {Subject.objects.count()}"
        ))
        
        # Print summary
        self.stdout.write("\n=== Subject Summary ===")
        for course in Course.objects.all().order_by("name"):
            subs = Subject.objects.filter(course=course).order_by("semester", "code")
            self.stdout.write(f"\n{course.code} ({course.name}): {subs.count()} subjects")
            for s in subs[:3]:
                self.stdout.write(f"  Sem {s.semester}: [{s.code}] {s.name}")
            if subs.count() > 3:
                self.stdout.write(f"  ... and {subs.count() - 3} more")
