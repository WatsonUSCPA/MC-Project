/**
 * 初期設定と動作確認用の関数。Apps Script エディタから手動で実行する。
 */

/**
 * 在庫表・写真フォルダを（なければ）作成し、催促トリガーを登録する。
 * 何度実行しても大丈夫。
 */
function setup() {
  let sheetId = getProp_('INVENTORY_SHEET_ID');
  if (!sheetId) {
    const ss = SpreadsheetApp.create(CONFIG.BOT_NAME + ' 在庫表');
    ss.getSheets()[0].setName(CONFIG.SHEET_NAME);
    sheetId = ss.getId();
    setProp_('INVENTORY_SHEET_ID', sheetId);
  }
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);
  sheet.getRange(1, 1, 1, FIELDS.length)
    .setValues([FIELDS.map(function (f) { return f.label; })])
    .setFontWeight('bold')
    .setBackground('#f1f3f4');
  sheet.setFrozenRows(1);
  getInstructionSheet_();

  if (!getProp_('PHOTO_FOLDER_ID')) {
    const folder = DriveApp.createFolder(CONFIG.BOT_NAME + ' 生地写真');
    setProp_('PHOTO_FOLDER_ID', folder.getId());
  }

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['dailyNag', 'followupNag'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dailyNag').timeBased().atHour(CONFIG.NAG_HOUR).everyDays(1).inTimezone(CONFIG.TIMEZONE).create();
  ScriptApp.newTrigger('followupNag').timeBased().atHour(CONFIG.FOLLOWUP_HOUR).everyDays(1).inTimezone(CONFIG.TIMEZONE).create();

  ['XAI_API_KEY', 'SERVICE_ACCOUNT_KEY'].forEach(function (key) {
    if (!getProp_(key)) console.warn('スクリプトプロパティ「' + key + '」がまだ設定されていません。');
  });
  console.log('在庫表: ' + ss.getUrl());
  console.log('写真フォルダ: ' + DriveApp.getFolderById(getProp_('PHOTO_FOLDER_ID')).getUrl());
}

/** Grok API につながるか確認する。 */
function testGrok() {
  console.log(callGrok_([{ role: 'user', content: '「接続テストOK」とだけ返してください。' }], false));
}

/** サービスアカウントで Chat API のトークンが取れるか確認する。 */
function testChatAuth() {
  CacheService.getScriptCache().remove('chatAppToken');
  getAppToken_();
  console.log('Chat API のトークン取得 OK');
}

/** 登録済みの催促先（1対1チャット）を表示する。 */
function showSpaces() {
  console.log(JSON.stringify(getSpaces_(), null, 2));
}

/** 催促をすぐに1回送ってみる。 */
function testNag() {
  nagAll_('morning');
}
