import { getCases, updateCase } from "../models/caseModel.js";

// ── CREATE CASE (BACKEND) ───────────────────────────────────────────────
export async function handleAddCase(data) {
  if (!data.title || !data.department) {
    return { error: "Missing required fields" };
  }

  try {
    const response = await fetch("http://localhost:3000/cases", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        role: "citizen",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return { error: error.message };
  }
}

// ── READ ALL (BACKEND) ──────────────────────────────────────────────────
export async function handleGetCases(role = "citizen", userId = "1") {
  try {
    const response = await fetch("http://localhost:3000/cases", {
      headers: {
        role: role,
        userid: userId,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return [];
  }
}

// ── UPDATE STATUS (BACKEND) ─────────────────────────────────────────────
export async function handleUpdateStatus(id, status) {
  try {
    const response = await fetch(
      `http://localhost:3000/cases/${id}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          role: "officer",
        },
        body: JSON.stringify({ status }),
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    return { error: error.message };
  }
}

// ── ASSIGN CASE (BACKEND) ───────────────────────────────────────────────
export async function handleAssignCase(id, officerId) {
  try {
    const response = await fetch(
      `http://localhost:3000/cases/${id}/assign`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          role: "supervisor",
        },
        body: JSON.stringify({ officerId }),
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    return { error: error.message };
  }
}

// ── UPDATE PRIORITY (KEEP MOCK FOR NOW) ─────────────────────────────────
export function handleUpdatePriority(id, priority) {
  updateCase(id, { priority });
  return { success: true };
}

// ── ADD NOTE (KEEP MOCK) ────────────────────────────────────────────────
export function handleAddNote(id, note) {
  const cases = getCases();
  const target = cases.find((c) => c.id === id);

  if (target) {
    const notes = target.notes || [];

    const normalizedNote =
      typeof note === "object"
        ? {
            text: note.text || "",
            author: note.author || "Unknown",
            role: note.role || "system",
            time: note.time || new Date().toISOString(),
          }
        : {
            text: String(note),
            author: "Unknown",
            role: "system",
            time: new Date().toISOString(),
          };

    notes.push(normalizedNote);
    updateCase(id, { notes });
  }

  return { success: true };
}


// ── SUPERVISOR VIEW (TEMP MOCK FILTER) ─────────────────────────────────
export async function handleGetCasesForSupervisor() {
  // use backend instead of local filtering
  return await handleGetCases("supervisor", "1");
}



export async function handleGetCaseById(id) {
  const res = await fetch(`http://localhost:3000/cases/${id}`);
  return res.json();
}

export async function handleUpdateCaseStatus(caseId, status) {
  // 🔥 normalize input
  const normalized = status.toLowerCase().replace(/\s+/g, "");

  const statusMap = {
    assigned: "open",
    open: "open",
    inprogress: "in-progress",
    resolved: "closed",   // backend only allows open / in-progress / closed
    closed: "closed"
  };

  const backendStatus = statusMap[normalized];

  console.log("Sending to backend:", {
    original: status,
    normalized,
    final: backendStatus
  });

  const res = await fetch(`http://localhost:3000/cases/${caseId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "role": "officer"
    },
    body: JSON.stringify({
      status: backendStatus
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Backend error:", err);
    throw new Error("Status update failed");
  }

  return res.json();
}

export async function handleClosureDecision(caseId, decision) {
  const res = await fetch(`http://localhost:3000/cases/${caseId}/closure-decision`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      role: "supervisor"
    },
    body: JSON.stringify({ decision })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Closure decision error:", err);
    throw new Error("Closure decision failed");
  }

  return res.json();
}


export async function handleTransferRequest(caseId, toDepartment) {
  const res = await fetch(`http://localhost:3000/cases/${caseId}/request-transfer`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      role: "officer"
    },
    body: JSON.stringify({ toDepartment })
  });

  if (!res.ok) throw new Error("Transfer request failed");

  return res.json();
}

export async function handleTransferDecision(caseId, decision) {
  const user = JSON.parse(sessionStorage.getItem("ct_user"));

  const res = await fetch(`http://localhost:3000/cases/${caseId}/transfer-decision`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      role: "supervisor",
      userid: user.id   // 🔥 REQUIRED
    },
    body: JSON.stringify({ decision })
  });

  if (!res.ok) throw new Error("Transfer decision failed");

  return res.json();
}