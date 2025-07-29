# 新着生地PDF作成ツール

LINEで新着生地を配信するためのPDF作成ツールです。飲食店のメニューのように、写真と値段だけをシンプルに表示し、iPhoneの画面1枚に収まるデザインです。

## ファイル構成

- `new-products-pdf.html` - 新着生地PDF作成用のHTMLテンプレート（iPhoneサイズ対応）
- `fetch-latest-products.js` - All Productsから最新商品を自動取得するスクリプト
- `README.md` - このファイル

## 特徴

### 📱 iPhone画面1枚に収まるデザイン
- **最大幅375px**に最適化（iPhone標準サイズ）
- **2列グリッドレイアウト**で6商品表示
- **写真と値段のみ**のシンプルな表示（飲食店のメニュー風）
- **Retinaディスプレイ対応**（高解像度）

### 🎨 MC Squareブランドデザイン
- オレンジ系の温かみのあるカラーパレット
- MC Squareのウェブサイトと統一感のあるデザイン
- 商品カードのシャドウ効果とホバーアニメーション
- 印刷に最適化されたスタイル

### 🚀 最新商品自動取得機能
- **All ProductsのAPI**から最新商品を自動取得
- **アップロード日順**でソート（ColumnG対応）
- **公開中の商品のみ**をフィルタリング
- **最新6商品**を自動表示

### 🖨️ 複数の出力形式対応
- **PDF印刷**: ブラウザの印刷機能でPDF作成
- **JPEG画像**: ブラウザの開発者ツールでスクリーンショット
- **iPhone最適化**: 375x812pxのビューポートサイズ

## 使用方法

### 1. 基本的な使用方法

1. `new-products-pdf.html` をブラウザで開く
2. **自動的に最新商品が読み込まれます**
3. ブラウザの印刷機能（Ctrl+P / Cmd+P）でPDFとして保存
4. 印刷設定で「背景のグラフィック」を有効にする

### 2. JPEG出力（ブラウザ）

1. `new-products-pdf.html` をブラウザで開く
2. **F12**で開発者ツールを開く
3. **Elements**タブで`.container`要素を右クリック
4. **Capture node screenshot**を選択
5. **JPEGとして保存**

### 3. 手動で商品を更新

ブラウザのコンソール（F12）で以下のコマンドを実行：

```javascript
// 最新商品を再取得
refreshLatestProducts();

// 最新商品データを確認
showLatestProducts();
```

## 最新商品自動取得の仕組み

### データソース
- **Google Apps Script API**: All Productsと同じデータソース
- **フィルタリング**: 公開中の商品のみ
- **ソート順**: アップロード日（ColumnG）→ 管理番号（新しい順）

### 取得される情報
- **商品名**: 商品の名前
- **価格**: 商品の価格
- **画像URL**: 商品画像のURL
- **管理番号**: 商品の管理番号

### エラーハンドリング
- **API接続エラー**: エラーメッセージを表示
- **画像読み込みエラー**: 代替テキストを表示
- **データなし**: 「商品データを取得できませんでした」を表示

## カスタマイズ

### 商品数の変更
`fetch-latest-products.js`の以下の行を編集：

```javascript
// 最新6商品を取得
const latestProducts = sortedProducts.slice(0, 6);
```

### ソート順の変更
```javascript
// アップロード日でソート（ColumnGがある場合）
const sortedProducts = publicProducts.sort((a, b) => {
    if (a.uploadDate && b.uploadDate) {
        return new Date(b.uploadDate) - new Date(a.uploadDate);
    }
    // 管理番号でソート（新しい順）
    return b.managementNumber.localeCompare(a.managementNumber);
});
```

### スタイルの変更
CSSを編集することで、以下の要素をカスタマイズできます：

- カラーテーマ（現在はMC Squareのオレンジ系）
- フォントサイズと種類
- 商品カードのサイズ
- ヘッダーとフッターのデザイン

## 注意事項

1. **API接続**: インターネット接続が必要です
2. **CORS設定**: Google Apps ScriptのCORS設定が必要です
3. **ブラウザ対応**: モダンブラウザ（Chrome、Firefox、Safari、Edge）を推奨
4. **PDF品質**: 印刷設定で「背景のグラフィック」を有効にすると、より美しいPDFが出力されます
5. **画像サイズ**: 150x110pxに最適化されていますが、他のサイズでも表示可能です
6. **iPhone最適化**: 375px幅に最適化されているため、他のデバイスでは中央寄せで表示されます

## トラブルシューティング

### 商品データが取得できない
- インターネット接続を確認
- ブラウザのコンソールでエラーメッセージを確認
- Google Apps ScriptのAPIが正常に動作しているか確認

### 画像が表示されない
- 画像URLが正しいか確認
- 画像が公開されているか確認
- CORSエラーがないか確認

### PDFが正しく出力されない
- ブラウザの印刷設定を確認
- 「背景のグラフィック」を有効にする
- ページサイズをA4に設定する

### レイアウトが崩れる
- 商品数を6個以内に調整
- 商品名を短くする
- 画像サイズを統一する

## 開発者向け情報

### デバッグ機能
```javascript
// 最新商品データをコンソールに出力
showLatestProducts();

// 手動で商品を再取得
refreshLatestProducts();
```

### APIエンドポイント
- **URL**: `https://script.google.com/macros/s/AKfycbygEEOmylE1fzaMtpxAReEQfY02zIcUVKwVPaV4R5H5AKWnQtgnUbYOKfq3y4mYJPdzYg/exec`
- **メソッド**: GET
- **レスポンス**: JSON配列

## サポート

問題が発生した場合は、以下を確認してください：

1. ブラウザのコンソールでエラーメッセージを確認
2. インターネット接続を確認
3. Google Apps ScriptのAPIが正常に動作しているか確認
4. 画像URLがアクセス可能か確認

---

MC Square 新着生地PDF作成ツール v3.0 (自動取得対応版) 