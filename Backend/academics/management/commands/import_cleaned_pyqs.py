import os
import csv
import re
from django.core.management.base import BaseCommand
from academics.models import Course, Subject, Exam, Question
from django.utils import timezone

class Command(BaseCommand):
    help = "Bulk import extracted PDF questions and auto-map to closest matching Subjects."

    def guess_subject(self, question_text, source_file, subjects):
        if not subjects:
            return None
            
        best_subject = None
        best_score = -1
        
        text_lower = question_text.lower()
        file_lower = source_file.lower()
        
        for sub in subjects:
            score = 0
            keywords = [k.lower() for k in sub.name.split() if len(k) > 2 and k.lower() not in ['and', 'the', 'for', 'with', 'using']]
            
            for k in keywords:
                if k in text_lower:
                    score += 2
                if k in file_lower:
                    score += 3
                    
            if score > best_score:
                best_score = score
                best_subject = sub
                
        # If score is 0, we just return the first subject to avoid orphans
        return best_subject if best_subject else subjects.first()

    def handle(self, *args, **options):
        self.stdout.write("Starting Intelligent PYQ Import...\n")
        
        csv_path = r"c:\Academic-module\PYQ_ALL_COURSES_DATA\Cleaned_Extracted_Questions.csv"
        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f"File not found: {csv_path}"))
            return

        total_imported = 0
        skipped = 0

        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                course_name = row['Course'].strip()
                sem_raw = row['Semester'].strip() # "SEM-1"
                source_file = row['Source_File'].strip()
                question_text = row['Question_Text'].strip()
                
                # Extract integer from "SEM-1"
                sem_match = re.search(r'\d+', sem_raw)
                sem_num = int(sem_match.group(0)) if sem_match else 1
                
                try:
                    # Find Course
                    course = Course.objects.filter(name__icontains=course_name).first()
                    if not course:
                        skipped += 1
                        continue
                        
                    # Get potential subjects for this course and semester
                    subjects = Subject.objects.filter(course=course, semester=sem_num)
                    if not subjects.exists():
                        skipped += 1
                        continue
                        
                    # Auto-Map AI function
                    target_subject = self.guess_subject(question_text, source_file, subjects)
                    
                    if not target_subject:
                        skipped += 1
                        continue
                        
                    # Generate Exam (Like a "Folder" for the questions)
                    exam_title = source_file.replace('.pdf', '')
                    
                    # Parse Year from exam title if possible
                    year_match = re.search(r'20\d{2}', exam_title)
                    year = int(year_match.group(0)) if year_match else 2023
                    exam_date = timezone.datetime(year, 1, 1).date()

                    exam, _ = Exam.objects.get_or_create(
                        subject=target_subject,
                        title=exam_title[:199], # Limit length
                        defaults={
                            'exam_type': "End Term",
                            'date': exam_date,
                            'start_time': timezone.datetime(year, 1, 1, 10, 0).time(),
                            'duration_minutes': 180,
                            'total_marks': 60,
                            'is_published': True
                        }
                    )
                    
                    # Estimate Marks (if question is very long, maybe 10 marks, if short 5)
                    marks_est = 10 if len(question_text) > 150 else 5
                    
                    # Insert Question
                    Question.objects.create(
                        exam=exam,
                        question_text=question_text,
                        marks=marks_est,
                        question_type="Long" if marks_est == 10 else "Short",
                        order=total_imported + 1
                    )
                    
                    total_imported += 1
                    if total_imported % 100 == 0:
                        self.stdout.write(f"Imported {total_imported} questions...")
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error on row: {e}"))
                    skipped += 1

        self.stdout.write(self.style.SUCCESS(f"\n✅ Import Complete!"))
        self.stdout.write(self.style.SUCCESS(f"Total Successfully Map & Imported: {total_imported}"))
        self.stdout.write(self.style.WARNING(f"Total Skipped (No Course/Subject): {skipped}"))

