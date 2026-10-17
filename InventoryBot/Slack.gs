/**
 * Slack Web API の呼び出し。
 */

function slackApi_(method, payload) {
  const res = UrlFetchApp.fetch('https://slack.com/api/' + method, {
    method: 'post',
    contentType: 'application/json; charset=utf-8',
    headers: { Authorization: 'Bearer ' + requireProp_('SLACK_BOT_TOKEN') },
    payload: JSON.stringify(payload || {}),
    muteHttpExceptions: true,
  });
  const body = JSON.parse(res.getContentText());
  if (!body.ok) throw new Error('Slack API ' + method + ' エラー: ' + body.error);
  return body;
}

/** GET で呼ぶ API（users.info など、JSON ボディを受け付けないもの）。 */
function slackGet_(method, params) {
  const query = Object.keys(params || {}).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');
  const res = UrlFetchApp.fetch('https://slack.com/api/' + method + (query ? '?' + query : ''), {
    headers: { Authorization: 'Bearer ' + requireProp_('SLACK_BOT_TOKEN') },
    muteHttpExceptions: true,
  });
  const body = JSON.parse(res.getContentText());
  if (!body.ok) throw new Error('Slack API ' + method + ' エラー: ' + body.error);
  return body;
}

function postMessage_(channel, text, threadTs) {
  const payload = { channel: channel, text: text, unfurl_links: false, unfurl_media: false };
  if (threadTs) payload.thread_ts = threadTs;
  return slackApi_('chat.postMessage', payload);
}

/** 在庫チャンネルに投稿する。 */
function postToChannel_(text) {
  return postMessage_(requireProp_('SLACK_CHANNEL_ID'), text);
}

/** 社長（SLACK_ADMIN_IDS の全員）に DM を送る。 */
function postToAdmins_(text) {
  adminIds_().forEach(function (id) {
    try {
      const dm = slackApi_('conversations.open', { users: id });
      postMessage_(dm.channel.id, text);
    } catch (e) {
      console.error('社長への DM に失敗: ' + id + ' ' + e.message);
    }
  });
}

function adminIds_() {
  return (getProp_('SLACK_ADMIN_IDS') || '').split(',')
    .map(function (s) { return s.trim(); })
    .filter(Boolean);
}

function isAdmin_(userId) {
  return adminIds_().indexOf(userId) >= 0;
}

function mention_(userId) {
  return '<@' + userId + '>';
}

/** ユーザーの表示名（キャッシュあり）。 */
function userName_(userId) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('name:' + userId);
  if (cached) return cached;
  let name = userId;
  try {
    const user = slackGet_('users.info', { user: userId }).user;
    name = (user.profile && (user.profile.display_name || user.profile.real_name)) || user.real_name || user.name || userId;
  } catch (e) {
    console.error(e.message);
  }
  cache.put('name:' + userId, name, 21600);
  return name;
}

/**
 * 作業者の一覧 = 在庫チャンネルのメンバーから、社長と Bot を除いた人。
 * 結果はスクリプトプロパティ workers に保存しておき、1日1回更新する。
 */
function refreshWorkers_() {
  const members = slackGet_('conversations.members', { channel: requireProp_('SLACK_CHANNEL_ID'), limit: 200 }).members;
  const workers = [];
  members.forEach(function (id) {
    if (isAdmin_(id)) return;
    const user = slackGet_('users.info', { user: id }).user;
    if (user.is_bot || user.deleted || id === 'USLACKBOT') return;
    workers.push({ id: id, name: (user.profile && (user.profile.display_name || user.profile.real_name)) || user.name });
    const state = getState_(id);
    if (!state.firstSeenAt) {
      state.firstSeenAt = new Date().toISOString(); // 一度も発言していない人の「反応なし」日数の起点
      saveState_(id, state);
    }
  });
  setProp_('workers', JSON.stringify(workers));
  return workers;
}

function getWorkers_() {
  return JSON.parse(getProp_('workers') || '[]');
}

/** Slack の本文から、メンションや記号のエスケープを取り除く。 */
function cleanSlackText_(text) {
  return String(text || '')
    .replace(/<@[A-Z0-9]+>/g, '')
    .replace(/<(https?:[^|>]+)\|([^>]+)>/g, '$2')
    .replace(/<(https?:[^>]+)>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .trim();
}

/** Slack に投稿された画像ファイルをダウンロードする（files:read 権限が必要）。 */
function downloadSlackFile_(url) {
  const res = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + requireProp_('SLACK_BOT_TOKEN') },
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('写真のダウンロードに失敗しました (' + res.getResponseCode() + ')');
  }
  return res.getBlob();
}
