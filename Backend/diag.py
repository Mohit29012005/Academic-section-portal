import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampics.settings')
django.setup()
from django.db import connection
cursor = connection.cursor()
tables = connection.introspection.table_names()
ai_tables = [t for t in tables if 'ai_' in t]
print('AI tables:', ai_tables)
# Try to query each model
from attendance_ai.models import StudentProfile, FaceEncoding, LectureSession, AttendanceRecord, AttendanceAnomaly, AttendanceNotification
for model in [StudentProfile, FaceEncoding, LectureSession, AttendanceRecord, AttendanceAnomaly, AttendanceNotification]:
    try:
        count = model.objects.count()
        print(f'{model.__name__}: OK (count={count})')
    except Exception as e:
        print(f'{model.__name__}: ERROR - {e}')
