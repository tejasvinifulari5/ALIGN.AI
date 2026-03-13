// Select elements
const loginForm = document.getElementById("loginForm");
const passwordInput = document.getElementById("passwordField");
const toggleBtn = document.getElementById("toggleBtn");
const toggleIcon = document.getElementById("toggleIcon");
const submitBtn = document.getElementById("submitBtn");

// Toggle Password Visibility
toggleBtn.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";

  // Change input type
  passwordInput.type = isPassword ? "text" : "password";

  // Adjust letter spacing
  passwordInput.style.letterSpacing = isPassword ? "normal" : "0.15em";

  // Change icon
  toggleIcon.classList.toggle("fa-eye");
  toggleIcon.classList.toggle("fa-eye-slash");
});

// Login Form Submission
function loginUser(event) {
  event.preventDefault();

  submitBtn.disabled = true;

  submitBtn.innerHTML =
    '<i class="fas fa-circle-notch fa-spin mr-2"></i> Authenticating...';

  // Fake authentication delay
  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 800);
}