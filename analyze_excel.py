import openpyxl, re, json

wb = openpyxl.load_workbook(r'c:\Academic-module\PYQ_ALL_COURSES_DATA\Ganpat_University_Questions.xlsx', read_only=True)
ws = wb.active
rows = list(ws.iter_rows(min_row=1, max_row=99999, values_only=True))

print(f"Total rows: {len(rows)}")

# Columns: Course, Semester, Source File (PDF name = subject), Question Text
# Structure: header rows have only Course or Semester; data rows have Source File + Question Text

SKIP_PATTERNS = re.compile(
    r'(section[-\s]*[I]+|answer the following|any \d+|marks\s*(co|bloom)|bloom.s taxonomy|'
    r'figure.* indicate|CO is Course|this question paper|Be precise|written in a separate|'
    r'consist of \d+|pattern|BTL\d|^\s*\d+\s*$|^none$|CO\d|enrollment no)',
    re.IGNORECASE
)

QUESTION_PATTERNS = re.compile(
    r'(explain|define|what|write|describe|discuss|compare|differentiate|state|list|prove|'
    r'find|solve|draw|construct|calculate|show|evaluate|analyze|illustrate|derive|implement)',
    re.IGNORECASE
)

subject_questions = {}  # { "subject_code_or_name": [questions] }

cur_course = ''
cur_sem = ''
cur_subject = ''  # derived from Source File column (PDF name)

for r in rows:
    col0 = str(r[0]).strip() if r[0] else ''
    col1 = str(r[1]).strip() if r[1] else ''
    col2 = str(r[2]).strip() if r[2] else ''
    col3 = str(r[3]).strip() if r[3] else ''

    # Skip pure header metadata
    if col0 and col0 not in ('Course', 'None') and not col1 and not col2 and not col3:
        cur_course = col0.strip().lstrip()
        continue
    if col1 and col1 not in ('Semester', 'None') and not col2 and not col3:
        cur_sem = col1.strip().lstrip()
        continue
    # Source file row (identifies the subject paper)
    if col2 and col2 not in ('Source File', 'None') and not col3:
        cur_subject = col2.strip()
        continue

    # Data row: has question text
    qtext = col3.strip()
    if not qtext or qtext in ('Question Text', 'None'):
        continue
    if len(qtext) < 20:
        continue
    if SKIP_PATTERNS.search(qtext):
        continue
    if not QUESTION_PATTERNS.search(qtext):
        continue

    if cur_subject:
        key = cur_subject
        if key not in subject_questions:
            subject_questions[key] = []
        if qtext not in subject_questions[key] and len(subject_questions[key]) < 50:
            subject_questions[key].append(qtext)

print(f"\nFound {len(subject_questions)} subjects/papers\n")
for subj, qs in list(subject_questions.items())[:5]:
    print(f"  Subject: {subj}")
    for q in qs[:3]:
        print(f"    - {q[:100]}")
    print()

# Save full mapping
with open(r'c:\Academic-module\PYQ_ALL_COURSES_DATA\subject_questions.json', 'w', encoding='utf-8') as f:
    json.dump(subject_questions, f, ensure_ascii=False, indent=2)

print(f"Saved to subject_questions.json")
