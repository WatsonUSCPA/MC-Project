import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PARTNERS } from './partners';
import { fetchRecipeIndex, RecipeSummary } from '../shared/recipesApi';
import './GallerySearch.css';

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
  mainImageUrl?: string;
  description?: string;
  ingredients?: string[];
  steps?: any[];
  youtubeUrl?: string;
  explanationType?: 'video' | 'website' | 'none';
  websiteExplanation?: string;
  authorId?: string;
  authorName?: string;
  partnerId?: string;
  createdAt?: any;
  updatedAt?: any;
  views?: number;
}

const GallerySearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [categoryTitle, setCategoryTitle] = useState('');
  const [sortOrder, setSortOrder] = useState<'likes' | 'createdAt' | 'title'>('likes');
  
  // ページネーション用の状態
  const [displayedResults, setDisplayedResults] = useState<Recipe[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const ITEMS_PER_PAGE = 6;

  // URLパラメータから検索クエリを取得
  useEffect(() => {
    const searchQueryParam = searchParams.get('q') || '';
    const levelParam = searchParams.get('level') || '';
    const situationParam = searchParams.get('situation') || '';
    const categoryParam = searchParams.get('category') || '';
    const sortParam = searchParams.get('sort') || '';
    const partnerParam = searchParams.get('partner') || '';
    
    setSearchQuery(searchQueryParam);
    setCategoryTitle(categoryParam);
    
    // ページネーション状態をリセット
    setCurrentPage(1);
    setDisplayedResults([]);
    setHasMore(false);
    
    if (searchQueryParam) {
      performSearch(searchQueryParam);
    } else if (levelParam || situationParam) {
      performCategorySearch(levelParam, situationParam);
    } else if (sortParam) {
      performSortSearch(sortParam);
    } else if (partnerParam) {
      performPartnerSearch(partnerParam);
    }
  }, [searchParams, sortOrder]);

  // 検索結果が変更されたときにページネーションを更新
  useEffect(() => {
    const startIndex = 0;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    const newDisplayedResults = searchResults.slice(startIndex, endIndex);
    setDisplayedResults(newDisplayedResults);
    setHasMore(endIndex < searchResults.length);
  }, [searchResults, currentPage]);

  // もっと見るボタンのハンドラー
  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  // 並び順変更ハンドラー
  const handleSortOrderChange = (newSortOrder: 'likes' | 'createdAt' | 'title') => {
    setSortOrder(newSortOrder);
    setCurrentPage(1);
    setDisplayedResults([]);
    setHasMore(false);
    
    // 現在の検索条件で再検索
    const searchQueryParam = searchParams.get('q') || '';
    const levelParam = searchParams.get('level') || '';
    const situationParam = searchParams.get('situation') || '';
    const sortParam = searchParams.get('sort') || '';
    const partnerParam = searchParams.get('partner') || '';
    
    if (searchQueryParam) {
      performSearch(searchQueryParam);
    } else if (levelParam || situationParam) {
      performCategorySearch(levelParam, situationParam);
    } else if (sortParam) {
      performSortSearch(sortParam);
    } else if (partnerParam) {
      performPartnerSearch(partnerParam);
    }
  };



  // 軽量レシピ一覧（パートナーのみ・CDNキャッシュ）を取得して画面用の形に変換
  const loadRecipes = async (): Promise<Recipe[]> => {
    const { recipes: list } = await fetchRecipeIndex();
    return list.map((r: RecipeSummary) => ({
      id: r.id,
      title: r.title,
      author: r.partnerName,
      image: r.thumb,
      likes: r.likes,
      difficulty: r.difficulty || '初級',
      cookingTime: r.cookingTime || '1時間',
      tags: r.tags || [],
      authorSNS: r.authorSNS || {},
      mainImageUrl: r.thumb,
      description: r.description,
      ingredients: r.ingredients,
      partnerId: r.partnerId,
      createdAt: r.createdAt,
      views: r.views,
    }));
  };

  // 並び順（人気・新着・タイトル）
  const sortRecipes = (list: Recipe[], order: 'likes' | 'createdAt' | 'title') => {
    const t = (v: any) => (v ? new Date(v).getTime() || 0 : 0);
    return [...list].sort((a, b) =>
      order === 'title' ? a.title.localeCompare(b.title, 'ja')
        : order === 'createdAt' ? t(b.createdAt) - t(a.createdAt)
        : (b.likes - a.likes));
  };

  const runSearch = async (filter: (r: Recipe) => boolean, order: 'likes' | 'createdAt' | 'title' = sortOrder) => {
    try {
      setLoading(true);
      setHasSearched(true);
      const all = await loadRecipes();
      setSearchResults(sortRecipes(all.filter(filter), order));
    } catch (error) {
      console.error('検索エラー:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // カテゴリ検索（レベル・シチュエーション）
  const performCategorySearch = async (level: string, situation: string) => {
    const levelMapping: Record<string, string> = { beginner: '初級', intermediate: '中級', advanced: '上級' };
    const categoryName = (searchParams.get('category') || '').toLowerCase();
    await runSearch((recipe) => {
      if (level && recipe.difficulty !== levelMapping[level]) return false;
      if (situation && categoryName) {
        const texts = [recipe.title, recipe.description, ...recipe.tags].filter((t) => t && typeof t === 'string') as string[];
        if (!texts.some((t) => t.toLowerCase().includes(categoryName))) return false;
      }
      return true;
    });
  };

  // 人気順・新着順の一覧
  const performSortSearch = async (sortType: string) => {
    if (sortType === 'popular') setCategoryTitle('人気レシピ');
    else if (sortType === 'new') setCategoryTitle('新着レシピ');
    await runSearch(() => true, sortType === 'popular' ? 'likes' : 'createdAt');
  };

  // パートナー別一覧
  const performPartnerSearch = async (partnerId: string) => {
    const partner = PARTNERS.find(p => p.id === partnerId);
    setCategoryTitle(partner ? partner.name : '');
    await runSearch((recipe) => recipe.partnerId === partnerId);
  };

  // キーワード検索（タイトル・説明・タグ・パートナー名・材料）
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    const q = query.toLowerCase();
    await runSearch((recipe) =>
      recipe.title.toLowerCase().includes(q) ||
      !!recipe.description?.toLowerCase().includes(q) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(q)) ||
      recipe.author.toLowerCase().includes(q) ||
      !!recipe.ingredients?.some(i => i.toLowerCase().includes(q)));
  };

  const handleRecipeClick = (recipe: Recipe) => {
    navigate(`/gallery/detail/${recipe.id}`);
  };

  const handleAuthorClick = (partnerId?: string) => {
    if (partnerId) navigate(`/gallery/search?partner=${encodeURIComponent(partnerId)}`);
  };

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

  const handleBackToHome = () => {
    navigate('/gallery');
  };

  return (
    <div className="gallery-search">
      <div className="search-header">
        <button className="back-button" onClick={handleBackToHome}>
          ← ホームに戻る
        </button>
        <h1 className="search-title">
          {categoryTitle ? `${categoryTitle}のレシピ` : `検索結果: "${searchQuery}"`}
        </h1>
      </div>

      {loading ? (
        <div className="loading">検索中...</div>
      ) : (
        <div className="search-content">
          {hasSearched && (
            <div className="search-controls">
              <div className="search-stats">
                {searchResults.length}件の結果が見つかりました
              </div>
              <div className="sort-controls">
                <label htmlFor="sort-order">並び順:</label>
                <select
                  id="sort-order"
                  value={sortOrder}
                  onChange={(e) => handleSortOrderChange(e.target.value as 'likes' | 'createdAt' | 'title')}
                  className="sort-select"
                >
                  <option value="likes">人気順</option>
                  <option value="createdAt">新着順</option>
                  <option value="title">タイトル順</option>
                </select>
              </div>
            </div>
          )}

          {searchResults.length === 0 && hasSearched ? (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>検索結果が見つかりませんでした</h3>
              <p>別のキーワードで検索してみてください</p>
              <div className="search-suggestions">
                <h4>検索のヒント:</h4>
                <ul>
                  <li>作品名で検索</li>
                  <li>パートナー名（うさんこ、クロバー）で検索</li>
                  <li>タグ（パッチワーク、クッションなど）で検索</li>
                  <li>材料名（綿、リネン、ボタンなど）で検索</li>
                  <li>難易度（初級、中級、上級）で検索</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="search-results">
              <div className="recipes-grid">
                {displayedResults.map(recipe => (
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
                          e.currentTarget.style.opacity = '1';
                        }}
                        onError={(e) => {
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
              
              {hasMore && (
                <div className="load-more-container">
                  <button className="load-more-button" onClick={handleLoadMore}>
                    もっと見る ({displayedResults.length}/{searchResults.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GallerySearch; 