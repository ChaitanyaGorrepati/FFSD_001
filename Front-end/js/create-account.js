// js/create-account.js

const fullnameInput = document.getElementById("fullname");
const phoneInput    = document.getElementById("phone");
const passwordInput = document.getElementById("password");
const registerBtn   = document.getElementById("register-btn");
const successBanner = document.getElementById("successBanner");

// digits only
phoneInput.addEventListener("input", () => {
  phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
});

registerBtn.addEventListener("click", handleRegister);

async function handleRegister() {
  const name = fullnameInput.value.trim();
  const phone = phoneInput.value.trim();
  const password = passwordInput.value;

  if (!name || !phone || !password) {
    alert("All fields required");
    return;
  }

  if (!/^\d{10}$/.test(phone)) {
    alert("Invalid phone number");
    return;
  }

  try {
    await fetch("http://localhost:3000/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        phone,
        password
      })
    });

    successBanner.classList.remove("hidden");
    registerBtn.disabled = true;
    registerBtn.textContent = "Account Created ✓";

  } catch (err) {
    console.error(err);
    alert("Registration failed");
  }
}