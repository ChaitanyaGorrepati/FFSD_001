import { users as mockUsers } from "../data/mockData.js";

const USERS_KEY = "ct_users";

// ── Init: seed localStorage with mock users (officers, supervisors, superusers)
export function initUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
  }
}

// ── Get ALL users (mock + any registered citizens)
export function getUsers() {
  const stored = localStorage.getItem(USERS_KEY);
  if (stored) return JSON.parse(stored);
  return mockUsers;
}

// ── Get officers only
export function getOfficers() {
  return getUsers().filter(u => u.role === "officer");
}

// ── Create a new citizen account (citizens ONLY)
// Returns { success: true, user } or { success: false, error: string }
export function createCitizenAccount({ name, username, password }) {
  const users = getUsers();

  // Prevent duplicate username
  const exists = users.find(
    u => u.username?.toLowerCase() === username.toLowerCase()
  );
  if (exists) {
    return { success: false, error: "Username already taken." };
  }

  const newUser = {
    id: "u" + Date.now(),
    name,
    username,
    password, // plain text — acceptable for a frontend-only prototype
    role: "citizen",
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  return { success: true, user: newUser };
}