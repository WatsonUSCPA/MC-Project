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
          
          const userProfile: UserProfile = {
            uid: userId,
            displayName: userData.displayName || 'ユーザー',
            email: '', // セキュリティのため表示しない
            photoURL: userData.photoURL || undefined,
            joinDate: userData.joinDate || '2024年1月',
            totalRecipes: totalRecipes,
            totalLikes: totalLikes,
            bio: userData.bio || ''
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
            bio: ''
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
          bio: ''
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