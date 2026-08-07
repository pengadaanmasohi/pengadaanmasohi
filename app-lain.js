/* ============================================================================
   FILE: app-lain.js  —  Pusat Kontrol Akun, Unduh/Unggah Profil, Tracking.
   Dipisah dari app.js. WAJIB dimuat SETELAH susun-kontrak.js.
   ============================================================================ */
/* ============================================================================
   ==================  PUSAT KONTROL AKUN  (fitur tambahan)  ==================
   ----------------------------------------------------------------------------
   Menu "Kelola Akun" (khusus Admin bawaan/terverifikasi server).
   Sejak penyederhanaan ini, matriks "Kontrol Akses" DIHAPUS: hak akses akun
   user tidak lagi dicentang satu per satu, melainkan sudah BAKU di USER_RULES
   (lihat app.js) dan hanya dibatasi oleh BIDANG yang dipilih saat akun dibuat:

     - Monitoring (SPBJ / Pengadaan Langsung / Tender)
         ubah & hapus  : hanya data pada bidang akun tersebut
         bidang lain   : dapat dilihat saja
     - Dokumen > Perjanjian/Kontrak
         SPBJ              : unggah & hapus hanya pada bidangnya
         Pengadaan Langsung: lihat saja
         Tender            : lihat saja
     - Menu sistem (Kelola Akun, Penyimpanan, Bersihkan Daftar Kontrak,
       Ganti Kata Sandi, Penyesuaian Form) tetap KHUSUS Admin.

   Yang tersisa di panel ini: Buat Akun, Daftar Akun, dan Reset Sandi.

   Catatan kejujuran:
     1) Akun di sini diverifikasi di SISI KLIEN (cocok untuk alat internal).
        Pembatasan di atas bersifat tampilan; penegakan sesungguhnya harus
        dilakukan lewat RLS Supabase.
     2) Dokumen di Supabase Storage dijaga policy RLS pada storage.objects,
        yang membaca peran dari JWT Supabase Auth (lihat 03_storage_auth.sql).
        Agar akun kustom bisa membuka/mengunggah dokumen, akun yang sama HARUS
        punya baris di auth.users + akun_peran — dibuatkan lewat
        buat_akun_auth() di 04_akun_auth.sql. Bila belum, aplikasi tetap bisa
        dipakai tetapi setiap permintaan berkas akan ditolak 403 oleh policy,
        bukan lagi oleh Worker.
   Seluruh kode dibungkus defensif (try/catch) agar tidak mengganggu alur lama.
   ============================================================================ */
