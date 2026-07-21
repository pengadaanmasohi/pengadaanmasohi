/* ===== 03-dashboard.js (bagian 3/15, baris 1963-2547 dari app.js asli) =====
   Dashboard.
   WAJIB dimuat berurutan 01 s.d. 15 — jangan ubah urutannya. ===== */
/* ============ DASHBOARD ============ */
/* ============================================================
   DASHBOARD — mendukung 3 jenis data:
   'kr'     = SPBJ / Kontrak Rinci   (variabel: records)
   'pl'     = Pengadaan Langsung     (variabel: records_pl)
   'tender' = Tender                 (variabel: records_tender)
   ============================================================ */

/* Ambil TAHUN dari sebuah record sesuai jenis data */
function dashYear(r, jenis){
  let fallback='';
  if(jenis==='kr')      fallback = r.tgl_terbit_kr || '';
  else                  fallback = r.tgl_awal_kontrak || r.tgl_anggaran || r.tgl_nota_dinas || r.tgl_nd_rendan || '';
  return yearOf(r, fallback);
}

/* Nilai pekerjaan (nilai kontrak, + PPN) sesuai jenis data */
function dashNilai(r, jenis){
  if(jenis==='kr') return Number(r.nilai_kontrak_kr)||0;
  return Number(r.kontrak_total_dengan_ppn)||0;   // PL & Tender
}

/* Total HPS (dengan PPN) sesuai jenis data */
function dashHPS(r){ return Number(r.hps_total_dengan_ppn)||0; }
/* Total RAB (dengan PPN) sesuai jenis data */
function dashRAB(r){ return Number(r.rab_total_dengan_ppn)||0; }


/* Transisi halus saat berpindah Jenis Data pada Dashboard */
let dashSwitchTimer=null;
function changeDashJenis(){
  const c=document.getElementById('dash-content');
  if(!c){ renderDashboard(); return; }
  c.classList.remove('dash-in');
  c.classList.add('dash-out');
  clearTimeout(dashSwitchTimer);
  dashSwitchTimer=setTimeout(()=>{
    renderDashboard();
    c.classList.remove('dash-out');
    void c.offsetWidth;   // paksa reflow agar animasi masuk terpicu ulang
    c.classList.add('dash-in');
  }, 240);
}

/* #6: Kategori "On Progress" = SEMUA tahapan selain Terkontrak & Gagal/Batal.
   Kategori ini hanya untuk dashboard & filter; tampilan status di monitoring
   tetap menampilkan nilai asli field/kolom pada Input Pekerjaan. */
const ONPROGRESS_TAHAPAN = ['Penyusunan HPS','Proses Pengadaan','Tandatangan Kontrak'];
function isOnProgressTahapan(t){ return t!=='Terkontrak' && t!=='Gagal/Batal'; }
function matchTahapanFilter(rowTahapan, filterVal){
  if(!filterVal) return true;
  if(filterVal==='On Progress') return isOnProgressTahapan(rowTahapan);
  return rowTahapan===filterVal;
}
/* Ikon SVG untuk kartu KPI dashboard (dipilih dari label kartu) */
function cardIcon(k){
  const P='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
  const key=String(k||'').toLowerCase();
  if(key.includes('total'))       return P+'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>';
  if(key.includes('terkontrak'))  return P+'<path d="M20 6 9 17l-5-5"/></svg>';
  if(key.includes('progress'))    return P+'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  if(key.includes('gagal'))       return P+'<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/></svg>';
  if(key.includes('rab'))         return P+'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>';
  if(key.includes('hps'))         return P+'<path d="M3 3v18h18"/><path d="m7 14 3-3 3 3 5-6"/></svg>';
  if(key.includes('nilai'))       return P+'<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.2A2.5 2.5 0 0 1 12 8c1.4 0 2.5.9 2.5 2s-1.1 2-2.5 2-2.5.9-2.5 2 1.1 2 2.5 2a2.5 2.5 0 0 0 2.5-1.2"/></svg>';
  return P+'<rect x="3" y="4" width="18" height="16" rx="2"/></svg>';
}
/* ============================================================
   EFEK 3D KARTU DASHBOARD — miring mengikuti kursor
   Memakai event delegation pada #view-dashboard, BUKAN listener per-kartu:
   kartu dibuat ulang (innerHTML=...) setiap ganti filter Jenis/Anggaran/Tahun,
   sehingga listener yang ditempel langsung akan hilang setiap render.

   Sudut dihitung dari posisi kursor relatif terhadap titik tengah kartu:
   kursor di kanan -> tepi kanan "masuk" (rotateY positif), kursor di atas ->
   tepi atas masuk (rotateX positif). Nilai dikirim ke CSS lewat variabel
   --rx/--ry/--gx/--gy; seluruh transform-nya dikerjakan CSS.

   Diselaraskan ke frame layar (requestAnimationFrame) agar tidak menghitung
   ulang lebih cepat daripada layar menggambar.

   Perangkat sentuh dilewati: tidak ada kursor untuk diikuti, dan efek hover
   akan "nyangkut" setelah jari diangkat. */
