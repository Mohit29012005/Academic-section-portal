# AMPICS Academic Portal - Student Data Generation Report
## Generated: April 10, 2026

---

## Summary

**Total Students Generated:** 720
**Courses:** 12
**Students per Course:** 60
**Batch:** 2026 (March Admission)
**Roll Number Format:** `260324{CC}{001-060}`

---

## Course Codes

| Code | Course | Department | Duration | Semesters |
|------|--------|------------|----------|-----------|
| 30 | BCA | AMPICS | 3 years | 6 |
| 31 | BSC-IT | DCS | 3 years | 6 |
| 32 | BSC-IMS | DCS | 3 years | 6 |
| 33 | BSC-CYBER | DCS | 3 years | 6 |
| 34 | MCA | AMPICS | 2 years | 4 |
| 35 | MSC-IT | DCS | 2 years | 4 |
| 36 | MSC-IMS | DCS | 2 years | 4 |
| 37 | MSC-CYBER | DCS | 2 years | 4 |
| 38 | MSC-AIML | DCS | 2 years | 4 |
| 39 | BTECH-IT | Engineering | 4 years | 8 |
| 40 | BTECH-CSE | Engineering | 4 years | 8 |

---

## Roll Number Format

**Format:** `{Year}{Month}{CollegeCode}{CourseCode}{Sequence}`

**Example:** `26032430001`

- `26` = Year (2026)
- `03` = Month (March)
- `24` = College Code (Ganpat University)
- `30` = Course Code (BCA)
- `001` = Sequence Number (001-060)

---

## Student ID Format

**Format:** `{rollnumber}@gnu.ac.in`

**Example:** `26032430001@gnu.ac.in`

---

## Student Details

| Field | Description |
|-------|-------------|
| Roll Number | Unique identifier (auto-generated) |
| Student ID | Email format: `{rollno}@gnu.ac.in` |
| Name | Indian names (First + Last) |
| Course | From 12 available courses |
| Email | Same as Student ID |
| Phone | Indian mobile format (98765XXXXX) |
| Password | Default: `student123` |
| Semester | Current: 1 |
| Status | Active |

---

## Batch Distribution

Each course has 60 students divided into:
- **Batch A:** Students 001-030 (30 students)
- **Batch B:** Students 031-060 (30 students)

*Note: Batch information stored in student profile (to be added in future)*

---

## Sample Students by Course

### BCA (Course Code: 30)
```
26032430001 | Kapil Menon      | kapil.menon@gnu.ac.in
26032430002 | Vikram Pande     | vikram.pande@gnu.ac.in
26032430003 | Ramesh Kaveti    | ramesh.kaveti@gnu.ac.in
...
26032430030 | Sunita Iyer      | sunita.iyer@gnu.ac.in    (Batch A)
26032430031 | Siddharth Mannem  | siddharth.mannem@gnu.ac.in (Batch B)
...
26032430060 | (Batch B Student)
```

### MCA (Course Code: 34)
```
26032434001 | Varun Mehta      | varun.mehta@gnu.ac.in
26032434002 | Kavita Singh     | kavita.singh@gnu.ac.in
...
```

---

## Name Generation

### Indian First Names Used
- Male: Rahul, Amit, Vikram, Suresh, Rajesh, Arjun, Karan, etc.
- Female: Priya, Neha, Sneha, Anjali, Divya, Pooja, Kavita, etc.
- Mix of traditional and modern Indian names

### Indian Last Names Used
- North Indian: Kumar, Sharma, Patel, Singh, Verma, Gupta, etc.
- South Indian: Nair, Menon, Iyer, Krishnan, Rao, Reddy, etc.
- Gujarati: Shah, Mehta, Patel, Desai, Choudhary, etc.

### Locations
- All students from Gujarat
- Cities: Ahmedabad, Surat, Vadodara, Rajkot, Gandhinagar, etc.
- Addresses generated with valid Gujarat locations

---

## Database Information

**Database:** PostgreSQL
**Host:** localhost:5432
**Database Name:** ampics_db
**User:** postgres

### Table Structure
```sql
Table: students
- student_id (UUID, PK)
- user_id (FK to users)
- enrollment_no (VARCHAR, UNIQUE) - Roll Number
- name (VARCHAR)
- email (VARCHAR)
- phone (VARCHAR)
- course_id (FK to academics.course)
- semester (INT)
- current_semester (INT)
- total_semesters (INT)
- cgpa (DECIMAL)
- status (VARCHAR)
- created_at (DATETIME)
- updated_at (DATETIME)

Table: users
- user_id (UUID, PK)
- email (VARCHAR, UNIQUE) - Student ID
- password (HASHED)
- role (VARCHAR)
- is_active (BOOLEAN)
- created_at (DATETIME)
```

---

## Login Credentials

### Student Login
**Email:** `{rollno}@gnu.ac.in`
**Password:** `student123`

### Example:
```
Email: 26032430001@gnu.ac.in
Password: student123
```

---

## CSV Export

**File:** `student_data_2026.csv`
**Location:** `C:\Academic-module\student_data_2026.csv`
**Records:** 717 students (2026 batch)

### CSV Columns:
1. Roll Number
2. Student ID
3. Name
4. Course
5. Email
6. Phone
7. Password

---

## Management Commands

### Generate Students
```bash
cd backend
python manage.py generate_indian_students
```

### Balance Students (ensure 60 per course)
```bash
cd backend
python manage.py balance_students
```

---

## Department Information

### AMPICS
**Full Form:** Acharya Motibhai Patel Institute of Computer Studies
**Courses:** BCA, MCA

### DCS
**Full Form:** Department of Computer Science
**Courses:** BSC-IT, BSC-IMS, BSC-CYBER, MSC-IT, MSC-IMS, MSC-CYBER, MSC-AIML

### Engineering
**Courses:** BTECH-IT, BTECH-CSE

---

## Next Steps

1. [ ] Add batch field (A/B) to Student model
2. [ ] Add date_of_birth, gender, father_name, address fields
3. [ ] Create semester-wise student distribution
4. [ ] Generate subject enrollments
5. [ ] Create class schedules
6. [ ] Setup attendance records

---

## Statistics

| Metric | Value |
|--------|-------|
| Total Students | 720 |
| Courses | 12 |
| Students per Course | 60 |
| Male Students | ~360 (50%) |
| Female Students | ~360 (50%) |
| Total Users | 736 (720 students + 16 existing) |
| Data Size | ~2.5 MB |

---

## Verification

To verify student data:
```bash
cd backend
python manage.py shell
```

```python
from users.models import Student
print(Student.objects.count())  # Should show: 720

# Check by course
from academics.models import Course
for course in Course.objects.all():
    print(f"{course.code}: {Student.objects.filter(course=course).count()}")
```

---

## Contact Information

**University:** Ganpat University
**Institute:** AMPICS / DCS / Engineering
**Location:** Mehsana, Gujarat
**Database:** PostgreSQL on localhost

---

**Report Generated:** April 10, 2026
**Generated By:** Django Management Command
**Status:** COMPLETE
