# 🎨 Claude AI Prompts — DFD & ER Diagram PPT

## How to Use
Copy each prompt below and paste it into Claude.ai (claude.ai). Claude will generate the slide content or diagram description. Use these in PowerPoint / Google Slides / Canva.

---

## PROMPT 1 — ER Diagram Slide (Like the Image)

```
Create a detailed Entity-Relationship (ER) Diagram description for a university Academic Section Portal system.
The system has the following entities and relationships:

ENTITIES AND THEIR KEY ATTRIBUTES:

1. USER (users table)
   - user_id (PK), email, password, role (student/faculty/admin), is_active, created_at

2. STUDENT (students table)
   - student_id (PK), enrollment_no, name, email, phone, semester, cgpa, status, batch, admission_year, branch
   - FK: user_id → USER, course_id → COURSE

3. FACULTY (faculty table)
   - faculty_id (PK), employee_id, name, email, department, designation, working_shift, experience_years, branch
   - FK: user_id → USER

4. ADMIN (admins table)
   - admin_id_pk (PK), admin_id, name, email, phone
   - FK: user_id → USER

5. COURSE (courses table)
   - course_id (PK), code, name, duration, total_semesters, department, level, shift, status

6. SUBJECT (subjects table)
   - subject_id (PK), code, name, semester, credits, campus_branch
   - FK: course_id → COURSE

7. TIMETABLE_SLOT (timetable_slots table)
   - slot_id (PK), day_of_week, start_time, end_time, section, slot_type
   - FK: course_id → COURSE, subject_id → SUBJECT, faculty_id → FACULTY, room_id → ROOM

8. ROOM (rooms table)
   - room_id (PK), room_number, building, room_type, capacity, floor, campus_branch

9. EXAM (exams table)
   - exam_id (PK), title, exam_type, date, start_time, total_marks, passing_marks, is_published
   - FK: subject_id → SUBJECT, created_by → FACULTY

10. EXAM_RESULT (exam_results table)
    - result_id (PK), marks_obtained, is_absent, recheck_status
    - FK: student_id → STUDENT, exam_id → EXAM

11. SEMESTER_RESULT (semester_results table)
    - result_id (PK), semester, sgpa, percentage, grade, status
    - FK: student_id → STUDENT

12. LECTURE_SESSION (ai_lecture_sessions table)
    - id (PK), date, start_time, end_time, session_type, qr_token, geofence_radius
    - FK: subject_id → SUBJECT, faculty_id → USER

13. ATTENDANCE_RECORD (ai_attendance_records table)
    - id (PK), status, marked_via, confidence_score, gps_verified, liveness_passed, security_score
    - FK: session_id → LECTURE_SESSION, student_id → USER

14. NOTIFICATION (notifications table)
    - notification_id (PK), target, type, priority, title, message, status

RELATIONSHIPS:
- USER has one STUDENT (1:1)
- USER has one FACULTY (1:1)
- USER has one ADMIN (1:1)
- STUDENT enrolled in one COURSE (Many:1)
- COURSE has many SUBJECTS (1:Many)
- FACULTY teaches many SUBJECTS (Many:Many)
- TIMETABLE_SLOT belongs to COURSE, SUBJECT, FACULTY, ROOM
- EXAM is for one SUBJECT (Many:1)
- STUDENT has many EXAM_RESULTS (1:Many)
- STUDENT has many SEMESTER_RESULTS (1:Many)
- FACULTY creates LECTURE_SESSION (1:Many)
- LECTURE_SESSION has many ATTENDANCE_RECORDS (1:Many)
- STUDENT has many ATTENDANCE_RECORDS (1:Many)

Draw this as a clean ER diagram with entities as rectangles, attributes as ovals, and relationships as diamonds. Use crow's foot notation for cardinality. Group related entities together.
```

---

## PROMPT 2 — Level 0 DFD (Context Diagram) Slide

```
Create a Level 0 (Context Diagram) Data Flow Diagram for a University Academic Section Portal.

The system is called: "Academic Section Portal"

External Entities (Actors):
1. Student
2. Faculty
3. Admin

Data Flows:
- Student → System: Login credentials, QR attendance scan, face scan, exam answers
- System → Student: Dashboard data, timetable, attendance records, results, PYQ papers, notifications
- Faculty → System: Login credentials, lecture session creation, attendance marking, exam creation
- System → Faculty: Attendance reports, timetable, student attendance summary
- Admin → System: Login credentials, student/faculty data management, semester configuration, timetable generation trigger
- System → Admin: System reports, face registration status, analytics, notifications

Describe this as a DFD Level 0 (Context Diagram) with one central process bubble "Academic Section Portal" surrounded by three external entity boxes and arrows showing data flows with labels.
```

---

## PROMPT 3 — Level 1 DFD Slide

