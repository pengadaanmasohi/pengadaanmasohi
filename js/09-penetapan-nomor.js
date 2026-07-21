/* ===== 09-penetapan-nomor.js (bagian 9/15, baris 7215-8031 dari app.js asli) =====
   Penetapan nomor dokumen pengadaan.
   WAJIB dimuat berurutan 01 s.d. 15 — jangan ubah urutannya. ===== */
/* ============================================================
   ==================  PENETAPAN NOMOR  =======================
   Ambil & Lihat nomor dokumen pengadaan (Pengadaan Langsung / Tender).
   - Tanggal terbit otomatis = tanggal saat penetapan.
   - Penomoran berjalan dengan "gap-fill": nomor yang DIHAPUS akan
     tersedia lagi (dipakai ulang oleh penetapan berikutnya).
   - Dokumen utama (HPS, BA Pembukaan, BA Evaluasi, BA Klarifikasi)
     berbagi satu urutan (default lanjut dari 0019 -> 0020).
     Berita Acara Penjelasan punya urutan sendiri (opsional).
   - Disimpan di Supabase tabel `penetapan_nomor` (+ file base64) dan
     `penetapan_config` (nomor awal per modul & tahun).
   Jalankan skrip: penetapan_nomor_supabase_up3masohi.sql
   ============================================================ */
const PN_TABLE = 'penetapan_nomor';
const PN_CFG_TABLE = 'penetapan_config';
const PN_MAX_MB = 15;
const PN_UNIT = 'F17060000';   // kode unit UP3 Masohi (paten)

const PN_BIDANG_OPTS = [
  'Jaringan dan Konstruksi','Pembangkitan','Transaksi Energi Listrik',
  'Niaga dan Pemasaran','Perencanaan','Keuangan dan Umum',
  'Keselamatan, Kesehatan Kerja, Lingkungan dan Keamanan'
];
const PN_KLAS_OPTS = [
  {kode:'DAN.01.01', label:'DAN.01.01 — Pengadaan Barang'},
  {kode:'DAN.01.02', label:'DAN.01.02 — Pengadaan Jasa'},
  {kode:'DAN.01.03', label:'DAN.01.03 — Pengadaan Barang dan Jasa'}
];

/* Definisi dokumen per modul.
   counter:'main' -> berbagi satu urutan | 'bap' -> urutan tersendiri.
   optional:true   -> hanya digenerate bila dipilih (Menggunakan Penjelasan = Ya). */
const PN_DOCS = {
  pl: [
    {key:'HPS',  code:'HPS',     label:'Harga Perkiraan Sendiri (HPS)',          counter:'hps'},
    {key:'BAP',  code:'BAP.PL',  label:'Berita Acara Penjelasan',                counter:'bap', optional:true},
    {key:'BAPP', code:'BAPP.PL', label:'Berita Acara Pembukaan Penawaran',       counter:'main'},
    {key:'BAE',  code:'BAEP.PL', label:'Berita Acara Evaluasi Penawaran',        counter:'main'},
    {key:'BAKN', code:'BAKN.PL', label:'Berita Acara Klarifikasi dan Negosiasi', counter:'main'}
  ],
  /* Tender: dipilih via checklist. HPS berbagi urutan dengan HPS Pengadaan Langsung
     (counter:'hps' lintas modul); dokumen lain berbagi urutan 'main' milik tender. */
  tender: [
    {key:'T_HPS',      code:'HPS',       label:'Harga Perkiraan Sendiri',                            counter:'hps'},
    {key:'T_BAP',      code:'BAP',       label:'Pemberian Penjelasan',                               counter:'main'},
    {key:'T_BAPP',     code:'BAPP',      label:'Pembukaan Penawaran',                                counter:'main'},
    {key:'T_BAPP_S1',  code:'BAPP.S1',   label:'Pembukaan Penawaran Sampul Satu',                    counter:'main'},
    {key:'T_BAEP',     code:'BAEP',      label:'Evaluasi Penawaran',                                 counter:'main'},
    {key:'T_BAEP_S1',  code:'BAEP.S1',   label:'Evaluasi Penawaran Sampul Satu',                     counter:'main'},
    {key:'T_BAEK',     code:'BAEK',      label:'Evaluasi Dokumen Aplikasi Kualifikasi',              counter:'main'},
    {key:'T_BAEP_S2',  code:'BAEP.S2',   label:'Evaluasi Penawaran Sampul Dua',                      counter:'main'},
    {key:'T_BAPK',     code:'BAPK',      label:'Pembuktian Kualifikasi',                             counter:'main'},
    {key:'T_BAKN',     code:'BAKN',      label:'Klarifikasi dan Negosiasi',                          counter:'main'},
    {key:'T_BAHP',     code:'BAHP',      label:'Hasil Pengadaan',                                    counter:'main'},
    {key:'T_UCP',      code:'UCP',       label:'Usulan Calon Pemenang',                              counter:'main'},
    {key:'T_CDA',      code:'CDA',       label:'Contract Discussion Agreement',                      counter:'main'},
    {key:'T_BAEK_PRA', code:'BAEK.PRA',  label:'Evaluasi Dokumen Aplikasi Kualifikasi (Prakualifikasi)', counter:'main'},
    {key:'T_BAPK_PRA', code:'BAPK.PRA',  label:'Pembuktian Kualifikasi (Prakualifikasi)',            counter:'main'}
  ]
};
/* Label jenis dokumen untuk tabel Lihat Nomor (per key) */
const PN_JENIS = {
  HPS:'Harga Perkiraan Sendiri', BAP:'Pemberian Penjelasan', BAPP:'Pembukaan Penawaran', BAE:'Evaluasi Penawaran', BAKN:'Klarifikasi & Negosiasi',
  T_HPS:'Harga Perkiraan Sendiri', T_BAP:'Pemberian Penjelasan', T_BAPP:'Pembukaan Penawaran',
  T_BAPP_S1:'Pembukaan Penawaran Sampul Satu', T_BAEP:'Evaluasi Penawaran', T_BAEP_S1:'Evaluasi Penawaran Sampul Satu',
  T_BAEK:'Evaluasi Dokumen Aplikasi Kualifikasi', T_BAEP_S2:'Evaluasi Penawaran Sampul Dua', T_BAPK:'Pembuktian Kualifikasi',
  T_BAKN:'Klarifikasi & Negosiasi', T_BAHP:'Hasil Pengadaan', T_UCP:'Usulan Calon Pemenang', T_CDA:'Contract Discussion Agreement',
  T_BAEK_PRA:'Evaluasi Dokumen Aplikasi Kualifikasi (Prakualifikasi)', T_BAPK_PRA:'Pembuktian Kualifikasi (Prakualifikasi)'
};
/* Nomor terakhir terpakai (base) default -> nomor berikut = base + 1.
   Dokumen utama melanjutkan dari 0019; Penjelasan mulai dari 0. */
