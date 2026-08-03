/* ============================================================
   format-tanggal.js — Kunci format tanggal ke dd/mm/yyyy
   ------------------------------------------------------------
   MASALAH:
   <input type="date"> menampilkan tanggal mengikuti locale
   browser/OS pemakai. Di perangkat ber-locale en-US tampilannya
   jadi mm/dd/yyyy, di en-GB/id-ID jadi dd/mm/yyyy. Tidak ada
   atribut/CSS yang bisa memaksanya — Chrome mengabaikan lang="id".

   SOLUSI:
   Setiap <input type="date"> diubah menjadi input teks bertopeng
   (mask) dd/mm/yyyy + kalender pop-up buatan sendiri, sehingga
   tampilannya SAMA di semua perangkat.

   AMAN UNTUK KODE LAMA:
   properti .value tetap mengembalikan & menerima format ISO
   "yyyy-mm-dd" persis seperti input type=date bawaan, jadi semua
   handler seperti onchange="jpSetTahap(0,'awalTgl',this.value)"
   tidak perlu diubah sama sekali.

   PEMAKAIAN (di file HTML, SETELAH app.js):
     <script src="app.js"></script>
     <script src="format-tanggal.js"></script>
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Konfigurasi ---------- */
  var CFG = {
    lockTime: false,   // true = jam juga dipaksa 24 jam (HH:MM), mematikan AM/PM di perangkat en-US
    firstDay: 1,       // 0 = kalender mulai Minggu, 1 = mulai Senin
    accent: '#0e7f8c'  // warna aksen kalender (samakan dengan tema aplikasi)
  };

  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  /* Akses nilai mentah input (bypass properti .value yang kita timpa) */
  var RAW = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  function rawGet(el) { return RAW.get.call(el); }
  function rawSet(el, v) { RAW.set.call(el, v); }

  /* ---------- Konversi format ---------- */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* '2026-08-04'  ->  '04/08/2026' */
  function isoToTxt(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso == null ? '' : iso).trim());
    return m ? (m[3] + '/' + m[2] + '/' + m[1]) : '';
  }

  /* '04/08/2026'  ->  '2026-08-04'  (kembalikan '' bila tanggal tidak sah) */
  function txtToIso(txt) {
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(txt == null ? '' : txt).trim());
    if (!m) return '';
    var d = +m[1], mo = +m[2], y = +m[3];
    if (mo < 1 || mo > 12 || d < 1 || y < 1000) return '';
    if (d > new Date(y, mo, 0).getDate()) return '';   // 31/02 dst. ditolak
    return m[3] + '-' + pad2(mo) + '-' + pad2(d);
  }

  /* Topeng ketikan: sisakan angka, sisipkan '/' otomatis */
  function maskDate(s) {
    var d = String(s).replace(/\D/g, '').slice(0, 8), out = d.slice(0, 2);
    if (d.length > 2) out += '/' + d.slice(2, 4);
    if (d.length > 4) out += '/' + d.slice(4, 8);
    return out;
  }

  /* Topeng jam 24 jam */
  function maskTime(s) {
    var d = String(s).replace(/\D/g, '').slice(0, 4), out = d.slice(0, 2);
    if (d.length > 2) out += ':' + d.slice(2, 4);
    return out;
  }
  function normTime(s) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim());
    if (!m) return '';
    var h = +m[1], mi = +m[2];
    if (h > 23 || mi > 59) return '';
    return pad2(h) + ':' + pad2(mi);
  }

  /* Jumlah digit sebelum posisi kursor — dipakai menaruh ulang kursor */
  function digitsBefore(str, pos) { return (str.slice(0, pos).match(/\d/g) || []).length; }
  function posAfterDigits(str, n) {
    if (n <= 0) return 0;
    var c = 0;
    for (var i = 0; i < str.length; i++) { if (/\d/.test(str[i])) { c++; if (c === n) return i + 1; } }
    return str.length;
  }

  function fire(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /* ---------- Konversi elemen ---------- */
  function convertDate(el) {
    if (el.__idd) return;
    el.__idd = 'date';

    var iso = rawGet(el);              // nilai ISO bawaan sebelum tipe diubah
    el.type = 'text';
    el.setAttribute('data-idd', 'date');
    el.setAttribute('inputmode', 'numeric');
    el.setAttribute('autocomplete', 'off');
    el.maxLength = 10;
    if (!el.placeholder) el.placeholder = 'dd/mm/yyyy';
    rawSet(el, isoToTxt(iso));

    /* .value tetap berbicara ISO, sama seperti input type=date asli */
    Object.defineProperty(el, 'value', {
      configurable: true,
      get: function () { return txtToIso(rawGet(el)); },
      set: function (v) { rawSet(el, isoToTxt(v)); }
    });

    /* Beri ruang untuk ikon kalender bila padding bawaan terlalu sempit */
    var pr = parseFloat(getComputedStyle(el).paddingRight) || 0;
    if (pr < 26) el.style.paddingRight = '28px';
  }

  function convertTime(el) {
    if (el.__idd) return;
    el.__idd = 'time';
    var v = rawGet(el);
    el.type = 'text';
    el.setAttribute('data-idd', 'time');
    el.setAttribute('inputmode', 'numeric');
    el.setAttribute('autocomplete', 'off');
    el.maxLength = 5;
    if (!el.placeholder) el.placeholder = 'HH:MM';
    rawSet(el, normTime(v));
    Object.defineProperty(el, 'value', {
      configurable: true,
      get: function () { return normTime(rawGet(el)); },
      set: function (v2) { rawSet(el, normTime(v2)); }
    });
  }

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    var i, list = root.querySelectorAll('input[type="date"]');
    for (i = 0; i < list.length; i++) convertDate(list[i]);
    if (root.matches && root.matches('input[type="date"]')) convertDate(root);
    if (CFG.lockTime) {
      list = root.querySelectorAll('input[type="time"]');
      for (i = 0; i < list.length; i++) convertTime(list[i]);
      if (root.matches && root.matches('input[type="time"]')) convertTime(root);
    }
  }

  /* ---------- Ketikan pengguna ---------- */
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.__idd) return;
    var before = rawGet(el), pos = el.selectionStart || 0, n = digitsBefore(before, pos);
    var after = el.__idd === 'date' ? maskDate(before) : maskTime(before);
    if (after !== before) {
      rawSet(el, after);
      try { var p = posAfterDigits(after, n); el.setSelectionRange(p, p); } catch (err) { }
    }
  }, true);

  /* Rapikan saat meninggalkan kolom: lengkapi/normalkan, kosongkan bila tak sah */
  document.addEventListener('blur', function (e) {
    var el = e.target;
    if (!el || !el.__idd) return;
    var raw = String(rawGet(el)).trim();
    if (!raw) return;

    if (el.__idd === 'date') {
      var m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(raw);
      if (m) {                                   // 4/8/26 -> 04/08/2026
        var y = m[3].length === 2 ? '20' + m[3] : m[3];
        if (m[3].length === 3) y = '';
        raw = y ? (pad2(+m[1]) + '/' + pad2(+m[2]) + '/' + y) : '';
      }
      var iso = txtToIso(raw);
      var fix = iso ? isoToTxt(iso) : '';
      if (fix !== rawGet(el)) { rawSet(el, fix); fire(el); }
    } else {
      var t = normTime(raw) || normTime(maskTime(raw));
      if (t !== rawGet(el)) { rawSet(el, t); fire(el); }
    }
  }, true);

  /* Enter = selesai mengisi */
  document.addEventListener('keydown', function (e) {
    var el = e.target;
    if (!el || !el.__idd) return;
    if (e.key === 'Enter') { el.blur(); }
    if (el.__idd === 'date' && (e.key === 'ArrowDown' || e.key === 'F4') && !e.shiftKey) {
      e.preventDefault(); openCal(el);
    }
  }, true);

  /* Klik pada area ikon kalender (30px paling kanan) membuka kalender */
  document.addEventListener('mousedown', function (e) {
    var el = e.target;
    if (!el || el.__idd !== 'date' || el.disabled || el.readOnly) return;
    if (e.offsetX >= el.clientWidth - 30) { e.preventDefault(); el.focus(); openCal(el); }
  }, true);

  /* ============================================================
     Kalender pop-up
     ============================================================ */
  var cal = null, calFor = null, calY = 0, calM = 0;

  function buildCal() {
    cal = document.createElement('div');
    cal.className = 'idd-cal';
    cal.addEventListener('mousedown', function (e) { e.preventDefault(); }); // jangan lepas fokus input
    cal.addEventListener('click', onCalClick);
    document.body.appendChild(cal);
  }

  function openCal(el) {
    if (!cal) buildCal();
    calFor = el;
    var iso = txtToIso(rawGet(el)), d = iso ? new Date(iso + 'T00:00:00') : new Date();
    calY = d.getFullYear(); calM = d.getMonth();
    drawCal(); placeCal();
    cal.classList.add('is-open');
  }

  function closeCal() { if (cal) cal.classList.remove('is-open'); calFor = null; }

  function placeCal() {
    if (!calFor) return;
    var r = calFor.getBoundingClientRect();
    cal.style.visibility = 'hidden'; cal.classList.add('is-open');
    var h = cal.offsetHeight, w = cal.offsetWidth;
    var top = r.bottom + 6, left = r.left;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
    if (left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8);
    cal.style.top = top + 'px'; cal.style.left = left + 'px';
    cal.style.visibility = '';
  }

  function drawCal() {
    var sel = calFor ? txtToIso(rawGet(calFor)) : '';
    var today = new Date(), tIso = today.getFullYear() + '-' + pad2(today.getMonth() + 1) + '-' + pad2(today.getDate());

    var first = new Date(calY, calM, 1);
    var lead = (first.getDay() - CFG.firstDay + 7) % 7;
    var dim = new Date(calY, calM + 1, 0).getDate();

    var head = '';
    for (var i = 0; i < 7; i++) {
      var wd = (i + CFG.firstDay) % 7;
      head += '<span class="idd-wd' + (wd === 0 || wd === 6 ? ' is-we' : '') + '">' + HARI[wd] + '</span>';
    }

    var cells = '';
    for (var k = 0; k < lead; k++) cells += '<span class="idd-d is-off"></span>';
    for (var day = 1; day <= dim; day++) {
      var iso = calY + '-' + pad2(calM + 1) + '-' + pad2(day);
      var wd2 = new Date(calY, calM, day).getDay();
      var cls = 'idd-d';
      if (wd2 === 0 || wd2 === 6) cls += ' is-we';
      if (iso === tIso) cls += ' is-today';
      if (iso === sel) cls += ' is-sel';
      cells += '<button type="button" class="' + cls + '" data-iso="' + iso + '">' + day + '</button>';
    }

    cal.innerHTML =
      '<div class="idd-hd">' +
        '<button type="button" class="idd-nav" data-nav="-12" title="Tahun sebelumnya">&laquo;</button>' +
        '<button type="button" class="idd-nav" data-nav="-1" title="Bulan sebelumnya">&lsaquo;</button>' +
        '<span class="idd-title">' + BULAN[calM] + ' ' + calY + '</span>' +
        '<button type="button" class="idd-nav" data-nav="1" title="Bulan berikutnya">&rsaquo;</button>' +
        '<button type="button" class="idd-nav" data-nav="12" title="Tahun berikutnya">&raquo;</button>' +
      '</div>' +
      '<div class="idd-grid idd-wds">' + head + '</div>' +
      '<div class="idd-grid idd-days">' + cells + '</div>' +
      '<div class="idd-ft">' +
        '<button type="button" class="idd-act" data-act="today">Hari ini</button>' +
        '<button type="button" class="idd-act" data-act="clear">Kosongkan</button>' +
      '</div>';
  }

  function onCalClick(e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b || !calFor) return;

    if (b.dataset.nav) {
      var n = +b.dataset.nav, t = new Date(calY, calM + n, 1);
      calY = t.getFullYear(); calM = t.getMonth();
      drawCal(); placeCal(); return;
    }
    if (b.dataset.act === 'today') {
      var d = new Date();
      setFromCal(d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())); return;
    }
    if (b.dataset.act === 'clear') { setFromCal(''); return; }
    if (b.dataset.iso) setFromCal(b.dataset.iso);
  }

  function setFromCal(iso) {
    var el = calFor;
    rawSet(el, isoToTxt(iso));
    fire(el);
    closeCal();
    try { el.focus(); } catch (e) { }
  }

  document.addEventListener('mousedown', function (e) {
    if (cal && cal.classList.contains('is-open') && !cal.contains(e.target) && e.target !== calFor) closeCal();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCal(); });
  window.addEventListener('resize', function () { if (calFor) placeCal(); });
  window.addEventListener('scroll', function () { if (calFor) placeCal(); }, true);

  /* ============================================================
     Gaya
     ============================================================ */
  function injectCSS() {
    var icon = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23667' stroke-width='2' stroke-linecap='round'><rect x='3' y='5' width='18' height='16' rx='2'/><path d='M8 3v4M16 3v4M3 10h18'/></svg>\")";
    var css =
      'input[data-idd="date"]{background-image:' + icon + ' !important;' +
      'background-repeat:no-repeat !important;background-position:right 8px center !important;' +
      'background-size:16px 16px !important;cursor:text}' +
      'input[data-idd]{font-variant-numeric:tabular-nums}' +

      '.idd-cal{position:fixed;z-index:99999;display:none;width:252px;padding:10px;' +
      'background:#fff;border:1px solid #dfe5e8;border-radius:12px;' +
      'box-shadow:0 12px 32px rgba(15,40,50,.18);font:13px/1.3 inherit;color:#243238;' +
      'font-family:inherit;user-select:none}' +
      '.idd-cal.is-open{display:block}' +
      '.idd-hd{display:flex;align-items:center;gap:2px;margin-bottom:8px}' +
      '.idd-title{flex:1;text-align:center;font-weight:700;font-size:13.5px}' +
      '.idd-nav{width:24px;height:24px;border:0;border-radius:6px;background:transparent;' +
      'color:#5b7079;cursor:pointer;font-size:14px;line-height:1}' +
      '.idd-nav:hover{background:#eef4f5;color:' + CFG.accent + '}' +
      '.idd-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}' +
      '.idd-wd{text-align:center;font-size:10.5px;font-weight:700;letter-spacing:.3px;' +
      'color:#8496a0;padding:2px 0}' +
      '.idd-wd.is-we{color:#c2553f}' +
      '.idd-d{height:30px;border:0;border-radius:7px;background:transparent;cursor:pointer;' +
      'font:inherit;font-size:12.5px;color:#243238;padding:0}' +
      '.idd-d.is-off{cursor:default}' +
      '.idd-d.is-we{color:#c2553f}' +
      '.idd-d:not(.is-off):hover{background:#eef4f5}' +
      '.idd-d.is-today{box-shadow:inset 0 0 0 1.5px ' + CFG.accent + '}' +
      '.idd-d.is-sel{background:' + CFG.accent + ';color:#fff;font-weight:700}' +
      '.idd-ft{display:flex;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid #eef1f3}' +
      '.idd-act{flex:1;height:28px;border:1px solid #dfe5e8;border-radius:7px;background:#fff;' +
      'cursor:pointer;font:inherit;font-size:12px;color:#3d525c}' +
      '.idd-act:hover{border-color:' + CFG.accent + ';color:' + CFG.accent + '}';

    var s = document.createElement('style');
    s.id = 'idd-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* Salin aturan CSS lama yang memakai [type="date"] agar tetap berlaku
     setelah tipe input berubah menjadi text. */
  function mirrorCSS() {
    var extra = [];
    for (var i = 0; i < document.styleSheets.length; i++) {
      var rules;
      try { rules = document.styleSheets[i].cssRules; } catch (e) { continue; }  // stylesheet lintas-domain
      if (!rules) continue;
      for (var j = 0; j < rules.length; j++) {
        var r = rules[j];
        if (!r.selectorText || !/\[\s*type\s*=\s*["']?(date|time)["']?\s*\]/i.test(r.selectorText)) continue;
        var sel = r.selectorText.replace(/\[\s*type\s*=\s*["']?date["']?\s*\]/gi, '[data-idd="date"]')
                                .replace(/\[\s*type\s*=\s*["']?time["']?\s*\]/gi, '[data-idd="time"]');
        extra.push(sel + '{' + r.style.cssText + '}');
      }
    }
    if (extra.length) {
      var s = document.createElement('style');
      s.id = 'idd-mirror';
      s.textContent = extra.join('\n');
      document.head.appendChild(s);
    }
  }

  /* ============================================================
     Jalankan + pantau DOM (aplikasi sering render ulang via innerHTML)
     ============================================================ */
  function start() {
    try { mirrorCSS(); } catch (e) { }   // aturan CSS lama disalin lebih dulu…
    injectCSS();                          // …agar gaya modul menang saat spesifisitas sama
    scan(document);
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var ns = muts[i].addedNodes;
        for (var j = 0; j < ns.length; j++) if (ns[j].nodeType === 1) scan(ns[j]);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  /* API kecil bila sewaktu-waktu perlu dipanggil manual */
  window.IDDate = {
    refresh: function (root) { scan(root || document); },
    isoToTxt: isoToTxt,
    txtToIso: txtToIso,
    config: CFG
  };
})();
