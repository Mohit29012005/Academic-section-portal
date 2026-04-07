#!/usr/bin/env python
"""
Quick setup script for AI powered Career Guidance system Django project
Handles migrations, superuser creation, and initial setup
"""

import os
import sys
import django
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

django.setup()

from django.core.management import call_command
from django.contrib.auth.models import User


def setup_database():
    """Run migrations to set up the database"""
    print("\n" + "="*60)
    print("Running Django migrations...")
    print("="*60)
    
    try:
        call_command('migrate', verbosity=2)
        print("✅ Migrations completed successfully!")
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return False
    
    return True


def create_superuser():
    """Create a superuser if none exists"""
    print("\n" + "="*60)
    print("Setting up Django Admin User")
    print("="*60)
    
    if User.objects.filter(username='admin').exists():
        print("✅ Admin user already exists")
        return True
    
    try:
        User.objects.create_superuser('admin', 'admin@evolvex.local', 'admin123')
        print("✅ Superuser created (username: admin, password: admin123)")
        print("⚠️  IMPORTANT: Change this password in production!")
    except Exception as e:
        print(f"❌ Failed to create superuser: {str(e)}")
        return False
    
    return True


def setup_static_files():
    """Collect static files"""
    print("\n" + "="*60)
    print("Collecting static files...")
    print("="*60)
    
    try:
        call_command('collectstatic', interactive=False, verbosity=1)
        print("✅ Static files collected successfully!")
    except Exception as e:
        print(f"⚠️  Static files collection warning: {str(e)}")
    
    return True


def main():
    """Run all setup steps"""
    print("\n" + "="*70)
    print("🚀 AI powered Career Guidance system - DJANGO SETUP")
    print("="*70)
    
    # Step 1: Migrations
    if not setup_database():
        print("\n❌ Setup failed at migration step")
        sys.exit(1)
    
    # Step 2: Superuser
    if not create_superuser():
        print("\n⚠️  Setup continued despite superuser creation issue")
    
    # Step 3: Static files
    setup_static_files()
    
    # Final message
    print("\n" + "="*70)
    print("✅ SETUP COMPLETE!")
    print("="*70)
    print("\nNext steps:")
    print("1. Copy frontend files to evolvex_django/static/ and templates/")
    print("2. Update frontend API URLs to: http://localhost:8000/api/")
    print("3. Create .env file with your configuration")
    print("4. Run: python manage.py runserver")
    print("5. Admin panel: http://localhost:8000/admin/")
    print("6. Update the SECRET_KEY in production!")
    print("\nDocumentation: See DJANGO_SETUP_GUIDE.md\n")


if __name__ == '__main__':
    main()
