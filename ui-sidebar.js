/* ============================================================
   ui-sidebar.js — pelengkap tata letak SIDEBAR
   Dimuat PALING AKHIR (sesudah app-lain.js).

   Isi:
     1. Ciutkan/lebarkan sidebar (+ ingat pilihan terakhir)
     2. Tooltip nama menu saat sidebar menciut
     3. Jejak halaman (breadcrumb) di bilah atas
     4. Tombol LAYAR PENUH pada modal pratinjau file

   Tidak ada satu pun fungsi lama yang ditimpa, kecuali
   closePnPreview yang DIBUNGKUS (fungsi aslinya tetap dipanggil).
   ============================================================ */
(function(){
'use strict';

/* ---------- 1. Sidebar melebar mengikuti kursor ----------
   Keadaan diam = rail ikon. Kursor menyentuh sidebar -> melebar penuh
   (melayang di atas isi halaman, konten tidak bergeser). Kursor pergi ->
   menciut sendiri setelah jeda singkat supaya tidak berkedip saat kursor
   sekadar melintas. Tidak ada lagi tombol ciutkan manual. */
/* Jeda sebelum sidebar menciut sesudah kursor pergi. Dulu 260 ms; ditambah
   animasi lebar 260 ms, totalnya lebih dari setengah detik sejak kursor
   menjauh sampai sidebar benar-benar rapat — itulah yang terasa "menggantung".
   110 ms masih cukup untuk mencegah kedipan saat kursor sekadar melintasi
   tepi, tetapi terasa langsung menanggapi. */
var HOVER_OUT_MS=110;
/* Sidebar mulai melebar SEBELUM kursor menyentuhnya — cukup mendekat sejauh
   ini dari tepi rail. Hanya berlaku bila kursor memang sedang bergerak KE ARAH
   sidebar, supaya tidak terbuka sendiri saat pengguna bekerja di dekat tepi
   kiri tabel. */
var HOVER_IN_PX=24;   /* rail 76px + padding isi 24px -> zona ini jatuh tepat
                         di ruang kosong sebelum kolom pertama tabel */
function isSmall(){ return window.matchMedia('(max-width:1024px)').matches; }
function noHover(){ return window.matchMedia('(hover:none)').matches; }

/* ---------- LORONG MENUJU GAGANG ANAK PANAH ----------
   Gagang panah kini berdiri DI LUAR rail (lihat bagian 1f) dan
   MENGHILANG begitu sidebar terbuka. Tanpa penjagaan, gagang itu
   mustahil diklik: mendekatkan kursor ke sana sudah masuk zona
   HOVER_IN_PX, sidebar melebar duluan, gagangnya lenyap tepat
   sebelum jari sampai — klik selalu jatuh ke sidebar yang sudah
   melebar.

   Jadi pita mendatar setinggi gagang (ditambah sedikit ke kanan)
   dinyatakan sebagai LORONG: selama kursor berada di dalamnya,
   sidebar TIDAK membuka sendiri. Mendekat dari ketinggian lain
   tetap membuka seperti biasa. Zonanya diukur oleh initPeekHandle
   dan dikosongkan (null) begitu sidebar terbuka atau gagangnya
   memang tidak dipakai (mode laci). */
var ZONA_GAGANG=null;
function diLorongGagang(x,y){
  var z=ZONA_GAGANG; if(!z) return false;
  return x>=z.x1 && x<=z.x2 && y>=z.y1 && y<=z.y2;
}

/* Tombol ☰ di bilah atas hanya dipakai layar kecil (laci geser). */
window.toggleSidebar=function(){
  if(typeof toggleMobileNav==='function') toggleMobileNav();
};

function initHoverSidebar(){
  var el=document.getElementById('sidebar-shell'); if(!el) return;
  var t=null;

  /* Kursor benar-benar berada di atas sidebar? Diperiksa lewat KOORDINAT,
     bukan sekadar percaya pada peristiwa mouseleave.
     Alasannya: mengklik menu memunculkan lapisan "Memuat" yang menutupi
     seluruh layar. Lapisan itu muncul TEPAT DI BAWAH kursor, sehingga
     peramban mengirim mouseleave ke sidebar walau kursor tidak bergerak
     sedikit pun — sidebar menciut sekejap lalu terbuka lagi begitu lapisan
     hilang. Itulah kedipan yang terasa mengganggu. */
  var lastX=-1, lastY=-1;
  /* ==== KEHALUSAN 120 Hz ====
     getBoundingClientRect() memaksa browser menghitung ulang tata letak SAAT
     ITU JUGA. Dulu dipanggil sampai dua kali pada SETIAP mousemove; dengan
     mouse 1000 Hz itu ribuan hitung ulang paksa per detik, tepat saat sidebar
     sedang menganimasikan lebarnya — inilah yang membuat animasinya patah.
     Ukuran sidebar disimpan (cache) dan hanya diperbarui saat benar-benar
     berubah: selesai transisi, ukuran jendela berubah, atau halaman digulir. */
  var rc=null;
  function segarkanRect(){ rc=el.getBoundingClientRect(); }
  function rect(){ if(!rc) segarkanRect(); return rc; }
  /* Lebar sidebar saat menciut & melebar dibaca sekali dari variabel CSS.
     Dipakai untuk MEMPERBARUI cache seketika begitu kelas .is-open berubah —
     tanpa ini ada jendela ±170 ms (selama animasi berjalan) ketika cache masih
     menyimpan lebar lama, sehingga pemeriksaan "kursor sudah jauh?" memakai
     angka yang salah dan sidebar bisa menutup sendiri tepat setelah dibuka. */
  var lebarRail=76, lebarBuka=268;
  try{
    var cs=getComputedStyle(document.documentElement);
    lebarRail=parseFloat(cs.getPropertyValue('--side-rail'))||76;
    lebarBuka=parseFloat(cs.getPropertyValue('--side-w'))||268;
  }catch(e){}
  function tebakRect(lebar){
    var r=rect(); if(!r) return;
    rc={left:r.left, top:r.top, bottom:r.bottom, right:r.left+lebar, width:lebar, height:r.height};
  }
  el.addEventListener('transitionend', function(e){ if(e.propertyName==='width') segarkanRect(); });
  window.addEventListener('resize', segarkanRect, {passive:true});
  window.addEventListener('scroll', segarkanRect, {passive:true});
  function diAtas(x,y){
    if(x<0) return false;
    var r=rect();
    return x>=r.left-1 && x<=r.right+1 && y>=r.top-1 && y<=r.bottom+1;
  }
  function pointerDiAtas(e){ return diAtas(e.clientX,e.clientY); }
  function pointerTerakhirDiAtas(){ return diAtas(lastX,lastY); }
  function open(){
    if(isSmall()||noHover()) return;
    clearTimeout(t);
    if(el.classList.contains('is-open')) return;   /* jangan menulis kelas yang sudah ada */
    el.classList.add('is-open');
    tebakRect(lebarBuka);                          /* cache langsung dipakai lebar barunya */
  }
  function close(now){
    clearTimeout(t);
    /* Dikunci lewat gagang anak panah -> abaikan semua permintaan menciut */
    if(el.classList.contains('is-pinned')) return;
    t=setTimeout(function(){
      el.classList.remove('is-open');
      tebakRect(lebarRail);
      /* grup yang terlanjur terbuka ikut ditutup supaya rapi saat menciut */
      el.querySelectorAll('.topnav-group.open').forEach(function(g){ g.classList.remove('open'); });
      el.querySelectorAll('.topnav-sub.open').forEach(function(s){ s.classList.remove('open'); });
      if(typeof openActiveBranch==='function') openActiveBranch();
    }, now?0:HOVER_OUT_MS);
  }
  el.addEventListener('mouseenter',open);
  el.addEventListener('mouseleave',function(e){
    if(pointerDiAtas(e)) return;      // kursor masih di sidebar -> jangan menciut
    close(false);
  });
  /* Jaring pengaman: bila peristiwa "keluar" tidak pernah datang (mis. kursor
     melompat karena lapisan lain), menciut begitu kursor benar-benar menjauh. */
  /* Pemeriksaan posisi kursor dibatasi SATU KALI PER FRAME (rAF). Tanpa ini,
     mouse 1000 Hz memicu ratusan pemeriksaan di antara dua frame — semuanya
     terbuang karena layar hanya menggambar sekali. */
  var mmRaf=0, prevX=-1;
  function periksaKursor(){
    mmRaf=0;
    if(isSmall()||noHover()) return;
    var r=rect(); if(!r) return;
    var dalamTinggi = lastY>=r.top-1 && lastY<=r.bottom+1;

    if(!el.classList.contains('is-open')){
      /* NIAT HOVER: mulai melebar begitu kursor MENDEKAT (bukan menunggu
         sampai benar-benar menyentuh), asalkan arah geraknya memang menuju
         sidebar. Ini yang menghilangkan rasa "telat membuka". */
      /* Harus benar-benar bergerak ke kiri. Kalau dipakai "<=", kursor yang
         sekadar bergerak naik-turun di x yang sama (mis. menyusuri kolom No.)
         akan membuka sidebar sendiri. */
      var menujuKiri = (prevX<0) || (lastX < prevX);
      /* Kursor sedang menuju gagang panah -> jangan buka sendiri,
         beri kesempatan gagangnya diklik (lihat ZONA_GAGANG). */
      if(diLorongGagang(lastX,lastY)) return;
      if(dalamTinggi && menujuKiri && lastX>=0 && lastX <= r.right + HOVER_IN_PX) open();
      return;
    }
    /* Sudah terbuka: menciut begitu kursor jelas meninggalkan area sidebar.
       Ambangnya dipersempit (dulu 28px) agar responsnya terasa langsung. */
    if(lastX > r.right + 14 || !dalamTinggi) close(false);
    else if(diAtas(lastX,lastY)) open();
  }
  document.addEventListener('mousemove',function(e){
    prevX=lastX;
    lastX=e.clientX; lastY=e.clientY;
    if(!mmRaf) mmRaf=requestAnimationFrame(periksaKursor);
  },{passive:true});
  /* Navigasi papan ketik (Tab) juga harus bisa membukanya */
  el.addEventListener('focusin',open);
  el.addEventListener('focusout',function(e){
    /* Mengklik menu memindahkan fokus, dan lapisan "Memuat" merebutnya lagi —
       tanpa penjagaan ini sidebar ikut menciut padahal kursor belum ke mana-mana. */
    if(pointerTerakhirDiAtas()) return;
    if(!el.contains(e.relatedTarget)) close(false);
  });
  window.addEventListener('resize',function(){ if(isSmall()) el.classList.remove('is-open','is-pinned'); });
}

/* ---------- 1b. Laci navigasi tertutup saat diketuk DI LUAR ----------
   Sebelumnya laci hanya bisa ditutup lewat scrim (.topnav-backdrop) atau
   dengan memilih salah satu menu. Di iPad LANSKAP scrim itu tidak pernah
   tampil (lebarnya > 1024 px) sehingga ketukan di luar navigasi tidak
   berpengaruh apa-apa — laci baru menutup setelah menu dipilih.

   Penjaga di bawah ini berdiri sendiri: selama laci sedang terbuka, ketukan
   / klik mana pun di luar #sidebar-shell akan menutupnya, tak peduli ada
   tidaknya scrim. Tombol ☰ dikecualikan supaya tidak "tutup lalu buka lagi"
   dalam satu ketukan. */
/* Laci geser dipakai HANYA bila tampilan sedang tidak memakai rail
   (lihat modeRail di bagian 1c) — jadi iPad tidak lagi ikut aturan laci. */
function modeLaci(){ return !modeRail(); }
function laciTerbuka(){
  var nav=document.getElementById('topnav');
  return !!(document.body.classList.contains('nav-open') ||
            (nav && nav.classList.contains('open')));
}
function tutupLaci(){
  if(typeof closeMobileNav==='function'){ closeMobileNav(); return; }
  /* Cadangan bila app.js belum siap */
  var nav=document.getElementById('topnav'), bd=document.getElementById('topnav-backdrop');
  if(nav) nav.classList.remove('open');
  if(bd) bd.classList.remove('show');
  document.body.classList.remove('nav-open');
}
function initTutupDiLuar(){
  var sisi=document.getElementById('sidebar-shell');
  /* Ditangkap pada fase CAPTURE supaya tetap jalan walau elemen di bawah
     jari menghentikan penyebaran peristiwa (mis. tabel yang bisa digulir). */
  function periksa(e){
    if(!modeLaci() || !laciTerbuka()) return;
    var t=e.target;
    if(!t || t.nodeType!==1) return;
    if(sisi && (t===sisi || sisi.contains(t))) return;             // di dalam navigasi
    if(t.closest('#nav-burger,.nav-burger')) return;               // tombol ☰
    /* Jendela pop-up (pratinjau, konfirmasi, dsb.) tampil di atas laci —
       ketukan di sana tidak boleh dianggap "di luar navigasi". */
    if(t.closest('.overlay.show,.modal')) return;
    tutupLaci();
  }
  document.addEventListener('pointerdown', periksa, true);
  /* Peramban lama tanpa Pointer Events */
  if(!window.PointerEvent) document.addEventListener('touchstart', periksa, true);
  document.addEventListener('click', periksa, true);
  /* Tombol Esc & perubahan orientasi ikut menutup laci */
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape' && modeLaci() && laciTerbuka()) tutupLaci();
  });
  window.addEventListener('orientationchange', function(){
    setTimeout(function(){ if(laciTerbuka()) tutupLaci(); }, 60);
  });
  /* Kembali ke layar lebar non-sentuh: sisa keadaan laci dibersihkan */
  window.addEventListener('resize', function(){
    if(!modeLaci() && laciTerbuka()) tutupLaci();
  });
}

