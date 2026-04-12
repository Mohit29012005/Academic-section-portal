from django.core.management.base import BaseCommand
from academics.models import Course, Subject

EXTRA_SUBJECTS = {
    "BSC-IMS": {
        1: [
            ("BSCIMS101", "Programming Fundamentals", 4),
            ("BSCIMS102", "Management Principles", 4),
            ("BSCIMS103", "Business Mathematics", 4),
            ("BSCIMS104", "English Communication", 3),
        ],
        2: [
            ("BSCIMS201", "Data Structures", 4),
            ("BSCIMS202", "Financial Accounting", 4),
            ("BSCIMS203", "Database Systems", 4),
            ("BSCIMS204", "Business Communication", 3),
        ],
        3: [
            ("BSCIMS301", "Operating Systems", 4),
            ("BSCIMS302", "Computer Networks", 4),
            ("BSCIMS303", "E-Commerce", 4),
            ("BSCIMS304", "Web Development", 4),
        ],
        4: [
            ("BSCIMS401", "Python Programming", 4),
            ("BSCIMS402", "Cyber Security", 4),
            ("BSCIMS403", "Cloud Computing", 4),
        ],
        5: [
            ("BSCIMS501", "Machine Learning", 4),
            ("BSCIMS502", "Mobile App Development", 4),
        ],
        6: [
            ("BSCIMS601", "Project Work", 10),
            ("BSCIMS602", "Industrial Training", 6),
        ],
    },
    "BSC-CYBER": {
        1: [
            ("BSCCY101", "Programming Fundamentals", 4),
            ("BSCCY102", "Network Basics", 4),
            ("BSCCY103", "Mathematics", 4),
            ("BSCCY104", "English", 3),
        ],
        2: [
            ("BSCCY201", "Data Structures", 4),
            ("BSCCY202", "Cryptography", 4),
            ("BSCCY203", "Database Systems", 4),
        ],
        3: [
            ("BSCCY301", "Operating Systems", 4),
            ("BSCCY302", "Network Security", 4),
            ("BSCCY303", "Ethical Hacking", 4),
            ("BSCCY304", "Web Security", 4),
        ],
        4: [
            ("BSCCY401", "Cyber Forensics", 4),
            ("BSCCY402", "Malware Analysis", 4),
            ("BSCCY403", "Cloud Security", 4),
        ],
        5: [
            ("BSCCY501", "Penetration Testing", 4),
            ("BSCCY502", "Incident Response", 4),
        ],
        6: [
            ("BSCCY601", "Project Work", 10),
            ("BSCCY602", "Industrial Training", 6),
        ],
    },
    "BSC-AIML": {
        1: [
            ("BSCAI101", "Programming Fundamentals", 4),
            ("BSCAI102", "Mathematics for AI", 4),
            ("BSCAI103", "Statistics", 4),
            ("BSCAI104", "English", 3),
        ],
        2: [
            ("BSCAI201", "Data Structures", 4),
            ("BSCAI202", "Python Programming", 4),
            ("BSCAI203", "Database Systems", 4),
        ],
        3: [
            ("BSCAI301", "Machine Learning", 4),
            ("BSCAI302", "Deep Learning", 4),
            ("BSCAI303", "NLP", 4),
            ("BSCAI304", "Computer Vision", 4),
        ],
        4: [
            ("BSCAI401", "Neural Networks", 4),
            ("BSCAI402", "Reinforcement Learning", 4),
            ("BSCAI403", "Cloud Computing", 4),
        ],
        5: [
            ("BSCAI501", "Advanced ML", 4),
            ("BSCAI502", "AI Ethics", 4),
        ],
        6: [
            ("BSCAI601", "Project Work", 10),
            ("BSCAI602", "Industrial Training", 6),
        ],
    },
    "MSC-IT": {
        1: [
            ("MSC101", "Advanced Programming", 4),
            ("MSC102", "Database Systems", 4),
            ("MSC103", "Mathematics", 4),
            ("MSC104", "Technical Writing", 3),
        ],
        2: [
            ("MSC201", "Data Science", 4),
            ("MSC202", "Machine Learning", 4),
            ("MSC203", "Cloud Computing", 4),
        ],
        3: [
            ("MSC301", "Deep Learning", 4),
            ("MSC302", "Big Data", 4),
            ("MSC303", "NLP", 4),
            ("MSC304", "Computer Vision", 4),
        ],
        4: [
            ("MSC401", "Project Work", 12),
            ("MSC402", "Viva Voce", 3),
        ],
    },
    "MSC-IMS": {
        1: [
            ("MSCIMS101", "Advanced Programming", 4),
            ("MSCIMS102", "Database Systems", 4),
            ("MSCIMS103", "Management", 4),
            ("MSCIMS104", "Technical Writing", 3),
        ],
        2: [
            ("MSCIMS201", "E-Commerce", 4),
            ("MSCIMS202", "Digital Marketing", 4),
            ("MSCIMS203", "Cloud Computing", 4),
        ],
        3: [
            ("MSCIMS301", "Data Analytics", 4),
            ("MSCIMS302", "Business Intelligence", 4),
            ("MSCIMS303", "AI Applications", 4),
        ],
        4: [
            ("MSCIMS401", "Project Work", 12),
            ("MSCIMS402", "Viva Voce", 3),
        ],
    },
    "MSC-CYBER": {
        1: [
            ("MSCCY101", "Advanced Programming", 4),
            ("MSCCY102", "Cryptography", 4),
            ("MSCCY103", "Network Security", 4),
            ("MSCCY104", "Technical Writing", 3),
        ],
        2: [
            ("MSCCY201", "Ethical Hacking", 4),
            ("MSCCY202", "Cyber Forensics", 4),
            ("MSCCY203", "Malware Analysis", 4),
        ],
        3: [
            ("MSCCY301", "Cloud Security", 4),
            ("MSCCY302", "Penetration Testing", 4),
            ("MSCCY303", "Incident Response", 4),
        ],
        4: [
            ("MSCCY401", "Project Work", 12),
            ("MSCCY402", "Viva Voce", 3),
        ],
    },
    "MSC-AIML": {
        1: [
            ("MSCAI101", "Advanced Python", 4),
            ("MSCAI102", "Mathematics for AI", 4),
            ("MSCAI103", "Statistics", 4),
            ("MSCAI104", "Technical Writing", 3),
        ],
        2: [
            ("MSCAI201", "Machine Learning", 4),
            ("MSCAI202", "Deep Learning", 4),
            ("MSCAI203", "Neural Networks", 4),
        ],
        3: [
            ("MSCAI301", "NLP", 4),
            ("MSCAI302", "Computer Vision", 4),
            ("MSCAI303", "Reinforcement Learning", 4),
        ],
        4: [
            ("MSCAI401", "Project Work", 12),
            ("MSCAI402", "Viva Voce", 3),
        ],
    },
    "BTECH-IT": {
        1: [
            ("IT101", "Engineering Mathematics-I", 4),
            ("IT102", "Programming in C", 4),
            ("IT103", "Basic Electronics", 4),
        ],
        2: [
            ("IT201", "Engineering Mathematics-II", 4),
            ("IT202", "Data Structures", 4),
            ("IT203", "Digital Logic Design", 4),
        ],
        3: [
            ("IT301", "Object Oriented Programming", 4),
            ("IT302", "Computer Architecture", 4),
            ("IT303", "Discrete Mathematics", 4),
        ],
        4: [
            ("IT401", "Database Management", 4),
            ("IT402", "Operating Systems", 4),
            ("IT403", "Theory of Computation", 4),
        ],
        5: [
            ("IT501", "Computer Networks", 4),
            ("IT502", "Software Engineering", 4),
            ("IT503", "Web Technologies", 4),
        ],
        6: [
            ("IT601", "Cloud Computing", 4),
            ("IT602", "Machine Learning", 4),
            ("IT603", "Cyber Security", 4),
        ],
        7: [
            ("IT701", "IoT", 4),
            ("IT702", "Big Data", 4),
        ],
        8: [
            ("IT801", "Major Project", 12),
            ("IT802", "Industrial Training", 4),
        ],
    },
}


class Command(BaseCommand):
    help = "Create subjects for remaining courses"

    def handle(self, *args, **options):
        self.stdout.write("Creating subjects for remaining courses...\n")

        total_created = 0

        for course_code, semesters in EXTRA_SUBJECTS.items():
            try:
                course = Course.objects.get(code=course_code)
            except Course.DoesNotExist:
                self.stdout.write(f"Course not found: {course_code}")
                continue

            for semester, subjects in semesters.items():
                for code, name, credits in subjects:
                    if not Subject.objects.filter(code=code).exists():
                        Subject.objects.create(
                            code=code,
                            name=name,
                            course=course,
                            semester=semester,
                            credits=credits,
                        )
                        total_created += 1
                        self.stdout.write(
                            f"  {course_code} Sem-{semester}: {code} - {name}"
                        )

        self.stdout.write(
            self.style.SUCCESS(f"\nTotal extra subjects created: {total_created}")
        )
        self.stdout.write(f"Total subjects in database: {Subject.objects.count()}")
