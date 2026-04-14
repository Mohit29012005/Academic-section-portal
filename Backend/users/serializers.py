from rest_framework import serializers
from .models import User, Student, Faculty, Admin, Notification


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["user_id", "email", "role", "is_active", "created_at", "updated_at"]
        read_only_fields = ["user_id", "created_at", "updated_at"]


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)


class StudentSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(
        source="course.code", read_only=True, allow_null=True
    )
    course_name = serializers.CharField(
        source="course.name", read_only=True, allow_null=True
    )
    course_id = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            "student_id",
            "enrollment_no",
            "name",
            "email",
            "phone",
            "course",
            "course_id",
            "course_code",
            "course_name",
            "semester",
            "current_semester",
            "total_semesters",
            "cgpa",
            "status",
            "avatar",
            "is_face_registered",
            "date_of_birth",
            "gender",
            "father_name",
            "address",
            "batch",
            "admission_year",
            "branch",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["student_id", "created_at", "updated_at"]

    def get_course_id(self, obj):
        return str(obj.course.course_id) if obj.course else None


class StudentProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            "gender",
            "avatar",
        ]


class FacultySerializer(serializers.ModelSerializer):
    subjects_list = serializers.SerializerMethodField()
    subjects_count = serializers.SerializerMethodField()
    class_course_name = serializers.CharField(
        source="class_course.name", read_only=True, allow_null=True, default=None
    )

    class Meta:
        model = Faculty
        fields = [
            "faculty_id",
            "employee_id",
            "name",
            "email",
            "phone",
            "department",
            "status",
            "subjects",
            "subjects_list",
            "subjects_count",
            "is_class_teacher",
            "class_course",
            "class_course_name",
            "class_semester",
            "working_shift",
            "avatar",
            "gender",
            "date_of_birth",
            "address",
            "designation",
            "qualification",
            "experience_years",
            "branch",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["faculty_id", "created_at", "updated_at"]

    def get_subjects_list(self, obj):
        subjects = obj.subjects.all()
        return [
            {
                "subject_id": str(s.subject_id),
                "code": s.code,
                "name": s.name,
                "semester": s.semester,
                "course": s.course.code if s.course else None,
                "campus_branch": s.campus_branch,
            }
            for s in subjects
        ]

    def get_subjects_count(self, obj):
        return obj.subjects.count()


class FacultyProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = [
            "gender",
            "avatar",
        ]


class AdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admin
        fields = [
            "admin_id_pk",
            "admin_id",
            "name",
            "email",
            "phone",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["admin_id_pk", "created_at", "updated_at"]


class CreateUserSerializer(serializers.Serializer):
    email = serializers.CharField()  # Personal email
    password = serializers.CharField(write_only=True, required=False, default="Guni@2026")
    role = serializers.ChoiceField(choices=["student", "faculty", "admin"])
    name = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True)
    # Student fields
    enrollment_no = serializers.CharField(required=False)
    course_id = serializers.UUIDField(required=False)
    semester = serializers.IntegerField(required=False, default=1)
    batch = serializers.CharField(required=False)
    # Faculty fields
    employee_id = serializers.CharField(required=False)
    department = serializers.CharField(required=False)
    subject_id = serializers.UUIDField(required=False)
    class_course_id = serializers.UUIDField(required=False)
    # Admin fields
    admin_id = serializers.CharField(required=False)


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    new_password = serializers.CharField(write_only=True, min_length=6)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
