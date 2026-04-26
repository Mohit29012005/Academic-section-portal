# Data Dictionary — Academic Section Portal (Part 3)

---

## 19. Table: `academic_terms`
**Description:** Academic semester terms with start and end dates.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | term_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for each term |
| 2 | name | VARCHAR | 100 chars | NOT NULL | Term name (e.g. Odd Sem 2025-26) |
| 3 | start_date | DATE | 3 bytes | NOT NULL | Term start date |
| 4 | end_date | DATE | 3 bytes | NOT NULL | Term end date |
| 5 | status | VARCHAR | 20 chars | Default: 'Upcoming' | Upcoming / Active / Completed |
| 6 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |

---

## 20. Table: `holidays`
**Description:** Institutional and national holidays calendar.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | holiday_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for each holiday |
| 2 | date | DATE | 3 bytes | NOT NULL | Holiday date |
| 3 | name | VARCHAR | 100 chars | NOT NULL | Holiday name |
| 4 | type | VARCHAR | 50 chars | NOT NULL | National / Festival / Institutional |
| 5 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |

---

## 21. Table: `exams`
**Description:** Exam definitions for mid-term, end-term, quizzes and practicals.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | exam_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for each exam |
| 2 | title | VARCHAR | 200 chars | NOT NULL | Exam title |
| 3 | subject_id | UUID | 36 chars | FK → subjects, CASCADE | Subject for the exam |
| 4 | exam_type | VARCHAR | 20 chars | Default: 'End Term' | Mid Term/End Term/Quiz/Assignment/Practical |
| 5 | campus_branch | VARCHAR | 20 chars | Default: 'Kherva' | Kherva / Ahmedabad / Both |
| 6 | date | DATE | 3 bytes | NOT NULL | Exam date |
| 7 | start_time | TIME | 3 bytes | NOT NULL | Exam start time |
| 8 | duration_minutes | INTEGER | 4 bytes | Default: 60 | Exam duration in minutes |
| 9 | total_marks | INTEGER | 4 bytes | Default: 100 | Maximum marks |
| 10 | passing_marks | INTEGER | 4 bytes | Default: 35 | Minimum marks to pass |
| 11 | instructions | TEXT | Variable | NULL | Exam instructions for students |
| 12 | is_published | BOOLEAN | 1 bit | Default: FALSE | Whether exam is visible to students |
| 13 | created_by_id | UUID | 36 chars | FK → faculty, SET NULL, NULL | Faculty who created the exam |
| 14 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |
| 15 | updated_at | DATETIME | 8 bytes | NOT NULL, Auto | Last update timestamp |

---

## 22. Table: `questions`
**Description:** Questions associated with an exam (MCQ, Short, Long Answer).

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | question_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for each question |
| 2 | exam_id | UUID | 36 chars | FK → exams, CASCADE | Exam this question belongs to |
| 3 | question_text | TEXT | Variable | NOT NULL | Question content |
| 4 | question_type | VARCHAR | 10 chars | Default: 'MCQ' | MCQ / Short / Long |
| 5 | marks | INTEGER | 4 bytes | Default: 5 | Marks allocated to this question |
| 6 | options | JSON | Variable | NULL | MCQ options as JSON array |
| 7 | correct_answer | TEXT | Variable | NULL | Correct answer text |
| 8 | order | INTEGER | 4 bytes | Default: 0 | Display order of question |
| 9 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |

---

## 23. Table: `exam_results`
**Description:** Student exam performance records.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | result_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for result record |
| 2 | student_id | UUID | 36 chars | FK → students, CASCADE | Student who took the exam |
| 3 | exam_id | UUID | 36 chars | FK → exams, CASCADE | Exam taken |
| 4 | marks_obtained | DECIMAL | (6,2) | Default: 0 | Marks scored by student |
| 5 | is_absent | BOOLEAN | 1 bit | Default: FALSE | Whether student was absent |
| 6 | is_rechecked | BOOLEAN | 1 bit | Default: FALSE | Whether result was sent for recheck |
| 7 | recheck_status | VARCHAR | 20 chars | NULL | Pending/Approved/Rejected |
| 8 | feedback | TEXT | Variable | NULL | Examiner feedback |
| 9 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |
| 10 | updated_at | DATETIME | 8 bytes | NOT NULL, Auto | Last update timestamp |

