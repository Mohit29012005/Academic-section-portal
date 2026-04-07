from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status as http_status
from .models import Attendance, ClassSession
from .serializers import AttendanceSerializer, ClassSessionSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_list(request):
    student_id = request.query_params.get('student_id')
    subject_id = request.query_params.get('subject_id')
    records = Attendance.objects.all().select_related('student', 'subject', 'marked_by')
    if student_id:
        records = records.filter(student_id=student_id)
    if subject_id:
        records = records.filter(subject_id=subject_id)
    return Response(AttendanceSerializer(records[:100], many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_list(request):
    faculty_id = request.query_params.get('faculty_id')
    sessions = ClassSession.objects.all().select_related('subject', 'faculty')
    if faculty_id:
        sessions = sessions.filter(faculty_id=faculty_id)
    return Response(ClassSessionSerializer(sessions, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ml_recognize(request):
    """Placeholder endpoint for ML face recognition attendance."""
    import random
    class_session_id = request.data.get('class_session_id')
    if not class_session_id:
        return Response({'error': 'class_session_id is required'}, status=http_status.HTTP_400_BAD_REQUEST)

    confidence = round(random.uniform(85, 99), 2)
    return Response({
        'success': True,
        'message': 'Face recognized successfully (placeholder)',
        'confidence': confidence,
        'method': 'ml_face_recognition',
        'note': 'This is a placeholder response. Actual ML model will be integrated later.',
    })
