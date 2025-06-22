// Stripe決済用サーバーサイドAPIの例
// このファイルは参考用です。実際の実装では、お使いのサーバー環境に合わせて調整してください。

require('dotenv').config();
const path = require('path');
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const serverless = require('serverless-http');

const app = express();
const router = express.Router();

// 静的ファイルの提供元をプロジェクトルート（一つ上の階層）に変更
// Netlifyでは、公開フォルダをルートに設定するため、ここでの静的ファイル設定は不要になることが多い
// app.use(express.static(path.join(__dirname, '..')));

router.use(express.json());

// Stripe Checkout Session作成エンドポイント
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { line_items, mode, success_url, cancel_url, metadata } = req.body;

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

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({ error: '決済セッションの作成に失敗しました' });
  }
});

// app.useのパスを修正
// 受付係(Netlify)が/api/を処理してくれるので、サーバーは/api/を意識しないようにする
app.use('/', router);

// Netlifyで実行するためのエクスポート
module.exports.handler = serverless(app);

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