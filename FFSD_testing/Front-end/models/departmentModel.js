// models/departmentModel.js
import { departments as seedDepts } from "../data/mockData.js";

const KEY = "ct_departments";

export function initDepartments() {
  if (!localStorage.getItem(KEY)) {
    localStorage.setItem(KEY, JSON.stringify(seedDepts));
  }
}

export function getDepartments() {
  return JSON.parse(localStorage.getItem(KEY)) || [];
}

function saveDepartments(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addDepartment(dept) {
  const list = getDepartments();
  list.push(dept);
  saveDepartments(list);
}

export function updateDepartment(name, updates) {
  const list = getDepartments().map(d => d.name === name ? { ...d, ...updates } : d);
  saveDepartments(list);
}

export function deleteDepartment(name) {
  const list = getDepartments().filter(d => d.name !== name);
  saveDepartments(list);
}
