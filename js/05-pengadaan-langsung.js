/* ===== 05-pengadaan-langsung.js (bagian 5/15, baris 3262-4382 dari app.js asli) =====
   Modul Pengadaan Langsung (PL) + toast.
   WAJIB dimuat berurutan 01 s.d. 15 — jangan ubah urutannya. ===== */
/* ============================================================
   ============  PENGADAAN LANGSUNG (PL)  =====================
   ============================================================ */
const TABLE_PL = 'pengadaan_langsung';      // tabel Supabase untuk Pengadaan Langsung
const STORE_PL = 'monitoring_pl_up3masohi'; // (tidak dipakai lagi — data di Supabase)
let records_pl = [];
let editingIdPl = null;
let plReturnView = 'dashboard';
let seqPl = 1;
let useSupaPl = USE_SUPABASE;               // Pengadaan Langsung disimpan di Supabase (tabel: pengadaan_langsung)
function idPl(){ return 'p'+(seqPl++)+'_'+Date.now().toString(36); }
function plInputId(key){ return 'pl_'+key; }

function cleanForDbPl(rec){
  const o={};
  FIELDS_PL.forEach(f=>{ o[f.key]=cleanFieldValue(f, rec); });
  // Simpan field multi-nilai independen sebagai JSON (kolom jsonb)
  o.bidang_sub_bidang_list = Array.isArray(rec.bidang_sub_bidang_list) ? rec.bidang_sub_bidang_list : null;
  return o;
}
function lsListPl(){ return []; }               /* penyimpanan lokal dinonaktifkan */
function lsPersistPl(arr){ /* no-op */ }         /* data PL hanya di Supabase */

const Store_PL = {
  async list(){
    const {data,error}=await db.from(TABLE_PL).select('*').order('created_at',{ascending:false});
    if(error) throw error;
    return (data||[]).map(r=>{ FIELDS_PL.forEach(f=>{ if(f.type==='num'&&r[f.key]!=null)r[f.key]=Number(r[f.key]); if(r[f.key]==null && !isIndepKeyPl(f.key))r[f.key]=''; }); if(r.bidang_sub_bidang_list==null) delete r.bidang_sub_bidang_list; return r; });
  },
  async create(rec){
    const {data,error}=await db.from(TABLE_PL).insert(cleanForDbPl(rec)).select(); if(error) throw error; return data[0];
  },
  async bulkCreate(arr){
    const {data,error}=await db.from(TABLE_PL).insert(arr.map(cleanForDbPl)).select(); if(error) throw error; return data;
  },
  async update(rid,rec){
    const {error}=await db.from(TABLE_PL).update(cleanForDbPl(rec)).eq('id',rid); if(error) throw error;
  },
  async remove(rid){
    const {error}=await db.from(TABLE_PL).delete().eq('id',rid); if(error) throw error;
  },
  async removeAll(){
    const {error}=await db.from(TABLE_PL).delete().not('id','is',null); if(error) throw error;
  }
};

function seedSamplesPl(){
  seqPl=3;
  return [
    {id:idPl(),nama_pekerjaan:'Pengadaan Material AMR Pelanggan TM',lokasi_pekerjaan:'Masohi Kota',jangka_waktu:'60 hari kalender',bidang_pelaksana:'Transaksi Energi Listrik',level_risiko:'Rendah',no_nota_dinas:'ND-014/2025',jenis_anggaran:'Operasi',jenis_pengadaan:'Barang',jenis_kontrak:'Lumsum',bidang_sub_bidang:'Pengadaan Barang - Mekanikal dan Elektrikal',bidang_sub_bidang_list:['Pengadaan Barang - Mekanikal dan Elektrikal'],no_prk:'2025.MMU.AO-ADM.01.01',no_anggaran:'001/SKKO/GM.MMU/ADM.NIAGA/MSH/2025/R1',nomor_pr:'3002518656',no_eproc:'EPROC-4230-20250319-4230-00001',no_kontrak:'PL-014/UP3MSH/2025',tgl_awal_kontrak:'2025-03-12',tgl_akhir_kontrak:'2025-05-11',kontrak_total_dengan_ppn:185000000,perusahaan:'CV Energi Nusantara',nama_pic:'Rudi Hartono',tahapan:'Terkontrak',manajemen_kontrak:'Sudah'},
    {id:idPl(),nama_pekerjaan:'Pengadaan Jasa Kebersihan Kantor UP3',lokasi_pekerjaan:'Masohi',jangka_waktu:'1 tahun',bidang_pelaksana:'Keuangan dan Umum',level_risiko:'Tidak Ada',no_nota_dinas:'ND-021/2025',jenis_anggaran:'Operasi',jenis_pengadaan:'Jasa Lainnya',jenis_kontrak:'Lumsum',bidang_sub_bidang:'Jasa Lainnya / Kebersihan',bidang_sub_bidang_list:['Jasa Lainnya / Kebersihan'],no_eproc:'EP-200210',no_kontrak:'',tgl_awal_kontrak:'',perusahaan:'PT Bersih Maluku',tahapan:'Proses Pengadaan',manajemen_kontrak:'Belum'},
  ];
}

async function refreshDataPl(){
  try{ records_pl = await Store_PL.list(); }
  catch(err){ console.error(err); records_pl = records_pl||[]; toast('Gagal memuat data Pengadaan Langsung dari Supabase: '+errMsg(err),'err'); }
  renderTablePl();
  if(document.getElementById('dash-filter-jenis')?.value==='pl') renderDashboard();
}

/* ============================================================
   HELPER BERSAMA PENYESUAIAN (dipakai KR, PL, Tender)
   Model: setiap kelompok punya `cols` (1..5) = jumlah kolom bidang.
          setiap field bisa punya `widthPx` = lebar tetap (pixel).
          Field tanpa widthPx mengisi 1 kolom (flex).
   ============================================================ */
const PYN_COLS_MAX=5;
/* Semua form Input Pekerjaan memakai 4 kolom seragam dengan lebar field sama */
const FORM_COLS_FIXED=4;
function pynGroupCols(g){ return FORM_COLS_FIXED; }
/* Lebar px efektif sebuah field. Migrasi otomatis dari span lama (1/2/3) -> null (pakai kolom). */
function fieldWidthPx(f){ const w=parseInt(f&&f.widthPx,10); return (!isNaN(w)&&w>0)?w:null; }
/* Kembalikan {cls, style} untuk elemen .field pada container .form-flow.
   Prioritas: widthPx (pixel tetap) > span legacy (mengisi N kolom) > auto (1 kolom). */
function fieldPxStyle(f){
  /* Semua field berukuran sama (mengisi 1 kolom dari 4). Lebar px & span
     legacy diabaikan agar tata letak seragam. */
  return {cls:'', style:''};
}

/* ---- Bangun form input PL secara dinamis dari FIELDS_PL/GROUPS_PL ---- */
const PL_SECTION_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>';
const PL_LOCK_RULES = {
  gagal_batal: r => r.tahapan !== 'Gagal/Batal',
  drp_tidak_ada: r => r.ketersediaan_drp !== 'Ada',
};
/* ===== Field multi-nilai INDEPENDEN untuk Pengadaan Langsung =====
   Format & ukuran mengikuti field Bidang/Sub Bidang pada Tender (tombol
   +Tambah / Hapus sendiri, tiap isian punya baris input tersendiri). */
const INDEP_MULTI_KEYS_PL = ['bidang_sub_bidang'];
function isIndepKeyPl(key){ return INDEP_MULTI_KEYS_PL.includes(key); }
function indepListElPl(key){ return document.getElementById('indeplist_pl_'+key); }
function makeIndepRowPl(val){
  const row=document.createElement('div'); row.className='indep-row';
  const inp=document.createElement('input'); inp.type='text'; inp.value=(val!=null?val:'');
  inp.placeholder='cth. Pengadaan Barang - Mekanikal dan Elektrikal';
  row.appendChild(inp); return row;
}
function setIndepValuesPl(key,arr){
  const el=indepListElPl(key); if(!el) return;
  el.innerHTML='';
  const vals=(Array.isArray(arr)&&arr.length)?arr:[''];
  vals.forEach(v=>el.appendChild(makeIndepRowPl(v)));
  updateIndepDelStatePl(key);
}
function indepValuesPl(key){
  const el=indepListElPl(key); if(!el) return [];
  let arr=[...el.querySelectorAll('input')].map(i=>i.value.trim());
  while(arr.length>1 && arr[arr.length-1]==='') arr.pop();
  return arr;
}
function addIndepRowPl(key){
  const el=indepListElPl(key); if(!el) return;
  const row=makeIndepRowPl(''); el.appendChild(row);
  updateIndepDelStatePl(key); row.querySelector('input').focus();
}
function removeIndepRowPl(key){
  const el=indepListElPl(key); if(!el) return;
  const rows=el.querySelectorAll('.indep-row');
  if(rows.length<=1){ toast('Minimal harus ada 1 isian','warn'); return; }
  rows[rows.length-1].remove();
  updateIndepDelStatePl(key);
}
function updateIndepDelStatePl(key){
  const btn=document.getElementById('indepdel_pl_'+key); const el=indepListElPl(key);
  if(btn&&el) btn.disabled=el.querySelectorAll('.indep-row').length<=1;
}
/* HTML satu field multi-nilai independen (PL) — kelas & ukuran sama seperti Tender */
function indepFieldHTMLPl(f){
  const pxw=fieldPxStyle(f);
  const req=f.req?' <span class="req">*</span>':'';
  return `<div class="field${pxw.cls} indep-field field-wide15"${pxw.style} id="wrap_${plInputId(f.key)}">
    <div class="indep-head">
      <label>${f.label}${req}</label>
      <div class="indep-actions">
        <button type="button" class="indep-add" onclick="addIndepRowPl('${f.key}')" title="Tambah isian">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M12 5v14M5 12h14"/></svg>Tambah
        </button>
        <button type="button" class="indep-del-btn" id="indepdel_pl_${f.key}" onclick="removeIndepRowPl('${f.key}')" title="Hapus isian terakhir">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>Hapus
        </button>
      </div>
    </div>
    <div class="indep-list" id="indeplist_pl_${f.key}"></div>
  </div>`;
}
/* Nilai sel Excel untuk field multi-nilai independen (PL) */
function indepCellValuePl(rec,key){
  const list=Array.isArray(rec[key+'_list'])?rec[key+'_list'].filter(x=>x!=null&&x!==''):[];
  if(list.length>1) return list.join('\n');
  let v=list.length?list[0]:rec[key];
  return (v==null||v==='')?'':v;
}

