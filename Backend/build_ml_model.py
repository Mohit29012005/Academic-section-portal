"""
Build ML Model from PYQ CSV Data
Creates a new ML model for exam paper generation
"""

import csv
import pickle
import re
import json
from collections import defaultdict
from pathlib import Path

CSV_FILE = r"C:\Academic-module\Backend\pyq_data.csv"
MODEL_FILE = r"C:\Academic-module\Backend\AI_Powered_Exam_Paper_Generator\ml\exam_paper_model.pkl"


def parse_question(text, subject_code, subject_name):
    """Extract individual questions from PDF text"""
    questions = []

    lines = text.split("\n")
    current_q = None
    current_marks = 0
    current_text = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Question detection patterns
        q_match = re.match(r"^(?:Q\.?|Que\.?|\d+[\.\)])\s*(.+)", line)
        marks_match = re.search(r"\[?(\d+)\s*(?:marks?|M)\]?", line, re.IGNORECASE)

        if q_match or (current_q and marks_match):
            # Save previous question
            if current_text and current_marks > 0:
                questions.append(
                    {
                        "text": " ".join(current_text[:100]),  # Limit text length
                        "marks": current_marks,
                        "subject": subject_code,
                        "subject_name": subject_name,
                    }
                )

            # Start new question
            if marks_match:
                current_marks = int(marks_match.group(1))
            else:
                current_marks = 0
            current_text = [q_match.group(1)] if q_match else [line]
            current_q = True
        elif current_q and line:
            current_text.append(line)

    # Add last question
    if current_text and current_marks > 0:
        questions.append(
            {
                "text": " ".join(current_text[:100]),
                "marks": current_marks,
                "subject": subject_code,
                "subject_name": subject_name,
            }
        )

    return questions


def extract_subject_code(text):
    """Extract subject code from PDF text"""
    # Pattern like "U11A1IP1" or similar
    code_match = re.search(r"([U]\d{1,2}[A-Z0-9]+)", text)
    if code_match:
        return code_match.group(1).upper()

    # Alternative: extract from filename
    return "UNK"


def extract_subject_name(text):
    """Extract subject name from PDF text"""
    # Look for subject name pattern
    name_match = re.search(
        r"[:\-]\s*([A-Z][A-Za-z\s\-\&]+?)(?:\s*Time|$)", text, re.IGNORECASE
    )
    if name_match:
        return name_match.group(1).strip()

    # Try second pattern
    name_match = re.search(r"([A-Z][A-Za-z\s\-\&]+?)\s*Time", text, re.IGNORECASE)
    if name_match:
        return name_match.group(1).strip()

    return "Unknown"


def build_model():
    """Build ML model from CSV data"""
    print("Building ML model from PYQ data...")

    # Read CSV
    questions_by_subject = defaultdict(list)
    clusters = {}
    subject_data = {}
    sem_subjects = defaultdict(dict)

    row_count = 0
    with open(CSV_FILE, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            row_count += 1
            if row_count % 10 == 0:
                print(f"Processing row {row_count}...")

            text = row.get("text_preview", "")
            if not text or len(text) < 20:
                continue

            course = row.get("course", "Unknown")
            semester = int(row.get("semester", 0))
            exam_type = row.get("exam_type", "Regular")
            year = row.get("year", "Unknown")

            if semester == 0:
                continue

            # Extract subject info
            subject_code = extract_subject_code(text)
            subject_name = extract_subject_name(text)

            if subject_code == "UNK" or not subject_code:
                # Generate from course + sem
                subject_code = f"U{semester}1{row.get('filename', '')[:3].upper()}"

            # Parse questions
            questions = parse_question(text, subject_code, subject_name)

            if questions:
                key = f"{semester}_{subject_code}"
                questions_by_subject[key].extend(questions)

                # Track subjects by semester
                sem_subjects[semester][subject_code] = subject_name

    # Create subject_data
    for key, qlist in questions_by_subject.items():
        sem, code = key.split("_", 1)
        if qlist:
            subject_data[key] = qlist
            print(f"  {key}: {len(qlist)} questions")

    # Create simple clustering by marks distribution
    for key, qlist in questions_by_subject.items():
        marks_dist = defaultdict(int)
        for q in qlist:
            marks = q.get("marks", 0)
            if marks > 0:
                marks_dist[marks] += 1

        if marks_dist:
            clusters[key] = dict(marks_dist)

    # Create model
    model = {
        "clusters": clusters,
        "subject_data": subject_data,
        "threshold": 0.55,
        "sem_subjects": dict(sem_subjects),
        "total_questions": sum(len(q) for q in subject_data.values()),
        "source": "PDF_CSV_2024",
    }

    # Save model
    with open(MODEL_FILE, "wb") as f:
        pickle.dump(model, f)

    print(f"\n=== Model Created ===")
    print(f"Total subjects: {len(subject_data)}")
    print(f"Total questions: {model['total_questions']}")
    print(f"Clusters: {len(clusters)}")
    print(f"Saved to: {MODEL_FILE}")


if __name__ == "__main__":
    build_model()
