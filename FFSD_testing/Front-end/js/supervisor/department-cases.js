// js/supervisor/department-cases.js
import { getCases, updateCase, resolveOfficerName, priorityBadge, statusBadge } from './supervisorData.js';
import { populateSupervisorIdentity } from './sidebar-identity.js';

populateSupervisorIdentity();

const tbody          = document.getElementById("cases-tbody");
const searchInput    = document.getElementById("search-input");
const statusFilter   = document.getElementById("status-filter");
const priorityFilter = document.getElementById("priority-filter");
const emptyState     = document.getElementById("empty-state");

let activeTab = "all";

function renderTable() {
  let cases = getCases();

  if (activeTab === "active")     cases = cases.filter(c => ["In Progress","Accepted","Assigned"].includes(c.status));
  if (activeTab === "unassigned") cases = cases.filter(c => !c.assignedTo);

  const q = (searchInput?.value || "").trim().toLowerCase();
  if (q) cases = cases.filter(c =>
    c.id.toLowerCase().includes(q) ||
    (c.citizen || "").toLowerCase().includes(q) ||
    (c.category || "").toLowerCase().includes(q) ||
    (resolveOfficerName(c.assignedTo) || "").toLowerCase().includes(q)
  );

  const sf = statusFilter?.value;
  if (sf) cases = cases.filter(c => c.status === sf);
  const pf = priorityFilter?.value;
  if (pf) cases = cases.filter(c => c.priority === pf);

  if (emptyState) emptyState.style.display = cases.length === 0 ? "block" : "none";
  if (tbody)      tbody.style.display      = cases.length === 0 ? "none"  : "";

  if (!tbody) return;

  if (cases.length === 0) return;

  tbody.innerHTML = cases.map(c => {
    const officerName = resolveOfficerName(c.assignedTo);
    return `
    <tr>
      <td><a class="case-id-link" href="case-details.html?id=${c.id}">${c.id}</a></td>
      <td>${c.citizen || "—"}</td>
      <td>${c.category || "—"}</td>
      <td>${officerName
          ? `<em style="font-weight:600;">${officerName}</em>`
          : `<span style="color:var(--gray-400);">Unassigned</span>`}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${priorityBadge(c.priority)}</td>
      <td>${c.zone || "—"}</td>
      <td class="actions-cell">
        <a class="btn-outline" style="padding:5px 12px;font-size:12px;" href="case-details.html?id=${c.id}">View Details</a>
      </td>
    </tr>`;
  }).join("");
}

document.querySelectorAll(".tab-btn[data-tab]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn[data-tab]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeTab = btn.dataset.tab;
    renderTable();
  });
});

searchInput?.addEventListener("input",  renderTable);
statusFilter?.addEventListener("change", renderTable);
priorityFilter?.addEventListener("change", renderTable);

renderTable();