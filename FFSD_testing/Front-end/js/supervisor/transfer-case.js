// js/supervisor/transfer-case.js
import { getCaseById, updateCase, resolveOfficerName, statusBadge, formatDate } from './supervisorData.js';
import { populateSupervisorIdentity } from './sidebar-identity.js';

populateSupervisorIdentity();

const params      = new URLSearchParams(window.location.search);
const caseId      = params.get("id");
let   currentCase = null;

if (caseId) {
  currentCase = getCaseById(caseId);
  populateCaseDetails();
}

function populateCaseDetails() {
  if (!currentCase) return;
  const c = currentCase;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const html = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML  = val; };

  set("breadcrumb-case", c.id);
  const inp = document.getElementById("from-dept"); if (inp) inp.value = c.department || "—";

  if (c.transfer?.toDept) {
    const sel = document.getElementById("to-dept");
    const opt = sel ? [...sel.options].find(o => o.value === c.transfer.toDept) : null;
    if (opt) opt.selected = true;
  }

  const ps   = document.getElementById("priority-select");
  const pOpt = ps ? [...ps.options].find(o => o.value === c.priority) : null;
  if (pOpt) pOpt.selected = true;

  set("tc-id",       c.id);
  set("tc-citizen",  c.citizen || "—");
  set("tc-category", c.category);
  set("tc-zone",     c.zone);
  set("tc-dept",     c.department);
  set("tc-date",     formatDate(c.createdAt));
  html("tc-status",  statusBadge(c.status));

  const viewBtn = document.getElementById("view-full-btn");
  if (viewBtn) viewBtn.href = `case-details.html?id=${c.id}`;
}

document.getElementById("transfer-btn")?.addEventListener("click", () => {
  const toDept = document.getElementById("to-dept")?.value;
  const reason = document.getElementById("transfer-reason")?.value.trim();
  let valid = true;

  const tErr = document.getElementById("to-dept-error");
  const rErr = document.getElementById("reason-error");

  if (!toDept) { if (tErr) tErr.classList.remove("hidden"); valid = false; }
  else         { if (tErr) tErr.classList.add("hidden"); }

  if (!reason) { if (rErr) rErr.classList.remove("hidden"); valid = false; }
  else         { if (rErr) rErr.classList.add("hidden"); }

  if (!valid) return;

  const priority = document.getElementById("priority-select")?.value || "Normal";

  updateCase(caseId, {
    transfer: { requested: true, toDept, status: "pending" },
    priority,
    status: "Transferred",
    notes: [...(currentCase?.notes || []), `Transfer requested to ${toDept}. Reason: ${reason}`]
  });

  toast(`Transfer request sent to ${toDept}.`, "green");
  setTimeout(() => window.location.href = "supervisor-transfer-requests.html", 1500);
});

document.getElementById("cancel-btn")?.addEventListener("click", () => history.back());

function toast(msg, color = "green") {
  const t = document.createElement("div");
  t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;
    background:${color==="green"?"#2E7D32":"#E53935"};color:#fff;padding:12px 20px;border-radius:10px;
    font-size:13.5px;font-family:'DM Sans',sans-serif;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.2);`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}