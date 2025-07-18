import React from 'react';
import Header from './Header';
import Footer from './Footer';

const TermsOfService: React.FC = () => (
  <>
    <Header />
    <div className="container" style={{ maxWidth: 1200, margin: '0 auto', background: 'var(--color-background-alt)', padding: '3rem', borderRadius: 20, boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
      <h1 style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '2.5rem', fontWeight: 700, textAlign: 'center', borderBottom: '3px solid var(--color-primary)', paddingBottom: '1rem' }}>利用規約</h1>
      <div className="terms-section" style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>第1条（適用範囲）</h3>
        <p>本規約は、株式会社MCスクエア（以下「当社」といいます）が運営するウェブサイト（以下「本サイト」といいます）の利用に関し、当社と利用者（以下「ユーザー」といいます）との間に適用されます。</p>
      </div>
      <div className="terms-section" style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>第2条（利用登録）</h3>
        <p>ユーザーは、本規約に同意の上、当社所定の方法により利用登録を行うものとします。登録情報に虚偽があった場合、当社は登録を取り消すことができます。</p>
      </div>
      <div className="terms-section" style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>第3条（禁止事項）</h3>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '2rem' }}>
          <li>法令または公序良俗に違反する行為</li>
          <li>犯罪行為に関連する行為</li>
          <li>当社や第三者の権利・利益を侵害する行為</li>
          <li>虚偽の情報の登録</li>
          <li>本サイトの運営を妨害する行為</li>
          <li>その他当社が不適切と判断する行為</li>
        </ul>
      </div>
      <div className="terms-section" style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>第4条（サービスの提供の停止等）</h3>
        <p>当社は、以下の場合にユーザーへの事前通知なく本サイトの全部または一部の提供を停止・中断できるものとします。</p>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '2rem' }}>
          <li>システムの保守点検・更新の場合</li>
          <li>火災・停電・天災等の不可抗力の場合</li>
          <li>その他、運営上やむを得ない場合</li>
        </ul>
      </div>
      <div className="terms-section" style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>第5条（著作権・知的財産権）</h3>
        <p>本サイトに掲載されているコンテンツ（文章・画像・ロゴ等）の著作権・知的財産権は当社または正当な権利者に帰属します。無断転載・複製・改変等を禁止します。</p>
      </div>
      <div className="terms-section" style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>第6条（免責事項）</h3>
        <p>本サイトの利用により生じたユーザーまたは第三者の損害について、当社は一切の責任を負いません。ただし、当社の故意または重過失による場合はこの限りではありません。</p>
      </div>
      <div className="terms-section" style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>第7条（利用規約の変更）</h3>
        <p>当社は、必要と判断した場合には、ユーザーに通知することなく本規約を変更できるものとします。変更後の規約は、本サイトに掲載した時点から効力を生じます。</p>
      </div>
      <div className="terms-section" style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>第8条（準拠法・裁判管轄）</h3>
        <p>本規約の解釈・適用は日本法に準拠し、本サイトに関する紛争は当社本店所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。</p>
      </div>
      <div className="terms-section" style={{ marginBottom: '2.5rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 8px rgba(255,159,124,0.08)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>第9条（お問い合わせ）</h3>
        <p>本規約に関するお問い合わせは、下記までご連絡ください。</p>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '2rem' }}>
          <li>電話番号：045-410-7023</li>
          <li>メールアドレス：<a href="mailto:retail@mcsquareofficials.com">retail@mcsquareofficials.com</a></li>
        </ul>
      </div>
    </div>
    <Footer />
  </>
);

export default TermsOfService; 