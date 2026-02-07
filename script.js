// Snappy Studio — PRO interactions (clean + stable)
const qs = (s, el = document) => el.querySelector(s);
const qsa = (s, el = document) => [...el.querySelectorAll(s)];

const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

const topIntro = qs(".top-intro");
const headerEl = qs(".header");

function syncStickyHeights() {
  const topH = topIntro ? topIntro.getBoundingClientRect().height : 0;
  const headH = headerEl ? headerEl.getBoundingClientRect().height : 0;

  document.documentElement.style.setProperty("--topIntroH", `${topH}px`);
  document.documentElement.style.setProperty("--headerH", `${headH}px`);
}

window.addEventListener("load", syncStickyHeights);
window.addEventListener("resize", () => {
  clearTimeout(syncStickyHeights._t);
  syncStickyHeights._t = setTimeout(syncStickyHeights, 100);
});

// pe mobil uneori viewport-ul se schimbă când apare/dispare bara browserului
window.visualViewport?.addEventListener("resize", syncStickyHeights);
// Toast
const toast = qs("#toast");
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2600);
}

// Mobile menu
const navToggle = qs(".nav__toggle");
const navList = qs("#navList");
const navLinks = qsa(".nav__link");

function closeMenu() {
  navList?.classList.remove("is-open");
  navToggle?.setAttribute("aria-expanded", "false");
}
navToggle?.addEventListener("click", () => {
  const isOpen = navList.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});
navLinks.forEach(link => link.addEventListener("click", closeMenu));

// close on outside click (mobile)
document.addEventListener("click", (e) => {
  if (!navList?.classList.contains("is-open")) return;
  const inside = navList.contains(e.target) || navToggle?.contains(e.target);
  if (!inside) closeMenu();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
});

