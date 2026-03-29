// js/officer-case-details.js
import {
  getOfficerSession, initOfficerUI, updateSidebarBadges,
  statusBadge, priorityBadge, formatDate,
  updateCaseById, getCaseById
} from "./officer-utils.js";

// ── Session ───────────────────────────────────────────────────────────────────
const user = getOfficerSession();
if (!user) throw new Error("No session");

initOfficerUI(user);
updateSidebarBadges(user.id);
updateClosureBadge(user.id);

document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("ct_user");
  sessionStorage.removeItem("ct_selected_role");
  window.location.href = "../index.html";
});

// ── Read case ID from URL ─────────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const caseId = params.get("id");
if (!caseId) { window.location.href = "officer-assigned-cases.html"; }

// ── Closure badge helper (sidebar) ────────────────────────────────────────────
function updateClosureBadge(officerId) {
  const all = JSON.parse(localStorage.getItem("cases") || "[]");
  const count = all.filter(c =>
    c.assignedTo === officerId &&
    c.closureRequest &&
    c.closureRequest.requested
  ).length;
  const el = document.getElementById("sb-closure-count");
  if (el) el.textContent = count;
}

// ── Load & render case ────────────────────────────────────────────────────────
function loadCase() {
  const c = getCaseById(caseId);
  if (!c) {
    document.getElementById("case-header").innerHTML =
      `<p style="color:var(--red);font-size:14px;">Case not found.</p>`;
    return;
  }

  document.getElementById("breadcrumb-id").textContent    = c.id;
  document.getElementById("detail-case-id").textContent   = c.id;
  document.getElementById("detail-title").textContent     = c.title || "—";
  document.getElementById("detail-meta").textContent      =
    `Submitted ${formatDate(c.createdAt)} · ${c.department || "—"} · ${c.zone || "—"}`;
  document.getElementById("detail-dept").textContent      = c.department || "—";
  document.getElementById("detail-zone").textContent      = c.zone || "—";
  document.getElementById("detail-category").textContent  = c.category || "—";
  document.getElementById("detail-date").textContent      = formatDate(c.createdAt);
  document.getElementById("detail-location").textContent  = c.location || "—";
  document.getElementById("detail-description").textContent = c.description || "—";

  // Badges — replace the placeholder spans safely
  const statusEl   = document.getElementById("detail-status-badge");
  const priorityEl = document.getElementById("detail-priority-badge");
  if (statusEl)   statusEl.outerHTML   = statusBadge(c.status)
    .replace('class="badge', 'id="detail-status-badge" class="badge');
  if (priorityEl) priorityEl.outerHTML = priorityBadge(c.priority || "Medium")
    .replace('class="badge', 'id="detail-priority-badge" class="badge');

  // Right panel
  document.getElementById("info-submitted-by").textContent = c.submittedBy || "Citizen";
  document.getElementById("info-contact").textContent      =
    c.contactPhone || c.contactEmail || "—";
  document.getElementById("info-status").innerHTML   = statusBadge(c.status);
  document.getElementById("info-priority").innerHTML = priorityBadge(c.priority || "Medium");

  // Transfer banner
  const transferCard = document.getElementById("transfer-status-card");
  if (c.transfer && c.transfer.requested) {
    transferCard.style.display = "block";
    document.getElementById("transfer-status-text").textContent =
      `To: ${c.transfer.toDept} — Status: ${c.transfer.status || "pending"}`;
  } else {
    transferCard.style.display = "none";
  }

  // Closure banner
  const closureCard = document.getElementById("closure-status-card");
  if (c.closureRequest && c.closureRequest.requested) {
    closureCard.style.display = "block";
    const supName = c.closureRequest.supervisorName || c.closureRequest.supervisorId || "Supervisor";
    document.getElementById("closure-status-text").textContent =
      `Sent to: ${supName} — Status: ${c.closureRequest.status || "pending"}`;
  } else {
    closureCard.style.display = "none";
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
    const text = typeof n === "string" ? n : (n.text || String(n));
    const ts   = typeof n === "object" && n.time ? n.time : null;
    const by   = typeof n === "object" && n.by   ? n.by   : null;
    return `
      <div style="background:var(--border-light);border-radius:var(--radius);padding:12px 14px;">
        <p style="font-size:13.5px;color:var(--text-primary);line-height:1.6;">${text}</p>
        <p style="font-size:11px;color:var(--text-muted);margin-top:4px;">
          ${by ? `${by} · ` : ""}${ts ? formatDate(ts) : ""}
        </p>
      </div>`;
  }).join("");
}

loadCase();

// ── Action delegation ─────────────────────────────────────────────────────────
document.addEventListener("click", e => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === "open-priority") openPriorityModal();
  if (action === "open-status")   openStatusModal();
  if (action === "transfer")      goToTransfer();
  if (action === "open-closure")  openClosureModal();
  if (action === "add-note")      addNote();
});

// ── Add Note ──────────────────────────────────────────────────────────────────
function addNote() {
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
}

document.getElementById("note-input").addEventListener("keydown", e => {
  if (e.key === "Enter") addNote();
});

