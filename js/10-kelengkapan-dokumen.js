/* ===== 10-kelengkapan-dokumen.js (bagian 10/15, baris 8032-9191 dari app.js asli) =====
   Form kelengkapan dokumen (FKL), shell dokumen bersama, lembar A4, font dokumen cetak.
   WAJIB dimuat berurutan 01 s.d. 15 — jangan ubah urutannya. ===== */
/* ==================================================================
   FORM — KELENGKAPAN DOKUMEN PENGADAAN (Pengadaan Langsung & Tender)
   Alur wizard 3 langkah:
     1) Data Pekerjaan  → [Batal] [Selanjutnya]
     2) Pilih Dokumen (gabungan Wajib+Tambahan) → [Batal] [Kembali] [Selanjutnya]
     3) Kelengkapan Dokumen (Ada / Tidak Ada) → [Batal] [Sebelumnya] [Simpan & Lihat]
   Simpan & Lihat → Pratinjau PDF elegan:
     "FORM PEMERIKSAAN KELENGKAPAN DOKUMEN PENGADAAN"
   ================================================================== */
const FKL_JENIS_ANGGARAN = ['Investasi','Operasi'];
const FKL_METODE = ['Pengadaan Langsung','Tender Terbuka','Tender Terbatas','Seleksi Umum','Seleksi Terbatas','Penunjukan Langsung','Tender Cepat'];
const FKL_DOCS = {
  pl:{ label:'Pengadaan Langsung',
    wajib:[
      'ND Pelaksanaan Pengadaan',
      'Dokumen Rencana Pengadaan (DRP)',
      'Dokumen TOR/KAK',
      'Dokumen RAB',
      'Surat Anggaran',
      'Risiko Pekerjaan',
      'Pakta Integritas Pengguna',
      'Pakta Integritas Direksi Pekerjaan'
    ],
    tambahan:[
      'Spesifikasi Teknis',
      'Gambar Pekerjaan',
      'Referensi Harga',
      'Kajian Kelayakan Proyek',
      'Kajian Risiko'
    ]
  },
  tender:{ label:'Tender',
    wajib:[
      'Inisialisasi Pengadaan',
      'ND Pelaksanaan Pengadaan',
      'ND Perencanaan Pengadaan',
      'Dokumen Rencana Pengadaan (DRP)',
      'Dokumen Kualifikasi',
      'Dokumen Tender/RKS',
      'Dokumen TOR/KAK',
      'Dokumen RAB',
      'Dokumen HPE',
      'Surat Anggaran',
      'Risiko Pekerjaan',
      'Pakta Integritas Pengguna',
      'Pakta Integritas Direksi Pekerjaan'
    ],
    tambahan:[
      'Spesifikasi Teknis',
      'Gambar Pekerjaan',
      'Referensi Harga',
      'Kajian Kelayakan Proyek',
      'Kajian Risiko'
    ]
  }
};
/* Gabungan dokumen (Wajib + Tambahan) untuk langkah "Pilih Dokumen".
   Diambil dari modul Tender sesuai permintaan (superset terlengkap). */
function fklDocPool(){
  const t = FKL_DOCS.tender;
  const seen = {}; const pool = [];
  t.wajib.concat(t.tambahan).forEach(nama=>{
    if(!seen[nama]){ seen[nama]=true; pool.push(nama); }
  });
  return pool;
}
const FKL_INFO_FIELDS=[
  {key:'nama',          label:'Nama Pekerjaan',      type:'text', span:2},
  {key:'lokasi',        label:'Lokasi Pekerjaan',    type:'text', span:2},
  {key:'nilai',         label:'Nilai Pekerjaan',     type:'num'},
  {key:'no_anggaran',   label:'No. Anggaran',        type:'text'},
  {key:'tgl_anggaran',  label:'Tgl. Anggaran',       type:'date'},
  {key:'jenis_anggaran',label:'Jenis Anggaran',      type:'select', options:FKL_JENIS_ANGGARAN},
  {key:'metode',        label:'Metode Pengadaan',    type:'select', span:2, options:FKL_METODE},
  {key:'menyerahkan',   label:'Yang Menyerahkan',    type:'text', ph:'Nama pegawai'},
  {key:'menerima',      label:'Yang Menerima',       type:'text', ph:'Nama pegawai'},
  {key:'tgl_terima',    label:'Tgl. Terima Dokumen', type:'date'}
];
let fklModul='pl';
let fklStep=1;               // 1 = Data, 2 = Pilih Dokumen, 3 = Kelengkapan
const FKL_STATE_KEY='fkl_state_v2';
/* State per modul:
   info   : { key: value }
   pilih  : { "Nama Dokumen": true|false }   (dipilih untuk diperiksa)
   ada    : { "Nama Dokumen": true|false }   (hasil pemeriksaan: Ada / Tidak Ada) */
function fklBlankState(){ return { info:{}, pilih:{}, ada:{} }; }
let fklState = { pl:fklBlankState(), tender:fklBlankState() };
/* Buffer wizard bersifat transien: disimpan di sessionStorage (ikut hilang saat
   tab ditutup), konsisten dengan draft form lain. TIDAK memakai localStorage. */
(function fklLoadState(){
  try{ const raw=ssGet(FKL_STATE_KEY); if(raw){ const o=JSON.parse(raw); if(o&&o.pl&&o.tender) fklState=o; } }catch(e){}
})();
function fklSaveState(){ try{ ssSet(FKL_STATE_KEY, JSON.stringify(fklState)); }catch(e){} }

/* ==================================================================
   Penyimpanan data Kelengkapan — SEPENUHNYA di Supabase
   (tabel `kelengkapan_dokumen`). Tidak ada fallback localStorage.
   ================================================================== */
const FKL_TABLE='kelengkapan_dokumen';
const FKL_RECS_KEY='fkl_records_v1';   // kunci lama (hanya untuk migrasi & pembersihan)
let records_kelengkapan = [];
let fklEditId = null;          // id record yang sedang diubah (null = tambah baru)
let fklPreviewState = null;    // state khusus untuk pratinjau record tersimpan

function fklSupaReady(){ return !!(USE_SUPABASE && db); }

