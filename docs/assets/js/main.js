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

  // Mobile nav rebuilt: dedicated overlay shell with shortcuts inside
  let closeMobileMenu = () => {};
  let isMobileMenuOpen = () => false;
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('nav');
  if (toggle && nav) {
    const shell = document.createElement('div');
    shell.className = 'mobile-shell';
    shell.setAttribute('aria-hidden', 'true');
    shell.innerHTML = `
      <div class="mobile-dim"></div>
      <div class="mobile-panel" role="dialog" aria-modal="true" aria-label="Menu mudah alih">
        <nav class="mobile-links" aria-label="Pautan utama"></nav>
      </div>
    `;
    document.body.appendChild(shell);

    const dim = shell.querySelector('.mobile-dim');
    const mobileLinks = shell.querySelector('.mobile-links');

    const setLabel = (text) => {
      const label = toggle.querySelector('.nav-label');
      if (label) label.textContent = text;
    };

    const closeMenu = () => {
      shell.classList.remove('open');
      shell.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.classList.remove('open');
      document.body.classList.remove('nav-locked');
      setLabel('Menu');
      const headerEl = document.querySelector('.site-header'); if (headerEl) headerEl.style.zIndex = '';
      toggle.focus();
    };

    const populateLinks = () => {
      if (!mobileLinks || !nav) return;
      mobileLinks.innerHTML = '';

      // Support both legacy flat links and Bootstrap nav links wrapped in <li>
      const links = nav.querySelectorAll('a.nav-link, :scope > a');
      links.forEach((link) => {
        const a = link.cloneNode(true);
        a.classList.add('mobile-link');
        a.addEventListener('click', closeMenu);
        mobileLinks.appendChild(a);
      });
    };

    const openMenu = () => {
      populateLinks();
      shell.classList.add('open');
      shell.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.classList.add('open');
      document.body.classList.add('nav-locked');
      setLabel('Tutup');
      const headerEl = document.querySelector('.site-header'); if (headerEl) headerEl.style.zIndex = '0';
      mobileLinks?.querySelector('a')?.focus();
    };

    toggle.addEventListener('click', () => {
      const isOpen = shell.classList.contains('open');
      if (isOpen) closeMenu(); else openMenu();
    });

    dim?.addEventListener('click', closeMenu);

    // close with Escape key when open
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && shell.classList.contains('open')) {
        closeMenu();
      }
    });

    // ensure menu closes when resizing to desktop width
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && shell.classList.contains('open')) {
        closeMenu();
      }
    });

    // expose helpers for other handlers
    closeMobileMenu = closeMenu;
    isMobileMenuOpen = () => shell.classList.contains('open');
  }

  // Home: show latest 3 announcements (with mobile "Lihat lebih" expansion)
  const latestEl = document.getElementById('latest-list');
  if (latestEl) {
    let announcementsCache = null;
    const lihatBtn = document.getElementById('lihatLebihBtn');
    let expanded = false;

    const renderTop = (items) => {
      const top = items.slice(0, 3);
      latestEl.innerHTML = top.map(item => `
        <li>
          <strong>${item.title}</strong>
          <span class="meta"> — ${item.date}</span>
          ${item.link ? ` | <a href="${item.link}" target="_blank" rel="noopener">Baca</a>` : ''}
        </li>
      `).join('');
    };

    const appendRest = (items) => {
      const rest = items.slice(3);
      if (!rest.length) {
        // no extra items — go to announcements page
        window.location.href = 'announcements.html';
        return;
      }
      rest.forEach((item, i) => {
        const li = document.createElement('li');
        li.className = 'new';
        li.innerHTML = `<strong>${item.title}</strong> <span class="meta"> — ${item.date}</span> ${item.link ? ` | <a href="${item.link}" target="_blank" rel="noopener">Baca</a>` : ''} <div class="meta">${item.summary || ''}</div>`;
        latestEl.appendChild(li);
        setTimeout(() => li.classList.add('visible'), 60 * i + 20);
      });
      latestEl.classList.add('expanded');
    };

    fetch('data/announcements.json')
      .then(r => r.json())
      .then(items => {
        announcementsCache = items;
        renderTop(items);
      })
      .catch(() => {
        latestEl.innerHTML = '<li>Tiada notis buat masa ini.</li>';
      });

    if (lihatBtn) {
      lihatBtn.addEventListener('click', async () => {
        if (!expanded) {
          const items = announcementsCache || await fetch('data/announcements.json').then(r=>r.json()).catch(()=>[]);
          appendRest(items);
          lihatBtn.textContent = 'Tutup';
          lihatBtn.setAttribute('aria-expanded', 'true');
          lihatBtn.classList.add('is-open');
          expanded = true;
        } else {
          latestEl.querySelectorAll('li.new').forEach(li => li.remove());
          latestEl.classList.remove('expanded');
          lihatBtn.textContent = 'Lihat lebih';
          lihatBtn.setAttribute('aria-expanded', 'false');
          lihatBtn.classList.remove('is-open');
          expanded = false;
        }
      });
    }
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
      // close mobile menu if open
      if (isMobileMenuOpen()) closeMobileMenu();
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

        // Make shortcut links reliably responsive (close overlays / nav if still open)
        shortcutsGrid.addEventListener('click', (e) => {
          const a = e.target.closest('a.card.shortcut');
          if (!a) return;
          if (isMobileMenuOpen()) closeMobileMenu();
          // allow default navigation to proceed
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

  // Init tsparticles for hero (subtle, low-cost particle effect)
  try {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smallScreen = window.innerWidth && window.innerWidth < 420;
    if (!prefersReduced && !smallScreen && document.getElementById('tsparticles') && window.tsParticles){
      tsParticles.load('tsparticles', {
        particles: {
          number: { value: 30, density: { enable: true, area: 800 } },
          color: { value: '#ffffff' },
          shape: { type: 'circle' },
          opacity: { value: 0.12 },
          size: { value: { min: 1, max: 4 } },
          move: { enable: true, speed: 0.6, direction: 'none', outModes: { default: 'out' } },
          links: { enable: true, distance: 120, color: '#ffffff', opacity: 0.06, width: 1 }
        },
        interactivity: {
          events: { onHover: { enable: true, mode: 'repulse' }, onClick: { enable: false } },
          modes: { repulse: { distance: 70 } }
        },
        detectRetina: true,
        fullScreen: { enable: false }
      });
    }
  } catch (e) {
    // fail silently if particles lib is missing or errors
    // console.debug('tsparticles init failed', e);
  }
});
