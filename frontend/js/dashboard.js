document.addEventListener("DOMContentLoaded", () => {

    // ✅ Check if user is logged in
    const currentUser = localStorage.getItem("alignai_current_user");
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(currentUser);

    // ✅ Show real user name
    const nameEl = document.querySelector(".hero-banner h1");
    if (nameEl) nameEl.textContent = (user.name || user.username) + " 👋";

    // ✅ Load full workout history
    const historyKey = `alignai_history_${user.username}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || "[]");

    // ✅ Valid sessions only for stats (exclude 0.0)
    const validHistory = history.filter(h => parseFloat(h.score) > 0);

    // ✅ Update stats using valid sessions only
    const totalWorkoutsEl = document.querySelector(".summary-stats .stat-tile:first-child .val");
    const bestStabilityEl = document.querySelector(".summary-stats .stat-tile:last-child .val");

    if (totalWorkoutsEl) totalWorkoutsEl.textContent = validHistory.length;

    if (bestStabilityEl) {
        const best = validHistory.length > 0
            ? Math.max(...validHistory.map(h => parseFloat(h.score) || 0)).toFixed(1)
            : "--";
        bestStabilityEl.textContent = best;
    }

    // ✅ Show ALL sessions in activity (including 0.0 ones)
    const activityFeed = document.querySelector(".activity-feed");
    if (activityFeed) {
        activityFeed.querySelectorAll(".activity-item").forEach(el => el.remove());
        activityFeed.querySelectorAll("p.empty-msg").forEach(el => el.remove());

        if (history.length === 0) {
            activityFeed.insertAdjacentHTML("beforeend", `
                <p class="empty-msg text-sm text-slate-400 text-center py-4">
                    No workouts yet. Start your first workout! 💪
                </p>
            `);
        } else {
            [...history].reverse().slice(0, 5).forEach(item => {
                const isIncomplete = parseFloat(item.score) === 0;

                activityFeed.insertAdjacentHTML("beforeend", `
                    <div class="activity-item" style="${isIncomplete ? 'opacity:0.5' : ''}">
                        <div>
                            <p class="font-semibold text-slate-800 text-sm" style="text-transform:capitalize">
                                ${item.exercise}
                                ${isIncomplete ? '<span style="font-size:0.65rem; color:#94a3b8; margin-left:4px;">(incomplete)</span>' : ''}
                            </p>
                            <time class="text-xs text-slate-500">${item.date}</time>
                        </div>
                        <div class="text-right">
                            <span class="text-sm font-bold ${isIncomplete ? 'text-slate-400' : 'text-blue-600'}">
                                Score: ${item.score}
                            </span><br>
                            <span class="text-xs text-slate-400">${item.reps} reps · ${item.rating}</span>
                        </div>
                    </div>
                `);
            });
        }
    }

    // ✅ Dynamic tip based on last exercise
    const TIPS = {
        "squats":      "Keep knees aligned with toes during squats for maximum stability.",
        "bicep curls": "Keep your elbows close to your body during bicep curls.",
        "pushups":     "Keep your core tight and body straight during pushups.",
        "default":     "Consistency is key — try to workout at least 3 times a week! 💪"
    };

    const tipEl = document.querySelector(".advice-callout p");
    if (tipEl && history.length > 0) {
        const lastExercise = history[history.length - 1].exercise.toLowerCase();
        const tip = TIPS[lastExercise] || TIPS["default"];
        tipEl.innerHTML = `<strong class="font-bold">Tip:</strong> ${tip}`;
    }
});

// ✅ Logout
function logout() {
    localStorage.removeItem("alignai_current_user");
    window.location.href = "login.html";
}