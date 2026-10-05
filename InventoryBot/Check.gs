/**
 * 売り切れ・値段の変更・売れ残りチェック（「これ10か月残ってるけど、まだある？」）。
 *
 * stockCheck は setup() が毎日 CHECK_HOUR 時に登録する。
 * アップロードから AGING_MONTHS か月以上たった「公開中」の生地を、作業者に1件ずつ聞く。
 *   「ない」 → 非公開にする
 *   「ある」 → 値下げ候補にして、値段を変えるか聞く
 * 聞いた結果はスクリプトプロパティ checks に保存する（シートに列は足さない）。
 */

const SOLD_WORDS = /(売り切れ|売切|完売|使い切|売れた|売れました|なくなった|無くなった|なくなりました|非公開に)/;
const PRICE_WORDS = /(値下げ|値上げ|値段|価格|変更|にして)/;

function getChecks_() {
  return JSON.parse(getProp_('checks') || '{}');
}

function saveCheck_(mn, result) {
  const checks = getChecks_();
  checks[normalizeMn_(mn)] = { date: todayString_(), result: result };
  setProp_('checks', JSON.stringify(checks));
}

/** メッセージの中から、シートにある管理番号を探す。 */
function findProductsInText_(text, products) {
  const byMn = {};
  products.forEach(function (p) { byMn[normalizeMn_(p.managementNumber)] = p; });
  const tokens = normalizeMn_(text).match(/[A-Z0-9][A-Z0-9\-]*-[A-Z0-9]+|[A-Z0-9]{3,}/g) || [];
  const found = [];
  tokens.forEach(function (t) {
    if (byMn[t] && found.indexOf(byMn[t]) < 0) found.push(byMn[t]);
  });
  return found;
}

function priceInText_(text) {
  const m = normalizeMn_(text).replace(/,/g, '').match(/(\d+)円/);
  return m ? Number(m[1]) : null;
}

/** 「200-1051 売り切れ」→ 非公開にする。 */
function handleSoldOut_(text) {
  if (!SOLD_WORDS.test(text)) return null;
  const found = findProductsInText_(text, listProducts_());
  if (!found.length) {
    return 'どの生地ですか？「200-1051 売り切れ」のように管理番号を付けて送ってください。';
  }
  found.forEach(function (p) {
    setProductStatus_(p.managementNumber, CONFIG.STATUS_PRIVATE);
    saveCheck_(p.managementNumber, 'sold');
  });
  return '了解です！非公開にしました🎉\n' + found.map(function (p) { return '・' + productLabel_(p); }).join('\n');
}

/** 「200-1051 値下げ 800円」→ 値段を変える。 */
function handlePriceChange_(text) {
  if (!PRICE_WORDS.test(text)) return null;
  const price = priceInText_(text);
  if (!price) return null;
  const found = findProductsInText_(text, listProducts_());
  if (!found.length) return null;
  found.forEach(function (p) { setProductPrice_(p.managementNumber, price); });
  return '値段を' + price + '円に変更しました🏷️\n' + found.map(function (p) {
    return '・' + productLabel_(p) + ' ' + p.price + '円 → ' + price + '円';
  }).join('\n');
}

function monthsSince_(date) {
  return date instanceof Date ? (new Date() - date) / (30.4 * 86400000) : 0;
}

function isDueForCheck_(p, checks) {
  if (p.status !== CONFIG.STATUS_PUBLIC) return false;
  if (monthsSince_(p.uploadDate) < CONFIG.AGING_MONTHS) return false;
  const last = checks[normalizeMn_(p.managementNumber)];
  if (!last) return true;
  return (new Date() - parseSheetDate_(last.date)) / 86400000 >= CONFIG.RECHECK_DAYS;
}

function checkQuestion_(p, index, total) {
  return [
    '📦 在庫チェックです（' + index + '/' + total + '）',
    productLabel_(p) + ' ' + p.price + '円',
    'アップロードから' + Math.floor(monthsSince_(p.uploadDate)) + 'か月たちました。まだ残っていますか？',
    '「ある」「ない」で返事してください。',
    p.photo ? '写真: ' + p.photo : '',
  ].filter(Boolean).join('\n');
}

