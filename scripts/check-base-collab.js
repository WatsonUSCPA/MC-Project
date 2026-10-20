#!/usr/bin/env node
// BASE「インフルエンサーコラボ」ページが今のパーサーで読めるか確認する（秘密情報不要）
// 使い方: node scripts/check-base-collab.js   失敗時は終了コード 1
const { CATEGORY_URL, fetchCollab } = require('../netlify/lib/base-collab');

fetchCollab().then((all) => {
  const live = all.filter((i) => !i.soldOut);
  console.log(`OK: ${all.length} items parsed (${live.length} on sale, ${all.length - live.length} sold out) from ${CATEGORY_URL}`);
  for (const i of live) console.log(`  ¥${i.price ?? '?'}  ${i.title}  ${i.url}  ${i.influencerUrl ? 'influencer✓' : 'no influencer'}`);
}).catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
