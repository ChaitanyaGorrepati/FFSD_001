// js/officer-case-details.js
import {
  getOfficerSession, initOfficerUI, updateSidebarBadges,
  statusBadge, priorityBadge, formatDate,
  updateCaseById, getCaseById, getAllCases
} from "./officer-utils.js";

const user = getOfficerSession();
if (!user) throw new Error("No session");

initOfficerUI(user);
updateSidebarBadges(user.id);

// ── Read case ID from URL ─────────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const caseId  = params.get("id");

if (!caseId) {
  window.location.href = "officer-assigned-cases.html";
}

// ── Load case ─────────────────────────────────────────────────────────────────
function loadCase() {
  const c = getCaseById(caseId);
  if (!c) {
    document.getElementById("case-header").innerHTML =
      `<p style="color:var(--red);font-size:14px;">Case not found.</p>`;
    return;
  }

  // Breadcrumb
  document.getElementById("breadcrumb-id").textContent = c.id;

  // Header fields
  document.getElementById("detail-case-id").textContent    = c.id;
  document.getElementById("detail-status-badge").outerHTML = statusBadge(c.status);
  document.getElementById("detail-priority-badge").outerHTML = priorityBadge(c.priority || "Medium");
  document.getElementById("detail-title").textContent      = c.title || "—";
  document.getElementById("detail-meta").textContent       =
    `Submitted ${formatDate(c.createdAt)} · ${c.department || "—"} · ${c.zone || "—"}`;
  document.getElementById("detail-dept").textContent       = c.department || "—";
  document.getElementById("detail-zone").textContent       = c.zone || "—";
  document.getElementById("detail-category").textContent   = c.category || "—";
  document.getElementById("detail-date").textContent       = formatDate(c.createdAt);
  document.getElementById("detail-location").textContent   = c.location || "—";
  document.getElementById("detail-description").textContent = c.description || "—";

  // Right panel info
  document.getElementById("info-submitted-by").textContent = c.submittedBy || "Citizen";
  document.getElementById("info-contact").textContent      = c.contactPhone || c.contactEmail || "—";
  document.getElementById("info-status").innerHTML         = statusBadge(c.status);
  document.getElementById("info-priority").innerHTML       = priorityBadge(c.priority || "Medium");

  // Transfer status
  const transferCard = document.getElementById("transfer-status-card");
  if (c.transfer && c.transfer.requested) {
    transferCard.style.display = "block";
    document.getElementById("transfer-status-text").textContent =
      `Transfer to ${c.transfer.toDept} — Status: ${c.transfer.status || "pending"}`;
  } else {
    transferCard.style.display = "none";
  }

  // Notes
  renderNotes(c.notes || []);
}

function renderNotes(notes) {
  const list = document.getElementById("notes-list");
  if (!notes.length) {
    list.innerHTML = `<p style="font-size:13px;color:var(--text-muted);">No notes yet.</p>`;
    return;
  }
  list.innerHTML = notes.map(n => {
    const text   = typeof n === "string" ? n : (n.text || n);
    const ts     = typeof n === "object" && n.time ? n.time : null;
    return `
      <div style="background:var(--border-light);border-radius:var(--radius);padding:12px 14px;">
        <p style="font-size:13.5px;color:var(--text-primary);line-height:1.6;">${text}</p>
        ${ts ? `<p style="font-size:11px;color:var(--text-muted);margin-top:4px;">${formatDate(ts)}</p>` : ""}
      </div>
    `;
  }).join("");
}

loadCase();

// ── Add Note ──────────────────────────────────────────────────────────────────
window.addNote = function() {
  const input = document.getElementById("note-input");
  const text  = input.value.trim();
  if (!text) return;

  const c = getCaseById(caseId);
  if (!c) return;

  const notes = c.notes || [];
  notes.push({ text, time: new Date().toISOString(), by: user.name });
  updateCaseById(caseId, { notes });
  input.value = "";
  loadCase();
};

document.getElementById("note-input").addEventListener("keydown", e => {
  if (e.key === "Enter") window.addNote();
});

// ── Transfer button ────────────────────────────────────────────────────────────
window.goToTransfer = function() {
  window.location.href = `officer-transfer-requests.html?id=${caseId}`;
};

// ── Priority Modal ─────────────────────────────────────────────────────────────
window.openPriorityModal = function() {
  const c = getCaseById(caseId);
  if (c && c.priority) {
    document.querySelectorAll('input[name="priority"]').forEach(r => {
      r.checked = r.value === c.priority;
    });
  }
  document.getElementById("priority-modal").classList.add("active");
};

window.closePriorityModal = function() {
  document.getElementById("priority-modal").classList.remove("active");
};

window.savePriority = function() {
  const val = document.querySelector('input[name="priority"]:checked')?.value;
  if (!val) return;
  updateCaseById(caseId, { priority: val });
  closePriorityModal();
  loadCase();
};

// ── Status Modal ───────────────────────────────────────────────────────────────
window.openStatusModal = function() {
  const c = getCaseById(caseId);
  if (c && c.status) {
    document.querySelectorAll('input[name="status"]').forEach(r => {
      r.checked = r.value === c.status;
    });
  }
  document.getElementById("status-modal").classList.add("active");
};

window.closeStatusModal = function() {
  document.getElementById("status-modal").classList.remove("active");
};

window.saveStatus = function() {
  const val = document.querySelector('input[name="status"]:checked')?.value;
  if (!val) return;
  updateCaseById(caseId, { status: val });
  closeStatusModal();
  loadCase();
};

// Close modals on overlay click
document.getElementById("priority-modal").addEventListener("click", function(e) {
  if (e.target === this) closePriorityModal();
});
document.getElementById("status-modal").addEventListener("click", function(e) {
  if (e.target === this) closeStatusModal();
});