import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import GalleryHome from './GalleryHome';
import GalleryDetail from './GalleryDetail';
import GalleryMainSite from './GalleryMainSite';
import GallerySearch from './GallerySearch';
import GalleryHeader from './GalleryHeader';
import './GalleryApp.css';

// ギャラリー内でのページ遷移時にスクロール位置をリセットするコンポーネント
const GalleryScrollToTop: React.FC = () => {
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

const GalleryApp: React.FC = () => {
  return (
    <div className="gallery-app">
      <GalleryScrollToTop />
      <GalleryHeader />
      <main className="gallery-main">
        {/* 閲覧専用のレシピライブラリ（ログイン・投稿・コメント・いいね機能は廃止） */}
        <Routes>
          <Route path="/" element={<GalleryHome />} />
          <Route path="/detail/:recipeId" element={<GalleryDetail />} />
          <Route path="/main-site" element={<GalleryMainSite />} />
          <Route path="/search" element={<GallerySearch />} />
          {/* 旧URL（ログイン・投稿・マイページ・管理画面など）はギャラリートップへ */}
          <Route path="*" element={<Navigate to="/gallery" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default GalleryApp; 