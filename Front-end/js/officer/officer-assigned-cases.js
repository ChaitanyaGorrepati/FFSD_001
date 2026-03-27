// officer/js/assigned-cases.js
import { getCases } from '../../models/caseModel.js';

let CURRENT_OFFICER = null;

document.addEventListener('DOMContentLoaded', function() {
  // Check login
  const user = JSON.parse(sessionStorage.getItem('ct_user') || 'null');
  if (!user || user.role !== 'officer') {
    window.location.href = '../login.html';
    return;
  }
  
  CURRENT_OFFICER = user;
  loadCases();
  setupFilters();
});

function loadCases() {
  const allCases = getCases();
  const myCases = allCases.filter(c => c.assignedTo === CURRENT_OFFICER.id);
  
  renderCases(myCases);
  updateCounts(myCases);
}

function renderCases(cases) {
  const tbody = document.getElementById('casesTable');
  
  if (cases.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          No cases found matching the selected filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = cases.map(c => {
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
          <button class="btn btn-primary btn-xs" onclick="event.stopPropagation(); openCase('${c.id}')">
            Open
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateCounts(cases) {
  const all = cases.length;
  const inProgress = cases.filter(c => c.status === 'In Progress').length;
  const pending = cases.filter(c => c.status === 'Waiting For Citizen' || c.status === 'Assigned').length;
  
  document.getElementById('totalCount').textContent = all;
  document.getElementById('assignedCount').textContent = all;
  
  // Update filter tab labels
  document.querySelectorAll('.filter-tab').forEach(tab => {
    const filter = tab.getAttribute('data-filter');
    if (filter === 'all') tab.textContent = `All (${all})`;
    else if (filter === 'progress') tab.textContent = `In Progress (${inProgress})`;
    else if (filter === 'pending') tab.textContent = `Pending (${pending})`;
  });
}

function setupFilters() {
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

  if (filter === 'progress') {
    filteredCases = filteredCases.filter(c => c.status === 'In Progress');
  } else if (filter === 'pending') {
    filteredCases = filteredCases.filter(c => 
      c.status === 'Waiting For Citizen' || c.status === 'Assigned'
    );
  } else if (filter === 'age') {
    filteredCases = filteredCases.sort((a, b) => {
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  }

  renderCases(filteredCases);
}

// Helper functions
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

// Global function
window.openCase = function(caseId) {
  window.location.href = `officer-case-details.html?id=${caseId}`;
};