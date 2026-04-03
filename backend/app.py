from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import cv2
import numpy as np
import base64
import time

from pose_detector import get_landmarks
from angle_calculator import calculate_angle
from posture_analyzer import get_posture_label, get_posture_score, get_posture_feedback
from stability_score import get_stability_score, final_score, get_rating
from rep_counter import RepCounter

app = Flask(__name__)
CORS(app)

# Session state
live_stats = {
    "angle": 0, "posture_label": "—", "posture_score": 0,
    "stability": 0, "reps": 0, "stage": "Ready", "feedback": "Get ready!"
}
session_result  = {}
session_active  = False
prev_angle      = None
posture_scores  = []
stability_scores = []
rep_counter     = RepCounter()

EXERCISE_LANDMARKS = {
    "squats":      {"a": 23, "b": 25, "c": 27},
    "bicep_curls": {"a": 11, "b": 13, "c": 15},
    "pushups":     {"a": 11, "b": 13, "c": 15},
}

EXERCISE_THRESHOLDS = {
    "squats":      {"down_angle": 100, "up_angle": 160},
    "bicep_curls": {"down_angle": 50,  "up_angle": 150},
    "pushups":     {"down_angle": 90,  "up_angle": 160},
}

current_exercise = "squats"
IDX_A, IDX_B, IDX_C = 23, 25, 27

@app.route("/")
def index():
    return send_from_directory("../frontend", "login.html")

@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory("../frontend", filename)

@app.route("/stats")
def stats():
    return jsonify(live_stats)

# ✅ Start session — just resets state, no camera needed
@app.route("/start")
def start():
    global prev_angle, posture_scores, stability_scores, rep_counter
    global live_stats, session_result, session_active, current_exercise
    global IDX_A, IDX_B, IDX_C

    exercise = request.args.get("exercise", "squats")
    current_exercise = exercise

    posture_scores   = []
    stability_scores = []
    prev_angle       = None
    session_result   = {}
    session_active   = True

    live_stats = {
        "angle": 0, "posture_label": "—", "posture_score": 0,
        "stability": 0, "reps": 0, "stage": "Ready", "feedback": "Get ready!"
    }

    thresholds = EXERCISE_THRESHOLDS.get(exercise, EXERCISE_THRESHOLDS["squats"])
    rep_counter = RepCounter(
        down_angle=thresholds["down_angle"],
        up_angle=thresholds["up_angle"]
    )

    lm_idx = EXERCISE_LANDMARKS.get(exercise, EXERCISE_LANDMARKS["squats"])
    IDX_A  = lm_idx["a"]
    IDX_B  = lm_idx["b"]
    IDX_C  = lm_idx["c"]

    return jsonify({"status": "started"})

# ✅ Analyze frame sent from browser
@app.route("/analyze", methods=["POST"])
def analyze():
    global prev_angle, posture_scores, stability_scores
    global live_stats, IDX_A, IDX_B, IDX_C

    if not session_active:
        return jsonify(live_stats)

    try:
        data = request.get_json()
        img_data = data["frame"].split(",")[1]  # remove data:image/jpeg;base64,
        img_bytes = base64.b64decode(img_data)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify(live_stats)

        landmarks = get_landmarks(frame)

        if landmarks:
            a = landmarks[IDX_A]
            b = landmarks[IDX_B]
            c = landmarks[IDX_C]

            angle              = calculate_angle(a, b, c)
            posture_label      = get_posture_label(angle)
            posture_score      = get_posture_score(angle)
            feedback           = get_posture_feedback(angle)
            stability          = get_stability_score(angle, prev_angle)
            reps, rep_feedback = rep_counter.update(angle)

            posture_scores.append(posture_score)
            stability_scores.append(stability)
            prev_angle = angle

            live_stats.update({
                "angle":         round(angle, 1),
                "posture_label": posture_label,
                "posture_score": round(posture_score, 1),
                "stability":     round(stability, 1),
                "reps":          reps,
                "stage":         rep_counter.stage,
                "feedback":      rep_feedback or feedback,
            })

    except Exception as e:
        print(f"Analyze error: {e}")

    return jsonify(live_stats)

# ✅ Stop session
@app.route("/stop")
def stop():
    global session_active, session_result

    session_active = False

    summary = rep_counter.get_summary()
    final   = final_score(posture_scores, stability_scores)
    rating  = get_rating(final)

    session_result = {
        "reps":         summary["total_reps"],
        "score":        final,
        "rating":       rating,
        "avg_rep_time": summary["avg_rep_time"],
    }

    return jsonify(session_result)

if __name__ == "__main__":
    app.run(debug=False, port=5500, threaded=True)