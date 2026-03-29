// js/citizen/citizen-submit-complaint.js
import { submitCase, getOfficers } from "../index.js";

// ── 1. Get session FIRST (must be before anything uses currentUser) ────────────
const currentUser = JSON.parse(sessionStorage.getItem("ct_user"));

if (!currentUser || currentUser.role !== "citizen") {
  window.location.href = "../../login.html";
}

// ── 2. Update name & avatar ───────────────────────────────────────────────────
const initials = currentUser.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
 
document.getElementById("sidebarUserName").textContent = currentUser.name;
document.getElementById("topbarUserName").textContent  = currentUser.name;
document.querySelectorAll(".avatar").forEach(el => el.textContent = initials);

// ── Department → Category mapping ─────────────────────────────────────────────
const DEPT_CATEGORIES = {
  Water: ["Water Leakage", "No Water Supply", "Low Water Pressure", "Contaminated Water"],
  Electricity: ["Power Outage", "Street Light Not Working", "Voltage Fluctuation", "Exposed / Dangerous Wiring"],
  Road: ["Pothole", "Road Damage / Cracks", "Drainage Blockage (Roadside)", "Traffic Signal Not Working"],
  Sanitation: ["Garbage Overflow", "Irregular Waste Collection", "Open Dumping", "Drain Blockage"]
};

// ── DOM refs ──────────────────────────────────────────────────────────────────
const deptSelect     = document.getElementById("fDepartment");
const catSelect      = document.getElementById("fCategory");
const zoneSelect     = document.getElementById("fZone");
const titleInput     = document.getElementById("fTitle");
const descInput      = document.getElementById("fDescription");
const locationInput  = document.getElementById("fLocation");
const phoneInput     = document.getElementById("fPhone");
const prioritySelect = document.getElementById("fPriority");
const contactTime    = document.getElementById("fContactTime");
const submitBtn      = document.getElementById("submitBtn");
const saveDraftBtn   = document.getElementById("saveDraftBtn");
const successBanner  = document.getElementById("successBanner");
const fileInput      = document.getElementById("fEvidence");
const fileList       = document.getElementById("fileList");
const uploadZone     = document.getElementById("uploadZone");

// ── Category sync ─────────────────────────────────────────────────────────────
function updateCategories(dept) {
  catSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = dept ? "Select category" : "Select department first";
  catSelect.appendChild(placeholder);

  if (!dept || !DEPT_CATEGORIES[dept]) {
    catSelect.disabled = true;
    catSelect.style.opacity = "0.55";
    catSelect.style.cursor = "not-allowed";
    return;
  }

  DEPT_CATEGORIES[dept].forEach(label => {
    const opt = document.createElement("option");
    opt.value = label;
    opt.textContent = label;
    catSelect.appendChild(opt);
  });

  catSelect.disabled = false;
  catSelect.style.opacity = "1";
  catSelect.style.cursor = "pointer";
}

deptSelect.addEventListener("change", () => {
  clearError("errDepartment");
  clearError("errCategory");
  catSelect.value = "";
  updateCategories(deptSelect.value);
});

// ── File upload ───────────────────────────────────────────────────────────────
fileInput.addEventListener("change", renderFiles);

uploadZone.addEventListener("dragover", e => { e.preventDefault(); uploadZone.classList.add("drag-over"); });
uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("drag-over"));
uploadZone.addEventListener("drop", e => {
  e.preventDefault();
  uploadZone.classList.remove("drag-over");
  fileInput.files = e.dataTransfer.files;
  renderFiles();
});

