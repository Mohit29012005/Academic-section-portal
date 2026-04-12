from django.core.management.base import BaseCommand
from academics.models import Course, Subject

SUBJECTS_DATA = {
    "BCA": {
        1: [
            ("BCA101", "Computer Fundamentals & Applications", 4),
            ("BCA102", "Programming in C", 4),
            ("BCA103", "Mathematics-I", 4),
            ("BCA104", "English Communication", 3),
            ("BCA105", "Environmental Studies", 3),
            ("BCA106", "Computer Fundamentals Lab", 2),
            ("BCA107", "C Programming Lab", 2),
        ],
        2: [
            ("BCA201", "Data Structures", 4),
            ("BCA202", "Object Oriented Programming (C++)", 4),
            ("BCA203", "Mathematics-II", 4),
            ("BCA204", "Digital Electronics", 3),
            ("BCA205", "Communication Skills", 3),
            ("BCA206", "Data Structures Lab", 2),
            ("BCA207", "C++ Programming Lab", 2),
        ],
        3: [
            ("BCA301", "Database Management System", 4),
            ("BCA302", "Operating System", 4),
            ("BCA303", "Computer Networks", 4),
            ("BCA304", "Software Engineering", 3),
            ("BCA305", "Web Technology", 3),
            ("BCA306", "DBMS Lab", 2),
            ("BCA307", "Web Technology Lab", 2),
        ],
        4: [
            ("BCA401", "Java Programming", 4),
            ("BCA402", "Python Programming", 4),
            ("BCA403", "Computer Architecture", 4),
            ("BCA404", "System Analysis & Design", 3),
            ("BCA405", "Elective-I", 3),
            ("BCA406", "Java Programming Lab", 2),
            ("BCA407", "Python Programming Lab", 2),
        ],
        5: [
            ("BCA501", "PHP & MySQL", 4),
            ("BCA502", "Android Development", 4),
            ("BCA503", "Cloud Computing", 4),
            ("BCA504", "Elective-II", 3),
            ("BCA505", "Project-I", 3),
            ("BCA506", "PHP Lab", 2),
            ("BCA507", "Android Lab", 2),
        ],
        6: [
            ("BCA601", "Machine Learning", 4),
            ("BCA602", "Internet of Things", 4),
            ("BCA603", "Cyber Security", 3),
            ("BCA604", "Elective-III", 3),
            ("BCA605", "Project-II", 4),
            ("BCA606", "Machine Learning Lab", 2),
            ("BCA607", "IoT Lab", 2),
        ],
    },
    "MCA": {
        1: [
            ("MCA101", "Computer Fundamentals", 4),
            ("MCA102", "C Programming", 4),
            ("MCA103", "Discrete Mathematics", 4),
            ("MCA104", "Technical Communication", 3),
            ("MCA105", "Computer Lab-I", 3),
            ("MCA106", "Statistics & Probability", 3),
        ],
        2: [
            ("MCA201", "Data Structures", 4),
            ("MCA202", "Object Oriented Programming", 4),
            ("MCA203", "Operating System", 4),
            ("MCA204", "Computer Networks", 3),
            ("MCA205", "Computer Lab-II", 3),
            ("MCA206", "Web Technology", 3),
        ],
        3: [
            ("MCA301", "Database Management System", 4),
            ("MCA302", "Software Engineering", 4),
            ("MCA303", "Java Programming", 4),
            ("MCA304", "Elective-I", 3),
            ("MCA305", "Computer Lab-III", 3),
            ("MCA306", "Mini Project", 3),
        ],
        4: [
            ("MCA401", "Python Programming", 4),
            ("MCA402", "Machine Learning", 4),
            ("MCA403", "Cloud Computing", 3),
            ("MCA404", "Elective-II", 3),
            ("MCA405", "Major Project", 6),
        ],
    },
    "BSC-IT": {
        1: [
            ("IT101", "Computer Fundamentals", 4),
            ("IT102", "C Programming", 4),
            ("IT103", "Mathematics-I", 4),
            ("IT104", "English", 3),
            ("IT105", "Computer Lab-I", 3),
            ("IT106", "Environmental Science", 3),
        ],
        2: [
            ("IT201", "Data Structures", 4),
            ("IT202", "C++ Programming", 4),
            ("IT203", "Mathematics-II", 4),
            ("IT204", "Digital Electronics", 3),
            ("IT205", "Computer Lab-II", 3),
            ("IT206", "Communication Skills", 3),
        ],
        3: [
            ("IT301", "Database Management System", 4),
            ("IT302", "Operating System", 4),
            ("IT303", "Computer Networks", 4),
            ("IT304", "Web Technology", 3),
            ("IT305", "Computer Lab-III", 3),
            ("IT306", "Software Engineering", 3),
        ],
        4: [
            ("IT401", "Java Programming", 4),
            ("IT402", "Python Programming", 4),
            ("IT403", "Data Science", 4),
            ("IT404", "Elective-I", 3),
            ("IT405", "Computer Lab-IV", 3),
            ("IT406", "Mini Project", 3),
        ],
        5: [
            ("IT501", "PHP & MySQL", 4),
            ("IT502", "Cloud Computing", 4),
            ("IT503", "Cyber Security", 4),
            ("IT504", "Elective-II", 3),
            ("IT505", "Project-I", 4),
        ],
        6: [
            ("IT601", "Machine Learning", 4),
            ("IT602", "Big Data", 4),
            ("IT603", "Internet of Things", 3),
            ("IT604", "Elective-III", 3),
            ("IT605", "Major Project", 6),
        ],
    },
    "MSC-IT": {
        1: [
            ("MSC101", "Advanced Programming", 4),
            ("MSC102", "Database Systems", 4),
            ("MSC103", "Mathematics", 4),
            ("MSC104", "Technical Writing", 3),
            ("MSC105", "Lab-I", 3),
            ("MSC106", "Research Methodology", 3),
        ],
        2: [
            ("MSC201", "Data Structures & Algorithms", 4),
            ("MSC202", "Operating Systems", 4),
            ("MSC203", "Computer Networks", 4),
            ("MSC204", "Web Technologies", 3),
            ("MSC205", "Lab-II", 3),
            ("MSC206", "Mini Project", 3),
        ],
        3: [
            ("MSC301", "Machine Learning", 4),
            ("MSC302", "Cloud Computing", 4),
            ("MSC303", "Elective-I", 4),
            ("MSC304", "Python Programming", 3),
            ("MSC305", "Lab-III", 3),
            ("MSC306", "Seminar", 2),
        ],
        4: [
            ("MSC401", "Big Data Analytics", 4),
            ("MSC402", "Elective-II", 4),
            ("MSC403", "Major Project", 10),
            ("MSC404", "Viva Voce", 2),
        ],
    },
}


class Command(BaseCommand):
    help = "Create subjects for all courses"

    def handle(self, *args, **options):
        self.stdout.write("Creating subjects...\n")

        courses = Course.objects.all()
        total_created = 0

        for course in courses:
            course_code = course.code

            if course_code not in SUBJECTS_DATA:
                continue

            course_subjects = SUBJECTS_DATA[course_code]

            for semester, subjects in course_subjects.items():
                for code, name, credits in subjects:
                    subject, created = Subject.objects.get_or_create(
                        code=code,
                        defaults={
                            "name": name,
                            "course": course,
                            "semester": semester,
                            "credits": credits,
                        },
                    )
                    if created:
                        total_created += 1
                        self.stdout.write(
                            f"  {course_code} Sem-{semester}: {code} - {name}"
                        )
                    else:
                        self.stdout.write(
                            f"  {course_code} Sem-{semester}: {code} already exists"
                        )

        self.stdout.write(
            self.style.SUCCESS(f"\nTotal subjects created: {total_created}")
        )
        self.stdout.write(f"Total subjects in database: {Subject.objects.count()}")
