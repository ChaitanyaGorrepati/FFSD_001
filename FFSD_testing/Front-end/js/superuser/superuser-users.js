// js/superuser/superuser-users.js
import { initUsers } from "../../models/userModel.js";
import { initDepartments, getDepartments } from "../../models/departmentModel.js";
import { fetchUsers, createUser, editUser, removeUser } from "../../routes/userRoutes.js";

// ── Auth Guard ────────────────────────────────────────────────────────────────
(function() {
  const _su = JSON.parse(sessionStorage.getItem("ct_user") || "null");
  if (!_su || _su.role !== "superuser") {
    window.location.href = "../role-selection.html";
  }
})();

// ── State ─────────────────────────────────────────────────────────────────────
let currentFilter = "all";
let pendingDeleteId = null;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const tbody         = document.getElementById("users-table-body");
const userModal     = document.getElementById("user-modal");
const confirmModal  = document.getElementById("confirm-modal");
const modalTitle    = document.getElementById("modal-title");
const editIdInput   = document.getElementById("edit-user-id");
const nameInput     = document.getElementById("user-name");
const passwordInput = document.getElementById("user-password");
const roleSelect    = document.getElementById("user-role");
const deptSelect    = document.getElementById("user-dept");
const zoneSelect    = document.getElementById("user-zone");
const deptGroup     = document.getElementById("dept-group");
const zoneGroup     = document.getElementById("zone-group");

// ── Helpers ───────────────────────────────────────────────────────────────────
function roleBadge(role) {
  const map = {
    officer:    "badge-officer",
    supervisor: "badge-supervisor",
    citizen:    "badge-citizen"
  };
  const cls = map[role] || "badge-closed";
  return `<span class="badge ${cls}">${capitalize(role)}</span>`;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle("hidden", !msg);
}

function clearErrors() {
  ["err-name", "err-password", "err-role", "err-dept", "err-global"].forEach(id => showError(id, ""));
}

function populateDeptSelect() {
  const depts = getDepartments();
  deptSelect.innerHTML = `<option value="">— Select Department —</option>`;
  depts.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.name;
    opt.textContent = d.name;
    deptSelect.appendChild(opt);
  });
}

function toggleOptionalFields() {
  const role = roleSelect.value;
  const needsDept = role === "officer" || role === "supervisor";
  const needsZone = role === "officer";
  const needsPassword = role === "officer" || role === "supervisor";
  deptGroup.style.display = needsDept ? "" : "none";
  zoneGroup.style.display = needsZone ? "" : "none";
  document.getElementById("password-group").style.display = needsPassword ? "" : "none";
}

// ── Update Stat Cards ─────────────────────────────────────────────────────────
function updateStats() {
  const users = fetchUsers();
  document.getElementById("stat-total").textContent       = users.length;
  document.getElementById("stat-supervisors").textContent = users.filter(u => u.role === "supervisor").length;
  document.getElementById("stat-officers").textContent    = users.filter(u => u.role === "officer").length;
  document.getElementById("stat-citizens").textContent    = users.filter(u => u.role === "citizen").length;
}

// ── Render Table ──────────────────────────────────────────────────────────────
function renderTable() {
  const users = fetchUsers();
  const filtered = currentFilter === "all" ? users : users.filter(u => u.role === currentFilter);

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td>
        <div class="flex items-center gap-2">
          <div class="avatar sm">${u.name.charAt(0).toUpperCase()}</div>
          <span class="font-semibold">${u.name}</span>
        </div>
      </td>
      <td>${roleBadge(u.role)}</td>
      <td>${u.department || '<span class="text-muted">—</span>'}</td>
      <td>${u.zone || '<span class="text-muted">—</span>'}</td>
      <td>
        <div class="flex gap-2">
          ${u.role !== "citizen" ? `
          <button class="action-btn edit" data-id="${u.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>` : ""}
          <button class="action-btn delete" data-id="${u.id}" data-name="${u.name}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

// ── Event Delegation for Table Buttons ────────────────────────────────────────
tbody.addEventListener("click", e => {
  const editBtn   = e.target.closest(".action-btn.edit");
  const deleteBtn = e.target.closest(".action-btn.delete");

  if (editBtn) {
    openEditModal(editBtn.dataset.id);
  } else if (deleteBtn) {
    openConfirmModal(deleteBtn.dataset.id, deleteBtn.dataset.name);
  }
});

// ── Stat Card Filters ─────────────────────────────────────────────────────────
document.querySelectorAll(".stat-filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const role = btn.dataset.role;
    document.querySelectorAll("#role-filter .filter-tab").forEach(t => t.classList.remove("active"));
    const matchTab = document.querySelector(`#role-filter .filter-tab[data-role="${role}"]`);
    if (matchTab) matchTab.classList.add("active");
    currentFilter = role;
    renderTable();
  });
});

