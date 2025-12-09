// js/profile.js

import { apiFetch } from "./api.js";

const BASE = "https://v2.api.noroff.dev";
const PROFILE_BASE = `${BASE}/auction/profiles`;
const PROFILE_URL = PROFILE_BASE; // reuse the same base
const LISTINGS_BASE = `${BASE}/auction/listings`;

const headerEl = document.getElementById("profileHeader");
const myListingsEl = document.getElementById("myListingsList");
const myBidsEl = document.getElementById("myBidsList");

/**
 * Get stored auth user + token
 */
function getStoredAuth() {
  const token = localStorage.getItem("accessToken");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch (error) {
    user = {};
  }
  return { token, user };
}

/**
 * Redirect to login if not authenticated
 */
function ensureLoggedIn() {
  const { token } = getStoredAuth();
  if (!token) {
    window.location.href = "./login.html";
    return false;
  }
  return true;
}

/**
 * Format datetime
 * @param {string} iso
 */
/**
 * Get a URL from a profile media field (which may be a string or object)
 */
function getMediaUrl(value, fallback = "") {
  if (!value) return fallback;

  // If API returns a plain string URL
  if (typeof value === "string") {
    return value;
  }

  // If API returns an object with { url, alt }
  if (typeof value === "object" && value.url) {
    return value.url;
  }

  return fallback;
}


function formatDateTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch (error) {
    return iso;
  }
}

/**
 * Render profile header (avatar, name, email, credits, bio)
 */
function renderProfileHeader(profile) {
  const name = profile.name || "Unknown user";
  const email = profile.email || "";
  const credits = typeof profile.credits === "number" ? profile.credits : 0;

  // ✅ Use helper so we support string OR object from API
  const avatarUrl = getMediaUrl(
    profile.avatar,
    "https://placehold.co/96x96?text=Avatar"
  );
  const bannerUrl = getMediaUrl(profile.banner, "");

  const bio = profile.bio || "No bio added yet.";

  headerEl.innerHTML = `
    <div class="flex flex-col lg:flex-row gap-4 lg:gap-6">
      <!-- Left: avatar/banner -->
      <div class="lg:w-1/3">
        <div class="w-full h-32 rounded-xl mb-3 ${bannerUrl ? "" : "bg-gray-200"} overflow-hidden">
          ${
            bannerUrl
              ? `<img src="${bannerUrl}" alt="Profile banner" class="w-full h-full object-cover" />`
              : `<div class="w-full h-full flex items-center justify-center text-xs text-gray-500">No banner</div>`
          }
        </div>
        <div class="flex items-center gap-3">
          <img
            src="${avatarUrl}"
            alt="${name} avatar"
            class="w-16 h-16 rounded-full object-cover border border-gray-200"
          />
          <div>
            <h1 class="text-xl font-semibold">${name}</h1>
            <p class="text-xs text-gray-600">${email}</p>
          </div>
        </div>
      </div>

      <!-- Right: credits + bio -->
      <div class="lg:w-2/3 flex flex-col gap-3">
        <div class="flex items-center gap-4">
          <div class="px-4 py-2 rounded-full bg-black text-white text-sm font-medium">
            Credits: ${credits}
          </div>
          <p class="text-xs text-gray-500">
            Your credits are used to place bids on listings.
          </p>
        </div>

        <div>
          <h2 class="text-sm font-semibold mb-1">Bio</h2>
          <p class="text-sm text-gray-700 whitespace-pre-line">
            ${bio}
          </p>
        </div>
      </div>
    </div>
  `;

  // Update stored user + navbar credits
  try {
    const stored = getStoredAuth().user || {};
    const updated = {
      ...stored,
      name: profile.name,
      email: profile.email,
      credits: profile.credits,
      avatar: avatarUrl,   // ✅ store the final URL
      banner: bannerUrl,   // ✅ store the final URL
      bio: profile.bio,
    };
    localStorage.setItem("user", JSON.stringify(updated));

    const creditsBadge = document.getElementById("creditsBadge");
    if (creditsBadge && typeof profile.credits === "number") {
      creditsBadge.textContent = `${profile.credits} credits`;
      creditsBadge.classList.remove("hidden");
    }
  } catch (error) {
    // ignore update issues
  }
}


/**
 * Render one listing card (for "My Listings" or "My Bids")
 */
