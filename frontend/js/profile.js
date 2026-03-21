let isEditMode = false;
let currentView = "main";

// ✅ Load real user data on page load
document.addEventListener("DOMContentLoaded", () => {

    const currentUser = localStorage.getItem("alignai_current_user");
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(currentUser);
    const users = JSON.parse(localStorage.getItem("alignai_users") || "{}");
    const userData = users[user.username] || {};

    // Fill in real user data
    document.getElementById("display-name-heading").innerText = (user.name || user.username) + " 👋";
    document.getElementById("input-name").value   = user.name  || user.username || "";
    document.getElementById("input-email").value  = user.email || "";
    document.getElementById("input-weight").value = userData.weight || "";
    document.getElementById("input-height").value = userData.height || "";

    // Avatar initial
    const initial = (user.name || user.username || "U")[0].toUpperCase();
    document.getElementById("avatar-initial").innerText = initial;

    // Email under avatar
    const emailDisplay = document.querySelector(".text-gray-500.font-medium");
    if (emailDisplay) emailDisplay.innerText = user.email || "";

    // Workout stats for goal progress
    const historyKey = `alignai_history_${user.username}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
    const best = history.length > 0
        ? Math.max(...history.map(h => parseFloat(h.score) || 0))
        : 0;

    const progressBar = document.querySelector(".bg-blue-600.h-3.rounded-full");
    const progressLabel = document.querySelector(".text-2xl.font-black.text-blue-600");
    if (progressBar && progressLabel) {
        const pct = Math.min(best, 100);
        progressBar.style.width = pct + "%";
        progressLabel.innerText = pct.toFixed(0) + "%";
    }

    // ✅ Hide save button initially
    document.getElementById("save-btn").style.display = "none";
});

function switchView(viewName) {
    const views = {
        main:     { el: document.getElementById("view-main"),     title: "Profile Settings" },
        security: { el: document.getElementById("view-security"), title: "Security & Privacy" },
        help:     { el: document.getElementById("view-help"),     title: "Help & Support" },
    };

    Object.values(views).forEach(v => {
        v.el.classList.add("hidden-view");
        v.el.style.display = "none";
    });

    const target = views[viewName];
    target.el.style.display = viewName === "main" ? "grid" : "block";
    setTimeout(() => target.el.classList.remove("hidden-view"), 50);
    document.getElementById("view-title").innerText = target.title;
    currentView = viewName;
}

function handleHeaderBack() {
    if (currentView === "main") {
        window.location.href = "dashboard.html";
    } else {
        switchView("main");
    }
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    const inputs  = document.querySelectorAll("#profile-form input");
    const editBtn = document.getElementById("edit-btn");
    const saveBtn = document.getElementById("save-btn");

    if (isEditMode) {
        // Enable inputs
        inputs.forEach(input => {
            input.disabled = false;
            input.parentElement.classList.add("bg-white", "ring-2", "ring-blue-100", "border-blue-300");
            input.parentElement.classList.remove("bg-slate-50");
        });

        // Change Edit → Cancel Edit
        editBtn.innerHTML = '<i class="fas fa-times mr-2"></i>Cancel Edit';
        editBtn.classList.replace("bg-blue-50", "bg-slate-100");
        editBtn.classList.replace("text-blue-600", "text-slate-600");

        // ✅ Show Save button
        saveBtn.style.display = "flex";

        inputs[0].focus();

    } else {
        // Disable inputs
        inputs.forEach(input => {
            input.disabled = true;
            input.parentElement.classList.remove("bg-white", "ring-2", "ring-blue-100", "border-blue-300");
            input.parentElement.classList.add("bg-slate-50");
        });

        // Change Cancel → Edit Profile
        editBtn.innerHTML = '<i class="fas fa-edit mr-2"></i>Edit Profile';
        editBtn.classList.replace("bg-slate-100", "bg-blue-50");
        editBtn.classList.replace("text-slate-600", "text-blue-600");

        // ✅ Hide Save button
        saveBtn.style.display = "none";
    }
}

function showToast(message, isSuccess = true) {
    const toast    = document.getElementById("toast");
    const toastMsg = document.getElementById("toast-message");
    const toastIcon = document.getElementById("toast-icon");

    toastMsg.innerText = message;
    toastIcon.className = isSuccess
        ? "fas fa-check-circle text-green-400"
        : "fas fa-exclamation-circle text-rose-400";

    toast.classList.remove("hidden");
    toast.classList.add("flex");

    setTimeout(() => {
        toast.classList.add("hidden");
        toast.classList.remove("flex");
    }, 3000);
}

async function saveChanges() {
    const saveBtn = document.getElementById("save-btn");
    const origHTML = saveBtn.innerHTML;

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-circle-notch animate-spin mr-2"></i>Saving...';

    await new Promise(resolve => setTimeout(resolve, 1000));

    const newName   = document.getElementById("input-name").value.trim();
    const newEmail  = document.getElementById("input-email").value.trim();
    const newWeight = document.getElementById("input-weight").value;
    const newHeight = document.getElementById("input-height").value;

    // ✅ Save to localStorage
    const currentUser = JSON.parse(localStorage.getItem("alignai_current_user"));
    const users = JSON.parse(localStorage.getItem("alignai_users") || "{}");

    if (currentUser && users[currentUser.username]) {
        users[currentUser.username].name   = newName;
        users[currentUser.username].email  = newEmail;
        users[currentUser.username].weight = newWeight;
        users[currentUser.username].height = newHeight;
        localStorage.setItem("alignai_users", JSON.stringify(users));

        currentUser.name  = newName;
        currentUser.email = newEmail;
        localStorage.setItem("alignai_current_user", JSON.stringify(currentUser));
    }

    // Update display
    document.getElementById("display-name-heading").innerText = (newName.split(" ")[0] || "User") + " 👋";
    const emailDisplay = document.querySelector(".text-gray-500.font-medium");
    if (emailDisplay) emailDisplay.innerText = newEmail;

    // ✅ Exit edit mode after saving
    isEditMode = true;  // trick toggleEditMode to go back to view mode
    toggleEditMode();

    saveBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Saved!';
    saveBtn.style.backgroundColor = "#16a34a";
    saveBtn.style.display = "none";

    showToast("Changes saved successfully!");
    document.getElementById("sync-text").innerText = "Last synced: Just now";

    setTimeout(() => {
        saveBtn.disabled = false;
        saveBtn.innerHTML = origHTML;
        saveBtn.style.backgroundColor = "";
    }, 2000);
}

function toggleModal(show) {
    const modal = document.getElementById("modal-overlay");
    show ? modal.classList.remove("hidden") : modal.classList.add("hidden");
}

function removeSingleSession(btn) {
    const row = btn.closest(".other-session");
    row.style.opacity = "0.5";
    row.style.pointerEvents = "none";
    setTimeout(() => {
        row.remove();
        showToast("Device removed successfully");
        if (!document.querySelectorAll(".other-session").length) {
            document.getElementById("remove-all-btn").classList.add("hidden");
        }
    }, 600);
}

async function executeGlobalSignout() {
    const btn = document.getElementById("confirm-remove-btn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch animate-spin mr-2"></i>Processing...';

    await new Promise(r => setTimeout(r, 1500));

    document.querySelectorAll(".other-session").forEach(s => s.remove());
    document.getElementById("remove-all-btn").classList.add("hidden");
    toggleModal(false);
    showToast("All other devices removed");

    btn.disabled = false;
    btn.innerHTML = "Yes, Remove Other Devices";
}

async function handleSecurityUpdate() {
    showToast("Security settings updated.");
    switchView("main");
}

// ✅ Logout button
function logoutProfile() {
    localStorage.removeItem("alignai_current_user");
    window.location.href = "login.html";
}

// Fix logout button
document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.querySelector('[onclick="window.location.reload()"]');
    if (logoutBtn) {
        logoutBtn.setAttribute("onclick", "logoutProfile()");
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt mr-2"></i> Logout';
    }
});

// Photo upload
document.addEventListener("DOMContentLoaded", () => {
    const photoUpload = document.getElementById("photo-upload");
    if (photoUpload) {
        photoUpload.addEventListener("change", function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById("profile-preview");
                    const initial = document.getElementById("avatar-initial");
                    preview.src = e.target.result;
                    preview.classList.remove("hidden");
                    initial.classList.add("hidden");
                };
                reader.readAsDataURL(file);
            }
        });
    }
});