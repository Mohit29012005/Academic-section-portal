from django.core.management.base import BaseCommand
from academics.models import Course, Subject

SUBJECTS_DATA = {
    "BCA": {
        1: [
            ("U31A1LDP", "Logic Development with Programming-I", 4),
            ("U31A2OAT", "Office Automation Tools", 4),
            ("U31A3BWP", "Basic Web Programming-I", 4),
            ("U31A4COA", "Computer Organization & Architecture", 4),
            ("U31B5LCS", "Language & Communication Skills-I", 3),
        ],
        2: [
            ("U32A1LDP", "Logic Development with Programming-II", 4),
            ("U32A2BWP", "Basic Web Programming-II", 4),
            ("U32A3ITM", "Information Technology & System Maintenance", 4),
            ("U32A4DM", "Discrete Mathematics", 4),
            ("U32B5LCS", "Language & Communication Skills-II", 3),
        ],
        3: [
            ("U33A1OOP", "Object Oriented Concepts and Programming", 4),
            ("U33A2DFS", "Data and File Structure", 4),
            ("U33A3DBM", "Database Management System", 4),
            ("U33A4SAD", "System Analysis & Design", 4),
            ("U33A5NT1", "Networking-I", 3),
            ("U33B6EDM", "Environment and Disaster Management", 3),
        ],
        4: [
            ("U34A1GUI", "GUI Programming", 4),
            ("U34A3ADB", "Advance Database Management System", 4),
            ("U34A6SWE", "Software Engineering", 4),
            ("U36A1OST", "Open Source Technologies", 4),
        ],
        5: [
            ("U35A1AWT", "Advance Web Technology", 4),
            ("U35A2OSY", "Operating System", 4),
            ("U35A3ESC", "E-Security and Cyber Law", 4),
            ("U35A4FAD", "Fundamental of Android Development", 4),
        ],
        6: [
            ("U36A1MDA", "Mobile Application Development", 4),
            ("U36A2CLD", "Cloud Computing", 4),
            ("U36A3PRJ", "Project Work", 12),
        ],
    },
    "MCA": {
        1: [
            ("MCA101", "Advanced Programming Concepts", 4),
            ("MCA102", "Data Structures & Algorithms", 4),
            ("MCA103", "Database Management Systems", 4),
            ("MCA104", "Computer Networks", 4),
        ],
        2: [
            ("MCA201", "Operating Systems", 4),
            ("MCA202", "Software Engineering", 4),
            ("MCA203", "Web Technologies", 4),
            ("MCA204", "Object Oriented Analysis & Design", 4),
        ],
        3: [
            ("MCA301", "Machine Learning", 4),
            ("MCA302", "Cloud Computing", 4),
            ("MCA303", "Mobile Computing", 4),
            ("MCA304", "Information Security", 4),
        ],
        4: [
            ("MCA401", "Big Data Analytics", 4),
            ("MCA402", "Artificial Intelligence", 4),
            ("MCA403", "Project & Internship", 12),
        ],
    },
    "BSC-IT": {
        1: [
            ("BSCIT101", "Programming Fundamentals", 4),
            ("BSCIT102", "Computer Organization", 4),
            ("BSCIT103", "Mathematics for IT", 4),
        ],
        2: [
            ("BSCIT201", "Data Structures", 4),
            ("BSCIT202", "Web Development", 4),
            ("BSCIT203", "Database Systems", 4),
        ],
        3: [
            ("BSCIT301", "Operating Systems", 4),
            ("BSCIT302", "Computer Networks", 4),
            ("BSCIT303", "Software Engineering", 4),
        ],
        4: [
            ("BSCIT401", "Python Programming", 4),
            ("BSCIT402", "Cyber Security Basics", 4),
            ("BSCIT403", "Cloud Computing", 4),
        ],
        5: [
            ("BSCIT501", "Machine Learning", 4),
            ("BSCIT502", "Mobile App Development", 4),
        ],
        6: [
            ("BSCIT601", "Project Work", 10),
            ("BSCIT602", "Industrial Training", 6),
        ],
    },
    "BTECH-CSE": {
        1: [
            ("CSE101", "Engineering Mathematics-I", 4),
            ("CSE102", "Programming in C", 4),
            ("CSE103", "Basic Electronics", 4),
        ],
        2: [
            ("CSE201", "Engineering Mathematics-II", 4),
            ("CSE202", "Data Structures", 4),
            ("CSE203", "Digital Logic Design", 4),
        ],
        3: [
            ("CSE301", "Object Oriented Programming", 4),
            ("CSE302", "Computer Architecture", 4),
            ("CSE303", "Discrete Mathematics", 4),
        ],
        4: [
            ("CSE401", "Database Management", 4),
            ("CSE402", "Operating Systems", 4),
            ("CSE403", "Theory of Computation", 4),
        ],
        5: [
            ("CSE501", "Computer Networks", 4),
            ("CSE502", "Software Engineering", 4),
            ("CSE503", "Compiler Design", 4),
        ],
        6: [
            ("CSE601", "Web Technologies", 4),
            ("CSE602", "Artificial Intelligence", 4),
            ("CSE603", "Machine Learning", 4),
        ],
        7: [
            ("CSE701", "Cloud Computing", 4),
            ("CSE702", "Deep Learning", 4),
        ],
        8: [
            ("CSE801", "Major Project", 12),
            ("CSE802", "Industrial Training", 4),
        ],
    },
}


class Command(BaseCommand):
    help = "Create correct subjects from PYQ system"

    def handle(self, *args, **options):
        self.stdout.write("Creating subjects from PYQ system...\n")

        Subject.objects.all().delete()
        self.stdout.write("Deleted all existing subjects")

        courses = Course.objects.all()
        total_created = 0

        for course in courses:
            course_code = course.code

            if course_code not in SUBJECTS_DATA:
                self.stdout.write(f"Skipping {course_code} - not in PYQ data")
                continue

            course_subjects = SUBJECTS_DATA[course_code]

            for semester, subjects in course_subjects.items():
                for code, name, credits in subjects:
                    Subject.objects.create(
                        code=code,
                        name=name,
                        course=course,
                        semester=semester,
                        credits=credits,
                    )
                    total_created += 1
                    self.stdout.write(
                        f"  {course_code} Sem-{semester}: {code} - {name}"
                    )

        self.stdout.write(
            self.style.SUCCESS(f"\nTotal subjects created: {total_created}")
        )
