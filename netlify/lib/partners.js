// mc-square-react/src/gallery/partners.ts と同じ定義（サーバー側用）
// allowInstructions：作り方（説明文・手順）を載せてよいか。false は「材料＋動画＋サムネ＋リンク」だけ
const PARTNERS = [
  { id: 'usanko', name: 'うさんこチャンネル', authorIds: ['lovFHr9YdbWWcBel0JWBu9kAcU52'], website: 'https://www.youtube.com/@usanko_ch', icon: '/gallery/partners/usanko.webp', sns: { instagram: 'https://www.instagram.com/usanko_ch/', twitter: 'https://x.com/RURUN_tantan', website: 'https://www.youtube.com/@usanko_ch' }, allowInstructions: false },
  { id: 'clover', name: 'クロバー株式会社', authorIds: ['3hVe8DKmhGQnxWE7DmAOREuHgJH3'], website: 'https://clover.co.jp/', icon: '/gallery/partners/clover.webp', sns: { instagram: 'https://www.instagram.com/info_clover/', twitter: 'https://x.com/info_clover', website: 'https://clover.co.jp/' }, allowInstructions: true },
  // Firebase アカウントを持たないパートナー。authorId には固定の識別子を入れ、判定は source.partner を優先する
  { id: 'quiltkon', name: 'Kon｜ミシンキルト', authorIds: ['partner-quiltkon'], website: 'https://www.youtube.com/@p_quiltkon', icon: '/gallery/partners/quiltkon.webp', sns: { instagram: 'https://www.instagram.com/p_quiltkon/', website: 'https://www.youtube.com/@p_quiltKon' }, allowInstructions: false },
  { id: 'yasumin', name: 'Handmade creator（yasumin）', authorIds: ['partner-yasumin'], website: 'https://www.youtube.com/@yasumin', icon: '/gallery/partners/yasumin.webp', sns: { instagram: 'https://www.instagram.com/yasuminsmini/', website: 'https://yasumin.stores.jp/' }, allowInstructions: false },
  { id: 'mocopanel', name: 'もこぱねるSTORE', authorIds: ['partner-mocopanel'], website: 'https://www.youtube.com/@moco_panel', icon: '/gallery/partners/mocopanel.webp', sns: { instagram: 'https://www.instagram.com/moco_panel/', website: 'https://lit.link/mocopanel' }, allowInstructions: false },
];

const isHttpsUrl = (u) => {
  if (typeof u !== 'string' || !u.trim()) return false;
  try { return new URL(u).protocol === 'https:'; } catch { return false; }
};

function getRecipeSource(data) {
  if (!data) return null;
  const explicit = data.source && typeof data.source === 'object' ? data.source : null;
  const partner = (explicit && PARTNERS.find((p) => p.id === explicit.partner)) ||
    PARTNERS.find((p) => p.authorIds.includes(data.authorId));
  if (!partner) return null;
  const url = [explicit && explicit.url, data.youtubeUrl, data.pdfUrl, data.authorSNS && data.authorSNS.website, partner.website].find(isHttpsUrl);
  const isVideo = !!url && /youtube\.com|youtu\.be/.test(url);
  return {
    partnerId: partner.id,
    name: (explicit && typeof explicit.name === 'string' && explicit.name.trim()) || partner.name,
    url,
    linkLabel: isVideo ? '元の動画を見る' : '元のレシピページを見る',
  };
}

module.exports = { PARTNERS, getRecipeSource, isHttpsUrl };
