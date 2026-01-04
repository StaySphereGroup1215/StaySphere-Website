
/**
 * StaySphere static site script
 * - Randomized hero background slideshow (2.8s)
 * - Gallery grid + lightbox with arrows (only when enlarged)
 * - Services tabs
 * - Request form: email fallback + optional Google Forms POST
 *
 * GOOGLE FORMS:
 *   1) Create Google Form with your fields
 *   2) In script.js below, set GOOGLE_FORM_ACTION_URL and map entry IDs
 *   3) Submits with mode:'no-cors' (standard for Google Forms)
 */

const gallery = (window.__STAYSPHERE_GALLERY__ || []).slice();
const heroImgs = (window.__STAYSPHERE_HERO__ || []).slice();

// ---- Mobile nav
const navbtn = document.getElementById("navbtn");
const mobileNav = document.getElementById("mobileNav");
if (navbtn && mobileNav) {
  navbtn.addEventListener("click", () => {
    const open = mobileNav.style.display === "block";
    mobileNav.style.display = open ? "none" : "block";
    navbtn.setAttribute("aria-expanded", String(!open));
    mobileNav.setAttribute("aria-hidden", String(open));
  });
  mobileNav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    mobileNav.style.display = "none";
    navbtn.setAttribute("aria-expanded", "false");
    mobileNav.setAttribute("aria-hidden", "true");
  }));
}

// ---- Utility: shuffle array (Fisher-Yates)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---- Hero background slideshow
const heroBg = document.getElementById("heroBg");
let heroOrder = shuffle(heroImgs.length ? heroImgs.slice() : gallery.slice(0, 10));
let heroIndex = 0;

function setHero(url) {
  if (!heroBg) return;
  heroBg.style.backgroundImage = `url('${url}')`;
}

if (heroBg && heroOrder.length) {
  setHero(heroOrder[0]);
  setInterval(() => {
    heroIndex = (heroIndex + 1) % heroOrder.length;
    setHero(heroOrder[heroIndex]);
  }, 2800);
}

// ---- Gallery: fully mixed across all photos
const galleryGrid = document.getElementById("galleryGrid");
let galleryOrder = shuffle(gallery.slice());

if (galleryGrid) {
  galleryOrder.forEach((src, idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "thumb";
    b.setAttribute("aria-label", `Open photo ${idx + 1}`);
    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = src;
    img.alt = `StaySphere gallery ${idx + 1}`;
    b.appendChild(img);
    b.addEventListener("click", () => openLightbox(idx));
    galleryGrid.appendChild(b);
  });
}

// ---- Lightbox
const lb = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
const lbClose = document.getElementById("lbClose");
const lbPrev = document.getElementById("lbPrev");
const lbNext = document.getElementById("lbNext");
let lbIndex = 0;

function openLightbox(i) {
  lbIndex = i;
  if (!lb || !lbImg) return;
  lb.classList.add("is-open");
  lb.setAttribute("aria-hidden", "false");
  lbImg.src = galleryOrder[lbIndex];
}

function closeLightbox() {
  if (!lb) return;
  lb.classList.remove("is-open");
  lb.setAttribute("aria-hidden", "true");
}

function prevImg() {
  lbIndex = (lbIndex - 1 + galleryOrder.length) % galleryOrder.length;
  lbImg.src = galleryOrder[lbIndex];
}

function nextImg() {
  lbIndex = (lbIndex + 1) % galleryOrder.length;
  lbImg.src = galleryOrder[lbIndex];
}

if (lbClose) lbClose.addEventListener("click", closeLightbox);
if (lbPrev) lbPrev.addEventListener("click", prevImg);
if (lbNext) lbNext.addEventListener("click", nextImg);
if (lb) {
  lb.addEventListener("click", (e) => {
    if (e.target === lb) closeLightbox();
  });
}
window.addEventListener("keydown", (e) => {
  if (!lb || !lb.classList.contains("is-open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") prevImg();
  if (e.key === "ArrowRight") nextImg();
});

// ---- Services tabs
document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.getAttribute("data-tab");
    document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("is-active", b === btn));
    document.querySelectorAll(".pane").forEach((p) => p.classList.toggle("is-active", p.id === id));
  });
});

// ---- Request modal triggers (scroll to form)
document.querySelectorAll("[data-open-request]").forEach((el) => {
  el.addEventListener("click", () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    document.querySelector("#requestForm input[name='name']")?.focus();
  });
});

// ---- Request form: Google Forms (optional) + email fallback
const form = document.getElementById("requestForm");
const statusEl = document.getElementById("formStatus");
const emailFallback = document.getElementById("emailFallback");

// Google Form endpoint (replace once you create your form)
const GOOGLE_FORM_ACTION_URL = ""; // e.g. "https://docs.google.com/forms/d/e/FORM_ID/formResponse"

// Map your form fields to Google Form entry IDs
const ENTRY = {
  name: "",      // e.g. "entry.1234567890"
  email: "",
  phone: "",
  company: "",
  city: "",
  guests: "",
  checkin: "",
  checkout: "",
  notes: ""
};

function buildMailto(data) {
  const subject = encodeURIComponent("StaySphere | Stay Request");
  const body = encodeURIComponent(
    `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nCompany: ${data.company}\nCity: ${data.city}\nGuests: ${data.guests}\nCheck-in: ${data.checkin}\nCheck-out: ${data.checkout}\nNotes: ${data.notes}`
  );
  return `mailto:admin@stayspheregroup.com?subject=${subject}&body=${body}`;
}

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

if (form) {
  form.addEventListener("input", () => {
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    if (emailFallback) emailFallback.href = buildMailto(data);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    if (emailFallback) emailFallback.href = buildMailto(data);

    // If Google Form URL isn't set, use email fallback and show message
    if (!GOOGLE_FORM_ACTION_URL) {
      setStatus("Request ready — click “Or email us” to send now. (Google Form not connected yet.)");
      return;
    }

    // Build payload for Google Forms
    const payload = new URLSearchParams();
    payload.append(ENTRY.name, data.name || "");
    payload.append(ENTRY.email, data.email || "");
    payload.append(ENTRY.phone, data.phone || "");
    payload.append(ENTRY.company, data.company || "");
    payload.append(ENTRY.city, data.city || "");
    payload.append(ENTRY.guests, data.guests || "");
    payload.append(ENTRY.checkin, data.checkin || "");
    payload.append(ENTRY.checkout, data.checkout || "");
    payload.append(ENTRY.notes, data.notes || "");

    try {
      setStatus("Sending…");
      await fetch(GOOGLE_FORM_ACTION_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString()
      });
      form.reset();
      setStatus("✅ Request submitted. We’ll follow up shortly.");
    } catch (err) {
      setStatus("Something went wrong. Please use “Or email us” to send your request.");
    }
  });
}

document.getElementById("year").textContent = String(new Date().getFullYear());
