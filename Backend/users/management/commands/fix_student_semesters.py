from django.core.management.base import BaseCommand
from users.models import Student
from academics.models import Course


class Command(BaseCommand):
    help = "Fix current_semester based on admission_year and current academic session"

    def handle(self, *args, **options):
        current_year = 2025
        current_session = "odd"

        if current_session == "odd":
            sem_indicator = 1
        else:
            sem_indicator = 2

        students = Student.objects.select_related("course").all()
        updated = 0

        for student in students:
            admission_year = student.admission_year or current_year
            total_semesters = student.total_semesters or 6

            years_passed = current_year - admission_year

            if years_passed < 0:
                expected_semester = 1
            else:
                expected_semester = (years_passed * 2) + sem_indicator

            if expected_semester > total_semesters:
                expected_semester = total_semesters

            old_sem = student.current_semester
            if old_sem != expected_semester:
                student.current_semester = expected_semester
                student.semester = expected_semester
                student.save(update_fields=["current_semester", "semester"])
                updated += 1

        self.stdout.write("Updated: %d students" % updated)

        self.stdout.write("")
        self.stdout.write("Students by admission year and semester:")
        for year in sorted(set(students.values_list("admission_year", flat=True))):
            sem_counts = {}
            for sem in range(1, 9):
                count = Student.objects.filter(
                    admission_year=year, current_semester=sem
                ).count()
                if count > 0:
                    sem_counts[sem] = count
            if sem_counts:
                self.stdout.write("  %d: %s" % (year, sem_counts))
