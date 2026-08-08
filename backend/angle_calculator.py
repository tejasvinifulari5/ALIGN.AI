import numpy as np

def calculate_angle(a, b, c, use_3d=False):
    """
    a, b, c = landmarks (hip, knee, ankle)
    returns smoothed angle at point b in degrees
    """

    if a is None or b is None or c is None:
        return 0.0

    # ✅ Optional 3D support
    if use_3d:
        a = np.array([a.x, a.y, a.z])
        b = np.array([b.x, b.y, b.z])
        c = np.array([c.x, c.y, c.z])
    else:
        a = np.array([a.x, a.y])
        b = np.array([b.x, b.y])
        c = np.array([c.x, c.y])

    # ✅ Vector-based calculation (more accurate than arctan2)
    ba = a - b
    bc = c - b

    # Avoid division by zero
    norm = np.linalg.norm(ba) * np.linalg.norm(bc)
    if norm == 0:
        return 0.0

    cosine = np.dot(ba, bc) / norm

    # ✅ Clamp to avoid arccos domain errors (-1 to 1)
    cosine = np.clip(cosine, -1.0, 1.0)

    angle = np.degrees(np.arccos(cosine))

    return round(angle, 2)  # ✅ Round to 2 decimals