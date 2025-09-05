// Eenvoudige partial-loader
(function () {
  const mount = document.querySelector('#header-root');
  if (!mount) return;

  const url = mount.getAttribute('data-include');
  if (!url) return;

  fetch(url)
    .then(res => res.text())
    .then(html => {
      // vervang de placeholder door de echte header + overlay
      mount.outerHTML = html;
      // vertel de rest van de site dat partials klaar zijn
      document.dispatchEvent(new CustomEvent('partials:ready'));
    })
    .catch(err => console.error('Kon partial niet laden:', err));
})();


// ====== Eenvoudige partial-loader voor de header ======
// Laadt ../partials/header.html in de #header-root placeholder.
// Let op: werkt via http(s), niet via file:// . Start lokaal bijv. met `python3 -m http.server 5500`
(function () {
  const mount = document.querySelector('#header-root');
  if (!mount) return;

  const url = mount.getAttribute('data-include');
  if (!url) return;

  fetch(url)
    .then(res => res.text())
    .then(html => {
      mount.outerHTML = html; // vervang placeholder door echte header
      document.dispatchEvent(new CustomEvent('partials:ready'));
    })
    .catch(err => console.error('Kon partial niet laden:', err));
})();


// Mobile: snap naar midden + pijlen direct grijs als uiterste kaart actief is + smooth crossfade
(function () {
  const track = document.querySelector('.inspiration__track');
  if (!track) return;
  const cards = Array.from(track.querySelectorAll('.cat-card'));
  const mql = window.matchMedia('(max-width: 768px)');

  const prevBtn = document.querySelector('.inspiration__nav .prev');
  const nextBtn = document.querySelector('.inspiration__nav .next');

  // data-alt (laten staan, onschuldig)
  cards.forEach(card => {
    const desc = card.querySelector('.cat-card__desc');
    const titleDef = card.querySelector('.cat-card__title-default');
    if (desc && titleDef) {
      desc.dataset.alt = titleDef.textContent.trim();
    }
  });

  // Injecteer grijze laag voor crossfade (HTML blijft gelijk)
  [prevBtn, nextBtn].forEach(btn => {
    if (!btn) return;
    const base = btn.querySelector('.insp-nav__img');
    if (!base) return;
    base.classList.add('insp-nav__img', 'is-active-layer');
    const disabledSrc = base.getAttribute('data-src-disabled');
    if (!disabledSrc) return;

    const gray = new Image();
    gray.src = disabledSrc;       // preload grijs
    gray.alt = '';
    gray.setAttribute('aria-hidden', 'true');
    gray.className = 'insp-nav__img is-disabled-layer';
    btn.appendChild(gray);
  });

  function getCenteredIndex() {
    // meest centraal in de viewport
    const center = track.scrollLeft + track.clientWidth / 2;
    let iBest = 0, dBest = Infinity;
    cards.forEach((c, i) => {
      const mid = c.offsetLeft + c.clientWidth / 2;
      const d = Math.abs(mid - center);
      if (d < dBest) { dBest = d; iBest = i; }
    });
    return iBest;
  }

  function centerIndex(i, behavior = 'auto') {
    const card = cards[i];
    if (!card) return;
    const left = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2;
    track.scrollTo({ left, behavior });
  }

  // Pijlen direct updaten o.b.v. de "actieve" index (de kaart die geanimeerd is)
  function setNavStateByIndex(idx) {
    const atStart = idx <= 0;
    const atEnd = idx >= cards.length - 1;
    toggleBtn(prevBtn, atStart);
    toggleBtn(nextBtn, atEnd);
  }

  // Fallback/correctie o.b.v. echte scrollpositie (bij handmatig slepen)
  function updateNavState() {
    if (!(prevBtn && nextBtn)) return;
    const tol = 2;
    const atStart = track.scrollLeft <= tol;
    const maxLeft = track.scrollWidth - track.clientWidth;
    const atEnd = track.scrollLeft >= (maxLeft - tol);
    toggleBtn(prevBtn, atStart);
    toggleBtn(nextBtn, atEnd);
  }

  function toggleBtn(btn, disabled) {
    if (!btn) return;
    btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    // crossfade gebeurt via CSS op basis van aria-disabled
  }

  function syncActive() {
    if (!mql.matches) { cards.forEach(c => c.classList.remove('is-active')); return; }
    const idx = getCenteredIndex();
    cards.forEach((c,i) => c.classList.toggle('is-active', i === idx));
    // pijlen meteen goed zetten wanneer de "actieve" (geanimeerde) kaart wijzigt
    setNavStateByIndex(idx);
  }

  // Scroll/resize → active kaart = die het meest in het MIDDEN staat (snap is aan)
  track.addEventListener('scroll', () => requestAnimationFrame(syncActive), { passive: true });
  window.addEventListener('resize', () => requestAnimationFrame(syncActive));

  // INIT: start in het midden (kaart 2) en zet pijlen direct goed
  requestAnimationFrame(() => {
    if (mql.matches && cards[1]) {
      centerIndex(1, 'auto');  // centreren op card 2
      setNavStateByIndex(1);   // pijlen meteen juiste staat
    }
    syncActive();
  });

  function handleMQChange(e) {
    if (e.matches) {
      requestAnimationFrame(() => {
        if (cards[1]) {
          centerIndex(1, 'auto');
          setNavStateByIndex(1);
        }
        syncActive();
      });
    } else {
      cards.forEach(c => c.classList.remove('is-active'));
    }
  }
  if (mql.addEventListener) mql.addEventListener('change', handleMQChange);
  else mql.addListener(handleMQChange);

  // NAV actions: pijlen meteen grijs indien target de rand is, nog vóór de scroll klaar is
  function scrollByCards(delta) {
    const current = getCenteredIndex();
    const target = Math.max(0, Math.min(cards.length - 1, current + delta));
    setNavStateByIndex(target);       // direct visueel updaten (zwart↔grijs)
    centerIndex(target, 'smooth');    // smooth naar de target
    setTimeout(() => syncActive(), 90);
  }
  if (prevBtn) prevBtn.addEventListener('click', () => { if (mql.matches) scrollByCards(-1); });
  if (nextBtn) nextBtn.addEventListener('click', () => { if (mql.matches) scrollByCards(1); });
})();


