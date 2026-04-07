import os
import pickle
from django.apps import AppConfig


class PyqsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'pyqs'
    
    # ML Model Singletons - loaded once at startup
    clusters = {}
    subject_data = {}
    sem_subjects = {}
    model_loaded = False

    def ready(self):
        """Load ML model on Django startup"""
        if PyqsConfig.model_loaded:
            return
            
        try:
            MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ml', 'exam_paper_model.pkl')
            
            if os.path.exists(MODEL_PATH):
                with open(MODEL_PATH, 'rb') as f:
                    model_data = pickle.load(f)
                
                PyqsConfig.clusters = model_data.get('clusters', {})
                PyqsConfig.sem_subjects = model_data.get('sem_subjects', {})
                
                # Convert subject_data to DataFrames
                import pandas as pd
                subject_data_raw = model_data.get('subject_data', {})
                for k, v in subject_data_raw.items():
                    PyqsConfig.subject_data[k] = pd.DataFrame(v)
                
                PyqsConfig.model_loaded = True
                print(f"[OK] PYQ ML Model loaded: {len(PyqsConfig.sem_subjects)} semesters, {len(PyqsConfig.clusters)} subjects")
            else:
                self._load_fallback_data()
                    
        except Exception as e:
            self._load_fallback_data()
            print(f"[WARNING] PYQ ML model load failed, using fallback: {e}")
    
    def _load_fallback_data(self):
        """Fallback subjects when ML model unavailable"""
        import pandas as pd
        
        PyqsConfig.sem_subjects = {
            1: {'BCA101': 'Logic Development with Programming-I', 'BCA102': 'Office Automation Tools'},
            2: {'BCA201': 'Logic Development with Programming-II', 'BCA202': 'Discrete Mathematics'},
            3: {'BCA301': 'Object Oriented Programming', 'BCA302': 'Database Management System'},
            4: {'BCA401': 'GUI Programming', 'BCA402': 'Software Engineering'},
            5: {'BCA501': 'Advance Web Technology', 'BCA502': 'Operating System'},
            6: {'BCA601': 'Mobile Application Development', 'BCA602': 'Project Management'},
        }
        
        for sem, subjects in PyqsConfig.sem_subjects.items():
            for code, name in subjects.items():
                key = f"{sem}_{code}"
                PyqsConfig.clusters[key] = {}
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
                    PyqsConfig.clusters[key][idx] = {
                        'representative': q,
                        'count': 3 - (idx % 3),
                        'year_count': 2,
                        'freq_score': 0.8,
                        'years': [2023, 2024],
                    }
                PyqsConfig.subject_data[key] = pd.DataFrame({
                    'Subject_Name': [name] * len(questions),
                    'Question': questions,
                })
        
        PyqsConfig.model_loaded = True
