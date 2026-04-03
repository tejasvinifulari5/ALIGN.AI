def get_stability_score(current, previous):
    """
    Returns stability score 0-100 based on angle change between frames.
    ✅ Gradual scoring instead of harsh jumps.
    """
    if previous is None or current is None:
        return 100

    change = abs(current - previous)

    if change < 5:
        return 100                              # very stable
    elif change < 10:
        return round(100 - (change - 5) * 2, 1)  # gradual 100→90
    elif change < 20:
        return round(90 - (change - 10) * 2, 1)  # gradual 90→70
    elif change < 35:
        return round(70 - (change - 20) * 2, 1)  # gradual 70→40
    else:
        return 20                               # very unstable


def final_score(posture_scores, stability_scores):
    """
    Returns weighted final score from posture and stability scores.
    ✅ Handles empty lists safely.
    ✅ Recent frames weighted more than early frames.
    """
    # ✅ Guard against empty lists
    if not posture_scores or not stability_scores:
        return 0.0

    # ✅ Weighted average — recent frames matter more
    def weighted_avg(scores):
        n = len(scores)
        weights = [i + 1 for i in range(n)]   # 1,2,3...n
        total = sum(w * s for w, s in zip(weights, scores))
        return total / sum(weights)

    avg_posture   = weighted_avg(posture_scores)
    avg_stability = weighted_avg(stability_scores)

    # ✅ Posture weighted slightly more than stability
    score = (0.6 * avg_posture) + (0.4 * avg_stability)

    return round(score, 2)


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