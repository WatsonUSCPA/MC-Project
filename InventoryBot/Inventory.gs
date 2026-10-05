/**
 * 在庫表（スプレッドシート）の読み書き。
 */

function getSheet_() {
  const ss = SpreadsheetApp.openById(requireProp_('INVENTORY_SHEET_ID'));
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('在庫表に「' + CONFIG.SHEET_NAME + '」シートがありません。setup() を実行してください。');
  return sheet;
}

function rowToItem_(row) {
  const item = {};
  FIELDS.forEach(function (f, i) { item[f.key] = row[i]; });
  return item;
}

function itemToRow_(item) {
  return FIELDS.map(function (f) {
    const v = item[f.key];
    return v === undefined || v === null ? '' : v;
  });
}

function listItems_() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, FIELDS.length).getValues()
    .filter(function (row) { return row[0] !== ''; })
    .map(rowToItem_);
}

function findItem_(id) {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  if (!id || lastRow < 2) return null;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      const rowIndex = i + 2;
      const row = sheet.getRange(rowIndex, 1, 1, FIELDS.length).getValues()[0];
      return { item: rowToItem_(row), rowIndex: rowIndex };
    }
  }
  return null;
}

function nextId_() {
  const n = Number(getProp_('ID_COUNTER') || 0) + 1;
  setProp_('ID_COUNTER', String(n));
  return CONFIG.ID_PREFIX + ('0000' + n).slice(-5);
}

function createItem_(user) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const now = new Date();
    const item = {
      id: nextId_(),
      status: STATUS.DRAFT,
      createdAt: now,
      updatedAt: now,
      reporter: user.displayName || '',
      reporterId: user.name || '',
      photos: '',
    };
    getSheet_().appendRow(itemToRow_(item));
    return item;
  } finally {
    lock.releaseLock();
  }
}

/**
 * 項目を更新し、必須項目の埋まり具合からステータスを再計算する。
 * キャンセル済みや、人が手で変えたステータス（確認済みなど）は上書きしない。
 */
function updateItem_(id, patch) {
  const found = findItem_(id);
  if (!found) throw new Error('管理番号 ' + id + ' が在庫表に見つかりません。');
  const item = Object.assign({}, found.item, patch, { updatedAt: new Date() });
  const autoStatuses = [STATUS.DRAFT, STATUS.DONE, ''];
  if (patch.status === undefined && autoStatuses.indexOf(item.status) >= 0) {
    item.status = missingRequired_(item).length ? STATUS.DRAFT : STATUS.DONE;
  }
  getSheet_().getRange(found.rowIndex, 1, 1, FIELDS.length).setValues([itemToRow_(item)]);
  return item;
}

function missingRequired_(item) {
  return FIELDS.filter(function (f) {
    return f.required && (item[f.key] === '' || item[f.key] === undefined || item[f.key] === null);
  });
}

/**
 * Grok が返した fields を、編集可能な列だけ・型を整えて取り出す。
 */
function sanitizeFields_(fields) {
  const patch = {};
  if (!fields || typeof fields !== 'object') return patch;
  editableFields_().forEach(function (f) {
    if (!(f.key in fields)) return;
    let v = fields[f.key];
    if (v === null || v === undefined || v === '') return;
    if (f.type === 'number') {
      v = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.]/g, ''));
      if (isNaN(v)) return;
    } else {
      v = String(v).trim();
    }
    patch[f.key] = v;
  });
  return patch;
}

function statsFor_(items, reporterId) {
  const today = formatDate_(new Date(), 'yyyy/MM/dd');
  const mine = items.filter(function (it) {
    return it.reporterId === reporterId && it.status !== STATUS.CANCELLED;
  });
  const todayItems = mine.filter(function (it) {
    return it.createdAt instanceof Date && formatDate_(it.createdAt, 'yyyy/MM/dd') === today;
  });
  const incomplete = mine.filter(function (it) { return it.status === STATUS.DRAFT; });
  let last = null;
  mine.forEach(function (it) {
    if (it.createdAt instanceof Date && (!last || it.createdAt > last)) last = it.createdAt;
  });
  const daysSinceLast = last ? Math.floor((new Date() - last) / 86400000) : null;
  return {
    todayCount: todayItems.length,
    totalCount: mine.length,
    incomplete: incomplete,
    lastCreatedAt: last,
    daysSinceLast: daysSinceLast,
  };
}

function describeItem_(item) {
  return editableFields_()
    .filter(function (f) { return item[f.key] !== '' && item[f.key] !== undefined; })
    .map(function (f) { return f.label + ': ' + item[f.key]; })
    .join(' / ');
}