(function(){
  if(window.__AC_INSTALLED__) return; window.__AC_INSTALLED__ = true;

  var AC_LOCAL_KEY  = 'ac_config_v1';
  var AC_ACCT_KEY   = 'mon_ac_acct';
  var AC_PRES_KIND  = '__presence__';
  var AC_SEMUA      = '*';                     // penanda "semua bidang"
  /* Jenis akun yang bisa dibuat dari panel ini.
     'admin' = ADMIN CABANG: hak datanya sama persis dengan Admin Pusat
     (peran 'admin' di app.js), hanya menu Kelola Akun yang ditutup — lihat
     acUnrestricted(). Admin Pusat sendiri TIDAK tersimpan di sini; ia akun
     bawaan di Supabase Auth dan tidak pernah muncul di daftar. */
  var AC_TIPE_USER  = 'user';
  var AC_TIPE_ADMIN = 'admin';
  function acTipe(a){ return (a && String(a.type)===AC_TIPE_ADMIN) ? AC_TIPE_ADMIN : AC_TIPE_USER; }
  function acTipeLabel(t){ return t===AC_TIPE_ADMIN ? 'Admin Cabang' : 'User'; }
  var RESERVED      = ['admin','user','dummy','tamu','guest',''];
  var acConfig      = null;
  var acActiveProfile = null;                  // akun kustom yang sedang login (atau null)

  function acBidangKey(){ try{ return (typeof BIDANG_KEY!=='undefined') ? BIDANG_KEY : 'mon_bidang'; }catch(e){ return 'mon_bidang'; } }
  function acBidangOpts(){
    try{ if(typeof BIDANG_OPTS!=='undefined' && Array.isArray(BIDANG_OPTS)) return BIDANG_OPTS.slice(); }catch(e){}
    return [];
  }
  function acBidangLabel(b){ return (!b || b===AC_SEMUA) ? 'Semua Bidang' : String(b); }

  /* ---- Normalisasi akun: sejak peran dummy/admin lokal dihapus, SEMUA akun
     yang dibuat di sini bertipe 'user'. Data lama (bercaps / bertipe dummy)
     ikut dirapikan di sini supaya konfigurasi lama tetap terbaca. ---- */
  function acNormAcct(a){
    if(!a || !a.username) return null;
    var b = a.bidang;
    if(!b || b===AC_SEMUA || String(b).trim()==='' || String(b).toLowerCase()==='semua') b = AC_SEMUA;
    return { username:String(a.username), password:String(a.password||''), type:'user', bidang:b };
  }
  function acDefaultConfig(){ return { accounts:[] }; }
  function acMerge(p){
    var src = (p && Array.isArray(p.accounts)) ? p.accounts : [];
    var out = [];
    src.forEach(function(a){ var n=acNormAcct(a); if(n) out.push(n); });
    return { accounts: out };
  }
  function acLoadLocal(){ try{ var s=localStorage.getItem(AC_LOCAL_KEY); return s?JSON.parse(s):null; }catch(e){ return null; } }
  function acSaveLocal(){ try{ localStorage.setItem(AC_LOCAL_KEY, JSON.stringify(acConfig)); }catch(e){} }
  function acGetConfig(){ if(!acConfig){ var l=acLoadLocal(); acConfig = l?acMerge(l):acDefaultConfig(); } return acConfig; }
  function acFindAcct(username){
    var cfg=acGetConfig();
    return (cfg.accounts||[]).find(function(x){ return String(x.username).toLowerCase()===String(username).toLowerCase(); }) || null;
  }

  function _realDb(){ try{ return (typeof realDb!=='undefined'&&realDb)?realDb:(typeof db!=='undefined'?db:null); }catch(e){ return null; } }
  function _useSupa(){ try{ return (typeof USE_SUPABASE!=='undefined') && USE_SUPABASE && _realDb(); }catch(e){ return false; } }
  function _tbl(){ try{ return (typeof PROFILE_TABLE!=='undefined')?PROFILE_TABLE:'app_profiles'; }catch(e){ return 'app_profiles'; } }

  async function acLoadConfig(){
    var l=acLoadLocal(); acConfig = l?acMerge(l):acDefaultConfig();
    if(_useSupa()){
      try{
        var res=await _realDb().from(_tbl()).select('payload').eq('kind','__akses__').eq('name','config').limit(1);
        if(res && !res.error && res.data && res.data.length){
          var p=res.data[0].payload; if(typeof p==='string'){ try{ p=JSON.parse(p);}catch(e){} }
          if(p){ acConfig=acMerge(p); acSaveLocal(); }
        }
      }catch(e){ console.error('acLoadConfig:',e); }
    }
    return acConfig;
  }
  async function acSaveConfig(){
    acSaveLocal();
    if(_useSupa()){
      try{
        var res=await _realDb().from(_tbl()).upsert({kind:'__akses__',name:'config',payload:acConfig,updated_at:new Date().toISOString()},{onConflict:'kind,name'});
        if(res && res.error) throw res.error;
        return true;
      }catch(e){ console.error('acSaveConfig:',e); try{ toast('Tersimpan lokal; sinkron server gagal: '+errMsg(e),'warn'); }catch(_){}; return false; }
    }
    return true;
  }

  /* ---- Hanya Admin bawaan (bukan akun kustom) yang boleh mengelola akun ---- */
  function acUnrestricted(){ try{ return currentRole==='admin' && !acActiveProfile; }catch(e){ return false; } }

  /* ---- Terapkan ke UI (dipanggil setelah applyRole) ----
     Pembatasan menu untuk akun user sepenuhnya ditangani app.js; di sini cukup
     menyembunyikan dua tombol sistem yang memang khusus Admin. ---- */
  function acApplyRole(role){
    var pusat  = acUnrestricted();                 // Admin Pusat saja (bukan akun kustom)
    var adminApaPun = (role==='admin');            // Admin Pusat ATAU Admin Cabang

    /* Kelola Akun: HANYA Admin Pusat. Inilah satu-satunya pembeda antara
       kedua jenis admin — tanpa batasan ini Admin Cabang bisa membuat Admin
       Cabang lain, dan kendali atas siapa yang punya akses penuh menyebar. */
    var b=document.getElementById('btn-akun-kontrol'); if(b) b.style.display = pusat ? '' : 'none';

    /* Penyimpanan: kedua jenis admin. Isinya angka agregat, tidak membocorkan
       data siapa pun, dan Admin Cabang memang perlu tahu sisa kuota. */
    var bs=document.getElementById('btn-storage');     if(bs) bs.style.display = adminApaPun ? '' : 'none';

    /* Ganti Kata Sandi TERBUKA untuk semua peran yang punya akun — termasuk
       akun kustom. Ia sempat ditutup di sini karena submitChangePass() hanya
       menulis ke Supabase Auth, sedangkan kata sandi akun kustom tinggal di
       app_profiles; keduanya akan berselisih. Sejak submitChangePass()
       menangani kedua tempat itu, penutupannya tidak lagi diperlukan —
       justru berbahaya, karena kata sandi hasil Reset bernilai tetap dan
       pemiliknya harus punya cara menggantinya sendiri.

       Pengaturan visibilitasnya diserahkan sepenuhnya ke applyRole() di
       app.js supaya keputusannya hanya ada di satu tempat. */
  }
  function acApply(){ try{ if(typeof currentRole!=='undefined' && currentRole) applyRole(currentRole); }catch(e){} }

  /* ============================ PRESENCE (sesi aktif) ============================ */
  function acWho(){
    try{ if(typeof currentUsername!=='undefined' && currentUsername) return String(currentUsername); }catch(e){}
    try{ var u=ssGet(USER_KEY); if(u) return String(u); }catch(e){}
    try{ if(typeof currentRole!=='undefined' && currentRole) return String(currentRole); }catch(e){}
    return '—';
  }
  async function acBeat(){
    if(!_useSupa()) return;
    try{
      var role=(typeof currentRole!=='undefined')?currentRole:''; if(!role) return;
      var name=String(acWho());
      var bid=''; try{ bid=(typeof currentBidang!=='undefined')?String(currentBidang||''):''; }catch(e){}
      await _realDb().from(_tbl()).upsert(
        {kind:AC_PRES_KIND, name:name, payload:{role:role, username:name, bidang:bid, ts:Date.now()}, updated_at:new Date().toISOString()},
        {onConflict:'kind,name'});
    }catch(e){}
  }
  function acStartBeat(){
    try{ acBeat(); if(!window.__acBeatIv){ window.__acBeatIv=setInterval(function(){ try{acBeat();}catch(e){} }, 60000); } }catch(e){}
  }
  async function acEndBeat(){
    try{ if(window.__acBeatIv){ clearInterval(window.__acBeatIv); window.__acBeatIv=null; } }catch(e){}
    /* BARIS PRESENCE TIDAK DIHAPUS SAAT KELUAR.

       Dulu ia dihapus supaya daftar "Sedang Aktif" tidak menampilkan sesi
       basi — padahal penyaring 5 menit di acLoadPresence sudah mengurus itu,
       jadi penghapusannya tidak pernah benar-benar diperlukan. Yang hilang
       justru mahal: begitu barisnya lenyap, TIDAK ADA LAGI catatan kapan
       orang itu terakhir masuk, dan kolom Status Online mustahil dihitung.
       Sekarang barisnya dibiarkan sebagai jejak "terakhir terlihat". */
    try{ await acBeat(); }catch(e){}   // stempel terakhir sebelum sesi ditutup
  }
  async function acLoadPresence(){
    if(!_useSupa()) return [];
    try{
      var res=await _realDb().from(_tbl()).select('name,payload,updated_at').eq('kind',AC_PRES_KIND);
      if(res && !res.error && res.data){
        return res.data.map(function(r){
            var p=r.payload; if(typeof p==='string'){ try{p=JSON.parse(p);}catch(e){p={};} }
            return { name:r.name, role:(p&&p.role)||'', bidang:(p&&p.bidang)||'', ts:(p&&p.ts)|| (Date.parse(r.updated_at)||0) };
          })
          .sort(function(a,b){ return b.ts-a.ts; });
      }
    }catch(e){}
    return [];
  }

  /* ============================ MONKEY-PATCH ============================ */
  if(typeof applyRole==='function'){
    var _origApplyRole=applyRole;
    applyRole=function(role){ _origApplyRole(role); try{ acApplyRole(role); }catch(e){ console.error('acApplyRole:',e); } };
  }
  if(typeof enterApp==='function'){
    var _origEnterApp=enterApp;
    enterApp=function(role,view){
      try{
        var acct=ssGet(AC_ACCT_KEY);
        acActiveProfile = acct ? acFindAcct(acct) : null;
      }catch(e){ acActiveProfile=null; }
      try{ acStartBeat(); }catch(e){}
      return _origEnterApp(role,view);
    };
  }
  if(typeof doLogin==='function'){
    var _origDoLogin=doLogin;
    doLogin=async function(){
      try{
        var uEl=document.getElementById('login-user'), pEl=document.getElementById('login-pass');
        var u=((uEl&&uEl.value)||'').trim(), p=(pEl&&pEl.value)||'';
        if(u && p){
          var cfg=acGetConfig();
          var acct=(cfg.accounts||[]).find(function(x){ return String(x.username).toLowerCase()===u.toLowerCase() && String(x.password)===p; });
          if(acct){
            try{ showLoginError(''); }catch(e){}
            acActiveProfile = acct;
            /* Peran diambil dari jenis akun. Admin Cabang masuk sebagai peran
               'admin' — hak datanya memang sama persis dengan Admin Pusat;
               yang membedakan hanya menu Kelola Akun, yang ditutup lewat
               acUnrestricted() karena acActiveProfile terisi. */
            var peran = acTipe(acct);
            var bid   = (peran===AC_TIPE_ADMIN) ? AC_SEMUA : (acct.bidang||AC_SEMUA);
            currentUsername = acct.username;
            ssSet(ROLE_KEY,peran); ssSet(USER_KEY, acct.username); ssSet(AC_ACCT_KEY, acct.username);
            ssSet(acBidangKey(), bid);
            ssSet(LOGIN_TIME_KEY,String(Date.now())); ssSet(LAST_ACTIVE_KEY,String(Date.now()));
            /* Sesi Supabase Auth untuk akun kustom. Hanya berhasil bila akun yang
               sama sudah dipindahkan lewat buat_akun_auth() (04_akun_auth.sql).
               Kegagalan TIDAK membatalkan login — menu selain Dokumen tetap
               terbuka, persis seperti perilaku token gateway dulu. */
            try{
              var au=await db.auth.signInWithPassword({
                email: String(acct.username).toLowerCase()+AUTH_EMAIL_SUFFIX,
                password: p
              });
              if(au && au.data && au.data.session){ sbSession=au.data.session; }
              else {
                /* Gagal masuk TIDAK meninggalkan sesi sebelumnya menempel.
                   signInWithPassword yang gagal tidak menghapus sesi yang
                   sudah ada, jadi tanpa baris ini akun kustom bisa mewarisi
                   hak sesi admin yang belum sempat kedaluwarsa di tab ini. */
                try{ await db.auth.signOut(); }catch(e2){}
                sbSession=null;
                setTimeout(function(){ try{ toast('Akun ini belum dipindahkan ke Supabase Auth — menu Dokumen tidak dapat dibuka','warn'); }catch(e){} }, 1200);
              }
            }catch(e){
              console.warn('Sesi Supabase gagal dibentuk:', e);
              try{ await db.auth.signOut(); }catch(e2){}
              sbSession=null;
            }
            playLoginAnim(peran, function(){ enterApp(peran); });
            return;
          }
        }
      }catch(e){ console.error('ac doLogin:',e); }
      try{ ssDel(AC_ACCT_KEY); }catch(e){} acActiveProfile=null;
      return _origDoLogin();
    };
  }
  if(typeof logout==='function'){
    var _origLogout=logout;
    logout=function(){ try{ acEndBeat(); }catch(e){} try{ ssDel(AC_ACCT_KEY); }catch(e){} acActiveProfile=null; return _origLogout(); };
  }

  /* ============================ UI PANEL AKUN & KONTROL ============================ */
  function acEnsurePanel(){
    if(document.getElementById('ac-ov')) return;
    var ov=document.createElement('div');
    ov.id='ac-ov'; ov.className='ac-ov'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true');
    ov.innerHTML =
      '<div class="ac-panel">'
      + '<div class="ac-head">'
      +   '<div class="ac-head-t"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
      +     '<div><h3>Kelola Akun</h3><p>Kelola akun pengguna beserta bidangnya.</p></div></div>'
      /* Bilah tab diganti dua tombol di sini. Halaman pertama panel sekarang
         Daftar Akun — yang paling sering dibuka — dan kedua halaman lain
         diperlakukan sebagai tindakan, bukan tab sejajar. */
      /* Hanya SATU tombol di sini. Reset kata sandi dulu jadi halaman
         tersendiri, padahal ia tindakan atas SATU akun — tempatnya yang wajar
         di baris akun itu sendiri, bukan di halaman terpisah yang mengulang
         seluruh daftar hanya untuk menaruh sebuah kotak isian. */
      +   '<button class="ac-x" type="button" onclick="acClosePanel()" aria-label="Tutup">&times;</button>'
      + '</div>'
      + '<div class="ac-body">'
      +   '<div class="ac-pane" id="ac-pane-create"></div>'
      +   '<div class="ac-pane" id="ac-pane-list" style="display:none"></div>'
      + '</div>'
      + '</div>';
    document.body.appendChild(ov);
    /* KLIK DI LUAR TIDAK MENUTUP, MELAINKAN MENGGETARKAN (7 Agu 2026).
       Dulu penutupnya dipasang pada MOUSEDOWN. Itu sumber gejala "setelah klik
       ganda di luar, panelnya seperti muncul lagi": tekanan pertama menutup
       panel, lalu tekanan kedua dari klik-ganda yang sama jatuh ke elemen yang
       kini terbuka di bawahnya — item menu "Kelola Akun" — dan membukanya
       kembali, lengkap dengan animasi acFade yang berulang.
       Mekanismenya dipinjam utuh dari pratinjau TOR/KAK lewat
       pasangTolakTutup(): latar tidak lagi menutup apa pun, sehingga tidak ada
       lagi tekanan kedua yang bisa jatuh ke menu di belakangnya. */
    try{ if(typeof pasangTolakTutup==='function') pasangTolakTutup('ac-ov'); }catch(e){}
  }

  window.openAkunKontrol=async function(){
    if(!acUnrestricted()){ try{ toast('Hanya Admin yang dapat mengatur akun','warn'); }catch(e){} return; }
    acEnsurePanel();
    var ov=document.getElementById('ac-ov'); ov.classList.add('show');
    try{ await acLoadConfig(); }catch(e){}
    acTab('list');            // halaman pertama = Daftar Akun
  };
  window.acClosePanel=function(){ var ov=document.getElementById('ac-ov'); if(ov) ov.classList.remove('show'); };
  window.acTab=function(t){
    ['create','list'].forEach(function(k){
      var pane=document.getElementById('ac-pane-'+k); if(pane) pane.style.display=(k===t?'':'none');
    });
    /* Tombol header ikut menyala saat halamannya sedang terbuka. Daftar Akun
       tidak punya tombol sendiri — ia keadaan diam panel ini, jadi saat aktif
       kedua tombol sama-sama padam. */
    document.querySelectorAll('.ac-head-act .ac-hbtn').forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-tab')===t);
    });
    if(t==='create') acRenderCreate();
    if(t==='list')   acRenderList();
  };
  /* Tombol kembali ke Daftar Akun — dipasang di kepala halaman Buat Akun &
     Reset Sandi. Wajib ada: sejak bilah tab dihapus, tanpa ini kedua halaman
     itu tidak punya jalan pulang selain menutup seluruh panel. */
  function acBackHtml(){
    return '<button class="ac-back" type="button" onclick="acTab(\'list\')">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>'
      + 'Daftar Akun</button>';
  }

  /* acHakHtml() DIHAPUS 7 Agu 2026 bersama pemilih Jenis Akun: ringkasan hak
     itu hanya tampil di dalam form pembuatan akun, dan separuh isinya
     menerangkan Admin Cabang yang kini tidak dapat dibuat lagi. */

  function acRenderCreate(edit){
    var e=edit||null;
    var tipe=AC_TIPE_USER;                 /* pemilih jenis akun sudah dihapus */
    var curBid=((e&&e.bidang)||AC_SEMUA);
    var opts='<option value="'+AC_SEMUA+'"'+(curBid===AC_SEMUA?' selected':'')+'>Semua Bidang</option>';
    acBidangOpts().forEach(function(b){
      opts+='<option value="'+escapeHtml(b)+'"'+(String(curBid)===String(b)?' selected':'')+'>'+escapeHtml(b)+'</option>';
    });
    var h=acBackHtml();
    h+='<div class="ac-note">Akun disimpan di aplikasi <b>dan</b> didaftarkan ke Supabase Auth secara otomatis, sehingga menu <b>Dokumen</b> langsung dapat dibuka. Bila pendaftaran itu gagal, pesan peringatan akan muncul \u2014 akunnya tetap terbentuk, tetapi berkas akan ditolak sampai Admin Pusat menjalankan <code>08_akun_kustom_auth.sql</code>.</div>';
    h+='<div class="ac-form">';
    h+='<div class="ac-row2">'
      + '<div class="ac-fld"><label>Username</label><input id="ac-c-user" type="text" autocomplete="off" placeholder="mis. operator1" value="'+(e?escapeHtml(e.username):'')+'"'+(e?' readonly':'')+'></div>'
      + '<div class="ac-fld"><label>Kata Sandi</label><input id="ac-c-pass" type="text" autocomplete="off" placeholder="min. 4 karakter" value="'+(e?escapeHtml(e.password||''):'')+'"></div>'
      + '</div>';
    /* PILIHAN "Admin Cabang" DIHAPUS DARI LAYAR (7 Agu 2026) — beserta pemilih
       Jenis Akun (kini hanya ada satu jenis), catatan "Admin Cabang selalu
       mencakup semua bidang", dan ringkasan haknya. Akun yang dibuat dari
       panel ini selalu bertipe User.

       LAPISAN DATANYA SENGAJA TIDAK DIBONGKAR. acTipe/AC_TIPE_ADMIN tetap ada
       karena akun bertipe 'admin' yang SUDAH TERSIMPAN masih harus dikenali
       saat login (pemetaan peran di acTerapkanPeran) — mencabutnya berarti
       menurunkan hak akun yang sudah berjalan tanpa satu pun peringatan. Yang
       hilang hanyalah cara MEMBUAT yang baru. */
    h+='<div class="ac-row2">'
      + '<div class="ac-fld"><label>Bidang</label><select id="ac-c-bidang">'+opts+'</select></div>'
      + '</div>';
    h+='<div class="ac-actions">'
      + (e?'<button class="btn btn-red" type="button" data-modal onclick="acTab(\'list\')">'+BTN_IC_BATAL+'Batal</button>':'')
      + '<button class="btn btn-green" type="button" data-modal onclick="acCreateAccount('+(e?'true':'false')+')">'+(e?BTN_IC_SIMPAN+'Simpan':'+ Buat Akun')+'</button></div>';
    h+='</div>';
    document.getElementById('ac-pane-create').innerHTML=h;
  }
  /* Jenis akun diubah -> bidang dikunci/dilepas & ringkasan haknya ikut ganti.
     Ditulis sebagai penyunting DOM, bukan render ulang seluruh halaman, supaya
     username & kata sandi yang sudah diketik tidak ikut hilang. */

  window.acCreateAccount=async function(isEdit){
    var cfg=acGetConfig();
    var u=((document.getElementById('ac-c-user')||{}).value||'').trim();
    var p=((document.getElementById('ac-c-pass')||{}).value||'');
    var tipe=AC_TIPE_USER;                 /* satu-satunya jenis yang bisa dibuat dari panel ini */
    var bidang=((document.getElementById('ac-c-bidang')||{}).value||AC_SEMUA);
    if(!u){ try{ toast('Username wajib diisi','warn'); }catch(e){} return; }
    if(!isEdit && RESERVED.indexOf(u.toLowerCase())>=0){ try{ toast('Username "'+u+'" sudah dipakai peran bawaan. Pilih nama lain.','warn'); }catch(e){} return; }
    if((p||'').length<4){ try{ toast('Kata sandi minimal 4 karakter','warn'); }catch(e){} return; }
    var acct={ username:u, password:p, type:tipe, bidang:bidang||AC_SEMUA };
    cfg.accounts=cfg.accounts||[];
    var idx=cfg.accounts.findIndex(function(x){ return String(x.username).toLowerCase()===u.toLowerCase(); });
    if(idx>=0){ cfg.accounts[idx]=acct; } else { cfg.accounts.push(acct); }

    var ok=await acSaveConfig();
    var auth=await acSalurkanKeAuth(u, p, tipe, bidang);
    try{
      toast(
        (idx>=0?'Akun diperbarui':'Akun dibuat')
        + (ok?'':' (lokal)')
        + (auth.ok ? ' & terhubung ke Supabase Auth'
                   : ' — TETAPI belum terhubung ke Supabase Auth, menu Dokumen akan ditolak ('+auth.pesan+')'),
        auth.ok?'ok':'warn');
    }catch(e){}
    acTab('list');
  };

  /* -------- Daftar akun --------
     Blok "Sedang Aktif" DIHAPUS: kolom Status Online di tabel ini memuat
     keterangan yang sama untuk SETIAP akun, bukan hanya yang kebetulan sedang
     online — jadi daftar terpisah itu hanya mengulang sebagian informasi yang
     sudah ada, di tempat yang lebih jauh dari akunnya. */
  function acRenderList(){
    var cfg=acGetConfig(); var accs=cfg.accounts||[];
    /* LENCANA RINGKASAN & CATATAN "Admin Pusat" DIHAPUS (7 Agu 2026).
       Keduanya mengulang apa yang sudah terbaca langsung dari tabel di
       bawahnya: jumlah akun tinggal dihitung dari barisnya, jenis akun sudah
       ditandai lencana pada tiap baris, dan ketiadaan Admin Pusat justru
       terlihat dari daftarnya sendiri. Menghapusnya membuat daftar akun mulai
       tepat di bawah judul panel.
       Dua perhitungan yang hanya melayani lencana itu (jmlAdmin & terbatas)
       ikut dibuang, bukan ditinggal menganggur. */
    var h='';
    if(!accs.length){ h+='<div class="ac-empty">Belum ada akun. Tekan <b>+ Buat Akun Baru</b> di bawah untuk menambah.</div>'; }
    else {
      h+='<div class="ac-tablewrap"><table class="ac-list"><thead><tr>'
        +'<th>Username</th><th>Jenis</th><th>Bidang</th><th>Hak Ubah / Hapus</th>'
        +'<th>Status Online</th><th class="col-aksi">Aksi</th></tr></thead><tbody>';
      accs.forEach(function(a){
        var t=acTipe(a);
        var adm=(t===AC_TIPE_ADMIN);
        var semua=adm || (!a.bidang || a.bidang===AC_SEMUA);
        var un=escapeAttr(a.username);
        h+='<tr><td class="ac-cell-user">'+escapeHtml(a.username)+'</td>'
          +'<td><span class="ac-pill '+(adm?'admin':'user')+'">'+acTipeLabel(t)+'</span></td>'
          +'<td>'+(semua?'<span class="ac-pill on">Semua Bidang</span>':escapeHtml(a.bidang))+'</td>'
          +'<td class="ac-cell-ket">'+(adm
              ? 'Seluruh data &amp; menu, kecuali Kelola Akun'
              : (semua?'Seluruh data monitoring + dokumen SPBJ':'Hanya bidangnya'))+'</td>'
          /* Diisi belakangan oleh acFillStatus(): angkanya datang dari tabel
             presence lewat jaringan, dan render daftar tidak boleh menunggu. */
          +'<td class="ac-cell-status" data-user="'+un+'"><span class="ac-muted">memeriksa…</span></td>'
          +'<td class="ac-col-aksi"><div class="ac-rowact">'
          +  acIkonBtn('act-edit',  'Ubah akun',        "acEditAccount('"+un+"')",   AC_IC_UBAH)
          +  acIkonBtn('act-del',   'Hapus akun',       "acDeleteAccount('"+un+"')", AC_IC_HAPUS)
          +  acIkonBtn('act-reset', 'Reset kata sandi', "acResetSandi('"+un+"')",    AC_IC_RESET)
          +'</div></td></tr>';
      });
      h+='</tbody></table></div>';
    }
    h+='<div class="ac-actions"><button class="btn btn-teal" type="button" onclick="acTab(\'create\')">+ Buat Akun Baru</button></div>';
    document.getElementById('ac-pane-list').innerHTML=h;
    acFillStatus();
  }

  /* Tombol aksi berupa ikon saja. Memakai kelas .act milik app.js supaya
     bentuk, ukuran, dan gerak hover-nya sama persis dengan tombol aksi di
     tabel-tabel lain — bukan gaya baru yang kebetulan mirip. */
  var AC_IC_UBAH  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.3 3.5H5.6A2.1 2.1 0 0 0 3.5 5.6v12.8a2.1 2.1 0 0 0 2.1 2.1h12.8a2.1 2.1 0 0 0 2.1-2.1v-6.7"/><path d="M18.38 2.63a1.9 1.9 0 0 1 2.99 3l-9.01 9.01a2 2 0 0 1-.85.51l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .51-.85z"/><path d="M16.8 4.3 19.8 7.3"/></svg>';
  var AC_IC_HAPUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 9h13l-1 11.2A2 2 0 0 1 15.5 22h-7a2 2 0 0 1-2-1.8L5.5 9z"/><path d="M3 7.4 21 3.6"/><path d="M9.7 5.9 9.4 4.4a1 1 0 0 1 .8-1.2l3.3-.7a1 1 0 0 1 1.2.8l.3 1.5"/><path d="M10 12.5v6M14 12.5v6"/></svg>';
  var AC_IC_RESET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="3.5"/><path d="M10 13 20 3"/><path d="M17 6l2 2"/><path d="M14 9l2 2"/></svg>';
  function acIkonBtn(cls, judul, aksi, svg){
    return '<button class="act '+cls+'" type="button" title="'+judul+'" aria-label="'+judul+'" onclick="'+aksi+'">'+svg+'</button>';
  }

  /* ---- Status Online ----
     Sumbernya stempel waktu terakhir di tabel presence. Sejak acEndBeat tidak
     lagi menghapus barisnya, stempel itu bertahan setelah orangnya keluar —
     itulah yang membuat "1 minggu yang lalu" mungkin dihitung.

     Ambang "Sedang aktif" 2 menit, bukan 5: detak presence berjalan tiap 60
     detik, jadi 2 menit memberi kelonggaran satu detak yang terlewat tanpa
     membuat orang yang sudah menutup peramban tetap tampak menyala lama. */
  function acStatusOnline(ts){
    if(!ts) return { cls:'never', label:'Belum pernah masuk' };
    var d=Date.now()-ts;
    if(d < 0) d=0;                                  // jam perangkat berbeda
    if(d < 2*60*1000)   return { cls:'on',     label:'Sedang aktif' };
    var menit=Math.floor(d/60000);
    if(menit < 60)      return { cls:'baru',   label:menit+' menit yang lalu' };
    var jam=Math.floor(menit/60);
    if(jam < 24)        return { cls:'baru',   label:jam+' jam yang lalu' };
    var hari=Math.floor(jam/24);
    if(hari < 7)        return { cls:'jeda',   label:hari+' hari yang lalu' };
    if(hari < 30)       return { cls:'jeda',   label:Math.floor(hari/7)+' minggu yang lalu' };
    if(hari < 365)      return { cls:'jeda',   label:Math.floor(hari/30)+' bulan yang lalu' };
    if(hari < 730)      return { cls:'lama',   label:'1 tahun yang lalu' };
    return { cls:'lama', label:'Tidak aktif > 1 tahun' };
  }
  async function acFillStatus(){
    var sel=document.querySelectorAll('#ac-pane-list .ac-cell-status');
    if(!sel.length) return;
    if(!_useSupa()){
      sel.forEach(function(td){ td.innerHTML='<span class="ac-muted">perlu koneksi</span>'; });
      return;
    }
    var list=await acLoadPresence();
    /* Daftar bisa saja sudah digambar ulang selagi permintaan ini berjalan. */
    if(!document.body.contains(sel[0])) return;
    var peta={};
    list.forEach(function(p){ peta[String(p.name).toLowerCase()]=p.ts; });
    sel.forEach(function(td){
      var u=String(td.getAttribute('data-user')||'').toLowerCase();
      var st=acStatusOnline(peta[u]);
      td.innerHTML='<span class="ac-stat '+st.cls+'"><i></i>'+st.label+'</span>';
    });
  }

  window.acEditAccount=function(username){
    var a=acFindAcct(username); if(!a) return;
    acTab('create'); acRenderCreate(a);
  };
  window.acDeleteAccount=async function(username){
    var cfg=acGetConfig();
    if(!confirm('Hapus akun "'+username+'"? Tindakan ini tidak dapat dibatalkan.')) return;
    cfg.accounts=(cfg.accounts||[]).filter(function(x){ return String(x.username).toLowerCase()!==String(username).toLowerCase(); });
    await acSaveConfig();
    /* Akun Auth-nya ikut dihapus. Tanpa ini, akun yang "dihapus" dari panel
       masih bisa login lewat Supabase Auth — perannya saja yang hilang,
       sehingga ia jatuh jadi 'guest' dan tetap memegang sesi yang sah. */
    var authPesan='';
    if(_useSupa()){
      try{
        var res=await _realDb().rpc('hapus_akun_auth',{ p_username:username });
        if(res && res.error) authPesan=' — akun Supabase Auth belum terhapus ('+(res.error.message||'ditolak')+')';
      }catch(e){ authPesan=' — akun Supabase Auth belum terhapus'; }
    }
    try{ toast('Akun dihapus'+authPesan, authPesan?'warn':'ok'); }catch(e){}
    acRenderList();
  };

  /* ---------- Reset Kata Sandi ----------
     Halaman Reset Sandi DIHAPUS. Ia dulu mengulang seluruh daftar akun hanya
     untuk menaruh sebuah kotak isian di tiap baris — padahal reset adalah
     tindakan atas satu akun. Sekarang tombolnya ada di kolom Aksi.

     Bagian "Akun Server" ikut hilang. Itu disengaja: ia memanggil RPC
     `admin_reset_password`, yang menurut catatannya sendiri SUDAH DIBUANG dari
     01_auth_login.sql — jadi tombolnya tidak pernah bisa berhasil. Kata sandi
     Admin Pusat kini diganti lewat menu "Ganti Kata Sandi".

     KATA SANDI RESET BERSIFAT TETAP. Admin tidak mengarang kata sandi baru
     tiap kali; reset selalu mengembalikannya ke nilai di bawah, sehingga yang
     perlu disampaikan kepada pengguna selalu sama dan tidak mungkin salah
     dibacakan. Konsekuensinya nilai ini praktis diketahui umum — karena itu
     ia kata sandi SEMENTARA: pengguna wajib segera menggantinya. */
  var AC_SANDI_RESET = 'masohi123';

  /* Menyalurkan akun ke Supabase Auth lewat RPC kelola_akun_auth
     (08_akun_kustom_auth.sql). Tanpa langkah ini akun tetap bisa login —
     pencocokannya teks biasa di peramban — tetapi tidak punya JWT, sehingga
     SETIAP berkas ditolak policy Storage dengan 403 tanpa penjelasan yang
     berarti bagi penggunanya.

     Balikan: {ok:true} | {ok:false, pesan:'…'}. Kegagalannya TIDAK pernah
     membatalkan penyimpanan ke app_profiles — akun tetap terbentuk dan bisa
     dipakai untuk menu selain Dokumen — tetapi harus SELALU diberitahukan,
     sebab akibatnya tidak terlihat sampai orangnya mencoba membuka berkas. */
  async function acSalurkanKeAuth(username, password, tipe, bidang){
    if(!_useSupa()) return { ok:false, pesan:'tidak ada koneksi Supabase' };
    try{
      var res=await _realDb().rpc('kelola_akun_auth',{
        p_username:username, p_password:password,
        p_peran:(tipe===AC_TIPE_ADMIN?'admin':'user'),
        p_bidang:(tipe===AC_TIPE_ADMIN?AC_SEMUA:(bidang||AC_SEMUA))
      });
      if(res && res.error) return { ok:false, pesan:(res.error.message||'ditolak server') };
      return { ok:true };
    }catch(e){ return { ok:false, pesan:String((e&&e.message)||e) }; }
  }

  window.acResetSandi=function(username){
    var a=acFindAcct(username);
    if(!a){ try{ toast('Akun tidak ditemukan','warn'); }catch(e){} return; }
    var lakukan=async function(){
      a.password=AC_SANDI_RESET;
      var ok=await acSaveConfig();
      /* Supabase Auth WAJIB ikut diperbarui. Kalau tidak, orangnya bisa masuk
         dengan masohi123 (cocok teks biasa) tetapi sesi Auth gagal terbentuk
         memakai sandi lama — dan berkas kembali ditolak tanpa sebab yang
         terlihat. Ini persis lubang yang dulu ada di sini. */
      var auth=await acSalurkanKeAuth(username, AC_SANDI_RESET, acTipe(a), a.bidang);
      try{
        toast('Kata sandi "'+username+'" direset ke '+AC_SANDI_RESET+(ok?'':' (lokal)')
              + (auth.ok?'':' — Supabase Auth GAGAL diperbarui ('+auth.pesan+')'),
              auth.ok?'ok':'warn');
      }catch(e){}
      acRenderList();
    };
    /* openConfirm milik app.js dipakai supaya tampilannya seragam dengan
       konfirmasi lain. Bila belum ada (mis. app.js gagal dimuat), jatuh ke
       confirm() bawaan — lebih baik jelek daripada tombol yang diam saja. */
    var pesan='Kata sandi akun "'+username+'" akan disetel ulang menjadi '+AC_SANDI_RESET
            + '. Sampaikan kepada pemiliknya dan minta segera menggantinya.';
    if(typeof openConfirm==='function'){
      openConfirm({ icon:'warn', title:'Reset Kata Sandi', text:pesan, onYes:lakukan });
    }else if(confirm(pesan)){
      lakukan();
    }
  };

  /* ============================ PANEL PENYIMPANAN ============================ */
  var ST_TABLES=[
    {t:'pekerjaan',              l:'SPBJ / Kontrak Rinci',  grp:'Data Pengadaan'},
    {t:'pengadaan_langsung',     l:'Pengadaan Langsung',    grp:'Data Pengadaan'},
    {t:'tender',                 l:'Tender',                grp:'Data Pengadaan'},
    {t:'file_kontrak',           l:'File Kontrak (metadata)', grp:'Dokumen'},
    {t:'kelengkapan_dokumen',    l:'Kelengkapan Dokumen',   grp:'Dokumen'},
    {t:'pembukaan_penawaran',    l:'Pembukaan Penawaran',   grp:'Dokumen'},
    {t:'penetapan_nomor',        l:'Penetapan Nomor',       grp:'Penetapan'},
    {t:'penetapan_config',       l:'Konfigurasi Penetapan', grp:'Penetapan'},
    {t:'referensi_harga_online', l:'Referensi Harga Online',grp:'HPS & Analisa'},
    {t:'harga_perkiraan_sendiri',l:'HPS',                   grp:'HPS & Analisa'},
    {t:'analisa_harga_satuan',   l:'Analisa Harga Satuan',  grp:'HPS & Analisa'},
    {t:'data_pekerjaan',         l:'Daftar Pekerjaan',      grp:'Perencanaan'},
    {t:'jadwal_pelaksanaan',     l:'Jadwal Pelaksanaan',    grp:'Perencanaan'},
    {t:'hari_libur',             l:'Hari Libur',            grp:'Perencanaan'},
    {t:'kontrak_spk',            l:'Kontrak SPK',           grp:'Kontrak'},
    {t:'klausul_spk',            l:'Klausul SPK',           grp:'Kontrak'},
    {t:'app_profiles',           l:'Profil & Konfigurasi',  grp:'Sistem'}
  ];
  /* Bagian penyimpanan Supabase Storage, mengikuti FILE_ROUTES di app.js
     (dulu tabel ROUTES di Worker).
     `p` = prefiks path (segmen pertama) = kolom `prefiks` yang dikembalikan
     storage_rincian(). `bk` = bucket tempatnya bermuara — perhatikan tiga
     prefiks pertama berbagi satu bucket `file-kontrak`, jadi rincian ini
     LEBIH HALUS daripada daftar bucket di dashboard Supabase.
     Urutan di sini menentukan urutan tampil pada panel. */
  var ST_R2_PARTS=[
    {p:'kontrak-rinci',      bk:'file-kontrak',       l:'SPBJ / Kontrak Rinci'},
    {p:'pengadaan-langsung', bk:'file-kontrak',       l:'Pengadaan Langsung'},
    {p:'tender',             bk:'file-kontrak',       l:'Tender'},
    {p:'dokumen-pengadaan',  bk:'dokumen-pengadaan',  l:'Dokumen Pengadaan'},
    {p:'materi-peraturan',   bk:'materi-peraturan',   l:'Materi & Peraturan'},
    {p:'foto-referensi',     bk:'foto-referensi',     l:'Foto Referensi Harga'}
  ];
  /* Baris "cadangan lama" DIHAPUS bersama migrasi ke Supabase Storage.

     Dulu blok itu memanggil storage_size() — yang mengelompokkan
     storage.objects per BUCKET — untuk menampilkan sisa cadangan Supabase
     di samping angka R2 yang jadi sumber utama. Sesudah migrasi, kedua
     angka itu membaca KATALOG YANG SAMA: setiap bucket aktif akan muncul
     dua kali, satu sebagai rincian per prefiks dan satu lagi berlabel
     "cadangan lama", dengan ~1,5 GB terhitung ganda dan `file-kontrak`
     justru diberi label cadangan padahal ia bucket utama sekarang.

     Bucket generasi lama `rho-foto` sudah dihapus dan `penyimanan-pengadaan`
     tidak pernah ada di proyek Supabase ini (arsip beku di R2), jadi tidak
     ada lagi yang perlu ditampilkan sebagai warisan. */
  /* Acuan kuota paket Supabase Pro. Keduanya bukan batas keras — Supabase
     menagih kelebihannya, tidak memutusnya — jadi angka ini murni pembanding
     agar gauge punya skala yang masuk akal. Sesuaikan bila paketnya berubah. */
  var ST_DB_QUOTA = 8*1024*1024*1024;      // acuan Supabase Pro: 8 GB database
  var ST_ST_QUOTA = 100*1024*1024*1024;    // acuan Supabase Pro: 100 GB storage

  function stFmt(b){
    if(b==null || isNaN(b)) return '—';
    if(b<1024) return b+' B';
    var u=['KB','MB','GB','TB'], i=-1;
    do{ b/=1024; i++; }while(b>=1024 && i<u.length-1);
    return (b>=100?b.toFixed(0):(b>=10?b.toFixed(1):b.toFixed(2)))+' '+u[i];
  }
  function stNum(n){ return (n==null||isNaN(n))?'—':Number(n).toLocaleString('id-ID'); }

  async function stCount(t){
    if(!_useSupa()) return null;
    try{ var res=await _realDb().from(t).select('*',{count:'exact',head:true}); if(res && !res.error && typeof res.count==='number') return res.count; }catch(e){}
    return null;
  }
  async function stTableSizes(){
    if(!_useSupa()) return null;
    try{
      var res=await _realDb().rpc('table_sizes');
      if(res && !res.error && Array.isArray(res.data)){
        var m={};
        res.data.forEach(function(r){ var n=r.table_name||r.name||r.table; if(n) m[n]=Number(r.total_bytes||r.bytes||r.size||0); });
        return m;
      }
    }catch(e){}
    return null;
  }
  /* Ukuran DATABASE total (setara metrik Supabase) via RPC db_size() */
  async function stDbSize(){
    if(!_useSupa()) return null;
    try{
      var res=await _realDb().rpc('db_size');
      if(res && !res.error && res.data!=null){
        var d=res.data; if(Array.isArray(d)) d = d[0] && (d[0].db_size!=null?d[0].db_size:d[0]);
        var n=Number(d);
        if(!isNaN(n) && n>0) return n;
      }
    }catch(e){}
    return null;
  }
  /* Ukuran STORAGE per bucket langsung dari katalog storage.objects via RPC storage_size() */
  async function stStorageSizes(){
    if(!_useSupa()) return null;
    try{
      var res=await _realDb().rpc('storage_size');
      if(res && !res.error && Array.isArray(res.data)){
        return res.data.map(function(r){
          return { b: String(r.bucket_id||r.bucket||''), bytes: Number(r.bytes||0)||0, files: Number(r.files||0)||0 };
        }).filter(function(r){ return r.b; });
      }
    }catch(e){}
    return null;
  }

  /* WARISAN: pemindaian list() Supabase Storage. Tidak lagi dipanggil sejak
     seluruh berkas pindah ke R2; dipertahankan sebagai cadangan diagnostik. */
  async function stBucketScan(bucket){
    var total=0, files=0, folders=[''], guard=0, capped=false;
    if(!_useSupa()) return {bytes:0,files:0,capped:false,missing:true};
    try{
      while(folders.length && guard<500){
        guard++;
        var prefix=folders.shift(), offset=0;
        while(true){
          var res=await _realDb().storage.from(bucket).list(prefix, {limit:100, offset:offset, sortBy:{column:'name',order:'asc'}});
          if(!res || res.error){ if(guard===1) return {bytes:0,files:0,capped:false,missing:true,err:res&&res.error}; break; }
          var data=res.data||[]; if(!data.length) break;
          data.forEach(function(o){
            var path=prefix?(prefix+'/'+o.name):o.name;
            var isFolder = (o.id==null) && (o.metadata==null);
            if(isFolder){ if(folders.length<5000) folders.push(path); }
            else { files++; total += (o.metadata && (o.metadata.size||o.metadata.contentLength))||0; }
          });
          if(data.length<100) break;
          offset+=100;
        }
      }
      if(guard>=500) capped=true;
    }catch(e){ return {bytes:total,files:files,capped:capped,err:e}; }
    return {bytes:total, files:files, capped:capped};
  }

  /* Ukuran storage nyata di Cloudflare R2 via Worker (/api/usage).
     TIGA bentuk balasan didukung supaya panel tetap jalan apa pun versi Worker:
       (a) { files, bytes, rincian:{ <prefiks>:{files,bytes} } }  ← Worker v2
       (b) { buckets:[{bucket,bytes,files}, ...] }                ← cadangan
       (c) { bytes, files }                                       ← Worker lama
     Pada bentuk (c) angkanya GABUNGAN semua bucket, jadi TIDAK boleh dilabeli
     sebagai milik satu bucket saja — itulah asal salah label 689 berkas dulu.
     Balikan: {mode:'rinci',map} | {mode:'agregat',bytes,files} | null */
  async function stStorageUsage(){
    /* Ukuran nyata Supabase Storage, dirinci per PREFIKS (bukan per bucket).
       Perincian per prefiks penting karena bucket `file-kontrak` menampung
       tiga prefiks sekaligus (kontrak-rinci, pengadaan-langsung, tender) —
       angka per bucket saja akan menggabungkan ketiganya jadi satu baris.
       Sumbernya fungsi storage_rincian() di 05_storage_usage.sql.
       Balikan: {mode:'rinci',map} | null */
    try{
      if(!(typeof db!=='undefined' && db)) return null;
      var r=await db.rpc('storage_rincian');
      if(r.error || !Array.isArray(r.data)) return null;
      var map={};
      r.data.forEach(function(row){
        var k=String(row.prefiks||'').replace(/\/+$/,'');
        if(!k) return;
        map[k]={ bytes:Number(row.bytes||0)||0, files:Number(row.files||0)||0, err:null };
      });
      return Object.keys(map).length ? { mode:'rinci', map:map } : null;
    }catch(e){ return null; }
  }
  /* Nama lama dipertahankan supaya pemanggilnya di panel Penyimpanan tidak
     perlu diubah; isinya tidak lagi menyentuh Cloudflare sama sekali. */
  var stR2Usage = stStorageUsage;

  function stEnsurePanel(){
    if(document.getElementById('st-ov')) return;
    var ov=document.createElement('div');
    ov.id='st-ov'; ov.className='ac-ov st-ov'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true');
    ov.innerHTML =
      '<div class="ac-panel st-panel">'
      + '<div class="ac-head">'
      +   '<div class="ac-head-t"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>'
      +     '<div><h3>Penyimpanan</h3><p>Pantau pemakaian database &amp; storage file di Supabase.</p></div></div>'
      +   '<button class="ac-x" type="button" onclick="stClose()" aria-label="Tutup">&times;</button>'
      + '</div>'
      + '<div class="ac-body"><div class="ac-pane" id="st-pane"></div></div>'
      + '</div>';
    document.body.appendChild(ov);
    try{ if(typeof pasangTolakTutup==='function') pasangTolakTutup('st-ov'); }catch(e){}
  }
  window.stClose=function(){ var ov=document.getElementById('st-ov'); if(ov) ov.classList.remove('show'); };
  window.openStoragePanel=async function(){
    if(!acUnrestricted()){ try{ toast('Hanya Admin yang dapat melihat penyimpanan','warn'); }catch(e){} return; }
    stEnsurePanel();
    var ov=document.getElementById('st-ov'); ov.classList.add('show');
    stRender(null);
    stScan();
  };
  window.stScan=async function(){
    var btn=document.getElementById('st-refresh'); if(btn){ btn.disabled=true; btn.textContent='Memindai…'; }
    if(!_useSupa()){
      stRender({offline:true});
      if(btn){ btn.disabled=false; btn.textContent='Segarkan'; }
      return;
    }
    var data={ tables:[], buckets:[], totalRows:0, totalBytesDb:null, totalBytesTbl:null, totalBytesSt:0,
               dbExact:false, stExact:false, ts:Date.now() };
    try{
      /* --- DATABASE --- */
      var sizes=await stTableSizes();
      var counts=await Promise.all(ST_TABLES.map(function(x){ return stCount(x.t); }));
      ST_TABLES.forEach(function(x,i){
        var rows=counts[i];
        var bytes= sizes ? (sizes[x.t]!=null?sizes[x.t]:null) : null;
        if(typeof rows==='number') data.totalRows+=rows;
        if(typeof bytes==='number'){ data.totalBytesTbl=(data.totalBytesTbl||0)+bytes; }
        data.tables.push({t:x.t,l:x.l,grp:x.grp,rows:rows,bytes:bytes});
      });
      var dbTotal=await stDbSize();
      if(dbTotal!=null){ data.totalBytesDb=dbTotal; data.dbExact=true; }
      else { data.totalBytesDb=data.totalBytesTbl; data.dbExact=false; }

      /* --- STORAGE ---
         Satu-satunya sumber sekarang: katalog storage.objects Supabase,
         dibaca per PREFIKS lewat storage_rincian(). Tidak ada lagi jalur
         kedua, jadi tidak ada lagi angka yang bisa berselisih. */
      var r2u=null;
      try{ r2u=await stStorageUsage(); }catch(e){ console.error('stStorageUsage:',e); }

      if(r2u && r2u.mode==='rinci'){
        data.stExact=true; data.r2Mode='rinci';
        ST_R2_PARTS.forEach(function(x){
          var v=r2u.map[x.p]||{bytes:0,files:0,err:null};
          data.buckets.push({b:x.p, bk:x.bk, l:x.l, bytes:v.bytes, files:v.files, r2:true, unbound:(v.err==='bucket_not_bound')});
          data.totalBytesSt += v.bytes;
        });
        /* Prefiks di luar daftar. Bukan sekadar jaga-jaga: sisa `pl/` di
           bucket file-kontrak akan muncul di sini sampai dihapus dengan
           hapus-prefiks-supabase.mjs — justru berguna sebagai pengingat. */
        Object.keys(r2u.map).forEach(function(nama){
          if(ST_R2_PARTS.some(function(x){ return x.p===nama; })) return;
          var v=r2u.map[nama];
          data.buckets.push({b:nama, bk:nama, l:nama, bytes:v.bytes, files:v.files, r2:true, unbound:(v.err==='bucket_not_bound')});
          data.totalBytesSt += v.bytes;
        });
      } else if(r2u && r2u.mode==='agregat'){
        /* Bentuk warisan dari era Worker. storage_rincian() tidak pernah
           mengembalikannya; dipertahankan hanya agar cabang ini tidak jadi
           lubang diam bila suatu saat sumbernya diganti lagi. */
        data.stExact=true; data.r2Mode='agregat';
        data.buckets.push({b:'(gabungan)', l:'Supabase Storage — semua bucket', bytes:r2u.bytes, files:r2u.files, r2:true, agg:true});
        data.totalBytesSt += r2u.bytes;
      } else {
        data.r2Mode='gagal';
        ST_R2_PARTS.forEach(function(x){
          data.buckets.push({b:x.p, bk:x.bk, l:x.l, bytes:0, files:0, r2:true, missing:true});
        });
      }

      /* Blok "cadangan lama" sengaja DIHILANGKAN — lihat catatan di dekat
         ST_R2_PARTS. storage_size() dan storage_rincian() kini membaca
         katalog yang sama, jadi menampilkan keduanya berarti menghitung
         setiap bucket aktif dua kali. */
      data.totalBytesLegacy=0;
    }catch(e){ console.error('stScan:',e); }
    stRender(data);
    var btn2=document.getElementById('st-refresh'); if(btn2){ btn2.disabled=false; btn2.textContent='Segarkan'; }
  };
  function stBar(used, quota, cls){
    var pct = quota>0 ? Math.min(100, Math.round(used/quota*1000)/10) : 0;
    var lvl = pct>=90?' hot':(pct>=70?' warn':'');
    return '<div class="st-gauge">'
      + '<div class="st-gauge-top"><span class="st-gauge-lbl">'+stFmt(used)+'</span><span class="st-gauge-pct">'+pct+'%</span></div>'
      + '<div class="st-track big"><span class="st-fill '+(cls||'')+lvl+'" style="width:'+Math.max(pct,used>0?3:0)+'%"></span></div>'
      + '<div class="st-gauge-cap">dari acuan '+stFmt(quota)+'</div></div>';
  }
  function stItem(name, val, sub, pct, cls, extra){
    return '<div class="st-item"><div class="st-item-row">'
      + '<span class="st-item-name">'+name+(extra||'')+'</span>'
      + '<span class="st-item-val">'+val+(sub?' <em>'+sub+'</em>':'')+'</span>'
      + '</div><div class="st-track"><span class="st-fill '+(cls||'')+'" style="width:'+Math.max(0,Math.min(100,pct))+'%"></span></div></div>';
  }
  function stRender(data){
    var pane=document.getElementById('st-pane'); if(!pane) return;
    if(data===null){
      pane.innerHTML='<div class="st-loading"><div class="st-spin"></div><p>Memindai database &amp; storage…</p></div>';
      return;
    }
    if(data.offline){
      pane.innerHTML='<div class="ac-note">Panel Penyimpanan memerlukan koneksi <b>Supabase</b> aktif. Saat ini aplikasi berjalan tanpa koneksi database (mode sandbox), sehingga pemakaian tidak dapat dibaca.</div>'
        +'<div class="ac-actions"><button class="btn btn-teal" id="st-refresh" type="button" onclick="stScan()">Segarkan</button></div>';
      return;
    }
    var maxRows=0; data.tables.forEach(function(r){ if(typeof r.rows==='number' && r.rows>maxRows) maxRows=r.rows; });
    /* Baris warisan tetap dikecualikan agar konsisten dengan totalBytesSt.
       Sejak blok "cadangan lama" dihapus, tidak ada lagi yang bertanda itu —
       penjaganya dipertahankan supaya penambahan baris serupa nanti tidak
       diam-diam mengacaukan KPI. */
    var totalFiles=data.buckets.reduce(function(a,b){return a+(b.legacy?0:(b.files||0));},0);
    var stDenom=(data.totalBytesSt||0)+(data.totalBytesLegacy||0);
    var dbPct = (data.totalBytesDb!=null && ST_DB_QUOTA>0) ? Math.min(100, Math.round(data.totalBytesDb/ST_DB_QUOTA*1000)/10) : null;
    var stPct = ST_ST_QUOTA>0 ? Math.min(100, Math.round(data.totalBytesSt/ST_ST_QUOTA*1000)/10) : 0;
    var h='<div class="st-wrap">';
    // Ringkasan atas (KPI 3D)
    h+='<div class="st-top">';
    h+='<div class="st-kpi st-kpi-db"><span class="st-kpi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg></span>'
      + '<span class="st-kpi-txt">'
      + ( data.totalBytesDb!=null
          ? '<span class="st-kpi-l">Penyimpanan Database</span>'
            + '<span class="st-kpi-v">'+stFmt(data.totalBytesDb)+'</span>'
            + '<span class="st-kpi-mini"><span style="width:'+Math.max(dbPct,data.totalBytesDb>0?2:0)+'%"></span></span>'
            + '<span class="st-kpi-sub">dari '+stFmt(ST_DB_QUOTA)+' &middot; <b>'+dbPct+'%</b> terpakai &middot; '+stNum(data.totalRows)+' baris'
              + ' &middot; '+(data.dbExact?'total database':'<i>estimasi tabel</i>')+'</span>'
          : '<span class="st-kpi-l">Total Baris Database</span>'
            + '<span class="st-kpi-v">'+stNum(data.totalRows)+'</span>'
            + '<span class="st-kpi-sub">ukuran byte: aktifkan RPC</span>' )
      + '</span></div>';
    h+='<div class="st-kpi st-kpi-st"><span class="st-kpi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></span>'
      + '<span class="st-kpi-txt"><span class="st-kpi-l">Penyimpanan File Storage</span>'
      + '<span class="st-kpi-v">'+stFmt(data.totalBytesSt)+'</span>'
      + '<span class="st-kpi-mini st"><span style="width:'+Math.max(stPct,data.totalBytesSt>0?2:0)+'%"></span></span>'
      + '<span class="st-kpi-sub">dari '+stFmt(ST_ST_QUOTA)+' &middot; <b>'+stPct+'%</b> terpakai &middot; '+stNum(totalFiles)+' berkas'
      + ' &middot; '+(data.stExact?'katalog storage':'<i>pemindaian berkas</i>')+'</span>'
      + '</span></div>';
    h+='</div>';

    // Kartu Database
    h+='<div class="st-card st-card-db"><div class="st-card-h"><span class="st-card-ic db"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg></span><b>Database</b> <span class="st-muted">jumlah baris per tabel</span></div>';
    if(data.totalBytesDb!=null){ h+=stBar(data.totalBytesDb, ST_DB_QUOTA, 'db'); }
    if(data.dbExact){
      var lain = (data.totalBytesTbl!=null) ? Math.max(0, data.totalBytesDb - data.totalBytesTbl) : null;
      h+='<div class="st-hint">Angka di atas adalah <b>ukuran seluruh database</b> (sama dengan <i>Database Size</i> di dashboard Supabase): sudah termasuk indeks, skema <code>auth</code>/<code>storage</code>/<code>realtime</code>, dan katalog sistem.'
       + (lain!=null?' Tabel aplikasi di bawah: <b>'+stFmt(data.totalBytesTbl)+'</b>; sisanya '+stFmt(lain)+' berupa indeks &amp; komponen sistem.':'')
       + '</div>';
    } else {
      h+='<div class="st-hint">RPC <code>db_size()</code> belum tersedia \u2014 angka ini baru penjumlahan tabel aplikasi, jadi akan lebih kecil dari <i>Database Size</i> di dashboard Supabase.</div>';
    }
    var curGrp=null;
    h+='<div class="st-list">';
    data.tables.forEach(function(r){
      if(r.grp!==curGrp){ curGrp=r.grp; h+='<div class="st-glabel">'+curGrp+'</div>'; }
      var pct = maxRows>0 && typeof r.rows==='number' ? Math.round(r.rows/maxRows*100) : 0;
      var val = typeof r.rows==='number' ? stNum(r.rows) : '<span class="st-na">tak terbaca</span>';
      var sub = typeof r.rows==='number' ? 'baris'+(r.bytes!=null?' · '+stFmt(r.bytes):'') : '';
      h+=stItem(r.l, val, sub, pct, 'db');
    });
    h+='</div></div>';

    // Kartu Storage
    h+='<div class="st-card st-card-st"><div class="st-card-h"><span class="st-card-ic st"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></span><b>Storage File</b> <span class="st-muted">ukuran per bagian</span></div>';
    h+=stBar(data.totalBytesSt, ST_ST_QUOTA, 'st');
    var stKet;
    if(data.r2Mode==='rinci'){
      stKet='Dibaca langsung dari katalog <code>storage.objects</code> lewat <code>storage_rincian()</code>, dirinci per prefiks. '
           +'Tiga baris pertama berbagi bucket <code>file-kontrak</code>, jadi rincian ini lebih halus daripada daftar bucket di dashboard Supabase.';
    } else if(data.r2Mode==='agregat'){
      stKet='<code>storage_rincian()</code> hanya mengembalikan <b>angka gabungan</b>, '
           +'sehingga rinciannya belum bisa dipisah.';
    } else {
      stKet='Angka penyimpanan tidak terbaca \u2014 fungsi <code>storage_rincian()</code> belum dipasang atau sesi sudah berakhir. Jalankan 05_storage_usage.sql lalu Segarkan.';
    }
    h+='<div class="st-hint">'+stKet
      + ' Angkanya dihitung dari katalog saat ini juga, jadi <b>selalu mutakhir</b> \u2014 berbeda dengan angka di dashboard yang disegarkan berkala.'
      + '</div>';
    h+='<div class="st-list">';
    data.buckets.forEach(function(b){
      var pct = stDenom>0 ? Math.round((b.bytes||0)/stDenom*100) : 0;
      var extra=' <code>'+b.b+'</code>'
        + ' &middot; bucket '+(b.bk||b.b)
        + (b.agg?' <span class="st-na">gabungan</span>':'')
        + (b.legacy?' <span class="st-na">cadangan lama</span>':'')
        + (b.unbound?' <span class="st-na">binding belum dipasang</span>':'')
        + (b.missing?' <span class="st-na">tak terbaca</span>':'')
        + (b.capped?' <span class="st-na">*sebagian</span>':'');
      h+=stItem(b.l, stFmt(b.bytes), stNum(b.files)+' berkas', pct, 'st', extra);
    });
    h+='</div></div>';

    h+='<details class="ac-sql"><summary>Agar angka sama persis dengan dashboard Supabase (SQL)</summary>'
      +'<p>Jalankan sekali di SQL Editor Supabase:</p>'
      +'<pre>-- 1) ukuran seluruh database\ncreate or replace function public.db_size()\nreturns bigint language sql security definer as $$\n  select pg_database_size(current_database());\n$$;\n\n-- 2) ukuran storage per bucket\ncreate or replace function public.storage_size()\nreturns table(bucket_id text, bytes bigint, files bigint)\nlanguage sql security definer as $$\n  select bucket_id,\n         coalesce(sum((metadata-&gt;&gt;\'size\')::bigint),0)::bigint,\n         count(*)::bigint\n  from storage.objects\n  group by bucket_id;\n$$;\n\n-- 3) rincian per tabel aplikasi\ncreate or replace function public.table_sizes()\nreturns table(table_name text, total_bytes bigint)\nlanguage sql security definer as $$\n  select relname::text,\n         pg_total_relation_size(relid) as total_bytes\n  from pg_catalog.pg_statio_user_tables\n  order by total_bytes desc;\n$$;\n\ngrant execute on function public.db_size, public.storage_size, public.table_sizes to authenticated, anon;</pre>'
      +'<small>Tanpa ketiga RPC ini panel tetap berjalan, hanya angkanya jadi perkiraan.</small></details>';

    h+='<div class="st-foot"><span class="st-muted">Terakhir dipindai: '+new Date(data.ts).toLocaleTimeString('id-ID')+'</span>'
      +'<button class="btn btn-teal" id="st-refresh" type="button" onclick="stScan()">Segarkan</button></div>';

    h+='</div>';
    pane.innerHTML=h;
  }

  function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];}); }
  function escapeAttr(s){ return String(s==null?'':s).replace(/['"\\]/g,'\\$&'); }

  /* ---- Muat config awal & pasang saat DOM siap ---- */
  try{ acLoadConfig(); }catch(e){}
  try{ if(typeof currentRole!=='undefined' && currentRole){ acApplyRole(currentRole); acStartBeat(); } }catch(e){}

  window.__ac = { getConfig:acGetConfig, loadConfig:acLoadConfig, saveConfig:acSaveConfig, applyRole:acApplyRole, findAcct:acFindAcct };
})();

/* ============================================================================
   ===============  UNDUH / UNGGAH PROFIL (backup & muat otomatis)  ===========
   Menambah tombol "Unggah Profil" (kanan atas dialog Muat) + "Unduh" per profil.
   Berkas .json yang diunduh dapat diunggah kembali di instalasi mana pun; profil
   langsung DIMUAT otomatis setelah diunggah. Berlaku untuk 4 jenis profil.
   ============================================================================ */
var PROFIL_REG = {
  jadwal:   { label:'Jadwal',      doLoad:function(n){ jpProfilDoLoad(n); },    doDelete:function(n){ jpProfilDoDelete(n); },    reopen:function(){ jpProfilOpenLoad(); } },
  syarat:   { label:'Persyaratan', doLoad:function(n){ pnwProfilDoLoad(n); },   doDelete:function(n){ pnwProfilDoDelete(n); },   reopen:function(){ pnwProfilOpenLoad(); } },
  /* Klausul dipisah per bentuk dokumen (5 Agu 2026). Ketiganya memakai dialog
     yang SAMA (spkKlProfil*) — yang membedakan hanya gudang penyimpanannya,
     ditentukan spkKlKind() dari dokumen yang sedang disusun. Label di sini
     dipakai pada nama berkas unduhan & peringatan saat mengimpor profil dari
     jenis yang berbeda. */
  klausul:     { label:'Klausul SPK',       doLoad:function(n){ spkKlProfilDoLoad(n); }, doDelete:function(n){ spkKlProfilDoDelete(n); }, reopen:function(){ spkKlProfilOpenLoad(); } },
  klausul_pk:  { label:'Klausul PK',        doLoad:function(n){ spkKlProfilDoLoad(n); }, doDelete:function(n){ spkKlProfilDoDelete(n); }, reopen:function(){ spkKlProfilOpenLoad(); } },
  klausul_tor: { label:'Klausul TOR-KAK',   doLoad:function(n){ spkKlProfilDoLoad(n); }, doDelete:function(n){ spkKlProfilDoDelete(n); }, reopen:function(){ spkKlProfilOpenLoad(); } },
  penyedia: { label:'Penyedia',    doLoad:function(n){ spkPyProfilDoLoad(n); }, doDelete:function(n){ spkPyProfilDoDelete(n); }, reopen:function(){ spkPyProfilOpenLoad(); } }
};
function profilRegLabel(kind){ return (PROFIL_REG[kind] && PROFIL_REG[kind].label) || kind; }
function profilDoLoad(kind, name){ var r=PROFIL_REG[kind]; if(r&&r.doLoad) try{ r.doLoad(name); }catch(e){ console.error(e); } }
function profilDoDelete(kind, name){ var r=PROFIL_REG[kind]; if(r&&r.doDelete) try{ r.doDelete(name); }catch(e){ console.error(e); } }

/* Ikon SVG elegan (garis) untuk tombol aksi profil */
var PROFIL_LOAD_ICON  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>';
var PROFIL_TRASH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 9h13l-1 11.2A2 2 0 0 1 15.5 22h-7a2 2 0 0 1-2-1.8L5.5 9z"/><path d="M3 7.4 21 3.6"/><path d="M9.7 5.9 9.4 4.4a1 1 0 0 1 .8-1.2l3.3-.7a1 1 0 0 1 1.2.8l.3 1.5"/><path d="M10 12.5v6M14 12.5v6"/><path d="M10 11v6M14 11v6"/></svg>';
var PROFIL_DL_ICON    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>';
var PROFIL_UP_ICON    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>';

/* Tombol ikon "Unggah Profil" (kanan atas dialog Muat) */
function profilUploadBtnHtml(kind){
  return '<button type="button" class="pnw-profil-upload pf-ic-up" title="Unggah profil dari berkas" aria-label="Unggah Profil" onclick="profilUploadPrompt(\''+kind+'\')">'+PROFIL_UP_ICON+'</button>';
}
/* Tiga tombol ikon aksi per item: Muat / Hapus / Unduh */
function profilActionBtns(kind, name){
  var e=fkEscJs(name);
  return '<button type="button" class="pf-ic pf-ic-load" title="Muat profil ini" aria-label="Muat" onclick="profilDoLoad(\''+kind+'\',\''+e+'\')">'+PROFIL_LOAD_ICON+'</button>'
       + '<button type="button" class="pf-ic pf-ic-del" title="Hapus profil ini" aria-label="Hapus" onclick="profilDoDelete(\''+kind+'\',\''+e+'\')">'+PROFIL_TRASH_ICON+'</button>'
       + '<button type="button" class="pf-ic pf-ic-dl" title="Unduh profil ini ke berkas" aria-label="Unduh" onclick="profilDownloadFile(\''+kind+'\',\''+e+'\')">'+PROFIL_DL_ICON+'</button>';
}
/* (kompat lama) */
function profilDownloadBtnHtml(kind, name){
  return '<button type="button" class="pf-ic pf-ic-dl" title="Unduh profil ini ke berkas" aria-label="Unduh" onclick="profilDownloadFile(\''+kind+'\',\''+fkEscJs(name)+'\')">'+PROFIL_DL_ICON+'</button>';
}

/* Unduh SATU profil sebagai berkas .json */
function profilDownloadFile(kind, name){
  try{
    var arr = profilesGet(kind) || [];
    var p = arr.find(function(x){ return String(x.name)===String(name); });
    if(!p){ toast('Profil tidak ditemukan','warn'); return; }
    var payload = { app:'pengadaan-masohi', type:'profil', kind:kind, version:1, exportedAt:new Date().toISOString(), profile:p };
    var blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var safe = String(name).replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'_').slice(0,60) || 'profil';
    a.href=url; a.download='Profil-'+profilRegLabel(kind)+'-'+safe+'.json';
    document.body.appendChild(a); a.click();
    setTimeout(function(){ try{ URL.revokeObjectURL(url); a.remove(); }catch(e){} }, 600);
    toast('Profil "'+name+'" diunduh','ok');
  }catch(e){ console.error('profilDownloadFile:',e); toast('Gagal mengunduh profil','err'); }
}

