# Academic Module - Complete ER Diagram

## 🎯 View Online (Best Quality)
1. Copy code from "## 📋 Mermaid Code" section below
2. Go to: https://mermaid.live
3. Paste & view!

---

## 📊 ASCII ER Diagram (Quick View)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ACADEMIC MODULE - ER DIAGRAM                         │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────┐
                              │   USERS  │
                              │──────────│
                              │ user_id  │
                              │ email    │
                              │ password │
                              │ role     │
                              └────┬─────┘
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │ STUDENTS  │   │  FACULTY  │   │   ADMINS  │
            │───────────│   │───────────│   │───────────│
            │ student_id│   │ faculty_id│   │ admin_id  │
            │ user_id   │   │ user_id   │   │ user_id   │
            │ enroll_no │   │ emp_id    │   │ emp_id    │
            │ name      │   │ name      │   │ name      │
            │ course_id │   │ dept      │   │           │
            │ semester  │   │ subjects  │   │           │
            │ cgpa     │   │           │   │           │
            └─────┬─────┘   └─────┬─────┘   └───────────┘
                  │               │
                  │               │
                  ▼               ▼
┌──────────────────────────────────────────────────────────────┐
│                           COURSES                             │
│──────────────────────────────────────────────────────────────│
│  course_id  │  code  │  name  │  sems  │  dept  │  shift  │
└───────────────────────────┬──────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   SUBJECTS    │   │    ROOMS      │   │    SHIFTS     │
│───────────────│   │───────────────│   │───────────────│
│ subject_id    │   │ room_id       │   │ shift_id      │
│ code          │   │ room_number   │   │ name          │
│ name          │   │ building      │   │ code          │
│ course_id ●───┼──▶│ room_type     │   │ start_time    │
│ semester      │   │ capacity      │   │ end_time      │
│ credits       │   │ campus        │   └───────┬───────┘
└───────┬───────┘   └───────────────┘           │
        │                                       │
        │   ┌───────────────────────────────────┘
        │   │
        ▼   ▼
┌───────────────────────────────────────────────────────────┐
│                      TIMETABLE_SLOTS                       │
│───────────────────────────────────────────────────────────│
│  slot_id  │  course_id  │  sem  │  day  │  time_slot_id │
│  subject_id│  faculty_id │  room │  start│  end          │
│  section   │  is_locked  │  auto │      │               │
└─────┬─────────────────────────────────────────────────────┘
      │
      │   ┌─────────────────────────────────────────────────┐
      ├───▶│                   EXAMS                         │
      │   │─────────────────────────────────────────────────│
      │   │  exam_id  │  subject_id  │  title  │  date     │
      │   │  duration │  total_marks │  created_by        │
      │   └─────────────────────────┬───────────────────────┘
      │                             │
      │                             ▼
      │   ┌─────────────────────────────────────────────────┐
      ├──▶│                    QUESTIONS                      │
      │   │─────────────────────────────────────────────────│
      │   │  q_id  │  exam_id  │  q_text  │  type  │ marks │
      │   └─────────────────────────────────────────────────┘
      │
      ├──────────────────────────────────────────────────────┐
      │                                                      │
      ▼                                                      ▼
┌───────────────────────┐                    ┌───────────────────────────┐
│   SEMESTER_RESULTS    │                    │    AI_ATTENDANCE          │
│───────────────────────│                    │───────────────────────────│
│ result_id             │                    │ ai_face_encodings          │
│ student_id ●──────────┼───────────────────▶│ ai_lecture_sessions        │
│ semester              │                    │ ai_attendance_records      │
│ sgpa                  │                    │ ai_attendance_anomalies    │
│ cgpa                  │                    │ ai_attendance_notifications│
│ percentage            │                    └───────────────────────────┘
│ grade                 │
│ status                │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   SUBJECT_RESULTS     │
│───────────────────────│
│ subject_result_id     │
│ semester_result_id ●──┼────┐
│ subject_id            │    │
│ internal_marks        │    │
│ external_marks        │    │
│ practical_marks       │    │
│ total_marks           │    │
│ is_passed             │    │
└───────────────────────┘    │
                             │
                             ▼
                    ┌───────────────────────┐
                    │   NOTIFICATIONS       │
                    │───────────────────────│
                    │ notification_id       │
                    │ user_id               │
                    │ title                 │
                    │ message               │
                    │ is_read               │
                    └───────────────────────┘