function buildFormPl(){
  const cont=document.getElementById('form-pl-fields'); if(!cont) return;
  let html='';
  GROUPS_PL.forEach((g,gi)=>{
    const cols=pynGroupCols(g);
    let titleExtra='';
    if(gi===0 && g.keys.includes('tahun')){
      titleExtra=`<div class="title-controls">${yearControlHTML(plInputId('tahun'))}</div>`;
    }
    html+=`<div class="form-card"><div class="form-section-title">${PL_SECTION_ICON}${g.title}${titleExtra}</div><div class="form-flow" style="--cols:${cols}">`;
    g.keys.forEach(k=>{
      if(gi===0 && k==='tahun') return; // Tahun sudah dipindah ke baris judul
      const f=FIELDS_PL.find(x=>x.key===k); if(!f) return;
      if(isIndepKeyPl(k)){ html+=indepFieldHTMLPl(f); return; }
      const id=plInputId(k);
      const req=f.req?' <span class="req">*</span>':'';
      const pxw=fieldPxStyle(f);
      const onCtrl=f.ctrl?' onchange="applyLocksPl()"':'';
      const ph=f.ph?` placeholder="${f.ph}"`:'';
      let ctl='';
      if(f.type==='select') ctl=`<select id="${id}"${onCtrl}><option value="">— Pilih —</option>${(f.options||[]).map(o=>`<option>${o}</option>`).join('')}</select>`;
      else if(f.type==='num'){
        if(f.auto==='sum'||f.auto==='ppn') ctl=`<input id="${id}" type="text" inputmode="numeric" placeholder="Rp" readonly>`;
        else if(/_harga_(barang|jasa)$/.test(f.key)){ const pfx=f.key.replace(/_harga_(barang|jasa)$/,''); ctl=`<input id="${id}" type="text" inputmode="numeric" placeholder="Rp" oninput="onHargaInput(this,'${pfx}','pl')"${onCtrl}>`; }
        else ctl=`<input id="${id}" type="text" inputmode="numeric" placeholder="Rp" oninput="onRupiahInput(this)"${onCtrl}>`;
      }
      else if(f.type==='date') ctl=`<input id="${id}" type="date"${onCtrl}>`;
      else ctl=`<input id="${id}" type="text"${ph}${onCtrl}>`;
      const note=f.auto==='sum'?AUTO_NOTE:(f.auto==='ppn'?PPN_NOTE:(f.lock?LOCK_NOTE:''));
      html+=`<div class="field${pxw.cls}"${pxw.style} id="wrap_${id}"><label>${f.label}${req}${note?' ':''}${note}</label>${ctl}</div>`;
    });
    html+=`</div></div>`;
  });
  cont.innerHTML=html;
  INDEP_MULTI_KEYS_PL.forEach(k=>setIndepValuesPl(k,['']));
  applyLocksPl();
}
function isLockedPl(field, vals){
  if(!field.lock) return false;
  const rule = PL_LOCK_RULES[field.lock];
  return rule ? rule(vals) : false;
}
function applyLocksPl(){
  const vals=readFormPl();
  FIELDS_PL.forEach(f=>{
    if(!f.lock) return;
    const el=document.getElementById(plInputId(f.key));
    const wrap=document.getElementById('wrap_'+plInputId(f.key));
    if(!el||!wrap) return;
    const locked=isLockedPl(f,vals);
    el.disabled=locked;
    wrap.classList.toggle('locked',locked);
    if(locked){ el.value=''; wrap.classList.remove('field-error'); }
  });
}

/* ---- Form helpers PL ---- */
function clearFormPl(){ FIELDS_PL.forEach(f=>{ if(isIndepKeyPl(f.key)){ const w=document.getElementById('wrap_'+plInputId(f.key)); if(w){w.classList.remove('locked');w.classList.remove('field-error');} return; } const el=document.getElementById(plInputId(f.key)); if(el){el.value='';if(f.auto!=='sum')el.disabled=false;} const w=document.getElementById('wrap_'+plInputId(f.key)); if(w){w.classList.remove('locked');w.classList.remove('field-error');} }); INDEP_MULTI_KEYS_PL.forEach(k=>setIndepValuesPl(k,[''])); refreshAutoTotals(FIELDS_PL, plInputId); applyLocksPl(); }
function fillFormPl(rec){ FIELDS_PL.forEach(f=>{ if(isIndepKeyPl(f.key)) return; const el=document.getElementById(plInputId(f.key)); if(el)el.value = f.type==='num' ? rupiahInputText(rec[f.key]) : (rec[f.key]!=null ? rec[f.key] : ''); }); INDEP_MULTI_KEYS_PL.forEach(k=>{ const list=(Array.isArray(rec[k+'_list'])&&rec[k+'_list'].length)?rec[k+'_list']:((rec[k]!=null&&rec[k]!=='')?[rec[k]]:['']); setIndepValuesPl(k,list); }); refreshAutoTotals(FIELDS_PL, plInputId); applyLocksPl(); }
function readFormPl(){ const rec={}; FIELDS_PL.forEach(f=>{ if(isIndepKeyPl(f.key)) return; const el=document.getElementById(plInputId(f.key)); let v=el?el.value.trim():''; if(f.type==='num') v=parseRupiah(v); rec[f.key]=v; }); FIELDS_PL.forEach(f=>{ if(f.auto==='sum'){ const p=f.key.replace(/_total_tanpa_ppn$/,''); const b=Number(rec[p+'_harga_barang'])||0,j=Number(rec[p+'_harga_jasa'])||0; rec[f.key]=(b+j)>0?(b+j):''; } }); FIELDS_PL.forEach(f=>{ if(f.auto==='ppn'){ const base=Number(rec[f.key.replace(/_total_dengan_ppn$/,'_total_tanpa_ppn')])||0; rec[f.key]=base>0?ppnFromBase(base):''; } }); INDEP_MULTI_KEYS_PL.forEach(k=>{ const list=indepValuesPl(k); rec[k+'_list']=list; rec[k]=list[0]||''; }); return rec; }
function newRecordPl(){
  if(!requireInput()) return;
  if(PYN_REG.pl.active) exitPenyesuaianPl();
  editingIdPl=null; plReturnView='dashboard'; clearFormPl();
  document.getElementById('input-pl-title').textContent='Input Pekerjaan';
  document.getElementById('edit-banner-pl').style.display='none';
  document.getElementById('io-tpl-pl').style.display='';
  showView('input-pl'); saveDraft('input-pl');
}
function editRecordPl(rid){
  if(!requireAdmin()) return;
  if(PYN_REG.pl.active) exitPenyesuaianPl();
  const rec=records_pl.find(r=>r.id===rid); if(!rec) return;
  editingIdPl=rid; plReturnView='list-pl'; fillFormPl(rec);
  document.getElementById('input-pl-title').textContent='Ubah Data Pekerjaan';
  const b=document.getElementById('edit-banner-pl'); b.style.display='flex';
  document.getElementById('edit-banner-pl-text').textContent='Mode Ubah Data';
  document.getElementById('io-tpl-pl').style.display='none';
  showView('input-pl','Memuat'); saveDraft('input-pl');
}

/* ---- Validasi field wajib PL ---- */
function clearFormErrorsPl(){
  FIELDS_PL.forEach(f=>{ const w=document.getElementById('wrap_'+plInputId(f.key)); if(w) w.classList.remove('field-error'); });
}
/* Field wajib yang kosong (field terkunci dikecualikan) */
function missingRequiredPl(rec){
  const missing=[];
  FIELDS_PL.forEach(f=>{
    if(!f.req) return;
    if(isLockedPl(f,rec)) return;           // field terkunci => tidak wajib
    const v=rec[f.key];
    const empty = (v==null) || (String(v).trim()==='') || (f.type==='num' && (v===0 || v==='0'));
    if(empty) missing.push(f.key);
  });
  return missing;
}

