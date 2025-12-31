// Global admin-mode toggle button in the header
// Always visible; only allowlisted admin can activate it. Dispatches an event for CMS sections.

import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

const ADMIN_EMAIL = 'jmbbanjariacourt.agm@gmail.com';
const STORAGE_KEY = 'bc-admin-mode';
let adminMode = false;
let isAdmin = false;
const auth = window.__AUTH;

let panel, panelCard, panelLoginBtn, panelLogoutBtn, panelToggleBtn, panelCloseBtn, panelEmail, panelPass, panelMsg, panelStatus;
let pendingToggleDesired = null;

function ensureAdminIcon() {
  const headerWrap = document.querySelector('.header-wrap');
  if (!headerWrap) return null;
  let icon = document.getElementById('adminIconBtn');
  if (!icon) {
    icon = document.createElement('button');
    icon.id = 'adminIconBtn';
    icon.type = 'button';
    icon.className = 'admin-icon';
    icon.setAttribute('aria-label', 'Login Admin');
    icon.title = 'Login Admin';
    icon.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M7 11V8a5 5 0 0110 0v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const after = headerWrap.querySelector('.nav-toggle');
    if (after && after.parentElement) after.parentElement.insertBefore(icon, after.nextSibling);
    else headerWrap.appendChild(icon);
  }
  return icon;
}

