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

