"""
Analytics Models - Track all user sessions and feature interactions
"""

from django.db import models
from django.utils import timezone
import uuid
import json


class Session(models.Model):
    """Track user browser sessions"""
    id = models.CharField(max_length=255, primary_key=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    first_seen = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)
    total_actions = models.IntegerField(default=0)

    class Meta:
        db_table = 'analytics_session'
        ordering = ['-last_active']
        indexes = [
            models.Index(fields=['first_seen']),
            models.Index(fields=['last_active']),
        ]

    def __str__(self):
        return f"Session {self.id[:8]}... ({self.ip_address})"


class FitAnalysis(models.Model):
    """Resume fit analysis against job descriptions"""
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='fit_analyses')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    match_score = models.FloatField(null=True, blank=True)
    fit_prediction = models.CharField(max_length=50, null=True, blank=True)  # "Good Fit" / "No Fit"
    fit_confidence = models.FloatField(null=True, blank=True)
    
    matched_skills = models.TextField(default='[]', blank=True)  # JSON array as string
    missing_skills = models.TextField(default='[]', blank=True)  # JSON array as string
    
    resume_preview = models.TextField(blank=True)
    job_preview = models.TextField(blank=True)
    
    model_type = models.CharField(max_length=50, blank=True)  # "xgboost" / "fallback"
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analytics_fitanalysis'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session', 'created_at']),
        ]

    def __str__(self):
        return f"FitAnalysis {self.id} - Score: {self.match_score}"


class CareerSearch(models.Model):
    """Career path recommendation searches"""
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='career_searches')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    interests = models.TextField(default='[]', blank=True)  # JSON array
    current_skills = models.TextField(blank=True)
    experience = models.CharField(max_length=50, blank=True)  # "fresher", "junior", etc.
    
    result_count = models.IntegerField(default=0)
    ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analytics_careersearch'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session', 'created_at']),
        ]

    def __str__(self):
        return f"CareerSearch {self.id} - {', '.join(self.interests)}"


class QuizAttempt(models.Model):
    """Skill quiz attempts"""
    GRADE_CHOICES = [
        ('Beginner', 'Beginner'),
        ('Learner', 'Learner'),
        ('Proficient', 'Proficient'),
        ('Expert', 'Expert'),
    ]
    
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='quiz_attempts')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    skills_tested = models.TextField(default='[]', blank=True)  # JSON array
    total_questions = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    score_percent = models.FloatField(default=0.0)
    grade = models.CharField(max_length=20, choices=GRADE_CHOICES, default='Beginner')
    
    ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analytics_quizattempt'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session', 'created_at']),
        ]

    def __str__(self):
        return f"QuizAttempt {self.id} - Score: {self.score_percent}%"


class LearningRequest(models.Model):
    """Learning resource recommendations"""
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='learning_requests')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    topics = models.TextField(default='[]', blank=True)  # JSON array
    free_only = models.BooleanField(default=False)
    resource_count = models.IntegerField(default=0)
    
    ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analytics_learningrequest'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session', 'created_at']),
        ]

    def __str__(self):
        return f"LearningRequest {self.id} - Topics: {', '.join(self.topics)}"


class InternshipSearch(models.Model):
    """Internship finder queries"""
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='internship_searches')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    location = models.CharField(max_length=100, blank=True)
    domain = models.CharField(max_length=100, blank=True)
    min_stipend = models.IntegerField(default=0)
    max_stipend = models.IntegerField(default=999999)
    skills = models.TextField(default='[]', blank=True)  # JSON array
    
    result_count = models.IntegerField(default=0)
    ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analytics_internshipsearch'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session', 'created_at']),
        ]

    def __str__(self):
        return f"InternshipSearch {self.id} - {self.location}"


class ResumeBuild(models.Model):
    """Resume builder submissions"""
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='resume_builds')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    full_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    skills = models.TextField(default='[]', blank=True)  # JSON array
    
    exp_count = models.IntegerField(default=0)
    edu_count = models.IntegerField(default=0)
    project_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analytics_resumebuild'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session', 'created_at']),
        ]

    def __str__(self):
        return f"ResumeBuild {self.id} - {self.full_name}"
