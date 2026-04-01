// js/superuser/superuser-department-detail.js
import { initDepartments, getDepartments } from "../../models/departmentModel.js";
import { initUsers, getUsers } from "../../models/userModel.js";

// ── Auth Guard ────────────────────────────────────────────────────────────────
(function () {
  const _su = JSON.parse(sessionStorage.getItem("ct_user") || "null");
  if (!_su || _su.role !== "superuser") {
    window.location.href = "../role-selection.html";
  }
})();

// ── Read dept name from URL ?dept=Water ───────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const deptName = params.get("dept");

if (!deptName) {
  window.location.href = "superuser-departments.html";
}

// ── Tab switching ─────────────────────────────────────────────────────────────
let activeTab = "supervisors";

document.getElementById("detail-tabs").addEventListener("click", e => {
  const btn = e.target.closest(".detail-tab");
  if (!btn) return;
  const tab = btn.dataset.tab;
  document.querySelectorAll(".detail-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("panel-" + tab).classList.add("active");
  activeTab = tab;
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
}

function roleBadge(role) {
  const map = {
    officer: "badge-officer",
    supervisor: "badge-supervisor",
  };
  return `<span class="badge ${map[role] || ""}">${capitalize(role)}</span>`;
}

const DEPT_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"
];

function getDeptColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return DEPT_COLORS[hash % DEPT_COLORS.length];
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  initDepartments();
  initUsers();

  const depts = getDepartments();
  const dept = depts.find(d => d.name === deptName);

  if (!dept) {
    window.location.href = "superuser-departments.html";
    return;
  }

  // Breadcrumb + header
  document.getElementById("breadcrumb-dept").textContent = dept.name;
  document.getElementById("page-dept-name").textContent = dept.name;
  document.getElementById("page-dept-subtitle").textContent =
    `Department overview — supervisors, officers and complaint categories`;

  // Dept icon letter + color
  const iconEl = document.getElementById("dept-icon");
  iconEl.textContent = dept.name.charAt(0).toUpperCase();
  iconEl.style.background = getDeptColor(dept.name);

  // Users
  const allUsers = getUsers();
  const supervisors = allUsers.filter(u => u.role === "supervisor" && u.department === dept.name);
  const officers = allUsers.filter(u => u.role === "officer" && u.department === dept.name);
  const categories = dept.categories || [];

  // Stats
  document.getElementById("stat-supervisors").textContent = supervisors.length;
  document.getElementById("stat-officers").textContent = officers.length;
  document.getElementById("stat-categories").textContent = categories.length;

  // Tab counts
  document.getElementById("tab-count-supervisors").textContent = supervisors.length;
  document.getElementById("tab-count-officers").textContent = officers.length;

  // Categories
  const catList = document.getElementById("categories-list");
  if (categories.length) {
    catList.innerHTML = categories.map(c =>
      `<span class="cat-pill">${c}</span>`
    ).join("");
  } else {
    catList.innerHTML = `<span class="text-muted text-sm">No categories configured.</span>`;
  }

  // Supervisors table
  const supTbody = document.getElementById("supervisors-tbody");
  if (supervisors.length) {
    supTbody.innerHTML = supervisors.map(u => `
      <tr>
        <td>
          <div class="user-cell">
            <div class="user-avatar supervisor-avatar">${u.name.charAt(0).toUpperCase()}</div>
            <span class="font-semibold">${u.name}</span>
          </div>
        </td>
        <td>${u.zone || '<span class="text-muted">—</span>'}</td>
        <td>${roleBadge(u.role)}</td>
      </tr>
    `).join("");
  } else {
    supTbody.innerHTML = `<tr><td colspan="3" class="empty-state">No supervisors assigned to this department.</td></tr>`;
  }

  // Officers table
  const offTbody = document.getElementById("officers-tbody");
  if (officers.length) {
    offTbody.innerHTML = officers.map(u => `
      <tr>
        <td>
          <div class="user-cell">
            <div class="user-avatar officer-avatar">${u.name.charAt(0).toUpperCase()}</div>
            <span class="font-semibold">${u.name}</span>
          </div>
        </td>
        <td>${u.zone || '<span class="text-muted">—</span>'}</td>
        <td>${roleBadge(u.role)}</td>
      </tr>
    `).join("");
  } else {
    offTbody.innerHTML = `<tr><td colspan="3" class="empty-state">No officers assigned to this department.</td></tr>`;
  }
}

render();
