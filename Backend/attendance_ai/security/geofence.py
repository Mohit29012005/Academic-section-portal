"""
GPS Geofencing Module — AI Attendance System
============================================
Validates that a student's GPS coordinates fall within
an allowed radius of the classroom anchor point.

Pure Python implementation — no external libraries required.
Haversine formula gives accuracy within ~0.5% for distances < 1 km.
"""

import math
import logging

logger = logging.getLogger(__name__)

EARTH_RADIUS_M = 6_371_000  # metres


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate straight-line distance between two GPS coordinates using
    the Haversine formula. Returns distance in metres.

    Args:
        lat1, lng1: Student location (degrees)
        lat2, lng2: Classroom anchor (degrees)

    Returns:
        Distance in metres (float)
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_M * c


def validate_location(
    student_lat: float,
    student_lng: float,
    classroom_lat: float,
    classroom_lng: float,
    radius_m: int = 50,
) -> dict:
    """
    Check if a student's GPS position is within the allowed geofence
    radius of the classroom.

    Args:
        student_lat, student_lng : Student's GPS coordinates
        classroom_lat, classroom_lng : Faculty-set classroom anchor
        radius_m : Allowed radius in metres (default 50m)

    Returns:
        {
            "valid"          : bool,
            "distance_m"     : float | None,
            "allowed_radius_m": int,
            "message"        : str,
        }
    """
    # Any None coordinate → reject immediately
    if any(v is None for v in (student_lat, student_lng, classroom_lat, classroom_lng)):
        logger.warning("Geofence: missing coordinates — blocking attendance.")
        return {
            "valid": False,
            "distance_m": None,
            "allowed_radius_m": radius_m,
            "message": "GPS coordinates are required for this session.",
        }

    try:
        dist = haversine_distance(
            student_lat, student_lng, classroom_lat, classroom_lng
        )
    except Exception as exc:
        logger.error(f"Geofence calculation error: {exc}")
        return {
            "valid": False,
            "distance_m": None,
            "allowed_radius_m": radius_m,
            "message": "GPS validation failed due to a server error.",
        }

    valid = dist <= radius_m
    if valid:
        message = f"Location verified — {dist:.0f}m from classroom (limit {radius_m}m)."
    else:
        message = (
            f"You are {dist:.0f}m away. Must be within {radius_m}m of the classroom."
        )

    logger.info(
        f"Geofence: dist={dist:.1f}m, limit={radius_m}m → {'PASS' if valid else 'FAIL'}"
    )
    return {
        "valid": valid,
        "distance_m": round(dist, 1),
        "allowed_radius_m": radius_m,
        "message": message,
    }
