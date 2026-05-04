// js/supervisor/closure-requests.js
// Closure Requests page — supervisor approves/rejects officer closure requests.
// On approval/rejection, the case's activity[] is updated so case-details
// automatically shows "Supervisor closed the case" or "Supervisor rejected closure".

import {
  getCases, updateCase, appendActivity, pushNotification,
  resolveOfficerName, formatDate, getLoggedInSupervisor
} from './supervisorData.js';
import { populateSupervisorIdentity } from './sidebar-identity.js';

populateSupervisorIdentity();

const supervisor = getLoggedInSupervisor();
const tbody      = document.getElementById("closure-tbody");
const emptyState = document.getElementById("empty-state");

// ── Filter ────────────────────────────────────────────────────────────────────
function getClosureCases() {
  return getCases().filter(c => c.closureRequest != null);
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function updateStats() {
  const all = getCases();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("stat-pending",  all.filter(c => c.closureRequest?.status === "Pending"  || c.closureRequest?.status === "pending").length);
  set("stat-approved", all.filter(c => c.closureRequest?.status === "Approved" || c.closureRequest?.status === "approved").length);
  set("stat-rejected", all.filter(c => c.closureRequest?.status === "Rejected" || c.closureRequest?.status === "rejected").length);
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function closureBadge(status) {
  const s = (status || "").toLowerCase();
  if (s === "pending")  return `<span class="badge badge-orange">Pending</span>`;
  if (s === "approved") return `<span class="badge badge-green">Approved</span>`;
  if (s === "rejected") return `<span class="badge badge-red">Rejected</span>`;
  return `<span class="badge badge-gray">${status || "—"}</span>`;
}

// ── Table ─────────────────────────────────────────────────────────────────────
function renderTable() {
  const cases = getClosureCases();
  if (emptyState) emptyState.style.display = cases.length === 0 ? "block" : "none";
  if (!tbody) return;

  tbody.innerHTML = cases.map(c => {
    const officerName = resolveOfficerName(c.assignedTo) || c.officer || "—";
    const crStatus    = (c.closureRequest?.status || "pending").toLowerCase();
    const isPending   = crStatus === "pending";
    return `
    <tr>
      <td><a class="case-id-link" href="case-details.html?id=${c.id}">${c.id}</a></td>
      <td>${c.category || "—"}</td>
      <td>Officer ${officerName}</td>
      <td><span class="resolution-text">${c.closureRequest?.summary || "—"}</span></td>
      <td>${formatDate(c.closureRequest?.submittedAt || c.closureRequest?.requestedAt || c.createdAt)}</td>
      <td>${closureBadge(c.closureRequest?.status)}</td>
      <td>
        <div class="closure-actions">
          <a class="btn-sm btn-view" href="case-details.html?id=${c.id}">👁 View Details</a>
          ${isPending ? `
            <button class="btn-sm btn-approve" onclick="approveClosure('${c.id}')">Approve</button>
            <button class="btn-sm btn-reject"  onclick="rejectClosure('${c.id}')">Reject</button>
          ` : `
            <span style="font-size:12px;color:var(--gray-400);">Already ${c.closureRequest?.status}</span>
          `}
        </div>
      </td>
    </tr>`;
  }).join("");
}

// ── Approve ───────────────────────────────────────────────────────────────────
window.approveClosure = function(id) {
  const c = getCases().find(x => x.id === id);
  if (!c) return;

  const officerName = resolveOfficerName(c.assignedTo) || "Officer";
  const now         = new Date().toISOString();

  updateCase(id, {
    status:         "Closed",
    closedAt:       now,
    closureRequest: {
      ...c.closureRequest,
      status:         "Approved",
      actedAt:        now,
      actedBySup:     supervisor?.id,
      actedBySupName: supervisor?.name,
      supervisorNote: `Closure approved by Supervisor ${supervisor?.name}.`
    }
  });

  // Append to activity log — case-details reads this
  appendActivity(id, {
    type:  "supervisor_closed",
    label: `Case closed by Supervisor ${supervisor?.name}. Resolution confirmed: "${c.closureRequest?.summary || "—"}"`
  });

  // Notify officer
  if (c.assignedTo) {
    pushNotification(
      c.assignedTo,
      `Your closure request for case ${id} has been APPROVED by Supervisor ${supervisor?.name}. Case is now Closed.`,
      id
    );
  }

  renderTable();
  updateStats();
  toast(`Case ${id} closure approved. Case is now Closed.`, "green");
};

// ── Reject ────────────────────────────────────────────────────────────────────
window.rejectClosure = function(id) {
  const c = getCases().find(x => x.id === id);
  if (!c) return;

  const now = new Date().toISOString();

  updateCase(id, {
    closureRequest: {
      ...c.closureRequest,
      status:         "Rejected",
      actedAt:        now,
      actedBySup:     supervisor?.id,
      actedBySupName: supervisor?.name,
      supervisorNote: `Closure rejected by Supervisor ${supervisor?.name}. Please continue working on the case.`
    }
  });

  appendActivity(id, {
    type:  "supervisor_rejected",
    label: `Closure request rejected by Supervisor ${supervisor?.name}. Officer must continue working on the case.`
  });

  // Notify officer
  if (c.assignedTo) {
    pushNotification(
      c.assignedTo,
      `Your closure request for case ${id} was REJECTED by Supervisor ${supervisor?.name}. Please continue working on the case.`,
      id
    );
  }

  renderTable();
  updateStats();
  toast(`Case ${id} closure rejected. Officer notified.`, "red");
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg, color = "green") {
  const t = document.createElement("div");
  t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;
    background:${color==="green"?"#2E7D32":"#E53935"};color:#fff;padding:12px 20px;border-radius:10px;
    font-size:13.5px;font-family:'DM Sans',sans-serif;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.2);`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

updateStats();
renderTable();