import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
// Firebase
import { app } from '../../firebase';
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

const KitsNew: React.FC = () => {
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
    if (fabricCount >= 1 && fabricCount <= 5) {
      return { current: fabricCount, next: 6, remaining: 6 - fabricCount };
    } else if (fabricCount >= 6 && fabricCount <= 10) {
      return { current: fabricCount, next: 11, remaining: 11 - fabricCount };
    } else if (fabricCount >= 11) {
      const nextThreshold = 10 + Math.ceil((fabricCount - 10) / 3) * 3 + 3;
      return { current: fabricCount, next: nextThreshold, remaining: nextThreshold - fabricCount };
    }
    return { current: fabricCount, next: 1, remaining: 1 - fabricCount };
  };
  
  const nextFreeKitInfo = getNextFreeKitInfo();

  // レベルリスト（重複なし）
  const levels = Array.from(new Set(kits.map(k => k.level).filter(Boolean)));

  // フィルタ適用
  const filteredKits = filterLevel ? kits.filter(k => k.level.trim() === filterLevel.trim()) : kits;

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
  const usedFreeKits = cart.filter(item => item.productType === 'kit').length;
  const availableFreeKits = Math.max(0, freeKitCount - usedFreeKits);

  // カートにキットを追加
  const handleAddToCart = (kit: Kit) => {
    // キットが既にカートにある場合は追加しない
    if (isKitInCart(kit.id)) {
      console.log('このキットは既にカートに追加されています');
      return;
    }
    
    // 無料キットが利用可能かチェック
    const isFree = availableFreeKits > 0;
    
    // キットを商品としてカートに追加（管理番号としてキットIDを使用）
    const productForCart = {
      managementNumber: kit.id,
      name: isFree ? `${kit.name} (無料)` : kit.name,
      price: isFree ? '0' : kit.price,
      imageUrl: kit.imageUrl || '/Image/MC square Logo.png',
      productType: 'kit' as const,
      quantity: 1
    };
    addToCart(productForCart);
  };

  // キットが既にカートにあるかチェック
  const isKitInCart = (kitId: string) => {
    // カート内のキットタイプのアイテムをチェック
    const kitItems = cart.filter(item => item.productType === 'kit');
    return kitItems.some(item => item.managementNumber === kitId);
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
      case '初級': return '#2E7D32'; // より濃い緑
      case '中級': return '#E65100'; // より濃いオレンジ
      case '上級': return '#C62828'; // より濃い赤
      default: return '#424242'; // より濃いグレー
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#FF6B6B', fontSize: '1.6rem', marginBottom: '0.5rem' }}>🧩 キットページ</h1>
        <div style={{ color: '#666', fontSize: '1.1rem' }}>キットを読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#FF6B6B', fontSize: '1.6rem', marginBottom: '0.5rem' }}>🧩 キットページ</h1>
        <div style={{ color: '#f44336', fontSize: '1.1rem', marginBottom: '1rem' }}>エラー: {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            background: '#FF6B6B',
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
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#FF6B6B', fontSize: '1.6rem', marginBottom: '0.5rem' }}>🧩 キットページ</h1>
      <p style={{ fontSize: '1.1rem', color: '#636E72', marginBottom: '1rem', lineHeight: 1.6 }}>
        エムシースクエア厳選の手作りキットをご紹介します。<br />
        初心者から上級者まで、お好みのレベルをお選びください。<br />
        <strong style={{ color: '#FF6B6B' }}>※ キットは1個ずつしか購入できません</strong>
      </p>

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
              onClick={() => {
                console.log('すべてボタンクリック');
                setFilterLevel('');
              }}
              style={{
                background: filterLevel === '' ? '#FFD4C4' : '#FFFFFF',
                color: filterLevel === '' ? '#E1306C' : '#000000',
                border: '1px solid #E0E0E0',
                borderRadius: '20px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: filterLevel === '' ? '600' : '400',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              すべて
            </button>
            {levels.map(level => {
              // レベル名を正規化（空白を除去）
              const normalizedLevel = level.trim();
              const isSelected = filterLevel.trim() === normalizedLevel;
              
              return (
                <button
                  key={level}
                  onClick={() => {
                    console.log(`${level}ボタンクリック (正規化: "${normalizedLevel}")`);
                    setFilterLevel(normalizedLevel);
                  }}
                  style={{
                    background: isSelected ? '#FFD4C4' : '#FFFFFF',
                    color: isSelected ? '#E1306C' : '#000000',
                    border: '1px solid #E0E0E0',
                    borderRadius: '20px',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: isSelected ? '600' : '400',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {level}
                </button>
              );
            })}
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
                background: '#FFF8F5',
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
                    color: '#2D3436', 
                    marginBottom: '0.5rem',
                    lineHeight: 1.3
                  }}>
                    {kit.name}
                  </h3>
                  
                  <div style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 700, 
                    color: '#FF6B6B', 
                    marginBottom: '0.5rem' 
                  }}>
                    {kit.price}
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                    <span style={{
                      background: `linear-gradient(135deg, ${getLevelColor(kit.level)} 0%, ${getLevelColor(kit.level)}dd 100%)`,
                      color: 'white',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                      border: '2px solid rgba(255,255,255,0.7)',
                      textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                      filter: 'brightness(0.9) contrast(1.2)'
                    }}>
                      {kit.level}
                    </span>
                    <span style={{
                      background: '#FFFFFF',
                      color: '#1976D2',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: '2px solid #1976D2',
                      boxShadow: '0 2px 4px rgba(25,118,210,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}>
                      <span style={{ fontSize: '0.9rem' }}>📏</span>
                      布サイズ: {kit.fabricSize}
                    </span>
                  </div>

                  {kit.comment && (
                    <p style={{ 
                      color: '#636E72', 
                      fontSize: '0.95rem', 
                      lineHeight: 1.5,
                      marginBottom: '1rem'
                    }}>
                      {kit.comment}
                    </p>
                  )}
                </div>

                {/* 無料キット状況表示 */}
                {fabricCount > 0 && (
                  <div style={{ 
                    marginBottom: '0.8rem',
                    padding: '0.6rem',
                    background: availableFreeKits > 0 ? '#f0f8f0' : '#fff8e1',
                    borderRadius: '10px',
                    border: availableFreeKits > 0 ? '2px solid #4CAF50' : '2px solid #FFB74D',
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {availableFreeKits > 0 ? (
                      <span style={{ color: '#2E7D32', fontWeight: 700 }}>
                        🎁 無料キット利用可能 ({availableFreeKits}個残り)
                      </span>
                    ) : (
                      <span style={{ color: '#E65100', fontWeight: 600 }}>
                        📦 通常価格で購入
                      </span>
                    )}
                  </div>
                )}

                {/* カート追加ボタン */}
                <button
                  onClick={() => handleAddToCart(kit)}
                  disabled={isKitInCart(kit.id)}
                  style={{
                    width: '100%',
                    background: isKitInCart(kit.id) ? '#f5f5f5' : '#FF6B6B',
                    color: isKitInCart(kit.id) ? '#666' : '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '0.7em 1.5em',
                    fontWeight: 700,
                    fontSize: '1.05em',
                    cursor: isKitInCart(kit.id) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isKitInCart(kit.id) ? 0.8 : 1,
                    boxShadow: isKitInCart(kit.id) ? 'none' : '0 2px 8px rgba(255, 159, 124, 0.10)'
                  }}
                  onMouseOver={(e) => {
                    if (!isKitInCart(kit.id)) {
                      e.currentTarget.style.background = '#FF6B6B';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(255, 159, 124, 0.15)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isKitInCart(kit.id)) {
                      e.currentTarget.style.background = '#FF6B6B';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 159, 124, 0.10)';
                    }
                  }}
                >
                  {isKitInCart(kit.id) ? '✅ カートに追加済み（1個のみ）' : 
                   availableFreeKits > 0 ? '🎁 無料で追加（1個のみ）' : '🛒 カートに追加（1個のみ）'}
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
                  background: '#FFF8F5',
                  color: '#2D3436',
                  border: '1px solid #FFD4C4',
                  borderRadius: '20px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#FF6B6B';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#FFF8F5';
                  e.currentTarget.style.color = '#2D3436';
                }}
              >
                もっと見る ({visibleKits.length}/{filteredKits.length})
              </button>
            </div>
          )}
        </>
      )}

      {/* お問合せ先 */}
      <div style={{ 
        background: '#FFF8F5', 
        borderRadius: 20, 
        padding: '2rem', 
        marginTop: '3rem', 
        boxShadow: '0 4px 8px rgba(255, 159, 124, 0.08)', 
        border: '1px solid #FFD4C4', 
        maxWidth: 700, 
        marginLeft: 'auto', 
        marginRight: 'auto', 
        position: 'relative', 
        overflow: 'hidden' 
      }}>
        <strong>【お問合せ先】</strong><br />
        〒244-0811 神奈川県横浜市戸塚区上柏尾町132-3 SKビル2階<br />
        TEL：045-410-7023　FAXフリーダイヤル：0120-535-596<br />
        E-mail：<a href="mailto:retail@mcsquareofficials.com" style={{ color: '#FF6B6B', textDecoration: 'none' }}>retail@mcsquareofficials.com</a>
      </div>
    </div>
  );
};

export default KitsNew; 