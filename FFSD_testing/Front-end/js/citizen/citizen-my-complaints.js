import { handleGetCases } from "../../controllers/caseController.js";

const currentUser = JSON.parse(sessionStorage.getItem("ct_user"));

if (!currentUser || currentUser.role !== "citizen") {
  window.location.href = "../../login.html";
}

// ── Logout ─────────────────────────────────────────
document.getElementById("logout-btn").addEventListener("click", (e) => {
  e.preventDefault();
  sessionStorage.clear();
  window.location.href = "../login.html";
});

// ── UI ─────────────────────────────────────────────
const initials = currentUser.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
document.getElementById("sidebarUserName").textContent = currentUser.name;
document.getElementById("topbarUserName").textContent = currentUser.name;
document.querySelectorAll(".avatar").forEach(el => el.textContent = initials);

// ── Helpers ────────────────────────────────────────
function getStatusBadge(status) {
  const map = {
    open: "badge-open",
    "in-progress": "badge-progress",
    resolved: "badge-resolved",
    closed: "badge-closed"
  };

  return `<span class="badge ${map[status] || "badge-open"}">${status}</span>`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString();
}

// ── Render ─────────────────────────────────────────
function renderTable(cases) {
  const tbody = document.getElementById("complaintsTableBody");

  if (!cases.length) {
    tbody.innerHTML = `<tr><td colspan="8">No complaints</td></tr>`;
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

// ── INIT (ASYNC FIX) ───────────────────────────────
async function init() {
  try {
    const allCases = await handleGetCases("citizen", "1"); // 🔥 FIX
    renderTable(allCases);
  } catch (err) {
    console.error("Error:", err);
  }
}

init();