/* Unggah berkas profil -> simpan -> MUAT OTOMATIS */
function profilUploadPrompt(kind){
  try{
    var inp=document.createElement('input');
    inp.type='file'; inp.accept='.json,application/json'; inp.style.display='none';
    document.body.appendChild(inp);
    inp.onchange=function(){
      var file=inp.files&&inp.files[0];
      if(!file){ try{inp.remove();}catch(e){} return; }
      var reader=new FileReader();
      reader.onload=async function(){
        try{
          var data=JSON.parse(String(reader.result||''));
          var prof = (data && typeof data==='object' && data.profile) ? data.profile : data;   // toleran
          var fkind = (data && data.kind) ? data.kind : kind;
          if(!prof || typeof prof!=='object'){ toast('Berkas profil tidak valid','err'); return; }
          if(fkind && fkind!==kind){
            if(!confirm('Berkas ini profil "'+profilRegLabel(fkind)+'", sedang membuka daftar "'+profilRegLabel(kind)+'". Tetap impor sebagai '+profilRegLabel(kind)+'?')) return;
          }
          if(!prof.name || !String(prof.name).trim()){ prof.name=String(file.name||'Impor').replace(/\.json$/i,''); }
          var exists=(profilesGet(kind)||[]).some(function(x){ return String(x.name).toLowerCase()===String(prof.name).toLowerCase(); });
          if(exists && !confirm('Profil "'+prof.name+'" sudah ada. Timpa dengan berkas ini?')) return;
          if(!prof.savedAt) prof.savedAt=Date.now();
          var ok=await profilesUpsert(kind, prof);
          toast('Profil "'+prof.name+'" diunggah'+(ok?'':' (lokal)')+' & dimuat','ok');
          var reg=PROFIL_REG[kind];
          if(reg && reg.doLoad){ try{ reg.doLoad(prof.name); }catch(e){ console.error('profil auto-load:',e); if(reg.reopen) try{ reg.reopen(); }catch(_){}} }
        }catch(e){ console.error('profilUpload parse:',e); toast('Berkas bukan JSON profil yang valid','err'); }
        finally{ try{inp.remove();}catch(e){} }
      };
      reader.readAsText(file);
    };
    inp.click();
  }catch(e){ console.error('profilUploadPrompt:',e); toast('Gagal membuka berkas','err'); }
}


