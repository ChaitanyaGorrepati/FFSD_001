// js/superuser/superuser-cases.js

// ── Auth Guard ──────────────────────────────────────────
(function() {
  const _su = JSON.parse(sessionStorage.getItem("ct_user") || "null");
  if (!_su || _su.role !== "superuser") {
    window.location.href = "../role-selection.html";
  }
})();

// ── STATE ───────────────────────────────────────────────
let backendCases = [];
let backendUsers = [];
let currentStatusFilter = "all";
let currentDeptFilter = "";
let currentSearchQuery = "";

// ── DOM REFS ────────────────────────────────────────────
const tbody = document.getElementById("cases-table-body");
const caseModal = document.getElementById("case-modal");
const searchInput = document.getElementById("search-input");
const deptFilter = document.getElementById("dept-filter");

// ── HELPERS ─────────────────────────────────────────────
function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
}

function getCitizenName(citizenId) {
  if (!citizenId) return "—";
  const user = backendUsers.find(u => u.id === citizenId);
  return user ? user.name : `Citizen #${citizenId}`;
}

function getOfficerName(officerId) {
  if (!officerId) return "Unassigned";
  const user = backendUsers.find(u => u.id === officerId);
  return user ? user.name : `Officer #${officerId}`;
}

// ── BADGE ───────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    open: "badge-open",
    "in-progress": "badge-in-progress",
    resolved: "badge-resolved",
    closed: "badge-closed"
  };

  const label = {
    open: "Assigned",
    "in-progress": "In Progress",
    resolved: "Resolved",
    closed: "Closed"
  };

  return `<span class="badge ${map[status] || "badge-closed"}">${label[status] || status}</span>`;
}

function statusDisplayLabel(status) {
  const label = {
    open: "Assigned",
    "in-progress": "In Progress",
    resolved: "Resolved",
    closed: "Closed"
  };
  return label[status] || status || "—";
}

// ── FETCH DATA ──────────────────────────────────────────
async function loadData() {
  try {
    const [casesRes, usersRes] = await Promise.all([
      fetch("http://localhost:3000/cases", { headers: { role: "superuser" } }),
      fetch("http://localhost:3000/users", { headers: { role: "superuser" } })
    ]);

    if (casesRes.ok) {
      backendCases = await casesRes.json();
    }
    if (usersRes.ok) {
      backendUsers = await usersRes.json();
    }

    updateStatistics();
    renderTable();
  } catch (err) {
    console.error("Failed to load cases data:", err);
  }
}

// ── STATS ───────────────────────────────────────────────
function updateStatistics() {
  const total = backendCases.length;
  const open = backendCases.filter(c => c.status === "open").length;
  const progress = backendCases.filter(c => c.status === "in-progress").length;
  const resolved = backendCases.filter(c => c.status === "resolved").length;
  const closed = backendCases.filter(c => c.status === "closed").length;

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set("stat-total", total);
  set("stat-open", open);
  set("stat-in-progress", progress);
  set("stat-resolved", resolved);
  set("stat-closed", closed);
}

// ── FILTERING ───────────────────────────────────────────
function getFilteredCases() {
  return backendCases.filter(c => {
    // Status filter
    if (currentStatusFilter !== "all") {
      if (c.status !== currentStatusFilter) return false;
    }

    // Department filter
    if (currentDeptFilter) {
      if (!c.department || c.department.trim().toLowerCase() !== currentDeptFilter.trim().toLowerCase()) {
        return false;
      }
    }

    // Search query
    if (currentSearchQuery) {
      const q = currentSearchQuery.toLowerCase();
      const caseIdStr = String(c.id);
      const citizenName = getCitizenName(c.citizenId).toLowerCase();
      const category = (c.category || c.title || "").toLowerCase();
      const dept = (c.department || "").toLowerCase();
      const desc = (c.description || "").toLowerCase();

      const matches =
        caseIdStr.includes(q) ||
        citizenName.includes(q) ||
        category.includes(q) ||
        dept.includes(q) ||
        desc.includes(q);

      if (!matches) return false;
    }

    return true;
  });
}

function setStatusFilter(status) {
  currentStatusFilter = status;

  document.querySelectorAll("#status-filter .filter-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.status === status);
  });

  renderTable();
}

// Filter tabs click
document.getElementById("status-filter")?.addEventListener("click", e => {
  const tab = e.target.closest(".filter-tab");
  if (tab && tab.dataset.status) {
    setStatusFilter(tab.dataset.status);
  }
});

// Stat cards click
document.querySelectorAll(".stat-filter-btn").forEach(card => {
  card.addEventListener("click", () => {
    const status = card.dataset.status || "all";
    setStatusFilter(status);
  });
});

// Search input
searchInput?.addEventListener("input", e => {
  currentSearchQuery = e.target.value.trim();
  renderTable();
});

// Department filter select
deptFilter?.addEventListener("change", e => {
  currentDeptFilter = e.target.value.trim();
  renderTable();
});

// ── TABLE ───────────────────────────────────────────────
function renderTable() {
  const cases = getFilteredCases();

  if (!cases.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No cases found matching the criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = cases.map(c => `
    <tr>
      <td><span class="font-semibold">#${c.id}</span></td>
      <td>${getCitizenName(c.citizenId)}</td>
      <td>${c.category || c.title || "—"}</td>
      <td>${capitalize(c.department)}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</td>
      <td>
        <button class="action-btn view" data-id="${c.id}" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          View
        </button>
      </td>
    </tr>
  `).join("");
}

// ── TABLE EVENT DELEGATION ─────────────────────────────
tbody.addEventListener("click", e => {
  const viewBtn = e.target.closest(".action-btn.view");
  if (viewBtn) {
    const id = Number(viewBtn.dataset.id);
    openCaseModal(id);
  }
});

// ── VIEW CASE MODAL ─────────────────────────────────────
function openCaseModal(id) {
  const c = backendCases.find(x => x.id === id);
  if (!c) return;

  document.getElementById("view-case-id-display").value = `#${c.id}`;
  document.getElementById("view-citizen-name").value = getCitizenName(c.citizenId);
  document.getElementById("view-category").value = c.category || c.title || "—";
  document.getElementById("view-department").value = capitalize(c.department);
  document.getElementById("view-assigned-to").value = getOfficerName(c.assignedOfficerId);
  document.getElementById("view-status").value = statusDisplayLabel(c.status);
  document.getElementById("view-description").value = c.description || "No description provided.";
  document.getElementById("view-date-filed").value = c.createdAt
    ? new Date(c.createdAt).toLocaleString()
    : "—";

  caseModal.classList.remove("hidden");
}

function closeCaseModal() {
  caseModal.classList.add("hidden");
}

// ── MODAL CLOSE BUTTONS & BACKDROP ─────────────────────
document.getElementById("case-modal-close")?.addEventListener("click", closeCaseModal);
document.getElementById("btn-case-close")?.addEventListener("click", closeCaseModal);
caseModal?.addEventListener("click", e => {
  if (e.target === caseModal) closeCaseModal();
});

// ── INIT ────────────────────────────────────────────────
loadData();