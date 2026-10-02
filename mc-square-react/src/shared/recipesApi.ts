// クラフトキッチン（レシピ）とショップ商品の軽量データ取得
// - レシピ一覧は Netlify Function（CDNキャッシュ付き）から、画像を含まない約50KBの一覧を1回だけ取得
// - 画像は縮小済みWebPを個別に遅延読み込み
// - 同じページ内では1回だけ取得し、sessionStorage にも10分キャッシュ

export interface RecipeSummary {
  id: string;
  title: string;
  partnerId: string;
  partnerName: string;
  sourceUrl: string | null;
  sourceLabel: string;
  difficulty: string;
  cookingTime: string;
  likes: number;
  views: number;
  createdAt: string | null;
  description: string;
  tags: string[];
  ingredients: string[];
  authorSNS?: Record<string, string>;
  thumb: string;
  image: string;
}

export interface CategoryItem { id: string; name: string; order: number; image: string; }
export interface RecipeIndex { recipes: RecipeSummary[]; keywords: CategoryItem[]; situations: CategoryItem[]; }

export interface AffiliateProduct { name: string; description: string; price: string; productUrl: string; imageUrl: string; }
export interface RecipeDetail extends RecipeSummary {
  ingredients: string[];
  steps: any[];
  pdfUrl?: string;
  youtubeUrl?: string;
  explanationType?: 'video' | 'website' | 'pdf' | 'none';
  websiteExplanation?: string;
  affiliateProducts: AffiliateProduct[];
  mainImageUrl: string;
}

export interface CatalogProduct { managementNumber: string; name: string; price: string | number; imageUrl: string; }
export interface CatalogKit { id: string; name: string; price: string; imageUrl?: string; level?: string; comment?: string; fabricSize?: string; }
export interface Catalog { products: CatalogProduct[]; kits: CatalogKit[]; productsAvailable: boolean; }

const API = '/.netlify/functions';
const SESSION_TTL_MS = 10 * 60 * 1000;
const memo: Record<string, Promise<any> | undefined> = {};

function cachedFetch<T>(key: string, url: string): Promise<T> {
  if (memo[key]) return memo[key] as Promise<T>;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const { at, data } = JSON.parse(raw);
      if (Date.now() - at < SESSION_TTL_MS) {
        memo[key] = Promise.resolve(data);
        return memo[key] as Promise<T>;
      }
    }
  } catch { /* sessionStorage が使えない環境 */ }
  const p = fetch(url, { headers: { Accept: 'application/json' } })
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then((data) => {
      try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data })); } catch { /* 容量オーバー等は無視 */ }
      return data;
    })
    .catch((e) => { memo[key] = undefined; throw e; });
  memo[key] = p;
  return p;
}

export const fetchRecipeIndex = () => cachedFetch<RecipeIndex>('ck:recipes-index:v1', `${API}/recipes-index`);
export const fetchCatalog = () => cachedFetch<Catalog>('ck:catalog:v1', `${API}/catalog`);
export const fetchRecipeDetail = (id: string) =>
  cachedFetch<RecipeDetail>(`ck:recipe:${id}`, `${API}/recipe-detail?id=${encodeURIComponent(id)}`);

const time = (s: string | null) => (s ? new Date(s).getTime() || 0 : 0);
export const sortPopular = (list: RecipeSummary[]) => [...list].sort((a, b) => (b.likes - a.likes) || (b.views - a.views));
export const sortNew = (list: RecipeSummary[]) => [...list].sort((a, b) => time(b.createdAt) - time(a.createdAt));

// ===== レシピ ⇔ 商品のキーワードマッチング =====
// 作品の種類を表す語。レシピ名・キット名の両方に含まれていれば関連ありとみなす
export const CRAFT_KEYWORDS = [
  'コインケース', 'ティッシュ', 'ポーチ', 'トート', 'バッグ', '巾着', 'ペンケース', '小物入れ', 'ボックス',
  'ファスナー', 'マチ', 'キルト', 'パッチワーク', 'タペストリー', 'クッション', 'エプロン', 'マスク',
  'ハロウィン', 'かぼちゃ', 'クリスマス', 'レッスンバッグ', '入園', '入学', 'はぎれ', 'リバティ', 'コースター',
];

export const keywordsIn = (text: string) => CRAFT_KEYWORDS.filter((k) => text.includes(k));

const recipeText = (r: { title: string; description?: string; tags?: string[] }) =>
  [r.title, r.description || '', ...(r.tags || [])].join(' ');

/** キットや商品名などのテキストに関連するレシピ。足りない分は人気順で補う */
export function relatedRecipes(index: RecipeSummary[], text: string, limit = 4, excludeId?: string): RecipeSummary[] {
  const keys = keywordsIn(text);
  const pool = index.filter((r) => r.id !== excludeId);
  const scored = pool
    .map((r) => ({ r, score: keys.filter((k) => recipeText(r).includes(k)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => (b.score - a.score) || (b.r.likes - a.r.likes))
    .map((x) => x.r);
  const rest = sortPopular(pool).filter((r) => !scored.includes(r));
  return [...scored, ...rest].slice(0, limit);
}

/** レシピに合うキット（キット名とレシピ名のキーワード一致） */
export function kitsForRecipe(recipe: { title: string; description?: string; tags?: string[] }, kits: CatalogKit[]): CatalogKit[] {
  const text = recipeText(recipe);
  return kits.filter((k) => keywordsIn(k.name + ' ' + (k.comment || '')).some((key) => text.includes(key)));
}

/** レシピごとに安定したおすすめ生地（毎回同じ組み合わせになるようIDで決める） */
export function fabricPicksForRecipe(recipeId: string, products: CatalogProduct[], count = 4): CatalogProduct[] {
  if (!products.length) return [];
  let h = 0;
  for (const ch of recipeId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const out: CatalogProduct[] = [];
  for (let i = 0; i < Math.min(count, products.length); i++) out.push(products[(h + i * 7) % products.length]);
  return Array.from(new Set(out));
}

/** Cloudinary の画像はサムネイル用に縮小して配信 */
export const thumbUrl = (url: string, width = 400) =>
  /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url)
    ? url.replace('/image/upload/', `/image/upload/w_${width},c_limit,f_auto,q_auto/`)
    : url;
