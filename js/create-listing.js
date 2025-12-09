// js/create-listing.js

import { apiFetch } from "./api.js";

const BASE = "https://v2.api.noroff.dev";
const LISTINGS_URL = `${BASE}/auction/listings`;

const form = document.getElementById("createListingForm");
const titleEl = document.getElementById("title");
const descriptionEl = document.getElementById("description");
const tagsEl = document.getElementById("tags");
const mediaUrlEl = document.getElementById("mediaUrl");
const mediaAltEl = document.getElementById("mediaAlt");
const endDateEl = document.getElementById("endDate");
const endTimeEl = document.getElementById("endTime");
const errorEl = document.getElementById("createError");
const successEl = document.getElementById("createSuccess");
const submitBtn = form?.querySelector('button[type="submit"]');

/**
 * Ensure user is logged in, otherwise redirect
 */
function ensureLoggedIn() {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    window.location.href = "./login.html";
    return false;
  }
  return true;
}

/**
 * Set loading state on button
 */
function setLoading(loading) {
  if (!submitBtn) return;
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? "Creating listing…" : "Create listing";
}

/**
 * Build ISO string from separate date + time inputs
 */
function buildEndsAtIso(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;
  // Construct in local time and convert to ISO
  const dateTimeString = `${dateValue}T${timeValue}`;
  const localDate = new Date(dateTimeString);
  if (Number.isNaN(localDate.getTime())) return null;
  return localDate.toISOString();
}

/**
 * Parse comma-separated tags into an array
 */
function parseTags(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/**
 * Build media array based on provided URL
 */
function buildMedia(url, alt) {
  if (!url) return [];
  return [
    {
      url: url.trim(),
      alt: (alt || "").trim(),
    },
  ];
}

/**
 * Handle form submit
 */
form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!ensureLoggedIn()) return;

  if (errorEl) errorEl.textContent = "";
  if (successEl) {
    successEl.textContent = "";
    successEl.classList.add("hidden");
  }

  const title = titleEl?.value.trim();
  const description = descriptionEl?.value.trim();
  const tagsValue = tagsEl?.value.trim();
  const mediaUrl = mediaUrlEl?.value.trim();
  const mediaAlt = mediaAltEl?.value.trim();
  const endDate = endDateEl?.value;
  const endTime = endTimeEl?.value;

  // Basic validation
  if (!title) {
    errorEl.textContent = "Title is required.";
    return;
  }

  const endsAtIso = buildEndsAtIso(endDate, endTime);
  if (!endsAtIso) {
    errorEl.textContent = "Please provide a valid end date and time.";
    return;
  }

  const now = new Date();
  const endsAtDate = new Date(endsAtIso);
  if (endsAtDate <= now) {
    errorEl.textContent = "End time must be in the future.";
    return;
  }

  const payload = {
    title,
    description: description || "",
    tags: parseTags(tagsValue),
    media: buildMedia(mediaUrl, mediaAlt),
    endsAt: endsAtIso,
  };

  try {
    setLoading(true);

    const created = await apiFetch(LISTINGS_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (successEl) {
      successEl.textContent = "Listing created successfully! Redirecting…";
      successEl.classList.remove("hidden");
    }

    // Redirect to the new listing page
    if (created && created.id) {
      setTimeout(() => {
        window.location.href = `./listing.html?id=${encodeURIComponent(
          created.id
        )}`;
      }, 1000);
    } else {
      // Fallback: go home
      setTimeout(() => {
        window.location.href = "./index.html";
      }, 1000);
    }
  } catch (error) {
    console.error("Create listing error:", error);
    errorEl.textContent =
      error.message ||
      "Something went wrong while creating the listing. Please try again.";
  } finally {
    setLoading(false);
  }
});
