import React from 'react';

const YorisoiCraft: React.FC = () => {
  return (
    <div className="container">
      <h1 style={{ color: 'var(--color-primary)', fontSize: '1.6rem', marginBottom: '0.5rem' }}>✨ よりそいクラフト</h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--color-text-light)', marginBottom: '1rem', lineHeight: 1.6 }}>
        エムシースクエアが提供する、心を癒す手作りクラフトの世界へようこそ。
      </p>
      
      <div style={{ 
        background: 'var(--color-background-alt)', 
        padding: '2rem', 
        borderRadius: '12px',
        marginBottom: '2rem'
      }}>
        <h2 style={{ 
          color: 'var(--color-primary)', 
          fontSize: '1.3rem', 
          marginBottom: '1rem' 
        }}>
          よりそいクラフトについて
        </h2>
        <p style={{ lineHeight: 1.8, marginBottom: '1rem' }}>
          よりそいクラフトは、手作りの温かさと心の癒しを大切にしたクラフトサービスです。
          お一人お一人の心に寄り添い、心を癒す作品作りをお手伝いします。
        </p>
        <p style={{ lineHeight: 1.8 }}>
          現在、よりそいクラフトの詳細情報は準備中です。
          お楽しみにお待ちください。
        </p>
      </div>
      
      <div style={{ 
        background: '#fff7f2', 
        border: '2px solid var(--color-primary)', 
        borderRadius: '12px', 
        padding: '1.5rem', 
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <p style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
          📢 お知らせ
        </p>
        <p style={{ color: 'var(--color-text)', fontSize: '1rem', margin: 0 }}>
          よりそいクラフトのサービスは現在開発中です。<br />
          詳細が決まり次第、お知らせいたします。
        </p>
      </div>
      
      <div style={{ 
        background: 'var(--color-background-alt)', 
        padding: '2rem', 
        borderRadius: '12px'
      }}>
        <h2 style={{ 
          color: 'var(--color-primary)', 
          fontSize: '1.3rem', 
          marginBottom: '1rem' 
        }}>
          お問い合わせ
        </h2>
        <p style={{ lineHeight: 1.8, marginBottom: '1rem' }}>
          よりそいクラフトに関するお問い合わせは、以下の連絡先までお願いいたします。
        </p>
        <div style={{ 
          background: 'white', 
          padding: '1rem', 
          borderRadius: '8px',
          border: '1px solid var(--color-border)'
        }}>
          <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>エムシースクエア</p>
          <p style={{ margin: '0.5rem 0' }}>
            〒244-0811 神奈川県横浜市戸塚区上柏尾町132-3 SKビル2階
          </p>
          <p style={{ margin: '0.5rem 0' }}>
            TEL：045-410-7023
          </p>
          <p style={{ margin: '0.5rem 0' }}>
            E-mail：<a href="mailto:retail@mcsquareofficials.com" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
              retail@mcsquareofficials.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default YorisoiCraft; 