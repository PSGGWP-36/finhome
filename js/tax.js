/* FinHome — home-loan interest tax deduction page */
(function () {
  'use strict';
  const { $, baht, esc, setText } = FH;
  const state = FH.mergeState(FH.TAX_DEFAULTS, FH.readHash().data);

  function render() {
    const t = FH.calcTax(state);
    setText('txSaved', baht(t.saved));
    setText('txLine', 'ลดหย่อนได้ ' + baht(t.deduction) + (t.n > 1 ? ' (เฉลี่ยจากผู้กู้ร่วม ' + t.n + ' คน)' : '') +
      ' · ฐานภาษีสูงสุดของคุณ ' + Math.round(t.marginal * 100) + '%' + (t.capped ? ' · ดอกเบี้ยเกินเพดาน ฿100,000' : ''));
    const rows = [
      ['รายได้ทั้งปี', baht(t.income)],
      ['หักค่าใช้จ่าย (50% ไม่เกิน ฿100,000)', '-' + baht(t.expense)],
      ['ลดหย่อนส่วนตัว', '-' + baht(t.personal)],
      ['ค่าลดหย่อนอื่นๆ', '-' + baht(t.other)],
      ['เงินได้สุทธิก่อนลดหย่อนดอกเบี้ยบ้าน', baht(t.netBefore), true],
      ['ลดหย่อนดอกเบี้ยบ้าน', '-' + baht(t.deduction)],
      ['เงินได้สุทธิหลังลดหย่อน', baht(t.netAfter), true],
      ['ภาษีก่อนลดหย่อนดอกเบี้ยบ้าน', baht(t.taxBefore)],
      ['ภาษีหลังลดหย่อนดอกเบี้ยบ้าน', baht(t.taxAfter)]
    ];
    $('#txRows').innerHTML = rows.map(([l, v, strong]) => `<div class="cost-line${strong ? ' cost-line--strong' : ''}"><span>${esc(l)}</span><span>${v}</span></div>`).join('') +
      `<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline"><span style="font-weight:600;color:var(--text-strong)">ภาษีที่ประหยัดได้</span><span class="disp" style="font-weight:600;font-size:22px;color:var(--money-saving)">${baht(t.saved)}</span></div>`;
  }

  FH.ready(() => {
    FH.layout('tax');
    FH.syncFields(state.f, true);
    FH.bindFields(state.f, render);
    render();
    FH.icons();
  });
})();
