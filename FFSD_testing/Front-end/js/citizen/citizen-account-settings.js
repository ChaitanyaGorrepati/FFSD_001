// js/citizen/citizen-account-settings.js

// ── 1. Session guard ─────────────────────────────────────────────────────────
const currentUser = JSON.parse(sessionStorage.getItem("ct_user"));

if (!currentUser || currentUser.role !== "citizen") {
  window.location.href = "../../login.html";
}



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
const NOTIF_KEY    = `civictrack_citizen_notifprefs_${currentUser.id}`;
const SESSIONS_KEY = `civictrack_citizen_sessions_${currentUser.id}`;

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

function formatRelative(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Tab switching ─────────────────────────────────────────────────────────────
document.querySelectorAll(".settings-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".settings-tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".settings-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add("active");
  });
});

// ── PROFILE TAB ───────────────────────────────────────────────────────────────

// Bio char counter
const bioEl    = document.getElementById("profile-bio");
const bioCount = document.getElementById("bio-count");
if (bioEl && bioCount) {
  bioEl.addEventListener("input", () => { bioCount.textContent = bioEl.value.length; });
}

// Avatar helpers
const avatarPreview = document.getElementById("avatar-preview");
const avatarFile    = document.getElementById("avatar-file");

function setAvatarDisplay(src, inits) {
  if (src) {
    avatarPreview.style.backgroundImage    = `url(${src})`;
    avatarPreview.style.backgroundSize     = "cover";
    avatarPreview.style.backgroundPosition = "center";
    avatarPreview.textContent = "";
  } else {
    avatarPreview.style.backgroundImage = "";
    avatarPreview.textContent = inits || "?";
  }
}

function getInitials() {
  const fn = document.getElementById("profile-firstname")?.value.trim() || "";
  const ln = document.getElementById("profile-lastname")?.value.trim()  || "";
  return ((fn[0] || "") + (ln[0] || "")).toUpperCase() || currentUser.name?.[0]?.toUpperCase() || "?";
}

function syncAvatarEls(src, inits) {
  ["sidebar-avatar", "topbar-avatar", "avatar-preview"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (src) {
      el.style.backgroundImage    = `url(${src})`;
      el.style.backgroundSize     = "cover";
      el.style.backgroundPosition = "center";
      el.textContent = "";
    } else {
      el.style.backgroundImage = "";
      el.textContent = inits || "?";
    }
  });
}

avatarFile?.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { alert("File must be under 2 MB."); return; }
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
  openConfirm(
    "Remove Photo",
    "Are you sure you want to remove your profile photo?",
    () => {
      setAvatarDisplay(null, getInitials());
      const profile = loadStored(PROFILE_KEY);
      delete profile.avatarSrc;
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      syncAvatarEls(null, getInitials());
    }
  );
});

// Load saved profile into form
function loadProfile() {
  const profile   = loadStored(PROFILE_KEY);
  const nameParts = (currentUser.name || "").trim().split(" ");

  document.getElementById("profile-firstname").value  = profile.firstName ?? (nameParts[0] || "");
  document.getElementById("profile-lastname").value   = profile.lastName  ?? (nameParts.slice(1).join(" ") || "");
  document.getElementById("profile-email").value      = profile.email     ?? (currentUser.email || "");
  document.getElementById("profile-phone").value      = profile.phone     ?? "";
  document.getElementById("profile-address").value    = profile.address   ?? "";
  document.getElementById("profile-citizen-id").value = currentUser.id    ?? "";
  document.getElementById("profile-bio").value        = profile.bio       ?? "";
  if (bioCount) bioCount.textContent = (profile.bio ?? "").length;

  if (profile.avatarSrc) {
    setAvatarDisplay(profile.avatarSrc, null);
    syncAvatarEls(profile.avatarSrc, null);
  }
}
loadProfile();

