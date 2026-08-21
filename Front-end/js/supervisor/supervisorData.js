// js/supervisor/supervisorData.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for all supervisor pages.
// NO predefined mock cases – everything comes from actual citizen submissions.
// ─────────────────────────────────────────────────────────────────────────────

import { users } from "../../data/mockData.js";

// ── Auth ──────────────────────────────────────────────────────────────────────
export function getLoggedInSupervisor() {
  try {
    return JSON.parse(sessionStorage.getItem("ct_user")) || null;
  } catch { return null; }
}

// ── User helpers ──────────────────────────────────────────────────────────────
export function getUsers() { return users; }

export function resolveOfficerName(assignedTo) {
  if (!assignedTo) return null;
  const u = users.find(u => u.id === assignedTo);
  return u ? u.name : assignedTo;
}

export function resolveOfficer(assignedTo) {
  if (!assignedTo) return null;
  return users.find(u => u.id === assignedTo) || null;
}

// ── Raw case store ────────────────────────────────────────────────────────────
function getAllCasesRaw() {
  try { return JSON.parse(localStorage.getItem("cases") || "[]"); }
  catch { return []; }
}

function saveAllCases(cases) {
  localStorage.setItem("cases", JSON.stringify(cases));
}

// ── Normalise citizen name (legacy fallback) ──────────────────────────────────
function normaliseCitizen(c) {
  if (!c.citizen && c.submittedName) return { ...c, citizen: c.submittedName };
  return c;
}

// ── Cases for this supervisor's OWN department ────────────────────────────────
/**
 * Returns all cases where c.department === supervisor.department
 * AND status !== "Submitted" (case must have been auto-assigned at minimum).
 * NOTE: after a transfer is ACCEPTED by the destination, c.department changes
 * to the destination dept — so the case leaves this supervisor's list naturally.
 */
export function getCases() {
  const supervisor = getLoggedInSupervisor();
  if (!supervisor || supervisor.role !== "supervisor") return [];
  return getAllCasesRaw()
    .filter(c => c.department === supervisor.department && c.status !== "Submitted")
    .map(normaliseCitizen);
}

export function updateCase(id, updates) {
  const cases = getAllCasesRaw().map(c =>
    c.id === id ? { ...c, ...updates } : c
  );
  saveAllCases(cases);
}

export function getCaseById(id) {
  const c = getAllCasesRaw().find(c => c.id === id) || null;
  return c ? normaliseCitizen(c) : null;
}

export function addNoteToCase(id, note) {
  const cases = getAllCasesRaw();
  const c = cases.find(x => x.id === id);
  if (c) {
    c.notes = c.notes || [];
    c.notes.push(note);
    saveAllCases(cases);
  }
}

// ── Activity log ──────────────────────────────────────────────────────────────
export function appendActivity(id, entry) {
  const cases = getAllCasesRaw();
  const c = cases.find(x => x.id === id);
  if (c) {
    c.activity = c.activity || [];
    c.activity.push({ ...entry, time: entry.time || new Date().toISOString() });
    saveAllCases(cases);
  }
}

// ── Notification store ────────────────────────────────────────────────────────
export function pushNotification(toUserId, message, caseId) {
  try {
    const raw  = localStorage.getItem("notifications") || "[]";
    const list = JSON.parse(raw);
    list.push({
      id:     Date.now(),
      to:     toUserId,
      message,
      caseId: caseId || null,
      time:   new Date().toISOString(),
      read:   false
    });
    localStorage.setItem("notifications", JSON.stringify(list));
  } catch { /* silent */ }
}

/**
 * Returns all notifications addressed to a specific user id, newest first.
 * Used by supervisor pages to populate the bell dropdown.
 */
export function getNotificationsFor(userId) {
  try {
    const all = JSON.parse(localStorage.getItem("notifications") || "[]");
    return all
      .filter(n => n.to === userId)
      .sort((a, b) => new Date(b.time) - new Date(a.time));
  } catch { return []; }
}

/**
 * Returns count of unread notifications for a user.
 */
export function getUnreadCount(userId) {
  try {
    const all = JSON.parse(localStorage.getItem("notifications") || "[]");
    return all.filter(n => n.to === userId && !n.read).length;
  } catch { return 0; }
}

/**
 * Marks all notifications for a user as read.
 */
