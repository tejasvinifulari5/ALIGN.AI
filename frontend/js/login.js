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
function loginUser(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim().toLowerCase();
  const password = document.getElementById("passwordField").value;

  // Get registered users from localStorage
  const users = JSON.parse(localStorage.getItem("alignai_users") || "{}");

  // Validate credentials
  if (!users[username]) {
    showError("Username not found. Please register first.");
    return;
  }

  if (users[username].password !== password) {
    showError("Incorrect password. Please try again.");
    return;
  }

  // ✅ Login success — save session
  localStorage.setItem("alignai_current_user", JSON.stringify({
    username: username,
    name: users[username].name,
    email: users[username].email
  }));

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Logging in...';

  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 800);
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