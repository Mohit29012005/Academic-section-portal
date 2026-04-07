"""
All API views for attendance_ai app.

Endpoints:
  Student:
    GET  /registration-status/
    POST /fill-details/
    POST /register-face/
    GET  /verify-session/<qr_token>/
    POST /mark-attendance-qr/
    GET  /student/<student_id>/report/
    GET  /notifications/
    POST /notifications/<id>/read/

  Faculty:
    POST /lecture/create/
    GET  /lecture/<session_id>/status/
    POST /lecture/<session_id>/end/
    POST /lecture/<session_id>/mark-manual/
    POST /mark-attendance-face/
    GET  /anomalies/
    POST /anomalies/<id>/resolve/
    POST /generate-pdf-report/
    GET  /faculty/sessions/

  Admin:
    GET  /admin/student-face-status/
    POST /admin/send-reminder/<student_id>/
    POST /admin/bulk-remind/
"""
import os
import logging
from datetime import date, datetime, timezone as dt_timezone

from django.conf import settings
from django.utils import timezone
from django.utils.timezone import make_aware, now
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status as drf_status

from .models import (
    StudentProfile, FaceEncoding, LectureSession,
    AttendanceRecord, AttendanceAnomaly, AttendanceNotification
)
from .serializers import (
    StudentProfileSerializer, LectureSessionSerializer,
    AttendanceRecordSerializer, AttendanceAnomalySerializer,
    AttendanceNotificationSerializer
)
from .face_engine import register_face_encodings, recognize_face
from .utils import generate_qr_code

logger = logging.getLogger(__name__)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _require_role(request, *roles):
    """Return Response(403) if user role not in roles, else None."""
    role = getattr(request.user, 'role', None)
    if role not in roles:
        return Response({'error': 'Permission denied.'}, status=403)
    return None

def _get_ai_profile(user):
    """Get or create StudentProfile for a user."""
    profile, _ = StudentProfile.objects.get_or_create(user=user)
    return profile

def _student_subject_stats(student, subject):
    """Returns (total, present, consecutive_recent_absences) for student+subject."""
    records = (
        AttendanceRecord.objects
        .filter(session__subject=subject, student=student)
        .select_related('session')
        .order_by('session__date', 'session__start_time')
    )
    total = records.count()
    present = records.filter(status__in=['present', 'late']).count()

    # Consecutive absences from the END
    statuses = list(records.values_list('status', flat=True))
    consecutive = 0
    for s in reversed(statuses):
        if s == 'absent':
            consecutive += 1
        else:
            break

    return total, present, consecutive


