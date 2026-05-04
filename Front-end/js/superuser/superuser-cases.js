// js/superuser/superuser-cases.js
import { initCases, getCases, updateCase, deleteCase } from "../../models/caseModel.js";
import { getUsers } from "../../models/userModel.js";

// ── Auth Guard (runs after imports) ──────────────────────────────────────────
(function() {
  const _su = JSON.parse(sessionStorage.getItem("ct_user") || "null");
  if (!_su || _su.role !== "superuser") {
    window.location.href = "../role-selection.html";
  }
})();



// ── State ──────────────────────────────────────────────
let currentFilter = "all";
let currentDeptFilter = "";
let searchQuery = "";
let currentViewingCaseId = null;

// ── DOM refs ───────────────────────────────────────────
const tbody       = document.getElementById("cases-table-body");
const caseModal   = document.getElementById("case-modal");
const modalTitle  = document.getElementById("case-modal-title");
const searchInput = document.getElementById("search-input");
const deptFilter  = document.getElementById("dept-filter");

// ── Helpers ────────────────────────────────────────────

// ── Resolve citizen name from id ───────────────────────
function resolveCitizenName(citizenId) {
  if (!citizenId) return "Unknown";
  const users = getUsers();
  const user = users.find(u => u.id === citizenId);
  return user ? user.name : citizenId;
}

function resolveAssigneeName(userId) {
  if (!userId) return "Unassigned";
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  return user ? user.name : "Unknown Officer";
}

function statusBadge(status) {
  const map = {
    "Assigned":    "badge-assigned",
    "In Progress": "badge-progress",
    "Resolved":    "badge-resolved",
    "Closed":      "badge-closed",
    "Pending":     "badge-pending",
    "Transferred": "badge-closed",
    "Rejected":    "badge-closed"
  };
  const cls = map[status] || "badge-closed";
  return `<span class="badge ${cls}">${status || "Unknown"}</span>`;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
}

function updateStatistics() {
  const cases = getCases();
  const total = cases.length;
  const open = cases.filter(c => ["Assigned", "Pending"].includes(c.status)).length;
  const inProgress = cases.filter(c => c.status === "In Progress").length;
  const resolved = cases.filter(c => c.status === "Resolved").length;
  const closed = cases.filter(c => ["Closed", "Transferred", "Rejected"].includes(c.status)).length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-open").textContent = open;
  document.getElementById("stat-in-progress").textContent = inProgress;
  document.getElementById("stat-resolved").textContent = resolved;
  document.getElementById("stat-closed").textContent = closed;
}

