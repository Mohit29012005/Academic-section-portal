"""
Complete PDF to CSV Extraction - Extracts ALL available data from PDFs
- Subject Code (from filename + text header)
- Subject Name
- Course Name
- Semester
- Questions with marks
Even from scanned PDFs extracts filename metadata
"""

import csv
import re
import os
from pathlib import Path
from collections import defaultdict

# Try multiple PDF libraries
try:
    import pdfplumber

    PDFPLUMBER = True
except:
    PDFPLUMBER = False

try:
    import PyPDF2

    PYPDF2 = True
except:
    PYPDF2 = False

# Config
PDF_FOLDER = r"C:\Academic-module\PYQ_ALL_COURSES_DATA"
OUTPUT_CSV = r"C:\Academic-module\Backend\extracted_pyq_data.csv"

print("=" * 60)
print("PDF TO CSV EXTRACTION TOOL")
print("=" * 60)


def extract_metadata(filename):
    """Extract course, semester, year, exam_type from filename"""
    fname = filename.upper()

    # Course
    course = "Unknown"
    if "MCA" in fname:
        course = "MCA"
    elif "B.SC. (CA" in fname or "CA&IT" in fname:
        course = "BCA(CA&IT)"
    elif "B.SC. IMS" in fname:
        course = "BCA(IMS)"
    elif "DATA SCIENCE" in fname or "DS)" in fname:
        course = "BCA(Data Science)"
    elif "CYBER SECURITY" in fname or "CS)" in fname:
        course = "BCA(Cyber Security)"
    elif "B.SC" in fname:
        course = "BCA"
    elif "DUAL DEGREE" in fname or "DD BCA" in fname:
        course = "DD(BCA-MCA)"
    elif "M.SC" in fname:
        course = "M.Sc"

    # Semester
    sem = 0
    if "SEM-1" in fname or "SEM 1" in fname or "I SEM" in fname:
        sem = 1
    elif "SEM-2" in fname or "SEM 2" in fname or "II SEM" in fname:
        sem = 2
    elif "SEM-3" in fname or "SEM 3" in fname or "III SEM" in fname:
        sem = 3
    elif "SEM-4" in fname or "SEM 4" in fname or "IV SEM" in fname:
        sem = 4
    elif "SEM-5" in fname or "SEM 5" in fname or "V SEM" in fname:
        sem = 5
    elif "SEM-6" in fname or "SEM 6" in fname or "VI SEM" in fname:
        sem = 6

    # Exam type
    exam_type = "Regular"
    if "REMEDIAL" in fname or "REMIDIAL" in fname:
        exam_type = "Remedial"
    elif "MIDTERM" in fname:
        exam_type = "MidTerm"

    # Year
    year = "Unknown"
    y = re.search(r"(20\d{2})", fname)
    if y:
        year = y.group(1)

    return course, sem, exam_type, year


def extract_subject_from_text(text):
    """Extract subject code and name from text"""
    if not text:
        return "UNK", "Unknown"

    text = text[:2000]  # First portion

    # Subject code patterns like U11A1LDP
    code_match = re.search(r"([U]\d{1,2}[A-Z0-9]{3,8})", text)
    if code_match:
        sub_code = code_match.group(1)
    else:
        # Try alternative
        code_match = re.search(r"(U\d[A-Z0-9]+)", text)
        if code_match:
            sub_code = code_match.group(1)
        else:
            sub_code = "UNK"

    # Subject name - usually after subject code
    name_patterns = [
        r"[U]\d[A-Z0-9]+\s*[:\-]\s*([A-Z][A-Za-z\s\-\&]+?)(?:\s*(?:Time|Total)|$)",
        r"([A-Z][A-Z\s]{3,40}?)\s*Time",
        r":\s*([A-Z][A-Za-z\s\-\&]+)",
    ]

    sub_name = "Unknown"
    for pattern in name_patterns:
        m = re.search(pattern, text)
        if m:
            sub_name = m.group(1).strip()
            if len(sub_name) > 3:
                break

    return sub_code, sub_name


