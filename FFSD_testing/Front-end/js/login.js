/**
 * login.js — Place at: js/login.js
 * Fixed: citizen login now matches by username field.
 * Officers/Supervisors/Superusers match by name (from mockData, no username field).
 */

import { getUsers } from "./index.js";

// ── DOM refs ──────────────────────────────────────────────────────────────────
const roleDisplay   = document.getElementById("role-display");
const usernameInput = document.getElementById("username");
const usernameError = document.getElementById("username-error");
const loginBtn      = document.getElementById("login-btn");

// ── Role → dashboard mapping ──────────────────────────────────────────────────
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

// ── Read persisted role ───────────────────────────────────────────────────────
const role = sessionStorage.getItem("ct_selected_role");

if (!role) {
  window.location.href = "role-selection.html";
}

if (roleDisplay) {
  roleDisplay.textContent = ROLE_LABELS[role] || role;
}

// ── Inject "Create Account" link for citizens only ───────────────────────────
if (role === "citizen") {
  const authBody = document.querySelector(".auth-body");
  if (authBody && !document.getElementById("create-account-link")) {
    const p = document.createElement("p");
    p.style.cssText = "margin-top:12px; text-align:center; font-size:0.875rem;";
    p.innerHTML = `Don't have an account? <a id="create-account-link" href="create-account.html" style="color:var(--red, #e33); font-weight:600;">Create one</a>`;
    authBody.appendChild(p);
  }
}

// ── Login handler ─────────────────────────────────────────────────────────────
loginBtn.addEventListener("click", handleLogin);
usernameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") handleLogin();
});

function handleLogin() {
  const input = usernameInput.value.trim();

  if (!input) {
    showError("Username is required.");
    return;
  }
  clearError();

  const users = getUsers();

  let matched;

  if (role === "citizen") {
    // Citizens log in with their username field
    matched = users.find(
      u => u.role === "citizen" &&
           (u.username?.toLowerCase() === input.toLowerCase())
    );
  } else {
    // Officers / Supervisors / Superusers log in with their name (mockData has no username)
    const lookupRole = role === "superuser" ? "superuser" : role;
    matched = users.find(
      u => u.role === lookupRole &&
           u.name.toLowerCase() === input.toLowerCase()
    );
  }

  if (!matched) {
    const hint = role === "citizen"
      ? "Check your username or create an account."
      : `No ${ROLE_LABELS[role]} found. Try: ${getSampleNames(users, role)}`;
    showError(hint);
    return;
  }

  // Persist session
  sessionStorage.setItem("ct_user", JSON.stringify(matched));

  // Route to dashboard
  window.location.href = ROLE_ROUTES[role] || "index.html";
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function showError(msg) {
  usernameInput.classList.add("error-input");
  usernameError.textContent = msg;
  usernameError.classList.remove("hidden");
}

function clearError() {
  usernameInput.classList.remove("error-input");
  usernameError.classList.add("hidden");
}

function getSampleNames(users, role) {
  return users
    .filter(u => u.role === role)
    .map(u => u.name)
    .join(", ") || "none available";
}