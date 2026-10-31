#!/usr/bin/env node
// クロバー商品の詳細（写真・説明・仕様）を clover.co.jp の商品ページから取得し、
// mc-square-react/src/shared/cloverProductDetails.json に保存する（商品詳細ページ /clover/<品番> 用）。
// 価格表（clover-products.json / cloverProducts.json）は読むだけで変更しない。
//
// 使い方:
//   node scripts/fetch-clover-details.js 57-232 36-191      # 品番を指定
//   node scripts/fetch-clover-details.js --top 10           # レシピでよく使われている順に上位10点（公開サイトの /api/clover-catalog の並び）
//   node scripts/fetch-clover-details.js --missing [--limit 30]  # 詳細がまだない商品をまとめて
//   node scripts/fetch-clover-details.js --all              # 価格表の全商品（取得済みも更新）
// オプション: --delay <ms>（1件ごとの待ち時間、既定 1500ms）
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PRICE_LIST = path.join(ROOT, 'mc-square-react/src/shared/cloverProducts.json');
const OUT = path.join(ROOT, 'mc-square-react/src/shared/cloverProductDetails.json');
const CATALOG_API = 'https://mcsquareofficials.com/.netlify/functions/clover-catalog';
const UA = 'Mozilla/5.0 (MC Square product detail updater)';

const decode = (s) => String(s || '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
// HTML → テキスト（<br>・</p> は改行）
const toText = (html) => decode(String(html || '')
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n')
  .replace(/<[^>]+>/g, ''))
  .split('\n').map((l) => l.replace(/[ \t\u3000]+/g, ' ').trim()).filter(Boolean).join('\n');

// 仕様の見出しとして扱う項目（それ以外の「○○：△△」行は直前の項目の続き。例: 材質の内訳）
const TOP_LABELS = /^(内容物|材質|素材|原産国|パッケージサイズ|サイズ|製品サイズ|寸法|入数|重さ|重量|全長|長さ|太さ|色|カラー|適応糸|適した糸|付属品|仕様|規格|対象年齢|容量|電源|品番)$/;

const absUrl = (u) => new URL(u, 'https://clover.co.jp/').toString();

function parseProduct(html) {
  const block = (html.match(/<section class="product_detail">([\s\S]*?)<div class="social-buttons">/) || [])[1] || '';
  if (!block) throw new Error('商品詳細ブロックが見つかりません');

  // 写真（メイン＋切り替え用、重複なし）
  const images = [];
  for (const m of block.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g)) {
    const u = absUrl(decode(m[1]));
    if (/\/wp-content\/uploads\//.test(u) && !images.includes(u)) images.push(u);
  }
  const title = toText((block.match(/<div class="detail_title">[\s\S]*?<h3>([\s\S]*?)<\/h3>/) || [])[1]);
  const category = [...block.matchAll(/<li class="tag\d+">([\s\S]*?)<\/li>/g)].map((m) => toText(m[1])).filter(Boolean);

  // 説明（description01 / description02 の dt・dd）と仕様（dd.hosoku の「項目：値」）
  let catchCopy = '';
  const descParts = [];
  const specs = [];
  const notes = [];
  for (const dl of block.matchAll(/<dl class="description0[12]">([\s\S]*?)<\/dl>/g)) {
    const body = dl[1];
    for (const dt of body.matchAll(/<dt>([\s\S]*?)<\/dt>/g)) {
      const t = toText(dt[1]);
      if (t && !catchCopy) catchCopy = t; else if (t) descParts.push(t);
    }
    for (const dd of body.matchAll(/<dd( class="hosoku")?>([\s\S]*?)<\/dd>/g)) {
      const text = toText(dd[2]);
      if (!text) continue;
      if (!dd[1]) { descParts.push(text); continue; }
      for (const line of text.split('\n')) {
        const m = line.match(/^([^：:]{1,12})[：:]\s*(.*)$/);
        const label = m && m[1].trim();
        if (m && (TOP_LABELS.test(label) || label === '商品番号')) specs.push({ label, value: m[2].trim() });
        else if (/^[※＊*]/.test(line) || !specs.length) notes.push(line);
        else { const last = specs[specs.length - 1]; last.value = last.value ? `${last.value}\n${line}` : line; }
      }
    }
  }
  const price = (block.match(/<em>([\d,]+)円<\/em>\s*（税込み）/) || [])[1];
  const productNumber = (specs.find((s) => /商品番号|品番/.test(s.label)) || {}).value;
  return {
    title,
    category,
    images,
    catchCopy,
    description: descParts.join('\n'),
    notes,
    specs: specs.filter((s) => !/商品番号|品番/.test(s.label)),
    retailPrice: price ? Number(price.replace(/,/g, '')) : null,
    productNumberOnPage: productNumber || null,
  };
}

async function fetchDetail(product) {
  const res = await fetch(product.productUrl, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const d = parseProduct(await res.text());
  if (d.productNumberOnPage && d.productNumberOnPage !== product.productNumber) {
    console.warn(`  ! 品番がページと一致しません: 価格表 ${product.productNumber} / ページ ${d.productNumberOnPage}`);
  }
  if (d.retailPrice && d.retailPrice !== product.price) {
    console.warn(`  ! 価格が価格表と違います: 価格表 ${product.price}円 / ページ ${d.retailPrice}円（価格表は変更しません）`);
  }
  const { productNumberOnPage, retailPrice, ...rest } = d;
  return { productNumber: product.productNumber, sourceUrl: product.productUrl, ...rest, fetchedAt: new Date().toISOString().slice(0, 10) };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const args = process.argv.slice(2);
  const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
  const delay = Number(opt('--delay', 1500));
  const priceList = JSON.parse(fs.readFileSync(PRICE_LIST, 'utf8'));
  const byNumber = new Map(priceList.map((p) => [p.productNumber, p]));
  const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};

  let targets;
  if (args.includes('--all')) targets = priceList;
  else if (args.includes('--missing')) {
    targets = priceList.filter((p) => !existing[p.productNumber]);
    const limit = Number(opt('--limit', 0));
    if (limit) targets = targets.slice(0, limit);
  } else if (args.includes('--top')) {
    const n = Number(opt('--top', 10));
    const res = await fetch(CATALOG_API, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`clover-catalog の取得に失敗しました (${res.status})`);
    const { products } = await res.json();
    targets = products.map((p) => byNumber.get(p.productNumber)).filter(Boolean).slice(0, n);
  } else {
    targets = args.filter((a) => !a.startsWith('--')).map((n) => {
      const p = byNumber.get(n);
      if (!p) throw new Error(`価格表にない品番です: ${n}`);
      return p;
    });
  }
  if (!targets.length) { console.log('取得する商品がありません'); return; }

  let ok = 0;
  for (const [i, p] of targets.entries()) {
    process.stdout.write(`[${i + 1}/${targets.length}] ${p.productNumber} ${p.name} ... `);
    try {
      existing[p.productNumber] = await fetchDetail(p);
      ok++;
      console.log(`OK（写真${existing[p.productNumber].images.length}枚・仕様${existing[p.productNumber].specs.length}項目）`);
    } catch (e) {
      console.log(`失敗: ${e.message}`);
    }
    if (i < targets.length - 1) await sleep(delay);
  }
  // 品番順で保存（差分を見やすく）
  const sorted = Object.fromEntries(Object.keys(existing).sort().map((k) => [k, existing[k]]));
  fs.writeFileSync(OUT, JSON.stringify(sorted, null, 1) + '\n');
  console.log(`${ok}/${targets.length} 件を保存しました → ${path.relative(ROOT, OUT)}（合計 ${Object.keys(sorted).length} 件）`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
