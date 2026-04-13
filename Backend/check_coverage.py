from academics.models import Course, Subject
from django.db.models import Count

def check_stats():
    stats = Subject.objects.values('course__name').annotate(cnt=Count('id')).order_by('course__name')
    print("\n--- SUBJECT STATS BY COURSE ---")
    for s in stats:
        print(f"{s['course__name']}: {s['cnt']} subjects")
    
    # Check semesters for B.Sc. (CA&IT)
    cait = Subject.objects.filter(course__name="B.Sc. (CA&IT)").values('semester').annotate(cnt=Count('id')).order_by('semester')
    print("\n--- B.Sc. (CA&IT) SEMESTER COVERAGE ---")
    for c in cait:
        print(f"Semester {c['semester']}: {c['cnt']} subjects")

if __name__ == "__main__":
    import django
    import os
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    try:
        django.setup()
    except: pass
    check_stats()
