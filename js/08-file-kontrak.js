/* ===== 08-file-kontrak.js (bagian 8/15, baris 6564-7214 dari app.js asli) =====
   Lampiran file kontrak + popup unggah template generik.
   WAJIB dimuat berurutan 01 s.d. 15 — jangan ubah urutannya. ===== */
/* ============================================================
   ====================  FILE KONTRAK  ========================
   Lampiran file kontrak per pekerjaan (KR / PL / Tender).
   Satu file per pekerjaan; unggah ulang akan mengganti file lama.
   Disimpan di Supabase tabel `file_kontrak` (base64).
   Jalankan skrip: file_kontrak_supabase_up3masohi.sql
   ============================================================ */
const FK_TABLE = 'file_kontrak';
const FK_BUCKET = 'file-kontrak';   // bucket Supabase Storage untuk file fisik
const FK_MAX_MB = 50;   // batas ukuran file (sesuai batas per-file Storage free tier)

/* Yang masuk daftar File Kontrak:
   - SPBJ / Kontrak Rinci (kr) : HANYA status "Selesai".
   - Pengadaan Langsung & Tender: tahapan "Terkontrak" atau "Selesai".
   (On Progress / Gagal-Batal / tahapan proses lain dikecualikan.) */
function fkStatusOk(modul, r){
  const s=String((modul==='kr' ? r.status : r.tahapan)||'').trim();
  if(modul==='kr') return s==='Selesai';
  return s==='Terkontrak' || s==='Selesai';
}

/* Konfigurasi tiap modul: daftar (urut = Monitoring), kolom & aksesornya */
const FK_MODULES = {
  kr: {
    label:'SPBJ / Kontrak Rinci',
    noKontrakLabel:'No. SPBJ / Kontrak Rinci',
    stacked:false,
    list: ()=> [...records].filter(r=>fkStatusOk('kr',r)).sort(makeWorkComparator(
      r=>contractYear(r), r=>!!String(r.no_spbj||'').trim(), r=>r.tgl_terbit_kr)),
    nama: r=> r.nama_pekerjaan_kr || '',
    bidang: r=> r.bidang_pelaksana || '',
    noKontrak: r=> fkEsc(r.no_spbj||'—'),
    tgl: r=> r.tgl_terbit_kr,
    year: r=> contractYear(r),
    nilai: r=> rupiah(r.nilai_kontrak_kr)||'—',
    penyedia: r=> r.nama_penyedia || '',
    penyediaCell: r=> fkEsc(r.nama_penyedia||'') || '—',
    noKontrakRaw: r=> r.no_spbj || ''
  },
  pl: {
    label:'Pengadaan Langsung',
    noKontrakLabel:'No. Kontrak',
    stacked:false,
    list: ()=> [...records_pl].filter(r=>fkStatusOk('pl',r)).sort(makeWorkComparator(
      r=>yearOf(r, r.tgl_awal_kontrak), r=>!!String(r.no_kontrak||'').trim(), r=>r.tgl_awal_kontrak)),
    nama: r=> r.nama_pekerjaan || '',
    bidang: r=> r.bidang_pelaksana || '',
    noKontrak: r=> fkEsc(r.no_kontrak||'—'),
    tgl: r=> r.tgl_awal_kontrak,
    year: r=> yearOf(r, r.tgl_awal_kontrak),
    nilai: r=> rupiah(r.kontrak_total_dengan_ppn)||'—',
    penyedia: r=> r.perusahaan || '',
    penyediaCell: r=> fkEsc(r.perusahaan||'') || '—',
    noKontrakRaw: r=> r.no_kontrak || ''
  },
  tender: {
    label:'Tender',
    noKontrakLabel:'No. Kontrak',
    stacked:true,
    list: ()=> [...records_tender].filter(r=>fkStatusOk('tender',r)).sort(makeWorkComparator(
      r=>yearOf(r, r.tgl_awal_kontrak),
      r=>{ if(String(r.no_kontrak||'').trim()) return true;
           const L=Array.isArray(r.penyedia_layers)?r.penyedia_layers:[];
           return L.some(x=>String((x&&x.no_kontrak)||'').trim()); },
      r=>r.tgl_awal_kontrak)),
    nama: r=> r.nama_pekerjaan || '',
    bidang: r=> r.bidang_pelaksana || '',
    noKontrak: r=> stackPenyediaHtml(r,'no_kontrak'),
    tgl: r=> r.tgl_awal_kontrak,
    year: r=> yearOf(r, r.tgl_awal_kontrak),
    nilai: r=> stackPenyediaRupiah(r,'kontrak_total_dengan_ppn'),
    penyedia: r=>{
      const base = r.perusahaan || '';
      const L = Array.isArray(r.penyedia_layers) ? r.penyedia_layers : [];
      return [base, ...L.map(x=>(x&&x.perusahaan)||'')].filter(Boolean).join(' ');
    },
    penyediaCell: r=> stackPenyediaHtml(r,'perusahaan'),
    noKontrakRaw: r=>{
      const base = r.no_kontrak || '';
      const L = Array.isArray(r.penyedia_layers) ? r.penyedia_layers : [];
      return [base, ...L.map(x=>(x&&x.no_kontrak)||'')].filter(Boolean).join(' ');
    }
  }
};

