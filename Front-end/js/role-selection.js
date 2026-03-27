/**
 * role-selection.js
 * Place at: js/role-selection.js
 *
 * Handles role selection UI and persists choice to sessionStorage.
 * No imports needed — no routes called here.
 */

const options = document.querySelectorAll(".role-option");
const continueBtn = document.getElementById("continue-btn");
const roleError = document.getElementById("role-error");

let selectedRole = null;

// ── Highlight selected card ──────────────────────────────────────────────────
options.forEach((opt) => {
  opt.addEventListener("click", () => {
    options.forEach((o) => o.classList.remove("selected"));
    opt.classList.add("selected");
    opt.querySelector("input[type=radio]").checked = true;
    selectedRole = opt.dataset.role;
    roleError.classList.add("hidden");
  });
});

// ── Continue button ──────────────────────────────────────────────────────────
continueBtn.addEventListener("click", () => {
  if (!selectedRole) {
    roleError.classList.remove("hidden");
    return;
  }
  // Persist selection for login.html to read
  sessionStorage.setItem("ct_selected_role", selectedRole);
  window.location.href = "login.html";
});

// ── Keyboard nav ─────────────────────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") continueBtn.click();
});