# ─── Student: Registration Status ────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def registration_status(request):
    """GET /registration-status/ — used by frontend on every student login."""
    err = _require_role(request, 'student', 'admin', 'faculty') # Allow all roles for admin status dashboard
    if err:
        return err

    user_id = request.GET.get('user_id')
    user = request.user
    if user_id and user.role in ('admin', 'faculty'):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(user_id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

    profile = _get_ai_profile(user)
    encoding_count = 0
    try:
        fe = FaceEncoding.objects.get(student=user)
        encoding_count = fe.encoding_count
    except FaceEncoding.DoesNotExist:
        pass

    return Response({
        'is_details_filled': profile.is_details_filled,
        'is_face_registered': profile.is_face_registered,
        'face_encoding_count': encoding_count,
        'profile_complete': profile.is_details_filled and profile.is_face_registered,
        'face_registered_at': profile.face_registered_at,
        'registered_face_photo': request.build_absolute_uri(profile.registered_face_photo.url) if profile.registered_face_photo else None,
        'details': {
            'phone': profile.phone_number,
            'parent_phone': profile.parent_phone_number,
            'email': profile.email,
        }
    })


# ─── Student: Fill Details ────────────────────────────────────────────────────
# ─── Student: Fill Details ────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fill_details(request):
    """POST /fill-details/ — save phone, parent phone, email."""
    err = _require_role(request, 'student')
    if err:
        return err

    phone = request.data.get('phone_number', '').strip()
    parent_phone = request.data.get('parent_phone_number', '').strip()
    email = request.data.get('email', '').strip()

    if not phone or not parent_phone or not email:
        return Response({'success': False, 'message': 'All fields are required.'}, status=400)

    profile = _get_ai_profile(request.user)
    profile.phone_number = phone
    profile.parent_phone_number = parent_phone
    profile.email = email
    profile.is_details_filled = True
    profile.save()

    return Response({'success': True, 'message': 'Details saved successfully.'})


# ─── Student: Register Face ───────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_face(request):
    """POST /register-face/ — submit 5 base64 images to generate face encodings."""
    err = _require_role(request, 'student')
    if err:
        return err

    images = request.data.get('images', [])
    if not images or len(images) < 5:
        return Response({'success': False, 'message': 'Please provide exactly 5 face images.'}, status=400)

    try:
        student_profile = request.user.student_profile
        student_id = str(student_profile.student_id)
    except Exception:
        student_id = str(request.user.user_id)

    # Use the first image as the reference photo
    from .face_engine import _b64_to_file, REG_PHOTO_DIR
    photo_name = f"{student_id}_ref.jpg"
    photo_path = os.path.join(REG_PHOTO_DIR, photo_name)
    _b64_to_file(images[0], photo_path)

    result = register_face_encodings(student_id, images)

    if not result.get('success'):
        return Response({
            'success': False,
            'failed_images': result.get('failed_indices', []),
            'message': result.get('message', 'Face encoding failed.'),
        }, status=400)

    # Save encoding record
    encoding_path = result['encoding_path']
    fe, _ = FaceEncoding.objects.get_or_create(student=request.user)
    fe.encoding_path = encoding_path
    fe.encoding_count = result.get('count', 5)
    fe.save()

    # Update StudentProfile
    ai_profile = _get_ai_profile(request.user)
    ai_profile.is_face_registered = True
    ai_profile.face_registered_at = now()
    ai_profile.registered_face_photo = f"registered_faces/{photo_name}"
    ai_profile.save()

    # Also sync to users.Student for backward compat
    try:
        request.user.student_profile.is_face_registered = True
        request.user.student_profile.save(update_fields=['is_face_registered'])
    except Exception:
        pass

    return Response({
        'success': True,
        'encoding_count': fe.encoding_count,
        'message': 'Face registered successfully! Redirecting to dashboard...',
    })


# ─── Public: Verify QR Session ───────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def verify_session(request, qr_token):
    """GET /verify-session/<qr_token>/ — public, called before student login."""
    try:
        session = LectureSession.objects.select_related('subject', 'faculty').get(qr_token=qr_token)
    except LectureSession.DoesNotExist:
        return Response({'valid': False, 'message': 'Invalid QR code.'})

    if not session.is_active:
        return Response({'valid': False, 'message': 'This session has ended.'})

    if session.qr_expires_at and now() > session.qr_expires_at:
        return Response({'valid': False, 'message': 'QR code has expired.'})

    try:
        faculty_name = session.faculty.faculty_profile.name
    except Exception:
        faculty_name = session.faculty.email

    return Response({
        'valid': True,
        'session_id': session.id,
        'subject_name': session.subject.name,
        'subject_code': session.subject.code,
        'faculty_name': faculty_name,
        'date': str(session.date),
        'start_time': str(session.start_time),
        'end_time': str(session.end_time),
        'message': 'Session is active.',
    })


# ─── Student: Mark Attendance via QR ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_attendance_qr(request):
    """POST /mark-attendance-qr/ — student marks attendance after login & QR verification."""
    err = _require_role(request, 'student')
    if err:
        return err

    qr_token = request.data.get('qr_token', '').strip()
    frame_b64 = request.data.get('frame') # Optional but recommended for extra verification
    
    if not qr_token:
        return Response({'success': False, 'message': 'QR token is required.'}, status=400)

    try:
        session = LectureSession.objects.select_related('subject').get(qr_token=qr_token)
    except LectureSession.DoesNotExist:
        return Response({'success': False, 'message': 'Invalid QR token.'}, status=400)

    if not session.is_active:
        return Response({'success': False, 'message': 'Session has ended.'}, status=400)

    if session.qr_expires_at and now() > session.qr_expires_at:
        return Response({'success': False, 'message': 'QR code has expired.'}, status=400)

    # Check already marked
    if AttendanceRecord.objects.filter(session=session, student=request.user).exists():
        return Response({'success': False, 'message': 'You are already marked present for this session.'}, status=400)

    # Face verification (if frame provided)
    confidence = None
    snapshot_path = ''
    if frame_b64:
        # Verify against THIS student specifically
        encodings_map = {}
        try:
            fe = FaceEncoding.objects.get(student=request.user)
            # Fetch users.Student for the name
            try:
                name = request.user.student_profile.name
                roll_no = request.user.student_profile.enrollment_no
            except:
                name = request.user.email
                roll_no = ''
                
            encodings_map[str(request.user.user_id)] = {
                'encoding_path': fe.encoding_path,
                'user': request.user,
                'name': name,
                'roll_no': roll_no,
            }
            from .face_engine import recognize_face
            res = recognize_face(frame_b64, encodings_map)
            if not res.get('recognized'):
                 return Response({'success': False, 'message': 'Face verification failed. Please try again.'}, status=403)
            confidence = res.get('confidence')
            
            # Save snapshot
            snap_dir = os.path.join(settings.MEDIA_ROOT, 'attendance_snapshots', str(date.today()))
            os.makedirs(snap_dir, exist_ok=True)
            snap_file = os.path.join(snap_dir, f"qr_{request.user.user_id}.jpg")
            try:
                img_data = base64.b64decode(frame_b64.split(',')[-1])
                with open(snap_file, 'wb') as f:
                    f.write(img_data)
                snapshot_path = f"attendance_snapshots/{date.today()}/qr_{request.user.user_id}.jpg"
            except: pass
        except FaceEncoding.DoesNotExist:
            return Response({'success': False, 'message': 'Face registration incomplete.'}, status=403)
    else:
        # If no frame provided, still check if registered
        try:
            ai_profile = StudentProfile.objects.get(user=request.user)
            if not ai_profile.is_face_registered:
                return Response({'success': False, 'message': 'Face registration required.'}, status=403)
        except StudentProfile.DoesNotExist:
             return Response({'success': False, 'message': 'Onboarding incomplete.'}, status=403)

    ip_address = request.META.get('REMOTE_ADDR', '')
    record = AttendanceRecord.objects.create(
        session=session,
        student=request.user,
        status='present',
        marked_via='qr_link',
        ip_address=ip_address,
        confidence_score=confidence,
        snapshot_path=snapshot_path
    )

    try:
        student_name = request.user.student_profile.name
    except Exception:
        student_name = request.user.email

    return Response({
        'success': True,
        'student_name': student_name,
        'subject': session.subject.name,
        'marked_at': record.marked_at,
        'message': 'Attendance marked successfully!',
    })


# ─── Faculty: Create Lecture Session ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_lecture(request):
    """POST /lecture/create/ — faculty creates a session and gets QR code."""
    err = _require_role(request, 'faculty')
    if err:
        return err

    subject_id = request.data.get('subject_id')
    date_str = request.data.get('date')
    start_time = request.data.get('start_time')
    end_time = request.data.get('end_time')
    total_students = request.data.get('total_students', 0)
    session_type = request.data.get('session_type', 'lecture')

    if not all([subject_id, date_str, start_time, end_time]):
        return Response({'error': 'subject_id, date, start_time, end_time are required.'}, status=400)

    from academics.models import Subject
    try:
        subject = Subject.objects.get(subject_id=subject_id)
    except Subject.DoesNotExist:
        return Response({'error': 'Subject not found.'}, status=404)

    # Parse date and compute qr_expires_at
    try:
        session_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        end_dt = make_aware(datetime.strptime(f"{date_str} {end_time}", '%Y-%m-%d %H:%M'))
    except ValueError as e:
        return Response({'error': f'Date/time format error: {e}'}, status=400)

    session = LectureSession.objects.create(
        subject=subject,
        faculty=request.user,
        date=session_date,
        start_time=start_time,
        end_time=end_time,
        total_students=int(total_students),
        session_type=session_type,
        qr_expires_at=end_dt,
    )

    # Generate QR code
    domain = getattr(settings, 'SITE_DOMAIN', 'localhost:5173')
    try:
        rel_path, attendance_url = generate_qr_code(session.id, str(session.qr_token), domain)
        session.qr_image_path = rel_path
        session.save(update_fields=['qr_image_path'])
    except Exception as e:
        logger.error(f"QR generation failed: {e}")
        attendance_url = f"http://{domain}/student/mark-attendance/{session.qr_token}/"
        rel_path = ''

    qr_image_url = f"{settings.MEDIA_URL}{rel_path}" if rel_path else ''

    return Response({
        'session_id': session.id,
        'qr_token': str(session.qr_token),
        'qr_image_url': request.build_absolute_uri(qr_image_url) if qr_image_url else '',
        'attendance_link': attendance_url,
        'total_students': session.total_students,
        'expires_at': session.qr_expires_at,
        'subject': subject.name,
        'date': str(session.date),
    })


# ─── Faculty: Lecture Status ──────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lecture_status(request, session_id):
    """GET /lecture/<session_id>/status/ — live count + student list."""
    try:
        session = LectureSession.objects.select_related('subject', 'faculty').get(id=session_id)
    except LectureSession.DoesNotExist:
        return Response({'error': 'Session not found.'}, status=404)

    records = AttendanceRecord.objects.filter(session=session).select_related('student')
    present_count = records.filter(status__in=['present', 'late']).count()
    absent_count = session.total_students - present_count

    students_data = []
    for rec in records:
        try:
            sp = rec.student.student_profile
            name = sp.name
            roll_no = sp.enrollment_no
        except Exception:
            name = rec.student.email
            roll_no = ''
        
        # Get AI profile photo
        registered_photo = None
        try:
            ap = rec.student.ai_profile
            if ap.registered_face_photo:
                registered_photo = request.build_absolute_uri(ap.registered_face_photo.url)
        except Exception:
            pass

        students_data.append({
            'name': name,
            'roll_no': roll_no,
            'status': rec.status,
            'marked_via': rec.marked_via,
            'marked_at': rec.marked_at,
            'confidence_score': rec.confidence_score,
            'snapshot_path': request.build_absolute_uri(settings.MEDIA_URL + rec.snapshot_path) if rec.snapshot_path else None,
            'registered_photo': registered_photo,
        })

    pct = round((present_count / session.total_students * 100), 1) if session.total_students > 0 else 0

    return Response({
        'session_id': session.id,
        'subject': session.subject.name,
        'date': str(session.date),
        'total_students': session.total_students,
        'present_count': present_count,
        'absent_count': absent_count,
        'percentage': pct,
        'is_active': session.is_active,
        'students': students_data,
    })


# ─── Faculty: End Lecture Session ────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def end_lecture(request, session_id):
    """POST /lecture/<session_id>/end/ — close session, mark everyone else absent, trigger anomaly detection."""
    err = _require_role(request, 'faculty')
    if err:
        return err

    try:
        session = LectureSession.objects.select_related('subject').get(id=session_id, faculty=request.user)
    except LectureSession.DoesNotExist:
        return Response({'error': 'Session not found or access denied.'}, status=404)

    session.is_active = False
    session.save(update_fields=['is_active'])

    # Determine marked students
    marked_ids = set(AttendanceRecord.objects.filter(session=session).values_list('student_id', flat=True))

    # Get enrolled students from academics (same course, same semester, same subject)
    from users.models import Student
    try:
        enrolled_students = Student.objects.filter(course=session.subject.course).select_related('user')
    except Exception:
        enrolled_students = []

    # Create absent records for everyone not marked
    absent_created = 0
    for stu in enrolled_students:
        if stu.user.id not in marked_ids:
            AttendanceRecord.objects.get_or_create(
                session=session,
                student=stu.user,
                defaults={'status': 'absent', 'marked_via': 'manual'},
            )
            absent_created += 1

    # Trigger Celery anomaly detection for all students
    from .tasks import detect_anomalies
    for stu in enrolled_students:
        detect_anomalies.delay(str(stu.user.user_id), str(session.subject.subject_id))

    present_count = AttendanceRecord.objects.filter(session=session, status__in=['present', 'late']).count()
    absent_count = session.total_students - present_count
    pct = round((present_count / session.total_students * 100), 1) if session.total_students > 0 else 0

    return Response({
        'success': True,
        'present_count': present_count,
        'absent_count': absent_count,
        'total_students': session.total_students,
        'percentage': pct,
        'message': 'Session ended. Anomaly detection triggered.',
    })


# ─── Faculty: Mark Manual ─────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_manual(request, session_id):
    """POST /lecture/<session_id>/mark-manual/ — override or create a record manually."""
    err = _require_role(request, 'faculty')
    if err:
        return err

    student_id = request.data.get('student_id')
    new_status = request.data.get('status', 'present')

    if not student_id:
        return Response({'error': 'student_id is required.'}, status=400)

    try:
        session = LectureSession.objects.get(id=session_id, faculty=request.user)
    except LectureSession.DoesNotExist:
        return Response({'error': 'Session not found.'}, status=404)

    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        student_user = User.objects.get(user_id=student_id, role='student')
    except User.DoesNotExist:
        return Response({'error': 'Student not found.'}, status=404)

    record, created = AttendanceRecord.objects.update_or_create(
        session=session,
        student=student_user,
        defaults={'status': new_status, 'marked_via': 'manual'},
    )
    return Response({'success': True, 'created': created, 'status': record.status})


# ─── Faculty: Mark with Face Recognition ─────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_attendance_face(request):
    """POST /mark-attendance-face/ — faculty sends webcam frame, backend matches face."""
    err = _require_role(request, 'faculty')
    if err:
        return err

    session_id = request.data.get('session_id')
    frame_b64 = request.data.get('frame')

    if not session_id or not frame_b64:
        return Response({'error': 'session_id and frame are required.'}, status=400)

    try:
        session = LectureSession.objects.select_related('subject').get(id=session_id, is_active=True)
    except LectureSession.DoesNotExist:
        return Response({'error': 'Active session not found.'}, status=404)

    # Load all face encodings for this subject's students
    from users.models import Student
    encodings_map = {}
    try:
        students = Student.objects.filter(course=session.subject.course).select_related('user')
        for stu in students:
            try:
                fe = FaceEncoding.objects.get(student=stu.user)
                encodings_map[str(stu.user.user_id)] = {
                    'encoding_path': fe.encoding_path,
                    'user': stu.user,
                    'name': stu.name,
                    'roll_no': stu.enrollment_no,
                }
            except FaceEncoding.DoesNotExist:
                pass
    except Exception as e:
        logger.error(f"Loading encodings failed: {e}")

    result = recognize_face(frame_b64, encodings_map)

    if not result.get('recognized'):
        return Response({'recognized': False, 'message': result.get('message', 'Face not recognized.')})

    matched_user_id = result['student_id']
    matched_user = encodings_map[matched_user_id]['user']
    confidence = result.get('confidence', 0)
    already_marked = AttendanceRecord.objects.filter(session=session, student=matched_user).exists()

    snapshot_path = ''
    if not already_marked:
        # Save snapshot
        snap_dir = os.path.join(settings.MEDIA_ROOT, 'attendance_snapshots', str(date.today()))
        os.makedirs(snap_dir, exist_ok=True)
        snap_file = os.path.join(snap_dir, f"{matched_user_id}.jpg")
        try:
            import base64
            from PIL import Image
            import io
            img_data = base64.b64decode(frame_b64.split(',')[-1])
            img = Image.open(io.BytesIO(img_data))
            img.save(snap_file)
            snapshot_path = f"attendance_snapshots/{date.today()}/{matched_user_id}.jpg"
        except Exception:
            pass

        AttendanceRecord.objects.create(
            session=session,
            student=matched_user,
            status='present',
            marked_via='face_recognition',
            confidence_score=confidence,
            snapshot_path=snapshot_path,
        )

    return Response({
        'recognized': True,
        'student_name': encodings_map[matched_user_id]['name'],
        'roll_no': encodings_map[matched_user_id]['roll_no'],
        'confidence_score': round(confidence, 1),
        'snapshot_path': snapshot_path,
        'already_marked': already_marked,
    })


# ─── Student/Faculty: Attendance Report ──────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_report(request, student_id):
    from django.contrib.auth import get_user_model
    from academics.models import Subject

    User = get_user_model()
    role = getattr(request.user, 'role', '')

    if role == 'student':
        try:
            student_user = User.objects.get(user_id=student_id, role='student')
            if student_user.user_id != request.user.user_id:
                return Response({'error': 'Access denied.'}, status=403)
        except User.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)
    elif role in ('faculty', 'admin'):
        try:
            student_user = User.objects.get(user_id=student_id, role='student')
        except User.DoesNotExist:
            return Response({'error': 'Student not found.'}, status=404)
    else:
        return Response({'error': 'Permission denied.'}, status=403)

    try:
        enrolled_subjects = Subject.objects.filter(course=student_user.student_profile.course)
    except Exception:
        enrolled_subjects = []

    report = []
    for subj in enrolled_subjects:
        total, present, _ = _student_subject_stats(student_user, subj)
        absent = total - present
        pct = round((present / total * 100), 1) if total > 0 else 0
        last_absent = (
            AttendanceRecord.objects
            .filter(session__subject=subj, student=student_user, status='absent')
            .order_by('-session__date')
            .values_list('session__date', flat=True)
            .first()
        )
        report.append({
            'subject_name': subj.name,
            'subject_code': subj.code,
            'total_classes': total,
            'present_count': present,
            'absent_count': absent,
            'percentage': pct,
            'is_below_threshold': pct < 75 and total > 0,
            'last_absent_date': str(last_absent) if last_absent else None,
        })

    return Response({'student_id': str(student_id), 'report': report})


