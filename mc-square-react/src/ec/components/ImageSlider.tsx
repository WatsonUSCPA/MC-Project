import React, { useState, useEffect } from 'react';
import '../../styles/ImageSlider.css';

const ImageSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imageLoadStatus, setImageLoadStatus] = useState<{[key: string]: boolean}>({});
  
  const images = [
    '/Image/Goods Picture.png', // 生地の販売画像1
    '/Image/JP Cotton subscription.png', // JP Cotton subscription
    '/Image/US Cotton subscription.png', // US Cotton subscription
    '/Image/Gift to Grandma.png', // Gift to Grandma
    '/Image/Gift to Kids.png', // Gift to Kids
    '/Image/Gift to Mom.png' // Gift to Mom
  ];

  useEffect(() => {
    // 画像の読み込み状況をログに出力
    console.log('🎯 ImageSlider Debug Info:');
    console.log('📁 画像配列:', images);
    console.log('🔍 現在の作業ディレクトリ:', window.location.origin);
    console.log('📂 画像の完全パス:');
    images.forEach((image, index) => {
      const fullPath = `${window.location.origin}${image}`;
      console.log(`  ${index + 1}. ${image} → ${fullPath}`);
    });

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 5000); // 5秒ごとに自動スライド

    return () => clearInterval(timer);
  }, [images.length]);

  const handleImageLoad = (imagePath: string) => {
    console.log(`✅ 画像が正常に読み込まれました: ${imagePath}`);
    setImageLoadStatus(prev => ({ ...prev, [imagePath]: true }));
  };

  const handleImageError = (imagePath: string, event: React.SyntheticEvent<HTMLImageElement>) => {
    const imgElement = event.currentTarget;
    console.error(`❌ 画像の読み込みに失敗しました: ${imagePath}`);
    console.error(`   📍 要素のsrc属性: ${imgElement.src}`);
    console.error(`   📍 要素のcurrentSrc: ${imgElement.currentSrc}`);
    console.error(`   📍 要素のnaturalWidth: ${imgElement.naturalWidth}`);
    console.error(`   📍 要素のnaturalHeight: ${imgElement.naturalHeight}`);
    console.error(`   📍 要素のdisplay: ${imgElement.style.display}`);
    
    // 画像が存在しない場合の代替表示
    imgElement.style.display = 'none';
    setImageLoadStatus(prev => ({ ...prev, [imagePath]: false }));
    
    // エラー画像の統計を表示
    const failedImages = Object.values(imageLoadStatus).filter(status => !status).length;
    console.warn(`⚠️ 読み込み失敗した画像数: ${failedImages}/${images.length}`);
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

  return (
    <div className="image-slider-container" style={{ border: '5px solid blue', padding: '20px', margin: '20px 0' }}>
      {/* デバッグ用の一時的な表示 */}
      <div style={{
        backgroundColor: 'red',
        color: 'white',
        padding: '30px',
        margin: '30px 0',
        textAlign: 'center',
        fontSize: '24px',
        border: '5px solid yellow',
        fontWeight: 'bold',
        zIndex: 9999,
        position: 'relative'
      }}>
        🚨 ImageSlider コンポーネントが表示されています！ 🚨
        <br />
        もしこの赤いボックスが見えていれば、コンポーネントは正常に動作しています
        <br />
        <span style={{ fontSize: '18px', color: 'yellow' }}>
          現在のスライド: {currentSlide + 1} / {images.length}
        </span>
      </div>

      <div className="image-slider" style={{ border: '3px solid green', minHeight: '200px' }}>
        <div className="slide-container">
          {images.map((image, index) => (
            <div
              key={index}
              className={`slide ${index === currentSlide ? 'active' : ''}`}
              style={{
                transform: `translateX(-${currentSlide * 100}%)`,
                border: '2px solid purple',
                minHeight: '150px'
              }}
            >
              <img 
                src={image} 
                alt={`Slide ${index + 1}`}
                className="slide-image"
                onLoad={() => handleImageLoad(image)}
                onError={(e) => handleImageError(image, e)}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              {/* 画像読み込み状況のデバッグ表示 */}
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: imageLoadStatus[image] ? 'rgba(0, 255, 0, 0.9)' : 'rgba(255, 0, 0, 0.9)',
                color: 'white',
                padding: '8px',
                borderRadius: '5px',
                fontSize: '14px',
                zIndex: 1000,
                fontWeight: 'bold'
              }}>
                {imageLoadStatus[image] ? '✅' : '❌'} {image.split('/').pop()}
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
            left: '20px',
            transform: 'translateY(-50%)',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid #333',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            fontSize: '20px',
            zIndex: 1000
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
            right: '20px',
            transform: 'translateY(-50%)',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid #333',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            fontSize: '20px',
            zIndex: 1000
          }}
        >
          &#10095;
        </button>
        
        {/* ドットインジケーター */}
        <div className="dots-container" style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '10px',
          zIndex: 1000
        }}>
          {images.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              style={{
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                background: index === currentSlide ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                border: '2px solid #333'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* 開発環境でのデバッグ情報表示 */}
      <div style={{
        marginTop: '20px',
        padding: '20px',
        backgroundColor: '#f0f0f0',
        borderRadius: '10px',
        fontSize: '16px',
        fontFamily: 'monospace',
        border: '3px solid #333'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🐛 デバッグ情報</h4>
        <p style={{ margin: '5px 0' }}>現在のスライド: {currentSlide + 1} / {images.length}</p>
        <p style={{ margin: '5px 0' }}>画像読み込み状況:</p>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          {images.map((image, index) => (
            <li key={index} style={{ 
              color: imageLoadStatus[image] ? 'green' : 'red',
              margin: '3px 0',
              fontWeight: 'bold'
            }}>
              {image.split('/').pop()}: {imageLoadStatus[image] ? '✅ 成功' : '❌ 失敗'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ImageSlider;
