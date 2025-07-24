import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Product {
  managementNumber: string;
  name: string;
  price: string;
  imageUrl?: string;
  status?: string;
  // 商品タイプを追加
  productType?: 'fabric' | 'kit' | 'other';
}

interface CartItem extends Product {
  quantity: number;
  // 無料フラグを追加
  isFree?: boolean;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (managementNumber: string) => void;
  updateQuantity: (managementNumber: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  totalPrice: number;
  // 無料キット情報を追加
  freeKitCount: number;
  appliedFreeKits: string[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 商品が生地かどうかを判定する関数
  const isFabricProduct = (product: Product): boolean => {
    // 商品名に「50cm」が含まれているか、またはproductTypeが'fabric'の場合
    return product.name.includes('50cm') || product.productType === 'fabric';
  };

  // 商品がキットかどうかを判定する関数
  const isKitProduct = (product: Product): boolean => {
    // productTypeが'kit'の場合、またはキットページから追加された商品
    return product.productType === 'kit';
  };

  // 無料キットを適用する関数
  const applyFreeKits = (currentCart: CartItem[]): CartItem[] => {
    const fabricItems = currentCart.filter(item => isFabricProduct(item));
    const kitItems = currentCart.filter(item => isKitProduct(item));
    
    // 生地の総枚数を計算
    const totalFabricCount = fabricItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // 無料にできるキットの数を計算（新しいルール）
    let availableFreeKits = 0;
    if (totalFabricCount >= 1 && totalFabricCount <= 5) {
      availableFreeKits = 1;
    } else if (totalFabricCount >= 6 && totalFabricCount <= 10) {
      availableFreeKits = 2;
    } else if (totalFabricCount > 10) {
      // 10個を超えた分は3個ごとに1個追加
      const additionalKits = Math.floor((totalFabricCount - 10) / 3);
      availableFreeKits = 2 + additionalKits;
    }
    
    // キットを価格順にソート（高い順）
    const sortedKits = [...kitItems].sort((a, b) => {
      const priceA = Number(String(a.price).replace(/[^\d.]/g, ''));
      const priceB = Number(String(b.price).replace(/[^\d.]/g, ''));
      return priceB - priceA;
    });
    
    // 無料フラグをリセット
    const resetCart = currentCart.map(item => ({ ...item, isFree: false }));
    
    // 無料キットを適用
    let appliedCount = 0;
    const updatedCart = resetCart.map(item => {
      if (isKitProduct(item) && appliedCount < availableFreeKits) {
        appliedCount++;
        return { ...item, isFree: true };
      }
      return item;
    });
    
    return updatedCart;
  };

  // ローカルストレージからカート情報を読み込み
  useEffect(() => {
    const savedCart = localStorage.getItem('mcSquareCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // 復元時に無料キットを再適用
        const cartWithFreeKits = applyFreeKits(parsedCart);
        setCart(cartWithFreeKits);
        console.log('🛒 グローバルカート情報を復元しました:', parsedCart.length, '個の商品');
      } catch (error) {
        console.error('カート情報の復元に失敗しました:', error);
        setCart([]);
      }
    }
    setIsInitialized(true);
  }, []);

  // カート情報をローカルストレージに保存（初期化後のみ）
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('mcSquareCart', JSON.stringify(cart));
      console.log('💾 グローバルカート情報を保存しました:', cart.length, '個の商品');
    }
  }, [cart, isInitialized]);

  // カートに商品を追加
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.managementNumber === product.managementNumber);
      let newCart;
      
      if (existing) {
        // キットの場合は既に存在する場合は追加しない
        if (isKitProduct(product)) {
          return prevCart; // 変更なし
        }
        newCart = prevCart.map(item =>
          item.managementNumber === product.managementNumber
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newCart = [...prevCart, { ...product, quantity: 1 }];
      }
      
      // 無料キットを適用
      return applyFreeKits(newCart);
    });
  };

  // カートから商品を削除
  const removeFromCart = (managementNumber: string) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => item.managementNumber !== managementNumber);
      return applyFreeKits(newCart);
    });
  };

  // 数量を更新
  const updateQuantity = (managementNumber: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(managementNumber);
      return;
    }
    setCart(prevCart => {
      const newCart = prevCart.map(item => {
        if (item.managementNumber === managementNumber) {
          // キットの場合は数量を1に固定
          if (isKitProduct(item)) {
            return { ...item, quantity: 1 };
          }
          return { ...item, quantity };
        }
        return item;
      });
      return applyFreeKits(newCart);
    });
  };

  // カートを空にする
  const clearCart = () => {
    setCart([]);
  };

  // カート内の商品数
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 合計金額（無料商品は除外）
  const totalPrice = cart.reduce((sum, item) => {
    if (item.isFree) return sum; // 無料商品は金額に含めない
    const priceNum = Number(String(item.price).replace(/[^\d.]/g, ''));
    return sum + priceNum * item.quantity;
  }, 0);

  // 無料キットの数
  const freeKitCount = cart.filter(item => item.isFree).length;

  // 適用された無料キットのIDリスト
  const appliedFreeKits = cart.filter(item => item.isFree).map(item => item.managementNumber);

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    totalPrice,
    freeKitCount,
    appliedFreeKits,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 