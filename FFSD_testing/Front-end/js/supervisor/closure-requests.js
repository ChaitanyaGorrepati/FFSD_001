// js/supervisor/closure-requests.js

import {
  resolveOfficerName,
  formatDate,
  getLoggedInSupervisor
} from './supervisorData.js';

import {
  handleGetCases,
  handleClosureDecision
} from "../../controllers/caseController.js";

import { populateSupervisorIdentity } from './sidebar-identity.js';

populateSupervisorIdentity();

const supervisor = getLoggedInSupervisor();
const tbody      = document.getElementById("closure-tbody");
const emptyState = document.getElementById("empty-state");

// 🔥 BACKEND DATA
let backendCases = [];

// ── FILTER ─────────────────────────────────────
function getClosureCases() {
  return backendCases.filter(c => c.closureRequested === true);
}

// ── STATS ─────────────────────────────────────
function updateStats() {
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };

  set("stat-pending",  backendCases.filter(c => c.closureStatus === "pending").length);
  set("stat-approved", backendCases.filter(c => c.closureStatus === "approved").length);
  set("stat-rejected", backendCases.filter(c => c.closureStatus === "rejected").length);
}

// ── BADGE ─────────────────────────────────────
function closureBadge(status) {
  if (status === "pending")  return `<span class="badge badge-orange">Pending</span>`;
  if (status === "approved") return `<span class="badge badge-green">Approved</span>`;
  if (status === "rejected") return `<span class="badge badge-red">Rejected</span>`;
  return `<span class="badge badge-gray">—</span>`;
}

// ── TABLE ─────────────────────────────────────
function renderTable() {
  const cases = getClosureCases();

  if (emptyState) emptyState.style.display = cases.length === 0 ? "block" : "none";
  if (!tbody) return;

  tbody.innerHTML = cases.map(c => {
    const officerName = resolveOfficerName(c.assignedOfficerId) || "—";
    const isPending   = c.closureStatus === "pending";

    return `
    <tr>
      <td><a class="case-id-link" href="case-details.html?id=${c.id}">${c.id}</a></td>
      <td>${c.category || "—"}</td>
      <td>Officer ${officerName}</td>
      <td><span class="resolution-text">—</span></td>
      <td>${formatDate(c.createdAt)}</td>
      <td>${closureBadge(c.closureStatus)}</td>
      <td>
        <div class="closure-actions">
          <a class="btn-sm btn-view" href="case-details.html?id=${c.id}">👁 View Details</a>

          ${isPending ? `
            <button class="btn-sm btn-approve" onclick="approveClosure('${c.id}')">Approve</button>
            <button class="btn-sm btn-reject"  onclick="rejectClosure('${c.id}')">Reject</button>
          ` : `
            <span style="font-size:12px;color:var(--gray-400);">Already ${c.closureStatus}</span>
          `}
        </div>
      </td>
    </tr>`;
  }).join("");
}

// ── APPROVE ─────────────────────────────────────
window.approveClosure = async function(id) {
  try {
    await handleClosureDecision(id, "approved");

    await loadCases();

    toast(`Case ${id} approved`, "green");

  } catch (err) {
    console.error(err);
    toast("Failed to approve", "red");
  }
};

// ── REJECT ─────────────────────────────────────
window.rejectClosure = async function(id) {
  try {
    await handleClosureDecision(id, "rejected");

    await loadCases();

    toast(`Case ${id} rejected`, "red");

  } catch (err) {
    console.error(err);
    toast("Failed to reject", "red");
  }
};

// ── LOAD FROM BACKEND ───────────────────────────
async function loadCases() {
  try {
    const data = await handleGetCases("supervisor", supervisor.id);

    backendCases = data;

    updateStats();
    renderTable();

  } catch (err) {
    console.error("Error loading closure cases:", err);
  }
}

// ── TOAST ─────────────────────────────────────
function toast(msg, color = "green") {
  const t = document.createElement("div");
  t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;
    background:${color==="green"?"#2E7D32":"#E53935"};color:#fff;padding:12px 20px;border-radius:10px;
    font-size:13.5px;font-family:'DM Sans',sans-serif;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.2);`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ── INIT ─────────────────────────────────────
loadCases();