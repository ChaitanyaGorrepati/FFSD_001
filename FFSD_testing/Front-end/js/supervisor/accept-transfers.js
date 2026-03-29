// js/supervisor/accept-transfers.js
import { getCases, updateCase, priorityBadge, formatDate } from './supervisorData.js';
import { populateSupervisorIdentity } from './sidebar-identity.js';

populateSupervisorIdentity();

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

function getIncomingTransfers() {
  return getCases().filter(c =>
    c.transfer?.requested &&
    ["pending","Pending",null,undefined,""].includes(c.transfer.status)
  );
}

function updateStats() {
  const all      = getCases();
  const incoming = getIncomingTransfers();
  const set = (id, v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  set("stat-pending",  incoming.length);
  set("stat-accepted", all.filter(c => ["accepted","Accepted"].includes(c.transfer?.status)).length);
  set("stat-rejected", all.filter(c => ["rejected","Rejected"].includes(c.transfer?.status)).length);
}

function renderTable() {
  const transfers = getIncomingTransfers();
  if (emptyState) emptyState.style.display = transfers.length === 0 ? "block" : "none";
  if (!tbody) return;
  tbody.innerHTML = transfers.map(c => `
    <tr>
      <td><a class="case-id-link" href="case-details.html?id=${c.id}">${c.id}</a></td>
      <td>${c.category}</td>
      <td>${c.department}</td>
      <td>${c.zone}</td>
      <td>${priorityBadge(c.priority)}</td>
      <td>${formatDate(c.createdAt)}</td>
      <td><button class="btn-primary" style="padding:6px 16px;font-size:12.5px;"
          onclick="openPanel('${c.id}')">Review</button></td>
    </tr>`).join("");
}

window.openPanel = function(id) {
  selectedCaseId = id;
  const c = getCases().find(x => x.id === id);
  if (!c) return;
  panelBody.innerHTML = `
    <div class="detail-field"><div class="detail-label">Case ID</div><div class="detail-value">${c.id}</div></div>
    <div class="detail-field"><div class="detail-label">Citizen</div><div class="detail-value">${c.citizen || "—"}</div></div>
    <div class="detail-field"><div class="detail-label">Category</div><div class="detail-value">${c.category}</div></div>
    <div class="detail-field"><div class="detail-label">Zone</div><div class="detail-value">${c.zone}</div></div>
    <div class="detail-field"><div class="detail-label">Current Department</div><div class="detail-value">${c.department}</div></div>
    <div class="detail-field"><div class="detail-label">Requested Department</div><div class="detail-value">${c.transfer?.toDept || "—"}</div></div>
    <div class="detail-field"><div class="detail-label">Priority</div><div class="detail-value">${priorityBadge(c.priority)}</div></div>
    <div class="detail-field"><div class="detail-label">Transfer Reason</div>
      <div class="transfer-reason-box">${c.notes?.length ? c.notes[c.notes.length-1] : "No reason provided."}</div>
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
overlay?.addEventListener("click", closePanel);

btnAccept?.addEventListener("click", () => {
  if (!selectedCaseId) return;
  updateCase(selectedCaseId, { transfer: { requested: true, toDept: null, status: "accepted" }, status: "Accepted" });
  closePanel(); renderTable(); updateStats();
  toast("Transfer accepted.", "green");
});

btnReject?.addEventListener("click", () => {
  if (!selectedCaseId) return;
  updateCase(selectedCaseId, { transfer: { requested: true, toDept: null, status: "rejected" } });
  closePanel(); renderTable(); updateStats();
  toast("Transfer rejected.", "red");
});

function toast(msg, color = "green") {
  const t = document.createElement("div");
  t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;
    background:${color==="green"?"#2E7D32":"#E53935"};color:#fff;
    padding:12px 20px;border-radius:10px;font-size:13.5px;
    font-family:'DM Sans',sans-serif;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.2);`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

updateStats();
renderTable();