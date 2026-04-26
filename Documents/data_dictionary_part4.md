# Data Dictionary — Academic Section Portal (Part 4 — AI Attendance & PYQ)

---

## 28. Table: `ai_student_profiles`
**Description:** Extended AI-attendance profile for students, storing face registration status.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | id | INTEGER | 4 bytes | PK, Auto-increment | Auto-generated primary key |
| 2 | user_id | UUID | 36 chars | FK → users.user_id, CASCADE, OneToOne | Linked user account |
| 3 | phone_number | VARCHAR | 15 chars | NULL | Student phone number |
| 4 | parent_phone_number | VARCHAR | 15 chars | NULL | Parent/guardian phone number |
| 5 | email | VARCHAR | 254 chars | NULL | Student email |
| 6 | is_face_registered | BOOLEAN | 1 bit | Default: FALSE | Whether face biometric is registered |
| 7 | is_details_filled | BOOLEAN | 1 bit | Default: FALSE | Whether profile details are complete |
| 8 | face_registered_at | DATETIME | 8 bytes | NULL | Timestamp of face registration |
| 9 | registered_face_photo | IMAGE | Variable | NULL | Path to face registration photo |
| 10 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |

---

## 29. Table: `ai_face_encodings`
**Description:** Paths to face-encoding pickle files for biometric identification.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | id | INTEGER | 4 bytes | PK, Auto-increment | Auto-generated primary key |
| 2 | student_id | UUID | 36 chars | FK → users.user_id, CASCADE, OneToOne | Associated student user |
| 3 | encoding_path | VARCHAR | 500 chars | NOT NULL | Relative path to .pkl file in MEDIA_ROOT |
| 4 | encoding_count | INTEGER | 4 bytes | Default: 0 | Number of face samples (max 5) |
| 5 | last_updated | DATETIME | 8 bytes | NOT NULL, Auto | Timestamp of last encoding update |

---

## 30. Table: `ai_lecture_sessions`
**Description:** Faculty-created lecture sessions tracked via QR or face recognition.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | id | INTEGER | 4 bytes | PK, Auto-increment | Auto-generated primary key |
| 2 | subject_id | UUID | 36 chars | FK → subjects, CASCADE | Subject for this session |
| 3 | faculty_id | UUID | 36 chars | FK → users.user_id, CASCADE | Faculty conducting the session |
| 4 | date | DATE | 3 bytes | NOT NULL | Session date |
| 5 | start_time | TIME | 3 bytes | NOT NULL | Session start time |
| 6 | end_time | TIME | 3 bytes | NOT NULL | Session end time |
| 7 | total_students | INTEGER | 4 bytes | Default: 0 | Class strength entered by faculty |
| 8 | session_type | VARCHAR | 20 chars | Default: 'lecture' | lecture / lab / tutorial |
| 9 | is_active | BOOLEAN | 1 bit | Default: TRUE | Whether session is currently open |
| 10 | qr_token | UUID | 36 chars | UNIQUE, Default: uuid4 | Rotating QR token for attendance |
| 11 | qr_expires_at | DATETIME | 8 bytes | NULL | QR token expiry timestamp |
| 12 | qr_image_path | VARCHAR | 500 chars | NULL | Path to generated QR image |
| 13 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |
| 14 | classroom_lat | FLOAT | 8 bytes | NULL | Classroom GPS latitude for geofencing |
| 15 | classroom_lng | FLOAT | 8 bytes | NULL | Classroom GPS longitude for geofencing |
| 16 | geofence_radius | INTEGER | 4 bytes | Default: 50 | Allowed radius in metres |
| 17 | qr_refresh_secs | INTEGER | 4 bytes | Default: 60 | QR rotation interval in seconds |

---

## 31. Table: `ai_attendance_records`
**Description:** Individual attendance record for one student in one lecture session.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | id | INTEGER | 4 bytes | PK, Auto-increment | Auto-generated primary key |
| 2 | session_id | INTEGER | 4 bytes | FK → ai_lecture_sessions, CASCADE | Lecture session reference |
| 3 | student_id | UUID | 36 chars | FK → users.user_id, CASCADE | Student whose attendance is recorded |
| 4 | status | VARCHAR | 20 chars | Default: 'absent' | present / absent / late / excused |
| 5 | marked_via | VARCHAR | 20 chars | Default: 'manual' | qr_link / face_recognition / manual |
| 6 | confidence_score | FLOAT | 8 bytes | NULL | Face recognition confidence (0–100) |
| 7 | snapshot_path | VARCHAR | 500 chars | NULL | Path to face snapshot at marking time |
| 8 | marked_at | DATETIME | 8 bytes | NOT NULL, Auto | Timestamp when attendance was marked |
| 9 | ip_address | VARCHAR | 45 chars | NULL | Student's IP address at marking time |
| 10 | latitude | FLOAT | 8 bytes | NULL | Student GPS latitude at marking time |
| 11 | longitude | FLOAT | 8 bytes | NULL | Student GPS longitude at marking time |
| 12 | gps_verified | BOOLEAN | 1 bit | Default: FALSE | True if GPS passed geofence check |
| 13 | device_id | VARCHAR | 200 chars | NULL | Browser device fingerprint |
| 14 | device_verified | BOOLEAN | 1 bit | Default: FALSE | True if device matched trusted binding |
| 15 | liveness_passed | BOOLEAN | 1 bit | Default: FALSE | True if liveness check passed |
| 16 | liveness_score | FLOAT | 8 bytes | NULL | Liveness score 0.0–1.0 |
| 17 | security_score | FLOAT | 8 bytes | NULL | Composite security score 0–100 |

