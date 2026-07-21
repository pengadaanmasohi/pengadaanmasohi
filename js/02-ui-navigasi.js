/* ===== 02-ui-navigasi.js (bagian 2/15, baris 1217-1962 dari app.js asli) =====
   Navigasi, dropdown, menu mobile, form helpers, modal konfirmasi/detail, formatter, tabel.
   WAJIB dimuat berurutan 01 s.d. 15 — jangan ubah urutannya. ===== */
/* ============ NAVIGATION ============ */
/* Loader transisi elegan (overlay .route-loader dengan orbit + inti PLN berdenyut).
   Ditampilkan saat berpindah halaman/menu dan saat next/previous pada data monitoring. */
let _loaderShownAt=0;
function showLoader(msg){
  const l=document.getElementById('route-loader'); if(!l) return;
  if(msg){ const t=l.querySelector('.rl-text'); if(t) t.textContent=msg; }
  _loaderShownAt=Date.now();
  l.classList.add('show');
}
function hideLoader(){
  const l=document.getElementById('route-loader'); if(!l) return;
  l.classList.remove('show');
}
/* Loader untuk aksi async (hapus/simpan) — tampilkan loader dengan durasi minimum agar animasi terlihat halus */
async function withActionLoader(msg, action, minMs=650){
  showLoader(msg);
  const t0=Date.now();
  try{
    return await action();
  } finally {
    const wait=Math.max(0, minMs-(Date.now()-t0));
    setTimeout(hideLoader, wait);
  }
}
/* Loader singkat untuk aksi sinkron (mis. pindah halaman, buka detail, next/prev).
   Menampilkan animasi "Memuat" lalu menjalankan action, dengan durasi minimum agar animasi sempat terlihat. */
function withQuickLoader(msg, action, ms=520){
  showLoader(msg);
  const t0=Date.now();
  // Jalankan action di frame berikutnya agar overlay sempat ter-render (transisi masuk mulus)
  requestAnimationFrame(()=>{ requestAnimationFrame(()=>{
    let ok=true;
    try{ action(); }
    catch(e){ ok=false; console.error(e); }
    const wait=Math.max(0, ms-(Date.now()-t0));
    setTimeout(hideLoader, wait);
  }); });
}

/* Picu ulang animasi reveal pada isi tabel (dipanggil setelah tbody diisi) */
function revealTbody(tb){
  if(!tb) return;
  tb.classList.remove('tbody-reveal');
  void tb.offsetWidth; // reflow agar animasi dapat dimainkan ulang
  tb.classList.add('tbody-reveal');
}

let routeTimer=null;
/* #5: Kembalikan semua filter monitoring (Bidang, Status, Tahun, Cari) ke default
   setiap kali pindah halaman. Hanya membersihkan nilai; render dilakukan oleh showView. */
function resetAllFilters(){
  // Filter select & kotak cari yang default-nya kosong
  ['filter-bidang','filter-status','filter-tahun','filter-search',
   'filter-pl-bidang','filter-pl-tahapan','filter-pl-tahun','filter-pl-search',
   'filter-tender-bidang','filter-tender-tahapan','filter-tender-tahun','filter-tender-search',
   'fk-input-bidang','fk-input-search','fk-view-bidang','fk-view-search',
   'pn-lihat-search','fkl-view-search',
   'dash-filter-anggaran','dash-filter-tahun','dash-filter-metode'
  ].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  // Filter dashboard "Jenis Pekerjaan" kembali ke default (SPBJ / Kontrak Rinci)
  const dj=document.getElementById('dash-filter-jenis'); if(dj) dj.value='kr';
  const dmw=document.getElementById('dash-metode-wrap'); if(dmw) dmw.style.display='none';
  // Reset nomor halaman setiap tabel ke 1
  if(typeof currentPage!=='undefined') currentPage=1;
  if(typeof currentPagePl!=='undefined') currentPagePl=1;
  if(typeof currentPageTender!=='undefined') currentPageTender=1;
  if(typeof fkState!=='undefined'){ fkState.input.page=1; fkState.view.page=1; }
  if(typeof pnState!=='undefined' && pnState.lihat) pnState.lihat.page=1;
  if(typeof fklViewPage!=='undefined') fklViewPage=1;
  // Sembunyikan kembali kotak Drag & Drop unggah template setiap pindah halaman
  ['kr','pl','tender'].forEach(c=>{ const d=document.getElementById('io-dz-'+c); if(d) d.classList.remove('show','drag'); });
}

