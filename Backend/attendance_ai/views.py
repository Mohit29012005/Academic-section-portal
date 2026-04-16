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
from datetime import date, datetime, timedelta, timezone as dt_timezone
from urllib.parse import quote_plus, urlparse

from django.conf import settings
from django.utils import timezone
from django.utils.timezone import make_aware, now
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status as drf_status

from .models import (
    StudentProfile,
    FaceEncoding,
    LectureSession,
    AttendanceRecord,
    AttendanceAnomaly,
    AttendanceNotification,
)
from .serializers import (
    StudentProfileSerializer,
    LectureSessionSerializer,
    AttendanceRecordSerializer,
    AttendanceAnomalySerializer,
    AttendanceNotificationSerializer,
)
from .face_engine import register_face as engine_register_face, recognize_face, recognize_multi_faces

FACE_RECOGNITION_AVAILABLE = True

# Liveness & proxy detection (graceful imports)
try:
    from .liveness import check_liveness_single, check_liveness_multi_frame
    LIVENESS_AVAILABLE = True
except ImportError:
    LIVENESS_AVAILABLE = False

try:
    from .anomaly import determine_attendance_status, check_proxy_attendance, log_proxy_anomaly
    ANOMALY_DETECTION_AVAILABLE = True
except ImportError:
    ANOMALY_DETECTION_AVAILABLE = False

from .utils import generate_qr_code

logger = logging.getLogger(__name__)


# ─── Helpers ─────────────────────────────────────────────────────────────────


def _require_role(request, *roles):
    """Return Response(403) if user role not in roles, else None."""
    role = getattr(request.user, "role", None)
    if role not in roles:
        return Response({"error": "Permission denied."}, status=403)
    return None


def _get_ai_profile(user):
    """Get or create StudentProfile for a user."""
    profile, _ = StudentProfile.objects.get_or_create(user=user)
    return profile


def _student_subject_stats(student, subject):
    """Returns (total, present, consecutive_recent_absences) for student+subject."""
    records = (
        AttendanceRecord.objects.filter(session__subject=subject, student=student)
        .select_related("session")
        .order_by("session__date", "session__start_time")
    )
    total = records.count()
    present = records.filter(status__in=["present", "late"]).count()

    # Consecutive absences from the END
    statuses = list(records.values_list("status", flat=True))
    consecutive = 0
    for s in reversed(statuses):
        if s == "absent":
            consecutive += 1
        else:
            break

    return total, present, consecutive


def _frontend_base_url_from_request(request):
    """Best-effort frontend base URL from Origin/Referer, fallback to SITE_DOMAIN."""
    origin = request.headers.get("Origin", "").strip()
    if origin:
        parsed = urlparse(origin)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}"

    referer = request.headers.get("Referer", "").strip()
    if referer:
        parsed = urlparse(referer)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}"

    domain = getattr(settings, "SITE_DOMAIN", "localhost:5173")
    if domain.startswith("http://") or domain.startswith("https://"):
        return domain.rstrip("/")
    return f"http://{domain}".rstrip("/")


# ─── Student: Registration Status ────────────────────────────────────────────


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def registration_status(request):
    """GET /registration-status/ — used by frontend on every student login."""
    err = _require_role(
        request, "student", "admin", "faculty"
    )  # Allow all roles for admin status dashboard
    if err:
        return err

    user_id = request.GET.get("user_id")
    user = request.user
    if user_id and user.role in ("admin", "faculty"):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        try:
            user = User.objects.get(user_id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)

    profile = _get_ai_profile(user)
    encoding_count = 0
    try:
        fe = FaceEncoding.objects.get(student=user)
        encoding_count = fe.encoding_count
    except FaceEncoding.DoesNotExist:
        pass

    return Response(
        {
            "is_details_filled": profile.is_details_filled,
            "is_face_registered": profile.is_face_registered,
            "face_encoding_count": encoding_count,
            "profile_complete": profile.is_details_filled
            and profile.is_face_registered,
            "face_registered_at": profile.face_registered_at,
            "registered_face_photo": request.build_absolute_uri(
                profile.registered_face_photo.url
            )
            if profile.registered_face_photo
            else None,
            "details": {
                "phone": profile.phone_number,
                "parent_phone": profile.parent_phone_number,
                "email": profile.email,
            },
        }
    )


# ─── Student: Fill Details ────────────────────────────────────────────────────
# ─── Student: Fill Details ────────────────────────────────────────────────────


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def fill_details(request):
    """POST /fill-details/ — save phone, parent phone, email."""
    err = _require_role(request, "student")
    if err:
        return err

    phone = request.data.get("phone_number", "").strip()
    parent_phone = request.data.get("parent_phone_number", "").strip()
    email = request.data.get("email", "").strip()

    if not phone or not parent_phone or not email:
        return Response(
            {"success": False, "message": "All fields are required."}, status=400
        )

    profile = _get_ai_profile(request.user)
    profile.phone_number = phone
    profile.parent_phone_number = parent_phone
    profile.email = email
    profile.is_details_filled = True
    profile.save()

    return Response({"success": True, "message": "Details saved successfully."})