/* ---------- 1c. MODE RAIL: tablet sentuh mengikuti tampilan desktop ----------
   Desktop memakai rail ikon 76px yang melebar saat disentuh kursor. Tablet
   sentuh (iPad potret 834px, lanskap 1194/1366px) dulu jatuh ke aturan
   "layar sentuh" sehingga sidebarnya berubah jadi laci tersembunyi —
   tampilannya jauh berbeda dari desktop.

   Sekarang keduanya memakai susunan yang sama. Penanda <html class="mode-rail">
   dibaca style.css bagian 23. Ponsel (dan ponsel lanskap yang tingginya
   pendek) tetap memakai laci geser. */
var RAIL_MIN_W = 700;    /* iPad Mini potret = 744px */
var RAIL_MIN_H = 600;    /* ponsel lanskap ±400px -> tetap laci */
function modeRail(){
  if(!noHover()) return !isSmall();                 /* perangkat berkursor: seperti dulu */
  return window.innerWidth  >= RAIL_MIN_W
      && window.innerHeight >= RAIL_MIN_H;          /* tablet sentuh */
}
function terapkanModeRail(){
  var html=document.documentElement;
  var rail=modeRail();
  html.classList.toggle('mode-rail', rail);
  html.classList.toggle('sentuh', noHover());
  if(rail && laciTerbuka()) tutupLaci();            /* sisa keadaan laci dibersihkan */
  if(!rail){
    var el=document.getElementById('sidebar-shell');
    if(el) el.classList.remove('is-open','is-pinned');
  }
}
/* Rail di layar sentuh tidak punya kursor: ketukan pada rail yang menciut
   melebarkannya dulu (bukan langsung berpindah halaman), supaya nama menu
   terbaca. Ketukan berikutnya berjalan normal. */
