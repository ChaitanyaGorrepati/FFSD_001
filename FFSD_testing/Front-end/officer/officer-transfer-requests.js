// officer/js/transfer-request.js
import { getCases } from '../../models/caseModel.js';
import { requestTransfer } from '../../routes/caseRoutes.js';

let currentCase = null;

document.addEventListener('DOMContentLoaded', function() {
  loadTransferForm();
});

function loadTransferForm() {
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('id');

  if (!caseId) {
    alert('No case ID provided');
    window.location.href = 'assigned-cases.html';
    return;
  }

  const cases = getCases();
  currentCase = cases.find(c => c.id === caseId);

  if (!currentCase) {
    alert('Case not found');
    window.location.href = 'assigned-cases.html';
    return;
  }

  // Populate form with case details
  document.getElementById('transferCaseId').textContent = currentCase.id;
  document.getElementById('transferCategory').textContent = currentCase.category || currentCase.title;
  document.getElementById('transferCurrentDept').textContent = currentCase.department;
  document.getElementById('transferOfficer').textContent = 'M. Rashid';
}

// Quick transfer to supervisor
window.selectQuickTransfer = function() {
  document.getElementById('transferDepartment').value = '';
  document.getElementById('transferReason').value = 'Escalating to supervisor for review and approval.';
};

// Submit transfer request
window.submitTransferRequest = function() {
  const targetDept = document.getElementById('transferDepartment').value;
  const reason = document.getElementById('transferReason').value.trim();

  // Validation
  if (!targetDept && !reason.includes('supervisor')) {
    alert('Please select a target department or use quick transfer to supervisor');
    return;
  }

  if (!reason) {
    alert('Please provide a reason for the transfer');
    return;
  }

  if (reason.length < 20) {
    alert('Please provide a more detailed transfer reason (minimum 20 characters)');
    return;
  }

  // Create transfer request using your connectivity layer
  const result = requestTransfer(currentCase.id, targetDept || 'Supervisor');

  if (result.success) {
    alert('Transfer request submitted successfully!\n\nYour supervisor will review the request.');
    
    // Redirect back to case detail
    window.location.href = `case-detail.html?id=${currentCase.id}`;
  } else {
    alert('Failed to submit transfer request. Please try again.');
  }
};