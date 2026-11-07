/* ===== Нові можливості: анімації, теми, питання дня, чек-ін тижня, шпаргалка, перші кроки, спогади, ідеї ===== */

/* ---------- Анімації ---------- */
const reducedMotion = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
function heartBurst(x, y, n = 12, chars = ['💛', '❤️', '🧡', '💕', '✨']) {
  if (reducedMotion()) return;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('span');
    el.className = 'hb'; el.textContent = pick(chars);
    const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90;
    el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.fontSize = (14 + Math.random() * 16) + 'px';
    document.body.appendChild(el);
    const dx = Math.cos(a) * d, dy = Math.sin(a) * d - 70;
    const anim = el.animate([
      { transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx * .6}px), calc(-50% + ${dy * .6}px)) scale(1.1)`, opacity: 1, offset: .55 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.9) rotate(${(Math.random() - .5) * 70}deg)`, opacity: 0 }
    ], { duration: 900 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.3,1)' });
    anim.onfinish = () => el.remove();
  }
}
function celebrate() {
  haptic('heavy');
  try {
    if (window.confetti && !reducedMotion()) {
      confetti({ particleCount: 90, spread: 80, startVelocity: 38, origin: { y: .72 }, colors: ['#C8813A', '#E08A7E', '#F4C27A', '#FFFFFF', '#FDE6E4'], disableForReducedMotion: true });
      if (confetti.shapeFromText) {
        const heart = confetti.shapeFromText({ text: '💛', scalar: 2.2 });
        setTimeout(() => confetti({ shapes: [heart], scalar: 2.2, particleCount: 16, spread: 110, origin: { y: .65 }, disableForReducedMotion: true }), 180);
      }
      return;
    }
  } catch (e) {}
  heartBurst(innerWidth / 2, innerHeight * .6, 26);
}

/* ---------- 3D-емодзі Microsoft Fluent (MIT) з резервом на звичайні емодзі ---------- */
const FE_BASE = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/';
function fe(name, emoji, size = 28) {
  const file = name.toLowerCase().replace(/ /g, '_') + '_3d.png';
  return `<img class="fe" width="${size}" height="${size}" alt="${emoji}" loading="lazy" src="${FE_BASE}${encodeURIComponent(name)}/3D/${file}" onerror="this.outerHTML='<span class=&quot;fe-fb&quot; style=&quot;font-size:${Math.round(size * .8)}px&quot;>${emoji}</span>'">`;
}

/* ---------- Аватарки з фото Telegram ---------- */
function avatarHTML(slot, cls) {
  const ph = S.photos && S.photos[slot];
  return `<div class="${cls}">${ini(S.names[slot])}${ph ? `<img src="${esc(ph)}" alt="" onerror="this.remove()">` : ''}</div>`;
}

/* ---------- Теми оформлення (на кожному телефоні своя) ---------- */
const THEMES = { glass: '🫧 Скло', glassdark: '🔮 Скло ніч', autumn: '🍂 Осінь', lavender: '💜 Лаванда', winter: '❄️ Зима', spring: '🌸 Весна', night: '🌙 Ніч' };
function getTheme() { try { return localStorage.getItem('theme') || (tg && tg.colorScheme === 'dark' ? 'night' : 'autumn'); } catch (e) { return 'autumn'; } }
function applyTheme(t = getTheme()) {
  document.documentElement.dataset.theme = t;
  // Telegram для ПК (Windows/Linux) має старий вбудований браузер, який погано малює розмиття — там скло без blur
  try { document.documentElement.classList.toggle('noblur', !!(tg && /^(tdesktop|unigram)$/.test(tg.platform))); } catch (e) {}
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#FFF8EF';
  try { tg.setHeaderColor(bg); tg.setBackgroundColor(bg); tg.setBottomBarColor && tg.setBottomBarColor(bg); } catch (e) {}
}
function openThemes() {
  openSheet(`<h3>Оформлення ✨</h3><p class="sub">Тема змінюється лише на твоєму телефоні.</p>
    <div class="themes">${Object.entries(THEMES).map(([k, v]) => `<button class="theme-card ${getTheme() === k ? 'on' : ''}" data-t="${k}"><span class="sw ${k}"><i></i><i></i><i></i></span>${v}</button>`).join('')}</div>
    <button class="btn" style="width:100%;margin-top:14px" onclick="closeSheet()">Готово</button>`);
  document.querySelectorAll('.theme-card').forEach(b => b.onclick = () => {
    try { localStorage.setItem('theme', b.dataset.t); } catch (e) {}
    applyTheme(b.dataset.t); haptic();
    document.querySelectorAll('.theme-card').forEach(x => x.classList.toggle('on', x === b));
    render();
  });
}

