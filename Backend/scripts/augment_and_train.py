import os
import pandas as pd
import numpy as np
import re
import joblib
import django
import sys
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Django Setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampics.settings')
sys.path.append(os.path.join(os.getcwd(), 'Backend'))
django.setup()

from academics.models import Subject

def generate_synthetic_questions(subject_name):
    """Generates a list of generic exam questions for a given subject name."""
    templates = [
        "What is {subject} and explain its basic concepts?",
        "Discuss the advantages and disadvantages of {subject}.",
        "Explain the architecture and working principle of {subject}.",
        "Compare {subject} with other related technologies.",
        "Write a short note on the evolution of {subject} in the modern era.",
        "Draw a neat diagram to represent {subject} components.",
        "Analyze the role of {subject} in software development.",
        "Define {subject} and its key characteristics.",
        "Explain the various types of {subject} with examples.",
        "Describe the implementation of {subject} in a real-world scenario."
    ]
    # Clean subject name for templates (remove codes if any)
    clean_sub = re.sub(r'\(.*?\)', '', subject_name).strip()
    return [t.format(subject=clean_sub) for t in templates]

def augment_and_train():
    print("--- STARTING DATA AUGMENTATION ---")
    
    # 1. Get Subjects from DB
    subjects = Subject.objects.all()
    print(f"Generating synthetic questions for {subjects.count()} subjects...")
    
    augmented_data = []
    for sub in subjects:
        # Add the subject name itself multiple times to strengthen the label
        for _ in range(5):
            augmented_data.append({'text': sub.name, 'label': sub.code})
        
        # Add synthetic questions
        questions = generate_synthetic_questions(sub.name)
        for q in questions:
            augmented_data.append({'text': q, 'label': sub.code})

    # 2. Add existing Excel data (if available)
    questions_path = 'c:/Academic-module/PYQ_ALL_COURSES_DATA/Ganpat_University_Questions.xlsx'
    if os.path.exists(questions_path):
        df_xlsx = pd.read_excel(questions_path)
        # For simplicity in this script, we'll only use high-confidence Excel questions 
        # (Already captured in previous labeling logic or we can re-map)
        # Note: In a real scenario, we'd use the results from the previous 'finalize' run's labeled data.
        # But for this augmentation run, we'll focus on boosting with synthetic data.
        pass

    df_train = pd.DataFrame(augmented_data)
    print(f"Total training samples after augmentation: {len(df_train)}")

    # 3. Train Model
    X_train, X_test, y_train, y_test = train_test_split(df_train['text'], df_train['label'], test_size=0.1, random_state=42)
    
    model = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 3), stop_words='english', max_features=10000)),
        ('clf', LinearSVC(dual=False, C=1.5))
    ])
    
    print("Training improved model...")
    model.fit(X_train, y_train)
    
    # Eval
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"NEW MODEL ACCURACY: {acc * 100:.2f}%")

    # 4. Save
    model_output = 'c:/Academic-module/ML Model/pyq_intelligent_model_v2.pkl'
    joblib.dump(model, model_output)
    # Also overwrite the main model
    joblib.dump(model, 'c:/Academic-module/ML Model/pyq_intelligent_model.pkl')
    
    print(f"Improved model saved to {model_output}")

if __name__ == "__main__":
    augment_and_train()
