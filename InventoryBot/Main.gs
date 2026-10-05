/**
 * Google Chat からのイベントを受け取るハンドラ。
 *
 * - 写真つきメッセージ: すぐに「受け取りました」と返し、画像解析はキュー経由で非同期に行う
 *   （Chat は 30 秒以内に返事しないとエラー表示になるため）
 * - テキストだけのメッセージ: その場で Grok に渡して返事する
 */

const HELP_TEXT = [
  '*' + CONFIG.BOT_NAME + 'の使い方*',
  '・新しい生地の写真を1枚（表・裏などは1回でまとめて）送ってください。',
  '・写真を見て色や柄を読み取ります。長さや保管場所など足りない情報だけ質問します。',
  '・コマンド: 「状況」「キャンセル」「あとで」「続き F-00012」「催促オフ」「催促オン」「ヘルプ」',
  '・管理者向け: 「指示: ○○」で Bot のふるまいを追加、「指示一覧」「指示クリア」',
].join('\n');

function onAddedToSpace(event) {
  registerSpace_(event);
  const name = event.user && event.user.displayName ? event.user.displayName + 'さん、' : '';
  return {
    text: name + 'よろしくお願いします！' + CONFIG.BOT_NAME + 'です📦\n'
      + '新しく入った生地の写真をここに送ってください。在庫表への登録はこちらでやります。\n\n' + HELP_TEXT,
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
      return { text: '📷 受け取りました！写真を確認しています。少しお待ちください…' };
    }
    if (attachments.length) {
      return { text: '画像ファイル（写真）を送ってください🙏' };
    }

    const commandReply = handleCommand_(text, event);
    if (commandReply) return { text: commandReply };

    return { text: handleTextTurn_(user, text) };
  } catch (e) {
    console.error(e && e.stack ? e.stack : e);
    return { text: '⚠️ エラーが発生しました: ' + e.message };
  }
}

function handleCommand_(text, event) {
  const user = event.user;
  const state = getState_(user.name);

  if (/^(ヘルプ|help|使い方)$/i.test(text)) return HELP_TEXT;

  const instructionReply = handleInstructionCommand_(text, user);
  if (instructionReply) return instructionReply;

  if (/^(状況|じょうきょう|status)$/i.test(text)) {
    const stats = statsFor_(listItems_(), user.name);
    const lines = [
      '今日の登録: ' + stats.todayCount + '件（累計 ' + stats.totalCount + '件）',
    ];
    if (stats.incomplete.length) {
      lines.push('入力が終わっていない生地:');
      stats.incomplete.forEach(function (it) {
        lines.push('・' + it.id + '（' + (it.name || '名前未定') + '）… 未入力: '
          + missingRequired_(it).map(function (f) { return f.label; }).join('、'));
      });
    }
    return lines.join('\n');
  }

  if (/^(キャンセル|取り消し|取消)$/.test(text)) {
    if (!state.activeId) return '今、登録中の生地はありません。';
    updateItem_(state.activeId, { status: STATUS.CANCELLED });
    const id = state.activeId;
    saveState_(user.name, { history: [] });
    return id + ' の登録を取り消しました。';
  }

  if (/^(あとで|後で|保留)$/.test(text)) {
    if (!state.activeId) return '今、登録中の生地はありません。';
    const id = state.activeId;
    saveState_(user.name, { history: [] });
    return id + ' はいったん保留にします。足りない情報は、あとで催促しますね。次の生地の写真をどうぞ📷';
  }

  const resume = text.match(/^続き\s*(\S+)$/);
  if (resume) {
    const found = findItem_(resume[1]);
    if (!found) return resume[1] + ' が見つかりませんでした。';
    saveState_(user.name, { activeId: found.item.id, history: [] });
    const missing = missingRequired_(found.item).map(function (f) { return f.label; });
    return found.item.id + '（' + (found.item.name || '名前未定') + '）の続きです。'
      + (missing.length ? '未入力: ' + missing.join('、') + ' を教えてください。' : '必須項目は入力済みです。訂正があればどうぞ。');
  }

  if (/^催促(オフ|off|停止|ストップ)$/i.test(text)) {
    return setNagEnabled_(event.space.name, false)
      ? '催促を止めました。再開するときは「催促オン」と送ってください。'
      : '催促は 1対1 のチャットでだけ設定できます。';
  }
  if (/^催促(オン|on|再開)$/i.test(text)) {
    return setNagEnabled_(event.space.name, true)
      ? '催促を再開しました💪'
      : '催促は 1対1 のチャットでだけ設定できます。';
  }
  return null;
}

/**
 * テキストだけのメッセージ。登録中の生地があればその項目を埋める。
 * 登録中のものがなければ、その作業者の一番古い「入力中」の生地を対象にする。
 */