/* State tampilan */
const fkState = { input:{modul:'kr',page:1}, view:{modul:'kr',page:1} };
/* Cache metadata file per modul: { [record_id]: {id,nama_file,ukuran,mime} } */
const fkMetaMap = { kr:null, pl:null, tender:null };
function fkResetCache(){ fkMetaMap.kr=null; fkMetaMap.pl=null; fkMetaMap.tender=null; }

/* ---- Store Supabase: file fisik di Storage, metadata (+path) di tabel ----
   Kolom `path` = lokasi objek di bucket Storage. Kolom lama `data_base64`
   tetap dibaca untuk kompatibilitas data lama (sebelum migrasi Storage). */
const FileKontrak = {
  async listMeta(modul){
    if(!(USE_SUPABASE && db)) return {};
    const {data,error}=await db.from(FK_TABLE)
      .select('id,record_id,nama_file,ukuran,mime').eq('modul',modul);
    if(error) throw error;
    const map={}; (data||[]).forEach(r=>{ map[String(r.record_id)]=r; });
    return map;
  },
  async getOne(modul, recordId){
    const {data,error}=await db.from(FK_TABLE)
      .select('nama_file,mime,path,data_base64')
      .eq('modul',modul).eq('record_id',String(recordId)).limit(1);
    if(error) throw error; return (data&&data[0])||null;
  },
  /* Simpan file ke Storage lalu simpan metadata (path) ke tabel.
     onProgress opsional (0..1) — hanya mencakup pembacaan; Storage upload
     tidak melaporkan progres granular, jadi diteruskan oleh pemanggil. */
  async saveFile(modul, recordId, file, meta){
    const safe=String(file.name||'file').replace(/[^\w.\-]+/g,'_');
    const path=`${modul}/${String(recordId)}/${Date.now()}_${safe}`;
    // Unggah file mentah (Blob) ke Storage — TANPA base64, tanpa batas payload DB
    const up=await db.storage.from(FK_BUCKET).upload(path, file, {
      contentType:file.type||'application/octet-stream', upsert:true
    });
    if(up.error) throw up.error;
    // Ambil path lama (bila ada) agar bisa dibersihkan setelah metadata diganti
    let oldPath=null;
    try{
      const prev=await db.from(FK_TABLE).select('path')
        .eq('modul',modul).eq('record_id',String(recordId)).limit(1);
      oldPath=(prev.data&&prev.data[0]&&prev.data[0].path)||null;
    }catch(e){}
    const row=Object.assign({
      modul, record_id:String(recordId),
      nama_file:file.name, mime:file.type||'application/octet-stream',
      ukuran:file.size, path, data_base64:null
    }, meta||{});
    const {error}=await db.from(FK_TABLE).upsert(row,{onConflict:'modul,record_id'});
    if(error){ // rollback objek yang sudah terunggah bila metadata gagal
      try{ await db.storage.from(FK_BUCKET).remove([path]); }catch(e){}
      throw error;
    }
    if(oldPath && oldPath!==path){ try{ await db.storage.from(FK_BUCKET).remove([oldPath]); }catch(e){} }
  },
  /* Blob file: dari Storage (path) atau fallback base64 lama. */
  async getBlob(row){
    if(!row) return null;
    if(row.path){
      const dl=await db.storage.from(FK_BUCKET).download(row.path);
      if(dl.error) throw dl.error;
      return dl.data;               // Blob
    }
    if(row.data_base64) return fkB64ToBlob(row.data_base64, row.mime);
    return null;
  },
  async remove(modul, recordId){
    // Hapus objek Storage dulu (bila ada), lalu baris metadata
    try{
      const prev=await db.from(FK_TABLE).select('path')
        .eq('modul',modul).eq('record_id',String(recordId)).limit(1);
      const p=prev.data&&prev.data[0]&&prev.data[0].path;
      if(p){ try{ await db.storage.from(FK_BUCKET).remove([p]); }catch(e){} }
    }catch(e){}
    const {error}=await db.from(FK_TABLE).delete()
      .eq('modul',modul).eq('record_id',String(recordId));
    if(error) throw error;
  }
};

