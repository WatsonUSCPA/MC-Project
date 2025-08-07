import React, { useRef, useEffect } from 'react';
import { generateCraftKitchenLogo, downloadLogo } from '../utils/logoGenerator';

const LogoGenerator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // キャンバスサイズを設定
        canvas.width = 200;
        canvas.height = 200;
        
        // 背景を透明に
        ctx.clearRect(0, 0, 200, 200);
        
        // グリッドのサイズ計算
        const gridSize = 100;
        const gap = 2;
        const squareSize = (gridSize - gap) / 2;
        
        // 色の定義
        const colors = {
          brown: '#8B4513',
          orange: '#FF8C00',
          beige: '#F5DEB3'
        };
        
        // 正方形を描画
        // 左上: 茶色
        ctx.fillStyle = colors.brown;
        ctx.fillRect(0, 0, squareSize, squareSize);
        
        // 右上: オレンジ
        ctx.fillStyle = colors.orange;
        ctx.fillRect(squareSize + gap, 0, squareSize, squareSize);
        
        // 左下: ベージュ
        ctx.fillStyle = colors.beige;
        ctx.fillRect(0, squareSize + gap, squareSize, squareSize);
        
        // 右下: 茶色
        ctx.fillStyle = colors.brown;
        ctx.fillRect(squareSize + gap, squareSize + gap, squareSize, squareSize);
        
        // 三角形を描画（右上）
        ctx.fillStyle = colors.brown;
        ctx.beginPath();
        ctx.moveTo(200 - gap - squareSize * 0.4, gap + squareSize * 0.2);
        ctx.lineTo(200 - gap - squareSize * 0.2, gap + squareSize * 0.4);
        ctx.lineTo(200 - gap - squareSize * 0.6, gap + squareSize * 0.4);
        ctx.closePath();
        ctx.fill();
      }
    }
  }, []);

  const handleDownload = () => {
    downloadLogo(200, 'craft-kitchen-logo.png');
  };

  const handleDownloadLarge = () => {
    downloadLogo(400, 'craft-kitchen-logo-large.png');
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>クラフトキッチンロゴ生成器</h2>
      <div style={{ margin: '20px 0' }}>
        <canvas
          ref={canvasRef}
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={handleDownload}
          style={{
            padding: '10px 20px',
            backgroundColor: '#FF6B6B',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          200px PNG ダウンロード
        </button>
        <button
          onClick={handleDownloadLarge}
          style={{
            padding: '10px 20px',
            backgroundColor: '#FF8C00',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          400px PNG ダウンロード
        </button>
      </div>
    </div>
  );
};

export default LogoGenerator; 