const PN_BASE_DEFAULT = { main:19, bap:0, hps:19 };
let pnConfig = {};   // { 'pl|2026': {main:19, bap:0}, ... }

const PN_MODULES = {
  pl:     {label:'Pengadaan Langsung'},
  tender: {label:'Tender'}
};

let records_penetapan = [];
const pnState = { ambil:{modul:'pl'}, lihat:{modul:'pl', page:1}, lastResult:null };
const PN_PAGE_SIZE = 5;   // Lihat Nomor menampilkan maksimal 5 pekerjaan per halaman

/* Ikon */
const PN_DOC_ICON  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h4"/></svg>';
const PN_COPY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const PN_CHECK_ICON= '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>';
const PN_WARN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/></svg>';
const PN_HASH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M10.6 12.2l-1 5.4M14 12.2l-1 5.4M8.6 14.2h6M8.2 16.2h6"/></svg>';

/* ---- Store Supabase ---- */
const StorePenetapan = {
  async list(){
    if(!(USE_SUPABASE && db)) return [];
    const {data,error} = await db.from(PN_TABLE)
      .select('id,modul,tahun,tgl_terbit,nama_pekerjaan,bidang_pelaksana,kode_klasifikasi,unit,menggunakan_penjelasan,dokumen,nama_file,ukuran,mime,created_at')
      .order('created_at',{ascending:false});
    if(error) throw error; return data||[];
  },
  async insert(row){
    const {data,error} = await db.from(PN_TABLE).insert(row).select();
    if(error) throw error; return data && data[0];
  },
  async getFile(id){
    const {data,error} = await db.from(PN_TABLE).select('nama_file,mime,data_base64').eq('id',id).limit(1);
    if(error) throw error; return (data && data[0]) || null;
  },
  async setFile(id, file){
    const {error} = await db.from(PN_TABLE).update(file).eq('id',id);
    if(error) throw error;
  },
  /* Simpan seluruh array dokumen (menampung file & tgl_terbit per nomor). */
  async setDokumen(id, dokumen){
    if(!(USE_SUPABASE && db)) return;
    const {error} = await db.from(PN_TABLE).update({dokumen}).eq('id',id);
    if(error) throw error;
  },
  /* Ambil array dokumen lengkap (termasuk file base64 per nomor). */
  async getDokumen(id){
    if(!(USE_SUPABASE && db)) return null;
    const {data,error} = await db.from(PN_TABLE).select('dokumen').eq('id',id).limit(1);
    if(error) throw error; return (data && data[0]) ? data[0].dokumen : null;
  },
  async remove(id){
    const {error} = await db.from(PN_TABLE).delete().eq('id',id);
    if(error) throw error;
  }
};

async function refreshDataPenetapan(){
  try{ records_penetapan = await StorePenetapan.list(); }
  catch(err){ console.error(err); records_penetapan = records_penetapan||[]; toast('Gagal memuat data Penetapan Nomor: '+errMsg(err),'err'); }
  if(document.getElementById('view-pn-lihat')?.classList.contains('active')) renderPnLihat();
}
async function pnLoadConfig(){
  pnConfig = {};
  if(!(USE_SUPABASE && db)) return;
  try{
    const {data,error} = await db.from(PN_CFG_TABLE).select('modul,tahun,base');
    if(error) throw error;
    (data||[]).forEach(r=>{ pnConfig[r.modul+'|'+r.tahun] = r.base || {}; });
  }catch(err){ /* tabel opsional; abaikan bila belum dibuat */ }
}

