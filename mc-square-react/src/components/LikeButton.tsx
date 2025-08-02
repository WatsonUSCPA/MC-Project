import React, { useState, useEffect } from 'react';
import { getAuth, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { app } from '../firebase';
import './LikeButton.css';

interface LikeButtonProps {
  recipeId: string;
  initialLikes?: number;
  onLikeChange?: (newCount: number) => void;
}

const LikeButton: React.FC<LikeButtonProps> = ({ recipeId, initialLikes = 0, onLikeChange }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [isAnimating, setIsAnimating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !loading) {
      checkLikeStatus();
    }
  }, [user, loading, recipeId]);

  const checkLikeStatus = async () => {
    if (!user) return;

    try {
      const db = getFirestore(app);
      const likeDoc = doc(db, 'likes', `${recipeId}_${user.uid}`);
      const likeDocSnap = await getDoc(likeDoc);
      
      setIsLiked(likeDocSnap.exists());
    } catch (error) {
      console.error('いいね状態の確認に失敗しました:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('いいねするにはログインが必要です');
      return;
    }

    if (isAnimating) return;

    setIsAnimating(true);
    
    try {
      const db = getFirestore(app);
      const likeDoc = doc(db, 'likes', `${recipeId}_${user.uid}`);
      const recipeDoc = doc(db, 'recipes', recipeId);

      if (isLiked) {
        // いいねを削除
        await deleteDoc(likeDoc);
        await updateDoc(recipeDoc, {
          likes: increment(-1)
        });
        setLikeCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        // いいねを追加
        await setDoc(likeDoc, {
          recipeId,
          userId: user.uid,
          userName: user.displayName || user.email,
          createdAt: new Date()
        });
        await updateDoc(recipeDoc, {
          likes: increment(1)
        });
        setLikeCount(prev => prev + 1);
        setIsLiked(true);
      }

      onLikeChange?.(likeCount + (isLiked ? -1 : 1));
    } catch (error) {
      console.error('いいねの処理に失敗しました:', error);
      alert('いいねの処理に失敗しました');
    } finally {
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  if (loading) {
    return <div className="like-button-loading">読み込み中...</div>;
  }

  return (
    <div className="like-button-container">
      <button
        className={`like-button ${isLiked ? 'liked' : ''} ${isAnimating ? 'animating' : ''}`}
        onClick={handleLike}
        disabled={isAnimating}
        title={isLiked ? 'いいねを取り消す' : 'いいねする'}
      >
        <svg 
          className="heart-icon" 
          viewBox="0 0 24 24" 
          fill={isLiked ? "currentColor" : "none"}
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
          />
        </svg>
        <span className="like-count">{likeCount}</span>
      </button>
    </div>
  );
};

export default LikeButton; 