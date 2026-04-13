import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
import joblib
import os
import re

print("Starting Robust Model Training...")

# Paths
subjects_path = 'c:/Academic-module/PYQ_ALL_COURSES_DATA/Ganpat_University_All_Courses.xlsx'
questions_path = 'c:/Academic-module/PYQ_ALL_COURSES_DATA/Ganpat_University_Questions.xlsx'
model_output = 'c:/Academic-module/ML Model/pyq_intelligent_model.pkl'

# Load
df_subjects = pd.read_excel(subjects_path)
df_questions = pd.read_excel(questions_path)

# 1. Clean Subjects Data
df_subjects = df_subjects.dropna(subset=['Course', 'Subject Name', 'Semester'])
df_subjects['Course'] = df_subjects['Course'].astype(str).str.strip()
df_subjects['Semester'] = pd.to_numeric(df_subjects['Semester'].astype(str).str.extract('(\d+)', expand=False), errors='coerce')
df_subjects = df_subjects.dropna(subset=['Semester'])
df_subjects['Semester'] = df_subjects['Semester'].astype(int)
df_subjects['Subject Name'] = df_subjects['Subject Name'].astype(str).str.strip()

# 2. Clean Questions Data
df_questions = df_questions.dropna(subset=['Course', 'Question Text'])
df_questions['Course'] = df_questions['Course'].astype(str).str.strip()
df_questions['Semester'] = pd.to_numeric(df_questions['Semester'], errors='coerce')
df_questions = df_questions.dropna(subset=['Semester'])

training_data = []

print("Analyzing and Labeling data...")
# Pre-calculate keywords for all subjects to speed up
subject_keywords = {}
for _, sub_row in df_subjects.iterrows():
    s_key = (sub_row['Course'], int(sub_row['Semester']))
    if s_key not in subject_keywords:
        subject_keywords[s_key] = []
    
    name = str(sub_row['Subject Name'])
    code = sub_row['Subject Code']
    # Extract meaningful keywords (length > 3)
    kws = [k.lower() for k in re.findall(r'\w+', name) if len(k) > 3]
    subject_keywords[s_key].append({'code': code, 'keywords': kws, 'name': name})

# Labeling
for index, row in df_questions.iterrows():
    q_text = str(row['Question Text']).lower()
    q_course = row['Course']
    q_sem = int(row['Semester'])
    
    # Fuzzy match Course (BSC(IT) vs B.Sc. (CA&IT))
    matched_course = None
    for c in df_subjects['Course'].unique():
        # Check if one is sub-string of other or common prefix
        if c.lower() in q_course.lower() or q_course.lower() in c.lower() or ("BSC" in c and "B.Sc" in q_course):
            matched_course = c
            break
            
    if not matched_course: continue
    
    s_key = (matched_course, q_sem)
    if s_key not in subject_keywords: continue
    
    best_subject = None
    max_matches = -1
    
    for sub in subject_keywords[s_key]:
        matches = sum(1 for kw in sub['keywords'] if kw in q_text)
        if matches > max_matches:
            max_matches = matches
            best_subject = sub['code']
            
    if best_subject:
        training_data.append({'text': row['Question Text'], 'label': best_subject})

df_train = pd.DataFrame(training_data)

if not df_train.empty:
    print(f"Training on {len(df_train)} samples into {len(df_train['label'].unique())} subject categories...")
    model = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english', max_features=5000)),
        ('clf', LinearSVC(dual=False, C=1.0))
    ])
    model.fit(df_train['text'], df_train['label'])
    joblib.dump(model, model_output)
    print(f"SUCCESS: Model saved to {model_output}")
else:
    print("FAILED: No overlap found between Questions and Subjects. Please check Excel column content.")
