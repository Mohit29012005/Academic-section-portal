from django.db import models


class GeneratedPaper(models.Model):
    semester = models.IntegerField()
    subject_code = models.CharField(max_length=50)
    subject_name = models.CharField(max_length=150)
    exam_type = models.CharField(max_length=50)
    total_marks = models.IntegerField(default=60)
    
    # Store complete generated JSON in DB
    paper_data = models.JSONField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject_code} - Sem {self.semester} ({self.exam_type})"
