import React from 'react';

const LegalNotice: React.FC = () => {
  return (
    <div className="container">
      <h1 style={{ color: 'var(--color-primary)', fontSize: '1.6rem', marginBottom: '0.5rem' }}>特定商取引法に基づく表記</h1>
      <div style={{ 
        background: 'var(--color-background-alt)', 
        padding: '2rem', 
        borderRadius: '12px',
        lineHeight: '1.8',
        fontSize: '1rem'
      }}>
        <h2>事業者の名称</h2>
        <p>エムシースクエア</p>
        
        <h2>代表者</h2>
        <p>代表取締役 高橋宏治</p>
        
        <h2>所在地</h2>
        <p>〒244-0811 神奈川県横浜市戸塚区上柏尾町132-3 SKビル2階</p>
        
        <h2>連絡先</h2>
        <p>
          TEL：045-410-7023<br />
          FAX：0120-535-596<br />
          E-mail：retail@mcsquareofficials.com
        </p>
        
        <h2>URL</h2>
        <p>https://mcsquareofficials.com</p>
        
        <h2>商品代金以外の必要料金</h2>
        <p>送料：400円（税込）<br />
        ただし、商品合計4,400円以上24,200円未満は900円（税込）<br />
        商品合計24,200円以上で送料無料</p>
        
        <h2>代金の支払方法</h2>
        <p>クレジットカード決済（Stripe）</p>

        <h2>代金の支払時期</h2>
        <p>ご注文時にクレジットカードで決済されます。</p>
        
        <h2>商品の引き渡し時期</h2>
        <p>ご注文（決済完了）後、通常3〜5営業日以内に発送いたします。</p>
        
        <h2>返品・交換について</h2>
        <p>商品到着後7日以内に限り、未使用・未開封の商品について返品・交換を承ります。<br />
        返品・交換をご希望の場合は、事前にメールまたはお電話でご連絡ください。</p>
        
        <h2>返品・交換の条件</h2>
        <ul>
          <li>お客様都合の場合：商品到着後7日以内の未使用・未開封の商品に限ります</li>
          <li>不良品・誤配送の場合：商品到着後7日以内にご連絡ください。交換または返金いたします</li>
        </ul>
        
        <h2>返品・交換の送料負担</h2>
        <ul>
          <li>お客様都合の場合：お客様負担</li>
          <li>不良品・誤配送の場合：当店負担</li>
        </ul>
        
        <h2>返金方法</h2>
        <p>ご指定の銀行口座への振込</p>
        
        <h2>返金時期</h2>
        <p>返品商品到着確認後、通常1週間以内</p>
        
        <h2>解約・キャンセルポリシー</h2>
        <p>商品発送前であれば、キャンセルを承ります。</p>
        
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
          最終更新日：2026年10月20日
        </p>
      </div>
    </div>
  );
};

export default LegalNotice; 