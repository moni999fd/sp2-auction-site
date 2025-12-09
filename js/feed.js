// js/feed.js

import { apiFetch } from "./api.js";

const BASE = "https://v2.api.noroff.dev";
const LISTINGS_URL = `${BASE}/auction/listings`;

const gridEl = document.getElementById("listingsGrid");
const statusEl = document.getElementById("statusLine");
const searchInput = document.getElementById("searchInput");

let allListings = [];

// --- helpers ---

function setStatus(text) {
  if (statusEl) statusEl.textContent = text || "";
}

function escapeHTML(str = "") {
  return str.replace(/[&<>"']/g, (ch) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[ch] || ch;
  });
}

function formatDateTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/**
 * Filter listings by a simple text search in title/description/seller
 */
function filterListings(listings, term) {
  const q = (term || "").trim().toLowerCase();
  if (!q) return listings;

  return listings.filter((listing) => {
    const title = (listing.title || "").toLowerCase();
    const desc = (listing.description || "").toLowerCase();
    const seller = (listing.seller?.name || "").toLowerCase();
    return (
      title.includes(q) ||
      desc.includes(q) ||
      seller.includes(q)
    );
  });
}

/**
 * Render listing cards into #listingsGrid
 */
function renderListings(listings) {
  if (!gridEl) return;

  if (!Array.isArray(listings) || listings.length === 0) {
    gridEl.innerHTML = `
      <div class="card">
        <p class="text-sm text-gray-600">
          No listings match your search.
        </p>
      </div>
    `;
    return;
  }

  const cards = listings
    .map((listing) => {
      const title = escapeHTML(listing.title || "Untitled listing");
      const description = escapeHTML(listing.description || "");
      const endsAt = listing.endsAt ? formatDateTime(listing.endsAt) : "";
      const sellerName = listing.seller?.name || "Unknown seller";

      const bidsCount =
        listing._count?.bids ??
        (Array.isArray(listing.bids) ? listing.bids.length : 0);

      const media =
        Array.isArray(listing.media) && listing.media[0]
          ? listing.media[0]
          : null;

      const imgHtml = media
        ? `<img src="${media.url}" alt="${escapeHTML(
            media.alt || ""
          )}" class="w-full h-40 object-cover rounded-xl mb-3" />`
        : `<div class="w-full h-40 rounded-xl mb-3 bg-gray-200 flex items-center justify-center text-xs text-gray-500">No image</div>`;

      return `
        <article class="card">
          ${imgHtml}
          <h3 class="text-base font-semibold mb-1 line-clamp-2">${title}</h3>
          <p class="text-xs text-gray-500 mb-1">
            Seller: <span class="font-medium">${escapeHTML(sellerName)}</span>
          </p>
          <p class="text-xs text-gray-600 mb-1">
            Bids: <span class="font-semibold">${bidsCount}</span>
            ${endsAt ? ` • Ends: ${endsAt}` : ""}
          </p>
          <p class="text-sm text-gray-700 mb-2 line-clamp-3">
            ${description}
          </p>
          <a
            href="./listing.html?id=${encodeURIComponent(listing.id)}"
            class="btn btn-primary mt-2 w-full text-center"
          >
            View listing
          </a>
        </article>
      `;
    })
    .join("");

  gridEl.innerHTML = cards;
}

/**
 * Load listings from the API once
 */
async function loadListings() {
  if (!gridEl) return;

  gridEl.innerHTML = `
    <div class="card">
      <p class="text-sm text-gray-600">Loading listings…</p>
    </div>
  `;
  setStatus("Loading listings…");

  try {
    const url = `${LISTINGS_URL}?_seller=true&_bids=true&sort=created&sortOrder=desc&limit=100`;
    const result = await apiFetch(url);

    const data = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
      ? result.data
      : [];

    allListings = data;

    const currentTerm = searchInput?.value || "";
    const filtered = filterListings(allListings, currentTerm);

    renderListings(filtered);
    const baseCount = filtered.length;
    setStatus(
      currentTerm.trim()
        ? `${baseCount} result${baseCount === 1 ? "" : "s"} for “${
            currentTerm.trim()
          }”`
        : `Showing ${baseCount} active listings`
    );
  } catch (error) {
    console.error("Error loading listings:", error);
    if (gridEl) {
      gridEl.innerHTML = `
        <div class="card border-l-4 border-red-600">
          <p class="text-sm text-red-700 font-semibold mb-1">
            Could not load listings
          </p>
          <p class="text-xs text-gray-700 whitespace-pre-wrap">
            ${error.message || "Something went wrong. Please try again later."}
          </p>
        </div>
      `;
    }
    setStatus("Error loading listings");
  }
}

/**
 * Handle search input changes
 */
function setupSearch() {
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const term = searchInput.value || "";
    const filtered = filterListings(allListings, term);
    renderListings(filtered);

    const count = filtered.length;
    setStatus(
      term.trim()
        ? `${count} result${count === 1 ? "" : "s"} for “${term.trim()}”`
        : `Showing ${count} active listings`
    );
  });
}

// Kick off
setupSearch();
loadListings();
