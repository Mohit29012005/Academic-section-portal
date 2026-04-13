"""
PDF to CSV with Better Question Extraction
"""

import os
import re
import csv
import PyPDF2
from pathlib import Path

PDF_FOLDER = r"C:\Academic-module\PYQ_ALL_COURSES_DATA"
OUTPUT_CSV = r"C:\Academic-module\Backend\pyq_questions.csv"


def extract_course_semester(filename):
    filename = filename.upper()

    course = "Unknown"
    if "MCA" in filename:
        course = "MCA"
    elif "BCA" in filename:
        course = "BCA"
    elif "B.SC" in filename:
        course = "B.Sc."
    elif "DATA SCIENCE" in filename:
        course = "B.Sc. DS"
    elif "CYBER" in filename:
        course = "B.Sc. CS"
    elif "M.SC" in filename:
        course = "M.Sc."

    sem = 0
    for i in range(1, 7):
        if f"SEM-{i}" in filename or f"SEM {i}" in filename or f"0{i}" in filename:
            sem = i
            break

    exam_type = "Regular"
    if "REMED" in filename:
        exam_type = "Remedial"

    year = "Unknown"
    yr = re.search(r"(20\d{2})", filename)
    if yr:
        year = yr.group(1)

    return course, sem, exam_type, year


def extract_questions(text):
    """Extract questions with marks"""
    questions = []
    lines = text.split("\n")

    current_q = {"text": "", "marks": 0}

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Marks pattern
        marks = re.search(r"\[(\d+)\]|\((\d+)\)|(\d+)\s*marks?", line, re.IGNORECASE)

        # Question pattern
        q_match = re.match(r"^(?:Q[\.\)]?|\d+[\.\)]?)\s*(.+)", line, re.IGNORECASE)

        if marks:
            m = marks.group(1) or marks.group(2) or marks.group(3)
            if m:
                # Save previous if exists
                if current_q["text"] and current_q["marks"] > 0:
                    questions.append(current_q.copy())
                current_q = {"text": "", "marks": int(m)}

        if q_match and current_q["marks"] > 0:
            current_q["text"] = q_match.group(1)[:200]

    # Add last
    if current_q["text"] and current_q["marks"] > 0:
        questions.append(current_q)

    return questions


def process_pdf(pdf_path):
    try:
        with open(pdf_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            text = ""
            for page in reader.pages:
                pt = page.extract_text()
                if pt:
                    text += pt + "\n"
            return text
    except:
        return ""


def main():
    print("Processing ALL PDFs...")

    pdf_files = list(Path(PDF_FOLDER).rglob("*.pdf"))
    print(f"Found {len(pdf_files)} PDFs")

    all_data = []

    for i, pdf in enumerate(pdf_files):
        if i % 20 == 0:
            print(f"Processing {i}/{len(pdf_files)}...")

        course, sem, exam_type, year = extract_course_semester(pdf.name)
        text = process_pdf(pdf)

        if text and len(text) > 50:
            questions = extract_questions(text)

            for q in questions:
                all_data.append(
                    {
                        "course": course,
                        "semester": sem,
                        "exam_type": exam_type,
                        "year": year,
                        "question": q["text"],
                        "marks": q["marks"],
                    }
                )

    # Save to CSV
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        if all_data:
            writer = csv.DictWriter(f, fieldnames=all_data[0].keys())
            writer.writeheader()
            writer.writerows(all_data)

    print(f"\nSaved: {OUTPUT_CSV}")
    print(f"Total questions: {len(all_data)}")


if __name__ == "__main__":
    main()
