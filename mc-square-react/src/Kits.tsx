import React from 'react';

const Kits = () => (
  <>
    <div className="container">
      <section className="hero-section" style={{ textAlign: 'center', padding: '4rem 0 2.5rem 0', marginBottom: '3rem' }}>
        <h1 className="hero-title" style={{ fontSize: '2.5rem', color: 'var(--color-text)', marginBottom: '2rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2 }}>🧩 キットページ</h1>
        <p className="hero-subtitle" style={{ fontSize: '1.25rem', color: 'var(--color-text-light)', marginBottom: '2.5rem', lineHeight: 1.8, maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' }}>
          ただいまキット商品ページは準備中です。<br />
          近日中に、エムシースクエア厳選の手作りキットを掲載予定です。<br />
          お楽しみにお待ちください。
        </p>
      </section>
      <div className="contact" style={{ background: 'var(--color-background-alt)', borderRadius: 20, padding: '2rem', marginTop: '3rem', boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)', border: '1px solid #FFD4C4', maxWidth: 700, marginLeft: 'auto', marginRight: 'auto', position: 'relative', overflow: 'hidden' }}>
        <strong>【お問合せ先】</strong><br />
        〒244-0811 神奈川県横浜市戸塚区上柏尾町132-3 SKビル2階<br />
        TEL：045-410-7023　FAXフリーダイヤル：0120-535-596<br />
        E-mail：<a href="mailto:retail@mcsquareofficials.com" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>retail@mcsquareofficials.com</a>
      </div>
    </div>
  </>
);

export default Kits; 