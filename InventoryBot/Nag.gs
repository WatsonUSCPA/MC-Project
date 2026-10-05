/**
 * 催促（お尻たたき）。setup() が毎日のトリガーを登録する。
 *   dailyNag    … 朝: 今日の写真を送るよう声をかける＋入力が残っている生地を知らせる
 *   followupNag … 夕方: 今日まだ1件も登録がない、または入力が残っている人にだけ声をかける
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

  const items = listItems_();
  const spaces = getSpaces_();
  Object.keys(spaces).forEach(function (key) {
    const space = spaces[key];
    if (space.nag === false) return;
    const stats = statsFor_(items, space.userId);
    if (kind === 'evening' && stats.todayCount > 0 && !stats.incomplete.length) return;
    try {
      postMessage_(space.spaceName, composeNag_(kind, space, stats));
    } catch (e) {
      console.error('催促の送信に失敗: ' + space.spaceName + ' ' + e.message);
    }
  });
}

/** 前回の登録から何日空いたかで、催促の強さを変える。 */
function nagLevel_(stats) {
  if (stats.daysSinceLast === null) return 'first';
  if (stats.daysSinceLast <= 1) return 'gentle';
  if (stats.daysSinceLast <= 3) return 'firm';
  return 'strong';
}

function composeNag_(kind, space, stats) {
  const incompleteText = stats.incomplete.slice(0, 5).map(function (it) {
    return it.id + '（' + (it.name || '名前未定') + '）未入力: '
      + missingRequired_(it).map(function (f) { return f.label; }).join('、');
  });
  const facts = {
    相手: space.displayName,
    時間帯: kind === 'morning' ? '朝' : '夕方',
    今日の登録件数: stats.todayCount,
    累計登録件数: stats.totalCount,
    前回の登録から何日: stats.daysSinceLast,
    催促の強さ: nagLevel_(stats),
    入力が残っている生地: incompleteText,
  };

  try {
    const text = callGrok_([
      {
        role: 'system',
        content: 'あなたは生地屋の在庫係「' + CONFIG.BOT_NAME + '」です。作業者に Google Chat で、新しい生地の写真を送るよう催促するメッセージを書きます。'
          + '口調: ' + CONFIG.TONE + ' 催促の強さ（first=初回の案内 / gentle=軽く / firm=しっかり / strong=かなり強めだが失礼にならない）に合わせる。'
          + '入力が残っている生地があれば管理番号を挙げ、「続き 管理番号」と送れば再開できると伝える。'
          + 'メッセージ本文だけを3〜5行で返す。' + instructionsPrompt_(),
      },
      { role: 'user', content: JSON.stringify(facts) },
    ], false).trim();
    if (text) return text;
  } catch (e) {
    console.error('催促文の生成に失敗したのでテンプレートを使います: ' + e.message);
  }
  return nagTemplate_(kind, space, stats, incompleteText);
}

function nagTemplate_(kind, space, stats, incompleteText) {
  const name = space.displayName ? space.displayName + 'さん、' : '';
  const lines = [];
  if (kind === 'morning') {
    lines.push(name + 'おはようございます！今日入った生地の写真を送ってください📷');
  } else if (stats.todayCount === 0) {
    lines.push(name + 'お疲れさまです。今日はまだ生地の登録が0件です。写真を1枚だけでもお願いします📷');
  } else {
    lines.push(name + 'お疲れさまです。今日は' + stats.todayCount + '件登録できました。あと少しだけ確認させてください。');
  }
  if (stats.daysSinceLast !== null && stats.daysSinceLast >= 2) {
    lines.push('前回の登録から' + stats.daysSinceLast + '日たっています。');
  }
  if (incompleteText.length) {
    lines.push('入力が残っている生地:');
    incompleteText.forEach(function (t) { lines.push('・' + t); });
    lines.push('「続き 管理番号」と送れば再開できます。');
  }
  return lines.join('\n');
}
