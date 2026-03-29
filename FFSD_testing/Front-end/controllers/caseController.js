import { addCase, getCases, updateCase } from "../models/caseModel.js";
import { getOfficers } from "../models/userModel.js";

// ── AUTO ASSIGNMENT ───────────────────────────────────────────────────────────
function assignOfficer(department, zone) {
  const officers = getOfficers();
  return officers.find(
    o => o.department === department && o.zone === zone
  );
}

// ── CREATE CASE ───────────────────────────────────────────────────────────────
export function handleAddCase(data) {
  if (!data.title || !data.department || !data.zone) {
    return { error: "Missing required fields" };
  }

  const officer = assignOfficer(data.department, data.zone);

  // ── FIX 1: normalise citizen name ─────────────────────────────────────────
  // citizen-submit-complaint.js sends `submittedName` and `submittedBy`.
  // Every other part of the app (supervisor views, case-details) reads `c.citizen`.
  // Map it here so the field is always populated consistently.
  const citizenName = data.submittedName || data.citizen || "Unknown Citizen";

  const newCase = {
    id: "CIV-" + Date.now(),
    ...data,                       // spread all form fields (title, description, location …)
    citizen:    citizenName,       // ← always set `citizen` explicitly (overrides spread)
    status:     "Assigned",
    assignedTo: officer ? officer.id : null,
    transfer: {
      requested: false,
      toDept:    null,
      status:    null
    },
    notes:     [],
    createdAt: new Date().toISOString()
  };

  addCase(newCase);
  return { success: true };
}

// ── READ ALL ──────────────────────────────────────────────────────────────────
export function handleGetCases() {
  return getCases();
}

// ── UPDATE STATUS ─────────────────────────────────────────────────────────────
export function handleUpdateStatus(id, status) {
  updateCase(id, { status });
  return { success: true };
}

// ── ADD NOTE ──────────────────────────────────────────────────────────────────
export function handleAddNote(id, note) {
  const cases  = getCases();
  const target = cases.find(c => c.id === id);
  if (target) {
    target.notes.push(note);
    updateCase(id, { notes: target.notes });
  }
  return { success: true };
}

// ── TRANSFER REQUEST ──────────────────────────────────────────────────────────
export function handleTransferRequest(id, toDept) {
  updateCase(id, {
    transfer: {
      requested: true,
      toDept,
      status: "pending"
    }
  });
  return { success: true };
}

// ── GET CASES FOR SUPERVISOR ──────────────────────────────────────────────────
// Supervisor sees a case once its status moves past the raw "Assigned" state.
// "Assigned" is now included so supervisors can see freshly auto-assigned cases
// (officer hasn't explicitly accepted yet but the case is already routed).
export function handleGetCasesForSupervisor(department) {
  const cases = getCases();
  return cases.filter(c =>
    c.department === department &&
    [
      "Assigned",              // ← included: auto-assigned, visible to supervisor
      "Accepted",
      "In Progress",
      "Waiting For Citizen",
      "Resolved",
      "Closed",
      "Transferred",
      "Rejected"
    ].includes(c.status)
  );
}