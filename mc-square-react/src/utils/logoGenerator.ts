export const generateCraftKitchenLogo = (size: number = 200): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  // キャンバスサイズを設定
  canvas.width = size;
  canvas.height = size;
  
  // 背景を透明に
  ctx.clearRect(0, 0, size, size);
  
  // グリッドのサイズ計算
  const gridSize = size / 2;
  const gap = size * 0.01; // 2px相当
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
  ctx.moveTo(size - gap - squareSize * 0.4, gap + squareSize * 0.2);
  ctx.lineTo(size - gap - squareSize * 0.2, gap + squareSize * 0.4);
  ctx.lineTo(size - gap - squareSize * 0.6, gap + squareSize * 0.4);
  ctx.closePath();
  ctx.fill();
  
  return canvas.toDataURL('image/png');
};

export const downloadLogo = (size: number = 200, filename: string = 'craft-kitchen-logo.png') => {
  try {
    const dataUrl = generateCraftKitchenLogo(size);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Logo generation failed:', error);
  }
}; 