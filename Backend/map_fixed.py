"""
Improved Mapping - Fix course name matching
"""

import csv
import re
from pathlib import Path
from collections import defaultdict

QUESTIONS_DIR = r"C:\Academic-module\PYQ_ALL_COURSES_DATA\questions_only"
SUBJECTS_CSV = r"C:\Academic-module\Backend\ml_model\subjects_list.csv"
OUTPUT_CSV = r"C:\Academic-module\Backend\ml_model\questions_with_subjects.csv"

print("=" * 60)
print("MAPPING QUESTIONS (FIXED)")
print("=" * 60)

# Load subjects with better structure
subjects = {}
with open(SUBJECTS_CSV, "r", encoding="utf-8", errors="ignore") as f:
    reader = csv.DictReader(f)
    for row in reader:
        key = f"{row['course']}_{row['semester']}_{row['subject_code']}"
        subjects[key] = row

# Course name mapping
course_map = {
    "MCA": ["MCA"],
    "BSC(IT)": ["B.SC IT", "BSC IT", "B.SC. IT", "BSCIT", "B.SC"],
    "BSC-IT(CS)": ["CYBER", "CS)", "B.SC IT"],
    "BSC-IT(IMS)": ["IMS"],
    "BSC(CA&IT)": ["CA&IT", "CA_IT"],
    "MSC(It)": ["M.SC IT", "MSC IT"],
    "MSC-IT(AIML)": ["AIML", "AI & ML"],
    "MSC-IT(CS)": ["M.SC IT"],
    "DD(BCA-MCA)": ["DUAL", "DD BCA"],
}


def get_course(path_parts):
    """Get course from path"""
    path_str = " ".join(path_parts).upper()
    for course, keywords in course_map.items():
        for kw in keywords:
            if kw in path_str:
                return course
    return "Unknown"


# Read questions
questions = []
txt_files = list(Path(QUESTIONS_DIR).rglob("*.txt"))

for txt in txt_files:
    course = get_course(txt.parts)
    parts = txt.parts

    # Semester
    sem = 0
    for p in parts:
        for i in range(1, 7):
            if f"SEM-{i}" in p.upper() or f"SEM_{i}" in p.upper():
                sem = i
                break

    # Skip if no course or sem
    if course == "Unknown" or sem == 0:
        continue

    # Get subjects for this course+sem
    course_subs = {
        k: v
        for k, v in subjects.items()
        if v["course"] == course and int(v["semester"]) == sem
    }

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

                if len(q_text) > 10:
                    # Match subject - try multiple strategies
                    matched = False

                    # Strategy 1: Look for subject code in question
                    for sub_key, sub in course_subs.items():
                        code = sub["subject_code"]
                        if code and code in q_text.upper():
                            questions.append(
                                {
                                    "course": course,
                                    "semester": sem,
                                    "subject": sub["subject_name"],
                                    "subject_code": code,
                                    "question": q_text,
                                    "marks": current_marks,
                                }
                            )
                            matched = True
                            break

                    # Strategy 2: Keyword match
                    if not matched and course_subs:
                        best_match = None
                        best_score = 0

                        q_lower = q_text.lower()

                        for sub in course_subs.values():
                            sub_name = sub["subject_name"].lower()
                            # Count matching words
                            words = sub_name.split()
                            score = sum(1 for w in words if len(w) > 3 and w in q_lower)

                            if score > best_score:
                                best_score = score
                                best_match = sub

                        if best_match and best_score > 0:
                            questions.append(
                                {
                                    "course": course,
                                    "semester": sem,
                                    "subject": best_match["subject_name"],
                                    "subject_code": best_match["subject_code"],
                                    "question": q_text,
                                    "marks": current_marks,
                                }
                            )
                        else:
                            # Default first subject
                            first_sub = list(course_subs.values())[0]
                            questions.append(
                                {
                                    "course": course,
                                    "semester": sem,
                                    "subject": first_sub["subject_name"],
                                    "subject_code": first_sub["subject_code"],
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

print(f"Mapped {len(questions)} questions")

# Save
with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
    if questions:
        w = csv.DictWriter(f, fieldnames=questions[0].keys())
        w.writeheader()
        w.writerows(questions)

print(f"[Saved] {OUTPUT_CSV}")

# Stats
from collections import defaultdict

stat = defaultdict(lambda: defaultdict(int))
known = 0

for q in questions:
    stat[q["course"]][q["semester"]] += 1
    if q["subject"] != "Unknown":
        known += 1

print(f"\n=== MAPPED (with subjects) ===")
for c in sorted(stat.keys()):
    print(f"\n{c}:")
    for s in sorted(stat[c].keys()):
        print(f"  Sem {s}: {stat[c][s]}")

print(f"\nTotal with known subject: {known}/{len(questions)}")