/* ---------- Думаю про тебе ---------- */
let lastNudge = 0;
function nudge(ev) {
  const r = ev && ev.currentTarget ? ev.currentTarget.getBoundingClientRect() : null;
  heartBurst(r ? r.left + r.width / 2 : innerWidth / 2, r ? r.top + r.height / 2 : 200, 14);
  haptic('medium');
  if (Date.now() - lastNudge < 8000) return;
  lastNudge = Date.now();
  S.nudges = (S.nudges || []).slice(-29);
  S.nudges.push({ id: uid(), at: Date.now() });
  save();
  if (ONLINE) api('nudge').catch(() => {});
  toast(S.names[other()] + ' отримає твоє «думаю про тебе» 💛');
}
function openNudges() {
  (S.nudges || []).forEach(see); save(); render();
  heartBurst(innerWidth / 2, 160, 22);
}

/* ---------- Питання дня ---------- */
function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const qPool = (exclude) => {
  const lvl = S.qaLevel || 'mix';
  const all = QBANK.filter(q => lvl === 'mix' || String(q.l) === String(lvl));
  const pool = all.filter(q => !exclude.has(q.i));
  return pool.length ? pool : all;
};
function usedQ() { const u = new Set(); Object.values(S.qa || {}).forEach(x => { u.add(x.q); (x.skip || []).forEach(i => u.add(i)); }); return u; }
function todayQ() {
  const d = today();
  if (S.qa && S.qa[d]) return S.qa[d];
  const pool = qPool(usedQ());
  return { q: pool[hashStr(d + (S.since || '') + (S.names.a || '')) % pool.length].i, a: {} };
}
function qaStreak() {
  const both = k => { const x = S.qa && S.qa[k]; return !!(x && x.a && x.a.a && x.a.b); };
  const d = new Date(); let n = 0;
  if (!both(today())) d.setDate(d.getDate() - 1);
  while (both(ymd(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function qaCardHTML() {
  const x = todayQ(), q = QBANK[x.q] || QBANK[0], me = S.me, o = other(), mine = x.a && x.a[me], his = x.a && x.a[o], st = qaStreak();
  let body;
  if (!mine) body = `${his ? `<div class="qa-wait">🔒 ${esc(S.names[o])} вже відповів(-ла) — відповідай, щоб побачити</div>` : ''}
    <textarea id="qaIn" maxlength="500" placeholder="Твоя відповідь..."></textarea>
    <div class="qa-acts"><button class="btn ghost sm" onclick="skipQ()" ${his ? 'disabled' : ''}>↻ Інше питання</button><button class="btn sm" onclick="answerQ()">Відповісти</button></div>`;
  else body = `<div class="qa-ans"><span class="mini a-${me}">${ini(S.names[me])}</span><div>${esc(mine)}</div></div>` +
    (his ? `<div class="qa-ans"><span class="mini a-${o}">${ini(S.names[o])}</span><div>${esc(his)}</div></div>`
         : `<div class="qa-wait">⏳ Чекаємо відповідь ${esc(S.names[o])} — вона відкриється вам обом</div>`);
  return `<div class="card qa" id="qaCard">
    <div class="qa-top"><div class="lbl" style="margin:0">❓ Питання дня · ${QLEVELS[q.l]}</div>${st ? `<span class="pill">🔥 ${st} ${plural(st, 'день', 'дні', 'днів')} поспіль</span>` : ''}</div>
    <div class="qa-q">${esc(q.q)}</div>${body}
    <button class="link-btn" onclick="openQaHistory()">Усі наші відповіді та рівень питань ›</button></div>`;
}
function answerQ() {
  const el = document.getElementById('qaIn'), t = el ? el.value.trim() : '';
  if (!t) return toast('Напиши відповідь 🙂');
  const d = today(), x = todayQ();
  S.qa = S.qa || {};
  S.qa[d] = { ...x, a: { ...(x.a || {}), [S.me]: t } };
  save(); render();
  if (S.qa[d].a[other()]) { celebrate(); toast('Тепер ви бачите відповіді одне одного 💛'); }
  else toast('Збережено! Чекаємо відповідь ' + S.names[other()]);
}
function skipQ() {
  const d = today(), x = todayQ();
  if (x.a && Object.keys(x.a).length) return;
  const ex = usedQ(); ex.add(x.q); (x.skip || []).forEach(i => ex.add(i));
  const q = pick(qPool(ex));
  S.qa = S.qa || {};
  S.qa[d] = { q: q.i, a: {}, skip: [...(x.skip || []), x.q] };
  save(); render(); haptic();
}
function openQaHistory() {
  const lvl = S.qaLevel || 'mix', me = S.me, o = other();
  const days = Object.entries(S.qa || {}).filter(([, x]) => x.a && Object.keys(x.a).length).sort((a, b) => b[0].localeCompare(a[0]));
  openSheet(`<h3>Наші відповіді 💬</h3>
    <div class="lbl">Рівень питань дня</div>
    <div class="chips" id="qLvl">${[['mix', '🎲 Різні'], ...Object.entries(QLEVELS)].map(([k, v]) => `<button class="chip ${String(lvl) === String(k) ? 'on' : ''}" data-l="${k}">${v}</button>`).join('')}</div>
    ${days.length ? days.map(([d, x]) => {
      const q = QBANK[x.q] || QBANK[0], mine = x.a[me], his = x.a[o];
      return `<div class="res"><div class="cat">${fmtS(d)}</div><div class="tt" style="font-size:15.5px">${esc(q.q)}</div>
        ${mine ? `<div class="qa-ans"><span class="mini a-${me}">${ini(S.names[me])}</span><div>${esc(mine)}</div></div>` : ''}
        ${his ? (mine ? `<div class="qa-ans"><span class="mini a-${o}">${ini(S.names[o])}</span><div>${esc(his)}</div></div>` : `<div class="qa-wait">🔒 Відповідь ${esc(S.names[o])} прихована — ти не відповів(-ла) того дня</div>`) : ''}</div>`;
    }).join('') : '<div class="empty">Тут з’являться ваші відповіді на питання дня.</div>'}
    <button class="btn" style="width:100%;margin-top:6px" onclick="closeSheet()">Закрити</button>`);
  document.querySelectorAll('#qLvl .chip').forEach(b => b.onclick = () => {
    S.qaLevel = b.dataset.l; save(); haptic();
    document.querySelectorAll('#qLvl .chip').forEach(x => x.classList.toggle('on', x === b));
    toast('З наступного питання — ' + b.textContent);
  });
}
/* Картки для живої розмови (без збереження) */
let deckLvl = 'mix';
function openDeck() {
  const pool = QBANK.filter(q => deckLvl === 'mix' || String(q.l) === deckLvl), q = pick(pool);
  openSheet(`<h3>Картки для розмови 🃏</h3><p class="sub">Тягніть картку й відповідайте вголос — за вечерею чи в дорозі.</p>
    <div class="chips" id="dLvl">${[['mix', '🎲 Різні'], ...Object.entries(QLEVELS)].map(([k, v]) => `<button class="chip ${deckLvl === String(k) ? 'on' : ''}" data-l="${k}">${v}</button>`).join('')}</div>
    <div class="reveal deck-card"><div class="lbl" style="margin:0 0 6px">${QLEVELS[q.l]}</div><div class="big" style="font-size:20px">${esc(q.q)}</div></div>
    <div class="acts" style="margin-top:14px"><button class="btn ghost" onclick="closeSheet()">Досить</button><button class="btn" onclick="openDeck()">Наступна картка</button></div>`);
  document.querySelectorAll('#dLvl .chip').forEach(b => b.onclick = () => { deckLvl = b.dataset.l; openDeck(); });
}

/* ---------- Чек-ін тижня ---------- */
function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear(), w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return y + '-W' + String(w).padStart(2, '0');
}
const WEEKLY_Q = [['best', '🌟 Найкращий момент цього тижня'], ['thanks', '🙏 За що ти вдячний(-на) партнеру'], ['next', '🎯 Чого хочеться наступного тижня']];
function weeklyBannerHTML() {
  const wk = weekKey(), w = (S.weekly || {})[wk] || {}, mine = w[S.me], his = w[other()], dow = new Date().getDay();
  if (!mine && !his && !(dow === 0 || dow >= 5)) return '';
  const sub = !mine ? (his ? `${esc(S.names[other()])} вже відповів(-ла) — твоя черга` : 'Короткі питання одне про одного раз на тиждень')
    : his ? 'Ви обоє відповіли — подивіться відповіді 💞' : `Чекаємо ${esc(S.names[other()])}`;
  return `<button class="week-banner ${!mine && his ? 'hot' : ''}" onclick="openWeekly()"><span class="wi">${fe('Two hearts', '💞', 30)}</span><span><b>Як минув ваш тиждень?</b><small>${sub}</small></span><span class="chev">›</span></button>`;
}
function openWeekly(wk = weekKey()) {
  S.weekly = S.weekly || {};
  const w = S.weekly[wk] || {}, mine = w[S.me], his = w[other()];
  if (!mine && wk === weekKey()) {
    formSheet('Як минув наш тиждень? 💞', [
      { k: 'score', l: 'Оцінка тижня для нас', type: 'select', v: '4', opts: [['5', '❤️❤️❤️❤️❤️ Чудовий'], ['4', '❤️❤️❤️❤️ Добрий'], ['3', '❤️❤️❤️ Нормальний'], ['2', '❤️❤️ Складний'], ['1', '❤️ Важкий']] },
      ...WEEKLY_Q.map(([k, l]) => ({ k, l, type: 'textarea', req: false, maxlen: 400, ph: '' }))
    ], v => {
      if (!v.best && !v.thanks && !v.next) return 'Дай відповідь хоча б на одне питання';
      S.weekly[wk] = { ...(S.weekly[wk] || {}), [S.me]: { score: +v.score, best: v.best, thanks: v.thanks, next: v.next, at: Date.now() } };
      if (S.weekly[wk][other()]) setTimeout(() => { openWeekly(wk); celebrate(); }, 250);
      else toast('Збережено! Відповіді відкриються, коли відповість ' + S.names[other()]);
    }, 'Зберегти');
    return;
  }
  const col = (slot, x) => `<div class="wk-col"><div class="wk-name"><span class="mini a-${slot}">${ini(S.names[slot])}</span>${esc(S.names[slot])} · ${'❤️'.repeat(x.score || 0)}</div>${WEEKLY_Q.map(([k, l]) => x[k] ? `<div class="wk-q">${l}</div><div class="wk-a">${esc(x[k])}</div>` : '').join('')}</div>`;
  openSheet(`<h3>Чек-ін тижня 💞</h3><div class="lbl">${wk.replace('-W', ' · тиждень ')}</div>
    ${mine ? col(S.me, mine) : ''}
    ${his ? (mine ? col(other(), his) : `<div class="qa-wait">🔒 Відповіді ${esc(S.names[other()])} відкриються, коли відповіси ти</div>`) : `<div class="qa-wait">⏳ ${esc(S.names[other()])} ще не відповів(-ла)</div>`}
    <button class="btn" style="width:100%;margin-top:12px" onclick="closeSheet()">Закрити</button>`);
}
function openWeeklyHistory() {
  const weeks = Object.entries(S.weekly || {}).sort((a, b) => b[0].localeCompare(a[0]));
  openSheet(`<h3>Наші тижні 💞</h3>
    <button class="btn" style="width:100%;margin-bottom:12px" onclick="openWeekly()">${(S.weekly || {})[weekKey()]?.[S.me] ? 'Цей тиждень' : '✍️ Пройти чек-ін цього тижня'}</button>
    ${weeks.length ? weeks.map(([k, w]) => `<button class="row" style="width:100%;text-align:left" onclick="openWeekly('${k}')"><div class="ic">💞</div><div class="tx"><b>${k.replace('-W', ' · тиждень ')}</b><small>${['a', 'b'].map(s => w[s] ? esc(S.names[s]) + ' ' + '❤️'.repeat(w[s].score || 0) : '').filter(Boolean).join(' · ')}</small></div>›</button>`).join('') : '<div class="empty">Тут з’являться ваші щотижневі чек-іни.</div>'}
    <button class="btn ghost" style="width:100%;margin-top:10px" onclick="openDeck()">🃏 Картки для розмови</button>`);
}

/* ---------- Шпаргалка «Про мене» ---------- */
function openAbout(slot = other()) {
  S.about = S.about || { a: {}, b: {} };
  const a = S.about[slot] || {}, mine = slot === S.me, filled = ABOUT_FIELDS.filter(([k]) => a[k]);
  openSheet(`<h3>${mine ? 'Про мене 🗒' : 'Шпаргалка: ' + esc(S.names[slot]) + ' 🗒'}</h3>
    <div class="who">${['a', 'b'].map(k => `<button class="${k === slot ? 'on' : ''}" onclick="openAbout('${k}')"><span class="mini ${k}">${ini(S.names[k])}</span>${k === S.me ? 'Про мене' : esc(S.names[k])}</button>`).join('')}</div>
    <p class="sub">${mine ? 'Заповни — партнеру буде легше з подарунками й сюрпризами.' : 'Розміри, смаки й дрібниці — щоб завжди влучати з подарунками.'}</p>
    ${filled.length ? `<div class="card" style="padding:4px 16px">${filled.map(([k, l]) => `<div class="row"><div class="tx"><small>${l}</small><b>${esc(a[k])}</b></div></div>`).join('')}</div>`
      : `<div class="empty">${BEAGLE}${mine ? 'Ще нічого не заповнено.' : esc(S.names[slot]) + ' ще нічого не заповнив(-ла).'}</div>`}
    ${mine ? `<button class="btn" style="width:100%;margin-top:6px" onclick="editAbout()">✎ ${filled.length ? 'Редагувати' : 'Заповнити'}</button>` : ''}`);
}
function editAbout() {
  S.about = S.about || { a: {}, b: {} };
  const a = S.about[S.me] || {};
  formSheet('Про мене 🗒', ABOUT_FIELDS.map(([k, l, ph]) => ({ k, l, v: a[k], ph, req: false, maxlen: 120 })), v => {
    S.about[S.me] = Object.fromEntries(Object.entries(v).filter(([, x]) => x));
    setTimeout(() => openAbout(S.me), 50);
  });
}

/* ---------- Перші кроки ---------- */
const isExample = x => !!(x && (x.example || /\(приклад/.test((x.title || '') + (x.desc || ''))));
function onboardingSteps() {
  const me = S.me;
  const st = [
    ['📍', 'Додайте перше місце', S.places.some(p => !isExample(p)), "go('places')"],
    ['😊', 'Відмітьте настрій', Object.values(S.moods[me] || {}).some(Boolean), "document.querySelector('.moods')?.scrollIntoView({behavior:'smooth',block:'center'})"],
    ['💌', 'Надішліть записку або сюрприз', S.notes.some(n => n.from === me) || S.surprises.some(x => x.by === me), 'addNote()'],
    ['❓', 'Дайте відповідь на питання дня', Object.values(S.qa || {}).some(x => x.a && x.a[me]), "document.getElementById('qaCard')?.scrollIntoView({behavior:'smooth',block:'center'})"],
    ['📆', 'Додайте важливу дату', S.events.length > 0, 'addEvent()']
  ];
  if (ONLINE) st.push(['🔗', 'Перешліть боту посилання', S.places.concat(S.wish).some(x => x.cat === 'З посилання' || /^https?:/.test(x.desc || '')), 'openBotHelp()']);
  return st;
}
function onboardingHTML() {
  S.onb = S.onb || {};
  if (S.onb[S.me]) return '';
  const st = onboardingSteps(), done = st.filter(s => s[2]).length;
  if (done === st.length) { S.onb[S.me] = true; setTimeout(() => { save(); celebrate(); toast('Усі перші кроки пройдено! 🎉'); }, 400); return ''; }
  return `<div class="card onb"><div class="onb-top"><span class="onb-ic">👣</span><div style="flex:1"><b>Перші кроки</b><small>${done} з ${st.length}</small></div><button class="link-btn" style="margin:0" onclick="S.onb[S.me]=true;save();render()">Пропустити</button></div>
    <div class="progress" style="margin:10px 0 4px"><div style="width:${Math.round(done / st.length * 100)}%"></div></div>
    ${st.map(([ic, t, ok, act]) => `<button class="row onb-row ${ok ? 'ok' : ''}" ${ok ? 'disabled' : `onclick="${act}"`}><div class="ic">${ok ? '✅' : ic}</div><div class="tx"><b>${t}</b></div>${ok ? '' : '›'}</button>`).join('')}</div>`;
}
function openBotHelp() {
  const bot = Sync.bot;
  openSheet(`<h3>Пересилайте посилання боту 🔗</h3><p class="sub">Побачили класне кафе, фільм чи подарунок? Перешліть посилання боту — і воно з’явиться в додатку.</p>
    <div class="card" style="padding:4px 16px"><div class="row"><div class="ic">📍</div><div class="tx"><b>Просто посилання</b><small>додасться в «Місця»</small></div></div><div class="row"><div class="ic">🎁</div><div class="tx"><b>«хочу» + посилання</b><small>додасться у твій вішлист</small></div></div></div>
    ${bot ? `<a class="btn" style="display:block;text-align:center;text-decoration:none" href="https://t.me/${esc(bot)}" onclick="try{tg.openTelegramLink(this.href);closeSheet();return false}catch(e){return true}">Відкрити чат із ботом</a>` : ''}`);
}

/* ---------- Цей день у минулому ---------- */
function memoriesHTML() {
  const t = today(), md = t.slice(5), y = +t.slice(0, 4), out = [];
  S.dates.forEach(d => { if (validDate(d.date) && d.date.slice(5) === md && +d.date.slice(0, 4) < y) out.push([+d.date.slice(0, 4), '💛 ' + (d.title || 'побачення')]); });
  S.trips.forEach(d => { if (validDate(d.date) && d.date.slice(5) === md && +d.date.slice(0, 4) < y) out.push([+d.date.slice(0, 4), '🧳 ' + (d.title || 'поїздка')]); });
  if (S.since && S.since.slice(5) === md && +S.since.slice(0, 4) < y) out.push([+S.since.slice(0, 4), '💞 день, коли ви почали зустрічатися']);
  if (S.wedding && S.wedding.slice(5) === md && +S.wedding.slice(0, 4) < y) out.push([+S.wedding.slice(0, 4), '💍 ваше весілля']);
  if (!out.length) return '';
  return `<div class="card memory"><div class="lbl" style="margin:0 0 6px">📸 Цього дня</div>${out.map(([yr, txt]) => { const n = y - yr; return `<div class="mem-row"><b>${n} ${plural(n, 'рік', 'роки', 'років')} тому</b> — ${esc(txt)}</div>`; }).join('')}</div>`;
}

/* ---------- Ідеї побачень ---------- */
let ideaCat = 'all';
function openIdeas() {
  const list = IDEAS.filter(i => ideaCat === 'all' || i.c === ideaCat);
  const have = new Set(S.wish.filter(w => w.seg === 'dream').map(w => w.title));
  openSheet(`<h3>Ідеї побачень 💡</h3>
    <div class="chips" id="iCat">${[['all', '✨ Усі'], ...Object.entries(IDEA_CATS)].map(([k, v]) => `<button class="chip ${ideaCat === k ? 'on' : ''}" data-c="${k}">${v}</button>`).join('')}</div>
    <button class="tile dark" style="width:100%;margin-bottom:12px;min-height:90px" onclick="randomIdea()"><span class="ti">🎲</span><b>Випадкова ідея</b><small>Нехай жереб вирішить</small></button>
    ${list.map(i => `<div class="row"><div class="ic">${IDEA_CATS[i.c].split(' ')[0]}</div><div class="tx"><b>${esc(i.t)}</b></div>${have.has(i.t) ? '<span class="pill">✓</span>' : `<button class="btn ghost sm" onclick="addIdea(${i.i},this)">+ Хочемо</button>`}</div>`).join('')}`);
  document.querySelectorAll('#iCat .chip').forEach(b => b.onclick = () => { ideaCat = b.dataset.c; openIdeas(); });
}
function randomIdea() {
  const list = IDEAS.filter(i => ideaCat === 'all' || i.c === ideaCat), i = pick(list); haptic('medium');
  openSheet(`<h3>Як щодо... 💡</h3><div class="reveal"><div class="lbl" style="margin:0 0 6px">${IDEA_CATS[i.c]}</div><div class="big" style="font-size:20px">${esc(i.t)}</div></div>
    <div class="acts" style="margin-top:14px"><button class="btn ghost" onclick="randomIdea()">Інша</button><button class="btn" onclick="addIdea(${i.i});closeSheet()">+ Хочемо!</button></div>
    <button class="btn ghost" style="width:100%;margin-top:10px" onclick="openIdeas()">‹ Усі ідеї</button>`);
}
function addIdea(i, btn) {
  const idea = IDEAS[i];
  if (S.wish.some(w => w.seg === 'dream' && w.title === idea.t)) return toast('Вже є у ваших мріях');
  S.wish.push({ id: uid(), seg: 'dream', owner: S.me, title: idea.t, desc: '', done: false, reservedBy: null });
  save(); haptic(); toast('Додано у «Вішлист → Мрії» ✨');
  if (btn) btn.outerHTML = '<span class="pill">✓</span>';
}

/* ---------- Питання й відповіді ---------- */
function openFaq() {
  openSheet(`<h3>Часті питання ❓</h3>${FAQ.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
    <button class="btn" style="width:100%;margin-top:12px" onclick="closeSheet()">Закрити</button>`);
}

/* ---------- Наша пара (запрошення, сповіщення) ---------- */
function inviteCardHTML() {
  if (!ONLINE || !Sync.ready || (Sync.members || []).length >= 2) return '';
  return `<div class="card invite-card"><div class="ic-big">${fe('Love letter', '💌', 44)}</div><div style="flex:1"><b>Запроси свою половинку</b><small>Надішли посилання — і все в додатку стане спільним</small></div><button class="btn sm" onclick="shareInvite()">Запросити</button></div>`;
}
function openCouple() {
  const full = (Sync.members || []).length >= 2;
  let notifyOn = true; try { notifyOn = localStorage.getItem('notify') !== '0'; } catch (e) {}
  openSheet(`<h3>Наша пара 💑</h3>
    <div class="couple" style="text-align:center;margin-bottom:10px"><div class="pics">${avatarHTML('a', 'pic a')}<div class="heart">❤️</div>${avatarHTML('b', 'pic b')}</div><h2 style="font-size:20px">${esc(S.names.a)} &amp; ${esc(S.names.b)}</h2></div>
    ${ONLINE ? (full ? '<div class="hint">✅ Ви обоє в додатку — усе синхронізується.</div>' : `<div class="hint">Партнер ще не приєднався. Надішли запрошення:</div><div class="acts" style="margin-bottom:12px"><button class="btn ghost" onclick="copyText(inviteLink(),this)">📋 Копіювати</button><button class="btn" onclick="shareInvite()">Надіслати</button></div>`)
      : '<div class="hint">Зараз додаток працює локально (тестовий режим). Після підключення сервера тут з’явиться запрошення для партнера.</div>'}
    ${ONLINE ? `<button class="row" style="width:100%;text-align:left" id="ntf"><div class="ic">🔔</div><div class="tx"><b>Сповіщення від бота</b><small>${notifyOn ? 'Увімкнено' : 'Вимкнено'}</small></div><span class="switch ${notifyOn ? 'on' : ''}"></span></button>` : ''}
    <button class="row" style="width:100%;text-align:left" onclick="openThemes()"><div class="ic">🎨</div><div class="tx"><b>Оформлення</b><small>${THEMES[getTheme()]}</small></div>›</button>
    <button class="row" style="width:100%;text-align:left" onclick="openSettings()"><div class="ic">⚙️</div><div class="tx"><b>Імена й назва</b><small>Налаштування</small></div>›</button>`);
  const n = document.getElementById('ntf');
  if (n) n.onclick = async () => {
    const want = !notifyOn;
    try { await api('notify', { notify: want }); localStorage.setItem('notify', want ? '1' : '0'); toast(want ? 'Сповіщення увімкнено 🔔' : 'Сповіщення вимкнено 🔕'); openCouple(); }
    catch (e) { toast('Не вдалося змінити — немає зв’язку'); }
  };
}

/* ---------- Резервна копія ---------- */
function backupJSON() {
  const st = typeof stripLocal === 'function' ? stripLocal(S) : JSON.parse(JSON.stringify(S));
  return JSON.stringify({ app: 'nash-app', v: 1, exportedAt: new Date().toISOString(), state: st }, null, 1);
}
function openBackup() {
  const items = ['places', 'shop', 'tasks', 'recipes', 'wish', 'notes', 'events', 'dates', 'trips', 'goals'].reduce((n, k) => n + (S[k] || []).length, 0);
  openSheet(`<h3>Резервна копія 📦</h3>
    <p class="sub">У копії — усі ваші дані: місця, покупки, побачення, скарбнички, записки, відповіді (${items} записів). Зберігайте її в надійному місці: усередині ваші особисті записи.</p>
    ${ONLINE ? `<button class="btn" style="width:100%;margin-bottom:10px" id="bkBot">📨 Надіслати копію мені в чат із ботом</button>` : ''}
    <a class="btn ${ONLINE ? 'ghost' : ''}" style="display:block;text-align:center;text-decoration:none;margin-bottom:10px" id="bkFile" download="nash-backup-${today()}.json" href="#">💾 Завантажити файл</a>
    <button class="btn ghost" style="width:100%;margin-bottom:18px" id="bkCopy">📋 Скопіювати як текст</button>
    <div class="lbl">Відновлення</div>
    <p class="sub" style="font-size:13.5px">Оберіть раніше збережений файл <b>.json</b>. Поточні дані ${ONLINE ? 'у вас обох ' : ''}буде замінено даними з копії.</p>
    <label class="btn ghost" style="display:block;text-align:center;cursor:pointer">📂 Відновити з файлу<input type="file" id="bkIn" accept=".json,application/json" style="display:none"></label>`);
  const fileBtn = document.getElementById('bkFile');
  fileBtn.onclick = () => {
    try { const url = URL.createObjectURL(new Blob([backupJSON()], { type: 'application/json' })); fileBtn.href = url; setTimeout(() => URL.revokeObjectURL(url), 60000); }
    catch (e) { toast('Не вдалося — скористайтесь «Скопіювати»'); return false; }
    if (inTG) toast('Якщо файл не завантажився — надішліть копію в чат із ботом');
    return true;
  };
  document.getElementById('bkCopy').onclick = () => copyText(backupJSON(), document.getElementById('bkCopy'));
  const bot = document.getElementById('bkBot');
  if (bot) bot.onclick = async () => {
    bot.disabled = true; bot.textContent = 'Надсилаю…';
    try { if (Sync.dirty || Sync.pushing) await push(); const r = await api('backup'); if (!r.ok) throw new Error(); toast('Копію надіслано в чат із ботом 📦'); closeSheet(); }
    catch (e) { toast('Не вдалося надіслати — перевірте зв’язок'); bot.disabled = false; bot.textContent = '📨 Надіслати копію мені в чат із ботом'; }
  };
  document.getElementById('bkIn').onchange = e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    if (f.size > 5e6) return toast('Файл завеликий');
    const rd = new FileReader();
    rd.onload = () => {
      let data;
      try { data = JSON.parse(rd.result); } catch (er) { return toast('Це не файл резервної копії 🤔'); }
      if (!data || data.app !== 'nash-app' || !data.state || typeof data.state !== 'object' || !Array.isArray(data.state.places)) return toast('Це не файл резервної копії 🤔');
      const when = data.exportedAt ? new Date(data.exportedAt).toLocaleString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'невідомо';
      confirmSheet(`Відновити копію від ${when}? Поточні дані буде замінено.`, 'Відновити', () => {
        const me = S.me; S = migrate(data.state); stamp(S, 'both'); S.me = me;
        justSeen.clear(); toast('Дані відновлено ✅');
      });
    };
    rd.readAsText(f);
  };
}
