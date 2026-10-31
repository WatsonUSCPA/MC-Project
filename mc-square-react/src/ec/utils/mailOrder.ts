// カートの内容から「メールで注文する」用の mailto: リンクを作る
// - 宛先: retail@mcsquareofficials.com
// - 本文に 商品名・品番/ID・数量・単価・小計、合計、お客様の記入欄を入れる
// - mailto は長すぎるとメールアプリで切れたり開かなかったりするため、
//   全体を MAX_MAILTO_LENGTH 文字以内に収める（収まらなければ行を短くする）

export const MAIL_ORDER_TO = 'retail@mcsquareofficials.com';
export const MAIL_ORDER_SUBJECT = '【ご注文】MC Square オンラインショップ';
// Windows（Outlook 等）で安全に開ける長さの目安（約2,000文字）
export const MAX_MAILTO_LENGTH = 1900;

export interface MailOrderItem {
  managementNumber: string;
  name: string;
  price: string | number;
  quantity: number;
  productType?: string;
}

export interface MailOrderTotals { subtotal: number; shipping: number; total: number; }

const yen = (n: number) => `${n.toLocaleString('ja-JP')}円`;
const priceOf = (item: MailOrderItem) => Number(String(item.price).replace(/[^\d.]/g, '')) || 0;
/** 品番/ID（クロバーは「clover-」を外して品番だけにする） */
export const itemCode = (item: MailOrderItem) => String(item.managementNumber || '').replace(/^clover-/, '');
const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// 商品行の書き方（詳しい順）。長すぎるときは下の書き方に切り替える
const ITEM_FORMATS: ((item: MailOrderItem) => string)[] = [
  (i) => `・${i.name}\n　品番/ID：${itemCode(i)}　${yen(priceOf(i))} × ${i.quantity}点 ＝ ${yen(priceOf(i) * i.quantity)}`,
  (i) => `・${cut(i.name, 24)}［${itemCode(i)}］${yen(priceOf(i))}×${i.quantity}＝${yen(priceOf(i) * i.quantity)}`,
  (i) => `・${cut(i.name, 10)}［${itemCode(i)}］${priceOf(i)}×${i.quantity}＝${priceOf(i) * i.quantity}円`,
  (i) => `・${itemCode(i)} ${priceOf(i)}×${i.quantity}＝${priceOf(i) * i.quantity}円`,
];

function buildBody(itemLines: string[], totals: MailOrderTotals, omitted: number): string {
  return [
    'エムシースクエア オンラインショップ 御中',
    '',
    '以下の内容で注文します。',
    '',
    '■ご注文内容',
    ...itemLines,
    ...(omitted > 0 ? [`ほか${omitted}点（品番・数量を追記してください）`] : []),
    '',
    `小計：${yen(totals.subtotal)}`,
    `送料：${totals.shipping === 0 ? '無料' : yen(totals.shipping)}`,
    `合計：${yen(totals.total)}（税込）`,
    '',
    '■お客様情報',
    'お名前：',
    'ご住所：〒',
    '電話番号：',
    'ご要望：',
    '',
  ].join('\n');
}

const toMailto = (body: string) =>
  `mailto:${MAIL_ORDER_TO}?subject=${encodeURIComponent(MAIL_ORDER_SUBJECT)}&body=${encodeURIComponent(body.replace(/\n/g, '\r\n'))}`;

/** カートの内容から mailto: リンクを作る（MAX_MAILTO_LENGTH 以内） */
export function buildMailOrderHref(items: MailOrderItem[], totals: MailOrderTotals, maxLength = MAX_MAILTO_LENGTH): string {
  // 1) 全商品が収まる、いちばん詳しい書き方を使う
  for (const format of ITEM_FORMATS) {
    const href = toMailto(buildBody(items.map(format), totals, 0));
    if (href.length <= maxLength) return href;
  }
  // 2) それでも長いときは、最短の書き方で入るところまで入れて「ほか◯点」とする
  const shortest = ITEM_FORMATS[ITEM_FORMATS.length - 1];
  let n = items.length - 1;
  while (n > 0) {
    const href = toMailto(buildBody(items.slice(0, n).map(shortest), totals, items.length - n));
    if (href.length <= maxLength) return href;
    n--;
  }
  return toMailto(buildBody([], totals, items.length));
}