// Active nav on scroll
const sections = qsa("main section[id]");
if ("IntersectionObserver" in window) {
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute("id");
      navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${id}`));
    });
  }, { root: null, rootMargin: "-40% 0px -55% 0px", threshold: 0.01 });

  sections.forEach(sec => navObserver.observe(sec));
}

// Reveal on scroll
const revealEls = qsa(".reveal");
if (!prefersReduced && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => revealObserver.observe(el));
} else {
  revealEls.forEach(el => el.classList.add("is-visible"));
}

// Scroll progress bar
const scrollBar = qs("#scrollBar");
function updateScrollBar() {
  if (!scrollBar) return;
  const doc = document.documentElement;
  const scrollTop = doc.scrollTop || document.body.scrollTop;
  const scrollHeight = doc.scrollHeight - doc.clientHeight;
  const p = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  scrollBar.style.width = `${p}%`;
}
window.addEventListener("scroll", updateScrollBar, { passive: true });
updateScrollBar();

// Cursor glow (disable on touch)
const cursorGlow = qs("#cursorGlow");
const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
if (cursorGlow && !isTouch && !prefersReduced) {
  let gx = -999, gy = -999, tx = -999, ty = -999;

  window.addEventListener("mousemove", (e) => {
    tx = e.clientX - 130;
    ty = e.clientY - 130;
  }, { passive: true });

  function animateGlow() {
    gx += (tx - gx) * 0.12;
    gy += (ty - gy) * 0.12;
    cursorGlow.style.transform = `translate(${gx}px, ${gy}px)`;
    requestAnimationFrame(animateGlow);
  }
  requestAnimationFrame(animateGlow);
} else if (cursorGlow) {
  cursorGlow.style.display = "none";
}

// Spotlight hover (cards follow mouse)
function enableSpotlight() {
  const spotEls = qsa(".spotlight");
  spotEls.forEach(el => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
    });
  });
}
enableSpotlight();

// Ripple effect on buttons
function addRipple(e) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = `${size}px`;

  // keyboard clicks can have 0,0 — center it
  const cx = e.clientX || (rect.left + rect.width / 2);
  const cy = e.clientY || (rect.top + rect.height / 2);

  ripple.style.left = `${cx - rect.left - size / 2}px`;
  ripple.style.top = `${cy - rect.top - size / 2}px`;

  btn.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}
qsa(".btn").forEach(b => b.addEventListener("click", addRipple));

// Typewriter animated text (service-like words)
const typedEl = qs("#typedText");
const typedPhrases = ["video edits", "thumbnails", "social posts", "websites"];
function typewriter(el, phrases) {
  if (!el) return;
  if (prefersReduced) { el.textContent = phrases[0]; return; }

  let p = 0, i = 0, deleting = false;

  function tick() {
    const full = phrases[p];
    if (!deleting) {
      i++;
      el.textContent = full.slice(0, i);
      if (i >= full.length) {
        deleting = true;
        setTimeout(tick, 950);
        return;
      }
    } else {
      i--;
      el.textContent = full.slice(0, i);
      if (i <= 0) {
        deleting = false;
        p = (p + 1) % phrases.length;
      }
    }
    const speed = deleting ? 32 : 46;
    setTimeout(tick, speed);
  }
  tick();
}
typewriter(typedEl, typedPhrases);

// Counters
function animateCount(el, to, suffix = "") {
  if (!el) return;
  if (prefersReduced) { el.textContent = `${to}${suffix}`; return; }

  const duration = 900;
  const start = performance.now();
  function step(t) {
    const p = Math.min(1, (t - start) / duration);
    const v = Math.round(to * (0.12 + 0.88 * p));
    el.textContent = `${v}${suffix}`;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const statCards = qsa(".stat[data-count]");
if ("IntersectionObserver" in window) {
  const statObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const card = entry.target;
      const numEl = qs(".count", card);
      const to = Number(card.dataset.count || "0");
      const suffix = card.dataset.suffix || "";
      animateCount(numEl, to, suffix);
      statObs.unobserve(card);
    });
  }, { threshold: 0.35 });

  statCards.forEach(c => statObs.observe(c));
}

// Portfolio filtering (segmented)
const portfolioSection = qs(".portfolio");
const portfolioTabs = qsa('#portfolio .segmented__btn');
const works = qsa(".work");

portfolioTabs.forEach(btn => {
  btn.addEventListener("click", () => {
    portfolioTabs.forEach(b => { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
    btn.classList.add("is-active");
    btn.setAttribute("aria-selected", "true");

    const filter = btn.dataset.filter;
    works.forEach(card => {
      const show = filter === "all" || card.dataset.cat === filter;
      card.style.display = show ? "" : "none";
    });

    portfolioSection?.classList.remove("is-hovering");
    works.forEach(w => w.classList.remove("is-active"));
  });
});

// Pricing filtering (segmented)
const pricingSection = qs(".pricing");
const pricingTabs = qsa('#pricing .segmented__btn');
const pricingGroups = qsa(".pricing-group");

function showPricing(plan) {
  pricingGroups.forEach(g => {
    const match = g.dataset.planGroup === plan;
    g.hidden = !match;
  });

  pricingSection?.classList.remove("is-hovering");
  qsa(".price").forEach(p => p.classList.remove("is-active"));
}
pricingTabs.forEach(btn => {
  btn.addEventListener("click", () => {
    pricingTabs.forEach(b => { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
    btn.classList.add("is-active");
    btn.setAttribute("aria-selected", "true");
    showPricing(btn.dataset.plan);
  });
});
showPricing("video");

// Hover focus effect helper (pricing + portfolio)
function enableHoverFocus(sectionEl, itemSelector) {
  if (!sectionEl) return;
  const items = qsa(itemSelector, sectionEl);

  const activate = (item) => {
    sectionEl.classList.add("is-hovering");
    items.forEach(i => i.classList.toggle("is-active", i === item));
  };

  items.forEach(item => {
    item.addEventListener("pointerenter", () => activate(item));
    item.addEventListener("focus", () => activate(item));
  });

  sectionEl.addEventListener("pointerleave", () => {
    sectionEl.classList.remove("is-hovering");
    items.forEach(i => i.classList.remove("is-active"));
  });

  sectionEl.addEventListener("focusout", (e) => {
    if (!sectionEl.contains(e.relatedTarget)) {
      sectionEl.classList.remove("is-hovering");
      items.forEach(i => i.classList.remove("is-active"));
    }
  });
}
enableHoverFocus(pricingSection, ".price");
enableHoverFocus(portfolioSection, ".work");

// Portfolio modal
const modal = qs("#modal");
const modalBadge = qs("#modalBadge");
const modalTitle = qs("#modalTitle");
const modalSubtitle = qs("#modalSubtitle");
const modalDetails = qs("#modalDetails");

function openModalFromCard(card) {
  if (!modal) return;

  const cat = card.dataset.cat || "project";
  const title = card.dataset.title || "Project";
  const subtitle = card.dataset.subtitle || "";
  const details = card.dataset.details || "";

  const badgeMap = {
    video: "Video Editing",
    thumb: "Thumbnail Design",
    social: "Social Media Design",
    web: "Web Development"
  };

  modalBadge.textContent = badgeMap[cat] || "Project";
  modalTitle.textContent = title;
  modalSubtitle.textContent = subtitle;
  modalDetails.textContent = details;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

works.forEach(card => {
  card.addEventListener("click", () => openModalFromCard(card));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModalFromCard(card);
    }
  });
});

modal?.addEventListener("click", (e) => {
  const close = e.target?.dataset?.close === "true";
  if (close) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal?.classList.contains("is-open")) closeModal();
});

// Back to top
qs("#backToTop")?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
});

// Contact form (Formspree submit)
qs("#contactForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const submitBtn = qs('button[type="submit"]', form);
  submitBtn?.setAttribute("disabled", "true");

  const fd = new FormData(form);

  const name = String(fd.get("name") || "").trim();
  const email = String(fd.get("email") || "").trim();
  const service = String(fd.get("service") || "").trim();
  const message = String(fd.get("message") || "").trim();

  if (!name || !email || !service || !message) {
    showToast("Please fill in all fields.");
    submitBtn?.removeAttribute("disabled");
    return;
  }

  try {
    const res = await fetch(form.action, {
      method: "POST",
      body: fd,
      headers: { "Accept": "application/json" }
    });

    if (res.ok) {
      form.reset();
      showToast("Message sent! We'll get back to you ASAP.");
    } else {
      const data = await res.json().catch(() => null);
      const msg = data?.errors?.[0]?.message || "Something went wrong. Please try again.";
      showToast(msg);
    }
  } catch {
    showToast("Network error. Please try again.");
  } finally {
    submitBtn?.removeAttribute("disabled");
  }
});

// Reviews (LocalStorage)
const REV_KEY = "snappy_reviews_v3";
const reviewsList = qs("#reviewsList");

function loadReviews() {
  try {
    const raw = localStorage.getItem(REV_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveReviews(reviews) {
  localStorage.setItem(REV_KEY, JSON.stringify(reviews));
}
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function stars(n) {
  const x = Math.max(1, Math.min(5, Number(n) || 5));
  return "★".repeat(x) + "☆".repeat(5 - x);
}
function renderReviews() {
  const reviews = loadReviews();
  if (!reviewsList) return;

  if (reviews.length === 0) {
    reviewsList.innerHTML = `<p class="muted">No reviews yet. Be the first.</p>`;
    return;
  }

  const items = [...reviews].reverse().slice(0, 10);
  reviewsList.innerHTML = items.map(r => `
    <article class="review">
      <div class="review__top">
        <div>
          <div class="review__name">${escapeHtml(r.reviewer)}</div>
          <div class="review__service">${escapeHtml(r.service)} • <span class="muted">${escapeHtml(r.date)}</span></div>
        </div>
        <div class="badge badge--glow">${stars(r.rating)}</div>
      </div>
      <div class="review__text muted">${escapeHtml(r.text)}</div>
    </article>
  `).join("");
}
renderReviews();

qs("#reviewForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);

  const reviewer = String(fd.get("reviewer") || "").trim();
  const service = String(fd.get("service") || "").trim();
  const rating = Number(fd.get("rating") || 0);
  const text = String(fd.get("text") || "").trim();

  if (!reviewer || !service || !rating || !text) {
    showToast("Please fill in all review fields.");
    return;
  }

  const reviews = loadReviews();
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  reviews.push({ reviewer, service, rating, text, date });
  saveReviews(reviews);

  e.currentTarget.reset();
  renderReviews();
  showToast("Thanks! Your review was added.");
});

qs("#clearReviews")?.addEventListener("click", () => {
  localStorage.removeItem(REV_KEY);
  renderReviews();
  showToast("Reviews cleared.");
});
