/* ===== Наш улюбленець: профіль, фото, здоров'я, грумінг, корм, нагадування ===== */
const PET_KIND = { dog: ['🐶', 'Наш пес'], cat: ['🐱', 'Наш кіт'], other: ['🐾', 'Наш улюбленець'] };
const PET_TYPE = { health: ['💊', 'Здоров’я', '#FDE6E4'], groom: ['✂️', 'Грумінг', '#F1E3FF'], food: ['🍖', 'Корм', '#FFE8D6'], remind: ['🔔', 'Нагадування', '#FFF3CF'] };
const PET_REPEAT = { '': 'Не повторювати', day: 'Щодня', week: 'Щотижня', '2week': 'Раз на 2 тижні', month: 'Щомісяця', year: 'Щороку' };
let petSel = null, petFilter = '';

const curPet = () => S.pets.find(p => p.id === petSel) || S.pets[0] || null;
function petAge(b) {
  if (!validDate(b)) return '';
  const d = parseD(b), t = new Date(); let m = (t.getFullYear() - d.getFullYear()) * 12 + t.getMonth() - d.getMonth(); if (t.getDate() < d.getDate()) m--;
  if (m < 12) return m + ' ' + plural(m, 'місяць', 'місяці', 'місяців');
  const y = Math.floor(m / 12); return y + ' ' + plural(y, 'рік', 'роки', 'років');
}
const petSub = p => [p.breed, p.weight ? String(p.weight).replace('.', ',') + ' кг' : '', petAge(p.birthday)].filter(Boolean).join(' · ');
const petPhoto = (p, cls = 'pet-ph') => `<div class="${cls}" ${p.photo ? `style="background-image:url('${p.photo}')"` : ''}>${p.photo ? '' : PET_KIND[p.kind || 'dog'][0]}</div>`;
function petEventsOf(p, all) {
  return S.petEvents.filter(e => e.petId === p.id && (all || !e.done))
    .sort((a, b) => ((a.date || '9999') + (a.time || '99')).localeCompare((b.date || '9999') + (b.time || '99')));
}
function whenTxtPet(e) {
  if (!e.date) return e.time || '';
  const d = daysBetween(today(), e.date);
  const day = d === 0 ? 'Сьогодні' : d === 1 ? 'Завтра' : d === -1 ? 'Вчора' : fmtS(e.date, e.date.slice(0, 4) !== today().slice(0, 4));
  return day + (e.time ? ', ' + e.time : '');
}
function petEventRow(e) {
  const late = e.date && e.date < today();
  return `<div class="pet-ev${nw(e)}"><button class="check ${e.done ? 'on' : ''}" onclick="togglePetEvent('${e.id}')">${e.done ? '✓' : ''}</button>
    <div class="tx" onclick="petEventMenu('${e.id}')"><b>${PET_TYPE[e.type]?.[0] || '🔔'} ${S.pets.length > 1 ? esc((S.pets.find(x => x.id === e.petId) || {}).name || '') + ': ' : ''}${esc(e.title)}</b><small style="${late ? 'color:#D9645A' : ''}">${whenTxtPet(e)}${e.repeat ? ' · 🔁 ' + PET_REPEAT[e.repeat].toLowerCase() : ''}${late ? ' · прострочено' : ''}</small></div></div>`;
}

