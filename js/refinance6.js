/* FinHome — compare 6-year refinance offers from several banks against Retention (refinance-6y.html). */
(function () {
  'use strict';
  const { $, baht, pct, esc, setText } = FH;
  const s = FH.mergeState(FH.REFI_DEFAULTS, FH.readHash().data);
  s.horizon = '6';

  const MAX_OFFERS = 7;
  // anonymised market survey (years 1–5, year 6 = MRR)
  const SAMPLE = [[3, 3, 3, 3.2, 3.2, 6.045], [3, 3, 3, 3, 3, 6.145], [3.1, 3.1, 3.1, 3.2, 3.2, 6.5], [2.3, 2.4, 2.5, 2.6, 2.7, 6.575],
    [2.4, 2.5, 2.6, 2.7, 2.8, 6.58], [3.1, 3.1, 3.1, 3.1, 3.1, 6.67], [2.89, 2.89, 2.89, 2.89, 2.89, 7.1]];
  const blankOffer = () => ({ bank: '', rates: ['', '', '', '', '', ''], lock: '6' });
  let offers = [blankOffer(), blankOffer()];
  const offerName = (o, i) => o.bank ? FH.shortBank(o.bank) : 'ข้อเสนอ ' + (i + 1);
  const retRates = () => { const a = FH.retentionAfter(s); return [0, 1, 2, 3, 4, 5].map(y => y < 3 || a.same ? FH.num(s.f.ret) : a.rate); };

  /** Full calculation for one offer, reusing the main engine (break-even, rate gap, lock-in). */
  const calcOffer = o => FH.calcRefi(Object.assign({}, s, {
    refiMode: 'step', lockYears: o.lock,
    f: Object.assign({}, s.f, { y1: o.rates[0], y2: o.rates[1], y3: o.rates[2], y4: o.rates[3], y5: o.rates[4], y6: o.rates[5] })
  }));

  /* ---------- offers table ---------- */
  function buildOffers() {
    const bankOpts = sel => '<option value="">ไม่ระบุธนาคาร</option>' + FH.BANKS.map(b => `<option value="${esc(b)}"${b === sel ? ' selected' : ''}>${esc(b)}</option>`).join('');
    $('#offerTable').innerHTML = `
      <thead><tr><th scope="col">ข้อเสนอ</th>${[1, 2, 3, 4, 5].map(y => `<th scope="col">ปีที่ ${y}</th>`).join('')}<th scope="col">ปีที่ 6+</th>
        <th scope="col">ห้ามไถ่ถอน</th><th scope="col">เฉลี่ย 6 ปี</th><th scope="col">จ่ายจริง</th><th scope="col">ต้นทุน 6 ปี</th><th scope="col">เทียบ Retention</th><th scope="col"><span class="sr-only">ลบ</span></th></tr></thead>
      <tbody>
        <tr class="offers__ret"><th scope="row">Retention ธนาคารเดิม</th><td colspan="6" id="offRetRates"></td><td>—</td><td id="offRetAvg"></td><td id="offRetEff"></td><td id="offRetTotal"></td><td>ฐานเปรียบเทียบ</td><td></td></tr>
        ${offers.map((o, i) => `
        <tr data-offer-row="${i}">
          <th scope="row"><span class="offers__name"><span class="offers__rank" data-rank="${i}"></span><select data-offer="${i}" data-field="bank" aria-label="ธนาคารของข้อเสนอ ${i + 1}">${bankOpts(o.bank)}</select></span></th>
          ${o.rates.map((v, y) => `<td><input inputmode="decimal" data-offer="${i}" data-y="${y}" value="${esc(v)}" aria-label="ข้อเสนอ ${i + 1} ปีที่ ${y + 1}${y === 5 ? '+' : ''}" placeholder="%"></td>`).join('')}
          <td><select data-offer="${i}" data-field="lock" aria-label="ระยะห้ามไถ่ถอนของข้อเสนอ ${i + 1}"><option value="3"${o.lock === '3' ? ' selected' : ''}>3 ปี</option><option value="6"${o.lock === '6' ? ' selected' : ''}>6 ปี</option></select></td>
          <td data-out="avg"></td><td data-out="eff"></td><td data-out="total"></td><td data-out="vs"></td>
          <td class="offers__btns"><button type="button" class="offers__del" data-del="${i}" aria-label="ลบข้อเสนอ ${i + 1}" title="ลบ">×</button></td>
        </tr>`).join('')}
      </tbody>`;
    $('#offerAdd').disabled = offers.length >= MAX_OFFERS;
    render();
  }

  function render() {
    const base = FH.calcRefi(s);
    FH.refiUI.syncCostRows(s, base, render);
    setText('refiCostTotal', FH.refiUI.costTotalText(base));
    FH.refiUI.hints(s, base);
    FH.renderTabs($('#retAfterTabs'), [{ value: 'renew', label: 'ขอ Retention ซ้ำ' }, { value: 'float', label: 'ปล่อยลอยตัว' }], s.retAfterMode, v => { s.retAfterMode = v; render(); });
    $('#retRenewField').hidden = s.retAfterMode !== 'renew';
    $('#retFloatField').hidden = s.retAfterMode !== 'float';
    $('#retRenewInput').placeholder = s.f.ret || '';
    FH.refiUI.syncPageTabs(s);
    if (!$('#offRetRates')) return;

    const c = FH.compareOffers(s, offers), rr = retRates();
    setText('offRetRates', rr.map(v => pct(v)).join(' · '));
    setText('offRetAvg', pct(rr.reduce((a, b) => a + b, 0) / 6));
    setText('offRetEff', pct(c.retEff));
    setText('offRetTotal', baht(c.iT));
    const byIndex = Object.fromEntries(c.rows.map((r, rank) => [r.i, Object.assign({ rank: rank + 1 }, r)]));
    offers.forEach((o, i) => {
      const tr = $(`[data-offer-row="${i}"]`), r = byIndex[i], out = k => $(`[data-out="${k}"]`, tr);
      $(`[data-rank="${i}"]`).textContent = r ? '#' + r.rank : '';
      tr.classList.toggle('is-best', !!r && r.rank === 1);
      out('avg').textContent = r ? pct(r.avg) : '—';
      out('eff').textContent = r ? pct(r.eff) : '—';
      out('total').textContent = r ? baht(r.total) : '—';
      const vs = out('vs');
      vs.textContent = r ? (r.vsRet > 0 ? 'ถูกกว่า ' + baht(r.vsRet) : 'แพงกว่า ' + baht(-r.vsRet)) : '—';
      vs.className = r ? (r.vsRet > 0 ? 'pos' : 'neg') : '';
    });

    renderHero(c);
    renderMatrix(c, rr);
  }

  function renderHero(c) {
    const has = c.rows.length > 0;
    $('#kpis6').hidden = !has;
    $('#lockBox').hidden = !has;
    $('#gapPill').hidden = !has;
    if (!has) {
      setText('winnerTitle', 'ใส่ข้อเสนอที่ได้รับ');
      setText('winnerLine', 'กรอกอัตรารายปีในตาราง "ข้อเสนอ Refinance ที่ได้รับ" ด้านล่าง หรือกด "ใส่ตัวอย่างจากตลาด"');
      return;
    }
    const best = c.rows[0], o = offers[best.i], name = offerName(o, best.i), r = calcOffer(o);
    const retWins = best.vsRet <= 0;
    setText('winnerTitle', retWins ? 'Retention คุ้มกว่าทุกข้อเสนอ' : name + ' คุ้มกว่า Retention');
    setText('winnerLine', retWins
      ? 'ถูกกว่าข้อเสนอที่ดีที่สุด ' + baht(-best.vsRet) + ' ใน 6 ปี'
      : 'เหลือเงินมากกว่า Retention ' + baht(best.vsRet) + ' ใน 6 ปี');
    const gp = FH.gapText(r), pill = $('#gapPill');
    pill.textContent = (gp.ok ? '✓ ' : '✕ ') + gp.text.replace('ข้อเสนอนี้', name + ' ');
    pill.className = 'gap-pill ' + (gp.ok ? 'is-ok' : 'is-bad');
    setText('bestName', name);
    const beT = FH.breakEvenText(r).title;
    setText('bestNote', 'เฉลี่ย 6 ปี ' + pct(best.avg) + ' · จ่ายจริง ' + pct(best.eff) + ' · ' + (r.be ? 'คืนทุน' + beT : beT));
    setText('targetVal', '≤ ' + pct(c.target));
    setText('lockWarn', name + ': ' + FH.lockText(r));
  }

  function renderMatrix(c, rr) {
    const live = offers.map((o, i) => ({ o, i, row: c.rows.find(x => x.i === i) })).filter(x => x.row);
    if (!live.length) { $('#yearMatrix').innerHTML = '<tbody><tr><td class="label-sm" style="text-align:left">ยังไม่มีข้อเสนอ</td></tr></tbody>'; return; }
    const head = '<thead><tr><th scope="col">ปีที่</th><th scope="col">Retention</th>' + live.map(x => `<th scope="col">${esc(offerName(x.o, x.i))}</th>`).join('') + '</tr></thead>';
    const years = [0, 1, 2, 3, 4, 5].map(y => `<tr><th scope="row">${y + 1}${y === 5 ? '+' : ''}</th><td>${pct(rr[y])}</td>` +
      live.map(x => { const v = FH.num(x.o.rates[y]); return `<td class="${v > rr[y] ? 'neg' : 'pos'}">${pct(v)}</td>`; }).join('') + '</tr>').join('');
    const foot = [
      ['เฉลี่ย 6 ปี', pct(rr.reduce((a, b) => a + b, 0) / 6), x => pct(x.row.avg)],
      ['จ่ายจริง (ตามยอดหนี้)', pct(c.retEff), x => pct(x.row.eff)],
      ['ดอกเบี้ยรวม 6 ปี', baht(c.iT), x => baht(x.row.interest)],
      ['+ ต้นทุนแฝง', '฿0', () => baht(c.costs)],
      ['ต้นทุนรวม 6 ปี', baht(c.iT), x => '<b>' + baht(x.row.total) + '</b>']
    ].map(([l, ret, fn]) => `<tr class="offers__sum"><th scope="row">${l}</th><td>${ret}</td>${live.map(fn).map(v => `<td>${v}</td>`).join('')}</tr>`).join('');
    $('#yearMatrix').innerHTML = head + '<tbody>' + years + foot + '</tbody>';
  }

  function bindOffers() {
    const tbl = $('#offerTable');
    tbl.addEventListener('input', e => {
      const el = e.target, i = Number(el.dataset.offer);
      if (el.dataset.y === undefined || isNaN(i)) return;
      let v = el.value.replace(/[^0-9.]/g, ''); const d = v.indexOf('.');
      if (d >= 0) v = v.slice(0, d + 1) + v.slice(d + 1).replace(/\./g, '');
      if (v !== el.value) el.value = v;
      offers[i].rates[Number(el.dataset.y)] = v;
      render();
    });
    tbl.addEventListener('change', e => {
      const el = e.target, i = Number(el.dataset.offer);
      if (!el.dataset.field || isNaN(i)) return;
      offers[i][el.dataset.field] = el.dataset.field === 'bank' ? (FH.BANKS.includes(el.value) ? el.value : '') : (el.value === '3' ? '3' : '6');
      render();
    });
    tbl.addEventListener('click', e => {
      const del = e.target.closest('[data-del]');
      if (del) { offers.splice(Number(del.dataset.del), 1); if (!offers.length) offers.push(blankOffer()); buildOffers(); }
    });
    $('#offerAdd').addEventListener('click', () => { if (offers.length < MAX_OFFERS) { offers.push(blankOffer()); buildOffers(); } });
    $('#offerSample').addEventListener('click', () => {
      offers = SAMPLE.map(r => ({ bank: '', rates: r.map(String), lock: '6' }));
      buildOffers();
    });
  }

  FH.ready(() => {
    FH.layout('refinance');
    FH.fillBankSelects();
    FH.refiUI.buildCostRows($('#costRows'));
    FH.syncFields(s.f, true);
    FH.bindFields(s.f, render);
    FH.refiUI.bindCostEvents(s, render);
    bindOffers();
    buildOffers();
    FH.icons();
  });
})();
