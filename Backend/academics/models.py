import uuid
from django.db import models


class Course(models.Model):
    course_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    duration = models.IntegerField(help_text='Duration in years')
    total_semesters = models.IntegerField()
    department = models.CharField(max_length=50)
    level = models.CharField(max_length=50, blank=True, null=True, help_text='Undergraduate, Postgraduate, etc.')
    credits = models.IntegerField(default=0, help_text='Total Graduation Credits')
    status = models.CharField(max_length=20, default='Active')
    desc = models.TextField(blank=True, null=True, help_text='Program Summary Description')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'courses'
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'

    def __str__(self):
        return f"{self.code} - {self.name}"


class Subject(models.Model):
    subject_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE,
        related_name='subjects', db_column='course_id'
    )
    semester = models.IntegerField()
    credits = models.IntegerField(default=4)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'subjects'
        verbose_name = 'Subject'
        verbose_name_plural = 'Subjects'

    def __str__(self):
        return f"{self.code} - {self.name}"


RESULT_STATUS_CHOICES = (
    ('completed', 'Completed'),
    ('remaining', 'Remaining'),
)


class SemesterResult(models.Model):
    result_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        'users.Student', on_delete=models.CASCADE,
        related_name='semester_results', db_column='student_id'
    )
    semester = models.IntegerField()
    sgpa = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True)
    status = models.CharField(max_length=20, choices=RESULT_STATUS_CHOICES, default='remaining')
    year = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'semester_results'
        verbose_name = 'Semester Result'
        verbose_name_plural = 'Semester Results'
        unique_together = ('student', 'semester')

    def __str__(self):
        return f"{self.student.name} - Sem {self.semester} - {self.sgpa}"


class AcademicTerm(models.Model):
    term_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=(('Upcoming', 'Upcoming'), ('Active', 'Active'), ('Completed', 'Completed')), default='Upcoming')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'academic_terms'
        verbose_name = 'Academic Term'
        verbose_name_plural = 'Academic Terms'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.name} ({self.status})"


class Holiday(models.Model):
    holiday_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    date = models.DateField()
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=50) # National, Festival, Institutional
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'holidays'
        verbose_name = 'Holiday'
        verbose_name_plural = 'Holidays'
        ordering = ['date']

    def __str__(self):
        return f"{self.name} on {self.date}"


class TimetableSlot(models.Model):
    DAY_CHOICES = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
    ]
    slot_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='timetable_slots')
    semester = models.IntegerField()
    day_of_week = models.CharField(max_length=10, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='timetable_slots')
    faculty = models.ForeignKey('users.Faculty', on_delete=models.CASCADE, related_name='timetable_slots')
    room = models.CharField(max_length=50)
    section = models.CharField(max_length=10, default='A')

    class Meta:
        db_table = 'timetable_slots'
        verbose_name = 'Timetable Slot'
        verbose_name_plural = 'Timetable Slots'
        unique_together = ('course', 'semester', 'day_of_week', 'start_time', 'section')

    def __str__(self):
        return f"{self.course.code} S{self.semester} - {self.day_of_week} {self.start_time}"
