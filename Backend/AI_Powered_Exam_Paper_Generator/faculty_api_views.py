"""
Faculty API Views for Exam Paper Generation
These endpoints are called by the React frontend (JWT authenticated).
No Django session required — they work with CORS + JSON.
"""
import json
from datetime import datetime
from django.http import JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .apps import ExamPaperConfig
from .utils import get_ranked_questions, pick_questions, create_pdf
from .models import GeneratedPaper

# ──────────────────────────────────────────────────────────────────
# Course → subjects mapping (covers all courses the faculty portal
# exposes: BCA, MCA, BSC-IT, BSC-IMS, BSC-CYBER, BSC-AIML,
# MSC-IT, MSC-IMS, MSC-CYBER, MSC-AIML, BTECH-IT, BTECH-CSE)
# ──────────────────────────────────────────────────────────────────
COURSE_SUBJECTS = {
    "BCA": {
        1: {"BCA101": "Fundamentals of Computer", "BCA102": "Programming in C", "BCA103": "Mathematics I", "BCA104": "Communication Skills"},
        2: {"BCA201": "Data Structures", "BCA202": "OOP with C++", "BCA203": "Mathematics II", "BCA204": "Database Management"},
        3: {"BCA301": "Operating Systems", "BCA302": "Java Programming", "BCA303": "Computer Networks", "BCA304": "Web Technology"},
        4: {"BCA401": "Python Programming", "BCA402": "Computer Graphics", "BCA403": "Software Engineering", "BCA404": "Cloud Computing"},
        5: {"BCA501": "Artificial Intelligence", "BCA502": "Mobile App Development", "BCA503": "Information Security", "BCA504": "IoT"},
        6: {"BCA601": "Machine Learning", "BCA602": "Big Data Analytics", "BCA603": "Project Work", "BCA604": "Entrepreneurship"},
    },
    "MCA": {
        1: {"MCA101": "Discrete Mathematics", "MCA102": "C Programming", "MCA103": "Information Technology", "MCA104": "Business Communication"},
        2: {"MCA201": "Data Structures & Algorithms", "MCA202": "OOP with Java", "MCA203": "Database Systems", "MCA204": "OS Concepts"},
        3: {"MCA301": "Computer Networks", "MCA302": "Web Technologies", "MCA303": "Software Engineering", "MCA304": "Python Programming"},
        4: {"MCA401": "Machine Learning", "MCA402": "Cloud Computing", "MCA403": "Mobile Computing", "MCA404": "Information Security"},
    },
    "BSC-IT": {
        1: {"BIT101": "Fundamentals of IT", "BIT102": "Programming in C", "BIT103": "Digital Electronics", "BIT104": "Mathematics"},
        2: {"BIT201": "Data Structures", "BIT202": "OOP Concepts", "BIT203": "Database Management", "BIT204": "Web Design"},
        3: {"BIT301": "Computer Networks", "BIT302": "Operating Systems", "BIT303": "Java Programming", "BIT304": "Python Basics"},
        4: {"BIT401": "Cloud Computing", "BIT402": "Software Testing", "BIT403": "Android Development", "BIT404": "Big Data"},
        5: {"BIT501": "Machine Learning", "BIT502": "Cybersecurity", "BIT503": "IoT", "BIT504": "Data Analytics"},
        6: {"BIT601": "Artificial Intelligence", "BIT602": "Project Management", "BIT603": "Blockchain", "BIT604": "Final Project"},
    },
    "BSC-IMS": {
        1: {"IMS101": "Fundamentals of IMS", "IMS102": "Programming Basics", "IMS103": "Mathematics", "IMS104": "Communication"},
        2: {"IMS201": "Database Systems", "IMS202": "Business Applications", "IMS203": "Web Technologies", "IMS204": "Statistics"},
        3: {"IMS301": "ERP Systems", "IMS302": "Information Systems Design", "IMS303": "Networking", "IMS304": "Python"},
        4: {"IMS401": "Business Intelligence", "IMS402": "Cloud Services", "IMS403": "Data Mining", "IMS404": "Project"},
    },
    "BSC-CYBER": {
        1: {"CYB101": "Introduction to Cybersecurity", "CYB102": "Networking Fundamentals", "CYB103": "Operating Systems", "CYB104": "Programming in C"},
        2: {"CYB201": "Ethical Hacking", "CYB202": "Cryptography", "CYB203": "Linux Administration", "CYB204": "Python for Security"},
        3: {"CYB301": "Web Application Security", "CYB302": "Penetration Testing", "CYB303": "Digital Forensics", "CYB304": "Malware Analysis"},
        4: {"CYB401": "Network Security", "CYB402": "Cloud Security", "CYB403": "Incident Response", "CYB404": "Security Compliance"},
        5: {"CYB501": "Advanced Penetration Testing", "CYB502": "Threat Intelligence", "CYB503": "IoT Security", "CYB504": "Project"},
        6: {"CYB601": "Zero-Day Research", "CYB602": "Industry Internship", "CYB603": "Capstone Project", "CYB604": "Entrepreneurship"},
    },
    "BSC-AIML": {
        1: {"AML101": "Mathematics for AI", "AML102": "Programming in Python", "AML103": "Statistics", "AML104": "Introduction to AI"},
        2: {"AML201": "Data Structures", "AML202": "Machine Learning Basics", "AML203": "Linear Algebra", "AML204": "Probability"},
        3: {"AML301": "Deep Learning", "AML302": "Computer Vision", "AML303": "Natural Language Processing", "AML304": "Big Data"},
        4: {"AML401": "Reinforcement Learning", "AML402": "MLOps", "AML403": "AI Ethics", "AML404": "Project"},
    },
    "MSC-IT": {
        1: {"MIT101": "Advanced Algorithms", "MIT102": "Research Methodology", "MIT103": "Enterprise Computing", "MIT104": "Advanced Databases"},
        2: {"MIT201": "Cloud Architecture", "MIT202": "Machine Learning", "MIT203": "Information Security", "MIT204": "Distributed Systems"},
    },
    "MSC-IMS": {
        1: {"MIM101": "Information Systems Strategy", "MIM102": "Enterprise Architecture", "MIM103": "Business Analytics", "MIM104": "Digital Transformation"},
        2: {"MIM201": "ERP & SCM", "MIM202": "Data Warehousing", "MIM203": "Knowledge Management", "MIM204": "Project"},
    },
    "MSC-CYBER": {
        1: {"MCY101": "Advanced Cybersecurity", "MCY102": "Research Methods", "MCY103": "Advanced Cryptography", "MCY104": "Threat Modeling"},
        2: {"MCY201": "Advanced Forensics", "MCY202": "Zero Trust Security", "MCY203": "Compliance & Governance", "MCY204": "Research Project"},
    },
    "MSC-AIML": {
        1: {"MAI101": "Advanced Machine Learning", "MAI102": "Deep Learning Architectures", "MAI103": "Research Methodology", "MAI104": "Big Data Analytics"},
        2: {"MAI201": "Generative AI", "MAI202": "AI in Healthcare", "MAI203": "Autonomous Systems", "MAI204": "Research Thesis"},
    },
    "BTECH-IT": {
        1: {"BTI101": "Engineering Mathematics I", "BTI102": "Programming in C", "BTI103": "Physics", "BTI104": "Engineering Drawing"},
        2: {"BTI201": "Mathematics II", "BTI202": "Data Structures", "BTI203": "Digital Logic Design", "BTI204": "OOP"},
        3: {"BTI301": "Computer Architecture", "BTI302": "Operating Systems", "BTI303": "Database Systems", "BTI304": "Computer Networks"},
        4: {"BTI401": "Software Engineering", "BTI402": "Web Development", "BTI403": "Theory of Computation", "BTI404": "Compiler Design"},
        5: {"BTI501": "Machine Learning", "BTI502": "Cloud Computing", "BTI503": "Information Security", "BTI504": "IoT"},
        6: {"BTI601": "Deep Learning", "BTI602": "Big Data", "BTI603": "Mobile App Dev", "BTI604": "Elective I"},
        7: {"BTI701": "Artificial Intelligence", "BTI702": "DevOps", "BTI703": "Blockchain", "BTI704": "Elective II"},
        8: {"BTI801": "Industry Internship", "BTI802": "Final Year Project", "BTI803": "Professional Ethics", "BTI804": "Entrepreneurship"},
    },
    "BTECH-CSE": {
        1: {"BCS101": "Engineering Mathematics I", "BCS102": "Programming in C", "BCS103": "Physics", "BCS104": "Engineering Drawing"},
        2: {"BCS201": "Mathematics II", "BCS202": "Data Structures", "BCS203": "Digital Electronics", "BCS204": "OOP with C++"},
        3: {"BCS301": "Computer Architecture", "BCS302": "Discrete Mathematics", "BCS303": "Operating Systems", "BCS304": "Database Systems"},
        4: {"BCS401": "Algorithms", "BCS402": "Computer Networks", "BCS403": "Theory of Computation", "BCS404": "Software Engineering"},
        5: {"BCS501": "Machine Learning", "BCS502": "Compiler Design", "BCS503": "Artificial Intelligence", "BCS504": "Elective I"},
        6: {"BCS601": "Deep Learning", "BCS602": "Distributed Systems", "BCS603": "Information Security", "BCS604": "Elective II"},
        7: {"BCS701": "Cloud Computing", "BCS702": "IoT", "BCS703": "Blockchain", "BCS704": "Elective III"},
        8: {"BCS801": "Industry Internship", "BCS802": "Final Year Project", "BCS803": "Professional Ethics", "BCS804": "Entrepreneurship"},
    },
}