# ─── Student: Register Face ───────────────────────────────────────────────────


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def register_face(request):
    """POST /register-face/ — submit 5 base64 images to generate face encodings."""
    err = _require_role(request, "student")
    if err:
        return err

    images = request.data.get("images", [])
    if not images or len(images) < 5:
        return Response(
            {"success": False, "message": "Please provide exactly 5 face images."},
            status=400,
        )

    if not FACE_RECOGNITION_AVAILABLE:
        return Response(
            {
                "success": False,
                "message": "Face engine is unavailable on server. Please contact admin.",
            },
            status=503,
        )

    student_id = str(request.user.user_id)

    # Use the first image as the reference photo
    reg_photo_dir = os.path.join(settings.MEDIA_ROOT, "registered_faces")
    os.makedirs(reg_photo_dir, exist_ok=True)
    photo_name = f"{student_id}_ref.jpg"
    photo_path = os.path.join(reg_photo_dir, photo_name)

    try:
        import base64

        b64_str = images[0]
        if "," in b64_str:
            b64_str = b64_str.split(",")[1]
        with open(photo_path, "wb") as f:
            f.write(base64.b64decode(b64_str))
    except Exception as e:
        logger.error(f"Failed to save reference photo: {e}")

    try:
        result = engine_register_face(student_id, images)

        if not result.get("success"):
            return Response(
                {
                    "success": False,
                    "failed_images": result.get("failed_indices", []),
                    "message": result.get("message", "Face encoding failed."),
                },
                status=400,
            )

        # Save encoding record
        encoding_path = result["encoding_path"]
        fe, _ = FaceEncoding.objects.get_or_create(student=request.user)
        fe.encoding_path = encoding_path
        fe.encoding_count = result.get("encoding_count", 0)
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
            request.user.student_profile.save(update_fields=["is_face_registered"])
        except Exception:
            pass

        return Response(
            {
                "success": True,
                "encoding_count": fe.encoding_count,
                "message": "Face registered successfully! Redirecting to dashboard...",
            }
        )
    except Exception as e:
        import traceback

        with open("C:\\Academic-module\\Backend\\crash_log.txt", "w") as f:
            traceback.print_exc(file=f)
        return Response(
            {"success": False, "message": f"Server crash: {str(e)}"}, status=500
        )


# ─── Public: Verify QR Session ───────────────────────────────────────────────


@api_view(["GET"])
@permission_classes([AllowAny])
def verify_session(request, qr_token):
    """GET /verify-session/<qr_token>/ — public, called before student login."""
    try:
        session = LectureSession.objects.select_related("subject", "faculty").get(
            qr_token=qr_token
        )
    except LectureSession.DoesNotExist:
        return Response({"valid": False, "message": "Invalid QR code."})

    if not session.is_active:
        return Response({"valid": False, "message": "This session has ended."})

    if session.qr_expires_at and now() > session.qr_expires_at:
        return Response({"valid": False, "message": "QR code has expired."})

    try:
        faculty_name = session.faculty.faculty_profile.name
    except Exception:
        faculty_name = session.faculty.email

    return Response(
        {
            "valid": True,
            "session_id": session.id,
            "subject_name": session.subject.name,
            "subject_code": session.subject.code,
            "faculty_name": faculty_name,
            "date": str(session.date),
            "start_time": str(session.start_time),
            "end_time": str(session.end_time),
            "message": "Session is active.",
        }
    )


# ─── Student: Mark Attendance via QR ─────────────────────────────────────────


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_attendance_qr(request):
    """POST /mark-attendance-qr/ — student marks attendance after login & QR verification."""
    err = _require_role(request, "student")
    if err:
        return err

    qr_token = request.data.get("qr_token", "").strip()
    frame_b64 = request.data.get("frame")

    if not qr_token:
        return Response(
            {"success": False, "message": "QR token is required."}, status=400
        )

    if not FACE_RECOGNITION_AVAILABLE:
        return Response(
            {
                "success": False,
                "message": "Face engine is unavailable on server. Please contact admin.",
            },
            status=503,
        )

    if not frame_b64:
        return Response(
            {"success": False, "message": "Live face frame is required."}, status=400
        )

    try:
        session = LectureSession.objects.select_related("subject").get(
            qr_token=qr_token
        )
    except LectureSession.DoesNotExist:
        return Response({"success": False, "message": "Invalid QR token."}, status=400)

    if not session.is_active:
        return Response({"success": False, "message": "Session has ended."}, status=400)

    if session.qr_expires_at and now() > session.qr_expires_at:
        return Response(
            {"success": False, "message": "QR code has expired."}, status=400
        )

    # Check already marked
    if AttendanceRecord.objects.filter(session=session, student=request.user).exists():
        return Response(
            {
                "success": False,
                "message": "You are already marked present for this session.",
            },
            status=400,
        )

    # Face verification is mandatory for QR attendance marking.
    confidence = None
    snapshot_path = ""
    # Verify against THIS student specifically
    encodings_map = {}
    try:
        fe = FaceEncoding.objects.get(student=request.user)
        # Fetch users.Student for the name
        try:
            name = request.user.student_profile.name
            roll_no = request.user.student_profile.enrollment_no
        except Exception:
            name = request.user.email
            roll_no = ""

        encodings_map[str(request.user.user_id)] = {
            "encoding_path": fe.encoding_path,
            "user": request.user,
            "name": name,
            "roll_no": roll_no,
        }
        res = recognize_face(frame_b64)
        if not res.get("recognized") or res.get("student_id") != str(
            request.user.user_id
        ):
            return Response(
                {
                    "success": False,
                    "message": "Face verification failed or face does not match your profile.",
                },
                status=403,
            )

        confidence = res.get("confidence")

        # Save snapshot
        snap_dir = os.path.join(
            settings.MEDIA_ROOT, "attendance_snapshots", str(date.today())
        )
        os.makedirs(snap_dir, exist_ok=True)
        snap_file = os.path.join(snap_dir, f"qr_{request.user.user_id}.jpg")
        try:
            img_data = base64.b64decode(frame_b64.split(",")[-1])
            with open(snap_file, "wb") as f:
                f.write(img_data)
            snapshot_path = (
                f"attendance_snapshots/{date.today()}/qr_{request.user.user_id}.jpg"
            )
        except Exception:
            pass
    except FaceEncoding.DoesNotExist:
        return Response(
            {"success": False, "message": "Face registration incomplete."}, status=403
        )

    ip_address = request.META.get("REMOTE_ADDR", "")

    # Late detection — check if student is arriving after threshold
    attendance_status = "present"
    if ANOMALY_DETECTION_AVAILABLE:
        attendance_status = determine_attendance_status(session)

    record = AttendanceRecord.objects.create(
        session=session,
        student=request.user,
        status=attendance_status,
        marked_via="qr_link",
        ip_address=ip_address,
        confidence_score=confidence,
        snapshot_path=snapshot_path,
    )

    # Proxy detection
    if ANOMALY_DETECTION_AVAILABLE:
        proxy_check = check_proxy_attendance(request.user, session, confidence)
        if proxy_check["is_suspicious"]:
            log_proxy_anomaly(
                request.user, session,
                proxy_check["reasons"], proxy_check["severity"]
            )

    try:
        student_name = request.user.student_profile.name
    except Exception:
        student_name = request.user.email

    return Response(
        {
            "success": True,
            "student_name": student_name,
            "subject": session.subject.name,
            "marked_at": record.marked_at,
            "message": "Attendance marked successfully!",
        }
    )


