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

const tbody = document.getElementById("users-table-body");

let backendUsers = [];

// ── LOAD DEPARTMENTS ───────────────────────────────────
async function loadDepartments() {
  try {
    const res = await fetch("http://localhost:3000/departments", {
      headers: { role: "superuser" }
    });

    const depts = await res.json();

    const select = document.getElementById("user-dept");

    if (!select) return;

    select.innerHTML =
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

    backendUsers = await res.json();

    renderStats();
    renderTable();

  } catch (err) {
    console.error("Failed to load users:", err);
  }
}

// ── STATS ─────────────────────────────────────────────
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

// ── ROLE CHANGE (ZONE FIX) ─────────────────────────────
document.getElementById("user-role")?.addEventListener("change", (e) => {
  const role = e.target.value;

  const zoneGroup = document.getElementById("zone-group");

  if (!zoneGroup) return;

  if (role === "supervisor") {
    zoneGroup.style.display = "none";
  } else {
    zoneGroup.style.display = "block";
  }
});

// ── TABLE ─────────────────────────────────────────────
function renderTable() {
  if (!backendUsers.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = backendUsers.map(u => `
    <tr>
      <td>${u.name}</td>
      <td>${u.role}</td>
      <td>${u.department || "—"}</td>
      <td>${u.zone || "—"}</td>
      <td>
        <button onclick="deleteUser(${u.id})" class="btn-sm btn-sm-red">Delete</button>
      </td>
    </tr>
  `).join("");
}

// ── DELETE USER ───────────────────────────────────────
window.deleteUser = async function(id) {
  if (!confirm("Delete user?")) return;

  await fetch(`http://localhost:3000/users/${id}`, {
    method: "DELETE",
    headers: { role: "superuser" }
  });

  await loadUsers();
};

// ── CREATE USER ───────────────────────────────────────
window.createUser = async function() {
  const name = document.getElementById("user-name").value;
  const role = document.getElementById("user-role").value;
  const dept = document.getElementById("user-dept").value;
  const zone = document.getElementById("user-zone").value;
  const password = document.getElementById("user-password").value;

  if (!name || !role) {
    alert("Name and role required");
    return;
  }

  if (!password) {
    alert("Password required");
    return;
  }

  const body = {
    name,
    role,
    password
  };

  if (dept) body.department = dept;

  if (role === "officer" && zone) {
    body.zone = zone;
  }

  await fetch("http://localhost:3000/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      role: "superuser"
    },
    body: JSON.stringify(body)
  });

  closeModal();
  await loadUsers();
};

// ── MODAL ─────────────────────────────────────────────
window.openAddUser = function() {
  document.getElementById("user-modal").classList.remove("hidden");
};

window.closeModal = function() {
  document.getElementById("user-modal").classList.add("hidden");
};

// ── BUTTON BINDINGS ───────────────────────────────────
document.getElementById("btn-add-user")?.addEventListener("click", openAddUser);
document.getElementById("btn-save")?.addEventListener("click", createUser);
document.getElementById("btn-cancel")?.addEventListener("click", closeModal);
document.getElementById("modal-close")?.addEventListener("click", closeModal);

// ── INIT ──────────────────────────────────────────────
loadUsers();
loadDepartments();