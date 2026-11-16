/* FinHome — UI shared by the 3-year (refinance.html) and 6-year (refinance-6y.html) pages:
   hidden-cost rows, page tabs, and the collapsible "more details" sections. */
(function () {
  'use strict';
  const { $, $$, esc } = FH;
  const chevron = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>';

  FH.refiUI = {
    /** Render the hidden-cost rows into `el`. */
    buildCostRows(el) {
      el.innerHTML = FH.COST_DEFS.map(([k, label, hint]) => `
        <div class="cost-row" data-row="${k}">
          <div class="cost-row__main">
            <button type="button" class="switch" role="switch" aria-checked="true" aria-label="รวม${esc(label)}" data-toggle="${k}"><span class="switch__track"><span class="switch__thumb"></span></span></button>
            <div class="cost-row__text">
              <div class="cost-row__label">${esc(label)}${k === 'mrta' ? FH.infoButton('mrta', 'ประกัน MRTA คืออะไร?') : ''}</div>
              <div class="cost-row__hint">${esc(hint)}</div>
              ${FH.WAIVABLE.includes(k) ? `<label class="paidby"><input type="checkbox" data-paidby="${k}"><span>ธนาคารใหม่ออกให้ (ต้องคืนหากไถ่ถอนก่อนกำหนด)</span></label>` : ''}
            </div>
            <label class="field cost-row__input"><span class="sr-only">${esc(label)}</span><span class="field__box"><span class="field__affix">฿</span><input inputmode="numeric" data-k="${k}" data-fmt="money" data-manual data-cost></span></label>
          </div>
          ${k === 'mrta' ? `
          <div class="cost-row__extra">
            <div class="seg" role="tablist" id="mrtaTabs" style="align-self:flex-start"></div>
            <div class="grid-2 grid-2--12" id="mrtaEst">
              <label class="field"><span class="field__label">เพศ</span><span class="select"><select data-k="gender"><option value="ชาย">ชาย</option><option value="หญิง">หญิง</option></select>${chevron}</span></label>
              <label class="field"><span class="field__label">อายุ</span><span class="field__box"><input inputmode="numeric" data-k="age"><span class="field__suffix">ปี</span></span></label>
            </div>
          </div>` : ''}
        </div>`).join('');
    },

    /** Sync switches, "paid by bank" boxes and amounts with the state. */
    syncCostRows(s, r, render) {
      FH.renderTabs($('#mrtaTabs'), [{ value: 'manual', label: 'กรอกเอง' }, { value: 'estimate', label: 'ประมาณการ' }], s.mrtaMode, v => {
        if (v === 'manual') s.f.mrta = Math.round(r.mrtaEst).toLocaleString('en-US');
        s.mrtaMode = v; render();
      });
      $('#mrtaEst').hidden = s.mrtaMode !== 'estimate';
      FH.COST_DEFS.forEach(([k]) => {
        const row = $(`.cost-row[data-row="${k}"]`), on = s.on[k];
        row.classList.toggle('is-off', !on);
        const pb = $('[data-paidby]', row);
        if (pb) { pb.checked = s.paidBy[k] === 'bank'; pb.disabled = !on; row.classList.toggle('is-waived', on && pb.checked); }
        $('[data-toggle]', row).setAttribute('aria-checked', String(on));
        const input = $('input[data-cost]', row);
        const isEst = k === 'mrta' && s.mrtaMode === 'estimate';
        input.disabled = !on || isEst;
        if (document.activeElement !== input) input.value = (isEst || s.f[k] === '') ? Math.round(r.val(k)).toLocaleString('en-US') : s.f[k];
      });
      // every [data-toggle="penalty"] switch on the page (quick switch + cost row) shows the same state
      $$('[data-toggle]').forEach(b => b.setAttribute('aria-checked', String(!!s.on[b.dataset.toggle])));
    },

    costTotalText: r => FH.baht(r.costs) + (r.waivedTotal ? ' (+ ธนาคารออกให้ ' + FH.baht(r.waivedTotal) + ')' : ''),

    /** Switch / checkbox / blur handlers for the cost rows. */
    bindCostEvents(s, render) {
      document.addEventListener('focusout', e => { if (e.target.hasAttribute && e.target.hasAttribute('data-cost')) render(); });
      document.addEventListener('click', e => {
        const tg = e.target.closest('[data-toggle]');
        if (tg) { const k = tg.dataset.toggle; s.on[k] = !s.on[k]; render(); }
      });
      document.addEventListener('change', e => {
        const pb = e.target.closest && e.target.closest('[data-paidby]');
        if (pb) { s.paidBy[pb.dataset.paidby] = pb.checked ? 'bank' : 'me'; render(); }
      });
    },

    /** Keep the page tabs (3-year / 6-year) carrying the current inputs. */
    syncPageTabs(s) {
      $$('[data-page-tab]').forEach(a => { a.href = FH.toolUrl(a.dataset.pageTab, s); });
    },

    hints(s, r) {
      const ph = $('#payHint');
      if (ph) {
        ph.hidden = !(r.bal && r.underwater);
        ph.textContent = 'ค่างวดต่ำกว่าดอกเบี้ยต่อเดือน หนี้จะไม่ลดลง ผลเปรียบเทียบอาจไม่ถูกต้อง ตรวจสอบยอดหนี้และค่างวดอีกครั้ง';
      }
      const nb = $('#newBankHint');
      if (nb) {
        const same = s.f.bank === s.f.newBank;
        nb.hidden = !same;
        nb.textContent = same ? 'ธนาคารใหม่เป็นธนาคารเดียวกับธนาคารปัจจุบัน — การขอลดดอกเบี้ยกับธนาคารเดิมคือ Retention' : '';
      }
    }
  };
})();