# ─── Faculty: Create Lecture Session ─────────────────────────────────────────


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_lecture(request):
    """POST /lecture/create/ — faculty creates a session and gets QR code."""
    err = _require_role(request, "faculty", "admin")
    if err:
        return err

    subject_id = request.data.get("subject_id")
    date_str = request.data.get("date")
    start_time = request.data.get("start_time")
    end_time = request.data.get("end_time")
    total_students = request.data.get("total_students", 0)
    session_type = request.data.get("session_type", "lecture")

    if not all([subject_id, date_str, start_time, end_time]):
        return Response(
            {"error": "subject_id, date, start_time, end_time are required."},
            status=400,
        )

    from academics.models import Subject
    from users.models import Faculty

    # Admin bypasses subject assignment check
    if request.user.role != "admin":
        try:
            faculty = Faculty.objects.get(user=request.user)
            # Check M2M subjects first, then fallback to timetable slots
            has_via_m2m = faculty.subjects.filter(subject_id=subject_id).exists()
            if not has_via_m2m:
                from academics.models import TimetableSlot as TS
                has_via_timetable = TS.objects.filter(
                    faculty=faculty, subject_id=subject_id
                ).exists()
                if has_via_timetable:
                    # Auto-sync: add the missing M2M link
                    from academics.models import Subject as Subj
                    try:
                        faculty.subjects.add(Subj.objects.get(subject_id=subject_id))
                    except Subj.DoesNotExist:
                        pass
                else:
                    assigned = list(
                        faculty.subjects.values_list("code", flat=True)
                    ) or ["(none)"]
                    return Response(
                        {
                            "error": f"This subject is not assigned to you. Your assigned subjects: {', '.join(assigned)}"
                        },
                        status=403,
                    )
        except Faculty.DoesNotExist:
            return Response({"error": "Faculty profile not found."}, status=404)

    try:
        subject = Subject.objects.get(subject_id=subject_id)
    except Subject.DoesNotExist:
        return Response({"error": "Subject not found."}, status=404)

    # Parse date and compute qr_expires_at
    try:
        session_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        start_dt = make_aware(
            datetime.strptime(f"{date_str} {start_time}", "%Y-%m-%d %H:%M")
        )
        end_dt = make_aware(
            datetime.strptime(f"{date_str} {end_time}", "%Y-%m-%d %H:%M")
        )
    except ValueError as e:
        return Response({"error": f"Date/time format error: {e}"}, status=400)

    current_time = now()
    if session_date < current_time.date():
        return Response(
            {"error": "Past date is not allowed for a new session."}, status=400
        )
    if end_dt <= start_dt:
        return Response({"error": "End time must be after start time."}, status=400)

    # Avoid immediate QR expiry when faculty creates a session after configured end_time.
    qr_expires_at = end_dt
    if session_date == current_time.date() and end_dt <= current_time:
        qr_expires_at = current_time + timedelta(hours=2)

    session = LectureSession.objects.create(
        subject=subject,
        faculty=request.user,
        date=session_date,
        start_time=start_time,
        end_time=end_time,
        total_students=int(total_students),
        session_type=session_type,
        qr_expires_at=qr_expires_at,
    )

    # Generate QR code with the same frontend host/port currently in use.
    frontend_base_url = _frontend_base_url_from_request(request)
    domain = getattr(settings, "SITE_DOMAIN", "localhost:5173")
    fallback_qr_image_url = ""
    try:
        rel_path, attendance_url = generate_qr_code(
            session.id,
            str(session.qr_token),
            domain=domain,
            frontend_base_url=frontend_base_url,
        )
        session.qr_image_path = rel_path
        session.save(update_fields=["qr_image_path"])
    except Exception as e:
        logger.error(f"QR generation failed: {e}")
        attendance_url = (
            f"{frontend_base_url}/student/mark-attendance/{session.qr_token}/"
        )
        rel_path = ""
        fallback_qr_image_url = f"https://api.qrserver.com/v1/create-qr-code/?size=320x320&data={quote_plus(attendance_url)}"

    qr_image_url = (
        f"{settings.MEDIA_URL}{rel_path}" if rel_path else fallback_qr_image_url
    )

    return Response(
        {
            "session_id": session.id,
            "qr_token": str(session.qr_token),
            "qr_image_url": request.build_absolute_uri(qr_image_url)
            if qr_image_url.startswith("/")
            else qr_image_url,
            "attendance_link": attendance_url,
            "total_students": session.total_students,
            "expires_at": session.qr_expires_at,
            "subject": subject.name,
            "subject_code": subject.code,
            "course_code": subject.course.code,
            "course_name": subject.course.name,
            "date": str(session.date),
        }
    )


