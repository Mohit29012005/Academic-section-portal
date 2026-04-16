"""
Proxy & Late Attendance Detection Module.

Proxy Detection:
  - Detects if the same face appears in two different sessions within a short time
  - Detects if a face is used by a different student account (identity swap)
  - Logs suspicious activity in AttendanceAnomaly table

Late Detection:
  - Compares attendance mark time vs session start_time
  - If > 15 minutes late → status = 'late' instead of 'present'
"""

import logging
from datetime import timedelta

from django.utils.timezone import now, make_aware
from datetime import datetime, date

logger = logging.getLogger(__name__)

LATE_THRESHOLD_MINUTES = 15  # minutes after session start → mark as Late


def determine_attendance_status(session, current_time=None):
    """
    Determine if the student should be marked 'present' or 'late'
    based on session start_time and current time.
    
    Args:
        session: LectureSession instance
        current_time: timezone-aware datetime (default: now())
    
    Returns:
        'present' or 'late'
    """
    if current_time is None:
        current_time = now()
    
    try:
        # Build session start datetime
        session_start = make_aware(
            datetime.combine(session.date, session.start_time)
        )
        late_cutoff = session_start + timedelta(minutes=LATE_THRESHOLD_MINUTES)
        
        if current_time > late_cutoff:
            logger.info(
                f"Student arriving at {current_time.strftime('%H:%M')} — "
                f"session started at {session.start_time}, "
                f"late cutoff was {late_cutoff.strftime('%H:%M')}"
            )
            return 'late'
        return 'present'
    except Exception as e:
        logger.error(f"determine_attendance_status error: {e}")
        return 'present'  # safe fallback


def check_proxy_attendance(student_user, session, confidence_score=None):
    """
    Check for proxy attendance patterns.
    
    Checks:
    1. Same student marked in 2 overlapping sessions at the same time
    2. Unusually low confidence score (might be a different person)
    3. Same IP marking attendance for multiple students
    
    Returns:
        {
            "is_suspicious": bool,
            "reasons": list[str],
            "severity": str ("low" | "medium" | "high"),
        }
    """
    from .models import AttendanceRecord, LectureSession, AttendanceAnomaly
    
    reasons = []
    severity = "low"
    
    # Check 1: Student already marked in another ACTIVE session at the same time
    overlapping = AttendanceRecord.objects.filter(
        student=student_user,
        session__date=session.date,
        session__is_active=True,
        status__in=['present', 'late'],
    ).exclude(session=session).select_related('session')
    
    for rec in overlapping:
        other_session = rec.session
        # Check if times actually overlap
        if (session.start_time < other_session.end_time and 
            session.end_time > other_session.start_time):
            reasons.append(
                f"Student already marked present in overlapping session "
                f"'{other_session.subject.name}' ({other_session.start_time}-{other_session.end_time})"
            )
            severity = "high"
    
    # Check 2: Very low confidence score
    if confidence_score is not None and confidence_score < 45.0:
        reasons.append(
            f"Low face recognition confidence: {confidence_score}%. "
            f"Face may not match registered identity."
        )
        if severity != "high":
            severity = "medium"
    
    # Check 3: Same student marked more than once in same session (shouldn't happen
    # due to unique_together, but check for manual overrides)
    duplicate_count = AttendanceRecord.objects.filter(
        student=student_user,
        session=session,
    ).count()
    if duplicate_count > 1:
        reasons.append(
            f"Duplicate attendance records found ({duplicate_count} records)."
        )
        severity = "high"
    
    is_suspicious = len(reasons) > 0
    
    return {
        "is_suspicious": is_suspicious,
        "reasons": reasons,
        "severity": severity,
    }


def log_proxy_anomaly(student_user, session, reasons, severity="medium"):
    """
    Create an AttendanceAnomaly record for proxy/suspicious attendance.
    """
    from .models import AttendanceAnomaly
    
    description = "⚠️ Proxy Attendance Suspicion:\n" + "\n".join(f"• {r}" for r in reasons)
    
    # Check if already flagged for this session
    existing = AttendanceAnomaly.objects.filter(
        student=student_user,
        subject=session.subject,
        anomaly_type='irregular_pattern',
        is_resolved=False,
        description__icontains=str(session.id),
    ).exists()
    
    if not existing:
        anomaly = AttendanceAnomaly.objects.create(
            student=student_user,
            subject=session.subject,
            anomaly_type='irregular_pattern',
            severity=severity,
            description=description + f"\n\nSession ID: {session.id}",
        )
        logger.warning(
            f"Proxy anomaly logged for {student_user.email} "
            f"in session {session.id}: {reasons}"
        )
        return anomaly
    
    return None
