import re

def update_tables_md():
    filepath = r"c:\Users\Kalav\Music\Academic-module (2)\Academic-module\Database_Tables_Documentation.md"
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove Table of Contents entries
    content = re.sub(r'4\. \[Exams Module\]\(#4-exams-module\)\n', '', content)
    content = re.sub(r'5\. \[Assignments Module\]\(#5-assignments-module\)\n', '', content)
    
    # Renumber TOC
    content = content.replace('6. [PYQ', '4. [PYQ')
    content = content.replace('7. [AI Exam', '5. [AI Exam')
    content = content.replace('8. [Junction', '6. [Junction')
    content = content.replace('9. [Complete', '7. [Complete')
    content = content.replace('10. [ER Diagram', '8. [ER Diagram')
    content = content.replace('11. [DFD', '9. [DFD')
    content = content.replace('12. [Flowchart', '10. [Flowchart')
    
    # Remove Section 4 Exams
    content = re.sub(r'## 4\. EXAMS MODULE.*?(?=## 5\. ASSIGNMENTS MODULE)', '', content, flags=re.DOTALL)
    
    # Remove Section 5 Assignments
    content = re.sub(r'## 5\. ASSIGNMENTS MODULE.*?(?=## 6\. PYQ)', '', content, flags=re.DOTALL)

    # Renumber sections in text
    content = content.replace('## 6. PYQ', '## 4. PYQ')
    content = content.replace('### Table 6.1', '### Table 4.1')
    
    content = content.replace('## 7. AI EXAM', '## 5. AI EXAM')
    content = content.replace('### Table 7.1', '### Table 5.1')
    
    content = content.replace('## 8. JUNCTION', '## 6. JUNCTION')
    content = content.replace('### Table 8.1', '### Table 6.1')
    
    content = content.replace('## 9. COMPLETE', '## 7. COMPLETE')
    content = content.replace('## 10. ER DIAGRAM GUIDE', '## 8. ER DIAGRAM GUIDE')
    content = content.replace('## 11. DFD', '## 9. DFD')
    content = content.replace('## 12. FLOWCHART', '## 10. FLOWCHART')

    # Remove relationship lines for removed tables
    content = re.sub(r'\| `courses` \| `exams` \| `exams.course_id → courses.course_id` \| One course has many exams \|\n', '', content)
    content = re.sub(r'\| `subjects` \| `exams` \| `exams.subject_id → subjects.subject_id` \| One subject has many exams \|\n', '', content)
    content = re.sub(r'\| `subjects` \| `assignments`.*?\n', '', content)
    content = re.sub(r'\| `students` \| `exam_submissions`.*?\n', '', content)
    content = re.sub(r'\| `students` \| `assignment_submissions`.*?\n', '', content)
    content = re.sub(r'\| `faculty` \| `exams`.*?\n', '', content)
    content = re.sub(r'\| `faculty` \| `assignments`.*?\n', '', content)
    content = re.sub(r'\| `exams` \| `exam_questions`.*?\n', '', content)
    content = re.sub(r'\| `exams` \| `exam_submissions`.*?\n', '', content)
    content = re.sub(r'\| `assignments` \| `assignment_submissions`.*?\n', '', content)

    # ER Guide Tree removing
    content = re.sub(r'courses ────1:N──────── exams\n', '', content)
    content = re.sub(r'subjects ───1:N──────── exams\n', '', content)
    content = re.sub(r'subjects ───1:N──────── assignments\n', '', content)
    content = re.sub(r'students ───1:N──────── exam_submissions\n', '', content)
    content = re.sub(r'students ───1:N──────── assignment_submissions\n', '', content)
    content = re.sub(r'faculty ────1:N──────── exams\n', '', content)
    content = re.sub(r'faculty ────1:N──────── assignments\n', '', content)
    content = re.sub(r'exams ──────1:N──────── exam_questions\n', '', content)
    content = re.sub(r'exams ──────1:N──────── exam_submissions\n', '', content)
    content = re.sub(r'assignments─1:N──────── assignment_submissions\n', '', content)

    # dbdiagram.io code removal
    content = re.sub(r'Table exams \{.*?\}\n\n', '', content, flags=re.DOTALL)
    content = re.sub(r'Table exam_questions \{.*?\}\n\n', '', content, flags=re.DOTALL)
    content = re.sub(r'Table exam_submissions \{.*?\}\n\n', '', content, flags=re.DOTALL)
    content = re.sub(r'Table assignments \{.*?\}\n\n', '', content, flags=re.DOTALL)
    content = re.sub(r'Table assignment_submissions \{.*?\}\n\n', '', content, flags=re.DOTALL)
    
    # Fix references
    content = content.replace('`exam_submissions.student_id`, `assignment_submissions.student_id`, ', '')
    content = content.replace(', `exams.faculty_id`, `assignments.faculty_id`', '')
    content = content.replace(', `exams.course_id`', '')
    content = content.replace(', `exams.subject_id`, `assignments.subject_id`', '')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_tables_md()
