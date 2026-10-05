/**
 * xAI API（Grok）の呼び出し。
 */

function callGrok_(messages, jsonMode) {
  const body = {
    model: getProp_('GROK_MODEL') || CONFIG.GROK_MODEL_DEFAULT,
    messages: messages,
    temperature: 0.3,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const res = UrlFetchApp.fetch(CONFIG.GROK_ENDPOINT, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + requireProp_('XAI_API_KEY') },
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('Grok API エラー (' + res.getResponseCode() + '): ' + res.getContentText().slice(0, 500));
  }
  return JSON.parse(res.getContentText()).choices[0].message.content;
}

function parseJsonLoose_(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new Error('Grok の返答を JSON として読めませんでした: ' + text.slice(0, 200));
  }
}

function buildSystemPrompt_() {
  const fieldLines = editableFields_().map(function (f) {
    const src = f.source === 'photo' ? '写真から推定してよい' : '作業者の発言からのみ';
    return '- ' + f.key + '（' + f.label + (f.required ? '・必須' : '') + '、' + src + '）: ' + (f.desc || '');
  }).join('\n');

  return [
    'あなたは生地屋「MC Square」の在庫係「' + CONFIG.BOT_NAME + '」です。Google Chat で作業者と会話し、新しく入った生地を在庫表に登録します。',
    '口調: ' + CONFIG.TONE,
    '',
    '在庫表の項目:',
    fieldLines,
    '',
    'ルール:',
    '- 写真が届いたら、色・柄・素材・商品名案を写真から読み取って埋める。',
    '- 長さ・幅・仕入れ値・保管場所など「作業者の発言からのみ」の項目は、絶対に推測で埋めない。作業者が言ったことだけを入れる。',
    '- まだ埋まっていない必須項目があれば、1回の返事で1〜2項目ずつ短く質問する。',
    '- 全部の必須項目が埋まったら、登録内容を一言でまとめて「次の生地の写真もお願いします」と促す。',
    '- 作業者が訂正したら、その項目を上書きする。',
    '- 作業者が「この生地は登録しない」「間違えた」など取り消しを求めたら action を "cancel" にする。',
    '- 返事は Google Chat 向けに短く（3〜4行以内）。',
    '',
    '必ず次の形の JSON だけを返す:',
    '{"reply": "作業者への返事", "fields": {更新する項目のキーと値（変更がなければ空オブジェクト）}, "action": "continue" または "cancel"}',
  ].join('\n') + instructionsPrompt_();
}

/**
 * 1ターン分の会話を Grok に渡し、{reply, fields, action} を受け取る。
 * ctx: { item, userText, images: [dataUrl], history, note }
 */
function grokTurn_(ctx) {
  const missing = missingRequired_(ctx.item).map(function (f) { return f.label; });
  const current = {};
  editableFields_().forEach(function (f) { current[f.key] = ctx.item[f.key]; });

  const contextText = [
    '対象の生地: ' + ctx.item.id,
    '現在の登録内容: ' + JSON.stringify(current),
    '未入力の必須項目: ' + (missing.length ? missing.join('、') : 'なし'),
    ctx.note ? '補足: ' + ctx.note : '',
    '作業者のメッセージ: ' + (ctx.userText || '（テキストなし）'),
  ].filter(Boolean).join('\n');

  const content = [{ type: 'text', text: contextText }];
  (ctx.images || []).forEach(function (url) {
    content.push({ type: 'image_url', image_url: { url: url, detail: 'high' } });
  });

  const messages = [{ role: 'system', content: buildSystemPrompt_() }]
    .concat(ctx.history || [])
    .concat([{ role: 'user', content: content }]);

  const result = parseJsonLoose_(callGrok_(messages, true));
  return {
    reply: String(result.reply || ''),
    fields: result.fields || {},
    action: result.action === 'cancel' ? 'cancel' : 'continue',
  };
}
