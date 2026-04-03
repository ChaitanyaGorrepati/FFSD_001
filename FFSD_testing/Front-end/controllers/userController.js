// controllers/userController.js
import { getUsers, addUser, updateUser, deleteUser } from "../models/userModel.js";

export function handleGetUsers() {
  return getUsers();
}

export function handleAddUser(data) {
  if (!data.name || !data.role) return { error: "Name and role are required." };
  if (data.role === "officer" && !data.department) return { error: "Department required for officers." };

  const user = {
    id: "usr-" + Date.now(),
    name: data.name.trim(),
    role: data.role,
    department: data.department || null,
    zone: data.zone || null
  };

  addUser(user);
  return { success: true, user };
}

export function handleUpdateUser(id, data) {
  if (!data.name || !data.role) return { error: "Name and role are required." };
  updateUser(id, {
    name: data.name.trim(),
    role: data.role,
    department: data.department || null,
    zone: data.zone || null
  });
  return { success: true };
}

export function handleDeleteUser(id) {
  deleteUser(id);
  return { success: true };
}