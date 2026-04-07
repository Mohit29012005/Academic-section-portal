"""
AI Career Guidance Serializers
"""
from rest_framework import serializers
from .models import (
    CareerSession, FitAnalysis, CareerRecommendation,
    QuizAttempt, LearningResource, InternshipSearch, ResumeBuild
)


class CareerSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerSession
        fields = '__all__'


class FitAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = FitAnalysis
        fields = '__all__'
        read_only_fields = ['created_at']


class FitAnalysisRequestSerializer(serializers.Serializer):
    resume_text = serializers.CharField(required=False, allow_blank=True)
    job_description = serializers.CharField(required=False, allow_blank=True)
    session_id = serializers.UUIDField(required=False)


class CareerRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerRecommendation
        fields = '__all__'
        read_only_fields = ['created_at']


class CareerRecommendationRequestSerializer(serializers.Serializer):
    interests = serializers.ListField(child=serializers.CharField(), required=False)
    current_skills = serializers.CharField(required=False, allow_blank=True)
    experience = serializers.ChoiceField(choices=['beginner', 'intermediate', 'advanced'], required=False)
    session_id = serializers.UUIDField(required=False)


class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = '__all__'
        read_only_fields = ['created_at']


class QuizRequestSerializer(serializers.Serializer):
    skill = serializers.CharField()
    difficulty = serializers.ChoiceField(choices=['beginner', 'intermediate', 'advanced'], default='intermediate')
    num_questions = serializers.IntegerField(default=5)
    session_id = serializers.UUIDField(required=False)


class QuizSubmissionSerializer(serializers.Serializer):
    answers = serializers.DictField(child=serializers.CharField())
    session_id = serializers.UUIDField(required=False)


class LearningResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningResource
        fields = '__all__'
        read_only_fields = ['created_at']


class LearningResourceRequestSerializer(serializers.Serializer):
    skill = serializers.CharField()
    level = serializers.ChoiceField(choices=['beginner', 'intermediate', 'advanced'], default='beginner')
    session_id = serializers.UUIDField(required=False)


class InternshipSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternshipSearch
        fields = '__all__'
        read_only_fields = ['created_at']


class InternshipSearchRequestSerializer(serializers.Serializer):
    field = serializers.CharField()
    location = serializers.CharField(required=False, allow_blank=True)
    session_id = serializers.UUIDField(required=False)


class ResumeBuildSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeBuild
        fields = '__all__'
        read_only_fields = ['created_at']


class ResumeBuildRequestSerializer(serializers.Serializer):
    personal_info = serializers.DictField()
    education = serializers.ListField(required=False)
    experience = serializers.ListField(required=False)
    skills = serializers.ListField(required=False)
    format = serializers.ChoiceField(choices=['pdf', 'docx', 'txt'], default='pdf')
    session_id = serializers.UUIDField(required=False)
