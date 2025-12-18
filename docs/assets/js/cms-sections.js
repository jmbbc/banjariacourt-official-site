// Generic CMS scaffolding for section pages
// Uses Firestore doc at content/{sectionId} to store an array of items.
// Falls back to local JSON if Firestore doc is empty. Admin only save (email allowlist).

import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const ADMIN_EMAIL = 'jmbbanjariacourt.agm@gmail.com';

export function initSection({ sectionId, targetEl, renderItems, fallbackUrl }) {
  const db = window.__FIRESTORE;
  const auth = window.__AUTH;
  if (!targetEl) return;

  const bar = document.createElement('div');
  bar.className = 'cms-bar';
  bar.innerHTML = `
    <button class="btn" id="cmsEdit-${sectionId}" style="display:none">Edit / Tambah</button>
    <button class="btn" id="cmsSave-${sectionId}" style="display:none">Simpan ke Firestore</button>
    <span class="muted-small" id="cmsStatus-${sectionId}"></span>
    <div class="cms-editor" id="cmsEditor-${sectionId}" style="display:none">
      <label class="muted-small">Edit JSON data untuk ${sectionId}</label>
      <textarea rows="12" spellcheck="false"></textarea>
    </div>
  `;
  targetEl.parentNode.insertBefore(bar, targetEl);

  const editBtn = bar.querySelector(`#cmsEdit-${sectionId}`);
  const saveBtn = bar.querySelector(`#cmsSave-${sectionId}`);
  const statusEl = bar.querySelector(`#cmsStatus-${sectionId}`);
  const editorWrap = bar.querySelector(`#cmsEditor-${sectionId}`);
  const textarea = editorWrap.querySelector('textarea');

  let items = [];

  function setStatus(msg, ok = true) {
    if (!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.style.color = ok ? 'var(--muted, #64748b)' : '#b42318';
  }

  function render() {
    try {
      renderItems(Array.isArray(items) ? items : []);
    } catch (e) {
      console.error('renderItems error', e);
    }
  }

  function openEditor() {
    textarea.value = JSON.stringify(items || [], null, 2);
    editorWrap.style.display = 'block';
    saveBtn.style.display = 'inline-block';
  }

  async function load() {
    setStatus('Memuat...');
    try {
      let fallbackData = [];
      if (fallbackUrl) {
        try {
          const res = await fetch(fallbackUrl);
          if (res.ok) fallbackData = await res.json();
        } catch (e) {
          console.warn('Fallback fetch failed', e);
        }
      }

      if (db) {
        try {
          const ref = doc(db, 'content', sectionId);
          const snap = await getDoc(ref);
          if (snap.exists() && Array.isArray(snap.data().items)) {
            items = snap.data().items;
          } else {
            items = fallbackData;
          }
        } catch (e) {
          console.warn('Firestore load failed, using fallback', e);
          items = fallbackData;
        }
      } else {
        items = fallbackData;
      }
      render();
      setStatus('');
    } catch (e) {
      console.error('load error', e);
      setStatus('Gagal memuat data.', false);
    }
  }

  async function save() {
    try {
      setStatus('Menyimpan...');
      const user = auth?.currentUser;
      if (!user) { setStatus('Perlu log masuk untuk simpan.', false); return; }
      const parsed = JSON.parse(textarea.value || '[]');
      if (!Array.isArray(parsed)) throw new Error('Data mesti dalam bentuk array.');
      if (!db) throw new Error('Firestore tidak tersedia.');
      const ref = doc(db, 'content', sectionId);
      await setDoc(ref, {
        items: parsed,
        updatedAt: serverTimestamp(),
        updatedBy: user.email || user.uid
      }, { merge: true });
      items = parsed;
      render();
      setStatus('Disimpan.');
    } catch (e) {
      console.error('save error', e);
      setStatus(e.message || 'Gagal simpan.', false);
    }
  }

  editBtn.addEventListener('click', openEditor);
  saveBtn.addEventListener('click', save);

  onAuthStateChanged(auth, (u) => {
    const isAdmin = !!u && (u.email === ADMIN_EMAIL);
    editBtn.style.display = isAdmin ? 'inline-block' : 'none';
    saveBtn.style.display = (isAdmin && editorWrap.style.display === 'block') ? 'inline-block' : 'none';
    if (!isAdmin) {
      editorWrap.style.display = 'none';
      saveBtn.style.display = 'none';
    }
  });

  load();
}
