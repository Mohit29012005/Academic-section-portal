"""
Seed GANPAT University DCS Timetable Data - DUAL SHIFT SYSTEM
Morning Shift: 8:00 AM - 1:00 PM (BTECH + Masters)
Noon Shift: 12:00 PM - 6:10 PM (BCA + BSc)
"""

import os
import sys
import django
from datetime import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ampics.settings")
django.setup()

from academics.models import TimeSlot, Shift, BreakSlot, DayType, Course


def seed_timetable_data():
    print("=" * 70)
    print("SEEDING GANPAT DCS TIMETABLE DATA - DUAL SHIFT SYSTEM")
    print("=" * 70)

    # Clear existing data
    TimeSlot.objects.all().delete()
    Shift.objects.all().delete()
    BreakSlot.objects.all().delete()
    DayType.objects.all().delete()
    print("Cleared existing timetable data\n")

    # Create Day Types
    print("Creating Day Types...")
    weekday, _ = DayType.objects.get_or_create(
        day_type="weekday",
        defaults={
            "name": "Weekday (Mon-Fri)",
            "has_full_day": True,
            "campus_branch": "Both",
            "is_active": True,
        },
    )
    saturday, _ = DayType.objects.get_or_create(
        day_type="saturday",
        defaults={
            "name": "Saturday",
            "has_full_day": True,
            "campus_branch": "Both",
            "is_active": True,
        },
    )
    print(f"  Created: {weekday.name}, {saturday.name}\n")

    # Create Shifts
    print("Creating Shifts...")

    # Morning Shift (BTECH + Masters)
    morning_shift, _ = Shift.objects.get_or_create(
        code="MORNING",
        defaults={
            "name": "Morning Shift",
            "start_time": time(8, 0),
            "end_time": time(13, 0),
            "campus_branch": "Kherva",
            "is_active": True,
            "display_order": 1,
        },
    )

    # Noon Shift (BCA + BSc)
    noon_shift, _ = Shift.objects.get_or_create(
        code="NOON",
        defaults={
            "name": "Noon Shift",
            "start_time": time(12, 0),
            "end_time": time(18, 10),
            "campus_branch": "Kherva",
            "is_active": True,
            "display_order": 2,
        },
    )

    print(f"  Morning Shift: {morning_shift.start_time} - {morning_shift.end_time}")
    print(f"  Noon Shift: {noon_shift.start_time} - {noon_shift.end_time}\n")

    # Create Break Slots
    print("Creating Break Slots...")

    # Morning Break (Short tea break)
    BreakSlot.objects.get_or_create(
        name="Morning Tea Break",
        defaults={
            "break_type": "Tea",
            "start_time": time(10, 0),
            "end_time": time(10, 15),
            "duration_minutes": 15,
            "campus_branch": "Kherva",
            "is_active": True,
        },
    )

    # Noon Lunch Break
    lunch_break, _ = BreakSlot.objects.get_or_create(
        name="Lunch Break",
        defaults={
            "break_type": "Lunch",
            "start_time": time(14, 20),
            "end_time": time(15, 15),
            "duration_minutes": 55,
            "campus_branch": "Kherva",
            "is_active": True,
        },
    )

    # Noon Tea Break
    tea_break, _ = BreakSlot.objects.get_or_create(
        name="Tea Break",
        defaults={
            "break_type": "Tea",
            "start_time": time(16, 10),
            "end_time": time(16, 30),
            "duration_minutes": 20,
            "campus_branch": "Kherva",
            "is_active": True,
        },
    )

    print(f"  Morning Tea: 10:00 - 10:15")
    print(f"  Noon Lunch: {lunch_break.start_time} - {lunch_break.end_time}")
    print(f"  Noon Tea: {tea_break.start_time} - {tea_break.end_time}\n")

    # Create Morning Shift Time Slots (Weekdays)
    print("Creating Morning Shift Time Slots (Mon-Fri)...")
    morning_weekday_slots = [
        (0, time(8, 0), time(8, 55), False, "Lecture", 55),
        (1, time(8, 55), time(9, 40), False, "Lecture", 45),
        (2, time(9, 40), time(10, 0), True, "Tea", 20),  # Short break
        (3, time(10, 15), time(11, 10), False, "Lecture", 55),
        (4, time(11, 10), time(12, 0), False, "Lecture", 50),
        (5, time(12, 0), time(12, 55), False, "Lecture", 55),
        (6, time(12, 55), time(13, 0), False, "Lecture", 5),  # Extended last slot
    ]

    for order, start, end, is_break, break_type, duration in morning_weekday_slots:
        ts, created = TimeSlot.objects.get_or_create(
            name=f"M-Slot {order}",
            defaults={
                "slot_order": order,
                "start_time": start,
                "end_time": end,
                "duration_minutes": duration,
                "is_break": is_break,
                "break_type": break_type if is_break else "None",
                "shift": morning_shift,
                "day_type": weekday,
                "campus_branch": "Kherva",
                "is_active": True,
            },
        )
        if created:
            print(
                f"  Created: {ts.name} ({ts.start_time}-{ts.end_time}){' [BREAK]' if is_break else ''}"
            )

    print()

    # Create Morning Shift Time Slots (Saturday - shorter)
    print("Creating Morning Shift Time Slots (Saturday)...")
    morning_saturday_slots = [
        (0, time(8, 30), time(10, 0), False, "Lecture", 90),  # Extended slot
        (1, time(10, 0), time(10, 30), False, "Lecture", 30),
        (2, time(10, 30), time(11, 30), False, "Lecture", 60),
        (3, time(11, 30), time(12, 30), False, "Lecture", 60),
    ]

    for order, start, end, is_break, break_type, duration in morning_saturday_slots:
        ts, created = TimeSlot.objects.get_or_create(
            name=f"M-Sat Slot {order}",
            defaults={
                "slot_order": order,
                "start_time": start,
                "end_time": end,
                "duration_minutes": duration,
                "is_break": is_break,
                "break_type": break_type if is_break else "None",
                "shift": morning_shift,
                "day_type": saturday,
                "campus_branch": "Kherva",
                "is_active": True,
            },
        )
        if created:
            print(
                f"  Created: {ts.name} ({ts.start_time}-{ts.end_time}){' [BREAK]' if is_break else ''}"
            )

    print()

    # Create Noon Shift Time Slots (Weekdays) - GANPAT Original
    print("Creating Noon Shift Time Slots (Mon-Fri)...")
    noon_weekday_slots = [
        (0, time(12, 0), time(12, 55), False, "Lecture", 55),
        (1, time(12, 55), time(13, 25), False, "Lecture", 30),
        (2, time(13, 25), time(14, 20), False, "Lecture", 55),
        (3, time(14, 20), time(15, 15), True, "Lunch", 55),
        (4, time(15, 15), time(16, 10), False, "Lecture", 55),
        (5, time(16, 10), time(16, 30), True, "Tea", 20),
        (6, time(16, 30), time(17, 20), False, "Lecture", 50),
        (7, time(17, 20), time(18, 10), False, "Lecture", 50),
    ]

    for order, start, end, is_break, break_type, duration in noon_weekday_slots:
        ts, created = TimeSlot.objects.get_or_create(
            name=f"N-Slot {order}",
            defaults={
                "slot_order": order + 100,  # Offset to separate from morning
                "start_time": start,
                "end_time": end,
                "duration_minutes": duration,
                "is_break": is_break,
                "break_type": break_type if is_break else "None",
                "shift": noon_shift,
                "day_type": weekday,
                "campus_branch": "Kherva",
                "is_active": True,
            },
        )
        if created:
            print(
                f"  Created: {ts.name} ({ts.start_time}-{ts.end_time}){' [BREAK]' if is_break else ''}"
            )

    print()

    # Create Noon Shift Time Slots (Saturday)
    print("Creating Noon Shift Time Slots (Saturday)...")
    noon_saturday_slots = [
        (0, time(11, 5), time(12, 55), False, "Lecture", 110),
        (1, time(12, 55), time(13, 25), False, "Lecture", 30),
        (2, time(13, 25), time(14, 20), False, "Lecture", 55),
        (3, time(14, 20), time(15, 15), True, "Lunch", 55),
        (4, time(15, 15), time(16, 10), False, "Lecture", 55),
        (5, time(16, 10), time(16, 30), True, "Tea", 20),
        (6, time(16, 30), time(17, 20), False, "Lecture", 50),
        (7, time(17, 20), time(18, 10), False, "Lecture", 50),
    ]

    for order, start, end, is_break, break_type, duration in noon_saturday_slots:
        ts, created = TimeSlot.objects.get_or_create(
            name=f"N-Sat Slot {order}",
            defaults={
                "slot_order": order + 100,
                "start_time": start,
                "end_time": end,
                "duration_minutes": duration,
                "is_break": is_break,
                "break_type": break_type if is_break else "None",
                "shift": noon_shift,
                "day_type": saturday,
                "campus_branch": "Kherva",
                "is_active": True,
            },
        )
        if created:
            print(
                f"  Created: {ts.name} ({ts.start_time}-{ts.end_time}){' [BREAK]' if is_break else ''}"
            )

    print()

    # Summary
    print("=" * 70)
    print("TIMETABLE DATA SUMMARY")
    print("=" * 70)

    print("\n--- MORNING SHIFT (BTECH + Masters) ---")
    print("Weekday (Mon-Fri):")
    for ts in TimeSlot.objects.filter(shift=morning_shift, day_type=weekday).order_by(
        "slot_order"
    ):
        print(
            f"  {ts.name:12} | {ts.start_time} - {ts.end_time} | {'[BREAK: ' + ts.break_type + ']' if ts.is_break else '[LECTURE]'}"
        )

    print("\nSaturday:")
    for ts in TimeSlot.objects.filter(shift=morning_shift, day_type=saturday).order_by(
        "slot_order"
    ):
        print(
            f"  {ts.name:12} | {ts.start_time} - {ts.end_time} | {'[BREAK: ' + ts.break_type + ']' if ts.is_break else '[LECTURE]'}"
        )

    print("\n--- NOON SHIFT (BCA + BSc) ---")
    print("Weekday (Mon-Fri):")
    for ts in TimeSlot.objects.filter(shift=noon_shift, day_type=weekday).order_by(
        "slot_order"
    ):
        print(
            f"  {ts.name:12} | {ts.start_time} - {ts.end_time} | {'[BREAK: ' + ts.break_type + ']' if ts.is_break else '[LECTURE]'}"
        )

    print("\nSaturday:")
    for ts in TimeSlot.objects.filter(shift=noon_shift, day_type=saturday).order_by(
        "slot_order"
    ):
        print(
            f"  {ts.name:12} | {ts.start_time} - {ts.end_time} | {'[BREAK: ' + ts.break_type + ']' if ts.is_break else '[LECTURE]'}"
        )

    print("\n" + "=" * 70)
    print("COURSE-SHIFT ASSIGNMENTS")
    print("=" * 70)

    # Define shift assignments
    morning_courses = [
        "BTECH-IT",
        "BTECH-CSE",
        "MCA",
        "MSC-IT",
        "MSC-IMS",
        "MSC-CYBER",
        "MSC-AIML",
    ]
    noon_courses = ["BCA", "BSC-IT", "BSC-IMS", "BSC-CYBER", "BSC-AIML"]

    print("\nMorning Shift Courses (8:00 AM - 1:00 PM):")
    for code in morning_courses:
        print(f"  - {code}")

    print("\nNoon Shift Courses (12:00 PM - 6:10 PM):")
    for code in noon_courses:
        print(f"  - {code}")

    # Update course shift assignments
    Course.objects.filter(code__in=morning_courses).update(shift="MORNING")
    Course.objects.filter(code__in=noon_courses).update(shift="NOON")

    print("\n" + "=" * 70)
    print("Done! Database seeded with dual shift system.")
    print("=" * 70)


if __name__ == "__main__":
    seed_timetable_data()