const TILT_MAX=7;         // derajat maksimum — di atas ini teks mulai terlihat miring
let _tiltEl=null, _tiltRaf=0, _tiltPend=null;

function dashTiltSupported(){
  try{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  }catch(e){ return false; }
}
function dashTiltApply(){
  _tiltRaf=0;
  const p=_tiltPend; if(!p||!p.el) return;
  const {el,x,y,w,h}=p;
  const px=(x/w)-0.5, py=(y/h)-0.5;          // -0.5 .. 0.5
  el.style.setProperty('--ry', ( px*TILT_MAX*2).toFixed(2)+'deg');
  el.style.setProperty('--rx', (-py*TILT_MAX*2).toFixed(2)+'deg');
  el.style.setProperty('--lift','-6px');
  el.style.setProperty('--gx', ((x/w)*100).toFixed(1)+'%');
  el.style.setProperty('--gy', ((y/h)*100).toFixed(1)+'%');
}
function dashTiltReset(el){
  if(!el) return;
  el.classList.remove('tilt-on','tilt-move');
  el.style.removeProperty('--rx'); el.style.removeProperty('--ry');
  el.style.removeProperty('--lift');
  el.style.removeProperty('--gx'); el.style.removeProperty('--gy');
}
function initDashTilt(){
  const root=document.getElementById('view-dashboard');
  if(!root || root.__tiltReady) return;
  root.__tiltReady=true;

  root.addEventListener('pointermove',function(ev){
    if(!dashTiltSupported()) return;
    if(ev.pointerType && ev.pointerType!=='mouse') return;
    const card=ev.target.closest ? ev.target.closest('.cards .card') : null;
    if(!card){ if(_tiltEl){ dashTiltReset(_tiltEl); _tiltEl=null; } return; }
    if(card!==_tiltEl){
      if(_tiltEl) dashTiltReset(_tiltEl);
      _tiltEl=card;
      card.classList.add('tilt-on');
      // tilt-move dipasang di frame berikutnya: biarkan transisi masuk
      // berjalan dulu, baru gerakannya dibuat instan mengikuti kursor.
      requestAnimationFrame(()=>{ if(_tiltEl===card) card.classList.add('tilt-move'); });
    }
    const r=card.getBoundingClientRect();
    _tiltPend={el:card, x:ev.clientX-r.left, y:ev.clientY-r.top, w:r.width, h:r.height};
    if(!_tiltRaf) _tiltRaf=requestAnimationFrame(dashTiltApply);
  }, {passive:true});

  // pointerleave tidak menyala saat kursor pindah antar kartu di dalam root,
  // jadi kondisi "keluar kartu" ditangani pointermove di atas.
  root.addEventListener('pointerleave',function(){
    if(_tiltEl){ dashTiltReset(_tiltEl); _tiltEl=null; }
  }, {passive:true});
}

/* ============================================================
   EFEK SUARA HOVER DASHBOARD — bunyi halus saat kursor mengenai tiap bagian
   (kartu statistik & baris bar). Nada DISINTESIS lewat Web Audio API (tanpa
   file audio). AudioContext hanya bisa berbunyi setelah ada interaksi pengguna
   (kebijakan browser), jadi di-"unlock" pada gesture pertama (klik/tekan). */
