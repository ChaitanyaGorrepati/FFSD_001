// routes/userRoutes.js
import {
  handleGetUsers,
  handleAddUser,
  handleUpdateUser,
  handleDeleteUser
} from "../controllers/userController.js";

export function fetchUsers() {
  return handleGetUsers();
}

export function createUser(data) {
  return handleAddUser(data);
}

export function editUser(id, data) {
  return handleUpdateUser(id, data);
}

export function removeUser(id) {
  return handleDeleteUser(id);
}
