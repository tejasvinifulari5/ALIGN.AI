let isEditMode = false;
let currentView = "main";

function switchView(viewName) {
  const views = {
    main: {
      el: document.getElementById("view-main"),
      title: "Account Settings",
    },
    security: {
      el: document.getElementById("view-security"),
      title: "Security & Privacy",
    },
    help: {
      el: document.getElementById("view-help"),
      title: "Help & Support",
    },
  };

  Object.values(views).forEach((v) => {
    v.el.classList.add("hidden-view");
    v.el.style.display = "none";
  });

  const target = views[viewName];
  target.el.style.display = viewName === "main" ? "grid" : "block";

  setTimeout(() => {
    target.el.classList.remove("hidden-view");
  }, 50);

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
  const inputs = document.querySelectorAll("#profile-form input");
  const editBtn = document.getElementById("edit-btn");

  if (isEditMode) {
    inputs.forEach((input) => {
      input.disabled = false;
      input.parentElement.classList.add(
        "bg-white",
        "ring-2",
        "ring-blue-100",
        "border-blue-300"
      );
      input.parentElement.classList.remove("bg-slate-50");
    });

    editBtn.innerHTML = '<i class="fas fa-times mr-2"></i>Cancel Edit';
    editBtn.classList.replace("bg-blue-50", "bg-slate-100");
    editBtn.classList.replace("text-blue-600", "text-slate-600");

    inputs[0].focus();
  } else {
    inputs.forEach((input) => {
      input.disabled = true;
      input.parentElement.classList.remove(
        "bg-white",
        "ring-2",
        "ring-blue-100",
        "border-blue-300"
      );
      input.parentElement.classList.add("bg-slate-50");
    });

    editBtn.innerHTML = '<i class="fas fa-edit mr-2"></i>Edit Profile';
    editBtn.classList.replace("bg-slate-100", "bg-blue-50");
    editBtn.classList.replace("text-slate-600", "text-blue-600");
  }
}

function showToast(message, isSuccess = true) {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toast-message");
  const toastIcon = document.getElementById("toast-icon");

  toastMsg.innerText = message;

  toastIcon.className = isSuccess
    ? "fas fa-check-circle text-green-400"
    : "fas fa-exclamation-circle text-rose-400";

  toast.classList.add("toast-active");

  setTimeout(() => {
    toast.classList.remove("toast-active");
  }, 3000);
}

async function saveChanges() {
  const saveBtn = document.getElementById("save-btn");
  const originalText = saveBtn.innerHTML;

  saveBtn.disabled = true;
  saveBtn.innerHTML =
    '<i class="fas fa-circle-notch animate-spin mr-2"></i>Saving...';

  await new Promise((resolve) => setTimeout(resolve, 1200));

  const newName = document.getElementById("input-name").value;

  document.getElementById("display-name-heading").innerText =
    (newName.split(" ")[0] || "User") + " 👋";

  if (isEditMode) toggleEditMode();

  saveBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Saved!';
  saveBtn.classList.replace("bg-slate-900", "bg-green-600");

  showToast("Changes saved successfully!");

  document.getElementById("sync-text").innerText =
    "Last synced: Just now";

  setTimeout(() => {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
    saveBtn.classList.replace("bg-green-600", "bg-slate-900");
  }, 3000);
}

function toggleModal(show) {
  const modal = document.getElementById("modal-overlay");

  if (show) {
    modal.classList.remove("hidden");
  } else {
    modal.classList.add("hidden");
  }
}

function removeSingleSession(btn) {
  const sessionRow = btn.closest(".other-session");

  sessionRow.style.opacity = "0.5";
  sessionRow.style.pointerEvents = "none";

  setTimeout(() => {
    sessionRow.remove();

    showToast("Device removed successfully");

    const others = document.querySelectorAll(".other-session");

    if (others.length === 0) {
      document.getElementById("remove-all-btn").classList.add("hidden");
    }
  }, 600);
}

async function executeGlobalSignout() {
  const confirmBtn = document.getElementById("confirm-remove-btn");
  const originalText = confirmBtn.innerText;

  confirmBtn.disabled = true;
  confirmBtn.innerHTML =
    '<i class="fas fa-circle-notch animate-spin mr-2"></i>Processing...';

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const otherSessions = document.querySelectorAll(".other-session");

  otherSessions.forEach((session) => session.remove());

  document.getElementById("remove-all-btn").classList.add("hidden");

  toggleModal(false);

  showToast("All other devices removed");

  confirmBtn.disabled = false;
  confirmBtn.innerText = originalText;
}

async function handleSecurityUpdate() {
  showToast("Security settings updated.");

  switchView("main");
}

document
  .getElementById("photo-upload")
  .addEventListener("change", function (event) {

    const file = event.target.files[0];

    if (file) {

      const reader = new FileReader();

      reader.onload = function (e) {

        const preview = document.getElementById("profile-preview");
        const initial = document.getElementById("avatar-initial");

        preview.src = e.target.result;

        preview.classList.remove("hidden");
        initial.classList.add("hidden");
      };

      reader.readAsDataURL(file);
    }
});