function initRailSentuh(){
  var el=document.getElementById('sidebar-shell'); if(!el) return;
  el.addEventListener('pointerdown', function(e){
    if(!document.documentElement.classList.contains('mode-rail')) return;
    if(!noHover()) return;                          /* perangkat berkursor: biarkan hover */
    if(el.classList.contains('is-open')) return;    /* sudah lebar -> lanjut seperti biasa */
    e.preventDefault(); e.stopPropagation();
    el.classList.add('is-open');
    if(typeof openActiveBranch==='function') openActiveBranch();
  }, true);
  /* Ketukan di luar sidebar menciutkannya kembali */
  document.addEventListener('pointerdown', function(e){
    if(!document.documentElement.classList.contains('mode-rail')) return;
    if(!noHover()) return;
    if(!el.classList.contains('is-open')) return;
    if(el.classList.contains('is-pinned')) return;
    var t=e.target;
    if(t && t.nodeType===1 && (t===el || el.contains(t))) return;
    el.classList.remove('is-open');
  }, true);
  /* Memilih menu juga menciutkan rail kembali */
  el.addEventListener('click', function(e){
    if(!document.documentElement.classList.contains('mode-rail')) return;
    if(!noHover()) return;
    var t=e.target;
    if(t && t.closest && t.closest('.topnav-link,.topnav-item')){
      setTimeout(function(){
        if(!el.classList.contains('is-pinned')) el.classList.remove('is-open');
      }, 180);
    }
  });
  window.addEventListener('resize', terapkanModeRail);
  window.addEventListener('orientationchange', function(){ setTimeout(terapkanModeRail,120); });
  terapkanModeRail();
}