let _dashAC=null, _dashSoundPart=null, _dashSoundT=0, _dashMuted=false;
function dashAC(){
  if(_dashAC) return _dashAC;
  try{ var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null; _dashAC=new AC(); }catch(e){ return null; }
  return _dashAC;
}
function dashAudioUnlock(){ var c=dashAC(); if(c && c.state==='suspended'){ try{ c.resume(); }catch(e){} } }
['pointerdown','keydown','click','touchstart'].forEach(function(ev){
  try{ document.addEventListener(ev, dashAudioUnlock, {passive:true}); }catch(e){}
});
function dashBlip(freq){
  if(_dashMuted) return;
  var c=dashAC(); if(!c) return;
  if(c.state==='suspended'){ try{ c.resume(); }catch(e){} }
  try{
    var t=c.currentTime;
    var o=c.createOscillator(), g=c.createGain();
    o.type='sine';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq*0.82, t+0.09);   /* glide turun tipis → terasa "tik" lembut */
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t+0.008);            /* pelan & tidak mengganggu */
    g.gain.exponentialRampToValueAtTime(0.0001, t+0.13);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t+0.16);
  }catch(e){}
}
/* Suara "sapuan cahaya" (whoosh + kilau) — cocok dgn efek shine bergerak pada
   area brand (logo + MONITORING PENGADAAN). Noise berfilter bandpass menyapu
   naik (seperti cahaya melintas) + 2 nada tinggi lembut sebagai kilau. */
function dashSweep(){
  if(_dashMuted) return;
  var c=dashAC(); if(!c) return;
  if(c.state==='suspended'){ try{ c.resume(); }catch(e){} }
  try{
    var t=c.currentTime, dur=0.5;
    var n=Math.floor(c.sampleRate*dur);
    var buf=c.createBuffer(1,n,c.sampleRate), d=buf.getChannelData(0);
    for(var i=0;i<n;i++){ d[i]=(Math.random()*2-1)*Math.pow(1-i/n,1.4); }   /* noise meredup */
    var src=c.createBufferSource(); src.buffer=buf;
    var bp=c.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=1.1;
    bp.frequency.setValueAtTime(480,t);
    bp.frequency.exponentialRampToValueAtTime(3200,t+dur);                    /* sapuan naik */
    var ng=c.createGain();
    ng.gain.setValueAtTime(0.0001,t);
    ng.gain.exponentialRampToValueAtTime(0.045,t+0.07);
    ng.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    src.connect(bp); bp.connect(ng); ng.connect(c.destination);
    src.start(t); src.stop(t+dur);
    [[1046,0.0],[1568,0.07]].forEach(function(p){                            /* kilau */
      var o=c.createOscillator(), g=c.createGain();
      o.type='sine'; o.frequency.setValueAtTime(p[0],t+p[1]);
      g.gain.setValueAtTime(0.0001,t+p[1]);
      g.gain.exponentialRampToValueAtTime(0.028,t+p[1]+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001,t+p[1]+0.26);
      o.connect(g); g.connect(c.destination);
      o.start(t+p[1]); o.stop(t+p[1]+0.3);
    });
  }catch(e){}
}
function initDashSound(){
  var root=document.getElementById('view-dashboard');
  if(!root || root.__soundReady) return;
  root.__soundReady=true;
  /* Bagian yang berbunyi: kartu statistik + DUA panel grafik ("Pekerjaan per
     Bidang" & "Nilai Pekerjaan per Bidang"). Baris bidang pelaksana (.bar-row)
     TIDAK lagi berbunyi — cukup saat berpindah antar dua panel tersebut. */
  var SEL='#dash-cards .card, #dash-nilai .card, .split > .panel';
  root.addEventListener('pointerover', function(ev){
    if(ev.pointerType && ev.pointerType!=='mouse') return;          /* lewati sentuh */
    var part=ev.target.closest ? ev.target.closest(SEL) : null;
    if(!part || part===_dashSoundPart) return;                      /* hanya saat pindah ke bagian baru */
    _dashSoundPart=part;
    var now=(window.performance&&performance.now)?performance.now():Date.now();
    if(now-_dashSoundT<40) return;                                  /* redam bila terlalu cepat */
    _dashSoundT=now;
    /* Efek suara hover dashboard DINONAKTIFKAN atas permintaan pengguna.
       (dulu: dashBlip(part.classList.contains('panel') ? 520 : 664)) */
  }, {passive:true});
  root.addEventListener('pointerout', function(ev){
    var to=ev.relatedTarget;
    if(!to || !(to.closest && to.closest(SEL))) _dashSoundPart=null; /* keluar bagian → boleh berbunyi lagi saat masuk */
  }, {passive:true});
}

