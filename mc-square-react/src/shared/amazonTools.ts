// クラフトキッチン：レシピに合う道具・副資材の Amazon アソシエイトリンク
// - レシピの材料・タイトルに含まれる語から自動で選ぶ（Firestore は変更しない）
// - 生地・キットは当店で売っているので対象外。道具と副資材だけ
// - アソシエイトID（トラッキングID）は環境変数 REACT_APP_AMAZON_ASSOCIATE_TAG で設定

export interface AmazonTool { name: string; note: string; url: string; }

interface ToolRule { keys: string[]; name: string; note: string; query: string; }

// 材料にこの語があれば出す（上から優先）
const TOOL_RULES: ToolRule[] = [
  { keys: ['キルト芯'], name: 'キルト芯', note: 'ふんわり仕上げたいときに', query: 'キルト芯 手芸' },
  { keys: ['接着芯'], name: '接着芯', note: 'アイロンで貼るだけでハリが出る', query: '接着芯 布用 アイロン' },
  { keys: ['ドミット芯'], name: 'ドミット芯', note: 'ふっくら厚みを出したいときに', query: 'ドミット芯' },
  { keys: ['ファスナー'], name: '手芸用ファスナー', note: 'ポーチ・ペンケースに', query: 'ファスナー 手芸 ポーチ用' },
  { keys: ['口金', 'がま口'], name: 'がま口の口金', note: 'がま口づくりに', query: 'がま口 口金 手芸' },
  { keys: ['マグネットホック', 'マグネットボタン'], name: 'マグネットホック', note: 'バッグの口どめに', query: 'マグネットホック 手芸' },
  { keys: ['バイアステープ'], name: 'バイアステープ', note: '縁どり・パイピングに', query: 'バイアステープ 両折' },
  { keys: ['刺繍糸', '刺しゅう糸'], name: '刺繍糸セット', note: 'ステッチや飾りに', query: '刺繍糸 セット 25番' },
  { keys: ['ミシン糸'], name: 'ミシン糸', note: '布に合う色をそろえて', query: 'ミシン糸 60番 セット' },
  { keys: ['手芸わた', '手芸綿', 'わた', 'ポリエステル綿'], name: '手芸わた', note: 'ぬいぐるみ・クッションの詰め物に', query: '手芸わた' },
  { keys: ['ゴム'], name: '手芸用ゴム', note: 'マスク・巾着などに', query: '手芸 平ゴム' },
  { keys: ['Dカン', 'ナスカン'], name: 'Dカン・ナスカン', note: 'ストラップ・持ち手の金具', query: 'Dカン ナスカン セット 手芸' },
  { keys: ['持ち手'], name: 'バッグ用持ち手', note: 'トート・バッグに', query: 'バッグ 持ち手 手芸' },
  { keys: ['スナップ', 'プラスナップ'], name: 'プラスナップ', note: 'ボタン代わりの留め具', query: 'プラスナップ 打ち具 セット' },
];

// 材料からあまり見つからないときに補う、パッチワークの基本道具
const BASIC_TOOLS: ToolRule[] = [
  { keys: [], name: 'ロータリーカッター', note: '布を正確にまっすぐ切れる', query: 'ロータリーカッター 45mm 手芸' },
  { keys: [], name: 'カッティングマット', note: 'ロータリーカッターとセットで', query: 'カッティングマット A3 手芸' },
  { keys: [], name: 'パッチワーク定規', note: '縫い代つきの線が引ける', query: 'パッチワーク定規' },
  { keys: [], name: '布用クリップ', note: 'まち針より手軽にとめられる', query: '布用クリップ 手芸' },
];

const MAX_TOOLS = 4;

const amazonSearchUrl = (query: string) => {
  const tag = process.env.REACT_APP_AMAZON_ASSOCIATE_TAG;
  const params = new URLSearchParams({ k: query });
  if (tag) params.set('tag', tag);
  return `https://www.amazon.co.jp/s?${params.toString()}`;
};

const toTool = (r: ToolRule): AmazonTool => ({ name: r.name, note: r.note, url: amazonSearchUrl(r.query) });

/** レシピの材料・タイトルに合う道具（最大4件。足りない分は基本道具で補う） */
export function amazonToolsForRecipe(recipe: { title: string; ingredients?: string[] }): AmazonTool[] {
  const text = [recipe.title, ...(recipe.ingredients || [])].join(' ');
  const matched = TOOL_RULES.filter((r) => r.keys.some((k) => text.includes(k)));
  return [...matched, ...BASIC_TOOLS].slice(0, MAX_TOOLS).map(toTool);
}
