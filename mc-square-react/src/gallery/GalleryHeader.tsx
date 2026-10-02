import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './GalleryHeader.css';

const GalleryHeader: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 検索結果ページに遷移
      navigate(`/gallery/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="gallery-header gallery-subheader">
      <div className="gallery-header-container">
        <div className="gallery-header-left">
          <Link to="/gallery" className="gallery-logo">
            <div className="craft-kitchen-logo">
              {/* クラフトキッチンのロゴアイコン */}
              <div className="logo-pattern">
                <div className="logo-square brown"></div>
                <div className="logo-square orange"></div>
                <div className="logo-square beige"></div>
                <div className="logo-triangle brown"></div>
              </div>
            </div>
            <div className="logo-text">
              <span className="brand-name">CRAFT KITCHEN</span>
            </div>
          </Link>
          <span className="main-title">クラフトキッチン</span>
        </div>

        <div className="gallery-header-center">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-container">
              <input
                type="text"
                placeholder="クラフトキッチンで作りたい作品"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <span className="search-icon">🔍</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default GalleryHeader; 