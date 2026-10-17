/**
 * 催促（お尻たたき）。setup() が毎日のトリガーを登録する。
 *   dailyNag    … 朝: 在庫チャンネルで、作業者ごとに今日の写真を送るよう声をかける。
 *                 何日も反応がない作業者がいれば、社長に DM で知らせる
 *   followupNag … 夕方: 今日まだ1件も登録がない、または登録待ちの写真が残っている人にだけ声をかける
 */

function dailyNag() {
  try {
    refreshWorkers_();
  } catch (e) {
    console.error('作業者一覧の更新に失敗: ' + e.message);
  }
  nagAll_('morning');
  escalateInactive_();
}

function followupNag() {
  nagAll_('evening');
}

function isNagDay_() {
  const weekday = Number(formatDate_(new Date(), 'u')) % 7; // 'u' は 1=月 ... 7=日
  return CONFIG.NAG_WEEKDAYS.indexOf(weekday) >= 0;
}

function nagAll_(kind) {
  if (!isNagDay_()) return;
  getWorkers_().forEach(function (w) {
    const state = getState_(w.id);
    if (state.nagOff) return;
    const stats = userStats_(state);
    if (kind === 'evening' && stats.todayCount > 0 && !stats.pending.length) return;
    try {
      postToChannel_(mention_(w.id) + ' ' + composeNag_(kind, w, stats));
      logEvent_('nag', w.id, kind === 'morning' ? '朝' : '夕方');
    } catch (e) {
      console.error('催促の送信に失敗: ' + w.name + ' ' + e.message);
    }
  });
}

/** ESCALATE_DAYS 日以上なにも反応がない作業者を、社長に知らせる（1人1日1回まで）。 */
function escalateInactive_() {
  if (!isNagDay_()) return;
  getWorkers_().forEach(function (w) {
    const state = getState_(w.id);
    const days = daysSince_(state.lastActiveAt || state.firstSeenAt);
    if (days === null || days < CONFIG.ESCALATE_DAYS) return;
    if (state.escalatedOn === todayString_()) return;
    state.escalatedOn = todayString_();
    saveState_(w.id, state);
    logEvent_('escalate', w.id, days + '日');
    postToAdmins_('🚨 ' + w.name + 'さんが' + days + '日間反応していません。'
      + (state.nagOff ? '（本人が催促をオフにしています）' : '')
      + '\n直接声をかけますか？「' + w.name + 'さんに○○と伝えて」と送ってもらえれば、私から伝えます。');
  });
}

function userStats_(state) {
  return {
    todayCount: todayCount_(state),
    daysSinceLast: daysSince_(state.lastRegisteredAt),
    daysSinceActive: daysSince_(state.lastActiveAt),
    pending: state.drafts.map(draftLabel_),
  };
}

/** 前回の登録から何日空いたかで、催促の強さを変える。 */
function nagLevel_(stats) {
  if (stats.daysSinceLast === null) return 'first';
  if (stats.daysSinceLast <= 1) return 'gentle';
  if (stats.daysSinceLast <= 3) return 'firm';
  return 'strong';
}

function composeNag_(kind, worker, stats) {
  const facts = {
    相手: worker.name,
    時間帯: kind === 'morning' ? '朝' : '夕方',
    今日の登録件数: stats.todayCount,
    前回の登録から何日: stats.daysSinceLast,
    催促の強さ: nagLevel_(stats),
    登録待ちの写真: stats.pending,
  };
  try {
    const text = callAI_([
      {
        role: 'system',
        content: 'あなたは生地屋の在庫係「' + CONFIG.BOT_NAME + '」です。Slack の在庫チャンネルで、作業者に新しい生地の写真を送るよう催促するメッセージを書きます。社長も同じチャンネルで見ています。'
          + '口調: ' + CONFIG.TONE + ' 催促の強さ（first=初回の案内 / gentle=軽く / firm=しっかり / strong=かなり強めだが失礼にならない）に合わせる。'
          + '登録待ちの写真があれば、商品名と管理番号を教えてほしいと伝える。'
          + '相手の名前やメンションは付けない（システムが付ける）。メッセージ本文だけを2〜4行で返す。' + instructionsPrompt_(),
      },
      { role: 'user', content: JSON.stringify(facts) },
    ], false).trim();
    if (text) return text;
  } catch (e) {
    console.error('催促文の生成に失敗したのでテンプレートを使います: ' + e.message);
  }
  return nagTemplate_(kind, stats);
}

function nagTemplate_(kind, stats) {
  const lines = [];
  if (kind === 'morning') {
    lines.push('おはようございます！今日入った生地の写真を送ってください📷');
  } else if (stats.todayCount === 0) {
    lines.push('お疲れさまです。今日はまだ生地の登録が0件です。写真を1枚だけでもお願いします📷');
  } else {
    lines.push('お疲れさまです。今日は' + stats.todayCount + '件登録できました。');
  }
  if (stats.daysSinceLast !== null && stats.daysSinceLast >= 2) {
    lines.push('前回の登録から' + stats.daysSinceLast + '日たっています。');
  }
  if (stats.pending.length) {
    lines.push('登録待ちの写真があります。商品名と管理番号を教えてください:');
    stats.pending.forEach(function (t) { lines.push('・' + t); });
  }
  return lines.join('\n');
}
