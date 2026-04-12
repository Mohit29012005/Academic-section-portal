"""
Generate Student Results
Rules:
- Internal exam = 30 marks
- External exam = 60 marks
- Total = 90 marks per subject
- Passing marks = 35 (minimum 35% required)
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import Student
from academics.models import Subject, SemesterResult, SubjectResult, Course


class Command(BaseCommand):
    help = "Generate student results for all semesters"

    def add_arguments(self, parser):
        parser.add_argument(
            "--regenerate",
            action="store_true",
            help="Delete existing results and regenerate",
        )

    def handle(self, *args, **options):
        regenerate = options.get("regenerate", False)

        if regenerate:
            self.stdout.write("Deleting existing results...")
            SubjectResult.objects.all().delete()
            SemesterResult.objects.all().delete()

        total_students = 0
        total_subjects = 0

        for student in Student.objects.select_related("course").all():
            course = student.course
            current_sem = student.current_semester
            total_students += 1

            if not course:
                continue

            for sem in range(1, current_sem + 1):
                # Check if semester result already exists
                sem_result, created = SemesterResult.objects.get_or_create(
                    student=student,
                    semester=sem,
                    defaults={
                        "year": student.admission_year or 2025,
                        "exam_type": "Regular",
                        "status": "completed",
                    },
                )

                # Get subjects for this semester
                subjects = Subject.objects.filter(course=course, semester=sem)
                sem_total = 0
                sem_obtained = 0

                for subj in subjects:
                    # Check if subject result exists
                    subj_result, created = SubjectResult.objects.get_or_create(
                        semester_result=sem_result,
                        subject=subj,
                    )

                    if created or regenerate:
                        # Generate random marks (realistic distribution)
                        # Internal: 15-30 marks (avg ~22)
                        internal = max(
                            0,
                            min(
                                30,
                                int(
                                    22
                                    + (hash(str(student.student_id) + subj.code) % 15)
                                    - 7
                                ),
                            ),
                        )
                        # External: 25-60 marks (avg ~45)
                        external = max(
                            0,
                            min(
                                60,
                                int(
                                    45
                                    + (hash(str(student.student_id) + subj.code) % 25)
                                    - 12
                                ),
                            ),
                        )
                        # Practical: 0-15 marks (avg ~10)
                        practical = max(
                            0,
                            min(
                                15,
                                int(
                                    10
                                    + (
                                        hash(str(student.student_id) + subj.code + "p")
                                        % 10
                                    )
                                    - 5
                                ),
                            ),
                        )

                        total = internal + external + practical
                        is_passed = total >= 35

                        subj_result.internal_marks = internal
                        subj_result.external_marks = external
                        subj_result.practical_marks = practical
                        subj_result.total_marks = total
                        subj_result.passing_marks = 35
                        subj_result.is_passed = is_passed
                        subj_result.grade = self._get_grade(total)
                        subj_result.save()

                        total_subjects += 1

                    sem_total += subj_result.passing_marks * 3  # Max marks = 90
                    sem_obtained += subj_result.total_marks

                # Update semester result
                if sem_total > 0:
                    percentage = (
                        (sem_obtained / sem_total * 100) if sem_total > 0 else 0
                    )
                    sem_result.total_marks = sem_total
                    sem_result.obtained_marks = sem_obtained
                    sem_result.percentage = round(percentage, 2)
                    sem_result.grade = self._get_grade(percentage)
                    sem_result.sgpa = round(percentage / 10, 2)
                    sem_result.save()

            if total_students % 100 == 0:
                self.stdout.write("Processed %d students..." % total_students)

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Done!"))
        self.stdout.write("Total students: %d" % total_students)
        self.stdout.write("Total subject results: %d" % total_subjects)

    def _get_grade(self, percentage):
        if percentage >= 90:
            return "O"
        elif percentage >= 80:
            return "A+"
        elif percentage >= 70:
            return "A"
        elif percentage >= 60:
            return "B+"
        elif percentage >= 50:
            return "B"
        elif percentage >= 40:
            return "C"
        elif percentage >= 35:
            return "P"
        else:
            return "F"
