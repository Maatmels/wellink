// Contact: smooth scroll, (de)selecteren, live stap-2 update, auto-advance S2+S3+S4+S5, progress, stap-6 form + validation
(function () {
  const STORE_SELECTS = 'wbk-selects'; // set<string> voor producten (stap 1)
  const STORE_QTY     = 'wbk-qty';     // { key: "1-3"|"3-5"|"6+" } (stap 2)
  const STORE_FINISH  = 'wbk-finish';  // "houtnerf" | "glad" | "zandstructuur" (stap 3)
  const STORE_COLOR   = 'wbk-color';   // "antraciet" | "wit" | "zwart" | "grijs" | "overig" (stap 4)
  const STORE_TERM    = 'wbk-term';    // "zsm" | "3-6" | "6-9" | "9plus" (stap 5)

  /* ---------- Smooth scroll vanaf hero-knop ---------- */
  document.querySelector('.js-scroll-start')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('#step-opstelling')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* ---------- Helpers selectie ---------- */
  function getSelectionFromURL() {
    try {
      const usp = new URLSearchParams(location.search);
      return (usp.get('voorkeur') || '')
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
    } catch { return []; }
  }
  function readSelectedSet() {
    const fromUrl = getSelectionFromURL();
    if (fromUrl.length) return new Set(fromUrl);
    try {
      const raw = sessionStorage.getItem(STORE_SELECTS) || localStorage.getItem(STORE_SELECTS);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  }
  function writeSelectedSet(sel) {
    const arr = Array.from(sel);
    const payload = JSON.stringify(arr);
    try { sessionStorage.setItem(STORE_SELECTS, payload); } catch {}
    try { localStorage.setItem(STORE_SELECTS, payload); } catch {}
    const hidden = document.getElementById('voorkeur-field');
    if (hidden) hidden.value = arr.join(',');
  }

  function readQtyMap() {
    try {
      const raw = sessionStorage.getItem(STORE_QTY) || localStorage.getItem(STORE_QTY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }
  function writeQtyMap(map) {
    const payload = JSON.stringify(map || {});
    try { sessionStorage.setItem(STORE_QTY, payload); } catch {}
    try { localStorage.setItem(STORE_QTY, payload); } catch {}
  }

  function readFinish() {
    try { return sessionStorage.getItem(STORE_FINISH) || localStorage.getItem(STORE_FINISH) || ''; }
    catch { return ''; }
  }
  function writeFinish(value) {
    try { sessionStorage.setItem(STORE_FINISH, value); } catch {}
    try { localStorage.setItem(STORE_FINISH, value); } catch {}
  }

  function readColor() {
    try { return sessionStorage.getItem(STORE_COLOR) || localStorage.getItem(STORE_COLOR) || ''; }
    catch { return ''; }
  }
  function writeColor(value) {
    try { sessionStorage.setItem(STORE_COLOR, value); } catch {}
    try { localStorage.setItem(STORE_COLOR, value); } catch {}
  }

  function readTerm() {
    try { return sessionStorage.getItem(STORE_TERM) || localStorage.getItem(STORE_TERM) || ''; }
    catch { return ''; }
  }
  function writeTerm(value) {
    try { sessionStorage.setItem(STORE_TERM, value); } catch {}
    try { localStorage.setItem(STORE_TERM, value); } catch {}
  }

  /* ---------- Stap 1 UI ---------- */
  const selected = readSelectedSet();
  applyStep1UI(selected);

  function applyStep1UI(sel) {
    // checkboxes
    [['c-kozijnen','kozijnen'], ['c-schuifpuien','schuifpuien'], ['c-deuren','deuren']].forEach(([id,key])=>{
      const el = document.getElementById(id);
      if (el) el.checked = sel.has(key);
    });
    // kaarten
    document.querySelectorAll('.opt-card[data-key]').forEach(card=>{
      const key = (card.getAttribute('data-key')||'').toLowerCase();
      if (['kozijnen','schuifpuien','deuren'].includes(key)) {
        card.classList.toggle('is-selected', sel.has(key));
      }
    });
    // foutmelding stap 1 verbergen als er nu wel een keuze is
    const err1 = document.getElementById('err-step1');
    if (err1 && sel.size > 0) err1.hidden = true;

    // selectie opslaan
    writeSelectedSet(sel);

    // als stap 2 zichtbaar is: direct herbouwen zodat hij klopt met de (de)selecties
    const s2 = document.getElementById('step-aantallen');
    if (s2 && !s2.classList.contains('is-hidden')) {
      rebuildStep2();
    }
  }

  // Wijzigingen via checkbox (live)
  const opts = document.getElementById('contact-options');
  opts?.addEventListener('change', (e)=>{
    const cb = e.target.closest('input[type="checkbox"]');
    if (!cb) return;
    const key = (cb.value||'').toLowerCase();
    if (!key) return;
    if (cb.checked) selected.add(key); else selected.delete(key);
    applyStep1UI(selected);
  });

  // Klik op kaart togglet checkbox
  document.querySelectorAll('#contact-options .opt-card').forEach(card=>{
    card.addEventListener('click', (e)=>{
      if (e.target.tagName.toLowerCase() === 'input') return;
      e.preventDefault();
      const cb = card.querySelector('input[type="checkbox"]');
      if (!cb) return;
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event('change', { bubbles:true }));
    });
  });

  /* ---------- Stap 2 – Aantallen ---------- */
  const imagesByKey = {
    kozijnen:   '../images/kozijn.png',
    schuifpuien:'../images/schuifpui.png',
    deuren:     '../images/deur.png'
  };
  const labelByKey = {
    kozijnen:   'Kozijnen',
    schuifpuien:'Schuifpuien',
    deuren:     'Deuren'
  };

  function rebuildStep2() {
    const wrap = document.getElementById('qty-groups');
    if (!wrap) return;

    // prune qty-map voor verwijderde keys
    const map = readQtyMap();
    Object.keys(map).forEach(k => { if (!selected.has(k)) delete map[k]; });
    writeQtyMap(map);

    // Geselecteerde keys op volgorde
    const order = ['kozijnen','schuifpuien','deuren'];
    const keys = order.filter(k => selected.has(k));
    wrap.innerHTML = '';

    keys.forEach(key=>{
      const group = document.createElement('div');
      group.className = 'qty-group';
      group.setAttribute('data-key', key);

      group.innerHTML = `
        <div class="qty-left">
          <span class="qty-name">${labelByKey[key]}</span>
          <span class="qty-thumb"><img src="${imagesByKey[key]}" alt="" aria-hidden="true"></span>
        </div>
        <div class="qty-right" role="group" aria-label="${labelByKey[key]} aantallen">
          ${renderQtyCard(key, '1-3')}
          ${renderQtyCard(key, '3-5')}
          ${renderQtyCard(key, '6+')}
        </div>
      `;
      wrap.appendChild(group);

      // Preselecteer uit storage indien aanwezig
      const prev = map[key];
      if (prev) {
        const match = group.querySelector(`.qty-card[data-range="${CSS.escape(prev)}"]`);
        if (match) selectQtyCard(match, true);
      }

      // Events
      group.querySelectorAll('.qty-card').forEach(card=>{
        card.addEventListener('click', (e)=>{
          if (e.target.tagName.toLowerCase() === 'input') return;
          e.preventDefault();
          selectQtyCard(card, true);
          const range = card.getAttribute('data-range');
          const m = readQtyMap();
          m[key] = range;
          writeQtyMap(m);
          maybeAdvanceAfterStep2();
        });
        const radio = card.querySelector('input[type="radio"]');
        radio.addEventListener('change', ()=>{
          if (radio.checked) {
            selectQtyCard(card, false);
            const range = card.getAttribute('data-range');
            const m = readQtyMap();
            m[key] = range;
            writeQtyMap(m);
            maybeAdvanceAfterStep2();
          }
        });
      });
    });
  }

  function renderQtyCard(key, range){
    const name = `qty-${key}`;
    const id = `${name}-${range.replace('+','plus').replace(/\s/g,'')}`;
    return `
      <label class="qty-card" data-range="${range}">
        <input type="radio" id="${id}" name="${name}" value="${range}">
        <span class="qty-label">${range}</span>
        <img class="qty-check" src="../images/vinkje.png" alt="" aria-hidden="true" />
      </label>
    `;
  }

  function selectQtyCard(card, toggleRadio){
    const group = card.closest('.qty-right');
    if (!group) return;
    group.querySelectorAll('.qty-card').forEach(c=>{
      c.classList.remove('is-selected');
      const r = c.querySelector('input[type="radio"]');
      if (r) r.checked = false;
    });
    card.classList.add('is-selected');
    const radio = card.querySelector('input[type="radio"]');
    if (radio && toggleRadio) radio.checked = true;
  }

  // Auto-advance zodra ALLE rijen gekozen zijn (Stap 2)
  function maybeAdvanceAfterStep2(){
    const order = ['kozijnen','schuifpuien','deuren'];
    const keys = order.filter(k => selected.has(k));
    const map = readQtyMap();
    const allChosen = keys.every(k => !!map[k]);

    if (allChosen) {
      const s3 = document.getElementById('step-afwerking');
      if (s3?.classList.contains('is-hidden')) s3.classList.remove('is-hidden');

      maxAllowedStep = Math.max(maxAllowedStep, 3);
      if (currentStep < 3) { currentStep = 3; renderSteps(); }

      s3?.scrollIntoView({ behavior:'smooth', block:'start' });
    }
  }

  /* ---------- Stap 3 – Afwerking ---------- */
  function applyStep3UI(){
    const current = readFinish();
    document.querySelectorAll('#finish-options .finish-card').forEach(card=>{
      const key = (card.getAttribute('data-key')||'').toLowerCase();
      const radio = card.querySelector('input[type="radio"]');
      const selected = current && (current === key);
      card.classList.toggle('is-selected', selected);
      if (radio) radio.checked = selected;
    });
  }
  applyStep3UI();

  document.querySelectorAll('#finish-options .finish-card').forEach(card=>{
    card.addEventListener('click',(e)=>{
      if (e.target.tagName.toLowerCase() === 'input') return;
      e.preventDefault();
      const radio = card.querySelector('input[type="radio"]');
      if (!radio) return;
      radio.checked = true;
      const key = (card.getAttribute('data-key')||'').toLowerCase();
      writeFinish(key);
      applyStep3UI();
      maxAllowedStep = Math.max(maxAllowedStep, 4);
      if (currentStep < 4) { currentStep = 4; renderSteps(); }
      const s4 = document.getElementById('step-kleur');
      if (s4?.classList.contains('is-hidden')) s4.classList.remove('is-hidden');
      s4?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
    const radio = card.querySelector('input[type="radio"]');
    radio?.addEventListener('change', ()=>{
      if (!radio.checked) return;
      const key = (card.getAttribute('data-key')||'').toLowerCase();
      writeFinish(key);
      applyStep3UI();
      maxAllowedStep = Math.max(maxAllowedStep, 4);
      if (currentStep < 4) { currentStep = 4; renderSteps(); }
      const s4 = document.getElementById('step-kleur');
      if (s4?.classList.contains('is-hidden')) s4.classList.remove('is-hidden');
      s4?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  });

  /* ---------- Stap 4 – Kleur ---------- */
  function applyStep4UI(){
    const curr = readColor();
    document.querySelectorAll('#color-options .color-card').forEach(card=>{
      const key = (card.getAttribute('data-key')||'').toLowerCase();
      const radio = card.querySelector('input[type="radio"]');
      const isSel = curr && (curr === key);
      card.classList.toggle('is-selected', isSel);
      if (radio) radio.checked = isSel;
    });
  }
  applyStep4UI();

  document.querySelectorAll('#color-options .color-card').forEach(card=>{
    card.addEventListener('click',(e)=>{
      if (e.target.tagName.toLowerCase() === 'input') return;
      e.preventDefault();
      const radio = card.querySelector('input[type="radio"]');
      if (!radio) return;
      radio.checked = true;
      const key = (card.getAttribute('data-key')||'').toLowerCase();
      writeColor(key);
      applyStep4UI();
      maxAllowedStep = Math.max(maxAllowedStep, 5);
      if (currentStep < 5) { currentStep = 5; renderSteps(); }
      const s5 = document.getElementById('step-termijn');
      if (s5?.classList.contains('is-hidden')) s5.classList.remove('is-hidden');
      s5?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
    const radio = card.querySelector('input[type="radio"]');
    radio?.addEventListener('change', ()=>{
      if (!radio.checked) return;
      const key = (card.getAttribute('data-key')||'').toLowerCase();
      writeColor(key);
      applyStep4UI();
      maxAllowedStep = Math.max(maxAllowedStep, 5);
      if (currentStep < 5) { currentStep = 5; renderSteps(); }
      const s5 = document.getElementById('step-termijn');
      if (s5?.classList.contains('is-hidden')) s5.classList.remove('is-hidden');
      s5?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  });

  /* ---------- Stap 5 – Termijn (auto-advance) ---------- */
  function applyStep5UI(){
    const curr = readTerm();
    document.querySelectorAll('#term-options .term-card').forEach(card=>{
      const key = (card.getAttribute('data-key')||'').toLowerCase();
      const radio = card.querySelector('input[type="radio"]');
      const isSel = curr && (curr === key);
      card.classList.toggle('is-selected', isSel);
      if (radio) radio.checked = isSel;
    });
  }
  applyStep5UI();

  document.querySelectorAll('#term-options .term-card').forEach(card=>{
    card.addEventListener('click',(e)=>{
      if (e.target.tagName.toLowerCase() === 'input') return;
      e.preventDefault();
      const radio = card.querySelector('input[type="radio"]');
      if (!radio) return;
      radio.checked = true;
      const key = (card.getAttribute('data-key')||'').toLowerCase();
      writeTerm(key);
      applyStep5UI();
      maxAllowedStep = Math.max(maxAllowedStep, 6);
      if (currentStep < 6) { currentStep = 6; renderSteps(); }
      const s6 = document.getElementById('step-gegevens');
      if (s6?.classList.contains('is-hidden')) s6.classList.remove('is-hidden');
      s6?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
    const radio = card.querySelector('input[type="radio"]');
    radio?.addEventListener('change', ()=>{
      if (!radio.checked) return;
      const key = (card.getAttribute('data-key')||'').toLowerCase();
      writeTerm(key);
      applyStep5UI();
      maxAllowedStep = Math.max(maxAllowedStep, 6);
      if (currentStep < 6) { currentStep = 6; renderSteps(); }
      const s6 = document.getElementById('step-gegevens');
      if (s6?.classList.contains('is-hidden')) s6.classList.remove('is-hidden');
      s6?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  });

  /* ---------- Validatie & Gating / Progress ---------- */
  let currentStep = 1;       // 1 = Opstelling
  let maxAllowedStep = 1;    // hoe ver je mag kleuren

  const steps = Array.from(document.querySelectorAll('.step'));
  function renderSteps() {
    steps.forEach(step=>{
      const n = parseInt(step.getAttribute('data-step'),10);
      step.classList.toggle('is-current', n === currentStep);
      step.classList.toggle('is-done', n < currentStep);
    });
  }
  renderSteps();

  function pulseErrorEls(els) {
    els.forEach(el => el.classList.add('is-error'));
    setTimeout(() => { els.forEach(el => el.classList.remove('is-error')); }, 1000);
  }

  // Stap 1 -> Volgende
  document.querySelector('.js-next-step')?.addEventListener('click', (e)=>{
    e.preventDefault();

    if (selected.size === 0) {
      const err1 = document.getElementById('err-step1');
      if (err1) err1.hidden = false; // RODE tekst tonen
      const cards = Array.from(document.querySelectorAll('#contact-options .opt-card'));
      pulseErrorEls(cards);           // Tijdelijke rode rand (1s)
      return;
    }

    // bouw/tonen stap 2
    rebuildStep2();
    const s2 = document.getElementById('step-aantallen');
    if (s2?.classList.contains('is-hidden')) s2.classList.remove('is-hidden');

    // gating: maximaal tot 2
    const allowedFromThisSection = 2;
    maxAllowedStep = Math.max(maxAllowedStep, allowedFromThisSection);
    const wanted = currentStep + 1;
    const next = Math.min(wanted, maxAllowedStep);
    if (next !== currentStep) { currentStep = next; renderSteps(); }

    s2?.scrollIntoView({ behavior:'smooth', block:'start' });
  });

  /* ---------- Steps: klikbaar terug naar behaalde stappen ---------- */
  const idByStep = {
    1: '#step-opstelling',
    2: '#step-aantallen',
    3: '#step-afwerking',
    4: '#step-kleur',
    5: '#step-termijn',
    6: '#step-gegevens'
  };
  steps.forEach(li=>{
    li.addEventListener('click', ()=>{
      const n = parseInt(li.getAttribute('data-step'),10);
      if (n > maxAllowedStep) return;           // nog niet vrij
      const target = document.querySelector(idByStep[n]);
      if (!target) return;
      currentStep = n;
      renderSteps();
      // Zorg dat tussenliggende secties zichtbaar zijn als je terug springt
      if (n >= 2) document.getElementById('step-aantallen')?.classList.remove('is-hidden');
      if (n >= 3) document.getElementById('step-afwerking')?.classList.remove('is-hidden');
      if (n >= 4) document.getElementById('step-kleur')?.classList.remove('is-hidden');
      if (n >= 5) document.getElementById('step-termijn')?.classList.remove('is-hidden');
      if (n >= 6) document.getElementById('step-gegevens')?.classList.remove('is-hidden');
      target.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  });

  /* ---------- Stap 6: formulier validatie ---------- */
  const form = document.getElementById('details-form');
  const submitBtn = document.querySelector('.contact-submit');

  const $$ = (sel, root=document)=>Array.from(root.querySelectorAll(sel));

  const fields = {
    naam:      document.getElementById('f-naam'),
    email:     document.getElementById('f-email'),
    tel:       document.getElementById('f-tel'),
    adres:     document.getElementById('f-adres'),
    huisnr:    document.getElementById('f-huisnr'),
    postcode:  document.getElementById('f-postcode'),
    plaats:    document.getElementById('f-plaats'),
    opm:       document.getElementById('f-opm')
  };

  function isValidNaam(v){ return String(v||'').trim().length >= 2; }
  function isValidEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'')); }
  function isValidTel(v){ return /^[+\d][\d\s\-]{5,}$/.test(String(v||'')); }
  function isValidAdres(v){ return String(v||'').trim().length >= 3; }
  function isValidHuisnr(v){ return /^\d+$/.test(String(v||'').trim()); }
  function isValidPostcode(v){ return /^\d{4}\s?[A-Za-z]{2}$/.test(String(v||'').trim()); }
  function isValidPlaats(v){ return String(v||'').trim().length >= 2; }

  const validators = {
    naam: isValidNaam,
    email: isValidEmail,
    tel: isValidTel,
    adres: isValidAdres,
    huisnr: isValidHuisnr,
    postcode: isValidPostcode,
    plaats: isValidPlaats
    // opm: optioneel
  };

  function setFieldState(input, state){ // state: 'valid' | 'error' | 'neutral'
    const wrap = input.closest('.field, .field__col');
    if (!wrap) return;
    wrap.classList.remove('is-valid','has-error');
    if (state === 'valid') wrap.classList.add('is-valid');
    if (state === 'error') wrap.classList.add('has-error');
  }

  function pulseField(input){
    const wrap = input.closest('.field, .field__col');
    if (!wrap) return;
    wrap.classList.add('is-error');
    setTimeout(()=>wrap.classList.remove('is-error'), 1000);
  }

  function validateOne(key){
    const input = fields[key];
    if (!input) return true;
    const ok = validators[key] ? validators[key](input.value) : true;
    setFieldState(input, ok ? 'valid' : 'error');
    return ok;
  }

  function updateSubmitState(){
    const allOk = ['naam','email','tel','adres','huisnr','postcode','plaats'].every(validateOne);
    if (allOk){
      submitBtn?.removeAttribute('disabled');
      submitBtn?.classList.remove('is-disabled');
    } else {
      submitBtn?.setAttribute('disabled','');
      submitBtn?.classList.add('is-disabled');
    }
  }

  // live validate
  Object.entries(fields).forEach(([key, el])=>{
    if (!el) return;
    el.addEventListener('input', ()=>{ validateOne(key); updateSubmitState(); });
    el.addEventListener('blur',  ()=>{ validateOne(key); updateSubmitState(); });
  });

  // form submit
  form?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const order = ['naam','email','tel','adres','huisnr','postcode','plaats']; // opm optioneel
    let firstBad = null;
    order.forEach(k=>{
      const good = validateOne(k);
      if (!good){
        if (!firstBad) firstBad = fields[k];
        pulseField(fields[k]);
      }
    });
    updateSubmitState();
    if (submitBtn?.hasAttribute('disabled')){
      // toon rode labeltjes “Kies een optie” via .has-error class (al gezet)
      firstBad?.scrollIntoView({ behavior:'smooth', block:'center' });
      return;
    }
    // Alles OK → hier zou je kunnen versturen (fetch/XHR)
    alert('Bedankt! We sturen uw vrijblijvende offerte zo snel mogelijk toe.');
  });

  // Init: stap 6 pas tonen wanneer bereikt via stap 5 auto-advance
  // (Gebeurde al in stap 5 handlers)

  /* ---------- Header kleur safeguard op deze pagina ---------- */
})();
