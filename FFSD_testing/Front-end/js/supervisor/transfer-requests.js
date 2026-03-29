// js/supervisor/transfer-requests.js
// Transfer Requests page — shows cases where an officer in THIS department
// has requested a transfer to ANOTHER department.
// Supervisor can approve (routes to destination Accept Transfers) or reject.

import {
  getOutgoingTransferRequests, getCases,
  updateCase, appendActivity, pushNotification,
  resolveOfficerName, priorityBadge, statusBadge, formatDate,
  getLoggedInSupervisor
} from './supervisorData.js';
import { populateSupervisorIdentity } from './sidebar-identity.js';

populateSupervisorIdentity();

const supervisor = getLoggedInSupervisor();
const tbody      = document.getElementById("transfers-tbody");
const emptyState = document.getElementById("empty-state");

// ── Stats ─────────────────────────────────────────────────────────────────────
function updateStats() {
  const all = getCases();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  const outgoing   = getOutgoingTransferRequests();
  const pendingOut = outgoing.filter(c =>
    !c.transfer.supervisorStatus || c.transfer.supervisorStatus === "pending"
  ).length;
  const approved = all.filter(c =>
    c.department === supervisor?.department &&
    c.transfer?.supervisorStatus === "approved"
  ).length;
  const rejected = all.filter(c =>
    c.department === supervisor?.department &&
    c.transfer?.supervisorStatus === "rejected"
  ).length;

  set("stat-pending",  pendingOut);
  set("stat-accepted", approved);
  set("stat-rejected", rejected);
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function transferStatusBadge(status) {
  if (!status || status === "pending") return `<span class="badge badge-orange">Pending</span>`;
  if (status === "approved")           return `<span class="badge badge-green">Approved</span>`;
  if (status === "rejected")           return `<span class="badge badge-red">Rejected</span>`;
  return `<span class="badge badge-gray">${status}</span>`;
}

// ── Table ─────────────────────────────────────────────────────────────────────
function renderTable() {
  // Show ALL outgoing transfers (pending + decided) so supervisor can review history
  const allWithTransfer = getCases().filter(c =>
    c.transfer?.requested &&
    c.transfer?.originDept === supervisor?.department
  );

  if (emptyState) emptyState.style.display = allWithTransfer.length === 0 ? "block" : "none";
  if (!tbody) return;

  if (allWithTransfer.length === 0) return;

  tbody.innerHTML = allWithTransfer.map(c => {
    const officerName = resolveOfficerName(c.assignedTo) || "—";
    const supStatus   = c.transfer?.supervisorStatus || "pending";
    const isPending   = !c.transfer.supervisorStatus || c.transfer.supervisorStatus === "pending";

    return `
    <tr>
      <td><a class="case-id-link" href="case-details.html?id=${c.id}">${c.id}</a></td>
      <td>${c.category || "—"}</td>
      <td>${officerName}</td>
      <td>${c.department}</td>
      <td>${c.transfer?.toDept || "—"}</td>
      <td>${c.zone}</td>
      <td>${formatDate(c.createdAt)}</td>
      <td>${transferStatusBadge(supStatus)}</td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${isPending ? `
            <button class="btn-sm btn-sm-green" onclick="approveTransfer('${c.id}')">Approve</button>
            <button class="btn-sm btn-sm-red"   onclick="rejectTransfer('${c.id}')">Reject</button>
          ` : `
            <a class="btn-sm btn-sm-outline" href="case-details.html?id=${c.id}">View</a>
          `}
        </div>
      </td>
    </tr>`;
  }).join("");
}

// ── Approve transfer: routes case to destination Accept Transfers ──────────────
window.approveTransfer = function(id) {
  const cases     = getCases();
  const c         = cases.find(x => x.id === id);
  if (!c) return;

  const toDept    = c.transfer?.toDept;
  const officerName = resolveOfficerName(c.assignedTo) || "Officer";

  // 1. Update transfer — mark supervisorStatus=approved so destination sees it
  updateCase(id, {
    transfer: {
      ...c.transfer,
      supervisorStatus:   "approved",
      destinationStatus:  "pending",   // destination supervisor hasn't decided yet
      approvedAt:         new Date().toISOString(),
      approvedBySup:      supervisor?.id
    }
    // department stays the SAME until destination supervisor accepts
  });

  // 2. Log activity
  appendActivity(id, {
    type:  "transfer",
    label: `Transfer to ${toDept} approved by Supervisor ${supervisor?.name}. Awaiting ${toDept} supervisor.`
  });

  // 3. Notify the officer who requested it
  if (c.assignedTo) {
    pushNotification(
      c.assignedTo,
      `Your transfer request for case ${id} to ${toDept} has been approved by your supervisor. Awaiting ${toDept} supervisor acceptance.`,
      id
    );
  }

  renderTable();
  updateStats();
  toast(`Transfer to ${toDept} approved. Routing to ${toDept} supervisor's Accept Transfers.`, "green");
};

// ── Reject transfer ───────────────────────────────────────────────────────────
window.rejectTransfer = function(id) {
  const cases = getCases();
  const c = cases.find(x => x.id === id);
  if (!c) return;

  const officerName = resolveOfficerName(c.assignedTo) || "Officer";

  updateCase(id, {
    transfer: {
      ...c.transfer,
      supervisorStatus: "rejected",
      rejectedAt:       new Date().toISOString(),
      rejectedBySup:    supervisor?.id
    },
    status: "In Progress"  // revert to active — officer keeps working it
  });

  appendActivity(id, {
    type:  "rejected",
    label: `Transfer request rejected by Supervisor ${supervisor?.name}. Case remains with ${c.department}.`
  });

  // Notify officer
  if (c.assignedTo) {
    pushNotification(
      c.assignedTo,
      `Your transfer request for case ${id} was rejected by your supervisor. Please continue working on the case.`,
      id
    );
  }

  renderTable();
  updateStats();
  toast(`Transfer request for ${id} rejected.`, "red");
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg, color = "green") {
  const map = { green:"#2E7D32", red:"#E53935" };
  const t   = document.createElement("div");
  t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;
    background:${map[color]||"#2E7D32"};color:#fff;padding:12px 20px;border-radius:10px;
    font-size:13.5px;font-family:'DM Sans',sans-serif;font-weight:500;
    box-shadow:0 4px 16px rgba(0,0,0,.2);`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

updateStats();
renderTable();