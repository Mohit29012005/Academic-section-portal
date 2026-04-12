from django.core.management.base import BaseCommand
from users.models import Student
from academics.models import SemesterResult


class Command(BaseCommand):
    help = "Update CGPA for all students"

    def handle(self, *args, **options):
        total = 0
        for student in Student.objects.all():
            results = SemesterResult.objects.filter(student=student).order_by(
                "semester"
            )

            total_sgpa = 0
            count = 0
            for result in results:
                if result.sgpa:
                    total_sgpa += float(result.sgpa)
                    count += 1

            if count > 0:
                cgpa = round(total_sgpa / count, 2)
                student.cgpa = cgpa
                student.save(update_fields=["cgpa"])
                total += 1

                if total <= 10 or total % 100 == 0:
                    self.stdout.write(
                        "%s: CGPA = %.2f (%d semesters)" % (student.name, cgpa, count)
                    )

        self.stdout.write(self.style.SUCCESS("\nDone! Updated %d students" % total))
