// js/supervisor/case-details.js

import {
  resolveOfficerName,
  resolveOfficer,
  priorityBadge,
  statusBadge,
  formatDate
} from './supervisorData.js';

import { handleGetCaseById } from "../../controllers/caseController.js";
import { populateSupervisorIdentity } from './sidebar-identity.js';

populateSupervisorIdentity();

const currentSupervisor = JSON.parse(sessionStorage.getItem("ct_user")) || {};

const params = new URLSearchParams(window.location.search);
const caseId = params.get("id");

if (!caseId) showNotFound();
else loadCase();

// 🔥 normalize
function normalizeCase(c) {
  return {
    ...c,
    assignedTo: c.assignedOfficerId,
    citizen: c.citizenId,

    status:
      c.status === "open" ? "Assigned" :
      c.status === "in-progress" ? "In Progress" :
      c.status === "resolved" ? "Resolved" :
      c.status === "closed" ? "Closed" :
      c.status
  };
}

// 🔥 load from backend
async function loadCase() {
  try {
    const data = await handleGetCaseById(caseId);
    const c = normalizeCase(data);

    renderCase(c);

  } catch (err) {
    console.error("Error loading case:", err);
    showNotFound();
  }
}

// 🔥 render
function renderCase(c) {
  const set  = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const html = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML  = val; };

  set("breadcrumb-case", c.id);
  set("d-id", c.id);
  set("d-category", c.category || "—");
  set("d-citizen", c.citizen || "—");
  set("d-zone", c.zone || "—");
  set("d-date", formatDate(c.createdAt));

  html("d-priority", priorityBadge(c.priority));
  html("d-status", statusBadge(c.status));

  set("d-description", c.description || "—");

  const officer = resolveOfficer(c.assignedTo);

  set("d-dept", c.department || "—");
  set("d-officer", officer ? `${officer.name} (${officer.zone})` : "Unassigned");
  set("d-assigned-date", formatDate(c.createdAt));

  const est = new Date(c.createdAt);
  est.setDate(est.getDate() + 5);
  set("d-est-resolution", formatDate(est));
}

// fallback
function showNotFound() {
  const title = document.querySelector(".page-title");
  const sub   = document.querySelector(".page-sub");

  if (title) title.textContent = "Case Not Found";
  if (sub) sub.textContent = "Invalid case ID.";
}