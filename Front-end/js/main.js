// js/main.js
import { initUsers } from "../models/userModel.js";
import { initDepartments } from "../models/departmentModel.js";
import { initCases } from "../models/caseModel.js";

initUsers();
initDepartments();
initCases();

console.log("[CivicTrack] App initialised.");