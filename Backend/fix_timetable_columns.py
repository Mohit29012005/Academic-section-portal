import os
import django

os.environ["DJANGO_SETTINGS_MODULE"] = "ampics.settings"
django.setup()

from django.db import connection

cursor = connection.cursor()

# Check current columns
cursor.execute("""
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'timetable_slots'
ORDER BY ordinal_position
""")
columns = [row[0] for row in cursor.fetchall()]
print("Current columns:", columns)

# Add missing columns
if "created_at" not in columns:
    cursor.execute("""
    ALTER TABLE timetable_slots 
    ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    """)
    print("Added created_at column")

if "updated_at" not in columns:
    cursor.execute("""
    ALTER TABLE timetable_slots 
    ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    """)
    print("Added updated_at column")

if "priority" not in columns:
    cursor.execute("""
    ALTER TABLE timetable_slots 
    ADD COLUMN priority INTEGER DEFAULT 5
    """)
    print("Added priority column")

if "is_locked" not in columns:
    cursor.execute("""
    ALTER TABLE timetable_slots 
    ADD COLUMN is_locked BOOLEAN DEFAULT FALSE
    """)
    print("Added is_locked column")

if "is_auto_generated" not in columns:
    cursor.execute("""
    ALTER TABLE timetable_slots 
    ADD COLUMN is_auto_generated BOOLEAN DEFAULT FALSE
    """)
    print("Added is_auto_generated column")

if "generated_by" not in columns:
    cursor.execute("""
    ALTER TABLE timetable_slots 
    ADD COLUMN generated_by VARCHAR(20) DEFAULT 'manual'
    """)
    print("Added generated_by column")

if "slot_type" not in columns:
    cursor.execute("""
    ALTER TABLE timetable_slots 
    ADD COLUMN slot_type VARCHAR(20) DEFAULT 'Theory'
    """)
    print("Added slot_type column")

print("Done!")