─────────────────────────────────────────────────────────────────────────────

                    RELATIONSHIP SUMMARY
                    
    USERS (1:1) ──────────── STUDENTS
    USERS (1:1) ──────────── FACULTY  
    USERS (1:1) ──────────── ADMINS
    
    COURSES (1:N) ────────── SUBJECTS
    COURSES (1:N) ────────── STUDENTS
    COURSES (1:N) ────────── TIMETABLE_SLOTS
    
    SUBJECTS (1:N) ───────── TIMETABLE_SLOTS
    SUBJECTS (1:N) ───────── EXAMS
    SUBJECTS (1:N) ───────── SEMESTER_RESULTS
    
    FACULTY (1:N) ────────── TIMETABLE_SLOTS
    FACULTY (1:N) ────────── FACULTY_AVAILABILITY
    FACULTY (1:N) ────────── EXAMS
    
    ROOMS (1:N) ──────────── TIMETABLE_SLOTS
    TIME_SLOTS (1:N) ─────── TIMETABLE_SLOTS
    SHIFTS (1:N) ─────────── TIME_SLOTS
    
    EXAMS (1:N) ──────────── QUESTIONS
    EXAMS (1:N) ──────────── EXAM_RESULTS
    
    STUDENTS (1:N) ───────── EXAM_RESULTS
    STUDENTS (1:N) ───────── SEMESTER_RESULTS
    STUDENTS (1:N) ───────── AI_FACE_ENCODINGS
    
    SEMESTER_RESULTS (1:N) ─ SUBJECT_RESULTS
    SEMESTER_RESULTS (1:N) ─ SUBJECTS
    
    AI_LECTURE_SESSIONS (1:N) ─ AI_ATTENDANCE_RECORDS