/* =========================================================================
   TRACKING PENGADAAN (submenu Monitoring)
   -------------------------------------------------------------------------
   Timeline tahapan per pekerjaan ala pelacakan kiriman:
     Dokumen Pengadaan Diterima -> Penyusunan Dokumen HPS ->
     (tahapan sesuai Jadwal Pelaksanaan Pengadaan) -> Terkontrak / Selesai
   dengan cabang Gagal/Batal (keterangan manual) yang dapat diulang.

   Status badge OTOMATIS dari posisi tracking:
     - tahap sebelum Terkontrak/Selesai  -> "Dalam Proses"  (biru)
     - ditandai gagal                    -> "Gagal/Batal"   (merah)
     - tahap Terkontrak/Selesai tercapai -> "Terkontrak"    (hijau)

   Penyimpanan: tabel Supabase `tracking_pengadaan`
     (id uuid, nama_pekerjaan text, status text, info jsonb, created_at)
   Bila Supabase tidak tersedia, otomatis memakai localStorage.
   Keterangan tahapan jadwal juga disalin balik ke kolom `ket` pada
   jadwal_pelaksanaan (best-effort) agar tetap satu sumber kebenaran.
   ========================================================================= */
const TRK_TABLE='tracking_pengadaan';
const TRK_LS_KEY='trk_records_v1';
let records_track=[];
let trkUseLocal=false;
let trkSel='';        // nama pekerjaan terpilih
let trkOpenTrackViewSel=null; // titipan pekerjaan dari Kelola Tracking → Tracking Pengadaan (setelah Simpan)
let trkDraft=null;    // salinan info yang sedang diedit admin

