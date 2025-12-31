// Generic CMS scaffolding for section pages
// Uses Firestore doc at content/{sectionId} to store an array of items.
// Falls back to local JSON if Firestore doc is empty. Admin only save (email allowlist).
// Supports a user-friendly form editor when `fields` are provided; otherwise falls back to JSON textarea.

import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const ADMIN_EMAILS = ['jmbbanjariacourt.agm@gmail.com', 'jmbbanjariacourt.agm2@gmail.com'];

export function initSection({ sectionId, targetEl, renderItems, fallbackUrl, fields, newItemButtonLabel = '', newItemDefaults = {}, showEditButton = true }) {
  const db = window.__FIRESTORE;
  const auth = window.__AUTH;
  if (!targetEl) return;

  // Action buttons container (outside bar as requested)
  const actions = document.createElement('div');
  actions.className = 'cms-actions';
  actions.innerHTML = `
    ${showEditButton ? `<button class="btn" id="cmsEdit-${sectionId}" style="display:none">Edit / Tambah</button>` : ''}
    <button class="btn ghost" id="cmsNew-${sectionId}" style="display:none">${newItemButtonLabel || 'Tambah Item'}</button>
  `;

  const bar = document.createElement('div');
  bar.className = 'cms-bar';
  bar.innerHTML = `
    <button class="btn" id="cmsSave-${sectionId}" style="display:none">Save</button>
    <button class="btn ghost" id="cmsDelete-${sectionId}" style="display:none">Delete</button>
    <span class="muted-small" id="cmsStatus-${sectionId}"></span>
    <div class="cms-editor" id="cmsEditor-${sectionId}" style="display:none"></div>
  `;

  targetEl.parentNode.insertBefore(actions, targetEl);
  targetEl.parentNode.insertBefore(bar, targetEl);

  const editBtn = showEditButton ? actions.querySelector(`#cmsEdit-${sectionId}`) : null;
  const newBtn = actions.querySelector(`#cmsNew-${sectionId}`);
  const saveBtn = bar.querySelector(`#cmsSave-${sectionId}`);
  const deleteBtn = bar.querySelector(`#cmsDelete-${sectionId}`);
  const statusEl = bar.querySelector(`#cmsStatus-${sectionId}`);
  const editorWrap = bar.querySelector(`#cmsEditor-${sectionId}`);

  let items = [];
  let isAdmin = false;
  let lastUpdated = null;
  let adminMode = false;
  let newItemEditor = null;

  function updateControls() {
    if (editBtn) editBtn.style.display = (isAdmin && adminMode) ? 'inline-block' : 'none';
    if (newBtn) newBtn.style.display = (isAdmin && adminMode) ? 'inline-block' : 'none';
    saveBtn.style.display = (isAdmin && adminMode && editorWrap.style.display === 'block') ? 'inline-block' : 'none';
    if (deleteBtn) deleteBtn.style.display = (isAdmin && adminMode && editorWrap.style.display === 'block') ? 'inline-block' : 'none';
  }

  function setStatus(msg, ok = true) {
    if (!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.style.color = ok ? 'var(--muted, #64748b)' : '#b42318';
    if (lastUpdated) statusEl.textContent += msg ? ` | Terakhir dikemas kini: ${lastUpdated}` : `Terakhir dikemas kini: ${lastUpdated}`;
  }

  function render() {
    try {
      renderItems(Array.isArray(items) ? items : []);
      attachInlineButtons();
    } catch (e) {
      console.error('renderItems error', e);
    }
  }

  function attachInlineButtons() {
    const children = Array.from(targetEl.children || []);
    const shouldShow = isAdmin && adminMode;
    children.forEach((el, idx) => {
      if (!shouldShow) {
        const existing = el.querySelector('.cms-inline-btn');
        if (existing) existing.remove();
        const editor = el.querySelector('.cms-inline-editor');
        if (editor) editor.remove();
        el.classList.remove('cms-inline-wrapper');
        return;
      }
      el.classList.add('cms-inline-wrapper');
      let btn = el.querySelector('.cms-inline-btn');
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cms-inline-btn';
        btn.title = 'Edit item ini';
        btn.textContent = '✎';
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          openInlineEditor(el, idx);
        });
        el.appendChild(btn);
      }
    });
  }

  function buildInlineEditorContent(wrap, seed = {}, onSave, onDelete) {
    wrap.innerHTML = '';
    (fields || []).forEach(f => {
      const row = document.createElement('div');
      row.className = 'form-row';
      const label = document.createElement('label');
      label.textContent = f.label || f.name;
      const input = f.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
      input.dataset.field = f.name;
      input.value = seed[f.name] || '';
      if (f.type && f.type !== 'textarea') input.type = f.type === 'list' ? 'text' : f.type;
      if (f.placeholder) input.placeholder = f.placeholder;
      if (f.type === 'textarea') input.rows = 3;
      if (f.type === 'list') {
        input.value = Array.isArray(seed[f.name]) ? seed[f.name].join('\n') : '';
      }
      row.appendChild(label);
      row.appendChild(input);
      wrap.appendChild(row);
    });

    const actionRow = document.createElement('div');
    actionRow.className = 'cms-inline-actions';
    const saveOne = document.createElement('button');
    saveOne.type = 'button';
    saveOne.className = 'btn primary';
    saveOne.textContent = 'Save';
    saveOne.addEventListener('click', onSave);
    actionRow.appendChild(saveOne);

    if (onDelete) {
      const deleteOne = document.createElement('button');
      deleteOne.type = 'button';
      deleteOne.className = 'btn ghost';
      deleteOne.textContent = 'Delete';
      deleteOne.addEventListener('click', onDelete);
      actionRow.appendChild(deleteOne);
    }

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'btn ghost';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => wrap.remove());
    actionRow.appendChild(cancel);

    wrap.appendChild(actionRow);
  }

  function focusCard(idx) {
    // Wait for form to render
    requestAnimationFrame(() => {
      const cards = editorWrap.querySelectorAll('.cms-card');
      const card = cards[idx];
      if (card) {
        card.classList.add('cms-card-focus');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => card.classList.remove('cms-card-focus'), 1500);
      }
    });
  }

  function openInlineEditor(container, idx) {
    if (!fields || !fields.length) { openEditor(); focusCard(idx); return; }
    const existing = container.querySelector('.cms-inline-editor');
    if (existing) existing.remove();
    const wrap = document.createElement('div');
    wrap.className = 'cms-inline-editor';
    buildInlineEditorContent(wrap, items[idx] || {}, async () => {
      const updated = { ...items[idx] };
      fields.forEach(f => {
        const el = wrap.querySelector(`[data-field="${f.name}"]`);
        if (!el) return;
        if (f.type === 'list') {
          updated[f.name] = (el.value || '').split('\n').map(x => x.trim()).filter(Boolean);
        } else {
          updated[f.name] = el.value || '';
        }
      });
      items[idx] = updated;
      await persist(items);
      wrap.remove();
    }, async () => {
      const ok = confirm('Padam item ini?');
      if (!ok) return;
      items.splice(idx, 1);
      await persist(items);
      wrap.remove();
    });

    container.appendChild(wrap);
    wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function buildForm() {
    if (!fields || !fields.length) {
      // fallback JSON editor
      editorWrap.innerHTML = `<label class="muted-small">Edit data untuk ${sectionId}</label><textarea rows="12" spellcheck="false"></textarea>`;
      const textarea = editorWrap.querySelector('textarea');
      textarea.value = JSON.stringify(items || [], null, 2);
      return;
    }

    editorWrap.innerHTML = '';
    const listWrap = document.createElement('div');
    listWrap.className = 'cms-list';

    (items || []).forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'cms-card';
      fields.forEach(f => {
        const row = document.createElement('div');
        row.className = 'form-row';
        const label = document.createElement('label');
        label.textContent = f.label || f.name;
        const input = f.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
        input.dataset.field = f.name;
        input.value = item[f.name] || '';
        if (f.type && f.type !== 'textarea') input.type = f.type;
        if (f.placeholder) input.placeholder = f.placeholder;
        if (f.type === 'textarea') input.rows = 3;
        if (f.type === 'list') {
          input.tagName === 'TEXTAREA';
          input.value = Array.isArray(item[f.name]) ? item[f.name].join('\n') : '';
        }
        row.appendChild(label);
        row.appendChild(input);
        card.appendChild(row);
      });
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn ghost';
      del.textContent = 'Delete item';
      del.addEventListener('click', () => {
        items.splice(idx, 1);
        buildForm();
      });
      card.appendChild(del);
      listWrap.appendChild(card);
    });

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn';
    addBtn.textContent = 'Tambah Item';
    addBtn.addEventListener('click', () => {
      items.push({});
      buildForm();
    });

    editorWrap.appendChild(listWrap);
    editorWrap.appendChild(addBtn);
  }

  function readFormItems() {
    if (!fields || !fields.length) {
      const textarea = editorWrap.querySelector('textarea');
      return JSON.parse(textarea.value || '[]');
    }
    const cards = Array.from(editorWrap.querySelectorAll('.cms-card'));
    return cards.map(card => {
      const obj = {};
      fields.forEach(f => {
        const el = card.querySelector(`[data-field="${f.name}"]`);
        if (!el) return;
        if (f.type === 'list') {
          const parts = (el.value || '').split('\n').map(x => x.trim()).filter(Boolean);
          obj[f.name] = parts;
        } else {
          obj[f.name] = el.value || '';
        }
      });
      return obj;
    });
  }

  function openEditor() {
    buildForm();
    editorWrap.style.display = 'block';
    saveBtn.style.display = 'inline-block';
    if (deleteBtn) deleteBtn.style.display = 'inline-block';
    attachInlineButtons();
  }

  function closeEditor() {
    editorWrap.style.display = 'none';
    saveBtn.style.display = 'none';
    if (deleteBtn) deleteBtn.style.display = 'none';
    attachInlineButtons();
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
            const ts = snap.data().updatedAt?.toDate?.();
            if (ts) lastUpdated = ts.toLocaleString();
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
      if (!isAdmin) { setStatus('Akses hanya untuk admin.', false); return; }
      if (!adminMode) { setStatus('Hidupkan Admin Mode untuk simpan.', false); return; }
      const parsed = readFormItems();
      if (!Array.isArray(parsed)) throw new Error('Data mesti dalam bentuk array.');
      await persist(parsed);
    } catch (e) {
      console.error('save error', e);
      setStatus(e.message || 'Gagal simpan.', false);
    }
  }

  async function persist(newItems) {
    const user = auth?.currentUser;
    if (!db) throw new Error('Firestore tidak tersedia.');
    if (!isAdmin) throw new Error('Akses hanya untuk admin.');
    if (!adminMode) throw new Error('Admin Mode perlu dihidupkan.');

    // Extra diagnostics: ensure token claims include email and show helpful messages
    try {
      if (user && user.getIdTokenResult) {
        try {
          const idTok = await user.getIdTokenResult(true); // force refresh
          console.debug('persist: idToken claims', { uid: user.uid, email: user.email, claims: idTok.claims });
          // If the token does not contain the expected email, surface a friendly message
          if (idTok.claims && idTok.claims.email !== ADMIN_EMAIL) {
            setStatus(`Akaun ${user.email || user.uid} bukan akaun admin yang dibenarkan. Sila log keluar dan log masuk semula sebagai ${ADMIN_EMAIL}.`, false);
            return;
          }
        } catch (tErr) {
          // Token fetch failed; surface warning but proceed to attempt write (it may still work)
          console.warn('persist: gagal ambil token ID', tErr);
        }
      }
    } catch (diagErr) {
      console.warn('persist diagnostics failed', diagErr);
    }

    const ref = doc(db, 'content', sectionId);
    try {
      await setDoc(ref, {
        items: newItems,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || user?.uid || 'admin'
      }, { merge: true });
      items = newItems;
      render();
      lastUpdated = new Date().toLocaleString();
      setStatus('Disimpan.');
    } catch (e) {
      console.error('persist failed', e, { user: user ? { uid: user.uid, email: user.email } : null, project: window.__APP_PROJECT_ID });
      if (e?.code === 'permission-denied') {
        setStatus('Akses Firestore ditolak. Semak akaun log masuk (haruslah '+ADMIN_EMAIL+') dan peraturan Firestore.', false);
        return;
      }
      throw e;
    }
  }

  async function removeAll() {
    try {
      const user = auth?.currentUser;
      if (!user) { setStatus('Perlu log masuk untuk padam.', false); return; }
      const ok = confirm('Padam semua item untuk seksyen ini?');
      if (!ok) return;
      items = [];
      if (db) {
        const ref = doc(db, 'content', sectionId);
        await setDoc(ref, { items: [], updatedAt: serverTimestamp(), updatedBy: user.email || user.uid }, { merge: true });
      }
      render();
      buildForm();
      lastUpdated = new Date().toLocaleString();
      setStatus('Dipadam.');
    } catch (e) {
      console.error('delete all error', e);
      setStatus(e.message || 'Gagal padam.', false);
    }
  }

  if (editBtn) editBtn.addEventListener('click', openEditor);
  if (newBtn) {
    newBtn.addEventListener('click', () => {
      if (!isAdmin) { alert('Log masuk admin untuk tambah item.'); return; }
      if (!adminMode) { alert('Hidupkan Admin Mode untuk tambah item.'); return; }
      if (!fields || !fields.length) { openEditor(); focusCard(items.length); return; }
      if (newItemEditor) newItemEditor.remove();
      const wrap = document.createElement('div');
      wrap.className = 'cms-inline-editor';
      buildInlineEditorContent(wrap, Object.assign({}, newItemDefaults), async () => {
        const next = Object.assign({}, newItemDefaults);
        fields.forEach(f => {
          const el = wrap.querySelector(`[data-field="${f.name}"]`);
          if (!el) return;
          if (f.type === 'list') {
            next[f.name] = (el.value || '').split('\n').map(x => x.trim()).filter(Boolean);
          } else {
            next[f.name] = el.value || '';
          }
        });
        items.push(next);
        await persist(items);
        wrap.remove();
        newItemEditor = null;
      }, () => {
        wrap.remove();
        newItemEditor = null;
      });
      actions.insertAdjacentElement('afterend', wrap);
      newItemEditor = wrap;
      wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
  saveBtn.addEventListener('click', save);
  if (deleteBtn) deleteBtn.addEventListener('click', removeAll);

  onAuthStateChanged(auth, (u) => {
    isAdmin = !!u && ADMIN_EMAILS.includes(u.email || '');
    if (!isAdmin) closeEditor();
    updateControls();
  });

  // Allow a global admin-mode toggle (e.g., header Admin button) to open/close editors
  window.addEventListener('admin-mode-changed', (ev) => {
    const enabled = !!ev.detail?.enabled;
    adminMode = enabled;
    if (!isAdmin) return;
    if (!enabled) closeEditor();
    attachInlineButtons();
    updateControls();
  });

  load();
}
