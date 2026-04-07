import os, pickle, sys
from django.apps import AppConfig


class ExamPaperConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'AI_Powered_Exam_Paper_Generator'
    
    # Global Singletons - loaded once at startup
    clusters = {}
    subject_data = {}
    sem_subjects = {}

    def ready(self):
        """Load ML model on Django startup"""
        try:
            MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ml', 'exam_paper_model.pkl')
            
            if os.path.exists(MODEL_PATH):
                with open(MODEL_PATH, 'rb') as f:
                    model_data = pickle.load(f)
                
                # Assign to class variables
                ExamPaperConfig.clusters = model_data.get('clusters', {})
                ExamPaperConfig.sem_subjects = model_data.get('sem_subjects', {})
                
                # Convert subject_data to DataFrames
                import pandas as pd
                subject_data_raw = model_data.get('subject_data', {})
                for k, v in subject_data_raw.items():
                    ExamPaperConfig.subject_data[k] = pd.DataFrame(v)
                
                # Log success
                try:
                    print(f"[OK] Exam Paper ML Model loaded: {len(ExamPaperConfig.sem_subjects)} semesters")
                except Exception:
                    pass
            else:
                self._load_fallback_data()
                    
        except Exception as e:
            self._load_fallback_data()
            print(f"[WARNING] Exam Paper model load failed, using fallback: {e}")
    
    def _load_fallback_data(self):
        """Fallback BCA subjects when ML model unavailable"""
        import pandas as pd
        
        ExamPaperConfig.sem_subjects = {
            1: {'BCA101': 'Fundamentals of Computer', 'BCA102': 'Programming in C'},
            2: {'BCA201': 'Data Structures', 'BCA202': 'OOP with C++'},
            3: {'BCA301': 'Operating Systems', 'BCA302': 'Java Programming'},
            4: {'BCA401': 'Python Programming', 'BCA402': 'Computer Graphics'},
            5: {'BCA501': 'Artificial Intelligence', 'BCA502': 'Mobile App Dev'},
            6: {'BCA601': 'Machine Learning', 'BCA602': 'Big Data Analytics'},
        }
        
        for sem, subjects in ExamPaperConfig.sem_subjects.items():
            for code, name in subjects.items():
                key = f"{sem}_{code}"
                ExamPaperConfig.clusters[key] = {}
                questions = [
                    f"Explain the fundamental concepts of {name}.",
                    f"Describe the architecture and components of {name}.",
                    f"What are the key applications of {name}?",
                    f"Compare different approaches in {name}.",
                    f"Write detailed notes on {name}.",
                    f"Explain with examples: {name}.",
                    f"Describe advantages and limitations of {name}.",
                    f"Discuss recent trends in {name}.",
                    f"Explain a practical scenario involving {name}.",
                    f"What are the future prospects of {name}?",
                ]
                for idx, q in enumerate(questions):
                    ExamPaperConfig.clusters[key][idx] = {
                        'representative': q,
                        'count': 3 - (idx % 3),
                        'year_count': 2,
                        'freq_score': 0.8,
                        'years': [2023, 2024],
                    }
                ExamPaperConfig.subject_data[key] = pd.DataFrame({
                    'Subject_Name': [name] * len(questions),
                    'Question': questions,
                })
