from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import cv2
import numpy as np
import base64
import bcrypt

from db import get_connection

from pose_detector import get_landmarks
from angle_calculator import calculate_angle
from posture_analyzer import (
    get_posture_label,
    get_posture_score,
    get_posture_feedback
)
from stability_score import get_stability_score, final_score, get_rating
from rep_counter import RepCounter

app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────────────
# GLOBAL SESSION STATE (single-user)
# ─────────────────────────────────────────────
live_stats = {
    "angle": 0,
    "posture_label": "—",
    "posture_score": 0,
    "stability": 0,
    "reps": 0,
    "stage": "Ready",
    "feedback": "Get ready!"
}

session_result   = {}
session_active   = False
prev_angle       = None
posture_scores   = []
stability_scores = []
rep_counter      = RepCounter()
current_exercise = "squats"

# Landmarks & thresholds
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

IDX_A, IDX_B, IDX_C = 23, 25, 27

# ─────────────────────────────────────────────
# STATIC FILES
# ─────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory("../frontend", "login.html")

@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory("../frontend", filename)

# ─────────────────────────────────────────────
# AUTHENTICATION
# ─────────────────────────────────────────────
@app.route('/register', methods=['POST'])
def register():
    try:
        data     = request.json
        name     = data['full_name']
        email    = data['email']
        username = data['username']
        password = data['password'].encode('utf-8')

        hashed = bcrypt.hashpw(password, bcrypt.gensalt())

        conn   = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO users (full_name, email, username, password_hash) VALUES (%s, %s, %s, %s)",
            (name, email, username, hashed.decode('utf-8'))
        )
        user_id = cursor.lastrowid

        cursor.execute(
            "INSERT INTO user_stats (user_id) VALUES (%s)",
            (user_id,)
        )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"success": True, "message": "Account created!"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/login', methods=['POST'])