/* ============================================================
   EFEK 3D + SUARA HOVER MENU ATAS (topnav)
   Setiap item menu (link, trigger grup, item dropdown) memiringkan diri
   mengikuti kursor (tilt perspektif + terangkat/translateZ) dan mengeluarkan
   bunyi halus saat kursor mengenainya. Memakai delegasi event pada #topnav
   (item bisa muncul/hilang menurut peran), dan mesin audio yang sama dgn
   dashboard (dashBlip). Sentuh & prefers-reduced-motion dilewati untuk tilt. */
const TN_SEL='.topnav-link, .topnav-trigger, .topnav-item, .topnav-subtrigger';
const TN_TILT=10;
let _tnEl=null, _tnRaf=0, _tnPend=null, _tnSoundEl=null;
function topnavFxSupported(){
  try{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  }catch(e){ return false; }
}
function topnavTiltApply(){
  _tnRaf=0; var p=_tnPend; if(!p||!p.el) return;
  var px=(p.x/p.w)-0.5, py=(p.y/p.h)-0.5;                 /* -0.5 .. 0.5 */
  var ry=(px*TN_TILT*2).toFixed(2), rx=(-py*TN_TILT*2).toFixed(2);
  p.el.style.transform='perspective(520px) translateY(-3px) translateZ(10px) rotateX('+rx+'deg) rotateY('+ry+'deg)';
}
function topnavTiltReset(el){ if(el) el.style.transform=''; }
function initTopnavFx(){
  /* Area brand (logo + judul) — bunyi "sapuan cahaya" saat kursor mencapainya,
     selaras dengan efek shine yang menyapu. pointerenter = sekali saat masuk. */
  var brand=document.querySelector('.topbar-brand');
  if(brand && !brand.__fxReady){
    brand.__fxReady=true;
    brand.addEventListener('pointerenter', function(ev){
      if(ev.pointerType && ev.pointerType!=='mouse') return;
      /* Efek suara "sapuan cahaya" pada logo DINONAKTIFKAN atas permintaan pengguna. */
    });
  }
  var root=document.getElementById('topnav');
  if(!root || root.__fxReady) return;
  root.__fxReady=true;
  /* Suara saat masuk item menu baru */
  root.addEventListener('pointerover', function(ev){
    if(ev.pointerType && ev.pointerType!=='mouse') return;
    var it=ev.target.closest ? ev.target.closest(TN_SEL) : null;
    if(!it || it===_tnSoundEl) return;
    _tnSoundEl=it;
    /* Bunyi saat kursor MELEWATI item menu atas DINONAKTIFKAN — hanya klik yang berbunyi. */
  }, {passive:true});
  root.addEventListener('pointerout', function(ev){
    var to=ev.relatedTarget;
    if(!to || !(to.closest && to.closest(TN_SEL))) _tnSoundEl=null;
  }, {passive:true});
  /* Tilt 3D mengikuti kursor */
  root.addEventListener('pointermove', function(ev){
    if(!topnavFxSupported()) return;
    if(ev.pointerType && ev.pointerType!=='mouse') return;
    var it=ev.target.closest ? ev.target.closest(TN_SEL) : null;
    if(!it){ if(_tnEl){ topnavTiltReset(_tnEl); _tnEl=null; } return; }
    if(it!==_tnEl){ if(_tnEl) topnavTiltReset(_tnEl); _tnEl=it; }
    var r=it.getBoundingClientRect();
    _tnPend={el:it, x:ev.clientX-r.left, y:ev.clientY-r.top, w:r.width, h:r.height};
    if(!_tnRaf) _tnRaf=requestAnimationFrame(topnavTiltApply);
  }, {passive:true});
  root.addEventListener('pointerleave', function(){
    if(_tnEl){ topnavTiltReset(_tnEl); _tnEl=null; }
  }, {passive:true});
}
/* ============================================================
   EFEK 3D + SUARA TAB SEGMEN (SPBJ/Kontrak Rinci · Pengadaan Langsung · Tender)
   - Hover: bunyi "tik" halus.
   - Pilih (klik): chime konfirmasi 2 nada + animasi "pop 3D" (tab terangkat &
     menekan dalam perspektif). Delegasi pada document agar mencakup semua
     kontrol .fk-seg di berbagai halaman. */
