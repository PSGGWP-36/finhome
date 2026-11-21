/* FinHome — calculations shared by tool pages and reports (pure functions). */
(function () {
  'use strict';
  const FH = window.FH;
  const { num, pmt, pv, sim } = FH;

  /* ================= New home purchase ================= */
  FH.BUY_DEFAULTS = {
    f: { price: '4,500,000', down: '450,000', income: '65,000', debt: '5,000', years: '30', rate: '3.50' },
    measure: false,
    occupation: 'salaried'
  };

  FH.calcBuy = s => {
    const f = s.f, dsr = FH.DSR_GOOD / 100;
    const price = num(f.price), down = num(f.down), inc = num(f.income), debt = num(f.debt);
    const yrs = Math.max(1, num(f.years)), rate = num(f.rate);
    const loan = Math.max(0, price - down);
    const maxPay = Math.max(0, inc * dsr - debt);
    const maxLoan = pv(maxPay, rate, yrs);
    const pay = pmt(loan, rate, yrs), int1 = loan * rate / 1200, prin1 = pay - int1;
    const pass = loan <= maxLoan;
    const dsrBefore = inc ? debt / inc * 100 : 0;
    const dsrAfter = inc ? (pay + debt) / inc * 100 : 999;
    const level = pass && dsrAfter <= FH.DSR_GOOD ? 'ready' : dsrAfter <= FH.DSR_DANGER ? 'prepare' : 'risk';
    const stress = [0, 1, 2].map(d => {
      const p = pmt(loan, rate + d, yrs);
      return { delta: d, rate: rate + d, pay: p, diff: p - pay, dsr: inc ? (p + debt) / inc * 100 : 999 };
    });
    const m = !!s.measure;
    const costs = [
      { label: 'ค่าธรรมเนียมการโอน', note: m ? 'ส่วนของผู้ซื้อ ครึ่งหนึ่งของ 0.01% ตามมาตรการ' : 'ส่วนของผู้ซื้อ ครึ่งหนึ่งของ 2% (ตกลงกับผู้ขายได้)', value: price * (m ? 0.00005 : 0.01) },
      { label: 'ค่าจดจำนอง', note: m ? '0.01% ของยอดกู้ ตามมาตรการ' : '1% ของยอดกู้', value: loan * (m ? 0.0001 : 0.01) },
      { label: 'ค่าประเมินราคา', note: 'ประมาณการ แล้วแต่ธนาคาร', value: loan ? 3000 : 0 },
      { label: 'ประกัน MRTA', note: 'ประมาณ 2.5% ของยอดกู้ · ไม่บังคับซื้อ', value: loan * 0.025, info: 'mrta' }
    ];
    const costTotal = costs.reduce((a, c) => a + c.value, 0);
    return {
      price, down, inc, debt, yrs, rate, loan, maxLoan, maxPay, pay, int1, prin1, pass, level,
      shortfall: Math.max(0, loan - maxLoan),
      downPct: price ? down / price * 100 : 0,
      prinPct: pay ? Math.max(0, prin1 / pay * 100) : 0,
      dsrBefore, dsrAfter, stress, costs, costTotal,
      cashNeed: costTotal + down,
      reserve: [pay * 3, pay * 6],
      totalInterest: Math.max(0, pay * yrs * 12 - loan)
    };
  };

  FH.BUY_LEVEL = {
    ready: { label: 'พร้อมยื่นกู้', tone: 'success', note: 'ยอดกู้อยู่ในวงเงินที่ธนาคารน่าจะอนุมัติ และ DSR อยู่ในเกณฑ์ดี' },
    prepare: { label: 'ควรเตรียมเพิ่ม', tone: 'accent', note: 'DSR เกิน 40% แต่ไม่เกิน 50% — ลองเพิ่มเงินดาวน์ ลดภาระหนี้ หรือกู้ร่วม' },
    risk: { label: 'มีความเสี่ยง', tone: 'danger', note: 'DSR เกิน 50% อยู่ในระดับอันตราย ธนาคารมีโอกาสไม่อนุมัติหรือลดวงเงิน' }
  };

  /* ================= Refinance vs Retention ================= */
  FH.COST_DEFS = [
    ['mortgage', 'ค่าจดจำนอง', '1% ของยอดกู้ · คำนวณอัตโนมัติ แก้ได้'],
    ['appraisal', 'ค่าประเมินราคาหลักทรัพย์', 'ค่าเริ่มต้น ฿3,000'],
    ['mrta', 'ประกันคุ้มครองสินเชื่อ MRTA', 'กรอกเบี้ยเอง หรือประมาณการตามเพศ/อายุ'],
    ['fire', 'ประกันอัคคีภัย', '0.3% ของราคาประเมิน/ยอดกู้'],
    ['stamp', 'ค่าอากรแสตมป์', '0.05% ของวงเงินกู้ใหม่'],
    ['penalty', 'ค่าปรับ + เงินคืน สัญญาเดิม', 'เปิดหากสัญญาเดิมยังไม่พ้นระยะห้ามไถ่ถอน (3 หรือ 6 ปี) · ค่าปรับมักราว 2–3% ของยอดหนี้ รวมค่าใช้จ่ายที่ธนาคารเดิมเคยออกให้และต้องคืน'],
    ['other', 'ค่าใช้จ่ายอื่นๆ', 'เช่น ค่าดำเนินการ ค่าเดินทาง']
  ];
  /* Fees the new bank may "pay for you" — they must be repaid if you redeem before the lock-in ends. */
  FH.WAIVABLE = ['mortgage', 'appraisal', 'fire', 'stamp'];
  FH.NEW_LOAN_PENALTY = 0.03; // assumed early-redemption penalty of the NEW loan (% of balance)

  FH.REFI_DEFAULTS = {
    f: {
      bank: 'ธนาคารกสิกรไทย (KBank)', newBank: 'ธนาคารกรุงไทย (KTB)', bal: '2,450,000', pay: '18,500', remain: '22',
      mrr: '7.05', ret: '5.10', retRenew: '', retFloat: '6.05',
      refiAvg: '3.35', refiFloat: '6.05', refiAvg6: '4.50',
      y1: '2.79', y2: '3.59', y3: '4.19', y4: '4.59', y5: '4.99', y6: '6.05',
      mortgage: '', appraisal: '3,000', mrta: '', fire: '', stamp: '', penalty: '', other: '0', gender: 'ชาย', age: '38'
    },
    on: { mortgage: true, appraisal: true, mrta: true, fire: true, stamp: true, penalty: false, other: true },
    paidBy: { mortgage: 'me', appraisal: 'me', fire: 'me', stamp: 'me' },
    refiMode: 'avg3', mrtaMode: 'estimate', horizon: '3', retAfterMode: 'renew', lockYears: '3'
  };

  /* Rate schedules (annual %, by month index 0–71).
     Refinance: avg3 = average rate years 1–3 then float · avg6 = one average rate for years 1–6 · step = a rate per year 1–5, year 6+ float.
     Retention: promo average years 1–3, then the rate after the promo ends. */
  FH.refiSchedule = s => {
    const f = s.f, n = FH.num;
    if (s.refiMode === 'avg6') { const a = n(f.refiAvg6), fl = n(f.refiFloat); return m => m < 72 ? a : fl; }
    if (s.refiMode === 'step') { const y = [f.y1, f.y2, f.y3, f.y4, f.y5, f.y6].map(n); return m => y[Math.min(5, Math.floor(m / 12))]; }
    const a = n(f.refiAvg), fl = n(f.refiFloat);
    return m => m < 36 ? a : fl;
  };
  FH.avgRate = (rateAt, months) => { let t = 0; for (let m = 0; m < months; m++) t += rateAt(m); return t / months; };

  /** Flat annual rate that produces the same interest over `months` (balance-weighted "effective" rate). */
  FH.effRate = (bal, pay, interest, months) => {
    if (interest <= 0) return 0;
    let lo = 0, hi = 30;
    for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (sim(bal, pay, () => mid, months).interest > interest) hi = mid; else lo = mid; }
    return lo;
  };

  /** Retention schedule: promo years 1–3, then either renewed (default: same rate) or floating. */
  FH.retentionAfter = s => {
    const f = s.f;
    if (s.retAfterMode === 'float') return { rate: num(f.retFloat), same: false };
    return f.retRenew === '' ? { rate: num(f.ret), same: true } : { rate: num(f.retRenew), same: false };
  };

  FH.calcRefi = s => {
    const f = s.f;
    const bal = num(f.bal), mp = num(f.pay), mrr = num(f.mrr), ret = num(f.ret), age = num(f.age);
    const after = FH.retentionAfter(s), retAfter = after.rate;
    const refiAt = FH.refiSchedule(s);
    // promo rate x for years 1–3; years 4–6 renew at the same x, a new rate, or float
    const retPromo = x => m => m < 36 ? x : (after.same ? x : retAfter);
    const retAt = retPromo(ret);
    const mrtaEst = bal * (0.008 + Math.max(0, age - 25) * 0.0006) * (f.gender === 'ชาย' ? 1.15 : 1) * Math.min(num(f.remain), 10) / 10;
    const auto = { mortgage: bal * 0.01, fire: bal * 0.003, stamp: bal * 0.0005, penalty: bal * 0.03 };
    const val = k => {
      if (k === 'mrta' && s.mrtaMode === 'estimate') return mrtaEst;
      return f[k] === '' ? (auto[k] || 0) : num(f[k]);
    };
    const paidBy = s.paidBy || {};
    const costItems = FH.COST_DEFS.filter(([k]) => s.on[k]).map(([k, label]) => ({
      key: k, label, value: val(k), waived: FH.WAIVABLE.includes(k) && paidBy[k] === 'bank'
    }));
    const costs = costItems.filter(c => !c.waived).reduce((a, c) => a + c.value, 0);
    const waivedTotal = costItems.filter(c => c.waived).reduce((a, c) => a + c.value, 0);
    // lock-in of the NEW loan: leaving before it ends costs a penalty + repaying the waived fees
    const lockYears = s.lockYears === '6' ? 6 : 3;
    const exitPenalty = bal * FH.NEW_LOAN_PENALTY;
    const exitCost = exitPenalty + waivedTotal;
    const Y = Number(s.horizon), H = Y * 12;
    const A = sim(bal, mp, () => mrr, H), T = sim(bal, mp, retAt, H), R = sim(bal, mp, refiAt, H);
    const iA = A.interest, iT = T.interest, iR = R.interest;
    const saveT = iA - iT, saveR = iA - iR - costs, refiWins = saveR > saveT;

    /* Break-even: first month (within 6 years) when the interest saved by refinancing, versus Retention,
       has paid back the moving costs. It can be temporary when the new bank's rate later rises above Retention. */
    const R6 = sim(bal, mp, refiAt, 72), T6 = sim(bal, mp, retAt, 72);
    const gap = m => T6.cum[m] - R6.cum[m];
    let be = null;
    for (let m = 0; m < 72; m++) { if (gap(m) >= costs) { be = m + 1; break; } }
    const holds = gap(H - 1) >= costs; // still paid back at the end of the chosen view
    const beStatus = !be ? 'never' : be > H ? 'after' : holds ? 'ok' : 'lost';

    /* Target Retention Rate: the promo rate at which staying costs the same as refinancing over the view.
       If Retention renews at the same rate, the target applies to every year of the view. */
    const goal = iR + costs;
    let lo = 0, hi = Math.max(mrr, ret, retAfter, 15);
    const costAt = x => sim(bal, mp, retPromo(x), H).interest;
    let target = null, targetNote = '';
    if (costAt(0) > goal) targetNote = 'unreachable';   // even 0% for 3 years can't beat moving
    else if (costAt(hi) <= goal) { target = hi; targetNote = 'any'; }
    else {
      for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (costAt(mid) > goal) hi = mid; else lo = mid; }
      target = lo;
    }

    /* Rate gap: how much cheaper (effective, per year) Refinance must be than Retention to repay the
       moving costs over the view, versus how much cheaper this offer actually is. */
    const effRet = FH.effRate(bal, mp, iT, H), effRefi = FH.effRate(bal, mp, iR, H);
    const needGap = effRet - FH.effRate(bal, mp, Math.max(0, iT - costs), H);
    const haveGap = effRet - effRefi;

    const retH = FH.avgRate(retAt, H), refiH = FH.avgRate(refiAt, H), refi3 = FH.avgRate(refiAt, 36);
    const opts = [
      { k: 'mrr', name: 'ลอยตัว MRR', rateLabel: FH.pct(mrr), interest: iA, cost: 0, b: A.bal, save: 0 },
      { k: 'ret', name: 'Retention', rateLabel: FH.pct(retH) + ' เฉลี่ย ' + Y + ' ปี', interest: iT, cost: 0, b: T.bal, save: saveT },
      { k: 'refi', name: 'Refinance', rateLabel: FH.pct(refiH) + ' เฉลี่ย ' + Y + ' ปี', interest: iR, cost: costs, b: R.bal, save: saveR }
    ];
    return {
      bal, mp, mrr, ret, retAfter, retSame: after.same, retAfterMode: s.retAfterMode === 'float' ? 'float' : 'renew',
      retH, refi3, refiH, mrtaEst, val, costItems, costs, waivedTotal, lockYears, exitPenalty, exitCost,
      saveT, saveR, refiWins, be, beStatus, target, targetNote, opts, effRet, effRefi, needGap, haveGap,
      best: refiWins ? 'refi' : 'ret', diff: saveR - saveT, horizon: Y,
      yearRates: [0, 1, 2, 3, 4, 5].map(y => ({ year: y + 1, ret: retAt(y * 12), refi: refiAt(y * 12) })),
      underwater: mp <= bal * Math.max(mrr, ret) / 1200
    };
  };

  FH.breakEvenText = r => {
    const c = FH.baht(r.costs), h = r.horizon;
    switch (r.beStatus) {
      case 'ok': return { title: 'เดือนที่ ' + r.be, note: 'ส่วนต่างดอกเบี้ยเทียบ Retention คืนทุนค่าย้าย ' + c + ' และยังคุ้มถึงสิ้นปีที่ ' + h };
      case 'after': return { title: 'เดือนที่ ' + r.be, note: 'คืนทุนหลังช่วงมุมมอง ' + h + ' ปี — ต้องอยู่กับธนาคารใหม่อย่างน้อย ' + FH.months(r.be) + ' จึงจะคุ้มค่าย้าย ' + c };
      case 'lost': return { title: 'เดือนที่ ' + r.be + ' (ชั่วคราว)', note: 'หลังหมดโปร ดอกเบี้ยธนาคารใหม่สูงขึ้น ส่วนต่างลดลงจนไม่คุ้มค่าย้าย ' + c + ' ณ สิ้นปีที่ ' + h };
      default: return { title: 'ไม่คืนทุนใน 6 ปี', note: 'ส่วนต่างดอกเบี้ยเทียบ Retention ไม่พอคืนค่าย้าย ' + c };
    }
  };
  FH.targetText = r => {
    const h = r.horizon;
    if (r.targetNote === 'unreachable') return { value: '—', short: '—', note: 'แม้ลดเหลือ 0% ใน 3 ปีแรก ก็ยังไม่คุ้มเท่าการย้าย เพราะอัตราปีที่ 4+ ' + FH.pct(r.retAfter) + ' สูงกว่าธนาคารใหม่ — ควรเจรจาอัตราหลังหมดโปรด้วย' };
    if (r.targetNote === 'any') return { value: 'คุ้มทุกอัตรา', short: 'คุ้มทุกอัตรา', note: 'ค่าย้ายสูงมาก การอยู่ต่อคุ้มกว่าย้ายในมุมมอง ' + h + ' ปี ไม่ว่าอัตรา Retention เท่าไร' };
    const span = r.retSame && h > 3 ? 'อัตราตลอด ' + h + ' ปี (ขอ Retention ซ้ำที่อัตราเดิม)' : 'เฉลี่ย 3 ปีแรก (ปีที่ 4+ ' + FH.pct(r.retAfter) + ')';
    return { value: '≤ ' + FH.pct(r.target), short: FH.pct(r.target), note: span + ' · หากธนาคารเดิมลดให้ไม่เกินนี้ การอยู่ต่อคุ้มกว่าย้ายในมุมมอง ' + h + ' ปี' };
  };
  FH.gapText = r => {
    const ok = r.haveGap >= r.needGap;
    return {
      ok,
      text: 'Refinance ต้องถูกกว่าเฉลี่ย ≥ ' + FH.pct(Math.max(0, r.needGap)) + '/ปี จึงคุ้มค่าย้าย · ข้อเสนอนี้ถูกกว่า ' + FH.pct(r.haveGap) + '/ปี'
    };
  };
  FH.lockText = r => 'ห้ามไถ่ถอน ' + r.lockYears + ' ปี — หากย้ายก่อน ต้องจ่ายค่าปรับประมาณ ' + FH.baht(r.exitPenalty) +
    (r.waivedTotal ? ' + คืนค่าใช้จ่ายที่ธนาคารออกให้ ' + FH.baht(r.waivedTotal) + ' รวมราว ' + FH.baht(r.exitCost) : '');

  /* Compare several refinance offers (year 1–5 rates + year 6 float) over 6 years against Retention. */
  FH.compareOffers = (s, offers) => {
    const base = FH.calcRefi(Object.assign({}, s, { horizon: '6' }));
    const after = FH.retentionAfter(s);
    const retAt = m => m < 36 ? base.ret : (after.same ? base.ret : after.rate);
    const iT = sim(base.bal, base.mp, retAt, 72).interest;
    const rows = offers.map((o, i) => {
      const r = o.rates.map(num);
      if (!r.some(v => v > 0)) return null;
      const at = m => r[Math.min(5, Math.floor(m / 12))];
      const iR = sim(base.bal, base.mp, at, 72).interest;
      return {
        i, bank: o.bank, lock: o.lock, avg: r.reduce((a, b) => a + b, 0) / 6,
        eff: FH.effRate(base.bal, base.mp, iR, 72), interest: iR, total: iR + base.costs, vsRet: iT - iR - base.costs
      };
    }).filter(Boolean).sort((a, b) => a.total - b.total);
    // target: flat Retention rate (all 6 years) that matches the best offer incl. moving costs
    let target = null;
    if (rows.length) {
      const goal = rows[0].total; let lo = 0, hi = 15;
      for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (sim(base.bal, base.mp, () => mid, 72).interest > goal) hi = mid; else lo = mid; }
      target = lo;
    }
    return { rows, iT, retEff: FH.effRate(base.bal, base.mp, iT, 72), costs: base.costs, target };
  };

  /* ================= Prepayment (โปะบ้าน) ================= */
  FH.PREPAY_DEFAULTS = { f: { bal: '2,450,000', rate: '3.50', years: '14', pay: '18,500', extra: '3,000', lump: '0' } };
  /** Level monthly payment that clears `bal` in the remaining years (rounded up to whole baht); 0 if inputs are missing. */
  FH.prepayAutoPay = f => {
    const bal = num(f.bal), rate = num(f.rate), m = Math.round(Math.min(40, num(f.years)) * 12);
    if (!bal || !m) return 0;
    const i = rate / 1200;
    return Math.ceil(i ? bal * i / (1 - Math.pow(1 + i, -m)) : bal / m);
  };

  function runSchedule(bal, rate, pay, maxMonths = 720) {
    let b = bal, it = 0, m = 0;
    const years = [], balances = [bal];
    let yPrin = 0, yInt = 0;
    while (b > 0.5 && m < maxMonths) {
      const i = b * rate / 1200;
      const p = Math.min(pay, b + i);
      const prin = p - i;
      if (prin <= 0) return null; // payment never covers interest
      b = Math.max(0, b - prin); it += i; m++;
      yPrin += prin; yInt += i;
      if (m % 12 === 0 || b <= 0.5) {
        years.push({ year: Math.ceil(m / 12), principal: yPrin, interest: yInt, balance: b });
        balances.push(b);
        yPrin = 0; yInt = 0;
      }
    }
    return b > 0.5 ? null : { months: m, interest: it, years, balances };
  }

  FH.calcPrepay = s => {
    const f = s.f;
    const bal = num(f.bal), rate = num(f.rate), pay = num(f.pay), extra = num(f.extra), lump = num(f.lump);
    const minPay = bal * rate / 1200;
    const base = bal && pay ? runSchedule(bal, rate, pay) : null;
    const plan = bal && pay ? runSchedule(Math.max(0, bal - lump), rate, pay + extra) : null;
    return {
      bal, rate, pay, extra, lump, minPay, base, plan,
      termMonths: Math.round(Math.min(40, num(f.years)) * 12),
      ok: !!(base && plan),
      saved: base && plan ? base.interest - plan.interest : 0,
      monthsSaved: base && plan ? base.months - plan.months : 0
    };
  };

  /* ================= Home-loan interest tax deduction ================= */
  FH.TAX_DEFAULTS = { f: { income: '780,000', other: '30,000', interest: '85,000', borrowers: '1' } };
  // Thai personal income tax brackets (net income)
  FH.TAX_BRACKETS = [[150000, 0], [300000, 0.05], [500000, 0.10], [750000, 0.15], [1000000, 0.20], [2000000, 0.25], [5000000, 0.30], [Infinity, 0.35]];
  FH.HOME_INTEREST_CAP = 100000;

  const taxOf = net => {
    let tax = 0, prev = 0, marginal = 0;
    for (const [cap, r] of FH.TAX_BRACKETS) {
      if (net > prev) { tax += (Math.min(net, cap) - prev) * r; marginal = r; }
      prev = cap;
    }
    return { tax, marginal };
  };

  FH.calcTax = s => {
    const f = s.f;
    const income = num(f.income), other = num(f.other), interest = num(f.interest);
    const n = Math.min(10, Math.max(1, Math.round(num(f.borrowers)) || 1));
    const expense = Math.min(income * 0.5, 100000), personal = 60000;
    const netBefore = Math.max(0, income - expense - personal - other);
    const deduction = Math.min(interest, FH.HOME_INTEREST_CAP) / n;
    const netAfter = Math.max(0, netBefore - deduction);
    const before = taxOf(netBefore), after = taxOf(netAfter);
    return {
      income, other, interest, n, expense, personal, netBefore, deduction, netAfter,
      taxBefore: before.tax, taxAfter: after.tax, saved: before.tax - after.tax, marginal: before.marginal,
      capped: interest > FH.HOME_INTEREST_CAP
    };
  };
})();
