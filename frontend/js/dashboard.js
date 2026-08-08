document.addEventListener("DOMContentLoaded", async () => {

    // ✅ Check if user is logged in
    const currentUser = localStorage.getItem("alignai_current_user");
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(currentUser);

    // If the cached user is from before the DB update, they won't have an ID.
    // Force them to re-login to retrieve their database ID.
    if (!user.id) {
        localStorage.removeItem("alignai_current_user");
        window.location.href = "login.html";
        return;
    }

    // ✅ Show real user name
    const nameEl = document.querySelector(".hero-banner h1");
    if (nameEl) nameEl.textContent = (user.full_name || user.name || user.username) + " 👋";

    try {
        const response = await fetch(`http://127.0.0.1:5500/dashboard/${user.id}`);
        const data = await response.json();
        
        if (!data.success) {
            console.error("Dashboard fetch failed:", data.error);
            return;
        }

        const stats = data.stats || {};
        const sessions = data.sessions || [];

        // ✅ Update stats using database numbers
        const totalWorkoutsEl = document.querySelector(".summary-stats .stat-tile:first-child .val");
        const bestStabilityEl = document.querySelector(".summary-stats .stat-tile:last-child .val");

        if (totalWorkoutsEl) totalWorkoutsEl.textContent = stats.total_workouts || 0;
        if (bestStabilityEl) bestStabilityEl.textContent = stats.best_stability || "--";

        // ✅ Show ALL sessions in activity
        const activityFeed = document.querySelector(".activity-feed");
        if (activityFeed) {
            activityFeed.querySelectorAll(".activity-item").forEach(el => el.remove());
            activityFeed.querySelectorAll("p.empty-msg").forEach(el => el.remove());

            if (sessions.length === 0) {
                activityFeed.insertAdjacentHTML("beforeend", `
                    <p class="empty-msg text-sm text-slate-400 text-center py-4">
                        No workouts yet. Start your first workout! 💪
                    </p>
                `);
            } else {
                sessions.forEach(item => {
                    const isIncomplete = parseFloat(item.posture_score) === 0;
                    
                    // format date safely
                    const dateObj = new Date(item.session_date);
                    const dateStr = isNaN(dateObj) ? item.session_date : dateObj.toLocaleDateString("en-IN", {day:"numeric", month:"short"});

                    // Rating heuristic
                    let rating = "Keep Practicing 🔄";
                    if (item.posture_score >= 90) rating = "Excellent 🏆";
                    else if (item.posture_score >= 75) rating = "Very Good 💪";
                    else if (item.posture_score >= 60) rating = "Good 👍";

                    activityFeed.insertAdjacentHTML("beforeend", `
                        <div class="activity-item" style="${isIncomplete ? 'opacity:0.5' : ''}">
                            <div>
                                <p class="font-semibold text-slate-800 text-sm" style="text-transform:capitalize">
                                    ${item.exercise_name.replace(/_/g, " ")}
                                    ${isIncomplete ? '<span style="font-size:0.65rem; color:#94a3b8; margin-left:4px;">(incomplete)</span>' : ''}
                                </p>
                                <time class="text-xs text-slate-500">${dateStr}</time>
                            </div>
                            <div class="text-right">
                                <span class="text-sm font-bold ${isIncomplete ? 'text-slate-400' : 'text-blue-600'}">
                                    Score: ${item.posture_score}
                                </span><br>
                                <span class="text-xs text-slate-400">${item.reps} reps · ${rating}</span>
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
        if (tipEl && sessions.length > 0) {
            const lastExercise = sessions[0].exercise_name.replace(/_/g, " ").toLowerCase();
            const tip = TIPS[lastExercise] || TIPS["default"];
            tipEl.innerHTML = `<strong class="font-bold">Tip:</strong> ${tip}`;
        }
    } catch(err) {
        console.error("Dashboard error:", err);
    }
});

// ✅ Logout
function logout() {
    localStorage.removeItem("alignai_current_user");
    window.location.href = "login.html";
}