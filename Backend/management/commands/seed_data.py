from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Student, Faculty, Admin as AdminModel
from academics.models import Course, Subject, SemesterResult

from attendance.models import Attendance, ClassSession

from system.models import SystemSettings
from datetime import datetime, time, timedelta, date
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with comprehensive initial data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...\n')

        # Clear existing data
        self.stdout.write('Clearing existing data...')
        User.objects.all().delete()
        Course.objects.all().delete()
        SystemSettings.objects.all().delete()

        # Create in order
        courses = self.create_courses()
        subjects = self.create_subjects(courses)
        students = self.create_students(courses)
        faculty_list = self.create_faculty(subjects)
        admin = self.create_admin()
        self.create_semester_results(students)
        sessions = self.create_class_sessions(subjects, faculty_list)
        self.create_attendance(students, subjects, faculty_list)
        exams = self.create_exams(subjects, courses, faculty_list)
        self.create_exam_questions(exams)
        assignments = self.create_assignments(subjects, faculty_list)
        self.create_assignment_submissions(assignments, students)
        self.create_system_settings()

        self.stdout.write(self.style.SUCCESS('\n✅ Database seeded successfully!'))
        self.stdout.write(self.style.SUCCESS('Test Credentials:'))
        self.stdout.write('  Student: arjun@ampics.edu / student123')
        self.stdout.write('  Faculty: pooja.pancholi@ampics.edu / faculty123')
        self.stdout.write('  Admin:   admin@ampics.edu / admin123\n')

    def create_courses(self):
        self.stdout.write('  Creating courses...')
        data = [
            ('MCA', 'Master of Computer Applications', 2, 4, 'Computer Applications'),
            ('BCA', 'Bachelor of Computer Applications', 3, 6, 'Computer Applications'),
            ('BSC-IT', 'Bachelor of Science in IT', 3, 6, 'Information Technology'),
            ('BSC-IMS', 'Bachelor of Science in IMS', 3, 6, 'Information Management'),
            ('BSC-CYBER', 'Bachelor of Science in Cyber Security', 3, 6, 'Cyber Security'),
            ('BSC-AIML', 'Bachelor of Science in AI ML', 3, 6, 'AI & ML'),
            ('MSC-IT', 'Master of Science in IT', 2, 4, 'Information Technology'),
            ('MSC-IMS', 'Master of Science in IMS', 2, 4, 'Information Management'),
            ('MSC-CYBER', 'Master of Science in Cyber Security', 2, 4, 'Cyber Security'),
            ('MSC-AIML', 'Master of Science in AI ML', 2, 4, 'AI & ML'),
            ('BTECH-IT', 'Bachelor of Technology in IT', 4, 8, 'Information Technology'),
            ('BTECH-CSE', 'Bachelor of Technology in CSE', 4, 8, 'Computer Science'),
        ]
        courses = {}
        for code, name, duration, semesters, dept in data:
            c = Course.objects.create(code=code, name=name, duration=duration,
                                      total_semesters=semesters, department=dept)
            courses[code] = c
        self.stdout.write(f'    Created {len(courses)} courses')
        return courses

    def create_subjects(self, courses):
        self.stdout.write('  Creating subjects...')
        data = [
            ('CS101', 'Data Structures', 'MCA', 1, 4),
            ('CS102', 'Algorithms', 'MCA', 1, 4),
            ('CS201', 'Database Systems', 'MCA', 2, 4),
            ('CS202', 'Web Development', 'MCA', 2, 4),
            ('CS301', 'Operating Systems', 'BCA', 3, 4),
            ('CS302', 'Computer Networks', 'BCA', 3, 4),
            ('CS401', 'Software Engineering', 'BTECH-CSE', 4, 4),
            ('AI501', 'Machine Learning', 'BSC-AIML', 5, 4),
            ('AI502', 'Deep Learning', 'BSC-AIML', 5, 4),
            ('CY401', 'Cryptography', 'BSC-CYBER', 4, 4),
            ('CY402', 'Network Security', 'BSC-CYBER', 4, 4),
            ('IT501', 'Cloud Computing', 'BTECH-IT', 5, 4),
            ('IT502', 'Mobile App Development', 'BTECH-IT', 5, 4),
            ('CS501', 'Artificial Intelligence', 'MCA', 3, 4),
            ('CS502', 'Data Mining', 'MCA', 3, 4),
        ]
        subjects = {}
        for code, name, course_code, sem, credits in data:
            s = Subject.objects.create(code=code, name=name, course=courses[course_code],
                                       semester=sem, credits=credits)
            subjects[code] = s
        self.stdout.write(f'    Created {len(subjects)} subjects')
        return subjects

    def create_students(self, courses):
        self.stdout.write('  Creating students...')
        data = [
            ('23032431001', 'Arjun Kumar', 'arjun@ampics.edu', 'MCA', 2, 8.5, '9876543001'),
            ('23032431002', 'Priya Sharma', 'priya@ampics.edu', 'MCA', 2, 9.2, '9876543002'),
            ('23032431003', 'Rahul Singh', 'rahul@ampics.edu', 'BCA', 4, 7.8, '9876543003'),
            ('23032431004', 'Sneha Patel', 'sneha@ampics.edu', 'BSC-IT', 3, 8.1, '9876543004'),
            ('23032431005', 'Amit Verma', 'amit@ampics.edu', 'BTECH-CSE', 5, 8.9, '9876543005'),
            ('23032431006', 'Neha Gupta', 'neha@ampics.edu', 'MCA', 1, 8.0, '9876543006'),
            ('23032431007', 'Vikram Rao', 'vikram@ampics.edu', 'BCA', 3, 7.5, '9876543007'),
            ('23032431008', 'Anjali Shah', 'anjali@ampics.edu', 'BSC-AIML', 2, 8.7, '9876543008'),
            ('23032431009', 'Karan Mehta', 'karan@ampics.edu', 'BTECH-IT', 4, 8.3, '9876543009'),
            ('23032431010', 'Divya Joshi', 'divya@ampics.edu', 'MSC-CYBER', 2, 9.0, '9876543010'),
        ]
        students = []
        for enr, name, email, course_code, sem, cgpa, phone in data:
            course = courses[course_code]
            user = User.objects.create_user(email=email, password='student123', role='student')
            student = Student.objects.create(
                user=user, enrollment_no=enr, name=name, email=email, phone=phone,
                course=course, semester=sem, current_semester=sem,
                total_semesters=course.total_semesters, cgpa=cgpa,
            )
            students.append(student)
        self.stdout.write(f'    Created {len(students)} students')
        return students

    def create_faculty(self, subjects):
        self.stdout.write('  Creating faculty...')
        data = [
            ('EMP001', 'Dr. Pooja Pancholi', 'pooja.pancholi@ampics.edu', 'Computer Applications',
             ['CS101', 'CS102'], '9876543101'),
            ('EMP002', 'Dr. Rajesh Kumar', 'rajesh.kumar@ampics.edu', 'Information Technology',
             ['CS201', 'CS202'], '9876543102'),
            ('EMP003', 'Dr. Anjali Mehta', 'anjali.mehta@ampics.edu', 'Computer Science',
             ['CS301', 'CS302'], '9876543103'),
            ('EMP004', 'Dr. Suresh Patel', 'suresh.patel@ampics.edu', 'Cyber Security',
             ['CY401', 'CY402'], '9876543104'),
            ('EMP005', 'Dr. Priya Sharma', 'priya.sharma@ampics.edu', 'AI & ML',
             ['AI501', 'AI502'], '9876543105'),
        ]
        faculty_list = []
        for emp_id, name, email, dept, subj_codes, phone in data:
            user = User.objects.create_user(email=email, password='faculty123', role='faculty')
            fac = Faculty.objects.create(
                user=user, employee_id=emp_id, name=name, email=email,
                phone=phone, department=dept,
            )
            for code in subj_codes:
                if code in subjects:
                    fac.subjects.add(subjects[code])
            faculty_list.append(fac)
        self.stdout.write(f'    Created {len(faculty_list)} faculty members')
        return faculty_list

    def create_admin(self):
        self.stdout.write('  Creating admin...')
        user = User.objects.create_user(
            email='admin@ampics.edu', password='admin123', role='admin',
            is_staff=True, is_superuser=True,
        )
        admin = AdminModel.objects.create(
            user=user, admin_id='ADM001', name='Admin User',
            email='admin@ampics.edu', phone='9876543200',
        )
        self.stdout.write('    Created 1 admin')
        return admin

    def create_semester_results(self, students):
        self.stdout.write('  Creating semester results...')
        count = 0
        for student in students:
            for sem in range(1, student.total_semesters + 1):
                if sem < student.current_semester:
                    sgpa = round(random.uniform(7.0, 9.5), 2)
                    st = 'completed'
                    year = 2023 + (sem - 1) // 2
                elif sem == student.current_semester:
                    sgpa = round(random.uniform(7.5, 9.8), 2)
                    st = 'completed'
                    year = 2024
                else:
                    sgpa = None
                    st = 'remaining'
                    year = None
                SemesterResult.objects.create(
                    student=student, semester=sem, sgpa=sgpa, status=st, year=year,
                )
                count += 1
        # Override Arjun's results specifically
        arjun = students[0]
        SemesterResult.objects.filter(student=arjun, semester=1).update(sgpa=8.2, status='completed', year=2023)
        SemesterResult.objects.filter(student=arjun, semester=2).update(sgpa=8.8, status='completed', year=2024)
        for sem in range(3, arjun.total_semesters + 1):
            SemesterResult.objects.filter(student=arjun, semester=sem).update(sgpa=None, status='remaining', year=None)
        self.stdout.write(f'    Created {count} semester results')

    def create_class_sessions(self, subjects, faculty_list):
        self.stdout.write('  Creating class sessions...')
        today = date.today()
        # Find next Monday
        days_until_monday = (7 - today.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7
        next_monday = today + timedelta(days=days_until_monday - today.weekday())

        sessions_data = [
            (subjects['CS101'], faculty_list[0], 'Section A', 0, time(9, 0), 'Room 101', 90),
            (subjects['CS201'], faculty_list[1], 'Section A', 0, time(11, 0), 'Room 102', 90),
            (subjects['CS102'], faculty_list[0], 'Section B', 1, time(14, 0), 'Room 205', 90),
            (subjects['CS202'], faculty_list[1], 'Section B', 1, time(16, 0), 'Room 206', 90),
            (subjects['CS301'], faculty_list[2], 'Section A', 2, time(10, 0), 'Room 301', 90),
            (subjects['CS101'], faculty_list[0], 'Section B', 2, time(14, 0), 'Room 102', 90),
            (subjects['CS302'], faculty_list[2], 'Section A', 3, time(9, 0), 'Room 302', 90),
            (subjects['CS201'], faculty_list[1], 'Section C', 3, time(15, 0), 'Room 310', 90),
            (subjects['CS102'], faculty_list[0], 'Section A', 4, time(10, 0), 'Room 201', 90),
            (subjects['CS202'], faculty_list[1], 'Section A', 4, time(13, 0), 'Room 203', 90),
        ]
        sessions = []
        for subj, fac, section, day_offset, t, room, dur in sessions_data:
            session_date = today + timedelta(days=day_offset - today.weekday())
            if session_date < today:
                session_date += timedelta(days=7)
            s = ClassSession.objects.create(
                subject=subj, faculty=fac, section=section,
                date=session_date, time=t, room=room, duration=dur,
            )
            sessions.append(s)
        self.stdout.write(f'    Created {len(sessions)} class sessions')
        return sessions

    def create_attendance(self, students, subjects, faculty_list):
        self.stdout.write('  Creating attendance records...')
        count = 0
        today = date.today()
        subject_list = list(subjects.values())[:6]
        faculty_map = {
            subjects.get('CS101'): faculty_list[0],
            subjects.get('CS102'): faculty_list[0],
            subjects.get('CS201'): faculty_list[1],
            subjects.get('CS202'): faculty_list[1],
            subjects.get('CS301'): faculty_list[2],
            subjects.get('CS302'): faculty_list[2],
        }
        for i in range(30):
            student = students[i % len(students)]
            subj = subject_list[i % len(subject_list)]
            fac = faculty_map.get(subj, faculty_list[0])
            att_date = today - timedelta(days=random.randint(1, 60))
            att_status = random.choice(['present', 'present', 'present', 'absent'])
            method = random.choice(['manual', 'ml_face_recognition'])
            confidence = round(random.uniform(85, 99), 2) if method == 'ml_face_recognition' else None

            Attendance.objects.create(
                student=student, subject=subj, date=att_date,
                status=att_status, marked_by=fac, method=method,
                confidence_score=confidence,
            )
            count += 1
        self.stdout.write(f'    Created {count} attendance records')

    def create_exams(self, subjects, courses, faculty_list):
        self.stdout.write('  Creating exams...')
        today = date.today()
        data = [
            ('Mid-Term Examination - Data Structures', 'CS101', 'MCA', 0, time(10, 0), 120, 'published',
             today + timedelta(days=4)),
            ('End-Term Examination - Algorithms', 'CS102', 'MCA', 0, time(14, 0), 180, 'published',
             today + timedelta(days=40)),
            ('Mid-Term Examination - Database Systems', 'CS201', 'MCA', 1, time(14, 0), 120, 'draft',
             today + timedelta(days=7)),
            ('End-Term Examination - Web Development', 'CS202', 'MCA', 1, time(10, 0), 180, 'published',
             today + timedelta(days=42)),
            ('Mid-Term Examination - Operating Systems', 'CS301', 'BCA', 2, time(11, 0), 120, 'published',
             today + timedelta(days=9)),
        ]
        exams = []
        for title, subj_code, course_code, fac_idx, t, dur, status, exam_date in data:
            exam = Exam.objects.create(
                title=title, subject=subjects[subj_code], course=courses[course_code],
                faculty=faculty_list[fac_idx], date=exam_date, time=t,
                duration=dur, total_marks=100, passing_marks=40, status=status,
            )
            exams.append(exam)
        self.stdout.write(f'    Created {len(exams)} exams')
        return exams

    def create_exam_questions(self, exams):
        self.stdout.write('  Creating exam questions...')
        count = 0
        questions_bank = {
            0: [  # Data Structures exam
                ("What is the time complexity of binary search?",
                 ["O(1)", "O(log n)", "O(n)", "O(n²)"], "O(log n)"),
                ("Which data structure uses LIFO principle?",
                 ["Queue", "Stack", "Tree", "Graph"], "Stack"),
                ("What is the maximum number of nodes in a binary tree of height h?",
                 ["h", "2^h", "2^h - 1", "2^(h+1) - 1"], "2^(h+1) - 1"),
                ("Which traversal visits root first?",
                 ["Inorder", "Preorder", "Postorder", "Level order"], "Preorder"),
                ("What is a complete binary tree?",
                 ["All leaves at same level", "Every node has 2 children",
                  "All levels full except possibly last", "Height balanced tree"],
                 "All levels full except possibly last"),
                ("Hash table worst case search is:",
                 ["O(1)", "O(log n)", "O(n)", "O(n log n)"], "O(n)"),
                ("Which sorting algorithm is stable?",
                 ["Quick Sort", "Heap Sort", "Merge Sort", "Selection Sort"], "Merge Sort"),
                ("AVL tree is a type of:",
                 ["Binary tree", "Self-balancing BST", "Heap", "Trie"], "Self-balancing BST"),
                ("Queue follows which principle?",
                 ["LIFO", "FIFO", "LILO", "Random"], "FIFO"),
                ("Space complexity of merge sort is:",
                 ["O(1)", "O(log n)", "O(n)", "O(n²)"], "O(n)"),
            ],
            1: [  # Algorithms exam
                ("What is the time complexity of quicksort average case?",
                 ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], "O(n log n)"),
                ("Dijkstra's algorithm is used for:",
                 ["Sorting", "Shortest path", "MST", "Searching"], "Shortest path"),
                ("Dynamic programming uses:",
                 ["Greedy choice", "Optimal substructure", "Backtracking", "Brute force"],
                 "Optimal substructure"),
                ("BFS uses which data structure?",
                 ["Stack", "Queue", "Heap", "Array"], "Queue"),
                ("Kruskal's algorithm finds:",
                 ["Shortest path", "MST", "Maximum flow", "Topological sort"], "MST"),
                ("Master theorem is used to solve:",
                 ["Linear equations", "Recurrence relations", "Graph problems", "Sorting"],
                 "Recurrence relations"),
                ("Greedy algorithm always gives optimal solution?",
                 ["Yes always", "No never", "Depends on problem", "Only for sorting"],
                 "Depends on problem"),
                ("DFS uses which data structure?",
                 ["Queue", "Stack", "Heap", "Hash table"], "Stack"),
                ("What is the best case of bubble sort?",
                 ["O(n²)", "O(n log n)", "O(n)", "O(1)"], "O(n)"),
                ("Divide and conquer breaks problem into:",
                 ["Equal parts", "Smaller subproblems", "Sequential steps", "Random parts"],
                 "Smaller subproblems"),
            ],
        }
        for idx, exam in enumerate(exams):
            qs = questions_bank.get(idx, questions_bank[0])
            for i, (text, options, answer) in enumerate(qs):
                ExamQuestion.objects.create(
                    exam=exam, question_text=text, question_type='mcq',
                    options=options, correct_answer=answer, marks=10, order=i + 1,
                )
                count += 1
        self.stdout.write(f'    Created {count} exam questions')

    def create_assignments(self, subjects, faculty_list):
        self.stdout.write('  Creating assignments...')
        today = date.today()
        data = [
            ('Sorting Algorithms Implementation', 'CS101', 0,
             'Implement bubble sort, merge sort, and quick sort in any programming language. '
             'Compare their time complexities with empirical data.', 20, today + timedelta(days=15)),
            ('Database Design Project', 'CS201', 1,
             'Design a complete database schema for a library management system. '
             'Include ER diagram, normalization, and SQL queries.', 25, today + timedelta(days=20)),
            ('Web Application Development', 'CS202', 1,
             'Create a responsive web application using React. The app should include '
             'authentication, CRUD operations, and responsive design.', 30, today + timedelta(days=25)),
            ('Operating System Concepts', 'CS301', 2,
             'Explain process scheduling algorithms (FCFS, SJF, Round Robin, Priority). '
             'Implement any two and analyze their performance.', 20, today + timedelta(days=12)),
            ('Network Protocol Analysis', 'CS302', 2,
             'Analyze the TCP/IP protocol suite. Capture packets using Wireshark and '
             'document the protocol headers and data flow.', 25, today + timedelta(days=18)),
        ]
        assignments = []
        for title, subj_code, fac_idx, desc, marks, due in data:
            a = Assignment.objects.create(
                title=title, subject=subjects[subj_code], faculty=faculty_list[fac_idx],
                description=desc, due_date=due, total_marks=marks,
            )
            assignments.append(a)
        self.stdout.write(f'    Created {len(assignments)} assignments')
        return assignments

    def create_assignment_submissions(self, assignments, students):
        self.stdout.write('  Creating assignment submissions...')
        submissions_data = [
            (0, 0, 12.5, 'accepted', 18, 'Excellent implementation with proper analysis.'),
            (0, 1, 8.2, 'accepted', 20, 'Outstanding work! All algorithms implemented correctly.'),
            (2, 2, 35.7, 'rejected', None, 'High plagiarism detected. Please resubmit original work.'),
        ]
        count = 0
        for a_idx, s_idx, plag, status, marks, feedback in submissions_data:
            AssignmentSubmission.objects.create(
                assignment=assignments[a_idx], student=students[s_idx],
                file='assignments/submissions/placeholder.pdf',
                plagiarism_score=plag, status=status,
                marks_obtained=marks, feedback=feedback,
            )
            count += 1
        self.stdout.write(f'    Created {count} assignment submissions')

    def create_system_settings(self):
        self.stdout.write('  Creating system settings...')
        SystemSettings.objects.create(
            academic_year='2024-2025',
            current_semester='Spring',
            notice_board_message='Welcome to AMPICS Academic Module. Mid-term exams scheduled for March 15-20, 2026.',
            maintenance_mode=False,
        )
        self.stdout.write('    Created system settings')
