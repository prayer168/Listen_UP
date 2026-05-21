// 複製此檔案為 firebase-config.js，並填入您的 Firebase 專案設定。
// Firebase Web config 為公開設定，安全性由 Firestore 安全規則控制。

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export const IS_CONFIGURED = !firebaseConfig.apiKey.startsWith('YOUR_');

let db = null, auth = null;
if (IS_CONFIGURED) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (e) {
    console.warn('Firebase 初始化失敗:', e.message);
  }
}

export { db, auth };