/* ---------- 1f. GAGANG ANAK PANAH DI TEPI KANAN RAIL ----------
   Rail ikon yang menciut tidak memberi petunjuk apa pun bahwa ia
   masih bisa dibuka penuh — persis seperti laci ikon tersembunyi di
   Android/iOS yang selalu menyisakan gagang kecil di tepinya.

   Gagang ini ditambahkan dari JS (bukan index.html) supaya markup
   sidebar tidak perlu disentuh. Dua perannya:
     - PETUNJUK: anak panah "›" memberi tahu arah membukanya, dan
       MENGHILANG begitu sidebar melebar — petunjuk arah tidak lagi
       diperlukan ketika menunya sudah terbaca penuh.
     - PENGUNCI: diklik -> sidebar dikunci terbuka (.is-pinned) dan
       tidak lagi menciut sendiri saat kursor pergi. Karena gagangnya
       lenyap saat terbuka, kuncinya dilepas lewat Esc, klik di luar
       sidebar, atau setelah memilih salah satu menu.

   LETAK: gagang ini BUKAN anak sidebar, melainkan saudaranya —
   `.sidebar-shell` ber-`overflow:hidden` sehingga anak yang menonjol
   keluar pasti terpotong. Sebagai saudara ber-`position:fixed`, ia
   bebas berdiri di luar tepi rail.
   Gaya tampilannya ada di style.css bagian 33 (menimpa bagian 30). */
var IC_PEEK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
            'stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">'+
            '<polyline points="9 18 15 12 9 6"/></svg>';
function initPeekHandle(){
  var el=document.getElementById('sidebar-shell'); if(!el) return;
  if(document.getElementById('side-peek')) return;

  var b=document.createElement('button');
  b.type='button'; b.id='side-peek'; b.className='side-peek';
  b.innerHTML=IC_PEEK;

  /* ---- DILETAKKAN DI LUAR SIDEBAR ----
     `.sidebar-shell` ber-`overflow:hidden` (style.css bagian 26a,
     demi garis aksen beranimasi), jadi anak yang menonjol keluar
     PASTI terpotong. Karena itu gagangnya disisipkan sebagai
     SAUDARA sidebar — tepat sesudahnya — lalu diletakkan dengan
     `position:fixed` di x = --side-rail oleh style.css bagian 33.
     Urutan "sesudah" itu penting: pemilih `~` di CSS yang menyem-
     bunyikan gagang saat sidebar terbuka hanya bekerja bila gagang
     berada SETELAH sidebar di dalam DOM. */
  if(el.parentNode) el.parentNode.insertBefore(b, el.nextSibling);
  else document.body.appendChild(b);

  /* Zona lorong: sepanjang gagang, memanjang ~72px ke kanan.
     Selama kursor di sini, sidebar tidak membuka sendiri sehingga
     gagangnya sempat diklik (lihat diLorongGagang di bagian 1a). */
  var LORONG_KANAN=72;
  function ukurZona(){
    if(el.classList.contains('is-open') ||
       !document.documentElement.classList.contains('mode-rail')){
      ZONA_GAGANG=null; return;
    }
    var r=b.getBoundingClientRect();
    if(!r || !r.width){ ZONA_GAGANG=null; return; }
    ZONA_GAGANG={ x1:r.left-4, x2:r.right+LORONG_KANAN,
                  y1:r.top-12, y2:r.bottom+12 };
  }

  function sync(){
    var buka=el.classList.contains('is-open');
    /* Gagang HILANG saat terbuka, jadi judulnya cukup satu:
       perannya sekarang murni "buka & kunci". Menutup kembali
       lewat Esc atau klik di luar (dipasang di bawah). */
    var judul='Buka & kunci menu lengkap';
    b.title=judul;
    b.setAttribute('aria-label',judul);
    b.setAttribute('aria-expanded', buka ? 'true' : 'false');
    /* Tersembunyi -> jangan ikut urutan Tab */
    b.tabIndex = buka ? -1 : 0;
    ukurZona();
  }

  b.addEventListener('click', function(e){
    e.preventDefault(); e.stopPropagation();
    el.classList.add('is-pinned','is-open');
    if(typeof openActiveBranch==='function') openActiveBranch();
    sync();
  });
  /* Penjaga "ketukan di luar" pada layar sentuh menangkap pointerdown
     di fase capture; tanpa penghenti ini, ketukan pada gagang bisa
     dianggap ketukan pada rail sehingga klik-nya tidak pernah sampai. */
  b.addEventListener('pointerdown', function(e){ e.stopPropagation(); }, true);

  /* ---- JALAN KELUAR DARI KEADAAN TERKUNCI ----
     Karena gagangnya lenyap begitu sidebar terbuka, tombol yang sama
     tidak bisa dipakai untuk melepas kunci. Dua jalan keluar yang
     sudah lazim dipakai orang: tombol Esc, dan mengetuk/mengklik di
     luar sidebar. */
  function lepasKunci(){
    if(!el.classList.contains('is-pinned')) return false;
    el.classList.remove('is-pinned','is-open');
    el.querySelectorAll('.topnav-group.open').forEach(function(g){ g.classList.remove('open'); });
    el.querySelectorAll('.topnav-sub.open').forEach(function(s){ s.classList.remove('open'); });
    if(typeof openActiveBranch==='function') openActiveBranch();
    sync();
    return true;
  }
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape') lepasKunci();
  });
  document.addEventListener('pointerdown', function(e){
    if(!el.classList.contains('is-pinned')) return;
    var t=e.target;
    if(!t || t.nodeType!==1) return;
    if(t===el || el.contains(t) || t===b || b.contains(t)) return;
    /* Jendela pop-up tampil DI ATAS sidebar — ketukan di sana bukan
       "di luar menu", jadi kuncinya jangan ikut lepas. */
    if(t.closest && t.closest('.overlay.show,.modal')) return;
    lepasKunci();
  }, true);
  /* Memilih salah satu menu juga melepas kunci supaya rail kembali
     ramping sesudah berpindah halaman. */
  el.addEventListener('click', function(e){
    var t=e.target;
    if(t && t.closest && t.closest('.topnav-link')) setTimeout(lepasKunci, 160);
  });

  /* .is-open juga diubah oleh hover/ketukan, bukan hanya oleh tombol ini */
  try{ new MutationObserver(sync).observe(el,{attributes:true,attributeFilter:['class']}); }catch(e){}
  try{ new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['class']}); }catch(e){}
  window.addEventListener('resize', ukurZona, {passive:true});
  window.addEventListener('scroll', ukurZona, {passive:true});
  sync();
}

