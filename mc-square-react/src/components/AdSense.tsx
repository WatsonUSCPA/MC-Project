import React, { useEffect, useRef } from 'react';

interface AdSenseProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid';
  style?: React.CSSProperties;
  className?: string;
}

const AdSense: React.FC<AdSenseProps> = ({ 
  adSlot, 
  adFormat = 'auto', 
  style = {}, 
  className = '' 
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // 既に初期化されている場合はスキップ
    if (isInitialized.current) {
      return;
    }

    try {
      // AdSenseが読み込まれているかチェック
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        // 要素が存在するかチェック
        if (adRef.current && !adRef.current.hasAttribute('data-ad-status')) {
          (window as any).adsbygoogle = (window as any).adsbygoogle || [];
          (window as any).adsbygoogle.push({});
          isInitialized.current = true;
        }
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, [adSlot]);

  return (
    <div className={`adsense-container ${className}`} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-9773006505119987"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdSense; 