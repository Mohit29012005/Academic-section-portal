from rest_framework.permissions import BasePermission


class FaceRegistrationRequired(BasePermission):
    """
    Applied globally via REST_FRAMEWORK settings.
    
    Rules:
      - Unauthenticated: pass through (IsAuthenticated handles it)
      - Faculty / Admin: always allowed
      - Student accessing NON attendance-ai routes: always allowed
      - Student accessing attendance-ai routes:
          → Exempt setup paths: allowed
          → Otherwise: must have is_face_registered = True
    """

    ATTENDANCE_AI_PREFIX = '/api/attendance-ai/'

    # Student can always hit these even without face registration
    EXEMPT_PATHS = [
        '/api/attendance-ai/registration-status/',
        '/api/attendance-ai/fill-details/',
        '/api/attendance-ai/register-face/',
        '/api/attendance-ai/verify-session/',
        '/api/auth/',
        '/django-admin/',
        '/media/',
    ]

    def has_permission(self, request, view):
        # Not authenticated — let IsAuthenticated handle it
        if not request.user or not request.user.is_authenticated:
            return True

        role = getattr(request.user, 'role', None)

        # Faculty / Admin pass unconditionally
        if role != 'student':
            return True

        # Only enforce for attendance-ai paths
        path = request.path
        if not path.startswith(self.ATTENDANCE_AI_PREFIX):
            return True

        # Exempt paths
        for exempt in self.EXEMPT_PATHS:
            if path.startswith(exempt):
                return True

        # Check face registration via StudentProfile
        try:
            from .models import StudentProfile
            profile = StudentProfile.objects.get(user=request.user)
            if not profile.is_face_registered:
                self.message = "Face registration required. Please complete attendance onboarding."
                return False
            return True
        except Exception:
            self.message = "Complete attendance setup before accessing this resource."
            return False
