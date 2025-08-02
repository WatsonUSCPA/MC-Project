import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './GalleryUpload.css';

interface RecipeStep {
  id: number;
  description: string;
  image?: File;
}

interface AffiliateProduct {
  id: number;
  name: string;
  description: string;
  image?: File;
  productUrl: string;
  price?: string;
}

interface Recipe {
  title: string;
  description: string;
  ingredients: string[];
  steps: RecipeStep[];
  mainImage?: File;
  cookingTime: string;
  difficulty: string;
  youtubeUrl?: string;
  explanationType: 'video' | 'website' | 'none';
  websiteExplanation?: string;
  affiliateProducts: AffiliateProduct[];
  authorSNS?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    line?: string;
    website?: string;
  };
}

const GalleryUpload: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<Recipe>({
    title: '',
    description: '',
    ingredients: [''],
    steps: [{ id: 1, description: '' }],
    cookingTime: '',
            difficulty: '初級',
    youtubeUrl: '',
    explanationType: 'none',
    websiteExplanation: '',
    affiliateProducts: [],
    authorSNS: {
      twitter: '',
      instagram: '',
      facebook: '',
      line: '',
      website: ''
    }
  });

  const [previewImages, setPreviewImages] = useState<{ [key: string]: string }>({});

  // ユーザー認証状態の監視
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipe({ ...recipe, title: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRecipe({ ...recipe, description: e.target.value });
  };

  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipe({ ...recipe, youtubeUrl: e.target.value });
  };

  const handleExplanationTypeChange = (type: 'video' | 'website' | 'none') => {
    setRecipe({ 
      ...recipe, 
      explanationType: type,
      youtubeUrl: type !== 'video' ? '' : recipe.youtubeUrl,
      websiteExplanation: type !== 'website' ? '' : recipe.websiteExplanation,
      affiliateProducts: recipe.affiliateProducts
    });
  };

  const handleWebsiteExplanationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRecipe({ ...recipe, websiteExplanation: e.target.value });
  };

  const getYoutubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    
    // YouTube URLのパターンをチェック
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

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...recipe.ingredients];
    newIngredients[index] = value;
    setRecipe({ ...recipe, ingredients: newIngredients });
  };

  const addIngredient = () => {
    setRecipe({ ...recipe, ingredients: [...recipe.ingredients, ''] });
  };

  const removeIngredient = (index: number) => {
    const newIngredients = recipe.ingredients.filter((_, i) => i !== index);
    setRecipe({ ...recipe, ingredients: newIngredients });
  };

  const handleStepChange = (stepId: number, description: string) => {
    const newSteps = recipe.steps.map(step => 
      step.id === stepId ? { ...step, description } : step
    );
    setRecipe({ ...recipe, steps: newSteps });
  };

  const addStep = () => {
    const newStepId = recipe.steps.length + 1;
    setRecipe({ 
      ...recipe, 
      steps: [...recipe.steps, { id: newStepId, description: '' }] 
    });
  };

  const removeStep = (stepId: number) => {
    const newSteps = recipe.steps.filter(step => step.id !== stepId);
    setRecipe({ ...recipe, steps: newSteps });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'step' | 'affiliate', stepId?: number, productId?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'main') {
        setRecipe({ ...recipe, mainImage: file });
        setPreviewImages({ ...previewImages, main: result });
      } else if (type === 'step' && stepId) {
        const newSteps = recipe.steps.map(step => 
          step.id === stepId ? { ...step, image: file } : step
        );
        setRecipe({ ...recipe, steps: newSteps });
        setPreviewImages({ ...previewImages, [`step-${stepId}`]: result });
      } else if (type === 'affiliate' && productId) {
        const newProducts = recipe.affiliateProducts.map(product =>
          product.id === productId ? { ...product, image: file } : product
        );
        setRecipe({ ...recipe, affiliateProducts: newProducts });
        setPreviewImages({ ...previewImages, [`affiliate-${productId}`]: result });
      }
    };
    reader.readAsDataURL(file);
  };

  // アフィリエイト商品の管理機能
  const handleAffiliateProductChange = (productId: number, field: keyof AffiliateProduct, value: string) => {
    const newProducts = recipe.affiliateProducts.map(product =>
      product.id === productId ? { ...product, [field]: value } : product
    );
    setRecipe({ ...recipe, affiliateProducts: newProducts });
  };

  const addAffiliateProduct = () => {
    const newProductId = Math.max(...recipe.affiliateProducts.map(p => p.id), 0) + 1;
    const newProduct: AffiliateProduct = {
      id: newProductId,
      name: '',
      description: '',
      productUrl: '',
      price: ''
    };
    setRecipe({ 
      ...recipe, 
      affiliateProducts: [...recipe.affiliateProducts, newProduct] 
    });
  };

  const removeAffiliateProduct = (productId: number) => {
    const newProducts = recipe.affiliateProducts.filter(product => product.id !== productId);
    setRecipe({ ...recipe, affiliateProducts: newProducts });
  };

  const handleSNSChange = (platform: keyof NonNullable<Recipe['authorSNS']>, value: string) => {
    setRecipe({
      ...recipe,
      authorSNS: {
        ...recipe.authorSNS,
        [platform]: value
      }
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState({ url: '', text: '', title: '' });

  const showShareDialog = (url: string, text: string, title: string) => {
    setShareData({ url, text, title });
    setShowShareModal(true);
  };

  const shareToSNS = (platform: string) => {
    const { url, text } = shareData;
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'line':
        shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;
        break;
      case 'instagram':
        // Instagramは直接リンクできないので、テキストをコピー
        navigator.clipboard.writeText(`${text}\n\n${url}`);
        alert('Instagram用のテキストをコピーしました！');
        return;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    window.location.href = '/gallery';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      const db = getFirestore();
      const recipesRef = collection(db, 'recipes');

      // 画像をBase64エンコード
      let mainImageUrl = '';
      if (recipe.mainImage) {
        const reader = new FileReader();
        mainImageUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(recipe.mainImage!);
        });
      }

      // ステップ画像もBase64エンコード
      const stepsWithImages = await Promise.all(
        recipe.steps.map(async (step) => {
          if (step.image) {
            const reader = new FileReader();
            const imageUrl = await new Promise<string>((resolve) => {
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(step.image!);
            });
            return { ...step, imageUrl };
          }
          return step;
        })
      );

      // アフィリエイト商品の画像もBase64エンコード
      const affiliateProductsWithImages = await Promise.all(
        recipe.affiliateProducts.map(async (product) => {
          if (product.image) {
            const reader = new FileReader();
            const imageUrl = await new Promise<string>((resolve) => {
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(product.image!);
            });
            return { ...product, imageUrl };
          }
          return product;
        })
      );

      // Firestoreに保存するデータ
      const recipeData = {
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients.filter(ingredient => ingredient.trim() !== ''),
        steps: stepsWithImages,
        affiliateProducts: affiliateProductsWithImages,
        mainImageUrl,
        cookingTime: recipe.cookingTime,
        difficulty: recipe.difficulty,
        youtubeUrl: recipe.youtubeUrl || '',
        explanationType: recipe.explanationType,
        websiteExplanation: recipe.websiteExplanation || '',
        authorSNS: recipe.authorSNS,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || '匿名ユーザー',
        authorEmail: currentUser.email || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        views: 0
      };

      // Firestoreに保存
      const docRef = await addDoc(recipesRef, recipeData);
      
      console.log('Recipe saved with ID:', docRef.id);
      
      // 成功メッセージとSNSシェアオプションを表示
      const shareUrl = `${window.location.origin}/gallery`;
      const shareText = `新しいレシピ「${recipe.title}」を投稿しました！🎨 #手作り #レシピ`;
      
      if (window.confirm('レシピが正常にアップロードされました！\n\nSNSでシェアしますか？')) {
        // SNSシェアダイアログを表示
        showShareDialog(shareUrl, shareText, recipe.title);
      } else {
        // ギャラリーページに遷移
        window.location.href = '/gallery';
      }
      
      // フォームをリセット
      setRecipe({
        title: '',
        description: '',
        ingredients: [''],
        steps: [{ id: 1, description: '' }],
        cookingTime: '',
        difficulty: '初級',
        youtubeUrl: '',
        explanationType: 'none',
        websiteExplanation: '',
        affiliateProducts: [],
        authorSNS: {
          twitter: '',
          instagram: '',
          facebook: '',
          line: '',
          website: ''
        }
      });
      setPreviewImages({});
      
    } catch (error) {
      console.error('Error uploading recipe:', error);
      alert('レシピのアップロードに失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ローディング中
  if (loading) {
    return (
      <div className="recipe-upload">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  // ログインしていない場合
  if (!currentUser) {
    return (
      <div className="recipe-upload">
        <div className="login-required">
          <div className="login-required-content">
            <h2>ログインが必要です</h2>
            <p>レシピを投稿するにはログインしてください。</p>
            <div className="login-actions">
              <button 
                className="login-btn primary" 
                onClick={() => window.location.href = '/login'}
              >
                ログインする
              </button>
              <button 
                className="login-btn secondary" 
                onClick={() => window.history.back()}
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recipe-upload">
      {/* SNSシェアモーダル */}
      {showShareModal && (
        <div className="share-modal-overlay">
          <div className="share-modal">
            <div className="share-modal-header">
              <h3>🎉 レシピをシェアしましょう！</h3>
              <button className="close-btn" onClick={closeShareModal}>✕</button>
            </div>
            <div className="share-modal-content">
              <p className="share-message">
                「{shareData.title}」の投稿が完了しました！
                <br />
                お友達にも教えてあげてください。
              </p>
              <div className="share-buttons">
                <button 
                  className="share-btn twitter"
                  onClick={() => shareToSNS('twitter')}
                >
                  <span className="share-icon">🐦</span>
                  Twitter
                </button>
                <button 
                  className="share-btn facebook"
                  onClick={() => shareToSNS('facebook')}
                >
                  <span className="share-icon">📘</span>
                  Facebook
                </button>
                <button 
                  className="share-btn line"
                  onClick={() => shareToSNS('line')}
                >
                  <span className="share-icon">💬</span>
                  LINE
                </button>
                <button 
                  className="share-btn instagram"
                  onClick={() => shareToSNS('instagram')}
                >
                  <span className="share-icon">📷</span>
                  Instagram
                </button>
              </div>
              <div className="share-actions">
                <button className="skip-btn" onClick={closeShareModal}>
                  スキップしてギャラリーへ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="recipe-upload-container">
        <div className="upload-header">
          <button 
            className="back-btn"
            onClick={() => window.location.href = '/gallery'}
          >
            <span role="img" aria-label="戻る">←</span>
            ギャラリーに戻る
          </button>
        </div>
        <h1 className="recipe-upload-title">作り方をアップロード</h1>
        <p className="recipe-upload-subtitle">
          あなたの手作り作品の作り方を共有しましょう
        </p>

        <form onSubmit={handleSubmit} className="recipe-form">
          {/* メイン画像 */}
          <div className="form-section">
            <h3>メイン画像</h3>
            <div className="image-upload-area">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'main')}
                id="main-image"
                className="image-input"
              />
              <label htmlFor="main-image" className="image-upload-label">
                {previewImages.main ? (
                  <img src={previewImages.main} alt="プレビュー" className="image-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span>📷</span>
                    <p>画像をアップロード</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* タイトル */}
          <div className="form-section">
            <h3>タイトル</h3>
            <input
              type="text"
              value={recipe.title}
              onChange={handleTitleChange}
              placeholder="例：かわいいパッチワーククッション"
              className="form-input"
              required
            />
          </div>

          {/* 説明 */}
          <div className="form-section">
            <h3>説明</h3>
            <textarea
              value={recipe.description}
              onChange={handleDescriptionChange}
              placeholder="作品の特徴や作り方のポイントを書いてください"
              className="form-textarea"
              rows={4}
            />
          </div>

          {/* 説明方法の選択 */}
          <div className="form-section">
            <h3>詳しい説明の方法</h3>
            <div className="explanation-type-selector">
              <div className="explanation-options">
                <label className={`explanation-option ${recipe.explanationType === 'video' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="explanationType"
                    value="video"
                    checked={recipe.explanationType === 'video'}
                    onChange={() => handleExplanationTypeChange('video')}
                  />
                  <div className="option-content">
                    <span className="option-icon">🎥</span>
                    <div className="option-text">
                      <h4>YouTube動画で説明</h4>
                      <p>動画で詳しく作り方を説明する</p>
                    </div>
                  </div>
                </label>
                
                <label className={`explanation-option ${recipe.explanationType === 'website' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="explanationType"
                    value="website"
                    checked={recipe.explanationType === 'website'}
                    onChange={() => handleExplanationTypeChange('website')}
                  />
                  <div className="option-content">
                    <span className="option-icon">📝</span>
                    <div className="option-text">
                      <h4>このサイトで説明</h4>
                      <p>ステップごとに詳しく説明を書く</p>
                    </div>
                  </div>
                </label>
                
                <label className={`explanation-option ${recipe.explanationType === 'none' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="explanationType"
                    value="none"
                    checked={recipe.explanationType === 'none'}
                    onChange={() => handleExplanationTypeChange('none')}
                  />
                  <div className="option-content">
                    <span className="option-icon">📋</span>
                    <div className="option-text">
                      <h4>説明なし</h4>
                      <p>基本的な情報のみで投稿する</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* YouTube動画（動画選択時のみ表示） */}
          {recipe.explanationType === 'video' && (
            <div className="form-section">
              <h3>YouTube動画</h3>
              <div className="youtube-input-container">
                <input
                  type="url"
                  value={recipe.youtubeUrl}
                  onChange={handleYoutubeUrlChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="form-input youtube-input"
                />
                <div className="youtube-help">
                  <span className="help-icon">ℹ️</span>
                  <span className="help-text">
                    作り方の動画がある場合は、YouTubeのURLを入力してください
                  </span>
                </div>
              </div>
              {recipe.youtubeUrl && getYoutubeEmbedUrl(recipe.youtubeUrl) && (
                <div className="youtube-preview">
                  <h4>動画プレビュー</h4>
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
              {recipe.youtubeUrl && !getYoutubeEmbedUrl(recipe.youtubeUrl) && (
                <div className="youtube-error">
                  <span className="error-icon">⚠️</span>
                  <span className="error-text">
                    有効なYouTube URLを入力してください
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ウェブサイトでの説明（サイト選択時のみ表示） */}
          {recipe.explanationType === 'website' && (
            <div className="form-section">
              <h3>詳しい説明</h3>
              <textarea
                value={recipe.websiteExplanation}
                onChange={handleWebsiteExplanationChange}
                placeholder="作り方の詳細を書いてください。材料の準備から完成まで、分かりやすく説明してください。"
                className="form-textarea"
                rows={8}
              />
              <div className="explanation-help">
                <span className="help-icon">💡</span>
                <span className="help-text">
                  初心者でも分かりやすいように、手順を詳しく書いてください
                </span>
              </div>
            </div>
          )}

          {/* 基本情報 */}
          <div className="form-section">
            <h3>基本情報</h3>
            <div className="form-row">
              <div className="form-group">
                <label>制作時間</label>
                <select
                  value={recipe.cookingTime}
                  onChange={(e) => setRecipe({ ...recipe, cookingTime: e.target.value, affiliateProducts: recipe.affiliateProducts })}
                  className="form-select"
                >
                  <option value="">選択してください</option>
                  <option value="30min">30分以内</option>
                  <option value="1hour">1時間以内</option>
                  <option value="2hours">2時間以内</option>
                  <option value="3hours">3時間以内</option>
                  <option value="half-day">半日</option>
                  <option value="full-day">1日</option>
                  <option value="multiple-days">数日</option>
                </select>
              </div>
              <div className="form-group">
                <label>難易度</label>
                <select
                  value={recipe.difficulty}
                  onChange={(e) => setRecipe({ ...recipe, difficulty: e.target.value, affiliateProducts: recipe.affiliateProducts })}
                  className="form-select"
                >
                                  <option value="初級">初級</option>
                <option value="中級">中級</option>
                <option value="上級">上級</option>
                </select>
              </div>
            </div>
          </div>

          {/* 材料 */}
          <div className="form-section">
            <h3>材料</h3>
            {recipe.ingredients.map((ingredient, index) => (
              <div key={index} className="ingredient-row">
                <input
                  type="text"
                  value={ingredient}
                  onChange={(e) => handleIngredientChange(index, e.target.value)}
                  placeholder="例：綿生地 30cm × 30cm"
                  className="form-input ingredient-input"
                />
                {recipe.ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="remove-btn"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addIngredient}
              className="add-btn"
            >
              + 材料を追加
            </button>
          </div>

          {/* 作り方 */}
          <div className="form-section">
            <h3>作り方</h3>
            {recipe.steps.map((step) => (
              <div key={step.id} className="step-container">
                <div className="step-header">
                  <h4>ステップ {step.id}</h4>
                  {recipe.steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(step.id)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                <div className="step-content">
                  <div className="step-image-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'step', step.id)}
                      id={`step-image-${step.id}`}
                      className="image-input"
                    />
                    <label htmlFor={`step-image-${step.id}`} className="image-upload-label small">
                      {previewImages[`step-${step.id}`] ? (
                        <img src={previewImages[`step-${step.id}`]} alt="ステップ画像" className="image-preview small" />
                      ) : (
                        <div className="upload-placeholder small">
                          <span>📷</span>
                        </div>
                      )}
                    </label>
                  </div>
                  
                  <textarea
                    value={step.description}
                    onChange={(e) => handleStepChange(step.id, e.target.value)}
                    placeholder="このステップの詳細な説明を書いてください"
                    className="form-textarea step-description"
                    rows={3}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addStep}
              className="add-btn"
            >
              + ステップを追加
            </button>
          </div>

          {/* おすすめ商品 */}
          <div className="form-section">
            <h3>おすすめ商品</h3>
            <div className="affiliate-help">
              <span className="help-icon">💡</span>
              <span className="help-text">
                この作品を作る際におすすめの商品があれば、写真とリンクを追加できます
              </span>
            </div>
            {recipe.affiliateProducts.map((product) => (
              <div key={product.id} className="affiliate-product-container">
                <div className="affiliate-product-header">
                  <h4>商品 {product.id}</h4>
                  <button
                    type="button"
                    onClick={() => removeAffiliateProduct(product.id)}
                    className="remove-btn"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="affiliate-product-content">
                  <div className="form-row">
                    <div className="form-group">
                      <label>商品名</label>
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => handleAffiliateProductChange(product.id, 'name', e.target.value)}
                        placeholder="例：高品質な綿生地"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>価格（オプション）</label>
                      <input
                        type="text"
                        value={product.price || ''}
                        onChange={(e) => handleAffiliateProductChange(product.id, 'price', e.target.value)}
                        placeholder="例：¥1,980"
                        className="form-input"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>商品説明</label>
                    <textarea
                      value={product.description}
                      onChange={(e) => handleAffiliateProductChange(product.id, 'description', e.target.value)}
                      placeholder="商品の特徴やおすすめポイントを書いてください"
                      className="form-textarea"
                      rows={2}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>商品URL</label>
                    <input
                      type="url"
                      value={product.productUrl}
                      onChange={(e) => handleAffiliateProductChange(product.id, 'productUrl', e.target.value)}
                      placeholder="https://example.com/product"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="affiliate-image-upload">
                    <label>商品画像</label>
                    <div className="image-upload-area">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'affiliate', undefined, product.id)}
                        id={`affiliate-image-${product.id}`}
                        className="image-input"
                      />
                      <label htmlFor={`affiliate-image-${product.id}`} className="image-upload-label small">
                        {previewImages[`affiliate-${product.id}`] ? (
                          <img src={previewImages[`affiliate-${product.id}`]} alt="商品画像" className="image-preview small" />
                        ) : (
                          <div className="upload-placeholder small">
                            <span>📷</span>
                            <p>商品画像をアップロード</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addAffiliateProduct}
              className="add-btn"
            >
              + おすすめ商品を追加
            </button>
          </div>

          {/* 投稿者SNSプロフィール欄 */}
          <div className="form-section">
            <h3>あなたのSNSプロフィール（任意）</h3>
            <div className="sns-profile-fields">
              <div className="sns-profile-row">
                <label htmlFor="sns-twitter">X (Twitter)</label>
                <input
                  id="sns-twitter"
                  type="url"
                  className="form-input"
                  placeholder="https://twitter.com/yourname"
                  value={recipe.authorSNS?.twitter || ''}
                  onChange={e => handleSNSChange('twitter', e.target.value)}
                />
              </div>
              <div className="sns-profile-row">
                <label htmlFor="sns-instagram">Instagram</label>
                <input
                  id="sns-instagram"
                  type="url"
                  className="form-input"
                  placeholder="https://instagram.com/yourname"
                  value={recipe.authorSNS?.instagram || ''}
                  onChange={e => handleSNSChange('instagram', e.target.value)}
                />
              </div>
              <div className="sns-profile-row">
                <label htmlFor="sns-facebook">Facebook</label>
                <input
                  id="sns-facebook"
                  type="url"
                  className="form-input"
                  placeholder="https://facebook.com/yourname"
                  value={recipe.authorSNS?.facebook || ''}
                  onChange={e => handleSNSChange('facebook', e.target.value)}
                />
              </div>
              <div className="sns-profile-row">
                <label htmlFor="sns-line">LINE</label>
                <input
                  id="sns-line"
                  type="text"
                  className="form-input"
                  placeholder="LINE IDやURL"
                  value={recipe.authorSNS?.line || ''}
                  onChange={e => handleSNSChange('line', e.target.value)}
                />
              </div>
              <div className="sns-profile-row">
                <label htmlFor="sns-website">その他Webサイト</label>
                <input
                  id="sns-website"
                  type="url"
                  className="form-input"
                  placeholder="https://your-website.com"
                  value={recipe.authorSNS?.website || ''}
                  onChange={e => handleSNSChange('website', e.target.value)}
                />
              </div>
            </div>
            <div className="sns-profile-help">
              <span className="help-icon">ℹ️</span>
              <span className="help-text">SNSやWebサイトを入力すると、作品ページであなたのプロフィールとして表示されます。</span>
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="form-section">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner">⏳</span>
                  アップロード中...
                </>
              ) : (
                <>
                  <span role="img" aria-label="投稿">📤</span>
                  レシピを投稿する
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GalleryUpload; 