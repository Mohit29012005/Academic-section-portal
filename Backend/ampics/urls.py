from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/auth/', include('users.urls_auth')),
    path('api/student/', include('users.urls_student')),
    path('api/faculty/', include('users.urls_faculty')),
    path('api/admin/', include('users.urls_admin')),
    path('api/academics/', include('academics.urls')),
    path('exam-paper/', include('AI_Powered_Exam_Paper_Generator.urls')),
    path('api/career/', include('ai_career.urls')),
    path('api/attendance-ai/', include('attendance_ai.urls')),  # AI Attendance System
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
