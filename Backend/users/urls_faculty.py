from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.faculty_dashboard, name='faculty_dashboard'),
    path('attendance/classes/', views.faculty_attendance_classes, name='faculty_attendance_classes'),
    path('attendance/mark/', views.faculty_mark_attendance, name='faculty_mark_attendance'),
    path('attendance/check/', views.faculty_check_attendance, name='faculty_check_attendance'),
    path('students/', views.faculty_students, name='faculty_students'),
    path('exams/', views.faculty_exams, name='faculty_exams'),
    path('exams/create/', views.faculty_create_exam, name='faculty_create_exam'),
    path('exams/generate-questions/', views.faculty_generate_questions, name='faculty_generate_questions'),
    path('schedule/', views.faculty_schedule, name='faculty_schedule'),
    path('profile/', views.faculty_profile, name='faculty_profile'),
]
