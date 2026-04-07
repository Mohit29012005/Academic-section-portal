from django.urls import path
from . import views

urlpatterns = [
    # ── Student: Registration & Setup ──
    path('registration-status/',             views.registration_status,       name='ai-reg-status'),
    path('fill-details/',                    views.fill_details,              name='ai-fill-details'),
    path('register-face/',                   views.register_face,             name='ai-register-face'),

    # ── Public: QR Verification ──
    path('verify-session/<str:qr_token>/',  views.verify_session,            name='ai-verify-session'),

    # ── Student: Mark via QR (second login) ──
    path('mark-attendance-qr/',             views.mark_attendance_qr,        name='ai-mark-qr'),

    # ── Faculty: Session Management ──
    path('lecture/create/',                  views.create_lecture,            name='ai-create-lecture'),
    path('lecture/<int:session_id>/status/', views.lecture_status,            name='ai-lecture-status'),
    path('lecture/<int:session_id>/end/',    views.end_lecture,               name='ai-end-lecture'),
    path('lecture/<int:session_id>/mark-manual/', views.mark_manual,         name='ai-mark-manual'),

    # ── Faculty: Face Recognition ──
    path('mark-attendance-face/',            views.mark_attendance_face,      name='ai-mark-face'),
    path('faculty/sessions/',               views.faculty_sessions,           name='ai-faculty-sessions'),

    # ── Reports & Anomalies ──
    path('student/<str:student_id>/report/', views.student_report,           name='ai-student-report'),
    path('generate-pdf-report/',             views.generate_pdf_report,       name='ai-pdf-report'),
    path('anomalies/',                       views.anomalies_list,            name='ai-anomalies'),
    path('anomalies/<int:anomaly_id>/resolve/', views.resolve_anomaly,       name='ai-resolve-anomaly'),

    # ── Notifications ──
    path('notifications/',                   views.notifications_list,        name='ai-notifications'),
    path('notifications/<int:notif_id>/read/', views.mark_notification_read, name='ai-notif-read'),

    # ── Admin ──
    path('admin/student-face-status/',       views.admin_student_face_status, name='ai-admin-face-status'),
    path('admin/send-reminder/<str:student_id>/', views.send_face_reminder,  name='ai-send-reminder'),
    path('admin/bulk-remind/',               views.bulk_remind,               name='ai-bulk-remind'),
]