export function markAllRead(userId) {
  try {
    const all = JSON.parse(localStorage.getItem("notifications") || "[]");
    const updated = all.map(n => n.to === userId ? { ...n, read: true } : n);
    localStorage.setItem("notifications", JSON.stringify(updated));
  } catch { /* silent */ }
}

// ── Transfer filtering ────────────────────────────────────────────────────────

/**
 * OUTGOING transfers — cases where an officer of THIS supervisor's department
 * has requested a transfer OUT to another department.
 *
 * KEY FIX: The officer only writes:
 *   { requested: true, toDept, reason, notes, status: "pending", requestedBy, requestedAt }
 * The field "originDept" is NEVER set by the officer.
 *
 * So we match on c.department === supervisor.department (the case still belongs
 * to this dept until the destination accepts), AND transfer.requested is true,
 * AND the supervisor hasn't decided yet (supervisorStatus absent or "pending").
 *
 * Supervisor sees these in "Transfer Requests" to approve or reject.
 */
export function getOutgoingTransferRequests() {
  const supervisor = getLoggedInSupervisor();
  if (!supervisor) return [];
  return getAllCasesRaw()
    .filter(c =>
      c.department === supervisor.department &&          // case belongs to THIS dept
      c.transfer?.requested === true &&
      c.transfer?.toDept &&                             // a destination was specified
      c.transfer?.toDept !== supervisor.department &&   // must be a different dept
      (!c.transfer.supervisorStatus ||
        c.transfer.supervisorStatus === "pending")      // supervisor hasn't acted yet
    )
    .map(normaliseCitizen);
}

/**
 * INCOMING transfers — cases routed TO this supervisor's department from another.
 *
 * Condition: transfer.toDept === supervisor.department (destination is here)
 * AND the origin supervisor has approved (supervisorStatus === "approved")
 * AND this destination supervisor hasn't acted yet (destinationStatus absent or "pending").
 *
 * Supervisor sees these in "Accept Transfers" to assign to one of their officers.
 */
export function getIncomingTransferRequests() {
  const supervisor = getLoggedInSupervisor();
  if (!supervisor) return [];
  return getAllCasesRaw()
    .filter(c =>
      c.transfer?.requested === true &&
      c.transfer?.toDept === supervisor.department &&   // this dept is the destination
      c.transfer?.supervisorStatus === "approved" &&    // origin supervisor approved it
      (!c.transfer.destinationStatus ||
        c.transfer.destinationStatus === "pending")     // destination hasn't acted yet
    )
    .map(normaliseCitizen);
}

// ── Officer workload ──────────────────────────────────────────────────────────
export function getOfficersWorkload() {
  const supervisor = getLoggedInSupervisor();
  if (!supervisor) return [];
  const deptOfficers = users.filter(
    u => u.role === "officer" && u.department === supervisor.department
  );
  const allCases = getAllCasesRaw();
  return deptOfficers.map(officer => {
    const assigned = allCases.filter(
      c => c.assignedTo === officer.id &&
           ["Assigned","Accepted","In Progress"].includes(c.status)
    ).length;
    return { id: officer.id, name: officer.name, zone: officer.zone, assigned, max: 10 };
  });
}

// ── Weekly counts ─────────────────────────────────────────────────────────────
export function getWeeklyCaseCounts() {
  const supervisor = getLoggedInSupervisor();
  const allCases   = getAllCasesRaw();
  const deptCases  = supervisor
    ? allCases.filter(c => c.department === supervisor.department)
    : allCases;
  const counts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    counts.push(deptCases.filter(c => (c.createdAt || "").startsWith(iso)).length);
  }
  return counts;
}

// ── Badge helpers ─────────────────────────────────────────────────────────────
export function priorityBadge(p) {
  if (!p) return '<span class="priority-badge priority-low">—</span>';
  const cls = p === "High" ? "priority-high" : p === "Medium" ? "priority-medium" : "priority-low";
  return `<span class="priority-badge ${cls}">${p}</span>`;
}

export function statusBadge(s) {
  const map = {
    "Assigned":            "badge-blue",
    "Accepted":            "badge-green",
    "In Progress":         "badge-yellow",
    "Resolved":            "badge-green",
    "Closed":              "badge-gray",
    "Submitted":           "badge-gray",
    "Transferred":         "badge-purple",
    "Pending":             "badge-orange",
    "Rejected":            "badge-red",
    "Waiting For Citizen": "badge-orange",
  };
  return `<span class="badge ${map[s] || "badge-gray"}">${s}</span>`;
}

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
}