function showView(name, loaderMsg, noLoader){
  if(PYN_REG.pl.active && name!=='input-pl') exitPenyesuaianPl(); if(PYN_REG.kr.active && name!=='input') exitPenyesuaianKr(); if(PYN_REG.tender.active && name!=='input-tender') exitPenyesuaianTender();
  closeMobileNav();
  // Animasi "Memuat" halus pada setiap perpindahan halaman/menu
  // (#2: dilewati saat masuk dari login — cukup animasi "Selamat Datang").
  if(!noLoader) showLoader(loaderMsg||'Memuat');
  const t0=Date.now();
  const doSwap=()=>{
    try{
        document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
        document.getElementById('view-'+name).classList.add('active');
        ssSet(VIEW_KEY, name);   // ingat halaman aktif utk refresh (sessionStorage)
        // Draft form hanya relevan di halaman input/ubah; bersihkan bila pindah ke halaman lain
        if(name!=='input' && name!=='input-pl' && name!=='input-tender') clearDraft();
        // active state untuk Dashboard (nav-link) maupun item di dalam grup (nav-item)
        // Monitoring (link tunggal, data-view="list") menggabungkan Daftar Pekerjaan
        // & Input Pekerjaan, jadi tetap aktif untuk kedua kelompok view.
        const monitorViews=['list','list-pl','list-tender','input','input-pl','input-tender'];
        const inputViews=['input','input-pl','input-tender'];
        document.querySelectorAll('.topnav-link, .topnav-item').forEach(l=>{
          let on = l.dataset.view===name;
          if(l.dataset.view==='list' && monitorViews.includes(name)) on=true; // Monitoring induk tetap aktif
          if(l.dataset.view==='input' && inputViews.includes(name)) on=true;  // (kompatibilitas) Input Pekerjaan induk tetap aktif
          if(l.dataset.view==='fk-view' && (name==='fk-view'||name==='fk-input')) on=true; // File Kontrak induk tetap aktif
          if(l.dataset.view==='dp-view' && (name==='dp-view'||name==='form-dp')) on=true; // Data Pekerjaan induk tetap aktif
          if(l.dataset.view==='fkl-view' && (name==='fkl-view'||name==='form-kelengkapan')) on=true; // Kelengkapan induk tetap aktif
          if(l.dataset.view==='pnw-view' && (name==='pnw-view'||name==='form-pembukaan')) on=true; // Pembukaan Penawaran induk tetap aktif
          if(l.dataset.view==='rho-view' && (name==='rho-view'||name==='form-rho')) on=true; // Referensi Harga Online induk tetap aktif
          if(l.dataset.view==='analisa-view' && (name==='analisa-view'||name==='form-analisa')) on=true; // Analisa Harga Satuan induk tetap aktif
          if(l.dataset.view==='hps-view' && (name==='hps-view'||name==='form-hps')) on=true; // Perhitungan HPS induk tetap aktif
          if(l.dataset.view==='pn-lihat' && (name==='pn-lihat'||name==='pn-ambil')) on=true; // Penetapan (menu tunggal) tetap aktif saat Ambil Nomor
          if(l.dataset.view==='jadwal-view' && (name==='jadwal-view'||name==='jadwal-kerja'||name==='hari-libur')) on=true; // Jadwal (menu tunggal) tetap aktif saat Tentukan Jadwal / Hari Libur
          if(l.dataset.view==='track-view' && (name==='track-view'||name==='track-kelola')) on=true; // Tracking Pengadaan induk tetap aktif saat Kelola Tracking
          if(l.dataset.view==='spk-view' && (name==='spk-view'||name==='spk-susun'||name==='spk-klausul')) on=true; // Susun Kontrak (menu induk) tetap aktif saat Penyusunan Kontrak / Ubah Klausul
          l.classList.toggle('active', on);
        });
        // tandai & buka grup yang memuat view aktif (akordeon tetap terbuka)
        const monitorAll=['list','list-pl','list-tender','input','input-pl','input-tender'];
        document.querySelectorAll('.topnav-group').forEach(grp=>{
          let has=[...grp.querySelectorAll('.topnav-item')].some(it=>it.dataset.view===name);
          if(name==='form-dp') has = has || [...grp.querySelectorAll('.topnav-item')].some(it=>it.dataset.view==='dp-view');
          if(name==='form-kelengkapan') has = has || [...grp.querySelectorAll('.topnav-item')].some(it=>it.dataset.view==='fkl-view');
          if(name==='form-pembukaan') has = has || [...grp.querySelectorAll('.topnav-item')].some(it=>it.dataset.view==='pnw-view');
          if(name==='form-rho') has = has || [...grp.querySelectorAll('.topnav-item')].some(it=>it.dataset.view==='rho-view');
          if(name==='form-analisa') has = has || [...grp.querySelectorAll('.topnav-item')].some(it=>it.dataset.view==='analisa-view');
          if(name==='form-hps') has = has || [...grp.querySelectorAll('.topnav-item')].some(it=>it.dataset.view==='hps-view');
          if(name==='jadwal-kerja'||name==='hari-libur') has = has || [...grp.querySelectorAll('.topnav-item')].some(it=>it.dataset.view==='jadwal-view'); // Jadwal (menu tunggal): grup induk tetap terbuka saat Tentukan Jadwal / Hari Libur
          if(name==='track-kelola') has = has || [...grp.querySelectorAll('.topnav-item')].some(it=>it.dataset.view==='track-view'); // Tracking: grup Monitoring tetap terbuka saat Kelola Tracking
          // Grup Monitoring mencakup Input Pekerjaan (input/-pl/-tender) & Daftar Pekerjaan (list/-pl/-tender)
          if(grp.dataset.group==='monitor' && monitorAll.includes(name)) has=true;
          grp.classList.toggle('has-active', has);
          grp.classList.remove('open');
        });
        if(typeof closeFkSubs==='function') closeFkSubs();
        window.scrollTo({top:0,left:0,behavior:'smooth'});
        resetAllFilters();   // #5: filter di-reset ke default setiap pindah halaman
        if(name==='dashboard') renderDashboard();
        if(name==='list') renderTable();
        if(name==='list-pl') renderTablePl();
        if(name==='list-tender') renderTableTender();
        if(name==='fk-input') renderFkInput();
        if(name==='fk-view') renderFkView();
        if(name==='pn-ambil') renderPnAmbil();
        if(name==='pn-lihat') renderPnLihat();
        if(name==='form-kelengkapan') renderFormKelengkapan();
        if(name==='fkl-view') renderFklView();
        if(name==='form-pembukaan') renderPnwForm();
        if(name==='pnw-view') renderPnwView();
        if(name==='form-rho') renderRhoForm();
        if(name==='rho-view') renderRhoView();
        if(name==='form-dp') renderDpForm();
        if(name==='dp-view') renderDpView();
        if(name==='form-hps') renderHpsForm();
        if(name==='hps-view') renderHpsView();
        if(name==='form-analisa') renderAnalisaForm();
        if(name==='analisa-view') renderAnalisaView();
        if(name==='jadwal-kerja') renderJadwalKerja();
        if(name==='jadwal-view') renderJadwalView();
        if(name==='spk-susun' && typeof renderSpkSusun==='function') renderSpkSusun();
        if(name==='spk-view' && typeof renderSpkView==='function') renderSpkView();
        if(name==='spk-klausul' && typeof renderSpkKlausul==='function') renderSpkKlausul();
        if(name==='hari-libur') renderHariLibur();
        if(name==='rekap-hps') renderRekapHps();
        if(name==='track-view') renderTrackView();
        if(name==='track-kelola') renderTrackKelola();
        if(typeof fkSegSyncAll==='function') fkSegSyncAll(false);   // reposisi pil segmented setelah halaman baru terlihat
    }catch(err){ console.error('showView error:', err); }
    if(!noLoader){ const wait=Math.max(0, 460-(Date.now()-t0)); setTimeout(hideLoader, wait); }
  };
  requestAnimationFrame(()=>{ requestAnimationFrame(doSwap); });
}