/* ---- віджет на головній ---- */
function petWidgetHTML() {
  S.widgets = S.widgets || {};
  if (S.widgets.pet === false) return '';
  const p = curPet();
  if (!p) return `<div class="card pet-w empty-w"><button class="x" onclick="hidePetWidget()" aria-label="Прибрати">✕</button><div class="pet-ph">🐾</div><div style="flex:1"><b>Є домашній улюбленець?</b><small>Здоров’я, грумінг, корм і нагадування — в одному місці</small></div><button class="btn sm" onclick="editPet()">Додати</button></div>`;
  if (S.pets.length > 1) {
    const evs = S.pets.flatMap(x => petEventsOf(x)).sort((a, b) => ((a.date || '9999') + (a.time || '99')).localeCompare((b.date || '9999') + (b.time || '99'))).slice(0, 3);
    return `<div class="card pet-w">
      <div style="display:flex;justify-content:space-between;align-items:center"><div class="lbl" style="margin:0">Наші улюбленці 🐾</div><button class="more" onclick="petWidgetMenu()">⋯</button></div>
      <div class="pet-row">${S.pets.map(x => `<button onclick="petSel='${x.id}';petFilter='';go('pet')">${petPhoto(x)}<b>${esc(x.name)}</b></button>`).join('')}<button onclick="editPet()"><div class="pet-ph add">+</div><b>Додати</b></button></div>
      ${evs.length ? `<div class="lbl" style="margin:12px 0 4px">Ближчі події</div>${evs.map(petEventRow).join('')}` : ''}
    </div>`;
  }
  const evs = petEventsOf(p).slice(0, 2), k = PET_KIND[p.kind || 'dog'];
  return `<div class="card pet-w">
    <div class="pet-w-top" onclick="go('pet')">${petPhoto(p)}<div style="flex:1;min-width:0"><div class="lbl" style="margin:0">${k[1]} ${k[0]}</div><b class="pet-name">${esc(p.name)} 💜</b><small>${esc(petSub(p))}</small></div><button class="more" onclick="event.stopPropagation();petWidgetMenu()">⋯</button></div>
    <div class="pet-q">${Object.entries(PET_TYPE).map(([t, [ic, l, bg]]) => `<button onclick="openPetType('${t}')"><span style="background:${bg}">${ic}</span>${l}</button>`).join('')}</div>
    ${evs.length ? `<div class="lbl" style="margin:12px 0 4px">Ближчі події</div>${evs.map(petEventRow).join('')}` : `<button class="link-btn" onclick="addPetEvent()">+ Додати першу подію (таблетка, грумінг, корм…)</button>`}
  </div>`;
}
function hidePetWidget() { S.widgets = S.widgets || {}; S.widgets.pet = false; save(); render(); toast('Віджет прибрано. Повернути: Ще → Віджети на головній'); }
function petWidgetMenu() {
  openSheet(`<h3>Віджет улюбленця</h3>
    <button class="btn ghost" style="width:100%;margin-bottom:8px" onclick="closeSheet();go('pet')">Відкрити розділ</button>
    <button class="btn ghost" style="width:100%;margin-bottom:8px" onclick="closeSheet();addPetEvent()">+ Додати подію</button>
    <button class="btn ghost" style="width:100%;margin-bottom:8px" onclick="closeSheet();editPet()">🐾 Додати ще улюбленця</button>
    <button class="btn" style="width:100%;background:#D9645A" onclick="closeSheet();hidePetWidget()">Прибрати з головної</button>`);
}

/* ---- розділ ---- */
function vPet() {
  const p = curPet();
  if (!p) return `<div class="backline"><button onclick="goBack()">‹ Назад</button></div>
    <h1>Наш улюбленець 🐾</h1><p class="sub">Здоров’я, грумінг, корм і нагадування для вашої тваринки — спільно на двох.</p>
    <div class="empty">${BEAGLE}Додайте свого улюбленця (або кількох), щоб почати</div><button class="btn" style="width:100%;margin-top:12px" onclick="editPet()">+ Додати улюбленця</button>`;
  const k = PET_KIND[p.kind || 'dog'], evs = petEventsOf(p, true).filter(e => !petFilter || e.type === petFilter);
  const open = evs.filter(e => !e.done), done = evs.filter(e => e.done).slice(-10).reverse();
  S.widgets = S.widgets || {};
  return `<div class="backline"><button onclick="goBack()">‹ Назад</button></div>
  <div class="page-head"><div><h1>${S.pets.length > 1 ? 'Наші улюбленці 🐾' : k[1] + ' ' + k[0]}</h1></div><button class="fab" onclick="addPetEvent()">+</button></div>
  <div class="chips">${S.pets.map(x => `<button class="chip ${x.id === p.id ? 'on' : ''}" onclick="petSel='${x.id}';render()">${PET_KIND[x.kind || 'dog'][0]} ${esc(x.name)}</button>`).join('')}<button class="chip add-chip" onclick="editPet()">+ Додати улюбленця</button></div>
  <div class="card pet-card">
    <label class="pet-ph big" ${p.photo ? `style="background-image:url('${p.photo}')"` : ''}>${p.photo ? '' : k[0]}<span class="cam">📷</span><input type="file" accept="image/*" style="display:none" onchange="setPetPhoto(this,'${p.id}')"></label>
    <div style="flex:1;min-width:0"><b class="pet-name" style="font-size:24px">${esc(p.name)} 💜</b><small>${esc(petSub(p)) || 'Додайте породу й вагу'}</small>${p.notes ? `<div class="ds" style="margin-top:6px">${esc(p.notes)}</div>` : ''}</div>
    <button class="more" onclick="editPet(curPet())">✎</button>
  </div>
  <div class="pet-q big">${Object.entries(PET_TYPE).map(([t, [ic, l, bg]]) => `<button class="${petFilter === t ? 'on' : ''}" onclick="petFilter=petFilter==='${t}'?'':'${t}';render()"><span style="background:${bg}">${ic}</span>${l}</button>`).join('')}</div>
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center"><div class="sec-t" style="margin:0">${petFilter ? PET_TYPE[petFilter][0] + ' ' + PET_TYPE[petFilter][1] : 'Ближчі події'}</div><button class="btn sm" onclick="addPetEvent(null,petFilter)">+ Додати</button></div>
    ${open.length ? open.map(petEventRow).join('') : `<div class="empty" style="margin-top:10px">Поки немає подій${petFilter ? ' цього типу' : ''}.</div>`}
  </div>
  ${done.length ? `<div class="lbl">✅ Виконано нещодавно</div><div class="card" style="padding:6px 16px">${done.map(petEventRow).join('')}</div>` : ''}
  <button class="row" style="width:100%;text-align:left" onclick="S.widgets.pet=S.widgets.pet===false?true:false;save();render()"><div class="ic">🏠</div><div class="tx"><b>Показувати на головній</b><small>Віджет з ближчими подіями</small></div><span class="switch ${S.widgets.pet === false ? '' : 'on'}"></span></button>`;
}
function openPetType(t) { petFilter = t; go('pet'); }

