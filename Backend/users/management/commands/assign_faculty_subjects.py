from django.core.management.base import BaseCommand
from users.models import Faculty
from academics.models import Subject


class Command(BaseCommand):
    help = "Assign subjects to faculty based on department matching"

    DEPARTMENT_COURSES = {
        "Computer Applications": ["MCA", "BCA", "MSCIT"],
        "Information Technology": ["MCA", "BCA", "BSCIT", "BTech"],
        "Computer Science": ["BCA", "BSCIT", "BSCIT-CS", "BTech", "MSC-IT(CS)"],
        "Cyber Security": ["MSCIT", "BCA"],
        "Information Management": ["BSC-IT(IMS)", "MSC-IT(IMS)"],
        "AI & ML": ["MSC-IT(AI/ML)", "BTech"],
    }

    def handle(self, *args, **options):
        total_assigned = 0

        for faculty in Faculty.objects.all():
            dept = faculty.department
            courses = self.DEPARTMENT_COURSES.get(dept, [])

            if not courses:
                self.stdout.write(
                    "%s: No courses for department %s" % (faculty.name, dept)
                )
                continue

            subjects = Subject.objects.filter(course__code__in=courses)
            count = 0

            for subject in subjects:
                faculty.subjects.add(subject)
                count += 1
                total_assigned += 1

            self.stdout.write("%s: Assigned %d subjects" % (faculty.name, count))

        self.stdout.write("")
        self.stdout.write("Total assignments: %d" % total_assigned)
        self.stdout.write(self.style.SUCCESS("Done!"))
