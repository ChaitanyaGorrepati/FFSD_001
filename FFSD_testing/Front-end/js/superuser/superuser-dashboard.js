// js/superuser/superuser-dashboard.js

import { initDepartments, getDepartments } from "../../models/departmentModel.js";

// ── Auth Guard ────────────────────────────────────────────────────────────────
(function() {
  const _su = JSON.parse(sessionStorage.getItem("ct_user") || "null");
  if (!_su || _su.role !== "superuser") {
    window.location.href = "../role-selection.html";
  }
})();

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    Assigned: "badge-assigned",
    "In Progress": "badge-progress",
    Resolved: "badge-resolved",
    Closed: "badge-closed",
    Pending: "badge-pending",
    open: "badge-assigned",
    "in-progress": "badge-progress",
    closed: "badge-closed"
  };

  const labelMap = {
    open: "Assigned",
    "in-progress": "In Progress",
    closed: "Closed"
  };

  const display = labelMap[status] || status;
  const cls = map[status] || "badge-closed";

  return `<span class="badge ${cls}">${display}</span>`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

// ── STATS (BACKEND) ──────────────────────────────────────────────────────────
async function renderStats() {
  try {
    // 🔥 USERS
    const userRes = await fetch("http://localhost:3000/users", {
      headers: {
        Authorization: "Bearer demo-auth-token",
        role: "superuser"
      }
    });
    const users = await userRes.json();

    // 🔥 CASES
    const caseRes = await fetch("http://localhost:3000/cases", {
      headers: {
        Authorization: "Bearer demo-auth-token",
        role: "superuser"
      }
    });
    const cases = await caseRes.json();

    const depts = getDepartments();

    const openStatuses = ["open", "in-progress"];

    document.getElementById("stat-total-cases").textContent = cases.length;
    document.getElementById("stat-open-cases").textContent =
      cases.filter(c => openStatuses.includes(c.status)).length;

    document.getElementById("stat-total-users").textContent = users.length;
    document.getElementById("stat-departments").textContent = depts.length;

  } catch (err) {
    console.error("Stats error:", err);
  }
}

// ── RECENT CASES (BACKEND) ────────────────────────────────────────────────────
async function renderRecentCases() {
  try {
    const res = await fetch("http://localhost:3000/cases", {
      headers: {
        Authorization: "Bearer demo-auth-token",
        role: "superuser"
      }
    });

    let cases = await res.json();

    cases = cases.slice().reverse().slice(0, 10);

    const tbody = document.getElementById("recent-cases-body");

    if (!cases.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            No cases have been submitted yet.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = cases.map(c => `
      <tr>
        <td class="font-mono text-xs">${c.id}</td>
        <td>${c.title || "—"}</td>
        <td>${c.department || "—"}</td>
        <td>${c.zone || "—"}</td>
        <td>${statusBadge(c.status)}</td>
        <td class="text-muted text-sm">${formatDate(c.createdAt)}</td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Recent cases error:", err);
  }
}

// ── INIT ─────────────────────────────────────────────────────────────────────
initDepartments(); // ✅ keep (static)

renderStats();
renderRecentCases();