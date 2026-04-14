import os
import django
from datetime import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampics.settings')
django.setup()

from academics.models import Shift, DayType, TimeSlot

def seed_meta():
    print("Seeding Timetable Metadata...")

    # 1. Create DayTypes
    weekday, _ = DayType.objects.get_or_create(
        day_type="weekday",
        defaults={"name": "Weekday (Mon-Fri)", "has_full_day": True}
    )
    saturday, _ = DayType.objects.get_or_create(
        day_type="saturday",
        defaults={"name": "Saturday", "has_full_day": False}
    )

    # 2. Create Shifts
    morning_shift, _ = Shift.objects.get_or_create(
        code="MORNING",
        defaults={
            "name": "Morning Shift (UG)",
            "start_time": "08:00",
            "end_time": "13:00",
            "campus_branch": "Kherva"
        }
    )
    noon_shift, _ = Shift.objects.get_or_create(
        code="NOON",
        defaults={
            "name": "Noon Shift (PG)",
            "start_time": "12:00",
            "end_time": "18:10",
            "campus_branch": "Kherva"
        }
    )

    # 3. Create TimeSlots (Monday-Friday & Saturday)
    # Morning Slots
    morning_timings = [
        (1, "08:00", "08:55"),
        (2, "08:55", "09:40"),
        (3, "10:15", "11:10"),
        (4, "11:10", "12:00"),
        (5, "12:00", "12:55"),
    ]

    # Noon Slots
    noon_timings = [
        (1, "12:00", "12:55"),
        (2, "13:25", "14:20"),
        (3, "15:15", "16:10"),
        (4, "16:30", "17:20"),
        (5, "17:20", "18:10"),
    ]

    def parse_time(t_str):
        h, m = map(int, t_str.split(':'))
        return time(h, m)

    for day_obj in [weekday, saturday]:
        # Morning Shift Slots
        for order, start, end in morning_timings:
            # Saturday only has 4 slots as per plan
            if day_obj.day_type == "saturday" and order > 4:
                continue
            
            TimeSlot.objects.get_or_create(
                shift=morning_shift,
                day_type=day_obj,
                slot_order=order,
                defaults={
                    "name": f"Slot {order}",
                    "start_time": parse_time(start),
                    "end_time": parse_time(end),
                    "duration_minutes": 60,
                    "campus_branch": "Kherva"
                }
            )

        # Noon Shift Slots
        for order, start, end in noon_timings:
            if day_obj.day_type == "saturday" and order > 4:
                continue

            TimeSlot.objects.get_or_create(
                shift=noon_shift,
                day_type=day_obj,
                slot_order=order,
                defaults={
                    "name": f"Slot {order}",
                    "start_time": parse_time(start),
                    "end_time": parse_time(end),
                    "duration_minutes": 60,
                    "campus_branch": "Kherva"
                }
            )

    print("Successfully seeded DayTypes, Shifts, and TimeSlots.")

if __name__ == "__main__":
    seed_meta()