(function () {
  const loader = document.getElementById('page-loader');
  if (!loader) return;

  function hideLoader() {
    loader.classList.add('fade-out');

    // trigger CSS fade
    document.documentElement.classList.add('page-loaded');

    // luister naar transitionend ipv vaste timeout
    loader.addEventListener('transitionend', () => {
      if (loader && loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
    }, { once: true });
  }

  if (document.readyState === 'complete') {
    hideLoader();
  } else {
    window.addEventListener('load', hideLoader, { once: true });
  }
})();





/*
  Progress:
  --p = clamp((viewportCenter - cardTop) / cardHeight, 0..1)  → rand kleurt geel van bovenaf
  is-passed = centerY >= card.bottom                          → hele blok geel
*/
(function () {
  const card = document.getElementById('about-card');
  if (!card) return;

  function update() {
    const r = card.getBoundingClientRect();
    const centerY = window.innerHeight / 2;

    const h = r.height || 1;
    const raw = (centerY - r.top) / h;
    const p = Math.max(0, Math.min(1, raw));
    card.style.setProperty('--p', p.toFixed(4));

    const fullyPassed = centerY >= r.bottom - 0.5;
    card.classList.toggle('is-passed', fullyPassed);
  }

  const raf = () => requestAnimationFrame(update);
  window.addEventListener('scroll', raf, { passive: true });
  window.addEventListener('resize', raf);
  document.addEventListener('DOMContentLoaded', update);
  update();
})();



// ====== Google Reviews infrastructuur + mock fallback + infinite loop ======

const GOOGLE_CONFIG = {
  USE_MOCK: true,            // ← zet op false zodra je een server/proxy hebt
  PLACE_ID: "",              // ← jouw Google Place ID
  API_KEY: "",               // ← jouw server-side key (NIET client-side!)
  ENDPOINT: "/api/google-reviews" // ← jouw eigen proxy endpoint (aanbevolen)
};

// Mock data (je kunt hier makkelijk .5 ratings testen)
const MOCK_REVIEWS = [
  { name: "Eva de Jong",    rating: 1,   text: "Niet tevreden over de communicatie. Planning liep uit en ik werd daar laat over geïnformeerd.", avatar: "../images/wellink.jpeg" },
  { name: "Tom van Leeuwen",rating: 2.5, text: "Eindresultaat oké, maar montage duurde langer dan verwacht en er lag rommel op de oprit.",       avatar: "../images/wellink.jpeg" },
  { name: "Lara Bos",       rating: 3,   text: "Gemiddelde ervaring: prijs in orde, afwerking kon netter. Service was wel vriendelijk.",         avatar: "../images/wellink.jpeg" },
  { name: "Ruben Kuipers",  rating: 4,   text: "Mooie kozijnen en strak geplaatst. Eén detail is later netjes hersteld. Zou ze aanraden.",       avatar: "../images/wellink.jpeg" },
  { name: "Anouk Visser",   rating: 5,   text: "Super service! Heldere offerte, snelle levering en prachtig eindresultaat. Aanrader!",            avatar: "../images/wellink.jpeg" }
];

// Helpers
function truncateWords(str, maxWords) {
  const words = String(str).trim().split(/\s+/);
  return words.length <= maxWords ? str : words.slice(0, maxWords).join(" ") + "…";
}

// Render sterren inclusief halve ster (images/sterhalf.png)
function starImgs(rating) {
  const r = Math.max(0, Math.min(5, Math.round((rating || 0) * 2) / 2)); // naar dichtstbijzijnde 0.5
  const full = Math.floor(r);
  const half = (r - full) === 0.5 ? 1 : 0;

  let html = "";
  for (let i = 0; i < full; i++) {
    html += `<img src="../images/ster.png" alt="" aria-hidden="true">`;
  }
  if (half) {
    html += `<img src="../images/sterhalf.png" alt="" aria-hidden="true">`;
  }
  return html;
}

function buildCardHTML(r) {
  const truncated = truncateWords(r.text || "", 24);
  return `
    <li class="review-card">
      <header class="review-head">
        <img class="review-avatar" src="${r.avatar || '../images/wellink.jpeg'}" alt="" aria-hidden="true" />
        <div class="review-meta">
          <div class="review-name">${r.name || "Anonieme klant"}</div>
          <div class="review-stars" aria-label="${(r.rating||0)} van 5 sterren">
            ${starImgs(r.rating || 0)}
          </div>
        </div>
      </header>
      <p class="review-text" title="${(r.text || "").replace(/"/g, "&quot;")}">
        ${truncated}
      </p>
    </li>
  `;
}

// Render + infinite loop setup
function renderReviews(list) {
  const track = document.getElementById("reviews-row");
  if (!track) return;

  const itemsHTML = list.map(buildCardHTML).join("");
  track.innerHTML = itemsHTML + itemsHTML; // dupliceren voor naadloze loop

  // Langzamer maken: verhoog tijd per kaart
  const secondsPerCard = 5.5; // was ~3.5 → nu trager
  const duration = (list.length * secondsPerCard).toFixed(2) + "s";
  track.style.setProperty("--reviews-duration", duration);

  // Reduce motion respecteren
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    track.style.animation = "none";
  }
}

