# MC Square Stripe決済実装ガイド

## 概要
このガイドでは、MC Squareのショッピングカート機能をStripe決済に接続する方法を説明します。

## 実装内容

### 1. フロントエンド（HTML/JavaScript）
- **ファイル**: `all_products_stripebeta.html`
- **主な変更点**:
  - `proceedToCheckout()`関数を非同期関数に変更
  - カートデータをStripe用の形式に変換
  - Stripe Checkout Session作成APIを呼び出し
  - 決済ページへのリダイレクト処理

### 2. 決済結果ページ
- **成功ページ**: `success.html`
- **キャンセルページ**: `cancel.html`
- 決済完了/キャンセル時のユーザー体験を向上

### 3. サーバーサイドAPI
- **ファイル**: `server-example.js`
- Stripe Checkout Session作成エンドポイント
- Webhook処理（決済成功時の処理）

## セットアップ手順

### 1. Stripeアカウントの準備
1. [Stripe](https://stripe.com)でアカウントを作成
2. ダッシュボードからAPIキーを取得
   - 公開可能キー（pk_test_...）
   - 秘密鍵（sk_test_...）

### 2. サーバー環境のセットアップ
```bash
# Node.jsプロジェクトの初期化
npm init -y

# 必要なパッケージのインストール
npm install express stripe dotenv

# 環境変数ファイルの作成
echo "STRIPE_SECRET_KEY=sk_test_your_key_here" > .env
echo "STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret" >> .env
```

### 3. サーバーの起動
```bash
node server-example.js
```

### 4. Webhookの設定
1. StripeダッシュボードでWebhookエンドポイントを設定
2. エンドポイントURL: `https://your-domain.com/api/webhook`
3. イベント: `checkout.session.completed`

## 決済フロー

1. **商品選択**: ユーザーが商品をカートに追加
2. **決済開始**: 「レジに進む」ボタンをクリック
3. **セッション作成**: サーバーでStripe Checkout Sessionを作成
4. **決済ページ**: Stripeの決済ページにリダイレクト
5. **決済完了**: 成功時は`success.html`、キャンセル時は`cancel.html`に遷移
6. **Webhook処理**: 決済成功時にサーバーで注文処理を実行

## カスタマイズポイント

### 1. 商品情報の調整
```javascript
// 商品データの形式を調整
const lineItems = cart.map(item => ({
  price_data: {
    currency: 'jpy',
    product_data: {
      name: item.name,
      description: `管理番号: ${item.managementNumber}`,
      images: [item.imageUrl]
    },
    unit_amount: priceNum
  },
  quantity: item.quantity
}));
```

### 2. 送料の設定
```javascript
// 送料計算ロジック
const shippingFee = subtotal >= 20000 ? 0 : 400;
```

### 3. 配送オプション
```javascript
// Stripeの配送オプション設定
shipping_options: [
  {
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: { amount: 400, currency: 'jpy' },
      display_name: '標準配送'
    }
  }
]
```

## セキュリティ考慮事項

1. **APIキーの管理**: 環境変数で管理し、Gitにコミットしない
2. **Webhook署名検証**: 必ず実装する
3. **HTTPS**: 本番環境では必ずHTTPSを使用
4. **入力値検証**: フロントエンドとバックエンド両方で実装

## テスト

### テストカード番号
- **成功**: 4242 4242 4242 4242
- **失敗**: 4000 0000 0000 0002
- **3Dセキュア**: 4000 0025 0000 3155

### テスト環境での確認
1. 商品をカートに追加
2. 決済ページへの遷移を確認
3. テストカードで決済を実行
4. 成功/キャンセルページの表示を確認
5. Webhookの動作を確認

## トラブルシューティング

### よくある問題
1. **CORSエラー**: サーバーでCORS設定を追加
2. **APIキーエラー**: 環境変数の設定を確認
3. **Webhookエラー**: 署名検証の実装を確認

### デバッグ方法
```javascript
// フロントエンドでのデバッグ
console.log('Cart data:', cart);
console.log('Line items:', lineItems);

// サーバーサイドでのデバッグ
console.log('Request body:', req.body);
console.log('Stripe response:', session);
```

## 本番環境への移行

1. **Stripeアカウント**: テストモードから本番モードに切り替え
2. **APIキー**: 本番用のAPIキーに変更
3. **Webhook**: 本番用のWebhookエンドポイントを設定
4. **ドメイン**: 本番ドメインでの動作確認
5. **SSL証明書**: HTTPSの設定確認

## サポート

実装中に問題が発生した場合は、以下を確認してください：
- Stripe公式ドキュメント: https://stripe.com/docs
- Stripeサポート: https://support.stripe.com
- このガイドの該当セクション 