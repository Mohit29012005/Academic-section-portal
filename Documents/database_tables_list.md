# 📊 Database Tables — Academic Section Portal

> **Project:** Ganpat University Academic Section Portal  
> **Backend:** Django (Python) | **Database:** PostgreSQL (via Supabase)  
> **Total Tables:** 30

---

## 📌 Table Index

| # | Table Name (DB) | Model Class | Django App | Category |
|---|----------------|-------------|------------|----------|
| 1 | `users` | User | users | Authentication |
| 2 | `students` | Student | users | User Profiles |
| 3 | `faculty` | Faculty | users | User Profiles |
| 4 | `admins` | Admin | users | User Profiles |
| 5 | `notifications` | Notification | users | Communication |
| 6 | `password_reset_otps` | PasswordResetOTP | users | Authentication |
| 7 | `courses` | Course | academics | Academics |
| 8 | `subjects` | Subject | academics | Academics |
| 9 | `rooms` | Room | academics | Infrastructure |
| 10 | `shifts` | Shift | academics | Scheduling |
| 11 | `break_slots` | BreakSlot | academics | Scheduling |
| 12 | `day_types` | DayType | academics | Scheduling |
| 13 | `time_slots` | TimeSlot | academics | Scheduling |
| 14 | `timetable_slots` | TimetableSlot | academics | Timetable |
| 15 | `timetable_templates` | TimetableTemplate | academics | Timetable |
| 16 | `timetable_schedules` | TimetableSchedule | academics | Timetable |
| 17 | `faculty_availability` | FacultyAvailability | academics | Timetable |
| 18 | `timetable_conflicts` | TimetableConflict | academics | Timetable |
| 19 | `academic_terms` | AcademicTerm | academics | Academics |
| 20 | `holidays` | Holiday | academics | Academics |
| 21 | `exams` | Exam | academics | Examinations |
| 22 | `questions` | Question | academics | Examinations |
| 23 | `exam_results` | ExamResult | academics | Examinations |
| 24 | `student_answers` | StudentAnswer | academics | Examinations |
| 25 | `semester_results` | SemesterResult | academics | Academics |
| 26 | `subject_results` | SubjectResult | academics | Academics |
| 27 | `semester_config` | SemesterConfig | academics | Configuration |
| 28 | `ai_student_profiles` | StudentProfile | attendance_ai | AI Attendance |
| 29 | `ai_face_encodings` | FaceEncoding | attendance_ai | AI Attendance |
| 30 | `ai_lecture_sessions` | LectureSession | attendance_ai | AI Attendance |
| 31 | `ai_attendance_records` | AttendanceRecord | attendance_ai | AI Attendance |
| 32 | `ai_attendance_anomalies` | AttendanceAnomaly | attendance_ai | AI Attendance |
| 33 | `ai_attendance_notifications` | AttendanceNotification | attendance_ai | AI Attendance |
| 34 | `ai_student_devices` | StudentDevice | attendance_ai | AI Attendance |
| 35 | `ai_powered_exam_paper_generator_generatedpaper` | GeneratedPaper | AI_Powered_Exam_Paper_Generator | PYQ Generator |

---

## 🗂️ Tables by Category

### 🔐 Authentication & Users (6 Tables)
- `users` — Core authentication with role-based access
- `students` — Student profiles linked to users
- `faculty` — Faculty profiles linked to users
- `admins` — Admin profiles linked to users
- `notifications` — System-wide notifications
- `password_reset_otps` — OTP-based password reset tokens

### 📚 Academics (6 Tables)
- `courses` — Academic programs (BCA, MCA, BTECH, etc.)
- `subjects` — Subjects linked to courses and semesters
- `academic_terms` — Semester terms with start/end dates
- `semester_results` — Per-student semester performance
- `subject_results` — Per-subject marks linked to semester results
- `semester_config` — Global active parity toggle (Odd/Even)
- `holidays` — Institutional/national holidays

### 🏗️ Infrastructure (1 Table)
- `rooms` — Classrooms and labs with capacity and equipment

### ⏰ Scheduling (4 Tables)
- `shifts` — Morning/Noon/Evening shifts
- `break_slots` — Tea, Lunch, Prayer breaks
- `day_types` — Weekday, Saturday, Holiday configurations
- `time_slots` — Individual period slots linked to shifts

### 📅 Timetable (5 Tables)
- `timetable_slots` — Actual class schedule entries
- `timetable_templates` — Repeatable timetable patterns
- `timetable_schedules` — Published monthly schedules
- `faculty_availability` — Per-faculty day availability
- `timetable_conflicts` — Detected scheduling conflicts

### 📝 Examinations (4 Tables)
- `exams` — Exam definitions (Mid/End Term, Quiz, etc.)
- `questions` — Questions linked to exams
- `exam_results` — Student exam performance
- `student_answers` — Individual question answers

### 🤖 AI Attendance System (7 Tables)
- `ai_student_profiles` — Extended AI attendance profiles
- `ai_face_encodings` — Face biometric encoding paths
- `ai_lecture_sessions` — Faculty-created lecture sessions with QR
- `ai_attendance_records` — Per-student attendance per session
- `ai_attendance_anomalies` — AI-detected attendance irregularities
- `ai_attendance_notifications` — Anomaly-triggered alerts
- `ai_student_devices` — Trusted device fingerprints (anti-proxy)

### 📄 PYQ Generator (1 Table)
- `ai_powered_exam_paper_generator_generatedpaper` — Generated exam papers stored as JSON

---

## 🔗 Key Relationships (Foreign Keys)

```
users ──────────────────────────────────► students (OneToOne)
users ──────────────────────────────────► faculty (OneToOne)
users ──────────────────────────────────► admins (OneToOne)
users ──────────────────────────────────► password_reset_otps (FK)
courses ────────────────────────────────► students (FK: course_id)
courses ────────────────────────────────► subjects (FK)
courses ────────────────────────────────► timetable_slots (FK)
subjects ───────────────────────────────► timetable_slots (FK)
subjects ───────────────────────────────► exams (FK)
subjects ───────────────────────────────► ai_lecture_sessions (FK)
faculty ────────────────────────────────► timetable_slots (FK)
faculty ────────────────────────────────► faculty_availability (FK)
students ───────────────────────────────► semester_results (FK)
semester_results ───────────────────────► subject_results (FK)
exams ──────────────────────────────────► questions (FK)
exams ──────────────────────────────────► exam_results (FK)
exam_results ───────────────────────────► student_answers (FK)
ai_lecture_sessions ────────────────────► ai_attendance_records (FK)
ai_attendance_anomalies ────────────────► ai_attendance_notifications (FK)
shifts ─────────────────────────────────► time_slots (FK)
day_types ──────────────────────────────► time_slots (FK)
timetable_templates ────────────────────► timetable_schedules (FK)
academic_terms ─────────────────────────► timetable_schedules (FK)
timetable_slots ────────────────────────► timetable_conflicts (FK ×2)
users ──────────────────────────────────► ai_student_profiles (OneToOne)
users ──────────────────────────────────► ai_face_encodings (OneToOne)
users ──────────────────────────────────► ai_attendance_records (FK)
users ──────────────────────────────────► ai_student_devices (FK)
faculty ◄──────────────────────────────── subjects (ManyToMany)
```