function trkSupaReady(){ return !!(USE_SUPABASE && db); }
function trkLocalLoad(){ try{ const r=localStorage.getItem(TRK_LS_KEY); records_track=r?JSON.parse(r):[]; }catch(e){ records_track=[]; } }
function trkLocalSave(){ try{ localStorage.setItem(TRK_LS_KEY, JSON.stringify(records_track)); }catch(e){} }
function trkUid(){ try{ if(window.crypto&&crypto.randomUUID) return 'loc_'+crypto.randomUUID(); }catch(e){} return 'loc_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10); }

const StoreTrack={
  async list(){
    if(!trkSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(TRK_TABLE).select('*').order('created_at',{ascending:false});
    if(error) throw error; return data||[];
  },
  async create(rec){
    if(!trkSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(TRK_TABLE).insert(rec).select();
    if(error) throw error; return data&&data[0];
  },
  async update(rid, rec){
    if(!trkSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(TRK_TABLE).update(rec).eq('id',rid);
    if(error) throw error;
  }
};
async function refreshDataTrack(){
  try{ records_track=await StoreTrack.list(); trkUseLocal=false; }
  catch(err){ console.warn('Tracking: memakai penyimpanan lokal.', err&&err.message); trkLocalLoad(); trkUseLocal=true; }
}

/* ---------- Util ---------- */
function trkEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
const TRK_BLN=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
function trkTgl(iso){
  if(!iso) return '';
  const p=String(iso).split('-'); if(p.length<3) return iso;
  return Number(p[2])+' '+(TRK_BLN[Number(p[1])-1]||p[1])+' '+p[0];
}
function trkNamaKey(s){ return String(s||'').trim().toLowerCase().replace(/\s+/g,' '); }
function trkTodayISO(){ const d=new Date(); const z=n=>String(n).padStart(2,'0'); return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate()); }

/* Daftar nama pekerjaan: dari Data Pekerjaan (hanya nama), fallback nama jadwal */
function trkDpNames(){
  const out=[]; const seen={};
  (records_dp||[]).forEach(r=>{
    const s=(r&&r.state&&r.state.info)?r.state.info:{};
    const nm=String(s.nama!=null&&s.nama!==''?s.nama:(r.nama||'')).trim();
    if(nm && !seen[trkNamaKey(nm)]){ seen[trkNamaKey(nm)]=1; out.push(nm); }
  });
  (records_jadwal||[]).forEach(r=>{
    const nm=String((r.state&&r.state.namaPekerjaan)||r.nama_pekerjaan||'').trim();
    if(nm && !seen[trkNamaKey(nm)]){ seen[trkNamaKey(nm)]=1; out.push(nm); }
  });
  return out.sort((a,b)=>a.localeCompare(b,'id'));
}
function trkFindJadwal(nama){
  const k=trkNamaKey(nama);
  return (records_jadwal||[]).find(r=>trkNamaKey((r.state&&r.state.namaPekerjaan)||r.nama_pekerjaan)===k)||null;
}
function trkFindDp(nama){
  const k=trkNamaKey(nama);
  return (records_dp||[]).find(r=>{
    const s=(r&&r.state&&r.state.info)?r.state.info:{};
    return trkNamaKey(s.nama!=null&&s.nama!==''?s.nama:r.nama)===k;
  })||null;
}
function trkFindMon(nama){
  const k=trkNamaKey(nama);
  let r=(typeof records!=='undefined'?records:[]).find(x=>trkNamaKey(x.nama_pekerjaan)===k);
  if(r) return {rec:r, jenis:'SPBJ / Kontrak Rinci'};
  r=(records_pl||[]).find(x=>trkNamaKey(x.nama_pekerjaan)===k);
  if(r) return {rec:r, jenis:'Pengadaan Langsung'};
  r=(records_tender||[]).find(x=>trkNamaKey(x.nama_pekerjaan)===k);
  if(r) return {rec:r, jenis:'Tender'};
  return null;
}

/* ---------- Model info tracking ---------- */
function trkBlankInfo(){
  return { ket:{}, tgl:{}, jam:{}, aktif:'dok', penyedia:[], gagal:{aktif:false, tanggal:'', ket:''}, riwayat:[] };
}
function trkNormInfo(o){
  o=(o&&typeof o==='object')?o:{};
  const g=(o.gagal&&typeof o.gagal==='object')?o.gagal:{};
  return {
    ket:(o.ket&&typeof o.ket==='object')?o.ket:{},
    tgl:(o.tgl&&typeof o.tgl==='object')?o.tgl:{},
    jam:(o.jam&&typeof o.jam==='object')?o.jam:{},
    aktif:o.aktif||'dok',
    penyedia:Array.isArray(o.penyedia)?o.penyedia.slice():[],
    gagal:{aktif:!!g.aktif, tanggal:g.tanggal||'', ket:g.ket||''},
    riwayat:Array.isArray(o.riwayat)?o.riwayat.slice():[]
  };
}
function trkGetRec(nama){ const k=trkNamaKey(nama); return (records_track||[]).find(r=>trkNamaKey(r.nama_pekerjaan)===k)||null; }
function trkGetInfo(nama){ const r=trkGetRec(nama); return trkNormInfo(r?r.info:null); }

/* Kerangka tahapan lengkap satu pekerjaan */
function trkBuildSteps(nama){
  const steps=[
    {key:'dok', nama:'Dokumen Pengadaan Diterima', tetap:true},
    {key:'hps', nama:'Penyusunan Dokumen HPS',     tetap:true}
  ];
  const jd=trkFindJadwal(nama);
  if(jd && typeof jpRecordToState==='function'){
    const st=jpRecordToState(jd);
    (st.tahapan||[]).forEach((t,i)=>{
      steps.push({key:'j'+i, jIdx:i, nama:t.nama||('Tahapan '+(i+1)),
        awalTgl:t.awalTgl, awalJam:t.awalJam, akhirTgl:t.akhirTgl, akhirJam:t.akhirJam, ketJadwal:t.ket||''});
    });
  }else{
    steps.push({key:'j0', jIdx:0, nama:'Proses Pengadaan', tanpaJadwal:true});
  }
  steps.push({key:'fin', nama:'Terkontrak / Selesai', tetap:true});
  return {steps:steps, jadwal:jd};
}
function trkStepKet(step, info){
  if(info.ket && info.ket[step.key]!=null && info.ket[step.key]!=='') return info.ket[step.key];
  return step.ketJadwal||'';
}
function trkStepTglTxt(step){
  if(step.awalTgl && step.akhirTgl){
    if(step.awalTgl===step.akhirTgl) return trkTgl(step.awalTgl)+(step.awalJam?(', '+step.awalJam+'\u2013'+(step.akhirJam||'')):'');
    return trkTgl(step.awalTgl)+' \u2013 '+trkTgl(step.akhirTgl);
  }
  if(step.awalTgl) return trkTgl(step.awalTgl);
  return '';
}
function trkStepEndDate(s){
  if(!s || s.jIdx==null || !s.akhirTgl) return null;
  try{ if(typeof jpCombine==='function') return jpCombine(s.akhirTgl, s.akhirJam||'23:59'); }catch(e){}
  const p=String(s.akhirTgl).split('-'); const j=String(s.akhirJam||'23:59').split(':');
  return new Date(Number(p[0]),Number(p[1])-1,Number(p[2]),Number(j[0])||23,Number(j[1])||59);
}
/* SEMUA tahap selesai otomatis berdasarkan tanggal:
   - tahap jadwal: begitu tanggal/jam AKHIR jadwalnya terlewati
   - Dokumen Diterima & Penyusunan HPS: sehari SETELAH tanggal yang ditentukan admin
   - Terkontrak/Selesai: begitu tanggal Penandatanganan Kontrak/SPK tercapai */
function trkStepAutoDone(s){ const e=trkStepEndDate(s); return !!(e && e.getTime() < Date.now()); }
function trkStepDone(s, info){
  if(s && s.jIdx!=null) return trkStepAutoDone(s);
  const t=(info&&info.tgl)?info.tgl[s.key]:'';
  if(!t) return false;
  const p=String(t).split('-'); if(p.length<3) return false;
  const jamStr=(info.jam&&info.jam[s.key])?info.jam[s.key]:'';
  let d;
  if(jamStr){
    const jm=String(jamStr).split(':');
    d=new Date(Number(p[0]),Number(p[1])-1,Number(p[2]),Number(jm[0])||0,Number(jm[1])||0);
  }else if(s.key==='fin'){
    /* tanpa jam: Terkontrak tercapai begitu tanggalnya tiba (00:00 setempat) */
    d=new Date(Number(p[0]),Number(p[1])-1,Number(p[2]),0,0);
  }else{
    /* tanpa jam: Dokumen Diterima / HPS selesai saat berganti ke tanggal berikutnya */
    d=new Date(Number(p[0]),Number(p[1])-1,Number(p[2])+1,0,0);
  }
  return Date.now() >= d.getTime();
}
/* Penyelesaian BERANTAI: tahap ke-i dianggap selesai hanya bila tahap itu
   selesai DAN semua tahap sebelumnya selesai. Mencegah tahapan jadwal
   "melompati" tahap manual yang belum selesai (mis. HPS belum disahkan
   padahal tanggal Pendaftaran sudah berjalan). */
function trkDoneChain(steps, info){
  const out=[]; let ok=true;
  steps.forEach(s=>{ ok = ok && trkStepDone(s, info); out.push(ok); });
  return out;
}
function trkRealTxt(info,key){
  const t=(info.tgl&&info.tgl[key])?info.tgl[key]:''; if(!t) return '';
  const j=(info.jam&&info.jam[key])?info.jam[key]:'';
  return trkTgl(t)+(j?(' '+j):'');
}
/* Tahap jadwal "Penandatanganan Kontrak / SPK" — tempat input tanggal & jam
   penandatanganan; nilainya otomatis mengisi tahap Terkontrak/Selesai (kunci 'fin') */
function trkTtdKey(steps){
  const s=steps.find(x=>x.jIdx!=null && /(penandatanganan|tanda\s*tangan|\bspk\b)/i.test(x.nama));
  return s?s.key:null;
}
function trkUndanganKey(steps){
  const s=steps.find(x=>x.jIdx!=null && /undangan/i.test(x.nama));
  if(s) return s.key;
  const j=steps.find(x=>x.jIdx!=null);
  return j?j.key:null;
}
/* Status otomatis dari posisi tracking */
function trkStatus(info){
  if(info.gagal && info.gagal.aktif) return {kode:'gagal',   label:'Gagal/Batal',  cls:'trk-pill-gagal'};
  const finDone = trkStepDone({key:'fin'}, info) || info.aktif==='fin'; /* aktif==='fin' = kompatibilitas data lama */
  if(finDone)                        return {kode:'kontrak', label:'Terkontrak',   cls:'trk-pill-kontrak'};
  return                                    {kode:'proses',  label:'Dalam Proses', cls:'trk-pill-proses'};
}
function trkStepIndex(steps,key){ const i=steps.findIndex(s=>s.key===key); return i<0?0:i; }
function trkStepNama(steps,key){ const s=steps.find(x=>x.key===key); return s?s.nama:key; }

/* ---------- Halaman PENGGUNA ---------- */
function openTrackView(){
  /* Masuk dari menu = selalu mulai dari keadaan awal "— pilih pekerjaan —".
     Pengecualian: trkOpenTrackViewSel diisi oleh trkSave() agar sesudah
     Simpan Tracking halaman ini langsung membuka pekerjaan yang baru disimpan. */
  if(trkOpenTrackViewSel!=null){ trkSel=trkOpenTrackViewSel; trkOpenTrackViewSel=null; }
  else { trkSel=''; }
  trkDraft=null;
  showView('track-view');
  const jobs=[];
  if(typeof refreshDataDp==='function') jobs.push(refreshDataDp());
  if(typeof refreshDataJadwal==='function') jobs.push(refreshDataJadwal());
  jobs.push(refreshDataTrack());
  Promise.all(jobs).then(()=>{ const v=document.querySelector('.view.active'); if(v&&v.id==='view-track-view') renderTrackView(); });
}
/* Isi dropdown "Pilih Pekerjaan".

   DUA HALAMAN memakai fungsi ini dengan kebutuhan yang BERBEDA:
     Kelola Tracking (admin)  -> SELURUH nama pekerjaan dari Dokumen Pengadaan
                                 & Jadwal. Harus lengkap, sebab di sinilah
                                 tracking sebuah pekerjaan pertama kali dibuat.
     Tracking Pengadaan (user)-> HANYA pekerjaan yang trackingnya SUDAH
                                 DISIMPAN (ketentuan 6 Agu 2026). Sebelumnya
                                 daftarnya sama dengan halaman admin, sehingga
                                 pemakai bisa memilih pekerjaan yang belum
                                 punya data tracking dan disambut halaman
                                 kosong tanpa penjelasan.

   `tersimpanSaja` yang membedakan keduanya. Penyaringnya trkGetRec() — fungsi
   yang sama yang dipakai halaman ini untuk membaca datanya — jadi tidak
   mungkin ada nama yang lolos ke daftar tetapi datanya ternyata tidak ada. */
function trkFillPick(id, tersimpanSaja){
  const el=document.getElementById(id); if(!el) return;
  const cur=trkSel;
  let nama=trkDpNames();
  if(tersimpanSaja) nama=nama.filter(nm=>!!trkGetRec(nm));
  /* Pilihan yang sedang aktif tetapi TIDAK ada lagi di daftar (mis. trackingnya
     baru dihapus) dilepas, supaya kotaknya tidak menampilkan nama yang isinya
     sudah tiada. */
  if(cur && !nama.some(nm=>trkNamaKey(nm)===trkNamaKey(cur))) trkSel='';
  let h='<option value="">'+(
      (tersimpanSaja && !nama.length)
        ? '\u2014 belum ada tracking tersimpan \u2014'
        : '\u2014 pilih pekerjaan \u2014')+'</option>';
  nama.forEach(nm=>{ h+='<option value="'+trkEsc(nm)+'"'+(trkNamaKey(nm)===trkNamaKey(trkSel)?' selected':'')+'>'+trkEsc(nm)+'</option>'; });
  el.innerHTML=h;
}
function trkPick(v){ trkSel=v||''; renderTrackUser(); }
function renderTrackView(){
  /* true = hanya pekerjaan yang trackingnya sudah disimpan di Kelola Tracking. */
  trkFillPick('trk-pick', true);
  renderTrackUser();
}
function trkHeadHtml(nama, info){
  const st=trkStatus(info);
  const mon=trkFindMon(nama);
  const meta=[];
  if(mon){ meta.push(mon.jenis); if(mon.rec.bidang_pelaksana) meta.push(mon.rec.bidang_pelaksana); }
  else{
    const dp=trkFindDp(nama);
    if(dp){ const s=(dp.state&&dp.state.info)||{}; if(s.metode) meta.push(s.metode); if(s.bidang_pelaksana) meta.push(s.bidang_pelaksana); }
  }
  return '<div class="trk-head">'
    +'<div><p class="trk-head-nama">'+trkEsc(nama)+'</p>'
    +(meta.length?'<p class="trk-head-meta">'+trkEsc(meta.join(' - '))+'</p>':'')
    +'</div><span class="trk-pill '+st.cls+'">'+st.label+'</span></div>';
}
function trkItemHtml(o){
  /* o: {st:'done|now|wait|fail|redo', nama, sub, ket, chips:[], last} */
  const ic={done:'<path d="M20 6 9 17l-5-5"/>', now:'<path d="M6 4l14 8-14 8Z"/>', fail:'<path d="M18 6 6 18M6 6l12 12"/>', redo:'<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'}[o.st]||'';
  let h='<div class="trk-item trk-'+o.st+'">'
    +'<div class="trk-railcol"><span class="trk-dot">'+(ic?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">'+ic+'</svg>':'')+'</span>'
    +(o.last?'':'<span class="trk-rail"></span>')+'</div>'
    +'<div class="trk-body">'
    +'<p class="trk-nm">'+trkEsc(o.nama)+'</p>'
    +(o.sub?'<p class="trk-sub">'+trkEsc(o.sub)+'</p>':'')
    /* Keterangan tampil sebagai teks miring biasa tepat di bawah jadwal tahapan.
       Tidak ada kotak/ikon, dan bila keterangan kosong tidak muncul apa pun. */
    +(o.ket?'<p class="trk-note">'+trkEsc(o.ket)+'</p>':'');
  if(o.chips && o.chips.length){
    h+='<div class="trk-chips"><span class="trk-chip trk-chip-count">'+o.chips.length+' penyedia diundang</span>';
    o.chips.forEach(c=>{ h+='<span class="trk-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/></svg>'+trkEsc(c)+'</span>'; });
    h+='</div>';
  }
  return h+'</div></div>';
}
function renderTrackUser(){
  const box=document.getElementById('trk-user'); if(!box) return;
  if(!trkSel){
    box.innerHTML='<div class="trk-card trk-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H12"/></svg>'
      +'<p>Pilih pekerjaan di atas untuk melihat tracking pengadaannya.</p></div>';
    return;
  }
  const {steps}=trkBuildSteps(trkSel);
  const info=trkGetInfo(trkSel);
  const stat=trkStatus(info);
  const aktifIdx=trkStepIndex(steps, info.aktif);
  const undKey=trkUndanganKey(steps);
  const ttdKey=trkTtdKey(steps);
  /* posisi efektif: tahap pertama yang belum selesai (tanda admin ATAU otomatis lewat tanggal) */
  const finOk = trkStatus(info).kode==='kontrak';
  const chain=trkDoneChain(steps, info);
  let trkFirstOpen=-1;
  steps.forEach((s,i)=>{ if(trkFirstOpen<0 && !chain[i]) trkFirstOpen=i; });
  if(trkFirstOpen<0) trkFirstOpen=steps.length-1;
  /* ada tahapan jadwal yang tanggalnya sudah berjalan/terlewati? (deteksi keterlambatan) */
  const adaJadwalLewat = steps.some(x=>x.jIdx!=null && trkStepAutoDone(x));
  const items=[];
  steps.forEach((s,i)=>{
    /* sisipkan riwayat gagal + pengadaan ulang tepat sebelum tahap tujuan pengulangan */
    (info.riwayat||[]).forEach(r=>{
      if(r.ulangDari===s.key){
        items.push({st:'fail', nama:'Pengadaan Gagal/Batal'+(r.tanggal?(' \u00b7 '+trkTgl(r.tanggal)):''), ket:r.ket||''});
        items.push({st:'redo', nama:'Pengadaan ulang dimulai', sub:'Mengulang dari: '+trkStepNama(steps,r.ulangDari)+((r.jadwalLama&&r.jadwalLama.length)?' \u00b7 jadwal siklus sebelumnya diarsipkan':'')});
      }
    });
    const dn = chain[i] || finOk;
    let st;
    if(info.gagal.aktif) st = dn ? 'done' : 'wait';
    else st = dn ? 'done' : (i===trkFirstOpen ? 'now' : 'wait');
    const real=trkRealTxt(info,(ttdKey&&s.key===ttdKey)?'fin':s.key);
    const jdw=trkStepTglTxt(s);
    let sub;
    if(st==='done')      sub='Selesai'+(real?(' \u00b7 '+real):(jdw?(' \u00b7 '+jdw):''));
    else if(st==='now')  sub='Sedang berjalan'+(jdw?(' \u00b7 jadwal '+jdw):'')+(real?(' \u00b7 selesai otomatis '+real):'');
    else                 sub='Menunggu'+(real?(' \u00b7 selesai otomatis '+real):(jdw?(' \u00b7 jadwal '+jdw):''));
    const o={st:st, nama:s.nama, sub:sub, ket:trkStepKet(s,info)};
    if(s.tanpaJadwal) o.sub+=' \u00b7 jadwal belum ditentukan';
    if(st==='now' && s.jIdx==null && s.key!=='fin' && adaJadwalLewat) o.sub+=' \u00b7 terlambat dari jadwal';
    if(st==='wait' && s.jIdx!=null && trkStepAutoDone(s)) o.sub='Menunggu tahap sebelumnya selesai'+(jdw?(' \u00b7 jadwal '+jdw+' terlewati'):'');
    if(s.key===undKey && info.penyedia.length) o.chips=info.penyedia;
    if(s.key==='fin' && st==='done'){ o.sub='Terkontrak'+(real?(' \u00b7 ditandatangani '+real):''); }
    else if(s.key==='fin' && st==='now'){ o.sub=real?('Menunggu tanggal Penandatanganan Kontrak/SPK: '+trkTgl(real)):'Menunggu tanggal Penandatanganan Kontrak/SPK ditentukan'; }
    else if(s.key==='fin'){ o.sub='Menunggu \u00b7 tahap penutup'; }
    items.push(o);
  });
  if(info.gagal.aktif){
    items.push({st:'fail', nama:'Pengadaan Gagal/Batal'+(info.gagal.tanggal?(' \u00b7 '+trkTgl(info.gagal.tanggal)):''), ket:info.gagal.ket||''});
  }
  items.forEach((o,i)=>{ o.last=(i===items.length-1); });
  let h='<div class="trk-card">'+trkHeadHtml(trkSel, info)+'<div class="trk-timeline">';
  items.forEach(o=>{ h+=trkItemHtml(o); });
  h+='</div>';
  if(trkUseLocal) h+='<p class="trk-localnote">Data tracking tersimpan lokal di perangkat ini (Supabase tidak tersedia).</p>';
  h+='</div>';
  box.innerHTML=h;
}

/* ---------- Halaman ADMIN (Kelola Tracking) ---------- */
function openTrackKelola(){
  /* Kelola Tracking mengubah data → hanya admin. Tombolnya memang sudah
     data-role="admin", penjaga ini mencegah akses lewat jalur lain (mis. konsol
     atau pemulihan sesi) oleh akun Tamu/User. */
  if(typeof isAdmin==='function' && !isAdmin()){ if(typeof toast==='function') toast('Menu ini hanya untuk akun admin','warn'); return; }
  showView('track-kelola');
  const jobs=[];
  if(typeof refreshDataDp==='function') jobs.push(refreshDataDp());
  if(typeof refreshDataJadwal==='function') jobs.push(refreshDataJadwal());
  jobs.push(refreshDataTrack());
  Promise.all(jobs).then(()=>{ const v=document.querySelector('.view.active'); if(v&&v.id==='view-track-kelola') renderTrackKelola(); });
}
function trkAdmPick(v){ trkSel=v||''; trkDraft=null; renderTrackKelola(); }
function trkDraftEnsure(){ if(!trkDraft) trkDraft=trkGetInfo(trkSel); return trkDraft; }
function trkSetKet(key,val){ trkDraftEnsure().ket[key]=val; }
function trkSetTgl(key,val){ trkDraftEnsure().tgl[key]=val; }
function trkSetJam(key,val){ trkDraftEnsure().jam[key]=val; }
function trkSetAktif(key){ trkDraftEnsure().aktif=key; trkAdmPill(); }
function trkAdmPill(){
  const el=document.getElementById('trk-adm-pill'); if(!el) return;
  const st=trkStatus(trkDraftEnsure());
  el.className='trk-pill '+st.cls; el.textContent=st.label;
}
function trkGagalToggle(on){
  const d=trkDraftEnsure();
  d.gagal.aktif=!!on;
  if(on && !d.gagal.tanggal) d.gagal.tanggal=trkTodayISO();
  renderTrackKelola(true);
}
function trkGagalField(k,v){ trkDraftEnsure().gagal[k]=v; }
function trkPvAdd(){
  const inp=document.getElementById('trk-pv-new'); if(!inp) return;
  const v=String(inp.value||'').trim(); if(!v) return;
  const d=trkDraftEnsure();
  if(d.penyedia.some(p=>trkNamaKey(p)===trkNamaKey(v))){ toast('Penyedia sudah ada di daftar','warn'); return; }
  d.penyedia.push(v); inp.value='';
  trkPvRender();
}
function trkPvDel(i){ trkDraftEnsure().penyedia.splice(i,1); trkPvRender(); }
function trkPvRender(){
  const wrap=document.getElementById('trk-pv-wrap'); if(!wrap) return;
  const d=trkDraftEnsure();
  let h='<span class="trk-chip trk-chip-count">'+d.penyedia.length+' penyedia</span>';
  d.penyedia.forEach((p,i)=>{
    h+='<span class="trk-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/></svg>'+trkEsc(p)
      +'<button type="button" class="trk-chip-x" title="Hapus" onclick="trkPvDel('+i+')">&times;</button></span>';
  });
  wrap.innerHTML=h;
}
function trkMulaiUlang(){
  const d=trkDraftEnsure();
  if(!d.gagal.aktif){ toast('Tandai Gagal/Batal terlebih dahulu','warn'); return; }
  const sel=document.getElementById('trk-ulang-dari');
  const dari=sel?sel.value:'';
  if(!dari){ toast('Pilih tahap awal pengulangan','warn'); return; }
  /* arsipkan tanggal-tanggal jadwal siklus lama agar riwayat tetap utuh
     walau admin menyusun jadwal baru dengan nama pekerjaan yang sama */
  const bs=trkBuildSteps(trkSel);
  const jadwalLama=bs.steps.filter(s=>s.jIdx!=null && !s.tanpaJadwal).map(s=>({nama:s.nama, awalTgl:s.awalTgl||'', akhirTgl:s.akhirTgl||''}));
  d.riwayat.push({tanggal:d.gagal.tanggal||trkTodayISO(), ket:d.gagal.ket||'', ulangDari:dari, jadwalLama:jadwalLama});
  d.gagal={aktif:false, tanggal:'', ket:''};
  /* kosongkan tanggal manual mulai dari titik pengulangan agar siklus baru
     tidak langsung dianggap selesai oleh tanggal siklus lama */
  d.tgl=d.tgl||{};
  if(dari==='dok'){ delete d.tgl.dok; delete d.tgl.hps; }
  if(dari==='dok'||dari==='hps'){ delete d.tgl.hps; }
  delete d.tgl.fin;
  toast('Pengadaan ulang dimulai dari: '+trkStepNama(trkBuildSteps(trkSel).steps,dari),'ok');
  toast('Perbarui tanggal tahapan di Jadwal Pelaksanaan Pengadaan untuk siklus ulang','warn',5200);
  renderTrackKelola(true);
}
/* Buka halaman Tentukan Jadwal untuk menyusun jadwal siklus ulang;
   nama pekerjaan otomatis terisi sama agar tracking langsung tersambung
   (tracking selalu memakai jadwal TERBARU dengan nama pekerjaan sama). */
function trkSusunJadwalUlang(){
  const nama=trkSel; if(!nama){ toast('Pilih pekerjaan terlebih dahulu','warn'); return; }
  if(typeof openJadwalKerja!=='function'){ toast('Halaman Tentukan Jadwal tidak tersedia','warn'); return; }
  openJadwalKerja();
  /* Tunggu sampai halaman Tentukan Jadwal benar-benar aktif (openJadwalKerja
     me-reset jpState secara async), BARU pasang nama pekerjaan — mencegah
     nama tertimpa oleh reset "input baru". */
  let n=0; const t=setInterval(function(){
    n++;
    const v=document.querySelector('.view.active');
    if(v && v.id==='view-jadwal-kerja' && typeof jpState!=='undefined' && jpState){
      jpState.namaPekerjaan=nama;
      if(typeof renderJadwalKerja==='function') renderJadwalKerja();
      clearInterval(t);
      toast('Susun jadwal siklus ulang untuk: '+nama,'ok');
      return;
    }
    if(n>60) clearInterval(t);
  },150);
}
/* Tombol Batal → buang perubahan yang belum disimpan, kembali ke Tracking
   Pengadaan. Konfirmasinya TIDAK ditulis di sini: penyadap klik terpusat di
   app.js sudah memunculkan modal "Batalkan Proses?" sebelum fungsi ini jalan,
   sama seperti tombol Batal di halaman lain. */
function trkBatal(){
  trkDraft=null;
  trkOpenTrackViewSel=null;
  if(typeof openTrackView==='function') openTrackView(); else showView('track-view');
}
async function trkSave(){
  if(!trkSel){ toast('Pilih pekerjaan terlebih dahulu','warn'); return; }
  const d=trkDraftEnsure();
  const {steps,jadwal}=trkBuildSteps(trkSel);
  const status=trkStatus(d).label;
  const payload={ nama_pekerjaan:trkSel, status:status, info:d };
  const ada=trkGetRec(trkSel);
  try{
    if(trkUseLocal) throw new Error('mode lokal');
    if(ada && !String(ada.id).startsWith('loc_')) await StoreTrack.update(ada.id, payload);
    else{ const created=await StoreTrack.create(payload); if(created){ records_track.unshift(created); } }
    if(ada && !String(ada.id).startsWith('loc_')) Object.assign(ada, payload);
    toast('Tracking tersimpan','ok');
  }catch(err){
    /* fallback lokal agar pekerjaan admin tidak hilang */
    trkUseLocal=true;
    if(ada){ Object.assign(ada, payload); }
    else records_track.unshift(Object.assign({id:trkUid(), created_at:new Date().toISOString()}, payload));
    trkLocalSave();
    toast('Tersimpan lokal (Supabase tidak tersedia)','warn');
  }
  /* salin keterangan tahap jadwal balik ke jadwal_pelaksanaan (best-effort) */
  try{
    if(jadwal && typeof jpRecordToState==='function' && typeof StoreJadwal!=='undefined'){
      const st=jpRecordToState(jadwal);
      let ubah=false;
      steps.forEach(s=>{
        if(s.jIdx!=null && st.tahapan[s.jIdx] && d.ket[s.key]!=null && d.ket[s.key]!==st.tahapan[s.jIdx].ket){
          st.tahapan[s.jIdx].ket=d.ket[s.key]; ubah=true;
        }
      });
      if(ubah && !String(jadwal.id).startsWith('loc_')){
        const ns=Object.assign({}, jadwal.state&&typeof jadwal.state==='object'?jadwal.state:{}, st);
        await StoreJadwal.update(jadwal.id,{state:ns});
        jadwal.state=ns;
      }
    }
  }catch(e){ console.warn('Sinkron keterangan ke jadwal dilewati:', e&&e.message); }
  /* Sesudah Simpan → langsung diarahkan ke Tracking Pengadaan dengan
     pekerjaan yang barusan disimpan sudah terpilih. */
  trkOpenTrackViewSel=trkSel;
  trkDraft=null;
  if(typeof openTrackView==='function') openTrackView();
}
function trkAdmRow(s, info, undKey, ttdKey){
  const no=s.__no;
  const tgl=trkStepTglTxt(s);
  const stTxt = s.__st==='done' ? '\u2713 Selesai' : (s.__st==='now' ? '\u25cf Berjalan' : 'Menunggu');
  const isTtd = ttdKey && s.key===ttdKey;
  let src=s.tetap?(s.key==='dok'?'tahap tetap \u00b7 titik awal':(s.key==='hps'?'tahap tetap':'tahap penutup \u00b7 badge hijau otomatis')):(s.tanpaJadwal?'jadwal belum ditentukan':'dari jadwal');
  if(isTtd) src+=' \u00b7 input tanggal & jam penandatanganan';
  if(s.jIdx!=null && !s.tanpaJadwal && !isTtd && trkStepAutoDone(s)) src+=' \u00b7 \u2713 selesai otomatis (tanggal terlewati)';
  let h='<div class="trk-arow'+(s.__st==='now'?' trk-arow-on':'')+'">'
    +'<div class="trk-arow-top"><p class="trk-arow-t">'+no+' \u00b7 '+trkEsc(s.nama)
    +' <span class="trk-arow-src">'+trkEsc(tgl?tgl+' \u00b7 '+src:src)+'</span></p>'
    +'<span class="trk-stchip trk-stchip-'+s.__st+'">'+stTxt+'</span></div>';
  if(s.key==='fin' && ttdKey){
    /* Terkontrak/Selesai: otomatis dari tanggal & jam Penandatanganan Kontrak/SPK */
    const isi=trkRealTxt(info,'fin');
    h+='<input class="trk-in" placeholder="Tulis keterangan tahap ini\u2026" value="'+trkEsc(trkStepKet(s,info))+'" oninput="trkSetKet(\''+s.key+'\',this.value)">'
      +(isi?('<p class="trk-tgl-note">Penandatanganan: <b>'+trkEsc(isi)+'</b></p>'):'');
  }else if(s.jIdx!=null && !s.tanpaJadwal && !isTtd){
    /* tahap jadwal biasa: tanggal otomatis, tidak ada input tanggal */
    h+='<input class="trk-in" placeholder="Tulis keterangan tahap ini\u2026" value="'+trkEsc(trkStepKet(s,info))+'" oninput="trkSetKet(\''+s.key+'\',this.value)">'
      ;
  }else{
    /* tahap dengan input tanggal & jam: dok, hps, TTD (kunci 'fin'), atau fin fallback */
    const tKey = isTtd ? 'fin' : s.key;
    h+='<div class="trk-arow-grid">'
      +'<div><input class="trk-in" placeholder="Tulis keterangan tahap ini\u2026" value="'+trkEsc(trkStepKet(s,info))+'" oninput="trkSetKet(\''+s.key+'\',this.value)"></div>'
      +'<div><div class="trk-tj"><input type="date" class="trk-in" title="Tanggal" value="'+trkEsc(info.tgl&&info.tgl[tKey]?info.tgl[tKey]:'')+'" onchange="trkSetTgl(\''+tKey+'\',this.value)">'
      +'<input type="time" class="trk-in trk-in-jam" title="Jam (waktu setempat)" value="'+trkEsc(info.jam&&info.jam[tKey]?info.jam[tKey]:'')+'" onchange="trkSetJam(\''+tKey+'\',this.value)"></div>'
      +'</div>'
      +'</div>';
  }
  if(s.key===undKey){
    h+='<p class="trk-alab">Penyedia yang diundang</p>'
      +'<div class="trk-chips" id="trk-pv-wrap"></div>'
      +'<div class="trk-pv-add"><input id="trk-pv-new" class="trk-in" placeholder="Nama penyedia baru" onkeydown="if(event.key===\'Enter\'){event.preventDefault();trkPvAdd();}">'
      +'<button type="button" class="trk-btn trk-btn-teal" onclick="trkPvAdd()">+ Tambah</button></div>';
  }
  return h+'</div>';
}
function renderTrackKelola(keep){
  const box=document.getElementById('trk-admin'); if(!box) return;
  if(!keep) trkDraft=null;
  let h='<div class="trk-card">'
    +'<div class="trk-adm-grid"><div>'
    +'<label class="trk-label" for="trk-adm-pick">Pekerjaan (dari Data Pekerjaan)</label>'
    +'<select id="trk-adm-pick" class="trk-select" onchange="trkAdmPick(this.value)"></select>'
    +'</div><div class="trk-adm-stat"><label class="trk-label">Status pengadaan (otomatis)</label>'
    +'<span id="trk-adm-pill" class="trk-pill trk-pill-proses">Dalam Proses</span></div></div>';
  if(!trkSel){
    h+='<p class="trk-hint">Pilih pekerjaan untuk memuat tahapannya.</p></div>';
    box.innerHTML=h;
    trkFillPick('trk-adm-pick');
    return;
  }
  const d=trkDraftEnsure();
  const {steps,jadwal}=trkBuildSteps(trkSel);
  steps.forEach((s,i)=>{ s.__no=i+1; });
  const admChain=trkDoneChain(steps, d);
  let admOpen=-1;
  steps.forEach((s,i)=>{ if(admOpen<0 && !admChain[i]) admOpen=i; });
  if(admOpen<0) admOpen=steps.length-1;
  const admFin = trkStatus(d).kode==='kontrak';
  steps.forEach((s,i)=>{ s.__st = (admChain[i]||admFin) ? 'done' : (i===admOpen ? 'now' : 'wait'); });
  const undKey=trkUndanganKey(steps);
  const ttdKey=trkTtdKey(steps);
  const nJ=steps.filter(s=>s.jIdx!=null).length;
  if(!jadwal) h+='<p class="trk-hint">Pekerjaan ini belum memiliki jadwal di Jadwal Pelaksanaan Pengadaan.</p>';
  h+='</div>';

  h+='<div class="trk-card"><p class="trk-card-t">Keterangan per tahapan</p>';
  steps.forEach(s=>{ h+=trkAdmRow(s,d,undKey,ttdKey); });
  h+='</div>';

  const gOn=d.gagal.aktif;
  h+='<div class="trk-card trk-gcard'+(gOn?' trk-gcard-on':'')+'">'
    +'<div class="trk-gtop"><p class="trk-card-t trk-gt"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg> Panel Gagal/Batal</p>'
    +'<label class="trk-radio"><input type="checkbox" '+(gOn?'checked':'')+' onchange="trkGagalToggle(this.checked)"><span>Tandai pengadaan ini Gagal/Batal</span></label></div>'
    +'<div class="trk-adm-grid">'
    +'<div><label class="trk-alab">Keterangan gagal (ditulis sendiri)</label>'
    +'<input class="trk-in" '+(gOn?'':'disabled ')+'placeholder="Contoh: hanya 1 penawaran masuk dan harga di atas HPS\u2026" value="'+trkEsc(d.gagal.ket)+'" oninput="trkGagalField(\'ket\',this.value)"></div>'
    +'<div><label class="trk-alab">Tanggal gagal/batal</label>'
    +'<input type="date" class="trk-in" '+(gOn?'':'disabled ')+'value="'+trkEsc(d.gagal.tanggal)+'" onchange="trkGagalField(\'tanggal\',this.value)"></div>'
    +'</div>';
  h+='<div class="trk-ulang"><label class="trk-alab">Mengulang dari tahap</label>'
    +'<div class="trk-pv-add"><select id="trk-ulang-dari" class="trk-select"'+(gOn?'':' disabled')+'>';
  steps.forEach(s=>{ if(s.key!=='fin') h+='<option value="'+s.key+'">'+trkEsc(s.__no+' \u00b7 '+s.nama)+'</option>'; });
  h+='</select><button type="button" class="trk-btn trk-btn-amber" '+(gOn?'':'disabled ')+'onclick="trkMulaiUlang()">\u21bb Mulai Pengadaan Ulang</button>'
    +'<button type="button" class="trk-btn trk-btn-ghost" onclick="trkSusunJadwalUlang()">+ Susun Jadwal Ulang</button></div>'
    +'</div>';
  if(d.riwayat.length){
    h+='<p class="trk-alab" style="margin-top:12px">Riwayat gagal sebelumnya</p>';
    d.riwayat.forEach((r,i)=>{
      h+='<p class="trk-hist">\u2716 '+trkEsc(trkTgl(r.tanggal)||'-')+' \u2014 '+trkEsc(r.ket||'(tanpa keterangan)')+' \u00b7 diulang dari '+trkEsc(trkStepNama(steps,r.ulangDari))+'</p>';
    });
  }
  h+='</div>';

  /* Tombol Batal & Simpan memakai kelas baku .btn-red / .btn-green beserta
     ikonnya, sama seperti di form lain. Dengan begitu penyadap klik terpusat di
     app.js ikut menangkapnya, sehingga popup "Batalkan Proses?" / "Simpan
     Perubahan?" yang muncul persis sama dengan halaman lain. */
  h+='<div class="trk-actions">'
    +'<button type="button" class="btn btn-red" onclick="trkBatal()">'
    +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>'
    +'<span>Batal</span></button>'
    +'<button type="button" class="btn btn-green" onclick="trkSave()">'
    +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>'
    +'<span>Simpan</span></button>'
    +'</div>';

  box.innerHTML=h;
  trkFillPick('trk-adm-pick');
  trkPvRender();
  trkAdmPill();
}


/* ============================================================================
   RIWAYAT NAVIGASI — tombol Back/Forward Chrome mengikuti perpindahan menu
   Ditambahkan 1 Agustus 2026. Blok ini berdiri sendiri dan tidak mengubah
   fungsi mana pun di atasnya; ia hanya membungkus showView() milik app.js.
   ============================================================================ */
(function () {
  'use strict';

  if (typeof window.showView !== 'function') {
    console.warn('nav-history: showView belum ada, modul dilewati');
    return;
  }

  /* Halaman yang layak masuk riwayat. Halaman form / input sengaja
     TIDAK didaftarkan: saat pengguna menekan Back dari sebuah form,
     yang diharapkan adalah kembali ke daftar/menu sebelumnya, bukan
     ke form kosong tanpa konteks data. */
  var MENU_VIEWS = [
    'dashboard',
    'list', 'list-pl', 'list-tender',
    'pn-lihat',
    'fk-view', 'fkl-view', 'pnw-view', 'rho-view', 'dp-view',
    'hps-view', 'analisa-view', 'rekap-hps',
    'jadwal-view', 'track-view',
    'spk-view', 'dpeng-view', 'materi-view'
  ];

  var _showView = window.showView;
  var replaying = false;   // true saat perpindahan dipicu tombol Back/Forward

  window.showView = function (name) {
    _showView.apply(this, arguments);

    if (replaying) return;
    if (MENU_VIEWS.indexOf(name) === -1) return;

    var st = history.state;
    if (st && st.monView === name) return;   // sudah di entri yang sama

    try {
      if (st && st.monView) {
        history.pushState({ monView: name }, '', '#' + name);
      } else {
        /* Entri pertama setelah masuk aplikasi: pakai replaceState supaya
           Back dari Dashboard langsung keluar situs seperti biasa, tidak
           tersangkut di entri kosong. */
        history.replaceState({ monView: name }, '', '#' + name);
      }
    } catch (err) {
      console.warn('nav-history: gagal menulis riwayat', err);
    }
  };

  window.addEventListener('popstate', function (e) {
    var v = e.state && e.state.monView;
    if (!v) return;                                   // biarkan browser keluar
    if (!document.getElementById('view-' + v)) return;

    replaying = true;
    try {
      _showView(v, null, true);                       // noLoader: tanpa animasi
    } catch (err) {
      console.error('nav-history: gagal memulihkan halaman', err);
    } finally {
      replaying = false;
    }
  });

  /* Saat aplikasi dimuat ulang, sesi dipulihkan dari sessionStorage.
     Hash sisa dari kunjungan sebelumnya dibiarkan — showView pertama
     akan menimpanya lewat replaceState di atas. */
})();


/* ============================================================================
   PETUNJUK TOMBOL AKSI (Ubah / Lihat / Hapus)                     — 8 Agu 2026
   ----------------------------------------------------------------------------
   Sebelumnya tombol aksi hanya mengandalkan atribut `title` bawaan peramban:
   muncul lambat (±1 detik), berwarna kuning sistem, dan letaknya mengikuti
   kursor — tidak nyambung dengan tampilan aplikasi.

   Modul ini menggantinya dengan satu balon petunjuk milik aplikasi sendiri.
   Tiga hal yang perlu diketahui bila kelak diubah:

   1) SATU ELEMEN UNTUK SELURUH APLIKASI, ditempel ke <body>.
      Bukan `::after` pada tombolnya. Alasannya: tombol aksi berada di dalam
      .table-wrap yang ber-`overflow:auto` — balon berbasis pseudo-element akan
      TERPOTONG oleh tepi penggulir itu, terutama pada baris terakhir tabel.
      Elemen `position:fixed` di luar tabel tidak pernah terpotong.

   2) `title` DIPINDAH ke `data-tip` saat tombol pertama kali disorot.
      Kalau `title` dibiarkan, petunjuk bawaan peramban tetap ikut muncul dan
      terlihat dua balon bertumpuk. Nilainya disalin ke `aria-label` lebih dulu
      supaya nama tombol tetap terbaca pembaca layar.

   3) PEMBAKUAN TEKS (permintaan user): "Ubah"/"Edit" -> "Ubah Data",
      "Lihat" -> "Lihat Data", "Hapus" -> "Hapus Data". Judul yang SUDAH
      spesifik ("Hapus berkas", "Lihat Dokumen", "Ubah akun", "Hapus Nomor",
      "Ganti berkas", ...) SENGAJA dibiarkan apa adanya — di sana kata
      tambahannya justru keterangan yang dibutuhkan.

   Baris tabel dirender ulang berkali-kali (innerHTML diganti), jadi pemasangan
   dilakukan lewat DELEGASI di document — bukan pendengar per tombol, yang akan
   hilang setiap kali daftarnya digambar ulang.
   ========================================================================== */
(function () {
  'use strict';

  var SEL = 'button.act, button.fk-act-icon';
  var JEDA = 110;          // ms sebelum balon muncul — cegah kedip saat kursor lewat
  var BAKU = {
    'ubah': 'Ubah Data', 'edit': 'Ubah Data', 'ubah data': 'Ubah Data',
    'lihat': 'Lihat Data', 'lihat data': 'Lihat Data',
    'hapus': 'Hapus Data', 'hapus data': 'Hapus Data'
  };

  var balon = null, aktif = null, timer = 0;

  function el() {
    if (!balon) {
      balon = document.createElement('div');
      balon.className = 'act-tip';
      balon.id = 'act-tip';
      balon.setAttribute('role', 'tooltip');
      document.body.appendChild(balon);
    }
    return balon;
  }

  function teks(b) {
    var t = b.getAttribute('data-tip');
    if (t !== null) return t;
    var asli = (b.getAttribute('title') || b.getAttribute('aria-label') || '').trim();
    var hasil = BAKU[asli.toLowerCase()] || asli;
    b.setAttribute('data-tip', hasil);
    if (hasil && !b.getAttribute('aria-label')) b.setAttribute('aria-label', hasil);
    if (b.hasAttribute('title')) b.removeAttribute('title');
    return hasil;
  }

  function sembunyi() {
    if (timer) { clearTimeout(timer); timer = 0; }
    aktif = null;
    if (balon) balon.classList.remove('tampil');
  }

  function tampil(b) {
    var isi = teks(b);
    if (!isi) return;
    var t = el();
    t.textContent = isi;
    t.classList.remove('atas');
    /* Diukur dalam keadaan masih transparan: `visibility:hidden` membuat
       offsetWidth = 0, jadi kelas .tampil dipasang lebih dulu. */
    t.classList.add('tampil');
    t.style.left = '0px'; t.style.top = '0px';

    var r = b.getBoundingClientRect();
    var lb = t.offsetWidth, tg = t.offsetHeight;
    var vw = document.documentElement.clientWidth;
    var vh = document.documentElement.clientHeight;

    var x = r.left + r.width / 2 - lb / 2;
    if (x < 6) x = 6;
    if (x + lb > vw - 6) x = vw - 6 - lb;

    var y = r.bottom + 9;                       // di bawah tombol
    if (y + tg > vh - 6) {                      // tidak muat -> pindah ke atas
      y = r.top - tg - 9;
      t.classList.add('atas');
    }
    if (y < 6) y = 6;

    t.style.left = Math.round(x) + 'px';
    t.style.top = Math.round(y) + 'px';
    /* Anak panah menunjuk TENGAH TOMBOL, bukan tengah balon: keduanya berbeda
       setiap kali balon digeser supaya tidak keluar layar. */
    var ax = r.left + r.width / 2 - x;
    if (ax < 12) ax = 12;
    if (ax > lb - 12) ax = lb - 12;
    t.style.setProperty('--ax', Math.round(ax) + 'px');
  }

  function masuk(e) {
    var b = e.target && e.target.closest ? e.target.closest(SEL) : null;
    if (!b || b === aktif) return;
    if (b.disabled) { sembunyi(); return; }
    aktif = b;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      timer = 0;
      if (aktif === b && document.contains(b)) tampil(b);
    }, JEDA);
  }

  function keluar(e) {
    if (!aktif) return;
    var ke = e.relatedTarget;
    if (ke && ke.closest && ke.closest(SEL) === aktif) return;   // masih di tombol yang sama
    sembunyi();
  }

  document.addEventListener('pointerover', masuk, true);
  document.addEventListener('pointerout', keluar, true);
  document.addEventListener('focusin', masuk, true);
  document.addEventListener('focusout', sembunyi, true);
  /* Diklik = tombolnya sudah bekerja; balon tidak boleh menggantung di layar
     sementara daftar di belakangnya berganti. */
  document.addEventListener('click', sembunyi, true);
  document.addEventListener('scroll', sembunyi, true);   // capture: termasuk .table-wrap
  window.addEventListener('resize', sembunyi);
  window.addEventListener('blur', sembunyi);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') sembunyi();
  }, true);
})();


