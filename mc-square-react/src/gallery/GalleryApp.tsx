import React from 'react';
import { Routes, Route } from 'react-router-dom';
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

const GalleryApp: React.FC = () => {
  return (
    <div className="gallery-app">
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