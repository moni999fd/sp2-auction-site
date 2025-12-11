// js/listing.js

import { apiFetch } from "./api.js";

const BASE = "https://v2.api.noroff.dev";
const LISTINGS_URL = `${BASE}/auction/listings`;

const container = document.getElementById("listingContainer");

/**
 * Get ?id= from URL
 */
function getListingId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function setContent(html) {
  if (!container) return;
  container.innerHTML = html;
}

/**
 * Format date/time nicely
 * @param {string} iso
 */
function formatDateTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

/**
 * Safely get media array (or [])
 */
function getMediaArray(media) {
  if (!Array.isArray(media)) return [];
  return media;
}

/**
 * Generate media gallery HTML
 */
function renderMediaGallery(mediaArray) {
  if (!mediaArray.length) {
    return `
      <div class="w-full h-64 rounded-2xl bg-gray-200 flex items-center justify-center text-xs text-gray-500">
        No images available
      </div>
    `;
  }

  const main = mediaArray[0];
  const thumbs = mediaArray.slice(1);

  const mainImg = `
    <img
      src="${main.url}"
      alt="${main.alt || ""}"
      class="w-full h-64 object-cover rounded-2xl mb-3"
    />
  ";

  if (!thumbs.length) {
    return mainImg;
  }

  const thumbHtml = thumbs
    .map(
      (m) => `
      <img
        src="${m.url}"
        alt="${m.alt || ""}"
        class="w-20 h-20 object-cover rounded-lg border border-gray-200"
      />
    `
    )
    .join("");

  return `
    ${mainImg}
    <div class="flex gap-2 overflow-x-auto">${thumbHtml}</div>
  `;
}

/**
 * Render bid history list
 */
function renderBidHistory(bids) {
  if (!Array.isArray(bids) || bids.length === 0) {
    return `<p class="text-sm text-gray-600">No bids yet. Be the first!</p>`;
  }

  const sorted = [...bids].sort(
    (a, b) => new Date(b.created) - new Date(a.created)
  );

  const items = sorted
    .map((b) => {
      const amount = typeof b.amount === "number" ? b.amount : "?";
      const bidder = b.bidder?.name || "Unknown bidder";
      const time = formatDateTime(b.created);
      return `
        <li class="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-b-0">
          <span class="font-medium">${amount} credits</span>
          <span class="text-gray-600">by ${bidder}</span>
          <span class="text-gray-400 text-xs">${time}</span>
        </li>
      `;
    })
    .join("");

  return `<ul class="divide-y divide-gray-100">${items}</ul>`;
}

/**
 * Get current logged-in user from localStorage
 */
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

/**
 * Check if current user is logged in
 */
function isLoggedIn() {
  const token = localStorage.getItem("accessToken");
  const user = getCurrentUser();
  return Boolean(token && user?.name);
}

/**
 * Check if current user is the seller of this listing
 */
function isCurrentUserSeller(listing) {
  const user = getCurrentUser();
  if (!user?.name || !listing?.seller?.name) return false;
  return user.name === listing.seller.name;
}

/**
 * Compute highest bid amount from listing.bids
 */
function getHighestBidAmount(listing) {
  const bids = Array.isArray(listing.bids) ? listing.bids : [];
  if (!bids.length) return 0;
  return bids.reduce(
    (max, b) => (typeof b.amount === "number" && b.amount > max ? b.amount : max),
    0
  );
}

/**
 * Render the full listing view (including Edit/Delete + Bidding controls)
 */
function renderListing(listing) {
  const title = listing.title || "Untitled listing";
  const description = listing.description || "No description provided.";
  const created = formatDateTime(listing.created);
  const updated = listing.updated ? formatDateTime(listing.updated) : null;
  const endsAt = formatDateTime(listing.endsAt);
  const sellerName = listing.seller?.name || "Unknown seller";

  const bids = Array.isArray(listing.bids) ? listing.bids : [];
  const bidsCount = bids.length;

  const highest = getHighestBidAmount(listing);
  const mediaHtml = renderMediaGallery(getMediaArray(listing.media));
  const bidsHtml = renderBidHistory(bids);

  const loggedIn = isLoggedIn();
  const seller = isCurrentUserSeller(listing);
  const currentUser = getCurrentUser();
  const userCredits =
    typeof currentUser?.credits === "number" ? currentUser.credits : null;

  // Seller-only controls (no endsAt editing – API doesn't support it)
  const sellerControls = seller
    ? `
      <div class="flex flex-wrap gap-2 mt-3">
        <button id="editListingBtn" class="btn btn-outline-gold text-xs">
          Edit listing
        </button>
        <button id="deleteListingBtn" class="btn btn-primary bg-red-700 border-red-700 text-xs">
          Delete listing
        </button>
      </div>

      <section id="editListingSection" class="mt-4 hidden">
        <div class="border border-gray-200 rounded-xl p-3 bg-gray-50">
          <h2 class="text-sm font-semibold mb-2">Edit listing</h2>
          <p class="text-xs text-gray-500 mb-2">
            You can update the title, description and image. 
            The auction end time is fixed and cannot be changed (API limitation).
          </p>
          <form id="editListingForm" class="space-y-3 text-sm">
            <div>
              <label for="editTitle" class="block font-medium mb-1">Title</label>
              <input
                id="editTitle"
                name="editTitle"
                type="text"
                class="input"
                required
              />
            </div>
            <div>
              <label for="editDescription" class="block font-medium mb-1">Description</label>
              <textarea
                id="editDescription"
                name="editDescription"
                class="input min-h-[80px]"
              ></textarea>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label for="editMediaUrl" class="block font-medium mb-1">Image URL</label>
                <input
                  id="editMediaUrl"
                  name="editMediaUrl"
                  type="url"
                  class="input"
                />
              </div>
              <div>
                <label for="editMediaAlt" class="block font-medium mb-1">Image alt text</label>
                <input
                  id="editMediaAlt"
                  name="editMediaAlt"
                  type="text"
                  class="input"
                />
              </div>
            </div>

            <p id="editError" class="text-xs text-red-700 mt-1"></p>
            <p id="editSuccess" class="text-xs text-green-700 mt-1 hidden"></p>

            <button type="submit" class="btn btn-primary text-xs mt-1">
              Save changes
            </button>
          </form>
        </div>
      </section>
    `
    : "";

  // Bidding section (only for logged-in non-seller users)
  let biddingSectionHtml = "";
  if (!seller) {
    if (!loggedIn) {
      biddingSectionHtml = `
        <section class="mt-2">
          <p class="text-xs text-gray-500 mb-2">
            Log in with your @stud.noroff.no account to place a bid on this listing.
          </p>
          <a href="./login.html" class="btn btn-outline-gold text-xs">
            Go to login
          </a>
        </section>
      `;
    } else {
      biddingSectionHtml = `
        <section class="mt-2 border border-gray-200 rounded-xl p-3 bg-gray-50">
          <h2 class="text-sm font-semibold mb-1">Place a bid</h2>
          <p class="text-xs text-gray-600 mb-2">
            Current highest bid: <span class="font-semibold">${highest} credits</span>
            ${
              userCredits !== null
                ? ` • Your credits: <span class="font-semibold">${userCredits}</span>`
                : ""
            }
          </p>
          <form id="bidForm" class="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
            <div class="flex flex-col">
              <label for="bidAmount" class="text-xs font-medium mb-1">Your bid (credits)</label>
              <input
                id="bidAmount"
                name="bidAmount"
                type="number"
                min="${highest + 1}"
                step="1"
                class="input w-32"
                required
              />
            </div>
            <button type="submit" class="btn btn-primary text-xs">
              Place bid
            </button>
          </form>
          <p id="bidError" class="text-xs text-red-700 mt-1"></p>
          <p id="bidSuccess" class="text-xs text-green-700 mt-1 hidden"></p>
        </section>
      `;
    }
  }

  setContent(`
    <article class="flex flex-col lg:flex-row gap-8">
      <!-- Left side: images -->
      <div class="lg:w-1/2">
        ${mediaHtml}
      </div>

      <!-- Right side: details -->
      <div class="lg:w-1/2 flex flex-col gap-4">
        <header>
          <h1 class="text-2xl font-bold mb-1">${title}</h1>
          <p class="text-sm text-gray-600">
            Seller: <span class="font-medium">${sellerName}</span>
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Created: ${created}
            ${updated ? ` • Updated: ${updated}` : ""}
          </p>
        </header>

        <section>
          <h2 class="text-sm font-semibold mb-1">Description</h2>
          <p class="text-sm text-gray-700 whitespace-pre-line">
            ${description}
          </p>
        </section>

        <section class="bg-gray-50 rounded-xl p-3">
          <p class="text-sm text-gray-700">
            <span class="font-semibold">Auction ends:</span>
            <span>${endsAt || "No end date set"}</span>
          </p>
          <p class="text-sm text-gray-700 mt-1">
            <span class="font-semibold">Highest bid:</span>
            <span>${highest} credits</span>
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Total bids: ${bidsCount}
          </p>
        </section>

        ${biddingSectionHtml}

        <section>
          <h2 class="text-sm font-semibold mb-2">Bid history</h2>
          <div class="bg-white rounded-xl border border-gray-100 p-3 max-h-60 overflow-y-auto">
            ${bidsHtml}
          </div>
        </section>

        ${sellerControls}
      </div>
    </article>
  `);

  // After injecting HTML, wire up controls
  if (seller) {
    setupEditAndDeleteHandlers(listing);
  } else if (loggedIn) {
    setupBidHandler(listing);
  }
}

/**
 * Build media array from URL + alt
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
 * Attach events for Edit + Delete and populate the edit form
 */
function setupEditAndDeleteHandlers(listing) {
  const editBtn = document.getElementById("editListingBtn");
  const deleteBtn = document.getElementById("deleteListingBtn");
  const editSection = document.getElementById("editListingSection");
  const editForm = document.getElementById("editListingForm");

  const editTitle = document.getElementById("editTitle");
  const editDescription = document.getElementById("editDescription");
  const editMediaUrl = document.getElementById("editMediaUrl");
  const editMediaAlt = document.getElementById("editMediaAlt");
  const editError = document.getElementById("editError");
  const editSuccess = document.getElementById("editSuccess");

  if (!editBtn || !deleteBtn || !editSection || !editForm) return;

  // Pre-fill edit form with current listing data
  const mainMedia =
    Array.isArray(listing.media) && listing.media[0] ? listing.media[0] : null;

  if (editTitle) editTitle.value = listing.title || "";
  if (editDescription) editDescription.value = listing.description || "";
  if (editMediaUrl) editMediaUrl.value = mainMedia?.url || "";
  if (editMediaAlt) editMediaAlt.value = mainMedia?.alt || "";

  // Toggle edit section
  editBtn.addEventListener("click", () => {
    editSection.classList.toggle("hidden");
  });

  // Handle delete
  deleteBtn.addEventListener("click", async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      await apiFetch(`${LISTINGS_URL}/${encodeURIComponent(listing.id)}`, {
        method: "DELETE",
      });
      window.location.href = "./index.html";
    } catch (error) {
      console.error("Delete listing error:", error);
      alert(
        error.message ||
          "Something went wrong while deleting the listing. Please try again."
      );
    }
  });

  // Handle edit submit
  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (editError) editError.textContent = "";
    if (editSuccess) {
      editSuccess.textContent = "";
      editSuccess.classList.add("hidden");
    }

    const newTitle = editTitle?.value.trim();
    const newDesc = editDescription?.value.trim();
    const newMediaUrl = editMediaUrl?.value.trim();
    const newMediaAlt = editMediaAlt?.value.trim();

    if (!newTitle) {
      editError.textContent = "Title is required.";
      return;
    }

    const payload = {
      title: newTitle,
      description: newDesc || "",
    };

    const media = buildMedia(newMediaUrl, newMediaAlt);
    if (media.length) {
      payload.media = media;
    }

    try {
      const updated = await apiFetch(
        `${LISTINGS_URL}/${encodeURIComponent(listing.id)}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      if (editSuccess) {
        editSuccess.textContent = "Listing updated successfully.";
        editSuccess.classList.remove("hidden");
      }

      // Re-render the listing with updated data
      renderListing(updated);
    } catch (error) {
      console.error("Update listing error:", error);
      editError.textContent =
        error.message ||
        "Something went wrong while updating the listing. Please try again.";
    }
  });
}

