// js/supervisor/closure-requests.js
import { getCases, updateCase, resolveOfficerName, formatDate } from './supervisorData.js';
import { populateSupervisorIdentity } from './sidebar-identity.js';

populateSupervisorIdentity();

const tbody      = document.getElementById("closure-tbody");
const emptyState = document.getElementById("empty-state");

function getClosureCases() {
  return getCases().filter(c => c.closureRequest != null);
}

function updateStats() {
  const all = getCases();
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  set("stat-pending",  all.filter(c => c.closureRequest?.status === "Pending").length);
  set("stat-approved", all.filter(c => c.closureRequest?.status === "Approved").length);
  set("stat-rejected", all.filter(c => c.closureRequest?.status === "Rejected").length);
}

function closureBadge(status) {
  if (status === "Pending")  return `<span class="badge badge-orange">Pending</span>`;
  if (status === "Approved") return `<span class="badge badge-green">Approved</span>`;
  if (status === "Rejected") return `<span class="badge badge-red">Rejected</span>`;
  return `<span class="badge badge-gray">${status || "—"}</span>`;
}

function renderTable() {
  const cases = getClosureCases();
  if (emptyState) emptyState.style.display = cases.length === 0 ? "block" : "none";
  if (!tbody) return;
  tbody.innerHTML = cases.map(c => {
    const officerName = resolveOfficerName(c.assignedTo) || c.officer || "—";
    return `
    <tr>
      <td><a class="case-id-link" href="case-details.html?id=${c.id}">${c.id}</a></td>
      <td>${c.category}</td>
      <td>Officer ${officerName}</td>
      <td><span class="resolution-text">${c.closureRequest?.summary || "—"}</span></td>
      <td>${formatDate(c.closureRequest?.submittedAt || c.createdAt)}</td>
      <td>${closureBadge(c.closureRequest?.status)}</td>
      <td>
        <div class="closure-actions">
          <a class="btn-sm btn-view" href="case-details.html?id=${c.id}">👁 View Details</a>
          <button class="btn-sm btn-approve" onclick="approveClosure('${c.id}')">Approve</button>
          <button class="btn-sm btn-reject"  onclick="rejectClosure('${c.id}')">Reject</button>
        </div>
      </td>
    </tr>`;
  }).join("");
}

window.approveClosure = function(id) {
  const c = getCases().find(x => x.id === id);
  if (!c) return;
  updateCase(id, { closureRequest: { ...c.closureRequest, status: "Approved" }, status: "Closed" });
  renderTable(); updateStats(); toast(`Case ${id} closure approved.`, "green");
};

window.rejectClosure = function(id) {
  const c = getCases().find(x => x.id === id);
  if (!c) return;
  updateCase(id, { closureRequest: { ...c.closureRequest, status: "Rejected" } });
  renderTable(); updateStats(); toast(`Case ${id} closure rejected.`, "red");
};

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