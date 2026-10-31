import { buildMailOrderHref, MAX_MAILTO_LENGTH } from './mailOrder';

const decodeBody = (href: string) => decodeURIComponent(href.split('&body=')[1]);

test('注文内容とお客様情報の欄が入る', () => {
  const href = buildMailOrderHref(
    [{ managementNumber: 'clover-57-232', name: '刺し子針', price: '440', quantity: 2, productType: 'clover' }],
    { subtotal: 880, shipping: 400, total: 1280 },
  );
  expect(href.startsWith('mailto:retail@mcsquareofficials.com?subject=')).toBe(true);
  expect(decodeURIComponent(href.split('subject=')[1].split('&')[0])).toBe('【ご注文】MC Square オンラインショップ');
  const body = decodeBody(href);
  expect(body).toContain('刺し子針');
  expect(body).toContain('57-232');
  expect(body).toContain('440円 × 2点 ＝ 880円');
  expect(body).toContain('合計：1,280円');
  expect(body).toContain('お名前：');
  expect(body).toContain('\r\n');
  expect(href.length).toBeLessThanOrEqual(MAX_MAILTO_LENGTH);
});

test('商品が多いときは短くして長さの上限に収める', () => {
  const items = Array.from({ length: 40 }, (_, i) => ({
    managementNumber: `clover-57-${100 + i}`, name: 'とても長い商品名のクロバーの手芸道具セット〈大〉', price: 1980, quantity: 3,
  }));
  const href = buildMailOrderHref(items, { subtotal: 237600, shipping: 0, total: 237600 });
  expect(href.length).toBeLessThanOrEqual(MAX_MAILTO_LENGTH);
  expect(decodeBody(href)).toContain('ほか');
  expect(decodeBody(href)).toContain('ご要望：');
});
