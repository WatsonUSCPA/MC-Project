/**
 * 在庫管理シート「商品データ履歴」の読み書き。
 * EC サイトはこのシートの「公開中」の行を表示しているので、書き込みは必ずここを通す。
 */

function getProductSheet_() {
  const id = getProp_('PRODUCT_SHEET_ID') || CONFIG.PRODUCT_SHEET_ID_DEFAULT;
  const sheet = SpreadsheetApp.openById(id).getSheetByName(CONFIG.PRODUCT_SHEET_NAME);
  if (!sheet) throw new Error('在庫管理シートに「' + CONFIG.PRODUCT_SHEET_NAME + '」がありません。');
  return sheet;
}

/** 全角英数字・いろいろなハイフンをそろえて、管理番号を比べやすくする。 */
function normalizeMn_(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/[０-９Ａ-Ｚａ-ｚ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
    .replace(/[‐‑‒–—―−ー－]/g, '-')
    .replace(/\s+/g, '')
    .toUpperCase();
}

function parseSheetDate_(value) {
  if (value instanceof Date) return value;
  const m = String(value || '').match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

function rowToProduct_(row, rowIndex) {
  return {
    row: rowIndex,
    name: String(row[COL.name - 1]),
    managementNumber: String(row[COL.mn - 1]).trim(),
    photo: String(row[COL.photo - 1]),
    price: row[COL.price - 1],
    status: String(row[COL.status - 1]),
    uploadDate: parseSheetDate_(row[COL.uploadDate - 1]),
  };
}

function listProducts_() {
  const sheet = getProductSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < CONFIG.FIRST_DATA_ROW) return [];
  return sheet.getRange(CONFIG.FIRST_DATA_ROW, 1, lastRow - CONFIG.FIRST_DATA_ROW + 1, NUM_COLS).getValues()
    .map(function (row, i) { return rowToProduct_(row, CONFIG.FIRST_DATA_ROW + i); })
    .filter(function (p) { return p.managementNumber && p.managementNumber !== '管理番号'; });
}

function findProduct_(mn) {
  const key = normalizeMn_(mn);
  if (!key) return null;
  const products = listProducts_();
  for (let i = 0; i < products.length; i++) {
    if (normalizeMn_(products[i].managementNumber) === key) return products[i];
  }
  return null;
}

function productLabel_(p) {
  return p.managementNumber + '（' + (p.name || '商品名なし') + '）';
}

/**
 * 登録前の管理番号チェック。
 *   error   … 登録させない（すでに同じ番号がある）
 *   warning … 作業者に確認してから登録する（番号の形がいつもと違う など）
 */
function checkManagementNumber_(mn, products) {
  const key = normalizeMn_(mn);
  const dup = products.filter(function (p) { return normalizeMn_(p.managementNumber) === key; })[0];
  if (dup) {
    return {
      error: key + ' はすでに登録されています（' + dup.name + '、'
        + (dup.uploadDate ? formatDate_(dup.uploadDate, 'yyyy/MM/dd') : '日付なし') + '、' + dup.status + '）。番号を確認してください。',
    };
  }

  const parts = key.match(/^(.*)-(\d+)$/);
  if (!parts) {
    return { warning: '管理番号「' + key + '」は、いつもの「200-1051」のような形ではありません。' };
  }
  const prefix = parts[1];
  const suffix = parts[2];
  const sameSeries = products
    .map(function (p) { return normalizeMn_(p.managementNumber).match(/^(.*)-(\d+)$/); })
    .filter(function (m) { return m && m[1] === prefix; });

  if (!sameSeries.length) {
    return { warning: '「' + prefix + '-」で始まる管理番号はまだありません。新しいシリーズですか？' };
  }
  const nearDup = sameSeries.filter(function (m) { return Number(m[2]) === Number(suffix); })[0];
  if (nearDup) {
    return { warning: key + ' は、すでにある ' + nearDup[0] + ' と同じ番号かもしれません。' };
  }
  const lengths = {};
  sameSeries.forEach(function (m) { lengths[m[2].length] = (lengths[m[2].length] || 0) + 1; });
  const usual = Object.keys(lengths).sort(function (a, b) { return lengths[b] - lengths[a]; })[0];
  if (Number(usual) !== suffix.length && lengths[usual] / sameSeries.length >= 0.8) {
    const padded = suffix.length < usual ? prefix + '-' + ('0000000000' + suffix).slice(-usual) : null;
    return {
      warning: '「' + prefix + '-」の番号は、いつもハイフンのあとが' + usual + 'けたです。'
        + (padded ? '「' + padded + '」の間違いではありませんか？' : ''),
    };
  }
  return {};
}

/**
 * 新しい商品を4行目に追加する（既存の行は1行ずつ下にずらす）。
 * 今までの「入力シート → 商品データ履歴」ボタンと同じ書き方。
 */
function insertProduct_(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getProductSheet_();
    const first = CONFIG.FIRST_DATA_ROW;
    const lastRow = sheet.getLastRow();
    if (lastRow >= first) {
      const existing = sheet.getRange(first, 1, lastRow - first + 1, NUM_COLS).getValues();
      sheet.getRange(first + 1, 1, existing.length, NUM_COLS).setValues(existing);
    }
    const row = [];
    row[COL.name - 1] = p.name;
    row[COL.mn - 1] = p.managementNumber;
    row[COL.photo - 1] = p.photo;
    row[COL.price - 1] = p.price;
    row[COL.magazine - 1] = '';
    row[COL.status - 1] = CONFIG.STATUS_PUBLIC;
    row[COL.uploadDate - 1] = todayString_();
    row[COL.archiveDate - 1] = '';
    sheet.getRange(first, 1, 1, NUM_COLS).setValues([row]);
  } finally {
    lock.releaseLock();
  }
}

/** 行番号がずれないよう、探してから書き込むまでをロックの中で行う。 */
function setProductCell_(mn, col, value) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const p = findProduct_(mn);
    if (!p) throw new Error(mn + ' が在庫管理シートに見つかりません。');
    getProductSheet_().getRange(p.row, col).setValue(value);
    return p;
  } finally {
    lock.releaseLock();
  }
}

function setProductStatus_(mn, status) {
  return Object.assign(setProductCell_(mn, COL.status, status), { status: status });
}

function setProductPrice_(mn, price) {
  return Object.assign(setProductCell_(mn, COL.price, price), { price: price });
}
