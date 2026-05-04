// controllers/departmentController.js
import {
  getDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment
} from "../models/departmentModel.js";

export function handleGetDepartments() {
  return getDepartments();
}

export function handleAddDepartment(data) {
  if (!data.name) return { error: "Department name is required." };
  const existing = getDepartments().find(d => d.name.toLowerCase() === data.name.toLowerCase());
  if (existing) return { error: "Department already exists." };

  const dept = {
    name: data.name.trim(),
    categories: data.categories || []
  };
  addDepartment(dept);
  return { success: true };
}

export function handleUpdateDepartment(name, data) {
  if (!data.name) return { error: "Department name is required." };
  updateDepartment(name, {
    name: data.name.trim(),
    categories: data.categories || []
  });
  return { success: true };
}

export function handleDeleteDepartment(name) {
  deleteDepartment(name);
  return { success: true };
}
