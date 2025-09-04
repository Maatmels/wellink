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


// Vul data-alt op de beschrijving met de titeltekst + markeer middelste card op mobile
(function () {
  const track = document.querySelector('.inspiration__track');
  if (!track) return;
  const cards = Array.from(track.querySelectorAll('.cat-card'));
  const mql = window.matchMedia('(max-width: 768px)');

  // 1) data-alt zetten voor eventuele toekomstige swaps (ongevaarlijk)
  cards.forEach(card => {
    const desc = card.querySelector('.cat-card__desc');
    const titleDef = card.querySelector('.cat-card__title-default');
    if (desc && titleDef) {
      desc.dataset.alt = titleDef.textContent.trim();
    }
  });

  // Hulpfuncties
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

  function centerIndex(i) {
    const card = cards[i];
    if (!card) return;
    const left = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2;
    // direct centreren (geen animatie bij eerste load)
    track.scrollTo({ left, behavior: 'auto' });
  }

  function syncActive() {
    if (!mql.matches) { cards.forEach(c => c.classList.remove('is-active')); return; }
    const idx = getCenteredIndex();
    cards.forEach((c,i) => c.classList.toggle('is-active', i === idx));
  }

  // Scroll/resize -> active kaart = die het meest in het midden staat (alleen mobile)
  track.addEventListener('scroll', () => requestAnimationFrame(syncActive), { passive: true });
  window.addEventListener('resize', () => requestAnimationFrame(syncActive));

  // --- NIEUW: op MOBILE direct de 2e (middelste) kaart tonen ---
  requestAnimationFrame(() => {
    if (mql.matches && cards[1]) {
      centerIndex(1);   // 2e kaart (index 1) in het midden
    }
    syncActive();
  });

  // Als je viewport verandert en je komt op mobile, ook dan de 2e centreren
  function handleMQChange(e) {
    if (e.matches) {
      requestAnimationFrame(() => {
        if (cards[1]) centerIndex(1);
        syncActive();
      });
    } else {
      // verlaat mobile: haal actieve state weg
      cards.forEach(c => c.classList.remove('is-active'));
    }
  }
  if (mql.addEventListener) mql.addEventListener('change', handleMQChange);
  else mql.addListener(handleMQChange); // oudere Safari
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