# Generic question bank used when specific subject data is unavailable
GENERIC_QUESTION_BANK = [
    "Explain the fundamental concepts and principles of {subject}.",
    "Describe the architecture and key components of {subject}.",
    "What are the major applications and use-cases of {subject}? Explain with examples.",
    "Compare and contrast the different approaches used in {subject}.",
    "Write detailed notes on the advantages and limitations of {subject}.",
    "Illustrate with a diagram: important aspects of {subject}.",
    "Discuss the recent trends and future prospects of {subject}.",
    "Explain a practical real-world scenario involving {subject}.",
    "Critically analyze the role of {subject} in modern industry.",
    "Define and explain important terminologies used in {subject}.",
    "Describe the historical evolution and development of {subject}.",
    "Solve a problem-based scenario related to {subject} and justify your approach.",
]

EXAM_TYPE_CONFIG = {
    "external": {"total_marks": 70, "time": "3 Hours", "label": "External"},
    "internal": {"total_marks": 30, "time": "1.5 Hours", "label": "Internal"},
    "mid-term": {"total_marks": 50, "time": "2 Hours", "label": "Mid-Term"},
    "end-term": {"total_marks": 100, "time": "3 Hours", "label": "End-Term"},
    "unit-test": {"total_marks": 20, "time": "1 Hour", "label": "Unit Test"},
}

