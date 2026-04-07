from rest_framework import serializers
from .models import Course, Subject, SemesterResult, AcademicTerm, Holiday, TimetableSlot


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'
        read_only_fields = ['course_id', 'created_at']


class SubjectSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = Subject
        fields = ['subject_id', 'code', 'name', 'course', 'course_code', 'course_name', 'semester', 'credits', 'created_at']
        read_only_fields = ['subject_id', 'created_at']


class SemesterResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)

    class Meta:
        model = SemesterResult
        fields = ['result_id', 'student', 'student_name', 'semester', 'sgpa', 'status', 'year', 'created_at']
        read_only_fields = ['result_id', 'created_at']


class AcademicTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicTerm
        fields = '__all__'


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = '__all__'


class TimetableSlotSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    faculty_name = serializers.CharField(source='faculty.name', read_only=True)

    class Meta:
        model = TimetableSlot
        fields = [
            'slot_id', 'course', 'course_code', 'semester', 'day_of_week', 
            'start_time', 'end_time', 'subject', 'subject_name', 'subject_code', 
            'faculty', 'faculty_name', 'room', 'section'
        ]
        read_only_fields = ['slot_id']
