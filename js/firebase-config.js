import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyCNbBRwBvSLcxINfeybfJW3b9tcyhKTn0o",
  authDomain: "listen-up-8688d.firebaseapp.com",
  projectId: "listen-up-8688d",
  storageBucket: "listen-up-8688d.firebasestorage.app",
  messagingSenderId: "713723849437",
  appId: "1:713723849437:web:bb8b6c4b627855b8728934"
};

export const IS_CONFIGURED = true;

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
