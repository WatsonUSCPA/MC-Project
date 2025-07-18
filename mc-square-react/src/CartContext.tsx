import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';

interface Product {
  managementNumber: string;
  name: string;
  price: string;
  imageUrl?: string;
  status?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (managementNumber: string) => void;
  updateQuantity: (managementNumber: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  totalPrice: number;
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

  // ローカルストレージからカート情報を読み込み
  useEffect(() => {
    const savedCart = localStorage.getItem('mcSquareCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
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
      if (existing) {
        return prevCart.map(item =>
          item.managementNumber === product.managementNumber
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // カートから商品を削除
  const removeFromCart = (managementNumber: string) => {
    setCart(prevCart => prevCart.filter(item => item.managementNumber !== managementNumber));
  };

  // 数量を更新
  const updateQuantity = (managementNumber: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(managementNumber);
      return;
    }
    setCart(prevCart => prevCart.map(item =>
      item.managementNumber === managementNumber
        ? { ...item, quantity }
        : item
    ));
  };

  // カートを空にする
  const clearCart = () => {
    setCart([]);
  };

  // カート内の商品数
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 合計金額
  const totalPrice = cart.reduce((sum, item) => {
    const priceNum = Number(String(item.price).replace(/[^\d.]/g, ''));
    return sum + priceNum * item.quantity;
  }, 0);

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    totalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 