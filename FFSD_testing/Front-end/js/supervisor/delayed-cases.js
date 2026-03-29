// js/supervisor/delayed-cases.js
import { getCases, updateCase, resolveOfficerName, priorityBadge, formatDate } from './supervisorData.js';
import { populateSupervisorIdentity } from './sidebar-identity.js';

populateSupervisorIdentity();

const tbody      = document.getElementById("delayed-tbody");
const emptyState = document.getElementById("empty-state");

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Exact days elapsed since createdAt (0 = today) */
function daysOpen(c) {
  if (!c.createdAt) return 0;
  return Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86400000);
}

/**
 * "Escalated / delayed" cases = all active cases for this supervisor's dept.
 * We show every non-resolved case so the table is never empty when there
 * are real submissions. The stat cards bucket them by age.
 */
function getEscalatedCases() {
  return getCases()
    .filter(c => !["Resolved", "Closed"].includes(c.status))
    .map(c => ({ ...c, _days: daysOpen(c) }))
    .sort((a, b) => b._days - a._days); // oldest first
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function updateStats() {
  const all = getEscalatedCases();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("stat-3d",  all.filter(c => c._days > 3).length);
  set("stat-7d",  all.filter(c => c._days > 7).length);
  set("stat-14d", all.filter(c => c._days > 14).length);
  set("stat-esc", all.filter(c => c._days > 14).length);
  // Total active shown in table
  const totalEl = document.getElementById("stat-total");
  if (totalEl) totalEl.textContent = all.length;
}

// ── Priority dropdown ─────────────────────────────────────────────────────────
/** Render an inline priority selector that saves on change */
function prioritySelect(caseId, current) {
  const pClass = current === "High" ? "p-high" : current === "Medium" ? "p-medium" : "p-low";
  const opts = ["High", "Medium", "Low"]
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

  if (cases.length === 0) {
    tbody.innerHTML = "";
    return;
  }

  tbody.innerHTML = cases.map(c => {
    const days        = c._days;
    const officerName = resolveOfficerName(c.assignedTo) || "Unassigned";

    // Age cell colour: red > 14 days, orange 4–14, gray 0–3
    const ageCls = days > 14 ? "age-critical"
                 : days > 3  ? "age-warn"
                 :              "age-ok";

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
            <button class="btn-sm btn-sm-red"     onclick="reassignCase('${c.id}')">Reassign Case</button>
          </div>
        </td>
      </tr>`;
  }).join("");
}

// ── Actions ───────────────────────────────────────────────────────────────────

window.changePriority = function(id, newPriority, selectEl) {
  updateCase(id, { priority: newPriority });
  // Update the dropdown's colour class immediately
  if (selectEl) {
    selectEl.classList.remove("p-high", "p-medium", "p-low");
    selectEl.classList.add(newPriority === "High" ? "p-high" : newPriority === "Medium" ? "p-medium" : "p-low");
  }
  updateStats();
  toast(`Priority updated to ${newPriority}`, "green");
};

window.sendReminder = function(id) {
  toast(`Reminder sent for case ${id}`, "blue");
};

window.reassignCase = function(id) {
  const officer = prompt("Enter new officer name to reassign this case:");
  if (officer?.trim()) {
    updateCase(id, { assignedTo: officer.trim(), status: "Assigned" });
    renderTable();
    updateStats();
    toast(`Case ${id} reassigned to ${officer.trim()}`, "green");
  }
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg, color = "green") {
  const map = { green: "#2E7D32", red: "#E53935", blue: "#1565C0" };
  const t   = document.createElement("div");
  t.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    background:${map[color] || "#2E7D32"};color:#fff;
    padding:12px 20px;border-radius:10px;font-size:13.5px;
    font-family:'DM Sans',sans-serif;font-weight:500;
    box-shadow:0 4px 16px rgba(0,0,0,.2);`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ── Init ──────────────────────────────────────────────────────────────────────
updateStats();
renderTable();