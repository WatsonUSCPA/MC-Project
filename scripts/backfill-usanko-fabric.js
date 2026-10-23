// 投稿済みのうさんこレシピに series に 'usanko-club'（うさんこクラブ）を追加する一回限りのスクリプト。
// ※ 本番の Firestore を書き換えます。Wataru さんの確認後に実行してください。
//
// 入力: 判定済みリスト（JSON配列。各要素に docId, match, 必要なら exclude:true）
//   [{ "docId": "...", "title": "...", "videoId": "...", "match": true, "reasons": [...], "suspicious": false }]
//   verdict（使用/一部使用/不使用/不明）がある場合は 使用・一部使用 だけを対象にする。
//   個別に外したい場合は "exclude": true を付ける。
//
// 使い方:
//   cd scripts && npm install firebase-admin
//   確認だけ: GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node backfill-usanko-fabric.js list.json
//   書き込み: GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node backfill-usanko-fabric.js list.json --write
//   （--skip-suspicious で suspicious・一部使用 を一括で外す）

const fs = require('fs');
const admin = require('firebase-admin');

const file = process.argv[2];
const WRITE = process.argv.includes('--write');
const SKIP_SUS = process.argv.includes('--skip-suspicious');
if (!file) { console.error('usage: backfill-usanko-fabric.js <list.json> [--write] [--skip-suspicious]'); process.exit(2); }

async function main() {
  const list = JSON.parse(fs.readFileSync(file, 'utf8'))
    .filter((r) => (r.verdict ? ['使用', '一部使用'].includes(r.verdict) : r.match) && !r.exclude && !(SKIP_SUS && (r.suspicious || r.verdict === '一部使用')));
  admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'link-manager-f4ea8' });
  const db = admin.firestore();
  let n = 0;
  for (const r of list) {
    const ref = db.collection('recipes').doc(r.docId);
    const snap = await ref.get();
    if (!snap.exists) { console.log('missing', r.docId, r.title); continue; }
    const src = (snap.data().source || {}).partner;
    if (src !== 'usanko') { console.log('skip (not usanko)', r.docId); continue; }
    console.log(WRITE ? 'update' : 'would update', r.docId, r.title);
    if (WRITE) await ref.update({ series: admin.firestore.FieldValue.arrayUnion('usanko-club') });
    n++;
  }
  console.log(`\n${WRITE ? 'updated' : 'would update'} ${n}${WRITE ? '' : '  (dry run: add --write to apply)'}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
