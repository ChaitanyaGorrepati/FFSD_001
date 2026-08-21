import { handleGetCases } from "../../controllers/caseController.js";

const currentUser = JSON.parse(sessionStorage.getItem("ct_user"));

if (!currentUser || currentUser.role !== "citizen") {
  window.location.href = "../../login.html";
}

// logout
document.getElementById("logout-btn").addEventListener("click", (e) => {
  e.preventDefault();
  sessionStorage.clear();
  window.location.href = "../login.html";
});

// user UI
const initials = currentUser.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
document.getElementById("sidebarUserName").textContent = currentUser.name;
document.getElementById("topbarUserName").textContent = currentUser.name;
document.querySelectorAll(".avatar").forEach(el => el.textContent = initials);

// helpers
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

function getStatusStep(status) {
  const map = {
    "open": 1,
    "in-progress": 2,
    "resolved": 3,
    "closed": 4
  };
  return map[status] || 1;
}

function renderStepper(status) {
  const steps = document.querySelectorAll(".step");
  const index = getStatusStep(status);

  steps.forEach((s, i) => {
    s.classList.remove("done", "active");
    if (i < index) s.classList.add("done");
    if (i === index) s.classList.add("active");
  });
}

// get ID
function getId() {
  return new URLSearchParams(window.location.search).get("id");
}

// render case
function renderCase(c) {
  document.getElementById("caseTitle").textContent = c.title || "—";
  document.getElementById("caseDescription").textContent = c.description || "—";
  document.getElementById("caseLocation").textContent = c.location || "—";

  document.getElementById("infoCaseId").textContent = c.id;
  document.getElementById("infoDept").textContent = c.department;
  document.getElementById("infoCat").textContent = c.category || "—";
  document.getElementById("infoZone").textContent = c.zone;
  document.getElementById("infoPriority").textContent = c.priority;
  document.getElementById("infoStatus").textContent = c.status;
  document.getElementById("infoSubmitted").textContent = formatDate(c.createdAt);
  document.getElementById("infoUpdated").textContent = formatDate(c.createdAt);

  // officer (basic)
  document.getElementById("officerName").textContent =
    "Officer ID: " + (c.assignedOfficerId || "Not assigned");

  renderStepper(c.status);
}

// init
async function init() {
  const id = getId();

  if (!id) {
    document.querySelector(".content").innerHTML = "Invalid case";
    return;
  }

  try {
    const cases = await handleGetCases("citizen", "1");

    const c = cases.find(x => x.id == id);

    if (!c) {
      document.querySelector(".content").innerHTML = "Case not found";
      return;
    }

    renderCase(c);

  } catch (err) {
    console.error(err);
  }
}

init();