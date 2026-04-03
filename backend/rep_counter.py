import time

class RepCounter:
    def __init__(self, down_angle=100, up_angle=160, min_down_frames=5):
        """
        ✅ Configurable thresholds per exercise
        down_angle     : angle below which = squat down
        up_angle       : angle above which = standing up
        min_down_frames: frames must stay down before counting
        """
        self.down_angle      = down_angle
        self.up_angle        = up_angle
        self.min_down_frames = min_down_frames

        self.count       = 0
        self.stage       = "up"
        self.down_frames = 0
        self.last_rep_time = None
        self.rep_times   = []        # ✅ track time per rep
        self.feedback    = ""        # ✅ real-time feedback message

    def update(self, angle):
        """
        Update rep count based on current angle.
        Returns (count, feedback) tuple.
        """
        if angle is None:
            return self.count, self.feedback

        # ✅ Going down
        if angle < self.down_angle:
            self.down_frames += 1
            if self.down_frames >= self.min_down_frames:
                self.stage    = "down"
                self.feedback = "Hold... 🔽"
        else:
            self.down_frames = 0

        # ✅ Coming back up — count rep
        if angle > self.up_angle and self.stage == "down":
            self.count += 1
            self.stage  = "up"

            # ✅ Track rep duration
            now = time.time()
            if self.last_rep_time:
                duration = round(now - self.last_rep_time, 1)
                self.rep_times.append(duration)
                self.feedback = f"Rep {self.count} ✅ ({duration}s)"
            else:
                self.feedback = f"Rep {self.count} ✅"

            self.last_rep_time = now

        # ✅ Motivational feedback by count
        if self.stage == "up" and self.down_frames == 0:
            if self.count == 0:
                self.feedback = "Start squatting! 💪"
            elif self.count < 5:
                self.feedback = f"{self.count} reps — keep going!"
            elif self.count < 10:
                self.feedback = f"{self.count} reps — great work! 🔥"
            else:
                self.feedback = f"{self.count} reps — beast mode! 💥"

        return self.count, self.feedback

    def reset(self):
        """✅ Reset for new session without creating new object"""
        self.count       = 0
        self.stage       = "up"
        self.down_frames = 0
        self.last_rep_time = None
        self.rep_times   = []
        self.feedback    = ""

    def get_avg_rep_time(self):
        """✅ Returns average time per rep in seconds"""
        if not self.rep_times:
            return 0
        return round(sum(self.rep_times) / len(self.rep_times), 1)

    def get_summary(self):
        """✅ Returns dict summary of session"""
        return {
            "total_reps"   : self.count,
            "avg_rep_time" : self.get_avg_rep_time(),
            "rep_times"    : self.rep_times
        }