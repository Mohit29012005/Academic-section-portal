from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Student
from academics.models import Course
import random
from datetime import date

User = get_user_model()

INDIAN_FIRST_NAMES = [
    "Rahul",
    "Amit",
    "Vikram",
    "Suresh",
    "Rajesh",
    "Priya",
    "Neha",
    "Sneha",
    "Anjali",
    "Divya",
    "Arjun",
    "Karan",
    "Sanjay",
    "Deepak",
    "Ravi",
    "Ankit",
    "Nikhil",
    "Rohit",
    "Vijay",
    "Pooja",
    "Kavita",
    "Ritu",
    "Nidhi",
    "Meera",
    "Kiran",
    "Geeta",
    "Sunita",
    "Rekha",
    "Mona",
    "Raj",
    "Vishal",
    "Akash",
    "Yash",
    "Aditya",
    "Shubham",
    "Mayank",
    "Harsh",
    "Ayush",
    "Parth",
    "Shreya",
    "Aisha",
    "Nisha",
    "Priyanka",
    "Swati",
    "Deepika",
    "Aarti",
    "Monika",
    "Rashmi",
    "Seema",
    "Gaurav",
    "Siddharth",
    "Saksham",
    "Rishabh",
    "Utkarsh",
    "Shivam",
    "Kshitij",
    "Manish",
    "Nilesh",
    "Nikita",
    "Riya",
    "Ishita",
    "Ananya",
    "Myra",
    "Aadhya",
    "Avni",
    "Prisha",
    "Navya",
    "Anika",
]

INDIAN_LAST_NAMES = [
    "Kumar",
    "Sharma",
    "Patel",
    "Singh",
    "Verma",
    "Gupta",
    "Agarwal",
    "Jain",
    "Mehta",
    "Shah",
    "Reddy",
    "Nair",
    "Menon",
    "Iyer",
    "Krishnan",
    "Rao",
    "Joshi",
    "Pande",
    "Desai",
    "Choudhary",
    "Yadav",
    "Thakur",
    "Chauhan",
    "Rawat",
    "Singh",
    "Pandey",
    "Tiwari",
    "Mishra",
    "Dubey",
    "Maurya",
]

INDIAN_FIRST_NAMES_MALE = [
    "Rahul",
    "Amit",
    "Vikram",
    "Suresh",
    "Rajesh",
    "Arjun",
    "Karan",
    "Sanjay",
    "Deepak",
    "Ravi",
    "Ankit",
    "Nikhil",
    "Rohit",
    "Vijay",
    "Raj",
    "Vishal",
    "Akash",
    "Yash",
    "Aditya",
    "Shubham",
]

CITIES_GUJARAT = [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Gandhinagar",
    "Bhavnagar",
    "Jamnagar",
    "Junagadh",
    "Anand",
    "Nadiad",
    "Kheda",
    "Mahesana",
    "Patan",
    "Banaskantha",
    "Mehsana",
    "Kutch",
]

COURSE_CODES = {
    "BCA": "30",
    "BSC-IT": "31",
    "BSC-IMS": "32",
    "BSC-CYBER": "33",
    "MCA": "34",
    "MSC-IT": "35",
    "MSC-IMS": "36",
    "MSC-CYBER": "37",
    "MSC-AIML": "38",
    "BTECH-IT": "39",
    "BTECH-CSE": "40",
}


class Command(BaseCommand):
    help = "Generate historical student data for 2023-2025 batches"

    def add_arguments(self, parser):
        parser.add_argument(
            "--year",
            type=int,
            help="Generate for specific year (2023, 2024, or 2025)",
        )
        parser.add_argument(
            "--all",
            action="store_true",
            help="Generate for all years (2023-2025)",
        )

    def handle(self, *args, **options):
        year = options.get("year")
        generate_all = options.get("all")

        if generate_all:
            for y in [2023, 2024, 2025]:
                self.generate_year(y)
        elif year:
            self.generate_year(year)
        else:
            self.stdout.write("Please specify --year or --all")
            self.stdout.write("Usage: python manage.py generate_historical --year 2023")
            self.stdout.write("Usage: python manage.py generate_historical --all")

    def generate_year(self, year):
        self.stdout.write(f"\nGenerating {year} batch students...\n")

        courses = Course.objects.all()
        total_created = 0

        for course in courses:
            created = self.generate_course_students(course, year)
            total_created += created
            self.stdout.write(f"  {course.code} ({year}): {created} students")

        self.stdout.write(
            self.style.SUCCESS(f"\n{year} batch: {total_created} students created")
        )

    def generate_course_students(self, course, year):
        course_code = COURSE_CODES.get(course.code, "00")
        year_short = str(year)[-2:]
        roll_prefix = f"{year_short}0324{course_code}"
        password = "student123"

        existing_count = Student.objects.filter(
            course=course, admission_year=year
        ).count()
        if existing_count > 0:
            self.stdout.write(
                f"  {course.code} ({year}): Already has {existing_count} students, skipping"
            )
            return 0

        current_sem = self.calculate_semester(year, course.total_semesters)

        created = 0
        for i in range(1, 61):
            roll_number = f"{roll_prefix}{i:03d}"
            student_id = f"{roll_number}@gnu.ac.in"

            first_name = random.choice(INDIAN_FIRST_NAMES)
            last_name = random.choice(INDIAN_LAST_NAMES)
            full_name = f"{first_name} {last_name}"

            phone = f"98765{random.randint(10000, 99999)}"

            city = random.choice(CITIES_GUJARAT)
            address = f"{random.randint(1, 999)}, Main Road, {city}, Gujarat"

            seq = int(roll_number[-3:])
            if seq <= 30:
                batch = "A"
                gender = "Male"
            else:
                batch = "B"
                gender = "Female"

            father_first = random.choice(INDIAN_FIRST_NAMES_MALE)
            father_name = f"{father_first} {last_name}"

            dob_year = year - 19
            dob_month = random.randint(1, 12)
            dob_day = random.randint(1, 28)
            date_of_birth = date(dob_year, dob_month, dob_day)

            if User.objects.filter(email=student_id).exists():
                continue

            user = User.objects.create_user(
                email=student_id, password=password, role="student"
            )

            Student.objects.create(
                user=user,
                enrollment_no=roll_number,
                name=full_name,
                email=student_id,
                phone=phone,
                course=course,
                semester=current_sem,
                current_semester=current_sem,
                total_semesters=course.total_semesters,
                cgpa=random.uniform(6.0, 9.5),
                status="Active",
                date_of_birth=date_of_birth,
                gender=gender,
                father_name=father_name,
                address=address,
                batch=batch,
                admission_year=year,
            )
            created += 1

        return created

    def calculate_semester(self, admission_year, total_semesters):
        current_year = 2026
        months_since_admission = (current_year - admission_year) * 12

        semesters_completed = min((months_since_admission // 6) + 1, total_semesters)

        return semesters_completed
