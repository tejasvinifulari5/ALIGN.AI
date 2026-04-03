def get_posture_label(angle):
    """
    Returns posture stage label based on knee angle.
    """
    if angle > 160:
        return "Standing"
    elif angle > 120:
        return "Partial Squat"
    elif angle > 90:
        return "Normal Squat"
    elif angle >= 60:
        return "Deep Squat"
    else:
        return "Too Deep"

def get_posture_score(angle):
    """
    Returns posture score 0-100 based on how ideal the angle is.
    ✅ Gradual scoring instead of harsh jumps.
    Ideal squat range: 90°-130°
    """
    if 90 <= angle <= 130:
        return 100                        # ✅ Perfect squat range
    elif 70 <= angle < 90:
        return round(70 + (angle - 70) * 1.5, 1)   # gradual 70→100
    elif 130 < angle <= 160:
        return round(100 - (angle - 130) * 1.0, 1)  # gradual 100→70
    elif angle > 160:
        return 60                         # standing
    elif 50 <= angle < 70:
        return round(40 + (angle - 50) * 1.5, 1)    # gradual 40→70
    else:
        return 20                         # too deep / incorrect

def get_posture_feedback(angle):
    """
    ✅ NEW — Returns actionable feedback string for the user.
    """
    if angle > 160:
        return "Stand straight, begin your squat"
    elif angle > 130:
        return "Go deeper — bend your knees more"
    elif angle > 90:
        return "Good form! Keep going"
    elif angle >= 60:
        return "Deep squat — great depth!"
    else:
        return "Too deep — come up slightly"