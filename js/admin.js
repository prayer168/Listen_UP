import { db, auth, IS_CONFIGURED } from './firebase-config.js';
import { collection, getDocs, addDoc, deleteDoc, doc,
         query, orderBy, serverTimestamp, writeBatch }
  from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const ADMIN_EMAIL = 'prayer168@gmail.com';

const $ = id => document.getElementById(id);
const loginSection    = $('login-section');
const adminSection    = $('admin-section');
const configWarning   = $('config-warning');
const loginBtn        = $('login-btn');
const logoutBtn       = $('logout-btn');
const userInfo        = $('user-info');
const addForm         = $('add-form');
const phraseTableBody = $('phrase-table-body');
const statusMsg       = $('status-msg');
const seedBtn         = $('seed-btn');
const addCatSel       = $('add-cat');

const CATEGORIES = [
  { id: 'before_class',  name: '上課前與進教室',       color: '#3B82F6' },
  { id: 'class_order',   name: '課堂秩序與專心提醒',   color: '#EF4444' },
  { id: 'watching',      name: '觀看影片與聆聽說明',   color: '#8B5CF6' },
  { id: 'discussion',    name: '分組討論與合作學習',   color: '#F59E0B' },
  { id: 'experiment',    name: '實驗操作與安全提醒',   color: '#10B981' },
  { id: 'homework',      name: '作業、習作與檢討',     color: '#EC4899' },
  { id: 'end_class',     name: '下課前整理與離開教室', color: '#6366F1' },
  { id: 'encouragement', name: '鼓勵、提醒與收束語',  color: '#F97316' },
];

let currentUser = null;

// Populate category select
CATEGORIES.forEach(c => {
  addCatSel.innerHTML +=
    `<option value="${c.id}" data-name="${c.name}" data-color="${c.color}">${c.name}</option>`;
});

// ── Status ────────────────────────────────────────────────────────────────────
function showStatus(msg, type = 'success') {
  statusMsg.textContent = msg;
  statusMsg.className = `status-banner ${type}`;
  statusMsg.style.display = 'block';
  setTimeout(() => { statusMsg.style.display = 'none'; }, 3500);
}

// ── Phrase Table ──────────────────────────────────────────────────────────────
async function loadPhrases() {
  if (!db) return;
  phraseTableBody.innerHTML = '<tr><td colspan="3" class="loading">載入中…</td></tr>';
  try {
    const snap = await getDocs(
      query(collection(db, 'phrases'), orderBy('categoryId'), orderBy('order'))
    );
    if (snap.empty) {
      phraseTableBody.innerHTML =
        '<tr><td colspan="3" class="no-results" style="padding:1.5rem;text-align:center">' +
        '尚無用語，請點擊「匯入預設用語」開始使用。</td></tr>';
      return;
    }
    phraseTableBody.innerHTML = '';
    snap.docs.forEach(docSnap => {
      const d   = docSnap.data();
      const cat = CATEGORIES.find(c => c.id === d.categoryId) || { name: d.categoryName, color: '#94a3b8' };
      const tr  = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <span class="category-badge" style="background:${cat.color}18;color:${cat.color}">
            ${d.categoryName}
          </span>
        </td>
        <td>${d.text}</td>
        <td>
          <button class="btn-icon delete" data-id="${docSnap.id}" title="刪除">🗑️</button>
        </td>`;
      tr.querySelector('.delete').addEventListener('click', async () => {
        if (confirm(`確定刪除「${d.text}」？`)) {
          await deleteDoc(doc(db, 'phrases', docSnap.id));
          showStatus('已刪除');
          loadPhrases();
        }
      });
      phraseTableBody.appendChild(tr);
    });
  } catch (e) {
    phraseTableBody.innerHTML =
      `<tr><td colspan="3" style="padding:1rem;color:#ef4444">載入失敗：${e.message}</td></tr>`;
  }
}

// ── Seed Database ─────────────────────────────────────────────────────────────
async function seedDatabase() {
  if (!confirm('確定要匯入所有預設用語嗎？\n（已有的用語不會被刪除）')) return;
  try {
    const res  = await fetch('data/phrases.json');
    const data = await res.json();
    const batch = writeBatch(db);
    let count = 0;
    data.categories.forEach(cat => {
      cat.phrases.forEach((text, i) => {
        const ref = doc(collection(db, 'phrases'));
        batch.set(ref, {
          text, categoryId: cat.id,
          categoryName: cat.name, categoryColor: cat.color,
          order: i + 1, createdAt: serverTimestamp(), createdBy: 'system'
        });
        count++;
      });
    });
    await batch.commit();
    showStatus(`成功匯入 ${count} 筆預設用語`);
    loadPhrases();
  } catch (e) {
    showStatus('匯入失敗：' + e.message, 'error');
  }
}

// ── Add Phrase ────────────────────────────────────────────────────────────────
addForm.addEventListener('submit', async e => {
  e.preventDefault();
  const text = $('add-text').value.trim();
  if (!text || !db || !currentUser) return;
  const sel = addCatSel;
  const opt = sel.options[sel.selectedIndex];
  try {
    await addDoc(collection(db, 'phrases'), {
      text, categoryId: sel.value,
      categoryName: opt.dataset.name,
      categoryColor: opt.dataset.color,
      order: 999, createdAt: serverTimestamp(),
      createdBy: currentUser.email
    });
    $('add-text').value = '';
    showStatus('用語已新增');
    loadPhrases();
  } catch (e) {
    showStatus('新增失敗：' + e.message, 'error');
  }
});

seedBtn.addEventListener('click', seedDatabase);

// ── Auth ──────────────────────────────────────────────────────────────────────
loginBtn?.addEventListener('click', async () => {
  if (!auth) return;
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch (e) { showStatus('登入失敗：' + e.message, 'error'); }
});

logoutBtn?.addEventListener('click', () => auth && signOut(auth));

function updateUI(user) {
  currentUser = user;
  const isAdmin = user?.email === ADMIN_EMAIL;

  if (!IS_CONFIGURED) {
    configWarning.style.display = 'block';
    loginSection.style.display  = 'none';
    adminSection.style.display  = 'none';
    return;
  }

  configWarning.style.display = 'none';
  loginSection.style.display  = isAdmin ? 'none' : 'block';
  adminSection.style.display  = isAdmin ? 'block' : 'none';

  if (isAdmin) {
    userInfo.textContent = `已登入：${user.displayName || user.email}`;
    logoutBtn.classList.remove('hidden');
    loadPhrases();
  } else {
    logoutBtn.classList.add('hidden');
    document.querySelector('.access-denied')?.remove();
    if (user) {
      loginSection.insertAdjacentHTML('beforeend',
        '<p class="access-denied">此帳號無管理員權限，請使用授權帳號登入。</p>');
    }
  }
}

if (auth) onAuthStateChanged(auth, updateUI);
else updateUI(null);
