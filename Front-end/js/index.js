// js/index.js

export {
  fetchCases,
  submitCase,
  updateStatus,
  addNote,
  fetchCasesForSupervisor
} from "../routes/caseRoutes.js";

export {
  getUsers,
  getOfficers,
  initUsers,
  createCitizenAccount,
  validateUserLogin
} from "../models/userModel.js";

export { initCases } from "../models/caseModel.js";