/* ============================================================================
   NAMA ORANG SELALU HURUF KAPITAL                                 — 8 Agu 2026
   ----------------------------------------------------------------------------
   Permintaan: kolom yang berisi NAMA ORANG otomatis menjadi HURUF BESAR saat
   diketik, di seluruh menu, dan huruf besar itu ikut tersimpan ke basis data.

   Cakupannya SENGAJA dibatasi ke nama orang (pilihan user): Yang Menyerahkan,
   Yang Menerima, Pejabat/Pimpinan, Pengawas Pekerjaan & Lapangan, Pengendali
   Pekerjaan, Direksi Pekerjaan, PIC, penanda tangan. Nama Pekerjaan, Nama
   Penyedia, Nama Perusahaan, Nama Unit, dan Nama Bank TIDAK ikut.

   MENGAPA SATU PENYADAP, BUKAN MENYUNTING TIAP KOLOM
   Kolom-kolom itu dibuat dari beberapa sumber yang berbeda — FIELDS/GROUPS
   (Monitoring), daftar `l:` (Susun Kontrak & Susun Dokumen), dan markup lepas
   pada wizard. Menyisipkan `toUpperCase()` satu per satu berarti menyentuh
   puluhan tempat, dan kolom baru yang dibuat sesudahnya pasti terlewat lagi.
   Penyadap ini mengenali kolomnya dari LABEL dan ID, jadi kolom baru dengan
   penamaan yang sama otomatis ikut.

   FASE CAPTURE — WAJIB. Hampir semua kolom menyimpan lewat handler sebaris
   (`oninput="spkSet(...)"`, `onchange="jpSet(...)"`) yang membaca `this.value`.
   Handler itu terpasang pada elemennya sendiri (fase target), sedangkan
   penyadap ini di `document` fase capture — jadi nilainya sudah berhuruf besar
   SEBELUM handler membacanya. Itulah yang membuat huruf besar ikut tersimpan
   tanpa menyentuh satu pun fungsi penyimpanan.

   POSISI KURSOR dikembalikan setelah nilai ditulis ulang: mengubah `value`
   memindahkan kursor ke ujung, sehingga menyunting di tengah teks mustahil.
   Aman karena huruf besar Latin tidak mengubah panjang teks.

   YANG DIKECUALIKAN: layar login & Kelola Akun (username peka huruf besar-
   kecil — mengubahnya akan membuat orang gagal masuk), kolom terkunci
   (readonly/disabled, isinya datang otomatis dari Data Pekerjaan), serta
   semua jenis masukan selain teks.

   Kolom yang tidak tertangkap pola bisa ditandai manual dengan
   `data-upper="1"`, dan yang salah tertangkap dimatikan dengan
   `data-upper="0"` — tanpa mengubah modul ini.
   ========================================================================== */