/* ---- Util file <-> base64 ---- */
function fkFileToBase64(file){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>{ const s=String(r.result||''); const i=s.indexOf(','); res(i>=0?s.slice(i+1):s); };
    r.onerror=()=>rej(r.error||new Error('Gagal membaca file'));
    r.readAsDataURL(file);
  });
}
/* Versi dengan progres baca file (onProgress: 0..1) */
function fkFileToBase64Progress(file, onProgress){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onprogress=(e)=>{ if(e.lengthComputable && typeof onProgress==='function') onProgress(e.loaded/e.total); };
    r.onload=()=>{ if(typeof onProgress==='function') onProgress(1); const s=String(r.result||''); const i=s.indexOf(','); res(i>=0?s.slice(i+1):s); };
    r.onerror=()=>rej(r.error||new Error('Gagal membaca file'));
    r.readAsDataURL(file);
  });
}
/* ---- Kontrol overlay progres unggah ---- */
function pnUploadProgressOpen(fname){
  const ov=document.getElementById('pn-upload-overlay'); if(!ov) return;
  const t=document.getElementById('pn-upload-title'); if(t) t.textContent='Mengunggah file…';
  const fn=document.getElementById('pn-upload-fname'); if(fn) fn.textContent=fname||'';
  pnUploadProgressSet(0);
  ov.classList.add('show');
}
function pnUploadProgressSet(pct){
  pct=Math.max(0,Math.min(100,Math.round(pct)));
  const bar=document.getElementById('pn-upload-bar'); if(bar) bar.style.width=pct+'%';
  const lab=document.getElementById('pn-upload-pct'); if(lab) lab.textContent=pct+'%';
}
function pnUploadProgressDone(cb){
  pnUploadProgressSet(100);
  const t=document.getElementById('pn-upload-title'); if(t) t.textContent='Selesai';
  setTimeout(()=>{ const ov=document.getElementById('pn-upload-overlay'); if(ov) ov.classList.remove('show'); if(typeof cb==='function') cb(); }, 480);
}
function pnUploadProgressClose(){ const ov=document.getElementById('pn-upload-overlay'); if(ov) ov.classList.remove('show'); }
function fkB64ToBlob(b64, mime){
  const bin=atob(b64||''); const len=bin.length; const bytes=new Uint8Array(len);
  for(let i=0;i<len;i++) bytes[i]=bin.charCodeAt(i);
  return new Blob([bytes],{type:mime||'application/octet-stream'});
}
function fkFmtSize(n){
  n=Number(n)||0;
  if(n<1024) return n+' B';
  if(n<1048576) return (n/1024).toFixed(1)+' KB';
  return (n/1048576).toFixed(2)+' MB';
}
function fkEsc(s){ return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ---- Navigasi ---- */
function openFkInput(modul){
  if(!FK_MODULES[modul]) modul='kr';
  // Akun user hanya boleh Input Kontrak untuk SPBJ / Kontrak Rinci (kr)
  if(currentRole==='user' && modul!=='kr') modul='kr';
  if(fkState.input.modul!==modul){ fkState.input.page=1; fkClearFilters('input'); }
  fkState.input.modul=modul; showView('fk-input');
}
function openFkView(modul){
  if(!FK_MODULES[modul]) modul='kr';
  if(fkState.view.modul!==modul){ fkState.view.page=1; fkClearFilters('view'); }
  fkState.view.modul=modul; showView('fk-view');
}
/* ---- Filter (Bidang Pelaksana) & Cari (Nama Pekerjaan) ---- */
/* Set placeholder kotak Cari File Kontrak sesuai modul (No. SPBJ utk KR, No. Kontrak utk PL/Tender) */
function fkSetSearchPlaceholder(mode, cfg){
  const inp=document.getElementById('fk-'+mode+'-search');
  if(!inp||!cfg) return;
  const noLabel = (cfg.noKontrakLabel||'').includes('SPBJ') ? 'No. SPBJ' : 'No. Kontrak';
  inp.placeholder = 'Cari '+noLabel+' / Pekerjaan / Penyedia';
}
function fkApplyFilters(mode, cfg, rows){
  const fb=document.getElementById('fk-'+mode+'-bidang')?.value||'';
  const ft=document.getElementById('fk-'+mode+'-tahun')?.value||'';
  const fs=(document.getElementById('fk-'+mode+'-search')?.value||'').toLowerCase().trim();
  if(!fb && !ft && !fs) return rows;
  return rows.filter(r=>{
    if(fb && String(cfg.bidang(r)||'')!==fb) return false;
    if(ft && String((cfg.year?cfg.year(r):'')||'')!==ft) return false;
    if(fs){
      const hay = [
        cfg.nama(r)||'',
        (cfg.noKontrakRaw?cfg.noKontrakRaw(r):'')||'',
        (cfg.penyedia?cfg.penyedia(r):'')||''
      ].join(' ').toLowerCase();
      if(!hay.includes(fs)) return false;
    }
    return true;
  });
}
function fkClearFilters(mode){
  const b=document.getElementById('fk-'+mode+'-bidang'); if(b) b.value='';
  const t=document.getElementById('fk-'+mode+'-tahun'); if(t) t.value='';
  const s=document.getElementById('fk-'+mode+'-search'); if(s) s.value='';
}
function fkFilterInput(){ fkState.input.page=1; renderFkInput(); }
function fkFilterView(){ fkState.view.page=1; renderFkView(); }
function fkResetInput(){ fkClearFilters('input'); fkState.input.page=1; renderFkInput(); }
function fkResetView(){ fkClearFilters('view'); fkState.view.page=1; renderFkView(); }
/* Tombol "Tambah Data" pada File Kontrak — Lihat Kontrak:
   mengalihkan ke halaman Input Kontrak dengan modul yang sedang dibuka. */
function fkTambahData(){ openFkInput((fkState&&fkState.view&&fkState.view.modul)||'kr'); }
/* Tombol "Kembali" pada File Kontrak — Input Kontrak: kembali ke daftar (Lihat Kontrak)
   dengan modul yang sedang dibuka. */
function fkKembaliView(){ openFkView((fkState&&fkState.input&&fkState.input.modul)||'kr'); }
/* Tandai item nav + segmented control yang aktif sesuai modul terpilih */
function fkMarkActive(mode, modul){
  document.querySelectorAll('.topnav-item[data-view="fk-'+mode+'"]').forEach(b=>{
    b.classList.toggle('active', b.dataset.modul===modul);
  });
  const seg=document.getElementById('fk-'+mode+'-seg');
  if(seg) seg.querySelectorAll('.fk-seg-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.modul===modul);
  });
}

