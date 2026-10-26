import React from 'react';
import { Link } from 'react-router-dom';
import MockBanner from './MockBanner';
import './Mock.css';

// 会員ページの案（モック）
// 特典の中身・登録方法は未確定。既存ページの内容（価格・商品情報）は変えない。
const perks = [
  {
    title: '新着生地を先にお知らせ',
    body: '入荷した生地を、写真と価格つきで LINE またはメールでお届けします。',
  },
  {
    title: 'レシピから生地を選べる',
    body: 'クラフトキッチンのレシピを見ながら、使う生地をそのまま探せます。',
  },
  {
    title: '作品を匿名で掲載',
    body: '作った作品をサイトに載せられます。お名前は出しません。',
  },
  {
    title: '購入履歴とお気に入り',
    body: '前に買った生地や、気になる生地をあとから見返せます。',
  },
];

const steps = [
  { title: 'Google アカウントでログイン', body: '新しくパスワードを作る必要はありません（案）。' },
  { title: '受け取り方法を選ぶ', body: 'LINE かメールか、新着のお知らせの受け取り方を選びます。' },
  { title: '完了', body: 'その日から新着のお知らせが届きます。' },
];

const Members: React.FC = () => (
  <div className="mock-page">
    <MockBanner note="会員ページの案です。特典の内容・登録方法は未確定で、本番サイトには出ていません。" />

    <section className="mock-hero">
      <p className="mock-eyebrow">会員のご案内（案）</p>
      <h1>エムシースクエアの会員になると</h1>
      <p className="mock-lead">
        新着生地のお知らせ、レシピからの生地選び、作品の掲載。<br />
        手作りをもっと続けやすくするための会員サービスです。
      </p>
    </section>

    <section className="mock-section">
      <h2>会員の特典</h2>
      <div className="mock-perks">
        {perks.map((p) => (
          <div className="mock-perk" key={p.title}>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="mock-section">
      <h2>登録の流れ</h2>
      <ol className="mock-steps">
        {steps.map((s) => (
          <li key={s.title}>
            <b>{s.title}</b>
            <span>{s.body}</span>
          </li>
        ))}
      </ol>
      <button type="button" className="mock-btn" disabled>会員登録（準備中）</button>
    </section>

    <section className="mock-section mock-line">
      <div>
        <h2>LINE で新着を受け取る</h2>
        <p>LINE 公式アカウントは準備中です。友だち追加用の QR コードはここに入ります。</p>
      </div>
      <div className="mock-qr" aria-label="QRコードの置き場所">QR</div>
    </section>

    <section className="mock-section">
      <h2>みんなの作品</h2>
      <p className="mock-note">会員から投稿された作品を、お名前を出さずに紹介する枠です。投稿は管理側で確認してから公開します。</p>
      <div className="mock-gallery">
        {['作品写真 1', '作品写真 2', '作品写真 3', '作品写真 4'].map((t) => (
          <div className="mock-gallery-item" key={t}>{t}</div>
        ))}
      </div>
    </section>

    <section className="mock-section">
      <h2>サブスクリプション</h2>
      <p className="mock-note">今のサブスクリプション（国産コットン・アメリカンコットン マンスリー）のページはそのままです。</p>
      <Link to="/subscription" className="mock-btn mock-btn-ghost">サブスクのページを見る</Link>
    </section>
  </div>
);

export default Members;
