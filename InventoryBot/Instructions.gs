/**
 * 管理者からの「指示」。在庫表の「指示」シートに1行1件で保存し、
 * Grok のシステムプロンプトに毎回差し込む。
 * シートを直接編集してもよいし、Chat で「指示: ○○」と送ってもよい。
 *
 * Chat から指示を出せるのは、スクリプトプロパティ ADMIN_EMAILS（カンマ区切り）に入っている人だけ。
 */

const INSTRUCTION_SHEET = '指示';

function getInstructionSheet_() {
  const ss = SpreadsheetApp.openById(requireProp_('INVENTORY_SHEET_ID'));
  let sheet = ss.getSheetByName(INSTRUCTION_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(INSTRUCTION_SHEET);
    sheet.getRange(1, 1, 1, 3).setValues([['指示内容', '登録日時', '登録者']]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function listInstructions_() {
  const sheet = getInstructionSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, 1).getValues()
    .map(function (r) { return String(r[0]).trim(); })
    .filter(Boolean);
}

/** システムプロンプトに付け足す文。指示がなければ空文字。 */
function instructionsPrompt_() {
  const list = listInstructions_();
  if (!list.length) return '';
  return '\n\n管理者からの指示（ルールより優先して従う。ただし推測で数値を埋めない原則は守る）:\n'
    + list.map(function (s) { return '- ' + s; }).join('\n');
}

function isAdmin_(user) {
  const admins = (getProp_('ADMIN_EMAILS') || '').split(',')
    .map(function (s) { return s.trim().toLowerCase(); })
    .filter(Boolean);
  return !!(user && user.email && admins.indexOf(user.email.toLowerCase()) >= 0);
}

/** 「指示: ○○」「指示一覧」「指示クリア」を処理する。該当しなければ null。 */
function handleInstructionCommand_(text, user) {
  const add = text.match(/^指示\s*[:：]\s*([\s\S]+)$/);
  const isList = /^指示一覧$/.test(text);
  const isClear = /^指示(クリア|全削除)$/.test(text);
  if (!add && !isList && !isClear) return null;

  if (isList) {
    const list = listInstructions_();
    return list.length
      ? '現在の指示:\n' + list.map(function (s, i) { return (i + 1) + '. ' + s; }).join('\n')
      : '指示はまだありません。';
  }
  if (!isAdmin_(user)) return '指示を変更できるのは管理者だけです。';

  const sheet = getInstructionSheet_();
  if (isClear) {
    if (sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);
    return '指示をすべて削除しました。';
  }
  sheet.appendRow([add[1].trim(), new Date(), user.displayName || user.email]);
  return '指示を追加しました👍 次の会話から反映します。\n「' + add[1].trim() + '」';
}