def login():
    try:
        data     = request.json
        username = data['username']
        password = data['password'].encode('utf-8')

        conn   = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM users WHERE username = %s",
            (username,)
        )
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if not user:
            return jsonify({"success": False, "message": "User not found"})

        if bcrypt.checkpw(password, user['password_hash'].encode('utf-8')):
            return jsonify({
                "success": True,
                "user": {
                    "id": user['id'],
                    "full_name": user['full_name'],
                    "username": user['username']
                }
            })

        return jsonify({"success": False, "message": "Wrong password"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

# ─────────────────────────────────────────────
# LIVE SESSION CONTROL
# ─────────────────────────────────────────────
@app.route("/start")
def start():
    global prev_angle, posture_scores, stability_scores
    global rep_counter, live_stats, session_result
    global session_active, current_exercise
    global IDX_A, IDX_B, IDX_C

    exercise = request.args.get("exercise", "squats")
    current_exercise = exercise

    posture_scores   = []
    stability_scores = []
    prev_angle       = None
    session_result   = {}
    session_active   = True

    live_stats = {
        "angle": 0,
        "posture_label": "—",
        "posture_score": 0,
        "stability": 0,
        "reps": 0,
        "stage": "Ready",
        "feedback": "Get ready!"
    }

    thresholds = EXERCISE_THRESHOLDS.get(exercise)
    rep_counter = RepCounter(
        down_angle=thresholds["down_angle"],
        up_angle=thresholds["up_angle"]
    )

    lm_idx = EXERCISE_LANDMARKS.get(exercise)
    IDX_A, IDX_B, IDX_C = lm_idx["a"], lm_idx["b"], lm_idx["c"]

    return jsonify({"status": "started"})

# ─────────────────────────────────────────────
# FRAME ANALYSIS
# ─────────────────────────────────────────────
@app.route("/analyze", methods=["POST"])
def analyze():
    global prev_angle, posture_scores, stability_scores
    global live_stats, IDX_A, IDX_B, IDX_C, current_exercise

    if not session_active:
        return jsonify(live_stats)

    try:
        data = request.get_json()
        img_data = data["frame"].split(",")[1]

        img_bytes = base64.b64decode(img_data)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify(live_stats)

        landmarks = get_landmarks(frame, required_idxs=(IDX_A, IDX_B, IDX_C))

        if landmarks:
            a, b, c = landmarks[IDX_A], landmarks[IDX_B], landmarks[IDX_C]

            angle = calculate_angle(a, b, c)

            # ✅ Normalize exercise name
            if "bicep" in current_exercise:
                exercise_type = "bicep"
            elif "squat" in current_exercise:
                exercise_type = "squat"
            elif "pushup" in current_exercise:
                exercise_type = "pushup"
            else:
                exercise_type = "squat"

            # ✅ FIXED CALLS
            posture_label = get_posture_label(angle, exercise_type)
            posture_score = get_posture_score(angle, exercise_type)
            feedback      = get_posture_feedback(angle, exercise_type)

            stability = get_stability_score(angle, prev_angle)
            reps, rep_fb = rep_counter.update(angle)

            posture_scores.append(posture_score)
            stability_scores.append(stability)
            prev_angle = angle

            live_stats.update({
                "angle": round(angle, 1),
                "posture_label": posture_label,
                "posture_score": round(posture_score, 1),
                "stability": round(stability, 1),
                "reps": reps,
                "stage": rep_counter.stage,
                "feedback": rep_fb if rep_fb else feedback,
            })

    except Exception as e:
        print("Analyze error:", e)

    return jsonify(live_stats)

# ─────────────────────────────────────────────
# STOP + SAVE SESSION
# ─────────────────────────────────────────────
@app.route("/stop", methods=["POST"])
def stop():
    global session_active, session_result

    try:
        data = request.json
        user_id = data.get("user_id")

        session_active = False

        summary = rep_counter.get_summary()
        final   = final_score(posture_scores, stability_scores)
        rating  = get_rating(final)

        avg_stability = (
            sum(stability_scores) / len(stability_scores)
            if stability_scores else 0
        )

        session_result = {
            "reps": summary["total_reps"],
            "score": final,
            "rating": rating,
            "avg_rep_time": summary["avg_rep_time"],
        }

        # SAVE TO DATABASE
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """INSERT INTO workout_sessions
               (user_id, exercise_name, posture_score, stability_score, reps, duration_sec)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (
                user_id,
                current_exercise,
                final,
                avg_stability,
                summary["total_reps"],
                summary["avg_rep_time"]
            )
        )
        session_id = cursor.lastrowid

        # SAVE TO POSTURE RECORDS (Session Summary)
        cursor.execute(
            """INSERT INTO posture_records 
               (session_id, user_id, joint_angles, posture_status, feedback)
               VALUES (%s, %s, %s, %s, %s)""",
            (
                session_id,
                user_id,
                '{"mode":"live_analysis_completed"}',
                rating,
                f"Completed {summary['total_reps']} reps with a score of {final}%."
            )
        )

        # UPDATE OR INSERT USER STATS
        cursor.execute(
            """INSERT INTO user_stats (user_id, total_workouts, total_reps, best_stability)
               VALUES (%s, 1, %s, %s)
               ON DUPLICATE KEY UPDATE 
                   total_workouts = COALESCE(total_workouts, 0) + 1,
                   total_reps     = COALESCE(total_reps, 0) + %s,
                   best_stability = GREATEST(COALESCE(best_stability, 0), %s)""",
            (
                user_id,
                summary["total_reps"],
                avg_stability,
                summary["total_reps"],
                avg_stability
            )
        )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify(session_result)

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

# ─────────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────────
@app.route('/dashboard/<int:user_id>', methods=['GET'])
def dashboard(user_id):
    try:
        conn   = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM user_stats WHERE user_id = %s",
            (user_id,)
        )
        stats = cursor.fetchone()

        cursor.execute(
            """SELECT exercise_name, posture_score, stability_score, reps, session_date
               FROM workout_sessions
               WHERE user_id = %s
               ORDER BY session_date DESC
               LIMIT 5"""
        , (user_id,))
        sessions = cursor.fetchall()

        for s in sessions:
            if s.get('session_date'):
                s['session_date'] = s['session_date'].isoformat() + 'Z'

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "stats": stats,
            "sessions": sessions
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

# ─────────────────────────────────────────────
# RUN SERVER
# ─────────────────────────────────────────────
# ─────────────────────────────────────────────
# PROGRESS & PROFILE
# ─────────────────────────────────────────────
@app.route('/progress/<int:user_id>', methods=['GET'])
def progress(user_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """SELECT exercise_name, posture_score, stability_score, reps, duration_sec, session_date
               FROM workout_sessions
               WHERE user_id = %s
               ORDER BY session_date ASC"""
        , (user_id,))
        sessions = cursor.fetchall()

        for s in sessions:
            if s.get('session_date'):
                s['session_date'] = s['session_date'].isoformat() + 'Z'

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "sessions": sessions
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """SELECT full_name, email, username, height, weight
               FROM users
               WHERE id = %s"""
        , (user_id,))
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        return jsonify({
            "success": user is not None,
            "user": user
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/profile', methods=['POST'])
def update_profile():
    try:
        data = request.json
        user_id = data.get("user_id")
        name = data.get("full_name")
        email = data.get("email")
        height = data.get("height") or None
        weight = data.get("weight") or None

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """UPDATE users
               SET full_name = %s, email = %s, height = %s, weight = %s
               WHERE id = %s""",
            (name, email, height, weight, user_id)
        )
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"success": True, "message": "Profile updated!"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == "__main__":
    app.run(debug=True, port=5500, threaded=True)
