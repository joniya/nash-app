/* ===== Telegram ===== */
const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
if (tg) {
  try { tg.ready(); tg.expand(); } catch (e) {}
  try { tg.setHeaderColor('#FFF8EF'); tg.setBackgroundColor('#FFF8EF'); } catch (e) {}
  try { tg.disableVerticalSwipes && tg.disableVerticalSwipes(); } catch (e) {}
  try { tg.BackButton.onClick(() => { if (sheetOpen()) closeSheet(); else goBack(); }); } catch (e) {}
}
const haptic = (t = 'light') => { try { tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred(t); } catch (e) {} };

/* ===== Талісман-бігль (тимчасовий, замінимо на ваш) ===== */
const BEAGLE = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<circle cx="50" cy="52" r="46" fill="#FBEBD8"/>
<path d="M22 30c-10 4-12 26-6 40 3 7 12 6 14-2l4-30z" fill="#8A4F22"/>
<path d="M78 30c10 4 12 26 6 40-3 7-12 6-14-2l-4-30z" fill="#8A4F22"/>
<ellipse cx="50" cy="44" rx="27" ry="25" fill="#C8813A"/>
<path d="M50 22c-4 0-6 6-6 14v14h12V36c0-8-2-14-6-14z" fill="#fff"/>
<ellipse cx="50" cy="64" rx="19" ry="15" fill="#fff"/>
<circle cx="39" cy="45" r="4" fill="#2B2118"/><circle cx="61" cy="45" r="4" fill="#2B2118"/>
<circle cx="40.3" cy="43.6" r="1.3" fill="#fff"/><circle cx="62.3" cy="43.6" r="1.3" fill="#fff"/>
<ellipse cx="50" cy="56" rx="6" ry="4.5" fill="#2B2118"/>
<path d="M44 64q6 5 12 0" stroke="#2B2118" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<path d="M49 66q1 6 4 5" stroke="#E57D72" stroke-width="3" fill="none" stroke-linecap="round"/>
<circle cx="32" cy="56" r="3.5" fill="#F4B6A8" opacity=".7"/><circle cx="68" cy="56" r="3.5" fill="#F4B6A8" opacity=".7"/>
</svg>`;

/* ===== Дати (локальний час, рік — рівно 4 цифри) ===== */
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const MIN_DATE = '1900-01-01', MAX_DATE = '2099-12-31';
function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
  const d = parseD(s); return !isNaN(d) && ymd(d) === s && s >= MIN_DATE && s <= MAX_DATE;
}
const daysBetween = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5);
function nextOccurrence(s, yearly) {
  const d = parseD(s); if (!yearly) return d;
  const t = parseD(today());
  const mk = y => { const n = new Date(y, d.getMonth(), d.getDate()); if (n.getMonth() !== d.getMonth()) n.setDate(0); return n; }; // 29 лютого → 28
  let n = mk(t.getFullYear()); if (n < t) n = mk(t.getFullYear() + 1); return n;
}
const fmtDate = (d, year) => d.toLocaleDateString('uk-UA', year ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long' });
const fmtS = (s, year = true) => validDate(s) ? fmtDate(parseD(s), year) : 'Дата не вказана';
const money = n => (Math.round((+n || 0) * 100) / 100).toLocaleString('uk-UA');
function plural(n, one, few, many) { n = Math.abs(n); const m10 = n % 10, m100 = n % 100; if (m10 === 1 && m100 !== 11) return one; if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few; return many; }
const stars = r => r ? '★'.repeat(r) + '☆'.repeat(5 - r) : '';

/* ===== Дані (зараз локально; наступний крок — спільна база) ===== */
const KEY = 'couple-app-v1';
const uid = () => Math.random().toString(36).slice(2, 9);
function seed() {
  const u = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
  return {
    appName: 'Назва',
    names: { a: (u && u.first_name) || 'Коханий', b: 'Кохана' },
    me: 'a', since: '',
    dates: [], trips: [],
    moods: {}, notes: [], events: [],
    places: [
      { id: uid(), cat: 'Кафе', title: 'Затишна кав’ярня', desc: 'Хороша кава й тиха музика (приклад — можна видалити)', kind: 'spont', visited: false, example: true },
      { id: uid(), cat: 'Природа', title: 'Ботанічний сад', desc: 'Погуляти серед рослин, особливо гарно навесні (приклад)', kind: 'spont', visited: false, example: true },
      { id: uid(), cat: 'Виставка', title: 'Виставка сучасного мистецтва', desc: 'Експозиція в центрі міста (приклад)', kind: 'plan', visited: false, example: true }
    ],
    shop: [], tasks: [{ id: uid(), title: 'Прибирання на кухні (приклад)', date: '', done: false }],
    recipes: [{ id: uid(), title: 'Карбонара', desc: 'Спагеті, бекон, яйця, пармезан (приклад)' }],
    wish: [], surprises: [], nudges: [], pets: [], petEvents: [], kids: [], kidEvents: [], kidGrowth: [], kidMoments: [], widgets: {}, qa: {}, weekly: {}, about: { a: {}, b: {} }, photos: {}, onb: {}, qaLevel: 'mix', city: '', goals: [{ id: uid(), emoji: '🐷', title: 'Наша спільна мрія', target: 1000, log: [], done: false, created: Date.now() }]
  };
}
function migrate(s) {
  const d = seed();
  for (const k in d) if (s[k] === undefined) s[k] = d[k];
  // старі лічильники → записи
  ['dates', 'trips'].forEach(k => {
    const old = k === 'dates' ? s.datesCount : s.tripsCount;
    if (old > 0 && !s[k].length) for (let i = 0; i < old; i++) s[k].push({ id: uid(), date: '', title: '', desc: '', rating: 0, created: i });
  });
  delete s.datesCount; delete s.tripsCount;
  if (s.since && (!validDate(s.since) || s.since > today())) s.since = '';
  if (s.wedding && (!validDate(s.wedding) || s.wedding > today())) s.wedding = '';
  s.events = s.events.filter(e => validDate(e.date));
  s.tasks.forEach(t => { if (t.date && !validDate(t.date)) t.date = ''; });
  // одна стара копилка → список скарбничок
  if (s.goal && !s.goals_migrated) {
    const g = s.goal, saved = +g.saved || 0;
    s.goals = [{ id: uid(), emoji: '🐷', title: g.title || 'Наша спільна мрія', target: +g.target > 0 ? +g.target : 1000, log: saved > 0 ? [{ id: uid(), by: 'a', sum: saved, at: Date.now() }] : [], done: false, created: Date.now() }];
    delete s.goal;
  }
  s.goals = (s.goals || []).filter(g => g && g.id).map(g => ({ log: [], done: false, emoji: '🐷', ...g, target: +g.target > 0 ? +g.target : 1 }));
  return s;
}
/* Сповіщення: кожен запис знає, хто його додав (by) і хто вже бачив (seen) */
const LISTS = ['notes', 'shop', 'tasks', 'recipes', 'wish', 'places', 'events', 'dates', 'trips', 'surprises', 'nudges', 'goals', 'pets', 'petEvents', 'kids', 'kidEvents', 'kidGrowth', 'kidMoments'];
function stamp(s, who) { LISTS.forEach(l => (s[l] || []).forEach(o => { if (!o.seen) { o.by = o.by || who; o.seen = who === 'both' ? ['a', 'b'] : [who]; if (who === 'both') o.by = o.by === 'both' ? 'a' : o.by; } })); }
let S;
try { const raw = JSON.parse(localStorage.getItem(KEY)); S = migrate(raw || seed()); stamp(S, 'both'); } catch (e) { S = migrate(seed()); stamp(S, 'both'); }
const save = () => { stamp(S, S.me); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} if (typeof schedulePush === 'function') schedulePush(); };
const justSeen = new Set();
const isNew = o => !!(o && o.seen && !o.seen.includes(S.me));
let seenDirty = false;
function see(o) { if (isNew(o)) { o.seen.push(S.me); justSeen.add(o.id); seenDirty = true; } }
function nw(o) { const show = isNew(o) || justSeen.has(o.id); see(o); return show ? ' new' : ''; }
const unseen = (l, f) => S[l].filter(o => isNew(o) && (!f || f(o))).length;
const sb = n => n ? `<span class="sbadge">${n}</span>` : '';
save();
const other = () => (S.me === 'a' ? 'b' : 'a');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ini = n => esc((n || '?').trim().charAt(0).toUpperCase() || '?');
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

/* ===== UI helpers ===== */
function toast(t) { const el = document.getElementById('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2200); }
const sheetOpen = () => document.getElementById('overlay').classList.contains('show');
function openSheet(html) { const sh = document.getElementById('sheet'); sh.innerHTML = '<div class="grab"></div>' + html; sh.scrollTop = 0; document.getElementById('overlay').classList.add('show'); document.body.classList.add('sheet-open'); syncBack(); }
function closeSheet() { document.getElementById('overlay').classList.remove('show'); document.body.classList.remove('sheet-open'); syncBack(); if (typeof Sync !== 'undefined' && Sync.pendingRender) { Sync.pendingRender = false; render(); } }
function syncBack() { if (!tg) return; try { (sheetOpen() || SUB[tab]) ? tg.BackButton.show() : tg.BackButton.hide(); } catch (e) {} }

/* fields: {k,l,type,v,ph,req,min,max,max_len,opts}
   Перше поле обов'язкове, якщо не вказано req:false. onSave може повернути рядок-помилку — тоді форма не закривається. */
function formSheet(title, fields, onSave, btn = 'Зберегти') {
  const f = fields.map(x => {
    const ml = `maxlength="${x.maxlen || (x.type === 'textarea' ? 600 : 80)}"`;
    let inp;
    if (x.type === 'textarea') inp = `<textarea id="f_${x.k}" ${ml} placeholder="${esc(x.ph || '')}">${esc(x.v || '')}</textarea>`;
    else if (x.type === 'select') inp = `<select id="f_${x.k}">${x.opts.map(o => `<option value="${esc(o[0])}" ${String(o[0]) === String(x.v) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
    else if (x.type === 'date') inp = `<input id="f_${x.k}" type="date" value="${esc(x.v || '')}" min="${x.min || MIN_DATE}" max="${x.max || MAX_DATE}">`;
    else if (x.type === 'password') inp = `<input id="f_${x.k}" type="password" autocomplete="off" value="${esc(x.v || '')}" placeholder="${esc(x.ph || '')}">`;
    else if (x.type === 'time') inp = `<input id="f_${x.k}" type="time" value="${esc(x.v || '')}">`;
    else if (x.type === 'decimal') inp = `<input id="f_${x.k}" type="text" inputmode="decimal" maxlength="8" value="${esc(x.v ?? '')}" placeholder="${esc(x.ph || '')}">`;
    else if (x.type === 'number') inp = `<input id="f_${x.k}" type="number" inputmode="decimal" step="any" value="${esc(x.v ?? '')}" placeholder="${esc(x.ph || '')}">`;
    else inp = `<input id="f_${x.k}" type="text" ${ml} value="${esc(x.v || '')}" placeholder="${esc(x.ph || '')}">`;
    return `<div class="field"><label>${esc(x.l)}</label>${inp}</div>`;
  }).join('');
  openSheet(`<h3>${esc(title)}</h3>${f}<div class="acts"><button class="btn ghost" onclick="closeSheet()">Скасувати</button><button class="btn" id="f_save">${btn}</button></div>`);
  document.getElementById('f_save').onclick = () => {
    const v = {};
    for (let i = 0; i < fields.length; i++) {
      const x = fields[i], val = document.getElementById('f_' + x.k).value.trim(); v[x.k] = val;
      const required = x.req === true || (i === 0 && x.req !== false);
      if (required && !val) return toast('Заповніть «' + x.l + '»');
      if (x.type === 'date' && val) {
        if (!validDate(val)) return toast('Неправильна дата: рік має бути з 4 цифр (1900–2099)');
        if (x.max && val > x.max) return toast(x.maxMsg || 'Дата не може бути пізніше ' + fmtS(x.max));
        if (x.min && val < x.min) return toast(x.minMsg || 'Дата не може бути раніше ' + fmtS(x.min));
      }
      if (x.type === 'number' && val && !isFinite(+val)) return toast('Введіть число');
    }
    const err = onSave(v);
    if (typeof err === 'string') return toast(err);
    save(); closeSheet(); render(); haptic('medium');
  };
}
function confirmSheet(text, okText, onOk) {
  openSheet(`<h3>${esc(text)}</h3><div class="acts"><button class="btn ghost" onclick="closeSheet()">Скасувати</button><button class="btn" style="background:#D9645A" id="cOk">${esc(okText)}</button></div>`);
  document.getElementById('cOk').onclick = () => { onOk(); save(); closeSheet(); render(); haptic('medium'); };
}
function itemMenu(list, id, extra = [], onDelete) {
  const btns = extra.map((e, i) => `<button class="btn ghost" style="width:100%;margin-bottom:8px" data-i="${i}">${esc(e[0])}</button>`).join('');
  openSheet(`<h3>Дії</h3>${btns}<button class="btn" style="width:100%;background:#D9645A" id="delBtn">Видалити</button>`);
  document.querySelectorAll('#sheet [data-i]').forEach(b => b.onclick = () => { const r = extra[+b.dataset.i][1](); if (r === 'keep') return; save(); closeSheet(); render(); });
  document.getElementById('delBtn').onclick = () => confirmSheet(list === 'goals' ? 'Видалити скарбничку? Історія поповнень теж зникне.' : 'Точно видалити?', 'Видалити', () => { onDelete && onDelete(); S[list] = S[list].filter(x => x.id !== id); toast('Видалено'); });
}

/* ===== Навігація ===== */
const SUB = { dates: true, trips: true, pet: true, kid: true };
let shopKind = 'food', placeCat = '';
let tab = 'us', prevTab = 'us', homeSeg = 'shop', placeSeg = 'spont', placeQ = '', recipeQ = '', wishSeg = 'gift', wishWho = null;
function go(t) { if (SUB[t] && !SUB[tab]) prevTab = tab; if (t !== tab) justSeen.clear(); tab = t; render(); window.scrollTo(0, 0); }
function goBack() { if (SUB[tab]) go(prevTab); }

/* хто додав (кружечок з ініціалом) */
const byTag = o => (o && o.by && (o.by === 'a' || o.by === 'b') && !isExample(o)) ? `<span class="by ${o.by}" title="Додав(-ла) ${esc(S.names[o.by])}">${ini(S.names[o.by])}</span>` : '';
/* ===== Екрани ===== */
function statCard(kind, label) {
  return `<div class="stat"><button class="sm" onclick="go('${kind}')"><b>${S[kind].length}</b><span>${label} ›</span></button>
    <div class="pm"><button onclick="minus('${kind}')" aria-label="Мінус">−</button><button onclick="quickAdd('${kind}')" aria-label="Плюс">+</button></div></div>`;
}
function vUs() {
  const n = S.names, togetherDays = S.since ? daysBetween(S.since, today()) : null, marriedDays = S.wedding ? daysBetween(S.wedding, today()) : null;
  const myMood = (S.moods[S.me] || {})[today()], hisMood = (S.moods[other()] || {})[today()];
  const moodName = { g: 'чудово', n: 'норм', s: 'сумно' };
  const t0 = today();
  const ev = S.events.map(e => ({ ...e, nx: ymd(nextOccurrence(e.date, e.yearly)) }))
    .sort((a, b) => ((a.nx < t0) - (b.nx < t0)) || (a.nx < t0 ? b.nx.localeCompare(a.nx) : a.nx.localeCompare(b.nx)));
  const upcoming = [
    ...S.tasks.filter(t => !t.done && t.date && t.date >= t0).map(t => ({ ic: '🧹', t: t.title, d: t.date })),
    ...S.trips.filter(t => t.date && t.date >= t0).map(t => ({ ic: '🧳', t: t.title || 'Поїздка', d: t.date }))
  ].sort((a, b) => a.d.localeCompare(b.d)).slice(0, 3);
  return `
  ${alertsHTML()}
  ${inviteCardHTML()}
  <div class="card couple">
    <button class="pretty" onclick="openThemes()"><span>${fe('Artist palette', '🎨', 22)}</span>Зробити красивіше</button>
    <div class="pics">${avatarHTML('a', 'pic a')}<button class="heart nudge" onclick="nudge(event)" title="Думаю про тебе">❤️</button>${avatarHTML('b', 'pic b')}</div>
    <h2>${esc(n.a)} &amp; ${esc(n.b)}</h2>
    ${togetherDays !== null ? `<div class="together">${togetherDays === 0 ? 'Разом з сьогодні 💛' : `Разом ${togetherDays} ${plural(togetherDays, 'день', 'дні', 'днів')} 💛`}</div>` : ''}
    ${marriedDays !== null ? `<div class="together wed">${marriedDays === 0 ? 'Одружені з сьогодні 💍' : `Одружені ${marriedDays} ${plural(marriedDays, 'день', 'дні', 'днів')} 💍`}</div>` : ''}
    <div class="stats">
      <button class="stat add" onclick="setSince()"><b>${S.since || S.wedding ? '✎' : '+'}</b><span>${S.since || S.wedding ? 'Наші дати' : 'Додати дату'}</span></button>
      ${statCard('dates', 'Побачень')}
      ${statCard('trips', 'Поїздок')}
    </div>
    <div class="nudge-hint">Натисни ❤️ — і ${esc(n[other()])} отримає твоє «думаю про тебе»</div>
  </div>
  ${onboardingHTML()}
  ${petWidgetHTML()}
  ${kidWidgetHTML()}
  ${S.widgets && S.widgets.memory === false ? '' : memoriesHTML()}
  ${S.widgets && S.widgets.qa === false ? '' : qaCardHTML()}

  <div class="card">
    <div class="sec-t">Як ти сьогодні?</div>
    <div class="moods">
      ${[['g', '😊', 'Чудово'], ['n', '🙂', 'Норм'], ['s', '😔', 'Сумно']].map(m => `<button class="mood ${m[0]} ${myMood === m[0] ? 'on' : ''}" onclick="setMood('${m[0]}')"><i>${m[1]}</i>${m[2]}</button>`).join('')}
    </div>
    <div class="mood-note">${hisMood ? `${esc(n[other()])} сьогодні: <b>${moodName[hisMood]}</b>` : `${esc(n[other()])} ще не відмітив(-ла) настрій`}</div>
  </div>
  ${weeklyBannerHTML()}

  ${upcoming.length ? `<div class="lbl">📅 Що попереду</div><div class="card" style="padding:6px 16px">${upcoming.map(t => { const d = daysBetween(t0, t.d); return `<div class="row"><div class="ic">${t.ic}</div><div class="tx"><b>${esc(t.t)}</b><small>${fmtS(t.d, false)}</small></div><span class="pill">${d === 0 ? 'сьогодні' : 'через ' + d + ' дн.'}</span></div>`; }).join('')}</div>` : ''}

  ${surpriseCardsHTML()}
  <div class="tiles">
    <button class="tile dark" onclick="addNote()"><span class="ti">✉️</span><b>Записка</b><small>Надіслати сюрприз</small></button>
    <button class="tile" onclick="eveningIdea()"><span class="ti">🪄</span><b>Вечір</b><small>Кіно + рецепт</small></button>
  </div>

  ${S.notes.length ? `<div class="card"><div class="sec-t">Записки 💌</div>${S.notes.slice(-3).reverse().map(x => {
    const unread = x.from !== S.me && isNew(x);
    return `<div class="row ${unread ? 'new' : ''}" ${unread ? `onclick="openNote('${x.id}')" style="cursor:pointer"` : ''}><div class="ic">💌</div><div class="tx"><b>${unread ? 'Нова записка — натисни, щоб прочитати' : esc(x.text)}</b><small>від ${esc(S.names[x.from])} · ${fmtS(x.date, false)}${x.from === S.me ? (x.seen.includes(other()) ? ' · ✓✓ прочитано' : ' · ✓ надіслано') : ''}</small></div>${unread ? '' : `<button class="more" onclick="itemMenu('notes','${x.id}')">⋯</button>`}</div>`;
  }).join('')}</div>` : ''}

  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div class="sec-t" style="margin:0">📆 Важливі дати</div><button class="btn sm" onclick="addEvent()">+ Додати</button></div>
    ${ev.length ? ev.map(e => {
      const d = daysBetween(t0, e.nx), past = d < 0;
      return `<div class="row ${past ? 'past' : ''}${nw(e)}"><div class="ic">${esc(e.emoji || '🎉')}</div><div class="tx"><b>${esc(e.title)}</b><small>${fmtS(e.nx, !e.yearly)}${e.yearly ? ' · щороку' : ''}</small></div><span class="pill">${d === 0 ? 'сьогодні!' : past ? 'минуло' : 'через ' + d + ' дн.'}</span><button class="more" onclick="eventMenu('${e.id}')">⋯</button></div>`;
    }).join('') : `<div class="empty" style="margin-top:8px">Поки не додано жодної дати.</div>`}
  </div>`;
}

function vDates() {
  const list = [...S.dates].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.created || 0) - (a.created || 0));
  const rated = S.dates.filter(d => d.rating), avg = rated.length ? (rated.reduce((s, d) => s + +d.rating, 0) / rated.length).toFixed(1) : null;
  return `
  <div class="backline"><button onclick="goBack()">‹ Назад</button></div>
  <div class="page-head"><div><h1>Наші побачення</h1><p class="sub">${S.dates.length} ${plural(S.dates.length, 'побачення', 'побачення', 'побачень')}${avg ? ` · середня оцінка ${avg} ★` : ''}. Натисніть на побачення, щоб додати деталі.</p></div><button class="fab" onclick="editDate()">+</button></div>
  ${list.length ? list.map(d => `<div class="item click${nw(d)}" onclick="dateMenu('${d.id}')"><div class="ic">💛</div><div class="tx"><div class="cat">${fmtS(d.date)}</div><div class="tt">${esc(d.title || 'Побачення')}</div>${d.desc ? `<div class="ds">${esc(d.desc)}</div>` : (!d.title ? `<div class="ds" style="color:var(--muted)">Деталі не додано — натисніть, щоб розповісти, як пройшло</div>` : '')}${d.rating ? `<div class="stars">${stars(+d.rating)}</div>` : ''}</div><span class="more">⋯</span></div>`).join('')
    : `<div class="empty">${BEAGLE}Ще немає жодного побачення — додайте перше!</div>`}`;
}
function vTrips() {
  const t0 = today();
  const list = [...S.trips].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.created || 0) - (a.created || 0));
  const spent = S.trips.reduce((s, t) => s + (+t.budget || 0), 0);
  return `
  <div class="backline"><button onclick="goBack()">‹ Назад</button></div>
  <div class="page-head"><div><h1>Наші поїздки</h1><p class="sub">${S.trips.length} ${plural(S.trips.length, 'поїздка', 'поїздки', 'поїздок')}${spent ? ` · витрачено ${money(spent)} ₴` : ''}. Куди їздили, що бачили й скільки витратили.</p></div><button class="fab" onclick="editTrip()">+</button></div>
  ${list.length ? list.map(t => {
    const range = !t.date ? 'Дата не вказана' : !t.dateTo || t.dateTo === t.date ? fmtS(t.date) : (t.date.slice(0, 4) === t.dateTo.slice(0, 4) ? fmtS(t.date, false) : fmtS(t.date)) + ' — ' + fmtS(t.dateTo);
    const nights = t.date && t.dateTo ? daysBetween(t.date, t.dateTo) : 0;
    return `<div class="item click${nw(t)}" onclick="tripMenu('${t.id}')"><div class="ic">🧳</div><div class="tx"><div class="cat">${range}${nights > 0 ? ` · ${nights + 1} ${plural(nights + 1, 'день', 'дні', 'днів')}` : ''}</div><div class="tt">${esc(t.title || 'Поїздка')}</div>${t.desc ? `<div class="ds">${esc(t.desc)}</div>` : (!t.title ? `<div class="ds" style="color:var(--muted)">Натисніть, щоб додати куди й як</div>` : '')}${t.rating ? `<div class="stars">${stars(+t.rating)}</div>` : ''}${t.date > t0 ? '<span class="pill">✈️ планується</span>' : ''}${+t.budget ? ` <span class="pill">💸 ${money(t.budget)} ₴</span>` : ''}</div><span class="more">⋯</span></div>`;
  }).join('') : `<div class="empty">${BEAGLE}Ще немає поїздок — час кудись вирушити!</div>`}`;
}

function placeListHTML() {
  const q = placeQ.toLowerCase();
  const list = S.places.filter(p => p.kind === placeSeg && (!placeCat || (p.cat || '') === placeCat) && (!q || (p.title + ' ' + p.cat + ' ' + p.desc).toLowerCase().includes(q)));
  return list.length ? list.map(p => `<div class="item ${p.visited ? 'done' : ''}${nw(p)}">${p.img ? `<div class="thumb" style="background-image:url('${esc(p.img).replace(/'/g, '%27')}')"></div>` : `<div class="ic">${p.visited ? '✅' : '📍'}</div>`}<div class="tx"><div class="cat">${esc(p.cat)}</div><div class="tt">${esc(p.title)}</div>${cleanDesc(p) ? `<div class="ds">${esc(cleanDesc(p))}</div>` : ''}${linkOf(p) ? `<div class="chips-row"><a class="pill link" href="${esc(linkOf(p))}" target="_blank" rel="noopener" onclick="return openLink(this.href)">${esc(siteOf(p))} ↗</a></div>` : ''}</div>${byTag(p)}<button class="more" onclick="placeMenu('${p.id}')">⋯</button></div>`).join('')
    : `<div class="empty">${BEAGLE}${q ? 'Нічого не знайдено.' : 'Тут поки порожньо — додайте перше місце.'}</div>`;
}
function vPlaces() {
  const cnt = k => S.places.filter(p => p.kind === k).length;
  const listHtml = placeListHTML();
  return `
  <div class="page-head"><div><h1>Місця і побачення</h1><p class="sub">Куди піти вдвох — кафе, прогулянки, виставки й магазини.</p></div><button class="fab" onclick="addPlace()">+</button></div>
  <div class="tiles">
    <button class="tile dark" onclick="randomPlace()"><span class="ti">🎲</span><b>Випадкове місце</b><small>Довіритися жеребу</small></button>
    <button class="tile" onclick="newSurprise()"><span class="ti">🎭</span><b>Побачення наосліп</b><small>Сюрприз для партнера</small></button>
  </div>
  <button class="finder" onclick="openFinder()"><div class="fi">✨</div><div><b>Ідеї в місті${S.city ? ' · ' + esc(S.city) : ''}</b><small>Музеї, кафе, парки й розваги поруч${ONLINE ? ' — AI підбере під настрій' : ''}</small></div></button>
  <div class="seg"><button class="${placeSeg === 'spont' ? 'on' : ''}" onclick="placeSeg='spont';render()">⚡ Спонтанне · ${cnt('spont')}${sb(unseen('places', p => p.kind === 'spont'))}</button><button class="${placeSeg === 'plan' ? 'on' : ''}" onclick="placeSeg='plan';render()">🗓 Заплановане · ${cnt('plan')}${sb(unseen('places', p => p.kind === 'plan'))}</button></div>
  <p class="sub" style="font-size:13px">${placeSeg === 'spont' ? 'Місця, куди можна піти хоч сьогодні — без підготовки.' : 'Місця, які потребують планування чи квитків.'}</p>
  ${(() => { const cats = [...new Set(S.places.filter(p => p.kind === placeSeg).map(p => p.cat || '').filter(Boolean))]; if (placeCat && !cats.includes(placeCat)) placeCat = ''; return cats.length > 1 ? `<div class="chips"><button class="chip ${!placeCat ? 'on' : ''}" onclick="placeCat='';render()">Усі</button>${cats.map(c => `<button class="chip ${placeCat === c ? 'on' : ''}" onclick="placeCat=this.dataset.c;render()" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : ''; })()}
  <div class="search"><input placeholder="🔍 Пошук за назвою місця..." value="${esc(placeQ)}" oninput="placeQ=this.value;document.getElementById('placeList').innerHTML=placeListHTML()"></div>
  <div id="placeList">${listHtml}</div>`;
}

function recipeListHTML() {
  const q = recipeQ.toLowerCase(), list = S.recipes.filter(r => !q || (r.title + ' ' + r.desc).toLowerCase().includes(q));
  return list.length ? list.map(r => `<div class="item${nw(r)}"><div class="ic">🍝</div><div class="tx"><div class="tt">${esc(r.title)}</div><div class="ds">${esc(r.desc)}</div></div>${byTag(r)}<button class="more" onclick="recipeMenu('${r.id}')">⋯</button></div>`).join('')
    : `<div class="empty">${BEAGLE}${q ? 'Нічого не знайдено.' : 'Рецептів поки немає.'}</div>`;
}
function vHome() {
  let body = '';
  if (homeSeg === 'shop') {
    const kindOf = s => s.kind || 'food';
    const quick = shopKind === 'food' ? ['Хліб', 'Яйця', 'Молоко', 'Сир', 'Фрукти', 'Овочі', 'Кава', 'Цукор'].filter(q => !S.shop.some(s => !s.done && s.title.toLowerCase() === q.toLowerCase())) : ['Засіб для посуду', 'Туалетний папір', 'Пральний засіб', 'Батарейки'].filter(q => !S.shop.some(s => !s.done && s.title.toLowerCase() === q.toLowerCase()));
    const mine = S.shop.filter(s => kindOf(s) === shopKind), open = mine.filter(s => !s.done), done = mine.filter(s => s.done);
    const nk = k => S.shop.filter(s => kindOf(s) === k && !s.done).length;
    body = `
    <div class="subseg"><button class="${shopKind === 'food' ? 'on' : ''}" onclick="shopKind='food';render()">🥕 Продукти · ${nk('food')}${sb(unseen('shop', s => kindOf(s) === 'food'))}</button><button class="${shopKind === 'other' ? 'on' : ''}" onclick="shopKind='other';render()">🧴 Інші покупки · ${nk('other')}${sb(unseen('shop', s => kindOf(s) === 'other'))}</button></div>
    <div class="addline"><input id="shopIn" maxlength="80" placeholder="${shopKind === 'food' ? '+ Додати молоко, сир, фрукти...' : '+ Додати побутову хімію, речі...'}" onkeydown="if(event.key==='Enter')addShop(this.value)"><button class="btn" onclick="addShop(document.getElementById('shopIn').value)">+</button></div>
    ${quick.length ? `<div class="chips">${quick.map(q => `<button class="chip" onclick="addShop('${q}')">+ ${q}</button>`).join('')}</div>` : ''}
    ${open.length || done.length ? open.concat(done).map(s => `<div class="item ${s.done ? 'done' : ''}${nw(s)}" style="align-items:center"><button class="check ${s.done ? 'on' : ''}" onclick="toggle('shop','${s.id}')">${s.done ? '✓' : ''}</button><div class="tx"><div class="tt" style="font-size:15.5px">${esc(s.title)}</div></div>${byTag(s)}<button class="more" onclick="itemMenu('shop','${s.id}')">⋯</button></div>`).join('') + (done.length ? `<button class="btn ghost" style="width:100%" onclick="S.shop=S.shop.filter(s=>!(s.done && (s.kind || 'food') === shopKind));save();render()">Прибрати куплене (${done.length})</button>` : '') : `<div class="empty">${BEAGLE}Список порожній — додайте, що потрібно купити.</div>`}`;
  } else if (homeSeg === 'tasks') {
    const list = [...S.tasks].sort((a, b) => (a.done - b.done) || ((a.date || '9999').localeCompare(b.date || '9999')));
    body = `<button class="btn" style="width:100%;margin-bottom:12px" onclick="addTask()">+ Нова справа</button>
    ${list.length ? list.map(t => { const late = !t.done && t.date && t.date < today(); return `<div class="item ${t.done ? 'done' : ''}${nw(t)}" style="align-items:center"><button class="check ${t.done ? 'on' : ''}" onclick="toggle('tasks','${t.id}')">${t.done ? '✓' : ''}</button><div class="tx"><div class="tt" style="font-size:15.5px">${esc(t.title)}</div>${t.date || t.repeat ? `<div class="ds" ${late ? 'style="color:#D9645A"' : ''}>${t.date ? '📅 ' + fmtS(t.date, false) : ''}${t.repeat ? ' · 🔁 ' + REPEAT[t.repeat] : ''}${late ? ' · прострочено' : ''}</div>` : ''}</div>${byTag(t)}<button class="more" onclick="taskMenu('${t.id}')">⋯</button></div>`; }).join('') : `<div class="empty">${BEAGLE}Справ немає — можна відпочивати!</div>`}`;
  } else {
    body = `<p class="sub">Рецепти і страви, які нам подобаються.</p>
    <button class="tile dark" style="width:100%;margin-bottom:12px" onclick="randomRecipe()"><span class="ti">🎲</span><b>Випадковий рецепт</b><small>Нехай жереб вирішить, що готувати</small></button>
    <div class="search"><input placeholder="🔍 Пошук за назвою страви..." value="${esc(recipeQ)}" oninput="recipeQ=this.value;document.getElementById('recipeList').innerHTML=recipeListHTML()"></div>
    <div id="recipeList">${recipeListHTML()}</div>`;
  }
  return `
  <div class="page-head"><div><h1>Дім</h1><p class="sub">Покупки, справи й рецепти — спільний список на двох.</p></div><button class="fab" onclick="homeAdd()">+</button></div>
  <div class="seg"><button class="${homeSeg === 'shop' ? 'on' : ''}" onclick="homeSeg='shop';render()">🛒 Покупки${sb(unseen('shop'))}</button><button class="${homeSeg === 'tasks' ? 'on' : ''}" onclick="homeSeg='tasks';render()">🔁 Справи${sb(unseen('tasks'))}</button><button class="${homeSeg === 'recipes' ? 'on' : ''}" onclick="homeSeg='recipes';render()">🍳 Рецепти${sb(unseen('recipes'))}</button></div>
  ${body}`;
}

function vWish() {
  if (!wishWho) wishWho = S.me;
  const list = S.wish.filter(w => w.seg === wishSeg && (wishSeg !== 'gift' || w.owner === wishWho));
  const listHtml = list.length ? list.map(w => {
    const mine = w.owner === S.me, reservedByMe = w.reservedBy === S.me;
    const lk = linkOf(w), desc = cleanDesc(w);
    return `<div class="item ${w.done ? 'done' : ''}${nw(w)}">${w.img ? `<div class="thumb" style="background-image:url('${esc(w.img).replace(/'/g, '%27')}')"></div>` : `<div class="ic">${w.loading ? '⏳' : wishSeg === 'gift' ? '🎁' : wishSeg === 'watch' ? '🎬' : '✨'}</div>`}<div class="tx"><div class="tt">${esc(w.title)}</div>${desc ? `<div class="ds">${esc(desc)}</div>` : ''}${w.price || lk ? `<div class="chips-row">${w.price ? `<span class="pill">💰 ${esc(w.price)}</span>` : ''}${lk ? `<a class="pill link" href="${esc(lk)}" target="_blank" rel="noopener" onclick="return openLink(this.href)">${esc(siteOf(w))} ↗</a>` : ''}</div>` : ''}${!mine && reservedByMe ? `<span class="pill">🔒 Я готую цей подарунок</span>` : ''}</div>${wishSeg !== 'gift' ? byTag(w) : ''}<button class="more" onclick="wishMenu('${w.id}')">⋯</button></div>`;
  }).join('') : `<div class="empty">${BEAGLE}${wishSeg === 'gift' && wishWho !== S.me ? esc(S.names[wishWho]) + ' ще нічого не додав(-ла).' : 'Поки порожньо — додай те, про що мрієш.'}</div>`;
  return `
  <div class="page-head"><div><h1>Наш вішлист</h1><p class="sub">Те, що хочеться отримати, побачити й прожити.</p></div><button class="fab" onclick="addWish()">+</button></div>
  <div class="seg">${Object.entries({ gift: '🎁 Подарунки', watch: '👀 Подивитися', dream: '✨ Мрії' }).map(([k, v]) => `<button class="${wishSeg === k ? 'on' : ''}" onclick="wishSeg='${k}';render()">${v}${sb(unseen('wish', w => w.seg === k))}</button>`).join('')}</div>
  ${wishSeg === 'gift' ? `<div class="who">${['a', 'b'].map(k => `<button class="${wishWho === k ? 'on' : ''}" onclick="wishWho='${k}';render()"><span class="mini ${k}">${ini(S.names[k])}</span>${k === S.me ? 'Хочу я' : 'Хоче ' + esc(S.names[k])}${sb(unseen('wish', w => w.seg === 'gift' && w.owner === k))}</button>`).join('')}</div>
  <div class="note-lock">🔒 Те, що ти готуєш подарунок, бачиш тільки ти</div>
  ${wishWho !== S.me ? `<button class="week-banner" style="margin-bottom:12px" onclick="openAbout(wishWho)"><span class="wi">${fe('Memo', '🗒', 28)}</span><span><b>Шпаргалка: ${esc(S.names[wishWho])}</b><small>Розміри, улюблені квіти, кава — для влучних подарунків</small></span><span class="chev">›</span></button>` : ''}` : ''}
  ${listHtml}
  <p class="sub" style="text-align:center;margin-top:14px;font-size:13px">♡ Помічати, що робить вас щасливими</p>`;
}

function vMore() {
  return `
  <h1>Ще</h1><p class="sub">Інші розділи додатка.</p>
  <div class="lbl">Розділи</div>
  <div class="grid4">
    <button class="gcard" onclick="go('dates')"><div class="gi" style="background:#FDE6E4">${fe('Yellow heart', '💛')}</div><b>Побачення${sb(unseen('dates'))}</b><small>${S.dates.length} · де були і як</small></button>
    <button class="gcard" onclick="go('trips')"><div class="gi" style="background:#DCEEFF">${fe('Luggage', '🧳')}</div><b>Подорожі${sb(unseen('trips'))}</b><small>${S.trips.length} · напрямки й бюджет</small></button>
    <button class="gcard" onclick="openCalendar()"><div class="gi" style="background:#FFE3DC">${fe('Spiral calendar', '📅')}</div><b>Календар</b><small>Усі зустрічі й події</small></button>
    <button class="gcard" onclick="openWeeklyHistory()"><div class="gi" style="background:#F1E3FF">${fe('Two hearts', '💞')}</div><b>Чек-ін пари</b><small>Як минув ваш тиждень</small></button>
    <button class="gcard" onclick="openAbout()"><div class="gi" style="background:#E6F4E1">${fe('Memo', '🗒')}</div><b>Шпаргалка</b><small>Розміри, смаки, дрібниці</small></button>
    <button class="gcard" onclick="openDeck()"><div class="gi" style="background:#FFF3CF">${fe('Speech balloon', '💬')}</div><b>Картки для розмови</b><small>${QBANK.length} питань, 3 рівні</small></button>
    <button class="gcard" onclick="openIdeas()"><div class="gi" style="background:#FFF0D6">${fe('Light bulb', '💡')}</div><b>Ідеї побачень</b><small>${IDEAS.length} ідей на будь-який вечір</small></button>
    <button class="gcard" onclick="go('pet')"><div class="gi" style="background:#F1E3FF">${fe('Dog face', '🐶')}</div><b>${S.pets.length > 1 ? 'Улюбленці' : 'Улюбленець'}${sb(unseen('petEvents'))}</b><small>${S.pets.length ? esc(S.pets.map(p => p.name).join(', ')) : 'Здоров’я, грумінг, корм'}</small></button>
    <button class="gcard" onclick="go('kid')"><div class="gi" style="background:#E3F1FF">${fe('Baby', '👶')}</div><b>${S.kids.length > 1 ? 'Діти' : 'Дитина'}${sb(unseen('kidEvents'))}</b><small>${S.kids.length ? esc(S.kids.map(k => k.name).join(', ')) : 'Щеплення, лікарі, ріст'}</small></button>
    <button class="gcard" onclick="openQaHistory()"><div class="gi" style="background:#DCEEFF">${fe('Red question mark', '❓')}</div><b>Наші відповіді</b><small>Питання дня</small></button>
  </div>
${goalsHTML()}
  <div class="lbl">Налаштування і підтримка</div>
  <div class="card" style="padding:4px 16px">
    <button class="row" style="width:100%;text-align:left" onclick="openCouple()"><div class="ic">💑</div><div class="tx"><b>Наша пара</b><small>${ONLINE ? 'Запрошення, сповіщення' : 'Партнер, сповіщення'}</small></div>›</button>
    <button class="row" style="width:100%;text-align:left" onclick="openWidgets()"><div class="ic">🏠</div><div class="tx"><b>Віджети на головній</b><small>Улюбленці, діти, питання дня, спогади</small></div>›</button>
    <button class="row" style="width:100%;text-align:left" onclick="openThemes()"><div class="ic">🎨</div><div class="tx"><b>Оформлення</b><small>${THEMES[getTheme()]}</small></div>›</button>
    <button class="row" style="width:100%;text-align:left" onclick="openSettings()"><div class="ic">⚙️</div><div class="tx"><b>Налаштування</b><small>Імена, назва, місто</small></div>›</button>
    <button class="row" style="width:100%;text-align:left" onclick="openBackup()"><div class="ic">📦</div><div class="tx"><b>Резервна копія</b><small>Зберегти або відновити всі дані</small></div>›</button>
    <button class="row" style="width:100%;text-align:left" onclick="openFaq()"><div class="ic">❓</div><div class="tx"><b>Часті питання</b><small>Як усе працює</small></div>›</button>
  </div>`;
}

/* ===== Дії: головна ===== */
function setSince() {
  formSheet('Наші дати 💞', [
    { k: 'since', l: '💛 Дата початку стосунків', type: 'date', v: S.since, max: today(), maxMsg: 'Ця дата не може бути в майбутньому', req: false },
    { k: 'wedding', l: '💍 Дата одруження (необов’язково)', type: 'date', v: S.wedding, max: today(), maxMsg: 'Дата одруження не може бути в майбутньому', req: false }
  ], v => {
    if (v.since && v.wedding && v.wedding < v.since) return 'Дата одруження не може бути раніше початку стосунків';
    S.since = v.since; S.wedding = v.wedding;
    // річниця весілля — у «Важливі дати», щоб бот нагадував
    if (v.wedding) {
      const ev = S.events.find(e => e.kind === 'wedding');
      if (ev) ev.date = v.wedding;
      else S.events.push({ id: uid(), kind: 'wedding', title: 'Річниця весілля', date: v.wedding, emoji: '💍', yearly: true });
    } else S.events = S.events.filter(e => e.kind !== 'wedding');
  });
}
function setMood(m) { const mm = (S.moods[S.me] = S.moods[S.me] || {}); mm[today()] = mm[today()] === m ? undefined : m; save(); render(); haptic(); }
function addNote() { formSheet('Записка для ' + S.names[other()], [{ k: 'text', l: 'Текст записки', type: 'textarea', ph: 'Напиши щось приємне 💌' }], v => { S.notes.push({ id: uid(), text: v.text, from: S.me, date: today() }); toast('Записку надіслано 💌'); }, 'Надіслати'); }
function addEvent(e) {
  formSheet(e ? 'Редагувати дату' : 'Важлива дата', [
    { k: 'title', l: 'Назва', v: e?.title, ph: 'Наприклад: Річниця' }, { k: 'date', l: 'Дата', type: 'date', v: e?.date, req: true },
    { k: 'emoji', l: 'Емодзі', v: e?.emoji || '🎉', maxlen: 4 }, { k: 'yearly', l: 'Повторювати', type: 'select', v: e ? (e.yearly ? '1' : '0') : '1', opts: [['1', 'Щороку'], ['0', 'Один раз']] }
  ], v => { const o = { title: v.title, date: v.date, emoji: v.emoji, yearly: v.yearly === '1' }; if (e) Object.assign(e, o); else S.events.push({ id: uid(), ...o }); });
}
function eventMenu(id) { const e = S.events.find(x => x.id === id); itemMenu('events', id, [['✎ Редагувати', () => { addEvent(e); return 'keep'; }]]); }
function eveningIdea() {
  const films = ['«Амелі»', '«Про час»', '«Ла-Ла Ленд»', '«Гордість і упередження»', '«Вічне сяйво чистого розуму»', '«Перед світанком»', '«1+1»', '«Королівство повного місяця»'];
  const r = S.recipes.length ? pick(S.recipes).title : 'щось нове разом';
  const idea = pick(IDEAS.filter(i => i.c === 'home'));
  openSheet(`<h3>Ідея на вечір 🪄</h3><div class="reveal">🎬<div class="big">${pick(films)}</div><div class="sub" style="margin:0">+ готуємо: <b>${esc(r)}</b></div><div class="sub" style="margin:8px 0 0">або: ${esc(idea.t)}</div></div><div class="acts" style="margin-top:14px"><button class="btn ghost" onclick="eveningIdea()">Ще варіант</button><button class="btn" onclick="closeSheet()">Беремо!</button></div>`);
}

/* ===== Побачення і поїздки ===== */
function quickAdd(kind) {
  S[kind].push({ id: uid(), date: today(), title: '', desc: '', rating: 0, created: Date.now() });
  save(); render(); haptic('medium');
  toast(kind === 'dates' ? '+1 побачення 💛 Деталі — у розділі «Побачення»' : '+1 поїздка 🧳 Деталі — у розділі «Подорожі»');
}
function minus(kind) {
  if (!S[kind].length) return toast('Поки нічого видаляти');
  const last = S[kind].reduce((a, b) => ((b.created || 0) >= (a.created || 0) ? b : a));
  const name = (last.title || (kind === 'dates' ? 'Побачення' : 'Поїздка')) + (last.date ? ' (' + fmtS(last.date) + ')' : '');
  confirmSheet(`Видалити останній запис «${name}»?`, '− Видалити', () => {
    S[kind] = S[kind].filter(x => x.id !== last.id);
    if (last.placeId) { const p = S.places.find(p => p.id === last.placeId); if (p) p.visited = S.dates.some(d => d.placeId === p.id); }
  });
}
const RATING = [['0', 'Без оцінки'], ['5', '★★★★★ Неймовірно'], ['4', '★★★★ Дуже добре'], ['3', '★★★ Добре'], ['2', '★★ Так собі'], ['1', '★ Не вдалося']];
function editDate(d) {
  formSheet(d ? 'Побачення' : 'Нове побачення', [
    { k: 'date', l: 'Коли', type: 'date', v: d ? d.date : today(), max: today(), maxMsg: 'Побачення не може бути в майбутньому', req: true },
    { k: 'title', l: 'Де були', v: d?.title, ph: 'Кафе, кіно, прогулянка парком...', req: false },
    { k: 'desc', l: 'Як пройшло', type: 'textarea', v: d?.desc, ph: 'Що робили, що запам’яталось...', req: false },
    { k: 'rating', l: 'Оцінка', type: 'select', v: d ? String(d.rating || 0) : '0', opts: RATING }
  ], v => { const o = { date: v.date, title: v.title, desc: v.desc, rating: +v.rating }; if (d) Object.assign(d, o); else S.dates.push({ id: uid(), created: Date.now(), ...o }); });
}
function dateMenu(id) {
  const d = S.dates.find(x => x.id === id);
  itemMenu('dates', id, [['✎ Редагувати деталі', () => { editDate(d); return 'keep'; }]], () => {
    if (d.placeId) { const p = S.places.find(p => p.id === d.placeId); if (p) p.visited = S.dates.some(x => x.placeId === p.id && x.id !== d.id); }
  });
}
function editTrip(t) {
  formSheet(t ? 'Поїздка' : 'Нова поїздка', [
    { k: 'title', l: 'Куди', v: t?.title, ph: 'Львів, Карпати, Прага...' },
    { k: 'date', l: 'З якого числа', type: 'date', v: t ? t.date : today(), req: true },
    { k: 'dateTo', l: 'По яке число (необов’язково)', type: 'date', v: t?.dateTo, req: false },
    { k: 'desc', l: 'Як пройшло / план', type: 'textarea', v: t?.desc, ph: 'Що бачили, де жили, що їли...', req: false },
    { k: 'budget', l: 'Бюджет, ₴ (необов’язково)', type: 'number', v: t?.budget, ph: '0', req: false },
    { k: 'rating', l: 'Оцінка', type: 'select', v: t ? String(t.rating || 0) : '0', opts: RATING }
  ], v => {
    if (v.dateTo && v.dateTo < v.date) return 'Дата повернення не може бути раніше початку';
    if (v.budget && +v.budget < 0) return 'Бюджет не може бути від’ємним';
    const o = { title: v.title, date: v.date, dateTo: v.dateTo, desc: v.desc, budget: v.budget ? +v.budget : 0, rating: +v.rating };
    if (t) Object.assign(t, o); else S.trips.push({ id: uid(), created: Date.now(), ...o });
  });
}
function tripMenu(id) { const t = S.trips.find(x => x.id === id); itemMenu('trips', id, [['✎ Редагувати деталі', () => { editTrip(t); return 'keep'; }]]); }

/* ===== Місця ===== */
function addPlace(p) {
  formSheet(p ? 'Редагувати місце' : 'Нове місце', [
    { k: 'title', l: 'Назва', v: p?.title, ph: 'Кав’ярня «...»' }, { k: 'cat', l: 'Категорія', v: p?.cat ?? 'Кафе', ph: 'Кафе, природа, виставка...', req: false, maxlen: 30 },
    { k: 'desc', l: 'Опис', type: 'textarea', v: p?.desc, ph: 'Чим цікаве місце', req: false },
    { k: 'kind', l: 'Тип', type: 'select', v: p?.kind || placeSeg, opts: [['spont', '⚡ Спонтанне'], ['plan', '🗓 Заплановане']] }
  ], v => { if (p) Object.assign(p, v); else S.places.push({ id: uid(), visited: false, ...v }); });
}
function placeMenu(id) {
  const p = S.places.find(x => x.id === id);
  itemMenu('places', id, [
    [p.visited ? '↩︎ Ми тут ще не були' : '✓ Ми тут були (+1 побачення)', () => {
      if (!p.visited) { S.dates.push({ id: uid(), created: Date.now(), date: today(), title: p.title, desc: '', rating: 0, placeId: p.id }); p.visited = true; toast('+1 побачення 💛'); }
      else { const ds = S.dates.filter(d => d.placeId === p.id); if (ds.length) { const last = ds[ds.length - 1]; S.dates = S.dates.filter(d => d.id !== last.id); } p.visited = false; }
    }],
    ['🎭 Зробити побаченням наосліп', () => { newSurprise(null, p.id); return 'keep'; }],
    ['✎ Редагувати', () => { addPlace(p); return 'keep'; }]
  ]);
}
function randomPlace() {
  const pool = S.places.filter(p => !p.visited);
  if (!pool.length) { toast('Своїх місць поки немає — пошукаймо в місті ✨'); return openFinder(true); }
  const p = pick(pool); haptic('medium');
  openSheet(`<h3>Жереб вирішив 🎲</h3><div class="reveal"><div style="color:var(--muted);font-weight:800;font-size:12px;text-transform:uppercase">${esc(p.cat)}</div><div class="big">${esc(p.title)}</div><div class="sub" style="margin:0">${esc(p.desc)}</div></div><div class="acts" style="margin-top:14px"><button class="btn ghost" onclick="randomPlace()">Ще раз</button><button class="btn" onclick="closeSheet()">Йдемо!</button></div><button class="btn ghost" style="width:100%;margin-top:10px" onclick="openFinder(true)">✨ Випадкове нове місце в місті</button>`);
}

/* ===== Побачення наосліп ===== */
const sDT = x => { const [y, m, d] = x.date.split('-').map(Number), [hh, mm] = (x.time || '00:00').split(':').map(Number); return new Date(y, m - 1, d, hh, mm); };
const sRevealed = x => x.revealed || new Date() >= sDT(x);
function countdown(x) {
  const ms = sDT(x) - new Date(); if (ms <= 0) return 'вже час! ✨';
  const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4);
  return d ? `через ${d} дн. ${h} год.` : h ? `через ${h} год. ${m} хв.` : `через ${m} хв.`;
}
const whenTxt = x => fmtS(x.date, false) + ' · ' + x.time;
function newSurprise(x, presetPlace) {
  const pool = S.places.filter(p => !p.visited || p.id === x?.placeId);
  formSheet(x ? 'Редагувати сюрприз' : 'Побачення наосліп 🎭', [
    { k: 'placeId', l: 'Куди (бачиш тільки ти)', type: 'select', v: x ? (x.placeId || '') : (presetPlace || ''), req: false, opts: [['', '✍️ Своє місце — впишіть нижче'], ...pool.map(p => [p.id, '📍 ' + p.title])] },
    { k: 'secret', l: 'Або впишіть своє місце', v: x && !x.placeId ? x.place : '', ph: 'Ресторан на даху, квест, каток...', req: false },
    { k: 'date', l: 'Дата', type: 'date', v: x ? x.date : '', min: today(), minMsg: 'Дата не може бути в минулому', req: true },
    { k: 'time', l: 'Час', type: 'time', v: x ? x.time : '19:00', req: true },
    { k: 'meet', l: 'Де зустрічаємось (це побачить ' + S.names[other()] + ')', v: x?.meet, ph: 'Біля фонтану в центрі / вдома', req: true },
    { k: 'hint', l: 'Підказка для партнера (необов’язково)', v: x?.hint, ph: 'Одягнись тепло, візьми зручне взуття...', req: false },
    { k: 'notes', l: '📝 Мої нотатки — бачу тільки я', type: 'textarea', v: x?.notes, ph: 'Забронювати столик, купити квіти, взяти гроші...', req: false }
  ], v => {
    const p = v.placeId ? S.places.find(p => p.id === v.placeId) : null;
    if (!p && !v.secret) return 'Оберіть місце зі списку або впишіть своє';
    if (sDT(v) <= new Date()) return 'Цей час уже минув — оберіть пізніше';
    const o = { placeId: p ? p.id : '', place: p ? p.title : v.secret, date: v.date, time: v.time, meet: v.meet, hint: v.hint, notes: v.notes };
    if (x) { Object.assign(x, o); x.seen = [S.me]; x.updated = true; toast('Запрошення оновлено — ' + S.names[other()] + ' отримає сповіщення'); }
    else { S.surprises.push({ id: uid(), done: false, revealed: false, created: Date.now(), ...o }); toast('Надіслано 💌 ' + S.names[other()] + ' побачить запрошення'); }
  }, x ? 'Зберегти' : 'Надіслати 💌');
  // кнопка «випадкове місце» під списком
  const sel = document.getElementById('f_placeId');
  if (pool.length) {
    sel.parentElement.insertAdjacentHTML('afterend', '<button class="btn ghost sm inline-rand" id="f_rand">🎲 Випадкове місце</button>');
    document.getElementById('f_rand').onclick = () => { sel.value = pick(pool).id; document.getElementById('f_secret').value = ''; haptic(); };
  }
}
function openInvite(id) {
  const x = S.surprises.find(o => o.id === id); see(x); save(); haptic('heavy');
  openSheet(`<h3>Тебе запрошено! 🎭</h3><div class="reveal"><div class="sub" style="margin:0">${esc(S.names[x.by])} влаштовує побачення наосліп</div><div class="big">${whenTxt(x)}</div><div class="sub" style="margin:0">🤝 ${esc(x.meet)}</div>${x.hint ? `<div class="sub" style="margin:8px 0 0">💡 ${esc(x.hint)}</div>` : ''}<div class="sub" style="margin:10px 0 0">Куди саме — секрет 🤫</div></div><button class="btn" style="width:100%;margin-top:14px" onclick="closeSheet();render()">Буду! 💛</button>`);
}
function surpriseCardsHTML() {
  const list = S.surprises.filter(x => !x.done && !(x.by !== S.me && isNew(x))).sort((a, b) => sDT(a) - sDT(b));
  return list.map(x => {
    const mine = x.by === S.me, rev = sRevealed(x), past = new Date() >= sDT(x), o = S.names[other()];
    if (mine) return `<div class="card invite">
      <div class="lbl">🎭 Ти готуєш сюрприз для ${esc(o)}</div>
      <div class="when">${whenTxt(x)}</div><span class="pill">${countdown(x)}</span>
      <div class="ln"><span>📍</span><span><b>${esc(x.place)}</b> <span class="muted">(секрет)</span></span></div>
      <div class="ln"><span>🤝</span><span>Зустріч: ${esc(x.meet)}</span></div>
      ${x.hint ? `<div class="ln"><span>💡</span><span>Підказка: ${esc(x.hint)}</span></div>` : ''}
      ${x.notes ? `<div class="ln"><span>📝</span><span class="muted">${esc(x.notes)}</span></div>` : ''}
      <div class="ln muted"><span>${x.seen.includes(other()) ? '✓✓' : '✓'}</span><span>${x.seen.includes(other()) ? esc(o) + ' отримав(-ла) запрошення' : 'Надіслано, ' + esc(o) + ' ще не відкрив(-ла)'}</span></div>
      <div class="btns">${past ? `<button class="btn sm" onclick="finishSurprise('${x.id}')">💛 Ми там були</button>` : `<button class="btn sm" onclick="revealSurprise('${x.id}')">${x.revealed ? '🙈 Сховати місце' : '👀 Розкрити зараз'}</button>`}<button class="btn ghost sm" onclick="newSurprise(S.surprises.find(o=>o.id==='${x.id}'))">✎</button><button class="btn ghost sm" onclick="cancelSurprise('${x.id}')">Скасувати</button></div>
    </div>`;
    return `<div class="card invite">
      <div class="lbl">🎭 Побачення наосліп від ${esc(S.names[x.by])}</div>
      <div class="when">${whenTxt(x)}</div><span class="pill">${countdown(x)}</span>
      <div class="ln"><span>🤝</span><span>Де зустрічаємось: <b>${esc(x.meet)}</b></span></div>
      ${x.hint ? `<div class="ln"><span>💡</span><span>${esc(x.hint)}</span></div>` : ''}
      <div class="ln"><span>📍</span><span>${rev ? 'Куди: <b>' + esc(x.place) + '</b>' : '<span class="muted">Куди — секрет 🤫</span>'}</span></div>
      ${past ? `<div class="btns"><button class="btn sm" onclick="finishSurprise('${x.id}')">💛 Ми там були</button></div>` : ''}
    </div>`;
  }).join('');
}
function revealSurprise(id) { const x = S.surprises.find(o => o.id === id); x.revealed = !x.revealed; save(); render(); toast(x.revealed ? 'Місце розкрито для ' + S.names[other()] : 'Місце знову секрет 🤫'); }
function cancelSurprise(id) { confirmSheet('Скасувати побачення наосліп?', 'Скасувати', () => { S.surprises = S.surprises.filter(o => o.id !== id); toast('Скасовано'); }); }
function finishSurprise(id) {
  const x = S.surprises.find(o => o.id === id); x.done = true;
  S.dates.push({ id: uid(), created: Date.now(), date: x.date, title: x.place, desc: 'Побачення наосліп 🎭', rating: 0, placeId: x.placeId || undefined });
  const p = x.placeId && S.places.find(p => p.id === x.placeId); if (p) p.visited = true;
  save(); render(); haptic('medium'); toast('Додано в побачення 💛 Оцініть його в розділі «Побачення»');
}

/* ===== Записки ===== */
function openNote(id) {
  const n = S.notes.find(o => o.id === id); see(n); save(); haptic('medium');
  openSheet(`<h3>Записка від ${esc(S.names[n.from])} 💌</h3><div class="reveal"><div class="big" style="font-size:19px;white-space:pre-wrap">${esc(n.text)}</div><div class="sub" style="margin:8px 0 0">${fmtS(n.date)}</div></div><div class="acts" style="margin-top:14px"><button class="btn ghost" onclick="addNote()">Відповісти</button><button class="btn" onclick="closeSheet();render()">💛</button></div>`);
}
function alertsHTML() {
  const o = other(), out = [];
  S.surprises.filter(x => !x.done && x.by !== S.me && isNew(x)).forEach(x => out.push(`<button class="alert" onclick="openInvite('${x.id}')"><div class="ai">🎭</div><div><b>${esc(S.names[x.by])} ${x.updated ? 'оновив(-ла) запрошення' : 'запрошує тебе на побачення наосліп!'}</b><small>Натисни, щоб відкрити</small></div></button>`));
  const nd = (S.nudges || []).filter(x => x.by !== S.me && isNew(x));
  if (nd.length) out.push(`<button class="alert" onclick="openNudges()"><div class="ai">💛</div><div><b>${esc(S.names[o])} думає про тебе${nd.length > 1 ? ' ×' + nd.length : ''}</b><small>Натисни, щоб обійняти у відповідь</small></div></button>`);
  const qx = S.qa && S.qa[today()];
  if (qx && qx.a && qx.a[o] && !qx.a[S.me]) out.push(`<button class="alert" onclick="document.getElementById('qaCard')?.scrollIntoView({behavior:'smooth',block:'center'})"><div class="ai">❓</div><div><b>${esc(S.names[o])} відповів(-ла) на питання дня</b><small>Відповідай, щоб побачити відповідь</small></div></button>`);
  const notes = S.notes.filter(n => n.from !== S.me && isNew(n));
  if (notes.length) out.push(`<button class="alert" onclick="openNote('${notes[notes.length - 1].id}')"><div class="ai">💌</div><div><b>${notes.length > 1 ? notes.length + ' нові записки' : 'Нова записка'} від ${esc(S.names[o])}</b><small>Натисни, щоб прочитати</small></div></button>`);
  const other_new = [['shop', '🛒', 'у покупках', 'home'], ['tasks', '🔁', 'у справах', 'home'], ['wish', '🎁', 'у вішлисті', 'wish'], ['places', '📍', 'у місцях', 'places']]
    .map(([l, ic, w, t]) => [unseen(l), ic, w, t, l]).filter(x => x[0]);
  if (other_new.length) out.push(`<div class="card" style="padding:6px 16px">${other_new.map(([n, ic, w, t, l]) => `<button class="row" style="width:100%;text-align:left" onclick="${l === 'shop' || l === 'tasks' ? `homeSeg='${l}';` : ''}go('${t}')"><div class="ic">${ic}</div><div class="tx"><b>${n} ${plural(n, 'нове', 'нових', 'нових')} ${w}</b><small>від ${esc(S.names[o])}</small></div><span class="sbadge">${n}</span></button>`).join('')}</div>`);
  return out.join('');
}

const inTG = !!(tg && tg.initData);
function openLink(url) { if (inTG) { try { tg.openLink(url); return false; } catch (e) {} } return true; }

/* ===== Ідеї в місті: реальні місця з OpenStreetMap + AI за бажанням ===== */
const CATS = {
  all: { l: '✨ Усе' },
  cafe: { l: '☕ Кафе', q: ['nwr["amenity"~"^(cafe|ice_cream)$"]'] },
  food: { l: '🍽 Ресторани', q: ['nwr["amenity"="restaurant"]'] },
  bar: { l: '🍸 Бари', q: ['nwr["amenity"~"^(bar|pub)$"]'] },
  museum: { l: '🏛 Музеї', q: ['nwr["tourism"~"^(museum|gallery)$"]'] },
  culture: { l: '🎭 Культура', q: ['nwr["amenity"~"^(theatre|cinema|arts_centre)$"]'] },
  nature: { l: '🌳 Природа', q: ['nwr["leisure"~"^(park|garden)$"]', 'nwr["tourism"="viewpoint"]'] },
  fun: { l: '🎳 Розваги', q: ['nwr["leisure"~"^(escape_game|bowling_alley|amusement_arcade|miniature_golf|water_park|ice_rink|trampoline_park)$"]', 'nwr["tourism"~"^(zoo|aquarium|theme_park)$"]'] }
};
const TAGCAT = t => {
  const a = t.amenity, to = t.tourism, le = t.leisure;
  if (a === 'cafe' || a === 'ice_cream') return ['Кафе', '☕'];
  if (a === 'restaurant') return ['Ресторан', '🍽'];
  if (a === 'bar' || a === 'pub') return ['Бар', '🍸'];
  if (to === 'museum') return ['Музей', '🏛'];
  if (to === 'gallery') return ['Галерея', '🖼'];
  if (a === 'theatre') return ['Театр', '🎭'];
  if (a === 'cinema') return ['Кіно', '🎬'];
  if (a === 'arts_centre') return ['Арт-простір', '🎨'];
  if (le === 'park' || le === 'garden') return ['Парк', '🌳'];
  if (to === 'viewpoint') return ['Оглядовий майданчик', '🌅'];
  if (to === 'zoo') return ['Зоопарк', '🦒'];
  if (to === 'aquarium') return ['Океанаріум', '🐠'];
  if (le === 'escape_game') return ['Квест-кімната', '🔐'];
  if (le === 'bowling_alley') return ['Боулінг', '🎳'];
  if (le === 'ice_rink') return ['Ковзанка', '⛸'];
  return ['Розваги', '🎡'];
};
let finderCat = 'all', finderRes = [], geoCache = {}, osmCache = {};
/* запит з обмеженням часу — щоб нічого не «висіло» */
async function fetchT(url, opts = {}, ms = 15000) {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}
/* ---- підказки міст (Photon / OpenStreetMap) ---- */
let cityTimer = null, cityReq = 0;
async function citySuggest(q) {
  const box = document.getElementById('fCityList'); if (!box) return;
  q = q.trim();
  if (q.length < 2) { box.innerHTML = ''; return; }
  const my = ++cityReq;
  try {
    const r = await fetchT('https://photon.komoot.io/api/?limit=6&layer=city&q=' + encodeURIComponent(q), {}, 6000);
    const j = await r.json();
    if (my !== cityReq) return;
    const seen = new Set();
    const items = (j.features || []).map(f => {
      const p = f.properties || {}, [lon, lat] = f.geometry.coordinates;
      const sub = [p.state, p.country].filter(Boolean).join(', ');
      return { name: p.name, sub, lat, lon };
    }).filter(x => x.name && !seen.has(x.name + x.sub) && seen.add(x.name + x.sub));
    box.innerHTML = items.map((x, i) => `<button class="ac-item" data-i="${i}"><b>${esc(x.name)}</b><small>${esc(x.sub)}</small></button>`).join('');
    box.querySelectorAll('.ac-item').forEach(b => b.onclick = () => {
      const x = items[+b.dataset.i];
      document.getElementById('fCity').value = x.name;
      S.city = x.name; S.cityGeo = { name: x.name, sub: x.sub, lat: x.lat, lon: x.lon }; save();
      geoCache[x.name.toLowerCase()] = { lat: x.lat, lon: x.lon, name: x.name + (x.sub ? ', ' + x.sub.split(', ').pop() : '') };
      box.innerHTML = ''; haptic();
    });
  } catch (e) { if (my === cityReq) box.innerHTML = ''; }
}
async function geocode(city) {
  const k = city.toLowerCase(); if (geoCache[k]) return geoCache[k];
  if (S.cityGeo && S.cityGeo.name.toLowerCase() === k) return (geoCache[k] = { lat: S.cityGeo.lat, lon: S.cityGeo.lon, name: S.cityGeo.name });
  // 1) Photon, 2) запасний — Nominatim
  try {
    const r = await fetchT('https://photon.komoot.io/api/?limit=1&layer=city&q=' + encodeURIComponent(city), {}, 7000);
    const f = r.ok ? ((await r.json()).features || [])[0] : null;
    if (f) { const [lon, lat] = f.geometry.coordinates, p = f.properties || {}; return (geoCache[k] = { lat, lon, name: [p.name, p.country].filter(Boolean).join(', ') }); }
  } catch (e) {}
  let j;
  try { const r = await fetchT('https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=uk&q=' + encodeURIComponent(city), {}, 8000); if (!r.ok) throw 0; j = await r.json(); }
  catch (e) { throw new Error('geo'); }
  if (!j.length) throw new Error('nocity');
  return (geoCache[k] = { lat: +j[0].lat, lon: +j[0].lon, name: j[0].display_name.split(',').slice(0, 2).join(',') });
}
/* ---- місця з OpenStreetMap: легкий запит у квадраті ~5 км, кілька серверів паралельно — перемагає найшвидший ---- */
let placesDiag = '';
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
function osmCacheGet(key) { try { const x = JSON.parse(localStorage.getItem('osm:' + key)); if (x && Date.now() - x.t < 3 * 864e5) return x.list; } catch (e) {} return null; }
function osmCachePut(key, list) { try { localStorage.setItem('osm:' + key, JSON.stringify({ t: Date.now(), list })); } catch (e) {} }
async function osmPlaces(geo, cat) {
  const key = geo.lat.toFixed(3) + ',' + geo.lon.toFixed(3) + ',' + cat;
  if (osmCache[key]) return osmCache[key];
  const cached = osmCacheGet(key); if (cached) return (osmCache[key] = cached);
  const qs = cat === 'all' ? Object.values(CATS).flatMap(c => c.q || []) : CATS[cat].q;
  const dLat = 0.045, dLon = 0.045 / Math.cos(geo.lat * Math.PI / 180);
  const bbox = [geo.lat - dLat, geo.lon - dLon, geo.lat + dLat, geo.lon + dLon].map(x => x.toFixed(4)).join(',');
  const query = `[out:json][timeout:15][bbox:${bbox}];(${qs.map(q => q + '["name"];').join('')});out center qt 300;`;
  // спершу — через наш сервер (надійніше: Geoapify або Overpass з правильними заголовками)
  placesDiag = '';
  if (ONLINE) {
    try {
      const r = await Promise.race([api('places', { lat: geo.lat, lon: geo.lon, cat }), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 25000))]);
      if (r && Array.isArray(r.list) && r.list.length) {
        const list = toPlaces(r.list.map(x => ({ lat: x.lat, lon: x.lon, tags: x.tags })));
        if (list.length) { osmCachePut(key, list); return (osmCache[key] = list); }
      }
      placesDiag = 'сервер: ' + (r.error || 'порожньо') + (r.geoErr ? ', geoapify: ' + r.geoErr : '');
    } catch (e) { placesDiag = 'сервер: ' + e.message; }
  }
  const ctrls = OVERPASS.map(() => new AbortController());
  const tryOne = async (url, i) => {
    const t = setTimeout(() => ctrls[i].abort(), 18000);
    try {
      const r = await fetch(url, { method: 'POST', signal: ctrls[i].signal, body: 'data=' + encodeURIComponent(query), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (!r.ok) throw new Error('http');
      const j = await r.json();
      if (!j || !Array.isArray(j.elements)) throw new Error('bad');
      return j;
    } finally { clearTimeout(t); }
  };
  let j;
  try {
    j = await Promise.any(OVERPASS.map((u, i) => new Promise(res => setTimeout(res, i * 600)).then(() => tryOne(u, i))));
  } catch (e) { throw new Error('osm'); }
  finally { ctrls.forEach(c => { try { c.abort(); } catch (e) {} }); }
  const list = toPlaces((j.elements || []).map(e => ({ lat: e.lat ?? e.center?.lat, lon: e.lon ?? e.center?.lon, tags: e.tags || {} })));
  if (list.length) osmCachePut(key, list);
  return (osmCache[key] = list);
}
function toPlaces(items) {
  const seen = new Set();
  return items.map(e => {
    const t = e.tags || {}, [cl, ic] = TAGCAT(t), lat = e.lat, lon = e.lon;
    const addr = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(', ');
    const extra = [t.cuisine && 'кухня: ' + t.cuisine.replace(/;/g, ', '), t.opening_hours && 'години: ' + t.opening_hours, t.description].filter(Boolean).join(' · ');
    return { name: t['name:uk'] || t.name, cat: cl, ic, addr, extra, lat, lon, web: t.website || t['contact:website'] || '', wikidata: t.wikidata || '', commons: t.wikimedia_commons || '', image: t.image || '' };
  }).filter(p => p.name && p.lat && !seen.has(p.name.toLowerCase()) && seen.add(p.name.toLowerCase()));
}
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
async function aiPick(cands, city, wish) {
  const list = cands.slice(0, 70);
  const r = await Promise.race([
    api('ai-places', { city, wish, cands: list.map(p => ({ name: p.name, cat: p.cat, extra: p.extra })) }),
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 32000))
  ]);
  if (r.error) throw new Error(r.error);
  return (r.picks || []).filter(x => list[x.n]).map(x => ({ ...list[x.n], why: x.why }));
}
/* ---- фото: Вікідані / Wikimedia Commons; якщо фото немає — мінікарта ---- */
function mapThumbHTML(lat, lon) {
  const z = 16, n = 2 ** z, xf = (lon + 180) / 360 * n, yf = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n;
  const x = Math.floor(xf), y = Math.floor(yf), px = (xf - x) * 256, py = (yf - y) * 256;
  let tiles = '';
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++)
    tiles += `<img alt="" loading="lazy" src="https://tile.openstreetmap.org/${z}/${x + dx}/${y + dy}.png" style="left:${(dx + 1) * 256}px;top:${(dy + 1) * 256}px" onerror="this.remove()">`;
  return `<div class="mt" style="left:calc(50% - ${(256 + px).toFixed(0)}px);top:calc(50% - ${(256 + py).toFixed(0)}px)">${tiles}</div><span class="pin">📍</span>`;
}
const commonsURL = f => 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(String(f).replace(/^File:/i, '')) + '?width=640';
async function loadPhotos(list, run) {
  if (ONLINE) {
    // через сервер: фото з Вікіданих / Commons, а де фото немає — гарна мінікарта
    try {
      const r = await api('photos', { items: list.map(p => ({ lat: p.lat, lon: p.lon, wikidata: p.wikidata, commons: p.commons, image: p.image })) });
      (r.photos || []).forEach((u, i) => {
        if (u) setPhoto(i, u.replace(/^near:/, ''), run, u.startsWith('near:'));
        else if (r.map) setPhoto(i, CFG.API_URL + '?map=' + list[i].lat.toFixed(5) + ',' + list[i].lon.toFixed(5), run, false, true);
      });
      return;
    } catch (e) { /* пробуємо напряму */ }
  }
  const has = new Set();
  list.forEach((p, i) => {
    let src = '';
    if (/^https:\/\/.+\.(jpe?g|png|webp)(\?.*)?$/i.test(p.image)) src = p.image;
    else if (/^File:/i.test(p.commons)) src = commonsURL(p.commons);
    if (src) { has.add(i); setPhoto(i, src, run); }
  });
  const ids = [...new Set(list.filter((p, i) => !has.has(i) && /^Q\d+$/.test(p.wikidata)).map(p => p.wikidata))];
  if (ids.length) {
    try {
      const r = await fetchT(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.slice(0, 50).join('|')}&props=claims&format=json&origin=*`, {}, 8000);
      const j = await r.json();
      list.forEach((p, i) => { const f = j.entities?.[p.wikidata]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value; if (f) { has.add(i); setPhoto(i, commonsURL(f), run); } });
    } catch (e) {}
  }
  await Promise.all(list.map(async (p, i) => {
    if (has.has(i) || run !== finderRun) return;
    try {
      const r = await fetchT(`https://commons.wikimedia.org/w/api.php?action=query&list=geosearch&gscoord=${p.lat}|${p.lon}&gsradius=100&gsnamespace=6&gslimit=6&format=json&origin=*`, {}, 7000);
      const j = await r.json();
      const f = (j.query?.geosearch || []).find(x => /\.(jpe?g|png|webp)$/i.test(x.title));
      if (f) setPhoto(i, commonsURL(f.title), run, true);
    } catch (e) {}
  }));
}
function setPhoto(i, src, run, near, isMap) {
  if (run !== finderRun) return;
  const box = document.getElementById('ph' + i); if (!box) return;
  const img = new Image();
  img.onload = () => { if (run !== finderRun) return; box.innerHTML = near ? '<span class="ph-note">📷 фото поруч</span>' : ''; box.classList.add('photo'); box.classList.toggle('is-map', !!isMap); box.style.backgroundImage = `url("${src.replace(/"/g, '%22')}")`; };
  img.src = src;
}
/* ---- відстань: від центру міста, від мене або від адреси ---- */
function distKm(a, b) {
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLon = (b.lon - a.lon) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
const fmtDist = km => km < 1 ? Math.max(50, Math.round(km * 1000 / 50) * 50) + ' м' : (km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)) + ' км';
function getFrom() { try { return JSON.parse(localStorage.getItem('fromPt')) || { type: 'center' }; } catch (e) { return { type: 'center' }; } }
function setFrom(f) { try { localStorage.setItem('fromPt', JSON.stringify(f)); } catch (e) {} renderFrom(); }
function renderFrom() {
  const el = document.getElementById('fFrom'); if (!el) return;
  const f = getFrom();
  el.innerHTML = `<div class="lbl" style="margin:0 0 6px">Відстань рахувати від</div><div class="chips" style="margin-bottom:6px">
    <button class="chip ${f.type === 'center' ? 'on' : ''}" data-f="center">📍 Центр міста</button>
    <button class="chip ${f.type === 'me' ? 'on' : ''}" data-f="me">🧭 Де я зараз</button>
    <button class="chip ${f.type === 'addr' ? 'on' : ''}" data-f="addr">🏠 ${f.type === 'addr' && f.label ? esc(f.label.slice(0, 22)) : 'Адреса'}</button></div>
    ${f.type === 'addr' && !f.lat ? `<div class="addline"><input id="fAddr" maxlength="100" placeholder="Вулиця, будинок" value="${esc(f.q || '')}"><button class="btn" id="fAddrOk">OK</button></div>` : ''}`;
  el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => {
    const t = b.dataset.f;
    if (t === 'center') setFrom({ type: 'center' });
    else if (t === 'me') locateMe();
    else setFrom({ type: 'addr' });
  });
  const ok = document.getElementById('fAddrOk');
  if (ok) {
    const go = async () => {
      const q = document.getElementById('fAddr').value.trim(); if (!q) return;
      const city = (document.getElementById('fCity') || {}).value || S.city || '';
      try {
        const r = await fetchT('https://photon.komoot.io/api/?limit=1&q=' + encodeURIComponent(q + (city ? ', ' + city : '')), {}, 7000);
        const f = ((await r.json()).features || [])[0];
        if (!f) return toast('Адресу не знайдено 🤔');
        const [lon, lat] = f.geometry.coordinates;
        setFrom({ type: 'addr', q, label: q, lat, lon }); toast('Відстань рахую від: ' + q);
      } catch (e) { toast('Не вдалося знайти адресу'); }
    };
    ok.onclick = go;
    document.getElementById('fAddr').onkeydown = e => { if (e.key === 'Enter') go(); };
  }
}
function locateMe() {
  const done = (lat, lon) => { setFrom({ type: 'me', lat, lon }); toast('Відстань рахую від вас 🧭'); };
  const fail = () => toast('Не вдалося визначити місце — дозвольте доступ до геолокації');
  try {
    const lm = tg && tg.LocationManager;
    if (inTG && lm && tg.isVersionAtLeast('8.0')) {
      const ask = () => lm.getLocation(loc => loc ? done(loc.latitude, loc.longitude) : (lm.isAccessGranted === false ? lm.openSettings() : fail()));
      return lm.isInited ? ask() : lm.init(ask);
    }
  } catch (e) {}
  if (navigator.geolocation) navigator.geolocation.getCurrentPosition(p => done(p.coords.latitude, p.coords.longitude), fail, { timeout: 10000 });
  else fail();
}
function fromPoint(geo) { const f = getFrom(); return f.lat && f.type !== 'center' ? { lat: f.lat, lon: f.lon } : { lat: geo.lat, lon: geo.lon }; }

