// js/index.js  ← one file to rule them all
export { fetchCases, submitCase, updateStatus, addNote } from "../../Front-end/routes/caseRoutes.js";
export { getUsers, getOfficers }                         from "../../Front-end/models/userModel.js";
export { initCases } from "../../Front-end/models/caseModel.js";
// --- ADD THESE to your existing index.js ---
export { initUsers, createCitizenAccount } from "../models/userModel.js";