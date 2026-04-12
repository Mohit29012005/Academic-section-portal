from django.core.management.base import BaseCommand
from users.models import Student
from academics.models import Course
import random
from datetime import date

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
    "Mayank",
    "Harsh",
    "Ayush",
    "Parth",
    "Gaurav",
    "Siddharth",
    "Saksham",
    "Rishabh",
    "Utkarsh",
    "Shivam",
    "Kshitij",
    "Manish",
    "Nilesh",
    "Jatin",
    "Kapil",
    "Tarun",
    "Varun",
    "Ashish",
    "Girish",
    "Harish",
    "Manoj",
    "Prem",
    "Ramesh",
    "Ratan",
    "Anil",
    "Sunil",
    "Mahesh",
    "Rakesh",
    "Jatin",
    "Sanjay",
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


class Command(BaseCommand):
    help = "Update existing students with batch, DOB, gender, father_name, address"

    def handle(self, *args, **options):
        self.stdout.write("Updating existing students...\n")

        students = Student.objects.filter(admission_year=2026, batch__isnull=True)
        total = students.count()

        if total == 0:
            self.stdout.write(
                "No students to update. All students already have batch assigned."
            )
            return

        updated = 0
        for student in students:
            self.update_student(student)
            updated += 1
            if updated % 100 == 0:
                self.stdout.write(f"  Updated {updated}/{total} students...")

        self.stdout.write(self.style.SUCCESS(f"\nTotal students updated: {updated}"))

    def update_student(self, student):
        roll_no = student.enrollment_no
        seq = int(roll_no[-3:])

        if seq <= 30:
            batch = "A"
            gender = "Male"
        else:
            batch = "B"
            gender = "Female"

        father_first = random.choice(INDIAN_FIRST_NAMES_MALE)
        father_name = f"{father_first} {student.name.split()[-1]}"

        dob_year = random.randint(2002, 2006)
        dob_month = random.randint(1, 12)
        dob_day = random.randint(1, 28)
        date_of_birth = date(dob_year, dob_month, dob_day)

        city = random.choice(CITIES_GUJARAT)
        address = f"{random.randint(1, 999)}, Main Road, {city}, Gujarat"

        student.batch = batch
        student.gender = gender
        student.father_name = father_name
        student.date_of_birth = date_of_birth
        student.address = address
        student.admission_year = 2026
        student.save()
