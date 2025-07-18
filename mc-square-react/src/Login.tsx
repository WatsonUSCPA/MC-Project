import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { app } from './firebase';

const auth = getAuth(app);

// Firebaseエラーを日本語に変換する関数
function getJapaneseErrorMessage(error: any): string {
  if (!error || typeof error !== 'object') return 'エラーが発生しました';
  const code = error.code || '';
  const message = error.message || '';
  if (code === 'auth/weak-password' || message.includes('Password should be at least 6 characters')) {
    return 'パスワードは6文字以上で入力してください';
  }
  if (code === 'auth/email-already-in-use') {
    return 'このメールアドレスは既に登録されています';
  }
  if (code === 'auth/invalid-email') {
    return 'メールアドレスの形式が正しくありません';
  }
  if (code === 'auth/user-not-found') {
    return 'メールアドレスまたはパスワードが正しくありません';
  }
  if (code === 'auth/wrong-password') {
    return 'メールアドレスまたはパスワードが正しくありません';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google認証がキャンセルされました';
  }
  return 'エラー: ' + (message || code);
}

const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (e: any) {
      setError(getJapaneseErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (e: any) {
      setError(getJapaneseErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '3em auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 16px rgba(255,159,124,0.10)', padding: '2em' }}>
      <h2 style={{ color: 'var(--color-primary)', marginBottom: 24 }}>{isRegister ? '新規登録' : 'ログイン'}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="メールアドレス"
            required
            style={{ width: '100%', padding: '0.7em', borderRadius: 8, border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="パスワード"
            required
            style={{ width: '100%', padding: '0.7em', borderRadius: 8, border: '1px solid #ccc' }}
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.8em', borderRadius: 8, background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '1.08em' }}>
          {loading ? '処理中...' : isRegister ? '新規登録' : 'ログイン'}
        </button>
      </form>
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        style={{
          width: '100%',
          padding: '0.8em',
          borderRadius: 8,
          background: '#fff',
          color: '#4285F4',
          border: '1px solid #ccc',
          fontWeight: 700,
          fontSize: '1.08em',
          marginTop: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}
      >
        <span style={{ fontSize: 22 }}>G</span> Googleで{isRegister ? '登録' : 'ログイン'}
      </button>
      <div style={{ marginTop: 18, textAlign: 'center' }}>
        {isRegister ? (
          <>
            アカウントをお持ちの方は{' '}
            <button onClick={() => setIsRegister(false)} style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>ログイン</button>
          </>
        ) : (
          <>
            アカウントをお持ちでない方は{' '}
            <button onClick={() => setIsRegister(true)} style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>新規登録</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login; 