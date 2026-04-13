"""
Complete Mapping - All 10 Courses
"""

import csv
import re
from pathlib import Path
from collections import defaultdict

QUESTIONS_DIR = r"C:\Academic-module\PYQ_ALL_COURSES_DATA\questions_only"
SUBJECTS_CSV = r"C:\Academic-module\Backend\ml_model\subjects_list.csv"
OUTPUT_CSV = r"C:\Academic-module\Backend\ml_model\questions_with_subjects.csv"

print("=" * 60)
print("MAPPING ALL 10 COURSES")
print("=" * 60)

# Load subjects
subjects = {}
with open(SUBJECTS_CSV, "r", encoding="utf-8", errors="ignore") as f:
    reader = csv.DictReader(f)
    for row in reader:
        subjects[row["subject_code"]] = row

# Complete course mapping
course_map = {
    "B.Sc. (CA&IT)": ["B.SC. (CA&IT)", "B.SC. (CA", "CA&IT", "CA_IT"],
    "B.Sc. IMS": ["B.SC. IMS", "B.SC IMS", "IMS"],
    "B.Sc. IT": ["B.SC. IT", "B.SC IT", "BSC IT", "BSCIT"],
    "B.Sc. IT (CYBER SECURITY)": ["CYBER", "CS)", "B.SC. IT ("],
    "INTE. DUAL DEGREE (BCA)-(MCA)": ["DUAL", "DD BCA", "DD(BCA"],
    "M.Sc. ARTIFICIAL INTELLIGENCE & MACHINE LEARNING": [
        "AIML",
        "AI & ML",
        "ARTIFICIAL",
    ],
    "M.Sc. IMS": ["M.SC. IMS", "MSC IMS"],
    "M.Sc. IT": ["M.SC. IT", "MSC IT"],
    "M.Sc. IT (CYBER SECURITY)": ["M.SC. IT (C", "MSC-IT(C"],
    "MCA": ["MCA"],
}


def get_course(path_parts):
    path_str = " ".join(path_parts).upper()
    for course, keywords in course_map.items():
        for kw in keywords:
            if kw.upper() in path_str:
                return course
    return "Unknown"


# Load questions
questions = []
txt_files = list(Path(QUESTIONS_DIR).rglob("*.txt"))
print(f"Found {len(txt_files)} files")

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

    if course == "Unknown" or sem == 0:
        print(f"Skipping: {txt.name} (course: {course}, sem: {sem})")
        continue

    # Get subjects
    course_subs = {
        k: v
        for k, v in subjects.items()
        if v["course"].replace(" ", "").replace("-", "").lower()
        in course.replace(" ", "").replace("-", "").lower()[:10]
        or (course in k and v["semester"] == str(sem))
    }

    # Fallback: all subjects for this course
    if not course_subs:
        for k, v in subjects.items():
            if course in v["course"] or v["course"] in course:
                if int(v["semester"]) == sem:
                    course_subs[k] = v

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
                    # Default subject
                    first_sub = (
                        list(course_subs.values())[0]
                        if course_subs
                        else {"subject_name": "General", "subject_code": "N/A"}
                    )

                    questions.append(
                        {
                            "course": course,
                            "semester": sem,
                            "subject": first_sub.get("subject_name", "General"),
                            "subject_code": first_sub.get("subject_code", "N/A"),
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

print(f"\nMapped {len(questions)} questions")

# Stats
from collections import defaultdict

stat = defaultdict(int)
for q in questions:
    stat[q["course"]] += 1

print("\n=== BY COURSE ===")
for c, n in sorted(stat.items(), key=lambda x: -x[1]):
    print(f"  {c}: {n}")

# Save
with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
    if questions:
        w = csv.DictWriter(f, fieldnames=questions[0].keys())
        w.writeheader()
        w.writerows(questions)

print(f"\n[Saved] {OUTPUT_CSV}")
