// js/notificationUI.js
// Shared notification bell UI for all citizen pages.
// Requires in HTML: id="notif-btn", id="notif-count", id="notif-panel"

import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  createNotification,
  getAllNotifications
} from "../models/notificationModel.js";

import { getCases } from "../models/caseModel.js";

// ── Get note author — handles both { author } and { by } formats ──────────────
function getNoteAuthor(note) {
  if (typeof note === "string") return null;
  return note.author || note.by || null;
}

// ── Sync notifications from cases ─────────────────────────────────────────────
function syncCitizenNotifications(userId, citizenName) {
  const cases    = getCases().filter(c => c.submittedBy === userId);
  const seenKey  = `citizen_seen_${userId}`;
  const seen     = JSON.parse(localStorage.getItem(seenKey) || "{}");
  const existing = getAllNotifications();

  cases.forEach(c => {
    const prev = seen[c.id] || {};

    // ── Status change ─────────────────────────────────────────────────────────
    if (prev.status && prev.status !== c.status) {
      const dupId = `status_${c.id}_${c.status}`;
      if (!existing.find(n => n.data?.dedupId === dupId)) {
        createNotification({
          recipientId: userId,
          type:        "status_change",
          title:       "Case Status Updated",
          message:     `Your case ${c.id} status changed to "${c.status}"`,
          caseId:      c.id,
          data:        { dedupId: dupId }
        });
      }
    }

    // ── New notes from someone else (officer/supervisor) ──────────────────────
    const notes         = Array.isArray(c.notes) ? c.notes : [];
    const prevNoteCount = prev.noteCount || 0;

    if (notes.length > prevNoteCount) {
      notes.slice(prevNoteCount).forEach((n, i) => {
        const author = getNoteAuthor(n);

        // Only notify if note was written by someone OTHER than this citizen
        if (author && author !== citizenName) {
          const dupId = `note_${c.id}_${prevNoteCount + i}`;
          if (!existing.find(x => x.data?.dedupId === dupId)) {
            createNotification({
              recipientId: userId,
              type:        "new_note",
              title:       "New Note on Your Case",
              message:     `${author} added a note to your case ${c.id}`,
              caseId:      c.id,
              data:        { dedupId: dupId }
            });
          }
        }
        // If author === citizenName → skip (no self-notification)
      });
    }

    // Update seen state for next visit
    seen[c.id] = { status: c.status, noteCount: notes.length };
  });

  localStorage.setItem(seenKey, JSON.stringify(seen));
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function updateBadge(userId) {
  const count   = getUnreadCount(userId);
  const countEl = document.getElementById("notif-count");
  if (!countEl) return;
  countEl.textContent   = count > 9 ? "9+" : count;
  countEl.style.display = count > 0 ? "flex" : "none";
}

// ── Panel ─────────────────────────────────────────────────────────────────────
function renderPanel(userId) {
  const panel = document.getElementById("notif-panel");
  if (!panel) return;

  const notifs = getUserNotifications(userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!notifs.length) {
    panel.innerHTML = `
      <div style="padding:20px;text-align:center;color:#94A3B8;font-size:13px;">
        No notifications yet.
      </div>`;
    return;
  }

  const iconMap = {
    status_change: "🔄",
    new_note:      "💬",
  };

  function fmt(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit"
    });
  }

  panel.innerHTML = `
    <div style="padding:12px 16px 8px;border-bottom:1px solid #F1F5F9;
                font-size:13px;font-weight:700;color:#0F172A;">
      Notifications
    </div>
    ${notifs.slice(0, 15).map(n => `
      <div data-notif-id="${n.id}"
           style="padding:12px 16px;border-bottom:1px solid #F8FAFC;
                  background:${n.isRead ? "#fff" : "#F0F9FF"};
                  cursor:pointer;transition:background .15s;"
           onclick="window.__goNotif('${n.id}','${n.caseId}')">
        <div style="display:flex;align-items:flex-start;gap:10px;">
          <span style="font-size:16px;margin-top:1px;">${iconMap[n.type] || "🔔"}</span>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:${n.isRead ? 400 : 600};
                        color:#0F172A;line-height:1.4;">
              ${n.message}
            </div>
            <div style="font-size:11px;color:#94A3B8;margin-top:3px;">${fmt(n.createdAt)}</div>
          </div>
          ${!n.isRead
            ? `<span style="width:8px;height:8px;border-radius:50%;background:#3B82F6;
                            flex-shrink:0;margin-top:4px;"></span>`
            : ""}
        </div>
      </div>`).join("")}
    <div style="padding:10px 16px;text-align:center;border-top:1px solid #F1F5F9;">
      <button id="notif-clear-btn"
              style="font-size:12px;color:#94A3B8;background:none;
                     border:none;cursor:pointer;font-family:inherit;">
        Mark all as read
      </button>
    </div>`;

  // Click: mark read + navigate to case
  window.__goNotif = (notifId, caseId) => {
    markAsRead(notifId);
    window.location.href = `citizen-complaint-detail.html?id=${caseId}`;
  };

  // Mark all as read
  document.getElementById("notif-clear-btn")?.addEventListener("click", e => {
    e.stopPropagation();
    getUserNotifications(userId).forEach(n => markAsRead(n.id));
    renderPanel(userId);
    updateBadge(userId);
  });
}

// ── Main export — call from any citizen page ──────────────────────────────────
export function initNotificationUI(userId) {
  // Get citizen name from session for self-notification check
  const currentUser  = JSON.parse(sessionStorage.getItem("ct_user"));
  const citizenName  = currentUser?.name || "";

  syncCitizenNotifications(userId, citizenName);
  updateBadge(userId);

  const btn   = document.getElementById("notif-btn");
  const panel = document.getElementById("notif-panel");
  if (!btn || !panel) return;

  btn.addEventListener("click", e => {
    e.stopPropagation();
    const isOpen = panel.style.display === "block";
    panel.style.display = isOpen ? "none" : "block";
    if (!isOpen) {
      renderPanel(userId);
      updateBadge(userId);
    }
  });

  document.addEventListener("click", () => {
    if (panel) panel.style.display = "none";
  });
  panel.addEventListener("click", e => e.stopPropagation());
}