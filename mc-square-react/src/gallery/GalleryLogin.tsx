import React, { useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, User, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
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
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

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
        
        // ウェルカムメールを送信
        try {
          const response = await fetch('/.netlify/functions/send-welcome-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email,
              displayName: displayName.trim() || 'ユーザー'
            })
          });
          
          if (!response.ok) {
            console.warn('Welcome email sending failed, but registration was successful');
          }
        } catch (error) {
          console.warn('Welcome email sending failed:', error);
          // メール送信に失敗しても登録は成功しているので、ユーザーには通知しない
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
    setIsPasswordResetMode(false);
    setResetEmail('');
    setResetMessage(null);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResetMessage(null);

    console.log('=== Password Reset Debug ===');
    console.log('Email:', resetEmail);
    console.log('Auth object:', auth);
    console.log('Firebase config:', auth.app.options);
    console.log('Current user:', auth.currentUser);
    console.log('Auth state:', auth.authStateReady());
    console.log('Browser info:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    });

    try {
      console.log('Attempting to send password reset email...');
      
      // パスワードリセットメールの設定
      const actionCodeSettings = {
        url: window.location.hostname === 'localhost' 
          ? 'https://mc-square.netlify.app/gallery/login' // ローカル環境の場合は本番URL
          : `${window.location.origin}/gallery/login`, // 本番環境の場合は現在のURL
        handleCodeInApp: false,
      };
      
      console.log('Action code settings:', actionCodeSettings);
      
      // より詳細なデバッグ情報
      console.log('=== Additional Debug Info ===');
      console.log('Window location:', window.location);
      console.log('Document domain:', document.domain);
      console.log('Current timestamp:', new Date().toISOString());
      console.log('==========================');
      
      await sendPasswordResetEmail(auth, resetEmail, actionCodeSettings);
      console.log('Password reset email sent successfully');
      const isLocalhost = window.location.hostname === 'localhost';
      const message = isLocalhost 
        ? 'パスワードリセットメールを送信しました。\n\n📧 メールをご確認ください。\n\n⚠️ ローカル環境でのテスト中です。\n※本番環境でテストすることをお勧めします。\n※迷惑メールフォルダもご確認ください。\n\n🔍 デバッグ情報: Consoleで詳細を確認できます。'
        : 'パスワードリセットメールを送信しました。\n\n📧 メールをご確認ください。\n\n※迷惑メールフォルダもご確認ください。\n※数分経っても届かない場合は、再度お試しください。\n\n🔍 デバッグ情報: Consoleで詳細を確認できます。';
      
      setResetMessage(message);
      setResetEmail('');
    } catch (error: any) {
      console.error('=== Password Reset Error ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      console.error('Full error object:', error);
      console.error('==========================');
      
      let errorMessage = 'パスワードリセットに失敗しました。';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'このメールアドレスは登録されていません。';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '有効なメールアドレスを入力してください。';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'リクエストが多すぎます。しばらく時間をおいてから再試行してください。';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'パスワードリセット機能が無効になっています。管理者にお問い合わせください。';
      }
      
      setResetMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const showPasswordReset = () => {
    setIsPasswordResetMode(true);
    setError(null);
    setResetMessage(null);
  };

  const backToLogin = () => {
    setIsPasswordResetMode(false);
    setResetEmail('');
    setResetMessage(null);
    setError(null);
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
            {isPasswordResetMode 
              ? 'パスワードリセット' 
              : isLoginMode 
                ? 'ログインして作品を投稿しましょう' 
                : '新規登録して作品を投稿しましょう'
            }
          </p>
        </div>

        {isPasswordResetMode ? (
          <>
            <form className="gallery-login-form" onSubmit={handlePasswordReset}>
              <div className="form-group">
                <label className="form-label">メールアドレス</label>
                <input
                  type="email"
                  className="form-input"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="登録済みのメールアドレスを入力"
                  required
                />
              </div>

              <button
                type="submit"
                className="gallery-login-button"
                disabled={loading}
              >
                {loading ? '送信中...' : 'パスワードリセットメールを送信'}
              </button>

              {resetMessage && (
                <div className={`message ${resetMessage.includes('送信しました') ? 'success-message' : 'error-message'}`}>
                  {resetMessage}
                </div>
              )}

              <div className="password-reset-actions">
                <button 
                  type="button" 
                  className="back-to-login-btn" 
                  onClick={backToLogin}
                >
                  ← ログインに戻る
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
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

              {isLoginMode && (
                <div className="password-reset-link">
                  <button 
                    type="button" 
                    className="forgot-password-btn" 
                    onClick={showPasswordReset}
                  >
                    パスワードを忘れた方はこちら
                  </button>
                </div>
              )}
            </form>

            <div className="gallery-login-toggle">
              <button type="button" className="toggle-button" onClick={toggleMode}>
                {isLoginMode ? 'アカウントをお持ちでない方はこちら' : '既にアカウントをお持ちの方はこちら'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GalleryLogin; 