import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut, User, updateEmail, deleteUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import './GalleryMyPage.css';

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

interface FavoriteRecipe {
  recipeId: string;
  title: string;
  author: string;
  mainImageUrl?: string;
  createdAt: any;
}

const GalleryMyPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<FavoriteRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'recipes' | 'favorites' | 'settings'>('profile');

  // ユーザー認証状態の監視
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Firestoreからユーザープロフィール情報を取得
          const db = getFirestore();
          const userDoc = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDoc);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            
            // ユーザーの投稿レシピ数を取得
            const recipesQuery = query(
              collection(db, 'recipes'),
              where('authorId', '==', user.uid)
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
            
            // お気に入りレシピを取得
            const favoritesQuery = query(
              collection(db, 'users', user.uid, 'favorites')
            );
            const favoritesSnap = await getDocs(favoritesQuery);
            const favorites: FavoriteRecipe[] = [];
            favoritesSnap.forEach((doc: any) => {
              const favoriteData = doc.data();
              favorites.push({
                recipeId: favoriteData.recipeId,
                title: favoriteData.title,
                author: favoriteData.author,
                mainImageUrl: favoriteData.mainImageUrl,
                createdAt: favoriteData.createdAt
              });
            });
            setFavoriteRecipes(favorites);
            
            const userProfile: UserProfile = {
              uid: user.uid,
              displayName: userData.displayName || user.displayName || 'ユーザー',
              email: user.email || '',
              photoURL: user.photoURL || undefined,
              joinDate: userData.joinDate || '2024年1月',
              totalRecipes: totalRecipes,
              totalLikes: totalLikes,
              bio: userData.bio || ''
            };
            setUserProfile(userProfile);
          } else {
            // 新規ユーザーの場合、デフォルトプロフィールを作成
            const userProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || 'ユーザー',
              email: user.email || '',
              photoURL: user.photoURL || undefined,
              joinDate: '2024年1月',
              totalRecipes: 0,
              totalLikes: 0,
              bio: ''
            };
            setUserProfile(userProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // エラーが発生した場合のフォールバック
          const userProfile: UserProfile = {
            uid: user.uid,
            displayName: user.displayName || 'ユーザー',
            email: user.email || '',
            photoURL: user.photoURL || undefined,
            joinDate: '2024年1月',
            totalRecipes: 0,
            totalLikes: 0,
            bio: ''
          };
          setUserProfile(userProfile);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      window.location.href = '/gallery';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNewRecipe = () => {
    window.location.href = '/gallery/upload';
  };

  const handleEditProfile = () => {
    window.location.href = '/gallery/profile-edit';
  };

  const handleEditRecipe = (recipeId: string) => {
    // レシピ編集ページに遷移
    window.location.href = `/gallery/recipe-edit/${recipeId}`;
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!window.confirm('このレシピを削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      const db = getFirestore();
      const recipeDoc = doc(db, 'recipes', recipeId);
      await deleteDoc(recipeDoc);
      
      // ローカル状態を更新
      setUserRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
      
      // プロフィール統計を更新
      if (userProfile) {
        const updatedProfile = {
          ...userProfile,
          totalRecipes: userProfile.totalRecipes - 1
        };
        setUserProfile(updatedProfile);
      }
      
      alert('レシピを削除しました');
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('レシピの削除に失敗しました');
    }
  };

  const handleViewRecipe = (recipeId: string) => {
    window.location.href = `/gallery/detail/${recipeId}`;
  };

  const handleViewFavoriteRecipe = (recipeId: string) => {
    window.location.href = `/gallery/detail/${recipeId}`;
  };

  const handleRemoveFavorite = async (recipeId: string) => {
    if (!currentUser) return;
    
    const isConfirmed = window.confirm('お気に入りから削除しますか？');
    if (!isConfirmed) return;

    try {
      const db = getFirestore();
      const favoriteRef = doc(db, 'users', currentUser.uid, 'favorites', recipeId);
      await deleteDoc(favoriteRef);
      
      // お気に入りリストから削除
      setFavoriteRecipes(prev => prev.filter(fav => fav.recipeId !== recipeId));
      alert('お気に入りから削除しました');
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('お気に入りの削除に失敗しました');
    }
  };

  const handleChangeEmail = () => {
    const newEmail = window.prompt('新しいメールアドレスを入力してください:');
    if (newEmail && newEmail.trim()) {
      if (window.confirm(`メールアドレスを「${newEmail}」に変更しますか？\n\n※変更後、新しいメールアドレスでログインする必要があります。`)) {
        handleEmailChange(newEmail.trim());
      }
    }
  };

  const handleEmailChange = async (newEmail: string) => {
    if (!currentUser) return;
    
    try {
      const auth = getAuth();
      await updateEmail(currentUser, newEmail);
      
      // Firestoreのユーザーデータも更新
      const db = getFirestore();
      const userDoc = doc(db, 'users', currentUser.uid);
      await updateDoc(userDoc, {
        email: newEmail,
        updatedAt: new Date()
      });
      
      alert('メールアドレスを変更しました。新しいメールアドレスでログインしてください。');
      await signOut(auth);
      window.location.href = '/gallery/login';
    } catch (error: any) {
      console.error('Error updating email:', error);
      if (error.code === 'auth/requires-recent-login') {
        alert('セキュリティのため、再度ログインしてからメールアドレスを変更してください。');
      } else {
        alert('メールアドレスの変更に失敗しました: ' + error.message);
      }
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('本当にアカウントを削除しますか？\n\n⚠️ この操作は取り消せません\n• すべての投稿レシピが削除されます\n• プロフィール情報が削除されます\n• アカウントデータが完全に削除されます')) {
      if (window.confirm('最後の確認です。\n\n本当にアカウントを削除しますか？\nこの操作は取り消せません。')) {
        handleAccountDeletion();
      }
    }
  };

  const handleAccountDeletion = async () => {
    if (!currentUser) return;
    
    try {
      const auth = getAuth();
      const db = getFirestore();
      
      // ユーザーの投稿レシピを削除
      const recipesQuery = query(
        collection(db, 'recipes'),
        where('authorId', '==', currentUser.uid)
      );
      const recipesSnap = await getDocs(recipesQuery);
      
      const deletePromises = recipesSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // ユーザーのプロフィールデータを削除
      const userDoc = doc(db, 'users', currentUser.uid);
      await deleteDoc(userDoc);
      
      // Firebase Authのアカウントを削除
      await deleteUser(currentUser);
      
      alert('アカウントを削除しました。ご利用ありがとうございました。');
      window.location.href = '/gallery';
    } catch (error: any) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/requires-recent-login') {
        alert('セキュリティのため、再度ログインしてからアカウントを削除してください。');
      } else {
        alert('アカウントの削除に失敗しました: ' + error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="my-page-new">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="my-page-new">
        <div className="login-required">
          <h2>ログインが必要です</h2>
          <p>マイページを利用するにはログインしてください。</p>
          
          <div className="login-options">
            <button className="login-btn primary" onClick={() => window.location.href = '/gallery/login'}>
              <span role="img" aria-label="メール">📧</span>
              メールアドレスでログイン
            </button>
            
            <div className="divider">
              <span>または</span>
            </div>
            
            <button className="login-btn google" onClick={() => window.location.href = '/gallery/login'}>
              <svg className="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Googleでログイン
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-page-new">
      <div className="my-page-container">
        {/* ヘッダー */}
        <div className="my-page-header">
          <h1>マイページ</h1>
          <button className="back-btn" onClick={() => window.history.back()}>
            ← 戻る
          </button>
        </div>

        {/* プロフィールセクション */}
        <div className="profile-section">
          <div className="profile-info">
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="プロフィール" className="profile-avatar" />
            ) : (
              <div className="profile-avatar-placeholder">
                {userProfile?.displayName?.substring(0, 2).toUpperCase() || '👤'}
              </div>
            )}
            <div className="profile-details">
              <h2>{userProfile?.displayName}</h2>
              <p className="profile-email">{userProfile?.email}</p>
              <p className="profile-bio">{userProfile?.bio}</p>
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-number">{userProfile?.totalRecipes}</span>
                  <span className="stat-label">投稿レシピ</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{userProfile?.totalLikes}</span>
                  <span className="stat-label">獲得いいね</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">登録日</span>
                  <span className="stat-date">{userProfile?.joinDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            プロフィール
          </button>
          <button 
            className={`tab-btn ${activeTab === 'recipes' ? 'active' : ''}`}
            onClick={() => setActiveTab('recipes')}
          >
            投稿レシピ ({userRecipes.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            お気に入り ({favoriteRecipes.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            設定
          </button>
        </div>

        {/* タブコンテンツ */}
        <div className="tab-content">
          {activeTab === 'profile' && (
            <>
              {/* アクションボタン */}
              <div className="action-buttons">
                <button className="action-btn primary" onClick={handleNewRecipe}>
                  <span role="img" aria-label="投稿">📝</span>
                  新しいレシピを投稿
                </button>
                <button className="action-btn secondary" onClick={handleEditProfile}>
                  <span role="img" aria-label="編集">✏️</span>
                  プロフィール編集
                </button>
                <button className="action-btn danger" onClick={handleLogout}>
                  <span role="img" aria-label="ログアウト">🚪</span>
                  ログアウト
                </button>
              </div>


            </>
          )}

          {activeTab === 'settings' && (
            <div className="settings-tab">
              <div className="settings-header">
                <h3>アカウント設定</h3>
                <p className="settings-description">アカウントの管理とセキュリティ設定</p>
              </div>

              <div className="settings-section">
                <h4>プロフィール設定</h4>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>プロフィール編集</label>
                    <p className="setting-description">名前、自己紹介、SNSリンクの変更</p>
                  </div>
                  <button className="edit-btn" onClick={handleEditProfile}>
                    編集する
                  </button>
                </div>
              </div>

              <div className="settings-section">
                <h4>アカウント設定</h4>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>メールアドレス変更</label>
                    <p className="setting-description">アカウントのメールアドレスを変更</p>
                  </div>
                  <button className="edit-btn" onClick={handleChangeEmail}>
                    変更する
                  </button>
                </div>
              </div>

              <div className="settings-section">
                <h4>セッション管理</h4>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>ログアウト</label>
                    <p className="setting-description">現在のセッションを終了</p>
                  </div>
                  <button className="logout-btn" onClick={handleLogout}>
                    ログアウト
                  </button>
                </div>
              </div>

              <div className="settings-section">
                <h4>データ管理</h4>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>投稿データ</label>
                    <p className="setting-description">投稿したレシピの管理</p>
                  </div>
                  <button className="edit-btn" onClick={() => setActiveTab('recipes')}>
                    管理する
                  </button>
                </div>
              </div>

              <div className="settings-section danger-zone">
                <h4>退会</h4>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>アカウント削除</label>
                    <p className="setting-description">アカウントの削除とデータの完全削除</p>
                  </div>
                  <button className="delete-btn" onClick={handleDeleteAccount}>
                    退会する
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recipes' && (
            <div className="recipes-tab">
              <div className="recipes-header">
                <h3>投稿レシピ一覧</h3>
                <button className="new-recipe-btn" onClick={handleNewRecipe}>
                  <span role="img" aria-label="投稿">📝</span>
                  新しいレシピを投稿
                </button>
              </div>
              
              {userRecipes.length === 0 ? (
                <div className="no-recipes">
                  <p>まだ投稿したレシピがありません</p>
                  <button className="action-btn primary" onClick={handleNewRecipe}>
                    最初のレシピを投稿する
                  </button>
                </div>
              ) : (
                <div className="recipes-grid">
                  {userRecipes.map(recipe => (
                    <div key={recipe.id} className="recipe-card">
                      <div className="recipe-image">
                        {recipe.mainImageUrl ? (
                          <img src={recipe.mainImageUrl} alt={recipe.title} />
                        ) : (
                          <div className="recipe-image-placeholder">
                            <span>📷</span>
                          </div>
                        )}
                        <div className="recipe-actions">
                          <button 
                            className="action-btn small view"
                            onClick={() => handleViewRecipe(recipe.id)}
                          >
                            👁️
                          </button>
                          <button 
                            className="action-btn small edit"
                            onClick={() => handleEditRecipe(recipe.id)}
                          >
                            ✏️
                          </button>
                          <button 
                            className="action-btn small delete"
                            onClick={() => handleDeleteRecipe(recipe.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="recipe-info">
                        <h4 className="recipe-title">{recipe.title}</h4>
                        <p className="recipe-description">
                          {recipe.description.length > 50 
                            ? `${recipe.description.substring(0, 50)}...` 
                            : recipe.description}
                        </p>
                        <div className="recipe-stats">
                          <span className="likes">❤️ {recipe.likes}</span>
                          <span className="views">👁️ {recipe.views}</span>
                        </div>
                        <div className="recipe-date">
                          投稿日: {recipe.createdAt?.toDate?.()?.toLocaleDateString('ja-JP') || '不明'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="favorites-tab">
              <div className="favorites-header">
                <h3>お気に入りレシピ一覧</h3>
                <p className="favorites-description">お気に入りに追加したレシピを管理できます</p>
              </div>
              
              {favoriteRecipes.length === 0 ? (
                <div className="no-favorites">
                  <p>まだお気に入りに追加したレシピがありません</p>
                  <button className="action-btn primary" onClick={() => window.location.href = '/gallery'}>
                    ギャラリーを見る
                  </button>
                </div>
              ) : (
                <div className="favorites-grid">
                  {favoriteRecipes.map(favorite => (
                    <div key={favorite.recipeId} className="favorite-card">
                      <div className="favorite-image">
                        {favorite.mainImageUrl ? (
                          <img src={favorite.mainImageUrl} alt={favorite.title} />
                        ) : (
                          <div className="favorite-image-placeholder">
                            <span>📷</span>
                          </div>
                        )}
                        <div className="favorite-actions">
                          <button 
                            className="action-btn small view"
                            onClick={() => handleViewFavoriteRecipe(favorite.recipeId)}
                          >
                            👁️
                          </button>
                          <button 
                            className="action-btn small remove"
                            onClick={() => handleRemoveFavorite(favorite.recipeId)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="favorite-info">
                        <h4 className="favorite-title">{favorite.title}</h4>
                        <p className="favorite-author">作者: {favorite.author}</p>
                        <div className="favorite-date">
                          お気に入り追加日: {favorite.createdAt?.toDate?.()?.toLocaleDateString('ja-JP') || '不明'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryMyPage; 