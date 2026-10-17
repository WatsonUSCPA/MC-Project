/**
 * 作業者ごとの会話状態。スクリプトプロパティに Slack ユーザーIDごとに保存する。
 *
 * state = {
 *   drafts: [{ no, fileId, thumbUrl, name, managementNumber, price, priceDefault, issue, warningFor, confirmedFor }],
 *   seq, history, checkQueue, checkTotal, priceTarget,
 *   log: { date, count }, lastRegisteredAt, lastActiveAt, nagOff
 * }
 */

function getState_(userId) {
  const raw = getProp_('state:' + userId);
  const state = raw ? JSON.parse(raw) : {};
  state.drafts = state.drafts || [];
  state.history = state.history || [];
  state.seq = state.seq || 0;
  return state;
}

function saveState_(userId, state) {
  state.history = (state.history || []).slice(-CONFIG.HISTORY_TURNS);
  setProp_('state:' + userId, JSON.stringify(state));
}

function pushHistory_(state, role, content) {
  if (!content) return;
  state.history.push({ role: role, content: String(content).slice(0, 1000) });
}

function recordRegistration_(state) {
  const today = todayString_();
  if (!state.log || state.log.date !== today) state.log = { date: today, count: 0 };
  state.log.count++;
  state.lastRegisteredAt = new Date().toISOString();
}

function todayCount_(state) {
  return state.log && state.log.date === todayString_() ? state.log.count : 0;
}

function daysSince_(iso) {
  return iso ? Math.floor((new Date() - new Date(iso)) / 86400000) : null;
}
