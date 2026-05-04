/**
 * utils.js
 * Place at: js/utils.js
 *
 * ✔  Small, pure helper functions only.
 * ✔  Does NOT import or modify any model / controller / route.
 *
 * Import in any view JS with:
 *   import { getCurrentUser, getRoleRoute, getSampleNames } from "./utils.js";
 */

// ── Session helpers ───────────────────────────────────────────────────────────

/**
 * Returns the currently logged-in user object from sessionStorage, or null.
 * @returns {Object|null}
 */
export function getCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem("ct_user")) || null;
  } catch {
    return null;
  }
}

/**
 * Clears the session (logout).
 */
export function logout() {
  sessionStorage.removeItem("ct_user");
  sessionStorage.removeItem("ct_selected_role");
  window.location.href = "index.html";
}

// ── Routing ───────────────────────────────────────────────────────────────────

const ROLE_ROUTES = {
  citizen:   "views/citizen/citizen-dashboard.html",
  officer:   "views/officer/officer-dashboard.html",
  supervisor:"views/supervisor/supervisor-dashboard.html",
  superuser: "views/superuser/superuser-dashboard.html",
};

/**
 * Returns the dashboard URL for a given role string.
 * @param {string} role
 * @returns {string}
 */
export function getRoleRoute(role) {
  return ROLE_ROUTES[role] || "index.html";
}

// ── User helpers ──────────────────────────────────────────────────────────────

/**
 * Returns comma-separated names of users with a specific role.
 * Useful for login hints.
 * @param {Array} users   — from getUsers()
 * @param {string} role
 * @returns {string}
 */
export function getSampleNames(users, role) {
  return (
    users
      .filter((u) => u.role === role)
      .map((u) => u.name)
      .join(", ") || "none available"
  );
}

// ── Form helpers ──────────────────────────────────────────────────────────────

/**
 * Shows an inline validation error on an input + its error element.
 */
export function showError(input, errorEl, message) {
  input.classList.add("error-input");
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

/**
 * Clears an inline validation error.
 */
export function clearError(input, errorEl) {
  input.classList.remove("error-input");
  errorEl.classList.add("hidden");
}

// ── Date helpers ──────────────────────────────────────────────────────────────

/**
 * Formats an ISO date string to "DD MMM YYYY".
 * @param {string} iso
 * @returns {string}
 */
export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Returns a status badge CSS class based on case status string.
 * @param {string} status
 * @returns {string}
 */
export function statusClass(status) {
  const map = {
    Assigned:   "badge-blue",
    "In Progress": "badge-yellow",
    Resolved:   "badge-green",
    Closed:     "badge-gray",
    Pending:    "badge-orange",
  };
  return map[status] || "badge-gray";
}
