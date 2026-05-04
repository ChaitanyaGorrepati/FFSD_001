// js/supervisor/dashboard.js

import {
  getOfficersWorkload,
  getWeeklyCaseCounts,
  getLoggedInSupervisor,
  resolveOfficerName,
  priorityBadge,
  statusBadge
} from './supervisorData.js';

import { handleGetCases } from "../../controllers/caseController.js";
import { initNotifications } from './supervisor-notifications.js';

// ── Guard ─────────────────────────────────────────
const supervisor = getLoggedInSupervisor();
if (!supervisor || supervisor.role !== "supervisor") {
  window.location.href = "../../views/role-selection.html";
}

// ── Identity ──────────────────────────────────────
function applyIdentity() {
  const initials = supervisor.name
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set("sidebar-avatar", initials);
  set("sidebar-name", supervisor.name);
  set("sidebar-role", `Supervisor – ${supervisor.department}`);
  set("topbar-avatar", initials);
  set("topbar-name", supervisor.name);
  set("dept-label", supervisor.department);
}
applyIdentity();
initNotifications();

// ── Month label ───────────────────────────────────
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const monthEl = document.getElementById("current-month");
if (monthEl) {
  monthEl.textContent = `${months[new Date().getMonth()]} ${new Date().getFullYear()}`;
}

// ── Stats ─────────────────────────────────────────
function updateStats(cases) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set("stat-dept", cases.length);

  set("stat-active",
    cases.filter(c =>
      ["Assigned","Accepted","In Progress","Waiting For Citizen"].includes(c.status)
    ).length
  );

  set("stat-transfer",
    cases.filter(c => c.transfer?.requested).length
  );

  set("stat-closed",
    cases.filter(c => ["Resolved","Closed"].includes(c.status)).length
  );
}

// ── Table ─────────────────────────────────────────
const tbody = document.getElementById("cases-tbody");
let backendCases = [];

// Normalize backend → UI format (NO UI CHANGE)
function normalizeCases(data) {
  return data.map(c => ({
    ...c,
    assignedTo: c.assignedOfficerId || null,
    citizen: c.citizenId || "Citizen",

    status:
      c.status === "open" ? "Assigned" :
      c.status === "in-progress" ? "In Progress" :
      c.status === "resolved" ? "Resolved" :
      c.status === "closed" ? "Closed" :
      c.status
  }));
}

function renderTable(filter = "all") {
  let cases = backendCases;

  if (filter === "active") {
    cases = cases.filter(c =>
      ["Assigned","Accepted","In Progress","Waiting For Citizen"].includes(c.status)
    );
  }

  if (filter === "unassigned") {
    cases = cases.filter(c => !c.assignedTo);
  }

  const recent = cases.slice(0, 10);

  if (!tbody) return;

  if (!recent.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-td">
          No ${supervisor.department} cases yet.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = recent.map(c => {
    const officerName = resolveOfficerName(c.assignedTo) || "Unassigned";

    return `
      <tr>
        <td><a class="case-id-link" href="case-details.html?id=${c.id}">${c.id}</a></td>
        <td class="citizen-cell">${c.citizen}</td>
        <td>${c.category}</td>
        <td>${
          c.assignedTo
            ? `<em class="officer-name">${officerName}</em>`
            : `<span class="text-muted">Unassigned</span>`
        }</td>
        <td>${statusBadge(c.status)}</td>
        <td>${priorityBadge(c.priority)}</td>
        <td>${c.zone}</td>
        <td><a class="action-link" href="case-details.html?id=${c.id}">Open</a></td>
      </tr>
    `;
  }).join("");
}

// ── Tabs ──────────────────────────────────────────
document.querySelectorAll(".tab-btn[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderTable(btn.dataset.filter);
  });
});

// ── Workload (UNCHANGED) ─────────────────────────
const workloadList = document.getElementById("workload-list");

function renderWorkload() {
  const officers = getOfficersWorkload();

  if (!officers.length) {
    workloadList.innerHTML = `<p class="text-muted">No officer data available.</p>`;
    return;
  }

  workloadList.innerHTML = officers.map(o => {
    const pct = Math.round((o.assigned / o.max) * 100);
    const barColor = pct >= 90 ? "bar-red" : pct >= 50 ? "bar-blue" : "bar-green";

    return `
      <div class="workload-item">
        <div class="workload-top">
          <span>${o.name} (${o.zone})</span>
          <span>${o.assigned}/${o.max}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill ${barColor}" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

// ── INIT ─────────────────────────────────────────
async function init() {
  try {
    // 🔥 FIXED LINE
    const data = await handleGetCases("supervisor", supervisor.id);

    backendCases = normalizeCases(data);

    updateStats(backendCases);
    renderTable("all");
    renderWorkload();

  } catch (err) {
    console.error("Supervisor error:", err);
  }
}

init();

// ── Chart ─────────────────────────────────────────
function drawChart() {
  const canvas = document.getElementById("weekChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  canvas.width = canvas.parentElement.offsetWidth;
  canvas.height = 130;

  const data = getWeeklyCaseCounts();

  data.forEach((val, i) => {
    ctx.fillStyle = val > 0 ? "#E53935" : "#E8EAED";
    ctx.fillRect(i * 30 + 20, 120 - val * 10, 20, val * 10);
  });
}

window.addEventListener("load", drawChart);
window.addEventListener("resize", drawChart);