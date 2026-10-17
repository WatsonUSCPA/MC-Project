/**
 * 初期設定と動作確認用の関数。Apps Script エディタから手動で実行する。
 */

/**
 * 写真のバックアップ用フォルダを（なければ）作り、作業者の一覧を読み込み、
 * 毎日のトリガー（催促・在庫チェック・日報）を登録する。何度実行しても大丈夫。
 */
function setup() {
  ['SLACK_BOT_TOKEN', 'SLACK_VERIFICATION_TOKEN', 'SLACK_CHANNEL_ID', 'SLACK_ADMIN_IDS',
    'AI_API_KEY', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].forEach(function (key) {
    if (!getProp_(key)) console.warn('スクリプトプロパティ「' + key + '」がまだ設定されていません。');
  });

  if (!getProp_('PHOTO_FOLDER_ID')) {
    const folder = DriveApp.createFolder(CONFIG.BOT_NAME + ' 生地写真');
    setProp_('PHOTO_FOLDER_ID', folder.getId());
  }

  const handlers = ['dailyNag', 'followupNag', 'stockCheck', 'dailyReport'];
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (handlers.indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  const daily = function (fn, hour) {
    ScriptApp.newTrigger(fn).timeBased().atHour(hour).everyDays(1).inTimezone(CONFIG.TIMEZONE).create();
  };
  daily('dailyNag', CONFIG.NAG_HOUR);
  daily('followupNag', CONFIG.FOLLOWUP_HOUR);
  daily('stockCheck', CONFIG.CHECK_HOUR);
  daily('dailyReport', CONFIG.REPORT_HOUR);

  const workers = refreshWorkers_();
  console.log('作業者: ' + workers.map(function (w) { return w.name + '(' + w.id + ')'; }).join(', '));
  console.log('社長: ' + adminIds_().map(userName_).join(', '));
  console.log('在庫管理シートの商品数: ' + listProducts_().length);
  console.log('写真フォルダ: ' + DriveApp.getFolderById(getProp_('PHOTO_FOLDER_ID')).getUrl());
}

/** AI につながるか確認する。 */
function testAI() {
  console.log(callAI_([{ role: 'user', content: '「接続テストOK」とだけ返してください。' }], false));
}

/** Slack につながるか確認する（社長に DM が1通届く）。 */
function testSlack() {
  postToAdmins_('在庫係Bot の接続テストです。この DM が届いていれば OK です👍');
  console.log('作業者: ' + JSON.stringify(refreshWorkers_()));
}

/** シートを読めるか、管理番号チェックがどう判定するかを確認する（シートは変更しない）。 */
function testSheet() {
  const products = listProducts_();
  console.log('商品数: ' + products.length + ' / 最新: ' + (products[0] ? productLabel_(products[0]) : 'なし'));
  ['200-1051', '200-761', '200-1057', '30150-583', '999-1'].forEach(function (mn) {
    console.log(mn + ' → ' + JSON.stringify(checkManagementNumber_(mn, products)));
  });
}

/** 催促をすぐに1回送ってみる。 */
function testNag() {
  nagAll_('morning');
}

/** 在庫チェックをすぐに1回送ってみる。 */
function testStockCheck() {
  stockCheck();
}

/** 日報をすぐに1回送ってみる。 */
function testReport() {
  dailyReport();
}
