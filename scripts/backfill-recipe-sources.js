// クラフトキッチンのレシピに出典（source）フィールドを付けるための一回限りのスクリプト。
// ※ 本番の Firestore を書き換えます。内容を確認してから Wataru さん自身で実行してください。
//
// 使い方:
//   1. Firebase コンソール > プロジェクトの設定 > サービスアカウント で秘密鍵(JSON)を作成し、
//      リポジトリの外に保存（絶対にコミットしない）
//   2. cd scripts && npm install firebase-admin
//   3. まず確認だけ（書き込みなし）:
//        GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node backfill-recipe-sources.js
//      問題なければ書き込み:
//        GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node backfill-recipe-sources.js --write
//      公開されている authorEmail も消す場合は --remove-author-email を追加
//
// 付与される形式:
//   source: { partner: 'usanko' | 'clover', name: '表示名', url: '元の動画・ページのURL' }

const admin = require('firebase-admin');

// mc-square-react/src/gallery/partners.ts と同じ内容
const PARTNERS = [
  { id: 'usanko', name: 'うさんこチャンネル', authorIds: ['lovFHr9YdbWWcBel0JWBu9kAcU52'], website: 'https://www.youtube.com/@usanko_ch' },
  { id: 'clover', name: 'クロバー株式会社', authorIds: ['3hVe8DKmhGQnxWE7DmAOREuHgJH3'], website: 'https://clover.co.jp/' },
  { id: 'quiltkon', name: 'Kon｜ミシンキルト', authorIds: ['partner-quiltkon'], website: 'https://www.youtube.com/@p_quiltkon' },
];

const WRITE = process.argv.includes('--write');
const REMOVE_EMAIL = process.argv.includes('--remove-author-email');
const isHttps = (u) => { try { return new URL(u).protocol === 'https:'; } catch { return false; } };

async function main() {
  admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'link-manager-f4ea8' });
  const db = admin.firestore();
  const snap = await db.collection('recipes').get();
  let tagged = 0, skipped = 0;
  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    const partner = (d.source && PARTNERS.find((p) => p.id === d.source.partner)) ||
      PARTNERS.find((p) => p.authorIds.includes(d.authorId));
    if (!partner) { skipped++; console.log('skip (not partner):', docSnap.id, d.authorName); continue; }
    const url = [d.source && d.source.url, d.youtubeUrl, d.pdfUrl, d.authorSNS && d.authorSNS.website, partner.website].find(isHttps);
    const name = (d.source && typeof d.source.name === 'string' && d.source.name.trim()) || partner.name;
    const update = { source: { partner: partner.id, name, ...(url ? { url } : {}) } };
    if (REMOVE_EMAIL && 'authorEmail' in d) update.authorEmail = admin.firestore.FieldValue.delete();
    console.log(WRITE ? 'update' : 'would update', docSnap.id, JSON.stringify(update.source), REMOVE_EMAIL ? '(remove authorEmail)' : '');
    if (WRITE) await docSnap.ref.update(update);
    tagged++;
  }
  console.log(`\n${WRITE ? 'updated' : 'would update'} ${tagged}, skipped ${skipped}${WRITE ? '' : '  (dry run: add --write to apply)'}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