/* ---------- 1d. ISYARAT GESER MENDATAR PADA TABEL ----------
   Bayangan tipis di tepi kotak tabel yang masih menyimpan kolom tersembunyi.
   Dipasang pada .panel (bukan .table-wrap) karena .table-wrap adalah wadah
   gulir — anak absolut di dalamnya ikut tergeser dan tertutup sel tabel.
   Geometri kotak tabel dikirim ke CSS lewat variabel --tw-top/--tw-h. */
/* Pengukuran BERAT (memaksa hitung ulang tata letak) dipisah dari pembaruan
   RINGAN. Ukuran kotak tabel hanya berubah saat isinya/ukuran jendela berubah,
   jadi cukup diukur sekali lalu disimpan; ketika digulir, yang dibaca hanya
   scrollLeft. Dulu keduanya digabung sehingga setiap peristiwa gulir memicu
   getComputedStyle + scrollWidth — yaitu satu hitung ulang tata letak paksa
   per peristiwa, tepat saat gulir sedang berlangsung. */
function ukurTabel(tw){
  if(!tw) return null;
  var panel=tw.closest ? tw.closest('.panel') : null; if(!panel) return null;
  panel.classList.add('panel-tabel');   /* hanya panel bertabel yang jadi acuan posisi */
  var cs=getComputedStyle(tw);
  var bt=parseFloat(cs.borderTopWidth)||0, bl=parseFloat(cs.borderLeftWidth)||0;
  var geo={ panel:panel, sisa: tw.scrollWidth - tw.clientWidth };
  panel.style.setProperty('--tw-top', (tw.offsetTop + bt) + 'px');
  panel.style.setProperty('--tw-h', tw.clientHeight + 'px');
  panel.style.setProperty('--tw-inset', ((tw.offsetLeft || 0) + bl) + 'px');
  tw.__geo=geo;
  return geo;
}
function perbaruiIsyarat(tw){
  var geo=tw && tw.__geo; if(!geo) geo=ukurTabel(tw);
  if(!geo) return;
  var sl=tw.scrollLeft;                       /* satu-satunya pembacaan saat gulir */
  var kiri  = geo.sisa > 2 && sl > 2;
  var kanan = geo.sisa > 2 && sl < geo.sisa - 2;
  if(geo.kiri!==kiri){ geo.kiri=kiri; geo.panel.classList.toggle('x-kiri', kiri); }
  if(geo.kanan!==kanan){ geo.kanan=kanan; geo.panel.classList.toggle('x-kanan', kanan); }
}
function segarkanIsyaratGeser(tw){ if(ukurTabel(tw)) perbaruiIsyarat(tw); }
function initIsyaratGeser(){
  function pasang(){
    document.querySelectorAll('.table-wrap').forEach(function(tw){
      if(!tw.__isyarat){
        tw.__isyarat=true;
        /* Gulir dibatasi satu pembaruan per frame; isinya pun hanya membaca
           scrollLeft, jadi tidak ada hitung ulang tata letak paksa. */
        var raf=0;
        tw.addEventListener('scroll', function(){
          if(raf) return;
          raf=requestAnimationFrame(function(){ raf=0; perbaruiIsyarat(tw); });
        }, {passive:true});
      }
      segarkanIsyaratGeser(tw);
    });
  }
  pasang();
  window.addEventListener('resize', pasang);
  window.addEventListener('orientationchange', function(){ setTimeout(pasang,180); });
  /* Isi tabel diganti dari banyak tempat di app.js -> pantau perubahan DOM.
     Pemantauan dipersempit: hanya penambahan/penghapusan baris di dalam
     <tbody>. Dulu seluruh <body> dipantau, sehingga perubahan sekecil apa pun
     di halaman ikut memicu pengukuran ulang semua tabel. */
  try{
    var t=null;
    new MutationObserver(function(muts){
      for(var i=0;i<muts.length;i++){
        var p=muts[i].target;
        if(p && (p.tagName==='TBODY' || (p.closest && p.closest('.table-wrap')))){
          clearTimeout(t); t=setTimeout(pasang,120); return;
        }
      }
    }).observe(document.body,{childList:true,subtree:true});
  }catch(e){}
  /* Berpindah halaman: hitung ulang sesudah tampilan baru selesai digambar */
  var orig=window.showView;
  if(typeof orig==='function'){
    window.showView=function(){ var r=orig.apply(this,arguments); setTimeout(pasang,320); return r; };
  }
}

