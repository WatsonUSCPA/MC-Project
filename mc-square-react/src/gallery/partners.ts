// クラフトキッチン（/gallery）に掲載するパートナー（提携先）レシピの定義
//
// レシピの出典は Firestore の recipes/{id} に任意の `source` フィールドで指定できます:
//   source: {
//     partner: 'usanko' | 'clover' | 'quiltkon' | 'yasumin' | 'mocopanel',   // 下の PARTNERS の id
//     name?: string,                  // 表示名（省略時はパートナー名）
//     url?: string,                   // 元の動画・ページのURL（https のみ）
//   }
// パートナーの判定は `source.partner` を最優先し、Firebase アカウントを持たないパートナー
// （例: quiltkon は authorId に 'partner-quiltkon' という固定の識別子を入れて登録）も扱えます。
// `source` がまだ無い既存レシピは、投稿アカウント（authorId）からパートナーを判定し、
// 元URLは youtubeUrl → pdfUrl → authorSNS.website の順で補います。

export interface PartnerSns {
  twitter?: string;
  instagram?: string;
  facebook?: string;
  line?: string;
  website?: string;
}

export interface Partner {
  id: string;
  name: string;
  /** 絞り込みチップなど、狭い場所で使う短い表示名 */
  shortName: string;
  /** このパートナーのレシピを登録しているアカウントの uid（または固定の識別子） */
  authorIds: string[];
  /** パートナーの公式ページ（出典リンクが無い場合の予備） */
  website?: string;
  /** 公開フォルダのアイコン（例: /gallery/partners/clover.webp） */
  icon?: string;
  /**
   * 作り手行に出す公式リンク。パートナーレシピでは Firestore の authorSNS よりこちらを使う。
   * 確認できた公式URLだけを入れる。
   */
  sns?: PartnerSns;
  /**
   * 作り方（説明文・手順）を載せてよいか。false のパートナーは「材料（サイズ付き）＋動画＋サムネ＋リンク」だけ。
   * 今は SEO 用の HTML（netlify/edge-lib/recipe-seo.js）だけがこの値を見る。
   * 投稿者が自分で細かいレシピを載せるようになったら、その投稿者を true にする。
   * 変えるときは netlify/lib/partners.js と netlify/edge-lib/recipe-seo.js も同じ値にする。
   */
  allowInstructions: boolean;
}

export const PARTNERS: Partner[] = [
  {
    id: 'usanko',
    name: 'うさんこチャンネル',
    shortName: 'うさんこチャンネル',
    authorIds: ['lovFHr9YdbWWcBel0JWBu9kAcU52'],
    website: 'https://www.youtube.com/@usanko_ch',
    icon: '/gallery/partners/usanko.webp',
    sns: {
      instagram: 'https://www.instagram.com/usanko_ch/',
      twitter: 'https://x.com/RURUN_tantan',
      website: 'https://www.youtube.com/@usanko_ch',
    },
    allowInstructions: false,
  },
  {
    id: 'clover',
    name: 'クロバー株式会社',
    shortName: 'クロバー',
    authorIds: ['3hVe8DKmhGQnxWE7DmAOREuHgJH3'],
    website: 'https://clover.co.jp/',
    icon: '/gallery/partners/clover.webp',
    sns: {
      instagram: 'https://www.instagram.com/info_clover/',
      twitter: 'https://x.com/info_clover',
      website: 'https://clover.co.jp/',
    },
    allowInstructions: true,
  },
  {
    id: 'quiltkon',
    name: 'Kon｜ミシンキルト',
    shortName: 'Kon｜ミシンキルト',
    authorIds: ['partner-quiltkon'],
    website: 'https://www.youtube.com/@p_quiltkon',
    icon: '/gallery/partners/quiltkon.webp',
    sns: {
      instagram: 'https://www.instagram.com/p_quiltkon/',
      website: 'https://www.youtube.com/@p_quiltKon',
    },
    allowInstructions: false,
  },
  {
    id: 'yasumin',
    name: 'Handmade creator（yasumin）',
    shortName: 'yasumin',
    authorIds: ['partner-yasumin'],
    website: 'https://www.youtube.com/@yasumin',
    icon: '/gallery/partners/yasumin.webp',
    sns: {
      instagram: 'https://www.instagram.com/yasuminsmini/',
      website: 'https://yasumin.stores.jp/',
    },
    allowInstructions: false,
  },
  {
    // もこぱねるSTORE：フリーステッチング（パンチニードル）で、100円ショップの巾着や缶ケースを
    // もこもこ刺繍でアレンジする作品を紹介している刺繍作家さん。
    id: 'mocopanel',
    name: 'もこぱねるSTORE',
    shortName: 'もこぱねる',
    authorIds: ['partner-mocopanel'],
    website: 'https://www.youtube.com/@moco_panel',
    icon: '/gallery/partners/mocopanel.webp',
    sns: {
      instagram: 'https://www.instagram.com/moco_panel/',
      website: 'https://lit.link/mocopanel',
    },
    allowInstructions: false,
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

export const isHttpsUrl = (url: unknown): url is string => {
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

/** パートナーは確認済みの公式リンクを使い、それ以外はレシピの authorSNS をそのまま使う */
export const partnerSns = (
  partner?: Partner | null,
  authorSNS?: PartnerSns | Record<string, string> | null,
): PartnerSns => {
  if (partner?.sns) return partner.sns;
  if (!authorSNS) return {};
  const out: PartnerSns = {};
  (['twitter', 'instagram', 'facebook', 'line', 'website'] as const).forEach((key) => {
    const v = authorSNS[key];
    if (isHttpsUrl(v)) out[key] = v;
  });
  return out;
};
