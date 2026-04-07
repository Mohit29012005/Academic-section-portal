from rest_framework import serializers
from .models import (
    StudentProfile, FaceEncoding, LectureSession,
    AttendanceRecord, AttendanceAnomaly, AttendanceNotification
)


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ['id', 'phone_number', 'parent_phone_number', 'email',
                  'is_face_registered', 'is_details_filled', 'face_registered_at', 'created_at']
        read_only_fields = ['is_face_registered', 'is_details_filled', 'face_registered_at', 'created_at']


class LectureSessionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    faculty_name = serializers.SerializerMethodField()
    present_count = serializers.SerializerMethodField()

    class Meta:
        model = LectureSession
        fields = [
            'id', 'subject', 'subject_name', 'subject_code',
            'faculty', 'faculty_name', 'date', 'start_time', 'end_time',
            'total_students', 'session_type', 'is_active',
            'qr_token', 'qr_expires_at', 'qr_image_path',
            'present_count', 'created_at',
        ]
        read_only_fields = ['id', 'qr_token', 'qr_expires_at', 'qr_image_path', 'created_at']

    def get_faculty_name(self, obj):
        try:
            return obj.faculty.faculty_profile.name
        except Exception:
            return obj.faculty.email

    def get_present_count(self, obj):
        return obj.records.filter(status__in=['present', 'late']).count()


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.EmailField(source='student.email', read_only=True)
    roll_no = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'session', 'student', 'student_name', 'student_email', 'roll_no',
            'status', 'marked_via', 'confidence_score', 'snapshot_path',
            'marked_at', 'ip_address',
        ]
        read_only_fields = ['id', 'marked_at']

    def get_student_name(self, obj):
        try:
            return obj.student.student_profile.name
        except Exception:
            return obj.student.email

    def get_roll_no(self, obj):
        try:
            return obj.student.student_profile.enrollment_no
        except Exception:
            return ''


class AttendanceAnomalySerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.EmailField(source='student.email', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)

    class Meta:
        model = AttendanceAnomaly
        fields = [
            'id', 'student', 'student_name', 'student_email',
            'subject', 'subject_name', 'subject_code',
            'anomaly_type', 'severity', 'description',
            'detected_at', 'is_resolved', 'resolved_at',
        ]
        read_only_fields = ['id', 'detected_at']

    def get_student_name(self, obj):
        try:
            return obj.student.student_profile.name
        except Exception:
            return obj.student.email


class AttendanceNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceNotification
        fields = ['id', 'recipient', 'notification_type', 'message', 'sent_at', 'is_read', 'triggered_by']
        read_only_fields = ['id', 'sent_at']
