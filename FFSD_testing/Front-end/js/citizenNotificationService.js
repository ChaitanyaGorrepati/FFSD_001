// js/citizenNotificationService.js
// Citizen-only notifications

import { createNotification } from "../models/notificationModel.js";
import { getUsers } from "../models/userModel.js";

export function notifyCitizenCaseUpdate(citizenId, caseId, newStatus, officerId) {
  const officer = getUsers().find(u => u.id === officerId);
  const officerName = officer?.name || "Officer";

  const statusMessages = {
    "Assigned": `Your complaint has been assigned to ${officerName}.`,
    "In Progress": `Your complaint is now being worked on by ${officerName}.`,
    "Resolved": `Your complaint has been resolved by ${officerName}.`,
    "Closed": `Your complaint has been closed.`
  };

  createNotification({
    recipientId: citizenId,
    type: "case_status_update",
    title: `Case ${caseId} - ${newStatus}`,
    message: statusMessages[newStatus] || `Your case status changed to ${newStatus}`,
    caseId,
    relatedUserId: officerId,
    data: { newStatus }
  });
}

export function notifyCitizenNewNote(citizenId, caseId, noteBy, noteByRole) {
  const noteByUser = getUsers().find(u => u.id === noteBy);
  const noteByName = noteByUser?.name || "Someone";

  createNotification({
    recipientId: citizenId,
    type: "new_note",
    title: `New update on Case ${caseId}`,
    message: `${noteByName} (${noteByRole === "officer" ? "Officer" : "Supervisor"}) added an update.`,
    caseId,
    relatedUserId: noteBy,
    data: { noteByRole }
  });
}