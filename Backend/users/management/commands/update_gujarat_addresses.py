import random
from django.core.management.base import BaseCommand
from django.db import connection


GUJARAT_ADDRESSES = [
    "12, SG Highway, Satellite, Ahmedabad",
    "45, Navrangpura Main Road, Ahmedabad",
    "78, Bodakdev, Ahmedabad",
    "23, Vastrapur Lake Road, Ahmedabad",
    "156, Prahlad Nagar, Ahmedabad",
    "34, Bodakdev Cross Road, Ahmedabad",
    "89, Thaltej, Ahmedabad",
    "67, Gota, Ahmedabad",
    "91, Bopal, Ahmedabad",
    "43, Shela, Ahmedabad",
    "28, Iscon Cross Road, Ahmedabad",
    "56, Paldi, Ahmedabad",
    "102, Ellisbridge, Ahmedabad",
    "78, Maninagar, Ahmedabad",
    "134, Naroda, Ahmedabad",
    "67, Bapunagar, Ahmedabad",
    "89, Sabarmati, Ahmedabad",
    "45, Chandkheda, Ahmedabad",
    "112, Ghatlodia, Ahmedabad",
    "23, Khadia, Ahmedabad",
    "34, Radhanpur Road, Mehsana",
    "67, Visnagar Road, Mehsana",
    "12, Kherva Cross Road, Mehsana",
    "89, Unjha Highway, Mehsana",
    "45, Mehsana-Gozaria Road, Mehsana",
    "78, Kherva, Mehsana",
    "23, Kherva University Road, Mehsana",
    "56, Ganpat University Campus, Kherva, Mehsana",
    "91, Vijapur Road, Mehsana",
    "34, Jotana, Mehsana",
    "67, Kherva Village, Mehsana",
    "89, Bujarang, Mehsana",
    "45, Mesar, Mehsana",
    "12, Dediyasan, Mehsana",
    "78, Gundi, Mehsana",
    "23, Linch, Mehsana",
    "56, Umeta, Mehsana",
    "34, Kherva, Mehsana",
    "91, Siddhpur Road, Mehsana",
    "67, Modhera Road, Mehsana",
    "89, Dumas Road, Surat",
    "45, Adajan, Surat",
    "123, Vesu, Surat",
    "67, Piplod, Surat",
    "34, City Light Road, Surat",
    "91, Udhana, Surat",
    "56, Kamrej, Surat",
    "78, Majura Gate, Surat",
    "23, Sagrampura, Surat",
    "45, Parle Point, Surat",
    "78, Alkapuri, Vadodara",
    "34, Fatehgunj, Vadodara",
    "56, Akota, Vadodara",
    "91, Sayajigunj, Vadodara",
    "23, Manjalpur, Vadodara",
    "67, Gotri, Vadodara",
    "45, Pratapnagar, Vadodara",
    "89, Nizampura, Vadodara",
    "12, Ellora Park, Vadodara",
    "56, Tandalja, Vadodara",
    "34, Kalawad Road, Rajkot",
    "67, University Road, Rajkot",
    "89, 150 Feet Ring Road, Rajkot",
    "23, Mavdi, Rajkot",
    "45, Kothariya, Rajkot",
    "91, Raiya Road, Rajkot",
    "78, Bhakti Nagar, Rajkot",
    "56, Arya Nagar, Rajkot",
    "12, Wagheshwar, Rajkot",
    "34, Ramnathpara, Rajkot",
    "67, Krishnagar, Bhavnagar",
    "34, Waghawadi Road, Bhavnagar",
    "89, Sihor, Bhavnagar",
    "23, Gariyadhar, Bhavnagar",
    "45, Talaja Road, Bhavnagar",
    "91, Kundla, Bhavnagar",
    "56, Botad, Bhavnagar",
    "78, Mahuva, Bhavnagar",
    "12, Palitana, Bhavnagar",
    "34, Ghogha, Bhavnagar",
    "89, Ravalia Road, Jamnagar",
    "45, Gandhi Chowk, Jamnagar",
    "67, Bedi, Jamnagar",
    "23, Shyamaprasad Mukherjee Road, Jamnagar",
    "91, Harshad Colony, Jamnagar",
    "34, Sakhariya, Jamnagar",
    "56, Dwarka Road, Jamnagar",
    "78, Gondal Road, Jamnagar",
    "12, Virvav, Jamnagar",
    "23, Nalini Sarovar, Jamnagar",
    "34, Sector 21, Gandhinagar",
    "67, Sector 7, Gandhinagar",
    "89, Sector 12, Gandhinagar",
    "23, Adalaj, Gandhinagar",
    "45, Kalol Road, Gandhinagar",
    "91, Chiloda, Gandhinagar",
    "56, Sector 30, Gandhinagar",
    "78, Pethapur, Gandhinagar",
    "12, Khekra, Gandhinagar",
    "34, Dholera Road, Gandhinagar",
    "78, Bhuj, Kutch",
    "34, Mandvi Beach Road, Kutch",
    "67, Anjar, Kutch",
    "89, Bhachau, Kutch",
    "23, Gandhidham, Kutch",
    "45, Nakhatrana, Kutch",
    "91, Kera, Kutch",
    "56, Lakhpat, Kutch",
    "12, Mundra Port, Kutch",
    "78, Naliya, Kutch",
    "34, Himatnagar, Sabarkantha",
    "67, Idar, Sabarkantha",
    "89, Khedbrahma, Sabarkantha",
    "23, Prantij, Sabarkantha",
    "45, Talod, Sabarkantha",
    "91, Vijayanagar, Sabarkantha",
    "56, Dhansura, Sabarkantha",
    "78, Bayad, Sabarkantha",
    "12, Malpur, Sabarkantha",
    "34, Bhiloda, Sabarkantha",
]

