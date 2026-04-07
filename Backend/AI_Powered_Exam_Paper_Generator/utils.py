import io
from datetime import datetime
from fpdf import FPDF
from .apps import ExamPaperConfig


def get_ranked_questions(semester, subject_code):
    """Get questions ranked by repetition frequency."""
    clusters = ExamPaperConfig.clusters
    subject_data = ExamPaperConfig.subject_data
    
    keys = [k for k in clusters if k.startswith(f"{semester}_") and subject_code.upper() in k.upper()]
    if not keys:
        for k in clusters:
            if k.startswith(f"{semester}_"):
                code_part = k.split('_', 1)[1]
                if subject_code.upper() in code_part or code_part in subject_code.upper():
                    keys.append(k)
                    
    all_info, subj_name = [], ''
    for k in keys:
        if k in clusters:
            if k in subject_data:
                subj_name = subject_data[k]['Subject_Name'].iloc[0]
            for info in clusters[k].values():
                all_info.append(info)
                
    all_info.sort(key=lambda x: (x.get('year_count', 1), x['count'], x.get('freq_score', 0)), reverse=True)
    return all_info, subj_name


QUESTION_VARIATIONS = [
    "Explain in detail: ",
    "With a suitable example, describe: ",
    "Write a short note on: ",
    "Critically analyze: ",
    "Compare and contrast with examples: ",
    "Define and explain the importance of: ",
    "Illustrate with a diagram: ",
    "Discuss the advantages and disadvantages of: ",
    "Give examples and explain: ",
]


def generate_variations(base_questions, needed, used):
    """Generate question variations to fill required count."""
    extra = []
    var_idx = 0
    q_idx = 0
    base = [q for q in base_questions if q['question']]
    if not base:
        return extra
    while len(extra) < needed and var_idx < len(QUESTION_VARIATIONS):
        src = base[q_idx % len(base)]
        prefix = QUESTION_VARIATIONS[var_idx]
        raw_q = src['question']
        for p in QUESTION_VARIATIONS:
            if raw_q.startswith(p):
                raw_q = raw_q[len(p):].strip()
                break
        new_q = prefix + raw_q
        key = new_q.lower().strip()
        if key not in used:
            extra.append({
                'question': new_q,
                'repeat': 1,
                'years': [],
                'importance': 'NORMAL'
            })
            used.add(key)
        var_idx += 1
        q_idx += 1
    return extra


def pick_questions(ranked, n, used):
    """Pick n unique questions from ranked list. Pad with variations if needed."""
    picked = []
    for info in ranked:
        if len(picked) >= n:
            break
        q = info['representative']
        key = q.lower().strip()
        if key not in used:
            picked.append({
                'question': q,
                'repeat': info['count'],
                'years': info.get('years', []),
                'importance': 'HIGH' if info['count'] >= 3 else ('MEDIUM' if info['count'] >= 2 else 'NORMAL')
            })
            used.add(key)
            
    if len(picked) < n:
        needed = n - len(picked)
        extras = generate_variations(picked if picked else
                                     [{'question': info['representative']} for info in ranked[:3]],
                                     needed, used)
        picked.extend(extras)
    return picked


