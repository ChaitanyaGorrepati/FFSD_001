// js/supervisor/accept-transfers.js
// Accept Transfers page — destination supervisor sees cases routed TO their dept.
// They can accept (assign to one of their officers) or reject.

import {
  getIncomingTransferRequests, getCases,
  updateCase, appendActivity, pushNotification,
  resolveOfficerName, priorityBadge, formatDate,
  getLoggedInSupervisor, getUsers
} from './supervisorData.js';
import { populateSupervisorIdentity } from './sidebar-identity.js';

populateSupervisorIdentity();

const supervisor = getLoggedInSupervisor();
const tbody      = document.getElementById("transfers-tbody");
const emptyState = document.getElementById("empty-state");
const detailPanel= document.getElementById("detail-panel");
const overlay    = document.getElementById("overlay");
const panelBody  = document.getElementById("panel-body");
const panelClose = document.getElementById("panel-close");
const btnAccept  = document.getElementById("btn-accept");
const btnReject  = document.getElementById("btn-reject");
const btnViewCase= document.getElementById("btn-view-case");

let selectedCaseId = null;

// ── Stats ─────────────────────────────────────────────────────────────────────
function updateStats() {
  const all      = getUsers ? getUsers() : [];
  const incoming = getIncomingTransferRequests();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  // All cases ever incoming to this dept
  const allRaw = JSON.parse(localStorage.getItem("cases") || "[]");
  const thisDeptIncoming = allRaw.filter(c =>
    c.transfer?.toDept === supervisor?.department && c.transfer?.supervisorStatus === "approved"
  );

  set("stat-pending",  incoming.length);
  set("stat-accepted", thisDeptIncoming.filter(c => c.transfer?.destinationStatus === "accepted").length);
  set("stat-rejected", thisDeptIncoming.filter(c => c.transfer?.destinationStatus === "rejected").length);
}

// ── Table ─────────────────────────────────────────────────────────────────────
function renderTable() {
  const transfers = getIncomingTransferRequests();
  if (emptyState) emptyState.style.display = transfers.length === 0 ? "block" : "none";
  if (!tbody) return;

  tbody.innerHTML = transfers.map(c => `
    <tr>
      <td><a class="case-id-link" href="case-details.html?id=${c.id}">${c.id}</a></td>
      <td>${c.category || "—"}</td>
      <td>${c.transfer?.originDept || c.department || "—"}</td>
      <td>${c.zone}</td>
      <td>${priorityBadge(c.priority)}</td>
      <td>${formatDate(c.transfer?.approvedAt || c.createdAt)}</td>
      <td>
        <button class="btn-primary" style="padding:6px 16px;font-size:12.5px;"
          onclick="openPanel('${c.id}')">Review</button>
      </td>
    </tr>`).join("");
}

// ── Slide-in panel ────────────────────────────────────────────────────────────
window.openPanel = function(id) {
  selectedCaseId = id;
  const allRaw   = JSON.parse(localStorage.getItem("cases") || "[]");
  const c        = allRaw.find(x => x.id === id);
  if (!c) return;

  // Build officer dropdown for this dept
  const deptOfficers = getUsers().filter(
    u => u.role === "officer" && u.department === supervisor?.department
  );
  const officerOptions = deptOfficers.map(o =>
    `<option value="${o.id}">${o.name} (${o.zone})</option>`
  ).join("");

  panelBody.innerHTML = `
    <div class="detail-field"><div class="detail-label">Case ID</div><div class="detail-value">${c.id}</div></div>
    <div class="detail-field"><div class="detail-label">Citizen</div><div class="detail-value">${c.citizen || c.submittedName || "—"}</div></div>
    <div class="detail-field"><div class="detail-label">Category</div><div class="detail-value">${c.category || "—"}</div></div>
    <div class="detail-field"><div class="detail-label">Zone</div><div class="detail-value">${c.zone}</div></div>
    <div class="detail-field"><div class="detail-label">From Department</div><div class="detail-value">${c.transfer?.originDept || c.department}</div></div>
    <div class="detail-field"><div class="detail-label">To Department</div><div class="detail-value">${c.transfer?.toDept || "—"}</div></div>
    <div class="detail-field"><div class="detail-label">Priority</div><div class="detail-value">${priorityBadge(c.priority)}</div></div>
    <div class="detail-field">
      <div class="detail-label">Transfer Reason</div>
      <div class="transfer-reason-box">${c.transfer?.reason || (c.notes?.length ? c.notes[c.notes.length-1] : "No reason provided.")}</div>
    </div>
    <div class="detail-field">
      <div class="detail-label">Assign Officer</div>
      <select id="assign-officer-select" class="form-select" style="width:100%;margin-top:4px;padding:8px 12px;border:1.5px solid #E8EAED;border-radius:8px;font-size:13px;">
        <option value="">— Select officer to assign —</option>
        ${officerOptions}
      </select>
      <p id="assign-error" style="color:#E53935;font-size:12px;margin-top:4px;display:none;">Please select an officer.</p>
    </div>`;

  if (btnViewCase) btnViewCase.href = `case-details.html?id=${c.id}`;
  detailPanel?.classList.add("open");
  overlay?.classList.add("show");
};

