from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.student_dashboard, name='student_dashboard'),
    path('results/', views.student_results, name='student_results'),
    path('attendance/', views.student_attendance, name='student_attendance'),
    path('attendance/mark/', views.student_mark_attendance, name='student_mark_attendance'),
    path('assignments/', views.student_assignments, name='student_assignments'),
    path('assignments/submit/', views.student_submit_assignment, name='student_submit_assignment'),
    path('profile/', views.student_profile, name='student_profile'),
]
