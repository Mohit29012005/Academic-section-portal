import os
import django

os.environ["DJANGO_SETTINGS_MODULE"] = "ampics.settings"
django.setup()

from academics.models import TimetableSlot, Room, TimeSlot
from users.models import Faculty

print("=== TIMETABLE VERIFICATION ===")
print()
print(f"Total Timetable Slots: {TimetableSlot.objects.count()}")
print(f"Auto-Generated: {TimetableSlot.objects.filter(is_auto_generated=True).count()}")
print(f"Locked: {TimetableSlot.objects.filter(is_locked=True).count()}")
print()
print(f"Rooms: {Room.objects.count()}")
print(f"TimeSlots: {TimeSlot.objects.count()}")
print()
print("=== SLOT TYPE DISTRIBUTION ===")
for stype in ["Theory", "Practical", "Lab", "Tutorial"]:
    c = TimetableSlot.objects.filter(slot_type=stype).count()
    print(f"  {stype}: {c}")
print()
print("=== DAY WISE DISTRIBUTION ===")
for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]:
    c = TimetableSlot.objects.filter(day_of_week=day).count()
    print(f"  {day}: {c}")
print()
print("=== SAMPLE SLOTS ===")
for slot in TimetableSlot.objects.all()[:5]:
    print(
        f"  {slot.course.code} S{slot.semester}: {slot.subject.name} ({slot.slot_type})"
    )
    print(f"    {slot.day_of_week} {slot.start_time} - Room: {slot.room_name}")
    print(f"    Faculty: {slot.faculty.name}")
