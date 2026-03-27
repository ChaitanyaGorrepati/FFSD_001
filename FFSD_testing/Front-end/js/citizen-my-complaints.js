// js/citizen-my-complaints.js
import { fetchCases } from "./index.js";

let allCases = [];
let currentFilter = "All";

function getStatusBadge(status) {
  const map = {
    "Assigned":    "badge-assigned",
    "In Progress": "badge-progress",
    "Resolved":    "badge-resolved",
    "Closed":      "badge-closed",
    "Pending":     "badge-pending"
  };
  return `<span class="badge ${map[status] || "badge-closed"}">${status}</span>`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function addDays(iso, days) {
  if (!iso) return "—";
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return formatDate(d.toISOString());
}

function renderTable(cases) {
  const tbody = document.getElementById("complaintsTableBody");
  document.getElementById("totalLabel").textContent =
    `${cases.length} complaint${cases.length !== 1 ? "s" : ""} found.`;

  if (!cases.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No data available</td></tr>`;
    return;
  }

  tbody.innerHTML = cases.map(c => `
    <tr>
      <td><span class="case-id">${c.id}</span></td>
      <td><span class="title-wrap">${c.title || "—"}</span></td>
      <td>${c.department || "—"}</td>
      <td>${c.zone || "—"}</td>
      <td>${getStatusBadge(c.status)}</td>
      <td class="date-col">${formatDate(c.createdAt)}</td>
      <td class="date-col">${addDays(c.createdAt, 7)}</td>
      <td>
        <a href="citizen-complaint-detail.html?id=${c.id}" class="btn btn-outline btn-xs">View Details</a>
      </td>
    </tr>
  `).join("");
}

function applyFilters() {
  const query = document.getElementById("searchInput").value.toLowerCase().trim();

  let filtered = allCases;

  if (currentFilter !== "All") {
    if (currentFilter === "Assigned") {
      filtered = filtered.filter(c => c.status === "Assigned" || c.status === "In Progress");
    } else {
      filtered = filtered.filter(c => c.status === currentFilter);
    }
  }

  if (query) {
    filtered = filtered.filter(c =>
      c.id?.toLowerCase().includes(query) ||
      c.title?.toLowerCase().includes(query) ||
      c.department?.toLowerCase().includes(query) ||
      c.category?.toLowerCase().includes(query)
    );
  }

  renderTable(filtered);
}

function init() {
  try {
    allCases = fetchCases();
    renderTable(allCases);

    // Filter tabs
    document.getElementById("filterTabs").addEventListener("click", e => {
      const tab = e.target.closest(".filter-tab");
      if (!tab) return;
      document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentFilter = tab.dataset.filter;
      applyFilters();
    });

    // Search
    document.getElementById("searchInput").addEventListener("input", applyFilters);
  } catch (err) {
    console.error("My complaints error:", err);
    document.getElementById("complaintsTableBody").innerHTML =
      `<tr><td colspan="8" class="empty-state">Failed to load complaints.</td></tr>`;
  }
}

init();
