// officer/js/officer-case-details.js
import { getCases, updateCase } from '../../models/caseModel.js';

let currentCase = null;
let CURRENT_OFFICER = null;

document.addEventListener('DOMContentLoaded', function () {
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
  document.getElementById('caseSubtitle').textContent =
    `${caseData.id} - ${caseData.category || caseData.title} - Assigned to you`;

  document.getElementById('caseId').textContent = caseData.id;
  document.getElementById('caseStatus').textContent = caseData.status;
  document.getElementById('caseStatus').className = `badge ${getStatusBadgeClass(caseData.status)}`;

  document.getElementById('detailCaseId').textContent = caseData.id;
  document.getElementById('detailCitizen').textContent = caseData.citizenName || 'Unknown Citizen';
  document.getElementById('detailCategory').textContent = caseData.category || caseData.title;
  document.getElementById('detailPhone').textContent = caseData.phone || '+971 50 123 4567';
  document.getElementById('detailZone').textContent = caseData.zone;
  document.getElementById('detailLocation').textContent = caseData.location || caseData.description || 'N/A';

  document.getElementById('complaintTitle').textContent = caseData.title || caseData.category || 'Complaint';
  document.getElementById('complaintDescription').textContent = caseData.description || 'No description provided';

  // ── Accept / Reject buttons ──────────────────────────────────────────────
  // Show only when case is still in "Assigned" state (not yet acted on)
  renderAcceptRejectButtons(caseData.status);

  // ── Status selector — shown only after officer has accepted ──────────────
  const statusSelect = document.getElementById('statusSelect');
  if (statusSelect) {
    // If still "Assigned" or "Rejected", hide the status update dropdown —
    // officer must use the Accept/Reject buttons first.
    const canUpdateStatus = !['Assigned', 'Rejected'].includes(caseData.status);
    statusSelect.closest('.form-group').style.display = canUpdateStatus ? '' : 'none';

    if (canUpdateStatus) {
      const statuses = ['Accepted', 'In Progress', 'Waiting For Citizen', 'Resolved', 'Transferred'];
      statusSelect.innerHTML = statuses.map(s =>
        `<option value="${s}" ${s === caseData.status ? 'selected' : ''}>${s}${s === caseData.status ? ' (current)' : ''}</option>`
      ).join('');
    }
  }

  addPrioritySelector(caseData.priority || 'Medium');
  renderAttachments(caseData.attachments || []);
  renderTimeline(caseData);
}

// ── Accept / Reject button block ─────────────────────────────────────────────
function renderAcceptRejectButtons(status) {
  // Look for an existing container so we don't duplicate on re-render
  let container = document.getElementById('acceptRejectContainer');

  if (!container) {
    // Create and insert the container once, just above the status selector's parent
    container = document.createElement('div');
    container.id = 'acceptRejectContainer';
    container.style.cssText = 'display:flex;gap:12px;margin-bottom:20px;';

    const statusFormGroup = document.getElementById('statusSelect')?.closest('.form-group');
    if (statusFormGroup) {
      statusFormGroup.parentElement.insertBefore(container, statusFormGroup);
    }
  }

  // Only show the buttons when the case is freshly "Assigned"
  if (status !== 'Assigned') {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  container.innerHTML = `
    <button
      id="acceptCaseBtn"
      class="btn btn-primary"
      style="flex:1;background:#22c55e;border-color:#22c55e;">
      ✓ Accept Case
    </button>
    <button
      id="rejectCaseBtn"
      class="btn btn-primary"
      style="flex:1;background:#ef4444;border-color:#ef4444;">
      ✗ Reject Case
    </button>
  `;

  document.getElementById('acceptCaseBtn').addEventListener('click', handleAcceptCase);
  document.getElementById('rejectCaseBtn').addEventListener('click', handleRejectCase);
}

// ── Accept handler ────────────────────────────────────────────────────────────
function handleAcceptCase() {
  if (!confirm('Accept this case and begin working on it?')) return;

  updateCase(currentCase.id, {
    status: 'Accepted',
    updatedAt: new Date().toISOString()
  });

  if (!currentCase.notes) currentCase.notes = [];
  currentCase.notes.push({
    text: 'Case accepted by officer.',
    author: CURRENT_OFFICER.name,
    timestamp: new Date().toISOString()
  });
  updateCase(currentCase.id, { notes: currentCase.notes });

  alert('Case accepted successfully!');
  loadCaseDetail();
}

// ── Reject handler ────────────────────────────────────────────────────────────
function handleRejectCase() {
  const reason = prompt('Please provide a reason for rejecting this case:');
  if (reason === null) return; // cancelled
  if (!reason.trim()) {
    alert('A rejection reason is required.');
    return;
  }

  updateCase(currentCase.id, {
    status: 'Rejected',
    updatedAt: new Date().toISOString()
  });

  if (!currentCase.notes) currentCase.notes = [];
  currentCase.notes.push({
    text: `Case rejected. Reason: ${reason.trim()}`,
    author: CURRENT_OFFICER.name,
    timestamp: new Date().toISOString()
  });
  updateCase(currentCase.id, { notes: currentCase.notes });

  alert('Case rejected.');
  loadCaseDetail();
}

// ── Priority selector ─────────────────────────────────────────────────────────
function addPrioritySelector(currentPriority) {
  const statusSelect = document.getElementById('statusSelect');
  if (!statusSelect) return;

  const statusGroup = statusSelect.parentElement;

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
      <option value="High"   ${currentPriority === 'High'   ? 'selected' : ''}>High</option>
      <option value="Medium" ${currentPriority === 'Medium' ? 'selected' : ''}>Medium</option>
      <option value="Low"    ${currentPriority === 'Low'    ? 'selected' : ''}>Low</option>
    </select>
  `;

  statusGroup.parentElement.insertBefore(priorityGroup, statusGroup.nextSibling);
  document.getElementById('prioritySelect').addEventListener('change', handlePriorityChange);
}

function handlePriorityChange(e) {
  const newPriority = e.target.value;

  if (confirm(`Change priority to ${newPriority}?`)) {
    updateCase(currentCase.id, {
      priority: newPriority,
      updatedAt: new Date().toISOString()
    });

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

// ── Attachments ───────────────────────────────────────────────────────────────
function renderAttachments(attachments) {
  const grid = document.getElementById('attachmentGrid');
  if (!grid) return;

  if (!attachments || attachments.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);font-size:13px;padding:20px;">No attachments</div>';
    return;
  }

  grid.innerHTML = attachments.map(att => `
    <div class="attachment-item">
      <div class="attachment-preview">📷</div>
      <div class="attachment-name">${att.name || 'photo.jpg'}</div>
    </div>
  `).join('');
}

// ── Timeline ──────────────────────────────────────────────────────────────────
function renderTimeline(caseData) {
  const timeline = document.getElementById('timeline');
  if (!timeline) return;

  const isResolved = ['Resolved', 'Closed'].includes(caseData.status);
  const isClosed   = caseData.status === 'Closed';

  const stages = [
    {
      title: 'Submitted',
      date: formatDate(caseData.createdAt),
      status: 'complete'
    },
    {
      title: 'Assigned',
      date: formatDate(caseData.assignedAt || caseData.createdAt),
      status: 'complete'
    },
    {
      title: 'Accepted',
      date: ['Accepted','In Progress','Waiting For Citizen','Resolved','Closed'].includes(caseData.status)
        ? formatDate(caseData.updatedAt || caseData.createdAt) : 'Pending',
      status: caseData.status === 'Accepted' ? 'active'
            : ['In Progress','Waiting For Citizen','Resolved','Closed'].includes(caseData.status) ? 'complete' : ''
    },
    {
      title: 'In Progress',
      date: ['In Progress','Resolved','Closed'].includes(caseData.status)
        ? formatDate(caseData.updatedAt || caseData.createdAt) : 'Pending',
      status: caseData.status === 'In Progress' ? 'active'
            : isResolved ? 'complete' : ''
    },
    {
      title: 'Resolved',
      date: isResolved ? formatDate(caseData.updatedAt) : 'Pending',
      status: caseData.status === 'Resolved' ? 'active' : isClosed ? 'complete' : ''
    },
    {
      title: 'Closed',
      date: isClosed ? formatDate(caseData.closedAt || caseData.updatedAt) : 'Pending',
      status: isClosed ? 'complete' : ''
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

// ── Status select change (after acceptance) ───────────────────────────────────
function setupEventListeners() {
  const statusSelect = document.getElementById('statusSelect');
  if (!statusSelect) return;

  statusSelect.addEventListener('change', function () {
    const newStatus = this.value;

    if (confirm(`Update case status to "${newStatus}"?`)) {
      updateCase(currentCase.id, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

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

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatusBadgeClass(status) {
  const map = {
    'Assigned':           'badge-assigned',
    'Accepted':           'badge-resolved',
    'Rejected':           'badge-closed',
    'In Progress':        'badge-progress',
    'Waiting For Citizen':'badge-pending',
    'Resolved':           'badge-resolved',
    'Closed':             'badge-closed',
    'Transferred':        'badge-pending'
  };
  return map[status] || 'badge-assigned';
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
}

// ── Global helpers ────────────────────────────────────────────────────────────
window.getCaseIdFromURL = function () {
  return new URLSearchParams(window.location.search).get('id');
};

// BUG FIX: original used single quotes so ${caseId} was never interpolated
window.goToTransferPage = function () {
  const caseId = window.getCaseIdFromURL();
  if (!caseId) { alert('Case ID not found'); return; }
  window.location.href = `./officer-transfer-requests.html?id=${caseId}`;
};