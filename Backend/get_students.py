import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampics.settings')
django.setup()

from users.models import Student

print("--- STUDENTS ---")
for s in Student.objects.all()[:10]:
    print(f"Name: {s.name} | Enrollment: {s.enrollment_no} | Email: {s.email}")
