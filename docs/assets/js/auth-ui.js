// Simple Login UI for Firebase Email/Password
// Renders a Login/Logout control into #authWidget

import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

const auth = window.__AUTH;

function render(container, state){
  const email = state?.email || '';
  const loggedIn = !!state;
  container.innerHTML = loggedIn ? `
    <span class="auth-status">Masuk: ${email}</span>
    <button id="logoutBtn" class="btn-ghost" title="Log keluar">Log Keluar</button>
  ` : `
    <details class="auth-login">
      <summary class="btn">Log Masuk</summary>
      <div class="auth-form">
        <input id="loginEmail" class="input" type="email" placeholder="Emel" autocomplete="username">
        <input id="loginPassword" class="input" type="password" placeholder="Kata Laluan" autocomplete="current-password">
        <button id="loginBtn" class="btn primary">Masuk</button>
        <small id="authMsg" class="muted-small" role="status" aria-live="polite"></small>
      </div>
    </details>
  `;

  const loginBtn = container.querySelector('#loginBtn');
  const logoutBtn = container.querySelector('#logoutBtn');
  const emailInput = container.querySelector('#loginEmail');
  const passInput = container.querySelector('#loginPassword');
  const msg = container.querySelector('#authMsg');

  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      try {
        if (msg) msg.textContent = 'Mencuba log masuk…';
        const email = (emailInput?.value || '').trim();
        const pass = passInput?.value || '';
        if (!email || !pass) { if (msg) msg.textContent = 'Sila isi emel dan kata laluan.'; return; }
        await signInWithEmailAndPassword(auth, email, pass);
        if (msg) msg.textContent = '';
      } catch (e) {
        if (msg) msg.textContent = e.message || 'Gagal log masuk.';
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await signOut(auth); } catch (e) { console.error(e); }
    });
  }
}

function init(){
  const container = document.getElementById('authWidget');
  if (!container || !auth) return;
  onAuthStateChanged(auth, (u) => {
    render(container, u ? { email: u.email } : null);
  });
}

init();