# ─── Faculty: Lecture Status ──────────────────────────────────────────────────


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def lecture_status(request, session_id):
    """GET /lecture/<session_id>/status/ — live count + student list."""
    try:
        session = LectureSession.objects.select_related("subject", "faculty").get(
            id=session_id
        )
    except LectureSession.DoesNotExist:
        return Response({"error": "Session not found."}, status=404)

    # Verify faculty ownership or admin bypass
    if request.user.role == "faculty" and session.faculty_id != request.user.id:
        return Response({"error": "Access denied."}, status=403)

    records = AttendanceRecord.objects.filter(session=session).select_related("student")
    present_count = records.filter(status__in=["present", "late"]).count()

    # Auto-calculate total_students from enrolled if not set
    if session.total_students == 0:
        from users.models import Student
        try:
            enrolled_count = Student.objects.filter(course=session.subject.course).count()
            if enrolled_count > 0:
                session.total_students = enrolled_count
                session.save(update_fields=["total_students"])
        except Exception:
            pass

    absent_count = session.total_students - present_count

    students_data = []
    for rec in records:
        try:
            sp = rec.student.student_profile
            name = sp.name
            roll_no = sp.enrollment_no
        except Exception:
            name = rec.student.email
            roll_no = ""

        # Get AI profile photo
        registered_photo = None
        try:
            ap = rec.student.ai_profile
            if ap.registered_face_photo:
                registered_photo = request.build_absolute_uri(
                    ap.registered_face_photo.url
                )
        except Exception:
            pass

        students_data.append(
            {
                "name": name,
                "roll_no": roll_no,
                "status": rec.status,
                "marked_via": rec.marked_via,
                "marked_at": rec.marked_at,
                "confidence_score": rec.confidence_score,
                "snapshot_path": request.build_absolute_uri(
                    settings.MEDIA_URL + rec.snapshot_path
                )
                if rec.snapshot_path
                else None,
                "registered_photo": registered_photo,
            }
        )

    pct = (
        round((present_count / session.total_students * 100), 1)
        if session.total_students > 0
        else 0
    )

    return Response(
        {
            "session_id": session.id,
            "subject": session.subject.name,
            "date": str(session.date),
            "total_students": session.total_students,
            "present_count": present_count,
            "absent_count": absent_count,
            "percentage": pct,
            "is_active": session.is_active,
            "students": students_data,
        }
    )


# ─── Faculty: End Lecture Session ────────────────────────────────────────────


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def end_lecture(request, session_id):
    """POST /lecture/<session_id>/end/ — close session, mark everyone else absent, trigger anomaly detection."""
    err = _require_role(request, "faculty", "admin")
    if err:
        return err

    try:
        session = LectureSession.objects.select_related("subject").get(id=session_id)
    except LectureSession.DoesNotExist:
        return Response({"error": "Session not found."}, status=404)

    # Verify faculty ownership or admin bypass
    if request.user.role == "faculty" and session.faculty_id != request.user.id:
        return Response({"error": "Session not found or access denied."}, status=404)

    session.is_active = False
    session.save(update_fields=["is_active"])

    # Determine marked students
    marked_ids = set(
        AttendanceRecord.objects.filter(session=session).values_list(
            "student_id", flat=True
        )
    )

    # Get enrolled students from academics (same course, same semester, same subject)
    from users.models import Student

    try:
        enrolled_students = Student.objects.filter(
            course=session.subject.course
        ).select_related("user")
    except Exception:
        enrolled_students = []

    # Create absent records for everyone not marked
    absent_created = 0
    for stu in enrolled_students:
        if stu.user.id not in marked_ids:
            AttendanceRecord.objects.get_or_create(
                session=session,
                student=stu.user,
                defaults={"status": "absent", "marked_via": "manual"},
            )
            absent_created += 1

    # Trigger Celery anomaly detection for all students
    from .tasks import detect_anomalies

    for stu in enrolled_students:
        detect_anomalies.delay(str(stu.user.user_id), str(session.subject.subject_id))

    # Auto-calculate total_students from enrolled if not set
    if session.total_students == 0 and enrolled_students:
        count = enrolled_students.count() if hasattr(enrolled_students, 'count') else len(enrolled_students)
        if count > 0:
            session.total_students = count
            session.save(update_fields=["total_students"])

    present_count = AttendanceRecord.objects.filter(
        session=session, status__in=["present", "late"]
    ).count()
    absent_count = session.total_students - present_count
    pct = (
        round((present_count / session.total_students * 100), 1)
        if session.total_students > 0
        else 0
    )

    return Response(
        {
            "success": True,
            "present_count": present_count,
            "absent_count": absent_count,
            "total_students": session.total_students,
            "percentage": pct,
            "message": "Session ended. Anomaly detection triggered.",
        }
    )


# ─── Faculty: Mark Manual ─────────────────────────────────────────────────────


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_manual(request, session_id):
    """POST /lecture/<session_id>/mark-manual/"""
    err = _require_role(request, "faculty", "admin")
    if err:
        return err

    student_id = request.data.get("student_id")
    new_status = request.data.get("status", "present")

    if not student_id:
        return Response({"error": "student_id is required."}, status=400)

    try:
        session = LectureSession.objects.get(id=session_id)
    except LectureSession.DoesNotExist:
        return Response({"error": "Session not found."}, status=404)

    # Verify faculty ownership or admin bypass
    if request.user.role == "faculty" and session.faculty_id != request.user.id:
        return Response({"error": "Session not found or access denied."}, status=404)

    from django.contrib.auth import get_user_model

    User = get_user_model()
    try:
        student_user = User.objects.get(user_id=student_id, role="student")
    except User.DoesNotExist:
        return Response({"error": "Student not found."}, status=404)

    record, created = AttendanceRecord.objects.update_or_create(
        session=session,
        student=student_user,
        defaults={"status": new_status, "marked_via": "manual"},
    )
    return Response({"success": True, "created": created, "status": record.status})


