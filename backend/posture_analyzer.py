def get_posture_label(angle, exercise):

    if exercise == "squat":
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


    elif exercise == "bicep":
        if angle > 150:
            return "Start Position"   # 🔥 improved
        elif angle > 90:
            return "Curling"
        else:
            return "Fully Contracted"


    elif exercise == "pushup":
        if angle > 150:
            return "Up Position"
        elif angle > 90:
            return "Mid Push"
        else:
            return "Down Position"


# 🔥 IMPROVED SCORING (REALISTIC)
def get_posture_score(angle, exercise):

    if exercise == "squat":
        if 90 <= angle <= 130:
            return 100
        elif 70 <= angle < 90:
            return round(80 + (angle - 70) * 1.0, 1)
        elif 130 < angle <= 160:
            return round(100 - (angle - 130) * 1.2, 1)
        elif angle > 160:
            return 75
        elif 50 <= angle < 70:
            return round(50 + (angle - 50) * 1.5, 1)
        else:
            return 30


    elif exercise == "bicep":
        if 30 <= angle <= 90:
            return 100                      # perfect curl
        elif 90 < angle <= 140:
            return round(100 - (angle - 90) * 0.6, 1)
        elif angle > 140:
            return 80                       # 🔥 improved
        elif 20 <= angle < 30:
            return 70
        else:
            return 40


    elif exercise == "pushup":
        if 70 <= angle <= 110:
            return 100
        elif 110 < angle <= 150:
            return round(100 - (angle - 110) * 1.2, 1)
        elif angle > 150:
            return 75
        elif 50 <= angle < 70:
            return 70
        else:
            return 40


# 🔥 IMPROVED FEEDBACK (NATURAL + HUMAN)
def get_posture_feedback(angle, exercise):

    if exercise == "squat":
        if angle > 160:
            return "Stand straight and start squatting"
        elif angle > 130:
            return "Go deeper — bend your knees more"
        elif angle > 90:
            return "Good squat — keep going!"
        elif angle >= 60:
            return "Excellent depth — well done!"
        else:
            return "Too deep — come up slightly"


    elif exercise == "bicep":
        if angle > 150:
            return "Start curling your arm"
        elif angle > 100:
            return "Good movement — keep curling"
        elif angle > 60:
            return "Nice curl — great form!"
        else:
            return "Strong contraction — perfect!"


    elif exercise == "pushup":
        if angle > 150:
            return "Go down — bend your elbows"
        elif angle > 100:
            return "Good push — keep going"
        elif angle > 70:
            return "Nice depth — maintain form"
        else:
            return "Perfect pushup depth!"