/* ---------- 1e. Logo bilah atas mengikuti logo sidebar ----------
   Base64 logonya besar; daripada ditulis dua kali di index.html, gambarnya
   disalin dari sidebar saat halaman dimuat. */
function isiLogoAppbar(){
  var src=document.querySelector('.sidebar-shell .logo-img');
  var dst=document.getElementById('appbar-logo-img');
  if(src && dst && src.getAttribute('src')) dst.src=src.getAttribute('src');
}

/* ---------- 2. Tooltip nama menu (dipakai CSS lewat data-tip) ---------- */
function labelOf(btn){
  if(!btn) return '';
  var sp=btn.querySelector('.sub-label');
  if(sp) return sp.textContent.trim();
  var t='';
  for(var i=0;i<btn.childNodes.length;i++){
    var n=btn.childNodes[i];
    if(n.nodeType===3) t+=n.textContent;
  }
  return t.replace(/\s+/g,' ').trim();
}
/* Judul menu tetap dipasang sebagai title -> berguna saat rail masih menciut
   dan pengguna berhenti sejenak di atas sebuah ikon. */
function setTips(){
  document.querySelectorAll('#topnav .topnav-link, #topnav .topnav-trigger').forEach(function(b){
    var t=labelOf(b); if(t && !b.title) b.title=t;
  });
}

/* ---------- 3. Jejak halaman di bilah atas ---------- */
/* Nama halaman yang ditampilkan di bilah atas bila judul di dalam halaman
   kurang cocok dijadikan jejak (mis. tiga daftar dokumen yang dibedakan lewat
   tab SPBJ / Pengadaan Langsung / Tender, bukan lewat menu). */
var VIEW_TITLE={
  'view-list'       :'Dokumen Kontrak Rinci',
  'view-list-pl'    :'Dokumen Pengadaan Langsung',
  'view-list-tender':'Dokumen Tender'
};
/* Judul halaman tanpa angka lencana jumlah data ("Daftar Kontrak Rinci 2"
   -> "Daftar Kontrak Rinci"). */
function headingText(h){
  if(!h) return '';
  var c=h.cloneNode(true);
  c.querySelectorAll('.count-badge').forEach(function(b){ b.remove(); });
  return c.textContent.replace(/\s+/g,' ').trim();
}

function updateCrumb(){
  var now=document.getElementById('crumb-now'), path=document.getElementById('crumb-path');
  if(!now) return;
  var act=document.querySelector('#topnav .topnav-item.active') ||
          document.querySelector('#topnav .topnav-link.active');
  var label='', trail=[];
  if(act){
    label=labelOf(act);
    var node=act.parentElement;
    while(node && node.id!=='topnav'){
      if(node.classList){
        if(node.classList.contains('topnav-sub')){
          var st=node.querySelector(':scope > .topnav-subtrigger');
          if(st) trail.unshift(labelOf(st));
        }
        if(node.classList.contains('topnav-group')){
          var gt=node.querySelector(':scope > .topnav-trigger');
          if(gt) trail.unshift(labelOf(gt));
        }
      }
      node=node.parentElement;
    }
  }
  /* Nama khusus per halaman menang atas nama menu */
  var vw=document.querySelector('.view.active');
  if(vw && VIEW_TITLE[vw.id]) label=VIEW_TITLE[vw.id];
  if(!label) label=headingText(document.querySelector('.view.active h2'))||'Dashboard';
  now.textContent=label||'Dashboard';
  if(path) path.textContent=trail.join(' › ');
  document.title=(label?label+' · ':'')+'Monitoring Pengadaan Masohi';
}
/* Menu aktif diubah dari banyak tempat di app.js (showView, *MarkActive, dst.).
   Daripada menambal semuanya, cukup pantau perubahan kelas di dalam #topnav. */
function watchActive(){
  var nav=document.getElementById('topnav'); if(!nav) return;
  var t=null;
  new MutationObserver(function(){
    clearTimeout(t); t=setTimeout(updateCrumb,60);
  }).observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
}

/* ---------- 3b. Label bagian ikut tersembunyi bila isinya kosong ----------
   applyRole() menyembunyikan menu khusus admin. Bila seluruh isi satu bagian
   tersembunyi (mis. akun Tamu), labelnya ikut disembunyikan agar tak menggantung. */
function syncSections(){
  var nav=document.getElementById('topnav'); if(!nav) return;
  var kids=Array.prototype.slice.call(nav.children);
  kids.forEach(function(el,i){
    if(!el.classList || !el.classList.contains('side-sec')) return;
    var visible=false;
    for(var k=i+1;k<kids.length;k++){
      var n=kids[k];
      if(n.classList && n.classList.contains('side-sec')) break;
      if(getComputedStyle(n).display!=='none'){ visible=true; break; }
    }
    el.style.display = visible ? '' : 'none';
  });
}
/* applyRole() menyembunyikan grup menu SEBELUM menyetel tombol Ganti Kata Sandi
   & Bersihkan Daftar Kontrak, jadi grup "Pengaturan" bisa tertinggal tampil
   walau seluruh isinya sudah disembunyikan. Dihitung ulang di sini, sesudahnya. */
