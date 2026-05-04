import { handleAddCase } from "../../controllers/caseController.js";

document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("submitBtn");
  const deptSelect = document.getElementById("fDepartment");
  const categorySelect = document.getElementById("fCategory");

  // 🔥 CATEGORY MAP (FULL VERSION)
  const categoryMap = {
    water: [
      "Water Leakage",
      "No Water Supply",
      "Low Water Pressure",
      "Contaminated Water"
    ],
    electricity: [
      "Power Cut",
      "Voltage Fluctuation",
      "Street Light Issue",
      "Transformer Fault"
    ],
    road: [
      "Potholes",
      "Road Damage",
      "Drainage Blockage",
      "Road Marking Issue"
    ],
    sanitation: [
      "Garbage Not Collected",
      "Overflowing Bins",
      "Drain Blockage",
      "Sewage Issue"
    ]
  };

  // 🔥 CATEGORY DROPDOWN LOGIC
  if (deptSelect) {
    deptSelect.addEventListener("change", (e) => {
      const dept = e.target.value.toLowerCase();

      categorySelect.innerHTML = '<option value="">Select category</option>';
      categorySelect.disabled = false;

      (categoryMap[dept] || []).forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
      });
    });
  }

  // 🔥 SUBMIT LOGIC
  if (!submitBtn) {
    console.error("Submit button not found");
    return;
  }

  submitBtn.addEventListener("click", async (event) => {
    event.preventDefault();

    const data = {
      title: document.getElementById("fTitle").value,
      description: document.getElementById("fDescription").value,
      department: document.getElementById("fDepartment").value.toLowerCase(),
      category: document.getElementById("fCategory").value,
      zone: document.getElementById("fZone").value.replace("Zone ", ""),
      priority: document.getElementById("fPriority").value.toLowerCase(),
      citizenId: 1
    };

    // ✅ basic validation
    if (!data.title || !data.department) {
      alert("Title and Department are required");
      return;
    }

    try {
      const result = await handleAddCase(data);

      if (result.error) {
        console.error(result);
        alert("Failed to submit complaint");
        return;
      }

      alert("Complaint submitted successfully!");
      window.location.href = "citizen-dashboard.html";

    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  });
});