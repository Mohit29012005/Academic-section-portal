from django.urls import path
from . import views

urlpatterns = [
    path('courses/', views.course_list, name='course_list'),
    path('courses/<uuid:course_id>/', views.course_detail, name='course_detail'),
    path('subjects/', views.subject_list, name='subject_list'),
    path('timetable/', views.timetable_list, name='timetable_list'),
    path('timetable/<uuid:slot_id>/', views.timetable_detail, name='timetable_detail'),
    path('faculty/timetable/', views.faculty_timetable, name='faculty_timetable'),
    path('student/timetable/', views.student_timetable, name='student_timetable'),
]