/* ---- профіль ---- */
function editPet(p) {
  formSheet(p ? 'Профіль улюбленця' : 'Новий улюбленець 🐾', [
    { k: 'name', l: 'Ім’я', v: p?.name, ph: 'Нутелка', maxlen: 30 },
    { k: 'kind', l: 'Хто це', type: 'select', v: p?.kind || 'dog', opts: [['dog', '🐶 Собака'], ['cat', '🐱 Кіт'], ['other', '🐾 Інше']] },
    { k: 'breed', l: 'Порода', v: p?.breed, ph: 'Бігль', req: false, maxlen: 40 },
    { k: 'weight', l: 'Вага, кг', type: 'number', v: p?.weight, ph: '20', req: false },
    { k: 'birthday', l: 'День народження', type: 'date', v: p?.birthday, max: today(), maxMsg: 'Дата не може бути в майбутньому', req: false },
    { k: 'notes', l: 'Нотатки (ветеринар, чип, алергії…)', type: 'textarea', v: p?.notes, req: false, maxlen: 500 }
  ], v => {
    if (v.weight && !(+v.weight > 0 && +v.weight < 200)) return 'Перевірте вагу';
    const o = { name: v.name, kind: v.kind, breed: v.breed, weight: v.weight ? +(+v.weight).toFixed(1) : '', birthday: v.birthday, notes: v.notes };
    if (p) Object.assign(p, o);
    else { const n = { id: uid(), photo: '', ...o }; S.pets.push(n); petSel = n.id; S.widgets = S.widgets || {}; S.widgets.pet = true; setTimeout(() => { go('pet'); toast('Натисніть на кружечок, щоб додати фото 📷'); }, 100); }
    // день народження — у важливі дати
    if (v.birthday) {
      const id = (p || S.pets[S.pets.length - 1]).id, ev = S.events.find(e => e.petId === id);
      if (ev) { ev.date = v.birthday; ev.title = 'День народження ' + v.name; }
      else S.events.push({ id: uid(), petId: id, title: 'День народження ' + v.name, date: v.birthday, emoji: '🐶', yearly: true });
    }
  });
  if (p) document.querySelector('#sheet .acts').insertAdjacentHTML('afterend', '<button class="btn ghost" style="width:100%;margin-top:10px;color:#D9645A" id="petDel">Видалити улюбленця</button>');
  const d = document.getElementById('petDel');
  if (d) d.onclick = () => confirmSheet('Видалити ' + p.name + ' і всі події?', 'Видалити', () => {
    S.pets = S.pets.filter(x => x.id !== p.id); S.petEvents = S.petEvents.filter(e => e.petId !== p.id); S.events = S.events.filter(e => e.petId !== p.id); petSel = null;
  });
}
/* фото: стискаємо до ~480px, щоб швидко синхронізувалось */
function setPetPhoto(input, id) {
  const f = input.files && input.files[0]; if (!f) return;
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => {
    const max = 480, sc = Math.min(1, max / Math.max(img.width, img.height));
    const side = Math.min(img.width, img.height), cx = (img.width - side) / 2, cy = (img.height - side) / 2;
    const c = document.createElement('canvas'), sz = Math.round(Math.min(max, side));
    c.width = c.height = sz;
    c.getContext('2d').drawImage(img, cx, cy, side, side, 0, 0, sz, sz);
    const p = S.pets.find(x => x.id === id);
    if (p) { p.photo = c.toDataURL('image/jpeg', 0.8); save(); render(); toast('Фото оновлено 📷'); }
    URL.revokeObjectURL(url);
  };
  img.onerror = () => toast('Не вдалося відкрити фото');
  img.src = url;
}

