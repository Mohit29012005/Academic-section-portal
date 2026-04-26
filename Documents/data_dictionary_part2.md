# Data Dictionary — Academic Section Portal (Part 2)

---

## 9. Table: `rooms`
**Description:** Physical classrooms, labs, and seminar halls.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | room_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for each room |
| 2 | room_number | VARCHAR | 20 chars | UNIQUE, NOT NULL | Room identifier (e.g. A101) |
| 3 | building | VARCHAR | 50 chars | NOT NULL | Building name |
| 4 | room_type | VARCHAR | 20 chars | Default: 'Lecture Hall' | Lecture Hall/Lab/Workshop/Seminar Hall |
| 5 | capacity | INTEGER | 4 bytes | Default: 60 | Maximum student capacity |
| 6 | floor | INTEGER | 4 bytes | Default: 1 | Floor number |
| 7 | campus_branch | VARCHAR | 20 chars | Default: 'Kherva' | Kherva (Mehsana) or Ahmedabad |
| 8 | has_projector | BOOLEAN | 1 bit | Default: FALSE | Whether room has projector |
| 9 | has_computers | BOOLEAN | 1 bit | Default: FALSE | Whether room has computers |
| 10 | is_available | BOOLEAN | 1 bit | Default: TRUE | Whether room is currently available |
| 11 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |

---

## 10. Table: `shifts`
**Description:** Working shifts for faculty and course scheduling.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | shift_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for each shift |
| 2 | name | VARCHAR | 50 chars | NOT NULL | Shift name (Morning/Noon/Evening) |
| 3 | code | VARCHAR | 20 chars | UNIQUE, NOT NULL | Short code (M/N/E) |
| 4 | start_time | TIME | 3 bytes | NOT NULL | Shift start time |
| 5 | end_time | TIME | 3 bytes | NOT NULL | Shift end time |
| 6 | campus_branch | VARCHAR | 20 chars | Default: 'Kherva' | Applicable campus |
| 7 | is_active | BOOLEAN | 1 bit | Default: TRUE | Whether shift is currently active |
| 8 | display_order | INTEGER | 4 bytes | Default: 0 | Display sequence order |
| 9 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |

---

## 11. Table: `break_slots`
**Description:** Break periods (Tea, Lunch, Prayer) within a working day.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | break_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for each break |
| 2 | name | VARCHAR | 50 chars | NOT NULL | Break name (Lunch Break, etc.) |
| 3 | break_type | VARCHAR | 20 chars | Default: 'Lunch' | Tea/Lunch/Prayer/Other |
| 4 | start_time | TIME | 3 bytes | NOT NULL | Break start time |
| 5 | end_time | TIME | 3 bytes | NOT NULL | Break end time |
| 6 | duration_minutes | INTEGER | 4 bytes | Default: 30 | Duration in minutes |
| 7 | campus_branch | VARCHAR | 20 chars | Default: 'Kherva' | Applicable campus |
| 8 | is_active | BOOLEAN | 1 bit | Default: TRUE | Whether break slot is active |
| 9 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |

---

## 12. Table: `day_types`
**Description:** Types of working days (Weekday, Saturday, Holiday).

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | day_type_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier |
| 2 | day_type | VARCHAR | 20 chars | UNIQUE, NOT NULL | weekday/saturday/sunday/holiday |
| 3 | name | VARCHAR | 50 chars | NOT NULL | Display name |
| 4 | has_full_day | BOOLEAN | 1 bit | Default: TRUE | Whether full day schedule applies |
| 5 | campus_branch | VARCHAR | 20 chars | Default: 'Kherva' | Applicable campus |
| 6 | is_active | BOOLEAN | 1 bit | Default: TRUE | Whether day type is active |

---

## 13. Table: `time_slots`
**Description:** Individual lecture time slots within a day.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | slot_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for each slot |
| 2 | name | VARCHAR | 30 chars | NOT NULL | Slot label (e.g. Slot 1) |
| 3 | slot_order | INTEGER | 4 bytes | Default: 0 | Order in the day (1, 2, 3...) |
| 4 | start_time | TIME | 3 bytes | NOT NULL | Slot start time |
| 5 | end_time | TIME | 3 bytes | NOT NULL | Slot end time |
| 6 | duration_minutes | INTEGER | 4 bytes | Default: 60 | Duration in minutes |
| 7 | is_break | BOOLEAN | 1 bit | Default: FALSE | Whether this slot is a break |
| 8 | break_type | VARCHAR | 20 chars | Default: 'None' | None/Tea/Lunch/Prayer |
| 9 | shift_id | UUID | 36 chars | FK → shifts, SET NULL, NULL | Associated shift |
| 10 | day_type_id | UUID | 36 chars | FK → day_types, SET NULL, NULL | Applicable day type |
| 11 | campus_branch | VARCHAR | 20 chars | Default: 'Kherva' | Applicable campus |
| 12 | is_active | BOOLEAN | 1 bit | Default: TRUE | Whether slot is active |

---

