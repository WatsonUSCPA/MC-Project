import React, { useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, User, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { app } from './firebase';
import './GalleryLogin.css';

const auth = getAuth(app);

const GalleryLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // ログイン済みの場合はギャラリーページにリダイレクト
        window.location.href = '/gallery';
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLoginMode) {
        // ログインモード
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = '/gallery';
      } else {
        // 会員登録モード
        if (password !== confirmPassword) {
          setError('パスワードが一致しません。');
          setLoading(false);
          return;
        }
        
        if (password.length < 6) {
          setError('パスワードは6文字以上で入力してください。');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // ユーザー名を設定
        if (displayName.trim()) {
          await updateProfile(userCredential.user, {
            displayName: displayName.trim()
          });
        }
        
        window.location.href = '/gallery';
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let errorMessage = '認証に失敗しました。';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'このメールアドレスは既に使用されています。';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '有効なメールアドレスを入力してください。';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'パスワードが弱すぎます。6文字以上で入力してください。';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      window.location.href = '/gallery';
    } catch (error: any) {
      console.error('Google login error:', error);
      let errorMessage = 'Googleログインに失敗しました。';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'ログインがキャンセルされました。';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'ポップアップがブロックされました。ブラウザの設定を確認してください。';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (currentUser) {
    return (
      <div className="gallery-login">
        <div className="gallery-login-container">
          <div className="gallery-login-header">
            <div className="gallery-login-logo">🎨</div>
            <h1 className="gallery-login-title">ログイン中...</h1>
            <p className="gallery-login-subtitle">ギャラリーページに移動しています</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-login">
      <div className="gallery-login-container">
        <div className="gallery-login-header">
          <div className="gallery-login-logo">🎨</div>
          <h1 className="gallery-login-title">クラフトキッチン</h1>
          <p className="gallery-login-subtitle">
            {isLoginMode ? 'ログインして作品を投稿しましょう' : '新規登録して作品を投稿しましょう'}
          </p>
        </div>

        <form className="gallery-login-form" onSubmit={handleSubmit}>
          {!isLoginMode && (
            <div className="form-group">
              <label className="form-label">ユーザー名</label>
              <input
                type="text"
                className="form-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ユーザー名を入力"
                required={!isLoginMode}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">メールアドレス</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレスを入力"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">パスワード</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              required
            />
          </div>

          {!isLoginMode && (
            <div className="form-group">
              <label className="form-label">パスワード（確認）</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="パスワードを再入力"
                required={!isLoginMode}
              />
            </div>
          )}

          <button
            type="submit"
            className="gallery-login-button"
            disabled={loading}
          >
            {loading ? (isLoginMode ? 'ログイン中...' : '登録中...') : (isLoginMode ? 'ログイン' : '会員登録')}
          </button>

          {error && (
            <div className="error-message">{error}</div>
          )}
        </form>

        <div className="google-login-section">
          <div className="divider">
            <span>または</span>
          </div>
          
          <button
            type="button"
            className="google-login-button"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Googleで{isLoginMode ? 'ログイン' : '登録'}
          </button>
        </div>

        <div className="gallery-login-toggle">
          <button type="button" className="toggle-button" onClick={toggleMode}>
            {isLoginMode ? 'アカウントをお持ちでない方はこちら' : '既にアカウントをお持ちの方はこちら'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GalleryLogin; 