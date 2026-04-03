import cv2
import mediapipe as mp
import numpy as np
import urllib.request
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "pose_landmarker_full.task")

# ✅ Safe model download with error handling
def download_model():
    if not os.path.exists(MODEL_PATH):
        print("Downloading pose model (~5MB)...")
        try:
            urllib.request.urlretrieve(
                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
                MODEL_PATH
            )
            print("✅ Model downloaded!")
        except Exception as e:
            print(f"❌ Model download failed: {e}")
            raise

download_model()

# MediaPipe Tasks API
BaseOptions          = mp.tasks.BaseOptions
PoseLandmarker       = mp.tasks.vision.PoseLandmarker
PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
VisionRunningMode    = mp.tasks.vision.RunningMode

# ✅ Confidence thresholds added
options = PoseLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=MODEL_PATH),
    running_mode=VisionRunningMode.IMAGE,
    min_pose_detection_confidence=0.6,   # ✅ ignore low confidence
    min_pose_presence_confidence=0.6,    # ✅ ignore weak presence
    min_tracking_confidence=0.5          # ✅ ignore weak tracking
)

# ✅ Lazy initialization — created once, reused
_landmarker = None

def get_landmarker():
    global _landmarker
    if _landmarker is None:
        _landmarker = PoseLandmarker.create_from_options(options)
    return _landmarker

def get_landmarks(frame):
    """
    Input: BGR frame from webcam
    Output: 33 landmarks or None
    """
    # ✅ Validate frame
    if frame is None or frame.size == 0:
        return None

    try:
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=np.ascontiguousarray(rgb_frame)  # ✅ ensure memory layout
        )

        result = get_landmarker().detect(mp_image)

        if result.pose_landmarks and len(result.pose_landmarks) > 0:

            landmarks = result.pose_landmarks[0]

            # ✅ Filter by visibility — skip hidden landmarks
            MIN_VISIBILITY = 0.5
            if all(lm.visibility > MIN_VISIBILITY
                   for lm in [landmarks[23], landmarks[25], landmarks[27]]):
                return landmarks

        return None

    except Exception as e:
        print(f"⚠️ Landmark detection error: {e}")
        return None