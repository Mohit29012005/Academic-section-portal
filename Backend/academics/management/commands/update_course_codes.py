from django.core.management.base import BaseCommand
from academics.models import Course


class Command(BaseCommand):
    help = "Update course codes and names"

    def handle(self, *args, **options):
        updates = [
            ("BSCIT", "BSC-IT", "BSc(IT)"),
            ("BSCIT-IMS", "BSC-IT(IMS)", "BSc-IT(IMS)"),
            ("BSCIT-CS", "BSC-IT(CS)", "BSc-IT(CS)"),
            ("MSCIT-IMS", "MSC-IT(IMS)", "MSc-IT(IMS)"),
            ("MSCIT-CS", "MSC-IT(CS)", "MSc-IT(CS)"),
            ("MSCIT", "MSc-IT", "MSc(IT)"),
            ("MSCIT-AIML", "MSC-IT(AI/ML)", "MSc-IT(AI/ML)"),
        ]

        for old_code, new_code, new_name in updates:
            try:
                course = Course.objects.get(code=old_code)
                course.code = new_code
                course.name = new_name
                course.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Updated: {old_code} -> {new_code} | {new_name}"
                    )
                )
            except Course.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"Not found: {old_code}"))

        self.stdout.write(self.style.SUCCESS("\nAll courses after update:"))
        for c in Course.objects.all().order_by("code"):
            self.stdout.write(f"  {c.code} - {c.name}")
