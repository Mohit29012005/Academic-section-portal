# 📋 Tables for DFD, ER Diagram & Data Dictionary
**Project:** Academic Section Portal — Ganpat University

---

## Tables to Use in ER Diagram & DFD

### Module 1: Authentication & User Management

| Table Name | Primary Key | Foreign Keys | Purpose |
|-----------|------------|-------------|---------|
| `users` | user_id | — | Core login for all roles |
| `students` | student_id | user_id → users, course_id → courses | Student profile |
| `faculty` | faculty_id | user_id → users | Faculty profile |
| `admins` | admin_id_pk | user_id → users | Admin profile |
| `password_reset_otps` | id | user_id → users | Password reset OTP |
| `notifications` | notification_id | — | System notifications |

### Module 2: Academics

| Table Name | Primary Key | Foreign Keys | Purpose |
|-----------|------------|-------------|---------|
| `courses` | course_id | — | Programs (BCA/MCA etc.) |
| `subjects` | subject_id | course_id → courses | Subjects per course/semester |
| `academic_terms` | term_id | — | Semester terms |
| `holidays` | holiday_id | — | Holiday calendar |
| `semester_results` | result_id | student_id → students | Semester SGPA/grade |
| `subject_results` | subject_result_id | semester_result_id, subject_id | Per-subject marks |
| `semester_config` | config_id | toggled_by → users | Odd/Even parity control |

### Module 3: Timetable & Scheduling

| Table Name | Primary Key | Foreign Keys | Purpose |
|-----------|------------|-------------|---------|
| `rooms` | room_id | — | Classrooms and labs |
| `shifts` | shift_id | — | Morning/Noon/Evening shifts |
| `break_slots` | break_id | — | Tea/Lunch breaks |
| `day_types` | day_type_id | — | Weekday/Saturday configs |
| `time_slots` | slot_id | shift_id, day_type_id | Period slots in a day |
| `timetable_slots` | slot_id | course_id, subject_id, faculty_id, room_id | Actual timetable |
| `timetable_templates` | template_id | course_id | Reusable patterns |
| `timetable_schedules` | schedule_id | template_id, academic_term_id | Monthly schedules |
| `faculty_availability` | availability_id | faculty_id | Faculty working days |
| `timetable_conflicts` | conflict_id | slot_1_id, slot_2_id, resolved_by | Scheduling conflicts |

### Module 4: Examinations

| Table Name | Primary Key | Foreign Keys | Purpose |
|-----------|------------|-------------|---------|
| `exams` | exam_id | subject_id, created_by → faculty | Exam definitions |
| `questions` | question_id | exam_id | Exam questions |
| `exam_results` | result_id | student_id, exam_id | Student marks |
| `student_answers` | answer_id | exam_result_id, question_id | Per-question answers |

### Module 5: AI Attendance System

| Table Name | Primary Key | Foreign Keys | Purpose |
|-----------|------------|-------------|---------|
| `ai_student_profiles` | id | user_id → users | Extended AI profile |
| `ai_face_encodings` | id | student_id → users | Face biometric paths |
| `ai_lecture_sessions` | id | subject_id, faculty_id → users | QR/Face sessions |
| `ai_attendance_records` | id | session_id, student_id → users | Attendance log |
| `ai_attendance_anomalies` | id | student_id → users, subject_id | AI anomaly alerts |
| `ai_attendance_notifications` | id | recipient_id → users, triggered_by | Alert notifications |
| `ai_student_devices` | id | student_id → users | Anti-proxy device lock |

### Module 6: PYQ Generator

| Table Name | Primary Key | Foreign Keys | Purpose |
|-----------|------------|-------------|---------|
| `ai_powered_exam_paper_generator_generatedpaper` | id | — | AI generated papers |

### Many-to-Many (Junction Table)

| Table Name | Fields | Purpose |
|-----------|--------|---------|
| `faculty_subjects` (Django auto) | faculty_id, subject_id | Faculty ↔ Subject M2M |

---

## Summary Count

| Module | # Tables |
|--------|---------|
| Authentication & Users | 6 |
| Academics | 7 |
| Timetable & Scheduling | 10 |
| Examinations | 4 |
| AI Attendance | 7 |
| PYQ Generator | 1 |
| **Total** | **35** |

---

## Core Tables for ER Diagram (Minimum Set — Recommended for Report)

Use these **14 core tables** if you need a clean, readable ER diagram:

1. `users`
2. `students`
3. `faculty`
4. `admins`
5. `courses`
6. `subjects`
7. `timetable_slots`
8. `rooms`
9. `exams`
10. `exam_results`
11. `semester_results`
12. `ai_lecture_sessions`
13. `ai_attendance_records`
14. `notifications`
