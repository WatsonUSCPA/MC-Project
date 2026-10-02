import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GalleryHome.css';
import { getRecipeSource } from './partners';
import { fetchRecipeIndex, sortNew, sortPopular } from '../shared/recipesApi';

interface Recipe {
  id: string;
  title: string;
  author: string;
  image: string;
  likes: number;
  difficulty: string;
  cookingTime: string;
  tags: string[];
  authorSNS?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    line?: string;
    website?: string;
  };
  mainImageUrl?: string; // Base64エンコードされた画像URL
  description?: string;
  ingredients?: string[];
  steps?: any[];
  youtubeUrl?: string;
  explanationType?: 'video' | 'website' | 'none';
  websiteExplanation?: string;
  authorId?: string;
  authorName?: string;
  partnerId?: string;
  sourceUrl?: string;
  createdAt?: any;
  updatedAt?: any;
  views?: number;
}

interface PopularKeyword {
  id: string;
  name: string;
  image: string;
  order?: number;
}

interface SituationCategory {
  id: string;
  name: string;
  image: string;
  order: number;
}




// レベルとシチュエーションのデータを定義
const LEVEL_CATEGORIES = [
  { id: 'beginner', name: '初級', image: '/Image/CraftKitchen-240.webp' },
  { id: 'intermediate', name: '中級', image: '/Image/CraftKitchen-240.webp' },
  { id: 'advanced', name: '上級', image: '/Image/CraftKitchen-240.webp' }
];



// 人気（いいね数の多い順）と新着、それぞれ上位2件
const getDisplayRecipes = (recipes: Recipe[]) => ({
  popular: sortPopular(recipes as any).slice(0, 2) as unknown as Recipe[],
  new: sortNew(recipes as any).slice(0, 2) as unknown as Recipe[],
});

const DEFAULT_KEYWORDS: PopularKeyword[] = [
  { id: 'default-1', name: 'バッグ', image: '/Image/CraftKitchen-240.webp', order: 1 },
  { id: 'default-2', name: 'ポーチ', image: '/Image/CraftKitchen-240.webp', order: 2 },
  { id: 'default-3', name: 'キッズ', image: '/Image/CraftKitchen-240.webp', order: 3 },
  { id: 'default-4', name: 'はぎれ', image: '/Image/CraftKitchen-240.webp', order: 4 },
];

