// js/supervisor/case-details.js
import {
  getCaseById, addNoteToCase,
  resolveOfficerName, resolveOfficer,
  priorityBadge, statusBadge, formatDate
} from './supervisorData.js';
import { populateSupervisorIdentity } from './sidebar-identity.js';
import { createNotification } from '../../models/notificationModel.js';

populateSupervisorIdentity();

// Get current supervisor from session
const currentSupervisor = JSON.parse(sessionStorage.getItem("ct_user")) || {};

const params = new URLSearchParams(window.location.search);
const caseId = params.get("id");

if (!caseId) { showNotFound(); } else { loadCase(); }

function loadCase() {
  const c = getCaseById(caseId);
  if (!c) { showNotFound(); return; }

  const set  = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const html = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML  = val; };

  set("breadcrumb-case", c.id);

  // ── 1. Complaint Summary ──────────────────────────────────────────────────
  set("d-id",       c.id);
  set("d-category", c.category || "—");
  set("d-citizen",  c.citizen || c.submittedName || "—");
  set("d-zone",     c.zone    || "—");
  set("d-date",     formatDate(c.createdAt));
  html("d-priority", priorityBadge(c.priority));
  html("d-status",   statusBadge(c.status));

  // ── 2. Complaint Description + Attachments ────────────────────────────────
  set("d-description", c.description || "No description provided.");

  const attachGrid = document.getElementById("d-attachments");
  if (attachGrid) {
    if (c.attachments && c.attachments.length > 0) {
      attachGrid.innerHTML = c.attachments.map(a => {
        const src  = typeof a === "string" ? a : (a.src || a.data || "");
        const name = typeof a === "string" ? "attachment" : (a.name || "attachment");
        return `
          <div class="attach-card" onclick="openLightbox('${src}')">
            <div class="attach-img-wrap">
              <img src="${src}" alt="${name}"
                   onerror="this.parentElement.innerHTML='<div class=\\'attach-placeholder\\'>📎</div>'" />
            </div>
            <div class="attach-name">${name}</div>
          </div>`;
      }).join("");
    } else {
      attachGrid.innerHTML = `<p class="no-attach">No photos uploaded by citizen.</p>`;
    }
  }

  // ── 3. Assignment Details ─────────────────────────────────────────────────
  const officer = resolveOfficer(c.assignedTo);
  set("d-dept",           c.department || "—");
  set("d-officer",        officer ? `${officer.name} (${officer.zone})` : (c.assignedTo || "Unassigned"));
  set("d-assigned-date",  formatDate(c.assignedAt || c.createdAt));
  const estDate = new Date(c.assignedAt || c.createdAt);
  estDate.setDate(estDate.getDate() + 5);
  set("d-est-resolution", formatDate(estDate.toISOString()));

  // ── 4. Case Activity ──────────────────────────────────────────────────────
  renderActivity(c);

  // ── 5. Notes ──────────────────────────────────────────────────────────────
  renderNotes(c);
}

// ── Activity timeline ─────────────────────────────────────────────────────────
function renderActivity(c) {
  const list = document.getElementById("activity-list");
  if (!list) return;

  const activity = c.activity && c.activity.length > 0
    ? c.activity
    : deriveActivity(c);

  const iconMap = {
    submitted:           { icon: "📄", color: "#1565C0" },
    assigned:            { icon: "👤", color: "#6A1B9A" },
    accepted:            { icon: "✅", color: "#2E7D32" },
    rejected:            { icon: "❌", color: "#E53935" },
    status:              { icon: "🔄", color: "#E65100" },
    transfer:            { icon: "↔️", color: "#00838F" },
    note:                { icon: "💬", color: "#5F6368" },
    resolved:            { icon: "✔️", color: "#2E7D32" },
    closed:              { icon: "🔒", color: "#5F6368" },
    supervisor_closed:   { icon: "🔒", color: "#2E7D32" },   // ← supervisor approved closure
    supervisor_rejected: { icon: "🚫", color: "#E53935" },   // ← supervisor rejected closure
    reassigned:          { icon: "🔁", color: "#6A1B9A" },   // ← case reassigned
  };

  list.innerHTML = activity.map((ev, i) => {
    const meta   = iconMap[ev.type] || iconMap.status;
    const isLast = i === activity.length - 1;
    return `
      <div class="activity-item">
        <div class="act-left">
          <div class="act-icon-wrap" style="background:${meta.color}20;border:2px solid ${meta.color}40;">
            <span class="act-icon">${meta.icon}</span>
          </div>
          ${!isLast ? '<div class="act-line"></div>' : ''}
        </div>
        <div class="act-body">
          <div class="act-label">${ev.label}</div>
          <div class="act-time">${ev.time
            ? formatDate(ev.time) + " · " + new Date(ev.time).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" })
            : "—"}</div>
        </div>
      </div>`;
  }).join("");
}

