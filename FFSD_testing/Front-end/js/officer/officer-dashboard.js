// js/officer-dashboard.js
import {
  getOfficerSession, initOfficerUI, getOfficerCases,
  calcStats, updateSidebarBadges, statusBadge, priorityBadge,
  formatDate, updateCaseById, getCaseById,
  // ▼ ADDED: notification helpers
  updateNotifBadge, renderNotifPanel
} from "./officer-utils.js";

const user = getOfficerSession();
if (!user) throw new Error("No session");

initOfficerUI(user);
updateSidebarBadges(user.id);

// ▼ ADDED: update notification bell badge on page load
updateNotifBadge(user.id);

// ▼ ADDED: toggle notification panel on bell click
document.getElementById("notif-btn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  const panel = document.getElementById("notif-panel");
  if (!panel) return;
  const isOpen = panel.style.display === "block";
  panel.style.display = isOpen ? "none" : "block";
  if (!isOpen) renderNotifPanel(user.id);
});
document.addEventListener("click", () => {
  const panel = document.getElementById("notif-panel");
  if (panel) panel.style.display = "none";
});
// ▲ END ADDED

// Welcome name
document.getElementById("welcome-name").textContent = user.name;

// ── State ────────────────────────────────────────────────────────────────────
let activeCaseId = null;

// ── Render ───────────────────────────────────────────────────────────────────
function render() {
  const cases = getOfficerCases(user.id);
  const stats = calcStats(cases);

  document.getElementById("stat-assigned").textContent   = stats.assigned;
  document.getElementById("stat-inprogress").textContent = stats.inProgress;
  document.getElementById("stat-resolved").textContent   = stats.resolved;
  document.getElementById("stat-transferred").textContent = stats.transferred;

  updateSidebarBadges(user.id);

  const tbody = document.getElementById("recent-cases-body");
  const recent = [...cases].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

  if (!recent.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No cases assigned yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(c => `
    <tr>
      <td><span class="font-mono" style="font-size:12.5px;color:var(--text-secondary);">${c.id}</span></td>
      <td style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500;">${c.title || "—"}</td>
      <td>${c.category || "—"}</td>
      <td>${priorityBadge(c.priority)}</td>
      <td>${statusBadge(c.status)}</td>
      <td style="color:var(--text-secondary);font-size:13px;">${formatDate(c.createdAt)}</td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-outline btn-xs" onclick="openPriorityModal('${c.id}')">Priority</button>
          <button class="btn btn-outline btn-xs" onclick="openStatusModal('${c.id}')">Status</button>
          <a href="officer-case-details.html?id=${c.id}" class="btn btn-xs" style="background:var(--red);color:#fff;">Open</a>
        </div>
      </td>
    </tr>
  `).join("");
}

render();

// ── Priority Modal ────────────────────────────────────────────────────────────
window.openPriorityModal = function(id) {
  activeCaseId = id;
  document.getElementById("pm-case-id").textContent = id;
  const c = getCaseById(id);
  if (c && c.priority) {
    const radios = document.querySelectorAll('input[name="priority"]');
    radios.forEach(r => { r.checked = r.value === c.priority; });
  }
  document.getElementById("priority-modal").classList.add("active");
};

window.closePriorityModal = function() {
  document.getElementById("priority-modal").classList.remove("active");
  activeCaseId = null;
};

window.savePriority = function() {
  const val = document.querySelector('input[name="priority"]:checked')?.value;
  if (!val || !activeCaseId) return;
  updateCaseById(activeCaseId, { priority: val });
  closePriorityModal();
  render();
};

// ── Status Modal ──────────────────────────────────────────────────────────────
window.openStatusModal = function(id) {
  activeCaseId = id;
  document.getElementById("sm-case-id").textContent = id;
  const c = getCaseById(id);
  if (c && c.status) {
    const radios = document.querySelectorAll('input[name="status"]');
    radios.forEach(r => { r.checked = r.value === c.status; });
  }
  document.getElementById("status-modal").classList.add("active");
};

window.closeStatusModal = function() {
  document.getElementById("status-modal").classList.remove("active");
  activeCaseId = null;
};

window.saveStatus = function() {
  const val = document.querySelector('input[name="status"]:checked')?.value;
  if (!val || !activeCaseId) return;
  updateCaseById(activeCaseId, { status: val });
  closeStatusModal();
  render();
};

// Close modals on overlay click
document.getElementById("priority-modal").addEventListener("click", function(e) {
  if (e.target === this) closePriorityModal();
});
document.getElementById("status-modal").addEventListener("click", function(e) {
  if (e.target === this) closeStatusModal();
});