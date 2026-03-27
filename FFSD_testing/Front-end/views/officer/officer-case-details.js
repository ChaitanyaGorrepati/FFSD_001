// officer/js/case-detail.js
import { getCases, updateCase } from '../../models/caseModel.js';

let currentCase = null;
let CURRENT_OFFICER = null;

document.addEventListener('DOMContentLoaded', function() {
  // Check login
  const user = JSON.parse(sessionStorage.getItem('ct_user') || 'null');
  if (!user || user.role !== 'officer') {
    window.location.href = '../login.html';
    return;
  }
  
  CURRENT_OFFICER = user;
  loadCaseDetail();
  setupEventListeners();
});

function loadCaseDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('id');

  if (!caseId) {
    alert('No case ID provided');
    window.location.href = 'officer-assigned-cases.html';
    return;
  }

  const cases = getCases();
  currentCase = cases.find(c => c.id === caseId);

  if (!currentCase) {
    alert('Case not found');
    window.location.href = 'officer-assigned-cases.html';
    return;
  }

  // Ensure priority exists
  if (!currentCase.priority) {
    currentCase.priority = 'Medium';
    updateCase(caseId, { priority: 'Medium' });
  }

  renderCaseDetail(currentCase);
}

function renderCaseDetail(caseData) {
  // Update page title and subtitle
  document.getElementById('caseSubtitle').textContent = 
    `${caseData.id} - ${caseData.category || caseData.title} - Assigned to you`;

  // Header section
  document.getElementById('caseId').textContent = caseData.id;
  document.getElementById('caseStatus').textContent = caseData.status;
  document.getElementById('caseStatus').className = `badge ${getStatusBadgeClass(caseData.status)}`;

  // Detail grid
  document.getElementById('detailCaseId').textContent = caseData.id;
  document.getElementById('detailCitizen').textContent = caseData.citizenName || 'Unknown Citizen';
  document.getElementById('detailCategory').textContent = caseData.category || caseData.title;
  document.getElementById('detailPhone').textContent = caseData.phone || '+971 50 123 4567';
  document.getElementById('detailZone').textContent = caseData.zone;
  document.getElementById('detailLocation').textContent = caseData.location || caseData.description || 'N/A';

  // Complaint description
  document.getElementById('complaintTitle').textContent = caseData.title || caseData.category || 'Complaint';
  document.getElementById('complaintDescription').textContent = caseData.description || 'No description provided';

  // Status selector - populate with all options
  const statusSelect = document.getElementById('statusSelect');
  const statuses = ['Assigned', 'In Progress', 'Waiting For Citizen', 'Resolved', 'Transferred'];
  statusSelect.innerHTML = statuses.map(s => 
    `<option value="${s}" ${s === caseData.status ? 'selected' : ''}>${s}${s === caseData.status ? ' (current)' : ''}</option>`
  ).join('');

  // Priority selector (add to page if not exists)
  addPrioritySelector(caseData.priority || 'Medium');

  // Attachments
  renderAttachments(caseData.attachments || []);

  // Timeline
  renderTimeline(caseData);
}

function addPrioritySelector(currentPriority) {
  const statusGroup = document.getElementById('statusSelect').parentElement;
  
  // Check if priority selector already exists
  if (document.getElementById('prioritySelect')) {
    document.getElementById('prioritySelect').value = currentPriority;
    return;
  }

  const priorityGroup = document.createElement('div');
  priorityGroup.className = 'form-group';
  priorityGroup.style.marginBottom = '16px';
  priorityGroup.innerHTML = `
    <label class="form-label">UPDATE PRIORITY</label>
    <select class="select" id="prioritySelect">
      <option value="High" ${currentPriority === 'High' ? 'selected' : ''}>High</option>
      <option value="Medium" ${currentPriority === 'Medium' ? 'selected' : ''}>Medium</option>
      <option value="Low" ${currentPriority === 'Low' ? 'selected' : ''}>Low</option>
    </select>
  `;
  
  statusGroup.parentElement.insertBefore(priorityGroup, statusGroup.nextSibling);
  
  // Add event listener for priority change
  document.getElementById('prioritySelect').addEventListener('change', handlePriorityChange);
}

