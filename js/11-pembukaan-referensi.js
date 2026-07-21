/* ===== 11-pembukaan-referensi.js (bagian 11/15, baris 9192-11534 dari app.js asli) =====
   Modul Pembukaan Penawaran + Referensi Harga.
   WAJIB dimuat berurutan 01 s.d. 15 — jangan ubah urutannya. ===== */
/* ==================================================================
   MODUL PEMBUKAAN PENAWARAN
   Alur 4 langkah:
     1. Data Pekerjaan  (+ jumlah & nama penyedia, pejabat pelaksana)
     2. Pilihan Kategori (1 grup utk 1 Sampul, 2 grup utk 2 Sampul/2 Tahap)
     3. Pengisian Persyaratan (baris persyaratan per kategori, bisa tambah/hapus)
     4. Pemeriksaan Kelengkapan (per penyedia: Ada/Tidak Ada + Keterangan)
   Simpan -> Lihat Hasil Pemeriksaan + cetak PDF.
   Pola menyalin modul Kelengkapan (FKL): stepper, form-card, fkl-actions,
   fkl-check, fkl-ada, dokumen cetak (kop PLN), penyimpanan Supabase.
   ================================================================== */

const PNW_METODE = ['Pengadaan Langsung','Tender Terbuka','Tender Terbatas','Seleksi Umum','Seleksi Terbatas','Penunjukan Langsung','Tender Cepat'];
const PNW_JENIS_ANGGARAN = ['Investasi','Operasi'];
const PNW_PENYAMPAIAN = ['1 Tahap 1 Sampul','1 Tahap 2 Sampul','2 Tahap'];
/* Kategori dokumen penawaran */
const PNW_KATEGORI = ['Data Administrasi','Data Teknis','Keuangan','Jaminan Penawaran','Penawaran Harga'];
/* Kategori Penawaran Harga terkunci: 3 item wajib, tidak bisa ditambah/kurang */
const PNW_HARGA_LOCK = ['Surat Penawaran','Nilai RAB','Jangka Waktu Pelaksanaan'];

/* Field data pekerjaan (langkah 1). Penyedia & pejabat ditangani terpisah. */
const PNW_INFO_FIELDS = [
  {key:'nama',          label:'Nama Pekerjaan',        type:'text', span:2},
  {key:'lokasi',        label:'Lokasi Pekerjaan',      type:'text', span:2},
  {key:'nilai',         label:'Rencana Anggaran Biaya', type:'num'},
  {key:'no_anggaran',   label:'No. Anggaran',          type:'text'},
  {key:'tgl_anggaran',  label:'Tgl. Anggaran',         type:'date'},
  {key:'jenis_anggaran',label:'Jenis Anggaran',        type:'select', options:PNW_JENIS_ANGGARAN},
  {key:'metode',        label:'Metode Pengadaan',      type:'select', options:PNW_METODE},
  {key:'penyampaian',   label:'Metode Penyampaian Dokumen', type:'select', span:2, options:PNW_PENYAMPAIAN}
];

/* ---------- State ----------
   info      : { key:value }  data pekerjaan
   penyedia  : ['Nama A', ...] sepanjang jumlah
   pejabat   : nama pejabat pelaksana pengadaan (utk ttd)
   pilih     : { s1:{kategori:true}, s2:{kategori:true} }  kategori dicentang per sampul
   syarat    : { s1:{ kategori:[ 'baris', ... ] }, s2:{...} }  daftar persyaratan
   periksa   : { s1:{ penyediaIdx:{ 'kat||baris': {ada:bool, ket:str} } }, s2:{...} }
*/
function pnwBlankState(){
  return { info:{}, penyedia:[''], pejabat:'', pilih:{s1:{},s2:{}}, syarat:{s1:{},s2:{}}, periksa:{s1:{},s2:{}}, profilLoaded:false };
}
let pnwState = pnwBlankState();
let pnwStep = 1;               // 1..4
let pnwActiveSampul = 's1';    // langkah 4: sampul yang sedang diperiksa
let pnwActivePenyedia = 0;     // langkah 4: indeks penyedia yang sedang diperiksa
let pnwEditId = null;
let pnwPreviewState = null;    // utk pratinjau record tersimpan
let pnwPreviewSampul = 's1';   // sampul aktif saat cetak/pratinjau

const PNW_STATE_KEY = 'pnw_state_v1';
function pnwLoadState(){ try{ const raw=ssGet(PNW_STATE_KEY); if(raw){ const o=JSON.parse(raw); if(o&&o.info) pnwState=o; } }catch(e){} }
function pnwSaveState(){ try{ ssSet(PNW_STATE_KEY, JSON.stringify(pnwState)); }catch(e){} }
pnwLoadState();

/* Sampul: apakah pekerjaan memakai 2 sampul (2 Sampul / 2 Tahap) */
function pnwIsTwoSampul(st){ const p=(st||pnwState).info.penyampaian||''; return p==='1 Tahap 2 Sampul' || p==='2 Tahap'; }
function pnwSampulList(st){ return pnwIsTwoSampul(st) ? ['s1','s2'] : ['s1']; }
function pnwSampulLabel(sk){ return sk==='s2' ? 'Sampul Dua' : 'Sampul Satu'; }
/* Judul grup kategori di langkah 2 */
function pnwKategoriTitle(st, sk){
  if(!pnwIsTwoSampul(st)) return 'Pilihan Kategori Dokumen';
  return 'Pilihan Kategori Dokumen ' + (sk==='s2' ? 'Sampul Dua' : 'Sampul Satu');
}

