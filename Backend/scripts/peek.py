import pdfplumber

filepath = r"c:\Academic-module\PYQ_ALL_COURSES_DATA\PYQ_ALL_COURSES_Exam_Paper_PDF\MCA\SEM_4_NEW\MCA IV Sem May-June 2017(Regular).pdf"
try:
    with pdfplumber.open(filepath) as pdf:
        text = pdf.pages[0].extract_text()
        print(text[:1500] if text else "No text extracted")
except Exception as e:
    print("Error:", e)
