import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import './GalleryUserProfile.css';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  joinDate: string;
  totalRecipes: number;
  totalLikes: number;
  bio?: string;
  // SNS関連のフィールド
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
  // 自己紹介関連のフィールド
  hometown?: string;
  favoriteFood?: string;
  cookingStyle?: string;
  interests?: string[];
  personalStory?: string;
  achievements?: string[];
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  mainImageUrl?: string;
  likes: number;
  views: number;
  createdAt: any;
  updatedAt: any;
}

const GalleryUserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // Firestoreからユーザープロフィール情報を取得
        const db = getFirestore();
        const userDoc = doc(db, 'users', userId);
        const userSnap = await getDoc(userDoc);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          // ユーザーの投稿レシピ数を取得
          const recipesQuery = query(
            collection(db, 'recipes'),
            where('authorId', '==', userId)
          );
          const recipesSnap = await getDocs(recipesQuery);
          const totalRecipes = recipesSnap.size;
          
          // ユーザーの投稿レシピの総いいね数を計算
          let totalLikes = 0;
          const recipes: Recipe[] = [];
          recipesSnap.forEach((doc: any) => {
            const recipeData = doc.data();
            totalLikes += recipeData.likes || 0;
            recipes.push({
              id: doc.id,
              title: recipeData.title,
              description: recipeData.description,
              mainImageUrl: recipeData.mainImageUrl,
              likes: recipeData.likes || 0,
              views: recipeData.views || 0,
              createdAt: recipeData.createdAt,
              updatedAt: recipeData.updatedAt
            });
          });
          
          setUserRecipes(recipes);
          
          // authorSNSオブジェクトからSNS情報を取得
          const authorSNS = userData.authorSNS || {};
          
          const userProfile: UserProfile = {
            uid: userId,
            displayName: userData.displayName || 'ユーザー',
            email: '', // セキュリティのため表示しない
            photoURL: userData.photoURL || undefined,
            joinDate: userData.joinDate || '2024年1月',
            totalRecipes: totalRecipes,
            totalLikes: totalLikes,
            bio: userData.bio || '',
            instagram: authorSNS.instagram || '',
            twitter: authorSNS.twitter || '',
            youtube: authorSNS.youtube || '',
            tiktok: authorSNS.tiktok || '',
            website: authorSNS.website || '',
            hometown: userData.hometown || '未設定',
            favoriteFood: userData.favoriteFood || '未設定',
            cookingStyle: userData.cookingStyle || '未設定',
            interests: userData.interests || ['料理', '写真'],
            personalStory: userData.personalStory || '',
            achievements: userData.achievements || []
          };
          setUserProfile(userProfile);
        } else {
          // ユーザーが見つからない場合、レシピから情報を取得
          const recipesQuery = query(
            collection(db, 'recipes'),
            where('authorId', '==', userId)
          );
          const recipesSnap = await getDocs(recipesQuery);
          const totalRecipes = recipesSnap.size;
          
          let totalLikes = 0;
          const recipes: Recipe[] = [];
          let authorName = '匿名ユーザー';
          
          recipesSnap.forEach((doc: any) => {
            const recipeData = doc.data();
            totalLikes += recipeData.likes || 0;
            if (recipeData.authorName) {
              authorName = recipeData.authorName;
            }
            recipes.push({
              id: doc.id,
              title: recipeData.title,
              description: recipeData.description,
              mainImageUrl: recipeData.mainImageUrl,
              likes: recipeData.likes || 0,
              views: recipeData.views || 0,
              createdAt: recipeData.createdAt,
              updatedAt: recipeData.updatedAt
            });
          });
          
          setUserRecipes(recipes);
          
          const userProfile: UserProfile = {
            uid: userId,
            displayName: authorName,
            email: '',
            photoURL: undefined,
            joinDate: '2024年1月',
            totalRecipes: totalRecipes,
            totalLikes: totalLikes,
            bio: '',
            instagram: '',
            twitter: '',
            youtube: '',
            tiktok: '',
            website: '',
            hometown: '未設定',
            favoriteFood: '未設定',
            cookingStyle: '未設定',
            interests: ['料理', '写真'],
            personalStory: '',
            achievements: []
          };
          setUserProfile(userProfile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // エラーが発生した場合のフォールバック
        const userProfile: UserProfile = {
          uid: userId,
          displayName: 'ユーザー',
          email: '',
          photoURL: undefined,
          joinDate: '2024年1月',
          totalRecipes: 0,
          totalLikes: 0,
          bio: '',
          instagram: '',
          twitter: '',
          youtube: '',
          tiktok: '',
          website: '',
          hometown: '未設定',
          favoriteFood: '未設定',
          cookingStyle: '未設定',
          interests: ['料理', '写真'],
          personalStory: '',
          achievements: []
        };
        setUserProfile(userProfile);
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [userId]);



  const handleBackToGallery = () => {
    navigate('/gallery');
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

  const handleViewRecipe = (recipeId: string) => {
    navigate(`/gallery/detail/${recipeId}`);
  };

  if (loading) {
    return (
      <div className="user-profile">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>ユーザー情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="user-profile">
        <div className="error-container">
          <h2>エラー</h2>
          <p>ユーザーが見つかりません</p>
          <button onClick={handleBackToGallery} className="back-btn">
            ← ギャラリーに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <div className="user-profile-container">
        {/* ヘッダー */}
        <div className="user-profile-header">
          <button className="back-btn" onClick={handleBackToGallery}>
            ← ギャラリーに戻る
          </button>
          <h1>{userProfile.displayName}の作品</h1>
        </div>

        <div className="user-profile-content">
          {/* ユーザー情報 */}
          <div className="user-info-section">
            <div className="user-avatar">
              {userProfile.photoURL ? (
                <img src={userProfile.photoURL} alt={userProfile.displayName} />
              ) : (
                <span className="avatar-icon">👤</span>
              )}
            </div>
            <div className="user-details">
              <h2 className="user-name">{userProfile.displayName}</h2>
              <p className="user-stats">
                作品数: {userProfile.totalRecipes}件 | 総いいね数: {userProfile.totalLikes}件
              </p>
              {userProfile.bio && (
                <p className="user-bio">{userProfile.bio}</p>
              )}
            </div>
          </div>

          {/* 自己紹介情報 */}
          {(userProfile.hometown !== '未設定' || userProfile.favoriteFood !== '未設定' || userProfile.cookingStyle !== '未設定' || userProfile.personalStory) && (
            <div className="user-profile-details">
              <h3>👤 自己紹介</h3>
              
              {(userProfile.hometown !== '未設定' || userProfile.favoriteFood !== '未設定' || userProfile.cookingStyle !== '未設定') && (
                <div className="profile-info-grid">
                  {userProfile.hometown !== '未設定' && (
                    <div className="profile-info-item">
                      <span className="info-label">🏠 出身地</span>
                      <span className="info-value">{userProfile.hometown}</span>
                    </div>
                  )}
                  {userProfile.favoriteFood !== '未設定' && (
                    <div className="profile-info-item">
                      <span className="info-label">🍽️ 好きな料理</span>
                      <span className="info-value">{userProfile.favoriteFood}</span>
                    </div>
                  )}
                  {userProfile.cookingStyle !== '未設定' && (
                    <div className="profile-info-item">
                      <span className="info-label">👨‍🍳 料理スタイル</span>
                      <span className="info-value">{userProfile.cookingStyle}</span>
                    </div>
                  )}
                </div>
              )}

              {userProfile.personalStory && (
                <div className="personal-story">
                  <h4>📖 私の物語</h4>
                  <p>{userProfile.personalStory}</p>
                </div>
              )}

              {userProfile.interests && userProfile.interests.length > 0 && (
                <div className="interests-section">
                  <h4>🎯 興味・関心</h4>
                  <div className="interests-tags">
                    {userProfile.interests.map((interest, index) => (
                      <span key={index} className="interest-tag">{interest}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SNS情報 */}
          {(userProfile.instagram || userProfile.twitter || userProfile.youtube || userProfile.tiktok || userProfile.website) && (
            <div className="user-sns-section">
              <h3>📱 SNS</h3>
              <div className="sns-links">
                {userProfile.instagram && isValidUrl(userProfile.instagram) && (
                  <a 
                    href={userProfile.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="sns-link instagram"
                  >
                    📸 Instagram
                  </a>
                )}
                {userProfile.twitter && isValidUrl(userProfile.twitter) && (
                  <a 
                    href={userProfile.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="sns-link twitter"
                  >
                    🐦 Twitter
                  </a>
                )}
                {userProfile.youtube && isValidUrl(userProfile.youtube) && (
                  <a 
                    href={userProfile.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="sns-link youtube"
                  >
                    📺 YouTube
                  </a>
                )}
                {userProfile.tiktok && isValidUrl(userProfile.tiktok) && (
                  <a 
                    href={userProfile.tiktok} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="sns-link tiktok"
                  >
                    🎵 TikTok
                  </a>
                )}
                {userProfile.website && isValidUrl(userProfile.website) && (
                  <a 
                    href={userProfile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="sns-link website"
                  >
                    🌐 公式サイト
                  </a>
                )}
              </div>
            </div>
          )}

          {/* 作品一覧 */}
          <div className="user-recipes-section">
            <h3>作品一覧 ({userRecipes.length}件)</h3>
            
            {userRecipes.length === 0 ? (
              <div className="no-recipes">
                <p>まだ作品がありません</p>
              </div>
            ) : (
              <div className="recipes-grid">
                {userRecipes.map((recipe) => (
                  <div 
                    key={recipe.id} 
                    className="recipe-card"
                    onClick={() => handleViewRecipe(recipe.id)}
                  >
                    <div className="recipe-image">
                      {recipe.mainImageUrl ? (
                        <img src={recipe.mainImageUrl} alt={recipe.title} />
                      ) : (
                        <div className="no-image">
                          <span>📷</span>
                        </div>
                      )}
                    </div>
                    <div className="recipe-info">
                      <h4 className="recipe-title">{recipe.title}</h4>
                      <p className="recipe-description">{recipe.description}</p>
                      <div className="recipe-stats">
                        <span className="likes">❤️ {recipe.likes}</span>
                        <span className="views">👁️ {recipe.views}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryUserProfile; 