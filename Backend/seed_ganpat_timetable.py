"""
GANPAT University DCS - Complete Timetable Seeder
Based on actual GANPAT timetable format shared by user
"""

import os
import sys
import django
from datetime import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ampics.settings")
django.setup()

from academics.models import (
    Course,
    Subject,
    TimetableSlot,
    TimeSlot,
    Shift,
    DayType,
    Room,
)
from users.models import Faculty


def seed_ganpat_timetable():
    print("=" * 80)
    print("SEEDING GANPAT DCS TIMETABLE - ACTUAL DATA")
    print("=" * 80)

    # Clear existing timetable
    TimetableSlot.objects.filter(is_auto_generated=False).delete()
    print("Cleared existing timetable data\n")

    # Get shifts
    morning_shift = Shift.objects.filter(code="MORNING").first()
    noon_shift = Shift.objects.filter(code="NOON").first()

    # Get day types
    weekday = DayType.objects.filter(day_type="weekday").first()
    saturday = DayType.objects.filter(day_type="saturday").first()

    # Get all faculty
    faculty_map = {}
    for f in Faculty.objects.all():
        faculty_map[f.employee_id] = f
        faculty_map[f.name] = f

    # Add short code mappings (from GANPAT timetable)
    # HCP, RRS, JDP, DBB, BRP, KCP, NIP, PDP, NKD, JND, BBP, PA, DKR, CP, DK, JNP - These are in GANPAT format
    # Map to actual faculty
    short_code_map = {
        # BCA Timetable Faculty
        "HCP": "FAC003",  # Bhavesh Patel
        "RRS": "FAC005",  # Hiral Prajapati
        "JDP": "FAC002",  # Jignesh Patel
        "DBB": "FAC004",  # Jagruti Patel
        "BRP": "FAC006",  # Bharat Patel
        "KCP": "FAC004",  # Jagruti Patel
        "NIP": "FAC009",  # Meghna Patel
        "PDP": "FAC010",  # Jyotindra Dharva
        "NKD": "FAC010",  # Jyotindra Dharva
        "JND": "FAC010",  # Jyotindra Dharva
        "BBP": "FAC008",  # Chetna Patel
        "PA": "FAC008",  # Chetna Patel
        "DKR": "FAC007",  # Kashyap Patel
        "CP": "FAC007",  # Kashyap Patel
        "DK": "FAC006",  # Bharat Patel
        "JNP": "FAC009",  # Meghna Patel
    }

    # Add short codes to faculty_map
    for short_code, emp_id in short_code_map.items():
        if emp_id in faculty_map:
            faculty_map[short_code] = faculty_map[emp_id]

    print("Faculty loaded:", list(faculty_map.keys()))
    print("Short codes:", list(short_code_map.keys()))

    # Get all courses
    courses = Course.objects.filter(status="Active")
    print("Courses:", [c.code for c in courses])

    # =====================================================================
    # BCA-I (Noon Shift) - Room A-101
    # =====================================================================
    bca1 = courses.filter(code="BCA").first()
    if bca1:
        print("\n--- BCA Semester 1 (Noon Shift) ---")

        bca1_slots = [
            # Monday
            {
                "day": "Monday",
                "slot_order": 0,
                "start": "12:00",
                "end": "12:55",
                "subject": "WD1",
                "faculty": "HCP",
            },
            {
                "day": "Monday",
                "slot_order": 1,
                "start": "12:55",
                "end": "13:25",
                "subject": "ITS",
                "faculty": "RRS",
            },
            {
                "day": "Monday",
                "slot_order": 2,
                "start": "13:25",
                "end": "14:20",
                "subject": "DADM",
                "faculty": "JDP",
            },
            {
                "day": "Monday",
                "slot_order": 4,
                "start": "15:15",
                "end": "16:10",
                "subject": "ADP1",
                "faculty": "DBB",
            },
            {
                "day": "Monday",
                "slot_order": 6,
                "start": "16:30",
                "end": "17:20",
                "subject": "WD1",
                "faculty": "HCP",
            },
            {
                "day": "Monday",
                "slot_order": 7,
                "start": "17:20",
                "end": "18:10",
                "subject": "ITS",
                "faculty": "RRS",
            },
            # Tuesday
            {
                "day": "Tuesday",
                "slot_order": 0,
                "start": "12:00",
                "end": "12:55",
                "subject": "CS1",
                "faculty": "BRP",
            },
            {
                "day": "Tuesday",
                "slot_order": 1,
                "start": "12:55",
                "end": "13:25",
                "subject": "ADP1",
                "faculty": "DBB",
            },
            {
                "day": "Tuesday",
                "slot_order": 2,
                "start": "13:25",
                "end": "14:20",
                "subject": "DADM",
                "faculty": "JDP",
            },
            {
                "day": "Tuesday",
                "slot_order": 4,
                "start": "15:15",
                "end": "16:10",
                "subject": "IDE",
                "faculty": "HCP",
            },
            {
                "day": "Tuesday",
                "slot_order": 6,
                "start": "16:30",
                "end": "17:20",
                "subject": "DADM",
                "faculty": "JDP",
            },
            {
                "day": "Tuesday",
                "slot_order": 7,
                "start": "17:20",
                "end": "18:10",
                "subject": "CS1",
                "faculty": "BRP",
            },
            # Wednesday
            {
                "day": "Wednesday",
                "slot_order": 0,
                "start": "12:00",
                "end": "12:55",
                "subject": "CS1",
                "faculty": "BRP",
            },
            {
                "day": "Wednesday",
                "slot_order": 1,
                "start": "12:55",
                "end": "13:25",
                "subject": "DADM",
                "faculty": "JDP",
            },
            {
                "day": "Wednesday",
                "slot_order": 2,
                "start": "13:25",
                "end": "14:20",
                "subject": "ITS",
                "faculty": "RRS",
            },
            {
                "day": "Wednesday",
                "slot_order": 4,
                "start": "15:15",
                "end": "16:10",
                "subject": "WD1",
                "faculty": "HCP",
            },
            {
                "day": "Wednesday",
                "slot_order": 6,
                "start": "16:30",
                "end": "17:20",
                "subject": "ADP1",
                "faculty": "DBB",
            },
            {
                "day": "Wednesday",
                "slot_order": 7,
                "start": "17:20",
                "end": "18:10",
                "subject": "ITS",
                "faculty": "RRS",
            },
            # Thursday
            {
                "day": "Thursday",
                "slot_order": 0,
                "start": "12:00",
                "end": "12:55",
                "subject": "IDE",
                "faculty": "HCP",
            },
            {
                "day": "Thursday",
                "slot_order": 1,
                "start": "12:55",
                "end": "13:25",
                "subject": "CS1",
                "faculty": "BRP",
            },
            {
                "day": "Thursday",
                "slot_order": 2,
                "start": "13:25",
                "end": "14:20",
                "subject": "DADM",
                "faculty": "JDP",
            },
            {
                "day": "Thursday",
                "slot_order": 4,
                "start": "15:15",
                "end": "16:10",
                "subject": "ADP1",
                "faculty": "DBB",
            },
            {
                "day": "Thursday",
                "slot_order": 6,
                "start": "16:30",
                "end": "17:20",
                "subject": "DADM",
                "faculty": "JDP",
            },
            {
                "day": "Thursday",
                "slot_order": 7,
                "start": "17:20",
                "end": "18:10",
                "subject": "IDE",
                "faculty": "HCP",
            },
            # Friday
            {
                "day": "Friday",
                "slot_order": 0,
                "start": "12:00",
                "end": "12:55",
                "subject": "ITS",
                "faculty": "RRS",
            },
            {
                "day": "Friday",
                "slot_order": 1,
                "start": "12:55",
                "end": "13:25",
                "subject": "IDE",
                "faculty": "HCP",
            },
            {
                "day": "Friday",
                "slot_order": 2,
                "start": "13:25",
                "end": "14:20",
                "subject": "WD1",
                "faculty": "HCP",
            },
            {
                "day": "Friday",
                "slot_order": 4,
                "start": "15:15",
                "end": "16:10",
                "subject": "CS1",
                "faculty": "BRP",
            },
            {
                "day": "Friday",
                "slot_order": 6,
                "start": "16:30",
                "end": "17:20",
                "subject": "ITS",
                "faculty": "RRS",
            },
            {
                "day": "Friday",
                "slot_order": 7,
                "start": "17:20",
                "end": "18:10",
                "subject": "ENS",
                "faculty": "BRP",
            },
            # Saturday
            {
                "day": "Saturday",
                "slot_order": 0,
                "start": "11:05",
                "end": "12:55",
                "subject": "ADP1",
                "faculty": "DBB",
            },
            {
                "day": "Saturday",
                "slot_order": 1,
                "start": "12:55",
                "end": "13:25",
                "subject": "IDE",
                "faculty": "HCP",
            },
            {
                "day": "Saturday",
                "slot_order": 2,
                "start": "13:25",
                "end": "14:20",
                "subject": "WD1",
                "faculty": "HCP",
            },
            {
                "day": "Saturday",
                "slot_order": 4,
                "start": "15:15",
                "end": "16:10",
                "subject": "DADM",
                "faculty": "JDP",
            },
            {
                "day": "Saturday",
                "slot_order": 6,
                "start": "16:30",
                "end": "17:20",
                "subject": "CS1",
                "faculty": "BRP",
            },
        ]

        create_timetable_slots(bca1, 1, bca1_slots, "A-101", faculty_map)

    # =====================================================================
    # MCA-I (Morning Shift) - Room C-201
    # =====================================================================
    mca1 = courses.filter(code="MCA").first()
    if mca1:
        print("\n--- MCA Semester 1 (Morning Shift) ---")

        mca1_slots = [
            # Monday
            {
                "day": "Monday",
                "slot_order": 0,
                "start": "08:00",
                "end": "08:55",
                "subject": "PP",
                "faculty": "BBP",
            },
            {
                "day": "Monday",
                "slot_order": 1,
                "start": "08:55",
                "end": "09:40",
                "subject": "FM",
                "faculty": "PA",
            },
            {
                "day": "Monday",
                "slot_order": 3,
                "start": "10:15",
                "end": "11:10",
                "subject": "DMS",
                "faculty": "PDP",
            },
            {
                "day": "Monday",
                "slot_order": 4,
                "start": "11:10",
                "end": "12:00",
                "subject": "JP",
                "faculty": "NKD",
            },
            {
                "day": "Monday",
                "slot_order": 5,
                "start": "12:00",
                "end": "12:55",
                "subject": "LFM",
                "faculty": "JND",
            },
            # Tuesday
            {
                "day": "Tuesday",
                "slot_order": 0,
                "start": "08:00",
                "end": "08:55",
                "subject": "JP",
                "faculty": "NKD",
            },
            {
                "day": "Tuesday",
                "slot_order": 1,
                "start": "08:55",
                "end": "09:40",
                "subject": "PP",
                "faculty": "BBP",
            },
            {
                "day": "Tuesday",
                "slot_order": 3,
                "start": "10:15",
                "end": "11:10",
                "subject": "FM",
                "faculty": "PA",
            },
            {
                "day": "Tuesday",
                "slot_order": 4,
                "start": "11:10",
                "end": "12:00",
                "subject": "LFM",
                "faculty": "JND",
            },
            {
                "day": "Tuesday",
                "slot_order": 5,
                "start": "12:00",
                "end": "12:55",
                "subject": "DMS",
                "faculty": "PDP",
            },
            # Wednesday
            {
                "day": "Wednesday",
                "slot_order": 0,
                "start": "08:00",
                "end": "08:55",
                "subject": "DMS",
                "faculty": "PDP",
            },
            {
                "day": "Wednesday",
                "slot_order": 1,
                "start": "08:55",
                "end": "09:40",
                "subject": "JP",
                "faculty": "NKD",
            },
            {
                "day": "Wednesday",
                "slot_order": 3,
                "start": "10:15",
                "end": "11:10",
                "subject": "PP",
                "faculty": "BBP",
            },
            {
                "day": "Wednesday",
                "slot_order": 4,
                "start": "11:10",
                "end": "12:00",
                "subject": "FM",
                "faculty": "PA",
            },
            {
                "day": "Wednesday",
                "slot_order": 5,
                "start": "12:00",
                "end": "12:55",
                "subject": "JP",
                "faculty": "NKD",
            },
            # Thursday
            {
                "day": "Thursday",
                "slot_order": 0,
                "start": "08:00",
                "end": "08:55",
                "subject": "LFM",
                "faculty": "JND",
            },
            {
                "day": "Thursday",
                "slot_order": 1,
                "start": "08:55",
                "end": "09:40",
                "subject": "DMS",
                "faculty": "PDP",
            },
            {
                "day": "Thursday",
                "slot_order": 3,
                "start": "10:15",
                "end": "11:10",
                "subject": "JP",
                "faculty": "NKD",
            },
            {
                "day": "Thursday",
                "slot_order": 4,
                "start": "11:10",
                "end": "12:00",
                "subject": "PP",
                "faculty": "BBP",
            },
            {
                "day": "Thursday",
                "slot_order": 5,
                "start": "12:00",
                "end": "12:55",
                "subject": "FM",
                "faculty": "PA",
            },
            # Friday
            {
                "day": "Friday",
                "slot_order": 0,
                "start": "08:00",
                "end": "08:55",
                "subject": "FM",
                "faculty": "PA",
            },
            {
                "day": "Friday",
                "slot_order": 1,
                "start": "08:55",
                "end": "09:40",
                "subject": "LFM",
                "faculty": "JND",
            },
            {
                "day": "Friday",
                "slot_order": 3,
                "start": "10:15",
                "end": "11:10",
                "subject": "DMS",
                "faculty": "PDP",
            },
            {
                "day": "Friday",
                "slot_order": 4,
                "start": "11:10",
                "end": "12:00",
                "subject": "JP",
                "faculty": "NKD",
            },
            {
                "day": "Friday",
                "slot_order": 5,
                "start": "12:00",
                "end": "12:55",
                "subject": "PP",
                "faculty": "BBP",
            },
            # Saturday
            {
                "day": "Saturday",
                "slot_order": 0,
                "start": "08:30",
                "end": "10:00",
                "subject": "AI",
                "faculty": "NIP",
            },
            {
                "day": "Saturday",
                "slot_order": 1,
                "start": "10:00",
                "end": "10:30",
                "subject": "ML1",
                "faculty": "DKR",
            },
            {
                "day": "Saturday",
                "slot_order": 2,
                "start": "10:30",
                "end": "11:30",
                "subject": "BDS",
                "faculty": "BBP",
            },
            {
                "day": "Saturday",
                "slot_order": 3,
                "start": "11:30",
                "end": "12:30",
                "subject": "PYT",
                "faculty": "PDP",
            },
        ]

        create_timetable_slots(mca1, 1, mca1_slots, "C-201", faculty_map)

    # =====================================================================
    # BSc-IT-I (Noon Shift) - Room A-104
    # =====================================================================
    bscit1 = courses.filter(code="BSC-IT").first()
    if bscit1:
        print("\n--- BSc-IT Semester 1 (Noon Shift) ---")

        bscit1_slots = [
            # Monday
            {
                "day": "Monday",
                "slot_order": 0,
                "start": "12:00",
                "end": "12:55",
                "subject": "WD1",
                "faculty": "HCP",
            },
            {
                "day": "Monday",
                "slot_order": 1,
                "start": "12:55",
                "end": "13:25",
                "subject": "ITS",
                "faculty": "RRS",
            },
            {
                "day": "Monday",
                "slot_order": 2,
                "start": "13:25",
                "end": "14:20",
                "subject": "SAM",
                "faculty": "KCP",
            },
            {
                "day": "Monday",
                "slot_order": 4,
                "start": "15:15",
                "end": "16:10",
                "subject": "DADM",
                "faculty": "DBB",
            },
            {
                "day": "Monday",
                "slot_order": 6,
                "start": "16:30",
                "end": "17:20",
                "subject": "ADP",
                "faculty": "BRP",
            },
            # Tuesday
            {
                "day": "Tuesday",
                "slot_order": 0,
                "start": "12:00",
                "end": "12:55",
                "subject": "CS1",
                "faculty": "BRP",
            },
            {
                "day": "Tuesday",
                "slot_order": 1,
                "start": "12:55",
                "end": "13:25",
                "subject": "ADP",
                "faculty": "DBB",
            },
            {
                "day": "Tuesday",
                "slot_order": 2,
                "start": "13:25",
                "end": "14:20",
                "subject": "DADM",
                "faculty": "DBB",
            },
            {
                "day": "Tuesday",
                "slot_order": 4,
                "start": "15:15",
                "end": "16:10",
                "subject": "SAM",
                "faculty": "KCP",
            },
            {
                "day": "Tuesday",
                "slot_order": 6,
                "start": "16:30",
                "end": "17:20",
                "subject": "ITS",
                "faculty": "RRS",
            },
            # Wednesday
            {
                "day": "Wednesday",
                "slot_order": 0,
                "start": "12:00",
                "end": "12:55",
                "subject": "CS1",
                "faculty": "BRP",
            },
            {
                "day": "Wednesday",
                "slot_order": 1,
                "start": "12:55",
                "end": "13:25",
                "subject": "DADM",
                "faculty": "DBB",
            },
            {
                "day": "Wednesday",
                "slot_order": 2,
                "start": "13:25",
                "end": "14:20",
                "subject": "ITS",
                "faculty": "RRS",
            },
            {
                "day": "Wednesday",
                "slot_order": 4,
                "start": "15:15",
                "end": "16:10",
                "subject": "WD1",
                "faculty": "HCP",
            },
            {
                "day": "Wednesday",
                "slot_order": 6,
                "start": "16:30",
                "end": "17:20",
                "subject": "ADP",
                "faculty": "DBB",
            },
            # Thursday
            {
                "day": "Thursday",
                "slot_order": 0,
                "start": "12:00",
                "end": "12:55",
                "subject": "SAM",
                "faculty": "KCP",
            },
            {
                "day": "Thursday",
                "slot_order": 1,
                "start": "12:55",
                "end": "13:25",
                "subject": "CS1",
                "faculty": "BRP",
            },
            {
                "day": "Thursday",
                "slot_order": 2,
                "start": "13:25",
                "end": "14:20",
                "subject": "DADM",
                "faculty": "DBB",
            },
            {
                "day": "Thursday",
                "slot_order": 4,
                "start": "15:15",
                "end": "16:10",
                "subject": "ADP",
                "faculty": "DBB",
            },
            {
                "day": "Thursday",
                "slot_order": 6,
                "start": "16:30",
                "end": "17:20",
                "subject": "WD1",
                "faculty": "HCP",
            },
            # Friday
            {
                "day": "Friday",
                "slot_order": 0,
                "start": "12:00",
                "end": "12:55",
                "subject": "ITS",
                "faculty": "RRS",
            },
            {
                "day": "Friday",
                "slot_order": 1,
                "start": "12:55",
                "end": "13:25",
                "subject": "SAM",
                "faculty": "KCP",
            },
            {
                "day": "Friday",
                "slot_order": 2,
                "start": "13:25",
                "end": "14:20",
                "subject": "WD1",
                "faculty": "HCP",
            },
            {
                "day": "Friday",
                "slot_order": 4,
                "start": "15:15",
                "end": "16:10",
                "subject": "CS1",
                "faculty": "BRP",
            },
            {
                "day": "Friday",
                "slot_order": 6,
                "start": "16:30",
                "end": "17:20",
                "subject": "ENS",
                "faculty": "KCP",
            },
        ]

        create_timetable_slots(bscit1, 1, bscit1_slots, "A-104", faculty_map)

    # =====================================================================
    # BSc-IT-V (Noon Shift) - Room A-106
    # =====================================================================
    if bscit1:
        print("\n--- BSc-IT Semester 5 (Noon Shift) ---")

        bscit5_slots = [
            # Monday
            {
                "day": "Monday",
                "slot_order": 0,
                "start": "12:00",
                "end": "12:55",
                "subject": "WPF",
                "faculty": "CP",
            },
            {
                "day": "Monday",
                "slot_order": 1,
                "start": "12:55",
                "end": "13:25",
                "subject": "WPF",
                "faculty": "CP",
            },
            {
                "day": "Monday",
                "slot_order": 2,
                "start": "13:25",
                "end": "14:20",
                "subject": "OPS",
                "faculty": "DK",
            },
            {
                "day": "Monday",
                "slot_order": 4,
                "start": "15:15",
                "end": "16:10",
                "subject": "IML",
                "faculty": "CP",
            },
            {
                "day": "Monday",
                "slot_order": 6,
                "start": "16:30",
                "end": "17:20",
                "subject": "STQ",
                "faculty": "DK",
            },
            # Tuesday
            {
                "day": "Tuesday",
                "slot_order": 0,
                "start": "12:00",
                "end": "12:55",
                "subject": "IML",
                "faculty": "CP",
            },
            {
                "day": "Tuesday",
                "slot_order": 1,
                "start": "12:55",
                "end": "13:25",
                "subject": "SAD",
                "faculty": "JNP",
            },
            {
                "day": "Tuesday",
                "slot_order": 2,
                "start": "13:25",
                "end": "14:20",
                "subject": "WPF",
                "faculty": "CP",
            },
            {
                "day": "Tuesday",
                "slot_order": 4,
                "start": "15:15",
                "end": "16:10",
                "subject": "OPS",
                "faculty": "DK",
            },
            {
                "day": "Tuesday",
                "slot_order": 6,
                "start": "16:30",
                "end": "17:20",
                "subject": "IML",
                "faculty": "CP",
            },
            # Wednesday
            {
                "day": "Wednesday",
                "slot_order": 0,
                "start": "12:00",
                "end": "12:55",
                "subject": "STQ",
                "faculty": "DK",
            },
            {
                "day": "Wednesday",
                "slot_order": 1,
                "start": "12:55",
                "end": "13:25",
                "subject": "OPS",
                "faculty": "DK",
            },
            {
                "day": "Wednesday",
                "slot_order": 2,
                "start": "13:25",
                "end": "14:20",
                "subject": "IML",
                "faculty": "CP",
            },
            {
                "day": "Wednesday",
                "slot_order": 4,
                "start": "15:15",
                "end": "16:10",
                "subject": "SAD",
                "faculty": "JNP",
            },
            {
                "day": "Wednesday",
                "slot_order": 6,
                "start": "16:30",
                "end": "17:20",
                "subject": "WPF",
                "faculty": "CP",
            },
            # Thursday
            {
                "day": "Thursday",
                "slot_order": 0,
                "start": "12:00",
                "end": "12:55",
                "subject": "SAD",
                "faculty": "JNP",
            },
            {
                "day": "Thursday",
                "slot_order": 1,
                "start": "12:55",
                "end": "13:25",
                "subject": "WPF",
                "faculty": "CP",
            },
            {
                "day": "Thursday",
                "slot_order": 2,
                "start": "13:25",
                "end": "14:20",
                "subject": "OPS",
                "faculty": "DK",
            },
            {
                "day": "Thursday",
                "slot_order": 4,
                "start": "15:15",
                "end": "16:10",
                "subject": "IML",
                "faculty": "CP",
            },
            {
                "day": "Thursday",
                "slot_order": 6,
                "start": "16:30",
                "end": "17:20",
                "subject": "DM",
                "faculty": "DK",
            },
            # Friday
            {
                "day": "Friday",
                "slot_order": 0,
                "start": "12:00",
                "end": "12:55",
                "subject": "IML",
                "faculty": "CP",
            },
            {
                "day": "Friday",
                "slot_order": 1,
                "start": "12:55",
                "end": "13:25",
                "subject": "IML",
                "faculty": "CP",
            },
            {
                "day": "Friday",
                "slot_order": 2,
                "start": "13:25",
                "end": "14:20",
                "subject": "STQ",
                "faculty": "DK",
            },
            {
                "day": "Friday",
                "slot_order": 4,
                "start": "15:15",
                "end": "16:10",
                "subject": "OPS",
                "faculty": "DK",
            },
            {
                "day": "Friday",
                "slot_order": 6,
                "start": "16:30",
                "end": "17:20",
                "subject": "IML",
                "faculty": "CP",
            },
        ]

        create_timetable_slots(bscit1, 5, bscit5_slots, "A-106", faculty_map)

    # Print summary
    print("\n" + "=" * 80)
    print("TIMETABLE SEEDING COMPLETE")
    print("=" * 80)
    print(f"Total Timetable Slots: {TimetableSlot.objects.count()}")
    print(f"BCA S1: {TimetableSlot.objects.filter(course=bca1, semester=1).count()}")
    print(f"MCA S1: {TimetableSlot.objects.filter(course=mca1, semester=1).count()}")
    print(
        f"BSc-IT S1: {TimetableSlot.objects.filter(course=bscit1, semester=1).count()}"
    )
    print(
        f"BSc-IT S5: {TimetableSlot.objects.filter(course=bscit1, semester=5).count()}"
    )


