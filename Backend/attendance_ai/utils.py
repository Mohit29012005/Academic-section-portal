"""
QR Code generation utility for AI Attendance System.
"""
import os
from django.conf import settings


def generate_qr_code(session_id: int, qr_token: str, domain: str = None):
    """
    Generate a QR code PNG for the student attendance link.

    Args:
        session_id: LectureSession pk
        qr_token:   UUID string
        domain:     Domain for the URL (default: SITE_DOMAIN from settings)

    Returns:
        (relative_media_path, attendance_url)
        e.g. ("qrcodes/42.png", "http://localhost:5173/student/mark-attendance/abc.../")
    """
    try:
        import qrcode
    except ImportError:
        raise RuntimeError("qrcode library not installed. Run: pip install qrcode[pil]")

    if domain is None:
        domain = getattr(settings, 'SITE_DOMAIN', 'localhost:5173')

    attendance_url = f"http://{domain}/student/mark-attendance/{qr_token}/"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(attendance_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#7B0D0D", back_color="white")

    qr_dir = os.path.join(settings.MEDIA_ROOT, 'qrcodes')
    os.makedirs(qr_dir, exist_ok=True)

    filename = f"{session_id}.png"
    abs_path = os.path.join(qr_dir, filename)
    img.save(abs_path)

    return f"qrcodes/{filename}", attendance_url
