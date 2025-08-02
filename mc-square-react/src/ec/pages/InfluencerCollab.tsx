import React, { useEffect, useState } from 'react';
// Firebase
import { app } from '../../firebase';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const db = getFirestore(app);

interface LinkData {
  id: string;
  title: string;
  price?: string;
  applyUrl?: string;
  influencerUrl?: string;
  imageUrl?: string;
}

const InfluencerCollab: React.FC = () => {
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firestoreからコラボ商品リンク取得
  useEffect(() => {
    async function fetchLinks() {
      setLoading(true);
      setError(null);
      try {
        console.log('Firebase接続を試行中...');
        const linksCol = collection(db, 'links');
        const snapshot = await getDocs(linksCol);
        const linksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LinkData));
        console.log('取得したリンク数:', linksList.length);
        setLinks(linksList);
      } catch (e: any) {
        console.error('Firebase接続エラー:', e);
        if (e.code === 'permission-denied') {
          setError('Firebaseの権限設定を確認してください');
        } else if (e.code === 'unavailable') {
          setError('Firebaseサービスが利用できません。しばらく待ってから再試行してください');
        } else {
          setError(`リンクの取得に失敗しました: ${e.message || '不明なエラー'}`);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchLinks();
  }, []);

  // 画像パス正規化関数
  const getImageSrc = (url?: string) => {
    if (!url) return '/Image/MC square Logo.png';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/Image/')) return url;
    if (url.startsWith('Image/')) return '/' + url;
    return '/Image/MC square Logo.png';
  };

  return (
    <div className="container">
      <h1 style={{ color: 'var(--color-primary)', fontSize: '1.6rem', marginBottom: '0.5rem' }}>インフルエンサーコラボ商品</h1>
      <div style={{ 
        background: '#FFF5F0', 
        border: '1px solid #FF6B6B', 
        borderRadius: '8px', 
        padding: '1rem', 
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem'
      }}>
        <div style={{ 
          color: '#FF6B6B', 
          fontSize: '1.2rem', 
          fontWeight: 'bold',
          marginTop: '2px'
        }}>⚠️</div>
        <div>
          <div style={{ 
            color: '#FF6B6B', 
            fontSize: '0.9rem', 
            fontWeight: 'bold', 
            marginBottom: '0.3rem' 
          }}>ご注意</div>
          <div style={{ 
            color: '#333', 
            fontSize: '0.9rem', 
            lineHeight: '1.4' 
          }}>
            インフルエンサーコラボ商品は外部サイト（BASE）でのご購入となります。<br />
            下記の「申し込みページへ」ボタンから外部サイトに移動してご購入ください。
          </div>
        </div>
      </div>
      {loading && <div>データを読み込み中...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', marginTop: '2rem' }}>
        {links.map(link => (
          <div key={link.id} className="inventory-card" style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 16px rgba(255, 159, 124, 0.10)', border: '1px solid #FFD4C4', width: 320, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {link.imageUrl && link.imageUrl.trim() !== '' ? (
              <img src={getImageSrc(link.imageUrl)} alt={link.title} style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 16, border: '1px solid #FFD4C4', marginBottom: '1rem', background: '#f8f8f8' }} />
            ) : (
              <div style={{ width: 160, height: 160, borderRadius: 16, border: '1px solid #FFD4C4', marginBottom: '1rem', background: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '0.9em' }}>
                画像なし
              </div>
            )}
            <div className="product-name" style={{ fontWeight: 700, fontSize: '1.1em', marginBottom: '0.3em' }}>{link.title}</div>
            <div className="price" style={{ color: 'var(--color-primary)', fontSize: '1.25em', fontWeight: 700, marginBottom: '0.7em' }}>{link.price || ''}</div>
            {link.applyUrl && (
              <a href={link.applyUrl} target="_blank" rel="noopener noreferrer" style={{ background: 'var(--color-primary)', color: '#fff', textDecoration: 'none', padding: '0.7em 1.5em', borderRadius: 12, fontWeight: 700, fontSize: '1.05em', marginTop: '1em', display: 'inline-block', boxShadow: '0 2px 8px rgba(255, 159, 124, 0.10)', marginRight: link.influencerUrl ? '0.7em' : 0 }}>申し込みページへ</a>
            )}
            {link.influencerUrl && (
              <a href={link.influencerUrl} target="_blank" rel="noopener noreferrer" style={{ background: '#fff', color: 'var(--color-primary)', border: '2px solid var(--color-primary)', fontWeight: 700, padding: '0.7em 1.5em', borderRadius: 12, fontSize: '1.05em', marginTop: '1em', display: 'inline-block', boxShadow: '0 2px 8px rgba(255, 159, 124, 0.10)', textDecoration: 'none' }}>インフルエンサーを見る</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfluencerCollab; 