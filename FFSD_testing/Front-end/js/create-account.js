/**
 * create-account.js — Place at: js/create-account.js
 * Handles citizen self-registration only.
 * Uses createCitizenAccount() from userModel via index.js.
 */

import { createCitizenAccount } from "./index.js";

const fullnameInput   = document.getElementById("fullname");
const usernameInput   = document.getElementById("username");
const passwordInput   = document.getElementById("password");
const registerBtn     = document.getElementById("register-btn");
const successBanner   = document.getElementById("successBanner");

registerBtn.addEventListener("click", handleRegister);

function handleRegister() {
  let valid = true;

  const name     = fullnameInput.value.trim();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  // Reset errors
  clearError("fullname");
  clearError("username");
  clearError("password");

  if (!name) {
    showError("fullname", "Full name is required.");
    valid = false;
  }
  if (!username) {
    showError("username", "Username is required.");
    valid = false;
  }
  if (!password || password.length < 4) {
    showError("password", "Password must be at least 4 characters.");
    valid = false;
  }

  if (!valid) return;

  const result = createCitizenAccount({ name, username, password });

  if (!result.success) {
    showError("username", result.error);
    return;
  }

  // Show success, set role for login redirect
  sessionStorage.setItem("ct_selected_role", "citizen");
  successBanner.classList.remove("hidden");
  registerBtn.disabled = true;
  registerBtn.textContent = "Account Created ✓";
}

function showError(field, msg) {
  const el = document.getElementById(`${field}-error`);
  if (el) { el.textContent = msg; el.classList.remove("hidden"); }
  const input = document.getElementById(field);
  if (input) input.classList.add("error-input");
}

function clearError(field) {
  const el = document.getElementById(`${field}-error`);
  if (el) el.classList.add("hidden");
  const input = document.getElementById(field);
  if (input) input.classList.remove("error-input");
}
