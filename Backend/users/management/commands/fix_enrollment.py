"""
Fix enrollment numbers based on admission year
Format: YYCCSSNNN
- YY = Year (23=2023, 24=2024, 25=2025, 26=2026)
- CC = Course Code
- SS = Semester
- NNN = Sequential Number
"""

from django.core.management.base import BaseCommand
from users.models import Student


class Command(BaseCommand):
    help = "Fix enrollment numbers based on admission year"

    COURSE_CODES = {
        "MCA": "34",
        "BCA": "30",
        "BTech": "39",
        "MTech": "37",
        "BSCIT": "32",
        "BSC-IT(IMS)": "31",
        "MSC-IT(IMS)": "35",
        "MSC-IT(CS)": "36",
        "MSCIT": "38",
        "MSC-IT(AI/ML)": "33",
        "BSCIT-CS": "29",
    }

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("ENROLLMENT NUMBER FIX")
        self.stdout.write("=" * 60)

        students = Student.objects.select_related("course").all()
        fixed = 0
        errors = 0

        for student in students:
            if not student.course:
                self.stdout.write(f"[WARN] {student.name} - No course assigned")
                continue

            course_code = self.COURSE_CODES.get(student.course.code, "00")
            admission_year = student.admission_year or 2025
            year_code = str(admission_year)[2:]  # 2023 -> 23

            current_sem = student.current_semester or 1

            # Build new enrollment number
            prefix = f"{year_code}{course_code}{current_sem:02d}"

            # Find next sequential number for this prefix
            existing = Student.objects.filter(enrollment_no__startswith=prefix).exclude(
                student_id=student.student_id
            )

            max_num = 0
            for s in existing:
                try:
                    num = int(s.enrollment_no[-3:])
                    if num > max_num:
                        max_num = num
                except:
                    pass

            new_enrollment = f"{prefix}{(max_num + 1):03d}"

            if student.enrollment_no != new_enrollment:
                old_enrollment = student.enrollment_no
                student.enrollment_no = new_enrollment
                student.save(update_fields=["enrollment_no"])
                fixed += 1
                self.stdout.write(f"[FIX] {old_enrollment} -> {new_enrollment}")
            else:
                self.stdout.write(f"[OK]  {student.enrollment_no} (unchanged)")

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(f"[SUMMARY]")
        self.stdout.write(f"  Fixed: {fixed}")
        self.stdout.write(f"  Errors: {errors}")
        self.stdout.write("=" * 60)
