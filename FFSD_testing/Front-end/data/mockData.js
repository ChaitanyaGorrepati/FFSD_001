// data/mockData.js
// Department → Category mapping kept in sync with citizen-submit-complaint.js


export const departments = [
  {
    name: "Water",
    categories: [
      "Water Leakage",           // infrastructure issue
      "No Water Supply",         // service issue
      "Low Water Pressure",      // service issue
      "Contaminated Water"       // quality issue
    ]
  },
  {
    name: "Electricity",
    categories: [
      "Power Outage",                  // service reliability
      "Street Light Not Working",      // public safety
      "Voltage Fluctuation",           // service reliability
      "Exposed / Dangerous Wiring"     // public safety
    ]
  },
  {
    name: "Road",
    categories: [
      "Pothole",                        // road damage
      "Road Damage / Cracks",           // road damage
      "Drainage Blockage (Roadside)",   // drainage
      "Traffic Signal Not Working"      // inter-department / safety
    ]
  },
  {
    name: "Sanitation",
    categories: [
      "Garbage Overflow",              // overflow
      "Irregular Waste Collection",    // service issue
      "Open Dumping",                  // health hazard
      "Drain Blockage"                 // drainage
    ]
  }
];

// Users (officers + supervisors)
export const users = [
  { id: "off1", name: "Rashid", role: "officer", department: "Road",        zone: "Zone A" },
  { id: "off2", name: "Kumar",  role: "officer", department: "Water",       zone: "Zone A" },
  { id: "off3", name: "Ali",    role: "officer", department: "Electricity", zone: "Zone B" },

  { id: "sup1", name: "Sara",   role: "supervisor", department: "Road"  },
  { id: "sup2", name: "John",   role: "supervisor", department: "Water" }
];

// Initial Cases
export const initialCases = [];
