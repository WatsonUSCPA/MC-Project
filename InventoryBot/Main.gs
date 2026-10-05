/**
 * Google Chat からのイベントを受け取るハンドラ。
 *
 * - 写真つきメッセージ: すぐに「受け取りました」と返し、写真の保存と AI の確認は非同期で行う
 *   （Chat は30秒以内に返事しないとエラー表示になるため）
 * - テキストだけのメッセージ: その場で AI に渡して返事する。シートへの登録は非同期で行う
 */

const HELP_TEXT = [
  '*' + CONFIG.BOT_NAME + 'の使い方*',
  '・新しい生地の写真を送ってください（1枚＝1つの生地。何枚まとめてでもOK）。',
  '・商品名と管理番号を教えてもらえれば、写真の保存から在庫管理シートへの登録（公開中）まで全部やります。',
  '・値段は言われなければ' + CONFIG.DEFAULT_PRICE + '円で登録します。',
  '・売れたら「200-1051 売り切れ」、値段を変えるなら「200-1051 値下げ 800円」と送ってください。',
  '・ほかのコマンド: 「状況」「キャンセル」「値下げ候補」「催促オフ」「催促オン」',
  '・管理者向け: 「指示: ○○」で Bot のふるまいを追加、「指示一覧」「指示クリア」',
].join('\n');

function onAddedToSpace(event) {
  registerSpace_(event);
  const name = event.user && event.user.displayName ? event.user.displayName + 'さん、' : '';
  return {
    text: name + 'よろしくお願いします！' + CONFIG.BOT_NAME + 'です📦\n'
      + '新しく入った生地の写真をここに送ってください。在庫管理シートへの登録はこちらでやります。\n\n' + HELP_TEXT,
  };
}

function onRemovedFromSpace(event) {
  unregisterSpace_(event);
}

