# Data Dictionary — Academic Section Portal (Part 1)

---

## 1. Table: `users`
**Description:** Core authentication table for all system users (Student, Faculty, Admin).

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | user_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for each user |
| 2 | email | VARCHAR | 254 chars | UNIQUE, NOT NULL | User login email address |
| 3 | password | VARCHAR | 128 chars | NOT NULL | Hashed password (Django auth) |
| 4 | role | VARCHAR | 10 chars | NOT NULL, Default: 'student' | Role: student / faculty / admin |
| 5 | is_active | BOOLEAN | 1 bit | NOT NULL, Default: TRUE | Whether the user account is active |
| 6 | is_staff | BOOLEAN | 1 bit | NOT NULL, Default: FALSE | Django admin panel access flag |
| 7 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Timestamp when user was created |
| 8 | updated_at | DATETIME | 8 bytes | NOT NULL, Auto | Timestamp when user was last updated |

---

## 2. Table: `students`
**Description:** Student profile information linked to the users table.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | student_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for each student |
| 2 | user_id | UUID | 36 chars | FK → users.user_id, CASCADE | Link to core user account |
| 3 | enrollment_no | VARCHAR | 20 chars | UNIQUE, NOT NULL | University enrollment number |
| 4 | name | VARCHAR | 100 chars | NOT NULL | Full name of the student |
| 5 | email | VARCHAR | 254 chars | NOT NULL | Student email address |
| 6 | phone | VARCHAR | 15 chars | NULL | Contact phone number |
| 7 | course_id | UUID | 36 chars | FK → courses.course_id, SET NULL | Course the student is enrolled in |
| 8 | semester | INTEGER | 4 bytes | NOT NULL, Default: 1 | Current semester number |
| 9 | current_semester | INTEGER | 4 bytes | NOT NULL, Default: 1 | Active semester for academics |
| 10 | total_semesters | INTEGER | 4 bytes | NOT NULL, Default: 6 | Total semesters in the program |
| 11 | cgpa | DECIMAL | (4,2) | Default: 0.00 | Cumulative Grade Point Average |
| 12 | status | VARCHAR | 20 chars | Default: 'Active' | Student status (Active/Inactive) |
| 13 | avatar | IMAGE | Variable | NULL | Profile photo upload path |
| 14 | is_face_registered | BOOLEAN | 1 bit | Default: FALSE | Whether face biometric is registered |
| 15 | date_of_birth | DATE | 3 bytes | NULL | Student date of birth |
| 16 | gender | VARCHAR | 10 chars | NULL | Gender (Male/Female/Other) |
| 17 | father_name | VARCHAR | 100 chars | NULL | Father's name |
| 18 | address | TEXT | Variable | NULL | Residential address |
| 19 | batch | VARCHAR | 2 chars | NULL | Batch A or B |
| 20 | admission_year | INTEGER | 4 bytes | Default: 2026 | Year of admission |
| 21 | branch | VARCHAR | 100 chars | NULL | Campus branch (Kherva / Ahmedabad) |
| 22 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |
| 23 | updated_at | DATETIME | 8 bytes | NOT NULL, Auto | Record last update timestamp |

---

## 3. Table: `faculty`
**Description:** Faculty member profiles linked to users table.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | faculty_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for each faculty |
| 2 | user_id | UUID | 36 chars | FK → users.user_id, CASCADE | Link to core user account |
| 3 | employee_id | VARCHAR | 20 chars | UNIQUE, NOT NULL | Institutional employee ID |
| 4 | name | VARCHAR | 100 chars | NOT NULL | Full name of the faculty member |
| 5 | email | VARCHAR | 254 chars | NOT NULL | Faculty email address |
| 6 | phone | VARCHAR | 15 chars | NULL | Contact phone number |
| 7 | department | VARCHAR | 50 chars | NOT NULL | Department name |
| 8 | status | VARCHAR | 20 chars | Default: 'Active' | Employment status |
| 9 | avatar | IMAGE | Variable | NULL | Profile photo upload path |
| 10 | is_class_teacher | BOOLEAN | 1 bit | Default: FALSE | Whether faculty is class teacher |
| 11 | is_hod | BOOLEAN | 1 bit | Default: FALSE | Whether faculty is Head of Department |
| 12 | class_course_id | UUID | 36 chars | FK → courses, SET NULL, NULL | Course for which faculty is class teacher |
| 13 | class_semester | INTEGER | 4 bytes | NULL, Default: 1 | Semester for which faculty is class teacher |
| 14 | working_shift | VARCHAR | 20 chars | Default: 'Noon' | Morning/Noon/Evening/Full Day |
| 15 | max_lectures_per_day | INTEGER | 4 bytes | Default: 6 | Max lectures per day |
| 16 | working_days | JSON | Variable | Default: [] | List of working days |
| 17 | gender | VARCHAR | 10 chars | NULL | Gender (Male/Female/Other) |
| 18 | date_of_birth | DATE | 3 bytes | NULL | Date of birth |
| 19 | address | TEXT | Variable | NULL | Residential address |
| 20 | designation | VARCHAR | 50 chars | NULL | HOD/Professor/Lecturer etc. |
| 21 | qualification | VARCHAR | 100 chars | NULL | Educational qualification |
| 22 | experience_years | INTEGER | 4 bytes | Default: 0 | Years of teaching experience |
| 23 | branch | VARCHAR | 100 chars | NULL | Campus branch |
| 24 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |
| 25 | updated_at | DATETIME | 8 bytes | NOT NULL, Auto | Record last update timestamp |

