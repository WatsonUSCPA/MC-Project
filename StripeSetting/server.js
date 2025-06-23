// Stripe決済用サーバーサイドAPIの例
// このファイルは参考用です。実際の実装では、お使いのサーバー環境に合わせて調整してください。

console.log('Server.js module loading...'); // ① モジュールが読み込まれたか確認

require('dotenv').config();
const path = require('path');
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors'); // corsをインポート

let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('Stripe SDK loaded successfully.'); // ② Stripeが初期化されたか確認
} else {
  console.error('FATAL: STRIPE_SECRET_KEY is not defined.'); // ②' APIキーがない場合のエラー
}

const app = express();
const router = express.Router();

// ★★★ ローカル開発用にCORSを許可 ★★★
app.use(cors()); // オリジンを限定せず、すべてのリクエストを許可

// 静的ファイルの提供元をプロジェクトルート（一つ上の階層）に変更
// Netlifyでは、公開フォルダをルートに設定するため、ここでの静的ファイル設定は不要になることが多い
// app.use(express.static(path.join(__dirname, '..')));

router.use(express.json()); // JSONボディを解析するミドルウェア

// 全てのリクエストをログに出力するミドルウェア
router.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.originalUrl}`); // ③ リクエストが届いたか確認
  console.log('Request body:', JSON.stringify(req.body, null, 2)); // ③' ボディの内容を確認
  next();
});

// テスト用のGETルート
router.get('/test', (req, res) => {
  console.log('GET /test route hit successfully!');
  res.status(200).json({ message: 'Test route is working!' });
});

// Stripe Checkout Session作成エンドポイント
router.post('/create-checkout-session', async (req, res) => {
  console.log('POST /create-checkout-session handler entered.'); // ④ ハンドラが呼ばれたか確認

  if (!stripe) {
    console.error('Stripe is not initialized. Cannot create session.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const { line_items, mode, success_url, cancel_url, metadata } = req.body;

    if (!line_items || line_items.length === 0) {
      console.error('Validation Error: line_items are missing.');
      return res.status(400).json({ error: 'Cart is empty.' });
    }
    
    console.log('Creating Stripe session with a valid cart...'); // ⑤ Stripe処理の直前
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode,
      success_url,
      cancel_url,
      metadata,
      currency: 'jpy',
      locale: 'ja',
      shipping_address_collection: {
        allowed_countries: ['JP'],
      },
    });

    console.log('Stripe session created successfully. ID:', session.id); // ⑥ 成功ログ
    res.json({ url: session.url });
  } catch (error) {
    console.error('--- STRIPE ERROR ---'); // ⑦ エラー発生
    console.error(error);
    console.error('--- END STRIPE ERROR ---');
    res.status(500).json({ error: '決済セッションの作成に失敗しました' });
  }
});

// app.useのパスを修正
// 受付係(Netlify)が/api/を処理してくれるので、サーバーは/api/を意識しないようにする
app.use('/', router);

// Netlifyで実行するためのエクスポート
module.exports.handler = serverless(app);

// ★★★ ローカル開発用にサーバーを起動する処理を追加 ★★★
if (process.env.NODE_ENV !== 'production') {
  const PORT = 4242;
  app.listen(PORT, () => {
    console.log(`開発用サーバーが http://localhost:${PORT} で起動しました`);
  });
}

// 必要な環境変数
// STRIPE_SECRET_KEY=sk_test_... (Stripeの秘密鍵)
// STRIPE_WEBHOOK_SECRET=whsec_... (Webhookの秘密鍵)

// package.jsonの例
/*
{
  "name": "mc-square-stripe",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "stripe": "^14.0.0",
    "dotenv": "^16.3.1"
  },
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
*/ 