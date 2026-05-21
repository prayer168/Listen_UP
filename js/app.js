import { db, auth, IS_CONFIGURED } from './firebase-config.js';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const ADMIN_EMAIL = 'prayer168@gmail.com';

// State
let allCategories = [];
let currentUser = null;
let voices = [];

// DOM
const $ = id => document.getElementById(id);
const phraseList    = $('phrase-list');
const searchInput   = $('search-input');
const customInput   = $('custom-input');
const displayBtn    = $('display-btn');
const saveBtn       = $('save-btn');
const overlay       = $('fullscreen-overlay');
const fullscreenText     = $('fullscreen-text');
const fullscreenCategory = $('fullscreen-category');
const closeBtn      = $('close-btn');
const loginBtn      = $('login-btn');
const logoutBtn     = $('logout-btn');
const userDisplay   = $('user-display');

// ── TTS ──────────────────────────────────────────────────────────────────────
speechSynthesis.addEventListener('voiceschanged', () => {
  voices = speechSynthesis.getVoices();
});

function speak(text) {
  if (!text?.trim()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-TW';
  u.rate = 0.85;
  const zhVoice = voices.find(v => v.lang === 'zh-TW' || v.lang.startsWith('zh'));
  if (zhVoice) u.voice = zhVoice;
  speechSynthesis.speak(u);
}

// ── Fullscreen ────────────────────────────────────────────────────────────────
function fitText(el) {
  const maxW = window.innerWidth  * 0.88;
  const maxH = window.innerHeight * 0.70;
  const len  = el.textContent.length;

  let size = Math.min(
    maxW / Math.max(len * 0.55, 2),
    maxH * (len <= 4 ? 0.82 : len <= 10 ? 0.58 : len <= 20 ? 0.38 : 0.28),
    220
  );
  size = Math.max(size, 28);
  el.style.fontSize = size + 'px';

  for (let i = 0; i < 25 && (el.scrollWidth > maxW || el.scrollHeight > maxH); i++) {
    size *= 0.9;
    el.style.fontSize = size + 'px';
  }
}

function showFullscreen(text, catName = '') {
  fullscreenText.textContent = text;
  fullscreenCategory.textContent = catName;
  fullscreenCategory.style.display = catName ? '' : 'none';
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => fitText(fullscreenText));
  speak(text);
}

function hideFullscreen() {
  overlay.classList.add('hidden');
  document.body.style.overflow = '';
  speechSynthesis.cancel();
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function renderFiltered(q) {
  q = q.toLowerCase().trim();
  const cats = q
    ? allCategories
        .map(c => ({ ...c, phrases: c.phrases.filter(p => p.text.includes(q)) }))
        .filter(c => c.phrases.length)
    : allCategories;

  if (cats.length === 0) {
    phraseList.innerHTML = `<div class="no-results">找不到「${q}」相關用語</div>`;
    return;
  }

  phraseList.innerHTML = '';
  cats.forEach(cat => {
    const section = document.createElement('div');
    section.className = 'category-section';
    section.innerHTML = `
      <div class="category-header" style="border-left:3px solid ${cat.color}">
        <div class="category-name">
          <span class="category-dot" style="background:${cat.color}"></span>
          ${cat.name}
        </div>
        <div class="category-right">
          <span class="category-count">${cat.phrases.length}</span>
          <span class="category-toggle">▾</span>
        </div>
      </div>
      <div class="category-phrases" style="max-height:2000px">
        ${cat.phrases.map(p => `
          <div class="phrase-item"
               style="--accent:${cat.color};--hover-bg:${cat.color}12"
               data-text="${p.text.replace(/"/g, '&quot;')}"
               data-cat="${cat.name}">
            ${p.text}
          </div>`).join('')}
      </div>`;

    const header    = section.querySelector('.category-header');
    const phrasesEl = section.querySelector('.category-phrases');
    const toggle    = section.querySelector('.category-toggle');

    header.addEventListener('click', () => {
      const collapsed = section.classList.toggle('collapsed');
      phrasesEl.style.maxHeight = collapsed ? '0' : '2000px';
      toggle.textContent = collapsed ? '▸' : '▾';
    });

    section.querySelectorAll('.phrase-item').forEach(item =>
      item.addEventListener('click', () =>
        showFullscreen(item.dataset.text, item.dataset.cat))
    );

    phraseList.appendChild(section);
  });
}

function renderSidebar(cats) {
  allCategories = cats;
  renderFiltered(searchInput.value);
}

