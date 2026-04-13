import os
import csv
import re
import pdfplumber

def clean_text(text):
    if not text: return ""
    # Strip unnecessary newlines and make it a single line first to clean up
    text = re.sub(r'\n+', ' ', text)
    
    # Remove generic exam phrases
    text = re.sub(r'Answer the following.*?(?=\s|$)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Que-[0-9]+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Q\.[0-9]+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'(OR)', '', text)
    
    # Remove marks indicators like [5], [6], (5), (6), {5}
    text = re.sub(r'\[\s*[0-9]+\s*\]', '', text)
    text = re.sub(r'\(\s*[0-9]+\s*\)', '', text)
    text = re.sub(r'\{\s*[0-9]+\s*\}', '', text)
    
    # Remove stray numbers which are likely marks (separated by spaces at the end)
    text = re.sub(r'\s+[0-9]+\s*$', '', text)
    
    # Strip leading markers that might have bypassed the split
    text = re.sub(r'^[0-9]+[\.\)]\s*', '', text)
    
    # Convert excessive spaces to a single space
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_questions_from_pdf(filepath):
    questions = []
    try:
        with pdfplumber.open(filepath) as pdf:
            full_text = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    full_text += page_text + "\n"
            
            # Split text based on question boundaries:
            # Look for "1. ", "2) ", "[A]", "(A)", "a)", "Q1.", etc.
            # We use a regex that matches these markers to split the text.
            boundaries = r'(?:^|\n|\s)(?:Q[0-9]+[\.\-]|[0-9]{1,2}[\.\)]\s|\[[A-Za-z]\]|\([A-Za-z]\)|[A-Za-z]\))'
            raw_splits = re.split(boundaries, full_text)
            
            for rs in raw_splits:
                cleaned = clean_text(rs)
                # Ensure it's a valid sentence/question (longer than 10 chars, contains alphabets)
                if len(cleaned) > 15 and re.search('[a-zA-Z]{5,}', cleaned):
                    # Filter out header/footer lines (like 'GANPAT UNIVERSITY', 'Enrollment No', etc.)
                    lower_clean = cleaned.lower()
                    if "ganpat university" in lower_clean or "enrollment no" in lower_clean or "b.sc" in lower_clean:
                        continue
                    if "end of paper" in lower_clean or "page " in lower_clean:
                        continue
                        
                    questions.append(cleaned)
                    
    except Exception as e:
        print(f"Failed to read {filepath}: {e}")
        
    return questions

def run():
    base_dir = r"c:\Academic-module\PYQ_ALL_COURSES_DATA\PYQ_ALL_COURSES_Exam_Paper_PDF"
    output_csv = r"c:\Academic-module\PYQ_ALL_COURSES_DATA\Cleaned_Extracted_Questions.csv"
    
    print(f"Scanning directory: {base_dir}")
    
    total_pdfs = 0
    total_questions = 0
    
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["Course", "Semester", "Source_File", "Question_Text"])
        
        for root, dirs, files in os.walk(base_dir):
            for file in files:
                if file.lower().endswith(".pdf"):
                    total_pdfs += 1
                    
                    parts = root.replace(base_dir, "").strip(os.sep).split(os.sep)
                    course = parts[0] if len(parts) > 0 else "Unknown"
                    semester = parts[1] if len(parts) > 1 else "Unknown"
                    
                    filepath = os.path.join(root, file)
                    print(f"[{total_pdfs}] Parsing: {course} | {semester} | {file}")
                    
                    extracted_qs = extract_questions_from_pdf(filepath)
                    for q in extracted_qs:
                        writer.writerow([course, semester, file, q])
                        total_questions += 1
                        
    print(f"\n--- Extraction Complete ---")
    print(f"Processed {total_pdfs} PDF files.")
    print(f"Extracted {total_questions} clean questions.")
    print(f"Saved correctly to: {output_csv}")

if __name__ == "__main__":
    run()
