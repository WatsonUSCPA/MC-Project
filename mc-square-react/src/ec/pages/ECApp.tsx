import React, { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import ECHeader from '../components/ECHeader';
import Footer from '../../shared/components/Footer';
import AllProducts from './AllProducts';
import KitsNew from './KitsNew';
import InfluencerCollab from './InfluencerCollab';
import Subscription from './Subscription';
import { CartProvider } from '../context/CartContext';
import { app } from '../../firebase';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import Success from './Success';
import Cancel from './Cancel';
import Login from './Login';
import '../styles/ECApp.css';

// Firebase設定
const db = getFirestore(app);

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

const ECApp: React.FC = () => {
  return (
    <CartProvider>
      <ECHeader />
      <Routes>
        <Route path="/all-products" element={<AllProducts />} />
        <Route path="/kits" element={<KitsNew />} />
        <Route path="/influencer_subscription" element={<InfluencerCollab />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/success" element={<Success />} />
        <Route path="/cancel" element={<Cancel />} />
        <Route path="/login" element={<Login />} />
        
        {/* ECサイトのホームページ */}
        <Route path="/" element={
          <main className="kits-page-container">
            <section className="hero-section">
              <h1 className="hero-title">いいものはいつまでも<br />エムシースクエア公式サイト</h1>
              <p className="hero-subtitle">生地の販売・インフルエンサーコラボ・よりそいクラフトなど、<br />あなたの手作りを応援する本格ECサイトへようこそ。</p>
              <div className="hero-buttons">
                <Link to="/all-products" className="hero-btn">
                  <span role="img" aria-label="生地">🧵</span>
                  生地の販売
                </Link>
                <Link to="/kits" className="hero-btn">
                  <span role="img" aria-label="キット">🧩</span>
                  キット
                </Link>
                <Link to="/influencer_subscription" className="hero-btn">
                  <span role="img" aria-label="インフルエンサーコラボ">🌟</span>
                  インフルエンサーコラボ
                </Link>
                <Link to="/subscription" className="hero-btn">
                  <span role="img" aria-label="サブスクリプション">📦</span>
                  サブスクリプション
                </Link>
              </div>
            </section>

            <NewsSection />

            <section className="features-section">
              <h2 className="section-title">Mission</h2>
              <p style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 600, color: '#333', marginBottom: '3rem' }}>
                モノづくりの幸せを、すべての人へ。
              </p>
              
              <h3 style={{ color: '#e53e3e', fontSize: '1.2rem', fontWeight: 700, marginBottom: '2rem' }}>
                パッチワークがもたらす3つの幸せ
              </h3>
              
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: '#e53e3e', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    作る幸せ
                  </h4>
                  <p style={{ color: '#333', lineHeight: 1.6 }}>
                    自分の手で作品を生み出すよろこび。
                  </p>
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: '#e53e3e', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    集中する幸せ
                  </h4>
                  <p style={{ color: '#333', lineHeight: 1.6 }}>
                    無心で針を動かす時間が、心を整え、日々のストレスを和らげます。
                  </p>
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: '#e53e3e', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    健康になる幸せ
                  </h4>
                  <p style={{ color: '#333', lineHeight: 1.6 }}>
                    手を動かし、考え、創造することで、脳や心の健康を育みます。
                  </p>
                </div>
              </div>
            </section>

            <section className="cta-section">
              <h2>今すぐ始めよう</h2>
              <p>あなたの手作りライフを、MC Squareと一緒に豊かにしませんか？</p>
              <Link to="/all-products" className="cta-button">
                商品を見る
              </Link>
            </section>
          </main>
        } />
      </Routes>
      <Footer />
    </CartProvider>
  );
};

export default ECApp; 