// ── Data Loading ──────────────────────────────────────────────────────────────
async function loadFromJSON() {
  try {
    const res  = await fetch('data/phrases.json');
    const data = await res.json();
    renderSidebar(data.categories.map(cat => ({
      ...cat,
      phrases: cat.phrases.map((text, i) => ({ id: `${cat.id}_${i}`, text }))
    })));
  } catch {
    phraseList.innerHTML = '<div class="no-results">無法載入資料，請重新整理頁面。</div>';
  }
}

function loadPhrases() {
  phraseList.innerHTML = '<div class="loading">載入中…</div>';

  if (IS_CONFIGURED && db) {
    try {
      const q = query(collection(db, 'phrases'), orderBy('categoryId'), orderBy('order'));
      onSnapshot(q, snap => {
        if (snap.empty) { loadFromJSON(); return; }
        const catMap = new Map();
        snap.docs.forEach(d => {
          const v = d.data();
          if (!catMap.has(v.categoryId)) {
            catMap.set(v.categoryId, { id: v.categoryId, name: v.categoryName, color: v.categoryColor, phrases: [] });
          }
          catMap.get(v.categoryId).phrases.push({ id: d.id, text: v.text });
        });
        renderSidebar(Array.from(catMap.values()));
      }, () => loadFromJSON());
      return;
    } catch { /* fallthrough */ }
  }
  loadFromJSON();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function updateAuthUI(user) {
  currentUser = user;
  const isAdmin = user?.email === ADMIN_EMAIL;
  if (userDisplay) userDisplay.textContent = isAdmin ? (user.displayName || user.email) : '';
  loginBtn?.classList.toggle('hidden', isAdmin);
  logoutBtn?.classList.toggle('hidden', !isAdmin);
  saveBtn?.classList.toggle('hidden', !isAdmin || !db);
}

// ── Save Modal ────────────────────────────────────────────────────────────────
function showSaveModal(text) {
  document.getElementById('save-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'save-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <h3>儲存至用語列表</h3>
      <div class="modal-preview">"${text}"</div>
      <div class="form-group">
        <label>選擇分類</label>
        <select id="save-cat-sel" class="form-control">
          ${allCategories.map(c =>
            `<option value="${c.id}" data-name="${c.name}" data-color="${c.color}">${c.name}</option>`
          ).join('')}
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn btn-cancel" id="modal-cancel">取消</button>
        <button class="btn btn-primary" id="modal-ok">儲存</button>
      </div>
    </div>`;

  document.body.appendChild(modal);

  modal.querySelector('#modal-cancel').addEventListener('click', () => modal.remove());
  modal.querySelector('#modal-ok').addEventListener('click', async () => {
    const sel = modal.querySelector('#save-cat-sel');
    const opt = sel.options[sel.selectedIndex];
    try {
      await addDoc(collection(db, 'phrases'), {
        text, categoryId: sel.value,
        categoryName: opt.dataset.name,
        categoryColor: opt.dataset.color,
        order: 999,
        createdAt: serverTimestamp(),
        createdBy: currentUser.email
      });
      modal.remove();
    } catch (e) { alert('儲存失敗：' + e.message); }
  });
}

// ── Events ────────────────────────────────────────────────────────────────────
displayBtn.addEventListener('click', () => {
  const t = customInput.value.trim();
  if (t) showFullscreen(t);
});

saveBtn?.addEventListener('click', () => {
  const t = customInput.value.trim();
  if (t && db && currentUser) showSaveModal(t);
});

customInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    const t = customInput.value.trim();
    if (t) showFullscreen(t);
  }
});

overlay.addEventListener('click', e => {
  if (e.target === overlay || e.target.classList.contains('fullscreen-bg') ||
      e.target.classList.contains('fullscreen-content')) {
    hideFullscreen();
  } else {
    speak(fullscreenText.textContent);
  }
});

closeBtn.addEventListener('click', e => { e.stopPropagation(); hideFullscreen(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') hideFullscreen(); });
searchInput.addEventListener('input', e => renderFiltered(e.target.value));

loginBtn?.addEventListener('click', async () => {
  if (!auth) return;
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch (e) { console.warn('登入：', e.message); }
});

logoutBtn?.addEventListener('click', () => auth && signOut(auth));

// ── Init ──────────────────────────────────────────────────────────────────────
if (auth) onAuthStateChanged(auth, updateAuthUI);
else updateAuthUI(null);

loadPhrases();
speechSynthesis.getVoices(); // Trigger voice preload
