// js/officer/officer-dashboard.js
import {
  getOfficerSession,
  initOfficerUI,
  calcStats,
  updateSidebarBadges,
  statusBadge,
  priorityBadge,
  formatDate,
  updateCaseById,
  getCaseById,
  getAllCases,
  updateNotifBadge,
  renderNotifPanel
} from "./officer-utils.js";

// ── Session ───────────────────────────────────────────────────────────────────
const user = getOfficerSession();
if (!user) throw new Error("No session");

// ── Init UI ───────────────────────────────────────────────────────────────────
initOfficerUI(user);
updateSidebarBadges(user.id, user.name);
updateNotifBadge(user.id, user.name);

document.getElementById("welcome-name").textContent = user.name;

// ── Notification bell ─────────────────────────────────────────────────────────
document.getElementById("notif-btn")?.addEventListener("click", e => {
  e.stopPropagation();
  const panel = document.getElementById("notif-panel");
  if (!panel) return;
  const isOpen = panel.style.display === "block";
  panel.style.display = isOpen ? "none" : "block";
  if (!isOpen) renderNotifPanel(user.id, user.name);
});
document.addEventListener("click", () => {
  const panel = document.getElementById("notif-panel");
  if (panel) panel.style.display = "none";
});

// ── State ─────────────────────────────────────────────────────────────────────
let activeCaseId = null;

// ── Helper: get this officer's cases (id OR name fallback) ────────────────────
function getMyCases() {
  return getAllCases().filter(c =>
    c.assignedTo === user.id || c.assignedTo === user.name
  );
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  const cases = getMyCases();

  // Stats — includes Closed in addition to the standard four
  document.getElementById("stat-assigned").textContent    =
    cases.filter(c => c.status === "Assigned").length;
  document.getElementById("stat-inprogress").textContent  =
    cases.filter(c => c.status === "In Progress").length;
  document.getElementById("stat-resolved").textContent    =
    cases.filter(c => c.status === "Resolved").length;
  document.getElementById("stat-transferred").textContent =
    cases.filter(c => c.status === "Transferred").length;
    

  updateSidebarBadges(user.id, user.name);

  const tbody  = document.getElementById("recent-cases-body");
  const recent = [...cases]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  if (!recent.length) {
    tbody.innerHTML =
      `<tr><td colspan="7" class="empty-state">No cases assigned yet.</td></tr>`;
    return;
  }

  // Use onclick strings so they work with the existing HTML modal buttons too
  tbody.innerHTML = recent.map(c => `
    <tr>
      <td>
        <span style="font-family:'DM Mono',monospace;font-size:12.5px;
                     color:var(--text-secondary);">${c.id}</span>
      </td>
      <td style="max-width:160px;white-space:nowrap;overflow:hidden;
                 text-overflow:ellipsis;font-weight:500;">${c.title || "—"}</td>
      <td>${c.category || "—"}</td>
      <td>${priorityBadge(c.priority)}</td>
      <td>${statusBadge(c.status)}</td>
      <td style="color:var(--text-secondary);font-size:13px;">
        ${formatDate(c.createdAt)}
      </td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-outline btn-xs"
                  onclick="openPriorityModal('${c.id}')">Priority</button>
          <button class="btn btn-outline btn-xs"
                  onclick="openStatusModal('${c.id}')">Status</button>
          <a href="officer-case-details.html?id=${c.id}"
             class="btn btn-xs" style="background:var(--red);color:#fff;">Open</a>
        </div>
      </td>
    </tr>
  `).join("");
}

render();

// ══════════════════════════════════════════════════════════════════════════════
// Priority Modal
// ══════════════════════════════════════════════════════════════════════════════
function openPriorityModal(id) {
  activeCaseId = id;
  const pmId = document.getElementById("pm-case-id");
  if (pmId) pmId.textContent = id;

  const c = getCaseById(id);
  document.querySelectorAll('input[name="priority"]').forEach(r => {
    r.checked = c ? r.value === (c.priority || "Medium") : false;
  });
  document.getElementById("priority-modal").classList.add("active");
}

function closePriorityModal() {
  document.getElementById("priority-modal").classList.remove("active");
  activeCaseId = null;
}

function savePriority() {
  const val = document.querySelector('input[name="priority"]:checked')?.value;
  if (!val || !activeCaseId) return;
  updateCaseById(activeCaseId, { priority: val });
  closePriorityModal();
  render();
}

// Overlay click to close
document.getElementById("priority-modal").addEventListener("click", function(e) {
  if (e.target === this) closePriorityModal();
});

// Expose on window — required because modal buttons use onclick="..." in HTML
window.openPriorityModal  = openPriorityModal;
window.closePriorityModal = closePriorityModal;
window.savePriority       = savePriority;

// ══════════════════════════════════════════════════════════════════════════════
// Status Modal
// ══════════════════════════════════════════════════════════════════════════════
function openStatusModal(id) {
  activeCaseId = id;
  const smId = document.getElementById("sm-case-id");
  if (smId) smId.textContent = id;

  const c = getCaseById(id);
  // Pre-select the current status radio — including Closed
  document.querySelectorAll('input[name="status"]').forEach(r => {
    r.checked = c ? r.value === (c.status || "Assigned") : false;
  });
  document.getElementById("status-modal").classList.add("active");
}

function closeStatusModal() {
  document.getElementById("status-modal").classList.remove("active");
  activeCaseId = null;
}

function saveStatus() {
  const val = document.querySelector('input[name="status"]:checked')?.value;
  if (!val || !activeCaseId) return;
  updateCaseById(activeCaseId, { status: val });
  closeStatusModal();
  render();
}

// Overlay click to close
document.getElementById("status-modal").addEventListener("click", function(e) {
  if (e.target === this) closeStatusModal();
});

// Expose on window — required because modal buttons use onclick="..." in HTML
window.openStatusModal  = openStatusModal;
window.closeStatusModal = closeStatusModal;
window.saveStatus       = saveStatus;

// ── Global logout (sidebar button uses onclick="logout()") ────────────────────
window.logout = function() {
  sessionStorage.removeItem("ct_user");
  sessionStorage.removeItem("ct_selected_role");
  window.location.href = "../../index.html";
};