# ─── Faculty: Mark with Face Recognition ─────────────────────────────────────


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_attendance_face(request):
    """POST /mark-attendance-face/ — faculty sends webcam frame, backend matches face.
    Supports both single-face and multi-face modes.
    Integrates late marking and proxy detection.
    """
    err = _require_role(request, "faculty")
    if err:
        return err

    session_id = request.data.get("session_id")
    frame_b64 = request.data.get("frame")
    multi_mode = request.data.get("multi_face", False)  # Enable multi-face scanning

    if not session_id or not frame_b64:
        return Response({"error": "session_id and frame are required."}, status=400)

    if not FACE_RECOGNITION_AVAILABLE:
        return Response(
            {"recognized": False, "message": "Face engine unavailable. Contact admin."},
            status=503,
        )

    try:
        session = LectureSession.objects.select_related("subject").get(
            id=session_id, is_active=True
        )
    except LectureSession.DoesNotExist:
        return Response({"error": "Active session not found."}, status=404)

    if session.faculty_id != request.user.id:
        return Response({"error": "Access denied to this session."}, status=403)

    # Build encodings map for this subject's students
    from users.models import Student
    encodings_map = {}
    try:
        students = Student.objects.filter(course=session.subject.course).select_related("user")
        for stu in students:
            try:
                fe = FaceEncoding.objects.get(student=stu.user)
                encodings_map[str(stu.user.user_id)] = {
                    "encoding_path": fe.encoding_path,
                    "user": stu.user,
                    "name": stu.name,
                    "roll_no": stu.enrollment_no,
                }
            except FaceEncoding.DoesNotExist:
                pass
    except Exception as e:
        logger.error(f"Loading encodings failed: {e}")

    # ── Multi-face mode: detect ALL faces in frame ──
    if multi_mode:
        multi_result = recognize_multi_faces(frame_b64, session_id)
        newly_marked = []
        already_marked_list = []

        for face in multi_result.get("recognized", []):
            matched_user_id = face["student_id"]
            confidence = face.get("confidence", 0)

            # Resolve user
            if matched_user_id in encodings_map:
                matched_user = encodings_map[matched_user_id]["user"]
                matched_name = encodings_map[matched_user_id]["name"]
                matched_roll = encodings_map[matched_user_id]["roll_no"]
            else:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                try:
                    matched_user = User.objects.get(user_id=matched_user_id)
                    matched_name = getattr(getattr(matched_user, 'student_profile', None), 'name', matched_user.email)
                    matched_roll = getattr(getattr(matched_user, 'student_profile', None), 'enrollment_no', '')
                except Exception:
                    continue

            already = AttendanceRecord.objects.filter(session=session, student=matched_user).exists()
            if already:
                already_marked_list.append({"student_name": matched_name, "roll_no": matched_roll})
                continue

            # Late detection
            attendance_status = "present"
            if ANOMALY_DETECTION_AVAILABLE:
                attendance_status = determine_attendance_status(session)

            AttendanceRecord.objects.create(
                session=session, student=matched_user,
                status=attendance_status, marked_via="face_recognition",
                confidence_score=confidence,
            )

            # Proxy detection
            if ANOMALY_DETECTION_AVAILABLE:
                proxy_check = check_proxy_attendance(matched_user, session, confidence)
                if proxy_check["is_suspicious"]:
                    log_proxy_anomaly(matched_user, session, proxy_check["reasons"], proxy_check["severity"])

            newly_marked.append({
                "student_name": matched_name,
                "roll_no": matched_roll,
                "confidence_score": round(confidence, 1),
                "status": attendance_status,
            })

        return Response({
            "multi_face": True,
            "faces_detected": multi_result.get("faces_detected", 0),
            "newly_marked": newly_marked,
            "already_marked": already_marked_list,
            "unknown_count": multi_result.get("unknown_count", 0),
        })

    # ── Single-face mode (default) ──
    result = recognize_face(frame_b64, session_id)

    if not result.get("recognized"):
        return Response(
            {"recognized": False, "message": result.get("message", "Face not recognized.")}
        )

    matched_user_id = result["student_id"]
    try:
        matched_user = encodings_map[matched_user_id]["user"]
        matched_name = encodings_map[matched_user_id]["name"]
        matched_roll = encodings_map[matched_user_id]["roll_no"]
    except KeyError:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            matched_user = User.objects.get(user_id=matched_user_id)
            matched_name = getattr(getattr(matched_user, 'student_profile', None), 'name', matched_user.email)
            matched_roll = getattr(getattr(matched_user, 'student_profile', None), 'enrollment_no', '')
        except Exception:
            return Response({"recognized": False, "message": "Recognized unregistered student in DB."})

    confidence = result.get("confidence", 0)
    already_marked = AttendanceRecord.objects.filter(session=session, student=matched_user).exists()

    snapshot_path = ""
    if not already_marked:
        snap_dir = os.path.join(settings.MEDIA_ROOT, "attendance_snapshots", str(date.today()))
        os.makedirs(snap_dir, exist_ok=True)
        snap_file = os.path.join(snap_dir, f"{matched_user_id}.jpg")
        try:
            import base64 as b64_mod
            from PIL import Image as PILImage
            import io
            img_data = b64_mod.b64decode(frame_b64.split(",")[-1])
            img = PILImage.open(io.BytesIO(img_data))
            img.save(snap_file)
            snapshot_path = f"attendance_snapshots/{date.today()}/{matched_user_id}.jpg"
        except Exception:
            pass

        # Late detection
        attendance_status = "present"
        if ANOMALY_DETECTION_AVAILABLE:
            attendance_status = determine_attendance_status(session)

        AttendanceRecord.objects.create(
            session=session, student=matched_user,
            status=attendance_status, marked_via="face_recognition",
            confidence_score=confidence, snapshot_path=snapshot_path,
        )

        # Proxy detection
        if ANOMALY_DETECTION_AVAILABLE:
            proxy_check = check_proxy_attendance(matched_user, session, confidence)
            if proxy_check["is_suspicious"]:
                log_proxy_anomaly(matched_user, session, proxy_check["reasons"], proxy_check["severity"])

    return Response({
        "recognized": True,
        "student_name": matched_name,
        "roll_no": matched_roll,
        "confidence_score": round(confidence, 1),
        "snapshot_path": snapshot_path,
        "already_marked": already_marked,
        "status": attendance_status if not already_marked else None,
    })


