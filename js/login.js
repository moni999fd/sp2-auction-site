const BASE = "https://v2.api.noroff.dev";

const form = document.getElementById("loginForm");
const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const errorEl = document.getElementById("loginError");
const successEl = document.getElementById("loginSuccess");

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
 * Call Noroff v2 login endpoint
 * @param {{ email: string; password: string }} payload
 */
async function login(payload) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore JSON errors, handle below
  }

  if (!res.ok) {
    const msg =
      data?.errors?.[0]?.message ||
      data?.message ||
      `Login failed (HTTP ${res.status})`;
    throw new Error(msg);
  }

  // v2 responses wrap data in { data: {...} }
  return data?.data ?? data;
}

function setLoading(loading) {
  if (!submitBtn) return;
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? "Logging in…" : "Login";
}

function onLoginSuccess(auth) {
  localStorage.setItem("accessToken", auth.accessToken);

  const userForStorage = {
    name: auth.name,
    email: auth.email,
    credits:
      typeof auth.credits === "number"
        ? auth.credits
        : 0,
    avatar: auth.avatar ?? null,
    banner: auth.banner ?? null,
  };

  localStorage.setItem("user", JSON.stringify(userForStorage));

  if (successEl) {
    successEl.textContent = `🎉 Welcome back, ${auth.name || "friend"}! Redirecting to your feed…`;
    successEl.style.display = "block";
  }

    setTimeout(() => {
    window.location.href = "./index.html";
  }, 1500);
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!emailEl || !passwordEl || !errorEl) return;

  errorEl.textContent = "";
  if (successEl) successEl.classList.add("hidden");

  const email = emailEl.value.trim();
  const password = passwordEl.value.trim();

  if (!email || !password) {
    errorEl.textContent = "Please enter both email and password.";
    return;
  }

  if (!isValidStudentEmail(email)) {
    errorEl.textContent = "Only @stud.noroff.no addresses may log in.";
    return;
  }

  try {
    setLoading(true);
    const auth = await login({ email, password });
    onLoginSuccess(auth);
  } catch (err) {
    console.error("Login error:", err);
    errorEl.textContent = err.message || "Something went wrong. Please try again.";
  } finally {
    setLoading(false);
  }
});
