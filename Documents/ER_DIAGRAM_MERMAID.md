# 📊 Exam Paper Generator - Entity Relationship Diagram (Mermaid)

## ER Diagram - Complete Database Schema

```mermaid
erDiagram
    STUDENT ||--o{ EXAM_RESULT : takes
    STUDENT ||--o{ SEMESTER_RESULT : "achieves"
    
    COURSE ||--o{ SUBJECT : "has"
    COURSE ||--o{ TIMETABLE_SLOT : "scheduled_in"
    COURSE ||--o{ TIMETABLE_TEMPLATE : "has_template"
    
    SUBJECT ||--o{ EXAM : "tested_by"
    SUBJECT ||--o{ TIMETABLE_SLOT : "teaches"
    SUBJECT ||--o{ GENERATED_PAPER : "generates"
    SUBJECT ||--o{ SUBJECT_RESULT : "results_for"
    
    EXAM ||--o{ QUESTION : "contains"
    EXAM ||--o{ EXAM_RESULT : "administered"
    
    FACULTY ||--o{ EXAM : "creates"
    FACULTY ||--o{ TIMETABLE_SLOT : "teaches_in"
    FACULTY ||--o{ FACULTY_AVAILABILITY : "has_availability"
    
    ROOM ||--o{ TIMETABLE_SLOT : "booked_for"
    
    TIMESLOT ||--o{ TIMETABLE_SLOT : "allocated"
    TIMESLOT ||--o{ FACULTY_AVAILABILITY : "preferred"
    
    GENERATED_PAPER ||--o{ QUESTION : "contains_questions"
    
    EXAM_RESULT ||--o{ STUDENT_ANSWER : "has"
    
    TIMETABLE_SLOT ||--o{ TIMETABLE_CONFLICT : "may_have"
    
    SEMESTER_RESULT ||--o{ SUBJECT_RESULT : "has"
    
    ACADEMIC_TERM ||--o{ TIMETABLE_SCHEDULE : "defines"
    TIMETABLE_TEMPLATE ||--o{ TIMETABLE_SCHEDULE : "generates"
    TIMETABLE_SCHEDULE ||--o{ TIMETABLE_SLOT : "contains"

    COURSE : uuid course_id PK
    COURSE : string code UK
    COURSE : string name
    COURSE : int duration
    COURSE : int total_semesters
    COURSE : string shift "MORNING|NOON"
    COURSE : string department
    COURSE : datetime created_at

    SUBJECT : uuid subject_id PK
    SUBJECT : string code UK
    SUBJECT : string name
    SUBJECT : uuid course_id FK
    SUBJECT : int semester
    SUBJECT : int credits
    SUBJECT : string campus_branch

    GENERATED_PAPER : uuid paper_id PK
    GENERATED_PAPER : int semester
    GENERATED_PAPER : string subject_code
    GENERATED_PAPER : string subject_name
    GENERATED_PAPER : string exam_type
    GENERATED_PAPER : int total_marks
    GENERATED_PAPER : json paper_data
    GENERATED_PAPER : datetime created_at

    EXAM : uuid exam_id PK
    EXAM : string title
    EXAM : uuid subject_id FK
    EXAM : string exam_type
    EXAM : date date
    EXAM : time start_time
    EXAM : int duration_minutes
    EXAM : int total_marks

    QUESTION : uuid question_id PK
    QUESTION : uuid exam_id FK
    QUESTION : text question_text
    QUESTION : string question_type "MCQ|Short|Long"
    QUESTION : int marks
    QUESTION : json options
    QUESTION : text correct_answer

    STUDENT : uuid student_id PK
    STUDENT : string enrollment_no UK
    STUDENT : string name
    STUDENT : string email
    STUDENT : uuid course_id FK
    STUDENT : int semester
    STUDENT : decimal cgpa
    STUDENT : string status

    FACULTY : uuid faculty_id PK
    FACULTY : string employee_id UK
    FACULTY : string name
    FACULTY : string department
    FACULTY : string working_shift
    FACULTY : int max_lectures_per_day

    ROOM : uuid room_id PK
    ROOM : string room_number UK
    ROOM : string building
    ROOM : string room_type
    ROOM : int capacity
    ROOM : boolean is_available

    TIMESLOT : uuid slot_id PK
    TIMESLOT : string name
    TIMESLOT : time start_time
    TIMESLOT : time end_time
    TIMESLOT : int duration_minutes
    TIMESLOT : int slot_order

    TIMETABLE_SLOT : uuid slot_id PK
    TIMETABLE_SLOT : uuid course_id FK
    TIMETABLE_SLOT : int semester
    TIMETABLE_SLOT : string day_of_week
    TIMETABLE_SLOT : time start_time
    TIMETABLE_SLOT : time end_time
    TIMETABLE_SLOT : uuid subject_id FK
    TIMETABLE_SLOT : uuid faculty_id FK
    TIMETABLE_SLOT : uuid room_id FK
    TIMETABLE_SLOT : boolean is_locked
    TIMETABLE_SLOT : boolean is_auto_generated

    EXAM_RESULT : uuid result_id PK
    EXAM_RESULT : uuid student_id FK
    EXAM_RESULT : uuid exam_id FK
    EXAM_RESULT : int obtained_marks
    EXAM_RESULT : int total_marks
    EXAM_RESULT : decimal percentage

    SEMESTER_RESULT : uuid result_id PK
    SEMESTER_RESULT : uuid student_id FK
    SEMESTER_RESULT : int semester
    SEMESTER_RESULT : decimal sgpa
    SEMESTER_RESULT : decimal percentage
    SEMESTER_RESULT : string grade

    SUBJECT_RESULT : uuid subject_result_id PK
    SUBJECT_RESULT : uuid semester_result_id FK
    SUBJECT_RESULT : uuid subject_id FK
    SUBJECT_RESULT : int internal_marks
    SUBJECT_RESULT : int external_marks
    SUBJECT_RESULT : int total_marks

    STUDENT_ANSWER : uuid answer_id PK
    STUDENT_ANSWER : uuid exam_result_id FK
    STUDENT_ANSWER : uuid question_id FK
    STUDENT_ANSWER : text student_answer
    STUDENT_ANSWER : int marks_obtained

    TIMETABLE_CONFLICT : uuid conflict_id PK
    TIMETABLE_CONFLICT : string conflict_type
    TIMETABLE_CONFLICT : text description
    TIMETABLE_CONFLICT : boolean is_resolved

    FACULTY_AVAILABILITY : uuid availability_id PK
    FACULTY_AVAILABILITY : uuid faculty_id FK
    FACULTY_AVAILABILITY : string day_of_week
    FACULTY_AVAILABILITY : boolean is_available

    TIMETABLE_TEMPLATE : uuid template_id PK
    TIMETABLE_TEMPLATE : string name
    TIMETABLE_TEMPLATE : uuid course_id FK
    TIMETABLE_TEMPLATE : int semester

    TIMETABLE_SCHEDULE : uuid schedule_id PK
    TIMETABLE_SCHEDULE : string name
    TIMETABLE_SCHEDULE : uuid template_id FK
    TIMETABLE_SCHEDULE : date start_date
    TIMETABLE_SCHEDULE : date end_date

    ACADEMIC_TERM : uuid term_id PK
    ACADEMIC_TERM : string name
    ACADEMIC_TERM : date start_date
    ACADEMIC_TERM : date end_date
```

