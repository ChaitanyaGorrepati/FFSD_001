/**
 * login.js
 * Place at: js/login.js
 *
 * Reads role from sessionStorage, validates username against mockData users,
 * stores session in sessionStorage, and routes to the correct dashboard.
 *
 * Import note:
 *   getUsers() is pulled from the existing userModel via a thin helper below.
 *   Do NOT modify userModel.js — the import path below must match your project.
 *
 *   If your entry point is at the root (same level as /models, /routes, /js),
 *   use:  import { getUsers } from "../models/userModel.js";
 *
 *   Adjust the path prefix if js/ is nested differently.
 */

import { getUsers } from "./index.js";

// ── DOM refs ─────────────────────────────────────────────────────────────────
const roleDisplay   = document.getElementById("role-display");
const roleIdDisplay = document.getElementById("role-id-display");
const usernameInput = document.getElementById("username");
const usernameError = document.getElementById("username-error");
const loginBtn      = document.getElementById("login-btn");

// ── Role → dashboard mapping ─────────────────────────────────────────────────
// NEW HELPER — add this block in js/utils.js if you want to centralise routing
const ROLE_ROUTES = {
  citizen:   "./citizen/citizen-dashboard.html",
  officer:   "./officer/officer-dashboard.html",
  supervisor:"./supervisor/supervisor-dashboard.html",
  superuser: "./superuser/superuser-dashboard.html",
};

// ── Read persisted role ───────────────────────────────────────────────────────
const role = sessionStorage.getItem("ct_selected_role");

if (!role) {
  // No role selected — send back to selection
  window.location.href = "role-selection.html";
}

// Pretty-print the role label
const ROLE_LABELS = {
  citizen:   "Citizen",
  officer:   "Officer",
  supervisor:"Supervisor",
  superuser: "Super User",
};

if (roleDisplay) {
  roleDisplay.textContent = ROLE_LABELS[role] || role;
}

// ── Login handler ─────────────────────────────────────────────────────────────
loginBtn.addEventListener("click", handleLogin);
usernameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleLogin();
});

function handleLogin() {
  const username = usernameInput.value.trim();

  // ── Validation ──
  if (!username) {
    showError(usernameInput, usernameError, "Username is required.");
    return;
  }

  clearError(usernameInput, usernameError);

  // ── Match against mockData users ──
  const users = getUsers();

  // Map superuser role label back to mock role value
  const lookupRole = role === "superuser" ? "superuser" : role;

  const matched = users.find(
    (u) =>
      u.name.toLowerCase() === username.toLowerCase() &&
      u.role === lookupRole
  );

  if (!matched) {
    showError(
      usernameInput,
      usernameError,
      `No ${ROLE_LABELS[role]} found with that username. Try: ${getSampleNames(users, lookupRole)}`
    );
    return;
  }

  // ── Persist session ──
  sessionStorage.setItem("ct_user", JSON.stringify(matched));

  // ── Route to dashboard ──
  const target = ROLE_ROUTES[role] || "index.html";
  window.location.href = target;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function showError(input, errorEl, message) {
  input.classList.add("error-input");
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function clearError(input, errorEl) {
  input.classList.remove("error-input");
  errorEl.classList.add("hidden");
}

/**
 * NEW HELPER — getSampleNames
 * Returns a comma-separated list of names for the given role, for hint display.
 * Add this in js/utils.js if reused elsewhere.
 *
 * @param {Array} users
 * @param {string} role
 * @returns {string}
 */
function getSampleNames(users, role) {
  return users
    .filter((u) => u.role === role)
    .map((u) => u.name)
    .join(", ") || "none available";
}
