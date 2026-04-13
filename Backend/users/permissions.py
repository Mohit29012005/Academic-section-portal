from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """
    Allows access only to Super Admin users.
    Super Admin has complete control over the entire system.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "super_admin"
        )


class IsAdminOrSuperAdmin(BasePermission):
    """
    Allows access to Admin and Super Admin users.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["admin", "super_admin"]
        )


class IsFacultyOrAbove(BasePermission):
    """
    Allows access to Faculty, Admin, and Super Admin users.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["faculty", "admin", "super_admin"]
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Allows access to the owner of the resource or Admin/Super Admin.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role == "super_admin":
            return True
        if request.user.role == "admin":
            return True
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "email"):
            return obj.email == request.user.email
        return False
