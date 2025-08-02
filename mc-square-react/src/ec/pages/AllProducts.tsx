import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';

// 商品型定義
interface Product {
  managementNumber: string;
  name: string;
  price: string;
  imageUrl?: string;
  status?: string;
}

const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbygEEOmylE1fzaMtpxAReEQfY02zIcUVKwVPaV4R5H5AKWnQtgnUbYOKfq3y4mYJPdzYg/exec';

const AllProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  
  // グローバルカートコンテキストを使用
  const { cart, addToCart, removeFromCart, updateQuantity, updateKitPrice } = useCart();

  // 商品名リスト（重複なし）
  const productNames = Array.from(new Set(products.map(p => p.name).filter(Boolean)));

  // フィルタ適用
  const filteredProducts = filterName ? products.filter(p => p.name === filterName) : products;

  // 表示する商品リスト
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(GAS_WEB_APP_URL, { method: 'GET', mode: 'cors', headers: { 'Accept': 'application/json' } });
        if (!response.ok) throw new Error(`データの取得に失敗しました (${response.status})`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('データの形式が不正です');
        setProducts(data.filter((item: any) => item.status === '公開中'));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // カートに商品を追加
  const handleAddToCart = (product: Product) => {
    // 生地商品として追加（50cm商品は自動的に生地として認識される）
    const productWithType = {
      ...product,
      productType: 'fabric' as const,
      quantity: 1
    };
    addToCart(productWithType);
    
    // 生地を追加した後にカート内のキットの無料状況を更新
    setTimeout(() => {
      updateKitPricesBasedOnFabricCount();
    }, 100);
  };

  // 生地購入数に基づいてカート内のキット価格を更新
  const updateKitPricesBasedOnFabricCount = () => {
    const fabricCount = cart.reduce((sum, item) => {
      if (item.productType === 'fabric' || item.name.includes('COTTON')) {
        return sum + item.quantity;
      }
      return sum;
    }, 0);

    // 無料キット数を計算
    const getFreeKitCount = () => {
      if (fabricCount >= 1 && fabricCount <= 5) {
        return 1;
      } else if (fabricCount >= 6 && fabricCount <= 10) {
        return 2;
      } else if (fabricCount >= 11) {
        const additionalKits = Math.floor((fabricCount - 10) / 3);
        return 2 + additionalKits;
      }
      return 0;
    };

    const freeKitCount = getFreeKitCount();
    const cartKits = cart.filter(item => item.productType === 'kit');
    
    cartKits.forEach((kitItem, index) => {
      const isFree = index < freeKitCount;
      const baseName = kitItem.name.replace(' (無料)', '');
      const newName = isFree ? `${baseName} (無料)` : baseName;
      const newPrice = isFree ? '0' : kitItem.price.replace('0', ''); // 元の価格を復元
      
      if (kitItem.name !== newName || kitItem.price !== newPrice) {
        updateKitPrice(kitItem.managementNumber, newName, newPrice);
      }
    });
  };

  // 数量変更
  const handleChangeQuantity = (managementNumber: string, diff: number) => {
    const currentItem = cart.find(item => item.managementNumber === managementNumber);
    if (currentItem) {
      const newQuantity = Math.max(1, currentItem.quantity + diff);
      updateQuantity(managementNumber, newQuantity);
    }
  };

  // 削除
  const handleRemove = (managementNumber: string) => {
    removeFromCart(managementNumber);
  };
  // 送料計算
  const calcShipping = (subtotal: number) => {
    if (subtotal < 4400) return 400;
    if (subtotal < 24200) return 900;
    return 0;
  };
  const subtotal = cart.reduce((sum, item) => {
    const priceNum = Number(String(item.price).replace(/[^\d.]/g, ''));
    return sum + priceNum * item.quantity;
  }, 0);
  const shipping = calcShipping(subtotal);
  const totalWithShipping = subtotal + shipping;
  // 決済（Stripe連携）
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      // Stripe line_items形式に変換
      const line_items = cart.map(item => {
        const priceNum = Number(String(item.price).replace(/[^\d.]/g, ''));
        return {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: item.name,
              metadata: {
                managementNumber: item.managementNumber
              },
              images: item.imageUrl ? [getImageSrc(item.imageUrl)] : undefined
            },
            unit_amount: priceNum,
          },
          quantity: item.quantity,
        };
      });
      // 送料をStripe line_itemsに追加
      if (shipping > 0) {
        line_items.push({
          price_data: {
            currency: 'jpy',
            product_data: {
              name: '送料',
              metadata: { managementNumber: 'shipping' },
              images: undefined
            },
            unit_amount: shipping,
          },
          quantity: 1
        });
      }

      // 環境に応じてAPIエンドポイントを切り替え
      const apiBaseUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '/.netlify/functions');
      const apiEndpoint = `${apiBaseUrl}/create-checkout-session`;

      console.log(`🌍 環境: ${process.env.NODE_ENV === 'development' ? '開発' : '本番'}`);
      console.log(`🔗 API: ${apiEndpoint}`);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_items,
          mode: 'payment',
          success_url: window.location.origin + '/success',
          cancel_url: window.location.origin + '/all-products',
          metadata: { from: 'react-cart' }
        })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Stripe決済ページの生成に失敗しました');
        console.error('Stripe error:', data);
      }
    } catch (e) {
      alert('決済処理でエラーが発生しました');
      console.error('Checkout error:', e);
    }
  };

  // カート内合計個数と合計金額はCartContextから取得済み

  // 画像パス正規化
  const getImageSrc = (url?: string) => {
    if (!url) return '/Image/MC square Logo.png';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/Image/')) return url;
    if (url.startsWith('Image/')) return '/' + url;
    return '/Image/MC square Logo.png';
  };

  // カートモーダルUI
  const CartModal = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setCartModalOpen(false)}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '2em', minWidth: 320, maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.2em', color: 'var(--color-primary)', marginBottom: '1em' }}>カートの中身</h2>
        {cart.length === 0 ? (
          <div style={{ color: '#888', textAlign: 'center', margin: '2em 0' }}>カートに商品がありません</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {cart.map(item => (
              <li key={item.managementNumber} style={{ marginBottom: '1em', borderBottom: '1px solid #eee', paddingBottom: '0.7em', display: 'flex', alignItems: 'center', gap: '0.8em' }}>
                <img src={getImageSrc(item.imageUrl)} alt={item.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee', background: '#fafafa' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  <div style={{ fontSize: '0.95em', color: '#636E72' }}>管理番号: {item.managementNumber}</div>
                  <div style={{ fontSize: '1em', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                    {item.productType === 'kit' ? (
                      // キットの場合は数量変更を無効化
                      <span style={{ 
                        fontSize: '0.9em', 
                        color: '#6c757d',
                        fontStyle: 'italic'
                      }}>
                        1個のみ
                      </span>
                    ) : (
                      // 布などの他の商品は従来通り数量変更可能
                      <>
                        <button onClick={() => handleChangeQuantity(item.managementNumber, -1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #ccc', background: '#fafafa', color: '#333', fontWeight: 700, fontSize: '1em', cursor: 'pointer' }}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => handleChangeQuantity(item.managementNumber, 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #ccc', background: '#fafafa', color: '#333', fontWeight: 700, fontSize: '1em', cursor: 'pointer' }}>＋</button>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: '0.98em', color: '#888' }}>単価: {Number(String(item.price).replace(/[^\d.]/g, '')).toLocaleString()}円</div>
                </div>
                <button onClick={() => handleRemove(item.managementNumber)} style={{ background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4em 0.8em', fontWeight: 700, fontSize: '0.95em', cursor: 'pointer', marginLeft: 4 }}>削除</button>
              </li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: '1.5em', fontWeight: 700, fontSize: '1.1em', textAlign: 'right' }}>小計: {subtotal.toLocaleString()}円</div>
        <div style={{ fontWeight: 600, fontSize: '1em', color: '#636E72', textAlign: 'right' }}>送料: {shipping === 0 ? '無料' : shipping.toLocaleString() + '円'}</div>
        <div style={{ marginTop: '0.5em', fontWeight: 700, fontSize: '1.15em', color: 'var(--color-primary)', textAlign: 'right' }}>合計: {totalWithShipping.toLocaleString()}円</div>
        {cart.length > 0 && <button onClick={handleCheckout} style={{ marginTop: '1.5em', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.9em 1.5em', fontWeight: 700, fontSize: '1.08em', cursor: 'pointer', display: 'block', width: '100%' }}>決済へ進む</button>}
        <button onClick={() => setCartModalOpen(false)} style={{ marginTop: '1em', background: '#ccc', color: '#333', border: 'none', borderRadius: 8, padding: '0.7em 1.5em', fontWeight: 700, fontSize: '1em', cursor: 'pointer', display: 'block', width: '100%' }}>閉じる</button>
      </div>
    </div>
  );

  return (
    <div className="container">
      {cartModalOpen && <CartModal />}
      <h1 style={{ color: 'var(--color-primary)', fontSize: '1.6rem', marginBottom: '0.5rem' }}>エムシースクエア オンラインセレクション</h1>
      
      {/* 商品説明 */}
      <div style={{
        width: '100%',
        maxWidth: 900,
        margin: '0 auto 2rem auto',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: 16,
        padding: '1.5rem 2rem',
        border: '1px solid #dee2e6',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ color: 'var(--color-primary)', fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 600 }}>商品について</h3>
        <div style={{ fontSize: '1rem', lineHeight: '1.6', color: '#495057' }}>
          <p style={{ marginBottom: '0.8rem' }}>
            <strong>サイズ：</strong>すべての商品は50cm四方の単価で販売されています。
          </p>
          <p style={{ marginBottom: '0' }}>
            <strong>販売方法：</strong>同じ柄の商品を複数購入された場合、生地は切られずにまとまった状態でお届けいたします。
          </p>
        </div>
      </div>
      
      {/* 横長バナー（メルマガ誘導） */}
      <div style={{
        width: '100%',
        maxWidth: 900,
        margin: '0 auto 2rem auto',
        background: 'linear-gradient(90deg, #fff0e6 0%, #ffe5ec 100%)',
        borderRadius: 18,
        boxShadow: '0 2px 12px rgba(255,159,124,0.10)',
        padding: '1.2rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        fontWeight: 600,
        fontSize: '1.1em',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <img src="/Image/JP Cotton subscription.png" alt="メルマガ" style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 10, border: '1px solid #FFD4C4' }} />
        <div style={{ minWidth: 180 }}>
          <div style={{ color: '#E1306C', fontWeight: 700, fontSize: '1.15em' }}>毎月の生地の情報を受け取りたい方はこちら</div>
          <div style={{ color: '#636E72', fontSize: '0.98em', marginTop: 4 }}>新作生地やお得な情報をメールでお届けします。</div>
        </div>
        <a href="/mailmagazine" style={{
          marginLeft: 'auto',
          background: 'var(--color-primary)',
          color: '#fff',
          borderRadius: 8,
          padding: '0.7em 1.5em',
          fontWeight: 700,
          textDecoration: 'none',
          fontSize: '1em'
        }}>メルマガ登録</a>
      </div>
      {loading && <div>データを読み込み中...10秒程かかる場合があります。</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1em', marginBottom: '1.2em', justifyContent: 'flex-end' }}>
        <label htmlFor="filterByName" style={{ fontWeight: 600 }}>商品名で絞り込み:</label>
        <select id="filterByName" value={filterName} onChange={e => setFilterName(e.target.value)} style={{ padding: '0.4em 1em', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '1em' }}>
          <option value="">全商品</option>
          {productNames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>
      <div className="inventory-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', marginTop: '2rem' }}>
        {visibleProducts.map(product => {
          // 値段の整形
          let priceText = '';
          if (product.price) {
            const priceNum = Number(String(product.price).replace(/[^\d.]/g, ''));
            priceText = priceNum.toLocaleString() + '円（税込）';
          }
          return (
            <div key={product.managementNumber} className="inventory-card" style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 16px rgba(255, 159, 124, 0.10)', border: '1px solid #FFD4C4', width: 320, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img src={getImageSrc(product.imageUrl)} alt={product.managementNumber} style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 16, border: '1px solid #FFD4C4', marginBottom: '1rem', background: '#f8f8f8' }} />
              <div className="product-name" style={{ fontWeight: 700, fontSize: '1.1em', marginBottom: '0.3em' }}>{product.name}</div>
              <div className="managementNumber" style={{ color: '#636E72', fontSize: '0.95em', marginBottom: '0.5em' }}>管理番号: {product.managementNumber}</div>
              <div className="price" style={{ color: 'var(--color-primary)', fontSize: '1.25em', fontWeight: 700, marginBottom: '0.7em' }}>{priceText}</div>
              <button style={{marginTop: '1em', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 12, padding: '0.7em 1.5em', fontWeight: 700, fontSize: '1.05em', cursor: 'pointer', boxShadow: '0 2px 8px rgba(255, 159, 124, 0.10)'}} onClick={() => handleAddToCart(product)}>生地を購入する</button>
            </div>
          );
        })}
      </div>
      {visibleCount < filteredProducts.length && (
        <div style={{ textAlign: 'center', margin: '2em 0' }}>
          <button
            onClick={() => setVisibleCount(c => c + 6)}
            style={{ padding: '0.9em 2.5em', borderRadius: 12, background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '1.08em', cursor: 'pointer', boxShadow: '0 2px 8px rgba(255, 159, 124, 0.10)' }}
          >もっと見る</button>
        </div>
      )}
    </div>
  );
};

export default AllProducts;