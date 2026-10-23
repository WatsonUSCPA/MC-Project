#!/usr/bin/env node
// YouTube の説明欄から「うさんこクラブの布」を使った作品かどうかを判定する。
// 毎日のレシピ投稿でも、過去分のバックフィルでも使う共通ロジック。
//
// 使い方:
//   node scripts/detect-usanko-fabric.js <説明欄テキストのファイル>   … 結果をJSONで表示
//   echo "説明欄" | node scripts/detect-usanko-fabric.js -            … 標準入力から
//   require('./detect-usanko-fabric').detectUsankoFabric(text)        … 他のスクリプトから
//
// 判定:
//   match   … 「今回使用している布は、うさんこクラブの布です」のように、今回使った布を述べる行に
//              「うさんこクラブ」がある（「🌟今回使用している布🌟」見出しの次の行も含む）
//   weak    … 「うさんこクラブの布」「『うさんこクラブ』の布」や items/82602384 リンクはあるが、
//              バックナンバー・入会案内などの定型文だけ（今回使ったとは書いていない）→ タグは付けない
//   suspicious … match だが、今回使った布の行に他の生地名（フレンチジェネラル等）もある → 人が確認

// 説明欄の下の方には「うさんこクラブの布のバックナンバーは…」「ご入会はこちら」や
// 他の布（フレンチジェネラル・リバティ等）の商品リンクが定型文で毎回入っているため、
// 「今回使った布」を述べている行だけを見る。
const USE_LINE = /(今回|使用|使った|使って|使いました|布は|で仕立て)/;
const BOILERPLATE = /(バックナンバー|入会|募集|はじめた|作りました$)/;
const USANKO = /うさんこクラブ/;
const OTHER_FABRICS = [
  /フレンチ\s*ジェネラル/i, /french\s*general/i, /リバティ/, /liberty/i, /moda\b/i,
  /おうちにある布/, /手持ちの布/, /100均の布|１００均の布|ダイソーの布/,
];

function detectUsankoFabric(text) {
  const lines = String(text || '').split(/\r?\n/);
  const useLines = lines.filter((l) => USE_LINE.test(l) && !BOILERPLATE.test(l));
  const reasons = [];
  const strong = useLines.filter((l) => USANKO.test(l));
  if (strong.length) reasons.push('use-line:' + strong[0].trim().slice(0, 60));
  // 「🌟今回使用している布🌟」の見出しの直後の行
  lines.forEach((l, i) => {
    if (/使用している布|使った布|使用した布/.test(l) && USANKO.test(lines[i + 1] || '') && !strong.length) {
      reasons.push('heading-next:' + lines[i + 1].trim().slice(0, 60));
    }
  });
  const match = reasons.length > 0;
  // 定型文・リンクだけ（今回使った、とは書いていない）は weak として別に返す
  const weak = !match && (USANKO.test(text || '') && /うさんこクラブの布|[「『]うさんこクラブ[」』]\s*の布|thebase\.in\/items\/82602384/.test(text || ''));
  const others = useLines.flatMap((l) => OTHER_FABRICS.map((re) => (l.match(re) || [])[0]).filter(Boolean));
  return {
    match,
    weak,
    reasons,
    suspicious: match && others.length > 0,
    otherFabrics: [...new Set(others)],
    // Firestore に書くフィールド（一致したときだけ。arrayUnion で追加する）
    fields: match ? { series: ['usanko-club'] } : null,
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