function syncGroups(){
  document.querySelectorAll('#topnav .topnav-group').forEach(function(g){
    var items=g.querySelectorAll('.topnav-item');
    if(!items.length) return;
    var any=Array.prototype.some.call(items,function(it){
      return getComputedStyle(it).display!=='none';
    });
    g.style.display = any ? '' : 'none';
  });
}
function hookRole(){
  var orig=window.applyRole;
  if(typeof orig!=='function') return;
  window.applyRole=function(){
    var r=orig.apply(this,arguments);
    try{ syncGroups(); syncSections(); }catch(e){}
    return r;
  };
}

/* ---------- 3c. Grup menu ikut terbuka mengikuti halaman aktif ----------
   Hanya dijalankan saat BERPINDAH halaman (showView), bukan pada setiap
   perubahan kelas — supaya grup yang sengaja ditutup pengguna tetap tertutup. */
function openActiveBranch(){
  var act=document.querySelector('#topnav .topnav-item.active');
  if(!act) return;
  var node=act.parentElement;
  while(node && node.id!=='topnav'){
    if(node.classList && (node.classList.contains('topnav-group')||node.classList.contains('topnav-sub'))){
      node.classList.add('open');
    }
    node=node.parentElement;
  }
}
function hookShowView(){
  var orig=window.showView;
  if(typeof orig!=='function') return;
  window.showView=function(){
    var r=orig.apply(this,arguments);
    setTimeout(openActiveBranch,260);
    return r;
  };
}

/* ---------- 4. Layar penuh pada modal pratinjau file ---------- */
var IC_ENTER='<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7.5 7.5"/><path d="M3 21l7.5-7.5"/>';
var IC_EXIT ='<path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/>';

function fsEl(){ return document.fullscreenElement || document.webkitFullscreenElement || null; }
function fsSupported(){
  var e=document.documentElement;
  return !!(e.requestFullscreen || e.webkitRequestFullscreen);
}
/* Perangkat sentuh memakai layar penuh SEMU (kelas CSS), bukan Fullscreen API.
   Di Safari iPad, gulir sedikit saja sudah melepas Fullscreen API sehingga
   pratinjau tiba-tiba mengecil; versi semu tidak bisa terlepas sendiri. */
function pakaiFsSemu(){
  return window.matchMedia('(hover:none)').matches ||
         window.matchMedia('(max-width:1024px)').matches ||
         !fsSupported();
}
function fsSemuAktif(){
  var m=document.querySelector('#pn-preview-overlay .pn-preview-modal');
  return !!(m && m.classList.contains('pn-fs-semu'));
}
window.pnPreviewToggleFullscreen=function(){
  var m=document.querySelector('#pn-preview-overlay .pn-preview-modal'); if(!m) return;
  if(pakaiFsSemu()){
    m.classList.toggle('pn-fs-semu');
    syncFsBtn();
    setTimeout(fitDokumen,60);
    return;
  }
  if(fsEl()){
    var ex=document.exitFullscreen||document.webkitExitFullscreen;
    if(ex) ex.call(document);
    return;
  }
  var req=m.requestFullscreen||m.webkitRequestFullscreen;
  if(!req){ if(typeof toast==='function') toast('Peramban ini tidak mendukung layar penuh','warn'); return; }
  var p=req.call(m);
  if(p && p.catch) p.catch(function(){
    /* Ditolak peramban -> jatuh ke layar penuh semu, bukan gagal diam-diam */
    m.classList.add('pn-fs-semu'); syncFsBtn();
  });
};
function syncFsBtn(){
  var on=!!fsEl() || fsSemuAktif();
  var btn=document.getElementById('pn-preview-fs');
  var lbl=document.getElementById('pn-preview-fs-label');
  var ic=document.getElementById('pn-preview-fs-icon');
  if(btn){ btn.classList.toggle('is-on',on); btn.title=(on?'Keluar dari layar penuh':'Layar Penuh')+' (F)'; }
  if(lbl) lbl.textContent = on ? 'Keluar Layar Penuh' : 'Layar Penuh';
  if(ic) ic.innerHTML = on ? IC_EXIT : IC_ENTER;
}
function initFs(){
  if(!fsSupported()){
    var b=document.getElementById('pn-preview-fs'); if(b) b.style.display='none';
    return;
  }
  document.addEventListener('fullscreenchange',syncFsBtn);
  document.addEventListener('webkitfullscreenchange',syncFsBtn);

  /* Pintasan: tekan F saat pratinjau terbuka */
  document.addEventListener('keydown',function(e){
    if(e.key!=='f' && e.key!=='F') return;
    if(e.ctrlKey||e.metaKey||e.altKey) return;
    var ov=document.getElementById('pn-preview-overlay');
    if(!ov || !ov.classList.contains('show')) return;
    var t=e.target, tag=t&&t.tagName;
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||(t&&t.isContentEditable)) return;
    e.preventDefault();
    window.pnPreviewToggleFullscreen();
  });

  /* Menutup pratinjau harus ikut keluar dari layar penuh */
  var orig=window.closePnPreview;
  if(typeof orig==='function'){
    window.closePnPreview=function(){
      if(fsEl()){ var ex=document.exitFullscreen||document.webkitExitFullscreen; if(ex) try{ ex.call(document); }catch(e){} }
      return orig.apply(this,arguments);
    };
  }
  syncFsBtn();
}

/* ---------- 5. Alamat (#hash) ikut bersih saat keluar ----------
   Modul riwayat di app-lain.js menulis "#list", "#hps-view", dst. ke alamat
   supaya tombol Back peramban berfungsi. Tetapi saat pengguna keluar, alamat
   itu tidak pernah dibersihkan — halaman login jadi tampil dengan alamat
   ".../#list", seolah masih di halaman daftar. Dibersihkan di sini. */