function renderListingCard(listing, extraInfo = "") {
  const title = listing.title || "Untitled listing";
  const description = listing.description || "";
  const endsAt = formatDateTime(listing.endsAt);
  const bidsCount =
    listing._count?.bids ??
    (Array.isArray(listing.bids) ? listing.bids.length : 0);

  const media =
    Array.isArray(listing.media) && listing.media[0] ? listing.media[0] : null;
  const imgHtml = media
    ? `<img src="${media.url}" alt="${media.alt || ""}" class="w-full h-40 object-cover rounded-xl mb-3" />`
    : `<div class="w-full h-40 rounded-xl mb-3 bg-gray-200 flex items-center justify-center text-xs text-gray-500">No image</div>`;

  return `
    <article class="card">
      ${imgHtml}
      <h3 class="text-base font-semibold mb-1 line-clamp-2">${title}</h3>
      <p class="text-xs text-gray-500 mb-1">
        ${extraInfo}
      </p>
      <p class="text-sm text-gray-700 mb-2 line-clamp-3">${description}</p>
      <p class="text-xs text-gray-600 mb-1">
        Bids: <span class="font-semibold">${bidsCount}</span>
        ${endsAt ? ` • Ends: ${endsAt}` : ""}
      </p>
      <a
        href="./listing.html?id=${encodeURIComponent(listing.id)}"
        class="btn btn-primary mt-2 w-full text-center"
      >
        View listing
      </a>
    </article>
  `;
}

/**
 * Render "My Listings"
 */
function renderMyListings(profile) {
  if (!myListingsEl) return;

  const listings = Array.isArray(profile.listings) ? profile.listings : [];

  if (!listings.length) {
    myListingsEl.innerHTML = `
      <p class="text-sm text-gray-600">You haven’t created any listings yet.</p>
    `;
    return;
  }

  myListingsEl.innerHTML = listings
    .map((listing) => renderListingCard(listing, "You are the seller"))
    .join("");
}

/**
 * Render "My Bids"
 * profile.bids expected to be an array of bid objects, possibly including listing data
 */
function renderMyBids(listings) {
  if (!myBidsEl) return;

  if (!Array.isArray(listings) || listings.length === 0) {
    myBidsEl.innerHTML = `
      <p class="text-sm text-gray-600">
        You haven’t placed any bids yet.
      </p>
    `;
    return;
  }

  const { user } = getStoredAuth();
  const myName = user?.name;

  const cards = listings
    .map((listing) => {
      const title = listing.title || "Untitled listing";
      const sellerName = listing.seller?.name || "Unknown seller";
      const endsAt = listing.endsAt ? formatDateTime(listing.endsAt) : "N/A";

      const bids = Array.isArray(listing.bids) ? listing.bids : [];

      // highest bid overall
      const highest = bids.reduce(
        (max, b) =>
          typeof b.amount === "number" && b.amount > max ? b.amount : max,
        0
      );

      // your highest bid on this listing (using flexible bidder name logic)
      let myHighest = 0;
      if (myName) {
        myHighest = bids
          .filter((b) => {
            const bidderName =
              (b.bidder && b.bidder.name) ||
              b.bidderName ||
              (typeof b.bidder === "string" ? b.bidder : "");
            return bidderName === myName;
          })
          .reduce(
            (max, b) =>
              typeof b.amount === "number" && b.amount > max ? b.amount : max,
            0
          );
      }

      return `
        <article class="card">
          <h3 class="text-sm font-semibold mb-1">${title}</h3>
          <p class="text-xs text-gray-600 mb-1">
            Seller: <span class="font-medium">${sellerName}</span>
          </p>
          <p class="text-xs text-gray-600">
            Auction ends: ${endsAt}
          </p>
          <p class="text-xs text-gray-700 mt-1">
            Highest bid: <span class="font-semibold">${highest} credits</span>
            ${
              myHighest
                ? ` • Your highest bid: <span class="font-semibold">${myHighest} credits</span>`
                : ""
            }
          </p>
          <a
            href="./listing.html?id=${encodeURIComponent(listing.id)}"
            class="button-link inline-block mt-2 text-xs"
          >
            View listing
          </a>
        </article>
      `;
    })
    .join("");

  myBidsEl.innerHTML = cards;
}