/* Render ulang HALAMAN yang sedang aktif — dipakai setelah data selesai dimuat
   secara async saat refresh, agar tabel tidak tampil kosong (data baru muncul
   tanpa perlu pindah menu dulu). */
function rerenderActiveView(){
  try{
    var v=document.querySelector('.view.active'); if(!v) return;
    var name=v.id.replace(/^view-/,'');
    var R={
      'dashboard':'renderDashboard','list':'renderTable','list-pl':'renderTablePl','list-tender':'renderTableTender',
      'fk-input':'renderFkInput','fk-view':'renderFkView','pn-ambil':'renderPnAmbil','pn-lihat':'renderPnLihat',
      'form-kelengkapan':'renderFormKelengkapan','fkl-view':'renderFklView','form-pembukaan':'renderPnwForm',
      'pnw-view':'renderPnwView','form-rho':'renderRhoForm','rho-view':'renderRhoView','form-dp':'renderDpForm',
      'dp-view':'renderDpView','form-hps':'renderHpsForm','hps-view':'renderHpsView','form-analisa':'renderAnalisaForm',
      'analisa-view':'renderAnalisaView','jadwal-kerja':'renderJadwalKerja','jadwal-view':'renderJadwalView',
      'spk-susun':'renderSpkSusun','spk-view':'renderSpkView','spk-klausul':'renderSpkKlausul',
      'hari-libur':'renderHariLibur','rekap-hps':'renderRekapHps',
      'track-view':'renderTrackView','track-kelola':'renderTrackKelola'
    };
    var fn=R[name];
    if(fn && typeof window[fn]==='function') window[fn]();
  }catch(e){ console.error('rerenderActiveView:', e); }
}

/* ============ NAV (top bar dropdown) ============ */
function toggleTopGroup(ev,g){
  if(ev) ev.stopPropagation();
  document.querySelectorAll('.topnav-group').forEach(el=>{
    if(el.dataset.group===g) el.classList.toggle('open');
    else el.classList.remove('open');
  });
  closeFkSubs();   // setiap kali membuka/menutup grup, submenu bertingkat direset
}
/* Buka/tutup submenu bertingkat (mis. Input Data / Lihat Data, atau grup di dalam
   Harga Perkiraan Sendiri) — hanya menutup submenu SEBAYA (sama induk), agar
   submenu induk yang sedang terbuka tidak ikut tertutup saat anaknya diklik. */
function toggleFkSub(ev, sub){
  if(ev) ev.stopPropagation();
  const target=document.querySelector('.topnav-sub[data-sub="'+sub+'"]'); if(!target) return;
  const parent=target.parentElement;
  Array.from(parent.children).forEach(el=>{
    if(!el.classList || !el.classList.contains('topnav-sub')) return;
    if(el===target){ el.classList.toggle('open'); navAdjustFlyout(el); }
    else{ el.classList.remove('open'); el.querySelectorAll('.topnav-sub.open').forEach(s=>s.classList.remove('open')); }
  });
}
function closeFkSubs(){ document.querySelectorAll('.topnav-sub.open').forEach(el=>el.classList.remove('open')); }
document.addEventListener('click',e=>{
  if(!e.target.closest('.topnav-group')){ document.querySelectorAll('.topnav-group.open').forEach(el=>el.classList.remove('open')); closeFkSubs(); }
});
/* Bila flyout akan meluber keluar layar di sisi kanan, buka ke sisi kiri sebagai gantinya. */
function navAdjustFlyout(subEl){
  const dropdown=subEl.querySelector(':scope > .topnav-subdrop'); if(!dropdown) return;
  if(!subEl.classList.contains('open')){ dropdown.classList.remove('flip-left'); return; }
  dropdown.classList.remove('flip-left');
  const rect=dropdown.getBoundingClientRect();
  if(rect.right > window.innerWidth - 8) dropdown.classList.add('flip-left');
}
/* ============ HOVER UNTUK MEMBUKA MENU (di sebelah kanan, bertingkat) ============
   Menu tetap bisa dibuka dengan klik (untuk perangkat sentuh); di perangkat dengan
   mouse (hover:hover & pointer:fine) menu juga terbuka otomatis saat kursor berada
   di atasnya, dan submenu berikutnya selalu terbuka di sebelah kanan submenu induk,
   berlaku untuk seluruh tingkat kedalaman menu. */