let _segHoverEl=null;
function segSelectSound(){
  if(_dashMuted) return;
  var c=dashAC(); if(!c) return;
  if(c.state==='suspended'){ try{ c.resume(); }catch(e){} }
  try{
    var t=c.currentTime;
    [[523.25,0],[783.99,0.07]].forEach(function(p){       /* C5 → G5: konfirmasi lembut */
      var o=c.createOscillator(), g=c.createGain();
      o.type='triangle'; o.frequency.setValueAtTime(p[0],t+p[1]);
      g.gain.setValueAtTime(0.0001,t+p[1]);
      g.gain.exponentialRampToValueAtTime(0.06,t+p[1]+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001,t+p[1]+0.24);
      o.connect(g); g.connect(c.destination);
      o.start(t+p[1]); o.stop(t+p[1]+0.28);
    });
  }catch(e){}
}
function initSegFx(){
  if(document.__segFxReady) return; document.__segFxReady=true;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('pointerover', function(ev){
    if(ev.pointerType && ev.pointerType!=='mouse') return;
    var b=ev.target.closest ? ev.target.closest('.fk-seg-btn') : null;
    if(!b || b===_segHoverEl) return;
    _segHoverEl=b;
    if(!b.classList.contains('active')) try{ dashBlip(600); }catch(e){}
  }, {passive:true});
  document.addEventListener('pointerout', function(ev){
    var to=ev.relatedTarget;
    if(!to || !(to.closest && to.closest('.fk-seg-btn'))) _segHoverEl=null;
  }, {passive:true});
  document.addEventListener('click', function(ev){
    var b=ev.target.closest ? ev.target.closest('.fk-seg-btn') : null;
    if(!b) return;
    try{ segSelectSound(); }catch(e){}
    if(!reduce){
      b.classList.remove('seg-pop'); void b.offsetWidth; b.classList.add('seg-pop');
      b.addEventListener('animationend', function h(e){
        if(e.animationName==='segPop'){ b.classList.remove('seg-pop'); b.removeEventListener('animationend',h); }
      });
    }
  });
}
if(typeof document!=='undefined'){
  if(document.readyState!=='loading'){ try{ initTopnavFx(); initSegFx(); }catch(e){} }
  else document.addEventListener('DOMContentLoaded', function(){ try{ initTopnavFx(); initSegFx(); }catch(e){} });
}

