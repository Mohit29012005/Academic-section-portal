from django.core.management.base import BaseCommand
from academics.models import Course


class Command(BaseCommand):
    help = "Fix course names and codes"

    def handle(self, *args, **options):
        fixes = {
            "BCA": {"name": "Bachelor of Computer Applications", "code": "BCA"},
            "BSCIT": {"name": "BSc(IT)", "code": "BSCIT"},
            "BSCIT-CS": {"name": "BSc-IT(CS)", "code": "BSCIT-CS"},
            "BSC-IT(IMS)": {"name": "BSc-IT(IMS)", "code": "BSCIT-IMS"},
            "BTech": {"name": "Bachelor of Technology in IT", "code": "BTech"},
            "MCA": {"name": "Master of Computer Applications", "code": "MCA"},
            "MTech": {
                "name": "Master of Technology in Computer Science",
                "code": "MTech",
            },
            "MSCIT": {"name": "MSc(IT)", "code": "MSCIT"},
            "MSC-IT(IMS)": {"name": "MSc-IT(IMS)", "code": "MSCIT-IMS"},
            "MSC-IT(CS)": {"name": "MSc-IT(CS)", "code": "MSCIT-CS"},
            "MSC-IT(AI/ML)": {"name": "MSc-IT(AI/ML)", "code": "MSCIT-AIML"},
        }

        for course in Course.objects.all():
            old_name = course.name
            old_code = course.code

            if old_code in fixes:
                course.name = fixes[old_code]["name"]
                course.code = fixes[old_code]["code"]
                course.save(update_fields=["name", "code"])
                self.stdout.write(
                    "%s -> %s (%s)" % (old_name, course.name, course.code)
                )

        self.stdout.write(self.style.SUCCESS("\nDone! Course names fixed."))