(function initNavHover(){
  const canHover=()=>window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const timers=new WeakMap();
  function clearT(el){ const t=timers.get(el); if(t){ clearTimeout(t); timers.delete(el); } }
  document.querySelectorAll('.topnav-group').forEach(group=>{
    group.addEventListener('mouseenter',()=>{
      if(!canHover()) return;
      clearT(group);
      document.querySelectorAll('.topnav-group').forEach(el=>{ if(el!==group){ el.classList.remove('open'); } });
      group.classList.add('open');
    });
    group.addEventListener('mouseleave',()=>{
      if(!canHover()) return;
      clearT(group);
      timers.set(group, setTimeout(()=>{ group.classList.remove('open'); closeFkSubs(); }, 180));
    });
  });
  document.querySelectorAll('.topnav-sub').forEach(sub=>{
    sub.addEventListener('mouseenter',()=>{
      if(!canHover()) return;
      clearT(sub);
      const parent=sub.parentElement;
      Array.from(parent.children).forEach(el=>{
        if(el===sub || !el.classList || !el.classList.contains('topnav-sub')) return;
        el.classList.remove('open');
        el.querySelectorAll('.topnav-sub.open').forEach(s=>s.classList.remove('open'));
      });
      sub.classList.add('open');
      navAdjustFlyout(sub);
    });
    sub.addEventListener('mouseleave',()=>{
      if(!canHover()) return;
      clearT(sub);
      timers.set(sub, setTimeout(()=>{
        sub.classList.remove('open');
        sub.querySelectorAll('.topnav-sub.open').forEach(s=>s.classList.remove('open'));
      }, 180));
    });
  });
})();
/* ============ MENU MOBILE ============ */
function toggleMobileNav(){
  const nav=document.getElementById('topnav'), bd=document.getElementById('topnav-backdrop');
  const open=nav.classList.toggle('open'); if(bd) bd.classList.toggle('show', open);
  document.body.classList.toggle('nav-open', open);
}
function closeMobileNav(){
  const nav=document.getElementById('topnav'), bd=document.getElementById('topnav-backdrop');
  if(nav) nav.classList.remove('open'); if(bd) bd.classList.remove('show');
  document.body.classList.remove('nav-open');
}

/* ============ FORM HELPERS ============ */
/* ---- Bangun form input SPBJ/Kontrak Rinci dari FIELDS/GROUPS (dinamis) ---- */
const KR_SECTION_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>';
function krInputId(f){ return (f && f.input) ? f.input : ('f_'+ (typeof f==='string'?f:f.key)); }
function buildFormKr(){
  const cont=document.getElementById('work-form-fields'); if(!cont) return;
  let html='';
  GROUPS.forEach((g,gi)=>{
    const cols=pynGroupCols(g);
    let titleExtra='';
    if(gi===0 && g.keys.includes('tahun')){
      const tf=FIELDS.find(x=>x.key==='tahun');
      titleExtra=`<div class="title-controls">${yearControlHTML(krInputId(tf))}</div>`;
    }
    html+=`<div class="form-card"><div class="form-section-title">${KR_SECTION_ICON}${g.title}${titleExtra}</div><div class="form-flow" style="--cols:${cols}">`;
    g.keys.forEach(k=>{
      if(gi===0 && k==='tahun') return; // Tahun sudah dipindah ke baris judul
      const f=FIELDS.find(x=>x.key===k); if(!f) return;
      const id=krInputId(f);
      const req=f.req?' <span class="req">*</span>':'';
      const pxw=fieldPxStyle(f);
      const ph=f.ph?` placeholder="${f.ph}"`:'';
      let ctl='';
      if(f.type==='select') ctl=`<select id="${id}"><option value="">— Pilih —</option>${(f.options||[]).map(o=>`<option>${o}</option>`).join('')}</select>`;
      else if(f.type==='num'){
        if(f.auto==='sum'||f.auto==='ppn') ctl=`<input id="${id}" type="text" inputmode="numeric" placeholder="Rp" readonly>`;
        else if(/_harga_(barang|jasa)$/.test(f.key)){ const pfx=f.key.replace(/_harga_(barang|jasa)$/,''); ctl=`<input id="${id}" type="text" inputmode="numeric" placeholder="Rp" oninput="onHargaInput(this,'${pfx}','kr')">`; }
        else ctl=`<input id="${id}" type="text" inputmode="numeric" placeholder="Rp" oninput="onRupiahInput(this)">`;
      }
      else if(f.type==='date') ctl=`<input id="${id}" type="date">`;
      else ctl=`<input id="${id}" type="text"${ph}>`;
      const note=f.auto==='sum'?AUTO_NOTE:(f.auto==='ppn'?PPN_NOTE:'');
      html+=`<div class="field${pxw.cls}"${pxw.style} id="wrap_${id}"><label>${f.label}${req}${note?' ':''}${note}</label>${ctl}</div>`;
    });
    html+=`</div></div>`;
  });
  cont.innerHTML=html;
}
function clearForm(){
  FIELDS.forEach(f=>{ const el=document.getElementById(krInputId(f)); if(el) el.value=''; });
  clearFormErrorsKr();
}
function fillForm(rec){
  FIELDS.forEach(f=>{ const el=document.getElementById(krInputId(f)); if(el) el.value = f.type==='num' ? rupiahInputText(rec[f.key]) : (rec[f.key]!=null ? rec[f.key] : ''); });
  refreshAutoTotals(FIELDS, krInputId);
}
function readForm(){
  const rec={};
  FIELDS.forEach(f=>{
    const el=document.getElementById(krInputId(f));
    let v = el ? el.value.trim() : '';
    if(f.type==='num') v = parseRupiah(v);
    rec[f.key]=v;
  });
  // Harga Total (Tanpa PPN) = Barang + Jasa; Harga Total (Dengan PPN) = Tanpa PPN × 111%
  FIELDS.forEach(f=>{
    if(f.auto==='sum'){ const p=f.key.replace(/_total_tanpa_ppn$/,''); const b=Number(rec[p+'_harga_barang'])||0,j=Number(rec[p+'_harga_jasa'])||0; rec[f.key]=(b+j)>0?(b+j):''; }
  });
  FIELDS.forEach(f=>{
    if(f.auto==='ppn'){ const base=Number(rec[f.key.replace(/_total_dengan_ppn$/,'_total_tanpa_ppn')])||0; rec[f.key]=base>0?ppnFromBase(base):''; }
  });
  return rec;
}
function newRecord(){
  if(!requireInput()) return;
  if(PYN_REG.kr.active) exitPenyesuaianKr();
  editingId=null; krReturnView='dashboard'; buildFormKr(); clearForm();
  document.getElementById('input-title').textContent='Input Kontrak Rinci';
  document.getElementById('edit-banner').style.display='none';
  document.getElementById('io-tpl-kr').style.display='';
  showView('input'); saveDraft('input');
}
function editRecord(rid){
  if(!requireInput()) return;
  if(PYN_REG.kr.active) exitPenyesuaianKr();
  const rec=records.find(r=>r.id===rid); if(!rec) return;
  editingId=rid; krReturnView='list'; buildFormKr(); fillForm(rec);
  document.getElementById('input-title').textContent='Ubah Data Pekerjaan';
  const b=document.getElementById('edit-banner'); b.style.display='flex';
  document.getElementById('edit-banner-text').textContent='Mode Ubah Data';
  document.getElementById('io-tpl-kr').style.display='none';
  showView('input','Memuat'); saveDraft('input');
}

