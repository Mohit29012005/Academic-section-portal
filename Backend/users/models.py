import uuid
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")
        return self.create_user(email, password, **extra_fields)


ROLE_CHOICES = (
    ("student", "Student"),
    ("faculty", "Faculty"),
    ("admin", "Admin"),
)


class User(AbstractBaseUser, PermissionsMixin):
    user_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="student")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.email} ({self.role})"


COURSE_CHOICES = (
    ("BCA", "BCA"),
    ("MCA", "MCA"),
    ("BSC-IT", "BSC-IT"),
    ("BSC-IMS", "BSC-IMS"),
    ("BSC-CYBER", "BSC-CYBER"),
    ("BSC-AIML", "BSC-AIML"),
    ("MSC-IT", "MSC-IT"),
    ("MSC-IMS", "MSC-IMS"),
    ("MSC-CYBER", "MSC-CYBER"),
    ("MSC-AIML", "MSC-AIML"),
    ("BTECH-IT", "BTECH-IT"),
    ("BTECH-CSE", "BTECH-CSE"),
)


class Student(models.Model):
    student_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="student_profile"
    )
    enrollment_no = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=15, blank=True, null=True)
    course = models.ForeignKey(
        "academics.Course",
        on_delete=models.SET_NULL,
        null=True,
        related_name="students",
        db_column="course_id",
    )
    semester = models.IntegerField(default=1)
    current_semester = models.IntegerField(default=1)
    total_semesters = models.IntegerField(default=6)
    cgpa = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, default="Active")
    avatar = models.ImageField(upload_to="uploads/avatars/", blank=True, null=True)
    is_face_registered = models.BooleanField(
        default=False, help_text="True when student has completed face onboarding"
    )

    # New fields
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=10,
        choices=[("Male", "Male"), ("Female", "Female"), ("Other", "Other")],
        null=True,
        blank=True,
    )
    father_name = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    batch = models.CharField(
        max_length=2,
        choices=[("A", "Batch A"), ("B", "Batch B")],
        null=True,
        blank=True,
    )
    admission_year = models.IntegerField(default=2026)
    branch = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Campus branch (Kherva Mehsana / Ahmedabad)",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "students"
        verbose_name = "Student"
        verbose_name_plural = "Students"

    def __str__(self):
        return f"{self.name} ({self.enrollment_no})"


DEPARTMENT_CHOICES = (
    ("Computer Applications", "Computer Applications"),
    ("Information Technology", "Information Technology"),
    ("Computer Science", "Computer Science"),
    ("Cyber Security", "Cyber Security"),
    ("AI & ML", "AI & ML"),
    ("Information Management", "Information Management"),
)


class Faculty(models.Model):
    faculty_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="faculty_profile"
    )
    employee_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=15, blank=True, null=True)
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    status = models.CharField(max_length=20, default="Active")
    subjects = models.ManyToManyField(
        "academics.Subject", related_name="faculty_members", blank=True
    )
    avatar = models.ImageField(upload_to="uploads/avatars/", blank=True, null=True)
    is_class_teacher = models.BooleanField(
        default=False, help_text="Whether this faculty is a class teacher"
    )
    is_hod = models.BooleanField(
        default=False, help_text="Whether this faculty is Head of Department"
    )
    class_course = models.ForeignKey(
        "academics.Course",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="class_teachers",
        help_text="Course for which this faculty is class teacher",
    )
    class_semester = models.IntegerField(
        default=1,
        null=True,
        blank=True,
        help_text="Semester for which this faculty is class teacher",
    )
    working_shift = models.CharField(
        max_length=20,
        choices=[
            ("Morning", "Morning"),
            ("Noon", "Noon"),
            ("Evening", "Evening"),
            ("Full Day", "Full Day"),
        ],
        default="Noon",
        help_text="Faculty working shift",
    )
    max_lectures_per_day = models.IntegerField(
        default=6,
        help_text="Maximum lectures faculty can take per day",
    )
    working_days = models.JSONField(
        default=list,
        blank=True,
        help_text="List of working days ['Monday', 'Tuesday', ...]",
    )

    # Additional fields
    gender = models.CharField(
        max_length=10,
        choices=[("Male", "Male"), ("Female", "Female"), ("Other", "Other")],
        blank=True,
        null=True,
    )
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True, null=True)
    designation = models.CharField(
        max_length=50,
        choices=[
            ("HOD", "Head of Department"),
            ("Professor", "Professor"),
            ("Associate Professor", "Associate Professor"),
            ("Assistant Professor", "Assistant Professor"),
            ("Lecturer", "Lecturer"),
            ("Visiting Faculty", "Visiting Faculty"),
        ],
        blank=True,
        null=True,
    )
    qualification = models.CharField(max_length=100, blank=True, null=True)
    experience_years = models.IntegerField(default=0)
    branch = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Campus branch (Kherva Mehsana / Ahmedabad)",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "faculty"
        verbose_name = "Faculty"
        verbose_name_plural = "Faculty"

    def __str__(self):
        return f"{self.name} ({self.employee_id})"


class Admin(models.Model):
    admin_id_pk = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="admin_profile"
    )
    admin_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=15, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "admins"
        verbose_name = "Admin"
        verbose_name_plural = "Admins"

    def __str__(self):
        return f"{self.name} ({self.admin_id})"


class Notification(models.Model):
    notification_id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    target = models.CharField(max_length=100)
    type = models.CharField(max_length=50)
    priority = models.CharField(max_length=50, default="Normal")
    title = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=50, default="Delivered")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.priority}] {self.title} -> {self.target}"

class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_otps')
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = "password_reset_otps"
        verbose_name = "Password Reset OTP"
        verbose_name_plural = "Password Reset OTPs"

    def __str__(self):
        return f"OTP for {self.user.email}"


class AdminActivityLog(models.Model):
    """Log for tracking admin activities."""
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('login', 'Login'),
        ('logout', 'Logout'),
    ]
    
    admin = models.ForeignKey(Admin, on_delete=models.CASCADE, related_name='activity_logs', null=True, blank=True)
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    target_model = models.CharField(max_length=100)
    target_id = models.CharField(max_length=100, null=True, blank=True)
    target_name = models.CharField(max_length=255, null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "admin_activity_logs"
        verbose_name = "Admin Activity Log"
        verbose_name_plural = "Admin Activity Logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=['admin', '-created_at']),
            models.Index(fields=['action', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.admin} - {self.action} on {self.target_model}"
    
    @staticmethod
    def log(admin=None, action='view', target_model='', target_id=None, target_name='', details=None, request=None):
        """Log an admin activity."""
        ip_address = None
        user_agent = None
        
        if request:
            # Get client IP
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[0].strip()
            else:
                ip_address = request.META.get('REMOTE_ADDR')
            user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        return AdminActivityLog.objects.create(
            admin=admin,
            action=action,
            target_model=target_model,
            target_id=target_id,
            target_name=target_name,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent,
        )
