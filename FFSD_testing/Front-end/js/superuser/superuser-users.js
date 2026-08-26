// js/superuser/superuser-users.js

import { populateSupervisorIdentity } from "../supervisor/sidebar-identity.js";

// ── AUTH GUARD ─────────────────────────────────────────
(function () {
  const u = JSON.parse(sessionStorage.getItem("ct_user"));
  if (!u || u.role !== "superuser") {
    window.location.href = "../role-selection.html";
  }
})();

populateSupervisorIdentity();

// ── STATE ──────────────────────────────────────────────
let backendUsers = [];
let activeRoleFilter = "all";
let editingUserId = null;
let pendingDeleteUser = null;

// ── DOM ELEMENTS ───────────────────────────────────────
const tbody = document.getElementById("users-table-body");
const userModal = document.getElementById("user-modal");
const confirmModal = document.getElementById("confirm-modal");
const modalTitle = document.getElementById("modal-title");
const btnSave = document.getElementById("btn-save");
const btnAddUser = document.getElementById("btn-add-user");
const nameInput = document.getElementById("user-name");
const passwordInput = document.getElementById("user-password");
const passwordReq = document.getElementById("password-req");
const roleSelect = document.getElementById("user-role");
const deptSelect = document.getElementById("user-dept");
const zoneSelect = document.getElementById("user-zone");
const zoneGroup = document.getElementById("zone-group");
const confirmUserName = document.getElementById("confirm-user-name");

// ── HELPERS ────────────────────────────────────────────
function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
}

function roleBadge(role) {
  const map = {
    officer: "badge-officer",
    supervisor: "badge-supervisor",
    citizen: "badge-citizen",
  };
  return `<span class="badge ${map[role] || ""}">${capitalize(role)}</span>`;
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

// ── LOAD DEPARTMENTS ───────────────────────────────────
async function loadDepartments() {
  try {
    const res = await fetch("http://localhost:3000/departments", {
      headers: { role: "superuser" }
    });
    if (!res.ok) return;
    const depts = await res.json();
    if (!deptSelect) return;

    deptSelect.innerHTML =
      `<option value="">— Select Department —</option>` +
      depts.map(d => `<option value="${d.name.toLowerCase()}">${d.name}</option>`).join("");
  } catch (err) {
    console.error("Dept load error", err);
  }
}

// ── LOAD USERS ─────────────────────────────────────────
async function loadUsers() {
  try {
    const res = await fetch("http://localhost:3000/users", {
      headers: { role: "superuser" }
    });
    if (!res.ok) {
      console.error("Failed to load users: Server returned", res.status);
      return;
    }
    backendUsers = await res.json();
    renderStats();
    renderTable();
  } catch (err) {
    console.error("Failed to load users:", err);
  }
}

// ── STATS ──────────────────────────────────────────────
function renderStats() {
  const total = backendUsers.length;
  const supervisors = backendUsers.filter(u => u.role === "supervisor").length;
  const officers = backendUsers.filter(u => u.role === "officer").length;
  const citizens = backendUsers.filter(u => u.role === "citizen").length;

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set("stat-total", total);
  set("stat-supervisors", supervisors);
  set("stat-officers", officers);
  set("stat-citizens", citizens);
}

// ── FILTERING ──────────────────────────────────────────
function setRoleFilter(role) {
  activeRoleFilter = role;

  // Update tabs active state
  document.querySelectorAll("#role-filter .filter-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.role === role);
  });

  // Toggle Add button visibility (hidden on citizen tab)
  if (btnAddUser) {
    btnAddUser.style.display = role === "citizen" ? "none" : "inline-flex";
  }

  renderTable();
}

// Filter tabs click
document.getElementById("role-filter")?.addEventListener("click", (e) => {
  const tab = e.target.closest(".filter-tab");
  if (tab && tab.dataset.role) {
    setRoleFilter(tab.dataset.role);
  }
});

// Stat cards click
document.querySelectorAll(".stat-filter-btn").forEach(card => {
  card.addEventListener("click", () => {
    const role = card.dataset.role || "all";
    setRoleFilter(role);
  });
});