BRANCHES = [
    "Ganpat University, Kherva, Mehsana",
    "Ganpat University, Kherva, Mehsana",
    "Ganpat University, Kherva, Mehsana",
    "Ganpat University, Kherva, Mehsana",
    "Ganpat University, Kherva, Mehsana",
    "Ganpat University, Kherva, Mehsana",
    "Ganpat University, Kherva, Mehsana",
    "Ganpat University, Kherva, Mehsana",
    "Ganpat University, Kherva, Mehsana",
    "Ganpat University, Kherva, Mehsana",
    "Ganpat University, Kherva, Mehsana",
    "Ganpat University, Kherva, Mehsana",
    "Ganpat University, Kherva, Mehsana",
    "Ganpat University, Kherva, Mehsana",
    "Ganpat University, Kherva, Mehsana",
    "Ganpat University - Ahmedabad Campus, Ahmedabad",
    "Ganpat University - Ahmedabad Campus, Ahmedabad",
    "Ganpat University - Ahmedabad Campus, Ahmedabad",
    "Ganpat University - Ahmedabad Campus, Ahmedabad",
]


class Command(BaseCommand):
    help = "Update student and faculty addresses with realistic Gujarat addresses"

    def handle(self, *args, **options):
        from users.models import Student, Faculty

        def random_address():
            return random.choice(GUJARAT_ADDRESSES)

        def random_branch():
            return random.choice(BRANCHES)

        # Update students one by one (fast enough for ~2000 records)
        student_count = 0
        for student in Student.objects.all():
            student.address = random_address()
            student.branch = random_branch()
            student.save(update_fields=["address", "branch"])
            student_count += 1
            if student_count % 500 == 0:
                self.stdout.write(f"  Updated {student_count} students...")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nUpdated {student_count} students with Gujarat addresses"
            )
        )

        # Update faculty
        faculty_count = 0
        for faculty in Faculty.objects.all():
            faculty.address = random_address()
            faculty.branch = random_branch()
            faculty.save(update_fields=["address", "branch"])
            faculty_count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Updated {faculty_count} faculty members")
        )

        # Show sample
        self.stdout.write(self.style.SUCCESS("\n--- Sample Student Data ---"))
        for s in Student.objects.all()[:3]:
            self.stdout.write(f"  {s.name}: {s.address}")
            self.stdout.write(f"    Branch: {s.branch}")

        self.stdout.write(self.style.SUCCESS("\n--- Sample Faculty Data ---"))
        for f in Faculty.objects.all()[:3]:
            self.stdout.write(f"  {f.name}: {f.address}")
            self.stdout.write(f"    Branch: {f.branch}")
