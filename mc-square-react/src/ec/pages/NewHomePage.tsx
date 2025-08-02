import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { app } from '../../firebase';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import './NewHomePage.css';

// Firebase設定
const db = getFirestore(app);

interface NewsItem {
  id: string;
  date: string;
  title: string;
  content: string;
}

const NewHomePage: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      setError(null);
      try {
        const newsCol = collection(db, 'news');
        const snapshot = await getDocs(newsCol);
        const newsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NewsItem[];
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
    <div className="new-homepage">
      {/* ヒーローセクション */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            いいものはいつまでも
            <br />
            <span className="brand-name">エムシースクエア公式サイト</span>
          </h1>
          <p className="hero-subtitle">
            生地の販売・インフルエンサーコラボ・よりそいクラフトなど、
            <br />
            あなたの手作りを応援する本格ECサイトへようこそ。
          </p>
          <div className="hero-buttons">
            <Link to="/all-products" className="hero-btn primary">
              <span className="btn-icon">🧵</span>
              <span className="btn-text">生地の販売</span>
            </Link>
            <Link to="/kits" className="hero-btn secondary">
              <span className="btn-icon">🧩</span>
              <span className="btn-text">キット</span>
            </Link>
            <Link to="/influencer_subscription" className="hero-btn secondary">
              <span className="btn-icon">🌟</span>
              <span className="btn-text">インフルエンサーコラボ</span>
            </Link>
            <Link to="/subscription" className="hero-btn secondary">
              <span className="btn-icon">📦</span>
              <span className="btn-text">サブスクリプション</span>
            </Link>
          </div>
        </div>
        <div className="hero-decoration">
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
      </section>

      {/* お知らせセクション */}
      <section className="news-section">
        <div className="container">
          <h2 className="section-title">
            <span className="title-icon">📢</span>
            お知らせ・最新情報
          </h2>
          <div className="news-grid">
            {loading && (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>読み込み中...</p>
              </div>
            )}
            {error && (
              <div className="error-state">
                <p>{error}</p>
              </div>
            )}
            {news.map(item => (
              <div className="news-card" key={item.id}>
                <div className="news-header">
                  <span className="news-date">{item.date}</span>
                  <div className="news-badge">NEW</div>
                </div>
                <h3 className="news-title">{item.title}</h3>
                <p className="news-content">{item.content}</p>
              </div>
            ))}
            {(!loading && news.length === 0) && (
              <div className="empty-state">
                <p>お知らせはありません</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ミッションセクション */}
      <section className="mission-section">
        <div className="container">
          <div className="mission-content">
            <h2 className="mission-title">Mission</h2>
            <p className="mission-statement">
              モノづくりの幸せを、すべての人へ。
            </p>
            
            <div className="happiness-grid">
              <div className="happiness-card">
                <div className="happiness-icon">🎨</div>
                <h3>作る幸せ</h3>
                <p>自分の手で作品を生み出すよろこび。</p>
              </div>
              <div className="happiness-card">
                <div className="happiness-icon">🧘</div>
                <h3>集中する幸せ</h3>
                <p>無心で針を動かす時間が、心を整え、日々のストレスを和らげます。</p>
              </div>
              <div className="happiness-card">
                <div className="happiness-icon">💪</div>
                <h3>健康になる幸せ</h3>
                <p>手を動かし、考え、創造することで、脳や心の健康を育みます。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">今すぐ始めよう</h2>
            <p className="cta-description">
              あなたの手作りライフを、MC Squareと一緒に豊かにしませんか？
            </p>
            <Link to="/all-products" className="cta-button">
              <span className="cta-icon">🛍️</span>
              商品を見る
            </Link>
          </div>
        </div>
        <div className="cta-decoration">
          <div className="sparkle sparkle-1"></div>
          <div className="sparkle sparkle-2"></div>
          <div className="sparkle sparkle-3"></div>
        </div>
      </section>
    </div>
  );
};

export default NewHomePage; 