## 14. Table: `timetable_slots`
**Description:** Actual scheduled class entries for each course/semester.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | slot_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for timetable entry |
| 2 | course_id | UUID | 36 chars | FK → courses, CASCADE | Course for this timetable entry |
| 3 | semester | INTEGER | 4 bytes | NOT NULL | Semester number |
| 4 | day_of_week | VARCHAR | 10 chars | NOT NULL | Monday to Saturday |
| 5 | time_slot_id | UUID | 36 chars | FK → time_slots, SET NULL, NULL | Associated time slot |
| 6 | start_time | TIME | 3 bytes | NOT NULL | Class start time |
| 7 | end_time | TIME | 3 bytes | NOT NULL | Class end time |
| 8 | subject_id | UUID | 36 chars | FK → subjects, CASCADE | Subject being taught |
| 9 | faculty_id | UUID | 36 chars | FK → faculty, CASCADE | Faculty conducting class |
| 10 | room_id | UUID | 36 chars | FK → rooms, SET NULL, NULL | Room assigned |
| 11 | room_name | VARCHAR | 50 chars | NULL | Room name (text fallback) |
| 12 | section | VARCHAR | 10 chars | Default: 'A' | Section identifier |
| 13 | slot_type | VARCHAR | 20 chars | Default: 'Theory' | Theory/Practical/Tutorial/Lab |
| 14 | is_locked | BOOLEAN | 1 bit | Default: FALSE | Prevent auto-regeneration |
| 15 | is_auto_generated | BOOLEAN | 1 bit | Default: FALSE | Whether AI generated this slot |
| 16 | generated_by | VARCHAR | 20 chars | Default: 'manual' | manual or ai |
| 17 | priority | INTEGER | 4 bytes | Default: 5 | Scheduling priority (1=highest) |
| 18 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |
| 19 | updated_at | DATETIME | 8 bytes | NOT NULL, Auto | Last update timestamp |

---

## 15. Table: `timetable_templates`
**Description:** Reusable timetable patterns for recurring schedules.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | template_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for template |
| 2 | name | VARCHAR | 100 chars | NOT NULL | Template name |
| 3 | course_id | UUID | 36 chars | FK → courses, CASCADE | Course this template is for |
| 4 | semester | INTEGER | 4 bytes | NOT NULL | Semester this template applies to |
| 5 | campus_branch | VARCHAR | 20 chars | Default: 'Kherva' | Applicable campus |
| 6 | is_active | BOOLEAN | 1 bit | Default: TRUE | Whether template is currently in use |
| 7 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |

---

## 16. Table: `timetable_schedules`
**Description:** Published monthly or custom schedules generated from templates.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | schedule_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for schedule |
| 2 | name | VARCHAR | 100 chars | NOT NULL | Schedule name |
| 3 | template_id | UUID | 36 chars | FK → timetable_templates, SET NULL, NULL | Source template |
| 4 | academic_term_id | UUID | 36 chars | FK → academic_terms, SET NULL, NULL | Linked academic term |
| 5 | start_date | DATE | 3 bytes | NOT NULL | Schedule start date |
| 6 | end_date | DATE | 3 bytes | NOT NULL | Schedule end date |
| 7 | is_active | BOOLEAN | 1 bit | Default: FALSE | Whether schedule is currently active |
| 8 | is_published | BOOLEAN | 1 bit | Default: FALSE | Whether schedule is visible to students |
| 9 | generated_by | VARCHAR | 20 chars | Default: 'manual' | manual or ai |
| 10 | generation_log | TEXT | Variable | NULL | Log of generation process |
| 11 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |
| 12 | updated_at | DATETIME | 8 bytes | NOT NULL, Auto | Last update timestamp |

---

## 17. Table: `faculty_availability`
**Description:** Per-faculty availability for each day of the week.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | availability_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier |
| 2 | faculty_id | UUID | 36 chars | FK → faculty, CASCADE | Faculty member |
| 3 | day_of_week | VARCHAR | 10 chars | NOT NULL | Monday to Saturday |
| 4 | is_available | BOOLEAN | 1 bit | Default: TRUE | Whether faculty is available that day |
| 5 | preferred_slots | JSON | Variable | Default: [] | List of preferred time slot IDs |
| 6 | not_available_slots | JSON | Variable | Default: [] | List of unavailable time slot IDs |
| 7 | campus_branch | VARCHAR | 20 chars | Default: 'Kherva' | Applicable campus |

*Unique constraint on (faculty_id, day_of_week)*

---

## 18. Table: `timetable_conflicts`
**Description:** Detected scheduling conflicts between timetable slots.

| S.No | Field Name | Data Type | Size | Constraint | Description |
|------|-----------|-----------|------|------------|-------------|
| 1 | conflict_id | UUID | 36 chars | PK, NOT NULL, Default: uuid4 | Unique identifier for conflict |
| 2 | conflict_type | VARCHAR | 20 chars | NOT NULL | Room/Faculty/Student/Time conflict |
| 3 | slot_1_id | UUID | 36 chars | FK → timetable_slots, CASCADE, NULL | First conflicting slot |
| 4 | slot_2_id | UUID | 36 chars | FK → timetable_slots, CASCADE, NULL | Second conflicting slot |
| 5 | description | TEXT | Variable | NOT NULL | Description of the conflict |
| 6 | is_resolved | BOOLEAN | 1 bit | Default: FALSE | Whether conflict is resolved |
| 7 | resolution | TEXT | Variable | NULL | Description of resolution applied |
| 8 | resolved_by_id | UUID | 36 chars | FK → users, SET NULL, NULL | User who resolved the conflict |
| 9 | created_at | DATETIME | 8 bytes | NOT NULL, Auto | Record creation timestamp |
