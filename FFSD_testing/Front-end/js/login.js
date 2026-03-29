// js/login.js - FIXED VERSION (Direct import from userModel)

import { validateUserLogin } from "../models/userModel.js";

const roleDisplay   = document.getElementById("role-display");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const usernameError = document.getElementById("username-error");
const passwordError = document.getElementById("password-error");
const loginBtn      = document.getElementById("login-btn");

const ROLE_ROUTES = {
  citizen:    "./citizen/citizen-dashboard.html",
  officer:    "./officer/officer-dashboard.html",
  supervisor: "./supervisor/supervisor-dashboard.html",
  superuser:  "./superuser/superuser-dashboard.html",
};

const ROLE_LABELS = {
  citizen:    "Citizen",
  officer:    "Officer",
  supervisor: "Supervisor",
  superuser:  "Super User",
};

const role = sessionStorage.getItem("ct_selected_role");

if (!role) {
  window.location.href = "role-selection.html";
}

if (roleDisplay) {
  roleDisplay.textContent = ROLE_LABELS[role] || role;
}

// Show "Create Account" link for citizens only
if (role === "citizen") {
  const authBody = document.querySelector(".auth-body");
  if (authBody && !document.getElementById("create-account-link")) {
    const p = document.createElement("p");
    p.style.cssText = "margin-top:12px; text-align:center; font-size:0.875rem;";
    p.innerHTML = `Don't have an account? <a id="create-account-link" href="create-account.html" style="color:var(--red, #e33); font-weight:600;">Create one</a>`;
    authBody.appendChild(p);
  }
}

// Event listeners
loginBtn.addEventListener("click", handleLogin);
usernameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") passwordInput.focus();
});
passwordInput.addEventListener("keydown", e => {
  if (e.key === "Enter") handleLogin();
});

function handleLogin() {
  console.log("Login button clicked"); // Debug log
  
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username) {
    showUsernameError("Username/Name is required.");
    return;
  }

  if (!password) {
    showPasswordError("Password is required.");
    return;
  }

  clearErrors();

  console.log("Validating:", { username, password, role }); // Debug log

  const result = validateUserLogin(username, password, role);

  console.log("Validation result:", result); // Debug log

  if (!result.success) {
    if (result.error.includes("No ") || result.error.includes("not found")) {
      showUsernameError(result.error);
    } else if (result.error.includes("password")) {
      showPasswordError(result.error);
    } else {
      showPasswordError(result.error);
    }
    return;
  }

  // Success - save session and redirect
  console.log("Login successful, redirecting..."); // Debug log
  sessionStorage.setItem("ct_user", JSON.stringify(result.user));
  sessionStorage.setItem("ct_user_id", result.user.id);

  const target = ROLE_ROUTES[role] || "index.html";
  console.log("Redirecting to:", target); // Debug log
  window.location.href = target;
}

function showUsernameError(msg) {
  usernameInput.classList.add("error-input");
  usernameError.textContent = msg;
  usernameError.classList.remove("hidden");
}

function showPasswordError(msg) {
  passwordInput.classList.add("error-input");
  passwordError.textContent = msg;
  passwordError.classList.remove("hidden");
}

function clearErrors() {
  usernameInput.classList.remove("error-input");
  passwordInput.classList.remove("error-input");
  usernameError.classList.add("hidden");
  passwordError.classList.add("hidden");
}