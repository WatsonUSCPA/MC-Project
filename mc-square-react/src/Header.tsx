import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from './CartContext';

const navItems = [
  { to: '/all-products', icon: '🧵', label: '生地' },
  { to: '/kits', icon: '🧩', label: 'キット' },
  { to: '/influencer_subscription', icon: '🌟', label: 'コラボ' },
  { to: '/subscription', icon: '📦', label: 'サブスク' },
  { to: '/patchwork_kit_website', icon: '✨', label: 'よりそいクラフト' },
];

const getImageSrc = (url?: string) => {
  if (!url) return '/Image/MC square Logo.png';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/Image/')) return url;
  if (url.startsWith('Image/')) return '/' + url;
  return '/Image/MC square Logo.png';
};

// モバイル判定
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
};

const Header: React.FC = () => {
  const location = useLocation();
  const { cart, cartCount, totalPrice, updateQuantity, removeFromCart } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

  // カート詳細の外側クリックで閉じる（PCのみ）
  useEffect(() => {
    if (!cartOpen || isMobile) return;
    const handleClick = (e: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) {
        setCartOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [cartOpen, isMobile]);

  // Stripe Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      // Stripe line_itemsを商品と送料で構成
      const line_items = [];
      
      // 商品合計
      if (subtotal > 0) {
        line_items.push({
          price_data: {
            currency: 'jpy',
            product_data: {
              name: '商品合計',
              metadata: { managementNumber: 'total' },
              images: undefined
            },
            unit_amount: subtotal,
          },
          quantity: 1
        });
      }
      
      // 送料
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

      const apiBaseUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '/.netlify/functions');
      const apiEndpoint = `${apiBaseUrl}/create-checkout-session`;
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_items,
          mode: 'payment',
          success_url: window.location.origin + '/success',
          cancel_url: window.location.origin + location.pathname,
          metadata: { from: 'header-cart' }
        })
      });
      const data = await response.json();
      if (data.url) {
        // 決済金額をlocalStorageに保存
        localStorage.setItem('mcSquareLastPaidAmount', String(totalWithShipping));
        // カート内容も保存（購入履歴用）
        localStorage.setItem('mcSquareLastOrderItems', JSON.stringify(cart));
        // 送料も保存
        localStorage.setItem('mcSquareLastShipping', String(shipping));
        window.open(data.url, '_blank'); // 新しいタブでStripe Checkoutを開く
      } else {
        alert('Stripe決済ページの生成に失敗しました');
        console.error('Stripe error:', data);
      }
    } catch (e) {
      alert('決済処理でエラーが発生しました');
      console.error('Checkout error:', e);
    } finally {
      setLoading(false);
    }
  };

  // 小計（商品合計）
  const subtotal = cart.reduce((sum, item) => {
    const priceNum = Number(String(item.price).replace(/[^\d.]/g, ''));
    return sum + priceNum * item.quantity;
  }, 0);
  
  // 送料計算
  const calcShipping = (subtotal: number) => {
    if (subtotal < 4400) return 400;
    if (subtotal < 24200) return 900;
    return 0;
  };
  const shipping = calcShipping(subtotal);
  const totalWithShipping = subtotal + shipping;

  // レスポンシブ用のstyleをheadに追加
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media (max-width: 600px) {
        .header-nav-list {
          gap: 1.1em !important;
          font-size: 0.92em !important;
        }
        .header-nav-link-icon {
          font-size: 1.08em !important;
        }
        .header-nav-link-label {
          font-size: 0.90em !important;
        }
        .header-main-row {
          padding: 0.4em 0.5em !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // カート詳細のUI
  const CartDetail = (
    <div
      ref={cartRef}
      style={isMobile ? {
        position: 'fixed', bottom: 0, zIndex: 5000,
        background: '#fff', borderTop: '2px solid #FFD4C4', borderRadius: '18px 18px 0 0',
        boxShadow: '0 -8px 32px rgba(255,159,124,0.18)',
        padding: '2em 1em 1.5em 1em', minWidth: 0, maxWidth: '100vw', width: '100vw',
        maxHeight: '70vh', overflowY: 'auto',
        left: 0, right: 0, margin: 0,
        animation: 'slideUpCart 0.25s',
      } : {
        position: 'absolute', top: 56, right: 0, background: '#fff', border: '2px solid #FFD4C4', borderRadius: 18, boxShadow: '0 8px 32px rgba(255,159,124,0.18)', padding: '2em 2em 1.5em 2em', zIndex: 4100, minWidth: 370, maxWidth: 440
      }}
    >
      {isMobile && (
        <button onClick={() => setCartOpen(false)} style={{ position: 'absolute', top: 10, right: 16, background: 'none', border: 'none', fontSize: 28, color: '#E1306C', fontWeight: 700, cursor: 'pointer', zIndex: 10 }} aria-label="閉じる">×</button>
      )}
      <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: 12, fontSize: '1.18em', letterSpacing: '0.01em', textAlign: isMobile ? 'center' : undefined }}>🛒 カート</div>
      <div style={{ marginBottom: 10, fontSize: '1.05em', textAlign: isMobile ? 'center' : undefined }}>商品数: <b>{cartCount}</b></div>
      <div style={{ marginBottom: 18, fontWeight: 600, color: '#E1306C', textAlign: isMobile ? 'center' : undefined }}>合計: <b>{totalPrice.toLocaleString()}円</b></div>
      {cart.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center', padding: '1.5em 0' }}>カートに商品がありません</div>
      ) : (
        <>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: isMobile ? '38vh' : 320, overflowY: 'auto' }}>
            {cart.map(item => {
              const priceNum = Number(String(item.price).replace(/[^\d.]/g, ''));
              const itemSubtotal = priceNum * item.quantity;
              return (
                <li key={item.managementNumber} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.7em' : '1em', borderBottom: '1px solid #FFD4C4', padding: isMobile ? '0.7em 0' : '1em 0' }}>
                  <img src={getImageSrc(item.imageUrl)} alt={item.name} style={{ width: isMobile ? 44 : 60, height: isMobile ? 44 : 60, objectFit: 'cover', borderRadius: 10, border: '1px solid #FFD4C4', background: '#fafafa' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: isMobile ? '1em' : '1.08em', marginBottom: 2 }}>{item.name}</div>
                    <div style={{ color: '#636E72', fontSize: isMobile ? '0.95em' : '0.98em', marginBottom: 4 }}>単価: {priceNum.toLocaleString()}円</div>
                    <div style={{ color: '#E1306C', fontWeight: 600, fontSize: isMobile ? '0.98em' : '1em', marginBottom: 4 }}>小計: {itemSubtotal.toLocaleString()}円</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', marginTop: 4 }}>
                      <button onClick={() => updateQuantity(item.managementNumber, Math.max(1, item.quantity - 1))} style={{ background: '#f7f3ef', color: '#333', border: '1px solid #FFD4C4', borderRadius: '50%', width: isMobile ? 24 : 28, height: isMobile ? 24 : 28, fontWeight: 700, cursor: 'pointer', fontSize: isMobile ? '1em' : '1.1em', transition: 'background 0.2s' }}>-</button>
                      <span style={{ fontWeight: 600, minWidth: isMobile ? 28 : 36, textAlign: 'center', fontSize: isMobile ? '1em' : '1.08em' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.managementNumber, item.quantity + 1)} style={{ background: '#f7f3ef', color: '#333', border: '1px solid #FFD4C4', borderRadius: '50%', width: isMobile ? 24 : 28, height: isMobile ? 24 : 28, fontWeight: 700, cursor: 'pointer', fontSize: isMobile ? '1em' : '1.1em', transition: 'background 0.2s' }}>+</button>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.managementNumber)} style={{ background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 8, padding: isMobile ? '0.4em 0.7em' : '0.5em 1em', fontSize: isMobile ? '0.95em' : '1em', cursor: 'pointer', marginLeft: 6, fontWeight: 700, transition: 'background 0.2s' }}>削除</button>
                </li>
              );
            })}
          </ul>
          <div style={{ marginTop: 18, fontWeight: 600, fontSize: isMobile ? '1.05em' : '1.08em', color: '#636E72', textAlign: isMobile ? 'center' : 'right', letterSpacing: '0.01em' }}>
            小計: {subtotal.toLocaleString()}円
          </div>
          <div style={{ fontWeight: 600, fontSize: isMobile ? '1.05em' : '1.08em', color: '#636E72', textAlign: isMobile ? 'center' : 'right', letterSpacing: '0.01em' }}>
            送料: {shipping === 0 ? '無料' : shipping.toLocaleString() + '円'}
          </div>
          <div style={{ fontWeight: 600, fontSize: isMobile ? '1.05em' : '1.08em', color: '#1e88e5', textAlign: isMobile ? 'center' : 'right', letterSpacing: '0.01em', marginBottom: 6 }}>
            合計: {totalWithShipping.toLocaleString()}円
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading}
            style={{
              marginTop: 24,
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: isMobile ? '0.9em 1.2em' : '1em 2em',
              fontWeight: 700,
              fontSize: isMobile ? '1em' : '1.08em',
              cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%',
              boxShadow: '0 2px 8px rgba(255,159,124,0.10)',
              opacity: loading ? 0.6 : 1,
              transition: 'background 0.2s',
            }}
          >
            {loading ? '決済ページを生成中...' : '購入へ進む'}
          </button>
        </>
      )}
    </div>
  );

  return (
    <header style={{ background: 'var(--color-background-alt)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="header-main-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto', padding: '0.6em 1.2em', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7em', minWidth: 120 }}>
          <Link to="/">
            <img src="/Image/MC square Logo.png" alt="MC Square ロゴ" style={{ height: 34, width: 'auto', display: 'block' }} />
          </Link>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.04em' }}>エムシースクエア</span>
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7em', minWidth: 120, justifyContent: 'flex-end', position: 'relative' }}>
          
          <button
            onClick={() => setCartOpen(o => !o)}
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 24,
              padding: '0.5em 1.2em',
              fontWeight: 700,
              fontSize: '0.95em', // ここを小さく
              boxShadow: '0 2px 8px rgba(255,159,124,0.10)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              position: 'relative',
              transition: 'background 0.2s',
            }}
            aria-label="カートを開く"
          >
            <span role="img" aria-label="cart">🛒</span>
            カート
            <span style={{ background: '#fff', color: 'var(--color-primary)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.98em', marginLeft: 6 }}>{cartCount}</span>
          </button>
          {cartOpen && CartDetail}
        </div>
      </div>
      <nav style={{ background: '#f7f3ef', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <ul className="header-nav-list" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.7em', margin: 0, padding: '0.35em 0', listStyle: 'none', fontSize: '0.98em' }}>
          {navItems.map(item => (
            <li key={item.to}>
              <Link
                to={item.to}
                style={{
                  color: location.pathname === item.to ? 'var(--color-primary)' : 'var(--color-text)',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.15em',
                  fontWeight: location.pathname === item.to ? 700 : 500,
                }}
                className="header-nav-link"
              >
                <span className="header-nav-link-icon" style={{ fontSize: '1.13em' }}>{item.icon}</span>
                <span className="header-nav-link-label" style={{ fontSize: '0.92em' }}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Header; 