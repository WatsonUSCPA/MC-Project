import React from 'react';

const Contact: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-background)',
      padding: '2rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        background: 'white',
        borderRadius: 'var(--border-radius)',
        padding: '3rem',
        boxShadow: 'var(--shadow-md)',
        marginTop: '2rem'
      }}>
        <h1 style={{
          color: 'var(--color-primary)',
          fontSize: '2rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          お問い合わせ
        </h1>
        
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          background: 'var(--color-background-alt)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <h2 style={{
            color: 'var(--color-text)',
            fontSize: '1.3rem',
            marginBottom: '1rem'
          }}>
            お問い合わせ先
          </h2>
          
          <div style={{
            color: 'var(--color-text-light)',
            lineHeight: '1.8'
          }}>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>住所：</strong>〒244-0811 神奈川県横浜市戸塚区上柏尾町132-3 SKビル2階
            </p>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>電話番号：</strong>045-410-7023
            </p>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>FAX：</strong>0120-535-596
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>E-mail：</strong>
              <a 
                href="mailto:retail@mcsquareofficials.com"
                style={{
                  color: 'var(--color-primary)',
                  textDecoration: 'none'
                }}
              >
                retail@mcsquareofficials.com
              </a>
            </p>
          </div>
        </div>

        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          background: 'var(--color-background-alt)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <h2 style={{
            color: 'var(--color-text)',
            fontSize: '1.3rem',
            marginBottom: '1rem'
          }}>
            営業時間
          </h2>
          
          <div style={{
            color: 'var(--color-text-light)',
            lineHeight: '1.8'
          }}>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>平日：</strong>9:00 - 18:00
            </p>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>土曜日：</strong>9:00 - 17:00
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>日曜・祝日：</strong>休業
            </p>
          </div>
        </div>

        <div style={{
          padding: '1.5rem',
          background: 'var(--color-background-alt)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <h2 style={{
            color: 'var(--color-text)',
            fontSize: '1.3rem',
            marginBottom: '1rem'
          }}>
            お問い合わせ内容について
          </h2>
          
          <div style={{
            color: 'var(--color-text-light)',
            lineHeight: '1.8'
          }}>
            <p style={{ marginBottom: '1rem' }}>
              商品に関するご質問、ご注文についてのご相談、その他お困りのことがございましたら、
              お気軽にお問い合わせください。
            </p>
            <p style={{ marginBottom: '1rem' }}>
              お電話でのお問い合わせの際は、お名前とお電話番号をお聞かせください。
            </p>
            <p>
              E-mailでのお問い合わせの際は、件名に「お問い合わせ」と記載していただき、
              本文にお名前、お電話番号、お問い合わせ内容をご記入ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact; 