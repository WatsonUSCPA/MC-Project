import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import GalleryHome from './GalleryHome';
import GalleryDetail from './GalleryDetail';
import GalleryUpload from './GalleryUpload';
import GalleryLogin from './GalleryLogin';
import GalleryMyPage from './GalleryMyPage';
import GalleryProfileEdit from './GalleryProfileEdit';
import GalleryRecipeEdit from './GalleryRecipeEdit';
import GalleryMainSite from './GalleryMainSite';
import GalleryUserProfile from './GalleryUserProfile';
import GallerySearch from './GallerySearch';
import GalleryAdmin from './GalleryAdmin';
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
        <Routes>
          <Route path="/" element={<GalleryHome />} />
          <Route path="/detail/:recipeId" element={<GalleryDetail />} />
          <Route path="/upload" element={<GalleryUpload />} />
          <Route path="/login" element={<GalleryLogin />} />
          <Route path="/mypage" element={<GalleryMyPage />} />
          <Route path="/profile-edit" element={<GalleryProfileEdit />} />
          <Route path="/recipe-edit/:recipeId" element={<GalleryRecipeEdit />} />
          <Route path="/main-site" element={<GalleryMainSite />} />
          <Route path="/user/:userId" element={<GalleryUserProfile />} />
          <Route path="/search" element={<GallerySearch />} />
          <Route path="/admin" element={<GalleryAdmin />} />
        </Routes>
      </main>
    </div>
  );
};

export default GalleryApp; 