/* ============ CONFIRM MODAL ============ */
const ICONS={
  save:`<svg viewBox="0 0 24 24" fill="none" stroke="#1E9E5A" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>`,
  back:`<svg viewBox="0 0 24 24" fill="none" stroke="#D33A3A" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  del:`<svg viewBox="0 0 24 24" fill="none" stroke="#D33A3A" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  warn:`<svg viewBox="0 0 24 24" fill="none" stroke="#C98A00" stroke-width="2.1"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/></svg>`
};
const ICON_BG={save:'#d8f0e3',back:'#fbe0e0',del:'#fbe0e0',warn:'#fdf0d6'};
/* sfxNone:true -> tombol "Ya" tidak membunyikan nada klik, dipakai oleh
   konfirmasi Keluar yang sudah punya nada sesi sendiri. Penanda dipasang
   per-pemakaian & selalu dibersihkan, karena modal ini dipakai bersama
   (hapus data, dll) yang tetap butuh nada klik normal. */
function openConfirm({icon,title,text,onYes,sfxNone}){
  document.getElementById('confirm-icon').innerHTML=ICONS[icon];
  document.getElementById('confirm-icon').style.background=ICON_BG[icon];
  document.getElementById('confirm-title').textContent=title;
  document.getElementById('confirm-text').textContent=text;
  const yes=document.getElementById('confirm-yes');
  if(sfxNone) yes.dataset.sfx='none'; else delete yes.dataset.sfx;
  yes.onclick=()=>{ closeConfirm(); onYes(); };
  document.getElementById('confirm-overlay').classList.add('show');
}
function closeConfirm(){ document.getElementById('confirm-overlay').classList.remove('show'); }

/* SIMPAN */
/* Kunci pembanding duplikat (No. SPBJ / No. Kontrak), tahan spasi & huruf besar/kecil */
function dupKey(v){ return String(v||'').trim().toLowerCase(); }

/* Bersihkan penanda error pada form KR */
function clearFormErrorsKr(){
  FIELDS.forEach(f=>{ const w=document.getElementById('wrap_'+krInputId(f)); if(w) w.classList.remove('field-error'); });
}
/* Validasi field wajib KR; kembalikan daftar key yang kosong */
function validateRequiredKr(rec){
  const missing=[];
  FIELDS.forEach(f=>{
    if(!f.req) return;
    const v=rec[f.key];
    const empty = (v==null) || (String(v).trim()==='') || (f.type==='num' && (v===0 || v==='0'));
    if(empty) missing.push(f.key);
  });
  return missing;
}
function askSave(){
  if(!requireInput()) return;
  const rec=readForm();
  clearFormErrorsKr();
  const missing=validateRequiredKr(rec);
  if(missing.length){
    missing.forEach(k=>{ const f=FIELDS.find(x=>x.key===k); const w=f&&document.getElementById('wrap_'+krInputId(f)); if(w) w.classList.add('field-error'); });
    const firstWrap=document.getElementById('wrap_'+krInputId(FIELDS.find(x=>x.key===missing[0])));
    if(firstWrap) firstWrap.scrollIntoView({behavior:'smooth',block:'center'});
    toast('Data gagal disimpan, lengkapi data terlebih dahulu','warn');
    return;
  }
  /* Duplikat: cukup Nama Pekerjaan ATAU No. SPBJ yang sama dengan data lain. */
  {
    const bentrok=spkDupCek(rec, records,
      {nomor:'no_spbj', labelNomor:'No. SPBJ', nama:['nama_pekerjaan_kr','nama_pekerjaan_khs']},
      editingId);
    if(bentrok){ toast('Tidak bisa menambahkan 1 data : Duplikat\nSudah ada data dengan '+bentrok.by+' yang sama.','err'); return; }
  }
  openConfirm({
    icon:'save', title:'Simpan Data',
    text:'Apakah anda yakin ingin menyimpan data pekerjaan?',
    onYes:doSave
  });
}
async function doSave(){
  const rec=readForm();
  try{
    if(editingId){
      await Store.update(editingId, rec);
      toast('Data berhasil diperbarui','ok');
    }else{
      await Store.create(rec);
      toast('Data berhasil disimpan','ok');
    }
  }catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'warn'); return; }
  const back = editingId ? krReturnView : 'dashboard';
  editingId=null; clearForm(); clearDraft();
  await refreshData();
  showView(back);
}

