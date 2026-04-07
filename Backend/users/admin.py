from django.contrib import admin
from .models import User, Student, Faculty, Admin as AdminModel


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'role', 'is_active', 'created_at')
    list_filter = ('role', 'is_active')
    search_fields = ('email',)
    ordering = ('-created_at',)


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('name', 'enrollment_no', 'email', 'course', 'semester', 'cgpa')
    list_filter = ('course', 'semester')
    search_fields = ('name', 'enrollment_no', 'email')


@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ('name', 'employee_id', 'email', 'department')
    list_filter = ('department',)
    search_fields = ('name', 'employee_id', 'email')


@admin.register(AdminModel)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'admin_id', 'email')
    search_fields = ('name', 'admin_id', 'email')
