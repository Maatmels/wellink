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



// ===== Cards met features + datum (ongewijzigd behalve eerdere mobile-snelheid) =====
(function () {
  const viewport = document.getElementById('deck-viewport');
  const deck     = document.getElementById('deck');
  if (!viewport || !deck) return;

  const prevBtns = Array.from(document.querySelectorAll('.deck-nav .prev'));
  const nextBtns = Array.from(document.querySelectorAll('.deck-nav .next'));
  const mql = window.matchMedia('(max-width: 768px)');

  // Mobile sneller swipen (laat ik staan zoals eerder besproken)
  let DRAG_SPEED  = mql.matches ? 2.25 : 1.5;
  const ELASTIC_MAX  = 160;
  const ELASTIC_GAIN_DESKTOP = 0.35;
  const ELASTIC_GAIN_MOBILE  = 0.55;
  let BOUNCE_MS    = mql.matches ? 240 : 360;
  const NUDGE_THRESHOLD_RESET = 8;

  mql.addEventListener ? mql.addEventListener('change', () => {
    DRAG_SPEED = mql.matches ? 2.25 : 1.5;
    BOUNCE_MS  = mql.matches ? 240 : 360;
  }) : mql.addListener(() => {
    DRAG_SPEED = mql.matches ? 2.25 : 1.5;
    BOUNCE_MS  = mql.matches ? 240 : 360;
  });

  const JSON_CANDIDATES = [
    '../recent/recent.json',
    '/recent/recent.json',
    '../Recent/recent.json',
    '/Recent/recent.json'
  ];
  async function loadProjects() {
    for (const url of JSON_CANDIDATES) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const data = await res.json();
        if (!Array.isArray(data)) continue;
        const sorted = data.slice().sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
        if (sorted.length) return sorted;
      } catch(_) {}
    }
    return [
      { title: 'Project A', description: 'Voorbeeld', images: ['../images/home_afbeelding.jpg','../images/home_afbeelding2.jpg'], date:'2025-01-01', features:['voorbeeld'] },
      { title: 'Project B', description: 'Voorbeeld', images: ['../images/home_afbeelding2.jpg','../images/home_afbeelding.jpg'], date:'2025-01-02', features:['voorbeeld'] },
      { title: 'Project C', description: 'Voorbeeld', images: ['../images/home_afbeelding.jpg','../images/home_afbeelding2.jpg'], date:'2025-01-03', features:['voorbeeld'] }
    ];
  }

  const num = (v,d=0)=>{ const n=parseFloat(String(v).replace('px','')); return Number.isFinite(n)?n:d; };
  function getSizes(){
    const cs=getComputedStyle(deck); const vpw=viewport.clientWidth||1;
    return { w:num(cs.getPropertyValue('--card-w'),420),
             h:num(cs.getPropertyValue('--card-h'),560),
             gap:num(cs.getPropertyValue('--card-gap'),16),
             vpw };
  }
  const truncateChars=(s='',m=30)=>String(s).length<=m?String(s):String(s).slice(0,m)+'...';
  const fixPath=(p)=>!p?'../images/home_afbeelding.jpg':(/^https?:\/\//i.test(p)||p.startsWith('/'))?p:('../'+String(p).replace(/^\.?\//,''));
  const escapeHTML=(s)=>String(s??'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

  function formatDateISO(iso){
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const maanden = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
    return `${d.getDate()} ${maanden[d.getMonth()]} ${d.getFullYear()}`;
  }

  let cards=[], scrollX=0, maxScroll=0, endNudge=0;

  function visibleCount(){ if(mql.matches) return 1; const {w,gap,vpw}=getSizes(); return Math.max(1, Math.floor((vpw+gap+1e-6)/(w+gap))); }
  function recomputeMaxScroll(){
    const {w,gap}=getSizes();
    const totalW = cards.length*(w+gap)-gap;
    const vis    = visibleCount();
    const groupW = vis*(w+gap)-gap;
    maxScroll = Math.max(0, totalW - groupW);
    scrollX = Math.max(0, Math.min(scrollX, maxScroll));
  }
  const atStart=()=>scrollX<=0.5 && endNudge===0;
  const atEnd  =()=>scrollX>=(maxScroll-0.5);

  function updateArrows(){
    const canNudge = atEnd() && endNudge===0 && !mql.matches;
    const disablePrev = atStart();
    const disableNext = atEnd() ? !canNudge : false;
    prevBtns.forEach(b=>b?.setAttribute('aria-disabled', disablePrev?'true':'false'));
    nextBtns.forEach(b=>b?.setAttribute('aria-disabled', disableNext?'true':'false'));
  }

  function clearOverlapClass(){ cards.forEach(c=>c.classList.remove('is-overlap')); }

  function applyTransforms(){
    const {w,h,gap,vpw}=getSizes();
    deck.style.height = h+'px';
    const vis      = visibleCount();
    const groupW   = vis*(w+gap)-gap;
    let baseOffset;
    if (mql.matches){
      const gv=getComputedStyle(viewport).getPropertyValue('--mobile-left-gutter').trim();
      baseOffset = parseFloat(gv)||0;
    } else {
      const spare = vpw - groupW;
      baseOffset = spare>=0 ? 0 : Math.floor(spare);
    }

    const nudgeActive = atEnd() && endNudge===1 && !mql.matches;
    const NUDGE_SHIFT = 12, OVERLAP=18, SHRINK=0.97;

    const step=(w+gap);
    const idxFloat=scrollX/step;
    const baseIndex=Math.round(idxFloat);
    if (nudgeActive) baseOffset -= NUDGE_SHIFT;

    clearOverlapClass();

    cards.forEach((card,i)=>{
      const rel = i - idxFloat;
      let x = baseOffset + rel*step;
      let z = 100+i, scale=1, rot=0;

      if (rel<0){
        const under = Math.min(42,(idxFloat-i)*6);
        x = Math.max(0, baseOffset-under);
        scale=0.985; rot=-0.35; z=60+i;
      }

      if (nudgeActive){
        if (i===baseIndex) { scale = SHRINK; }
        if (i===baseIndex+1){ x-=OVERLAP; z+=40; card.classList.add('is-overlap'); }
        const lastVisibleIdx = baseIndex + vis - 1;
        if (vis>=3 && i===lastVisibleIdx){ x-=OVERLAP; }
      }

      card.style.transform = `translate3d(${Math.floor(x)}px,0,0) rotate(${rot}deg) scale(${scale})`;
      card.style.zIndex = z;
    });

    updateArrows();
  }

  function stepBy(delta){
    const {w,gap}=getSizes(), step=(w+gap)*delta;
    scrollX = Math.max(0, Math.min(scrollX+step, maxScroll));
    endNudge = 0;
    applyTransforms();
  }

  function renderDeck(projects){
    deck.innerHTML=''; const frag=document.createDocumentFragment();

    projects.forEach((p)=>{
      const li=document.createElement('li'); li.className='card';

      const main=fixPath(p.images?.[0]), alt=p.images?.[1]?fixPath(p.images[1]):null;
      const title=escapeHTML(p.title||'Project');
      const desc =escapeHTML(truncateChars(p.description||'',30));
      const date=formatDateISO(p.date);
      const features=Array.isArray(p.features)?p.features.slice(0,6):[];

      const featsHTML = features.map(f=>`<span class="feat-tag">${escapeHTML(String(f))}</span>`).join('');

      li.innerHTML=`
  <div class="card__img">
    <div class="card__frame">
      <img src="${main}" alt="${title}" draggable="false" data-main="${main}" ${alt?`data-alt="${alt}"`:''}/>
    </div>
  </div>
  <div class="card__body">
    <div class="card__features">${featsHTML}</div>
    <div class="card__title">${title}</div>
    <div>
      <p class="card__desc">${desc}</p>
      ${date ? `<p class="card__date">${date}</p>` : ``}
    </div>
    <span></span>
    <a class="card__discover" href="/projecten/">
      Ontdek <img class="card__arrow" src="../images/pijlwit.png" alt="" aria-hidden="true" />
    </a>
  </div>`;

      const img=li.querySelector('img');
      li.addEventListener('mouseenter',()=>{ if(alt && !mql.matches) img.src=alt; },{passive:true});
      li.addEventListener('mouseleave',()=>{ if(alt && !mql.matches) img.src=main; },{passive:true});

      li.addEventListener('click',(e)=>{
        if (suppressClick) { e.preventDefault(); return; }
        const a=e.target.closest('a');
        if (!a) window.location.href='/projecten/';
      });

      frag.appendChild(li);
    });

    deck.appendChild(frag);
    cards=Array.from(deck.querySelectorAll('.card'));
    recomputeMaxScroll(); scrollX=0; endNudge=0;
    requestAnimationFrame(()=>{ applyTransforms(); requestAnimationFrame(applyTransforms); });
  }

  // Anim helpers
  let animFrame=null;
  const easeOutCubic=t=>1-Math.pow(1-t,3);
  function animateTo(target, ms=BOUNCE_MS){
    cancelAnimationFrame(animFrame);
    const start=performance.now(), from=scrollX, dist=target-from;
    animFrame=requestAnimationFrame(function step(now){
      const t=Math.min(1,(now-start)/ms);
      scrollX = from + easeOutCubic(t)*dist;
      applyTransforms();
      if(t<1) animFrame=requestAnimationFrame(step);
    });
  }
  function elasticProject(proposed, step){
    const EXTRA=Math.min(ELASTIC_MAX, step*0.9);
    const GAIN = mql.matches ? ELASTIC_GAIN_MOBILE : ELASTIC_GAIN_DESKTOP;
    if (proposed<0){
      const over=Math.min(EXTRA,-proposed); return -over*GAIN;
    }
    if (proposed>maxScroll){
      const over=Math.min(EXTRA, proposed-maxScroll); return maxScroll + over*GAIN;
    }
    return proposed;
  }

  // Drag/swipe
  let dragging=false, startX=0, startScrollX=0, wasDragging=false;
  let wasNudgedAtDragStart=0;
  let suppressClick=false;

  function beginDrag(clientX){
    dragging=true; wasDragging=false;
    startX=clientX; startScrollX=scrollX;
    wasNudgedAtDragStart=endNudge;
    viewport.classList.add('grabbing');
  }
  function continueDrag(clientX){
    if(!dragging) return;
    const {w,gap}=getSizes(), step=(w+gap);
    const dx=(clientX-startX)*DRAG_SPEED;
    if (Math.abs(dx)>4){ wasDragging=true; suppressClick=true; }
    const proposed = startScrollX - dx;
    scrollX = elasticProject(proposed, step);
    if (scrollX <= (maxScroll - NUDGE_THRESHOLD_RESET)) endNudge=0;
    if (!mql.matches && wasNudgedAtDragStart===1 && scrollX>(maxScroll-NUDGE_THRESHOLD_RESET)) endNudge=1;
    applyTransforms();
  }
  function endDrag(){
    if(!dragging) return;
    dragging=false; viewport.classList.remove('grabbing');

    if (scrollX<0){ animateTo(0, BOUNCE_MS); }
    else if (scrollX>maxScroll){ if(!mql.matches) endNudge=1; animateTo(maxScroll, BOUNCE_MS); }
    else { if(!mql.matches && wasNudgedAtDragStart===1 && scrollX>(maxScroll-NUDGE_THRESHOLD_RESET)) endNudge=1; applyTransforms(); }

    setTimeout(()=>{ suppressClick=false; }, 180);
  }

  viewport.addEventListener('click', (e)=>{ if(suppressClick){ e.preventDefault(); e.stopPropagation(); } }, true);

  // Touch
  viewport.addEventListener('touchstart',(e)=>beginDrag(e.touches[0].clientX),{passive:true});
  window.addEventListener('touchmove',(e)=>{ if(dragging){ continueDrag(e.touches[0].clientX); e.preventDefault(); }},{passive:false});
  window.addEventListener('touchend', endDrag);

  // Desktop custom cursor
  const dragCursor=document.createElement('div');
  dragCursor.className='drag-cursor';
  dragCursor.innerHTML=`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 6l-5 6 5 6V6zm6 0v12l5-6-5-6z" fill="currentColor"/>
    </svg>`;
  document.body.appendChild(dragCursor);

  let lastMoveT=0, lastX=0, vx=0;
  function showCursor(){ if(mql.matches) return; dragCursor.classList.add('is-visible'); viewport.classList.add('use-custom-cursor'); }
  function hideCursor(){ dragCursor.classList.remove('is-visible'); viewport.classList.remove('use-custom-cursor'); dragCursor.style.setProperty('--cx','1'); dragCursor.style.setProperty('--cy','1'); }
  function moveCursor(e){
    if(mql.matches) return;
    dragCursor.style.left = e.clientX+'px';
    dragCursor.style.top  = e.clientY+'px';
  }

  viewport.addEventListener('mouseenter', showCursor);
  viewport.addEventListener('mouseleave', ()=>{ hideCursor(); if(dragging) endDrag(); });
  viewport.addEventListener('mousemove', moveCursor);

  viewport.addEventListener('mousedown',(e)=>{ if(e.button!==0||mql.matches) return; beginDrag(e.clientX); });
  window.addEventListener('mousemove',(e)=>{ if(dragging && !mql.matches){ continueDrag(e.clientX); moveCursor(e); } });
  window.addEventListener('mouseup', ()=>{ if(!mql.matches) endDrag(); });

  // Pijlen
  prevBtns.forEach(btn=>btn?.addEventListener('click',()=>{
    if(endNudge===1 && !mql.matches){ endNudge=0; applyTransforms(); }
    else stepBy(-1);
  }));
  nextBtns.forEach(btn=>btn?.addEventListener('click',()=>{
    if(scrollX<maxScroll-0.5) stepBy(1);
    else if(endNudge===0 && !mql.matches){ endNudge=1; applyTransforms(); }
  }));

  // Init
  (async()=>{ renderDeck(await loadProjects()); })();

  // Responsief
  const onResize=()=>{ recomputeMaxScroll(); applyTransforms(); };
  if (mql.addEventListener) mql.addEventListener('change', onResize);
  else mql.addListener(onResize);
  window.addEventListener('resize', onResize);
})();