```
Create a Level 1 Data Flow Diagram for a University Academic Section Portal.

Break the system into the following major processes:

PROCESS 1: User Authentication (1.0)
- Inputs from: Student, Faculty, Admin (credentials)
- Outputs to: User Dashboard
- Data Stores: D1 - Users Table, D2 - Password Reset OTPs

PROCESS 2: Academic Management (2.0)
- Inputs from: Admin (course/subject data)
- Outputs to: Student (timetable/results), Faculty (timetable)
- Data Stores: D3 - Courses, D4 - Subjects, D5 - Semester Results, D6 - Timetable Slots

PROCESS 3: AI Attendance System (3.0)
- Inputs from: Faculty (session creation), Student (QR scan / face scan)
- Outputs to: Faculty (attendance report), Admin (anomaly alerts)
- Data Stores: D7 - Lecture Sessions, D8 - Attendance Records, D9 - Face Encodings, D10 - Anomalies

PROCESS 4: Exam Management (4.0)
- Inputs from: Faculty (exam creation), Student (answers)
- Outputs to: Student (results), Admin (reports)
- Data Stores: D11 - Exams, D12 - Questions, D13 - Exam Results

PROCESS 5: PYQ Generator (5.0)
- Inputs from: Student (subject selection, exam type)
- Outputs to: Student (generated paper PDF)
- Data Stores: D14 - Generated Papers, D15 - ML Question Bank

PROCESS 6: Notification System (6.0)
- Inputs from: System events (anomalies, results)
- Outputs to: Student, Faculty, Admin
- Data Stores: D16 - Notifications

External Entities: Student, Faculty, Admin

Draw this as a proper Level 1 DFD with numbered process bubbles, rectangular data stores (D1-D16), external entity boxes, and labeled data flow arrows.
```

---

## PROMPT 4 — PPT Slide Design Instructions

```
Create a PowerPoint presentation outline for a University Academic Section Portal project with the following slides:

Slide 1: Title Slide
- Title: "Academic Section Portal"
- Subtitle: "Database Design Documentation"
- Include: DFD, ER Diagram, Data Dictionary
- University: Ganpat University

Slide 2: System Overview
- Brief description of the portal modules:
  1. User Authentication (Student/Faculty/Admin)
  2. AI-Powered Attendance (QR + Face Recognition)
  3. Academic Management (Courses, Subjects, Timetable)
  4. Exam Management & Results
  5. PYQ AI Paper Generator
  6. Notification System

Slide 3: DFD Level 0 — Context Diagram
[Insert Context DFD diagram]

Slide 4: DFD Level 1 — System Processes
[Insert Level 1 DFD diagram]

Slide 5: ER Diagram — User & Profile Tables
Show: USER → STUDENT, FACULTY, ADMIN (with attributes)

Slide 6: ER Diagram — Academic Tables
Show: COURSE → SUBJECT → TIMETABLE_SLOT → ROOM

Slide 7: ER Diagram — Attendance AI Tables
Show: LECTURE_SESSION → ATTENDANCE_RECORD → FACE_ENCODING

Slide 8: ER Diagram — Exam Tables
Show: EXAM → QUESTION, EXAM_RESULT → STUDENT_ANSWER

Slide 9: Data Dictionary Summary
- Table showing all 35 tables with: Table Name, App Module, Primary Key, # of Fields

Slide 10: Key Relationships Summary
- List all major FK relationships in a clean table

Use a professional dark blue and white color scheme. Each slide should have consistent header styling.
```

---

## PROMPT 5 — Canva/Miro ER Diagram Prompt

```
I need to create an ER Diagram for my university project database. Here are the main entities:

Core entities (draw as rectangles):
USER, STUDENT, FACULTY, ADMIN, COURSE, SUBJECT, TIMETABLE_SLOT, ROOM, EXAM, EXAM_RESULT, SEMESTER_RESULT, LECTURE_SESSION, ATTENDANCE_RECORD, NOTIFICATION

Relationships (draw as diamonds between entities):
- USER "has" STUDENT (1 to 1)
- USER "has" FACULTY (1 to 1)
- USER "has" ADMIN (1 to 1)
- STUDENT "enrolled in" COURSE (Many to 1)
- COURSE "has" SUBJECT (1 to Many)
- FACULTY "teaches" SUBJECT (Many to Many)
- TIMETABLE_SLOT "scheduled for" COURSE (Many to 1)
- TIMETABLE_SLOT "uses" ROOM (Many to 1)
- EXAM "tests" SUBJECT (Many to 1)
- STUDENT "appears in" EXAM (via EXAM_RESULT, Many to Many)
- FACULTY "creates" LECTURE_SESSION (1 to Many)
- STUDENT "marks" ATTENDANCE_RECORD (1 to Many)
- LECTURE_SESSION "contains" ATTENDANCE_RECORD (1 to Many)

Show primary key attributes underlined. Show foreign key attributes with dashed underline. Group entities by module using colored backgrounds:
- Blue: USER, STUDENT, FACULTY, ADMIN
- Green: COURSE, SUBJECT, TIMETABLE_SLOT, ROOM
- Orange: EXAM, EXAM_RESULT, SEMESTER_RESULT
- Purple: LECTURE_SESSION, ATTENDANCE_RECORD, NOTIFICATION
```
