"""
Management command: import_excel_pyqs
Reads Ganpat_University_Questions.xlsx and imports questions into the
academics.Question model, properly linked to Subject records by matching
the subject code extracted from paper-header rows in the data.

Run with: python manage.py import_excel_pyqs
"""
import re
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from academics.models import Subject, Exam, Question, Course


EXCEL_PATH = r"c:\Academic-module\PYQ_ALL_COURSES_DATA\Ganpat_University_Questions.xlsx"

# Lines to discard (boilerplate / instructions)
SKIP_RE = re.compile(
    r"(figures? to the right|answer the following|any \d+|any five|any six|any one|any two|any three"
    r"|section[-\s]*[IVXivx]+|bloom.s tax|BTL\d|CO\d|CO is course|be precise|this question paper"
    r"|written in.* answer book|consist of \d+|total:\s*\d+|time:\s*\d+|enrollment no|ganpat univ"
    r"|regular.*examination|remedial.*examination|marks\s+co\s+bloom|^\s*\d+\s*$|end of the paper"
    r"|pattern level|marks.*taxonomy|section.*q-|q-\d+\s+answer|course outcome|^\d+\s+0\d\s+co)",
    re.IGNORECASE,
)

# A row is a real question if it contains one of these verbs
QUESTION_RE = re.compile(
    r"\b(explain|define|what|write|describe|discuss|compare|differentiate|state|list"
    r"|prove|find|solve|draw|construct|calculate|show|evaluate|analyze|illustrate"
    r"|derive|implement|elaborate|mention|identify|enumerate|outline|summarize"
    r"|demonstrate|justify|examine|apply|compute)\b",
    re.IGNORECASE,
)

# Subject code pattern in exam header rows: e.g. U21A1ADP1, 3B3OOP, UI1A2OAT, etc.
SUBJECT_CODE_RE = re.compile(
    r"\b([A-Z]{1,3}\d{1,2}[A-Z0-9]{2,10})\s*[:–-]\s*(.{5,80}?)(?=\s{2,}|\s+Time|\s+Total|\s*$)",
    re.IGNORECASE,
)

COURSE_MAP = {
    "B.Sc. (CA&IT)": ["B.Sc. (CA&IT)", "BSc CA&IT", "B.Sc.(CA&IT)", "B.Sc. (CA_IT)"],
    "B.Sc. IMS": ["B.Sc. IMS", "BSc IMS", "B.S.(IMS)"],
    "Dual Degree (BCA-MCA)": ["Dual Degree", "BCA-MCA", "BCA MCA"],
    "MCA": ["MCA"],
    "BCA": ["BCA"],
}


def clean_question(text):
    """Strip OCR noise, marks labels and leading numbering from question text."""
    # Remove trailing marks/CO labels like "06 CO1 BTL2"
    text = re.sub(r"\s+0[36]\s+CO\d.*$", "", text)
    text = re.sub(r"\s+BTL\d.*$", "", text)
    # Remove leading number like "1 " or "2. "
    text = re.sub(r"^\s*\d+[\.\)]\s+", "", text)
    # Remove excessive whitespace
    text = re.sub(r"\s{2,}", " ", text).strip()
    return text