*Unique constraint on (session_id, student_id)*

---

## 32. Table: `ai_attendance_anomalies`
**Description:** AI-detected attendance irregularities for students.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | id | INTEGER | 4 bytes | PK, Auto-increment | Auto-generated primary key |
| 2 | student_id | UUID | 36 chars | FK → users.user_id, CASCADE | Student with anomaly |
| 3 | subject_id | UUID | 36 chars | FK → subjects, CASCADE | Subject where anomaly detected |
| 4 | anomaly_type | VARCHAR | 30 chars | NOT NULL | consecutive_absent / low_percentage / irregular_pattern / sudden_drop |
| 5 | severity | VARCHAR | 20 chars | Default: 'medium' | low / medium / high / critical |
| 6 | description | TEXT | Variable | NULL | LLM-generated faculty alert message |
| 7 | detected_at | DATETIME | 8 bytes | NOT NULL, Auto | When anomaly was detected |
| 8 | is_resolved | BOOLEAN | 1 bit | Default: FALSE | Whether anomaly has been addressed |
| 9 | resolved_at | DATETIME | 8 bytes | NULL | When anomaly was resolved |

---

## 33. Table: `ai_attendance_notifications`
**Description:** Notifications sent to users triggered by attendance anomalies.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | id | INTEGER | 4 bytes | PK, Auto-increment | Auto-generated primary key |
| 2 | recipient_id | UUID | 36 chars | FK → users.user_id, CASCADE | User receiving the notification |
| 3 | notification_type | VARCHAR | 30 chars | NOT NULL | student_alert / faculty_info / admin_critical |
| 4 | message | TEXT | Variable | NOT NULL | Notification message content |
| 5 | sent_at | DATETIME | 8 bytes | NOT NULL, Auto | When notification was sent |
| 6 | is_read | BOOLEAN | 1 bit | Default: FALSE | Whether notification has been read |
| 7 | triggered_by_id | INTEGER | 4 bytes | FK → ai_attendance_anomalies, SET NULL, NULL | Anomaly that triggered this |

---

## 34. Table: `ai_student_devices`
**Description:** Trusted device fingerprints — one student = one device anti-proxy policy.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | id | INTEGER | 4 bytes | PK, Auto-increment | Auto-generated primary key |
| 2 | student_id | UUID | 36 chars | FK → users.user_id, CASCADE | Student this device belongs to |
| 3 | device_id | VARCHAR | 200 chars | NOT NULL | Browser UUID from localStorage |
| 4 | device_ua | VARCHAR | 500 chars | NULL | User-Agent string at registration |
| 5 | registered_at | DATETIME | 8 bytes | NOT NULL, Auto | When device was first registered |
| 6 | is_active | BOOLEAN | 1 bit | Default: TRUE | Whether device is trusted |

*Unique constraint on (student_id, device_id)*

---

## 35. Table: `ai_powered_exam_paper_generator_generatedpaper`
**Description:** AI-generated exam papers stored as JSON blobs for PYQ feature.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | id | INTEGER | 4 bytes | PK, Auto-increment | Auto-generated primary key |
| 2 | semester | INTEGER | 4 bytes | NOT NULL | Semester for which paper was generated |
| 3 | subject_code | VARCHAR | 50 chars | NOT NULL | Subject code of the paper |
| 4 | subject_name | VARCHAR | 150 chars | NOT NULL | Subject name |
| 5 | exam_type | VARCHAR | 50 chars | NOT NULL | Exam type (Mid Term / End Term etc.) |
| 6 | total_marks | INTEGER | 4 bytes | Default: 60 | Total marks for generated paper |
| 7 | paper_data | JSON | Variable | NULL | Complete generated paper as JSON |
| 8 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Timestamp paper was generated |

---

## Junction Table: `faculty_subjects` (Django Auto-Generated M2M)
**Description:** Many-to-Many relationship between Faculty and Subjects.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | id | INTEGER | 4 bytes | PK, Auto-increment | Auto-generated primary key |
| 2 | faculty_id | UUID | 36 chars | FK → faculty.faculty_id | Faculty member reference |
| 3 | subject_id | UUID | 36 chars | FK → subjects.subject_id | Subject assigned to faculty |
