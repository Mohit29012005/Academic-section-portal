import os
import django

os.environ["DJANGO_SETTINGS_MODULE"] = "ampics.settings"
django.setup()

from django.db import connection

cursor = connection.cursor()

print("Fixing timetable_slots constraints...")

# Make room_id nullable (remove NOT NULL constraint)
try:
    cursor.execute("""
    ALTER TABLE timetable_slots 
    ALTER COLUMN room_id DROP NOT NULL
    """)
    print("[OK] Made room_id nullable")
except Exception as e:
    print(f"[WARN] room_id: {e}")

# Check if room_id has foreign key constraint
try:
    cursor.execute("""
    SELECT constraint_name FROM information_schema.table_constraints 
    WHERE table_name = 'timetable_slots' 
    AND constraint_type = 'FOREIGN KEY'
    AND column_name = 'room_id'
    """)
    result = cursor.fetchone()
    if result:
        print(f"[INFO] Dropping FK constraint: {result[0]}")
        cursor.execute(f"DROP CONSTRAINT IF EXISTS {result[0]}")
        print("[OK] FK constraint dropped")
except Exception as e:
    print(f"[WARN] FK check: {e}")

# Verify
cursor.execute("""
SELECT column_name, is_nullable FROM information_schema.columns 
WHERE table_name = 'timetable_slots' AND column_name = 'room_id'
""")
result = cursor.fetchone()
if result:
    print(f"[INFO] room_id column: nullable={result[1]}")

print("\n[SUCCESS] Constraints fixed!")
