/* ===== 15-akun-akses-tracking.js (bagian 15/15, baris 24752-26393 dari app.js asli) =====
   Pusat kontrol akun & akses, unduh/unggah profil, tracking pengadaan.
   WAJIB dimuat berurutan 01 s.d. 15 — jangan ubah urutannya. ===== */
/* ============================================================================
   ============  PUSAT KONTROL AKUN & AKSES  (fitur tambahan)  ================
   ----------------------------------------------------------------------------
   Menu "Buat Akun & Atur Kontrol" (khusus Admin bawaan/terverifikasi server).
   Fungsi:
     1) Matrix Kontrol Akses  : Admin mengatur modul apa saja yang boleh diakses
                                 tiap peran (User / Dummy / Tamu). Tersimpan &
                                 tersinkron lewat tabel app_profiles (kind='__akses__').
     2) Buat Akun (lokal)      : Membuat akun bertipe dummy / admin / user dengan
                                 profil akses sendiri + sakelar "Koneksi Database".
                                 Dummy = akses penuh menu, TAPI berjalan di sandbox
                                 memori (tidak menyentuh database asli).
   Catatan kejujuran: akun yang dibuat di sini diverifikasi di sisi klien (cocok
   untuk alat internal). Akun ADMIN/USER berbasis server tetap lewat verify_login.
   Seluruh kode dibungkus defensif (try/catch) agar tidak mengganggu alur lama.
   ============================================================================ */
