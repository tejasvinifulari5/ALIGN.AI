from dataset_handler import get_motion_baseline

baseline = get_motion_baseline() * 100

def calculate_stability(angle_diff):
    score = max(0, 100 - abs(angle_diff * 10 - baseline))
    return score


baseline = get_motion_baseline() * 100


def get_stability_score(current, previous):
    """
    Returns stability score using BOTH:
    ✅ dataset baseline
    ✅ smooth rule-based scoring
    """
    if previous is None or current is None:
        return 100

    change = abs(current - previous)

    # 🔥 Dataset-based score
    dataset_score = max(0, 100 - abs(change * 10 - baseline))

    # 🔥 Rule-based score (your original logic)
    if change < 5:
        rule_score = 100
    elif change < 10:
        rule_score = 100 - (change - 5) * 2
    elif change < 20:
        rule_score = 90 - (change - 10) * 2
    elif change < 35:
        rule_score = 70 - (change - 20) * 2
    else:
        rule_score = 20

    # ✅ Combine both (IMPORTANT for AIDS domain)
    final_score = (0.75 * rule_score) + (0.25 * dataset_score)

    return round(final_score, 2)                            # very unstable



def get_rating(score):
    """
    Returns descriptive rating with emoji based on final score.
    """
    if score >= 90:
        return "Excellent 🏆"
    elif score >= 75:
        return "Very Good 💪"
    elif score >= 60:
        return "Good 👍"
    elif score >= 45:
        return "Average 😐"
    elif score >= 30:
        return "Needs Work 📉"
    else:
        return "Keep Practicing 🔄"

def final_score(posture_scores, stability_scores):
    """
    Returns weighted final score from posture and stability scores.
    """
    if not posture_scores or not stability_scores:
        return 0.0

    def weighted_avg(scores):
        n = len(scores)
        weights = [i + 1 for i in range(n)]
        total = sum(w * s for w, s in zip(weights, scores))
        return total / sum(weights)

    avg_posture = weighted_avg(posture_scores)
    avg_stability = weighted_avg(stability_scores)

    score = (0.6 * avg_posture) + (0.4 * avg_stability)

    return round(score, 2)