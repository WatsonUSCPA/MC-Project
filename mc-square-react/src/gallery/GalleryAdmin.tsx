import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

import './GalleryAdmin.css';

interface PopularKeyword {
  id: string;
  name: string;
  image: string;
  order: number;
}

interface SituationCategory {
  id: string;
  name: string;
  image: string;
  order: number;
}

interface AdminUser {
  uid: string;
  email: string;
  isAdmin: boolean;
}

const GalleryAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keywords, setKeywords] = useState<PopularKeyword[]>([]);
  const [situations, setSituations] = useState<SituationCategory[]>([]);
  const [editingKeyword, setEditingKeyword] = useState<PopularKeyword | null>(null);
  const [editingSituation, setEditingSituation] = useState<SituationCategory | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isAddingNewSituation, setIsAddingNewSituation] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [activeTab, setActiveTab] = useState<'keywords' | 'situations'>('keywords');


  // ユーザー認証状態の監視
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // 管理者権限をチェック
        await checkAdminStatus(user.uid);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 管理者権限をチェック
  const checkAdminStatus = async (uid: string) => {
    try {
      const db = getFirestore();
      
      // 複数の方法で管理者権限をチェック
      let isUserAdmin = false;
      
      // 1. adminsコレクションでチェック
      try {
        const adminDoc = await getDocs(collection(db, 'admins'));
        isUserAdmin = adminDoc.docs.some(doc => doc.id === uid);
      } catch (error) {
        console.log('adminsコレクションが見つかりません');
      }
      
      // 2. usersコレクションで管理者権限をチェック
      if (!isUserAdmin) {
        try {
          const userDoc = await getDocs(collection(db, 'users'));
          const userData = userDoc.docs.find(doc => doc.id === uid);
          if (userData) {
            const data = userData.data();
            isUserAdmin = data.role === 'admin' || data.isAdmin === true;
          }
        } catch (error) {
          console.log('usersコレクションで管理者権限をチェックできませんでした');
        }
      }
      
      // 3. 特定のメールアドレスで管理者権限を付与（開発用）
      if (!isUserAdmin && currentUser?.email) {
        const adminEmails = [
          'admin@example.com',
          'your-email@example.com', // あなたのメールアドレスを追加
          'test@example.com',
          'what1@example.com', // あなたの実際のメールアドレスを追加してください
          currentUser.email // 現在のユーザーのメールアドレスを一時的に追加
        ];
        isUserAdmin = adminEmails.includes(currentUser.email);
      }
      
      setIsAdmin(isUserAdmin);
      setLoading(false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  // パスワード認証
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    // 管理者パスワード（実際の運用では環境変数などで管理）
    const correctPassword = 'admin1234';
    
    if (adminPassword === correctPassword) {
      setIsAdmin(true);
      setShowPasswordForm(false);
      setAdminPassword('');
    } else {
      setPasswordError('パスワードが正しくありません');
      setAdminPassword('');
    }
  };

  // キーワード一覧を取得
  useEffect(() => {
    if (isAdmin) {
      fetchKeywords();
      fetchSituations();
    }
  }, [isAdmin]);

  const fetchKeywords = async () => {
    try {
      const db = getFirestore();
      const keywordsRef = collection(db, 'popularKeywords');
      const snapshot = await getDocs(keywordsRef);
      const keywordsData: PopularKeyword[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        keywordsData.push({
          id: doc.id,
          name: data.name || '',
          image: data.image || '',
          order: data.order || 0
        });
      });

      // 順序でソート
      keywordsData.sort((a, b) => a.order - b.order);
      setKeywords(keywordsData);
    } catch (error) {
      console.error('Error fetching keywords:', error);
    }
  };

  // シチュエーションカテゴリを取得
  const fetchSituations = async () => {
    try {
      const db = getFirestore();
      const situationsRef = collection(db, 'situationCategories');
      const snapshot = await getDocs(situationsRef);
      const situationsData: SituationCategory[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        situationsData.push({
          id: doc.id,
          name: data.name || '',
          image: data.image || '',
          order: data.order || 0
        });
      });

      // 順序でソート
      situationsData.sort((a, b) => a.order - b.order);
      setSituations(situationsData);
    } catch (error) {
      console.error('Error fetching situations:', error);
    }
  };

  // 画像アップロード（Base64エンコード）
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      setUploadingImage(true);
      
      // ファイルサイズチェック（10MB制限に緩和）
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('画像サイズは10MB以下にしてください。');
      }

      // より効率的な画像圧縮
      const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          img.onload = () => {
            try {
              // 元のサイズを取得
              let { width, height } = img;
              
              // より大きなサイズ制限に変更（1200x900）
              const maxWidth = 1200;
              const maxHeight = 900;
              
              // アスペクト比を保ちながらリサイズ
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
              
              // 高品質な描画設定
              ctx!.imageSmoothingEnabled = true;
              ctx!.imageSmoothingQuality = 'high';
              
              ctx?.drawImage(img, 0, 0, width, height);
              
              // 品質を0.8に上げてJPEG形式で圧縮
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
              resolve(compressedDataUrl);
            } catch (error) {
              reject(error);
            }
          };
          
          img.onerror = () => {
            reject(new Error('画像の読み込みに失敗しました'));
          };
          
          img.src = URL.createObjectURL(file);
        });
      };

      const compressedImage = await compressImage(file);
      setUploadingImage(false);
      return compressedImage;
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadingImage(false);
      throw error;
    }
  };

  // 新しいキーワードを追加
  const handleAddKeyword = async (keywordData: Omit<PopularKeyword, 'id'>) => {
    try {
      const db = getFirestore();
      const keywordsRef = collection(db, 'popularKeywords');
      await addDoc(keywordsRef, {
        name: keywordData.name,
        image: keywordData.image,
        order: keywords.length
      });
      
      setIsAddingNew(false);
      fetchKeywords();
    } catch (error) {
      console.error('Error adding keyword:', error);
      alert('キーワードの追加に失敗しました');
    }
  };

  // キーワードを更新
  const handleUpdateKeyword = async (keywordData: Omit<PopularKeyword, 'id'>) => {
    if (!editingKeyword) return;
    
    try {
      const db = getFirestore();
      const keywordRef = doc(db, 'popularKeywords', editingKeyword.id);
      await updateDoc(keywordRef, {
        name: keywordData.name,
        image: keywordData.image,
        order: keywordData.order
      });
      
      setEditingKeyword(null);
      fetchKeywords();
    } catch (error) {
      console.error('Error updating keyword:', error);
      alert('キーワードの更新に失敗しました');
    }
  };

  // キーワードを削除
  const handleDeleteKeyword = async (keywordId: string) => {
    if (!window.confirm('このキーワードを削除しますか？')) {
      return;
    }

    try {
      const db = getFirestore();
      const keywordRef = doc(db, 'popularKeywords', keywordId);
      await deleteDoc(keywordRef);
      
      fetchKeywords();
    } catch (error) {
      console.error('Error deleting keyword:', error);
      alert('キーワードの削除に失敗しました');
    }
  };

  // 順序を変更
  const handleReorder = async (keywordId: string, newOrder: number) => {
    try {
      const db = getFirestore();
      const keywordRef = doc(db, 'popularKeywords', keywordId);
      await updateDoc(keywordRef, {
        order: newOrder
      });
      
      fetchKeywords();
    } catch (error) {
      console.error('Error reordering keyword:', error);
    }
  };

  // 新しいシチュエーションカテゴリを追加
  const handleAddSituation = async (situationData: Omit<SituationCategory, 'id'>) => {
    try {
      const db = getFirestore();
      const situationsRef = collection(db, 'situationCategories');
      await addDoc(situationsRef, {
        name: situationData.name,
        image: situationData.image,
        order: situations.length
      });
      
      setIsAddingNewSituation(false);
      fetchSituations();
    } catch (error) {
      console.error('Error adding situation:', error);
      alert('シチュエーションカテゴリの追加に失敗しました');
    }
  };

  // シチュエーションカテゴリを更新
  const handleUpdateSituation = async (situationData: Omit<SituationCategory, 'id'>) => {
    if (!editingSituation) return;
    
    try {
      const db = getFirestore();
      const situationRef = doc(db, 'situationCategories', editingSituation.id);
      await updateDoc(situationRef, {
        name: situationData.name,
        image: situationData.image,
        order: situationData.order
      });
      
      setEditingSituation(null);
      fetchSituations();
    } catch (error) {
      console.error('Error updating situation:', error);
      alert('シチュエーションカテゴリの更新に失敗しました');
    }
  };

  // シチュエーションカテゴリを削除
  const handleDeleteSituation = async (situationId: string) => {
    if (!window.confirm('このシチュエーションカテゴリを削除しますか？')) {
      return;
    }

    try {
      const db = getFirestore();
      const situationRef = doc(db, 'situationCategories', situationId);
      await deleteDoc(situationRef);
      
      fetchSituations();
    } catch (error) {
      console.error('Error deleting situation:', error);
      alert('シチュエーションカテゴリの削除に失敗しました');
    }
  };

  // シチュエーションカテゴリの順序を変更
  const handleReorderSituation = async (situationId: string, newOrder: number) => {
    try {
      const db = getFirestore();
      const situationRef = doc(db, 'situationCategories', situationId);
      await updateDoc(situationRef, {
        order: newOrder
      });
      
      fetchSituations();
    } catch (error) {
      console.error('Error reordering situation:', error);
    }
  };

  const handleBackToHome = () => {
    navigate('/gallery');
  };



  if (loading) {
    return (
      <div className="gallery-admin">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="gallery-admin">
        <div className="auth-required">
          <h2>ログインが必要です</h2>
          <p>管理者ページにアクセスするにはログインしてください。</p>
          <button onClick={() => navigate('/gallery/login')} className="login-button">
            ログイン
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="gallery-admin">
        <div className="access-denied">
          <h2>管理者ページ</h2>
          <p>管理者権限が必要です</p>
          
          <button 
            onClick={() => setShowPasswordForm(true)} 
            className="login-button"
          >
            パスワードを入力
          </button>
          
          {showPasswordForm && (
            <form onSubmit={handlePasswordSubmit} className="password-form">
              <div className="form-group">
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="管理者パスワード"
                  required
                  className="password-input"
                />
              </div>
              {passwordError && (
                <div className="error-message">{passwordError}</div>
              )}
              <div className="form-actions">
                <button type="submit" className="submit-button">
                  認証
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowPasswordForm(false);
                    setAdminPassword('');
                    setPasswordError('');
                  }}
                  className="cancel-button"
                >
                  キャンセル
                </button>
              </div>
            </form>
          )}
          
          <button onClick={handleBackToHome} className="back-button">
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="gallery-admin">
      <div className="admin-header">
        <button className="back-button" onClick={handleBackToHome}>
          ← ホームに戻る
        </button>
        <h1 className="admin-title">管理者ページ</h1>
        <p className="admin-subtitle">コンテンツ管理</p>
      </div>

      <div className="admin-content">
        {/* タブナビゲーション */}
        <div className="admin-tabs">
          <button 
            className={`tab-button ${activeTab === 'keywords' ? 'active' : ''}`}
            onClick={() => setActiveTab('keywords')}
          >
            人気キーワード
          </button>
          <button 
            className={`tab-button ${activeTab === 'situations' ? 'active' : ''}`}
            onClick={() => setActiveTab('situations')}
          >
            シチュエーションカテゴリ
          </button>
        </div>

        {/* 人気キーワードタブ */}
        {activeTab === 'keywords' && (
          <div className="keywords-section">
            <div className="section-header">
              <h2>人気キーワード一覧</h2>
              <button 
                className="add-button"
                onClick={() => setIsAddingNew(true)}
              >
                + 新しいキーワードを追加
              </button>
            </div>

            <div className="keywords-grid">
              {keywords.map((keyword, index) => (
                <div key={keyword.id} className="keyword-card">
                  <div className="keyword-image">
                    <img src={keyword.image} alt={keyword.name} />
                  </div>
                  <div className="keyword-info">
                    <h3>{keyword.name}</h3>
                    <p>順序: {keyword.order}</p>
                  </div>
                  <div className="keyword-actions">
                    <button 
                      className="edit-button"
                      onClick={() => setEditingKeyword(keyword)}
                    >
                      編集
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteKeyword(keyword.id)}
                    >
                      削除
                    </button>
                    {index > 0 && (
                      <button 
                        className="move-up-button"
                        onClick={() => handleReorder(keyword.id, keyword.order - 1)}
                      >
                        ↑
                      </button>
                    )}
                    {index < keywords.length - 1 && (
                      <button 
                        className="move-down-button"
                        onClick={() => handleReorder(keyword.id, keyword.order + 1)}
                      >
                        ↓
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* シチュエーションカテゴリタブ */}
        {activeTab === 'situations' && (
          <div className="situations-section">
            <div className="section-header">
              <h2>シチュエーションカテゴリ一覧</h2>
              <button 
                className="add-button"
                onClick={() => setIsAddingNewSituation(true)}
              >
                + 新しいカテゴリを追加
              </button>
            </div>

            <div className="situations-grid">
              {situations.map((situation, index) => (
                <div key={situation.id} className="situation-card">
                  <div className="situation-image">
                    <img src={situation.image} alt={situation.name} />
                  </div>
                                     <div className="situation-info">
                     <h3>{situation.name}</h3>
                     <p>順序: {situation.order}</p>
                   </div>
                  <div className="situation-actions">
                    <button 
                      className="edit-button"
                      onClick={() => setEditingSituation(situation)}
                    >
                      編集
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteSituation(situation.id)}
                    >
                      削除
                    </button>
                    {index > 0 && (
                      <button 
                        className="move-up-button"
                        onClick={() => handleReorderSituation(situation.id, situation.order - 1)}
                      >
                        ↑
                      </button>
                    )}
                    {index < situations.length - 1 && (
                      <button 
                        className="move-down-button"
                        onClick={() => handleReorderSituation(situation.id, situation.order + 1)}
                      >
                        ↓
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 新規追加モーダル */}
        {isAddingNew && (
          <KeywordForm
            onSubmit={handleAddKeyword}
            onCancel={() => setIsAddingNew(false)}
            onImageUpload={handleImageUpload}
            uploadingImage={uploadingImage}
          />
        )}

        {/* 編集モーダル */}
        {editingKeyword && (
          <KeywordForm
            keyword={editingKeyword}
            onSubmit={handleUpdateKeyword}
            onCancel={() => setEditingKeyword(null)}
            onImageUpload={handleImageUpload}
            uploadingImage={uploadingImage}
          />
        )}

        {/* シチュエーション新規追加モーダル */}
        {isAddingNewSituation && (
          <SituationForm
            onSubmit={handleAddSituation}
            onCancel={() => setIsAddingNewSituation(false)}
            onImageUpload={handleImageUpload}
            uploadingImage={uploadingImage}
          />
        )}

        {/* シチュエーション編集モーダル */}
        {editingSituation && (
          <SituationForm
            situation={editingSituation}
            onSubmit={handleUpdateSituation}
            onCancel={() => setEditingSituation(null)}
            onImageUpload={handleImageUpload}
            uploadingImage={uploadingImage}
          />
        )}
      </div>
    </div>
  );
};

// キーワードフォームコンポーネント
interface KeywordFormProps {
  keyword?: PopularKeyword;
  onSubmit: (data: Omit<PopularKeyword, 'id'>) => void;
  onCancel: () => void;
  onImageUpload: (file: File) => Promise<string>;
  uploadingImage: boolean;
}

const KeywordForm: React.FC<KeywordFormProps> = ({
  keyword,
  onSubmit,
  onCancel,
  onImageUpload,
  uploadingImage
}) => {
  const [name, setName] = useState(keyword?.name || '');
  const [image, setImage] = useState(keyword?.image || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(keyword?.image || '');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('キーワード名を入力してください');
      return;
    }

    try {
      let imageUrl = image;
      if (imageFile) {
        imageUrl = await onImageUpload(imageFile);
      }

      onSubmit({
        name: name.trim(),
        image: imageUrl,
        order: keyword?.order || 0
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('保存に失敗しました');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{keyword ? 'キーワードを編集' : '新しいキーワードを追加'}</h3>
        
        <form onSubmit={handleSubmit} className="keyword-form">
          <div className="form-group">
            <label htmlFor="name">キーワード名</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: パッチワーク"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">画像</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
            />
            {previewUrl && (
              <div className="image-preview">
                <img src={previewUrl} alt="プレビュー" />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-button">
              キャンセル
            </button>
            <button type="submit" className="save-button" disabled={uploadingImage}>
              {uploadingImage ? 'アップロード中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// シチュエーションカテゴリフォームコンポーネント
interface SituationFormProps {
  situation?: SituationCategory;
  onSubmit: (data: Omit<SituationCategory, 'id'>) => void;
  onCancel: () => void;
  onImageUpload: (file: File) => Promise<string>;
  uploadingImage: boolean;
}

const SituationForm: React.FC<SituationFormProps> = ({
  situation,
  onSubmit,
  onCancel,
  onImageUpload,
  uploadingImage
}) => {
  const [name, setName] = useState(situation?.name || '');
  const [image, setImage] = useState(situation?.image || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(situation?.image || '');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('カテゴリ名を入力してください');
      return;
    }



    try {
      let imageUrl = image;
      if (imageFile) {
        imageUrl = await onImageUpload(imageFile);
      }

      onSubmit({
        name: name.trim(),
        image: imageUrl,
        order: situation?.order || 0
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('保存に失敗しました');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{situation ? 'シチュエーションカテゴリを編集' : '新しいシチュエーションカテゴリを追加'}</h3>
        
        <form onSubmit={handleSubmit} className="situation-form">
          <div className="form-group">
            <label htmlFor="name">カテゴリ名</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 小学校向け"
              required
            />
          </div>



          <div className="form-group">
            <label htmlFor="image">画像</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
            />
            {previewUrl && (
              <div className="image-preview">
                <img src={previewUrl} alt="プレビュー" />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-button">
              キャンセル
            </button>
            <button type="submit" className="save-button" disabled={uploadingImage}>
              {uploadingImage ? 'アップロード中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GalleryAdmin; 