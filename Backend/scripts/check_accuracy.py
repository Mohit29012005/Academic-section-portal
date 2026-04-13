import pandas as pd
import numpy as np
import re
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# Paths
subjects_path = 'c:/Academic-module/PYQ_ALL_COURSES_DATA/Ganpat_University_All_Courses.xlsx'
questions_path = 'c:/Academic-module/PYQ_ALL_COURSES_DATA/Ganpat_University_Questions.xlsx'

# Load
df_subjects = pd.read_excel(subjects_path)
df_questions = pd.read_excel(questions_path)

# Cleaning
df_subjects = df_subjects.dropna(subset=['Course', 'Subject Name', 'Semester'])
df_subjects['Course'] = df_subjects['Course'].astype(str).str.strip()
df_subjects['Semester'] = pd.to_numeric(df_subjects['Semester'].astype(str).str.extract('(\d+)', expand=False), errors='coerce')
df_subjects = df_subjects.dropna(subset=['Semester'])

df_questions = df_questions.dropna(subset=['Question Text', 'Course'])
df_questions['Course'] = df_questions['Course'].astype(str).str.strip()

# labeling logic (same as training)
training_data = []
subject_keywords = {}
for _, sub_row in df_subjects.iterrows():
    s_key = (sub_row['Course'], int(sub_row['Semester']))
    if s_key not in subject_keywords: subject_keywords[s_key] = []
    name = str(sub_row['Subject Name'])
    kws = [k.lower() for k in re.findall(r'\w+', name) if len(k) > 3]
    subject_keywords[s_key].append({'code': sub_row['Subject Code'], 'keywords': kws})

for _, q_row in df_questions.iterrows():
    q_text = str(q_row['Question Text']).lower()
    q_course = "BSC(IT)" if "B.Sc" in str(q_row['Course']) else str(q_row['Course'])
    q_sem_match = re.search(r'\d+', str(q_row['Semester']))
    if not q_sem_match: continue
    q_sem = int(q_sem_match.group())
    
    # Fuzzy find course
    matched_course = None
    for c in df_subjects['Course'].unique():
        if c.lower() in q_course.lower() or q_course.lower() in c.lower() or ("BSC" in c and "B.Sc" in q_course):
            matched_course = c
            break
            
    if not matched_course: continue
    s_key = (matched_course, q_sem)
    if s_key not in subject_keywords: continue
    
    best_sub = None
    max_matches = -1
    for sub in subject_keywords[s_key]:
        m = sum(1 for kw in sub['keywords'] if kw in q_text)
        if m > max_matches:
            max_matches = m
            best_sub = sub['code']
    if best_sub:
        training_data.append({'text': q_row['Question Text'], 'label': best_sub})

df_final = pd.DataFrame(training_data)

if not df_final.empty:
    X_train, X_test, y_train, y_test = train_test_split(df_final['text'], df_final['label'], test_size=0.2, random_state=42)
    
    model = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english')),
        ('clf', LinearSVC(dual=False))
    ])
    
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    print(f"MODEL_ACCURACY: {acc * 100:.2f}%")
    print(f"TOTAL_SAMPLES: {len(df_final)}")
else:
    print("NO_DATA")
