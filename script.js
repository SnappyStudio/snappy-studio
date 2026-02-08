// script.js
const qs = (s, el = document) => el.querySelector(s);
const qsa = (s, el = document) => [...el.querySelectorAll(s)];

const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

// Sticky heights -> CSS vars
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
  syncStickyHeights._t = setTimeout(syncStickyHeights, 120);
});
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

// Mobile menu (overlay + scroll lock)
const navToggle = qs(".nav__toggle");
const navList = qs("#navList");
const navOverlay = qs(".nav__overlay");
const navLinks = qsa(".nav__link");

function openMenu() {
  if (!navList) return;
  navList.classList.add("is-open");
  navOverlay?.removeAttribute("hidden");
  navToggle?.setAttribute("aria-expanded", "true");
  navToggle?.setAttribute("aria-label", "Close menu");
  document.body.classList.add("nav-open");
}
function closeMenu() {
  navList?.classList.remove("is-open");
  navOverlay?.setAttribute("hidden", "true");
  navToggle?.setAttribute("aria-expanded", "false");
  navToggle?.setAttribute("aria-label", "Open menu");
  document.body.classList.remove("nav-open");
}

navToggle?.addEventListener("click", () => {
  const isOpen = navList?.classList.contains("is-open");
  isOpen ? closeMenu() : openMenu();
});
navOverlay?.addEventListener("click", closeMenu);
navLinks.forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
window.addEventListener("resize", () => { if (window.innerWidth > 980) closeMenu(); });

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
qsa(".spotlight").forEach(el => {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
  });
});

// Ripple effect on buttons
function addRipple(e) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = `${size}px`;

  const cx = e.clientX || (rect.left + rect.width / 2);
  const cy = e.clientY || (rect.top + rect.height / 2);
  ripple.style.left = `${cx - rect.left - size / 2}px`;
  ripple.style.top = `${cy - rect.top - size / 2}px`;

  btn.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}
qsa(".btn").forEach(b => b.addEventListener("click", addRipple));

// Typewriter text (no wrap: NBSP)
const typedEl = qs("#typedText");
const typedPhrases = [
  "video\u00A0edits",
  "thumbnails",
  "social\u00A0posts",
  "websites"
];

function typewriter(el, phrases) {
  if (!el) return;
  if (prefersReduced) { el.textContent = phrases[0].replaceAll("\u00A0", " "); return; }

  // MODIFICATION: Removed minWidth setting so caret follows text
  // el.style.minWidth = ...

  let p = 0, i = 0, deleting = false;

  function tick() {
    const full = phrases[p];
    if (!deleting) {
      i++;
      el.textContent = full.slice(0, i);
      if (i >= full.length) {
        deleting = true;
        setTimeout(tick, 900);
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
    setTimeout(tick, deleting ? 32 : 46);
  }
  tick();
}
typewriter(typedEl, typedPhrases);

// Portfolio filtering
const portfolioTabs = qsa('#portfolio [data-filter]');
const works = qsa("#portfolioGrid .work");

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
  });
});

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

