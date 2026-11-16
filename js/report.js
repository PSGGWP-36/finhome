/* FinHome — printable one-page reports (generated in the browser, never sent anywhere)
   report.html#t=retention&d=…  → Retention Negotiation Kit
   report.html#t=readiness&d=…  → Homebuyer Readiness Report */
(function () {
  'use strict';
  const { $, baht, pct, esc, shortBank } = FH;
  const hash = FH.readHash();
  const type = hash.type === 'retention' || hash.type === 'readiness' ? hash.type : null;
  let state = null;

  const today = FH.thaiDate();
  const nameLine = () => { const n = $('#rpName').value.trim(); return n ? esc(n) : '<span class="rp-blank"></span>'; };
  const dl = rows => '<dl class="rp-dl">' + rows.filter(Boolean).map(([k, v, cls]) => `<dt>${k}</dt><dd${cls ? ` class="${cls}"` : ''}>${v}</dd>`).join('') + '</dl>';
  const checklist = items => '<ul class="rp-check">' + items.map(i => `<li>${esc(i)}</li>`).join('') + '</ul>';
  const footer = extra => `<footer class="rp-foot">จัดทำโดยผู้ใช้ด้วยเครื่องมือ FinHome เมื่อ ${today} · <b>ไม่ใช่เอกสารจากธนาคาร</b> · ตัวเลขเป็นการประมาณการจากข้อมูลที่ผู้ใช้กรอก ${extra} อัตราดอกเบี้ย ค่าธรรมเนียม วงเงิน และเงื่อนไขจริงขึ้นอยู่กับการพิจารณาของธนาคาร</footer>`;
  const head = title => `
    <div class="rp-head">
      <img src="assets/logo-wordmark.png" alt="FinHome." class="rp-logo">
      <div class="rp-head__meta">วันที่จัดทำ ${today}</div>
    </div>
    <h1 class="rp-title">${title}</h1>`;

  /* ================= Retention Negotiation Kit ================= */
  function retention() {
    const s = state, r = FH.calcRefi(s);
    const bank = esc(s.f.bank), newBank = esc(s.f.newBank), bs = esc(shortBank(s.f.bank)), ns = esc(shortBank(s.f.newBank));
    const h = r.horizon;
    const best = k => k === r.best ? ' class="is-best"' : '';
    const cols = [['mrr', `ลอยตัว MRR<small>${bs}</small>`], ['ret', `Retention<small>${bs}</small>`], ['refi', `Refinance<small>${ns}</small>`]];
    const o = Object.fromEntries(r.opts.map(x => [x.k, x]));
    const row = (label, fn) => `<tr><th scope="row">${label}</th>${cols.map(([k]) => `<td${best(k)}>${fn(o[k])}</td>`).join('')}</tr>`;
    const tg = FH.targetText(r), be = FH.breakEvenText(r);
    const points = [
      `ปัจจุบันผ่อนกับ${bank} ยอดหนี้คงเหลือ ${baht(r.bal)} ค่างวด ${baht(r.mp)}/เดือน หากไม่ปรับอัตรา ดอกเบี้ยลอยตัวอยู่ที่ ${pct(r.mrr)}`,
      r.refiWins
        ? `ได้รับข้อเสนอ Refinance จาก${newBank} อัตราเฉลี่ย ${h} ปี ${pct(r.refiH)} ซึ่งหลังหักค่าใช้จ่ายการย้าย ${baht(r.costs)} แล้ว ยังประหยัดกว่าข้อเสนอ Retention (เฉลี่ย ${h} ปี ${pct(r.retH)}) อยู่ ${baht(r.diff)} ใน ${h} ปี`
        : `เปรียบเทียบข้อเสนอ Refinance จาก${newBank} (เฉลี่ย ${h} ปี ${pct(r.refiH)}) แล้ว ข้อเสนอ Retention (เฉลี่ย ${h} ปี ${pct(r.retH)}) คุ้มกว่าการย้าย ${baht(-r.diff)} ใน ${h} ปี จึงประสงค์ใช้บริการกับธนาคารต่อ`,
      r.target === null
        ? `ขอให้พิจารณาลดอัตราหลังหมดโปรโมชัน (ปัจจุบัน ${pct(r.retAfter)}) ควบคู่กับอัตรา 3 ปีแรก เพื่อให้ใกล้เคียงข้อเสนอจากธนาคารใหม่`
        : r.ret <= r.target
          ? `ขอยืนยันอัตรา Retention เฉลี่ย 3 ปี <b>${pct(r.ret)}</b> ตามที่เสนอ (หรือต่ำกว่า) เพื่อใช้บริการกับธนาคารต่อ`
          : `ขอให้พิจารณาอัตรา Retention เฉลี่ย 3 ปี <b>ไม่เกิน ${pct(r.target)}</b> เพื่อใช้บริการกับธนาคารต่อ`,
      'ขอทราบค่าธรรมเนียมการขอ Retention (ถ้ามี) ตารางอัตราดอกเบี้ยรายปีหลังหมดโปร และระยะเวลาผูกพันของอัตราใหม่'
    ];
    return `
      ${head('ข้อมูลประกอบการขอปรับลดอัตราดอกเบี้ยสินเชื่อบ้าน')}
      <div class="rp-sub"><span>ถึง: <b>${bank}</b></span><span>ผู้กู้: ${nameLine()}</span></div>

      <div class="rp-grid">
        <section class="rp-box">
          <h2>สินเชื่อปัจจุบัน</h2>
          ${dl([
            ['ยอดหนี้คงเหลือ', baht(r.bal)],
            ['ค่างวดต่อเดือน', baht(r.mp)],
            ['สัญญาคงเหลือ', esc(FH.num(s.f.remain)) + ' ปี'],
            ['อัตราลอยตัว (MRR) หากไม่ปรับ', pct(r.mrr)],
            ['อัตรา Retention ที่ได้รับเสนอ', pct(r.ret) + ' เฉลี่ย 3 ปี'],
            ['ปีที่ 4–6', r.retAfterMode === 'float' ? 'ลอยตัว ' + pct(r.retAfter) : r.retSame ? 'ขอ Retention ซ้ำ (อัตราเดิม)' : 'ขอ Retention ซ้ำ ' + pct(r.retAfter)]
          ])}
        </section>
        <section class="rp-target">
          <div class="rp-target__label">อัตราดอกเบี้ยเป้าหมาย<br>(Target Retention Rate)</div>
          <div class="rp-target__val">${esc(tg.value)}</div>
          <div class="rp-target__note">${r.target === null ? esc(tg.note) : `เฉลี่ย 3 ปีแรก · มุมมอง ${h} ปี · ที่อัตรานี้ การอยู่กับ ${bs} ต่อ คุ้มเท่ากับการย้ายไป ${ns} หลังหักค่าใช้จ่ายการย้าย ${baht(r.costs)}`}</div>
        </section>
      </div>

      <section class="rp-section">
        <h2>เปรียบเทียบ 3 ทางเลือกในระยะ ${h} ปี <small>(ค่างวดเท่าเดิม ${baht(r.mp)}/เดือน)</small></h2>
        <table class="rp-table">
          <thead><tr><th scope="col">รายการ</th>${cols.map(([k, l]) => `<th scope="col"${best(k)}>${l}${k === r.best ? '<span class="rp-best">คุ้มที่สุด</span>' : ''}</th>`).join('')}</tr></thead>
          <tbody>
            ${row('อัตราดอกเบี้ย', x => esc(x.rateLabel))}
            ${row('ดอกเบี้ยรวม', x => baht(x.interest))}
            ${row('ค่าใช้จ่ายการย้าย', x => x.cost ? baht(x.cost) : '฿0')}
            ${row('เงินต้นคงเหลือ สิ้นปีที่ ' + h, x => baht(x.b))}
            ${row('ประหยัดสุทธิเทียบลอยตัว', x => x.k === 'mrr' ? '—' : `<b class="${x.save > 0 ? 'pos' : 'neg'}">${FH.signedBaht(x.save)}</b>`)}
          </tbody>
        </table>
      </section>

      <div class="rp-grid">
        <section class="rp-box">
          <h2>ค่าใช้จ่ายหากย้ายไป ${ns}</h2>
          ${dl(r.costItems.map(c => [esc(c.label), c.waived ? 'ธนาคารออกให้ (' + baht(c.value) + ')' : baht(c.value)]).concat([
            ['รวมค่าใช้จ่ายการย้าย', baht(r.costs), 'strong'],
            ['จุดคุ้มทุนเทียบ Retention', esc(be.title), 'strong']
          ]))}
          <div class="rp-note">${esc(be.note)} · ${esc(FH.gapText(r).text)}</div>
          <div class="rp-note rp-note--warn">🔒 ${esc(FH.lockText(r))}</div>
        </section>
        <section class="rp-box">
          <h2>ประเด็นที่ใช้เจรจา</h2>
          <ol class="rp-points">${points.map(p => `<li>${p}</li>`).join('')}</ol>
        </section>
      </div>

      <section class="rp-box">
        <h2>สิ่งที่ควรเตรียมไปธนาคาร</h2>
        ${checklist(['สำเนาบัตรประชาชน', 'สัญญาเงินกู้และสัญญาจำนองเดิม', 'ใบแจ้งยอดหนี้หรือตารางผ่อนชำระล่าสุด', 'ใบข้อเสนอ / Pre-approve จากธนาคารใหม่ (ถ้ามี)', 'เอกสารฉบับนี้'])}
      </section>
      ${footer('คำนวณจากค่างวดคงที่ และดอกเบี้ยตามที่ระบุ')}`;
  }

  /* ================= Homebuyer Readiness Report ================= */
  const DOCS = {
    common: ['สำเนาบัตรประชาชน และทะเบียนบ้าน', 'ทะเบียนสมรส / หย่า / ใบเปลี่ยนชื่อ (ถ้ามี)', 'ใบจอง หรือสัญญาจะซื้อจะขาย', 'สำเนาโฉนดที่ดิน (กรณีบ้านมือสอง)'],
    salaried: ['สลิปเงินเดือนย้อนหลัง 3–6 เดือน', 'หนังสือรับรองเงินเดือน (ไม่เกิน 1–3 เดือน)', 'Statement บัญชีเงินเดือนย้อนหลัง 6 เดือน', 'หนังสือรับรองการหักภาษี (50 ทวิ) / ภ.ง.ด.91'],
    freelance: ['Statement บัญชีที่รับรายได้ย้อนหลัง 6–12 เดือน', 'สัญญาจ้าง ใบแจ้งหนี้ หรือหลักฐานการรับเงิน', 'หนังสือรับรองการหักภาษี (50 ทวิ) จากผู้ว่าจ้าง', 'ภ.ง.ด.90 ย้อนหลัง 1–2 ปี'],
    business: ['หนังสือรับรองบริษัท / ทะเบียนพาณิชย์', 'Statement บัญชีธุรกิจย้อนหลัง 6–12 เดือน', 'งบการเงิน หรือ ภ.พ.30 ย้อนหลัง', 'ภ.ง.ด.ย้อนหลัง 1–2 ปี และรูปถ่ายกิจการ']
  };
  const NEXT = {
    ready: ['ขอ Pre-approve จากธนาคาร 2–3 แห่ง เพื่อเทียบข้อเสนอ', 'เทียบดอกเบี้ยเฉลี่ย 3 ปีและค่าธรรมเนียม ไม่ใช่แค่ดอกเบี้ยปีแรก', 'ไม่ก่อหนี้ใหม่ และชำระหนี้ตรงเวลาจนกว่าจะโอนบ้าน'],
    prepare: ['เพิ่มเงินดาวน์ หรือเลือกบ้านราคาต่ำลง เพื่อลดยอดกู้', 'ปิดหรือลดหนี้บัตรเครดิต/สินเชื่ออื่น เพื่อลด DSR', 'พิจารณากู้ร่วมกับผู้มีรายได้ที่มีหลักฐาน'],
    risk: ['ลดภาระหนี้เดิมก่อนยื่นกู้ ให้ DSR หลังกู้ไม่เกิน 40%', 'เพิ่มเงินดาวน์ หรือเลือกบ้านราคาต่ำลง', 'พิจารณากู้ร่วม หรือเพิ่มรายได้ที่มีหลักฐานยืนยัน']
  };

  function readiness() {
    const b = FH.calcBuy(state), lv = FH.BUY_LEVEL[b.level];
    const occ = DOCS[state.occupation] ? state.occupation : 'salaried';
    const scale = 70; // DSR gauge 0–70%
    const pos = v => Math.min(100, Math.max(0, v / scale * 100)).toFixed(1) + '%';
    const tone = d => d <= FH.DSR_GOOD ? 'good' : d <= FH.DSR_DANGER ? 'warn' : 'bad';
    return `
      ${head('รายงานความพร้อมก่อนกู้ซื้อบ้าน <small>Homebuyer Readiness Report</small>')}
      <div class="rp-sub"><span>จัดทำสำหรับ: ${nameLine()}</span><span>อาชีพ: ${esc($('#rpOcc').selectedOptions[0].textContent)}</span></div>

      <div class="rp-status rp-status--${b.level}">
        <span class="rp-status__dot"></span>
        <div><b>${lv.label}</b><span>${b.pass ? lv.note : 'ยอดกู้เกินวงเงินที่ประเมินได้ ' + baht(b.shortfall) + ' — ' + lv.note}</span></div>
      </div>

      <div class="rp-grid">
        <section class="rp-box">
          <h2>ตัวเลขสำคัญ</h2>
          ${dl([
            ['ราคาบ้าน', baht(b.price)],
            ['เงินดาวน์', baht(b.down) + ` (${b.downPct.toFixed(0)}%)`],
            ['ยอดที่ต้องกู้', baht(b.loan), 'strong'],
            ['วงเงินกู้ที่ประเมินได้ (DSR 40%)', baht(b.maxLoan)],
            b.shortfall > 0 ? ['ส่วนที่ยังขาด', baht(b.shortfall), 'neg'] : null,
            ['ระยะเวลากู้ / ดอกเบี้ยเฉลี่ย', b.yrs + ' ปี / ' + pct(b.rate)],
            ['ค่างวดต่อเดือน', baht(b.pay), 'strong']
          ])}
        </section>
        <section class="rp-box">
          <h2>สัดส่วนหนี้ต่อรายได้ (DSR)</h2>
          ${dl([['รายได้ต่อเดือน', baht(b.inc)], ['ภาระหนี้เดิมต่อเดือน', baht(b.debt)], ['DSR ก่อนกู้', pct(b.dsrBefore, 1)]])}
          <div class="rp-dsr">
            <div class="rp-dsr__head"><span>DSR หลังกู้</span><b class="tone-${tone(b.dsrAfter)}">${b.inc ? pct(b.dsrAfter, 1) : '-'}</b></div>
            <div class="rp-gauge"><span class="rp-gauge__fill tone-bg-${tone(b.dsrAfter)}" style="width:${pos(b.dsrAfter)}"></span><i style="left:${pos(40)}"></i><i style="left:${pos(50)}"></i></div>
            <div class="rp-gauge__labels"><span style="left:${pos(40)}">40% ดี</span><span style="left:${pos(50)}">50% อันตราย</span></div>
          </div>
        </section>
      </div>

      <section class="rp-section">
        <h2>ถ้าดอกเบี้ยขึ้น ค่างวดจะเป็นเท่าไหร่</h2>
        <table class="rp-table rp-table--compact">
          <thead><tr><th scope="col">ดอกเบี้ย</th><th scope="col">ค่างวด/เดือน</th><th scope="col">เพิ่มขึ้น</th><th scope="col">DSR หลังกู้</th></tr></thead>
          <tbody>${b.stress.map(r => `<tr><th scope="row">${pct(r.rate)} ${r.delta ? '(+' + r.delta + '%)' : '(ปัจจุบัน)'}</th><td>${baht(r.pay)}</td><td>${r.delta ? '+' + baht(r.diff) : '—'}</td><td><b class="tone-${tone(r.dsr)}">${b.inc ? pct(r.dsr, 1) : '-'}</b></td></tr>`).join('')}</tbody>
        </table>
      </section>

      <div class="rp-grid">
        <section class="rp-box">
          <h2>เงินที่ต้องเตรียมในวันโอน</h2>
          ${dl(b.costs.map(c => [esc(c.label), baht(c.value)]).concat([
            ['เงินดาวน์', baht(b.down)],
            ['รวมเงินสดที่ต้องเตรียม', baht(b.cashNeed), 'strong']
          ]))}
          ${state.measure ? '<div class="rp-note">คำนวณตามมาตรการลดค่าโอน-จดจำนอง 0.01% ตรวจสอบเงื่อนไขมาตรการก่อนใช้</div>' : ''}
        </section>
        <section class="rp-box">
          <h2>เงินสำรองและขั้นตอนถัดไป</h2>
          ${dl([['เงินสำรองหลังโอนที่แนะนำ', baht(b.reserve[0]) + ' – ' + baht(b.reserve[1])]])}
          <div class="rp-note">หลักทั่วไป: เผื่อค่างวด 3–6 เดือน สำหรับเหตุฉุกเฉิน</div>
          <ol class="rp-points">${NEXT[b.level].map(t => `<li>${esc(t)}</li>`).join('')}</ol>
        </section>
      </div>

      <section class="rp-box">
        <h2>เช็กลิสต์เอกสารยื่นกู้</h2>
        ${checklist(DOCS.common.concat(DOCS[occ]))}
        <div class="rp-note">เอกสารจริงอาจแตกต่างตามธนาคาร สอบถามธนาคารก่อนยื่น</div>
      </section>
      ${footer('ประเมินวงเงินด้วยเกณฑ์ DSR 40% ค่าใช้จ่ายวันโอนเป็นการประมาณการ')}`;
  }

  function render() {
    const paper = $('#paper');
    if (!type || !state) {
      paper.innerHTML = `<div class="rp-empty"><h1 class="rp-title">ยังไม่มีข้อมูลสำหรับสร้างเอกสาร</h1>
        <p>เริ่มจากเครื่องคำนวณ แล้วกดปุ่ม "สร้างเอกสาร PDF"</p>
        <div class="rp-empty__links"><a class="btn btn--primary" href="buy.html">คำนวณกู้บ้านใหม่</a><a class="btn btn--secondary" href="refinance.html">Refinance vs Retention</a></div></div>`;
      return;
    }
    paper.innerHTML = type === 'retention' ? retention() : readiness();
  }

  FH.ready(() => {
    FH.layout('');
    if (type === 'retention') state = FH.mergeState(FH.REFI_DEFAULTS, hash.data);
    if (type === 'readiness') state = FH.mergeState(FH.BUY_DEFAULTS, hash.data);
    const page = type === 'retention' ? 'refinance.html' : 'buy.html';
    if (state && hash.data) $('#editLink').href = FH.toolUrl(page, state);
    if (!state) $('#printBtn').disabled = true;
    $('#occField').hidden = type !== 'readiness';
    if (state && state.occupation) $('#rpOcc').value = state.occupation;
    document.title = type === 'retention' ? 'FinHome-Retention-Negotiation-Kit' : type === 'readiness' ? 'FinHome-Homebuyer-Readiness-Report' : document.title;

    $('#rpName').addEventListener('input', render);
    $('#rpOcc').addEventListener('change', e => { if (state) { state.occupation = e.target.value; $('#editLink').href = FH.toolUrl(page, state); } render(); });
    $('#printBtn').addEventListener('click', () => window.print());
    render();
    FH.icons();
  });
})();
