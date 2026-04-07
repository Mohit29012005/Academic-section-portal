import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampics.settings')
django.setup()

from django.db import connection
cursor = connection.cursor()

# Drop all attendance_ai related tables
tables = connection.introspection.table_names()
to_drop = [t for t in tables if t.startswith('ai_') or 
           t in ['AI_Powered_Exam_Paper_Generator_attendancesession',
                 'attendance_ai_attendancesession', 'attendance_ai_attendancerecord',
                 'attendance_ai_faceencoding', 'attendance_ai_attendanceanomaly',
                 'attendance_ai_attendancenotification']]
print('Tables to drop:', to_drop)

for t in to_drop:
    try:
        cursor.execute(f'DROP TABLE IF EXISTS [{t}]')
        print(f'  Dropped: {t}')
    except Exception as e:
        print(f'  Error {t}: {e}')

# Clear migration history
cursor.execute("DELETE FROM django_migrations WHERE app='attendance_ai'")
print('Cleared django_migrations')
print('DONE')
