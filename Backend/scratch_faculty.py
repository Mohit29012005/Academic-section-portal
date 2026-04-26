import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ampics.settings")
django.setup()

from users.models import Faculty

faculties = Faculty.objects.all()
print(f"Total Faculty: {faculties.count()}")
for f in faculties:
    print(f"- {f.name} (ID: {f.employee_id}, Email: {f.email}, Dept: {f.department})")
