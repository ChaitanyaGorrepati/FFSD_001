// js/citizen/citizen-complaint-detail.js
import { fetchCases, addNote, getUsers } from "../index.js";


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

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_ORDER = ["Submitted", "Assigned", "In Progress", "Resolved", "Closed"];

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

function getPriorityBadge(priority) {
  const map = { High: "badge-high", Medium: "badge-medium", Low: "badge-low" };
  return `<span class="badge ${map[priority] || "badge-low"}">${priority || "Normal"}</span>`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getIdFromURL() {
  return new URLSearchParams(window.location.search).get("id");
}

function renderStepper(status) {
  const steps = document.querySelectorAll(".step");
  const currentIdx = STATUS_ORDER.indexOf(status);
  const effectiveIdx = Math.max(currentIdx, 0);

  steps.forEach((step, i) => {
    step.classList.remove("done", "active");
    if (i < effectiveIdx) step.classList.add("done");
    else if (i === effectiveIdx) step.classList.add("active");
  });
}

function renderNotes(notes) {
  const list  = document.getElementById("notesList");
  const count = document.getElementById("notesCount");
  count.textContent = `${notes.length} note${notes.length !== 1 ? "s" : ""}`;

  if (!notes.length) {
    list.innerHTML = `<p class="text-muted text-sm">No notes yet.</p>`;
    return;
  }

  list.innerHTML = notes.map(n => `
    <div class="note-item">${typeof n === "object" ? n.text || n : n}</div>
  `).join("");
}

function findOfficer(officerId) {
  try {
    return getUsers().find(u => u.id === officerId) || null;
  } catch { return null; }
}

function renderCase(c) {
  document.getElementById("caseMeta").textContent =
    `${c.id} · ${c.category || c.department} · Submitted ${formatDate(c.createdAt)}`;
  document.title = `${c.id} – CivicTrack`;

  renderStepper(c.status);

  document.getElementById("caseTitle").textContent       = c.title || "—";
  document.getElementById("caseDescription").textContent = c.description || "No description provided.";
  document.getElementById("caseLocation").textContent    = c.location || "Location not specified";

  renderNotes(Array.isArray(c.notes) ? c.notes : []);

  document.getElementById("infoCaseId").textContent    = c.id;
  document.getElementById("infoDept").textContent      = c.department || "—";
  document.getElementById("infoCat").textContent       = c.category || "—";
  document.getElementById("infoZone").textContent      = c.zone || "—";
  document.getElementById("infoPriority").innerHTML    = getPriorityBadge(c.priority);
  document.getElementById("infoStatus").innerHTML      = getStatusBadge(c.status);
  document.getElementById("infoSubmitted").textContent = formatDate(c.createdAt);
  document.getElementById("infoUpdated").textContent   = formatDate(c.updatedAt || c.createdAt);

  const officer = findOfficer(c.assignedTo);
  if (officer) {
    document.getElementById("officerName").textContent   = officer.name;
    document.getElementById("officerDept").textContent   = `${officer.department} · ${officer.zone || ""}`;
    document.getElementById("officerAvatar").textContent = officer.name.charAt(0).toUpperCase();
  } else {
    document.getElementById("officerName").textContent = "Unassigned";
    document.getElementById("officerDept").textContent = "No officer assigned yet";
  }

  if (c.transfer?.requested && c.transfer?.status === "pending") {
    const card = document.getElementById("transferCard");
    card.style.display = "block";
    document.getElementById("transferBody").textContent =
      `Transfer to ${c.transfer.toDept || "another department"} is pending review.`;
  }
}

function setupNoteForm(caseId) {
  const toggle    = document.getElementById("addNoteToggle");
  const form      = document.getElementById("addNoteForm");
  const input     = document.getElementById("noteInput");
  const errorEl   = document.getElementById("noteError");
  const cancelBtn = document.getElementById("cancelNoteBtn");
  const submitBtn = document.getElementById("submitNoteBtn");

  toggle.addEventListener("click", () => {
    form.style.display  = "block";
    toggle.style.display = "none";
    input.focus();
  });

  cancelBtn.addEventListener("click", () => {
    form.style.display   = "none";
    toggle.style.display = "inline-flex";
    input.value = "";
    errorEl.textContent = "";
  });

  submitBtn.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) { errorEl.textContent = "Note cannot be empty."; return; }
    errorEl.textContent = "";

    const result = addNote(caseId, text);
    if (result?.success) {
      input.value = "";
      form.style.display   = "none";
      toggle.style.display = "inline-flex";

      const cases   = fetchCases();
      const updated = cases.find(c => c.id === caseId);
      if (updated) renderNotes(Array.isArray(updated.notes) ? updated.notes : []);
    }
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
function init() {
  const id = getIdFromURL();

  if (!id) {
    document.querySelector(".content").innerHTML =
      `<div class="empty-state">No case ID provided. <a href="citizen-my-complaints.html" style="color:var(--red)">← Back</a></div>`;
    return;
  }

  try {
    const cases = fetchCases();
    // Security: only allow viewing own cases
    const c = cases.find(x => x.id === id && x.submittedBy === currentUser.id);

    if (!c) {
      document.querySelector(".content").innerHTML =
        `<div class="empty-state">Case <strong>${id}</strong> not found. <a href="citizen-my-complaints.html" style="color:var(--red)">← Back</a></div>`;
      return;
    }

    renderCase(c);
    setupNoteForm(id);
  } catch (err) {
    console.error("Complaint detail error:", err);
  }
}

init();