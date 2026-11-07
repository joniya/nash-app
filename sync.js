/* ===== Синхронізація з сервером (Supabase Edge Function) =====
   Якщо в config.js не вказано API_URL або додаток відкрито не в Telegram — працює локально.
   Об'єднання змін двох людей: тристороннє злиття (база / мої зміни / зміни партнера) по id записів. */
const CFG = window.APP_CONFIG || {};
const ONLINE = !!(CFG.API_URL && tg && tg.initData);
const Sync = { ready: false, version: 0, base: null, slot: null, invite: '', members: [], bot: CFG.BOT_USERNAME || '', pushing: false, dirty: false, again: false, timer: null, retry: null, status: ONLINE ? 'connecting' : 'local', pendingRender: false, error: '' };

async function api(action, payload = {}) {
  const r = await fetch(CFG.API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, initData: tg.initData, ...payload }) });
  let j = {}; try { j = await r.json(); } catch (e) {}
  if (!r.ok) throw new Error(j.error || 'http_' + r.status);
  return j;
}
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const LOCAL_KEYS = ['me'];
function stripLocal(s) { const o = clone(s); LOCAL_KEYS.forEach(k => delete o[k]); return o; }

/* ---- тристороннє злиття ---- */
const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isIdList = a => Array.isArray(a) && a.every(x => isObj(x) && typeof x.id === 'string');
const isPrimList = a => Array.isArray(a) && a.every(x => x === null || typeof x !== 'object');
function merge3(b, l, r) {
  if (same(l, r)) return clone(l);
  if (l === undefined) return same(b, r) ? undefined : clone(r);
  if (r === undefined) return same(b, l) ? undefined : clone(l);
  if (same(b, l)) return clone(r);
  if (same(b, r)) return clone(l);
  if (isIdList(l) && isIdList(r)) return mergeList(isIdList(b) ? b : [], l, r);
  if (isPrimList(l) && isPrimList(r)) return [...new Set([...r, ...l])];          // напр. seen — лише зростає
  if (isObj(l) && isObj(r)) {
    const out = {}, bb = isObj(b) ? b : {};
    for (const k of new Set([...Object.keys(r), ...Object.keys(l)])) {
      const v = merge3(bb[k], l[k], r[k]);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  return clone(l); // обидва змінили одне значення — перемагає остання дія (моя)
}
function mergeList(b, l, r) {
  const bm = new Map(b.map(x => [x.id, x])), lm = new Map(l.map(x => [x.id, x])), rm = new Map(r.map(x => [x.id, x]));
  const out = [];
  for (const ri of r) {
    const li = lm.get(ri.id), bi = bm.get(ri.id);
    if (li) out.push(merge3(bi, li, ri));
    else if (!bi || !same(bi, ri)) out.push(clone(ri)); // нове в партнера або він змінив те, що я видалив
  }
  l.forEach((li, idx) => {
    if (rm.has(li.id)) return;
    const bi = bm.get(li.id);
    if (!bi || !same(bi, li)) out.splice(Math.min(idx, out.length), 0, clone(li)); // моє нове (або змінене, а партнер видалив)
  });
  return out;
}

/* ---- що нового я додав — для сповіщення партнеру в Telegram ---- */
const EVENT_OF = { notes: 'note', surprises: 'surprise', shop: 'shop', tasks: 'tasks', wish: 'wish', places: 'places', recipes: 'recipes', events: 'events', dates: 'dates', trips: 'trips', petEvents: 'pet' };
function diffEvents(base, st) {
  const ev = [], me = S.me, oth = me === 'a' ? 'b' : 'a';
  base = base || {};
  for (const [l, t] of Object.entries(EVENT_OF)) {
    const old = new Map((base[l] || []).map(x => [x.id, x]));
    const fresh = (st[l] || []).filter(x => !old.has(x.id) && x.by === me);
    if (l === 'notes' || l === 'surprises') { if (fresh.length) ev.push({ t }); }
    else if (fresh.length) ev.push({ t, items: fresh.map(x => x.title || '') });
    if (l === 'surprises') {
      const upd = (st[l] || []).some(x => old.has(x.id) && x.by === me && !x.done && (old.get(x.id).seen || []).includes(oth) && !(x.seen || []).includes(oth));
      if (upd) ev.push({ t: 'surprise_upd' });
    }
  }
  // скарбнички: нова ціль і поповнення
  const oldG = new Map((base.goals || []).map(g => [g.id, g]));
  const newGoals = (st.goals || []).filter(g => !oldG.has(g.id) && g.by === me);
  if (newGoals.length) ev.push({ t: 'goals', items: newGoals.map(g => g.title) });
  const deps = [];
  (st.goals || []).forEach(g => { const seen = new Set(((oldG.get(g.id) || {}).log || []).map(x => x.id)); (g.log || []).filter(x => !seen.has(x.id) && x.by === me && x.sum > 0).forEach(x => deps.push(g.title + ' +' + cur(x.sum, g.cur))); });
  if (deps.length) ev.push({ t: 'goal_add', items: deps });
  const d = today();
  if (st.qa?.[d]?.a?.[me] && !base.qa?.[d]?.a?.[me] && !st.qa[d].a[oth]) ev.push({ t: 'qa' });
  const wk = weekKey();
  if (st.weekly?.[wk]?.[me] && !base.weekly?.[wk]?.[me] && !st.weekly[wk][oth]) ev.push({ t: 'weekly' });
  return ev;
}

function setStatus(s, err) {
  Sync.status = s; Sync.error = err || '';
  const el = document.getElementById('syncDot');
  if (el) { el.className = 'sync-dot ' + s; el.title = { ok: 'Синхронізовано', saving: 'Зберігаю…', offline: 'Немає зв’язку — збережу пізніше', connecting: 'Підключаюсь…', local: 'Локальний режим' }[s] || ''; }
}
function applyState(state) {
  const me = Sync.slot || S.me;
  S = migrate(state); stamp(S, 'both'); S.me = me;
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  if (sheetOpen()) Sync.pendingRender = true; else render();
}
function schedulePush() {
  if (!ONLINE || !Sync.ready) return;
  Sync.dirty = true; clearTimeout(Sync.timer); Sync.timer = setTimeout(push, 600);
}
async function push() {
  if (!Sync.ready) return;
  if (Sync.pushing) { Sync.again = true; return; }
  if (!Sync.dirty) return;
  Sync.pushing = true; Sync.dirty = false; setStatus('saving');
  try {
    let done = false;
    for (let i = 0; i < 6 && !done; i++) {
      const state = stripLocal(S);
      const r = await api('sync', { baseVersion: Sync.version, state, events: diffEvents(Sync.base, state) });
      if (r.ok) { Sync.version = r.version; Sync.base = state; done = true; }
      else if (r.conflict) { const merged = merge3(Sync.base, state, r.state); Sync.base = r.state; Sync.version = r.version; applyState(merged); }
      else throw new Error(r.error || 'sync');
    }
    setStatus(done ? 'ok' : 'offline');
    if (!done) Sync.dirty = true;
  } catch (e) {
    Sync.dirty = true; setStatus('offline', e.message);
    clearTimeout(Sync.retry); Sync.retry = setTimeout(push, 5000);
  }
  Sync.pushing = false;
  if (Sync.again) { Sync.again = false; push(); }
}
async function pull() {
  if (!ONLINE || !Sync.ready || Sync.pushing || Sync.dirty || sheetOpen() || document.hidden) return;
  try {
    const r = await api('pull', { version: Sync.version });
    if (r.same) { setStatus('ok'); return; }
    if (Sync.pushing || Sync.dirty) return; // поки чекали — з'явились локальні зміни; підтягнемо при наступному запиті
    Sync.version = r.version; Sync.base = clone(r.state); if (r.members) Sync.members = r.members;
    applyState(clone(r.state)); setStatus('ok');
    if (document.body.classList.contains('gated') && partnerJoined()) { checkGate(); celebrate(); }
  } catch (e) { setStatus('offline', e.message); }
}
async function startSync() {
  if (!ONLINE) { setStatus('local'); return; }
  setStatus('connecting');
  try {
    const r = await api('hello');
    if (r.error === 'full') { setStatus('offline', 'full'); openSheet(`<h3>Ця пара вже повна 🙈</h3><p class="sub">Запрошення вже використали двоє людей. Попросіть нове посилання.</p><button class="btn" style="width:100%" onclick="closeSheet()">Зрозуміло</button>`); return; }
    Object.assign(Sync, { slot: r.slot, invite: r.invite, members: r.members || [], bot: r.bot || Sync.bot, version: r.version });
    const remoteEmpty = !r.state || !Object.keys(r.state).length;
    if (remoteEmpty) { S.me = r.slot; Sync.base = {}; }
    else { Sync.base = clone(r.state); applyState(clone(r.state)); }
    S.me = r.slot;
    // імена й фото з Telegram
    const u = tg.initDataUnsafe && tg.initDataUnsafe.user;
    const defaults = ['Коханий', 'Кохана', 'Я', 'Партнер', ''];
    (Sync.members || []).forEach(m => { if (m.first_name && defaults.includes(S.names[m.slot])) S.names[m.slot] = m.first_name; });
    if (u && u.photo_url) { S.photos = S.photos || {}; S.photos[r.slot] = u.photo_url; }
    Sync.ready = true;
    save(); // запише локально і (якщо є різниця) відправить
    if (remoteEmpty) { Sync.dirty = true; push(); }
    setStatus('ok'); render(); checkGate();
    if (r.joined) { toast('Ви тепер разом у додатку 💛'); celebrate(); }
    try { if (u && !u.allows_write_to_pm && tg.requestWriteAccess) tg.requestWriteAccess(); } catch (e) {}
  } catch (e) {
    setStatus('offline', e.message);
    setTimeout(startSync, 5000);
  }
}
if (ONLINE) {
  setInterval(pull, 6000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pull(); });
  try { tg.onEvent('activated', pull); } catch (e) {}
}
function inviteLink() { return Sync.bot ? `https://t.me/${Sync.bot}?startapp=${Sync.invite}` : ''; }
function shareInvite() {
  const link = inviteLink();
  if (!link) return toast('Вкажіть BOT_USERNAME у config.js');
  const url = 'https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent('Приєднуйся до нашого спільного простору 💛');
  try { tg.openTelegramLink(url); } catch (e) { copyText(link); }
}
function copyText(t) {
  try { navigator.clipboard.writeText(t).then(() => toast('Скопійовано 📋'), () => toast(t)); } catch (e) { toast(t); }
}

/* ===== Запуск ===== */
applyTheme();
render();
checkGate();
startSync();
