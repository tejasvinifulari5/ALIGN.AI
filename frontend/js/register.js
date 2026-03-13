(function () {
  const CONFIG = {
    existingUsers: ["johndoe", "admin", "posture_pro", "align_master", "user123"],
    minPassLength: 8,
  };

  const elements = {
    form: document.getElementById("authForm"),
    name: document.getElementById("name"),
    handle: document.getElementById("handle"),
    email: document.getElementById("email"),
    pass: document.getElementById("pass"),
    confirm: document.getElementById("confirm"),
    recs: document.getElementById("handleRecs"),
    status: document.getElementById("handleStatus"),
    submit: document.getElementById("submitBtn"),
    toggles: document.querySelectorAll(".view-toggle"),
  };

  const state = {
    isHandleTouched: false,
  };

  // Username Availability Check
  const checkHandle = (val) => {
    if (!val || val.length < 2) {
      elements.status.innerHTML = "";
      elements.handle.style.borderColor = "";
      return;
    }

    const isTaken = CONFIG.existingUsers.includes(val.toLowerCase().trim());

    if (isTaken) {
      elements.status.innerHTML =
        '<span class="status-msg text-red-500"><i class="fas fa-times-circle"></i> Already taken</span>';
      elements.handle.style.borderColor = "#ef4444";
    } else {
      elements.status.innerHTML =
        '<span class="status-msg text-green-600"><i class="fas fa-check-circle"></i> Available</span>';
      elements.handle.style.borderColor = "#22c55e";
    }
  };

  // Username Suggestions
  const updateRecs = (name) => {
    if (!name || name.trim().length < 2) {
      elements.recs.innerHTML = "";
      return;
    }

    const clean = name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "");
    const bits = clean.split(/\s+/);
    const year = new Date().getFullYear().toString().slice(-2);

    const raw = [
      bits.join(""),
      bits.length > 1 ? bits.join(".") : bits[0] + "_ai",
      bits.join("") + year,
    ];

    const list = [...new Set(raw)].slice(0, 3);

    elements.recs.innerHTML = `
      <span class="text-[10px] uppercase text-slate-400 font-bold block w-full mb-1">Recommended:</span>
      ${list
        .map((s) => `<div class="chip" data-val="${s}">${s}</div>`)
        .join("")}
    `;
  };

  // Event Listeners

  elements.name.addEventListener("input", (e) =>
    updateRecs(e.target.value)
  );

  elements.handle.addEventListener("input", (e) => {
    state.isHandleTouched = true;
    checkHandle(e.target.value);
  });

  elements.recs.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;

    const val = chip.dataset.val;
    elements.handle.value = val;
    state.isHandleTouched = true;
    checkHandle(val);

    elements.handle.focus();
  });

  // Password Show/Hide
  elements.toggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      const icon = btn.querySelector("i");
      const show = input.type === "password";

      input.type = show ? "text" : "password";
      input.style.letterSpacing = show ? "normal" : "0.15em";
      icon.className = show ? "far fa-eye-slash" : "far fa-eye";
    });
  });

  // Form Submit
  elements.form.addEventListener("submit", (e) => {
    e.preventDefault();

    const isTaken = CONFIG.existingUsers.includes(
      elements.handle.value.toLowerCase().trim()
    );

    if (isTaken) return elements.handle.focus();

    if (elements.pass.value.length < CONFIG.minPassLength) {
      return elements.pass.focus();
    }

    if (elements.pass.value !== elements.confirm.value) {
      elements.confirm.style.borderColor = "#ef4444";
      return elements.confirm.focus();
    }

    // UI Loading
    elements.submit.disabled = true;
    elements.submit.innerHTML =
      '<i class="fas fa-circle-notch fa-spin mr-2"></i> Initializing...';

    setTimeout(() => {
      elements.submit.innerHTML =
        '<i class="fas fa-check mr-2"></i> Account Created';
      elements.submit.style.backgroundColor = "#16a34a";

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    }, 1500);
  });
})();