import React, { useEffect, useState } from 'react';
import { useCart } from './CartContext';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app } from './firebase';

const db = getFirestore(app);
const auth = getAuth(app);

const Success: React.FC = () => {
  const { clearCart } = useCart();
  // 購入商品・合計金額をlocalStorageから取得
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);

  useEffect(() => {
    // 1. localStorageから明細を取得
    try {
      const itemsStr = localStorage.getItem('mcSquareLastOrderItems');
      if (itemsStr) setOrderItems(JSON.parse(itemsStr));
      const paidAmountStr = localStorage.getItem('mcSquareLastPaidAmount');
      if (paidAmountStr) setPaidAmount(parseInt(paidAmountStr, 10));
      const shippingStr = localStorage.getItem('mcSquareLastShipping');
      if (shippingStr) setShipping(parseInt(shippingStr, 10));
    } catch {}

    // すでに処理済みなら何もしない
    if (localStorage.getItem('mcSquareOrderProcessed') === '1') return;

    let processed = false;
    const process = (user: any) => {
      if (!processed && user) {
        // saveOrder関数は後で定義される
        processed = true;
        localStorage.setItem('mcSquareOrderProcessed', '1');
      }
    };
    const unsubscribe = onAuthStateChanged(auth, user => {
      process(user);
      if (user) unsubscribe();
    });
    if (auth.currentUser) {
      process(auth.currentUser);
      unsubscribe();
    }
    return () => unsubscribe();
  }, []);

  // saveOrderを外に出す
  const saveOrder = async (user: any) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      
      // 購入履歴追加
      if (orderItems.length > 0) {
        const prevOrders = userSnap.data().orders || [];
        const now = new Date();
        const orderRecord = {
          date: now.toISOString(),
          items: orderItems,
          total: paidAmount,
          shipping: shipping
        };
        await updateDoc(userRef, { orders: [...prevOrders, orderRecord] });
        console.log('購入履歴追加:', orderRecord);
      }
      
      // 処理後はlocalStorageをクリア
      localStorage.removeItem('mcSquareLastPaidAmount');
      localStorage.removeItem('mcSquareLastOrderItems');
      localStorage.removeItem('mcSquareLastShipping');
    } catch (e) {
      console.error('購入履歴追加エラー:', e);
    }
  };

  // 必要な情報が全て揃ったら履歴保存
  useEffect(() => {
    // 処理フラグをリセット（決済ごとに必ずリセット）
    localStorage.removeItem('mcSquareOrderProcessed');
    let processed = false;
    const process = (user: any) => {
      if (!processed && user) {
        saveOrder(user);
        processed = true;
      }
    };
    const unsubscribe = onAuthStateChanged(auth, user => {
      process(user);
      if (user) unsubscribe();
    });
    // すでにログイン済みなら即実行
    if (auth.currentUser) {
      process(auth.currentUser);
      unsubscribe();
    }
    // クリーンアップ
    return () => unsubscribe();
  }, [clearCart, orderItems, paidAmount, shipping, saveOrder]);

  // 小計計算
  const subtotal = orderItems.reduce((sum, item) => {
    const priceNum = Number(String(item.price).replace(/[^\d.]/g, ''));
    return sum + priceNum * item.quantity;
  }, 0);

  // 画像パス正規化
  const getImageSrc = (url?: string) => {
    if (!url) return '/Image/MC square Logo.png';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/Image/')) return url;
    if (url.startsWith('Image/')) return '/' + url;
    return '/Image/MC square Logo.png';
  };

  return (
    <div style={{ padding: '3em 1em', textAlign: 'center' }}>
      <h1 style={{ color: '#E1306C', marginBottom: '1em' }}>ご購入ありがとうございました！</h1>
      <p>ご注文が正常に完了しました。<br />ご登録のメールアドレスに確認メールをお送りしています。</p>
      
      {/* 購入商品リスト表示 */}
      {orderItems.length > 0 && (
        <div style={{ margin: '2em auto', maxWidth: 600, background: '#fff', borderRadius: 16, boxShadow: '0 4px 16px rgba(255,159,124,0.10)', padding: '2em' }}>
          <h3 style={{ color: '#E1306C', marginBottom: 16, fontSize: '1.15em' }}>ご購入商品</h3>
          
          {/* 商品リスト */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '1.5em' }}>
            {orderItems.map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
                <img src={getImageSrc(item.imageUrl)} alt={item.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee', background: '#fafafa' }} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  <div style={{ color: '#636E72', fontSize: '0.97em' }}>数量: {item.quantity}　単価: {Number(item.price).toLocaleString()}円</div>
                </div>
              </li>
            ))}
          </ul>

          {/* 金額詳細 */}
          <div style={{ borderTop: '2px solid #eee', paddingTop: '1em' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5em', fontSize: '1em' }}>
              <span>小計:</span>
              <span>{subtotal.toLocaleString()}円</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5em', fontSize: '1em' }}>
              <span>送料:</span>
              <span>{shipping === 0 ? '無料' : shipping.toLocaleString() + '円'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1em', fontWeight: 700, fontSize: '1.15em', color: '#E1306C', borderTop: '1px solid #eee', paddingTop: '0.5em' }}>
              <span>お支払い合計:</span>
              <span>{paidAmount.toLocaleString()}円</span>
            </div>
          </div>
        </div>
      )}
      
      <a href="/all-products" style={{ display: 'inline-block', marginTop: '2em', color: '#fff', background: '#E1306C', padding: '0.8em 2em', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>商品一覧へ戻る</a>
    </div>
  );
};

export default Success; 