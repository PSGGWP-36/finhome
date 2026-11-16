/* FinHome — Refinance vs Retention, 3-year offers (refinance.html).
   6-year offers and multi-bank comparison live on refinance-6y.html. */
(function () {
  'use strict';
  const { $, baht, pct, esc, setText } = FH;
  const s = FH.mergeState(FH.REFI_DEFAULTS, FH.readHash().data);
  // this page always compares 3-year offers
  s.horizon = '3';
  s.lockYears = '3';
  if (s.refiMode === 'avg6') s.refiMode = 'avg3';
  let last = null;

  function render() {
    const r = FH.calcRefi(s);
    last = r;

    FH.renderTabs($('#refiModeTabs'), [{ value: 'avg3', label: 'เฉลี่ย 3 ปี' }, { value: 'step', label: 'ขั้นบันได ปีที่ 1–3' }], s.refiMode, v => { s.refiMode = v; render(); });
    $('#avg3Group').hidden = s.refiMode !== 'avg3';
    $('#stepGroup').hidden = s.refiMode !== 'step';

    FH.refiUI.syncCostRows(s, r, render);
    setText('refiCostTotal', FH.refiUI.costTotalText(r));
    FH.refiUI.hints(s, r);

    // headline
    setText('winnerTitle', r.refiWins ? 'Refinance คุ้มกว่า' : 'Retention คุ้มกว่า');
    setText('winnerLine', 'เหลือเงินมากกว่าอีกทางเลือก ' + baht(Math.abs(r.diff)) + ' ใน 3 ปี');
    const gp = FH.gapText(r), pill = $('#gapPill');
    pill.textContent = (gp.ok ? '✓ ' : '✕ ') + gp.text;
    pill.className = 'gap-pill ' + (gp.ok ? 'is-ok' : 'is-bad');
    setText('lockWarn', FH.lockText(r));
    const be = FH.breakEvenText(r);
    setText('breakEven', be.title);
    setText('breakEvenNote', be.note);
    const tg = FH.targetText(r);
    setText('targetVal', tg.value);
    setText('targetNote', tg.note);

    // details: year-by-year rates (years 1–3)
    $('#rateStrip').innerHTML = '<div class="rate-strip__head"><span>ปีที่</span><span>Retention</span><span>Refinance</span></div>' +
      r.yearRates.slice(0, 3).map(y => `<div class="rate-strip__row"><span>${y.year}</span><span>${pct(y.ret)}</span><span class="${y.refi > y.ret ? 'up' : 'down'}">${pct(y.refi)}</span></div>`).join('') +
      `<div class="rate-strip__foot">เฉลี่ย 3 ปี · Retention ${pct(r.retH)} · Refinance ${pct(r.refiH)} · อัตราที่จ่ายจริง ${pct(r.effRet)} / ${pct(r.effRefi)}${FH.infoButton('effective', 'ทำไมตัวเลขต่างจากค่าเฉลี่ยใน Excel?')}</div>`;

    // details: bars
    const maxT = Math.max(...r.opts.map(o => o.interest + o.cost)) || 1;
    $('#costBars').innerHTML = r.opts.map(o => {
      const color = o.k === r.best ? 'var(--navy-700)' : o.k === 'mrr' ? 'var(--slate-400)' : 'var(--navy-300)';
      return `<div class="bar-row"><span>${esc(o.name)}</span><span class="bar-row__track"><span class="bar-row__fill" style="width:${((o.interest + o.cost) / maxT * 100).toFixed(1)}%;background:${color}"></span></span><span class="bar-row__val">${baht(o.interest + o.cost)}</span></div>`;
    }).join('');

    // details: comparison table
    const cls = o => o.k === r.best ? ' is-best' : '';
    const cell = (o, text, color) => `<div class="cmp__cell${cls(o)}" role="cell" style="font-weight:${o.k === r.best ? 600 : 500};color:${color || 'var(--text-strong)'}">${text}</div>`;
    const rows = [
      ['ดอกเบี้ยรวมที่ต้องจ่าย', o => cell(o, baht(o.interest))],
      ['ต้นทุนแฝงทั้งหมด', o => cell(o, o.cost ? baht(o.cost) : '฿0')],
      ['เงินต้นคงเหลือ สิ้นปีที่ 3', o => cell(o, baht(o.b))],
      ['ประหยัดได้สุทธิ (Net Savings)', o => o.k === 'mrr' ? cell(o, '—', 'var(--text-subtle)') : cell(o, FH.signedBaht(o.save), o.save > 0 ? 'var(--money-saving)' : 'var(--status-danger)')]
    ];
    $('#cmpTable').innerHTML =
      '<div class="cmp__row cmp__row--head" role="row"><div class="cmp__corner" role="columnheader">เปรียบเทียบ 3 ปี</div>' +
      r.opts.map(o => `<div class="cmp__col${cls(o)}" role="columnheader"><div class="cmp__badge">${o.k === r.best ? '<span class="badge badge--solid">คุ้มที่สุด</span>' : ''}</div><div class="cmp__name">${esc(o.name)}</div><div class="cmp__rate">${esc(o.rateLabel)}</div></div>`).join('') + '</div>' +
      rows.map(([label, fn]) => `<div class="cmp__row" role="row"><div class="cmp__label" role="rowheader">${esc(label)}</div>${r.opts.map(fn).join('')}</div>`).join('');
    setText('payLabel', baht(r.mp));

    $('#reportLink').href = FH.reportUrl('retention', s);
    FH.refiUI.syncPageTabs(s);
  }

  /* ---------- calendar reminder (.ics generated in the browser) ---------- */
  function icsFold(line) {
    const enc = new TextEncoder();
    let out = '', cur = '', bytes = 0;
    for (const ch of line) {
      const n = enc.encode(ch).length;
      if (bytes + n > 73) { out += cur + '\r\n '; cur = ''; bytes = 1; }
      cur += ch; bytes += n;
    }
    return out + cur;
  }
  const icsText = t => String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const ymd = d => d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');

  function buildIcs(endDate) {
    const bank = FH.shortBank(s.f.bank), target = last ? FH.targetText(last).short : '';
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const events = [
      [90, 'FinHome: อีก 90 วันหมดโปรดอกเบี้ยบ้าน', `เริ่มขอข้อเสนอ Refinance จากธนาคารอื่น และติดต่อ ${bank} เพื่อขอ Retention · Target Retention Rate ≤ ${target}`],
      [30, 'FinHome: อีก 30 วันหมดโปรดอกเบี้ยบ้าน', `ยื่นเรื่องขอ Retention กับ ${bank} หรือยื่น Refinance ให้ทันก่อนดอกเบี้ยลอยตัว · สร้างเอกสารต่อรองได้ที่ FinHome`],
      [0, 'FinHome: วันหมดโปรดอกเบี้ยบ้าน', 'ตรวจสอบอัตราดอกเบี้ยใหม่ในใบแจ้งยอด หากยังไม่ได้ Retention หรือ Refinance ดอกเบี้ยจะเป็นแบบลอยตัว']
    ];
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FinHome//Promo Reminder//TH', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    events.forEach(([before, title, desc], i) => {
      const d = new Date(endDate); d.setDate(d.getDate() - before);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      lines.push('BEGIN:VEVENT', `UID:finhome-${ymd(endDate)}-${i}-${Math.random().toString(36).slice(2, 10)}@finhome`, 'DTSTAMP:' + stamp,
        'DTSTART;VALUE=DATE:' + ymd(d), 'DTEND;VALUE=DATE:' + ymd(next),
        'SUMMARY:' + icsText(title), 'DESCRIPTION:' + icsText(desc), 'TRANSP:TRANSPARENT',
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsText(title), 'TRIGGER:PT9H', 'END:VALARM', 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.map(icsFold).join('\r\n') + '\r\n';
  }

  FH.ready(() => {
    FH.layout('refinance');
    FH.fillBankSelects();
    FH.refiUI.buildCostRows($('#costRows'));
    FH.syncFields(s.f, true);
    FH.bindFields(s.f, render);
    FH.refiUI.bindCostEvents(s, render);

    const dateEl = $('#promoEnd'), btn = $('#icsBtn');
    dateEl.addEventListener('input', () => { btn.disabled = !dateEl.value; });
    btn.addEventListener('click', () => {
      if (!dateEl.value) return;
      const [y, m, d] = dateEl.value.split('-').map(Number);
      FH.download('FinHome-promo-reminder.ics', buildIcs(new Date(y, m - 1, d)), 'text/calendar;charset=utf-8');
    });

    render();
    FH.icons();
  });
})();
