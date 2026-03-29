// js/officer-utils.js
// Shared helpers for all officer pages

// ── Auth guard ──────────────────────────────────────────────────────────────
export function getOfficerSession() {
  try {
    const user = JSON.parse(sessionStorage.getItem("ct_user"));
    if (!user || user.role !== "officer") {
      window.location.href = "../role-selection.html";
      return null;
    }
    return user;
  } catch {
    window.location.href = "../role-selection.html";
    return null;
  }
}

// ── Session init UI ──────────────────────────────────────────────────────────
export function initOfficerUI(user) {
  const initials = user.name.charAt(0).toUpperCase();

  const sidebarName   = document.getElementById("sidebar-name");
  const sidebarAvatar = document.getElementById("sidebar-avatar");
  const topbarName    = document.getElementById("topbar-name");
  const topbarAvatar  = document.getElementById("topbar-avatar");

  if (sidebarName)   sidebarName.textContent   = user.name;
  if (sidebarAvatar) sidebarAvatar.textContent  = initials;
  if (topbarName)    topbarName.textContent     = user.name;
  if (topbarAvatar)  topbarAvatar.textContent   = initials;
}

// ── localStorage case helpers ────────────────────────────────────────────────
export function getAllCases() {
  try { return JSON.parse(localStorage.getItem("cases")) || []; }
  catch { return []; }
}

export function saveAllCases(cases) {
  localStorage.setItem("cases", JSON.stringify(cases));
}

export function getCaseById(id) {
  return getAllCases().find(c => c.id === id) || null;
}

export function updateCaseById(id, updates) {
  const cases = getAllCases().map(c =>
    c.id === id ? { ...c, ...updates } : c
  );
  saveAllCases(cases);
}

// ── Officer's cases ──────────────────────────────────────────────────────────
export function getOfficerCases(officerId) {
  return getAllCases().filter(c => c.assignedTo === officerId);
}

// ── Stats counter ────────────────────────────────────────────────────────────
export function calcStats(cases) {
  return {
    assigned:    cases.filter(c => c.status === "Assigned").length,
    inProgress:  cases.filter(c => c.status === "In Progress").length,
    resolved:    cases.filter(c => c.status === "Resolved").length,
    transferred: cases.filter(c => c.status === "Transferred").length,
  };
}

// ── Sidebar badge updater ────────────────────────────────────────────────────
export function updateSidebarBadges(officerId) {
  const cases = getOfficerCases(officerId);
  const sbAssigned = document.getElementById("sb-assigned-count");
  const sbTransfer = document.getElementById("sb-transfer-count");
  const sbClosure  = document.getElementById("sb-closure-count");
  if (sbAssigned) sbAssigned.textContent = cases.filter(c => c.status === "Assigned").length;
  if (sbTransfer) sbTransfer.textContent = cases.filter(c => c.transfer && c.transfer.requested).length;
  if (sbClosure)  sbClosure.textContent  = cases.filter(c => c.closureRequest && c.closureRequest.requested).length;
}

// ── Badge HTML ───────────────────────────────────────────────────────────────
export function statusBadge(status) {
  const map = {
    "Assigned":    "badge-assigned",
    "In Progress": "badge-progress",
    "Resolved":    "badge-resolved",
    "Transferred": "badge-pending",
    "Closed":      "badge-closed",
  };
  return `<span class="badge ${map[status] || 'badge-closed'}">${status}</span>`;
}

export function priorityBadge(priority) {
  const map = {
    "High":   "badge-high",
    "Medium": "badge-medium",
    "Low":    "badge-low",
  };
  const p = priority || "Medium";
  return `<span class="badge ${map[p] || 'badge-medium'}">${p}</span>`;
}

// ── Date formatter ───────────────────────────────────────────────────────────
export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

// ── Logout ───────────────────────────────────────────────────────────────────
window.logout = function () {
  sessionStorage.removeItem("ct_user");
  sessionStorage.removeItem("ct_selected_role");
  window.location.href = "../index.html";
};