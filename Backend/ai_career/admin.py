from django.contrib import admin
from .models import (
    CareerSession, FitAnalysis, CareerRecommendation,
    QuizAttempt, LearningResource, InternshipSearch, ResumeBuild
)


@admin.register(CareerSession)
class CareerSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'first_seen', 'last_active', 'total_actions']
    list_filter = ['first_seen', 'user']


@admin.register(FitAnalysis)
class FitAnalysisAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'match_score', 'fit_prediction', 'created_at']
    list_filter = ['fit_prediction', 'model_type', 'created_at']


@admin.register(CareerRecommendation)
class CareerRecommendationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'experience', 'ai_generated', 'created_at']
    list_filter = ['experience', 'ai_generated', 'created_at']


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'total_questions', 'correct_answers', 'grade', 'created_at']
    list_filter = ['grade', 'ai_generated', 'created_at']


@admin.register(LearningResource)
class LearningResourceAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'skill_name', 'created_at']


@admin.register(InternshipSearch)
class InternshipSearchAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'field', 'location', 'created_at']


@admin.register(ResumeBuild)
class ResumeBuildAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'resume_format', 'created_at']