/* ---- Simpan / Batal / Hapus PL ---- */
function askSavePl(){
  if(!requireInput()) return;
  const rec=readFormPl();
  clearFormErrorsPl();
  const missing=missingRequiredPl(rec);
  if(missing.length){
    missing.forEach(k=>{ const w=document.getElementById('wrap_'+plInputId(k)); if(w) w.classList.add('field-error'); });
    const firstWrap=document.getElementById('wrap_'+plInputId(missing[0]));
    if(firstWrap) firstWrap.scrollIntoView({behavior:'smooth',block:'center'});
    toast('Data gagal disimpan, lengkapi data terlebih dahulu','warn');
    return;
  }
  /* Duplikat: cukup Nama Pekerjaan ATAU No. Kontrak yang sama dengan data lain. */
  {
    const bentrok=spkDupCek(rec, records_pl,
      {nomor:'no_kontrak', labelNomor:'No. Kontrak', nama:['nama_pekerjaan']}, editingIdPl);
    if(bentrok){ toast('Tidak bisa menambahkan 1 data : Duplikat\nSudah ada data dengan '+bentrok.by+' yang sama.','err'); return; }
  }
  openConfirm({icon:'save',title:'Simpan Data',text:'Apakah anda yakin ingin menyimpan data pekerjaan?',onYes:doSavePl});
}
async function doSavePl(){
  const rec=readFormPl();
  try{
    if(editingIdPl){ await Store_PL.update(editingIdPl,rec); toast('Data berhasil diperbarui','ok'); }
    else{ await Store_PL.create(rec); toast('Data berhasil disimpan','ok'); }
  }catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'warn'); return; }
  editingIdPl=null; clearFormPl(); clearDraft();
  await refreshDataPl();
  showView('list-pl');
}
function askCancelPl(){
  const back = editingIdPl ? plReturnView : 'dashboard';
  openConfirm({icon:'back',title:'Batalkan',text:'Apakah anda yakin ingin membatalkan data pekerjaan?',
    onYes:()=>{ editingIdPl=null; clearFormPl(); clearDraft(); showView(back); }});
}
function askDeletePl(rid){
  if(!requireAdmin()) return;
  openConfirm({icon:'del',title:'Hapus Data',text:'Apakah anda yakin ingin menghapus data pekerjaan?',
    onYes:async()=>{
      try{ await withActionLoader('Menghapus', async()=>{ await Store_PL.remove(rid); await refreshDataPl(); }); }
      catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'warn'); return; }
      toast('Data berhasil dihapus','ok');
    }});
}
/* HAPUS SEMUA (Pengadaan Langsung) */
function askDeleteAllPl(){
  if(!requireAdmin()) return;
  if(!records_pl || records_pl.length===0){ toast('Tidak ada data untuk dihapus','warn'); return; }
  openConfirm({icon:'del',title:'Hapus Semua Data',
    text:'Apakah anda yakin ingin menghapus semua data pekerjaan?',
    onYes:async()=>{
      try{ await withActionLoader('Menghapus', async()=>{ await Store_PL.removeAll(); await refreshDataPl(); }); }
      catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'warn'); return; }
      currentPagePl=1; renderTablePl();
      toast('Semua data berhasil dihapus','ok');
    }});
}

/* ============================================================
   PENYESUAIAN FORM — MESIN GENERIK (dipakai KR, PL, Tender)
   Atur per kelompok: JUMLAH KOLOM (1..5), nama kelompok.
   Atur per field: nama, LEBAR (pixel), tipe (khusus field baru),
                   urutan via DRAG & DROP (juga antar-kelompok),
                   hapus & tambah field. (persistensi lokal dinonaktifkan)
   ============================================================ */
function pynEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ---- Registry per jenis form ----
   Setiap jenis mendaftarkan: state flag, referensi FIELDS/GROUPS,
   base snapshot, locked keys, id elemen, judul, builder & fill. */
const PYN_REG = {};
function pynRegister(cfg){ PYN_REG[cfg.id]=cfg; cfg.active=false; cfg.work=null; }

/* ---- Persistensi ---- (localStorage dinonaktifkan; skema tidak disimpan lokal) */
function pynLoadSaved(reg){ return null; }
function pynPersist(reg,schema){ /* no-op: tidak menyimpan ke localStorage */ }
/* Ganti ISI array FIELDS & GROUPS in-place (referensi tetap) */
function pynApplySchema(reg,schema){
  if(!schema||!Array.isArray(schema.fields)||!Array.isArray(schema.groups)) return;
  const F=reg.fields, G=reg.groups;
  F.length=0; schema.fields.forEach(f=>F.push({...f}));
  G.length=0; schema.groups.forEach(g=>{ const ng={title:g.title, keys:[...g.keys]}; if(g.cols!=null)ng.cols=g.cols; if(g.pnw)ng.pnw=true; G.push(ng); });
}
function pynApplySaved(reg){ const s=pynLoadSaved(reg); if(s) pynApplySchema(reg,s); }

/* ---- Konversi schema <-> salinan kerja (grup berisi objek field) ---- */
function pynBuildWork(schema){
  const byKey={}; schema.fields.forEach(f=>byKey[f.key]={...f});
  return { groups: schema.groups.map(g=>({ title:g.title, cols:(g.cols!=null?g.cols:3), pnw:!!g.pnw, fields:g.keys.map(k=>byKey[k]).filter(Boolean) })) };
}
function pynCurrentSchema(reg){
  return { fields: reg.fields.map(f=>({...f})),
           groups: reg.groups.map(g=>{ const ng={title:g.title, keys:[...g.keys]}; ng.cols=(g.cols!=null?g.cols:3); if(g.pnw)ng.pnw=true; return ng; }) };
}
function pynFlatten(w){
  const fields=[], groups=[];
  w.groups.forEach(g=>{
    const keys=[];
    g.fields.forEach(f=>{ const nf={...f}; if(nf.type==='select'&&!Array.isArray(nf.options)) nf.options=[]; fields.push(nf); keys.push(nf.key); });
    const ng={ title:(g.title||'').trim()||'Kelompok', keys }; ng.cols=pynGroupCols(g); if(g.pnw)ng.pnw=true;
    groups.push(ng);
  });
  return { fields, groups };
}

/* ---- Kompatibilitas nama lama (PL) ---- */
function buildWorkSchemaFrom(schema){ return pynBuildWork(schema); }

/* ---- Masuk / keluar mode ---- */
function pynSetButtons(reg){
  const s=document.getElementById(reg.saveLabelId);
  const b=document.getElementById(reg.cancelLabelId);
  if(s) s.textContent = reg.active ? 'Simpan Penyesuaian' : 'Simpan';
  if(b) b.textContent = reg.active ? 'Batal' : (reg.cancelDefault||'Batal');
}
function pynStart(id){
  const reg=PYN_REG[id]; if(!reg) return;
  if(!requireAdmin()) return;
  reg.active=true;
  reg.work=pynBuildWork(pynCurrentSchema(reg));
  document.getElementById(reg.titleId).textContent='Penyesuaian Form — '+reg.label;
  const bn=document.getElementById(reg.bannerId); bn.style.display='flex'; bn.classList.add('penyesuaian');
  document.getElementById(reg.bannerTextId).textContent='Mode Penyesuaian — atur nama field, lebar (px), jumlah kolom, dan urutan (seret)';
  const pb=document.getElementById(reg.btnId); if(pb) pb.style.display='none';
  pynSetButtons(reg);
  pynRender(id);
  window.scrollTo({top:0,behavior:'smooth'});
}
function pynExit(id){
  const reg=PYN_REG[id]; if(!reg) return;
  reg.active=false; reg.work=null;
  const pb=document.getElementById(reg.btnId); if(pb) pb.style.display='';
  const bn=document.getElementById(reg.bannerId); if(bn) bn.classList.remove('penyesuaian');
  pynSetButtons(reg);
  reg.rebuild();
  reg.afterExit && reg.afterExit();
}
function pynSimpanClick(id){ const reg=PYN_REG[id]; if(reg&&reg.active) pynSave(id); else PYN_REG[id].onSave(); }
function pynBatalClick(id){ const reg=PYN_REG[id]; if(reg&&reg.active) pynCancel(id); else PYN_REG[id].onCancel(); }
function pynCancel(id){
  openConfirm({icon:'back',title:'Batalkan Penyesuaian',text:'Buang semua perubahan penyesuaian yang belum disimpan?',
    onYes:()=>{ pynExit(id); toast('Penyesuaian dibatalkan','ok'); }});
}
function pynSave(id){
  const reg=PYN_REG[id]; const w=reg.work; if(!w) return;
  let total=0; const keys=new Set();
  for(const g of w.groups){
    if(!(g.title||'').trim()){ toast('Nama kelompok tidak boleh kosong','warn'); return; }
    for(const f of g.fields){
      if(!(f.label||'').trim()){ toast('Nama field tidak boleh kosong','warn'); return; }
      if(f.type==='select' && (!Array.isArray(f.options)||f.options.length===0)){ toast('Field pilihan "'+f.label+'" harus punya minimal 1 opsi','warn'); return; }
      if(keys.has(f.key)){ toast('Terdapat field ganda — periksa kembali','warn'); return; }
      keys.add(f.key); total++;
    }
  }
  if(total===0){ toast('Minimal harus ada satu field','warn'); return; }
  for(const rk of (reg.lockedKeys||[])){ if(!keys.has(rk)){ toast('Field wajib tidak boleh dihapus','warn'); return; } }
  openConfirm({icon:'save',title:'Simpan Penyesuaian',text:'Terapkan & simpan tata letak form ini? Perubahan berlaku pada form input, detail, template & ekspor Excel.',
    onYes:()=>{ const schema=pynFlatten(w); pynApplySchema(reg,schema); pynPersist(reg,schema); toast('Penyesuaian form berhasil disimpan','ok'); pynExit(id); }});
}

