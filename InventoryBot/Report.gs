/**
 * 社長向けの機能: 出来事の記録、毎晩の日報、社長からの DM の処理。
 */

const LOG_KEEP_DAYS = 14;

/** 出来事を日付ごとに記録する（スクリプトプロパティ log:yyyy/MM/dd）。 */
function logEvent_(type, userId, detail) {
  try {
    const key = 'log:' + todayString_();
    const list = JSON.parse(getProp_(key) || '[]');
    list.push({ t: formatDate_(new Date(), 'HH:mm'), type: type, user: userId, detail: String(detail || '').slice(0, 200) });
    setProp_(key, JSON.stringify(list));
  } catch (e) {
    console.error('記録に失敗: ' + e.message);
  }
}

function getLog_(dateString) {
  return JSON.parse(getProp_('log:' + dateString) || '[]');
}

function pruneLogs_() {
  const props = PropertiesService.getScriptProperties();
  const limit = formatDate_(new Date(Date.now() - LOG_KEEP_DAYS * 86400000), 'yyyy/MM/dd');
  props.getKeys().forEach(function (k) {
    if (k.indexOf('log:') === 0 && k.slice(4) < limit) props.deleteProperty(k);
  });
}

/** 今日の状況を、社長向けの文章にまとめる。 */
function buildReport_() {
  const log = getLog_(todayString_());
  const count = function (type, userId) {
    return log.filter(function (e) { return e.type === type && (!userId || e.user === userId); }).length;
  };
  const lines = ['📋 *' + formatDate_(new Date(), 'M/d') + ' の在庫係レポート*'];

  getWorkers_().forEach(function (w) {
    const state = getState_(w.id);
    const parts = ['登録 ' + todayCount_(state) + '件'];
    if (state.drafts.length) parts.push('登録待ち ' + state.drafts.length + '枚');
    const nags = count('nag', w.id);
    const active = log.some(function (e) { return e.user === w.id && e.type !== 'nag' && e.type !== 'check_asked' && e.type !== 'escalate'; });
    if (nags && !active) parts.push('⚠️ 催促' + nags + '回・反応なし');
    const since = daysSince_(state.lastRegisteredAt);
    if (since !== null && since > 0) parts.push('最後の登録から' + since + '日');
    if (state.nagOff) parts.push('（催促オフ中）');
    lines.push('・' + w.name + ': ' + parts.join(' / '));
  });

  const published = log.filter(function (e) { return e.type === 'published'; });
  if (published.length) {
    lines.push('', '*公開した生地*');
    published.forEach(function (e) { lines.push('・' + e.detail + '（' + userName_(e.user) + '）'); });
  }
  const issues = log.filter(function (e) { return e.type === 'issue'; });
  if (issues.length) {
    lines.push('', '*止めたミス・確認したこと* ' + issues.length + '件');
    issues.slice(0, 5).forEach(function (e) { lines.push('・' + e.detail); });
  }
  const changes = log.filter(function (e) { return ['sold', 'check_sold', 'price'].indexOf(e.type) >= 0; });
  if (changes.length) {
    lines.push('', '*売り切れ・値段の変更*');
    changes.forEach(function (e) {
      lines.push('・' + (e.type === 'price' ? '値段変更 ' : '非公開に ') + e.detail + '（' + userName_(e.user) + '）');
    });
  }
  const asked = count('check_asked');
  if (asked) {
    lines.push('', '在庫チェック: 「ある」' + count('check_remaining') + '件 / 「ない」' + count('check_sold') + '件');
  }
  return lines.join('\n');
}

/** 時間主導トリガーから呼ばれる。毎晩、社長に日報を DM する。 */
function dailyReport() {
  postToAdmins_(buildReport_());
  pruneLogs_();
}

/**
 * 社長からの DM。
 *   「報告」「レポート」 → すぐに日報を返す
 *   「指示: ○○」「指示一覧」「指示クリア」 → 指示の管理
 *   それ以外 → AI に読ませて、返事と「作業者への伝言」「指示の追加」を実行する
 */
function handleAdminMessage_(userId, text) {
  if (!text) return '';
  if (/^(報告|レポート|日報|状況)$/.test(text)) return buildReport_();
  if (/^(ヘルプ|help|使い方)$/i.test(text)) {
    return [
      '*社長向けの使い方*',
      '・「報告」… 今日の状況をすぐにまとめます（毎晩' + CONFIG.REPORT_HOUR + '時にも自動で届きます）',
      '・「父さんに、今日中に3枚送ってと伝えて」… 在庫チャンネルで私から伝えます',
      '・「指示: 母にはやさしめに」… 今後の会話や催促で守るルールを追加します（「指示一覧」「指示クリア」）',
      '・ほかにも、普通に話しかけてもらえれば答えます',
    ].join('\n');
  }
  const instructionReply = handleInstructionCommand_(text, userId);
  if (instructionReply) return instructionReply;

  const workers = getWorkers_();
  const context = {
    作業者: workers.map(function (w) {
      const st = getState_(w.id);
      return {
        id: w.id,
        name: w.name,
        今日の登録: todayCount_(st),
        登録待ち: st.drafts.map(draftLabel_),
        最後の登録から何日: daysSince_(st.lastRegisteredAt),
        最後に反応してから何日: daysSince_(st.lastActiveAt),
        催促オフ: !!st.nagOff,
      };
    }),
    今日の記録: getLog_(todayString_()).slice(-30),
    現在の指示: listInstructions_(),
  };
  const ai = aiAdminTurn_(text, context);

  const done = [];
  ai.actions.forEach(function (a) {
    if (a.type === 'tell' && a.text) {
      const w = workers.filter(function (x) { return x.id === a.worker; })[0];
      if (!w) return;
      postToChannel_(mention_(w.id) + ' ' + a.text);
      logEvent_('tell', w.id, a.text);
      done.push('📣 ' + w.name + 'さんに伝えました: ' + a.text);
    } else if (a.type === 'instruct' && a.text) {
      addInstruction_(String(a.text));
      done.push('📝 指示に追加しました: ' + a.text);
    }
  });
  return [ai.reply].concat(done).filter(Boolean).join('\n');
}
