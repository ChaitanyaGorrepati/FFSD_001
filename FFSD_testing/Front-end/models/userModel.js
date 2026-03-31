// models/userModel.js
import { users as mockUsers } from "../data/mockData.js";

const USERS_KEY = "ct_users";

// ── Seed localStorage with mock users on first load ───────────────────────────
export function initUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
  }
}

// ── Get ALL users (mock seeded + any registered citizens) ─────────────────────
export function getUsers() {
  const stored = localStorage.getItem(USERS_KEY);
  if (stored) return JSON.parse(stored);
  return mockUsers;
}

// ── Get officers only ─────────────────────────────────────────────────────────
export function getOfficers() {
  return getUsers().filter(u => u.role === "officer");
}

// ── Validate login for all roles ──────────────────────────────────────────────
// Returns: { success: true, user } or { success: false, error: string }
export function validateUserLogin(usernameOrName, password, role) {
  const users = getUsers();

  if (role === "citizen") {
    // Citizens log in by username (set during account creation)
    const user = users.find(
      u => u.role === "citizen" &&
           u.username?.toLowerCase() === usernameOrName.toLowerCase()
    );
    if (!user) return { success: false, error: "No citizen account found with that username." };
    if (user.password !== password) return { success: false, error: "Incorrect password." };
    return { success: true, user };
  }

  // Officers, Supervisors, Superusers log in by name (from mockData)
  const lookupRole = role === "superuser" ? "superuser" : role;

  const user = users.find(
    u => u.role === lookupRole &&
         u.name.toLowerCase() === usernameOrName.toLowerCase()
  );

  if (!user) {
    const available = users
      .filter(u => u.role === lookupRole)
      .map(u => u.name)
      .join(", ");
    return {
      success: false,
      error: `No ${lookupRole} found with that name. Available: ${available}`
    };
  }

  if (user.password !== password) {
    return { success: false, error: "Incorrect password." };
  }

  return { success: true, user };
}

// ── Create a new citizen account (citizens ONLY) ──────────────────────────────
// Returns: { success: true, user } or { success: false, error: string }
export function createCitizenAccount({ name, username, password }) {
  const users = getUsers();

  const exists = users.find(
    u => u.username?.toLowerCase() === username.toLowerCase()
  );
  if (exists) return { success: false, error: "Username already taken." };

  const newUser = {
    id:       "u" + Date.now(),
    name,
    username,
    password,
    role:     "citizen",
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  return { success: true, user: newUser };
}
// ── Add a new user ────────────────────────────────────────────────────────────
export function addUser(user) {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ── Update an existing user by ID ─────────────────────────────────────────────
export function updateUser(id, updates) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return;
  users[index] = { ...users[index], ...updates };
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ── Delete a user by ID ───────────────────────────────────────────────────────
export function deleteUser(id) {
  const users = getUsers().filter(u => u.id !== id);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}