function openFinder(random) {
  openSheet(`<h3>✨ Ідеї в місті</h3>
    <div class="field ac"><label>Місто</label><input id="fCity" maxlength="60" autocomplete="off" placeholder="Почніть вводити: Льв..." value="${esc(S.city)}"><div class="ac-list" id="fCityList"></div></div>
    <div class="chips" id="fCats">${Object.entries(CATS).map(([k, c]) => `<button class="chip ${k === finderCat ? 'on' : ''}" data-c="${k}">${c.l}</button>`).join('')}</div>
    <div id="fFrom"></div>
    ${ONLINE ? `<div class="field"><label>Що хочеться? (AI підбере)</label><input id="fWish" maxlength="120" placeholder="Затишно й недорого, щоб поговорити..."></div>`
      : `<div class="hint">💡 Після підключення сервера AI підбиратиме місця під ваш настрій і пояснюватиме, чому туди варто піти.</div>`}
    <div class="acts" style="margin-bottom:14px"><button class="btn ghost" id="fRand">🎲 Випадкове</button><button class="btn" id="fGo">🔎 Шукати</button></div>
    <div id="fRes"></div>`);
  document.querySelectorAll('#fCats .chip').forEach(b => b.onclick = () => { finderCat = b.dataset.c; document.querySelectorAll('#fCats .chip').forEach(x => x.classList.toggle('on', x === b)); haptic(); });
  document.getElementById('fGo').onclick = () => runFinder(false);
  document.getElementById('fRand').onclick = () => runFinder(true);
  const ci = document.getElementById('fCity');
  ci.oninput = () => { clearTimeout(cityTimer); cityTimer = setTimeout(() => citySuggest(ci.value), 300); };
  ci.onkeydown = e => { if (e.key === 'Enter') { document.getElementById('fCityList').innerHTML = ''; runFinder(false); } };
  renderFrom();
  if (random && S.city) runFinder(true);
}
let finderRun = 0;
async function runFinder(random) {
  const city = document.getElementById('fCity').value.trim(), out = document.getElementById('fRes');
  const list0 = document.getElementById('fCityList'); if (list0) list0.innerHTML = '';
  if (!city) return toast('Вкажіть місто');
  if (city !== S.city) { S.city = city; if (S.cityGeo && S.cityGeo.name !== city) S.cityGeo = null; save(); }
  const wishEl = document.getElementById('fWish'), wish = wishEl ? wishEl.value.trim() : '';
  const run = ++finderRun;
  const goBtn = document.getElementById('fGo'); if (goBtn) goBtn.disabled = true;
  const done = () => { const b = document.getElementById('fGo'); if (b) b.disabled = false; };
  out.innerHTML = `<div class="loading"><i>🐾</i> Шукаю місця в ${esc(city)}...<br><small>зазвичай до 10 секунд</small></div>`;
  let geo, cands;
  try { geo = await geocode(city); cands = await osmPlaces(geo, finderCat); }
  catch (e) {
    if (run !== finderRun) return; done();
    out.innerHTML = `<div class="empty">${e.message === 'nocity' ? 'Не знайшов таке місто 🤔 Почніть вводити назву й оберіть зі списку.' : e.message === 'geo' ? 'Не вдалося знайти місто на карті — перевірте інтернет і спробуйте ще раз.' : 'Сервери карт зараз перевантажені. Спробуйте ще раз за хвилину.' + (placesDiag ? `<br><small style="opacity:.6">${esc(placesDiag)}</small>` : '') + (inTG ? '' : '<br><small>У попередньому перегляді інтернет-запити заблоковані — це запрацює в Telegram.</small>')}</div><button class="btn ghost" style="width:100%" onclick="runFinder(${random})">↻ Спробувати ще раз</button>`;
    return;
  }
  if (run !== finderRun) return;
  const mine = new Set(S.places.map(p => p.title.toLowerCase()));
  const from = fromPoint(geo);
  cands = shuffle(cands.filter(p => !mine.has(p.name.toLowerCase()))).map(p => ({ ...p, km: distKm(from, p) }));
  if (!cands.length) { done(); out.innerHTML = `<div class="empty">У цій категорії поруч нічого не знайшов. Спробуйте «✨ Усе».</div>`; return; }
  let res, aiNote = '';
  if (random) res = cands.slice(0, 1);
  else if (ONLINE) {
    out.innerHTML = `<div class="loading"><i>✨</i> AI обирає найкраще з ${cands.length} місць...<br><small>зазвичай 5–15 секунд</small></div>`;
    // місця з фото — першими в списку для AI
    const ordered = [...cands].sort((a, b) => a.km - b.km).map(p => ({ ...p, extra: [p.extra, '~' + fmtDist(p.km) + ' від нас'].filter(Boolean).join(' · ') }));
    try { res = await aiPick(ordered, geo.name, wish); }
    catch (e) {
      const why = { limit: 'ліміт AI на сьогодні вичерпано', timeout: 'AI думав надто довго', bad_key: 'ключ Gemini на сервері не підходить', no_key: 'на сервері немає ключа Gemini' }[e.message] || 'AI зараз не відповідає';
      aiNote = `${why[0].toUpperCase() + why.slice(1)} — показую випадкові місця.`;
    }
    if (run !== finderRun) return;
    if (!res || !res.length) res = cands.slice(0, 8);
  } else res = cands.slice(0, 8);
  done();
  finderRes = res; haptic('medium');
  const gq = p => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.name + (p.addr ? ', ' + p.addr : '') + ', ' + city);
  out.innerHTML = (aiNote ? `<div class="hint">${aiNote}</div>` : '') + `<div class="lbl">📍 ${esc(geo.name)} · ${random ? 'жереб обрав' : 'знайдено ' + cands.length}</div>` +
    res.map((p, i) => `<div class="res"><div class="res-ph" id="ph${i}">${mapThumbHTML(p.lat, p.lon)}</div>
      <div class="cat">${p.ic} ${esc(p.cat)}</div><div class="tt">${esc(p.name)}${isFinite(p.km) ? ` <span class="dist">(${fmtDist(p.km)})</span>` : ''}</div>${(() => { const ex = (p.extra || '').replace(/(^| · )~[^·]+ від нас$/, ''); return p.addr || ex ? `<div class="ds">${esc([p.addr, ex].filter(Boolean).join(' · '))}</div>` : ''; })()}${p.why ? `<div class="why">✨ ${esc(p.why)}</div>` : ''}
      <div class="rb"><button class="btn sm" id="fa${i}" onclick="addFound(${i})">+ До наших</button><a class="btn ghost sm" style="text-decoration:none" href="${gq(p)}" target="_blank" rel="noopener" onclick="return openLink(this.href)">📷 Фото й відгуки</a></div></div>`).join('') +
    (random ? `<button class="btn ghost" style="width:100%" onclick="runFinder(true)">🎲 Ще раз</button>` : '') +
    `<p class="sub" style="text-align:center;font-size:11.5px;margin-top:10px">Дані й карти: © учасники OpenStreetMap · фото: Wikimedia Commons</p>`;
  loadPhotos(res, run);
}
function addFound(i) {
  const p = finderRes[i]; if (!p) return;
  if (S.places.some(x => x.title.toLowerCase() === p.name.toLowerCase())) return toast('Це місце вже є у ваших');
  S.places.push({ id: uid(), cat: p.cat, title: p.name, desc: p.why || [p.addr, p.extra].filter(Boolean).join(' · '), kind: 'spont', visited: false, lat: p.lat, lon: p.lon });
  save(); haptic('medium'); toast('Додано до ваших місць 📍');
  const b = document.getElementById('fa' + i); if (b) { b.textContent = '✓ Додано'; b.disabled = true; b.classList.add('ghost'); }
  if (tab === 'places') document.getElementById('placeList').innerHTML = placeListHTML();
}

