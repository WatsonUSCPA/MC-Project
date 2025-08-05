import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import './GalleryRecipeEdit.css';

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
  pdfUrl?: string;
  cookingTime: string;
  difficulty: string;
  youtubeUrl?: string;
  explanationType: 'video' | 'website' | 'pdf' | 'none';
  websiteExplanation?: string;
  affiliateProducts: AffiliateProduct[];
  authorId: string;
  authorName: string;
  authorEmail: string;
  createdAt: any;
  updatedAt: any;
  likes: number;
  views: number;
}

const GalleryRecipeEdit: React.FC = () => {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [previewImages, setPreviewImages] = useState<{ [key: string]: string }>({});
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File }>({});
  
  // デバッグ用：previewImagesの変更を監視
  useEffect(() => {
    console.log('previewImages changed:', previewImages);
  }, [previewImages]);

  // ユーザー認証状態の監視
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && recipeId) {
        fetchRecipe(user);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [recipeId]);

  const fetchRecipe = async (user: User) => {
    try {
      const db = getFirestore();
      const recipeDoc = doc(db, 'recipes', recipeId!);
      const recipeSnap = await getDoc(recipeDoc);

      if (recipeSnap.exists()) {
        const recipeData = recipeSnap.data();
        
        // レシピの所有者かチェック
        if (recipeData.authorId !== user.uid) {
          alert('このレシピを編集する権限がありません');
          navigate('/gallery/mypage');
          return;
        }

        const recipe: Recipe = {
          id: recipeSnap.id,
          title: recipeData.title || '',
          description: recipeData.description || '',
          ingredients: recipeData.ingredients || [],
          steps: recipeData.steps || [],
          mainImageUrl: recipeData.mainImageUrl || undefined,
          pdfUrl: recipeData.pdfUrl || undefined,
          cookingTime: recipeData.cookingTime || '',
          difficulty: recipeData.difficulty || '初級',
          youtubeUrl: recipeData.youtubeUrl || '',
          explanationType: recipeData.explanationType || 'none',
          websiteExplanation: recipeData.websiteExplanation || '',
          affiliateProducts: recipeData.affiliateProducts || [],
          authorId: recipeData.authorId,
          authorName: recipeData.authorName,
          authorEmail: recipeData.authorEmail,
          createdAt: recipeData.createdAt,
          updatedAt: recipeData.updatedAt,
          likes: recipeData.likes || 0,
          views: recipeData.views || 0
        };

        setRecipe(recipe);
        
        // プレビュー画像を設定
        if (recipe.mainImageUrl) {
          setPreviewImages(prev => ({ ...prev, main: recipe.mainImageUrl! }));
        }
        
        recipe.steps.forEach(step => {
          if (step.imageUrl && step.imageUrl.trim()) {
            setPreviewImages(prev => ({ ...prev, [`step-${step.id}`]: step.imageUrl! }));
          }
        });

        // アフィリエイト商品のプレビュー画像を設定
        recipe.affiliateProducts.forEach(product => {
          if (product.imageUrl && product.imageUrl.trim()) {
            setPreviewImages(prev => ({ ...prev, [`affiliate-${product.id}`]: product.imageUrl! }));
          }
        });
      } else {
        alert('レシピが見つかりません');
        navigate('/gallery/mypage');
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      alert('レシピの取得に失敗しました');
      navigate('/gallery/mypage');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (recipe) {
      setRecipe({ ...recipe, title: e.target.value });
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (recipe) {
      setRecipe({ ...recipe, description: e.target.value });
    }
  };

  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (recipe) {
      setRecipe({ ...recipe, youtubeUrl: e.target.value });
    }
  };

  const handleExplanationTypeChange = (type: 'video' | 'website' | 'pdf' | 'none') => {
    if (recipe) {
      setRecipe({ 
        ...recipe, 
        explanationType: type,
        youtubeUrl: type !== 'video' ? '' : recipe.youtubeUrl,
        websiteExplanation: type !== 'website' ? '' : recipe.websiteExplanation,
        pdfUrl: type !== 'pdf' ? '' : recipe.pdfUrl
      });
    }
  };

  const handleWebsiteExplanationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (recipe) {
      setRecipe({ ...recipe, websiteExplanation: e.target.value });
    }
  };

  const handlePdfUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (recipe) {
      setRecipe({ ...recipe, pdfUrl: e.target.value });
    }
  };

  const getYoutubeEmbedUrl = (url: string): string | null => {
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

  const handleIngredientChange = (index: number, value: string) => {
    if (recipe) {
      const newIngredients = [...recipe.ingredients];
      newIngredients[index] = value;
      setRecipe({ ...recipe, ingredients: newIngredients });
    }
  };

  const addIngredient = () => {
    if (recipe) {
      setRecipe({ ...recipe, ingredients: [...recipe.ingredients, ''] });
    }
  };

  const removeIngredient = (index: number) => {
    if (recipe) {
      const newIngredients = recipe.ingredients.filter((_, i) => i !== index);
      setRecipe({ ...recipe, ingredients: newIngredients });
    }
  };

  const handleStepChange = (stepId: number, description: string) => {
    if (recipe) {
      const newSteps = recipe.steps.map(step => 
        step.id === stepId ? { ...step, description } : step
      );
      setRecipe({ ...recipe, steps: newSteps });
    }
  };

  const addStep = () => {
    if (recipe) {
      const newStepId = recipe.steps.length + 1;
      const newStep = { id: newStepId, description: '新しいステップ' };
      setRecipe({ 
        ...recipe, 
        steps: [...recipe.steps, newStep] 
      });
    }
  };

  const removeStep = (stepId: number) => {
    if (recipe) {
      const newSteps = recipe.steps.filter(step => step.id !== stepId);
      setRecipe({ ...recipe, steps: newSteps });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'step' | 'affiliate', stepId?: number, productId?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（5MB制限）
    if (file.size > 5 * 1024 * 1024) {
      alert('画像サイズは5MB以下にしてください。');
      return;
    }

    console.log('Image upload started:', { type, stepId, productId, fileName: file.name });

    // 画像を圧縮してBase64エンコード
    const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // 最大サイズを設定（800x600）
          const maxWidth = 800;
          const maxHeight = 600;
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          
          // 品質を0.7に設定してJPEG形式で圧縮
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
        
        img.src = URL.createObjectURL(file);
      });
    };

    compressImage(file).then((compressedImage) => {
      console.log('FileReader result:', { type, resultLength: compressedImage.length });
      
      if (type === 'main') {
        console.log('Setting main image preview');
        setPreviewImages(prev => {
          const newState = { ...prev, main: compressedImage };
          console.log('New preview state:', newState);
          return newState;
        });
        setUploadedFiles(prev => ({ ...prev, main: file }));
      } else if (type === 'step' && stepId) {
        setPreviewImages(prev => ({ ...prev, [`step-${stepId}`]: compressedImage }));
        setUploadedFiles(prev => ({ ...prev, [`step-${stepId}`]: file }));
      } else if (type === 'affiliate' && productId) {
        setPreviewImages(prev => ({ ...prev, [`affiliate-${productId}`]: compressedImage }));
        setUploadedFiles(prev => ({ ...prev, [`affiliate-${productId}`]: file }));
      }
    });
  };

  // アフィリエイト商品の管理機能
  const handleAffiliateProductChange = (productId: number, field: keyof AffiliateProduct, value: string) => {
    if (recipe) {
      const newProducts = recipe.affiliateProducts.map(product =>
        product.id === productId ? { ...product, [field]: value } : product
      );
      setRecipe({ ...recipe, affiliateProducts: newProducts });
    }
  };

  const addAffiliateProduct = () => {
    if (recipe) {
      const newProductId = recipe.affiliateProducts.length > 0
        ? Math.max(...recipe.affiliateProducts.map(p => p.id)) + 1
        : 1;
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
    }
  };

  const removeAffiliateProduct = (productId: number) => {
    if (recipe) {
      const newProducts = recipe.affiliateProducts.filter(product => product.id !== productId);
      setRecipe({ ...recipe, affiliateProducts: newProducts });
    }
  };

  const handleSave = async () => {
    if (!recipe || !currentUser) return;

    // 必須フィールドの検証
    if (!recipe.title.trim()) {
      alert('タイトルを入力してください');
      return;
    }
    if (!recipe.description.trim()) {
      alert('説明を入力してください');
      return;
    }
    if (!recipe.cookingTime) {
      alert('制作時間を選択してください');
      return;
    }
    if (!recipe.difficulty) {
      alert('難易度を選択してください');
      return;
    }

    setSaving(true);
    try {
      const db = getFirestore();
      const recipeDoc = doc(db, 'recipes', recipe.id);

      // 画像をBase64エンコード（新しい画像がアップロードされた場合）
      let mainImageUrl = recipe.mainImageUrl;
      if (uploadedFiles.main) {
        mainImageUrl = previewImages.main;
      }

      // ステップ画像もBase64エンコード
      const stepsWithImages = recipe.steps.map(step => {
        const stepData: any = {
          id: step.id,
          description: step.description
        };
        
        if (uploadedFiles[`step-${step.id}`]) {
          stepData.imageUrl = previewImages[`step-${step.id}`];
        } else if (step.imageUrl) {
          stepData.imageUrl = step.imageUrl;
        }
        
        return stepData;
      });

      // アフィリエイト商品の画像もBase64エンコード
      const affiliateProductsWithImages = recipe.affiliateProducts.map(product => {
        const productData: any = {
          id: product.id,
          name: product.name,
          description: product.description,
          productUrl: product.productUrl,
          price: product.price
        };
        
        if (uploadedFiles[`affiliate-${product.id}`]) {
          productData.imageUrl = previewImages[`affiliate-${product.id}`];
        } else if (product.imageUrl) {
          productData.imageUrl = product.imageUrl;
        }
        
        return productData;
      });

      // Firestoreに保存するデータ（undefined値を除外）
      const recipeData: any = {
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients.filter(ingredient => ingredient.trim() !== ''),
        steps: stepsWithImages,
        affiliateProducts: affiliateProductsWithImages,
        cookingTime: recipe.cookingTime,
        difficulty: recipe.difficulty,
        explanationType: recipe.explanationType,
        updatedAt: new Date()
      };

      // オプショナルフィールドの追加（undefinedでない場合のみ）
      if (mainImageUrl) {
        recipeData.mainImageUrl = mainImageUrl;
      }
      if (recipe.youtubeUrl && recipe.youtubeUrl.trim()) {
        recipeData.youtubeUrl = recipe.youtubeUrl.trim();
      }
      if (recipe.websiteExplanation && recipe.websiteExplanation.trim()) {
        recipeData.websiteExplanation = recipe.websiteExplanation.trim();
      }
      if (recipe.pdfUrl && recipe.pdfUrl.trim()) {
        recipeData.pdfUrl = recipe.pdfUrl.trim();
      }

      await updateDoc(recipeDoc, recipeData);
      
      alert('レシピを更新しました！');
      navigate('/gallery/mypage');
      
    } catch (error) {
      console.error('Error updating recipe:', error);
      alert('レシピの更新に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/gallery/mypage');
  };

  if (loading) {
    return (
      <div className="recipe-edit">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="recipe-edit">
        <div className="login-required">
          <h2>ログインが必要です</h2>
          <p>レシピ編集にはログインしてください。</p>
          <button className="login-btn" onClick={() => navigate('/gallery/login')}>
            ログインする
          </button>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="recipe-edit">
        <div className="error">レシピが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="recipe-edit">
      <div className="recipe-edit-container">
        {/* ヘッダー */}
        <div className="recipe-edit-header">
          <h1>レシピ編集</h1>
          <button className="back-btn" onClick={handleCancel}>
            ← 戻る
          </button>
        </div>

        <div className="recipe-edit-content">
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
                                                         {previewImages.main ? (
                <div style={{ width: '100%', textAlign: 'center', position: 'relative' }}>
                  <img 
                    src={previewImages.main} 
                    alt="プレビュー" 
                    className="image-preview"
                    style={{ 
                      maxWidth: '100%',
                      height: 'auto',
                      display: 'block',
                      margin: '0 auto',
                      borderRadius: '8px'
                    }}
                    onError={(e) => {
                      console.error('Image failed to load:', e);
                      setPreviewImages(prev => ({ ...prev, main: '' }));
                    }}
                    onLoad={() => console.log('Image loaded successfully')}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <button
                      type="button"
                      onClick={() => document.getElementById('main-image')?.click()}
                      style={{
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      変更
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewImages(prev => ({ ...prev, main: '' }))}
                      style={{
                        background: 'rgba(220, 53, 69, 0.8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor="main-image" className="image-upload-label">
                  <div className="upload-placeholder">
                    <span>📷</span>
                    <p>画像をアップロード</p>
                  </div>
                </label>
              )}
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
                
                <label className={`explanation-option ${recipe.explanationType === 'pdf' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="explanationType"
                    value="pdf"
                    checked={recipe.explanationType === 'pdf'}
                    onChange={() => handleExplanationTypeChange('pdf')}
                  />
                  <div className="option-content">
                    <span className="option-icon">📄</span>
                    <div className="option-text">
                      <h4>PDFで説明</h4>
                      <p>PDFファイルのURLで詳細な説明を提供</p>
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

          {/* PDF URL（PDF選択時のみ表示） */}
          {recipe.explanationType === 'pdf' && (
            <div className="form-section">
              <h3>PDF URL</h3>
              <div className="pdf-url-area">
                <input
                  type="url"
                  value={recipe.pdfUrl || ''}
                  onChange={handlePdfUrlChange}
                  placeholder="https://example.com/recipe.pdf"
                  className="form-input pdf-url-input"
                />
                <div className="pdf-help">
                  <span className="help-icon">ℹ️</span>
                  <span className="help-text">
                    詳細な作り方が記載されたPDFファイルのURLを入力してください
                  </span>
                </div>
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
                  onChange={(e) => setRecipe({ ...recipe, cookingTime: e.target.value })}
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
                  onChange={(e) => setRecipe({ ...recipe, difficulty: e.target.value })}
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
            {(recipe.ingredients || []).map((ingredient, index) => (
              <div key={index} className="ingredient-row">
                <input
                  type="text"
                  value={ingredient}
                  onChange={(e) => handleIngredientChange(index, e.target.value)}
                  placeholder="例：綿生地 30cm × 30cm"
                  className="form-input ingredient-input"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="remove-btn"
                >
                  ✕
                </button>
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
                  <button
                    type="button"
                    onClick={() => removeStep(step.id)}
                    className="remove-btn"
                  >
                    ✕
                  </button>
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
                                         {previewImages[`step-${step.id}`] ? (
                       <div style={{ position: 'relative' }}>
                         <img 
                           src={previewImages[`step-${step.id}`]} 
                           alt="ステップ画像" 
                           className="image-preview small"
                           style={{ borderRadius: '8px' }}
                         />
                         <div style={{
                           position: 'absolute',
                           top: '5px',
                           right: '5px',
                           display: 'flex',
                           gap: '4px'
                         }}>
                           <button
                             type="button"
                             onClick={() => document.getElementById(`step-image-${step.id}`)?.click()}
                             style={{
                               background: 'rgba(0, 0, 0, 0.7)',
                               color: 'white',
                               border: 'none',
                               borderRadius: '3px',
                               padding: '4px 8px',
                               fontSize: '10px',
                               cursor: 'pointer',
                               fontWeight: 'bold'
                             }}
                           >
                             変更
                           </button>
                           <button
                             type="button"
                             onClick={() => setPreviewImages(prev => ({ ...prev, [`step-${step.id}`]: '' }))}
                             style={{
                               background: 'rgba(220, 53, 69, 0.8)',
                               color: 'white',
                               border: 'none',
                               borderRadius: '3px',
                               padding: '4px 8px',
                               fontSize: '10px',
                               cursor: 'pointer',
                               fontWeight: 'bold'
                             }}
                           >
                             削除
                           </button>
                         </div>
                       </div>
                     ) : (
                       <label htmlFor={`step-image-${step.id}`} className="image-upload-label small">
                         <div className="upload-placeholder small">
                           <span>📷</span>
                         </div>
                       </label>
                     )}
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
            {(recipe.affiliateProducts || []).map((product) => (
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
                                             {previewImages[`affiliate-${product.id}`] ? (
                         <div style={{ position: 'relative' }}>
                           <img 
                             src={previewImages[`affiliate-${product.id}`]} 
                             alt="商品画像" 
                             className="image-preview small"
                             style={{ borderRadius: '8px' }}
                           />
                           <div style={{
                             position: 'absolute',
                             top: '5px',
                             right: '5px',
                             display: 'flex',
                             gap: '4px'
                           }}>
                             <button
                               type="button"
                               onClick={() => document.getElementById(`affiliate-image-${product.id}`)?.click()}
                               style={{
                                 background: 'rgba(0, 0, 0, 0.7)',
                                 color: 'white',
                                 border: 'none',
                                 borderRadius: '3px',
                                 padding: '4px 8px',
                                 fontSize: '10px',
                                 cursor: 'pointer',
                                 fontWeight: 'bold'
                               }}
                             >
                               変更
                             </button>
                             <button
                               type="button"
                               onClick={() => setPreviewImages(prev => ({ ...prev, [`affiliate-${product.id}`]: '' }))}
                               style={{
                                 background: 'rgba(220, 53, 69, 0.8)',
                                 color: 'white',
                                 border: 'none',
                                 borderRadius: '3px',
                                 padding: '4px 8px',
                                 fontSize: '10px',
                                 cursor: 'pointer',
                                 fontWeight: 'bold'
                               }}
                             >
                               削除
                             </button>
                           </div>
                         </div>
                       ) : (
                         <label htmlFor={`affiliate-image-${product.id}`} className="image-upload-label small">
                           <div className="upload-placeholder small">
                             <span>📷</span>
                             <p>商品画像をアップロード</p>
                           </div>
                         </label>
                       )}
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

          {/* 送信ボタン */}
          <div className="form-section">
            <div className="form-actions">
              <button className="cancel-btn" onClick={handleCancel}>
                キャンセル
              </button>
              <button 
                type="button" 
                className="save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="loading-spinner">⏳</span>
                    更新中...
                  </>
                ) : (
                  <>
                    <span role="img" aria-label="保存">💾</span>
                    レシピを更新する
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryRecipeEdit; 