from rest_framework import serializers
from .models import User, Student, Faculty, Admin, Notification


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'email', 'role', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['user_id', 'created_at', 'updated_at']


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)


class StudentSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = Student
        fields = [
            'student_id', 'enrollment_no', 'name', 'email', 'phone',
            'course', 'course_code', 'course_name', 'semester',
            'current_semester', 'total_semesters', 'cgpa', 'status', 'avatar',
            'is_face_registered',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['student_id', 'created_at', 'updated_at']


class StudentProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['name', 'phone', 'avatar']


class FacultySerializer(serializers.ModelSerializer):
    subjects_list = serializers.SerializerMethodField()

    class Meta:
        model = Faculty
        fields = [
            'faculty_id', 'employee_id', 'name', 'email', 'phone',
            'department', 'status', 'subjects', 'subjects_list', 'avatar',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['faculty_id', 'created_at', 'updated_at']

    def get_subjects_list(self, obj):
        return [{'subject_id': str(s.subject_id), 'code': s.code, 'name': s.name} for s in obj.subjects.all()]


class FacultyProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ['name', 'phone', 'avatar']


class AdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admin
        fields = [
            'admin_id_pk', 'admin_id', 'name', 'email', 'phone',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['admin_id_pk', 'created_at', 'updated_at']


class CreateUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=['student', 'faculty', 'admin'])
    name = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True)
    # Student fields
    enrollment_no = serializers.CharField(required=False)
    course_id = serializers.UUIDField(required=False)
    semester = serializers.IntegerField(required=False, default=1)
    # Faculty fields
    employee_id = serializers.CharField(required=False)
    department = serializers.CharField(required=False)
    # Admin fields
    admin_id = serializers.CharField(required=False)


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    new_password = serializers.CharField(write_only=True, min_length=6)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
