import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './GalleryAdmin.css';

interface PopularKeyword {
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
  const [editingKeyword, setEditingKeyword] = useState<PopularKeyword | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

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
      const adminDoc = await getDocs(collection(db, 'admins'));
      const isUserAdmin = adminDoc.docs.some(doc => doc.id === uid);
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

  // 画像アップロード
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      setUploadingImage(true);
      const storage = getStorage();
      const storageRef = ref(storage, `keywords/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setUploadingImage(false);
      return downloadURL;
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
          <p>管理者パスワードを入力してください</p>
          
          {!showPasswordForm ? (
            <button 
              onClick={() => setShowPasswordForm(true)} 
              className="login-button"
            >
              パスワードを入力
            </button>
          ) : (
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
        <p className="admin-subtitle">人気キーワードの管理</p>
      </div>

      <div className="admin-content">
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

export default GalleryAdmin; 