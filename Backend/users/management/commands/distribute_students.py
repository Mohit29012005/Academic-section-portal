"""
Distribute students equally - ~60 per semester for each course
FAST VERSION with bulk create
"""

import random
from django.core.management.base import BaseCommand
from users.models import Student, User
from academics.models import Course


class Command(BaseCommand):
    help = "Distribute students: ~60 per semester per course"

    TARGET_PER_SEM = 60

    INDIAN_FIRST_NAMES = [
        "Aarav",
        "Aarya",
        "Advait",
        "Ayaan",
        "Dhruv",
        "Ishaan",
        "Kabir",
        "Lakshya",
        "Navya",
        "Pranav",
        "Riya",
        "Saanvi",
        "Vivaan",
        "Ananya",
        "Arjun",
        "Diya",
        "Kavya",
        "Myra",
        "Rohan",
        "Sneha",
        "Aditi",
        "Ankit",
        "Chirag",
        "Gaurav",
        "Harsh",
        "Kunal",
        "Manish",
        "Nikhil",
        "Piyush",
        "Rahul",
        "Siddharth",
        "Vikram",
        "Amit",
        "Bharat",
        "Chetan",
        "Deepak",
        "Gopal",
        "Harish",
        "Jatin",
        "Kiran",
        "Lalit",
        "Manoj",
        "Naresh",
        "Ojas",
        "Parth",
        "Qadir",
        "Rajesh",
        "Sanjay",
        "Tarun",
        "Umesh",
    ]

    INDIAN_LAST_NAMES = [
        "Patel",
        "Shah",
        "Mehta",
        "Sharma",
        "Gupta",
        "Singh",
        "Kumar",
        "Verma",
        "Yadav",
        "Mishra",
        "Agarwal",
        "Jain",
        "Trivedi",
        "Desai",
        "Joshi",
        "Pandey",
        "Chauhan",
        "Rathore",
        "Tomar",
        "Chandel",
    ]

    course_codes = {
        "MCA": "34",
        "BCA": "30",
        "BTech": "39",
        "MTech": "37",
        "BSCIT": "32",
        "BSC-IT(IMS)": "31",
        "MSC-IT(IMS)": "35",
        "MSC-IT(CS)": "36",
        "MSCIT": "38",
        "MSC-IT(AI/ML)": "33",
        "BSCIT-CS": "29",
    }

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("STUDENT DISTRIBUTION - 60 PER SEMESTER (FAST)")
        self.stdout.write("=" * 60)

        courses = list(Course.objects.filter(status="Active"))
        if not courses:
            self.stdout.write(self.style.ERROR("[ERROR] No active courses!"))
            return

        total_existing = Student.objects.count()
        total_generated = 0

        for course in courses:
            self.stdout.write(f"\n[{course.code}] {course.name}")

            max_sems = course.total_semesters or 6
            course_code = self.course_codes.get(course.code, "00")

            for sem in range(1, max_sems + 1):
                current = Student.objects.filter(
                    course=course, current_semester=sem
                ).count()
                needed = self.TARGET_PER_SEM - current

                if needed > 0:
                    self.stdout.write(f"  Sem {sem}: {current} -> creating {needed}...")
                    created = self._bulk_create_students(
                        course, sem, needed, course_code
                    )
                    total_generated += created
                    self.stdout.write(f"    Created {created} students")

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(f"[SUMMARY]")
        self.stdout.write(f"  New students: {total_generated}")
        self.stdout.write(f"  Previous total: {total_existing}")
        self.stdout.write(f"  New total: {total_existing + total_generated}")
        self.stdout.write("=" * 60)

        self.stdout.write("\n[FINAL DISTRIBUTION]")
        for course in courses:
            total = Student.objects.filter(course=course).count()
            self.stdout.write(f"  {course.code}: {total} students")

    def _bulk_create_students(self, course, semester, count, course_code):
        students_to_create = []
        users_to_create = []

        prefix = f"25{course_code}{semester:02d}"
        existing = Student.objects.filter(enrollment_no__startswith=prefix)
        max_num = 0
        for s in existing:
            try:
                num_part = int(s.enrollment_no[-3:])
                if num_part > max_num:
                    max_num = num_part
            except:
                pass

        for i in range(count):
            num = max_num + i + 1
            enrollment = f"25{course_code}{semester:02d}{num:03d}"

            if Student.objects.filter(enrollment_no=enrollment).exists():
                continue

            first = random.choice(self.INDIAN_FIRST_NAMES)
            last = random.choice(self.INDIAN_LAST_NAMES)
            name = f"{first} {last}"
            email = f"{enrollment.lower()}@ganpatuniversity.edu.in"

            if User.objects.filter(email=email).exists():
                continue

            user = User(email=email, role="student")
            user.set_password("Guni@123")
            users_to_create.append(user)

        if users_to_create:
            created_users = User.objects.bulk_create(users_to_create)

            for j, user in enumerate(created_users):
                num = max_num + j + 1
                enrollment = f"25{course_code}{semester:02d}{num:03d}"
                first = random.choice(self.INDIAN_FIRST_NAMES)
                last = random.choice(self.INDIAN_LAST_NAMES)
                name = f"{first} {last}"
                email = f"{enrollment.lower()}@ganpatuniversity.edu.in"

                students_to_create.append(
                    Student(
                        user=user,
                        name=name,
                        enrollment_no=enrollment,
                        email=email,
                        phone=f"+91{random.randint(7000000000, 9999999999)}",
                        course=course,
                        current_semester=semester,
                        total_semesters=course.total_semesters or 6,
                        batch=random.choice(["A", "B"]),
                        admission_year=random.choice([2023, 2024, 2025]),
                        gender=random.choice(["Male", "Female"]),
                        date_of_birth=f"2003-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
                        status="Active",
                    )
                )

            Student.objects.bulk_create(students_to_create)
            return len(created_users)

        return 0
