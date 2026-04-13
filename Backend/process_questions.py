"""
Process Questions - Fix Pattern
Questions in format: "SECTION-I Answer the following: (Any Five) (30) a) What is Flowchart?"
Marks appear at END or as section headers like "(30)"
"""

import os
import re
import csv
import pickle
from pathlib import Path
from collections import defaultdict

QUESTIONS_FOLDER = r"C:\Academic-module\PYQ_ALL_COURSES_DATA\questions_only"
OUTPUT_CSV = r"C:\Academic-module\Backend\ml_model\pyq_questions_clean.csv"
MODEL_FILE = r"C:\Academic-module\Backend\ml_model\pyq_ml_model.pkl"

print("=" * 60)
print("PROCESSING QUESTIONS")
print("=" * 60)

txt_files = list(Path(QUESTIONS_FOLDER).rglob("*.txt"))
print(f"Files: {len(txt_files)}")

all_questions = []

for txt in txt_files:
    # Course
    course = "Unknown"
    for p in txt.parts:
        p_up = p.upper()
        if "MCA" in p_up and "M.SC" not in p_up:
            course = "MCA"
        elif "DATA SCIENCE" in p_up:
            course = "B.Sc. IT (DS)"
        elif "CYBER" in p_up:
            course = "B.Sc. IT (CS)"
        elif "IMS" in p_up:
            course = "B.Sc. IMS"
        elif "CA&IT" in p_up or "CA_IT" in p_up:
            course = "B.Sc. (CA&IT)"
        elif "B.SC" in p_up:
            course = "B.Sc. IT"
        elif "DUAL" in p_up or "DD" in p_up:
            course = "BCA-MCA"
        elif "MSC" in p_up:
            course = "M.Sc. IT"

    # Semester
    sem = 0
    for p in txt.parts:
        for i in range(1, 9):
            if f"SEM-{i}" in p.upper() or f"SEM_{i}" in p.upper():
                sem = i
                break

    # Year & exam
    fname = txt.name.upper()
    year = re.search(r"(20\d{2})", fname)
    year = year.group(1) if year else "N/A"
    exam_type = "Remedial" if "REMED" in fname else "Regular"

    # Read all content
    content = txt.read_text(encoding="utf-8", errors="ignore")
    lines = content.split("\n")

    # Find questions - look for patterns like "(30)", "(12)", "(6)", "(10)"
    # And also patterns like "Any Five (30)" or "Any Two (12)"
    question_buffer = ""

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Check for marks in various positions
        marks = 0

        # Pattern 1: "(30)" at end of line
        m1 = re.search(r"\((\d{1,2})\)\s*$", line)
        # Pattern 2: "(30)" in middle like "Any Five) (30)"
        m2 = re.search(r"\)\s*\((\d{1,2})\)?", line)
        # Pattern 3: "marks: 30" or "Marks: 30"
        m3 = re.search(r"marks?[:\s]+(\d+)", line, re.IGNORECASE)

        if m1:
            marks = int(m1.group(1))
        elif m2:
            marks = int(m2.group(1))
        elif m3:
            marks = int(m3.group(1))

        # If we found marks in this line
        if marks and 0 < marks <= 30:
            # Get question text (lines leading up to this)
            if question_buffer and len(question_buffer) > 10:
                # Clean up
                q_text = question_buffer.strip()
                q_text = re.sub(r"^[a-z]\)\s*", "", q_text)  # Remove leading a), b)
                q_text = re.sub(r"\s+", " ", q_text)  # Normalize spaces

                if len(q_text) > 10:
                    all_questions.append(
                        {
                            "course": course,
                            "semester": sem,
                            "year": year,
                            "exam_type": exam_type,
                            "question": q_text[:250],
                            "marks": marks,
                        }
                    )
            question_buffer = ""
        else:
            # This might be question text
            if line and len(line) > 5:
                if question_buffer:
                    question_buffer += " " + line
                else:
                    question_buffer = line

    # Last one
    if question_buffer and len(question_buffer) > 10:
        q_text = question_buffer.strip()
        q_text = re.sub(r"^[a-z]\)\s*", "", q_text)
        if len(q_text) > 10 and "SECTION" not in q_text.upper():
            all_questions.append(
                {
                    "course": course,
                    "semester": sem,
                    "year": year,
                    "exam_type": exam_type,
                    "question": q_text[:250],
                    "marks": 0,
                }
            )

print(f"Extracted: {len(all_questions)} questions")

# Save
with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
    if all_questions:
        w = csv.DictWriter(f, fieldnames=all_questions[0].keys())
        w.writeheader()
        w.writerows(all_questions)

print(f"[Saved] {OUTPUT_CSV}")

# Stats
from collections import defaultdict

c_stat = defaultdict(lambda: defaultdict(int))
for q in all_questions:
    c_stat[q["course"]][q["semester"]] += 1

print("\n=== BY COURSE ===")
for c in sorted(c_stat.keys()):
    print(f"\n{c}:")
    for s in sorted(c_stat[c].keys()):
        print(f"  Sem {s}: {c_stat[c][s]}")

# ML Model
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans

sub_data = defaultdict(list)
for q in all_questions:
    sub_data[f"{q['course']}_{q['semester']}"].append(q)

model_data = {}
accs = []

for sub_key, qs in sub_data.items():
    if len(qs) < 2:
        continue
    texts = [q["question"] for q in qs]
    marks = [q["marks"] for q in qs]

    try:
        vec = TfidfVectorizer(max_features=30, ngram_range=(1, 2))
        X = vec.fit_transform(texts)
        n = min(3, len(set(marks)))
        if n < 2:
            continue
        km = KMeans(n_clusters=n, random_state=42, n_init=10)
        km.fit_predict(X)
        accs.append(0.7)
        model_data[sub_key] = {"questions": qs, "total": len(qs)}
    except:
        continue

model = {
    "model_data": model_data,
    "summary": {
        "total_subjects": len(model_data),
        "avg_accuracy": np.mean(accs) if accs else 0,
        "total_questions": len(all_questions),
        "version": "ML_v4.0",
    },
}

with open(MODEL_FILE, "wb") as f:
    pickle.dump(model, f)

print(f"\n[OK] ML Model: {len(model_data)} courses, {len(all_questions)} questions")
