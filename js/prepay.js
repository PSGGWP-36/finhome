/* FinHome — prepayment (โปะบ้าน) calculator page */
(function () {
  'use strict';
  const { $, baht, setText } = FH;
  const state = FH.mergeState(FH.PREPAY_DEFAULTS, FH.readHash().data);
  let last = null;
  // true = the payment is the user's own figure; false = derived from the remaining years
  let payManual = true;
  function onChange(k) {
    if (k === 'pay') payManual = true;
    if (k === 'years') payManual = false;
    if (!payManual && (k === 'years' || k === 'bal' || k === 'rate')) {
      const auto = FH.prepayAutoPay(state.f);
      if (auto) { state.f.pay = FH.fmt(auto); FH.syncFields(state.f); }
    }
    render();
  }

  function chart(base, plan) {
    const W = 640, H = 220, padL = 52, padR = 12, padT = 10, padB = 28;
    const years = Math.max(base.balances.length, plan.balances.length) - 1 || 1;
    const max = base.balances[0] || 1;
    const x = i => padL + (W - padL - padR) * i / years;
    const y = v => padT + (H - padT - padB) * (1 - v / max);
    const line = arr => arr.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const ticksY = [0, 0.5, 1].map(t => `<line x1="${padL}" x2="${W - padR}" y1="${y(max * t)}" y2="${y(max * t)}" class="chart__grid"/><text x="${padL - 8}" y="${y(max * t) + 4}" text-anchor="end" class="chart__label">${(max * t / 1e6).toFixed(1)}M</text>`).join('');
    const step = years > 20 ? 5 : years > 10 ? 2 : 1;
    let ticksX = '';
    for (let i = 0; i <= years; i += step) ticksX += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" class="chart__label">${i}</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="กราฟยอดหนี้คงเหลือ ผ่อนแบบเดิมหมดใน ${base.balances.length - 1} ปี แบบโปะหมดใน ${plan.balances.length - 1} ปี">
      ${ticksY}${ticksX}
      <polyline points="${line(base.balances)}" fill="none" stroke="var(--slate-400)" stroke-width="2.5" stroke-linejoin="round"/>
      <polyline points="${line(plan.balances)}" fill="none" stroke="var(--navy-700)" stroke-width="3" stroke-linejoin="round"/>
    </svg>`;
  }

  function render() {
    const r = FH.calcPrepay(state);
    last = r;
    const hint = $('#payHint');
    hint.hidden = !(r.bal && r.pay && r.pay <= r.minPay);
    hint.textContent = 'ค่างวดต่ำกว่าดอกเบี้ยต่อเดือน (' + baht(r.minPay) + ') หนี้จะไม่ลดลง';
    let note = '';
    if (!r.termMonths) note = '';
    else if (!payManual) note = 'คำนวณจากระยะผ่อนคงเหลือ · ถ้ารู้ค่างวดจริงจากธนาคาร พิมพ์ทับได้';
    else if (r.base && r.termMonths) {
      const d = r.base.months - r.termMonths;
      note = 'ค่างวดนี้ผ่อนหมดใน ' + FH.months(r.base.months) +
        (Math.abs(d) < 1 ? ' ตรงกับระยะผ่อนที่กรอก' : (d < 0 ? ' เร็วกว่า' : ' ช้ากว่า') + 'ระยะผ่อนที่กรอก ' + FH.months(Math.abs(d)));
    }
    setText('payNote', note);
    if (!r.ok) {
      ['ppSaved', 'ppFaster', 'ppBaseTime', 'ppPlanTime'].forEach(id => setText(id, '—'));
      setText('ppBaseInt', ''); setText('ppPlanInt', '');
      $('#ppChart').innerHTML = '<div class="label-sm" style="padding:24px 0">กรอกยอดหนี้ ดอกเบี้ย และค่างวดให้ครบ (ค่างวดต้องมากกว่าดอกเบี้ยต่อเดือน)</div>';
      $('#ppTable').innerHTML = '';
      return;
    }
    setText('ppSaved', baht(r.saved));
    setText('ppFaster', r.monthsSaved > 0 ? FH.months(r.monthsSaved) : '—');
    setText('ppBaseTime', FH.months(r.base.months));
    setText('ppBaseInt', 'ดอกเบี้ยรวม ' + baht(r.base.interest));
    setText('ppPlanTime', FH.months(r.plan.months));
    setText('ppPlanInt', 'ดอกเบี้ยรวม ' + baht(r.plan.interest) + ' · จ่ายต่อเดือน ' + baht(r.pay + r.extra));
    $('#ppChart').innerHTML = chart(r.base, r.plan);
    $('#ppTable').innerHTML = '<thead><tr><th>ปีที่</th><th>ตัดเงินต้น</th><th>ดอกเบี้ย</th><th>ยอดหนี้คงเหลือ</th></tr></thead><tbody>' +
      r.plan.years.map(y => `<tr><td>${y.year}</td><td>${baht(y.principal)}</td><td>${baht(y.interest)}</td><td>${baht(y.balance)}</td></tr>`).join('') + '</tbody>';
  }

  FH.ready(() => {
    FH.layout('prepay');
    FH.syncFields(state.f, true);
    FH.bindFields(state.f, onChange);
    $('#csvBtn').addEventListener('click', () => {
      if (!last || !last.ok) return;
      const rows = [['ปีที่', 'ตัดเงินต้น', 'ดอกเบี้ย', 'ยอดหนี้คงเหลือ']].concat(last.plan.years.map(y => [y.year, Math.round(y.principal), Math.round(y.interest), Math.round(y.balance)]));
      FH.download('FinHome-prepay-schedule.csv', '﻿' + rows.map(r => r.join(',')).join('\r\n'), 'text/csv;charset=utf-8');
    });
    render();
    FH.icons();
  });
})();