/* KEMBALI */
function askCancel(){
  const back = editingId ? krReturnView : 'dashboard';
  openConfirm({
    icon:'back', title:'Batalkan',
    text:'Apakah anda yakin ingin membatalkan data pekerjaan?',
    onYes:()=>{ editingId=null; clearForm(); clearDraft(); showView(back); }
  });
}

/* HAPUS */
function askDelete(rid){
  if(!requireInput()) return;
  const rec=records.find(r=>r.id===rid);
  openConfirm({
    icon:'del', title:'Hapus Data',
    text:'Apakah anda yakin ingin menghapus data pekerjaan?',
    onYes:async()=>{
      try{
        await withActionLoader('Menghapus', async()=>{ await Store.remove(rid); await refreshData(); });
      }catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'warn'); return; }
      toast('Data berhasil dihapus','ok');
    }
  });
}

/* HAPUS SEMUA (KR) — menghapus seluruh data pada tabel monitoring Kontrak Rinci.
   #1: akun user punya kontrol penuh di modul SPBJ/Kontrak, termasuk Hapus Semua. */
function askDeleteAll(){
  if(!requireInput()) return;
  if(!records || records.length===0){ toast('Tidak ada data untuk dihapus','warn'); return; }
  openConfirm({
    icon:'del', title:'Hapus Semua Data',
    text:'Apakah anda yakin ingin menghapus semua data pekerjaan?',
    onYes:async()=>{
      try{
        await withActionLoader('Menghapus', async()=>{ await Store.removeAll(); await refreshData(); });
      }catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'warn'); return; }
      currentPage=1; renderTable();
      toast('Semua data berhasil dihapus','ok');
    }
  });
}

/* ============ DETAIL MODAL (Lihat) ============ */
function viewRecord(rid){
  const rec=records.find(r=>r.id===rid); if(!rec) return;
  let html='';
  GROUPS.forEach(g=>{
    let rows='';
    g.keys.forEach(k=>{
      const f=FIELDS.find(x=>x.key===k);
      rows+=`<div class="detail-row"><span class="dk">${f.label}</span><span class="dv">${fmtMulti(rec[k],f.type)||'—'}</span></div>`;
    });
    html+=detailGroupHTML(g.title, rows);
  });
  document.getElementById('detail-title').textContent='Detail Pekerjaan';
  document.getElementById('detail-body').innerHTML=html;
  withQuickLoader('Memuat', ()=>document.getElementById('detail-overlay').classList.add('show'));
}
/* #5: Bungkus judul + baris dalam satu kartu tabel ber-border */
function detailGroupHTML(title, rowsHtml){
  return `<div class="detail-group"><div class="detail-grp-title">${title}</div>${rowsHtml}</div>`;
}
function closeDetail(){ document.getElementById('detail-overlay').classList.remove('show'); }

/* ============ FORMATTERS ============ */
function fmt(v,type){
  if(v==null||v==='') return '';
  if(type==='num') return rupiah(v);
  if(type==='date') return fmtDate(v);
  return String(v);
}
function rupiah(n){ if(n===''||n==null||isNaN(n))return''; return 'Rp '+Number(n).toLocaleString('id-ID'); }
/* Tampilan detail: bila nilai teks memuat >1 baris dalam satu sel (Alt+Enter),
   tampilkan sebagai daftar bernomor (1., 2., ...) — sama seperti Bidang/Sub Bidang.
   Nilai satu baris atau tipe angka/tanggal tetap diformat normal lewat fmt(). */