def create_timetable_slots(course, semester, slots_data, room_number, faculty_map):
    """Create timetable slots from data"""
    created = 0

    # Get room instance
    room = Room.objects.filter(room_number=room_number).first()
    if not room:
        print(f"  ERROR: Room {room_number} not found!")
        return 0

    for slot_data in slots_data:
        # Find faculty
        faculty = faculty_map.get(slot_data["faculty"])
        if not faculty:
            print(f"  WARNING: Faculty {slot_data['faculty']} not found")
            continue

        # Find or create subject
        subject_code = slot_data["subject"]
        subject = Subject.objects.filter(
            code__icontains=subject_code, course=course
        ).first()
        if not subject:
            # Create a placeholder subject
            subject, _ = Subject.objects.get_or_create(
                code=f"{course.code}-{semester}-{subject_code}",
                defaults={
                    "name": subject_code,
                    "course": course,
                    "semester": semester,
                    "credits": 4,
                },
            )

        # Create timetable slot
        try:
            ts, is_new = TimetableSlot.objects.get_or_create(
                course=course,
                semester=semester,
                day_of_week=slot_data["day"],
                start_time=slot_data["start"],
                end_time=slot_data["end"],
                subject=subject,
                faculty=faculty,
                defaults={
                    "room": room,
                    "section": "A",
                    "slot_type": "Theory",
                    "is_auto_generated": False,
                },
            )

            if is_new:
                created += 1
        except Exception as e:
            print(f"  ERROR creating slot: {e}")

    print(
        f"  Created {created} slots for {course.code} S{semester} (Room: {room_number})"
    )
    return created


if __name__ == "__main__":
    seed_ganpat_timetable()