(function(){
  if(window.__AC_INSTALLED__) return; window.__AC_INSTALLED__ = true;

  /* ---------------------------------------------------------------------------
     MODEL IZIN GRANULAR
     Setiap menu = satu grup. Tiap grup punya beberapa "cap" (kapabilitas) dengan
     aksi: view (Lihat) / add (Tambah) / edit (Ubah) / del (Hapus) / access (Akses).
       - views : data-view yang disembunyikan bila cap 'view/access' ditolak.
       - body  : kelas <body> yang di-toggle bila cap ditolak (menyembunyikan
                 tombol tambah/ubah/hapus lewat CSS, per-jenis pengadaan).
       - always: cap yang selalu ON (anti-lockout, mis. Dashboard).
     Monitoring dipecah rinci per SPBJ/Kontrak Rinci, Pengadaan Langsung, Tender.
     --------------------------------------------------------------------------- */
  var AC_GROUPS = [
    { id:'dashboard', label:'Dashboard', caps:[
        {id:'dashboard', label:'Lihat', act:'view', always:true}
    ]},
    { id:'mon_kr', label:'Monitoring — SPBJ / Kontrak Rinci', caps:[
        {id:'mon_kr_view', label:'Lihat',  act:'view', views:['list']},
        {id:'mon_kr_add',  label:'Tambah', act:'add',  body:'ac-no-add-kr'},
        {id:'mon_kr_edit', label:'Ubah',   act:'edit', body:'ac-no-edit-kr'},
        {id:'mon_kr_del',  label:'Hapus',  act:'del',  body:'ac-no-del-kr'}
    ]},
    { id:'mon_pl', label:'Monitoring — Pengadaan Langsung', caps:[
        {id:'mon_pl_view', label:'Lihat',  act:'view', views:['list-pl']},
        {id:'mon_pl_add',  label:'Tambah', act:'add',  body:'ac-no-add-pl'},
        {id:'mon_pl_edit', label:'Ubah',   act:'edit', body:'ac-no-edit-pl'},
        {id:'mon_pl_del',  label:'Hapus',  act:'del',  body:'ac-no-del-pl'}
    ]},
    { id:'mon_tender', label:'Monitoring — Tender', caps:[
        {id:'mon_tender_view', label:'Lihat',  act:'view', views:['list-tender']},
        {id:'mon_tender_add',  label:'Tambah', act:'add',  body:'ac-no-add-tender'},
        {id:'mon_tender_edit', label:'Ubah',   act:'edit', body:'ac-no-edit-tender'},
        {id:'mon_tender_del',  label:'Hapus',  act:'del',  body:'ac-no-del-tender'}
    ]},
    { id:'template', label:'Download / Upload Template', caps:[
        {id:'template', label:'Akses', act:'access', body:'ac-no-template'}
    ]},
    { id:'filekontrak', label:'File Kontrak', caps:[
        {id:'fk_view', label:'Lihat / Unduh', act:'view', views:['fk-view']},
        {id:'fk_edit', label:'Unggah / Ubah', act:'edit', body:'ac-no-fk-edit', views:['fk-input']},
        {id:'fk_del',  label:'Hapus',         act:'del',  body:'ac-no-fk-del'}
    ]},
    { id:'penetapan', label:'Penetapan Pemenang', caps:[
        {id:'penetapan', label:'Akses', act:'access', views:['pn-lihat','pn-ambil','pnw-view','form-pembukaan']}
    ]},
    { id:'daftarpekerjaan', label:'Daftar Pekerjaan', caps:[
        {id:'daftarpekerjaan', label:'Akses', act:'access', views:['dp-view','form-dp']}
    ]},
    { id:'harilibur', label:'Kelengkapan & Hari Libur', caps:[
        {id:'harilibur', label:'Akses', act:'access', views:['fkl-view','form-kelengkapan','hari-libur']}
    ]},
    { id:'hps', label:'HPS & Analisa Harga', caps:[
        {id:'hps', label:'Akses', act:'access', views:['rho-view','form-rho','analisa-view','form-analisa','jadwal-view','jadwal-kerja','hps-view','form-hps','rekap-hps']}
    ]},
    { id:'spk', label:'Susun Kontrak (SPK)', caps:[
        {id:'spk', label:'Akses', act:'access', views:['spk-view','spk-susun','spk-klausul']}
    ]},
    { id:'bersihkontrak', label:'Bersihkan Daftar Kontrak', caps:[
        {id:'bersihkontrak', label:'Akses', act:'access', body:'ac-no-bersih'}
    ]},
    { id:'gantisandi', label:'Ganti Kata Sandi', caps:[
        {id:'gantisandi', label:'Akses', act:'access', body:'ac-no-gantisandi'}
    ]}
  ];

  var AC_CAPS = [];
  AC_GROUPS.forEach(function(g){ g.caps.forEach(function(c){ c.group=g.id; AC_CAPS.push(c); }); });

  var AC_ROLES = [
    {key:'admin', label:'Admin', locked:true},
    {key:'user',  label:'User'},
    {key:'dummy', label:'Dummy'},
    {key:'guest', label:'Tamu'}
  ];
  var RESERVED = ['admin','user','dummy','tamu','guest',''];

  var AC_LOCAL_KEY = 'ac_config_v1';
  var AC_ACCT_KEY  = 'mon_ac_acct';
  var AC_PRES_KIND = '__presence__';
  var acConfig = null;
  var acActiveProfile = null;   // akun kustom yang sedang login (atau null)

  function capIds(){ return AC_CAPS.map(function(c){return c.id;}); }
  function isAlways(id){ for(var i=0;i<AC_CAPS.length;i++){ if(AC_CAPS[i].id===id) return !!AC_CAPS[i].always; } return false; }
  function acAllCaps(v){ var o={}; capIds().forEach(function(id){ o[id]=!!v; }); return o; }

  /* Migrasi izin lama (model non-granular) -> model granular baru. Fail-open. */
  function acMigrateCaps(caps){
    if(!caps || typeof caps!=='object') return {};
    function pull(newId, val){ if(caps[newId]===undefined) caps[newId]=val; }
    if(caps.monitoring===false){ ['mon_kr_view','mon_pl_view','mon_tender_view'].forEach(function(k){ pull(k,false); }); }
    if(caps.input===false){ ['mon_kr_add','mon_kr_edit','mon_pl_add','mon_pl_edit','mon_tender_add','mon_tender_edit'].forEach(function(k){ pull(k,false); }); }
    if(caps.filekontrak===false){ pull('fk_view',false); pull('fk_edit',false); pull('fk_del',false); }
    return caps;
  }

  function acDefaultConfig(){
    var matrix={};
    ['user','dummy','guest'].forEach(function(r){
      matrix[r]={ caps:acAllCaps(true), database:(r==='dummy'?false:true) };
    });
    return { matrix:matrix, accounts:[] };
  }
  function acMerge(p){
    var out={ matrix:{}, accounts: Array.isArray(p&&p.accounts)?p.accounts:[] };
    ['user','dummy','guest'].forEach(function(r){
      var src=(p&&p.matrix&&p.matrix[r])||{};
      var mc=acMigrateCaps(Object.assign({}, src.caps||{}));
      out.matrix[r]={ caps:Object.assign(acAllCaps(true), mc), database: src.database!==false };
    });
    out.matrix.dummy.database=false;                // Dummy: selalu TANPA database
    out.matrix.user.caps.dashboard=true;            // Dashboard selalu boleh (anti-lockout)
    out.matrix.guest.caps.dashboard=true;
    (out.accounts||[]).forEach(function(a){
      if(a && a.caps){ a.caps=Object.assign(acAllCaps(true), acMigrateCaps(a.caps)); a.caps.dashboard=true; }
    });
    return out;
  }
  function acLoadLocal(){ try{ var s=localStorage.getItem(AC_LOCAL_KEY); return s?JSON.parse(s):null; }catch(e){ return null; } }
  function acSaveLocal(){ try{ localStorage.setItem(AC_LOCAL_KEY, JSON.stringify(acConfig)); }catch(e){} }
  function acGetConfig(){ if(!acConfig){ var l=acLoadLocal(); acConfig = l?acMerge(l):acDefaultConfig(); } return acConfig; }

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
          if(p && p.matrix){ acConfig=acMerge(p); acSaveLocal(); }
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

  /* ---- Profil efektif untuk peran/akun aktif ---- */
  function acUnrestricted(){ try{ return currentRole==='admin' && !acActiveProfile; }catch(e){ return false; } }
  function acEffectiveProfile(role){
    var cfg=acGetConfig();
    if(acActiveProfile){
      var caps=Object.assign(acAllCaps(true), acActiveProfile.caps||{}); caps.dashboard=true;
      return { caps:caps, database: !!acActiveProfile.database };
    }
    if(role==='admin') return { caps:acAllCaps(true), database:true };
    var key = role==='demo'?'dummy':(role==='guest'?'guest':'user');
    var m=(cfg.matrix&&cfg.matrix[key])||{};
    var c=Object.assign(acAllCaps(true), m.caps||{}); c.dashboard=true;
    return { caps:c, database:(key==='dummy'?false:(m.database!==false)) };
  }

  /* Peta view input (Tambah/Ubah berbagi satu form) -> cap add & edit-nya. */
  var AC_INPUT_MAP = {
    'input':        ['mon_kr_add','mon_kr_edit'],
    'input-pl':     ['mon_pl_add','mon_pl_edit'],
    'input-tender': ['mon_tender_add','mon_tender_edit']
  };

  /* ---- Terapkan pembatasan ke UI (dipanggil setelah applyRole) ---- */
  function acApplyRole(role){
    var b=document.getElementById('btn-akun-kontrol'); if(b) b.style.display = acUnrestricted() ? '' : 'none';
    var bs=document.getElementById('btn-storage');     if(bs) bs.style.display = acUnrestricted() ? '' : 'none';

    // Pulihkan elemen yang sebelumnya kami sembunyikan
    document.querySelectorAll('[data-ac-hidden="1"]').forEach(function(el){
      el.style.display = el.getAttribute('data-ac-od')||'';
      el.removeAttribute('data-ac-hidden'); el.removeAttribute('data-ac-od');
    });

    var unre=acUnrestricted();
    var prof=acEffectiveProfile(role);
    var denied={};
    if(!unre){ AC_CAPS.forEach(function(c){ if(!c.always && prof.caps[c.id]===false) denied[c.id]=true; }); }

    function hideView(v){
      document.querySelectorAll('[data-view="'+v+'"]').forEach(function(el){
        if(!el.hasAttribute('data-ac-od')) el.setAttribute('data-ac-od', el.style.display||'');
        el.style.display='none'; el.setAttribute('data-ac-hidden','1');
      });
    }
    if(!unre){
      // sembunyikan item menu (data-view) untuk kapabilitas view/access yang ditolak
      AC_CAPS.forEach(function(c){ if(denied[c.id] && c.views){ c.views.forEach(hideView); } });
      // view input disembunyikan hanya bila Tambah DAN Ubah sama-sama ditolak
      Object.keys(AC_INPUT_MAP).forEach(function(v){
        var pair=AC_INPUT_MAP[v];
        if(denied[pair[0]] && denied[pair[1]]) hideView(v);
      });
    }
    // kapabilitas berbasis CSS (tombol dinamis) -> kelas pada <body>
    var body=document.body;
    AC_CAPS.forEach(function(c){ if(c.body) body.classList.toggle(c.body, !!denied[c.id]); });
    // kompat kelas lama
    body.classList.toggle('ac-no-gantisandi', !!denied.gantisandi);
    body.classList.toggle('ac-no-bersih',     !!denied.bersihkontrak);
    body.classList.toggle('ac-no-template',   !!denied.template);
  }
  function acApply(){ try{ if(typeof currentRole!=='undefined' && currentRole) applyRole(currentRole); }catch(e){} }

  function acCanView(name){
    if(!name || name==='dashboard') return true;
    if(acUnrestricted()) return true;
    var prof=acEffectiveProfile(typeof currentRole!=='undefined'?currentRole:null);
    if(AC_INPUT_MAP[name]){
      var pair=AC_INPUT_MAP[name];
      return prof.caps[pair[0]]!==false || prof.caps[pair[1]]!==false;
    }
    for(var i=0;i<AC_CAPS.length;i++){
      var c=AC_CAPS[i];
      if(c.views && c.views.indexOf(name)>=0 && prof.caps[c.id]===false) return false;
    }
    return true;
  }

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
      await _realDb().from(_tbl()).upsert(
        {kind:AC_PRES_KIND, name:name, payload:{role:role, username:name, ts:Date.now()}, updated_at:new Date().toISOString()},
        {onConflict:'kind,name'});
    }catch(e){}
  }
  function acStartBeat(){
    try{ acBeat(); if(!window.__acBeatIv){ window.__acBeatIv=setInterval(function(){ try{acBeat();}catch(e){} }, 60000); } }catch(e){}
  }
  async function acEndBeat(){
    try{ if(window.__acBeatIv){ clearInterval(window.__acBeatIv); window.__acBeatIv=null; } }catch(e){}
    if(!_useSupa()) return;
    try{ await _realDb().from(_tbl()).delete().eq('kind',AC_PRES_KIND).eq('name',String(acWho())); }catch(e){}
  }
  async function acLoadPresence(){
    if(!_useSupa()) return [];
    try{
      var res=await _realDb().from(_tbl()).select('name,payload,updated_at').eq('kind',AC_PRES_KIND);
      if(res && !res.error && res.data){
        var now=Date.now();
        return res.data.map(function(r){
            var p=r.payload; if(typeof p==='string'){ try{p=JSON.parse(p);}catch(e){p={};} }
            return { name:r.name, role:(p&&p.role)||'', ts:(p&&p.ts)|| (Date.parse(r.updated_at)||0) };
          })
          .filter(function(x){ return (now-x.ts) < 5*60*1000; })
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
  if(typeof showView==='function'){
    var _origShowView=showView;
    showView=function(name,a,b){
      if(!acCanView(name)){ try{ toast('Akses ke menu ini dibatasi oleh Admin','warn'); }catch(e){} return; }
      return _origShowView(name,a,b);
    };
  }
  if(typeof setDbForRole==='function'){
    var _origSetDb=setDbForRole;
    setDbForRole=function(role){
      _origSetDb(role);
      try{
        var prof=acEffectiveProfile(role);
        if(prof && prof.database===false && role!=='demo' && typeof makeDemoDb==='function'){
          demoDb=makeDemoDb(); db=demoDb;   // paksa sandbox: tidak menyentuh server
        }
      }catch(e){ console.error('ac setDbForRole:',e); }
    };
  }
  if(typeof enterApp==='function'){
    var _origEnterApp=enterApp;
    enterApp=function(role,view){
      try{
        var acct=ssGet(AC_ACCT_KEY);
        if(acct){ var cfg=acGetConfig(); acActiveProfile=(cfg.accounts||[]).find(function(x){return String(x.username).toLowerCase()===String(acct).toLowerCase();})||null; }
        else acActiveProfile=null;
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
            var role = acct.type==='dummy' ? 'demo' : (acct.type==='admin' ? 'admin' : 'user');
            currentUsername = acct.username;
            acActiveProfile = acct;
            ssSet(ROLE_KEY, role); ssSet(USER_KEY, acct.username); ssSet(AC_ACCT_KEY, acct.username);
            ssSet(LOGIN_TIME_KEY,String(Date.now())); ssSet(LAST_ACTIVE_KEY,String(Date.now()));
            playLoginAnim(role, function(){ enterApp(role); });
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
      +     '<div><h3>Akun &amp; Kontrol</h3><p>Atur siapa boleh mengakses apa, dan buat akun baru.</p></div></div>'
      +   '<button class="ac-x" type="button" onclick="acClosePanel()" aria-label="Tutup">&times;</button>'
      + '</div>'
      + '<div class="ac-tabs">'
      +   '<button class="ac-tab active" data-tab="matrix" type="button" onclick="acTab(\'matrix\')">Kontrol Akses</button>'
      +   '<button class="ac-tab" data-tab="create" type="button" onclick="acTab(\'create\')">Buat Akun</button>'
      +   '<button class="ac-tab" data-tab="list" type="button" onclick="acTab(\'list\')">Daftar Akun</button>'
      +   '<button class="ac-tab" data-tab="reset" type="button" onclick="acTab(\'reset\')">Reset Sandi</button>'
      + '</div>'
      + '<div class="ac-body">'
      +   '<div class="ac-pane" id="ac-pane-matrix"></div>'
      +   '<div class="ac-pane" id="ac-pane-create" style="display:none"></div>'
      +   '<div class="ac-pane" id="ac-pane-list" style="display:none"></div>'
      +   '<div class="ac-pane" id="ac-pane-reset" style="display:none"></div>'
      + '</div>'
      + '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('mousedown', function(e){ if(e.target===ov) acClosePanel(); });
  }

  window.openAkunKontrol=async function(){
    if(!acUnrestricted()){ try{ toast('Hanya Admin yang dapat mengatur akun & akses','warn'); }catch(e){} return; }
    acEnsurePanel();
    var ov=document.getElementById('ac-ov'); ov.classList.add('show');
    try{ await acLoadConfig(); }catch(e){}
    acTab('matrix');
  };
  window.acClosePanel=function(){ var ov=document.getElementById('ac-ov'); if(ov) ov.classList.remove('show'); };
  window.acTab=function(t){
    ['matrix','create','list','reset'].forEach(function(k){
      var pane=document.getElementById('ac-pane-'+k); if(pane) pane.style.display=(k===t?'':'none');
    });
    document.querySelectorAll('.ac-tab').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-tab')===t); });
    if(t==='matrix') acRenderMatrix();
    if(t==='create') acRenderCreate();
    if(t==='list')   acRenderList();
    if(t==='reset')  acRenderReset();
  };

  function sw(role,cap,on,dis){
    return '<label class="ac-sw'+(dis?' dis':'')+'"><input type="checkbox" data-role="'+role+'" data-cap="'+cap+'" '+(on?'checked':'')+(dis?' disabled':'')+'><span></span></label>';
  }

  /* -------- Matriks kontrol akses: header dua tingkat (grup + aksi) -------- */
  function acRenderMatrix(){
    var cfg=acGetConfig();
    var h='<div class="ac-hint">Centang = boleh mengakses. Baris <b>Admin</b> selalu penuh. '
        + '<b>Dummy</b> tidak pernah terhubung ke database (berjalan di sandbox). '
        + 'Monitoring dirinci per jenis pengadaan dengan aksi <b>Lihat</b>, <b>Tambah</b>, <b>Ubah</b>, <b>Hapus</b>.</div>';
    h+='<div class="ac-tablewrap"><table class="ac-matrix ac-matrix-grp"><thead>';
    // baris 1: label grup (span sesuai jumlah aksi)
    h+='<tr class="ac-grp-row"><th class="ac-sticky" rowspan="2">Peran</th>';
    AC_GROUPS.forEach(function(g,i){ h+='<th class="ac-grp-th'+(i%2?' alt':'')+'" colspan="'+g.caps.length+'">'+g.label+'</th>'; });
    h+='<th class="ac-dbcol" rowspan="2">Koneksi<br>Database</th></tr>';
    // baris 2: aksi
    h+='<tr class="ac-act-row">';
    AC_GROUPS.forEach(function(g,i){ g.caps.forEach(function(c){ h+='<th class="ac-act-th ac-act-'+c.act+(i%2?' alt':'')+'">'+c.label+'</th>'; }); });
    h+='</tr></thead><tbody>';
    AC_ROLES.forEach(function(r){
      var locked=!!r.locked;
      var m = locked ? {caps:acAllCaps(true),database:true} : (cfg.matrix[r.key]||{caps:acAllCaps(true),database:true});
      h+='<tr><td class="ac-sticky ac-role">'+r.label+(locked?' <span class="ac-badge">penuh</span>':'')+'</td>';
      AC_GROUPS.forEach(function(g,i){ g.caps.forEach(function(c){
        var on = locked?true:(m.caps[c.id]!==false);
        var dis= locked || c.always;
        h+='<td class="ac-cell ac-act-'+c.act+(i%2?' alt':'')+'">'+sw(r.key,c.id,on,dis)+'</td>';
      });});
      var dbon = locked?true:(r.key==='dummy'?false:(m.database!==false));
      var dbdis= locked || r.key==='dummy';
      h+='<td class="ac-dbcol">'+sw(r.key,'__db__',dbon,dbdis)+'</td></tr>';
    });
    h+='</tbody></table></div>';
    h+='<div class="ac-actions"><button class="btn btn-teal" type="button" onclick="acSaveMatrix()">Simpan Perubahan</button></div>';
    document.getElementById('ac-pane-matrix').innerHTML=h;
  }
  window.acSaveMatrix=async function(){
    var cfg=acGetConfig();
    document.querySelectorAll('#ac-pane-matrix input[type=checkbox]').forEach(function(inp){
      var role=inp.getAttribute('data-role'), cap=inp.getAttribute('data-cap');
      if(role==='admin') return;
      if(!cfg.matrix[role]) cfg.matrix[role]={caps:acAllCaps(true),database:true};
      if(cap==='__db__'){ cfg.matrix[role].database=inp.checked; }
      else { cfg.matrix[role].caps[cap]=inp.checked; }
    });
    cfg.matrix.dummy.database=false;
    cfg.matrix.user.caps.dashboard=true; cfg.matrix.guest.caps.dashboard=true;
    var ok=await acSaveConfig();
    acApply();
    try{ toast(ok?'Kontrol akses tersimpan & tersinkron':'Kontrol akses tersimpan (lokal)','ok'); }catch(e){}
  };

  /* -------- Grid modul (dikelompokkan) untuk form Buat/Ubah Akun -------- */
  function capGrid(prefix, selected){
    var h='<div class="ac-capgroups">';
    AC_GROUPS.forEach(function(g){
      h+='<div class="ac-capgrp"><div class="ac-capgrp-h">'+g.label+'</div><div class="ac-capgrp-body">';
      g.caps.forEach(function(c){
        var on = selected? (selected[c.id]!==false) : true;
        var dis = !!c.always;
        h+='<label class="ac-chk'+(dis?' dis':'')+'"><input type="checkbox" id="'+prefix+'-'+c.id+'" '+(on?'checked':'')+(dis?' disabled':'')+'><span>'+c.label+'</span></label>';
      });
      h+='</div></div>';
    });
    h+='</div>';
    return h;
  }
  function acRenderCreate(edit){
    var e=edit||null;
    var h='';
    h+='<div class="ac-note">Akun di sini <b>diverifikasi di sisi klien</b> (praktis untuk alat internal). '
      +'Hanya tipe <b>User</b> &amp; <b>Dummy</b> yang dapat dibuat — akun <b>Admin cukup satu</b> (bawaan) dan tidak dibuat dari sini. '
      +'Tipe <b>Dummy</b> selalu berjalan di sandbox tanpa menyentuh database. '
      +'Untuk akun User server sejati, aktifkan RPC <code>create_user</code> di Supabase (lihat catatan di bawah).</div>';
    h+='<div class="ac-form">';
    h+='<div class="ac-row2">'
      + '<div class="ac-fld"><label>Username</label><input id="ac-c-user" type="text" autocomplete="off" placeholder="mis. operator1" value="'+(e?String(e.username).replace(/"/g,'&quot;'):'')+'"'+(e?' readonly':'')+'></div>'
      + '<div class="ac-fld"><label>Kata Sandi</label><input id="ac-c-pass" type="text" autocomplete="off" placeholder="min. 4 karakter" value="'+(e?String(e.password||'').replace(/"/g,'&quot;'):'')+'"></div>'
      + '</div>';
    var t=(e&&e.type)||'dummy'; if(t==='admin') t='user';   // Admin tunggal (bawaan) — tidak dibuat dari sini
    h+='<div class="ac-row2">'
      + '<div class="ac-fld"><label>Jenis Akun</label><select id="ac-c-type" onchange="acOnType()">'
      +   '<option value="dummy"'+(t==='dummy'?' selected':'')+'>Dummy (sandbox, tanpa database)</option>'
      +   '<option value="user"'+(t==='user'?' selected':'')+'>User</option>'
      + '</select></div>'
      + '<div class="ac-fld"><label>Koneksi Database</label>'
      +   '<label class="ac-toggle"><input id="ac-c-db" type="checkbox" '+((e&&e.database)?'checked':'')+'><span class="ac-toggle-tr"></span><em id="ac-c-db-lbl">'+((e&&e.database)?'Terhubung ke server':'Sandbox (tidak terhubung)')+'</em></label>'
      + '</div>'
      + '</div>';
    h+='<div class="ac-fld"><label>Modul & aksi yang boleh diakses</label>'+capGrid('ac-c', e?e.caps:null)+'</div>';
    h+='<div class="ac-actions">'
      + (e?'<button class="btn ghost" type="button" onclick="acTab(\'list\')">Batal</button>':'')
      + '<button class="btn btn-teal" type="button" onclick="acCreateAccount('+(e?'true':'false')+')">'+(e?'Simpan Perubahan':'Buat Akun')+'</button></div>';
    h+='<details class="ac-sql"><summary>Ingin akun USER server sejati? (SQL Supabase)</summary>'
      +'<p>Jalankan sekali di SQL Editor Supabase, lalu akun tipe User akan dibuat di server saat tersedia:</p>'
      +'<pre>create or replace function create_user(\n  p_username text, p_password text, p_role text\n) returns boolean language plpgsql security definer as $$\nbegin\n  insert into app_users(username, pass_hash, role)\n  values (lower(p_username), crypt(p_password, gen_salt(\'bf\')), p_role);\n  return true;\nexception when unique_violation then return false;\nend; $$;</pre>'
      +'<small>Sesuaikan nama tabel/kolom akun Anda. Tanpa RPC ini, akun tetap dibuat sebagai akun lokal.</small></details>';
    h+='</div>';
    document.getElementById('ac-pane-create').innerHTML=h;
    acOnType();
  }
  window.acOnType=function(){
    var type=(document.getElementById('ac-c-type')||{}).value;
    var db=document.getElementById('ac-c-db'), lbl=document.getElementById('ac-c-db-lbl');
    if(!db) return;
    if(type==='dummy'){ db.checked=false; db.disabled=true; }
    else { db.disabled=false; }
    if(lbl) lbl.textContent = db.checked ? 'Terhubung ke server' : 'Sandbox (tidak terhubung)';
    db.onchange=function(){ if(lbl) lbl.textContent = db.checked ? 'Terhubung ke server' : 'Sandbox (tidak terhubung)'; };
  };
  window.acCreateAccount=async function(isEdit){
    var cfg=acGetConfig();
    var u=((document.getElementById('ac-c-user')||{}).value||'').trim();
    var p=((document.getElementById('ac-c-pass')||{}).value||'');
    var type=(document.getElementById('ac-c-type')||{}).value||'dummy';
    if(type!=='dummy' && type!=='user') type='user';   // hanya User & Dummy; Admin tunggal (bawaan)
    var dbEl=document.getElementById('ac-c-db');
    var database = type==='dummy' ? false : !!(dbEl&&dbEl.checked);
    if(!u){ try{ toast('Username wajib diisi','warn'); }catch(e){} return; }
    if(!isEdit && RESERVED.indexOf(u.toLowerCase())>=0){ try{ toast('Username "'+u+'" sudah dipakai peran bawaan. Pilih nama lain.','warn'); }catch(e){} return; }
    if((p||'').length<4){ try{ toast('Kata sandi minimal 4 karakter','warn'); }catch(e){} return; }
    var caps={};
    AC_CAPS.forEach(function(c){ var el=document.getElementById('ac-c-'+c.id); caps[c.id]= el? !!el.checked : true; });
    caps.dashboard=true;
    var acct={ username:u, password:p, type:type, database:database, caps:caps };
    cfg.accounts=cfg.accounts||[];
    var idx=cfg.accounts.findIndex(function(x){ return String(x.username).toLowerCase()===u.toLowerCase(); });
    if(idx>=0){ cfg.accounts[idx]=acct; } else { cfg.accounts.push(acct); }

    var serverMsg='';
    if(type!=='dummy' && _useSupa()){
      try{
        var res=await _realDb().rpc('create_user',{ p_username:u, p_password:p, p_role:type });
        if(res && !res.error && res.data===true){ serverMsg=' + akun server dibuat'; }
      }catch(e){ /* RPC tidak ada -> akun tetap lokal */ }
    }
    var ok=await acSaveConfig();
    try{ toast((idx>=0?'Akun diperbarui':'Akun dibuat')+(serverMsg||(ok?' & tersinkron':' (lokal)')),'ok'); }catch(e){}
    acTab('list');
  };

  /* -------- Daftar akun + ringkasan + sesi aktif -------- */
  function acRenderList(){
    var cfg=acGetConfig(); var accs=cfg.accounts||[];
    var dummies=accs.filter(function(a){return a.type==='dummy';});
    var users=accs.filter(function(a){return a.type!=='dummy';});
    var h='';
    h+='<div class="ac-active-wrap"><div class="ac-sec-title"><span class="ac-live-ic"></span>Sedang Aktif</div>'
      +'<div id="ac-active" class="ac-active"><div class="ac-muted">Memeriksa sesi aktif…</div></div></div>';
    h+='<div class="ac-sum">'
      +'<span class="ac-sum-chip"><b>'+accs.length+'</b> Total akun</span>'
      +'<span class="ac-sum-chip user"><b>'+users.length+'</b> Admin / User</span>'
      +'<span class="ac-sum-chip dummy"><b>'+dummies.length+'</b> Dummy</span>'
      +'</div>';
    h+='<div class="ac-hint">Akun kustom yang Anda buat. Login memakai username + kata sandi ini.</div>';
    if(!accs.length){ h+='<div class="ac-empty">Belum ada akun kustom. Buka tab <b>Buat Akun</b> untuk menambah.</div>'; }
    else {
      h+='<div class="ac-tablewrap"><table class="ac-list"><thead><tr><th>Username</th><th>Jenis</th><th>Database</th><th>Izin</th><th></th></tr></thead><tbody>';
      accs.forEach(function(a){
        var nCap=AC_CAPS.filter(function(c){ return (a.caps||{})[c.id]!==false; }).length;
        var typeLbl = a.type==='dummy'?'Dummy':(a.type==='admin'?'Admin':'User');
        h+='<tr><td><b>'+escapeHtml(a.username)+'</b></td>'
          +'<td><span class="ac-pill '+a.type+'">'+typeLbl+'</span></td>'
          +'<td>'+(a.database?'<span class="ac-pill on">Terhubung</span>':'<span class="ac-pill off">Sandbox</span>')+'</td>'
          +'<td>'+nCap+' / '+AC_CAPS.length+' izin</td>'
          +'<td class="ac-rowact">'
          +'<button class="ac-mini" type="button" onclick="acEditAccount(\''+escapeAttr(a.username)+'\')">Ubah</button>'
          +'<button class="ac-mini danger" type="button" onclick="acDeleteAccount(\''+escapeAttr(a.username)+'\')">Hapus</button>'
          +'</td></tr>';
      });
      h+='</tbody></table></div>';
    }
    h+='<div class="ac-actions"><button class="btn btn-teal" type="button" onclick="acTab(\'create\')">+ Buat Akun Baru</button></div>';
    document.getElementById('ac-pane-list').innerHTML=h;
    acFillActive();
  }
  async function acFillActive(){
    var el=document.getElementById('ac-active'); if(!el) return;
    if(!_useSupa()){
      el.innerHTML='<div class="ac-muted">Deteksi sesi antar-perangkat memerlukan koneksi Supabase. Sesi ini: <b>'+escapeHtml(String(acWho()))+'</b>.</div>';
      return;
    }
    var list=await acLoadPresence();
    if(!el || !document.body.contains(el)) return;
    if(!list.length){ el.innerHTML='<div class="ac-muted">Tidak ada sesi aktif terdeteksi dalam 5 menit terakhir.</div>'; return; }
    var me=String(acWho()).toLowerCase();
    var h='';
    list.forEach(function(p){
      var mine=String(p.name).toLowerCase()===me;
      var roleLbl=p.role==='admin'?'Admin':(p.role==='demo'?'Dummy':(p.role==='guest'?'Tamu':'User'));
      var pillCls=p.role==='demo'?'dummy':(p.role==='admin'?'admin':(p.role==='guest'?'off':'user'));
      var mins=Math.max(0,Math.round((Date.now()-p.ts)/60000));
      h+='<div class="ac-live'+(mine?' me':'')+'"><span class="ac-dot"></span>'
        +'<b>'+escapeHtml(p.name)+'</b>'
        +'<span class="ac-pill '+pillCls+'">'+roleLbl+'</span>'
        +(mine?'<span class="ac-live-you">sesi ini</span>':'')
        +'<span class="ac-live-t">'+(mins<=1?'baru saja':(mins+' mnt lalu'))+'</span></div>';
    });
    el.innerHTML=h;
  }
  window.acEditAccount=function(username){
    var cfg=acGetConfig();
    var a=(cfg.accounts||[]).find(function(x){ return String(x.username).toLowerCase()===String(username).toLowerCase(); });
    if(!a) return;
    acTab('create'); acRenderCreate(a);
  };
  window.acDeleteAccount=async function(username){
    var cfg=acGetConfig();
    if(!confirm('Hapus akun "'+username+'"? Tindakan ini tidak dapat dibatalkan.')) return;
    cfg.accounts=(cfg.accounts||[]).filter(function(x){ return String(x.username).toLowerCase()!==String(username).toLowerCase(); });
    await acSaveConfig();
    try{ toast('Akun dihapus','ok'); }catch(e){}
    acRenderList();
  };

  /* ---------- Reset Kata Sandi ---------- */
  function acRenderReset(){
    var cfg=acGetConfig();
    var custom=(cfg.accounts||[]).filter(function(a){ return String(a.type)!=='admin'; });
    var h='<div class="ac-hint">Menu ini untuk membantu pengguna yang <b>lupa kata sandi</b>. Admin dapat menetapkan kata sandi baru. Akun <b>Admin tidak dapat direset dari sini</b> demi keamanan.</div>';
    h+='<div class="ac-sec-title">Akun Kustom</div>';
    if(!custom.length){
      h+='<div class="ac-empty">Belum ada akun kustom selain admin. Buat dulu di tab <b>Buat Akun</b>.</div>';
    }else{
      h+='<div class="ac-tablewrap"><table class="ac-list"><thead><tr><th>Username</th><th>Jenis</th><th>Kata Sandi Baru</th><th></th></tr></thead><tbody>';
      custom.forEach(function(a,i){
        var typeLbl=a.type==='dummy'?'Dummy':'User';
        h+='<tr><td><b>'+escapeHtml(a.username)+'</b></td>'
          +'<td><span class="ac-pill '+a.type+'">'+typeLbl+'</span></td>'
          +'<td><input class="ac-rpw" id="ac-rpw-'+i+'" type="text" autocomplete="off" placeholder="min. 4 karakter"></td>'
          +'<td class="ac-rowact"><button class="ac-mini" type="button" onclick="acResetCustom('+i+',\''+escapeAttr(a.username)+'\')">Reset</button></td>'
          +'</tr>';
      });
      h+='</tbody></table></div>';
    }
    h+='<div class="ac-sec-title" style="margin-top:20px">Akun Server (User)</div>';
    h+='<div class="ac-note">Akun User bawaan diverifikasi di server. Reset memerlukan fungsi Supabase <code>admin_reset_password</code>. Isi username &amp; kata sandi baru lalu tekan Reset; bila fungsi belum ada, ikuti SQL di bawah.</div>';
    h+='<div class="ac-form"><div class="ac-row2">'
      +'<div class="ac-fld"><label>Username</label><input id="ac-rs-user" type="text" autocomplete="off" placeholder="username akun user"></div>'
      +'<div class="ac-fld"><label>Kata Sandi Baru</label><input id="ac-rs-pass" type="text" autocomplete="off" placeholder="min. 6 karakter"></div>'
      +'</div><div class="ac-actions"><button class="btn btn-teal" type="button" onclick="acResetServer()">Reset Kata Sandi Server</button></div>';
    h+='<details class="ac-sql"><summary>SQL fungsi reset (jalankan sekali di Supabase)</summary>'
      +'<pre>create or replace function admin_reset_password(\n  p_username text, p_new text\n) returns boolean language plpgsql security definer as $$\nbegin\n  if lower(p_username) = \'admin\' then\n    return false;              -- akun admin tidak boleh direset di sini\n  end if;\n  update app_users\n     set pass_hash = crypt(p_new, gen_salt(\'bf\'))\n   where lower(username) = lower(p_username);\n  return found;\nend; $$;</pre>'
      +'<small>Sesuaikan nama tabel/kolom (mis. <code>app_users.pass_hash</code>) dengan skema akun Anda.</small></details></div>';
    document.getElementById('ac-pane-reset').innerHTML=h;
  }
  window.acResetCustom=async function(idx, username){
    var el=document.getElementById('ac-rpw-'+idx);
    var np=((el&&el.value)||'').trim();
    if(np.length<4){ try{ toast('Kata sandi baru minimal 4 karakter','warn'); }catch(e){} return; }
    var cfg=acGetConfig();
    var a=(cfg.accounts||[]).find(function(x){ return String(x.username).toLowerCase()===String(username).toLowerCase(); });
    if(!a){ try{ toast('Akun tidak ditemukan','warn'); }catch(e){} return; }
    if(String(a.type)==='admin'){ try{ toast('Akun admin tidak dapat direset dari sini','warn'); }catch(e){} return; }
    a.password=np;
    var ok=await acSaveConfig();
    try{ toast('Kata sandi "'+username+'" diperbarui'+(ok?' & tersinkron':' (lokal)'),'ok'); }catch(e){}
    acRenderReset();
  };
  window.acResetServer=async function(){
    var u=((document.getElementById('ac-rs-user')||{}).value||'').trim();
    var p=((document.getElementById('ac-rs-pass')||{}).value||'');
    if(!u){ try{ toast('Username wajib diisi','warn'); }catch(e){} return; }
    if(u.toLowerCase()==='admin'){ try{ toast('Akun admin tidak dapat direset dari sini','warn'); }catch(e){} return; }
    if((p||'').length<6){ try{ toast('Kata sandi baru minimal 6 karakter','warn'); }catch(e){} return; }
    if(!_useSupa()){ try{ toast('Reset akun server memerlukan koneksi Supabase','warn'); }catch(e){} return; }
    try{
      var res=await _realDb().rpc('admin_reset_password',{ p_username:u, p_new:p });
      if(res && res.error) throw res.error;
      if(res && res.data===true){
        try{ toast('Kata sandi "'+u+'" berhasil direset di server','ok'); }catch(e){}
        var pe=document.getElementById('ac-rs-pass'); if(pe) pe.value='';
      }else{
        try{ toast('Gagal: username tidak ditemukan atau tidak boleh direset','warn'); }catch(e){}
      }
    }catch(e){
      console.error('acResetServer:',e);
      try{ toast('Fungsi reset server belum tersedia. Lihat SQL di menu ini untuk mengaktifkannya.','warn'); }catch(_){}
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
  var ST_BUCKETS=[
    {b:'file-kontrak', l:'File Kontrak (berkas fisik)'},
    {b:'rho-foto',     l:'Foto Referensi Harga'}
  ];
  var ST_DB_QUOTA = 500*1024*1024;   // acuan Free tier Supabase: 0,5 GB database
  var ST_ST_QUOTA = 1024*1024*1024;  // acuan Free tier Supabase: 1 GB storage

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

  function stEnsurePanel(){
    if(document.getElementById('st-ov')) return;
    var ov=document.createElement('div');
    ov.id='st-ov'; ov.className='ac-ov st-ov'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true');
    ov.innerHTML =
      '<div class="ac-panel st-panel">'
      + '<div class="ac-head">'
      +   '<div class="ac-head-t"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>'
      +     '<div><h3>Penyimpanan</h3><p>Pantau pemakaian database &amp; storage file Supabase.</p></div></div>'
      +   '<button class="ac-x" type="button" onclick="stClose()" aria-label="Tutup">&times;</button>'
      + '</div>'
      + '<div class="ac-body"><div class="ac-pane" id="st-pane"></div></div>'
      + '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('mousedown', function(e){ if(e.target===ov) stClose(); });
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

      /* --- STORAGE: utamakan RPC storage_size(), fallback ke pemindaian list() --- */
      var known={}; ST_BUCKETS.forEach(function(x){ known[x.b]=x.l; });
      var srows=await stStorageSizes();
      if(srows){
        data.stExact=true;
        var seen={};
        srows.forEach(function(r){
          seen[r.b]=true;
          data.buckets.push({b:r.b, l:known[r.b]||r.b, bytes:r.bytes, files:r.files, capped:false, missing:false});
          data.totalBytesSt += r.bytes;
        });
        ST_BUCKETS.forEach(function(x){
          if(!seen[x.b]) data.buckets.push({b:x.b, l:x.l, bytes:0, files:0, capped:false, missing:false});
        });
      } else {
        var bkt=await Promise.all(ST_BUCKETS.map(function(x){ return stBucketScan(x.b); }));
        ST_BUCKETS.forEach(function(x,i){
          var r=bkt[i]||{};
          data.buckets.push({b:x.b,l:x.l,bytes:r.bytes||0,files:r.files||0,capped:!!r.capped,missing:!!r.missing});
          data.totalBytesSt += (r.bytes||0);
        });
      }
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
    var totalFiles=data.buckets.reduce(function(a,b){return a+(b.files||0);},0);
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
    h+='<div class="st-card st-card-st"><div class="st-card-h"><span class="st-card-ic st"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></span><b>Storage File</b> <span class="st-muted">ukuran per bucket</span></div>';
    h+=stBar(data.totalBytesSt, ST_ST_QUOTA, 'st');
    h+='<div class="st-hint">'
      + (data.stExact
          ? 'Dihitung langsung dari katalog <code>storage.objects</code> (mencakup semua bucket).'
          : 'RPC <code>storage_size()</code> belum tersedia \u2014 angka ini hasil pemindaian <code>list()</code> dan hanya mencakup bucket yang terdaftar.')
      + ' Catatan: halaman <i>Usage</i> Supabase <b>tidak real-time</b> (disegarkan berkala &amp; sebagian berupa rata-rata siklus tagihan), jadi wajar bila angkanya tertinggal dari panel ini.</div>';
    h+='<div class="st-list">';
    data.buckets.forEach(function(b){
      var pct = data.totalBytesSt>0 ? Math.round((b.bytes||0)/data.totalBytesSt*100) : 0;
      var extra=' <code>'+b.b+'</code>'
        + (b.missing?' <span class="st-na">bucket tidak ada</span>':'')
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

  window.__ac = { getConfig:acGetConfig, loadConfig:acLoadConfig, saveConfig:acSaveConfig, applyRole:acApplyRole, groups:AC_GROUPS, caps:AC_CAPS };
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
  klausul:  { label:'Klausul',     doLoad:function(n){ spkKlProfilDoLoad(n); }, doDelete:function(n){ spkKlProfilDoDelete(n); }, reopen:function(){ spkKlProfilOpenLoad(); } },
  penyedia: { label:'Penyedia',    doLoad:function(n){ spkPyProfilDoLoad(n); }, doDelete:function(n){ spkPyProfilDoDelete(n); }, reopen:function(){ spkPyProfilOpenLoad(); } }
};
function profilRegLabel(kind){ return (PROFIL_REG[kind] && PROFIL_REG[kind].label) || kind; }
function profilDoLoad(kind, name){ var r=PROFIL_REG[kind]; if(r&&r.doLoad) try{ r.doLoad(name); }catch(e){ console.error(e); } }
function profilDoDelete(kind, name){ var r=PROFIL_REG[kind]; if(r&&r.doDelete) try{ r.doDelete(name); }catch(e){ console.error(e); } }

/* Ikon SVG elegan (garis) untuk tombol aksi profil */
var PROFIL_LOAD_ICON  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>';
var PROFIL_TRASH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/></svg>';
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
  showView('track-view');
  const jobs=[];
  if(typeof refreshDataDp==='function') jobs.push(refreshDataDp());
  if(typeof refreshDataJadwal==='function') jobs.push(refreshDataJadwal());
  jobs.push(refreshDataTrack());
  Promise.all(jobs).then(()=>{ const v=document.querySelector('.view.active'); if(v&&v.id==='view-track-view') renderTrackView(); });
}
function trkFillPick(id){
  const el=document.getElementById(id); if(!el) return;
  const cur=trkSel;
  let h='<option value="">\u2014 pilih pekerjaan \u2014</option>';
  trkDpNames().forEach(nm=>{ h+='<option value="'+trkEsc(nm)+'"'+(trkNamaKey(nm)===trkNamaKey(cur)?' selected':'')+'>'+trkEsc(nm)+'</option>'; });
  el.innerHTML=h;
}
function trkPick(v){ trkSel=v||''; renderTrackUser(); }
function renderTrackView(){
  trkFillPick('trk-pick');
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
    +(meta.length?'<p class="trk-head-meta">'+trkEsc(meta.join(' \u00b7 '))+'</p>':'')
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
    +(o.sub?'<p class="trk-sub">'+trkEsc(o.sub)+'</p>':'');
  if(o.chips && o.chips.length){
    h+='<div class="trk-chips"><span class="trk-chip trk-chip-count">'+o.chips.length+' penyedia diundang</span>';
    o.chips.forEach(c=>{ h+='<span class="trk-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/></svg>'+trkEsc(c)+'</span>'; });
    h+='</div>';
  }
  if(o.ket!==undefined){
    h+='<div class="trk-ket'+(o.ket?'':' trk-ket-empty')+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.3-.7L3 21l1.8-5.7A8.4 8.4 0 1 1 21 11.5Z"/></svg><span>'+(o.ket?trkEsc(o.ket):'Belum ada keterangan pada tahap ini.')+'</span></div>';
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
  renderTrackKelola(true);
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

  h+='<div class="trk-actions">'
    +'<button type="button" class="trk-btn trk-btn-ghost" onclick="showView(\'track-view\')">Lihat sebagai Pengguna</button>'
    +'<button type="button" class="trk-btn trk-btn-teal" onclick="trkSave()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg> Simpan Tracking</button>'
    +'</div>';

  box.innerHTML=h;
  trkFillPick('trk-adm-pick');
  trkPvRender();
  trkAdmPill();
}