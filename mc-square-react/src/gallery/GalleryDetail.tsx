import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRecipeDetail, fetchCatalog, kitsForRecipe, fabricPicksForRecipe, thumbUrl, CatalogKit, CatalogProduct } from '../shared/recipesApi';
import { useCart } from '../ec/context/CartContext';
import RecipeStrip from '../shared/components/RecipeStrip';
import './GalleryDetail.css';

interface DetailSource { partnerId: string; name: string; url: string | null; linkLabel: string; }

interface RecipeStep {
  id: number;
  description: string;
  imageUrl?: string;
}

interface AffiliateProduct {
  id?: number;
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

  const [source, setSource] = useState<DetailSource | null>(null);
  const [matchedKits, setMatchedKits] = useState<CatalogKit[]>([]);
  const [fabricPicks, setFabricPicks] = useState<CatalogProduct[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    let alive = true;
    if (!recipeId) {
      setError('レシピIDが指定されていません');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    window.scrollTo(0, 0);
    // パートナーのレシピのみ返す軽量API（メイン画像は縮小WebP）
    fetchRecipeDetail(recipeId)
      .then((d: any) => {
        if (!alive) return;
        const label = d.sourceLabel || '元のレシピを見る';
        setSource({ partnerId: d.partnerId, name: d.partnerName, url: d.sourceUrl, linkLabel: label });
        setRecipe({
          ...d,
          id: d.id,
          title: d.title || '',
          description: d.description || '',
          ingredients: d.ingredients || [],
          steps: (d.steps || []).map((st: any) => ({ ...st, imageUrl: st.imageUrl || st.image })),
          mainImageUrl: d.mainImageUrl,
          image: d.thumb,
          cookingTime: d.cookingTime === '30min' ? '30分以内' :
                      d.cookingTime === '1hour' ? '1時間以内' :
                      d.cookingTime === '2hours' ? '2時間以内' :
                      d.cookingTime === '3hours' ? '3時間以内' :
                      d.cookingTime === 'half-day' ? '半日' :
                      d.cookingTime === 'full-day' ? '1日' :
                      d.cookingTime === 'multiple-days' ? '数日' :
                      d.cookingTime || '',
          difficulty: d.difficulty === 'easy' ? '初級' :
                    d.difficulty === 'medium' ? '中級' :
                    d.difficulty === 'hard' ? '上級' :
                    d.difficulty || '',
          explanationType: d.explanationType || 'none',
          affiliateProducts: d.affiliateProducts || [],
          authorSNS: d.authorSNS || {},
          author: d.partnerName,
          authorId: '',
          likes: d.likes || 0,
          views: d.views || 0,
          tags: d.tags || [],
          createdAt: d.createdAt,
        });
      })
      .catch(() => alive && setError('レシピが見つかりません'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [recipeId]);

  // このレシピに使えるショップ商品（キット・生地）
  useEffect(() => {
    if (!recipe) return;
    let alive = true;
    fetchCatalog()
      .then((c) => {
        if (!alive) return;
        setMatchedKits(kitsForRecipe(recipe, c.kits));
        setFabricPicks(fabricPicksForRecipe(recipe.id, c.products, 4));
      })
      .catch(() => { /* 商品が取れなくてもレシピは表示 */ });
    return () => { alive = false; };
  }, [recipe]);

  const handleAddFabric = (p: CatalogProduct) => {
    addToCart({
      managementNumber: p.managementNumber,
      name: p.name,
      price: String(p.price),
      imageUrl: p.imageUrl,
      quantity: 1,
      productType: 'fabric',
    });
    setAddedId(p.managementNumber);
    setTimeout(() => setAddedId((cur) => (cur === p.managementNumber ? null : cur)), 2000);
  };

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

  // うさんこのレシピの affiliateProducts は「うさんこクラブ」（当店BASEショップの材料セット）
  const kitLinks = (recipe?.affiliateProducts || []).filter((p) => p.productUrl && /mcsquare\.thebase\.in/.test(p.productUrl));

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
              width={960}
              height={540}
              decoding="async"
              onError={(e) => {
                if (recipe.mainImageUrl) {
                  e.currentTarget.src = recipe.image || '/placeholder-image.jpg';
                }
              }}
            />
          </div>

          <div className="recipe-info">
            <div className="recipe-author" onClick={() => {
              if (source) navigate(`/gallery/search?creator=${encodeURIComponent(source.partnerId)}`);
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

            {/* このレシピに使える商品（キット・うさんこクラブ・生地） */}
            {(matchedKits.length > 0 || fabricPicks.length > 0 || (source?.partnerId !== 'clover' && kitLinks.length > 0)) && (
              <section className="recipe-shop-block" aria-label="このレシピに使える商品">
                <h3>🧵 このレシピに使える商品</h3>
                {matchedKits.length > 0 && (
                  <div className="rsb-kits">
                    {matchedKits.map((kit) => (
                      <button key={kit.id} type="button" className="rsb-kit" onClick={() => navigate('/kits')}>
                        {kit.imageUrl && <img src={thumbUrl(kit.imageUrl, 160)} alt="" loading="lazy" width={64} height={64} />}
                        <span className="rsb-kit-text">
                          <span className="rsb-badge">キット</span>
                          <strong>{kit.name}</strong>
                          <span className="rsb-kit-price">{kit.price}円{kit.level ? `・${kit.level}` : ''}</span>
                        </span>
                        <span className="rsb-arrow">キットを見る →</span>
                      </button>
                    ))}
                  </div>
                )}
                {source?.partnerId !== 'clover' && kitLinks.map((p, i) => (
                  <a key={i} href={p.productUrl} target="_blank" rel="noopener noreferrer" className="rsb-kit rsb-external">
                    {p.imageUrl && <img src={p.imageUrl} alt="" loading="lazy" width={64} height={64} />}
                    <span className="rsb-kit-text">
                      <span className="rsb-badge">材料セット</span>
                      <strong>{p.name || 'うさんこクラブ'}</strong>
                      {p.description && <span className="rsb-kit-price">{p.description}</span>}
                    </span>
                    <span className="rsb-arrow">BASEショップで見る ↗</span>
                  </a>
                ))}
                {fabricPicks.length > 0 && (
                  <>
                    <p className="rsb-lead">このレシピにおすすめの生地（50cm）</p>
                    <div className="rsb-fabrics">
                      {fabricPicks.map((p) => (
                        <div key={p.managementNumber} className="rsb-fabric">
                          <img src={thumbUrl(p.imageUrl, 320)} alt={p.name} loading="lazy" decoding="async" width={160} height={160} />
                          <span className="rsb-fabric-name">{p.name}</span>
                          <span className="rsb-fabric-price">¥{Number(p.price).toLocaleString()}</span>
                          <button type="button" className="rsb-add" onClick={() => handleAddFabric(p)}>
                            {addedId === p.managementNumber ? '✓ 追加しました' : 'カートに入れる'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <button type="button" className="rsb-more" onClick={() => navigate('/all-products')}>
                  🛒 生地をもっと見る →
                </button>
              </section>
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

            {source?.partnerId === 'clover' && recipe.affiliateProducts && recipe.affiliateProducts.filter(product => 
              product.name.trim() !== '' || 
              product.description.trim() !== '' || 
              product.productUrl.trim() !== '' ||
              product.imageUrl
            ).length > 0 && (
              <div className="recipe-affiliate-products">
                <h3>{source?.partnerId === 'clover' ? '✂️ このレシピで使うクロバーの道具' : `${recipe.author}のおすすめ商品`}</h3>
                <div className="affiliate-products-grid">
                  {recipe.affiliateProducts
                    .filter(product => 
                      product.name.trim() !== '' || 
                      product.description.trim() !== '' || 
                      product.productUrl.trim() !== '' ||
                      product.imageUrl
                    )
                    .map((product, i) => (
                      <div key={i} className="affiliate-product-card">
                        {product.imageUrl && (
                          <div className="product-image">
                            <img src={product.imageUrl} alt={product.name} loading="lazy" decoding="async" />
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
                          {product.productUrl && (
                            <a 
                              href={product.productUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="product-link"
                            >
                              クロバーの商品ページを見る ↗
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <RecipeStrip
              title="関連レシピ"
              mode="related"
              relatedText={`${recipe.title} ${recipe.tags.join(' ')}`}
              excludeId={recipe.id}
            />

          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryDetail; 