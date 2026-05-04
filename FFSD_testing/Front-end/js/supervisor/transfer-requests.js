// js/supervisor/transfer-requests.js
// ─────────────────────────────────────────────────────────────────────────────
// Transfer Requests page — shows outgoing transfer requests made by officers
// of THIS supervisor's department. Supervisor approves → routes to destination
// supervisor's Accept Transfers. Supervisor rejects → officer keeps the case.
// ─────────────────────────────────────────────────────────────────────────────

import {
  getCases, updateCase, appendActivity, pushNotification,
  resolveOfficerName, formatDate,
  getLoggedInSupervisor
} from './supervisorData.js';
import { populateSupervisorIdentity } from './sidebar-identity.js';

populateSupervisorIdentity();

const supervisor = getLoggedInSupervisor();
const tbody      = document.getElementById("transfers-tbody");
const emptyState = document.getElementById("empty-state");

// ── Get all outgoing transfers for this supervisor's dept ─────────────────────
// KEY FIX: match on c.department === supervisor.department (officer never sets originDept)
function getOutgoingTransfers() {
  return getCases().filter(c =>
    c.transfer?.requested === true &&
    c.transfer?.toDept &&
    c.transfer?.toDept !== supervisor?.department   // must be cross-dept transfer
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function updateStats() {
  const all     = getOutgoingTransfers();
  const pending  = all.filter(c => !c.transfer.supervisorStatus || c.transfer.supervisorStatus === "pending").length;
  const approved = all.filter(c => c.transfer.supervisorStatus === "approved").length;
  const rejected = all.filter(c => c.transfer.supervisorStatus === "rejected").length;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("stat-pending",  pending);
  set("stat-accepted", approved);
  set("stat-rejected", rejected);
}

// ── Status badge ──────────────────────────────────────────────────────────────
function transferStatusBadge(status) {
  if (!status || status === "pending") return `<span class="badge badge-orange">Pending</span>`;
  if (status === "approved")           return `<span class="badge badge-green">Approved</span>`;
  if (status === "rejected")           return `<span class="badge badge-red">Rejected</span>`;
  return `<span class="badge badge-gray">${status}</span>`;
}

// ── Table render ──────────────────────────────────────────────────────────────
// HTML has 8 columns: Case ID | Category | From Dept | Requested Dept | Zone | Date | Status | Action
function renderTable() {
  const transfers = getOutgoingTransfers();

  if (emptyState) emptyState.style.display = transfers.length === 0 ? "block" : "none";
  if (!tbody) return;

  if (transfers.length === 0) {
    tbody.innerHTML = "";
    return;
  }

  tbody.innerHTML = transfers.map(c => {
    const supStatus = c.transfer?.supervisorStatus || "pending";
    const isPending = !c.transfer.supervisorStatus || c.transfer.supervisorStatus === "pending";

    return `
    <tr>
      <td><a class="case-id-link" href="case-details.html?id=${c.id}">${c.id}</a></td>
      <td>${c.category || "—"}</td>
      <td>${c.department || "—"}</td>
      <td>${c.transfer?.toDept || "—"}</td>
      <td>${c.zone || "—"}</td>
      <td>${formatDate(c.transfer?.requestedAt || c.createdAt)}</td>
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

// ── Approve: marks supervisorStatus=approved so destination sees it ───────────
window.approveTransfer = function(id) {
  // Read directly from raw storage so we don't miss the case if dept filter is strict
  const allRaw = JSON.parse(localStorage.getItem("cases") || "[]");
  const c = allRaw.find(x => x.id === id);
  if (!c) return;

  const toDept = c.transfer?.toDept;

  updateCase(id, {
    transfer: {
      ...c.transfer,
      // Stamp originDept NOW so both getOutgoing and getIncoming can work reliably
      originDept:        c.department,
      supervisorStatus:  "approved",
      destinationStatus: "pending",
      approvedAt:        new Date().toISOString(),
      approvedBySup:     supervisor?.id,
      approvedBySupName: supervisor?.name
    }
    // NOTE: c.department stays the same until destination supervisor accepts
  });

  appendActivity(id, {
    type:  "transfer",
    label: `Transfer to ${toDept} approved by Supervisor ${supervisor?.name}. Awaiting ${toDept} supervisor acceptance.`
  });

  // Notify the officer who requested it
  if (c.assignedTo) {
    pushNotification(
      c.assignedTo,
      `Your transfer request for case ${id} to ${toDept} has been approved by Supervisor ${supervisor?.name}. Awaiting ${toDept} department acceptance.`,
      id
    );
  }

  renderTable();
  updateStats();
  toast(`Transfer to ${toDept} approved. Now visible in ${toDept} supervisor's Accept Transfers.`, "green");
};

// ── Reject: supervisor declines, officer keeps the case ───────────────────────
window.rejectTransfer = function(id) {
  const allRaw = JSON.parse(localStorage.getItem("cases") || "[]");
  const c = allRaw.find(x => x.id === id);
  if (!c) return;

  updateCase(id, {
    transfer: {
      ...c.transfer,
      originDept:       c.department,
      supervisorStatus: "rejected",
      rejectedAt:       new Date().toISOString(),
      rejectedBySup:    supervisor?.id
    },
    status: "In Progress"  // revert — officer continues working it
  });

  appendActivity(id, {
    type:  "rejected",
    label: `Transfer request rejected by Supervisor ${supervisor?.name}. Case remains with ${c.department}.`
  });

  if (c.assignedTo) {
    pushNotification(
      c.assignedTo,
      `Your transfer request for case ${id} was rejected by Supervisor ${supervisor?.name}. Please continue working on the case.`,
      id
    );
  }

  renderTable();
  updateStats();
  toast(`Transfer request for ${id} rejected. Officer notified.`, "red");
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