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
          <li>アクセス情報（閲覧したページ、ご利用の端末・ブラウザの種類など）</li>
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
          <li>決済・配送など、利用目的の達成に必要な範囲で業務を委託する場合（決済代行会社、配送業者など）</li>
        </ul>
        
        <h2>4. 個人情報の訂正・削除</h2>
        <p>お客様は、当社に対してご自身の個人情報の訂正・削除を求めることができます。</p>
        
        <h2>5. クレジットカード情報について</h2>
        <p>クレジットカード決済は、決済代行サービス Stripe（Stripe, Inc.）を利用しています。カード番号などのカード情報は Stripe が管理し、当社のサーバーには保存されません。</p>

        <h2>6. アクセス解析について</h2>
        <p>当サイトでは、サイトの利用状況を把握し改善するため、Cloudflare Web Analytics を利用しています。このツールは Cookie を使用せず、個人を特定する情報は収集しません。</p>

        <h2>7. 広告について</h2>
        <p>当サイトでは、第三者配信の広告サービス「Google AdSense」を利用する場合があります。Google などの第三者配信事業者は、Cookie を使用して、当サイトや他のサイトへの過去のアクセス情報に基づいて広告を配信することがあります。</p>
        <p>パーソナライズ広告は、<a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">Google の広告設定</a>で無効にできます。また、<a href="https://www.aboutads.info/" target="_blank" rel="noopener noreferrer">www.aboutads.info</a> で第三者配信事業者の Cookie を無効にすることもできます。Google による情報の取り扱いについては、<a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer">Google のポリシーと規約</a>をご覧ください。</p>

        <h2>8. 外部サービスの埋め込みについて</h2>
        <p>クラフトキッチンのレシピページでは YouTube の動画を埋め込んで表示しています。動画を表示・再生すると、YouTube（Google）が Cookie などにより情報を取得することがあります。</p>

        <h2>9. お問い合わせ</h2>
        <p>個人情報の取り扱いに関するお問い合わせは、以下の連絡先までお願いいたします。</p>
        <p>
          〒244-0811 神奈川県横浜市戸塚区上柏尾町132-3 SKビル2階<br />
          TEL：045-410-7023<br />
          E-mail：retail@mcsquareofficials.com
        </p>
        
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
          制定日：2024年1月1日<br />
          最終更新日：2026年10月23日
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 