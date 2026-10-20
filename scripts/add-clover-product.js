#!/usr/bin/env node
// クロバー商品を価格表に追加する
// 使い方: node scripts/add-clover-product.js https://clover.co.jp/products/36191 [...]
// clover.co.jp の商品ページから 品番・商品名・税込価格 を取得し、
// netlify/lib/clover-products.json と mc-square-react/src/shared/cloverProducts.json の両方に追加する。
// すでに登録済み（同じ id または productUrl）の場合は何もしない。
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILES = [
  path.join(ROOT, 'netlify/lib/clover-products.json'),
  path.join(ROOT, 'mc-square-react/src/shared/cloverProducts.json'),
];

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ').trim();

function normalizeUrl(input) {
  const u = new URL(input.trim());
  if (!/^(www\.)?clover\.co\.jp$/.test(u.hostname)) throw new Error(`clover.co.jp のURLではありません: ${input}`);
  const m = u.pathname.match(/^\/products\/(\d+)\/?$/);
  if (!m) throw new Error(`商品ページのURLではありません: ${input}`);
  return `https://clover.co.jp/products/${m[1]}`;
}

async function fetchProduct(productUrl) {
  const res = await fetch(productUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (MC Square price list updater)' } });
  if (!res.ok) throw new Error(`取得に失敗しました (${res.status}): ${productUrl}`);
  const html = await res.text();
  const num = html.match(/品番号：\s*([0-9A-Za-z-]+)/);
  const price = html.match(/<em>([\d,]+)円<\/em>（税込み）/);
  const title = html.match(/<meta property="og:title" content="([^"]+)"/) || html.match(/<title>([^<]+)<\/title>/);
  if (!num) throw new Error(`品番が見つかりません: ${productUrl}`);
  if (!price) throw new Error(`税込価格が見つかりません: ${productUrl}`);
  if (!title) throw new Error(`商品名が見つかりません: ${productUrl}`);
  const name = decode(title[1]).replace(/\u3000/g, ' ').replace(/\s*[|｜].*$/, '').trim();
  return {
    id: `clover-${num[1]}`,
    productNumber: num[1],
    name,
    price: Number(price[1].replace(/,/g, '')),
    productUrl,
  };
}

async function main() {
  const urls = process.argv.slice(2);
  if (urls.length === 0) {
    console.error('使い方: node scripts/add-clover-product.js <clover.co.jp 商品URL> [...]');
    process.exit(1);
  }
  const lists = FILES.map((f) => fs.readFileSync(f, 'utf8'));
  if (lists[0] !== lists[1]) throw new Error('2つの価格表の内容が一致していません。先に揃えてください。');
  const list = JSON.parse(lists[0]);
  let added = 0;
  for (const raw of urls) {
    const productUrl = normalizeUrl(raw);
    if (list.some((p) => p.productUrl === productUrl)) {
      console.log(`登録済み: ${productUrl}`);
      continue;
    }
    const p = await fetchProduct(productUrl);
    if (list.some((x) => x.id === p.id)) {
      console.log(`登録済み (${p.id}): ${productUrl}`);
      continue;
    }
    list.push(p);
    added += 1;
    console.log(`追加: ${p.id} ${p.name} ${p.price.toLocaleString()}円`);
  }
  if (added === 0) return;
  const out = JSON.stringify(list, null, 1) + '\n';
  for (const f of FILES) fs.writeFileSync(f, out);
  console.log(`${added}件を追加しました（2つのファイルを更新）`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