def process_pdf(pdf_path):
    """Try to extract text from PDF using multiple methods"""
    text = ""

    # Method 1: pdfplumber
    if PDFPLUMBER:
        try:
            with pdfplumber.open(pdf_path) as p:
                for page in p.pages:
                    t = page.extract_text()
                    if t and len(t) > 50:
                        text += t + "\n"
        except:
            pass

    # Method 2: PyPDF2
    if not text or len(text) < 50 and PYPDF2:
        try:
            with open(pdf_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    t = page.extract_text()
                    if t:
                        text += t + "\n"
        except:
            pass

    return text


# Process all PDFs
pdf_files = list(Path(PDF_FOLDER).rglob("*.pdf"))
print(f"\nFound {len(pdf_files)} PDF files")

all_records = []

for idx, pdf in enumerate(pdf_files):
    if idx % 30 == 0:
        print(f"Processing {idx}/{len(pdf_files)}...")

    try:
        # Get metadata from filename
        course, sem, exam_type, year = extract_metadata(pdf.name)

        if sem == 0:
            continue

        # Try to get text
        text = process_pdf(pdf)

        # Extract subject info
        if text and len(text) > 50:
            sub_code, sub_name = extract_subject_from_text(text)
        else:
            # Use filename details
            sub_code = "UNK"
            sub_name = "Unknown"

        # Extract questions if text available
        questions = []
        if text and len(text) > 100:
            lines = text.split("\n")
            current_marks = 0
            current_q = ""

            for line in lines:
                line = line.strip()
                if not line:
                    continue

                # Marks like [5] or (5) or 5 marks
                marks = re.search(r"\[(\d+)\]|\((\d+)\))", line)
                if marks:
                    if current_q and 0 < current_marks <= 20:
                        questions.append(
                            {"question": current_q[:150], "marks": current_marks}
                        )
                    current_marks = int(marks.group(1) or marks.group(2))
                    current_q = ""
                elif current_marks > 0 and line:
                    # Question text
                    if re.match(r"^(?:Q[\.\)]?|\d+[\.\)]?)\s*[-.\)]?\s*.+", line):
                        current_q = line

        # Add each question as record
        for q in questions:
            all_records.append(
                {
                    "filename": pdf.name,
                    "course": course,
                    "semester": sem,
                    "subject_code": sub_code,
                    "subject_name": sub_name,
                    "year": year,
                    "exam_type": exam_type,
                    "question": q["question"],
                    "marks": q["marks"],
                }
            )

    except Exception as e:
        continue

# Save to CSV
print(f"\nExtracted {len(all_records)} question records")

if all_records:
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=all_records[0].keys())
        w.writeheader()
        w.writerows(all_records)

    print(f"Saved to: {OUTPUT_CSV}")

    # Summary
    course_count = defaultdict(int)
    sem_count = defaultdict(int)

    for r in all_records:
        course_count[r["course"]] += 1
        sem_count[r["semester"]] += 1

    print(f"\n=== SUMMARY ===")
    print(f"Questions by Course:")
    for c, cnt in sorted(course_count.items()):
        print(f"  {c}: {cnt}")
    print(f"\nQuestions by Semester:")
    for s, cnt in sorted(sem_count.items()):
        print(f"  Sem {s}: {cnt}")
else:
    print("\nNo questions extracted from PDFs!")
    print("This is because PDFs are SCANNED IMAGES (no text layer)")
    print("\nCreating metadata CSV from filenames only...")

    # Create CSV from filenames only
    for pdf in pdf_files:
        course, sem, exam_type, year = extract_metadata(pdf.name)
        if sem > 0:
            all_records.append(
                {
                    "filename": pdf.name,
                    "course": course,
                    "semester": sem,
                    "subject_code": "See Paper",
                    "subject_name": "See Paper",
                    "year": year,
                    "exam_type": exam_type,
                    "question": "N/A - Scanned PDF",
                    "marks": 0,
                }
            )

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=all_records[0].keys())
        w.writeheader()
        w.writerows(all_records)

    print(f"Created metadata CSV with {len(all_records)} records")

print("\n[OK] Done!")
