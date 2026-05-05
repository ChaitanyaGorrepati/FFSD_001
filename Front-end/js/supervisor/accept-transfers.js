// js/supervisor/accept-transfers.js

import {
  getUsers,
  priorityBadge,
  formatDate,
  getLoggedInSupervisor
} from './supervisorData.js';

import { populateSupervisorIdentity } from './sidebar-identity.js';

import {
  handleGetCases,
  handleTransferDecision
} from "../../controllers/caseController.js";

populateSupervisorIdentity();

const supervisor = getLoggedInSupervisor();

const tbody       = document.getElementById("transfers-tbody");
const emptyState  = document.getElementById("empty-state");
const detailPanel = document.getElementById("detail-panel");
const overlay     = document.getElementById("overlay");
const panelBody   = document.getElementById("panel-body");
const panelClose  = document.getElementById("panel-close");
const btnAccept   = document.getElementById("btn-accept");
const btnReject   = document.getElementById("btn-reject");
const btnViewCase = document.getElementById("btn-view-case");

let backendCases = [];
let selectedCaseId = null;

// ── FILTER INCOMING TRANSFERS ───────────────────
function getIncomingTransfers() {
  return backendCases.filter(c =>
    c.transferRequested === true &&
    c.transferStatus === "forwarded" &&
    c.transferTo === supervisor?.department
  );
}

// ── STATS ───────────────────────────────────────
function updateStats() {
  const all = backendCases.filter(c =>
    c.transferTo === supervisor?.department
  );

  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };

  set("stat-pending",
    all.filter(c => c.transferStatus === "forwarded").length
  );

  set("stat-accepted",
    all.filter(c => c.transferStatus === "approved").length
  );

  set("stat-rejected",
    all.filter(c => c.transferStatus === "rejected").length
  );
}

// ── TABLE ───────────────────────────────────────
function renderTable() {
  const transfers = getIncomingTransfers();

  if (emptyState) emptyState.style.display = transfers.length === 0 ? "block" : "none";
  if (!tbody) return;

  if (!transfers.length) {
    tbody.innerHTML = "";
    return;
  }

  tbody.innerHTML = transfers.map(c => `
    <tr>
      <td><a class="case-id-link" href="case-details.html?id=${c.id}">${c.id}</a></td>
      <td>${c.category || "—"}</td>
      <td>${c.department || "—"}</td>
      <td>${c.zone || "—"}</td>
      <td>${priorityBadge(c.priority)}</td>
      <td>${formatDate(c.createdAt)}</td>
      <td>
        <button class="btn-primary"
          style="padding:6px 16px;font-size:12.5px;"
          onclick="openPanel('${c.id}')">
          Review
        </button>
      </td>
    </tr>
  `).join("");
}

// ── PANEL ───────────────────────────────────────
window.openPanel = function(id) {
  selectedCaseId = id;

  const c = backendCases.find(x => String(x.id) === String(id));
  if (!c) return;

  const deptOfficers = getUsers().filter(
    u => u.role === "officer" && u.department === supervisor?.department
  );

  const officerOptions = deptOfficers.map(o =>
    `<option value="${o.id}">${o.name} (${o.zone})</option>`
  ).join("");

  panelBody.innerHTML = `
    <div class="detail-field">
      <div class="detail-label">Case ID</div>
      <div class="detail-value">${c.id}</div>
    </div>

    <div class="detail-field">
      <div class="detail-label">Category</div>
      <div class="detail-value">${c.category || "—"}</div>
    </div>

    <div class="detail-field">
      <div class="detail-label">Zone</div>
      <div class="detail-value">${c.zone || "—"}</div>
    </div>

    <div class="detail-field">
      <div class="detail-label">From Department</div>
      <div class="detail-value">${c.department || "—"}</div>
    </div>

    <div class="detail-field">
      <div class="detail-label">To Department</div>
      <div class="detail-value">${c.transferTo || "—"}</div>
    </div>

    <div class="detail-field">
      <div class="detail-label">Priority</div>
      <div class="detail-value">${priorityBadge(c.priority)}</div>
    </div>

    <div class="detail-field">
      <div class="detail-label">Assign to Officer</div>
      <select id="assign-officer-select"
        style="width:100%;margin-top:6px;padding:9px 12px;
        border:1.5px solid var(--gray-200);border-radius:8px;">
        <option value="">— Select officer —</option>
        ${officerOptions}
      </select>
      <p id="assign-error"
        style="color:#E53935;font-size:12px;margin-top:4px;display:none;">
        Please select an officer.
      </p>
    </div>
  `;

  if (btnViewCase) btnViewCase.href = `case-details.html?id=${c.id}`;

  detailPanel?.classList.add("open");
  overlay?.classList.add("show");
};

// ── CLOSE PANEL ─────────────────────────────────
function closePanel() {
  detailPanel?.classList.remove("open");
  overlay?.classList.remove("show");
  selectedCaseId = null;
}

panelClose?.addEventListener("click", closePanel);
overlay?.addEventListener("click", closePanel);

// ── ACCEPT ──────────────────────────────────────
btnAccept?.addEventListener("click", () => {
  if (!selectedCaseId) return;

  // 🔥 AUTO ASSIGN OFFICER (NO DROPDOWN)
  const caseObj = backendCases.find(c => c.id == selectedCaseId);

  let officerId = 4; // default sanitation officer

  if (caseObj?.zone === "A") officerId = 4;
  if (caseObj?.zone === "B") officerId = 4;
  if (caseObj?.zone === "C") officerId = 4;

  handleTransferDecision(selectedCaseId, "approved")
    .then(() => {
      toast("Transfer accepted and assigned");
      closePanel();
      loadTransfers();
    })
    .catch(err => {
      console.error(err);
      toast("Accept failed", "red");
    });
});

// ── REJECT ──────────────────────────────────────
btnReject?.addEventListener("click", () => {
  if (!selectedCaseId) return;

  handleTransferDecision(selectedCaseId, "rejected")
    .then(() => {
      toast("Transfer rejected");
      closePanel();
      loadTransfers();
    })
    .catch(err => {
      console.error(err);
      toast("Reject failed", "red");
    });
});

// ── TOAST ───────────────────────────────────────
function toast(msg, color = "green") {
  const map = { green:"#2E7D32", red:"#E53935" };

  const t = document.createElement("div");
  t.style.cssText = `
    position:fixed;bottom:24px;right:24px;
    background:${map[color]};color:#fff;
    padding:12px 20px;border-radius:10px;
    z-index:9999;font-size:13px;
  `;

  t.textContent = msg;
  document.body.appendChild(t);

  setTimeout(() => t.remove(), 3000);
}

// ── LOAD ────────────────────────────────────────
async function loadTransfers() {
  try {
    const user = JSON.parse(sessionStorage.getItem("ct_user"));

    const data = await handleGetCases("supervisor", user.id);

    console.log("🔥 BACKEND:", data);

    backendCases = data;

    renderTable();
    updateStats();

  } catch (err) {
    console.error("Load error:", err);
  }
}

// INIT
loadTransfers();