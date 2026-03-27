import { addCase, getCases, updateCase } from "../models/caseModel.js";
import { getOfficers } from "../models/userModel.js";

// 🔥 AUTO ASSIGNMENT
function assignOfficer(department, zone) {
  const officers = getOfficers();

  return officers.find(
    o => o.department === department && o.zone === zone
  );
}

// CREATE CASE
export function handleAddCase(data) {
  if (!data.title || !data.department || !data.zone) {
    return { error: "Missing required fields" };
  }

  const officer = assignOfficer(data.department, data.zone);

  const newCase = {
    id: "CIV-" + Date.now(),
    ...data,
    status: "Assigned",
    assignedTo: officer ? officer.id : null,
    transfer: {
      requested: false,
      toDept: null,
      status: null
    },
    notes: [],
    createdAt: new Date().toISOString()
  };

  addCase(newCase);
  return { success: true };
}

// READ
export function handleGetCases() {
  return getCases();
}

// UPDATE STATUS
export function handleUpdateStatus(id, status) {
  updateCase(id, { status });
  return { success: true };
}

// ADD NOTE
export function handleAddNote(id, note) {
  const cases = getCases();
  const target = cases.find(c => c.id === id);

  if (target) {
    target.notes.push(note);
    updateCase(id, { notes: target.notes });
  }

  return { success: true };
}

// TRANSFER REQUEST
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