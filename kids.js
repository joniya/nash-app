/* ===== Наші діти: профіль, щеплення, здоров'я, ріст, моменти ===== */
const KID_TYPE = { health: ['🩺', 'Здоров’я', '#E3F1FF'], vax: ['💉', 'Щеплення', '#FDE6E4'], growth: ['📏', 'Ріст', '#E6F4E1'], remind: ['🔔', 'Нагадування', '#FFF3CF'] };
/* Національний календар профілактичних щеплень України (МОЗ, чинний з 01.01.2026).
   Вік у місяцях. Індивідуальний графік завжди узгоджуйте з педіатром. */
const UA_VAX = [
  [0, 'Туберкульоз (БЦЖ)', 'Зазвичай у пологовому'],
  [2, 'Кашлюк, дифтерія, правець + поліомієліт (ІПВ) + Hib + гепатит В — 1 доза', 'Комбінована вакцина'],
  [4, 'Кашлюк, дифтерія, правець + поліомієліт (ІПВ) + Hib + гепатит В — 2 доза', 'Комбінована вакцина'],
  [6, 'Кашлюк, дифтерія, правець + поліомієліт (ІПВ) + Hib + гепатит В — 3 доза', 'Комбінована вакцина'],
  [12, 'Кір, паротит, краснуха (КПК) — 1 доза', ''],
  [18, 'Кашлюк, дифтерія, правець + поліомієліт (ІПВ) + Hib + гепатит В — 4 доза', 'Комбінована вакцина'],
  [48, 'Кір, паротит, краснуха (КПК) — 2 доза', ''],
  [72, 'Дифтерія, правець + поліомієліт (ІПВ)', ''],
  [144, 'Вірус папіломи людини (ВПЛ) — 1 доза', 'Для дівчат 12–13 років', 'f'],
  [192, 'Дифтерія, правець', '']
];
let kidSel = null, kidFilter = '';
const curKid = () => S.kids.find(k => k.id === kidSel) || S.kids[0] || null;
function kidAge(b) {
  if (!validDate(b)) return '';
  const d = parseD(b), t = new Date();
  let m = (t.getFullYear() - d.getFullYear()) * 12 + t.getMonth() - d.getMonth(); if (t.getDate() < d.getDate()) m--;
  if (m < 0) return 'ще не народився(-лась)';
  if (m < 1) { const days = daysBetween(b, today()); return days + ' ' + plural(days, 'день', 'дні', 'днів'); }
  if (m < 24) return m + ' ' + plural(m, 'місяць', 'місяці', 'місяців');
  const y = Math.floor(m / 12), r = m % 12;
  return y + ' ' + plural(y, 'рік', 'роки', 'років') + (r && y < 6 ? ' ' + r + ' міс.' : '');
}
const kidIcon = k => k.gender === 'f' ? '👧' : k.gender === 'm' ? '👦' : '👶';
const lastGrowth = k => S.kidGrowth.filter(g => g.kidId === k.id).sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
function kidSub(k) {
  const g = lastGrowth(k);
  return [kidAge(k.birthday), g && g.height ? g.height + ' см' : '', g && g.weight ? String(g.weight).replace('.', ',') + ' кг' : ''].filter(Boolean).join(' · ');
}
const kidPhoto = (k, cls = 'pet-ph') => `<div class="${cls}" ${k.photo ? `style="background-image:url('${k.photo}')"` : ''}>${k.photo ? '' : kidIcon(k)}</div>`;
function kidEventsOf(k, all) {
  return S.kidEvents.filter(e => e.kidId === k.id && (all || !e.done))
    .sort((a, b) => ((a.date || '9999') + (a.time || '99')).localeCompare((b.date || '9999') + (b.time || '99')));
}
function kidEventRow(e) {
  const late = e.date && e.date < today() && !e.done;
  const lateTxt = late ? (e.type === 'vax' ? ' · за календарем — позначте, якщо зроблено' : ' · прострочено') : '';
  return `<div class="pet-ev${nw(e)}"><button class="check ${e.done ? 'on' : ''}" onclick="toggleKidEvent('${e.id}')">${e.done ? '✓' : ''}</button>
    <div class="tx" onclick="kidEventMenu('${e.id}')"><b>${KID_TYPE[e.type]?.[0] || '🔔'} ${S.kids.length > 1 ? esc((S.kids.find(x => x.id === e.kidId) || {}).name || '') + ': ' : ''}${esc(e.title)}</b><small style="${late ? 'color:' + (e.type === 'vax' ? '#D98A2B' : '#D9645A') : ''}">${whenTxtPet(e)}${e.note ? ' · ' + esc(e.note) : ''}${e.repeat ? ' · 🔁 ' + PET_REPEAT[e.repeat].toLowerCase() : ''}${lateTxt}</small></div></div>`;
}