*Unique constraint on (student_id, exam_id)*

---

## 24. Table: `student_answers`
**Description:** Individual answers submitted by student for each exam question.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | answer_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for each answer |
| 2 | exam_result_id | UUID | 36 chars | FK → exam_results, CASCADE | Associated exam result |
| 3 | question_id | UUID | 36 chars | FK → questions, CASCADE | Question being answered |
| 4 | answer_text | TEXT | Variable | NULL | Written answer text |
| 5 | selected_option | VARCHAR | 500 chars | NULL | MCQ selected option |
| 6 | is_correct | BOOLEAN | 1 bit | Default: FALSE | Whether the answer is correct |
| 7 | marks_obtained | DECIMAL | (5,2) | Default: 0 | Marks given for this answer |
| 8 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |

---

## 25. Table: `semester_results`
**Description:** Overall semester-level academic performance per student.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | result_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for result |
| 2 | student_id | UUID | 36 chars | FK → students, CASCADE | Student whose result this is |
| 3 | semester | INTEGER | 4 bytes | NOT NULL | Semester number |
| 4 | sgpa | DECIMAL | (4,2) | NULL | Semester Grade Point Average |
| 5 | total_marks | INTEGER | 4 bytes | Default: 0 | Total marks available |
| 6 | obtained_marks | INTEGER | 4 bytes | Default: 0 | Marks obtained by student |
| 7 | percentage | DECIMAL | (5,2) | Default: 0 | Percentage score |
| 8 | grade | VARCHAR | 5 chars | NULL | Letter grade (O/A+/A/B+/B/C/P/F) |
| 9 | status | VARCHAR | 20 chars | Default: 'remaining' | completed / remaining |
| 10 | year | INTEGER | 4 bytes | NULL | Academic year |
| 11 | exam_type | VARCHAR | 20 chars | NULL | Regular / Backlog |
| 12 | remarks | TEXT | Variable | NULL | Additional remarks |
| 13 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |
| 14 | updated_at | DATETIME | 8 bytes | NOT NULL, Auto | Last update timestamp |

*Unique constraint on (student_id, semester)*

---

## 26. Table: `subject_results`
**Description:** Subject-wise marks within a semester result.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | subject_result_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier |
| 2 | semester_result_id | UUID | 36 chars | FK → semester_results, CASCADE | Parent semester result |
| 3 | subject_id | UUID | 36 chars | FK → subjects, CASCADE | Subject this result is for |
| 4 | internal_marks | INTEGER | 4 bytes | Default: 0 | Internal/sessional marks |
| 5 | external_marks | INTEGER | 4 bytes | Default: 0 | External/university exam marks |
| 6 | practical_marks | INTEGER | 4 bytes | Default: 0 | Practical marks |
| 7 | total_marks | INTEGER | 4 bytes | Default: 0 | Sum of all marks |
| 8 | passing_marks | INTEGER | 4 bytes | Default: 35 | Minimum marks to pass |
| 9 | is_passed | BOOLEAN | 1 bit | Default: FALSE | Whether student passed the subject |
| 10 | grade | VARCHAR | 5 chars | NULL | Subject grade |

---

## 27. Table: `semester_config`
**Description:** Singleton table tracking current active semester parity (Odd/Even).

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | config_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for config |
| 2 | current_parity | VARCHAR | 4 chars | Default: 'ODD' | ODD or EVEN semester |
| 3 | is_odd_enabled | BOOLEAN | 1 bit | Default: TRUE | Whether odd semesters are active |
| 4 | is_even_enabled | BOOLEAN | 1 bit | Default: FALSE | Whether even semesters are active |
| 5 | last_toggled_at | DATETIME | 8 bytes | NULL | When parity was last changed |
| 6 | toggled_by_id | UUID | 36 chars | FK → users, SET NULL, NULL | Admin who toggled the semester |
| 7 | timetable_generated | BOOLEAN | 1 bit | Default: FALSE | Whether timetable has been generated |
| 8 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |
| 9 | updated_at | DATETIME | 8 bytes | NOT NULL, Auto | Last update timestamp |
