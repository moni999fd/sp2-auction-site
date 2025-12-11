# EliteAuctions – Noroff SP2 Auction Website

Semester Project 2 – Front-end Development

A modern, responsive auction platform built with **HTML**, **CSS/Tailwind**, and **vanilla JavaScript**, using the **Noroff API v2 (Auction endpoints)**.  
Registered users can create listings, upload images, place bids, edit profiles, and view their activity.  
Unregistered users can browse and search listings.

---

## Live Demo

https://sp2-auction-site.netlify.app/

## GitHub Repository

https://github.com/moni999fd/sp2-auction-site

---

## Features

### Authentication

- Register using `@stud.noroff.no` email
- Login + logout
- LocalStorage-based session handling
- Dynamic navbar (username + credits visible when logged in)

### Profile Page

- View user details (bio, avatar, banner, credits)
- Edit bio, avatar, and banner
- View **My Listings** (listings created by user)
- View **Listings I’ve Bid On** (dynamic filter of listings containing user’s bids)

### Listings

- Browse all active listings
- Search by title
- View single listing with:
  - Media gallery
  - Bid history
  - Highest bid
  - Closing date/time
- Logged-in users can place bids
- Creators can **edit** and **delete** their own listings

### Create Listing

- Add title, description, image URL, and auction end date/time
- Form validation
- Redirect to newly created listing

---

## Technology Stack

**Frontend:**

- HTML5
- Tailwind CSS (via CDN)
- Vanilla JavaScript (ES Modules)

**API:**

- Noroff Auction API v2
- Endpoints used: `/auth`, `/profiles`, `/listings`, `/listings/:id/bids`

**Hosting:**

- Netlify

---

## Project Structure

sp2-auction-site/
│ index.html
│ listing.html
│ create-listing.html
│ profile.html
│ login.html
│ register.html
│ styles/
│ └── base.css
│ js/
│ ├── api.js
│ ├── auth.js
│ ├── config.js
│ ├── feed.js
│ ├── listing.js
│ ├── profile.js
│ ├── create-listing.js
│ ├── login.js
│ ├── register.js
│ └── ui.js
└ assets/

---

## Testing

The following were tested manually and through browser DevTools:

- Form validation on all major forms
- Navigation flow
- Bid placement
- Profile updates
- API error handling
- Mobile responsiveness
- Deployment test on Netlify (private window + incognito)

---

## Requirements Coverage

✔ Register / Login  
✔ Create Listing  
✔ Edit Profile  
✔ Browse & Search Listings  
✔ View Single Listing  
✔ Place Bid  
✔ View My Listings  
✔ View Listings Bid On  
✔ Delete Listing  
✔ Responsive Design  
✔ Deployed Frontend  
✔ API v2 Integration

---

## Reflection

This project strengthened my skills in API integration, asynchronous JavaScript, modular structuring, and UI consistency.
One of the main challenges was managing state across pages and ensuring profile and listing data always stayed in sync with the API.
I also focused on creating a premium user interface that reflects a luxury auction platform while ensuring full responsiveness and accessibility.

---

## Author

**Monica Marulanda**  
Front-end Developer Student @ Noroff
