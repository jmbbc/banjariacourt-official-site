// Minimal Firebase init for banjariacourt-official-site
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// If a global override is provided (e.g., inline before this script), use it; else fallback
const firebaseConfig = (window.__FIREBASE_CONFIG) || {
  apiKey: "AIzaSyC3bDowuy7kt9cAIoO1X-90v1pgWHIjS0Y",
  authDomain: "banjariacourt-site-4de45.firebaseapp.com",
  projectId: "banjariacourt-site-4de45",
  storageBucket: "banjariacourt-site-4de45.firebasestorage.app",
  messagingSenderId: "251245637856",
  appId: "1:251245637856:web:7fa99702b5782f1102a085"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.__FIREBASE_APP = app;
window.__AUTH = auth;
window.__APP_PROJECT_ID = firebaseConfig.projectId;
window.__FIRESTORE = db;
