/**
 * Slack からのイベントを受け取る入口（Apps Script のウェブアプリとして公開する）。
 *
 * Slack は3秒以内に返事がないと同じイベントを送り直してくるので、doPost では
 * 受け付けてキューに積むだけにして、中身の処理は時間主導トリガー（processQueue）で行う。
 *
 *   在庫チャンネルでの作業者（父・母）の発言 → 写真の受け付け・登録などの作業
 *   社長から Bot への DM                     → 報告・指示・作業者への伝言
 *   在庫チャンネルでの社長の発言             → 無視（作業者との会話に割り込まない）。@在庫係 付きなら社長の指示として扱う
 */

const HELP_TEXT = [
  '*' + CONFIG.BOT_NAME + 'の使い方*',
  '・新しい生地の写真をこのチャンネルに送ってください（1枚＝1つの生地。何枚まとめてでもOK）。',
  '・商品名と管理番号を教えてもらえれば、写真の保存から在庫管理シートへの登録（公開中）まで全部やります。',
  '・値段は言われなければ' + CONFIG.DEFAULT_PRICE + '円で登録します。',
  '・売れたら「200-1051 売り切れ」、値段を変えるなら「200-1051 値下げ 800円」と送ってください。',
  '・ほかのコマンド: 「状況」「キャンセル」「値下げ候補」「催促オフ」「催促オン」',
].join('\n');

function doPost(e) {
  const body = JSON.parse(e.postData.contents);

  if (body.type === 'url_verification') {
    return ContentService.createTextOutput(body.challenge);
  }
  if (body.token !== getProp_('SLACK_VERIFICATION_TOKEN')) {
    return ContentService.createTextOutput('invalid token');
  }
  if (body.type !== 'event_callback' || !body.event) {
    return ContentService.createTextOutput('ok');
  }

  // 送り直されたイベントは1回だけ処理する
  const cache = CacheService.getScriptCache();
  if (cache.get('event:' + body.event_id)) return ContentService.createTextOutput('ok');
  cache.put('event:' + body.event_id, '1', 21600);

  const ev = body.event;
  // Bot 自身の発言、編集・削除などの通知、在庫チャンネルと DM 以外の発言は無視する
  const ignore = ev.type !== 'message' || ev.bot_id || !ev.user
    || (ev.subtype && ev.subtype !== 'file_share')
    || (ev.channel !== getProp_('SLACK_CHANNEL_ID') && ev.channel_type !== 'im');
  if (ignore) return ContentService.createTextOutput('ok');

  const images = (ev.files || []).filter(function (f) { return /^image\//.test(f.mimetype || ''); });
  if (images.length && ev.channel === getProp_('SLACK_CHANNEL_ID') && !isAdmin_(ev.user)) {
    try {
      postMessage_(ev.channel, mention_(ev.user) + ' 📷 ' + images.length + '枚受け取りました！確認しています…');
    } catch (err) {
      console.error(err.message);
    }
  }
  enqueueJob_({
    channel: ev.channel,
    channelType: ev.channel_type,
    threadTs: ev.thread_ts || null,
    user: ev.user,
    text: ev.text || '',
    mentionsBot: /<@[A-Z0-9]+>/.test(ev.text || ''),
    files: images.map(function (f) {
      return {
        url: f.url_private_download || f.url_private,
        thumb: f.thumb_1024 || f.thumb_720 || f.thumb_480 || f.url_private,
        mimetype: f.mimetype,
        name: f.name,
      };
    }),
  });
  return ContentService.createTextOutput('ok');
}

// ---------------------------------------------------------------------------
// 非同期処理キュー
// ---------------------------------------------------------------------------

function enqueueJob_(job) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
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

function takeJobs_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const jobs = JSON.parse(getProp_('queue') || '[]');
    setProp_('queue', '[]');
    return jobs;
  } finally {
    lock.releaseLock();
  }
}

/**
 * 時間主導トリガーから呼ばれる。キューが空になるまで順に処理する。
 * 同時に2つ動かないよう、ユーザーロック（doPost が使うスクリプトロックとは別）で守る。
 */
function processQueue() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'processQueue') ScriptApp.deleteTrigger(t);
  });
  const runner = LockService.getUserLock();
  if (!runner.tryLock(1000)) return; // ほかの処理が動いている。そちらがキューを空にする
  try {
    let jobs = takeJobs_();
    while (jobs.length) {
      jobs.forEach(runJob_);
      jobs = takeJobs_();
    }
  } finally {
    runner.releaseLock();
  }
}

