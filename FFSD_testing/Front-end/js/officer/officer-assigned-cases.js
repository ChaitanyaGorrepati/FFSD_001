// js/officer-assigned-cases.js

import {
  getOfficerSession, initOfficerUI,
  calcStats, updateSidebarBadges, statusBadge, priorityBadge,
  formatDate
} from "./officer-utils.js";

import {
  handleGetCases,
  handleGetCaseById,
  handleUpdateCaseStatus
} from "../../controllers/caseController.js"; // ✅ NEW

const user = getOfficerSession();
if (!user) throw new Error("No session");

initOfficerUI(user);
updateSidebarBadges(user.id);

// ── State ─────────────────────────────────────────
let activeCaseId = null;
let activeFilter = "all";
let searchQuery = "";

// 🔥 BACKEND DATA
let backendCases = [];

// ── NORMALIZE ─────────────────────────────────────
function normalizeCases(data) {
  return data.map(c => ({
    ...c,
    id: String(c.id),

    status:
      c.status === "open" ? "assigned" :
      c.status === "in-progress" ? "inprogress" :
      c.status === "resolved" ? "resolved" :
      c.status === "closed" ? "closed" :
      c.status,

    priority: c.priority || "medium"
  }));
}

// ── Filter tabs ───────────────────────────────────
window.setFilter = function(el, filter) {
  document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
  activeFilter = filter;
  render();
};

window.filterCases = function() {
  searchQuery = document.getElementById("search-input").value.toLowerCase();
  render();
};

// ── Render ─────────────────────────────────────────
function render() {
  let cases = backendCases;

  const stats = calcStats(cases);

  document.getElementById("stat-assigned").textContent    = stats.assigned;
  document.getElementById("stat-inprogress").textContent  = stats.inProgress;
  document.getElementById("stat-resolved").textContent    = stats.resolved;
  document.getElementById("stat-transferred").textContent = stats.transferred;

  updateSidebarBadges(user.id);

  if (activeFilter !== "all") {
    cases = cases.filter(c => c.status === activeFilter);
  }

  if (searchQuery) {
    cases = cases.filter(c =>
      c.id.toLowerCase().includes(searchQuery) ||
      (c.title || "").toLowerCase().includes(searchQuery) ||
      (c.department || "").toLowerCase().includes(searchQuery) ||
      (c.category || "").toLowerCase().includes(searchQuery)
    );
  }

  cases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const tbody = document.getElementById("cases-body");

  if (!cases.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No cases found.</td></tr>`;
    return;
  }

  // ✅ UI EXACT SAME
  tbody.innerHTML = cases.map(c => `
    <tr>
      <td><span class="font-mono" style="font-size:12.5px;color:var(--text-secondary);">${c.id}</span></td>
      <td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500;">${c.title || "—"}</td>
      <td>${c.department || "—"}</td>
      <td>${c.zone || "—"}</td>
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

// ── Priority Modal (UI untouched, no backend yet) ──
window.openPriorityModal = function(id) {
  activeCaseId = id;
  document.getElementById("pm-case-id").textContent = id;
  document.getElementById("priority-modal").classList.add("active");
};

window.closePriorityModal = function() {
  document.getElementById("priority-modal").classList.remove("active");
  activeCaseId = null;
};

window.savePriority = function() {
  closePriorityModal();
};

// ── Status Modal (🔥 BACKEND CONNECTED) ────────────
window.openStatusModal = function(id) {
  activeCaseId = id;
  document.getElementById("sm-case-id").textContent = id;
  document.getElementById("status-modal").classList.add("active");
};

window.closeStatusModal = function() {
  document.getElementById("status-modal").classList.remove("active");
  activeCaseId = null;
};

window.saveStatus = async function() {
  const val = document.querySelector('input[name="status"]:checked')?.value;
  if (!val || !activeCaseId) return;

  // 🔥 MAP UI → BACKEND
  const statusMap = {
    assigned: "open",
    inprogress: "in-progress",
    resolved: "resolved",
    closed: "closed"
  };

  try {
    await handleUpdateCaseStatus(activeCaseId, statusMap[val] || val);
    await init(); // reload
  } catch (err) {
    console.error("Status update failed:", err);
  }

  closeStatusModal();
};

// ── INIT (🔥 MAIN FIX) ─────────────────────────────
async function init() {
  try {
    const data = await handleGetCases("officer", String(user.id));

    backendCases = normalizeCases(data);

    render();

  } catch (err) {
    console.error("Officer fetch error:", err);
  }
}

init();

// Close modals
document.getElementById("priority-modal").addEventListener("click", function(e) {
  if (e.target === this) closePriorityModal();
});
document.getElementById("status-modal").addEventListener("click", function(e) {
  if (e.target === this) closeStatusModal();
});