/* FinHome — shared helpers, layout and form binding.
   Everything runs in the visitor's browser. Nothing is sent to a server or stored on the device. */
(function () {
  'use strict';
  const FH = window.FH = {};

  /* ---------- constants ---------- */
  FH.BANKS = [
    'ธนาคารกสิกรไทย (KBank)', 'ธนาคารกรุงเทพ (BBL)', 'ธนาคารไทยพาณิชย์ (SCB)', 'ธนาคารกรุงไทย (KTB)',
    'ธนาคารกรุงศรีอยุธยา (Krungsri)', 'ธนาคารทหารไทยธนชาต (ttb)', 'ธนาคารยูโอบี (UOB)', 'ธนาคารอาคารสงเคราะห์ (GH Bank)',
    'ธนาคารออมสิน (GSB)', 'ธนาคารซีไอเอ็มบี ไทย (CIMB Thai)', 'ธนาคารแลนด์ แอนด์ เฮ้าส์ (LH Bank)', 'ธนาคารเกียรตินาคินภัทร (KKP)'
  ];
  FH.DSR_GOOD = 40;   // healthy DSR ceiling (%)
  FH.DSR_DANGER = 50; // dangerous DSR (%)

  /* ---------- formatting ---------- */
  FH.$ = (s, el = document) => el.querySelector(s);
  FH.$$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  FH.num = v => Number(String(v).replace(/[^0-9.]/g, '')) || 0;
  FH.fmt = v => { const d = String(v).replace(/[^0-9]/g, ''); return d ? Number(d).toLocaleString('en-US') : ''; };
  FH.baht = v => (v < 0 ? '-' : '') + '฿' + Math.round(Math.abs(v)).toLocaleString('en-US');
  FH.signedBaht = v => (v > 0 ? '+' : '') + FH.baht(v);
  FH.pct = (v, d = 2) => (isFinite(v) ? v : 0).toFixed(d) + '%';
  FH.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  FH.shortBank = name => { const m = /\(([^)]+)\)\s*$/.exec(name || ''); return m ? m[1] : (name || ''); };
  FH.setText = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
  FH.months = m => { const y = Math.floor(m / 12), r = m % 12; return (y ? y + ' ปี' : '') + (y && r ? ' ' : '') + (r ? r + ' เดือน' : (y ? '' : '0 เดือน')); };
  FH.thaiDate = (d = new Date()) => d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  /* ---------- finance math ---------- */
  FH.pmt = (P, r, y) => { const i = r / 1200, m = y * 12; return i ? P * i / (1 - Math.pow(1 + i, -m)) : P / m; };
  FH.pv = (p, r, y) => { const i = r / 1200, m = y * 12; return i ? p * (1 - Math.pow(1 + i, -m)) / i : p * m; };
  /** Simulate a loan with a fixed payment; rateAt(monthIndex) returns the annual % rate. */
  FH.sim = (bal, pay, rateAt, months) => {
    let b = bal, it = 0; const cum = [];
    for (let m = 0; m < months; m++) { const i = b * rateAt(m) / 1200; it += i; b = Math.max(0, b - (pay - i)); cum.push(it); }
    return { interest: it, bal: b, cum };
  };

  /* ---------- form binding ----------
     <input data-k="price" data-fmt="money">  → thousands separators
     <input data-k="rate">                    → decimal number
     <select data-k="bank">                   → text */
  function sanitize(el, v) {
    if (el.tagName === 'SELECT' || el.dataset.fmt === 'text') return v;
    if (el.dataset.fmt === 'money') return FH.fmt(v);
    let s = String(v).replace(/[^0-9.]/g, '');
    const i = s.indexOf('.');
    if (i >= 0) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '');
    return s;
  }
  FH.bindFields = (f, onChange) => {
    const handler = e => {
      const el = e.target, k = el.dataset && el.dataset.k;
      if (!k || !(k in f)) return;
      const raw = el.value, v = sanitize(el, raw);
      if (el.tagName === 'INPUT' && v !== raw) {
        const fromEnd = raw.length - (el.selectionEnd == null ? raw.length : el.selectionEnd);
        el.value = v;
        const pos = Math.max(0, v.length - fromEnd);
        try { el.setSelectionRange(pos, pos); } catch (err) { /* ignore */ }
      }
      f[k] = v;
      onChange(k);
    };
    document.addEventListener('input', handler);
    document.addEventListener('change', e => { if (e.target.tagName === 'SELECT') handler(e); });
  };
  /** Write state into every bound field (skips the focused one unless forced, and [data-manual] fields). */
  FH.syncFields = (f, force) => {
    FH.$$('[data-k]').forEach(el => {
      if (el.hasAttribute('data-manual')) return;
      if (!force && document.activeElement === el) return;
      const v = f[el.dataset.k];
      if (v !== undefined && el.value !== v) el.value = v;
    });
  };
  FH.fillBankSelects = () => {
    FH.$$('select[data-banks]').forEach(sel => { sel.innerHTML = FH.BANKS.map(b => `<option value="${FH.esc(b)}">${FH.esc(b)}</option>`).join(''); });
  };

  /* ---------- segmented tabs ---------- */
  FH.renderTabs = (el, items, value, onChange) => {
    if (!el) return;
    el.innerHTML = items.map(it => `<button type="button" role="tab" aria-selected="${it.value === value}" data-v="${it.value}">${FH.esc(it.label)}</button>`).join('');
    el.onclick = e => { const b = e.target.closest('button[data-v]'); if (b) onChange(b.dataset.v); };
  };

  /* ---------- passing inputs between pages ----------
     Inputs travel in the URL fragment (#...), which browsers never send to the web server. */
  const toB64 = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const fromB64 = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  FH.encodeState = obj => toB64(JSON.stringify(obj));
  FH.readHash = () => {
    try {
      const p = new URLSearchParams(location.hash.slice(1));
      const d = p.get('d');
      return { type: p.get('t'), data: d ? JSON.parse(fromB64(d)) : null };
    } catch (e) { return { type: null, data: null }; }
  };
  /** Copy only known keys from untrusted data into defaults. */
  FH.mergeState = (defaults, data) => {
    if (!data || typeof data !== 'object') return defaults;
    const out = JSON.parse(JSON.stringify(defaults));
    (function merge(dst, src) {
      Object.keys(dst).forEach(k => {
        if (!(k in src)) return;
        const dv = dst[k], sv = src[k];
        if (dv && typeof dv === 'object') { if (sv && typeof sv === 'object') merge(dv, sv); }
        else if (typeof dv === typeof sv) dst[k] = typeof sv === 'string' ? sv.slice(0, 80) : sv;
      });
    })(out, data);
    // whitelist choice fields; numeric fields keep only digits, commas and a dot
    const ENUMS = { horizon: ['3', '6'], refiMode: ['avg3', 'avg6', 'step'], retAfterMode: ['renew', 'float'], lockYears: ['3', '6'], mrtaMode: ['manual', 'estimate'], occupation: ['salaried', 'freelance', 'business'] };
    Object.keys(ENUMS).forEach(k => { if (k in out && !ENUMS[k].includes(out[k])) out[k] = defaults[k]; });
    if (out.f) {
      Object.keys(out.f).forEach(k => {
        if (k === 'bank' || k === 'newBank') { if (!FH.BANKS.includes(out.f[k])) out.f[k] = defaults.f[k]; }
        else if (k === 'gender') { if (!['ชาย', 'หญิง'].includes(out.f[k])) out.f[k] = defaults.f[k]; }
        else out.f[k] = String(out.f[k]).replace(/[^0-9.,]/g, '');
      });
    }
    return out;
  };
  FH.reportUrl = (type, state) => 'report.html#t=' + type + '&d=' + FH.encodeState(state);
  FH.toolUrl = (page, state) => page + '#d=' + FH.encodeState(state);

  /* ---------- file download (generated in the browser) ---------- */
  FH.download = (name, content, type) => {
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  /* ---------- layout (header + footer shared by every page) ---------- */
  const NAV = [
    ['buy', 'buy.html', 'คำนวณกู้บ้านใหม่'],
    ['refinance', 'refinance.html', 'Refinance vs Retention'],
    ['prepay', 'prepay.html', 'คำนวณโปะบ้าน'],
    ['tax', 'tax.html', 'ลดหย่อนภาษี']
  ];
  FH.layout = active => {
    const header = document.getElementById('site-header');
    if (header) {
      header.classList.add('site-header');
      header.innerHTML = `
        <div class="container site-header__inner">
          <a href="index.html" aria-label="FinHome หน้าแรก"><img class="site-header__logo" src="assets/logo-wordmark.png" alt="FinHome."></a>
          <nav class="nav" aria-label="เมนูหลัก">
            ${NAV.map(([k, href, label]) => `<a href="${href}"${k === active ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
          </nav>
          <a class="btn btn--accent btn--sm site-header__cta" href="buy.html">เริ่มคำนวณฟรี</a>
        </div>`;
    }
    const footer = document.getElementById('site-footer');
    if (footer) {
      footer.classList.add('footer');
      footer.innerHTML = `
        <div class="container footer__top">
          <div class="footer__brand">
            <img src="assets/logo-wordmark-white.png" alt="FinHome.">
            <p>ผู้ช่วยการเงินเรื่องบ้าน ให้ทุกการผ่อน “<span style="color:var(--gold-300);font-weight:600">ฟิน</span>” ขึ้น</p>
            <p class="footer__privacy"><i data-lucide="shield-check" width="16" height="16"></i>คำนวณในเครื่องของคุณ 100% ไม่เก็บข้อมูล</p>
          </div>
          <div class="footer__links">
            <b>เครื่องมือ</b>
            ${NAV.map(([, href, label]) => `<a href="${href}">${label}</a>`).join('')}
          </div>
          <div class="disclaimer">
            <i data-lucide="info" width="18" height="18"></i>
            <div><b>คำสงวนสิทธิ์</b><br>ผลการคำนวณบนเว็บไซต์นี้เป็นการประมาณการเบื้องต้นเพื่อประกอบการตัดสินใจเท่านั้น ไม่ใช่ข้อเสนอสินเชื่อหรือคำแนะนำทางการเงินเฉพาะบุคคล อัตราดอกเบี้ย ค่าธรรมเนียม วงเงินอนุมัติ และเงื่อนไขจริงขึ้นอยู่กับนโยบายและการพิจารณาของแต่ละธนาคาร</div>
          </div>
        </div>
        <div class="container footer__bottom"><span>© 2026 FinHome</span><span><a href="privacy.html">นโยบายความเป็นส่วนตัว</a> · <a href="privacy.html#contact">ติดต่อเรา</a></span></div>`;
    }
  };
  FH.icons = () => { if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 } }); };
  FH.ready = fn => { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); };
})();
