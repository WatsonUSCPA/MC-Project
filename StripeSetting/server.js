// Stripe決済用サーバーサイドAPIの例
// このファイルは参考用です。実際の実装では、お使いのサーバー環境に合わせて調整してください。

require('dotenv').config();

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(express.json());
app.use(express.static('.')); // 現在のディレクトリからHTMLファイルを配信

// ルートページ
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/all_products_stripebeta.html');
});

// Stripe Checkout Session作成エンドポイント
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { line_items, mode, success_url, cancel_url, metadata } = req.body;

    // Stripe Checkout Sessionを作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: mode,
      success_url: success_url,
      cancel_url: cancel_url,
      metadata: metadata,
      // 日本の通貨とロケールを設定
      currency: 'jpy',
      locale: 'ja',
      // 配送先情報の収集
      shipping_address_collection: {
        allowed_countries: ['JP'],
      },
      // 配送オプションを削除
      /*
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 400,
              currency: 'jpy',
            },
            display_name: '標準配送',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 3,
              },
              maximum: {
                unit: 'business_day',
                value: 5,
              },
            },
          },
        },
      ],
      */
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({ error: '決済セッションの作成に失敗しました' });
  }
});

// 決済成功時のWebhook処理（オプション）
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 決済成功時の処理
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // 注文データを取得
    const cartItems = JSON.parse(session.metadata.cart_items || '[]');
    
    // ここで注文処理を実装
    // 例：データベースに注文を保存、確認メールを送信など
    console.log('Payment successful for session:', session.id);
    console.log('Cart items:', cartItems);
    
    // 注文確認メール送信の例
    // await sendOrderConfirmationEmail(session.customer_details, cartItems);
  }

  res.json({ received: true });
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

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