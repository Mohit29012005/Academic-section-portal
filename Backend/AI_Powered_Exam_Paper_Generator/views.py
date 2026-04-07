import json
from django.shortcuts import render
from django.http import JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from .apps import ExamPaperConfig
from .utils import get_ranked_questions, pick_questions, create_pdf
from .models import GeneratedPaper


def index(request):
    return render(request, 'exam_paper/index.html')


def get_semesters(request):
    sems = sorted([int(s) for s in ExamPaperConfig.sem_subjects.keys()])
    return JsonResponse(sems, safe=False)


def get_subjects(request, semester):
    subjects = ExamPaperConfig.sem_subjects.get(str(semester), {})
    if not subjects:
        subjects = ExamPaperConfig.sem_subjects.get(semester, {})
    result = [{'code': code, 'name': name} for code, name in subjects.items()]
    return JsonResponse(result, safe=False)


@csrf_exempt
def generate_paper(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
        
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({'error': 'Invalid JSON in request body'}, status=400)
    
    semester = int(data.get('semester', 1))
    subject_code = data.get('subject_code', '')
    exam_type = data.get('exam_type', 'external').lower()
    
    ranked, subj_name = get_ranked_questions(semester, subject_code)
    if not ranked:
        return JsonResponse({'error': 'Subject not found!'}, status=404)
        
    used = set()
    if exam_type == 'external':
        section1 = pick_questions(ranked, 9, used)
        q2a = pick_questions(ranked, 2, used)
        q2b = pick_questions(ranked, 2, used)
        q3 = pick_questions(ranked, 2, used)
        q4 = pick_questions(ranked, 3, used)
        q5 = pick_questions(ranked, 2, used)
        
        paper = {
            'semester': semester, 'subject_code': subject_code,
            'subject_name': subj_name, 'exam_type': 'External',
            'total_marks': 60, 'time': '3 Hours',
            'section1': section1,
            'q2a': q2a, 'q2b': q2b, 'q3': q3, 'q4': q4, 'q5': q5
        }
    else:
        section1 = pick_questions(ranked, 9, used)
        paper = {
            'semester': semester, 'subject_code': subject_code,
            'subject_name': subj_name, 'exam_type': 'Internal',
            'total_marks': 30, 'time': '1.5 Hours',
            'section1': section1
        }
    return JsonResponse(paper)


@csrf_exempt
def download_pdf(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
        
    try:
        paper = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({'error': 'Invalid JSON in request body'}, status=400)
    
    if not paper:
        return JsonResponse({'error': 'No paper data!'}, status=400)
        
    buf = create_pdf(paper)
    
    # Save History in Database
    GeneratedPaper.objects.create(
        semester=paper.get('semester', 0),
        subject_code=paper.get('subject_code', ''),
        subject_name=paper.get('subject_name', ''),
        exam_type=paper.get('exam_type', ''),
        total_marks=paper.get('total_marks', 0),
        paper_data=paper
    )
    
    fname = f"BCA_Sem{paper.get('semester', '')}_{paper.get('subject_code', '')}_{paper.get('exam_type', '')}.pdf"
    
    return FileResponse(buf, as_attachment=True, filename=fname, content_type='application/pdf')
