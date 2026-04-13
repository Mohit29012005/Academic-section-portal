import os
import pandas as pd
import numpy as np
import re
import joblib
from datetime import date
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline

import sys
import django
# Django Setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampics.settings')
sys.path.append(os.path.join(os.getcwd(), 'Backend'))
django.setup()

from academics.models import Subject, Course, Question, Exam

def clean_name(name):
    if not isinstance(name, str): return ""
    return name.strip()

def finalize():
    print("--- STEP 1: LOADING SUBJECTS ---")
    subjects_path = 'c:/Academic-module/PYQ_ALL_COURSES_DATA/Ganpat_University_All_Courses.xlsx'
    df_subjects = pd.read_excel(subjects_path)
    
    # Pre-cleaning
    df_subjects = df_subjects.dropna(subset=['Course', 'Subject Name'])
    df_subjects['Course'] = df_subjects['Course'].astype(str).str.strip()
    df_subjects['Semester'] = pd.to_numeric(df_subjects['Semester'].astype(str).str.extract('(\d+)', expand=False), errors='coerce')
    df_subjects = df_subjects.dropna(subset=['Semester'])
    
    created_subjects = 0
    subject_map = {} # (Course, Sem, Name) -> Obj

    for _, row in df_subjects.iterrows():
        c_name = row['Course']
        if "Sem" in c_name: continue # Skip header rows
        
        sem = int(row['Semester'])
        sub_name = str(row['Subject Name']).strip()
        sub_code = str(row['Subject Code']).strip() if pd.notna(row['Subject Code']) else f"SUB{created_subjects}"
        
        # Mapping Course names
        course_display = c_name
        if "BSC" in c_name: course_display = "BSC(IT)" # Standardize
        
        course_obj, _ = Course.objects.get_or_create(
            name=course_display,
            defaults={'code': course_display[:10], 'duration': 3, 'credits': 120, 'total_semesters': 6}
        )
        
        subject_obj, created = Subject.objects.get_or_create(
            code=sub_code,
            defaults={
                'name': sub_name,
                'course': course_obj,
                'semester': sem,
                'credits': 4
            }
        )
        if created: created_subjects += 1
        subject_map[(course_display, sem, sub_name.lower())] = subject_obj

    print(f"Imported {created_subjects} new subjects.")

    print("\n--- STEP 2: TRAINING INTELLIGENT MODEL ---")
    questions_path = 'c:/Academic-module/PYQ_ALL_COURSES_DATA/Ganpat_University_Questions.xlsx'
    df_questions = pd.read_excel(questions_path)
    df_questions = df_questions.dropna(subset=['Question Text', 'Course'])
    
    # Preparation for training
    training_data = []
    
    # We use subject names as seeds for labelling
    for _, sub_row in df_subjects.iterrows():
        # Add subject name itself as a sample
        training_data.append({'text': str(sub_row['Subject Name']), 'label': str(sub_row['Subject Code'])})
        
    # Match questions to subjects for training labels
    for _, q_row in df_questions.iterrows():
        q_text = str(q_row['Question Text'])
        q_course = "BSC(IT)" if "B.Sc" in str(q_row['Course']) else str(q_row['Course'])
        q_sem = pd.to_numeric(re.search(r'\d+', str(q_row['Semester'])).group()) if re.search(r'\d+', str(q_row['Semester'])) else None
        
        if not q_sem: continue
        
        # Find best subject match via keywords
        best_sub = None
        max_score = 0
        for (c, s, name), obj in subject_map.items():
            if c == q_course and s == q_sem:
                keywords = [k for k in name.split() if len(k) > 3]
                score = sum(1 for k in keywords if k in q_text.lower())
                if score > max_score:
                    max_score = score
                    best_sub = obj.code
        
        if best_sub:
            training_data.append({'text': q_text, 'label': best_sub})

    df_train = pd.DataFrame(training_data)
    print(f"Training data size: {len(df_train)}")
    if not df_train.empty:
        print(f"Unique labels in training: {df_train['label'].nunique()}")
    
    model = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english')),
        ('clf', LinearSVC(dual=False))
    ])
    model.fit(df_train['text'], df_train['label'])
    
    model_dir = 'c:/Academic-module/ML Model'
    os.makedirs(model_dir, exist_ok=True)
    joblib.dump(model, os.path.join(model_dir, 'pyq_intelligent_model.pkl'))
    print("Model trained and saved.")

    print(f"\n--- STEP 3: IMPORTING QUESTIONS (Total rows: {len(df_questions)}) ---")
    imported_questions = 0
    instructions_keywords = ['figures to the right', 'instructions:', 'two sections', 'standard notations']
    
    count_valid = 0
    for _, q_row in df_questions.iterrows():
        q_text = str(q_row['Question Text']).strip()
        if len(q_text) < 15 or any(k in q_text.lower() for k in instructions_keywords):
            continue
        count_valid += 1
        
        # Predict subject
        predicted_sub_code = model.predict([q_text])[0]
        try:
            subject_obj = Subject.objects.get(code=predicted_sub_code)
            
            # Create a generic Exam container per subject/year if not exists
            exam_obj, _ = Exam.objects.get_or_create(
                subject=subject_obj,
                exam_type="Regular",
                title="2023-24 Session",
                defaults={
                    'date': date.today(),
                    'total_marks': 60, 
                    'passing_marks': 24,
                    'duration_minutes': 180,
                    'instructions': "Answer all questions."
                }
            )
            
            Question.objects.create(
                exam=exam_obj,
                question_text=q_text,
                marks=6,
                difficulty="Medium"
            )
            imported_questions += 1
        except Exception as e:
            print(f"Error importing question: {e}")
            pass

    print(f"Successfully imported {imported_questions} questions.")
    print("\n--- ALL TASKS COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    finalize()
