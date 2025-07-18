import React, { useEffect, useState } from 'react';
// Firebase
import { app } from './firebase';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { useCart } from './CartContext';

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
  // const [cartModalOpen, setCartModalOpen] = useState(false); // 削除

  // グローバルカートコンテキストを使用（将来の拡張用）
  // const { cart, addToCart, removeFromCart, updateQuantity } = useCart();

  // Firestoreからコラボ商品リンク取得
  useEffect(() => {
    async function fetchLinks() {
      setLoading(true);
      setError(null);
      try {
        const linksCol = collection(db, 'links');
        const snapshot = await getDocs(linksCol);
        const linksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LinkData));
        setLinks(linksList);
      } catch (e: any) {
        setError('リンクの取得に失敗しました');
        console.error('Error fetching links:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchLinks();
  }, []);

  // カート操作（未使用だが将来の拡張用）
  // const handleChangeQuantity = (managementNumber: string, diff: number) => {
  //   const currentItem = cart.find(item => item.managementNumber === managementNumber);
  //   if (currentItem) {
  //     const newQuantity = Math.max(1, currentItem.quantity + diff);
  //     updateQuantity(managementNumber, newQuantity);
  //   }
  // };
  // const handleRemove = (managementNumber: string) => {
  //   removeFromCart(managementNumber);
  // };
  // const handleAddToCart = (product: any) => {
  //   addToCart(product);
  // };
  // 決済ボタンはAllProducts等と同じく、HeaderのカートUIから行う想定

  // 画像パス正規化関数（未使用化）
  // const getImageSrc = (url?: string) => {
  //   if (!url) return '/Image/MC square Logo.png';
  //   if (url.startsWith('http://') || url.startsWith('https://')) return url;
  //   if (url.startsWith('/Image/')) return url;
  //   if (url.startsWith('Image/')) return '/' + url;
  //   return '/Image/MC square Logo.png';
  // };

  // カートモーダル（削除）
  // const CartModal = () => (
  //   <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setCartModalOpen(false)}>
  //     <div style={{ background: '#fff', borderRadius: 16, padding: '2em', minWidth: 320, maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', position: 'relative' }} onClick={e => e.stopPropagation()}>
  //       <h2 style={{ fontSize: '1.2em', color: 'var(--color-primary)', marginBottom: '1em' }}>カートの中身</h2>
  //       {cart.length === 0 ? (
  //         <div style={{ color: '#888', textAlign: 'center', margin: '2em 0' }}>カートに商品がありません</div>
  //       ) : (
  //         <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
  //           {cart.map(item => (
  //             <li key={item.managementNumber} style={{ display: 'flex', alignItems: 'center', gap: '1em', borderBottom: '1px solid #FFD4C4', padding: '0.7em 0' }}>
  //               <img src={item.imageUrl} alt={item.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #FFD4C4' }} />
  //               <div style={{ flex: 1 }}>
  //                 <div style={{ fontWeight: 700 }}>{item.name}</div>
  //                 <div style={{ color: '#636E72', fontSize: '0.95em' }}>{item.price} × {item.quantity}枚</div>
  //                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', marginTop: 4 }}>
  //                   <button onClick={() => handleChangeQuantity(item.managementNumber, -1)} style={{ background: '#f7f3ef', color: '#333', border: '1px solid #FFD4C4', borderRadius: '50%', width: 24, height: 24, fontWeight: 700, cursor: 'pointer' }}>-</button>
  //                   <span style={{ fontWeight: 600, minWidth: 32, textAlign: 'center' }}>{item.quantity}枚</span>
  //                   <button onClick={() => handleChangeQuantity(item.managementNumber, 1)} style={{ background: '#f7f3ef', color: '#333', border: '1px solid #FFD4C4', borderRadius: '50%', width: 24, height: 24, fontWeight: 700, cursor: 'pointer' }}>+</button>
  //                 </div>
  //               </div>
  //               <button onClick={() => handleRemove(item.managementNumber)} style={{ background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3em 0.6em', fontSize: '0.9em', cursor: 'pointer' }}>削除</button>
  //             </li>
  //           ))}
  //         </ul>
  //       )}
  //       <div style={{ marginTop: '1.5em', fontWeight: 700, fontSize: '1.1em', textAlign: 'right' }}>合計: {totalPrice.toLocaleString()}円</div>
  //       <button onClick={() => setCartModalOpen(false)} style={{ marginTop: '1em', background: '#ccc', color: '#333', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 700, fontSize: '1em', cursor: 'pointer', display: 'block', width: '100%' }}>閉じる</button>
  //     </div>
  //   </div>
  // );

  return (
    <div className="container">
      {/* {cartModalOpen && <CartModal />} 削除 */}
      <h1 style={{ color: 'var(--color-primary)', fontSize: '1.6rem', marginBottom: '0.5rem' }}>インフルエンサーコラボ商品</h1>
      {loading && <div>データを読み込み中...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', marginTop: '2rem' }}>
        {links.map(link => (
          <div key={link.id} className="inventory-card" style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 16px rgba(255, 159, 124, 0.10)', border: '1px solid #FFD4C4', width: 320, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* <img src={getImageSrc(link.imageUrl)} alt={link.title} style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 16, border: '1px solid #FFD4C4', marginBottom: '1rem', background: '#f8f8f8' }} /> */}
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
      {/* <button onClick={() => setCartModalOpen(true)} ...>🛒 カート ...</button> 削除 */}
    </div>
  );
};

export default InfluencerCollab; 