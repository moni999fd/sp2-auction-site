// js/api.js

const BASE = "https://v2.api.noroff.dev";
const LS_API_KEY = "apiKey";
const LS_TOKEN = "accessToken";

/**
 * Get access token from localStorage
 */
function getToken() {
  return localStorage.getItem(LS_TOKEN);
}

/**
 * Get stored API key from localStorage
 */
function getStoredApiKey() {
  return localStorage.getItem(LS_API_KEY);
}

/**
 * Save API key to localStorage
 */
function setStoredApiKey(key) {
  localStorage.setItem(LS_API_KEY, key);
}

/**
 * Ensure we have a valid API key for this user.
 * If missing, call /auth/create-api-key.
 */
export async function ensureApiKey() {
  const existing = getStoredApiKey();
  if (existing) return existing;

  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated. Please log in again.");
  }

  let res;
  let payload = null;

  try {
    res = await fetch(`${BASE}/auth/create-api-key`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}), // v2 expects body for some setups
    });

    const text = await res.text();
    payload = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(
      `Network error while creating API key: ${
        error?.message || String(error)
      }`
    );
  }

  if (!res.ok) {
    const msg =
      payload?.errors?.[0]?.message ||
      payload?.message ||
      `Failed to create API key (HTTP ${res.status})`;
    throw new Error(msg);
  }

  const key = payload?.data?.key;
  if (!key) {
    throw new Error("API key creation succeeded but no key was returned.");
  }

  setStoredApiKey(key);
  return key;
}

/**
 * Wrapper around fetch that:
 *  - Ensures we have an API key
 *  - Sends Authorization + X-Noroff-API-Key headers
 *  - Parses JSON
 *  - Returns data.data || data
 */
export async function apiFetch(url, options = {}) {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated. Please log in again.");
  }

  const apiKey = await ensureApiKey();

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "X-Noroff-API-Key": apiKey,
    ...(options.headers || {}),
  };

  let res;
  let payload = null;
  let text = "";

  try {
    res = await fetch(url, { ...options, headers });
    text = await res.text();
    payload = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(
      `Network error while calling API: ${error?.message || String(error)}`
    );
  }

  if (!res.ok) {
    const msg =
      payload?.errors?.[0]?.message ||
      payload?.message ||
      `Request failed (HTTP ${res.status})`;
    throw new Error(`${msg}${text ? `\n${text}` : ""}`);
  }

  return payload?.data ?? payload;
}
