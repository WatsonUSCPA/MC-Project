// 仮想Netlifyサーバー
// APIキーを安全に隠すためのローカルサーバー

const express = require('express');
const stripe = require('stripe')('sk_test_51RarFpLF1d53iQAwAso92YvFVJaUI9e3CFGZbZtfOpkMSeGg5JJe5czCz56xlPsWvSjtattMFgGMbA6M4sUAiCWe002TKm5cPS');
const cors = require('cors');

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

// Stripe Checkout Session作成エンドポイント（Netlify Functionsと同じ機能）
app.post('/create-checkout-session', async (req, res) => {
  console.log('決済リクエストを受信:', req.body);

  try {
    const { line_items, mode, success_url, cancel_url, metadata } = req.body;

    if (!line_items || line_items.length === 0) {
      console.error('エラー: カートが空です');
      return res.status(400).json({ error: 'カートが空です' });
    }

    console.log('Stripeセッションを作成中...');

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

    console.log('Stripeセッション作成成功. ID:', session.id);

    res.json({ url: session.url });

  } catch (error) {
    console.error('Stripeエラー:', error);
    res.status(500).json({ 
      error: '決済セッションの作成に失敗しました',
      details: error.message 
    });
  }
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