function deriveActivity(c) {
  const events = [];
  events.push({ type:"submitted",  label:`Complaint submitted by ${c.citizen || c.submittedName || "Citizen"}`, time: c.createdAt });

  if (c.assignedTo) {
    events.push({ type:"assigned", label:`Case auto-assigned to Officer ${resolveOfficerName(c.assignedTo)}`, time: c.assignedAt || c.createdAt });
  }

  if (["Accepted","In Progress","Waiting For Citizen","Resolved","Closed"].includes(c.status)) {
    events.push({ type:"accepted", label:"Case accepted by officer", time: c.updatedAt || c.createdAt });
  }

  if (["In Progress","Waiting For Citizen","Resolved","Closed"].includes(c.status)) {
    events.push({ type:"status", label:"Officer marked case as In Progress", time: c.updatedAt || c.createdAt });
  }

  if (c.transfer?.requested) {
    if (c.transfer.supervisorStatus === "approved") {
      events.push({ type:"transfer", label:`Transfer to ${c.transfer.toDept} approved by supervisor`, time: c.transfer.approvedAt || c.updatedAt || c.createdAt });
    } else if (c.transfer.supervisorStatus === "rejected") {
      events.push({ type:"rejected", label:`Transfer to ${c.transfer.toDept} rejected by supervisor`, time: c.transfer.rejectedAt || c.updatedAt || c.createdAt });
    } else {
      events.push({ type:"transfer", label:`Transfer requested to ${c.transfer.toDept}`, time: c.updatedAt || c.createdAt });
    }
  }

  if (c.closureRequest) {
    const crStatus = (c.closureRequest.status || "").toLowerCase();
    if (crStatus === "approved") {
      events.push({ type:"supervisor_closed", label:`Case closed by Supervisor ${c.closureRequest.actedBySupName || ""}. Resolution: "${c.closureRequest.summary || "—"}"`, time: c.closureRequest.actedAt || c.updatedAt });
    } else if (crStatus === "rejected") {
      events.push({ type:"supervisor_rejected", label:`Closure request rejected by Supervisor ${c.closureRequest.actedBySupName || ""}. Officer must continue.`, time: c.closureRequest.actedAt || c.updatedAt });
    } else {
      events.push({ type:"note", label:`Closure request submitted by Officer ${resolveOfficerName(c.assignedTo) || ""}`, time: c.closureRequest.requestedAt || c.updatedAt });
    }
  }

  if (["Resolved","Closed"].includes(c.status) && !c.closureRequest) {
    events.push({ type:"resolved", label:"Case resolved by officer", time: c.updatedAt });
  }

  return events;
}

// ── Notes ─────────────────────────────────────────────────────────────────────
function renderNotes(c) {
  const notesList = document.getElementById("notes-list");
  if (!notesList) return;
  const notes = c.notes || [];
  
  notesList.innerHTML = notes.length === 0
    ? `<p class="no-notes">No notes yet.</p>`
    : notes.map(n => {
        // Handle both string (legacy) and structured note objects
        if (typeof n === "string") {
          return `
            <div class="note-item">
              <div class="note-text">${n}</div>
              <div class="note-meta">Supervisor · ${new Date().toLocaleDateString("en-GB")}</div>
            </div>`;
        }
        
        // Structured note object
        const author = n.author || "Unknown";
        const role = n.role || "supervisor";
        const time = n.time ? new Date(n.time).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB");
        const timeDetail = n.time ? new Date(n.time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
        
        return `
          <div class="note-item">
            <div class="note-text">${n.text}</div>
            <div class="note-meta">${author} (${role}) · ${time}${timeDetail ? " · " + timeDetail : ""}</div>
          </div>`;
      }).join("");
}

// ── Add note ──────────────────────────────────────────────────────────────────
document.getElementById("add-note-btn")?.addEventListener("click", () => {
  const input = document.getElementById("note-input");
  const val   = input?.value.trim();
  if (!val) return;
  
  // Create structured note object (FIX #1)
  const note = {
    text: val,
    author: currentSupervisor.name || "Supervisor",
    role: "supervisor",
    time: new Date().toISOString()
  };
  
  addNoteToCase(caseId, note);
  
  // Create notification for assigned officer (FIX #1)
  const caseData = getCaseById(caseId);
  if (caseData && caseData.assignedTo) {
    try {
      createNotification({
        recipientId: caseData.assignedTo,
        type: "note",
        title: "New Note on Your Case",
        message: `${currentSupervisor.name || "Supervisor"} added a note to case ${caseId}`,
        caseId: caseId,
        relatedUserId: currentSupervisor.id
      });
    } catch (e) {
      console.log("Notification system not fully initialized, but note was saved");
    }
  }
  
  input.value = "";
  renderNotes(getCaseById(caseId));
  toast("Note added successfully.");
});

// ── Lightbox ──────────────────────────────────────────────────────────────────
window.openLightbox = function(src) {
  if (!src) return;
  const overlay = document.createElement("div");
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;
    display:flex;align-items:center;justify-content:center;cursor:zoom-out;`;
  overlay.innerHTML = `<img src="${src}" style="max-width:90vw;max-height:90vh;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,.5);" />`;
  overlay.addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
};

function showNotFound() {
  const title = document.querySelector(".page-title");
  const sub   = document.querySelector(".page-sub");
  if (title) title.textContent = "Case Not Found";
  if (sub)   sub.textContent   = caseId ? `No case with ID "${caseId}" was found.` : "No case ID provided.";
}

function toast(msg, color = "#2E7D32") {
  const t = document.createElement("div");
  t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;background:${color};
    color:#fff;padding:12px 20px;border-radius:10px;font-size:13.5px;
    font-family:'DM Sans',sans-serif;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.2);`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}