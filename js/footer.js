// Footer partial loader + mobiele accordion (één open tegelijk)
(function () {
    // 1) Partial inladen zoals je header
    const mount = document.getElementById('footer-root');
    if (mount) {
      const url = mount.getAttribute('data-include') || '../partials/footer.html';
      fetch(url)
        .then(res => res.text())
        .then(html => {
          mount.outerHTML = html;
          // Na injectie: init accordion
          initFooterAccordion();
        })
        .catch(err => console.error('Kon footer niet laden:', err));
    } else {
      // Geen mount gevonden → misschien staat de footer al in de DOM
      initFooterAccordion();
    }
  
    function initFooterAccordion() {
      const footer = document.querySelector('.site-footer');
      if (!footer) return;
  
      const items = Array.from(footer.querySelectorAll('[data-acc="item"]'));
      const toggles = items.map(it => it.querySelector('[data-acc="toggle"]'));
      const panels = items.map(it => it.querySelector('[data-acc="panel"]'));
  
      const mql = window.matchMedia('(max-width: 768px)');
      let openIndex = -1;
  
      function setPanelHeight(i, open) {
        const panel = panels[i];
        if (!panel) return;
        if (open) {
          // wrap inhoud voor nette padding
          if (!panel.firstElementChild || !panel.firstElementChild.classList.contains('footer-col__body-inner')) {
            const inner = document.createElement('div');
            inner.className = 'footer-col__body-inner';
            while (panel.firstChild) inner.appendChild(panel.firstChild);
            panel.appendChild(inner);
          }
          panel.style.maxHeight = panel.scrollHeight + 'px';
        } else {
          panel.style.maxHeight = '0px';
        }
      }
  
      function closeItem(i) {
        if (i < 0) return;
        items[i].classList.remove('is-open');
        items[i].removeAttribute('aria-expanded');
        toggles[i].setAttribute('aria-expanded', 'false');
        setPanelHeight(i, false);
      }
  
      function openItem(i) {
        items[i].classList.add('is-open');
        items[i].setAttribute('aria-expanded', 'true');
        toggles[i].setAttribute('aria-expanded', 'true');
        setPanelHeight(i, true);
      }
  
      function setOpen(i) {
        if (!mql.matches) return; // alleen mobiel
        if (i === openIndex) {
          closeItem(openIndex);
          openIndex = -1;
          return;
        }
        closeItem(openIndex);
        openItem(i);
        openIndex = i;
      }
  
      // Click handlers
      toggles.forEach((btn, i) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (mql.matches) setOpen(i);
        });
        btn.addEventListener('keydown', (e) => {
          if (!mql.matches) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(i);
          }
        });
      });
  
      // Responsief gedrag
      function onResize() {
        if (mql.matches) {
          // mobiel: alles dicht
          panels.forEach((p) => { if (p) p.style.maxHeight = '0px'; });
          items.forEach(it => { it.classList.remove('is-open'); it.removeAttribute('aria-expanded'); });
          toggles.forEach(t => t.setAttribute('aria-expanded', 'false'));
          openIndex = -1;
        } else {
          // desktop: alles open
          panels.forEach((p) => { if (p) p.style.maxHeight = 'none'; });
          items.forEach(it => { it.classList.remove('is-open'); it.removeAttribute('aria-expanded'); });
          toggles.forEach(t => t.setAttribute('aria-expanded', 'false'));
          openIndex = -1;
        }
      }
      onResize();
      if (mql.addEventListener) mql.addEventListener('change', onResize);
      else mql.addListener(onResize);
      window.addEventListener('resize', onResize);
    }
  })();
  