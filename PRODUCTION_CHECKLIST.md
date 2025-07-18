# 本番環境デプロイ前チェックリスト

## 🔒 セキュリティ設定

### Firebase設定
- [ ] Firebase Security Rules が適切に設定されている
- [ ] 認証機能が有効になっている
- [ ] 本番用プロジェクトが設定されている
- [ ] APIキーの制限が設定されている（必要に応じて）

### Stripe設定
- [ ] 本番用Stripeキー（sk_live_...）が設定されている
- [ ] Webhookエンドポイントが設定されている
- [ ] 決済成功・失敗の処理が適切に設定されている

### Netlify設定
- [ ] 環境変数が適切に設定されている
- [ ] セキュリティヘッダーが設定されている
- [ ] CORS設定が適切になっている

## 🚀 パフォーマンス設定

### ビルド設定
- [ ] 本番用ビルドが正常に動作する
- [ ] 不要なファイルが除外されている
- [ ] 画像の最適化が行われている

### 監視設定
- [ ] エラーログの監視が設定されている
- [ ] パフォーマンス監視が設定されている
- [ ] 使用量の監視が設定されている

## 📱 機能テスト

### 基本機能
- [ ] ページの表示が正常
- [ ] ナビゲーションが正常
- [ ] レスポンシブデザインが正常

### 認証機能
- [ ] ログイン・ログアウトが正常
- [ ] 新規登録が正常
- [ ] パスワードリセットが正常

### 決済機能
- [ ] カート機能が正常
- [ ] Stripe決済が正常
- [ ] 決済成功・失敗の処理が正常

## 🔧 環境変数確認

### 本番環境変数
```env
# Netlify環境変数
STRIPE_SECRET_KEY=sk_live_...
NODE_ENV=production
URL=https://your-domain.netlify.app
```

### Firebase設定
- [ ] 本番用プロジェクトID
- [ ] 本番用APIキー
- [ ] 本番用ドメイン設定

## 📊 監視・ログ

### エラー監視
- [ ] Firebase Crashlytics が設定されている
- [ ] Netlify Functions のログ監視
- [ ] フロントエンドエラーの監視

### パフォーマンス監視
- [ ] Core Web Vitals の監視
- [ ] ページ読み込み速度の監視
- [ ] API応答時間の監視

## 🚨 緊急時対応

### ロールバック手順
- [ ] 前のバージョンへの復旧手順
- [ ] データベースのバックアップ
- [ ] 緊急連絡先の設定

### 障害対応
- [ ] エラー通知の設定
- [ ] 障害時の対応手順
- [ ] 顧客サポート体制 