"""
PDF to CSV Converter for PYQ Question Extraction
Parses all PDF files from PYQ_ALL_COURSES_DATA folder and extracts questions
"""

import os
import re
import csv
import PyPDF2
from pathlib import Path

# Configuration
PDF_FOLDER = r"C:\Academic-module\PYQ_ALL_COURSES_DATA"
OUTPUT_CSV = r"C:\Academic-module\Backend\pyq_data.csv"


def extract_course_semester(filename):
    """Extract course and semester from filename"""
    filename = filename.upper()

    # Course detection
    course = "Unknown"
    if "MCA" in filename:
        course = "MCA"
    elif "BCA" in filename:
        course = "BCA"
    elif "B.SC. IT" in filename or "BSC IT" in filename:
        course = "B.Sc. IT"
    elif "B.SC. (CA" in filename or "BSC (CA" in filename:
        course = "B.Sc. (CA&IT)"
    elif "B.SC. IMS" in filename or "BSC IMS" in filename:
        course = "B.Sc. IMS"
    elif "DATA SCIENCE" in filename:
        course = "B.Sc. IT (DS)"
    elif "CYBER SECURITY" in filename or "CS)" in filename:
        course = "B.Sc. IT (CS)"
    elif "DUAL DEGREE" in filename or "DD BCA" in filename:
        course = "DD (BCA-MCA)"
    elif "M.SC. IT" in filename or "MSC IT" in filename:
        course = "M.Sc. IT"
    elif "M.SC. IMS" in filename or "MSC IMS" in filename:
        course = "M.Sc. IMS"

    # Semester detection
    sem = 0
    if "SEM-1" in filename or "I SEM" in filename or "SEM 1" in filename:
        sem = 1
    elif "SEM-2" in filename or "II SEM" in filename or "SEM 2" in filename:
        sem = 2
    elif "SEM-3" in filename or "III SEM" in filename or "SEM 3" in filename:
        sem = 3
    elif "SEM-4" in filename or "IV SEM" in filename or "SEM 4" in filename:
        sem = 4
    elif "SEM-5" in filename or "V SEM" in filename or "SEM 5" in filename:
        sem = 5
    elif "SEM-6" in filename or "VI SEM" in filename or "SEM 6" in filename:
        sem = 6

    # Exam type
    exam_type = "Regular"
    if "REMEDIAL" in filename or "REMIDIAL" in filename:
        exam_type = "Remedial"
    elif "MIDTERM" in filename:
        exam_type = "MidTerm"

    # Year
    year = "Unknown"
    year_match = re.search(r"(20\d{2})", filename)
    if year_match:
        year = year_match.group(1)

    return course, sem, exam_type, year


def extract_questions_from_text(text):
    """Extract questions from PDF text"""
    questions = []
    lines = text.split("\n")

    current_question = None
    current_marks = 0

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Question number pattern like "1.", "2.", "Q-1", "Q.1", etc.
        q_match = re.match(r"^(?:Q\.?|\d+\.?)\s*[-.\)]?\s*(.+)", line)

        # Marks pattern like "(5 marks)", "[5]", "5M", etc.
        marks_match = re.search(r"\(?\[?(\d+)\s*(?:marks?|M)\)?", line, re.IGNORECASE)

        if marks_match:
            try:
                current_marks = int(marks_match.group(1))
            except:
                pass

    return questions


def process_pdf(pdf_path):
    """Process single PDF file"""
    try:
        with open(pdf_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

            return text
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
        return ""


def main():
    """Main function to process all PDFs"""
    print("Starting PDF to CSV conversion...")
    print(f"PDF Folder: {PDF_FOLDER}")
    print(f"Output: {OUTPUT_CSV}")

    # Get all PDF files
    pdf_folder = Path(PDF_FOLDER)
    pdf_files = list(pdf_folder.rglob("*.pdf"))
    print(f"Found {len(pdf_files)} PDF files")

    # Process each PDF
    all_questions = []

    for i, pdf_file in enumerate(pdf_files):  # Process all PDFs
        print(f"Processing {i + 1}/{min(10, len(pdf_files))}: {pdf_file.name}")

        # Extract metadata from filename
        course, sem, exam_type, year = extract_course_semester(pdf_file.name)

        # Extract text
        text = process_pdf(pdf_file)

        if text:
            # Store basic info
            all_questions.append(
                {
                    "filename": pdf_file.name,
                    "course": course,
                    "semester": sem,
                    "exam_type": exam_type,
                    "year": year,
                    "text_preview": text[:500],
                }
            )

    # Write to CSV
    if all_questions:
        with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=[
                    "filename",
                    "course",
                    "semester",
                    "exam_type",
                    "year",
                    "text_preview",
                ],
            )
            writer.writeheader()
            writer.writerows(all_questions)

        print(f"\nCSV saved to: {OUTPUT_CSV}")
        print(f"Total entries: {len(all_questions)}")
    else:
        print("No data extracted!")


if __name__ == "__main__":
    main()
