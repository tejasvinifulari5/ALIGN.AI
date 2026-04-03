let currentUser = JSON.parse(localStorage.getItem("alignai_current_user") || "null");
if (!currentUser || !currentUser.id) {
    localStorage.removeItem("alignai_current_user");
    window.location.href = "login.html";
}
const params = new URLSearchParams(window.location.search);
const exercise = params.get("exercise") || "squats";
const exerciseName = exercise.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

document.getElementById("exerciseLabel").textContent = exerciseName;
document.getElementById("exerciseTag").textContent   = exerciseName;

// Timer
let seconds = 0;
let timerInterval = null;

function startTimer() {
    timerInterval = setInterval(() => {
        seconds++;
        const m = String(Math.floor(seconds/60)).padStart(2,"0");
        const s = String(seconds%60).padStart(2,"0");
        document.getElementById("timerDisplay").textContent = `${m}:${s}`;
    }, 1000);
}

let paused = false;
let analyzeInterval = null;
let stream = null;

// ✅ Canvas to capture frames from video
const canvas = document.createElement("canvas");
canvas.width  = 320;
canvas.height = 240;
const ctx = canvas.getContext("2d");

// ✅ Send frame to backend every 200ms for analysis
async function sendFrame() {
    if (paused) return;
    const video = document.getElementById("webcamFeed");
    if (!video || video.readyState < 2) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = canvas.toDataURL("image/jpeg", 0.7);

    try {
        const res = await fetch("http://127.0.0.1:5500/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ frame })
        });
        const data = await res.json();
        updatePanel(data);
    } catch(e) {}
}

function updatePanel(data) {
    document.getElementById("kneeAngle").textContent    = data.angle ? `${Math.round(data.angle)}°` : "—°";
    document.getElementById("postureStage").textContent = data.posture_label || "—";
    document.getElementById("repCount").textContent     = data.reps ?? 0;
    document.getElementById("stagePill").textContent    = data.stage || "Ready";
    document.getElementById("feedbackText").textContent = data.feedback || "Keep going!";

    const stab = data.stability     ?? 0;
    const post = data.posture_score ?? 0;
    document.getElementById("stabilityBar").style.width = stab + "%";
    document.getElementById("stabilityVal").textContent  = stab;
    document.getElementById("postureBar").style.width    = post + "%";
    document.getElementById("postureVal").textContent    = post;
}

function togglePause() {
    paused = !paused;
    const btn = document.getElementById("pauseBtn");
    btn.innerHTML = paused
        ? '<i class="fas fa-play"></i> Resume'
        : '<i class="fas fa-pause"></i> Pause';
}

function saveSummary(data) {
    const currentUser = JSON.parse(localStorage.getItem("alignai_current_user"));
    if (!currentUser) return;

    const summary = {
        exercise:     exerciseName,
        exerciseKey:  exercise,
        score:        parseFloat(data.score || 0).toFixed(1),
        reps:         data.reps ?? 0,
        rating:       data.rating || "--",
        duration:     document.getElementById("timerDisplay").textContent,
        avg_rep_time: data.avg_rep_time || 0,
        date:         new Date().toLocaleDateString("en-IN", {day:"2-digit", month:"2-digit", year:"numeric"}),
        dateShort:    new Date().toLocaleDateString("en-IN", {day:"numeric", month:"short"})
    };

    // Save only for the immediate summary screen, history is in MySQL now!
    localStorage.setItem("alignai_last_summary", JSON.stringify(summary));
}

async function stopSession() {
    clearInterval(timerInterval);
    clearInterval(analyzeInterval);

    // Stop camera
    if (stream) stream.getTracks().forEach(t => t.stop());

    const currentUser = JSON.parse(localStorage.getItem("alignai_current_user"));

    try {
        const res = await fetch("http://127.0.0.1:5500/stop", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: currentUser ? currentUser.id : null })
        });
        const data = await res.json();
        saveSummary(data);
        window.location.href = "workout_summary.html";
    } catch(e) {
        alert("Could not stop session.");
    }
}

// ✅ Countdown then open camera
async function countdown() {
    const numEl   = document.getElementById("countdownNum");
    const overlay = document.getElementById("countdownOverlay");

    for (let i = 3; i > 0; i--) {
        numEl.textContent = i;
        await new Promise(r => setTimeout(r, 1000));
    }

    numEl.textContent    = "GO! 💪";
    numEl.style.fontSize = "3rem";
    await new Promise(r => setTimeout(r, 600));

    // Open browser camera
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.getElementById("webcamFeed");
        video.srcObject = stream;
        video.style.display = "block";
        overlay.style.display = "none";
    } catch(e) {
        alert("Camera access denied. Please allow camera permission.");
        return;
    }
}

async function init() {
    // ✅ Tell backend to start session (no camera, just resets state)
    await fetch(`http://127.0.0.1:5500/start?exercise=${exercise}`);

    await countdown();

    startTimer();

    // ✅ Send frames to backend every 200ms for analysis
    analyzeInterval = setInterval(sendFrame, 200);
}

init();