import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyB2nPjePLfr6ZlxTOLPC7OuYWrD0k6JqJ4",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "link-manager-f4ea8.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "link-manager-f4ea8",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "link-manager-f4ea8.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "96350140236",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:96350140236:web:fe858a8661067f5f0081e9",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-90CXT9WS4Y"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firebase Authの永続性をlocalに明示設定（必ず一度だけ実行）
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((e) => {
  console.error('Auth persistence設定エラー:', e);
}); 