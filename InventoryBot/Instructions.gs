/**
 * 管理者からの「指示」。スクリプトプロパティに保存し、AI のシステムプロンプトに毎回差し込む。
 * 指示を出せるのは、スクリプトプロパティ SLACK_ADMIN_IDS に入っている人（社長）だけ。
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

/** 「指示: ○○」「指示一覧」「指示クリア」を処理する。該当しなければ null。 */
function handleInstructionCommand_(text, userId) {
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
  if (!isAdmin_(userId)) return '指示を変更できるのは社長だけです。';
  if (isClear) {
    setProp_('instructions', '[]');
    return '指示をすべて削除しました。';
  }
  addInstruction_(add[1].trim());
  return '指示を追加しました👍 次の会話から反映します。\n「' + add[1].trim() + '」';
}

function addInstruction_(text) {
  const list = listInstructions_();
  list.push(text);
  setProp_('instructions', JSON.stringify(list));
}