/**
 * Attach event for bidding
 */
function setupBidHandler(listing) {
  const bidForm = document.getElementById("bidForm");
  const bidAmountEl = document.getElementById("bidAmount");
  const bidError = document.getElementById("bidError");
  const bidSuccess = document.getElementById("bidSuccess");

  if (!bidForm || !bidAmountEl || !bidError || !bidSuccess) return;

  function setBidLoading(loading) {
    const btn = bidForm.querySelector('button[type="submit"]');
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? "Placing bid…" : "Place bid";
  }

  bidForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    bidError.textContent = "";
    bidSuccess.textContent = "";
    bidSuccess.classList.add("hidden");

    const highest = getHighestBidAmount(listing);
    const rawValue = bidAmountEl.value;
    const amount = Number(rawValue);

    if (!rawValue || Number.isNaN(amount) || amount <= 0) {
      bidError.textContent = "Please enter a valid bid amount.";
      return;
    }

    if (amount <= highest) {
      bidError.textContent = `Your bid must be higher than the current highest bid (${highest} credits).`;
      return;
    }

    try {
      setBidLoading(true);

      await apiFetch(
        `${LISTINGS_URL}/${encodeURIComponent(listing.id)}/bids`,
        {
          method: "POST",
          body: JSON.stringify({ amount }),
        }
      );

      bidSuccess.textContent =
        "Bid placed successfully! Reloading latest bids…";
      bidSuccess.classList.remove("hidden");

      // Reload listing to show updated bids & highest amount
      setTimeout(() => {
        loadListing();
      }, 800);
    } catch (error) {
      console.error("Place bid error:", error);
      bidError.textContent =
        error.message ||
        "Something went wrong while placing your bid. Please try again.";
    } finally {
      setBidLoading(false);
    }
  });
}

