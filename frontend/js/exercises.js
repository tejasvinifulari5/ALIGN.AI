// Auth guard
if (!localStorage.getItem("alignai_current_user")) window.location.href = "login.html";

// Tab switching
function showTab(name, btn) {
    // Hide all panels
    document.querySelectorAll(".ex-panel").forEach(p => p.classList.add("hidden"));
    // Remove active from all tabs
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    // Show selected panel
    document.getElementById(`tab-${name}`).classList.remove("hidden");
    // Set active tab
    btn.classList.add("active");
}