qsa('#portfolioGrid [data-modal="true"]').forEach(card => {
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

// Pricing selectors (category + sub)
const catBtns = qsa('[data-price-cat-btn]');
const subBars = qsa('[data-subbar-for]');
const subBtnSelector = '[data-price-sub-btn]';
const groups = qsa('.pricing-group[data-price-cat][data-price-sub]');

const priceState = {
  cat: "video",
  sub: { video: "long", design: "thumb", web: "landing" }
};

function showSubBar(cat) {
  subBars.forEach(bar => {
    const show = bar.dataset.subbarFor === cat;
    bar.hidden = !show;
    bar.style.display = show ? "" : "none"; // extra-safe
  });
}

function showPricing(cat, sub) {
  groups.forEach(g => {
    const ok = g.dataset.priceCat === cat && g.dataset.priceSub === sub;
    g.hidden = !ok;
    g.style.display = ok ? "" : "none"; // extra-safe
  });
}

function setActive(btns, activeBtn, attr = "aria-selected") {
  btns.forEach(b => {
    const isActive = b === activeBtn;
    b.classList.toggle("is-active", isActive);
    b.setAttribute(attr, String(isActive));
  });
}

function activateCategory(cat) {
  priceState.cat = cat;
  showSubBar(cat);

  const activeCatBtn = catBtns.find(b => b.dataset.priceCatBtn === cat);
  if (activeCatBtn) setActive(catBtns, activeCatBtn);

  const bar = qs(`[data-subbar-for="${cat}"]`);
  if (!bar) return;

  const sub = priceState.sub[cat] || qsa(subBtnSelector, bar)[0]?.dataset.priceSubBtn;
  const subBtns = qsa(subBtnSelector, bar);
  const activeSubBtn = subBtns.find(b => b.dataset.priceSubBtn === sub) || subBtns[0];

  if (activeSubBtn) {
    priceState.sub[cat] = activeSubBtn.dataset.priceSubBtn;
    setActive(subBtns, activeSubBtn);
  }

  showPricing(cat, priceState.sub[cat]);
}

catBtns.forEach(btn => {
  btn.addEventListener("click", () => activateCategory(btn.dataset.priceCatBtn));
});

subBars.forEach(bar => {
  qsa(subBtnSelector, bar).forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = bar.dataset.subbarFor;
      priceState.sub[cat] = btn.dataset.priceSubBtn;
      setActive(qsa(subBtnSelector, bar), btn);
      showPricing(cat, priceState.sub[cat]);
    });
  });
});

activateCategory("video");

// Contact service selector (Nested: Category -> Sub-service)
const serviceInput = qs("#serviceInput");
const contactCatBtns = qsa('[data-contact-cat]');
const contactSubContainers = qsa('[data-contact-sub-for]');

function setContactService(value) {
    if (!serviceInput) return;
    serviceInput.value = value;
}

function activateContactCategory(cat) {
    // 1. Highlight Category Button
    contactCatBtns.forEach(btn => {
        const isActive = btn.dataset.contactCat === cat;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-selected", String(isActive));
    });

    // 2. Show Sub-options
    contactSubContainers.forEach(con => {
        const isMatch = con.dataset.contactSubFor === cat;
        con.hidden = !isMatch;
        con.style.display = isMatch ? "" : "none";
        
        // Auto-select first option if none selected in this group?
        // Or just let user click. Let's select the first one visually to indicate default.
        if (isMatch) {
             const subBtns = qsa('[data-service-btn]', con);
             const active = subBtns.find(b => b.classList.contains('is-active'));
             if (!active && subBtns.length > 0) {
                 // Trigger click on first one
                 subBtns[0].click();
             }
        }
    });
}

// Bind Category Clicks
contactCatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        activateContactCategory(btn.dataset.contactCat);
    });
});

// Bind Sub-service Clicks (global delegation or specific)
contactSubContainers.forEach(con => {
    const btns = qsa('[data-service-btn]', con);
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Deselect all sub buttons in ALL containers? Or just this one?
            // "Select a service" implies only one.
            qsa('[data-service-btn]').forEach(b => {
                b.classList.remove('is-active');
                b.setAttribute('aria-checked', 'false');
            });

            btn.classList.add('is-active');
            btn.setAttribute('aria-checked', 'true');
            setContactService(btn.dataset.serviceBtn);
        });
    });
});

// Initialize Contact Form (Default to Video)
activateContactCategory('video');