/* ---- Util nomor ---- */
function pnYear(){ return new Date().getFullYear(); }
function pnTodayISO(){ const d=new Date(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return d.getFullYear()+'-'+m+'-'+day; }
function pnPad4(n){ return String(n).padStart(4,'0'); }
function pnFormatNo(seq, code, klas, unit, year){ return pnPad4(seq)+'.'+code+'/'+klas+'/'+unit+'/'+year; }
function pnBase(modul, counter, year){
  if(isDemo()) return 0;   // Akun dummy: penomoran selalu dimulai dari 1
  const c = pnConfig[modul+'|'+year];
  if(c && c[counter]!=null && !isNaN(c[counter])) return parseInt(c[counter],10);
  return PN_BASE_DEFAULT[counter]!=null ? PN_BASE_DEFAULT[counter] : 0;
}
/* Penentu "counter" untuk penomoran:
   - Dokumen HPS (counter asli 'hps') -> tetap 'hps' (pool bersama PL + Tender).
   - Dokumen lain -> memakai KEY-nya sendiri, sehingga setiap jenis dokumen
     memiliki urutan nomor yang terpisah (tidak saling menumpuk). */
function pnSeqCounter(d){
  if(!d) return 'main';
  return d.counter==='hps' ? 'hps' : ('k:'+d.key);
}
/* Kumpulan nomor urut yang sudah dipakai untuk (modul, counter, tahun).
   counter 'hps' bersifat lintas modul: berbagi satu urutan antara HPS Pengadaan
   Langsung dan HPS Tender. Counter 'k:<key>' -> hanya dokumen dengan key tersebut. */
function pnUsedSeqs(modul, counter, year){
  const set = new Set();
  const addFrom=(mod, keys)=>{
    records_penetapan.forEach(r=>{
      if(r.modul!==mod) return;
      if(Number(r.tahun)!==Number(year)) return;
      const arr = Array.isArray(r.dokumen)?r.dokumen:[];
      arr.forEach(d=>{ if(keys.includes(d.key) && d.seq!=null) set.add(Number(d.seq)); });
    });
  };
  if(counter==='hps'){
    // Kolam nomor bersama: seluruh dokumen ber-counter 'hps' (HPS PL + HPS Tender).
    const plHpsKeys=(PN_DOCS.pl||[]).filter(d=>d.counter==='hps').map(d=>d.key);
    addFrom('pl', plHpsKeys);
    const tHpsKeys=(PN_DOCS.tender||[]).filter(d=>d.counter==='hps').map(d=>d.key);
    addFrom('tender', tHpsKeys);
    return set;
  }
  if(counter && counter.indexOf('k:')===0){
    // Urutan terpisah per jenis dokumen (berdasarkan key).
    const key=counter.slice(2);
    addFrom(modul, [key]);
    return set;
  }
  const keys = (PN_DOCS[modul]||[]).filter(d=>d.counter===counter).map(d=>d.key);
  addFrom(modul, keys);
  return set;
}
/* Base per counter:
   - 'hps'        -> pool bersama PL+Tender, mulai dari 20 (base 19).
   - 'k:<key>' PL -> setiap dokumen PL mulai dari 20 (base 19), kecuali Penjelasan mulai 1.
   - 'k:<key>' Tender -> setiap dokumen Tender mulai dari 1 (base 0).
   Semua dapat di-override manual lewat pnConfig, dan reset per tahun otomatis. */
function pnBaseFor(modul, counter, year){
  if(isDemo()) return 0;   // Akun dummy: seluruh jenis nomor dimulai dari 1
  if(counter==='hps'){
    const cPl=pnConfig['pl|'+year], cTn=pnConfig['tender|'+year];
    if(cPl && cPl.hps!=null && !isNaN(cPl.hps)) return parseInt(cPl.hps,10);
    if(cTn && cTn.hps!=null && !isNaN(cTn.hps)) return parseInt(cTn.hps,10);
    return PN_BASE_DEFAULT.hps!=null ? PN_BASE_DEFAULT.hps : 19;
  }
  if(counter && counter.indexOf('k:')===0){
    const key=counter.slice(2);
    const c = pnConfig[modul+'|'+year];
    if(c && c[counter]!=null && !isNaN(c[counter])) return parseInt(c[counter],10);
    if(modul==='tender') return 0;                 // Tender mulai dari 1
    if(key==='BAP') return 0;                       // Penjelasan (PL) mulai dari 1
    return 19;                                      // Dokumen PL lain mulai dari 20
  }
  if(modul==='tender'){
    const c = pnConfig[modul+'|'+year];
    if(c && c[counter]!=null && !isNaN(c[counter])) return parseInt(c[counter],10);
    return 0;
  }
  return pnBase(modul,counter,year);
}
/* Nomor berikutnya = terkecil > base yang belum terpakai (mengisi celah bekas hapus) */
function pnNextSeq(modul, counter, year){
  const base = pnBaseFor(modul,counter,year);
  const used = pnUsedSeqs(modul,counter,year);
  let n = base + 1;
  while(used.has(n)) n++;
  return n;
}

/* ---- Navigasi ---- */
function openPnAmbil(modul){
  if(!PN_MODULES[modul]) modul='pl';
  if(pnState.ambil.modul!==modul) pnState.lastResult=null;
  pnState.ambil.modul=modul;
  resetInputBaru('pn');            // input baru: pilihan pekerjaan dibatalkan
  showView('pn-ambil');
}
function openPnLihat(){
  // Tabel gabungan: Pengadaan Langsung + Tender ditampilkan bersama.
  showView('pn-lihat');
}
function pnMarkActive(mode, modul){
  document.querySelectorAll('.topnav-item[data-view="pn-'+mode+'"]').forEach(b=>{
    b.classList.toggle('active', b.dataset.modul===modul);
  });
  const seg=document.getElementById('pn-'+mode+'-seg');
  if(seg) seg.querySelectorAll('.fk-seg-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.modul===modul);
  });
}

/* ---- Render halaman Ambil Nomor (gabungan Pengadaan Langsung + Tender) ---- */
function renderPnAmbil(){
  pnMarkActive('ambil', pnState.ambil.modul);
  const cont=document.getElementById('pn-ambil-content'); if(!cont) return;
  const hasDocs=((PN_DOCS.pl&&PN_DOCS.pl.length)||(PN_DOCS.tender&&PN_DOCS.tender.length));
  if(hasDocs){
    cont.innerHTML = pnAmbilUnifiedFormHtml();
    pnBuildDocModal();
    if(pnState.lastResult) pnRenderResult(pnState.lastResult);
  }else{
    cont.innerHTML = pnPendingHtml('Pengadaan');
  }
}
/* Checklist gabungan: dikelompokkan menjadi Bagian I (Pengadaan Langsung) & II (Tender) */
function pnDocGroupHtml(no, title, arr){
  const items=(arr||[]).map((d,i)=>{
    return '<label class="pn-check-item">' +
      '<input type="checkbox" class="pn-doc-check" value="'+fkEsc(d.key)+'" onchange="pnDocUpdateCount()">' +
      '<span class="pn-check-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></span>' +
      '<span class="pn-check-label">'+(i+1)+'. '+fkEsc(PN_JENIS[d.key]||d.label)+'</span>' +
    '</label>';
  }).join('');
  return '<div class="pn-doc-group">'+
    '<div class="pn-doc-group-title">'+fkEsc(title)+'</div>'+
    '<div class="pn-check-grid">'+items+'</div>'+
  '</div>';
}
function pnBuildDocModal(){
  const list=document.getElementById('pn-doc-modal-list'); if(!list) return;
  list.classList.add('pn-doc-grouped');
  list.innerHTML = pnDocGroupHtml('I', 'Pengadaan Langsung', PN_DOCS.pl) +
                   pnDocGroupHtml('II', 'Tender', PN_DOCS.tender);
  const sub=document.getElementById('pn-doc-modal-sub');
  if(sub) sub.textContent = 'Centang dokumen (Pengadaan Langsung dan/atau Tender) yang akan diterbitkan nomornya';
  const allBtn=document.querySelector('#pn-doc-overlay .pn-check-all'); if(allBtn) allBtn.textContent='Pilih Semua';
  pnDocUpdateCount();
}
/* Snapshot centang saat modal dibuka (untuk fungsi Batal) */
let pnDocSnapshot=null;
function pnDocModalOpen(){
  pnDocSnapshot=[...document.querySelectorAll('.pn-doc-check')].map(b=>b.checked);
  const ov=document.getElementById('pn-doc-overlay'); if(ov) ov.classList.add('show');
}
/* Simpan: minimal satu dokumen harus dicentang. Jika tidak, tampilkan pesan gagal
   dan tetap berada di halaman Pilih Dokumen (modal tidak ditutup). */
