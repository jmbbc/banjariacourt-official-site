// Global admin-mode toggle button in the header
// Always visible; only allowlisted admin can activate it. Dispatches an event for CMS sections.

import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

const ADMIN_EMAIL = 'jmbbanjariacourt.agm@gmail.com';
const BTN_ID = 'adminModeBtn';
const LOGIN_BTN_ID = 'adminLoginBtn';
const LOGOUT_BTN_ID = 'adminLogoutBtn';
const STORAGE_KEY = 'bc-admin-mode';
let adminMode = false;
let isAdmin = false;
const auth = window.__AUTH;

function ensureButton() {
  const headerWrap = document.querySelector('.header-wrap');
  if (!headerWrap) return null;
  let btn = document.getElementById(BTN_ID);
  if (!btn) {
    btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.className = 'admin-toggle admin-btn';
    btn.innerHTML = '<span class="toggle-label">Admin</span><span class="toggle-knob" aria-hidden="true"></span>';
    // Keep the toggle hidden by default so it doesn't clutter the header for non-admin users
    btn.style.display = 'none';
    headerWrap.appendChild(btn);
  }
  return btn;
}

function ensureLoginButtons() {
  const headerWrap = document.querySelector('.header-wrap');
  const navEl = document.getElementById('nav');
  // Prefer to place login/logout inside the site nav (works well for mobile menu). Fallback to header if nav isn't present.
  const container = navEl || headerWrap;
  if (!headerWrap && !navEl) return { loginBtn: null, logoutBtn: null };

  let loginBtn = document.getElementById(LOGIN_BTN_ID);
  if (!loginBtn) {
    loginBtn = document.createElement('button');
    loginBtn.id = LOGIN_BTN_ID;
    loginBtn.type = 'button';
    loginBtn.className = 'btn ghost admin-btn';
    loginBtn.textContent = 'Login Admin';
    container.appendChild(loginBtn);
  }

  let logoutBtn = document.getElementById(LOGOUT_BTN_ID);
  if (!logoutBtn) {
    logoutBtn = document.createElement('button');
    logoutBtn.id = LOGOUT_BTN_ID;
    logoutBtn.type = 'button';
    logoutBtn.className = 'btn ghost admin-btn';
    logoutBtn.textContent = 'Logout';
    logoutBtn.style.display = 'none';
    container.appendChild(logoutBtn);
  }

  return { loginBtn, logoutBtn };
}

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
    // insert after the nav-toggle if present, otherwise append to headerWrap
    const after = headerWrap.querySelector('.nav-toggle');
    if (after && after.parentElement) after.parentElement.insertBefore(icon, after.nextSibling);
    else headerWrap.appendChild(icon);
  }
  return icon;
}

function emit(mode) {
  window.dispatchEvent(new CustomEvent('admin-mode-changed', { detail: { enabled: mode } }));
}

function setAdminMode(on) {
  adminMode = !!on;
  document.body.dataset.adminMode = adminMode ? 'on' : 'off';
  const btn = ensureButton();
  if (btn) {
    btn.classList.toggle('on', adminMode);
    btn.setAttribute('aria-pressed', String(adminMode));
  }
  const icon = document.getElementById('adminIconBtn');
  if (icon) icon.classList.toggle('on', adminMode);
  try {
    if (adminMode && isAdmin) {
      localStorage.setItem(STORAGE_KEY, '1');
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) { /* ignore storage errors */ }
  emit(adminMode);
}

function init() {
  const btn = ensureButton();
  const { loginBtn, logoutBtn } = ensureLoginButtons();
  const adminIcon = ensureAdminIcon();
  if (!auth || !btn) return;

  btn.addEventListener('click', () => {
    if (!isAdmin) { alert('Log masuk sebagai admin untuk guna Admin Mode.'); return; }
    setAdminMode(!adminMode);
  });

  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      if (!auth) return;
      const email = prompt('Emel admin:');
      if (!email) return;
      const pass = prompt('Kata laluan:');
      if (!pass) return;
      try {
        loginBtn.textContent = 'Log masuk...';
        await signInWithEmailAndPassword(auth, email.trim(), pass);
      } catch (e) {
        alert(e?.message || 'Gagal log masuk');
      } finally {
        loginBtn.textContent = 'Login Admin';
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await signOut(auth); } catch (e) { console.error(e); }
    });
  }

  // admin icon behavior: always visible in header; uses login/logout/toggle where appropriate
  if (adminIcon) {
    adminIcon.addEventListener('click', () => {
      // Prefer to open login flow if login button is visible
      if (loginBtn && loginBtn.style.display !== 'none') {
        loginBtn.click();
        return;
      }
      // If logged in and logout button visible, offer sign out
      if (logoutBtn && logoutBtn.style.display !== 'none') {
        logoutBtn.click();
        return;
      }
      // If the current user is admin, toggle admin mode
      if (isAdmin) {
        setAdminMode(!adminMode);
        return;
      }
      // default: prompt to login
      alert('Sila log masuk sebagai admin untuk akses admin.');
    });
  }

  onAuthStateChanged(auth, (u) => {
    isAdmin = !!u && u.email === ADMIN_EMAIL;
    if (btn) {
      // show the admin mode toggle only to the actual admin to avoid clutter
      btn.style.display = isAdmin ? 'inline-flex' : 'none';
      btn.title = isAdmin ? 'Tukar Admin Mode' : 'Log masuk admin untuk guna';
    }
    if (loginBtn) loginBtn.style.display = u ? 'none' : 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = u ? 'inline-flex' : 'none';

    const icon = document.getElementById('adminIconBtn');
    if (icon) {
      // icon is always shown, but update label/title and visual flags
      icon.style.display = 'inline-flex';
      icon.setAttribute('aria-label', u ? (isAdmin ? 'Toggle Admin Mode' : 'Log keluar') : 'Login Admin');
      icon.title = u ? (isAdmin ? 'Toggle Admin Mode' : 'Log keluar') : 'Login Admin';
      icon.classList.toggle('is-admin', isAdmin);
      icon.classList.toggle('on', adminMode);
    }

    if (!isAdmin) {
      setAdminMode(false);
    } else {
      // Restore admin mode preference per browser
      try {
        const wasOn = localStorage.getItem(STORAGE_KEY) === '1';
        if (wasOn) setAdminMode(true);
      } catch (e) { /* ignore storage errors */ }
    }
  });
}

init();