const GalleryHome: React.FC = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [popularKeywords, setPopularKeywords] = useState<PopularKeyword[]>([]);
  const [situationCategories, setSituationCategories] = useState<SituationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);


  // レシピ一覧・人気キーワード・シチュエーションを1回の軽量リクエストで取得
  // （以前は recipes コレクション全体＝base64画像込み約11MBを読み込んでいた）
  useEffect(() => {
    let alive = true;
    const load = (attempt = 0) => {
      fetchRecipeIndex()
        .then((index) => {
          if (!alive) return;
          // 画像が未登録のカテゴリはクラフトキッチンのロゴを表示
          const withImage = <T extends { image: string }>(list: T[]) =>
            list.map((c) => ({ ...c, image: c.image || '/Image/CraftKitchen-240.webp' }));
          setPopularKeywords(index.keywords.length ? withImage(index.keywords) : DEFAULT_KEYWORDS);
          setSituationCategories(withImage(index.situations));
          setRecipes(index.recipes.map((r) => ({
            id: r.id,
            title: r.title,
            author: r.partnerName,
            image: r.thumb,
            mainImageUrl: r.thumb,
            likes: r.likes,
            difficulty: r.difficulty,
            cookingTime: r.cookingTime,
            tags: r.tags,
            authorSNS: r.authorSNS,
            description: r.description,
            partnerId: r.partnerId,
            sourceUrl: r.sourceUrl || undefined,
            createdAt: r.createdAt,
            views: r.views,
          })));
          setImagesLoaded(true);
          setRetryCount(0);
          setLoading(false);
        })
        .catch(() => {
          if (!alive) return;
          if (attempt < 2) {
            setRetryCount(attempt + 1);
            setTimeout(() => load(attempt + 1), 1000 * Math.pow(2, attempt));
          } else {
            setPopularKeywords(DEFAULT_KEYWORDS);
            setRecipes([]);
            setLoading(false);
          }
        });
    };
    load();
    return () => { alive = false; };
  }, []);

  // URLが有効かどうかをチェックする関数
  const isValidUrl = (url: string): boolean => {
    if (!url || !url.trim()) return false;
    
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleAuthorClick = (partnerId?: string) => {
    // パートナーのレシピ一覧（検索ページ）に遷移
    if (partnerId) navigate(`/gallery/search?partner=${encodeURIComponent(partnerId)}`);
  };


  const handleRecipeClick = (recipe: Recipe) => {
    // 新しいページに遷移
    navigate(`/gallery/detail/${recipe.id}`);
  };



  const handleKeywordClick = (keyword: PopularKeyword) => {
    // キーワードで検索ページに遷移
    navigate(`/gallery/search?q=${encodeURIComponent(keyword.name)}`);
  };

  const handleLevelClick = (level: { id: string; name: string }) => {
    // レベル別検索ページに遷移
    navigate(`/gallery/search?level=${level.id}&category=${level.name}`);
  };

  const handleSituationClick = (situation: { id: string; name: string }) => {
    // シチュエーション別検索ページに遷移
    navigate(`/gallery/search?situation=${situation.id}&category=${situation.name}`);
  };

  const handleViewMorePopular = () => {
    // 人気レシピ一覧ページに遷移
    navigate('/gallery/search?sort=popular');
  };

  const handleViewMoreNew = () => {
    // 新着レシピ一覧ページに遷移
    navigate('/gallery/search?sort=new');
  };

  if (loading) {
    return (
      <div className="recipe-gallery">
        <div className="loading">
          データを読み込み中...
          {retryCount > 0 && (
            <div className="retry-info">
              接続に時間がかかっています。再試行中... ({retryCount}/2)
            </div>
          )}
        </div>
        {/* ローディング中でもキーワードセクションを表示 */}
        <div className="gallery-content">
          {popularKeywords.length > 0 && (
            <section className="popular-keywords">
                          <h2 className="section-title">
              人気のキーワード
            </h2>
              <div className="keywords-grid">
                {popularKeywords.map(keyword => (
                  <div key={keyword.id} className="keyword-card" onClick={() => handleKeywordClick(keyword)}>
                    <img src={keyword.image} alt={keyword.name} className="keyword-image" loading="lazy" />
                    <span className="keyword-name">{keyword.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  const displayRecipes = getDisplayRecipes(recipes);

  return (
    <div className="recipe-gallery">
      {/* コンテンツエリア */}
      <div className="gallery-content">

        {/* 商用利用制限の注意書き */}
        <div className="commercial-use-disclaimer">
          <div className="disclaimer-content">
            <span className="disclaimer-icon">⚠️</span>
            <p className="disclaimer-text">
              商用利用が制限されている場合があります。<br />
              必ずご確認の上レシピをお楽しみください。
            </p>
          </div>
        </div>

        {/* 人気キーワード */}
        {popularKeywords.length > 0 && (
          <section className="popular-keywords">
            <h2 className="section-title">
              人気のキーワード
            </h2>
            <div className="keywords-grid">
              {popularKeywords.map(keyword => (
                <div key={keyword.id} className="keyword-card" onClick={() => handleKeywordClick(keyword)}>
                  <img 
                    src={keyword.image} 
                    alt={keyword.name} 
                    className="keyword-image" 
                    loading="lazy"
                    onError={(e) => {
                      // 画像読み込みエラー時の処理
                      e.currentTarget.src = '/Image/CraftKitchen-240.webp';
                    }}
                  />
                  <span className="keyword-name">{keyword.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* レベルから探す */}
        <section className="level-categories">
          <h2 className="section-title">レベルから探す</h2>
          <div className="categories-grid">
            {LEVEL_CATEGORIES.map(level => (
              <div key={level.id} className="category-card" onClick={() => handleLevelClick(level)}>
                <img 
                  src={level.image} 
                  alt={level.name} 
                  className="category-image" 
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = '/Image/CraftKitchen-240.webp';
                  }}
                />
                <span className="category-name">{level.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* シチュエーションから探す */}
        <section className="situation-categories">
          <h2 className="section-title">シチュエーションから探す</h2>
          <div className="categories-grid">
            {situationCategories.map(situation => (
              <div key={situation.id} className="category-card" onClick={() => handleSituationClick(situation)}>
                <img 
                  src={situation.image} 
                  alt={situation.name} 
                  className="category-image" 
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = '/Image/CraftKitchen-240.webp';
                  }}
                />
                <span className="category-name">{situation.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 人気レシピ */}
        <section className="popular-recipes">
          <div className="section-header">
            <h2 className="section-title">クラフトキッチン 人気レシピ</h2>
            <button className="view-more-button" onClick={handleViewMorePopular}>
              もっと見る →
            </button>
          </div>
          {displayRecipes.popular.length > 0 ? (
            <div className="recipes-grid">
              {displayRecipes.popular.map(recipe => (
                <div key={recipe.id} className="recipe-card" onClick={() => handleRecipeClick(recipe)}>
                  <div className="recipe-image">
                    <img 
                      src={recipe.mainImageUrl || recipe.image} 
                      alt={recipe.title}
                      loading="lazy"
                      decoding="async"
                      width={480}
                      height={270}
                      onLoad={(e) => {
                        // 画像読み込み完了時の処理
                        e.currentTarget.style.opacity = '1';
                      }}
                      onError={(e) => {
                        // 画像読み込みエラー時の処理
                        e.currentTarget.src = '/Image/Goods Picture.png';
                        e.currentTarget.style.opacity = '1';
                      }}
                      style={{ opacity: 0, transition: 'opacity 0.3s' }}
                    />
                  </div>
                  <div className="recipe-info">
                    <h3 className="recipe-title">{recipe.title}</h3>
                    <div className="recipe-author-info" onClick={(e) => {
                      e.stopPropagation();
                      handleAuthorClick(recipe.partnerId);
                    }}>
                      <span className="author-avatar">👤</span>
                      <span className="author-name">{recipe.author}</span>
                      {recipe.authorSNS && (
                        <span className="sns-icons">
                          {recipe.authorSNS.twitter && isValidUrl(recipe.authorSNS.twitter) && <span className="sns-icon twitter">🐦</span>}
                          {recipe.authorSNS.instagram && isValidUrl(recipe.authorSNS.instagram) && <span className="sns-icon instagram">📸</span>}
                          {recipe.authorSNS.facebook && isValidUrl(recipe.authorSNS.facebook) && <span className="sns-icon facebook">📘</span>}
                          {recipe.authorSNS.line && isValidUrl(recipe.authorSNS.line) && <span className="sns-icon line">💬</span>}
                          {recipe.authorSNS.website && isValidUrl(recipe.authorSNS.website) && <span className="sns-icon website">🔗</span>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-recipes-message">
              <div className="no-recipes-icon">🎨</div>
              <h3>レシピを準備中です</h3>
              <p>パートナーのレシピを順次掲載していきます。</p>
            </div>
          )}
        </section>

        {/* 新着レシピ */}
        <section className="new-recipes">
          <div className="section-header">
            <h2 className="section-title">クラフトキッチン 新着レシピ</h2>
            <button className="view-more-button" onClick={handleViewMoreNew}>
              もっと見る →
            </button>
          </div>
          {displayRecipes.new.length > 0 ? (
            <div className="recipes-grid">
              {displayRecipes.new.map(recipe => (
                <div key={recipe.id} className="recipe-card" onClick={() => handleRecipeClick(recipe)}>
                  <div className="recipe-image">
                    <img 
                      src={recipe.mainImageUrl || recipe.image} 
                      alt={recipe.title}
                      loading="lazy"
                      decoding="async"
                      width={480}
                      height={270}
                      onLoad={(e) => {
                        // 画像読み込み完了時の処理
                        e.currentTarget.style.opacity = '1';
                      }}
                      onError={(e) => {
                        // 画像読み込みエラー時の処理
                        e.currentTarget.src = '/Image/Goods Picture.png';
                        e.currentTarget.style.opacity = '1';
                      }}
                      style={{ opacity: 0, transition: 'opacity 0.3s' }}
                    />
                  </div>
                  <div className="recipe-info">
                    <h3 className="recipe-title">{recipe.title}</h3>
                    <div className="recipe-author-info" onClick={(e) => {
                      e.stopPropagation();
                      handleAuthorClick(recipe.partnerId);
                    }}>
                      <span className="author-avatar">👤</span>
                      <span className="author-name">{recipe.author}</span>
                      {recipe.authorSNS && (
                        <span className="sns-icons">
                          {recipe.authorSNS.twitter && isValidUrl(recipe.authorSNS.twitter) && <span className="sns-icon twitter">🐦</span>}
                          {recipe.authorSNS.instagram && isValidUrl(recipe.authorSNS.instagram) && <span className="sns-icon instagram">📸</span>}
                          {recipe.authorSNS.facebook && isValidUrl(recipe.authorSNS.facebook) && <span className="sns-icon facebook">📘</span>}
                          {recipe.authorSNS.line && isValidUrl(recipe.authorSNS.line) && <span className="sns-icon line">💬</span>}
                          {recipe.authorSNS.website && isValidUrl(recipe.authorSNS.website) && <span className="sns-icon website">🔗</span>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-recipes-message">
              <div className="no-recipes-icon">🎨</div>
              <h3>レシピを準備中です</h3>
              <p>パートナーのレシピを順次掲載していきます。</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default GalleryHome; 