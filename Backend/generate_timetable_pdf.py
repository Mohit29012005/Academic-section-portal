"""
GANPAT University DCS Timetable PDF Generator
Fixed version - shows breaks and uses proper time slots
"""

import os
import sys
import django
from datetime import datetime
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A3
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ampics.settings")
django.setup()

from academics.models import Course, TimetableSlot


# GANPAT DCS Time Slots - Hardcoded as per frontend
MORNING_SLOTS = [
    {"label": "Slot 1", "start": "08:00", "end": "08:55"},
    {"label": "Slot 2", "start": "08:55", "end": "09:40"},
    {"label": "BREAK", "start": "09:40", "end": "10:00", "is_break": True},
    {"label": "Slot 3", "start": "10:15", "end": "11:10"},
    {"label": "Slot 4", "start": "11:10", "end": "12:00"},
    {"label": "Slot 5", "start": "12:00", "end": "12:55"},
    {"label": "Slot 6", "start": "12:55", "end": "13:00"},
]

NOON_SLOTS = [
    {"label": "Slot 1", "start": "12:00", "end": "12:55"},
    {"label": "Slot 2", "start": "12:55", "end": "13:25"},
    {"label": "Slot 3", "start": "13:25", "end": "14:20"},
    {"label": "LUNCH", "start": "14:20", "end": "15:15", "is_break": True},
    {"label": "Slot 4", "start": "15:15", "end": "16:10"},
    {"label": "TEA", "start": "16:10", "end": "16:30", "is_break": True},
    {"label": "Slot 5", "start": "16:30", "end": "17:20"},
    {"label": "Slot 6", "start": "17:20", "end": "18:10"},
]

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


def time_str(t, use_12h=False):
    """Convert time to string"""
    if hasattr(t, "strftime"):
        if use_12h:
            hour = t.hour
            suffix = "PM" if hour >= 12 else "AM"
            hour12 = hour % 12 or 12
            return f"{hour12}:{t.strftime('%M')} {suffix}"
        return t.strftime("%H:%M")
    return str(t)


def get_time_slots(shift):
    """Get time slots based on shift"""
    return MORNING_SLOTS if shift == "MORNING" else NOON_SLOTS


