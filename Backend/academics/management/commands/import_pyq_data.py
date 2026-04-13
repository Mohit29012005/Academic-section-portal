import os
import re
import csv
from django.core.management.base import BaseCommand
from academics.models import Course, Subject, Exam, Question
from django.utils import timezone

class Command(BaseCommand):
    help = "Import PYQ Subjects and Questions from the provided data"

    def handle(self, *args, **options):
        self.stdout.write("Starting PYQ Data Import...")
        
        base_path = r"c:\Academic-module\PYQ_ALL_COURSES_DATA\aLL COURSES SUBJECTS SMESTER DATA"
        
        file_map = {
            "BSC(IT).txt": "B.Sc. IT",
            "BSC-IT(CS).txt": "B.Sc. IT (CYBER SECURITY)",
            "BSC-IT(IMS).txt": "B.Sc. IMS",
            "DD(BCA-MCA).txt": "INTE. DUAL DEGREE (BCA)-(MCA)",
            "MCA ALL semester subjects.txt": "MCA",
            "MSC(It).txt": "M.Sc. IT",
            "MSC-IT(AIML).txt": "M.Sc. ARTIFICIAL INTELLIGENCE & MACHINE LEARNING",
            "MSC-IT(CS).txt": "M.Sc. IT (CYBER SECURITY)",
            "MSC-IT(IMS).txt": "M.Sc. IMS",
        }

        # 2. Process .txt files for Subjects
        for filename, course_name in file_map.items():
            path = os.path.join(base_path, filename)
            if not os.path.exists(path): continue
            
            try:
                course = Course.objects.get(name=course_name)
            except Course.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"Course {course_name} not found in DB"))
                continue
                
            self.stdout.write(f"Importing subjects for {course_name}...")
            
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Split by sem N
            blocks = re.split(r'(?i)sem\s+(\d+)', content)
            for i in range(1, len(blocks), 2):
                sem_num = int(blocks[i])
                sem_content = blocks[i+1]
                
                rows = sem_content.strip().split('\n')
                for row in rows:
                    if 'Subject Name' in row or not row.strip(): continue
                    # Handle both Tab and multiple spaces
                    parts = [p.strip() for p in re.split(r'\t| {2,}', row)]
                    if len(parts) >= 3:
                        sub_name = parts[0]
                        sub_code = parts[2]
                        try:
                            # Try to parse credit
                            credit_str = parts[3]
                            credits = int(float(credit_str))
                        except:
                            credits = 4
                            
                        Subject.objects.update_or_create(
                            code=sub_code,
                            defaults={
                                'name': sub_name,
                                'course': course,
                                'semester': sem_num,
                                'credits': credits
                            }
                        )

        # 3. Process the CAIT CSV for Subjects and Questions
        csv_path = os.path.join(base_path, "Ganpat_University_BSc_CAIT_SEM1_Questions.csv")
        if os.path.exists(csv_path):
            self.stdout.write("Importing CAIT Sem 1 Questions from CSV...")
            try:
                course_cait = Course.objects.get(name="B.Sc. (CA&IT)")
                with open(csv_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        sub_code = row['Subject_Code'].strip()
                        sub_name = row['Subject_Name'].strip()
                        
                        # Ensure subject exists
                        subject, _ = Subject.objects.update_or_create(
                            code=sub_code,
                            defaults={'name': sub_name, 'course': course_cait, 'semester': 1}
                        )
                        
                        # Handle Exam
                        exam_title = f"{row['Exam_Year']} {row['Exam_Type']}"
                        
                        # Parse year
                        try:
                           year_str = row['Exam_Year'].split()[-1]
                           year = int(year_str)
                        except:
                           year = 2023
                        
                        exam_date = timezone.datetime(year, 1, 1).date()
                        
                        exam, _ = Exam.objects.get_or_create(
                            subject=subject,
                            title=exam_title,
                            defaults={
                                'exam_type': "End Term" if "Regular" in row['Exam_Type'] else "Mid Term",
                                'date': exam_date,
                                'start_time': timezone.datetime(year, 1, 1, 10, 0).time(),
                                'duration_minutes': 180,
                                'total_marks': 60,
                                'is_published': True
                            }
                        )
                        
                        # Handle Question
                        Question.objects.create(
                            exam=exam,
                            question_text=row['Question_Text'],
                            marks=int(row['Marks']) if row['Marks'].isdigit() else 6,
                            order=1
                        )
            except Course.DoesNotExist:
                self.stdout.write(self.style.ERROR("B.Sc. (CA&IT) not found for CSV import"))

        self.stdout.write(self.style.SUCCESS("Import completed successfully!"))
