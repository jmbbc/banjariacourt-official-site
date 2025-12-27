document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Ensure auth widget placeholder exists in header (right side)
  const headerWrap = document.querySelector('.header-wrap');
  const navEl = document.getElementById('nav');
  if (headerWrap && navEl && !document.getElementById('authWidget')) {
    const slot = document.createElement('span');
    slot.id = 'authWidget';
    slot.className = 'auth-widget';
    navEl.appendChild(slot);
  }

  // Mobile nav toggle (improved)
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('nav');
  if (toggle && nav) {
    // create overlay once
    let overlay = document.querySelector('.nav-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'nav-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        overlay.classList.remove('open');
        document.body.classList.remove('nav-locked');
      });
    }

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      // update visible label (kept in .nav-label to preserve SVG)
      const label = toggle.querySelector('.nav-label');
      if (label) label.textContent = isOpen ? 'Tutup' : 'Menu';
      toggle.classList.toggle('open', isOpen);
      overlay.classList.toggle('open', isOpen);
      document.body.classList.toggle('nav-locked', isOpen);
      if (isOpen) {
        nav.querySelector('a')?.focus();
      } else {
        toggle.focus();
      }
    });

    // close with Escape key when nav open
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')){
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        overlay.classList.remove('open');
        document.body.classList.remove('nav-locked');
        const label = toggle.querySelector('.nav-label'); if (label) label.textContent = 'Menu';
        toggle.classList.remove('open');
        toggle.focus();
      }
    });

    // ensure nav closes when resizing to desktop width
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && nav.classList.contains('open')){
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        overlay.classList.remove('open');
        document.body.classList.remove('nav-locked');
        toggle.textContent = 'Menu';
      }
    });
  }

  // Home: show latest 3 announcements
  const latestEl = document.getElementById('latest-list');
  if (latestEl) {
    fetch('data/announcements.json')
      .then(r => r.json())
      .then(items => {
        const top = items.slice(0, 3);
        latestEl.innerHTML = top.map(item => `
          <li>
            <strong>${item.title}</strong>
            <span class="meta"> — ${item.date}</span>
            ${item.link ? ` | <a href="${item.link}" target="_blank" rel="noopener">Baca</a>` : ''}
          </li>
        `).join('');
      })
      .catch(() => {
        latestEl.innerHTML = '<li>Tiada notis buat masa ini.</li>';
      });
  }

  // Smooth scroll from hero CTA/down-arrow to shortcuts and close mobile menu if open
  const down = document.querySelector('.down-arrow');
  const heroCta = document.querySelector('.hero-cta');
  const shortcuts = document.getElementById('shortcuts');
  [down, heroCta].forEach(el => {
    if (!el || !shortcuts) return;
    el.addEventListener('click', (e) => {
      e.preventDefault();
      shortcuts.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // close nav if open (mobile)
      const overlayEl = document.querySelector('.nav-overlay');
      if (nav && nav.classList.contains('open')){
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        overlayEl?.classList.remove('open');
        document.body.classList.remove('nav-locked');
        toggle.classList.remove('open');
        const label = toggle.querySelector('.nav-label'); if (label) label.textContent = 'Menu';
      }
    });
  });

  // Render shortcuts dynamically from data/shortcuts.json
  const shortcutsGrid = document.getElementById('shortcuts-grid');
  if (shortcutsGrid) {
    fetch('data/shortcuts.json')
      .then(r => r.json())
      .then(items => {
        const icons = {
          megaphone: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 11h2l7-4v10l-7-4H3v-2z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 8l4-2v10l-4-2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
          calendar: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M16 3v4M8 3v4M3 11h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
          building: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M7 7v-3h10v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 10h1M9 13h1M9 16h1M14 10h1M14 13h1M14 16h1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
          file: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 3v6h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
          tools: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 8l-10 10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 3l-7 7 3 3 7-7-3-3z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
          document: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 14h10M7 10h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 6h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        };

        shortcutsGrid.innerHTML = items.map(it => `
          <a class="card shortcut" href="${it.href}" aria-label="${it.title} - ${it.summary}">
            <div class="shortcut-icon" aria-hidden="true">${icons[it.icon] || ''}</div>
            <div class="shortcut-body">
              <h3>${it.title}</h3>
              <p>${it.summary}</p>
            </div>
          </a>
        `).join('');

        // small entry animation
        requestAnimationFrame(() => {
          document.querySelectorAll('.shortcuts-grid .card').forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(8px)';
            setTimeout(() => { el.style.transition = 'opacity .28s ease, transform .28s ease'; el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, i*60);
          });
        });

        // Render compact summary (section 3) dynamically from data/summary.json
        const summaryGrid = document.getElementById('summary-grid');
        if (summaryGrid) {
          fetch('data/summary.json')
            .then(r => r.json())
            .then(items => {
              summaryGrid.innerHTML = items.map(it => `
                <div class="stat" role="group" aria-label="${it.label}">
                  <div class="value">${it.value}</div>
                  <div class="label">${it.label}</div>
                  <div class="meta" style="display:none">${it.meta || ''}</div>
                </div>
              `).join('');
            })
            .catch(() => {
              summaryGrid.innerHTML = '<div class="stat">Tiada data ringkasan.</div>';
            });
        }
      })
      .catch(() => {
        shortcutsGrid.innerHTML = '<div class="card">Tiada pautan untuk dipaparkan.</div>';
      });
  }
});