// (Optioneel) Google fetch via proxy
async function loadGoogleReviewsViaProxy() {
  const res = await fetch(`${GOOGLE_CONFIG.ENDPOINT}?place_id=${encodeURIComponent(GOOGLE_CONFIG.PLACE_ID)}`, {
    method: "GET",
    headers: { "Accept": "application/json" }
  });
  if (!res.ok) throw new Error("Google reviews fetch failed");
  return await res.json(); // verwacht [{name, rating, text, avatar}, ...]
}

// Boot
(async function initReviews() {
  try {
    let reviews = MOCK_REVIEWS;
    if (!GOOGLE_CONFIG.USE_MOCK && GOOGLE_CONFIG.PLACE_ID) {
      try {
        reviews = await loadGoogleReviewsViaProxy();
      } catch (e) {
        console.warn("Valt terug op MOCK_REVIEWS wegens fout:", e);
        reviews = MOCK_REVIEWS;
      }
    }
    renderReviews(reviews);
  } catch (err) {
    console.error(err);
  }
})();



// ===== Recente projecten (home) via /Recent/recent.json (statisch), met fallback =====
(function () {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  function truncateWords(str, max = 8) {
    const words = String(str || '').trim().split(/\s+/);
    return words.length <= max ? str : words.slice(0, max).join(' ') + '…';
  }

  function render(items) {
    const two = items.slice(0, 2);
    grid.innerHTML = two.map(item => {
      const href = '/projecten/';
      const title = item.title || 'Project';
      const desc  = truncateWords(item.description || '', 8);
      const img1  = (item.images && item.images[0]) || '../images/home_afbeelding.jpg';
      const img2  = (item.images && item.images[1]) || img1;

      return `
        <li class="proj-card">
          <a class="proj-link" href="${href}">
            <figure class="proj-media">
              <img class="img-primary"   src="${img1}" alt="${title}" loading="lazy">
              <img class="img-secondary" src="${img2}" alt="${title}" loading="lazy" aria-hidden="true">
            </figure>
            <div class="proj-title">${title}</div>
            <p class="proj-desc">${desc}</p>
          </a>
        </li>
      `;
    }).join('');
  }

  function sortNewestFirst(list) {
    // Als items een 'date' veld hebben → sorteer daarop (nieuwste eerst).
    // Anders laten we de JSON-volgorde in stand.
    if (!Array.isArray(list)) return [];
    if (list.length && list[0].date) {
      return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return list;
  }

  async function load() {
    try {
      const res = await fetch('/Recent/recent.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('recent.json niet gevonden');
      const data = await res.json();
      const sorted = sortNewestFirst(data);
      render(sorted);
    } catch {
      // Fallback als recent.json nog niet bestaat
      render([
        {
          title: 'Renovatie aluminium kozijnen',
          description: 'Strakke afwerking met hoge isolatiewaarde',
          images: ['../images/home_afbeelding.jpg', '../images/home_afbeelding2.jpg']
        },
        {
          title: 'Kunststof schuifpui geplaatst',
          description: 'Vlotte montage en nette afwerking bij tussenwoning',
          images: ['../images/home_afbeelding2.jpg', '../images/home_afbeelding.jpg']
        }
      ]);
    }
  }

  load();
})();

// ===== Project-deck met JSON uit /Recent + arrows (desktop) + swipe (mobile) =====
(function () {
  const viewport = document.getElementById('deck-viewport');
  const deck     = document.getElementById('deck');
  if (!viewport || !deck) return;

  const prevBtn = document.querySelector('.deck-nav .prev');
  const nextBtn = document.querySelector('.deck-nav .next');

  const mql = window.matchMedia('(max-width: 768px)');

  // -------- JSON laden uit /Recent ----------
  const JSON_CANDIDATES = [
    '/Recent/projects.json',
    '/Recent/index.json',
    '../Recent/projects.json',
    '../Recent/index.json'
  ];

  async function loadProjects() {
    for (const url of JSON_CANDIDATES) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length) return data;
        }
      } catch (_) {}
    }
    // fallback als er nog geen JSON is
    return [
      { title: 'Project A', images: ['../images/home_afbeelding.jpg','../images/home_afbeelding2.jpg'] },
      { title: 'Project B', images: ['../images/home_afbeelding2.jpg','../images/home_afbeelding.jpg'] },
      { title: 'Project C', images: ['../images/home_afbeelding.jpg','../images/home_afbeelding2.jpg'] },
      { title: 'Project D', images: ['../images/home_afbeelding2.jpg','../images/home_afbeelding.jpg'] },
      { title: 'Project E', images: ['../images/home_afbeelding.jpg','../images/home_afbeelding2.jpg'] }
    ];
  }

  function num(v) { return parseFloat(String(v).replace('px','')); }
  function getSizes() {
    const cs = getComputedStyle(deck);
    return {
      w: num(cs.getPropertyValue('--card-w')),
      h: num(cs.getPropertyValue('--card-h')),
      gap: num(cs.getPropertyValue('--card-gap')),
      vpw: viewport.clientWidth
    };
  }

  let cards = [];
  let index = 0;     // eerste zichtbare
  let visible = 2;   // wordt dynamisch bepaald

  function computeVisible() {
  // Desktop/Tablet: dynamisch aantal dat past; Mobile: altijd 1 kaart
  if (mql.matches) return 1;
  const { w, gap, vpw } = getSizes();
  return Math.max(1, Math.min(5, Math.floor((vpw + gap) / (w + gap))));
}

