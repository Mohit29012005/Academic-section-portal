from django.core.management.base import BaseCommand
from users.models import Faculty
from datetime import date

FACULTY_DATA = {
    "Jyotindra Dharva": {
        "gender": "Male",
        "designation": "HOD",
        "qualification": "Ph.D in Computer Science",
        "experience_years": 18,
        "dob": date(1975, 5, 15),
        "address": "Faculty Quarters, Ganpat University, Mehsana, Gujarat",
    },
    "Bhavesh Patel": {
        "gender": "Male",
        "designation": "HOD",
        "qualification": "Ph.D in Computer Applications",
        "experience_years": 15,
        "dob": date(1978, 8, 22),
        "address": "Faculty Quarters, Ganpat University, Mehsana, Gujarat",
    },
    "Jignesh Patel": {
        "gender": "Male",
        "designation": "Associate Professor",
        "qualification": "M.Tech in Computer Science",
        "experience_years": 12,
        "dob": date(1980, 3, 10),
        "address": "45, Patel Colony, Mehsana, Gujarat",
    },
    "Jagruti Patel": {
        "gender": "Female",
        "designation": "Assistant Professor",
        "qualification": "M.Tech in IT",
        "experience_years": 8,
        "dob": date(1985, 7, 20),
        "address": "23, Sunrise Society, Mehsana, Gujarat",
    },
    "Hiral Prajapati": {
        "gender": "Female",
        "designation": "Assistant Professor",
        "qualification": "M.Sc in Computer Science",
        "experience_years": 6,
        "dob": date(1988, 11, 5),
        "address": "78, New Society, Visnagar, Mehsana, Gujarat",
    },
    "Bharat Patel": {
        "gender": "Male",
        "designation": "Assistant Professor",
        "qualification": "M.Tech in Cyber Security",
        "experience_years": 7,
        "dob": date(1982, 9, 18),
        "address": "156, GIDC, Mehsana, Gujarat",
    },
    "Kashyap Patel": {
        "gender": "Male",
        "designation": "Assistant Professor",
        "qualification": "M.Tech in AI & ML",
        "experience_years": 5,
        "dob": date(1986, 2, 25),
        "address": "89, Patel Street, Kadi, Mehsana, Gujarat",
    },
    "Chetna Patel": {
        "gender": "Female",
        "designation": "Lecturer",
        "qualification": "M.Sc in IT",
        "experience_years": 4,
        "dob": date(1990, 6, 12),
        "address": "34, College Road, Mehsana, Gujarat",
    },
    "Meghna Patel": {
        "gender": "Female",
        "designation": "Assistant Professor",
        "qualification": "M.Tech in Information Management",
        "experience_years": 6,
        "dob": date(1987, 12, 8),
        "address": "67, Station Road, Unjha, Mehsana, Gujarat",
    },
    "Jigar Patel": {
        "gender": "Male",
        "designation": "Assistant Professor",
        "qualification": "M.Sc in Computer Applications",
        "experience_years": 3,
        "dob": date(1992, 4, 30),
        "address": "12, Patel Nagar, Mehsana, Gujarat",
    },
    "Dr. Pooja Pancholi": {
        "gender": "Female",
        "designation": "Professor",
        "qualification": "Ph.D in Computer Applications",
        "experience_years": 20,
        "dob": date(1972, 1, 15),
        "address": "Faculty Quarters, Ganpat University, Mehsana, Gujarat",
    },
    "Dr. Rajesh Kumar": {
        "gender": "Male",
        "designation": "Professor",
        "qualification": "Ph.D in Information Technology",
        "experience_years": 22,
        "dob": date(1970, 8, 20),
        "address": "Faculty Quarters, Ganpat University, Mehsana, Gujarat",
    },
    "Dr. Anjali Mehta": {
        "gender": "Female",
        "designation": "Associate Professor",
        "qualification": "Ph.D in Computer Science",
        "experience_years": 16,
        "dob": date(1976, 3, 10),
        "address": "Faculty Quarters, Ganpat University, Mehsana, Gujarat",
    },
    "Dr. Suresh Patel": {
        "gender": "Male",
        "designation": "Associate Professor",
        "qualification": "Ph.D in Cyber Security",
        "experience_years": 14,
        "dob": date(1979, 5, 25),
        "address": "Faculty Quarters, Ganpat University, Mehsana, Gujarat",
    },
    "Dr. Priya Sharma": {
        "gender": "Female",
        "designation": "Professor",
        "qualification": "Ph.D in AI & ML",
        "experience_years": 18,
        "dob": date(1974, 11, 8),
        "address": "Faculty Quarters, Ganpat University, Mehsana, Gujarat",
    },
}


class Command(BaseCommand):
    help = "Update faculty with complete profile data"

    def handle(self, *args, **options):
        self.stdout.write("Updating faculty profile data...\n")

        updated = 0
        for name, data in FACULTY_DATA.items():
            try:
                faculty = Faculty.objects.get(name=name)
                faculty.gender = data["gender"]
                faculty.designation = data["designation"]
                faculty.qualification = data["qualification"]
                faculty.experience_years = data["experience_years"]
                faculty.date_of_birth = data["dob"]
                faculty.address = data["address"]
                faculty.save()
                self.stdout.write(f"  Updated: {name} - {data['designation']}")
                updated += 1
            except Faculty.DoesNotExist:
                self.stdout.write(f"  Not found: {name}")

        self.stdout.write(self.style.SUCCESS(f"\nUpdated {updated} faculty members"))
        self.stdout.write(f"Total faculty: {Faculty.objects.count()}")
