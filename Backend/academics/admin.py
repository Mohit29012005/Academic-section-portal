from django.contrib import admin
from .models import Course, Subject, SemesterResult


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'duration', 'total_semesters', 'department')
    search_fields = ('code', 'name')


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'course', 'semester', 'credits')
    list_filter = ('course', 'semester')
    search_fields = ('code', 'name')


@admin.register(SemesterResult)
class SemesterResultAdmin(admin.ModelAdmin):
    list_display = ('student', 'semester', 'sgpa', 'status', 'year')
    list_filter = ('status', 'semester')
    search_fields = ('student__name',)
