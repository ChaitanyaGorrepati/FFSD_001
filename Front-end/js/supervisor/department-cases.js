// js/supervisor/department-cases.js

import {
  resolveOfficerName,
  priorityBadge,
  statusBadge,
  formatDate,
  getLoggedInSupervisor
} from './supervisorData.js';

import { handleGetCases } from "../../controllers/caseController.js";
import { populateSupervisorIdentity } from './sidebar-identity.js';

populateSupervisorIdentity();

const tbody          = document.getElementById("cases-tbody");
const searchInput    = document.getElementById("search-input");
const statusFilter   = document.getElementById("status-filter");
const priorityFilter = document.getElementById("priority-filter");
const emptyState     = document.getElementById("empty-state");

let activeTab = "all";
let backendCases = [];

// 🔥 normalize backend → UI
function normalizeCases(data) {
  return data.map(c => ({
    ...c,
    assignedTo: c.assignedOfficerId,
    citizen: c.citizenId,

    status:
      c.status === "open" ? "Assigned" :
      c.status === "in-progress" ? "In Progress" :
      c.status === "resolved" ? "Resolved" :
      c.status === "closed" ? "Closed" :
      c.status
  }));
}

function renderTable() {
  let cases = backendCases;

  // Tab
  if (activeTab === "active")
    cases = cases.filter(c => ["Assigned","Accepted","In Progress","Waiting For Citizen"].includes(c.status));

  if (activeTab === "unassigned")
    cases = cases.filter(c => !c.assignedTo);

  // Search
  const q = (searchInput?.value || "").trim().toLowerCase();
  if (q) cases = cases.filter(c =>
    String(c.id).includes(q) ||
    String(c.citizen || "").toLowerCase().includes(q) ||
    String(c.category || "").toLowerCase().includes(q) ||
    String(resolveOfficerName(c.assignedTo) || "").toLowerCase().includes(q)
  );

  // Filters
  const sf = statusFilter?.value;
  if (sf) cases = cases.filter(c => c.status === sf);

  const pf = priorityFilter?.value;
  if (pf) cases = cases.filter(c => c.priority === pf);

  // Empty
  if (emptyState) emptyState.style.display = cases.length === 0 ? "block" : "none";
  if (tbody) tbody.style.display = cases.length === 0 ? "none" : "";
  if (!tbody) return;

  tbody.innerHTML = cases.map(c => {
    const officerName = resolveOfficerName(c.assignedTo);

    return `
    <tr>
      <td><a class="case-id-link" href="case-details.html?id=${c.id}">${c.id}</a></td>
      <td class="citizen-cell">${c.citizen || "—"}</td>
      <td>${c.category || "—"}</td>
      <td>${officerName
          ? `<em class="officer-name">${officerName}</em>`
          : `<span class="text-muted">Unassigned</span>`}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${priorityBadge(c.priority)}</td>
      <td>${c.zone || "—"}</td>
      <td class="date-cell">${formatDate(c.createdAt)}</td>
      <td class="actions-cell">
        <a class="btn-view-red" href="case-details.html?id=${c.id}">View Details</a>
      </td>
    </tr>`;
  }).join("");
}

// Tabs
document.querySelectorAll(".tab-btn[data-tab]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn[data-tab]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeTab = btn.dataset.tab;
    renderTable();
  });
});

searchInput?.addEventListener("input", renderTable);
statusFilter?.addEventListener("change", renderTable);
priorityFilter?.addEventListener("change", renderTable);

// 🔥 INIT
async function init() {
  try {
    const supervisor = getLoggedInSupervisor();
    const data = await handleGetCases("supervisor", supervisor.id);

    backendCases = normalizeCases(data);

    renderTable();

  } catch (err) {
    console.error("Supervisor dept cases error:", err);
  }
}

init();