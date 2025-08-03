import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Header from './ec/components/ECHeader';
import Footer from './shared/components/Footer';
import AllProducts from './ec/pages/AllProducts';
import Kits from './ec/pages/KitsNew';
import InfluencerCollab from './ec/pages/InfluencerCollab';
import Subscription from './ec/pages/Subscription';
// import YorisoiCraft from './YorisoiCraft';
import { CartProvider } from './ec/context/CartContext';
import { useEffect, useState } from 'react';
import { app } from './firebase';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import Success from './ec/pages/Success';
import Cancel from './ec/pages/Cancel';
import TermsOfService from './ec/pages/TermsOfService';
import PrivacyPolicy from './ec/pages/PrivacyPolicy';
import LegalNotice from './ec/pages/LegalNotice';
import Contact from './ec/pages/Contact';
import GalleryApp from './gallery/GalleryApp';

import Login from './ec/pages/Login';

// Firebase設定
const db = getFirestore(app);

// ヘッダーとフッターを条件付きで表示するコンポーネント
const AppLayout: React.FC = () => {
  const location = useLocation();
  const isGalleryRoute = location.pathname.startsWith('/gallery');

  return (
    <>
      {!isGalleryRoute && <Header />}
      <Routes>
        <Route path="/all-products" element={<AllProducts />} />
        <Route path="/kits" element={<Kits />} />
        <Route path="/influencer_subscription" element={<InfluencerCollab />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/gallery/*" element={<GalleryApp />} />
        {/* <Route path="/patchwork_kit_website" element={<YorisoiCraft />} /> */}
        <Route path="/success" element={<Success />} />
        <Route path="/cancel" element={<Cancel />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/legal" element={<LegalNotice />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/login" element={<Login />} />
        {/* 必要に応じて他のRouteを追加 */}
        <Route path="/" element={
          <main>
            <section className="hero-section">
              <h1 className="hero-title">いいものはいつまでも<br />エムシースクエア公式サイト</h1>
              <p className="hero-subtitle">生地の販売・インフルエンサーコラボ・よりそいクラフトなど、<br />あなたの手作りを応援する本格ECサイトへようこそ。</p>
              <div className="hero-buttons">
                <Link to="/all-products" className="hero-btn">
                  <span role="img" aria-label="生地">🧵</span>
                  生地の販売
                </Link>
                <Link to="/subscription" className="hero-btn">
                  <span role="img" aria-label="サブスク">📦</span>
                  サブスク
                </Link>
                <Link to="/influencer_subscription" className="hero-btn">
                  <span role="img" aria-label="コラボ">🌟</span>
                  インフルエンサーコラボ
                </Link>
                {/* <Link to="/patchwork_kit_website" className="hero-btn">
                  <span role="img" aria-label="クラフト">✨</span>
                  よりそいクラフト
                </Link> */}
                <Link to="/kits" className="hero-btn">
                  <span role="img" aria-label="キット">🧩</span>
                  キット
                </Link>
                <Link to="/gallery" className="hero-btn">
                  <span role="img" aria-label="ギャラリー">🎨</span>
                  レシピギャラリー
                </Link>
              </div>
            </section>
            <NewsSection />
            
            <section className="mission-section">
              <div className="mission-title">Mission</div>
              <div className="mission-message">モノづくりの幸せを、すべての人へ。</div>
            </section>
            <section className="value-section">
              <div className="value-title">パッチワークがもたらす3つの幸せ</div>
              <ul className="value-list">
                <li>
                  <span className="value-label">作る幸せ</span>
                  <span className="value-desc">自分の手で作品を生み出すよろこび。</span>
                </li>
                <li>
                  <span className="value-label">集中する幸せ</span>
                  <span className="value-desc">無心で針を動かす時間が、心を整え、日々のストレスを和らげます。</span>
                </li>
                <li>
                  <span className="value-label">健康になる幸せ</span>
                  <span className="value-desc">手を動かし、考え、創造することで、脳や心の健康を育みます。</span>
                </li>
              </ul>
            </section>
            <div className="old-website-link">
              <a
                href="http://www.mcsquare.co.jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="old-website-btn"
              >
                旧ウェブサイトはこちら
              </a>
            </div>
            <div className="contact">
              <strong>【お問合せ先】</strong><br />
              〒244-0811 神奈川県横浜市戸塚区上柏尾町132-3 SKビル2階<br />
              TEL：045-410-7023　FAXフリーダイヤル：0120-535-596<br />
              E-mail：<a href="mailto:retail@mcsquareofficials.com" style={{color: 'var(--color-primary)', textDecoration: 'none'}}>retail@mcsquareofficials.com</a>
            </div>
          </main>
        } />
      </Routes>
      {!isGalleryRoute && <Footer />}
    </>
  );
};

function NewsSection() {
  const [news, setNews] = useState<{id: string, date: string, title: string, content: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      setError(null);
      try {
        const newsCol = collection(db, 'news');
        const snapshot = await getDocs(newsCol);
        const newsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        // 日付で降順ソート
        newsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setNews(newsList);
      } catch (e) {
        setError('お知らせの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  return (
    <section className="news-section">
      <div className="news-title-section">お知らせ・最新情報</div>
      {loading && <div>読み込み中...</div>}
      {error && <div style={{color: 'red'}}>{error}</div>}
      {news.map(item => (
        <div className="news-item" key={item.id}>
          <div className="news-date">{item.date}</div>
          <div className="news-title">{item.title}</div>
          <div className="news-content show">{item.content}</div>
        </div>
      ))}
      {(!loading && news.length === 0) && <div>お知らせはありません</div>}
    </section>
  );
}

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
