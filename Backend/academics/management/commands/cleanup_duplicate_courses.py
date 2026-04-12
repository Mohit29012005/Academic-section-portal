from django.core.management.base import BaseCommand
from django.db.models import Count
from academics.models import Course


class Command(BaseCommand):
    help = "Find and remove duplicate courses from the database"

    def add_arguments(self, parser):
        parser.add_argument(
            "--remove",
            action="store_true",
            help="Actually remove duplicate courses (without this flag, only shows what would be removed)",
        )

    def handle(self, *args, **options):
        duplicates = (
            Course.objects.values("code")
            .annotate(count=Count("course_id"))
            .filter(count__gt=1)
        )

        if not duplicates:
            self.stdout.write(self.style.SUCCESS("No duplicate courses found!"))
            return

        self.stdout.write(
            self.style.WARNING(f"Found {len(duplicates)} duplicate course codes!")
        )

        for dup in duplicates:
            code = dup["code"]
            count = dup["count"]

            courses = Course.objects.filter(code=code).order_by("created_at")

            self.stdout.write(f"\nCourse code: {code} ({count} duplicates)")
            for c in courses:
                self.stdout.write(
                    f"  - {c.course_id}: {c.name} (created: {c.created_at})"
                )

            if options["remove"]:
                # Keep the first one, delete the rest
                to_keep = courses.first()
                to_delete = courses.exclude(course_id=to_keep.course_id)

                self.stdout.write(f"  Keeping: {to_keep.name}")
                self.stdout.write(f"  Deleting: {to_delete.count()} duplicates")

                to_delete.delete()

                self.stdout.write(
                    self.style.SUCCESS(f"  Removed duplicates for {code}")
                )
            else:
                self.stdout.write(
                    self.style.WARNING("  Run with --remove to delete duplicates")
                )

        if not options["remove"]:
            self.stdout.write(
                "\n"
                + self.style.WARNING(
                    "NOTE: This only shows duplicates. Run with --remove to delete them."
                )
            )
