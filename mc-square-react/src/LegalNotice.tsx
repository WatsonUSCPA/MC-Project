import React from 'react';
import Header from './Header';
import Footer from './Footer';

const LegalNotice: React.FC = () => (
  <>
    <Header />
    <div className="container" style={{ maxWidth: 1200, margin: '0 auto', background: 'var(--color-background-alt)', padding: '3rem', borderRadius: 20, boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
      <h1 style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '2.5rem', fontWeight: 700, textAlign: 'center', borderBottom: '3px solid var(--color-primary)', paddingBottom: '1rem' }}>特定商取引法に基づく表記</h1>
      <section style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>事業者の名称</h3>
        <p>株式会社MCスクエア</p>
      </section>
      <section style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>代表者</h3>
        <p>運営統括責任者：髙橋宏治</p>
      </section>
      <section style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>所在地</h3>
        <p>〒244-0811<br />神奈川県横浜市戸塚区上柏尾町132-3 SKビル2階</p>
      </section>
      <section style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>連絡先</h3>
        <p><strong>電話番号：</strong>045-410-7023<br />
        <strong>メールアドレス：</strong><a href="mailto:retail@mcsquareofficials.com" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>retail@mcsquareofficials.com</a></p>
      </section>
      <section style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>販売価格</h3>
        <p>各商品の価格は、チェックアウト時に表示される価格にて販売いたします。<br />価格はすべて税込み価格です。</p>
      </section>
      <section style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>追加の手数料等</h3>
        <div style={{ background: '#fff7f2', border: '2px solid var(--color-primary)', borderRadius: 12, padding: '1.5rem', margin: '1rem 0' }}>
          <h4 style={{ color: 'var(--color-primary)', fontWeight: 700, marginBottom: '1rem' }}>配送料について</h4>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '2rem' }}>
            <li>2mまで：400円</li>
            <li>2.5m以上または合計24,200円未満：900円</li>
            <li>24,200円以上のお買い上げ：送料無料</li>
          </ul>
        </div>
      </section>
      <section style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>受け付け可能な決済手段</h3>
        <p>クレジットカード決済（Stripe決済）<br />対応カード：Visa、Mastercard、American Express、JCB、Diners Club、Discover</p>
      </section>
      <section style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>決済期間</h3>
        <p>クレジットカード決済の場合は、注文確定時にただちに処理されます。</p>
      </section>
      <section style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>引き渡し時期</h3>
        <p>ご注文は3～5営業日以内に処理され、商品は14日以内に到着いたします。<br />在庫状況により、お届け時期が変動する場合がございます。</p>
      </section>
      <section style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>返品・交換について</h3>
        <div style={{ background: '#fff7f2', border: '2px solid var(--color-primary)', borderRadius: 12, padding: '1.5rem', margin: '1rem 0' }}>
          <h4 style={{ color: 'var(--color-primary)', fontWeight: 700, marginBottom: '1rem' }}>お客様都合の返品・交換の場合</h4>
          <p><strong>発送処理前の商品：</strong><br />ウェブサイトのキャンセルボタンを押すことで注文のキャンセルが可能です。</p>
          <p><strong>発送処理後の商品：</strong><br />未開封の商品は、商品到着後10日以内にお客様サポートセンター（電話番号：045-410-7023）にご連絡いただいた場合に限り、お客様の送料負担にて返金又は同額以下の商品と交換いたします。<br /><strong>開封後の商品は、返品・交換はお受けしておりません。</strong></p>
        </div>
        <div style={{ background: '#fff7f2', border: '2px solid var(--color-primary)', borderRadius: 12, padding: '1.5rem', margin: '1rem 0' }}>
          <h4 style={{ color: 'var(--color-primary)', fontWeight: 700, marginBottom: '1rem' }}>商品に不備がある場合</h4>
          <p>当社の送料負担にて返金又は新しい商品と交換いたします。<br />まずはお客様サポートセンター（電話番号：045-410-7023）までご連絡ください。</p>
        </div>
      </section>
      <section style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>返品・交換の送料について</h3>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '2rem' }}>
          <li>お客様都合による返品・交換：お客様負担</li>
          <li>商品不備による返品・交換：当社負担</li>
        </ul>
      </section>
      <section style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>在庫について</h3>
        <p>ご注文後、在庫を確認し、在庫があるものは郵送いたします。<br />在庫切れの商品があった場合は、該当分を返金いたします。</p>
      </section>
      <section style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>個人情報の取り扱いについて</h3>
        <p>お客様の個人情報は、商品の発送およびお客様サポートの目的でのみ使用いたします。<br />第三者への提供はいたしません。</p>
      </section>
      <div style={{ background: 'var(--color-background-alt)', borderRadius: 20, padding: '2rem', marginTop: '3rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)', maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', marginBottom: '1.5rem', textAlign: 'center' }}>お問い合わせ</h3>
        <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}><strong>お客様サポートセンター</strong><br />電話番号：<a href="tel:045-410-7023" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>045-410-7023</a><br />メールアドレス：<a href="mailto:retail@mcsquareofficials.com" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>retail@mcsquareofficials.com</a></p>
        <p style={{ marginBottom: 0 }}>営業時間：平日 9:00～18:00（土日祝日除く）</p>
      </div>
    </div>
    <Footer />
  </>
);

export default LegalNotice; 