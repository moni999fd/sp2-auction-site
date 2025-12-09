// js/ui.js
// Keep navbar auth + credits in sync on every page.

// --- helpers ---
function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function getStoredToken() {
  return localStorage.getItem("accessToken");
}

/**
 * Update navbar:
 *  - authLink: "Login" when logged out, username when logged in
 *  - logoutBtn: hidden when logged out, visible when logged in
 *  - creditsBadge: "<credits> credits" when logged in
 */
function updateAuthUi() {
  const authLink = document.getElementById("authLink");
  const logoutBtn = document.getElementById("logoutBtn");
  const creditsBadge = document.getElementById("creditsBadge");

  const token = getStoredToken();
  const user = getStoredUser();
  const isLoggedIn = Boolean(token && user && user.name);

  // Auth link
  if (authLink) {
    if (isLoggedIn) {
      authLink.href = "./profile.html";
      authLink.textContent = user.name || "Profile";
    } else {
      authLink.href = "./login.html";
      authLink.textContent = "Login";
    }
  }

  // Logout button
  if (logoutBtn) {
    if (isLoggedIn) {
      logoutBtn.classList.remove("hidden");
    } else {
      logoutBtn.classList.add("hidden");
    }
  }

  // Credits badge
  if (creditsBadge) {
    if (isLoggedIn && typeof user.credits === "number") {
      creditsBadge.textContent = `${user.credits} credits`;
      creditsBadge.classList.remove("hidden");
    } else {
      creditsBadge.textContent = "";
      creditsBadge.classList.add("hidden");
    }
  }
}

// Handle logout click
function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    // Clear auth
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    // Update UI
    updateAuthUi();

    // Redirect to home or login
    window.location.href = "./index.html";
  });
}

// Run automatically on each page once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  updateAuthUi();
  setupLogout();
});

// Expose globally (optional, if other scripts want to force refresh)
window.updateAuthUi = updateAuthUi;
