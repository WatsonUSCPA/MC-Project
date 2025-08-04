import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GalleryHome.css';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
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
  authorEmail?: string;
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

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  myRecipes: Recipe[];
  bookmarks: Recipe[];
  joinDate: string;
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
  },
  {
    id: 'mock-4',
    title: '春らしい花柄コースター',
    author: '春の風',
    image: '/Image/JP Cotton subscription.png',
    likes: 12,
    difficulty: '初級',
    cookingTime: '1時間',
    tags: ['コースター', '春', '初級'],
    authorSNS: {
      instagram: 'https://instagram.com/spring_craft',
      website: 'https://spring-craft.com'
    }
  },
  {
    id: 'mock-5',
    title: '夏用の涼しげなクッション',
    author: '夏の手作り',
    image: '/Image/US Cotton subscription.png',
    likes: 18,
    difficulty: '中級',
    cookingTime: '2時間',
    tags: ['クッション', '夏', '中級'],
    authorSNS: {
      twitter: 'https://twitter.com/summer_craft',
      facebook: 'https://facebook.com/summer_craft'
    }
  },
  {
    id: 'mock-6',
    title: '秋色のキルト作品',
    author: '秋のクラフト',
    image: '/Image/Yorisoi_Craft.png',
    likes: 25,
    difficulty: '上級',
    cookingTime: '数日',
    tags: ['キルト', '秋', '上級'],
    authorSNS: {
      instagram: 'https://instagram.com/autumn_craft',
      line: 'autumn-craft-line'
    }
  }
];

// データを補完する関数
const getDisplayRecipes = (recipes: Recipe[]) => {
  const realRecipes = recipes.filter(recipe => !recipe.id.startsWith('mock-'));
  const mockRecipes = MOCK_RECIPES.filter(recipe => 
    !realRecipes.some(real => real.id === recipe.id)
  );

  // 人気レシピセクション用（いいね数順の最初の3件）
  const popularRecipes = realRecipes.slice(0, 3);
  const popularMockNeeded = Math.max(0, 3 - popularRecipes.length);
  const popularDisplay = [
    ...popularRecipes,
    ...mockRecipes.slice(0, popularMockNeeded)
  ];

  // 新着レシピセクション用（createdAtでソートされた最初の10件）
  // 元のデータをcreatedAtでソートして新着を取得
  const sortedByDate = [...realRecipes].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
    return dateB.getTime() - dateA.getTime(); // 新しい順
  });
  
  const newRecipes = sortedByDate.slice(0, 10);
  const newMockNeeded = Math.max(0, 10 - newRecipes.length);
  const newDisplay = [
    ...newRecipes,
    ...mockRecipes.slice(popularMockNeeded, popularMockNeeded + newMockNeeded)
  ];

  return {
    popular: popularDisplay,
    new: newDisplay,
    all: [...popularDisplay, ...newDisplay]
  };
};

const GalleryHome: React.FC = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [popularKeywords, setPopularKeywords] = useState<PopularKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showMyPage, setShowMyPage] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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
          fetchedRecipes.push({
            id: doc.id,
            title: data.title || '',
            author: data.authorName || '匿名ユーザー',
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
            authorName: data.authorName,
            authorEmail: data.authorEmail,
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

  // ユーザー認証状態の監視
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // ユーザープロフィール情報を取得（軽量化）
        const mockUserProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || 'ユーザー',
          email: user.email || '',
          photoURL: user.photoURL || undefined,
          myRecipes: [], // 空配列で初期化
          bookmarks: [], // 空配列で初期化
          joinDate: '2024年1月'
        };
        setUserProfile(mockUserProfile);
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []); // recipesの依存関係を削除

  const handleAuthorClick = (author: string, authorId: string) => {
    // ユーザープロフィールページに直接遷移
    navigate(`/gallery/user/${authorId}`);
  };


  const handleRecipeClick = (recipe: Recipe) => {
    // 新しいページに遷移
    navigate(`/gallery/detail/${recipe.id}`);
  };



  const handleKeywordClick = (keyword: PopularKeyword) => {
    // キーワードで検索ページに遷移
    navigate(`/gallery/search?q=${encodeURIComponent(keyword.name)}`);
  };

  const handleMyPageToggle = () => {
    // マイページにリダイレクト
    window.location.href = '/gallery/mypage';
  };

  const handleLogout = () => {
    const auth = getAuth();
    auth.signOut();
    setShowMyPage(false);
  };

  const handleUploadRecipe = () => {
    // Recipe Uploadページに遷移
    navigate('/gallery/upload');
    setShowMyPage(false);
  };

  const handleAdminPage = () => {
    // 管理者ページに遷移
    navigate('/gallery/admin');
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

        {/* 人気レシピ */}
        <section className="popular-recipes">
          <h2 className="section-title">クラフトキッチン 人気レシピ</h2>
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
                    handleAuthorClick(recipe.author, recipe.authorId || '');
                  }}>
                    <span className="author-avatar">👤</span>
                    <span className="author-name">{recipe.author}</span>
                    {recipe.authorSNS && (
                      <span className="sns-icons">
                        {recipe.authorSNS.twitter && <span className="sns-icon twitter">🐦</span>}
                        {recipe.authorSNS.instagram && <span className="sns-icon instagram">📸</span>}
                        {recipe.authorSNS.facebook && <span className="sns-icon facebook">📘</span>}
                        {recipe.authorSNS.line && <span className="sns-icon line">💬</span>}
                        {recipe.authorSNS.website && <span className="sns-icon website">🔗</span>}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 新着レシピ */}
        <section className="new-recipes">
          <h2 className="section-title">クラフトキッチン 新着レシピ</h2>
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
                    handleAuthorClick(recipe.author, recipe.authorId || '');
                  }}>
                    <span className="author-avatar">👤</span>
                    <span className="author-name">{recipe.author}</span>
                    {recipe.authorSNS && (
                      <span className="sns-icons">
                        {recipe.authorSNS.twitter && <span className="sns-icon twitter">🐦</span>}
                        {recipe.authorSNS.instagram && <span className="sns-icon instagram">📸</span>}
                        {recipe.authorSNS.facebook && <span className="sns-icon facebook">📘</span>}
                        {recipe.authorSNS.line && <span className="sns-icon line">💬</span>}
                        {recipe.authorSNS.website && <span className="sns-icon website">🔗</span>}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 投稿ボタン */}
        <div className="upload-section">
          <button 
            className="upload-btn"
            onClick={handleUploadRecipe}
          >
            <span role="img" aria-label="投稿">📝</span>
            クラフトキッチンに作品を投稿する
          </button>
        </div>
      </div>
    </div>
  );
};

export default GalleryHome; 