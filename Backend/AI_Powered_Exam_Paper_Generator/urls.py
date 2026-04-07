from django.urls import path
from . import views
from . import faculty_api_views

app_name = 'exam_paper'

urlpatterns = [
    path('', views.index, name='index'),
    path('api/semesters/', views.get_semesters, name='get_semesters'),
    path('api/subjects/<int:semester>/', views.get_subjects, name='get_subjects'),
    path('api/generate/', views.generate_paper, name='generate_paper'),
    path('api/download-pdf/', views.download_pdf, name='download_pdf'),

    # ── Faculty Portal REST API (called by React frontend) ──
    path('api/faculty/semesters/', faculty_api_views.api_get_semesters, name='faculty_semesters'),
    path('api/faculty/subjects/', faculty_api_views.api_get_subjects, name='faculty_subjects'),
    path('api/faculty/generate/', faculty_api_views.api_generate_paper, name='faculty_generate'),
    path('api/faculty/list/', faculty_api_views.api_get_papers, name='faculty_list'),
    path('api/faculty/delete/<int:paper_id>/', faculty_api_views.api_delete_paper, name='faculty_delete'),
    path('api/faculty/download-pdf/', faculty_api_views.api_download_pdf, name='faculty_download_pdf'),
]
