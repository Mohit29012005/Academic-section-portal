"""
Build Updated ML Model from Extracted Questions
"""

import csv
import pickle
from collections import defaultdict

CSV_FILE = r"C:\Academic-module\Backend\pyq_questions.csv"
MODEL_FILE = r"C:\Academic-module\Backend\AI_Powered_Exam_Paper_Generator\ml\exam_paper_model.pkl"


def build_model():
    print("Building ML model from extracted questions...")

    questions_by_subject = defaultdict(list)
    clusters = {}
    subject_data = {}
    sem_subjects = defaultdict(dict)

    with open(CSV_FILE, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            course = row.get("course", "Unknown")
            sem = int(row.get("semester", 0))
            year = row.get("year", "Unknown")
            question = row.get("question", "").strip()
            marks = int(row.get("marks", 0))

            if not question or sem == 0 or marks == 0:
                continue

            # Create subject key
            key = f"{sem}_{course[:3].upper()}"

            questions_by_subject[key].append(
                {"text": question[:100], "marks": marks, "year": year}
            )

            sem_subjects[sem][key] = f"{course} Subject"

    # Build subject_data
    for key, qlist in questions_by_subject.items():
        if qlist:
            # Random sampling for ML
            import random

            random.seed(42)
            sampled = qlist[:30]  # Max 30 per subject

            # Categorize by marks
            by_marks = defaultdict(list)
            for q in sampled:
                by_marks[q["marks"]].append(q)

            subject_data[key] = sampled
            clusters[key] = {k: len(v) for k, v in by_marks.items()}

            print(f"  {key}: {len(qlist)} questions")

    # Create model
    model = {
        "clusters": clusters,
        "subject_data": subject_data,
        "threshold": 0.55,
        "sem_subjects": dict(sem_subjects),
        "total_questions": sum(len(q) for q in subject_data.values()),
        "source": "PDF_CSV_2024_v2",
    }

    # Save
    with open(MODEL_FILE, "wb") as f:
        pickle.dump(model, f)

    print(f"\n=== NEW ML Model Created ===")
    print(f"Subjects: {len(subject_data)}")
    print(f"Total Questions: {model['total_questions']}")
    print(f"Clusters: {len(clusters)}")
    print(f"Saved: {MODEL_FILE}")


if __name__ == "__main__":
    build_model()
