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


// Officers (one for each department in every zone)
export const users = [
  // Zone A
  { id: "off1", name: "Rashid", role: "officer", department: "Road", zone: "Zone A" },
  { id: "off2", name: "Kumar", role: "officer", department: "Water", zone: "Zone A" },
  { id: "off3", name: "Ali", role: "officer", department: "Electricity", zone: "Zone A" },
  { id: "off4", name: "John", role: "officer", department: "Sanitation", zone: "Zone A" },

  // Zone B
  { id: "off5", name: "Ravi", role: "officer", department: "Road", zone: "Zone B" },
  { id: "off6", name: "Neha", role: "officer", department: "Water", zone: "Zone B" },
  { id: "off7", name: "Sahil", role: "officer", department: "Electricity", zone: "Zone B" },
  { id: "off8", name: "Priya", role: "officer", department: "Sanitation", zone: "Zone B" },

  // Zone C
  { id: "off9", name: "Amit", role: "officer", department: "Road", zone: "Zone C" },
  { id: "off10", name: "Sneha", role: "officer", department: "Water", zone: "Zone C" },
  { id: "off11", name: "Farhan", role: "officer", department: "Electricity", zone: "Zone C" },
  { id: "off12", name: "Meera", role: "officer", department: "Sanitation", zone: "Zone C" },

  // Zone D
  { id: "off13", name: "Vikram", role: "officer", department: "Road", zone: "Zone D" },
  { id: "off14", name: "Raja Vara Prasad", role: "officer", department: "Water", zone: "Zone D" },
  { id: "off15", name: "Aisha", role: "officer", department: "Electricity", zone: "Zone D" },
  { id: "off16", name: "Rohit", role: "officer", department: "Sanitation", zone: "Zone D" },

  // Supervisors (one per department)
  { id: "sup1", name: "Sara", role: "supervisor", department: "Road" },
  { id: "sup2", name: "David", role: "supervisor", department: "Water" },
  { id: "sup3", name: "Kiran", role: "supervisor", department: "Electricity" },
  { id: "sup4", name: "Kishore", role: "supervisor", department: "Sanitation" },

  // Citizens
  { id: "cit1", name: "Ahmed", role: "citizen" },
  { id: "cit2", name: "Rahul", role: "citizen" },
  { id: "cit3", name: "Bharat", role: "citizen" },
  { id: "cit4", name: "Vikram", role: "citizen" },
  { id: "cit5", name: "Dhanunjay", role: "citizen" },
  { id: "cit6", name: "Dhanush", role: "citizen" },
  { id: "cit7", name: "Vivek", role: "citizen" }
];

// Initial Cases
export const initialCases = [];
