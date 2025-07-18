import React from 'react';

const YorisoiCraft = () => (
  <>
    <main style={{ background: 'var(--color-background)', minHeight: '100vh', padding: 0 }}>
      <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: 0 }}>
        {/* 針を使わない・高齢者も楽しめる・作成中の説明 */}
        <section style={{ textAlign: 'center', padding: '2.5rem 1rem 1.5rem 1rem', background: 'var(--color-background-alt)', borderBottom: '1px solid var(--color-border)', marginBottom: '2.5rem', borderRadius: 20 }}>
          <h1 style={{ fontSize: '2.1rem', color: 'var(--color-primary)', fontWeight: 800, marginBottom: '1.2rem', letterSpacing: '0.04em' }}>よりそいクラフト</h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--color-text)', marginBottom: '0.7rem', fontWeight: 500 }}>
            <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>針を使わない</span>新しい手芸キット。<br />
            高齢の方や初心者の方でも安心して楽しめます。
          </p>
          <p style={{ fontSize: '1.08rem', color: 'var(--color-text-light)', marginBottom: 0 }}>
            <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>現在、よりそいクラフトキットは新作を作成中です。</span><br />
            公開・販売まで今しばらくお待ちください。
          </p>
        </section>
        {/* パッチワークの魅力セクション */}
        <section className="benefits-section" style={{ margin: '4rem 0', padding: '2rem', background: 'rgba(255,255,255,0.95)', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
          <h2 className="section-title" style={{ fontSize: '2rem', color: '#ff6b6b', marginBottom: '2rem', textAlign: 'center', fontWeight: 'bold' }}>✨ パッチワークの魅力</h2>
          <p className="kit-description" style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
            パッチワークは、針を使わずに楽しめる新しい手芸です。<br />
            アイロンやボンドで貼るだけなので、初心者や高齢者の方も安心して取り組めます。<br />
            心と体の健康をサポートする、素晴らしい活動です。
          </p>
          <div className="benefits-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', margin: '2rem 0', justifyItems: 'center' }}>
            <div className="benefit-card" style={{ background: 'var(--color-background)', borderRadius: 20, padding: '3rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)', maxWidth: 400, width: '100%' }}>
              <img src="/Image/認知予防.png" alt="認知症予防と脳の活性化" className="benefit-image" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 10, marginBottom: '1.5rem', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }} />
              <h3 className="benefit-title" style={{ fontSize: '1.5rem', color: '#ff6b6b', marginBottom: '1rem', fontWeight: 'bold' }}>🧠 認知症予防</h3>
              <p className="benefit-description" style={{ color: '#666', lineHeight: 1.8, marginBottom: '1rem' }}>
                針を使わず、布を貼るシンプルな作業で指先を動かし、脳の活性化に効果的です。
                色の組み合わせやパターンの作成は、創造性を刺激し、認知機能の維持・向上に役立ちます。
              </p>
            </div>
            <div className="benefit-card" style={{ background: 'var(--color-background)', borderRadius: 20, padding: '3rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)', maxWidth: 400, width: '100%' }}>
              <img src="/Image/Showing to their friends.png" alt="コミュニケーションと交流" className="benefit-image" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 10, marginBottom: '1.5rem', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }} />
              <h3 className="benefit-title" style={{ fontSize: '1.5rem', color: '#ff6b6b', marginBottom: '1rem', fontWeight: 'bold' }}>👥 コミュニケーション促進</h3>
              <p className="benefit-description" style={{ color: '#666', lineHeight: 1.8, marginBottom: '1rem' }}>
                針を使わないので、誰でも気軽に参加でき、仲間との交流が生まれます。
                作品を通じての会話は、心の交流を深め、社会とのつながりを感じることができます。
              </p>
            </div>
            <div className="benefit-card" style={{ background: 'var(--color-background)', borderRadius: 20, padding: '3rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)', maxWidth: 400, width: '100%' }}>
              <img src="/Image/Safe to play.png" alt="達成感と自己肯定感" className="benefit-image" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 10, marginBottom: '1.5rem', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }} />
              <h3 className="benefit-title" style={{ fontSize: '1.5rem', color: '#ff6b6b', marginBottom: '1rem', fontWeight: 'bold' }}>🎯 達成感と自信</h3>
              <p className="benefit-description" style={{ color: '#666', lineHeight: 1.8, marginBottom: '1rem' }}>
                針を使わずに安全に作れるので、完成した時の達成感は大きな喜びと自信につながります。
                自分の手で作った作品は、大切な思い出となり、生活に彩りを添えます。
              </p>
            </div>
          </div>
        </section>
        {/* 以降もHTMLの構成に沿って各セクションを順次追加します */}
      </div>
    </main>
  </>
);

export default YorisoiCraft; 