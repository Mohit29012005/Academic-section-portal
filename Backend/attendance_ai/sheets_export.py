"""
Google Sheets Export Module for AI Attendance System.

Exports attendance session data to Google Sheets for administrative reporting.

Two modes:
  1. Service Account mode — uses a service account JSON key file (recommended for automation)
  2. OAuth mode — uses the existing Google OAuth credentials (for on-demand export)

Flow:
  Faculty clicks "Export to Google Sheet" after ending a session →
  Backend creates/updates a sheet with:
    - Page 1: Session summary (subject, date, faculty, totals)
    - Page 2: Student-wise attendance (name, roll, status, time, confidence)
    - Page 3: Cumulative attendance percentages
"""

import os
import logging
from datetime import date, datetime

from django.conf import settings

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────
SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']


def _get_gspread_client():
    """
    Get authenticated gspread client.
    Tries service account first, then falls back to OAuth credentials.
    """
    try:
        import gspread
    except ImportError:
        logger.error("gspread not installed. Run: pip install gspread")
        return None

    # Method 1: Service Account (recommended)
    sa_key_path = os.path.join(settings.BASE_DIR, 'google_service_account.json')
    if os.path.exists(sa_key_path):
        try:
            client = gspread.service_account(filename=sa_key_path)
            logger.info("Google Sheets: Authenticated via service account")
            return client
        except Exception as e:
            logger.error(f"Service account auth failed: {e}")

    # Method 2: OAuth credentials from environment
    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request

        creds_path = os.path.join(settings.BASE_DIR, 'google_oauth_token.json')
        if os.path.exists(creds_path):
            import json
            with open(creds_path, 'r') as f:
                token_data = json.load(f)
            creds = Credentials.from_authorized_user_info(token_data, SCOPES)
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
            client = gspread.authorize(creds)
            logger.info("Google Sheets: Authenticated via OAuth token")
            return client
    except Exception as e:
        logger.error(f"OAuth auth failed: {e}")

    logger.error("Google Sheets: No valid authentication method found")
    return None


