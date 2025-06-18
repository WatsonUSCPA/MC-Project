// フォームの回答を監視し、新しい回答があったら自動的にコピーする関数
function onFormSubmit(e) {
  // コピー先のスプレッドシートID
  var targetSpreadsheetId = '1XBukt91QDYkJlU0caeW5zDKL8NYozWXyKxK2KGuO_X0';
  // コピー先のシート名
  var targetSheetName = 'シート1';

  // 回答データ（[タイムスタンプ, 姓, 名, メールアドレス]）
  var response = e.values;

  // コピー先のスプレッドシートとシートを取得
  var targetSpreadsheet = SpreadsheetApp.openById(targetSpreadsheetId);
  var targetSheet = targetSpreadsheet.getSheetByName(targetSheetName);

  // 回答データを追加
  targetSheet.appendRow(response);
}

// 手動で実行するための関数（テスト用）
function manualSync() {
  // フォームの回答が記録されるスプレッドシート
  const sourceSheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // データを反映させたいスプレッドシート
  const targetSpreadsheetId = '1XBukt91QDYkJlU0caeW5zDKL8NYozWXyKxK2KGuO_X0';
  const targetSpreadsheet = SpreadsheetApp.openById(targetSpreadsheetId);
  const targetSheet = targetSpreadsheet.getSheetByName('Sheet1'); // シート名を適宜変更してください

  // すべての回答を取得
  const data = sourceSheet.getDataRange().getValues();
  
  // ヘッダー行を除いて処理
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // タイムスタンプを追加
    const timestamp = new Date();
    row.unshift(timestamp);
    // ターゲットシートに追加
    targetSheet.appendRow(row);
  }
}

// Webアプリケーションとしてデプロイするための関数
function doGet(e) {
  return HtmlService.createHtmlOutput('スクリプトが正常に動作しています。');
}

// デプロイ設定
function createDeployment() {
  const scriptId = ScriptApp.getScriptId();
  const deployment = ScriptApp.newDeployment()
    .setDescription('フォーム回答同期スクリプト')
    .setWebApp()
    .setExecuteAs('USER_ACCESSING')
    .setOAuthConfig(ScriptApp.getOAuthToken())
    .deploy();
  
  return deployment.getWebApp().getUrl();
} 