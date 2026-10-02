import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GalleryHome.css';
import { getRecipeSource } from './partners';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { app } from './firebase';

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




// Mock Dataを定数として定義
const MOCK_RECIPES: Recipe[] = [
  {
    id: 'mock-1',
    title: 'かわいいパッチワーククッション',
    author: '手作り好きさん',
    image: '/Image/Gift to Mom.png',
    likes: 15,
    difficulty: '初級',
    cookingTime: '2時間',
    tags: ['パッチワーク', 'クッション', '初級'],
    authorSNS: {
      twitter: 'https://twitter.com/teshizuki',
      instagram: 'https://instagram.com/teshizuki',
      website: 'https://teshizuki.com'
    }
  },
  {
    id: 'mock-2',
    title: '簡単♪ バッグ型ポーチ',
    author: 'クラフトマスター',
    image: '/Image/Gift to Grandma.png',
    likes: 23,
    difficulty: '中級',
    cookingTime: '3時間',
    tags: ['バッグ', 'ポーチ', '中級'],
    authorSNS: {
      twitter: 'https://twitter.com/craftmaster',
      facebook: 'https://facebook.com/craftmaster'
    }
  },
  {
    id: 'mock-3',
    title: 'おしゃれなテーブルクロス',
    author: 'インテリア好き',
    image: '/Image/Gift to Kids.png',
    likes: 8,
    difficulty: '上級',
    cookingTime: '1日',
    tags: ['テーブルクロス', '上級'],
    authorSNS: {
      instagram: 'https://instagram.com/interior',
      line: 'interior-line-id'
    }
  }
];

// レベルとシチュエーションのデータを定義
const LEVEL_CATEGORIES = [
  { id: 'beginner', name: '初級', image: '/Image/CraftKitchen.png' },
  { id: 'intermediate', name: '中級', image: '/Image/CraftKitchen.png' },
  { id: 'advanced', name: '上級', image: '/Image/CraftKitchen.png' }
];



// データを補完する関数
const getDisplayRecipes = (recipes: Recipe[]) => {
  // 人気レシピ（いいね数でソート、上位2つ）
  const popular = recipes
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 2);

  // 新着レシピ（作成日でソート、上位2つ）
  const newRecipes = recipes
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 2);

  return { popular, new: newRecipes };
};

