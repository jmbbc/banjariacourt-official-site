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

  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) nav.querySelector('a')?.focus();
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
});