def export_session_to_sheet(session_id, spreadsheet_id=None):
    """
    Export a single lecture session's attendance to Google Sheets.
    
    Args:
        session_id: LectureSession primary key
        spreadsheet_id: Existing spreadsheet ID to update (creates new if None)
    
    Returns:
        {
            "success": bool,
            "spreadsheet_id": str,
            "spreadsheet_url": str,
            "message": str,
        }
    """
    from attendance_ai.models import LectureSession, AttendanceRecord
    from users.models import Student

    try:
        session = LectureSession.objects.select_related('subject', 'faculty').get(id=session_id)
    except LectureSession.DoesNotExist:
        return {"success": False, "message": "Session not found."}

    client = _get_gspread_client()
    if client is None:
        # Fallback: Generate CSV data that can be manually uploaded
        return _generate_csv_fallback(session)

    try:
        subject = session.subject
        faculty_name = "Unknown"
        try:
            faculty_name = session.faculty.faculty_profile.name
        except Exception:
            faculty_name = session.faculty.email

        title = f"Attendance - {subject.code} - {session.date}"

        # Create or open spreadsheet
        if spreadsheet_id:
            try:
                spreadsheet = client.open_by_key(spreadsheet_id)
            except Exception:
                spreadsheet = client.create(title)
        else:
            spreadsheet = client.create(title)

        # Make it accessible
        try:
            spreadsheet.share(None, perm_type='anyone', role='reader')
        except Exception:
            pass

        # ── Sheet 1: Session Summary ──
        try:
            ws_summary = spreadsheet.worksheet("Session Summary")
            ws_summary.clear()
        except Exception:
            ws_summary = spreadsheet.add_worksheet(title="Session Summary", rows=20, cols=6)

        summary_data = [
            ["GUNI AMPICS - AI Attendance Report"],
            [""],
            ["Field", "Value"],
            ["Subject", f"{subject.code} - {subject.name}"],
            ["Course", subject.course.name if subject.course else "N/A"],
            ["Semester", str(subject.semester)],
            ["Faculty", faculty_name],
            ["Date", str(session.date)],
            ["Time", f"{session.start_time} - {session.end_time}"],
            ["Session Type", session.session_type.title()],
            ["Total Students", str(session.total_students)],
            [""],
            ["Generated", datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
        ]

        records = AttendanceRecord.objects.filter(session=session).select_related('student')
        present_count = records.filter(status__in=['present', 'late']).count()
        late_count = records.filter(status='late').count()
        absent_count = records.filter(status='absent').count()

        summary_data.append(["Present", str(present_count)])
        summary_data.append(["Late", str(late_count)])
        summary_data.append(["Absent", str(absent_count)])
        pct = round((present_count / session.total_students * 100), 1) if session.total_students > 0 else 0
        summary_data.append(["Attendance %", f"{pct}%"])

        ws_summary.update(range_name='A1', values=summary_data)

        # Format header
        ws_summary.format('A1', {'textFormat': {'bold': True, 'fontSize': 14}})
        ws_summary.format('A3:B3', {'textFormat': {'bold': True}, 'backgroundColor': {'red': 0.48, 'green': 0.05, 'blue': 0.05}, 'textFormat': {'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}, 'bold': True}})

        # ── Sheet 2: Student-wise Attendance ──
        try:
            ws_students = spreadsheet.worksheet("Student Attendance")
            ws_students.clear()
        except Exception:
            ws_students = spreadsheet.add_worksheet(title="Student Attendance", rows=200, cols=10)

        student_header = ["#", "Name", "Enrollment No", "Status", "Marked Via", "Marked At", "Confidence %", "Snapshot"]
        student_rows = [student_header]

        for idx, rec in enumerate(records.order_by('student__student_profile__name'), 1):
            try:
                sp = rec.student.student_profile
                name = sp.name
                roll = sp.enrollment_no
            except Exception:
                name = rec.student.email
                roll = "N/A"

            marked_via_display = {
                'face_recognition': '🤖 AI Face',
                'qr_link': '📱 QR Code',
                'manual': '✏️ Manual',
            }.get(rec.marked_via, rec.marked_via)

            student_rows.append([
                str(idx),
                name,
                roll,
                rec.status.upper(),
                marked_via_display,
                rec.marked_at.strftime("%I:%M %p") if rec.marked_at else "—",
                f"{rec.confidence_score}%" if rec.confidence_score else "—",
                rec.snapshot_path or "—",
            ])

        ws_students.update(range_name='A1', values=student_rows)

        # Format header row
        ws_students.format('A1:H1', {
            'textFormat': {'bold': True, 'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}},
            'backgroundColor': {'red': 0.48, 'green': 0.05, 'blue': 0.05},
        })

        # Color-code status cells
        for i, row in enumerate(student_rows[1:], 2):
            status = row[3]
            if status == 'PRESENT':
                ws_students.format(f'D{i}', {'backgroundColor': {'red': 0.85, 'green': 0.95, 'blue': 0.85}})
            elif status == 'LATE':
                ws_students.format(f'D{i}', {'backgroundColor': {'red': 1, 'green': 0.95, 'blue': 0.8}})
            elif status == 'ABSENT':
                ws_students.format(f'D{i}', {'backgroundColor': {'red': 1, 'green': 0.85, 'blue': 0.85}})

        # ── Sheet 3: Cumulative Report ──
        try:
            ws_cumulative = spreadsheet.worksheet("Cumulative Report")
            ws_cumulative.clear()
        except Exception:
            ws_cumulative = spreadsheet.add_worksheet(title="Cumulative Report", rows=200, cols=8)

        # Get all sessions for this subject
        all_sessions = LectureSession.objects.filter(
            subject=subject, is_active=False
        ).order_by('date')

        enrolled_students = Student.objects.filter(
            course=subject.course
        ).select_related('user').order_by('name')

        cum_header = ["#", "Name", "Enrollment No", "Total Classes", "Present", "Absent", "Late", "Attendance %"]
        cum_rows = [cum_header]

        for idx, stu in enumerate(enrolled_students, 1):
            all_records = AttendanceRecord.objects.filter(
                session__subject=subject,
                student=stu.user,
            )
            total = all_records.count()
            present = all_records.filter(status__in=['present', 'late']).count()
            absent = all_records.filter(status='absent').count()
            late = all_records.filter(status='late').count()
            pct = round((present / total * 100), 1) if total > 0 else 0

            cum_rows.append([
                str(idx),
                stu.name,
                stu.enrollment_no,
                str(total),
                str(present),
                str(absent),
                str(late),
                f"{pct}%",
            ])

        ws_cumulative.update(range_name='A1', values=cum_rows)

        ws_cumulative.format('A1:H1', {
            'textFormat': {'bold': True, 'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}},
            'backgroundColor': {'red': 0.48, 'green': 0.05, 'blue': 0.05},
        })

        # Highlight students below 75%
        for i, row in enumerate(cum_rows[1:], 2):
            pct_val = float(row[7].replace('%', ''))
            if pct_val < 75:
                ws_cumulative.format(f'A{i}:H{i}', {'backgroundColor': {'red': 1, 'green': 0.9, 'blue': 0.9}})

        # Remove default Sheet1 if it exists
        try:
            default_sheet = spreadsheet.worksheet("Sheet1")
            spreadsheet.del_worksheet(default_sheet)
        except Exception:
            pass

        return {
            "success": True,
            "spreadsheet_id": spreadsheet.id,
            "spreadsheet_url": spreadsheet.url,
            "title": title,
            "message": f"Attendance exported to Google Sheet: {title}",
        }

    except Exception as e:
        logger.error(f"Google Sheets export failed: {e}")
        import traceback
        traceback.print_exc()
        return _generate_csv_fallback(session)


def export_subject_cumulative(subject_id, date_from=None, date_to=None, spreadsheet_id=None):
    """
    Export cumulative attendance for a subject across multiple sessions.
    """
    from attendance_ai.models import LectureSession, AttendanceRecord
    from academics.models import Subject
    from users.models import Student

    try:
        subject = Subject.objects.get(subject_id=subject_id)
    except Subject.DoesNotExist:
        return {"success": False, "message": "Subject not found."}

    sessions = LectureSession.objects.filter(subject=subject, is_active=False)
    if date_from:
        sessions = sessions.filter(date__gte=date_from)
    if date_to:
        sessions = sessions.filter(date__lte=date_to)
    sessions = sessions.order_by('date')

    client = _get_gspread_client()
    if client is None:
        return {"success": False, "message": "Google Sheets authentication not configured. Please set up a service account."}

    try:
        title = f"Cumulative Attendance - {subject.code} - {date.today()}"
        spreadsheet = client.create(title) if not spreadsheet_id else client.open_by_key(spreadsheet_id)

        try:
            spreadsheet.share(None, perm_type='anyone', role='reader')
        except Exception:
            pass

        enrolled = Student.objects.filter(course=subject.course).select_related('user').order_by('name')

        # Build date-wise attendance grid
        header = ["#", "Name", "Enrollment No"]
        for sess in sessions:
            header.append(f"{sess.date.strftime('%d/%m')}")
        header.extend(["Total", "Present", "Absent", "%"])

        rows = [header]
        for idx, stu in enumerate(enrolled, 1):
            row = [str(idx), stu.name, stu.enrollment_no]
            total_p = 0
            for sess in sessions:
                try:
                    rec = AttendanceRecord.objects.get(session=sess, student=stu.user)
                    mark = "P" if rec.status in ['present', 'late'] else "A"
                    if rec.status == 'late':
                        mark = "L"
                    row.append(mark)
                    if mark in ('P', 'L'):
                        total_p += 1
                except AttendanceRecord.DoesNotExist:
                    row.append("-")

            total = sessions.count()
            absent = total - total_p
            pct = round((total_p / total * 100), 1) if total > 0 else 0
            row.extend([str(total), str(total_p), str(absent), f"{pct}%"])
            rows.append(row)

        try:
            ws = spreadsheet.worksheet("Attendance Grid")
            ws.clear()
        except Exception:
            ws = spreadsheet.add_worksheet(title="Attendance Grid", rows=len(rows) + 5, cols=len(header) + 2)

        ws.update(range_name='A1', values=rows)

        # Format
        header_range = f'A1:{chr(64 + len(header))}1'
        ws.format(header_range, {
            'textFormat': {'bold': True, 'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}},
            'backgroundColor': {'red': 0.48, 'green': 0.05, 'blue': 0.05},
        })

        try:
            default_sheet = spreadsheet.worksheet("Sheet1")
            spreadsheet.del_worksheet(default_sheet)
        except Exception:
            pass

        return {
            "success": True,
            "spreadsheet_id": spreadsheet.id,
            "spreadsheet_url": spreadsheet.url,
            "title": title,
            "sessions_count": sessions.count(),
            "students_count": enrolled.count(),
            "message": f"Cumulative report exported with {sessions.count()} sessions.",
        }

    except Exception as e:
        logger.error(f"Cumulative export failed: {e}")
        return {"success": False, "message": f"Export failed: {str(e)}"}


def _generate_csv_fallback(session):
    """
    Generate CSV file as fallback when Google Sheets API is not available.
    Saves to MEDIA_ROOT/exports/ and returns download path.
    """
    import csv
    from attendance_ai.models import AttendanceRecord

    exports_dir = os.path.join(settings.MEDIA_ROOT, 'exports')
    os.makedirs(exports_dir, exist_ok=True)

    filename = f"attendance_{session.subject.code}_{session.date}_{session.id}.csv"
    filepath = os.path.join(exports_dir, filename)

    records = AttendanceRecord.objects.filter(session=session).select_related('student').order_by('marked_at')

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)

        # Header info
        writer.writerow([f"Attendance Report - {session.subject.name}"])
        writer.writerow([f"Date: {session.date}", f"Time: {session.start_time}-{session.end_time}"])
        writer.writerow([])

        # Data header
        writer.writerow(["#", "Name", "Enrollment No", "Status", "Marked Via", "Marked At", "Confidence"])

        for idx, rec in enumerate(records, 1):
            try:
                name = rec.student.student_profile.name
                roll = rec.student.student_profile.enrollment_no
            except Exception:
                name = rec.student.email
                roll = "N/A"

            writer.writerow([
                idx, name, roll, rec.status.upper(),
                rec.marked_via, rec.marked_at.strftime("%I:%M %p") if rec.marked_at else "",
                f"{rec.confidence_score}%" if rec.confidence_score else "",
            ])

        # Summary
        present = records.filter(status__in=['present', 'late']).count()
        writer.writerow([])
        writer.writerow(["Summary"])
        writer.writerow(["Total", records.count()])
        writer.writerow(["Present", present])
        writer.writerow(["Absent", records.filter(status='absent').count()])

    relative_path = f"exports/{filename}"
    return {
        "success": True,
        "spreadsheet_id": None,
        "spreadsheet_url": None,
        "csv_path": relative_path,
        "message": f"Google Sheets API not configured. CSV exported to: {relative_path}",
        "fallback": True,
    }
