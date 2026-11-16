/* FinHome — "i" info buttons and the explainer popup.
   Usage: <button type="button" class="info-btn" data-info="mrta" aria-label="…">FH.INFO_ICON</button> */
(function () {
  'use strict';
  const FH = window.FH;

  FH.INFO_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
  FH.infoButton = (key, label) => `<button type="button" class="info-btn" data-info="${key}" aria-label="${FH.esc(label)}" title="${FH.esc(label)}">${FH.INFO_ICON}</button>`;

  /* ---------- content ---------- */
  FH.INFO = {
    mrta: {
      title: 'ประกัน MRTA คืออะไร?',
      html: `
        <p class="info-lead"><b>MRTA (Mortgage Reducing Term Assurance)</b> หรือประกันชีวิตคุ้มครองสินเชื่อบ้าน คือประกันชีวิตที่ผูกกับหนี้บ้าน หากผู้กู้<b>เสียชีวิต</b>หรือ<b>ทุพพลภาพถาวรสิ้นเชิง</b> บริษัทประกันจะชำระหนี้บ้านที่เหลือให้ธนาคาร ครอบครัวได้อยู่บ้านต่อโดยไม่ต้องรับภาระหนี้</p>

        <div class="info-callout info-callout--good">
          <b>ไม่บังคับซื้อ</b>
          <span>ผู้กู้เลือกทำหรือไม่ทำก็ได้ ธนาคารแห่งประเทศไทยห้ามธนาคารบังคับขายประกันพ่วงกับสินเชื่อ และไม่ใช่เงื่อนไขในการอนุมัติ แต่บางธนาคารให้ส่วนลดดอกเบี้ยเมื่อทำ (ราว 0.25–0.50%)</span>
        </div>

        <h4>เลือกความคุ้มครองได้ 3 เรื่อง</h4>
        <ul>
          <li><b>วงเงิน:</b> คุ้มครอง 100% ของยอดกู้ หรือบางส่วน (ถ้าบางส่วน ครอบครัวต้องรับหนี้ส่วนที่เหลือ)</li>
          <li><b>ระยะเวลา:</b> ตลอดสัญญา หรือเฉพาะช่วงที่หนี้ยังสูง เช่น 10–15 ปีแรก</li>
          <li><b>รูปแบบทุนประกัน:</b> MRTA ทุนลดลงตามยอดหนี้ ส่วน MLTA ทุนคงที่ตลอดสัญญา เบี้ยจึงสูงกว่า</li>
        </ul>

        <h4>เบี้ยประกันเท่าไหร่</h4>
        <p>ขึ้นกับอายุ เพศ ทุนประกัน ระยะเวลาคุ้มครอง และสุขภาพ ส่วนใหญ่<b>จ่ายครั้งเดียว</b>และรวมเข้าไปในยอดกู้ได้ ซึ่งแปลว่าคุณต้องเสียดอกเบี้ยบนค่าเบี้ยด้วย</p>

        <div class="info-callout info-callout--warn">
          <b>คิดให้รอบก่อนทำเพื่อแลกส่วนลดดอกเบี้ย</b>
          <span>ถ้านำเบี้ยก้อนใหญ่รวมเข้ายอดกู้ ดอกเบี้ยที่จ่ายเพิ่มบนเบี้ยอาจมากกว่าส่วนลดที่ได้ ควรเทียบต้นทุนรวมทั้งสัญญา ไม่ใช่ดูแค่อัตราดอกเบี้ย</span>
        </div>

        <h4>ใครควรพิจารณาทำ</h4>
        <ul>
          <li>คนที่เป็นรายได้หลักของบ้าน หรือครอบครัวพึ่งรายได้จากคนเดียว</li>
          <li>กู้วงเงินสูงและผ่อนนาน และบ้านหลังนี้เป็นที่อยู่หลักของครอบครัว</li>
          <li>กู้ร่วม: เลือกทำเฉพาะคนที่เป็นรายได้หลักได้</li>
        </ul>
        <p>ถ้ามีประกันชีวิตที่ทุนประกันพอปิดหนี้บ้านได้อยู่แล้ว อาจไม่จำเป็นต้องทำเพิ่ม ส่วนประกันอุบัติเหตุ (PA) ใช้แทนไม่ได้ เพราะไม่คุ้มครองการเสียชีวิตจากเจ็บป่วย</p>

        <h4>ลดหย่อนภาษีได้</h4>
        <p>ถ้าระยะคุ้มครองตั้งแต่ 10 ปีขึ้นไป นำเบี้ยไปลดหย่อนในหมวดเบี้ยประกันชีวิตได้ตามจ่ายจริง ไม่เกิน ฿100,000 และใช้ได้<b>เฉพาะปีภาษีที่จ่ายเบี้ย</b></p>

        <h4>เมื่อรีไฟแนนซ์ หรือปิดหนี้ก่อนกำหนด</h4>
        <ul>
          <li><b>เปลี่ยนผู้รับผลประโยชน์</b>เป็นธนาคารใหม่ แล้วใช้กรมธรรม์เดิมต่อ ไม่ต้องซื้อใหม่</li>
          <li>หรือ<b>ขอเวนคืน</b>กรมธรรม์ รับเงินคืนตามมูลค่าเงินสดในตารางท้ายกรมธรรม์ (ยิ่งคืนเร็วยิ่งได้มาก)</li>
        </ul>

        <div class="info-callout">
          <b>ใช้กับเครื่องคำนวณ FinHome</b>
          <span>ถ้าจะโอนกรมธรรม์เดิมไปธนาคารใหม่ ให้<b>ปิดสวิตช์ MRTA</b> ในต้นทุนแฝง เพราะไม่มีค่าเบี้ยใหม่ ตัวเลขเบี้ยในเครื่องคำนวณเป็นค่าประมาณคร่าว ๆ หากมีใบเสนอราคาจริง เลือก "กรอกเอง" เพื่อผลที่แม่นยำกว่า</span>
        </div>

        <div class="info-sources">
          <b>สรุปและเรียบเรียงจาก</b>
          <a href="https://www.ttbbank.com/th/fin-tips/detail/what-is-mrta" target="_blank" rel="noopener noreferrer">ttb — ประกัน MRTA คืออะไร เหมาะกับใคร</a>
          <a href="https://nayoo.co/blogs/center/mrta-insurance-meaning" target="_blank" rel="noopener noreferrer">NaYoo — ประกัน MRTA สำคัญอย่างไร</a>
          <a href="https://www.plus.co.th/articles/mrta-loan-protection-insurance-guide-before-home-loan/" target="_blank" rel="noopener noreferrer">Plus Property — รู้จักประกัน MRTA ก่อนกู้บ้าน</a>
          <span>ข้อมูลทั่วไปเพื่อประกอบการตัดสินใจ เงื่อนไขจริงขึ้นอยู่กับกรมธรรม์และบริษัทประกัน</span>
        </div>`
    }
  };

  FH.INFO.horizon = {
    title: 'ทำไมต้องดูมุมมอง 6 ปี?',
    html: `
      <p class="info-lead">ข้อเสนอ Refinance ที่ดูถูกใน 3 ปีแรก <b>อาจไม่ถูกจริงเมื่อมองยาว 6 ปี</b> เพราะหลายธนาคารออกแบบอัตราดอกเบี้ยเป็นช่วง ๆ ให้ช่วงแรกดูน่าสนใจ</p>

      <h4>รูปแบบโปรโมชันที่พบบ่อย</h4>
      <ul>
        <li><b>ปีที่ 1–3:</b> ดอกเบี้ยต่ำเป็นพิเศษ (อัตราที่โฆษณาว่า "เฉลี่ย 3 ปี")</li>
        <li><b>ปีที่ 4–5:</b> ขยับสูงขึ้น หรือบางธนาคารยังให้อัตราพิเศษต่อ</li>
        <li><b>ปีที่ 6 เป็นต้นไป:</b> ลอยตัวตาม MRR ซึ่งมักสูงกว่าช่วงโปรมาก</li>
      </ul>

      <div class="info-callout info-callout--warn">
        <b>ตัวอย่างจากการสำรวจข้อเสนอ 6 ปีในตลาด</b>
        <span>ข้อเสนอที่พบ: ปีที่ 1–5 ราว 2.3–3.2% แล้ว<b>ปีที่ 6 ลอยตัว 6.0–7.1%</b> เมื่อเฉลี่ยครบ 6 ปี ได้ราว <b>3.2–3.7%</b> ซึ่ง<b>ไม่ต่างจากข้อเสนอ 3 ปี หรือการขอ Retention มากนัก</b><br>
        ตัวอย่าง: ถ้าธนาคารเดิมยอม Retention 3.10% ต่อเนื่อง 6 ปี จะคุ้มกว่าทุกข้อเสนอ Refinance 6 ปีที่สำรวจมา เมื่อรวมค่าใช้จ่ายการย้าย</span>
      </div>

      <h4>Retention ต่อรองซ้ำได้ แต่ Refinance 6 ปีผูกมัด 6 ปี</h4>
      <p>Retention มักผูกราว 3 ปี แล้ว<b>ขอ Retention ซ้ำได้อีกรอบ</b> FinHome จึงตั้งค่าเริ่มต้นเป็น "ขอ Retention ซ้ำ" (เปลี่ยนเป็น "ปล่อยลอยตัว" ได้) ส่วนข้อเสนอ Refinance 6 ปีมัก<b>ห้ามไถ่ถอนตลอด 6 ปี</b> ย้ายหรือต่อรองใหม่ตอนปีที่ 4 ไม่ได้ ถ้าย้ายก่อนต้องเสียค่าปรับและคืนค่าใช้จ่ายที่ธนาคารออกให้</p>

      <h4>อ่านจุดคุ้มทุนให้ถูก</h4>
      <ul>
        <li><b>คืนทุนเดือนที่ X:</b> ส่วนต่างดอกเบี้ยที่ประหยัดได้ ชดเชยค่าใช้จ่ายการย้ายครบแล้ว</li>
        <li><b>คืนทุน (ชั่วคราว):</b> คืนทุนช่วงโปร แต่หลังหมดโปรธนาคารใหม่แพงขึ้นจนส่วนต่างหายไป สุดท้ายไม่คุ้ม</li>
        <li><b>คืนทุนหลังช่วงมุมมอง:</b> ต้องอยู่กับธนาคารใหม่นานกว่าที่เลือกดู จึงจะคุ้ม</li>
      </ul>

      <h4>ใช้หน้าไหนดี</h4>
      <ul>
        <li><b>ข้อเสนอ 3 ปี:</b> ธนาคารเสนออัตราเฉลี่ย 3 ปี (หรือขั้นบันไดปีที่ 1–3) ใช้หน้า "Refinance vs Retention" และสร้างเอกสารต่อรอง PDF ได้</li>
        <li><b>ข้อเสนอ 6 ปี / หลายธนาคาร:</b> กรอกอัตราทีละปีจนถึงปีที่ 6 ตามใบเสนอ แล้วดูต้นทุนจริง 6 ปีเทียบ Retention</li>
      </ul>

      <div class="info-callout">
        <b>เคล็ดลับก่อนตัดสินใจ</b>
        <span>ขอ<b>ตารางอัตราดอกเบี้ยรายปีจนถึงปีที่ 6</b> และค่า MRR ปัจจุบันจากทุกธนาคาร · เทียบทั้งข้อเสนอ 3 ปีและ 6 ปี · ถ้าวางแผนรีไฟแนนซ์อีกรอบเมื่อหมดโปร ให้เช็กระยะห้ามไถ่ถอน (ข้อเสนอ 3 ปี ห้าม 3 ปี / ข้อเสนอ 6 ปี ห้าม 6 ปี) และนับค่าย้ายรอบถัดไปด้วย</span>
      </div>
      <p class="label-sm">ตัวเลขตัวอย่างเป็นอัตราสมมติเพื่ออธิบายหลักการ ไม่ใช่ข้อเสนอของธนาคารใด</p>`
  };

  FH.INFO.contract = {
    title: 'ข้อควรรู้ก่อนเซ็นสัญญา Refinance',
    html: `
      <p class="info-lead">โปรโมชัน Refinance มักมาพร้อม<b>เงื่อนไขผูกมัด</b>ที่อยู่ในสัญญา และหลายคนอ่านไม่ครบ ตรวจ 3 เรื่องนี้ก่อนเซ็นทุกครั้ง</p>

      <h4>1. ระยะห้ามไถ่ถอน</h4>
      <p>ระยะผูกมัดมักเท่ากับระยะโปร: ข้อเสนอ 3 ปี <b>ห้ามไถ่ถอน 3 ปี</b> · ข้อเสนอ 6 ปี <b>ห้ามไถ่ถอน 6 ปี</b> ระหว่างนี้รีไฟแนนซ์ไปที่อื่น หรือปิดบัญชีก่อนกำหนด จะมีค่าใช้จ่ายตามข้อ 2–3</p>

      <h4>2. ค่าปรับไถ่ถอนก่อนกำหนด</h4>
      <p>มักคิดเป็น % ของยอดหนี้ (FinHome ประมาณไว้ 3%) ตรวจอัตราจริงในสัญญา</p>

      <h4>3. ค่าใช้จ่ายที่ "ฟรี" อาจต้องคืน</h4>
      <p>ค่าจดจำนอง ค่าประเมิน ค่าอากร ประกันอัคคีภัย ฯลฯ ที่ธนาคารใหม่บอกว่า "ออกให้" มักมีเงื่อนไขว่า<b>ต้องจ่ายคืนทั้งหมดหากไถ่ถอนก่อนครบระยะผูกมัด</b> ใน FinHome ให้ติ๊ก "ธนาคารใหม่ออกให้" ในต้นทุนแฝง ระบบจะไม่นับเป็นค่าใช้จ่ายวันนี้ แต่แสดงเป็นภาระที่ต้องคืนหากย้ายก่อนกำหนด</p>

      <div class="info-callout info-callout--warn">
        <b>เช็กลิสต์สิ่งที่ต้องหาในสัญญา</b>
        <span>☐ ระยะห้ามไถ่ถอน (กี่ปี) · ☐ อัตราค่าปรับ · ☐ รายการค่าใช้จ่ายที่ต้องคืนหากไถ่ถอนก่อนกำหนด · ☐ ตารางอัตราดอกเบี้ยรายปีจนถึงปีที่ 6 · ☐ อัตราหลังหมดโปร อ้างอิง MRR ลบเท่าไหร่ · ☐ เงื่อนไขการโปะ/ชำระเกินค่างวด</span>
      </div>

      <h4>คำถามที่ควรถามธนาคารก่อนเซ็น</h4>
      <ul>
        <li>ถ้าไถ่ถอนในปีที่ 4 ต้องจ่ายเท่าไหร่ ทั้งค่าปรับและค่าใช้จ่ายที่ต้องคืน?</li>
        <li>อัตราดอกเบี้ยปีที่ 4, 5, 6 เป็นเท่าไหร่ และ MRR วันนี้อยู่ที่เท่าไหร่?</li>
        <li>ค่าใช้จ่ายรายการไหนที่ธนาคารออกให้ และรายการไหนผู้กู้ต้องจ่ายเอง?</li>
        <li>โปะเงินต้นได้ไหม มีขั้นต่ำหรือค่าธรรมเนียมหรือเปล่า?</li>
      </ul>
      <p class="label-sm">เงื่อนไขแตกต่างตามธนาคารและโปรโมชัน ยึดตามสัญญาจริงเป็นหลัก</p>`
  };

  FH.INFO.effective = {
    title: 'ทำไมตัวเลขต่างจากค่าเฉลี่ยใน Excel?',
    html: `
      <p class="info-lead">ค่าเฉลี่ยใน Excel มักเอาอัตราแต่ละปีมาบวกกันแล้วหารด้วยจำนวนปี แต่ดอกเบี้ยจริง<b>คิดจากยอดหนี้ที่เหลือในแต่ละเดือน</b></p>
      <ul>
        <li>ปีแรก ๆ ยอดหนี้ยังสูง อัตราช่วงนี้จึงมีผลต่อดอกเบี้ยมาก</li>
        <li>ปีหลัง ๆ ยอดหนี้ลดลงแล้ว อัตราที่สูงในปีที่ 6 จึงมีผลน้อยกว่าที่ค่าเฉลี่ยธรรมดาแสดง</li>
      </ul>
      <div class="info-callout">
        <b>ตัวอย่าง</b>
        <span>ปีที่ 1–5 = 2.3–2.7% และปีที่ 6 = 6.575% → ค่าเฉลี่ยธรรมดา <b>3.18%</b> แต่อัตราที่จ่ายจริงตามยอดหนี้ (ยอดหนี้ ฿2.45 ล้าน ค่างวด ฿18,500) ประมาณ <b>2.97%</b></span>
      </div>
      <p>FinHome คำนวณดอกเบี้ยทีละเดือนตามยอดหนี้จริง ผลรวมดอกเบี้ย จุดคุ้มทุน และ "อัตราที่จ่ายจริง" จึงอาจต่ำกว่าค่าเฉลี่ยใน Excel ประมาณ 0.1–0.2% ส่วน "เฉลี่ย X ปี" ในตารางรายปีเป็นค่าเฉลี่ยธรรมดา ไว้เทียบกับตัวเลขที่ธนาคารโฆษณา</p>`
  };

  /* ---------- popup ---------- */
  let scrim, lastFocus;
  function build() {
    scrim = document.createElement('div');
    scrim.className = 'scrim';
    scrim.hidden = true;
    scrim.innerHTML = `
      <div class="dialog dialog--info" role="dialog" aria-modal="true" aria-labelledby="infoTitle">
        <button type="button" class="dialog__close" aria-label="ปิด" data-info-close>×</button>
        <h3 id="infoTitle"></h3>
        <div class="info-body" id="infoBody"></div>
      </div>`;
    document.body.appendChild(scrim);
    scrim.addEventListener('click', e => { if (e.target === scrim || e.target.closest('[data-info-close]')) close(); });
    document.addEventListener('keydown', e => {
      if (scrim.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { // keep focus inside the popup
        const f = Array.from(scrim.querySelectorAll('button, a[href]'));
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
  function open(key) {
    const c = FH.INFO[key];
    if (!c) return;
    if (!scrim) build();
    lastFocus = document.activeElement;
    scrim.querySelector('#infoTitle').textContent = c.title;
    scrim.querySelector('#infoBody').innerHTML = c.html;
    scrim.querySelector('.dialog').scrollTop = 0;
    scrim.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => { scrim.classList.add('is-open'); scrim.querySelector('[data-info-close]').focus(); });
  }
  function close() {
    scrim.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { scrim.hidden = true; }, 200);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  FH.openInfo = open;

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-info]');
    if (b) { e.preventDefault(); open(b.dataset.info); }
  });
})();
