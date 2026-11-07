/* ===== Tandem: вітальний екран і обов'язкове запрошення партнера ===== */
const APP_NAME = 'Tandem';
let gateTimer = null;
const welcomed = () => { try { return localStorage.getItem('welcomed') === '1'; } catch (e) { return true; } };
function gateEl() { return document.getElementById('gate'); }
function hideGate() {
  const g = gateEl(); if (g) g.classList.remove('show');
  clearInterval(gateTimer); gateTimer = null;
  document.body.classList.remove('gated');
}
function showGate(html) {
  const g = gateEl(); if (!g) return;
  g.innerHTML = html; g.classList.add('show'); document.body.classList.add('gated');
  try { tg && tg.BackButton.hide(); } catch (e) {}
}
function showWelcome() {
  showGate(`<div class="gate-in">
    <img class="gate-art" src="img/tandem.webp" alt="">
    <h1 class="gate-title">${APP_NAME}</h1>
    <div class="gate-heart">—— ♡ ——</div>
    <p class="gate-sub">Усе важливе — в одному місці ♡</p>
    <ul class="gate-list"><li>💌 записки й побачення наосліп</li><li>🛒 спільні покупки, справи й вішлист</li><li>🐶 турбота про улюбленця</li><li>🐷 скарбнички на спільні мрії</li></ul>
    <button class="gate-btn" onclick="startApp()">Почати</button>
  </div>`);
}
function startApp() {
  try { localStorage.setItem('welcomed', '1'); } catch (e) {}
  haptic('medium');
  checkGate(true);
}
function partnerJoined() { return (Sync.members || []).length >= 2; }
function checkGate(fromWelcome) {
  if (!welcomed()) return showWelcome();
  if (ONLINE && Sync.ready && !partnerJoined()) return showInviteGate();
  if (fromWelcome && !ONLINE) toast('Тестовий режим: дані лише на цьому пристрої');
  hideGate();
}
function showInviteGate() {
  const link = inviteLink();
  showGate(`<div class="gate-in">
    <img class="gate-art small" src="img/tandem.webp" alt="">
    <h2 class="gate-h2">Запроси свою половинку 💌</h2>
    <p class="gate-sub">${APP_NAME} працює для двох: усе, що ви додаєте, бачите обоє. Надішли посилання партнеру — і почнемо!</p>
    <button class="gate-btn" onclick="shareInvite()">💌 Надіслати запрошення</button>
    ${link ? `<button class="gate-btn ghost" onclick="copyText(inviteLink())">📋 Скопіювати посилання</button>` : ''}
    <div class="gate-wait"><span class="dot"></span>Чекаємо, поки партнер відкриє посилання…</div>
    <p class="gate-note">Партнеру треба натиснути на посилання, потім <b>Start</b> у боті та відкрити додаток.</p>
  </div>`);
  clearInterval(gateTimer);
  gateTimer = setInterval(async () => {
    if (document.hidden) return;
    try {
      const r = await api('hello');
      if (r && r.members) Sync.members = r.members;
      if (partnerJoined()) {
        hideGate();
        if (r.state && Object.keys(r.state).length) { Sync.base = clone(r.state); Sync.version = r.version; applyState(clone(r.state)); }
        const p = Sync.members.find(m => m.slot !== Sync.slot);
        if (p && p.first_name && ['Коханий', 'Кохана', 'Я', 'Партнер', ''].includes(S.names[p.slot])) { S.names[p.slot] = p.first_name; save(); }
        render(); celebrate(); toast('Ви тепер разом у ' + APP_NAME + ' 💛');
      }
    } catch (e) {}
  }, 5000);
}