function clearViewHash(){
  try{
    if(location.hash) history.replaceState({}, '', location.pathname+location.search);
  }catch(e){}
}
function hookLogout(){
  var orig=window.logout;
  if(typeof orig!=='function') return;
  window.logout=function(){
    var r=orig.apply(this,arguments);
    clearViewHash();
    return r;
  };
}
/* Layar login dipantau: setiap kali ia muncul — saat memuat halaman tanpa sesi,
   sesi kedaluwarsa, atau keluar otomatis karena menganggur — alamatnya ikut
   dibersihkan. Memakai pemantau karena app.js baru memutuskan tampil/tidaknya
   layar login beberapa saat sesudah halaman dimuat. */
function watchLoginScreen(){
  var ls=document.getElementById('login-screen'); if(!ls) return;
  var cek=function(){ if(getComputedStyle(ls).display!=='none') clearViewHash(); };
  try{ new MutationObserver(cek).observe(ls,{attributes:true,attributeFilter:['style','class']}); }catch(e){}
  setTimeout(cek,300); setTimeout(cek,1200);
}

/* --- Dokumen pratinjau dipaskan ke lebar layar ---
   Dokumen dibangun dalam ukuran kertas A4 (210mm ≈ 794px). Di iPad potret,
   apalagi ponsel, itu lebih lebar dari layar sehingga dokumen tampak
   menempel ke kiri dan terpotong. Isi iframe diperkecil secukupnya (zoom)
   supaya muat dan otomatis berada di tengah. Jalur Cetak/PDF memakai iframe
   tersendiri, jadi tidak ikut terpengaruh. */
var ZOOM_DIDUKUNG = (function(){
  try{ return 'zoom' in document.documentElement.style; }catch(e){ return false; }
})();
function fitDokumen(){
  if(!window.matchMedia('(max-width:1024px)').matches &&
     !window.matchMedia('(hover:none)').matches) return;
  var body=document.getElementById('pn-preview-body'); if(!body) return;
  var fr=body.querySelector('iframe'); if(!fr) return;
  try{
    var d=fr.contentDocument; if(!d || !d.body) return;
    /* Dikembalikan dulu ke ukuran asli supaya pengukuran tidak menumpuk
       hasil penyusutan sebelumnya (mis. sesudah layar diputar). */
    d.body.style.zoom='';
    d.body.style.transform='';
    d.body.style.transformOrigin='';
    d.body.style.width='';
    var isi=Math.max(d.body.scrollWidth, d.documentElement.scrollWidth||0);
    var muat=fr.clientWidth - 10;      // sisakan sedikit napas supaya benar-benar muat
    if(!(muat>0) || !(isi>muat)) return;
    var skala=Math.max(0.34, muat/isi);
    if(ZOOM_DIDUKUNG){
      d.body.style.zoom=skala;
    }else{
      /* Firefox Android tidak mengenal `zoom`. transform:scale() memberi hasil
         yang sama, asalkan lebar badan dikoreksi agar tidak menyisakan ruang
         kosong di kanan dan halaman tetap rata kiri-atas. */
      d.body.style.transformOrigin='top left';
      d.body.style.transform='scale('+skala+')';
      d.body.style.width=(100/skala)+'%';
    }
  }catch(e){ /* iframe beda-asal: dilewati */ }
}
/* Dokumen baru selesai dimuat -> pas-kan ulang. Tanpa ini, pratinjau pertama
   sering tampil dalam ukuran A4 penuh (terpotong) sampai layar diputar. */
function pantauMuatIframe(){
  var body=document.getElementById('pn-preview-body'); if(!body) return;
  var pasang=function(){
    body.querySelectorAll('iframe').forEach(function(fr){
      if(fr.__fitTerpasang) return;
      fr.__fitTerpasang=true;
      fr.addEventListener('load', function(){ setTimeout(fitDokumen,80); setTimeout(fitDokumen,420); });
    });
  };
  pasang();
  try{ new MutationObserver(pasang).observe(body,{childList:true,subtree:true}); }catch(e){}
}

/* Halaman di belakang dikunci saat pratinjau terbuka, supaya tidak ikut
   tergeser saat jari menggulir dokumen. */
function watchPreviewOverlay(){
  var ov=document.getElementById('pn-preview-overlay'); if(!ov) return;
  var terapkan=function(){
    var buka=ov.classList.contains('show');
    document.body.classList.toggle('pratinjau-terbuka', buka);
    if(buka){ setTimeout(fitDokumen,120); setTimeout(fitDokumen,600); setTimeout(fitDokumen,1400); }
    else{
      var m=ov.querySelector('.pn-preview-modal');
      if(m) m.classList.remove('pn-fs-semu');
    }
  };
  try{ new MutationObserver(terapkan).observe(ov,{attributes:true,attributeFilter:['class']}); }catch(e){}
  var b=document.getElementById('pn-preview-body');
  if(b){ try{ new MutationObserver(function(){ setTimeout(fitDokumen,150); })
      .observe(b,{childList:true}); }catch(e){} }
  window.addEventListener('resize',function(){ setTimeout(fitDokumen,200); });
  window.addEventListener('orientationchange',function(){ setTimeout(fitDokumen,400); });
  terapkan();
}

/* ---------- start ---------- */
function init(){
  setTips();
  isiLogoAppbar();
  initHoverSidebar();
  initTutupDiLuar();
  initRailSentuh();
  initPeekHandle();
  initIsyaratGeser();
  watchActive();
  hookRole();
  hookShowView();
  syncGroups();
  openActiveBranch();
  syncSections();
  updateCrumb();
  initFs();
  hookLogout();
  watchPreviewOverlay();
  pantauMuatIframe();
  watchLoginScreen();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();

})();
