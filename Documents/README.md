# GUNI Academic Portal (AMPICS)

A unified digital platform for academic management, featuring automated tools for exam generation and student career guidance.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + Vite 7
- **Styling:** TailwindCSS 4
- **Icons:** Lucide React
- **Routing:** React Router DOM 7
- **APIs:** Axios, React Hook Form

### Backend
- **Core:** Django 4.2.7
- **Framework:** Django REST Framework
- **Tasks:** Celery + Redis
- **PDF Generation:** ReportLab, FPDF2, PyPDF2
- **Data:** Pandas, OpenPyXL

---

## 📂 Project Structure

```text
Academic-module/
├── Backend/                 # Django Application
│   ├── academics/           # Program & Curriculum Management
│   ├── ai_career/           # Career Guidance Module
│   ├── AI_Powered_Exam_Paper_Generator/ # Exam Generation Engine (ML-based)
│   ├── attendance/          # Attendance Tracking System
│   ├── users/               # Auth & Role Management (Admin, Faculty, Student)
│   └── ampics/              # Core Settings
├── frontend/                # React Application
│   ├── src/                 # Source Code
│   │   ├── pages/admin/     # Admin Dashboards
│   │   ├── pages/student/   # Student Portal
│   │   └── pages/faculty/   # Faculty Tools
│   └── vite.config.js       # Vite Configuration
└── START_ALL_SERVICES.bat   # Startup Script
```

---

## ✨ Available Modules (Current)

### 1. AI Exam Paper Generator
- **ML Question Ranking:** Uses a trained model (`exam_paper_model.pkl`) to rank questions based on importance (BCA specific).
- **Automated Generation:** Generates full exam papers (External, Internal, Mid-term) with subject-specific mapping.
- **PDF Export:** Instant generation of exam papers in professional PDF format.

### 2. AI Career Guidance
- **Resume Analyzer:** Predicts "Job Fit" by analyzing resume text against job descriptions.
- **Skill Assessment:** Interactive quizzes for Python and JavaScript to evaluate student proficiency.
- **Career Recommendations:** Generates path suggestions based on student interests and skills.

### 3. Attendance Management
- **QR Attendance:** Real-time QR-based attendance tracking for students.
- **Manual Overrides:** Faculty-controlled attendance marking and verification.

### 4. Admin Management (HR & Curriculum)
- **Student Metrics:** Deep tracking of student profiles, guardian info, and academic targets.
- **Faculty HR:** Onboarding system with credential verification and leave logs.
- **Curriculum Matrix:** Defining programs, credit systems, and syllabus trees.
- **Academic Cycle:** Management of terms, holidays, and system-wide suspensions.

### 5. Notification System
- Targeted broadcasts for specific departments or student groups.
- Priority-based alerts with delivery channel logs.

---

## 🚦 How to Run

1. **Quick Start:** Run `.\START_ALL_SERVICES.bat` from the root directory.
2. **Backend:** Navigate to `/Backend`, activate venv, and run `python manage.py runserver`.
3. **Frontend:** Navigate to `/frontend` and run `npm run dev`.

---

**Note:** Only currently implemented features and AI models are listed above.