/* ---------- Penyimpanan Supabase ---------- */
const PNW_TABLE = 'pembukaan_penawaran';
let records_pembukaan = [];
function pnwSupaReady(){ return !!(USE_SUPABASE && db); }
const StorePembukaan = {
  async list(){
    if(!pnwSupaReady()) return [];
    const {data,error}=await db.from(PNW_TABLE).select('*').order('created_at',{ascending:false});
    if(error) throw error; return data||[];
  },
  async create(rec){
    if(!pnwSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(PNW_TABLE).insert(rec).select();
    if(error) throw error; return data&&data[0];
  },
  async update(rid, rec){
    if(!pnwSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(PNW_TABLE).update(rec).eq('id',rid);
    if(error) throw error;
  },
  async remove(rid){
    if(!pnwSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(PNW_TABLE).delete().eq('id',rid);
    if(error) throw error;
  }
};
async function refreshDataPembukaan(){
  try{ records_pembukaan = await StorePembukaan.list(); }
  catch(err){ console.error(err); records_pembukaan = records_pembukaan||[]; toast('Gagal memuat data Pembukaan Penawaran: '+errMsg(err),'err'); }
}

/* ---------- Buka form / lihat data ---------- */
function openPnwInput(editId){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  pnwPreviewState=null;
  if(editId){
    const rec=records_pembukaan.find(r=>String(r.id)===String(editId));
    pnwEditId = rec ? rec.id : null;
    pnwState = rec ? pnwRecordToState(rec) : pnwBlankState();
  }else{
    pnwEditId = null; pnwState = pnwBlankState();
    resetInputBaru('pnw');
  }
  pnwStep=1; pnwActiveSampul='s1'; pnwActivePenyedia=0;
  pnwSaveState(); showView('form-pembukaan');
}
function openPnwView(){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  refreshDataPembukaan().then(()=>showView('pnw-view'));
}
function pnwRecordToState(rec){
  const base=pnwBlankState();
  const s=(rec&&rec.state&&typeof rec.state==='object')?rec.state:{};
  return {
    info:  Object.assign({}, base.info,  s.info||{}),
    penyedia: Array.isArray(s.penyedia)&&s.penyedia.length ? s.penyedia.slice() : [''],
    pejabat: s.pejabat||'',
    pilih: { s1:Object.assign({}, (s.pilih&&s.pilih.s1)||{}), s2:Object.assign({}, (s.pilih&&s.pilih.s2)||{}) },
    syarat:{ s1:Object.assign({}, (s.syarat&&s.syarat.s1)||{}), s2:Object.assign({}, (s.syarat&&s.syarat.s2)||{}) },
    periksa:{ s1:Object.assign({}, (s.periksa&&s.periksa.s1)||{}), s2:Object.assign({}, (s.periksa&&s.periksa.s2)||{}) }
  };
}
function pnwActiveState(){ return pnwPreviewState || pnwState; }
function pnwMarkActive(){ document.querySelectorAll('.topnav-item[data-view="form-pembukaan"]').forEach(b=>b.classList.add('active')); }

/* ---------- Stepper ---------- */
function pnwStepperHtml(){
  const steps=[['1','Data Pekerjaan'],['2','Pilihan Kategori'],['3','Pengisian Persyaratan'],['4','Pemeriksaan']];
  return '<div class="fkl-stepper">'+steps.map((s,i)=>{
    const n=i+1;
    const cls = n<pnwStep ? 'done' : (n===pnwStep ? 'active' : '');
    const mark = n<pnwStep
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>'
      : s[0];
    const line = i<steps.length-1 ? '<div class="fkl-step-line '+(n<pnwStep?'done':'')+'"></div>' : '';
    return '<div class="fkl-step '+cls+'"><div class="fkl-step-dot">'+mark+'</div><div class="fkl-step-name">'+s[1]+'</div></div>'+line;
  }).join('')+'</div>';
}

/* ================= LANGKAH 1: DATA PEKERJAAN ================= */
const PNW_DP_LOCK_KEYS=['nama','lokasi','nilai','no_anggaran','tgl_anggaran','jenis_anggaran','metode'];
function pnwIsLocked(key){ return !!(pnwState.info && pnwState.info.dpId) && PNW_DP_LOCK_KEYS.indexOf(key)>=0; }
function pnwInfoInputHtml(f){
  const id='pnw-'+f.key;
  const span=f.span?(' style="grid-column:span '+f.span+'"'):'';
  const locked=pnwIsLocked(f.key); const dis=locked?' disabled':'';
  let ctl;
  if(f.type==='select'){
    const extra = f.key==='penyampaian' ? ' onchange="pnwOnPenyampaianChange()"' : ' onchange="pnwOnInfoChange()"';
    ctl='<select id="'+id+'"'+dis+extra+'><option value="">— Pilih —</option>'+(f.options||[]).map(o=>'<option>'+fkEsc(o)+'</option>').join('')+'</select>';
  }
  else if(f.type==='num') ctl='<input id="'+id+'" type="text" inputmode="numeric" placeholder="Rp"'+dis+' oninput="onRupiahInput(this)" onchange="pnwOnInfoChange()">';
  else if(f.type==='date') ctl='<input id="'+id+'" type="date"'+dis+' onchange="pnwOnInfoChange()">';
  else ctl='<input id="'+id+'" type="text"'+dis+' oninput="pnwOnInfoChange()">';
  return '<div class="field'+(locked?' is-locked':'')+'"'+span+'><label>'+fkEsc(f.label)+'</label>'+ctl+(locked?DP_LOCK_BADGE:'')+'</div>';
}
function pnwPenyediaFieldsHtml(){
  const st=pnwState, n=st.penyedia.length;
  let opts=''; for(let i=1;i<=20;i++) opts+='<option value="'+i+'"'+(i===n?' selected':'')+'>'+i+' Penyedia</option>';
  let html='<div class="field"><label>Jumlah Penyedia</label><select id="pnw-jumlah" onchange="pnwOnJumlahChange(this)">'+opts+'</select></div>';
  html+='<div class="field" style="grid-column:span 3"><label>Nama Pejabat Pelaksana Pengadaan</label><input id="pnw-pejabat" type="text" placeholder="Nama pejabat pelaksana" oninput="pnwOnPejabatChange(this)"></div>';
  return html;
}
function pnwPenyediaListHtml(){
  const st=pnwState;
  const rows=st.penyedia.map((nm,i)=>{
    return '<div class="field"><label>Nama Penyedia '+(i+1)+'</label>'+
      '<input type="text" data-pidx="'+i+'" placeholder="Nama penyedia ke-'+(i+1)+'" oninput="pnwOnPenyediaNama(this)" value="'+fkEsc(nm||'')+'"></div>';
  }).join('');
  return '<div class="form-flow" style="--cols:3">'+rows+'</div>';
}

/* ================= LANGKAH 2: PILIHAN KATEGORI ================= */
function pnwKategoriGroupHtml(sk){
  const st=pnwState, sel=st.pilih[sk]||{};
  const kategoriList=pnwKategoriUntukSampul(st,sk);
  const two=pnwIsTwoSampul(st);
  const items=kategoriList.map((kat)=>{
    const idx=PNW_KATEGORI.indexOf(kat);           // nomor tetap sesuai urutan asli
    const on=!!sel[kat];
    // Penawaran Harga pada Sampul Dua (2 sampul): otomatis terpilih & terkunci
    const autoLock = two && sk==='s2' && kat==='Penawaran Harga';
    const checked = autoLock ? true : on;
    const attrs = autoLock ? 'checked disabled' : (checked?'checked':'');
    return '<label class="fkl-check'+(autoLock?' is-locked':'')+'">'+
      '<input type="checkbox" data-sk="'+sk+'" data-kat="'+fkEsc(kat)+'" '+attrs+' onchange="pnwOnPilih(this)">'+
      '<span class="pn-check-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></span>'+
      '<span class="fkl-num">'+(idx+1)+'</span>'+
      '<span class="fkl-lbl">'+fkEsc(kat)+'</span>'+
    '</label>';
  }).join('');
  const cnt=kategoriList.filter(k=>sel[k]).length;
  return '<div class="form-card"><div class="form-section-title">'+FKL_SEC_ICON+fkEsc(pnwKategoriTitle(st,sk))+
    ' <span class="fkl-count-chip">'+cnt+' dipilih</span></div>'+
    '<div class="fkl-checkgrid" style="--rows:'+Math.ceil(kategoriList.length/2)+'">'+items+'</div></div>';
}

/* ================= LANGKAH 3: PENGISIAN PERSYARATAN ================= */
function pnwSelectedKategori(st, sk){ const sel=(st||pnwState).pilih[sk]||{}; return PNW_KATEGORI.filter(k=>sel[k]); }
/* Daftar kategori yang DITAMPILKAN sebagai pilihan pada satu sampul.
   Untuk metode 2 sampul/2 tahap: "Penawaran Harga" hanya ada di Sampul Dua,
   sehingga dikeluarkan dari daftar pilihan Sampul Satu. */
function pnwKategoriUntukSampul(st, sk){
  st=st||pnwState;
  if(pnwIsTwoSampul(st)){
    if(sk==='s1') return PNW_KATEGORI.filter(k=>k!=='Penawaran Harga');  // Sampul Satu: tanpa Penawaran Harga
    return ['Penawaran Harga'];                                          // Sampul Dua: HANYA Penawaran Harga
  }
  return PNW_KATEGORI.slice();
}
/* Terapkan aturan Penawaran Harga:
   - 2 sampul/2 tahap: Sampul Dua otomatis memilih "Penawaran Harga" (terkunci),
     dan Sampul Satu tidak boleh memilih "Penawaran Harga". */
function pnwEnforceHargaRule(st){
  st=st||pnwState;
  if(pnwIsTwoSampul(st)){
    // Sampul Dua HANYA berisi "Penawaran Harga" (kategori lain dibersihkan)
    st.pilih.s2 = { 'Penawaran Harga': true };
    // "Penawaran Harga" dikeluarkan dari Sampul Satu
    if(st.pilih.s1) delete st.pilih.s1['Penawaran Harga'];
  }
}
/* pastikan tiap kategori terpilih punya array syarat (default 3 baris, Penawaran Harga terkunci) */
function pnwEnsureSyarat(){
  const st=pnwState;
  pnwEnforceHargaRule(st);
  pnwSampulList(st).forEach(sk=>{
    st.syarat[sk]=st.syarat[sk]||{};
    pnwSelectedKategori(st,sk).forEach(kat=>{
      if(kat==='Penawaran Harga'){ st.syarat[sk][kat]=PNW_HARGA_LOCK.slice(); return; }
      if(!Array.isArray(st.syarat[sk][kat])) st.syarat[sk][kat]=['','',''];
    });
    // buang kategori yang tak lagi dipilih
    Object.keys(st.syarat[sk]).forEach(kat=>{ if(!pnwSelectedKategori(st,sk).includes(kat)) delete st.syarat[sk][kat]; });
  });
}
function pnwSyaratGroupHtml(sk){
  const st=pnwState, kats=pnwSelectedKategori(st,sk);
  if(!kats.length) return '';
  const head = pnwIsTwoSampul(st) ? '<div class="pnw-sampul-band">'+fkEsc(pnwSampulLabel(sk))+'</div>' : '';
  const cards=kats.map(kat=>{
    const locked = kat==='Penawaran Harga';
    const arr = st.syarat[sk][kat]||[];
    const rows=arr.map((val,i)=>{
      if(locked){
        return '<div class="pnw-syarat-row locked"><span class="pnw-syarat-no">'+(i+1)+'</span>'+
          '<input type="text" value="'+fkEsc(val)+'" readonly>'+
          '<span class="pnw-lock-badge">Terkunci</span></div>';
      }
      return '<div class="pnw-syarat-row"><span class="pnw-syarat-no">'+(i+1)+'</span>'+
        '<input type="text" data-sk="'+sk+'" data-kat="'+fkEsc(kat)+'" data-i="'+i+'" placeholder="Uraian persyaratan" value="'+fkEsc(val)+'" oninput="pnwOnSyaratInput(this)">'+
        '<button type="button" class="pnw-syarat-del" title="Hapus baris" onclick="pnwSyaratDel(\''+sk+'\',\''+fkEscJs(kat)+'\','+i+')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button></div>';
    }).join('');
    const addBtn = locked ? '' : '<button type="button" class="pnw-syarat-add" onclick="pnwSyaratAdd(\''+sk+'\',\''+fkEscJs(kat)+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>Tambah Persyaratan</button>';
    const lockNote = locked ? '<div class="pnw-lock-note">Kategori Penawaran Harga terkunci: Surat Penawaran, Nilai RAB, dan Jangka Waktu Pelaksanaan.</div>' : '';
    return '<div class="pnw-kat-card"><div class="pnw-kat-head">'+fkEsc(kat)+'</div>'+lockNote+
      '<div class="pnw-syarat-list">'+rows+'</div>'+addBtn+'</div>';
  }).join('');
  return head+cards;
}
function pnwSyaratAdd(sk,kat){ const st=pnwState; st.syarat[sk]=st.syarat[sk]||{}; st.syarat[sk][kat]=st.syarat[sk][kat]||[]; st.syarat[sk][kat].push(''); pnwSaveState(); renderPnwForm(); }
function pnwSyaratDel(sk,kat,i){ const st=pnwState; const arr=st.syarat[sk][kat]||[]; if(arr.length<=1){ toast('Minimal satu baris persyaratan','warn'); return; } arr.splice(i,1); pnwSaveState(); renderPnwForm(); }
function pnwOnSyaratInput(el){ const st=pnwState; const sk=el.dataset.sk, kat=el.dataset.kat, i=+el.dataset.i; st.syarat[sk]=st.syarat[sk]||{}; st.syarat[sk][kat]=st.syarat[sk][kat]||[]; st.syarat[sk][kat][i]=el.value; pnwSaveState(); }

/* ================= TEMPLATE EXCEL PERSYARATAN (Unduh / Unggah) =================
   Satu sheet per kategori (per sampul bila metode 2 sampul). Tiap sheet memuat
   metadata Sampul & Kategori pada baris 1-2 (dipakai saat membaca ulang), lalu
   tabel "No | Uraian Persyaratan" mulai baris 5. Jumlah baris bebas — pembacaan
   berjalan sampai baris terakhir yang terisi, jadi 100+ persyaratan pun terbaca.
   Kategori "Penawaran Harga" ikut dicetak sebagai rujukan, tetapi diabaikan saat
   unggah karena isinya terkunci. */
const PNW_XLS_MIN_ROWS = 3;      // baris uraian kosong bawaan tiap sheet
function pnwXlsSheetName(twoSampul, sk, kat){
  var nm = (twoSampul ? (sk==='s2'?'S2 - ':'S1 - ') : '') + kat;
  return nm.replace(/[\[\]\*\?\/\\:]/g,'-').slice(0,31);
}
function pnwXlsNorm(v){ return String(v==null?'':v).toLowerCase().replace(/[^a-z0-9]+/g,''); }
function pnwXlsFindKategori(v){
  var n=pnwXlsNorm(v); if(!n) return null;
  for(var i=0;i<PNW_KATEGORI.length;i++){ if(pnwXlsNorm(PNW_KATEGORI[i])===n) return PNW_KATEGORI[i]; }
  return null;
}
async function pnwXlsTemplate(){
  try{
    if(typeof ExcelJS==='undefined'){ toast('Pustaka Excel belum termuat. Muat ulang halaman.','warn'); return; }
    pnwEnsureSyarat();
    var st=pnwState, two=pnwIsTwoSampul(st);
    var wb=new ExcelJS.Workbook();
    wb.creator='Monitoring Pengadaan UP3 Masohi';
    var sheets=0;
    pnwSampulList(st).forEach(function(sk){
      pnwSelectedKategori(st,sk).forEach(function(kat){
        var locked = (kat==='Penawaran Harga');
        var arr=(st.syarat[sk]&&st.syarat[sk][kat])?st.syarat[sk][kat].slice():[];
        while(arr.length < PNW_XLS_MIN_ROWS) arr.push('');
        var ws=wb.addWorksheet(pnwXlsSheetName(two,sk,kat));
        ws.columns=[{width:6},{width:110}];
        ws.getCell('A1').value='Sampul';   ws.getCell('B1').value=pnwSampulLabel(sk);
        ws.getCell('A2').value='Kategori'; ws.getCell('B2').value=kat;
        ['A1','A2'].forEach(function(a){ ws.getCell(a).font={bold:true,color:{argb:'FF095E66'}}; });
        ['B1','B2'].forEach(function(a){ ws.getCell(a).font={bold:true}; });
        ws.getCell('A4').value='No'; ws.getCell('B4').value='Uraian Persyaratan';
        ['A4','B4'].forEach(function(a){
          var c=ws.getCell(a);
          c.font={bold:true,color:{argb:'FFFFFFFF'}};
          c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0E7C86'}};
          c.alignment={vertical:'middle',horizontal:a==='A4'?'center':'left'};
        });
        var border={top:{style:'thin',color:{argb:'FFBFD6D8'}},left:{style:'thin',color:{argb:'FFBFD6D8'}},
                    bottom:{style:'thin',color:{argb:'FFBFD6D8'}},right:{style:'thin',color:{argb:'FFBFD6D8'}}};
        arr.forEach(function(v,i){
          var r=5+i;
          ws.getCell(r,1).value=i+1;
          ws.getCell(r,2).value=String(v==null?'':v);
          ws.getCell(r,1).alignment={horizontal:'center',vertical:'middle'};
          ws.getCell(r,2).alignment={vertical:'middle',wrapText:true};
          ws.getCell(r,2).numFmt='@';
          ws.getCell(r,1).border=border; ws.getCell(r,2).border=border;
          if(i%2===1){ [1,2].forEach(function(c){ ws.getCell(r,c).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF2F7F8'}}; }); }
        });
        if(locked){
          ws.getCell('D1').value='Kategori terkunci — perubahan pada sheet ini diabaikan saat diunggah.';
          ws.getCell('D1').font={italic:true,color:{argb:'FFB35A00'}};
        }
        ws.views=[{state:'frozen',ySplit:4}];
        sheets++;
      });
    });
    if(!sheets){ toast('Belum ada kategori dipilih. Kembali ke langkah Pilihan Kategori.','warn'); return; }
    var wsG=wb.addWorksheet('Petunjuk');
    wsG.columns=[{width:24},{width:96}];
    [['PETUNJUK PENGISIAN',''],['',''],
     ['Satu sheet = satu kategori','Nama sheet & sel B2 menandai kategorinya. Jangan ubah baris 1-2.'],
     ['Menambah persyaratan','Ketik saja pada baris berikutnya di kolom B. Jumlah baris bebas (100+ boleh).'],
     ['Menghapus persyaratan','Kosongkan sel di kolom B. Baris kosong otomatis diabaikan.'],
     ['Kolom No','Boleh dibiarkan — penomoran ditata ulang oleh aplikasi.'],
     ['Penawaran Harga','Terkunci di aplikasi. Sheet-nya hanya rujukan dan diabaikan saat unggah.'],
     ['Sheet baru','Sheet tambahan diabaikan kecuali sel B2 berisi nama kategori yang dikenal.']
    ].forEach(function(r){ wsG.addRow(r); });
    wsG.getCell('A1').font={bold:true,size:14,color:{argb:'FF0E7C86'}};
    for(var r=3;r<=8;r++) wsG.getCell('A'+r).font={bold:true,color:{argb:'FF095E66'}};

    var buf=await wb.xlsx.writeBuffer();
    var blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a'); a.href=url;
    a.download='Template_Persyaratan_Pembukaan_Penawaran.xlsx';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast('Template persyaratan diunduh ('+sheets+' kategori)','ok');
  }catch(err){ console.error('pnwXlsTemplate:',err); try{ toast('Gagal membuat template: '+errMsg(err),'warn'); }catch(e){} }
}
function pnwXlsUpload(){
  var run=function(f){ pnwXlsRead(f); };
  try{
    if(typeof openTplUpload==='function'){
      openTplUpload({ title:'Unggah Template — Persyaratan Penawaran', accept:'.xlsx,.xls',
                      hint:'Hanya file Excel (.xlsx / .xls)', onFile:run });
      return;
    }
  }catch(e){}
  var inp=document.createElement('input'); inp.type='file'; inp.accept='.xlsx,.xls';
  inp.onchange=function(){ if(inp.files&&inp.files[0]) run(inp.files[0]); };
  inp.click();
}
function pnwXlsRead(file){
  if(!file) return;
  if(typeof XLSX==='undefined'){ toast('Pustaka Excel belum termuat. Muat ulang halaman.','warn'); return; }
  if(!/\.(xlsx|xls)$/i.test(file.name||'')){ toast('Berkas harus berformat Excel (.xlsx / .xls)','warn', TOAST_MS_UPLOAD); return; }
  var rd=new FileReader();
  rd.onload=function(e){
    try{
      var wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});
      var st=pnwState, two=pnwIsTwoSampul(st);
      var hasil={}, nKat=0, nRow=0, dilewati=[];
      wb.SheetNames.forEach(function(name){
        var ws=wb.Sheets[name]; if(!ws) return;
        var rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
        if(!rows.length) return;
        var cell=function(r,c){ return (rows[r]&&rows[r][c]!=null)?String(rows[r][c]).trim():''; };

        /* kategori: utamakan metadata B2, lalu nama sheet */
        var kat=null;
        if(pnwXlsNorm(cell(1,0))==='kategori') kat=pnwXlsFindKategori(cell(1,1));
        if(!kat) kat=pnwXlsFindKategori(String(name).replace(/^s[12]\s*-\s*/i,''));
        if(!kat){ if(pnwXlsNorm(name)!=='petunjuk') dilewati.push(name); return; }
        if(kat==='Penawaran Harga') return;   // terkunci

        /* sampul: metadata B1, lalu awalan nama sheet */
        var sk='s1';
        if(two){
          var sv=pnwXlsNorm(cell(0,0))==='sampul' ? pnwXlsNorm(cell(0,1)) : '';
          if(sv.indexOf('dua')>=0 || sv==='s2' || /^s2\s*-/i.test(name)) sk='s2';
        }
        if(two && sk==='s1' && kat==='Penawaran Harga') return;

        /* cari baris header "Uraian", lalu baca seluruh baris di bawahnya */
        var hdr=-1, colU=1;
        for(var r=0;r<Math.min(rows.length,30);r++){
          for(var c=0;c<(rows[r]||[]).length;c++){
            if(pnwXlsNorm(rows[r][c]).indexOf('uraian')===0){ hdr=r; colU=c; break; }
          }
          if(hdr>=0) break;
        }
        if(hdr<0){ hdr=3; colU=1; }
        var list=[];
        for(var r2=hdr+1;r2<rows.length;r2++){
          var v=(rows[r2]&&rows[r2][colU]!=null)?String(rows[r2][colU]).trim():'';
          if(v) list.push(v);
        }
        if(!list.length) return;
        hasil[sk]=hasil[sk]||{}; hasil[sk][kat]=list;
        nKat++; nRow+=list.length;
      });

      if(!nKat){ toast('Tidak ada kategori yang dikenali di berkas ini','warn', TOAST_MS_UPLOAD); return; }
      Object.keys(hasil).forEach(function(sk){
        st.pilih[sk]=st.pilih[sk]||{};
        st.syarat[sk]=st.syarat[sk]||{};
        Object.keys(hasil[sk]).forEach(function(kat){
          st.pilih[sk][kat]=true;
          st.syarat[sk][kat]=hasil[sk][kat];
        });
      });
      pnwEnforceHargaRule(st);
      pnwEnsureSyarat();
      pnwSaveState();
      try{ renderPnwForm(); }catch(e){}
      var msg=nKat+' kategori & '+nRow+' persyaratan dimuat';
      if(dilewati.length) msg+=' (sheet dilewati: '+dilewati.slice(0,3).join(', ')+(dilewati.length>3?'…':'')+')';
      toast(msg,'ok');
    }catch(err){ console.error('pnwXlsRead:',err); try{ toast('Gagal membaca berkas: '+errMsg(err),'warn', TOAST_MS_UPLOAD); }catch(e){} }
  };
  rd.onerror=function(){ try{ toast('Gagal membaca berkas','warn'); }catch(e){} };
  rd.readAsArrayBuffer(file);
}

/* ================= PROFIL PERSYARATAN (Simpan / Muat) =================
   Menyimpan daftar kategori + uraian persyaratan agar tidak perlu diketik ulang
   untuk pengadaan dengan persyaratan yang sama. Disimpan di localStorage browser
   (bertahan antar-sesi), terpisah dari data pekerjaan yang tersimpan di Supabase. */
const PNW_PROFIL_KEY='pnw_syarat_profiles_v1';
/* Profil Persyaratan kini tersimpan di Supabase (cache: profileCache.syarat). */
function pnwProfilAll(){ return profilesGet('syarat'); }
function pnwProfilSnapshot(){ const st=pnwState; return { pilih: JSON.parse(JSON.stringify(st.pilih||{})), syarat: JSON.parse(JSON.stringify(st.syarat||{})) }; }
function pnwProfilCount(snap){ let n=0; Object.values((snap&&snap.syarat)||{}).forEach(katObj=>Object.values(katObj||{}).forEach(arr=>{ (arr||[]).forEach(v=>{ if(String(v==null?'':v).trim()) n++; }); })); return n; }
function pnwProfilOverlay(inner){
  let ov=document.getElementById('pnw-profil-ov');
  if(!ov){ ov=document.createElement('div'); ov.id='pnw-profil-ov'; ov.className='pnw-profil-ov'; document.body.appendChild(ov); ov.onclick=(e)=>{ if(e.target===ov) pnwProfilClose(); }; }
  ov.innerHTML='<div class="pnw-profil-modal" role="dialog">'+inner+'</div>'; ov.style.display='flex';
}
function pnwProfilClose(){ const ov=document.getElementById('pnw-profil-ov'); if(ov) ov.style.display='none'; }
function pnwProfilOpenSave(){
  const cnt=pnwProfilCount(pnwProfilSnapshot());
  if(!cnt){ toast('Belum ada uraian persyaratan untuk disimpan','warn'); return; }
  const list=pnwProfilAll();
  const existing = list.length ? ('<div class="pnw-profil-existing">Profil tersimpan: '+list.map(p=>fkEsc(p.name)).join(' &middot; ')+'</div>') : '';
  pnwProfilOverlay(
    '<div class="pnw-profil-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>Simpan Profil Persyaratan</div>'+
    '<div class="pnw-profil-sub">Menyimpan <b>'+cnt+'</b> uraian persyaratan (beserta kategori terpilih) agar bisa dipakai lagi tanpa mengetik ulang.</div>'+
    '<input id="pnw-profil-name" class="pnw-profil-input" type="text" placeholder="Nama profil (mis. Pengadaan Barang Standar)" maxlength="60" onkeydown="if(event.key===\'Enter\')pnwProfilDoSave()">'+
    existing+
    '<div class="pnw-profil-actions"><button type="button" class="btn btn-ghost" onclick="pnwProfilClose()">Batal</button>'+
    '<button type="button" class="btn btn-teal" onclick="pnwProfilDoSave()">Simpan Profil</button></div>'
  );
  setTimeout(()=>{ const el=document.getElementById('pnw-profil-name'); if(el) el.focus(); },60);
}
async function pnwProfilDoSave(){
  const el=document.getElementById('pnw-profil-name'); const name=(el&&el.value||'').trim();
  if(!name){ toast('Isi nama profil dulu','warn'); if(el) el.focus(); return; }
  const snap=pnwProfilSnapshot(); snap.name=name; snap.savedAt=Date.now(); snap.count=pnwProfilCount(snap);
  if(await profilesUpsert('syarat', snap)){ toast('Profil "'+name+'" tersimpan','ok'); pnwProfilClose(); }
}
function pnwProfilOpenLoad(){
  const list=pnwProfilAll();
  if(!list.length){ toast('Belum ada profil. Simpan dulu lewat tombol "Simpan Profil".','warn'); return; }
  const items=list.slice().sort((a,b)=>(b.savedAt||0)-(a.savedAt||0)).map(p=>
    '<div class="pnw-profil-item"><div class="pnw-profil-item-info"><div class="pnw-profil-item-name">'+fkEsc(p.name)+'</div>'+
    '<div class="pnw-profil-item-meta">'+(p.count||0)+' persyaratan</div></div>'+
    '<div class="pnw-profil-item-btns">'+profilActionBtns('syarat',p.name)+'</div></div>'
  ).join('');
  pnwProfilOverlay(
    '<div class="pnw-profil-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>Muat Profil Persyaratan'+profilUploadBtnHtml('syarat')+'</div>'+
    '<div class="pnw-profil-sub">Pilih profil untuk mengisi uraian persyaratan. <b>Isian saat ini akan diganti.</b></div>'+
    '<div class="pnw-profil-list">'+items+'</div>'+
    '<div class="pnw-profil-actions"><button type="button" class="btn btn-ghost" onclick="pnwProfilClose()">Tutup</button></div>'
  );
}
function pnwProfilDoLoad(name){
  const p=pnwProfilAll().find(x=>String(x.name)===String(name)); if(!p){ toast('Profil tidak ditemukan','warn'); return; }
  pnwState.pilih = JSON.parse(JSON.stringify(p.pilih||{}));
  pnwState.syarat = JSON.parse(JSON.stringify(p.syarat||{}));
  pnwState.profilLoaded = true;   // tombol "Batalkan Profil" hanya tampil setelah profil dimuat
  pnwEnsureSyarat(); pnwSaveState(); pnwProfilClose(); renderPnwForm();
  toast('Profil "'+name+'" dimuat','ok');
}
async function pnwProfilDoDelete(name){
  if(await profilesDelete('syarat', name)){ toast('Profil "'+name+'" dihapus','ok'); if(pnwProfilAll().length) pnwProfilOpenLoad(); else pnwProfilClose(); }
}
/* Batalkan profil: kosongkan kembali uraian persyaratan ke tampilan default */
function pnwProfilCancel(){
  const st=pnwState;
  st.syarat={};
  st.profilLoaded=false;         // tombol "Batalkan Profil" ikut hilang
  pnwEnsureSyarat();
  pnwSaveState(); renderPnwForm();
  toast('Profil dibatalkan — isian dikembalikan ke default','ok');
}

/* ================= LANGKAH 4: PEMERIKSAAN ================= */
/* kunci pemeriksaan per baris persyaratan */
function pnwRowKey(kat, baris){ return kat+'||'+baris; }
/* Dropdown pilihan penyedia (sesuai Nama Penyedia yang diisi) */
function pnwPenyediaSelectHtml(){
  const st=pnwState;
  const opts=st.penyedia.map((nm,i)=>{
    const label=(nm&&nm.trim())?nm:('Penyedia '+(i+1));
    return '<option value="'+i+'"'+(i===pnwActivePenyedia?' selected':'')+'>'+fkEsc(label)+'</option>';
  }).join('');
  return '<div class="pnw-penyedia-select">'+
    '<svg class="pnw-sel-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'+
    '<select id="pnw-penyedia-select" onchange="pnwOnPenyediaSelect(this)">'+opts+'</select>'+
    '<svg class="pnw-sel-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg>'+
  '</div>';
}
function pnwOnPenyediaSelect(el){ pnwActivePenyedia=Math.max(0,parseInt(el.value,10)||0); renderPnwForm(); }
/* (dipertahankan utk kompatibilitas — tidak lagi dipakai di UI) */
function pnwPenyediaTabsHtml(){ return pnwPenyediaSelectHtml(); }
function pnwSampulTabsHtml(){
  const st=pnwState; if(!pnwIsTwoSampul(st)) return '';
  return '<div class="pnw-sampul-tabs">'+pnwSampulList(st).map(sk=>{
    const on = sk===pnwActiveSampul;
    return '<button type="button" class="pnw-stab'+(on?' on':'')+'" onclick="pnwSetSampul(\''+sk+'\')">'+
      '<span class="pnw-stab-dot"></span>Pembukaan Penawaran '+pnwSampulLabel(sk)+'</button>';
  }).join('')+'</div>';
}
/* Ringkasan progres pemeriksaan penyedia aktif (Ada / Tidak Ada / Belum) */
function pnwProgressPenyedia(){
  const st=pnwState, sk=pnwActiveSampul, pidx=pnwActivePenyedia;
  let ada=0,tidak=0,belum=0,total=0;
  pnwSelectedKategori(st,sk).forEach(kat=>{
    (st.syarat[sk][kat]||[]).forEach(baris=>{
      total++; const c=pnwGetPeriksa(sk,pidx,kat,baris);
      if(c.ada===true) ada++; else if(c.ada===false) tidak++; else belum++;
    });
  });
  return {ada,tidak,belum,total,pct: total?Math.round((ada+tidak)/total*100):0};
}
/* Panel pemeriksaan (hero header mewah + dropdown + tabel) */
function pnwPeriksaPanelHtml(){
  const st=pnwState, info=st.info||{};
  const two=pnwIsTwoSampul(st);
  const namaP=(st.penyedia[pnwActivePenyedia]&&st.penyedia[pnwActivePenyedia].trim())?st.penyedia[pnwActivePenyedia]:('Penyedia '+(pnwActivePenyedia+1));
  const pg=pnwProgressPenyedia();
  const subJudul = two ? ('Pembukaan Penawaran '+pnwSampulLabel(pnwActiveSampul)) : 'Pembukaan Penawaran';
  const metaChips = ''+
    (info.metode?'<span class="pnw-hero-chip">'+fkEsc(info.metode)+'</span>':'')+
    (info.penyampaian?'<span class="pnw-hero-chip">'+fkEsc(info.penyampaian)+'</span>':'')+
    '<span class="pnw-hero-chip">'+(two?'Dua Sampul':'Satu Sampul')+'</span>';

  let html='<div class="pnw-panel">';
  // HERO
  html+='<div class="pnw-hero">'+
    '<div class="pnw-hero-glow"></div>'+
    '<div class="pnw-hero-main">'+
      '<div class="pnw-hero-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg></div>'+
      '<div class="pnw-hero-text">'+
        '<div class="pnw-hero-kicker">Pemeriksaan Kelengkapan Dokumen Penawaran</div>'+
        '<div class="pnw-hero-title">'+fkEsc(info.nama||'Pekerjaan')+'</div>'+
        '<div class="pnw-hero-meta">'+metaChips+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="pnw-hero-picker">'+
      '<span class="pnw-picker-lbl">Pilihan Penyedia</span>'+
      pnwPenyediaSelectHtml()+
    '</div>'+
  '</div>';
  // SUB-BAR: sampul aktif + progres penyedia
  html+='<div class="pnw-subbar">'+
    '<div class="pnw-subbar-left"><span class="pnw-subbar-title">'+fkEsc(subJudul)+'</span>'+
      '<span class="pnw-active-penyedia"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'+fkEsc(namaP)+'</span>'+
    '</div>'+
    '<div class="pnw-progress"><div class="pnw-progress-stats">'+
        '<span class="pnw-pstat ada">Ada '+pg.ada+'</span>'+
        '<span class="pnw-pstat no">Tidak Ada '+pg.tidak+'</span>'+
        '<span class="pnw-pstat belum">Belum '+pg.belum+'</span>'+
      '</div>'+
      '<div class="pnw-progress-bar"><div class="pnw-progress-fill" style="width:'+pg.pct+'%"></div></div>'+
    '</div>'+
  '</div>';
  if(two) html+=pnwSampulTabsHtml();
  html+=pnwPeriksaTableHtml();
  html+='</div>';
  return html;
}
function pnwSetSampul(sk){ pnwActiveSampul=sk; renderPnwForm(); }
function pnwSetPenyedia(i){ pnwActivePenyedia=i; renderPnwForm(); }
/* nilai pemeriksaan satu baris — pakai state aktif: pnwPreviewState (saat pratinjau
   record tersimpan) atau pnwState (saat sedang mengisi form). Sebelumnya fungsi ini
   selalu membaca pnwState, sehingga pratinjau/PDF record tersimpan selalu tampil "–"
   walau data Ada/Tidak Ada sudah dipilih & tersimpan di record. */
function pnwGetPeriksa(sk, pidx, kat, baris){
  const st=pnwActiveState(); const p=st.periksa[sk]||{}; const pp=p[pidx]||{}; return pp[pnwRowKey(kat,baris)]||{};
}
function pnwSetAda(sk, pidx, kat, baris, val){
  const st=pnwState; st.periksa[sk]=st.periksa[sk]||{}; st.periksa[sk][pidx]=st.periksa[sk][pidx]||{};
  const k=pnwRowKey(kat,baris); const cur=st.periksa[sk][pidx][k]||{};
  cur.ada = (cur.ada===val)? undefined : val;
  st.periksa[sk][pidx][k]=cur; pnwSaveState();
  // Perbarui tampilan secara in-place agar posisi scroll TIDAK bergeser.
  // Hanya lakukan bila baris yang diklik memang sedang tampil (penyedia & sampul aktif).
  if(sk===pnwActiveSampul && pidx===pnwActivePenyedia && pnwPatchAdaRow(k, cur.ada)){
    pnwPatchProgress();
    return;
  }
  // fallback (mis. kondisi tak terduga): render ulang penuh
  renderPnwForm();
}
/* Perbarui satu baris (tombol Ada/Tidak Ada + warna baris) tanpa render ulang.
   Mengembalikan true bila baris ditemukan & diperbarui. */
function pnwPatchAdaRow(rk, ada){
  const cont=document.getElementById('pnw-content'); if(!cont) return false;
  const tr=cont.querySelector('tr[data-rk="'+(window.CSS&&CSS.escape?CSS.escape(rk):rk.replace(/"/g,'\\"'))+'"]');
  if(!tr){
    // fallback pencarian manual bila selector attr gagal (karakter khusus)
    const rows=cont.querySelectorAll('tr[data-rk]');
    let found=null; rows.forEach(r=>{ if(r.getAttribute('data-rk')===rk) found=r; });
    if(!found) return false;
    return pnwApplyRowState(found, ada);
  }
  return pnwApplyRowState(tr, ada);
}
function pnwApplyRowState(tr, ada){
  tr.classList.remove('is-ada','is-no');
  if(ada===true) tr.classList.add('is-ada');
  else if(ada===false) tr.classList.add('is-no');
  const btnAda=tr.querySelector('.fkl-ada-btn.ada');
  const btnNo =tr.querySelector('.fkl-ada-btn.no');
  if(btnAda) btnAda.classList.toggle('on', ada===true);
  if(btnNo)  btnNo.classList.toggle('on', ada===false);
  return true;
}
/* Perbarui ringkasan progres penyedia aktif (angka + bar) tanpa render ulang. */
function pnwPatchProgress(){
  const cont=document.getElementById('pnw-content'); if(!cont) return;
  const pg=pnwProgressPenyedia();
  const sAda=cont.querySelector('.pnw-pstat.ada');   if(sAda) sAda.textContent='Ada '+pg.ada;
  const sNo =cont.querySelector('.pnw-pstat.no');    if(sNo)  sNo.textContent='Tidak Ada '+pg.tidak;
  const sBl =cont.querySelector('.pnw-pstat.belum'); if(sBl)  sBl.textContent='Belum '+pg.belum;
  const fill=cont.querySelector('.pnw-progress-fill');if(fill) fill.style.width=pg.pct+'%';
}
function pnwSetKet(el){
  const st=pnwState; const sk=el.dataset.sk, pidx=+el.dataset.pidx, kat=el.dataset.kat, baris=el.dataset.baris;
  st.periksa[sk]=st.periksa[sk]||{}; st.periksa[sk][pidx]=st.periksa[sk][pidx]||{};
  const k=pnwRowKey(kat,baris); const cur=st.periksa[sk][pidx][k]||{}; cur.ket=el.value;
  st.periksa[sk][pidx][k]=cur; pnwSaveState();
}
function pnwPeriksaTableHtml(){
  const st=pnwState, sk=pnwActiveSampul, pidx=pnwActivePenyedia;
  const kats=pnwSelectedKategori(st,sk);
  if(!kats.length) return '<div class="fkl-empty-note">Belum ada kategori dokumen untuk sampul ini.</div>';
  let rows='';
  kats.forEach((kat,ki)=>{
    const arr=st.syarat[sk][kat]||[];
    rows+='<tr class="pnw-cat-row"><td colspan="4"><span class="pnw-cat-idx">'+(ki+1)+'</span><span class="pnw-cat-name">'+fkEsc(kat)+'</span></td></tr>';
    arr.forEach((baris,i)=>{
      const uraian = baris && baris.trim() ? baris : '(persyaratan '+(i+1)+')';
      const cur=pnwGetPeriksa(sk,pidx,kat,baris);
      const yes=cur.ada===true, no=cur.ada===false;
      const rowCls = yes ? 'is-ada' : (no ? 'is-no' : '');
      // Kolom Keterangan khusus untuk kategori Penawaran Harga (baris terkunci)
      const isRAB = (kat==='Penawaran Harga' && baris==='Nilai RAB');
      const isJangka = (kat==='Penawaran Harga' && baris==='Jangka Waktu Pelaksanaan');
      let ketPh='Tambahkan keterangan…', ketOn='oninput="pnwSetKet(this)"', ketMode='';
      if(isRAB){ ketPh='Isi Nilai Penawaran (dengan PPN)'; ketOn='oninput="onRupiahInput(this);pnwSetKet(this)"'; ketMode=' inputmode="numeric"'; }
      else if(isJangka){ ketPh='Isi jangka waktu pelaksanaan'; }
      const ketCell='<td class="pnw-ket"><input type="text"'+ketMode+' placeholder="'+fkEsc(ketPh)+'" data-sk="'+sk+'" data-pidx="'+pidx+'" data-kat="'+fkEsc(kat)+'" data-baris="'+fkEsc(baris)+'" value="'+fkEsc(cur.ket||'')+'" '+ketOn+'></td>';
      const rkAttr = 'data-rk="'+fkEsc(pnwRowKey(kat,baris))+'"';
      rows+='<tr class="'+rowCls+'" '+rkAttr+'>'+
        '<td class="pnw-no">'+(i+1)+'</td>'+
        '<td class="pnw-uraian">'+fkEsc(uraian)+'</td>'+
        '<td class="pnw-ck">'+
          '<span class="fkl-ada-opts">'+
            '<button type="button" class="fkl-ada-btn ada'+(yes?' on':'')+'" onclick="pnwSetAda(\''+sk+'\','+pidx+',\''+fkEscJs(kat)+'\',\''+fkEscJs(baris)+'\',true)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M20 6 9 17l-5-5"/></svg>Ada</button>'+
            '<button type="button" class="fkl-ada-btn no'+(no?' on':'')+'" onclick="pnwSetAda(\''+sk+'\','+pidx+',\''+fkEscJs(kat)+'\',\''+fkEscJs(baris)+'\',false)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M18 6 6 18M6 6l12 12"/></svg>Tidak Ada</button>'+
          '</span>'+
        '</td>'+
        ketCell+
      '</tr>';
    });
  });
  return '<div class="table-wrap pnw-table-wrap"><table class="pnw-periksa-table"><thead><tr>'+
    '<th class="pnw-no">No</th><th class="pnw-uraian">Uraian Persyaratan</th>'+
    '<th class="pnw-ck">Kelengkapan Dokumen</th><th class="pnw-ket">Keterangan</th>'+
    '</tr></thead><tbody>'+rows+'</tbody></table></div>';
}

/* ================= RENDER UTAMA ================= */
function renderPnwForm(){
  pnwMarkActive();
  pnwEnsureSyarat();
  const tt=document.getElementById('pnw-title'); if(tt) tt.textContent='Pembukaan Penawaran'+(pnwEditId?' — Ubah Data':' — Input Data');
  const sub=document.getElementById('pnw-sub');
  const cont=document.getElementById('pnw-content'); if(!cont) return;
  const st=pnwState;
  let html=pnwStepperHtml();

  if(pnwStep===1){
    if(sub) sub.textContent='Langkah 1 dari 4 — Lengkapi data pekerjaan & penyedia';
    html+='<div class="form-card"><div class="form-section-title">'+KR_SECTION_ICON+'Data Pekerjaan'+dpPickBtnHtml('pnw')+'</div><div class="form-flow" style="--cols:4">';
    html+=PNW_INFO_FIELDS.map(pnwInfoInputHtml).join('');
    html+=pnwPenyediaFieldsHtml();
    html+='</div>';
    html+='</div>';
    html+='<div class="form-card"><div class="form-section-title">'+FKL_SEC_ICON+'Nama Penyedia</div>'+pnwPenyediaListHtml()+'</div>';
    html+=pnwActionsHtml({back:false});
  }
  else if(pnwStep===2){
    if(sub) sub.textContent='Langkah 2 dari 4 — Pilih kategori dokumen yang diperiksa';
    pnwSampulList(st).forEach(sk=>{ html+=pnwKategoriGroupHtml(sk); });
    html+=pnwActionsHtml({back:true});
  }
  else if(pnwStep===3){
    if(sub) sub.textContent='Langkah 3 dari 4 — Isi uraian persyaratan tiap kategori';
    let body='';
    pnwSampulList(st).forEach(sk=>{ body+=pnwSyaratGroupHtml(sk); });
    if(!body) body='<div class="fkl-empty-note">Belum ada kategori dipilih. Kembali ke langkah <b>Pilihan Kategori</b>.</div>';
    html+='<div class="form-card"><div class="form-section-title pnw-syarat-title">'+
        '<span class="pnw-syarat-title-txt">'+FKL_SEC_ICON+'Pengisian Persyaratan</span>'+
        '<span class="pnw-profil-bar">'+
          '<button type="button" class="btn btn-amber pnw-profil-btn" title="Simpan Profil" onclick="pnwProfilOpenSave()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>Profil</button>'+
          '<button type="button" class="btn btn-teal pnw-profil-btn" title="Muat Profil" onclick="pnwProfilOpenLoad()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>Profil</button>'+
          '<button type="button" class="btn btn-green pnw-profil-btn" title="Unduh template Excel persyaratan" onclick="pnwXlsTemplate()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>Template</button>'+
          '<button type="button" class="btn btn-light pnw-profil-btn" title="Unggah template Excel persyaratan" onclick="pnwXlsUpload()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 8l5-5 5 5"/><path d="M12 3v12"/></svg>Unggah</button>'+
          (st.profilLoaded ? '<button type="button" class="btn btn-red pnw-profil-btn" onclick="pnwProfilCancel()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>Batalkan Profil</button>' : '')+
        '</span>'+
      '</div>'+body+'</div>';
    html+=pnwActionsHtml({back:true});
  }
  else{
    if(sub) sub.textContent='Langkah 4 dari 4 — Pemeriksaan kelengkapan dokumen penawaran';
    html+=pnwPeriksaPanelHtml();
    html+=pnwActionsHtml({back:true, save:true});
  }
  cont.innerHTML=html;

  // isi ulang nilai field langkah 1
  if(pnwStep===1){
    PNW_INFO_FIELDS.forEach(f=>{
      const el=document.getElementById('pnw-'+f.key); if(!el) return;
      const v=st.info[f.key];
      el.value = (f.type==='num') ? rupiahInputText(v) : (v!=null?v:'');
    });
    const pj=document.getElementById('pnw-pejabat'); if(pj) pj.value=st.pejabat||'';
  }
}
function pnwPenyampaianNoteText(){
  const p=pnwState.info.penyampaian||'';
  if(p==='1 Tahap 1 Sampul') return 'Metode 1 Tahap 1 Sampul: seluruh dokumen dijadikan satu file PDF dan satu tahapan pemeriksaan.';
  if(p==='1 Tahap 2 Sampul' || p==='2 Tahap') return 'Metode '+p+': dokumen dipisah menjadi dua sampul/tahapan — Sampul Satu dan Sampul Dua, masing-masing dengan pemeriksaan & file PDF terpisah.';
  return 'Pilih metode penyampaian untuk menentukan jumlah sampul/tahapan pemeriksaan.';
}
function pnwActionsHtml(o){
  o=o||{};
  // Batal (merah) berdampingan dengan tombol navigasi di pojok kanan
  let right='<button class="btn btn-red" onclick="pnwBatal()">'+FKL_IC_X+'Batal</button>';
  if(o.back) right+='<button class="btn btn-light" onclick="pnwBack()">'+FKL_IC_BACK+(pnwStep===4?'Sebelumnya':'Kembali')+'</button>';
  if(o.save) right+='<button class="btn btn-green" onclick="pnwSimpan()">'+FKL_IC_SAVE+'Simpan</button>';
  else right+='<button class="btn btn-teal" onclick="pnwNext()">Selanjutnya'+FKL_IC_NEXT+'</button>';
  return '<div class="fkl-actions"><div class="fkl-actions-right">'+right+'</div></div>';
}

/* ---------- Interaksi langkah 1 ---------- */
function pnwOnInfoChange(){
  const st=pnwState;
  PNW_INFO_FIELDS.forEach(f=>{
    if(pnwIsLocked(f.key)) return;
    const el=document.getElementById('pnw-'+f.key); if(!el) return;
    st.info[f.key] = (f.type==='num') ? parseRupiah(el.value) : el.value.trim();
  });
  pnwSaveState();
}
function pnwOnPenyampaianChange(){
  pnwOnInfoChange();
}
function pnwOnJumlahChange(el){
  const n=Math.max(1,Math.min(20,parseInt(el.value,10)||1));
  const st=pnwState; const cur=st.penyedia.slice();
  const next=[]; for(let i=0;i<n;i++) next.push(cur[i]||'');
  st.penyedia=next;
  if(pnwActivePenyedia>=n) pnwActivePenyedia=n-1;
  pnwSaveState(); renderPnwForm();
}
function pnwOnPenyediaNama(el){ const i=+el.dataset.pidx; pnwState.penyedia[i]=el.value; pnwSaveState(); }
function pnwOnPejabatChange(el){ pnwState.pejabat=el.value; pnwSaveState(); }

/* ---------- Interaksi langkah 2 ---------- */
function pnwOnPilih(el){
  const st=pnwState, sk=el.dataset.sk, kat=el.dataset.kat;
  st.pilih[sk]=st.pilih[sk]||{}; st.pilih[sk][kat]=el.checked;
  pnwEnforceHargaRule(st);   // pertahankan aturan: Harga otomatis di Sampul Dua & tidak ada di Sampul Satu
  pnwSaveState();
  const chip=el.closest('.form-card').querySelector('.fkl-count-chip');
  if(chip){ const list=pnwKategoriUntukSampul(st,sk); const c=list.filter(k=>st.pilih[sk][k]).length; chip.textContent=c+' dipilih'; }
}

/* ---------- Navigasi ---------- */
function pnwNext(){
  const st=pnwState;
  if(pnwStep===1){
    pnwOnInfoChange();
    if(!String(st.info.nama||'').trim()){ toast('Nama Pekerjaan wajib diisi','warn'); return; }
    if(!st.info.penyampaian){ toast('Pilih Metode Penyampaian Dokumen','warn'); return; }
    pnwStep=2;
  } else if(pnwStep===2){
    let any=false; pnwSampulList(st).forEach(sk=>{ if(pnwSelectedKategori(st,sk).length) any=true; });
    if(!any){ toast('Pilih minimal satu kategori dokumen','warn'); return; }
    pnwEnsureSyarat(); pnwStep=3;
  } else if(pnwStep===3){
    pnwActiveSampul='s1'; pnwActivePenyedia=0; pnwStep=4;
  }
  renderPnwForm(); pnwScrollTop();
}
function pnwBack(){ if(pnwStep>1){ pnwStep--; renderPnwForm(); pnwScrollTop(); } }
function pnwScrollTop(){ const v=document.getElementById('view-form-pembukaan'); if(v) v.scrollIntoView({behavior:'smooth',block:'start'}); }
function pnwBatal(){
  openConfirm({ icon:'del', title:'Batalkan Proses',
    text:'Batalkan proses ini? Data yang belum disimpan akan hilang.',
    onYes:()=>{ pnwEditId=null; pnwState=pnwBlankState(); pnwSaveState(); pnwStep=1; openPnwView(); toast('Proses dibatalkan','ok'); }
  });
}

/* ---------- Simpan ---------- */
/* Progres pemeriksaan SATU sampul: berapa baris seluruhnya & berapa yang sudah
   ditandai (Ada/Tidak Ada). Dipakai untuk mengizinkan Sampul Dua disimpan kosong. */
function pnwSampulProgres(sk, st){
  st = st || pnwActiveState();
  const kats=pnwSelectedKategori(st,sk);
  let total=0, isi=0;
  (st.penyedia||[]).forEach((_,pidx)=>{
    kats.forEach(kat=>{ ((st.syarat[sk]||{})[kat]||[]).forEach(baris=>{
      total++;
      const c=pnwGetPeriksa(sk,pidx,kat,baris);
      if(c.ada===true || c.ada===false) isi++;
    }); });
  });
  return { total:total, isi:isi, belum:total-isi, kosong:(isi===0) };
}
/* Sampul yang WAJIB lengkap saat menyimpan.
   Sampul Satu selalu wajib. Sampul Dua hanya wajib bila SUDAH mulai diperiksa —
   bila masih kosong sama sekali, dokumen tetap boleh disimpan (Sampul Satu & Dua
   memang lazim dibuka pada hari yang berbeda) dan dapat dilengkapi kemudian. */
function pnwSampulWajib(st){
  st = st || pnwActiveState();
  return pnwSampulList(st).filter(sk=>{
    if(sk!=='s2') return true;
    return !pnwSampulProgres(sk, st).kosong;
  });
}
/* Sampul yang sudah punya isi — dipakai untuk dokumen gabungan (cetak/pratinjau) */
function pnwSampulTerisi(st){
  st = st || pnwActiveState();
  const ada=pnwSampulList(st).filter(sk=>{
    const p=pnwSampulProgres(sk, st);
    return p.total>0 && p.isi>0;
  });
  return ada.length ? ada : ['s1'];
}
function pnwCountBelum(){
  const st=pnwState; let belum=0;
  pnwSampulWajib(st).forEach(sk=>{
    const kats=pnwSelectedKategori(st,sk);
    st.penyedia.forEach((_,pidx)=>{
      kats.forEach(kat=>{ (st.syarat[sk][kat]||[]).forEach(baris=>{ const c=pnwGetPeriksa(sk,pidx,kat,baris); if(c.ada!==true && c.ada!==false) belum++; }); });
    });
  });
  return belum;
}
/* Cari lokasi (sampul + penyedia) pertama yang masih memiliki baris belum ditandai.
   Mengembalikan {sk, pidx, nama} atau null bila semua sudah lengkap. */
function pnwFirstBelum(){
  const st=pnwState;
  const sampuls=pnwSampulWajib(st);
  for(let s=0;s<sampuls.length;s++){
    const sk=sampuls[s];
    const kats=pnwSelectedKategori(st,sk);
    for(let pidx=0;pidx<st.penyedia.length;pidx++){
      for(const kat of kats){
        for(const baris of (st.syarat[sk][kat]||[])){
          const c=pnwGetPeriksa(sk,pidx,kat,baris);
          if(c.ada!==true && c.ada!==false){
            const nama=(st.penyedia[pidx]&&st.penyedia[pidx].trim())?st.penyedia[pidx]:('Penyedia '+(pidx+1));
            return {sk, pidx, nama};
          }
        }
      }
    }
  }
  return null;
}
async function pnwSimpan(){
  if(!requireInput()) return;
  const st=pnwState; const info=st.info||{};
  const nama=String(info.nama||'').trim();
  if(!nama){ toast('Nama Pekerjaan wajib diisi','warn'); pnwStep=1; renderPnwForm(); return; }
  const jenisDok = pnwIsTwoSampul(st) ? 'Dua Sampul' : 'Satu Sampul';
  const doSave=async()=>{
    const rec={
      nama_pekerjaan:nama,
      lokasi: info.lokasi||'',
      metode: info.metode||'',
      penyampaian: info.penyampaian||'',
      jenis_dokumen: jenisDok,
      tgl_periksa: (new Date()).toISOString().slice(0,10),
      state: JSON.parse(JSON.stringify(st))
    };
    let ok=false;
    try{
      await withActionLoader(pnwEditId?'Menyimpan perubahan':'Menyimpan', async()=>{
        if(pnwEditId) await StorePembukaan.update(pnwEditId, rec);
        else await StorePembukaan.create(rec);
        await refreshDataPembukaan();
      });
      ok=true;
    }catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'err'); return; }
    if(!ok) return;
    toast(pnwEditId?'Data berhasil diperbarui':'Data berhasil disimpan','ok');
    // Beritahu bila Sampul Dua sengaja dibiarkan kosong (boleh dilengkapi kemudian)
    if(pnwIsTwoSampul(st) && pnwSampulProgres('s2', st).kosong){
      setTimeout(()=>toast('Sampul Dua belum diperiksa — dapat dilengkapi kemudian lewat tombol Ubah','warn'), 900);
    }
    pnwEditId=null; pnwState=pnwBlankState(); pnwSaveState(); pnwStep=1;
    showView('pnw-view');
  };
  const belum=pnwCountBelum();
  if(belum>0){
    // Tolak simpan: seluruh pemeriksaan (setiap penyedia) harus lengkap dulu.
    const loc=pnwFirstBelum();
    toast('Data gagal disimpan, lengkapi pemeriksaan terlebih dahulu','err');
    if(loc){
      // arahkan langsung ke sampul & penyedia yang masih ada baris belum ditandai
      pnwActiveSampul=loc.sk; pnwActivePenyedia=loc.pidx;
      if(pnwStep!==4){ pnwStep=4; }
      renderPnwForm(); pnwScrollTop();
    }
    return;
  }
  doSave();
}

/* ================= LIHAT HASIL PEMERIKSAAN ================= */
let pnwViewPage=1;
const PNW_VIEW_PAGE_SIZE=8;
function pnwViewRows(){
  let rows=(records_pembukaan||[]).slice();
  const fs=(document.getElementById('pnw-view-search')?.value||'').toLowerCase().trim();
  if(fs) rows=rows.filter(r=>String(r.nama_pekerjaan||(r.state&&r.state.info&&r.state.info.nama)||'').toLowerCase().includes(fs));
  return rows;
}
function pnwEmptyRow(){
  return '<tr><td colspan="7"><div class="empty">'+
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16a1 1 0 0 1 1 1v3H3V5a1 1 0 0 1 1-1Z"/><path d="M3 8v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8"/><path d="M9 13h6"/></svg>'+
    '<div>Data tidak tersedia</div></div></td></tr>';
}
function renderPnwView(){
  const tb=document.getElementById('pnw-view-body');
  const pg=document.getElementById('pnw-view-pagination');
  const cEl=document.getElementById('pnw-view-count');
  if(!tb) return;
  const rows=pnwViewRows();
  if(cEl) cEl.textContent=rows.length;
  if(!rows.length){ tb.innerHTML=pnwEmptyRow(); if(pg) pg.innerHTML=''; return; }
  const totalPages=Math.max(1,Math.ceil(rows.length/PNW_VIEW_PAGE_SIZE));
  if(pnwViewPage>totalPages) pnwViewPage=totalPages;
  if(pnwViewPage<1) pnwViewPage=1;
  const start=(pnwViewPage-1)*PNW_VIEW_PAGE_SIZE;
  const pageRows=rows.slice(start,start+PNW_VIEW_PAGE_SIZE);
  tb.innerHTML=pageRows.map((r,i)=>{
    const stt=r.state||{}; const info=stt.info||{};
    const nama=r.nama_pekerjaan||info.nama||'—';
    const lokasi=(r.lokasi||info.lokasi||'').trim();
    const metode=r.metode||info.metode||'';
    const jenis=r.jenis_dokumen||(pnwIsTwoSampul(stt)?'Dua Sampul':'Satu Sampul');
    const tgl=r.tgl_periksa||'';
    const two = jenis==='Dua Sampul';
    const rid=fkEsc(String(r.id));
    // Satu baris per data. Tombol Lihat membuka DOKUMEN GABUNGAN (Sampul Satu +
    // Sampul Dua, halaman terpisah). Sampul Dua yang belum diperiksa ditandai.
    const s2Kosong = two ? pnwSampulProgres('s2', stt).kosong : false;
    const jenisCell = two
      ? ('Dua Sampul' + (s2Kosong ? '<span class="pnw-s2-tag">Sampul Dua belum diisi</span>' : ''))
      : 'Satu Sampul';
    const actions='<div class="action-cell" style="justify-content:center">'+
        '<button class="act act-edit" title="Ubah" onclick="openPnwInput(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>'+
        '<button class="act act-view" title="Lihat" onclick="pnwPreviewRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>'+
        '<button class="act act-del" title="Hapus" onclick="pnwDeleteRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>'+
      '</div>';
    return '<tr>'+
      '<td class="col-no">'+(start+i+1)+'</td>'+
      '<td class="wrap-cell col-nama-freeze">'+fkEsc(nama)+'</td>'+
      '<td class="fkl-col-lokasi">'+fkEsc(lokasi||'—')+'</td>'+
      '<td>'+fkEsc(metode||'—')+'</td>'+
      '<td class="pnw-jd-cell">'+jenisCell+'</td>'+
      '<td class="col-date">'+fkEsc(tgl?pnwDateLong(tgl):'—')+'</td>'+
      '<td>'+actions+'</td>'+
    '</tr>';
  }).join('');
  if(pg){
    if(totalPages<=1){ pg.innerHTML=''; }
    else{
      let h='<button class="pg-btn" '+(pnwViewPage<=1?'disabled':'')+' onclick="pnwViewGoto('+(pnwViewPage-1)+')">‹</button>';
      for(let p=1;p<=totalPages;p++) h+='<button class="pg-btn '+(p===pnwViewPage?'active':'')+'" onclick="pnwViewGoto('+p+')">'+p+'</button>';
      h+='<button class="pg-btn" '+(pnwViewPage>=totalPages?'disabled':'')+' onclick="pnwViewGoto('+(pnwViewPage+1)+')">›</button>';
      pg.innerHTML=h;
    }
  }
}
function pnwViewGoto(p){ pnwViewPage=p; renderPnwView(); }
function pnwPreviewRecord(id){
  const rec=records_pembukaan.find(r=>String(r.id)===String(id)); if(!rec) return;
  pnwPreviewState = pnwRecordToState(rec);
  pnwOpenPreview();
}
function pnwDeleteRecord(id){
  if(!requireInput()) return;
  const rec=records_pembukaan.find(r=>String(r.id)===String(id)); if(!rec) return;
  openConfirm({ icon:'del', title:'Hapus Data',
    text:'Hapus data pembukaan penawaran "'+(rec.nama_pekerjaan||(rec.state&&rec.state.info&&rec.state.info.nama)||'')+'"?',
    onYes:async()=>{
      try{ await withActionLoader('Menghapus', async()=>{ await StorePembukaan.remove(id); await refreshDataPembukaan(); }); }
      catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'err'); return; }
      toast('Data dihapus','ok'); renderPnwView();
    }
  });
}
const PNW_BULAN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
function pnwDateLong(s){ if(!s) return ''; const p=String(s).split('-'); if(p.length!==3) return s; const y=p[0],m=parseInt(p[1],10),d=p[2]; return d+' '+(PNW_BULAN[m-1]||'')+' '+y; }

/* Keterangan "Jangka Waktu Pelaksanaan" tampil dengan satuan hari (mis. 60 -> "60 hari") */
function pnwFmtKet(kat, baris, ket){
  let v = (ket==null) ? '' : String(ket).trim();
  if(!v) return '';
  if(kat==='Penawaran Harga' && baris==='Jangka Waktu Pelaksanaan' && /^\d+([.,]\d+)?$/.test(v)) v += ' hari';
  return v;
}

/* ================= DOKUMEN PDF ================= */
/* Bangun dokumen satu sampul (utk penyampaian 1 sampul, atau salah satu sampul) */
function pnwBuildDocHtml(sk){
  const st=pnwActiveState(); const info=st.info||{};
  const two=pnwIsTwoSampul(st);
  const kats=pnwSelectedKategori(st,sk);
  const fmtNilai = (info.nilai!=='' && info.nilai!=null) ? 'Rp '+Number(info.nilai).toLocaleString('id-ID') : '-';
  const tglDoc = st.__tgl ? pnwDateLong(st.__tgl) : pnwDateLong((new Date()).toISOString().slice(0,10));
  const infoRow=(k,v)=>'<tr><td class="k">'+k+'</td><td class="s">:</td><td class="v" style="text-align:justify">'+fkEsc(v||'-')+'</td></tr>';

  // Per penyedia: satu blok tabel
  const penyBlocks = st.penyedia.map((nm,pidx)=>{
    const namaP=(nm&&nm.trim())?nm:('Penyedia '+(pidx+1));
    let rows='';
    kats.forEach(kat=>{
      rows+='<tr class="cat"><td colspan="4">'+fkEsc(kat)+'</td></tr>';
      (st.syarat[sk][kat]||[]).forEach((baris,i)=>{
        const uraian=baris&&baris.trim()?baris:('(persyaratan '+(i+1)+')');
        const c=pnwGetPeriksa(sk,pidx,kat,baris);
        const cell = c.ada===true ? '<span class="pill ada">Ada</span>' : (c.ada===false ? '<span class="pill no">Tidak Ada</span>' : '<span class="pill nn">–</span>');
        rows+='<tr><td class="no">'+(i+1)+'</td><td class="nm">'+fkEsc(uraian)+'</td><td class="ck">'+cell+'</td><td class="kt">'+fkEsc(pnwFmtKet(kat,baris,c.ket))+'</td></tr>';
      });
    });
    if(!rows) rows='<tr><td colspan="4" class="empty">Data tidak tersedia</td></tr>';
    return '<div class="pnw-penyedia-block">'+
      '<div class="pnw-penyedia-name">'+fkEsc(namaP.toUpperCase())+'</div>'+
      '<table class="fkl-chk"><thead><tr><th class="no">No</th><th class="nm">Uraian Persyaratan</th><th class="ck">Kelengkapan Dokumen</th><th class="kt">Keterangan</th></tr></thead><tbody>'+rows+'</tbody></table>'+
    '</div>';
  }).join('');

  // Hasil Pemeriksaan: rekap kelengkapan dokumen penawaran per penyedia
  const hasilRows = st.penyedia.map((nm,pidx)=>{
    const namaP=(nm&&nm.trim())?nm:('Penyedia '+(pidx+1));
    let total=0, kurang=0;
    kats.forEach(kat=>{
      (st.syarat[sk][kat]||[]).forEach(baris=>{
        total++;
        const c=pnwGetPeriksa(sk,pidx,kat,baris);
        if(c.ada===false) kurang++;
      });
    });
    const lengkap = (total>0 && kurang===0);
    const status = lengkap ? '<span class="pill ada">Lengkap</span>' : '<span class="pill no">Tidak Lengkap</span>';
    const ket = lengkap ? 'Seluruh dokumen penawaran dinyatakan lengkap' : ('Terdapat '+kurang+' dari '+total+' dokumen yang tidak lengkap');
    return '<tr><td class="no">'+(pidx+1)+'</td><td class="nm">'+fkEsc(namaP.toUpperCase())+'</td><td class="ck">'+status+'</td><td class="kt">'+ket+'</td></tr>';
  }).join('');
  const hasilBlock = '<table class="fkl-chk pnw-hasil"><thead><tr>'+
    '<th class="no">No</th><th class="nm">Nama Penyedia</th>'+
    '<th class="ck">Hasil Pemeriksaan</th><th class="kt">Keterangan</th>'+
    '</tr></thead><tbody>'+(hasilRows||'<tr><td colspan="4" class="empty">Data tidak tersedia</td></tr>')+'</tbody></table>';

  const judul = two
    ? 'FORM PEMBUKAAN PENAWARAN<br>'+pnwSampulLabel(sk).toUpperCase()
    : 'FORM PEMBUKAAN PENAWARAN';

  return ''+
  '<div class="fkl-doc pnw-doc">'+
    '<div class="fkl-doc-head">'+
      '<div class="fkl-doc-logo"><img src="'+FKL_LOGO_SRC+'" alt="Logo PLN"></div>'+
      '<div class="fkl-doc-org">'+
        '<div class="l1">PT PLN (PERSERO)</div>'+
        '<div class="l2">UNIT PELAKSANA PELAYANAN PELANGGAN MASOHI</div>'+
        '<div class="l3">Jl. Abdullah Soulissa No 1, Masohi, Kec. Kota Masohi</div>'+
      '</div>'+
    '</div>'+
    '<div class="fkl-doc-band"></div>'+
    '<h1 class="fkl-doc-title">'+judul+'</h1>'+
    '<div class="fkl-doc-titlegap"></div>'+

    '<div class="fkl-sec-h"><span class="rn">A</span>Data Pekerjaan</div>'+
    '<table class="fkl-info"><tbody>'+
      infoRow('Nama Pekerjaan', info.nama)+
      infoRow('Lokasi Pekerjaan', info.lokasi)+
      infoRow('Rencana Anggaran Biaya', fmtNilai)+
      infoRow('No. Anggaran', info.no_anggaran)+
      infoRow('Tgl. Anggaran', info.tgl_anggaran?pnwDateLong(info.tgl_anggaran):'-')+
      infoRow('Jenis Anggaran', info.jenis_anggaran)+
      infoRow('Metode Pengadaan', info.metode)+
    '</tbody></table>'+

    '<div class="fkl-sec-h"><span class="rn">B</span>Pemeriksaan Kelengkapan Dokumen Penawaran</div>'+
    penyBlocks+

    '<div class="fkl-doc-tail">'+
    '<div class="fkl-sec-h"><span class="rn">C</span>Hasil Pemeriksaan</div>'+
    hasilBlock+

    '<div class="fkl-doc-foot">'+
      '<div class="ttd-date">Masohi, '+fkEsc(tglDoc)+'</div>'+
      '<table class="ttd ttd-single"><tbody><tr>'+
        '<td><div class="role">Diperiksa oleh,</div><div class="role2">Pejabat Pelaksana Pengadaan</div><div class="gap"></div><div class="nm nm-up">'+fkEsc(st.pejabat?String(st.pejabat).trim().toUpperCase():'(..........................)')+'</div></td>'+
      '</tr></tbody></table>'+
    '</div>'+
    '</div>'+
  '</div>';
}
/* Dokumen mandiri: GABUNGAN seluruh sampul yang sudah terisi.
   Sampul Satu & Sampul Dua digabung dalam satu berkas, masing-masing mulai di
   halaman baru. Bila Sampul Dua belum diperiksa, hanya Sampul Satu yang dicetak. */
function pnwStandaloneDocHtml(){
  const st=pnwActiveState();
  const list = pnwIsTwoSampul(st) ? pnwSampulTerisi(st) : ['s1'];
  const isi = list.map(sk=>pnwBuildDocHtml(sk)).join('');
  return fklDocShell(pnwExtraDocCss(), isi);
}
function pnwExtraDocCss(){
  return ''+
  /* Dokumen gabungan: tiap sampul berikutnya SELALU mulai di halaman baru.
     Di layar (pratinjau) diberi garis pemisah agar batas antar form terlihat. */
  '.pnw-doc + .pnw-doc{page-break-before:always;break-before:page}'+
  /* Pemisah antar-penyedia berlaku di LAYAR MAUPUN CETAK. Dulu dibedakan (di cetak
     dihapus), sehingga tinggi isi di pratinjau tidak sama dengan hasil cetak. */
  '.pnw-doc + .pnw-doc{margin-top:26px;padding-top:26px;border-top:2px dashed #cbd5d8}'+
  '.pnw-penyedia-block{margin:6px 0 14px}'+
  '.pnw-penyedia-name{font-family:"Plus Jakarta Sans",sans-serif;font-weight:800;font-size:12px;letter-spacing:.4px;color:#0b3d42;background:#e3f2f3;border:1px solid #bfe0e2;border-radius:6px;padding:6px 10px;margin-bottom:6px;text-transform:uppercase}'+
  '.fkl-chk td.kt,.fkl-chk th.kt{width:22%;text-align:left}'+
  /* Baris judul kategori persyaratan — dibedakan jelas dari isi persyaratan */
  '.fkl-chk tr.cat td{background:#e3f2f3;color:#0b3d42;font-weight:800;font-size:11.5px;text-transform:uppercase;letter-spacing:.8px;padding:7px 12px 7px 14px;border-top:1.5px solid #0b6a73;border-bottom:1px solid #9fc7cb;border-right:none;position:relative;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  '.fkl-chk tr.cat td::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:#0E7C86}'+
  '.fkl-chk tr.cat:first-child td{border-top:none}'+
  '.fkl-chk tr.cat + tr td{border-top:none}'+
  '.ttd.ttd-single{width:auto}'+
  '.ttd.ttd-single td{width:280px;text-align:center;vertical-align:top;padding-top:4px}'+
  '.pnw-doc .fkl-chk thead th{text-align:center;white-space:normal;line-height:1.22;vertical-align:middle}'+
  '.pnw-doc .fkl-chk:not(.pnw-hasil) th.ck,.pnw-doc .fkl-chk:not(.pnw-hasil) td.ck{width:112px}'+
  '.pnw-doc .fkl-chk:not(.pnw-hasil) .pill{min-width:0;padding:3px 8px}'+
  '.pnw-hasil{margin-top:2px;table-layout:fixed}'+
  '.pnw-doc .pnw-hasil th.no,.pnw-doc .pnw-hasil td.no{width:34px}'+
  '.pnw-doc .pnw-hasil th.ck,.pnw-doc .pnw-hasil td.ck{width:136px}'+
  /* Kolom Nama Penyedia dipersempit 35% (52% -> 34%); sisa ruangnya dialihkan ke
     kolom Keterangan (22% -> 40%) agar teks keterangan tidak terpecah sempit. */
  '.pnw-doc .pnw-hasil th.nm,.pnw-doc .pnw-hasil td.nm{width:34%}'+
  '.pnw-doc .pnw-hasil th.kt,.pnw-doc .pnw-hasil td.kt{width:40%}'+
  '.pnw-doc .pnw-hasil td.nm{white-space:normal;word-break:break-word;overflow-wrap:break-word}'+
  '.pnw-doc .pnw-hasil td.kt{white-space:normal}'+
  /* ---- Tanda tangan diselaraskan agar MENYATU dengan isi dokumen ----
     Sebelumnya nama pejabat memakai bobot 800 & ukuran 12,5px sehingga terlihat
     seperti jenis huruf yang berbeda dan lebih besar dari label di atasnya.
     Kini SELURUH elemen (tanggal, "Diperiksa oleh,", "Pejabat Pelaksana
     Pengadaan", dan nama) memakai satu jenis huruf yang sama (Plus Jakarta Sans
     ditetapkan eksplisit) dengan skala ukuran seragam 12px dan tangga bobot yang
     rapi (label 600 -> jabatan 700 -> nama 700). */
  '.fkl-doc-foot .ttd-date,'+
  '.fkl-doc-foot .ttd .role,'+
  '.fkl-doc-foot .ttd .role2,'+
  '.fkl-doc-foot .ttd .nm{font-family:"Plus Jakarta Sans","Segoe UI",sans-serif}'+
  '.fkl-doc-foot .ttd-date{font-size:12px;font-weight:600;color:#22343a}'+
  '.fkl-doc-foot .ttd .role{font-size:12px;font-weight:600;letter-spacing:.2px;color:#22343a}'+
  '.ttd .role2{font-size:12px;font-weight:700;line-height:1.3;letter-spacing:.2px;color:#0d2a30;margin-top:1px}'+
  '.fkl-doc-foot .ttd .nm{font-size:12px;font-weight:700;letter-spacing:.3px;color:#0d2a30;padding-top:5px}';
}
function pnwOpenPreview(){
  const ov=document.getElementById('pn-preview-overlay'); if(!ov) return;
  const _mdl=ov.querySelector('.pn-preview-modal'); if(_mdl) _mdl.classList.remove('is-max');
  if(typeof pnPreviewResetMaxBtn==='function') pnPreviewResetMaxBtn();
  const titleEl=document.getElementById('pn-preview-title');
  const _st=pnwActiveState();
  const two=pnwIsTwoSampul(_st);
  if(titleEl){
    let sub='';
    if(two){
      const isi=pnwSampulTerisi(_st);
      sub = (isi.length>1) ? ' (Sampul Satu & Sampul Dua)' : (' ('+pnwSampulLabel(isi[0])+')');
    }
    titleEl.textContent='Pratinjau — Form Pembukaan Penawaran'+sub;
  }
  const body=document.getElementById('pn-preview-body');
  if(body){
    body.classList.add('fkl-preview-body');
    body.innerHTML='<iframe id="pnw-preview-frame" title="Pratinjau Dokumen"></iframe>';
    const ifr=document.getElementById('pnw-preview-frame');
    const doc=ifr.contentWindow.document; doc.open(); doc.write(pnwStandaloneDocHtml()); doc.close();
  }
  const actions=document.querySelector('#pn-preview-overlay .pn-preview-head-actions');
  { const _c=document.getElementById('hpsc-preview-print'); if(_c) _c.remove(); }
  // hapus tombol cetak FKL bila ada agar tidak bentrok
  const oldFkl=document.getElementById('fkl-preview-print'); if(oldFkl) oldFkl.remove();
  if(actions && !document.getElementById('pnw-preview-print')){
    const btn=document.createElement('button');
    btn.id='pnw-preview-print'; btn.className='btn btn-teal';
    btn.style.padding='8px 14px'; btn.style.fontSize='11px';
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>Cetak / PDF';
    btn.onclick=pnwPrint;
    actions.insertBefore(btn, actions.firstChild);
  }
  ov.classList.add('show');
}
function pnwPrint(){
  const old=document.getElementById('pnw-print-frame'); if(old) old.remove();
  const ifr=document.createElement('iframe');
  ifr.id='pnw-print-frame'; ifr.setAttribute('aria-hidden','true');
  ifr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(ifr);
  const doc=ifr.contentWindow.document; doc.open(); doc.write(pnwStandaloneDocHtml()); doc.close();
  const go=()=>fklWaitPaged(ifr, _go);
  const _go=()=>{ withHiddenPageTitle(()=>{ try{ ifr.contentWindow.focus(); ifr.contentWindow.print(); }catch(e){ try{ window.print(); }catch(_){} } }); setTimeout(()=>{ const f=document.getElementById('pnw-print-frame'); if(f) f.remove(); },1500); };
  const imgs=doc.images?Array.from(doc.images):[];
  if(imgs.length){ let n=imgs.length; const dec=()=>{ if(--n<=0) setTimeout(go,60); }; imgs.forEach(im=>{ if(im.complete) dec(); else { im.onload=dec; im.onerror=dec; } }); setTimeout(go,1200); }
  else setTimeout(go,120);
}
/* helper: escape utk string dalam atribut onclick JS */
function fkEscJs(s){ return String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/\n/g,' '); }

/* ##################### AKHIR MODUL PEMBUKAAN PENAWARAN #################### */

/* ####################################################################### */
/* ################## MODUL REFERENSI HARGA ONLINE (RHO) ################## */
/* ####################################################################### */

/* Field data pekerjaan (langkah 1). Sama seperti Pembukaan Penawaran namun
   tanpa Metode Penyampaian Dokumen & tanpa Nama Pejabat Pelaksana. */
const RHO_INFO_FIELDS = [
  {key:'nama',          label:'Nama Pekerjaan',            type:'text', span:2},
  {key:'lokasi',        label:'Lokasi Pekerjaan',          type:'text', span:2},
  {key:'nilai',         label:'Rencana Anggaran Biaya', type:'num'},
  {key:'no_anggaran',   label:'No. Anggaran',              type:'text'},
  {key:'tgl_anggaran',  label:'Tgl. Anggaran',             type:'date'},
  {key:'jenis_anggaran',label:'Jenis Anggaran',            type:'select', options:PNW_JENIS_ANGGARAN},
  {key:'metode',        label:'Metode Pengadaan',          type:'select', options:PNW_METODE}
];

/* ---------- State ----------
   info      : { key:value } data pekerjaan
   jumlahRef : jumlah kolom referensi (1..10)
   items     : ['Nama barang', ...] sepanjang Jumlah Barang/Jasa (1..150)
   refs      : { itemIdx:[ {foto,link,harga,berat,ongkir}, ... ] }  panjang = jumlahRef
*/
function rhoBlankState(){ return { info:{}, jumlahRef:1, items:[''], sumber:[''], refs:{}, ongkirMode:'beda', ongkirSama:'' }; }
let rhoState = rhoBlankState();
let rhoStep = 1;              // 1..2
let rhoEditId = null;
let rhoRevealPick = false;    // true sekali setelah "Pilih Data Pekerjaan" → animasi reveal
let rhoPreviewState = null;   // utk pratinjau record tersimpan

const RHO_STATE_KEY = 'rho_state_v1';
function rhoLoadState(){ try{ const raw=ssGet(RHO_STATE_KEY); if(raw){ const o=JSON.parse(raw); if(o&&o.info) rhoState=o; } }catch(e){} }
function rhoSaveState(){ try{ ssSet(RHO_STATE_KEY, JSON.stringify(rhoState)); }catch(e){} }
rhoLoadState();
function rhoActiveState(){ return rhoPreviewState || rhoState; }
function rhoMarkActive(){ document.querySelectorAll('.topnav-item[data-view="form-rho"]').forEach(b=>b.classList.add('active')); }

/* Pastikan struktur refs sesuai jumlah item & jumlah referensi */
function rhoEnsureRefs(){
  const st=rhoState;
  if(!st.refs || typeof st.refs!=='object' || Array.isArray(st.refs)) st.refs={};
  const K=Math.max(1,Math.min(10, parseInt(st.jumlahRef,10)||1)); st.jumlahRef=K;
  if(!Array.isArray(st.items) || !st.items.length) st.items=[''];
  if(!Array.isArray(st.sumber)) st.sumber=[];
  { const curS=st.sumber.slice(); st.sumber=[]; for(let r=0;r<K;r++) st.sumber.push(curS[r]!=null?curS[r]:''); }
  if(st.ongkirMode!=='sama') st.ongkirMode='beda';
  if(st.ongkirSama==null) st.ongkirSama='';
  st.items.forEach((_,i)=>{
    const arr=Array.isArray(st.refs[i])?st.refs[i]:[];
    const next=[];
    for(let r=0;r<K;r++){ const c=arr[r]||{}; next.push({foto:c.foto||'', fotoPath:c.fotoPath||'', link:c.link||'', harga:(c.harga!=null?c.harga:''), berat:(c.berat!=null?c.berat:''), ongkir:(c.ongkir!=null?c.ongkir:'')}); }
    st.refs[i]=next;
  });
  Object.keys(st.refs).forEach(k=>{ if(parseInt(k,10)>=st.items.length) delete st.refs[k]; });
  if(st.ongkirMode==='sama') rhoSyncOngkirSama();   // pastikan sel baru ikut terisi nilai ongkir seragam
}
/* Terapkan nilai Harga Ongkir (1 Kg) ke SEMUA sel Ongkos Kirim (dipakai saat Penetapan Ongkir = Sama) */
function rhoSyncOngkirSama(){
  const st=rhoState; const v=st.ongkirSama;
  Object.keys(st.refs).forEach(i=>{ (st.refs[i]||[]).forEach(c=>{ c.ongkir=v; }); });
}

/* ---------- Penyimpanan (Supabase + fallback lokal) ---------- */
const RHO_TABLE = 'referensi_harga_online';
const RHO_LS_KEY = 'rho_records_v1';
let records_rho = [];
let rhoUseLocal = false;   // menjadi true bila Supabase tak tersedia / tabel belum dibuat
function rhoSupaReady(){ return !!(USE_SUPABASE && db); }
function rhoLocalLoad(){ try{ const r=localStorage.getItem(RHO_LS_KEY); records_rho = r?JSON.parse(r):[]; }catch(e){ records_rho=[]; } }
function rhoLocalSave(){ /* dinonaktifkan: data hanya di Supabase */ }
function rhoIsLocalId(id){ return String(id).indexOf('loc_')===0; }
const StoreRho = {
  async list(){
    if(!rhoSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(RHO_TABLE).select('*').order('created_at',{ascending:false});
    if(error) throw error; return data||[];
  },
  async create(rec){
    if(!rhoSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(RHO_TABLE).insert(rec).select();
    if(error) throw error; return data&&data[0];
  },
  async update(rid, rec){
    if(!rhoSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(RHO_TABLE).update(rec).eq('id',rid);
    if(error) throw error;
  },
  async remove(rid){
    if(!rhoSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(RHO_TABLE).delete().eq('id',rid);
    if(error) throw error;
  }
};
async function refreshDataRho(){
  try{ records_rho = await StoreRho.list(); }
  catch(err){ console.error(err); records_rho = records_rho||[]; }
}

/* ---- Foto produk di Supabase Storage (bukan base64 di kolom state) ----
   Solusi permanen agar baris DB ringan: foto diunggah ke bucket publik lalu
   yang disimpan di state hanya URL-nya. Aman mundur: bila bucket belum dibuat
   / upload gagal, pemanggil mempertahankan base64 sebagai cadangan. */
const RHO_BUCKET = 'rho-foto';   // WAJIB dibuat sebagai bucket PUBLIC di Supabase Storage
function rhoUid(){ try{ if(window.crypto&&crypto.randomUUID) return 'rho_'+crypto.randomUUID(); }catch(e){} return 'rho_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10); }
function rhoIsDataUrl(s){ return typeof s==='string' && s.indexOf('data:image')===0; }
function rhoIsHttpUrl(s){ return typeof s==='string' && /^https?:\/\//i.test(s); }
function rhoDataUrlToBlob(dataUrl){
  const s=String(dataUrl||''); const i=s.indexOf(',');
  const meta=(i>=0?s.slice(0,i):''); const b64=(i>=0?s.slice(i+1):s);
  const mime=(meta.match(/data:([^;]+)/)||[])[1]||'image/jpeg';
  return fkB64ToBlob(b64, mime);
}
const StoreRhoFoto = {
  async uploadDataUrl(dataUrl, path){
    if(!rhoSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const blob=rhoDataUrlToBlob(dataUrl);
    const up=await db.storage.from(RHO_BUCKET).upload(path, blob, {contentType:blob.type||'image/jpeg', upsert:true});
    if(up.error) throw up.error;
    const pub=db.storage.from(RHO_BUCKET).getPublicUrl(path);
    const url=pub&&pub.data&&pub.data.publicUrl;
    if(!url) throw new Error('URL publik tidak tersedia');
    return {url, path};
  },
  async removeFolder(key){
    if(!rhoSupaReady()||!key) return;
    try{
      const ls=await db.storage.from(RHO_BUCKET).list(key,{limit:1000});
      if(ls&&!ls.error&&Array.isArray(ls.data)&&ls.data.length){
        await db.storage.from(RHO_BUCKET).remove(ls.data.map(o=>key+'/'+o.name));
      }
    }catch(e){ console.error('Bersihkan folder foto gagal',e); }
  }
};

/* ---------- Buka form / lihat data ---------- */
function openRhoInput(editId){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  rhoPreviewState=null;
  if(editId){
    const rec=(records_rho||[]).find(r=>String(r.id)===String(editId));
    rhoEditId = rec ? rec.id : null;
    rhoState = rec ? rhoRecordToState(rec) : rhoBlankState();
  }else{
    rhoEditId=null; rhoState=rhoBlankState();
    resetInputBaru('rho');
  }
  rhoStep=1; rhoEnsureRefs(); rhoSaveState(); showView('form-rho');
}
function openRhoView(){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  refreshDataRho().then(()=>showView('rho-view'));
}
function rhoRecordToState(rec){
  const base=rhoBlankState();
  const s=(rec&&rec.state&&typeof rec.state==='object')?rec.state:{};
  const st={
    info: Object.assign({}, base.info, s.info||{}),
    jumlahRef: Math.max(1,Math.min(10, parseInt(s.jumlahRef,10)||1)),
    items: (Array.isArray(s.items)&&s.items.length)?s.items.slice():[''],
    sumber: Array.isArray(s.sumber)?s.sumber.slice():[''],
    refs: {},
    ongkirMode: s.ongkirMode==='sama' ? 'sama' : 'beda',
    ongkirSama: s.ongkirSama!=null ? s.ongkirSama : ''
  };
  if(s.refs && typeof s.refs==='object'){
    Object.keys(s.refs).forEach(k=>{
      if(Array.isArray(s.refs[k])) st.refs[k]=s.refs[k].map(c=>({foto:c.foto||'', fotoPath:c.fotoPath||'', link:c.link||'', harga:(c.harga!=null?c.harga:''), berat:(c.berat!=null?c.berat:''), ongkir:(c.ongkir!=null?c.ongkir:'')}));
    });
  }
  return st;
}

/* ---------- Stepper ---------- */
function rhoStepperHtml(){
  const steps=[['1','Data Pekerjaan'],['2','Pengisian Referensi']];
  return '<div class="fkl-stepper">'+steps.map((s,i)=>{
    const n=i+1;
    const cls = n<rhoStep ? 'done' : (n===rhoStep ? 'active' : '');
    const mark = n<rhoStep ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>' : s[0];
    const line = i<steps.length-1 ? '<div class="fkl-step-line '+(n<rhoStep?'done':'')+'"></div>' : '';
    return '<div class="fkl-step '+cls+'"><div class="fkl-step-dot">'+mark+'</div><div class="fkl-step-name">'+s[1]+'</div></div>'+line;
  }).join('')+'</div>';
}

/* ================= LANGKAH 1: DATA PEKERJAAN ================= */
/* Field bersama (sumber dari Data Pekerjaan) yang dikunci saat sebuah Data
   Pekerjaan dipilih — sama seperti Perhitungan HPS & Analisa Harga Satuan.
   DP_SHARED_KEYS dirujuk saat pemanggilan (bukan saat definisi) karena modul
   Data Pekerjaan berada setelah blok ini. */
function rhoIsLocked(key){ return !!(rhoState.info && rhoState.info.dpId) && DP_SHARED_KEYS.indexOf(key)>=0; }
function rhoInfoInputHtml(f){
  const id='rho-'+f.key;
  const locked=rhoIsLocked(f.key);
  const span=f.span?(' style="grid-column:span '+f.span+'"'):'';
  const dis = locked ? ' disabled' : '';
  let ctl;
  if(f.type==='select'){
    ctl='<select id="'+id+'"'+dis+' onchange="rhoOnInfoChange()"><option value="">— Pilih —</option>'+(f.options||[]).map(o=>'<option>'+fkEsc(o)+'</option>').join('')+'</select>';
  }
  else if(f.type==='num') ctl='<input id="'+id+'" type="text" inputmode="numeric" placeholder="Rp"'+dis+' oninput="onRupiahInput(this)" onchange="rhoOnInfoChange()">';
  else if(f.type==='date') ctl='<input id="'+id+'" type="date"'+dis+' onchange="rhoOnInfoChange()">';
  else ctl='<input id="'+id+'" type="text"'+dis+' oninput="rhoOnInfoChange()">';
  return '<div class="field'+(locked?' is-locked':'')+'"'+span+'><label>'+fkEsc(f.label)+'</label>'+ctl+(locked?DP_LOCK_BADGE:'')+'</div>';
}
function rhoCountFieldsHtml(){
  const st=rhoState;
  let refOpts=''; for(let i=1;i<=10;i++)  refOpts+='<option value="'+i+'"'+(i===st.jumlahRef?' selected':'')+'>'+i+' Referensi</option>';
  let itmOpts=''; for(let i=1;i<=150;i++) itmOpts+='<option value="'+i+'"'+(i===st.items.length?' selected':'')+'>'+i+' Item</option>';
  return '<div class="field"><label>Jumlah Referensi</label><select id="rho-jumlahref" onchange="rhoOnJumlahRefChange(this)">'+refOpts+'</select></div>'+
         '<div class="field"><label>Jumlah Barang/Material</label><select id="rho-jumlahitem" onchange="rhoOnJumlahItemChange(this)">'+itmOpts+'</select></div>';
}
function rhoItemListHtml(){
  const st=rhoState;
  const many=st.items.length>1;
  const rows=st.items.map((nm,i)=>'<div class="rho-item-row"><span class="rho-item-no">'+(i+1)+'</span>'+
    '<input type="text" data-i="'+i+'" placeholder="Nama barang/material ke-'+(i+1)+'" value="'+fkEsc(nm||'')+'" oninput="rhoOnItemNama(this)">'+
    '<button type="button" class="rho-item-del" title="Hapus barang/material ini"'+(many?'':' disabled')+' onclick="rhoDeleteItem('+i+')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg></button></div>').join('');
  return '<div class="rho-item-list">'+rows+'</div>';
}
/* Label kolom referensi: nama sumber yg diinput (fallback "Referensi N") */
function rhoRefLabel(r){ const st=rhoActiveState(); const v=(st.sumber&&st.sumber[r]!=null)?String(st.sumber[r]).trim():''; return v?v:('Referensi '+(r+1)); }
/* Daftar input Nama Referensi (jumlah mengikuti Jumlah Referensi) */
function rhoSumberListHtml(){
  const st=rhoState; const K=st.jumlahRef; if(!Array.isArray(st.sumber)) st.sumber=[];
  let rows='';
  for(let r=0;r<K;r++){ rows+='<div class="rho-item-row"><span class="rho-item-no">'+(r+1)+'</span>'+
    '<input type="text" data-r="'+r+'" placeholder="Nama referensi ke-'+(r+1)+' (mis. Shopee, e-Katalog)" value="'+fkEsc(st.sumber[r]||'')+'" oninput="rhoOnSumber(this)"></div>'; }
  return '<div class="rho-item-list">'+rows+'</div>';
}
function rhoOnSumber(el){ const r=+el.dataset.r; const st=rhoState; if(!Array.isArray(st.sumber)) st.sumber=[]; st.sumber[r]=el.value; rhoSaveState(); }
function rhoOnInfoChange(){
  const st=rhoState;
  RHO_INFO_FIELDS.forEach(f=>{ if(rhoIsLocked(f.key)) return; const el=document.getElementById('rho-'+f.key); if(!el) return; st.info[f.key]=(f.type==='num')?parseRupiah(el.value):el.value.trim(); });
  rhoSaveState();
}
/* Bar wajib "Pilih Data Pekerjaan" — sumber nama/lokasi/nilai/no.anggaran/tgl.anggaran/metode. */
function rhoDpBarHtml(){
  const info=rhoState.info||{};
  const dipilih = info.dpId ? String(info.dpNama||info.nama||'').trim() : '';
  const sub = dipilih
    ? ('Data pekerjaan terisi otomatis & terkunci dari: <b style="color:var(--teal-dark)">'+fkEsc(dipilih)+'</b>')
    : 'Opsional — pilih Data Pekerjaan agar kolom Nama/Lokasi/Nilai/No. Anggaran/Tgl. Anggaran/Metode terisi otomatis, atau isi manual pada kolom di bawah.';
  let btns='<button type="button" class="btn btn-teal" style="padding:8px 14px;font-size:11.5px" onclick="rhoPilihDp()">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M4 4h5l2 3h9a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>'+(dipilih?'Ganti Data Pekerjaan':'Pilih Data Pekerjaan')+'</button>';
  if(dipilih) btns+='<button type="button" class="btn btn-unpick" style="padding:8px 14px;font-size:11.5px" onclick="rhoLepasDp()">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M18 6 6 18M6 6l12 12"/></svg>Lepas Pilihan</button>';
  return '<div class="hps-analisa-bar">'+
    '<div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h5l2 3h9a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg></div>'+
    '<div class="tx"><b>Pilih Data Pekerjaan</b><span>'+sub+'</span></div>'+btns+
  '</div>';
}
function rhoPilihDp(){ openDpPicker('rho'); }
/* Dipanggil oleh dpPickerSelect() saat sebuah Data Pekerjaan dipilih untuk RHO */
function rhoApplyDp(rec){
  const st=rhoState; st.info=st.info||{};
  const info=(rec.state&&rec.state.info)||{};
  DP_SHARED_KEYS.forEach(k=>{ st.info[k]=(info[k]!=null?info[k]:''); });
  st.info.dpId=String(rec.id);
  st.info.dpNama=rec.nama_pekerjaan||info.nama||'';
  rhoSaveState();
  rhoRevealPick=true;   // pemicu animasi reveal konten di bawah tombol
  renderRhoForm();
  toast('Data pekerjaan berhasil diterapkan','ok');
}
/* Lepas pilihan Data Pekerjaan → kembali ke kondisi belum dipilih (wajib pilih ulang) */
function rhoLepasDp(){
  const st=rhoState; if(!st.info) return;
  delete st.info.dpId; delete st.info.dpNama;
  DP_SHARED_KEYS.forEach(k=>{ st.info[k]=''; });
  rhoSaveState(); renderRhoForm();
  toast('Pilihan Data Pekerjaan dilepas','ok');
}
function rhoOnJumlahRefChange(el){
  const n=Math.max(1,Math.min(10,parseInt(el.value,10)||1));
  rhoState.jumlahRef=n; rhoEnsureRefs(); rhoSaveState(); renderRhoForm();
}
function rhoOnJumlahItemChange(el){
  const n=Math.max(1,Math.min(150,parseInt(el.value,10)||1));
  const st=rhoState; const cur=st.items.slice(); const next=[]; for(let i=0;i<n;i++) next.push(cur[i]||'');
  st.items=next; rhoEnsureRefs(); rhoSaveState(); renderRhoForm();
}
function rhoOnItemNama(el){ const i=+el.dataset.i; rhoState.items[i]=el.value; rhoSaveState(); }
/* Hapus satu barang/material. Setelah dihapus, Jumlah Barang/Material otomatis
   berkurang (mengikuti panjang daftar terbaru) dan struktur referensi ikut digeser. */
function rhoDeleteItem(i){
  const st=rhoState;
  if(!Array.isArray(st.items)) return;
  i=parseInt(i,10); if(isNaN(i)||i<0||i>=st.items.length) return;
  if(st.items.length<=1){ toast('Minimal harus ada 1 barang/material','warn'); return; }
  const nama=String(st.items[i]||'').trim();
  const doDel=()=>{
    // Geser referensi: buang key i, key > i turun satu tingkat.
    const oldRefs=(st.refs&&typeof st.refs==='object')?st.refs:{};
    const newRefs={};
    st.items.forEach((_,idx)=>{
      if(idx<i) newRefs[idx]=oldRefs[idx];
      else if(idx>i) newRefs[idx-1]=oldRefs[idx];
    });
    st.items.splice(i,1);
    st.refs=newRefs;
    rhoEnsureRefs(); rhoSaveState(); renderRhoForm();
    toast('Barang/material dihapus','ok');
  };
  if(nama){
    openConfirm({icon:'del',title:'Hapus Barang/Material',text:'Hapus "'+nama+'" dari daftar? Jumlah Barang/Material akan menyesuaikan.',onYes:doDel});
  }else{
    doDel();
  }
}

/* ================= LANGKAH 2: PENGISIAN REFERENSI ================= */
function rhoNum(v){ if(v===''||v==null) return 0; if(typeof v==='number') return v; const n=parseFloat(String(v).replace(/,/g,'.')); return isNaN(n)?0:n; }
function rhoRp(n){ n=Math.round(rhoNum(n)); return n>0 ? ('Rp '+n.toLocaleString('id-ID')) : '–'; }
function rhoBeratText(v){ return (v==null||v==='') ? '' : String(v); }
function rhoCalcEst(i,r){ const st=rhoActiveState(); const c=(st.refs&&st.refs[i]&&st.refs[i][r])?st.refs[i][r]:{}; return Math.round(rhoNum(c.berat)*rhoNum(c.ongkir)); }
function rhoCalcTot(i,r){ const st=rhoActiveState(); const c=(st.refs&&st.refs[i]&&st.refs[i][r])?st.refs[i][r]:{}; return Math.round(rhoNum(c.harga)+rhoCalcEst(i,r)); }
function rhoRecalcCell(i,r){ const e=document.getElementById('rho-est-'+i+'-'+r); if(e) e.textContent=rhoRp(rhoCalcEst(i,r)); const t=document.getElementById('rho-tot-'+i+'-'+r); if(t) t.textContent=rhoRp(rhoCalcTot(i,r)); }

function rhoFotoInnerEmpty(){
  return '<div class="rho-foto-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span>Klik lalu tempel<br>(Ctrl + V)</span></div>';
}
function rhoFotoInnerImg(url,i,r){
  return '<img src="'+url+'" alt="Foto produk"><div class="rho-foto-actions"><button type="button" title="Hapus foto" onclick="rhoClearFoto(event,'+i+','+r+')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button></div>';
}
function rhoFotoCellHtml(i,r){
  const st=rhoState; const cell=(st.refs[i]&&st.refs[i][r])?st.refs[i][r]:{}; const foto=cell.foto||'';
  const inner = foto ? rhoFotoInnerImg(foto,i,r) : rhoFotoInnerEmpty();
  return '<div class="rho-foto-cell'+(foto?' has-img':'')+'" id="rho-foto-'+i+'-'+r+'" data-i="'+i+'" data-r="'+r+'" tabindex="0" onclick="rhoFotoClick(this)">'+inner+'</div>';
}
function rhoItemMatrixHtml(i){
  const st=rhoState; const K=st.jumlahRef; const name=(st.items[i]&&st.items[i].trim())?st.items[i]:('Barang/Material '+(i+1));
  const cells=st.refs[i]||[];
  // Berat barang seragam: samakan seluruh referensi dengan Referensi 1 (hanya Ref 1 yang bisa diedit).
  if(cells.length){ const b0=(cells[0]&&cells[0].berat!=null)?cells[0].berat:''; for(let r=1;r<K;r++){ if(cells[r]) cells[r].berat=b0; } }
  let head='<thead><tr><th class="rho-c-lbl">Uraian</th>';
  for(let r=0;r<K;r++) head+='<th>'+fkEsc(rhoRefLabel(r))+'</th>';
  head+='</tr></thead>';
  let body='<tbody>';
  // baris 1: Nama Barang/Material (otomatis dari langkah 1)
  body+='<tr class="rho-namarow"><td class="rho-c-lbl">Nama Barang/Material</td><td colspan="'+K+'">'+fkEsc(name)+'</td></tr>';
  // Foto Produk
  body+='<tr><td class="rho-c-lbl">Foto Produk<span class="rho-c-sub">Salin gambar/printscreen lalu tempel</span></td>';
  for(let r=0;r<K;r++) body+='<td>'+rhoFotoCellHtml(i,r)+'</td>';
  body+='</tr>';
  // Link Produk
  body+='<tr><td class="rho-c-lbl">Link Produk</td>';
  for(let r=0;r<K;r++){ const v=cells[r]?(cells[r].link||''):''; body+='<td><input type="text" id="rho-link-'+i+'-'+r+'" data-i="'+i+'" data-r="'+r+'" placeholder="https://..." value="'+fkEsc(v)+'" oninput="rhoOnLink(this)"></td>'; }
  body+='</tr>';
  // Harga Satuan
  body+='<tr><td class="rho-c-lbl">Harga Satuan</td>';
  for(let r=0;r<K;r++){ const v=cells[r]?cells[r].harga:''; body+='<td><input type="text" inputmode="numeric" id="rho-harga-'+i+'-'+r+'" data-i="'+i+'" data-r="'+r+'" placeholder="Rp" value="'+rupiahInputText(v)+'" oninput="rhoOnMoney(this,\'harga\')"></td>'; }
  body+='</tr>';
  // Berat Barang (kg) — hanya Referensi 1 dapat diisi; referensi lain terkunci & mengikuti Referensi 1
  body+='<tr><td class="rho-c-lbl">Berat Barang<span class="rho-c-sub">dalam kilogram (kg)</span></td>';
  for(let r=0;r<K;r++){ const v=cells[r]?cells[r].berat:''; const lk=r>0; body+='<td><input type="text" inputmode="decimal" id="rho-berat-'+i+'-'+r+'" data-i="'+i+'" data-r="'+r+'" placeholder="kg" value="'+fkEsc(rhoBeratText(v))+'"'+(lk?' disabled class="rho-input-locked"':'')+' oninput="rhoOnBerat(this)"></td>'; }
  body+='</tr>';
  // Ongkos Kirim (1 kg)
  body+='<tr><td class="rho-c-lbl">Ongkos Kirim<span class="rho-c-sub">per 1 kg</span></td>';
  { const locked=st.ongkirMode==='sama';
    for(let r=0;r<K;r++){ const v=cells[r]?cells[r].ongkir:''; body+='<td><input type="text" inputmode="numeric" id="rho-ongkir-'+i+'-'+r+'" data-i="'+i+'" data-r="'+r+'" placeholder="Rp" value="'+rupiahInputText(v)+'"'+(locked?' disabled class="rho-input-locked"':'')+' oninput="rhoOnMoney(this,\'ongkir\')"></td>'; }
  }
  body+='</tr>';
  // Estimasi Ongkos Kirim (otomatis)
  body+='<tr class="rho-autorow"><td class="rho-c-lbl">Estimasi Ongkir<span class="rho-c-sub">Berat × Ongkir</span></td>';
  for(let r=0;r<K;r++) body+='<td><span class="rho-auto-val" id="rho-est-'+i+'-'+r+'">'+rhoRp(rhoCalcEst(i,r))+'</span></td>';
  body+='</tr>';
  // Harga Total (otomatis)
  body+='<tr class="rho-autorow rho-totrow"><td class="rho-c-lbl">Harga Total<span class="rho-c-sub">Harga Satuan + Estimasi Ongkir</span></td>';
  for(let r=0;r<K;r++) body+='<td><span class="rho-auto-val rho-total-val" id="rho-tot-'+i+'-'+r+'">'+rhoRp(rhoCalcTot(i,r))+'</span></td>';
  body+='</tr>';
  body+='</tbody>';
  return '<div class="rho-item-card"><div class="rho-item-head"><span class="rho-h-no">'+(i+1)+'</span><span class="rho-h-name">'+fkEsc(name)+'</span><span class="rho-h-tag">'+K+' Referensi</span></div>'+
    '<div class="rho-matrix-wrap"><table class="rho-matrix">'+head+body+'</table></div></div>';
}
function rhoOngkirBarHtml(){
  const st=rhoState; const isSama=st.ongkirMode==='sama';
  return '<div class="rho-ongkir-bar">'+
    '<div class="field"><label>Penetapan Ongkir</label>'+
      '<select id="rho-ongkirmode" onchange="rhoOnOngkirModeChange(this)">'+
        '<option value="beda"'+(isSama?'':' selected')+'>Berbeda</option>'+
        '<option value="sama"'+(isSama?' selected':'')+'>Sama</option>'+
      '</select>'+
    '</div>'+
    '<div class="field'+(isSama?'':' locked')+'"><label>Harga Ongkir (1 Kg)</label>'+
      '<input type="text" inputmode="numeric" id="rho-ongkirsama" placeholder="Rp" value="'+rupiahInputText(st.ongkirSama)+'"'+(isSama?'':' disabled')+' oninput="rhoOnOngkirSamaChange(this)"></div>'+
  '</div>';
}
function rhoOnOngkirModeChange(el){
  const st=rhoState;
  st.ongkirMode = el.value==='sama' ? 'sama' : 'beda';
  if(st.ongkirMode==='sama') rhoSyncOngkirSama();
  else st.ongkirSama='';   // Berbeda → Harga Ongkir (1 Kg) terkunci tanpa isian
  rhoSaveState();
  renderRhoForm();
}
function rhoOnOngkirSamaChange(el){
  onRupiahInput(el);
  const st=rhoState;
  st.ongkirSama=parseRupiah(el.value);
  if(st.ongkirMode==='sama'){
    rhoSyncOngkirSama();
    Object.keys(st.refs).forEach(k=>{ const i=+k; (st.refs[i]||[]).forEach((c,r)=>{
      const inp=document.getElementById('rho-ongkir-'+i+'-'+r); if(inp) inp.value=rupiahInputText(c.ongkir);
      rhoRecalcCell(i,r);
    }); });
  }
  rhoSaveState();
}
function rhoPanelHtml(){
  const st=rhoState;
  let html=rhoOngkirBarHtml();
  html+='<div class="rho-hint">Tempel foto produk dengan cara: klik kotak foto lalu tekan <b>Ctrl + V</b> (bisa hasil <i>print screen</i> atau salinan gambar dari halaman produk). Foto akan otomatis diseragamkan ukurannya. Kolom <b>Estimasi Ongkir</b> dan <b>Harga Total</b> terisi otomatis.</div>';
  html+='<div class="rho-panel">';
  st.items.forEach((nm,i)=>{ html+=rhoItemMatrixHtml(i); });
  html+='</div>';
  return html;
}

/* Interaksi langkah 2 (tanpa render ulang penuh agar fokus & scroll terjaga) */
function rhoOnLink(el){ const i=+el.dataset.i,r=+el.dataset.r; if(rhoState.refs[i]&&rhoState.refs[i][r]){ rhoState.refs[i][r].link=el.value; rhoSaveState(); } }
function rhoOnMoney(el,key){ onRupiahInput(el); const i=+el.dataset.i,r=+el.dataset.r; if(rhoState.refs[i]&&rhoState.refs[i][r]){ rhoState.refs[i][r][key]=parseRupiah(el.value); rhoSaveState(); rhoRecalcCell(i,r); } }
function rhoOnBerat(el){
  let v=el.value.replace(/[^0-9.,]/g,'').replace(/,/g,'.');
  const parts=v.split('.'); if(parts.length>2) v=parts[0]+'.'+parts.slice(1).join('');
  el.value=v;
  const i=+el.dataset.i; const st=rhoState; if(!st.refs[i]) return;
  // Berat sama untuk semua referensi: terapkan nilai ke seluruh referensi item ini,
  // perbarui input yang terkunci, lalu hitung ulang estimasi & total tiap referensi.
  const K=st.jumlahRef;
  for(let rr=0;rr<K;rr++){
    if(!st.refs[i][rr]) continue;
    st.refs[i][rr].berat=v;
    if(rr!==+el.dataset.r){ const inp=document.getElementById('rho-berat-'+i+'-'+rr); if(inp) inp.value=v; }
    rhoRecalcCell(i,rr);
  }
  rhoSaveState();
}

/* ---- Foto: fokus, tempel (paste), normalisasi ukuran, hapus ----
   Gambar disimpan UTUH (100% dari clipboard) tanpa dipotong (crop) dan tanpa
   diperbesar. Rasio asli dipertahankan; hanya diperkecil bila melebihi batas
   sisi terpanjang agar ukuran data tetap wajar. Saat ditampilkan/dicetak kotak
   memakai object-fit:contain sehingga seluruh gambar terlihat. */
function rhoFotoClick(el){ try{ el.focus(); }catch(e){} }
/* ---------- Kompresi foto ----------
   Foto produk hanya ditampilkan pada sel ~150px dan di PDF ~150px, jadi tidak perlu
   resolusi besar. Kita perkecil sisi terpanjang & pakai kualitas JPEG adaptif:
   mulai dari kualitas tinggi lalu turunkan bertahap sampai di bawah target ukuran. */
const RHO_IMG_MAX=1000;                 // batas sisi terpanjang (px) — hanya memperkecil, tak pernah memperbesar
const RHO_IMG_TARGET_BYTES=130*1024;    // target lunak ukuran per foto (~130 KB)
const RHO_IMG_Q_START=0.82;             // kualitas awal
const RHO_IMG_Q_MIN=0.55;               // kualitas minimum

/* Perkiraan ukuran byte dari sebuah data URL (base64). */
function rhoDataUrlBytes(u){
  if(!u || typeof u!=='string') return 0;
  const i=u.indexOf(','); const b=i>=0?u.slice(i+1):u;
  return Math.floor(b.length*0.75);
}
/* Encode canvas ke JPEG dengan kualitas adaptif agar di bawah target ukuran. */
function rhoEncodeCanvas(cv){
  let q=RHO_IMG_Q_START;
  let out=cv.toDataURL('image/jpeg',q);
  while(rhoDataUrlBytes(out)>RHO_IMG_TARGET_BYTES && q>RHO_IMG_Q_MIN){
    q=Math.max(RHO_IMG_Q_MIN, Math.round((q-0.1)*100)/100);
    out=cv.toDataURL('image/jpeg',q);
  }
  return out;
}
/* Perkecil + kompres sebuah sumber gambar (data URL / blob URL) menjadi JPEG ringan. */
function rhoNormalizeImage(src, cb){
  const img=new Image();
  img.onload=function(){
    try{
      let w=img.width||1, h=img.height||1;
      // Jangan pernah memperbesar: skala <= 1. Perkecil hanya bila melebihi batas.
      const s=Math.min(1, RHO_IMG_MAX/Math.max(w,h));
      w=Math.max(1,Math.round(w*s)); h=Math.max(1,Math.round(h*s));
      const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
      const ctx=cv.getContext('2d');
      try{ ctx.imageSmoothingQuality='high'; }catch(e){}
      ctx.drawImage(img,0,0,w,h);   // seluruh gambar, tanpa dipotong
      cb(rhoEncodeCanvas(cv));
    }catch(err){ cb(src); }
  };
  img.onerror=function(){ cb(src); };
  img.src=src;
}
/* Kompres ulang sebuah data URL foto yang SUDAH tersimpan.
   Kembalikan hasil hanya bila benar-benar lebih kecil, agar foto yang sudah ringan
   tidak diproses ulang (menghindari penurunan kualitas & penulisan sia-sia). */
function rhoRecompressStored(dataUrl){
  return new Promise(resolve=>{
    if(!dataUrl || typeof dataUrl!=='string' || dataUrl.indexOf('data:image')!==0){ resolve(dataUrl); return; }
    const before=rhoDataUrlBytes(dataUrl);
    rhoNormalizeImage(dataUrl, function(out){
      const after=rhoDataUrlBytes(out);
      // Terima hasil hanya bila menyusut minimal 5%.
      if(out && out.indexOf('data:image')===0 && after>0 && after < before*0.95){ resolve(out); }
      else resolve(dataUrl);
    });
  });
}
function rhoSetFoto(i,r,url){
  const st=rhoState; if(!st.refs[i]||!st.refs[i][r]) return;
  st.refs[i][r].foto=url; rhoSaveState();
  const cell=document.getElementById('rho-foto-'+i+'-'+r);
  if(cell){ cell.classList.add('has-img'); cell.innerHTML=rhoFotoInnerImg(url,i,r); }
  toast('Foto produk ditempel','ok');
}
function rhoClearFoto(e,i,r){
  if(e){ e.stopPropagation(); e.preventDefault(); }
  const st=rhoState; if(st.refs[i]&&st.refs[i][r]){ st.refs[i][r].foto=''; st.refs[i][r].fotoPath=''; rhoSaveState(); }
  const cell=document.getElementById('rho-foto-'+i+'-'+r);
  if(cell){ cell.classList.remove('has-img'); cell.innerHTML=rhoFotoInnerEmpty(); }
}
/* Listener tempel global: hanya aktif saat form RHO langkah 2 & sebuah sel foto sedang fokus */
function rhoGlobalPaste(e){
  const view=document.getElementById('view-form-rho');
  if(!view || !view.classList.contains('active') || rhoStep!==2) return;
  const cell=(document.activeElement && document.activeElement.closest) ? document.activeElement.closest('.rho-foto-cell') : null;
  if(!cell) return;
  const dt=e.clipboardData || window.clipboardData; if(!dt) return;
  let file=null;
  if(dt.items){ for(let k=0;k<dt.items.length;k++){ const it=dt.items[k]; if(it.kind==='file' && it.type && it.type.indexOf('image')===0){ file=it.getAsFile(); break; } } }
  if(!file && dt.files && dt.files.length){ for(let k=0;k<dt.files.length;k++){ const f=dt.files[k]; if(f.type && f.type.indexOf('image')===0){ file=f; break; } } }
  if(!file){ toast('Clipboard tidak berisi gambar. Salin gambar / print screen, lalu tempel lagi.','warn'); return; }
  e.preventDefault();
  const i=+cell.dataset.i, r=+cell.dataset.r;
  const reader=new FileReader();
  reader.onload=function(){ rhoNormalizeImage(reader.result, function(url){ rhoSetFoto(i,r,url); }); };
  reader.readAsDataURL(file);
}
document.addEventListener('paste', rhoGlobalPaste);

/* ---------- Render form ---------- */
function renderRhoForm(){
  rhoMarkActive();
  rhoEnsureRefs();
  const tt=document.getElementById('rho-title'); if(tt) tt.textContent='Referensi Harga Online'+(rhoEditId?' — Ubah Data':' — Input Data');
  const sub=document.getElementById('rho-sub');
  const cont=document.getElementById('rho-content'); if(!cont) return;
  const st=rhoState;
  // Sama seperti HPS/Analisa: field Data Pekerjaan bersumber dari "Pilih Data
  // Pekerjaan". Saat Ubah Data (rhoEditId aktif) selalu ditampilkan penuh walau
  // record lama belum tertaut dpId. rev1/rev2 = animasi reveal sekali setelah pilih.
  const showBody = true;
  const rev1 = (rhoRevealPick && showBody) ? ' dp-reveal dp-reveal-d1' : '';
  const rev2 = (rhoRevealPick && showBody) ? ' dp-reveal dp-reveal-d2' : '';
  let html=rhoStepperHtml();
  if(rhoStep===1){
    if(sub) sub.textContent='Langkah 1 dari 2 — Lengkapi data pekerjaan & daftar barang/jasa';
    html+='<div class="form-card"><div class="form-section-title">'+KR_SECTION_ICON+'Data Pekerjaan'+dpPickBtnHtml('rho')+'</div>';
    if(showBody){
      html+='<div class="form-flow'+rev1+'" style="--cols:4">';
      html+=RHO_INFO_FIELDS.map(rhoInfoInputHtml).join('');
      html+=rhoCountFieldsHtml();
      html+='</div>';
    }
    html+='</div>';
    if(showBody){
      html+='<div class="form-card"><div class="form-section-title">'+FKL_SEC_ICON+'Nama Referensi <span class="fkl-count-chip">'+st.jumlahRef+' referensi</span></div>'+
        '<div class="rho-hint">Isi nama tiap sumber referensi (mis. Shopee, Tokopedia, e-Katalog). Nama ini menjadi judul kolom pada tabel Pengisian Referensi &amp; dokumen PDF. Jumlah kotak mengikuti <b>Jumlah Referensi</b>.</div>'+
        rhoSumberListHtml()+'</div>';
    }
    if(showBody){
      html+='<div class="form-card'+rev2+'"><div class="form-section-title">'+FKL_SEC_ICON+'Nama Barang/Material <span class="fkl-count-chip">'+st.items.length+' item</span></div>'+
        '<div class="rho-hint">Isi nama tiap barang/material. Jumlah baris mengikuti pilihan <b>Jumlah Barang/Material</b>. Klik ikon <b>hapus</b> di kanan baris untuk menghapus item — jumlah akan menyesuaikan otomatis.</div>'+
        rhoItemListHtml()+'</div>';
    }
    html+=rhoActionsHtml({back:false});
  } else {
    if(sub) sub.textContent='Langkah 2 dari 2 — Isi referensi harga tiap barang/jasa';
    html+=rhoPanelHtml();
    html+=rhoActionsHtml({back:true, save:true});
  }
  cont.innerHTML=html;
  rhoRevealPick=false;   // animasi reveal hanya dijalankan sekali
  if(rhoStep===1){
    RHO_INFO_FIELDS.forEach(f=>{ const el=document.getElementById('rho-'+f.key); if(!el) return; const v=st.info[f.key]; el.value=(f.type==='num')?rupiahInputText(v):(v!=null?v:''); });
  }
}
function rhoActionsHtml(o){
  o=o||{};
  // Batal (merah) berdampingan dengan tombol navigasi di pojok kanan
  let right='<button class="btn btn-red" onclick="rhoBatal()">'+FKL_IC_X+'Batal</button>';
  if(o.back) right+='<button class="btn btn-light" onclick="rhoBack()">'+FKL_IC_BACK+'Kembali</button>';
  if(o.save) right+='<button class="btn btn-green" onclick="rhoSimpan()">'+FKL_IC_SAVE+'Simpan &amp; Lihat PDF</button>';
  else right+='<button class="btn btn-teal" onclick="rhoNext()">Selanjutnya'+FKL_IC_NEXT+'</button>';
  return '<div class="fkl-actions"><div class="fkl-actions-right">'+right+'</div></div>';
}

/* ---------- Navigasi ---------- */
function rhoNext(){
  const st=rhoState;
  if(rhoStep===1){
    rhoOnInfoChange();
    if(!String(st.info.nama||'').trim()){ toast('Nama Pekerjaan wajib diisi','warn'); return; }
    rhoEnsureRefs(); rhoStep=2;
  }
  renderRhoForm(); rhoScrollTop();
}
function rhoBack(){ if(rhoStep>1){ rhoStep--; renderRhoForm(); rhoScrollTop(); } }
function rhoScrollTop(){ const v=document.getElementById('view-form-rho'); if(v) v.scrollIntoView({behavior:'smooth',block:'start'}); }
function rhoBatal(){
  openConfirm({ icon:'del', title:'Batalkan Proses',
    text:'Batalkan proses ini? Data yang belum disimpan akan hilang.',
    onYes:()=>{ rhoEditId=null; rhoState=rhoBlankState(); rhoSaveState(); rhoStep=1; openRhoView(); toast('Proses dibatalkan','ok'); }
  });
}

/* ---------- Simpan ---------- */
async function rhoSimpan(){
  if(!requireInput()) return;
  const st=rhoState; const info=st.info||{}; const nama=String(info.nama||'').trim();
  if(!nama){ toast('Nama Pekerjaan wajib diisi','warn'); rhoStep=1; renderRhoForm(); return; }
  rhoEnsureRefs();
  // ---- Unggah foto ke Storage: ganti data-URL (base64) menjadi URL ringan ----
  // Membuat baris DB kecil sehingga Simpan & Muat jauh lebih cepat. Bila Supabase
  // belum siap / bucket belum ada / upload gagal → base64 dipertahankan (cadangan).
  if(rhoSupaReady()){
    if(!st.info.fotoKey) st.info.fotoKey=rhoUid();
    const key=st.info.fotoKey;
    const jobs=[];
    Object.keys(st.refs).forEach(k=>{ (st.refs[k]||[]).forEach((c,r)=>{ if(c&&rhoIsDataUrl(c.foto)) jobs.push({i:+k, r:r, c:c}); }); });
    if(jobs.length){
      let done=0, failed=0;
      showLoader('Menyiapkan unggah foto…');
      for(const job of jobs){
        done++; showLoader('Mengunggah foto '+done+' / '+jobs.length+'…');
        const path=key+'/r'+job.r+'_i'+job.i+'.jpg';
        try{
          const res=await StoreRhoFoto.uploadDataUrl(job.c.foto, path);
          job.c.foto=res.url+'?v='+Date.now();   // cache-bust saat foto ditimpa
          job.c.fotoPath=path;
        }catch(err){ console.error('Upload foto gagal',path,err); failed++; /* biarkan base64 sebagai cadangan */ }
        await new Promise(r=>setTimeout(r,0));
      }
      hideLoader();
      if(failed>0) toast(failed+' foto gagal diunggah — disimpan sebagai gambar tertanam (cadangan). Pastikan bucket "'+RHO_BUCKET+'" ada & publik.','warn');
    }
  }
  const rec={
    nama_pekerjaan: nama,
    lokasi: info.lokasi||'',
    metode: info.metode||'',
    jumlah_item: st.items.length,
    jumlah_referensi: st.jumlahRef,
    tgl_input: (new Date()).toISOString().slice(0,10),
    state: JSON.parse(JSON.stringify(st))
  };
  let saved=null;
  try{
    await withActionLoader(rhoEditId?'Menyimpan perubahan':'Menyimpan', async()=>{
      if(rhoEditId){ await StoreRho.update(rhoEditId, rec); }
      else { saved=await StoreRho.create(rec); }
      await refreshDataRho();
    });
  }catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'err'); return; }
  toast(rhoEditId?'Data berhasil diperbarui':'Data berhasil disimpan','ok');
  const savedId = rhoEditId || (saved && saved.id);
  rhoEditId=null; rhoState=rhoBlankState(); rhoSaveState(); rhoStep=1;
  showView('rho-view');
  // Tampilkan pratinjau PDF dokumen yang baru disimpan
  setTimeout(()=>{ if(savedId!=null) rhoPreviewRecord(savedId); }, 420);
}

/* ---------- Kompres foto yang sudah tersimpan ----------
   Menjelajah semua record RHO, mengompres ulang setiap foto (data URL) yang masih
   berukuran besar, lalu menyimpan kembali ke Supabase. Aman dijalankan berulang:
   foto yang sudah ringan otomatis dilewati. */
function rhoFmtKB(bytes){ return (bytes/1024).toFixed(0)+' KB'; }
async function rhoKompresFotoTersimpan(){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  const recs=(records_rho||[]).slice();
  let totalFoto=0;
  recs.forEach(rec=>{
    const s=rec&&rec.state;
    if(s&&s.refs&&typeof s.refs==='object'){
      Object.keys(s.refs).forEach(k=>{ (s.refs[k]||[]).forEach(c=>{ if(c&&typeof c.foto==='string'&&c.foto.indexOf('data:image')===0) totalFoto++; }); });
    }
  });
  if(!totalFoto){ toast('Tidak ada foto tersimpan untuk dikompres','warn'); return; }
  openConfirm({
    icon:'save',
    title:'Kompres Foto Tersimpan',
    text:'Ditemukan '+totalFoto+' foto pada data tersimpan. Foto akan dikompres agar lebih ringan lalu disimpan ulang. Lanjutkan?',
    onYes:async()=>{
      let done=0, changedRecords=0, bytesBefore=0, bytesAfter=0;
      showLoader('Menyiapkan kompresi foto…');
      try{
        for(const rec of recs){
          const s=rec&&rec.state;
          if(!s||!s.refs||typeof s.refs!=='object') continue;
          let recChanged=false;
          for(const k of Object.keys(s.refs)){
            const arr=s.refs[k]; if(!Array.isArray(arr)) continue;
            for(const c of arr){
              if(!c||typeof c.foto!=='string'||c.foto.indexOf('data:image')!==0) continue;
              const before=rhoDataUrlBytes(c.foto);
              showLoader('Mengompres foto '+(done+1)+' / '+totalFoto+'…');
              const out=await rhoRecompressStored(c.foto);
              const after=rhoDataUrlBytes(out);
              bytesBefore+=before; bytesAfter+=after;
              if(out!==c.foto){ c.foto=out; recChanged=true; }
              done++;
              // Beri jeda kecil agar UI/loader sempat ter-update.
              await new Promise(r=>setTimeout(r,0));
            }
          }
          if(recChanged){
            showLoader('Menyimpan data '+rec.nama_pekerjaan+'…');
            try{ await StoreRho.update(rec.id, { state: JSON.parse(JSON.stringify(s)) }); changedRecords++; }
            catch(err){ console.error('Gagal simpan record',rec.id,err); }
          }
        }
        await refreshDataRho();
        renderRhoView();
      }catch(err){ console.error(err); hideLoader(); toast('Terjadi kesalahan saat kompresi: '+errMsg(err),'err'); return; }
      hideLoader();
      const saved=Math.max(0,bytesBefore-bytesAfter);
      if(changedRecords>0){
        toast('Selesai. '+done+' foto diperiksa, '+changedRecords+' data diperbarui. Hemat '+rhoFmtKB(saved)+' (dari '+rhoFmtKB(bytesBefore)+' menjadi '+rhoFmtKB(bytesAfter)+').','ok');
      }else{
        toast('Selesai. '+done+' foto diperiksa — semuanya sudah ringan, tidak ada yang perlu dikompres.','ok');
      }
    }
  });
}

/* ---------- Migrasi foto lama (base64) ke Supabase Storage ----------
   Menjelajah semua record RHO, mengunggah setiap foto yang masih data-URL (base64)
   ke bucket Storage, lalu mengganti nilai foto pada state menjadi URL ringan &
   menyimpannya kembali. Membuat baris DB jauh lebih kecil sehingga Simpan/Muat cepat.
   Aman diulang: foto yang sudah berupa URL otomatis dilewati. Bila sebuah upload
   gagal, base64-nya dipertahankan (tidak ada data yang hilang). */
async function rhoMigrasiFotoStorage(){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  if(!rhoSupaReady()){ toast('Koneksi Supabase tidak tersedia','warn'); return; }
  const recs=(records_rho||[]).slice();
  let totalFoto=0;
  recs.forEach(rec=>{
    const s=rec&&rec.state;
    if(s&&s.refs&&typeof s.refs==='object'){
      Object.keys(s.refs).forEach(k=>{ (s.refs[k]||[]).forEach(c=>{ if(c&&rhoIsDataUrl(c.foto)) totalFoto++; }); });
    }
  });
  if(!totalFoto){ toast('Tidak ada foto tertanam (base64). Semua foto sudah di Storage.','ok'); return; }
  openConfirm({
    icon:'save',
    title:'Migrasi Foto ke Storage',
    text:'Ditemukan '+totalFoto+' foto yang masih tertanam di data (base64). Foto akan diunggah ke Storage ("'+RHO_BUCKET+'") lalu data dibuat ringan. Pastikan bucket sudah dibuat & publik. Lanjutkan?',
    onYes:async()=>{
      let done=0, changedRecords=0, failed=0, bytesBefore=0, bytesAfter=0;
      showLoader('Menyiapkan migrasi foto…');
      try{
        for(const rec of recs){
          const s=rec&&rec.state;
          if(!s||!s.refs||typeof s.refs!=='object') continue;
          if(!s.info||typeof s.info!=='object') s.info={};
          if(!s.info.fotoKey) s.info.fotoKey=rhoUid();
          const key=s.info.fotoKey;
          let recChanged=false;
          for(const k of Object.keys(s.refs)){
            const arr=s.refs[k]; if(!Array.isArray(arr)) continue;
            for(let r=0;r<arr.length;r++){
              const c=arr[r];
              if(!c||!rhoIsDataUrl(c.foto)) continue;
              done++; showLoader('Mengunggah foto '+done+' / '+totalFoto+'…');
              const before=rhoDataUrlBytes(c.foto); bytesBefore+=before;
              const path=key+'/r'+r+'_i'+k+'.jpg';
              try{
                const res=await StoreRhoFoto.uploadDataUrl(c.foto, path);
                c.foto=res.url+'?v='+Date.now(); c.fotoPath=path;
                bytesAfter+=String(res.url).length;
                recChanged=true;
              }catch(err){ console.error('Migrasi foto gagal',path,err); failed++; bytesAfter+=before; /* pertahankan base64 */ }
              await new Promise(res=>setTimeout(res,0));
            }
          }
          if(recChanged){
            showLoader('Menyimpan data '+(rec.nama_pekerjaan||'')+'…');
            try{ await StoreRho.update(rec.id, { state: JSON.parse(JSON.stringify(s)) }); changedRecords++; }
            catch(err){ console.error('Gagal simpan record',rec.id,err); failed++; }
          }
        }
        await refreshDataRho();
        renderRhoView();
      }catch(err){ console.error(err); hideLoader(); toast('Terjadi kesalahan saat migrasi: '+errMsg(err),'err'); return; }
      hideLoader();
      const saved=Math.max(0,bytesBefore-bytesAfter);
      if(changedRecords>0 && failed===0){
        toast('Selesai. '+done+' foto dipindah ke Storage, '+changedRecords+' data diringankan. Hemat ~'+rhoFmtKB(saved)+'.','ok');
      }else if(changedRecords>0 && failed>0){
        toast('Selesai sebagian. '+changedRecords+' data diringankan, '+failed+' foto gagal (tetap tertanam sebagai cadangan). Cek bucket "'+RHO_BUCKET+'".','warn');
      }else{
        toast('Tidak ada yang berhasil dipindah. Pastikan bucket "'+RHO_BUCKET+'" sudah dibuat & publik.','err');
      }
    }
  });
}

/* ================= LIHAT HARGA ================= */
let rhoViewPage=1;
const RHO_VIEW_PAGE_SIZE=8;
function rhoDateLong(s){ return pnwDateLong(s); }
function rhoViewRows(){
  let rows=(records_rho||[]).slice();
  const fs=(document.getElementById('rho-view-search')?.value||'').toLowerCase().trim();
  if(fs) rows=rows.filter(r=>String(r.nama_pekerjaan||(r.state&&r.state.info&&r.state.info.nama)||'').toLowerCase().includes(fs));
  return rows;
}
function rhoEmptyRow(){
  return '<tr><td colspan="8"><div class="empty">'+
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/></svg>'+
    '<div>Data tidak tersedia</div></div></td></tr>';
}
function renderRhoView(){
  const tb=document.getElementById('rho-view-body');
  const pg=document.getElementById('rho-view-pagination');
  const cEl=document.getElementById('rho-view-count');
  if(!tb) return;
  const rows=rhoViewRows();
  if(cEl) cEl.textContent=rows.length;
  if(!rows.length){ tb.innerHTML=rhoEmptyRow(); if(pg) pg.innerHTML=''; return; }
  const totalPages=Math.max(1,Math.ceil(rows.length/RHO_VIEW_PAGE_SIZE));
  if(rhoViewPage>totalPages) rhoViewPage=totalPages;
  if(rhoViewPage<1) rhoViewPage=1;
  const start=(rhoViewPage-1)*RHO_VIEW_PAGE_SIZE;
  const pageRows=rows.slice(start,start+RHO_VIEW_PAGE_SIZE);
  tb.innerHTML=pageRows.map((r,i)=>{
    const stt=r.state||{}; const info=stt.info||{};
    const nama=r.nama_pekerjaan||info.nama||'—';
    const lokasi=(r.lokasi||info.lokasi||'').trim();
    const metode=r.metode||info.metode||'';
    const ji=(r.jumlah_item!=null)?r.jumlah_item:((stt.items&&stt.items.length)||0);
    const jr=(r.jumlah_referensi!=null)?r.jumlah_referensi:(stt.jumlahRef||0);
    const tgl=r.tgl_input||'';
    const rid=fkEsc(String(r.id));
    return '<tr>'+
      '<td class="col-no">'+(start+i+1)+'</td>'+
      '<td class="wrap-cell col-nama-freeze">'+fkEsc(nama)+'</td>'+
      '<td class="fkl-col-lokasi">'+fkEsc(lokasi||'—')+'</td>'+
      '<td>'+fkEsc(metode||'—')+'</td>'+
      '<td style="text-align:center">'+ji+'</td>'+
      '<td style="text-align:center">'+jr+'</td>'+
      '<td class="col-date">'+fkEsc(tgl?rhoDateLong(tgl):'—')+'</td>'+
      '<td><div class="action-cell" style="justify-content:center">'+
        '<button class="act act-edit" title="Ubah" onclick="openRhoInput(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>'+
        '<button class="act act-view" title="Lihat" onclick="rhoPreviewRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>'+
        '<button class="act act-del" title="Hapus" onclick="rhoDeleteRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>'+
      '</div></td>'+
    '</tr>';
  }).join('');
  if(pg){
    if(totalPages<=1){ pg.innerHTML=''; }
    else{
      let h='<button class="pg-btn" '+(rhoViewPage<=1?'disabled':'')+' onclick="rhoViewGoto('+(rhoViewPage-1)+')">‹</button>';
      for(let p=1;p<=totalPages;p++) h+='<button class="pg-btn '+(p===rhoViewPage?'active':'')+'" onclick="rhoViewGoto('+p+')">'+p+'</button>';
      h+='<button class="pg-btn" '+(rhoViewPage>=totalPages?'disabled':'')+' onclick="rhoViewGoto('+(rhoViewPage+1)+')">›</button>';
      pg.innerHTML=h;
    }
  }
}
function rhoViewGoto(p){ rhoViewPage=p; renderRhoView(); }
function rhoPreviewRecord(id){
  const rec=(records_rho||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  rhoPreviewState=rhoRecordToState(rec);
  rhoOpenPreview();
}
function rhoDeleteRecord(id){
  if(!requireInput()) return;
  const rec=(records_rho||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  openConfirm({ icon:'del', title:'Hapus Data',
    text:'Hapus data referensi harga "'+(rec.nama_pekerjaan||(rec.state&&rec.state.info&&rec.state.info.nama)||'')+'"?',
    onYes:async()=>{
      const fotoKey=(rec&&rec.state&&rec.state.info&&rec.state.info.fotoKey)||null;
      try{ await withActionLoader('Menghapus', async()=>{ await StoreRho.remove(id); await refreshDataRho(); }); }
      catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'err'); return; }
      if(fotoKey) StoreRhoFoto.removeFolder(fotoKey);   // bersihkan objek foto (best-effort)
      toast('Data dihapus','ok'); renderRhoView();
    }
  });
}

/* ================= DOKUMEN PDF ================= */
function rhoBuildDocHtml(){
  const st=rhoActiveState(); const info=st.info||{};
  const fmtNilai=(info.nilai!==''&&info.nilai!=null)?('Rp '+Number(info.nilai).toLocaleString('id-ID')):'-';
  const infoRow=(k,v)=>'<tr><td class="k">'+k+'</td><td class="s">:</td><td class="v" style="text-align:justify">'+fkEsc(v||'-')+'</td></tr>';
  const K=Math.max(1,Math.min(10, parseInt(st.jumlahRef,10)||1));

  const itemBlocks=(st.items||[]).map((nm,i)=>{
    const name=(nm&&nm.trim())?nm:('Barang/Material '+(i+1));
    const cells=(st.refs && st.refs[i])?st.refs[i]:[];
    let th='<tr><th class="lbl">Uraian</th>';
    for(let r=0;r<K;r++) th+='<th>'+fkEsc(rhoRefLabel(r))+'</th>';
    th+='</tr>';
    let rowFoto='<tr><td class="lbl">Foto Produk</td>';
    for(let r=0;r<K;r++){ const f=cells[r]?cells[r].foto:''; rowFoto+='<td class="foto">'+(f?'<img class="rho-pdf-foto" src="'+f+'">':'<span class="rho-pdf-foto-empty">–</span>')+'</td>'; }
    rowFoto+='</tr>';
    let rowLink='<tr><td class="lbl">Link Produk</td>';
    for(let r=0;r<K;r++){ const v=cells[r]?(cells[r].link||''):''; rowLink+='<td class="lnk">'+(v?('<a href="'+fkEsc(v)+'">'+fkEsc(v)+'</a>'):'-')+'</td>'; }
    rowLink+='</tr>';
    const money=(key,label)=>{ let h='<tr><td class="lbl">'+label+'</td>'; for(let r=0;r<K;r++){ const v=cells[r]?cells[r][key]:''; h+='<td class="num">'+rhoRp(v)+'</td>'; } return h+'</tr>'; };
    let rowBerat='<tr><td class="lbl">Berat Barang (kg)</td>';
    for(let r=0;r<K;r++){ const v=cells[r]?cells[r].berat:''; const n=rhoNum(v); rowBerat+='<td class="num">'+(n>0?(fkEsc(String(v))+' kg'):'-')+'</td>'; }
    rowBerat+='</tr>';
    let rowEst='<tr class="auto"><td class="lbl">Estimasi Ongkir</td>';
    for(let r=0;r<K;r++) rowEst+='<td class="num">'+rhoRp(rhoCalcEst(i,r))+'</td>';
    rowEst+='</tr>';
    let rowTot='<tr class="auto tot"><td class="lbl">Harga Total</td>';
    for(let r=0;r<K;r++) rowTot+='<td class="num">'+rhoRp(rhoCalcTot(i,r))+'</td>';
    rowTot+='</tr>';
    return '<div class="rho-doc-item"><div class="rho-doc-item-h"><span class="rn">'+(i+1)+'</span>'+fkEsc(name)+'</div>'+
      '<table class="rho-doc-tbl"><thead>'+th+'</thead><tbody>'+rowFoto+rowLink+money('harga','Harga Satuan')+rowBerat+money('ongkir','Ongkos Kirim (1 kg)')+rowEst+rowTot+'</tbody></table></div>';
  }).join('');

  return ''+
  '<div class="fkl-doc pnw-doc rho-doc">'+
    '<div class="fkl-doc-head">'+
      '<div class="fkl-doc-logo"><img src="'+FKL_LOGO_SRC+'" alt="Logo PLN"></div>'+
      '<div class="fkl-doc-org">'+
        '<div class="l1">PT PLN (PERSERO)</div>'+
        '<div class="l2">UNIT PELAKSANA PELAYANAN PELANGGAN MASOHI</div>'+
        '<div class="l3">Jl. Abdullah Soulissa No 1, Masohi, Kec. Kota Masohi</div>'+
      '</div>'+
    '</div>'+
    '<div class="fkl-doc-band"></div>'+
    '<h1 class="fkl-doc-title">REFERENSI HARGA ONLINE</h1>'+
    '<div class="fkl-doc-titlegap"></div>'+
    '<div class="fkl-sec-h"><span class="rn">A</span>Data Pekerjaan</div>'+
    '<table class="fkl-info"><tbody>'+
      infoRow('Nama Pekerjaan', info.nama)+
      infoRow('Lokasi Pekerjaan', info.lokasi)+
      infoRow('Rencana Anggaran Biaya', fmtNilai)+
      infoRow('No. Anggaran', info.no_anggaran)+
      infoRow('Tgl. Anggaran', info.tgl_anggaran?pnwDateLong(info.tgl_anggaran):'-')+
      infoRow('Jenis Anggaran', info.jenis_anggaran)+
      infoRow('Metode Pengadaan', info.metode)+
    '</tbody></table>'+
    '<div class="fkl-sec-h"><span class="rn">B</span>Referensi Harga</div>'+
    itemBlocks+
  '</div>';
}
function rhoExtraDocCss(){
  return ''+
  '.rho-doc-item{margin:10px 0 16px;break-inside:avoid;page-break-inside:avoid;-webkit-column-break-inside:avoid}'+
  '.rho-doc-item-h{break-after:avoid;page-break-after:avoid}'+
  'table.rho-doc-tbl{break-inside:avoid;page-break-inside:avoid}'+
  '.rho-doc-item-h{display:flex;align-items:center;gap:8px;font-family:"Plus Jakarta Sans",sans-serif;font-weight:800;font-size:12px;color:#0b3d42;background:#e3f2f3;border:1px solid #bfe0e2;border-radius:6px;padding:6px 10px;margin-bottom:6px;text-transform:uppercase}'+
  '.rho-doc-item-h .rn{flex:0 0 auto;color:#0b3d42;font-family:"Plus Jakarta Sans",sans-serif;font-weight:800;font-size:12px;line-height:1;background:none;border:0;padding:0;margin:0}'+
  '.rho-doc,.rho-doc *{-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  'table.rho-doc-tbl{width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:4px;border:1px solid #0b6a73}'+
  'table.rho-doc-tbl th,table.rho-doc-tbl td{border:1px solid #cfe0e3;padding:5px 7px;font-size:10px;vertical-align:middle;word-wrap:break-word;overflow-wrap:anywhere}'+
  'table.rho-doc-tbl thead th{background:#0E7C86;color:#fff;font-weight:800;text-transform:uppercase;letter-spacing:.2px;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  'table.rho-doc-tbl thead th.lbl,table.rho-doc-tbl td.lbl{width:118px}'+
  'table.rho-doc-tbl td.lbl{text-align:left}'+
  'table.rho-doc-tbl thead th.lbl{text-align:center}'+
  'table.rho-doc-tbl td.lbl{background:#f1f6f7;color:#0b3d42;font-weight:700}'+
  'table.rho-doc-tbl thead th.lbl{background:#0b6a73;color:#fff}'+
  'table.rho-doc-tbl td.num{text-align:right;font-weight:700;white-space:nowrap}'+
  'table.rho-doc-tbl td.foto{text-align:center;padding:3px}'+
  'table.rho-doc-tbl td.lnk{font-size:8.5px;word-break:break-all}'+
  'table.rho-doc-tbl td.lnk a{color:#0b6a73;text-decoration:none}'+
  'table.rho-doc-tbl tr.auto td{background:#fbfdf4}'+
  'table.rho-doc-tbl tr.tot td{background:#eef8f1;color:#0d7a3f;font-weight:800}'+
  '.rho-pdf-foto{width:100%;max-width:150px;height:92px;object-fit:contain;object-position:center;background:#fff;display:block;margin:0 auto}'+
  '.rho-pdf-foto-empty{color:#9aabb0;font-style:italic;font-size:9px}';
}
function rhoStandaloneDocHtml(){
  return fklDocShell(rhoExtraDocCss(), rhoBuildDocHtml());
}
function rhoOpenPreview(){
  const ov=document.getElementById('pn-preview-overlay'); if(!ov) return;
  const _mdl=ov.querySelector('.pn-preview-modal'); if(_mdl) _mdl.classList.remove('is-max');
  if(typeof pnPreviewResetMaxBtn==='function') pnPreviewResetMaxBtn();
  const titleEl=document.getElementById('pn-preview-title');
  if(titleEl) titleEl.textContent='Pratinjau — Referensi Harga Online';
  const body=document.getElementById('pn-preview-body');
  if(body){
    body.classList.add('fkl-preview-body');
    body.innerHTML='<iframe id="rho-preview-frame" title="Pratinjau Dokumen"></iframe>';
    const ifr=document.getElementById('rho-preview-frame');
    const doc=ifr.contentWindow.document; doc.open(); doc.write(rhoStandaloneDocHtml()); doc.close();
  }
  const actions=document.querySelector('#pn-preview-overlay .pn-preview-head-actions');
  { const _c=document.getElementById('hpsc-preview-print'); if(_c) _c.remove(); }
  const oldFkl=document.getElementById('fkl-preview-print'); if(oldFkl) oldFkl.remove();
  const oldPnw=document.getElementById('pnw-preview-print'); if(oldPnw) oldPnw.remove();
  if(actions && !document.getElementById('rho-preview-print')){
    const btn=document.createElement('button');
    btn.id='rho-preview-print'; btn.className='btn btn-teal';
    btn.style.padding='8px 14px'; btn.style.fontSize='11px';
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>Cetak / PDF';
    btn.onclick=rhoPrint;
    actions.insertBefore(btn, actions.firstChild);
  }
  ov.classList.add('show');
}
function rhoPrint(){
  const old=document.getElementById('rho-print-frame'); if(old) old.remove();
  const ifr=document.createElement('iframe');
  ifr.id='rho-print-frame'; ifr.setAttribute('aria-hidden','true');
  ifr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(ifr);
  const doc=ifr.contentWindow.document; doc.open(); doc.write(rhoStandaloneDocHtml()); doc.close();
  const go=()=>fklWaitPaged(ifr, _go);
  const _go=()=>{ withHiddenPageTitle(()=>{ try{ ifr.contentWindow.focus(); ifr.contentWindow.print(); }catch(e){ try{ window.print(); }catch(_){} } }); setTimeout(()=>{ const f=document.getElementById('rho-print-frame'); if(f) f.remove(); },1500); };
  const imgs=doc.images?Array.from(doc.images):[];
  if(imgs.length){ let n=imgs.length; const dec=()=>{ if(--n<=0) setTimeout(go,60); }; imgs.forEach(im=>{ if(im.complete) dec(); else { im.onload=dec; im.onerror=dec; } }); setTimeout(go,1600); }
  else setTimeout(go,120);
}

/* ##################### AKHIR MODUL REFERENSI HARGA ONLINE #################### */


/* ####################################################################### */
/* ################# MODUL DATA PEKERJAAN (MASTER TERPUSAT) ############### */
/* Data Pekerjaan (Nama, Lokasi, Nilai, No. Anggaran, Tgl. Anggaran, Metode
   Pengadaan) kini diisi & disimpan SEKALI di sini, lalu dipakai bersama oleh
   Perhitungan HPS maupun Analisa Harga Satuan lewat "Pilih Data Pekerjaan"
   (nilai disalin/snapshot ke masing-masing dokumen saat dipilih, sehingga
   dokumen yang sudah tersimpan tidak berubah walau Data Pekerjaan induknya
   diubah/dihapus di kemudian hari). */
/* ####################################################################### */

const DP_INFO_FIELDS = [
  {key:'nama',         label:'Nama Pekerjaan',            type:'text', span:2},
  {key:'lokasi',       label:'Lokasi Pekerjaan',          type:'text', span:2},
  {key:'nilai',        label:'Rencana Anggaran Biaya', type:'num'},
  {key:'no_anggaran',  label:'No. Anggaran',              type:'text'},
  {key:'tgl_anggaran', label:'Tgl. Anggaran',             type:'date'},
  {key:'jenis_anggaran',label:'Jenis Anggaran',           type:'select', options:['Operasi','Investasi']},
  {key:'metode',       label:'Metode Pengadaan',          type:'select', options:PNW_METODE},
  /* Bidang Pelaksana — opsi sama persis dengan Monitoring (BIDANG_OPTS) */
  {key:'bidang_pelaksana', label:'Bidang Pelaksana',      type:'select', span:2, options:BIDANG_OPTS},
  {key:'pengguna',     label:'Nama Pengguna (Manager)',            type:'text', span:2},
  {key:'pejabat',      label:'Nama Pejabat Pelaksana Pengadaan',   type:'text', span:2}
];
/* Kunci field yang dipakai bersama oleh HPS & Analisa (sumbernya dari Data Pekerjaan) */
const DP_SHARED_KEYS = DP_INFO_FIELDS.map(f=>f.key);
const DP_LOCK_BADGE='<span class="lock-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Dari Data Pekerjaan</span>';

function dpBlankState(){ return { info:{} }; }
let dpState = dpBlankState();
let dpEditId = null;

const DP_TABLE='data_pekerjaan';
const DP_LS_KEY='dp_records_v1';
let records_dp=[];
let dpUseLocal=false;
function dpSupaReady(){ return !!(USE_SUPABASE && db); }
function dpLocalLoad(){ try{ const r=localStorage.getItem(DP_LS_KEY); records_dp=r?JSON.parse(r):[]; }catch(e){ records_dp=[]; } }
function dpLocalSave(){ /* dinonaktifkan: data hanya di Supabase */ }
function dpIsLocalId(id){ return String(id).indexOf('loc_')===0; }
const StoreDp={
  async list(){
    if(!dpSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(DP_TABLE).select('*').order('created_at',{ascending:false});
    if(error) throw error; return data||[];
  },
  async create(rec){
    if(!dpSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(DP_TABLE).insert(rec).select();
    if(error) throw error; return data&&data[0];
  },
  async update(rid, rec){
    if(!dpSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(DP_TABLE).update(rec).eq('id',rid);
    if(error) throw error;
  },
  async remove(rid){
    if(!dpSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(DP_TABLE).delete().eq('id',rid);
    if(error) throw error;
  }
};
async function refreshDataDp(){
  try{ records_dp=await StoreDp.list(); }
  catch(err){ console.error(err); records_dp=records_dp||[]; }
}
function dpRecordToState(rec){
  const s=(rec&&rec.state&&typeof rec.state==='object')?rec.state:{};
  const info={};
  DP_SHARED_KEYS.forEach(k=>{ info[k]=(s.info&&s.info[k]!=null)?s.info[k]:(rec[k]!=null?rec[k]:''); });
  return { info };
}