/* ---- Ikon editor ---- */
const PYN_ICON_GRP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>';
const PYN_ICON_TRASH='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
const PYN_ICON_PLUS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>';
const PYN_ICON_RESET='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';
const PYN_ICON_GRIP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>';
const PYN_TYPE_LABEL={text:'Teks',num:'Angka',date:'Tanggal',select:'Pilihan'};
function pynTypeOpts(t){ return ['text','num','date','select'].map(x=>`<option value="${x}"${x===t?' selected':''}>${PYN_TYPE_LABEL[x]}</option>`).join(''); }
function pynColsOpts(c){ let o=''; for(let i=1;i<=PYN_COLS_MAX;i++){ o+=`<option value="${i}"${i===c?' selected':''}>${i} Kolom</option>`; } return o; }

/* ---- Render editor generik ---- */
let PYN_CUR=null; // id form yang sedang diedit (untuk handler drag)
function pynRender(id){
  const reg=PYN_REG[id]; PYN_CUR=id;
  const cont=document.getElementById(reg.fieldsContId); if(!cont||!reg.work) return;
  const lockedKeys=reg.lockedKeys||[];
  let html=`<div class="pyn-help">Atur <b>jumlah kolom</b> tiap bidang (1–5), ubah <b>nama field</b>, <b>lebar field (px)</b>, <b>nama kelompok</b>, ubah <b>urutan</b> dengan <b>menyeret</b> ikon ⠿ (bisa antar-kelompok), serta <b>hapus/tambah</b> field & kelompok. Field bertanda 🔒 wajib. Kosongkan lebar px agar field mengikuti jumlah kolom bidang.</div>`;
  html+=`<div class="pyn-toolbar">
    <button class="pyn-tool" onclick="pynAddGroup('${id}')">${PYN_ICON_PLUS} Tambah Kelompok</button>
    <button class="pyn-tool" onclick="pynResetDefault('${id}')">${PYN_ICON_RESET} Kembalikan ke Default</button>
  </div>`;
  reg.work.groups.forEach((g,gi)=>{
    const groupHasLocked=g.fields.some(f=>lockedKeys.includes(f.key));
    const cols=pynGroupCols(g);
    html+=`<div class="pyn-group">
      <div class="pyn-group-head">
        ${PYN_ICON_GRP}
        <input class="pyn-gtitle" value="${pynEsc(g.title)}" oninput="pynSetGroupTitle('${id}',${gi},this.value)" placeholder="Nama Kelompok Field">
        ${g.pnw?'<span class="pyn-type" title="Kelompok data per penyedia">per penyedia</span>':''}
        <span class="pyn-cols">Kolom <select onchange="pynSetCols('${id}',${gi},this.value)">${pynColsOpts(cols)}</select></span>
        <span class="pyn-count">${g.fields.length} field</span>
        ${groupHasLocked?'':`<button class="pyn-gdel" title="Hapus Kelompok" onclick="pynDeleteGroup('${id}',${gi})">${PYN_ICON_TRASH}</button>`}
      </div>
      <div class="pyn-fields${g.fields.length?'':' empty-drop'}" data-gi="${gi}"
           ondragover="pynDragOver(event,${gi})" ondrop="pynDrop(event,${gi})" ondragleave="pynDragLeave(event)">`;
    g.fields.forEach((f,fi)=>{
      const locked=lockedKeys.includes(f.key);
      const isCustom=!!f.custom;
      const wpx=fieldWidthPx(f);
      html+=`<div class="pyn-field" draggable="true" data-gi="${gi}" data-fi="${fi}"
              ondragstart="pynDragStart(event,${gi},${fi})" ondragend="pynDragEnd(event)"
              ondragover="pynFieldDragOver(event,${gi},${fi})" ondrop="pynDrop(event,${gi},${fi})">
        <div class="pyn-frow">
        <span class="pyn-grip" title="Seret untuk memindahkan / mengubah urutan">${PYN_ICON_GRIP}</span>
        <input class="pyn-label" id="pyn-lbl-${id}-${gi}-${fi}" value="${pynEsc(f.label)}" oninput="pynSetLabel('${id}',${gi},${fi},this.value)" placeholder="Nama Field">
        <span class="pyn-pxwrap">Lebar <input class="pyn-pxw" type="number" min="0" step="10" value="${wpx!=null?wpx:''}" placeholder="auto" oninput="pynSetWidthPx('${id}',${gi},${fi},this.value)"> px</span>
        ${isCustom
          ? `<select class="pyn-typesel" onchange="pynSetType('${id}',${gi},${fi},this.value)">${pynTypeOpts(f.type)}</select>`
          : `<span class="pyn-type">${PYN_TYPE_LABEL[f.type]||f.type}</span>`}
        ${(isCustom&&f.type==='select')
          ? `<input class="pyn-opts" value="${pynEsc((f.options||[]).join(', '))}" oninput="pynSetOptions('${id}',${gi},${fi},this.value)" placeholder="Opsi (pisah dengan koma)">`
          : ''}
        ${isCustom?`<span class="pyn-custom-badge">baru</span>`:''}
        ${locked
          ? `<span class="pyn-lock" title="Field wajib">🔒</span>`
          : ``}
        </div>
      </div>`;
    });
    html+=`</div>
    </div>`;
  });
  cont.innerHTML=html;
}

/* ---- Handler editor generik ---- */
function pynWork(id){ return PYN_REG[id].work; }
function pynSetGroupTitle(id,gi,val){ pynWork(id).groups[gi].title=val; }
function pynSetCols(id,gi,val){ let c=parseInt(val,10); if(isNaN(c)||c<1)c=1; if(c>PYN_COLS_MAX)c=PYN_COLS_MAX; pynWork(id).groups[gi].cols=c; }
function pynSetLabel(id,gi,fi,val){ pynWork(id).groups[gi].fields[fi].label=val; }
function pynSetWidthPx(id,gi,fi,val){ const f=pynWork(id).groups[gi].fields[fi]; const w=parseInt(val,10); if(isNaN(w)||w<=0) delete f.widthPx; else f.widthPx=w; }
function pynSetType(id,gi,fi,val){ const f=pynWork(id).groups[gi].fields[fi]; f.type=val; if(val==='select'&&!Array.isArray(f.options)) f.options=[]; if(val!=='select') delete f.options; pynRender(id); }
function pynSetOptions(id,gi,fi,val){ pynWork(id).groups[gi].fields[fi].options = val.split(',').map(s=>s.trim()).filter(Boolean); }
function pynAddField(id,gi){
  const key='custom_'+Date.now().toString(36)+Math.floor(Math.random()*1000).toString(36);
  pynWork(id).groups[gi].fields.push({key,label:'',type:'text',custom:true});
  const fi=pynWork(id).groups[gi].fields.length-1;
  pynRender(id);
  setTimeout(()=>{ const el=document.getElementById(`pyn-lbl-${id}-${gi}-${fi}`); if(el) el.focus(); },0);
}
function pynDeleteField(id,gi,fi){
  const reg=PYN_REG[id]; const f=pynWork(id).groups[gi].fields[fi];
  if((reg.lockedKeys||[]).includes(f.key)){ toast('Field wajib tidak dapat dihapus','warn'); return; }
  openConfirm({icon:'del',title:'Hapus Field',text:`Hapus field "${f.label||'(tanpa nama)'}" dari form? Data yang sudah tersimpan tidak akan hilang.`,
    onYes:()=>{ pynWork(id).groups[gi].fields.splice(fi,1); pynRender(id); }});
}
function pynAddGroup(id){ pynWork(id).groups.push({title:'Kelompok Baru', cols:3, fields:[]}); pynRender(id); window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}); }
function pynDeleteGroup(id,gi){
  const reg=PYN_REG[id]; const g=pynWork(id).groups[gi];
  if(g.fields.some(f=>(reg.lockedKeys||[]).includes(f.key))){ toast('Kelompok berisi field wajib — tidak dapat dihapus','warn'); return; }
  openConfirm({icon:'del',title:'Hapus Kelompok',text:`Hapus kelompok "${g.title||'(tanpa nama)'}" beserta ${g.fields.length} field di dalamnya?`,
    onYes:()=>{ pynWork(id).groups.splice(gi,1); pynRender(id); }});
}
function pynResetDefault(id){
  const reg=PYN_REG[id];
  openConfirm({icon:'back',title:'Kembalikan ke Default',text:'Kembalikan seluruh field & kelompok ke tata letak awal? (Baru tersimpan setelah Anda klik Simpan Penyesuaian.)',
    onYes:()=>{ reg.work=pynBuildWork(JSON.parse(JSON.stringify(reg.base))); pynRender(id); toast('Dikembalikan ke default — jangan lupa Simpan','ok'); }});
}

