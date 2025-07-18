import React from 'react';
import Header from './Header';
import Footer from './Footer';

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container">
      <Header />
      <div className="policy-content" style={{ background: 'var(--color-background)', borderRadius: 20, padding: '5rem', marginBottom: '3rem', boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)', border: '1px solid var(--color-border)' }}>
        <h1 className="policy-title" style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '3rem', fontWeight: 700, textAlign: 'center', borderBottom: '3px solid var(--color-primary)', paddingBottom: '1rem' }}>プライバシーポリシー</h1>
        <div className="policy-section" style={{ marginBottom: '3rem', padding: '2rem', background: 'white', borderRadius: 20, boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-border)' }}>1. 事業者情報</h3>
          <p>株式会社MCスクエア<br />〒244-0811 神奈川県横浜市戸塚区上柏尾町132-3 SKビル2階</p>
        </div>
        <div className="policy-section" style={{ marginBottom: '3rem', padding: '2rem', background: 'white', borderRadius: 20, boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-border)' }}>2. 収集する情報</h3>
          <ul style={{ margin: '1rem 0', paddingLeft: '2rem' }}>
            <li>氏名、住所、電話番号、メールアドレス等のお客様情報</li>
            <li>ご注文内容、配送先情報</li>
            <li>決済に関する情報（クレジットカード情報は決済代行会社を通じて処理され、当社では保持しません）</li>
            <li>お問い合わせ内容</li>
            <li>アクセスログ、クッキー等の利用状況情報</li>
          </ul>
        </div>
        <div className="policy-section" style={{ marginBottom: '3rem', padding: '2rem', background: 'white', borderRadius: 20, boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-border)' }}>3. 情報の利用目的</h3>
          <ul style={{ margin: '1rem 0', paddingLeft: '2rem' }}>
            <li>商品の発送およびサービス提供のため</li>
            <li>ご注文・お問い合わせへの対応のため</li>
            <li>新商品・サービス等のご案内のため</li>
            <li>サービス向上・サイト改善のための分析</li>
            <li>法令等に基づく対応のため</li>
          </ul>
        </div>
        <div className="policy-section" style={{ marginBottom: '3rem', padding: '2rem', background: 'white', borderRadius: 20, boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-border)' }}>4. 情報の管理・保護</h3>
          <p>お客様の個人情報は、適切な安全対策を講じ、漏洩・滅失・毀損・不正アクセス等の防止に努めます。</p>
        </div>
        <div className="policy-section" style={{ marginBottom: '3rem', padding: '2rem', background: 'white', borderRadius: 20, boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-border)' }}>5. 情報の開示・提供</h3>
          <ul style={{ margin: '1rem 0', paddingLeft: '2rem' }}>
            <li>ご本人の同意がある場合</li>
            <li>法令に基づき開示が必要な場合</li>
            <li>業務委託先（配送業者・決済代行会社等）に必要な範囲で提供する場合</li>
          </ul>
          <p>上記以外で第三者に提供することはありません。</p>
        </div>
        <div className="policy-section" style={{ marginBottom: '3rem', padding: '2rem', background: 'white', borderRadius: 20, boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-border)' }}>6. セキュリティ対策</h3>
          <p>当社はSSL等の暗号化技術を用いて情報の安全な送信に努めます。また、社内教育やアクセス制限等により、情報の適切な管理を徹底します。</p>
        </div>
        <div className="policy-section" style={{ marginBottom: '3rem', padding: '2rem', background: 'white', borderRadius: 20, boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-border)' }}>7. クッキー等の利用</h3>
          <p>当サイトでは、利便性向上や利用状況の分析のためにクッキー等を利用する場合があります。ブラウザの設定によりクッキーの受け入れを拒否することも可能ですが、一部サービスがご利用いただけない場合があります。</p>
        </div>
        <div className="policy-section" style={{ marginBottom: '3rem', padding: '2rem', background: 'white', borderRadius: 20, boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-border)' }}>8. お問い合わせ</h3>
          <p>個人情報の開示・訂正・利用停止・削除等のご請求やご質問は、下記までご連絡ください。</p>
          <ul style={{ margin: '1rem 0', paddingLeft: '2rem' }}>
            <li>電話番号：045-410-7023</li>
            <li>メールアドレス：<a href="mailto:retail@mcsquareofficials.com">retail@mcsquareofficials.com</a></li>
          </ul>
        </div>
        <div className="policy-section" style={{ marginBottom: '3rem', padding: '2rem', background: 'white', borderRadius: 20, boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-border)' }}>9. プライバシーポリシーの改定</h3>
          <p>本ポリシーは、法令の改正やサービス内容の変更等により、予告なく改定される場合があります。最新の内容は本ページにてご確認ください。</p>
        </div>
      </div>
      <div className="contact-info" style={{ background: 'var(--color-background-alt)', borderRadius: 20, padding: '2rem', marginTop: '3rem', boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)', border: '1px solid var(--color-border)', maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', marginBottom: '2rem', textAlign: 'center' }}>お問い合わせ</h3>
        <p><strong>お客様サポートセンター</strong><br />
          電話番号：<a href="tel:045-410-7023">045-410-7023</a><br />
          メールアドレス：<a href="mailto:retail@mcsquareofficials.com">retail@mcsquareofficials.com</a></p>
        <p>営業時間：平日 9:00～18:00（土日祝日除く）</p>
      </div>
      <Footer />
      <a href="#top" className="back-to-top" onClick={e => { e.preventDefault(); scrollToTop(); }} style={{ position: 'fixed', bottom: 30, right: 30, background: 'var(--color-primary)', color: 'white', width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 16px rgba(255, 159, 124, 0.12)', zIndex: 1000, fontSize: '1.2rem', textDecoration: 'none' }}>↑</a>
    </div>
  );
};

export default PrivacyPolicy; 