function handleTextTurn_(user, text) {
  const state = getState_(user.name);
  let found = state.activeId ? findItem_(state.activeId) : null;

  if (!found || found.item.status === STATUS.CANCELLED) {
    const pending = statsFor_(listItems_(), user.name).incomplete;
    if (!pending.length) {
      return '今は登録中の生地がありません。新しい生地の写真を送ってください📷\n（使い方は「ヘルプ」）';
    }
    found = findItem_(pending[0].id);
    state.activeId = found.item.id;
    state.history = [];
  }

  const result = grokTurn_({ item: found.item, userText: text, history: state.history });
  const reply = applyGrokResult_(state, found.item, result);
  pushHistory_(state, 'user', text);
  pushHistory_(state, 'assistant', reply);
  saveState_(user.name, state);
  return reply;
}

/**
 * Grok の返答を在庫表に反映し、作業者への返事を組み立てる。
 * 「登録しました」の確認文は Grok 任せにせず、実際に書き込んだ値から作る。
 */
function applyGrokResult_(state, item, result) {
  if (result.action === 'cancel') {
    updateItem_(item.id, { status: STATUS.CANCELLED });
    state.activeId = null;
    state.history = [];
    return (result.reply || '') + '\n（' + item.id + ' の登録を取り消しました）';
  }

  const wasDone = item.status === STATUS.DONE;
  const updated = updateItem_(item.id, sanitizeFields_(result.fields));
  let reply = result.reply || '';
  if (updated.status === STATUS.DONE && !wasDone) {
    reply += '\n\n✅ 登録しました【' + updated.id + '】' + describeItem_(updated);
  }
  return reply.trim();
}

// ---------------------------------------------------------------------------
// 写真の非同期処理キュー
// ---------------------------------------------------------------------------

function enqueueJob_(job) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
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

/** 時間主導トリガーから呼ばれる。キューにたまった写真を順に処理する。 */
function processQueue() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'processQueue') ScriptApp.deleteTrigger(t);
  });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  let jobs;
  try {
    jobs = JSON.parse(getProp_('queue') || '[]');
    setProp_('queue', '[]');
  } finally {
    lock.releaseLock();
  }

  jobs.forEach(function (job) {
    try {
      postMessage_(job.spaceName, processPhotoJob_(job), job.threadName);
    } catch (e) {
      console.error(e && e.stack ? e.stack : e);
      try {
        postMessage_(job.spaceName, '⚠️ 写真の処理中にエラーが発生しました: ' + e.message + '\nもう一度送ってもらえますか？', job.threadName);
      } catch (e2) {
        console.error(e2);
      }
    }
  });

  if (JSON.parse(getProp_('queue') || '[]').length) ensureQueueTrigger_();
}

function processPhotoJob_(job) {
  const state = getState_(job.user.name);
  let note = '';
  if (state.activeId) {
    const prev = findItem_(state.activeId);
    if (prev && prev.item.status === STATUS.DRAFT) {
      note = '前の生地 ' + prev.item.id + ' は未入力の項目が残ったまま保留になった。返事の最後に一言だけ触れる。';
    }
  }

  const item = createItem_(job.user);
  const folder = DriveApp.getFolderById(requireProp_('PHOTO_FOLDER_ID'));
  const urls = [];
  const images = [];
  job.attachments.forEach(function (att, i) {
    const blob = downloadAttachment_(att);
    const ext = (att.contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const file = folder.createFile(blob.setName(item.id + '_' + (i + 1) + '.' + ext));
    urls.push(file.getUrl());
    const dataUrl = toImageDataUrl_(blob, file);
    if (dataUrl) images.push(dataUrl);
  });
  const saved = updateItem_(item.id, { photos: urls.join('\n') });

  if (!images.length) {
    return '写真は保存しましたが、この画像形式は読み取れませんでした（' + saved.id + '）。\n'
      + 'JPEG か PNG で送り直すか、色・柄・素材を文字で教えてください。';
  }

  const fresh = { activeId: saved.id, history: [] };
  const result = grokTurn_({ item: saved, userText: job.text, images: images, history: [], note: note });
  const reply = applyGrokResult_(fresh, saved, result);
  pushHistory_(fresh, 'user', '[写真を送信] ' + (job.text || ''));
  pushHistory_(fresh, 'assistant', reply);
  saveState_(job.user.name, fresh);
  return '【' + saved.id + '】\n' + reply;
}

/**
 * Grok に渡せる形式（JPEG/PNG の data URL）に変換する。
 * HEIC などはDriveのサムネイル（PNG）で代用し、それもなければ null。
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