// ── ROLE CHANGE (ZONE FIX) ─────────────────────────────
roleSelect?.addEventListener("change", (e) => {
  const role = e.target.value;
  if (!zoneGroup) return;
  zoneGroup.style.display = role === "supervisor" ? "none" : "block";
});

// ── TABLE ──────────────────────────────────────────────
function renderTable() {
  const filtered = activeRoleFilter === "all"
    ? backendUsers
    : backendUsers.filter(u => u.role === activeRoleFilter);

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td><span class="font-semibold">${u.name}</span></td>
      <td>${roleBadge(u.role)}</td>
      <td>${u.department ? capitalize(u.department) : "—"}</td>
      <td>${u.zone || "—"}</td>
      <td>
        <div class="flex gap-2">
          <button class="action-btn edit" data-id="${u.id}" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button class="action-btn delete" data-id="${u.id}" data-name="${u.name}" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

// ── TABLE EVENT DELEGATION ─────────────────────────────
tbody.addEventListener("click", e => {
  const editBtn = e.target.closest(".action-btn.edit");
  const deleteBtn = e.target.closest(".action-btn.delete");

  if (editBtn) {
    const id = Number(editBtn.dataset.id);
    openEditModal(id);
  } else if (deleteBtn) {
    const id = Number(deleteBtn.dataset.id);
    const name = deleteBtn.dataset.name;
    openConfirmModal({ id, name });
  }
});

// ── ADD USER MODAL ─────────────────────────────────────
function openAddModal() {
  clearErrors();
  editingUserId = null;
  modalTitle.textContent = "Add Officer / Supervisor";
  btnSave.textContent = "Save User";

  document.getElementById("edit-user-id").value = "";
  nameInput.value = "";
  passwordInput.value = "";
  passwordInput.placeholder = "Set user password";
  if (passwordReq) passwordReq.textContent = "*";

  // Superuser can only create officer or supervisor
  roleSelect.disabled = false;
  roleSelect.innerHTML = `
    <option value="">— Select Role —</option>
    <option value="officer">Officer</option>
    <option value="supervisor">Supervisor</option>
  `;
  roleSelect.value = "";

  deptSelect.value = "";
  zoneSelect.value = "";
  if (zoneGroup) zoneGroup.style.display = "block";

  userModal.classList.remove("hidden");
  nameInput.focus();
}

// ── EDIT USER MODAL ────────────────────────────────────
function openEditModal(id) {
  const user = backendUsers.find(u => u.id === id);
  if (!user) return;

  clearErrors();
  editingUserId = user.id;
  modalTitle.textContent = "Edit User";
  btnSave.textContent = "Save Changes";

  document.getElementById("edit-user-id").value = user.id;
  nameInput.value = user.name || "";
  passwordInput.value = "";
  passwordInput.placeholder = "Leave blank to keep existing password";
  if (passwordReq) passwordReq.textContent = "";

  // Role management RBAC
  if (user.role === "citizen") {
    roleSelect.disabled = true;
    roleSelect.innerHTML = `<option value="citizen">Citizen (Self-Registered)</option>`;
    roleSelect.value = "citizen";
    if (zoneGroup) zoneGroup.style.display = "none";
  } else if (user.role === "superuser") {
    roleSelect.disabled = true;
    roleSelect.innerHTML = `<option value="superuser">Super User (System Admin)</option>`;
    roleSelect.value = "superuser";
    if (zoneGroup) zoneGroup.style.display = "none";
  } else {
    roleSelect.disabled = false;
    roleSelect.innerHTML = `
      <option value="officer">Officer</option>
      <option value="supervisor">Supervisor</option>
    `;
    roleSelect.value = user.role;
    if (zoneGroup) {
      zoneGroup.style.display = user.role === "supervisor" ? "none" : "block";
    }
  }

  deptSelect.value = user.department ? user.department.toLowerCase() : "";
  zoneSelect.value = user.zone || "";

  userModal.classList.remove("hidden");
  nameInput.focus();
}

function closeUserModal() {
  userModal.classList.add("hidden");
  clearErrors();
}

// ── SAVE USER HANDLER ──────────────────────────────────
async function handleSave() {
  clearErrors();
  let valid = true;

  const name = nameInput.value.trim();
  const role = roleSelect.value;
  const dept = deptSelect.value;
  const zone = zoneSelect.value;
  const password = passwordInput.value;

  if (!name) {
    showError("err-name", "Full name is required.");
    valid = false;
  }

  if (editingUserId === null) {
    // Add mode
    if (!role) {
      showError("err-role", "Role is required.");
      valid = false;
    } else if (role !== "officer" && role !== "supervisor") {
      showError("err-role", "Superuser can only create Officers or Supervisors.");
      valid = false;
    }

    if (!password) {
      showError("err-password", "Password is required for new users.");
      valid = false;
    }

    if (!valid) return;

    const body = { name, role, password };
    if (dept) body.department = dept;
    if (role === "officer" && zone) body.zone = zone;

    try {
      const res = await fetch("http://localhost:3000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          role: "superuser"
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showError("err-global", errData.message || "Failed to create user.");
        return;
      }

      closeUserModal();
      await loadUsers();
    } catch (err) {
      console.error("Save user error:", err);
      showError("err-global", "Network error. Please try again.");
    }

  } else {
    // Edit mode
    if (!valid) return;

    const body = { name };

    if (!roleSelect.disabled && role) {
      // Prevent privilege escalation to superuser or citizen
      if (role !== "officer" && role !== "supervisor") {
        showError("err-role", "Invalid role selected.");
        return;
      }
      body.role = role;
    }

    if (dept) body.department = dept;
    if (role === "officer" && zone) {
      body.zone = zone;
    } else if (role === "supervisor") {
      body.zone = "";
    }

    if (password && password.trim() !== "") {
      body.password = password;
    }

    try {
      const res = await fetch(`http://localhost:3000/users/${editingUserId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          role: "superuser"
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showError("err-global", errData.message || "Failed to update user.");
        return;
      }

      closeUserModal();
      await loadUsers();
    } catch (err) {
      console.error("Update user error:", err);
      showError("err-global", "Network error. Please try again.");
    }
  }
}

// ── CONFIRM DELETE MODAL ───────────────────────────────
function openConfirmModal(user) {
  pendingDeleteUser = user;
  if (confirmUserName) confirmUserName.textContent = user.name;
  confirmModal.classList.remove("hidden");
}

function closeConfirmModal() {
  pendingDeleteUser = null;
  confirmModal.classList.add("hidden");
}

async function handleDelete() {
  if (!pendingDeleteUser) return;

  try {
    const res = await fetch(`http://localhost:3000/users/${pendingDeleteUser.id}`, {
      method: "DELETE",
      headers: { role: "superuser" }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      alert(errData.message || "Failed to delete user.");
    }
  } catch (err) {
    console.error("Delete user error:", err);
    alert("Network error while attempting to delete user.");
  }

  closeConfirmModal();
  await loadUsers();
}

// ── BUTTON BINDINGS & BACKDROP ─────────────────────────
btnAddUser?.addEventListener("click", openAddModal);
btnSave?.addEventListener("click", handleSave);
document.getElementById("btn-cancel")?.addEventListener("click", closeUserModal);
document.getElementById("modal-close")?.addEventListener("click", closeUserModal);

document.getElementById("confirm-close")?.addEventListener("click", closeConfirmModal);
document.getElementById("btn-confirm-cancel")?.addEventListener("click", closeConfirmModal);
document.getElementById("btn-confirm-delete")?.addEventListener("click", handleDelete);

userModal?.addEventListener("click", e => { if (e.target === userModal) closeUserModal(); });
confirmModal?.addEventListener("click", e => { if (e.target === confirmModal) closeConfirmModal(); });

// ── INIT ───────────────────────────────────────────────
loadUsers();
loadDepartments();