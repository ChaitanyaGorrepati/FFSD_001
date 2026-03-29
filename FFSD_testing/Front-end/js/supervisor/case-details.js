// js/supervisor/case-details.js
import { getCaseById, addNoteToCase, resolveOfficerName, resolveOfficer, priorityBadge, statusBadge, formatDate } from './supervisorData.js';
import { populateSupervisorIdentity } from './sidebar-identity.js';

populateSupervisorIdentity();

const params = new URLSearchParams(window.location.search);
const caseId = params.get("id");

if (!caseId) {
  document.querySelector(".page-title").textContent = "Case Not Found";
} else {
  loadCase();
}

function loadCase() {
  const c = getCaseById(caseId);
  if (!c) {
    document.querySelector(".page-title").textContent = "Case Not Found";
    const sub = document.querySelector(".page-sub");
    if (sub) sub.textContent = `No case with ID "${caseId}" was found.`;
    return;
  }

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const html = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML  = val; };

  // Breadcrumb
  set("breadcrumb-case", c.id);

  // Summary
  set("d-id",       c.id);
  set("d-category", c.category);
  set("d-citizen",  c.citizen || "—");
  set("d-zone",     c.zone);
  set("d-date",     formatDate(c.createdAt));
  html("d-priority", priorityBadge(c.priority));
  html("d-status",   statusBadge(c.status));

  // Description
  set("d-description", c.description || "No description provided.");

  // Attachments
  const attachGrid = document.getElementById("d-attachments");
  if (attachGrid) {
    if (c.attachments?.length) {
      attachGrid.innerHTML = c.attachments.map(a => `
        <div class="attach-thumb">
          <img src="${a.src || a}" alt="${a.name || "attachment"}" onerror="this.style.display='none'"/>
          <div class="attach-name">${a.name || "attachment"}</div>
        </div>`).join("");
    } else {
      attachGrid.innerHTML = `<p style="font-size:13px;color:var(--gray-400);">No attachments uploaded.</p>`;
    }
  }

  // Assignment
  const officer = resolveOfficer(c.assignedTo);
  set("d-dept",    c.department || "—");
  set("d-officer", officer ? `${officer.name} (${officer.zone})` : (c.assignedTo || "Unassigned"));

  // Notes & timeline
  renderNotes(c);
  renderTimeline(c);
}

function renderNotes(c) {
  const notesList = document.getElementById("notes-list");
  if (!notesList) return;
  const notes = c.notes || [];
  notesList.innerHTML = notes.length === 0
    ? `<p style="font-size:13px;color:var(--gray-400);margin-bottom:8px;">No notes yet.</p>`
    : notes.map(n => `
        <div class="note-item">
          <div>${n}</div>
          <div class="note-meta">Supervisor · ${new Date().toLocaleDateString("en-GB")}</div>
        </div>`).join("");
}

function renderTimeline(c) {
  const list = document.getElementById("timeline-list");
  if (!list) return;
  const officerName = resolveOfficerName(c.assignedTo) || "—";
  const events = [
    { dot: "gray",  text: `Case submitted by ${c.citizen || "Citizen"}`, time: formatDate(c.createdAt) },
    { dot: "",      text: `Auto-assigned to Officer ${officerName}`,      time: formatDate(c.createdAt) },
  ];
  if (c.transfer?.requested) events.push({ dot: "", text: `Transfer requested to ${c.transfer.toDept}`, time: "—" });
  if (["Resolved","Closed"].includes(c.status)) events.push({ dot: "green", text: "Case resolved / closed", time: "—" });

  list.innerHTML = events.map(e => `
    <div class="tl-item">
      <div class="tl-dot ${e.dot}"></div>
      <div><div class="tl-text">${e.text}</div><div class="tl-time">${e.time}</div></div>
    </div>`).join("");
}

// Add note
document.getElementById("add-note-btn")?.addEventListener("click", () => {
  const input = document.getElementById("note-input");
  const val   = input?.value.trim();
  if (!val) return;
  addNoteToCase(caseId, val);
  input.value = "";
  renderNotes(getCaseById(caseId));
  toast("Note added.");
});

function toast(msg) {
  const t = document.createElement("div");
  t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;background:#2E7D32;
    color:#fff;padding:12px 20px;border-radius:10px;font-size:13.5px;
    font-family:'DM Sans',sans-serif;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.2);`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}