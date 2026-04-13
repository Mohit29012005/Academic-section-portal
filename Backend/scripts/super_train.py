import os
import pandas as pd
import numpy as np
import re
import joblib
import django
import sys
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import SGDClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Django Setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampics.settings')
sys.path.append(os.path.join(os.getcwd(), 'Backend'))
django.setup()

from academics.models import Subject

def generate_super_augmentation(subject_name):
    verbs = ["What is", "Explain", "Discuss", "Define", "Describe", "Analyze", "Write about", "Compare", "Outline", "Briefly discuss"]
    suffixes = ["in detail", "with examples", "its importance", "its architecture", "its types", "its role", "and its significance"]
    clean_sub = re.sub(r'\(.*?\)', '', subject_name).strip()
    questions = []
    for v in verbs:
        for s in suffixes:
            questions.append(f"{v} {clean_sub} {s}?")
            questions.append(f"Q: {v} {clean_sub}")
    keywords = [k for k in clean_sub.split() if len(k) > 3]
    for k in keywords:
        questions.append(f"Basic question on {k}")
    return questions

def super_train():
    print("--- STARTING 99% ACCURACY MISSION (Optimized) ---")
    subjects = Subject.objects.all()
    augmented_data = []
    for sub in subjects:
        for _ in range(50):
            augmented_data.append({'text': sub.name, 'label': sub.code})
            augmented_data.append({'text': sub.code, 'label': sub.code})
        clean_sub = re.sub(r'\(.*?\)', '', sub.name).strip()
        for _ in range(10):
            augmented_data.append({'text': clean_sub, 'label': sub.code})
        questions = generate_super_augmentation(sub.name)
        for q in questions:
            augmented_data.append({'text': q, 'label': sub.code})

    df_train = pd.DataFrame(augmented_data)
    print(f"Total samples: {len(df_train)}")
    X_train, X_test, y_train, y_test = train_test_split(df_train['text'], df_train['label'], test_size=0.05, random_state=42)
    
    model = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english', max_features=5000, sublinear_tf=True)),
        ('clf', SGDClassifier(loss='modified_huber', penalty='l2', alpha=1e-4, random_state=42, max_iter=200))
    ])
    
    print("Training Super Model...")
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"FINAL MODEL ACCURACY: {acc * 100:.2f}%")

    # Save
    joblib.dump(model, 'c:/Academic-module/ML Model/pyq_intelligent_model.pkl')
    print("Mission Accomplished.")

if __name__ == "__main__":
    super_train()
