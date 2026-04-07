from django.contrib import admin
from .models import GeneratedPaper


@admin.register(GeneratedPaper)
class GeneratedPaperAdmin(admin.ModelAdmin):
    list_display = ('subject_code', 'subject_name', 'semester', 'exam_type', 'total_marks', 'created_at')
    list_filter = ('semester', 'exam_type', 'created_at')
    search_fields = ('subject_code', 'subject_name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'paper_data')
    
    fieldsets = (
        ('Paper Info', {
            'fields': ('semester', 'subject_code', 'subject_name', 'exam_type', 'total_marks')
        }),
        ('Generated Data', {
            'fields': ('paper_data', 'created_at'),
            'classes': ('collapse',)
        }),
    )
