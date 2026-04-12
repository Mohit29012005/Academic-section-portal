import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from users.models import Student, Faculty
from academics.models import Subject, SemesterResult, SubjectResult, Exam


class Command(BaseCommand):
    help = "Generate sample exams and semester results for all students"

    def handle(self, *args, **options):
        from academics.models import Course

        self.stdout.write("Generating sample exams and results...\n")

        # =============================================
        # GENERATE EXAMS
        # =============================================
        self.stdout.write("Creating sample exams...")

        # Get faculty
        faculty = Faculty.objects.first()
        if not faculty:
            self.stdout.write(
                self.style.WARNING("No faculty found, creating exams without faculty")
            )

        # Get courses
        courses = Course.objects.all()
        exam_count = 0

        for course in courses:
            subjects = Subject.objects.filter(course=course)

            for subject in subjects:
                # Create exam for this subject
                exam_type = random.choice(["Mid Term", "End Term", "Quiz"])
                exam_date = datetime.now() + timedelta(days=random.randint(7, 60))

                # Branch filter
                branch = subject.campus_branch

                exam = Exam.objects.create(
                    title=f"{subject.name} - {exam_type}",
                    subject=subject,
                    exam_type=exam_type,
                    campus_branch=branch,
                    date=exam_date.date(),
                    start_time=datetime.strptime("10:00", "%H:%M").time(),
                    duration_minutes=random.choice([60, 90, 120]),
                    total_marks=100,
                    passing_marks=35,
                    instructions="Answer all questions. Maintain code of conduct.",
                    is_published=random.choice([True, False]),
                    created_by=faculty,
                )

                # Add sample questions
                self._add_sample_questions(exam)
                exam_count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Created {exam_count} exams with questions")
        )

        # =============================================
        # GENERATE SEMESTER RESULTS
        # =============================================
        self.stdout.write("\nGenerating semester results for students...")

        result_count = 0
        student_count = 0

        for student in Student.objects.select_related("course").all():
            student_count += 1
            current_sem = student.current_semester or 1

            # Generate results for completed semesters (1 to current_sem - 1 or current_sem)
            completed_semesters = min(current_sem, student.total_semesters)

            for sem in range(1, completed_semesters + 1):
                # Check if result already exists
                if SemesterResult.objects.filter(
                    student=student, semester=sem
                ).exists():
                    continue

                # Get subjects for this semester
                subjects = Subject.objects.filter(course=student.course, semester=sem)

                if not subjects.exists():
                    continue

                # Calculate subject-wise marks
                subject_results = []
                total_obtained = 0
                total_max = 0

                for subject in subjects:
                    # Generate random marks (35-95 range, normal distribution)
                    internal = random.randint(15, 30)
                    external = random.randint(20, 70)
                    practical = random.randint(15, 30) if random.random() > 0.3 else 0

                    subject_total = internal + external + practical
                    total_marks = 30 + 70 + 30  # Max = 130

                    is_passed = subject_total >= 35

                    # Calculate grade
                    pct = (subject_total / total_marks) * 100
                    if pct >= 90:
                        grade = "O"
                    elif pct >= 80:
                        grade = "A+"
                    elif pct >= 70:
                        grade = "A"
                    elif pct >= 60:
                        grade = "B+"
                    elif pct >= 50:
                        grade = "B"
                    elif pct >= 40:
                        grade = "C"
                    elif pct >= 35:
                        grade = "P"
                    else:
                        grade = "F"

                    subject_results.append(
                        {
                            "subject": subject,
                            "internal_marks": internal,
                            "external_marks": external,
                            "practical_marks": practical,
                            "total_marks": subject_total,
                            "passing_marks": 35,
                            "is_passed": is_passed,
                            "grade": grade,
                        }
                    )

                    total_obtained += subject_total
                    total_max += total_marks

                # Calculate SGPA using 4-point scale
                percentage = (total_obtained / total_max * 100) if total_max > 0 else 0

                # SGPA calculation (out of 4.0 scale - more realistic)
                if percentage >= 90:
                    sgpa = 4.0
                elif percentage >= 80:
                    sgpa = 3.75
                elif percentage >= 70:
                    sgpa = 3.5
                elif percentage >= 60:
                    sgpa = 3.0
                elif percentage >= 50:
                    sgpa = 2.5
                elif percentage >= 40:
                    sgpa = 2.0
                elif percentage >= 35:
                    sgpa = 1.0
                else:
                    sgpa = 0.0

                # Create semester result
                semester_result = SemesterResult.objects.create(
                    student=student,
                    semester=sem,
                    sgpa=sgpa,
                    total_marks=total_max,
                    obtained_marks=total_obtained,
                    percentage=round(percentage, 2),
                    grade=self._get_grade_letter(sgpa),
                    status="completed" if sem < current_sem else "completed",
                    year=2024 if sem <= 2 else 2025,
                    exam_type="Regular",
                )

                # Create subject results
                for sr in subject_results:
                    SubjectResult.objects.create(
                        semester_result=semester_result,
                        subject=sr["subject"],
                        internal_marks=sr["internal_marks"],
                        external_marks=sr["external_marks"],
                        practical_marks=sr["practical_marks"],
                        total_marks=sr["total_marks"],
                        passing_marks=sr["passing_marks"],
                        is_passed=sr["is_passed"],
                        grade=sr["grade"],
                    )

                result_count += 1

        # Update student CGPA
        self._update_student_cgpa()

        self.stdout.write(self.style.SUCCESS(f"\nDone!"))
        self.stdout.write(f"  Students processed: {student_count}")
        self.stdout.write(f"  Results generated: {result_count}")
        self.stdout.write(f"  Exams created: {exam_count}")

    def _add_sample_questions(self, exam):
        """Add sample questions to an exam."""
        from academics.models import Question

        questions = [
            {
                "question_text": f"What is the fundamental concept of {exam.subject.name}? Explain with examples.",
                "question_type": "Short",
                "marks": 5,
                "order": 1,
            },
            {
                "question_text": f"Discuss the key principles and applications of {exam.subject.name} in modern computing.",
                "question_type": "Long",
                "marks": 10,
                "order": 2,
            },
            {
                "question_text": f"Which of the following is NOT a characteristic of {exam.subject.name}?",
                "question_type": "MCQ",
                "marks": 2,
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "order": 3,
            },
        ]

        for q in questions:
            Question.objects.create(
                exam=exam,
                question_text=q["question_text"],
                question_type=q["question_type"],
                marks=q["marks"],
                options=q.get("options"),
                correct_answer="Option A",
                order=q["order"],
            )

    def _get_grade_letter(self, sgpa):
        if sgpa >= 3.75:
            return "A+"
        elif sgpa >= 3.5:
            return "A"
        elif sgpa >= 3.0:
            return "B+"
        elif sgpa >= 2.5:
            return "B"
        elif sgpa >= 2.0:
            return "C+"
        elif sgpa >= 1.0:
            return "C"
        else:
            return "F"

    def _update_student_cgpa(self):
        """Update CGPA for all students based on their semester results."""
        for student in Student.objects.all():
            results = SemesterResult.objects.filter(
                student=student, status="completed"
            ).order_by("semester")

            if results.exists():
                valid_sgpas = [float(r.sgpa) for r in results if r.sgpa is not None]
                if valid_sgpas:
                    cgpa = round(sum(valid_sgpas) / len(valid_sgpas), 2)
                    student.cgpa = cgpa
                    student.save(update_fields=["cgpa"])
