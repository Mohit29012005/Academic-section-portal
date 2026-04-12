from django.core.management.base import BaseCommand
from users.models import User


class Command(BaseCommand):
    help = "Reset all user passwords"

    def handle(self, *args, **options):
        # Update admin password
        admins = User.objects.filter(role="admin")
        for u in admins:
            u.set_password("admin@123")
            u.save(update_fields=["password"])
        self.stdout.write("Admin passwords: admin@123")

        # Update student passwords
        students = User.objects.filter(role="student")
        for u in students:
            u.set_password("student@123")
            u.save(update_fields=["password"])
        self.stdout.write(
            "Student passwords: student@123 (%d users)" % students.count()
        )

        # Update faculty passwords
        faculty = User.objects.filter(role="faculty")
        for u in faculty:
            u.set_password("FCA@123")
            u.save(update_fields=["password"])
        self.stdout.write("Faculty passwords: FCA@123 (%d users)" % faculty.count())

        self.stdout.write(self.style.SUCCESS("All passwords updated!"))