function renderDashboard(){
  initDashTilt();
  initDashSound();
  const jEl=document.getElementById('dash-filter-jenis');
  const jenis = jEl ? jEl.value : 'kr';
  const ftEl=document.getElementById('dash-filter-tahun');
  const ft=ftEl?ftEl.value:'';
  const faEl=document.getElementById('dash-filter-anggaran');
  const fa=faEl?faEl.value:'';

  // #2: Filter Metode Pengadaan hanya tampil & berlaku untuk jenis Tender
  const metodeWrap=document.getElementById('dash-metode-wrap');
  const fmEl=document.getElementById('dash-filter-metode');
  if(metodeWrap) metodeWrap.style.display = (jenis==='tender') ? '' : 'none';
  const fm=(jenis==='tender' && fmEl) ? fmEl.value : '';

  // Pilih sumber data sesuai jenis
  const src = jenis==='pl' ? (records_pl||[])
            : jenis==='tender' ? (records_tender||[])
            : (records||[]);
  let data = ft ? src.filter(r=>dashYear(r,jenis)===ft) : src;
  if(fa) data = data.filter(r=>r.jenis_anggaran===fa);
  if(fm) data = data.filter(r=>r.metode_pengadaan===fm);

  // Subtitle & label status
  const meta = {
    kr:     {label:'SPBJ / Kontrak Rinci', title:'Kontrak Rinci',       sub:'Ringkasan monitoring SPBJ / Kontrak Rinci UP3 Masohi'},
    pl:     {label:'Pengadaan Langsung',   title:'Pengadaan Langsung',  sub:'Ringkasan monitoring Pengadaan Langsung UP3 Masohi'},
    tender: {label:'Tender',               title:'Tender',              sub:'Ringkasan monitoring Tender UP3 Masohi'},
  }[jenis];
  const titleEl=document.getElementById('dash-title'); if(titleEl) titleEl.textContent = meta && meta.title ? ('Dashboard '+meta.title) : 'Dashboard';
  const subEl=document.getElementById('dash-subtitle'); if(subEl) subEl.textContent=meta.sub;

  const total=data.length;

  // Hitung status: KR pakai field 'status' (On Progress/Selesai);
  // PL & Tender pakai 'tahapan' (Terkontrak / Gagal/Batal / lainnya = On Progress)
  let terkontrak, prog, gagal;
  if(jenis==='kr'){
    // #5: SPBJ selain "Selesai" dikategorikan On Progress
    terkontrak = data.filter(r=>r.status==='Selesai').length;
    prog       = total - terkontrak;
    gagal      = 0;
  }else{
    // #6: selain Terkontrak & Gagal/Batal masuk On Progress
    terkontrak = data.filter(r=>r.tahapan==='Terkontrak').length;
    gagal      = data.filter(r=>r.tahapan==='Gagal/Batal').length;
    prog       = total - terkontrak - gagal;
  }
  const nilai=Math.round(data.reduce((s,r)=>s+dashNilai(r,jenis),0));
  const totRAB=Math.round(data.reduce((s,r)=>s+dashRAB(r),0));
  const totHPS=Math.round(data.reduce((s,r)=>s+dashHPS(r),0));

  // Kartu ringkasan (baris status)
  const cards=[
    {k:'Total Pekerjaan', v:total, sub:ft?`Tahun ${ft}`:'Seluruh data pekerjaan', c:'var(--teal)'},
    {k:'Terkontrak',      v:terkontrak, sub:jenis==='kr'?'Sudah selesai / terkontrak':'Sudah terkontrak', c:'var(--green)'},
    {k:'On Progress',     v:prog, sub:'Sedang berjalan', c:'var(--yellow)'},
  ];
  if(jenis!=='kr'){
    cards.push({k:'Gagal / Batal', v:gagal, sub:'Pengadaan gagal / dibatalkan', c:'var(--red)'});
  }else{
    // KR tidak punya RAB/HPS → Nilai Pekerjaan tetap di baris status
    cards.push({k:'Nilai Pekerjaan', v:rupiah(nilai)||'Rp 0', sub:'Akumulasi nilai pekerjaan', c:'var(--teal-dark)', vs:'font-size:18px;line-height:1.2;word-break:break-word'});
  }

  document.getElementById('dash-cards').innerHTML=cards.map(c=>`
    <div class="card" style="--card-accent:${c.c}"><div class="accent" style="background:${c.c}"></div>
      <div class="card-head">
        <div class="card-ic" style="--ic:${c.c}">${cardIcon(c.k)}</div>
        <div class="k">${c.k}</div>
      </div>
      <div class="v" style="${c.vs||''}">${c.v}</div><div class="sub">${c.sub}</div>
    </div>`).join('');

  // Baris nilai (khusus PL & Tender): Nilai RAB, Nilai HPS, Nilai Pekerjaan, Efisiensi Kontrak vs HPS
  const nilaiRow=document.getElementById('dash-nilai');
  if(nilaiRow){
    if(jenis==='kr'){
      nilaiRow.style.display='none';
      nilaiRow.innerHTML='';
    }else{
      nilaiRow.style.display='';
      const vNum='font-size:18px;line-height:1.2;word-break:break-word';
      const nilaiCards=[
        {k:'Nilai RAB',       v:rupiah(totRAB)||'Rp 0', sub:'Akumulasi RAB', c:'var(--cyan)', vs:vNum},
        {k:'Nilai HPS',       v:rupiah(totHPS)||'Rp 0', sub:'Akumulasi HPS', c:'var(--yellow)', vs:vNum},
        {k:'Nilai Pekerjaan', v:rupiah(nilai)||'Rp 0',  sub:'Akumulasi nilai kontrak', c:'var(--teal-dark)', vs:vNum},
      ].map(c=>`
        <div class="card" style="--card-accent:${c.c}"><div class="accent" style="background:${c.c}"></div>
          <div class="card-head">
            <div class="card-ic" style="--ic:${c.c}">${cardIcon(c.k)}</div>
            <div class="k">${c.k}</div>
          </div>
          <div class="v" style="${c.vs||''}">${c.v}</div><div class="sub">${c.sub}</div>
        </div>`).join('');
      nilaiRow.innerHTML = nilaiCards + efisiensiCardHTML(data, totHPS, nilai);
    }
  }

  // Grafik per Bidang Pelaksana
  const bidangList=['Jaringan dan Konstruksi','Pembangkitan','Transaksi Energi Listrik','Niaga dan Pemasaran','Perencanaan','Keuangan dan Umum','Keselamatan, Kesehatan Kerja, Lingkungan dan Keamanan'];
  renderBars('chart-bidang','bidang_pelaksana',bidangList,data,{jenis});
  renderBars('chart-anggaran','bidang_pelaksana',bidangList,data,{jenis,sum:true});

  // ✦ Animasi masuk megah + angka menghitung naik (khusus saat baru login)
  if(window.__grandDashEntrance){
    window.__grandDashEntrance=false;
    playGrandDashEntrance();
  }
}

