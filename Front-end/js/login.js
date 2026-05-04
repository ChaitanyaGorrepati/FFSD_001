// js/login.js
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
if (!role) window.location.href = "role-selection.html";

if (roleDisplay) roleDisplay.textContent = ROLE_LABELS[role] || role;

// ── Citizen: switch input to phone number mode ────────────────────────────────
if (role === "citizen") {
  const label = document.querySelector("label[for='username']");
  if (label) label.textContent = "Phone Number";

  if (usernameInput) {
    usernameInput.placeholder = "Enter your 10-digit phone number";
    usernameInput.type        = "tel";
    usernameInput.maxLength   = 10;
    usernameInput.addEventListener("input", () => {
      usernameInput.value = usernameInput.value.replace(/\D/g, "").slice(0, 10);
    });
  }

  // Create Account link
  const authBody = document.querySelector(".auth-body");
  if (authBody && !document.getElementById("create-account-link")) {
    const p = document.createElement("p");
    p.style.cssText = "margin-top:12px;text-align:center;font-size:0.875rem;";
    p.innerHTML = "Don't have an account? <a id='create-account-link' href='create-account.html' style='color:var(--red,#e33);font-weight:600;'>Create one</a>";
    authBody.appendChild(p);
  }
}

// ── Event listeners ───────────────────────────────────────────────────────────
loginBtn.addEventListener("click", handleLogin);
usernameInput.addEventListener("keydown", e => { if (e.key === "Enter") passwordInput.focus(); });
passwordInput.addEventListener("keydown", e => { if (e.key === "Enter") handleLogin(); });

function handleLogin() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  clearErrors();

  // Citizen validates phone format; others just check not empty
  if (role === "citizen") {
    if (!username) { showUsernameError("Phone number is required."); return; }
    if (!/^\d{10}$/.test(username)) { showUsernameError("Enter a valid 10-digit phone number."); return; }
  } else {
    if (!username) { showUsernameError("Name is required."); return; }
  }

  if (!password) { showPasswordError("Password is required."); return; }

  const result = validateUserLogin(username, password, role);

  if (!result.success) {
    if (result.error.toLowerCase().includes("password")) {
      showPasswordError(result.error);
    } else {
      showUsernameError(role === "citizen"
        ? "No account found with this phone number."
        : result.error
      );
    }
    return;
  }

  sessionStorage.setItem("ct_user", JSON.stringify(result.user));
  sessionStorage.setItem("ct_user_id", result.user.id);
  window.location.href = ROLE_ROUTES[role] || "index.html";
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