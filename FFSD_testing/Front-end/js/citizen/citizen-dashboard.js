// js/citizen/citizen-dashboard.js

import { fetchCases } from "../index.js";

// ── 1. Get session FIRST (must be before anything uses currentUser) ────────────
const currentUser = JSON.parse(sessionStorage.getItem("ct_user"));

if (!currentUser || currentUser.role !== "citizen") {
  window.location.href = "../../login.html";
}

// ── 2. Update name & avatar ───────────────────────────────────────────────────
const initials = currentUser.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
 
document.getElementById("sidebarUserName").textContent = currentUser.name;
document.getElementById("topbarUserName").textContent  = currentUser.name;
document.querySelectorAll(".avatar").forEach(el => el.textContent = initials);

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatusBadge(status) {
  const map = {
    "Assigned":    "badge-assigned",
    "In Progress": "badge-progress",
    "Resolved":    "badge-resolved",
    "Closed":      "badge-closed",
    "Pending":     "badge-pending",
    "Submitted":   "badge-pending"
  };
  return `<span class="badge ${map[status] || "badge-closed"}">${status}</span>`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function showAlert(msg) {
  const banner = document.getElementById("alertBanner");
  document.getElementById("alertText").textContent = msg;
  banner.style.display = "flex";
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderStats(cases) {
  document.getElementById("statTotal").textContent    = cases.length;
  document.getElementById("statOpen").textContent     = cases.filter(c => c.status === "Assigned").length;
  document.getElementById("statProgress").textContent = cases.filter(c => c.status === "In Progress").length;
  document.getElementById("statResolved").textContent = cases.filter(c => c.status === "Resolved").length;

  const subtitle = document.getElementById("dashSubtitle");
  subtitle.textContent = cases.length === 0
    ? "No complaints submitted yet."
    : `You have ${cases.length} complaint${cases.length > 1 ? "s" : ""} on record.`;
}

function renderTable(cases) {
  const tbody = document.getElementById("recentTableBody");

  if (!cases.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No complaints found. <a href="citizen-submit-complaint.html" style="color:var(--red)">Submit one now →</a></td></tr>`;
    return;
  }

  const recent = cases.slice(-5).reverse();
  tbody.innerHTML = recent.map(c => `
    <tr>
      <td><span class="case-id">${c.id}</span></td>
      <td>${c.category || "—"}</td>
      <td>${c.department || "—"}</td>
      <td>${c.zone || "—"}</td>
      <td>${getStatusBadge(c.status)}</td>
      <td class="text-muted text-sm">${formatDate(c.createdAt)}</td>
      <td>
        <a href="citizen-complaint-detail.html?id=${c.id}" class="btn btn-outline btn-xs">View</a>
      </td>
    </tr>
  `).join("");
}

// ── Init ──────────────────────────────────────────────────────────────────────
function init() {
  try {
    // Filter cases to only this citizen's submissions
    const allCases = fetchCases();
    const myCases  = allCases.filter(c => c.submittedBy === currentUser.id);

    renderStats(myCases);
    renderTable(myCases);

    const hasPending = myCases.some(c => c.transfer?.status === "pending");
    if (hasPending) showAlert("One or more of your cases have a pending transfer request.");
  } catch (err) {
    console.error("Dashboard init error:", err);
    document.getElementById("recentTableBody").innerHTML =
      `<tr><td colspan="7" class="empty-state">Failed to load complaints.</td></tr>`;
  }
}

init();