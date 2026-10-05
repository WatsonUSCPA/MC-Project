import React, { Suspense, lazy } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Header from './ec/components/ECHeader';
import Footer from './shared/components/Footer';
// import YorisoiCraft from './YorisoiCraft';
import { CartProvider } from './ec/context/CartContext';
import { useEffect, useState } from 'react';
import RecipeStrip from './shared/components/RecipeStrip';
import ImageSlider from './ec/components/ImageSlider';
import InstallPrompt from './pwa/InstallPrompt';


// 各ページは開いたときだけ読み込む（トップページの初回表示を軽くする）
const AllProducts = lazy(() => import('./ec/pages/AllProducts'));
const Kits = lazy(() => import('./ec/pages/KitsNew'));
const InfluencerCollab = lazy(() => import('./ec/pages/InfluencerCollab'));
const Subscription = lazy(() => import('./ec/pages/Subscription'));
const Success = lazy(() => import('./ec/pages/Success'));
const Cancel = lazy(() => import('./ec/pages/Cancel'));
const TermsOfService = lazy(() => import('./ec/pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./ec/pages/PrivacyPolicy'));
const LegalNotice = lazy(() => import('./ec/pages/LegalNotice'));
const Contact = lazy(() => import('./ec/pages/Contact'));
const Login = lazy(() => import('./ec/pages/Login'));
const GalleryApp = lazy(() => import('./gallery/GalleryApp'));

// ページ遷移時にスクロール位置を最上部にリセットするコンポーネント
const ScrollToTop: React.FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    // ページ遷移時にスクロール位置を最上部にリセット
    // 少し遅延を入れて確実にスクロール位置をリセット
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);
  
  return null;
};

// ショップとクラフトキッチンで共通のヘッダー・フッター
const AppLayout: React.FC = () => {

  return (
    <>
      <ScrollToTop />
      <Header />
      <Suspense fallback={<div className="page-loading" style={{ minHeight: '60vh' }} aria-busy="true" />}>
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
                  <span role="img" aria-label="レシピ">📖</span>
                  レシピ
                </Link>
                <Link to="/gallery" className="hero-btn">
                  <span role="img" aria-label="クラフトキッチン">🎨</span>
                  クラフトキッチン
                </Link>
              </div>
            </section>
            
            {/* ImageSlider セクション */}
            <ImageSlider />

            {/* クラフトキッチン（提携クリエイターのレシピ） */}
            <RecipeStrip
              title="クラフトキッチン 新着レシピ"
              subtitle="うさんこチャンネル・クロバーの作り方レシピを無料で公開中"
              mode="new"
              moreLink="/gallery/search?sort=new"
            />
            <RecipeStrip title="人気のレシピ" mode="popular" moreLink="/gallery/search?sort=popular" />
            
            {/* Instagramフォローセクション */}
            <section className="instagram-follow-section">
              <div className="instagram-follow-title">📸 Instagramでは最新記事などの情報を発信しています。</div>
              
              {/* Instagram紹介写真 */}
              <div className="instagram-intro-image">
                <a 
                  href="https://www.instagram.com/mc.square_official/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="instagram-image-link"
                >
                  <img 
                    src="/Image/introduce-instagram-800.webp"
                    width={400}
                    height={686}
                    loading="lazy"
                    decoding="async" 
                    alt="Instagram紹介写真 - クリックしてフォロー" 
                    className="instagram-preview"
                  />
                </a>
              </div>
              
              <div className="instagram-follow-content">
                <p>最新の作品やレシピ、手作りのヒントを毎日配信中！</p>
                <a 
                  href="https://www.instagram.com/mc.square_official/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="instagram-follow-btn"
                >
                  📸 Instagramをフォロー
                </a>
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
      </Suspense>
      <Footer />
      <InstallPrompt />
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
        // Firebase SDK はお知らせ表示時に遅れて読み込む（初回表示を軽くする）
        const [{ getFirestore, collection, getDocs }, { app }] = await Promise.all([
          import('firebase/firestore'),
          import('./firebase'),
        ]);
        const newsCol = collection(getFirestore(app), 'news');
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