// ── Transfer navigation ───────────────────────────────────────────────────────
function goToTransfer() {
  window.location.href = `officer-transfer-requests.html?id=${caseId}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// Priority Modal
// ══════════════════════════════════════════════════════════════════════════════
function openPriorityModal() {
  const c = getCaseById(caseId);
  document.querySelectorAll('input[name="priority"]').forEach(r => {
    r.checked = c && r.value === (c.priority || "Medium");
  });
  document.getElementById("priority-modal").classList.add("active");
}
function closePriorityModal() {
  document.getElementById("priority-modal").classList.remove("active");
}
function savePriority() {
  const val = document.querySelector('input[name="priority"]:checked')?.value;
  if (!val) return;
  updateCaseById(caseId, { priority: val });
  closePriorityModal();
  loadCase();
}

document.getElementById("priority-modal").addEventListener("click", e => {
  if (e.target === e.currentTarget) closePriorityModal();
});
document.getElementById("pm-close").addEventListener("click",  closePriorityModal);
document.getElementById("pm-cancel").addEventListener("click", closePriorityModal);
document.getElementById("pm-save").addEventListener("click",   savePriority);

// ══════════════════════════════════════════════════════════════════════════════
// Status Modal
// ══════════════════════════════════════════════════════════════════════════════
function openStatusModal() {
  const c = getCaseById(caseId);
  document.querySelectorAll('input[name="status"]').forEach(r => {
    r.checked = c && r.value === (c.status || "Assigned");
  });
  document.getElementById("status-modal").classList.add("active");
}
function closeStatusModal() {
  document.getElementById("status-modal").classList.remove("active");
}
function saveStatus() {
  const val = document.querySelector('input[name="status"]:checked')?.value;
  if (!val) return;
  updateCaseById(caseId, { status: val });
  closeStatusModal();
  loadCase();
}

document.getElementById("status-modal").addEventListener("click", e => {
  if (e.target === e.currentTarget) closeStatusModal();
});
document.getElementById("sm-close").addEventListener("click",  closeStatusModal);
document.getElementById("sm-cancel").addEventListener("click", closeStatusModal);
document.getElementById("sm-save").addEventListener("click",   saveStatus);

// ══════════════════════════════════════════════════════════════════════════════
// Closure Request Modal
// ══════════════════════════════════════════════════════════════════════════════
const SUPERVISOR_NAMES = {
  sup1: "Sara (Road)",
  sup2: "David (Water)",
  sup3: "Kiran (Electricity)",
};

function openClosureModal() {
  const c = getCaseById(caseId);
  if (!c) return;

  // Prefill case info in modal
  document.getElementById("crm-case-id-display").textContent    = c.id;
  document.getElementById("crm-case-title-display").textContent = c.title || "—";

  // Clear previous values and errors
  document.getElementById("crm-summary").value    = "";
  document.getElementById("crm-supervisor").value = "";
  document.getElementById("crm-notes").value      = "";
  document.getElementById("crm-summary-error").style.display    = "none";
  document.getElementById("crm-supervisor-error").style.display = "none";

  // Auto-select matching supervisor by department
  const deptSupMap = { Road: "sup1", Water: "sup2", Electricity: "sup3" };
  const autoSup = deptSupMap[c.department];
  if (autoSup) document.getElementById("crm-supervisor").value = autoSup;

  document.getElementById("closure-modal").classList.add("active");
}

function closeClosureModal() {
  document.getElementById("closure-modal").classList.remove("active");
}

function submitClosureRequest() {
  const summary  = document.getElementById("crm-summary").value.trim();
  const supId    = document.getElementById("crm-supervisor").value;
  const notes    = document.getElementById("crm-notes").value.trim();

  // Validate
  let valid = true;
  if (!summary) {
    document.getElementById("crm-summary-error").style.display = "block";
    valid = false;
  } else {
    document.getElementById("crm-summary-error").style.display = "none";
  }
  if (!supId) {
    document.getElementById("crm-supervisor-error").style.display = "block";
    valid = false;
  } else {
    document.getElementById("crm-supervisor-error").style.display = "none";
  }
  if (!valid) return;

  // Save closure request onto the case in localStorage
  updateCaseById(caseId, {
    closureRequest: {
      requested:      true,
      supervisorId:   supId,
      supervisorName: SUPERVISOR_NAMES[supId] || supId,
      summary,
      notes,
      status:         "pending",         // supervisor will approve/reject
      requestedBy:    user.id,
      requestedByName: user.name,
      requestedAt:    new Date().toISOString(),
    }
  });

  closeClosureModal();
  loadCase();
  updateClosureBadge(user.id);
  showToast("Closure request submitted successfully.");
}

document.getElementById("closure-modal").addEventListener("click", e => {
  if (e.target === e.currentTarget) closeClosureModal();
});
document.getElementById("crm-close").addEventListener("click",   closeClosureModal);
document.getElementById("crm-cancel").addEventListener("click",  closeClosureModal);
document.getElementById("crm-submit").addEventListener("click",  submitClosureRequest);

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, color = "#22C55E") {
  const t = document.createElement("div");
  t.style.cssText = `position:fixed;top:20px;right:24px;background:${color};color:#fff;
    padding:12px 20px;border-radius:8px;font-size:13.5px;font-weight:600;
    z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.15);transition:opacity .3s;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 3000);
}