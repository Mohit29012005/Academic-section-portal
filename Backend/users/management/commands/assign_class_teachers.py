"""
Management command to assign 9 class teachers — one per course.
Run: python manage.py assign_class_teachers
"""
from django.core.management.base import BaseCommand
from users.models import Faculty
from academics.models import Course


# ── Chosen Class Teachers ────────────────────────────────────────────────────
ASSIGNMENTS = {
    "BSC_CAANDI": "Jyotindra Dharwa",
    "B.Sc.(CA&": "Hiral Prajapati",
    "B.Sc.(IT-": "Pooja Pancholi",
    "MCA": "Jagruti Patel",
    "MSC(IT)C": "Narendra Patel",
    "MSC(IT)1": "Kashyap Patel",
    "MSC(IT)-IM": "Meghna Patel",
    "MSC(AI&ML)": "Jigar Patel",
    "DUALDEGREE": "Bhavesh Patel",
}


class Command(BaseCommand):
    help = "Assign 9 class teachers — one per course."

    def handle(self, *args, **options):
        # Reset all existing class teachers first
        Faculty.objects.filter(is_class_teacher=True).update(
            is_class_teacher=False, class_course=None
        )
        self.stdout.write("Reset all existing class teacher assignments.")

        assigned = 0
        for course_code, faculty_name in ASSIGNMENTS.items():
            try:
                course = Course.objects.get(code=course_code)
            except Course.DoesNotExist:
                self.stderr.write(
                    self.style.WARNING(f"  Course '{course_code}' not found. Skipping.")
                )
                continue

            try:
                faculty = Faculty.objects.get(name=faculty_name)
            except Faculty.DoesNotExist:
                self.stderr.write(
                    self.style.WARNING(
                        f"  Faculty '{faculty_name}' not found. Skipping."
                    )
                )
                continue

            faculty.is_class_teacher = True
            faculty.class_course = course
            faculty.save(update_fields=["is_class_teacher", "class_course"])
            assigned += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f"  [OK] {faculty_name} -> {course.name} ({course_code})"
                )
            )

        self.stdout.write(
            self.style.SUCCESS(f"\nDone. {assigned}/{len(ASSIGNMENTS)} class teachers assigned.")
        )
