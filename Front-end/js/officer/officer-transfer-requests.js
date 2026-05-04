// js/officer-transfer-requests.js
import {
  getOfficerSession, initOfficerUI, getOfficerCases,
  updateSidebarBadges, statusBadge, formatDate,
  updateCaseById, getCaseById, getAllCases
} from "./officer-utils.js";

const user = getOfficerSession();
if (!user) throw new Error("No session");

initOfficerUI(user);
updateSidebarBadges(user.id);

// ── Check if arriving from case-details with ?id= ─────────────────────────────
const params  = new URLSearchParams(window.location.search);
const fromId  = params.get("id");

if (fromId) {
  const c = getCaseById(fromId);
  if (c) {
    showTransferForm(c);
  }
}

function showTransferForm(c) {
  const formCard = document.getElementById("transfer-form-card");
  formCard.style.display = "block";

  document.getElementById("transfer-case-info").innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:20px;">
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px;">Case ID</div>
        <div style="font-family:'DM Mono',monospace;font-size:13.5px;font-weight:600;">${c.id}</div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px;">Title</div>
        <div style="font-size:13.5px;font-weight:500;">${c.title || "—"}</div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px;">Current Department</div>
        <div style="font-size:13.5px;font-weight:500;">${c.department || "—"}</div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px;">Status</div>
        <div>${statusBadge(c.status)}</div>
      </div>
    </div>
  `;

  // Pre-fill dept select to exclude current dept
  const deptSelect = document.getElementById("transfer-dept");
  Array.from(deptSelect.options).forEach(opt => {
    opt.disabled = opt.value === c.department;
  });

  // Store case id in form for submit
  formCard.dataset.caseId = c.id;

  // Scroll to form
  formCard.scrollIntoView({ behavior: "smooth" });
}

// ── Cancel transfer form ──────────────────────────────────────────────────────
window.cancelTransferForm = function() {
  const formCard = document.getElementById("transfer-form-card");
  formCard.style.display = "none";
  // Remove ?id from URL cleanly
  history.replaceState({}, "", "officer-transfer-requests.html");
};

// ── Submit transfer ───────────────────────────────────────────────────────────
window.submitTransfer = function() {
  const formCard = document.getElementById("transfer-form-card");
  const caseId   = formCard.dataset.caseId;
  const toDept   = document.getElementById("transfer-dept").value;
  const reason   = document.getElementById("transfer-reason").value;
  const notes    = document.getElementById("transfer-notes").value.trim();
  const errorEl  = document.getElementById("transfer-error");

  if (!toDept || !reason) {
    errorEl.textContent = "Please select a department and reason.";
    errorEl.style.display = "block";
    return;
  }

  errorEl.style.display = "none";

  updateCaseById(caseId, {
    status: "Transferred",
    transfer: {
      requested: true,
      toDept,
      reason,
      notes,
      status: "pending",
      requestedBy: user.id,
      requestedAt: new Date().toISOString()
    }
  });

  // Reset form
  document.getElementById("transfer-dept").value   = "";
  document.getElementById("transfer-reason").value = "";
  document.getElementById("transfer-notes").value  = "";
  formCard.style.display = "none";
  history.replaceState({}, "", "officer-transfer-requests.html");

  renderTransferList();
  updateSidebarBadges(user.id);

  // Brief success flash
  showSuccess(`Transfer request submitted for case ${caseId}.`);
};

function showSuccess(msg) {
  const banner = document.createElement("div");
  banner.style.cssText = "position:fixed;top:20px;right:24px;background:#22C55E;color:#fff;padding:12px 20px;border-radius:8px;font-size:13.5px;font-weight:600;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.15);";
  banner.textContent = msg;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 3000);
}

// ── Render transfer list ───────────────────────────────────────────────────────
function renderTransferList() {
  const allCases = getOfficerCases(user.id);
  const transferred = allCases.filter(c => c.transfer && c.transfer.requested);

  const tbody = document.getElementById("transfer-list-body");

  if (!transferred.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No transfer requests yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = transferred.map(c => {
    const t = c.transfer;
    const statusColor = t.status === "approved"
      ? "badge-resolved"
      : t.status === "rejected"
      ? "badge-high"
      : "badge-pending";

    return `
      <tr>
        <td><span class="font-mono" style="font-size:12.5px;color:var(--text-secondary);">${c.id}</span></td>
        <td style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500;">${c.title || "—"}</td>
        <td>${c.department || "—"}</td>
        <td>${t.toDept || "—"}</td>
        <td style="font-size:13px;color:var(--text-secondary);">${t.reason || "—"}</td>
        <td><span class="badge ${statusColor}">${t.status || "pending"}</span></td>
        <td style="color:var(--text-secondary);font-size:13px;">${formatDate(t.requestedAt || c.createdAt)}</td>
        <td>
          <a href="officer-case-details.html?id=${c.id}" class="btn btn-xs btn-outline">View Case</a>
        </td>
      </tr>
    `;
  }).join("");
}

renderTransferList();