/* Muat metadata modul (dengan cache); force=true untuk ambil ulang dari server */
async function fkEnsureMeta(modul, force){
  if(!force && fkMetaMap[modul]) return fkMetaMap[modul];
  try{ fkMetaMap[modul]=await FileKontrak.listMeta(modul); }
  catch(err){ console.error(err); toast('Gagal memuat data file: '+errMsg(err),'warn'); fkMetaMap[modul]=fkMetaMap[modul]||{}; }
  return fkMetaMap[modul];
}

/* ---- Render tabel Input Data ---- */
async function renderFkInput(){
  const modul=fkState.input.modul;
  fkMarkActive('input', modul);
  const cfg=FK_MODULES[modul];
  const thNok=document.getElementById('fk-input-th-nok'); if(thNok) thNok.textContent=cfg.noKontrakLabel;
  fkSetSearchPlaceholder('input', cfg);
  const tb=document.getElementById('fk-input-body');
  const pg=document.getElementById('fk-input-pagination');
  const cEl=document.getElementById('fk-input-count');
  if(!tb) return;
  let rows=cfg.list();
  rows=fkApplyFilters('input', cfg, rows);
  const meta=await fkEnsureMeta(modul);
  if(fkState.input.modul!==modul) return;    // modul berubah saat menunggu
  rows=rows.filter(r=>!meta[String(r.id)]);  // hanya kontrak yang BELUM diunggah
  if(cEl) cEl.textContent=rows.length;
  fkRenderRows('input', modul, cfg, rows, meta, tb, pg);
}
/* ---- Render tabel Lihat Data ---- */
async function renderFkView(){
  const modul=fkState.view.modul;
  fkMarkActive('view', modul);
  const cfg=FK_MODULES[modul];
  const thNok=document.getElementById('fk-view-th-nok'); if(thNok) thNok.textContent=cfg.noKontrakLabel;
  fkSetSearchPlaceholder('view', cfg);
  // Tombol "Tambah Data" hanya untuk yang berhak mengubah modul ini —
  // untuk user di Pengadaan Langsung & Tender tombol dihilangkan sepenuhnya
  // (user hanya boleh melihat pada kedua bagian tersebut).
  const tbhBtn=document.getElementById('fk-view-tambah');
  if(tbhBtn) tbhBtn.style.display = fkCanModify(modul) ? '' : 'none';
  const tb=document.getElementById('fk-view-body');
  const pg=document.getElementById('fk-view-pagination');
  const cEl=document.getElementById('fk-view-count');
  if(!tb) return;
  let rows=cfg.list();
  rows=fkApplyFilters('view', cfg, rows);
  const meta=await fkEnsureMeta(modul);
  if(fkState.view.modul!==modul) return;
  rows=rows.filter(r=>!!meta[String(r.id)]);  // hanya kontrak yang SUDAH diunggah
  if(cEl) cEl.textContent=rows.length;
  fkRenderRows('view', modul, cfg, rows, meta, tb, pg);
}