function applyTransforms() {
  const { w, h, gap, vpw } = getSizes();
  deck.style.height = h + 'px';

  // Mobile: 1 kaart, gecentreerd. Desktop: links uitlijnen.
  const isMobile = mql.matches;
  visible = computeVisible();

  // Groepsbreedte voor desktop (info); op mobile gebruiken we w.
  const groupWidth = visible * w + (visible - 1) * gap;

  // Basis-offset:
  // - Desktop: links starten (0)
  // - Mobile: eerste kaart netjes centreren
  const baseOffset = isMobile ? Math.max(0, (vpw - w) / 2) : 0;

  cards.forEach((card, i) => {
    const rel = i - index; // 0..visible-1 = in beeld; <0 = links/onder; >=visible = rechts buiten
    let x = 0, z = 100 + i, scale = 1, rot = 0;

    if (rel < 0) {
      // links (onder de stapel) — subtiel onder de stapel schuiven
      x = baseOffset - Math.min(36, (index - i) * 4);
      scale = 0.985;
      rot = -0.35;
      z = 60 + i;
    } else if (rel >= 0 && rel < visible) {
      // in beeld
      x = baseOffset + rel * (w + gap);
      scale = 1;
      rot = 0;
    } else {
      // rechts buiten beeld
      x = baseOffset + (visible * (w + gap)) + 60;
      z = 100 + i;
    }

    card.style.transform = `translateX(${x}px) rotate(${rot}deg) scale(${scale})`;
    card.style.zIndex = z;
  });

  updateArrows();
}


  function updateArrows() {
    if (!prevBtn || !nextBtn) return;
    const maxIndex = Math.max(0, cards.length - visible);

    const atStart = index <= 0;
    const atEnd   = index >= maxIndex;

    prevBtn.setAttribute('aria-disabled', atStart ? 'true' : 'false');
    nextBtn.setAttribute('aria-disabled', atEnd   ? 'true' : 'false');
  }

  function centerTo(i) {
    const maxIndex = Math.max(0, cards.length - visible);
    index = Math.max(0, Math.min(maxIndex, i));
    applyTransforms();
  }

  function renderDeck(projects) {
    deck.innerHTML = '';
    const five = ensureFive(projects);
    const frag = document.createDocumentFragment();

    five.forEach((proj, i) => {
      const li = document.createElement('li');
      li.className = 'card';

      // hoofdfoto + altfoto voor hover (als aanwezig)
      const main = (proj.images && proj.images[0]) || '../images/home_afbeelding.jpg';
      const alt  = (proj.images && proj.images[1]) || null;

      li.innerHTML = `
        <div class="card__img">
          <img src="${main}" alt="${escapeHTML(proj.title || 'Project')}" data-main="${main}" ${alt ? `data-alt="${alt}"` : ''}/>
        </div>
        <div class="card__body">
          <div class="card__title">${escapeHTML(proj.title || 'Project')}</div>
          <a class="card__discover" href="/projecten/">
            Ontdek
            <img class="card__arrow" src="../images/pijlgeel.png" alt="" aria-hidden="true" />
          </a>
        </div>
      `;

      // hover: wissel naar alt (alleen desktop is hover bruikbaar)
      const img = li.querySelector('img');
      if (alt) {
        li.addEventListener('mouseenter', () => { img.src = alt; }, { passive: true });
        li.addEventListener('mouseleave', () => { img.src = main; }, { passive: true });
      }

      // klik overal → projecten
      li.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (!a) window.location.href = '/projecten/';
      });

      frag.appendChild(li);
    });

    deck.appendChild(frag);
    cards = Array.from(deck.querySelectorAll('.card'));
  }

  function ensureFive(arr) {
    const out = arr.slice(0, 5);
    while (out.length < 5 && arr.length) {
      out.push(arr[out.length % arr.length]);
    }
    // als arr leeg is (kan bijna niet), vul placeholders
    while (out.length < 5) {
      out.push({ title: 'Project', images: ['../images/home_afbeelding.jpg','../images/home_afbeelding2.jpg'] });
    }
    return out;
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, m => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]
    ));
  }

  // --- Swipe (alleen mobile) ---
  let dragging = false, startX = 0, lastX = 0, moved = 0;

  function onDown(e) {
    if (!mql.matches) return; // alleen mobile
    dragging = true;
    moved = 0;
    startX = (e.touches ? e.touches[0].clientX : e.clientX);
    lastX = startX;
    viewport.classList.add('grabbing');
  }
  function onMove(e) {
    if (!dragging) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX);
    const dx = x - lastX;
    moved += Math.abs(dx);
    lastX = x;
    e.preventDefault();
  }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('grabbing');

    const dxTotal = lastX - startX;
    const threshold = 50;

    const maxIndex = Math.max(0, cards.length - visible);
    if (dxTotal < -threshold && index < maxIndex) {
      centerTo(index + 1);
    } else if (dxTotal > threshold && index > 0) {
      centerTo(index - 1);
    } else {
      applyTransforms(); // snap terug
    }
  }

  viewport.addEventListener('touchstart', onDown, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onUp);

  // --- Arrows (desktop) ---
  prevBtn?.addEventListener('click', () => centerTo(index - 1));
  nextBtn?.addEventListener('click', () => centerTo(index + 1));

  // --- Init ---
  (async () => {
    const projects = await loadProjects();
    renderDeck(projects);
    // startpositie: meest linkse zichtbare = 0
    // (groep staat rechts in viewport dankzij baseOffset-berekening)
    centerTo(0);
  })();

  // responsive
  const onResize = () => applyTransforms();
  if (mql.addEventListener) mql.addEventListener('change', onResize);
  else mql.addListener(onResize);
  window.addEventListener('resize', onResize);
})();
