// js/supervisor/supervisor-notifications.js
// ─────────────────────────────────────────────────────────────────────────────
// CENTRALIZED Notification System — Dashboard ONLY.
//
// This module is imported ONLY by dashboard.js.
// No other supervisor page imports or calls anything from this file.
//
// Notification Types & Colors:
//   ✅ NEW CASE ASSIGNED   → Green  (#2E7D32)
//   ⏰ CASE DELAY (>3d)    → Red    (#E53935)
//   🔒 CLOSURE REQUEST     → Blue   (#1565C0)
//   ↔️ INCOMING TRANSFER   → Orange (#E65100)
//
// Department Filtering:
//   All notifications are strictly scoped to the logged-in supervisor's dept.
//   The supervisor only sees activity from their own department.
// ─────────────────────────────────────────────────────────────────────────────

import {
  getLoggedInSupervisor,
  getCases,
  getNotificationsFor,
  getUnreadCount,
  markAllRead,
  formatDate
} from './supervisorData.js';

// ── Notification type constants ───────────────────────────────────────────────
const TYPE = {
  NEW_CASE:  "new_case",
  DELAY:     "delay",
  CLOSURE:   "closure",
  TRANSFER:  "transfer"
};

// Visual config per type
const TYPE_CONFIG = {
  [TYPE.NEW_CASE]: {
    icon:       "✅",
    label:      "New Case Assigned",
    color:      "#2E7D32",
    colorLight: "#E8F5E9",
    colorBorder:"#A5D6A7"
  },
  [TYPE.DELAY]: {
    icon:       "⏰",
    label:      "Case Delayed",
    color:      "#E53935",
    colorLight: "#FFEBEE",
    colorBorder:"#EF9A9A"
  },
  [TYPE.CLOSURE]: {
    icon:       "🔒",
    label:      "Closure Request",
    color:      "#1565C0",
    colorLight: "#E3F2FD",
    colorBorder:"#90CAF9"
  },
  [TYPE.TRANSFER]: {
    icon:       "↔️",
    label:      "Incoming Transfer",
    color:      "#E65100",
    colorLight: "#FFF3E0",
    colorBorder:"#FFCC80"
  }
};

// ── localStorage helpers ──────────────────────────────────────────────────────
function _getAllNotifs() {
  try { return JSON.parse(localStorage.getItem("notifications") || "[]"); }
  catch { return []; }
}
function _saveNotifs(list) {
  localStorage.setItem("notifications", JSON.stringify(list));
}

/**
 * Push a typed supervisor notification (de-duplicated per case+type+day).
 * @param {string} toId        — supervisor user id
 * @param {string} type        — one of TYPE.*
 * @param {string} title       — short headline
 * @param {string} description — one-line body
 * @param {string|null} caseId — links the notification to a case detail page
 */
function pushTypedNotif(toId, type, title, description, caseId) {
  const list  = _getAllNotifs();
  const today = new Date().toISOString().slice(0, 10);

  // De-duplicate: same supervisor + caseId + type + today → skip
  const alreadySent = list.some(n =>
    n.to     === toId &&
    n.caseId === caseId &&
    n.type   === type &&
    (n.time || "").startsWith(today)
  );
  if (alreadySent) return;

  list.push({
    id:          Date.now() + Math.random(), // ensure unique id
    to:          toId,
    type,
    title,
    description,
    caseId:      caseId || null,
    time:        new Date().toISOString(),
    read:        false
  });
  _saveNotifs(list);
}

function clearAllFor(userId) {
  _saveNotifs(_getAllNotifs().filter(n => n.to !== userId));
}

// ── Time-ago ──────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return "Just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return formatDate(iso);
}

