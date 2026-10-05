/**
 * 在庫係Bot の設定。
 *
 * 秘密情報はここに書かず、Apps Script の「スクリプト プロパティ」に保存する:
 *   AI_API_KEY             … OpenRouter の APIキー（必須）
 *   AI_MODEL               … 使うモデル（任意。例: x-ai/grok-4。未設定なら CONFIG.AI_MODEL_DEFAULT）
 *   AI_ENDPOINT            … 任意。OpenRouter 以外（xAI 直接など）を使うときだけ設定
 *   SERVICE_ACCOUNT_KEY    … Chat アプリ用サービスアカウントの JSON キー全文（必須）
 *   CLOUDINARY_CLOUD_NAME  … Cloudinary の Cloud name（必須）
 *   CLOUDINARY_API_KEY     … Cloudinary の API Key（必須）
 *   CLOUDINARY_API_SECRET  … Cloudinary の API Secret（必須）
 *   ADMIN_EMAILS           … Chat から「指示: ○○」を出せる人のメールアドレス（カンマ区切り）
 *   PRODUCT_SHEET_ID       … 任意。在庫管理シートのID（未設定なら CONFIG の値）
 *   PHOTO_FOLDER_ID        … 写真のバックアップ用 Drive フォルダ（setup() が自動で設定）
 */
const CONFIG = {
  TIMEZONE: 'Asia/Tokyo',
  BOT_NAME: '在庫係',

  // 在庫管理シート（EC サイトが読んでいるシート）
  PRODUCT_SHEET_ID_DEFAULT: '1sqR_rn_a7USuT3mpP-BHwsWT8Vi0jdCYcu1Gl2P3Z14',
  PRODUCT_SHEET_NAME: '商品データ履歴',
  FIRST_DATA_ROW: 4, // 1行目: 見出し / 2行目: 会社情報 / 3行目: 見出し / 4行目〜: 商品（新しい順）

  DEFAULT_PRICE: 1100, // 50cm あたりの単価。作業者が言わなければこの値で登録する
  STATUS_PUBLIC: '公開中',
  STATUS_PRIVATE: '非公開',

  // 催促の時刻（時）と曜日（0=日, 1=月 ... 6=土）
  NAG_HOUR: 10,
  FOLLOWUP_HOUR: 17,
  NAG_WEEKDAYS: [1, 2, 3, 4, 5, 6],

  // 売れ残りチェック: アップロードから AGING_MONTHS か月たった公開中の生地を、
  // RECHECK_DAYS 日おきに「まだある？」と聞く（1日 CHECKS_PER_DAY 件まで）
  CHECK_HOUR: 14,
  AGING_MONTHS: 6,
  RECHECK_DAYS: 30,
  CHECKS_PER_DAY: 3,

  TONE: '敬語ベースで親しみやすく、でも仕事はきっちり進めさせる。絵文字は1〜2個まで。',

  AI_ENDPOINT_DEFAULT: 'https://openrouter.ai/api/v1/chat/completions',
  AI_MODEL_DEFAULT: 'x-ai/grok-4',
  HISTORY_TURNS: 8,
};

// 商品データ履歴の列番号
const COL = {
  name: 1,        // A 商品名
  mn: 2,          // B 管理番号
  photo: 3,       // C 写真URL
  price: 4,       // D 値段（50cm の単価）
  magazine: 5,    // E メルマガ発行年月（今は使っていないので空欄）
  status: 6,      // F 公開ステータス
  uploadDate: 7,  // G アップロード日
  archiveDate: 8, // H アーカイブ日
};
const NUM_COLS = 8;

/** 作業者から聞き出す項目 */
const DRAFT_FIELDS = [
  { key: 'name', label: '商品名', desc: 'シリーズ名（例: USA COTTON, GRUNGE, French General）。作業者が言ったとおりに入れる' },
  { key: 'managementNumber', label: '管理番号', desc: '作業者が付けた番号（例: 200-1051, 30150-335）' },
  { key: 'price', label: '値段', type: 'number', desc: '50cmあたりの単価（円）。言われなければ既定値のまま' },
];

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

function todayString_() {
  return formatDate_(new Date(), 'yyyy/MM/dd');
}
