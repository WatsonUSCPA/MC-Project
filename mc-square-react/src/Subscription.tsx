import React from 'react';

const Subscription = () => (
  <>
    <div className="container">
      <section className="hero-section" style={{ textAlign: 'center', padding: '4rem 0 2.5rem 0', marginBottom: '3rem' }}>
        <h1 className="hero-title" style={{ fontSize: '2.5rem', color: 'var(--color-text)', marginBottom: '2rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2 }}>📦 サブスクリプション</h1>
        <p className="hero-subtitle" style={{ fontSize: '1.25rem', color: 'var(--color-text-light)', marginBottom: '2.5rem', lineHeight: 1.8, maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' }}>
          毎月テーマに沿った生地をお届けする、お得なサブスクリプションです。<br />
          最新の国産コットンやアメリカンコットンを定期的にお届けします。
        </p>
        <div style={{ background: '#fff7f2', border: '2px solid var(--color-primary)', borderRadius: 12, padding: '1.5rem', margin: '2rem auto', maxWidth: 600, textAlign: 'center' }}>
          <p style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>⚠️ ご注意</p>
          <p style={{ color: 'var(--color-text)', fontSize: '1rem', margin: 0 }}>サブスクリプション商品は外部サイト（BASE）でのご購入となります。<br />下記の「BASEで詳細・購入」ボタンから外部サイトに移動してご購入ください。</p>
        </div>
      </section>
      <section className="main-content" style={{ background: 'var(--color-background-alt)', padding: '3rem', borderRadius: 20, boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)', marginBottom: '3rem', border: '1px solid var(--color-border)' }}>
        <div className="subscription-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '3rem', margin: '3rem 0' }}>
          {/* 国産コットン マンスリー */}
          <div className="subscription-card" style={{ background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <img src="/Image/JP Cotton subscription.png" alt="国産コットン マンスリー" className="subscription-image" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 20, marginBottom: '2rem' }} />
            <h3 className="subscription-title" style={{ fontSize: '1.5rem', color: 'var(--color-text)', marginBottom: '1rem', fontWeight: 700 }}>国産コットン マンスリー</h3>
            <div className="subscription-price" style={{ fontSize: '1.25rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '1.5rem' }}>¥1,815 税込</div>
            <p className="subscription-description" style={{ color: 'var(--color-text-light)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              ご購入月の最新国産コットンを１５種類お届けします。著名デザイナー、メーカーオリジナル、数量限定柄などエムシースクエアがお勧めする最新国産カットクロスをお届けします。
            </p>
            <ul className="subscription-features" style={{ listStyle: 'none', marginBottom: '1.5rem', padding: 0 }}>
              <li style={{ padding: '0.5rem 0', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✓ ２０ｃｍｘ３０ｃｍの最新国産コットンのカットクロスを１５枚</li>
              <li style={{ padding: '0.5rem 0', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✓ 発送運賃</li>
              <li style={{ padding: '0.5rem 0', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✓ 新商品情報</li>
            </ul>
            <div style={{ background: '#fff7f2', borderRadius: 12, padding: '1em', color: '#E1306C', marginBottom: '1em' }}>
              <b>量販店などではあまり見かけない、最新で珍しい国産コットンを是非お手に取ってご覧ください。</b>
            </div>
            <a href="https://mcsquare.thebase.in/items/101744201" className="subscription-button" target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: 'var(--color-primary)', color: 'white', textDecoration: 'none', padding: '0.8rem 1.5rem', borderRadius: 20, fontWeight: 600, fontSize: '1rem', transition: 'all 0.3s ease', textAlign: 'center', marginTop: 'auto' }}>BASEで詳細・購入</a>
          </div>
          {/* アメリカンコットン マンスリー */}
          <div className="subscription-card" style={{ background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <img src="/Image/US Cotton subscription.png" alt="アメリカンコットン マンスリー" className="subscription-image" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 20, marginBottom: '2rem' }} />
            <h3 className="subscription-title" style={{ fontSize: '1.5rem', color: 'var(--color-text)', marginBottom: '1rem', fontWeight: 700 }}>アメリカンコットン マンスリー</h3>
            <div className="subscription-price" style={{ fontSize: '1.25rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '1.5rem' }}>¥2,475 税込</div>
            <p className="subscription-description" style={{ color: 'var(--color-text-light)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              この商品は送料無料です。ご購入月の最新アメリカンコットンを１５種類お届けします。量販店などでは見かけない珍しい、そして貴重なアメリカンコットンで手づくりを楽しんでみませんか！
            </p>
            <ul className="subscription-features" style={{ listStyle: 'none', marginBottom: '1.5rem', padding: 0 }}>
              <li style={{ padding: '0.5rem 0', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✓ ２０ｃｍｘ３０ｃｍの最新アメリカンコットンのカットクロスを１５枚</li>
              <li style={{ padding: '0.5rem 0', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✓ 発送運賃</li>
              <li style={{ padding: '0.5rem 0', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✓ 新商品情報</li>
            </ul>
            <div style={{ background: '#fff7f2', borderRadius: 12, padding: '1em', color: '#E1306C', marginBottom: '1em' }}>
              <b>Free spirits, Michael Miller, Benartex などなど最新で珍しいアメリカンコットンを是非お手に取ってご覧ください。</b>
            </div>
            <a href="https://mcsquare.thebase.in/items/101742800" className="subscription-button" target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: 'var(--color-primary)', color: 'white', textDecoration: 'none', padding: '0.8rem 1.5rem', borderRadius: 20, fontWeight: 600, fontSize: '1rem', transition: 'all 0.3s ease', textAlign: 'center', marginTop: 'auto' }}>BASEで詳細・購入</a>
          </div>
        </div>
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

export default Subscription; 