// All Productsから最新商品を取得して新着生地PDF用データを生成
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbygEEOmylE1fzaMtpxAReEQfY02zIcUVKwVPaV4R5H5AKWnQtgnUbYOKfq3y4mYJPdzYg/exec';

async function fetchLatestProducts() {
    try {
        console.log('最新商品データを取得中...');
        
        const response = await fetch(GAS_WEB_APP_URL, { 
            method: 'GET', 
            mode: 'cors', 
            headers: { 'Accept': 'application/json' } 
        });
        
        if (!response.ok) {
            throw new Error(`データの取得に失敗しました (${response.status})`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            throw new Error('データの形式が不正です');
        }
        
        // 公開中の商品のみをフィルタリング
        const publicProducts = data.filter(item => item.status === '公開中');
        
        // アップロード日でソート（ColumnGがある場合）
        // アップロード日がない場合は、管理番号でソート（新しい順）
        const sortedProducts = publicProducts.sort((a, b) => {
            // アップロード日がある場合はそれでソート
            if (a.uploadDate && b.uploadDate) {
                return new Date(b.uploadDate) - new Date(a.uploadDate);
            }
            // 管理番号でソート（新しい順）
            return b.managementNumber.localeCompare(a.managementNumber);
        });
        
        // 最新6商品を取得
        const latestProducts = sortedProducts.slice(0, 6);
        
        console.log(`最新${latestProducts.length}商品を取得しました:`);
        latestProducts.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} - ¥${product.price}`);
        });
        
        return latestProducts;
        
    } catch (error) {
        console.error('商品データの取得に失敗:', error);
        return [];
    }
}

// HTMLファイルを更新する関数
function updateHTMLWithProducts(products) {
    const productsGrid = document.querySelector('.products-grid');
    
    if (!productsGrid) {
        console.error('商品グリッドが見つかりません');
        return;
    }
    
    // 既存の商品カードをクリア
    productsGrid.innerHTML = '';
    
    // 商品データがない場合のフォールバック
    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #636E72;">
                商品データを取得できませんでした
            </div>
        `;
        return;
    }
    
    // 商品カードを生成
    products.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // 画像URLを正規化
        const getImageSrc = (url) => {
            if (!url) return '/Image/MC square Logo.png';
            if (url.startsWith('http://') || url.startsWith('https://')) return url;
            if (url.startsWith('/Image/')) return url;
            if (url.startsWith('Image/')) return '/' + url;
            return '/Image/MC square Logo.png';
        };
        
        productCard.innerHTML = `
            <img src="${getImageSrc(product.imageUrl)}" 
                 alt="${product.name}" class="product-image" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="product-image" style="display: none;">${product.name}</div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">¥${Number(String(product.price).replace(/[^\d.]/g, '')).toLocaleString()}</div>
            </div>
        `;
        
        productsGrid.appendChild(productCard);
    });
    
    console.log('HTMLファイルを最新商品で更新しました');
}

// ページ読み込み時に最新商品を取得
document.addEventListener('DOMContentLoaded', async function() {
    console.log('新着生地PDFページを読み込み中...');
    
    // 最新商品を取得
    const latestProducts = await fetchLatestProducts();
    
    // HTMLを更新
    updateHTMLWithProducts(latestProducts);
});

// 手動で最新商品を再取得する関数（開発者ツールから実行可能）
window.refreshLatestProducts = async function() {
    console.log('最新商品を再取得中...');
    const latestProducts = await fetchLatestProducts();
    updateHTMLWithProducts(latestProducts);
};

// 商品データをコンソールに出力する関数（デバッグ用）
window.showLatestProducts = async function() {
    const latestProducts = await fetchLatestProducts();
    console.table(latestProducts);
    return latestProducts;
}; 