// ── Open Add Modal ────────────────────────────────────────────────────────────
function openAddModal() {
  clearErrors();
  modalTitle.textContent = "Add User";
  editIdInput.value = "";
  nameInput.value = "";
  passwordInput.value = "";
  roleSelect.value = "";
  deptSelect.value = "";
  zoneSelect.value = "";
  toggleOptionalFields();
  userModal.classList.remove("hidden");
  nameInput.focus();
}

// ── Open Edit Modal ───────────────────────────────────────────────────────────
function openEditModal(id) {
  const users = fetchUsers();
  const user = users.find(u => u.id === id);
  if (!user) return;

  clearErrors();
  modalTitle.textContent = "Edit User";
  editIdInput.value = user.id;
  nameInput.value = user.name;
  passwordInput.value = user.password || "";
  roleSelect.value = user.role;
  toggleOptionalFields();
  deptSelect.value = user.department || "";
  zoneSelect.value = user.zone || "";
  userModal.classList.remove("hidden");
  nameInput.focus();
}

function closeUserModal() {
  userModal.classList.add("hidden");
}

// ── Save Handler ──────────────────────────────────────────────────────────────
function handleSave() {
  clearErrors();
  let valid = true;

  const name     = nameInput.value.trim();
  const password = passwordInput.value.trim();
  const role     = roleSelect.value;
  const dept     = deptSelect.value;
  const zone     = zoneSelect.value;
  const id       = editIdInput.value;

  if (!name) { showError("err-name", "Name is required."); valid = false; }
  if (!id && (role === "officer" || role === "supervisor") && !password) { showError("err-password", "Password is required for new users."); valid = false; }
  if (!role) { showError("err-role", "Please select a role."); valid = false; }
  if ((role === "officer" || role === "supervisor") && !dept) {
    showError("err-dept", "Department is required for this role."); valid = false;
  }
  if (!valid) return;

  const data = { name, password, role, department: dept || null, zone: zone || null };

  let result;
  if (id) {
    result = editUser(id, data);
  } else {
    result = createUser(data);
  }

  if (result.error) {
    showError("err-global", result.error);
    return;
  }

  closeUserModal();
  updateStats();
  renderTable();
}

// ── Confirm Delete ────────────────────────────────────────────────────────────
function openConfirmModal(id, name) {
  pendingDeleteId = id;
  document.getElementById("confirm-user-name").textContent = name;
  confirmModal.classList.remove("hidden");
}

function closeConfirmModal() {
  pendingDeleteId = null;
  confirmModal.classList.add("hidden");
}

function handleDelete() {
  if (!pendingDeleteId) return;
  removeUser(pendingDeleteId);
  closeConfirmModal();
  updateStats();
  renderTable();
}

// ── Role filter tabs ──────────────────────────────────────────────────────────
document.getElementById("role-filter").addEventListener("click", e => {
  const tab = e.target.closest(".filter-tab");
  if (!tab) return;
  document.querySelectorAll("#role-filter .filter-tab").forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
  currentFilter = tab.dataset.role;
  renderTable();
});

// ── Button bindings ───────────────────────────────────────────────────────────
document.getElementById("btn-add-user").addEventListener("click", openAddModal);
document.getElementById("modal-close").addEventListener("click", closeUserModal);
document.getElementById("btn-cancel").addEventListener("click", closeUserModal);
document.getElementById("btn-save").addEventListener("click", handleSave);
document.getElementById("confirm-close").addEventListener("click", closeConfirmModal);
document.getElementById("btn-confirm-cancel").addEventListener("click", closeConfirmModal);
document.getElementById("btn-confirm-delete").addEventListener("click", handleDelete);

roleSelect.addEventListener("change", toggleOptionalFields);

// Close on overlay click
userModal.addEventListener("click", e => { if (e.target === userModal) closeUserModal(); });
confirmModal.addEventListener("click", e => { if (e.target === confirmModal) closeConfirmModal(); });

// ── Init ──────────────────────────────────────────────────────────────────────
initUsers();
initDepartments();
populateDeptSelect();
updateStats();
renderTable();
