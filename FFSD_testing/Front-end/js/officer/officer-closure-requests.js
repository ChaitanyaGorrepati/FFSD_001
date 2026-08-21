// js/officer-closure-requests.js

import {
  getOfficerSession, initOfficerUI, updateSidebarBadges,
  statusBadge, formatDate
} from "./officer-utils.js";

import { handleGetCases } from "../../controllers/caseController.js"; // ✅ backend

// ── Session ─────────────────────────────────────
const user = getOfficerSession();
if (!user) throw new Error("No session");

initOfficerUI(user);
updateSidebarBadges(user.id);

document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("ct_user");
  sessionStorage.removeItem("ct_selected_role");
  window.location.href = "../index.html";
});

// ── STATE ───────────────────────────────────────
let backendCases = [];
let activeFilter = "all";

// ── Normalize backend → UI ─────────────────────
function normalizeCases(data) {
  return data.map(c => ({
    ...c,
    assignedTo: c.assignedOfficerId,

    closureRequest: {
      status: c.closureStatus || "pending",
      requestedAt: c.createdAt,
      summary: c.description,
      supervisorId: null
    }
  }));
}

// ── Normalize status ───────────────────────────
function normalizeStatus(raw) {
  const s = (raw || "").toLowerCase();
  if (s === "approved") return "approved";
  if (s === "rejected") return "rejected";
  return "pending";
}

// ── Get closure cases ──────────────────────────
function getClosureCases() {
  return backendCases.filter(
    c => c.assignedTo === user.id && c.closureRequested
  );
}

// ── Badge update ───────────────────────────────
function updateClosureBadge() {
  const pending = getClosureCases().filter(
    c => normalizeStatus(c.closureStatus) === "pending"
  ).length;

  const el = document.getElementById("sb-closure-count");
  if (el) el.textContent = pending;
}

// ── Tabs ───────────────────────────────────────
document.querySelectorAll(".filter-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeFilter = tab.dataset.filter;
    render();
  });
});

// ── Badge UI ───────────────────────────────────
function closureStatusBadge(status) {
  const s = normalizeStatus(status);

  const map = {
    pending:  { cls: "badge-pending",  label: "⏳ Pending"  },
    approved: { cls: "badge-resolved", label: "✅ Approved" },
    rejected: { cls: "badge-high",     label: "❌ Rejected" },
  };

  const { cls, label } = map[s];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── Render ─────────────────────────────────────
function render() {
  const allClosure = getClosureCases();

  // Stats
  const pendingCount  = allClosure.filter(c => normalizeStatus(c.closureStatus) === "pending").length;
  const approvedCount = allClosure.filter(c => normalizeStatus(c.closureStatus) === "approved").length;
  const rejectedCount = allClosure.filter(c => normalizeStatus(c.closureStatus) === "rejected").length;

  document.getElementById("stat-pending").textContent  = pendingCount;
  document.getElementById("stat-approved").textContent = approvedCount;
  document.getElementById("stat-rejected").textContent = rejectedCount;

  // Filter
  let filtered = allClosure;
  if (activeFilter !== "all") {
    filtered = allClosure.filter(
      c => normalizeStatus(c.closureStatus) === activeFilter
    );
  }

  // Sort
  filtered.sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  const tbody = document.getElementById("closure-list-body");

  if (!filtered.length) {
    const label = activeFilter === "all"
      ? "No closure requests yet."
      : `No ${activeFilter} closure requests.`;

    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">${label}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    return `
      <tr>
        <td>${c.id}</td>
        <td>${c.title || "—"}</td>
        <td>${c.department}</td>
        <td>Supervisor</td>
        <td>${c.description || "—"}</td>
        <td>${closureStatusBadge(c.closureStatus)}</td>
        <td>${formatDate(c.createdAt)}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-outline btn-xs"
              onclick="openDetail(${c.id})">Detail</button>
            <a href="officer-case-details.html?id=${c.id}"
              class="btn btn-xs" style="background:var(--red);color:#fff;">
              Open
            </a>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// ── INIT ───────────────────────────────────────
async function init() {
  try {
    const data = await handleGetCases("officer", user.id);

    backendCases = normalizeCases(data);

    updateClosureBadge();
    render();

  } catch (err) {
    console.error("Closure request error:", err);
  }
}

init();