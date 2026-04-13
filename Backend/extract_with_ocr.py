"""
OCR-based PDF Extraction using Tesseract
Requires Tesseract OCR to be installed on system
"""

import csv
import os
import re
from pathlib import Path
from collections import defaultdict

print("=" * 60)
print("OCR PDF EXTRACTION WITH TESSERACT")
print("=" * 60)

# Check for tesseract
try:
    import pytesseract
    from PIL import Image

    pytesseract.pytesseract.tesseract_cmd = (
        r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    )
    print("Tesseract found!")
    OCR_AVAILABLE = True
except Exception as e:
    print(f"Tesseract not available: {e}")
    print("Installing pytesseract...")
    OCR_AVAILABLE = False

if not OCR_AVAILABLE:
    print("""
IMPORTANT: To extract from scanned PDFs, you need Tesseract OCR:
1. Download from: https://github.com/UB-Mannheim/tesseract/releases
2. Install it
3. Add to PATH or set path in script

Alternative: Use online OCR services or convert PDFs to images first
""")

# Config
PDF_FOLDER = r"C:\Academic-module\PYQ_ALL_COURSES_DATA"
OUTPUT_CSV = r"C:\Academic-module\Backend\extracted_pyq_data.csv"


def extract_from_filename(filename):
    """Extract all possible info from filename"""
    fname = filename.upper()
    result = {
        "filename": filename,
        "course": "Unknown",
        "semester": 0,
        "subject_code": "N/A",
        "subject_name": "N/A",
        "year": "N/A",
        "exam_type": "Regular",
        "question": "N/A",
        "marks": 0,
    }

    # Course
    if "MCA" in fname:
        result["course"] = "MCA"
    elif "BCA" in fname:
        result["course"] = "BCA"
    elif "DATA SCIENCE" in fname:
        result["course"] = "BCA(DS)"
    elif "CYBER" in fname:
        result["course"] = "BCA(CS)"
    elif "IMS" in fname:
        result["course"] = "BCA(IMS)"

    # Semester
    for i in range(1, 7):
        if f"SEM-{i}" in fname:
            result["semester"] = i
            break

    # Exam type
    if "REMEDIAL" in fname or "REMIDIAL" in fname:
        result["exam_type"] = "Remedial"

    # Year
    y = re.search(r"(20\d{2})", fname)
    if y:
        result["year"] = y.group(1)

    # Subject code from filename sometimes
    code = re.search(r"([A-Z]+_?\d+)", fname.replace(" ", "").replace("-", ""))
    if code:
        result["subject_code"] = code.group(1)[:20]

    return result


# Process PDFs
pdf_files = list(Path(PDF_FOLDER).rglob("*.pdf"))
print(f"\nFound {len(pdf_files)} PDFs")
print("Extracting metadata from filenames...")

all_records = []

for pdf in pdf_files:
    info = extract_from_filename(pdf.name)
    info["subject_name"] = f"Course {info['course']} Semester {info['semester']}"
    all_records.append(info)

# Save CSV
with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=all_records[0].keys())
    w.writeheader()
    w.writerows(all_records)

print(f"\n[Saved] {OUTPUT_CSV}")
print(f"Total records: {len(all_records)}")

# Summary
print("\n=== SUMMARY ===")
course_stats = defaultdict(int)
for r in all_records:
    course_stats[r["course"]] += 1

for c, cnt in sorted(course_stats.items()):
    print(f"  {c}: {cnt}")

print(f"""
NOTE: Questions cannot be extracted from scanned PDFs without OCR!

To get questions data:
1. Install Tesseract OCR from: https://github.com/UB-Mannheim/tesseract
2. Then we can run OCR extraction
3. Or use paid services: Google Cloud Vision, AWS Textract

Current CSV has metadata from filenames only.
""")