/* Animasi masuk dashboard yang mewah: konten muncul dari blur→fokus,
   kartu naik bertahap, lalu angka besar "menghitung naik" (count up). */
function playGrandDashEntrance(){
  const c=document.getElementById('dash-content');
  if(!c) return;
  // Hindari tumpang tindih dengan animasi pageReveal pada section dashboard
  const sec=document.getElementById('view-dashboard');
  if(sec){ sec.style.animation='none'; sec.classList.add('dash-grand-on'); }
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  c.classList.remove('dash-in','dash-grand');
  void c.offsetWidth;                  // reflow agar animasi terpicu ulang
  c.classList.add('dash-grand');
  c.addEventListener('animationend',function h(e){
    if(e.target===c){
      c.classList.remove('dash-grand');
      if(sec){ sec.style.animation=''; sec.classList.remove('dash-grand-on'); }   // pulihkan
      c.removeEventListener('animationend',h);
    }
  });
  if(reduce) return;
  // Count-up untuk angka bilangan bulat pada kartu (bukan nilai Rupiah)
  const vEls=c.querySelectorAll('#dash-cards .card .v, #dash-nilai .card .v');
  vEls.forEach(el=>{
    const raw=(el.textContent||'').trim();
    if(!/^\d+$/.test(raw)) return;      // hanya angka bulat murni (lewati "Rp ...", persen, dst)
    const target=parseInt(raw,10);
    if(target<=0){ el.textContent='0'; return; }
    const dur=900, start=performance.now();
    const ease=t=>1-Math.pow(1-t,3);    // easeOutCubic
    el.textContent='0';
    function step(now){
      const p=Math.min(1,(now-start)/dur);
      el.textContent=String(Math.round(ease(p)*target));
      if(p<1) requestAnimationFrame(step);
      else el.textContent=String(target);
    }
    requestAnimationFrame(step);
  });
}

/* Kartu Efisiensi: Nilai Kontrak terhadap HPS (grafik batang % + penghematan Rp) */
function efisiensiCardHTML(data, totHPS, nilaiPekerjaan){
  const sHPS = Number(totHPS)||0;          // Nilai HPS (akumulasi, sesuai kartu Dashboard)
  const sPek = Number(nilaiPekerjaan)||0;  // Nilai Pekerjaan (akumulasi nilai kontrak)
  if(sHPS<=0){
    return `<div class="card efisiensi-card" style="--card-accent:var(--green)"><div class="accent" style="background:var(--green)"></div>
      <div class="k">Efisiensi Kontrak vs HPS</div>
      <div class="eff-empty">Data tidak tersedia</div></div>`;
  }
  const hemat = Math.round(sHPS - sPek);   // Rp Penghematan terhadap HPS = Nilai HPS − Nilai Pekerjaan
  const pct = (sHPS - sPek) / sHPS * 100;  // Persentase = Penghematan / Nilai HPS × 100
  const barW = Math.max(0, Math.min(100, pct));
  return `<div class="card efisiensi-card" style="--card-accent:var(--green)"><div class="accent" style="background:var(--green)"></div>
    <div class="k">Efisiensi Kontrak vs HPS</div>
    <div class="eff-pct">${pct.toFixed(2)}<span>%</span></div>
    <div class="eff-bar"><div class="eff-bar-fill" style="width:${barW}%"></div></div>
    <div class="eff-rp">${rupiah(hemat)||'Rp 0'}<small>penghematan terhadap HPS</small></div>
  </div>`;
}

