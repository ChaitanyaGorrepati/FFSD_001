// js/citizen/citizen-account-settings.js

// ── 1. Session guard ─────────────────────────────────────────────────────────
const currentUser = JSON.parse(sessionStorage.getItem("ct_user"));

if (!currentUser || currentUser.role !== "citizen") {
  window.location.href = "../../login.html";
}

// ── INPUT VALIDATIONS ────────────────────────────────────────────────────────
const phoneInput = document.getElementById("profile-phone");
phoneInput?.addEventListener("input", function () {
  this.value = this.value.replace(/[^0-9]/g, "");
});

const emailInput = document.getElementById("profile-email");
emailInput?.addEventListener("input", function () {
  this.style.borderColor = this.validity.valid ? "green" : "red";
});

// ── 2. Populate sidebar / topbar identity ────────────────────────────────────
const initials = currentUser.name
  .split(" ")
  .map(w => w[0])
  .join("")
  .slice(0, 2)
  .toUpperCase();

document.getElementById("sidebar-name").textContent = currentUser.name;
document.getElementById("topbar-name").textContent  = currentUser.name;

["sidebar-avatar", "topbar-avatar"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.textContent = initials;
});

// ── 3. Logout ─────────────────────────────────────────────────────────────────
document.getElementById("logout-btn").addEventListener("click", (e) => {
  e.preventDefault();
  sessionStorage.removeItem("ct_user");
  sessionStorage.removeItem("ct_selected_role");
  window.location.href = "../login.html";
});

// ── Storage keys ─────────────────────────────────────────────────────────────
const PROFILE_KEY  = `civictrack_citizen_profile_${currentUser.id}`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function showStatus(elId, message, isError = false) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = message;
  el.className = "save-status " + (isError ? "save-status-error" : "save-status-ok");
  el.style.opacity = "1";
  setTimeout(() => { el.style.opacity = "0"; }, 3000);
}

function loadStored(key, fallback = {}) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}

// ── PROFILE TAB ───────────────────────────────────────────────────────────────

// Load saved profile
function loadProfile() {
  const profile   = loadStored(PROFILE_KEY);
  const nameParts = (currentUser.name || "").split(" ");

  document.getElementById("profile-firstname").value = profile.firstName ?? nameParts[0] ?? "";
  document.getElementById("profile-lastname").value  = profile.lastName  ?? nameParts.slice(1).join(" ");
  document.getElementById("profile-email").value     = profile.email     ?? currentUser.email ?? "";
  document.getElementById("profile-phone").value     = profile.phone     ?? "";
}
loadProfile();

// ── SAVE PROFILE (UPDATED VALIDATION) ─────────────────────────────────────────
document.getElementById("save-profile-btn")?.addEventListener("click", () => {
  const firstName = document.getElementById("profile-firstname").value.trim();
  const lastName  = document.getElementById("profile-lastname").value.trim();

  const emailEl = document.getElementById("profile-email");
  const email   = emailEl.value.trim();

  const phoneEl = document.getElementById("profile-phone");
  const phone   = phoneEl.value.trim();

  // ✅ Required validation
  if (!firstName || !email) {
    showStatus("profile-save-status", "First name and email are required.", true);
    return;
  }

  // ✅ Email validation (MAIN FIX)
  if (!emailEl.checkValidity()) {
    showStatus("profile-save-status", "Enter a valid email address.", true);
    emailEl.style.borderColor = "red";
    return; // 🚨 stops saving
  }

  // ✅ Phone validation (optional but good)
  if (phone && phone.length !== 10) {
    showStatus("profile-save-status", "Phone must be 10 digits.", true);
    phoneEl.style.borderColor = "red";
    return;
  }

  // Reset borders
  emailEl.style.borderColor = "green";
  phoneEl.style.borderColor = "green";

  // Save data
  const existing = loadStored(PROFILE_KEY);
  const updated  = { ...existing, firstName, lastName, email, phone };

  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));

  // Update UI
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  document.getElementById("sidebar-name").textContent = fullName;
  document.getElementById("topbar-name").textContent  = fullName;

  showStatus("profile-save-status", "✓ Profile saved successfully.");
});