/**
 * AI の呼び出し（OpenRouter 経由。OpenAI 互換の形式なので、AI_ENDPOINT を変えれば xAI などにも直接つなげる）。
 * AI は返事の文章と「どの項目に何を入れるか」を返すだけで、シートには一切さわらない。
 */

function callAI_(messages, jsonMode) {
  const body = {
    model: getProp_('AI_MODEL') || CONFIG.AI_MODEL_DEFAULT,
    messages: messages,
    temperature: 0.3,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const res = UrlFetchApp.fetch(getProp_('AI_ENDPOINT') || CONFIG.AI_ENDPOINT_DEFAULT, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + requireProp_('AI_API_KEY'),
      'X-Title': 'MC Square Inventory Bot',
    },
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('AI の API エラー (' + res.getResponseCode() + '): ' + res.getContentText().slice(0, 500));
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
    throw new Error('AI の返答を読み取れませんでした: ' + text.slice(0, 200));
  }
}

function buildSystemPrompt_() {
  const fieldLines = DRAFT_FIELDS.map(function (f) { return '- ' + f.key + '（' + f.label + '）: ' + f.desc; }).join('\n');
  return [
    'あなたは生地屋「MC Square」の在庫係「' + CONFIG.BOT_NAME + '」です。Google Chat で作業者（社長の親）と会話し、新しく入った生地を在庫管理シートに登録するための情報を集めます。',
    '口調: ' + CONFIG.TONE,
    '',
    '作業者が送った写真は、1枚が1つの生地です。写真には「写真①」のように番号が付いています。',
    '写真ごとに、次の項目を作業者から聞き出します:',
    fieldLines,
    '',
    'ルール:',
    '- 商品名と管理番号は、作業者が言ったことだけを入れる。推測で埋めない。',
    '- 写真の耳などに商品名や番号らしき文字が見えたら「○○ですか？」と確認してよい。ただし作業者が認めるまで入れない。',
    '- 値段は、作業者が言わなければ既定値の' + CONFIG.DEFAULT_PRICE + '円のまま。変更を言われたら入れる。',
    '- 「全部 USA COTTON」「200-1051〜1056」のように、まとめて言われたら写真の順に割り当てる。',
    '- 写真がぼやけている、生地が写っていないなどの場合は、撮り直しをお願いする。',
    '- 足りない項目だけを短く聞く。返事は Google Chat 向けに3〜4行以内。',
    '- 「登録しました」「公開しました」とは言わない（登録と完了報告はシステムが行う）。情報がそろったら「確認しますね」程度にする。',
    '- 注意事項（issue）が付いている写真は、その内容を作業者に伝え、正しい番号を聞くか、このままでよいか確認する。作業者が「このままでいい」と答えたら confirm に入れる。',
    '- 作業者が「その写真はなし」「間違えた」など取り消しを求めたら cancel に入れる。',
    '',
    '必ず次の形の JSON だけを返す:',
    '{"reply": "作業者への返事", "updates": [{"no": 写真番号, "fields": {更新する項目だけ}}], "confirm": [このままでよいと言われた写真番号], "cancel": [取り消す写真番号]}',
  ].join('\n') + instructionsPrompt_();
}

/**
 * 1ターン分の会話を AI に渡す。
 * ctx: { drafts, userText, images: [{no, dataUrl}], history }
 */
function aiTurn_(ctx) {
  const draftsView = ctx.drafts.map(function (d) {
    return {
      no: d.no,
      name: d.name || '',
      managementNumber: d.managementNumber || '',
      price: d.price,
      priceIsDefault: !!d.priceDefault,
      issue: d.issue || '',
    };
  });
  const content = [{
    type: 'text',
    text: '登録待ちの写真: ' + JSON.stringify(draftsView) + '\n作業者のメッセージ: ' + (ctx.userText || '（テキストなし）'),
  }];
  (ctx.images || []).forEach(function (img) {
    content.push({ type: 'text', text: '写真' + circled_(img.no) });
    content.push({ type: 'image_url', image_url: { url: img.dataUrl } });
  });

  const messages = [{ role: 'system', content: buildSystemPrompt_() }]
    .concat(ctx.history || [])
    .concat([{ role: 'user', content: content }]);

  const result = parseJsonLoose_(callAI_(messages, true));
  return {
    reply: String(result.reply || ''),
    updates: Array.isArray(result.updates) ? result.updates : [],
    confirm: Array.isArray(result.confirm) ? result.confirm.map(Number) : [],
    cancel: Array.isArray(result.cancel) ? result.cancel.map(Number) : [],
  };
}

function circled_(n) {
  const chars = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';
  return n >= 1 && n <= 20 ? chars[n - 1] : '(' + n + ')';
}