// Pricing choose buttons -> auto-fill contact service
qsa("[data-choose-package]").forEach(btn => {
  btn.addEventListener("click", () => {
    const service = btn.dataset.service || "";
    if (!service) return;

    // Detect category
    let cat = "video";
    if (service.toLowerCase().includes("thumbnail")) cat = "design";
    else if (service.toLowerCase().includes("social")) cat = "design";
    else if (service.toLowerCase().includes("web")) cat = "web";
    
    // Switch to that category in form
    activateContactCategory(cat);

    // Find the specific button if it matches roughly?
    // The pricing services are like "Video Editing - Long Form (Starter)"
    // The contact buttons are "Long-Form Video", "Short-Form Video".
    // We can just set the hidden input directly if no exact button match.
    setContactService(service);

    // Also highlight the closest match button if possible
    const s = service.toLowerCase();
    const subBtns = qsa('[data-service-btn]');
    let matchedBtn = null;
    
    // Fuzzy match logic
    if (s.includes("long-form")) matchedBtn = subBtns.find(b => b.dataset.serviceBtn === "Long-Form Video");
    else if (s.includes("short-form")) matchedBtn = subBtns.find(b => b.dataset.serviceBtn === "Short-Form Video");
    else if (s.includes("thumbnail")) matchedBtn = subBtns.find(b => b.dataset.serviceBtn === "Thumbnail Design");
    else if (s.includes("social")) matchedBtn = subBtns.find(b => b.dataset.serviceBtn === "Social Media Design");
    else if (s.includes("landing")) matchedBtn = subBtns.find(b => b.dataset.serviceBtn === "Landing Page");
    else if (s.includes("shop")) matchedBtn = subBtns.find(b => b.dataset.serviceBtn === "Shop Page");
    else if (s.includes("custom")) matchedBtn = subBtns.find(b => b.dataset.serviceBtn === "Custom Website");
    
    if (matchedBtn) {
        // Deselect others
        qsa('[data-service-btn]').forEach(b => b.classList.remove('is-active'));
        matchedBtn.classList.add('is-active');
    }

    // hint
    const form = qs("#contactForm");
    const msg = qs('textarea[name="message"]', form);
    if (msg && !msg.value.trim()) {
      msg.value = `Hi! I’m interested in: ${service}\n\nDeadline:\nReferences:\nGoals:`;
    }
  });
});

// Back to top
qs("#backToTop")?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
});

// Contact form (Formspree)
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
    const res = await fetch(form.action, { method: "POST", body: fd, headers: { "Accept": "application/json" } });
    if (res.ok) {
      form.reset();
      activateContactCategory("video");
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
(() => {
  const PROMOS = [
    { code: "XMAS15", from: "2026-12-22", to: "2026-12-29" },
    { code: "EASTER10", from: "2026-04-10", to: "2026-04-17" }, // schimbă anual
  ];

  const TZ = "Europe/Bucharest";
  const input = document.querySelector("#discountCode");
  if (!input) return;

  const form = input.closest("form");

  // wrap input (no HTML edits needed)
  let wrap = input.closest(".discount-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "discount-wrap";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
  }

  function normalize(v) {
    return (v || "").trim().toUpperCase();
  }

  // doar data în TZ (YYYY-MM-DD) => comparație corectă pe interval
  function tzDateISO(tz) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }

  function setState(state) {
    wrap.classList.remove("is-valid", "is-invalid");
    if (state === "valid") wrap.classList.add("is-valid");
    if (state === "invalid") wrap.classList.add("is-invalid");

    input.setAttribute("aria-invalid", state === "invalid" ? "true" : "false");
  }

  function validate({ clearOnFail = true } = {}) {
    const code = normalize(input.value);

    if (!code) {
      setState("reset");
      return true;
    }

    const promo = PROMOS.find(p => p.code === code);
    if (!promo) {
      setState("invalid");
      if (clearOnFail) input.value = "";
      return false;
    }

    const today = tzDateISO(TZ); // YYYY-MM-DD
    if (today < promo.from || today > promo.to) {
      setState("invalid");
      if (clearOnFail) input.value = "";
      return false;
    }

    setState("valid");
    return true;
  }

  // live feedback while typing (nu șterge)
  input.addEventListener("input", () => validate({ clearOnFail: false }));

  // validate on blur + Enter (șterge dacă e invalid)
  input.addEventListener("blur", () => validate({ clearOnFail: true }));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") validate({ clearOnFail: true });
  });

  // block submit if invalid
  if (form) {
    form.addEventListener("submit", (e) => {
      const ok = validate({ clearOnFail: true });
      if (!ok) {
        e.preventDefault();
        input.focus();
      }
    });
  }
})();