// Save profile
document.getElementById("save-profile-btn")?.addEventListener("click", () => {
  const firstName = document.getElementById("profile-firstname").value.trim();
  const lastName  = document.getElementById("profile-lastname").value.trim();
  const email     = document.getElementById("profile-email").value.trim();
  const phone     = document.getElementById("profile-phone").value.trim();
  const address   = document.getElementById("profile-address").value.trim();
  const bio       = document.getElementById("profile-bio").value;

  if (!firstName || !email) {
    showStatus("profile-save-status", "First name and email are required.", true);
    return;
  }

  const existing = loadStored(PROFILE_KEY);
  const updated  = { ...existing, firstName, lastName, email, phone, address, bio };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));

  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  ["sidebar-name", "topbar-name"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = fullName;
  });

  if (!updated.avatarSrc) {
    syncAvatarEls(null, ((firstName[0] || "") + (lastName[0] || "")).toUpperCase() || "?");
  }

  showStatus("profile-save-status", "✓ Profile saved successfully.");
});

// ── SECURITY TAB ──────────────────────────────────────────────────────────────

// Toggle password visibility
document.querySelectorAll(".toggle-pw").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    input.type = input.type === "password" ? "text" : "password";
    btn.querySelector(".eye-icon")?.classList.toggle("eye-off", input.type === "text");
  });
});

// Password strength
const newPwEl = document.getElementById("new-password");
newPwEl?.addEventListener("input", () => {
  const val   = newPwEl.value;
  const wrap  = document.getElementById("pw-strength-wrap");
  const fill  = document.getElementById("pw-strength-fill");
  const label = document.getElementById("pw-strength-label");
  if (!wrap) return;

  if (!val) { wrap.style.display = "none"; return; }
  wrap.style.display = "flex";

  let score = 0;
  if (val.length >= 8)  score++;
  if (val.length >= 12) score++;
  if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = [
    { pct: "20%",  color: "#EF4444", text: "Very Weak" },
    { pct: "40%",  color: "#F97316", text: "Weak"      },
    { pct: "60%",  color: "#EAB308", text: "Fair"      },
    { pct: "80%",  color: "#22C55E", text: "Good"      },
    { pct: "100%", color: "#16A34A", text: "Strong"    },
  ];
  const lvl = levels[Math.min(score - 1, 4)] || levels[0];
  fill.style.width      = lvl.pct;
  fill.style.background = lvl.color;
  label.textContent     = lvl.text;
  label.style.color     = lvl.color;
});

// Password match hint
const confirmPwEl = document.getElementById("confirm-password");
confirmPwEl?.addEventListener("input", () => {
  const hint = document.getElementById("pw-match-hint");
  if (!hint) return;
  hint.style.display =
    confirmPwEl.value && confirmPwEl.value !== newPwEl?.value ? "block" : "none";
});

document.getElementById("save-password-btn")?.addEventListener("click", () => {
  const current = document.getElementById("current-password").value;
  const newPw   = document.getElementById("new-password").value;
  const confirm = document.getElementById("confirm-password").value;

  if (!current || !newPw || !confirm) {
    showStatus("security-save-status", "All password fields are required.", true);
    return;
  }
  if (newPw.length < 8) {
    showStatus("security-save-status", "New password must be at least 8 characters.", true);
    return;
  }
  if (newPw !== confirm) {
    showStatus("security-save-status", "Passwords do not match.", true);
    return;
  }

  // Simulate success (replace with real auth API call)
  document.getElementById("current-password").value = "";
  document.getElementById("new-password").value     = "";
  document.getElementById("confirm-password").value = "";
  document.getElementById("pw-strength-wrap").style.display = "none";
  document.getElementById("pw-match-hint").style.display    = "none";
  showStatus("security-save-status", "✓ Password updated successfully.");
});

