import time

class RepCounter:
    def __init__(self, down_angle=100, up_angle=160, min_down_frames=2):
        """
        ✅ Configurable thresholds per exercise
        """
        self.down_angle = down_angle
        self.up_angle = up_angle
        self.min_down_frames = min_down_frames

        self.count = 0
        self.stage = "up"
        self.down_frames = 0
        self.last_rep_time = None
        self.rep_times = []
        self.feedback = ""

    def update(self, angle):
        """
        Update rep count based on current angle.
        Returns (count, feedback)
        """
        if angle is None:
            return self.count, self.feedback

        # ✅ Going down
        if angle < self.down_angle:
            self.down_frames += 1
        else:
            self.down_frames = 0

        # ✅ Detect DOWN (with tolerance)
        if self.down_frames >= self.min_down_frames:
            self.stage = "down"
            self.feedback = "Down detected 🔽"

        # ✅ Coming UP → count rep
        if angle > self.up_angle and self.stage == "down":
            self.count += 1
            self.stage = "up"

            now = time.time()
            if self.last_rep_time:
                duration = round(now - self.last_rep_time, 1)
                self.rep_times.append(duration)
                self.feedback = f"Rep {self.count} ✅ ({duration}s)"
            else:
                self.feedback = f"Rep {self.count} ✅"

            self.last_rep_time = now

        # ✅ Motivational feedback
        if self.stage == "up" and self.down_frames == 0:
            if self.count == 0:
                self.feedback = "Start squatting! 💪"
            elif self.count < 5:
                self.feedback = f"{self.count} reps — keep going!"
            elif self.count < 10:
                self.feedback = f"{self.count} reps — great work! 🔥"
            else:
                self.feedback = f"{self.count} reps — beast mode! 💥"

        # ✅ DEBUG PRINT
        print(f"Angle: {angle}, Stage: {self.stage}, DownFrames: {self.down_frames}, Reps: {self.count}")

        return self.count, self.feedback

    def reset(self):
        self.count = 0
        self.stage = "up"
        self.down_frames = 0
        self.last_rep_time = None
        self.rep_times = []
        self.feedback = ""

    def get_avg_rep_time(self):
        if not self.rep_times:
            return 0
        return round(sum(self.rep_times) / len(self.rep_times), 1)

    def get_summary(self):
        return {
            "total_reps": self.count,
            "avg_rep_time": self.get_avg_rep_time(),
            "rep_times": self.rep_times
        }

