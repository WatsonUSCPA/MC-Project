import React from 'react';

const Cancel: React.FC = () => {
  return (
    <div style={{ padding: '3em 1em', textAlign: 'center' }}>
      <h1 style={{ color: '#E1306C', marginBottom: '1em' }}>お支払いがキャンセルされました</h1>
      <p>お支払い手続きがキャンセルされました。<br />カートの中身は保持されていますので、再度ご購入いただけます。</p>
      <a href="/all-products" style={{ display: 'inline-block', marginTop: '2em', color: '#fff', background: '#E1306C', padding: '0.8em 2em', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>商品一覧へ戻る</a>
    </div>
  );
};

export default Cancel; 