(function () {
  'use strict';

  /* Label kolom nama orang. Diuji pada label yang sudah dihuruf-kecilkan &
     dirapikan spasinya; ditambatkan ke AWAL supaya "Jabatan Pejabat Pelaksana"
     dan "NIP Pejabat Pelaksana" (bukan nama) tidak ikut. */
  var LABEL_RE = new RegExp(
    '^(?:' +
      'yang\\s+(?:menyerahkan|menerima|mengesahkan|membuat|memeriksa|menyetujui|mengetahui)' +
      '|nama\\s+(?:pejabat|pimpinan|pengguna|direksi|pengawas|pengendali|pic|petugas|direktur|penanda\\s*tangan|penandatangan)' +
      '|pejabat\\b' +
      '|pimpinan\\b' +
      '|pengawas\\s+(?:pekerjaan|lapangan)' +
      '|pengendali\\s+pekerjaan' +
      '|direksi\\s+pekerjaan' +
      '|penanda\\s*tangan|penandatangan' +
    ')'
  );

  /* Kunci field (dipakai pada id seperti f_menyerahkan / spk-fld-nama_pimpinan,
     maupun pada handler sebaris spkSet('nama_pimpinan', …)). */
  var KEY_RE = new RegExp(
    '(?:^|[_\\-\'"\\s])(?:' +
      'menyerahkan|menerima|nama_pic|' +
      'pengawas_pekerjaan|pengawas_lapangan|pengendali_pekerjaan|' +
      'nama_pejabat|nama_pimpinan|nama_pengguna|nama_direksi|nama_pengawas|' +
      'nama_pengendali|penanda_tangan|penandatangan' +
    ')(?:$|[_\\-\'"\\s,\\)])'
  );
  /* Kunci "pejabat" & "pimpinan" TELANJANG sengaja TIDAK dimasukkan: id seperti
     `jabatan_pimpinan` dan `nip_pejabat` akan ikut tertangkap, padahal isinya
     jabatan & nomor induk, bukan nama. Keduanya tetap terjaring lewat LABEL
     ("Pimpinan", "Nama Pejabat Pelaksana Pengadaan") yang ditambatkan ke awal
     sehingga "Jabatan Pimpinan" & "NIP Pejabat Pelaksana" tidak ikut. */

  var WADAH = '.field,.ac-fld,.jp-start-field,.filter-field,.pn-field,.form-field,label';

  function bersih(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .replace(/[*:?]/g, '')
      .trim()
      .toLowerCase();
  }

  function labelDari(el) {
    var w = el.closest ? el.closest(WADAH) : null;
    var lb = w ? (w.tagName === 'LABEL' ? w : w.querySelector('label')) : null;
    if (lb) {
      /* Lencana "DARI DATA PEKERJAAN" & tanda wajib ikut terbaca di
         textContent — dibuang supaya tidak merusak pencocokan. */
      var t = lb.textContent || '';
      return bersih(t.replace(/dari data pekerjaan/ig, ''));
    }
    return bersih(el.getAttribute('aria-label') || el.getAttribute('placeholder') || '');
  }

  function dikecualikan(el) {
    if (el.closest && el.closest('#login-screen,#view-akun,.ac-pane,.login-screen')) return true;
    var id = el.id || '';
    if (/^ac-/.test(id) || /^login-/.test(id)) return true;
    return false;
  }

  function perluKapital(el) {
    if (el.__upperCek !== undefined) return el.__upperCek;
    var hasil = false;
    var tanda = el.getAttribute('data-upper');
    if (tanda === '1') hasil = true;
    else if (tanda === '0') hasil = false;
    else if (dikecualikan(el)) hasil = false;
    else {
      var id = (el.id || '') + ' ' + (el.name || '');
      var aksi = (el.getAttribute('oninput') || '') + ' ' + (el.getAttribute('onchange') || '');
      hasil = KEY_RE.test(id.toLowerCase()) ||
              KEY_RE.test(aksi.toLowerCase()) ||
              LABEL_RE.test(labelDari(el));
    }
    try { el.__upperCek = hasil; } catch (_) {}
    return hasil;
  }

  function besarkan(e) {
    var el = e.target;
    if (!el || el.tagName !== 'INPUT') return;
    var t = (el.getAttribute('type') || 'text').toLowerCase();
    if (t !== 'text' && t !== 'search') return;
    if (el.readOnly || el.disabled) return;
    if (!perluKapital(el)) return;

    var v = el.value;
    var u = v.toUpperCase();
    if (u === v) return;

    var a = el.selectionStart, b = el.selectionEnd;
    el.value = u;
    /* Panjang teks tidak berubah, jadi posisi kursor lama tetap benar. */
    try { if (a !== null && a !== undefined) el.setSelectionRange(a, b); } catch (_) {}
  }

  document.addEventListener('input', besarkan, true);
  document.addEventListener('change', besarkan, true);   /* tempel & isi-otomatis */
})();
