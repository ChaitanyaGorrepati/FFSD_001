import {
  handleGetCases,
  handleTransferDecision
} from "../../controllers/caseController.js";

import { populateSupervisorIdentity } from "./sidebar-identity.js";

populateSupervisorIdentity();

const tbody = document.getElementById("transfers-tbody");
const emptyState = document.getElementById("empty-state");

let backendCases = [];

// ── LOAD ────────────────────────────────────────
async function loadTransfers() {
  try {
    const user = JSON.parse(sessionStorage.getItem("ct_user"));

    const data = await handleGetCases("supervisor", user.id);

    console.log("🔥 SUPERVISOR CASES:", data);

    backendCases = data;

    renderTable();
    updateStats();

  } catch (err) {
    console.error("Transfer load error:", err);
  }
}

// ── FIXED FILTER ────────────────────────────────
function getTransfers() {
  return backendCases.filter(c =>
    c.transferRequested === true ||
    c.transferStatus === "forwarded" ||
    c.transferStatus === "approved" ||
    c.transferStatus === "rejected"
  );
}

// ── STATS ───────────────────────────────────────
function updateStats() {
  const all = getTransfers();

  set("stat-pending",
    all.filter(c => c.transferStatus === "pending").length
  );

  set("stat-accepted",
    all.filter(c => c.transferStatus === "forwarded" || c.transferStatus === "approved").length
  );

  set("stat-rejected",
    all.filter(c => c.transferStatus === "rejected").length
  );
}

function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── STATUS BADGE ────────────────────────────────
function statusBadge(status) {
  if (status === "approved") return `<span class="badge badge-green">Approved</span>`;
  if (status === "forwarded") return `<span class="badge badge-blue">Forwarded</span>`;
  if (status === "rejected") return `<span class="badge badge-red">Rejected</span>`;
  return `<span class="badge badge-orange">Pending</span>`;
}

// ── TABLE ───────────────────────────────────────
function renderTable() {
  const transfers = getTransfers();

  if (!transfers.length) {
    if (emptyState) emptyState.style.display = "block";
    tbody.innerHTML = "";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  tbody.innerHTML = transfers.map(c => {
    const isPending = c.transferStatus === "pending";

    return `
    <tr>
      <td>${c.id}</td>
      <td>${c.category || "—"}</td>
      <td>${c.department}</td>
      <td>${c.transferTo || "—"}</td>
      <td>${c.zone || "—"}</td>
      <td>${new Date(c.createdAt).toLocaleDateString()}</td>
      <td>${statusBadge(c.transferStatus)}</td>
      <td>
        ${isPending ? `
          <button onclick="approveTransfer(${c.id})" class="btn-sm btn-sm-green">Approve</button>
          <button onclick="rejectTransfer(${c.id})" class="btn-sm btn-sm-red">Reject</button>
        ` : `
          <a href="case-details.html?id=${c.id}" class="btn-sm btn-sm-outline">View</a>
        `}
      </td>
    </tr>
    `;
  }).join("");
}

// ── ACTIONS ─────────────────────────────────────
window.approveTransfer = async function(id) {
  try {
    await handleTransferDecision(id, "approved");
    toast("Transfer forwarded to target department");
    await loadTransfers();
  } catch (err) {
    console.error(err);
    toast("Approval failed", "red");
  }
};

window.rejectTransfer = async function(id) {
  try {
    await handleTransferDecision(id, "rejected");
    toast("Transfer rejected");
    await loadTransfers();
  } catch (err) {
    console.error(err);
    toast("Rejection failed", "red");
  }
};

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

// INIT
loadTransfers();