function closePanel() {
  detailPanel?.classList.remove("open");
  overlay?.classList.remove("show");
  selectedCaseId = null;
}

panelClose?.addEventListener("click", closePanel);
overlay?.addEventListener("click",   closePanel);

// ── Accept: assign to selected officer, update dept ───────────────────────────
btnAccept?.addEventListener("click", () => {
  if (!selectedCaseId) return;

  const selectEl   = document.getElementById("assign-officer-select");
  const errorEl    = document.getElementById("assign-error");
  const officerId  = selectEl?.value;

  if (!officerId) {
    if (errorEl) errorEl.style.display = "block";
    return;
  }
  if (errorEl) errorEl.style.display = "none";

  const allRaw   = JSON.parse(localStorage.getItem("cases") || "[]");
  const c        = allRaw.find(x => x.id === selectedCaseId);
  if (!c) return;

  const officer     = getUsers().find(u => u.id === officerId);
  const officerName = officer ? officer.name : officerId;
  const toDept      = c.transfer?.toDept || supervisor?.department;

  updateCase(selectedCaseId, {
    department: toDept,         // ← case now belongs to destination dept
    assignedTo: officerId,      // ← new officer
    status:     "Assigned",
    transfer: {
      ...c.transfer,
      destinationStatus: "accepted",
      acceptedAt:        new Date().toISOString(),
      acceptedBySup:     supervisor?.id
    }
  });

  appendActivity(selectedCaseId, {
    type:  "accepted",
    label: `Transfer accepted by Supervisor ${supervisor?.name} (${toDept}). Assigned to Officer ${officerName}.`
  });

  // Notify new officer
  if (officerId) {
    pushNotification(
      officerId,
      `Case ${selectedCaseId} has been transferred to your department (${toDept}) and assigned to you.`,
      selectedCaseId
    );
  }

  // Notify original officer (optional)
  if (c.assignedTo && c.assignedTo !== officerId) {
    pushNotification(
      c.assignedTo,
      `Your transferred case ${selectedCaseId} has been accepted by the ${toDept} department.`,
      selectedCaseId
    );
  }

  closePanel();
  renderTable();
  updateStats();
  toast(`Transfer accepted. Case assigned to Officer ${officerName} in ${toDept}.`, "green");
});

// ── Reject incoming transfer ──────────────────────────────────────────────────
btnReject?.addEventListener("click", () => {
  if (!selectedCaseId) return;

  const allRaw = JSON.parse(localStorage.getItem("cases") || "[]");
  const c      = allRaw.find(x => x.id === selectedCaseId);
  if (!c) return;

  updateCase(selectedCaseId, {
    transfer: {
      ...c.transfer,
      destinationStatus: "rejected",
      rejectedByDest:    new Date().toISOString()
    },
    status: "In Progress"    // stays with original dept officer
  });

  appendActivity(selectedCaseId, {
    type:  "rejected",
    label: `Incoming transfer rejected by Supervisor ${supervisor?.name} (${supervisor?.department}). Case returned to ${c.department}.`
  });

  // Notify the original officer
  if (c.assignedTo) {
    pushNotification(
      c.assignedTo,
      `The ${supervisor?.department} department rejected the transfer for case ${selectedCaseId}. Case stays with you.`,
      selectedCaseId
    );
  }

  closePanel();
  renderTable();
  updateStats();
  toast("Incoming transfer rejected. Case remains with originating department.", "red");
});

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg, color = "green") {
  const t = document.createElement("div");
  t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;
    background:${color==="green"?"#2E7D32":"#E53935"};color:#fff;
    padding:12px 20px;border-radius:10px;font-size:13.5px;
    font-family:'DM Sans',sans-serif;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.2);`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

updateStats();
renderTable();