function setupProfileEdit(profile) {
  const form = document.getElementById("profileEditForm");
  if (!form || !profile) return;

  const bioEl = document.getElementById("profileBio");
  const avatarUrlEl = document.getElementById("avatarUrl");
  const avatarAltEl = document.getElementById("avatarAlt");
  const bannerUrlEl = document.getElementById("bannerUrl");
  const bannerAltEl = document.getElementById("bannerAlt");
  const errorEl = document.getElementById("profileEditError");
  const successEl = document.getElementById("profileEditSuccess");

  // Prefill with existing values
  if (bioEl) bioEl.value = profile.bio || "";
  if (avatarUrlEl) avatarUrlEl.value = profile.avatar?.url || "";
  if (avatarAltEl) avatarAltEl.value = profile.avatar?.alt || "";
  if (bannerUrlEl) bannerUrlEl.value = profile.banner?.url || "";
  if (bannerAltEl) bannerAltEl.value = profile.banner?.alt || "";

  function setLoading(loading) {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? "Saving…" : "Save profile changes";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (errorEl) errorEl.textContent = "";
    if (successEl) {
      successEl.textContent = "";
      successEl.classList.add("hidden");
    }

    const bio = bioEl?.value.trim() || "";
    const avatarUrl = avatarUrlEl?.value.trim();
    const avatarAlt = avatarAltEl?.value.trim();
    const bannerUrl = bannerUrlEl?.value.trim();
    const bannerAlt = bannerAltEl?.value.trim();

    const payload = {};

    // We always allow updating bio (including empty string)
    payload.bio = bio;

    if (avatarUrl) {
      if (!avatarUrl.startsWith("http")) {
        if (errorEl) {
          errorEl.textContent =
            "Avatar URL must be a full link starting with http or https.";
        }
        return;
      }
      payload.avatar = {
        url: avatarUrl,
        alt: avatarAlt || "",
      };
    }

    if (bannerUrl) {
      if (!bannerUrl.startsWith("http")) {
        if (errorEl) {
          errorEl.textContent =
            "Banner URL must be a full link starting with http or https.";
        }
        return;
      }
      payload.banner = {
        url: bannerUrl,
        alt: bannerAlt || "",
      };
    }

    // If user left everything untouched and bio is same as before, avoid empty payload
    if (
      !payload.avatar &&
      !payload.banner &&
      bio === (profile.bio || "")
    ) {
      if (errorEl) {
        errorEl.textContent =
          "Please change your bio, avatar or banner before saving.";
      }
      return;
    }

    try {
      setLoading(true);

      // PUT /auction/profiles/<name>
      const updated = await apiFetch(
        `${PROFILE_URL}/${encodeURIComponent(profile.name)}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      if (successEl) {
        successEl.textContent = "Profile updated successfully.";
        successEl.classList.remove("hidden");
      }

      // Update localStorage user (so navbar, credits, etc. use latest profile)
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        const merged = {
          ...stored,
          bio: updated.bio,
          avatar: updated.avatar,
          banner: updated.banner,
        };
        localStorage.setItem("user", JSON.stringify(merged));
      } catch {
        // ignore if something goes wrong here
      }

      // Reload everything with fresh data (header, listings counts, etc.)
      loadProfile();
    } catch (err) {
      console.error("Profile update error:", err);
      if (errorEl) {
        errorEl.textContent =
          err?.message ||
          "Something went wrong while updating your profile. Please try again.";
      }
    } finally {
      setLoading(false);
    }
  });
}
async function loadBidActivity(profile) {
  if (!myBidsEl) return;

  const { user } = getStoredAuth();
  const myName = user?.name;
  if (!myName) {
    myBidsEl.innerHTML = `
      <p class="text-sm text-gray-600">
        You haven’t placed any bids yet.
      </p>
    `;
    return;
  }

  myBidsEl.innerHTML = `
    <p class="text-sm text-gray-600">Loading bids…</p>
  `;

  try {
    // Get listings with bids so we can filter for ours
    const url = `${LISTINGS_BASE}?_bids=true&limit=100`;
    const result = await apiFetch(url);

    const listings = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
      ? result.data
      : [];

    const myBidListings = listings.filter((listing) => {
  if (!Array.isArray(listing.bids)) return false;

  return listing.bids.some((b) => {
    const bidderName =
      (b.bidder && b.bidder.name) ||
      b.bidderName ||
      (typeof b.bidder === "string" ? b.bidder : "");
    return bidderName === myName;
  });
});

    renderMyBids(myBidListings);
  } catch (error) {
    console.error("Error loading bid activity:", error);
    myBidsEl.innerHTML = `
      <p class="text-sm text-red-700">
        Could not load your bid activity. ${error.message || ""}
      </p>
    `;
  }
}

/**
 * Load profile data from API
 */
async function loadProfile() {
  if (!ensureLoggedIn()) return;

  const { user } = getStoredAuth();
  const name = user?.name;
  if (!name) {
    window.location.href = "./login.html";
    return;
  }

  if (headerEl) {
    headerEl.innerHTML = `<p class="text-sm text-gray-600">Loading profile…</p>`;
  }
  if (myListingsEl) {
    myListingsEl.innerHTML = `<p class="text-sm text-gray-600">Loading listings…</p>`;
  }
  if (myBidsEl) {
    myBidsEl.innerHTML = `<p class="text-sm text-gray-600">Loading bids…</p>`;
  }

  try {
  const url = `${PROFILE_BASE}/${encodeURIComponent(
    name
  )}?_listings=true&_bids=true`;

  const profile = await apiFetch(url);

  if (!profile || !profile.name) {
    throw new Error("Profile data is missing or invalid.");
  }

  // Render profile sections
  renderProfileHeader(profile);
renderMyListings(profile);

// ✨ NEW: load listings you've bid on
loadBidActivity(profile);

// profile edit form
setupProfileEdit(profile);


  // Enable the edit form with current data
  setupProfileEdit(profile);

} catch (error) {
  console.error("Error loading profile:", error);
  if (headerEl) {
    headerEl.innerHTML = `
      <div class="card border-l-4 border-red-600">
        <p class="text-red-700 font-semibold mb-1">Could not load profile</p>
        <p class="text-sm text-gray-700 whitespace-pre-wrap">
          ${error.message || "Something went wrong. Please try again later."}
        </p>
      </div>
    `;
  }
  if (myListingsEl) myListingsEl.innerHTML = "";
  if (myBidsEl) myBidsEl.innerHTML = "";
}
}

// Start it
loadProfile();
