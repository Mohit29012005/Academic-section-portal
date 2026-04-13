from django.urls import path
from . import admin_views

urlpatterns = [
    # Dashboard & Stats
    path(
        "dashboard/stats/",
        admin_views.admin_dashboard_stats,
        name="super_dashboard_stats",
    ),
    path(
        "dashboard/activity/",
        admin_views.admin_recent_activity,
        name="super_recent_activity",
    ),
    # User Management
    path("users/", admin_views.admin_list_users, name="super_list_users"),
    path("users/create/", admin_views.admin_create_user, name="super_create_user"),
    path(
        "users/<uuid:user_id>/", admin_views.admin_update_user, name="super_update_user"
    ),
    path(
        "users/<uuid:user_id>/delete/",
        admin_views.admin_delete_user,
        name="super_delete_user",
    ),
    path(
        "users/<uuid:user_id>/reset-password/",
        admin_views.admin_reset_password,
        name="super_reset_password",
    ),
    path(
        "users/<uuid:user_id>/ban/", admin_views.admin_ban_user, name="super_ban_user"
    ),
    path(
        "users/<uuid:user_id>/unban/",
        admin_views.admin_unban_user,
        name="super_unban_user",
    ),
    # Student Management
    path("students/", admin_views.admin_list_students, name="super_list_students"),
    path(
        "students/<uuid:student_id>/",
        admin_views.admin_update_student,
        name="super_update_student",
    ),
    path(
        "students/roll-numbers/check/",
        admin_views.admin_check_roll_numbers,
        name="super_check_roll_numbers",
    ),
    path(
        "students/roll-numbers/fix/",
        admin_views.admin_fix_roll_numbers,
        name="super_fix_roll_numbers",
    ),
    # Faculty Management
    path("faculty/", admin_views.admin_list_faculty, name="super_list_faculty"),
    path(
        "faculty/create/",
        admin_views.admin_create_faculty,
        name="super_create_faculty",
    ),
    path(
        "faculty/<uuid:faculty_id>/",
        admin_views.admin_update_faculty,
        name="super_update_faculty",
    ),
    path(
        "faculty/<uuid:faculty_id>/subjects/",
        admin_views.admin_faculty_subjects,
        name="super_faculty_subjects",
    ),
    # Course Management
    path("courses/", admin_views.admin_list_courses, name="super_list_courses"),
    path(
        "courses/create/", admin_views.admin_create_course, name="super_create_course"
    ),
    path(
        "courses/<uuid:course_id>/",
        admin_views.admin_update_course,
        name="super_update_course",
    ),
    path(
        "courses/<uuid:course_id>/delete/",
        admin_views.admin_delete_course,
        name="super_delete_course",
    ),
    # Subject Management
    path("subjects/", admin_views.admin_list_subjects, name="super_list_subjects"),
    path(
        "subjects/create/",
        admin_views.admin_create_subject,
        name="super_create_subject",
    ),
    path(
        "subjects/<uuid:subject_id>/",
        admin_views.admin_update_subject,
        name="super_update_subject",
    ),
    path(
        "subjects/<uuid:subject_id>/delete/",
        admin_views.admin_delete_subject,
        name="super_delete_subject",
    ),
    # Timetable Management
    path(
        "timetable/stats/",
        admin_views.admin_timetable_stats,
        name="super_timetable_stats",
    ),
    path(
        "timetable/clear/",
        admin_views.admin_clear_timetable,
        name="super_clear_timetable",
    ),
    path(
        "timetable/generate/",
        admin_views.admin_generate_timetable,
        name="super_generate_timetable",
    ),
    # Notifications
    path(
        "notifications/send/",
        admin_views.admin_send_notification,
        name="super_send_notification",
    ),
    path(
        "notifications/history/",
        admin_views.admin_notification_history,
        name="super_notification_history",
    ),
    # System Control
    path("system/health/", admin_views.admin_system_health, name="super_system_health"),
    path("system/logs/", admin_views.admin_activity_logs, name="super_activity_logs"),
    path("bulk-import/", admin_views.admin_bulk_import, name="super_bulk_import"),
]