def create_pdf(paper):
    """Create PDF in exact Ganpat University format."""
    pdf = FPDF('P', 'mm', 'A4')
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pw = pdf.w - 20
    
    pdf.set_font('Times', '', 12)
    pdf.cell(pw, 6, 'Enrollment No._______________', ln=True, align='R')
    pdf.ln(5)
    
    pdf.set_font('Times', 'B', 16)
    pdf.cell(pw, 8, 'GANPAT UNIVERSITY', ln=True, align='C')
    
    pdf.set_font('Times', 'B', 14)
    course_label = paper.get("course", "B.C.A.").upper()
    pdf.cell(pw, 7, f'{course_label} SEM-{paper.get("semester", "")} EXAMINATION (CBCS)', ln=True, align='C')
    pdf.ln(4)
    
    pdf.set_font('Times', 'B', 13)
    subj_text = f'{paper.get("subject_code", "")}: {paper.get("subject_name", "")}'
    pdf.cell(pw, 7, subj_text, ln=True, align='C')
    
    pdf.set_font('Times', '', 12)
    session = f'{paper.get("exam_type", "")} Examination - {datetime.now().strftime("%B %Y")}'
    pdf.cell(pw, 6, session, ln=True, align='C')
    pdf.ln(3)
    
    pdf.set_font('Times', 'B', 12)
    pdf.cell(pw / 2, 7, f'Time: {paper.get("time", "")}', align='L')
    pdf.cell(pw / 2, 7, f'[Total Marks: {paper.get("total_marks", 60)}]', align='R', ln=True)
    pdf.ln(3)
    
    pdf.set_font('Times', 'B', 11)
    pdf.cell(pw, 6, 'Instructions:', ln=True)
    pdf.set_font('Times', '', 11)
    for inst in [
        '1.  Figures to the right indicate full marks.',
        '2.  Each section should be written in a separate answer book.',
        '3.  Be precise and to the point in your answer.'
    ]:
        pdf.cell(pw, 5, f'        {inst}', ln=True)
    pdf.ln(4)
    
    pdf.line(10, pdf.get_y(), pdf.w - 10, pdf.get_y())
    pdf.ln(5)
    
    letters = 'ABCDEFGHI'
    roman = ['I', 'II', 'III', 'IV', 'V']
    
    def write_question(label, text, marks_text=''):
        pdf.set_font('Times', 'B', 11)
        label_w = max(pdf.get_string_width(label) + 3, 15)
        pdf.set_font('Times', '', 11)
        marks_w = 0
        if marks_text:
            marks_w = pdf.get_string_width(marks_text) + 6
        text_w = pw - label_w - marks_w - 2
        if text_w < 60:
            text_w = pw - label_w - 2
        y_start = pdf.get_y()
        pdf.set_font('Times', 'B', 11)
        pdf.cell(label_w, 6, label)
        pdf.set_font('Times', '', 11)
        pdf.multi_cell(text_w, 6, text)
        y_end = pdf.get_y()
        if marks_text:
            pdf.set_font('Times', 'B', 11)
            pdf.set_xy(pdf.w - 10 - marks_w, y_start)
            pdf.cell(marks_w, 6, marks_text, align='R')
        pdf.set_y(max(y_start + 6, y_end))

    section1 = paper.get('section1', [])
    
    if paper.get('exam_type') == 'External':
        pdf.set_font('Times', 'B', 13)
        pdf.cell(pw, 7, 'SECTION-I', ln=True, align='C')
        pdf.ln(3)
        pdf.set_font('Times', 'B', 11)
        pdf.cell(10, 6, '1')
        pdf.cell(pw - 50, 6, 'Answer the following: (Any six out of Nine)')
        pdf.cell(40, 6, '(30)', align='R', ln=True)
        pdf.ln(2)
        
        for i, q in enumerate(section1[:9]):
            write_question(f'     {letters[i]})', q.get('question',''), '(05)')
            pdf.ln(1.5)
            
        pdf.ln(4)
        pdf.line(10, pdf.get_y(), pdf.w - 10, pdf.get_y())
        pdf.ln(5)
        
        pdf.set_font('Times', 'B', 13)
        pdf.cell(pw, 7, 'SECTION-II', ln=True, align='C')
        pdf.ln(3)
        pdf.set_font('Times', 'B', 11)
        pdf.cell(10, 6, '2', ln=True)
        pdf.ln(1)
        
        q2a = paper.get('q2a', [])
        pdf.set_font('Times', 'B', 11)
        pdf.cell(pw - 40, 6, '     (A)  Answer the following: (Any One)')
        pdf.cell(40, 6, '(06)', align='R', ln=True)
        pdf.ln(1)
        for i, q in enumerate(q2a[:2]):
            write_question(f'           {roman[i]})', q.get('question',''))
            pdf.ln(1.5)
            
        pdf.ln(2)
        q2b = paper.get('q2b', [])
        pdf.set_font('Times', 'B', 11)
        pdf.cell(pw - 40, 6, '     (B)  Answer the following:')
        pdf.cell(40, 6, '(02)', align='R', ln=True)
        pdf.ln(1)
        for i, q in enumerate(q2b[:2]):
            write_question(f'           {roman[i]})', q.get('question',''), '(01)')
            pdf.ln(1.5)
            
        pdf.ln(3)
        q3 = paper.get('q3', [])
        pdf.set_font('Times', 'B', 11)
        pdf.cell(10, 6, '3')
        pdf.cell(pw - 50, 6, 'Answer the following: (Any One)')
        pdf.cell(40, 6, '(06)', align='R', ln=True)
        pdf.ln(1)
        for i, q in enumerate(q3[:2]):
            write_question(f'     {roman[i]})', q.get('question',''))
            pdf.ln(1.5)
            
        pdf.ln(3)
        q4 = paper.get('q4', [])
        pdf.set_font('Times', 'B', 11)
        pdf.cell(10, 6, '4')
        pdf.cell(pw - 50, 6, 'Answer the following: (Any Two)')
        pdf.cell(40, 6, '(10)', align='R', ln=True)
        pdf.ln(1)
        for i, q in enumerate(q4[:3]):
            write_question(f'     {roman[i]})', q.get('question',''), '(05)')
            pdf.ln(1.5)
            
        pdf.ln(3)
        q5 = paper.get('q5', [])
        pdf.set_font('Times', 'B', 11)
        pdf.cell(10, 6, '5')
        pdf.cell(pw - 50, 6, 'Answer the following: (Any One)')
        pdf.cell(40, 6, '(06)', align='R', ln=True)
        pdf.ln(1)
        for i, q in enumerate(q5[:2]):
            write_question(f'     {roman[i]})', q.get('question',''))
            pdf.ln(1.5)
            
    else:
        pdf.set_font('Times', 'B', 13)
        pdf.cell(pw, 7, 'SECTION-I', ln=True, align='C')
        pdf.ln(3)
        pdf.set_font('Times', 'B', 11)
        pdf.cell(10, 6, '1')
        pdf.cell(pw - 50, 6, 'Answer the following: (Any six out of Nine)')
        pdf.cell(40, 6, '(30)', align='R', ln=True)
        pdf.ln(2)
        for i, q in enumerate(section1[:9]):
            write_question(f'     {letters[i]})', q.get('question',''), '(05)')
            pdf.ln(1.5)
            
    pdf.ln(6)
    pdf.line(10, pdf.get_y(), pdf.w - 10, pdf.get_y())
    pdf.ln(4)
    pdf.set_font('Times', 'B', 12)
    pdf.cell(pw, 6, '--- End of Paper ---', align='C', ln=True)
    
    pdf_output = pdf.output()
    # fpdf2 returns bytes; older fpdf might return a string
    if isinstance(pdf_output, str):
        pdf_bytes = pdf_output.encode('latin-1')
    else:
        pdf_bytes = pdf_output
        
    return io.BytesIO(pdf_bytes)
