import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container">
      <h1 style={{ color: 'var(--color-primary)', fontSize: '1.6rem', marginBottom: '0.5rem' }}>プライバシーポリシー</h1>
      <div style={{ 
        background: 'var(--color-background-alt)', 
        padding: '2rem', 
        borderRadius: '12px',
        lineHeight: '1.8',
        fontSize: '1rem'
      }}>
        <h2>1. 個人情報の取得</h2>
        <p>当社は、本サービスの提供にあたり、以下の個人情報を取得いたします。</p>
        <ul>
          <li>氏名</li>
          <li>メールアドレス</li>
          <li>住所</li>
          <li>電話番号</li>
          <li>決済情報</li>
        </ul>
        
        <h2>2. 個人情報の利用目的</h2>
        <p>取得した個人情報は、以下の目的で利用いたします。</p>
        <ul>
          <li>商品の配送</li>
          <li>お客様サポート</li>
          <li>決済処理</li>
          <li>サービス改善のための分析</li>
          <li>法令に基づく対応</li>
        </ul>
        
        <h2>3. 個人情報の管理</h2>
        <p>当社は、お客様の個人情報を適切に管理し、以下の場合を除き、個人情報を第三者に開示いたしません。</p>
        <ul>
          <li>お客様の同意がある場合</li>
          <li>法令に基づき開示することが必要である場合</li>
          <li>人の生命、身体または財産の保護のために必要な場合</li>
        </ul>
        
        <h2>4. 個人情報の訂正・削除</h2>
        <p>お客様は、当社に対してご自身の個人情報の訂正・削除を求めることができます。</p>
        
        <h2>5. お問い合わせ</h2>
        <p>個人情報の取り扱いに関するお問い合わせは、以下の連絡先までお願いいたします。</p>
        <p>
          〒244-0811 神奈川県横浜市戸塚区上柏尾町132-3 SKビル2階<br />
          TEL：045-410-7023<br />
          E-mail：retail@mcsquareofficials.com
        </p>
        
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
          制定日：2024年1月1日<br />
          最終更新日：2024年1月1日
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 