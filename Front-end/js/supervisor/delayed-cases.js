// js/supervisor/delayed-cases.js
import {
  getCases, updateCase, appendActivity, pushNotification,
  resolveOfficerName, getUsers, priorityBadge, getLoggedInSupervisor
} from './supervisorData.js';
import { populateSupervisorIdentity } from './sidebar-identity.js';

populateSupervisorIdentity();

const supervisor = getLoggedInSupervisor();
const tbody      = document.getElementById("delayed-tbody");
const emptyState = document.getElementById("empty-state");

// ── Days open ─────────────────────────────────────────────────────────────────
function daysOpen(c) {
  if (!c.createdAt) return 0;
  return Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86400000);
}

// ── All active (non-resolved) cases, oldest first ─────────────────────────────
function getEscalatedCases() {
  return getCases()
    .filter(c => !["Resolved","Closed"].includes(c.status))
    .map(c => ({ ...c, _days: daysOpen(c) }))
    .sort((a, b) => b._days - a._days);
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function updateStats() {
  const all = getEscalatedCases();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("stat-3d",  all.filter(c => c._days > 3).length);
  set("stat-7d",  all.filter(c => c._days > 7).length);
  set("stat-14d", all.filter(c => c._days > 14).length);
  set("stat-esc", all.filter(c => c._days > 14).length);
}

// ── Priority dropdown ─────────────────────────────────────────────────────────
function prioritySelect(caseId, current) {
  const pClass = current === "High" ? "p-high" : current === "Medium" ? "p-medium" : "p-low";
  const opts   = ["High","Medium","Low"]
    .map(p => `<option value="${p}" ${p === current ? "selected" : ""}>${p}</option>`)
    .join("");
  return `
    <select class="priority-select-inline ${pClass}" data-id="${caseId}"
      onchange="changePriority('${caseId}', this.value, this)">
      ${opts}
    </select>`;
}

// ── Table ─────────────────────────────────────────────────────────────────────
function renderTable() {
  const cases = getEscalatedCases();
  if (emptyState) emptyState.style.display = cases.length === 0 ? "block" : "none";
  if (!tbody) return;
  if (cases.length === 0) { tbody.innerHTML = ""; return; }

  tbody.innerHTML = cases.map(c => {
    const days        = c._days;
    const officerName = resolveOfficerName(c.assignedTo) || "Unassigned";
    const ageCls      = days > 14 ? "age-critical" : days > 3 ? "age-warn" : "age-ok";
    return `
      <tr>
        <td><a class="case-id-link" href="case-details.html?id=${c.id}">${c.id}</a></td>
        <td>${c.category || "—"}</td>
        <td>${c.citizen  || "—"}</td>
        <td>Officer ${officerName}</td>
        <td>${c.department || "—"}</td>
        <td><span class="case-age ${ageCls}">${days} day${days !== 1 ? "s" : ""}</span></td>
        <td>${prioritySelect(c.id, c.priority || "Low")}</td>
        <td>
          <div class="actions-pair">
            <button class="btn-sm btn-sm-outline" onclick="sendReminder('${c.id}')">Send Reminder</button>
            <button class="btn-sm btn-sm-red"     onclick="openReassignModal('${c.id}')">Reassign Case</button>
          </div>
        </td>
      </tr>`;
  }).join("");
}

// ── Priority change ───────────────────────────────────────────────────────────
window.changePriority = function(id, newPriority, selectEl) {
  updateCase(id, { priority: newPriority });
  if (selectEl) {
    selectEl.classList.remove("p-high","p-medium","p-low");
    selectEl.classList.add(newPriority === "High" ? "p-high" : newPriority === "Medium" ? "p-medium" : "p-low");
  }
  updateStats();
  toast(`Priority updated to ${newPriority}`, "green");
};

// ── Send Reminder → notification to officer ───────────────────────────────────
window.sendReminder = function(id) {
  const c = getCases().find(x => x.id === id);
  if (c?.assignedTo) {
    pushNotification(
      c.assignedTo,
      `⏰ Reminder from Supervisor ${supervisor?.name}: Case ${id} (${c.category}) has been open for ${daysOpen(c)} days. Please update the status.`,
      id
    );
  }
  toast(`Reminder sent to Officer ${resolveOfficerName(c?.assignedTo) || ""}`, "blue");
};

// ── Reassign Modal ────────────────────────────────────────────────────────────
let _reassignCaseId = null;

window.openReassignModal = function(id) {
  _reassignCaseId = id;
  const c = getCases().find(x => x.id === id);
  if (!c) return;

  // Build officer list for this dept
  const deptOfficers = getUsers().filter(
    u => u.role === "officer" && u.department === supervisor?.department
  );

  // Build or show modal
  let modal = document.getElementById("reassign-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "reassign-modal";
    modal.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;
      display:flex;align-items:center;justify-content:center;`;
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="background:#fff;border-radius:12px;padding:28px 24px;width:380px;max-width:95vw;box-shadow:0 8px 40px rgba(0,0,0,.18);">
      <h3 style="font-family:'Syne',sans-serif;font-size:16px;font-weight:700;margin-bottom:6px;">Reassign Case</h3>
      <p style="font-size:12.5px;color:#5F6368;margin-bottom:16px;">Case: <strong>${id}</strong> · ${c.category}</p>
      <label style="font-size:12.5px;font-weight:600;display:block;margin-bottom:6px;">Select New Officer</label>
      <select id="reassign-officer-sel" style="width:100%;padding:9px 12px;border:1.5px solid #E8EAED;border-radius:8px;font-size:13px;margin-bottom:6px;">
        <option value="">— Select officer —</option>
        ${deptOfficers.map(o => `<option value="${o.id}" ${o.id === c.assignedTo ? "disabled" : ""}>${o.name} (${o.zone})</option>`).join("")}
      </select>
      <p id="reassign-err" style="color:#E53935;font-size:12px;display:none;margin-bottom:8px;">Please select an officer.</p>
      <label style="font-size:12.5px;font-weight:600;display:block;margin-bottom:6px;">Reason (optional)</label>
      <textarea id="reassign-reason" style="width:100%;padding:9px 12px;border:1.5px solid #E8EAED;border-radius:8px;font-size:13px;resize:vertical;height:72px;" placeholder="e.g. Case delayed — reassigning to available officer"></textarea>
      <div style="display:flex;gap:10px;margin-top:16px;">
        <button onclick="closeReassignModal()" style="flex:1;padding:10px;border:1.5px solid #E8EAED;border-radius:8px;background:#fff;font-size:13px;cursor:pointer;">Cancel</button>
        <button onclick="confirmReassign()" style="flex:1;padding:10px;background:#E53935;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">Reassign & Notify</button>
      </div>
    </div>`;

  modal.style.display = "flex";
};

window.closeReassignModal = function() {
  const modal = document.getElementById("reassign-modal");
  if (modal) modal.style.display = "none";
  _reassignCaseId = null;
};

window.confirmReassign = function() {
  const officerId = document.getElementById("reassign-officer-sel")?.value;
  const reason    = document.getElementById("reassign-reason")?.value.trim();
  const errEl     = document.getElementById("reassign-err");

  if (!officerId) { if (errEl) errEl.style.display = "block"; return; }
  if (errEl) errEl.style.display = "none";

  const id = _reassignCaseId;
  const c  = getCases().find(x => x.id === id);
  if (!c) return;

  const newOfficerName  = resolveOfficerName(officerId) || officerId;
  const prevOfficerName = resolveOfficerName(c.assignedTo) || "Previous officer";

  updateCase(id, { assignedTo: officerId, status: "Assigned" });

  appendActivity(id, {
    type:  "reassigned",
    label: `Case reassigned from Officer ${prevOfficerName} to Officer ${newOfficerName} by Supervisor ${supervisor?.name}.${reason ? " Reason: " + reason : ""}`
  });

  // Notify new officer
  pushNotification(
    officerId,
    `📋 Case ${id} (${c.category}) has been reassigned to you by Supervisor ${supervisor?.name}.${reason ? " Reason: " + reason : ""}`,
    id
  );

  // Notify previous officer
  if (c.assignedTo && c.assignedTo !== officerId) {
    pushNotification(
      c.assignedTo,
      `Case ${id} (${c.category}) has been reassigned away from you by Supervisor ${supervisor?.name}.`,
      id
    );
  }

  closeReassignModal();
  renderTable();
  updateStats();
  toast(`Case ${id} reassigned to Officer ${newOfficerName}. Notification sent.`, "green");
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg, color = "green") {
  const map = { green:"#2E7D32", red:"#E53935", blue:"#1565C0" };
  const t   = document.createElement("div");
  t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;
    background:${map[color]||"#2E7D32"};color:#fff;padding:12px 20px;border-radius:10px;
    font-size:13.5px;font-family:'DM Sans',sans-serif;font-weight:500;
    box-shadow:0 4px 16px rgba(0,0,0,.2);`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

updateStats();
renderTable();