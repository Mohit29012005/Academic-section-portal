from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Student
from academics.models import Course
import random

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
    "Vikram",
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
    "Aakash",
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
    "Jatin",
    "Kapil",
    "Siddharth",
    "Tarun",
    "Varun",
    "Ashish",
    "Girish",
    "Harish",
    "Manoj",
    "Vijay",
    "Madhuri",
    "Savita",
    "Asha",
    "Laxmi",
    "Durga",
    "Ganga",
    "Yamuna",
    "Sarita",
    "Kamala",
    "Basanti",
    "Anita",
    "Richa",
    "Shweta",
    "Sonia",
    "Gurpreet",
    "Manpreet",
    "Harpreet",
    "Simran",
    "Ravina",
    "Bhavna",
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
    "Kashyap",
    "Sinha",
    "Prasad",
    "Tripathi",
    "Shukla",
    "Dwivedi",
    "Trivedi",
    "Chaturvedi",
    "Bhat",
    "Kini",
    "Shetty",
    "Nayak",
    "Pai",
    "Hegde",
    "Acharya",
    "Holla",
    "Karnad",
    "Upadhyay",
    "Bharadwaj",
    "Chawla",
    "Garg",
    "Gupta",
    "Jain",
    "Khandelwal",
    "Mahajan",
    "Mahindra",
    "Naidu",
    "Gupta",
    "Shah",
    "Dave",
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
    "Sabarkantha",
    "Mehsana",
    "Kutch",
    "Surendranagar",
    "Dahod",
    "Panchmahal",
    "Bharuch",
    "Navsari",
    "Valsad",
    "Tapi",
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
    help = "Generate Indian student data for all courses"

    def handle(self, *args, **options):
        self.stdout.write("Generating Indian student data...\n")

        courses = Course.objects.all()
        total_created = 0

        for course in courses:
            created = self.generate_course_students(course)
            total_created += created
            self.stdout.write(f"  {course.code}: {created} students created")

        self.stdout.write(
            self.style.SUCCESS(f"\nTotal students created: {total_created}")
        )

    def generate_course_students(self, course):
        course_code = COURSE_CODES.get(course.code, "00")
        roll_prefix = f"260324{course_code}"
        password = "student123"

        existing = Student.objects.filter(course=course).count()
        if existing > 0:
            self.stdout.write(
                f"  {course.code}: Already has {existing} students, skipping"
            )
            return 0

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
                semester=1,
                current_semester=1,
                total_semesters=course.total_semesters,
                cgpa=0.00,
                status="Active",
            )
            created += 1

        return created
