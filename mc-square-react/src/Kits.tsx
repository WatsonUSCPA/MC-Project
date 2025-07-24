import React, { useEffect, useState } from 'react';
import { useCart } from './CartContext';
// Firebase
import { app } from './firebase';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const db = getFirestore(app);

// キット型定義
interface Kit {
  id: string;
  name: string;
  price: string;
  imageUrl?: string;
  fabricSize: string;
  level: string;
  comment: string;
  createdAt?: string;
  updatedAt?: string;
}

const Kits: React.FC = () => {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState(6);
  
  // グローバルカートコンテキストを使用
  const { cart, addToCart } = useCart();

  // 布の購入数を計算
  const fabricCount = cart.reduce((sum, item) => {
    if (item.name.includes('50cm') || item.productType === 'fabric') {
      return sum + item.quantity;
    }
    return sum;
  }, 0);
  
  // 次の無料キット獲得までの必要数を計算
  const getNextFreeKitInfo = () => {
    if (fabricCount <= 5) {
      return { current: fabricCount, next: 6, remaining: 6 - fabricCount };
    } else if (fabricCount <= 10) {
      return { current: fabricCount, next: 11, remaining: 11 - fabricCount };
    } else {
      const nextThreshold = 10 + Math.ceil((fabricCount - 10) / 3) * 3 + 3;
      return { current: fabricCount, next: nextThreshold, remaining: nextThreshold - fabricCount };
    }
  };
  
  const nextFreeKitInfo = getNextFreeKitInfo();

  // レベルリスト（重複なし）
  const levels = Array.from(new Set(kits.map(k => k.level).filter(Boolean)));

  // フィルタ適用
  const filteredKits = filterLevel ? kits.filter(k => k.level === filterLevel) : kits;

  // 表示するキットリスト
  const visibleKits = filteredKits.slice(0, visibleCount);

  // Firestoreからキット取得
  useEffect(() => {
    async function fetchKits() {
      setLoading(true);
      setError(null);
      try {
        console.log('Firebase接続を試行中...');
        const kitsCol = collection(db, 'kits');
        const snapshot = await getDocs(kitsCol);
        const kitsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Kit));
        console.log('取得したキット数:', kitsList.length);
        
        // 作成日時でソート（新しい順）
        kitsList.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        
        setKits(kitsList);
      } catch (e: any) {
        console.error('Firebase接続エラー:', e);
        if (e.code === 'permission-denied') {
          setError('Firebaseの権限設定を確認してください');
        } else if (e.code === 'unavailable') {
          setError('Firebaseサービスが利用できません。しばらく待ってから再試行してください');
        } else {
          setError(`キットの取得に失敗しました: ${e.message || '不明なエラー'}`);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchKits();
  }, []);

  // カートにキットを追加
  const handleAddToCart = (kit: Kit) => {
    // キットを商品としてカートに追加（管理番号としてキットIDを使用）
    const productForCart = {
      managementNumber: kit.id,
      name: kit.name,
      price: kit.price,
      imageUrl: kit.imageUrl || '/Image/MC square Logo.png',
      productType: 'kit' as const,
      quantity: 1
    };
    addToCart(productForCart);
  };

  // キットが既にカートにあるかチェック
  const isKitInCart = (kitId: string) => {
    return cart.some(item => item.managementNumber === kitId);
  };

  // 画像パス正規化関数
  const getImageSrc = (url?: string) => {
    if (!url) return '/Image/MC square Logo.png';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/Image/')) return url;
    if (url.startsWith('Image/')) return '/' + url;
    return '/Image/MC square Logo.png';
  };

  // レベルに応じた色を取得
  const getLevelColor = (level: string) => {
    switch (level) {
      case '初級': return '#4CAF50';
      case '中級': return '#FF9800';
      case '上級': return '#F44336';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <section className="hero-section" style={{ textAlign: 'center', padding: '4rem 0 2.5rem 0', marginBottom: '3rem' }}>
          <h1 className="hero-title" style={{ fontSize: '2.5rem', color: 'var(--color-text)', marginBottom: '2rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2 }}>🧩 キットページ</h1>
          <div style={{ color: '#666', fontSize: '1.1rem' }}>キットを読み込み中...</div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <section className="hero-section" style={{ textAlign: 'center', padding: '4rem 0 2.5rem 0', marginBottom: '3rem' }}>
          <h1 className="hero-title" style={{ fontSize: '2.5rem', color: 'var(--color-text)', marginBottom: '2rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2 }}>🧩 キットページ</h1>
          <div style={{ color: '#f44336', fontSize: '1.1rem', marginBottom: '2rem' }}>エラー: {error}</div>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            再読み込み
          </button>
        </section>
      </div>
    );
  }

  return (
    <>
      <div className="container">
        <section className="hero-section" style={{ textAlign: 'center', padding: '2rem 0 1.5rem 0', marginBottom: '1.5rem' }}>
          <h1 className="hero-title" style={{ fontSize: '2.5rem', color: 'var(--color-text)', marginBottom: '1rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2 }}>🧩 キットページ</h1>
          <p className="hero-subtitle" style={{ fontSize: '1.1rem', color: 'var(--color-text-light)', marginBottom: '1rem', lineHeight: 1.6, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            エムシースクエア厳選の手作りキットをご紹介します。<br />
            初心者から上級者まで、お好みのレベルをお選びください。
          </p>
        </section>

        {/* 情報セクション */}
        <div style={{ 
          maxWidth: 600, 
          margin: '0 auto 2rem auto'
        }}>
          {/* 注意書き */}
          <div style={{ 
            marginBottom: '1rem', 
            padding: '0.8rem', 
            background: '#fff3cd', 
            borderRadius: '8px', 
            border: '1px solid #ffeaa7',
            fontSize: '0.9rem',
            color: '#856404',
            textAlign: 'center'
          }}>
            <strong>ご注意:</strong> キットはレシピと材料リストをお送りするものです。<br />
            布はご自身でお選びいただく必要がございます。
          </div>

          {/* 無料キットルール */}
          <div style={{ 
            padding: '1rem', 
            background: '#f8f9fa', 
            borderRadius: '8px', 
            border: '1px solid #e9ecef' 
          }}>
            <h3 style={{ 
              textAlign: 'center', 
              color: '#495057', 
              marginBottom: '0.6rem', 
              fontSize: '1rem',
              fontWeight: 600
            }}>
              布を購入いただいた方にはキットを無料でお付けしております
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
              gap: '0.6rem', 
              marginBottom: '0.8rem' 
            }}>
                              <div style={{ 
                  padding: '0.5rem', 
                  background: '#fff', 
                  borderRadius: '6px', 
                  border: '1px solid #dee2e6',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#495057', marginBottom: '0.1rem' }}>布1-5個</div>
                  <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>キット1個無料</div>
                </div>
                <div style={{ 
                  padding: '0.5rem', 
                  background: '#fff', 
                  borderRadius: '6px', 
                  border: '1px solid #dee2e6',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#495057', marginBottom: '0.1rem' }}>布6-10個</div>
                  <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>キット2個無料</div>
                </div>
                <div style={{ 
                  padding: '0.5rem', 
                  background: '#fff', 
                  borderRadius: '6px', 
                  border: '1px solid #dee2e6',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#495057', marginBottom: '0.1rem' }}>布11個以降</div>
                  <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>3個ごとにキット1個追加無料</div>
                </div>
            </div>
            
            {/* 現在の状況表示 */}
            {fabricCount > 0 && (
              <div style={{ 
                padding: '0.5rem', 
                background: '#e8f5e8', 
                borderRadius: '6px', 
                border: '1px solid #c3e6c3',
                textAlign: 'center',
                marginBottom: '0.6rem'
              }}>
                <div style={{ fontWeight: 600, color: '#2d5a2d', fontSize: '0.85rem', marginBottom: '0.1rem' }}>
                  現在: 布{fabricCount}個購入中
                </div>
                {nextFreeKitInfo.remaining > 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#5a7c5a' }}>
                    次の無料キットまで: あと{nextFreeKitInfo.remaining}個
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#2d5a2d', fontWeight: 600 }}>
                    無料キット獲得中
                  </div>
                )}
              </div>
            )}
            
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#6c757d', 
              textAlign: 'center',
              lineHeight: 1.3
            }}>
              ※ 無料キットは最も高価なキットから順番に適用されます<br />
              ※ キットは1個ずつしか購入できません
            </div>
          </div>
        </div>

        {/* フィルター */}
        {levels.length > 0 && (
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => setFilterLevel('')}
                style={{
                  background: filterLevel === '' ? 'var(--color-primary)' : 'var(--color-background)',
                  color: filterLevel === '' ? 'white' : 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '20px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                すべて
              </button>
              {levels.map(level => (
                <button
                  key={level}
                  onClick={() => setFilterLevel(level)}
                  style={{
                    background: filterLevel === level ? 'var(--color-primary)' : 'var(--color-background)',
                    color: filterLevel === level ? 'white' : 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '20px',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* キット一覧 */}
        {kits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>キットがまだ登録されていません</div>
            <div>管理者がキットを追加すると、ここに表示されます。</div>
          </div>
        ) : (
          <>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '2rem', 
              marginBottom: '2rem' 
            }}>
              {visibleKits.map((kit) => (
                <div key={kit.id} style={{
                  background: 'var(--color-background-alt)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)',
                  border: '1px solid #FFD4C4',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}>
                  {/* キット画像 */}
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <img 
                      src={getImageSrc(kit.imageUrl)} 
                      alt={kit.name}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        border: '1px solid #FFD4C4'
                      }}
                    />
                  </div>

                  {/* キット情報 */}
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ 
                      fontSize: '1.3rem', 
                      fontWeight: 700, 
                      color: 'var(--color-text)', 
                      marginBottom: '0.5rem',
                      lineHeight: 1.3
                    }}>
                      {kit.name}
                    </h3>
                    
                    <div style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 700, 
                      color: 'var(--color-primary)', 
                      marginBottom: '0.5rem' 
                    }}>
                      {kit.price}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        background: getLevelColor(kit.level),
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        {kit.level}
                      </span>
                      <span style={{
                        background: '#E3F2FD',
                        color: '#1976D2',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        布サイズ: {kit.fabricSize}
                      </span>
                    </div>

                    {kit.comment && (
                      <p style={{ 
                        color: 'var(--color-text-light)', 
                        fontSize: '0.95rem', 
                        lineHeight: 1.5,
                        marginBottom: '1rem'
                      }}>
                        {kit.comment}
                      </p>
                    )}
                  </div>

                  {/* カート追加ボタン */}
                  <button
                    onClick={() => handleAddToCart(kit)}
                    disabled={isKitInCart(kit.id)}
                    style={{
                      width: '100%',
                      background: isKitInCart(kit.id) ? '#ccc' : 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: isKitInCart(kit.id) ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s ease',
                      opacity: isKitInCart(kit.id) ? 0.6 : 1
                    }}
                    onMouseOver={(e) => {
                      if (!isKitInCart(kit.id)) {
                        e.currentTarget.style.background = 'var(--color-secondary)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isKitInCart(kit.id)) {
                        e.currentTarget.style.background = 'var(--color-primary)';
                      }
                    }}
                  >
                    {isKitInCart(kit.id) ? '✅ カートに追加済み' : '🛒 カートに追加'}
                  </button>
                </div>
              ))}
            </div>

            {/* もっと見るボタン */}
            {visibleKits.length < filteredKits.length && (
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <button
                  onClick={() => setVisibleCount(prev => prev + 6)}
                  style={{
                    background: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '20px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--color-primary)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'var(--color-background)';
                    e.currentTarget.style.color = 'var(--color-text)';
                  }}
                >
                  もっと見る ({visibleKits.length}/{filteredKits.length})
                </button>
              </div>
            )}
          </>
        )}

        {/* お問合せ先 */}
        <div className="contact" style={{ background: 'var(--color-background-alt)', borderRadius: 20, padding: '2rem', marginTop: '3rem', boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)', border: '1px solid #FFD4C4', maxWidth: 700, marginLeft: 'auto', marginRight: 'auto', position: 'relative', overflow: 'hidden' }}>
          <strong>【お問合せ先】</strong><br />
          〒244-0811 神奈川県横浜市戸塚区上柏尾町132-3 SKビル2階<br />
          TEL：045-410-7023　FAXフリーダイヤル：0120-535-596<br />
          E-mail：<a href="mailto:retail@mcsquareofficials.com" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>retail@mcsquareofficials.com</a>
        </div>
      </div>
    </>
  );
};

export default Kits; 