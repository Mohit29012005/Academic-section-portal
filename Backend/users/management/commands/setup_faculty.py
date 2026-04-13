import random
import uuid
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Faculty
from academics.models import Subject, Course

User = get_user_model()

class Command(BaseCommand):
    help = 'Setup specific faculty members with roles and auto-assigned subjects'

    def handle(self, *args, **options):
        faculty_names = [
            "Hiral Prajapati", "Pooja Pancholi", "Jagruti Patel", 
            "Narendra Patel", "Kashyap Patel", "Meghna Patel", 
            "Jigar Patel", "Bhavesh Patel", "Jignesh Patel", 
            "Sachin", "Jyotindra Dharwa", "Chetna Patel"
        ]

        self.stdout.write("Clearing existing faculty records...")
        # Clear existing faculty profiles and their users (only those with faculty role)
        # Note: We keep the superuser
        faculty_users = User.objects.filter(role='faculty')
        faculty_users.delete()

        all_subjects = list(Subject.objects.all())
        if not all_subjects:
            self.stdout.write(self.style.ERROR("No subjects found in DB. Please run academic seeders first."))
            return

        all_courses = list(Course.objects.all())
        
        assigned_subjects_count = 0

        for i, name in enumerate(faculty_names):
            username = name.lower().replace(" ", ".")
            email = f"{username}@ganpatuniversity.ac.in"
            
            # Create User
            user = User.objects.create_user(
                email=email,
                password="password123",
                role='faculty'
            )

            # Determine Shift (Alternate for variety)
            shift = "Morning" if i % 2 == 0 else "Noon"
            
            # Create Faculty Profile
            faculty = Faculty.objects.create(
                user=user,
                name=name,
                email=email,
                employee_id=f"GUNI{1000 + i}",
                department="Computer Applications",
                working_shift=shift,
                is_hod=(name == "Jyotindra Dharwa"),
                # Randomly make some class teachers
                is_class_teacher=(i < 4), 
                class_course=random.choice(all_courses) if i < 4 else None,
                class_semester=random.randint(1, 6) if i < 4 else 1,
                working_days=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
            )

            # Assign 2-3 random subjects
            num_subjects = random.randint(2, 3)
            # Pick subjects that aren't already heavily assigned if possible
            sampled_subjects = random.sample(all_subjects, num_subjects)
            faculty.subjects.set(sampled_subjects)
            assigned_subjects_count += num_subjects

            status = " [HOD]" if faculty.is_hod else ""
            status += " [Class Teacher]" if faculty.is_class_teacher else ""
            self.stdout.write(self.style.SUCCESS(f"Created Faculty: {name}{status} ({shift})"))

        self.stdout.write(self.style.SUCCESS(f"Successfully set up {len(faculty_names)} faculty members."))