function onMessage(event) {
  try {
    registerSpace_(event);
    const user = event.user;
    const message = event.message || {};
    const text = (message.argumentText || message.text || '').trim();
    const attachments = message.attachment || [];
    const images = attachments.filter(function (a) { return /^image\//.test(a.contentType || ''); });

    if (images.length) {
      enqueueJob_({
        type: 'photo',
        spaceName: event.space.name,
        threadName: message.thread ? message.thread.name : null,
        user: { name: user.name, displayName: user.displayName },
        text: text,
        attachments: images.map(function (a) {
          return {
            contentType: a.contentType,
            contentName: a.contentName,
            resourceName: a.attachmentDataRef ? a.attachmentDataRef.resourceName : null,
            driveFileId: a.driveDataRef ? a.driveDataRef.driveFileId : null,
          };
        }),
      });
      return { text: '📷 ' + images.length + '枚受け取りました！確認しています。少しお待ちください…' };
    }
    if (attachments.length) {
      return { text: '画像ファイル（写真）を送ってください🙏' };
    }

    const state = getState_(user.name);
    const commandReply = handleCommand_(text, event, state);
    if (commandReply) {
      saveState_(user.name, state);
      return { text: commandReply };
    }
    return { text: handleTextTurn_(event, text, state) };
  } catch (e) {
    console.error(e && e.stack ? e.stack : e);
    return { text: '⚠️ エラーが発生しました: ' + e.message };
  }
}

/** 決まった形のメッセージを処理する。該当しなければ null。 */
function handleCommand_(text, event, state) {
  const user = event.user;

  if (/^(ヘルプ|help|使い方)$/i.test(text)) return HELP_TEXT;

  const instructionReply = handleInstructionCommand_(text, user);
  if (instructionReply) return instructionReply;

  const checkReply = handleCheckAnswer_(text, state);
  if (checkReply) return checkReply;

  const soldReply = handleSoldOut_(text);
  if (soldReply) return soldReply;

  const priceReply = handlePriceChange_(text);
  if (priceReply) return priceReply;

  if (/^値下げ候補$/.test(text)) return discountListText_();

  if (/^(状況|じょうきょう|status)$/i.test(text)) {
    const count = state.log && state.log.date === todayString_() ? state.log.count : 0;
    const lines = ['今日の登録: ' + count + '件'];
    if (state.drafts.length) {
      lines.push('登録待ちの写真:');
      state.drafts.forEach(function (d) { lines.push('・' + draftLabel_(d)); });
    }
    return lines.join('\n');
  }

  if (/^(キャンセル|取り消し|取消)$/.test(text)) {
    if (!state.drafts.length) return '登録待ちの写真はありません。';
    const n = state.drafts.length;
    state.drafts = [];
    state.history = [];
    return '登録待ちの写真' + n + '枚を取り消しました。';
  }

  if (/^催促(オフ|off|停止|ストップ)$/i.test(text)) {
    return setNagEnabled_(event.space.name, false)
      ? '催促を止めました。再開するときは「催促オン」と送ってください。'
      : '催促は1対1のチャットでだけ設定できます。';
  }
  if (/^催促(オン|on|再開)$/i.test(text)) {
    return setNagEnabled_(event.space.name, true)
      ? '催促を再開しました💪'
      : '催促は1対1のチャットでだけ設定できます。';
  }

  // 注意事項の確認待ちが1件だけなら、「OK」でそのまま登録に進める
  if (/^(ok|ｏｋ|はい|そのまま|大丈夫|だいじょうぶ|それで)/i.test(text)) {
    const waiting = state.drafts.filter(function (d) { return d.warningFor && d.confirmedFor !== d.warningFor; });
    if (waiting.length === 1) {
      waiting[0].confirmedFor = waiting[0].warningFor;
      const result = settleDrafts_(state);
      if (result.ready.length) enqueuePublish_(event, result.ready);
      return result.notes.join('\n') || 'わかりました。';
    }
  }
  return null;
}

function draftLabel_(d) {
  const missing = [];
  if (!d.name) missing.push('商品名');
  if (!d.managementNumber) missing.push('管理番号');
  return '写真' + circled_(d.no) + ' '
    + [d.name, d.managementNumber, d.price ? d.price + '円' : ''].filter(Boolean).join(' / ')
    + (missing.length ? '（未入力: ' + missing.join('、') + '）' : '')
    + (d.issue ? '（要確認）' : '');
}

function handleTextTurn_(event, text, state) {
  const user = event.user;
  if (!state.drafts.length) {
    return '今は登録待ちの写真がありません。新しい生地の写真を送ってください📷\n（使い方は「ヘルプ」）';
  }
  const ai = aiTurn_({ drafts: state.drafts, userText: text, history: state.history });
  const result = applyAiResult_(state, ai);
  if (result.ready.length) enqueuePublish_(event, result.ready);
  const reply = [result.reply].concat(result.notes).filter(Boolean).join('\n\n');
  pushHistory_(state, 'user', text);
  pushHistory_(state, 'assistant', reply);
  saveState_(user.name, state);
  return reply;
}

function sanitizeDraftFields_(fields) {
  const patch = {};
  if (!fields || typeof fields !== 'object') return patch;
  if (fields.name) patch.name = String(fields.name).trim();
  if (fields.managementNumber) patch.managementNumber = normalizeMn_(fields.managementNumber);
  if (fields.price !== undefined && fields.price !== null && fields.price !== '') {
    const price = typeof fields.price === 'number' ? fields.price : parseFloat(normalizeMn_(fields.price).replace(/[^0-9.]/g, ''));
    if (!isNaN(price) && price > 0) patch.price = price;
  }
  return patch;
}

/** AI の返答を登録待ちの写真に反映し、登録できるものを取り出す。 */
function applyAiResult_(state, ai) {
  state.drafts = state.drafts.filter(function (d) { return ai.cancel.indexOf(d.no) < 0; });
  ai.updates.forEach(function (u) {
    const d = state.drafts.filter(function (x) { return x.no === Number(u.no); })[0];
    if (!d) return;
    const patch = sanitizeDraftFields_(u.fields);
    if (patch.price !== undefined && patch.price !== d.price) d.priceDefault = false;
    Object.assign(d, patch);
  });
  ai.confirm.forEach(function (no) {
    const d = state.drafts.filter(function (x) { return x.no === no; })[0];
    if (d && d.warningFor) d.confirmedFor = d.warningFor;
  });
  const settled = settleDrafts_(state);
  const cancelled = ai.cancel.length ? ['（写真' + ai.cancel.map(circled_).join('') + ' は取り消しました）'] : [];
  return { reply: ai.reply, ready: settled.ready, notes: cancelled.concat(settled.notes) };
}

/**
 * 商品名と管理番号がそろった写真をチェックし、問題なければ登録待ちから外して返す。
 * 問題があれば issue に理由を入れて、作業者に確認する。
 */
function settleDrafts_(state) {
  const products = listProducts_();
  const ready = [];
  const notes = [];
  const takenInThisBatch = {};
  state.drafts = state.drafts.filter(function (d) {
    if (!d.name || !d.managementNumber) return true;
    const mn = normalizeMn_(d.managementNumber);
    const check = takenInThisBatch[mn]
      ? { error: mn + ' はほかの写真にも付いています。番号を確認してください。' }
      : checkManagementNumber_(mn, products);
    if (check.error) {
      if (d.issue !== check.error) notes.push('⚠️ 写真' + circled_(d.no) + ': ' + check.error);
      d.issue = check.error;
      return true;
    }
    if (check.warning && d.confirmedFor !== mn) {
      if (d.issue !== check.warning) {
        notes.push('⚠️ 写真' + circled_(d.no) + ': ' + check.warning
          + '\nこのままでよければ「OK」、違うなら正しい番号を送ってください。');
      }
      d.issue = check.warning;
      d.warningFor = mn;
      return true;
    }
    d.issue = '';
    takenInThisBatch[mn] = true;
    ready.push(d);
    notes.push('⏳ 写真' + circled_(d.no) + ' ' + d.name + ' ' + mn + ' ' + d.price + '円 を登録しています…');
    return false;
  });
  if (!state.drafts.length) state.history = [];
  return { ready: ready, notes: notes };
}

// ---------------------------------------------------------------------------
// 非同期処理キュー（写真の受け取り・シートへの登録）
// ---------------------------------------------------------------------------

function enqueuePublish_(event, drafts) {
  enqueueJob_({
    type: 'publish',
    spaceName: event.space.name,
    threadName: event.message && event.message.thread ? event.message.thread.name : null,
    user: { name: event.user.name, displayName: event.user.displayName },
    drafts: drafts,
  });
}

function enqueueJob_(job) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const queue = JSON.parse(getProp_('queue') || '[]');
    queue.push(job);
    setProp_('queue', JSON.stringify(queue));
    ensureQueueTrigger_();
  } finally {
    lock.releaseLock();
  }
}

