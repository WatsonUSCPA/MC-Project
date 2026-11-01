#!/usr/bin/env node
// クロバーのレシピページ（clover.co.jp/recipe/<slug>）から「作り方PDF」のリンクを取得し、
// mc-square-react/src/shared/cloverRecipePdfs.json に { slug: [{ label, url }] } で保存する。
// PDF 自体はダウンロード・転載しない（クロバー公式の PDF へリンクするだけ）。
// PDF がないレシピは [] を保存（レシピ詳細ページではクロバーのレシピページへのリンクにフォールバック）。
//
// 使い方:
//   node scripts/fetch-clover-pdfs.js girlsetup simple_machi_mask   # slug を指定
//   node scripts/fetch-clover-pdfs.js --file slugs.txt              # 1行1slug のファイル
//   node scripts/fetch-clover-pdfs.js --refresh                     # 保存済みの全 slug を取り直す
// オプション: --delay <ms>（1件ごとの待ち時間、既定 800ms）
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'mc-square-react/src/shared/cloverRecipePdfs.json');
const UA = 'Mozilla/5.0 (MC Square recipe PDF link updater)';

const decode = (s) => String(s || '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
const delay = Number(opt('--delay') || 800);
const file = opt('--file');
const refresh = args.includes('--refresh');

const data = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
let slugs = args.filter((a) => !a.startsWith('--'));
if (file) slugs.push(...fs.readFileSync(file, 'utf8').split(/\s+/).filter(Boolean));
if (refresh) slugs.push(...Object.keys(data));
slugs = [...new Set(slugs.map((s) => s.replace(/^https?:\/\/(www\.)?clover\.co\.jp\/recipe\//, '').replace(/[/?#].*$/, '')))];
if (!slugs.length) { console.error('slug を指定してください'); process.exit(1); }

// 「作り方PDF」見出し直後の <ul class="link pdf"> からリンクを取り出す
const extractPdfs = (html) => {
  const m = html.match(/<h5>\s*作り方PDF\s*<\/h5>\s*<ul[^>]*>([\s\S]*?)<\/ul>/);
  if (!m) return [];
  const out = [];
  const re = /<a[^>]*href=['"]([^'"]+\.pdf)['"][^>]*>([\s\S]*?)<\/a>/gi;
  let a;
  while ((a = re.exec(m[1]))) {
    const url = new URL(decode(a[1]), 'https://clover.co.jp/').href.replace('://www.clover.co.jp', '://clover.co.jp');
    const label = decode(a[2].replace(/<[^>]+>/g, '')).replace(/[\s\u3000]+/g, ' ').trim();
    if (!out.some((p) => p.url === url)) out.push({ label, url });
  }
  return out;
};

(async () => {
  let withPdf = 0, failed = 0;
  for (const [i, slug] of slugs.entries()) {
    try {
      const res = await fetch(`https://clover.co.jp/recipe/${encodeURIComponent(slug)}`, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const pdfs = extractPdfs(await res.text());
      data[slug] = pdfs;
      if (pdfs.length) withPdf++;
      console.log(`[${i + 1}/${slugs.length}] ${slug}: ${pdfs.length} PDF`);
    } catch (e) {
      failed++;
      console.warn(`[${i + 1}/${slugs.length}] ${slug}: 失敗 (${e.message})`);
    }
    if (i < slugs.length - 1) await new Promise((r) => setTimeout(r, delay));
  }
  const sorted = Object.fromEntries(Object.keys(data).sort().map((k) => [k, data[k]]));
  fs.writeFileSync(OUT, JSON.stringify(sorted, null, 1) + '\n');
  console.log(`完了: ${slugs.length}件中 PDFあり ${withPdf}件 / 失敗 ${failed}件 → ${path.relative(process.cwd(), OUT)}`);
})();
