// 取り扱い中のクロバー商品の一覧（互換用。サイトのページは cloverCatalog.json を直接読むので通常は呼ばれない）
// - 商品・価格はサーバー側の価格表（netlify/lib/clover-products.json）だけを使う
// - 写真と「使われているレシピ」は scripts/build-clover-catalog.js で事前生成した cloverCatalog.json から読む
//   （以前は呼ばれるたびに Firestore のクロバーのレシピ全件を読み、無料枠の読み取り上限を使い切っていた）
const { cacheHeaders, json } = require('../lib/http');
const CLOVER_PRODUCTS = require('../lib/clover-products.json');
const CATALOG = require('../../mc-square-react/src/shared/cloverCatalog.json');

const MAX_RECIPES_PER_PRODUCT = 3;
const PRODUCT_NUMBER = /^[0-9A-Za-z-]{1,20}$/;

const withRecipes = (p) => {
  const e = (CATALOG.products || {})[p.productNumber] || {};
  const recipes = Array.isArray(e.recipes) ? e.recipes : [];
  return { ...p, image: e.image || '', recipes, recipeCount: recipes.length };
};

// ?product=<品番> のときは、その商品だけを全レシピ付きで返す
exports.handler = async (event) => {
  const productNumber = event && event.queryStringParameters && event.queryStringParameters.product;
  if (productNumber !== undefined && !PRODUCT_NUMBER.test(productNumber)) {
    return json(400, { error: '品番が正しくありません' }, { 'Cache-Control': 'no-store' });
  }
  const all = CLOVER_PRODUCTS.map(withRecipes);
  if (productNumber) {
    const p = all.find((x) => x.productNumber === productNumber);
    if (!p) return json(404, { error: '取り扱いのない商品です' }, cacheHeaders({ browser: 300, cdn: 3600 }));
    return json(200, { product: p, generatedAt: CATALOG.generatedAt }, cacheHeaders({ browser: 300, cdn: 21600 }));
  }
  const products = all
    .map((p) => ({ ...p, recipes: p.recipes.slice(0, MAX_RECIPES_PER_PRODUCT) }))
    .sort((a, b) => b.recipeCount - a.recipeCount || a.productNumber.localeCompare(b.productNumber));
  return json(200, { products, generatedAt: CATALOG.generatedAt }, cacheHeaders({ browser: 300, cdn: 21600 }));
};
