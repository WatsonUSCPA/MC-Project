import React from 'react';
import './GalleryMainSite.css';

const GalleryMainSite: React.FC = () => {
  const handleGoToMainSite = () => {
    window.location.href = '/';
  };

  const handleGoToAllProducts = () => {
    window.location.href = '/all-products';
  };

  const handleGoToKits = () => {
    window.location.href = '/kits';
  };

  const handleGoToSubscription = () => {
    window.location.href = '/subscription';
  };

  const handleGoToInfluencerCollab = () => {
    window.location.href = '/influencer_subscription';
  };

  return (
    <div className="gallery-main-site">
      <div className="main-site-container">
        <div className="main-site-header">
          <h1>🧵 生地を購入</h1>
          <p>クラフトキッチンで使える高品質な生地を豊富に取り揃えています</p>
        </div>

        <div className="main-site-content">
          <div className="site-description">
            <h2>クラフトキッチン × エムシースクエア</h2>
            <p>手作りを応援する様々なサービスをご提供しています。<br />
            生地の販売・キット・サブスクリプション・インフルエンサーコラボなど。</p>
          </div>

          <div className="service-cards">
            <div className="service-card" onClick={handleGoToAllProducts}>
              <div className="service-icon">🧵</div>
              <h3>生地の販売</h3>
              <p>高品質な生地を豊富に取り揃えています</p>
              <button className="service-btn">詳細を見る</button>
            </div>

            <div className="service-card" onClick={handleGoToKits}>
              <div className="service-icon">🎨</div>
              <h3>キット</h3>
              <p>初心者でも簡単に作れるキットセット</p>
              <button className="service-btn">詳細を見る</button>
            </div>

            <div className="service-card" onClick={handleGoToSubscription}>
              <div className="service-icon">📦</div>
              <h3>サブスクリプション</h3>
              <p>定期的に新しい材料をお届け</p>
              <button className="service-btn">詳細を見る</button>
            </div>

            <div className="service-card" onClick={handleGoToInfluencerCollab}>
              <div className="service-icon">🌟</div>
              <h3>インフルエンサーコラボ</h3>
              <p>人気インフルエンサーとのコラボ商品</p>
              <button className="service-btn">詳細を見る</button>
            </div>
          </div>

          <div className="main-site-actions">
            <button className="main-site-btn primary" onClick={handleGoToMainSite}>
              <span role="img" aria-label="ホーム">🏠</span>
              エムシースクエアのホームへ
            </button>
            <button className="main-site-btn secondary" onClick={() => window.history.back()}>
              <span role="img" aria-label="戻る">←</span>
              Galleryに戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryMainSite; 