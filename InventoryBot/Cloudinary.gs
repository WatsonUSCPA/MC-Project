/**
 * Cloudinary への写真アップロード。EC サイトは Cloudinary の URL を表示している。
 * ファイル名は今までと同じく「yyMMdd_管理番号_ランダム」にする。
 */

function toHex_(bytes) {
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function uploadToCloudinary_(blob, managementNumber) {
  const cloud = requireProp_('CLOUDINARY_CLOUD_NAME');
  const apiKey = requireProp_('CLOUDINARY_API_KEY');
  const secret = requireProp_('CLOUDINARY_API_SECRET');

  const random = Math.random().toString(36).slice(2, 8);
  const publicId = formatDate_(new Date(), 'yyMMdd') + '_' + normalizeMn_(managementNumber) + '_' + random;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const toSign = 'public_id=' + publicId + '&timestamp=' + timestamp + secret;
  const signature = toHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, toSign, Utilities.Charset.UTF_8));

  const res = UrlFetchApp.fetch('https://api.cloudinary.com/v1_1/' + cloud + '/image/upload', {
    method: 'post',
    payload: {
      file: blob,
      api_key: apiKey,
      timestamp: timestamp,
      public_id: publicId,
      signature: signature,
    },
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('Cloudinary へのアップロードに失敗しました: ' + res.getContentText().slice(0, 300));
  }
  const url = JSON.parse(res.getContentText()).secure_url;
  // HEIC などはブラウザで表示できないので、Cloudinary の自動変換で JPEG として配信する
  return url.replace(/\.(heic|heif|tiff?)$/i, '.jpg');
}
