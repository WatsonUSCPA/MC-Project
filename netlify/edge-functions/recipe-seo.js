// レシピ詳細（/gallery/detail/:id）の HTML に、レシピ名・材料・OGP・構造化データを差し込む
// 失敗したとき（不正なID、パートナー以外、取得の遅延・エラー）は、いつもの index.html をそのまま返す
// レシピは Firestore を直接読まず、キャッシュ済みの recipe-detail 関数（Netlify Blobs＋CDN）から取る
import { isValidId, toRecipeFromDetail, buildMeta, injectIntoHtml } from '../edge-lib/recipe-seo.js';

const FETCH_TIMEOUT_MS = 2500;

async function fetchRecipe(id, request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const detailUrl = new URL(`/.netlify/functions/recipe-detail?id=${encodeURIComponent(id)}`, request.url);
    const res = await fetch(detailUrl, { signal: controller.signal });
    if (!res.ok) return null;
    return toRecipeFromDetail(await res.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export default async (request, context) => {
  const url = new URL(request.url);
  const id = decodeURIComponent(url.pathname.replace(/^\/gallery\/detail\//, '').replace(/\/$/, ''));
  if (!isValidId(id)) return context.next();

  const [page, recipe] = await Promise.all([context.next(), fetchRecipe(id, request)]);
  if (!recipe || !page.ok || !(page.headers.get('content-type') || '').includes('text/html')) return page;

  const html = injectIntoHtml(await page.text(), buildMeta(recipe));
  if (!html) return page;

  const headers = new Headers(page.headers);
  headers.delete('content-length');
  headers.delete('etag');
  // ブラウザは毎回確認、Netlify の CDN では10分キャッシュ（新しいレシピは最大10分で反映）
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  headers.set('Netlify-CDN-Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
  return new Response(html, { status: 200, headers });
};

export const config = { path: '/gallery/detail/*', cache: 'manual' };
