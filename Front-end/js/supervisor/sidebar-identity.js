// js/supervisor/sidebar-identity.js
// Call populateSupervisorIdentity() in every supervisor JS page.

import { getLoggedInSupervisor } from './supervisorData.js';

export function populateSupervisorIdentity() {
  const supervisor = getLoggedInSupervisor();
  if (!supervisor) return;

  const initials = supervisor.name
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set("sidebar-avatar", initials);
  set("sidebar-name",   supervisor.name);
  set("sidebar-role",   `Supervisor – ${supervisor.department}`);
  set("topbar-avatar",  initials);
  set("topbar-name",    supervisor.name);
}