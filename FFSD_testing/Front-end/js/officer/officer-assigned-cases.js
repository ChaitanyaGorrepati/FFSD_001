// js/officer-assigned-cases.js
import {
  getOfficerSession, initOfficerUI, getOfficerCases,
  calcStats, updateSidebarBadges, statusBadge, priorityBadge,
  formatDate, updateCaseById, getCaseById
} from "./officer-utils.js";

const user = getOfficerSession();
if (!user) throw new Error("No session");

initOfficerUI(user);
updateSidebarBadges(user.id);

// ── State ─────────────────────────────────────────────────────────────────────
let activeCaseId  = null;
let activeFilter  = "all";
let searchQuery   = "";

// ── Filter tabs ───────────────────────────────────────────────────────────────
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

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  let cases = getOfficerCases(user.id);
  const stats = calcStats(cases);

  document.getElementById("stat-assigned").textContent    = stats.assigned;
  document.getElementById("stat-inprogress").textContent  = stats.inProgress;
  document.getElementById("stat-resolved").textContent    = stats.resolved;
  document.getElementById("stat-transferred").textContent = stats.transferred;
  

  updateSidebarBadges(user.id);

  // Filter by status tab
  if (activeFilter !== "all") {
    cases = cases.filter(c => c.status === activeFilter);
  }

  // Filter by search
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

render();

// ── Priority Modal ─────────────────────────────────────────────────────────────
window.openPriorityModal = function(id) {
  activeCaseId = id;
  document.getElementById("pm-case-id").textContent = id;
  const c = getCaseById(id);
  if (c && c.priority) {
    document.querySelectorAll('input[name="priority"]').forEach(r => {
      r.checked = r.value === c.priority;
    });
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

// ── Status Modal ───────────────────────────────────────────────────────────────
window.openStatusModal = function(id) {
  activeCaseId = id;
  document.getElementById("sm-case-id").textContent = id;
  const c = getCaseById(id);
  if (c && c.status) {
    document.querySelectorAll('input[name="status"]').forEach(r => {
      r.checked = r.value === c.status;
    });
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