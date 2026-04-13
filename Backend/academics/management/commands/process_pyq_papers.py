import os
import re
from django.core.management.base import BaseCommand
from academics.models import Course, Subject, Exam, Question
from django.utils import timezone

class Command(BaseCommand):
    help = "Advanced high-precision academic question mapper"

    def handle(self, *args, **options):
        self.stdout.write("Initializing Advanced Subject-Keyword Correlation Engine...")
        
        base_dir = r"c:\Academic-module\PYQ_ALL_COURSES_DATA\questions_only"
        
        # Comprehensive Keyword Map
        topic_keywords = {
            'programming': ['algorithm', 'pointer', 'recursion', 'loop', 'c language', 'java', 'token', 'printf', 'scanf', 'variable', 'header', 'source code', 'datatype', 'compilation', 'memory allocation', 'operand', 'operator', 'pseudocode', 'flowchart', 'structure', 'union', 'macro', 'preprocessor'],
            'web': ['html', 'css', 'javascript', 'bootstrap', 'tag', 'attribute', 'browser', 'selector', 'flexbox', 'grid', 'cookie', 'session', 'responsive', 'media query', 'navbar', 'div ', 'span ', 'href', 'src ', 'dom ', 'event listener', 'hover', 'transition', 'website'],
            'it_hardware': ['motherboard', 'bios', 'processor', 'registers', 'cache', 'dma', 'interrupt', 'bus ', 'parity', 'troubleshoot', 'cleanup', 'system utility', 'peripheral', 'input device', 'output device', 'magnetic disk', 'storage', 'secondary memory'],
            'maths': ['matrix', 'determinant', 'bipartite', 'graph theory', 'hamiltonian', 'euler', 'logic gate', 'truth table', 'set theory', 'union', 'intersection', 'permutation', 'combination', 'factorial', 'digital root', 'vedic', 'sutras', 'polynomial', 'probability', 'statistics', 'discrete', 'mathematics'],
            'communication': ['listening', 'speaking', 'oral', 'written', 'formal', 'informal', 'communication barrier', 'letter', 'memo ', 'notices', 'resume', 'cv ', 'vocabulary', 'grammar', 'tense', 'comprehension', 'skimming', 'scanning', 'group discussion', 'interview'],
            'office': ['excel', 'word', 'powerpoint', 'mail merge', 'spreadsheet', 'pivot', 'slide ', 'formatting', 'spell check', 'formula', 'vlookup', 'charts', 'headers', 'footers', 'tally', 'account', 'voucher', 'trial balance', 'ledger'],
            'security': ['encrypt', 'decrypt', 'cipher', 'cryptography', 'cyber', 'law', 'it act', 'signature', 'authentication', 'malware', 'virus', 'firewall', 'phishing', 'social media safety', 'hacker', 'privacy'],
            'database': ['sql', 'query', 'dbms', 'rdbms', 'table', 'normalization', 'primary key', 'foreign key', 'relationship', 'er model', 'cardinality', 'join', 'select ', 'insert ', 'update ', 'delete ', 'record', 'tuple', 'data redundancy'],
            'networking': ['lan ', 'wan ', 'man ', 'protocol', 'tcp', 'ip ', 'osi model', 'layer', 'topology', 'hub', 'switch', 'router', 'ethernet', 'dns', 'gateway', 'bandwidth', 'packet', 'framing', 'error detection'],
            'bhagavad_gita': ['bhagavad', 'gita', 'shrimad', 'krishna', 'arjuna', 'karma', 'yoga', 'eighteen chapter', 'shloka', 'spiritual', 'teachings', 'bhakti', 'dharma', 'leadership', 'management principles']
        }

        # Subject name pattern mapping
        subject_topic_map = {
            'Program': 'programming', 'Alg': 'programming', 'Logic Dev': 'programming',
            'Web': 'web', 'Bootstrap': 'web', 'PHP': 'web', 'Design': 'web',
            'IT': 'it_hardware', 'Arch': 'it_hardware', 'Hardware': 'it_hardware', 'Microprocessor': 'it_hardware',
            'Math': 'maths', 'Discrete': 'maths', 'Vedic': 'maths', 'Num': 'maths',
            'Comm': 'communication', 'Lang': 'communication', 'Skill': 'communication',
            'Office': 'office', 'Auto': 'office', 'Excel': 'office', 'Word': 'office', 'Accounts': 'office',
            'Security': 'security', 'Cyber': 'security', 'Law': 'security',
            'Data': 'database', 'Query': 'database', 'Base': 'database', 'DBMS': 'database',
            'Net': 'networking', 'Layer': 'networking',
            'Gita': 'bhagavad_gita', 'Ethic': 'bhagavad_gita', 'Manage': 'bhagavad_gita'
        }

        def get_best_subject(q_text, candidate_subjects):
            best_sub = None
            max_score = -1
            q_text_lower = q_text.lower()
            
            for sub in candidate_subjects:
                score = 0
                
                # Check mapping
                sub_topic_key = None
                for pattern, t_key in subject_topic_map.items():
                    if pattern.lower() in sub.name.lower():
                        sub_topic_key = t_key
                        break
                
                if sub_topic_key:
                    # Give high weight to matches from the predicted topic
                    score += 2 * sum(1 for kw in topic_keywords[sub_topic_key] if kw in q_text_lower)
                
                # Plus direct word overlap with subject name
                name_words = sub.name.lower().split()
                for nw in name_words:
                    if len(nw) > 3 and nw in q_text_lower:
                        score += 3
                
                # Bonus for subject code in text (rare but strong)
                if sub.code.lower() in q_text_lower:
                    score += 10
                    
                if score > max_score:
                    max_score = score
                    best_sub = sub
            
            return best_sub, max_score

        # Start Processing
        for root, dirs, files in os.walk(base_dir):
            path_parts = root.split(os.sep)
            if len(path_parts) < 2: continue
            
            sem_str = path_parts[-1]
            course_name = path_parts[-2]
            
            try:
                sem_num = int(re.search(r'\d+', sem_str).group())
            except: continue
                
            try:
                course = Course.objects.get(name=course_name)
            except Course.DoesNotExist: continue

            available_subjects = Subject.objects.filter(course=course, semester=sem_num)
            if not available_subjects.exists(): continue

            for filename in files:
                if not filename.endswith('.txt'): continue
                
                file_path = os.path.join(root, filename)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                exam_name = filename.replace('.txt', '')
                
                # Split content by question marks, "Que-", or numbers at start of line
                questions = re.split(r'\n(?=\d+\.|Q\d+|[A-G]\.|\d+[\.\)]|Que-\d+)', content)
                
                counter = 0
                for q_text in questions:
                    q_text = q_text.strip()
                    if len(q_text) < 20: continue
                    
                    best_sub, score = get_best_subject(q_text, available_subjects)
                    
                    if best_sub and score > 0:
                        exam, _ = Exam.objects.get_or_create(
                            subject=best_sub,
                            title=exam_name,
                            defaults={
                                'exam_type': "End Term" if "Regular" in exam_name else "Mid Term",
                                'date': timezone.now().date(),
                                'start_time': timezone.now().time(),
                                'duration_minutes': 180,
                                'total_marks': 100,
                                'is_published': True
                            }
                        )
                        
                        # Extract marks
                        marks_match = re.search(r'[\(\[](\d+)[\)\]]', q_text)
                        marks = int(marks_match.group(1)) if marks_match else 5
                        
                        # Prep clean question
                        clean_q = re.sub(r'[\(\[]\d+[\)\]]', '', q_text).strip()
                        clean_q = re.sub(r'^(?:\d+\.|Q\d+|[A-G]\.|\d+[\.\)]|Que-\d+)\s*', '', clean_q)
                        
                        Question.objects.create(
                            exam=exam,
                            question_text=clean_q,
                            marks=marks,
                            order=counter + 1
                        )
                        counter += 1
                
                self.stdout.write(self.style.SUCCESS(f"Processed {filename}: Imported {counter} questions for {course_name} (distributed across subjects)"))

        self.stdout.write(self.style.SUCCESS("High-Precision Import Successful!"))
