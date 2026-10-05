/**
 * Google Chat API（アプリ認証）の呼び出し。
 * Bot から自分で話しかける（催促・写真処理後の返信）ときと、添付画像のダウンロードに使う。
 */

function base64Url_(bytesOrString) {
  return Utilities.base64EncodeWebSafe(bytesOrString).replace(/=+$/, '');
}

function getAppToken_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('chatAppToken');
  if (cached) return cached;

  const key = JSON.parse(requireProp_('SERVICE_ACCOUNT_KEY'));
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url_(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64Url_(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/chat.bot',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const signature = base64Url_(Utilities.computeRsaSha256Signature(header + '.' + claim, key.private_key));

  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    payload: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: header + '.' + claim + '.' + signature,
    },
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('Chat アプリのトークン取得に失敗しました: ' + res.getContentText());
  }
  const token = JSON.parse(res.getContentText()).access_token;
  cache.put('chatAppToken', token, 3000);
  return token;
}

function postMessage_(spaceName, text, threadName) {
  const body = { text: text };
  let url = 'https://chat.googleapis.com/v1/' + spaceName + '/messages';
  if (threadName) {
    body.thread = { name: threadName };
    url += '?messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD';
  }
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + getAppToken_() },
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('Chat へのメッセージ送信に失敗しました: ' + res.getContentText());
  }
}

/**
 * 添付画像を Blob として取得する。
 * Chat に直接アップロードされた画像は Chat API の media.download、
 * Drive から添付されたファイルは DriveApp で取得する。
 */
function downloadAttachment_(att) {
  if (att.resourceName) {
    const res = UrlFetchApp.fetch(
      'https://chat.googleapis.com/v1/media/' + att.resourceName + '?alt=media',
      { headers: { Authorization: 'Bearer ' + getAppToken_() }, muteHttpExceptions: true }
    );
    if (res.getResponseCode() !== 200) {
      throw new Error('画像のダウンロードに失敗しました: ' + res.getContentText());
    }
    return res.getBlob().setContentType(att.contentType).setName(att.contentName || 'photo');
  }
  if (att.driveFileId) {
    return DriveApp.getFileById(att.driveFileId).getBlob();
  }
  throw new Error('画像の取得方法がわかりません。');
}