DIFFICULTY_WEIGHTS = {
    "Easy":   {"desc": 0.5, "app": 0.3, "anal": 0.2},
    "Medium": {"desc": 0.35, "app": 0.35, "anal": 0.3},
    "Hard":   {"desc": 0.2, "app": 0.4, "anal": 0.4},
    "Mixed":  {"desc": 0.33, "app": 0.34, "anal": 0.33},
}


def _get_subjects_for_course_semester(course: str, semester: int) -> dict:
    """Return {code: name} dict. First tries ML model data, then static COURSE_SUBJECTS."""
    # Try ML model data (BCA only for now)
    sem_subjects = ExamPaperConfig.sem_subjects
    if sem_subjects:
        # ML model is BCA-specific; only use it if course is BCA
        if course.upper() == "BCA" and str(semester) in sem_subjects:
            return sem_subjects[str(semester)]
        if course.upper() == "BCA" and semester in sem_subjects:
            return sem_subjects[semester]

    # Fallback to static COURSE_SUBJECTS mapping
    course_data = COURSE_SUBJECTS.get(course.upper(), {})
    return course_data.get(semester, {})


def _build_questions_for_subject(course: str, semester: int, subject_code: str,
                                  subject_name: str, num_q: int) -> list:
    """Build question list — tries ML clusters first, falls back to generic bank."""
    # Try ML model questions (BCA)
    if course.upper() == "BCA":
        ranked, _ = get_ranked_questions(semester, subject_code)
        if ranked:
            used = set()
            return pick_questions(ranked, num_q, used)

    # Generic fallback
    import random
    questions = []
    bank = GENERIC_QUESTION_BANK[:]
    random.shuffle(bank)
    for i in range(min(num_q, len(bank))):
        questions.append({
            "question": bank[i].format(subject=subject_name),
            "repeat": 1,
            "years": [],
            "importance": "MEDIUM",
        })
    # If not enough, cycle
    while len(questions) < num_q:
        idx = len(questions) % len(bank)
        questions.append({
            "question": GENERIC_QUESTION_BANK[idx].format(subject=subject_name),
            "repeat": 1,
            "years": [],
            "importance": "NORMAL",
        })
    return questions[:num_q]