/**
 * Load listing from API by ID
 * (uses plain fetch so non-logged-in users can also view)
 */
async function loadListing() {
  if (!container) return;

  const id = getListingId();
  if (!id) {
    setContent(`
      <div class="text-sm text-red-700">
        No listing ID provided in the URL.
      </div>
    `);
    return;
  }

  setContent(`
    <p class="text-sm text-gray-600">Loading listing details…</p>
  `);

  try {
    const url = `${LISTINGS_URL}/${encodeURIComponent(
      id
    )}?_seller=true&_bids=true`;

    const res = await fetch(url);
    let payload = null;

    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    if (!res.ok) {
      const msg =
        payload?.errors?.[0]?.message ||
        payload?.message ||
        `Failed to load listing (HTTP ${res.status})`;
      throw new Error(msg);
    }

    const data = payload?.data ?? payload;
    if (!data || !data.id) {
      throw new Error("Listing not found.");
    }

    renderListing(data);
  } catch (error) {
    console.error("Error loading listing:", error);
    setContent(`
      <div class="card border-l-4 border-red-600">
        <p class="text-red-700 font-semibold mb-1">Could not load listing</p>
        <p class="text-sm text-gray-700 whitespace-pre-wrap">
          ${error.message || "Something went wrong. Please try again later."}
        </p>
      </div>
    `);
  }
}

// Kick off
loadListing();
