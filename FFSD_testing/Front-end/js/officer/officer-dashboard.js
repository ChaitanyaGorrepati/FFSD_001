// js/officer/officer-dashboard.js

import {
  getOfficerSession,
  initOfficerUI,
  calcStats,
  updateSidebarBadges,
  statusBadge,
  priorityBadge,
  formatDate,
  updateNotifBadge,
  renderNotifPanel
} from "./officer-utils.js";

import {
  handleGetCases,
  handleUpdateCaseStatus
} from "../../controllers/caseController.js"; // ✅ NEW

// ── Session ───────────────────────────────────────
const user = getOfficerSession();
if (!user) throw new Error("No session");

// ── Init UI ───────────────────────────────────────
initOfficerUI(user);
updateSidebarBadges(user.id, user.name);
updateNotifBadge(user.id, user.name);

document.getElementById("welcome-name").textContent = user.name;

// ── Notification bell ─────────────────────────────
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

// ── State ─────────────────────────────────────────
let activeCaseId = null;
let backendCases = [];

// 🔥 NORMALIZE BACKEND → UI
function normalizeCases(data) {
  return data.map(c => ({
    ...c,
    id: String(c.id),

    status:
      c.status === "open" ? "Assigned" :
      c.status === "in-progress" ? "In Progress" :
      c.status === "closed" ? "Closed" :
      c.status,

    priority: c.priority || "Medium"
  }));
}

// ── Render ────────────────────────────────────────
function render() {
  const cases = backendCases;

  // Stats
  document.getElementById("stat-assigned").textContent =
    cases.filter(c => c.status === "Assigned").length;

  document.getElementById("stat-inprogress").textContent =
    cases.filter(c => c.status === "In Progress").length;

  document.getElementById("stat-resolved").textContent =
    cases.filter(c => c.status === "Closed").length;

  document.getElementById("stat-transferred").textContent =
    cases.filter(c => c.status === "Transferred").length;

  updateSidebarBadges(user.id, user.name);

  const tbody = document.getElementById("recent-cases-body");

  const recent = [...cases]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  if (!recent.length) {
    tbody.innerHTML =
      `<tr><td colspan="7" class="empty-state">No cases assigned yet.</td></tr>`;
    return;
  }

  // ✅ UI untouched
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

// ── STATUS MODAL (🔥 BACKEND FIXED) ───────────────
function openStatusModal(id) {
  activeCaseId = id;
  document.getElementById("sm-case-id").textContent = id;
  document.getElementById("status-modal").classList.add("active");
}

function closeStatusModal() {
  document.getElementById("status-modal").classList.remove("active");
  activeCaseId = null;
}

async function saveStatus() {
  const val = document.querySelector('input[name="status"]:checked')?.value;
  if (!val || !activeCaseId) return;

  try {
    await handleUpdateCaseStatus(activeCaseId, val);
    await init(); // reload
  } catch (err) {
    console.error("Status update failed:", err);
  }

  closeStatusModal();
}

window.openStatusModal = openStatusModal;
window.closeStatusModal = closeStatusModal;
window.saveStatus = saveStatus;

// ── INIT (🔥 MAIN FIX) ────────────────────────────
async function init() {
  try {
    const data = await handleGetCases("officer", String(user.id));
    backendCases = normalizeCases(data);
    render();
  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

init();

// ── Logout ───────────────────────────────────────
window.logout = function() {
  sessionStorage.removeItem("ct_user");
  sessionStorage.removeItem("ct_selected_role");
  window.location.href = "../index.html";
};