(() => {
  const list = document.getElementById('faq-list');
  if (!list) return;

  const items   = Array.from(list.querySelectorAll('.faq-item'));
  const buttons = items.map(it => it.querySelector('.faq-toggle'));
  const panels  = items.map(it => it.querySelector('.faq-a'));

  let openIndex = -1; // start: alles dicht

  function closeItem(i) {
    if (i < 0) return;
    const it    = items[i];
    const btn   = buttons[i];
    const panel = panels[i];

    it.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');

    panel.style.maxHeight = panel.scrollHeight + 'px';
    panel.getBoundingClientRect();   // force reflow
    panel.style.maxHeight = '0px';
  }

  function openItem(i) {
    if (i < 0) return;
    const it    = items[i];
    const btn   = buttons[i];
    const panel = panels[i];

    it.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');

    panel.style.maxHeight = panel.scrollHeight + 'px';
  }

  function setOpen(i) {
    if (i === openIndex) {
      closeItem(openIndex);
      openIndex = -1;
      return;
    }
    closeItem(openIndex);
    openItem(i);
    openIndex = i;
  }

  // Click handlers (desktop & mobile)
  buttons.forEach((btn, i) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(i);
    });

    // Toetsenbord
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(i);
      }
    });
  });

  // Recalc open hoogte bij resize
  function onResize() {
    if (openIndex >= 0) {
      panels[openIndex].style.maxHeight = panels[openIndex].scrollHeight + 'px';
    }
  }
  window.addEventListener('resize', onResize, { passive: true });
})();

