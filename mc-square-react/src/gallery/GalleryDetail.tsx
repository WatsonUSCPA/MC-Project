import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc, addDoc, collection, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from './firebase';
import './GalleryDetail.css';

// 商品型定義
interface Product {
  managementNumber: string;
  name: string;
  price: string;
  imageUrl?: string;
  status?: string;
  description?: string;
}

interface RecipeStep {
  id: number;
  description: string;
  imageUrl?: string;
}

interface AffiliateProduct {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  productUrl: string;
  price?: string;
}

interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: any;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: RecipeStep[];
  mainImageUrl?: string;
  image?: string;
  cookingTime: string;
  difficulty: string;
  youtubeUrl?: string;
  explanationType: 'video' | 'website' | 'none';
  websiteExplanation?: string;
  affiliateProducts: AffiliateProduct[];
  authorSNS: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    line?: string;
    website?: string;
  };
  author: string;
  authorId: string;
  likes: number;
  views: number;
  tags: string[];
  createdAt: any;
}

const GalleryDetail: React.FC = () => {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [randomProducts, setRandomProducts] = useState<Product[]>([]);

  // 現在のユーザーがいいねを押しているかチェック
  useEffect(() => {
    if (!currentUser || !recipeId) return;

    const checkUserLike = async () => {
      try {
        const db = getFirestore(app);
        const userLikeDoc = doc(db, 'recipes', recipeId, 'likes', currentUser.uid);
        const likeSnap = await getDoc(userLikeDoc);
        setLiked(likeSnap.exists());
      } catch (error) {
        console.error('Error checking user like:', error);
      }
    };

    checkUserLike();
  }, [currentUser, recipeId]);

  // 現在のユーザーがお気に入りに追加しているかチェック
  useEffect(() => {
    if (!currentUser || !recipeId) return;

    const checkUserFavorite = async () => {
      try {
        const db = getFirestore(app);
        const userFavoriteDoc = doc(db, 'users', currentUser.uid, 'favorites', recipeId);
        const favoriteSnap = await getDoc(userFavoriteDoc);
        setFavorited(favoriteSnap.exists());
      } catch (error) {
        console.error('Error checking user favorite:', error);
      }
    };

    checkUserFavorite();
  }, [currentUser, recipeId]);

  // ユーザー認証状態の監視
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!recipeId) {
        setError('レシピIDが指定されていません');
        setLoading(false);
        return;
      }

      try {
        const db = getFirestore(app);
        const recipeDoc = await getDoc(doc(db, 'recipes', recipeId));
        
        if (recipeDoc.exists()) {
          const recipeData = recipeDoc.data();
          // データベースのフィールド名をインターフェースに合わせてマッピング
          const mappedRecipe: Recipe = {
            ...recipeData,
            id: recipeDoc.id,
            title: recipeData.title || '',
            description: recipeData.description || '',
            ingredients: recipeData.ingredients || [],
            steps: recipeData.steps || [],
            mainImageUrl: recipeData.mainImageUrl,
            image: recipeData.image,
            cookingTime: recipeData.cookingTime === '30min' ? '30分以内' :
                        recipeData.cookingTime === '1hour' ? '1時間以内' :
                        recipeData.cookingTime === '2hours' ? '2時間以内' :
                        recipeData.cookingTime === '3hours' ? '3時間以内' :
                        recipeData.cookingTime === 'half-day' ? '半日' :
                        recipeData.cookingTime === 'full-day' ? '1日' :
                        recipeData.cookingTime === 'multiple-days' ? '数日' :
                        recipeData.cookingTime || '',
            difficulty: recipeData.difficulty === 'easy' ? '初級' : 
                      recipeData.difficulty === 'medium' ? '中級' : 
                      recipeData.difficulty === 'hard' ? '上級' : 
                      recipeData.difficulty || '',
            youtubeUrl: recipeData.youtubeUrl,
            explanationType: recipeData.explanationType || 'none',
            websiteExplanation: recipeData.websiteExplanation,
            affiliateProducts: recipeData.affiliateProducts || [],
            authorSNS: recipeData.authorSNS || {
              twitter: '',
              instagram: '',
              facebook: '',
              line: '',
              website: ''
            },
            author: recipeData.authorName || '匿名ユーザー', // authorNameをauthorにマッピング
            authorId: recipeData.authorId || '',
            likes: recipeData.likes || 0,
            views: recipeData.views || 0,
            tags: recipeData.tags || [],
            createdAt: recipeData.createdAt
          };
          setRecipe(mappedRecipe);
          setLikesCount(recipeData.likes || 0);
          console.log('Recipe authorId:', mappedRecipe.authorId);
          console.log('Recipe data:', recipeData);
        } else {
          setError('レシピが見つかりません');
        }
      } catch (err) {
        console.error('Error fetching recipe:', err);
        setError('レシピの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId]);

  // コメントの取得
  useEffect(() => {
    if (!recipeId) return;

    const db = getFirestore(app);
    const commentsQuery = query(
      collection(db, 'recipes', recipeId, 'comments'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData: Comment[] = [];
      snapshot.forEach((doc) => {
        commentsData.push({
          id: doc.id,
          ...doc.data()
        } as Comment);
      });
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [recipeId]);

  // All Productsの商品データを取得してランダムに2つ選択
  useEffect(() => {
    const fetchRandomProducts = async () => {
      try {
        const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbygEEOmylE1fzaMtpxAReEQfY02zIcUVKwVPaV4R5H5AKWnQtgnUbYOKfq3y4mYJPdzYg/exec';
        const response = await fetch(GAS_WEB_APP_URL, { 
          method: 'GET', 
          mode: 'cors', 
          headers: { 'Accept': 'application/json' } 
        });
        
        if (!response.ok) throw new Error(`データの取得に失敗しました (${response.status})`);
        const data = await response.json();
        
        if (!Array.isArray(data)) throw new Error('データの形式が不正です');
        
        // 公開中の商品のみをフィルタリング
        const availableProducts = data.filter((item: any) => item.status === '公開中');
        
        // ランダムに2つ選択
        const shuffled = availableProducts.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 2);
        
        setRandomProducts(selected);
      } catch (error) {
        console.error('Error fetching random products:', error);
      }
    };

    fetchRandomProducts();
  }, []);


  const handleBackToGallery = () => {
    navigate('/gallery');
  };

  // コメント投稿
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !recipeId || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const db = getFirestore(app);
      await addDoc(collection(db, 'recipes', recipeId, 'comments'), {
        text: newComment.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || '匿名ユーザー',
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('コメントの投稿に失敗しました');
    } finally {
      setSubmittingComment(false);
    }
  };

  // いいね機能
  const handleLike = async () => {
    if (!currentUser || !recipeId) {
      alert('いいねするにはログインが必要です');
      return;
    }

    try {
      const db = getFirestore(app);
      const recipeRef = doc(db, 'recipes', recipeId);
      const userLikeRef = doc(db, 'recipes', recipeId, 'likes', currentUser.uid);
      
      if (liked) {
        // いいねを削除
        await updateDoc(recipeRef, {
          likes: likesCount - 1
        });
        await deleteDoc(userLikeRef);
        setLikesCount(likesCount - 1);
        setLiked(false);
      } else {
        // いいねを追加
        await updateDoc(recipeRef, {
          likes: likesCount + 1
        });
        await setDoc(userLikeRef, {
          userId: currentUser.uid,
          createdAt: serverTimestamp()
        });
        setLikesCount(likesCount + 1);
        setLiked(true);
      }
    } catch (error) {
      console.error('Error updating likes:', error);
      alert('いいねの更新に失敗しました');
    }
  };

  // お気に入り機能
  const handleFavorite = async () => {
    if (!currentUser || !recipeId || !recipe) {
      alert('お気に入りに追加するにはログインが必要です');
      return;
    }

    try {
      const db = getFirestore(app);
      const userFavoriteRef = doc(db, 'users', currentUser.uid, 'favorites', recipeId);
      
      if (favorited) {
        // お気に入りから削除
        await deleteDoc(userFavoriteRef);
        setFavorited(false);
        alert('お気に入りから削除しました');
      } else {
        // お気に入りに追加
        await setDoc(userFavoriteRef, {
          recipeId: recipeId,
          title: recipe.title,
          author: recipe.author,
          mainImageUrl: recipe.mainImageUrl || recipe.image,
          createdAt: serverTimestamp()
        });
        setFavorited(true);
        alert('お気に入りに追加しました');
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
      alert('お気に入りの更新に失敗しました');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser || !recipeId) {
      alert('コメントを削除するにはログインが必要です');
      return;
    }

    // 削除確認ダイアログ
    const isConfirmed = window.confirm('このコメントを削除しますか？\n削除すると元に戻すことはできません。');
    if (!isConfirmed) {
      return;
    }

    try {
      const db = getFirestore(app);
      const commentRef = doc(db, 'recipes', recipeId, 'comments', commentId);
      await deleteDoc(commentRef);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('コメントの削除に失敗しました');
    }
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

  const getYoutubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
  };

  if (loading) {
    return (
      <div className="recipe-detail">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>レシピを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="recipe-detail">
        <div className="error-container">
          <h2>エラー</h2>
          <p>{error || 'レシピが見つかりません'}</p>
          <button onClick={handleBackToGallery} className="back-btn">
            ← ギャラリーに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recipe-detail">
      <div className="recipe-detail-container">
        <div className="recipe-detail-header">
          <button onClick={handleBackToGallery} className="back-btn">
            ← ギャラリーに戻る
          </button>
          <h1 className="recipe-title">{recipe.title}</h1>
        </div>

        <div className="recipe-detail-content">
          <div className="recipe-main-image">
            <img
              src={recipe.mainImageUrl || recipe.image}
              alt={recipe.title}
              onError={(e) => {
                if (recipe.mainImageUrl) {
                  e.currentTarget.src = recipe.image || '/placeholder-image.jpg';
                }
              }}
            />
          </div>

          <div className="recipe-info">
            <div className="recipe-author" onClick={() => {
              console.log('Author clicked - authorId:', recipe.authorId);
              navigate(`/gallery/user/${recipe.authorId}`);
            }}>
              <span className="author-avatar">👤</span>
              <span className="author-name">{recipe.author || '匿名ユーザー'}</span>
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
              <span className="likes">❤️ {likesCount}いいね</span>
              <span className="difficulty">難易度: {recipe.difficulty === '初級' ? '初級' : recipe.difficulty === '中級' ? '中級' : recipe.difficulty === '上級' ? '上級' : recipe.difficulty}</span>
              <span className="time">制作時間: {recipe.cookingTime}</span>
            </div>

            {recipe.description && (
              <div className="recipe-description">
                <h3>作品の説明</h3>
                <p>{recipe.description}</p>
              </div>
            )}

            {recipe.ingredients && recipe.ingredients.filter(ingredient => ingredient.trim() !== '').length > 0 && (
              <div className="recipe-ingredients">
                <h3>必要な材料</h3>
                <ul>
                  {recipe.ingredients
                    .filter(ingredient => ingredient.trim() !== '')
                    .map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                </ul>
              </div>
            )}

            {recipe.steps && recipe.steps.length > 0 && (
              <div className="recipe-steps">
                <h3>制作手順</h3>
                {recipe.steps
                  .filter(step => {
                    const hasDescription = step.description && step.description.trim() !== '';
                    const hasImage = step.imageUrl && step.imageUrl.trim() !== '';
                    return hasDescription || hasImage;
                  })
                  .map((step, index) => (
                    <div key={step.id || index} className="recipe-step">
                      <h4>手順 {index + 1}</h4>
                      {step.imageUrl && (
                        <img src={step.imageUrl} alt={`ステップ${index + 1}`} className="step-image" />
                      )}
                      <p>{step.description}</p>
                    </div>
                  ))}
              </div>
            )}

            {recipe.youtubeUrl && (
              <div className="recipe-video">
                <h3>制作動画</h3>
                <div className="youtube-embed">
                  <iframe
                    src={getYoutubeEmbedUrl(recipe.youtubeUrl)}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}

            {recipe.websiteExplanation && (
              <div className="recipe-explanation">
                <h3>詳細な説明</h3>
                <p>{recipe.websiteExplanation}</p>
              </div>
            )}

            {recipe.tags && recipe.tags.length > 0 && (
              <div className="recipe-tags">
                <h3>関連タグ</h3>
                <div className="tags">
                  {recipe.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {recipe.affiliateProducts && recipe.affiliateProducts.filter(product => 
              product.name.trim() !== '' || 
              product.description.trim() !== '' || 
              product.productUrl.trim() !== '' ||
              product.imageUrl
            ).length > 0 && (
              <div className="recipe-affiliate-products">
                <h3>この人のおすすめの商品はこちら。</h3>
                <div className="affiliate-products-grid">
                  {recipe.affiliateProducts
                    .filter(product => 
                      product.name.trim() !== '' || 
                      product.description.trim() !== '' || 
                      product.productUrl.trim() !== '' ||
                      product.imageUrl
                    )
                    .map((product) => (
                      <div key={product.id} className="affiliate-product-card">
                        {product.imageUrl && (
                          <div className="product-image">
                            <img src={product.imageUrl} alt={product.name} />
                          </div>
                        )}
                        <div className="product-info">
                          <h4 className="product-name">{product.name}</h4>
                          {product.price && (
                            <p className="product-price">{product.price}</p>
                          )}
                          {product.description && (
                            <p className="product-description">{product.description}</p>
                          )}
                          <a 
                            href={product.productUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="product-link"
                          >
                            商品詳細を見る →
                          </a>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {randomProducts && randomProducts.length > 0 && (
              <div className="recipe-random-products">
                <h3>生地をお探しの方はこちら。</h3>
                <div className="random-products-grid">
                  {randomProducts.map((product, index) => (
                    <div key={index} className="random-product-card">
                      {product.imageUrl && (
                        <div className="product-image">
                          <img src={product.imageUrl} alt={product.name} />
                        </div>
                      )}
                      <div className="product-info">
                        <h4 className="product-name">{product.name}</h4>
                        {product.description && (
                          <p className="product-description">{product.description}</p>
                        )}
                        <a 
                          href={`/all-products`} 
                          className="product-link"
                        >
                          商品詳細を見る →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* 生地を探しに行くボタン */}
                <div className="fabric-search-section">
                  <h4>もっと生地を探しに行く</h4>
                  <button 
                    onClick={() => navigate('/all-products')}
                    className="fabric-search-btn"
                    style={{
                      backgroundColor: '#FF9F7C',
                      color: 'white',
                      border: 'none',
                      borderRadius: '25px',
                      padding: '12px 24px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      marginTop: '10px',
                      boxShadow: '0 2px 8px rgba(255, 159, 124, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 159, 124, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 159, 124, 0.3)';
                    }}
                  >
                    🧵 生地を探しに行く →
                  </button>
                </div>
              </div>
            )}


            {/* いいね・お気に入りボタン - コメントセクションの直上に配置 */}
            <div style={{ 
              margin: '20px 0',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              flexWrap: 'wrap'
            }}>
              <button 
                className={`like-btn ${liked ? 'liked' : ''}`}
                onClick={handleLike}
                disabled={!currentUser}
                title={!currentUser ? 'ログインが必要です' : ''}
                style={{ 
                  border: `3px solid ${liked ? '#6c757d' : '#dc3545'}`,
                  backgroundColor: liked ? '#6c757d' : '#dc3545',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <span className="like-icon">{liked ? '❤️' : '🤍'}</span>
                <span className="like-text">
                  {!currentUser ? 'ログインしていいね' : (liked ? 'いいね済み' : 'いいね')}
                </span>
              </button>

              <button 
                onClick={handleFavorite}
                disabled={!currentUser}
                title={!currentUser ? 'ログインが必要です' : ''}
                style={{ 
                  border: `3px solid ${favorited ? '#6c757d' : '#ffc107'}`,
                  backgroundColor: favorited ? '#6c757d' : '#ffc107',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <span style={{ marginRight: '8px' }}>{favorited ? '⭐' : '☆'}</span>
                <span>
                  {!currentUser ? 'ログインしてお気に入り' : (favorited ? 'お気に入り済み' : 'お気に入り')}
                </span>
              </button>

              {!currentUser && (
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: '#666', 
                  marginTop: '8px',
                  fontStyle: 'italic',
                  width: '100%'
                }}>
                  ※ いいね・お気に入りするにはログインが必要です
                </div>
              )}
            </div>

            {/* コメントセクション */}
            <div className="recipe-comments">
              <h3>作品へのコメント ({comments.length})</h3>
              
              {/* コメント投稿フォーム */}
              {currentUser ? (
                <form onSubmit={handleSubmitComment} className="comment-form">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="作品についてコメントを書いてください..."
                    className="comment-input"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="comment-form-actions">
                    <span className="comment-length">{newComment.length}/500</span>
                    <button 
                      type="submit" 
                      className="comment-submit-btn"
                      disabled={submittingComment || !newComment.trim()}
                    >
                      {submittingComment ? '投稿中...' : 'コメントを投稿する'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="login-prompt">
                  <p>コメントを投稿するにはログインが必要です</p>
                  <button onClick={() => navigate('/gallery/login')} className="login-btn">
                    ログイン
                  </button>
                </div>
              )}

              {/* コメント一覧 */}
              <div className="comments-list">
                {comments.length === 0 ? (
                  <p className="no-comments">まだコメントがありません。最初のコメントを投稿してみませんか？</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-header">
                        <span className="comment-author">{comment.authorName}</span>
                        <span className="comment-date">
                          {comment.createdAt?.toDate?.() 
                            ? comment.createdAt.toDate().toLocaleDateString('ja-JP')
                            : '投稿日時不明'
                          }
                        </span>
                        {currentUser && currentUser.uid === comment.authorId && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="comment-delete-btn"
                            title="コメントを削除"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                      <p className="comment-text">{comment.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryDetail; 