function renderFiles() {
  fileList.innerHTML = "";
  Array.from(fileInput.files).forEach(f => {
    const chip = document.createElement("div");
    chip.className = "file-chip";
    chip.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>${f.name}<span style="color:var(--text-muted);margin-left:auto;">${(f.size/1024).toFixed(1)} KB</span>`;
    fileList.appendChild(chip);
  });
}

// ── Validation ────────────────────────────────────────────────────────────────
function clearError(id) { const el = document.getElementById(id); if (el) el.textContent = ""; }
function setError(id, msg) { const el = document.getElementById(id); if (el) el.textContent = msg; }

function validateForm() {
  let valid = true;
  ["errDepartment","errCategory","errZone","errTitle"].forEach(clearError);
  [deptSelect, catSelect, zoneSelect, titleInput].forEach(el => el.classList.remove("error"));

  if (!deptSelect.value) { setError("errDepartment", "Please select a department."); deptSelect.classList.add("error"); valid = false; }
  if (!catSelect.value)  { setError("errCategory", deptSelect.value ? "Please select a category." : "Select a department first."); catSelect.classList.add("error"); valid = false; }
  if (!zoneSelect.value) { setError("errZone", "Please select a zone."); zoneSelect.classList.add("error"); valid = false; }
  if (!titleInput.value.trim()) { setError("errTitle", "Complaint title is required."); titleInput.classList.add("error"); valid = false; }

  return valid;
}

// ── Submit ────────────────────────────────────────────────────────────────────
submitBtn.addEventListener("click", () => {
  if (!validateForm()) return;

  submitBtn.classList.add("loading");
  submitBtn.textContent = "Submitting...";

  const data = {
    department:   deptSelect.value,
    category:     catSelect.value,
    zone:         zoneSelect.value,
    title:        titleInput.value.trim(),
    description:  descInput.value.trim(),
    location:     locationInput.value.trim(),
    phone:        phoneInput.value.trim(),
    priority:     prioritySelect.value,
    contactTime:  contactTime.value,
    // ✅ Tag the case with the logged-in citizen's ID
    submittedBy:  currentUser.id,
    submittedName: currentUser.name
  };

  setTimeout(() => {
    const result = submitCase(data);

    submitBtn.classList.remove("loading");
    submitBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Submit Complaint';

    if (result && result.success) {
      successBanner.style.display = "flex";
      successBanner.scrollIntoView({ behavior: "smooth", block: "start" });
      resetForm();
    } else if (result && result.error) {
      setError("errTitle", result.error);
    }
  }, 400);
});

// ── Save Draft ────────────────────────────────────────────────────────────────
saveDraftBtn.addEventListener("click", () => {
  const draft = {
    department: deptSelect.value, category: catSelect.value, zone: zoneSelect.value,
    title: titleInput.value.trim(), description: descInput.value.trim(),
    location: locationInput.value.trim(), phone: phoneInput.value.trim(), priority: prioritySelect.value
  };
  localStorage.setItem("complaint_draft", JSON.stringify(draft));
  saveDraftBtn.textContent = "Draft Saved ✓";
  setTimeout(() => { saveDraftBtn.textContent = "Save Draft"; }, 2000);
});

// ── Reset ─────────────────────────────────────────────────────────────────────
function resetForm() {
  deptSelect.value = "";
  updateCategories("");
  zoneSelect.value = "";
  titleInput.value = "";
  descInput.value = "";
  locationInput.value = "";
  phoneInput.value = "";
  prioritySelect.value = "Medium";
  contactTime.value = "";
  fileList.innerHTML = "";
  localStorage.removeItem("complaint_draft");
}

// ── Restore Draft ─────────────────────────────────────────────────────────────
function restoreDraft() {
  const raw = localStorage.getItem("complaint_draft");
  if (!raw) return;
  try {
    const draft = JSON.parse(raw);
    if (draft.department) { deptSelect.value = draft.department; updateCategories(draft.department); if (draft.category) catSelect.value = draft.category; }
    if (draft.zone)        zoneSelect.value     = draft.zone;
    if (draft.title)       titleInput.value     = draft.title;
    if (draft.description) descInput.value      = draft.description;
    if (draft.location)    locationInput.value  = draft.location;
    if (draft.phone)       phoneInput.value     = draft.phone;
    if (draft.priority)    prioritySelect.value = draft.priority;
  } catch (e) { console.warn("Could not restore draft:", e); }
}

// ── Init ──────────────────────────────────────────────────────────────────────
updateCategories("");
restoreDraft();

[deptSelect, catSelect, zoneSelect, titleInput].forEach(el => {
  el.addEventListener("change", () => el.classList.remove("error"));
  el.addEventListener("input",  () => el.classList.remove("error"));
});