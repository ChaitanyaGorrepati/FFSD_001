import { users } from "../data/mockData.js";

export function getUsers() {
  return users;
}

export function getOfficers() {
  return users.filter(u => u.role === "officer");
}

export function getSupervisors() {
  return users.filter(u => u.role === "supervisor");
}