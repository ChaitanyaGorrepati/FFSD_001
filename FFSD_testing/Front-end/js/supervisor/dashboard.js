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

// ── Guard ─────────────────────────────────────────────────────────────────────
const supervisor = getLoggedInSupervisor();
if (!supervisor || supervisor.role !== "supervisor") {
  window.location.href = "../../views/role-selection.html";
}

// ── Identity ──────────────────────────────────────────────────────────────────
function applyIdentity() {
  if (!supervisor) return;
  const initials = supervisor.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("sidebar-avatar", initials);
  set("sidebar-name",   supervisor.name);
  set("sidebar-role",   `Supervisor – ${supervisor.department}`);
  set("topbar-avatar",  initials);
  set("topbar-name",    supervisor.name);
  set("dept-label",     supervisor.department);
}
applyIdentity();

// ── Month label ───────────────────────────────────────────────────────────────
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const monthEl = document.getElementById("current-month");
if (monthEl) monthEl.textContent = `${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

// ── Stats ─────────────────────────────────────────────────────────────────────
// Active = Assigned + Accepted + In Progress  (everything not yet resolved/closed)
// Transferred = cases with a transfer request
// Closed = Resolved + Closed
function updateStats(cases) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("stat-dept",     cases.length);
  set("stat-active",   cases.filter(c => ["Assigned","Accepted","In Progress","Waiting For Citizen"].includes(c.status)).length);
  set("stat-transfer", cases.filter(c => c.transfer?.requested).length);
  set("stat-closed",   cases.filter(c => ["Resolved","Closed"].includes(c.status)).length);
}

// ── Table ─────────────────────────────────────────────────────────────────────
const tbody = document.getElementById("cases-tbody");
let currentFilter = "all";

function renderTable(filter = "all") {
  let cases = getCases();
  if (filter === "active")     cases = cases.filter(c => ["Assigned","Accepted","In Progress","Waiting For Citizen"].includes(c.status));
  if (filter === "unassigned") cases = cases.filter(c => !c.assignedTo);
  const recent = cases.slice(0, 10);
  if (!tbody) return;

  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-td">
      No ${supervisor?.department || ""} cases yet. Cases appear once a citizen files a complaint and an officer acts on it.
    </td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(c => {
    const officerName = resolveOfficerName(c.assignedTo) || "Unassigned";
    return `
    <tr>
      <td><a class="case-id-link" href="case-details.html?id=${c.id}">${c.id}</a></td>
      <td class="citizen-cell">${c.citizen || "—"}</td>
      <td>${c.category}</td>
      <td>${c.assignedTo
          ? `<em class="officer-name">${officerName}</em>`
          : `<span class="text-muted">Unassigned</span>`}</td>
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

// ── Workload ──────────────────────────────────────────────────────────────────
const workloadList = document.getElementById("workload-list");
function renderWorkload() {
  if (!workloadList) return;
  const officers = getOfficersWorkload();
  if (!officers.length) {
    workloadList.innerHTML = `<p class="text-muted" style="padding:12px 20px;font-size:13px;">No officer data available.</p>`;
    return;
  }
  workloadList.innerHTML = officers.map(o => {
    const pct      = Math.round((o.assigned / o.max) * 100);
    const barColor = pct >= 90 ? "bar-red" : pct >= 50 ? "bar-blue" : "bar-green";
    return `
      <div class="workload-item">
        <div class="workload-top">
          <span class="workload-name">${o.name} <small class="zone-tag">(${o.zone})</small></span>
          <span class="workload-count">${o.assigned}/${o.max}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill ${barColor}" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join("");
}

// ── Weekly chart ──────────────────────────────────────────────────────────────
function drawChart() {
  const canvas = document.getElementById("weekChart");
  if (!canvas) return;
  const ctx    = canvas.getContext("2d");
  canvas.width  = canvas.parentElement.offsetWidth || 240;
  canvas.height = 130;

  const dayLabels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dayLabels.push(["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]);
  }

  const data   = getWeeklyCaseCounts();
  const W = canvas.width, H = canvas.height;
  const padL = 28, padR = 8, padT = 10, padB = 24;
  const bw     = (W - padL - padR) / data.length;
  const maxVal = Math.max(...data, 1);

  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = "#E8EAED"; ctx.lineWidth = 1;
  [0, 0.25, 0.5, 0.75, 1].forEach(f => {
    const y = padT + (H - padT - padB) * (1 - f);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
  });
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