import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB2nPjePLfr6ZlxTOLPC7OuYWrD0k6JqJ4",
  authDomain: "link-manager-f4ea8.firebaseapp.com",
  projectId: "link-manager-f4ea8",
  storageBucket: "link-manager-f4ea8.appspot.com",
  messagingSenderId: "96350140236",
  appId: "1:96350140236:web:fe858a8661067f5f0081e9",
  measurementId: "G-90CXT9WS4Y"
};

// Firebaseアプリの初期化
let app: FirebaseApp;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch (error) {
  console.error('Firebase初期化エラー:', error);
  throw error;
}

// Firestoreの初期化
const db = getFirestore(app);

export { app, db };
