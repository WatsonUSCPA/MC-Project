import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ImageSlider.css';

// 商品型定義
interface Product {
  managementNumber: string;
  name: string;
  price: string;
  imageUrl?: string;
  status?: string;
  description?: string;
}

const ImageSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const navigate = useNavigate();
  
  // 固定画像（4枚）
  const fixedImages = [
    '/Image/JP Cotton subscription.png', // JP Cotton subscription
    '/Image/US Cotton subscription.png', // US Cotton subscription
    '/Image/Gift to Grandma.png', // Gift to Grandma
    '/Image/UsankoClub.png' // UsankoClub
  ];

  useEffect(() => {
    async function fetchProductImages() {
      try {
        // AllProductsから商品画像を取得
        const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbygEEOmylE1fzaMtpxAReEQfY02zIcUVKwVPaV4R5H5AKWnQtgnUbYOKfq3y4mYJPdzYg/exec';
        
        const response = await fetch(GAS_WEB_APP_URL, { 
          method: 'GET', 
          mode: 'cors', 
          headers: { 'Accept': 'application/json' } 
        });
        
        if (!response.ok) throw new Error(`データの取得に失敗しました (${response.status})`);
        
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('データの形式が不正です');
        
        // 公開中の商品で、画像URLがあるものをフィルタリング
        const productsWithImages = data
          .filter((item: any) => item.status === '公開中' && item.imageUrl)
          .map((item: any) => item.imageUrl);
        
        console.log('📊 利用可能な商品画像数:', productsWithImages.length);
        console.log('📋 利用可能な商品画像:', productsWithImages);
        
        // ランダムに2枚選択（確実に2枚に制限）
        const shuffledProductImages = [...productsWithImages].sort(() => Math.random() - 0.5);
        const selectedProductImages = shuffledProductImages.slice(0, 2);
        
        // 最終的な画像配列を作成（商品画像2枚 + 固定画像4枚 = 合計6枚）
        const finalImages = [...selectedProductImages, ...fixedImages];
        setImages(finalImages);
        
        console.log('🎯 選択された商品画像:', selectedProductImages);
        console.log('📸 最終的な画像配列:', finalImages);
        console.log('🔢 合計画像数:', finalImages.length);
      } catch (error) {
        console.error('❌ 商品画像の取得に失敗:', error);
        
        // エラーが発生した場合は、デフォルトの生地画像を使用
        const fallbackImages = [
          '/Image/Goods Picture.png',
          '/Image/CraftKitchen.png',
          ...fixedImages
        ];
        setImages(fallbackImages);
        console.log('🔄 フォールバック画像を使用:', fallbackImages);
      }
    }
    
    fetchProductImages();
  }, []);

  useEffect(() => {
    if (images.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 5000); // 5秒ごとに自動スライド

    return () => clearInterval(timer);
  }, [images.length]);

  // 画像クリック時の処理
  const handleImageClick = (index: number) => {
    if (index === 0 || index === 1) {
      // 最初の2枚（生地の販売）
      navigate('/all-products');
    } else if (index === 2 || index === 3) {
      // 次の2枚（サブスク）
      navigate('/subscription');
    } else if (index === 4) {
      // 5枚目（ギャラリー）
      navigate('/gallery');
    } else if (index === 5) {
      // 6枚目（インフルエンサーコラボ）
      navigate('/influencer_subscription');
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  // 画像がまだ読み込まれていない場合は表示しない
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="image-slider-container">
      <div className="image-slider">
        <div className="slide-container">
          {images.map((image, index) => (
            <div
              key={index}
              className={`slide ${index === currentSlide ? 'active' : ''}`}
              style={{
                transform: `translateX(-${currentSlide * 100}%)`,
              }}
            >
              <img 
                src={image} 
                alt={`Slide ${index + 1}`}
                className="slide-image"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  backgroundColor: '#f8f8f8',
                  cursor: 'pointer'
                }}
                onClick={() => handleImageClick(index)}
              />
              {/* クリック可能であることを示すオーバーレイ */}
              <div 
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '5px 10px',
                  borderRadius: '15px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  zIndex: 1000
                }}
              >
                {index === 0 || index === 1 ? '🧵 生地の販売' :
                 index === 2 || index === 3 ? '📦 サブスク' :
                 index === 4 ? '🎨 ギャラリー' :
                 '🌟 インフルエンサーコラボ'}
              </div>
            </div>
          ))}
        </div>
        
        {/* ナビゲーションボタン */}
        <button 
          className="slider-button prev" 
          onClick={goToPrevious}
          style={{
            position: 'absolute',
            top: '50%',
            left: '10px',
            transform: 'translateY(-50%)',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid #333',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '16px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          &#10094;
        </button>
        <button 
          className="slider-button next" 
          onClick={goToNext}
          style={{
            position: 'absolute',
            top: '50%',
            right: '10px',
            transform: 'translateY(-50%)',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid #333',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '16px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          &#10095;
        </button>
        
        {/* ドットインジケーター */}
        <div className="dots-container" style={{
          position: 'absolute',
          bottom: '15px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          zIndex: 1000
        }}>
          {images.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: index === currentSlide ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                border: '1px solid #333',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageSlider;
