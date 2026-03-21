// ✅ Auth guard
if (!localStorage.getItem("alignai_current_user")) window.location.href = "login.html";

// ✅ Load data from localStorage — no backend needed
const user = JSON.parse(localStorage.getItem("alignai_current_user"));
const all  = JSON.parse(localStorage.getItem(`alignai_history_${user.username}`) || "[]");
const data = all.filter(h => parseFloat(h.score) > 0);

// ✅ Summary stats
const total = data.length;
const reps  = data.reduce((s, h) => s + (parseInt(h.reps) || 0), 0);
const best  = total ? Math.max(...data.map(h => parseFloat(h.score))).toFixed(1) : "—";
const avg   = total ? (data.reduce((s, h) => s + parseFloat(h.score), 0) / total).toFixed(1) : "—";

document.getElementById("sessionBadge").textContent = `${total} session${total !== 1 ? "s" : ""}`;
document.getElementById("hTotal").textContent = total;
document.getElementById("hBest").textContent  = best;
document.getElementById("hReps").textContent  = reps;
document.getElementById("hAvg").textContent   = avg;

// ✅ Chart defaults
Chart.defaults.font.family = "'DM Sans', sans-serif";
Chart.defaults.color = "#94a3b8";

let scoreChart = null;

function buildScore(filtered) {
    const ctx = document.getElementById("scoreChart").getContext("2d");
    if (scoreChart) scoreChart.destroy();
    scoreChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: filtered.map((h, i) => h.dateShort || `#${i + 1}`),
            datasets: [{
                data: filtered.map(h => parseFloat(h.score)),
                borderColor: "#2563eb",
                backgroundColor: "rgba(37,99,235,0.07)",
                borderWidth: 2.5,
                pointBackgroundColor: "#fff",
                pointBorderColor: "#2563eb",
                pointBorderWidth: 2,
                pointRadius: 5,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { min: 0, max: 100, grid: { color: "#f1f5f9" }, ticks: { stepSize: 25 } },
                x: { grid: { display: false } }
            }
        }
    });
}

// ✅ Filter score chart by exercise
function filterScore(ex, btn) {
    document.querySelectorAll(".pill").forEach(b => b.classList.remove("on"));
    btn.classList.add("on");
    const f = ex === "all" ? data : data.filter(h => h.exercise.toLowerCase() === ex);
    buildScore(f);
}

if (total > 0) {
    buildScore(data);

    // ✅ Reps bar chart
    new Chart(document.getElementById("repsChart").getContext("2d"), {
        type: "bar",
        data: {
            labels: data.map((h, i) => h.dateShort || `#${i + 1}`),
            datasets: [{
                data: data.map(h => parseInt(h.reps) || 0),
                backgroundColor: data.map(h => {
                    const e = h.exercise.toLowerCase();
                    return e.includes("squat") ? "rgba(37,99,235,0.75)"
                         : e.includes("bicep") ? "rgba(16,185,129,0.75)"
                         : "rgba(245,158,11,0.75)";
                }),
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
                x: { grid: { display: false } }
            }
        }
    });

    // ✅ Pie / doughnut chart
    const counts = {};
    data.forEach(h => {
        const e = h.exercise.toLowerCase();
        counts[e] = (counts[e] || 0) + 1;
    });
    const exLabels = Object.keys(counts);
    const exVals   = Object.values(counts);
    const colors   = ["#2563eb", "#10b981", "#f59e0b", "#ef4444"];

    new Chart(document.getElementById("pieChart").getContext("2d"), {
        type: "doughnut",
        data: {
            labels: exLabels,
            datasets: [{ data: exVals, backgroundColor: colors, borderWidth: 3, borderColor: "#fff" }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            cutout: "68%"
        }
    });

    // Pie legend
    const leg = document.getElementById("pieLegend");
    exLabels.forEach((lbl, i) => {
        leg.innerHTML += `
            <div class="legend-item">
                <div class="ldot" style="background:${colors[i]}"></div>
                <span class="lname">${lbl}</span>
                <span class="lcount">${exVals[i]}</span>
            </div>`;
    });

    // ✅ History table
    const sc   = s => parseFloat(s) >= 75 ? "sc-hi" : parseFloat(s) >= 50 ? "sc-mid" : "sc-lo";
    const chip = ex => {
        const e = ex.toLowerCase();
        const c = e.includes("squat") ? "chip-sq" : e.includes("bicep") ? "chip-bi" : "chip-pu";
        return `<span class="chip ${c}">${ex}</span>`;
    };

    document.getElementById("histWrap").innerHTML = `
        <table class="tbl">
            <thead>
                <tr>
                    <th>Exercise</th>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Reps</th>
                    <th>Duration</th>
                    <th>Rating</th>
                </tr>
            </thead>
            <tbody>
                ${[...data].reverse().map(h => `
                    <tr>
                        <td>${chip(h.exercise)}</td>
                        <td style="color:var(--slate-500)">${h.dateShort || h.date || "—"}</td>
                        <td><span class="${sc(h.score)}">${h.score}</span></td>
                        <td>${h.reps ?? 0}</td>
                        <td style="color:var(--slate-500)">${h.duration || "—"}</td>
                        <td style="color:var(--slate-500);font-size:0.78rem">${h.rating || "—"}</td>
                    </tr>`).join("")}
            </tbody>
        </table>`;

} else {
    // Empty state for all charts
    document.getElementById("histWrap").innerHTML = `
        <div class="empty">
            <i class="fas fa-chart-bar"></i>
            <p>No workouts yet — complete a session first!</p>
        </div>`;

    ["scoreChart", "repsChart", "pieChart"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.closest(".card-body").innerHTML =
            `<div class="empty"><i class="fas fa-chart-bar"></i><p>No data yet.</p></div>`;
    });
}