# ──────────────────────────────────────────────────────────────────
# API Endpoint 1: GET /api/faculty/exam-paper/subjects/
# Query params: course=BCA&semester=1
# ──────────────────────────────────────────────────────────────────
@csrf_exempt
def api_get_subjects(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET required"}, status=405)

    course = request.GET.get("course", "").strip().upper()
    semester_raw = request.GET.get("semester", "").strip()

    if not course:
        return JsonResponse({"error": "course parameter is required"}, status=400)

    # If no semester specified, return all semesters for that course
    if not semester_raw:
        course_data = COURSE_SUBJECTS.get(course, {})
        semesters = sorted(course_data.keys())
        return JsonResponse({"semesters": semesters, "subjects": {}})

    try:
        semester = int(semester_raw)
    except ValueError:
        return JsonResponse({"error": "semester must be an integer"}, status=400)

    subjects = _get_subjects_for_course_semester(course, semester)
    result = [{"code": code, "name": name} for code, name in subjects.items()]
    return JsonResponse({"subjects": result})


# ──────────────────────────────────────────────────────────────────
# API Endpoint 2: GET /api/faculty/exam-paper/semesters/
# Query params: course=BCA
# ──────────────────────────────────────────────────────────────────
@csrf_exempt
def api_get_semesters(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET required"}, status=405)

    course = request.GET.get("course", "").strip().upper()
    if not course:
        return JsonResponse({"error": "course parameter is required"}, status=400)

    course_data = COURSE_SUBJECTS.get(course, {})
    semesters = sorted(course_data.keys()) if course_data else []
    return JsonResponse({"semesters": semesters})


# ──────────────────────────────────────────────────────────────────
# API Endpoint 3: POST /api/faculty/exam-paper/generate/
# Body: {course, semester, subject_code, subject_name, exam_type,
#        difficulty, num_questions, university, custom_instructions}
# ──────────────────────────────────────────────────────────────────
@csrf_exempt
def api_generate_paper(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    course        = data.get("course", "BCA").strip().upper()
    semester_raw  = data.get("semester", 1)
    subject_code  = data.get("subject_code", "").strip()
    subject_name  = data.get("subject_name", subject_code).strip()
    exam_type_key = data.get("exam_type", "external").lower().strip()
    difficulty    = data.get("difficulty", "Mixed").strip()
    university    = data.get("university", "Ganpat University").strip()
    num_q         = int(data.get("num_questions", 10))

    if not subject_code:
        return JsonResponse({"error": "subject_code is required"}, status=400)

    try:
        semester = int(semester_raw)
    except (ValueError, TypeError):
        return JsonResponse({"error": "semester must be an integer"}, status=400)

    exam_cfg = EXAM_TYPE_CONFIG.get(exam_type_key, EXAM_TYPE_CONFIG["external"])

    # Build questions
    all_questions = _build_questions_for_subject(
        course, semester, subject_code, subject_name, max(num_q, 20)
    )

    used = set()
    used_q_set = set()

    def pick_n(n):
        picked = []
        for q in all_questions:
            if len(picked) >= n:
                break
            key = q["question"].lower().strip()
            if key not in used_q_set:
                picked.append(q)
                used_q_set.add(key)
        # Fallback if not enough unique
        while len(picked) < n:
            idx = len(picked) % len(all_questions)
            picked.append(all_questions[idx])
        return picked[:n]

    # Build paper structure based on exam type
    paper = {
        "course": course,
        "semester": semester,
        "subject_code": subject_code,
        "subject_name": subject_name,
        "exam_type": exam_cfg["label"],
        "exam_type_key": exam_type_key,
        "total_marks": exam_cfg["total_marks"],
        "time": exam_cfg["time"],
        "difficulty": difficulty,
        "university": university,
        "generated_at": datetime.now().strftime("%d %B %Y, %I:%M %p"),
    }

    if exam_type_key in ("external", "end-term"):
        paper["section1"] = pick_n(9)
        paper["q2a"]      = pick_n(2)
        paper["q2b"]      = pick_n(2)
        paper["q3"]       = pick_n(2)
        paper["q4"]       = pick_n(3)
        paper["q5"]       = pick_n(2)
    elif exam_type_key in ("internal", "unit-test"):
        paper["section1"] = pick_n(9)
    elif exam_type_key == "mid-term":
        paper["section1"] = pick_n(9)
        paper["q2a"]      = pick_n(2)
        paper["q2b"]      = pick_n(2)
    else:
        paper["section1"] = pick_n(9)

    # PERSISTENCE: Save to database immediately
    try:
        GeneratedPaper.objects.create(
            semester=semester,
            subject_code=subject_code,
            subject_name=subject_name,
            exam_type=exam_cfg["label"],
            total_marks=exam_cfg["total_marks"],
            paper_data=paper
        )
    except Exception as e:
        print(f"Failed to save generated paper to DB: {e}")

    return JsonResponse({"success": True, "paper": paper})


# ──────────────────────────────────────────────────────────────────
# API Endpoint 4: GET /api/faculty/exam-paper/list/
# ──────────────────────────────────────────────────────────────────
@csrf_exempt
def api_get_papers(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET required"}, status=405)

    papers = GeneratedPaper.objects.all().order_by("-created_at")
    result = []
    for p in papers:
        result.append({
            "id": p.id,
            "semester": p.semester,
            "subject_code": p.subject_code,
            "subject_name": p.subject_name,
            "exam_type": p.exam_type,
            "total_marks": p.total_marks,
            "paper_data": p.paper_data,
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })
    return JsonResponse({"success": True, "papers": result})


# ──────────────────────────────────────────────────────────────────
# API Endpoint 4: POST /api/faculty/exam-paper/download-pdf/
# Body: paper JSON (same as returned by generate)
# ──────────────────────────────────────────────────────────────────
@csrf_exempt
def api_download_pdf(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        paper = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    if not paper:
        return JsonResponse({"error": "No paper data provided"}, status=400)

    buf = create_pdf(paper)

    # Save to history
    try:
        GeneratedPaper.objects.create(
            semester=paper.get("semester", 0),
            subject_code=paper.get("subject_code", ""),
            subject_name=paper.get("subject_name", ""),
            exam_type=paper.get("exam_type", ""),
            total_marks=paper.get("total_marks", 0),
            paper_data=paper,
        )
    except Exception:
        pass  # Don't fail PDF download if DB save fails

    course = paper.get("course", "GUNI")
    scode  = paper.get("subject_code", "paper").replace(" ", "_")
    etype  = paper.get("exam_type", "exam").replace(" ", "_")
    sem    = paper.get("semester", "")
    fname  = f"{course}_Sem{sem}_{scode}_{etype}_{datetime.now().strftime('%Y%m%d')}.pdf"

    return FileResponse(buf, as_attachment=True, filename=fname, content_type="application/pdf")


# ──────────────────────────────────────────────────────────────────
# API Endpoint 6: DELETE /api/faculty/exam-paper/delete/<id>/
# ──────────────────────────────────────────────────────────────────
@csrf_exempt
def api_delete_paper(request, paper_id):
    if request.method != "DELETE":
        return JsonResponse({"error": "DELETE required"}, status=405)

    try:
        paper = GeneratedPaper.objects.get(id=paper_id)
        paper.delete()
        return JsonResponse({"success": True, "message": "Paper deleted"})
    except GeneratedPaper.DoesNotExist:
        return JsonResponse({"error": "Paper not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
