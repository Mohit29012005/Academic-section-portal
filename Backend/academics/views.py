from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Course, Subject, SemesterResult, TimetableSlot
from .serializers import CourseSerializer, SubjectSerializer, SemesterResultSerializer, TimetableSlotSerializer


from rest_framework import status

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def course_list(request):
    if request.method == 'POST':
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid():
            course = serializer.save()
            
            # Auto-create 5 subjects per semester for this new course
            subject_templates = [
                ('Core Theory', 4),
                ('Advanced Concepts', 4),
                ('Practical Lab', 3),
                ('Elective Module', 3),
                ('Seminar & Workshop', 2),
            ]
            
            total_semesters = course.total_semesters or (course.duration * 2)
            for sem in range(1, total_semesters + 1):
                for idx, (name_suffix, credits) in enumerate(subject_templates, 1):
                    sub_code = f"{course.code}-S{sem}-{idx}"
                    sub_name = f"{course.name} {name_suffix} {sem}.{idx}"
                    # Only create if subject code doesn't already exist
                    if not Subject.objects.filter(code=sub_code).exists():
                        Subject.objects.create(
                            code=sub_code,
                            name=sub_name,
                            course=course,
                            semester=sem,
                            credits=credits,
                        )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'error': 'Invalid course data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    courses = Course.objects.all()
    return Response(CourseSerializer(courses, many=True).data)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def course_detail(request, course_id):
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
    try:
        course = Course.objects.get(course_id=course_id)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if request.method == 'PUT':
        serializer = CourseSerializer(course, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    elif request.method == 'DELETE':
        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subject_list(request):
    course_id = request.query_params.get('course_id')
    semester = request.query_params.get('semester')
    subjects = Subject.objects.all().select_related('course')
    if course_id:
        subjects = subjects.filter(course_id=course_id)
    if semester:
        subjects = subjects.filter(semester=semester)
    return Response(SubjectSerializer(subjects, many=True).data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def timetable_list(request):
    """Admin can list and create timetable slots."""
    if request.method == 'GET':
        course_id = request.query_params.get('course_id')
        semester = request.query_params.get('semester')
        section = request.query_params.get('section', 'A')
        
        slots = TimetableSlot.objects.all().select_related('course', 'subject', 'faculty')
        
        if course_id:
            slots = slots.filter(course_id=course_id)
        if semester:
            slots = slots.filter(semester=semester)
        if section:
            slots = slots.filter(section=section)
            
        return Response(TimetableSlotSerializer(slots, many=True).data)
    
    elif request.method == 'POST':
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = TimetableSlotSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def timetable_detail(request, slot_id):
    """Admin can delete a timetable slot."""
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
    try:
        slot = TimetableSlot.objects.get(slot_id=slot_id)
        slot.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except TimetableSlot.DoesNotExist:
        return Response({'error': 'Slot not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def faculty_timetable(request):
    """Logged in faculty can view their schedule."""
    if request.user.role != 'faculty':
        return Response({'error': 'Faculty access required'}, status=status.HTTP_403_FORBIDDEN)
        
    try:
        faculty = request.user.faculty_profile
        slots = TimetableSlot.objects.filter(faculty=faculty).select_related('course', 'subject')
        return Response(TimetableSlotSerializer(slots, many=True).data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_timetable(request):
    """Logged in student can view their course schedule."""
    if request.user.role != 'student':
        return Response({'error': 'Student access required'}, status=status.HTTP_403_FORBIDDEN)
        
    try:
        student = request.user.student_profile
        slots = TimetableSlot.objects.filter(
            course=student.course,
            semester=student.current_semester
        ).select_related('subject', 'faculty')
        return Response(TimetableSlotSerializer(slots, many=True).data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