class Command(BaseCommand):
    help = "Import PYQ questions from Ganpat_University_Questions.xlsx into the database"

    def handle(self, *args, **options):
        try:
            import openpyxl
        except ImportError:
            self.stdout.write(self.style.ERROR("openpyxl not installed. Run: pip install openpyxl"))
            return

        if not os.path.exists(EXCEL_PATH):
            self.stdout.write(self.style.ERROR(f"Excel file not found: {EXCEL_PATH}"))
            return

        self.stdout.write(f"Loading {EXCEL_PATH}...")
        wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(min_row=2, max_row=99999, values_only=True))
        self.stdout.write(f"  Loaded {len(rows)} data rows")

        # ---------------------------------------------------------------
        # Pass 1: Group rows by (course, semester, pdf_name)
        # ---------------------------------------------------------------
        buckets = {}  # {(course, sem, pdf): [question_text, ...]}
        for r in rows:
            col0 = str(r[0]).strip() if r[0] else ""
            col1 = str(r[1]).strip() if r[1] else ""
            col2 = str(r[2]).strip() if r[2] else ""
            col3 = str(r[3]).strip() if r[3] else ""

            if not col3 or col3 == "None" or col3 == "Question Text":
                continue
            if not col0 or col0 == "None" or not col1 or col1 == "None":
                continue

            key = (col0, col1, col2 if col2 != "None" else "")
            if key not in buckets:
                buckets[key] = []
            buckets[key].append(col3)

        self.stdout.write(f"  Found {len(buckets)} paper buckets")

        # ---------------------------------------------------------------
        # Pass 2: For each bucket, extract subject code from first rows,
        #          then filter real questions
        # ---------------------------------------------------------------
        # subject_code -> [questions]
        code_questions = {}

        for (course_name, sem_raw, pdf), texts in buckets.items():
            sem_match = re.search(r"\d+", sem_raw)
            if not sem_match:
                continue
            semester = int(sem_match.group())

            # Find subject code from first 10 rows (exam header)
            current_code = None
            current_qs = []

            for text in texts:
                # Detect new paper header within the same PDF bucket
                m = SUBJECT_CODE_RE.search(text)
                if m:
                    # Save previous section
                    if current_code and current_qs:
                        code_questions.setdefault(current_code, []).extend(current_qs)
                    current_code = m.group(1).upper()
                    current_qs = []
                    continue

                # Skip boilerplate
                if SKIP_RE.search(text):
                    continue
                if len(text) < 25:
                    continue
                if not QUESTION_RE.search(text):
                    continue

                q = clean_question(text)
                if len(q) > 20 and current_code:
                    current_qs.append(q)

            # Don't forget last block
            if current_code and current_qs:
                code_questions.setdefault(current_code, []).extend(current_qs)

        self.stdout.write(f"  Extracted questions for {len(code_questions)} subject codes")
        for code, qs in list(code_questions.items())[:5]:
            self.stdout.write(f"    {code}: {len(qs)} questions → first: {qs[0][:60]}")

        # ---------------------------------------------------------------
        # Pass 3: Match subject codes to DB Subject records and import
        # ---------------------------------------------------------------
        imported = 0
        skipped_no_match = 0

        with transaction.atomic():
            for code, questions in code_questions.items():
                # Try to find a matching Subject by code
                subjects = Subject.objects.filter(code__iexact=code)
                if not subjects.exists():
                    # Try partial match (some codes have extra chars)
                    subjects = Subject.objects.filter(code__icontains=code[:6])

                if not subjects.exists():
                    skipped_no_match += 1
                    continue

                subject = subjects.first()

                # Get or create a PYQ Exam for this subject
                exam, _ = Exam.objects.get_or_create(
                    subject=subject,
                    title=f"PYQ Bank - {subject.code}",
                    defaults={
                        "total_marks": 60,
                        "duration_minutes": 180,
                        "is_published": True,
                    },
                )

                # Deduplicate against existing questions
                existing = set(
                    Question.objects.filter(exam=exam)
                    .values_list("question_text", flat=True)
                )

                new_qs = []
                seen = set(q.lower().strip() for q in existing)
                for q in questions:
                    key = q.lower().strip()
                    if key not in seen and len(q) > 20:
                        seen.add(key)
                        new_qs.append(Question(
                            exam=exam,
                            question_text=q,
                            marks=6,
                            order=len(existing) + len(new_qs) + 1,
                        ))

                if new_qs:
                    Question.objects.bulk_create(new_qs)
                    imported += len(new_qs)
                    self.stdout.write(
                        f"  ✓ {subject.code} ({subject.name}): imported {len(new_qs)} questions"
                    )

        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Imported {imported} questions. "
            f"Skipped {skipped_no_match} codes with no DB subject match."
        ))
