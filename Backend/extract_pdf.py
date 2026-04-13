import PyPDF2
import os

pdf_path = r"C:\Academic-module\PYQ_ALL_COURSES_DATA\B.Sc. IT\SEM-3\BSC IT SEM 3.NOV-DEC-2022Regular.pdf"

try:
    with open(pdf_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages[:3]:  # First 3 pages
            text += page.extract_text() + "\n\n"

        print("=== Extracted Text (First 3 pages) ===")
        print(text[:3000])
except Exception as e:
    print(f"Error: {e}")
    print("Trying with pdfplumber...")

    try:
        import pdfplumber

        with pdfplumber.open(pdf_path) as pdf:
            text = ""
            for page in pdf.pages[:3]:
                text += page.extract_text() or ""
            print(text[:3000])
    except Exception as e2:
        print(f"pdfplumber error: {e2}")
