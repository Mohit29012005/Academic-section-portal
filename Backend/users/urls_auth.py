from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('refresh/', views.refresh_token_view, name='token_refresh'),
    path('password/reset/request/', views.request_password_reset_view, name='password_reset_request'),
    path('password/reset/verify/', views.password_reset_verify_view, name='password_reset_verify'),
    path('email/change/request/', views.request_email_change_view, name='email_change_request'),
    path('email/change/verify/', views.verify_email_change_view, name='email_change_verify'),
    path('notifications/', views.user_notifications, name='user_notifications'),
    path('social/success/', views.social_login_success, name='social_login_success'),
]
