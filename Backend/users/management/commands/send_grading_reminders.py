"""
Management command to send grading reminders to class teachers
one week before the semester toggle months (January and July).

Run this as a cron/scheduled task:
    python manage.py send_grading_reminders
"""
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from users.models import Faculty, Notification


class Command(BaseCommand):
    help = "Send grading reminders to class teachers before semester transitions"

    def handle(self, *args, **options):
        now = timezone.now()
        month = now.month
        day = now.day

        # Reminder window: last week of December (before Jan toggle) or last week of June (before July toggle)
        should_remind = False
        transition_type = ""

        if month == 12 and day >= 24:
            should_remind = True
            transition_type = "ODD -> EVEN (January)"
        elif month == 6 and day >= 24:
            should_remind = True
            transition_type = "EVEN -> ODD (July)"

        if not should_remind:
            self.stdout.write(
                self.style.WARNING(
                    f"Not in reminder window (month={month}, day={day}). Skipping."
                )
            )
            return

        # Get all class teachers
        class_teachers = Faculty.objects.filter(is_class_teacher=True)
        if not class_teachers.exists():
            self.stdout.write(self.style.WARNING("No class teachers found."))
            return

        sent_count = 0
        for faculty in class_teachers:
            course_name = faculty.class_course.name if faculty.class_course else "Unknown"

            # Create in-app notification
            try:
                Notification.objects.create(
                    title="Grading Reminder",
                    message=(
                        f"Semester transition ({transition_type}) is approaching. "
                        f"Please complete grading for all {course_name} students "
                        f"before the admin toggles the semester."
                    ),
                    type="warning",
                    target_role="faculty",
                    is_global=False,
                )
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Notification error: {e}"))

            # Send email
            if faculty.email:
                try:
                    send_mail(
                        subject=f"GUNI Grading Reminder - {transition_type}",
                        message=(
                            f"Dear {faculty.name},\n\n"
                            f"This is a reminder that the semester transition ({transition_type}) "
                            f"is approaching within the next week.\n\n"
                            f"Please ensure all student grades for {course_name} are submitted "
                            f"before the admin toggles the semester configuration.\n\n"
                            f"Once the semester is toggled, student semesters will auto-increment "
                            f"and grading for the current semester will no longer be possible.\n\n"
                            f"Regards,\nGUNI Academic Portal"
                        ),
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[faculty.email],
                        fail_silently=True,
                    )
                    sent_count += 1
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"Email error for {faculty.name}: {e}")
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f"Grading reminders sent to {sent_count}/{class_teachers.count()} class teachers for {transition_type}"
            )
        )