/* ===== Дім ===== */
function homeAdd() { if (homeSeg === 'shop') formSheet('Додати покупку', [{ k: 'title', l: 'Що купити' }], v => { S.shop.unshift({ id: uid(), title: v.title, done: false, kind: shopKind }); }); else if (homeSeg === 'tasks') addTask(); else addRecipe(); }
function addShop(t) {
  t = (t || '').trim(); if (!t) { const i = document.getElementById('shopIn'); if (i) i.focus(); toast('Напишіть, що купити ✍️'); return; }
  if (S.shop.some(s => !s.done && s.title.toLowerCase() === t.toLowerCase())) { toast('«' + t + '» вже є у списку'); return; }
  S.shop.unshift({ id: uid(), title: t.slice(0, 80), done: false, kind: shopKind });
  const inp = document.getElementById('shopIn'); if (inp) inp.value = '';
  save(); render(); haptic();
  const i = document.getElementById('shopIn'); i && i.focus();
}
const REPEAT = { week: 'щотижня', '2week': 'раз на 2 тижні', month: 'щомісяця' };
function nextRepeat(date, rep) {
  const d = parseD(validDate(date) ? date : today());
  if (rep === 'week') d.setDate(d.getDate() + 7); else if (rep === '2week') d.setDate(d.getDate() + 14);
  else if (rep === 'month') { const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + 1); d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); }
  let s = ymd(d); while (s < today()) s = nextRepeat(s, rep);
  return s;
}
function toggle(list, id) {
  const x = S[list].find(i => i.id === id); if (!x) return;
  if (list === 'tasks' && x.repeat && !x.done) {
    x.date = nextRepeat(x.date, x.repeat); x.seen = [S.me];
    save(); render(); haptic('medium'); toast('Готово ✓ Наступного разу: ' + fmtS(x.date, false)); return;
  }
  x.done = !x.done; save(); render(); haptic();
}
function addTask(t) {
  formSheet(t ? 'Редагувати справу' : 'Нова справа', [{ k: 'title', l: 'Що зробити', v: t?.title }, { k: 'date', l: 'Коли (необов’язково)', type: 'date', v: t?.date, req: false },
    { k: 'repeat', l: 'Повторювати', type: 'select', v: t?.repeat || '', opts: [['', 'Не повторювати'], ...Object.entries(REPEAT)] }],
    v => { if (v.repeat && !v.date) v.date = today(); if (t) Object.assign(t, v); else S.tasks.push({ id: uid(), title: v.title, date: v.date, repeat: v.repeat, done: false }); });
}
function taskMenu(id) { const t = S.tasks.find(x => x.id === id); itemMenu('tasks', id, [['✎ Редагувати', () => { addTask(t); return 'keep'; }]]); }
function addRecipe(r) { formSheet(r ? 'Редагувати рецепт' : 'Новий рецепт', [{ k: 'title', l: 'Назва страви', v: r?.title }, { k: 'desc', l: 'Інгредієнти / посилання', type: 'textarea', v: r?.desc, req: false }], v => { if (r) Object.assign(r, v); else S.recipes.push({ id: uid(), ...v }); }); }
function recipeMenu(id) { const r = S.recipes.find(x => x.id === id); itemMenu('recipes', id, [['✎ Редагувати', () => { addRecipe(r); return 'keep'; }]]); }
function randomRecipe() { if (!S.recipes.length) return toast('Додайте рецепти'); const r = pick(S.recipes); openSheet(`<h3>Сьогодні готуємо 🍳</h3><div class="reveal"><div class="big">${esc(r.title)}</div><div class="sub" style="margin:0">${esc(r.desc)}</div></div><div class="acts" style="margin-top:14px"><button class="btn ghost" onclick="randomRecipe()">Інше</button><button class="btn" onclick="closeSheet()">Готуємо!</button></div>`); }

