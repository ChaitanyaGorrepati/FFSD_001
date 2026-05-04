// data/mockData.js
// UPDATED: Added plain text passwords for officers, supervisors, and superuser
// Citizens still have NO passwords in mockData (they create their own accounts)

export const departments = [
  {
    name: "Water",
    categories: [
      "Water Leakage",
      "No Water Supply",
      "Low Water Pressure",
      "Contaminated Water"
    ]
  },
  {
    name: "Electricity",
    categories: [
      "Power Outage",
      "Street Light Not Working",
      "Voltage Fluctuation",
      "Exposed / Dangerous Wiring"
    ]
  },
  {
    name: "Road",
    categories: [
      "Pothole",
      "Road Damage / Cracks",
      "Drainage Blockage (Roadside)",
      "Traffic Signal Not Working"
    ]
  },
  {
    name: "Sanitation",
    categories: [
      "Garbage Overflow",
      "Irregular Waste Collection",
      "Open Dumping",
      "Drain Blockage"
    ]
  }
];

export const users = [
  // SUPERUSER
  {
    id: "super1",
    name: "Admin",
    role: "superuser",
    password: "admin123"
  },

  // OFFICERS (16) — one for each department in every zone
  // Zone A
  { id: "off1", name: "Rashid", role: "officer", department: "Road", zone: "Zone A", password: "rashid123" },
  { id: "off2", name: "Kumar", role: "officer", department: "Water", zone: "Zone A", password: "kumar123" },
  { id: "off3", name: "Ali", role: "officer", department: "Electricity", zone: "Zone A", password: "ali123" },
  { id: "off4", name: "John", role: "officer", department: "Sanitation", zone: "Zone A", password: "john123" },

  // Zone B
  { id: "off5", name: "Ravi", role: "officer", department: "Road", zone: "Zone B", password: "ravi123" },
  { id: "off6", name: "Neha", role: "officer", department: "Water", zone: "Zone B", password: "neha123" },
  { id: "off7", name: "Sahil", role: "officer", department: "Electricity", zone: "Zone B", password: "sahil123" },
  { id: "off8", name: "Priya", role: "officer", department: "Sanitation", zone: "Zone B", password: "priya123" },

  // Zone C
  { id: "off9", name: "Amit", role: "officer", department: "Road", zone: "Zone C", password: "amit123" },
  { id: "off10", name: "Sneha", role: "officer", department: "Water", zone: "Zone C", password: "sneha123" },
  { id: "off11", name: "Farhan", role: "officer", department: "Electricity", zone: "Zone C", password: "farhan123" },
  { id: "off12", name: "Meera", role: "officer", department: "Sanitation", zone: "Zone C", password: "meera123" },

  // Zone D
  { id: "off13", name: "Vikram", role: "officer", department: "Road", zone: "Zone D", password: "vikram123" },
  { id: "off14", name: "Raja Vara Prasad", role: "officer", department: "Water", zone: "Zone D", password: "raja123" },
  { id: "off15", name: "Aisha", role: "officer", department: "Electricity", zone: "Zone D", password: "aisha123" },
  { id: "off16", name: "Rohit", role: "officer", department: "Sanitation", zone: "Zone D", password: "rohit123" },

  // SUPERVISORS (4) — one per department
  { id: "sup1", name: "Sara", role: "supervisor", department: "Road", password: "sara123" },
  { id: "sup2", name: "David", role: "supervisor", department: "Water", password: "david123" },
  { id: "sup3", name: "Kiran", role: "supervisor", department: "Electricity", password: "kiran123" },
  { id: "sup4", name: "Kishore", role: "supervisor", department: "Sanitation", password: "kishore123" },

  // CITIZENS (7) — NO PASSWORDS IN MOCKDATA
  { id: "cit1", name: "Ahmed", role: "citizen" },
  { id: "cit2", name: "Rahul", role: "citizen" },
  { id: "cit3", name: "Bharat", role: "citizen" },
  { id: "cit4", name: "Vikram", role: "citizen" },
  { id: "cit5", name: "Dhanunjay", role: "citizen" },
  { id: "cit6", name: "Dhanush", role: "citizen" },
  { id: "cit7", name: "Vivek", role: "citizen" }
];

export const initialCases = [];