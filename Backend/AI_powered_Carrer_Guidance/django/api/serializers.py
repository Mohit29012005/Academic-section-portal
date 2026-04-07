"""
DRF Serializers for Analytics Models & API Responses
"""

from rest_framework import serializers
from analytics.models import (
    Session, FitAnalysis, CareerSearch, QuizAttempt,
    LearningRequest, InternshipSearch, ResumeBuild
)


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ['id', 'ip_address', 'first_seen', 'last_active', 'total_actions']


class FitAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = FitAnalysis
        fields = [
            'id', 'session', 'ip_address', 'match_score', 'fit_prediction',
            'fit_confidence', 'matched_skills', 'missing_skills',
            'resume_preview', 'job_preview', 'model_type', 'created_at'
        ]


class CareerSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerSearch
        fields = ['id', 'session', 'interests', 'current_skills', 'experience', 'result_count', 'ai_generated', 'created_at']


class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = ['id', 'session', 'skills_tested', 'total_questions', 'correct_answers', 'score_percent', 'grade', 'ai_generated', 'created_at']


class LearningRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningRequest
        fields = ['id', 'session', 'topics', 'free_only', 'resource_count', 'ai_generated', 'created_at']


class InternshipSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternshipSearch
        fields = ['id', 'session', 'location', 'domain', 'min_stipend', 'max_stipend', 'skills', 'result_count', 'ai_generated', 'created_at']


class ResumeBuildSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeBuild
        fields = ['id', 'session', 'full_name', 'email', 'location', 'skills', 'exp_count', 'edu_count', 'project_count', 'created_at']


# API Response Serializers (for combining data)

class CareerRecommendationSerializer(serializers.Serializer):
    """Serializer for career recommendation API response"""
    key = serializers.CharField()
    title = serializers.CharField()
    emoji = serializers.CharField()
    match = serializers.IntegerField()
    salary = serializers.CharField()
    description = serializers.CharField()
    skills = serializers.ListField(child=serializers.CharField())
    roadmap = serializers.ListField(child=serializers.CharField())
    resources = serializers.ListField()
    market_insight = serializers.CharField()


class QuizQuestionSerializer(serializers.Serializer):
    """Serializer for quiz questions"""
    skill = serializers.CharField()
    q = serializers.CharField()
    options = serializers.ListField(child=serializers.CharField())
    answer = serializers.IntegerField()
    explanation = serializers.CharField()


class LearningResourceSerializer(serializers.Serializer):
    """Serializer for learning resources"""
    title = serializers.CharField()
    platform = serializers.CharField()
    url = serializers.CharField()
    rating = serializers.FloatField()
    free = serializers.BooleanField()
    duration = serializers.CharField()
    type = serializers.CharField()


class InternshipOpportunitySerializer(serializers.Serializer):
    """Serializer for internship opportunities"""
    title = serializers.CharField()
    company = serializers.CharField()
    location = serializers.CharField()
    salary = serializers.CharField()
    duration = serializers.CharField()
    skills = serializers.ListField(child=serializers.CharField())
    apply = serializers.CharField()
    type = serializers.CharField()
    stipend_range = serializers.ListField(child=serializers.IntegerField())
    matchScore = serializers.IntegerField()
    market_insight = serializers.CharField()
