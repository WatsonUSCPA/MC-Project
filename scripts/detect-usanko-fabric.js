#!/usr/bin/env node
// YouTube の説明欄から「うさんこクラブの布」を使った作品かどうかを判定する。
// 毎日のレシピ投稿でも、過去分のバックフィルでも使う共通ロジック。
//
// 使い方:
//   node scripts/detect-usanko-fabric.js <説明欄テキストのファイル>   … 結果をJSONで表示
//   echo "説明欄" | node scripts/detect-usanko-fabric.js -            … 標準入力から
//   require('./detect-usanko-fabric').detectUsankoFabric(text)        … 他のスクリプトから
//
// 判定（いずれか1つで一致）:
//   - 「うさんこクラブの布」という文言
//   - 「うさんこクラブ」の布（かぎかっこ付き）
//   - MC Square BASE の うさんこクラブ商品 items/82602384 へのリンク
// suspicious: 他の生地名（フレンチジェネラル等）も書かれている → 定型文が残っているだけの可能性あり。人の目で確認する。

const RULES = [
  { reason: 'text:うさんこクラブの布', re: /うさんこクラブの布/ },
  { reason: 'text:「うさんこクラブ」の布', re: /[「『]うさんこクラブ[」』]\s*の布/ },
  { reason: 'link:items/82602384', re: /thebase\.in\/items\/82602384/ },
];
const OTHER_FABRICS = [
  /フレンチ\s*ジェネラル/i, /french\s*general/i, /リバティ/, /liberty/i, /moda\b/i, /ムーンライト/,
  /おうちにある布/, /手持ちの布/, /はぎれ/,
];

function detectUsankoFabric(text) {
  const t = String(text || '');
  const reasons = RULES.filter((r) => r.re.test(t)).map((r) => r.reason);
  const others = OTHER_FABRICS.map((re) => (t.match(re) || [])[0]).filter(Boolean);
  const match = reasons.length > 0;
  return {
    match,
    reasons,
    suspicious: match && others.length > 0,
    otherFabrics: [...new Set(others)],
    // Firestore に書くフィールド（一致したときだけ付ける）
    fields: match ? { series: ['usanko-club'] } : null, // arrayUnion で追加する
  };
}

module.exports = { detectUsankoFabric };

if (require.main === module) {
  const fs = require('fs');
  const arg = process.argv[2];
  if (!arg) { console.error('usage: detect-usanko-fabric.js <file|->'); process.exit(2); }
  const text = fs.readFileSync(arg === '-' ? 0 : arg, 'utf8');
  console.log(JSON.stringify(detectUsankoFabric(text), null, 2));
}
