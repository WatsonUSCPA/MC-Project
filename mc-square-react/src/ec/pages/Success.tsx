import React from 'react';
import { useSearchParams } from 'react-router-dom';

const Success: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="container">
      <div style={{ 
        maxWidth: 600, 
        margin: '0 auto', 
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ 
          background: '#d4edda', 
          border: '1px solid #c3e6cb', 
          borderRadius: '8px', 
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h1 style={{ 
            color: '#155724', 
            fontSize: '2rem', 
            marginBottom: '1rem' 
          }}>
            ✅ 決済が完了しました
          </h1>
          <p style={{ 
            color: '#155724', 
            fontSize: '1.1rem',
            marginBottom: '1rem'
          }}>
            ご購入ありがとうございます。商品は順次発送いたします。
          </p>
          {sessionId && (
            <p style={{ 
              color: '#6c757d', 
              fontSize: '0.9rem',
              fontFamily: 'monospace',
              background: '#f8f9fa',
              padding: '0.5rem',
              borderRadius: '4px',
              marginTop: '1rem'
            }}>
              セッションID: {sessionId}
            </p>
          )}
        </div>
        
        <div style={{ 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '8px', 
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ 
            color: '#856404', 
            fontSize: '1.3rem', 
            marginBottom: '1rem' 
          }}>
            📧 確認メールについて
          </h2>
          <p style={{ 
            color: '#856404', 
            fontSize: '1rem',
            lineHeight: 1.6
          }}>
            決済確認メールは自動的に送信されます。<br />
            迷惑メールフォルダもご確認ください。
          </p>
        </div>

        <div style={{ 
          background: '#d1ecf1', 
          border: '1px solid #bee5eb', 
          borderRadius: '8px', 
          padding: '1.5rem'
        }}>
          <h2 style={{ 
            color: '#0c5460', 
            fontSize: '1.3rem', 
            marginBottom: '1rem' 
          }}>
            📞 お問い合わせ
          </h2>
          <p style={{ 
            color: '#0c5460', 
            fontSize: '1rem',
            lineHeight: 1.6
          }}>
            ご不明な点がございましたら、お気軽にお問い合わせください。<br />
            <strong>TEL: 045-410-7023</strong><br />
            <strong>E-mail: retail@mcsquareofficials.com</strong>
          </p>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <a href="/all-products" style={{
            display: 'inline-block',
            background: 'var(--color-primary)',
            color: 'white',
            textDecoration: 'none',
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '1rem',
            marginRight: '1rem'
          }}>
            商品一覧に戻る
          </a>
          <a href="/" style={{
            display: 'inline-block',
            background: '#6c757d',
            color: 'white',
            textDecoration: 'none',
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '1rem'
          }}>
            ホームに戻る
          </a>
        </div>
      </div>
    </div>
  );
};

export default Success; 