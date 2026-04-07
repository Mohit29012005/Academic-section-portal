import random
from django.utils import timezone
from users.models import Student
from attendance.models import Attendance


class AttendanceMLService:
    """Placeholder service for ML-based face recognition attendance."""

    def recognize_face(self, image_data, class_session_id):
        """
        Placeholder for face recognition.
        In production, this would call the actual ML model.
        """
        confidence = round(random.uniform(85, 99), 2)
        return {
            'success': True,
            'student_id': None,  # Real ML model would detect and return actual student ID
            'confidence': confidence,
            'timestamp': timezone.now()
        }

    def mark_attendance_via_ml(self, class_session_id, student_id, subject_id, faculty):
        """Mark attendance using ML face recognition result."""
        result = self.recognize_face(None, class_session_id)
        if result['success'] and student_id:
            try:
                student = Student.objects.get(student_id=student_id)
                attendance = Attendance.objects.create(
                    student=student,
                    subject_id=subject_id,
                    date=timezone.now().date(),
                    status='present',
                    marked_by=faculty,
                    method='ml_face_recognition',
                    confidence_score=result['confidence'],
                )
                return attendance
            except Student.DoesNotExist:
                return None
        return None