## Key Relationships

### Core Paper Generation Path
```
FACULTY → Creates → EXAM
EXAM → Contains → QUESTION
EXAM → Belongs to → SUBJECT (via foreign key)
SUBJECT → Part of → COURSE
Generated Paper stores QUESTION selection in JSON for specific SUBJECT + Semester
```

### Student Assessment Path
```
STUDENT → Takes → EXAM
EXAM → Administered to → EXAM_RESULT
EXAM_RESULT → Contains → STUDENT_ANSWER
STUDENT → Achieves → SEMESTER_RESULT
SEMESTER_RESULT → Contains → SUBJECT_RESULT
```

### Timetable Coordination
```
COURSE → Scheduled in → TIMETABLE_SLOT
SUBJECT → Teaches → TIMETABLE_SLOT  
FACULTY → Teaches in → TIMETABLE_SLOT
ROOM → Booked for → TIMETABLE_SLOT
TIMESLOT → Allocated to → TIMETABLE_SLOT
```

## Table Count & Distribution

| Category | Tables | Purpose |
|----------|--------|---------|
| **Exam Generation** | 2 | GeneratedPaper, Exam, Question |
| **Course/Subject** | 3 | Course, Subject, AcademicTerm |
| **Student/Faculty** | 2 | Student, Faculty |
| **Timetable** | 8 | TimetableSlot, TimeSlot, Room, Shift, BreakSlot, DayType, TimetableTemplate, TimetableSchedule, etc. |
| **Results** | 4 | ExamResult, SemesterResult, SubjectResult, StudentAnswer |
| **Conflict Management** | 2 | TimetableConflict, FacultyAvailability |
| **Total** | **24** | Complete ecosystem |

---

## 📌 Critical Fields for Paper Generation

### GeneratedPaper (Main Storage)
- `paper_data`: **JSON field** containing the complete paper structure
- `subject_code`, `subject_name`: Identifies the subject
- `exam_type`: "Internal" or "External" determines structure
- `total_marks`: 30 (internal) or 60 (external)
- `created_at`: Timestamp for archival

### Question Selection Process
Papers are generated by selecting from QUESTION table (or variations) based on:
1. Subject code filtering
2. Frequency ranking algorithm
3. Question type distribution (MCQ, Short, Long)
4. Marks allocation matching exam type
