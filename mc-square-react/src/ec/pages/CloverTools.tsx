import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { fetchCloverCatalog, CloverCatalogProduct } from '../../shared/recipesApi';
import './CloverTools.css';

// クラフトキッチンのレシピで使われているクロバーの道具（取り扱い商品）
const CloverTools: React.FC = () => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<CloverCatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCloverCatalog()
      .then((d) => setProducts(d.products || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => {
    const q = query.trim();
    return q ? products.filter((p) => p.name.includes(q) || p.productNumber.includes(q)) : products;
  }, [products, query]);

  const handleAdd = (p: CloverCatalogProduct) => {
    addToCart({
      managementNumber: p.id,
      name: p.name,
      price: String(p.price),
      imageUrl: p.image,
      quantity: 1,
      productType: 'clover',
    });
    setAddedId(p.id);
    setTimeout(() => setAddedId((cur) => (cur === p.id ? null : cur)), 2000);
  };

  return (
    <div className="container clover-tools">
      <h1>✂️ クロバーの手芸道具</h1>
      <p className="ct-lead">
        クラフトキッチンのレシピで使われているクロバーの道具を取り扱っています。生地と一緒にまとめてお届けします。
      </p>
      <input
        type="search"
        className="ct-search"
        placeholder="商品名・品番で探す（例：はさみ、57-790）"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <p className="ct-status">読み込み中...</p>}
      {error && <p className="ct-status">商品を読み込めませんでした。時間をおいて再度お試しください。</p>}
      {!loading && !error && shown.length === 0 && <p className="ct-status">該当する商品がありません。</p>}
      <div className="ct-grid">
        {shown.map((p) => (
          <div key={p.id} className="ct-card">
            <Link to={`/clover/${p.productNumber}`} className="ct-card-link" aria-label={`${p.name}の詳細を見る`}>
              {p.image
                ? <img src={p.image} alt={p.name} loading="lazy" decoding="async" width={240} height={240} />
                : <div className="ct-noimage">No Image</div>}
              <span className="ct-number">品番 {p.productNumber}</span>
              <strong className="ct-name">{p.name}</strong>
              <span className="ct-price">{p.price.toLocaleString()}円（税込）</span>
              <span className="ct-more">詳しく見る ›</span>
            </Link>
            <button type="button" className="ct-add" onClick={() => handleAdd(p)}>
              {addedId === p.id ? '✓ 追加しました' : 'カートに入れる'}
            </button>
            {p.recipes.length > 0 && (
              <div className="ct-recipes">
                <span>使われているレシピ{p.recipeCount > p.recipes.length ? `（${p.recipeCount}件）` : ''}</span>
                {p.recipes.map((r) => (
                  <Link key={r.id} to={`/gallery/detail/${r.id}`}>{r.title}</Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CloverTools;
