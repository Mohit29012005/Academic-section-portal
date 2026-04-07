from django.contrib import admin
from .models import (
    StudentProfile, FaceEncoding, LectureSession,
    AttendanceRecord, AttendanceAnomaly, AttendanceNotification,
)


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone_number', 'is_details_filled', 'is_face_registered', 'face_registered_at']
    list_filter = ['is_face_registered', 'is_details_filled']
    search_fields = ['user__email']


@admin.register(FaceEncoding)
class FaceEncodingAdmin(admin.ModelAdmin):
    list_display = ['student', 'encoding_count', 'last_updated']
    search_fields = ['student__email']


@admin.register(LectureSession)
class LectureSessionAdmin(admin.ModelAdmin):
    list_display = ['subject', 'faculty', 'date', 'session_type', 'total_students', 'is_active']
    list_filter = ['is_active', 'session_type', 'date']
    search_fields = ['subject__name', 'faculty__email']
    date_hierarchy = 'date'


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['student', 'session', 'status', 'marked_via', 'marked_at']
    list_filter = ['status', 'marked_via']
    search_fields = ['student__email']


@admin.register(AttendanceAnomaly)
class AttendanceAnomalyAdmin(admin.ModelAdmin):
    list_display = ['student', 'subject', 'anomaly_type', 'severity', 'is_resolved', 'detected_at']
    list_filter = ['severity', 'anomaly_type', 'is_resolved']
    search_fields = ['student__email', 'subject__name']


@admin.register(AttendanceNotification)
class AttendanceNotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'notification_type', 'is_read', 'sent_at']
    list_filter = ['notification_type', 'is_read']
    search_fields = ['recipient__email']
