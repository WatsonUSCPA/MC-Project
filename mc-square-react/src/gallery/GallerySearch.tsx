import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { findPartner } from './partners';
import CreatorFilter from './CreatorFilter';
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

type SortOrder = 'likes' | 'createdAt' | 'title';
const SORT_ORDERS: SortOrder[] = ['likes', 'createdAt', 'title'];
const LEVEL_MAPPING: Record<string, string> = { beginner: '初級', intermediate: '中級', advanced: '上級' };
const ITEMS_PER_PAGE = 6;

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
const sortRecipes = (list: Recipe[], order: SortOrder) => {
  const t = (v: any) => (v ? new Date(v).getTime() || 0 : 0);
  return [...list].sort((a, b) =>
    order === 'title' ? a.title.localeCompare(b.title, 'ja')
      : order === 'createdAt' ? t(b.createdAt) - t(a.createdAt)
      : (b.likes - a.likes));
};

const GallerySearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // URLパラメータ（検索・カテゴリ・並び順・つくり手）
  // ?creator=<partnerId> がつくり手の絞り込み。以前の ?partner= も同じ意味で受け付ける
  const searchQuery = (searchParams.get('q') || '').trim();
  const levelParam = searchParams.get('level') || '';
  const situationParam = searchParams.get('situation') || '';
  const categoryParam = searchParams.get('category') || '';
  const sortParam = searchParams.get('sort') || '';
  const creatorParam = searchParams.get('creator') || searchParams.get('partner') || '';
  const creator = findPartner(creatorParam);
  const orderParam = searchParams.get('order') as SortOrder | null;
  const sortOrder: SortOrder = orderParam && SORT_ORDERS.includes(orderParam) ? orderParam
    : sortParam === 'new' ? 'createdAt' : 'likes';

  // 一覧はページ内で1回だけ取得し、絞り込み・並び替えは手元で行う
  useEffect(() => {
    let alive = true;
    loadRecipes()
      .then((list) => { if (alive) setRecipes(list); })
      .catch((error) => {
        console.error('検索エラー:', error);
        if (alive) setRecipes([]);
      });
    return () => { alive = false; };
  }, []);

  // 条件が変わったらページネーションを最初に戻す
  useEffect(() => { setCurrentPage(1); }, [searchParams]);

  // つくり手以外の条件（キーワード・レベル・シチュエーション）で絞り込んだ結果
  const baseResults = useMemo(() => {
    if (!recipes) return [];
    const q = searchQuery.toLowerCase();
    const categoryName = categoryParam.toLowerCase();
    return recipes.filter((recipe) => {
      // キーワード検索（タイトル・説明・タグ・パートナー名・材料）
      if (q && !(
        recipe.title.toLowerCase().includes(q) ||
        !!recipe.description?.toLowerCase().includes(q) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(q)) ||
        recipe.author.toLowerCase().includes(q) ||
        !!recipe.ingredients?.some(i => i.toLowerCase().includes(q))
      )) return false;
      // カテゴリ検索（レベル・シチュエーション）
      if (levelParam && recipe.difficulty !== LEVEL_MAPPING[levelParam]) return false;
      if (situationParam && categoryName) {
        const texts = [recipe.title, recipe.description, ...recipe.tags].filter((t) => t && typeof t === 'string') as string[];
        if (!texts.some((t) => t.toLowerCase().includes(categoryName))) return false;
      }
      return true;
    });
  }, [recipes, searchQuery, levelParam, situationParam, categoryParam]);

  // チップに出す、つくり手ごとの件数（いまの検索条件の中で）
  const creatorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    baseResults.forEach((r) => { if (r.partnerId) counts[r.partnerId] = (counts[r.partnerId] || 0) + 1; });
    return counts;
  }, [baseResults]);

  const searchResults = useMemo(() => sortRecipes(
    creator ? baseResults.filter((r) => r.partnerId === creator.id) : baseResults, sortOrder,
  ), [baseResults, creator, sortOrder]);

  const displayedResults = searchResults.slice(0, currentPage * ITEMS_PER_PAGE);
  const hasMore = displayedResults.length < searchResults.length;
  const loading = recipes === null;
  const hasSearched = !loading;

  // URLパラメータを書き換える（共有できるように条件はすべてURLに持つ）
  const updateParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setSearchParams(next, { replace: true });
  };

  const handleCreatorChange = (partnerId: string) => {
    updateParams({ creator: partnerId || null, partner: null });
  };

  // 並び順変更（?sort=popular / new の一覧から変えた場合は order が優先）
  const handleSortOrderChange = (newSortOrder: SortOrder) => {
    updateParams({ order: newSortOrder, sort: null });
  };

  // もっと見るボタンのハンドラー
  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const pageTitle = searchQuery ? `検索結果: "${searchQuery}"`
    : categoryParam ? `${categoryParam}のレシピ`
    : sortParam === 'popular' ? '人気レシピ'
    : sortParam === 'new' ? '新着レシピ'
    : creator ? `${creator.name}のレシピ`
    : 'すべてのレシピ';

  const handleRecipeClick = (recipe: Recipe) => {
    navigate(`/gallery/detail/${recipe.id}`);
  };

  const handleAuthorClick = (partnerId?: string) => {
    if (partnerId) handleCreatorChange(partnerId);
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
          {pageTitle}
        </h1>
      </div>

      {loading ? (
        <div className="loading">検索中...</div>
      ) : (
        <div className="search-content">
          <CreatorFilter
            value={creator ? creator.id : ''}
            onChange={handleCreatorChange}
            counts={creatorCounts}
            total={baseResults.length}
          />

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
                  onChange={(e) => handleSortOrderChange(e.target.value as SortOrder)}
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
              <p>{creator ? `「すべて」に切り替えるか、別のキーワードで検索してみてください` : '別のキーワードで検索してみてください'}</p>
              <div className="search-suggestions">
                <h4>検索のヒント:</h4>
                <ul>
                  <li>作品名で検索</li>
                  <li>パートナー名（うさんこ、クロバー、Kon）で検索</li>
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