/* ===== Бюджет: надходження, заплановані й зроблені витрати ===== */
const BUD_MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
const BUD_OUT = [['🏠', 'Квартира'], ['💡', 'Комуналка'], ['🛒', 'Продукти'], ['🐶', 'Собака'], ['👶', 'Дитина'], ['💊', 'Здоров’я'], ['🚗', 'Транспорт'], ['📱', 'Зв’язок'], ['🍽', 'Кафе'], ['🎁', 'Подарунки'], ['👕', 'Одяг'], ['🎉', 'Розваги'], ['✈️', 'Подорожі'], ['💳', 'Кредит']];
const BUD_IN = [['💼', 'Зарплата'], ['💻', 'Підробіток'], ['🎁', 'Подарунок'], ['↩️', 'Повернення боргу'], ['🏦', 'Відсотки'], ['💰', 'Інше']];
let budMonth = null, budAll = false;   // budMonth = 'YYYY-MM'
const budCur = () => S.budgetCur || 'UAH';
const budEmoji = (cat, kind) => ((kind === 'in' ? BUD_IN : BUD_OUT).find(([, n]) => n.toLowerCase() === String(cat || '').toLowerCase()) || [kind === 'in' ? '💰' : '💸'])[0];
const ym = d => (d || today()).slice(0, 7);
const ymLabel = m => BUD_MONTHS[+m.slice(5, 7) - 1] + ' ' + m.slice(0, 4);
const ymShift = (m, n) => { const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
const hasSum = x => x.amount !== '' && x.amount != null && isFinite(+x.amount) && +x.amount > 0;
const sumOf = arr => Math.round(arr.reduce((s, x) => s + (hasSum(x) ? +x.amount : 0), 0) * 100) / 100;
const bc = n => cur(n, budCur());

function budScope() {
  const m = budMonth || ym();
  const inMonth = x => budAll || ym(x.date) === m;
  const items = S.budget;
  const income = items.filter(x => x.kind === 'in' && inMonth(x));
  const spent = items.filter(x => x.kind === 'out' && x.paid && (budAll || ym(x.paidAt || x.date) === m));
  // заплановане: цього місяця + неоплачене з минулих (якщо дивимось поточний місяць)
  const planned = items.filter(x => x.kind === 'out' && !x.paid && (budAll || ym(x.date) === m || (m === ym() && ym(x.date) < m)));
  return { m, income, spent, planned };
}

/* ---- віджет-рядок на «Ще» ---- */
function budgetSub() {
  if (!S.budget.length) return 'Надходження й витрати';
  const inc = sumOf(S.budget.filter(x => x.kind === 'in' && x.date <= today())), sp = sumOf(S.budget.filter(x => x.kind === 'out' && x.paid));
  return 'Залишок: ' + bc(inc - sp);
}

function budRow(x) {
  const late = x.kind === 'out' && !x.paid && x.date && x.date < today();
  const sum = hasSum(x) ? `<b class="bud-sum ${x.kind === 'in' ? 'in' : ''}">${x.kind === 'in' ? '+' : '−'}${bc(+x.amount)}</b>` : `<button class="pill" onclick="event.stopPropagation();budAmount('${x.id}')">＋ сума</button>`;
  const act = x.kind === 'out' && !x.paid ? `<button class="btn sm bud-paid" onclick="event.stopPropagation();budPay('${x.id}')">Витрачено</button>` : '';
  return `<div class="row bud-row${nw(x)}" onclick="budMenu('${x.id}')"><div class="ic">${budEmoji(x.cat, x.kind)}</div>
    <div class="tx"><b>${esc(x.title)}</b><small style="${late ? 'color:#D98A2B' : ''}">${[x.cat && x.cat !== x.title ? esc(x.cat) : '', x.kind === 'out' && x.paid ? 'витрачено ' + fmtS(x.paidAt || x.date) : fmtS(x.date), x.repeat === 'month' ? '🔁 щомісяця' : '', late ? 'термін минув' : '', x.note ? esc(x.note) : ''].filter(Boolean).join(' · ')}</small></div>
    <div class="bud-r">${sum}${act}</div></div>`;
}

function vBudget() {
  const { m, income, spent, planned } = budScope();
  const inc = sumOf(income), sp = sumOf(spent), pl = sumOf(planned);
  // залишок — наскрізний: усе, що прийшло, мінус усе витрачене до кінця обраного місяця
  const upTo = x => budAll || ym(x) <= m;
  const bal = Math.round((sumOf(S.budget.filter(x => x.kind === 'in' && upTo(x.date))) - sumOf(S.budget.filter(x => x.kind === 'out' && x.paid && upTo(x.paidAt || x.date)))) * 100) / 100;
  const carry = budAll ? 0 : Math.round((bal - (inc - sp)) * 100) / 100;
  const noSum = planned.filter(x => !hasSum(x)).length;
  const after = Math.round((bal - pl) * 100) / 100;
  const cats = {};
  spent.forEach(x => { if (hasSum(x)) { const k = x.cat || x.title; cats[k] = (cats[k] || 0) + +x.amount; } });
  const catList = Object.entries(cats).sort((a, b) => b[1] - a[1]), catMax = catList[0]?.[1] || 1;
  const byDate = (a, b) => (b.date || '').localeCompare(a.date || '');
  return `<div class="backline"><button onclick="goBack()">‹ Назад</button></div>
  <div class="page-head"><div><h1>Бюджет 💸</h1><p class="sub">Скільки прийшло, що заплановано і що вже витратили.</p></div><button class="fab" onclick="budAdd('out')">+</button></div>
  <div class="bud-nav">
    <button onclick="budAll=false;budMonth=ymShift(budMonth||ym(),-1);render()" ${budAll ? 'disabled' : ''}>‹</button>
    <b onclick="budAll=false;budMonth=null;render()">${budAll ? 'За весь час' : ymLabel(m)}</b>
    <button onclick="budAll=false;budMonth=ymShift(budMonth||ym(),1);render()" ${budAll ? 'disabled' : ''}>›</button>
    <button class="chip ${budAll ? 'on' : ''}" onclick="budAll=!budAll;render()">Весь час</button>
  </div>
  <div class="card bud-total">
    <div class="lbl" style="margin:0">Загальний залишок${budAll || m === ym() ? '' : ' на кінець місяця'}</div>
    <div class="bud-big ${bal < 0 ? 'neg' : ''}">${bc(bal)}</div>
    ${carry ? `<div class="hint" style="margin:-8px 0 6px">з них ${bc(carry)} — з попередніх місяців</div>` : ''}
    ${pl > 0 ? `<div class="hint" style="margin:${carry ? 0 : -8}px 0 10px">Якщо оплатити всі плани, залишиться <b class="${after < 0 ? 'neg' : ''}">${bc(after)}</b></div>` : ''}
    <div class="bud-grid">
      <div><span>⬆️ Надійшло${budAll ? '' : ' за місяць'}</span><b class="in">${bc(inc)}</b></div>
      <div><span>⬇️ Витрачено${budAll ? '' : ' за місяць'}</span><b>${bc(sp)}</b></div>
      <div><span>🕒 Заплановано</span><b>${planned.length} ${plural(planned.length, 'подія', 'події', 'подій')}${noSum ? `<small> · ${noSum} без суми</small>` : ''}</b></div>
      <div><span>🧮 Після планів</span><b class="${pl > 0 ? 'neg' : ''}">${pl > 0 ? '−' + bc(pl) : bc(0)}</b></div>
    </div>
    <div class="bud-btns"><button class="btn ghost" onclick="budAdd('in')">＋ Надходження</button><button class="btn" onclick="budAdd('out')">＋ Витрата</button></div>
  </div>
  <div class="lbl">🕒 Заплановано${planned.length ? ' · ' + planned.length : ''}</div>
  <div class="card" style="padding:6px 16px">${planned.length ? planned.sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(budRow).join('') : '<div class="empty" style="margin:10px 0">Запишіть, на що треба буде витратити — квартира, ліки для собаки… Суму можна додати пізніше.</div>'}</div>
  <div class="lbl">⬆️ Надходження</div>
  <div class="card" style="padding:6px 16px">${income.length ? income.sort(byDate).map(budRow).join('') : '<div class="empty" style="margin:10px 0">Зарплата, підробіток, подарунки…</div>'}</div>
  ${spent.length ? `<div class="lbl">✅ Витрачено</div><div class="card" style="padding:6px 16px">${spent.sort((a, b) => (b.paidAt || b.date || '').localeCompare(a.paidAt || a.date || '')).map(budRow).join('')}</div>` : ''}
  ${catList.length ? `<div class="lbl">📊 На що пішли гроші</div><div class="card">${catList.map(([k, v]) => `<div class="bud-cat"><span>${budEmoji(k, 'out')} ${esc(k)}</span><b>${bc(v)}</b><div class="bar"><i style="width:${Math.max(4, Math.round(v / catMax * 100))}%"></i></div></div>`).join('')}</div>` : ''}
  <button class="row" style="width:100%;text-align:left;margin-top:6px" onclick="budCurPick()"><div class="ic">💱</div><div class="tx"><b>Валюта бюджету</b><small>${CUR[budCur()].l}</small></div><span class="more">›</span></button>`;
}

function parseSum(s) {
  const t = String(s || '').replace(/\s/g, '').replace(',', '.');
  if (!t) return '';
  const n = +t; return isFinite(n) && n > 0 && n < 1e9 ? Math.round(n * 100) / 100 : null;
}
function budAdd(kind, x) {
  const isIn = (x?.kind || kind) === 'in', cats = isIn ? BUD_IN : BUD_OUT;
  const m = budMonth || ym();
  const defDate = x?.date || (m === ym() || budAll ? today() : m + '-01');
  formSheet(x ? (isIn ? 'Надходження' : 'Витрата') : (isIn ? 'Нове надходження ⬆️' : 'Нова витрата ⬇️'), [
    { k: 'title', l: isIn ? 'Що прийшло' : 'На що', v: x?.title, ph: isIn ? 'Зарплата Максима' : 'Оренда квартири, ліки для пса…', maxlen: 80 },
    { k: 'cat', l: 'Категорія (оберіть або впишіть свою)', v: x?.cat, ph: isIn ? 'Зарплата' : 'Квартира', req: false, maxlen: 30, chips: cats.map(([e, n]) => [n, e + ' ' + n]) },
    { k: 'amount', l: 'Сума, ' + CUR[budCur()].s + ' (можна додати пізніше)', type: 'decimal', v: x && hasSum(x) ? String(x.amount).replace('.', ',') : '', ph: '0', req: false },
    { k: 'date', l: isIn ? 'Коли' : 'Коли треба / коли було', type: 'date', v: defDate, req: true },
    ...(isIn ? [] : [{ k: 'state', l: 'Статус', type: 'select', v: x ? (x.paid ? 'paid' : 'plan') : 'plan', opts: [['plan', '🕒 Заплановано — ще не витратили'], ['paid', '✅ Вже витратили']] },
      { k: 'repeat', l: 'Повторювати', type: 'select', v: x?.repeat || '', opts: [['', 'Ні'], ['month', '🔁 Щомісяця (квартира, комуналка…)']] }]),
    { k: 'note', l: 'Нотатка', v: x?.note, req: false, maxlen: 120 }
  ], v => {
    const amount = parseSum(v.amount);
    if (amount === null) return 'Перевірте суму';
    if (!isIn && v.state === 'paid' && amount === '') return 'Щоб позначити «витратили», вкажіть суму';
    const o = { title: v.title, cat: v.cat, amount, date: v.date, note: v.note };
    if (!isIn) { o.repeat = v.repeat; o.paid = v.state === 'paid'; if (o.paid && !(x && x.paid)) o.paidAt = v.date <= today() ? v.date : today(); if (!o.paid) o.paidAt = ''; }
    if (x) Object.assign(x, o);
    else { S.budget.push({ id: uid(), kind: isIn ? 'in' : 'out', ...o }); if (!budAll) budMonth = ym(v.date) === ym() ? null : ym(v.date); }
    if (!isIn && o.paid && o.repeat === 'month') budNextRepeat(x || S.budget[S.budget.length - 1]);
  }, x ? 'Зберегти' : 'Додати');
}
function budMenu(id) {
  const x = S.budget.find(i => i.id === id); if (!x) return;
  const extra = [['✎ Редагувати', () => { budAdd(x.kind, x); return 'keep'; }]];
  if (x.kind === 'out' && x.paid) extra.push(['↩︎ Ще не витратили', () => { x.paid = false; x.paidAt = ''; }]);
  if (x.kind === 'out' && !x.paid) extra.unshift(['✅ Витрачено', () => { budPay(x.id); return 'keep'; }]);
  itemMenu('budget', id, extra);
}
function budAmount(id, then) {
  const x = S.budget.find(i => i.id === id); if (!x) return;
  formSheet('Сума: ' + x.title, [{ k: 'amount', l: 'Сума, ' + CUR[budCur()].s, type: 'decimal', v: hasSum(x) ? String(x.amount).replace('.', ',') : '', ph: '0', req: true }], v => {
    const a = parseSum(v.amount); if (!a) return 'Введіть суму більше нуля';
    x.amount = a; if (then) then(x);
  }, 'Зберегти');
}
function budPay(id) {
  const x = S.budget.find(i => i.id === id); if (!x) return;
  const done = it => {
    it.paid = true; it.paidAt = today();
    budNextRepeat(it);
    setTimeout(() => toast('Витрачено ✓ −' + bc(+it.amount) + ' від залишку'), 60);
  };
  if (!hasSum(x)) return budAmount(id, done);
  done(x); save(); render(); haptic('medium');
}
function budNextRepeat(x) {
  if (!x || x.repeat !== 'month') return;
  const d = parseD(x.date); const n = new Date(d.getFullYear(), d.getMonth() + 1, Math.min(d.getDate(), 28));
  const nd = ymd(n);
  const nid = (x.rootId || x.id) + '@' + ym(nd);   // однаковий id у обох телефонів — без дублікатів при злитті
  if (S.budget.some(i => i.id === nid || (i.kind === 'out' && !i.paid && i.title === x.title && ym(i.date) === ym(nd)))) { x.repeat = ''; return; }
  S.budget.push({ id: nid, rootId: x.rootId || x.id, kind: 'out', title: x.title, cat: x.cat, amount: x.amount, date: nd, note: x.note, repeat: 'month', paid: false, paidAt: '' });
  x.repeat = '';
}
function budCurPick() {
  formSheet('Валюта бюджету', [{ k: 'c', l: 'Валюта', type: 'select', v: budCur(), opts: Object.entries(CUR).map(([k, c]) => [k, c.l]) }], v => { S.budgetCur = v.c; }, 'Зберегти');
}
