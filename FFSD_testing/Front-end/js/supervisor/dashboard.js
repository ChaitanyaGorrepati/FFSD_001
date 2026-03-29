// js/supervisor/dashboard.js
import {
  getCases,
  getOfficersWorkload,
  getWeeklyCaseCounts,
  getLoggedInSupervisor,
  resolveOfficerName,
  priorityBadge,
  statusBadge,
  formatDate
} from './supervisorData.js';

// ── Guard: redirect if not logged in as supervisor ────────────────────────────
const supervisor = getLoggedInSupervisor();
if (!supervisor || supervisor.role !== "supervisor") {
  window.location.href = "../../views/role-selection.html";
}

// ── Populate identity (sidebar + topbar) ──────────────────────────────────────
function applyIdentity() {
  if (!supervisor) return;
  const initials = supervisor.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("sidebar-avatar", initials);
  set("sidebar-name",   supervisor.name);
  set("sidebar-role",   `Supervisor – ${supervisor.department}`);
  set("topbar-avatar",  initials);
  set("topbar-name",    supervisor.name);
  set("supervisor-name", supervisor.name);
  set("supervisor-dept", `${supervisor.department} Department`);
}
applyIdentity();

// ── Month label ───────────────────────────────────────────────────────────────
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const monthEl = document.getElementById("current-month");
if (monthEl) monthEl.textContent = `${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

// ── Dept label in subtitle ────────────────────────────────────────────────────
const deptLabelEl = document.getElementById("dept-label");
if (deptLabelEl && supervisor) deptLabelEl.textContent = supervisor.department;

// ── Stats ─────────────────────────────────────────────────────────────────────
function updateStats(cases) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("stat-dept",     cases.length);
  set("stat-active",   cases.filter(c => ["In Progress","Accepted"].includes(c.status)).length);
  set("stat-transfer", cases.filter(c => c.transfer?.requested).length);
  set("stat-closed",   cases.filter(c => ["Resolved","Closed"].includes(c.status)).length);
}

// ── Table ─────────────────────────────────────────────────────────────────────
const tbody = document.getElementById("cases-tbody");
let currentFilter = "all";

function renderTable(filter = "all") {
  let cases = getCases();
  if (filter === "active")     cases = cases.filter(c => ["In Progress","Accepted"].includes(c.status));
  if (filter === "unassigned") cases = cases.filter(c => !c.assignedTo);
  const recent = cases.slice(0, 10);
  if (!tbody) return;

  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--gray-400);padding:2rem;font-size:13px;">
      No ${supervisor?.department || ""} cases yet. Cases appear here once a citizen files a complaint.
    </td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(c => {
    const officerName = resolveOfficerName(c.assignedTo) || "Unassigned";
    return `
    <tr>
      <td><a class="case-id-link" href="case-details.html?id=${c.id}">${c.id}</a></td>
      <td>${c.citizen || "—"}</td>
      <td>${c.category}</td>
      <td>${c.assignedTo
          ? `<em style="font-weight:600;">${officerName}</em>`
          : `<span style="color:var(--gray-400);">Unassigned</span>`}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${priorityBadge(c.priority)}</td>
      <td>${c.zone}</td>
      <td><a class="action-link" href="case-details.html?id=${c.id}">Open</a></td>
    </tr>`;
  }).join("");
}

// Tab buttons
document.querySelectorAll(".tab-btn[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn[data-filter]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTable(currentFilter);
  });
});

// ── Officer workload ──────────────────────────────────────────────────────────
const workloadList = document.getElementById("workload-list");

function renderWorkload() {
  if (!workloadList) return;
  const officers = getOfficersWorkload();
  if (!officers.length) {
    workloadList.innerHTML = `<p style="color:var(--gray-400);font-size:13px;padding:12px 20px;">No officer data available.</p>`;
    return;
  }
  workloadList.innerHTML = officers.map(o => {
    const pct      = Math.round((o.assigned / o.max) * 100);
    const barColor = pct >= 90 ? "bar-red" : pct >= 50 ? "bar-blue" : "bar-green";
    return `
      <div class="workload-item">
        <div class="workload-top">
          <span class="workload-name">${o.name} <small style="color:var(--gray-400);font-weight:400;">(${o.zone})</small></span>
          <span class="workload-count">${o.assigned}/${o.max}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill ${barColor}" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join("");
}

// ── Weekly chart (real data) ──────────────────────────────────────────────────
function drawChart() {
  const canvas = document.getElementById("weekChart");
  if (!canvas) return;
  const ctx    = canvas.getContext("2d");
  canvas.width  = canvas.parentElement.offsetWidth || 240;
  canvas.height = 130;

  // Build last-7-day labels
  const dayLabels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dayLabels.push(["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]);
  }

  const data   = getWeeklyCaseCounts(); // real counts from localStorage
  const W = canvas.width, H = canvas.height;
  const padL = 28, padR = 8, padT = 10, padB = 24;
  const bw     = (W - padL - padR) / data.length;
  const maxVal = Math.max(...data, 1); // avoid /0

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = "#E8EAED"; ctx.lineWidth = 1;
  [0, 0.25, 0.5, 0.75, 1].forEach(f => {
    const y = padT + (H - padT - padB) * (1 - f);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
  });

  // Y-axis max label
  ctx.fillStyle = "#9AA0A6"; ctx.font = "9px DM Sans, sans-serif"; ctx.textAlign = "right";
  ctx.fillText(maxVal, padL - 4, padT + 4);

  data.forEach((val, i) => {
    const bh = (val / maxVal) * (H - padT - padB);
    const x  = padL + i * bw + bw * 0.15;
    const w  = bw * 0.7;
    const y  = H - padB - (bh || 0);
    ctx.fillStyle = val > 0 ? "#E53935" : "#E8EAED";
    ctx.beginPath();
    ctx.roundRect(x, y, w, Math.max(bh, 2), [3, 3, 0, 0]);
    ctx.fill();
    ctx.fillStyle = "#9AA0A6"; ctx.font = "10px DM Sans, sans-serif"; ctx.textAlign = "center";
    ctx.fillText(dayLabels[i], x + w / 2, H - 6);
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
const cases = getCases();
updateStats(cases);
renderTable("all");
renderWorkload();
window.addEventListener("load",   drawChart);
window.addEventListener("resize", drawChart);