// === Keuzes opslaan & meenemen naar /contact (querystring + storage) ===
(function () {
  const root = document.querySelector('.finder--bgphoto');
  if (!root) return;

  const STORE_KEY = 'wbk-selects';
  const nextBtn   = root.querySelector('.finder__next');
  const optionsEl = root.querySelector('#finder-options');
  const labels    = Array.from(root.querySelectorAll('.finder-opt'));

  function getSelectionFromURL() {
    try {
      const usp = new URLSearchParams(location.search);
      return (usp.get('voorkeur') || '')
        .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    } catch { return []; }
  }

  function readStored() {
    const fromUrl = getSelectionFromURL();
    if (fromUrl.length) return new Set(fromUrl);
    try {
      const raw = sessionStorage.getItem(STORE_KEY) || localStorage.getItem(STORE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  }

  function writeStored(sel) {
    const arr = Array.from(sel);
    const payload = JSON.stringify(arr);
    try { sessionStorage.setItem(STORE_KEY, payload); } catch {}
    try { localStorage.setItem(STORE_KEY, payload); } catch {}
    const qs = arr.length ? ('?voorkeur=' + encodeURIComponent(arr.join(','))) : '';
    nextBtn.setAttribute('href', '/contact' + qs);
  }

  function applyState(sel) {
    labels.forEach(lb => {
      const key = lb.dataset.key;
      const on = sel.has(key);
      lb.classList.toggle('is-selected', on);
      const input = lb.querySelector('input[type="checkbox"]');
      if (input) input.checked = on;
    });
    writeStored(sel);
  }

  const selected = readStored();
  applyState(selected);

  optionsEl.addEventListener('change', (e) => {
    const cb = e.target.closest('input[type="checkbox"]');
    if (!cb) return;
    const key = (cb.value || '').toLowerCase();
    if (!key) return;
    if (cb.checked) selected.add(key);
    else selected.delete(key);
    applyState(selected);
  });
})();
