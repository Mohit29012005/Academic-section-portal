"""
AI Career Guidance Models
"""
from django.db import models
import uuid


class CareerSession(models.Model):
    """User sessions for career guidance"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    first_seen = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)
    total_actions = models.IntegerField(default=0)

    class Meta:
        db_table = 'career_sessions'

    def __str__(self):
        return f"Session {self.id}"


class FitAnalysis(models.Model):
    """Resume fit analysis results"""
    id = models.AutoField(primary_key=True)
    session = models.ForeignKey(CareerSession, on_delete=models.CASCADE)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True)
    match_score = models.FloatField()
    fit_prediction = models.CharField(max_length=50)
    fit_confidence = models.FloatField()
    matched_skills = models.JSONField(default=list)
    missing_skills = models.JSONField(default=list)
    resume_preview = models.TextField()
    job_preview = models.TextField()
    model_type = models.CharField(max_length=20, default='local')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fit_analyses'


class CareerRecommendation(models.Model):
    """AI Career recommendations"""
    id = models.AutoField(primary_key=True)
    session = models.ForeignKey(CareerSession, on_delete=models.CASCADE)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True)
    interests = models.JSONField(default=list)
    current_skills = models.TextField()
    experience = models.CharField(max_length=50)
    recommendations = models.JSONField(default=list)
    ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'career_recommendations'


class QuizAttempt(models.Model):
    """Quiz attempts for skill assessment"""
    id = models.AutoField(primary_key=True)
    session = models.ForeignKey(CareerSession, on_delete=models.CASCADE)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True)
    skills_tested = models.JSONField(default=list)
    total_questions = models.IntegerField()
    correct_answers = models.IntegerField()
    score_percent = models.FloatField()
    grade = models.CharField(max_length=10)
    ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'quiz_attempts'


class LearningResource(models.Model):
    """Learning resources for skills"""
    id = models.AutoField(primary_key=True)
    session = models.ForeignKey(CareerSession, on_delete=models.CASCADE)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True)
    skill_name = models.CharField(max_length=100)
    resources = models.JSONField(default=list)
    ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'learning_resources'


class InternshipSearch(models.Model):
    """Internship searches"""
    id = models.AutoField(primary_key=True)
    session = models.ForeignKey(CareerSession, on_delete=models.CASCADE)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True)
    field = models.CharField(max_length=100)
    location = models.CharField(max_length=100, blank=True)
    results = models.JSONField(default=list)
    ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'internship_searches'


class ResumeBuild(models.Model):
    """Resume builder submissions"""
    id = models.AutoField(primary_key=True)
    session = models.ForeignKey(CareerSession, on_delete=models.CASCADE)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True)
    personal_info = models.JSONField(default=dict)
    education = models.JSONField(default=list)
    experience = models.JSONField(default=list)
    skills = models.JSONField(default=list)
    resume_format = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'resume_builds'
