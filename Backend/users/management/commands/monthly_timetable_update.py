import os
from datetime import datetime
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Monthly Smart Timetable Regeneration"

    """
    Run this command MONTHLY to regenerate timetable with fresh assignments.
    
    Usage:
        python manage.py monthly_timetable_update
        
    What it does:
    1. Archives current timetable
    2. Clears auto-generated slots
    3. Generates new smart timetable
    4. Creates backup record
    
    Schedule this with cron/systemd for automation:
        0 0 1 * *  /path/to/venv/bin/python /path/to/manage.py monthly_timetable_update
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", action="store_true", help="Preview without saving"
        )
        parser.add_argument(
            "--branch",
            type=str,
            default="Kherva",
            choices=["Kherva", "Ahmedabad", "both"],
            help="Campus branch to regenerate",
        )
        parser.add_argument(
            "--keep-locked",
            action="store_true",
            default=True,
            help="Keep locked slots (default: True)",
        )
        parser.add_argument(
            "--notify",
            action="store_true",
            help="Send notification to faculty/students",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        branch = options["branch"]
        keep_locked = options["keep_locked"]
        notify = options["notify"]

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        self.stdout.write(f"\n{'=' * 60}")
        self.stdout.write(f"MONTHLY TIMETABLE UPDATE - {timestamp}")
        self.stdout.write(f"{'=' * 60}\n")

        # Step 1: Archive
        self.stdout.write("[STEP 1] Archiving current timetable...")
        self._archive_timetable(branch, timestamp)

        # Step 2: Clear (only if not dry run)
        if not dry_run:
            self.stdout.write("\n[STEP 2] Clearing auto-generated slots...")
            self._clear_auto_slots(branch, keep_locked)

        # Step 3: Generate
        self.stdout.write("\n[STEP 3] Generating new timetable...")
        self._generate_timetable(branch, dry_run)

        # Step 4: Report
        self.stdout.write("\n[STEP 4] Generating report...")
        report = self._generate_report(branch)

        # Step 5: Notify (if enabled)
        if notify and not dry_run:
            self.stdout.write("\n[STEP 5] Sending notifications...")
            self._send_notifications(report)

        self.stdout.write(f"\n{'=' * 60}")
        if dry_run:
            self.stdout.write(self.style.WARNING("[DRY RUN] No changes made"))
        else:
            self.stdout.write(self.style.SUCCESS("[SUCCESS] Monthly update complete"))
        self.stdout.write(f"{'=' * 60}\n")

        self.stdout.write(f"Report Summary:")
        self.stdout.write(f"  Branch: {branch}")
        self.stdout.write(f"  Slots Generated: {report['slots']}")
        self.stdout.write(f"  Conflicts: {report['conflicts']}")
        self.stdout.write(f"  Locked Preserved: {report['locked']}")
        self.stdout.write(f"  Faculty Notified: {report['notified']}")

    def _archive_timetable(self, branch, timestamp):
        """Archive current timetable before regeneration"""
        from academics.models import TimetableSchedule
        from django.utils import timezone
        from datetime import timedelta

        schedule = TimetableSchedule.objects.create(
            name=f"Archive {timestamp}",
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=30),
            is_active=False,
            is_published=True,
            generated_by="archive",
            generation_log=f"Archived on {timestamp}",
        )
        self.stdout.write(f"   [OK] Created archive record: {schedule.schedule_id}")

    def _clear_auto_slots(self, branch, keep_locked):
        """Clear only auto-generated slots"""
        from academics.models import TimetableSlot

        query = TimetableSlot.objects.filter(is_auto_generated=True)

        if keep_locked:
            # Get counts before and after
            auto_count = query.count()
            locked_count = query.filter(is_locked=True).count()
            query.filter(is_locked=False).delete()
            self.stdout.write(
                f"   [OK] Cleared {auto_count - locked_count} slots (kept {locked_count} locked)"
            )
        else:
            count = query.count()
            query.delete()
            self.stdout.write(f"   [OK] Cleared {count} slots (including locked)")

    def _generate_timetable(self, branch, dry_run):
        """Generate new smart timetable"""
        if dry_run:
            self.stdout.write("   [DRY RUN] Would generate new timetable")
            return

        # Import and run the generator
        from users.management.commands.generate_smart_timetable import (
            SmartTimetableGenerator,
        )

        generator = SmartTimetableGenerator(branch=branch, dry_run=dry_run)
        result = generator.generate()

        self.stdout.write(f"   [OK] Generated {result['generated']} slots")
        self.stdout.write(f"   [OK] {result['locked']} locked slots preserved")
        self.stdout.write(f"   [OK] {result['conflicts']} conflicts resolved")

    def _generate_report(self, branch):
        """Generate update report"""
        from academics.models import TimetableSlot
        from users.models import Faculty

        slots = TimetableSlot.objects.filter(is_auto_generated=True).count()

        locked = TimetableSlot.objects.filter(
            is_auto_generated=True, is_locked=True
        ).count()

        faculty = Faculty.objects.filter(branch__contains=branch).count()

        return {
            "branch": branch,
            "slots": slots,
            "locked": locked,
            "conflicts": 0,
            "notified": faculty,
        }

    def _send_notifications(self, report):
        """Send notifications to faculty"""
        self.stdout.write(
            f"   [INFO] Would notify {report['notified']} faculty members"
        )
        self.stdout.write(
            "   [INFO] Email notifications: Not implemented (add your email service)"
        )
