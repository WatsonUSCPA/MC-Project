import React, { useState, useEffect } from 'react';
import { getAuth, User } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { app } from '../firebase';
import './CommentSection.css';

interface Comment {
  id: string;
  text: string;
  userName: string;
  userId: string;
  createdAt: any;
  userPhotoURL?: string;
}

interface CommentSectionProps {
  recipeId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ recipeId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!recipeId) return;

    const db = getFirestore(app);
    const commentsQuery = query(
      collection(db, 'comments'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData: Comment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.recipeId === recipeId) {
          commentsData.push({
            id: doc.id,
            text: data.text,
            userName: data.userName,
            userId: data.userId,
            createdAt: data.createdAt,
            userPhotoURL: data.userPhotoURL
          });
        }
      });
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [recipeId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('コメントを投稿するにはログインが必要です');
      return;
    }

    if (!newComment.trim()) {
      alert('コメントを入力してください');
      return;
    }

    if (newComment.length > 500) {
      alert('コメントは500文字以内で入力してください');
      return;
    }

    setSubmitting(true);

    try {
      const db = getFirestore(app);
      await addDoc(collection(db, 'comments'), {
        recipeId,
        text: newComment.trim(),
        userId: user.uid,
        userName: user.displayName || user.email || '匿名ユーザー',
        userPhotoURL: user.photoURL,
        createdAt: serverTimestamp()
      });

      setNewComment('');
    } catch (error) {
      console.error('コメントの投稿に失敗しました:', error);
      alert('コメントの投稿に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    if (!window.confirm('このつくれぽを削除しますか？')) return;

    try {
      const db = getFirestore(app);
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (error) {
      console.error('コメントの削除に失敗しました:', error);
      alert('コメントの削除に失敗しました');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '今';
    if (diffInMinutes < 60) return `${diffInMinutes}分前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}時間前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}日前`;
    
    return date.toLocaleDateString('ja-JP');
  };

  if (loading) {
    return <div className="comment-section-loading">読み込み中...</div>;
  }

  return (
    <div className="comment-section">
      <h3 className="comment-section-title">
        つくれぽ ({comments.length})
      </h3>
      
      {/* コメント投稿フォーム */}
      {user && (
        <form onSubmit={handleSubmitComment} className="comment-form">
          <div className="comment-input-container">
                    <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="つくれぽを投稿してください..."
          className="comment-input"
          rows={3}
          maxLength={500}
          disabled={submitting}
        />
            <div className="comment-input-footer">
              <span className="comment-char-count">
                {newComment.length}/500
              </span>
              <button
                type="submit"
                className="comment-submit-btn"
                disabled={!newComment.trim() || submitting}
              >
                {submitting ? '投稿中...' : '投稿'}
              </button>
            </div>
          </div>
        </form>
      )}

      {!user && (
        <div className="login-prompt">
          <p>つくれぽを投稿するにはログインが必要です</p>
        </div>
      )}

      {/* コメント一覧 */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">
            <p>まだつくれぽがありません。最初のつくれぽを投稿してみませんか？</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-user-info">
                  {comment.userPhotoURL ? (
                    <img
                      src={comment.userPhotoURL}
                      alt={comment.userName}
                      className="comment-user-avatar"
                    />
                  ) : (
                    <div className="comment-user-avatar-placeholder">
                      {comment.userName.charAt(0)}
                    </div>
                  )}
                  <div className="comment-user-details">
                    <span className="comment-user-name">{comment.userName}</span>
                    <span className="comment-date">{formatDate(comment.createdAt)}</span>
                  </div>
                </div>
                {user && user.uid === comment.userId && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="comment-delete-btn"
                    title="つくれぽを削除"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="comment-text">
                {comment.text}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection; 