import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from academics.models import Course, Subject, SemesterResult, SubjectResult
from users.models import User, Student

class Command(BaseCommand):
    help = 'Seed real student data from images for Semester 6 B.Sc. (CA&IT)'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding Real Class Data...")

        # 1. Get or Create Course
        course_name = "B.Sc. (CA&IT)"
        course_code = "BSC_CAANDI"
        
        course, created = Course.objects.get_or_create(
            code=course_code,
            defaults={
                'name': course_name,
                'duration': 3,
                'total_semesters': 6,
                'department': "Computer Science",
                'shift': "MORNING",
                'credits': 120
            }
        )
        
        if created:
            self.stdout.write(f"Created course {course_name}")
        else:
            self.stdout.write(f"Using existing course {course_name}")

        # 2. Ensure Subjects exist for results
        self.ensure_subjects(course)

        # 3. Student Data
        student_data = [
            ("23032431029", "Vansh patel"),
            ("23032431044", "Adarsh sharma"),
            ("23032431046", "Darshil Vipulbhai Thummar"),
            ("23032431054", "Hemeen Patel"),
            ("23032431003", "kautil chauhan"),
            ("23032431015", "yash panchal"),
            ("23032431032", "prajapati divyansu bharatbhai"),
            ("23032431010", "kalal Nikhil"),
            ("23032431047", "Akshat Trivedi"),
            ("23032431006", "Aditya Dhanesha"),
            ("23032431014", "Muskan Andani"),
            ("23032431030", "Rudra Pathak"),
            ("23032431051", "Sukhdeep Yadav"),
            ("23032431013", "Kavya Mandli"),
            ("23032431039", "RATHOD JAYESH RAJESHBHAI"),
            ("23032431009", "JOSHI KEYUR HASMUKHBHAI"),
            ("23032431036", "Vaibhav Prajapati"),
            ("22032431036", "PATEL JIL KAMLESHBHAI"),
            ("23032431037", "RABARI SMITKUMAR BHARATBHAI"),
            ("23034431028", "Srushti patel"),
            ("23032431022", "PATEL KRINA KALPESH"),
            ("23032431008", "Hariyani Khushi Ketankumar"),
            ("23032431035", "Prajapati Priyal Jayanti"),
            ("23032431038", "Hemen Ranpura"),
            ("23032431016", "Patel Aastha Jigneshkumar"),
            ("23032431023", "Patel Kush Manish"),
            ("23032431020", "Patel Jay Mukeshbhai"),
            ("23032431041", "Sathavara Marmik Sachinkumar"),
            ("23032431021", "Patel Jeet Mukeshbhai"),
            ("23032431052", "Limbachiya Dhruv Mehulkumar"),
            ("23032431043", "Smit Sagarbhai Shah"),
            ("23032431045", "Dashang Krunalkumar Soni"),
            ("23032431011", "luhar anish shantilal"),
            ("23032431018", "Patel Dharm TimirKumar"),
            ("23032431040", "Rathod Shubham Jagdishbhai"),
            ("23032431002", "Ansh A Patel"),
            ("23032431024", "Nandini Patel"),
            ("23032431017", "Anjali Patel"),
            ("23032431001", "Adarsh singh"),
            ("23032431034", "Mohit Prajapati"),
            ("23032431019", "Dhruv patel"),
            ("23032431004", "smit chauhan"),
            ("23032431055", "Kachhia Himadri Jigneshkumar"),
            ("23032431033", "Mahek Jayendrabhai Prajapati"),
            ("23032431049", "Het upadhyay"),
            ("23032431050", "Kaushal Vyas"),
            ("23032431005", "harsh dhaduk"),
            ("23032431056", "Abhi pethani"),
            ("23032431025", "Prem Patel"),
            ("23032431027", "Priyank Patel"),
            ("23032431042", "Sanjay Sengar"),
            ("23032431057", "shah jainel arihantkumar"),
            ("23032431053", "Ankit Das"),
            ("23032431031", "Rahul pavar"),
        ]

        for enroll, name in student_data:
            email = f"{enroll}@gnu.ac.in"
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'role': 'student',
                    'is_active': True
                }
            )
            if created:
                user.set_password("password123")
                user.save()
            
            student, s_created = Student.objects.update_or_create(
                user=user,
                defaults={
                    'enrollment_no': enroll,
                    'name': name,
                    'email': email,
                    'course': course,
                    'semester': 6,
                    'current_semester': 6,
                    'admission_year': int("20" + enroll[:2]) if enroll[:2].isdigit() else 2023,
                    'branch': "Main Campus",
                    'status': "Active"
                }
            )
            
            # 4. Generate Results for Semesters 1 to 5
            self.generate_results(student, course)
            
        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {len(student_data)} students with results for 5 semesters."))

    def ensure_subjects(self, course):
        generic_subjects = [
            "Programming in C", "Database Management", "Web Development", "Operating Systems", 
            "Data Structures", "Computer Networks", "Software Engineering", "Discreet Maths",
            "Java Programming", "Information Security", "Python Programming", "Mobile Apps"
        ]
        for sem in range(1, 7):
            existing_subs = Subject.objects.filter(course=course, semester=sem)
            if not existing_subs.exists():
                for i in range(4):
                    Subject.objects.create(
                        name=f"{random.choice(generic_subjects)} - Sem {sem}",
                        code=f"{course.code}_S{sem}_{i+1}",
                        course=course,
                        semester=sem,
                        credits=4
                    )

    def generate_results(self, student, course):
        for sem in range(1, 6):
            sgpa = round(random.uniform(6.5, 9.5), 2)
            res, created = SemesterResult.objects.get_or_create(
                student=student,
                semester=sem,
                defaults={
                    'sgpa': sgpa,
                    'total_marks': 500,
                    'obtained_marks': int(sgpa * 50),
                    'percentage': sgpa * 10,
                    'status': 'completed',
                    'year': student.admission_year + (sem - 1) // 2
                }
            )
            if created:
                # Add subject results
                subjects = Subject.objects.filter(course=course, semester=sem)
                for sub in subjects:
                    total = random.randint(60, 95)
                    SubjectResult.objects.create(
                        semester_result=res,
                        subject=sub,
                        internal_marks=random.randint(20, 30),
                        external_marks=total - 30,
                        total_marks=total,
                        is_passed=True,
                        grade='A' if total > 80 else 'B'
                    )

        # Update student CGPA
        all_res = SemesterResult.objects.filter(student=student)
        if all_res.exists():
            student.cgpa = sum(r.sgpa for r in all_res) / all_res.count()
            student.save()