```

---

## 📋 Mermaid Code (Copy & Paste to https://mermaid.live)

```mermaid
erDiagram
    USERS ||--o| STUDENTS : "1:1"
    USERS ||--o| FACULTY : "1:1"
    USERS ||--o| ADMINS : "1:1"
    
    USERS {
        uuid user_id PK
        string email UK
        string password
        string role
        timestamp created_at
    }
    
    STUDENTS ||--o{ TIMETABLE_SLOTS : "attends"
    STUDENTS ||--o{ SEMESTER_RESULTS : "has"
    STUDENTS ||--o{ AI_FACE_ENCODINGS : "has"
    STUDENTS ||--o{ NOTIFICATIONS : "receives"
    
    STUDENTS {
        uuid student_id PK
        uuid user_id FK UK
        string enrollment_no UK
        string name
        string email
        string phone
        uuid course_id FK
        integer current_semester
        decimal cgpa
    }
    
    FACULTY ||--o{ TIMETABLE_SLOTS : "teaches"
    FACULTY ||--o{ EXAMS : "creates"
    FACULTY ||--o{ AI_LECTURE_SESSIONS : "conducts"
    
    FACULTY {
        uuid faculty_id PK
        uuid user_id FK UK
        string employee_id UK
        string name
        string email
        string department
    }
    
    ADMINS ||--o{ NOTIFICATIONS : "sends"
    
    ADMINS {
        uuid admin_id PK
        uuid user_id FK UK
        string employee_id UK
        string name
        string email
    }
    
    COURSES ||--o{ SUBJECTS : "has"
    COURSES ||--o{ STUDENTS : "enrolls"
    COURSES ||--o{ TIMETABLE_SLOTS : "schedules"
    COURSES ||--o{ AI_LECTURE_SESSIONS : "uses"
    
    COURSES {
        uuid course_id PK
        string code UK
        string name
        integer total_semesters
        string department
        string shift
    }
    
    SUBJECTS ||--o{ TIMETABLE_SLOTS : "scheduled_in"
    SUBJECTS ||--o{ EXAMS : "exam_of"
    SUBJECTS ||--o{ SEMESTER_RESULTS : "results"
    SUBJECTS ||--o{ QUESTIONS : "questions"
    
    SUBJECTS {
        uuid subject_id PK
        string code UK
        string name
        uuid course_id FK
        integer semester
        integer credits
    }
    
    ROOMS ||--o{ TIMETABLE_SLOTS : "allocated"
    
    ROOMS {
        uuid room_id PK
        string room_number UK
        string building
        string room_type
        integer capacity
    }
    
    SHIFTS ||--o{ TIME_SLOTS : "contains"
    
    SHIFTS {
        uuid shift_id PK
        string name
        string code UK
        time start_time
        time end_time
    }
    
    TIME_SLOTS ||--o{ TIMETABLE_SLOTS : "time_of"
    
    TIME_SLOTS {
        uuid slot_id PK
        string name
        time start_time
        time end_time
        uuid shift_id FK
        boolean is_break
    }
    
    TIMETABLE_SLOTS {
        uuid slot_id PK
        uuid course_id FK
        integer semester
        string day_of_week
        uuid time_slot_id FK
        uuid subject_id FK
        uuid faculty_id FK
        uuid room_id FK
        string section
    }
    
    EXAMS ||--o{ QUESTIONS : "contains"
    EXAMS ||--o{ EXAM_RESULTS : "results"
    
    EXAMS {
        uuid exam_id PK
        string title
        uuid subject_id FK
        string exam_type
        date exam_date
        integer duration_minutes
        integer total_marks
        uuid created_by FK
    }
    
    QUESTIONS {
        uuid question_id PK
        uuid exam_id FK
        text question_text
        string question_type
        integer marks
        json options
    }
    
    STUDENTS ||--o{ EXAM_RESULTS : "appears"
    
    EXAM_RESULTS ||--o{ STUDENT_ANSWERS : "contains"
    
    EXAM_RESULTS {
        uuid result_id PK
        uuid student_id FK
        uuid exam_id FK
        decimal marks_obtained
        boolean is_absent
    }
    
    STUDENT_ANSWERS {
        uuid answer_id PK
        uuid exam_result_id FK
        uuid question_id FK
        text answer_text
        string selected_option
        boolean is_correct
    }
    
    SEMESTER_RESULTS ||--o{ SUBJECT_RESULTS : "contains"
    
    SEMESTER_RESULTS {
        uuid result_id PK
        uuid student_id FK
        integer semester
        decimal sgpa
        decimal percentage
        string grade
        string status
    }
    
    SUBJECT_RESULTS {
        uuid subject_result_id PK
        uuid semester_result_id FK
        uuid subject_id FK
        integer internal_marks
        integer external_marks
        integer total_marks
        boolean is_passed
    }
    
    NOTIFICATIONS {
        uuid notification_id PK
        uuid user_id FK
        string title
        text message
        boolean is_read
        timestamp created_at
    }
    
    AI_LECTURE_SESSIONS ||--o{ AI_ATTENDANCE_RECORDS : "records"
    
    AI_LECTURE_SESSIONS {
        uuid session_id PK
        string lecture_name
        date session_date
        uuid faculty_id FK
        uuid course_id FK
        integer semester
    }
    
    STUDENTS ||--o{ AI_FACE_ENCODINGS : "enrolled"
    
    AI_FACE_ENCODINGS {
        uuid encoding_id PK
        uuid student_id FK
        bytes encoding_data
        timestamp created_at
    }
    
    AI_ATTENDANCE_RECORDS {
        uuid record_id PK
        uuid session_id FK
        uuid student_id FK
        uuid encoding_id FK
        boolean is_present
        decimal confidence_score
    }
```

---

## 📊 Complete Table List (30 Core Tables)

| # | Table Name | Description | Type |
|---|-----------|-------------|------|
| 1 | users | User authentication | Core |
| 2 | students | Student profiles | Core |
| 3 | faculty | Faculty profiles | Core |
| 4 | admins | Admin profiles | Core |
| 5 | courses | Course information | Core |
| 6 | subjects | Subject details | Core |
| 7 | notifications | System notifications | Core |
| 8 | rooms | Room management | Timetable |
| 9 | shifts | Morning/Noon shifts | Timetable |
| 10 | time_slots | Time slot definitions | Timetable |
| 11 | timetable_slots | Scheduled classes | Timetable |
| 12 | faculty_availability | Faculty working days | Timetable |
| 13 | timetable_templates | Recurring patterns | Timetable |
| 14 | timetable_schedules | Generated schedules | Timetable |
| 15 | timetable_conflicts | Conflict tracking | Timetable |
| 16 | exams | Exam definitions | Exam |
| 17 | questions | Exam questions | Exam |
| 18 | exam_results | Student scores | Exam |
| 19 | student_answers | Answer records | Exam |
| 20 | semester_results | SGPA/CGPA | Result |
| 21 | subject_results | Subject marks | Result |
| 22 | ai_face_encodings | Face data | AI |
| 23 | ai_lecture_sessions | Lecture tracking | AI |
| 24 | ai_attendance_records | Daily attendance | AI |
| 25 | ai_attendance_anomalies | Anomaly detection | AI |
| 26 | ai_attendance_notifications | Alert system | AI |
| 27 | holidays | Academic holidays | Admin |
| 28 | academic_terms | Term definitions | Admin |
| 29 | break_slots | Lunch breaks | Timetable |
| 30 | day_types | Day categories | Timetable |
