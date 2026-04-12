from django.core.management.base import BaseCommand
from users.models import Faculty
from academics.models import Subject

FACULTY_SUBJECTS = {
    "Jignesh Patel": [
        "U33A1OOP",
        "U33A2DFS",
        "U34A1GUI",
        "MCA101",
        "MCA102",
        "MCA201",
        "MCA202",
    ],
    "Bhavesh Patel": [
        "U33A3DBM",
        "U33A4SAD",
        "U34A3ADB",
        "MCA103",
        "MCA203",
        "MCA301",
        "MCA302",
    ],
    "Jagruti Patel": [
        "U35A1AWT",
        "U35A2OSY",
        "U36A1OST",
        "MCA201",
        "MCA202",
        "MCA203",
        "MCA204",
    ],
    "Hiral Prajapati": [
        "U36A1MDA",
        "U36A2CLD",
        "U36A3PRJ",
        "MCA302",
        "MCA303",
        "MCA304",
        "MCA401",
    ],
    "Bharat Patel": [
        "U35A3ESC",
        "U35A4FAD",
        "MCA401",
        "MCA402",
        "MCA403",
        "BSCIT301",
        "BSCIT302",
    ],
    "Kashyap Patel": [
        "MCA301",
        "MCA302",
        "MCA303",
        "MCA304",
        "MCA401",
        "MCA402",
        "BSCIT401",
        "BSCIT501",
    ],
    "Chetna Patel": ["MSC101", "MSC102", "MSC103", "MSC201", "MSC202", "MSC301"],
    "Meghna Patel": [
        "BSCIT101",
        "BSCIT102",
        "BSCIT103",
        "BSCIT201",
        "BSCIT202",
        "BSCIT203",
        "MSC103",
        "MSC203",
    ],
    "Jyotindra Dharva": [
        "U31A4COA",
        "U32A4DM",
        "U33A5NT1",
        "U33B6EDM",
        "MCA104",
        "MCA204",
        "CSE303",
        "CSE403",
    ],
}


class Command(BaseCommand):
    help = "Assign new subjects to faculty"

    def handle(self, *args, **options):
        self.stdout.write("Re-assigning subjects to faculty...\n")

        total_assignments = 0

        for faculty_name, subject_codes in FACULTY_SUBJECTS.items():
            try:
                faculty = Faculty.objects.get(name=faculty_name)
                faculty.subjects.clear()
            except Faculty.DoesNotExist:
                self.stdout.write(f"Faculty not found: {faculty_name}")
                continue

            for code in subject_codes:
                try:
                    subject = Subject.objects.get(code=code)
                    faculty.subjects.add(subject)
                    total_assignments += 1
                except Subject.DoesNotExist:
                    pass

        self.stdout.write(
            self.style.SUCCESS(f"\nTotal assignments: {total_assignments}")
        )

        for faculty in Faculty.objects.all():
            self.stdout.write(f"{faculty.name}: {faculty.subjects.count()} subjects")
