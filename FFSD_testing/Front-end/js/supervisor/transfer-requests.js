// js/supervisor/transfer-requests.js
import { getCases, priorityBadge, statusBadge, formatDate } from './supervisorData.js';
import { populateSupervisorIdentity } from './sidebar-identity.js';

populateSupervisorIdentity();

const tbody      = document.getElementById("transfers-tbody");
const emptyState = document.getElementById("empty-state");

function getTransferCases() {
  return getCases().filter(c => c.transfer?.requested || c.transfer?.status);
}

function updateStats() {
  const all = getCases();
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  set("stat-pending",  all.filter(c => ["pending","Pending"].includes(c.transfer?.status) || (c.transfer?.requested && !c.transfer?.status)).length);
  set("stat-accepted", all.filter(c => ["accepted","Accepted"].includes(c.transfer?.status)).length);
  set("stat-rejected", all.filter(c => ["rejected","Rejected"].includes(c.transfer?.status)).length);
}

function transferStatusBadge(status) {
  if (!status || ["pending","Pending"].includes(status)) return `<span class="badge badge-orange">Pending</span>`;
  if (["accepted","Accepted"].includes(status))          return `<span class="badge badge-green">Accepted</span>`;
  if (["rejected","Rejected"].includes(status))          return `<span class="badge badge-red">Rejected</span>`;
  return `<span class="badge badge-gray">${status}</span>`;
}

function renderTable() {
  const transfers = getTransferCases();
  if (emptyState) emptyState.style.display = transfers.length === 0 ? "block" : "none";
  if (!tbody) return;
  tbody.innerHTML = transfers.map(c => `
    <tr>
      <td><a class="case-id-link" href="case-details.html?id=${c.id}">${c.id}</a></td>
      <td>${c.category}</td>
      <td>${c.department}</td>
      <td>${c.transfer?.toDept || "—"}</td>
      <td>${c.zone}</td>
      <td>${formatDate(c.createdAt)}</td>
      <td>${transferStatusBadge(c.transfer?.status)}</td>
      <td><a class="action-btn" href="transfer-case.html?id=${c.id}">Take Action</a></td>
    </tr>`).join("");
}

updateStats();
renderTable();