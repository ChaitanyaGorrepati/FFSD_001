// js/officer-closure-requests.js
import {
  getOfficerSession, initOfficerUI, updateSidebarBadges,
  statusBadge, formatDate, getAllCases
} from "./officer-utils.js";

// ── Session ───────────────────────────────────────────────────────────────────
const user = getOfficerSession();
if (!user) throw new Error("No session");

initOfficerUI(user);
updateSidebarBadges(user.id);
updateClosureBadge();

document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("ct_user");
  sessionStorage.removeItem("ct_selected_role");
  window.location.href = "../index.html";
});

// ── Normalize status string ───────────────────────────────────────────────────
// Always returns exactly "pending" | "approved" | "rejected"
// This is the single source of truth used by BOTH the stats AND the filter.
function normalizeStatus(raw) {
  const s = (raw || "").toString().trim().toLowerCase();
  if (s === "approved") return "approved";
  if (s === "rejected") return "rejected";
  return "pending"; // undefined / null / "pending" / anything else → pending
}

// ── Get ALL cases that have a closureRequest from this officer ────────────────
// Intentionally does NOT check requested:true so that cases whose status
// was later changed to "approved" or "rejected" still appear in the list.
function getClosureCases() {
  return getAllCases().filter(c =>
    c.assignedTo === user.id &&
    c.closureRequest &&
    typeof c.closureRequest === "object" &&
    Object.keys(c.closureRequest).length > 0
  );
}

// ── Closure badge (only pending count shown) ──────────────────────────────────
function updateClosureBadge() {
  const pending = getClosureCases().filter(
    c => normalizeStatus(c.closureRequest.status) === "pending"
  ).length;
  const el = document.getElementById("sb-closure-count");
  if (el) el.textContent = pending;
}

// ── Active filter ─────────────────────────────────────────────────────────────
let activeFilter = "all";

document.querySelectorAll(".filter-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeFilter = tab.dataset.filter; // "all" | "pending" | "approved" | "rejected"
    render();
  });
});

// ── Status badge HTML ─────────────────────────────────────────────────────────
function closureStatusBadge(rawStatus) {
  const s = normalizeStatus(rawStatus);
  const map = {
    pending:  { cls: "badge-pending",  label: "⏳ Pending"  },
    approved: { cls: "badge-resolved", label: "✅ Approved" },
    rejected: { cls: "badge-high",     label: "❌ Rejected" },
  };
  const { cls, label } = map[s];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  // Always pull a fresh snapshot from localStorage
  const allClosure = getClosureCases();

  // ── Stats: always from the full unfiltered list ──
  const pendingCount  = allClosure.filter(c => normalizeStatus(c.closureRequest.status) === "pending").length;
  const approvedCount = allClosure.filter(c => normalizeStatus(c.closureRequest.status) === "approved").length;
  const rejectedCount = allClosure.filter(c => normalizeStatus(c.closureRequest.status) === "rejected").length;

  document.getElementById("stat-pending").textContent  = pendingCount;
  document.getElementById("stat-approved").textContent = approvedCount;
  document.getElementById("stat-rejected").textContent = rejectedCount;

  // ── Filter: apply active tab ──
  let filtered = allClosure;
  if (activeFilter !== "all") {
    filtered = allClosure.filter(
      c => normalizeStatus(c.closureRequest.status) === activeFilter
    );
  }

  // ── Sort: newest request first ──
  filtered.sort((a, b) =>
    new Date(b.closureRequest.requestedAt || 0) -
    new Date(a.closureRequest.requestedAt || 0)
  );

  const tbody = document.getElementById("closure-list-body");

  if (!filtered.length) {
    const label = activeFilter === "all" ? "No closure requests yet." : `No ${activeFilter} closure requests.`;
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">${label}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    const cr = c.closureRequest;
    const summaryShort =
      cr.summary && cr.summary.length > 60
        ? cr.summary.slice(0, 60) + "…"
        : (cr.summary || "—");

    return `
      <tr>
        <td>
          <span style="font-family:'DM Mono',monospace;font-size:12.5px;
                       color:var(--text-secondary);">${c.id}</span>
        </td>
        <td style="max-width:160px;white-space:nowrap;overflow:hidden;
                   text-overflow:ellipsis;font-weight:500;">
          ${c.title || "—"}
        </td>
        <td>${c.department || "—"}</td>
        <td>${cr.supervisorName || cr.supervisorId || "—"}</td>
        <td style="max-width:180px;font-size:13px;color:var(--text-secondary);">
          ${summaryShort}
        </td>
        <td>${closureStatusBadge(cr.status)}</td>
        <td style="color:var(--text-secondary);font-size:13px;">
          ${formatDate(cr.requestedAt)}
        </td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-outline btn-xs"
                    data-action="view-detail" data-id="${c.id}">Detail</button>
            <a href="officer-case-details.html?id=${c.id}"
               class="btn btn-xs" style="background:var(--red);color:#fff;">
              Open
            </a>
          </div>
        </td>
      </tr>`;
  }).join("");
}

