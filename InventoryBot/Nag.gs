/**
 * 催促（お尻たたき）。setup() が毎日のトリガーを登録する。
 *   dailyNag    … 朝: 今日の写真を送るよう声をかける（登録待ちの写真があればそれも）
 *   followupNag … 夕方: 今日まだ1件も登録がない、または登録待ちの写真が残っている人にだけ声をかける
 */

function dailyNag() {
  nagAll_('morning');
}

function followupNag() {
  nagAll_('evening');
}

function nagAll_(kind) {
  const weekday = Number(formatDate_(new Date(), 'u')) % 7; // 'u' は 1=月 ... 7=日
  if (CONFIG.NAG_WEEKDAYS.indexOf(weekday) < 0) return;

  const spaces = getSpaces_();
  Object.keys(spaces).forEach(function (key) {
    const space = spaces[key];
    if (space.nag === false) return;
    const stats = userStats_(getState_(space.userId));
    if (kind === 'evening' && stats.todayCount > 0 && !stats.pending.length) return;
    try {
      postMessage_(space.spaceName, composeNag_(kind, space, stats));
    } catch (e) {
      console.error('催促の送信に失敗: ' + space.spaceName + ' ' + e.message);
    }
  });
}

function userStats_(state) {
  const last = state.lastRegisteredAt ? new Date(state.lastRegisteredAt) : null;
  return {
    todayCount: state.log && state.log.date === todayString_() ? state.log.count : 0,
    daysSinceLast: last ? Math.floor((new Date() - last) / 86400000) : null,
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

function composeNag_(kind, space, stats) {
  const facts = {
    相手: space.displayName,
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
        content: 'あなたは生地屋の在庫係「' + CONFIG.BOT_NAME + '」です。作業者に Google Chat で、新しい生地の写真を送るよう催促するメッセージを書きます。'
          + '口調: ' + CONFIG.TONE + ' 催促の強さ（first=初回の案内 / gentle=軽く / firm=しっかり / strong=かなり強めだが失礼にならない）に合わせる。'
          + '登録待ちの写真があれば、商品名と管理番号を教えてほしいと伝える。'
          + 'メッセージ本文だけを3〜5行で返す。' + instructionsPrompt_(),
      },
      { role: 'user', content: JSON.stringify(facts) },
    ], false).trim();
    if (text) return text;
  } catch (e) {
    console.error('催促文の生成に失敗したのでテンプレートを使います: ' + e.message);
  }
  return nagTemplate_(kind, space, stats);
}

function nagTemplate_(kind, space, stats) {
  const name = space.displayName ? space.displayName + 'さん、' : '';
  const lines = [];
  if (kind === 'morning') {
    lines.push(name + 'おはようございます！今日入った生地の写真を送ってください📷');
  } else if (stats.todayCount === 0) {
    lines.push(name + 'お疲れさまです。今日はまだ生地の登録が0件です。写真を1枚だけでもお願いします📷');
  } else {
    lines.push(name + 'お疲れさまです。今日は' + stats.todayCount + '件登録できました。');
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
