from django.urls import path
from . import views

urlpatterns = [
    path('', views.attendance_list, name='attendance_list'),
    path('sessions/', views.session_list, name='session_list'),
    path('ml/recognize/', views.ml_recognize, name='ml_recognize'),
]
