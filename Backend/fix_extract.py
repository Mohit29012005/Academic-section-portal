"""
Proper PDF Metadata Extraction - Fixed Course Detection
"""

import csv
import re
from pathlib import Path

PDF_FOLDER = r"C:\Academic-module\PYQ_ALL_COURSES_DATA"
OUTPUT_CSV = r"C:\Academic-module\Backend\extracted_pyq_data.csv"


def extract_all_info(filename):
    fname = filename
    fname_up = filename.upper()

    # Course mapping
    course = "Unknown"
    if "MCA" in fname_up and "M.SC" not in fname_up:
        course = "MCA"
    elif "DATA SCIENCE" in fname_up:
        course = "B.Sc. IT (Data Science)"
    elif "CYBER SECURITY" in fname_up or "(CS)" in fname_up:
        course = "B.Sc. IT (Cyber Security)"
    elif "B.SC. IMS" in fname_up or "IMS" in fname_up:
        course = "B.Sc. IMS"
    elif "B.SC. (CA" in fname_up or "CA&IT" in fname_up:
        course = "B.Sc. (CA & IT)"
    elif "B.SC IT" in fname_up or "BSC IT" in fname_up:
        course = "B.Sc. IT"
    elif "DUAL DEGREE" in fname_up or "DD BCA" in fname_up:
        course = "BCA-MCA (Dual)"
    elif "M.SC. IT" in fname_up or "MSC IT" in fname_up:
        if "CYBER" in fname_up:
            course = "M.Sc. IT (Cyber Security)"
        elif "IMS" in fname_up:
            course = "M.Sc. IMS"
        else:
            course = "M.Sc. IT"

    # Semester
    sem = 0
    for i in range(1, 9):
        if f"SEM-{i}" in fname_up or f"SEM {i}" in fname_up or f"-{i}" in fname_up:
            if i <= 6:
                sem = i
                break

    # Year
    year = "N/A"
    y = re.search(r"(20\d{2})", fname_up)
    if y:
        year = y.group(1)

    # Exam type
    exam = "Regular"
    if "REMEDIAL" in fname_up or "REMIDIAL" in fname_up:
        exam = "Remedial"

    # Subject name from filename
    subject = "See PDF Content"

    return {
        "filename": filename,
        "course": course,
        "semester": sem,
        "subject": subject,
        "year": year,
        "exam_type": exam,
    }


# Process
pdfs = list(Path(PDF_FOLDER).rglob("*.pdf"))
records = []

for pdf in pdfs:
    info = extract_all_info(pdf.name)
    records.append(info)

# Save
with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=records[0].keys())
    w.writeheader()
    w.writerows(records)

print(f"Created: {OUTPUT_CSV}")
print(f"Total: {len(records)} files")

# Stats
from collections import defaultdict

c_count = defaultdict(int)
s_count = defaultdict(int)

for r in records:
    c_count[r["course"]] += 1
    if r["semester"] > 0:
        s_count[r["semester"]] += 1

print("\n=== By Course ===")
for c, n in sorted(c_count.items(), key=lambda x: -x[1]):
    print(f"  {c}: {n}")

print("\n=== By Semester ===")
for s, n in sorted(s_count.items()):
    print(f"  Sem {s}: {n}")
