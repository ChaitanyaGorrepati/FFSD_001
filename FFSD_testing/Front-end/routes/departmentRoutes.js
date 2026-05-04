// routes/departmentRoutes.js
import {
  handleGetDepartments,
  handleAddDepartment,
  handleUpdateDepartment,
  handleDeleteDepartment
} from "../controllers/departmentController.js";

export function fetchDepartments() {
  return handleGetDepartments();
}

export function createDepartment(data) {
  return handleAddDepartment(data);
}

export function editDepartment(name, data) {
  return handleUpdateDepartment(name, data);
}

export function removeDepartment(name) {
  return handleDeleteDepartment(name);
}