function fkEmptyRow(mode){
  const msg = 'Data tidak tersedia';
  return `<tr><td colspan="6"><div class="empty">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
    <div>${msg}</div>
  </div></td></tr>`;
}
function fkRenderRows(mode, modul, cfg, rows, meta, tb, pg){
  const total=rows.length;
  if(total===0){ tb.innerHTML=fkEmptyRow(mode); if(pg) pg.innerHTML=''; return; }
  const st=fkState[mode];
  const totalPages=Math.max(1,Math.ceil(total/PAGE_SIZE));
  if(st.page>totalPages) st.page=totalPages;
  if(st.page<1) st.page=1;
  const start=(st.page-1)*PAGE_SIZE;
  const pageRows=rows.slice(start,start+PAGE_SIZE);
  const stacked=!!cfg.stacked;
  const kontrakCls = stacked ? 'wrap-penyedia col-kontrak' : 'col-kontrak';

  tb.innerHTML=pageRows.map((r,i)=>{
    const rid=String(r.id);
    const nama=cfg.nama(r)||'—';
    const bidang=cfg.bidang(r)||'—';
    const noKontrak=cfg.noKontrak(r)||'—';
    const tgl=fmtDate(cfg.tgl(r))||'—';
    const f=meta[rid];
    const aksi = (mode==='input') ? fkInputActionHtml(modul, rid, f) : fkViewActionHtml(modul, rid, f);
    const dropAttrs = (mode==='input' && fkCanModify(modul))
      ? ` ondragover="fkRowDragOver(event,this)" ondragleave="fkRowDragLeave(event,this)" ondrop="fkRowDrop(event,'${modul}','${rid}',this)"`
      : '';
    return `<tr>
      <td class="col-no">${start+i+1}</td>
      <td class="wrap-cell col-nama-freeze fk-namecell">${fkEsc(nama)}</td>
      <td class="${kontrakCls}">${noKontrak}</td>
      <td class="cell-center col-date">${tgl}</td>
      <td class="fk-col-bidang wrap-cell">${fkEsc(bidang)}</td>
      <td class="fk-actcell"${dropAttrs}><div class="fk-actions">${aksi}</div></td>
    </tr>`;
  }).join('');
  revealTbody(tb);
  fkRenderPagination(mode, st.page, totalPages, pg);
}

/* Aksi kolom Input Data: hanya "Unggah File" (daftar ini hanya kontrak yang BELUM diunggah) */
function fkInputActionHtml(modul, rid, f){
  const upIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v13"/></svg>';
  return fkCanModify(modul)
    ? `<button class="fk-act fk-act-up" onclick="fkUpload('${modul}','${rid}',this)">${upIcon}Unggah File</button>`
    : `<span class="fk-none"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>Menunggu unggah</span>`;
}
/* Aksi kolom Lihat Data: Lihat/Preview (PDF) + Hapus — hanya ikon, tanpa nama file */
function fkViewActionHtml(modul, rid, f){
  if(!f){
    return `<span class="fk-none"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>Data tidak tersedia</span>`;
  }
  const view=`<button class="fk-act fk-act-view fk-act-icon" title="Lihat" aria-label="Lihat" onclick="fkPreview('${modul}','${rid}',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>`;
  const del=fkCanModify(modul)?`<button class="fk-act fk-act-del fk-act-icon" title="Hapus" aria-label="Hapus" onclick="fkDelete('${modul}','${rid}',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>`:'';
  return view+del;
}

function fkRenderPagination(mode, page, totalPages, el){
  if(!el) return;
  if(totalPages<=1){ el.innerHTML=''; return; }
  const fn = mode==='input' ? 'fkGoToInputPage' : 'fkGoToViewPage';
  const want=new Set([1,totalPages,page-1,page,page+1]);
  const list=[...want].filter(p=>p>=1&&p<=totalPages).sort((a,b)=>a-b);
  let html=`<button class="pg-btn" ${page===1?'disabled':''} onclick="${fn}(${page-1})">‹ Sebelumnya</button>`;
  let prev=0;
  list.forEach(p=>{
    if(p-prev>1) html+=`<span class="pg-ellipsis">…</span>`;
    html+=`<button class="pg-btn pg-num ${p===page?'active':''}" onclick="${fn}(${p})">${p}</button>`;
    prev=p;
  });
  html+=`<button class="pg-btn" ${page===totalPages?'disabled':''} onclick="${fn}(${page+1})">Berikutnya ›</button>`;
  el.innerHTML=html;
}
function fkGoToInputPage(p){ fkState.input.page=p; withQuickLoader('Memuat', ()=>{ renderFkInput(); document.querySelector('#view-fk-input .panel')?.scrollIntoView({behavior:'smooth',block:'nearest'}); }, 480); }
function fkGoToViewPage(p){ fkState.view.page=p; withQuickLoader('Memuat', ()=>{ renderFkView(); document.querySelector('#view-fk-view .panel')?.scrollIntoView({behavior:'smooth',block:'nearest'}); }, 480); }

