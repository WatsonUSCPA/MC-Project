#!/usr/bin/env node
// 「道具」ページ（/tools）と商品詳細ページ（/clover/<品番>）用の静的カタログを作る。
// 出力: mc-square-react/src/shared/cloverCatalog.json
//   { generatedAt, source, recipeCount, products: { <品番>: { image, recipes: [{ id, title }] } } }
// ページを開くたびに Firestore のクロバーのレシピ全件（約400件・affiliateProducts は base64 画像込み）を
// 読んでいた結果、無料枠の1日の読み取り上限を使い切ったため、ビルド前に1回だけ作ってコミットする形にした。
// 商品名・価格は含めない（価格表 cloverProducts.json から読む）。base64 画像は含めない。
//
// 使い方:
//   node scripts/build-clover-catalog.js                                  # Firestore から（クロバーのレシピ数ぶんの読み取り1回）
//   node scripts/build-clover-catalog.js --local <posted_log.json> <draftsDir>
//        # 投稿ログ（partner:'clover' の docId / file）と、投稿時の下書き JSON（affiliateProducts）から作る。Firestore を読まない
// クロバーのレシピを投稿したあと・価格表に商品を足したあとに実行して、生成ファイルを一緒にコミットする。
const fs = require('fs');
const path = require('path');
const { getRecipeSource, PARTNERS } = require('../netlify/lib/partners');
const { decodeFields } = require('../netlify/lib/firestore-rest');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'mc-square-react/src/shared/cloverCatalog.json');
const PRICE_LIST = require('../netlify/lib/clover-products.json');
const DETAILS = require('../mc-square-react/src/shared/cloverProductDetails.json');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'link-manager-f4ea8';
const RUN_QUERY = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
const CLOVER = PARTNERS.find((p) => p.id === 'clover');

const normalizeUrl = (u) => String(u || '').trim().replace(/\/$/, '').replace('://www.', '://');
const affImage = (id, i, v) => `/.netlify/functions/recipe-image?c=recipes&id=${encodeURIComponent(id)}&f=aff${i}&w=320&v=${encodeURIComponent(v || '')}`;

async function fromFirestore() {
  const res = await fetch(RUN_QUERY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'recipes' }],
        select: { fields: ['title', 'authorId', 'source', 'affiliateProducts'].map((f) => ({ fieldPath: f })) },
        where: { fieldFilter: { field: { fieldPath: 'authorId' }, op: 'EQUAL', value: { stringValue: CLOVER.authorIds[0] } } },
      },
    }),
  });
  if (!res.ok) throw new Error(`Firestore ${res.status}（429 なら無料枠の上限。太平洋時間0時のリセット後に再実行するか --local を使う）`);
  return (await res.json())
    .filter((r) => r.document)
    .map((r) => ({ id: r.document.name.split('/').pop(), version: r.document.updateTime, data: decodeFields(r.document.fields) }))
    .filter((r) => { const s = getRecipeSource(r.data); return s && s.partnerId === 'clover'; });
}

function fromLocal(logPath, draftsDir) {
  const log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
  return log
    .filter((e) => e.partner === 'clover' && e.docId && e.file)
    .map((e) => {
      const data = JSON.parse(fs.readFileSync(path.join(draftsDir, path.basename(e.file)), 'utf8'));
      return { id: e.docId, version: e.postedAt, data };
    });
}

(async () => {
  const args = process.argv.slice(2);
  const local = args.indexOf('--local');
  const recipes = local >= 0 ? fromLocal(args[local + 1], args[local + 2]) : await fromFirestore();
  if (!recipes.length) throw new Error('クロバーのレシピが0件です');

  const byUrl = new Map(PRICE_LIST.map((p) => [normalizeUrl(p.productUrl), { productNumber: p.productNumber, image: '', recipes: [] }]));
  // 新しい投稿が先頭に来ないよう、ID順で安定させる
  for (const { id, version, data } of recipes.sort((a, b) => a.id.localeCompare(b.id))) {
    (Array.isArray(data.affiliateProducts) ? data.affiliateProducts : []).forEach((a, i) => {
      const p = a && byUrl.get(normalizeUrl(a.productUrl));
      if (!p) return;
      if (!p.image && typeof a.imageUrl === 'string') {
        if (a.imageUrl.startsWith('https://')) p.image = a.imageUrl;
        else if (a.imageUrl.startsWith('data:')) p.image = affImage(id, i, version);
      }
      if (!p.recipes.some((r) => r.id === id)) p.recipes.push({ id, title: String(data.title || '').slice(0, 80) });
    });
  }
  const products = {};
  for (const p of byUrl.values()) {
    // 写真はクロバー公式の商品写真（cloverProductDetails.json）を優先。なければレシピの affiliateProducts の画像
    const official = (DETAILS[p.productNumber] && DETAILS[p.productNumber].images || []).find((u) => /^https:\/\//.test(u));
    const image = official || p.image;
    if (image || p.recipes.length) products[p.productNumber] = { image, recipes: p.recipes };
  }
  const out = { generatedAt: new Date().toISOString(), source: local >= 0 ? 'local' : 'firestore', recipeCount: recipes.length, products };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
  const withRecipes = Object.values(products).filter((p) => p.recipes.length).length;
  console.log(`${path.relative(ROOT, OUT)}: レシピ ${recipes.length} 件 / 商品 ${PRICE_LIST.length} 点中 ${withRecipes} 点にレシピあり`);
})().catch((e) => { console.error(e.message); process.exit(1); });
