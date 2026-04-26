import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ampics.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

u = User.objects.filter(email='mohitprajapati4412@gmail.com').first()
if u:
    u.set_password('12345678')
    u.save()
    print('EMAIL:', u.email, 'PASSWORD RESET TO: 12345678')
else:
    print('USER NOT FOUND')
