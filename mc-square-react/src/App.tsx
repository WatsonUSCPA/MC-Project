import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ECApp from './ec/pages/ECApp';
import GalleryApp from './gallery/GalleryApp';

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        {/* ECサイト（ホームページ） */}
        <Route path="/*" element={<ECApp />} />
        
        {/* Galleryサイト */}
        <Route path="/gallery/*" element={<GalleryApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