/* ---- DRAG & DROP untuk urutan field (juga antar-kelompok) ---- */
let PYN_DRAG=null; // {gi,fi}
function pynDragStart(ev,gi,fi){ PYN_DRAG={gi,fi}; ev.dataTransfer.effectAllowed='move'; try{ev.dataTransfer.setData('text/plain',gi+':'+fi);}catch(e){} const el=ev.currentTarget; setTimeout(()=>el.classList.add('dragging'),0); }
function pynDragEnd(ev){ PYN_DRAG=null; document.querySelectorAll('.pyn-field.dragging').forEach(e=>e.classList.remove('dragging')); document.querySelectorAll('.pyn-field.drop-before,.pyn-field.drop-after').forEach(e=>e.classList.remove('drop-before','drop-after')); document.querySelectorAll('.pyn-fields.drag-over').forEach(e=>e.classList.remove('drag-over')); }
function pynFieldDragOver(ev,gi,fi){
  if(!PYN_DRAG) return; ev.preventDefault(); ev.stopPropagation(); ev.dataTransfer.dropEffect='move';
  const el=ev.currentTarget; const r=el.getBoundingClientRect(); const after=(ev.clientY-r.top)>r.height/2;
  el.classList.toggle('drop-after',after); el.classList.toggle('drop-before',!after);
}
function pynDragOver(ev,gi){ if(!PYN_DRAG) return; ev.preventDefault(); ev.dataTransfer.dropEffect='move'; const cont=ev.currentTarget; if(cont.classList.contains('pyn-fields')) cont.classList.add('drag-over'); }
function pynDragLeave(ev){ const cont=ev.currentTarget; cont.classList&&cont.classList.remove('drag-over'); }
function pynDrop(ev,gi,fi){
  if(!PYN_DRAG) return; ev.preventDefault(); ev.stopPropagation();
  const id=PYN_CUR; const w=pynWork(id); if(!w) return;
  const src=PYN_DRAG; const from=w.groups[src.gi]; if(!from) { pynDragEnd(ev); return; }
  const moved=from.fields[src.fi]; if(!moved){ pynDragEnd(ev); return; }
  // tentukan indeks target
  let targetGi=gi, targetFi;
  if(fi==null){ targetFi=w.groups[targetGi].fields.length; } // drop di area kosong -> akhir
  else{
    const el=ev.currentTarget && ev.currentTarget.classList.contains('pyn-field')?ev.currentTarget:null;
    let after=false;
    if(el){ const r=el.getBoundingClientRect(); after=(ev.clientY-r.top)>r.height/2; }
    targetFi=fi+(after?1:0);
  }
  // hapus dari sumber
  from.fields.splice(src.fi,1);
  // koreksi indeks bila sumber & target grup sama dan penghapusan menggeser posisi
  if(src.gi===targetGi && src.fi<targetFi) targetFi--;
  const to=w.groups[targetGi];
  if(targetFi<0)targetFi=0; if(targetFi>to.fields.length)targetFi=to.fields.length;
  to.fields.splice(targetFi,0,moved);
  PYN_DRAG=null;
  pynRender(id);
}

/* ============================================================
   REGISTRASI PENYESUAIAN untuk KR (SPBJ), PL, dan TENDER
   Dipanggil saat INIT (setelah seluruh definisi FIELDS/GROUPS ada).
   ============================================================ */
function pynRegisterAll(){
pynRegister({
  id:'kr', label:'SPBJ / Kontrak Rinci', storeKey:'kr_schema_v1',
  fields:FIELDS, groups:GROUPS, base:KR_SCHEMA_BASE,
  lockedKeys:['jenis_anggaran','bidang_pelaksana'],
  titleId:'input-title', bannerId:'edit-banner', bannerTextId:'edit-banner-text',
  btnId:'btn-penyesuaian-kr', fieldsContId:'work-form-fields',
  saveLabelId:'btn-simpan-kr-label', cancelLabelId:'btn-batal-kr-label', cancelDefault:'Batal',
  rebuild:buildFormKr,
  onSave:askSave, onCancel:askCancel,
  afterExit:()=>{
    const bn=document.getElementById('edit-banner');
    if(editingId){
      const rec=records.find(r=>r.id===editingId);
      document.getElementById('input-title').textContent='Ubah Data Pekerjaan';
      bn.style.display='flex';
      document.getElementById('edit-banner-text').textContent='Mode Ubah Data';
      if(rec) fillForm(rec);
    }else{
      document.getElementById('input-title').textContent='Input Kontrak Rinci';
      bn.style.display='none';
    }
  }
});
pynRegister({
  id:'pl', label:'Pengadaan Langsung', storeKey:'pl_schema_v1',
  fields:FIELDS_PL, groups:GROUPS_PL, base:PL_SCHEMA_BASE,
  lockedKeys:['nama_pekerjaan','bidang_pelaksana'],
  titleId:'input-pl-title', bannerId:'edit-banner-pl', bannerTextId:'edit-banner-pl-text',
  btnId:'btn-penyesuaian-pl', fieldsContId:'form-pl-fields',
  saveLabelId:'btn-simpan-pl-label', cancelLabelId:'btn-batal-pl-label', cancelDefault:'Batal',
  rebuild:buildFormPl,
  onSave:askSavePl, onCancel:askCancelPl,
  afterExit:()=>{
    const bn=document.getElementById('edit-banner-pl');
    if(editingIdPl){
      const rec=records_pl.find(r=>r.id===editingIdPl);
      document.getElementById('input-pl-title').textContent='Ubah Data Pekerjaan';
      bn.style.display='flex';
      document.getElementById('edit-banner-pl-text').textContent='Mode Ubah Data';
      if(rec) fillFormPl(rec);
    }else{
      document.getElementById('input-pl-title').textContent='Input Pekerjaan';
      bn.style.display='none';
    }
  }
});
pynRegister({
  id:'tender', label:'Tender', storeKey:'tender_schema_v1',
  fields:FIELDS_TENDER, groups:GROUPS_TENDER, base:TENDER_SCHEMA_BASE,
  lockedKeys:['nama_pekerjaan','bidang_pelaksana'],
  titleId:'input-tender-title', bannerId:'edit-banner-tender', bannerTextId:'edit-banner-tender-text',
  btnId:'btn-penyesuaian-tender', fieldsContId:'form-tender-fields',
  saveLabelId:'btn-simpan-tender-label', cancelLabelId:'btn-batal-tender-label', cancelDefault:'Batal',
  rebuild:()=>{ buildFormTender(); applyLocksTender(); },
  onSave:askSaveTender, onCancel:askCancelTender,
  afterExit:()=>{
    const bn=document.getElementById('edit-banner-tender');
    if(editingIdTender){
      const rec=records_tender.find(r=>r.id===editingIdTender);
      document.getElementById('input-tender-title').textContent='Ubah Data Pekerjaan';
      bn.style.display='flex';
      document.getElementById('edit-banner-tender-text').textContent='Mode Ubah Data';
      if(rec) fillFormTender(rec);
    }else{
      document.getElementById('input-tender-title').textContent='Input Pekerjaan Tender';
      bn.style.display='none';
    }
  }
});
} /* akhir pynRegisterAll */

/* ---- Wrapper kompatibilitas (dipakai onclick HTML & boot) ---- */
function startPenyesuaianPl(){ pynStart('pl'); }
function exitPenyesuaianPl(){ pynExit('pl'); }
function plSimpanClick(){ pynSimpanClick('pl'); }
function plBatalClick(){ pynBatalClick('pl'); }
function applySavedSchemaPl(){ pynApplySaved(PYN_REG.pl); }
function startPenyesuaianKr(){ pynStart('kr'); }
function exitPenyesuaianKr(){ pynExit('kr'); }
function krSimpanClick(){ pynSimpanClick('kr'); }
function krBatalClick(){ pynBatalClick('kr'); }
function applySavedSchemaKr(){ pynApplySaved(PYN_REG.kr); }
function startPenyesuaianTender(){ pynStart('tender'); }
function exitPenyesuaianTender(){ pynExit('tender'); }
function tenderSimpanClick(){ pynSimpanClick('tender'); }
function tenderBatalClick(){ pynBatalClick('tender'); }
function applySavedSchemaTender(){ pynApplySaved(PYN_REG.tender); }

/* ---- Detail (Lihat) PL — menampilkan SELURUH field ---- */
function viewRecordPl(rid){
  const rec=records_pl.find(r=>r.id===rid); if(!rec) return;
  let html='';
  GROUPS_PL.forEach(g=>{
    let rows='';
    g.keys.forEach(k=>{
      const f=FIELDS_PL.find(x=>x.key===k);
      if(isIndepKeyPl(k)){
        const list=(Array.isArray(rec[k+'_list'])&&rec[k+'_list'].length)?rec[k+'_list']:((rec[k]!=null&&rec[k]!=='')?[rec[k]]:[]);
        const shown=list.filter(x=>x!=null&&x!=='');
        const dv=shown.length ? (shown.length>1 ? shown.map((v,i)=>`<span class="stack-line"><b class="stack-no">${i+1}.</b> ${v}</span>`).join('') : shown[0]) : '—';
        rows+=`<div class="detail-row"><span class="dk">${f.label}</span><span class="dv">${dv}</span></div>`;
      }else{
        rows+=`<div class="detail-row"><span class="dk">${f.label}</span><span class="dv">${fmtMulti(rec[k],f.type)||'—'}</span></div>`;
      }
    });
    html+=detailGroupHTML(g.title, rows);
  });
  document.getElementById('detail-title').textContent='Detail Pekerjaan';
  document.getElementById('detail-body').innerHTML=html;
  withQuickLoader('Memuat', ()=>document.getElementById('detail-overlay').classList.add('show'));
}

/* ---- Pills status PL ---- */
function tahapanPill(s){
  if(!s) return '—';
  /* "Tandatangan Kontrak" berwarna sendiri (biru) & sengaja dipecah 2 baris
     lewat <br>: sel tabel ber-white-space:nowrap sehingga pemenggalan otomatis
     tidak jalan; .pill-ttd di style.css mengembalikan white-space:normal. */
  if(s==='Tandatangan Kontrak')
    return '<span class="pill pill-ttd">Tandatangan<br>Kontrak</span>';
  const cls = (s==='Terkontrak') ? 'pill-kontrak'
            : (s==='Gagal/Batal') ? 'pill-batal' : 'pill-prog';
  return `<span class="pill ${cls}">${s}</span>`;
}
function mkPill(s){
  if(s==='Sudah') return '<span class="pill pill-kontrak">Sudah</span>';
  if(s==='Belum') return '<span class="pill pill-prog">Belum</span>';
  return s||'—';
}