function runJob_(job) {
  try {
    if (isAdmin_(job.user)) {
      if (job.channelType === 'im' || job.mentionsBot) {
        const reply = handleAdminMessage_(job.user, cleanSlackText_(job.text));
        if (reply) postToAdmins_(reply);
      }
      return;
    }
    const reply = handleWorkerMessage_(job);
    if (reply) postMessage_(job.channel, mention_(job.user) + ' ' + reply, job.threadTs);
  } catch (e) {
    console.error(e && e.stack ? e.stack : e);
    try {
      postMessage_(job.channel, mention_(job.user) + ' ⚠️ 処理中にエラーが発生しました: ' + e.message + '\nもう一度送ってもらえますか？', job.threadTs);
      postToAdmins_('⚠️ エラー（' + userName_(job.user) + 'さんのメッセージ処理中）: ' + e.message);
    } catch (e2) {
      console.error(e2);
    }
  }
}

// ---------------------------------------------------------------------------
// 作業者（父・母）とのやりとり
// ---------------------------------------------------------------------------

function handleWorkerMessage_(job) {
  const userId = job.user;
  const text = cleanSlackText_(job.text);
  const state = getState_(userId);
  state.lastActiveAt = new Date().toISOString();

  let reply;
  if (job.files.length) {
    reply = processPhotos_(userId, job.files, text, state);
  } else {
    reply = handleCommand_(text, userId, state);
    if (reply === null) reply = handleTextTurn_(userId, text, state);
  }
  saveState_(userId, state);
  return reply;
}

/** 決まった形のメッセージを処理する。該当しなければ null。 */
function handleCommand_(text, userId, state) {
  if (!text) return '';
  if (/^(ヘルプ|help|使い方)$/i.test(text)) return HELP_TEXT;

  const checkReply = handleCheckAnswer_(text, state, userId);
  if (checkReply) return checkReply;

  const soldReply = handleSoldOut_(text, userId);
  if (soldReply) return soldReply;

  const priceReply = handlePriceChange_(text, userId);
  if (priceReply) return priceReply;

  if (/^値下げ候補$/.test(text)) return discountListText_();

  if (/^(状況|じょうきょう|status)$/i.test(text)) {
    const lines = ['今日の登録: ' + todayCount_(state) + '件'];
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
    logEvent_('cancel', userId, n + '枚');
    return '登録待ちの写真' + n + '枚を取り消しました。';
  }

  if (/^催促(オフ|off|停止|ストップ)$/i.test(text)) {
    state.nagOff = true;
    logEvent_('nag_off', userId, '');
    return '催促を止めました。再開するときは「催促オン」と送ってください。';
  }
  if (/^催促(オン|on|再開)$/i.test(text)) {
    state.nagOff = false;
    return '催促を再開しました💪';
  }

  // 注意事項の確認待ちが1件だけなら、「OK」でそのまま登録に進める
  if (/^(ok|ｏｋ|はい|そのまま|大丈夫|だいじょうぶ|それで)/i.test(text)) {
    const waiting = state.drafts.filter(function (d) { return d.warningFor && d.confirmedFor !== d.warningFor; });
    if (waiting.length === 1) {
      waiting[0].confirmedFor = waiting[0].warningFor;
      const settled = settleDrafts_(state, userId);
      return [settled.notes.join('\n'), publishDrafts_(userId, settled.ready, state)].filter(Boolean).join('\n\n')
        || 'わかりました。';
    }
  }
  return null;
}

function handleTextTurn_(userId, text, state) {
  if (!state.drafts.length) {
    return '今は登録待ちの写真がありません。新しい生地の写真を送ってください📷\n（使い方は「ヘルプ」）';
  }
  const ai = aiTurn_({ drafts: state.drafts, userText: text, history: state.history, workerName: userName_(userId) });
  const result = applyAiResult_(state, ai, userId);
  const reply = [result.reply].concat(result.notes).concat([publishDrafts_(userId, result.ready, state)])
    .filter(Boolean).join('\n\n');
  pushHistory_(state, 'user', text);
  pushHistory_(state, 'assistant', reply);
  return reply;
}