/* ---- Unggah file ---- */
let fkUploadCtx=null;
/* File Kontrak hanya menerima PDF. */
function fkIsPdf(file){
  if(!file) return false;
  const nm=String(file.name||'').toLowerCase();
  return (file.type==='application/pdf') || nm.endsWith('.pdf');
}
/* Klik "Unggah File" -> buka POPUP drag & drop (di dalamnya bisa telusuri file). */
function fkUpload(modul, recordId, btn){
  if(!requireInput()) return;
  if(!fkRequireModify(modul)) return;
  fkUploadCtx={modul, recordId, btn};
  fkOpenUploadModal();
}
function fkOpenUploadModal(){
  const ov=document.getElementById('fk-upload-overlay'); if(!ov) return;
  const mx=document.getElementById('fk-dz-max'); if(mx) mx.textContent=FK_MAX_MB;
  const dz=document.getElementById('fk-dropzone'); if(dz) dz.classList.remove('fk-dz-over');
  ov.classList.add('show');
}
function fkCloseUploadModal(){
  const ov=document.getElementById('fk-upload-overlay'); if(ov) ov.classList.remove('show');
  const dz=document.getElementById('fk-dropzone'); if(dz) dz.classList.remove('fk-dz-over');
}
/* Klik dropzone -> telusuri berkas (buka pemilih file OS). */
function fkDzBrowse(){
  const inp=document.getElementById('fk-file-input'); if(!inp) return;
  inp.value=''; inp.click();
}
function fkDzDragOver(ev){
  if(!ev.dataTransfer || !Array.from(ev.dataTransfer.types||[]).includes('Files')) return;
  ev.preventDefault(); ev.stopPropagation();
  ev.dataTransfer.dropEffect='copy';
  const dz=document.getElementById('fk-dropzone'); if(dz) dz.classList.add('fk-dz-over');
}
function fkDzDragLeave(ev){
  ev.stopPropagation();
  const dz=document.getElementById('fk-dropzone');
  if(dz && (!ev.relatedTarget || !dz.contains(ev.relatedTarget))) dz.classList.remove('fk-dz-over');
}
function fkDzDrop(ev){
  ev.preventDefault(); ev.stopPropagation();
  const dz=document.getElementById('fk-dropzone'); if(dz) dz.classList.remove('fk-dz-over');
  const dt=ev.dataTransfer; const file=dt && dt.files && dt.files[0];
  if(!file){ toast('Tidak ada file yang terdeteksi','warn'); return; }
  fkSubmitFromModal(file);
}
/* Validasi (PDF) lalu tutup popup & mulai unggah. Bila bukan PDF, popup tetap
   terbuka agar pengguna bisa memilih file lain. */
function fkSubmitFromModal(file){
  if(!fkIsPdf(file)){ toast('File harus berformat PDF','warn'); return; }
  const ctx=fkUploadCtx;
  fkCloseUploadModal();
  if(!ctx) return;
  fkUploadCtx=null;
  fkUploadFile(ctx.modul, ctx.recordId, file, ctx.btn);
}
function fkHandleFileSelected(file){
  if(!file) return;
  fkSubmitFromModal(file);
}

/* ===== Popup Unggah Template (generik) — tampilan sama dengan Unggah File Kontrak,
   hanya beda judul pop up & jenis file. Dipakai semua tombol "Upload Template".
   openTplUpload({title, accept, hint, onFile}) — onFile menerima objek File. ===== */
