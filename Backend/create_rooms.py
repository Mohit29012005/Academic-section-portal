"""
Create GANPAT DCS Rooms
"""

import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ampics.settings")
django.setup()

from academics.models import Room

rooms_to_create = [
    # Noon Shift Rooms (BCA, BSc courses) - Block A
    {
        "room_number": "A-101",
        "building": "Block A",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "A-102",
        "building": "Block A",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "A-103",
        "building": "Block A",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "A-104",
        "building": "Block A",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "A-105",
        "building": "Block A",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "A-106",
        "building": "Block A",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "A-107",
        "building": "Block A",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "A-108",
        "building": "Block A",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "A-201",
        "building": "Block A",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "A-202",
        "building": "Block A",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "A-203",
        "building": "Block A",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "A-204",
        "building": "Block A",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "A-205",
        "building": "Block A",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "A-206",
        "building": "Block A",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "A-207",
        "building": "Block A",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    # Morning Shift Rooms (BTECH, Masters) - Block C
    {
        "room_number": "C-101",
        "building": "Block C",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "C-102",
        "building": "Block C",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "C-103",
        "building": "Block C",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "C-104",
        "building": "Block C",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "C-105",
        "building": "Block C",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "C-106",
        "building": "Block C",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "C-107",
        "building": "Block C",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "C-108",
        "building": "Block C",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "C-201",
        "building": "Block C",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "C-202",
        "building": "Block C",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "C-203",
        "building": "Block C",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    {
        "room_number": "C-204",
        "building": "Block C",
        "room_type": "Lecture Hall",
        "capacity": 60,
    },
    # Computer Labs
    {
        "room_number": "CS Lab-1",
        "building": "Lab Block",
        "room_type": "Lab",
        "capacity": 40,
        "has_computers": True,
    },
    {
        "room_number": "CS Lab-2",
        "building": "Lab Block",
        "room_type": "Lab",
        "capacity": 40,
        "has_computers": True,
    },
    {
        "room_number": "AI Lab",
        "building": "Lab Block",
        "room_type": "Lab",
        "capacity": 40,
        "has_computers": True,
        "has_projector": True,
    },
    {
        "room_number": "Cyber Lab",
        "building": "Lab Block",
        "room_type": "Lab",
        "capacity": 40,
        "has_computers": True,
    },
    {
        "room_number": "ML Lab",
        "building": "Lab Block",
        "room_type": "Lab",
        "capacity": 40,
        "has_computers": True,
    },
    {
        "room_number": "IMS Lab",
        "building": "Lab Block",
        "room_type": "Lab",
        "capacity": 40,
        "has_computers": True,
    },
]

print("Creating GANPAT DCS Rooms...")
created = 0
for room_data in rooms_to_create:
    room, is_new = Room.objects.get_or_create(
        room_number=room_data["room_number"],
        defaults={
            "building": room_data.get("building", "Main Building"),
            "room_type": room_data.get("room_type", "Lecture Hall"),
            "capacity": room_data.get("capacity", 60),
            "has_computers": room_data.get("has_computers", False),
            "has_projector": room_data.get("has_projector", False),
            "campus_branch": "Kherva",
        },
    )
    if is_new:
        created += 1
        print(f"  Created: {room.room_number} ({room.building})")

print(f"\nTotal rooms: {Room.objects.count()}")
print(f"Newly created: {created}")
