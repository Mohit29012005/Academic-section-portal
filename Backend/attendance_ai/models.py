import uuid
from django.db import models
from django.conf import settings
from academics.models import Subject

# ── Choice constants ──────────────────────────────────────────────────────────
SESSION_TYPE = [
    ('lecture', 'Lecture'),
    ('lab', 'Lab'),
    ('tutorial', 'Tutorial'),
]
RECORD_STATUS = [
    ('present', 'Present'),
    ('absent', 'Absent'),
    ('late', 'Late'),
    ('excused', 'Excused'),
]
MARKED_VIA = [
    ('qr_link', 'QR Link'),
    ('face_recognition', 'Face Recognition'),
    ('manual', 'Manual'),
]
ANOMALY_TYPE = [
    ('consecutive_absent', 'Consecutive Absences'),
    ('low_percentage', 'Low Attendance Percentage'),
    ('irregular_pattern', 'Irregular Pattern'),
    ('sudden_drop', 'Sudden Drop'),
]
SEVERITY = [
    ('low', 'Low'),
    ('medium', 'Medium'),
    ('high', 'High'),
    ('critical', 'Critical'),
]
NOTIF_TYPE = [
    ('student_alert', 'Student Alert'),
    ('faculty_info', 'Faculty Info'),
    ('admin_critical', 'Admin Critical'),
]


class StudentProfile(models.Model):
    """Extended AI-attendance profile for students (separate from users.Student)."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_profile'
    )
    phone_number = models.CharField(max_length=15, blank=True)
    parent_phone_number = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    is_face_registered = models.BooleanField(default=False)
    is_details_filled = models.BooleanField(default=False)
    face_registered_at = models.DateTimeField(null=True, blank=True)
    registered_face_photo = models.ImageField(upload_to='registered_faces/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_student_profiles'

    def __str__(self):
        return f"AI Profile – {self.user.email}"


class FaceEncoding(models.Model):
    """Paths to face-encoding pickle files for each student."""
    student = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='face_encoding'
    )
    encoding_path = models.CharField(max_length=500, help_text="Relative path to .pkl in MEDIA_ROOT")
    encoding_count = models.IntegerField(default=0, help_text="Number of face samples (max 5)")
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ai_face_encodings'

    def __str__(self):
        return f"FaceEncoding – {self.student.email} ({self.encoding_count} samples)"


class LectureSession(models.Model):
    """A single class session where attendance is tracked (QR or Face)."""
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='lecture_sessions')
    faculty = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='faculty_lecture_sessions'
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    total_students = models.IntegerField(default=0, help_text="Faculty manually enters class strength")
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE, default='lecture')
    is_active = models.BooleanField(default=True)
    qr_token = models.UUIDField(default=uuid.uuid4, unique=True)
    qr_expires_at = models.DateTimeField(null=True, blank=True)
    qr_image_path = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_lecture_sessions'
        ordering = ['-date', '-start_time']

    def __str__(self):
        return f"{self.subject.code} – {self.date} ({self.session_type})"


class AttendanceRecord(models.Model):
    """Individual attendance record for one student in one lecture session."""
    session = models.ForeignKey(LectureSession, on_delete=models.CASCADE, related_name='records')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_attendance_records'
    )
    status = models.CharField(max_length=20, choices=RECORD_STATUS, default='absent')
    marked_via = models.CharField(max_length=20, choices=MARKED_VIA, default='manual')
    confidence_score = models.FloatField(null=True, blank=True, help_text="Face recognition confidence 0-100")
    snapshot_path = models.CharField(max_length=500, blank=True, null=True)
    marked_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.CharField(max_length=45, blank=True, help_text="Student IP logged on QR mark")

    class Meta:
        db_table = 'ai_attendance_records'
        unique_together = ('session', 'student')
        ordering = ['-marked_at']

    def __str__(self):
        return f"{self.student.email} – {self.session} – {self.status}"


class AttendanceAnomaly(models.Model):
    """AI-detected attendance anomaly with LLM-generated description."""
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendance_anomalies'
    )
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='anomalies')
    anomaly_type = models.CharField(max_length=30, choices=ANOMALY_TYPE)
    severity = models.CharField(max_length=20, choices=SEVERITY, default='medium')
    description = models.TextField(blank=True, help_text="LLM-generated faculty alert")
    detected_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'ai_attendance_anomalies'
        ordering = ['-detected_at']

    def __str__(self):
        return f"{self.student.email} – {self.anomaly_type} ({self.severity})"


class AttendanceNotification(models.Model):
    """Notification sent to a user triggered by an attendance anomaly."""
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendance_notifications'
    )
    notification_type = models.CharField(max_length=30, choices=NOTIF_TYPE)
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    triggered_by = models.ForeignKey(
        AttendanceAnomaly, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications'
    )

    class Meta:
        db_table = 'ai_attendance_notifications'
        ordering = ['-sent_at']

    def __str__(self):
        return f"Notif → {self.recipient.email} ({self.notification_type})"
