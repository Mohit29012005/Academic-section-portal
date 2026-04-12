import random
from django.core.management.base import BaseCommand
from users.models import User, Student
from academics.models import Course


class Command(BaseCommand):
    help = "Regenerate all students with exactly 60 per semester per course"

    COURSE_CODES = {
        "BCA": "31",
        "BSCIT": "42",
        "BSCIT-CS": "51",
        "BSC-IT(IMS)": "21",
        "BTech": "32",
        "MTech": "33",
        "MCA": "34",
        "MSC-IT(IMS)": "71",
        "MSC-IT(CS)": "81",
        "MSC-IT(AI/ML)": "91",
        "MSCIT": "61",
    }

    FIRST_NAMES = [
        "Aarav",
        "Aarya",
        "Advait",
        "Aditi",
        "Akash",
        "Ananya",
        "Anika",
        "Ankit",
        "Aria",
        "Arjun",
        "Aryan",
        "Ayesha",
        "Bhavesh",
        "Chirag",
        "Deepak",
        "Dhruv",
        "Diya",
        "Gopal",
        "Harsh",
        "Ishaan",
        "Jatin",
        "Kabir",
        "Kavya",
        "Kiran",
        "Kunal",
        "Lakshya",
        "Madhav",
        "Manish",
        "Manoj",
        "Meera",
        "Myra",
        "Naresh",
        "Navya",
        "Nikita",
        "Nikhil",
        "Ojas",
        "Parth",
        "Piyush",
        "Prerna",
        "Priya",
        "Priyansh",
        "Raghav",
        "Rahul",
        "Rajesh",
        "Ravi",
        "Riya",
        "Rohan",
        "Saanvi",
        "Sahil",
        "Sakshi",
        "Sanjay",
        "Sanya",
        "Sarath",
        "Shreya",
        "Siddharth",
        "Sneha",
        "Suresh",
        "Tarun",
        "Umesh",
        "Utkarsh",
        "Vansh",
        "Vedant",
        "Vikram",
        "Yash",
    ]

    LAST_NAMES = [
        "Agarwal",
        "Ahmed",
        "Chauhan",
        "Choudhary",
        "Desai",
        "Gupta",
        "Iyer",
        "Jain",
        "Joshi",
        "Kumar",
        "Mehta",
        "Mishra",
        "Naidu",
        "Nair",
        "Pandey",
        "Patel",
        "Prasad",
        "Rao",
        "Rathore",
        "Reddy",
        "Shah",
        "Sharma",
        "Singh",
        "Thakur",
        "Tomar",
        "Trivedi",
        "Verma",
        "Yadav",
    ]

    ACTIVE_SEMESTERS = {
        "BCA": [1, 3, 5],
        "BSCIT": [1, 3, 5],
        "BSCIT-CS": [1, 3, 5],
        "BSC-IT(IMS)": [1, 3, 5],
        "BTech": [1, 3, 5, 7],
        "MCA": [1, 3],
        "MTech": [1, 3],
        "MSCIT": [1, 3],
        "MSC-IT(IMS)": [1, 3, 5],
        "MSC-IT(CS)": [1, 3],
        "MSC-IT(AI/ML)": [1, 3, 5],
    }

    def add_arguments(self, parser):
        parser.add_argument(
            "--keep-users",
            action="store_true",
            help="Keep existing user accounts (only delete students)",
        )

    def handle(self, *args, **options):
        keep_users = options.get("keep_users", False)

        if not keep_users:
            self.stdout.write("Deleting all students and users...")
            Student.objects.all().delete()
            User.objects.filter(role="student").delete()
        else:
            self.stdout.write("Deleting only students...")
            Student.objects.all().delete()

        self.stdout.write("")
        self.stdout.write("Creating students...")

        current_year = 2025
        total_created = 0
        total_courses = 0

        courses = Course.objects.all()
        for course in courses:
            code = course.code
            course_code = self.COURSE_CODES.get(code, "00")
            active_sems = self.ACTIVE_SEMESTERS.get(code, [1])

            for sem in active_sems:
                years_ago = sem // 2
                admission_year = current_year - years_ago

                for serial in range(1, 61):
                    batch = "A" if serial <= 30 else "B"
                    seq_str = str(serial).zfill(3)
                    sem_str = str(sem).zfill(2)
                    year_str = str(admission_year)[-2:]

                    enrollment_no = "%s%s%s%s" % (
                        year_str,
                        course_code,
                        sem_str,
                        seq_str,
                    )

                    first_name = random.choice(self.FIRST_NAMES)
                    last_name = random.choice(self.LAST_NAMES)
                    name = "%s %s" % (first_name, last_name)

                    email = "%s@gnu.ac.in" % enrollment_no

                    user = User.objects.create_user(
                        email=email, password="student123", role="student"
                    )

                    Student.objects.create(
                        user=user,
                        enrollment_no=enrollment_no,
                        name=name,
                        email=email,
                        phone="",
                        course=course,
                        semester=sem,
                        current_semester=sem,
                        total_semesters=course.total_semesters,
                        admission_year=admission_year,
                        batch=batch,
                        status="Active",
                    )
                    total_created += 1

            self.stdout.write(
                "  %s: %d semesters x 60 = %d students"
                % (code, len(active_sems), len(active_sems) * 60)
            )
            total_courses += 1

        self.stdout.write("")
        self.stdout.write("Done!")
        self.stdout.write("Total courses: %d" % total_courses)
        self.stdout.write("Total students: %d" % total_created)

        self.stdout.write("")
        self.stdout.write("Summary by course:")
        for course in Course.objects.all():
            count = Student.objects.filter(course=course).count()
            self.stdout.write("  %s: %d" % (course.code, count))
