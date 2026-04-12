import os
import django

os.environ["DJANGO_SETTINGS_MODULE"] = "ampics.settings"
django.setup()

from django.db import connection

cursor = connection.cursor()

print("Fixing room column constraint...")

# Make the old 'room' column nullable
cursor.execute("ALTER TABLE timetable_slots ALTER COLUMN room DROP NOT NULL")
print("[OK] Made room column nullable")

# Update room_name from room for existing data
cursor.execute("""
UPDATE timetable_slots 
SET room_name = room 
WHERE room_name IS NULL AND room IS NOT NULL
""")
print("[OK] Updated room_name from room")

print("\n[SUCCESS] All fixes applied!")