// Sessions
function renderSessions() {
  const list = document.getElementById("sessions-list");
  if (!list) return;

  const stored   = loadStored(SESSIONS_KEY, null);
  const sessions = stored || [
    { id: "s1", device: "Chrome on Windows", location: "Chennai, TN", lastActive: new Date().toISOString(), current: true },
    { id: "s2", device: "Safari on iPhone",  location: "Chennai, TN", lastActive: new Date(Date.now() - 3600000 * 5).toISOString(), current: false },
  ];

  if (!stored) localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

  list.innerHTML = sessions.map(s => `
    <div class="session-row">
      <div class="session-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><rect x="2" y="3" width="20" height="14" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M8 21h8M12 17v4"/></svg>
      </div>
      <div class="session-info">
        <div class="session-device">
          ${s.device}
          ${s.current ? '<span class="session-current-badge">Current</span>' : ""}
        </div>
        <div class="session-meta">${s.location} · Last active ${formatRelative(s.lastActive)}</div>
      </div>
      ${!s.current ? `<button class="btn btn-ghost btn-xs session-revoke-btn" data-id="${s.id}">Revoke</button>` : ""}
    </div>
  `).join("");

  list.querySelectorAll(".session-revoke-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      openConfirm("Revoke Session", "Are you sure you want to sign out this device?", () => {
        const updated = sessions.filter(s => s.id !== id);
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
        renderSessions();
      });
    });
  });
}
renderSessions();

document.getElementById("revoke-all-btn")?.addEventListener("click", () => {
  openConfirm(
    "Sign Out All Other Devices",
    "This will sign out all sessions except your current one. Continue?",
    () => {
      const sessions = loadStored(SESSIONS_KEY, []);
      const updated  = sessions.filter(s => s.current);
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
      renderSessions();
      showStatus("security-save-status", "✓ All other sessions revoked.");
    }
  );
});

// ── NOTIFICATIONS TAB ─────────────────────────────────────────────────────────

function loadNotifPrefs() {
  const prefs = loadStored(NOTIF_KEY, {
    submitted: true, statusChange: true, resolved: true,
    transfer: false, system: true, weekly: false
  });
  document.getElementById("notif-submitted").checked    = prefs.submitted    ?? true;
  document.getElementById("notif-status-change").checked = prefs.statusChange ?? true;
  document.getElementById("notif-resolved").checked     = prefs.resolved     ?? true;
  document.getElementById("notif-transfer").checked     = prefs.transfer     ?? false;
  document.getElementById("notif-system").checked       = prefs.system       ?? true;
  document.getElementById("notif-weekly").checked       = prefs.weekly       ?? false;
}
loadNotifPrefs();

document.getElementById("save-notif-btn")?.addEventListener("click", () => {
  const prefs = {
    submitted:    document.getElementById("notif-submitted").checked,
    statusChange: document.getElementById("notif-status-change").checked,
    resolved:     document.getElementById("notif-resolved").checked,
    transfer:     document.getElementById("notif-transfer").checked,
    system:       document.getElementById("notif-system").checked,
    weekly:       document.getElementById("notif-weekly").checked,
  };
  localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
  showStatus("notif-save-status", "✓ Preferences saved.");
});

// ── CONFIRM MODAL ─────────────────────────────────────────────────────────────
let _confirmCallback = null;

function openConfirm(title, body, onOk) {
  _confirmCallback = onOk;
  document.getElementById("confirm-modal-title").textContent = title;
  document.getElementById("confirm-modal-body").textContent  = body;
  document.getElementById("confirm-modal").classList.add("active");
}

window.closeConfirmModal = function () {
  document.getElementById("confirm-modal").classList.remove("active");
  _confirmCallback = null;
};

document.getElementById("confirm-modal-ok")?.addEventListener("click", () => {
  if (_confirmCallback) _confirmCallback();
  closeConfirmModal();
});

document.getElementById("confirm-modal")?.addEventListener("click", function (e) {
  if (e.target === this) closeConfirmModal();
});
