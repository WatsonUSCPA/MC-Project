import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, query as firestoreQuery, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { app } from './firebase';
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
  authorEmail?: string;
  createdAt?: any;
  updatedAt?: any;
  views?: number;
}

const GallerySearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [categoryTitle, setCategoryTitle] = useState('');
  
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
    }
  }, [searchParams]);

  // 検索結果が変更されたときにページネーションを更新
  useEffect(() => {
    const startIndex = 0;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    const newDisplayedResults = searchResults.slice(startIndex, endIndex);
    setDisplayedResults(newDisplayedResults);
    setHasMore(endIndex < searchResults.length);
  }, [searchResults, currentPage]);

  // ユーザー認証状態の監視
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  // もっと見るボタンのハンドラー
  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  // カテゴリ検索実行関数
  const performCategorySearch = async (level: string, situation: string) => {
    try {
      setLoading(true);
      setHasSearched(true);

      const db = getFirestore();
      const recipesRef = collection(db, 'recipes');

      let q = firestoreQuery(recipesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const allRecipes: Recipe[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        const recipe = {
          id: doc.id,
          title: data.title || '',
          author: data.authorName || '匿名ユーザー',
          image: '/Image/Goods Picture.png',
          likes: data.likes || 0,
          difficulty: data.difficulty || '初級',
          cookingTime: data.cookingTime || '1時間',
          tags: data.tags || [],
          authorSNS: data.authorSNS || {},
          mainImageUrl: data.mainImageUrl,
          description: data.description,
          ingredients: data.ingredients,
          steps: data.steps,
          youtubeUrl: data.youtubeUrl,
          explanationType: data.explanationType,
          websiteExplanation: data.websiteExplanation,
          authorId: data.authorId,
          authorName: data.authorName,
          authorEmail: data.authorEmail,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          views: data.views
        };

        // レベルフィルタリング
        if (level) {
          const levelMapping = {
            'beginner': '初級',
            'intermediate': '中級',
            'advanced': '上級'
          };
          
          const targetDifficulty = levelMapping[level as keyof typeof levelMapping];
          
          // 難易度フィールドから直接検索
          if (recipe.difficulty !== targetDifficulty) {
            return;
          }
        }

        // シチュエーションフィルタリング
        if (situation) {
          // カテゴリ名で直接検索（例：「ハロウィン」）
          const categoryName = searchParams.get('category') || '';
          
          if (categoryName) {
            // タイトル、説明、タグからカテゴリ名を検索
            const searchableTexts = [
              recipe.title,
              recipe.description,
              ...recipe.tags
            ].filter(text => text && typeof text === 'string');
            
            const hasMatch = searchableTexts.some(text => {
              const textLower = text.toLowerCase();
              const categoryLower = categoryName.toLowerCase();
              
              // カテゴリ名が含まれているかチェック
              return textLower.includes(categoryLower);
            });
            
            if (!hasMatch) {
              return;
            }
          }
        }

        allRecipes.push(recipe);
      });

      // デバッグ情報を出力
      const categoryName = searchParams.get('category') || '';
      console.log('カテゴリ検索結果:', {
        level,
        situation,
        categoryName,
        totalRecipes: allRecipes.length,
        levelFilter: level ? `適用 (${level})` : 'なし',
        situationFilter: situation ? `適用 (${situation}) - カテゴリ名: ${categoryName}` : 'なし',
        searchMethod: {
          level: level ? 'difficultyフィールドから直接検索' : 'なし',
          situation: situation ? 'カテゴリ名で直接検索' : 'なし'
        }
      });
      
      setSearchResults(allRecipes);
    } catch (error) {
      console.error('カテゴリ検索エラー:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // ソート検索実行関数
  const performSortSearch = async (sortType: string) => {
    try {
      setLoading(true);
      setHasSearched(true);

      // タイトルを設定
      if (sortType === 'popular') {
        setCategoryTitle('人気レシピ');
      } else if (sortType === 'new') {
        setCategoryTitle('新着レシピ');
      }

      const db = getFirestore();
      const recipesRef = collection(db, 'recipes');

      let q;
      if (sortType === 'popular') {
        q = firestoreQuery(recipesRef, orderBy('likes', 'desc'));
      } else if (sortType === 'new') {
        q = firestoreQuery(recipesRef, orderBy('createdAt', 'desc'));
      } else {
        q = firestoreQuery(recipesRef, orderBy('createdAt', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      const allRecipes: Recipe[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        allRecipes.push({
          id: doc.id,
          title: data.title || '',
          author: data.authorName || '匿名ユーザー',
          image: '/Image/Goods Picture.png',
          likes: data.likes || 0,
          difficulty: data.difficulty || '初級',
          cookingTime: data.cookingTime || '1時間',
          tags: data.tags || [],
          authorSNS: data.authorSNS || {},
          mainImageUrl: data.mainImageUrl,
          description: data.description,
          ingredients: data.ingredients,
          steps: data.steps,
          youtubeUrl: data.youtubeUrl,
          explanationType: data.explanationType,
          websiteExplanation: data.websiteExplanation,
          authorId: data.authorId,
          authorName: data.authorName,
          authorEmail: data.authorEmail,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          views: data.views
        });
      });

      setSearchResults(allRecipes);
    } catch (error) {
      console.error('ソート検索エラー:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // 検索実行関数
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);

      const db = getFirestore();
      const recipesRef = collection(db, 'recipes');

      // 検索クエリを作成（タイトル、説明、タグで検索）
      const q = firestoreQuery(
        recipesRef,
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const allRecipes: Recipe[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        allRecipes.push({
          id: doc.id,
          title: data.title || '',
          author: data.authorName || '匿名ユーザー',
          image: '/Image/Goods Picture.png',
          likes: data.likes || 0,
          difficulty: data.difficulty || '初級',
          cookingTime: data.cookingTime || '1時間',
          tags: data.tags || [],
          authorSNS: data.authorSNS || {},
          mainImageUrl: data.mainImageUrl,
          description: data.description,
          ingredients: data.ingredients,
          steps: data.steps,
          youtubeUrl: data.youtubeUrl,
          explanationType: data.explanationType,
          websiteExplanation: data.websiteExplanation,
          authorId: data.authorId,
          authorName: data.authorName,
          authorEmail: data.authorEmail,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          views: data.views
        });
      });

      // クライアントサイドで検索フィルタリング
      const filteredRecipes = allRecipes.filter(recipe => {
        const searchLower = query.toLowerCase();
        return (
          recipe.title.toLowerCase().includes(searchLower) ||
          recipe.description?.toLowerCase().includes(searchLower) ||
          recipe.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          recipe.author.toLowerCase().includes(searchLower)
        );
      });

      setSearchResults(filteredRecipes);
    } catch (error) {
      console.error('検索エラー:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeClick = (recipe: Recipe) => {
    navigate(`/gallery/detail/${recipe.id}`);
  };

  const handleAuthorClick = (author: string, authorId: string) => {
    navigate(`/gallery/user/${authorId}`);
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
            <div className="search-stats">
              {searchResults.length}件の結果が見つかりました
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
                  <li>作者名で検索</li>
                  <li>タグ（パッチワーク、クッションなど）で検索</li>
                  <li>材料名（綿、リネン、ボタンなど）で検索</li>
                  <li>難易度（初級、中級、上級）で検索</li>
                </ul>
              </div>
              <div className="be-first-poster">
                <div className="be-first-poster-icon">🎨</div>
                <h4>あなたが最初の投稿者になりませんか？</h4>
                <p>このキーワードやカテゴリで作品を投稿して、他の方の参考にしてみてください！</p>
                <button 
                  className="upload-encouragement-btn"
                  onClick={() => navigate('/gallery/upload')}
                >
                  <span role="img" aria-label="投稿">📝</span>
                  作品を投稿する
                </button>
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
                        handleAuthorClick(recipe.author, recipe.authorId || '');
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