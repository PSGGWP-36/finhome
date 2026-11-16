/* FinHome — new home purchase calculator page */
(function () {
  'use strict';
  const { $, baht, pct, esc, setText } = FH;
  const state = FH.mergeState(FH.BUY_DEFAULTS, FH.readHash().data);

  function render() {
    const b = FH.calcBuy(state), lv = FH.BUY_LEVEL[b.level];
    setText('downHint', b.price ? 'คิดเป็น ' + b.downPct.toFixed(0) + '% ของราคาบ้าน' : '');
    setText('buyMaxLoan', baht(b.maxLoan));
    setText('buyLoan', baht(b.loan));
    const st = $('#buyStatus');
    st.className = 'badge badge--' + lv.tone;
    st.lastElementChild.textContent = lv.label;
    setText('buyStatusNote', b.pass ? lv.note : 'ขาดอีก ' + baht(b.shortfall) + ' — เพิ่มดาวน์ ลดภาระหนี้ หรือกู้ร่วม');
    setText('buyPay', baht(b.pay));
    const dsrEl = $('#buyDsr');
    dsrEl.textContent = b.inc ? pct(b.dsrAfter, 1) : '-';
    dsrEl.style.color = b.dsrAfter <= FH.DSR_GOOD ? 'var(--status-success)' : b.dsrAfter <= FH.DSR_DANGER ? 'var(--gold-700)' : 'var(--status-danger)';
    $('#buyPrinBar').style.width = b.prinPct.toFixed(1) + '%';
    setText('buyPrin', baht(b.prin1));
    setText('buyInt', baht(b.int1));
    $('#buyCosts').innerHTML = b.costs.map(c => `<div class="cost-line"><span>${esc(c.label)}${c.info && FH.infoButton ? FH.infoButton(c.info, 'ประกัน MRTA คืออะไร?') : ''}<small>${esc(c.note)}</small></span><span>${baht(c.value)}</span></div>`).join('');
    setText('buyCostTotal', baht(b.costTotal));
    setText('buyCashNeed', baht(b.cashNeed));

    const tone = d => d <= FH.DSR_GOOD ? 'good' : d <= FH.DSR_DANGER ? 'warn' : 'bad';
    $('#stressTable').innerHTML =
      '<div class="stress__row stress__row--head" role="row"><span role="columnheader">ดอกเบี้ย</span><span role="columnheader">ค่างวด/เดือน</span><span role="columnheader">เพิ่มขึ้น</span><span role="columnheader">DSR</span></div>' +
      b.stress.map(r => `<div class="stress__row" role="row"><span role="cell">${pct(r.rate)}${r.delta ? ` <small>(+${r.delta}%)</small>` : ' <small>(ปัจจุบัน)</small>'}</span><span role="cell"><b>${baht(r.pay)}</b></span><span role="cell">${r.delta ? '+' + baht(r.diff) : '—'}</span><span role="cell"><span class="dsr-pill dsr-pill--${tone(r.dsr)}">${b.inc ? pct(r.dsr, 1) : '-'}</span></span></div>`).join('');

    $('#measureSwitch').setAttribute('aria-checked', String(state.measure));
    $('#reportLink').href = FH.reportUrl('readiness', state);
  }

  FH.ready(() => {
    FH.layout('buy');
    FH.syncFields(state.f, true);
    FH.bindFields(state.f, render);
    $('#measureSwitch').addEventListener('click', () => { state.measure = !state.measure; render(); });
    render();
    FH.icons();
  });
})();