def generate_timetable_pdf(course_code=None, semester=None):
    """Generate PDF in GANPAT DCS format with breaks"""

    if course_code:
        courses = list(Course.objects.filter(code=course_code, status="Active"))
    else:
        courses = list(Course.objects.filter(status="Active"))
        
    # Custom course ordering as requested
    custom_order = [
        "BCA", "BSCIT", "BSCIT-IMS", "BSCIT-CS", "BTech", "MTech", 
        "MCA", "MSCIT-IMS", "MSCIT-CS", "MSCIT-AIML", "MSCIT"
    ]
    
    def get_order_index(c):
        try:
            # Case insensitive match for safety
            return [x.upper() for x in custom_order].index(c.code.upper())
        except ValueError:
            return 99 # Push any unknown courses to the end
            
    courses.sort(key=get_order_index)

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A3),
        rightMargin=0.3 * inch,
        leftMargin=0.3 * inch,
        topMargin=0.4 * inch,
        bottomMargin=0.3 * inch,
    )

    elements = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "Title",
        fontSize=18,
        alignment=TA_CENTER,
        spaceAfter=4,
        textColor=colors.HexColor("#1a237e"),
        fontName="Helvetica-Bold",
    )

    subtitle_style = ParagraphStyle(
        "Subtitle",
        fontSize=11,
        alignment=TA_CENTER,
        spaceAfter=6,
        textColor=colors.HexColor("#424242"),
    )

    def make_cell(subject_name, faculty_code, is_break=False):
        """Create formatted cell content"""
        if is_break:
            return Paragraph(
                f"<b>{subject_name}</b>",
                ParagraphStyle(
                    "BreakCell",
                    fontSize=7,
                    alignment=TA_CENTER,
                    leading=9,
                    textColor=colors.HexColor("#9e9e9e"),
                ),
            )
        return Paragraph(
            f"<b>{subject_name}</b><br/><font size='7' color='#1565c0'>{faculty_code}</font>",
            ParagraphStyle(
                "Cell",
                fontSize=8,
                alignment=TA_CENTER,
                leading=10,
            ),
        )

    def get_faculty_short_code(faculty):
        """Get short code for faculty"""
        if not faculty:
            return "-"
        name_parts = faculty.name.split()
        if len(name_parts) >= 2:
            return f"{name_parts[0][0]}{name_parts[-1][0]}".upper()
        return faculty.name[:3].upper()

    for course in courses:
        if semester:
            sem_range = [semester]
        else:
            sem_range = range(1, course.total_semesters + 1)

        for sem in sem_range:
            timetable_data = TimetableSlot.objects.filter(
                course=course, semester=sem
            ).select_related("subject", "faculty", "room")

            if not timetable_data.exists():
                continue

            time_slots = get_time_slots(course.shift)

            title_p = Paragraph("GANPAT UNIVERSITY", title_style)
            sub_p = Paragraph("Department of Computer Science", subtitle_style)
            
            elements.append(title_p)
            elements.append(sub_p)
            elements.append(
                Paragraph(
                    "<b>CLASS TIMETABLE</b>",
                    ParagraphStyle(
                        "Big", fontSize=14, alignment=TA_CENTER, spaceAfter=2
                    ),
                )
            )
            classroom_name = ""
            first_slot = timetable_data.exclude(room__isnull=True).first()
            if first_slot and first_slot.room:
                classroom_name = f" | Classroom: {first_slot.room.room_number}"

            elements.append(
                Paragraph(
                    f"{course.name} ({course.code}) - Semester {sem}{classroom_name}",
                    ParagraphStyle(
                        "Course", fontSize=12, alignment=TA_CENTER, spaceAfter=2
                    ),
                )
            )

            shift_label = (
                "MORNING SHIFT (08:00 AM - 01:00 PM)"
                if course.shift == "MORNING"
                else "NOON SHIFT (12:00 PM - 06:10 PM)"
            )
            elements.append(
                Paragraph(
                    f"<b>{shift_label}</b>",
                    ParagraphStyle(
                        "Shift", fontSize=10, alignment=TA_CENTER, spaceAfter=8
                    ),
                )
            )

            # Build slot map
            slot_map = {}
            for ts in timetable_data:
                key = (ts.day_of_week, str(ts.start_time)[:5])
                subj_name = ts.subject.name
                fac_code = get_faculty_short_code(ts.faculty)
                slot_map[key] = (subj_name, fac_code)

            # Header row
            header_row = ["Time / Day"]
            for slot in time_slots:
                start = time_str(
                    datetime.strptime(slot["start"], "%H:%M").time(), use_12h=True
                )
                end = time_str(
                    datetime.strptime(slot["end"], "%H:%M").time(), use_12h=True
                )
                header_row.append(f"{start}\n-\n{end}")

            # Build table data
            table_data = [header_row]

            for day in DAYS:
                row = [day]
                for slot in time_slots:
                    key = (day, slot["start"])

                    if key in slot_map:
                        subj, fac = slot_map[key]
                        is_break = slot.get("is_break", False)
                        row.append(make_cell(subj, fac, is_break))
                    elif slot.get("is_break"):
                        break_name = slot["label"]
                        row.append(make_cell(break_name, "", True))
                    else:
                        row.append("")
                table_data.append(row)

            # Create table
            time_col_width = 0.9 * inch
            slot_col_width = 1.4 * inch
            col_widths = [time_col_width] + [slot_col_width] * len(time_slots)
            table = Table(table_data, colWidths=col_widths, repeatRows=1)

            # Table styling
            table_style = TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a237e")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
                    ("TOPPADDING", (0, 0), (-1, 0), 6),
                    ("BACKGROUND", (0, 1), (0, -1), colors.HexColor("#e8eaf6")),
                    ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 1), (0, -1), 9),
                    ("ALIGN", (0, 1), (0, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#9fa8da")),
                    ("ALIGN", (1, 1), (-1, -1), "CENTER"),
                    ("VALIGN", (1, 1), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (1, 1), (-1, -1), 4),
                    ("BOTTOMPADDING", (1, 1), (-1, -1), 4),
                    (
                        "ROWBACKGROUNDS",
                        (1, 1),
                        (-1, -1),
                        [colors.white, colors.HexColor("#f5f5f5")],
                    ),
                ]
            )

            # Highlight break columns
            for col_idx, slot in enumerate(time_slots):
                if slot.get("is_break"):
                    col_num = col_idx + 1
                    table_style.add(
                        "BACKGROUND",
                        (col_num, 1),
                        (col_num, -1),
                        colors.HexColor("#fafafa"),
                    )

            # Saturday highlight
            sat_idx = len(DAYS)
            table_style.add(
                "BACKGROUND", (0, sat_idx), (-1, sat_idx), colors.HexColor("#fff3e0")
            )

            table.setStyle(table_style)
            elements.append(table)

            # Subject Legend
            subject_ref = {}
            for ts in timetable_data:
                code = ts.subject.code
                if code not in subject_ref:
                    subject_ref[code] = ts.subject.name

            if subject_ref:
                elements.append(Spacer(1, 15))
                elements.append(
                    Paragraph(
                        "<b>Subject Reference Guide:</b>",
                        ParagraphStyle(
                            "LegendTitle",
                            fontSize=10,
                            alignment=TA_LEFT,
                            spaceAfter=4,
                            textColor=colors.HexColor("#1a237e"),
                        ),
                    )
                )
                ref_items = list(subject_ref.items())
                for i in range(0, len(ref_items), 3):
                    row_items = ref_items[i : i + 3]
                    legend_text = " | ".join(
                        [f"<b>{code}</b>: {name}" for code, name in row_items]
                    )
                    elements.append(
                        Paragraph(legend_text, ParagraphStyle("Legend", fontSize=9))
                    )

            # Faculty Legend
            faculty_ref = {}
            for ts in timetable_data:
                if ts.faculty:
                    short_code = get_faculty_short_code(ts.faculty)
                    if short_code not in faculty_ref and short_code != "-":
                        faculty_ref[short_code] = ts.faculty.name

            if faculty_ref:
                elements.append(Spacer(1, 10))
                elements.append(
                    Paragraph(
                        "<b>Faculty Reference Guide:</b>",
                        ParagraphStyle(
                            "LegendTitle",
                            fontSize=10,
                            alignment=TA_LEFT,
                            spaceAfter=4,
                            textColor=colors.HexColor("#1a237e"),
                        ),
                    )
                )
                fac_items = list(faculty_ref.items())
                for i in range(0, len(fac_items), 4):
                    row_items = fac_items[i : i + 4]
                    legend_text = " | ".join(
                        [f"<b>{code}</b>: {name}" for code, name in row_items]
                    )
                    elements.append(
                        Paragraph(legend_text, ParagraphStyle("Legend", fontSize=9))
                    )

            elements.append(Spacer(1, 20))

    if not elements:
        return BytesIO(b"%PDF-1.4 empty")

    doc.build(elements)
    buffer.seek(0)
    return buffer


def generate_all_courses_pdf():
    """Generate combined PDF for all courses"""
    return generate_timetable_pdf()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--course", type=str)
    parser.add_argument("--semester", type=int)
    parser.add_argument("--output", type=str)
    args = parser.parse_args()

    if args.course:
        pdf = generate_timetable_pdf(args.course, args.semester)
        output = args.output or f"{args.course}_S{args.semester}.pdf"
    else:
        pdf = generate_all_courses_pdf()
        output = args.output or "All_Timetables.pdf"

    with open(output, "wb") as f:
        f.write(pdf.read())
    print(f"Saved to: {output}")
