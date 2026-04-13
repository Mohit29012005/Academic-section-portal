"""
Process Subject Data Files and Map to Questions
"""

import os
import re
import csv
import pickle
from pathlib import Path
from collections import defaultdict

DATA_DIR = r"C:\Academic-module\PYQ_ALL_COURSES_DATA\aLL COURSES SUBJECTS SMESTER DATA"
QUESTIONS_DIR = r"C:\Academic-module\PYQ_ALL_COURSES_DATA\questions_only"
OUTPUT_CSV = r"C:\Academic-module\Backend\ml_model\questions_with_subjects.csv"
MODEL_FILE = r"C:\Academic-module\Backend\ml_model\pyq_ml_model.pkl"

print("=" * 60)
print("PROCESSING SUBJECT DATA AND MAPPING TO QUESTIONS")
print("=" * 60)

# Read all subject files
subjects = {}


def parse_subject_file(filepath, course_name):
    """Parse subject text file"""
    content = filepath.read_text(encoding="utf-8", errors="ignore")
    lines = content.split("\n")

    current_sem = 0
    for line in lines:
        line = line.strip()

        # Check semester
        if line.lower().startswith("sem "):
            try:
                current_sem = int(
                    line.lower().replace("sem ", "").replace("sem", "").strip()
                )
            except:
                pass

        # Skip headers
        if "subject name" in line.lower() or not line:
            continue

        # Try to extract subject info - tab separated
        parts = line.split("\t")
        if len(parts) >= 3:
            name = parts[0].strip()
            code = parts[2].strip() if len(parts) > 2 else ""

            if name and current_sem > 0:
                key = f"{course_name}_{current_sem}_{code}"
                subjects[key] = {
                    "course": course_name,
                    "semester": current_sem,
                    "subject_code": code,
                    "subject_name": name,
                }


# Process all course files
course_files = {
    "BSC(IT)": "BSC(IT).txt",
    "BSC-IT(CS)": "BSC-IT(CS).txt",
    "BSC-IT(IMS)": "BSC-IT(IMS).txt",
    "MCA": "MCA ALL semester subjects.txt",
    "MSC(It)": "MSC(It).txt",
    "MSC-IT(AIML)": "MSC-IT(AIML).txt",
    "MSC-IT(CS)": "MSC-IT(CS).txt",
    "MSC-IT(IMS)": "MSC-IT(IMS).txt",
    "DD(BCA-MCA)": "DD(BCA-MCA).txt",
}

for course, filename in course_files.items():
    filepath = Path(DATA_DIR) / filename
    if filepath.exists():
        print(f"Processing: {course}")
        parse_subject_file(filepath, course)

print(f"\nExtracted {len(subjects)} subjects")

# Also read CSV if exists
csv_path = Path(DATA_DIR) / "Ganpat_University_BSc_CAIT_SEM1_Questions.csv"
if csv_path.exists():
    print("\nReading CSV...")
    with open(csv_path, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Map based on subject code
            pass

# Save subjects to CSV
with open(
    r"C:\Academic-module\Backend\ml_model\subjects_list.csv",
    "w",
    newline="",
    encoding="utf-8",
) as f:
    if subjects:
        w = csv.DictWriter(
            f, fieldnames=["course", "semester", "subject_code", "subject_name"]
        )
        w.writeheader()
        for s in subjects.values():
            w.writerow(s)

print(f"[Saved] subjects_list.csv with {len(subjects)} subjects")

# Show sample
print("\n=== SAMPLE SUBJECTS ===")
for i, (k, v) in enumerate(list(subjects.items())[:10]):
    print(
        f"{v['course']} Sem {v['semester']}: {v['subject_code']} - {v['subject_name']}"
    )
