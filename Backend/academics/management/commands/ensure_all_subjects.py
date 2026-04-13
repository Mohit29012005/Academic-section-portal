import os
from django.core.management.base import BaseCommand
from academics.models import Course, Subject

class Command(BaseCommand):
    help = "Ensure all courses have subjects for all semesters using templates and cross-mapping"

    def handle(self, *args, **options):
        self.stdout.write("Ensuring 100% Subject Coverage...")
        
        # Course Mappings for subject inheritance (if one is missing)
        # Target Course : Source Course (Template)
        inheritance_map = {
            "B.Sc. (CA&IT)": "INTE. DUAL DEGREE (BCA)-(MCA)", # Common curriculum
            "B.Sc. IT (DATA SCIENCE)": "B.Sc. IT", # Fallback to Regular IT
            "M.Sc. IT (CYBER SECURITY)": "B.Sc. IT (CYBER SECURITY)", # Advance level
            "M.Sc. ARTIFICIAL INTELLIGENCE & MACHINE LEARNING": "B.Sc. IT", # Fallback
        }

        # Courses list
        courses = Course.objects.all()
        
        for course in courses:
            self.stdout.write(f"\nProcessing {course.name}...")
            
            # Max semesters based on course name
            max_sem = 6
            if "MCA" in course.name or "M.Sc." in course.name:
                max_sem = 4
            if "INTE." in course.name:
                max_sem = 10
                
            for sem in range(1, max_sem + 1):
                existing = Subject.objects.filter(course=course, semester=sem).count()
                if existing < 3: # If less than typical 3-6 subjects, fill it
                    self.stdout.write(f"  - Semester {sem}: Found {existing} subjects. Filling gaps...")
                    
                    # Try to inherit from another course
                    template_course_name = inheritance_map.get(course.name)
                    if template_course_name:
                        try:
                            template_course = Course.objects.get(name=template_course_name)
                            template_subjects = Subject.objects.filter(course=template_course, semester=sem)
                            
                            for ts in template_subjects:
                                # Update code to match target course prefix if possible
                                # B.Sc. (CA&IT) -> U1
                                # DD -> U3
                                # B.Sc. IT -> U2
                                new_code = ts.code
                                if course.name == "B.Sc. (CA&IT)":
                                    new_code = ts.code.replace('U3', 'U1').replace('P1', 'U1')
                                
                                Subject.objects.get_or_create(
                                    code=new_code,
                                    defaults={
                                        'name': ts.name,
                                        'course': course,
                                        'semester': sem,
                                        'credits': ts.credits
                                    }
                                )
                        except Course.DoesNotExist:
                            pass
                    
                    # If still empty after inheritance attempt (or no template), use a fallback generic
                    if Subject.objects.filter(course=course, semester=sem).count() == 0:
                        # Add some boilerplate based on common patterns
                        bolierplate = [
                             (f"{course.name} Core-{sem}.1", f"{course.name[:2]}-{sem}-1", 4),
                             (f"{course.name} Core-{sem}.2", f"{course.name[:2]}-{sem}-2", 4),
                             (f"Elective-{sem}.1", f"{course.name[:2]}-{sem}-E1", 4),
                             (f"Seminar/Project-{sem}", f"{course.name[:2]}-{sem}-P", 2),
                        ]
                        for name, code, credits in bolierplate:
                             Subject.objects.create(name=name, code=code, course=course, semester=sem, credits=credits)

        self.stdout.write(self.style.SUCCESS("\nAll courses now have subjects for all required semesters!"))