let tplUpCtx=null;
function openTplUpload(opts){
  tplUpCtx=opts||{};
  const ov=document.getElementById('tpl-up-overlay'); if(!ov) return;
  const t=document.getElementById('tpl-up-title'); if(t) t.textContent=tplUpCtx.title||'Unggah Template';
  const h=document.getElementById('tpl-up-hint'); if(h) h.textContent=tplUpCtx.hint||'';
  const inp=document.getElementById('tpl-up-input'); if(inp){ inp.accept=tplUpCtx.accept||''; inp.value=''; }
  const dz=document.getElementById('tpl-up-dz'); if(dz) dz.classList.remove('fk-dz-over');
  ov.classList.add('show');
}
function tplUpClose(){
  const ov=document.getElementById('tpl-up-overlay'); if(ov) ov.classList.remove('show');
  const dz=document.getElementById('tpl-up-dz'); if(dz) dz.classList.remove('fk-dz-over');
}
function tplUpBrowse(){ const inp=document.getElementById('tpl-up-input'); if(inp){ inp.value=''; inp.click(); } }
function tplUpDragOver(ev){
  if(!ev.dataTransfer || !Array.from(ev.dataTransfer.types||[]).includes('Files')) return;
  ev.preventDefault(); ev.stopPropagation(); ev.dataTransfer.dropEffect='copy';
  const dz=document.getElementById('tpl-up-dz'); if(dz) dz.classList.add('fk-dz-over');
}
function tplUpDragLeave(ev){
  ev.stopPropagation();
  const dz=document.getElementById('tpl-up-dz');
  if(dz && (!ev.relatedTarget || !dz.contains(ev.relatedTarget))) dz.classList.remove('fk-dz-over');
}
function tplUpDrop(ev){
  ev.preventDefault(); ev.stopPropagation();
  const dz=document.getElementById('tpl-up-dz'); if(dz) dz.classList.remove('fk-dz-over');
  const f=ev.dataTransfer && ev.dataTransfer.files ? ev.dataTransfer.files[0] : null;
  tplUpSubmit(f);
}
function tplUpExtOk(file){
  const acc=(tplUpCtx&&tplUpCtx.accept)||''; if(!acc) return true;
  const nm=String(file.name||'').toLowerCase();
  const exts=acc.split(',').map(a=>a.trim().toLowerCase()).filter(a=>a && a.indexOf('/')<0);
  if(!exts.length) return true;
  return exts.some(a=>nm.endsWith(a.replace(/^\*/,'')));
}
function tplUpSubmit(file){
  if(!file) return;
  if(!tplUpExtOk(file)){ toast('Jenis berkas tidak sesuai','warn'); return; }
  const ctx=tplUpCtx; tplUpClose();
  if(ctx && typeof ctx.onFile==='function') ctx.onFile(file);
}
(function(){ const inp=document.getElementById('tpl-up-input'); if(inp) inp.addEventListener('change', e=>{ const f=e.target.files&&e.target.files[0]; tplUpSubmit(f); }); })();

/* Inti proses unggah file kontrak — dipakai baik oleh pemilih file (click)
   maupun drag-and-drop. */
async function fkUploadFile(modul, recordId, file, btn){
  if(!fkIsPdf(file)){ toast('File harus berformat PDF','warn'); return; }
  if(file.size > FK_MAX_MB*1048576){ toast(`Ukuran file melebihi batas ${FK_MAX_MB} MB`,'warn'); return; }
  if(btn) btn.classList.add('is-busy');
  pnUploadProgressOpen(file.name);
  let creep=null;
  try{
    const rec=FK_MODULES[modul].list().find(r=>String(r.id)===String(recordId));
    const meta={
      nama_pekerjaan: rec?(FK_MODULES[modul].nama(rec)||null):null,
      bidang_pelaksana: rec?(FK_MODULES[modul].bidang(rec)||null):null
    };
    // Progres mengunggah tidak granular; jalankan animasi 5 -> 92% selama proses
    let p=5; pnUploadProgressSet(p);
    creep=setInterval(()=>{ p=Math.min(92,p+3); pnUploadProgressSet(p); }, 140);
    await FileKontrak.saveFile(modul, recordId, file, meta);
    await fkEnsureMeta(modul, true);
    clearInterval(creep); creep=null;
    pnUploadProgressDone(()=>{ toast('File diunggah — kontrak dipindahkan ke Lihat Kontrak','ok'); renderFkInput(); });
  }catch(err){
    if(creep) clearInterval(creep);
    pnUploadProgressClose();
    console.error(err);
    toast('Gagal mengunggah file: '+errMsg(err),'err');
    if(btn) btn.classList.remove('is-busy');
  }
}

/* ---- Drag & drop file langsung ke baris / tombol "Unggah File" ---- */
function fkRowDragOver(ev, el){
  if(!ev.dataTransfer || !Array.from(ev.dataTransfer.types||[]).includes('Files')) return;
  ev.preventDefault(); ev.stopPropagation();
  ev.dataTransfer.dropEffect='copy';
  el.classList.add('fk-drop-over');
}
function fkRowDragLeave(ev, el){
  ev.stopPropagation();
  if(ev.currentTarget===el && (!ev.relatedTarget || !el.contains(ev.relatedTarget))){
    el.classList.remove('fk-drop-over');
  }
}
function fkRowDrop(ev, modul, recordId, el){
  ev.preventDefault(); ev.stopPropagation();
  el.classList.remove('fk-drop-over');
  if(!requireInput()) return;
  if(!fkRequireModify(modul)) return;
  const dt=ev.dataTransfer;
  const file=dt && dt.files && dt.files[0];
  if(!file){ toast('Tidak ada file yang terdeteksi pada saat drop','warn'); return; }
  const btn=el.querySelector('.fk-act-up');
  fkUploadFile(modul, recordId, file, btn);
}
/* Cegah browser membuka file sebagai halaman baru bila di-drop di luar target */
window.addEventListener('dragover', e=>{ if(e.dataTransfer && Array.from(e.dataTransfer.types||[]).includes('Files')) e.preventDefault(); });
window.addEventListener('drop', e=>{ if(e.dataTransfer && Array.from(e.dataTransfer.types||[]).includes('Files')) e.preventDefault(); });