function handlePriorityChange(e) {
  const newPriority = e.target.value;
  
  if (confirm(`Change priority to ${newPriority}?`)) {
    updateCase(currentCase.id, {
      priority: newPriority,
      updatedAt: new Date().toISOString()
    });
    
    // Add note
    if (!currentCase.notes) currentCase.notes = [];
    currentCase.notes.push({
      text: `Priority changed to ${newPriority}`,
      author: CURRENT_OFFICER.name,
      timestamp: new Date().toISOString()
    });
    updateCase(currentCase.id, { notes: currentCase.notes });
    
    alert('Priority updated successfully!');
    loadCaseDetail();
  } else {
    e.target.value = currentCase.priority;
  }
}

function renderAttachments(attachments) {
  const grid = document.getElementById('attachmentGrid');
  
  if (!attachments || attachments.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px;">No attachments</div>';
    return;
  }

  grid.innerHTML = attachments.map(att => `
    <div class="attachment-item">
      <div class="attachment-preview">📷</div>
      <div class="attachment-name">${att.name || 'photo.jpg'}</div>
    </div>
  `).join('');
}

function renderTimeline(caseData) {
  const timeline = document.getElementById('timeline');
  
  const stages = [
    { title: 'Submitted', date: formatDate(caseData.createdAt), status: 'complete' },
    { title: 'Assigned', date: formatDate(caseData.assignedAt || caseData.createdAt), status: 'complete' },
    { 
      title: 'In Progress', 
      date: caseData.status === 'In Progress' || caseData.status === 'Resolved' || caseData.status === 'Closed' ? formatDate(caseData.updatedAt || caseData.createdAt) : 'Pending', 
      status: caseData.status === 'In Progress' ? 'active' : (caseData.status === 'Resolved' || caseData.status === 'Closed' ? 'complete' : '')
    },
    { 
      title: 'Resolved', 
      date: caseData.status === 'Resolved' || caseData.status === 'Closed' ? formatDate(caseData.updatedAt) : 'Pending', 
      status: caseData.status === 'Resolved' ? 'active' : (caseData.status === 'Closed' ? 'complete' : '')
    },
    { 
      title: 'Closed', 
      date: caseData.status === 'Closed' ? formatDate(caseData.closedAt || caseData.updatedAt) : 'Pending', 
      status: caseData.status === 'Closed' ? 'complete' : ''
    }
  ];

  timeline.innerHTML = stages.map(stage => `
    <div class="timeline-item">
      <div class="timeline-dot ${stage.status}"></div>
      <div class="timeline-content">
        <div class="timeline-title">${stage.title}</div>
        <div class="timeline-meta">${stage.date}</div>
      </div>
    </div>
  `).join('');
}

function setupEventListeners() {
  // Status selector change
  document.getElementById('statusSelect').addEventListener('change', function() {
    const newStatus = this.value;
    
    if (confirm(`Update case status to "${newStatus}"?`)) {
      updateCase(currentCase.id, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      // Add note
      if (!currentCase.notes) currentCase.notes = [];
      currentCase.notes.push({
        text: `Status changed to ${newStatus}`,
        author: CURRENT_OFFICER.name,
        timestamp: new Date().toISOString()
      });
      updateCase(currentCase.id, { notes: currentCase.notes });
      
      alert('Case status updated successfully!');
      loadCaseDetail();
    } else {
      this.value = currentCase.status;
    }
  });
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

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

// Global function to get case ID
window.getCaseIdFromURL = function() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
};

window.goToTransferPage = function() {
  const caseId = window.getCaseIdFromURL();

  if (!caseId) {
    alert("Case ID not found");
    return;
  }

  window.location.href = './officer-transfer-requests.html?id=${caseId}';
};