/* ---- віджет на головній ---- */
function kidWidgetHTML() {
  S.widgets = S.widgets || {};
  if (S.widgets.kids !== true) return '';            // діти — лише якщо увімкнули (не в усіх пар є діти)
  const k = curKid();
  if (!k) return `<div class="card pet-w empty-w"><button class="x" onclick="S.widgets.kids=false;save();render()" aria-label="Прибрати">✕</button><div class="pet-ph">👶</div><div style="flex:1"><b>Турбота про дитину</b><small>Щеплення, лікарі, ріст і перші моменти</small></div><button class="btn sm" onclick="editKid()">Додати</button></div>`;
  if (S.kids.length > 1) {
    const evs = S.kids.flatMap(x => kidEventsOf(x)).sort((a, b) => ((a.date || '9999') + (a.time || '99')).localeCompare((b.date || '9999') + (b.time || '99'))).filter(e => !e.date || e.date >= today() || e.type !== 'vax').slice(0, 3);
    return `<div class="card pet-w"><div style="display:flex;justify-content:space-between;align-items:center"><div class="lbl" style="margin:0">Наші діти 👨‍👩‍👧</div><button class="more" onclick="go('kid')">›</button></div>
      <div class="pet-row">${S.kids.map(x => `<button onclick="kidSel='${x.id}';kidFilter='';go('kid')">${kidPhoto(x)}<b>${esc(x.name)}</b></button>`).join('')}<button onclick="editKid()"><div class="pet-ph add">+</div><b>Додати</b></button></div>
      ${evs.length ? `<div class="lbl" style="margin:12px 0 4px">Ближчі події</div>${evs.map(kidEventRow).join('')}` : ''}</div>`;
  }
  const evs = kidEventsOf(k).filter(e => !e.date || e.date >= today() || e.type !== 'vax').slice(0, 2);
  return `<div class="card pet-w">
    <div class="pet-w-top" onclick="go('kid')">${kidPhoto(k)}<div style="flex:1;min-width:0"><div class="lbl" style="margin:0">Наша дитина ${kidIcon(k)}</div><b class="pet-name">${esc(k.name)} 💛</b><small>${esc(kidSub(k))}</small></div><span class="more">›</span></div>
    <div class="pet-q">${Object.entries(KID_TYPE).map(([t, [ic, l, bg]]) => `<button onclick="kidFilter='${t}';go('kid')"><span style="background:${bg}">${ic}</span>${l}</button>`).join('')}</div>
    ${evs.length ? `<div class="lbl" style="margin:12px 0 4px">Ближчі події</div>${evs.map(kidEventRow).join('')}` : `<button class="link-btn" onclick="addKidEvent()">+ Додати візит до лікаря чи нагадування</button>`}
  </div>`;
}