function pnDocModalSave(){
  const checked=document.querySelectorAll('.pn-doc-check:checked').length;
  if(!checked){ toast('Data gagal disimpan : Pilih salah satu dokumen','err'); return; }
  pnDocUpdateCount();
  const ov=document.getElementById('pn-doc-overlay'); if(ov) ov.classList.remove('show');
}
/* Batal: kembalikan centang ke kondisi saat modal dibuka, lalu tutup (tanpa notifikasi) */
function pnDocModalCancel(){
  const boxes=[...document.querySelectorAll('.pn-doc-check')];
  if(pnDocSnapshot) boxes.forEach((b,i)=>{ if(i<pnDocSnapshot.length) b.checked=pnDocSnapshot[i]; });
  const allOn=boxes.length>0 && boxes.every(b=>b.checked);
  const allBtn=document.querySelector('#pn-doc-overlay .pn-check-all'); if(allBtn) allBtn.textContent=allOn?'Kosongkan':'Pilih Semua';
  pnDocUpdateCount();
  const ov=document.getElementById('pn-doc-overlay'); if(ov) ov.classList.remove('show');
}
function pnDocModalHide(){ const ov=document.getElementById('pn-doc-overlay'); if(ov) ov.classList.remove('show'); }
function pnDocUpdateCount(){
  const n=document.querySelectorAll('.pn-doc-check:checked').length;
  const c=document.getElementById('pn-doc-count');
  if(c){ c.textContent=n; c.style.display = n>0 ? '' : 'none'; }
}
function pnDocToggleAll(){
  const boxes=[...document.querySelectorAll('.pn-doc-check')];
  const allOn=boxes.length>0 && boxes.every(b=>b.checked);
  boxes.forEach(b=>{ b.checked=!allOn; });
  const btn=document.querySelector('.pn-check-all'); if(btn) btn.textContent=allOn?'Pilih Semua':'Kosongkan';
  pnDocUpdateCount();
}
/* Tautkan Data Pekerjaan ke halaman Ambil Nomor → nama pekerjaan dikunci agar
   PERSIS sama dengan yang dipakai di Rekap HPS, sehingga nomor HPS yang diambil di
   sini otomatis terhubung ke pekerjaan tersebut pada Rekap HPS (dicocokkan by nama). */
function pnApplyDp(rec){
  if(!rec) return;
  const kv=(document.getElementById('pn-uni-klas')||{}).value||'';
  pnState.ambil.dpId=String(rec.id);
  pnState.ambil.dpNama=rec.nama_pekerjaan||((rec.state&&rec.state.info&&rec.state.info.nama))||'';
  renderPnAmbil();
  const kEl=document.getElementById('pn-uni-klas'); if(kEl && kv) kEl.value=kv;
  toast('Data pekerjaan berhasil diterapkan','ok');
}
function pnLepasDp(){
  const kv=(document.getElementById('pn-uni-klas')||{}).value||'';
  delete pnState.ambil.dpId; delete pnState.ambil.dpNama;
  renderPnAmbil();
  const kEl=document.getElementById('pn-uni-klas'); if(kEl && kv) kEl.value=kv;
  toast('Pilihan pekerjaan dibatalkan','ok');
}
function pnAmbilUnifiedFormHtml(){
  const klasOpts   = PN_KLAS_OPTS.map(o=>'<option value="'+o.kode+'">'+o.label+'</option>').join('');
  const linked = !!(pnState.ambil && pnState.ambil.dpId);
  const dpNama = linked ? (pnState.ambil.dpNama||'') : '';
  const namaField = linked
    ? '<input id="pn-uni-nama" type="text" class="rho-input-locked" value="'+fkEsc(dpNama)+'" readonly title="Nama mengikuti Data Pekerjaan terpilih">'
    : '<input id="pn-uni-nama" type="text">';
  return '' +
  '<div class="form-card">' +
    '<div class="form-section-title">'+KR_SECTION_ICON+'Data Pekerjaan'+dpPickBtnHtml('pn')+'</div>' +
    '<div class="form-flow" style="--cols:3">' +
      '<div class="field"><label>Nama Pekerjaan <span class="req">*</span></label>'+namaField+'</div>' +
      '<div class="field"><label>Kode Klasifikasi <span class="req">*</span></label><select id="pn-uni-klas"><option value="">— Pilih —</option>'+klasOpts+'</select></div>' +
      '<div class="field pn-doc-bar-field"><label>&nbsp;</label>' +
        '<div class="pn-doc-bar">' +
          '<button type="button" class="btn btn-teal pn-doc-toggle" id="pn-doc-toggle" onclick="pnDocModalOpen()">' +
            PN_DOC_ICON+'<span>Dokumen</span>' +
            '<span class="pn-doc-count" id="pn-doc-count" style="display:none">0</span>' +
            '<svg class="pn-doc-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg>' +
          '</button>' +
          '<button class="btn btn-indigo pn-doc-save" type="button" onclick="pnAmbil()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>Ambil Nomor</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div id="pn-ambil-result"></div>' +
  '<div class="jp-actions" style="justify-content:flex-end;margin-top:14px">' +
    '<button class="btn btn-red" onclick="pnAmbilBatalClick()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg> Batal</button>' +
  '</div>';
}
/* Tombol Batal pada Ambil Nomor — minta konfirmasi, kosongkan isian formulir,
   lalu kembali ke halaman Lihat Nomor. Nomor yang SUDAH diterbitkan tetap
   tersimpan dan tidak terpengaruh. */
function pnAmbilBatalClick(){
  openConfirm({
    icon:'back', title:'Batal',
    text:'Apakah anda yakin ingin membatalkan? Isian formulir Ambil Nomor akan dikosongkan (nomor yang sudah diterbitkan tetap tersimpan).',
    onYes:function(){
      delete pnState.ambil.dpId; delete pnState.ambil.dpNama;
      pnState.lastResult=null;
      const nEl=document.getElementById('pn-uni-nama'); if(nEl) nEl.value='';
      const kEl=document.getElementById('pn-uni-klas'); if(kEl) kEl.value='';
      document.querySelectorAll('.pn-doc-check').forEach(function(c){ c.checked=false; });
      if(typeof pnDocUpdateCount==='function'){ try{ pnDocUpdateCount(); }catch(e){} }
      openPnLihat('pl');
    }
  });
}
function pnPendingHtml(label){
  return '<div class="panel pn-pending"><div class="empty">' + PN_WARN_ICON +
    '<div class="pn-pending-title">Penomoran ' + fkEsc(label) + ' belum dikonfigurasi</div>' +
    '<div class="pn-pending-desc">Daftar jenis dokumen dan kode penomoran untuk ' + fkEsc(label) +
    ' belum ditentukan. Silakan beri tahu daftar dokumen beserta kodenya (seperti HPS, BAP.PL, BAPP.PL, dst pada Pengadaan Langsung) agar menu ini dapat diaktifkan.</div>' +
    '</div></div>';
}

/* Cari record pekerjaan yang sudah ada (berdasarkan nama pekerjaan, modul & tahun).
   Nomor dokumen untuk nama pekerjaan yang sama akan ditumpuk pada baris tersebut. */
