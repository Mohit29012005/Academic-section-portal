from django.contrib import admin
from .models import Session, FitAnalysis, CareerSearch, QuizAttempt, LearningRequest, InternshipSearch, ResumeBuild


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'ip_address', 'first_seen', 'last_active', 'total_actions']
    list_filter = ['first_seen', 'last_active']
    search_fields = ['id', 'ip_address']
    readonly_fields = ['first_seen', 'last_active']


@admin.register(FitAnalysis)
class FitAnalysisAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'match_score', 'fit_prediction', 'created_at']
    list_filter = ['created_at', 'fit_prediction', 'model_type']
    search_fields = ['session__id']
    readonly_fields = ['created_at']


@admin.register(CareerSearch)
class CareerSearchAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'experience', 'result_count', 'created_at']
    list_filter = ['created_at', 'experience', 'ai_generated']
    search_fields = ['session__id', 'interests']
    readonly_fields = ['created_at']


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'total_questions', 'score_percent', 'grade', 'created_at']
    list_filter = ['created_at', 'grade', 'ai_generated']
    search_fields = ['session__id', 'skills_tested']
    readonly_fields = ['created_at', 'score_percent']


@admin.register(LearningRequest)
class LearningRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'resource_count', 'free_only', 'created_at']
    list_filter = ['created_at', 'free_only', 'ai_generated']
    search_fields = ['session__id', 'topics']
    readonly_fields = ['created_at']


@admin.register(InternshipSearch)
class InternshipSearchAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'location', 'domain', 'result_count', 'created_at']
    list_filter = ['created_at', 'location', 'domain', 'ai_generated']
    search_fields = ['session__id', 'location', 'domain']
    readonly_fields = ['created_at']


@admin.register(ResumeBuild)
class ResumeBuildAdmin(admin.ModelAdmin):
    list_display = ['id', 'full_name', 'email', 'exp_count', 'edu_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['full_name', 'email', 'session__id']
    readonly_fields = ['created_at']
