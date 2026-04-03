import { addCase, getCases, updateCase } from "../models/caseModel.js";
import { getOfficers } from "../models/userModel.js";

// 🔥 AUTO ASSIGNMENT — matches officer by department + zone
function assignOfficer(department, zone) {
  const officers = getOfficers();

  // Try exact match first
  let officer = officers.find(
    o => o.department === department && o.zone === zone
  );

  // Fallback: match by department only
  if (!officer) {
    officer = officers.find(o => o.department === department);
  }

  return officer || null;
}

// ── CREATE CASE ───────────────────────────────────────────────────────────────
export function handleAddCase(data) {
  if (!data.title || !data.department) {
    return { error: "Missing required fields" };
  }

  const zone = data.zone || "Zone A";
  const officer = assignOfficer(data.department, zone);

  // Normalize citizen name
  const citizenName = data.submittedName || data.citizen || "Unknown Citizen";

  const newCase = {
    id: "CIV-" + Date.now(),

    // ✅ merged safely (kept structured + flexibility)
    ...data,
    title: data.title,
    description: data.description || "",
    department: data.department,
    category: data.category || "",
    zone: zone,
    location: data.location || "",
    priority: data.priority || "Medium",

    // ✅ important fields preserved
    citizen: citizenName,
    status: "Assigned",
    assignedTo: officer ? officer.id : null,

    submittedBy: data.submittedBy || "Citizen",
    contactPhone: data.contactPhone || "",
    contactEmail: data.contactEmail || "",

    transfer: {
      requested: false,
      toDept: null,
      status: null
    },

    notes: [],
    createdAt: new Date().toISOString()
  };

  addCase(newCase);

  return {
    success: true,
    caseId: newCase.id,
    assignedTo: officer ? officer.name : "Unassigned"
  };
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

// ✅ UPDATE PRIORITY
export function handleUpdatePriority(id, priority) {
  updateCase(id, { priority });
  return { success: true };
}

// ── ADD NOTE (FIX #5: Standardize note structure) ────────────────────────────
export function handleAddNote(id, note) {
  const cases = getCases();
  const target = cases.find(c => c.id === id);

  if (target) {
    const notes = target.notes || [];
    
    // Normalize note to structured format (FIX #5)
    // Handles legacy plain strings + new structured objects
    let normalizedNote;
    
    if (typeof note === 'string') {
      // Legacy plain string → convert to structured
      normalizedNote = {
        text: note,
        author: "Unknown",
        role: "system",
        time: new Date().toISOString()
      };
    } else if (typeof note === 'object' && note !== null) {
      // Already an object, ensure all fields exist
      normalizedNote = {
        text: note.text || String(note),
        author: note.author || "Unknown",
        role: note.role || "system",
        time: note.time || new Date().toISOString(),
        // Preserve any additional fields
        ...note
      };
    } else {
      // Fallback for any other type
      normalizedNote = {
        text: String(note),
        author: "Unknown",
        role: "system",
        time: new Date().toISOString()
      };
    }
    
    notes.push(normalizedNote);
    updateCase(id, { notes });
  }

  return { success: true };
}

// ── TRANSFER REQUEST ──────────────────────────────────────────────────────────
export function handleTransferRequest(id, toDept, reason, notes) {
  updateCase(id, {
    status: "Transferred",
    transfer: {
      requested: true,
      toDept,
      reason: reason || "",
      notes: notes || "",
      status: "pending",
      requestedAt: new Date().toISOString()
    }
  });

  return { success: true };
}

// ── GET CASES FOR SUPERVISOR ──────────────────────────────────────────────────
export function handleGetCasesForSupervisor(department) {
  const cases = getCases();

  return cases.filter(c =>
    c.department === department &&
    [
      "Assigned",
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