/** 時間主導トリガーから呼ばれる。売れ残りを作業者に分けて聞く。 */
function stockCheck() {
  const weekday = Number(formatDate_(new Date(), 'u')) % 7; // 'u' は 1=月 ... 7=日
  if (CONFIG.NAG_WEEKDAYS.indexOf(weekday) < 0) return;

  const checks = getChecks_();
  const spaces = Object.keys(getSpaces_()).map(function (k) { return getSpaces_()[k]; })
    .filter(function (s) {
      if (s.nag === false) return false;
      const st = getState_(s.userId);
      return !(st.checkQueue && st.checkQueue.length) && !st.priceTarget; // 前回の質問に答えていない人は飛ばす
    });
  if (!spaces.length) return;

  const due = listProducts_()
    .filter(function (p) { return isDueForCheck_(p, checks); })
    .sort(function (a, b) { return (a.uploadDate || 0) - (b.uploadDate || 0); })
    .slice(0, CONFIG.CHECKS_PER_DAY * spaces.length);

  // 作業者が複数いれば、順番に振り分ける
  spaces.forEach(function (space, i) {
    const mine = due.filter(function (_, j) { return j % spaces.length === i; }).slice(0, CONFIG.CHECKS_PER_DAY);
    if (!mine.length) return;
    const state = getState_(space.userId);
    state.checkQueue = mine.map(function (p) { return p.managementNumber; });
    state.checkTotal = mine.length;
    saveState_(space.userId, state);
    try {
      postMessage_(space.spaceName, checkQuestion_(mine[0], 1, mine.length));
    } catch (e) {
      console.error('在庫チェックの送信に失敗: ' + space.spaceName + ' ' + e.message);
    }
  });
}

/**
 * 在庫チェックへの返事を処理し、次の質問を続けて返す。
 * チェック中でない、または返事として読めなければ null。state は呼び出し元が保存する。
 */
function handleCheckAnswer_(text, state) {
  // 「ある」と答えたあとの、値段の質問への返事
  if (state.priceTarget) {
    const mn = state.priceTarget;
    const price = priceInText_(text.replace(/^(\d[\d,]*)$/, '$1円'));
    const keep = /^(そのまま|しない|いい|大丈夫|変えない|なし)/.test(text);
    if (!price && !keep) return null;
    state.priceTarget = null;
    let reply = '';
    if (price) {
      const p = setProductPrice_(mn, price);
      reply = productLabel_(p) + ' を' + price + '円に変更しました🏷️';
    } else {
      reply = '値段はそのままにしておきます。';
    }
    return reply + '\n\n' + nextCheckQuestion_(state);
  }

  if (!state.checkQueue || !state.checkQueue.length) return null;
  const isNo = /^(ない|無い|なし|ありません|もうない|売り切れ|売れた|完売|使い切)/.test(text);
  const isYes = !isNo && /^(ある|あります|有る|まだある|残って)/.test(text);
  if (!isNo && !isYes) return null;

  const mn = state.checkQueue.shift();
  const p = findProduct_(mn);
  if (!p) return mn + ' がシートに見つかりませんでした。\n\n' + nextCheckQuestion_(state);

  if (isNo) {
    setProductStatus_(mn, CONFIG.STATUS_PRIVATE);
    saveCheck_(mn, 'sold');
    return productLabel_(p) + ' を非公開にしました。\n\n' + nextCheckQuestion_(state);
  }

  saveCheck_(mn, 'remaining');
  const price = priceInText_(text);
  if (price) {
    setProductPrice_(mn, price);
    return productLabel_(p) + ' を' + price + '円に変更しました🏷️\n\n' + nextCheckQuestion_(state);
  }
  state.priceTarget = mn;
  return productLabel_(p) + ' はまだあるんですね。値下げ候補に入れておきます。\n'
    + '今は' + p.price + '円です。値下げするなら「800円」のように、そのままなら「そのまま」と送ってください。';
}

function nextCheckQuestion_(state) {
  const checks = getChecks_();
  const total = state.checkTotal || 1;
  while (state.checkQueue && state.checkQueue.length) {
    const p = findProduct_(state.checkQueue[0]);
    if (p && isDueForCheck_(p, checks)) {
      return checkQuestion_(p, total - state.checkQueue.length + 1, total);
    }
    state.checkQueue.shift(); // ほかの人がすでに答えた、など
  }
  return '今日の在庫チェックは以上です。ありがとうございました🙏';
}

function discountListText_() {
  const checks = getChecks_();
  const list = listProducts_().filter(function (p) {
    const c = checks[normalizeMn_(p.managementNumber)];
    return p.status === CONFIG.STATUS_PUBLIC && c && c.result === 'remaining';
  });
  if (!list.length) return '値下げ候補はまだありません。';
  return '値下げ候補（長く残っている生地）:\n' + list.map(function (p) {
    return '・' + productLabel_(p) + ' ' + p.price + '円・アップロードから' + Math.floor(monthsSince_(p.uploadDate)) + 'か月';
  }).join('\n') + '\n値段を変えるなら「200-1051 値下げ 800円」のように送ってください。';
}
