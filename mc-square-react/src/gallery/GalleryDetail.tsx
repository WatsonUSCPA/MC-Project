import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getRecipeSource, RecipeSource } from './partners';
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


interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: RecipeStep[];
  mainImageUrl?: string;
  image?: string;
  pdfUrl?: string;
  cookingTime: string;
  difficulty: string;
  youtubeUrl?: string;
  explanationType: 'video' | 'website' | 'pdf' | 'none';
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

  const [source, setSource] = useState<RecipeSource | null>(null);
  const [randomProducts, setRandomProducts] = useState<Product[]>([]);

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
          // パートナー（提携先）のレシピのみ表示
          const recipeSource = getRecipeSource(recipeData);
          if (!recipeSource) {
            setError('レシピが見つかりません');
            return;
          }
          setSource(recipeSource);
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
            pdfUrl: recipeData.pdfUrl,
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
            author: recipeSource.name,
            authorId: recipeData.authorId || '',
            likes: recipeData.likes || 0,
            views: recipeData.views || 0,
            tags: recipeData.tags || [],
            createdAt: recipeData.createdAt
          };
          setRecipe(mappedRecipe);
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
    if (!url) return null;
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    
    return null;
  };

  const handlePdfDownload = () => {
    if (!recipe?.pdfUrl) return;
    
    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = recipe.pdfUrl;
      link.download = `${recipe.title}_レシピ.pdf`;
      link.target = '_blank';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('PDFのダウンロードに失敗しました。');
    }
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
              if (source) navigate(`/gallery/search?partner=${encodeURIComponent(source.partner.id)}`);
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

            {/* 出典（パートナーの元動画・元ページ） */}
            {source?.url && (
              <div className="recipe-source" style={{ margin: '8px 0 12px' }}>
                <span style={{ marginRight: '8px', color: '#636E72' }}>出典: {source.name}</span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#FF6B6B', fontWeight: 'bold' }}
                >
                  {source.linkLabel} ↗
                </a>
              </div>
            )}

            <div className="recipe-stats">
              <span className="difficulty">難易度: {recipe.difficulty === '初級' ? '初級' : recipe.difficulty === '中級' ? '中級' : recipe.difficulty === '上級' ? '上級' : recipe.difficulty}</span>
              <span className="time">制作時間: {recipe.cookingTime}</span>
            </div>

            {recipe.description && (
              <div className="recipe-description">
                <h3>作品の説明</h3>
                <p>{recipe.description}</p>
              </div>
            )}

            {recipe.pdfUrl && recipe.explanationType === 'pdf' && (
              <div className="recipe-pdf-download">
                <h3>📄 詳細なレシピPDF</h3>
                <div className="pdf-download-container">
                  <div className="pdf-info">
                    <span className="pdf-icon">📄</span>
                    <span className="pdf-text">詳細な作り方が記載されたPDFファイル</span>
                  </div>
                  <button 
                    onClick={handlePdfDownload}
                    className="pdf-download-btn"
                  >
                    📥 PDFをダウンロード
                  </button>
                </div>
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

            {/* 控えめなEC宣伝セクション */}
            <div className="subtle-ec-promotion" style={{
              margin: '20px 0',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #e9ecef',
              textAlign: 'center',
              fontSize: '0.9rem',
              color: '#6c757d'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '15px'
              }}>
                <p style={{ 
                  margin: '0', 
                  fontStyle: 'italic',
                  fontSize: '0.9rem',
                  lineHeight: '1.4'
                }}>
                  材料をお探しの方は、当店のオンラインショップもご利用ください
                </p>
                
                {/* 商品画像の横並び表示 */}
                {randomProducts && randomProducts.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    marginBottom: '15px'
                  }}>
                    {randomProducts.slice(0, 4).map((product, index) => (
                      <div key={index} style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '2px solid #e9ecef',
                        backgroundColor: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallbackElement = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallbackElement) {
                                fallbackElement.style.display = 'flex';
                              }
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f8f9fa',
                            fontSize: '24px'
                          }}>
                            🧵
                          </div>
                        )}
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'none',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f8f9fa',
                          fontSize: '24px'
                        }}>
                          🧵
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <button 
                  onClick={() => navigate('/all-products')}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#007bff',
                    border: '1px solid #007bff',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#007bff';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#007bff';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span>🛒</span>
                  商品一覧を見る →
                </button>
              </div>
            </div>

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
                    src={getYoutubeEmbedUrl(recipe.youtubeUrl) || ''}
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


          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryDetail; 