# ─── Faculty/Admin: Anomalies ────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def anomalies_list(request):
    err = _require_role(request, 'faculty', 'admin')
    if err:
        return err

    qs = AttendanceAnomaly.objects.filter(is_resolved=False).select_related('student', 'subject')

    severity = request.GET.get('severity')
    if severity:
        qs = qs.filter(severity=severity)

    subject_id = request.GET.get('subject_id')
    if subject_id:
        qs = qs.filter(subject__subject_id=subject_id)

    return Response(AttendanceAnomalySerializer(qs, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resolve_anomaly(request, anomaly_id):
    err = _require_role(request, 'faculty', 'admin')
    if err:
        return err

    try:
        anomaly = AttendanceAnomaly.objects.get(id=anomaly_id)
    except AttendanceAnomaly.DoesNotExist:
        return Response({'error': 'Not found.'}, status=404)

    anomaly.is_resolved = True
    anomaly.resolved_at = now()
    anomaly.save(update_fields=['is_resolved', 'resolved_at'])
    return Response({'success': True})


# ─── Generate PDF Report ──────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_pdf_report(request):
    err = _require_role(request, 'faculty', 'admin')
    if err:
        return err

    subject_id = request.data.get('subject_id')
    date_from = request.data.get('date_from')
    date_to = request.data.get('date_to')

    if not all([subject_id, date_from, date_to]):
        return Response({'error': 'subject_id, date_from, date_to are required.'}, status=400)

    from .tasks import generate_attendance_pdf
    task = generate_attendance_pdf.delay(str(subject_id), date_from, date_to)
    return Response({'task_id': task.id, 'message': 'PDF report is being generated...'})


# ─── Student Notifications ────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_list(request):
    notifs = AttendanceNotification.objects.filter(recipient=request.user, is_read=False)
    return Response(AttendanceNotificationSerializer(notifs, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notif_id):
    try:
        n = AttendanceNotification.objects.get(id=notif_id, recipient=request.user)
        n.is_read = True
        n.save(update_fields=['is_read'])
        return Response({'success': True})
    except AttendanceNotification.DoesNotExist:
        return Response({'error': 'Not found.'}, status=404)


# ─── Faculty: Active Sessions for today ──────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def faculty_sessions(request):
    err = _require_role(request, 'faculty')
    if err:
        return err

    sessions = LectureSession.objects.filter(
        faculty=request.user,
        is_active=True,
        date=date.today(),
    ).select_related('subject')
    return Response(LectureSessionSerializer(sessions, many=True).data)


# ─── Admin: Student Face Registration Status ──────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_student_face_status(request):
    err = _require_role(request, 'admin')
    if err:
        return err

    from users.models import Student
    students = Student.objects.select_related('user').order_by('name')

    program_filter = request.GET.get('program')
    semester_filter = request.GET.get('semester')
    status_filter = request.GET.get('status')  # 'registered'|'pending'|'details_missing'

    if program_filter:
        students = students.filter(course__name__icontains=program_filter)
    if semester_filter:
        students = students.filter(current_semester=semester_filter)

    result = []
    for stu in students:
        try:
            ai_profile = StudentProfile.objects.get(user=stu.user)
            is_face = ai_profile.is_face_registered
            is_details = ai_profile.is_details_filled
            face_at = ai_profile.face_registered_at
        except StudentProfile.DoesNotExist:
            is_face = False
            is_details = False
            face_at = None

        if status_filter == 'registered' and not is_face:
            continue
        if status_filter == 'pending' and (is_face or not is_details):
            continue
        if status_filter == 'details_missing' and is_details:
            continue

        result.append({
            'student_id': str(stu.student_id),
            'user_id': str(stu.user.user_id),
            'name': stu.name,
            'enrollment_no': stu.enrollment_no,
            'program': stu.course.name if stu.course else '',
            'semester': stu.current_semester,
            'is_details_filled': is_details,
            'is_face_registered': is_face,
            'face_registered_at': face_at,
        })

    # Summary stats
    total = len(result)
    registered = sum(1 for r in result if r['is_face_registered'])
    pending = total - registered

    return Response({
        'students': result,
        'stats': {
            'total': total,
            'registered': registered,
            'pending': pending,
            'registration_pct': round((registered / total * 100), 1) if total > 0 else 0,
        },
    })


# ─── Admin: Send Reminder ─────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_face_reminder(request, student_id):
    err = _require_role(request, 'admin', 'faculty')
    if err:
        return err

    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        student_user = User.objects.get(user_id=student_id, role='student')
    except User.DoesNotExist:
        return Response({'error': 'Student not found.'}, status=404)

    AttendanceNotification.objects.create(
        recipient=student_user,
        notification_type='student_alert',
        message=(
            "📸 Reminder: Please complete your AI Attendance Face Registration. "
            "Go to the Attendance Setup page from your sidebar to complete this one-time setup."
        ),
    )
    return Response({'success': True, 'message': 'Reminder sent.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_remind(request):
    err = _require_role(request, 'admin')
    if err:
        return err

    pending = StudentProfile.objects.filter(is_face_registered=False).select_related('user')
    count = 0
    for profile in pending:
        AttendanceNotification.objects.create(
            recipient=profile.user,
            notification_type='student_alert',
            message=(
                "📸 Action Required: Face registration for AI Attendance is pending. "
                "Please complete it from the Attendance Setup page."
            ),
        )
        count += 1
    return Response({'success': True, 'reminded': count})
