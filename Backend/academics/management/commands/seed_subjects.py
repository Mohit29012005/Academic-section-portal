"""
Management command to seed 5 subjects per semester for all existing courses.
Run: python manage.py seed_subjects
"""
from django.core.management.base import BaseCommand
from academics.models import Course, Subject


class Command(BaseCommand):
    help = 'Seed 5 subjects per semester for all courses that are missing subjects'

    SUBJECT_TEMPLATES = [
        ('Core Theory', 4),
        ('Advanced Concepts', 4),
        ('Practical Lab', 3),
        ('Elective Module', 3),
        ('Seminar & Workshop', 2),
    ]

    def handle(self, *args, **options):
        courses = Course.objects.all()
        total_created = 0

        for course in courses:
            total_semesters = course.total_semesters or (course.duration * 2)
            self.stdout.write(f'\nProcessing: {course.name} ({course.code}) — {total_semesters} semesters')

            for sem in range(1, total_semesters + 1):
                existing_count = Subject.objects.filter(course=course, semester=sem).count()

                if existing_count >= 5:
                    self.stdout.write(f'  Semester {sem}: Already has {existing_count} subjects — skipping')
                    continue

                # Create missing subjects to reach 5
                needed = 5 - existing_count
                created_in_sem = 0

                for idx, (name_suffix, credits) in enumerate(self.SUBJECT_TEMPLATES, 1):
                    sub_code = f"{course.code}-S{sem}-{idx}"
                    sub_name = f"{course.name} {name_suffix} {sem}.{idx}"

                    if not Subject.objects.filter(code=sub_code).exists():
                        Subject.objects.create(
                            code=sub_code,
                            name=sub_name,
                            course=course,
                            semester=sem,
                            credits=credits,
                        )
                        created_in_sem += 1
                        total_created += 1

                        if created_in_sem >= needed:
                            break

                self.stdout.write(f'  Semester {sem}: Created {created_in_sem} subjects (had {existing_count})')

        self.stdout.write(self.style.SUCCESS(f'\nDone! Created {total_created} subjects total.'))
