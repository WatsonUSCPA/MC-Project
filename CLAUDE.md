# MC Square サイト改修：Claude への指示書

あなたは mcsquareofficials.com（エムシースクエア、パッチワーク・キルト生地のEC）のサイト改修を手伝うエンジニアです。何を変えるかはオーナーのWataruとあなたで相談して決めます。この指示書は、作業の前提と進め方のルールです。

## 1. まず最初に確認すること（重要）
- リポジトリは GitHub の `WatsonUSCPA/MC-Project`（公開リポジトリ）です。
- **今ライブで動いているコードは GitHub の main ではありません。** ブランチ `security-fixes` の最新版（05c05da0）が本番に出ています。main は古いコードです。
- 作業は必ず `security-fixes`（またはそこから切ったブランチ）を土台にしてください。main から作ると、セキュリティ修正やクラフトキッチンの改善が消えます。
- main への push、main からの再ビルドは、本番を古いコードで上書きしてしまうので禁止です。

## 2. 構成
- フロント：React 19 + TypeScript（Create React App）、`mc-square-react/`
- サーバー処理：Netlify Functions（`netlify/functions/`）、決済は Stripe Checkout
- データ：Firebase プロジェクト `link-manager-f4ea8`（Firestore）。レシピは partner レシピ（うさんこ、クロバー、Kon）を毎日自動追加中
- 商品データ：Google スプレッドシート + Apps Script
- ホスティング：Netlify（本番サイト `dapper-halva-2c96a2`、ドメイン mcsquareofficials.com）

## 3. 守ってほしいルール
- **本番には直接出さない。** 変更はまずモック（プレビュー）で見せて、Wataruが「OK」と言ってから本番へ。
- 秘密情報（Stripe のシークレットキー、Firebase のサービスアカウント鍵など）をコードやコミットに入れない。環境変数で扱う。
- `Referrer-Policy` は `strict-origin-when-cross-origin` のまま。`no-referrer` にすると YouTube の埋め込みがエラー153で壊れます。
- `admin_links.html` はオーナーの判断でそのままにしています。触らないでください。
- クラフトキッチンのレシピのうち、うさんことKonのものは「材料（サイズ付き）＋動画＋サムネ＋リンク」だけを載せ、作り方の文章は書かないルールです（動画を見てもらうため）。
- Firestore のデータ構造（recipes コレクション、`source.partner` など）を変える場合は、毎日のレシピ自動投稿が壊れないか事前に相談してください。
- 1つの変更ごとに小さなコミットに分け、何を変えたかを日本語で短く説明してください。

## 4. モックで見られるようにする方法
Wataruがスマホでもパソコンでも確認できるURLを、変更のたびに出してください。おすすめ順：

1. **Netlify のデプロイプレビュー（推奨）**
   作業ブランチで GitHub に Pull Request を作ると、Netlify が自動でプレビューURL（`deploy-preview-番号--...netlify.app`）を作ります。PR のたびに最新版が見られます。
   ※ PR の向き先は main ではなく `security-fixes` にするか、Wataruと相談してください。PR をマージするのは Wataru の OK が出てから。
2. **Netlify CLI の下書きデプロイ**
   `npm run build` してから `netlify deploy --dir=mc-square-react/build`（`--prod` は付けない）。本番に影響しない下書きURLが出ます。
3. **ローカルで確認**
   `cd mc-square-react && npm install && npm start` で http://localhost:3000 。ただし Wataru が見るには URL 共有が必要なので、基本は 1 か 2 で。

モックを出すときは毎回、
- プレビューURL
- 変えた点の箇条書き
- 確認してほしいページ（例：トップ、商品ページ、クラフトキッチン、カート）
をセットで伝えてください。

## 5. 本番に出すとき
Wataruの OK が出たら、作業ブランチを `security-fixes` に取り込み、最終的に main もこの最新コードにそろえてから本番デプロイします。main を最新にそろえるまでは、main からの自動デプロイに注意してください。
