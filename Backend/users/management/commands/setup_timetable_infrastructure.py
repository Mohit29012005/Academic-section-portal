import random
from django.core.management.base import BaseCommand
from academics.models import Room, TimeSlot, FacultyAvailability
from users.models import Faculty


class Command(BaseCommand):
    help = "Setup rooms and time slots for smart timetable"

    def add_arguments(self, parser):
        parser.add_argument(
            "--branch",
            type=str,
            default="Kherva",
            choices=["Kherva", "Ahmedabad", "both"],
            help="Campus branch to setup",
        )
        parser.add_argument("--reset", action="store_true", help="Reset existing data")

    def handle(self, *args, **options):
        branch = options["branch"]
        reset = options["reset"]

        if reset:
            self.stdout.write("[RESET] Clearing existing data...")
            from academics.models import TimetableSlot

            deleted = TimetableSlot.objects.filter(
                is_auto_generated=True,
                course__subjects__campus_branch__in=[branch, "Both"],
            ).delete()[0]
            self.stdout.write(self.style.SUCCESS(f"   Deleted {deleted} slots"))

        if branch in ["Kherva", "both"]:
            self._setup_branch("Kherva")

        if branch in ["Ahmedabad", "both"]:
            self._setup_branch("Ahmedabad")

        self._setup_faculty_availability()

        self.stdout.write(self.style.SUCCESS("\n[SUCCESS] Setup complete!"))

    def _setup_branch(self, branch_name):
        self.stdout.write(f"\n{'=' * 50}")
        self.stdout.write(f"Setting up: {branch_name} Campus")
        self.stdout.write(f"{'=' * 50}")

        # Create Rooms
        self.stdout.write("\n[ROOMS] Creating...")
        rooms = self._get_rooms_for_branch(branch_name)
        for room_data in rooms:
            room, created = Room.objects.get_or_create(
                room_number=room_data["room_number"], defaults=room_data
            )
            status = "[NEW]" if created else "[EXISTS]"
            self.stdout.write(f"   {status}: {room.room_number} ({room.room_type})")

        # Create Time Slots
        self.stdout.write("\n[TIME SLOTS] Creating...")
        slots = self._get_time_slots_for_branch(branch_name)
        for slot_data in slots:
            slot, created = TimeSlot.objects.get_or_create(
                name=slot_data["name"], campus_branch=branch_name, defaults=slot_data
            )
            status = "[NEW]" if created else "[EXISTS]"
            self.stdout.write(
                f"   {status}: {slot.name} ({slot.start_time}-{slot.end_time})"
            )

    def _get_rooms_for_branch(self, branch):
        if branch == "Kherva":
            return [
                {
                    "room_number": "LH-101",
                    "building": "Main Block",
                    "room_type": "Lecture Hall",
                    "capacity": 60,
                    "floor": 1,
                    "campus_branch": "Kherva",
                },
                {
                    "room_number": "LH-102",
                    "building": "Main Block",
                    "room_type": "Lecture Hall",
                    "capacity": 60,
                    "floor": 1,
                    "campus_branch": "Kherva",
                },
                {
                    "room_number": "LH-103",
                    "building": "Main Block",
                    "room_type": "Lecture Hall",
                    "capacity": 80,
                    "floor": 1,
                    "campus_branch": "Kherva",
                },
                {
                    "room_number": "LH-201",
                    "building": "Main Block",
                    "room_type": "Lecture Hall",
                    "capacity": 60,
                    "floor": 2,
                    "campus_branch": "Kherva",
                },
                {
                    "room_number": "LH-202",
                    "building": "Main Block",
                    "room_type": "Lecture Hall",
                    "capacity": 60,
                    "floor": 2,
                    "campus_branch": "Kherva",
                },
                {
                    "room_number": "LH-301",
                    "building": "Main Block",
                    "room_type": "Lecture Hall",
                    "capacity": 100,
                    "floor": 3,
                    "campus_branch": "Kherva",
                },
                {
                    "room_number": "LAB-101",
                    "building": "Computer Center",
                    "room_type": "Lab",
                    "capacity": 40,
                    "floor": 1,
                    "campus_branch": "Kherva",
                    "has_computers": True,
                    "has_projector": True,
                },
                {
                    "room_number": "LAB-102",
                    "building": "Computer Center",
                    "room_type": "Lab",
                    "capacity": 40,
                    "floor": 1,
                    "campus_branch": "Kherva",
                    "has_computers": True,
                    "has_projector": True,
                },
                {
                    "room_number": "LAB-201",
                    "building": "Computer Center",
                    "room_type": "Lab",
                    "capacity": 30,
                    "floor": 2,
                    "campus_branch": "Kherva",
                    "has_computers": True,
                },
                {
                    "room_number": "LAB-301",
                    "building": "Computer Center",
                    "room_type": "Lab",
                    "capacity": 30,
                    "floor": 3,
                    "campus_branch": "Kherva",
                    "has_computers": True,
                },
                {
                    "room_number": "WORK-101",
                    "building": "Workshop Block",
                    "room_type": "Workshop",
                    "capacity": 25,
                    "floor": 1,
                    "campus_branch": "Kherva",
                },
                {
                    "room_number": "SEM-101",
                    "building": "Admin Block",
                    "room_type": "Seminar Hall",
                    "capacity": 150,
                    "floor": 1,
                    "campus_branch": "Kherva",
                    "has_projector": True,
                },
                {
                    "room_number": "TUT-101",
                    "building": "Main Block",
                    "room_type": "Tutorial Room",
                    "capacity": 25,
                    "floor": 1,
                    "campus_branch": "Kherva",
                },
                {
                    "room_number": "TUT-102",
                    "building": "Main Block",
                    "room_type": "Tutorial Room",
                    "capacity": 25,
                    "floor": 2,
                    "campus_branch": "Kherva",
                },
            ]
        else:  # Ahmedabad
            return [
                {
                    "room_number": "A-LH-01",
                    "building": "Block A",
                    "room_type": "Lecture Hall",
                    "capacity": 50,
                    "floor": 1,
                    "campus_branch": "Ahmedabad",
                },
                {
                    "room_number": "A-LH-02",
                    "building": "Block A",
                    "room_type": "Lecture Hall",
                    "capacity": 50,
                    "floor": 1,
                    "campus_branch": "Ahmedabad",
                },
                {
                    "room_number": "A-LH-03",
                    "building": "Block A",
                    "room_type": "Lecture Hall",
                    "capacity": 70,
                    "floor": 2,
                    "campus_branch": "Ahmedabad",
                },
                {
                    "room_number": "B-LH-01",
                    "building": "Block B",
                    "room_type": "Lecture Hall",
                    "capacity": 50,
                    "floor": 1,
                    "campus_branch": "Ahmedabad",
                },
                {
                    "room_number": "B-LH-02",
                    "building": "Block B",
                    "room_type": "Lecture Hall",
                    "capacity": 60,
                    "floor": 1,
                    "campus_branch": "Ahmedabad",
                },
                {
                    "room_number": "A-LAB-01",
                    "building": "Block A",
                    "room_type": "Lab",
                    "capacity": 35,
                    "floor": 1,
                    "campus_branch": "Ahmedabad",
                    "has_computers": True,
                    "has_projector": True,
                },
                {
                    "room_number": "A-LAB-02",
                    "building": "Block A",
                    "room_type": "Lab",
                    "capacity": 35,
                    "floor": 2,
                    "campus_branch": "Ahmedabad",
                    "has_computers": True,
                },
                {
                    "room_number": "B-LAB-01",
                    "building": "Block B",
                    "room_type": "Lab",
                    "capacity": 30,
                    "floor": 1,
                    "campus_branch": "Ahmedabad",
                    "has_computers": True,
                },
                {
                    "room_number": "SEM-01",
                    "building": "Main Block",
                    "room_type": "Seminar Hall",
                    "capacity": 120,
                    "floor": 1,
                    "campus_branch": "Ahmedabad",
                    "has_projector": True,
                },
                {
                    "room_number": "TUT-01",
                    "building": "Block A",
                    "room_type": "Tutorial Room",
                    "capacity": 20,
                    "floor": 1,
                    "campus_branch": "Ahmedabad",
                },
            ]

    def _get_time_slots_for_branch(self, branch):
        if branch == "Kherva":
            return [
                {
                    "name": "Slot 1",
                    "start_time": "09:00",
                    "end_time": "10:00",
                    "slot_order": 1,
                    "duration_minutes": 60,
                    "campus_branch": "Kherva",
                },
                {
                    "name": "Slot 2",
                    "start_time": "10:00",
                    "end_time": "11:00",
                    "slot_order": 2,
                    "duration_minutes": 60,
                    "campus_branch": "Kherva",
                },
                {
                    "name": "Slot 3",
                    "start_time": "11:15",
                    "end_time": "12:15",
                    "slot_order": 3,
                    "duration_minutes": 60,
                    "campus_branch": "Kherva",
                },
                {
                    "name": "Slot 4",
                    "start_time": "12:15",
                    "end_time": "13:15",
                    "slot_order": 4,
                    "duration_minutes": 60,
                    "campus_branch": "Kherva",
                },
                {
                    "name": "Lunch",
                    "start_time": "13:15",
                    "end_time": "14:00",
                    "slot_order": 5,
                    "duration_minutes": 45,
                    "is_break": True,
                    "campus_branch": "Kherva",
                },
                {
                    "name": "Slot 5",
                    "start_time": "14:00",
                    "end_time": "15:00",
                    "slot_order": 6,
                    "duration_minutes": 60,
                    "campus_branch": "Kherva",
                },
                {
                    "name": "Slot 6",
                    "start_time": "15:00",
                    "end_time": "16:00",
                    "slot_order": 7,
                    "duration_minutes": 60,
                    "campus_branch": "Kherva",
                },
                {
                    "name": "Slot 7",
                    "start_time": "16:15",
                    "end_time": "17:15",
                    "slot_order": 8,
                    "duration_minutes": 60,
                    "campus_branch": "Kherva",
                },
            ]
        else:  # Ahmedabad
            return [
                {
                    "name": "Slot 1",
                    "start_time": "10:00",
                    "end_time": "11:00",
                    "slot_order": 1,
                    "duration_minutes": 60,
                    "campus_branch": "Ahmedabad",
                },
                {
                    "name": "Slot 2",
                    "start_time": "11:00",
                    "end_time": "12:00",
                    "slot_order": 2,
                    "duration_minutes": 60,
                    "campus_branch": "Ahmedabad",
                },
                {
                    "name": "Slot 3",
                    "start_time": "12:00",
                    "end_time": "13:00",
                    "slot_order": 3,
                    "duration_minutes": 60,
                    "campus_branch": "Ahmedabad",
                },
                {
                    "name": "Lunch",
                    "start_time": "13:00",
                    "end_time": "14:00",
                    "slot_order": 4,
                    "duration_minutes": 60,
                    "is_break": True,
                    "campus_branch": "Ahmedabad",
                },
                {
                    "name": "Slot 4",
                    "start_time": "14:00",
                    "end_time": "15:00",
                    "slot_order": 5,
                    "duration_minutes": 60,
                    "campus_branch": "Ahmedabad",
                },
                {
                    "name": "Slot 5",
                    "start_time": "15:00",
                    "end_time": "16:00",
                    "slot_order": 6,
                    "duration_minutes": 60,
                    "campus_branch": "Ahmedabad",
                },
                {
                    "name": "Slot 6",
                    "start_time": "16:00",
                    "end_time": "17:00",
                    "slot_order": 7,
                    "duration_minutes": 60,
                    "campus_branch": "Ahmedabad",
                },
            ]

    def _setup_faculty_availability(self):
        self.stdout.write("\n[FACULTY] Setting up availability...")

        faculty = Faculty.objects.filter(subjects__isnull=False).distinct()
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

        for f in faculty:
            branch = "Kherva" if "Kherva" in (f.branch or "") else "Ahmedabad"

            for day in days:
                FacultyAvailability.objects.get_or_create(
                    faculty=f,
                    day_of_week=day,
                    defaults={
                        "is_available": True,
                        "preferred_slots": [],
                        "not_available_slots": [],
                        "campus_branch": branch,
                    },
                )

        self.stdout.write(
            f"   [OK] Updated availability for {faculty.count()} faculty members"
        )
