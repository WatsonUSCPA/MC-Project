import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ここにログイン処理を実装
      // 例: Firebase Auth や API 呼び出し
      console.log('ログイン処理:', { email, password });
      
      // 仮の成功処理
      setTimeout(() => {
        setLoading(false);
        navigate('/all-products');
      }, 1000);
      
    } catch (err) {
      setError('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ 
        maxWidth: 400, 
        margin: '0 auto', 
        padding: '2rem',
        background: 'var(--color-background-alt)',
        borderRadius: '12px',
        boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)'
      }}>
        <h1 style={{ 
          color: 'var(--color-primary)', 
          fontSize: '1.6rem', 
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          ログイン
        </h1>
        
        {error && (
          <div style={{ 
            background: '#ffebee', 
            color: '#c62828', 
            padding: '0.8rem', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 600,
              color: 'var(--color-text)'
            }}>
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.8rem',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 600,
              color: 'var(--color-text)'
            }}>
              パスワード
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.8rem',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#ccc' : 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.8rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
        
        <div style={{ 
          marginTop: '1.5rem', 
          textAlign: 'center',
          fontSize: '0.9rem',
          color: 'var(--color-text-light)'
        }}>
          <p>アカウントをお持ちでない方は</p>
          <a href="/register" style={{ 
            color: 'var(--color-primary)', 
            textDecoration: 'none',
            fontWeight: 600
          }}>
            新規登録
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login; 