/* ===== Вішлист ===== */
/* посилання в записі: окреме поле url або перше посилання з опису (старі записи) */
const URL_RE = /https?:\/\/[^\s<>"']+/i;
const linkOf = o => o.url || ((o.desc || '').match(URL_RE) || [])[0] || '';
const cleanDesc = o => (o.desc || '').replace(URL_RE, '').replace(/\s{2,}/g, ' ').trim();
function siteOf(o) { if (o.site) return o.site; try { return new URL(linkOf(o)).hostname.replace(/^www\./, ''); } catch (e) { return 'посилання'; } }
async function fetchPreview(item) {
  const url = linkOf(item); if (!url || !ONLINE) return;
  item.loading = true; render();
  try {
    const r = await Promise.race([api('preview', { url }), new Promise((_, rej) => setTimeout(() => rej(new Error('t')), 12000))]);
    const x = S.wish.find(o => o.id === item.id) || S.places.find(o => o.id === item.id) || item;
    if (r.image) x.img = r.image;
    if (r.price && !x.price) x.price = r.price;
    if (r.site) x.site = r.site;
    if (r.title && (!x.title || x.title === x.site || x.autoTitle)) { x.title = r.title.slice(0, 100); delete x.autoTitle; }
    delete x.loading; save(); render();
    if (!r.image && !r.title) toast('Магазин не віддав фото — додано лише посилання');
  } catch (e) { const x = S.wish.find(o => o.id === item.id) || item; delete x.loading; save(); render(); }
}
function addWish(w) {
  const seg = w ? w.seg : wishSeg;
  const t = { gift: 'Хочу в подарунок', watch: 'Хочу подивитися', dream: 'Наша мрія' }[seg];
  formSheet(w ? 'Редагувати' : t, [
    { k: 'url', l: '🔗 Посилання на товар (необов’язково)', v: w ? linkOf(w) : '', ph: 'https://…', req: false, maxlen: 800 },
    { k: 'title', l: 'Що саме' + (w ? '' : ' (можна не писати — візьму з посилання)'), v: w?.title, req: false },
    { k: 'desc', l: 'Деталі: розмір, колір…', type: 'textarea', v: w ? cleanDesc(w) : '', req: false }
  ], v => {
    const url = (v.url.match(URL_RE) || [])[0] || '';
    if (v.url && !url) return 'Посилання має починатися з https://';
    if (!v.title && !url) return 'Напишіть, що саме, або вставте посилання';
    let site = ''; try { site = url ? new URL(url).hostname.replace(/^www\./, '') : ''; } catch (e) {}
    const changedUrl = w ? url !== linkOf(w) : !!url;
    const o = { title: v.title || site || 'Посилання', desc: v.desc, url, site, autoTitle: !v.title };
    let item;
    if (w) { Object.assign(w, o); if (changedUrl) { delete w.img; delete w.price; } item = w; }
    else { item = { id: uid(), seg, owner: S.me, done: false, reservedBy: null, ...o }; S.wish.push(item); if (seg === 'gift') wishWho = S.me; }
    if (url && changedUrl) setTimeout(() => fetchPreview(item), 50);
  });
}
function wishMenu(id) {
  const w = S.wish.find(x => x.id === id), extra = [[w.done ? '↩︎ Ще не здійснилось' : '✓ Здійснилось!', () => { w.done = !w.done; }]];
  if (w.seg === 'gift' && w.owner !== S.me) extra.unshift([w.reservedBy === S.me ? '✕ Я більше не готую' : '🔒 Я готую цей подарунок', () => { w.reservedBy = w.reservedBy === S.me ? null : S.me; }]);
  if (w.owner === S.me || w.seg !== 'gift') extra.push(['✎ Редагувати', () => { addWish(w); return 'keep'; }]);
  itemMenu('wish', id, extra);
}

/* ===== Ще ===== */
/* ===== Скарбнички (кілька цілей одночасно) ===== */
const CUR = {
  UAH: { s: '₴', l: '₴ Гривня', before: false },
  PLN: { s: 'zł', l: 'zł Злотий', before: false },
  USD: { s: '$', l: '$ Долар', before: true },
  EUR: { s: '€', l: '€ Євро', before: false }
};
function cur(n, c) { const x = CUR[c] || CUR.UAH; return x.before ? (n < 0 ? '−' : '') + x.s + money(Math.abs(n)) : money(n) + ' ' + x.s; }
const GOAL_EMOJI = ['🐷', '✈️', '🏠', '🚗', '💍', '🎁', '📱', '🛋', '🌴', '🐶', '🎓', '💰'];
const goalSaved = g => Math.round((g.log || []).reduce((s, x) => s + (+x.sum || 0), 0) * 100) / 100;
const goalPct = g => Math.max(0, Math.min(100, Math.round(goalSaved(g) / (g.target || 1) * 100)));
let showDoneGoals = false;
function goalCardHTML(g) {
  const saved = goalSaved(g), pct = goalPct(g), reached = saved >= g.target;
  const by = ['a', 'b'].map(k => [k, (g.log || []).filter(x => x.by === k).reduce((s, x) => s + (+x.sum || 0), 0)]).filter(([, v]) => v > 0);
  const left = Math.max(0, g.target - saved);
  return `<div class="card goal${nw(g)} ${reached ? 'reached' : ''}">
    <div class="goal-top"><div class="goal-em">${esc(g.emoji || '🐷')}</div><div class="goal-tt"><b>${esc(g.title)}</b><small>${reached ? '🎉 Зібрано!' : 'Залишилось ' + cur(left, g.cur)}</small></div><button class="more" onclick="goalMenu('${g.id}')">⋯</button></div>
    <div class="progress"><div style="width:${pct}%"></div></div>
    <div class="goal-sum"><span><b>${cur(saved, g.cur)}</b> з ${cur(g.target, g.cur)}</span><span>${pct}%</span></div>
    ${by.length ? `<div class="goal-by">${by.map(([k, v]) => `<span><span class="mini a-${k}">${ini(S.names[k])}</span>${cur(v, g.cur)}</span>`).join('')}</div>` : ''}
    ${reached
      ? `<div class="goal-btns"><button class="btn" style="flex:1" onclick="finishGoal('${g.id}')">✓ Завершити ціль</button><button class="btn ghost" onclick="moneySheet('${g.id}',1)">+</button></div>`
      : `<div class="goal-btns"><button class="btn" style="flex:1" onclick="moneySheet('${g.id}',1)">+ Поповнити</button><button class="btn ghost" onclick="moneySheet('${g.id}',-1)" ${saved > 0 ? '' : 'disabled style="opacity:.4"'}>− Зняти</button></div>`}
  </div>`;
}
function goalsHTML() {
  const active = S.goals.filter(g => !g.done), done = S.goals.filter(g => g.done);
  const totals = {}; active.forEach(g => { const c = g.cur || 'UAH'; totals[c] = (totals[c] || 0) + goalSaved(g); });
  const totalTxt = Object.entries(totals).filter(([, v]) => v > 0).map(([c, v]) => cur(v, c)).join(' · ') || '0';
  return `<div class="goals-head"><div><div class="lbl" style="margin:0">🐷 Скарбнички</div>${active.length > 1 ? `<small>Разом відкладено: <b>${totalTxt}</b></small>` : ''}</div><button class="btn sm" onclick="editGoal()">+ Нова</button></div>
  ${active.length ? active.map(goalCardHTML).join('') : `<div class="empty" style="margin-bottom:14px">${BEAGLE}Немає активних скарбничок — створіть нову ціль!</div>`}
  ${done.length ? `<button class="link-btn" style="margin:0 auto 14px" onclick="showDoneGoals=!showDoneGoals;render()">✅ Досягнуті цілі (${done.length}) ${showDoneGoals ? '▲' : '▼'}</button>
    ${showDoneGoals ? `<div class="card" style="padding:4px 16px">${done.map(g => `<div class="row"><div class="ic">${esc(g.emoji || '🐷')}</div><div class="tx"><b>${esc(g.title)}</b><small>${cur(goalSaved(g), g.cur)}${g.doneAt ? ' · ' + fmtS(g.doneAt) : ''}</small></div><button class="more" onclick="goalMenu('${g.id}')">⋯</button></div>`).join('')}</div>` : ''}` : ''}`;
}
function moneySheet(id, sign) {
  const g = S.goals.find(x => x.id === id); if (!g) return;
  const saved = goalSaved(g);
  formSheet((sign > 0 ? 'Поповнити: ' : 'Зняти: ') + g.title, [{ k: 'sum', l: 'Сума, ' + (CUR[g.cur] || CUR.UAH).s + (sign < 0 ? ' (є ' + cur(saved, g.cur) + ')' : ''), type: 'number', ph: '100' }], v => {
    const n = Math.round(+v.sum * 100) / 100; if (!(n > 0)) return 'Введіть суму більше нуля';
    if (sign < 0 && n > saved) return 'У скарбничці лише ' + cur(saved, g.cur);
    const wasReached = saved >= g.target;
    g.log = [...(g.log || []), { id: uid(), by: S.me, sum: sign * n, at: Date.now() }];
    if (sign > 0 && !wasReached && goalSaved(g) >= g.target) setTimeout(() => { celebrate(); toast('🎉 Ціль «' + g.title + '» зібрано!'); }, 300);
    else toast(sign > 0 ? '+' + cur(n, g.cur) + ' 🐷' : 'Знято ' + cur(n, g.cur));
  }, sign > 0 ? 'Додати' : 'Зняти');
  const f = document.getElementById('f_sum');
  f.parentElement.insertAdjacentHTML('afterend', `<div class="chips">${(sign > 0 ? [50, 100, 200, 500, 1000] : [50, 100, 200, saved].filter((x, i, a) => x > 0 && x <= saved && a.indexOf(x) === i)).map(x => `<button class="chip" data-v="${x}">${sign > 0 ? '+' : '−'}${cur(x, g.cur)}</button>`).join('')}</div>`);
  document.querySelectorAll('#sheet .chips .chip').forEach(b => b.onclick = () => { f.value = b.dataset.v; haptic(); });
}
function editGoal(g) {
  formSheet(g ? 'Редагувати ціль' : 'Нова скарбничка 🐷', [
    { k: 'title', l: 'На що збираємо', v: g?.title, ph: 'Відпустка, новий диван, подарунок...' },
    { k: 'target', l: 'Потрібна сума', type: 'number', v: g?.target, ph: '10000', req: true },
    { k: 'cur', l: 'Валюта', type: 'select', v: g?.cur || S.lastCur || 'UAH', opts: Object.entries(CUR).map(([k, c]) => [k, c.l]) },
    { k: 'emoji', l: 'Іконка', type: 'select', v: g?.emoji || '🐷', opts: GOAL_EMOJI.map(e => [e, e]) }
  ], v => {
    if (!(+v.target > 0)) return 'Сума має бути більше нуля';
    S.lastCur = v.cur;
    if (g) Object.assign(g, { title: v.title, target: +v.target, emoji: v.emoji, cur: v.cur });
    else S.goals.push({ id: uid(), title: v.title, target: +v.target, emoji: v.emoji, cur: v.cur, log: [], done: false, created: Date.now() });
  }, g ? 'Зберегти' : 'Створити');
}
function finishGoal(id) {
  const g = S.goals.find(x => x.id === id); if (!g) return;
  g.done = true; g.doneAt = today(); save(); render(); celebrate();
  toast('Ціль «' + g.title + '» досягнуто! Вона в «Досягнутих цілях» ✅');
}
function goalMenu(id) {
  const g = S.goals.find(x => x.id === id); if (!g) return;
  const extra = [['📜 Історія поповнень', () => { goalHistory(g); return 'keep'; }], ['✎ Редагувати', () => { editGoal(g); return 'keep'; }]];
  if (g.done) extra.unshift(['↩︎ Повернути в активні', () => { g.done = false; delete g.doneAt; }]);
  else if (goalSaved(g) >= g.target) extra.unshift(['✓ Завершити ціль', () => { finishGoal(g.id); return 'keep'; }]);
  itemMenu('goals', id, extra);
}
function goalHistory(g) {
  const log = [...(g.log || [])].sort((a, b) => (b.at || 0) - (a.at || 0));
  openSheet(`<h3>${esc(g.emoji || '🐷')} ${esc(g.title)}</h3><p class="sub">Зібрано ${cur(goalSaved(g), g.cur)} з ${cur(g.target, g.cur)}</p>
    ${log.length ? `<div class="card" style="padding:4px 16px">${log.map(x => `<div class="row"><span class="mini a-${x.by}">${ini(S.names[x.by])}</span><div class="tx"><b style="color:${x.sum < 0 ? '#D9645A' : 'inherit'}">${x.sum > 0 ? '+' : '−'}${cur(Math.abs(x.sum), g.cur)}</b><small>${esc(S.names[x.by] || '')} · ${new Date(x.at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</small></div></div>`).join('')}</div>` : '<div class="empty">Поповнень ще не було.</div>'}
    <button class="btn" style="width:100%;margin-top:12px" onclick="closeSheet()">Закрити</button>`);
}
function openCalendar() {
  const t0 = today();
  const items = [
    ...S.events.map(e => ({ d: ymd(nextOccurrence(e.date, e.yearly)), t: (e.emoji || '🎉') + ' ' + e.title })),
    ...S.tasks.filter(t => t.date && !t.done).map(t => ({ d: t.date, t: '🔁 ' + t.title })),
    ...S.trips.filter(t => t.date).map(t => ({ d: t.date, t: '🧳 ' + (t.title || 'Поїздка') })),
    ...S.kidEvents.filter(e => e.date && !e.done).map(e => ({ d: e.date, t: (KID_TYPE[e.type]?.[0] || '👶') + ' ' + ((S.kids.find(k => k.id === e.kidId) || {}).name || '') + ': ' + e.title + (e.time ? ' · ' + e.time : '') })),
    ...S.petEvents.filter(e => e.date && !e.done).map(e => ({ d: e.date, t: '🐾 ' + ((S.pets.find(p => p.id === e.petId) || {}).name || '') + ': ' + e.title + (e.time ? ' · ' + e.time : '') }))
  ].filter(x => x.d >= t0).sort((a, b) => a.d.localeCompare(b.d));
  openSheet(`<h3>Календар 📅</h3>${items.length ? `<div class="card" style="padding:4px 16px">${items.map(x => `<div class="row"><div class="tx"><b>${esc(x.t)}</b><small>${fmtS(x.d)}</small></div><span class="pill">${x.d === t0 ? 'сьогодні' : 'через ' + daysBetween(t0, x.d) + ' дн.'}</span></div>`).join('')}</div>` : '<div class="empty">Подій поки немає. Додайте важливі дати на головній, справи з датою або заплановані поїздки.</div>'}<button class="btn" style="width:100%;margin-top:12px" onclick="closeSheet()">Закрити</button>`);
}
function checkin() {
  const qs = ['Що тебе цього тижня найбільше порадувало в мені?', 'Який момент тижня був найкращим для нас?', 'Чого тобі не вистачало цього тижня?', 'Що я можу зробити для тебе наступного тижня?', 'Куди хочеш піти разом найближчим часом?', 'За що ти мені вдячний(-на) цього тижня?'];
  openSheet(`<h3>Чек-ін пари 💞</h3><p class="sub">Поставте одне одному питання й поговоріть.</p><div class="reveal"><div class="big" style="font-size:19px">${pick(qs)}</div></div><div class="acts" style="margin-top:14px"><button class="btn ghost" onclick="checkin()">Інше питання</button><button class="btn" onclick="closeSheet()">Готово</button></div>`);
}
function openSettings() {
  formSheet('Налаштування', [
    { k: 'city', l: 'Ваше місто (для підбору місць)', v: S.city, maxlen: 40, req: false },  { k: 'a', l: 'Ім’я першого', v: S.names.a, maxlen: 20, req: true }, { k: 'b', l: 'Ім’я другої', v: S.names.b, maxlen: 20, req: true },
    ...(ONLINE ? [] : [{ k: 'me', l: 'Хто зараз користується (для тесту)', type: 'select', v: S.me, opts: [['a', S.names.a], ['b', S.names.b]] }])
  ], v => { S.city = v.city; S.names.a = v.a; S.names.b = v.b; if (!ONLINE) S.me = v.me; wishWho = null; });
  if (ONLINE) return;
  document.querySelector('#sheet .acts').insertAdjacentHTML('afterend', '<button class="btn ghost" style="width:100%;margin-top:10px;color:#D9645A" id="resetBtn">Скинути всі дані</button>');
  document.getElementById('resetBtn').onclick = () => confirmSheet('Скинути всі дані? Це не можна скасувати.', 'Скинути', () => { S = migrate(seed()); stamp(S, 'both'); justSeen.clear(); wishWho = null; tab = 'us'; toast('Дані скинуто'); });
}

/* ===== Рендер ===== */
const VIEWS = { us: vUs, places: vPlaces, home: vHome, wish: vWish, more: vMore, dates: vDates, trips: vTrips, pet: () => vPet(), kid: () => vKid() };
function render() {
  document.getElementById('logo').innerHTML = '<img src="img/icon.webp" alt="" class="logo-img">' + APP_NAME;
  document.getElementById('hdrAvs').innerHTML = avatarHTML('a', 'av a') + avatarHTML('b', 'av b');
  seenDirty = false;
  // зберігаємо набраний текст і фокус, якщо екран оновився (напр. партнер щось змінив)
  const keep = [...document.querySelectorAll('#view input[id], #view textarea[id]')].map(el => ({ id: el.id, v: el.value, f: document.activeElement === el, s: el.selectionStart }));
  document.getElementById('view').innerHTML = VIEWS[tab]();
  keep.forEach(k => { const el = document.getElementById(k.id); if (!el || !k.v) return; el.value = k.v; if (k.f) { el.focus(); try { el.setSelectionRange(k.s, k.s); } catch (e) {} } });
  if (seenDirty) { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} if (typeof schedulePush === 'function') schedulePush(); }
  const badges = {
    us: unseen('notes', n => n.from !== S.me) + unseen('surprises', x => x.by !== S.me && !x.done) + unseen('events') + unseen('nudges', x => x.by !== S.me) + ((S.qa && S.qa[today()] && S.qa[today()].a && S.qa[today()].a[other()] && !S.qa[today()].a[S.me]) ? 1 : 0),
    places: unseen('places'), home: unseen('shop') + unseen('tasks') + unseen('recipes'), wish: unseen('wish'), more: unseen('dates') + unseen('trips')
  };
  document.querySelectorAll('nav button').forEach(b => { let el = b.querySelector('.badge'); if (!el) { el = document.createElement('span'); el.className = 'badge'; b.appendChild(el); } const n = badges[b.dataset.tab]; el.textContent = n > 9 ? '9+' : n; el.classList.toggle('show', n > 0); });
  const navTab = SUB[tab] ? (tab === 'dates' || tab === 'trips' ? prevTab : tab) : tab;
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === navTab && !SUB[tab]));
  syncBack();
}
function switchUser() {
  if (ONLINE) return openCouple(); S.me = other(); wishWho = null; justSeen.clear(); save(); render(); window.scrollTo(0, 0); toast('Тепер ви — ' + S.names[S.me] + ' (режим тесту)'); }
setInterval(() => { if (tab === 'us' && !sheetOpen() && S.surprises.some(x => !x.done)) render(); }, 60000);
document.querySelectorAll('nav button').forEach(b => b.onclick = () => { closeSheet(); go(b.dataset.tab); haptic(); });