/* ---- Tabel PL ---- */
function getFilteredRecordsPl(){
  const fb=document.getElementById('filter-pl-bidang').value;
  const ftp=document.getElementById('filter-pl-tahapan').value;
  const fyr=document.getElementById('filter-pl-tahun')?.value||'';
  const fs=document.getElementById('filter-pl-search').value.toLowerCase().trim();
  return records_pl.filter(r=>{
    if(fb && r.bidang_pelaksana!==fb) return false;
    if(!matchTahapanFilter(r.tahapan, ftp)) return false;
    if(fyr && yearOf(r, r.tgl_awal_kontrak)!==fyr) return false;
    if(fs){
      const hay=[r.nama_pekerjaan,r.no_kontrak,r.perusahaan,r.no_prk,r.no_eproc,r.no_nota_dinas].join(' ').toLowerCase();
      if(!hay.includes(fs)) return false;
    }
    return true;
  }).sort(makeWorkComparator(
    r=>yearOf(r, r.tgl_awal_kontrak),
    r=>!!String(r.no_kontrak||'').trim(),
    r=>r.tgl_awal_kontrak
  ));
}
let currentPagePl=1;
function renderTablePl(){
  let rows=getFilteredRecordsPl();
  const total=rows.length;
  const cEl=document.getElementById('list-pl-count'); if(cEl) cEl.textContent=total;
  const tb=document.getElementById('table-pl-body');
  const pg=document.getElementById('pagination-pl');
  if(!tb) return;
  if(total===0){
    tb.innerHTML=`<tr><td colspan="10"><div class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
      <div>Data tidak tersedia</div>
    </div></td></tr>`;
    if(pg) pg.innerHTML='';
    return;
  }
  const totalPages=Math.max(1,Math.ceil(total/PAGE_SIZE));
  if(currentPagePl>totalPages) currentPagePl=totalPages;
  if(currentPagePl<1) currentPagePl=1;
  const start=(currentPagePl-1)*PAGE_SIZE;
  const pageRows=rows.slice(start,start+PAGE_SIZE);

  tb.innerHTML=pageRows.map((r,i)=>`
    <tr>
      <td class="col-no">${start+i+1}</td>
      <td class="wrap-cell col-nama-freeze">${r.nama_pekerjaan||'—'}</td>
      <td class="col-kontrak">${r.no_kontrak||'—'}</td>
      <td class="cell-center col-date">${fmtDate(r.tgl_awal_kontrak)||'—'}</td>
      <td class="cell-center col-date">${fmtDate(r.tgl_akhir_kontrak)||'—'}</td>
      <td class="col-bidang">${r.bidang_pelaksana||'—'}</td>
      <td class="col-penyedia">${r.perusahaan||'—'}</td>
      <td class="col-nilai">${rupiah(r.kontrak_total_dengan_ppn)||'—'}</td>
      <td class="cell-center">${tahapanPill(r.tahapan)}</td>
      <td>
        <div class="action-cell">
          ${isAdmin()?`<button class="act act-edit" title="Ubah" onclick="editRecordPl('${r.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
          </button>`:''}
          <button class="act act-view" title="Lihat" onclick="viewRecordPl('${r.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          ${isAdmin()?`<button class="act act-del" title="Hapus" onclick="askDeletePl('${r.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>`:''}
        </div>
      </td>
    </tr>`).join('');

  revealTbody(tb);
  renderPaginationPl(currentPagePl,totalPages);
}
function renderPaginationPl(page,totalPages){
  const el=document.getElementById('pagination-pl');
  if(!el) return;
  if(totalPages<=1){ el.innerHTML=''; return; }
  const want=new Set([1,totalPages,page-1,page,page+1]);
  const list=[...want].filter(p=>p>=1&&p<=totalPages).sort((a,b)=>a-b);
  let html=`<button class="pg-btn" ${page===1?'disabled':''} onclick="goToPagePl(${page-1})">‹ Sebelumnya</button>`;
  let prev=0;
  list.forEach(p=>{
    if(p-prev>1) html+=`<span class="pg-ellipsis">…</span>`;
    html+=`<button class="pg-btn pg-num ${p===page?'active':''}" onclick="goToPagePl(${p})">${p}</button>`;
    prev=p;
  });
  html+=`<button class="pg-btn" ${page===totalPages?'disabled':''} onclick="goToPagePl(${page+1})">Berikutnya ›</button>`;
  el.innerHTML=html;
}
function goToPagePl(p){ currentPagePl=p; withQuickLoader('Memuat', ()=>{ renderTablePl(); document.querySelector('#view-list-pl .panel').scrollIntoView({behavior:'smooth',block:'nearest'}); }, 550); }
function resetFiltersPl(){
  ['filter-pl-bidang','filter-pl-tahapan','filter-pl-tahun','filter-pl-search'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  currentPagePl=1; renderTablePl();
}

/* ---- Template & Export & Upload Excel PL ---- */
async function downloadTemplatePl(){
  if(!requireInput()) return;
  if(!window.ExcelJS){ toast('Library Excel belum termuat, coba lagi','warn'); return; }
  const COLS = orderedFields(FIELDS_PL, GROUPS_PL);
  const OPSI={}; COLS.forEach(f=>{ if(f.type==='select') OPSI[f.key]=f.options; });

  const wb=new ExcelJS.Workbook();
  const dropKeys=Object.keys(OPSI);
  const colLetter=n=>{ let s=''; while(n>0){ const m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=(n-m-1)/26; } return s; };
  const opsiRange={};
  dropKeys.forEach((k,ci)=>{ const L=colLetter(ci+1); opsiRange[k]=`Opsi!$${L}$2:$${L}$${OPSI[k].length+1}`; });

  const wsD=wb.addWorksheet('Data');
  wsD.addRow(COLS.map(f=>f.label));
  wsD.columns=COLS.map(f=>({width:Math.max(16,f.label.length+2)}));
  const thin={style:'thin',color:{argb:'FFBFCAD0'}};
  const allBorder={top:thin,left:thin,bottom:thin,right:thin};
  const headRow=wsD.getRow(1); headRow.height=32;
  for(let c=1;c<=COLS.length;c++){
    const cell=wsD.getCell(1,c);
    cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0E7C86'}};
    cell.font={bold:true,color:{argb:'FFFFFFFF'},size:11};
    cell.alignment={wrapText:true,vertical:'middle',horizontal:'center'};
    cell.border=allBorder;
  }
  for(let r=2;r<=251;r++){ for(let c=1;c<=COLS.length;c++){ const cell=wsD.getCell(r,c); cell.border=allBorder; cell.alignment={vertical:'middle'}; if(r%2===1) cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF2F7F8'}}; } }
  COLS.forEach((f,idx)=>{ const c=idx+1;
    if(f.type==='date'){ for(let r=2;r<=251;r++) wsD.getCell(r,c).numFmt='dd/mm/yyyy'; }
    if(f.type==='num'){ for(let r=2;r<=251;r++){ wsD.getCell(r,c).numFmt=ACCT_NODEC; wsD.getCell(r,c).alignment={vertical:'middle',horizontal:'right'}; } }
    if(isForceTextKey(f.key)){ for(let r=2;r<=251;r++) wsD.getCell(r,c).numFmt='@'; }
  });
  // #12: Harga Total (Tanpa PPN) diisi manual sebagai nilai (tanpa rumus). Format currency Rupiah tanpa desimal sudah diterapkan di atas.

  const wsO=wb.addWorksheet('Opsi');
  dropKeys.forEach((k,ci)=>{ const f=COLS.find(x=>x.key===k); wsO.getCell(1,ci+1).value=f.label; OPSI[k].forEach((v,ri)=>wsO.getCell(ri+2,ci+1).value=v); });
  wsO.state='hidden';

  const ROWS=250;
  COLS.forEach((f,idx)=>{ if(!OPSI[f.key]) return; const L=colLetter(idx+1);
    for(let r=2;r<=ROWS+1;r++){ wsD.getCell(`${L}${r}`).dataValidation={type:'list',allowBlank:true,formulae:[opsiRange[f.key]],showErrorMessage:true,errorTitle:'Pilihan tidak valid',error:'Silakan pilih salah satu nilai dari daftar dropdown.'}; }
  });

  const wsG=wb.addWorksheet('Petunjuk');
  wsG.columns=[{width:30},{width:80}];
  [['PETUNJUK PENGISIAN — PENGADAAN LANGSUNG',''],['',''],
   ['Tahun','WAJIB diisi pada setiap baris. Bila ada satu baris saja yang kosong, seluruh berkas ditolak.'],
   ['No. Kontrak','Tidak boleh kembar — baris dengan nomor yang sama ditolak. Boleh dikosongkan bila kontrak belum terbit (tanda "-" juga dianggap kosong).'],
   ['Bidang Pelaksana','Pilih dari dropdown (7 bidang)'],
   ['Level Risiko / Level Risiko (CSMS)','Pilih dari dropdown: Tidak Ada s/d Ekstrem'],
   ['Jenis Anggaran','Pilih: Operasi / Investasi'],
   ['Jenis Pengadaan','Pilih: Barang / Jasa Lainnya / Jasa Konsultansi / Pekerjaan Konstruksi'],
   ['Jenis Perjanjian/Kontrak','Pilih: Lumsum / Turn Key'],
   ['Bidang / Sub Bidang','Isi bidang/sub bidang. Untuk lebih dari satu, pisahkan tiap isian dengan baris baru (Alt+Enter) dalam satu sel.'],
   ['Tahapan/Proses','Pilih: Penyusunan HPS / Proses Pengadaan / Tandatangan Kontrak / Terkontrak / Gagal/Batal'],
   ['Kendala & Tindak Lanjut','Diisi hanya bila Tahapan/Proses = Gagal/Batal'],
   ['Harga Total (Tanpa PPN)','Terisi otomatis = Harga Barang + Harga Jasa (jangan diedit manual)'],
   ['Jenis Dokumen (CSMS)','Pilih: Sertifikat / Berita Acara'],
   ['Negosiasi Jangka Waktu Pelaksanaan','Isi jangka waktu yang disepakati dalam HARI. Boleh "60" atau "60 hari kalender" \u2014 angka diambil dari kata pertama.'],
   ['Tgl. Akhir Kontrak','Terisi otomatis = Tgl. Awal Kontrak + Negosiasi Jangka Waktu Pelaksanaan (sel abu-abu, jangan diedit manual).'],
   ['Tgl. Berakhir (CSMS)','Terisi otomatis = Tgl. Terbit (CSMS) + 3 tahun kalender (sel abu-abu, jangan diedit manual).'],
   ['Manajemen Kontrak','Pilih: Sudah / Belum'],
   ['Format Tanggal','Kolom tanggal berformat dd/mm/yyyy (mis. 31/01/2025).'],
   ['Nilai/Harga','Kolom nilai berformat Rupiah. Ketik angka saja (mis. 100000000).'],
   ['','Isi data mulai baris ke-2. Jangan menghapus sheet "Opsi".'],
  ].forEach(r=>wsG.addRow(r));
  wsG.getCell('A1').font={bold:true,size:14,color:{argb:'FF0E7C86'}};
  for(let r=3;r<=18;r++){ wsG.getCell(`A${r}`).font={bold:true,color:{argb:'FF095E66'}}; }

  // Rapikan: rumus+kunci Total, sorot dropdown, proteksi sheet
  await spkFinishTemplate(wsD, COLS, OPSI, null, ROWS);

  try{
    const buf=await wb.xlsx.writeBuffer();
    const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='Template_Pengadaan_Langsung_UP3_Masohi.xlsx';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }catch(err){ console.error(err); toast('Gagal membuat template: '+errMsg(err),'warn'); }
}

async function exportExcelPl(){
  if(!window.ExcelJS){ toast('Library Excel belum termuat, coba lagi','warn'); return; }
  const COLS = orderedFields(FIELDS_PL, GROUPS_PL);
  const rows=getFilteredRecordsPl();
  if(rows.length===0){ toast('Tidak ada data untuk diekspor','warn'); return; }
  const wb=new ExcelJS.Workbook();
  const ws=wb.addWorksheet('Daftar Pengadaan Langsung');
  ws.addRow(['No', ...COLS.map(f=>f.label)]);
  rows.forEach((r,ri)=>{ ws.addRow([ri+1, ...COLS.map(f=>{ if(isIndepKeyPl(f.key)) return indepCellValuePl(r,f.key); let v=r[f.key]; if(f.auto==='sum'){ const p=f.key.replace(/_total_tanpa_ppn$/,''); const b=Number(r[p+'_harga_barang'])||0, j=Number(r[p+'_harga_jasa'])||0; const t=b+j; return t>0?t:''; } if(f.auto==='ppn'){ const p=f.key.replace(/_total_dengan_ppn$/,''); const b=Number(r[p+'_harga_barang'])||0, j=Number(r[p+'_harga_jasa'])||0; const t=b+j; return t>0?ppnFromBase(t):''; } if(v===''||v==null) return ''; if(f.type==='num') return Number(v); if(f.type==='date') return fmtDate(v); return v; })]); });
  autoLayoutSheet(ws, [{key:'__no__',label:'No',type:'no'}, ...COLS], rows.length, {
    topAlign: (f)=> isIndepKeyPl(f.key)
  });
  try{
    const buf=await wb.xlsx.writeBuffer();
    const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='Daftar_Pengadaan_Langsung_UP3_Masohi.xlsx';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }catch(err){ console.error(err); toast('Gagal export Excel: '+errMsg(err),'warn'); }
}

function handleUploadPl(ev){
  if(!requireInput()){ ev.target.value=''; return; }
  const file=ev.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=async e=>{
    try{
      const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});
      const sheetName=wb.SheetNames.includes('Data') ? 'Data' : wb.SheetNames[0];
      const ws=wb.Sheets[sheetName];
      const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      if(rows.length<2){ toast('File kosong / tidak ada data','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      const head=rows[0].map(h=>String(h).trim());
      const map={};
      head.forEach((h,i)=>{ const f=FIELDS_PL.find(x=>x.label.toLowerCase()===h.toLowerCase()); if(f)map[f.key]=i; });
      if(Object.keys(map).length===0){ toast('Header tidak dikenali. Gunakan template Pengadaan Langsung.','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      const batch=[];
      for(let r=1;r<rows.length;r++){
        const row=rows[r]; if(!row || row.every(c=>String(c).trim()===''))continue;
        const rec={};
        let fmtBad=false; const fmtBadCells=[];
        FIELDS_PL.forEach(f=>{
          const raw=map[f.key]!=null ? row[map[f.key]] : '';
          const c=coerceCell(f,raw);
          if(!c.ok){ fmtBad=true; fmtBadCells.push({label:f.label,val:raw,col:(map[f.key]!=null?spkColLetterTpl(map[f.key]+1):'?')}); }
          rec[f.key]=c.value;
        });
        if(fmtBad){
          const xlRow=r+1;
          console.warn('[SPK] Upload Pengadaan Langsung — Format Tidak Sesuai di baris '+xlRow+':', fmtBadCells);
          toast(spkFmtBadMsg(fmtBadCells, xlRow),'err', TOAST_MS_UPLOAD);
          ev.target.value=''; return;
        }
        // #12: pastikan Harga Total (Tanpa PPN) = Harga Barang + Harga Jasa
        FIELDS_PL.forEach(f=>{ if(f.auto==='sum'){ const p=f.key.replace(/_total_tanpa_ppn$/,''); const b=Number(rec[p+'_harga_barang'])||0, j=Number(rec[p+'_harga_jasa'])||0; rec[f.key]=(b+j)>0?(b+j):''; } });
        // Harga Total (Dengan PPN) = Harga Total (Tanpa PPN) × 111%
        FIELDS_PL.forEach(f=>{ if(f.auto==='ppn'){ const base=Number(rec[f.key.replace(/_total_dengan_ppn$/,'_total_tanpa_ppn')])||0; rec[f.key]=base>0?ppnFromBase(base):''; } });
        // Field multi-nilai independen: pecah baris (Alt+Enter dalam satu sel) menjadi daftar
        INDEP_MULTI_KEYS_PL.forEach(k=>{ const raw=String(rec[k]!=null?rec[k]:''); const list=raw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean); rec[k+'_list']=list; rec[k]=list[0]||''; });
        if(!String(rec.tahun||'').trim()){ const xlRow=r+1; console.warn('[SPK] Upload Pengadaan Langsung — kolom Tahun kosong di baris '+xlRow); toast(spkMissingMsg(['tahun'], map, FIELDS_PL, xlRow),'warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
        { const miss=missingRequiredPl(rec); if(miss.length){ const xlRow=r+1; console.warn('[SPK] Upload Pengadaan Langsung — kolom wajib kosong di baris '+xlRow+':', miss); toast(spkMissingMsg(miss, map, FIELDS_PL, xlRow),'warn', TOAST_MS_UPLOAD); ev.target.value=''; return; } }
        rec.__xlRow = r+1;   // nomor baris di Excel, dipakai pesan duplikat
        batch.push(rec);
      }
      if(batch.length===0){ toast('Tidak ada baris data untuk diimpor','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      const DUPOPT_K={nomor:'no_kontrak', labelNomor:'No. Kontrak', nama:['nama_pekerjaan']};
      const _sar=spkDupSaring(batch, records_pl, DUPOPT_K);
      const toAdd=_sar.toAdd, dupRows=_sar.dupRows;
      const dupCount=dupRows.length;
      if(dupCount) console.warn('[SPK] Upload Pengadaan Langsung — baris dilewati (duplikat Nama Pekerjaan / No. Kontrak):', dupRows);
      if(toAdd.length){
        try{ await Store_PL.bulkCreate(toAdd); }
        catch(err){ console.error(err); toast('Gagal mengimpor: '+errMsg(err),'warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
        await refreshDataPl();
      }
      toast(spkImporMsg(toAdd.length, dupCount), spkImporTone(toAdd.length, dupCount), TOAST_MS_UPLOAD);
      // Data berhasil ditambahkan lewat template → langsung tampilkan loading &
      // kembali ke Daftar Monitoring Pengadaan Langsung.
      if(toAdd.length){ ev.target.value=''; showView('list-pl','Memuat daftar'); return; }
    }catch(err){ console.error(err); toast('Gagal membaca file Excel','warn', TOAST_MS_UPLOAD); }
    ev.target.value='';
  };
  reader.readAsArrayBuffer(file);
}

/* ============ TOAST ============ */
let toastT;
/* Durasi tampil notifikasi (ms). Peringatan gagal unggah template dibuat lebih
   lama karena isinya perlu dibaca: nomor baris, nama kolom, atau daftar baris
   duplikat. toast(msg, kind, dur) menerima durasi khusus per pemanggilan. */
const TOAST_MS_DEFAULT = 2800;
const TOAST_MS_UPLOAD  = 5000;
/* ============================================================
   BUNYI NOTIFIKASI (Web Audio API — tanpa file audio eksternal)
   Nada dibangkitkan langsung oleh browser, jadi tidak ada aset yang perlu
   diunduh dan tidak menambah waktu muat.

   Dipasang di dalam toast(), sehingga SEMUA notifikasi yang sudah ada ikut
   berbunyi sesuai jenisnya — termasuk berhasil/gagal upload dan berhasil/gagal
   simpan data — tanpa perlu menyentuh 353 pemanggilan toast() satu per satu.

     ok   -> dua nada naik (C6→E6), terdengar "selesai"
     warn -> satu nada sedang, menahan perhatian
     err  -> dua nada turun (A4→D4), terdengar "gagal"

   Browser melarang audio berbunyi sebelum pengguna berinteraksi dengan halaman
   (autoplay policy). AudioContext karena itu dibuat SAAT DIBUTUHKAN, bukan saat
   halaman dimuat, lalu dipakai ulang. Bila masih 'suspended' (mis. notifikasi
   muncul sebelum ada klik), resume() dipanggil dan kegagalannya diabaikan —
   notifikasi visual tetap tampil apa pun yang terjadi pada audio. */
const SFX_KEY='fkl_sfx_off';
let _sfxCtx=null;
function sfxEnabled(){ try{ return localStorage.getItem(SFX_KEY)!=='1'; }catch(e){ return true; } }
function sfxSetEnabled(on){
  try{ on ? localStorage.removeItem(SFX_KEY) : localStorage.setItem(SFX_KEY,'1'); }catch(e){}
  if(on) sfxPlay('ok');   // umpan balik langsung saat dinyalakan
}
function sfxToggle(){ const on=!sfxEnabled(); sfxSetEnabled(on); return on; }
/* Satu nada: osilator + amplop naik-turun agar tidak terdengar "klik" di ujungnya. */
function _sfxTone(ctx, freq, startAt, dur, peak){
  const osc=ctx.createOscillator(), gain=ctx.createGain();
  osc.type='sine'; osc.frequency.setValueAtTime(freq, startAt);
  // Amplop: senyap -> peak (attack 12ms) -> meluruh halus ke senyap.
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt+0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt+dur);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(startAt); osc.stop(startAt+dur+0.02);
}
function sfxPlay(kind){
  if(!sfxEnabled()) return;
  try{
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    if(!_sfxCtx) _sfxCtx=new AC();
    const ctx=_sfxCtx;
    if(ctx.state==='suspended') ctx.resume().catch(()=>{});
    const t0=ctx.currentTime+0.01;
    if(kind==='err'){            // turun: A4 -> D4
      _sfxTone(ctx, 440.00, t0,       0.16, 0.16);
      _sfxTone(ctx, 293.66, t0+0.14,  0.30, 0.16);
    }else if(kind==='warn'){     // satu nada sedang
      _sfxTone(ctx, 523.25, t0,       0.20, 0.13);
    }else{                       // ok — naik: C6 -> E6
      _sfxTone(ctx, 1046.50, t0,      0.11, 0.11);
      _sfxTone(ctx, 1318.51, t0+0.10, 0.20, 0.11);
    }
  }catch(e){ /* audio tidak tersedia: notifikasi visual tetap jalan */ }
}

/* --- Nada klik menu ---------------------------------------------------------
   Sangat singkat & pelan: dipicu jauh lebih sering daripada notifikasi, jadi
   sengaja dibuat nyaris tak terasa agar tidak melelahkan di pemakaian harian. */
function sfxClick(){
  if(!sfxEnabled()) return;
  try{
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    if(!_sfxCtx) _sfxCtx=new AC();
    const ctx=_sfxCtx;
    if(ctx.state==='suspended') ctx.resume().catch(()=>{});
    _sfxTone(ctx, 2000, ctx.currentTime+0.005, 0.035, 0.05);
  }catch(e){}
}

/* --- Nada masuk & keluar ----------------------------------------------------
   Mengiringi animasi "Selamat Datang" (playLoginAnim) dan animasi keluar
   (performLogout), yang masing-masing berdurasi ± 1,3 detik. Nadanya dibuat
   lebih panjang & bertingkat daripada nada notifikasi biasa supaya terasa
   sebagai penanda babak, bukan sekadar umpan balik.

     masuk  -> arpeggio NAIK   C5-E5-G5-C6 (terbuka, menyambut)
     keluar -> arpeggio TURUN  C6-G5-E5-C5 (menutup, kebalikannya) */
function sfxSession(kind){
  if(!sfxEnabled()) return;
  try{
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    if(!_sfxCtx) _sfxCtx=new AC();
    const ctx=_sfxCtx;
    if(ctx.state==='suspended') ctx.resume().catch(()=>{});
    const t0=ctx.currentTime+0.02;
    const naik=[523.25, 659.25, 783.99, 1046.50];        // C5 E5 G5 C6
    const nada=(kind==='out')?naik.slice().reverse():naik;
    nada.forEach((f,i)=>{
      const last=(i===nada.length-1);
      _sfxTone(ctx, f, t0+i*0.13, last?0.42:0.20, 0.10);
    });
  }catch(e){}
}

/* --- Nada putaran gear ------------------------------------------------------
   Mengiringi ikon roda gigi (⚙) saat menu Pengaturan dibuka/ditutup dan ikonnya
   berputar. Bunyinya dirancang "mekanis" singkat: derau tersaring bandpass yang
   menyapu naik lalu turun (kesan roda berputar sesaat) + beberapa "tik" gigi
   roda yang halus. Dibuat pelan agar tidak mengganggu, dan tetap menghormati
   sakelar SFX (sfxEnabled). AudioContext dipakai ulang dari nada lain. */
let _sfxGearLast=-1;
function sfxGear(){
  if(!sfxEnabled()) return;
  try{
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    if(!_sfxCtx) _sfxCtx=new AC();
    const ctx=_sfxCtx;
    if(ctx.state==='suspended') ctx.resume().catch(()=>{});
    // Jeda: cegah bunyi menumpuk saat kursor bergerak-gerak di atas gear atau
    // saat hover langsung disusul klik (hover + buka menu).
    const nowT=ctx.currentTime;
    if(_sfxGearLast>=0 && (nowT-_sfxGearLast)<0.28) return;
    _sfxGearLast=nowT;
    const t0=ctx.currentTime+0.01;
    const dur=0.24;
    // Whir: derau putih tersaring bandpass yang frekuensinya menyapu naik-turun.
    const frames=Math.max(1, Math.floor(ctx.sampleRate*dur));
    const buf=ctx.createBuffer(1, frames, ctx.sampleRate);
    const data=buf.getChannelData(0);
    for(let i=0;i<frames;i++) data[i]=(Math.random()*2-1);
    const src=ctx.createBufferSource(); src.buffer=buf;
    const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=6;
    bp.frequency.setValueAtTime(650, t0);
    bp.frequency.linearRampToValueAtTime(1550, t0+dur*0.45);
    bp.frequency.linearRampToValueAtTime(520, t0+dur);
    const wg=ctx.createGain();
    wg.gain.setValueAtTime(0.0001, t0);
    wg.gain.exponentialRampToValueAtTime(0.05, t0+0.03);
    wg.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    src.connect(bp); bp.connect(wg); wg.connect(ctx.destination);
    src.start(t0); src.stop(t0+dur+0.02);
    // Ratchet: deretan "tik" pendek seperti gigi roda yang lewat satu per satu.
    const n=7;
    for(let i=0;i<n;i++){
      const tt=t0+0.02+i*(dur*0.85/n);
      _sfxTone(ctx, 1350+i*55, tt, 0.02, 0.028);
    }
  }catch(e){}
}

function toast(msg,kind,dur){
  const t=document.getElementById('toast');
  const k = kind==='warn' ? 'warn' : (kind==='err'||kind==='fail') ? 'err' : 'ok';
  sfxPlay(k);
  const ic = k==='warn'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/></svg>'
    : k==='err'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  t.classList.remove('toast-ok','toast-warn','toast-err');
  t.classList.add('toast-'+k);
  /* Pesan bisa terdiri dari beberapa BARIS (dipisah "\n"), mis. hasil unggah
     template: "2 Data pekerjaan berhasil ditambahkan" lalu "3 Data pekerjaan
     tidak berhasil ditambahkan : data sudah ada". Karena isinya dipasang lewat
     innerHTML, "\n" mentah hanya menjadi spasi biasa sehingga kedua kalimat
     menyambung jadi satu baris — di sini diterjemahkan menjadi <br>.
     Kelas .multi dipakai agar ikon tetap sejajar baris pertama, bukan melayang
     di tengah blok teks. */
  const baris = String(msg==null?'':msg).split(/\r?\n/);
  t.classList.toggle('toast-multi', baris.length>1);
  t.innerHTML=ic+'<span>'+baris.join('<br>')+'</span>';
  t.classList.add('show'); clearTimeout(toastT);
  const ms = (typeof dur==='number' && dur>0) ? dur : TOAST_MS_DEFAULT;
  toastT=setTimeout(()=>t.classList.remove('show'),ms);
}


