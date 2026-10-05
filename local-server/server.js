// 仮想Netlifyサーバー（ローカル開発用）
// 本番の Netlify Function（netlify/functions/create-checkout-session.js）をそのまま呼び出すので、
// 価格・送料の計算ロジックはローカルと本番で共通です。

require('dotenv').config();

// Stripe秘密鍵は環境変数（local-server/.env の STRIPE_SECRET_KEY）からのみ読み込みます。
// コードに鍵を直接書かないでください。
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY が設定されていません。local-server/.env に sk_test_... を設定してください。');
  process.exit(1);
}
// 決済後の戻り先（ローカルのReactアプリ）
process.env.SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

const express = require('express');
const cors = require('cors');
const { handler: createCheckoutSession } = require('../netlify/functions/create-checkout-session');

const app = express();

// CORS設定（Reactアプリからのアクセスを許可）
app.use(cors({
  origin: 'http://localhost:3000', // ReactアプリのURL
  credentials: true
}));

app.use(express.json());

// テスト用のエンドポイント
app.get('/test', (req, res) => {
  res.json({ message: '仮想Netlifyサーバーが正常に動作しています！' });
});

// Stripe Checkout Session作成エンドポイント（Netlify Functionと同じ処理）
app.post('/create-checkout-session', async (req, res) => {
  const result = await createCheckoutSession({
    httpMethod: 'POST',
    headers: req.headers,
    body: JSON.stringify(req.body || {}),
  });
  res.status(result.statusCode).type('application/json').send(result.body);
});

// サーバー起動
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 仮想Netlifyサーバーが起動しました！`);
  console.log(`📍 サーバーURL: http://localhost:${PORT}`);
  console.log(`🔗 テスト用: http://localhost:${PORT}/test`);
  console.log(`💳 Stripe決済: http://localhost:${PORT}/create-checkout-session`);
  console.log(`📱 Reactアプリ: http://localhost:3000`);
});
