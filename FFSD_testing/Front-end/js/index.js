// js/index.js  ← one file to rule them all
export { 
  fetchCases, 
  submitCase, 
  updateStatus, 
  addNote, 
  fetchCasesForSupervisor  // local addition
} from "../../Front-end/routes/caseRoutes.js";

export { 
  getUsers, 
  getOfficers, 
  initUsers,               // remote addition
  createCitizenAccount     // remote addition
} from "../../Front-end/models/userModel.js";

export { initCases } from "../../Front-end/models/caseModel.js";