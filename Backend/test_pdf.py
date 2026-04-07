try:
    from fpdf import FPDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt="Test PDF", ln=1, align="C")
    output = pdf.output()
    print("PDF generated successfully (length: {})".format(len(output)))
except Exception as e:
    print("PDF generation FAILED: {}".format(e))
