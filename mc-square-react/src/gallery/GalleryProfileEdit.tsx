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
  // SNS関連のフィールド
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
  // 自己紹介関連のフィールド
  hometown?: string;
  favoriteFood?: string;
  cookingStyle?: string;
  interests?: string[];
  personalStory?: string;
  achievements?: string[];
}

const GalleryProfileEdit: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    // SNS情報
    instagram: '',
    twitter: '',
    youtube: '',
    tiktok: '',
    website: '',
    // 自己紹介情報
    hometown: '',
    favoriteFood: '',
    cookingStyle: '',
    interests: ['料理', '写真'],
    personalStory: '',
    achievements: []
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
          setFormData({
            displayName: userData.displayName || user.displayName || '',
            bio: userData.bio || '',
            instagram: userData.instagram || '',
            twitter: userData.twitter || '',
            youtube: userData.youtube || '',
            tiktok: userData.tiktok || '',
            website: userData.website || '',
            hometown: userData.hometown || '',
            favoriteFood: userData.favoriteFood || '',
            cookingStyle: userData.cookingStyle || '',
            interests: userData.interests || ['料理', '写真'],
            personalStory: userData.personalStory || '',
            achievements: userData.achievements || []
          });
        } else {
          // 新規ユーザーの場合
          setFormData({
            displayName: user.displayName || '',
            bio: '',
            instagram: '',
            twitter: '',
            youtube: '',
            tiktok: '',
            website: '',
            hometown: '',
            favoriteFood: '',
            cookingStyle: '',
            interests: ['料理', '写真'],
            personalStory: '',
            achievements: []
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
      const snsData: any = {};
      if (formData.instagram && formData.instagram.trim()) {
        snsData.instagram = formData.instagram.trim();
      }
      if (formData.twitter && formData.twitter.trim()) {
        snsData.twitter = formData.twitter.trim();
      }
      if (formData.youtube && formData.youtube.trim()) {
        snsData.youtube = formData.youtube.trim();
      }
      if (formData.tiktok && formData.tiktok.trim()) {
        snsData.tiktok = formData.tiktok.trim();
      }
      if (formData.website && formData.website.trim()) {
        snsData.website = formData.website.trim();
      }

      // 自己紹介情報をフィルタリング
      const profileData: any = {};
      if (formData.hometown && formData.hometown.trim()) {
        profileData.hometown = formData.hometown.trim();
      }
      if (formData.favoriteFood && formData.favoriteFood.trim()) {
        profileData.favoriteFood = formData.favoriteFood.trim();
      }
      if (formData.cookingStyle && formData.cookingStyle.trim()) {
        profileData.cookingStyle = formData.cookingStyle.trim();
      }
      if (formData.personalStory && formData.personalStory.trim()) {
        profileData.personalStory = formData.personalStory.trim();
      }
      if (formData.interests && formData.interests.length > 0) {
        profileData.interests = formData.interests;
      }
      if (formData.achievements && formData.achievements.length > 0) {
        profileData.achievements = formData.achievements;
      }

      await setDoc(userDoc, {
        uid: currentUser.uid,
        displayName: formData.displayName,
        email: currentUser.email,
        bio: formData.bio || null,
        ...snsData,
        ...profileData,
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
            <h3>📱 SNS情報</h3>
            <p className="section-description">
              SNSやWebサイトのURLを入力すると、プロフィールページで表示されます。
            </p>

            <div className="sns-inputs">
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
                <label htmlFor="youtube">
                  <span className="sns-icon">📺</span>
                  YouTube
                </label>
                <input
                  id="youtube"
                  type="url"
                  value={formData.youtube}
                  onChange={(e) => handleInputChange('youtube', e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tiktok">
                  <span className="sns-icon">🎵</span>
                  TikTok
                </label>
                <input
                  id="tiktok"
                  type="url"
                  value={formData.tiktok}
                  onChange={(e) => handleInputChange('tiktok', e.target.value)}
                  placeholder="https://tiktok.com/@yourname"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="website">
                  <span className="sns-icon">🌐</span>
                  公式サイト・ブログ
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

          {/* 自己紹介情報 */}
          <div className="edit-section">
            <h3>👤 自己紹介詳細</h3>
            <p className="section-description">
              より親近感が湧くプロフィールにするための情報を入力してください。
            </p>

            <div className="profile-inputs">
              <div className="form-group">
                <label htmlFor="hometown">
                  <span className="profile-icon">🏠</span>
                  出身地
                </label>
                <input
                  id="hometown"
                  type="text"
                  value={formData.hometown}
                  onChange={(e) => handleInputChange('hometown', e.target.value)}
                  placeholder="例: 東京都"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="favoriteFood">
                  <span className="profile-icon">🍽️</span>
                  好きな料理
                </label>
                <input
                  id="favoriteFood"
                  type="text"
                  value={formData.favoriteFood}
                  onChange={(e) => handleInputChange('favoriteFood', e.target.value)}
                  placeholder="例: カレーライス"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="cookingStyle">
                  <span className="profile-icon">👨‍🍳</span>
                  料理スタイル
                </label>
                <input
                  id="cookingStyle"
                  type="text"
                  value={formData.cookingStyle}
                  onChange={(e) => handleInputChange('cookingStyle', e.target.value)}
                  placeholder="例: 和食中心、簡単レシピ"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="personalStory">
                  <span className="profile-icon">📖</span>
                  私の物語
                </label>
                <textarea
                  id="personalStory"
                  value={formData.personalStory}
                  onChange={(e) => handleInputChange('personalStory', e.target.value)}
                  placeholder="料理を始めたきっかけや、大切にしていることなどを書いてください"
                  className="form-textarea"
                  rows={4}
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
                  {formData.instagram && formData.instagram.trim() && <span className="sns-badge instagram">📸 Instagram</span>}
                  {formData.twitter && formData.twitter.trim() && <span className="sns-badge twitter">🐦 Twitter</span>}
                  {formData.youtube && formData.youtube.trim() && <span className="sns-badge youtube">📺 YouTube</span>}
                  {formData.tiktok && formData.tiktok.trim() && <span className="sns-badge tiktok">🎵 TikTok</span>}
                  {formData.website && formData.website.trim() && <span className="sns-badge website">🌐 公式サイト</span>}
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