/** 写真を Drive に保存して登録待ちに加え、AI に確認させる。 */
function processPhotos_(userId, files, text, state) {
  const folder = DriveApp.getFolderById(requireProp_('PHOTO_FOLDER_ID'));
  const images = [];
  files.forEach(function (f) {
    const no = ++state.seq;
    const blob = downloadSlackFile_(f.url);
    const ext = (String(f.mimetype).split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const file = folder.createFile(blob.setName(formatDate_(new Date(), 'yyMMdd_HHmmss') + '_' + no + '.' + ext));
    state.drafts.push({ no: no, fileId: file.getId(), price: CONFIG.DEFAULT_PRICE, priceDefault: true });
    try {
      const thumb = downloadSlackFile_(f.thumb); // Slack のサムネイルは JPEG/PNG なので、HEIC でも AI に見せられる
      images.push({ no: no, dataUrl: 'data:' + (thumb.getContentType() || 'image/jpeg') + ';base64,' + Utilities.base64Encode(thumb.getBytes()) });
    } catch (e) {
      console.error('サムネイルの取得に失敗: ' + e.message);
    }
  });
  logEvent_('photo', userId, files.length + '枚');

  const ai = aiTurn_({ drafts: state.drafts, userText: text, images: images, history: state.history, workerName: userName_(userId) });
  const result = applyAiResult_(state, ai, userId);
  const reply = [result.reply].concat(result.notes).concat([publishDrafts_(userId, result.ready, state)])
    .filter(Boolean).join('\n\n');
  pushHistory_(state, 'user', '[写真' + images.map(function (i) { return circled_(i.no); }).join('') + 'を送信] ' + (text || ''));
  pushHistory_(state, 'assistant', reply);
  return reply;
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
function applyAiResult_(state, ai, userId) {
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
  const settled = settleDrafts_(state, userId);
  const cancelled = ai.cancel.length ? ['（写真' + ai.cancel.map(circled_).join('') + ' は取り消しました）'] : [];
  return { reply: ai.reply, ready: settled.ready, notes: cancelled.concat(settled.notes) };
}

/**
 * 商品名と管理番号がそろった写真をチェックし、問題なければ登録待ちから外して返す。
 * 問題があれば issue に理由を入れて、作業者に確認する。
 */
function settleDrafts_(state, userId) {
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
      if (d.issue !== check.error) {
        notes.push('⚠️ 写真' + circled_(d.no) + ': ' + check.error);
        logEvent_('issue', userId, check.error);
      }
      d.issue = check.error;
      return true;
    }
    if (check.warning && d.confirmedFor !== mn) {
      if (d.issue !== check.warning) {
        notes.push('⚠️ 写真' + circled_(d.no) + ': ' + check.warning
          + '\nこのままでよければ「OK」、違うなら正しい番号を送ってください。');
        logEvent_('issue', userId, check.warning);
      }
      d.issue = check.warning;
      d.warningFor = mn;
      return true;
    }
    d.issue = '';
    takenInThisBatch[mn] = true;
    ready.push(d);
    return false;
  });
  if (!state.drafts.length) state.history = [];
  return { ready: ready, notes: notes };
}

/** 写真を Cloudinary に上げて、在庫管理シートに「公開中」で追加する。 */
function publishDrafts_(userId, drafts, state) {
  if (!drafts.length) return '';
  const lines = [];
  drafts.forEach(function (d) {
    try {
      const check = checkManagementNumber_(d.managementNumber, listProducts_());
      if (check.error) throw new Error(check.error);
      const url = uploadToCloudinary_(DriveApp.getFileById(d.fileId).getBlob(), d.managementNumber);
      insertProduct_({ name: d.name, managementNumber: d.managementNumber, photo: url, price: d.price });
      recordRegistration_(state);
      logEvent_('published', userId, d.name + ' ' + d.managementNumber + ' ' + d.price + '円');
      lines.push('✅ 公開しました: ' + d.name + ' ' + d.managementNumber + ' ' + d.price + '円'
        + (d.priceDefault ? '（いつもの値段）' : '') + '\n' + url);
    } catch (e) {
      console.error(e && e.stack ? e.stack : e);
      d.issue = e.message;
      state.drafts.push(d);
      lines.push('⚠️ 写真' + circled_(d.no) + ' を登録できませんでした: ' + e.message);
    }
  });
  if (!state.drafts.length) lines.push('次の生地の写真もお願いします📷');
  return lines.join('\n');
}