render();

// ── Event delegation on table ─────────────────────────────────────────────────
document.getElementById("closure-list-body").addEventListener("click", e => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  if (btn.dataset.action === "view-detail") {
    openDetailModal(btn.dataset.id);
  }
});

// ── Detail Modal ──────────────────────────────────────────────────────────────
function openDetailModal(id) {
  const c = getAllCases().find(x => x.id === id);
  if (!c || !c.closureRequest) return;

  const cr = c.closureRequest;

  document.getElementById("dm-body").innerHTML = `
    <div style="background:var(--border-light);border-radius:var(--radius);
                padding:14px 16px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span style="font-family:'DM Mono',monospace;font-size:14px;font-weight:700;">
          ${c.id}
        </span>
        ${statusBadge(c.status)}
      </div>
      <div style="font-size:14px;font-weight:600;margin-top:6px;">${c.title || "—"}</div>
      <div style="font-size:12.5px;color:var(--text-muted);margin-top:2px;">
        ${c.department || "—"} · ${c.zone || "—"}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                    letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px;">
          Requested By
        </div>
        <div style="font-size:13.5px;font-weight:500;">
          ${cr.requestedByName || user.name}
        </div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                    letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px;">
          Date Submitted
        </div>
        <div style="font-size:13.5px;font-weight:500;">${formatDate(cr.requestedAt)}</div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                    letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px;">
          Supervisor Notified
        </div>
        <div style="font-size:13.5px;font-weight:500;">
          ${cr.supervisorName || cr.supervisorId || "—"}
        </div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                    letter-spacing:.6px;color:var(--text-muted);margin-bottom:4px;">
          Request Status
        </div>
        <div>${closureStatusBadge(cr.status)}</div>
      </div>
    </div>

    <div style="margin-bottom:14px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                  letter-spacing:.6px;color:var(--text-muted);margin-bottom:6px;">
        Resolution Summary
      </div>
      <div style="background:var(--border-light);border-radius:var(--radius);
                  padding:12px 14px;font-size:13.5px;line-height:1.7;
                  color:var(--text-primary);">
        ${cr.summary || "—"}
      </div>
    </div>

    ${cr.notes ? `
    <div style="margin-bottom:14px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                  letter-spacing:.6px;color:var(--text-muted);margin-bottom:6px;">
        Additional Notes
      </div>
      <div style="font-size:13px;color:var(--text-secondary);">${cr.notes}</div>
    </div>` : ""}

    ${normalizeStatus(cr.status) === "approved" ? `
    <div style="margin-top:16px;padding:12px 14px;background:var(--green-light);
                border:1px solid #86EFAC;border-radius:var(--radius);">
      <div style="font-size:13px;font-weight:700;color:#166534;margin-bottom:2px;">
        ✅ Approved by Supervisor
      </div>
      <div style="font-size:12.5px;color:#166534;">
        ${cr.supervisorNote || "The case has been approved for closure."}
      </div>
    </div>` : ""}

    ${normalizeStatus(cr.status) === "rejected" ? `
    <div style="margin-top:16px;padding:12px 14px;background:#FEF2F2;
                border:1px solid #FECACA;border-radius:var(--radius);">
      <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:2px;">
        ❌ Rejected by Supervisor
      </div>
      <div style="font-size:12.5px;color:var(--red);">
        ${cr.supervisorNote || "Please follow up and resubmit."}
      </div>
    </div>` : ""}
  `;

  document.getElementById("dm-view-case-btn").href = `officer-case-details.html?id=${id}`;
  document.getElementById("detail-modal").classList.add("active");
}

function closeDetailModal() {
  document.getElementById("detail-modal").classList.remove("active");
}

document.getElementById("detail-modal").addEventListener("click", e => {
  if (e.target === e.currentTarget) closeDetailModal();
});
document.getElementById("dm-close").addEventListener("click",     closeDetailModal);
document.getElementById("dm-close-btn").addEventListener("click", closeDetailModal);