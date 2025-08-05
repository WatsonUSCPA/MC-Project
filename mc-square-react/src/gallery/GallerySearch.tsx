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

  // URLパラメータから検索クエリを取得
  useEffect(() => {
    const searchQueryParam = searchParams.get('q') || '';
    setSearchQuery(searchQueryParam);
    if (searchQueryParam) {
      performSearch(searchQueryParam);
    }
  }, [searchParams]);

  // ユーザー認証状態の監視
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

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
          cookingTime: data.cookingTime || '',
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
          views: data.views || 0
        });
      });

      // クライアントサイドで検索フィルタリング
      const filteredRecipes = allRecipes.filter(recipe => {
        const searchLower = query.toLowerCase();
        const titleMatch = recipe.title.toLowerCase().includes(searchLower);
        const descriptionMatch = recipe.description?.toLowerCase().includes(searchLower);
        const tagsMatch = recipe.tags.some(tag => tag.toLowerCase().includes(searchLower));
        const authorMatch = recipe.author.toLowerCase().includes(searchLower);
        const ingredientsMatch = recipe.ingredients?.some(ingredient => 
          ingredient.toLowerCase().includes(searchLower)
        ) || false;

        return titleMatch || descriptionMatch || tagsMatch || authorMatch || ingredientsMatch;
      });

      setSearchResults(filteredRecipes);
      setLoading(false);
    } catch (error) {
      console.error('Error searching recipes:', error);
      setSearchResults([]);
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
          検索結果: "{searchQuery}"
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
            </div>
          ) : (
            <div className="search-results">
              <div className="recipes-grid">
                {searchResults.map(recipe => (
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
                      <div className="recipe-stats">
                        <span className="likes">{recipe.likes}つくれぽ</span>
                        <span className="difficulty">{recipe.difficulty}</span>
                        <span className="time">{recipe.cookingTime}</span>
                      </div>
                      {recipe.tags.length > 0 && (
                        <div className="recipe-tags">
                          {recipe.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GallerySearch; 