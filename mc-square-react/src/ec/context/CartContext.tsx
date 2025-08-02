import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// 商品型定義
interface CartItem {
  managementNumber: string;
  name: string;
  price: string;
  imageUrl?: string;
  description?: string;
  quantity: number;
  productType?: 'fabric' | 'kit';
}

// カートの状態型定義
interface CartState {
  items: CartItem[];
}

// アクション型定義
type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { managementNumber: string; quantity: number } }
  | { type: 'UPDATE_KIT_PRICE'; payload: { managementNumber: string; name: string; price: string } }
  | { type: 'CLEAR_CART' };

// 初期状態
const getInitialState = (): CartState => {
  try {
    const savedCart = localStorage.getItem('mcSquareCart');
    if (savedCart) {
      return { items: JSON.parse(savedCart) };
    }
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error);
  }
  return { items: [] };
};

const initialState: CartState = getInitialState();

// カートのリデューサー
const cartReducer = (state: CartState, action: CartAction): CartState => {
  let newState: CartState;
  
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.managementNumber === action.payload.managementNumber);
      
      if (existingItem) {
        // キットタイプの場合は追加を許可しない（1個のみ）
        if (action.payload.productType === 'kit') {
          console.log('キットは1個しか購入できません');
          return state; // 既存の状態をそのまま返す
        }
        
        // 布などの他の商品の場合は数量を更新
        newState = {
          ...state,
          items: state.items.map(item =>
            item.managementNumber === action.payload.managementNumber
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      } else {
        // 新しい商品を追加
        newState = {
          ...state,
          items: [...state.items, action.payload]
        };
      }
      break;
    }
    
    case 'REMOVE_ITEM': {
      newState = {
        ...state,
        items: state.items.filter(item => item.managementNumber !== action.payload)
      };
      break;
    }
    
    case 'UPDATE_QUANTITY': {
      const targetItem = state.items.find(item => item.managementNumber === action.payload.managementNumber);
      
      // キットタイプの商品は数量を1に固定
      if (targetItem && targetItem.productType === 'kit') {
        newState = {
          ...state,
          items: state.items.map(item =>
            item.managementNumber === action.payload.managementNumber
              ? { ...item, quantity: 1 }
              : item
          )
        };
      } else {
        // 布などの他の商品は従来通り数量変更可能
        newState = {
          ...state,
          items: state.items.map(item =>
            item.managementNumber === action.payload.managementNumber
              ? { ...item, quantity: action.payload.quantity }
              : item
          )
        };
      }
      break;
    }
    
    case 'UPDATE_KIT_PRICE': {
      newState = {
        ...state,
        items: state.items.map(item =>
          item.managementNumber === action.payload.managementNumber
            ? { ...item, name: action.payload.name, price: action.payload.price }
            : item
        )
      };
      break;
    }
    
    case 'CLEAR_CART': {
      newState = {
        ...state,
        items: []
      };
      break;
    }
    
    default:
      return state;
  }
  
  // localStorageに保存
  try {
    localStorage.setItem('mcSquareCart', JSON.stringify(newState.items));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
  
  return newState;
};

// コンテキスト型定義
interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (managementNumber: string) => void;
  updateQuantity: (managementNumber: string, quantity: number) => void;
  updateKitPrice: (managementNumber: string, name: string, price: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// コンテキスト作成
const CartContext = createContext<CartContextType | undefined>(undefined);

// プロバイダーコンポーネント
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addToCart = (item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeFromCart = (managementNumber: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: managementNumber });
  };

  const updateQuantity = (managementNumber: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { managementNumber, quantity } });
  };

  const updateKitPrice = (managementNumber: string, name: string, price: string) => {
    dispatch({ type: 'UPDATE_KIT_PRICE', payload: { managementNumber, name, price } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => {
      const priceNum = Number(String(item.price).replace(/[^\d.]/g, ''));
      return total + (priceNum * item.quantity);
    }, 0);
  };

  const value: CartContextType = {
    cart: state.items,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateKitPrice,
    clearCart,
    getTotalItems,
    getTotalPrice
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// カスタムフック
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 