// js/officer/officer-account-settings.js
import {
  getOfficerSession,
  initOfficerUI,
  updateSidebarBadges,
} from "./officer-utils.js";

const user = getOfficerSession();
if (!user) throw new Error("No session");

initOfficerUI(user);
updateSidebarBadges(user.id);

// ─── INPUT VALIDATION ────────────────────────────────────────────────────────
const phoneInput = document.getElementById("profile-phone");
phoneInput?.addEventListener("input", function () {
  this.value = this.value.replace(/[^0-9]/g, "");
});

const emailInput = document.getElementById("profile-email");
emailInput?.addEventListener("input", function () {
  this.style.borderColor = this.validity.valid ? "green" : "red";
});

// ─── Storage keys ────────────────────────────────────────────────────────────
const PROFILE_KEY  = `civictrack_officer_profile_${user.id}`;
const NOTIF_KEY    = `civictrack_officer_notifprefs_${user.id}`;
const SESSIONS_KEY = `civictrack_officer_sessions_${user.id}`;

// ─── Tab switching ───────────────────────────────────────────────────────────
document.querySelectorAll(".settings-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".settings-tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".settings-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add("active");
  });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── PROFILE TAB ─────────────────────────────────────────────────────────────
const bioEl = document.getElementById("profile-bio");
const bioCount = document.getElementById("bio-count");
if (bioEl && bioCount) {
  bioEl.addEventListener("input", () => { bioCount.textContent = bioEl.value.length; });
}

const avatarPreview = document.getElementById("avatar-preview");
const avatarFile    = document.getElementById("avatar-file");

function setAvatarDisplay(src, initials) {
  if (src) {
    avatarPreview.style.backgroundImage = `url(${src})`;
    avatarPreview.style.backgroundSize  = "cover";
    avatarPreview.style.backgroundPosition = "center";
    avatarPreview.textContent = "";
  } else {
    avatarPreview.style.backgroundImage = "";
    avatarPreview.textContent = initials || "?";
  }
}

function getInitials() {
  const fn = document.getElementById("profile-firstname")?.value.trim() || "";
  const ln = document.getElementById("profile-lastname")?.value.trim()  || "";
  return ((fn[0] || "") + (ln[0] || "")).toUpperCase() || user.name?.[0]?.toUpperCase() || "?";
}

function syncAvatarEls(src, initials) {
  ["sidebar-avatar", "topbar-avatar", "avatar-preview"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (src) {
      el.style.backgroundImage = `url(${src})`;
      el.style.backgroundSize  = "cover";
      el.style.backgroundPosition = "center";
      el.textContent = "";
    } else {
      el.style.backgroundImage = "";
      el.textContent = initials || "?";
    }
  });
}

avatarFile?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    alert("File must be under 2 MB.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const src = reader.result;
    setAvatarDisplay(src, null);
    const profile = loadStored(PROFILE_KEY);
    profile.avatarSrc = src;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    syncAvatarEls(src, null);
  };
  reader.readAsDataURL(file);
});

document.getElementById("remove-avatar-btn")?.addEventListener("click", () => {
  openConfirm("Remove Photo", "Are you sure you want to remove your profile photo?", () => {
    setAvatarDisplay(null, getInitials());
    const profile = loadStored(PROFILE_KEY);
    delete profile.avatarSrc;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    syncAvatarEls(null, getInitials());
  });
});

// Load profile
function loadProfile() {
  const profile = loadStored(PROFILE_KEY);
  const nameParts = (user.name || "").trim().split(" ");

  document.getElementById("profile-firstname").value  = profile.firstName ?? nameParts[0] ?? "";
  document.getElementById("profile-lastname").value   = profile.lastName  ?? nameParts.slice(1).join(" ");
  document.getElementById("profile-email").value      = profile.email     ?? user.email ?? "";
  document.getElementById("profile-phone").value      = profile.phone     ?? "";
  document.getElementById("profile-badge").value      = user.badgeId ?? user.id ?? "";
  document.getElementById("profile-bio").value        = profile.bio ?? "";
  if (bioCount) bioCount.textContent = (profile.bio ?? "").length;

  if (profile.avatarSrc) {
    setAvatarDisplay(profile.avatarSrc, null);
    syncAvatarEls(profile.avatarSrc, null);
  }
}
loadProfile();

// ─── SAVE PROFILE (VALIDATION ADDED) ─────────────────────────────────────────
document.getElementById("save-profile-btn")?.addEventListener("click", () => {
  const firstName = document.getElementById("profile-firstname").value.trim();
  const lastName  = document.getElementById("profile-lastname").value.trim();

  const emailEl = document.getElementById("profile-email");
  const email   = emailEl.value.trim();

  const phoneEl = document.getElementById("profile-phone");
  const phone   = phoneEl.value.trim();

  const department = document.getElementById("profile-department").value;
  const bio        = document.getElementById("profile-bio").value;

  if (!firstName || !email) {
    showStatus("profile-save-status", "First name and email are required.", true);
    return;
  }

  // 🚨 MAIN FIX
  if (!emailEl.checkValidity()) {
    showStatus("profile-save-status", "Enter a valid email address.", true);
    emailEl.style.borderColor = "red";
    return;
  }

  if (phone && phone.length !== 10) {
    showStatus("profile-save-status", "Phone must be 10 digits.", true);
    phoneEl.style.borderColor = "red";
    return;
  }

  emailEl.style.borderColor = "green";
  phoneEl.style.borderColor = "green";

  const existing = loadStored(PROFILE_KEY);
  const updated  = { ...existing, firstName, lastName, email, phone, department, bio };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));

  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  ["sidebar-name", "topbar-name", "welcome-name"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = fullName;
  });

  if (!updated.avatarSrc) {
    syncAvatarEls(null, ((firstName[0] || "") + (lastName[0] || "")).toUpperCase() || "?");
  }

  showStatus("profile-save-status", "✓ Profile saved successfully.");
});