# ─── Liveness Check ───────────────────────────────────────────────────────────


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def check_liveness(request):
    """POST /check-liveness/ — verify face is live (not a photo/screen).
    
    Accepts:
      - frames: list of 3-5 base64 images captured over ~3 seconds
      - OR frame: single base64 image for quick check
    
    Returns liveness score and pass/fail.
    """
    if not LIVENESS_AVAILABLE:
        return Response(
            {"error": "Liveness detection is not available on this server."},
            status=503,
        )

    frames_b64 = request.data.get("frames", [])
    single_frame = request.data.get("frame")

    if single_frame and not frames_b64:
        # Single-frame quick check
        from .face_engine import decode_base64_image
        rgb = decode_base64_image(single_frame)
        if rgb is None:
            return Response({"error": "Cannot decode image."}, status=400)
        result = check_liveness_single(rgb)
        return Response(result)

    if not frames_b64 or len(frames_b64) < 2:
        return Response(
            {"error": "Provide at least 2 frames for reliable liveness detection."},
            status=400,
        )

    from .face_engine import decode_base64_image
    rgb_frames = []
    for b64 in frames_b64:
        rgb = decode_base64_image(b64)
        if rgb is not None:
            rgb_frames.append(rgb)

    if len(rgb_frames) < 2:
        return Response(
            {"error": "Could not decode enough valid frames."}, status=400
        )

    result = check_liveness_multi_frame(rgb_frames)
    return Response(result)


# ─── Faculty: Multi-Face Attendance (batch endpoint) ─────────────────────────


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_attendance_multi_face(request):
    """POST /mark-attendance-multi-face/ — detect ALL faces in one frame.
    Convenience wrapper that calls mark_attendance_face with multi_face=True.
    """
    request.data["multi_face"] = True
    return mark_attendance_face(request)


# ─── Student/Faculty: Attendance Report ──────────────────────────────────────


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_report(request, student_id):
    from django.contrib.auth import get_user_model
    from academics.models import Subject

    User = get_user_model()
    role = getattr(request.user, "role", "")

    if role == "student":
        try:
            student_user = User.objects.get(user_id=student_id, role="student")
            if student_user.user_id != request.user.user_id:
                return Response({"error": "Access denied."}, status=403)
        except User.DoesNotExist:
            return Response({"error": "Not found."}, status=404)
    elif role in ("faculty", "admin"):
        try:
            student_user = User.objects.get(user_id=student_id, role="student")
        except User.DoesNotExist:
            return Response({"error": "Student not found."}, status=404)
    else:
        return Response({"error": "Permission denied."}, status=403)

    try:
        enrolled_subjects = Subject.objects.filter(
            course=student_user.student_profile.course
        )
    except Exception:
        enrolled_subjects = []

    report = []
    for subj in enrolled_subjects:
        total, present, _ = _student_subject_stats(student_user, subj)
        absent = total - present
        pct = round((present / total * 100), 1) if total > 0 else 0
        last_absent = (
            AttendanceRecord.objects.filter(
                session__subject=subj, student=student_user, status="absent"
            )
            .order_by("-session__date")
            .values_list("session__date", flat=True)
            .first()
        )
        report.append(
            {
                "subject_name": subj.name,
                "subject_code": subj.code,
                "total_classes": total,
                "present_count": present,
                "absent_count": absent,
                "percentage": pct,
                "is_below_threshold": pct < 75 and total > 0,
                "last_absent_date": str(last_absent) if last_absent else None,
            }
        )

    return Response({"student_id": str(student_id), "report": report})


