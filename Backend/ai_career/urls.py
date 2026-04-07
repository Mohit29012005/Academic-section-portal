"""
AI Career Guidance URL Configuration
"""
from django.urls import path
from . import views

app_name = 'ai_career'

urlpatterns = [
    # Health check
    path('health/', views.health_check, name='health'),

    # Fit Analyzer
    path('analyze/', views.analyze_fit, name='analyze-fit'),

    # Career Recommendations
    path('recommend/', views.career_recommend, name='career-recommend'),

    # Quiz
    path('generate-quiz/', views.generate_quiz, name='generate-quiz'),
    path('submit-quiz/', views.submit_quiz, name='submit-quiz'),

    # Learning Resources
    path('learning-resources/', views.learning_resources, name='learning-resources'),

    # Internships
    path('internships/', views.internships, name='internships'),

    # Resume
    path('resume-export/', views.resume_export, name='resume-export'),

    # Analytics
    path('history/', views.session_history, name='session-history'),
    path('stats/', views.platform_stats, name='platform-stats'),
]
