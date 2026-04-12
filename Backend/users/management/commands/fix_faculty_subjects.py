from django.core.management.base import BaseCommand
from users.models import Faculty
from academics.models import Subject


class Command(BaseCommand):
    help = "Fix faculty subject assignments with proper rules"

    DEPT_COURSES = {
        "Computer Applications": {
            "courses": ["BCA", "MCA"],
            "prefixes": ["U3", "P1"],
        },
        "Information Technology": {
            "courses": ["BSCIT", "BTech"],
            "prefixes": ["IMS"],
        },
        "Information Management": {
            "courses": ["BSC-IT(IMS)", "MSC-IT(IMS)"],
            "prefixes": ["IT"],
        },
        "Computer Science": {
            "courses": ["BSCIT-CS"],
            "prefixes": ["CS"],
        },
        "AI & ML": {
            "courses": ["MSC-IT(AI/ML)"],
            "prefixes": ["AI"],
        },
        "Cyber Security": {
            "courses": ["BTech"],
            "prefixes": ["CEIT", "ES", "BS"],
        },
    }

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be assigned without making changes",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)

        if not dry_run:
            # Clear all existing assignments
            for f in Faculty.objects.all():
                f.subjects.clear()
            self.stdout.write("Cleared all existing assignments")

        # Get active semesters (odd: 1, 3, 5, 7)
        active_sems = [1, 3, 5, 7]

        total_assigned = 0

        for faculty in Faculty.objects.all():
            dept = faculty.department
            if dept not in self.DEPT_COURSES:
                self.stdout.write("%s: Unknown department %s" % (faculty.name, dept))
                continue

            config = self.DEPT_COURSES[dept]
            courses = config["courses"]
            prefixes = config["prefixes"]

            # Track subjects per semester
            semester_subjects = {s: [] for s in active_sems}
            total_this_faculty = 0

            for sem in active_sems:
                # Get subjects for this semester and department
                subjects = Subject.objects.filter(
                    semester=sem, course__code__in=courses
                )

                # Filter by prefix
                matched = []
                for s in subjects:
                    for prefix in prefixes:
                        if prefix in s.code:
                            matched.append(s)
                            break

                # Assign up to 2 subjects per semester for this faculty
                assigned_count = 0
                for subject in matched:
                    if assigned_count >= 2:
                        break
                    if total_this_faculty >= 3:
                        break
                    if subject in sum([semester_subjects[s] for s in active_sems], []):
                        continue  # Already assigned

                    if not dry_run:
                        faculty.subjects.add(subject)

                    assigned_count += 1
                    total_this_faculty += 1
                    semester_subjects[sem].append(subject)

            self.stdout.write(
                "%s (%s): %d subjects assigned"
                % (faculty.name, dept, total_this_faculty)
            )
            total_assigned += total_this_faculty

        self.stdout.write("")
        self.stdout.write("Total assignments: %d" % total_assigned)
        self.stdout.write(self.style.SUCCESS("Done!"))
