import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth';
import './GalleryHeader.css';

const GalleryHeader: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      navigate('/gallery');
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 検索結果ページに遷移
      navigate(`/gallery/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMyPageClick = () => {
    navigate('/gallery/mypage');
    setIsMenuOpen(false);
  };

  return (
    <header className="gallery-header">
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

        <div className="gallery-header-right">
          <div className="user-section">
            {currentUser ? (
              <div className="user-menu">
                <button className="user-button" onClick={toggleMenu}>
                  <div className="user-avatar">
                    <span className="user-initials">
                      {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <span className="user-name">{currentUser.displayName || 'ユーザー'}</span>
                  <span className="menu-arrow">▼</span>
                </button>
                {isMenuOpen && (
                  <div className="user-dropdown">
                    <button onClick={handleMyPageClick} className="dropdown-item">
                      <span className="dropdown-icon">👤</span>
                      マイページ
                    </button>
                    <button onClick={handleLogout} className="dropdown-item">
                      <span className="dropdown-icon">🚪</span>
                      ログアウト
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/gallery/login" className="login-button">
                <span className="login-icon">🔑</span>
                <span className="login-text">ログイン</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default GalleryHeader; 