function pnFindWork(modul, nama, year){
  const key=String(nama||'').trim().toLowerCase();
  return records_penetapan.find(r=>
    r.modul===modul &&
    Number(r.tahun)===Number(year) &&
    String(r.nama_pekerjaan||'').trim().toLowerCase()===key
  );
}
/* ---- Ambil nomor (Pengadaan Langsung) — hanya dokumen yang dicentang ---- */
/* ---- Ambil nomor (gabungan Pengadaan Langsung + Tender) ----
   Dokumen yang dicentang dipisahkan menurut modul asalnya (PL / Tender),
   lalu tiap kelompok diterbitkan nomornya pada baris pekerjaan modul tersebut. */
function pnDocModulOf(key){
  if((PN_DOCS.pl||[]).some(d=>d.key===key)) return 'pl';
  if((PN_DOCS.tender||[]).some(d=>d.key===key)) return 'tender';
  return null;
}
async function pnIssueForModul(modul, nama, klas, checkedKeys, year, unit, today){
  const existing=pnFindWork(modul, nama, year);
  let klasUsed=klas;
  const usePj = (modul==='pl') && checkedKeys.includes('BAP');
  if(existing){
    const exKlas=String(existing.kode_klasifikasi||'');
    if(exKlas && exKlas!==klas){ const e=new Error('kode klasifikasi'); e.pnKlas=true; throw e; }
    klasUsed=exKlas || klas;
    const existingKeys=new Set((Array.isArray(existing.dokumen)?existing.dokumen:[]).map(d=>String(d.key)));
    const dup=checkedKeys.some(k=>existingKeys.has(String(k)));
    if(dup){ const e=new Error('data sudah ada'); e.pnDup=true; throw e; }
  }
  const seqCache={};
  const getSeq=(counter)=>{ if(seqCache[counter]==null) seqCache[counter]=pnNextSeq(modul,counter,year); return seqCache[counter]; };
  const newDocs=(PN_DOCS[modul]||[])
    .filter(d=> checkedKeys.includes(d.key))
    .map(d=>{
      const seq=getSeq(pnSeqCounter(d));
      return {key:d.key, code:d.code, label:d.label, seq, no:pnFormatNo(seq,d.code,klasUsed,unit,year),
              tgl_terbit:today, file:null};
    });
  if(existing){
    const merged=(Array.isArray(existing.dokumen)?existing.dokumen.slice():[]).concat(newDocs);
    if(usePj) existing.menggunakan_penjelasan=true;
    await StorePenetapan.setDokumen(existing.id, merged);
    existing.dokumen=merged;
    return Object.assign({modul}, existing);
  }else{
    const row={ modul, tahun:year, tgl_terbit:today,
      nama_pekerjaan:nama, kode_klasifikasi:klas, unit,
      menggunakan_penjelasan:usePj, dokumen:newDocs };
    const saved=await StorePenetapan.insert(row);
    if(saved) records_penetapan.unshift(saved); else records_penetapan.unshift(row);
    return saved ? Object.assign({modul}, saved) : Object.assign({modul}, row);
  }
}
async function pnAmbil(){
  if(!requireInput()) return;
  const el = id => document.getElementById(id);
  const nama = (el('pn-uni-nama') ? el('pn-uni-nama').value : '').trim();
  const klas = el('pn-uni-klas') ? el('pn-uni-klas').value : '';
  const checkedKeys = [...document.querySelectorAll('.pn-doc-check:checked')].map(b=>b.value);
  if(!nama){ toast('Nama Pekerjaan wajib diisi','warn'); el('pn-uni-nama') && el('pn-uni-nama').focus(); return; }
  if(!klas){ toast('Kode Klasifikasi wajib dipilih','warn'); return; }
  if(!checkedKeys.length){ toast('Pilih minimal satu dokumen untuk diterbitkan nomornya','warn'); return; }
  const plKeys=checkedKeys.filter(k=>pnDocModulOf(k)==='pl');
  const tnKeys=checkedKeys.filter(k=>pnDocModulOf(k)==='tender');

  let ok=false; const results=[];
  try{
    await withActionLoader('Menetapkan nomor', async()=>{
      await refreshDataPenetapan();           // sinkron dulu agar nomor tidak bentrok
      const year=pnYear(), unit=PN_UNIT, today=pnTodayISO();
      if(plKeys.length) results.push(await pnIssueForModul('pl', nama, klas, plKeys, year, unit, today));
      if(tnKeys.length) results.push(await pnIssueForModul('tender', nama, klas, tnKeys, year, unit, today));
    });
    ok=true;
  }catch(err){
    if(err && err.pnKlas){ toast('Gagal menetapkan nomor; kode klasifikasi','err'); return; }
    if(err && err.pnDup){ toast('Gagal menetapkan nomor; data sudah ada','err'); return; }
    console.error(err); toast('Gagal menetapkan nomor: '+errMsg(err),'err'); return;
  }
  if(!ok) return;
  toast('Nomor berhasil ditetapkan','ok');
  // kosongkan isian agar siap penetapan berikutnya (nama dipertahankan bila
  // sedang tertaut ke Data Pekerjaan agar tautan ke Rekap HPS tetap konsisten)
  const pnLinked=!!(pnState.ambil && pnState.ambil.dpId);
  if(el('pn-uni-nama') && !pnLinked) el('pn-uni-nama').value='';
  if(el('pn-uni-klas')) el('pn-uni-klas').value='';
  document.querySelectorAll('.pn-doc-check').forEach(b=>b.checked=false);
  const allBtn=document.querySelector('.pn-check-all'); if(allBtn) allBtn.textContent='Pilih Semua';
  pnDocUpdateCount();
  pnDocModalHide();
  pnState.lastResult = results;
  pnRenderResult(results);
}
function pnRenderResult(res){
  const box=document.getElementById('pn-ambil-result'); if(!box || !res) return;
  const list = Array.isArray(res) ? res.filter(Boolean) : [res];
  if(!list.length) return;
  const cardFor=(r)=>{
    const docs=Array.isArray(r.dokumen)?r.dokumen:[];
    // hanya tampilkan dokumen dari penetapan terbaru? Tampilkan seluruh dokumen pada baris tsb.
    const items=docs.map(d=>
      '<div class="pn-doc-card">' +
        '<div class="pn-doc-ic">'+PN_DOC_ICON+'</div>' +
        '<div class="pn-doc-meta"><div class="pn-doc-label">'+fkEsc(d.label)+'</div><div class="pn-doc-no">'+fkEsc(d.no)+'</div></div>' +
        '<button class="pn-copy" title="Salin" onclick="pnCopy(this,\''+fkEsc(d.no)+'\')">'+PN_COPY_ICON+'</button>' +
      '</div>').join('');
    const modLabel = (PN_MODULES[r.modul] ? PN_MODULES[r.modul].label : r.modul);
    return '<div class="form-card pn-result">' +
        '<div class="form-section-title">'+PN_CHECK_ICON+'Nomor Ditetapkan — '+fkEsc(modLabel)+' · '+fkEsc(r.nama_pekerjaan||'')+'</div>' +
        items +
      '</div>';
  };
  box.innerHTML = list.map(cardFor).join('');
  box.scrollIntoView({behavior:'smooth', block:'nearest'});
}
function pnCopy(btn, text){
  const done=()=>{ if(btn){ btn.classList.add('pn-copied'); setTimeout(()=>btn.classList.remove('pn-copied'),1200); } toast('Nomor disalin','ok'); };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(()=>pnFallbackCopy(text,done));
  }else pnFallbackCopy(text,done);
}
function pnFallbackCopy(text, cb){
  try{ const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.focus(); ta.select(); document.execCommand('copy'); ta.remove(); cb&&cb(); }catch(e){}
}

