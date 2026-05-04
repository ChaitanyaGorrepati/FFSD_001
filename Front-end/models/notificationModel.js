// models/notificationModel.js
// Notification storage and retrieval system

const NOTIFICATIONS_KEY = "ct_notifications";

export function initNotifications() {
  if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
  }
}

export function getAllNotifications() {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getUserNotifications(userId) {
  return getAllNotifications().filter(n => n.recipientId === userId);
}

export function getUnreadCount(userId) {
  return getUserNotifications(userId).filter(n => !n.isRead).length;
}

export function createNotification({
  recipientId,
  type,
  title,
  message,
  caseId,
  relatedUserId,
  data = {}
}) {
  const notification = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    recipientId,
    type,
    title,
    message,
    caseId,
    relatedUserId,
    data,
    isRead: false,
    createdAt: new Date().toISOString(),
    readAt: null
  };

  const notifications = getAllNotifications();
  notifications.push(notification);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));

  return notification;
}

export function markAsRead(notificationId) {
  const notifications = getAllNotifications();
  const notification = notifications.find(n => n.id === notificationId);
  
  if (notification && !notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date().toISOString();
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }

  return notification;
}

export function deleteNotification(notificationId) {
  const notifications = getAllNotifications().filter(n => n.id !== notificationId);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}