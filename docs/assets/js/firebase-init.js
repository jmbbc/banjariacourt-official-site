// Minimal Firebase init for banjariacourt-official-site
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// If a global override is provided (e.g., inline before this script), use it; else fallback
const firebaseConfig = (window.__FIREBASE_CONFIG) || {
  apiKey: "AIzaSyDxN4OAFzzsQ9clUG9RqewWZ6hJ4HIWLMc",
  authDomain: "banjariavisitor.firebaseapp.com",
  projectId: "banjariavisitor",
  storageBucket: "banjariavisitor.firebasestorage.app",
  messagingSenderId: "82057315329",
  appId: "1:82057315329:web:7ad070a5a4fc6ecac82c00"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.__FIREBASE_APP = app;
window.__AUTH = auth;
window.__APP_PROJECT_ID = firebaseConfig.projectId;
window.__FIRESTORE = db;
