/**
 * 管理者からの「指示」。スクリプトプロパティに保存し、AI のシステムプロンプトに毎回差し込む。
 * Chat から指示を出せるのは、スクリプトプロパティ ADMIN_EMAILS（カンマ区切り）に入っている人だけ。
 */

function listInstructions_() {
  return JSON.parse(getProp_('instructions') || '[]');
}

/** システムプロンプトに付け足す文。指示がなければ空文字。 */
function instructionsPrompt_() {
  const list = listInstructions_();
  if (!list.length) return '';
  return '\n\n管理者からの指示（ルールより優先して従う。ただし商品名・管理番号を推測で埋めない原則は守る）:\n'
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
  if (isClear) {
    setProp_('instructions', '[]');
    return '指示をすべて削除しました。';
  }
  const list = listInstructions_();
  list.push(add[1].trim());
  setProp_('instructions', JSON.stringify(list));
  return '指示を追加しました👍 次の会話から反映します。\n「' + add[1].trim() + '」';
}
