document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
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
