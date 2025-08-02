import React, { useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, User, updateProfile } from 'firebase/auth';
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