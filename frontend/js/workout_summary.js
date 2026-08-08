if (!localStorage.getItem("alignai_current_user")) window.location.href = "login.html";

// ✅ Read summary saved by workout_session.js
const s = JSON.parse(localStorage.getItem("alignai_last_summary") || "{}");

document.getElementById("scoreVal").textContent    = s.score    || "--";
document.getElementById("ratingBadge").textContent = s.rating   || "--";
document.getElementById("statReps").textContent    = s.reps     ?? "--";
document.getElementById("statScore").textContent   = s.score    || "--";
document.getElementById("statRepTime").textContent = s.avg_rep_time ? s.avg_rep_time + "s" : "--";
document.getElementById("detExercise").textContent = s.exercise || "--";
document.getElementById("detDate").textContent     = s.date     || "--";
document.getElementById("detDuration").textContent = s.duration || "--";
document.getElementById("detRating").textContent   = s.rating   || "--";