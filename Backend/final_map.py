"""
Final Proper Mapping - Match course names correctly
"""

import csv
import re
from pathlib import Path
from collections import defaultdict

QUESTIONS_DIR = r"C:\Academic-module\PYQ_ALL_COURSES_DATA\questions_only"
SUBJECTS_CSV = r"C:\Academic-module\Backend\ml_model\subjects_list.csv"
OUTPUT_CSV = r"C:\Academic-module\Backend\ml_model\questions_with_subjects.csv"

print("=" * 60)
print("FINAL MAPPING - ALL SUBJECTS")
print("=" * 60)

# Load all subjects by course
subjects_by_course = defaultdict(lambda: defaultdict(list))
with open(SUBJECTS_CSV, "r", encoding="utf-8", errors="ignore") as f:
    reader = csv.DictReader(f)
    for row in reader:
        course = row["course"]
        sem = int(row["semester"])
        subjects_by_course[course][sem].append(
            {"name": row["subject_name"], "code": row["subject_code"]}
        )

print("Available courses in subjects DB:")
for c in subjects_by_course:
    print(f"  {c}")

# Map folder names to DB course names
folder_to_db = {
    "B.Sc. (CA&IT)": "BSC(CA&IT)",
    "B.Sc. IMS": "BSC-IT(IMS)",
    "B.Sc. IT": "BSC(IT)",
    "B.Sc. IT (CYBER SECURITY)": "BSC-IT(CS)",
    "INTE. DUAL DEGREE (BCA)-(MCA)": "DD(BCA-MCA)",
    "M.Sc. ARTIFICIAL INTELLIGENCE & MACHINE LEARNING": "MSC-IT(AIML)",
    "M.Sc. IMS": "MSC-IT(IMS)",
    "M.Sc. IT": "MSC(It)",
    "M.Sc. IT (CYBER SECURITY)": "MSC-IT(CS)",
    "MCA": "MCA",
}

# Read questions
questions = []
txt_files = list(Path(QUESTIONS_DIR).rglob("*.txt"))
print(f"\nProcessing {len(txt_files)} files...")

for txt in txt_files:
    # Get folder name
    folder_name = None
    for p in txt.parts:
        if "questions_only" in p:
            continue
        if p in folder_to_db or any(x in p for x in folder_to_db.keys()):
            folder_name = p
            break

    if not folder_name:
        continue

    # Get DB course name
    db_course = folder_to_db.get(folder_name)
    if not db_course:
        # Try partial match
        for k, v in folder_to_db.items():
            if k in txt.name or k in str(txt.parts):
                db_course = v
                break

    if not db_course:
        continue

    # Semester
    sem = 0
    for p in txt.parts:
        for i in range(1, 7):
            if f"SEM-{i}" in p.upper() or f"SEM_{i}" in p.upper():
                sem = i
                break

    if sem == 0:
        continue

    # Get subjects for this course+sem
    course_subs = subjects_by_course.get(db_course, {}).get(sem, [])

    # Read questions
    content = txt.read_text(encoding="utf-8", errors="ignore")
    lines = content.split("\n")

    current_q = ""
    current_marks = 0

    for line in lines:
        line = line.strip()
        if not line:
            continue

        marks_match = re.search(r"\((\d{1,2})\)\s*$|\)\s*\((\d{1,2})\)", line)

        if marks_match:
            if current_q and 0 < current_marks <= 30:
                q_text = re.sub(r"^[a-z]\)\s*", "", current_q.strip())
                q_text = re.sub(r"\s+", " ", q_text)[:250]

                if len(q_text) > 10 and course_subs:
                    # Use first subject as default
                    sub = course_subs[0]
                    questions.append(
                        {
                            "course": db_course,
                            "semester": sem,
                            "subject": sub["name"],
                            "subject_code": sub["code"],
                            "question": q_text,
                            "marks": current_marks,
                        }
                    )

            m = marks_match.group(1) or marks_match.group(2)
            if m:
                current_marks = int(m)
                current_q = ""
        elif current_marks > 0 and line and len(line) > 5:
            current_q = (current_q + " " + line) if current_q else line

print(f"\nMapped: {len(questions)} questions")

# Stats
from collections import defaultdict

stat = defaultdict(lambda: defaultdict(int))
for q in questions:
    stat[q["course"]][q["semester"]] += 1

print("\n=== QUESTIONS BY COURSE & SEMESTER ===")
for course in sorted(stat.keys()):
    print(f"\n{course}:")
    for sem in sorted(stat[course].keys()):
        print(f"  Sem {sem}: {stat[course][sem]} questions")

# Save
with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
    if questions:
        w = csv.DictWriter(f, fieldnames=questions[0].keys())
        w.writeheader()
        w.writerows(questions)

print(f"\n[Saved] {OUTPUT_CSV}")