const StoreKelengkapan = {
  async list(){
    if(!fklSupaReady()) return [];
    const {data,error}=await db.from(FKL_TABLE).select('*').order('created_at',{ascending:false});
    if(error) throw error;
    return data||[];
  },
  async create(rec){
    if(!fklSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(FKL_TABLE).insert(rec).select();
    if(error) throw error; return data&&data[0];
  },
  async update(rid, rec){
    if(!fklSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(FKL_TABLE).update(rec).eq('id',rid);
    if(error) throw error;
  },
  async remove(rid){
    if(!fklSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(FKL_TABLE).delete().eq('id',rid);
    if(error) throw error;
  }
};

/* Pembersihan kunci lama: seluruh data kini di Supabase. Fungsi ini TIDAK
   membaca atau memindahkan data apa pun dari localStorage — hanya menghapus
   sisa kunci penyimpanan lokal versi lama agar tidak menumpuk. Aman & idempotent. */
async function fklMigrateLocalToSupabase(){
  try{
    localStorage.removeItem(FKL_RECS_KEY);   // 'fkl_records_v1' (Kelengkapan versi lama)
  }catch(e){}
}
async function refreshDataKelengkapan(){
  try{
    await fklMigrateLocalToSupabase();   // pindahkan sisa data lokal (jika ada) ke Supabase
    records_kelengkapan = await StoreKelengkapan.list();
  }catch(err){
    console.error(err); records_kelengkapan = records_kelengkapan||[];
    toast('Gagal memuat data Kelengkapan: '+errMsg(err),'err');
  }
}

/* ---- Input Data (wizard). editId opsional untuk mode ubah ---- */
function openFklInput(editId){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  fklPreviewState=null;
  if(editId){
    const rec=records_kelengkapan.find(r=>String(r.id)===String(editId));
    fklEditId = rec ? rec.id : null;
    fklState[fklModul] = rec ? fklRecordToState(rec) : fklBlankState();
  }else{
    fklEditId = null;
    fklState[fklModul] = fklBlankState();
    resetInputBaru('fkl');
  }
  fklSaveState();
  fklStep=1; showView('form-kelengkapan');
}
/* Alias lama */
function openFormKelengkapan(){ openFklInput(); }

/* ---- Lihat Data ---- */
function openFklView(){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  refreshDataKelengkapan().then(()=>showView('fkl-view'));
}
function openFormPembukaan(){ openPnwInput(); }

/* Konversi record tersimpan -> state wizard */
function fklRecordToState(rec){
  return {
    info: (rec && rec.info && typeof rec.info==='object') ? Object.assign({}, rec.info) : {},
    pilih:(rec && rec.pilih && typeof rec.pilih==='object') ? Object.assign({}, rec.pilih) : {},
    ada:  (rec && rec.ada && typeof rec.ada==='object') ? Object.assign({}, rec.ada) : {}
  };
}

function fklMarkActive(){
  document.querySelectorAll('.topnav-item[data-view="form-kelengkapan"]').forEach(b=>{
    b.classList.add('active');
  });
}

const FKL_SEC_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>';

/* ---------- Stepper header ---------- */
function fklStepperHtml(){
  const steps=[['1','Data Pekerjaan'],['2','Pilih Dokumen'],['3','Kelengkapan']];
  return '<div class="fkl-stepper">'+steps.map((s,i)=>{
    const n=i+1;
    const cls = n<fklStep ? 'done' : (n===fklStep ? 'active' : '');
    const mark = n<fklStep
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>'
      : s[0];
    const line = i<steps.length-1 ? '<div class="fkl-step-line '+(n<fklStep?'done':'')+'"></div>' : '';
    return '<div class="fkl-step '+cls+'"><div class="fkl-step-dot">'+mark+'</div><div class="fkl-step-name">'+s[1]+'</div></div>'+line;
  }).join('')+'</div>';
}

/* ---------- Field input ---------- */
const FKL_DP_LOCK_KEYS=['nama','lokasi','nilai','no_anggaran','tgl_anggaran','jenis_anggaran','metode'];
function fklIsLocked(key){ const st=fklState[fklModul]; return !!(st && st.info && st.info.dpId) && FKL_DP_LOCK_KEYS.indexOf(key)>=0; }
function fklInfoInputHtml(f){
  const id='fkl-'+f.key;
  const span=f.span?(' style="grid-column:span '+f.span+'"'):'';
  const locked=fklIsLocked(f.key); const dis=locked?' disabled':'';
  let ctl;
  if(f.type==='select') ctl='<select id="'+id+'"'+dis+' onchange="fklOnInfoChange()"><option value="">— Pilih —</option>'+(f.options||[]).map(o=>'<option>'+fkEsc(o)+'</option>').join('')+'</select>';
  else if(f.type==='num') ctl='<input id="'+id+'" type="text" inputmode="numeric" placeholder="Rp"'+dis+' oninput="onRupiahInput(this)" onchange="fklOnInfoChange()">';
  else if(f.type==='date') ctl='<input id="'+id+'" type="date"'+dis+' onchange="fklOnInfoChange()">';
  else ctl='<input id="'+id+'" type="text"'+dis+(f.ph?' placeholder="'+fkEsc(f.ph)+'"':'')+' oninput="fklOnInfoChange()">';
  return '<div class="field'+(locked?' is-locked':'')+'"'+span+'><label>'+fkEsc(f.label)+'</label>'+ctl+(locked?DP_LOCK_BADGE:'')+'</div>';
}

/* ---------- Langkah 2: pilih dokumen ---------- */
function fklPilihHtml(){
  const pool=fklDocPool(), st=fklState[fklModul];
  return pool.map((nama,i)=>{
    const on=!!st.pilih[nama];
    return '<label class="fkl-check">'+
      '<input type="checkbox" data-nama="'+fkEsc(nama)+'" '+(on?'checked':'')+' onchange="fklOnPilih(this)">'+
      '<span class="pn-check-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></span>'+
      '<span class="fkl-num">'+(i+1)+'</span>'+
      '<span class="fkl-lbl">'+fkEsc(nama)+'</span>'+
    '</label>';
  }).join('');
}

/* ---------- Langkah 3: hasil pemeriksaan (Ada / Tidak Ada) ---------- */
function fklSelectedDocs(){
  const st=fklActiveState();
  return fklDocPool().filter(nama=>st.pilih[nama]);
}
function fklAdaHtml(){
  const st=fklState[fklModul], list=fklSelectedDocs();
  if(!list.length) return '<div class="fkl-empty-note">Belum ada dokumen yang dipilih. Kembali ke langkah <b>Pilih Dokumen</b> untuk memilih berkas yang akan diperiksa.</div>';
  return '<div class="fkl-ada-list">'+list.map((nama,i)=>{
    const val=st.ada[nama];                 // true=Ada, false=Tidak Ada, undefined=belum
    const yes=val===true, no=val===false;
    return '<div class="fkl-ada-row">'+
      '<span class="fkl-ada-num">'+(i+1)+'</span>'+
      '<span class="fkl-ada-name">'+fkEsc(nama)+'</span>'+
      '<span class="fkl-ada-opts">'+
        '<button type="button" class="fkl-ada-btn ada'+(yes?' on':'')+'" onclick="fklSetAda(\''+fkEsc(nama).replace(/'/g,"\\'")+'\',true)">'+
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M20 6 9 17l-5-5"/></svg>Ada</button>'+
        '<button type="button" class="fkl-ada-btn no'+(no?' on':'')+'" onclick="fklSetAda(\''+fkEsc(nama).replace(/'/g,"\\'")+'\',false)">'+
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M18 6 6 18M6 6l12 12"/></svg>Tidak Ada</button>'+
      '</span>'+
    '</div>';
  }).join('')+'</div>';
}

/* ---------- Render utama ---------- */
function renderFormKelengkapan(){
  fklMarkActive();
  const def=FKL_DOCS[fklModul];
  const tt=document.getElementById('fkl-title'); if(tt) tt.textContent='Kelengkapan Dokumen Pengadaan'+(fklEditId?' — Ubah Data':' — Input Data');
  const sub=document.getElementById('fkl-sub');
  const cont=document.getElementById('fkl-content'); if(!cont) return;
  const st=fklState[fklModul];
  let html=fklStepperHtml();

  if(fklStep===1){
    if(sub) sub.textContent='Langkah 1 dari 3 — Lengkapi data pekerjaan';
    html+='<div class="form-card"><div class="form-section-title">'+KR_SECTION_ICON+'Data Pekerjaan'+dpPickBtnHtml('fkl')+'</div><div class="form-flow" style="--cols:4">';
    html+=FKL_INFO_FIELDS.map(fklInfoInputHtml).join('');
    html+='</div></div>';
    html+='<div class="fkl-actions"><div class="fkl-actions-right">'+
      '<button class="btn btn-red" onclick="fklBatal()">'+FKL_IC_X+'Batal</button>'+
      '<button class="btn btn-teal" onclick="fklNext()">Selanjutnya'+FKL_IC_NEXT+'</button>'+
    '</div></div>';
  }
  else if(fklStep===2){
    if(sub) sub.textContent='Langkah 2 dari 3 — Pilih dokumen yang akan diperiksa';
    const sel=fklSelectedDocs().length;
    html+='<div class="form-card"><div class="form-section-title">'+FKL_SEC_ICON+'Pilih Dokumen '+
      '<span class="fkl-count-chip">'+sel+' dipilih</span></div>'+
      '<div class="fkl-hint">Centang dokumen yang perlu diperiksa kelengkapannya (gabungan Dokumen Wajib &amp; Dokumen Tambahan).</div>'+
      '<div class="fkl-checkgrid" style="--rows:'+Math.ceil(fklDocPool().length/2)+'">'+fklPilihHtml()+'</div>'+
    '</div>';
    html+='<div class="fkl-actions"><div class="fkl-actions-right">'+
        '<button class="btn btn-red" onclick="fklBatal()">'+FKL_IC_X+'Batal</button>'+
        '<button class="btn btn-light" onclick="fklBack()">'+FKL_IC_BACK+'Kembali</button>'+
        '<button class="btn btn-teal" onclick="fklNext()">Selanjutnya'+FKL_IC_NEXT+'</button>'+
    '</div></div>';
  }
  else{
    if(sub) sub.textContent='Langkah 3 dari 3 — Tandai ketersediaan tiap dokumen';
    html+='<div class="form-card"><div class="form-section-title">'+FKL_SEC_ICON+'Kelengkapan Dokumen</div>'+
      '<div class="fkl-hint">Tandai tiap dokumen: <b>Ada</b> atau <b>Tidak Ada</b>.</div>'+
      fklAdaHtml()+
    '</div>';
    html+='<div class="form-card"><div class="form-section-title">'+FKL_SEC_ICON+'Ringkasan Pemeriksaan</div><div id="fkl-status"></div></div>';
    html+='<div class="fkl-actions"><div class="fkl-actions-right">'+
        '<button class="btn btn-red" onclick="fklBatal()">'+FKL_IC_X+'Batal</button>'+
        '<button class="btn btn-light" onclick="fklBack()">'+FKL_IC_BACK+'Sebelumnya</button>'+
        '<button class="btn btn-green" onclick="fklSimpan()">'+FKL_IC_SAVE+'Simpan</button>'+
    '</div></div>';
  }

  cont.innerHTML=html;

  if(fklStep===1){
    FKL_INFO_FIELDS.forEach(f=>{
      const el=document.getElementById('fkl-'+f.key); if(!el) return;
      const v=st.info[f.key];
      el.value = (f.type==='num') ? rupiahInputText(v) : (v!=null?v:'');
    });
  }
  if(fklStep===3) fklUpdateStatus();
}

/* ---------- Ikon tombol ---------- */
const FKL_IC_X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M18 6 6 18M6 6l12 12"/></svg>';
const FKL_IC_NEXT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:15px;height:15px"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const FKL_IC_BACK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:15px;height:15px"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>';
const FKL_IC_SAVE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>';

/* ---------- Interaksi data ---------- */
function fklOnInfoChange(){
  const st=fklState[fklModul];
  FKL_INFO_FIELDS.forEach(f=>{
    if(fklIsLocked(f.key)) return;
    const el=document.getElementById('fkl-'+f.key); if(!el) return;
    st.info[f.key] = (f.type==='num') ? parseRupiah(el.value) : el.value.trim();
  });
  fklSaveState();
}
function fklOnPilih(el){
  const st=fklState[fklModul];
  st.pilih[el.dataset.nama]=el.checked;
  fklSaveState();
  const chip=document.querySelector('.fkl-count-chip');
  if(chip) chip.textContent=fklSelectedDocs().length+' dipilih';
}
function fklSelectAll(on){
  const st=fklState[fklModul];
  fklDocPool().forEach(nama=>{ st.pilih[nama]=on; });
  fklSaveState(); renderFormKelengkapan();
}
function fklSetAda(nama, val){
  const st=fklState[fklModul];
  st.ada[nama] = (st.ada[nama]===val) ? undefined : val;  // klik lagi = batalkan pilihan
  if(st.ada[nama]===undefined) delete st.ada[nama];
  fklSaveState(); renderFormKelengkapan();
}

/* ---------- Ringkasan status (langkah 3) ---------- */
function fklCountAda(){
  const st=fklActiveState(), list=fklSelectedDocs();
  let ada=0, tidak=0, belum=0;
  list.forEach(nama=>{
    if(st.ada[nama]===true) ada++;
    else if(st.ada[nama]===false) tidak++;
    else belum++;
  });
  return {ada,tidak,belum,total:list.length, lengkap:(list.length>0 && ada===list.length)};
}
function fklUpdateStatus(){
  const box=document.getElementById('fkl-status'); if(!box) return;
  const c=fklCountAda();
  const pct = c.total ? Math.round(c.ada/c.total*100) : 0;
  const badge = c.lengkap
    ? '<span class="fkl-status-badge ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg>DOKUMEN LENGKAP</span>'
    : '<span class="fkl-status-badge no"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 6 6 18M6 6l12 12"/></svg>DOKUMEN TIDAK LENGKAP</span>';
  box.innerHTML='<div class="fkl-status-card">'+badge+
    '<div class="fkl-status-meta">Ada: <b>'+c.ada+'</b> &nbsp;•&nbsp; Tidak Ada: <b>'+c.tidak+'</b> &nbsp;•&nbsp; Belum ditandai: <b>'+c.belum+'</b><br>Hasil pemeriksaan dinyatakan <b>LENGKAP</b> bila seluruh dokumen berstatus <b>Ada</b>.</div>'+
    '<div class="fkl-prog"><div class="fkl-prog-bar"><div class="fkl-prog-fill" style="width:'+pct+'%"></div></div><div class="fkl-prog-txt">'+pct+'% dokumen tersedia</div></div>'+
  '</div>';
}

/* ---------- Navigasi wizard ---------- */
function fklNext(){
  if(fklStep===1){
    fklOnInfoChange();
    fklStep=2; renderFormKelengkapan(); fklScrollTop(); return;
  }
  if(fklStep===2){
    if(!fklSelectedDocs().length){ toast('Pilih minimal satu dokumen','warn'); return; }
    fklStep=3; renderFormKelengkapan(); fklScrollTop(); return;
  }
}
function fklBack(){
  if(fklStep>1){ fklStep--; renderFormKelengkapan(); fklScrollTop(); }
}
function fklScrollTop(){
  const v=document.getElementById('view-form-kelengkapan');
  if(v) v.scrollIntoView({behavior:'smooth',block:'start'});
}
function fklBatal(){
  openConfirm({ icon:'del', title:'Batalkan Proses',
    text:'Batalkan proses ini? Data yang belum disimpan akan hilang.',
    onYes:()=>{
      fklEditId=null; fklState[fklModul]=fklBlankState(); fklSaveState();
      fklStep=1; openFklView(); toast('Proses dibatalkan','ok');
    }
  });
}

/* ==================================================================
   SIMPAN DATA KELENGKAPAN → alihkan ke Lihat Data
   ================================================================== */
async function fklSimpan(){
  if(!requireInput()) return;
  const st=fklState[fklModul]; const info=st.info||{};
  const nama=String(info.nama||'').trim();
  if(!nama){ toast('Nama Pekerjaan wajib diisi','warn'); fklStep=1; renderFormKelengkapan(); return; }
  const c=fklCountAda();
  const doSave=async()=>{
    const rec={
      nama_pekerjaan:nama,
      tgl_terima:info.tgl_terima||'',
      metode:info.metode||'',
      info:Object.assign({},info),
      pilih:Object.assign({},st.pilih||{}),
      ada:Object.assign({},st.ada||{})
    };
    let ok=false;
    try{
      await withActionLoader(fklEditId?'Menyimpan perubahan':'Menyimpan', async()=>{
        if(fklEditId) await StoreKelengkapan.update(fklEditId, rec);
        else await StoreKelengkapan.create(rec);
        await refreshDataKelengkapan();
      });
      ok=true;
    }catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'err'); return; }
    if(!ok) return;
    toast(fklEditId?'Data berhasil diperbarui':'Data berhasil disimpan','ok');
    // #6: kosongkan seluruh isian input agar siap data baru
    fklEditId=null; fklState[fklModul]=fklBlankState(); fklSaveState(); fklStep=1;
    // #5: alihkan ke Lihat Data
    showView('fkl-view');
  };
  if(c.belum>0){
    openConfirm({ icon:'warn', title:'Masih Ada yang Belum Ditandai',
      text:c.belum+' dokumen belum ditandai Ada/Tidak Ada. Tetap simpan?',
      onYes:doSave });
    return;
  }
  doSave();
}

/* ==================================================================
   LIHAT DATA — daftar record kelengkapan tersimpan
   ================================================================== */
let fklViewPage=1;
const FKL_VIEW_PAGE_SIZE=8;
function fklMetodeShort(m){ return m||'—'; }
function fklViewRows(){
  let rows=(records_kelengkapan||[]).slice();
  const fs=(document.getElementById('fkl-view-search')?.value||'').toLowerCase().trim();
  if(fs) rows=rows.filter(r=>String(r.nama_pekerjaan||(r.info&&r.info.nama)||'').toLowerCase().includes(fs));
  return rows;
}
function fklEmptyRow(){
  return '<tr><td colspan="6"><div class="empty">'+
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>'+
    '<div>Data tidak tersedia</div></div></td></tr>';
}
function renderFklView(){
  const tb=document.getElementById('fkl-view-body');
  const pg=document.getElementById('fkl-view-pagination');
  const cEl=document.getElementById('fkl-view-count');
  if(!tb) return;
  const rows=fklViewRows();
  if(cEl) cEl.textContent=rows.length;
  if(!rows.length){ tb.innerHTML=fklEmptyRow(); if(pg) pg.innerHTML=''; return; }
  const totalPages=Math.max(1,Math.ceil(rows.length/FKL_VIEW_PAGE_SIZE));
  if(fklViewPage>totalPages) fklViewPage=totalPages;
  if(fklViewPage<1) fklViewPage=1;
  const start=(fklViewPage-1)*FKL_VIEW_PAGE_SIZE;
  const pageRows=rows.slice(start,start+FKL_VIEW_PAGE_SIZE);
  tb.innerHTML=pageRows.map((r,i)=>{
    const info=r.info||{};
    const nama=r.nama_pekerjaan||info.nama||'—';
    const lokasi=(info.lokasi!=null?String(info.lokasi):'').trim();
    const tgl=r.tgl_terima||info.tgl_terima||'';
    const metode=r.metode||info.metode||'';
    const rid=fkEsc(String(r.id));
    return '<tr>'+
      '<td class="col-no">'+(start+i+1)+'</td>'+
      '<td class="wrap-cell col-nama-freeze">'+fkEsc(nama)+'</td>'+
      '<td class="fkl-col-lokasi">'+fkEsc(lokasi||'—')+'</td>'+
      '<td class="col-date">'+fkEsc(tgl?fklDateLong(tgl):'—')+'</td>'+
      '<td>'+fkEsc(fklMetodeShort(metode))+'</td>'+
      '<td><div class="action-cell" style="justify-content:center">'+
        '<button class="act act-edit" title="Ubah" onclick="openFklInput(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>'+
        '<button class="act act-view" title="Lihat" onclick="fklPreviewRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>'+
        '<button class="act act-del" title="Hapus" onclick="fklDeleteRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>'+
      '</div></td>'+
    '</tr>';
  }).join('');
  if(pg){
    if(totalPages<=1){ pg.innerHTML=''; }
    else{
      let h='<button class="pg-btn" '+(fklViewPage<=1?'disabled':'')+' onclick="fklViewGoto('+(fklViewPage-1)+')">‹</button>';
      for(let p=1;p<=totalPages;p++) h+='<button class="pg-btn '+(p===fklViewPage?'active':'')+'" onclick="fklViewGoto('+p+')">'+p+'</button>';
      h+='<button class="pg-btn" '+(fklViewPage>=totalPages?'disabled':'')+' onclick="fklViewGoto('+(fklViewPage+1)+')">›</button>';
      pg.innerHTML=h;
    }
  }
}
function fklViewGoto(p){ fklViewPage=p; renderFklView(); }
/* Lihat (Pratinjau PDF) sebuah record tanpa mengubah buffer input */
function fklPreviewRecord(id){
  const rec=records_kelengkapan.find(r=>String(r.id)===String(id)); if(!rec) return;
  fklPreviewState = fklRecordToState(rec);
  fklOpenPreview();
}
/* Hapus record */
function fklDeleteRecord(id){
  if(!requireInput()) return;
  const rec=records_kelengkapan.find(r=>String(r.id)===String(id)); if(!rec) return;
  openConfirm({ icon:'del', title:'Hapus Data',
    text:'Hapus data kelengkapan "'+(rec.nama_pekerjaan||(rec.info&&rec.info.nama)||'')+'"?',
    onYes:async()=>{
      try{
        await withActionLoader('Menghapus', async()=>{ await StoreKelengkapan.remove(id); await refreshDataKelengkapan(); });
      }catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'err'); return; }
      toast('Data dihapus','ok'); renderFklView();
    }
  });
}

/* Tanggal numerik: "2026-07-06" -> "06/07/2026" */
const FKL_BULAN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
function fklDateLong(s){
  if(!s) return '';
  const p=String(s).split('-'); if(p.length!==3) return s;
  const y=p[0], m=parseInt(p[1],10), d=p[2];
  if(!(m>=1&&m<=12)) return s;
  return d+'/'+p[1]+'/'+y;
}
/* Logo PLN resmi (di-embed sebagai PNG) */
const FKL_LOGO_SRC='data:image/png;base64,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YYQxWCxgXCxtODi04aBkZQRBEEYUm2ivpd1FcQc13qNGCCLJgiAIIy7JHi6Kl2UpBEEQWgRlLVosY0EQhBawlAVBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARhLKCwVk2M31RZebs/gJHcC/J+tMIbrrjhRsWNN1p5z1vjXKiJs/es4lZ0/B+3wrJllptuMnIoBWEEz6A8iN8XlyXbOqEvg5M20Da+frsoCkmXqjw/q4pSBoh2eCAtsZpFWBQWJvBmucFqDl03iTbHIcwN0zoUIapqXC/g2jlb5fiNMt9dn0PVOshOjobvhxQh1a4JKyWUKoy5NXrYumwrThreH5KcC6+rqrh927/jZ66mXg1QDQtyvFy/VR1FCWvzKLUR9LvY6E1Qy3DC17l66rpBX7PEOizDcpOaOJZzw2q5u7ebmnkIx52NCSNQw3F7MjieR1R/lbndl3CyCsCqCf0gHBWRedjl/PND7tz2ObzsjVTLdZQarrNvARetN2C9BVyTXc0NVrf8GbNWo5Th9sLREN4HuCjMsHgVLAYv5RFWHnCByaTSUwkD0Hp8bTyl4t9JadBO/N/WQr0Mkd3MHdteRemHCdUDTOl4nvNV2HwzboQJJcx1pVHMxE9Po16N12zIN56BVBrKwXRRxZagnVRqCvVafD6GCxNBrmMq+W1fxdpruRWVCNsYeBCHPorZeD5EZnjsFJOci3plqguEBHWLiSJM6Iyr7aaUhfh/sUui+UTSuP5UPP98tHM+5fyN9Pa9wB29t2GqS1Dq7aYwg50wfi9LEO+F0GCH4bakMAR1DQSihS3xhkcEYXL2o+E9+4WeiEzH1dze82kWT/oGS6zDYhW1/BIZLNoGBHUXay3DE3dLzoUKXBQKpRQKNUzX1FGV5Mb/tv9XwrolCkyi1g5++iQc9yTKfJEf99yCMV9DqVebroyxsHn2fbXivUDzz6EWgP7vL7TC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';

function fklActiveState(){ return fklPreviewState || fklState[fklModul]; }
function fklBuildDocHtml(){
  const def=FKL_DOCS[fklModul], st=fklActiveState(), info=st.info||{};
  const list=fklSelectedDocs(), c=fklCountAda();
  const fmtNilai = (info.nilai!=='' && info.nilai!=null && info.nilai!=='') ? 'Rp '+Number(info.nilai).toLocaleString('id-ID') : '-';
  const tglTerima = info.tgl_terima ? pnwDateLong(info.tgl_terima) : '..........................';
  const infoRow=(k,v)=>'<tr><td class="k">'+k+'</td><td class="s">:</td><td class="v" style="text-align:justify">'+fkEsc(v||'-')+'</td></tr>';

  const chkRows=list.map((nama,i)=>{
    const val=st.ada[nama];
    const cell = val===true
      ? '<span class="pill ada">Ada</span>'
      : (val===false ? '<span class="pill no">Tidak Ada</span>' : '<span class="pill nn">–</span>');
    const ketDok = (st.ket && st.ket[nama]) ? String(st.ket[nama]) : '';
    return '<tr><td class="no">'+(i+1)+'</td><td class="nm">'+fkEsc(nama)+'</td><td class="ck">'+cell+'</td><td class="kt">'+fkEsc(ketDok)+'</td></tr>';
  }).join('');

  const hasilLengkap = c.lengkap;
  // Hasil Pemeriksaan (poin C) — bergaya sama seperti tabel pada Pembukaan Penawaran.
  const hasilStatus = hasilLengkap
    ? '<span class="pill ada">Lengkap</span>'
    : '<span class="pill no">Tidak Lengkap</span>';
  const hasilKet = hasilLengkap
    ? 'Seluruh dokumen yang diperiksa dinyatakan lengkap'
    : ('Terdapat '+c.tidak+' dari '+c.total+' dokumen yang tidak ada'+(c.belum?(' ('+c.belum+' belum ditandai)'):''));
  const hasilNama = (info.nama && String(info.nama).trim()) ? String(info.nama) : 'Kelengkapan Dokumen Pengadaan';
  const hasilBlock = '<table class="fkl-chk pnw-hasil"><thead><tr>'+
    '<th class="no">No</th><th class="nm">Nama Pekerjaan</th>'+
    '<th class="ck">Hasil Pemeriksaan</th><th class="kt">Keterangan</th>'+
    '</tr></thead><tbody>'+
    '<tr><td class="no">1</td><td class="nm">'+fkEsc(hasilNama)+'</td><td class="ck">'+hasilStatus+'</td><td class="kt">'+fkEsc(hasilKet)+'</td></tr>'+
    '</tbody></table>';

  return ''+
  '<div class="fkl-doc">'+
    '<div class="fkl-doc-head">'+
      '<div class="fkl-doc-logo">'+
        '<img src="'+FKL_LOGO_SRC+'" alt="Logo PLN">'+
      '</div>'+
      '<div class="fkl-doc-org">'+
        '<div class="l1">PT PLN (PERSERO)</div>'+
        '<div class="l2">UNIT PELAKSANA PELAYANAN PELANGGAN MASOHI</div>'+
        '<div class="l3">Jl. Abdullah Soulissa No 1, Masohi, Kec. Kota Masohi</div>'+
      '</div>'+
    '</div>'+
    '<div class="fkl-doc-band"></div>'+
    '<h1 class="fkl-doc-title">FORM PEMERIKSAAN KELENGKAPAN<br>DOKUMEN PENGADAAN</h1>'+
    '<div class="fkl-doc-titlegap"></div>'+

    '<div class="fkl-sec-h"><span class="rn">A</span>Data Pekerjaan</div>'+
    '<table class="fkl-info"><tbody>'+
      infoRow('Nama Pekerjaan', info.nama)+
      infoRow('Lokasi Pekerjaan', info.lokasi)+
      infoRow('Nilai Pekerjaan', fmtNilai)+
      infoRow('No. Anggaran', info.no_anggaran)+
      infoRow('Tgl. Anggaran', info.tgl_anggaran?pnwDateLong(info.tgl_anggaran):'-')+
      infoRow('Jenis Anggaran', info.jenis_anggaran)+
      infoRow('Metode Pengadaan', info.metode)+
    '</tbody></table>'+

    '<div class="fkl-sec-h"><span class="rn">B</span>Kelengkapan Dokumen</div>'+
    '<table class="fkl-chk fkl-chk-b"><thead><tr><th class="no">No</th><th class="nm">Jenis Dokumen</th><th class="ck"><span class="ck-main">Kelengkapan Dokumen</span></th><th class="kt">Keterangan</th></tr></thead><tbody>'+
      (chkRows||'<tr><td colspan="4" class="empty">Data tidak tersedia</td></tr>')+
    '</tbody></table>'+

    '<div class="fkl-doc-tail">'+
    '<div class="fkl-sec-h"><span class="rn">C</span>Hasil Pemeriksaan</div>'+
    hasilBlock+

    '<div class="fkl-doc-foot">'+
      '<div class="ttd-date">Masohi, '+fkEsc(tglTerima)+'</div>'+
      '<table class="ttd"><tbody><tr>'+
        '<td><div class="role">Yang Menyerahkan,</div><div class="gap"></div><div class="nm">'+fkEsc(info.menyerahkan||'(..........................)')+'</div></td>'+
        '<td><div class="role">Yang Menerima,</div><div class="gap"></div><div class="nm">'+fkEsc(info.menerima||'(..........................)')+'</div></td>'+
      '</tr></tbody></table>'+
    '</div>'+
    '</div>'+
  '</div>';
}

/* ============ SHELL DOKUMEN BERSAMA ============
   SATU tempat yang membentuk kerangka dokumen (doctype, <style>, pembungkus
   .fkl-print-page). Dipakai oleh SEMUA modul, dan dokumen yang sama itu pula
   yang ditulis ke iframe pratinjau MAUPUN iframe cetak. Karena pratinjau dan
   Cetak/PDF membaca hasil fungsi yang sama, perubahan di satu sisi pasti ikut
   di sisi lain — tidak mungkin melenceng.
   - extraCss  : CSS tambahan milik modul (boleh kosong)
   - innerHtml : isi dokumen (biasanya <div class="fkl-doc">…</div>)  */
/* ---------- Nomor dokumen (dari menu "Ambil Nomor" / Penetapan Nomor) ----------
   Dicocokkan lewat Nama Pekerjaan + kode dokumen. Dipakai pada baris "Nomor :"
   di bawah garis judul, seragam untuk seluruh dokumen. */
function fklPenetapanDoc(nama, codes){
  const nm=String(nama||'').trim().toLowerCase(); if(!nm) return null;
  const want=(codes&&codes.length?codes:['HPS']).map(c=>String(c).toUpperCase());
  const list=(typeof records_penetapan!=='undefined' && records_penetapan) ? records_penetapan : [];
  for(const c of want){
    for(const r of list){
      if(String(r.nama_pekerjaan||'').trim().toLowerCase()!==nm) continue;
      const docs=Array.isArray(r.dokumen)?r.dokumen:[];
      const hit=docs.find(d=>String(d.code||'').toUpperCase()===c || String(d.key||'').toUpperCase()===c);
      if(hit && (hit.no || hit.tgl_terbit)) return hit;
    }
  }
  return null;
}
function fklDocNomorText(nama, codes){
  const doc=fklPenetapanDoc(nama, codes);
  const no=(doc&&doc.no)?String(doc.no).trim():'';
  return 'Nomor : '+(no||'..........................');
}
/* Blok judul seragam: JUDUL → garis bawah → Nomor dokumen → jarak */
function fklDocTitleBlock(titleHtml, nama, codes){
  return '<h1 class="fkl-doc-title has-rule">'+titleHtml+'</h1>'+
    '<div class="fkl-doc-docno">'+fkEsc(fklDocNomorText(nama, codes))+'</div>'+
    '<div class="fkl-doc-titlegap"></div>';
}

function fklDocBaseCss(){
  const el=document.getElementById('fkl-doc-css');
  return (el?el.textContent:'') + fklDocCssPatch();
}
/* Penyesuaian yang berlaku untuk SEMUA dokumen cetak (HPS, Lampiran SPK, Jadwal,
   Kelengkapan, dll) tanpa perlu menyunting index.html.

   Kolom label pada blok "A DATA PEKERJAAN" semula dipatok width:34% — jauh lebih
   lebar dari kebutuhan, sehingga titik dua & nilainya terdorong ke tengah.
   Dengan width:1% + white-space:nowrap pada tabel width:100%, kolom label
   MENYUSUT tepat selebar teks label terpanjang ("Metode Pengadaan" / "Nama
   Pekerjaan"), lalu sisa ruang seluruhnya diberikan ke kolom nilai. */
function fklDocCssPatch(){
  return ''+
    'table.fkl-info td.k{width:1%;white-space:nowrap;padding-right:14px}'+
    'table.fkl-info td.s{width:1%;white-space:nowrap}'+
    /* Huruf awal label (mis. "Nama Pekerjaan") disejajarkan dengan huruf awal teks
       JUDUL seksi ("Uraian/Data Pekerjaan"). Judul menjorok sejauh lebar huruf
       seksi ("A") + jarak 10px; padding-kiri 19px menempatkan label tepat di bawah
       huruf awal judul. Hanya berlaku pada tabel info yang PERSIS di bawah judul
       seksi, jadi blok tanpa judul (mis. Lampiran SPK) tidak ikut terindent. */
    '.fkl-sec-h + table.fkl-info td.k{padding-left:19px}'+
    fklSheetCss();
}
/* ===================== LEMBAR A4 BERSAMA (WYSIWYG) =====================
   SEMUA dokumen cetak (Kelengkapan, Jadwal, Penawaran, Evaluasi, HPS, Analisa
   Harga, Rekap) dipecah menjadi lembar A4 sungguhan oleh fklPageScript(), persis
   seperti dokumen SPK. Kuncinya: KOTAK HALAMAN YANG SAMA di layar dan di cetak —
   210x297mm dengan padding 12mm (atas/bawah) & 15mm (kiri/kanan), @page{margin:0}.

   Sebelumnya pratinjau hanya menampilkan SATU lembar memanjang dan pemenggalan
   halaman baru terjadi saat dicetak (dikerjakan mesin cetak browser). Akibatnya
   pratinjau tidak pernah memperlihatkan hasil yang sebenarnya: batas halaman,
   baris yang terpotong, atau tabel yang pindah halaman baru terlihat di PDF.
   Dengan lembar sungguhan, apa yang tampil di pratinjau = apa yang tercetak. */
function fklSheetCss(){
  return ''+
  '.fkl-sheet{position:relative;box-sizing:border-box;width:210mm;height:297mm;background:#fff;'+
    'margin:0 auto 16px;padding:12mm 15mm;box-shadow:0 10px 30px rgba(20,50,60,.18);overflow:hidden;'+
    'page-break-after:always;break-after:page}'+
  '.fkl-sheet:last-child{page-break-after:auto;break-after:auto;margin-bottom:0}'+
  '.fkl-sheet-bd{overflow:hidden}'+
  /* Isi dokumen sudah dibatasi oleh padding lembar -> padding bawaan .fkl-doc dinolkan */
  '.fkl-sheet .fkl-doc{padding:0;overflow:visible}'+
  '@media print{'+
    /* ===== TANPA HEADER/FOOTER BAWAAN BROWSER =====
       margin:0 pada @page membuat mesin cetak tidak punya ruang untuk menempelkan
       header/footer bawaannya (judul halaman, URL, tanggal, "Halaman 1 dari N").
       Jarak tepi dokumen SEPENUHNYA berasal dari padding lembar (12mm/15mm), jadi
       hasil cetak tetap punya margin yang benar tanpa tulisan tambahan browser.
       Aturan ini ditulis ulang di sini (bukan hanya di index.html) agar setiap
       dokumen membawanya sendiri, apa pun urutan CSS-nya. */
    '@page{size:A4 portrait;margin:0}'+
    'html,body{background:#fff;margin:0;padding:0}'+
    /* Lembar TIDAK berubah bentuk saat dicetak: ukuran, padding, dan pemenggalannya
       sama persis dengan pratinjau, sehingga PDF tidak pernah "terkompres" atau
       menyisipkan halaman kosong. */
    '.fkl-sheet{margin:0;box-shadow:none;page-break-after:always;break-after:page}'+
    '.fkl-sheet:last-child{page-break-after:auto;break-after:auto}'+
  '}';
}
/* Dokumen Cetak/PDF adalah dokumen HTML MANDIRI (iframe/window baru). Font yang
   dimuat di halaman utama TIDAK diwariskan ke sana, sehingga 'Plus Jakarta Sans'
   sebelumnya selalu jatuh ke Segoe UI/Arial. Link berikut memuat font itu langsung
   di dalam dokumen cetak. */
function fklDocFontLink(){
  return '<link rel="preconnect" href="https://fonts.googleapis.com">'+
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'+
    '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">';
}
/* ---------- PENYESUAIAN LAYAR SEMPIT (HP/TABLET) ----------
   Lembar A4 selebar 210mm (±794px) lebih lebar dari layar HP sehingga pratinjau
   terpotong di sisi kanan. Skrip ini menskalakan SELURUH dokumen agar pas selebar
   layar (seperti PDF viewer), dan mengembalikannya ke 100% saat dicetak — hasil
   cetak/PDF tidak berubah sama sekali. Dipakai oleh semua dokumen pratinjau. */
function fklFitScript(){
  return '<style>@media print{body{zoom:1!important;transform:none!important;width:auto!important}}</style>'+
  '<scr'+'ipt>(function(){'+
  'var Z=(window.CSS&&CSS.supports&&CSS.supports("zoom","1"));'+
  'function fit(){'+
    'var b=document.body;if(!b)return;'+
    'b.style.zoom="";b.style.transform="";b.style.width="";'+
    'var sh=document.querySelector(".fkl-sheet,.spk-page,.hpsc-page,.fkl-print-page,.spk-doc");'+
    'if(!sh)return;'+
    'var w=sh.offsetWidth;if(!w)return;'+
    'var vw=document.documentElement.clientWidth;'+
    'if(vw>=w+2)return;'+
    'var s=(vw-10)/w;if(s<=0)return;'+
    'if(Z){b.style.zoom=s;}'+
    'else{b.style.transformOrigin="top left";b.style.transform="scale("+s+")";b.style.width=(vw/s)+"px";}'+
  '}'+
  'window.addEventListener("resize",fit);'+
  'window.addEventListener("orientationchange",fit);'+
  'window.addEventListener("load",fit);'+
  'setTimeout(fit,120);setTimeout(fit,500);setTimeout(fit,1500);setTimeout(fit,3200);'+
  'window.addEventListener("beforeprint",function(){var b=document.body;b.style.zoom="";b.style.transform="";b.style.width="";});'+
  'window.addEventListener("afterprint",fit);'+
  '})();</scr'+'ipt>';
}
function fklDocShell(extraCss, innerHtml){
  return '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width, initial-scale=1">'+
    '<title>&#8203;</title>'+fklDocFontLink()+
    '<style>'+fklDocBaseCss()+(extraCss||'')+'</style></head><body>'+
    '<table class="fkl-page-wrap">'+
      '<thead><tr><td><div class="fkl-vspace"></div></td></tr></thead>'+
      '<tbody><tr><td><div class="fkl-print-page">'+innerHtml+'</div></td></tr></tbody>'+
      '<tfoot><tr><td><div class="fkl-vspace"></div></td></tr></tfoot>'+
    '</table>'+
    fklPageScript()+
    fklFitScript()+
    '</body></html>';
}

/* Menunggu paginasi (fklPageScript) selesai sebelum mencetak, supaya hasil cetak
   memakai lembar yang SAMA dengan yang dilihat di pratinjau. Bila skrip gagal atau
   terlalu lama (>3 detik), cetak tetap dijalankan memakai tata letak memanjang
   bawaan (fkl-page-wrap) — jadi tombol Cetak tidak pernah macet. */
function fklWaitPaged(ifr, fn, sisa){
  if(sisa==null) sisa=3000;
  let siap=false;
  try{ siap = !!(ifr && ifr.contentWindow && ifr.contentWindow.__fklPaged); }
  catch(e){ siap=true; }
  if(siap || sisa<=0){ fn(); return; }
  setTimeout(()=>fklWaitPaged(ifr, fn, sisa-60), 60);
}

/* ---------- Pemecah halaman bersama (dijalankan DI DALAM dokumen cetak) ----------
   Mengubah satu lembar memanjang (.fkl-print-page) menjadi deretan lembar A4
   (.fkl-sheet) setinggi 273mm area isi (297mm - 12mm - 12mm).

   Aturan pemenggalan MENGIKUTI CSS yang sudah ada di tiap dokumen:
     - break-inside:avoid  -> blok dipindah utuh ke lembar berikutnya (tanda tangan,
       baris tabel, tbody rekap HPS, kartu evaluasi, dll)
     - break-before:page   -> blok selalu memulai lembar baru
   Tabel yang terpotong otomatis mengulang <thead> & <colgroup> di lembar lanjutan.
   Bila terjadi galat apa pun, dokumen DIKEMBALIKAN ke bentuk semula sehingga
   pencetakan tetap berjalan seperti sebelumnya. */
function fklPageScript(){
  const js=[
    '(function(){',
    'var DONE=false;',
    'function mm2px(mm){var d=document.createElement("div");',
    ' d.style.cssText="position:absolute;visibility:hidden;left:-9999px;height:"+mm+"mm";',
    ' document.body.appendChild(d);var h=d.getBoundingClientRect().height;',
    ' d.parentNode.removeChild(d);return h;}',
    'function els(n){var o=[],k=n.firstChild;while(k){if(k.nodeType===1)o.push(k);k=k.nextSibling;}return o;}',
    'function sty(n,p){try{var c=getComputedStyle(n);return c[p]||"";}catch(e){return "";}}',
    'function utuh(n){var v=sty(n,"breakInside")||sty(n,"pageBreakInside");return v==="avoid";}',
    'function halamanBaru(n){var v=sty(n,"breakBefore")||sty(n,"pageBreakBefore");return v==="page"||v==="always";}',
    /* blok yang TIDAK boleh dipecah: dipindah utuh ke lembar berikutnya */
    'function atom(n){',
    ' if(n.nodeType!==1) return true;',
    ' var t=n.tagName;',
    ' if(t==="P"||t==="TR"||t==="IMG"||t==="BR"||t==="HR"||t==="LI"||t==="THEAD"||t==="TFOOT"||t==="COLGROUP") return true;',
    /* SVG (ikon, grafik) bukan HTML biasa: selalu diperlakukan utuh */
    ' if(n.namespaceURI && n.namespaceURI!=="http://www.w3.org/1999/xhtml") return true;',
    /* Penjaga eksplisit: rekap HPS (Jumlah/DPP/PPn/Total/Terbilang) + tanda tangan
       berada dalam satu <tbody class="hps-tail">. Beberapa versi Chrome MENGABAIKAN
       break-inside:avoid pada <tbody> (getComputedStyle mengembalikan "auto"),
       sehingga utuh() gagal mengenalinya dan tanda tangan bisa berdiri sendiri di
       halaman berikutnya, meninggalkan angka rekapnya. Dikunci lewat KELAS agar
       selalu dipindah utuh — sama seperti penjaga di spkPageScript. */
    ' if(n.classList && (n.classList.contains("hps-tail")||n.classList.contains("ttd-row")||n.classList.contains("rho-doc-item")||n.classList.contains("fkl-doc-tail"))) return true;',
    ' if(utuh(n)) return true;',
    ' return els(n).length===0;',
    '}',
    'function bangun(){',
    ' var wrap=document.querySelector("table.fkl-page-wrap"); if(!wrap) return false;',
    ' var page=wrap.querySelector(".fkl-print-page"); if(!page) return false;',
    ' var PH=mm2px(273); if(!PH||PH<200) return false;',
    ' var MINH=mm2px(22);',              /* ruang minimum agar sebuah judul seksi boleh dimulai */
    ' var sheets=[], body=null, stack=[];',
    ' function mk(){',
    '   var sh=document.createElement("section"); sh.className="fkl-sheet";',
    '   var b=document.createElement("div"); b.className="fkl-sheet-bd";',
    '   b.style.height=Math.max(80,PH-2)+"px";',
    '   sh.appendChild(b);',
    '   wrap.parentNode.insertBefore(sh, wrap);',   /* harus di DOM agar tinggi terukur */
    '   sheets.push(sh); body=b;',
    /* bangun ulang "cangkang" pembungkus (mis. div.fkl-doc, table, tbody) di lembar baru */
    '   for(var i=0;i<stack.length;i++){',
    '     var sl=stack[i].src.cloneNode(false);',
    '     if(sl.tagName==="TABLE"){',
    '       var cg=stack[i].src.querySelector("colgroup"); if(cg) sl.appendChild(cg.cloneNode(true));',
    '       var th=stack[i].src.querySelector("thead");    if(th) sl.appendChild(th.cloneNode(true));',
    '     }',
    '     (i===0?body:stack[i-1].el).appendChild(sl);',
    '     stack[i].el=sl;',
    '   }',
    '   return body;',
    ' }',
    ' function tgt(){ return stack.length? stack[stack.length-1].el : body; }',
    ' function penuh(){ return body.scrollHeight > body.clientHeight+1; }',
    ' function kosong(){ return !((body.textContent||"").replace(/[\\s\\u00A0]/g,"")) && !body.querySelector("img,table,svg"); }',
    ' function pakaiBawah(){ var k=els(body); if(!k.length) return 0; var bt=body.getBoundingClientRect().top; return k[k.length-1].getBoundingClientRect().bottom - bt; }',
    ' function sisa(){ return body.clientHeight - pakaiBawah(); }',
    ' function taruh(node){',
    '   if(node.nodeType===1 && halamanBaru(node) && !kosong()) mk();',
    /* judul seksi jangan sampai berdiri sendiri di dasar lembar */
    '   if(node.nodeType===1 && node.classList && node.classList.contains("fkl-sec-h") && !kosong() && sisa()<MINH) mk();',
    '   var t=tgt();',
    '   t.appendChild(node);',
    '   if(!penuh()) return;',
    '   t.removeChild(node);',
    '   if(!atom(node)){',
    '     var sl=node.cloneNode(false);',
    '     t.appendChild(sl);',
    '     if(penuh() && !kosong()){ t.removeChild(sl); mk(); taruh(node); return; }',
    '     if(sl.tagName==="TABLE"){ var cg=node.querySelector("colgroup"); if(cg) sl.appendChild(cg.cloneNode(true)); }',
    '     stack.push({src:node, el:sl});',
    '     var kids=els(node), isTbl=(node.tagName==="TABLE");',
    '     for(var i=0;i<kids.length;i++){',
    '       var kd=kids[i];',
    '       if(isTbl && kd.tagName==="COLGROUP") continue;',
    /* <thead> DISALIN (bukan dipindah) supaya bisa diulang di lembar lanjutan */
    '       if(isTbl && kd.tagName==="THEAD"){ tgt().appendChild(kd.cloneNode(true)); continue; }',
    '       taruh(kd);',
    '     }',
    '     stack.pop();',
    '     return;',
    '   }',
    '   if(kosong()){ t.appendChild(node); return; }',   /* blok lebih tinggi dari 1 lembar */
    '   mk(); tgt().appendChild(node);',
    ' }',
    ' mk();',
    ' var nodes=els(page);',
    ' for(var i=0;i<nodes.length;i++) taruh(nodes[i]);',
    /* buang lembar & cangkang yang akhirnya kosong */
    ' for(var i=sheets.length-1;i>=0;i--){',
    '   var bd=sheets[i].querySelector(".fkl-sheet-bd");',
    '   if(bd && !((bd.textContent||"").replace(/[\\s\\u00A0]/g,"")) && !bd.querySelector("img,table,svg")) sheets[i].parentNode.removeChild(sheets[i]);',
    ' }',
    ' if(!document.querySelector(".fkl-sheet")) return false;',
    ' wrap.parentNode.removeChild(wrap);',
    ' return true;',
    '}',
    'function jalan(){',
    ' if(DONE) return; DONE=true;',
    ' var wrap=document.querySelector("table.fkl-page-wrap");',
    ' var cadangan=wrap?wrap.outerHTML:"";',
    ' try{',
    '   if(!bangun()){',
    /* gagal membentuk lembar -> pulihkan bentuk semula (cetak memanjang seperti dulu) */
    '     var sh=document.querySelectorAll(".fkl-sheet");',
    '     for(var i=sh.length-1;i>=0;i--) sh[i].parentNode.removeChild(sh[i]);',
    '     var w2=document.querySelector("table.fkl-page-wrap");',
    '     if(w2 && cadangan) w2.outerHTML=cadangan;',
    '   }',
    ' }catch(e){',
    '   try{',
    '     console.error("fkl paginate:", e);',
    '     var sh2=document.querySelectorAll(".fkl-sheet");',
    '     for(var j=sh2.length-1;j>=0;j--) sh2[j].parentNode.removeChild(sh2[j]);',
    '     var w3=document.querySelector("table.fkl-page-wrap");',
    '     if(w3 && cadangan) w3.outerHTML=cadangan;',
    '   }catch(_){}',
    ' }',
    ' try{ window.__fklPaged=true; }catch(e2){}',
    '}',
    /* Tinggi teks baru benar setelah font & gambar (logo) selesai dimuat. */
    'function mulai(){',
    ' try{',
    '   if(document.fonts && document.fonts.ready && document.fonts.ready.then){',
    '     document.fonts.ready.then(function(){ jalan(); });',
    '     setTimeout(jalan, 2500);',
    '     return;',
    '   }',
    ' }catch(e){}',
    ' jalan();',
    '}',
    'if(document.readyState==="complete") mulai(); else window.addEventListener("load", mulai);',
    '})();'
  ].join('\n');
  return '<script>'+js+'<\/script>';
}

/* ---------- Paginator Rekap HPS (multi-modul) ----------
   Rekap HPS menggabungkan beberapa dokumen modul; tiap modul dibungkus dalam
   <table.fkl-page-wrap> tersendiri. fklPageScript() hanya memaginasi SATU wrap
   (yang pertama), jadi tidak bisa dipakai apa adanya. hpscPageScript() memakai
   mesin pemenggal yang SAMA persis (bangunSatu), lalu menjalankannya untuk SETIAP
   wrap. Halaman sampul (.hpsc-page) tak tersentuh; hanya modul yang dipecah menjadi
   lembar A4 (.fkl-sheet) sehingga seluruh Rekap menjadi kartu A4 yang seragam dan
   tidak lagi bertumpuk/berantakan. Bila terjadi galat pada satu modul, modul itu
   dikembalikan ke bentuk semula tanpa mengganggu modul lain. */
function hpscPageScript(){
  const js=[
    '(function(){',
    'var DONE=false;',
    'function mm2px(mm){var d=document.createElement("div");',
    ' d.style.cssText="position:absolute;visibility:hidden;left:-9999px;height:"+mm+"mm";',
    ' document.body.appendChild(d);var h=d.getBoundingClientRect().height;',
    ' d.parentNode.removeChild(d);return h;}',
    'function els(n){var o=[],k=n.firstChild;while(k){if(k.nodeType===1)o.push(k);k=k.nextSibling;}return o;}',
    'function sty(n,p){try{var c=getComputedStyle(n);return c[p]||"";}catch(e){return "";}}',
    'function utuh(n){var v=sty(n,"breakInside")||sty(n,"pageBreakInside");return v==="avoid";}',
    'function halamanBaru(n){var v=sty(n,"breakBefore")||sty(n,"pageBreakBefore");return v==="page"||v==="always";}',
    'function atom(n){',
    ' if(n.nodeType!==1) return true;',
    ' var t=n.tagName;',
    ' if(t==="P"||t==="TR"||t==="IMG"||t==="BR"||t==="HR"||t==="LI"||t==="THEAD"||t==="TFOOT"||t==="COLGROUP") return true;',
    ' if(n.namespaceURI && n.namespaceURI!=="http://www.w3.org/1999/xhtml") return true;',
    ' if(n.classList && (n.classList.contains("hps-tail")||n.classList.contains("ttd-row")||n.classList.contains("rho-doc-item")||n.classList.contains("fkl-doc-tail"))) return true;',
    ' if(utuh(n)) return true;',
    ' return els(n).length===0;',
    '}',
    /* Pecah SATU wrap menjadi lembar A4. Mengembalikan jumlah lembar (0=gagal). */
    'function bangunSatu(wrap){',
    ' var page=wrap.querySelector(".fkl-print-page"); if(!page) return 0;',
    ' var PH=mm2px(273); if(!PH||PH<200) return 0;',
    ' var MINH=mm2px(22);',
    ' var sheets=[], body=null, stack=[];',
    ' function mk(){',
    '   var sh=document.createElement("section"); sh.className="fkl-sheet";',
    '   var b=document.createElement("div"); b.className="fkl-sheet-bd";',
    '   b.style.height=Math.max(80,PH-2)+"px";',
    '   sh.appendChild(b);',
    '   wrap.parentNode.insertBefore(sh, wrap);',
    '   sheets.push(sh); body=b;',
    '   for(var i=0;i<stack.length;i++){',
    '     var sl=stack[i].src.cloneNode(false);',
    '     if(sl.tagName==="TABLE"){',
    '       var cg=stack[i].src.querySelector("colgroup"); if(cg) sl.appendChild(cg.cloneNode(true));',
    '       var th=stack[i].src.querySelector("thead");    if(th) sl.appendChild(th.cloneNode(true));',
    '     }',
    '     (i===0?body:stack[i-1].el).appendChild(sl);',
    '     stack[i].el=sl;',
    '   }',
    '   return body;',
    ' }',
    ' function tgt(){ return stack.length? stack[stack.length-1].el : body; }',
    ' function penuh(){ return body.scrollHeight > body.clientHeight+1; }',
    ' function kosong(){ return !((body.textContent||"").replace(/[\\s\\u00A0]/g,"")) && !body.querySelector("img,table,svg"); }',
    ' function pakaiBawah(){ var k=els(body); if(!k.length) return 0; var bt=body.getBoundingClientRect().top; return k[k.length-1].getBoundingClientRect().bottom - bt; }',
    ' function sisa(){ return body.clientHeight - pakaiBawah(); }',
    ' function taruh(node){',
    '   if(node.nodeType===1 && halamanBaru(node) && !kosong()) mk();',
    '   if(node.nodeType===1 && node.classList && node.classList.contains("fkl-sec-h") && !kosong() && sisa()<MINH) mk();',
    '   var t=tgt();',
    '   t.appendChild(node);',
    '   if(!penuh()) return;',
    '   t.removeChild(node);',
    '   if(!atom(node)){',
    '     var sl=node.cloneNode(false);',
    '     t.appendChild(sl);',
    '     if(penuh() && !kosong()){ t.removeChild(sl); mk(); taruh(node); return; }',
    '     if(sl.tagName==="TABLE"){ var cg=node.querySelector("colgroup"); if(cg) sl.appendChild(cg.cloneNode(true)); }',
    '     stack.push({src:node, el:sl});',
    '     var kids=els(node), isTbl=(node.tagName==="TABLE");',
    '     for(var i=0;i<kids.length;i++){',
    '       var kd=kids[i];',
    '       if(isTbl && kd.tagName==="COLGROUP") continue;',
    '       if(isTbl && kd.tagName==="THEAD"){ tgt().appendChild(kd.cloneNode(true)); continue; }',
    '       taruh(kd);',
    '     }',
    '     stack.pop();',
    '     return;',
    '   }',
    '   if(kosong()){ t.appendChild(node); return; }',
    '   mk(); tgt().appendChild(node);',
    ' }',
    ' mk();',
    ' var nodes=els(page);',
    ' for(var i=0;i<nodes.length;i++) taruh(nodes[i]);',
    ' for(var i=sheets.length-1;i>=0;i--){',
    '   var bd=sheets[i].querySelector(".fkl-sheet-bd");',
    '   if(bd && !((bd.textContent||"").replace(/[\\s\\u00A0]/g,"")) && !bd.querySelector("img,table,svg")) sheets[i].parentNode.removeChild(sheets[i]);',
    ' }',
    ' if(!sheets.length) return 0;',
    ' wrap.parentNode.removeChild(wrap);',
    ' return sheets.length;',
    '}',
    'function jalan(){',
    ' if(DONE) return; DONE=true;',
    ' var wraps=[].slice.call(document.querySelectorAll("table.fkl-page-wrap"));',
    ' for(var w=0; w<wraps.length; w++){',
    '   var wrap=wraps[w]; if(!wrap||!wrap.parentNode) continue;',
    '   var induk=wrap.parentNode, cadangan=wrap.outerHTML;',
    '   try{',
    '     if(!bangunSatu(wrap)){',
    '       var sh=induk.querySelectorAll(".fkl-sheet");',
    '       for(var i=sh.length-1;i>=0;i--) sh[i].parentNode.removeChild(sh[i]);',
    '       if(induk.querySelector("table.fkl-page-wrap")===null && cadangan){ induk.insertAdjacentHTML("afterbegin", cadangan); }',
    '     }',
    '   }catch(e){',
    '     try{',
    '       console.error("hpsc paginate:", e);',
    '       var sh2=induk.querySelectorAll(".fkl-sheet");',
    '       for(var j=sh2.length-1;j>=0;j--) sh2[j].parentNode.removeChild(sh2[j]);',
    '       if(induk.querySelector("table.fkl-page-wrap")===null && cadangan){ induk.insertAdjacentHTML("afterbegin", cadangan); }',
    '     }catch(_){}',
    '   }',
    ' }',
    ' try{ window.__hpscPaged=true; window.__fklPaged=true; }catch(e2){}',
    '}',
    'function mulai(){',
    ' try{',
    '   if(document.fonts && document.fonts.ready && document.fonts.ready.then){',
    '     document.fonts.ready.then(function(){ jalan(); });',
    '     setTimeout(jalan, 2500);',
    '     return;',
    '   }',
    ' }catch(e){}',
    ' jalan();',
    '}',
    'if(document.readyState==="complete") mulai(); else window.addEventListener("load", mulai);',
    '})();'
  ].join('\n');
  return '<script>'+js+'<\/script>';
}


/* Bangun HTML dokumen lengkap (mandiri) untuk pratinjau iframe & cetak */
function fklStandaloneDocHtml(){
  return fklDocShell('', fklBuildDocHtml());
}

function fklOpenPreview(){
  const ov=document.getElementById('pn-preview-overlay'); if(!ov) return;
  const _mdl3=ov.querySelector('.pn-preview-modal'); if(_mdl3) _mdl3.classList.remove('is-max');
  pnPreviewResetMaxBtn();
  const titleEl=document.getElementById('pn-preview-title');
  if(titleEl) titleEl.textContent='Pratinjau — Form Pemeriksaan Kelengkapan Dokumen';
  const body=document.getElementById('pn-preview-body');
  if(body){
    body.classList.add('fkl-preview-body');
    body.innerHTML='<iframe id="fkl-preview-frame" title="Pratinjau Dokumen"></iframe>';
    const ifr=document.getElementById('fkl-preview-frame');
    const doc=ifr.contentWindow.document;
    doc.open(); doc.write(fklStandaloneDocHtml()); doc.close();
  }
  /* Tombol aksi pada header pratinjau: sisipkan tombol Cetak khusus FKL bila belum ada */
  const actions=document.querySelector('#pn-preview-overlay .pn-preview-head-actions');
  { const _c=document.getElementById('hpsc-preview-print'); if(_c) _c.remove(); }
  const _oldPnw=document.getElementById('pnw-preview-print'); if(_oldPnw) _oldPnw.remove();
  const _oldHpsc=document.getElementById('hpsc-preview-print'); if(_oldHpsc) _oldHpsc.remove();
  if(actions && !document.getElementById('fkl-preview-print')){
    const btn=document.createElement('button');
    btn.id='fkl-preview-print'; btn.className='btn btn-teal';
    btn.style.padding='8px 14px'; btn.style.fontSize='11px';
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>Cetak / PDF';
    btn.onclick=fklPrint;
    actions.insertBefore(btn, actions.firstChild);
  }
  ov.classList.add('show');
}

/* Bantu cetak: browser (Chrome/Edge) memakai judul TAB UTAMA (bukan judul
   dokumen di dalam iframe tersembunyi) untuk header cetak/PDF, sehingga
   "Monitoring Pengadaan Masohi" tetap muncul walau <title> iframe sudah
   dikosongkan. Judul TIDAK dikosongkan dengan string kosong/spasi biasa,
   karena Chrome menganggapnya "tanpa judul" lalu menggantinya dengan nama
   domain (mis. "pengadaan-masohi.com") pada header cetak — bukan blank.
   Dipakai karakter zero-width space (tak kasat mata, tapi tetap dianggap
   "ada judul") supaya header cetak benar-benar tidak menampilkan tulisan
   apa pun selain tanggal & jam cetak. Fungsi ini menyembunyikan sementara
   judul tab utama selama proses cetak berlangsung, lalu mengembalikannya
   setelah selesai. Dipakai oleh semua fungsi *Print() dokumen (fkl, pnw,
   rho, hps, ana, jk) agar konsisten di semua PDF. */
const APP_PAGE_TITLE='Monitoring Pengadaan Masohi';
function withHiddenPageTitle(fn){
  const ZW='\u200B';
  // Judul tab aplikasi dijaga SELALU tampil (tidak pernah dikosongkan). Header cetak
  // tetap bersih karena tiap dokumen dicetak lewat iframe yang sudah punya <title>
  // zero-width sendiri, jadi judul tab induk tak perlu diubah saat mencetak. Ini juga
  // mencegah bug lama: tab jadi kosong permanen bila proses restore gagal.
  if(!document.title || document.title===ZW) document.title=APP_PAGE_TITLE;
  try{ fn(); }
  finally{
    if(!document.title || document.title===ZW) document.title=APP_PAGE_TITLE;
    setTimeout(()=>{ if(!document.title || document.title===ZW) document.title=APP_PAGE_TITLE; }, 1500);
  }
}
/* Cetak dokumen (mencetak isi dokumen yang sama dengan pratinjau) */
function fklPrint(){
  // Buat iframe terisolasi agar isi dokumen pasti tercetak (tidak terpengaruh overlay/aplikasi)
  const old=document.getElementById('fkl-print-frame'); if(old) old.remove();
  const ifr=document.createElement('iframe');
  ifr.id='fkl-print-frame';
  ifr.setAttribute('aria-hidden','true');
  ifr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(ifr);
  const doc=ifr.contentWindow.document;
  doc.open(); doc.write(fklStandaloneDocHtml()); doc.close();
  const go=()=>fklWaitPaged(ifr, _go);
  const _go=()=>{
    withHiddenPageTitle(()=>{ try{ ifr.contentWindow.focus(); ifr.contentWindow.print(); }catch(e){ try{ window.print(); }catch(_){} } });
    setTimeout(()=>{ const f=document.getElementById('fkl-print-frame'); if(f) f.remove(); }, 1500);
  };
  const imgs=doc.images ? Array.from(doc.images) : [];
  if(imgs.length){
    let n=imgs.length;
    const dec=()=>{ if(--n<=0) setTimeout(go,60); };
    imgs.forEach(im=>{ if(im.complete) dec(); else { im.onload=dec; im.onerror=dec; } });
    setTimeout(go, 1200);
  } else { setTimeout(go, 120); }
}


/* ####################### MODUL PEMBUKAAN PENAWARAN ####################### */
