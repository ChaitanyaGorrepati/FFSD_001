// officer/js/dashboard.js
import { getCases, updateCase } from '../../models/caseModel.js';

// Get current officer from session
let CURRENT_OFFICER = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Check login
  const user = JSON.parse(sessionStorage.getItem('ct_user') || 'null');
  if (!user || user.role !== 'officer') {
    window.location.href = '../login.html';
    return;
  }
  
  CURRENT_OFFICER = user;
  loadDashboard();
  setupEventListeners();
});

function loadDashboard() {
  // Update officer name in UI
  document.getElementById('officerName').textContent = CURRENT_OFFICER.name;
  document.getElementById('topbarName').textContent = CURRENT_OFFICER.name;
  document.getElementById('headerOfficerName').textContent = CURRENT_OFFICER.name;
  document.getElementById('headerDept').textContent = `${CURRENT_OFFICER.department} Division`;
  
  // Update avatar
  const avatars = document.querySelectorAll('.avatar');
  avatars.forEach(avatar => {
    avatar.textContent = CURRENT_OFFICER.name.charAt(0).toUpperCase();
  });

  // Load cases
  const allCases = getCases();
  const myCases = allCases.filter(c => c.assignedTo === CURRENT_OFFICER.id);

  // Update stats
  updateStats(myCases);

  // Render cases table
  renderCasesTable(myCases);
}

function updateStats(cases) {
  const assigned = cases.filter(c => c.status === 'Assigned').length;
  const inProgress = cases.filter(c => c.status === 'In Progress').length;
  const resolved = cases.filter(c => c.status === 'Resolved').length;
  const awaiting = cases.filter(c => c.status === 'Waiting For Citizen').length;

  document.getElementById('statAssigned').textContent = assigned;
  document.getElementById('statInProgress').textContent = inProgress;
  document.getElementById('statResolved').textContent = resolved;
  document.getElementById('statAwaiting').textContent = awaiting;
  document.getElementById('assignedCount').textContent = cases.length;
}

function renderCasesTable(cases) {
  const tbody = document.getElementById('casesTable');
  
  if (cases.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          No cases assigned to you yet.
        </td>
      </tr>
    `;
    return;
  }

  // Sort by priority and date
  const sortedCases = cases.sort((a, b) => {
    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
  });

  tbody.innerHTML = sortedCases.map(c => {
    const caseAge = getCaseAge(c.createdAt);
    
    return `
      <tr style="cursor: pointer;" onclick="window.location.href='case-detail.html?id=${c.id}'">
        <td>
          <span class="font-mono text-sm" style="color: var(--blue); font-weight: 600;">${c.id}</span>
        </td>
        <td>${c.citizenName || 'Unknown Citizen'}</td>
        <td>${c.category || c.title}</td>
        <td class="text-muted text-sm">${c.zone}</td>
        <td>
          <span class="badge ${getPriorityBadgeClass(c.priority || 'Medium')}">
            ${c.priority || 'Medium'}
          </span>
        </td>
        <td>
          <span class="badge ${getStatusBadgeClass(c.status)}">
            ${c.status}
          </span>
        </td>
        <td class="text-sm text-muted">${formatDate(c.createdAt)}</td>
        <td class="text-sm">${caseAge}</td>
        <td>
          <button class="btn btn-primary btn-xs" onclick="event.stopPropagation(); openCaseDetail('${c.id}')">
            Open
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function getPriorityBadgeClass(priority) {
  const map = {
    'High': 'badge-high',
    'Medium': 'badge-medium',
    'Low': 'badge-low'
  };
  return map[priority] || 'badge-medium';
}

function getStatusBadgeClass(status) {
  const map = {
    'Assigned': 'badge-assigned',
    'In Progress': 'badge-progress',
    'Resolved': 'badge-resolved',
    'Closed': 'badge-closed',
    'Waiting For Citizen': 'badge-pending',
    'Transferred': 'badge-pending'
  };
  return map[status] || 'badge-assigned';
}

function getCaseAge(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day';
  return `${diffDays} days`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

function setupEventListeners() {
  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const filter = this.getAttribute('data-filter');
      applyFilter(filter);
    });
  });
}

function applyFilter(filter) {
  const allCases = getCases();
  let filteredCases = allCases.filter(c => c.assignedTo === CURRENT_OFFICER.id);

  if (filter === 'high') {
    filteredCases = filteredCases.filter(c => c.priority === 'High');
  } else if (filter === 'age') {
    filteredCases = filteredCases.sort((a, b) => {
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  }

  renderCasesTable(filteredCases);
}

// Global functions
window.openCaseDetail = function(caseId) {
  window.location.href = `officer-case-details.html?id=${caseId}`;
};

window.openModal = function(modalId) {
  document.getElementById(modalId).classList.add('active');
};

window.closeModal = function(modalId) {
  document.getElementById(modalId).classList.remove('active');
};

window.updateCaseStatus = function() {
  const selectedStatus = document.querySelector('input[name="newStatus"]:checked');
  
  if (!selectedStatus) {
    alert('Please select a status');
    return;
  }

  const caseId = document.getElementById('modalCaseId').value;
  const newStatus = selectedStatus.value;
  const notes = document.getElementById('modalNotes').value;

  updateCase(caseId, { 
    status: newStatus,
    updatedAt: new Date().toISOString()
  });

  if (notes) {
    const cases = getCases();
    const targetCase = cases.find(c => c.id === caseId);
    if (targetCase) {
      if (!targetCase.notes) targetCase.notes = [];
      targetCase.notes.push({
        text: notes,
        author: CURRENT_OFFICER.name,
        timestamp: new Date().toISOString()
      });
      updateCase(caseId, { notes: targetCase.notes });
    }
  }

  closeModal('statusModal');
  alert('Case status updated successfully!');
  loadDashboard();
};

window.updateCasePriority = function() {
  const selectedPriority = document.querySelector('input[name="newPriority"]:checked');
  
  if (!selectedPriority) {
    alert('Please select a priority');
    return;
  }

  const caseId = document.getElementById('priorityCaseId').value;
  const newPriority = selectedPriority.value;
  const notes = document.getElementById('priorityNotes').value;

  updateCase(caseId, { 
    priority: newPriority,
    updatedAt: new Date().toISOString()
  });

  if (notes) {
    const cases = getCases();
    const targetCase = cases.find(c => c.id === caseId);
    if (targetCase) {
      if (!targetCase.notes) targetCase.notes = [];
      targetCase.notes.push({
        text: `Priority changed to ${newPriority}: ${notes}`,
        author: CURRENT_OFFICER.name,
        timestamp: new Date().toISOString()
      });
      updateCase(caseId, { notes: targetCase.notes });
    }
  }

  closeModal('priorityModal');
  alert('Case priority updated successfully!');
  loadDashboard();
};

export { CURRENT_OFFICER };