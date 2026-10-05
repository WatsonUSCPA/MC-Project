/**
 * 初期設定と動作確認用の関数。Apps Script エディタから手動で実行する。
 */

/** 写真のバックアップ用フォルダを（なければ）作り、毎日のトリガーを登録する。何度実行しても大丈夫。 */
function setup() {
  if (!getProp_('PHOTO_FOLDER_ID')) {
    const folder = DriveApp.createFolder(CONFIG.BOT_NAME + ' 生地写真');
    setProp_('PHOTO_FOLDER_ID', folder.getId());
  }

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['dailyNag', 'followupNag', 'stockCheck'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dailyNag').timeBased().atHour(CONFIG.NAG_HOUR).everyDays(1).inTimezone(CONFIG.TIMEZONE).create();
  ScriptApp.newTrigger('followupNag').timeBased().atHour(CONFIG.FOLLOWUP_HOUR).everyDays(1).inTimezone(CONFIG.TIMEZONE).create();
  ScriptApp.newTrigger('stockCheck').timeBased().atHour(CONFIG.CHECK_HOUR).everyDays(1).inTimezone(CONFIG.TIMEZONE).create();

  ['AI_API_KEY', 'SERVICE_ACCOUNT_KEY', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].forEach(function (key) {
    if (!getProp_(key)) console.warn('スクリプトプロパティ「' + key + '」がまだ設定されていません。');
  });
  console.log('在庫管理シートの商品数: ' + listProducts_().length);
  console.log('写真フォルダ: ' + DriveApp.getFolderById(getProp_('PHOTO_FOLDER_ID')).getUrl());
}

/** AI につながるか確認する。 */
function testAI() {
  console.log(callAI_([{ role: 'user', content: '「接続テストOK」とだけ返してください。' }], false));
}

/** サービスアカウントで Chat API のトークンが取れるか確認する。 */
function testChatAuth() {
  CacheService.getScriptCache().remove('chatAppToken');
  getAppToken_();
  console.log('Chat API のトークン取得 OK');
}

/** シートを読めるか、管理番号チェックがどう判定するかを確認する（シートは変更しない）。 */
function testSheet() {
  const products = listProducts_();
  console.log('商品数: ' + products.length + ' / 最新: ' + (products[0] ? productLabel_(products[0]) : 'なし'));
  ['200-1051', '200-761', '200-1057', '30150-583', '999-1'].forEach(function (mn) {
    console.log(mn + ' → ' + JSON.stringify(checkManagementNumber_(mn, products)));
  });
}

/** 登録済みの催促先（1対1チャット）を表示する。 */
function showSpaces() {
  console.log(JSON.stringify(getSpaces_(), null, 2));
}

/** 催促をすぐに1回送ってみる。 */
function testNag() {
  nagAll_('morning');
}

/** 在庫チェックをすぐに1回送ってみる。 */
function testStockCheck() {
  stockCheck();
}