function ensurePanel() {
  if (panel) return panel;
  panel = document.createElement('div');
  panel.className = 'admin-panel';
  panel.innerHTML = `
    <div class="admin-panel__card" role="dialog" aria-modal="true" aria-labelledby="adminPanelTitle">
      <header class="admin-panel__header">
        <div>
          <p id="adminPanelStatus" class="admin-panel__status">Log masuk untuk mod admin.</p>
          <h2 id="adminPanelTitle">Panel Admin</h2>
        </div>
        <button type="button" class="admin-panel__close" aria-label="Tutup panel">×</button>
      </header>
      <div class="admin-panel__body">
        <section class="admin-panel__section" id="adminPanelLoginSection">
          <label class="admin-panel__label" for="adminPanelEmail">Emel</label>
          <input id="adminPanelEmail" class="admin-panel__input" type="email" autocomplete="username" placeholder="admin@example.com">
          <label class="admin-panel__label" for="adminPanelPass">Kata laluan</label>
          <input id="adminPanelPass" class="admin-panel__input" type="password" autocomplete="current-password" placeholder="••••••••">
          <button id="adminPanelLoginBtn" class="admin-panel__btn admin-panel__btn-primary" type="button">Log Masuk</button>
          <small id="adminPanelMsg" class="admin-panel__msg" role="status" aria-live="polite"></small>
        </section>

        <section class="admin-panel__section" id="adminPanelControls" hidden>
          <div class="admin-panel__toggle-row">
            <div>
              <p class="admin-panel__label">Admin Mode</p>
              <small class="admin-panel__hint">ON untuk edit/tambah kandungan.</small>
            </div>
            <button id="adminPanelToggleBtn" class="admin-panel__btn-toggle" type="button" aria-pressed="false">OFF</button>
          </div>
          <button id="adminPanelLogoutBtn" class="admin-panel__btn" type="button">Log Keluar</button>
        </section>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  panelCard = panel.querySelector('.admin-panel__card');
  panelLoginBtn = panel.querySelector('#adminPanelLoginBtn');
  panelLogoutBtn = panel.querySelector('#adminPanelLogoutBtn');
  panelToggleBtn = panel.querySelector('#adminPanelToggleBtn');
  panelCloseBtn = panel.querySelector('.admin-panel__close');
  panelEmail = panel.querySelector('#adminPanelEmail');
  panelPass = panel.querySelector('#adminPanelPass');
  panelMsg = panel.querySelector('#adminPanelMsg');
  panelStatus = panel.querySelector('#adminPanelStatus');

  panel.addEventListener('click', (e) => {
    if (e.target === panel) closePanel();
  });
  panelCloseBtn?.addEventListener('click', closePanel);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
  });

  return panel;
}

function openPanel() {
  ensurePanel();
  if (!panel) return;
  panel.classList.add('open');
  document.body.classList.add('admin-panel-open');
  if (isAdmin) {
    panelToggleBtn?.focus();
  } else {
    panelEmail?.focus();
  }
}

function closePanel() {
  if (!panel) return;
  panel.classList.remove('open');
  document.body.classList.remove('admin-panel-open');
}

function emit(mode) {
  window.dispatchEvent(new CustomEvent('admin-mode-changed', { detail: { enabled: mode } }));
}

function setAdminMode(on) {
  adminMode = !!on;
  document.body.dataset.adminMode = adminMode ? 'on' : 'off';
  const icon = document.getElementById('adminIconBtn');
  if (icon) icon.classList.toggle('on', adminMode);
  if (panelToggleBtn) {
    panelToggleBtn.textContent = adminMode ? 'ON' : 'OFF';
    panelToggleBtn.setAttribute('aria-pressed', String(adminMode));
    panelToggleBtn.classList.toggle('is-on', adminMode);
  }
  try {
    if (adminMode && isAdmin) {
      localStorage.setItem(STORAGE_KEY, '1');
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) { /* ignore storage errors */ }
  emit(adminMode);
}

function refreshPanelView(user) {
  if (!panel) return;
  const controls = panel.querySelector('#adminPanelControls');
  const loginSection = panel.querySelector('#adminPanelLoginSection');
  if (panelStatus) {
    if (isAdmin) panelStatus.textContent = 'Log masuk sebagai admin.';
    else if (user) panelStatus.textContent = 'Akaun ini bukan admin.';
    else panelStatus.textContent = 'Log masuk untuk mod admin.';
  }
  if (controls) controls.hidden = !isAdmin;
  if (loginSection) loginSection.hidden = isAdmin;
  if (!isAdmin && user) {
    if (panelMsg) panelMsg.textContent = 'Akaun ini tidak dibenarkan sebagai admin.';
  } else if (panelMsg) {
    panelMsg.textContent = '';
  }
}

function init() {
  const adminIcon = ensureAdminIcon();
  ensurePanel();
  if (!auth) return;

  if (adminIcon) {
    adminIcon.addEventListener('click', () => {
      openPanel();
    });
  }

  panelLoginBtn?.addEventListener('click', async () => {
    if (!auth) return;
    const email = (panelEmail?.value || '').trim();
    const pass = panelPass?.value || '';
    if (!email || !pass) { if (panelMsg) panelMsg.textContent = 'Sila isi emel dan kata laluan.'; return; }
    try {
      if (panelMsg) panelMsg.textContent = 'Mencuba log masuk…';
      await signInWithEmailAndPassword(auth, email, pass);
      if (panelMsg) panelMsg.textContent = '';
    } catch (e) {
      if (panelMsg) panelMsg.textContent = e?.message || 'Gagal log masuk.';
    }
  });

  panelLogoutBtn?.addEventListener('click', async () => {
    try { await signOut(auth); closePanel(); } catch (e) { console.error(e); }
  });

  panelToggleBtn?.addEventListener('click', () => {
    const desired = !adminMode;
    if (!isAdmin) {
      pendingToggleDesired = desired;
      if (panelMsg) panelMsg.textContent = 'Log masuk sebagai admin untuk teruskan.';
      panelEmail?.focus();
      return;
    }
    pendingToggleDesired = null;
    setAdminMode(desired);
  });

  onAuthStateChanged(auth, (u) => {
    isAdmin = !!u && u.email === ADMIN_EMAIL;

    const icon = document.getElementById('adminIconBtn');
    if (icon) {
      icon.style.display = 'inline-flex';
      icon.setAttribute('aria-label', u ? (isAdmin ? 'Panel Admin' : 'Log keluar') : 'Login Admin');
      icon.title = u ? (isAdmin ? 'Panel Admin' : 'Log keluar') : 'Login Admin';
      icon.classList.toggle('is-admin', isAdmin);
      icon.classList.toggle('on', adminMode);
    }

    if (!isAdmin) {
      setAdminMode(false);
    } else {
      try {
        const wasOn = localStorage.getItem(STORAGE_KEY) === '1';
        if (wasOn) setAdminMode(true);
      } catch (e) { /* ignore */ }
      if (pendingToggleDesired !== null) {
        setAdminMode(pendingToggleDesired);
        pendingToggleDesired = null;
      }
    }

    refreshPanelView(u);
  });
}

init();
