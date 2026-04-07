from rest_framework import serializers
from .models import Attendance, ClassSession


class ClassSessionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    faculty_name = serializers.CharField(source='faculty.name', read_only=True)

    class Meta:
        model = ClassSession
        fields = [
            'session_id', 'subject', 'subject_name', 'subject_code',
            'faculty', 'faculty_name', 'section', 'date', 'time', 'room',
            'duration', 'attendance_marked', 'created_at'
        ]
        read_only_fields = ['session_id', 'created_at']


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_enrollment = serializers.CharField(source='student.enrollment_no', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.name', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'attendance_id', 'student', 'student_name', 'student_enrollment',
            'subject', 'subject_name', 'subject_code', 'date', 'status',
            'marked_by', 'marked_by_name', 'method', 'confidence_score',
            'timestamp', 'created_at'
        ]
        read_only_fields = ['attendance_id', 'timestamp', 'created_at']


class MarkAttendanceSerializer(serializers.Serializer):
    student_id = serializers.UUIDField()
    subject_id = serializers.UUIDField()
    date = serializers.DateField()
    status = serializers.ChoiceField(choices=['present', 'absent'])
    method = serializers.ChoiceField(choices=['manual', 'ml_face_recognition'], default='manual')


class BulkAttendanceSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    records = serializers.ListField(
        child=serializers.DictField()
    )