// ── Render Table ───────────────────────────────────────
function renderTable() {
  let cases = getCases();
  console.log("renderTable called, total cases:", cases.length);
  
  // Apply status filter
  if (currentFilter !== "all") {
    if (currentFilter === "Assigned") {
      cases = cases.filter(c => ["Assigned", "Pending"].includes(c.status));
    } else {
      cases = cases.filter(c => c.status === currentFilter);
    }
  }
  
  // Apply department filter
  if (currentDeptFilter) {
    cases = cases.filter(c => c.department === currentDeptFilter);
  }
  
  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    cases = cases.filter(c => {
      const citizenName = resolveCitizenName(c.citizenId || c.submittedBy);
      return c.id.toLowerCase().includes(query) ||
             citizenName.toLowerCase().includes(query) ||
             (c.title || "").toLowerCase().includes(query);
    });
  }

  console.log("Filtered cases:", cases.length);

  if (!cases.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No cases found.</td></tr>`;
    return;
  }

  tbody.innerHTML = cases.map(c => {
    const citizenName = resolveCitizenName(c.citizenId || c.submittedBy);
    const dateStr = c.dateFiled || c.createdAt;
    return `
    <tr>
      <td><span class="font-semibold">${c.id}</span></td>
      <td>${citizenName}</td>
      <td>${c.category || c.title || "—"}</td>
      <td>${c.department || "—"}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${dateStr ? new Date(dateStr).toLocaleDateString("en-IN") : "—"}</td>
      <td>
        <div class="flex gap-2">
          <button class="action-btn view" data-id="${c.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            View
          </button>
          <button class="action-btn delete" data-id="${c.id}" style="color: #ef4444; border-color: #fca5a5; background: #fef2f2;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            Delete
          </button>
        </div>
      </td>
    </tr>`;
  }).join("");

}

// Event Delegation for Table Buttons
tbody.addEventListener("click", e => {
  const viewBtn = e.target.closest(".action-btn.view");
  const deleteBtn = e.target.closest(".action-btn.delete");
  
  if (viewBtn) {
    const caseId = viewBtn.dataset.id;
    openViewModal(caseId);
  } else if (deleteBtn) {
    const caseId = deleteBtn.dataset.id;
    if (confirm(`Are you sure you want to delete case ${caseId}? This action cannot be undone.`)) {
      deleteCase(caseId);
      updateStatistics();
      renderTable();
    }
  }
});

// ── Open View Modal ────────────────────────────────────
function openViewModal(id) {
  console.log("Opening view modal for case:", id);
  const cases = getCases();
  const caseData = cases.find(c => c.id === id);
  
  if (!caseData) {
    console.error("Case not found with id:", id);
    return;
  }

  currentViewingCaseId = id;
  modalTitle.textContent = `Case ${id}`;
  document.getElementById("view-case-id").value = id;
  document.getElementById("view-case-id-display").value = caseData.id;
  document.getElementById("view-citizen-name").value = resolveCitizenName(caseData.citizenId || caseData.submittedBy);
  document.getElementById("view-category").value = caseData.category || caseData.title || "—";
  document.getElementById("view-department").value = caseData.department;
  document.getElementById("view-assigned-to").value = resolveAssigneeName(caseData.officerId || caseData.assignedTo);
  document.getElementById("view-status").value = caseData.status || "—";
  document.getElementById("view-description").value = caseData.description;
  document.getElementById("view-date-filed").value = new Date(caseData.dateFiled).toLocaleDateString();
  
  // Set current status in update dropdown
  const updateSel = document.getElementById("update-status");
  const realStatus = caseData.status;
  updateSel.value = realStatus;
  if (!updateSel.value) updateSel.value = "Assigned"; // fallback
  
  // Clear note input
  document.getElementById("add-note").value = "";
  
  // Load existing notes
  loadNotes(caseData);
  
  caseModal.classList.remove("hidden");
  console.log("Modal opened successfully");
}

function loadNotes(caseData) {
  const notesList = document.getElementById("notes-list");
  if (!caseData.notes || caseData.notes.length === 0) {
    notesList.innerHTML = '<span style="color: #9ca3af;">No notes yet.</span>';
    return;
  }
  
  notesList.innerHTML = caseData.notes.map((note, idx) => {
    // Notes can be objects {text/label, timestamp} or plain strings
    const text = typeof note === "string" ? note : (note.text || note.label || JSON.stringify(note));
    const ts = note.timestamp ? new Date(note.timestamp).toLocaleString("en-IN") : "";
    return `<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e5e7eb;">
      <div style="font-weight:500;color:#0f172a;">${text}</div>
      ${ts ? `<div style="font-size:12px;color:#9ca3af;margin-top:4px;">${ts}</div>` : ""}
    </div>`;
  }).join("");
}

function closeCaseModal() {
  caseModal.classList.add("hidden");
  currentViewingCaseId = null;
}

// ── Status Filter Tabs ──────────────────────────────────
document.getElementById("status-filter").addEventListener("click", e => {
  const tab = e.target.closest(".filter-tab");
  if (!tab) return;
  document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
  currentFilter = tab.dataset.status;
  renderTable();
});

// ── Statistics Card Filters ─────────────────────────────
document.querySelectorAll(".stat-filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const status = btn.dataset.status;
    document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
    const matchTab = document.querySelector(`.filter-tab[data-status="${status}"]`);
    if (matchTab) matchTab.classList.add("active");
    currentFilter = status;
    renderTable();
  });
});

// ── Search Input ────────────────────────────────────────
searchInput.addEventListener("input", e => {
  searchQuery = e.target.value;
  renderTable();
});

// ── Department Filter ────────────────────────────────────
deptFilter.addEventListener("change", e => {
  currentDeptFilter = e.target.value;
  renderTable();
});

// ── Status Update ────────────────────────────────────────
document.getElementById("btn-update-status").addEventListener("click", () => {
  if (!currentViewingCaseId) return;
  
  const newStatus = document.getElementById("update-status").value;
  const cases = getCases();
  const caseData = cases.find(c => c.id === currentViewingCaseId);
  
  if (caseData) {
    // Initialize notes array if it doesn't exist
    if (!caseData.notes) {
      caseData.notes = [];
    }
    
    // Add automatic note about status change
    caseData.notes.push({
      text: `Status changed from ${capitalize(caseData.status)} to ${capitalize(newStatus)}`,
      timestamp: new Date().toISOString()
    });
    
    updateCase(currentViewingCaseId, { 
      status: newStatus,
      notes: caseData.notes
    });
    
    console.log("Case status updated to:", newStatus);
    alert("Case status updated successfully!");
    closeCaseModal();
    updateStatistics();
    renderTable();
  }
});

// ── Add Notes ────────────────────────────────────────────
document.getElementById("btn-add-note").addEventListener("click", () => {
  if (!currentViewingCaseId) return;
  
  const noteText = document.getElementById("add-note").value.trim();
  if (!noteText) {
    alert("Please enter a note before adding.");
    return;
  }
  
  const cases = getCases();
  const caseData = cases.find(c => c.id === currentViewingCaseId);
  
  if (caseData) {
    // Initialize notes array if it doesn't exist
    if (!caseData.notes) {
      caseData.notes = [];
    }
    
    caseData.notes.push({
      text: noteText,
      timestamp: new Date().toISOString()
    });
    
    updateCase(currentViewingCaseId, { notes: caseData.notes });
    
    console.log("Note added successfully");
    alert("Note added successfully!");
    
    // Clear input and reload notes
    document.getElementById("add-note").value = "";
    loadNotes(caseData);
  }
});

// ── Button bindings ────────────────────────────────────
document.getElementById("case-modal-close").addEventListener("click", closeCaseModal);
document.getElementById("btn-case-close").addEventListener("click", closeCaseModal);

// Close on overlay click
caseModal.addEventListener("click", e => { if (e.target === caseModal) closeCaseModal(); });

// ── Init ───────────────────────────────────────────────
// Init directly (scripts at bottom of body)
(function() {
  console.log("Initializing cases...");
  initCases();
  const loadedCases = getCases();
  console.log("Loaded cases:", loadedCases);
  console.log("Number of cases:", loadedCases.length);
  updateStatistics();
  renderTable();
})();
