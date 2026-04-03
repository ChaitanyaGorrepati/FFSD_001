// js/superuser/superuser-dashboard.js
import { initUsers } from "../../models/userModel.js";
import { initDepartments, getDepartments } from "../../models/departmentModel.js";
import { initCases, getCases } from "../../models/caseModel.js";
import { fetchUsers } from "../../routes/userRoutes.js";

// ── Auth Guard (runs after imports) ──────────────────────────────────────────
(function() {
  const _su = JSON.parse(sessionStorage.getItem("ct_user") || "null");
  if (!_su || _su.role !== "superuser") {
    window.location.href = "../role-selection.html";
  }
})();



function statusBadge(status) {
  const map = {
    Assigned:    "badge-assigned",
    "In Progress": "badge-progress",
    Resolved:    "badge-resolved",
    Closed:      "badge-closed",
    Pending:     "badge-pending"
  };
  const cls = map[status] || "badge-closed";
  return `<span class="badge ${cls}">${status}</span>`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function renderStats() {
  const cases = getCases();
  const users = fetchUsers();
  const depts = getDepartments();

  const openStatuses = ["Assigned", "In Progress", "Pending"];

  document.getElementById("stat-total-cases").textContent = cases.length;
  document.getElementById("stat-open-cases").textContent = cases.filter(c => openStatuses.includes(c.status)).length;
  document.getElementById("stat-total-users").textContent = users.length;
  document.getElementById("stat-departments").textContent = depts.length;
}

function renderRecentCases() {
  const cases = getCases().slice().reverse().slice(0, 10);
  const tbody = document.getElementById("recent-cases-body");

  if (!cases.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No cases have been submitted yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = cases.map(c => `
    <tr>
      <td class="font-mono text-xs">${c.id}</td>
      <td>${c.title || "—"}</td>
      <td>${c.department || "—"}</td>
      <td>${c.zone || "—"}</td>
      <td>${statusBadge(c.status)}</td>
      <td class="text-muted text-sm">${formatDate(c.createdAt)}</td>
    </tr>
  `).join("");
}

// Init directly (scripts at bottom of body)
initCases();
initUsers();
initDepartments();
renderStats();
renderRecentCases();
