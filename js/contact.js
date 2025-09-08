// Contact: lees selectie uit URL/storage en vul checkboxes in
(function () {
    const STORE_KEY = 'wbk-selects';
  
    function getSelectionFromURL() {
      try {
        const usp = new URLSearchParams(location.search);
        return (usp.get('voorkeur') || '')
          .split(',')
          .map(s => s.trim().toLowerCase())
          .filter(Boolean);
      } catch { return []; }
    }
  
    function readSelection() {
      const fromUrl = getSelectionFromURL();
      if (fromUrl.length) return new Set(fromUrl);
      try {
        const raw = sessionStorage.getItem(STORE_KEY) || localStorage.getItem(STORE_KEY);
        if (!raw) return new Set();
        return new Set(JSON.parse(raw));
      } catch { return new Set(); }
    }
  
    function writeSelection(set) {
      const arr = Array.from(set);
      const payload = JSON.stringify(arr);
      try { sessionStorage.setItem(STORE_KEY, payload); } catch {}
      try { localStorage.setItem(STORE_KEY, payload); } catch {}
      // Houd hidden field synchroon (handig voor toekomstige submit/e-mail)
      const hidden = document.getElementById('voorkeur-field');
      if (hidden) hidden.value = arr.join(',');
    }
  
    function applyToCheckboxes(sel) {
      const ids = [
        ['c-kozijnen',    'kozijnen'],
        ['c-schuifpuien', 'schuifpuien'],
        ['c-deuren',      'deuren']
      ];
      ids.forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.checked = sel.has(key);
      });
      writeSelection(sel);
    }
  
    // Init
    const current = readSelection();
    applyToCheckboxes(current);
  
    // Bewaar wijzigingen
    const container = document.getElementById('contact-options');
    container?.addEventListener('change', () => {
      const sel = new Set();
      container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (cb.checked) sel.add(cb.value.toLowerCase());
      });
      writeSelection(sel);
    });
  })();
  