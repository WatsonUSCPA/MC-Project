import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, updateProfile, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import './GalleryProfileEdit.css';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  authorSNS?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    line?: string;
    website?: string;
  };
}

const GalleryProfileEdit: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    twitter: '',
    instagram: '',
    facebook: '',
    line: '',
    website: ''
  });

  // ユーザー認証状態の監視
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Firestoreからユーザープロフィール情報を取得
        const db = getFirestore();
        const userDoc = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDoc);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const authorSNS = userData.authorSNS || {};
          setFormData({
            displayName: userData.displayName || user.displayName || '',
            bio: userData.bio || '',
            twitter: authorSNS.twitter || '',
            instagram: authorSNS.instagram || '',
            facebook: authorSNS.facebook || '',
            line: authorSNS.line || '',
            website: authorSNS.website || ''
          });
        } else {
          // 新規ユーザーの場合
          setFormData({
            displayName: user.displayName || '',
            bio: '',
            twitter: '',
            instagram: '',
            facebook: '',
            line: '',
            website: ''
          });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      const auth = getAuth();
      const db = getFirestore();

      // Firebase Authのプロフィールを更新
      await updateProfile(currentUser, {
        displayName: formData.displayName
      });

      // Firestoreにユーザープロフィール情報を保存
      const userDoc = doc(db, 'users', currentUser.uid);
      
      // SNS情報をフィルタリング（空文字列やundefinedを除外）
      const authorSNS: any = {};
      if (formData.twitter && formData.twitter.trim()) {
        authorSNS.twitter = formData.twitter.trim();
      }
      if (formData.instagram && formData.instagram.trim()) {
        authorSNS.instagram = formData.instagram.trim();
      }
      if (formData.facebook && formData.facebook.trim()) {
        authorSNS.facebook = formData.facebook.trim();
      }
      if (formData.line && formData.line.trim()) {
        authorSNS.line = formData.line.trim();
      }
      if (formData.website && formData.website.trim()) {
        authorSNS.website = formData.website.trim();
      }

      await setDoc(userDoc, {
        uid: currentUser.uid,
        displayName: formData.displayName,
        email: currentUser.email,
        bio: formData.bio || null,
        authorSNS: Object.keys(authorSNS).length > 0 ? authorSNS : null,
        updatedAt: new Date()
      }, { merge: true });

      alert('プロフィールを更新しました！');
      window.location.href = '/gallery/mypage';
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('プロフィールの更新に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    window.location.href = '/gallery/mypage';
  };

  if (loading) {
    return (
      <div className="profile-edit">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="profile-edit">
        <div className="login-required">
          <h2>ログインが必要です</h2>
          <p>プロフィール編集にはログインしてください。</p>
          <button className="login-btn" onClick={() => window.location.href = '/gallery/login'}>
            ログインする
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-edit">
      <div className="profile-edit-container">
        {/* ヘッダー */}
        <div className="profile-edit-header">
          <h1>プロフィール編集</h1>
          <button className="back-btn" onClick={handleCancel}>
            ← 戻る
          </button>
        </div>

        <div className="profile-edit-content">
          {/* 基本情報 */}
          <div className="edit-section">
            <h3>基本情報</h3>
            <div className="form-group">
              <label htmlFor="displayName">表示名 *</label>
              <input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="表示名を入力"
                className="form-input"
                required
              />
              <p className="form-help">他のユーザーに表示される名前です</p>
            </div>

            <div className="form-group">
              <label htmlFor="bio">自己紹介</label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="自己紹介を入力してください"
                className="form-textarea"
                rows={4}
              />
              <p className="form-help">あなたのプロフィールに表示される自己紹介です</p>
            </div>
          </div>

          {/* SNS情報 */}
          <div className="edit-section">
            <h3>SNS情報</h3>
            <p className="section-description">
              SNSやWebサイトのURLを入力すると、作品ページであなたのプロフィールとして表示されます。
            </p>

            <div className="sns-inputs">
              <div className="form-group">
                <label htmlFor="twitter">
                  <span className="sns-icon">🐦</span>
                  X (Twitter)
                </label>
                <input
                  id="twitter"
                  type="url"
                  value={formData.twitter}
                  onChange={(e) => handleInputChange('twitter', e.target.value)}
                  placeholder="https://twitter.com/yourname"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="instagram">
                  <span className="sns-icon">📸</span>
                  Instagram
                </label>
                <input
                  id="instagram"
                  type="url"
                  value={formData.instagram}
                  onChange={(e) => handleInputChange('instagram', e.target.value)}
                  placeholder="https://instagram.com/yourname"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="facebook">
                  <span className="sns-icon">📘</span>
                  Facebook
                </label>
                <input
                  id="facebook"
                  type="url"
                  value={formData.facebook}
                  onChange={(e) => handleInputChange('facebook', e.target.value)}
                  placeholder="https://facebook.com/yourname"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="line">
                  <span className="sns-icon">💬</span>
                  LINE
                </label>
                <input
                  id="line"
                  type="text"
                  value={formData.line}
                  onChange={(e) => handleInputChange('line', e.target.value)}
                  placeholder="LINE IDやURL"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="website">
                  <span className="sns-icon">🔗</span>
                  その他Webサイト
                </label>
                <input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://your-website.com"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* プレビュー */}
          <div className="edit-section">
            <h3>プレビュー</h3>
            <div className="profile-preview">
              <div className="preview-avatar">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="プロフィール" />
                ) : (
                  <div className="avatar-placeholder">
                    {formData.displayName.substring(0, 2).toUpperCase() || '👤'}
                  </div>
                )}
              </div>
              <div className="preview-info">
                <h4>{formData.displayName || '表示名未設定'}</h4>
                <p className="preview-email">{currentUser.email}</p>
                {formData.bio && <p className="preview-bio">{formData.bio}</p>}
                <div className="preview-sns">
                  {formData.twitter && formData.twitter.trim() && <span className="sns-badge twitter">🐦 Twitter</span>}
                  {formData.instagram && formData.instagram.trim() && <span className="sns-badge instagram">📸 Instagram</span>}
                  {formData.facebook && formData.facebook.trim() && <span className="sns-badge facebook">📘 Facebook</span>}
                  {formData.line && formData.line.trim() && <span className="sns-badge line">💬 LINE</span>}
                  {formData.website && formData.website.trim() && <span className="sns-badge website">🔗 Webサイト</span>}
                </div>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="edit-actions">
            <button className="cancel-btn" onClick={handleCancel}>
              キャンセル
            </button>
            <button 
              className="save-btn" 
              onClick={handleSave}
              disabled={saving || !formData.displayName.trim()}
            >
              {saving ? (
                <>
                  <span className="loading-spinner">⏳</span>
                  保存中...
                </>
              ) : (
                <>
                  <span role="img" aria-label="保存">💾</span>
                  保存する
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryProfileEdit; 