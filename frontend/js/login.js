const loginForm   = document.getElementById("loginForm");
const passwordInput = document.getElementById("passwordField");
const toggleBtn   = document.getElementById("toggleBtn");
const toggleIcon  = document.getElementById("toggleIcon");
const submitBtn   = document.getElementById("submitBtn");

// ✅ Toggle Password Visibility
toggleBtn.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  passwordInput.style.letterSpacing = isPassword ? "normal" : "0.15em";
  toggleIcon.classList.toggle("fa-eye");
  toggleIcon.classList.toggle("fa-eye-slash");
});

// ✅ Login Form Submission
async function loginUser(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim().toLowerCase();
  const password = document.getElementById("passwordField").value;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Logging in...';

  try {
    const res = await fetch("http://127.0.0.1:5500/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();

    if (!data.success) {
      showError(data.message || "Invalid credentials");
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i> Login';
      return;
    }

    // ✅ Login success — save session
    localStorage.setItem("alignai_current_user", JSON.stringify(data.user));

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 500);

  } catch (error) {
    showError("Could not connect to server.");
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i> Login';
  }
}

function showError(msg) {
  // Remove old error if any
  const old = document.getElementById("loginError");
  if (old) old.remove();

  const err = document.createElement("p");
  err.id = "loginError";
  err.style.cssText = "color:#ef4444; font-size:0.85rem; margin-top:0.5rem; text-align:center;";
  err.innerHTML = `<i class="fas fa-exclamation-circle mr-1"></i>${msg}`;
  document.getElementById("loginForm").appendChild(err);
}