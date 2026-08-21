// js/superuser/superuser-cases.js

// ── Auth Guard ──────────────────────────────────────────
(function() {
  const _su = JSON.parse(sessionStorage.getItem("ct_user") || "null");
  if (!_su || _su.role !== "superuser") {
    window.location.href = "../role-selection.html";
  }
})();

// ── STATE ───────────────────────────────────────────────
let backendCases = [];
let currentViewingCaseId = null;

const tbody = document.getElementById("cases-table-body");
const caseModal = document.getElementById("case-modal");

// ── FETCH CASES ─────────────────────────────────────────
async function loadCases() {
  const res = await fetch("http://localhost:3000/cases", {
    headers: { role: "superuser" }
  });

  backendCases = await res.json();
  renderTable();
  updateStatistics();
}

// ── BADGE ───────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    open: "badge-assigned",
    "in-progress": "badge-progress",
    closed: "badge-closed"
  };

  const label = {
    open: "Assigned",
    "in-progress": "In Progress",
    closed: "Closed"
  };

  return `<span class="badge ${map[status] || "badge-closed"}">${label[status] || status}</span>`;
}

// ── STATS ───────────────────────────────────────────────
function updateStatistics() {
  const total = backendCases.length;
  const open = backendCases.filter(c => c.status === "open").length;
  const progress = backendCases.filter(c => c.status === "in-progress").length;
  const closed = backendCases.filter(c => c.status === "closed").length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-open").textContent = open;
  document.getElementById("stat-in-progress").textContent = progress;
  document.getElementById("stat-resolved").textContent = progress;
  document.getElementById("stat-closed").textContent = closed;
}

// ── TABLE ───────────────────────────────────────────────
function renderTable() {
  if (!backendCases.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No cases found.</td></tr>`;
    return;
  }

  tbody.innerHTML = backendCases.map(c => `
    <tr>
      <td>${c.id}</td>
      <td>${c.citizenId || "—"}</td>
      <td>${c.category || c.title || "—"}</td>
      <td>${c.department}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${new Date(c.createdAt).toLocaleDateString()}</td>
      <td>
        <button onclick="viewCase(${c.id})" class="action-btn view">View</button>
        <button onclick="deleteCaseFn(${c.id})" class="action-btn delete">Delete</button>
      </td>
    </tr>
  `).join("");
}

// ── VIEW ────────────────────────────────────────────────
window.viewCase = function(id) {
  const c = backendCases.find(x => x.id == id);
  if (!c) return;

  currentViewingCaseId = id;

  document.getElementById("view-case-id-display").value = c.id;
  document.getElementById("view-category").value = c.category || "";
  document.getElementById("view-department").value = c.department;
  document.getElementById("view-status").value = c.status;
  document.getElementById("view-description").value = c.description || "";

  caseModal.classList.remove("hidden");
};

// ── DELETE ──────────────────────────────────────────────
window.deleteCaseFn = async function(id) {
  if (!confirm("Delete this case?")) return;

  await fetch(`http://localhost:3000/cases/${id}`, {
    method: "DELETE",
    headers: { role: "superuser" }
  });

  await loadCases();
};

// ── CLOSE MODAL ─────────────────────────────────────────
document.getElementById("case-modal-close")
  ?.addEventListener("click", () => caseModal.classList.add("hidden"));

// ── INIT ────────────────────────────────────────────────
loadCases();