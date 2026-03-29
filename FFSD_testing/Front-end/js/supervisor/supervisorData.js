// js/supervisor/supervisorData.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for all supervisor pages.
// NO predefined mock cases – everything comes from actual citizen submissions.
// ─────────────────────────────────────────────────────────────────────────────

import { getCurrentUser } from "../utils.js";
import { users }          from "../../data/mockData.js";

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

// ── Activity log helpers ──────────────────────────────────────────────────────
/**
 * Appends one entry to c.activity[] and saves to localStorage.
 * type: "submitted" | "assigned" | "accepted" | "rejected" | "status" |
 *       "transfer" | "note" | "resolved" | "closed" | "supervisor_closed" |
 *       "supervisor_rejected" | "reassigned"
 */
export function appendActivity(id, entry) {
  const cases = getAllCasesRaw();
  const c = cases.find(x => x.id === id);
  if (c) {
    c.activity = c.activity || [];
    c.activity.push({ ...entry, time: entry.time || new Date().toISOString() });
    saveAllCases(cases);
  }
}

// ── Notification store (shared localStorage key "notifications") ───────────────
/**
 * Push a notification to an officer (or supervisor) by their user id.
 * Officers read this on page load to populate the bell badge.
 */
export function pushNotification(toUserId, message, caseId) {
  try {
    const raw  = localStorage.getItem("notifications") || "[]";
    const list = JSON.parse(raw);
    list.push({
      id:      Date.now(),
      to:      toUserId,
      message,
      caseId:  caseId || null,
      time:    new Date().toISOString(),
      read:    false
    });
    localStorage.setItem("notifications", JSON.stringify(list));
  } catch { /* silent */ }
}

// ── Transfer-request filtering ────────────────────────────────────────────────
/**
 * Cases where the OFFICER of this department requested an outgoing transfer.
 * These appear in supervisor's "Transfer Requests" page (not Accept Transfers).
 * Condition: transfer.requested=true, transfer.originDept === supervisor.department,
 * transfer.supervisorStatus is not yet set (pending supervisor decision).
 */
export function getOutgoingTransferRequests() {
  const supervisor = getLoggedInSupervisor();
  if (!supervisor) return [];
  return getAllCasesRaw()
    .filter(c =>
      c.department === supervisor.department &&
      c.transfer?.requested === true &&
      c.transfer?.originDept === supervisor.department &&
      (!c.transfer.supervisorStatus || c.transfer.supervisorStatus === "pending")
    )
    .map(normaliseCitizen);
}

/**
 * Cases incoming to this supervisor's department FROM another department.
 * These appear in "Accept Transfers".
 * Condition: transfer.toDept === supervisor.department AND
 * supervisor approved it (supervisorStatus="approved") but
 * destination hasn't acted yet (destinationStatus is not set or pending).
 */
export function getIncomingTransferRequests() {
  const supervisor = getLoggedInSupervisor();
  if (!supervisor) return [];
  return getAllCasesRaw()
    .filter(c =>
      c.transfer?.requested === true &&
      c.transfer?.toDept === supervisor.department &&
      c.transfer?.supervisorStatus === "approved" &&      // origin supervisor approved
      (!c.transfer.destinationStatus || c.transfer.destinationStatus === "pending")
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