function renderBars(elId,key,cats,data,opts){
  data=data||[]; opts=opts||{};
  const jenis=opts.jenis||'kr';
  const el=document.getElementById(elId); if(!el) return;
  if(data.length===0){ el.innerHTML='<div class="empty" style="padding:20px">Data tidak tersedia</div>'; return; }
  const rows=cats.map(c=>{
    const subset=data.filter(r=>r[key]===c);
    const val=opts.sum ? Math.round(subset.reduce((s,r)=>s+dashNilai(r,jenis),0)) : subset.length;
    return {c,val};
  });
  const max=Math.max(1,...rows.map(x=>x.val));
  el.innerHTML=rows.map(x=>`
    <div class="bar-row">
      <span class="lbl" title="${x.c}">${x.c}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${x.val/max*100}%"></div></div>
      <span class="num${opts.sum?' num-rp':''}">${opts.sum?(rupiah(x.val)||'Rp 0'):x.val}</span>
    </div>`).join('');
}

/* Efisiensi Harga (memakai nilai TOTAL DENGAN PPN untuk HPS, RAB, dan Kontrak):
   1) Nilai Kontrak terhadap HPS  = Σ Kontrak / Σ HPS  (semakin kecil semakin efisien)
   2) Nilai HPS terhadap RAB      = Σ HPS / Σ RAB
   Ditampilkan sebagai persentase. */
function renderEfisiensi(elId, data){
  const el=document.getElementById(elId); if(!el) return;
  let sKontrak=0, sHPS=0, sRAB=0, sHPSforRAB=0;
  data.forEach(r=>{
    const k=Number(r.kontrak_total_dengan_ppn)||0; // Kontrak (dengan PPN)
    const h=dashHPS(r);                              // HPS (dengan PPN)
    const b=dashRAB(r);                              // RAB (dengan PPN)
    if(k>0&&h>0){ sKontrak+=k; sHPS+=h; }            // pasangan Kontrak–HPS
    if(h>0&&b>0){ sRAB+=b; sHPSforRAB+=h; }          // pasangan HPS–RAB
  });

  const rows=[];
  if(sHPS>0){
    const pct=sKontrak/sHPS*100;
    const hemat=Math.round(sHPS-sKontrak); // penghematan (HPS − Kontrak), dengan PPN
    rows.push({c:'Nilai Kontrak terhadap HPS', pct, note:`Efisiensi ${Math.round(100-pct)}% · ${rupiah(hemat)||'Rp 0'}`});
  }
  if(sRAB>0){
    const pct=sHPSforRAB/sRAB*100;
    const hemat=Math.round(sRAB-sHPSforRAB); // penghematan (RAB − HPS), dengan PPN
    rows.push({c:'Nilai HPS terhadap RAB', pct, note:`Efisiensi ${Math.round(100-pct)}% · ${rupiah(hemat)||'Rp 0'}`});
  }
  if(rows.length===0){
    el.innerHTML='<div class="empty" style="padding:20px">Data tidak tersedia</div>';
    return;
  }
  const max=Math.max(100,...rows.map(x=>x.pct));
  el.innerHTML=rows.map(x=>`
    <div class="bar-row">
      <span class="lbl" title="${x.c}">${x.c}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${x.pct/max*100}%"></div></div>
      <span class="num">${Math.round(x.pct)}%</span>
    </div>
    <div style="font-size:10px;color:var(--green-dark);margin:-6px 0 12px 212px">${x.note}</div>`).join('');
}
function ringkasRupiah(n){
  if(n>=1e9) return 'Rp '+(n/1e9).toLocaleString('id-ID',{maximumFractionDigits:2})+' M';
  if(n>=1e6) return 'Rp '+(n/1e6).toLocaleString('id-ID',{maximumFractionDigits:1})+' Jt';
  return 'Rp '+n.toLocaleString('id-ID');
}

