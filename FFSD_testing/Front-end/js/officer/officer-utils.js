// js/officer/officer-utils.js  (or js/officer-utils.js — wherever your file lives)
// Shared helpers for all officer pages.

// ═══════════════════════════════════════════════════════════════════
// 1. AUTH GUARD
// ═══════════════════════════════════════════════════════════════════

/**
 * Reads ct_user from sessionStorage.
 * Redirects to role-selection if missing or not an officer.
 * @returns {Object|null}
 */
export function getOfficerSession() {
  try {
    const user = JSON.parse(sessionStorage.getItem("ct_user"));
    if (!user || user.role !== "officer") {
      window.location.href = "../role-selection.html";
      return null;
    }
    return user;
  } catch {
    window.location.href = "../role-selection.html";
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 2. UI INITIALISATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Populates sidebar and topbar with the officer's name and initial.
 * @param {Object} user
 */
export function initOfficerUI(user) {
  const initials = user.name.charAt(0).toUpperCase();

  const sidebarName   = document.getElementById("sidebar-name");
  const sidebarAvatar = document.getElementById("sidebar-avatar");
  const topbarName    = document.getElementById("topbar-name");
  const topbarAvatar  = document.getElementById("topbar-avatar");

  if (sidebarName)   sidebarName.textContent  = user.name;
  if (sidebarAvatar) sidebarAvatar.textContent = initials;
  if (topbarName)    topbarName.textContent    = user.name;
  if (topbarAvatar)  topbarAvatar.textContent  = initials;
}

// ═══════════════════════════════════════════════════════════════════
// 3. LOCALSTORAGE CASE HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Returns all cases from localStorage. */
export function getAllCases() {
  try { return JSON.parse(localStorage.getItem("cases")) || []; }
  catch { return []; }
}

/** Saves the full cases array to localStorage. */
export function saveAllCases(cases) {
  localStorage.setItem("cases", JSON.stringify(cases));
}

/** Returns a single case by ID, or null. */
export function getCaseById(id) {
  return getAllCases().find(c => c.id === id) || null;
}

/**
 * Shallow-merges updates into a case and saves back to localStorage.
 * @param {string} id
 * @param {Object} updates
 */
export function updateCaseById(id, updates) {
  const cases = getAllCases().map(c =>
    c.id === id ? { ...c, ...updates } : c
  );
  saveAllCases(cases);
}

/**
 * Returns all cases assigned to a specific officer.
 * Matches by BOTH officer id and officer name to handle either storage format.
 * @param {string} officerId
 * @param {string} [officerName]
 * @returns {Array}
 */
export function getOfficerCases(officerId, officerName) {
  return getAllCases().filter(c =>
    c.assignedTo === officerId ||
    (officerName && c.assignedTo === officerName)
  );
}

// ═══════════════════════════════════════════════════════════════════
// 4. STATS
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculates status counts for a given array of cases.
 * @param {Array} cases
 * @returns {{ assigned, inProgress, resolved, transferred }}
 */
export function calcStats(cases) {
  return {
    assigned:    cases.filter(c => c.status === "Assigned").length,
    inProgress:  cases.filter(c => c.status === "In Progress").length,
    resolved:    cases.filter(c => c.status === "Resolved").length,
    transferred: cases.filter(c => c.status === "Transferred").length,
    closed:      cases.filter(c => c.status === "Closed").length,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 5. SIDEBAR BADGE UPDATER
// ═══════════════════════════════════════════════════════════════════

/**
 * Updates all sidebar badge counts: assigned, transfer, closure.
 * Closure badge shows only pending requests.
 * @param {string} officerId
 * @param {string} [officerName]
 */
export function updateSidebarBadges(officerId, officerName) {
  const cases = getOfficerCases(officerId, officerName);

  const sbAssigned = document.getElementById("sb-assigned-count");
  const sbTransfer = document.getElementById("sb-transfer-count");
  const sbClosure  = document.getElementById("sb-closure-count");

  if (sbAssigned) {
    sbAssigned.textContent = cases.filter(c => c.status === "Assigned").length;
  }

  if (sbTransfer) {
    sbTransfer.textContent = cases.filter(
      c => c.transfer && c.transfer.requested
    ).length;
  }

  if (sbClosure) {
    // Only pending closure requests shown — approved/rejected need no action
    sbClosure.textContent = cases.filter(c => {
      if (!c.closureRequest || typeof c.closureRequest !== "object") return false;
      const s = (c.closureRequest.status || "pending").toString().trim().toLowerCase();
      return s === "pending";
    }).length;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 6. BADGE HTML HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Returns a <span class="badge ..."> for a case status.
 * @param {string} status
 * @returns {string}
 */
export function statusBadge(status) {
  const map = {
    "Assigned":    "badge-assigned",
    "In Progress": "badge-progress",
    "Resolved":    "badge-resolved",
    "Transferred": "badge-pending",
    "Closed":      "badge-closed",
  };
  const label = status || "—";
  return `<span class="badge ${map[status] || "badge-closed"}">${label}</span>`;
}

/**
 * Returns a <span class="badge ..."> for a priority level.
 * @param {string} priority
 * @returns {string}
 */
export function priorityBadge(priority) {
  const map = {
    "High":   "badge-high",
    "Medium": "badge-medium",
    "Low":    "badge-low",
  };
  const p = priority || "Medium";
  return `<span class="badge ${map[p] || "badge-medium"}">${p}</span>`;
}

// ═══════════════════════════════════════════════════════════════════
// 7. DATE FORMATTER
// ═══════════════════════════════════════════════════════════════════

/**
 * Formats an ISO date string to "DD MMM YYYY".
 * @param {string} iso
 * @returns {string}
 */
export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  });
}

// ═══════════════════════════════════════════════════════════════════
// 8. NOTIFICATION HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Builds the notifications list for an officer:
 * - New cases assigned since last visit
 * - Closure requests that were approved or rejected by supervisor
 *
 * Notifications are stored in localStorage under "officer_notifs_{officerId}".
 * @param {string} officerId
 * @param {string} [officerName]
 * @returns {Array<{id, type, message, caseId, time, read}>}
 */
function getNotifications(officerId, officerName) {
  const key   = `officer_notifs_${officerId}`;
  const saved = JSON.parse(localStorage.getItem(key) || "[]");

  // Build fresh notifications from case data
  const cases = getOfficerCases(officerId, officerName);
  const fresh = [];

  cases.forEach(c => {
    // New assignment notification
    const assignId = `assign_${c.id}`;
    if (!saved.find(n => n.id === assignId)) {
      fresh.push({
        id:      assignId,
        type:    "assigned",
        message: `New case assigned: ${c.title || c.id}`,
        caseId:  c.id,
        time:    c.createdAt || new Date().toISOString(),
        read:    false,
      });
    }

    // Closure request acted on by supervisor
    if (c.closureRequest && c.closureRequest.status) {
      const s = c.closureRequest.status.toLowerCase();
      if (s === "approved" || s === "rejected") {
        const closureId = `closure_${c.id}_${s}`;
        if (!saved.find(n => n.id === closureId)) {
          fresh.push({
            id:      closureId,
            type:    s === "approved" ? "closure_approved" : "closure_rejected",
            message: s === "approved"
              ? `Closure approved for case ${c.id}`
              : `Closure rejected for case ${c.id} — please follow up`,
            caseId:  c.id,
            time:    c.closureRequest.requestedAt || new Date().toISOString(),
            read:    false,
          });
        }
      }
    }
  });

  // Merge: keep existing saved ones + add fresh new ones
  const merged = [
    ...fresh,
    ...saved.filter(s => !fresh.find(f => f.id === s.id)),
  ].sort((a, b) => new Date(b.time) - new Date(a.time));

  localStorage.setItem(key, JSON.stringify(merged));
  return merged;
}

/**
 * Updates the notification bell badge count (unread notifications).
 * @param {string} officerId
 * @param {string} [officerName]
 */
export function updateNotifBadge(officerId, officerName) {
  const notifs  = getNotifications(officerId, officerName);
  const unread  = notifs.filter(n => !n.read).length;
  const countEl = document.getElementById("notif-count");
  if (!countEl) return;
  if (unread > 0) {
    countEl.textContent     = unread;
    countEl.style.display   = "flex";
  } else {
    countEl.style.display   = "none";
  }
}

/**
 * Renders the notification dropdown panel content.
 * Marks all shown notifications as read after rendering.
 * @param {string} officerId
 * @param {string} [officerName]
 */
export function renderNotifPanel(officerId, officerName) {
  const panel = document.getElementById("notif-panel");
  if (!panel) return;

  const notifs = getNotifications(officerId, officerName);

  if (!notifs.length) {
    panel.innerHTML = `
      <div style="padding:20px;text-align:center;color:#94A3B8;font-size:13px;">
        No notifications yet.
      </div>`;
    return;
  }

  const iconMap = {
    assigned:         "📋",
    closure_approved: "✅",
    closure_rejected: "❌",
  };

  panel.innerHTML = `
    <div style="padding:12px 16px 8px;border-bottom:1px solid #F1F5F9;
                font-size:13px;font-weight:700;color:#0F172A;">
      Notifications
    </div>
    ${notifs.slice(0, 15).map(n => `
      <div style="padding:12px 16px;border-bottom:1px solid #F8FAFC;
                  background:${n.read ? "#fff" : "#F0F9FF"};cursor:pointer;
                  transition:background .15s;"
           onclick="window.location.href='officer-case-details.html?id=${n.caseId}'">
        <div style="display:flex;align-items:flex-start;gap:10px;">
          <span style="font-size:16px;margin-top:1px;">${iconMap[n.type] || "🔔"}</span>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:${n.read ? "400" : "600"};
                        color:#0F172A;line-height:1.4;">
              ${n.message}
            </div>
            <div style="font-size:11px;color:#94A3B8;margin-top:3px;">
              ${formatDate(n.time)}
            </div>
          </div>
        </div>
      </div>
    `).join("")}
    <div style="padding:10px 16px;text-align:center;">
      <button id="notif-clear-btn"
              style="font-size:12px;color:#94A3B8;background:none;border:none;
                     cursor:pointer;font-family:inherit;">
        Mark all as read
      </button>
    </div>`;

  // Mark all as read
  const key   = `officer_notifs_${officerId}`;
  const saved = JSON.parse(localStorage.getItem(key) || "[]");
  const marked = saved.map(n => ({ ...n, read: true }));
  localStorage.setItem(key, JSON.stringify(marked));
  updateNotifBadge(officerId, officerName);

  // Clear button
  const clearBtn = document.getElementById("notif-clear-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", e => {
      e.stopPropagation();
      localStorage.removeItem(key);
      panel.style.display = "none";
      updateNotifBadge(officerId, officerName);
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// 9. LOGOUT
// ═══════════════════════════════════════════════════════════════════

/**
 * Clears the session and redirects to the landing page.
 * Also attached to window.logout for HTML onclick compatibility.
 */
export function logout() {
  sessionStorage.removeItem("ct_user");
  sessionStorage.removeItem("ct_selected_role");
  window.location.href = "../index.html";
}

window.logout = logout;