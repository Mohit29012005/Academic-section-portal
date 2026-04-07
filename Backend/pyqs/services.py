import os
import random
from django.conf import settings
from django.utils import timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

from .models import PYQGenerationRequest


class PYQGenerationService:
    def generate_pyq(self, subject, course, semester, num_questions, difficulty, exam_type, student):
        """Generate PYQ PDF and save request record."""
        # 1. Fetch sample questions from database
        base_questions = []

        # 2. Generate questions (template-based for now)
        generated_questions = self.generate_similar_questions(
            base_questions, num_questions, difficulty, subject.name
        )

        # 3. Create PDF
        pdf_filename = self.create_pdf(generated_questions, subject, course, exam_type, difficulty)

        # 4. Save request
        pyq_request = PYQGenerationRequest.objects.create(
            student=student,
            subject=subject,
            course=course,
            semester=semester,
            exam_type=exam_type,
            num_questions=num_questions,
            difficulty=difficulty,
            generated_pdf=f'pyqs/{pdf_filename}',
        )

        return pyq_request

    def generate_similar_questions(self, base_questions, count, difficulty, subject_name):
        """Generate questions based on existing ones or templates."""
        generated = []
        difficulty_labels = {'easy': 'Basic', 'medium': 'Intermediate', 'hard': 'Advanced'}
        diff_label = difficulty_labels.get(difficulty, 'Standard')

        if base_questions:
            for i in range(count):
                base_q = base_questions[i % len(base_questions)]
                new_q = {
                    'question': f"Q{i+1}. [{diff_label}] {base_q.question_text}",
                    'options': base_q.options if base_q.options else [],
                    'marks': base_q.marks,
                    'type': base_q.question_type,
                }
                generated.append(new_q)
        else:
            # Generate from scratch using templates
            templates = [
                f"Define the core concept of {subject_name} and explain its significance.",
                f"Compare and contrast two major approaches in {subject_name}.",
                f"What are the key advantages of using {subject_name} techniques?",
                f"Explain the algorithm/process for solving problems in {subject_name}.",
                f"Describe the real-world applications of {subject_name}.",
                f"What is the time/space complexity of the standard {subject_name} algorithm?",
                f"List and explain the key properties of {subject_name}.",
                f"How does {subject_name} handle edge cases? Give examples.",
                f"Compare the performance of different {subject_name} methods.",
                f"Explain the theoretical foundation of {subject_name}.",
                f"What are the limitations of current approaches in {subject_name}?",
                f"Describe the step-by-step process for implementing {subject_name}.",
                f"How has {subject_name} evolved over the past decade?",
                f"What are the ethical considerations in {subject_name}?",
                f"Design a solution using {subject_name} for a given real-world problem.",
            ]
            for i in range(count):
                idx = i % len(templates)
                generated.append({
                    'question': f"Q{i+1}. [{diff_label}] {templates[idx]}",
                    'options': [],
                    'marks': 2 if difficulty == 'easy' else (5 if difficulty == 'medium' else 10),
                    'type': 'short_answer' if difficulty == 'easy' else 'long_answer',
                })

        return generated

    def create_pdf(self, questions, subject, course, exam_type, difficulty):
        """Create a PDF document with generated questions."""
        # Ensure directory exists
        pyq_dir = os.path.join(settings.MEDIA_ROOT, 'pyqs')
        os.makedirs(pyq_dir, exist_ok=True)

        timestamp = int(timezone.now().timestamp())
        filename = f"pyq_{subject.code}_{course.code}_{timestamp}.pdf"
        filepath = os.path.join(pyq_dir, filename)

        doc = SimpleDocTemplate(filepath, pagesize=letter,
                                topMargin=0.75 * inch, bottomMargin=0.75 * inch)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        title_style = ParagraphStyle('Title', parent=styles['Title'],
                                     fontSize=18, spaceAfter=6,
                                     textColor=colors.HexColor('#8B0000'))
        elements.append(Paragraph("GU - Previous Year Questions", title_style))
        elements.append(Spacer(1, 6))

        # Subject and course info
        info_style = ParagraphStyle('Info', parent=styles['Normal'],
                                    fontSize=12, spaceAfter=4)
        exam_labels = {'mid_term': 'Mid-Term', 'end_term': 'End-Term', 'practice': 'Practice'}
        elements.append(Paragraph(f"<b>Subject:</b> {subject.name} ({subject.code})", info_style))
        elements.append(Paragraph(f"<b>Course:</b> {course.name} ({course.code})", info_style))
        elements.append(Paragraph(f"<b>Exam Type:</b> {exam_labels.get(exam_type, exam_type)}", info_style))
        elements.append(Paragraph(f"<b>Difficulty:</b> {difficulty.title()}", info_style))
        elements.append(Paragraph(f"<b>Total Questions:</b> {len(questions)}", info_style))
        elements.append(Paragraph(f"<b>Generated:</b> {timezone.now().strftime('%Y-%m-%d %H:%M')}", info_style))
        elements.append(Spacer(1, 20))

        # Horizontal line
        elements.append(Paragraph("<hr/>", styles['Normal']))
        elements.append(Spacer(1, 12))

        # Questions
        q_style = ParagraphStyle('Question', parent=styles['Normal'],
                                 fontSize=11, spaceAfter=6, spaceBefore=8,
                                 textColor=colors.HexColor('#1a1a1a'))
        opt_style = ParagraphStyle('Option', parent=styles['Normal'],
                                   fontSize=10, leftIndent=20, spaceAfter=2,
                                   textColor=colors.HexColor('#333333'))

        total_marks = 0
        for q in questions:
            total_marks += q['marks']
            elements.append(Paragraph(
                f"<b>{q['question']}</b> [{q['marks']} marks]", q_style
            ))
            if q.get('options'):
                for j, opt in enumerate(q['options']):
                    label = chr(65 + j)  # A, B, C, D
                    elements.append(Paragraph(f"({label}) {opt}", opt_style))
            elements.append(Spacer(1, 8))

        elements.append(Spacer(1, 16))
        elements.append(Paragraph(f"<b>Total Marks: {total_marks}</b>", info_style))
        elements.append(Spacer(1, 8))
        elements.append(Paragraph(
            "<i>Note: This paper is auto-generated for practice purposes. "
            "Answers are not provided.</i>",
            ParagraphStyle('Note', parent=styles['Normal'], fontSize=9,
                           textColor=colors.grey)
        ))

        doc.build(elements)
        return filename