// ─────────────────────────────────────────────────────────────────────────────
// ── TRIGGER 1: New Case Assigned ──────────────────────────────────────────────
// Scans cases created today that belong to this dept and are assigned.
// Fires once per case per day.
// ─────────────────────────────────────────────────────────────────────────────
function checkNewCases(supervisor) {
  const today = new Date().toISOString().slice(0, 10);
  getCases()
    .filter(c =>
      c.assignedTo &&
      (c.createdAt || "").startsWith(today) &&
      c.status !== "Submitted"
    )
    .forEach(c => {
      pushTypedNotif(
        supervisor.id,
        TYPE.NEW_CASE,
        "New Case Assigned",
        `Case ${c.id} (${c.category}) has been assigned in ${c.zone}.`,
        c.id
      );
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// ── TRIGGER 2: Case Delay (> 3 days unresolved) ───────────────────────────────
// Fires once per case per day when a case crosses the 3-day threshold.
// ─────────────────────────────────────────────────────────────────────────────
function checkDelays(supervisor) {
  getCases()
    .filter(c => !["Resolved", "Closed"].includes(c.status) && c.createdAt)
    .forEach(c => {
      const days = Math.floor(
        (Date.now() - new Date(c.createdAt).getTime()) / 86400000
      );
      if (days < 3) return;

      const label =
        days >= 14 ? `🚨 ${days} days — critical` :
        days >= 7  ? `⚠️ ${days} days — escalate` :
                     `${days} days open`;

      pushTypedNotif(
        supervisor.id,
        TYPE.DELAY,
        "Case Delayed",
        `Case ${c.id} (${c.category}) is ${label}. Zone: ${c.zone}.`,
        c.id
      );
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// ── TRIGGER 3: Closure Request ────────────────────────────────────────────────
// Fires once per case when an officer has submitted a pending closure request.
// ─────────────────────────────────────────────────────────────────────────────
function checkClosureRequests(supervisor) {
  getCases()
    .filter(c => {
      const s = (c.closureRequest?.status || "").toLowerCase();
      return c.closureRequest != null && s === "pending";
    })
    .forEach(c => {
      pushTypedNotif(
        supervisor.id,
        TYPE.CLOSURE,
        "Closure Request",
        `Officer submitted a closure request for Case ${c.id} (${c.category}).`,
        c.id
      );
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// ── TRIGGER 4: Incoming Transfer Request ─────────────────────────────────────
// Cases from another dept that are approved by origin supervisor and awaiting
// THIS supervisor's acceptance — department-filtered to toDept.
// ─────────────────────────────────────────────────────────────────────────────
function checkIncomingTransfers(supervisor) {
  try {
    const allRaw = JSON.parse(localStorage.getItem("cases") || "[]");
    allRaw
      .filter(c =>
        c.transfer?.requested === true &&
        c.transfer?.toDept    === supervisor.department &&
        c.transfer?.supervisorStatus === "approved" &&
        (!c.transfer.destinationStatus || c.transfer.destinationStatus === "pending")
      )
      .forEach(c => {
        const fromDept = c.transfer?.originDept || c.department || "another dept";
        pushTypedNotif(
          supervisor.id,
          TYPE.TRANSFER,
          "Incoming Transfer Request",
          `Case ${c.id} (${c.category}) is being transferred from ${fromDept} to your department.`,
          c.id
        );
      });
  } catch { /* silent */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Badge update ──────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
function refreshBadge(userId) {
  const count = getUnreadCount(userId);
  const badge = document.getElementById("notif-badge");
  if (!badge) return;
  badge.textContent   = count > 9 ? "9+" : count > 0 ? String(count) : "";
  badge.style.display = count > 0 ? "flex" : "none";
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Panel render ──────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
function renderPanel(supervisor) {
  const panel = document.getElementById("notif-panel");
  if (!panel) return;

  // Fetch, mark read, refresh badge
  const notifs = getNotificationsFor(supervisor.id);
  markAllRead(supervisor.id);
  refreshBadge(supervisor.id);

  // ── Empty state ──
  if (!notifs.length) {
    panel.innerHTML = `
      <div class="np-header">
        <span class="np-title">Notifications</span>
        <span class="np-dept-tag">${supervisor.department}</span>
      </div>
      <div class="np-empty">
        <div class="np-empty-icon">🔔</div>
        <div class="np-empty-text">All caught up!</div>
        <div class="np-empty-sub">
          No notifications for ${supervisor.department} department yet.
        </div>
      </div>`;
    return;
  }

  // ── Notification items ──
  const items = notifs.slice(0, 30).map(n => {
    const cfg  = TYPE_CONFIG[n.type] || TYPE_CONFIG[TYPE.NEW_CASE];
    const link = n.caseId ? `case-details.html?id=${n.caseId}` : "#";
    const unreadClass = n.read ? "" : " np-unread";

    return `
      <div class="np-item${unreadClass}"
           style="--np-color:${cfg.color};--np-light:${cfg.colorLight};--np-border:${cfg.colorBorder};"
           onclick="window.location.href='${link}'"
           role="button"
           tabindex="0">
        <div class="np-icon-wrap">
          <span class="np-icon">${cfg.icon}</span>
        </div>
        <div class="np-body">
          <div class="np-type-label">${cfg.label}</div>
          <div class="np-msg">${n.description || n.message || ""}</div>
          <div class="np-time">${timeAgo(n.time)}</div>
        </div>
        ${!n.read ? '<div class="np-unread-dot"></div>' : ""}
      </div>`;
  }).join("");

  const unreadCount = notifs.filter(n => !n.read).length;

  panel.innerHTML = `
    <div class="np-header">
      <div class="np-header-left">
        <span class="np-title">Notifications</span>
        <span class="np-dept-tag">${supervisor.department}</span>
      </div>
      <div class="np-header-right">
        ${unreadCount > 0
          ? `<span class="np-unread-label">${unreadCount} new</span>`
          : ""}
        <button class="np-clear-btn" id="np-clear-btn">Clear all</button>
      </div>
    </div>
    <div class="np-list">${items}</div>
    <div class="np-footer">
      <span class="np-total">${notifs.length} notification${notifs.length !== 1 ? "s" : ""}</span>
    </div>`;

  // Wire clear button
  document.getElementById("np-clear-btn")?.addEventListener("click", e => {
    e.stopPropagation();
    clearAllFor(supervisor.id);
    panel.classList.remove("open");
    refreshBadge(supervisor.id);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ── PUBLIC: initNotifications() ──────────────────────────────────────────────
// Call ONCE from dashboard.js after identity is set.
// ─────────────────────────────────────────────────────────────────────────────
export function initNotifications() {
  const supervisor = getLoggedInSupervisor();
  if (!supervisor) return;

  // Run all 4 trigger checks on every dashboard load
  checkNewCases(supervisor);
  checkDelays(supervisor);
  checkClosureRequests(supervisor);
  checkIncomingTransfers(supervisor);

  // Update badge after checks
  refreshBadge(supervisor.id);

  // Wire bell button
  const btn = document.getElementById("notif-btn");
  if (!btn) return;

  btn.addEventListener("click", e => {
    e.stopPropagation();
    const panel = document.getElementById("notif-panel");
    if (!panel) return;
    const isOpen = panel.classList.contains("open");
    if (isOpen) {
      panel.classList.remove("open");
    } else {
      renderPanel(supervisor);
      panel.classList.add("open");
    }
  });

  // Close on outside click
  document.addEventListener("click", e => {
    const wrapper = document.getElementById("notif-wrapper");
    const panel   = document.getElementById("notif-panel");
    if (panel && wrapper && !wrapper.contains(e.target)) {
      panel.classList.remove("open");
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      document.getElementById("notif-panel")?.classList.remove("open");
    }
  });
}