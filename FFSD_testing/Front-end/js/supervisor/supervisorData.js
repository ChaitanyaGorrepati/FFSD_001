// js/supervisor/supervisorData.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for all supervisor pages.
// Reads the shared "cases" localStorage key written by citizen/officer flows.
// NO predefined mock cases – everything comes from actual citizen submissions.
// ─────────────────────────────────────────────────────────────────────────────

import { getCurrentUser } from "../utils.js";
import { users }          from "../../data/mockData.js";

// ── Auth ──────────────────────────────────────────────────────────────────────
export function getLoggedInSupervisor() {
  try {
    return JSON.parse(sessionStorage.getItem("ct_user")) || null;
  } catch {
    return null;
  }
}

// ── User helpers ──────────────────────────────────────────────────────────────
export function getUsers() { return users; }

/**
 * Resolve an officer's stored id (e.g. "off1") → display name ("Rashid").
 * If `assignedTo` is already a name string (legacy), returns it as-is.
 */
export function resolveOfficerName(assignedTo) {
  if (!assignedTo) return null;
  const u = users.find(u => u.id === assignedTo);
  return u ? u.name : assignedTo;
}

/** Return the officer object (id, name, zone, department) for a given officer id */
export function resolveOfficer(assignedTo) {
  if (!assignedTo) return null;
  return users.find(u => u.id === assignedTo) || null;
}

// ── Raw case store ────────────────────────────────────────────────────────────
function getAllCasesRaw() {
  try {
    return JSON.parse(localStorage.getItem("cases") || "[]");
  } catch {
    return [];
  }
}

function saveAllCases(cases) {
  localStorage.setItem("cases", JSON.stringify(cases));
}

// ── Cases for this supervisor ─────────────────────────────────────────────────
/**
 * Returns cases belonging to the logged-in supervisor's department, all zones.
 * A case is visible to the supervisor once its status moves past "Submitted"
 * (i.e. once an officer has been auto-assigned, which sets it to "Assigned").
 * Supervisor sees the case from "Assigned" onward.
 *
 * Also normalises the `citizen` field so that legacy cases stored with
 * `submittedName` (before the caseController fix) still display correctly.
 */
export function getCases() {
  const supervisor = getLoggedInSupervisor();
  if (!supervisor || supervisor.role !== "supervisor") return [];

  return getAllCasesRaw()
    .filter(c =>
      c.department === supervisor.department &&
      c.status !== "Submitted"
    )
    .map(normaliseCitizen);  // ← ensure `citizen` is always populated
}

export function updateCase(id, updates) {
  const cases = getAllCasesRaw().map(c =>
    c.id === id ? { ...c, ...updates } : c
  );
  saveAllCases(cases);
}

/**
 * Ensures `c.citizen` is always set, falling back to `submittedName` for
 * cases submitted before the caseController fix was deployed.
 */
function normaliseCitizen(c) {
  if (!c.citizen && c.submittedName) {
    return { ...c, citizen: c.submittedName };
  }
  return c;
}

/** Lookup by id across ALL cases (not just supervisor's dept) so links always work */
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

// ── Officer workload ──────────────────────────────────────────────────────────
/**
 * For each officer in this supervisor's department (all 4 zones),
 * count active cases (Assigned + Accepted + In Progress).
 */
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
           ["Assigned", "Accepted", "In Progress"].includes(c.status)
    ).length;
    return { id: officer.id, name: officer.name, zone: officer.zone, assigned, max: 10 };
  });
}

// ── Weekly case counts (real data, last 7 days) ───────────────────────────────
export function getWeeklyCaseCounts() {
  const supervisor = getLoggedInSupervisor();
  const allCases   = getAllCasesRaw();
  const deptCases  = supervisor
    ? allCases.filter(c => c.department === supervisor.department)
    : allCases;

  const counts = [];
  for (let i = 6; i >= 0; i--) {
    const d   = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    counts.push(deptCases.filter(c => (c.createdAt || "").startsWith(iso)).length);
  }
  return counts;
}

// ── Badge / format helpers ────────────────────────────────────────────────────
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
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}