# 📊 GUNI Academic Portal (AMPICS) — Full Project Information

> **Status:** Active Development | **Version:** 1.0.0  
> **Target:** Ganpat University, AMPICS (Academic Management Platform for Intelligent Campus Solutions)

---

## 📂 1. Project Overview
The **GUNI Academic Portal** is a high-end, unified digital ecosystem designed for academic administration, faculty empowerment, and student success. It leverages AI/ML to automate complex tasks such as exam paper generation, career guidance, and attendance tracking.

### Core Objectives:
- **Automation:** Reduce administrative overhead through AI-led scheduling and grading.
- **Intelligence:** Provide students with personalized career insights and job-fit analysis.
- **Efficiency:** Unified interface for QR/Face attendance and academic curriculum tracking.
- **Premium UX:** Modern, high-performance glassmorphic design system using React and TailwindCSS.

---

## 🏗️ 2. Project Structure
The workspace is split into core functional blocks:

```text
Academic-module/
├── Backend/                 # Django Rest Framework (DRF) Application
│   ├── academics/           # Core Logic: Courses, Subjects, Rooms, Timetables
│   ├── AI_Powered_..._Gen/  # ML Engine for Exam Papers
│   ├── ai_career/           # Career Path & Resume Analysis Logic
│   ├── attendance/          # QR & Session tracking
│   ├── attendance_ai/       # Face Recognition & Anomaly Detection
│   ├── users/               # Custom User Model (Multiple Roles: Admin, Faculty, Student)
│   ├── ampics/              # Project Configuration (Settings, URLs, WSGI/ASGI)
│   ├── media/               # Uploaded content (Face samples, PDFs, Profile pics)
│   ├── scripts/             # Data seeding and utility scripts
│   └── manage.py            # Django Entry Point
├── frontend/                # Vite + React + TailwindCSS Application
│   ├── src/
│   │   ├── components/      # Reusable UI (Layouts, Cards, Charts, Glassmorphism)
│   │   ├── pages/
│   │   │   ├── admin/       # Management Dashboards (HR, Course Config)
│   │   │   ├── student/     # Student Portal (Results, Career, Attendance)
│   │   │   └── faculty/     # Faculty Tools (Grading, Timetable, PYQs)
│   │   ├── App.jsx          # Route Definitions & Guard Logic
│   │   └── main.jsx         # React Entry Point
├── ML Model/                # Pre-trained models and Training Notebooks
│   ├── pyq_intelligent_model.pkl # Model for question ranking
│   └── Automatic_Timetable_Generator.ipynb
├── Documents/               # Presentation materials, SRS, and Technical Docs
└── START_ALL_SERVICES.bat   # Automated startup script
```

---

## 🛠️ 3. Technical Stack

### **Backend (Django 4.2.7)**
- **API Framework:** Django REST Framework (DRF)
- **Authentication:** Simple JWT (JSON Web Tokens)
- **Database:** PostgreSQL (Primary), Redis (Caching/Celery)
- **Asynchronous Tasks:** Celery (For PDF gen and ML processing)
- **Core Libraries:**
    - `torch`, `transformers`, `scikit-learn`: AI/ML processing
    - `opencv-python`, `face-recognition`, `deepface`: Face ID modules
    - `reportlab`, `fpdf2`: PDF generation engines
    - `pandas`, `openpyxl`: Academic data processing (Excel import/export)

### **Frontend (React 19 + Vite 7)**
- **State Management:** React Hooks
- **Styling:** TailwindCSS 4 (Utility-first, Glassmorphic effects)
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **Form Handling:** React Hook Form + Zod (Validation)
- **Routing:** React Router DOM 7

---

## 💎 4. Functional Modules

### 🔹 AI Exam Paper Generator
- **Logic:** Uses ML models (`pyq_intelligent_model.pkl`) trained on Past Year Questions (PYQs).
- **Features:** Predicts question importance, maps syllabus units, and generates professional PDFs for Internal/External exams.
- **Automation:** Reduces paper setting time from hours to seconds.

### 🔹 AI Attendance & Anomaly Detection
- **Multi-Modal:** Supports QR-code scanning and Face recognition.
- **Anomaly Detection:** AI identifies students with suspicious attendance patterns (e.g., proxys) and alerts faculty.
- **Real-time Tracking:** Live session logs for faculty.

### 🔹 Smart Timetable System
- **Automation:** Resolves conflicts between Room, Faculty, and Course constraints.
- **Shifts:** Manages Morning (UG) and Noon (PG) schedules independently.
- **Constraint Solver:** Handles faculty availability and room capacity.

### 🔹 AI Career Guidance
- **Resume Analyzer:** Cross-references student resumes with job descriptions to predict fit.
- **Skill Quizzes:** Interactive assessment for technical skills.
- **Path Recommendation:** Suggests career tracks based on Academic performance and Interests.

### 🔹 Academic Lifecycle Management
- **Curriculum Matrix:** Management of Credits, Syllabus, and Graduation requirements.
- **HR & Faculty Portal:** Handles profile management, teaching loads, and leave logs.
- **Academic Cycle:** Toggle system for Odd/Even semesters and holiday calendars.

---

## 📊 5. Database Schema Key Tables
Total Tables: 40+ (Managed via PostgreSQL)

| Table | Module | Description |
|-------|--------|-------------|
| `users` | Auth | Central Role-based Identity |
| `students` | Profile | Detailed Academic Record & Metrics |
| `faculty` | Profile | HR Info & Specializations |
| `timetable_slots` | Academic | Matrix of Subject + Faculty + Room |
| `semester_results` | Results | Aggregated Grades (SGPA/CGPA) |
| `exams` | Exam | Metadata for Question Papers |
| `generated_paper` | AI | Snapshot of ML-selected questions |

---

## 🚀 6. How to Run & Access

### **Full Startup**
1. Run `.\START_ALL_SERVICES.bat` in the root directory.

### **Manual Backend**
1. `cd Backend`
2. `python manage.py runserver 8000`

### **Manual Frontend**
1. `cd frontend`
2. `npm run dev`

### **Default Access**
- **Admin Panel:** `http://localhost:5173/admin`
- **Student Portal:** `http://localhost:5173/login`
- **Backend API:** `http://localhost:8000/api/`

---
## 📂 7. Key Files & Scripts Reference

### **Backend Core Scripts**
- `Backend/manage.py`: Django entry point.
- `Backend/build_ml_model.py`: Script to train/update the exam paper generator model.
- `Backend/extract_questions.py`: OCR-based question extraction from PDF PYQs.
- `Backend/map_questions.py`: Maps extracted questions to the curriculum.
- `Backend/database_tables_dictionary.md`: Detailed data dictionary for the entire database.

### **Frontend Core Pages**
- `frontend/src/App.jsx`: Master routing and auth guard configuration.
- `frontend/src/pages/admin/Dashboard.jsx`: Main admin overview with statistics.
- `frontend/src/pages/student/Dashboard.jsx`: Student-facing academic overview.
- `frontend/src/pages/faculty/AIAttendanceHub.jsx`: Real-time attendance management interface.

### **Data & Assets**
- `Students_&_Faculty_All_DATA/`: Contains seed data and CSVs for bulk imports.
- `PYQ_ALL_COURSES_DATA/`: Repository of PDF source files for question extraction.
- `ML Model/pyq_intelligent_model_v2.pkl`: The live trained model used by the production API.

---
> **End of Document**
