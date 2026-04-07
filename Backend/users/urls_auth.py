from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('refresh/', views.refresh_token_view, name='token_refresh'),
    path('password/reset/', views.password_reset_view, name='password_reset'),
    path('notifications/', views.user_notifications, name='user_notifications'),
]
