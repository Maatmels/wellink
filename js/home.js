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


// Mobile: middelste kaart in beeld + nav-pijlen wisselen naar grijs aan randen
(function () {
  const track = document.querySelector('.inspiration__track');
  if (!track) return;
  const cards = Array.from(track.querySelectorAll('.cat-card'));
  const mql = window.matchMedia('(max-width: 768px)');

  const prevBtn = document.querySelector('.inspiration__nav .prev');
  const nextBtn = document.querySelector('.inspiration__nav .next');

  // (ongevaarlijk laten staan)
  cards.forEach(card => {
    const desc = card.querySelector('.cat-card__desc');
    const titleDef = card.querySelector('.cat-card__title-default');
    if (desc && titleDef) {
      desc.dataset.alt = titleDef.textContent.trim();
    }
  });

  function getCenteredIndex() {
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

  function updateNavState() {
    if (!(prevBtn && nextBtn)) return;
    // Randen bepalen op basis van scroll positie (tolerantie voor floats)
    const tol = 2;
    const atStart = track.scrollLeft <= tol;
    const maxLeft = track.scrollWidth - track.clientWidth;
    const atEnd = track.scrollLeft >= (maxLeft - tol);

    // Knoppen togglen + icon wissel
    toggleArrow(prevBtn, atStart);
    toggleArrow(nextBtn, atEnd);
  }

  function toggleArrow(btn, disabled) {
    btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    const img = btn.querySelector('.insp-nav__img');
    if (!img) return;
    const activeSrc = img.getAttribute('data-src-active');
    const disabledSrc = img.getAttribute('data-src-disabled');
    img.src = disabled ? disabledSrc : activeSrc;
  }

  function syncActive() {
    if (!mql.matches) { cards.forEach(c => c.classList.remove('is-active')); return; }
    const idx = getCenteredIndex();
    cards.forEach((c,i) => c.classList.toggle('is-active', i === idx));
    updateNavState();
  }

  // Scroll/resize
  track.addEventListener('scroll', () => requestAnimationFrame(syncActive), { passive: true });
  window.addEventListener('resize', () => requestAnimationFrame(syncActive));

  // INIT
  requestAnimationFrame(() => {
    if (mql.matches && cards[1]) {
      centerIndex(1, 'auto'); // start met middelste kaart
    }
    syncActive();
  });

  function handleMQChange(e) {
    if (e.matches) {
      requestAnimationFrame(() => {
        if (cards[1]) centerIndex(1, 'auto');
        syncActive();
      });
    } else {
      cards.forEach(c => c.classList.remove('is-active'));
    }
  }
  if (mql.addEventListener) mql.addEventListener('change', handleMQChange);
  else mql.addListener(handleMQChange);

  // NAV actions
  function scrollByCards(delta) {
    const current = getCenteredIndex();
    const target = Math.max(0, Math.min(cards.length - 1, current + delta));
    centerIndex(target, 'smooth');
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
