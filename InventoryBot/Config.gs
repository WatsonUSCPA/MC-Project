/**
 * 在庫係Bot の設定。
 *
 * 秘密情報（APIキーなど）はここに書かず、スクリプトプロパティに保存する:
 *   XAI_API_KEY          … xAI (Grok) の APIキー（必須）
 *   SERVICE_ACCOUNT_KEY  … Chat アプリ用サービスアカウントの JSON キー全文（必須）
 *   GROK_MODEL           … 使う Grok のモデル名（任意。未設定なら CONFIG.GROK_MODEL_DEFAULT）
 *   ADMIN_EMAILS         … Chat から「指示: ○○」を出せる人のメールアドレス（カンマ区切り）
 *   INVENTORY_SHEET_ID   … 在庫表のスプレッドシートID（setup() が自動で設定）
 *   PHOTO_FOLDER_ID      … 写真保存フォルダのID（setup() が自動で設定）
 */
const CONFIG = {
  TIMEZONE: 'Asia/Tokyo',
  BOT_NAME: '在庫係',
  SHEET_NAME: '在庫',
  ID_PREFIX: 'F-',

  // 催促の時刻（時）と曜日（0=日, 1=月 ... 6=土）
  NAG_HOUR: 10,
  FOLLOWUP_HOUR: 17,
  NAG_WEEKDAYS: [1, 2, 3, 4, 5, 6],

  // Bot の口調
  TONE: '敬語ベースで親しみやすく、でも仕事はきっちり進めさせる。絵文字は1〜2個まで。',

  GROK_MODEL_DEFAULT: 'grok-4',
  GROK_ENDPOINT: 'https://api.x.ai/v1/chat/completions',

  // Grok に渡す会話履歴の最大件数
  HISTORY_TURNS: 8,
};

const STATUS = {
  DRAFT: '入力中',
  DONE: '登録済み',
  CANCELLED: 'キャンセル',
};

/**
 * 在庫表の列定義。並び順がそのままシートの列順になる。
 *   system   … Bot が自動で埋める列
 *   source   … 'photo' = 写真から推定してよい / 'user' = 作業者の発言からのみ埋める
 *   required … 埋まるまで「入力中」のまま催促対象になる
 */
const FIELDS = [
  { key: 'id', label: '管理番号', system: true },
  { key: 'status', label: 'ステータス', system: true },
  { key: 'createdAt', label: '登録日時', system: true },
  { key: 'updatedAt', label: '更新日時', system: true },
  { key: 'reporter', label: '登録者', system: true },
  { key: 'reporterId', label: '登録者ID', system: true },
  { key: 'photos', label: '写真', system: true },
  { key: 'name', label: '商品名', source: 'photo', desc: 'ECで使える短い商品名の案（例: ベージュ小花柄コットン）' },
  { key: 'color', label: '色', source: 'photo', desc: '主な色（例: ベージュ、ネイビー×白）' },
  { key: 'pattern', label: '柄', source: 'photo', desc: '柄の種類（例: 小花柄、ストライプ、無地）' },
  { key: 'material', label: '素材', source: 'photo', desc: '写真からの推定でよい。作業者が言った場合はそちらを優先' },
  { key: 'width', label: '幅(cm)', source: 'user', type: 'number', desc: '生地幅（cm）' },
  { key: 'length', label: '長さ(m)', source: 'user', type: 'number', required: true, desc: '在庫の長さ（m）' },
  { key: 'cost', label: '仕入れ値(円)', source: 'user', type: 'number', desc: '仕入れ値の合計（円）' },
  { key: 'location', label: '保管場所', source: 'user', required: true, desc: '保管している棚・箱など' },
  { key: 'memo', label: 'メモ', source: 'user', desc: 'その他、作業者が伝えた補足' },
];

function editableFields_() {
  return FIELDS.filter(function (f) { return !f.system; });
}

function getProp_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function requireProp_(key) {
  const value = getProp_(key);
  if (!value) throw new Error('スクリプトプロパティ「' + key + '」が未設定です。README の手順を確認してください。');
  return value;
}

function setProp_(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
}

function formatDate_(date, pattern) {
  return Utilities.formatDate(date, CONFIG.TIMEZONE, pattern || 'yyyy/MM/dd HH:mm');
}