# ─── Faculty/Admin: Anomalies ────────────────────────────────────────────────


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def anomalies_list(request):
    err = _require_role(request, "faculty", "admin")
    if err:
        return err

    qs = AttendanceAnomaly.objects.filter(is_resolved=False).select_related(
        "student", "subject"
    )

    # Faculty can only see anomalies for their assigned subjects
    if request.user.role == "faculty":
        from users.models import Faculty

        try:
            faculty = Faculty.objects.get(user=request.user)
            assigned_subject_ids = faculty.subjects.values_list("subject_id", flat=True)
            qs = qs.filter(subject_id__in=assigned_subject_ids)
        except Faculty.DoesNotExist:
            qs = qs.none()

    severity = request.GET.get("severity")
    if severity:
        qs = qs.filter(severity=severity)

    subject_id = request.GET.get("subject_id")
    if subject_id:
        qs = qs.filter(subject__subject_id=subject_id)

    return Response(AttendanceAnomalySerializer(qs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def resolve_anomaly(request, anomaly_id):
    err = _require_role(request, "faculty", "admin")
    if err:
        return err

    try:
        anomaly = AttendanceAnomaly.objects.get(id=anomaly_id)
    except AttendanceAnomaly.DoesNotExist:
        return Response({"error": "Not found."}, status=404)

    anomaly.is_resolved = True
    anomaly.resolved_at = now()
    anomaly.save(update_fields=["is_resolved", "resolved_at"])
    return Response({"success": True})


# ─── Generate PDF Report ──────────────────────────────────────────────────────


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_pdf_report(request):
    err = _require_role(request, "faculty", "admin")
    if err:
        return err

    subject_id = request.data.get("subject_id")
    date_from = request.data.get("date_from")
    date_to = request.data.get("date_to")

    if not all([subject_id, date_from, date_to]):
        return Response(
            {"error": "subject_id, date_from, date_to are required."}, status=400
        )

    # Faculty can only generate reports for their assigned subjects
    if request.user.role == "faculty":
        from users.models import Faculty

        try:
            faculty = Faculty.objects.get(user=request.user)
            assigned_subject_ids = faculty.subjects.values_list("subject_id", flat=True)
            if str(subject_id) not in [str(sid) for sid in assigned_subject_ids]:
                return Response(
                    {"error": "You can only generate reports for assigned subjects."},
                    status=403,
                )
        except Faculty.DoesNotExist:
            return Response({"error": "Faculty profile not found."}, status=404)

    from .tasks import generate_attendance_pdf

    task = generate_attendance_pdf.delay(str(subject_id), date_from, date_to)
    return Response({"task_id": task.id, "message": "PDF report is being generated..."})


# ─── Student Notifications ────────────────────────────────────────────────────


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def notifications_list(request):
    notifs = AttendanceNotification.objects.filter(
        recipient=request.user, is_read=False
    )
    return Response(AttendanceNotificationSerializer(notifs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notif_id):
    try:
        n = AttendanceNotification.objects.get(id=notif_id, recipient=request.user)
        n.is_read = True
        n.save(update_fields=["is_read"])
        return Response({"success": True})
    except AttendanceNotification.DoesNotExist:
        return Response({"error": "Not found."}, status=404)


# ─── Faculty: Active Sessions for today ──────────────────────────────────────


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def faculty_sessions(request):
    err = _require_role(request, "faculty")
    if err:
        return err

    from users.models import Faculty

    try:
        faculty = Faculty.objects.get(user=request.user)
        assigned_subject_ids = faculty.subjects.values_list("subject_id", flat=True)
        sessions = LectureSession.objects.filter(
            faculty=request.user,
            is_active=True,
            date=date.today(),
            subject_id__in=assigned_subject_ids,
        ).select_related("subject")
    except Faculty.DoesNotExist:
        sessions = LectureSession.objects.none()

    return Response(LectureSessionSerializer(sessions, many=True).data)


# ─── Admin: Student Face Registration Status ──────────────────────────────────


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_student_face_status(request):
    err = _require_role(request, "admin")
    if err:
        return err

    from users.models import Student

    # Fetch students with necessary related data
    students = Student.objects.select_related("user", "course").order_by("name")

    # Apply filters
    program_filter = request.GET.get("program")
    semester_filter = request.GET.get("semester")
    status_filter = request.GET.get("status")  # 'registered'|'pending'|'details_missing'

    if program_filter:
        students = students.filter(course__name__icontains=program_filter)
    if semester_filter:
        students = students.filter(current_semester=semester_filter)

    # Use a faster lookup by getting all profiles once
    # Index by user_id which is the UUID value
    profiles = {p.user_id: p for p in StudentProfile.objects.all()}

    result = []
    for stu in students:
        # Check profile using stu.user_id (the UUID stored in Student model)
        profile = profiles.get(stu.user_id)
        
        is_face = profile.is_face_registered if profile else False
        is_details = profile.is_details_filled if profile else False
        face_at = profile.face_registered_at if profile else None
        
        # Build photo URL safely
        photo_url = None
        if profile and profile.registered_face_photo:
            try:
                photo_url = request.build_absolute_uri(profile.registered_face_photo.url)
            except Exception:
                photo_url = None

        # Filter by status in memory (after profile lookup)
        if status_filter == "registered" and not is_face:
            continue
        if status_filter == "pending" and (is_face or not is_details):
            continue
        if status_filter == "details_missing" and is_details:
            continue

        result.append(
            {
                "student_id": str(stu.student_id),
                "user_id": str(stu.user_id),
                "name": stu.name,
                "enrollment_no": stu.enrollment_no,
                "program": stu.course.code if stu.course else "N/A",
                "semester": stu.current_semester,
                "is_details_filled": is_details,
                "is_face_registered": is_face,
                "face_registered_at": face_at,
                "face_photo_url": photo_url,
            }
        )

    # Summary stats
    full_count = Student.objects.count()
    total_reg = StudentProfile.objects.filter(is_face_registered=True).count()
    
    return Response(
        {
            "students": result,
            "stats": {
                "total": full_count,
                "registered": total_reg,
                "pending": full_count - total_reg,
                "registration_pct": round((total_reg / full_count * 100), 1)
                if full_count > 0
                else 0,
            },
        }
    )


# ─── Admin: Send Reminder ─────────────────────────────────────────────────────


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_face_reminder(request, student_id):
    err = _require_role(request, "admin", "faculty")
    if err:
        return err

    from django.contrib.auth import get_user_model

    User = get_user_model()
    try:
        student_user = User.objects.get(user_id=student_id, role="student")
    except User.DoesNotExist:
        return Response({"error": "Student not found."}, status=404)

    AttendanceNotification.objects.create(
        recipient=student_user,
        notification_type="student_alert",
        message=(
            "📸 Reminder: Please complete your AI Attendance Face Registration. "
            "Go to the Attendance Setup page from your sidebar to complete this one-time setup."
        ),
    )
    return Response({"success": True, "message": "Reminder sent."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bulk_remind(request):
    err = _require_role(request, "admin")
    if err:
        return err

    pending = StudentProfile.objects.filter(is_face_registered=False).select_related(
        "user"
    )
    count = 0
    for profile in pending:
        AttendanceNotification.objects.create(
            recipient=profile.user,
            notification_type="student_alert",
            message=(
                "📸 Action Required: Face registration for AI Attendance is pending. "
                "Please complete it from the Attendance Setup page."
            ),
        )
        count += 1
    return Response({"success": True, "reminded": count})


# ─── Admin: Face Management ───────────────────────────────────────────────────


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_student_face(request, student_id):
    """POST /admin/student/<student_id>/delete-face/ — reset face registration."""
    err = _require_role(request, "admin")
    if err:
        return err

    from users.models import Student
    try:
        stu = Student.objects.get(student_id=student_id)
    except Student.DoesNotExist:
        return Response({"error": "Student not found."}, status=404)

    # Delete face encoding file
    try:
        fe = FaceEncoding.objects.get(student=stu.user)
        if fe.encoding_path:
            abs_path = os.path.join(settings.MEDIA_ROOT, fe.encoding_path)
            if os.path.exists(abs_path):
                os.remove(abs_path)
        fe.delete()
    except FaceEncoding.DoesNotExist:
        pass

    # Reset profile flags
    try:
        profile = StudentProfile.objects.get(user=stu.user)
        profile.is_face_registered = False
        profile.face_registered_at = None
        if profile.registered_face_photo:
            profile.registered_face_photo.delete(save=False)
            profile.registered_face_photo = None
        profile.save(update_fields=["is_face_registered", "face_registered_at", "registered_face_photo"])
    except StudentProfile.DoesNotExist:
        pass

    return Response({"success": True, "message": "Face data deleted successfully."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_student_photo(request, student_id):
    """POST /admin/student/<student_id>/upload-photo/ — upload a face photo for a student."""
    err = _require_role(request, "admin")
    if err:
        return err

    from users.models import Student
    try:
        stu = Student.objects.get(student_id=student_id)
    except Student.DoesNotExist:
        return Response({"error": "Student not found."}, status=404)

    photo = request.FILES.get("photo")
    if not photo:
        return Response({"error": "photo file required."}, status=400)

    profile, _ = StudentProfile.objects.get_or_create(user=stu.user)
    profile.registered_face_photo = photo
    profile.save(update_fields=["registered_face_photo"])

    photo_url = None
    try:
        photo_url = request.build_absolute_uri(profile.registered_face_photo.url)
    except Exception:
        pass

    return Response({"success": True, "photo_url": photo_url})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_attendance_stats(request, student_id):
    """GET /admin/student/<student_id>/attendance-stats/ — overall + subject-wise stats."""
    err = _require_role(request, "admin")
    if err:
        return err

    from users.models import Student
    from academics.models import Subject

    try:
        stu = Student.objects.select_related("user", "course").get(student_id=student_id)
    except Student.DoesNotExist:
        return Response({"error": "Student not found."}, status=404)

    # Overall attendance
    all_records = AttendanceRecord.objects.filter(student=stu.user)
    total = all_records.count()
    present = all_records.filter(status__in=["present", "late"]).count()
    overall_pct = round((present / total * 100), 1) if total > 0 else 0

    # Per-subject breakdown
    subjects = Subject.objects.filter(
        id__in=all_records.values_list("session__subject_id", flat=True).distinct()
    )
    subject_breakdown = []
    for sub in subjects:
        sub_records = all_records.filter(session__subject=sub)
        sub_total = sub_records.count()
        sub_present = sub_records.filter(status__in=["present", "late"]).count()
        sub_pct = round((sub_present / sub_total * 100), 1) if sub_total > 0 else 0
        subject_breakdown.append({
            "subject_code": sub.code,
            "subject_name": sub.name,
            "total": sub_total,
            "present": sub_present,
            "percentage": sub_pct,
        })

    return Response({
        "student_id": str(stu.student_id),
        "name": stu.name,
        "enrollment_no": stu.enrollment_no,
        "overall": {
            "total": total,
            "present": present,
            "percentage": overall_pct,
        },
        "subjects": sorted(subject_breakdown, key=lambda x: x["subject_code"]),
    })


# ─── Export: Google Sheets & CSV ─────────────────────────────────────────────


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def export_to_sheets(request):
    """POST /export-to-sheets/ — export a session's attendance to Google Sheets."""
    err = _require_role(request, "faculty", "admin")
    if err:
        return err

    session_id = request.data.get("session_id")
    spreadsheet_id = request.data.get("spreadsheet_id")

    if not session_id:
        return Response({"error": "session_id is required."}, status=400)

    try:
        session = LectureSession.objects.get(id=session_id)
    except LectureSession.DoesNotExist:
        return Response({"error": "Session not found."}, status=404)

    if request.user.role == "faculty" and session.faculty_id != request.user.id:
        return Response({"error": "Access denied."}, status=403)

    from .sheets_export import export_session_to_sheet
    result = export_session_to_sheet(session_id, spreadsheet_id)
    status_code = 200 if result.get("success") else 500
    return Response(result, status=status_code)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def export_cumulative_sheets(request):
    """POST /export-cumulative/ — export cumulative subject attendance."""
    err = _require_role(request, "faculty", "admin")
    if err:
        return err

    subject_id = request.data.get("subject_id")
    date_from = request.data.get("date_from")
    date_to = request.data.get("date_to")

    if not subject_id:
        return Response({"error": "subject_id is required."}, status=400)

    from .sheets_export import export_subject_cumulative
    result = export_subject_cumulative(subject_id, date_from, date_to)
    status_code = 200 if result.get("success") else 500
    return Response(result, status=status_code)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_csv(request, session_id):
    """GET /download-csv/<session_id>/ — download attendance as CSV file."""
    err = _require_role(request, "faculty", "admin")
    if err:
        return err

    try:
        session = LectureSession.objects.get(id=session_id)
    except LectureSession.DoesNotExist:
        return Response({"error": "Session not found."}, status=404)

    if request.user.role == "faculty" and session.faculty_id != request.user.id:
        return Response({"error": "Access denied."}, status=403)

    from .sheets_export import _generate_csv_fallback
    result = _generate_csv_fallback(session)

    if result.get("csv_path"):
        from django.http import FileResponse
        filepath = os.path.join(settings.MEDIA_ROOT, result["csv_path"])
        if os.path.exists(filepath):
            return FileResponse(
                open(filepath, 'rb'),
                content_type='text/csv',
                as_attachment=True,
                filename=os.path.basename(filepath),
            )
    return Response({"error": "CSV generation failed."}, status=500)
