// クラフトキッチン（/gallery）に掲載するパートナー（提携先）レシピの定義
//
// レシピの出典は Firestore の recipes/{id} に任意の `source` フィールドで指定できます:
//   source: {
//     partner: 'usanko' | 'clover' | 'quiltkon',   // 下の PARTNERS の id
//     name?: string,                  // 表示名（省略時はパートナー名）
//     url?: string,                   // 元の動画・ページのURL（https のみ）
//   }
// パートナーの判定は `source.partner` を最優先し、Firebase アカウントを持たないパートナー
// （例: quiltkon は authorId に 'partner-quiltkon' という固定の識別子を入れて登録）も扱えます。
// `source` がまだ無い既存レシピは、投稿アカウント（authorId）からパートナーを判定し、
// 元URLは youtubeUrl → pdfUrl → authorSNS.website の順で補います。

export interface Partner {
  id: string;
  name: string;
  /** 絞り込みチップなど、狭い場所で使う短い表示名 */
  shortName: string;
  /** このパートナーのレシピを登録しているアカウントの uid（または固定の識別子） */
  authorIds: string[];
  /** パートナーの公式ページ（出典リンクが無い場合の予備） */
  website?: string;
}

export const PARTNERS: Partner[] = [
  {
    id: 'usanko',
    name: 'うさんこチャンネル',
    shortName: 'うさんこチャンネル',
    authorIds: ['lovFHr9YdbWWcBel0JWBu9kAcU52'],
    website: 'https://www.youtube.com/@usanko_ch',
  },
  {
    id: 'clover',
    name: 'クロバー株式会社',
    shortName: 'クロバー',
    authorIds: ['3hVe8DKmhGQnxWE7DmAOREuHgJH3'],
    website: 'https://clover.co.jp/',
  },
  {
    id: 'quiltkon',
    name: 'Kon｜ミシンキルト',
    shortName: 'Kon｜ミシンキルト',
    authorIds: ['partner-quiltkon'],
    website: 'https://www.youtube.com/@p_quiltkon',
  },
];

export const findPartner = (id: unknown): Partner | undefined =>
  typeof id === 'string' ? PARTNERS.find(p => p.id === id) : undefined;

export interface RecipeSource {
  partner: Partner;
  name: string;
  url?: string;
  /** 出典リンクのラベル（動画 / レシピページ） */
  linkLabel: string;
}

const isHttpsUrl = (url: unknown): url is string => {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
};

/** レシピデータ（Firestore の data()）からパートナー出典を求める。パートナー以外は null */
export const getRecipeSource = (data: any): RecipeSource | null => {
  if (!data) return null;
  const explicit = data.source && typeof data.source === 'object' ? data.source : null;
  const partner =
    findPartner(explicit?.partner) ||
    PARTNERS.find(p => p.authorIds.includes(data.authorId));
  if (!partner) return null;

  const candidates = [explicit?.url, data.youtubeUrl, data.pdfUrl, data.authorSNS?.website, partner.website];
  const url = candidates.find(isHttpsUrl);
  const isVideo = !!url && /youtube\.com|youtu\.be/.test(url);
  return {
    partner,
    name: (typeof explicit?.name === 'string' && explicit.name.trim()) || partner.name,
    url,
    linkLabel: isVideo ? '元の動画を見る' : '元のレシピページを見る',
  };
};

export const isPartnerRecipe = (data: any): boolean => getRecipeSource(data) !== null;
