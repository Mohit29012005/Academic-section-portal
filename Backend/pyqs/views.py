import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status as http_status
from django.http import FileResponse
from .models import PYQGenerationRequest
from .serializers import PYQGenerationRequestSerializer, PYQRequestSerializer
from .services import PYQGenerationService
from .utils import get_semesters, get_subjects_for_semester, generate_paper_data, create_pdf
from academics.models import Subject, Course
import os


# ========== ML-Based PYQ Generation Endpoints ==========

@api_view(['GET'])
@permission_classes([AllowAny])
def ml_get_semesters(request):
    """Get available semesters from ML model."""
    sems = get_semesters()
    return Response(sems)


@api_view(['GET'])
@permission_classes([AllowAny])
def ml_get_subjects(request, semester):
    """Get subjects for a semester from ML model."""
    subjects = get_subjects_for_semester(semester)
    return Response(subjects)


@api_view(['POST'])
@permission_classes([AllowAny])
def ml_generate_paper(request):
    """Generate PYQ paper using ML model."""
    try:
        data = request.data
    except Exception:
        return Response({'error': 'Invalid request data'}, status=http_status.HTTP_400_BAD_REQUEST)
    
    semester = int(data.get('semester', 1))
    subject_code = data.get('subject_code', '')
    exam_type = data.get('exam_type', 'external')
    
    if not subject_code:
        return Response({'error': 'subject_code is required'}, status=http_status.HTTP_400_BAD_REQUEST)
    
    paper, error = generate_paper_data(semester, subject_code, exam_type)
    
    if error:
        return Response({'error': error}, status=http_status.HTTP_404_NOT_FOUND)
    
    return Response(paper)


@api_view(['POST'])
@permission_classes([AllowAny])
def ml_download_pdf(request):
    """Download generated paper as PDF."""
    try:
        paper = request.data
    except Exception:
        return Response({'error': 'Invalid request data'}, status=http_status.HTTP_400_BAD_REQUEST)
    
    if not paper or not paper.get('subject_code'):
        return Response({'error': 'No paper data provided'}, status=http_status.HTTP_400_BAD_REQUEST)
    
    pdf_buffer = create_pdf(paper)
    
    filename = f"BCA_Sem{paper.get('semester', '')}_{paper.get('subject_code', '')}_{paper.get('exam_type', '')}.pdf"
    
    response = FileResponse(pdf_buffer, as_attachment=True, filename=filename, content_type='application/pdf')
    return response


# ========== Original Database-Based Endpoints ==========

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_pyq(request):
    """Request PYQ generation with parameters."""
    try:
        student = request.user.student_profile
    except Exception:
        return Response({'error': 'Student profile not found'}, status=http_status.HTTP_404_NOT_FOUND)

    serializer = PYQRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        subject = Subject.objects.get(subject_id=data['subject_id'])
        course = Course.objects.get(course_id=data['course_id'])
    except (Subject.DoesNotExist, Course.DoesNotExist):
        return Response({'error': 'Subject or Course not found'}, status=http_status.HTTP_404_NOT_FOUND)

    service = PYQGenerationService()
    pyq_request = service.generate_pyq(
        subject=subject,
        course=course,
        semester=data['semester'],
        num_questions=data['num_questions'],
        difficulty=data['difficulty'],
        exam_type=data['exam_type'],
        student=student,
    )

    return Response({
        'message': 'PYQ generated successfully',
        'request': PYQGenerationRequestSerializer(pyq_request).data,
        'download_url': f'/api/pyqs/{pyq_request.request_id}/download/',
    }, status=http_status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_pyq(request, request_id):
    """Download generated PYQ PDF."""
    try:
        pyq = PYQGenerationRequest.objects.get(request_id=request_id)
    except PYQGenerationRequest.DoesNotExist:
        return Response({'error': 'PYQ not found'}, status=http_status.HTTP_404_NOT_FOUND)

    if pyq.deleted_at:
        return Response({'error': 'PYQ has expired (auto-deleted after 24 hours)'}, status=http_status.HTTP_410_GONE)

    if pyq.generated_pdf and os.path.exists(pyq.generated_pdf.path):
        pyq.downloaded = True
        pyq.save()
        return FileResponse(open(pyq.generated_pdf.path, 'rb'), content_type='application/pdf')

    return Response({'error': 'PDF file not found'}, status=http_status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pyq_list(request):
    """List PYQ generation requests for current student."""
    try:
        student = request.user.student_profile
    except Exception:
        return Response({'error': 'Student profile not found'}, status=http_status.HTTP_404_NOT_FOUND)

    requests_qs = PYQGenerationRequest.objects.filter(
        student=student, deleted_at__isnull=True
    )
    return Response(PYQGenerationRequestSerializer(requests_qs, many=True).data)
