from django.urls import path
from . import views

urlpatterns = [
    # ML-based PYQ Generation (no auth required)
    path('ml/semesters/', views.ml_get_semesters, name='ml_get_semesters'),
    path('ml/subjects/<int:semester>/', views.ml_get_subjects, name='ml_get_subjects'),
    path('ml/generate/', views.ml_generate_paper, name='ml_generate_paper'),
    path('ml/download/', views.ml_download_pdf, name='ml_download_pdf'),
    
    # Original DB-based endpoints (requires auth)
    path('request/', views.request_pyq, name='request_pyq'),
    path('', views.pyq_list, name='pyq_list'),
    path('<uuid:request_id>/download/', views.download_pyq, name='download_pyq'),
]