/* ---- Halaman Lihat Nomor ---- */
function pnClearLihatFilters(){
  const s=document.getElementById('pn-lihat-search'); if(s) s.value='';
}
function pnFilterLihat(){ pnState.lihat.page=1; renderPnLihat(); }
function pnResetLihat(){ pnClearLihatFilters(); pnState.lihat.page=1; renderPnLihat(); }
function pnLihatRows(){
  // Gabungan seluruh modul (Pengadaan Langsung + Tender)
  let rows=(records_penetapan||[]).slice();
  const fs=(document.getElementById('pn-lihat-search')?.value||'').toLowerCase().trim();
  if(fs) rows=rows.filter(r=>String(r.nama_pekerjaan||'').toLowerCase().includes(fs));
  return rows;
}
/* Badge metode pengadaan untuk tabel Lihat Nomor gabungan */
function pnMetodeBadge(modul){
  const isT = String(modul)==='tender';
  return '<span class="pn-metode-badge '+(isT?'pn-badge-tender':'pn-badge-pl')+'">'+
    (isT?'Tender':'Pengadaan Langsung')+'</span>';
}
function renderPnLihat(){
  const sec=document.getElementById('view-pn-lihat');
  // Tabel gabungan memakai layout auto agar label jenis dokumen (PL & Tender) tidak terpotong.
  if(sec){ sec.classList.add('pn-modul-tender'); sec.classList.remove('pn-modul-pl'); }
  const tb=document.getElementById('pn-lihat-body');
  const pg=document.getElementById('pn-lihat-pagination');
  const cEl=document.getElementById('pn-lihat-count');
  if(!tb) return;
  const rows=pnLihatRows();
  if(cEl) cEl.textContent=rows.length;
  const total=rows.length;
  if(total===0){ tb.innerHTML=pnEmptyRow(); if(pg) pg.innerHTML=''; return; }
  const st=pnState.lihat;
  const totalPages=Math.max(1,Math.ceil(total/PN_PAGE_SIZE));
  if(st.page>totalPages) st.page=totalPages;
  if(st.page<1) st.page=1;
  const start=(st.page-1)*PN_PAGE_SIZE;
  const pageRows=rows.slice(start,start+PN_PAGE_SIZE);
  tb.innerHTML=pageRows.map((r,i)=>{
    const nama=r.nama_pekerjaan||'—';
    return '<tr>' +
      '<td class="col-no">'+(start+i+1)+'</td>' +
      '<td class="wrap-cell col-nama-freeze">'+fkEsc(nama)+'</td>' +
      '<td class="pn-col-jenis">'+pnJenisCellHtml(r)+'</td>' +
      '<td class="pn-col-nomor">'+pnNomorCellHtml(r)+'</td>' +
      '<td class="pn-col-tgl">'+pnTglCellHtml(r)+'</td>' +
      '<td class="pn-col-aksi">'+pnActionCellHtml(r)+'</td>' +
    '</tr>';
  }).join('');
  revealTbody(tb);
  pnRenderPagination(st.page, totalPages, pg);
}
function pnEmptyRow(){
  return '<tr><td colspan="6"><div class="empty">'+PN_HASH_ICON+'<div>Data tidak tersedia</div></div></td></tr>';
}
function pnJenisCellHtml(r){
  const docs=Array.isArray(r.dokumen)?r.dokumen:[];
  if(!docs.length) return '—';
  return '<div class="pn-nomor-list">'+docs.map(d=>
    '<div class="pn-nomor-item pn-jenis-item">' +
      '<span class="pn-nomor-jenis">'+fkEsc(PN_JENIS[d.key]||d.label||'')+'</span>' +
    '</div>').join('')+'</div>';
}
function pnNomorCellHtml(r){
  const docs=Array.isArray(r.dokumen)?r.dokumen:[];
  if(!docs.length) return '—';
  return '<div class="pn-nomor-list">'+docs.map(d=>
    '<div class="pn-nomor-item">' +
      '<span class="pn-nomor-val">'+fkEsc(d.no)+'</span>' +
      '<button class="pn-copy" title="Salin" onclick="pnCopy(this,\''+fkEsc(d.no)+'\')">'+PN_COPY_ICON+'</button>' +
    '</div>').join('')+'</div>';
}
/* Tgl. Terbit per masing-masing nomor dokumen */
function pnTglCellHtml(r){
  const docs=Array.isArray(r.dokumen)?r.dokumen:[];
  if(!docs.length) return '—';
  return '<div class="pn-nomor-list">'+docs.map(d=>{
    const tgl=fmtDate(d.tgl_terbit!=null?d.tgl_terbit:r.tgl_terbit)||'—';
    return '<div class="pn-nomor-item pn-tgl-item"><span class="pn-tgl-val">'+tgl+'</span></div>';
  }).join('')+'</div>';
}
/* Aksi (unggah/lihat/unduh/hapus) per masing-masing nomor dokumen */
function pnActionCellHtml(r){
  const docs=Array.isArray(r.dokumen)?r.dokumen:[];
  if(!docs.length) return '—';
  const allow=canInput();
  const upIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v13"/></svg>';
  const eyeIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
  const delIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>';
  const rid=fkEsc(String(r.id));
  return '<div class="pn-nomor-list">'+docs.map(d=>{
    const dk=fkEsc(String(d.key));
    const hasFile=!!(d.file && d.file.nama_file);
    const up = allow ? '<button class="act act-up" title="'+(hasFile?'Ganti File':'Unggah File')+'" onclick="pnUpload(\''+rid+'\',\''+dk+'\',this)">'+upIcon+'</button>' : '';
    const lihat = hasFile
      ? '<button class="act act-view" title="Lihat File" onclick="pnPreview(\''+rid+'\',\''+dk+'\')">'+eyeIcon+'</button>'
      : '<button class="act act-view" title="Belum ada file" disabled>'+eyeIcon+'</button>';
    const del = allow ? '<button class="act act-del" title="Hapus Nomor" onclick="pnDelete(\''+rid+'\',\''+dk+'\',this)">'+delIcon+'</button>' : '';
    return '<div class="pn-nomor-item pn-aksi-item"><div class="pn-actions">'+up+lihat+del+'</div></div>';
  }).join('')+'</div>';
}
/* Cari dokumen dalam record berdasarkan key */
function pnFindDoc(r, key){
  const docs=Array.isArray(r.dokumen)?r.dokumen:[];
  return docs.find(d=>String(d.key)===String(key));
}
function pnRenderPagination(page, totalPages, el){
  if(!el) return;
  if(totalPages<=1){ el.innerHTML=''; return; }
  const want=new Set([1,totalPages,page-1,page,page+1]);
  const list=[...want].filter(p=>p>=1&&p<=totalPages).sort((a,b)=>a-b);
  let html='<button class="pg-btn" '+(page===1?'disabled':'')+' onclick="pnGoToLihatPage('+(page-1)+')">‹ Sebelumnya</button>';
  let prev=0;
  list.forEach(p=>{
    if(p-prev>1) html+='<span class="pg-ellipsis">…</span>';
    html+='<button class="pg-btn pg-num '+(p===page?'active':'')+'" onclick="pnGoToLihatPage('+p+')">'+p+'</button>';
    prev=p;
  });
  html+='<button class="pg-btn" '+(page===totalPages?'disabled':'')+' onclick="pnGoToLihatPage('+(page+1)+')">Berikutnya ›</button>';
  el.innerHTML=html;
}
function pnGoToLihatPage(p){
  pnState.lihat.page=p;
  withQuickLoader('Memuat', ()=>{ renderPnLihat(); document.querySelector('#view-pn-lihat .panel')?.scrollIntoView({behavior:'smooth',block:'nearest'}); }, 480);
}

