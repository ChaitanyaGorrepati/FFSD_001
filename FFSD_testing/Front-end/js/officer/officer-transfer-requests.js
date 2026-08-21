// js/officer/officer-transfer-requests.js

import {
  getOfficerSession, initOfficerUI,
  updateSidebarBadges, statusBadge, formatDate
} from "./officer-utils.js";

import {
  handleGetCases,
  handleTransferRequest
} from "../../controllers/caseController.js";

const user = getOfficerSession();
if (!user) throw new Error("No session");

initOfficerUI(user);
updateSidebarBadges(user.id);

// 🔥 backend storage
let backendCases = [];

// ── Get case from URL ─────────────────────────────
const params = new URLSearchParams(window.location.search);
const fromId = params.get("id");

// ── LOAD CASES FIRST (IMPORTANT FIX) ─────────────
async function init() {
  await loadCases();

  if (fromId) {
    const c = backendCases.find(x => String(x.id) === String(fromId));
    if (c) showTransferForm(c);
  }
}

init();

// ── SHOW FORM ─────────────────────────────────────
function showTransferForm(c) {
  const formCard = document.getElementById("transfer-form-card");
  formCard.style.display = "block";

  document.getElementById("transfer-case-info").innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:20px;">
      <div><div class="label">Case ID</div><div>${c.id}</div></div>
      <div><div class="label">Title</div><div>${c.title || "—"}</div></div>
      <div><div class="label">Department</div><div>${c.department || "—"}</div></div>
      <div><div class="label">Status</div><div>${statusBadge(c.status)}</div></div>
    </div>
  `;

  const deptSelect = document.getElementById("transfer-dept");
  Array.from(deptSelect.options).forEach(opt => {
    opt.disabled = opt.value === c.department;
  });

  formCard.dataset.caseId = c.id;
}

// ── CANCEL ───────────────────────────────────────
window.cancelTransferForm = function () {
  document.getElementById("transfer-form-card").style.display = "none";
  history.replaceState({}, "", "officer-transfer-requests.html");
};

// ── SUBMIT (🔥 BACKEND) ─────────────────────────
window.submitTransfer = async function () {
  const caseId = document.getElementById("transfer-form-card").dataset.caseId;
  const toDept = document.getElementById("transfer-dept").value;
  const reason = document.getElementById("transfer-reason").value;
  const errorEl = document.getElementById("transfer-error");

  if (!toDept || !reason) {
    errorEl.textContent = "Please select department and reason";
    errorEl.style.display = "block";
    return;
  }

  errorEl.style.display = "none";

  try {
    await handleTransferRequest(caseId, toDept);

    showSuccess(`Transfer request sent for case ${caseId}`);

    document.getElementById("transfer-form-card").style.display = "none";
    history.replaceState({}, "", "officer-transfer-requests.html");

    await loadCases();

  } catch (err) {
    console.error(err);
    showSuccess("Transfer failed ❌");
  }
};

// ── SUCCESS UI ──────────────────────────────────
function showSuccess(msg) {
  const banner = document.createElement("div");
  banner.style.cssText =
    "position:fixed;top:20px;right:24px;background:#22C55E;color:#fff;padding:12px 20px;border-radius:8px;font-size:13.5px;font-weight:600;z-index:9999;";
  banner.textContent = msg;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 3000);
}

// ── LIST ────────────────────────────────────────
function renderTransferList() {
  const tbody = document.getElementById("transfer-list-body");

  const transferred = backendCases.filter(c => c.transferRequested === true);

  if (!transferred.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No transfer requests yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = transferred.map(c => `
    <tr>
      <td>${c.id}</td>
      <td>${c.title || "—"}</td>
      <td>${c.department}</td>
      <td>${c.transferTo || "—"}</td>
      <td>—</td>
      <td><span class="badge">${c.transferStatus || "pending"}</span></td>
      <td>${formatDate(c.createdAt)}</td>
      <td>
        <a href="officer-case-details.html?id=${c.id}" class="btn btn-xs btn-outline">View</a>
      </td>
    </tr>
  `).join("");
}

// ── LOAD ────────────────────────────────────────
async function loadCases() {
  try {
    const data = await handleGetCases("officer", user.id);

    backendCases = data;

    renderTransferList();

  } catch (err) {
    console.error("Transfer load error:", err);
  }
}