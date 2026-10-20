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

  // BASE「インフルエンサーコラボ」カテゴリの販売中商品を取得（SOLD OUT は関数側で除外）
  // 取得に失敗したときは従来の Firestore links を表示する
  useEffect(() => {
    async function fetchFromBase(): Promise<LinkData[]> {
      const res = await fetch('/api/base-collab');
      if (!res.ok) throw new Error(`base-collab ${res.status}`);
      const body = await res.json();
      return (body.items || []).map((i: any) => ({
        id: i.url,
        title: i.title,
        price: typeof i.price === 'number' ? `¥${i.price.toLocaleString('ja-JP')}（税込）` : '',
        applyUrl: i.url,
        imageUrl: i.imageUrl,
      }));
    }
    async function fetchFromFirestore(): Promise<LinkData[]> {
      const snapshot = await getDocs(collection(db, 'links'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LinkData));
    }
    async function fetchLinks() {
      setLoading(true);
      setError(null);
      try {
        try {
          setLinks(await fetchFromBase());
        } catch (baseErr) {
          console.warn('BASE取得に失敗、Firestoreにフォールバック:', baseErr);
          setLinks(await fetchFromFirestore());
        }
      } catch (e: any) {
        console.error('コラボ商品取得エラー:', e);
        setError('商品の取得に失敗しました。しばらく待ってから再度お試しください');
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