import os
import random
import uuid
from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker

class Command(BaseCommand):
    help = 'Wipe and seed realistic academic data based on 11 courses and 20 faculties.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Initializing Smart Data Seeder...")
        fake = Faker('en_IN')  # Use Indian locale for appropriate names

        # Import models inside handle to ensure apps are loaded
        from academics.models import Course, Subject, Room, Shift
        from users.models import User, Student, Faculty

        # --- 1. WIPE OLD DATA ---
        self.stdout.write("Wiping old dummy data (Superusers are safe)...")
        # Delete old non-superuser accounts
        User.objects.filter(is_superuser=False, is_staff=False).delete()
        # Delete configuration
        Room.objects.all().delete()
        Course.objects.all().delete()
        Subject.objects.all().delete()
        Shift.objects.all().delete()

        # --- 2. CREATE SHIFTS & ROOMS ---
        self.stdout.write("Setting up 2 shifts (Morning, Noon) and 27 rooms...")
        
        shift_morning = Shift.objects.create(
            name="Morning Shift (UG)", 
            code="MORNING", 
            start_time="08:00", 
            end_time="13:00", 
            campus_branch="Main Campus"
        )
        shift_noon = Shift.objects.create(
            name="Noon Shift (PG)", 
            code="NOON", 
            start_time="12:00", 
            end_time="18:10", 
            campus_branch="Main Campus"
        )
        
        # 20 Classrooms
        for i in range(1, 21):
            floor = (i - 1) // 7 + 1  # 3 floors
            code = f"{chr(64+floor)}-{100 + i}"
            Room.objects.create(room_number=code, room_type="Classroom", capacity=60, campus_branch="Main Campus", has_projector=True)
            
        # 5 Labs
        for i in range(1, 6):
            Room.objects.create(room_number=f"Lab-{i}", room_type="Lab", capacity=60, campus_branch="Main Campus", has_computers=True)
            
        Room.objects.create(room_number="Seminar-Hall-1", room_type="Seminar Hall", capacity=200, campus_branch="Main Campus", has_projector=True)
        Room.objects.create(room_number="Lib-1", room_type="Library", capacity=100, campus_branch="Main Campus")

        # --- 3. CREATE COURSES & SUBJECTS ---
        self.stdout.write("Parsing 11 Courses and generating realistic subjects...")
        
        course_names = [
            "B.Sc. (CA&IT)", "B.Sc. IMS", "B.Sc. IT", "B.Sc. IT (CYBER SECURITY)", "B.Sc. IT (DATA SCIENCE)", 
            "INTE. DUAL DEGREE (BCA)-(MCA)", 
            "M.Sc. ARTIFICIAL INTELLIGENCE & MACHINE LEARNING", "M.Sc. IMS", "M.Sc. IT", "M.Sc. IT (CYBER SECURITY)", "MCA"
        ]

        generic_subjects = [
            "Programming Fundamentals", "Database Management Systems", "Web Technologies", "Operating Systems", 
            "Data Structures", "Computer Networks", "Software Engineering", "Mathematics for CS",
            "Cloud Computing", "Information Security", "Python Programming", "Java Development",
            "Machine Learning Basics", "Data Mining", "System Architecture", "Algorithms"
        ]

        courses_db = []
        for c_name in course_names:
            is_pg = "M.Sc." in c_name or c_name == "MCA"
            is_dual = "DUAL" in c_name
            
            if is_dual:
                total_sems = 10
                duration_years = 5
                shift_val = "MORNING"
            elif is_pg:
                total_sems = 4
                duration_years = 2
                shift_val = "NOON"
            else:
                total_sems = 6
                duration_years = 3
                shift_val = "MORNING"
                
            try:
                c_code = c_name.replace(" ", "_").replace(".", "").replace("(", "").replace(")", "").replace("&", "AND")[:10].upper()
                
                course = Course.objects.create(
                    name=c_name, 
                    code=c_code,
                    duration=duration_years,
                    total_semesters=total_sems,
                    department="Computer Science",
                    shift=shift_val,
                    credits=total_sems * 20
                )
                courses_db.append(course)

                # Generate Subjects per semester
                for sem in range(1, total_sems + 1):
                    if sem == total_sems:
                        # Final semester is always Industry Project
                        Subject.objects.create(
                            name="Full Time Industry Project & Internship",
                            code=f"{c_code}_PRJ{sem}"[:20],
                            course=course,
                            semester=sem,
                            credits=20,
                            campus_branch="Main Campus"
                        )
                    else:
                        # Normal semester: 4 random subjects
                        selected_subs = random.sample(generic_subjects, 4)
                        for idx, s_name in enumerate(selected_subs):
                            Subject.objects.create(
                                name=f"{s_name} - Part {sem}" if 'Part' not in s_name else s_name,
                                code=f"{c_code}_{sem}0{idx+1}"[:20],
                                course=course,
                                semester=sem,
                                credits=4,
                                campus_branch="Main Campus"
                            )
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating course {c_name}: {e}"))

        # --- 4. CREATE FACULTY (EXACTLY 20) ---
        self.stdout.write("Generating exactly 20 Faculty Profiles...")
        faculties = []
        for i in range(20):
            fname = fake.first_name()
            lname = fake.last_name()
            email = f"fac.{fname.lower()}.{lname.lower()}@gnu.ac.in"
            
            user = User.objects.create_user(
                email=email,
                password="password123", # standard default password
                role="faculty",
                is_active=True
            )
            
            # Divide shifts
            f_shift = "Morning" if i < 12 else "Noon"
            
            try:
                fac = Faculty.objects.create(
                    user=user,
                    employee_id=f"EMP{1000 + i}",
                    name=f"Prof. {fname} {lname}",
                    department="Computer Science",
                    working_shift=f_shift,
                    max_lectures_per_day=4,
                    working_days={"monday": True, "tuesday": True, "wednesday": True, "thursday": True, "friday": True, "saturday": False}
                )
                
                # Assign random subjects to faculty
                subs = list(Subject.objects.all())
                fac.subjects.add(*random.sample(subs, min(len(subs), 6)))
                faculties.append(fac)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating faculty {fname}: {e}"))

        # --- 5. CREATE STUDENTS (~500 limit) ---
        self.stdout.write("Generating ~500 Students with proper GUNI format and full academic history...")
        
        # Course to GUNI Program Code mapping
        program_codes = {
            "B.Sc. (CA&IT)": "032431",
            "B.Sc. IMS": "032432",
            "B.Sc. IT": "032433",
            "B.Sc. IT (CYBER SECURITY)": "032434",
            "B.Sc. IT (DATA SCIENCE)": "032435",
            "INTE. DUAL DEGREE (BCA)-(MCA)": "032436",
            "M.Sc. ARTIFICIAL INTELLIGENCE & MACHINE LEARNING": "032437",
            "M.Sc. IMS": "032438",
            "M.Sc. IT": "032439",
            "M.Sc. IT (CYBER SECURITY)": "032440",
            "MCA": "032441"
        }

        student_count = 0
        from academics.models import SemesterResult, SubjectResult
        
        for course in courses_db:
            p_code = program_codes.get(course.name, f"0325{random.randint(0,99):02}")
            active_sems = course.total_semesters
            
            for sem in range(1, active_sems + 1):
                # Generates ~8 students per semester class
                num_students = random.randint(6, 12) 
                # Year prefix based on semester (assuming 2 sems per year)
                # If sem 1-2: current batch
                # If sem 3-4: 1 year older
                year_offset = (sem - 1) // 2
                batch_year = timezone.now().year - year_offset
                year_prefix = str(batch_year)[2:]
                
                for i in range(1, num_students + 1):
                    try:
                        fname = fake.first_name()
                        lname = fake.last_name()
                        
                        # Format: Yr + ProgramCode + 3-digit Roll
                        # Ensure uniqueness by using semester and current loop index
                        roll_no_val = (sem * 100) + i
                        enroll_no = f"{year_prefix}{p_code}{roll_no_val:03}"
                        email = f"{enroll_no}@gnu.ac.in"
                        
                        user = User.objects.create_user(
                            email=email,
                            password="password123",
                            role="student",
                            is_active=True
                        )
                        
                        student = Student.objects.create(
                            user=user,
                            enrollment_no=enroll_no,
                            name=f"{fname} {lname}",
                            email=email,
                            phone=fake.phone_number()[:15],
                            course=course,
                            semester=sem,
                            current_semester=sem,
                            cgpa=0.0, # Will be updated after results
                            is_face_registered=False,
                            batch=random.choice(["A", "B"]),
                            admission_year=batch_year,
                            branch="Main Campus"
                        )

                        # --- GENERATE HISTORY (Previous Semesters) ---
                        total_sgpa = 0
                        for prev_sem in range(1, sem):
                            sgpa = round(random.uniform(6.5, 9.8), 2)
                            total_sgpa += sgpa
                            res = SemesterResult.objects.create(
                                student=student,
                                semester=prev_sem,
                                sgpa=sgpa,
                                total_marks=500,
                                obtained_marks=int(sgpa * 50),
                                percentage=sgpa * 10,
                                status='completed',
                                year=batch_year + (prev_sem - 1) // 2
                            )
                            
                            # Add some subject results for this semester
                            subs = Subject.objects.filter(course=course, semester=prev_sem)
                            for sub in subs:
                                marks = random.randint(60, 98)
                                SubjectResult.objects.create(
                                    semester_result=res,
                                    subject=sub,
                                    total_marks=marks,
                                    is_passed=True,
                                    grade='A+' if marks > 90 else 'A' if marks > 80 else 'B'
                                )
                        
                        if sem > 1:
                            student.cgpa = round(total_sgpa / (sem - 1), 2)
                            student.save()

                        student_count += 1
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"Error creating student {enroll_no}: {e}"))

        self.stdout.write(self.style.SUCCESS(f"Successfully generated 27 Rooms, 2 Shifts, 11 Courses, 20 Faculties, and {student_count} Students with full academic history!"))