/* ---- Unduh file (TANPA notifikasi apa pun, sesuai permintaan) ---- */
async function fkDownload(modul, recordId, btn){
  if(btn) btn.classList.add('is-busy');
  try{
    const row=await FileKontrak.getOne(modul, recordId);
    const blob=await FileKontrak.getBlob(row);
    if(!blob) return;                                  // diam-diam
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=row.nama_file||'file-kontrak';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
  }catch(err){ console.error('fkDownload:', err); }     // tanpa notifikasi
  finally{ if(btn) btn.classList.remove('is-busy'); }
}

/* ---- Pratinjau file kontrak (PDF/gambar) — pakai modal pratinjau bersama ---- */
async function fkPreview(modul, recordId, btn){
  if(btn) btn.classList.add('is-busy');
  const titleEl=document.getElementById('pn-preview-title');
  const bodyEl=document.getElementById('pn-preview-body');
  const meta=fkMetaMap[modul]||{};
  const m=meta[String(recordId)];
  if(titleEl) titleEl.textContent=(m&&m.nama_file)||'Pratinjau File';
  pnCleanupPreview();
  const _mdl2=document.querySelector('#pn-preview-overlay .pn-preview-modal'); if(_mdl2) _mdl2.classList.remove('is-max');
  pnPreviewResetMaxBtn();
  if(bodyEl) bodyEl.innerHTML='<div class="pn-preview-nofile">Memuat pratinjau…</div>';
  document.getElementById('pn-preview-overlay').classList.add('show');
  try{
    const row=await FileKontrak.getOne(modul, recordId);
    const blob=await FileKontrak.getBlob(row);
    if(!blob){ if(bodyEl) bodyEl.innerHTML=pnPreviewNoFileHtml(row&&row.nama_file,'File tidak tersedia.'); return; }
    const mime=row.mime||'application/octet-stream';
    const url=URL.createObjectURL(blob);
    pnPreviewCtx={url, name:row.nama_file||'file'};
    const nm=(row.nama_file||'').toLowerCase();
    const isPdf=mime.includes('pdf')||nm.endsWith('.pdf');
    const isImg=mime.indexOf('image/')===0||/\.(png|jpe?g|gif|webp|bmp)$/.test(nm);
    if(!bodyEl) return;
    if(isPdf){ bodyEl.innerHTML='<iframe title="Pratinjau PDF"></iframe>'; bodyEl.querySelector('iframe').src=url; }
    else if(isImg){ bodyEl.innerHTML='<img alt="Pratinjau gambar">'; bodyEl.querySelector('img').src=url; }
    else{ bodyEl.innerHTML=pnPreviewNoFileHtml(pnPreviewCtx.name,'Jenis file ini tidak dapat dipratinjau. Silakan unduh untuk membukanya.'); }
  }catch(err){ console.error('fkPreview:',err); if(bodyEl) bodyEl.innerHTML=pnPreviewNoFileHtml(m&&m.nama_file,'Gagal memuat file: '+errMsg(err)); }
  finally{ if(btn) btn.classList.remove('is-busy'); }
}

/* ---- Hapus file ---- */
function fkDelete(modul, recordId, btn){
  if(!requireInput()) return;
  if(!fkRequireModify(modul)) return;
  openConfirm({
    icon:'del', title:'Hapus File', text:'Hapus file kontrak ini? Kontrak akan dikembalikan ke Input Kontrak untuk diunggah kembali.',
    onYes:async()=>{
      try{
        await withActionLoader('Menghapus', async()=>{ await FileKontrak.remove(modul, recordId); await fkEnsureMeta(modul, true); });
      }catch(err){ console.error(err); toast('Gagal menghapus file: '+errMsg(err),'warn'); return; }
      toast('File dihapus — kontrak dikembalikan ke Input Kontrak','ok');
      renderFkView();
    }
  });
}

/* Pasang listener input file (sekali) */
(function(){
  const inp=document.getElementById('fk-file-input');
  if(inp) inp.addEventListener('change', e=>{ const f=e.target.files&&e.target.files[0]; fkHandleFileSelected(f); });
})();

