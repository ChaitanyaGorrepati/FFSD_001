// js/login.js

const roleDisplay   = document.getElementById("role-display");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const usernameError = document.getElementById("username-error");
const passwordError = document.getElementById("password-error");
const loginBtn      = document.getElementById("login-btn");

const ROLE_ROUTES = {
  citizen:    "./citizen/citizen-dashboard.html",
  officer:    "./officer/officer-dashboard.html",
  supervisor: "./supervisor/supervisor-dashboard.html",
  superuser:  "./superuser/superuser-dashboard.html",
};

const role = sessionStorage.getItem("ct_selected_role");
if (!role) window.location.href = "role-selection.html";

if (roleDisplay) roleDisplay.textContent = role;

// Citizen UI change
if (role === "citizen") {
  const label = document.querySelector("label[for='username']");
  if (label) label.textContent = "Phone Number";

  usernameInput.placeholder = "Enter 10-digit phone";
}

loginBtn.addEventListener("click", handleLogin);

async function handleLogin() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  clearErrors();

  if (!username) return showUsernameError("Required");
  if (!password) return showPasswordError("Required");

  try {
    const res = await fetch("http://localhost:3000/users", {
      headers: { role: "superuser" }
    });

    const users = await res.json();

    let user;

    if (role === "citizen") {
      user = users.find(
        u =>
          u.role === "citizen" &&
          u.phone === username &&
          u.password === password
      );
    } else {
      user = users.find(
        u =>
          u.role === role &&
          u.name.toLowerCase() === username.toLowerCase() &&
          u.password === password
      );
    }

    if (!user) {
      showUsernameError("Invalid credentials");
      return;
    }

    sessionStorage.setItem("ct_user", JSON.stringify(user));
    sessionStorage.setItem("ct_user_id", user.id);

    window.location.href = ROLE_ROUTES[role];

  } catch (err) {
    console.error(err);
    showUsernameError("Server error");
  }
}

// ── ERRORS ─────────────────
function showUsernameError(msg) {
  usernameInput.classList.add("error-input");
  usernameError.textContent = msg;
  usernameError.classList.remove("hidden");
}

function showPasswordError(msg) {
  passwordInput.classList.add("error-input");
  passwordError.textContent = msg;
  passwordError.classList.remove("hidden");
}

function clearErrors() {
  usernameInput.classList.remove("error-input");
  passwordInput.classList.remove("error-input");
  usernameError.classList.add("hidden");
  passwordError.classList.add("hidden");
}