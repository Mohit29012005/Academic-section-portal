from rest_framework import serializers
from .models import PYQGenerationRequest


class PYQGenerationRequestSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = PYQGenerationRequest
        fields = [
            'request_id', 'student', 'subject', 'subject_name', 'course',
            'course_name', 'semester', 'exam_type', 'num_questions',
            'difficulty', 'generated_pdf', 'generated_at', 'downloaded',
            'deleted_at'
        ]
        read_only_fields = ['request_id', 'generated_at']


class PYQRequestSerializer(serializers.Serializer):
    subject_id = serializers.UUIDField()
    course_id = serializers.UUIDField()
    semester = serializers.IntegerField()
    exam_type = serializers.ChoiceField(choices=['mid_term', 'end_term', 'practice'])
    num_questions = serializers.IntegerField(default=10, min_value=1, max_value=50)
    difficulty = serializers.ChoiceField(choices=['easy', 'medium', 'hard'])
