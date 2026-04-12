from django.core.management.base import BaseCommand
from users.models import Student


class Command(BaseCommand):
    help = "Fix all enrollment numbers to be unique - format: YYCCSSNNN"

    COURSE_CODES = {
        "BCA": "30",
        "BSC-IT": "32",
        "BSC-IMS": "31",
        "MSC-IT": "38",
        "MSC-IMS": "35",
        "MSC-CYBER": "36",
        "MSC-AIML": "33",
        "BSC-CYBER": "32",
        "BSC-AIML": "32",
        "BTECH-IT": "39",
        "BTECH-CSE": "39",
        "MCA": "34",
    }

    def handle(self, *args, **options):
        students = Student.objects.select_related("course").order_by(
            "admission_year", "course__code", "current_semester", "student_id"
        )

        counter = {}
        updated = 0

        for student in students:
            course_code = (
                self.COURSE_CODES.get(student.course.code, "00")
                if student.course
                else "00"
            )
            year_code = (
                str(student.admission_year)[-2:] if student.admission_year else "00"
            )
            sem_code = str(student.current_semester).zfill(2)

            key = "%s%s%s" % (year_code, course_code, sem_code)

            if key not in counter:
                counter[key] = 0

            counter[key] += 1
            new_enrollment = "%s%s" % (key, str(counter[key]).zfill(3))

            student.enrollment_no = new_enrollment
            student.save(update_fields=["enrollment_no"])
            updated += 1

        self.stdout.write("Updated %d enrollment numbers" % updated)

        enrollments = list(Student.objects.values_list("enrollment_no", flat=True))
        unique_count = len(set(enrollments))
        total_count = len(enrollments)

        self.stdout.write("Total: %d, Unique: %d" % (total_count, unique_count))

        if unique_count == total_count:
            self.stdout.write(self.style.SUCCESS("All enrollment numbers are unique!"))
        else:
            self.stdout.write(self.style.ERROR("Some duplicates remain"))