---

## 4. Table: `admins`
**Description:** Admin user profiles linked to users table.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | admin_id_pk | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for each admin |
| 2 | user_id | UUID | 36 chars | FK → users.user_id, CASCADE | Link to core user account |
| 3 | admin_id | VARCHAR | 20 chars | UNIQUE, NOT NULL | Institutional admin ID |
| 4 | name | VARCHAR | 100 chars | NOT NULL | Full name of admin |
| 5 | email | VARCHAR | 254 chars | NOT NULL | Admin email address |
| 6 | phone | VARCHAR | 15 chars | NULL | Contact phone number |
| 7 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |
| 8 | updated_at | DATETIME | 8 bytes | NOT NULL, Auto | Record last update timestamp |

---

## 5. Table: `notifications`
**Description:** System-wide notifications sent to students, faculty, or admins.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | notification_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for notification |
| 2 | target | VARCHAR | 100 chars | NOT NULL | Target audience (role or specific user) |
| 3 | type | VARCHAR | 50 chars | NOT NULL | Notification type category |
| 4 | priority | VARCHAR | 50 chars | Default: 'Normal' | Priority level (Normal/High/Critical) |
| 5 | title | VARCHAR | 200 chars | NOT NULL | Notification title/headline |
| 6 | message | TEXT | Variable | NOT NULL | Full notification message body |
| 7 | status | VARCHAR | 50 chars | Default: 'Delivered' | Delivery status |
| 8 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Timestamp notification was created |

---

## 6. Table: `password_reset_otps`
**Description:** OTP tokens for password reset flow.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | id | INTEGER | 4 bytes | PK, Auto-increment | Auto-generated primary key |
| 2 | user_id | UUID | 36 chars | FK → users.user_id, CASCADE | User requesting password reset |
| 3 | otp | VARCHAR | 6 chars | NOT NULL | 6-digit one-time password |
| 4 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | OTP generation timestamp |
| 5 | expires_at | DATETIME | 8 bytes | NOT NULL | OTP expiry timestamp |
| 6 | is_used | BOOLEAN | 1 bit | Default: FALSE | Whether OTP has been consumed |

---

## 7. Table: `courses`
**Description:** Academic programs offered by the university (BCA, MCA, BTECH etc.).

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | course_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for each course |
| 2 | code | VARCHAR | 20 chars | UNIQUE, NOT NULL | Short course code (e.g. BCA, MCA) |
| 3 | name | VARCHAR | 100 chars | NOT NULL | Full course name |
| 4 | duration | INTEGER | 4 bytes | NOT NULL | Duration in years |
| 5 | total_semesters | INTEGER | 4 bytes | NOT NULL | Total number of semesters |
| 6 | department | VARCHAR | 50 chars | NOT NULL | Department offering the course |
| 7 | level | VARCHAR | 50 chars | NULL | Undergraduate / Postgraduate |
| 8 | credits | INTEGER | 4 bytes | Default: 0 | Total graduation credits required |
| 9 | status | VARCHAR | 20 chars | Default: 'Active' | Course status (Active/Inactive) |
| 10 | shift | VARCHAR | 10 chars | Default: 'NOON' | MORNING or NOON timetable shift |
| 11 | desc | TEXT | Variable | NULL | Program summary description |
| 12 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |

---

## 8. Table: `subjects`
**Description:** Individual subjects linked to courses and semesters.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | subject_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for each subject |
| 2 | code | VARCHAR | 20 chars | UNIQUE, NOT NULL | Subject code (e.g. BCA301) |
| 3 | name | VARCHAR | 100 chars | NOT NULL | Subject name |
| 4 | course_id | UUID | 36 chars | FK → courses.course_id, CASCADE | Course this subject belongs to |
| 5 | semester | INTEGER | 4 bytes | NOT NULL | Semester in which subject is taught |
| 6 | credits | INTEGER | 4 bytes | Default: 4 | Credit hours assigned |
| 7 | campus_branch | VARCHAR | 20 chars | Default: 'Kherva' | Kherva / Ahmedabad / Both |
| 8 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |
