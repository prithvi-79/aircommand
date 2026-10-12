from __future__ import annotations
import math

def haversine_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R_nm = 3440.065
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R_nm * c

def route_flight_time_min(dist_nm: float, speed_knots: float = 450.0) -> int:
    return max(15, int((dist_nm / max(speed_knots, 100.0)) * 60.0))
