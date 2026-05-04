/**
 * create-account.js — js/create-account.js
 * Phone number replaces username as the citizen login identifier.
 */
import { createCitizenAccount } from "./index.js";

const fullnameInput = document.getElementById("fullname");
const phoneInput    = document.getElementById("phone");
const passwordInput = document.getElementById("password");
const registerBtn   = document.getElementById("register-btn");
const successBanner = document.getElementById("successBanner");

// Strip non-digits as user types
phoneInput.addEventListener("input", () => {
  phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
});

registerBtn.addEventListener("click", handleRegister);

function handleRegister() {
  clearError("fullname");
  clearError("phone");
  clearError("password");

  const name     = fullnameInput.value.trim();
  const phone    = phoneInput.value.trim();
  const password = passwordInput.value;
  let valid = true;

  // Name: letters and spaces only
  if (!name) {
    showError("fullname", "Full name is required.");
    valid = false;
  } else if (!/^[A-Za-z\s]+$/.test(name)) {
    showError("fullname", "Name must contain letters only, no numbers.");
    valid = false;
  }

  // Phone: exactly 10 digits
  if (!phone) {
    showError("phone", "Phone number is required.");
    valid = false;
  } else if (!/^\d{10}$/.test(phone)) {
    showError("phone", "Phone number must be exactly 10 digits.");
    valid = false;
  }

  // Password: min 6 characters
  if (!password) {
    showError("password", "Password is required.");
    valid = false;
  } else if (password.length < 6) {
    showError("password", "Password must be at least 6 characters.");
    valid = false;
  }

  if (!valid) return;

  // Phone stored as username — it's the unique login key
  const result = createCitizenAccount({ name, username: phone, password });

  if (!result.success) {
    showError("phone", result.error === "Username already taken."
      ? "An account with this phone number already exists."
      : result.error
    );
    return;
  }

  sessionStorage.setItem("ct_selected_role", "citizen");
  successBanner.classList.remove("hidden");
  registerBtn.disabled = true;
  registerBtn.textContent = "Account Created \u2713";
}

function showError(field, msg) {
  const el = document.getElementById(field + "-error");
  if (el) { el.textContent = msg; el.classList.remove("hidden"); }
  const input = document.getElementById(field);
  if (input) input.classList.add("error-input");
}

function clearError(field) {
  const el = document.getElementById(field + "-error");
  if (el) el.classList.add("hidden");
  const input = document.getElementById(field);
  if (input) input.classList.remove("error-input");
}