function fmtMulti(v,type){
  if(v==null||v==='') return '';
  if(type==='num'||type==='date') return fmt(v,type);
  const lines=String(v).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if(lines.length<=1) return fmt(v,type);
  return lines.map((s,i)=>`<span class="stack-line"><b class="stack-no">${i+1}.</b> ${s}</span>`).join('');
}
/* ---- Format currency Rupiah pada INPUT (tanpa desimal) ---- */
/* Ambil angka mentah (integer, tanpa desimal) dari string/Number apa pun; '' bila kosong */
function parseRupiah(str){
  if(str==null||str==='') return '';
  if(typeof str==='number'){ return isNaN(str)?'':Math.round(str); }
  let s=String(str).trim();
  if(s==='') return '';
  // format Indonesia: koma = desimal -> buang bagian setelah koma
  s=s.split(',')[0];
  const digits=s.replace(/[^\d]/g,'');   // sisakan digit ribuan saja
  if(digits==='') return '';
  return parseInt(digits,10);
}
/* Tampilkan nilai sebagai "Rp 1.500.000" untuk ditaruh di value input */
function rupiahInputText(v){
  const n=parseRupiah(v);
  if(n==='') return '';
  return 'Rp '+Number(n).toLocaleString('id-ID');
}
/* Handler oninput: format sambil mengetik, jaga posisi kursor tetap wajar */
function onRupiahInput(el){
  const raw=el.value;
  const digits=raw.replace(/[^\d]/g,'');
  if(digits===''){ el.value=''; return; }
  // hitung jumlah digit sebelum kursor (untuk memulihkan posisi)
  const selStart=el.selectionStart||raw.length;
  const digitsBefore=raw.slice(0,selStart).replace(/[^\d]/g,'').length;
  const formatted='Rp '+Number(parseInt(digits,10)).toLocaleString('id-ID');
  el.value=formatted;
  // pulihkan kursor: cari posisi setelah 'digitsBefore' digit
  let seen=0, pos=formatted.length;
  for(let i=0;i<formatted.length;i++){ if(/\d/.test(formatted[i])){ seen++; if(seen===digitsBefore){ pos=i+1; break; } } }
  try{ el.setSelectionRange(pos,pos); }catch(e){}
}
/* Tarif PPN: Harga Total (Dengan PPN) = Harga Total (Tanpa PPN) × 111%. */
const PPN_RATE = 1.11;
function ppnFromBase(base){ const b=Number(base)||0; return b>0 ? Math.round(b*PPN_RATE) : 0; }
/* #12: Harga Total (Tanpa PPN) = Harga Barang + Harga Jasa (otomatis, tak bisa diedit).
   Harga Total (Dengan PPN) = Harga Total (Tanpa PPN) × 111% (otomatis, tak bisa diedit).
   Diberikan prefix (mis. 'rab','hps','tawar','kontrak','hpe') dan fungsi pembentuk id input,
   hitung total lalu tulis ke input total dalam format Rupiah. */
function computeAutoTotal(prefix, idOf){
  const bEl=document.getElementById(idOf(prefix+'_harga_barang'));
  const jEl=document.getElementById(idOf(prefix+'_harga_jasa'));
  const tEl=document.getElementById(idOf(prefix+'_total_tanpa_ppn'));
  const pEl=document.getElementById(idOf(prefix+'_total_dengan_ppn'));
  const b=parseRupiah(bEl?bEl.value:'')||0;
  const j=parseRupiah(jEl?jEl.value:'')||0;
  const sum=b+j;
  if(tEl) tEl.value = sum>0 ? ('Rp '+Number(sum).toLocaleString('id-ID')) : '';
  if(pEl){ const withPpn=ppnFromBase(sum); pEl.value = withPpn>0 ? ('Rp '+Number(withPpn).toLocaleString('id-ID')) : ''; }
}
/* Handler oninput untuk field Harga Barang/Harga Jasa: format Rupiah lalu perbarui total.
   prefix diturunkan dari key field (mis. 'rab_harga_barang' -> 'rab'). */
function onHargaInput(el, prefix, formKind){
  onRupiahInput(el);
  const idOf = formKind==='tender' ? tenderInputId : (formKind==='kr' ? krInputId : plInputId);
  computeAutoTotal(prefix, idOf);
}
/* Perbarui seluruh total otomatis pada sebuah form (dipanggil saat fill/clear). */
function refreshAutoTotals(fields, idOf){
  const done=new Set();
  fields.forEach(f=>{
    if(f.auto==='sum' && /_total_tanpa_ppn$/.test(f.key)){
      const prefix=f.key.replace(/_total_tanpa_ppn$/,'');
      if(!done.has(prefix)){ done.add(prefix); computeAutoTotal(prefix, idOf); }
    }
  });
}
/* #12: Untuk file Excel — kolom (1-based) -> huruf kolom Excel (A, B, ..., AA). */
function xlsxCol(n){ let s=''; while(n>0){ const m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=Math.floor((n-1)/26); } return s; }
/* Bangun peta: index kolom (1-based) untuk tiap key field dalam sebuah daftar fields. */
function fieldColMap(fields){ const m={}; fields.forEach((f,i)=>{ m[f.key]=i+1; }); return m; }
/* Kolom yang WAJIB berformat teks di Excel agar angka depan (mis. 0 pada 083x, no. rekening, no. dokumen) & format NPWP tidak berubah. */
const FORCE_TEXT_KEYS = ['no_telp_pic','npwp','no_telp','no_rekening','norm_eproc','no_eproc','no_pr','nomor_pr','no_po'];
function isForceTextKey(key){ return FORCE_TEXT_KEYS.includes(key); }
/* Terapkan rumus otomatis (Barang + Jasa) ke sel total pada baris data Excel.
   ws: worksheet ExcelJS; fields: daftar field terurut sesuai kolom; rowNum: nomor baris data. */
