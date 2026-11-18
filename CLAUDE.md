# FinHome — project notes for Claude Code

Thai home-loan helper website: **https://finhomethailand.com** (www redirects to root).
Owner works in Thai, is non-technical, and prefers to **verify financial logic before code changes** ("Verify กันก่อน"). Always **ask before pushing** — a push to `main` updates the live site.

## Golden rules
- **No user data, ever (PDPA).** No backend, database, cookies, localStorage/sessionStorage, analytics or trackers. Everything is calculated in the browser. `privacy.html` promises this — adding any data collection (incl. Cloudflare Web Analytics) requires updating the policy and asking first.
- Inputs move between pages **only in the URL fragment** (`#d=<base64url JSON>`, `report.html#t=retention|readiness&d=…`), never query strings. Untrusted hash data goes through `FH.mergeState` (whitelists enums, banks, gender; numbers keep only `0-9.,`).
- Thai UI copy. Money as `฿1,234,567`, rates `3.35%`. Disclaimers stay (not personal financial advice).
- Static HTML/CSS/JS only, no build step, no Node. Design tokens from the Claude Design handoff (`css/tokens.css`): navy `--navy-700 #1E3A8A`, gold `--gold-600 #D97706`, fonts Prompt (display) / Anuphan (body) from Google Fonts, icons Lucide 0.454.0 from unpkg with an SRI hash.

## Files
| Page | Script | Purpose |
|---|---|---|
| `index.html` | inline + `core.js` | Landing, tool cards |
| `buy.html` | `buy.js` | New-home loan: max loan by DSR 40%, payment, transfer costs, +1/+2% stress test → Homebuyer Readiness Report |
| `refinance.html` | `refinance.js` | **3-year** Refinance vs Retention (6 visible inputs; details in `<details class="more">`) → Retention Negotiation Kit PDF, .ics reminder |
| `refinance-6y.html` | `refinance6.js` | **6-year** multi-bank offer comparison (up to 7 banks, yearly rates y1–y5 + y6 float) vs Retention |
| `prepay.html` / `tax.html` | `prepay.js` / `tax.js` | Prepayment (โปะบ้าน) schedule + CSV; home-loan interest tax deduction |
| `report.html` | `report.js` + `css/report.css` | One-page A4 reports, printed/saved via `window.print()` (no PDF library — Thai shaping) |
| `privacy.html`, `404.html` | — | Policy (owner: FinHome, contact.finhome@gmail.com, host Cloudflare) |

Shared JS: `core.js` (helpers, layout header/footer injection, hash state, form binding), `calc.js` (all pure calculations), `info.js` (ⓘ popups: mrta, horizon, contract, effective), `refi-common.js` (hidden-cost rows, page tabs).

## Conventions / gotchas
- **Cache busting:** every page links assets with `?v=N`. When you change a CSS/JS file, bump its `?v=` in **all** HTML files. Current: styles v17, tokens v5, report.css v3, core v5, calc v4, info v4, refi-common v1, refinance v7, refinance6 v2, report v4, buy v2, prepay v2, tax v1.
- `css/styles.css` starts with `@charset "UTF-8";` (Thai text in CSS `content:`) and uses **CRLF** line endings — Git Bash `sed -i` rewrites it to LF and the whole file shows as changed; restore CRLF before committing.
- Files are UTF-8 **without** BOM. Windows PowerShell 5.1 scripts containing Thai need a BOM to run.
- `.sr-only` is absolutely positioned: scroll containers holding it need `position:relative` (caused a page-width overflow once).
- The site sends `X-Frame-Options: DENY` + `frame-ancestors 'none'`, so it can't be tested inside iframes on the live domain (works locally).
- Print/PDF must fit one A4 page: simulate by giving `.paper` width 718px with print styles; content height must be ≤ 1047px (currently ~993 / 914).

## Calculation model (verified with the owner)
- Interest is simulated month by month at a constant payment (`FH.sim`), so "อัตราที่จ่ายจริง" (balance-weighted) is ~0.1–0.2% lower than a simple average of yearly rates.
- Retention: promo rate years 1–3; years 4–6 default **"ขอ Retention ซ้ำ"** (blank = same rate) or float. Refinance 6-year offers are locked 6 years; 3-year offers 3 years.
- Hidden costs: mortgage 1% of balance, appraisal ฿3,000, MRTA estimate, fire 0.3%, stamp 0.05%, old-loan penalty 3% (off by default), other. Fees "ธนาคารใหม่ออกให้" are excluded from cost but shown as repayable on early exit (+ assumed 3% new-loan penalty).
- MRTA estimate is a rough heuristic from the mockup: refinance page `bal × (0.8% + 0.06%×(age−25)) × (male 1.15) × min(remaining,10)/10`; buy page flat 2.5% of loan (inconsistent — owner knows; calibrate with real quotes later).
- Tax brackets 0/5/10/15/20/25/30/35% at 150k/300k/500k/750k/1M/2M/5M; home-interest deduction cap ฿100,000 shared by co-borrowers.

**Regression values (defaults):** buy max loan ฿4,676,595, payment ฿18,186 · refinance 3y: Refinance wins by ฿46,470, target ≤ 4.47%, break-even month 23, costs ฿80,592 (with penalty on → Retention wins) · 6y with Retention 3.10% vs the 7-bank sample: best = bank 4 (effective 2.97%), Retention cheaper by ฿63,866, target ≤ 3.58% · prepay base 168 months, saves ฿118,516 · tax before ฿41,000, saved ฿12,750.

## Deploy
- GitHub `PSGGWP-36/finhome`, branch `main` → **Cloudflare Workers static assets** deploys automatically (~30–60 s). Config: `wrangler.jsonc` (worker `finhome`, custom domains, `not_found_handling: 404-page`), `_headers` (CSP, X-Frame-Options, cache), `.assetsignore` (keeps .md, .ps1, config off the site). Listing custom domains disables the workers.dev URL (intended).
- www → root is a Cloudflare **Redirect Rule** (dashboard, 301, preserve query string).
- `git.exe` is at `C:\Program Files\Git\cmd\git.exe` (may not be on PATH). Commits use local identity `FinHome <contact.finhome@gmail.com>`. Saved GitHub login works for non-interactive push; if a login is needed, run the push in the Terminal panel.
- Share images (`assets/og/*.png`, 1200×630) were generated with a System.Drawing script using the Leelawadee UI font; OG/canonical tags sit between `<!-- share:start -->` / `<!-- share:end -->` in each page. `sitemap.xml` lists the 7 indexable pages.
- `prepare-upload.ps1` builds `..\FinHome-upload` for a manual drag-and-drop upload (not needed with Git deploys).

## Status / next
- Done: Phase 1 (all tools + PDFs), Phase 2 step 0 (share previews, canonical, sitemap, www redirect).
- Owner to do: Google Search Console (verify domain, submit `sitemap.xml`); test share previews (Facebook Sharing Debugger, LINE); test "บันทึก PDF" and .ics on a real phone.
- Phase 2 part 1: bank rate table page (manually compiled, sourced and dated; button to load a bank into the 6-year comparison). Decide who updates it monthly.
- Phase 2 part 2: knowledge hub articles (DSR, MRR/MLR/MOR, Refinance vs Retention steps, the 6-year-offer trap, transfer costs, MRTA, prepay/tax), each linking to a calculator.
- Phase 3: monetization without user data — bank affiliate links (bank collects the data), B2B embeddable calculator, sponsored listings (labelled).
