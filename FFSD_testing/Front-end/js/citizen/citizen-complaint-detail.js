// js/citizen/citizen-complaint-detail.js
import { fetchCases, addNote, getUsers } from "../index.js";

// ── 1. Session guard ──────────────────────────────────────────────────────────
const currentUser = JSON.parse(sessionStorage.getItem("ct_user"));

if (!currentUser || currentUser.role !== "citizen") {
  window.location.href = "../../login.html";
}

document.getElementById("logout-btn").addEventListener("click", (e) => {
  e.preventDefault();
  sessionStorage.removeItem("ct_user");
  sessionStorage.removeItem("ct_selected_role");
  window.location.href = "../login.html";
});

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

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
  });
}

function getIdFromURL() {
  return new URLSearchParams(window.location.search).get("id");
}

function renderStepper(status) {
  const steps = document.querySelectorAll(".step");
  const effectiveIdx = Math.max(STATUS_ORDER.indexOf(status), 0);
  steps.forEach((step, i) => {
    step.classList.remove("done", "active");
    if (i < effectiveIdx) step.classList.add("done");
    else if (i === effectiveIdx) step.classList.add("active");
  });
}

// ── Notes renderer — supports legacy strings + new structured objects ─────────
function renderNotes(notes) {
  const list  = document.getElementById("notesList");
  const count = document.getElementById("notesCount");
  count.textContent = `${notes.length} note${notes.length !== 1 ? "s" : ""}`;

  if (!notes.length) {
    list.innerHTML = `<p class="text-muted text-sm">No notes yet.</p>`;
    return;
  }

  const roleColors = {
    citizen:    { bg: "#EFF6FF", text: "#3B82F6" },
    officer:    { bg: "#ECFDF5", text: "#10B981" },
    supervisor: { bg: "#F5F3FF", text: "#8B5CF6" },
    superuser:  { bg: "#FFFBEB", text: "#F59E0B" },
  };

  list.innerHTML = notes.map(n => {
    if (typeof n === "string") {
      return `<div class="note-item" style="padding:10px 12px;background:#F8FAFC;border-radius:8px;margin-bottom:8px;">
        <div style="font-size:11px;color:#94A3B8;margin-bottom:4px;">Unknown · No timestamp</div>
        <div style="font-size:13px;color:var(--text-secondary);">${n}</div>
      </div>`;
    }

    const author = n.author || "Unknown";
    const role   = (n.role || "").toLowerCase();
    const time   = n.time ? formatDateTime(n.time) : "";
    const colors = roleColors[role] || { bg: "#F8FAFC", text: "#64748B" };
    const isMe   = author === currentUser.name;

    return `<div class="note-item" style="
        padding:10px 12px;
        background:${isMe ? "#F0F9FF" : "#F8FAFC"};
        border-left:3px solid ${colors.text};
        border-radius:0 8px 8px 0;
        margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap;">
        <span style="font-weight:600;font-size:13px;color:#0F172A;">${author}</span>
        <span style="
          background:${colors.bg};color:${colors.text};
          font-size:10px;font-weight:600;padding:1px 8px;
          border-radius:20px;text-transform:capitalize;">
          ${role || "user"}
        </span>
        ${isMe ? `<span style="font-size:10px;color:#3B82F6;font-weight:600;">You</span>` : ""}
        ${time ? `<span style="font-size:11px;color:#94A3B8;margin-left:auto;">${time}</span>` : ""}
      </div>
      <div style="font-size:13px;color:#475569;line-height:1.5;">${n.text}</div>
    </div>`;
  }).join("");
}

function findOfficer(officerId) {
  try { return getUsers().find(u => u.id === officerId) || null; }
  catch { return null; }
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
    document.getElementById("transferCard").style.display = "block";
    document.getElementById("transferBody").textContent =
      `Transfer to ${c.transfer.toDept || "another department"} is pending review.`;
  }
}

