import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

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
  console.log('Firebase初期化成功:', firebaseConfig.projectId);
} catch (error) {
  console.error('Firebase初期化エラー:', error);
  throw error;
}

export { app };

// Firebase Authの永続性をlocalに明示設定（必ず一度だけ実行）
try {
  const auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch((e) => {
    console.error('Auth persistence設定エラー:', e);
  });
} catch (error) {
  console.error('Firebase Auth初期化エラー:', error);
} 