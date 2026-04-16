from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.adapter import DefaultAccountAdapter
from allauth.exceptions import ImmediateHttpResponse
from django.http import HttpResponseRedirect
from django.utils.http import urlencode
from django.contrib.auth import get_user_model

User = get_user_model()

FRONTEND_LOGIN_URL = "http://localhost:5173/login"


class RestrictedAccountAdapter(DefaultAccountAdapter):
    """
    Prevents any new account signup via allauth (both social and regular).
    Only admin-created accounts are allowed.
    """
    def is_open_for_signup(self, request, *args, **kwargs):
        return False


class RestrictSocialLoginAdapter(DefaultSocialAccountAdapter):
    """
    Restricts Google login to ONLY users whose email already exists
    in the system (created by admin). If the email doesn't exist,
    the user gets redirected back to the login page with an error.
    """

    def is_open_for_signup(self, request, sociallogin):
        """
        Block new account creation via social login.
        Only allow if email already exists in User table.
        """
        email = sociallogin.user.email
        if not email:
            return False
        return User.objects.filter(email__iexact=email).exists()

    def pre_social_login(self, request, sociallogin):
        """
        Called after Google auth but before login completes.
        If this email is not in our database, block immediately.
        """
        email = sociallogin.user.email
        if not email or not User.objects.filter(email__iexact=email).exists():
            params = {
                "error": "This email is not registered in our system. Please contact the administrator.",
                "social_error": "unregistered"
            }
            url = f"{FRONTEND_LOGIN_URL}?{urlencode(params)}"
            raise ImmediateHttpResponse(HttpResponseRedirect(url))

        # If user exists, connect the social account to existing user
        try:
            existing_user = User.objects.get(email__iexact=email)
            if sociallogin.is_existing:
                # Already connected, nothing to do
                return
            # Connect this social login to the existing user
            sociallogin.connect(request, existing_user)
        except User.DoesNotExist:
            pass

    def get_connect_redirect_url(self, request, socialaccount):
        """After connecting, redirect to our success handler."""
        return "/api/auth/social/success/"