// ── Note form: saves structured { text, author, role, time } ─────────────────
function setupNoteForm(caseId) {
  const toggle    = document.getElementById("addNoteToggle");
  const form      = document.getElementById("addNoteForm");
  const input     = document.getElementById("noteInput");
  const errorEl   = document.getElementById("noteError");
  const cancelBtn = document.getElementById("cancelNoteBtn");
  const submitBtn = document.getElementById("submitNoteBtn");

  toggle.addEventListener("click", () => {
    form.style.display   = "block";
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

    const note = {
      text,
      author: currentUser.name,
      role:   currentUser.role,
      time:   new Date().toISOString()
    };

    const result = addNote(caseId, note);
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

// ═══════════════════════════════════════════════════════════════════
// CITIZEN NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════════════

const NOTIF_KEY = `citizen_notifs_${currentUser.id}`;
const SEEN_KEY  = `citizen_seen_${currentUser.id}`;

function getSavedNotifs() {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]"); }
  catch { return []; }
}

function saveNotifs(notifs) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
}

// Scan citizen's cases, generate notifs for status changes + new notes from others
function syncNotifications(cases) {
  const notifs     = getSavedNotifs();
  const seenStates = JSON.parse(localStorage.getItem(SEEN_KEY) || "{}");
  let   changed    = false;

  cases.forEach(c => {
    const prev = seenStates[c.id] || {};

    // Status change
    if (prev.status && prev.status !== c.status) {
      const sid = `status_${c.id}_${c.status}`;
      if (!notifs.find(n => n.id === sid)) {
        notifs.unshift({
          id:      sid,
          type:    "status_change",
          message: `Your case ${c.id} status changed to "${c.status}"`,
          caseId:  c.id,
          time:    c.updatedAt || new Date().toISOString(),
          read:    false,
        });
        changed = true;
      }
    }

    // New notes from someone else
    const notes         = Array.isArray(c.notes) ? c.notes : [];
    const prevNoteCount = prev.noteCount || 0;
    if (notes.length > prevNoteCount) {
      notes.slice(prevNoteCount).forEach((n, i) => {
        const author = typeof n === "object" ? n.author : null;
        if (author && author !== currentUser.name) {
          const nid = `note_${c.id}_${prevNoteCount + i}`;
          if (!notifs.find(x => x.id === nid)) {
            notifs.unshift({
              id:      nid,
              type:    "new_note",
              message: `${author} added a note to your case ${c.id}`,
              caseId:  c.id,
              time:    typeof n === "object" ? n.time : new Date().toISOString(),
              read:    false,
            });
            changed = true;
          }
        }
      });
    }

    seenStates[c.id] = { status: c.status, noteCount: notes.length };
  });

  if (changed) saveNotifs(notifs);
  localStorage.setItem(SEEN_KEY, JSON.stringify(seenStates));
}

function updateNotifBadge() {
  const unread  = getSavedNotifs().filter(n => !n.read).length;
  const countEl = document.getElementById("notif-count");
  if (!countEl) return;
  countEl.textContent   = unread > 9 ? "9+" : unread;
  countEl.style.display = unread > 0 ? "flex" : "none";
}

function renderNotifPanel() {
  const panel  = document.getElementById("notif-panel");
  if (!panel) return;

  const notifs = getSavedNotifs();

  if (!notifs.length) {
    panel.innerHTML = `<div style="padding:20px;text-align:center;color:#94A3B8;font-size:13px;">No notifications yet.</div>`;
    return;
  }

  const iconMap = { status_change: "🔄", new_note: "💬", note_added: "📝" };

  panel.innerHTML = `
    <div style="padding:12px 16px 8px;border-bottom:1px solid #F1F5F9;font-size:13px;font-weight:700;color:#0F172A;">
      Notifications
    </div>
    ${notifs.slice(0, 15).map(n => `
      <div style="padding:12px 16px;border-bottom:1px solid #F8FAFC;
                  background:${n.read ? "#fff" : "#F0F9FF"};cursor:pointer;"
           onclick="window.location.href='citizen-complaint-detail.html?id=${n.caseId}'">
        <div style="display:flex;align-items:flex-start;gap:10px;">
          <span style="font-size:16px;margin-top:1px;">${iconMap[n.type] || "🔔"}</span>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:${n.read ? 400 : 600};color:#0F172A;line-height:1.4;">
              ${n.message}
            </div>
            <div style="font-size:11px;color:#94A3B8;margin-top:3px;">${formatDateTime(n.time)}</div>
          </div>
        </div>
      </div>`).join("")}
    <div style="padding:10px 16px;text-align:center;">
      <button id="notif-clear-btn" style="font-size:12px;color:#94A3B8;background:none;border:none;cursor:pointer;font-family:inherit;">
        Clear all
      </button>
    </div>`;

  // Mark all as read
  saveNotifs(getSavedNotifs().map(n => ({ ...n, read: true })));
  updateNotifBadge();

  document.getElementById("notif-clear-btn")?.addEventListener("click", e => {
    e.stopPropagation();
    saveNotifs([]);
    panel.style.display = "none";
    updateNotifBadge();
  });
}

function setupNotifBell(cases) {
  syncNotifications(cases);
  updateNotifBadge();

  const btn   = document.getElementById("notif-btn");
  const panel = document.getElementById("notif-panel");
  if (!btn || !panel) return;

  btn.addEventListener("click", e => {
    e.stopPropagation();
    const isOpen = panel.style.display === "block";
    panel.style.display = isOpen ? "none" : "block";
    if (!isOpen) renderNotifPanel();
  });

  document.addEventListener("click", () => { if (panel) panel.style.display = "none"; });
  panel.addEventListener("click", e => e.stopPropagation());
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
    const cases   = fetchCases();
    const myCases = cases.filter(c => c.submittedBy === currentUser.id);
    const c       = myCases.find(x => x.id === id);

    if (!c) {
      document.querySelector(".content").innerHTML =
        `<div class="empty-state">Case <strong>${id}</strong> not found. <a href="citizen-my-complaints.html" style="color:var(--red)">← Back</a></div>`;
      return;
    }

    renderCase(c);
    setupNoteForm(id);
    setupNotifBell(myCases);
  } catch (err) {
    console.error("Complaint detail error:", err);
  }
}

init();