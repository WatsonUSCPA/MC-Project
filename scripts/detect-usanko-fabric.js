#!/usr/bin/env node
// YouTube の説明欄から「うさんこクラブの布」を使った作品かどうかを判定する。
// 毎日のレシピ投稿でも、過去分のバックフィルでも使う共通ロジック。
//
// 使い方:
//   node scripts/detect-usanko-fabric.js <説明欄ファイル> [公開日ISO] … 結果をJSONで表示
//   echo "説明欄" | node scripts/detect-usanko-fabric.js -            … 標準入力から
//   require('./detect-usanko-fabric').detectUsankoFabric(text)        … 他のスクリプトから
//
// 判定（Wataru さんのルール）:
//   1. 説明欄の「🌟今回使用している布🌟」セクション、または「今回の布は〜」「布は〜を使っています」等の文だけを見る
//   2. 宣伝の定型文（クラブをはじめた/ご入会/入会も退会も/神戸大丸バックナンバー/Instagram案内/mcsquare.thebase.in）は無視
//   3. そこに うさんこクラブ → 使用（タグ付け対象）
//   4. 他の布だけ（ソレアード・リバティ等）→ 不使用
//   5. 公開日が 2022-12-13（クラブ開始）より前 → 不使用
//   6. 記載なし → 不明（使用とは推測しない）
//   7. 使用だが他の布（裏布・ポケット等のラミネート/リバティ/はぎれ等）も書いてある → 一部使用（タグ付け対象・備考あり）

const CLUB_START = '2022-12-13'; // うさんこクラブ開始日。これより前の公開は「不使用」
const HEADING = /今回使用している布|今回使った布|使用している布🌟|使用した布🌟/;
const FABRIC_SENTENCE = /(今回の布は|今回使用している布は|今回使用する布は|使用する布は|使った布は|使っている布は|布は.{0,40}(使って|使用して|使いました)|の布を使(って|用)|で仕立て|今回は.{0,30}(の布|ハギレ|はぎれ|生地))/;
// 宣伝の定型文（判定に使わない）
const BOILERPLATE = [
  /うさんこクラブ(の|という)?の?というのをはじめた/, /ご入会は随時募集/, /入会も退会も/, /エムシースクエアさんへご連絡/,
  /神戸大丸/, /バックナンバー/, /エムシースクエアさんのInstagram/, /mcsquare\.thebase\.in/,
];
const USANKO = /うさんこクラブ|うさんこ\s*クラブ/;
const OTHER_FABRICS = [
  ['フレンチジェネラル', /フレンチ\s*ジェネラル|french\s*general/i], ['リバティ', /リバティ|liberty/i], ['ソレアード', /ソレイ?ア?ード|souleiado/i],
  ['ラミネート', /ラミネート/], ['はぎれ', /はぎれ|ハギレ/], ['moda', /\bmoda\b|モダファブリックス/i], ['手持ちの布', /手持ちの布|おうちにある布|家にある布/],
  ['ウィリアム・モリス', /モリス/], ['帆布', /帆布/], ['デニム', /デニム/], ['リネン', /リネン/], ['キャンバス', /キャンバス/],
];
const PART = /(裏布|裏地|内布|ポケット|持ち手|タブ|マチ|底)/;

const isBoiler = (l) => BOILERPLATE.some((re) => re.test(l));
const othersIn = (l) => OTHER_FABRICS.filter(([, re]) => re.test(l)).map(([n]) => n);

/**
 * @param {string} text YouTube 説明欄
 * @param {string} [publishedAt] 公開日（ISO）
 * @returns {{verdict:'使用'|'一部使用'|'不使用'|'不明', evidence:string, note:string, match:boolean, fields:object|null}}
 */
function detectUsankoFabric(text, publishedAt) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim());
  const res = (verdict, evidence = '', note = '') => {
    const match = verdict === '使用' || verdict === '一部使用';
    return { verdict, evidence: evidence.slice(0, 120), note, match, fields: match ? { series: ['usanko-club'] } : null };
  };
  if (publishedAt && String(publishedAt).slice(0, 10) < CLUB_START) return res('不使用', '', `公開日 ${String(publishedAt).slice(0, 10)} はクラブ開始（${CLUB_START}）前`);

  // 「今回使用している布」セクション（見出しの次の行から空行まで）＋「今回の布は〜」などの文
  const section = [];
  lines.forEach((l, i) => {
    if (HEADING.test(l)) {
      if (l.replace(/[🌟\s]/g, '').length > 12) section.push(l); // 見出しと同じ行に本文がある場合
      for (let j = i + 1; j < lines.length && lines[j]; j++) section.push(lines[j]);
    } else if (FABRIC_SENTENCE.test(l)) section.push(l);
  });
  const fabricLines = [...new Set(section)].filter((l) => l && !isBoiler(l) && !/^https?:\/\//.test(l) && !/^▶️?\s*https?:/.test(l));
  if (!fabricLines.length) return res('不明', '', '説明欄に「今回使った布」の記載なし');

  const usankoLine = fabricLines.find((l) => USANKO.test(l));
  const otherLines = fabricLines.filter((l) => othersIn(l).length);
  if (usankoLine) {
    const parts = otherLines.filter((l) => l !== usankoLine || PART.test(l));
    if (parts.length) {
      const names = [...new Set(parts.flatMap(othersIn))].join('・');
      return res('一部使用', usankoLine, `他の布の記載あり（${names}）: ${parts[0].slice(0, 80)}`);
    }
    return res('使用', usankoLine);
  }
  if (otherLines.length) return res('不使用', otherLines[0], `うさんこクラブ以外の布のみ（${[...new Set(otherLines.flatMap(othersIn))].join('・')}）`);
  return res('不明', fabricLines[0], '布の記載はあるが、うさんこクラブとも他の布とも書いていない');
}

module.exports = { detectUsankoFabric };

if (require.main === module) {
  const fs = require('fs');
  const arg = process.argv[2];
  if (!arg) { console.error('usage: detect-usanko-fabric.js <file|->'); process.exit(2); }
  const text = fs.readFileSync(arg === '-' ? 0 : arg, 'utf8');
  console.log(JSON.stringify(detectUsankoFabric(text, process.argv[3]), null, 2)); // 第2引数: 公開日（任意）
}
