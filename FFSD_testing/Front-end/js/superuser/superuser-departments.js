// js/superuser/superuser-departments.js
import { initDepartments } from "../../models/departmentModel.js";
import { fetchDepartments, createDepartment, editDepartment, removeDepartment } from "../../routes/departmentRoutes.js";

// ── Auth Guard (runs after imports) ──────────────────────────────────────────
(function() {
  const _su = JSON.parse(sessionStorage.getItem("ct_user") || "null");
  if (!_su || _su.role !== "superuser") {
    window.location.href = "../role-selection.html";
  }
})();



// ── State ──────────────────────────────────────────────
let pendingDeleteName = null;
let editingOriginalName = null;
let currentCategories = [];

// ── DOM refs ───────────────────────────────────────────
const tbody       = document.getElementById("dept-table-body");
const deptModal   = document.getElementById("dept-modal");
const confirmModal = document.getElementById("dept-confirm-modal");
const modalTitle  = document.getElementById("dept-modal-title");
const deptNameInput = document.getElementById("dept-name");
const catInput    = document.getElementById("category-input");
const catTags     = document.getElementById("category-tags");

// ── Helpers ────────────────────────────────────────────
function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle("hidden", !msg);
}

function clearErrors() {
  ["err-dept-name", "err-categories", "err-dept-global"].forEach(id => showError(id, ""));
}

function renderCategoryTags() {
  catTags.innerHTML = currentCategories.map((cat, i) => `
    <div class="cat-tag">
      ${cat}
      <span class="rm" data-index="${i}" title="Remove">×</span>
    </div>
  `).join("");

}

catTags.addEventListener("click", e => {
  const rmBtn = e.target.closest(".rm");
  if (rmBtn) {
    currentCategories.splice(parseInt(rmBtn.dataset.index), 1);
    renderCategoryTags();
  }
});

function addCategory() {
  const val = catInput.value.trim();
  if (!val) return;
  if (currentCategories.includes(val)) {
    showError("err-categories", "Category already added.");
    return;
  }
  currentCategories.push(val);
  catInput.value = "";
  showError("err-categories", "");
  renderCategoryTags();
}

// ── Render Table ───────────────────────────────────────
function renderTable() {
  const depts = fetchDepartments();

  if (!depts.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="empty-state">No departments found. Click "Add Department" to get started.</td></tr>`;
    return;
  }

  tbody.innerHTML = depts.map(d => {
    const pills = (d.categories || []).map(c => `<span class="cat-pill">${c}</span>`).join("") || `<span class="text-muted text-xs">No categories</span>`;
    return `
      <tr>
        <td><span class="font-semibold">${d.name}</span></td>
        <td><div style="display:flex;flex-wrap:wrap;gap:4px;">${pills}</div></td>
        <td>
          <div class="flex gap-2">
            <button class="action-btn edit" data-name="${d.name}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button class="action-btn delete" data-name="${d.name}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

tbody.addEventListener("click", e => {
  const editBtn = e.target.closest(".action-btn.edit");
  const deleteBtn = e.target.closest(".action-btn.delete");
  
  if (editBtn) {
    openEditModal(editBtn.dataset.name);
  } else if (deleteBtn) {
    openConfirmModal(deleteBtn.dataset.name);
  }
});

// ── Open Add Modal ─────────────────────────────────────
function openAddModal() {
  clearErrors();
  modalTitle.textContent = "Add Department";
  deptNameInput.value = "";
  editingOriginalName = null;
  currentCategories = [];
  renderCategoryTags();
  deptModal.classList.remove("hidden");
  deptNameInput.focus();
}

// ── Open Edit Modal ────────────────────────────────────
function openEditModal(name) {
  const depts = fetchDepartments();
  const dept = depts.find(d => d.name === name);
  if (!dept) return;

  clearErrors();
  modalTitle.textContent = "Edit Department";
  editingOriginalName = dept.name;
  deptNameInput.value = dept.name;
  currentCategories = [...(dept.categories || [])];
  renderCategoryTags();
  deptModal.classList.remove("hidden");
  deptNameInput.focus();
}

function closeDeptModal() {
  deptModal.classList.add("hidden");
}

// ── Save Handler ───────────────────────────────────────
function handleSave() {
  clearErrors();
  let valid = true;

  const name = deptNameInput.value.trim();
  if (!name) { showError("err-dept-name", "Department name is required."); valid = false; }
  if (!valid) return;

  const data = { name, categories: currentCategories };

  let result;
  if (editingOriginalName) {
    result = editDepartment(editingOriginalName, data);
  } else {
    result = createDepartment(data);
  }

  if (result.error) {
    showError("err-dept-global", result.error);
    return;
  }

  closeDeptModal();
  renderTable();
}

// ── Confirm Delete ─────────────────────────────────────
function openConfirmModal(name) {
  pendingDeleteName = name;
  document.getElementById("confirm-dept-name").textContent = name;
  confirmModal.classList.remove("hidden");
}

function closeConfirmModal() {
  pendingDeleteName = null;
  confirmModal.classList.add("hidden");
}

function handleDelete() {
  if (!pendingDeleteName) return;
  removeDepartment(pendingDeleteName);
  closeConfirmModal();
  renderTable();
}

// ── Button bindings ────────────────────────────────────
document.getElementById("btn-add-dept").addEventListener("click", openAddModal);
document.getElementById("dept-modal-close").addEventListener("click", closeDeptModal);
document.getElementById("btn-dept-cancel").addEventListener("click", closeDeptModal);
document.getElementById("btn-dept-save").addEventListener("click", handleSave);
document.getElementById("dept-confirm-close").addEventListener("click", closeConfirmModal);
document.getElementById("btn-dept-confirm-cancel").addEventListener("click", closeConfirmModal);
document.getElementById("btn-dept-confirm-delete").addEventListener("click", handleDelete);

document.getElementById("btn-add-category").addEventListener("click", addCategory);
catInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } });

deptModal.addEventListener("click", e => { if (e.target === deptModal) closeDeptModal(); });
confirmModal.addEventListener("click", e => { if (e.target === confirmModal) closeConfirmModal(); });

// ── Init ───────────────────────────────────────────────
// Init directly (scripts at bottom of body)
initDepartments();
renderTable();