function ensureQueueTrigger_() {
  const exists = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === 'processQueue';
  });
  if (!exists) ScriptApp.newTrigger('processQueue').timeBased().after(1000).create();
}

/** 時間主導トリガーから呼ばれる。キューにたまった仕事を順に処理する。 */
function processQueue() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'processQueue') ScriptApp.deleteTrigger(t);
  });

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  let jobs;
  try {
    jobs = JSON.parse(getProp_('queue') || '[]');
    setProp_('queue', '[]');
  } finally {
    lock.releaseLock();
  }

  jobs.forEach(function (job) {
    try {
      const text = job.type === 'publish' ? publishDrafts_(job.user, job.drafts) : processPhotoJob_(job);
      if (text) postMessage_(job.spaceName, text, job.threadName);
    } catch (e) {
      console.error(e && e.stack ? e.stack : e);
      try {
        postMessage_(job.spaceName, '⚠️ 処理中にエラーが発生しました: ' + e.message + '\nもう一度送ってもらえますか？', job.threadName);
      } catch (e2) {
        console.error(e2);
      }
    }
  });

  if (JSON.parse(getProp_('queue') || '[]').length) ensureQueueTrigger_();
}

/** 写真を Drive に保存して登録待ちに加え、AI に確認させる。 */
function processPhotoJob_(job) {
  const folder = DriveApp.getFolderById(requireProp_('PHOTO_FOLDER_ID'));
  const state = getState_(job.user.name);
  const images = [];
  job.attachments.forEach(function (att) {
    const blob = downloadAttachment_(att);
    const no = ++state.seq;
    const ext = (att.contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const file = folder.createFile(blob.setName(formatDate_(new Date(), 'yyMMdd_HHmmss') + '_' + no + '.' + ext));
    state.drafts.push({ no: no, fileId: file.getId(), price: CONFIG.DEFAULT_PRICE, priceDefault: true });
    const dataUrl = toImageDataUrl_(blob, file);
    if (dataUrl) images.push({ no: no, dataUrl: dataUrl });
  });

  const ai = aiTurn_({ drafts: state.drafts, userText: job.text, images: images, history: state.history });
  const result = applyAiResult_(state, ai);
  const published = result.ready.length ? publishDrafts_(job.user, result.ready, state) : '';
  const reply = [result.reply].concat(result.notes.filter(function (n) { return n.indexOf('⏳') !== 0; }))
    .concat([published]).filter(Boolean).join('\n\n');
  pushHistory_(state, 'user', '[写真' + images.map(function (i) { return circled_(i.no); }).join('') + 'を送信] ' + (job.text || ''));
  pushHistory_(state, 'assistant', reply);
  saveState_(job.user.name, state);
  return reply;
}

/**
 * 写真を Cloudinary に上げて、在庫管理シートに「公開中」で追加する。
 * state を渡されたらそれを更新し（呼び出し元が保存する）、渡されなければ読み込んで保存する。
 */
function publishDrafts_(user, drafts, stateFromCaller) {
  const state = stateFromCaller || getState_(user.name);
  const lines = [];
  drafts.forEach(function (d) {
    try {
      const check = checkManagementNumber_(d.managementNumber, listProducts_());
      if (check.error) throw new Error(check.error);
      const url = uploadToCloudinary_(DriveApp.getFileById(d.fileId).getBlob(), d.managementNumber);
      insertProduct_({ name: d.name, managementNumber: d.managementNumber, photo: url, price: d.price });
      recordRegistration_(state);
      lines.push('✅ 公開しました: ' + d.name + ' ' + d.managementNumber + ' ' + d.price + '円' + (d.priceDefault ? '（いつもの値段）' : '') + '\n' + url);
    } catch (e) {
      console.error(e && e.stack ? e.stack : e);
      d.issue = e.message;
      state.drafts.push(d);
      lines.push('⚠️ 写真' + circled_(d.no) + ' を登録できませんでした: ' + e.message);
    }
  });
  if (!stateFromCaller) saveState_(user.name, state);
  if (lines.length && !state.drafts.length) lines.push('次の生地の写真もお願いします📷');
  return lines.join('\n');
}

/**
 * AI に渡せる形式（JPEG/PNG の data URL）に変換する。
 * HEIC などは Drive のサムネイル（PNG）で代用し、それもなければ null。
 */
function toImageDataUrl_(blob, file) {
  let target = blob;
  if (!/^image\/(jpeg|jpg|png)$/i.test(blob.getContentType())) {
    try {
      target = file.getThumbnail();
    } catch (e) {
      target = null;
    }
    if (!target) return null;
  }
  return 'data:' + (target.getContentType() || 'image/png') + ';base64,' + Utilities.base64Encode(target.getBytes());
}
