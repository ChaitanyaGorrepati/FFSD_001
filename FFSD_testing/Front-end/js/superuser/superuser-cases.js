// js/superuser-cases.js
import { initCases, getCases, updateCase } from "../models/caseModel.js";

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
function statusBadge(status) {
  const map = {
    open:        "badge-open",
    "in-progress": "badge-in-progress",
    resolved:    "badge-resolved",
    closed:      "badge-closed"
  };
  const cls = map[status] || "badge-closed";
  const displayText = status === "in-progress" ? "In Progress" : capitalize(status);
  return `<span class="badge ${cls}">${displayText}</span>`;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
}

function updateStatistics() {
  const cases = getCases();
  const total = cases.length;
  const open = cases.filter(c => c.status === "open").length;
  const inProgress = cases.filter(c => c.status === "in-progress").length;
  const resolved = cases.filter(c => c.status === "resolved").length;
  const closed = cases.filter(c => c.status === "closed").length;

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
    cases = cases.filter(c => c.status === currentFilter);
  }
  
  // Apply department filter
  if (currentDeptFilter) {
    cases = cases.filter(c => c.department === currentDeptFilter);
  }
  
  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    cases = cases.filter(c => 
      c.id.toLowerCase().includes(query) || 
      c.citizenName.toLowerCase().includes(query)
    );
  }

  console.log("Filtered cases:", cases.length);

  if (!cases.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No cases found.</td></tr>`;
    return;
  }

  tbody.innerHTML = cases.map(c => `
    <tr>
      <td><span class="font-semibold">${c.id}</span></td>
      <td>${c.citizenName}</td>
      <td>${c.category}</td>
      <td>${c.department}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${new Date(c.dateFiled).toLocaleDateString()}</td>
      <td>
        <div class="flex gap-2">
          <button class="action-btn view" data-id="${c.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            View
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  // Attach row-level listeners
  const viewBtns = tbody.querySelectorAll(".action-btn.view");
  console.log("Found", viewBtns.length, "view buttons");
  viewBtns.forEach(btn => {
    const caseId = btn.dataset.id;
    console.log("Attaching click listener to view button for case:", caseId);
    btn.addEventListener("click", () => openViewModal(caseId));
  });
}

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
  document.getElementById("view-citizen-name").value = caseData.citizenName;
  document.getElementById("view-category").value = caseData.category;
  document.getElementById("view-department").value = caseData.department;
  document.getElementById("view-status").value = caseData.status === "in-progress" ? "In Progress" : capitalize(caseData.status);
  document.getElementById("view-description").value = caseData.description;
  document.getElementById("view-date-filed").value = new Date(caseData.dateFiled).toLocaleDateString();
  
  // Set current status in update dropdown
  document.getElementById("update-status").value = caseData.status;
  
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
  
  notesList.innerHTML = caseData.notes.map((note, idx) => `
    <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
      <div style="font-weight: 500; color: #0f172a;">${note.text}</div>
      <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">${new Date(note.timestamp).toLocaleString()}</div>
    </div>
  `).join("");
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
    // Update active filter tab to match
    document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
    document.querySelector(`.filter-tab[data-status="${status}"]`).classList.add("active");
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
window.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing cases...");
  initCases();
  const loadedCases = getCases();
  console.log("Loaded cases:", loadedCases);
  console.log("Number of cases:", loadedCases.length);
  updateStatistics();
  renderTable();
});
