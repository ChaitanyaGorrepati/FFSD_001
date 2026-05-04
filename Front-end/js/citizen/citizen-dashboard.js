import { handleGetCases } from "../../controllers/caseController.js";
import { initNotifications } from "../../models/notificationModel.js";
import { initNotificationUI } from "../notificationUI.js";

// ── Session ─────────────────────────────────────────────────────────────
const currentUser = JSON.parse(sessionStorage.getItem("ct_user"));

if (!currentUser || currentUser.role !== "citizen") {
  window.location.href = "../../login.html";
}

// ── Notifications ───────────────────────────────────────────────────────
initNotifications();
initNotificationUI(currentUser.id);

// ── Logout ──────────────────────────────────────────────────────────────
document.getElementById("logout-btn").addEventListener("click", (e) => {
  e.preventDefault();
  sessionStorage.clear();
  window.location.href = "../login.html";
});

// ── UI Setup ────────────────────────────────────────────────────────────
const initials = currentUser.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
document.getElementById("sidebarUserName").textContent = currentUser.name;
document.getElementById("topbarUserName").textContent  = currentUser.name;
document.querySelectorAll(".avatar").forEach(el => el.textContent = initials);

// ── Helpers ─────────────────────────────────────────────────────────────
function getStatusBadge(status) {
  const map = {
    open: "badge-assigned",
    "in-progress": "badge-progress",
    resolved: "badge-resolved",
    closed: "badge-closed"
  };
  return `<span class="badge ${map[status] || "badge-closed"}">${status}</span>`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

function renderStats(cases) {
  document.getElementById("statTotal").textContent = cases.length;
  document.getElementById("statOpen").textContent = cases.filter(c => c.status === "open").length;
  document.getElementById("statProgress").textContent = cases.filter(c => c.status === "in-progress").length;
  document.getElementById("statResolved").textContent = cases.filter(c => c.status === "resolved").length;
}

function renderTable(cases) {
  const tbody = document.getElementById("recentTableBody");

  if (!cases.length) {
    tbody.innerHTML = `<tr><td colspan="7">No complaints</td></tr>`;
    return;
  }

  tbody.innerHTML = cases.map(c => `
    <tr>
      <td>${c.id}</td>
      <td>${c.title}</td>
      <td>${c.department}</td>
      <td>${c.zone}</td>
      <td>${getStatusBadge(c.status)}</td>
      <td>${formatDate(c.createdAt)}</td>
      <td><a href="citizen-complaint-detail.html?id=${c.id}">View</a></td>
    </tr>
  `).join("");
}

// ── INIT (ASYNC FIX) ────────────────────────────────────────────────────
async function init() {
  try {
    const allCases = await handleGetCases("citizen", "1"); // 🔥 FIX

    renderStats(allCases);
    renderTable(allCases);

  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

init();