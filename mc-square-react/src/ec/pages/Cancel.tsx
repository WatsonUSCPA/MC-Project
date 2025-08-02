import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';

const Cancel: React.FC = () => {
  const { clearCart } = useCart();

  // キャンセル時にカートをクリア（オプション）
  useEffect(() => {
    // キャンセル時はカートをクリアしない（ユーザーが再度決済できるように）
    console.log('決済キャンセル: カートは保持されます');
  }, []);

  return (
    <div className="container">
      <div style={{ 
        maxWidth: 600, 
        margin: '0 auto', 
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ 
          background: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: '8px', 
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h1 style={{ 
            color: '#721c24', 
            fontSize: '2rem', 
            marginBottom: '1rem' 
          }}>
            ❌ 決済がキャンセルされました
          </h1>
          <p style={{ 
            color: '#721c24', 
            fontSize: '1.1rem',
            marginBottom: '1rem'
          }}>
            決済はキャンセルされました。カートの商品は保持されています。
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

export default Cancel; 