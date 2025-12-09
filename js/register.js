// js/register.js

const BASE = "https://v2.api.noroff.dev";

const form = document.getElementById("registerForm");
const nameEl = document.getElementById("name");
const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const confirmPasswordEl = document.getElementById("confirmPassword");
const avatarEl = document.getElementById("avatar");
const bannerEl = document.getElementById("banner");
const errorEl = document.getElementById("registerError");
const successEl = document.getElementById("registerSuccess");

const submitBtn = form?.querySelector('button[type="submit"]');

/**
 * Check if email ends with @stud.noroff.no
 * @param {string} email
 */
function isValidStudentEmail(email) {
  if (typeof email !== "string") return false;
  return email.toLowerCase().endsWith("@stud.noroff.no");
}

/**
 * Call Noroff v2 register endpoint
 * @param {{ name: string; email: string; password: string; avatar?: string; banner?: string }} payload
 */
async function registerUser(payload) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse errors, handle below
  }

  if (!res.ok) {
    const msg =
      data?.errors?.[0]?.message ||
      data?.message ||
      `Register failed (HTTP ${res.status})`;
    throw new Error(msg);
  }

  // v2 returns { data: { ... } }
  return data?.data ?? data;
}

function setLoading(loading) {
  if (!submitBtn) return;
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? "Creating account…" : "Create account";
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!nameEl || !emailEl || !passwordEl || !confirmPasswordEl || !errorEl) return;

  errorEl.textContent = "";
  if (successEl) {
    successEl.textContent = "";
    successEl.classList.add("hidden");
  }

  const name = nameEl.value.trim();
  const email = emailEl.value.trim();
  const password = passwordEl.value.trim();
  const confirmPassword = confirmPasswordEl.value.trim();
  const avatar = avatarEl?.value.trim();
  const banner = bannerEl?.value.trim();

  // Basic validation
  if (!name || !email || !password || !confirmPassword) {
    errorEl.textContent = "Please fill in all required fields.";
    return;
  }

  if (!isValidStudentEmail(email)) {
    errorEl.textContent = "Only @stud.noroff.no email addresses can register.";
    return;
  }

  if (password.length < 8) {
    errorEl.textContent = "Password must be at least 8 characters.";
    return;
  }

  if (password !== confirmPassword) {
    errorEl.textContent = "Passwords do not match.";
    return;
  }

  const payload = { name, email, password };

  if (avatar) {
    payload.avatar = avatar;
  }
  if (banner) {
    payload.banner = banner;
  }

  try {
    setLoading(true);
    const created = await registerUser(payload);

    if (successEl) {
      successEl.textContent = "Account created successfully! Redirecting to login…";
      successEl.classList.remove("hidden");
    }

    // After a short delay, go to login
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 1200);
  } catch (err) {
    console.error("Register error:", err);
    errorEl.textContent =
      err.message || "Something went wrong while registering. Please try again.";
  } finally {
    setLoading(false);
  }
});
