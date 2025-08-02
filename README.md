# MC Square - ECサイト

エムシースクエアの公式ECサイトです。生地の販売・インフルエンサーコラボ・よりそいクラフトなどを提供しています。

## ✨ 新機能

### いいね・コメント機能
- **いいね機能**: レシピにいいねを付けることができます
- **コメント機能**: レシピにコメントを投稿できます
- **リアルタイム更新**: いいね数とコメントがリアルタイムで更新されます
- **ユーザー認証**: ログインしたユーザーのみがいいね・コメント機能を利用できます

## 🚀 技術スタック

- **フロントエンド**: React + TypeScript
- **バックエンド**: Node.js + Express
- **決済**: Stripe
- **認証**: Firebase Authentication
- **データベース**: Firebase Firestore
- **デプロイ**: Netlify

## 📁 プロジェクト構造

```
MCProject_Beta/
├── mc-square-react/          # Reactフロントエンド
├── local-server/             # ローカル開発用サーバー
├── StripeSetting/            # Stripe設定
├── netlify/                  # Netlify Functions
└── Image/                    # 画像ファイル
```

## 🔧 セットアップ

### 1. リポジトリのクローン
```bash
git clone [your-repository-url]
cd MCProject_Beta
```

### 2. 環境変数の設定

#### Reactアプリ（mc-square-react/.env）
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

#### ローカルサーバー（local-server/.env）
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
```

#### Netlify環境変数
- `STRIPE_SECRET_KEY`: Stripeの秘密鍵（本番用）

### 3. 依存関係のインストール

#### Reactアプリ
```bash
cd mc-square-react
npm install
```

#### ローカルサーバー
```bash
cd local-server
npm install
```

### 4. アプリケーションの起動

#### ローカル開発
```bash
# ターミナル1: ローカルサーバー
cd local-server
npm start

# ターミナル2: Reactアプリ
cd mc-square-react
npm start
```

#### 本番デプロイ
```bash
cd mc-square-react
npm run build
```

## 🔒 セキュリティ

- APIキーは環境変数で管理
- .envファイルは.gitignoreに含まれています
- 本番環境では適切な環境変数を設定してください
- Firestoreセキュリティルールでいいね・コメント機能のアクセス制御を実装

## 📊 データベース構造

### Firestoreコレクション
- `recipes`: レシピデータ
- `likes`: いいねデータ（recipeId_userId形式のドキュメントID）
- `comments`: コメントデータ
- `users`: ユーザーデータ

## 📝 ライセンス

MIT License

## 🤝 お問い合わせ

- 電話: 045-410-7023
- メール: retail@mcsquareofficials.com 