/* ---- розділ ---- */
function vKid() {
  const k = curKid();
  if (!k) return `<div class="backline"><button onclick="goBack()">‹ Назад</button></div>
    <h1>Наші діти 👶</h1><p class="sub">Щеплення за календарем, візити до лікаря, ріст і вага, перші моменти — спільно на двох.</p>
    <div class="empty">${BEAGLE}Додайте дитину, щоб почати</div><button class="btn" style="width:100%;margin-top:12px" onclick="editKid()">+ Додати дитину</button>`;
  const evs = kidEventsOf(k, true).filter(e => !kidFilter || e.type === kidFilter);
  const open = evs.filter(e => !e.done), done = evs.filter(e => e.done).slice(-12).reverse();
  const g = S.kidGrowth.filter(x => x.kidId === k.id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const moments = S.kidMoments.filter(x => x.kidId === k.id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const vaxAll = S.kidEvents.filter(e => e.kidId === k.id && e.type === 'vax'), vaxDone = vaxAll.filter(e => e.done).length;
  S.widgets = S.widgets || {};
  return `<div class="backline"><button onclick="goBack()">‹ Назад</button></div>
  <div class="page-head"><div><h1>${S.kids.length > 1 ? 'Наші діти 👨‍👩‍👧' : 'Наша дитина ' + kidIcon(k)}</h1></div><button class="fab" onclick="addKidEvent(null,kidFilter)">+</button></div>
  <div class="chips">${S.kids.map(x => `<button class="chip ${x.id === k.id ? 'on' : ''}" onclick="kidSel='${x.id}';render()">${kidIcon(x)} ${esc(x.name)}</button>`).join('')}<button class="chip add-chip" onclick="editKid()">+ Додати дитину</button></div>
  <div class="card pet-card">
    <label class="pet-ph big" ${k.photo ? `style="background-image:url('${k.photo}')"` : ''}>${k.photo ? '' : kidIcon(k)}<span class="cam">📷</span><input type="file" accept="image/*" style="display:none" onchange="setKidPhoto(this,'${k.id}')"></label>
    <div style="flex:1;min-width:0"><b class="pet-name" style="font-size:24px">${esc(k.name)} 💛</b><small>${esc(kidSub(k)) || 'Додайте дату народження'}</small>
      ${k.clothes || k.shoes ? `<div class="chips-row">${k.clothes ? `<span class="pill">👕 ${esc(k.clothes)}</span>` : ''}${k.shoes ? `<span class="pill">👟 ${esc(k.shoes)}</span>` : ''}</div>` : ''}
      ${k.notes ? `<div class="ds" style="margin-top:6px">${esc(k.notes)}</div>` : ''}</div>
    <button class="more" onclick="editKid(curKid())">✎</button>
  </div>
  <div class="pet-q big">${Object.entries(KID_TYPE).map(([t, [ic, l, bg]]) => `<button class="${kidFilter === t ? 'on' : ''}" onclick="kidFilter=kidFilter==='${t}'?'':'${t}';render()"><span style="background:${bg}">${ic}</span>${l}</button>`).join('')}</div>
  ${kidFilter === 'growth' ? `
  <div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><div class="sec-t" style="margin:0">📏 Ріст і вага</div><button class="btn sm" onclick="addGrowth()">+ Заміряти</button></div>
    ${g.length ? g.map(x => `<div class="row"><div class="tx"><b>${x.height ? x.height + ' см' : ''}${x.height && x.weight ? ' · ' : ''}${x.weight ? String(x.weight).replace('.', ',') + ' кг' : ''}</b><small>${fmtS(x.date)}${validDate(k.birthday) ? ' · ' + kidAgeAt(k.birthday, x.date) : ''}</small></div><button class="more" onclick="itemMenu('kidGrowth','${x.id}')">⋯</button></div>`).join('') : '<div class="empty" style="margin-top:10px">Записуйте зріст і вагу після візитів до лікаря — побачите, як дитина росте.</div>'}
  </div>` : `
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center"><div class="sec-t" style="margin:0">${kidFilter ? KID_TYPE[kidFilter][0] + ' ' + KID_TYPE[kidFilter][1] : 'Ближчі події'}</div><button class="btn sm" onclick="addKidEvent(null,kidFilter)">+ Додати</button></div>
    ${kidFilter === 'vax' ? `<div class="hint" style="margin:10px 0 4px">${vaxAll.length ? `Зроблено ${vaxDone} з ${vaxAll.length}. ` : ''}Графік — за Національним календарем щеплень МОЗ України (2026). Індивідуальний графік узгоджуйте з педіатром.</div>${vaxAll.length ? '' : `<button class="btn" style="width:100%;margin:6px 0" onclick="addUaVax('${k.id}')">💉 Додати календар щеплень</button>`}` : ''}
    ${open.length ? open.map(kidEventRow).join('') : `<div class="empty" style="margin-top:10px">Поки немає подій${kidFilter ? ' цього типу' : ''}.</div>`}
  </div>
  ${done.length ? `<div class="lbl">✅ Зроблено</div><div class="card" style="padding:6px 16px">${done.map(kidEventRow).join('')}</div>` : ''}`}
  <div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><div class="sec-t" style="margin:0">⭐ Перші моменти</div><button class="btn sm" onclick="addMoment()">+ Момент</button></div>
    ${moments.length ? moments.map(x => `<div class="row"><div class="ic">${esc(x.emoji || '⭐')}</div><div class="tx"><b>${esc(x.title)}</b><small>${fmtS(x.date)}${validDate(k.birthday) && validDate(x.date) ? ' · у ' + kidAgeAt(k.birthday, x.date) : ''}</small></div><button class="more" onclick="itemMenu('kidMoments','${x.id}')">⋯</button></div>`).join('') : '<div class="empty" style="margin-top:10px">Перша усмішка, перший зуб, перші кроки… 💛</div>'}
  </div>
  <button class="row" style="width:100%;text-align:left" onclick="S.widgets.kids=S.widgets.kids===true?false:true;save();render()"><div class="ic">🏠</div><div class="tx"><b>Показувати на головній</b><small>Віджет з ближчими подіями</small></div><span class="switch ${S.widgets.kids === true ? 'on' : ''}"></span></button>`;
}
function kidAgeAt(b, d) {
  const x = parseD(b), y = parseD(d); let m = (y.getFullYear() - x.getFullYear()) * 12 + y.getMonth() - x.getMonth(); if (y.getDate() < x.getDate()) m--;
  if (m < 1) return daysBetween(b, d) + ' дн.';
  if (m < 24) return m + ' міс.';
  return Math.floor(m / 12) + ' ' + plural(Math.floor(m / 12), 'рік', 'роки', 'років');
}

/* ---- профіль ---- */
function editKid(k) {
  formSheet(k ? 'Профіль дитини' : 'Нова дитина 👶', [
    { k: 'name', l: 'Ім’я', v: k?.name, ph: 'Софійка', maxlen: 30 },
    { k: 'gender', l: 'Стать', type: 'select', v: k?.gender || '', opts: [['', '—'], ['f', '👧 Дівчинка'], ['m', '👦 Хлопчик']] },
    { k: 'birthday', l: 'Дата народження', type: 'date', v: k?.birthday, max: ymd(new Date(Date.now() + 300 * 864e5)), req: false },
    { k: 'clothes', l: 'Розмір одягу', v: k?.clothes, ph: '92 / 2–3 роки', req: false, maxlen: 20 },
    { k: 'shoes', l: 'Розмір взуття', v: k?.shoes, ph: '24', req: false, maxlen: 10 },
    { k: 'notes', l: 'Нотатки (алергії, педіатр, група крові…)', type: 'textarea', v: k?.notes, req: false, maxlen: 500 },
    ...(k ? [] : [{ k: 'vax', l: 'Календар щеплень', type: 'select', v: '1', opts: [['1', '💉 Додати графік щеплень МОЗ України'], ['0', 'Не додавати']] }])
  ], v => {
    const o = { name: v.name, gender: v.gender, birthday: v.birthday, clothes: v.clothes, shoes: v.shoes, notes: v.notes };
    let kid = k;
    if (k) Object.assign(k, o);
    else { kid = { id: uid(), photo: '', ...o }; S.kids.push(kid); kidSel = kid.id; S.widgets = S.widgets || {}; S.widgets.kids = true; }
    if (!k && v.vax === '1' && validDate(v.birthday)) addUaVax(kid.id, true);
    if (v.birthday) {
      const ev = S.events.find(e => e.kidId === kid.id);
      if (ev) { ev.date = v.birthday; ev.title = 'День народження ' + v.name; }
      else S.events.push({ id: uid(), kidId: kid.id, title: 'День народження ' + v.name, date: v.birthday, emoji: '🎂', yearly: true });
    }
    if (!k) setTimeout(() => { go('kid'); toast('Натисніть на кружечок, щоб додати фото 📷'); }, 100);
  });
  if (k) {
    document.querySelector('#sheet .acts').insertAdjacentHTML('afterend', '<button class="btn ghost" style="width:100%;margin-top:10px;color:#D9645A" id="kidDel">Видалити профіль дитини</button>');
    document.getElementById('kidDel').onclick = () => confirmSheet('Видалити профіль ' + k.name + ' з усіма подіями й моментами?', 'Видалити', () => {
      S.kids = S.kids.filter(x => x.id !== k.id);
      ['kidEvents', 'kidGrowth', 'kidMoments'].forEach(l => { S[l] = S[l].filter(x => x.kidId !== k.id); });
      S.events = S.events.filter(e => e.kidId !== k.id); kidSel = null;
    });
  }
}
function setKidPhoto(input, id) {
  const f = input.files && input.files[0]; if (!f) return;
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => {
    const side = Math.min(img.width, img.height), sz = Math.round(Math.min(480, side));
    const c = document.createElement('canvas'); c.width = c.height = sz;
    c.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, sz, sz);
    const k = S.kids.find(x => x.id === id);
    if (k) { k.photo = c.toDataURL('image/jpeg', 0.8); save(); render(); toast('Фото оновлено 📷'); }
    URL.revokeObjectURL(url);
  };
  img.onerror = () => toast('Не вдалося відкрити фото');
  img.src = url;
}

/* ---- щеплення за календарем ---- */
function addUaVax(kidId, silent) {
  const k = S.kids.find(x => x.id === kidId); if (!k) return;
  if (!validDate(k.birthday)) { toast('Спершу вкажіть дату народження'); return editKid(k); }
  const b = parseD(k.birthday);
  let n = 0;
  UA_VAX.forEach(([m, title, note, onlyGender]) => {
    if (onlyGender && k.gender && k.gender !== onlyGender) return;
    if (S.kidEvents.some(e => e.kidId === kidId && e.type === 'vax' && e.title === title)) return;
    const d = new Date(b.getFullYear(), b.getMonth() + m, Math.min(b.getDate(), 28));
    S.kidEvents.push({ id: uid(), kidId, type: 'vax', title, note, date: ymd(d), time: '', repeat: '', done: false, plan: 'ua' });
    n++;
  });
  if (!silent) { save(); render(); toast('Додано ' + n + ' щеплень за календарем 💉 Позначте вже зроблені'); }
}

/* ---- події, ріст, моменти ---- */
function addKidEvent(e, type) {
  const k = curKid(); if (!k) return editKid();
  const ph = { health: 'Педіатр, аналізи, ліки…', vax: 'Назва вакцини', growth: '', remind: 'Записатися в садочок, вітаміни…' };
  if ((e?.type || type) === 'growth') return addGrowth();
  formSheet(e ? 'Подія' : 'Нова подія для ' + k.name, [
    { k: 'type', l: 'Тип', type: 'select', v: e?.type || type || 'health', opts: Object.entries(KID_TYPE).filter(([t]) => t !== 'growth').map(([t, [ic, l]]) => [t, ic + ' ' + l]) },
    { k: 'title', l: 'Що', v: e?.title, ph: ph[e?.type || type || 'health'], maxlen: 120, req: true },
    { k: 'date', l: 'Дата', type: 'date', v: e?.date || today(), req: false },
    { k: 'time', l: 'Час (необов’язково)', type: 'time', v: e?.time, req: false },
    { k: 'note', l: 'Нотатка (кабінет, лікар, доза…)', v: e?.note, req: false, maxlen: 120 },
    { k: 'repeat', l: 'Повторювати', type: 'select', v: e?.repeat || '', opts: Object.entries(PET_REPEAT) }
  ], v => {
    if (v.repeat && !v.date) v.date = today();
    const o = { type: v.type, title: v.title, date: v.date, time: v.time, note: v.note, repeat: v.repeat };
    if (e) Object.assign(e, o); else S.kidEvents.push({ id: uid(), kidId: k.id, done: false, ...o });
  }, e ? 'Зберегти' : 'Додати');
}
function toggleKidEvent(id) {
  const e = S.kidEvents.find(x => x.id === id); if (!e) return;
  if (e.repeat && !e.done) {
    S.kidEvents.push({ ...e, id: uid(), done: true, repeat: '', doneAt: today() });
    e.date = petNext(e.date, e.repeat); e.seen = [S.me];
    save(); render(); haptic('medium'); toast('Готово ✓ Наступного разу: ' + whenTxtPet(e)); return;
  }
  e.done = !e.done; if (e.done) { e.doneAt = today(); if (e.type === 'vax') celebrate(); }
  save(); render(); haptic();
}
function kidEventMenu(id) {
  const e = S.kidEvents.find(x => x.id === id); if (!e) return;
  itemMenu('kidEvents', id, [['✎ Редагувати', () => { addKidEvent(e); return 'keep'; }]]);
}
function addGrowth() {
  const k = curKid(); if (!k) return;
  formSheet('Ріст і вага ' + k.name, [
    { k: 'date', l: 'Дата заміру', type: 'date', v: today(), max: today(), req: true },
    { k: 'height', l: 'Зріст, см', type: 'decimal', ph: '86', req: false },
    { k: 'weight', l: 'Вага, кг', type: 'decimal', ph: '12,4', req: false }
  ], v => {
    const h = +String(v.height).replace(',', '.'), w = +String(v.weight).replace(',', '.');
    if (!h && !w) return 'Вкажіть зріст або вагу';
    if ((v.height && !(h > 20 && h < 230)) || (v.weight && !(w > 0.5 && w < 200))) return 'Перевірте значення';
    S.kidGrowth.push({ id: uid(), kidId: k.id, date: v.date, height: h || '', weight: w ? +w.toFixed(2) : '' });
    kidFilter = 'growth';
  }, 'Зберегти');
}
function addMoment() {
  const k = curKid(); if (!k) return;
  formSheet('Перший момент ⭐', [
    { k: 'title', l: 'Що сталося', ph: 'Перший зубчик, перші кроки, перше слово…', maxlen: 120 },
    { k: 'date', l: 'Коли', type: 'date', v: today(), max: today(), req: true },
    { k: 'emoji', l: 'Емодзі', type: 'select', v: '⭐', opts: ['⭐', '🦷', '👣', '🗣️', '😊', '🎂', '🎒', '🚲', '💛'].map(x => [x, x]) }
  ], v => { S.kidMoments.push({ id: uid(), kidId: k.id, title: v.title, date: v.date, emoji: v.emoji }); celebrate(); }, 'Зберегти');
}