/* ---- Lihat / Pratinjau file lampiran ---- */
let pnPreviewCtx=null;   // {url, name}
/* Ambil array dokumen terkini (dari cache; muat dari server bila file belum ter-cache) */
async function pnEnsureDokumen(r){
  const docs=Array.isArray(r.dokumen)?r.dokumen:[];
  const needFetch=docs.some(d=>d.file && d.file.nama_file && !d.file.data_base64);
  if(needFetch){
    const fresh=await StorePenetapan.getDokumen(r.id);
    if(Array.isArray(fresh)){ r.dokumen=fresh; return fresh; }
  }
  return docs;
}
async function pnPreview(id, key){
  const r=records_penetapan.find(x=>String(x.id)===String(id)); if(!r) return;
  let d=pnFindDoc(r,key);
  if(!d || !d.file || !d.file.nama_file){ toast('Belum ada file untuk dipratinjau','warn'); return; }
  const titleEl=document.getElementById('pn-preview-title');
  const bodyEl=document.getElementById('pn-preview-body');
  if(titleEl) titleEl.textContent=d.file.nama_file;
  pnCleanupPreview();
  const _mdl=document.querySelector('#pn-preview-overlay .pn-preview-modal'); if(_mdl) _mdl.classList.remove('is-max');
  pnPreviewResetMaxBtn();
  if(bodyEl) bodyEl.innerHTML='<div class="pn-preview-nofile">Memuat pratinjau…</div>';
  document.getElementById('pn-preview-overlay').classList.add('show');
  try{
    await pnEnsureDokumen(r);
    d=pnFindDoc(r,key);
    const f=d && d.file;
    if(!f || !f.data_base64){ if(bodyEl) bodyEl.innerHTML=pnPreviewNoFileHtml(f&&f.nama_file,'File tidak tersedia.'); return; }
    const mime=f.mime||'application/octet-stream';
    const url=URL.createObjectURL(fkB64ToBlob(f.data_base64, mime));
    pnPreviewCtx={url, name:f.nama_file||'file'};
    const nm=(f.nama_file||'').toLowerCase();
    const isPdf=mime.includes('pdf')||nm.endsWith('.pdf');
    const isImg=mime.indexOf('image/')===0||/\.(png|jpe?g|gif|webp|bmp)$/.test(nm);
    if(!bodyEl) return;
    if(isPdf){ bodyEl.innerHTML='<iframe title="Pratinjau PDF"></iframe>'; bodyEl.querySelector('iframe').src=url; }
    else if(isImg){ bodyEl.innerHTML='<img alt="Pratinjau gambar">'; bodyEl.querySelector('img').src=url; }
    else{ bodyEl.innerHTML=pnPreviewNoFileHtml(pnPreviewCtx.name,'Jenis file ini tidak dapat dipratinjau. Silakan unduh untuk membukanya.'); }
  }catch(err){ console.error('pnPreview:',err); if(bodyEl) bodyEl.innerHTML=pnPreviewNoFileHtml(d&&d.file&&d.file.nama_file,'Gagal memuat file: '+errMsg(err)); }
}
function pnPreviewNoFileHtml(name, msg){
  return '<div class="pn-preview-nofile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg><div class="fn">'+fkEsc(name||'')+'</div><div style="margin-top:6px;font-size:11.5px">'+fkEsc(msg||'')+'</div></div>';
}
function pnPreviewToggleMax(){
  const modal=document.querySelector('#pn-preview-overlay .pn-preview-modal');
  if(!modal) return;
  const on=modal.classList.toggle('is-max');
  const label=document.getElementById('pn-preview-max-label');
  if(label) label.textContent = on ? 'Perkecil' : 'Perbesar';
  const icon=document.getElementById('pn-preview-max-icon');
  if(icon){
    icon.innerHTML = on
      ? '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>'   // minimize
      : '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>';  // maximize
  }
}
function pnCleanupPreview(){ if(pnPreviewCtx && pnPreviewCtx.url){ try{ URL.revokeObjectURL(pnPreviewCtx.url); }catch(e){} } pnPreviewCtx=null; }
function pnPreviewResetMaxBtn(){
  const lbl=document.getElementById('pn-preview-max-label'); if(lbl) lbl.textContent='Perbesar';
  const icon=document.getElementById('pn-preview-max-icon');
  if(icon) icon.innerHTML='<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>';  // maximize
}
function closePnPreview(){ const ov=document.getElementById('pn-preview-overlay'); if(ov) ov.classList.remove('show'); const modal=ov&&ov.querySelector('.pn-preview-modal'); if(modal) modal.classList.remove('is-max'); pnPreviewResetMaxBtn(); const b=document.getElementById('pn-preview-body'); if(b){ b.innerHTML=''; b.classList.remove('fkl-preview-body'); b.classList.remove('has-tabs'); } const fp=document.getElementById('fkl-preview-print'); if(fp) fp.remove(); const pp=document.getElementById('pnw-preview-print'); if(pp) pp.remove(); const rp=document.getElementById('rho-preview-print'); if(rp) rp.remove(); const hp=document.getElementById('hps-preview-print'); if(hp) hp.remove(); const cp=document.getElementById('hpsc-preview-print'); if(cp) cp.remove(); const ap=document.getElementById('ana-preview-print'); if(ap) ap.remove(); const sp=document.getElementById('spk-preview-print'); if(sp) sp.remove(); if(typeof fklPreviewState!=='undefined') fklPreviewState=null; if(typeof pnwPreviewState!=='undefined') pnwPreviewState=null; if(typeof rhoPreviewState!=='undefined') rhoPreviewState=null; if(typeof hpsPreviewState!=='undefined') hpsPreviewState=null; if(typeof anaPreviewState!=='undefined') anaPreviewState=null; pnCleanupPreview(); }

