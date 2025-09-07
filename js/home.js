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



// ===== Project-deck met JSON uit /recent/recent.json + desktop & mobile pijlen + swipe (mobile) =====
(function () {
  const viewport = document.getElementById('deck-viewport');
  const deck     = document.getElementById('deck');
  if (!viewport || !deck) return;

  // Twee sets pijlen: desktop (linkerkolom) en mobile (onder deck)
  const prevBtns = Array.from(document.querySelectorAll('.deck-nav .prev'));
  const nextBtns = Array.from(document.querySelectorAll('.deck-nav .next'));

  const mql = window.matchMedia('(max-width: 768px)');

  // -------- JSON laden uit /recent/recent.json ----------
  const JSON_CANDIDATES = [
    '../recent/recent.json',
    '/recent/recent.json'
  ];

  async function loadProjects() {
    for (const url of JSON_CANDIDATES) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const data = await res.json();
        if (!Array.isArray(data)) continue;

        // Sorteer op date (nieuwste eerst) en pak de 5 nieuwste
        const sorted = data
          .slice()
          .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
          .slice(0, 5);

        if (sorted.length) return sorted;
      } catch (_) {}
    }
    // Fallback als er nog geen JSON is
    return [
      { title: 'Project A', description: 'Voorbeeldtekst', images: ['../images/home_afbeelding.jpg','../images/home_afbeelding2.jpg'] },
      { title: 'Project B', description: 'Voorbeeldtekst', images: ['../images/home_afbeelding2.jpg','../images/home_afbeelding.jpg'] },
      { title: 'Project C', description: 'Voorbeeldtekst', images: ['../images/home_afbeelding.jpg','../images/home_afbeelding2.jpg'] },
      { title: 'Project D', description: 'Voorbeeldtekst', images: ['../images/home_afbeelding2.jpg','../images/home_afbeelding.jpg'] },
      { title: 'Project E', description: 'Voorbeeldtekst', images: ['../images/home_afbeelding.jpg','../images/home_afbeelding2.jpg'] }
    ];
  }

  function fixPath(p) {
    if (!p) return '../images/home_afbeelding.jpg';
    if (/^https?:\/\//i.test(p) || p.startsWith('/')) return p;
    // JSON gebruikt "images/…"; home staat in submap ⇒ '../' prefixen
    return '../' + p.replace(/^\.?\//, '');
  }

  // helpers voor sizing + truncation
  const num = (v, d=0) => {
    const n = parseFloat(String(v).replace('px',''));
    return Number.isFinite(n) ? n : d;
  };
  function getSizes() {
    const cs = getComputedStyle(deck);
    return {
      w:   num(cs.getPropertyValue('--card-w'), 290),
      h:   num(cs.getPropertyValue('--card-h'), 340),
      gap: num(cs.getPropertyValue('--card-gap'), 14),
    };
  }
  const truncateChars = (s='', max=30) => {
    const str = String(s);
    return str.length <= max ? str : str.slice(0, max) + '...';
  };

  let cards = [];
  let index = 0;     // eerste zichtbare

  function visibleCount() {
    // Desktop/Tablet: dynamisch aantal dat past; Mobile: 1 (voor pijl-disabling)
    if (mql.matches) return 1;
    const { w, gap } = getSizes();
    const vpw = viewport.clientWidth || 1;
    return Math.max(1, Math.min(5, Math.floor((vpw + gap) / (w + gap))));
  }

  // UNIFORME AFSTANDEN: elke kaart rechts staat exact (i-index)*(w+gap) verder.
  // Linker "stapel" schuift een beetje onder de eerste kaart.
  function applyTransforms() {
    const { w, h, gap } = getSizes();
    deck.style.height = h + 'px';

    const baseOffset = 0; // links starten (ook op mobile)

    cards.forEach((card, i) => {
      const rel = i - index; // 0 = eerste in beeld; 1 = tweede; <0 = links "onder" de stapel
      let x = 0, z = 100 + i, scale = 1, rot = 0;

      if (rel < 0) {
        // links (onder de stapel) — subtiel onder de stapel schuiven
        x = baseOffset - Math.min(36, (index - i) * 4);
        scale = 0.985;
        rot = -0.35;
        z = 60 + i;
      } else {
        // in beeld en rechts daarvan: vaste, gelijke afstanden
        x = baseOffset + rel * (w + gap);
      }

      card.style.transform = `translateX(${x}px) rotate(${rot}deg) scale(${scale})`;
      card.style.zIndex = z;
    });

    updateArrows();
  }

  function setDisabled(elList, disabled) {
    elList.forEach(el => el?.setAttribute('aria-disabled', disabled ? 'true' : 'false'));
  }

  function updateArrows() {
    const maxIndex = Math.max(0, cards.length - visibleCount());
    setDisabled(prevBtns, index <= 0);
    setDisabled(nextBtns, index >= maxIndex);
  }

  function centerTo(i) {
    const maxIndex = Math.max(0, cards.length - visibleCount());
    index = Math.max(0, Math.min(maxIndex, i));
    applyTransforms();
  }

  function escapeHTML(s) {
    return String(s ?? '').replace(/[&<>"']/g, m => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]
    ));
  }

  function renderDeck(projects) {
    deck.innerHTML = '';
    const frag = document.createDocumentFragment();

    projects.forEach((proj) => {
      const li = document.createElement('li');
      li.className = 'card';

      const main = fixPath(proj.images?.[0]);
      const alt  = proj.images?.[1] ? fixPath(proj.images[1]) : null;
      const title = escapeHTML(proj.title || 'Project');
      const desc  = escapeHTML(truncateChars(proj.description || '', 30));

      li.innerHTML = `
        <div class="card__img">
          <div class="card__frame">
            <img src="${main}" alt="${title}" data-main="${main}" ${alt ? `data-alt="${alt}"` : ''}/>
          </div>
        </div>
        <div class="card__body">
          <div class="card__title">${title}</div>
          <p class="card__desc">${desc}</p>
          <a class="card__discover" href="/projecten/">
            Ontdek
            <img class="card__arrow" src="../images/pijlgeel.png" alt="" aria-hidden="true" />
          </a>
        </div>
      `;

      // hover-swap alleen desktop (hover bestaat niet op mobile)
      const img = li.querySelector('img');
      if (alt && !mql.matches) {
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

  // --- Swipe (mobile) ---
  let dragging = false, startX = 0, lastX = 0;

  function onDown(e) {
    if (!mql.matches) return; // alleen mobile
    dragging = true;
    startX = (e.touches ? e.touches[0].clientX : e.clientX);
    lastX = startX;
    viewport.classList.add('grabbing');
  }
  function onMove(e) {
    if (!dragging) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX);
    lastX = x;
    e.preventDefault(); // we handelen swipe zelf af
  }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('grabbing');

    const dx = lastX - startX;
    const threshold = 50;

    if (dx < -threshold) {
      centerTo(index + 1);
    } else if (dx > threshold) {
      centerTo(index - 1);
    } else {
      applyTransforms(); // snap terug
    }
  }

  // Touch + (optioneel) pointer voor dev-test
  viewport.addEventListener('touchstart', onDown, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onUp);
  viewport.addEventListener('pointerdown', (e) => { if (mql.matches) onDown(e); });
  window.addEventListener('pointermove',  (e) => { if (mql.matches) onMove(e); });
  window.addEventListener('pointerup',    ()  => { if (mql.matches) onUp(); });

  // --- Pijl-klikhandlers voor beide sets ---
  prevBtns.forEach(btn => btn?.addEventListener('click', () => centerTo(index - 1)));
  nextBtns.forEach(btn => btn?.addEventListener('click', () => centerTo(index + 1)));

  // --- Init ---
  (async () => {
    const projects = await loadProjects();
    renderDeck(projects);
    centerTo(0); // start links
  })();

  // responsive
  const onResize = () => applyTransforms();
  if (mql.addEventListener) mql.addEventListener('change', onResize);
  else mql.addListener(onResize);
  window.addEventListener('resize', onResize);
})();
