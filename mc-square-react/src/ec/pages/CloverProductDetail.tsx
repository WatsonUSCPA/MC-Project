import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { fetchCloverProduct, fetchRecipeIndex, thumbUrl, RecipeSummary } from '../../shared/recipesApi';
import cloverProducts from '../../shared/cloverProducts.json';
import cloverDetails from '../../shared/cloverProductDetails.json';
import './CloverTools.css';

// クロバー商品の詳細ページ（/clover/<品番>）
// - 品番・商品名・税込価格: 価格表（cloverProducts.json）
// - 写真・説明・仕様: clover.co.jp から取得した cloverProductDetails.json（scripts/fetch-clover-details.js で更新）
//   詳細がまだない商品は、価格表の情報だけで表示する
// - この道具を使うレシピ: /api/clover-catalog?product=<品番>（Firestore のレシピの affiliateProducts.productUrl で照合）

interface PriceListItem { id: string; productNumber: string; name: string; price: number; productUrl: string; }
interface CloverDetail {
  productNumber: string; sourceUrl: string; title: string; category: string[]; images: string[];
  catchCopy: string; description: string; notes: string[]; specs: { label: string; value: string }[]; fetchedAt: string;
}

const PRICE_LIST = cloverProducts as PriceListItem[];
const DETAILS = cloverDetails as Record<string, CloverDetail>;
const DEFAULT_TITLE = 'エムシースクエア - "いいものはいつまでも"';

const CloverProductDetail: React.FC = () => {
  const { productNumber = '' } = useParams<{ productNumber: string }>();
  const { addToCart } = useCart();
  const product = useMemo(() => PRICE_LIST.find((p) => p.productNumber === productNumber), [productNumber]);
  const detail = DETAILS[productNumber];

  const [recipes, setRecipes] = useState<{ id: string; title: string }[]>([]);
  const [recipeImage, setRecipeImage] = useState('');
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [index, setIndex] = useState<Map<string, RecipeSummary>>(new Map());
  const [photo, setPhoto] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!product) return;
    document.title = `${product.name}（${product.productNumber}）| クロバーの手芸道具 | エムシースクエア`;
    return () => { document.title = DEFAULT_TITLE; };
  }, [product]);

  useEffect(() => {
    setPhoto(0);
    setRecipes([]);
    setRecipeImage('');
    if (!product) return;
    let alive = true;
    setRecipesLoading(true);
    fetchCloverProduct(product.productNumber)
      .then((d) => { if (alive) { setRecipes(d.product.recipes || []); setRecipeImage(d.product.image || ''); } })
      .catch(() => { /* レシピが取れなくても商品は表示する */ })
      .finally(() => { if (alive) setRecipesLoading(false); });
    fetchRecipeIndex()
      .then((d) => { if (alive) setIndex(new Map(d.recipes.map((r) => [r.id, r]))); })
      .catch(() => { /* サムネイルなしで表示 */ });
    return () => { alive = false; };
  }, [product]);

  if (!product) {
    return (
      <div className="container clover-tools">
        <p className="ct-status">この商品は取り扱っていません（品番 {productNumber}）。</p>
        <Link to="/tools" className="cd-back">← クロバーの手芸道具一覧へ</Link>
      </div>
    );
  }

  const images = detail?.images?.length ? detail.images : recipeImage ? [recipeImage] : [];
  const mainImage = images[Math.min(photo, images.length - 1)];

  const handleAdd = () => {
    addToCart({
      managementNumber: product.id,
      name: product.name,
      price: String(product.price),
      imageUrl: images[0],
      quantity: 1,
      productType: 'clover',
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="container clover-tools clover-detail">
      <Link to="/tools" className="cd-back">← クロバーの手芸道具一覧へ</Link>
      <div className="cd-main">
        <div className="cd-photos">
          {mainImage
            ? <img className="cd-photo" src={mainImage} alt={product.name} decoding="async" />
            : <div className="cd-photo ct-noimage">No Image</div>}
          {images.length > 1 && (
            <div className="cd-thumbs">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  className={i === photo ? 'active' : ''}
                  onClick={() => setPhoto(i)}
                  aria-label={`写真${i + 1}を表示`}
                >
                  <img src={src} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="cd-info">
          {detail?.category?.length ? <span className="cd-category">{detail.category.join('・')}</span> : null}
          <h1 className="cd-name">{product.name}</h1>
          <span className="ct-number">品番 {product.productNumber}</span>
          <span className="cd-price">{product.price.toLocaleString()}円<small>（税込）</small></span>
          <button type="button" className="ct-add cd-add" onClick={handleAdd}>
            {added ? '✓ カートに追加しました' : 'カートに入れる'}
          </button>
          {detail?.catchCopy && <p className="cd-catch">{detail.catchCopy}</p>}
          {detail?.description && <p className="cd-desc">{detail.description}</p>}
          {detail?.specs?.length ? (
            <dl className="cd-specs">
              {detail.specs.map((s, i) => (
                <React.Fragment key={i}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </React.Fragment>
              ))}
            </dl>
          ) : null}
          {detail?.notes?.length ? (
            <ul className="cd-notes">{detail.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          ) : null}
          <a className="cd-source" href={product.productUrl} target="_blank" rel="noopener noreferrer">
            クロバーの商品ページを見る ↗
          </a>
        </div>
      </div>

      <section className="cd-recipes">
        <h2>✂️ この道具で作れるもの{recipes.length > 0 ? `（${recipes.length}件）` : ''}</h2>
        {recipesLoading && recipes.length === 0 && <p className="ct-status">読み込み中...</p>}
        {!recipesLoading && recipes.length === 0 && <p className="ct-status">この道具を使うレシピはまだありません。</p>}
        <div className="cd-recipe-grid">
          {recipes.map((r) => {
            const s = index.get(r.id);
            return (
              <Link key={r.id} to={`/gallery/detail/${r.id}`} className="cd-recipe">
                {s?.thumb
                  ? <img src={thumbUrl(s.thumb, 320)} alt="" loading="lazy" decoding="async" />
                  : <div className="ct-noimage">No Image</div>}
                <span>{r.title}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default CloverProductDetail;
