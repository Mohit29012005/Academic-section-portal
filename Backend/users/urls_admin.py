from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('users/', views.admin_users, name='admin_users'),
    path('users/create/', views.admin_create_user, name='admin_create_user'),
    path('users/<uuid:user_id>/', views.admin_update_user, name='admin_update_user'),
    path('users/<uuid:user_id>/delete/', views.admin_delete_user, name='admin_delete_user'),
    path('analytics/', views.admin_analytics, name='admin_analytics'),
    path('reports/generate/', views.admin_reports, name='admin_reports'),
    path('students/', views.admin_students, name='admin_students'),
    path('faculty/', views.admin_faculty, name='admin_faculty'),
    path('faculty/<uuid:faculty_id>/assign-subjects/', views.admin_assign_subjects, name='admin_assign_subjects'),
    path('notifications/', views.admin_notifications, name='admin_notifications'),
    path('terms/', views.admin_academic_terms, name='admin_academic_terms'),
    path('terms/<uuid:term_id>/', views.admin_update_academic_term, name='admin_update_academic_term'),
    path('terms/<uuid:term_id>/delete/', views.admin_delete_academic_term, name='admin_delete_academic_term'),
    path('holidays/', views.admin_holidays, name='admin_holidays'),
    path('holidays/<uuid:holiday_id>/', views.admin_delete_holiday, name='admin_delete_holiday'),
]