const GalleryHome: React.FC = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [popularKeywords, setPopularKeywords] = useState<PopularKeyword[]>([]);
  const [situationCategories, setSituationCategories] = useState<SituationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);


  // 人気のキーワードをFirestoreから取得
  useEffect(() => {
    const fetchPopularKeywords = async () => {
      try {
        const db = getFirestore();
        const keywordsRef = collection(db, 'popularKeywords');
        const snapshot = await getDocs(keywordsRef);
        const keywords: PopularKeyword[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          // キーワードに応じたデフォルト画像を設定
          const getDefaultImage = (keywordName: string) => {
            const lowerName = keywordName.toLowerCase();
            if (lowerName.includes('バッグ') || lowerName.includes('bag')) {
              return '/Image/Gift to Grandma.png';
            } else if (lowerName.includes('クッション') || lowerName.includes('cushion')) {
              return '/Image/Gift to Mom.png';
            } else if (lowerName.includes('キッズ') || lowerName.includes('kids')) {
              return '/Image/Gift to Kids.png';
            } else if (lowerName.includes('コットン') || lowerName.includes('cotton')) {
              return '/Image/US Cotton subscription.png';
            } else {
              return '/Image/CraftKitchen.png';
            }
          };

          keywords.push({
            id: doc.id,
            name: data.name || '',
            image: data.image || getDefaultImage(data.name || ''),
            order: data.order || 0
          });
        });
        
        // 順序でソート
        keywords.sort((a, b) => (a.order || 0) - (b.order || 0));
        setPopularKeywords(keywords);
      } catch (error) {
        console.error('Error fetching popular keywords:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        // エラーの場合はデフォルトキーワードを設定
        const defaultKeywords: PopularKeyword[] = [
          { id: 'default-1', name: 'バッグ', image: '/Image/Gift to Grandma.png', order: 1 },
          { id: 'default-2', name: 'クッション', image: '/Image/Gift to Mom.png', order: 2 },
          { id: 'default-3', name: 'キッズ', image: '/Image/Gift to Kids.png', order: 3 },
          { id: 'default-4', name: 'コットン', image: '/Image/US Cotton subscription.png', order: 4 }
        ];
        setPopularKeywords(defaultKeywords);
      }
    };
    
    fetchPopularKeywords();
    
    // シチュエーションカテゴリを取得
    const fetchSituationCategories = async () => {
      try {
        const db = getFirestore();
        const situationsRef = collection(db, 'situationCategories');
        const snapshot = await getDocs(situationsRef);
        const situations: SituationCategory[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          situations.push({
            id: doc.id,
            name: data.name || '',
            image: data.image || '/Image/CraftKitchen.png',
            order: data.order || 0
          });
        });
        
        // 順序でソート
        situations.sort((a, b) => a.order - b.order);
        setSituationCategories(situations);
      } catch (error) {
        console.error('Error fetching situation categories:', error);
        // エラーの場合はデフォルトカテゴリを設定
        const defaultSituations: SituationCategory[] = [
          { id: 'default-1', name: '小学校向け', image: '/Image/Gift to Kids.png', order: 1 },
          { id: 'default-2', name: '幼稚園向け', image: '/Image/Gift to Kids.png', order: 2 },
          { id: 'default-3', name: 'おじいちゃんおばあちゃん向け', image: '/Image/Gift to Grandma.png', order: 3 },
          { id: 'default-4', name: 'プレゼント向け', image: '/Image/Gift to Mom.png', order: 4 }
        ];
        setSituationCategories(defaultSituations);
      }
    };
    
    fetchSituationCategories();
  }, []);

  // Firestoreからデータを取得
  useEffect(() => {
    const fetchRecipes = async (retryCount = 0) => {
      try {
        setLoading(true);
        
        const db = getFirestore();
        const recipesRef = collection(db, 'recipes');
        
        // クエリを最適化：文字情報のみ先に取得
        const q = query(
          recipesRef,
          // orderBy('createdAt', 'desc'), // パフォーマンスのためコメントアウト
          // limit(6)
        );
        
        // 並列でデータ取得を開始
        const queryPromise = getDocs(q);
        
        // タイムアウトを設定（5秒に延長）
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        
        const querySnapshot = await Promise.race([queryPromise, timeoutPromise]) as any;
        
        const fetchedRecipes: Recipe[] = [];
        querySnapshot.forEach((doc: any) => {
          const data = doc.data();
          // パートナー（提携先）のレシピのみ掲載
          const source = getRecipeSource(data);
          if (!source) return;
          fetchedRecipes.push({
            id: doc.id,
            title: data.title || '',
            author: source.name,
            image: '/Image/Goods Picture.png', // デフォルト画像を先に使用
            likes: data.likes || 0,
            difficulty: data.difficulty || '初級',
            cookingTime: data.cookingTime || '',
            tags: data.tags || [],
            authorSNS: data.authorSNS || {},
            // 画像URLは後から取得
            mainImageUrl: data.mainImageUrl,
            description: data.description,
            ingredients: data.ingredients,
            steps: data.steps,
            youtubeUrl: data.youtubeUrl,
            explanationType: data.explanationType,
            websiteExplanation: data.websiteExplanation,
            authorId: data.authorId,
            authorName: source.name,
            partnerId: source.partner.id,
            sourceUrl: source.url,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            views: data.views || 0
          });
        });
        
        // いいね数でソート（多い順）
        fetchedRecipes.sort((a, b) => {
          return b.likes - a.likes;
        });
        
        // 文字情報を先に表示
        setRecipes(fetchedRecipes);
        setLoading(false);
        setRetryCount(0); // 成功時にリトライカウントをリセット
        
        // 画像を後から非同期で読み込み
        setTimeout(() => {
          const updatedRecipes = fetchedRecipes.map(recipe => ({
            ...recipe,
            image: recipe.mainImageUrl || recipe.image
          }));
          setRecipes(updatedRecipes);
          setImagesLoaded(true);
        }, 100);
        
      } catch (error) {
        console.error('Error fetching recipes:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        
        // タイムアウトエラーの場合、最大3回までリトライ
        if (error instanceof Error && error.message === 'Timeout' && retryCount < 3) {
          const nextRetryCount = retryCount + 1;
          console.log(`Retrying fetch... Attempt ${nextRetryCount}/3`);
          setRetryCount(nextRetryCount);
          
          // 指数バックオフで待機時間を設定（1秒、2秒、4秒）
          const waitTime = Math.pow(2, retryCount) * 1000;
          
          setTimeout(() => {
            fetchRecipes(nextRetryCount);
          }, waitTime);
          
          return;
        }
        
        // リトライ回数上限に達した場合、またはその他のエラーの場合
        if (retryCount >= 3) {
          console.error('Max retry attempts reached. Showing empty state.');
        }
        
        // エラー時は空配列で初期化
        setRecipes([]);
        setLoading(false);
      }
    };

    // 即座に実行
    fetchRecipes();
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
              接続に時間がかかっています。再試行中... ({retryCount}/3)
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
                      e.currentTarget.src = '/Image/CraftKitchen.png';
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
                    e.currentTarget.src = '/Image/CraftKitchen.png';
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
                    e.currentTarget.src = '/Image/CraftKitchen.png';
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