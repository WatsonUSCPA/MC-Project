/**
 * 作業者ごとの会話状態と、催促先スペースの登録情報。
 * スクリプトはデプロイした人の権限で動くので、ScriptProperties に作業者IDごとに保存する。
 */

function getState_(userId) {
  const raw = getProp_('state:' + userId);
  const state = raw ? JSON.parse(raw) : {};
  state.history = state.history || [];
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

function getSpaces_() {
  const raw = getProp_('spaces');
  return raw ? JSON.parse(raw) : {};
}

function saveSpaces_(spaces) {
  setProp_('spaces', JSON.stringify(spaces));
}

/**
 * 1対1（DM）のスペースだけを催促先として登録する。
 */
function registerSpace_(event) {
  const space = event.space || {};
  const isDm = space.type === 'DM' || space.spaceType === 'DIRECT_MESSAGE' || space.singleUserBotDm;
  if (!isDm || !event.user) return;
  const spaces = getSpaces_();
  const prev = spaces[space.name] || { nag: true };
  spaces[space.name] = {
    spaceName: space.name,
    userId: event.user.name,
    displayName: event.user.displayName || '',
    nag: prev.nag !== false,
  };
  saveSpaces_(spaces);
}

function unregisterSpace_(event) {
  const spaces = getSpaces_();
  if (event.space && spaces[event.space.name]) {
    delete spaces[event.space.name];
    saveSpaces_(spaces);
  }
}

function setNagEnabled_(spaceName, enabled) {
  const spaces = getSpaces_();
  if (!spaces[spaceName]) return false;
  spaces[spaceName].nag = enabled;
  saveSpaces_(spaces);
  return true;
}
