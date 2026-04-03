// js/notificationUI.js
// UI components for notifications

import { 
  getUserNotifications, 
  getUnreadCount, 
  markAsRead,
  deleteNotification
} from "../models/notificationModel.js";

export function initNotificationUI(userId) {
  createNotificationBell(userId);
  setupPolling(userId);
}

function createNotificationBell(userId) {
  const topbar = document.querySelector(".topbar") || document.querySelector("[data-topbar]");
  if (!topbar) {
    console.warn("Topbar not found");
    return;
  }

  let bellContainer = document.getElementById("notification-bell-container");
  if (!bellContainer) {
    bellContainer = document.createElement("div");
    bellContainer.id = "notification-bell-container";
    bellContainer.style.cssText = `
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 20px;
      margin-left: auto;
    `;
    topbar.appendChild(bellContainer);
  }

  const bell = document.createElement("button");
  bell.id = "notification-bell";
  bell.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
    <span id="notification-badge" class="notification-badge">0</span>
  `;
  bell.style.cssText = `
    background: none;
    border: none;
    cursor: pointer;
    color: #1a1a2e;
    padding: 8px;
    display: flex;
    align-items: center;
    position: relative;
  `;

  bell.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleNotificationPanel(userId);
  });

  bellContainer.appendChild(bell);
  updateNotificationBadge(userId);
}

function toggleNotificationPanel(userId) {
  let panel = document.getElementById("notification-panel");
  
  if (!panel) {
    panel = createNotificationPanel(userId);
  }

  const isVisible = panel.style.display === "flex";
  panel.style.display = isVisible ? "none" : "flex";

  if (!isVisible) {
    renderNotificationList(userId);
  }
}

function createNotificationPanel(userId) {
  const panel = document.createElement("div");
  panel.id = "notification-panel";
  panel.style.cssText = `
    position: absolute;
    top: 50px;
    right: 0;
    width: 380px;
    max-height: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    display: none;
    flex-direction: column;
    z-index: 1000;
    border: 1px solid #e5e7eb;
  `;

  const header = document.createElement("div");
  header.style.cssText = `
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `
    <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Notifications</h3>
  `;

  const body = document.createElement("div");
  body.id = "notification-list";
  body.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 0;
  `;

  panel.appendChild(header);
  panel.appendChild(body);

  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && !document.getElementById("notification-bell").contains(e.target)) {
      panel.style.display = "none";
    }
  });

  const topbar = document.querySelector(".topbar") || document.querySelector("[data-topbar]");
  topbar?.appendChild(panel);

  return panel;
}

function renderNotificationList(userId) {
  const list = document.getElementById("notification-list");
  const notifications = getUserNotifications(userId).sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  ).slice(0, 10);

  if (!notifications.length) {
    list.innerHTML = `
      <div style="padding: 32px 16px; text-align: center; color: #9ca3af;">
        <p style="margin: 0;">No notifications yet</p>
      </div>
    `;
    return;
  }

  list.innerHTML = notifications.map(notif => `
    <div data-id="${notif.id}" style="
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      background: ${notif.isRead ? '#ffffff' : '#fffbfb'};
    ">
      <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #1a1a2e;">
        ${notif.title}
      </p>
      <p style="margin: 0 0 6px 0; font-size: 12px; color: #6b7280;">
        ${notif.message}
      </p>
      <p style="margin: 0; font-size: 11px; color: #9ca3af;">
        ${formatTimeAgo(notif.createdAt)}
      </p>
    </div>
  `).join("");

  list.querySelectorAll("[data-id]").forEach(item => {
    item.addEventListener("click", () => {
      const notifId = item.dataset.id;
      markAsRead(notifId);
      updateNotificationBadge(userId);
      renderNotificationList(userId);
    });
  });
}

export function updateNotificationBadge(userId) {
  const badge = document.getElementById("notification-badge");
  if (badge) {
    const count = getUnreadCount(userId);
    badge.textContent = count > 9 ? "9+" : count;
    badge.style.cssText = `
      position: absolute;
      top: -4px;
      right: -4px;
      background: #e63946;
      color: white;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: ${count > 0 ? 'flex' : 'none'};
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
    `;
  }
}

function setupPolling(userId) {
  setInterval(() => {
    updateNotificationBadge(userId);
  }, 5000);
}

function formatTimeAgo(isoString) {
  const now = new Date();
  const date = new Date(isoString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function showNotificationToast(title, message, type = "info") {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${type === "success" ? "#10b981" : type === "error" ? "#e63946" : "#3b82f6"};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    max-width: 350px;
  `;

  toast.innerHTML = `
    <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">${title}</div>
    <div style="font-size: 12px; opacity: 0.9;">${message}</div>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}