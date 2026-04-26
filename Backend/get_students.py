import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampics.settings')
django.setup()

from users.models import Student

from django.db.models import Count
summary = Student.objects.values('course__code', 'current_semester').annotate(count=Count('student_id')).order_by('course__code', 'current_semester')
print("--- STUDENT SUMMARY ---")
for item in summary:
    print(f"Course: {item['course__code']} | Sem: {item['current_semester']} | Count: {item['count']}")