function applyExcelAutoFormula(ws, fields, colMap, rowNum){
  fields.forEach((f)=>{
    if(f.auto==='sum' && /_total_tanpa_ppn$/.test(f.key)){
      const prefix=f.key.replace(/_total_tanpa_ppn$/,'');
      const bCol=colMap[prefix+'_harga_barang'], jCol=colMap[prefix+'_harga_jasa'], tCol=colMap[f.key];
      if(bCol&&jCol&&tCol){
        const cell=ws.getCell(rowNum,tCol);
        cell.value={formula:`${xlsxCol(bCol)}${rowNum}+${xlsxCol(jCol)}${rowNum}`};
        cell.numFmt=ACCT_NODEC;
      }
    }
    if(f.auto==='ppn' && /_total_dengan_ppn$/.test(f.key)){
      const baseKey=f.key.replace(/_total_dengan_ppn$/,'_total_tanpa_ppn');
      const baseCol=colMap[baseKey], pCol=colMap[f.key];
      if(baseCol&&pCol){
        const cell=ws.getCell(rowNum,pCol);
        cell.value={formula:`ROUND(${xlsxCol(baseCol)}${rowNum}*${PPN_RATE},0)`};
        cell.numFmt=ACCT_NODEC;
      }
    }
  });
}
function fmtDate(s){ if(!s)return''; const p=s.split('-'); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:s; }
function statusPill(s){
  if(s==='Selesai') return '<span class="pill pill-kontrak">Selesai</span>';
  if(s==='On Progress') return '<span class="pill pill-prog">On Progress</span>';
  return s||'—';
}

/* ============ TABLE ============ */
function getFilteredRecords(){
  const fb=document.getElementById('filter-bidang').value;
  const fst=document.getElementById('filter-status')?.value||'';
  const ftEl=document.getElementById('filter-tahun');
  const ft=ftEl?ftEl.value:'';
  const fs=document.getElementById('filter-search').value.toLowerCase().trim();
  return records.filter(r=>{
    if(fb && r.bidang_pelaksana!==fb) return false;
    if(fst && r.status!==fst) return false;
    if(ft && contractYear(r)!==ft) return false;
    if(fs){
      const hay=[r.no_prk,r.no_anggaran,r.no_eproc,r.no_spbj,r.nama_pekerjaan_kr,r.nama_pekerjaan_khs,r.nama_penyedia].join(' ').toLowerCase();
      if(!hay.includes(fs)) return false;
    }
    return true;
  }).sort(makeWorkComparator(
    r=>contractYear(r),
    r=>!!String(r.no_spbj||'').trim(),
    r=>r.tgl_terbit_kr
  ));
}
let currentPage = 1;
const PAGE_SIZE = 10;

function renderTable(){
  let rows=getFilteredRecords();
  const total=rows.length;
  document.getElementById('list-count').textContent=total;
  const tb=document.getElementById('table-body');
  const pg=document.getElementById('pagination');
  if(total===0){
    tb.innerHTML=`<tr><td colspan="10"><div class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
      <div>Data tidak tersedia</div>
    </div></td></tr>`;
    pg.innerHTML='';
    return;
  }
  const totalPages=Math.max(1,Math.ceil(total/PAGE_SIZE));
  if(currentPage>totalPages) currentPage=totalPages;
  if(currentPage<1) currentPage=1;
  const start=(currentPage-1)*PAGE_SIZE;
  const pageRows=rows.slice(start,start+PAGE_SIZE);

  tb.innerHTML=pageRows.map((r,i)=>`
    <tr>
      <td class="col-no">${start+i+1}</td>
      <td class="wrap-cell col-nama-freeze">${r.nama_pekerjaan_kr||'—'}</td>
      <td class="col-kontrak">${r.no_spbj||'—'}</td>
      <td class="cell-center col-date">${fmtDate(r.tgl_terbit_kr)||'—'}</td>
      <td class="cell-center col-date">${fmtDate(r.tgl_berakhir_kr)||'—'}</td>
      <td class="col-bidang">${r.bidang_pelaksana||'—'}</td>
      <td class="col-penyedia">${r.nama_penyedia||'—'}</td>
      <td class="col-nilai">${rupiah(r.nilai_kontrak_kr)||'—'}</td>
      <td class="cell-center">${statusPill(r.status)}</td>
      <td>
        <div class="action-cell">
          ${canInput()?`<button class="act act-edit" title="Ubah" onclick="editRecord('${r.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
          </button>`:''}
          <button class="act act-view" title="Lihat" onclick="viewRecord('${r.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          ${canInput()?`<button class="act act-del" title="Hapus" onclick="askDelete('${r.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>`:''}
        </div>
      </td>
    </tr>`).join('');

  revealTbody(tb);
  renderPagination(currentPage,totalPages);
}

function renderPagination(page,totalPages){
  const el=document.getElementById('pagination');
  if(totalPages<=1){ el.innerHTML=''; return; }
  const want=new Set([1,totalPages,page-1,page,page+1]);
  const list=[...want].filter(p=>p>=1&&p<=totalPages).sort((a,b)=>a-b);
  let html=`<button class="pg-btn" ${page===1?'disabled':''} onclick="goToPage(${page-1})">‹ Sebelumnya</button>`;
  let prev=0;
  list.forEach(p=>{
    if(p-prev>1) html+=`<span class="pg-ellipsis">…</span>`;
    html+=`<button class="pg-btn pg-num ${p===page?'active':''}" onclick="goToPage(${p})">${p}</button>`;
    prev=p;
  });
  html+=`<button class="pg-btn" ${page===totalPages?'disabled':''} onclick="goToPage(${page+1})">Berikutnya ›</button>`;
  el.innerHTML=html;
}
function goToPage(p){
  currentPage=p;
  withQuickLoader('Memuat', ()=>{
    renderTable();
    document.querySelector('#view-list .panel').scrollIntoView({behavior:'smooth',block:'nearest'});
  }, 550);
}
function resetFilters(){
  document.getElementById('filter-bidang').value='';
  const st=document.getElementById('filter-status'); if(st) st.value='';
  const t=document.getElementById('filter-tahun'); if(t) t.value='';
  document.getElementById('filter-search').value='';
  currentPage=1;
  renderTable();
}