/* ---- Upload / Download / Hapus lampiran (per masing-masing nomor dokumen) ---- */
let pnUploadCtx=null;
function pnUpload(id, key, btn){
  if(!requireInput()) return;
  const inp=document.getElementById('pn-file-input'); if(!inp) return;
  pnUploadCtx={id, key, btn}; inp.value=''; inp.click();
}
async function pnHandleFileSelected(file){
  const ctx=pnUploadCtx; pnUploadCtx=null;
  if(!ctx || !file) return;
  const {id, key, btn}=ctx;
  const isPdf = (file.type==='application/pdf') || /\.pdf$/i.test(file.name||'');
  if(!isPdf){ toast('File harus dalam bentuk PDF','warn'); return; }
  if(file.size > PN_MAX_MB*1048576){ toast('Ukuran file melebihi batas '+PN_MAX_MB+' MB','warn'); return; }
  const r=records_penetapan.find(x=>String(x.id)===String(id));
  if(!r){ toast('Data tidak ditemukan','warn'); return; }
  if(btn) btn.classList.add('is-busy');
  pnUploadProgressOpen(file.name);
  // progres semu untuk fase simpan (menuju 95%)
  let creep=null;
  try{
    // Fase baca file: 0 -> 70%
    const b64=await fkFileToBase64Progress(file, frac=>{ pnUploadProgressSet(frac*70); });
    pnUploadProgressSet(72);
    // pastikan array dokumen lengkap (agar file lain tidak hilang saat update)
    await pnEnsureDokumen(r);
    const docs=(Array.isArray(r.dokumen)?r.dokumen:[]).map(d=>{
      if(String(d.key)!==String(key)) return d;
      return Object.assign({}, d, { file:{ nama_file:file.name, mime:file.type||'application/pdf', ukuran:file.size, data_base64:b64 } });
    });
    // fase simpan: naikkan perlahan 72 -> 95 selama menunggu server
    let p=72; creep=setInterval(()=>{ p=Math.min(95,p+2); pnUploadProgressSet(p); }, 120);
    await StorePenetapan.setDokumen(id, docs);
    clearInterval(creep); creep=null;
    r.dokumen=docs;
    pnUploadProgressDone(()=>{ toast('File berhasil diunggah','ok'); renderPnLihat(); });
  }catch(err){
    if(creep) clearInterval(creep);
    pnUploadProgressClose();
    console.error(err); toast('Gagal mengunggah file: '+errMsg(err),'err');
    if(btn) btn.classList.remove('is-busy');
  }
}
async function pnDownload(id, key, btn){
  if(btn) btn.classList.add('is-busy');
  try{
    const r=records_penetapan.find(x=>String(x.id)===String(id));
    if(!r){ toast('Data tidak ditemukan','warn'); return; }
    await pnEnsureDokumen(r);
    const d=pnFindDoc(r,key);
    const f=d && d.file;
    if(!f || !f.data_base64){ toast('File tidak tersedia','warn'); return; }
    const blob=fkB64ToBlob(f.data_base64, f.mime);
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=f.nama_file||'lampiran-penetapan';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
  }catch(err){ console.error('pnDownload:', err); toast('Gagal mengunduh file: '+errMsg(err),'warn'); }
  finally{ if(btn) btn.classList.remove('is-busy'); }
}
/* Hapus satu nomor dokumen. Nomor yang dihapus kembali tersedia (gap-fill).
   Jika dokumen terakhir dalam record, seluruh record ikut terhapus. */
function pnDelete(id, key, btn){
  if(!requireInput()) return;
  const r=records_penetapan.find(x=>String(x.id)===String(id));
  if(!r){ toast('Data tidak ditemukan','warn'); return; }
  const d=pnFindDoc(r,key);
  const docs=Array.isArray(r.dokumen)?r.dokumen:[];
  const jenis=d ? (PN_JENIS[d.key]||d.label||'') : '';
  const isLast=docs.length<=1;
  openConfirm({
    icon:'del', title:'Hapus Nomor',
    text:'Apakah anda yakin ingin menghapus nomor dokumen?',
    onYes:async()=>{
      try{
        if(isLast){
          await withActionLoader('Menghapus', async()=>{ await StorePenetapan.remove(id); });
          records_penetapan=records_penetapan.filter(x=>String(x.id)!==String(id));
        }else{
          await pnEnsureDokumen(r);
          const next=(Array.isArray(r.dokumen)?r.dokumen:[]).filter(x=>String(x.key)!==String(key));
          await withActionLoader('Menghapus', async()=>{ await StorePenetapan.setDokumen(id, next); });
          r.dokumen=next;
        }
      }catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'warn'); return; }
      toast('Nomor berhasil dihapus','ok');
      renderPnLihat();
    }
  });
}
(function(){
  const inp=document.getElementById('pn-file-input');
  if(inp) inp.addEventListener('change', e=>{ const f=e.target.files&&e.target.files[0]; pnHandleFileSelected(f); });
})();


/* (Modul Pembuatan Kontrak dihapus) */

