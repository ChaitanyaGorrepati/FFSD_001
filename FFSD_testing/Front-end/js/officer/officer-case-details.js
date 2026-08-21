import {
  getOfficerSession, initOfficerUI, updateSidebarBadges,
  statusBadge, priorityBadge, formatDate
} from "./officer-utils.js";

import {
  handleGetCaseById,
  handleUpdateCaseStatus
} from "../../controllers/caseController.js";

// ── SESSION ───────────────────────────────────────
const user = getOfficerSession();
if (!user) throw new Error("No session");

initOfficerUI(user);
updateSidebarBadges(user.id, user.name);

document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("ct_user");
  window.location.href = "../index.html";
});

// ── CASE ID ───────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const caseId = params.get("id");
if (!caseId) window.location.href = "officer-assigned-cases.html";

let currentCase = null;

// ── NORMALIZE BACKEND → UI ───────────────────────
function normalizeCase(c) {
  return {
    ...c,
    assignedTo: c.assignedOfficerId,
    citizen: c.citizenId,

    status:
      c.status === "open" ? "Assigned" :
      c.status === "in-progress" ? "In Progress" :
      c.status === "closed" ? "Closed" :
      c.status
  };
}

// ── LOAD CASE ────────────────────────────────────
async function loadCase() {
  try {
    const data = await handleGetCaseById(caseId);
    currentCase = normalizeCase(data);
    renderCase(currentCase);
  } catch (err) {
    console.error("Error loading case:", err);
  }
}

// ── RENDER ───────────────────────────────────────
function renderCase(c) {
  document.getElementById("breadcrumb-id").textContent = c.id;
  document.getElementById("detail-case-id").textContent = c.id;
  document.getElementById("detail-title").textContent = c.title || "—";

  document.getElementById("detail-meta").textContent =
    `Submitted ${formatDate(c.createdAt)} · ${c.department} · ${c.zone}`;

  document.getElementById("detail-dept").textContent = c.department;
  document.getElementById("detail-zone").textContent = c.zone;
  document.getElementById("detail-category").textContent = c.category;
  document.getElementById("detail-date").textContent = formatDate(c.createdAt);
  document.getElementById("detail-location").textContent = c.location || "—";
  document.getElementById("detail-description").textContent = c.description || "—";

  document.getElementById("detail-status-badge").outerHTML =
    statusBadge(c.status).replace('class="badge', 'id="detail-status-badge" class="badge');

  document.getElementById("detail-priority-badge").outerHTML =
    priorityBadge(c.priority || "medium").replace('class="badge', 'id="detail-priority-badge" class="badge');

  document.getElementById("info-submitted-by").textContent = c.citizen;
  document.getElementById("info-status").innerHTML = statusBadge(c.status);
  document.getElementById("info-priority").innerHTML = priorityBadge(c.priority || "medium");
}

// ── STATUS LOGIC ─────────────────────────────────
async function saveStatus() {
  const val = document.querySelector('input[name="status"]:checked')?.value;
  if (!val) return;

  const map = {
    "Assigned": "open",
    "In Progress": "in-progress",
    "Resolved": "closed",
    "Closed": "closed"
  };

  try {
    await handleUpdateCaseStatus(caseId, map[val]);
    closeModal("status-modal");
    await loadCase();
  } catch (err) {
    console.error("Status update failed:", err);
  }
}

// ── MODAL HELPERS ────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

// ── 🔥 BUTTON WIRING (MAIN FIX) ──────────────────
document.addEventListener("click", (e) => {
  const action = e.target.closest("[data-action]")?.dataset.action;
  if (!action) return;

  if (action === "open-status") {
    openModal("status-modal");
  }

  if (action === "open-closure") {
    openModal("closure-modal");

    // fill modal data
    document.getElementById("crm-case-id-display").textContent = currentCase.id;
    document.getElementById("crm-case-title-display").textContent = currentCase.title;
  }

 if (action === "transfer") {
  window.location.href = `officer-transfer-requests.html?id=${currentCase.id}`;
}

  if (action === "add-note") {
    const val = document.getElementById("note-input").value;
    if (!val) return;

    const list = document.getElementById("notes-list");
    list.innerHTML = `<div>${val}</div>` + list.innerHTML;

    document.getElementById("note-input").value = "";
  }
});

// ── MODAL BUTTONS ────────────────────────────────
document.getElementById("sm-save").addEventListener("click", saveStatus);
document.getElementById("sm-close").addEventListener("click", () => closeModal("status-modal"));
document.getElementById("sm-cancel").addEventListener("click", () => closeModal("status-modal"));

document.getElementById("crm-close").addEventListener("click", () => closeModal("closure-modal"));
document.getElementById("crm-cancel").addEventListener("click", () => closeModal("closure-modal"));

// ── CLOSURE REQUEST SUBMIT ─────────────────────
document.getElementById("crm-submit").addEventListener("click", async () => {
  const summary = document.getElementById("crm-summary").value.trim();
  const supervisor = document.getElementById("crm-supervisor").value;
  const notes = document.getElementById("crm-notes").value;

  // validation
  let valid = true;

  if (!summary) {
    document.getElementById("crm-summary-error").style.display = "block";
    valid = false;
  } else {
    document.getElementById("crm-summary-error").style.display = "none";
  }

  if (!supervisor) {
    document.getElementById("crm-supervisor-error").style.display = "block";
    valid = false;
  } else {
    document.getElementById("crm-supervisor-error").style.display = "none";
  }

  if (!valid) return;

  try {
    // 🔥 CALL BACKEND
    await fetch(`http://localhost:3000/cases/${caseId}/request-closure`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "role": "officer"
      },
      body: JSON.stringify({
        summary,
        supervisorId: supervisor,
        notes
      })
    });

    alert("Closure request sent to supervisor ✅");

    closeModal("closure-modal");

    await loadCase(); // refresh UI

  } catch (err) {
    console.error("Closure request failed:", err);
  }
});

// ── INIT ─────────────────────────────────────────
loadCase();