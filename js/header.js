(function () {
    let initialized = false;
  
    function init() {
      if (initialized) return;
  
      const header = document.querySelector('.site-header');
      const toggleBtn = header?.querySelector('.menu-toggle');
      const popup = header?.querySelector('.menu-popup');
      let overlay = document.querySelector('.site-dim-overlay');
  
      if (!header || !toggleBtn || !popup) return;
  
      initialized = true;
  
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'site-dim-overlay';
        overlay.hidden = true;
        document.body.appendChild(overlay);
      }
  
      function ensureMobilePopupPosition() {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (!isMobile) {
          document.body.classList.remove('menu-below');
          return;
        }
        // check ruimte boven de header
        const headerRect = header.getBoundingClientRect();
        const spaceAbove = headerRect.top - 10;
        const popupHeight = popup.scrollHeight; // echte hoogte van content
        if (popupHeight > spaceAbove) {
          document.body.classList.add('menu-below');   // plaats onder header
        } else {
          document.body.classList.remove('menu-below'); // plaats boven header
        }
      }
  
      function openMenu() {
        document.body.classList.add('menu-open');
        toggleBtn.setAttribute('aria-expanded', 'true');
        toggleBtn.textContent = 'SLUITEN';
        overlay.hidden = false;
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'contain';
  
        // zodra zichtbaar -> positie checken voor mobile
        requestAnimationFrame(ensureMobilePopupPosition);
      }
  
      function closeMenu() {
        document.body.classList.remove('menu-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.textContent = 'MENU';
        setTimeout(() => { overlay.hidden = true; }, 200);
        document.documentElement.style.overflow = '';
        document.body.style.overscrollBehavior = '';
        document.body.classList.remove('menu-below');
      }
  
      function toggleMenu() {
        if (document.body.classList.contains('menu-open')) closeMenu();
        else openMenu();
      }
  
      toggleBtn.addEventListener('click', toggleMenu);
      overlay.addEventListener('click', closeMenu);
  
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('menu-open')) closeMenu();
      });
  
      // herpositioneer bij rotatie/resize zolang menu open is
      window.addEventListener('resize', () => {
        if (document.body.classList.contains('menu-open')) ensureMobilePopupPosition();
      });
  
      // links sluiten menu
      popup.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (a) closeMenu();
      });
    }
  
    if (document.readyState !== 'loading') init();
    else document.addEventListener('DOMContentLoaded', init);
  
    document.addEventListener('partials:ready', init);
  })();
  