/* ---- події ---- */
function addPetEvent(e, type) {
  const p = curPet(); if (!p) return editPet();
  const ph = { health: 'Таблетка (Apoquel), щеплення, ветеринар…', groom: 'Грумінг, купання, кігті…', food: 'Купити корм, змінити корм…', remind: 'Прогулянка, ліки від бліх…' };
  formSheet(e ? 'Подія' : 'Нова подія для ' + p.name, [
    { k: 'type', l: 'Тип', type: 'select', v: e?.type || type || 'health', opts: Object.entries(PET_TYPE).map(([k, [ic, l]]) => [k, ic + ' ' + l]) },
    { k: 'title', l: 'Що', v: e?.title, ph: ph[e?.type || type || 'health'], maxlen: 80, req: true },
    { k: 'date', l: 'Дата', type: 'date', v: e?.date || today(), req: false },
    { k: 'time', l: 'Час (необов’язково)', type: 'time', v: e?.time, req: false },
    { k: 'repeat', l: 'Повторювати', type: 'select', v: e?.repeat || '', opts: Object.entries(PET_REPEAT) }
  ], v => {
    if (v.repeat && !v.date) v.date = today();
    const o = { type: v.type, title: v.title, date: v.date, time: v.time, repeat: v.repeat };
    if (e) Object.assign(e, o); else S.petEvents.push({ id: uid(), petId: p.id, done: false, ...o });
  }, e ? 'Зберегти' : 'Додати');
}
function petNext(date, rep) {
  const d = parseD(validDate(date) ? date : today());
  const step = () => { if (rep === 'day') d.setDate(d.getDate() + 1); else if (rep === 'week') d.setDate(d.getDate() + 7); else if (rep === '2week') d.setDate(d.getDate() + 14); else if (rep === 'year') d.setFullYear(d.getFullYear() + 1); else { const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + 1); d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); } };
  step(); while (ymd(d) < today()) step();
  return ymd(d);
}
function togglePetEvent(id) {
  const e = S.petEvents.find(x => x.id === id); if (!e) return;
  if (e.repeat && !e.done) {
    S.petEvents.push({ ...e, id: uid(), done: true, repeat: '', doneAt: today() });
    e.date = petNext(e.date, e.repeat); e.seen = [S.me];
    save(); render(); haptic('medium'); toast('Готово ✓ Наступного разу: ' + whenTxtPet(e)); return;
  }
  e.done = !e.done; if (e.done) e.doneAt = today(); save(); render(); haptic();
}
function petEventMenu(id) {
  const e = S.petEvents.find(x => x.id === id); if (!e) return;
  itemMenu('petEvents', id, [['✎ Редагувати', () => { addPetEvent(e); return 'keep'; }]]);
}

/* ---- віджети на головній: що показувати ---- */
function openWidgets() {
  S.widgets = S.widgets || {}; S.onb = S.onb || {};
  const rows = [
    ['pet', '🐾', 'Улюбленці', S.pets.length ? S.pets.map(p => p.name).join(', ') : 'Профіль, події, нагадування', S.widgets.pet !== false],
    ['kids', '👶', 'Діти', S.kids.length ? S.kids.map(k => k.name).join(', ') : 'Щеплення, лікарі, ріст', S.widgets.kids === true],
    ['qa', '❓', 'Питання дня', 'Відповіді відкриваються обом', S.widgets.qa !== false],
    ['memory', '📸', 'Цього дня', 'Спогади з минулих років', S.widgets.memory !== false],
    ['steps', '👣', 'Перші кроки', 'Підказки для початку', !S.onb[S.me]]
  ];
  openSheet(`<h3>Віджети на головній 🏠</h3><p class="sub">Оберіть, що показувати на вкладці «Ми».</p>
    <div class="card" style="padding:4px 16px">${rows.map(([k, ic, t, sub, on]) => `<button class="row" style="width:100%;text-align:left" data-w="${k}"><div class="ic">${ic}</div><div class="tx"><b>${t}</b><small>${esc(sub)}</small></div><span class="switch ${on ? 'on' : ''}"></span></button>`).join('')}</div>
    <button class="btn" style="width:100%" onclick="closeSheet()">Готово</button>`);
  document.querySelectorAll('#sheet [data-w]').forEach(b => b.onclick = () => {
    const k = b.dataset.w;
    if (k === 'steps') S.onb[S.me] = !S.onb[S.me];
    else if (k === 'kids') S.widgets.kids = S.widgets.kids !== true;
    else S.widgets[k] = S.widgets[k] === false ? true : false;
    save(); render(); haptic(); openWidgets();
  });
}
