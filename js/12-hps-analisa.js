/* ===== 12-hps-analisa.js (bagian 12/15, baris 11535-15654 dari app.js asli) =====
   Data pekerjaan bersama, HPS, Analisa Harga Satuan, composite PDF, migrasi, restoreSession.
   WAJIB dimuat berurutan 01 s.d. 15 — jangan ubah urutannya. ===== */
/* =========================================================================
   INPUT DATA BARU SELALU BERSIH
   Setiap kali membuka form untuk DATA BARU (bukan Ubah/Edit):
     - "Pilih Pekerjaan" (tautan Data Pekerjaan) otomatis DIBATALKAN
     - "Muat Profil" (Jadwal / Persyaratan) otomatis DILEPAS
   sehingga bawaannya: tanpa pilihan pekerjaan & tanpa muatan profil.
   ========================================================================= */
function lepasPilihanPekerjaan(o){
  if(!o || typeof o!=='object') return o;
  ['dpId','dpNama','__dpId','__dpNama','__pnLock','hpsId','hpsNama'].forEach(function(k){ delete o[k]; });
  return o;
}
function lepasProfil(o){
  if(!o || typeof o!=='object') return o;
  o.profilLoaded=false; o.profilName='';
  return o;
}
function resetInputBaru(modul){
  try{
    switch(modul){
      case 'fkl':
        if(typeof fklState!=='undefined' && fklState[fklModul]){
          lepasPilihanPekerjaan(fklState[fklModul].info); lepasProfil(fklState[fklModul]);
          if(typeof fklSaveState==='function') fklSaveState();
        }
        break;
      case 'pnw':
        if(typeof pnwState!=='undefined'){
          lepasPilihanPekerjaan(pnwState.info); lepasProfil(pnwState);
          pnwState.syarat={};
          if(typeof pnwEnsureSyarat==='function') pnwEnsureSyarat();
          if(typeof pnwSaveState==='function') pnwSaveState();
        }
        break;
      case 'rho':
        if(typeof rhoState!=='undefined'){ lepasPilihanPekerjaan(rhoState.info); if(typeof rhoSaveState==='function') rhoSaveState(); }
        break;
      case 'hps':
        if(typeof hpsState!=='undefined'){ lepasPilihanPekerjaan(hpsState.info); if(typeof hpsSaveState==='function') hpsSaveState(); }
        break;
      case 'ana':
        if(typeof anaState!=='undefined'){ lepasPilihanPekerjaan(anaState.info); if(typeof anaSaveState==='function') anaSaveState(); }
        break;
      case 'jadwal':
        if(typeof jpState!=='undefined' && jpState){ lepasPilihanPekerjaan(jpState); lepasProfil(jpState); }
        break;
      case 'pn':
        if(typeof pnState!=='undefined' && pnState.ambil) lepasPilihanPekerjaan(pnState.ambil);
        break;
      case 'spk':
        if(typeof spkState!=='undefined' && spkState){
          lepasPilihanPekerjaan(spkState.data);
          if(spkState.lamp) lepasPilihanPekerjaan(spkState.lamp);
        }
        break;
    }
  }catch(e){ console.error('resetInputBaru:', e); }
}

function openDpInput(editId){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  if(editId){
    const rec=(records_dp||[]).find(r=>String(r.id)===String(editId));
    dpEditId = rec ? rec.id : null;
    dpState = rec ? dpRecordToState(rec) : dpBlankState();
  }else{
    dpEditId=null; dpState=dpBlankState();
  }
  showView('form-dp');
}
function openDpView(){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  refreshDataDp().then(()=>showView('dp-view'));
}
function dpInfoInputHtml(f){
  const id='dp-'+f.key;
  const span=f.span?(' style="grid-column:span '+f.span+'"'):'';
  let ctl;
  if(f.type==='select') ctl='<select id="'+id+'" onchange="dpOnInfoChange()"><option value="">— Pilih —</option>'+(f.options||[]).map(o=>'<option>'+fkEsc(o)+'</option>').join('')+'</select>';
  else if(f.type==='num') ctl='<input id="'+id+'" type="text" inputmode="numeric" placeholder="Rp" oninput="onRupiahInput(this)" onchange="dpOnInfoChange()">';
  else if(f.type==='date') ctl='<input id="'+id+'" type="date" onchange="dpOnInfoChange()">';
  else ctl='<input id="'+id+'" type="text" oninput="dpOnInfoChange()">';
  return '<div class="field"'+span+'><label>'+fkEsc(f.label)+'</label>'+ctl+'</div>';
}
function dpOnInfoChange(){
  const st=dpState; st.info=st.info||{};
  DP_INFO_FIELDS.forEach(f=>{ const el=document.getElementById('dp-'+f.key); if(!el) return; st.info[f.key]=(f.type==='num')?parseRupiah(el.value):el.value.trim(); });
}
function renderDpForm(){
  const tt=document.getElementById('dp-title'); if(tt) tt.textContent='Data Pekerjaan'+(dpEditId?' — Ubah Data':' — Input Data');
  const cont=document.getElementById('dp-content'); if(!cont) return;
  const st=dpState; st.info=st.info||{};
  let html='<div class="form-card"><div class="form-section-title">'+KR_SECTION_ICON+'Data Pekerjaan</div>'+
    '<div class="hps-hint">Data ini akan dipakai bersama oleh <b>Perhitungan HPS</b> dan <b>Analisa Harga Satuan</b> lewat tombol <b>Pilih Data Pekerjaan</b> — isi & simpan sekali di sini.</div>'+
    '<div class="form-flow" style="--cols:4">'+DP_INFO_FIELDS.map(dpInfoInputHtml).join('')+'</div></div>';
  // Batal & Simpan berdampingan di pojok kanan (Batal merah)
  html+='<div class="fkl-actions"><div class="fkl-actions-right">'+
      '<button class="btn btn-red" onclick="dpBatal()">'+FKL_IC_X+'Batal</button>'+
      '<button class="btn btn-green" onclick="dpSimpan()">'+FKL_IC_SAVE+'Simpan</button>'+
    '</div></div>';
  cont.innerHTML=html;
  DP_INFO_FIELDS.forEach(f=>{ const el=document.getElementById('dp-'+f.key); if(!el) return; const v=st.info[f.key]; el.value=(f.type==='num')?rupiahInputText(v):(v!=null?v:''); });
}
function dpBatal(){
  openConfirm({ icon:'del', title:'Batalkan Proses', text:'Batalkan proses ini? Data yang belum disimpan akan hilang.',
    onYes:()=>{ dpEditId=null; dpState=dpBlankState(); openDpView(); toast('Proses dibatalkan','ok'); }
  });
}
async function dpSimpan(){
  if(!requireInput()) return;
  dpOnInfoChange();
  const info=dpState.info||{}; const nama=String(info.nama||'').trim();
  if(!nama){ toast('Nama Pekerjaan wajib diisi','warn'); return; }
  const rec={
    nama_pekerjaan: nama, lokasi: info.lokasi||'', metode: info.metode||'',
    no_anggaran: info.no_anggaran||'', tgl_anggaran: info.tgl_anggaran||'',
    nilai: Number(info.nilai)||0,
    state: { info: JSON.parse(JSON.stringify(info)) }
  };
  try{
    await withActionLoader(dpEditId?'Menyimpan perubahan':'Menyimpan', async()=>{
      if(dpEditId) await StoreDp.update(dpEditId, rec);
      else await StoreDp.create(rec);
      await refreshDataDp();
    });
  }catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'err'); return; }
  toast(dpEditId?'Data berhasil diperbarui':'Data berhasil disimpan','ok');
  dpEditId=null; dpState=dpBlankState();
  openDpView();
}

/* ================= LIHAT DATA PEKERJAAN ================= */
let dpViewPage=1;
const DP_VIEW_PAGE_SIZE=8;
function dpViewRows(){
  let rows=(records_dp||[]).slice();
  const fs=(document.getElementById('dp-view-search')?.value||'').toLowerCase().trim();
  if(fs) rows=rows.filter(r=>String(r.nama_pekerjaan||'').toLowerCase().includes(fs));
  return rows;
}
function dpEmptyRow(){
  return '<tr><td colspan="6"><div class="empty">'+
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h5l2 3h9a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>'+
    '<div>Data tidak tersedia</div></div></td></tr>';
}
function renderDpView(){
  const tb=document.getElementById('dp-view-body');
  const pg=document.getElementById('dp-view-pagination');
  const cEl=document.getElementById('dp-view-count');
  if(!tb) return;
  const rows=dpViewRows();
  if(cEl) cEl.textContent=rows.length;
  if(!rows.length){ tb.innerHTML=dpEmptyRow(); if(pg) pg.innerHTML=''; return; }
  const totalPages=Math.max(1,Math.ceil(rows.length/DP_VIEW_PAGE_SIZE));
  if(dpViewPage>totalPages) dpViewPage=totalPages;
  if(dpViewPage<1) dpViewPage=1;
  const start=(dpViewPage-1)*DP_VIEW_PAGE_SIZE;
  const pageRows=rows.slice(start,start+DP_VIEW_PAGE_SIZE);
  tb.innerHTML=pageRows.map((r,i)=>{
    const rid=fkEsc(String(r.id));
    return '<tr>'+
      '<td class="col-no">'+(start+i+1)+'</td>'+
      '<td class="wrap-cell col-nama-freeze">'+fkEsc(r.nama_pekerjaan||'—')+'</td>'+
      '<td class="fkl-col-lokasi">'+fkEsc(r.lokasi||'—')+'</td>'+
      '<td>'+fkEsc(r.metode||'—')+'</td>'+
      '<td class="col-num" style="text-align:right;font-weight:700">'+hpsRp(r.nilai)+'</td>'+
      '<td><div class="action-cell" style="justify-content:center">'+
        '<button class="act act-edit" title="Ubah" onclick="openDpInput(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>'+
        '<button class="act act-del" title="Hapus" onclick="dpDeleteRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>'+
      '</div></td>'+
    '</tr>';
  }).join('');
  if(pg){
    if(totalPages<=1){ pg.innerHTML=''; }
    else{
      let h='<button class="pg-btn" '+(dpViewPage<=1?'disabled':'')+' onclick="dpViewGoto('+(dpViewPage-1)+')">‹</button>';
      for(let p=1;p<=totalPages;p++) h+='<button class="pg-btn '+(p===dpViewPage?'active':'')+'" onclick="dpViewGoto('+p+')">'+p+'</button>';
      h+='<button class="pg-btn" '+(dpViewPage>=totalPages?'disabled':'')+' onclick="dpViewGoto('+(dpViewPage+1)+')">›</button>';
      pg.innerHTML=h;
    }
  }
}
function dpViewGoto(p){ dpViewPage=p; renderDpView(); }
function dpDeleteRecord(id){
  if(!requireInput()) return;
  const rec=(records_dp||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  openConfirm({ icon:'del', title:'Hapus Data Pekerjaan',
    text:'Hapus data pekerjaan "'+(rec.nama_pekerjaan||'')+'"? Dokumen HPS/Analisa yang sudah memakainya TIDAK ikut berubah.',
    onYes:async()=>{
      try{ await withActionLoader('Menghapus', async()=>{ await StoreDp.remove(id); await refreshDataDp(); }); }
      catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'warn'); return; }
      toast('Data dihapus','ok'); renderDpView();
    }
  });
}

/* ================= PILIH DATA PEKERJAAN (dipakai bersama oleh HPS & Analisa) ================= */
let _dpPickerTarget=null;   // 'hps' | 'ana'
/* Segarkan daftar dokumen modul terkait agar status "sudah digunakan" akurat
   walau pengguna belum sempat membuka halaman daftarnya. */
const DP_USE_REFRESH = {
  hps:'refreshDataHps', ana:'refreshDataAnalisa', rho:'refreshDataRho',
  pnw:'refreshDataPembukaan', fkl:'refreshDataKelengkapan',
  jadwal:'refreshDataJadwal', spk:'refreshDataSpk'
};
async function dpRefreshTarget(target){
  const fn=DP_USE_REFRESH[target];
  if(fn && typeof window[fn]==='function'){ try{ await window[fn](); }catch(e){ console.error(e); } }
}
function openDpPicker(target){
  _dpPickerTarget=target;
  Promise.all([refreshDataDp(), dpRefreshTarget(target)]).then(()=>{
    const ov=document.getElementById('dp-picker-overlay'); if(!ov) return;
    const srch=document.getElementById('dp-picker-search'); if(srch) srch.value='';
    renderDpPickerList();
    ov.classList.add('show');
  });
}
function closeDpPicker(){ const ov=document.getElementById('dp-picker-overlay'); if(ov) ov.classList.remove('show'); }
/* Badge "Sudah digunakan" harus TETAP terlihat walau nama pekerjaan panjang.
   Nama dibuat menyusut/terpotong (ellipsis) di dalam baris flex, sedangkan badge
   tidak ikut menyusut (flex:0 0 auto) sehingga selalu tampil di samping nama. */
function dpEnsurePickerStyle(){
  if(document.getElementById('dp-picker-style')) return;
  var css=
    '#dp-picker-list .dp-name-row{display:flex;align-items:center;gap:8px;min-width:0}'+
    '#dp-picker-list .dp-name-row>b{min-width:0;flex:0 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
    '#dp-picker-list .dp-name-row>.dp-used-tag{flex:0 0 auto;margin:0}';
  var st=document.createElement('style'); st.id='dp-picker-style'; st.textContent=css;
  (document.head||document.documentElement).appendChild(st);
}
function renderDpPickerList(){
  const list=document.getElementById('dp-picker-list'); if(!list) return;
  dpEnsurePickerStyle();
  const fs=(document.getElementById('dp-picker-search')?.value||'').toLowerCase().trim();
  let rows=(records_dp||[]).slice();
  if(fs) rows=rows.filter(r=>String(r.nama_pekerjaan||'').toLowerCase().includes(fs));
  if(!rows.length){ list.innerHTML='<div class="hps-ana-empty">Belum ada data tersimpan.<br>Silakan buat lewat menu <b>Data Pekerjaan</b> terlebih dahulu.</div>'; return; }
  list.innerHTML=rows.map(r=>{
    const rid=fkEsc(String(r.id));
    const dipakai=!!dpUsedBy(_dpPickerTarget, String(r.id), r.nama_pekerjaan||'');
    const tag=dipakai?'<span class="dp-used-tag">Sudah digunakan</span>':'';
    return '<div class="hps-ana-item'+(dipakai?' is-used':'')+'" onclick="dpPickerSelect(\''+rid+'\')">'+
      '<div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h5l2 3h9a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg></div>'+
      '<div class="tx"><div class="dp-name-row"><b>'+fkEsc(r.nama_pekerjaan||'—')+'</b>'+tag+'</div><span>'+fkEsc(r.lokasi||'—')+' • '+fkEsc(r.metode||'—')+'</span></div>'+
      '<div class="go"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></div>'+
    '</div>';
  }).join('');
}
/* ================= CEGAH PEMAKAIAN GANDA DATA PEKERJAAN =================
   Satu Data Pekerjaan hanya boleh dipakai oleh SATU dokumen pada modul yang sama.
   Bila dokumen tersimpan sudah memakainya, pilihan ditolak dengan pesan
   "Data pekerjaan sudah digunakan". Saat MENGUBAH dokumen, tautannya sendiri
   tentu tidak dihitung sebagai bentrok.
   Catatan: Penetapan Nomor ('pn') sengaja TIDAK dibatasi, karena satu pekerjaan
   memang dirancang untuk menampung banyak nomor dokumen sekaligus. */
const DP_USE_TARGETS = {
  hps:    { label:'Perhitungan HPS',       list:()=>(typeof records_hps!=='undefined'?records_hps:[]),         edit:()=>(typeof hpsEditId!=='undefined'?hpsEditId:null) },
  ana:    { label:'Analisa Harga Satuan',  list:()=>(typeof records_ana!=='undefined'?records_ana:[]),         edit:()=>(typeof anaEditId!=='undefined'?anaEditId:null) },
  rho:    { label:'Referensi Harga Online', list:()=>(typeof records_rho!=='undefined'?records_rho:[]),         edit:()=>(typeof rhoEditId!=='undefined'?rhoEditId:null) },
  pnw:    { label:'Pembukaan Penawaran',   list:()=>(typeof records_pembukaan!=='undefined'?records_pembukaan:[]),   edit:()=>(typeof pnwEditId!=='undefined'?pnwEditId:null) },
  fkl:    { label:'Kelengkapan Dokumen',   list:()=>(typeof records_kelengkapan!=='undefined'?records_kelengkapan:[]), edit:()=>(typeof fklEditId!=='undefined'?fklEditId:null) },
  jadwal: { label:'Jadwal Pengadaan',      list:()=>(typeof records_jadwal!=='undefined'?records_jadwal:[]),   edit:()=>(typeof jpEditId!=='undefined'?jpEditId:null) },
  spk:    { label:'Kontrak (SPK)',         list:()=>(typeof records_spk!=='undefined'?records_spk:[]),         edit:()=>(typeof spkEditId!=='undefined'?spkEditId:null) }
};
/* Ambil tautan Data Pekerjaan dari sebuah record — bentuk penyimpanannya berbeda
   antar modul (state.info.dpId / info.dpId / state.dpId / data.__dpId). */
function dpIdOfRecord(r){
  if(!r || typeof r!=='object') return '';
  const s=(r.state && typeof r.state==='object') ? r.state : {};
  const cand = (s.info && s.info.dpId) || (r.info && r.info.dpId) || s.dpId ||
               (r.data && r.data.__dpId) || '';
  return cand ? String(cand) : '';
}
/* Kembalikan record yang SUDAH memakai Data Pekerjaan ini (null bila belum).
   Pencocokan utama lewat tautan dpId. Untuk dokumen LAMA yang belum menyimpan
   tautan dpId (dibuat manual sebelum fitur "Pilih Pekerjaan"), dipakai
   pencocokan cadangan lewat NAMA pekerjaan agar tetap terdeteksi. */
function dpUsedBy(target, dpId, nama){
  const t=DP_USE_TARGETS[target];
  if(!t || (!dpId && !nama)) return null;
  let list=[]; try{ list=t.list()||[]; }catch(e){ list=[]; }
  let cur=null;  try{ cur=t.edit(); }catch(e){ cur=null; }
  const nm=String(nama||'').trim().toLowerCase();
  return list.find(r=>{
    if(cur && String(r.id)===String(cur)) return false;   // dokumen yang sedang diubah
    const rid=dpIdOfRecord(r);
    if(rid) return rid===String(dpId);                    // record baru: cocokkan lewat tautan
    if(!nm) return false;
    // record lama tanpa tautan: cocokkan lewat nama pekerjaan (kolom / state.info.nama)
    const rn=String(r.nama_pekerjaan || (r.state&&r.state.info&&r.state.info.nama) || '').trim().toLowerCase();
    return rn!=='' && rn===nm;
  }) || null;
}

function dpPickerSelect(id){
  const rec=(records_dp||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  // Tolak bila Data Pekerjaan ini sudah dipakai dokumen lain pada modul yang sama
  const dipakai=dpUsedBy(_dpPickerTarget, String(rec.id), rec.nama_pekerjaan||'');
  if(dipakai){
    toast('Data pekerjaan sudah digunakan','err');
    return;
  }
  if(_dpPickerTarget==='hps' && typeof hpsApplyDp==='function') hpsApplyDp(rec);
  else if(_dpPickerTarget==='ana' && typeof anaApplyDp==='function') anaApplyDp(rec);
  else if(_dpPickerTarget==='rho' && typeof rhoApplyDp==='function') rhoApplyDp(rec);
  else if(_dpPickerTarget==='pnw' && typeof pnwApplyDp==='function') pnwApplyDp(rec);
  else if(_dpPickerTarget==='fkl' && typeof fklApplyDp==='function') fklApplyDp(rec);
  else if(_dpPickerTarget==='jadwal' && typeof jadwalApplyDp==='function') jadwalApplyDp(rec);
  else if(_dpPickerTarget==='pn' && typeof pnApplyDp==='function') pnApplyDp(rec);
  else if(_dpPickerTarget==='spk' && typeof spkApplyDp==='function') spkApplyDp(rec);
  closeDpPicker();
}
/* Tombol seragam "Pilih Pekerjaan" (pojok kanan atas kartu Data Pekerjaan). */
function dpTargetPicked(target){
  try{
    if(target==='rho') return !!(rhoState&&rhoState.info&&rhoState.info.dpId);
    if(target==='hps') return !!(hpsState&&hpsState.info&&hpsState.info.dpId);
    if(target==='ana') return !!(anaState&&anaState.info&&anaState.info.dpId);
    if(target==='pnw') return !!(pnwState&&pnwState.info&&pnwState.info.dpId);
    if(target==='fkl') return !!(fklState&&fklState[fklModul]&&fklState[fklModul].info&&fklState[fklModul].info.dpId);
    if(target==='jadwal') return !!(jpState&&jpState.dpId);
    if(target==='pn') return !!(typeof pnState!=='undefined'&&pnState.ambil&&pnState.ambil.dpId);
    if(target==='spk') return !!(typeof spkState!=='undefined'&&spkState&&spkState.data&&spkState.data.__dpId);
  }catch(e){}
  return false;
}
function dpPickBtnHtml(target){
  const picked=dpTargetPicked(target);
  let h='<span class="dp-pick-wrap">';
  h+='<button type="button" class="dp-pick-btn" onclick="openDpPicker(\''+target+'\')">'+
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h5l2 3h9a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>'+(picked?'Ganti Pekerjaan':'Pilih Pekerjaan')+
  '</button>';
  if(picked) h+='<button type="button" class="dp-unpick-btn" onclick="dpCancelPick(\''+target+'\')">'+
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>Batalkan Pilihan'+
  '</button>';
  h+='</span>';
  return h;
}
/* Batalkan pilihan pekerjaan → lepas tautan & kosongkan field dari Data Pekerjaan */
function dpCancelPick(target){
  if(target==='rho' && typeof rhoLepasDp==='function') rhoLepasDp();
  else if(target==='hps' && typeof hpsLepasDp==='function') hpsLepasDp();
  else if(target==='ana' && typeof anaLepasDp==='function') anaLepasDp();
  else if(target==='pnw') pnwCancelDp();
  else if(target==='fkl') fklCancelDp();
  else if(target==='jadwal') jadwalCancelDp();
  else if(target==='pn' && typeof pnLepasDp==='function') pnLepasDp();
  else if(target==='spk' && typeof spkLepasDp==='function') spkLepasDp();
}
function pnwCancelDp(){
  const st=pnwState; if(!st.info) return;
  delete st.info.dpId; delete st.info.dpNama;
  ['nama','lokasi','nilai','no_anggaran','tgl_anggaran','jenis_anggaran','metode'].forEach(k=>{ st.info[k]=''; });
  pnwSaveState(); if(typeof renderPnwForm==='function') renderPnwForm();
  toast('Pilihan pekerjaan dibatalkan','ok');
}
function fklCancelDp(){
  const st=fklState[fklModul]; if(!st||!st.info) return;
  delete st.info.dpId;
  ['nama','lokasi','nilai','no_anggaran','tgl_anggaran','jenis_anggaran','metode'].forEach(k=>{ st.info[k]=''; });
  fklSaveState(); if(typeof renderFormKelengkapan==='function') renderFormKelengkapan();
  toast('Pilihan pekerjaan dibatalkan','ok');
}
function jadwalCancelDp(){
  if(!jpState) return;
  delete jpState.dpId;
  jpState.namaPekerjaan=''; jpState.lokasi=''; jpState.nilai=''; jpState.noAnggaran=''; jpState.tglAnggaran=''; jpState.jenisAnggaran=''; jpState.metode='';
  if(typeof renderJadwalKerja==='function') renderJadwalKerja();
  toast('Pilihan pekerjaan dibatalkan','ok');
}
/* Terapkan Data Pekerjaan terpilih ke modul Pembukaan Penawaran */
function pnwApplyDp(rec){
  const st=pnwState; st.info=st.info||{};
  const info=(rec.state&&rec.state.info)||{};
  ['nama','lokasi','nilai','no_anggaran','tgl_anggaran','jenis_anggaran','metode'].forEach(k=>{ if(info[k]!=null&&info[k]!=='') st.info[k]=info[k]; });
  st.info.dpId=String(rec.id);
  pnwSaveState();
  if(typeof renderPnwForm==='function') renderPnwForm();
  toast('Data pekerjaan berhasil diterapkan','ok');
}
/* Terapkan Data Pekerjaan terpilih ke modul Kelengkapan Dokumen */
function fklApplyDp(rec){
  const st=fklState[fklModul]; st.info=st.info||{};
  const info=(rec.state&&rec.state.info)||{};
  ['nama','lokasi','nilai','no_anggaran','tgl_anggaran','jenis_anggaran','metode'].forEach(k=>{ if(info[k]!=null&&info[k]!=='') st.info[k]=info[k]; });
  st.info.dpId=String(rec.id);
  fklSaveState();
  if(typeof renderFormKelengkapan==='function') renderFormKelengkapan();
  toast('Data pekerjaan berhasil diterapkan','ok');
}
/* Terapkan Data Pekerjaan terpilih ke modul Tentukan Jadwal */
function jadwalApplyDp(rec){
  if(!jpState) jpState=jpBlankState();
  const info=(rec.state&&rec.state.info)||{};
  jpState.namaPekerjaan = rec.nama_pekerjaan||info.nama||jpState.namaPekerjaan;
  if(info.lokasi!=null&&info.lokasi!=='') jpState.lokasi=info.lokasi;
  if(info.nilai!=null&&info.nilai!=='') jpState.nilai=info.nilai;
  if(info.no_anggaran!=null&&info.no_anggaran!=='') jpState.noAnggaran=info.no_anggaran;
  if(info.tgl_anggaran!=null&&info.tgl_anggaran!=='') jpState.tglAnggaran=info.tgl_anggaran;
  if(info.metode!=null&&info.metode!=='') jpState.metode=info.metode;
  if(info.jenis_anggaran!=null&&info.jenis_anggaran!=='') jpState.jenisAnggaran=info.jenis_anggaran;
  jpState.dpId=String(rec.id);
  if(typeof renderJadwalKerja==='function') renderJadwalKerja();
  toast('Data pekerjaan berhasil diterapkan','ok');
}

/* ##################### AKHIR MODUL DATA PEKERJAAN #################### */



/* ####################################################################### */
/* ############# MODUL HARGA PERKIRAAN SENDIRI (HPS) ###################### */
/* ####################################################################### */

/* Nama hari (untuk baris "Masohi, Hari, Tanggal Tahun" pada blok TTD) */
const HPS_HARI=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
/* Tanggal panjang untuk baris tanda tangan — tanpa nama hari, mis. "9 Juli 2026". */
function hpsDateFull(s){
  if(!s) return '';
  const p=String(s).split('-'); if(p.length!==3) return s;
  const y=+p[0], m=+p[1], d=+p[2];
  return d+' '+(PNW_BULAN[m-1]||'')+' '+y;
}

/* Field data pekerjaan (langkah 1). Nama Pengguna & Pejabat kini bagian dari
   Data Pekerjaan (menu Data Pekerjaan), bukan diisi di sini lagi. */
const HPS_INFO_FIELDS = [
  {key:'nama',         label:'Nama Pekerjaan',            type:'text', span:2},
  {key:'lokasi',       label:'Lokasi Pekerjaan',          type:'text', span:2},
  {key:'nilai',        label:'Rencana Anggaran Biaya', type:'num'},
  {key:'no_anggaran',  label:'No. Anggaran',              type:'text'},
  {key:'tgl_anggaran', label:'Tgl. Anggaran',             type:'date'},
  {key:'metode',       label:'Metode Pengadaan',          type:'select', options:PNW_METODE},
  {key:'tgl_hps',      label:'Tgl. HPS',                  type:'date'}
];
/* Field bersama (sumbernya dari Data Pekerjaan, ditampilkan terkunci) vs
   field khusus dokumen HPS ini saja (tetap dapat diisi manual). */
const HPS_DP_FIELDS  = HPS_INFO_FIELDS.filter(f=>f.key!=='tgl_hps');
const HPS_OWN_FIELDS = HPS_INFO_FIELDS.filter(f=>f.key==='tgl_hps');

/* ---------- State ----------
   info      : { key:value } data pekerjaan + pengguna/pejabat (utk TTD) + analisa terpilih
   jumlahItem: jumlah barang/material (1..150)
   items     : [ {kelompok, uraian, sat, vol, hargaMat, hargaJasa}, ... ]
               hargaMat/hargaJasa = Harga Satuan (Material/Jasa) — nantinya
               terisi otomatis dari modul Analisa (masih dalam pengembangan).
*/

/* ================= JUDUL & SUB-JUDUL (penomoran bersama HPS + Analisa) =================
   Menggantikan kolom "Kelompok" lama. Dua tingkat pengelompokan:
     Judul     → teks SELALU dicetak HURUF BESAR semua, bernomor sesuai gaya (A/a/I/i)
     Sub-Judul → teks apa adanya (sesuai huruf besar/kecil yang diinput), bernomor terpisah
   Nomor urut item dimulai ulang pada tiap kelompok terdalam yang aktif. */
/* Gaya penomoran Judul/Sub-Judul. Nilai '' = tanpa nomor (baris judul tampil polos). */
const JS_NUM_STYLES=[['','—'],['A','A, B, C'],['a','a, b, c'],['I','I, II, III'],['i','i, ii, iii']];
function jsAlphaNum(n){ let x=Math.max(1,parseInt(n,10)||1), s=''; while(x>0){ const m=(x-1)%26; s=String.fromCharCode(65+m)+s; x=Math.floor((x-1)/26); } return s; }
function jsRomanNum(n){ let x=Math.max(1,parseInt(n,10)||1), s=''; [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']].forEach(function(p){ while(x>=p[0]){ s+=p[1]; x-=p[0]; } }); return s; }
function jsNumFmt(style,n){
  if(style==='') return '';                 // tanpa nomor
  if(style==='a') return jsAlphaNum(n).toLowerCase();
  if(style==='I') return jsRomanNum(n);
  if(style==='i') return jsRomanNum(n).toLowerCase();
  return jsAlphaNum(n);
}
/* Baca Volume menjadi angka, sadar konvensi Indonesia.
   Titik BISA berarti pemisah ribuan ("13.970" = 13970) atau desimal ("2.5" = 2,5).
   Aturan: bila ada koma, koma = desimal dan semua titik = ribuan. Bila hanya titik dan
   polanya kelompok 3 digit ("1.234", "13.970", "1.234.567"), titik = ribuan. Selain itu
   titik = desimal. Ini mencegah 13.970 terbaca 13,97 lalu digandakan dengan harga. */
function jsVolNum(v){
  if(v===''||v==null) return 0;
  if(typeof v==='number') return isNaN(v)?0:v;
  let t=String(v).trim().replace(/\s/g,''); if(!t) return 0;
  if(t.indexOf(',')>=0){ t=t.replace(/\./g,'').replace(',','.'); }
  else if(/^[1-9]\d{0,2}(\.\d{3})+$/.test(t)){ t=t.replace(/\./g,''); }   // "0.125" bukan ribuan
  const n=parseFloat(t);
  return isNaN(n)?0:n;
}
/* Volume untuk dokumen cetak: pemisah ribuan gaya Indonesia. Desimal hanya tampil
   bila nilainya memang pecahan — bilangan bulat dicetak polos ("9", bukan "9,00").
   Maksimal 3 angka di belakang koma. Kosong / nol → "-". */
function jsVolDoc(v){
  if(v===''||v==null) return '-';
  const n=jsVolNum(v);
  if(!n) return '-';
  const desimal = Number.isInteger(n) ? 0 : Math.min(3, (String(n).split('.')[1]||'').length);
  return n.toLocaleString('id-ID',{minimumFractionDigits:desimal, maximumFractionDigits:desimal});
}
/* Ukur isi terpanjang kolom Sat & Vol (setelah Vol diformat akuntansi).
   Judul kolom ikut jadi lantai minimum. */
function jsSatVolLen(items){
  let satLen=3, volLen=3;   // "Sat" & "Vol"
  (items||[]).forEach(function(it){
    const sat=String((it&&it.sat)||'').trim();
    if(sat.length>satLen) satLen=sat.length;
    const vol=jsVolDoc(it&&it.vol);
    if(vol!=='-' && vol.length>volLen) volLen=vol.length;
  });
  return {satLen, volLen};
}
/* Isi terpanjang kolom "No." — judul kolom, nomor item, dan (bila aktif) label
   penomoran Judul/Sub-Judul seperti "A", "III", atau "viii". */
function jsNoLen(items,cfg){
  let noLen=2;   // judul kolom "No"
  const ukur=t=>{ const n=String(t||'').length; if(n>noLen) noLen=n; };
  jsWalk(items, cfg||{judulOn:false,subOn:false}, { judul:ukur, sub:ukur, item:ukur });
  return noLen;
}
/* Satu rumus untuk semua kolom sempit (No / Sat / Vol): lebar mengikuti isi terpanjang
   — mana pun yang lebih lebar, judul kolomnya atau datanya. Lantai minimumnya rendah
   agar kolom berisi "1" atau "Bh" tidak dipaksa melebar. */
function jsKolPct(len){ return Math.max(4, Math.min(14, Math.round(len*0.9)+2)); }
function jsKolPx(len){  return Math.max(30, Math.min(130, Math.round(len*6.2)+16)); }

/* Lebar kolom dokumen HPS (table-layout:fixed → persen). No, Sat & Vol menyesuaikan
   data terpanjang; sisa ruang diberikan ke kolom Uraian Pekerjaan. */
function jsHpsColPct(items,cfg){
  const L=jsSatVolLen(items);
  const no =jsKolPct(jsNoLen(items,cfg));
  const sat=jsKolPct(L.satLen);
  const vol=jsKolPct(L.volLen);
  const ur =Math.max(14, 100 - no - sat - vol - 55);   // 55 = lima kolom harga
  return {no, ur, sat, vol};
}
/* Lebar kolom KHUSUS tabel rincian Lampiran SPK.
   Sama seperti dokumen HPS, tetapi kolom Sat & Vol dipepatkan agar HANYA cukup untuk
   teks terpanjangnya — mana yang lebih lebar antara DATA di kolom itu atau JUDUL
   kolomnya ("Sat"/"Vol"). Seluruh sisa lebarnya dialihkan ke kolom Uraian Pekerjaan.
   Perkiraan: lebar isi Lampiran = 180mm (~680px), font 8,7px, overhead sel ~14px. */
function spkLampColPct(items,cfg){
  const L=jsSatVolLen(items);   // satLen & volLen sudah = max(3="Sat"/"Vol", data terpanjang)
  const fit=len=>Math.round(((len*5.4+14)/680*100)*10)/10;   // persen, 1 desimal
  const no =jsKolPct(jsNoLen(items,cfg));
  const sat=Math.max(4.4, fit(L.satLen));   // 4,4% = lantai agar judul "Sat" tak terpotong
  const vol=Math.max(4.4, fit(L.volLen));   // 4,4% = lantai agar judul "Vol" tak terpotong
  const ur =Math.max(14, Math.round((100 - no - sat - vol - 55)*10)/10);
  return {no, ur, sat, vol};
}
/* Lebar minimum (px) kolom No, Sat & Vol pada dokumen Analisa (table-layout auto). */
function jsAnaColPx(items,cfg){
  const L=jsSatVolLen(items);
  return {
    no:  jsKolPx(jsNoLen(items,cfg)),
    sat: jsKolPx(L.satLen),
    vol: jsKolPx(L.volLen)
  };
}
function jsNumStyleOk(v,dflt){ return (['','A','a','I','i'].indexOf(v)>=0)?v:((dflt!=null)?dflt:''); }
function jsOn(v){ return v==='Ya'; }
/* Konfigurasi judul/sub-judul dari sebuah state (HPS atau Analisa) */
function jsCfg(st){
  st=st||{};
  return {
    judulOn: jsOn(st.judulOn), judulNum: jsNumStyleOk(st.judulNum,''),
    subOn:   jsOn(st.subjudulOn), subNum: jsNumStyleOk(st.subjudulNum,'')
  };
}
/* Telusuri items →
     out.judul(no, teks, pembawa, idx)
     out.sub  (no, teks, pembawa, idx)
     out.item (no, it, idx)

   "pembawa" berisi item bila baris judul/sub-judul itu SEKALIGUS memuat harga —
   yaitu ketika itemnya tidak punya Uraian Pekerjaan. Dalam hal ini tidak ada baris
   item terpisah; Sat/Vol/Harga diisi langsung pada baris judul (atau sub-judul).
   Bila keduanya baru sekaligus, yang membawa harga adalah tingkat TERDALAM. */
function jsWalk(items,cfg,out){
  let jIdx=0,sIdx=0,iNo=0,curJ=null,curS=null;
  (items||[]).forEach(function(it,idx){
    const jTxt = cfg.judulOn ? String((it&&it.judul)||'').trim() : '';
    const sTxt = cfg.subOn   ? String((it&&it.subjudul)||'').trim() : '';
    const jBaru = !!(jTxt && jTxt.toUpperCase()!==curJ);
    const sBaru = !!(sTxt && sTxt!==curS);
    const adaUraian = String((it&&it.uraian)||'').trim()!=='';
    const bawaSub   = !adaUraian && sBaru;
    const bawaJudul = !adaUraian && !sBaru && jBaru;
    if(jBaru){
      curJ=jTxt.toUpperCase(); jIdx++; sIdx=0; iNo=0; curS=null;
      if(out.judul) out.judul(jsNumFmt(cfg.judulNum,jIdx), curJ, bawaJudul?it:null, idx);
    }
    if(sBaru){
      curS=sTxt; sIdx++; iNo=0;
      if(out.sub) out.sub(jsNumFmt(cfg.subNum,sIdx), sTxt, bawaSub?it:null, idx);
    }
    if(bawaSub||bawaJudul) return;   // harga sudah tercetak pada baris judul/sub-judul
    iNo++;
    if(out.item) out.item(iNo,it,idx);
  });
}
/* Dropdown gaya penomoran — "selebar 1 abjad" (kotak kecil) */
function jsNumSelectHtml(id,val,handler){
  val=jsNumStyleOk(val,'');
  return '<select class="js-numsel" id="'+id+'" onchange="'+handler+'(this)" title="Gaya penomoran (— = tanpa nomor)">'+
    JS_NUM_STYLES.map(function(o){ return '<option value="'+o[0]+'"'+(o[0]===val?' selected':'')+' title="'+o[1]+'">'+(o[0]||'&mdash;')+'</option>'; }).join('')+'</select>';
}
function jsYaTidakHtml(id,val,handler){
  return '<select id="'+id+'" onchange="'+handler+'(this)">'+
    '<option value="Tidak"'+(!jsOn(val)?' selected':'')+'>Tidak</option>'+
    '<option value="Ya"'+(jsOn(val)?' selected':'')+'>Ya</option></select>';
}

function hpsBlankItem(){ return {judul:'', subjudul:'', uraian:'', sat:'', vol:'', hargaMat:'', hargaJasa:''}; }
function hpsNormItem(c){ c=c||{}; return {judul:(c.judul!=null?c.judul:(c.kelompok||'')), subjudul:c.subjudul||'', uraian:c.uraian||'', sat:c.sat||'', vol:(c.vol!=null?c.vol:''), hargaMat:(c.hargaMat!=null?c.hargaMat:''), hargaJasa:(c.hargaJasa!=null?c.hargaJasa:'')}; }
function hpsBlankState(){ return { info:{}, jumlahItem:1, judulOn:'Tidak', judulNum:'', subjudulOn:'Tidak', subjudulNum:'', items:[hpsBlankItem()] }; }
let hpsState = hpsBlankState();
let hpsStep = 1;              // 1..2
let hpsEditId = null;
let hpsRevealPick = false;    // true sekali setelah "Pilih Data Pekerjaan" → animasi reveal
let hpsPreviewState = null;   // utk pratinjau record tersimpan

const HPS_STATE_KEY = 'hps_state_v1';
function hpsLoadState(){ try{ const raw=ssGet(HPS_STATE_KEY); if(raw){ const o=JSON.parse(raw); if(o&&o.info) hpsState=o; } }catch(e){} }
function hpsSaveState(){ try{ ssSet(HPS_STATE_KEY, JSON.stringify(hpsState)); }catch(e){} }
hpsLoadState();
function hpsActiveState(){ return hpsPreviewState || hpsState; }
function hpsMarkActive(){ document.querySelectorAll('.topnav-item[data-view="form-hps"]').forEach(b=>b.classList.add('active')); }

/* Pastikan panjang items sesuai jumlahItem */
function hpsEnsureItems(){
  const st=hpsState;
  if(st.judulOn!=='Ya') st.judulOn='Tidak';
  if(st.subjudulOn!=='Ya') st.subjudulOn='Tidak';
  st.judulNum=jsNumStyleOk(st.judulNum,''); st.subjudulNum=jsNumStyleOk(st.subjudulNum,'');
  const n=Math.max(1,Math.min(150, parseInt(st.jumlahItem,10)|| (Array.isArray(st.items)?st.items.length:1) ||1)); st.jumlahItem=n;
  if(!Array.isArray(st.items)) st.items=[];
  const cur=st.items.slice(); const next=[];
  for(let i=0;i<n;i++){ next.push(hpsNormItem(cur[i])); }
  st.items=next;
}

/* ---------- Penyimpanan (Supabase + fallback lokal) ---------- */
const HPS_TABLE = 'harga_perkiraan_sendiri';
const HPS_LS_KEY = 'hps_records_v1';
let records_hps = [];
let hpsUseLocal = false;
function hpsSupaReady(){ return !!(USE_SUPABASE && db); }
function hpsLocalLoad(){ try{ const r=localStorage.getItem(HPS_LS_KEY); records_hps = r?JSON.parse(r):[]; }catch(e){ records_hps=[]; } }
function hpsLocalSave(){ /* dinonaktifkan: data hanya di Supabase */ }
function hpsIsLocalId(id){ return String(id).indexOf('loc_')===0; }
const StoreHps = {
  async list(){
    if(!hpsSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(HPS_TABLE).select('*').order('created_at',{ascending:false});
    if(error) throw error; return data||[];
  },
  async create(rec){
    if(!hpsSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(HPS_TABLE).insert(rec).select();
    if(error) throw error; return data&&data[0];
  },
  async update(rid, rec){
    if(!hpsSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(HPS_TABLE).update(rec).eq('id',rid);
    if(error) throw error;
  },
  async remove(rid){
    if(!hpsSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(HPS_TABLE).delete().eq('id',rid);
    if(error) throw error;
  }
};
async function refreshDataHps(){
  try{ records_hps = await StoreHps.list(); }
  catch(err){ console.error(err); records_hps = records_hps||[]; }
}

/* ---------- Buka form / lihat data ---------- */
function openHpsInput(editId){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  hpsPreviewState=null;
  if(editId){
    const rec=(records_hps||[]).find(r=>String(r.id)===String(editId));
    hpsEditId = rec ? rec.id : null;
    hpsState = rec ? hpsRecordToState(rec) : hpsBlankState();
  }else{
    hpsEditId=null; hpsState=hpsBlankState();
    resetInputBaru('hps');
  }
  hpsStep=1; hpsEnsureItems(); hpsSaveState(); showView('form-hps');
}
function openHpsView(){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  // Penetapan Nomor ikut dimuat: Tgl. HPS tidak lagi diketik manual, melainkan
  // mengikuti tanggal terbit dokumen HPS pada menu "Ambil Nomor".
  Promise.all([refreshDataHps(), refreshDataPenetapan()]).then(()=>showView('hps-view'))
    .catch(err=>{ console.error(err); showView('hps-view'); });
}
/* Tanggal HPS efektif: pakai tgl_hps tersimpan bila ada, jika tidak ambil
   tanggal terbit dokumen HPS dari Penetapan Nomor (dicocokkan via Nama Pekerjaan). */
function hpsTglEfektif(nama, tglTersimpan){
  const t=String(tglTersimpan||'').trim(); if(t) return t;
  try{ const doc=hpscPenetapanHpsDoc(nama); if(doc && doc.tgl_terbit) return doc.tgl_terbit; }catch(e){}
  return '';
}
function hpsRecordToState(rec){
  const base=hpsBlankState();
  const s=(rec&&rec.state&&typeof rec.state==='object')?rec.state:{};
  const st={
    info: Object.assign({}, base.info, s.info||{}),
    jumlahItem: Math.max(1,Math.min(150, parseInt(s.jumlahItem,10)|| (Array.isArray(s.items)?s.items.length:1) ||1)),
    judulOn: (s.judulOn==='Ya')?'Ya':'Tidak',
    judulNum: jsNumStyleOk(s.judulNum,''),
    subjudulOn: (s.subjudulOn==='Ya')?'Ya':'Tidak',
    subjudulNum: jsNumStyleOk(s.subjudulNum,''),
    items: (Array.isArray(s.items)&&s.items.length)?s.items.map(hpsNormItem):[hpsBlankItem()]
  };
  return st;
}

/* ---------- Stepper ---------- */
function hpsStepperHtml(){
  const steps=[['1','Data Pekerjaan'],['2','Uraian Pekerjaan']];
  return '<div class="fkl-stepper">'+steps.map((s,i)=>{
    const n=i+1;
    const cls = n<hpsStep ? 'done' : (n===hpsStep ? 'active' : '');
    const mark = n<hpsStep ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>' : s[0];
    const line = i<steps.length-1 ? '<div class="fkl-step-line '+(n<hpsStep?'done':'')+'"></div>' : '';
    return '<div class="fkl-step '+cls+'"><div class="fkl-step-dot">'+mark+'</div><div class="fkl-step-name">'+s[1]+'</div></div>'+line;
  }).join('')+'</div>';
}

/* ================= LANGKAH 1: DATA PEKERJAAN ================= */
/* Field Data Pekerjaan (nama/lokasi/nilai/no_anggaran/tgl_anggaran/metode) kini
   SELALU bersumber dari menu Data Pekerjaan (dipilih lewat "Pilih Data Pekerjaan"),
   sehingga otomatis terisi & terkunci di sini (tidak diketik manual lagi). */
const HPS_DP_KEYS = DP_SHARED_KEYS;   // ['nama','lokasi','nilai','no_anggaran','tgl_anggaran','metode']
function hpsIsLocked(key){ return !!(hpsState.info && hpsState.info.dpId) && HPS_DP_KEYS.indexOf(key)>=0; }
const HPS_LOCK_BADGE='<span class="lock-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Dari Analisa</span>';
function hpsInfoInputHtml(f){
  const id='hps-'+f.key;
  const locked=hpsIsLocked(f.key);
  const span=f.span?(' style="grid-column:span '+f.span+'"'):'';
  const dis = locked ? ' disabled' : '';
  let ctl;
  if(f.type==='select') ctl='<select id="'+id+'"'+dis+' onchange="hpsOnInfoChange()"><option value="">— Pilih —</option>'+(f.options||[]).map(o=>'<option>'+fkEsc(o)+'</option>').join('')+'</select>';
  else if(f.type==='num') ctl='<input id="'+id+'" type="text" inputmode="numeric" placeholder="Rp"'+dis+' oninput="onRupiahInput(this)" onchange="hpsOnInfoChange()">';
  else if(f.type==='date') ctl='<input id="'+id+'" type="date"'+dis+' onchange="hpsOnInfoChange()">';
  else ctl='<input id="'+id+'" type="text"'+dis+' oninput="hpsOnInfoChange()">';
  return '<div class="field'+(locked?' is-locked':'')+'"'+span+'><label>'+fkEsc(f.label)+'</label>'+ctl+(locked?DP_LOCK_BADGE:'')+'</div>';
}
function hpsCountFieldHtml(){
  const st=hpsState;
  const locked=hpsItemsLocked();
  let opts=''; for(let i=1;i<=150;i++) opts+='<option value="'+i+'"'+(i===st.items.length?' selected':'')+'>'+i+' Item</option>';
  return '<div class="field'+(locked?' is-locked':'')+'"><label>Jumlah Barang/Jasa</label><select id="hps-jumlahitem"'+(locked?' disabled':'')+' onchange="hpsOnJumlahItemChange(this)">'+opts+'</select>'+(locked?HPS_LOCK_BADGE:'')+'</div>';
}
/* Dua field baru pada Data Pekerjaan: Judul? & Sub-Judul? (+ dropdown gaya penomoran) */
function hpsJudulFieldsHtml(){
  const st=hpsState; const locked=hpsItemsLocked();
  const dis=locked?' data-locked="1"':'';
  const f=(lbl,idOn,vOn,hOn,idN,vN,hN)=>
    '<div class="field js-judul-field'+(locked?' is-locked':'')+'"><label>'+lbl+'</label>'+
      '<div class="js-judul-row">'+jsYaTidakHtml(idOn,vOn,hOn)+
        (jsOn(vOn)?jsNumSelectHtml(idN,vN,hN):'')+'</div>'+
      (locked?HPS_LOCK_BADGE:'')+'</div>';
  return f('Judul?','hps-judulon',st.judulOn,'hpsOnJudulOn','hps-judulnum',st.judulNum,'hpsOnJudulNum')+
         f('Sub-Judul?','hps-subon',st.subjudulOn,'hpsOnSubOn','hps-subnum',st.subjudulNum,'hpsOnSubNum');
}
function hpsOnJudulOn(el){ if(hpsItemsLocked()){ el.value=hpsState.judulOn; toast('Mengikuti Analisa terpilih','warn'); return; } hpsState.judulOn=(el.value==='Ya')?'Ya':'Tidak'; hpsSaveState(); renderHpsForm(); }
function hpsOnSubOn(el){ if(hpsItemsLocked()){ el.value=hpsState.subjudulOn; toast('Mengikuti Analisa terpilih','warn'); return; } hpsState.subjudulOn=(el.value==='Ya')?'Ya':'Tidak'; hpsSaveState(); renderHpsForm(); }
function hpsOnJudulNum(el){ hpsState.judulNum=jsNumStyleOk(el.value,''); hpsSaveState(); }
function hpsOnSubNum(el){ hpsState.subjudulNum=jsNumStyleOk(el.value,''); hpsSaveState(); }

function hpsOnInfoChange(){
  const st=hpsState;
  HPS_INFO_FIELDS.forEach(f=>{ if(hpsIsLocked(f.key)) return; const el=document.getElementById('hps-'+f.key); if(!el) return; st.info[f.key]=(f.type==='num')?parseRupiah(el.value):el.value.trim(); });
  hpsSaveState();
}
/* Bar wajib "Pilih Data Pekerjaan" — sumber nama/lokasi/nilai/no.anggaran/tgl.anggaran/metode. */
function hpsDpBarHtml(){
  const info=hpsState.info||{};
  const dipilih = info.dpId ? String(info.dpNama||info.nama||'').trim() : '';
  const sub = dipilih
    ? ('Data pekerjaan terisi otomatis & terkunci dari: <b style="color:var(--teal-dark)">'+fkEsc(dipilih)+'</b>')
    : 'Opsional — pilih Data Pekerjaan agar kolom Nama/Lokasi/Nilai/No. Anggaran/Tgl. Anggaran/Metode terisi otomatis, atau isi manual pada kolom di bawah.';
  let btns='<button type="button" class="btn btn-teal" style="padding:8px 14px;font-size:11.5px" onclick="hpsPilihDp()">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M4 4h5l2 3h9a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>'+(dipilih?'Ganti Data Pekerjaan':'Pilih Data Pekerjaan')+'</button>';
  if(dipilih) btns+='<button type="button" class="btn btn-unpick" style="padding:8px 14px;font-size:11.5px" onclick="hpsLepasDp()">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M18 6 6 18M6 6l12 12"/></svg>Lepas Pilihan</button>';
  return '<div class="hps-analisa-bar">'+
    '<div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h5l2 3h9a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg></div>'+
    '<div class="tx"><b>Pilih Data Pekerjaan</b><span>'+sub+'</span></div>'+btns+
  '</div>';
}
function hpsPilihDp(){ openDpPicker('hps'); }
/* Dipanggil oleh dpPickerSelect() saat sebuah Data Pekerjaan dipilih untuk Hitung HPS */
function hpsApplyDp(rec){
  const st=hpsState; st.info=st.info||{};
  const info=(rec.state&&rec.state.info)||{};
  HPS_DP_KEYS.forEach(k=>{ st.info[k]=(info[k]!=null?info[k]:''); });
  st.info.dpId=String(rec.id);
  st.info.dpNama=rec.nama_pekerjaan||info.nama||'';
  hpsSaveState();
  hpsRevealPick=true;   // pemicu animasi reveal konten di bawah tombol
  // Tautkan otomatis ke Analisa milik Data Pekerjaan ini. Kategori "Pekerjaan Umum"
  // langsung mengisi & mengunci Jumlah Barang/Jasa + Uraian Pekerjaan + harga;
  // kategori "Pekerjaan Konstruksi" tidak (semua tetap manual).
  refreshDataAnalisa().then(()=>{
    const aRec=hpsCariAnalisaUntukDp(st.info.dpId, st.info.dpNama);
    if(aRec) hpsTerapkanAnalisa(aRec);
    renderHpsForm();
    if(aRec && st.info.analisaJenis==='Umum') toast('Data pekerjaan berhasil diterapkan (beserta analisa)','ok');
    else toast('Data pekerjaan berhasil diterapkan','ok');
  }).catch(()=>{ renderHpsForm(); toast('Data pekerjaan berhasil diterapkan','ok'); });
}
/* Lepas pilihan Data Pekerjaan → kembali ke kondisi belum dipilih (wajib pilih ulang) */
function hpsLepasDp(){
  const st=hpsState; if(!st.info) return;
  delete st.info.dpId; delete st.info.dpNama;
  // Tautan Analisa ikut dilepas: kunci Jumlah Barang/Jasa & Uraian Pekerjaan dibuka kembali
  delete st.info.analisaId; delete st.info.analisaNama; delete st.info.analisaJenis;
  HPS_DP_KEYS.forEach(k=>{ st.info[k]=''; });
  hpsSaveState(); renderHpsForm();
  toast('Pilihan Data Pekerjaan dilepas','ok');
}
function hpsOnJumlahItemChange(el){
  if(hpsItemsLocked()) return; // jumlah item mengikuti Analisa terpilih, tidak dapat diubah manual
  const n=Math.max(1,Math.min(150,parseInt(el.value,10)||1));
  const st=hpsState; const cur=st.items.slice(); const next=[];
  for(let i=0;i<n;i++){ next.push(hpsNormItem(cur[i])); }
  st.items=next; st.jumlahItem=n; hpsSaveState();
}

/* ================= HITUNGAN (Material / Jasa / Total) ================= */
function hpsNum(v){ if(v===''||v==null) return 0; if(typeof v==='number') return v; const n=parseFloat(String(v).replace(/,/g,'.')); return isNaN(n)?0:n; }
function hpsRp(n){ n=Math.round(hpsNum(n)); return n>0 ? ('Rp '+n.toLocaleString('id-ID')) : '–'; }
function hpsRpDoc(n){ var x=hpsNum(n); if(!(x>0)) return '-'; var dec=Number.isInteger(x)?0:Math.min(2,(String(x).split('.')[1]||'').length); return x.toLocaleString('id-ID',{minimumFractionDigits:dec,maximumFractionDigits:dec}); }
function hpsItemMat(it){ return Math.round(jsVolNum(it&&it.vol)*hpsNum(it&&it.hargaMat)); }   // 7 = 4 x 5
function hpsItemJasa(it){ return Math.round(jsVolNum(it&&it.vol)*hpsNum(it&&it.hargaJasa)); }  // 8 = 4 x 6
function hpsItemTotal(it){ return hpsItemMat(it)+hpsItemJasa(it); }                          // 9 = 7 + 8
/* Ringkasan bawah — dihitung dari penjumlahan vertikal kolom Jumlah Harga */
function hpsSummary(st){
  st=st||hpsState;
  let jM=0,jJ=0;
  (st.items||[]).forEach(it=>{ jM+=hpsItemMat(it); jJ+=hpsItemJasa(it); });
  const jT=jM+jJ;
  const dppM=Math.round(jM*11/12), dppJ=Math.round(jJ*11/12), dppT=Math.round(jT*11/12);
  const ppnM=Math.round(dppM*0.12), ppnJ=Math.round(dppJ*0.12), ppnT=Math.round(dppT*0.12);
  const totM=jM+ppnM, totJ=jJ+ppnJ, totT=jT+ppnT;
  return {jM,jJ,jT, dppM,dppJ,dppT, ppnM,ppnJ,ppnT, totM,totJ,totT};
}
/* Terbilang (angka -> kata, Bahasa Indonesia). Dipakai pada baris "Terbilang :". */
function hpsTerbilangKata(x){
  x=Math.floor(Math.abs(Number(x)||0));
  const sat=['','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh','sebelas'];
  if(x<12) return sat[x];
  if(x<20) return hpsTerbilangKata(x-10)+' belas';
  if(x<100) return hpsTerbilangKata(Math.floor(x/10))+' puluh'+(x%10?' '+sat[x%10]:'');
  if(x<200) return 'seratus'+(x-100?' '+hpsTerbilangKata(x-100):'');
  if(x<1000) return sat[Math.floor(x/100)]+' ratus'+(x%100?' '+hpsTerbilangKata(x%100):'');
  if(x<2000) return 'seribu'+(x-1000?' '+hpsTerbilangKata(x-1000):'');
  if(x<1000000) return hpsTerbilangKata(Math.floor(x/1000))+' ribu'+(x%1000?' '+hpsTerbilangKata(x%1000):'');
  if(x<1000000000) return hpsTerbilangKata(Math.floor(x/1000000))+' juta'+(x%1000000?' '+hpsTerbilangKata(x%1000000):'');
  if(x<1000000000000) return hpsTerbilangKata(Math.floor(x/1000000000))+' miliar'+(x%1000000000?' '+hpsTerbilangKata(x%1000000000):'');
  return hpsTerbilangKata(Math.floor(x/1000000000000))+' triliun'+(x%1000000000000?' '+hpsTerbilangKata(x%1000000000000):'');
}
function hpsTitleCase(s){ return String(s||'').replace(/\s+/g,' ').trim().split(' ').map(w=>w?w.charAt(0).toUpperCase()+w.slice(1):w).join(' '); }
function hpsTerbilangRupiah(n){
  n=Math.round(hpsNum(n));
  const kata = n<=0 ? 'nol' : hpsTerbilangKata(n);
  return hpsTitleCase(kata)+' Rupiah';
}

/* ================= LANGKAH 2: URAIAN PEKERJAAN (gaya RAB/HPS) ================= */
/* Selalu selaraskan Harga Barang/Jasa terkunci dengan hasil Analisa terbaru (sudah termasuk
   ROK + Inflasi) sebelum tabel dirender — agar nilai HPS = "Jumlah Harga Barang/Jasa" pada
   Hasil Analisa, bukan nilai lama yang tersimpan saat pertama diimpor. */
function hpsResyncLockedHarga(st){
  st=st||hpsState;
  if(!st.info||!st.info.analisaId||st.info.analisaJenis!=='Umum') return;
  let aSt=null;
  // Utamakan state Analisa yang SEDANG dibuka di editor bila mengacu ke analisa yang sama,
  // agar perubahan (mis. ROK) langsung tercermin di HPS tanpa perlu menyimpan ulang.
  if(typeof anaEditId!=='undefined' && anaEditId!=null && String(anaEditId)===String(st.info.analisaId) && anaState && typeof anaState==='object'){
    aSt=anaState;
  } else {
    const rec=(typeof records_ana!=='undefined'&&records_ana||[]).find(r=>String(r.id)===String(st.info.analisaId));
    if(!rec) return;
    aSt=(rec.state&&typeof rec.state==='object')?rec.state:{};
  }
  const struct=(aSt.refs&&aSt.refs[0]&&Array.isArray(aSt.refs[0].items))?aSt.refs[0].items:[];
  let changed=false;
  (st.items||[]).forEach((item,i)=>{
    if(i>=struct.length) return;
    const res=anaResultForState(aSt,i);
    const nm=(res.hargaBarang||''), nj=(res.hargaJasa||'');
    if(item.hargaMat!==nm){ item.hargaMat=nm; changed=true; }
    if(item.hargaJasa!==nj){ item.hargaJasa=nj; changed=true; }
  });
  if(changed && st===hpsState) hpsSaveState();
}
function hpsUraianTableHtml(){
  const st=hpsState;
  hpsResyncLockedHarga(st);
  const itemsLocked=hpsItemsLocked();
  const hargaLocked=hpsHargaLocked();
  const dis1=itemsLocked?' disabled':'';
  const disH=hargaLocked?' disabled':'';
  const clsKUSV=itemsLocked?' hps-cell-locked':'';
  const clsHarga=hargaLocked?' hps-cell-locked':'';
  const jOn=jsOn(st.judulOn), sOn=jsOn(st.subjudulOn);
  let rows='';
  st.items.forEach((it,i)=>{
    rows+='<tr>'+
      '<td class="c-no">'+(i+1)+'</td>'+
      (jOn?('<td class="c-kel'+clsKUSV+'"><input type="text" data-i="'+i+'" placeholder="mis. PEKERJAAN PERSIAPAN" value="'+fkEsc(it.judul||'')+'" oninput="hpsOnJudul(this)"'+dis1+'></td>'):'')+
      (sOn?('<td class="c-kel'+clsKUSV+'"><input type="text" data-i="'+i+'" placeholder="mis. Material Utama" value="'+fkEsc(it.subjudul||'')+'" oninput="hpsOnSubjudul(this)"'+dis1+'></td>'):'')+
      '<td class="c-ur'+clsKUSV+'"><textarea data-i="'+i+'" rows="1" placeholder="Uraian pekerjaan / barang / jasa ke-'+(i+1)+'" oninput="hpsOnUraian(this)"'+dis1+'>'+fkEsc(it.uraian||'')+'</textarea></td>'+
      '<td class="c-sat'+clsKUSV+'"><input type="text" data-i="'+i+'" placeholder="Bh" value="'+fkEsc(it.sat||'')+'" oninput="hpsOnSat(this)"'+dis1+'></td>'+
      '<td class="c-vol'+clsKUSV+'"><input type="text" inputmode="decimal" data-i="'+i+'" placeholder="0" value="'+fkEsc(it.vol!=null?String(it.vol):'')+'" oninput="hpsOnVol(this)"'+dis1+'></td>'+
      '<td class="c-money'+clsHarga+'"><input type="text" inputmode="numeric" id="hps-hm-'+i+'" data-i="'+i+'" placeholder="Rp" value="'+rupiahInputText(it.hargaMat)+'" oninput="hpsOnHargaMat(this)"'+disH+'></td>'+
      '<td class="c-money'+clsHarga+'"><input type="text" inputmode="numeric" id="hps-hj-'+i+'" data-i="'+i+'" placeholder="Rp" value="'+rupiahInputText(it.hargaJasa)+'" oninput="hpsOnHargaJasa(this)"'+disH+'></td>'+
    '</tr>';
  });
  const note='';
  return note+'<div class="hps-uraian-wrap"><table class="hps-uraian"><thead>'+
    '<tr><th class="c-no">No</th>'+(jOn?'<th>Judul</th>':'')+(sOn?'<th>Sub-Judul</th>':'')+'<th class="c-ur">Uraian Pekerjaan</th><th>Sat</th><th>Vol</th>'+
      '<th>Harga<br>Barang</th><th>Harga<br>Jasa</th></tr>'+
    '</thead><tbody>'+rows+'</tbody></table></div>';
}
function hpsRecalcRow(i){
  const it=hpsState.items[i]; if(!it) return;
  const c=document.getElementById('hps-jt-'+i); if(c) c.innerHTML=hpsRp(hpsItemTotal(it));
  hpsRenderSummary();
}
function hpsOnJudul(el){ if(hpsItemsLocked()) return; const i=+el.dataset.i; if(hpsState.items[i]){ hpsState.items[i].judul=el.value; hpsSaveState(); } }
function hpsOnSubjudul(el){ if(hpsItemsLocked()) return; const i=+el.dataset.i; if(hpsState.items[i]){ hpsState.items[i].subjudul=el.value; hpsSaveState(); } }
function hpsOnUraian(el){ if(hpsItemsLocked()) return; const i=+el.dataset.i; if(hpsState.items[i]){ hpsState.items[i].uraian=el.value; hpsSaveState(); } }
function hpsOnSat(el){ if(hpsItemsLocked()) return; const i=+el.dataset.i; if(hpsState.items[i]){ hpsState.items[i].sat=el.value; hpsSaveState(); } }
/* Ketikan Vol dibiarkan apa adanya selagi mengetik (agar "2." atau "1.2" tidak
   dipotong), namun yang DISIMPAN adalah hasil jsVolNum: "13.970" → 13970, "2,5" → 2.5. */
function hpsOnVol(el){
  if(hpsItemsLocked()) return;
  let v=el.value.replace(/[^0-9.,]/g,'');
  el.value=v;
  const i=+el.dataset.i;
  if(hpsState.items[i]){ hpsState.items[i].vol=(v===''?'':String(jsVolNum(v))); hpsSaveState(); hpsRecalcRow(i); }
}
function hpsOnHargaMat(el){ if(hpsHargaLocked()) return; onRupiahInput(el); const i=+el.dataset.i; if(hpsState.items[i]){ hpsState.items[i].hargaMat=parseRupiah(el.value); hpsSaveState(); hpsRecalcRow(i); } }
function hpsOnHargaJasa(el){ if(hpsHargaLocked()) return; onRupiahInput(el); const i=+el.dataset.i; if(hpsState.items[i]){ hpsState.items[i].hargaJasa=parseRupiah(el.value); hpsSaveState(); hpsRecalcRow(i); } }

/* Ringkasan langsung (Jumlah / DPP / PPn / Jumlah Total) di bawah tabel input */
function hpsSummaryPanelHtml(){
  return '<div class="hps-sum-card" id="hps-sum-card">'+
    '<div class="hps-sum-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16M4 9h16M4 14h10M4 19h7"/></svg>Rekapitulasi Nilai HPS</div>'+
    '<div id="hps-sum-body"></div></div>';
}
function hpsRenderSummary(){
  const body=document.getElementById('hps-sum-body'); if(!body) return;
  const s=hpsSummary(hpsState);
  const row=(lbl,mat,jasa,tot,cls)=>'<tr'+(cls?' class="'+cls+'"':'')+'>'+
    '<td class="lbl">'+lbl+'</td>'+
    '<td class="val">'+hpsRp(mat)+'</td>'+
    '<td class="val">'+hpsRp(jasa)+'</td>'+
    '<td class="val">'+hpsRp(tot)+'</td></tr>';
  body.innerHTML='<table class="hps-sum"><thead><tr>'+
      '<td class="lbl" style="color:#7c8a8f;font-weight:800;font-size:10.5px;text-transform:uppercase">Uraian</td>'+
      '<td class="val" style="color:#7c8a8f;font-weight:800;font-size:10.5px;text-transform:uppercase">Barang</td>'+
      '<td class="val" style="color:#7c8a8f;font-weight:800;font-size:10.5px;text-transform:uppercase">Jasa</td>'+
      '<td class="val" style="color:#7c8a8f;font-weight:800;font-size:10.5px;text-transform:uppercase">Total</td></tr></thead><tbody>'+
      row('Jumlah', s.jM, s.jJ, s.jT)+
      row('DPP (11/12 × Jumlah)', s.dppM, s.dppJ, s.dppT)+
      row('PPn 12% (12% × DPP)', s.ppnM, s.ppnJ, s.ppnT)+
      row('Jumlah Total (Jumlah + PPn)', s.totM, s.totJ, s.totT, 'grand')+
    '</tbody></table>'+
    '<div class="hps-terbilang"><b>Terbilang :</b> '+fkEsc(hpsTerbilangRupiah(s.totT))+'</div>';
}

/* ---------- Render form ---------- */
function renderHpsForm(){
  hpsMarkActive();
  hpsEnsureItems();
  const tt=document.getElementById('hps-title'); if(tt) tt.textContent='Perhitungan HPS'+(hpsEditId?' — Ubah Data':' — Hitung HPS');
  const sub=document.getElementById('hps-sub');
  const cont=document.getElementById('hps-content'); if(!cont) return;
  const st=hpsState;
  // MODE UBAH DATA (hpsEditId aktif): field Data Pekerjaan selalu ditampilkan —
  // walau record lama belum tertaut dpId — sehingga tombol Edit dari "Lihat HPS"
  // selalu membuka form yang sudah terisi (tidak terkunci di balik "Pilih Data
  // Pekerjaan"). Alur "Hitung HPS" (buat baru) tidak berubah: tetap wajib
  // "Pilih Data Pekerjaan" dahulu.
  const showBody = true;
  const rev = (hpsRevealPick && showBody) ? ' dp-reveal dp-reveal-d1' : '';
  let html='';   // Stepper (indikator langkah bernomor) dihilangkan pada Perhitungan HPS
  if(hpsStep===1){
    if(sub) sub.textContent='Langkah 1 dari 2 — Pilih data pekerjaan';
    html+='<div class="form-card"><div class="form-section-title">'+KR_SECTION_ICON+'Data Pekerjaan'+dpPickBtnHtml('hps')+'</div>';
    if(showBody){
      html+='<div class="form-flow'+rev+'" style="--cols:4">';
      html+=HPS_DP_FIELDS.map(hpsInfoInputHtml).join('');
      // Field "Tgl. HPS" tidak lagi ditampilkan di form — tanggal HPS otomatis mengikuti Nomor/Penetapan HPS.
      html+=hpsCountFieldHtml();
      html+=hpsJudulFieldsHtml();
      html+='</div>';
    }
    html+='</div>';
    html+=hpsActionsHtml({back:false});
  } else {
    if(sub) sub.textContent='Langkah 2 dari 2 — Uraian pekerjaan, satuan, volume & harga satuan';
    html+='<div class="form-card"><div class="form-section-title">'+FKL_SEC_ICON+'Uraian Pekerjaan <span class="fkl-count-chip">'+st.items.length+' item</span></div>'+
      hpsAnalisaBarHtml()+
      hpsUraianTableHtml()+
      hpsSummaryPanelHtml()+'</div>';
    html+=hpsActionsHtml({back:true, save:true});
  }
  cont.innerHTML=html;
  hpsRevealPick=false;   // animasi reveal hanya dijalankan sekali
  if(hpsStep===1){
    HPS_INFO_FIELDS.forEach(f=>{ const el=document.getElementById('hps-'+f.key); if(!el) return; const v=st.info[f.key]; el.value=(f.type==='num')?rupiahInputText(v):(v!=null?v:''); });
  } else {
    hpsRenderSummary();
  }
}
/* Tombol pemicu "Pilih Analisa" — mengambil data dari Analisa Harga tersimpan. */
function hpsAnalisaBarHtml(){
  const info=hpsState.info||{};
  const dipilih=(info.analisaId)?String(info.analisaNama||'').trim():'';
  const jenisTxt = dipilih ? (info.analisaJenis==='Konstruksi'?'Pekerjaan Konstruksi':'Pekerjaan Umum') : '';
  const sub = dipilih
    ? (info.analisaJenis==='Konstruksi'
        ? ('Tertaut ke analisa: <b style="color:var(--teal-dark)">'+fkEsc(dipilih)+'</b> — kategori <b>'+jenisTxt+'</b>. Jumlah Barang/Jasa &amp; Uraian Pekerjaan diisi manual (analisa berbasis AHSP).')
        : ('Jumlah Barang/Jasa &amp; Uraian Pekerjaan (Judul/Sub-Judul/Uraian/Sat/Vol) terisi otomatis &amp; terkunci dari analisa: <b style="color:var(--teal-dark)">'+fkEsc(dipilih)+'</b> — kategori <b>'+jenisTxt+'</b> (harga ikut terkunci, sudah termasuk ROK)'))
    : 'Opsional — untuk kategori <b>Pekerjaan Umum</b>, Jumlah Barang/Jasa, Uraian Pekerjaan &amp; harga terisi otomatis dari Analisa Harga tersimpan.';
  let btns='';
  btns+='<button type="button" class="btn btn-teal" style="padding:8px 14px;font-size:11.5px" onclick="hpsPilihAnalisa()">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.8L7 14.3"/></svg>'+(dipilih?'Ganti Analisa':'Pilih Analisa')+'</button>';
  if(dipilih) btns+='<button type="button" class="btn btn-unpick" style="padding:8px 14px;font-size:11.5px" onclick="hpsLepasAnalisa()">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M18 6 6 18M6 6l12 12"/></svg>Lepas Pilihan</button>';
  return '<div class="hps-analisa-bar" style="justify-content:flex-end">'+btns+
  '</div>';
}

/* Buka modal pilih analisa (daftar nama pekerjaan dari Analisa Harga tersimpan). */
function hpsPilihAnalisa(){
  refreshDataAnalisa().then(()=>{
    const ov=document.getElementById('hps-ana-overlay'); if(!ov) return;
    const srch=document.getElementById('hps-ana-search'); if(srch) srch.value='';
    renderHpsAnaPickerList();
    ov.classList.add('show');
  });
}
function closeHpsAnaPicker(){ const ov=document.getElementById('hps-ana-overlay'); if(ov) ov.classList.remove('show'); }
function renderHpsAnaPickerList(){
  const list=document.getElementById('hps-ana-list'); if(!list) return;
  const fs=(document.getElementById('hps-ana-search')?.value||'').toLowerCase().trim();
  let rows=(records_ana||[]).slice();
  if(fs) rows=rows.filter(r=>String(r.nama_pekerjaan||(r.state&&r.state.info&&r.state.info.nama)||'').toLowerCase().includes(fs));
  if(!rows.length){ list.innerHTML='<div class="hps-ana-empty">Belum ada data Analisa tersimpan.<br>Silakan buat lewat menu <b>Analisa Harga</b> terlebih dahulu.</div>'; return; }
  list.innerHTML=rows.map(r=>{
    const stt=r.state||{}; const info=stt.info||{};
    const nama=r.nama_pekerjaan||info.nama||'—';
    const lokasi=(r.lokasi||info.lokasi||'').trim();
    const ji=(r.jumlah_item!=null)?r.jumlah_item:(stt.jumlahItem||0);
    const jr=(r.jumlah_referensi!=null)?r.jumlah_referensi:(stt.jumlahRef||0);
    const rid=fkEsc(String(r.id));
    return '<div class="hps-ana-item" onclick="hpsAmbilAnalisa(\''+rid+'\')">'+
      '<div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.8L7 14.3"/></svg></div>'+
      '<div class="tx"><b>'+fkEsc(nama)+'</b><span>'+fkEsc(lokasi||'—')+' • '+ji+' barang/jasa • '+jr+' referensi</span></div>'+
      '<div class="go"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></div>'+
    '</div>';
  }).join('');
}
/* Apakah kolom Kelompok/Uraian/Sat/Vol pada tabel Uraian Pekerjaan HPS sedang terkunci
   (otomatis terisi dari Analisa yang dipilih). Berlaku untuk SEMUA kategori (Umum & Konstruksi). */
/* Uraian Pekerjaan (Jumlah Barang/Jasa, Judul/Sub-Judul, Uraian, Sat, Vol) terisi
   otomatis & terkunci HANYA bila Analisa yang dipilih berkategori "Pekerjaan Umum".
   Untuk "Pekerjaan Konstruksi" strukturnya tidak diimpor — semua diisi manual,
   karena analisanya berbasis AHSP (bukan daftar barang/jasa). */
function hpsItemsLocked(){ return !!(hpsState.info && hpsState.info.analisaId && hpsState.info.analisaJenis==='Umum'); }
/* Harga Sat. Barang & Jasa ikut terkunci pada kondisi yang sama (sudah termasuk ROK). */
function hpsHargaLocked(){ return hpsItemsLocked(); }

/* Ambil data pekerjaan dari analisa terpilih → isi & kunci kolom yang sama pada HPS,
   termasuk baris Uraian Pekerjaan (Kelompok/Uraian/Sat/Vol selalu ikut terkunci; Harga Sat.
   Material & Jasa — sudah termasuk ROK — ikut terkunci hanya bila kategori Analisa "Umum"). */
function hpsAmbilAnalisa(id){
  const rec=(records_ana||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  hpsTerapkanAnalisa(rec);
  closeHpsAnaPicker();
  renderHpsForm();
  toast('Data pekerjaan diambil dari analisa: '+(hpsState.info.analisaNama||''),'ok');
}
/* Terapkan sebuah record Analisa ke hpsState (tanpa menyentuh UI). */
function hpsTerapkanAnalisa(rec){
  const aSt=(rec.state&&typeof rec.state==='object')?rec.state:{};
  const aInfo=aSt.info||{};
  const st=hpsState; st.info=st.info||{};
  st.info.analisaId=String(rec.id);
  st.info.analisaNama=rec.nama_pekerjaan||aInfo.nama||'';
  st.info.analisaJenis=(aSt.jenis==='Konstruksi')?'Konstruksi':'Umum';
  const hargaLocked=(st.info.analisaJenis==='Umum');
  const pakaiStruktur=hargaLocked;   // Konstruksi: struktur tidak diimpor
  // Umum → struktur diambil dari refs[0].items (sama di semua referensi), lengkap dengan
  //         Vol serta harga hasil rata-rata/terendah + ROK.
  // Konstruksi → tidak diimpor: analisanya berbasis AHSP, bukan daftar barang/jasa.
  //         Jumlah Barang/Jasa, Judul?, Sub-Judul?, dan Uraian Pekerjaan tetap diisi manual,
  //         dan pilihan yang sudah dibuat pengguna TIDAK ditimpa.
  if(!pakaiStruktur){ hpsSaveState(); return; }
  const struct = (aSt.refs&&aSt.refs[0]&&Array.isArray(aSt.refs[0].items))?aSt.refs[0].items:[];
  // Ikuti pengaturan Judul / Sub-Judul dari Analisa terpilih (khusus Pekerjaan Umum)
  st.judulOn    = (aSt.judulOn==='Ya')?'Ya':'Tidak';
  st.judulNum   = jsNumStyleOk(aSt.judulNum,'');
  st.subjudulOn = (aSt.subjudulOn==='Ya')?'Ya':'Tidak';
  st.subjudulNum= jsNumStyleOk(aSt.subjudulNum,'');
  if(struct.length){
    st.items=struct.map((it,i)=>{
      const res=hargaLocked?anaResultForState(aSt,i):null;
      return {
        judul: it.judul||'',
        subjudul: it.subjudul||'',
        uraian: it.uraian||'',
        sat: it.sat||'',
        vol: it.vol!=null?it.vol:'',
        hargaMat: hargaLocked?(res.hargaBarang||''):'',
        hargaJasa: hargaLocked?(res.hargaJasa||''):''
      };
    });
    st.jumlahItem=st.items.length;
  }
  hpsSaveState();
}
/* Cari Analisa tersimpan yang tertaut ke Data Pekerjaan (dpId), cadangan: Nama Pekerjaan. */
function hpsCariAnalisaUntukDp(dpId, nama){
  const list=(typeof records_ana!=='undefined' && records_ana) ? records_ana : [];
  const byDp=list.find(r=>{ const i=(r.state&&r.state.info)||{}; return i.dpId && String(i.dpId)===String(dpId); });
  if(byDp) return byDp;
  const nm=String(nama||'').trim().toLowerCase(); if(!nm) return null;
  return list.find(r=>String(r.nama_pekerjaan||'').trim().toLowerCase()===nm) || null;
}
/* Lepas pilihan analisa → kolom kembali bisa diinput (nilai tetap, tidak dihapus). */
function hpsLepasAnalisa(){
  const st=hpsState; if(!st.info) return;
  delete st.info.analisaId; delete st.info.analisaNama; delete st.info.analisaJenis;
  hpsSaveState(); renderHpsForm();
  toast('Pilihan analisa dilepas — kolom dapat diinput kembali','ok');
}
function openHpsAnalisa(){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  toast('Modul Analisa masih dalam pengembangan','warn');
}
function hpsActionsHtml(o){
  o=o||{};
  // Batal (merah) berdampingan dengan tombol navigasi di pojok kanan
  let right='<button class="btn btn-red" onclick="hpsBatal()">'+FKL_IC_X+'Batal</button>';
  if(o.back) right+='<button class="btn btn-light" onclick="hpsBack()">'+FKL_IC_BACK+'Kembali</button>';
  if(o.save) right+='<button class="btn btn-green" onclick="hpsSimpan()">'+FKL_IC_SAVE+'Simpan &amp; Lihat PDF</button>';
  else right+='<button class="btn btn-teal" onclick="hpsNext()">Selanjutnya'+FKL_IC_NEXT+'</button>';
  return '<div class="fkl-actions"><div class="fkl-actions-right">'+right+'</div></div>';
}

/* ---------- Navigasi ---------- */
function hpsNext(){
  const st=hpsState;
  if(hpsStep===1){
    hpsOnInfoChange();
    if(!String(st.info.nama||'').trim()){ toast('Nama Pekerjaan wajib diisi','warn'); return; }
    hpsEnsureItems(); hpsStep=2;
  }
  renderHpsForm(); hpsScrollTop();
}
function hpsBack(){ if(hpsStep>1){ hpsStep--; renderHpsForm(); hpsScrollTop(); } }
function hpsScrollTop(){ const v=document.getElementById('view-form-hps'); if(v) v.scrollIntoView({behavior:'smooth',block:'start'}); }
function hpsBatal(){
  openConfirm({ icon:'del', title:'Batalkan Proses',
    text:'Batalkan proses ini? Data yang belum disimpan akan hilang.',
    onYes:()=>{ hpsEditId=null; hpsState=hpsBlankState(); hpsSaveState(); hpsStep=1; openHpsView(); toast('Proses dibatalkan','ok'); }
  });
}

/* ---------- Simpan ---------- */
async function hpsSimpan(){
  if(!requireInput()) return;
  const st=hpsState; const info=st.info||{}; const nama=String(info.nama||'').trim();
  if(!nama){ toast('Nama Pekerjaan wajib diisi','warn'); hpsStep=1; renderHpsForm(); return; }
  hpsEnsureItems();
  const _sum=hpsSummary(st);
  const rec={
    nama_pekerjaan: nama,
    lokasi: info.lokasi||'',
    metode: info.metode||'',
    jumlah_item: st.items.length,
    nilai_total: _sum.totT,
    tgl_hps: info.tgl_hps||'',
    tgl_input: (new Date()).toISOString().slice(0,10),
    state: JSON.parse(JSON.stringify(st))
  };
  let saved=null;
  try{
    await withActionLoader(hpsEditId?'Menyimpan perubahan':'Menyimpan', async()=>{
      if(hpsEditId){ await StoreHps.update(hpsEditId, rec); }
      else { saved=await StoreHps.create(rec); }
      await refreshDataHps();
    });
  }catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'err'); return; }
  toast(hpsEditId?'Data berhasil diperbarui':'Data berhasil disimpan','ok');
  const savedId = hpsEditId || (saved && saved.id);
  hpsEditId=null; hpsState=hpsBlankState(); hpsSaveState(); hpsStep=1;
  showView('hps-view');
  setTimeout(()=>{ if(savedId!=null) hpsPreviewRecord(savedId); }, 420);
}

/* ================= LIHAT HPS ================= */
let hpsViewPage=1;
const HPS_VIEW_PAGE_SIZE=8;
function hpsDateLong(s){ return pnwDateLong(s); }
function hpsViewRows(){
  let rows=(records_hps||[]).slice();
  const fs=(document.getElementById('hps-view-search')?.value||'').toLowerCase().trim();
  if(fs) rows=rows.filter(r=>String(r.nama_pekerjaan||(r.state&&r.state.info&&r.state.info.nama)||'').toLowerCase().includes(fs));
  return rows;
}
function hpsEmptyRow(){
  return '<tr><td colspan="8"><div class="empty">'+
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/></svg>'+
    '<div>Data tidak tersedia</div></div></td></tr>';
}
function renderHpsView(){
  const tb=document.getElementById('hps-view-body');
  const pg=document.getElementById('hps-view-pagination');
  const cEl=document.getElementById('hps-view-count');
  if(!tb) return;
  /* Kolom "JUMLAH ITEM" dihapus. Judul kolomnya didefinisikan pada HTML shell,
     jadi dibuang di sini saat render (idempoten: bila sudah tidak ada, tak ada yang
     dicocokkan). Sel datanya sudah tidak lagi dirender di baris tabel. */
  try{
    const _tbl=tb.closest('table');
    if(_tbl){
      const _ths=_tbl.querySelectorAll('thead th, thead td');
      for(let _i=0;_i<_ths.length;_i++){
        const _t=(_ths[_i].textContent||'').replace(/[^a-z]/gi,'').toLowerCase();
        if(_t.indexOf('jumlahitem')>=0){ _ths[_i].parentNode.removeChild(_ths[_i]); break; }
      }
    }
  }catch(e){}
  const rows=hpsViewRows();
  if(cEl) cEl.textContent=rows.length;
  if(!rows.length){ tb.innerHTML=hpsEmptyRow(); if(pg) pg.innerHTML=''; return; }
  const totalPages=Math.max(1,Math.ceil(rows.length/HPS_VIEW_PAGE_SIZE));
  if(hpsViewPage>totalPages) hpsViewPage=totalPages;
  if(hpsViewPage<1) hpsViewPage=1;
  const start=(hpsViewPage-1)*HPS_VIEW_PAGE_SIZE;
  const pageRows=rows.slice(start,start+HPS_VIEW_PAGE_SIZE);
  tb.innerHTML=pageRows.map((r,i)=>{
    const stt=r.state||{}; const info=stt.info||{};
    const nama=r.nama_pekerjaan||info.nama||'—';
    const lokasi=(r.lokasi||info.lokasi||'').trim();
    const metode=r.metode||info.metode||'';
    const ji=(r.jumlah_item!=null)?r.jumlah_item:((stt.items&&stt.items.length)||0);
    // Bila HPS ini tertaut ke Analisa (Pekerjaan Umum), hitung ulang nilainya dari
    // hasil Analisa TERKINI (mis. perubahan ROK / harga satuan) sebelum ditampilkan,
    // agar total di daftar ikut berubah otomatis. Jangan pakai nilai_total tersimpan
    // yang bisa basi karena dibekukan saat HPS terakhir disimpan.
    const linkedUmum = !!(info.analisaId && info.analisaJenis==='Umum');
    if(linkedUmum) hpsResyncLockedHarga(stt);
    const sum=hpsSummary(stt);           // rincian Harga Barang (jM) & Harga Jasa (jJ)
    const nilai = linkedUmum
      ? sum.totT
      : ((r.nilai_total!=null)?r.nilai_total:sum.totT);   // Harga Total HPS (dengan PPN)
    const tgl=hpsTglEfektif(nama, r.tgl_hps||info.tgl_hps);
    const penHps=(typeof hpscPenetapanHpsDoc==='function')?hpscPenetapanHpsDoc(nama):null;
    const noHps=(penHps&&penHps.no) || info.nomor || r.nomor || '';   // No. HPS (dari Penetapan Nomor / state)
    const rid=fkEsc(String(r.id));
    return '<tr>'+
      '<td class="col-no">'+(start+i+1)+'</td>'+
      '<td class="wrap-cell col-nama-freeze">'+fkEsc(nama)+'</td>'+
      '<td style="white-space:nowrap">'+fkEsc(noHps||'—')+'</td>'+
      '<td style="text-align:center;white-space:nowrap;padding-left:10px;padding-right:10px">'+fkEsc(tgl?fmtDate(tgl):'—')+'</td>'+
      '<td class="col-num" style="text-align:right">'+hpsRp(sum.jM)+'</td>'+
      '<td class="col-num" style="text-align:right">'+hpsRp(sum.jJ)+'</td>'+
      '<td class="col-num" style="text-align:right;white-space:nowrap">'+hpsRp(nilai)+'</td>'+
      '<td><div class="action-cell" style="justify-content:center">'+
        '<button class="act act-edit" title="Ubah" onclick="openHpsInput(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>'+
        '<button class="act act-view" title="Lihat" onclick="hpsPreviewRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>'+
        '<button class="act act-excel" title="Export Excel" style="background:#1E7145;color:#fff" onclick="hpsExportExcelRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 8l6 8M15 8l-6 8"/></svg></button>'+
        '<button class="act act-del" title="Hapus" onclick="hpsDeleteRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>'+
      '</div></td>'+
    '</tr>';
  }).join('');
  if(pg){
    if(totalPages<=1){ pg.innerHTML=''; }
    else{
      let h='<button class="pg-btn" '+(hpsViewPage<=1?'disabled':'')+' onclick="hpsViewGoto('+(hpsViewPage-1)+')">‹</button>';
      for(let p=1;p<=totalPages;p++) h+='<button class="pg-btn '+(p===hpsViewPage?'active':'')+'" onclick="hpsViewGoto('+p+')">'+p+'</button>';
      h+='<button class="pg-btn" '+(hpsViewPage>=totalPages?'disabled':'')+' onclick="hpsViewGoto('+(hpsViewPage+1)+')">›</button>';
      pg.innerHTML=h;
    }
  }
}
function hpsViewGoto(p){ hpsViewPage=p; renderHpsView(); }
function hpsPreviewRecord(id){
  const rec=(records_hps||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  hpsPreviewState=hpsRecordToState(rec);
  hpsOpenPreview();
}
function hpsDeleteRecord(id){
  if(!requireInput()) return;
  const rec=(records_hps||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  openConfirm({ icon:'del', title:'Hapus Data',
    text:'Hapus data HPS "'+(rec.nama_pekerjaan||(rec.state&&rec.state.info&&rec.state.info.nama)||'')+'"?',
    onYes:async()=>{
      try{ await withActionLoader('Menghapus', async()=>{ await StoreHps.remove(id); await refreshDataHps(); }); }
      catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'err'); return; }
      toast('Data dihapus','ok'); renderHpsView();
    }
  });
}

/* Export SATU record HPS ke Excel (.xlsx), mengikuti struktur tabel dokumen HPS:
   No | Uraian Pekerjaan | Sat | Vol | Harga Satuan (Barang/Jasa) | Jumlah Harga
   (Barang/Jasa) | Jumlah Total, ditutup rekap (Jumlah/DPP/PPn/Jumlah Total) &
   Terbilang. Nilai numerik ditulis sebagai ANGKA (bukan teks) agar bisa dihitung. */
async function hpsExportExcelRecord(id){
  if(!window.ExcelJS){ toast('Library Excel belum termuat, coba lagi','warn'); return; }
  const rec=(records_hps||[]).find(r=>String(r.id)===String(id));
  if(!rec){ toast('Data HPS tidak ditemukan','warn'); return; }
  const st=hpsRecordToState(rec); hpsResyncLockedHarga(st);
  const info=st.info||{};
  const cfg=jsCfg(st);
  const nama=rec.nama_pekerjaan||info.nama||'-';
  const lokasi=(rec.lokasi||info.lokasi||'-');
  const metode=(rec.metode||info.metode||'-');
  const _tgl=hpsTglEfektif(nama, rec.tgl_hps||info.tgl_hps);
  const tglTxt=_tgl?hpsDateLong(_tgl):'-';

  const TEAL='FF0E7C86', GREY='FFBFCAD0', GRP='FFE7EFF1', GRAND='FFDDEBEE';
  const thin={style:'thin',color:{argb:GREY}};
  const bAll={top:thin,left:thin,bottom:thin,right:thin};
  const money=ACCT_NODEC;

  const wb=new ExcelJS.Workbook();
  try{ wb.calcProperties.fullCalcOnLoad=true; }catch(e){}   // paksa Excel hitung ulang rumus saat file dibuka
  const ws=wb.addWorksheet('HPS');
  ws.columns=[{width:5},{width:46},{width:8},{width:8},{width:15},{width:15},{width:16},{width:16},{width:17}];

  const money0=(v)=>{ v=Math.round(hpsNum(v)); return v>0?v:''; };
  const setCell=(row,col,val,opt)=>{
    const cell=ws.getCell(row,col); if(val!==undefined && val!=='') cell.value=val;
    cell.border=bAll;
    if(opt){
      if(opt.fill) cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:opt.fill}};
      if(opt.font) cell.font=opt.font;
      if(opt.align) cell.alignment=opt.align;
      if(opt.money && typeof cell.value==='number') cell.numFmt=money;
    }
    return cell;
  };
  /* Format angka yang MENYEMBUNYIKAN nilai nol (positif;negatif;nol-kosong;teks),
     agar sel rumus yang hasilnya 0 tampil kosong — sama seperti tampilan awal. */
  const MONEY_HIDE0='#,##0;-#,##0;;@';
  /* Sel berisi RUMUS Excel (bukan angka statis) — dipakai untuk semua bagian yang
     dihitung otomatis, sehingga ikut berubah bila Vol/Harga Satuan diubah di Excel. */
  const fCell=(row,col,formula,opt)=>{
    const cell=ws.getCell(row,col);
    cell.value={formula:formula};
    cell.border=bAll;
    cell.numFmt=(opt&&opt.numFmt)||MONEY_HIDE0;
    if(opt){
      if(opt.fill) cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:opt.fill}};
      if(opt.font) cell.font=opt.font;
      if(opt.align) cell.alignment=opt.align;
    }
    return cell;
  };

  // ---- Judul dokumen ----
  ws.mergeCells('A1:I1');
  const t1=ws.getCell('A1');
  t1.value='PERHITUNGAN HARGA PERKIRAAN SENDIRI (HPS)';
  t1.font={bold:true,size:14,color:{argb:'FF16242C'}};
  t1.alignment={horizontal:'center',vertical:'middle'};
  ws.getRow(1).height=24;

  let rr=2;
  [['Nama Pekerjaan',nama],['Lokasi Pekerjaan',lokasi],['Metode Pengadaan',metode],['Tgl. HPS',tglTxt]].forEach(function(p){
    const k=ws.getCell('A'+rr); k.value=p[0]; k.font={bold:true};
    ws.mergeCells('B'+rr+':I'+rr);
    ws.getCell('B'+rr).value=': '+String(p[1]||'-');
    rr++;
  });
  rr++;

  // ---- Header tabel (3 baris: judul, sub, nomor kolom) ----
  const H1=rr, H2=rr+1, H3=rr+2;
  ws.mergeCells('A'+H1+':A'+H2); ws.getCell('A'+H1).value='No';
  ws.mergeCells('B'+H1+':B'+H2); ws.getCell('B'+H1).value='Uraian Pekerjaan';
  ws.mergeCells('C'+H1+':C'+H2); ws.getCell('C'+H1).value='Sat';
  ws.mergeCells('D'+H1+':D'+H2); ws.getCell('D'+H1).value='Vol';
  ws.mergeCells('E'+H1+':F'+H1); ws.getCell('E'+H1).value='Harga Satuan';
  ws.mergeCells('G'+H1+':H'+H1); ws.getCell('G'+H1).value='Jumlah Harga';
  ws.mergeCells('I'+H1+':I'+H2); ws.getCell('I'+H1).value='Jumlah Total (Rp)';
  ws.getCell('E'+H2).value='Barang (Rp)'; ws.getCell('F'+H2).value='Jasa (Rp)';
  ws.getCell('G'+H2).value='Barang (Rp)'; ws.getCell('H'+H2).value='Jasa (Rp)';
  const hFont={bold:true,color:{argb:'FFFFFFFF'},size:11};
  const hAlign={wrapText:true,vertical:'middle',horizontal:'center'};
  for(let r=H1;r<=H2;r++){ for(let c=1;c<=9;c++){ const cell=ws.getCell(r,c);
    cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:TEAL}}; cell.font=hFont; cell.alignment=hAlign; cell.border=bAll; } }
  ['1','2','3','4','5','6','7 = 4x5','8 = 4x6','9 = 7+8'].forEach(function(v,ci){
    const cell=ws.getCell(H3,ci+1); cell.value=v; cell.font={italic:true,size:9,color:{argb:'FF56707A'}};
    cell.alignment={horizontal:'center'}; cell.border=bAll;
  });
  rr=H3+1;

  // ---- Isi (judul / sub-judul / item) ----
  const grpFont={bold:true};
  const putGroup=(no,txt,it,fill)=>{
    setCell(rr,1,no,{fill:fill,font:grpFont,align:{horizontal:'center'}});
    setCell(rr,2,txt,{fill:fill,font:grpFont,align:{wrapText:true}});
    if(it){
      setCell(rr,3,(it.sat!=null&&String(it.sat).trim())?String(it.sat):'',{fill:fill,align:{horizontal:'center'}});
      setCell(rr,4,jsVolNum(it.vol)||'',{fill:fill,align:{horizontal:'center'}});
      setCell(rr,5,money0(it.hargaMat),{fill:fill,money:true});
      setCell(rr,6,money0(it.hargaJasa),{fill:fill,money:true});
      fCell(rr,7,`ROUND(D${rr}*E${rr},0)`,{fill:fill});                 // Jumlah Harga Barang = Vol × Harga Satuan Barang
      fCell(rr,8,`ROUND(D${rr}*F${rr},0)`,{fill:fill});                 // Jumlah Harga Jasa   = Vol × Harga Satuan Jasa
      fCell(rr,9,`G${rr}+H${rr}`,{fill:fill,font:grpFont});            // Jumlah Total = Barang + Jasa
    }else{
      for(let c=3;c<=9;c++) setCell(rr,c,'',{fill:fill});
    }
    rr++;
  };
  const firstBody=rr;                 // baris data pertama (untuk rentang SUM rumus rekap)
  jsWalk(st.items,cfg,{
    judul:(no,txt,it)=>{ putGroup(no,txt,it,GRP); },
    sub:(no,txt,it)=>{ putGroup(no,'   '+txt,it,GRP); },
    item:(no,it,idx)=>{
      const uraian=(it.uraian&&String(it.uraian).trim())?it.uraian:('Barang/Jasa '+(idx+1));
      setCell(rr,1,no,{align:{horizontal:'center',vertical:'middle'}});
      setCell(rr,2,uraian,{align:{wrapText:true,vertical:'middle'}});
      setCell(rr,3,(it.sat!=null&&String(it.sat).trim())?String(it.sat):'',{align:{horizontal:'center',vertical:'middle'}});
      setCell(rr,4,jsVolNum(it.vol)||'',{align:{horizontal:'center',vertical:'middle'}});
      setCell(rr,5,money0(it.hargaMat),{money:true});
      setCell(rr,6,money0(it.hargaJasa),{money:true});
      fCell(rr,7,`ROUND(D${rr}*E${rr},0)`,{});                 // Jumlah Harga Barang = Vol × Harga Satuan Barang
      fCell(rr,8,`ROUND(D${rr}*F${rr},0)`,{});                 // Jumlah Harga Jasa   = Vol × Harga Satuan Jasa
      fCell(rr,9,`G${rr}+H${rr}`,{});                          // Jumlah Total = Barang + Jasa
      rr++;
    }
  });
  const lastBody=rr-1;                // baris data terakhir

  // ---- Rekap + Terbilang (semua sel angka = RUMUS Excel) ----
  const s=hpsSummary(st);
  const sumRowF=(lbl,fMat,fJasa,fTot,grand)=>{
    ws.mergeCells('A'+rr+':F'+rr);
    setCell(rr,1,lbl,{fill:grand?GRAND:undefined,font:{bold:true},align:{horizontal:'right',vertical:'middle'}});
    for(let c=2;c<=6;c++) setCell(rr,c,'',{fill:grand?GRAND:undefined});
    fCell(rr,7,fMat,{fill:grand?GRAND:undefined,font:{bold:!!grand}});
    fCell(rr,8,fJasa,{fill:grand?GRAND:undefined,font:{bold:!!grand}});
    fCell(rr,9,fTot,{fill:grand?GRAND:undefined,font:{bold:!!grand}});
    rr++;
  };
  const hasBody = lastBody>=firstBody;
  const gSum = hasBody?`SUM(G${firstBody}:G${lastBody})`:'0';
  const hSum = hasBody?`SUM(H${firstBody}:H${lastBody})`:'0';
  const iSum = hasBody?`SUM(I${firstBody}:I${lastBody})`:'0';
  const rJml=rr;    sumRowF('Jumlah', gSum, hSum, iSum);                                              // Jumlah = total kolom
  const rDpp=rr;    sumRowF('DPP', `ROUND(G${rJml}*11/12,0)`, `ROUND(H${rJml}*11/12,0)`, `ROUND(I${rJml}*11/12,0)`);   // DPP = Jumlah × 11/12
  const rPpn=rr;    sumRowF('PPn 12%', `ROUND(G${rDpp}*0.12,0)`, `ROUND(H${rDpp}*0.12,0)`, `ROUND(I${rDpp}*0.12,0)`);  // PPn = DPP × 12%
                    sumRowF('Jumlah Total', `G${rJml}+G${rPpn}`, `H${rJml}+H${rPpn}`, `I${rJml}+I${rPpn}`, true);      // Jumlah Total = Jumlah + PPn
  ws.mergeCells('A'+rr+':I'+rr);
  setCell(rr,1,'Terbilang : '+hpsTerbilangRupiah(s.totT),{font:{italic:true,bold:true},align:{wrapText:true,vertical:'middle'}});
  for(let c=2;c<=9;c++) setCell(rr,c,'',{});
  rr++;

  const safe=(String(nama).replace(/[^\w\-]+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'').slice(0,60))||'HPS';
  try{
    const buf=await wb.xlsx.writeBuffer();
    const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='HPS_'+safe+'.xlsx';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast('Excel HPS berhasil diunduh','ok');
  }catch(err){ console.error(err); toast('Gagal export Excel: '+errMsg(err),'warn'); }
}

/* ================= DOKUMEN PDF ================= */
function hpsBuildDocHtml(){
  const st=hpsActiveState(); hpsResyncLockedHarga(st); const info=st.info||{};
  const fmtNilai=(info.nilai!==''&&info.nilai!=null)?('Rp '+Number(info.nilai).toLocaleString('id-ID')):'-';
  const infoRow=(k,v)=>'<tr><td class="k">'+k+'</td><td class="s">:</td><td class="v" style="text-align:justify">'+fkEsc(v||'-')+'</td></tr>';

  /* ---- Baris item + Judul / Sub-Judul (bernomor sesuai gaya terpilih) ---- */
  let bodyRows='';
  const cfg=jsCfg(st);
  /* Baris judul/sub-judul. Bila "pembawa" ada, baris itu sekaligus memuat
     Sat/Vol/Harga (judul tanpa Uraian Pekerjaan tersendiri). */
  const grpRow=(cls,no,txt,it)=>{
    if(!it) return '<tr class="'+cls+'"><td class="no">'+fkEsc(no)+'</td><td class="gname" colspan="8">'+fkEsc(txt)+'</td></tr>';
    const sat=(it.sat!=null&&String(it.sat).trim())?it.sat:'-';
    const vol=jsVolDoc(it.vol);
    return '<tr class="'+cls+' has-val"><td class="no">'+fkEsc(no)+'</td>'+
      '<td class="gname ur">'+fkEsc(txt)+'</td>'+
      '<td class="st">'+fkEsc(String(sat))+'</td>'+
      '<td class="vl">'+fkEsc(String(vol))+'</td>'+
      '<td class="num">'+hpsRpDoc(it.hargaMat)+'</td>'+
      '<td class="num">'+hpsRpDoc(it.hargaJasa)+'</td>'+
      '<td class="num">'+hpsRpDoc(hpsItemMat(it))+'</td>'+
      '<td class="num">'+hpsRpDoc(hpsItemJasa(it))+'</td>'+
      '<td class="num tot">'+hpsRpDoc(hpsItemTotal(it))+'</td></tr>';
  };
  jsWalk(st.items,cfg,{
    judul:(no,txt,it)=>{ bodyRows+=grpRow('grp',no,txt,it); },
    sub:(no,txt,it)=>{ bodyRows+=grpRow('grp sub',no,txt,it); },
    item:(noInGroup,it,idx)=>{
    const uraian=(it.uraian&&String(it.uraian).trim())?it.uraian:('Barang/Jasa '+(idx+1));
    const sat=(it.sat!=null&&String(it.sat).trim())?it.sat:'-';
    const vol=jsVolDoc(it.vol);
    bodyRows+='<tr>'+
      '<td class="no">'+noInGroup+'</td>'+
      '<td class="ur">'+fkEsc(uraian)+'</td>'+
      '<td class="st">'+fkEsc(String(sat))+'</td>'+
      '<td class="vl">'+fkEsc(String(vol))+'</td>'+
      '<td class="num">'+hpsRpDoc(it.hargaMat)+'</td>'+
      '<td class="num">'+hpsRpDoc(it.hargaJasa)+'</td>'+
      '<td class="num">'+hpsRpDoc(hpsItemMat(it))+'</td>'+
      '<td class="num">'+hpsRpDoc(hpsItemJasa(it))+'</td>'+
      '<td class="num tot">'+hpsRpDoc(hpsItemTotal(it))+'</td>'+
    '</tr>';
  }});

  const s=hpsSummary(st);
  const sumRow=(lbl,mat,jasa,tot,cls)=>'<tr class="sum'+(cls?' '+cls:'')+'">'+
    '<td class="sum-lbl" colspan="6">'+lbl+'</td>'+
    '<td class="num">'+hpsRpDoc(mat)+'</td>'+
    '<td class="num">'+hpsRpDoc(jasa)+'</td>'+
    '<td class="num">'+hpsRpDoc(tot)+'</td></tr>';
  const sumRows=
    sumRow('Jumlah', s.jM, s.jJ, s.jT)+
    sumRow('DPP', s.dppM, s.dppJ, s.dppT)+
    sumRow('PPn 12%', s.ppnM, s.ppnJ, s.ppnT)+
    sumRow('Jumlah Total', s.totM, s.totJ, s.totT, 'grand');
  const terbilangRow='<tr class="terb"><td colspan="9"><b>Terbilang :</b> '+fkEsc(hpsTerbilangRupiah(s.totT))+'</td></tr>';
  /* Nama Pengguna (Manager) & Pejabat Pelaksana Pengadaan SELALU tampil UPPERCASE
     pada pratinjau & cetak, apa pun cara pengetikannya. */
  const pengguna=(info.pengguna&&String(info.pengguna).trim())?String(info.pengguna).trim().toUpperCase():'(..........................)';
  const pejabat=(info.pejabat&&String(info.pejabat).trim())?String(info.pejabat).trim().toUpperCase():'(..........................)';
  const _tglDoc=hpsTglEfektif(info.nama, info.tgl_hps);
  const tglFull=_tglDoc?hpsDateFull(_tglDoc):'..........................';
  /* Blok tanda tangan menyatu sebagai baris terakhir tabel — tidak bisa terpisah ke
     halaman sendiri, dan tidak ada celah untuk menyisipkan baris data di bawahnya. */
  const ttdRow=
    '<tr class="ttd-row"><td colspan="9">'+
      '<table class="ttd"><tbody><tr>'+
        '<td><div class="hps-topgap"></div>'+
          '<div class="role">Disetujui oleh,</div>'+
          '<div class="role2">Pengguna Barang/Jasa</div>'+
          '<div class="gap"></div>'+
          '<div class="nm nm-up">'+fkEsc(pengguna)+'</div></td>'+
        '<td><div class="ttd-date">Masohi, '+fkEsc(tglFull)+'</div>'+
          '<div class="role">Disusun oleh,</div>'+
          '<div class="role2">Pejabat Pelaksana Pengadaan</div>'+
          '<div class="gap"></div>'+
          '<div class="nm nm-up">'+fkEsc(pejabat)+'</div></td>'+
      '</tr></tbody></table>'+
    '</td></tr>';

  const _cw=jsHpsColPct(st.items, cfg);
  const tbl=
    '<table class="hps-doc-tbl">'+
      // Lebar Sat & Vol mengikuti data terpanjang; sisanya jadi milik kolom Uraian.
      '<colgroup><col style="width:'+_cw.no+'%"><col style="width:'+_cw.ur+'%"><col style="width:'+_cw.sat+'%"><col style="width:'+_cw.vol+'%">'+
        '<col style="width:11%"><col style="width:11%"><col style="width:11%"><col style="width:11%"><col style="width:11%"></colgroup>'+
      '<thead>'+
        '<tr>'+
          '<th class="no" rowspan="2">No</th>'+
          '<th class="ur" rowspan="2">Uraian Pekerjaan</th>'+
          '<th class="st" rowspan="2">Sat</th>'+
          '<th class="vl" rowspan="2">Vol</th>'+
          '<th colspan="2">Harga Satuan</th>'+
          '<th colspan="2">Jumlah Harga</th>'+
          '<th rowspan="2">Jumlah Total<br>(Rp)</th>'+
        '</tr>'+
        '<tr>'+
          '<th>Barang (Rp)</th><th>Jasa (Rp)</th>'+
          '<th>Barang (Rp)</th><th>Jasa (Rp)</th>'+
        '</tr>'+
        '<tr class="numh">'+
          '<td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td>'+
          '<td>7 = 4 x 5</td><td>8 = 4 x 6</td><td>9 = 7 + 8</td>'+
        '</tr>'+
      '</thead>'+
      '<tbody>'+bodyRows+'</tbody>'+
      // tbody kedua: rekap + terbilang + tanda tangan diperlakukan sebagai SATU blok.
      // Bila tak cukup ruang, seluruhnya turun bersama ke halaman berikutnya —
      // tanda tangan tidak pernah berdiri sendiri tanpa angka rekapnya.
      '<tbody class="hps-tail">'+sumRows+terbilangRow+ttdRow+'</tbody>'+
    '</table>';


  return ''+
  '<div class="fkl-doc pnw-doc hps-doc">'+
    '<div class="fkl-doc-head">'+
      '<div class="fkl-doc-logo"><img src="'+FKL_LOGO_SRC+'" alt="Logo PLN"></div>'+
      '<div class="fkl-doc-org">'+
        '<div class="l1">PT PLN (PERSERO)</div>'+
        '<div class="l2">UNIT PELAKSANA PELAYANAN PELANGGAN MASOHI</div>'+
        '<div class="l3">Jl. Abdullah Soulissa No 1, Masohi, Kec. Kota Masohi</div>'+
      '</div>'+
    '</div>'+
    '<div class="fkl-doc-band"></div>'+
    fklDocTitleBlock('HARGA PERKIRAAN SENDIRI (HPS)', info.nama, ['HPS','T_HPS'])+
    '<div class="fkl-sec-h"><span class="rn">A</span>Data Pekerjaan</div>'+
    '<table class="fkl-info"><tbody>'+
      infoRow('Nama Pekerjaan', info.nama)+
      infoRow('Lokasi Pekerjaan', info.lokasi)+
      infoRow('Rencana Anggaran Biaya', fmtNilai)+
      infoRow('No. Anggaran', info.no_anggaran)+
      infoRow('Tgl. Anggaran', info.tgl_anggaran?pnwDateLong(info.tgl_anggaran):'-')+
      infoRow('Metode Pengadaan', info.metode)+
    '</tbody></table>'+
    '<div class="fkl-sec-h"><span class="rn">B</span>Uraian Pekerjaan &amp; Rincian Harga</div>'+
    tbl+
  '</div>';
}
function hpsExtraDocCss(){
  return ''+
  'table.hps-doc-tbl{width:100%;border-collapse:collapse;table-layout:fixed;margin:2px 0 8px}'+
  'table.hps-doc-tbl thead th{border-color:#5aa8ae}'+
  'table.hps-doc-tbl thead tr:first-child th{border-top-color:#0E7C86}'+
  'table.hps-doc-tbl thead th:first-child{border-left-color:#0E7C86}'+
  'table.hps-doc-tbl thead th:last-child{border-right-color:#0E7C86}'+
  'table.hps-doc-tbl thead tr:last-child th{border-bottom:1.5px solid #0b6a73}'+
  'table.hps-doc-tbl th,table.hps-doc-tbl td{border:1px solid #7d979c;padding:3px 5px;font-size:8.7px;line-height:1.3;vertical-align:middle;word-wrap:break-word;overflow-wrap:anywhere}'+
  'table.hps-doc-tbl thead th{background:#0E7C86;color:#fff;font-weight:700;text-align:center;letter-spacing:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  /* Judul kolom TIDAK boleh dipenggal di tengah kata ("Bara/ng", "Juml/ah").
     Sel data tetap boleh (nomor/kode panjang), hanya <th> yang dikecualikan. */
  'table.hps-doc-tbl thead th{overflow-wrap:break-word;word-break:normal;hyphens:none}'+
  'table.hps-doc-tbl thead th.ur{text-align:center}'+
  'table.hps-doc-tbl thead tr.numh td{background:#e7f2f3;color:#0b3d42;font-weight:700;text-align:center;font-style:italic;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  'table.hps-doc-tbl thead th.no{white-space:nowrap}'+
  'table.hps-doc-tbl td.no{text-align:center;font-weight:400}'+
  'table.hps-doc-tbl td.ur{text-align:left}'+
  'table.hps-doc-tbl th.st,table.hps-doc-tbl td.st,table.hps-doc-tbl th.vl,table.hps-doc-tbl td.vl{text-align:center;white-space:nowrap;overflow-wrap:normal;word-break:keep-all}'+
  'table.hps-doc-tbl td.num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}'+
  'table.hps-doc-tbl td.num.tot{font-weight:800;color:#0b3d42}'+
  'table.hps-doc-tbl tr.grp td{background:#dcecee;font-weight:800;color:#0b3d42;text-transform:uppercase;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  'table.hps-doc-tbl tr.grp td.gname{text-align:left;letter-spacing:.3px}'+
  'table.hps-doc-tbl tr.grp.sub td{background:#eef5f6;text-transform:none;font-weight:700;font-style:italic}'+
  'table.hps-doc-tbl tr.grp.has-val td.gname{width:auto}'+
  'table.hps-doc-tbl tr.grp.has-val td.num{text-align:right;text-transform:none}'+
  'table.hps-doc-tbl tr.grp.has-val td.st,table.hps-doc-tbl tr.grp.has-val td.vl{text-align:center;text-transform:none}'+
  'table.hps-doc-tbl tr.sum td{background:#f2f7f8;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  'table.hps-doc-tbl tr.sum td.sum-lbl{text-align:right;font-weight:800;color:#0d2a30;text-transform:none}'+
  'table.hps-doc-tbl tr.sum td.num{font-weight:800;color:#0b3d42}'+
  'table.hps-doc-tbl tr.sum.grand td{background:#e7f6ec;color:#0d7a3f}'+
  'table.hps-doc-tbl tr.sum.grand td.num,table.hps-doc-tbl tr.sum.grand td.sum-lbl{color:#0d7a3f;font-size:9.4px}'+
  'table.hps-doc-tbl tr.terb td{text-align:left;background:#fbfdf4;font-weight:600;color:#22343a;padding:5px 7px}'+
  'table.hps-doc-tbl tr.terb td b{color:#0b3d42}'+
  'table.hps-doc-tbl tr.grp,table.hps-doc-tbl tr.sum,table.hps-doc-tbl tr.terb{break-inside:avoid;page-break-inside:avoid}'+
  /* Baris tanda tangan menyatu dengan tabel: tanpa arsiran zebra, tanpa padding sel
     tabel, dan tidak boleh terpotong antar-halaman. */
  'table.hps-doc-tbl thead{display:table-header-group}'+
  'table.hps-doc-tbl tbody.hps-tail{break-inside:avoid;page-break-inside:avoid}'+
  'table.hps-doc-tbl tr.ttd-row{break-inside:avoid;page-break-inside:avoid}'+
  'table.hps-doc-tbl tr.ttd-row > td{padding:22px 10px 6px;background:transparent;border:none}'+
  'table.hps-doc-tbl tr.ttd-row table.ttd,table.hps-doc-tbl tr.ttd-row table.ttd td{border:none;background:transparent;padding:0}'+
  /* Tanda tangan LAMPIRAN (.spk-lampsign) kini berada DI DALAM tabel agar menyatu
     dengan baris rekap. Tanpa aturan di bawah, ia ikut terkena
     'table.hps-doc-tbl td{border:1px solid ...}' sehingga muncul garis kotak, dan
     tabel dalamnya bisa mengganggu perhitungan lebar kolom tabel induk.
     Aturan berikut membebaskan border/latar DAN mengunci tabel tanda tangan agar
     tidak pernah mempengaruhi lebar kolom tabel harga. */
  'table.hps-doc-tbl tr.ttd-row > td{border:none;background:transparent}'+
  'table.hps-doc-tbl tr.ttd-row .spk-lampsign,'+
  'table.hps-doc-tbl tr.ttd-row table.spk-sign,'+
  'table.hps-doc-tbl tr.ttd-row table.spk-sign td{border:none;background:transparent}'+
  'table.hps-doc-tbl tr.ttd-row table.spk-sign{width:100%;table-layout:fixed;border-collapse:collapse}'+
  '.hps-foot{margin-top:26px;break-inside:avoid;page-break-inside:avoid}'+
  '.hps-foot .ttd,tr.ttd-row .ttd{width:100%;margin:0;border-collapse:collapse}'+
  '.hps-foot .ttd td,tr.ttd-row .ttd td{width:50%;text-align:center;vertical-align:top;padding:0 12px}'+
  '.hps-foot .ttd-date,tr.ttd-row .ttd-date{text-align:center;font-size:12px;color:#22343a;font-weight:600;margin:0 0 6px}'+
  '.hps-foot .hps-topgap,tr.ttd-row .hps-topgap{height:24px}'+
  '.hps-foot .role,tr.ttd-row .role{font-size:12px;color:#22343a;font-weight:600}'+
  '.hps-foot .role2,tr.ttd-row .role2{font-size:12px;color:#0d2a30;font-weight:800;margin-top:1px}'+
  '.hps-foot .gap,tr.ttd-row .gap{height:66px}'+
  '.hps-foot .nm,tr.ttd-row .nm{font-weight:800;font-size:12.5px;color:#0d2a30;display:inline-block;min-width:180px;padding-top:5px}'+
  '.hps-foot .nm.nm-up,tr.ttd-row .nm.nm-up{text-transform:uppercase}';
}
function hpsStandaloneDocHtml(){
  return fklDocShell(hpsExtraDocCss(), hpsBuildDocHtml());
}
function hpsOpenPreview(){
  const ov=document.getElementById('pn-preview-overlay'); if(!ov) return;
  const _mdl=ov.querySelector('.pn-preview-modal'); if(_mdl) _mdl.classList.remove('is-max');
  if(typeof pnPreviewResetMaxBtn==='function') pnPreviewResetMaxBtn();
  const titleEl=document.getElementById('pn-preview-title');
  if(titleEl) titleEl.textContent='Pratinjau — Harga Perkiraan Sendiri (HPS)';
  const body=document.getElementById('pn-preview-body');
  if(body){
    body.classList.add('fkl-preview-body');
    body.innerHTML='<iframe id="hps-preview-frame" title="Pratinjau Dokumen"></iframe>';
    const ifr=document.getElementById('hps-preview-frame');
    const doc=ifr.contentWindow.document; doc.open(); doc.write(hpsStandaloneDocHtml()); doc.close();
  }
  const actions=document.querySelector('#pn-preview-overlay .pn-preview-head-actions');
  { const _c=document.getElementById('hpsc-preview-print'); if(_c) _c.remove(); }
  const oldFkl=document.getElementById('fkl-preview-print'); if(oldFkl) oldFkl.remove();
  const oldPnw=document.getElementById('pnw-preview-print'); if(oldPnw) oldPnw.remove();
  const oldRho=document.getElementById('rho-preview-print'); if(oldRho) oldRho.remove();
  if(actions && !document.getElementById('hps-preview-print')){
    const btn=document.createElement('button');
    btn.id='hps-preview-print'; btn.className='btn btn-teal';
    btn.style.padding='8px 14px'; btn.style.fontSize='11px';
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>Cetak / PDF';
    btn.onclick=hpsPrint;
    actions.insertBefore(btn, actions.firstChild);
  }
  ov.classList.add('show');
}
function hpsPrint(){
  const old=document.getElementById('hps-print-frame'); if(old) old.remove();
  const ifr=document.createElement('iframe');
  ifr.id='hps-print-frame'; ifr.setAttribute('aria-hidden','true');
  ifr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(ifr);
  const doc=ifr.contentWindow.document; doc.open(); doc.write(hpsStandaloneDocHtml()); doc.close();
  const go=()=>fklWaitPaged(ifr, _go);
  const _go=()=>{ withHiddenPageTitle(()=>{ try{ ifr.contentWindow.focus(); ifr.contentWindow.print(); }catch(e){ try{ window.print(); }catch(_){} } }); setTimeout(()=>{ const f=document.getElementById('hps-print-frame'); if(f) f.remove(); },1500); };
  const imgs=doc.images?Array.from(doc.images):[];
  if(imgs.length){ let n=imgs.length; const dec=()=>{ if(--n<=0) setTimeout(go,60); }; imgs.forEach(im=>{ if(im.complete) dec(); else { im.onload=dec; im.onerror=dec; } }); setTimeout(go,1600); }
  else setTimeout(go,120);
}

/* ##################### AKHIR MODUL HARGA PERKIRAAN SENDIRI #################### */


/* ##################### MODUL ANALISA HARGA SATUAN #################### */
/* Menu Analisa terdiri dari 2 langkah (mirip Hitung HPS):
   Langkah 1 — Data Pekerjaan (tanpa Nama Pengguna/Pejabat) + Jumlah Barang/Jasa,
               Jumlah Referensi (1..20) & Sumber Referensi (kotak menyesuaikan jumlah referensi).
   Langkah 2 — Analisa Harga Satuan: pilih Referensi (kanan atas) untuk mengisi data per referensi,
               Metode Perhitungan referensi (Sama → Rata-rata/Terendah utk semua uraian; Berbeda → per uraian).
   Semua hitungan mengabaikan nilai 0 / tidak ada data. */

const ANA_SEC_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.8L7 14.3"/></svg>';
const ANA_REF_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>';

/* Field data pekerjaan (langkah 1) — tanpa Nama Pengguna/Pejabat. */
const ANA_INFO_FIELDS = [
  {key:'nama',         label:'Nama Pekerjaan',            type:'text', span:2},
  {key:'lokasi',       label:'Lokasi Pekerjaan',          type:'text', span:2},
  {key:'nilai',        label:'Rencana Anggaran Biaya', type:'num'},
  {key:'no_anggaran',  label:'No. Anggaran',              type:'text'},
  {key:'tgl_anggaran', label:'Tgl. Anggaran',             type:'date'},
  {key:'metode',       label:'Metode Pengadaan',          type:'select', options:PNW_METODE}
];
/* Field bersama (sumbernya dari Data Pekerjaan, ditampilkan terkunci) vs
   field khusus dokumen Analisa ini saja (tetap dapat diisi manual). */
const ANA_DP_FIELDS  = ANA_INFO_FIELDS.filter(f=>f.key!=='tgl_analisa');
const ANA_OWN_FIELDS = ANA_INFO_FIELDS.filter(f=>f.key==='tgl_analisa');
function anaIsLocked(key){ return !!(anaState.info && anaState.info.dpId) && DP_SHARED_KEYS.indexOf(key)>=0; }

const ANA_MAX_ITEM = 150;   // jumlah barang/jasa (uraian)
const ANA_MAX_REF  = 20;    // jumlah referensi

/* ---------- Struktur data per referensi ----------
   Tiap referensi punya array items sepanjang jumlahItem:
   { kelompok, uraian, sat, vol, hargaBarang, hargaJasa, method } (method dipakai saat metodeRef='Berbeda') */
function anaBlankRefItem(){ return {judul:'', subjudul:'', uraian:'', sat:'', vol:'', hargaBarang:'', hargaJasa:'', method:'Rata-rata'}; }
function anaNormRefItem(c){ c=c||{}; return {
  judul:(c.judul!=null?c.judul:(c.kelompok||'')), subjudul:c.subjudul||'', uraian:c.uraian||'', sat:c.sat||'',
  vol:(c.vol!=null?c.vol:''),
  hargaBarang:(c.hargaBarang!=null?c.hargaBarang:''),
  hargaJasa:(c.hargaJasa!=null?c.hargaJasa:''),
  method:(c.method==='Terendah'?'Terendah':'Rata-rata')
}; }
function anaBlankRef(){ return { items:[anaBlankRefItem()] }; }

/* ---------- Struktur khusus "Pekerjaan Konstruksi" ---------- */
/* Bagian 2 — Harga Satuan: Kelompok/Uraian/Satuan diisi manual, Harga Barang (Rp) & Harga Jasa (Rp) manual. */
function anaBlankKonItem(){ return {judul:'', subjudul:'', uraian:'', sat:'', hargaBarang:'', hargaJasa:'', sumberRef:''}; }
function anaNormKonItem(c){ c=c||{}; return {
  judul:(c.judul!=null?c.judul:(c.kelompok||'')), subjudul:c.subjudul||'', uraian:c.uraian||'', sat:c.sat||'',
  hargaBarang:(c.hargaBarang!=null?c.hargaBarang:''),
  hargaJasa:(c.hargaJasa!=null?c.hargaJasa:''),
  sumberRef:c.sumberRef||''
}; }
function anaKonItemTotal(it){ return anaNum(it&&it.hargaBarang)+anaNum(it&&it.hargaJasa); }

/* Bagian 3 — Analisa Harga Satuan Pekerjaan (AHSP): satu blok berlaku untuk keseluruhan
   (bukan per-uraian), terdiri dari 3 kelompok baris yang bisa ditambah/dihapus bebas:
   A. Tenaga Kerja, B. Bahan, C. Peralatan. Tiap baris: Uraian, Satuan, Koefisien, Harga Satuan.
   ROK (%) diterapkan ke masing-masing subtotal kelompok. */
function anaBlankAhspRow(){ return {uraian:'', sat:'', koef:'', harga:''}; }
function anaNormAhspRow(c){ c=c||{}; return {uraian:c.uraian||'', sat:c.sat||'', koef:(c.koef!=null?c.koef:''), harga:(c.harga!=null?c.harga:'')}; }
function anaAhspJumlah(row){ return Math.round(anaNum(row&&row.koef)*anaNum(row&&row.harga)); }
/* Satu "layer" = satu analisa lengkap (judul pekerjaan + ROK + 3 kelompok baris) */
function anaBlankAhspLayer(){ return { judul:'', rok:'', tenagaKerja:[anaBlankAhspRow()], bahan:[anaBlankAhspRow()], alat:[anaBlankAhspRow()] }; }
function anaNormAhspLayer(c){ c=c||{}; return {
  judul:c.judul||'', rok:(c.rok!=null?c.rok:''),
  tenagaKerja: Array.isArray(c.tenagaKerja)&&c.tenagaKerja.length ? c.tenagaKerja.map(anaNormAhspRow) : [anaBlankAhspRow()],
  bahan: Array.isArray(c.bahan)&&c.bahan.length ? c.bahan.map(anaNormAhspRow) : [anaBlankAhspRow()],
  alat: Array.isArray(c.alat)&&c.alat.length ? c.alat.map(anaNormAhspRow) : [anaBlankAhspRow()]
}; }
function anaBlankAhsp(){ return [anaBlankAhspLayer()]; }
const ANA_AHSP_SECTIONS = [['tenagaKerja','A','TENAGA KERJA'],['bahan','B','BAHAN'],['alat','C','PERALATAN']];

/* State:
   info      : data pekerjaan
   jumlahItem: jumlah barang/jasa (1..150)
   jumlahRef : jumlah referensi (1..20)
   sumber    : [nama sumber referensi, ...] sepanjang jumlahRef
   refs      : [ {items:[...]}, ... ] sepanjang jumlahRef; tiap items sepanjang jumlahItem
   metodeRef : 'Sama' | 'Berbeda'
   metodeAll : 'Rata-rata' | 'Terendah' (dipakai saat metodeRef='Sama')
   aktifRef  : index referensi yang sedang diisi (0-based)
*/
function anaBlankState(){ return {
  info:{}, jumlahItem:1, jumlahRef:1,
  sumber:[''], refs:[anaBlankRef()],
  metodeRef:'Sama', metodeAll:'Rata-rata', aktifRef:0,
  jenis:'Umum', rokOn:'Tidak', rok:'', inflasi:'Tidak', inflasiVals:[], inflasiNilai:'',
  judulOn:'Tidak', judulNum:'', subjudulOn:'Tidak', subjudulNum:'',
  konstruksi:{ jumlahItem:1, items:[anaBlankKonItem()] },
  ahsp: anaBlankAhsp()
}; }
let anaState = anaBlankState();
let anaStep = 1;             // 1..2
let anaEditId = null;
let anaRevealPick = false;    // true sekali setelah "Pilih Data Pekerjaan" → animasi reveal
let anaAhspActive = 0;        // index layer AHSP yang sedang ditampilkan (Bagian 3 Konstruksi, seperti halaman)
let anaPreviewState = null;

const ANA_STATE_KEY = 'analisa_state_v1';
function anaLoadState(){ try{ const raw=ssGet(ANA_STATE_KEY); if(raw){ const o=JSON.parse(raw); if(o&&o.info) anaState=o; } }catch(e){} }
function anaSaveState(){ try{ ssSet(ANA_STATE_KEY, JSON.stringify(anaState)); }catch(e){} }
anaLoadState();
function anaActiveState(){ return anaPreviewState || anaState; }
function anaMarkActive(){ document.querySelectorAll('.topnav-item[data-view="form-analisa"]').forEach(b=>b.classList.add('active')); }

/* Sinkronkan panjang array sumber/refs/items agar konsisten dgn jumlahRef & jumlahItem. */
function anaEnsure(){
  const st=anaState;
  const nItem=Math.max(1,Math.min(ANA_MAX_ITEM, parseInt(st.jumlahItem,10)||1)); st.jumlahItem=nItem;
  const nRef =Math.max(1,Math.min(ANA_MAX_REF,  parseInt(st.jumlahRef,10)||1));  st.jumlahRef=nRef;
  // sumber
  if(!Array.isArray(st.sumber)) st.sumber=[];
  const curS=st.sumber.slice(); st.sumber=[]; for(let i=0;i<nRef;i++) st.sumber.push(curS[i]!=null?curS[i]:'');
  // refs
  if(!Array.isArray(st.refs)) st.refs=[];
  const curR=st.refs.slice(); st.refs=[];
  for(let r=0;r<nRef;r++){
    const src=(curR[r]&&Array.isArray(curR[r].items))?curR[r].items:[];
    const items=[]; for(let i=0;i<nItem;i++) items.push(anaNormRefItem(src[i]));
    st.refs.push({items});
  }
  if(st.metodeRef!=='Berbeda') st.metodeRef='Sama';
  if(st.metodeAll!=='Terendah') st.metodeAll='Rata-rata';
  st.aktifRef=Math.max(0,Math.min(nRef-1, parseInt(st.aktifRef,10)||0));
  // Judul / Sub-Judul — HANYA berlaku untuk Pekerjaan Umum
  if(st.judulOn!=='Ya') st.judulOn='Tidak';
  if(st.subjudulOn!=='Ya') st.subjudulOn='Tidak';
  if(st.jenis==='Konstruksi'){ st.judulOn='Tidak'; st.subjudulOn='Tidak'; }
  st.judulNum=jsNumStyleOk(st.judulNum,''); st.subjudulNum=jsNumStyleOk(st.subjudulNum,'');
  // jenis pekerjaan & ROK (%)
  if(st.jenis!=='Konstruksi') st.jenis='Umum';
  if(st.rokOn==null) st.rokOn=(anaNum(st.rok)>0)?'Ya':'Tidak';   // migrasi data lama
  if(st.rokOn!=='Ya') st.rokOn='Tidak';
  if(st.rokOn!=='Ya') st.rok='';                                  // ROK? = Tidak → tidak dihitung
  const rokMax=(st.jenis==='Konstruksi')?15:10;
  if(st.rok!==''&&st.rok!=null){ let rk=anaNum(st.rok); if(rk<0) rk=0; if(rk>rokMax) rk=rokMax; st.rok=(rk===0&&String(st.rok).trim()==='')?'':rk; }
  // ---- Pekerjaan Konstruksi: Bagian 2 (Harga Satuan) & Bagian 3 (AHSP) ----
  if(!st.konstruksi||typeof st.konstruksi!=='object') st.konstruksi={ jumlahItem:1, items:[anaBlankKonItem()] };
  const kst=st.konstruksi;
  if(!Array.isArray(kst.items)||!kst.items.length) kst.items=[anaBlankKonItem()];
  kst.items=kst.items.map(anaNormKonItem);
  kst.jumlahItem=kst.items.length; // derived, bukan dikontrol pengguna (baris tambah/hapus bebas)
  // Migrasi bentuk lama (satu objek AHSP tunggal) -> array of layers
  if(st.ahsp&&!Array.isArray(st.ahsp)&&typeof st.ahsp==='object'&&(Array.isArray(st.ahsp.tenagaKerja)||Array.isArray(st.ahsp.bahan)||Array.isArray(st.ahsp.alat))){
    st.ahsp=[st.ahsp];
  }
  if(!Array.isArray(st.ahsp)||!st.ahsp.length) st.ahsp=anaBlankAhsp();
  st.ahsp=st.ahsp.map(layer=>{
    const nl=anaNormAhspLayer(layer);
    if(nl.rok!==''&&nl.rok!=null){ let rk=anaNum(nl.rok); if(rk<0) rk=0; if(rk>15) rk=15; nl.rok=(rk===0&&String(nl.rok).trim()==='')?'':rk; }
    return nl;
  });
}

/* ---------- Angka & format (pakai helper HPS bila ada) ---------- */
function anaNum(v){ if(v===''||v==null) return 0; if(typeof v==='number') return v; const n=parseFloat(String(v).replace(/,/g,'.')); return isNaN(n)?0:n; }
function anaRp(n){ n=Math.round(anaNum(n)); return n>0 ? ('Rp '+n.toLocaleString('id-ID')) : '–'; }

/* ---------- Penyimpanan (Supabase + fallback lokal) ---------- */
const ANA_TABLE = 'analisa_harga_satuan';
const ANA_LS_KEY = 'analisa_records_v1';
let records_ana = [];
let anaUseLocal = false;
function anaSupaReady(){ return !!(USE_SUPABASE && db); }
function anaLocalLoad(){ try{ const r=localStorage.getItem(ANA_LS_KEY); records_ana = r?JSON.parse(r):[]; }catch(e){ records_ana=[]; } }
function anaLocalSave(){ /* dinonaktifkan: data hanya di Supabase */ }
const StoreAna = {
  async list(){
    if(!anaSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(ANA_TABLE).select('*').order('created_at',{ascending:false});
    if(error) throw error; return data||[];
  },
  async create(rec){
    if(!anaSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(ANA_TABLE).insert(rec).select();
    if(error) throw error; return data&&data[0];
  },
  async update(rid, rec){
    if(!anaSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(ANA_TABLE).update(rec).eq('id',rid);
    if(error) throw error;
  },
  async remove(rid){
    if(!anaSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(ANA_TABLE).delete().eq('id',rid);
    if(error) throw error;
  }
};
async function refreshDataAnalisa(){
  try{ records_ana = await StoreAna.list(); }
  catch(err){ console.error(err); records_ana = records_ana||[]; }
}

/* ---------- Buka form / lihat data ---------- */
function openAnalisaInput(editId){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  anaPreviewState=null;
  if(editId){
    const rec=(records_ana||[]).find(r=>String(r.id)===String(editId));
    anaEditId = rec ? rec.id : null;
    anaState = rec ? anaRecordToState(rec) : anaBlankState();
  }else{
    anaEditId=null; anaState=anaBlankState();
    resetInputBaru('ana');
  }
  anaStep=1; anaAhspActive=0; anaEnsure(); anaSaveState(); showView('form-analisa');
}
function openAnalisaView(){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  refreshDataAnalisa().then(()=>showView('analisa-view'));
}
function anaRecordToState(rec){
  const base=anaBlankState();
  const s=(rec&&rec.state&&typeof rec.state==='object')?rec.state:{};
  const st={
    info: Object.assign({}, base.info, s.info||{}),
    jumlahItem: Math.max(1,Math.min(ANA_MAX_ITEM, parseInt(s.jumlahItem,10)||1)),
    jumlahRef:  Math.max(1,Math.min(ANA_MAX_REF,  parseInt(s.jumlahRef,10)||1)),
    sumber: Array.isArray(s.sumber)?s.sumber.slice():[''],
    refs: Array.isArray(s.refs)?s.refs.map(rf=>({items:(rf&&Array.isArray(rf.items))?rf.items.map(anaNormRefItem):[anaBlankRefItem()]})):[anaBlankRef()],
    metodeRef: s.metodeRef==='Berbeda'?'Berbeda':'Sama',
    metodeAll: s.metodeAll==='Terendah'?'Terendah':'Rata-rata',
    aktifRef: parseInt(s.aktifRef,10)||0,
    jenis: s.jenis==='Konstruksi'?'Konstruksi':'Umum',
    rok: (s.rok!=null?s.rok:''),
    // Kompatibilitas data lama: rokOn belum ada → dianggap "Ya" bila nilai ROK terisi
    rokOn: (s.rokOn!=null ? (s.rokOn==='Ya'?'Ya':'Tidak') : ((anaNum(s.rok)>0)?'Ya':'Tidak')),
    inflasi: s.inflasi==='Ya'?'Ya':'Tidak',
    inflasiVals: Array.isArray(s.inflasiVals)?s.inflasiVals.slice():[],
    inflasiNilai: (s.inflasiNilai!=null?s.inflasiNilai:''),
    judulOn: (s.jenis!=='Konstruksi' && s.judulOn==='Ya')?'Ya':'Tidak',
    judulNum: jsNumStyleOk(s.judulNum,''),
    subjudulOn: (s.jenis!=='Konstruksi' && s.subjudulOn==='Ya')?'Ya':'Tidak',
    subjudulNum: jsNumStyleOk(s.subjudulNum,''),
    konstruksi: (s.konstruksi&&typeof s.konstruksi==='object') ? {
      jumlahItem: Math.max(1,Math.min(ANA_MAX_ITEM, parseInt(s.konstruksi.jumlahItem,10)||1)),
      items: Array.isArray(s.konstruksi.items)&&s.konstruksi.items.length ? s.konstruksi.items.map(anaNormKonItem) : [anaBlankKonItem()]
    } : { jumlahItem:1, items:[anaBlankKonItem()] },
    ahsp: Array.isArray(s.ahsp)&&s.ahsp.length
      ? s.ahsp.map(anaNormAhspLayer)
      : ((s.ahsp&&typeof s.ahsp==='object'&&(Array.isArray(s.ahsp.tenagaKerja)||Array.isArray(s.ahsp.bahan)||Array.isArray(s.ahsp.alat))) ? [anaNormAhspLayer(s.ahsp)] : anaBlankAhsp())
  };
  const _save=anaState; anaState=st; anaEnsure(); const out=anaState; anaState=_save; return out;
}

/* ---------- Stepper ---------- */
function anaStepperHtml(){
  const st=anaState;
  const steps = st.jenis==='Konstruksi'
    ? [['1','Data Pekerjaan'],['2','Harga Satuan'],['3','Analisa Harga Satuan Pekerjaan']]
    : [['1','Data Pekerjaan & Sumber Referensi'],['2','Analisa Harga Satuan'],['3','Hasil Analisa Harga Satuan']];
  return '<div class="fkl-stepper">'+steps.map((s,i)=>{
    const n=i+1;
    const cls = n<anaStep ? 'done' : (n===anaStep ? 'active' : '');
    const mark = n<anaStep ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>' : s[0];
    const line = i<steps.length-1 ? '<div class="fkl-step-line '+(n<anaStep?'done':'')+'"></div>' : '';
    return '<div class="fkl-step '+cls+'"><div class="fkl-step-dot">'+mark+'</div><div class="fkl-step-name">'+s[1]+'</div></div>'+line;
  }).join('')+'</div>';
}
function anaMaxStep(){ return 3; }
/* Selector Jenis Pekerjaan — tampil di kanan atas kartu Data Pekerjaan (Langkah 1),
   menentukan alur 2 langkah (Umum) atau 3 langkah (Konstruksi). */
function anaJenisTopHtml(){
  const st=anaState;
  return '<div class="ana-jenis-top"><label>Jenis Pekerjaan</label>'+
    '<select id="ana-jenis-top" onchange="anaOnJenisTop(this)">'+
    '<option value="Umum"'+(st.jenis==='Umum'?' selected':'')+'>Pekerjaan Umum</option>'+
    '<option value="Konstruksi"'+(st.jenis==='Konstruksi'?' selected':'')+'>Pekerjaan Konstruksi</option>'+
    '</select></div>';
}
function anaOnJenisTop(el){
  anaState.jenis=(el.value==='Konstruksi')?'Konstruksi':'Umum';
  anaEnsure(); anaSaveState(); anaStep=1; renderAnalisaForm();
}
/* Kontrol kanan-atas kartu Data Pekerjaan (Langkah 1): gabungan Jenis Pekerjaan
   + tombol Pilih/Ganti/Lepas Data Pekerjaan dalam SATU baris (satu layer). */
function anaTopControlsHtml(){
  return '<div class="ana-top-controls">'+anaJenisTopHtml()+'<div class="ana-top-dp">'+dpPickBtnHtml('ana')+'</div></div>';
}

/* ================= LANGKAH 1 ================= */
function anaInfoInputHtml(f){
  const id='ana-'+f.key;
  const locked=anaIsLocked(f.key);
  const span=f.span?(' style="grid-column:span '+f.span+'"'):'';
  const dis = locked ? ' disabled' : '';
  let ctl;
  if(f.type==='select') ctl='<select id="'+id+'"'+dis+' onchange="anaOnInfoChange()"><option value="">— Pilih —</option>'+(f.options||[]).map(o=>'<option>'+fkEsc(o)+'</option>').join('')+'</select>';
  else if(f.type==='num') ctl='<input id="'+id+'" type="text" inputmode="numeric" placeholder="Rp"'+dis+' oninput="onRupiahInput(this)" onchange="anaOnInfoChange()">';
  else if(f.type==='date') ctl='<input id="'+id+'" type="date"'+dis+' onchange="anaOnInfoChange()">';
  else ctl='<input id="'+id+'" type="text"'+dis+' oninput="anaOnInfoChange()">';
  return '<div class="field'+(locked?' is-locked':'')+'"'+span+'><label>'+fkEsc(f.label)+'</label>'+ctl+(locked?DP_LOCK_BADGE:'')+'</div>';
}
function anaCountItemFieldHtml(){
  const st=anaState;
  let opts=''; for(let i=1;i<=ANA_MAX_ITEM;i++) opts+='<option value="'+i+'"'+(i===st.jumlahItem?' selected':'')+'>'+i+' Item</option>';
  return '<div class="field"><label>Jumlah Barang/Jasa</label><select id="ana-jumlahitem" onchange="anaOnJumlahItemChange(this)">'+opts+'</select></div>';
}
function anaCountRefFieldHtml(){
  const st=anaState;
  let opts=''; for(let i=1;i<=ANA_MAX_REF;i++) opts+='<option value="'+i+'"'+(i===st.jumlahRef?' selected':'')+'>'+i+' Referensi</option>';
  return '<div class="field"><label>Jumlah Referensi</label><select id="ana-jumlahref" onchange="anaOnJumlahRefChange(this)">'+opts+'</select></div>';
}
function anaSumberGridHtml(){
  const st=anaState;
  let cells='';
  for(let i=0;i<st.jumlahRef;i++){
    cells+='<div class="ana-ref-cell"><span class="rn">'+(i+1)+'</span>'+
      '<input type="text" data-i="'+i+'" placeholder="Sumber referensi ke-'+(i+1)+'" value="'+fkEsc(st.sumber[i]||'')+'" oninput="anaOnSumber(this)"></div>';
  }
  return '<div class="ana-ref-grid">'+cells+'</div>';
}
function anaOnInfoChange(){
  const st=anaState;
  ANA_INFO_FIELDS.forEach(f=>{ if(anaIsLocked(f.key)) return; const el=document.getElementById('ana-'+f.key); if(!el) return; st.info[f.key]=(f.type==='num')?parseRupiah(el.value):el.value.trim(); });
  anaSaveState();
}
/* Bar wajib "Pilih Data Pekerjaan" — sumber nama/lokasi/nilai/no.anggaran/tgl.anggaran/metode. */
function anaDpBarHtml(){
  const info=anaState.info||{};
  const dipilih = info.dpId ? String(info.dpNama||info.nama||'').trim() : '';
  const sub = dipilih
    ? ('Data pekerjaan terisi otomatis & terkunci dari: <b style="color:var(--teal-dark)">'+fkEsc(dipilih)+'</b>')
    : 'Opsional — pilih Data Pekerjaan agar kolom Nama/Lokasi/Nilai/No. Anggaran/Tgl. Anggaran/Metode terisi otomatis, atau isi manual pada kolom di bawah.';
  let btns='<button type="button" class="btn btn-teal" style="padding:8px 14px;font-size:11.5px" onclick="anaPilihDp()">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M4 4h5l2 3h9a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>'+(dipilih?'Ganti Data Pekerjaan':'Pilih Data Pekerjaan')+'</button>';
  if(dipilih) btns+='<button type="button" class="btn btn-unpick" style="padding:8px 14px;font-size:11.5px" onclick="anaLepasDp()">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M18 6 6 18M6 6l12 12"/></svg>Lepas Pilihan</button>';
  return '<div class="hps-analisa-bar">'+
    '<div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h5l2 3h9a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg></div>'+
    '<div class="tx"><b>Pilih Data Pekerjaan</b><span>'+sub+'</span></div>'+btns+
  '</div>';
}
function anaPilihDp(){ openDpPicker('ana'); }
/* Dipanggil oleh dpPickerSelect() saat sebuah Data Pekerjaan dipilih untuk Analisa Harga */
function anaApplyDp(rec){
  const st=anaState; st.info=st.info||{};
  const info=(rec.state&&rec.state.info)||{};
  DP_SHARED_KEYS.forEach(k=>{ st.info[k]=(info[k]!=null?info[k]:''); });
  st.info.dpId=String(rec.id);
  st.info.dpNama=rec.nama_pekerjaan||info.nama||'';
  anaSaveState();
  anaRevealPick=true;   // pemicu animasi reveal konten di bawah tombol
  renderAnalisaForm();
  toast('Data pekerjaan berhasil diterapkan','ok');
}
/* Lepas pilihan Data Pekerjaan → kembali ke kondisi belum dipilih (wajib pilih ulang) */
function anaLepasDp(){
  const st=anaState; if(!st.info) return;
  delete st.info.dpId; delete st.info.dpNama;
  DP_SHARED_KEYS.forEach(k=>{ st.info[k]=''; });
  anaSaveState(); renderAnalisaForm();
  toast('Pilihan Data Pekerjaan dilepas','ok');
}
function anaOnJumlahItemChange(el){ anaState.jumlahItem=Math.max(1,Math.min(ANA_MAX_ITEM,parseInt(el.value,10)||1)); anaEnsure(); anaSaveState(); renderAnalisaForm(); }
function anaOnJumlahRefChange(el){
  anaState.jumlahRef=Math.max(1,Math.min(ANA_MAX_REF,parseInt(el.value,10)||1)); anaEnsure(); anaSaveState();
  renderAnalisaForm();   // perbarui grid sumber referensi + tabel Analisa Harga Satuan seketika (halaman gabungan)
}
function anaOnSumber(el){ const i=+el.dataset.i; if(anaState.sumber[i]!=null||i<anaState.jumlahRef){ anaState.sumber[i]=el.value; anaSaveState(); } }

/* ============= PEKERJAAN KONSTRUKSI — BAGIAN 2: HARGA SATUAN ============= */
/* Baris tabel Harga Satuan ditambah/dihapus bebas per baris (tidak terikat jumlah item Umum). */
function anaKonAddRow(afterIdx){
  const st=anaState.konstruksi; if(!Array.isArray(st.items)) st.items=[];
  const pos = (afterIdx!=null && afterIdx>=0) ? afterIdx+1 : st.items.length;
  st.items.splice(pos, 0, anaBlankKonItem());
  st.jumlahItem=st.items.length; anaSaveState();
  const wrap=document.getElementById('ana-kon-table-wrap'); if(wrap) wrap.innerHTML=anaKonTableHtml();
}
function anaKonRemoveRow(i){
  const st=anaState.konstruksi; if(!Array.isArray(st.items)) return;
  if(st.items.length<=1){ toast('Minimal harus ada 1 baris','warn'); return; }
  st.items.splice(i,1); st.jumlahItem=st.items.length; anaSaveState();
  const wrap=document.getElementById('ana-kon-table-wrap'); if(wrap) wrap.innerHTML=anaKonTableHtml();
}
/* Pekerjaan Konstruksi tidak memakai Judul/Sub-Judul — tabel tanpa kedua kolom itu. */
function anaKonTableHtml(){
  const st=anaState.konstruksi;
  let rows='';
  st.items.forEach((it,i)=>{
    rows+='<tr>'+
      '<td class="c-no">'+(i+1)+'</td>'+

      '<td class="c-ur"><textarea data-i="'+i+'" rows="1" placeholder="Uraian pekerjaan ke-'+(i+1)+'" oninput="anaOnKonCell(this,\'uraian\')">'+fkEsc(it.uraian||'')+'</textarea></td>'+
      '<td class="c-sat"><input type="text" data-i="'+i+'" placeholder="Bh" value="'+fkEsc(it.sat||'')+'" oninput="anaOnKonCell(this,\'sat\')"></td>'+
      '<td class="c-money"><input type="text" inputmode="numeric" id="ana-kon-hb-'+i+'" data-i="'+i+'" placeholder="Rp" value="'+rupiahInputText(it.hargaBarang)+'" oninput="anaOnKonHargaBarang(this)"></td>'+
      '<td class="c-money"><input type="text" inputmode="numeric" id="ana-kon-hj-'+i+'" data-i="'+i+'" placeholder="Rp" value="'+rupiahInputText(it.hargaJasa)+'" oninput="anaOnKonHargaJasa(this)"></td>'+
      '<td class="c-ref"><input type="text" data-i="'+i+'" placeholder="mis. SNI, survei pasar" value="'+fkEsc(it.sumberRef||'')+'" oninput="anaOnKonSumberRef(this)"></td>'+
      '<td class="c-act"><button type="button" class="ana-ahsp-add ana-row-add" title="Tambah baris di bawah" onclick="anaKonAddRow('+i+')">+</button>'+
        '<button type="button" class="ana-ahsp-del" title="Hapus baris" onclick="anaKonRemoveRow('+i+')">&times;</button></td>'+
    '</tr>';
  });
  return '<div class="hps-uraian-wrap"><table class="hps-uraian"><thead>'+
    '<tr><th class="c-no">No</th><th class="c-ur">Uraian Pekerjaan</th><th>Satuan</th>'+
      '<th>Harga Barang<br>(Rp)</th><th>Harga Jasa<br>(Rp)</th><th class="c-ref">Sumber Referensi</th><th></th></tr>'+
    '</thead><tbody>'+rows+'</tbody></table></div>';
}
function anaOnKonCell(el,key){ const i=+el.dataset.i; const st=anaState.konstruksi; if(st.items[i]){ st.items[i][key]=el.value; anaSaveState(); } }
function anaOnKonHargaBarang(el){
  onRupiahInput(el); const i=+el.dataset.i; const st=anaState.konstruksi;
  if(st.items[i]){ st.items[i].hargaBarang=parseRupiah(el.value); anaSaveState(); }
}
function anaOnKonHargaJasa(el){
  onRupiahInput(el); const i=+el.dataset.i; const st=anaState.konstruksi;
  if(st.items[i]){ st.items[i].hargaJasa=parseRupiah(el.value); anaSaveState(); }
}


/* Sumber Referensi kini per-baris (kolom di tabel Harga Satuan), bukan daftar terpisah */
function anaOnKonSumberRef(el){ const i=+el.dataset.i; const st=anaState.konstruksi; if(st.items[i]){ st.items[i].sumberRef=el.value; anaSaveState(); } }


/* ============= PEKERJAAN KONSTRUKSI — BAGIAN 3: ANALISA HARGA SATUAN PEKERJAAN (AHSP) =============
   Setiap "layer" adalah SATU analisa lengkap untuk SATU pekerjaan (judul + A/B/C + ROK).
   Tombol "+ Tambah Layer" menambah analisa untuk pekerjaan berikutnya, dst. */
const ANA_IC_VIEW='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
function anaAhspRokFieldHtml(li,layer){
  const cur=(layer.rok!==''&&layer.rok!=null)?String(anaNum(layer.rok)):'';
  let opts='<option value=""'+(cur===''?' selected':'')+'>ROK — Tidak ada</option>';
  for(let n=1;n<=15;n++) opts+='<option value="'+n+'"'+(cur===String(n)?' selected':'')+'>ROK '+n+'%</option>';
  return '<div class="ana-tb-field ana-ahsp-rok-field"><label>ROK (%) — maks 15%</label>'+
    '<select id="ana-ahsp-rok-'+li+'" class="ana-ahsp-rok-btn" onchange="anaOnAhspRok('+li+',this)">'+opts+'</select></div>';
}
function anaAhspLayerHtml(li){
  const layer=anaState.ahsp[li];
  return '<div class="ana-ahsp-layer">'+
    '<div class="ana-ahsp-head">'+
      '<div class="tt">'+ANA_SEC_ICON+'<span class="ana-ahsp-no">'+(li+1)+'.</span>'+
        '<input type="text" class="ana-ahsp-judul-input" placeholder="Judul/Nama Pekerjaan (mis. Pembersihan Lahan)" value="'+fkEsc(layer.judul||'')+'" oninput="anaOnAhspJudul('+li+',this)"></div>'+
      anaAhspRokFieldHtml(li,layer)+
    '</div>'+
    ANA_AHSP_SECTIONS.map(([key,letter,title])=>anaAhspSectionHtml(li,key,letter,title)).join('')+
  '</div>';
}
function anaOnAhspJudul(li,el){ if(anaState.ahsp[li]){ anaState.ahsp[li].judul=el.value; anaSaveState(); } }
function anaOnAhspRok(li,el){
  const v=el.value; // '' (tidak ada) atau '1'..'15'
  if(anaState.ahsp[li]){ anaState.ahsp[li].rok=(v===''?'':(parseFloat(v)||0)); anaSaveState(); }
  ANA_AHSP_SECTIONS.forEach(([key])=>anaAhspRecalcSubtotal(li,key));
}
function anaAhspSubtotal(li,key){ const layer=anaState.ahsp[li]; return (layer&&layer[key]||[]).reduce((s,r)=>s+anaAhspJumlah(r),0); }
function anaAhspSectionHtml(li,key,letter,title){
  const layer=anaState.ahsp[li];
  const rows=layer[key]||[];
  let body='';
  rows.forEach((r,i)=>{
    body+='<tr>'+
      '<td class="c-no">'+(i+1)+'</td>'+
      '<td class="c-ur"><input type="text" data-i="'+i+'" placeholder="Uraian" value="'+fkEsc(r.uraian||'')+'" oninput="anaOnAhspCell('+li+',\''+key+'\',this,\'uraian\')"></td>'+
      '<td class="c-sat"><input type="text" data-i="'+i+'" placeholder="OH" value="'+fkEsc(r.sat||'')+'" oninput="anaOnAhspCell('+li+',\''+key+'\',this,\'sat\')"></td>'+
      '<td class="c-koef"><input type="text" inputmode="decimal" data-i="'+i+'" placeholder="0" value="'+fkEsc(r.koef!=null?String(r.koef):'')+'" oninput="anaOnAhspKoef('+li+',\''+key+'\',this)"></td>'+
      '<td class="c-money"><input type="text" inputmode="numeric" id="ana-ahsp-'+li+'-'+key+'-hg-'+i+'" data-i="'+i+'" placeholder="Rp" value="'+rupiahInputText(r.harga)+'" oninput="anaOnAhspHarga('+li+',\''+key+'\',this)"></td>'+
      '<td class="c-calc" id="ana-ahsp-'+li+'-'+key+'-jt-'+i+'">'+anaRp(anaAhspJumlah(r))+'</td>'+
      '<td class="c-act"><button type="button" class="ana-ahsp-del" title="Hapus baris" onclick="anaAhspRemoveRow('+li+',\''+key+'\','+i+')">&times;</button></td>'+
    '</tr>';
  });
  const subtotal=anaAhspSubtotal(li,key);
  const rok=anaNum(layer.rok);
  const adj = rok>0 ? Math.round(subtotal*(1+rok/100)) : subtotal;
  const rokTxt = rok>0 ? (' <span class="ana-rok-chip">(+ROK '+rok+'%) = '+anaRp(adj)+'</span>') : '';
  return '<div class="ana-ahsp-sec">'+
    '<div class="ana-ahsp-sec-title"><span class="ana-ahsp-sec-badge">'+letter+'</span><span class="ana-ahsp-sec-label">'+title+'</span><button type="button" class="ana-ahsp-add" onclick="anaAhspAddRow('+li+',\''+key+'\')">+ Tambah Baris</button></div>'+
    '<div class="hps-uraian-wrap"><table class="hps-uraian ana-ahsp-table"><thead><tr>'+
      '<th class="c-no">No</th><th class="c-ur">Uraian</th><th>Satuan</th><th>Koefisien</th><th>Harga Satuan<br>(Rp)</th><th>Jumlah Harga<br>(Rp)</th><th></th>'+
    '</tr></thead><tbody>'+body+'</tbody>'+
    '<tfoot><tr class="ana-ahsp-sum"><td colspan="5">JUMLAH HARGA '+title+'</td><td colspan="2" id="ana-ahsp-sum-'+li+'-'+key+'">'+anaRp(subtotal)+rokTxt+'</td></tr></tfoot>'+
    '</table></div></div>';
}
function anaAhspAddRow(li,key){
  const layer=anaState.ahsp[li]; if(!layer) return; if(!Array.isArray(layer[key])) layer[key]=[];
  layer[key].push(anaBlankAhspRow()); anaSaveState(); anaRenderAhspBody();
}
function anaAhspRemoveRow(li,key,i){
  const layer=anaState.ahsp[li]; if(!layer||!Array.isArray(layer[key])) return;
  if(layer[key].length<=1){ toast('Minimal harus ada 1 baris','warn'); return; }
  layer[key].splice(i,1); anaSaveState(); anaRenderAhspBody();
}
function anaOnAhspCell(li,key,el,field){ const i=+el.dataset.i; const layer=anaState.ahsp[li]; if(layer&&layer[key]&&layer[key][i]){ layer[key][i][field]=el.value; anaSaveState(); } }
function anaOnAhspKoef(li,key,el){
  let v=el.value.replace(/[^0-9.,]/g,'').replace(/,/g,'.'); const parts=v.split('.'); if(parts.length>2) v=parts[0]+'.'+parts.slice(1).join(''); el.value=v;
  const i=+el.dataset.i; const layer=anaState.ahsp[li];
  if(layer&&layer[key]&&layer[key][i]){ layer[key][i].koef=v; anaSaveState(); anaAhspRecalcRow(li,key,i); }
}
function anaOnAhspHarga(li,key,el){
  onRupiahInput(el); const i=+el.dataset.i; const layer=anaState.ahsp[li];
  if(layer&&layer[key]&&layer[key][i]){ layer[key][i].harga=parseRupiah(el.value); anaSaveState(); anaAhspRecalcRow(li,key,i); }
}
function anaAhspRecalcRow(li,key,i){
  const layer=anaState.ahsp[li]; const r=layer&&layer[key]&&layer[key][i]; if(!r) return;
  const c=document.getElementById('ana-ahsp-'+li+'-'+key+'-jt-'+i); if(c) c.innerHTML=anaRp(anaAhspJumlah(r));
  anaAhspRecalcSubtotal(li,key);
}
function anaAhspRecalcSubtotal(li,key){
  const el=document.getElementById('ana-ahsp-sum-'+li+'-'+key); if(!el) return;
  const layer=anaState.ahsp[li]; if(!layer) return;
  const subtotal=anaAhspSubtotal(li,key);
  const rok=anaNum(layer.rok);
  const adj = rok>0 ? Math.round(subtotal*(1+rok/100)) : subtotal;
  const rokTxt = rok>0 ? (' <span class="ana-rok-chip">(+ROK '+rok+'%) = '+anaRp(adj)+'</span>') : '';
  el.innerHTML=anaRp(subtotal)+rokTxt;
}
function anaAhspAddLayer(){
  anaState.ahsp.push(anaBlankAhspLayer());
  anaAhspActive=anaState.ahsp.length-1; // pindah ke halaman/layer baru yang baru ditambahkan
  anaSaveState(); anaRenderAhspBody();
}
function anaAhspRemoveLayer(li){
  if(anaState.ahsp.length<=1){ toast('Minimal harus ada 1 analisa','warn'); return; }
  anaState.ahsp.splice(li,1);
  if(anaAhspActive>=anaState.ahsp.length) anaAhspActive=anaState.ahsp.length-1;
  else if(anaAhspActive>li) anaAhspActive--;
  anaSaveState(); anaRenderAhspBody();
}
function anaAhspGotoLayer(li){
  const n=anaState.ahsp.length;
  anaAhspActive=Math.max(0,Math.min(n-1,li));
  anaRenderAhspBody();
}
/* Bar navigasi Bagian 3: paginasi antar layer di kiri, aksi Tambah/Hapus Analisa di kanan. */
function anaAhspTopBarHtml(){
  const n=anaState.ahsp.length;
  let pagerInner='';
  if(n>1){
    let nums='';
    for(let i=0;i<n;i++) nums+='<button type="button" class="pg-btn pg-num'+(i===anaAhspActive?' active':'')+'" onclick="anaAhspGotoLayer('+i+')">'+(i+1)+'</button>';
    pagerInner='<button type="button" class="pg-btn" '+(anaAhspActive===0?'disabled':'')+' onclick="anaAhspGotoLayer('+(anaAhspActive-1)+')">‹ Sebelumnya</button>'+
      nums+
      '<button type="button" class="pg-btn" '+(anaAhspActive===n-1?'disabled':'')+' onclick="anaAhspGotoLayer('+(anaAhspActive+1)+')">Berikutnya ›</button>';
  } else {
    pagerInner='<span class="ana-ahsp-onlylabel">Analisa 1 dari 1</span>';
  }
  const canDel=n>1;
  return '<div class="ana-ahsp-topbar">'+
    '<div class="ana-ahsp-topbar-pager">'+pagerInner+'</div>'+
    '<div class="ana-ahsp-topbar-actions">'+
      '<button type="button" class="ana-ahsp-add" onclick="anaAhspAddLayer()">+ Tambah Analisa</button>'+
      (canDel?('<button type="button" class="ana-ahsp-hapus-analisa" title="Hapus analisa ini" onclick="anaAhspRemoveLayer('+anaAhspActive+')">&times; Hapus Analisa</button>'):'')+
    '</div>'+
  '</div>';
}
function anaRenderAhspBody(){
  const holder=document.getElementById('ana-ahsp-body'); if(!holder) return;
  if(anaAhspActive>=anaState.ahsp.length) anaAhspActive=anaState.ahsp.length-1;
  if(anaAhspActive<0) anaAhspActive=0;
  holder.innerHTML = anaAhspTopBarHtml() + anaAhspLayerHtml(anaAhspActive);
}

/* ================= LANGKAH 2: ANALISA HARGA SATUAN ================= */
/* Nama tampil untuk sebuah referensi (pakai sumber bila diisi). */
function anaRefLabel(r){ const s=(anaState.sumber[r]||'').trim(); return s?s:('Referensi '+(r+1)); }

/* Toolbar: pemilih Referensi + Metode Perhitungan (Sama/Berbeda) + (Rata-rata/Terendah bila Sama). */
function anaToolbarHtml(){
  const st=anaState;
  let refOpts=''; for(let r=0;r<st.jumlahRef;r++) refOpts+='<option value="'+r+'"'+(r===st.aktifRef?' selected':'')+'>'+fkEsc(anaRefLabel(r))+'</option>';
  let html='<div class="ana-toolbar">';
  html+='<div class="ana-tb-field"><label>Referensi</label><select id="ana-aktifref" onchange="anaOnAktifRef(this)">'+refOpts+'</select></div>';
  html+='<div class="ana-tb-field"><label>Metode Perhitungan</label><select id="ana-metoderef" onchange="anaOnMetodeRef(this)">'+
        '<option value="Sama"'+(st.metodeRef==='Sama'?' selected':'')+'>Sama</option>'+
        '<option value="Berbeda"'+(st.metodeRef==='Berbeda'?' selected':'')+'>Berbeda</option></select></div>';
  if(st.metodeRef==='Sama'){
    html+='<div class="ana-tb-field"><label>Metode (Semua Uraian)</label><select id="ana-metodeall" onchange="anaOnMetodeAll(this)">'+
          '<option value="Rata-rata"'+(st.metodeAll==='Rata-rata'?' selected':'')+'>Rata-rata</option>'+
          '<option value="Terendah"'+(st.metodeAll==='Terendah'?' selected':'')+'>Terendah</option></select></div>';
  }
  html+='</div>';
  return html;
}
/* ROK? & Inflasi? — pola sama seperti Judul?/Sub-Judul?: dropdown Ya/Tidak, dan bila
   "Ya" muncul kotak angka sempit yang dipotong dari lebar field itu sendiri
   (ROK selebar 2 digit, Nilai Inflasi selebar 4 digit). */
function anaRokInflasiFieldsHtml(){
  const st=anaState;
  const rokOn=jsOn(st.rokOn), infOn=jsOn(st.inflasi);
  const rokVal=(st.rok!==''&&st.rok!=null)?String(st.rok):'';
  const infNilai=(st.inflasiNilai!==''&&st.inflasiNilai!=null)?String(st.inflasiNilai):'';
  const rokMax=(st.jenis==='Konstruksi')?15:10;
  return '<div class="field js-judul-field"><label id="ana-rok-label">ROK? (maks '+rokMax+'%)</label>'+
      '<div class="js-judul-row">'+jsYaTidakHtml('ana-rokon',st.rokOn,'anaOnRokOn')+
        (rokOn?('<input class="js-numbox js-num2" id="ana-rok" type="text" inputmode="decimal" maxlength="5" placeholder="0" title="Maksimal '+rokMax+'% ('+(st.jenis==='Konstruksi'?'Pekerjaan Konstruksi':'Pekerjaan Umum')+')" value="'+fkEsc(rokVal)+'" oninput="anaOnRok(this)">'):'')+
      '</div></div>'+
    '<div class="field js-judul-field"><label>Inflasi?</label>'+
      '<div class="js-judul-row">'+jsYaTidakHtml('ana-inflasi',st.inflasi,'anaOnInflasi')+
        (infOn?('<input class="js-numbox js-num4" id="ana-inflasi-nilai" type="text" inputmode="decimal" maxlength="6" placeholder="0" title="Nilai inflasi (%)" value="'+fkEsc(infNilai)+'" oninput="anaOnInflasiNilai(this)">'):'')+
      '</div></div>';
}
/* Isi ulang baris ROK/Inflasi (+Judul/Sub-Judul bila Pekerjaan Umum) */
function anaRefreshRokInfBox(){ renderAnalisaForm(); }
/* ROK? = Tidak → nilai ROK dikosongkan & tidak ikut dihitung */
function anaOnRokOn(el){
  const on=(el.value==='Ya');
  anaState.rokOn=on?'Ya':'Tidak';
  if(!on) anaState.rok='';
  anaSaveState();
  anaRefreshRokInfBox();
  anaRenderResult();
}
/* Field Judul? & Sub-Judul? — tampil pada kartu Data Pekerjaan (Umum & Konstruksi) */
function anaJudulFieldsHtml(){
  const st=anaState;
  const f=(lbl,idOn,vOn,hOn,idN,vN,hN)=>
    '<div class="field js-judul-field"><label>'+lbl+'</label>'+
      '<div class="js-judul-row">'+jsYaTidakHtml(idOn,vOn,hOn)+(jsOn(vOn)?jsNumSelectHtml(idN,vN,hN):'')+'</div></div>';
  return f('Judul?','ana-judulon',st.judulOn,'anaOnJudulOn','ana-judulnum',st.judulNum,'anaOnJudulNum')+
         f('Sub-Judul?','ana-subon',st.subjudulOn,'anaOnSubOn','ana-subnum',st.subjudulNum,'anaOnSubNum');
}
function anaOnJudulOn(el){ anaState.judulOn=(el.value==='Ya')?'Ya':'Tidak'; anaSaveState(); renderAnalisaForm(); }
function anaOnSubOn(el){ anaState.subjudulOn=(el.value==='Ya')?'Ya':'Tidak'; anaSaveState(); renderAnalisaForm(); }
function anaOnJudulNum(el){ anaState.judulNum=jsNumStyleOk(el.value,''); anaSaveState(); }
function anaOnSubNum(el){ anaState.subjudulNum=jsNumStyleOk(el.value,''); anaSaveState(); }

function anaOnInflasi(el){
  anaState.inflasi=(el.value==='Ya')?'Ya':'Tidak';
  if(anaState.inflasi!=='Ya') anaState.inflasiNilai='';
  anaSaveState();
  anaRefreshRokInfBox();
  anaRenderResult();
}
/* Nilai Inflasi global (satu nilai untuk semua uraian) — tampil bila Inflasi? = Ya. */
function anaOnInflasiNilai(el){
  let v=el.value.replace(/[^0-9.,]/g,'').replace(/,/g,'.'); const parts=v.split('.'); if(parts.length>2) v=parts[0]+'.'+parts.slice(1).join(''); el.value=v;
  anaState.inflasiNilai=(v===''?'':(parseFloat(v)||0)); anaSaveState();
  anaRenderResult();
}
function anaOnInflasiVal(el){
  let v=el.value.replace(/[^0-9.,]/g,'').replace(/,/g,'.'); const parts=v.split('.'); if(parts.length>2) v=parts[0]+'.'+parts.slice(1).join(''); el.value=v;
  const i=+el.dataset.i; if(!Array.isArray(anaState.inflasiVals)) anaState.inflasiVals=[];
  anaState.inflasiVals[i]=(v===''?'':(parseFloat(v)||0)); anaSaveState();
  const res=anaResultFor(i);
  const hb=document.getElementById('ana-hb-'+i); if(hb) hb.textContent=anaRp(res.hargaBarang);
  const hj=document.getElementById('ana-hj-'+i); if(hj) hj.textContent=anaRp(res.hargaJasa);
  const tt=document.getElementById('ana-tot-'+i); if(tt) tt.textContent=anaRp(res.total);
}
function anaOnAktifRef(el){ anaState.aktifRef=Math.max(0,Math.min(anaState.jumlahRef-1,parseInt(el.value,10)||0)); anaSaveState(); anaRenderStep2Body(); }
function anaOnRok(el){
  let v=el.value.replace(/[^0-9.,]/g,'').replace(/,/g,'.');
  const parts=v.split('.'); if(parts.length>2) v=parts[0]+'.'+parts.slice(1).join('');
  // Batas ROK mengikuti Jenis Pekerjaan: Pekerjaan Umum 10%, Pekerjaan Konstruksi 15%
  const rokMax=(anaState.jenis==='Konstruksi')?15:10;
  let num=parseFloat(v); if(!isNaN(num)&&num>rokMax){ v=String(rokMax); }
  el.value=v; anaState.rok=(v===''?'':(parseFloat(v)||0)); anaSaveState();
  anaRenderResult();
}
function anaOnMetodeRef(el){ anaState.metodeRef=(el.value==='Berbeda')?'Berbeda':'Sama'; anaSaveState(); anaRenderStep2Body(); }
function anaOnMetodeAll(el){ anaState.metodeAll=(el.value==='Terendah')?'Terendah':'Rata-rata'; anaSaveState(); anaRenderResult(); }

/* Tabel input untuk referensi aktif. Uraian sebanyak Jumlah Barang/Jasa.
   Kolom Metode per-uraian hanya tampil saat metodeRef='Berbeda' (nilai disimpan pada referensi ke-0 sebagai acuan bersama). */
function anaUraianTableHtml(){
  const st=anaState; const r=st.aktifRef; const ref=st.refs[r]||anaBlankRef();
  const showMethod=(st.metodeRef==='Berbeda');
  const jOn=jsOn(st.judulOn), sOn=jsOn(st.subjudulOn);
  let rows='';
  ref.items.forEach((it,i)=>{
    const m=(st.refs[0]&&st.refs[0].items[i]&&st.refs[0].items[i].method)||'Rata-rata';
    rows+='<tr>'+
      '<td class="c-no">'+(i+1)+'</td>'+
      (jOn?('<td class="c-kel"><input type="text" data-i="'+i+'" placeholder="mis. PEKERJAAN PERSIAPAN" value="'+fkEsc(it.judul||'')+'" oninput="anaOnCell(this,\'judul\')"></td>'):'')+
      (sOn?('<td class="c-kel"><input type="text" data-i="'+i+'" placeholder="mis. Material Utama" value="'+fkEsc(it.subjudul||'')+'" oninput="anaOnCell(this,\'subjudul\')"></td>'):'')+
      '<td class="c-ur"><textarea data-i="'+i+'" rows="1" placeholder="Uraian pekerjaan / barang / jasa ke-'+(i+1)+'" oninput="anaOnCell(this,\'uraian\')">'+fkEsc(it.uraian||'')+'</textarea></td>'+
      '<td class="c-sat"><input type="text" data-i="'+i+'" placeholder="Bh" value="'+fkEsc(it.sat||'')+'" oninput="anaOnCell(this,\'sat\')"></td>'+
      '<td class="c-vol"><input type="text" inputmode="decimal" data-i="'+i+'" placeholder="0" value="'+fkEsc(it.vol!=null?String(it.vol):'')+'" oninput="anaOnVol(this)"></td>'+
      '<td class="c-money"><input type="text" inputmode="numeric" data-i="'+i+'" placeholder="Rp" value="'+rupiahInputText(it.hargaBarang)+'" oninput="anaOnHarga(this,\'hargaBarang\')"></td>'+
      '<td class="c-money"><input type="text" inputmode="numeric" data-i="'+i+'" placeholder="Rp" value="'+rupiahInputText(it.hargaJasa)+'" oninput="anaOnHarga(this,\'hargaJasa\')"></td>'+
      (showMethod?('<td class="c-method"><select data-i="'+i+'" onchange="anaOnMethodRow(this)">'+
        '<option value="Rata-rata"'+(m==='Rata-rata'?' selected':'')+'>Rata-rata</option>'+
        '<option value="Terendah"'+(m==='Terendah'?' selected':'')+'>Terendah</option></select></td>'):'')+
    '</tr>';
  });
  return '<div class="ana-uraian-wrap"><table class="ana-uraian"><thead>'+
    '<tr><th class="c-no">No</th>'+(jOn?'<th>Judul</th>':'')+(sOn?'<th>Sub-Judul</th>':'')+'<th class="c-ur">Uraian Pekerjaan</th><th>Sat</th><th>Vol</th>'+
      '<th>Harga<br>Barang</th><th>Harga<br>Jasa</th>'+
      (showMethod?'<th>Metode<br>Perhitungan</th>':'')+'</tr>'+
    '</thead><tbody>'+rows+'</tbody></table></div>';
}
/* Handler input sel: tulis ke referensi AKTIF; kolom struktur (kelompok/uraian/sat/vol)
   disalin ke semua referensi agar konsisten antar sumber. */
function anaOnCell(el,key){
  const i=+el.dataset.i; const st=anaState;
  if(key==='judul'||key==='subjudul'||key==='uraian'||key==='sat'){
    st.refs.forEach(rf=>{ if(rf.items[i]) rf.items[i][key]=el.value; });
  }else{
    const ref=st.refs[st.aktifRef]; if(ref&&ref.items[i]) ref.items[i][key]=el.value;
  }
  anaSaveState();
}
function anaOnVol(el){
  let v=el.value.replace(/[^0-9.,]/g,'');
  el.value=v;
  const val=(v===''?'':String(jsVolNum(v)));
  const i=+el.dataset.i; const st=anaState;
  st.refs.forEach(rf=>{ if(rf.items[i]) rf.items[i].vol=val; });   // vol sama utk semua referensi
  anaSaveState(); anaRenderResult();
}
function anaOnHarga(el,key){
  onRupiahInput(el); const i=+el.dataset.i; const ref=anaState.refs[anaState.aktifRef];
  if(ref&&ref.items[i]){ ref.items[i][key]=parseRupiah(el.value); anaSaveState(); anaRenderResult(); }
}
function anaOnMethodRow(el){
  const i=+el.dataset.i; const v=(el.value==='Terendah')?'Terendah':'Rata-rata';
  anaState.refs.forEach(rf=>{ if(rf.items[i]) rf.items[i].method=v; });
  anaSaveState(); anaRenderResult();
}

/* ---------- Perhitungan hasil (abaikan nilai 0 / kosong) ---------- */
/* Kumpulkan harga (barang/jasa) untuk uraian ke-i dari SEMUA referensi, buang 0/kosong. */
function anaCollect(i, key){
  const vals=[];
  (anaState.refs||[]).forEach(rf=>{ const it=rf.items[i]; if(!it) return; const v=anaNum(it[key]); if(v>0) vals.push(v); });
  return vals;
}
function anaAvg(vals){ if(!vals.length) return 0; return vals.reduce((a,b)=>a+b,0)/vals.length; }
function anaMin(vals){ if(!vals.length) return 0; return Math.min.apply(null,vals); }
/* Metode efektif utk uraian ke-i */
function anaMethodFor(i){
  if(anaState.metodeRef==='Sama') return anaState.metodeAll;
  const m=(anaState.refs[0]&&anaState.refs[0].items[i]&&anaState.refs[0].items[i].method)||'Rata-rata';
  return m==='Terendah'?'Terendah':'Rata-rata';
}
function anaResultFor(i){
  const method=anaMethodFor(i);
  const barangVals=anaCollect(i,'hargaBarang'), jasaVals=anaCollect(i,'hargaJasa');
  const calc=(vals)=> method==='Terendah'?anaMin(vals):anaAvg(vals);
  let hb=calc(barangVals), hj=calc(jasaVals);
  // Terapkan ROK (%) ke Harga Barang & Jasa masing-masing
  const rok=anaNum(anaState.rok);
  if(rok>0){ hb=hb*(1+rok/100); hj=hj*(1+rok/100); }
  const inf=(anaState.inflasi==='Ya')?anaNum(anaState.inflasiNilai):0;
  if(inf>0){ hb=hb*(1+inf/100); hj=hj*(1+inf/100); }
  hb=Math.round(hb); hj=Math.round(hj);
  return {method, hargaBarang:hb, hargaJasa:hj, total:hb+hj, inflasi:inf};
}

/* Versi umum dari anaResultFor() yang bekerja pada state Analisa APAPUN (mis. state
   dari record tersimpan yang sedang diambil oleh modul HPS), bukan hanya anaState aktif. */
function anaResultForState(state, i){
  state=state||{};
  const metodeRef=state.metodeRef==='Berbeda'?'Berbeda':'Sama';
  const metodeAll=state.metodeAll==='Terendah'?'Terendah':'Rata-rata';
  const refs=Array.isArray(state.refs)?state.refs:[];
  const method = metodeRef==='Sama' ? metodeAll : (((refs[0]&&refs[0].items&&refs[0].items[i]&&refs[0].items[i].method)==='Terendah')?'Terendah':'Rata-rata');
  const collect=(key)=>{ const vals=[]; refs.forEach(rf=>{ const it=rf&&rf.items&&rf.items[i]; if(!it) return; const v=anaNum(it[key]); if(v>0) vals.push(v); }); return vals; };
  const calc=(vals)=> method==='Terendah'?anaMin(vals):anaAvg(vals);
  let hb=calc(collect('hargaBarang')), hj=calc(collect('hargaJasa'));
  const rok=anaNum(state.rok);
  if(rok>0){ hb=hb*(1+rok/100); hj=hj*(1+rok/100); }
  const inf=(state.inflasi==='Ya')?anaNum(state.inflasiNilai):0;
  if(inf>0){ hb=hb*(1+inf/100); hj=hj*(1+inf/100); }
  hb=Math.round(hb); hj=Math.round(hj);
  return {method, hargaBarang:hb, hargaJasa:hj, total:hb+hj, inflasi:inf};
}

/* Kartu hasil analisa (per uraian: harga barang & jasa hasil metode + total). */
function anaResultCardHtml(){
  return '<div class="ana-res-card" id="ana-res-card">'+
    '<div class="ana-res-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.8L7 14.3"/></svg>Hasil Analisa Harga Satuan</div>'+
    '<div id="ana-res-body"></div></div>';
}
function anaRenderResult(){
  const body=document.getElementById('ana-res-body'); if(!body) return;
  const st=anaState;
  const struct=(st.refs[0]&&st.refs[0].items)||[];
  const infOn=(st.inflasi==='Ya');
  const rokOn=(st.rokOn==='Ya');
  let rows='';
  struct.forEach((it,i)=>{
    const res=anaResultFor(i);
    const uraian=(it.uraian||'').trim()||('Uraian ke-'+(i+1));
    const sat=(it.sat||'').trim();
    const rokCell=rokOn?('<td class="c-rok">'+anaPct(anaNum(st.rok),'–')+'</td>'):'';
    const infCell=infOn?('<td class="c-inf">'+anaPct(anaNum(st.inflasiNilai),'–')+'</td>'):'';
    rows+='<tr>'+
      '<td class="c-no">'+(i+1)+'</td>'+
      '<td class="c-ur">'+fkEsc(uraian)+'</td>'+
      '<td class="c-sat">'+(sat?fkEsc(sat):'–')+'</td>'+
      '<td class="c-vol">'+jsVolDoc(it&&it.vol)+'</td>'+
      '<td class="c-mtd"><span class="ana-method-chip">'+res.method+'</span></td>'+
      rokCell+
      infCell+
      '<td class="c-money" id="ana-hb-'+i+'">'+anaRp(res.hargaBarang)+'</td>'+
      '<td class="c-money" id="ana-hj-'+i+'">'+anaRp(res.hargaJasa)+'</td>'+
    '</tr>';
  });
  const modeTxt = st.metodeRef==='Sama'
    ? ('Metode <b>'+st.metodeAll+'</b> diterapkan ke semua uraian.')
    : 'Metode ditentukan <b>per uraian</b> pada kolom Metode Perhitungan.';
  const rok=anaNum(st.rok);
  const suffixInner = (rok>0?('+ ROK '+rok+'%'):'') + (infOn?((rok>0?' ':'')+'+ Inflasi'):'');
  const priceSuffix = suffixInner ? (' <span style="color:#0b6a73;font-weight:800">('+suffixInner+')</span>') : '';
  const jenisTxt = st.jenis==='Konstruksi' ? 'Pekerjaan Konstruksi (ROK 1–15%)' : 'Pekerjaan Umum (ROK 1–10%)';
  const rokHint = rok>0
    ? (' ROK <b>'+rok+'%</b> ditambahkan ke Harga Barang &amp; Jasa masing-masing ('+jenisTxt+').')
    : (' ROK belum diisi — '+jenisTxt+'.');
  const infHint = infOn ? ' Inflasi (%) per uraian ikut ditambahkan ke Harga Barang &amp; Jasa.' : '';
  const infHead = infOn ? '<th class="c-inf">Inflasi (%)</th>' : '';
  const rokHead = rokOn ? '<th class="c-rok">ROK</th>' : '';
  const cols = 7 + (rokOn?1:0) + (infOn?1:0);
  body.innerHTML='<div class="ana-res-wrap"><table class="ana-res"><thead><tr>'+
      '<th class="c-no">No</th><th class="c-ur">Uraian Pekerjaan</th><th class="c-sat">Sat</th><th class="c-vol">Vol</th><th class="c-mtd">Metode Perhitungan</th>'+rokHead+infHead+
      '<th class="c-money">Harga Satuan Barang</th><th class="c-money">Harga Satuan Jasa</th>'+
    '</tr></thead><tbody>'+(rows||'<tr><td colspan="'+cols+'" style="text-align:center;color:#9aa7ab">Belum ada data</td></tr>')+'</tbody></table></div>';
}

/* ---------- Render form ---------- */
function anaRenderStep2Body(){
  const holder=document.getElementById('ana-step2-body'); if(!holder) return;
  holder.innerHTML=anaToolbarHtml()+anaUraianTableHtml();
  anaRenderResult();
}

/* ================= TEMPLATE EXCEL (Download / Upload) — LANGKAH 2 =================
   SATU file mencakup SEMUA referensi sekaligus. Kolom, berurutan:
   No | Kelompok | Uraian Pekerjaan | Sat | Vol |
   [Harga Sat. Barang (Rp) (Ref 1) | Harga Sat. Jasa (Rp) (Ref 1)] | … sebanyak Jumlah Referensi.
   Nama referensi pada judul kolom mengikuti "Sumber Referensi"; bila belum diisi
   ditandai "(Referensi N (Sesuaikan Dengan Nama))". Gaya file sama seperti Template
   Input Pekerjaan di Monitoring (header teal, border tipis, zebra, sheet Petunjuk).
   Kolom Kelompok/Uraian/Sat/Vol berlaku sama untuk semua referensi. */
function anaTplRefName(st,r){
  const s=(st.sumber&&st.sumber[r]!=null)?String(st.sumber[r]).trim():'';
  return s ? s : ('Referensi '+(r+1)+' (Sesuaikan Dengan Nama)');
}
/* Lebar kolom Sat & Vol dihitung dari isi datanya sendiri (bukan angka tetap),
   sehingga selalu muat tanpa terpotong maupun melebar berlebihan. */
function anaTplLebarSatVol(st){
  const items=(st.refs&&st.refs[0]&&Array.isArray(st.refs[0].items))?st.refs[0].items:[];
  let satLen=3;   // panjang judul kolom "Sat"
  let volLen=3;   // panjang judul kolom "Vol"
  items.forEach(function(it){
    const sat=String((it&&it.sat)||'').trim();
    if(sat.length>satLen) satLen=sat.length;
    const v=jsVolNum(it&&it.vol);
    if(v>0){
      // panjang teks sebagaimana ditampilkan format akuntansi 2 desimal, mis. "13.979,00"
      const teks=v.toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2});
      if(teks.length>volLen) volLen=teks.length;
    }
  });
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  return {
    sat: clamp(satLen+3,  8, 24),   // +3 = jarak sel kiri/kanan
    vol: clamp(volLen+3, 12, 26)
  };
}
/* Susun deskriptor kolom template mengikuti jumlah referensi. */
function anaTplBuildCols(st){
  const wSV=anaTplLebarSatVol(st);
  const cols=[
    {label:'No',               w:6,  kind:'no'}
  ];
  if(jsOn(st.judulOn))    cols.push({label:'Judul',     w:22, kind:'judul'});
  if(jsOn(st.subjudulOn)) cols.push({label:'Sub-Judul', w:22, kind:'subjudul'});
  cols.push(...[
    {label:'Uraian Pekerjaan', w:44, kind:'uraian'},
    {label:'Sat',              w:wSV.sat, kind:'sat'},
    {label:'Vol',              w:wSV.vol, kind:'vol'}
  ]);
  for(let r=0;r<st.jumlahRef;r++){
    const nm=anaTplRefName(st,r);
    cols.push({label:'Harga Barang ('+nm+')', w:22, kind:'barang', ref:r});
    cols.push({label:'Harga Jasa ('+nm+')',   w:22, kind:'jasa',   ref:r});
  }
  return cols;
}

function anaTemplateBarHtml(){
  return '<div class="hl-tpl-bar" style="margin-top:4px">'+
    '<div class="hl-tpl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>'+
    '<div class="hl-tpl-txt"><b>Template Pengisian Analisa</b><span>Unduh SATU file harga untuk <b>semua referensi sekaligus</b>, isi harganya, lalu unggah kembali.</span></div>'+
    '<div class="hl-tpl-actions">'+
      '<button type="button" class="btn btn-amber" onclick="anaDownloadTemplate()">'+
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'+
        'Download Template</button>'+
      '<button type="button" class="btn btn-teal" onclick="document.getElementById(\'ana-xlsx-upload\').click()">'+
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'+
        'Upload Template</button>'+
    '</div>'+
    '<input type="file" id="ana-xlsx-upload" accept=".xlsx,.xls" style="display:none" onchange="anaHandleUpload(event)">'+
  '</div>';
}

async function anaDownloadTemplate(){
  if(!requireInput()) return;
  if(!window.ExcelJS){ toast('Library Excel belum termuat, coba lagi','warn'); return; }
  anaEnsure();
  const st=anaState; const namaPek=String((st.info&&st.info.nama)||'').trim();
  const cols=anaTplBuildCols(st); const n=st.jumlahItem; const NC=cols.length;

  const wb=new ExcelJS.Workbook();
  const wsD=wb.addWorksheet('Data');
  wsD.addRow(cols.map(c=>c.label));
  wsD.columns=cols.map(c=>({width:c.w||16}));

  const thin={style:'thin',color:{argb:'FFBFCAD0'}};
  const allBorder={top:thin,left:thin,bottom:thin,right:thin};

  // Judul tabel (baris 1) — teal, teks putih tebal, dibungkus (wrap)
  const headRow=wsD.getRow(1); headRow.height=60;
  for(let c=1;c<=NC;c++){
    const cell=wsD.getCell(1,c);
    cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0E7C86'}};
    cell.font={bold:true,color:{argb:'FFFFFFFF'},size:10.5};
    cell.alignment={wrapText:true,vertical:'middle',horizontal:'center'};
    cell.border=allBorder;
  }
  // Isi data yang sudah ada (struktur dari referensi-0; harga per referensi)
  const ref0=st.refs[0]||anaBlankRef();
  for(let i=0;i<n;i++){
    const base=ref0.items[i]||{};
    const row=wsD.getRow(i+2);
    cols.forEach((c,ci)=>{
      const cell=row.getCell(ci+1);
      if(c.kind==='no') cell.value=i+1;
      else if(c.kind==='judul')    cell.value=base.judul||'';
      else if(c.kind==='subjudul') cell.value=base.subjudul||'';
      else if(c.kind==='uraian')   cell.value=base.uraian||'';
      else if(c.kind==='sat')      cell.value=base.sat||'';
      else if(c.kind==='vol')      cell.value=(base.vol!==''&&base.vol!=null)?jsVolNum(base.vol):'';
      else if(c.kind==='barang'){ const it=(st.refs[c.ref]&&st.refs[c.ref].items[i])||{}; const v=anaNum(it.hargaBarang); cell.value=v>0?v:''; }
      else if(c.kind==='jasa'){   const it=(st.refs[c.ref]&&st.refs[c.ref].items[i])||{}; const v=anaNum(it.hargaJasa);   cell.value=v>0?v:''; }
    });
  }
  // Border + zebra + format kolom
  for(let rr=2;rr<=n+1;rr++){
    for(let c=1;c<=NC;c++){
      const cell=wsD.getCell(rr,c);
      cell.border=allBorder;
      const kind=cols[c-1].kind;
      if(kind==='no'||kind==='sat') cell.alignment={vertical:'middle',horizontal:'center'};
      // Vol: format akuntansi 2 desimal (mis. "999.999,00"), rata tengah.
      else if(kind==='vol'){ cell.numFmt=ACCT_VOL; cell.alignment={vertical:'middle',horizontal:'center'}; }
      else if(kind==='barang'||kind==='jasa'){ cell.numFmt=ACCT_NODEC; cell.alignment={vertical:'middle',horizontal:'right'}; }
      else cell.alignment={vertical:'middle'};
      if(rr%2===1) cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF2F7F8'}};
    }
  }
  // Bekukan header + 5 kolom pertama agar Kelompok/Uraian tetap terlihat saat menggeser ke kanan
  wsD.views=[{state:'frozen', xSplit:Math.min(6,4+(jsOn(st.judulOn)?1:0)+(jsOn(st.subjudulOn)?1:0)), ySplit:1}];

  // Sheet Petunjuk
  const wsG=wb.addWorksheet('Petunjuk');
  wsG.columns=[{width:30},{width:90}];
  const petunjuk=[['PETUNJUK PENGISIAN',''],['',''],
   ['Pekerjaan', namaPek||'—'],
   ['Jumlah Referensi', String(st.jumlahRef)+'  (tiap referensi punya sepasang kolom Harga Barang & Jasa)'],
   ['',''],
   ['No','Nomor urut uraian. Jangan diubah — dipakai untuk mencocokkan baris.'],
   ['Judul','Judul kelompok pekerjaan. SELALU dicetak huruf besar semua pada dokumen. Kosongkan bila melanjutkan judul di atasnya.'],
   ['Sub-Judul','Sub-judul di bawah judul. Dicetak sesuai huruf besar/kecil yang diketik. Kosongkan bila melanjutkan sub-judul di atasnya.'],
   ['Uraian Pekerjaan','Nama barang/jasa/pekerjaan. Berlaku sama untuk semua referensi.'],
   ['Sat','Satuan (mis. Buah, Pack, m, unit). Berlaku sama untuk semua referensi.'],
   ['Vol','Volume. Ketik angka saja (mis. 10 atau 2.5). Ditampilkan format akuntansi 2 desimal, rata tengah. Berlaku sama untuk semua referensi.'],
   ['',''],
   ['Kolom Harga per Referensi','Isi Harga Barang & Jasa pada kolom referensi masing-masing. Ketik angka saja (mis. 150000).']
  ];
  for(let r=0;r<st.jumlahRef;r++) petunjuk.push(['  • Referensi '+(r+1), anaTplRefName(st,r)]);
  petunjuk.push(['','']);
  petunjuk.push(['Catatan','Isi data mulai baris ke-2. Nilai 0/kosong diabaikan saat perhitungan.']);
  petunjuk.push(['','Ganti nama pada judul kolom (dalam kurung) bila ingin, tanpa mengubah kata "Harga Barang/Jasa".']);
  petunjuk.push(['','Jangan menghapus kolom No. Satu file ini mencakup semua referensi sekaligus.']);
  petunjuk.forEach(row=>wsG.addRow(row));
  wsG.getCell('A1').font={bold:true,size:14,color:{argb:'FF0E7C86'}};
  const lastG=petunjuk.length;
  for(let rr=3;rr<=lastG;rr++){ const a=wsG.getCell('A'+rr); if(String(a.value||'').trim()!==''){ a.font={bold:true,color:{argb:'FF095E66'}}; } a.alignment={vertical:'top'}; wsG.getCell('B'+rr).alignment={vertical:'top',wrapText:true}; }

  try{
    const buf=await wb.xlsx.writeBuffer();
    const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob);
    const clean=s=>String(s||'').replace(/[\\/:*?"<>|]+/g,'_').replace(/\s+/g,'_').slice(0,40);
    const a=document.createElement('a');
    a.href=url; a.download='Template_Analisa_Harga_Satuan_'+(clean(namaPek)||'Pekerjaan')+'.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast('Template diunduh — '+st.jumlahRef+' referensi dalam satu file','ok');
  }catch(err){ console.error(err); toast('Gagal membuat template: '+errMsg(err),'warn'); }
}

function anaHandleUpload(ev){
  if(!requireInput()){ ev.target.value=''; return; }
  if(!window.XLSX){ toast('Library Excel belum termuat, coba lagi','warn'); ev.target.value=''; return; }
  const file=ev.target.files[0]; if(!file){ return; }
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      anaEnsure();
      const st=anaState;
      const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});
      const sheetName=wb.SheetNames.includes('Data')?'Data':wb.SheetNames[0];
      const ws=wb.Sheets[sheetName];
      const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      if(rows.length<2){ toast('File kosong / tidak ada data','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      const head=rows[0].map(h=>String(h==null?'':h).trim().toLowerCase());

      // --- Klasifikasi kolom ---
      let cNo=-1,cJud=-1,cSub=-1,cUr=-1,cSat=-1,cVol=-1;
      const hargaCols=[];               // {ci, kind:'barang'|'jasa', ref}
      let barangSeq=0, jasaSeq=0;
      // Petakan sebuah judul kolom harga ke indeks referensi.
      const refFromHeader=(h,kind)=>{
        // Ambil "token" = bagian setelah "Harga Sat. Barang/Jasa (Rp)" (biasanya nama referensi dalam kurung)
        let token=h.replace(/^(jumlah\s*)?harga\s*(sat\.?)?\s*(barang|jasa)\s*(\(rp\))?/,'').trim();
        token=token.replace(/^\(+|\)+$/g,'').trim();
        if(token===''){ return st.aktifRef; }                 // template lama (satu pasang) → referensi aktif
        const m=token.match(/referensi\s*(\d+)/);
        if(m) return Math.max(0, parseInt(m[1],10)-1);         // "(Referensi N …)"
        for(let r=0;r<st.jumlahRef;r++){                        // cocokkan nama Sumber Referensi
          const nm=(st.sumber&&st.sumber[r]!=null)?String(st.sumber[r]).trim().toLowerCase():'';
          if(nm && token.indexOf(nm)>=0) return r;
        }
        return (kind==='barang'?barangSeq++:jasaSeq++);         // cadangan: urutan kemunculan
      };
      head.forEach((h,ci)=>{
        if(h==='') return;
        if(h.indexOf('harga')>=0 && h.indexOf('barang')>=0){ hargaCols.push({ci, kind:'barang', ref:refFromHeader(h,'barang')}); return; }
        if(h.indexOf('harga')>=0 && h.indexOf('jasa')>=0){   hargaCols.push({ci, kind:'jasa',   ref:refFromHeader(h,'jasa')});   return; }
        if(cNo<0  && h==='no'){ cNo=ci; return; }
        if(cSub<0 && (h.indexOf('sub-judul')>=0||h.indexOf('sub judul')>=0||h.indexOf('subjudul')>=0)){ cSub=ci; return; }
        if(cJud<0 && h.indexOf('judul')>=0){ cJud=ci; return; }
        if(cJud<0 && h.indexOf('kelompok')>=0){ cJud=ci; return; }   // kompatibilitas template lama
        if(cUr<0  && h.indexOf('uraian')>=0){ cUr=ci; return; }
        if(cVol<0 && (h==='vol'||h.indexOf('volume')>=0)){ cVol=ci; return; }
        if(cSat<0 && (h==='sat'||h==='sat.'||h.indexOf('satuan')>=0)){ cSat=ci; return; }
      });
      if(cJud<0&&cSub<0&&cUr<0&&hargaCols.length===0){ toast('Header tidak dikenali. Gunakan template resmi.','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }

      // Tambah jumlah referensi bila file memuat lebih banyak (maks 20)
      let maxRef=st.jumlahRef-1; hargaCols.forEach(hc=>{ if(hc.ref>maxRef) maxRef=hc.ref; });
      const needRef=Math.min(ANA_MAX_REF, Math.max(st.jumlahRef, maxRef+1));
      if(needRef!==st.jumlahRef){ st.jumlahRef=needRef; anaEnsure(); }

      // --- Kumpulkan baris data ---
      const dataCols=[cJud,cSub,cUr,cSat,cVol].concat(hargaCols.map(h=>h.ci)).filter(x=>x>=0);
      const dataRows=[];
      for(let rIdx=1;rIdx<rows.length;rIdx++){
        const row=rows[rIdx]; if(!row) continue;
        const empty=dataCols.every(ci=> String(row[ci]==null?'':row[ci]).trim()==='');
        if(empty) continue;
        let idx;
        if(cNo>=0){ const num=parseInt(String(row[cNo]==null?'':row[cNo]).replace(/[^\d]/g,''),10); idx=(num>=1)?(num-1):dataRows.length; }
        else idx=dataRows.length;
        dataRows.push({idx,row});
      }
      if(!dataRows.length){ toast('Tidak ada baris data untuk diimpor','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }

      // Tambah jumlah uraian bila baris melebihi grid (maks 150)
      let maxIdx=0; dataRows.forEach(d=>{ if(d.idx>maxIdx) maxIdx=d.idx; });
      const needItem=Math.min(ANA_MAX_ITEM, Math.max(st.jumlahItem, maxIdx+1));
      if(needItem!==st.jumlahItem){ st.jumlahItem=needItem; anaEnsure(); }

      const refsTouched={};
      let filled=0, skipped=0;
      dataRows.forEach(d=>{
        if(d.idx<0||d.idx>=st.jumlahItem){ skipped++; return; }
        // Struktur (judul/sub-judul/uraian/sat/vol) → semua referensi
        st.refs.forEach(rf=>{
          const it=rf.items[d.idx]; if(!it) return;
          if(cJud>=0) it.judul   =String(d.row[cJud]==null?'':d.row[cJud]).trim();
          if(cSub>=0) it.subjudul=String(d.row[cSub]==null?'':d.row[cSub]).trim();
          if(cUr >=0) it.uraian =String(d.row[cUr]==null?'':d.row[cUr]).trim();
          if(cSat>=0) it.sat    =String(d.row[cSat]==null?'':d.row[cSat]).trim();
          if(cVol>=0){ const raw=d.row[cVol]; const n=jsVolNum(raw); it.vol=(String(raw==null?'':raw).trim()===''?'':String(n)); }
        });
        // Harga → referensi masing-masing
        hargaCols.forEach(hc=>{
          if(hc.ref<0||hc.ref>=st.jumlahRef) return;
          const it=st.refs[hc.ref].items[d.idx]; if(!it) return;
          const raw=d.row[hc.ci]; const s=String(raw==null?'':raw).trim();
          const val=(s===''?'':parseRupiah(raw));
          if(hc.kind==='barang') it.hargaBarang=val; else it.hargaJasa=val;
          refsTouched[hc.ref]=true;
        });
        filled++;
      });
      anaSaveState();
      if(anaStep===2 && st.jenis!=='Konstruksi') renderAnalisaForm(); else anaRenderStep2Body();
      const nRefTouched=Object.keys(refsTouched).length;
      let msg=filled+' uraian diperbarui'+(nRefTouched?(' untuk '+nRefTouched+' referensi'):'');
      if(skipped>0) msg+=' — '+skipped+' baris dilewati (di luar jangkauan)';
      toast(msg,'ok');
    }catch(err){ console.error(err); toast('Gagal membaca file Excel','warn', TOAST_MS_UPLOAD); }
    ev.target.value='';
  };
  reader.readAsArrayBuffer(file);
}
function renderAnalisaForm(){
  anaMarkActive();
  anaEnsure();
  const tt=document.getElementById('ana-title'); if(tt) tt.textContent='Analisa Harga Satuan'+(anaEditId?' — Ubah Data':' — Analisa Harga');
  const sub=document.getElementById('ana-sub');
  const cont=document.getElementById('ana-content'); if(!cont) return;
  const st=anaState; const isKon=(st.jenis==='Konstruksi'); const kst=st.konstruksi;
  // Saat MODE UBAH DATA (anaEditId aktif), halaman gabungan (Data Pekerjaan + Analisa
  // Harga Satuan) selalu ditampilkan penuh — walau record lama belum tertaut dpId —
  // sehingga tombol Edit dari "Lihat Analisa" selalu membuka SATU halaman: Data
  // Pekerjaan di atas, seluruh data analisa di-insert di bawahnya. Alur "Analisa
  // Harga" (buat baru) tidak berubah: tetap wajib "Pilih Data Pekerjaan" dahulu.
  const showBody = true;
  // Kelas animasi reveal (hanya aktif sekali sesaat setelah "Pilih Data Pekerjaan"):
  // field Data Pekerjaan lalu kartu-kartu di bawahnya keluar perlahan bertingkat.
  const revOn = (anaRevealPick && showBody);
  const rev1 = revOn ? ' dp-reveal dp-reveal-d1' : '';
  const rev2 = revOn ? ' dp-reveal dp-reveal-d2' : '';
  const rev3 = revOn ? ' dp-reveal dp-reveal-d3' : '';
  let html=anaStepperHtml();
  // Kartu Data Pekerjaan — kini SELALU berada di atas langkah pertama (digabung
  // dengan Analisa Harga Satuan), baik untuk Pekerjaan Umum maupun Konstruksi.
  const dpCardHtml =
    '<div class="form-card"><div class="form-section-title" style="display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:10px">'+
      '<span style="display:flex;align-items:center;gap:8px">'+KR_SECTION_ICON+'Data Pekerjaan</span>'+anaTopControlsHtml()+'</div>'+
    (showBody ? (
      // Semua field Data Pekerjaan berada dalam SATU grid 4 kolom — termasuk
      // Jumlah Referensi, ROK?, Inflasi?, dan (khusus Umum) Judul?/Sub-Judul? —
      // sehingga tiap baris selalu terisi 4 field pada kedua jenis pekerjaan.
      '<div class="form-flow'+rev1+'" style="--cols:4">'+
        ANA_DP_FIELDS.map(anaInfoInputHtml).join('')+
        ANA_OWN_FIELDS.map(anaInfoInputHtml).join('')+
        (!isKon ? anaCountItemFieldHtml() : '')+
        anaCountRefFieldHtml()+
        anaRokInflasiFieldsHtml()+
        (!isKon ? anaJudulFieldsHtml() : '')+
      '</div>'
    ) : '')+
    '</div>';

  if(anaStep===1){
    if(isKon){
      // KONSTRUKSI — Langkah 1 (dari 3): Data Pekerjaan
      if(sub) sub.textContent='Langkah 1 dari 3 — Data Pekerjaan';
      html+=dpCardHtml;
      html+=anaActionsHtml({back:false, next:true});
    } else {
      // UMUM — Langkah 1 (dari 2): Data Pekerjaan + Sumber Referensi
      if(sub) sub.textContent='Langkah 1 dari 2 — Data Pekerjaan & Sumber Referensi';
      html+=dpCardHtml;
      if(showBody){
        html+='<div class="form-card'+rev2+'"><div class="form-section-title">'+ANA_REF_ICON+'Sumber Referensi <span class="fkl-count-chip">'+st.jumlahRef+' referensi</span></div>'+
          '<div class="hps-hint">Isi nama/sumber tiap referensi (mis. Toko A, e-Katalog, Survei Pasar). Jumlah kotak menyesuaikan <b>Jumlah Referensi</b>. Nama ini muncul sebagai pilihan pada bagian Analisa Harga Satuan.</div>'+
          '<div id="ana-sumber-wrap">'+anaSumberGridHtml()+'</div></div>';
      }
      html+=anaActionsHtml({back:false, next:true});
    }
  } else if(anaStep===2){
    if(isKon){
      // KONSTRUKSI — Langkah 2 (dari 3): Harga Satuan
      if(sub) sub.textContent='Langkah 2 dari 3 — Harga Satuan';
      html+='<div class="form-card"><div class="form-section-title">'+ANA_SEC_ICON+'Harga Satuan <span class="fkl-count-chip">'+kst.items.length+' uraian</span>'+
        '<button type="button" class="ana-ahsp-add" style="margin-left:auto" onclick="anaKonAddRow()">+ Tambah Baris</button></div>'+
        '<div id="ana-kon-table-wrap">'+anaKonTableHtml()+'</div></div>';
      html+=anaActionsHtml({back:true, next:true});
    } else {
      // UMUM — Langkah 2 (dari 3): Analisa Harga Satuan (input) — Hasil dipindah ke Langkah 3
      if(sub) sub.textContent='Langkah 2 dari 3 — Analisa Harga Satuan';
      html+='<div class="form-card"><div class="form-section-title">'+ANA_SEC_ICON+'Analisa Harga Satuan '+
        '<span class="fkl-count-chip">'+st.jumlahItem+' uraian • '+st.jumlahRef+' referensi</span></div>'+
        anaTemplateBarHtml()+
        '<div id="ana-step2-body"></div></div>';
      html+=anaActionsHtml({back:true, next:true});
    }
  } else if(anaStep===3){
    if(isKon){
      // KONSTRUKSI — Langkah 3 (dari 3): Analisa Harga Satuan Pekerjaan (AHSP)
      if(sub) sub.textContent='Langkah 3 dari 3 — Analisa Harga Satuan Pekerjaan (Tenaga Kerja, Bahan, Peralatan)';
      html+='<div class="form-card"><div class="form-section-title">'+ANA_SEC_ICON+'Analisa Harga Satuan Pekerjaan</div>'+
        '<div id="ana-ahsp-body"></div></div>';
      html+=anaActionsHtml({back:true, save:true});
    } else {
      // UMUM — Langkah 3 (dari 3): Hasil Analisa Harga Satuan
      if(sub) sub.textContent='Langkah 3 dari 3 — Hasil Analisa Harga Satuan';
      html+=anaResultCardHtml();
      html+=anaActionsHtml({back:true, save:true});
    }
  }
  cont.innerHTML=html;
  anaRevealPick=false;   // animasi reveal hanya dijalankan sekali
  if(anaStep===1){
    ANA_INFO_FIELDS.forEach(f=>{ const el=document.getElementById('ana-'+f.key); if(!el) return; const v=st.info[f.key]; el.value=(f.type==='num')?rupiahInputText(v):(v!=null?v:''); });
  } else if(anaStep===2){
    if(!isKon) anaRenderStep2Body();   // Umum: tabel Analisa Harga Satuan (Konstruksi: Harga Satuan inline)
  } else if(anaStep===3){
    if(isKon) anaRenderAhspBody();   // Konstruksi: AHSP
    else anaRenderResult();          // Umum: Hasil Analisa Harga Satuan
  }
}
function anaActionsHtml(o){
  o=o||{};
  // Batal (merah) berdampingan dengan tombol navigasi di pojok kanan
  let right='<button class="btn btn-red" onclick="anaBatal()">'+FKL_IC_X+'Batal</button>';
  if(o.back) right+='<button class="btn btn-light" onclick="anaBack()">'+FKL_IC_BACK+'Kembali</button>';
  if(o.save) right+='<button class="btn btn-green" onclick="anaSimpan()">'+FKL_IC_SAVE+'Simpan dan Lihat</button>';
  if(o.next) right+='<button class="btn btn-teal" onclick="anaNext()">Selanjutnya'+FKL_IC_NEXT+'</button>';
  return '<div class="fkl-actions"><div class="fkl-actions-right">'+right+'</div></div>';
}

/* ---------- Navigasi ---------- */
function anaNext(){
  const st=anaState;
  if(anaStep===1){
    anaOnInfoChange();
    if(!String(st.info.nama||'').trim()){ toast('Nama Pekerjaan wajib diisi','warn'); return; }
    anaEnsure(); anaStep=2;
  } else if(anaStep < anaMaxStep()){
    anaStep++;
  }
  renderAnalisaForm(); anaScrollTop();
}
function anaBack(){ if(anaStep>1){ anaStep--; renderAnalisaForm(); anaScrollTop(); } }
function anaScrollTop(){ const v=document.getElementById('view-form-analisa'); if(v) v.scrollIntoView({behavior:'smooth',block:'start'}); }
function anaBatal(){
  openConfirm({ icon:'del', title:'Batalkan Proses',
    text:'Batalkan proses ini? Data yang belum disimpan akan hilang.',
    onYes:()=>{ anaEditId=null; anaState=anaBlankState(); anaSaveState(); anaStep=1; openAnalisaView(); toast('Proses dibatalkan','ok'); }
  });
}

/* ---------- Simpan ---------- */
async function anaSimpan(){
  if(!requireInput()) return;
  const st=anaState; const info=st.info||{}; const nama=String(info.nama||'').trim();
  if(!nama){ toast('Nama Pekerjaan wajib diisi','warn'); anaStep=1; renderAnalisaForm(); return; }
  anaEnsure();
  // nilai_total: Umum = jumlah (harga hasil analisa referensi × vol); Konstruksi = jumlah Harga Total Bagian 2 (Harga Satuan)
  let nilaiTotal=0, jumlahItemRec=st.jumlahItem, jumlahRefRec=st.jumlahRef;
  if(st.jenis==='Konstruksi'){
    (st.konstruksi.items||[]).forEach(it=>{ nilaiTotal+=anaKonItemTotal(it); });
    jumlahItemRec=st.konstruksi.jumlahItem; jumlahRefRec=0;
  } else {
    const struct=(st.refs[0]&&st.refs[0].items)||[];
    struct.forEach((it,i)=>{ const res=anaResultFor(i); nilaiTotal += Math.round(res.total*jsVolNum(it.vol)); });
  }
  const rec={
    nama_pekerjaan: nama,
    lokasi: info.lokasi||'',
    metode: info.metode||'',
    jumlah_item: jumlahItemRec,
    jumlah_referensi: jumlahRefRec,
    nilai_total: nilaiTotal,
    tgl_analisa: info.tgl_analisa||'',
    tgl_input: (new Date()).toISOString().slice(0,10),
    state: JSON.parse(JSON.stringify(st))
  };
  let saved=null;
  try{
    await withActionLoader(anaEditId?'Menyimpan perubahan':'Menyimpan', async()=>{
      if(anaEditId){ await StoreAna.update(anaEditId, rec); }
      else { saved=await StoreAna.create(rec); }
      await refreshDataAnalisa();
    });
  }catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'err'); return; }
  toast(anaEditId?'Data berhasil diperbarui':'Data berhasil disimpan','ok');
  const savedId = anaEditId || (saved && saved.id);
  const savedSection = (st.jenis==='Konstruksi' && anaStep===3) ? 'ahsp' : 'harga';
  anaEditId=null; anaState=anaBlankState(); anaSaveState(); anaStep=1;
  showView('analisa-view');
  setTimeout(()=>{ if(savedId!=null) anaPreviewRecord(savedId, savedSection); }, 420);
}

/* ================= LIHAT ANALISA ================= */
let anaViewPage=1;
const ANA_VIEW_PAGE_SIZE=8;
function anaDateLong(s){ return pnwDateLong(s); }
function anaViewRows(){
  let rows=(records_ana||[]).slice();
  const fs=(document.getElementById('ana-view-search')?.value||'').toLowerCase().trim();
  if(fs) rows=rows.filter(r=>String(r.nama_pekerjaan||(r.state&&r.state.info&&r.state.info.nama)||'').toLowerCase().includes(fs));
  return rows;
}
function anaEmptyRow(){
  return '<tr><td colspan="7"><div class="empty">'+
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/></svg>'+
    '<div>Data tidak tersedia</div></div></td></tr>';
}
function renderAnalisaView(){
  const tb=document.getElementById('ana-view-body');
  const pg=document.getElementById('ana-view-pagination');
  const cEl=document.getElementById('ana-view-count');
  if(!tb) return;
  const rows=anaViewRows();
  if(cEl) cEl.textContent=rows.length;
  if(!rows.length){ tb.innerHTML=anaEmptyRow(); if(pg) pg.innerHTML=''; return; }
  const totalPages=Math.max(1,Math.ceil(rows.length/ANA_VIEW_PAGE_SIZE));
  if(anaViewPage>totalPages) anaViewPage=totalPages;
  if(anaViewPage<1) anaViewPage=1;
  const start=(anaViewPage-1)*ANA_VIEW_PAGE_SIZE;
  const pageRows=rows.slice(start,start+ANA_VIEW_PAGE_SIZE);
  tb.innerHTML=pageRows.map((r,i)=>{
    const stt=r.state||{}; const info=stt.info||{};
    const nama=r.nama_pekerjaan||info.nama||'—';
    const lokasi=(r.lokasi||info.lokasi||'').trim();
    const metode=r.metode||info.metode||'';
    const ji=(r.jumlah_item!=null)?r.jumlah_item:(stt.jumlahItem||0);
    const jr=(r.jumlah_referensi!=null)?r.jumlah_referensi:(stt.jumlahRef||0);
    const rid=fkEsc(String(r.id));
    return '<tr>'+
      '<td class="col-no">'+(start+i+1)+'</td>'+
      '<td class="wrap-cell col-nama-freeze">'+fkEsc(nama)+'</td>'+
      '<td class="fkl-col-lokasi">'+fkEsc(lokasi||'—')+'</td>'+
      '<td>'+fkEsc(metode||'—')+'</td>'+
      '<td style="text-align:center">'+ji+'</td>'+
      '<td style="text-align:center">'+jr+'</td>'+
      '<td><div class="action-cell" style="justify-content:center">'+
        '<button class="act act-edit" title="Ubah" onclick="openAnalisaInput(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>'+
        '<button class="act act-view" title="Lihat" onclick="anaPreviewRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>'+
        '<button class="act act-del" title="Hapus" onclick="anaDeleteRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>'+
      '</div></td>'+
    '</tr>';
  }).join('');
  if(pg){
    if(totalPages<=1){ pg.innerHTML=''; }
    else{
      let h='<button class="pg-btn" '+(anaViewPage<=1?'disabled':'')+' onclick="anaViewGoto('+(anaViewPage-1)+')">‹</button>';
      for(let p=1;p<=totalPages;p++) h+='<button class="pg-btn '+(p===anaViewPage?'active':'')+'" onclick="anaViewGoto('+p+')">'+p+'</button>';
      h+='<button class="pg-btn" '+(anaViewPage>=totalPages?'disabled':'')+' onclick="anaViewGoto('+(anaViewPage+1)+')">›</button>';
      pg.innerHTML=h;
    }
  }
}
function anaViewGoto(p){ anaViewPage=p; renderAnalisaView(); }
function anaDeleteRecord(id){
  if(!requireInput()) return;
  const rec=(records_ana||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  openConfirm({ icon:'del', title:'Hapus Data',
    text:'Hapus data Analisa "'+(rec.nama_pekerjaan||(rec.state&&rec.state.info&&rec.state.info.nama)||'')+'"?',
    onYes:async()=>{
      try{ await withActionLoader('Menghapus', async()=>{ await StoreAna.remove(id); await refreshDataAnalisa(); }); }
      catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'err'); return; }
      toast('Data dihapus','ok'); renderAnalisaView();
    }
  });
}

/* ================= DOKUMEN PDF (PREVIEW / CETAK) ================= */
function anaPreviewRecord(id,section){
  const rec=(records_ana||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  anaPreviewState=anaRecordToState(rec);
  anaOpenPreview(section);
}
/* Bangun HTML dokumen Analisa Harga Satuan (memakai state aktif/preview). */
function anaBuildDocHtml(section){
  const st=anaActiveState();
  if(st.jenis==='Konstruksi') return (section==='ahsp') ? anaBuildDocAhsp(st) : anaBuildDocHargaSatuan(st);
  return anaBuildDocHtmlUmum(st);
}
/* ---------- Dokumen "Harga Satuan" (Bagian 2) — terpisah dari AHSP ---------- */
function anaBuildDocHargaSatuan(st){
  const info=st.info||{}; const kst=st.konstruksi||{items:[]};
  const fmtNilai=(info.nilai!==''&&info.nilai!=null)?('Rp '+Number(info.nilai).toLocaleString('id-ID')):'-';
  const infoRow=(k,v)=>'<tr><td class="k">'+k+'</td><td class="s">:</td><td class="v" style="text-align:justify">'+fkEsc(v||'-')+'</td></tr>';
  const items=kst.items||[];
  let hsRows='';
  jsWalk(items,{judulOn:false,subOn:false},{
    item:(noInGroup,it,i)=>{
    const uraian=(it.uraian&&String(it.uraian).trim())?it.uraian:('Uraian '+(i+1));
    const sat=(it.sat!=null&&String(it.sat).trim())?it.sat:'-';
    hsRows+='<tr><td class="no">'+noInGroup+'</td><td class="ur">'+fkEsc(uraian)+'</td><td class="st">'+fkEsc(String(sat))+'</td>'+
      '<td class="num">'+anaRpDoc(it.hargaBarang)+'</td><td class="num">'+anaRpDoc(it.hargaJasa)+'</td>'+
      '<td class="ur">'+fkEsc(it.sumberRef||'-')+'</td></tr>';
  }});
  if(!hsRows) hsRows='<tr><td colspan="6" style="text-align:center;color:#889">Belum ada data</td></tr>';
  const hsTbl='<table class="ana-doc-tbl"><thead><tr><th class="no">No</th><th class="ur">Uraian Pekerjaan</th><th>Satuan</th>'+
    '<th>Harga Barang (Rp)</th><th>Harga Jasa (Rp)</th><th class="ur">Sumber Referensi</th></tr></thead><tbody>'+hsRows+'</tbody></table>';

  return ''+
  '<div class="fkl-doc pnw-doc ana-doc">'+
    '<div class="fkl-doc-head">'+
      '<div class="fkl-doc-logo"><img src="'+FKL_LOGO_SRC+'" alt="Logo PLN"></div>'+
      '<div class="fkl-doc-org">'+
        '<div class="l1">PT PLN (PERSERO)</div>'+
        '<div class="l2">UNIT PELAKSANA PELAYANAN PELANGGAN MASOHI</div>'+
        '<div class="l3">Jl. Abdullah Soulissa No 1, Masohi, Kec. Kota Masohi</div>'+
      '</div>'+
    '</div>'+
    '<div class="fkl-doc-band"></div>'+
    '<h1 class="fkl-doc-title">HARGA SATUAN — PEKERJAAN KONSTRUKSI</h1>'+
    '<div class="fkl-doc-titlegap"></div>'+
    '<div class="fkl-sec-h"><span class="rn">A</span>Data Pekerjaan</div>'+
    '<table class="fkl-info"><tbody>'+
      infoRow('Nama Pekerjaan', info.nama)+
      infoRow('Lokasi Pekerjaan', info.lokasi)+
      infoRow('Rencana Anggaran Biaya', fmtNilai)+
      infoRow('No. Anggaran', info.no_anggaran)+
      infoRow('Tgl. Anggaran', info.tgl_anggaran?pnwDateLong(info.tgl_anggaran):'-')+
      infoRow('Metode Pengadaan', info.metode)+
    '</tbody></table>'+
    '<div class="fkl-sec-h"><span class="rn">B</span>Harga Satuan</div>'+
    hsTbl+
  '</div>';
}

/* ---------- Dokumen "Analisa Harga Satuan Pekerjaan" (Bagian 3 / AHSP) — terpisah, dokumen sendiri ----------
   Tiap layer = satu tabel kontinu bergaya SNI/AHSP: No | Uraian | Satuan | Koefisien | Harga Satuan | Jumlah Harga,
   dengan baris kelompok (A/B/C) & subtotal menyatu di dalam tabel yang sama (bukan tabel terpisah per kelompok). */
function anaAhspLayerDocHtml(layer,li){
  let rows='';
  ANA_AHSP_SECTIONS.forEach(([key,letter,title])=>{
    const list=layer[key]||[];
    rows+='<tr class="grp"><td class="no">'+letter+'</td><td class="gname" colspan="4">'+fkEsc(title)+'</td><td></td></tr>';
    list.forEach(r=>{
      rows+='<tr><td class="no"></td><td class="ur">'+fkEsc(r.uraian||'-')+'</td><td class="st">'+fkEsc(r.sat||'-')+'</td>'+
        '<td class="num">'+(anaNum(r.koef)||0)+'</td><td class="num">'+anaRpDoc(r.harga)+'</td><td class="num tot">'+anaRpDoc(anaAhspJumlah(r))+'</td></tr>';
    });
    const subtotal=list.reduce((s,r)=>s+anaAhspJumlah(r),0);
    const rok=anaNum(layer.rok);
    const adj = rok>0 ? Math.round(subtotal*(1+rok/100)) : subtotal;
    const rokTxt = rok>0 ? (' (+ROK '+rok+'%) = Rp '+adj.toLocaleString('id-ID')) : '';
    const subtotalTxt = subtotal>0 ? ('Rp '+subtotal.toLocaleString('id-ID')) : '-';
    rows+='<tr class="grp"><td class="no"></td><td class="gname" colspan="4">JUMLAH HARGA '+fkEsc(title)+'</td><td class="num tot2">'+subtotalTxt+rokTxt+'</td></tr>';
    rows+='<tr class="ana-ahsp-spacer"><td colspan="6"></td></tr>';
  });
  return '<div class="fkl-sec-h" style="margin-top:16px"><span class="rn">'+String.fromCharCode(65+(li%26))+'</span>'+fkEsc(layer.judul||('Analisa '+(li+1)))+'</div>'+
    '<table class="ana-doc-tbl ana-ahsp-doc-tbl"><thead><tr>'+
      '<th>No</th><th class="ur">Uraian</th><th>Satuan</th><th>Koefisien</th><th>Harga Satuan<br>(Rp)</th><th>Jumlah Harga<br>(Rp)</th>'+
    '</tr></thead><tbody>'+rows+'</tbody></table>';
}
function anaBuildDocAhsp(st){
  const info=st.info||{};
  const ahspLayers = Array.isArray(st.ahsp)&&st.ahsp.length ? st.ahsp : anaBlankAhsp();
  const layersHtml = ahspLayers.map((layer,li)=>anaAhspLayerDocHtml(layer,li)).join('');
  return ''+
  '<div class="fkl-doc pnw-doc ana-doc">'+
    '<div class="fkl-doc-head">'+
      '<div class="fkl-doc-logo"><img src="'+FKL_LOGO_SRC+'" alt="Logo PLN"></div>'+
      '<div class="fkl-doc-org">'+
        '<div class="l1">PT PLN (PERSERO)</div>'+
        '<div class="l2">UNIT PELAKSANA PELAYANAN PELANGGAN MASOHI</div>'+
        '<div class="l3">Jl. Abdullah Soulissa No 1, Masohi, Kec. Kota Masohi</div>'+
      '</div>'+
    '</div>'+
    '<div class="fkl-doc-band"></div>'+
    '<h1 class="fkl-doc-title">ANALISA HARGA SATUAN PEKERJAAN</h1>'+
    '<div class="fkl-doc-titlegap"></div>'+
    '<div class="ana-ahsp-doc-info">'+fkEsc(info.nama||'-')+' • '+fkEsc(info.lokasi||'-')+'</div>'+
    layersHtml+
  '</div>';
}
function anaBuildDocHtmlUmum(st){
  const info=st.info||{};
  const fmtNilai=(info.nilai!==''&&info.nilai!=null)?('Rp '+Number(info.nilai).toLocaleString('id-ID')):'-';
  const infoRow=(k,v)=>'<tr><td class="k">'+k+'</td><td class="s">:</td><td class="v" style="text-align:justify">'+fkEsc(v||'-')+'</td></tr>';
  const struct=(st.refs&&st.refs[0]&&st.refs[0].items)||[];
  const nRef=st.jumlahRef||(st.refs?st.refs.length:0);
  const rok=anaNum(st.rok);
  const jenisTxt='Pekerjaan Umum';

  /* ---- Tabel referensi: tampilkan harga tiap referensi (Barang & Jasa) + hasil ---- */
  /* Kolom: No | Uraian | Sat | Vol | [Ref1 B, Ref1 J] ... | Metode | Hasil B | Hasil J | Total */
  // Nama referensi mengikuti "Sumber Referensi" yang diinput pada record ini (st.sumber),
  // bukan global anaState — agar preview/cetak record tersimpan menampilkan nama yang benar.
  const refLabelOf=(r)=>{ const s=(st.sumber&&st.sumber[r]!=null?String(st.sumber[r]):'').trim(); return s?s:('Referensi '+(r+1)); };
  let refHead1='', refHead2='';
  for(let r=0;r<nRef;r++){
    refHead1+='<th colspan="2">'+fkEsc(refLabelOf(r))+'</th>';
    refHead2+='<th>Harga Barang</th><th>Harga Jasa</th>';
  }
  const colCount = 4 /*no,ur,sat,vol*/ + nRef*2 + 4 /*metode,hasilB,hasilJ,total*/;

  const infOn=(st.inflasi==='Ya');
  // Suffix (+ROK/+Inflasi) hanya ditempel pada JUDUL section Hasil Analisa, bukan pada judul kolom tabel.
  const hasilSuffixParts=[]; if(rok>0) hasilSuffixParts.push('+ROK '+rok+'%'); if(infOn) hasilSuffixParts.push('+Inflasi');
  const hasilTitleSuffix = hasilSuffixParts.length ? (' ('+hasilSuffixParts.join(' ')+')') : '';
  const colA = 4 + nRef*2;   // no,ur,sat,vol + ref*2 (kolom Metode dihapus dari tabel Analisa)
  const colH = 4 + 1 + 1 + (infOn?1:0) + 2;   // no,ur,sat,vol + metode + ROK + inflasi? + jumlahHargaBarang,jumlahHargaJasa
  let rowsA='', rowsH='';
  /* Baris judul/sub-judul; bila membawa harga (judul tanpa Uraian tersendiri),
     Sat/Vol/Harga ikut tercetak pada baris itu — di kedua tabel. */
  const grpLead=(no,txt,it)=>'<td class="no">'+fkEsc(no)+'</td><td class="gname ur">'+fkEsc(txt)+'</td>'+
    '<td class="st">'+fkEsc(String((it.sat!=null&&String(it.sat).trim())?it.sat:'-'))+'</td>'+
    '<td class="vl">'+fkEsc(jsVolDoc(it.vol))+'</td>';
  const grpRows=(cls,no,txt,it,i)=>{
    if(!it){
      rowsA+='<tr class="'+cls+'"><td class="no">'+fkEsc(no)+'</td><td class="gname" colspan="'+(colA-1)+'">'+fkEsc(txt)+'</td></tr>';
      rowsH+='<tr class="'+cls+'"><td class="no">'+fkEsc(no)+'</td><td class="gname" colspan="'+(colH-1)+'">'+fkEsc(txt)+'</td></tr>';
      return;
    }
    const lead=grpLead(no,txt,it);
    let refCells='';
    for(let r=0;r<nRef;r++){
      const rit=(st.refs[r]&&st.refs[r].items[i])||{};
      refCells+='<td class="num">'+anaRpDoc(rit.hargaBarang)+'</td><td class="num">'+anaRpDoc(rit.hargaJasa)+'</td>';
    }
    const res=anaResultForState(st,i);
    rowsA+='<tr class="'+cls+' has-val">'+lead+refCells+'</tr>';
    rowsH+='<tr class="'+cls+' has-val">'+lead+'<td class="mtd">'+res.method+'</td><td class="rok">'+anaPct(rok,'-')+'</td>'+
      (infOn?('<td class="num">'+anaPct(res.inflasi,'-')+'</td>'):'')+
      '<td class="num tot">'+anaRpDoc(res.hargaBarang)+'</td><td class="num tot">'+anaRpDoc(res.hargaJasa)+'</td></tr>';
  };
  jsWalk(struct,jsCfg(st),{
    judul:(no,txt,it,i)=>{ grpRows('grp',no,txt,it,i); },
    sub:(no,txt,it,i)=>{ grpRows('grp sub',no,txt,it,i); },
    item:(noInGroup,it,i)=>{
    const uraian=(it.uraian&&String(it.uraian).trim())?it.uraian:('Uraian '+(i+1));
    const sat=(it.sat!=null&&String(it.sat).trim())?it.sat:'-';
    const vol=jsVolDoc(it.vol);
    const res=anaResultForState(st,i);
    let refCells='';
    for(let r=0;r<nRef;r++){
      const rit=(st.refs[r]&&st.refs[r].items[i])||{};
      refCells+='<td class="num">'+anaRpDoc(rit.hargaBarang)+'</td><td class="num">'+anaRpDoc(rit.hargaJasa)+'</td>';
    }
    const lead='<td class="no">'+noInGroup+'</td><td class="ur">'+fkEsc(uraian)+'</td><td class="st">'+fkEsc(String(sat))+'</td><td class="vl">'+fkEsc(String(vol))+'</td>';
    rowsA+='<tr>'+lead+refCells+'</tr>';
    rowsH+='<tr>'+lead+'<td class="mtd">'+res.method+'</td><td class="rok">'+anaPct(rok,'-')+'</td>'+(infOn?('<td class="num">'+anaPct(res.inflasi,'-')+'</td>'):'')+'<td class="num tot">'+anaRpDoc(res.hargaBarang)+'</td><td class="num tot">'+anaRpDoc(res.hargaJasa)+'</td></tr>';
  }});
  if(!rowsA){ rowsA='<tr><td colspan="'+colA+'" style="text-align:center;color:#889">Belum ada data</td></tr>'; rowsH='<tr><td colspan="'+colH+'" style="text-align:center;color:#889">Belum ada data</td></tr>'; }
  const _px=jsAnaColPx(struct, jsCfg(st));
  const _noW=' style="min-width:'+_px.no+'px"', _stW=' style="min-width:'+_px.sat+'px"', _vlW=' style="min-width:'+_px.vol+'px"';
  const tblAnalisa=
    '<table class="ana-doc-tbl"><thead>'+
      '<tr><th class="no" rowspan="2"'+_noW+'>No</th><th class="ur" rowspan="2">Uraian Pekerjaan</th><th class="st" rowspan="2"'+_stW+'>Sat</th><th class="vl" rowspan="2"'+_vlW+'>Vol</th>'+refHead1+'</tr>'+
      '<tr>'+refHead2+'</tr>'+
    '</thead><tbody>'+rowsA+'</tbody></table>';
  const tblHasil=
    '<table class="ana-doc-tbl ana-hasil-tbl"><thead>'+
      '<tr><th class="no"'+_noW+'>No</th><th class="ur">Uraian Pekerjaan</th><th class="st"'+_stW+'>Sat</th><th class="vl"'+_vlW+'>Vol</th><th class="mtd">Metode</th><th class="rok">ROK</th>'+(infOn?'<th class="inf">Inflasi</th>':'')+'<th class="jh">Harga Satuan Barang</th><th class="jh">Harga Satuan Jasa</th></tr>'+
    '</thead><tbody>'+rowsH+'</tbody></table>';

  return ''+
  '<div class="fkl-doc pnw-doc ana-doc">'+
    '<div class="fkl-doc-head">'+
      '<div class="fkl-doc-logo"><img src="'+FKL_LOGO_SRC+'" alt="Logo PLN"></div>'+
      '<div class="fkl-doc-org">'+
        '<div class="l1">PT PLN (PERSERO)</div>'+
        '<div class="l2">UNIT PELAKSANA PELAYANAN PELANGGAN MASOHI</div>'+
        '<div class="l3">Jl. Abdullah Soulissa No 1, Masohi, Kec. Kota Masohi</div>'+
      '</div>'+
    '</div>'+
    '<div class="fkl-doc-band"></div>'+
    '<h1 class="fkl-doc-title">ANALISA HARGA SATUAN</h1>'+
    '<div class="fkl-doc-titlegap"></div>'+
    '<div class="fkl-sec-h"><span class="rn">A</span>Data Pekerjaan</div>'+
    '<table class="fkl-info"><tbody>'+
      infoRow('Nama Pekerjaan', info.nama)+
      infoRow('Lokasi Pekerjaan', info.lokasi)+
      infoRow('Rencana Anggaran Biaya', fmtNilai)+
      infoRow('No. Anggaran', info.no_anggaran)+
      infoRow('Tgl. Anggaran', info.tgl_anggaran?pnwDateLong(info.tgl_anggaran):'-')+
      infoRow('Metode Pengadaan', info.metode)+
    '</tbody></table>'+
    '<div class="fkl-sec-h"><span class="rn">B</span>Analisa Harga Satuan</div>'+
    tblAnalisa+
    '<div class="fkl-sec-h ana-hasil-sec"><span class="rn">C</span>Hasil Analisa Harga Satuan'+hasilTitleSuffix+'</div>'+
    tblHasil+
  '</div>';
}
function anaRpDoc(n){ n=Math.round(anaNum(n)); return n>0 ? n.toLocaleString('id-ID') : '-'; }
/* Format persen dua desimal gaya Indonesia, mis. 10 → "10,00%". Kosong/0 → dash. */
function anaPct(v,dash){ v=anaNum(v); return v>0 ? (v.toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2})+'%') : (dash||'-'); }
function anaExtraDocCss(){
  return ''+
  'table.ana-doc-tbl{width:100%;border-collapse:collapse;table-layout:auto;margin:2px 0 8px}'+
  'table.ana-doc-tbl th,table.ana-doc-tbl td{border:1px solid #dbe6e9;padding:4px 6px;font-size:8.2px;line-height:1.35;vertical-align:middle;word-wrap:break-word;overflow-wrap:break-word}'+
  'table.ana-doc-tbl thead th{white-space:normal;word-break:keep-all}'+
  'table.ana-doc-tbl{border:1px solid #0b6a73}'+
  /* Header tetap rata (tanpa kesan bevel): sekat antar-sel memakai garis TERANG,
     bukan garis gelap. Warna solid (#5aa8ae) dipilih agar pasti ikut tercetak —
     warna semi-transparan sering diabaikan saat cetak/PDF. */
  'table.ana-doc-tbl thead th{border-color:#5aa8ae}'+
  'table.ana-doc-tbl thead tr:first-child th{border-top-color:#0E7C86}'+
  'table.ana-doc-tbl thead th:first-child{border-left-color:#0E7C86}'+
  'table.ana-doc-tbl thead th:last-child{border-right-color:#0E7C86}'+
  'table.ana-doc-tbl thead tr:last-child th{border-bottom:1.5px solid #0b6a73}'+
  'table.ana-doc-tbl thead tr:first-child th[rowspan]{border-bottom:1.5px solid #0b6a73}'+
  'table.ana-hasil-tbl th.mtd,table.ana-hasil-tbl td.mtd,table.ana-hasil-tbl th.rok,table.ana-hasil-tbl td.rok,table.ana-hasil-tbl th.inf,table.ana-hasil-tbl td.inf{white-space:nowrap}'+
  'table.ana-doc-tbl td.rok,table.ana-doc-tbl td.inf{text-align:center;font-weight:700;color:#0b3d42}'+
  /* Kolom Jumlah Harga: cukup memuat nominal miliaran & judul maksimal 2 baris, tidak melebar berlebihan */
  'table.ana-doc-tbl th.jh{width:1%;min-width:82px}'+
  /* min-width diset inline per-dokumen (jsAnaColPx) sesuai isi terpanjang */
  'table.ana-doc-tbl th.no,table.ana-doc-tbl td.no{width:1%;white-space:nowrap;word-break:keep-all;overflow-wrap:normal}'+
  /* min-width diset inline per-dokumen (jsAnaColPx) sesuai data terpanjang */
  'table.ana-doc-tbl th.st,table.ana-doc-tbl td.st{width:1%;white-space:nowrap;overflow-wrap:normal;word-break:keep-all;text-align:center}'+
  'table.ana-doc-tbl th.vl,table.ana-doc-tbl td.vl{width:1%;white-space:nowrap;overflow-wrap:normal;word-break:keep-all;text-align:center}'+
  /* Seksi C (Hasil Analisa) tidak lagi dipaksa ke halaman baru: bila ruang di halaman
     yang sama masih cukup, tabel B & C digabung. Judul C tetap menempel pada tabelnya
     dan diberi jarak atas agar pemisahan visual dari tabel B tetap rapi. */
  '.ana-hasil-sec{break-before:auto;page-break-before:auto;break-after:avoid;page-break-after:avoid}'+
  'table.ana-hasil-tbl{break-inside:auto;page-break-inside:auto}'+
  'table.ana-hasil-tbl tr{break-inside:avoid;page-break-inside:avoid}'+
  'table.ana-hasil-tbl thead{display:table-header-group}'+
  'table.ana-doc-tbl thead th{background:#0E7C86;color:#fff;font-weight:700;text-align:center;letter-spacing:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  'table.ana-doc-tbl tbody tr:nth-child(even):not(.grp):not(.ana-ahsp-spacer) td{background:#f6fafb;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  'table.ana-doc-tbl td.no{text-align:center;font-weight:700}'+
  'table.ana-doc-tbl th.ur,table.ana-doc-tbl td.ur{width:100%}'+
  'table.ana-doc-tbl th.ur{text-align:center}'+
  'table.ana-doc-tbl td.ur{text-align:left;min-width:90px}'+
  'table.ana-doc-tbl td.st,table.ana-doc-tbl td.vl,table.ana-doc-tbl td.mtd{text-align:center}'+
  'table.ana-doc-tbl td.mtd{font-size:7.6px;color:#0b3d42;font-weight:700}'+
  'table.ana-doc-tbl td.num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;min-width:54px}'+
  'table.ana-doc-tbl td.num.tot{font-weight:800;color:#0b3d42}'+
  'table.ana-doc-tbl td.num.tot2{font-weight:800;color:#0d7a3f;background:#e7f6ec;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  'table.ana-doc-tbl tr.grp td{background:#dcecee;font-weight:800;color:#0b3d42;text-transform:uppercase;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  'table.ana-doc-tbl tr.grp td.gname{text-align:left;letter-spacing:.3px}'+
  'table.ana-doc-tbl tr.grp.sub td{background:#eef5f6;text-transform:none;font-weight:700;font-style:italic}'+
  'table.ana-doc-tbl tr.grp.has-val td.num,table.ana-doc-tbl tr.grp.has-val td.mtd{text-transform:none}'+
  'table.ana-doc-tbl tr.grp.has-val td.st,table.ana-doc-tbl tr.grp.has-val td.vl{text-transform:none}'+
  'table.ana-doc-tbl tr.grp{break-inside:avoid;page-break-inside:avoid}'+
  'tr.ana-ahsp-spacer td{border:none;height:6px;padding:0}'+
  '.ana-ahsp-doc-info{font-size:9.5px;color:#33474d;margin:0 0 8px;font-weight:700}'+
  '.ana-doc-note{font-size:8.6px;color:#33474d;background:#fbfdf4;border:1px solid #e2ecd6;border-radius:4px;padding:5px 8px;margin-top:6px;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}';
}
let anaPreviewSection='harga'; // 'harga' | 'ahsp' — dokumen mana yang sedang ditampilkan di modal pratinjau (khusus Konstruksi)
function anaStandaloneDocHtml(section){
  return fklDocShell(anaExtraDocCss(), anaBuildDocHtml(section));
}
function anaSwitchPreviewSection(section){
  anaOpenPreview(section);
}
function anaOpenPreview(section){
  const isKon=(anaActiveState().jenis==='Konstruksi');
  anaPreviewSection = isKon ? (section==='ahsp'?'ahsp':(section==='harga'?'harga':anaPreviewSection)) : 'harga';
  const ov=document.getElementById('pn-preview-overlay'); if(!ov) return;
  const _mdl=ov.querySelector('.pn-preview-modal'); if(_mdl) _mdl.classList.remove('is-max');
  if(typeof pnPreviewResetMaxBtn==='function') pnPreviewResetMaxBtn();
  const titleEl=document.getElementById('pn-preview-title');
  if(titleEl) titleEl.textContent='Pratinjau — '+(isKon ? (anaPreviewSection==='ahsp'?'Analisa Harga Satuan Pekerjaan':'Harga Satuan') : 'Analisa Harga Satuan');
  const body=document.getElementById('pn-preview-body');
  if(body){
    body.classList.add('fkl-preview-body');
    body.classList.toggle('has-tabs', isKon);
    const tabsHtml = isKon ? (
      '<div class="ana-doc-tabs">'+
        '<button type="button" class="ana-doc-tab'+(anaPreviewSection==='harga'?' active':'')+'" onclick="anaSwitchPreviewSection(\'harga\')">Harga Satuan</button>'+
        '<button type="button" class="ana-doc-tab'+(anaPreviewSection==='ahsp'?' active':'')+'" onclick="anaSwitchPreviewSection(\'ahsp\')">Analisa Harga Satuan Pekerjaan</button>'+
      '</div>'
    ) : '';
    body.innerHTML=tabsHtml+'<iframe id="ana-preview-frame" title="Pratinjau Dokumen"></iframe>';
    const ifr=document.getElementById('ana-preview-frame');
    const doc=ifr.contentWindow.document; doc.open(); doc.write(anaStandaloneDocHtml(anaPreviewSection)); doc.close();
  }
  const actions=document.querySelector('#pn-preview-overlay .pn-preview-head-actions');
  { const _c=document.getElementById('hpsc-preview-print'); if(_c) _c.remove(); }
  ['fkl-preview-print','pnw-preview-print','rho-preview-print','hps-preview-print'].forEach(id=>{ const b=document.getElementById(id); if(b) b.remove(); });
  if(actions && !document.getElementById('ana-preview-print')){
    const btn=document.createElement('button');
    btn.id='ana-preview-print'; btn.className='btn btn-teal';
    btn.style.padding='8px 14px'; btn.style.fontSize='11px';
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>Cetak / PDF';
    btn.onclick=anaPrint;
    actions.insertBefore(btn, actions.firstChild);
  }
  ov.classList.add('show');
}
function anaPrint(){
  const old=document.getElementById('ana-print-frame'); if(old) old.remove();
  const ifr=document.createElement('iframe');
  ifr.id='ana-print-frame'; ifr.setAttribute('aria-hidden','true');
  ifr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(ifr);
  const doc=ifr.contentWindow.document; doc.open(); doc.write(anaStandaloneDocHtml(anaPreviewSection)); doc.close();
  const go=()=>fklWaitPaged(ifr, _go);
  const _go=()=>{ withHiddenPageTitle(()=>{ try{ ifr.contentWindow.focus(); ifr.contentWindow.print(); }catch(e){ try{ window.print(); }catch(_){} } }); setTimeout(()=>{ const f=document.getElementById('ana-print-frame'); if(f) f.remove(); },1500); };
  const imgs=doc.images?Array.from(doc.images):[];
  if(imgs.length){ let n=imgs.length; const dec=()=>{ if(--n<=0) setTimeout(go,60); }; imgs.forEach(im=>{ if(im.complete) dec(); else { im.onload=dec; im.onerror=dec; } }); setTimeout(go,1600); }
  else setTimeout(go,120);
}

/* ##################### AKHIR MODUL ANALISA HARGA SATUAN #################### */


/* ####################################################################### */
/* ####################### MODUL REKAP HPS ################################ */
/* Rekap gabungan: pilih satu Data Pekerjaan (berdasarkan Nama Pekerjaan),
   lalu tampilkan Perhitungan HPS & Analisa Harga Satuan yang terkait
   dengannya (dicocokkan lewat info.dpId pada masing-masing dokumen),
   dengan tombol "Lihat Pdf" untuk mencetak rekap gabungannya. */
/* ####################################################################### */

function openRekapHps(){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  Promise.all([refreshDataDp(), refreshDataHps(), refreshDataAnalisa(), refreshDataJadwal(), refreshDataRho()]).then(()=>showView('rekap-hps'));
}
function renderRekapHps(){
  const sel=document.getElementById('rekap-dp-select');
  if(sel){
    const cur=sel.value;
    sel.innerHTML='<option value="">— Pilih Nama Pekerjaan —</option>'+
      (records_dp||[]).map(r=>'<option value="'+fkEsc(String(r.id))+'">'+fkEsc(r.nama_pekerjaan||'—')+'</option>').join('');
    if(cur) sel.value=cur;
  }
  const res=document.getElementById('rekap-result'); if(res) res.innerHTML='';
}
function rekapRowsFor(dpId){
  const hpsList=(records_hps||[]).filter(r=>{ const info=(r.state&&r.state.info)||{}; return String(info.dpId||'')===String(dpId); });
  const anaList=(records_ana||[]).filter(r=>{ const info=(r.state&&r.state.info)||{}; return String(info.dpId||'')===String(dpId); });
  return {hpsList, anaList};
}
let _rekapCurrentDpId=null;
function rekapTampilkan(){
  const sel=document.getElementById('rekap-dp-select'); const id=sel?sel.value:'';
  const res=document.getElementById('rekap-result'); if(!res) return;
  if(!id){ toast('Pilih Nama Pekerjaan terlebih dahulu','warn'); return; }
  const dp=(records_dp||[]).find(r=>String(r.id)===String(id));
  if(!dp){ toast('Data pekerjaan tidak ditemukan','warn'); return; }
  _rekapCurrentDpId=id;
  const {hpsList, anaList}=rekapRowsFor(id);
  const hpsRows = hpsList.length ? hpsList.map((r,i)=>'<tr>'+
      '<td class="col-no">'+(i+1)+'</td>'+
      '<td class="col-date">'+fkEsc(r.tgl_hps?pnwDateLong(r.tgl_hps):'—')+'</td>'+
      '<td style="text-align:center">'+(r.jumlah_item!=null?r.jumlah_item:'—')+'</td>'+
      '<td class="col-num" style="text-align:right;font-weight:700">'+hpsRp(r.nilai_total)+'</td>'+
    '</tr>').join('')
    : '<tr><td colspan="4" class="fk-none" style="justify-content:center;padding:14px 0">Belum ada Perhitungan HPS untuk data pekerjaan ini</td></tr>';
  const anaRows = anaList.length ? anaList.map((r,i)=>'<tr>'+
      '<td class="col-no">'+(i+1)+'</td>'+
      '<td class="col-date">'+fkEsc(r.tgl_analisa?pnwDateLong(r.tgl_analisa):'—')+'</td>'+
      '<td style="text-align:center">'+(r.jumlah_item!=null?r.jumlah_item:'—')+'</td>'+
      '<td class="col-num" style="text-align:right;font-weight:700">'+hpsRp(r.nilai_total)+'</td>'+
    '</tr>').join('')
    : '<tr><td colspan="4" class="fk-none" style="justify-content:center;padding:14px 0">Belum ada Analisa Harga Satuan untuk data pekerjaan ini</td></tr>';
  res.innerHTML = ''+
    '<div class="form-card">'+
      '<div class="form-section-title">'+KR_SECTION_ICON+'Data Pekerjaan</div>'+
      '<div class="form-flow" style="--cols:4">'+
        '<div class="field" style="grid-column:span 2"><label>Nama Pekerjaan</label><div class="rekap-static">'+fkEsc(dp.nama_pekerjaan||'—')+'</div></div>'+
        '<div class="field" style="grid-column:span 2"><label>Lokasi Pekerjaan</label><div class="rekap-static">'+fkEsc(dp.lokasi||'—')+'</div></div>'+
        '<div class="field"><label>Rencana Anggaran Biaya</label><div class="rekap-static">'+hpsRp(dp.nilai)+'</div></div>'+
        '<div class="field"><label>No. Anggaran</label><div class="rekap-static">'+fkEsc(dp.no_anggaran||'—')+'</div></div>'+
        '<div class="field"><label>Tgl. Anggaran</label><div class="rekap-static">'+fkEsc(dp.tgl_anggaran?pnwDateLong(dp.tgl_anggaran):'—')+'</div></div>'+
        '<div class="field"><label>Metode Pengadaan</label><div class="rekap-static">'+fkEsc(dp.metode||'—')+'</div></div>'+
      '</div>'+
    '</div>'+
    '<div class="panel" style="margin-top:16px">'+
      '<div class="form-section-title" style="padding:16px 16px 0">'+KR_SECTION_ICON+'Perhitungan HPS <span class="fkl-count-chip">'+hpsList.length+' data</span></div>'+
      '<div class="table-wrap" style="margin-top:10px"><table>'+
        '<thead><tr><th class="col-no">No</th><th class="col-date">Tgl. HPS</th><th style="text-align:center">Jumlah Item</th><th class="col-num" style="text-align:right">Nilai HPS (Rp)</th></tr></thead>'+
        '<tbody>'+hpsRows+'</tbody>'+
      '</table></div>'+
    '</div>'+
    '<div class="panel" style="margin-top:16px">'+
      '<div class="form-section-title" style="padding:16px 16px 0">'+KR_SECTION_ICON+'Analisa Harga Satuan <span class="fkl-count-chip">'+anaList.length+' data</span></div>'+
      '<div class="table-wrap" style="margin-top:10px"><table>'+
        '<thead><tr><th class="col-no">No</th><th class="col-date">Tgl. Analisa</th><th style="text-align:center">Jumlah Item</th><th class="col-num" style="text-align:right">Nilai (Rp)</th></tr></thead>'+
        '<tbody>'+anaRows+'</tbody>'+
      '</table></div>'+
    '</div>'+
    '<div class="jp-actions"><button class="btn btn-teal" onclick="rekapPrint()">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg> Lihat Pdf'+
    '</button></div>';
}
/* ================= COMPOSITE HPS PDF (Tampilkan HPS) ================= */
/* Susun satu dokumen PDF gabungan berisi cover estetik + dokumen tiap modul,
   dihubungkan berdasarkan Nama Pekerjaan yang dipilih dari Data Pekerjaan. */
const HPSC_YEAR = (function(){ return '2026'; })();
function hpscYear(dp){ const t=dp&&dp.tgl_anggaran?String(dp.tgl_anggaran):''; const y=t.slice(0,4); return (/^\d{4}$/.test(y))?y:HPSC_YEAR; }
function hpscRpFull(n){ const v=Number(n); if(!v||isNaN(v)) return '-'; return 'Rp '+v.toLocaleString('id-ID'); }
/* ikon garis sederhana untuk kartu cover */
const HPSC_IC = {
  work:'<path d="M4 7h16a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1Z"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
  loc:'<path d="M12 21s-7-5.686-7-11a7 7 0 0 1 14 0c0 5.314-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  doc:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  tag:'<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2.8 12V4.8A2 2 0 0 1 4.8 2.8H12a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>',
  chart:'<path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/>',
  bldg:'<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M12 11h.01M15 11h.01M10 21v-4h4v4"/>'
};
function hpscCss(){
  return ''+
  /* Tinggi persis A4 (297mm) agar footer menempel ke tepi bawah tanpa celah kertas putih */
  '.hpsc-page{position:relative;width:210mm;height:297mm;min-height:297mm;background:#fff;margin:0 auto 16px;box-shadow:0 10px 30px rgba(20,50,60,.18);page-break-after:always;break-after:page;overflow:hidden;display:flex;flex-direction:column;font-family:Carlito,Calibri,"Plus Jakarta Sans",Arial,sans-serif;color:#16242c}'+
  '.hpsc-page:last-child{page-break-after:auto}'+
  '.hpsc-head{position:relative;background:linear-gradient(120deg,#0b3d42 0%,#0E7C86 55%,#12a0a0 100%);color:#fff;padding:34px 40px 30px;overflow:hidden}'+
  '.hpsc-head::after{content:"";position:absolute;right:-90px;top:-90px;width:340px;height:340px;border-radius:50%;border:38px solid rgba(255,255,255,.06)}'+
  '.hpsc-head::before{content:"";position:absolute;right:40px;bottom:-40px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.10),transparent 68%)}'+
  '.hpsc-brand{display:flex;align-items:center;justify-content:space-between;gap:16px;position:relative;z-index:2}'+
  '.hpsc-brand-l{display:flex;align-items:center;gap:14px}'+
  /* Logo PLN tampil langsung di atas header (blok kuning kontras dgn teal), tanpa plat putih */
  '.hpsc-logo{width:56px;height:56px;background:none;border:none;border-radius:0;display:flex;align-items:center;justify-content:center;padding:0;box-shadow:none}'+
  '.hpsc-logo img{width:100%;height:100%;object-fit:contain}'+
  '.hpsc-org1{font-size:15px;font-weight:800;letter-spacing:.3px;line-height:1.1}'+
  '.hpsc-org2{font-size:10px;font-weight:700;letter-spacing:3px;opacity:.85;margin-top:2px}'+
  '.hpsc-year{border:1.5px solid rgba(255,255,255,.45);border-radius:30px;padding:8px 18px;font-size:10px;font-weight:800;letter-spacing:2px;color:#fff;white-space:nowrap}'+
  '.hpsc-kicker{margin-top:30px;font-size:11px;font-weight:800;letter-spacing:6px;opacity:.8;position:relative;z-index:2}'+
  '.hpsc-title{margin-top:8px;font-size:38px;font-weight:800;letter-spacing:.5px;line-height:1.05;position:relative;z-index:2}'+
  '.hpsc-title small{display:block;font-size:24px;font-weight:800}'+
  '.hpsc-goldbar{height:8px;background:linear-gradient(90deg,#F6B40E,#ffd35a)}'+
  '.hpsc-body{flex:1;padding:34px 40px 20px;display:flex;flex-direction:column;gap:16px}'+
  '.hpsc-nomor{display:flex;align-items:center;gap:12px;background:#fff8e6;border:1px solid #f0d98a;border-radius:12px;padding:13px 18px}'+
  '.hpsc-nomor .lb{font-size:10px;font-weight:800;letter-spacing:2px;color:#8a6d00}'+
  '.hpsc-nomor .vl{font-size:13px;font-weight:800;color:#5c4a00;letter-spacing:.3px}'+
  '.hpsc-card{display:flex;align-items:flex-start;gap:16px;border:1px solid #e2ebed;border-left:5px solid #0E7C86;border-radius:12px;padding:16px 18px;background:#fbfdfd}'+
  '.hpsc-ic{flex:0 0 auto;width:42px;height:42px;border-radius:11px;background:#e3f2f3;color:#0b6a73;display:flex;align-items:center;justify-content:center}'+
  '.hpsc-ic svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'+
  '.hpsc-ctx .cl{font-size:10px;font-weight:800;letter-spacing:2.5px;color:#5b7075}'+
  '.hpsc-ctx .cv{font-size:16px;font-weight:800;color:#12333a;margin-top:3px;line-height:1.25}'+
  '.hpsc-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}'+
  '.hpsc-mini{position:relative;border:1px solid #e4edee;border-radius:13px;padding:13px 16px 14px 20px;background:linear-gradient(180deg,#ffffff,#f5fafa);box-shadow:0 2px 6px rgba(11,61,66,.04);overflow:hidden}'+
  '.hpsc-mini::before{content:"";position:absolute;left:0;top:11px;bottom:11px;width:3.5px;border-radius:4px;background:linear-gradient(180deg,#0E7C86,#22b0ad)}'+
  '.hpsc-mini .cl{font-size:8.5px;font-weight:800;letter-spacing:1.8px;color:#4f8288;text-transform:uppercase}'+
  '.hpsc-mini .cv{font-size:14.5px;font-weight:800;color:#12333a;margin-top:5px;line-height:1.25;word-break:break-word}'+
  '.hpsc-mini.rp::before{background:linear-gradient(180deg,#F6B40E,#ffd35a)}'+
  '.hpsc-mini.rp .cv{color:#0b6a73;font-size:16px;letter-spacing:.2px}'+
  '.hpsc-sec .bdg.bdg-i{font-size:12px;font-style:italic;font-family:Georgia,serif}'+
  '.hpsc-sec{display:flex;align-items:center;gap:11px;margin:6px 0 2px}'+
  '.hpsc-sec .bdg{width:26px;height:26px;border-radius:8px;background:#0E7C86;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800}'+
  '.hpsc-sec .st{font-size:13px;font-weight:800;letter-spacing:2px;color:#12333a}'+
  '.hpsc-money{display:flex;align-items:center;justify-content:space-between;border:1px solid #e2ebed;border-radius:11px;padding:13px 18px;background:#fbfdfd}'+
  '.hpsc-money.hi{background:#e8f6f6;border-color:#bfe0e2}'+
  '.hpsc-money .k{font-size:12.5px;font-weight:700;color:#3a5157}'+
  '.hpsc-money .v{font-size:17px;font-weight:800;color:#0b6a73}'+
  '.hpsc-money .v small{font-size:11px;font-weight:700;color:#7c9297;margin-right:3px}'+
  /* Baris Selisih = Rencana Anggaran Biaya - HPS */
  '.hpsc-money.sel{background:#f4faf6;border-color:#cfe6d6}'+
  '.hpsc-money.sel .v{color:#0d7a3f}'+
  '.hpsc-money .k .sub{display:block;font-size:9.5px;font-weight:600;color:#7c9297;margin-top:2px}'+
  '.hpsc-money.sel.hpsc-money-minus{background:#fdf3f3;border-color:#edbcbc}'+
  '.hpsc-money.sel.hpsc-money-minus .v{color:#b02626}'+
  '.hpsc-reflist{display:flex;flex-direction:column;gap:8px}'+
  '.hpsc-ref{display:flex;align-items:center;gap:12px;border:1px solid #e2ebed;border-radius:11px;padding:11px 15px;background:#fbfdfd}'+
  '.hpsc-ref .ic{width:30px;height:30px;border-radius:8px;background:#e3f2f3;color:#0b6a73;display:flex;align-items:center;justify-content:center}'+
  '.hpsc-ref .ic svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2}'+
  '.hpsc-ref .nm{flex:1;font-size:13px;font-weight:800;color:#12333a}'+
  '.hpsc-ref .rf{font-size:10px;font-weight:800;letter-spacing:1px;color:#5b7075}'+
  '.hpsc-note{display:flex;align-items:center;gap:12px;border:1px dashed #bfe0e2;border-radius:11px;padding:13px 16px;background:#f2fafa}'+
  '.hpsc-note .t{font-size:12.5px;font-weight:800;color:#12333a}'+
  '.hpsc-note .s{font-size:10.5px;color:#5b7075;margin-top:2px}'+
  '.hpsc-doclist{display:grid;grid-template-columns:1fr 1fr;gap:11px}'+
  '.hpsc-doc{position:relative;display:flex;align-items:center;gap:13px;border:1px solid #e4edee;border-radius:13px;padding:13px 16px 13px 20px;background:linear-gradient(180deg,#ffffff,#f5fafa);box-shadow:0 2px 6px rgba(11,61,66,.04);overflow:hidden}'+
  '.hpsc-doc::before{content:"";position:absolute;left:0;top:11px;bottom:11px;width:3.5px;border-radius:4px;background:linear-gradient(180deg,#0E7C86,#22b0ad)}'+
  '.hpsc-doc .n{width:28px;height:28px;border-radius:8px;background:#0E7C86;color:#fff;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex:0 0 auto}'+
  '.hpsc-doc .tx b{display:block;font-size:15px;font-weight:800;color:#12333a;line-height:1.25}'+
  '.hpsc-doc .tx span{font-size:11px;color:#6a8087;margin-top:2px;display:block}'+
  '.hpsc-foot{background:linear-gradient(120deg,#0b3d42,#0E7C86);color:#fff;padding:16px 40px;display:flex;align-items:center;justify-content:space-between;gap:16px}'+
  '.hpsc-foot-l{display:flex;align-items:center;gap:12px}'+
  '.hpsc-foot-logo{width:36px;height:36px;background:none;border:none;border-radius:0;display:flex;align-items:center;justify-content:center;padding:0}'+
  '.hpsc-foot-logo img{width:100%;height:100%;object-fit:contain}'+
  '.hpsc-foot-adr b{display:block;font-size:11px;font-weight:800}'+
  '.hpsc-foot-adr span{font-size:9.5px;opacity:.85}'+
  '.hpsc-web{border:1px solid rgba(255,255,255,.4);border-radius:30px;padding:6px 15px;font-size:10.5px;font-weight:800;white-space:nowrap}'+
  '.hpsc-page,.hpsc-page *,.hpsc-modpage,.hpsc-modpage *{-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  '@media print{'+
    '@page{size:A4;margin:0}'+
    'html,body{margin:0;padding:0}'+
    '.hpsc-page{margin:0;box-shadow:none}'+
    '.hpsc-modpage{padding:0;box-shadow:none}'+
  '}';
}
function hpscHead(kicker, title){
  return '<div class="hpsc-head">'+
    '<div class="hpsc-brand"><div class="hpsc-brand-l">'+
      '<div class="hpsc-logo"><img src="'+FKL_LOGO_SRC+'" alt="PLN"></div>'+
      '<div><div class="hpsc-org1">PT PLN (PERSERO)</div><div class="hpsc-org2">UP3 MASOHI</div></div>'+
    '</div><div class="hpsc-year">TAHUN ANGGARAN '+HPSC_YEAR+'</div></div>'+
    '<div class="hpsc-kicker">'+fkEsc(kicker)+'</div>'+
    '<div class="hpsc-title">'+title+'</div>'+
  '</div><div class="hpsc-goldbar"></div>';
}
function hpscFoot(){
  return '<div class="hpsc-foot"><div class="hpsc-foot-l">'+
    '<div class="hpsc-foot-logo"><img src="'+FKL_LOGO_SRC+'" alt="PLN"></div>'+
    '<div class="hpsc-foot-adr"><b>Jl. Abdullah Soulissa No 1, Masohi, Kec. Kota Masohi</b><span>Kab. Maluku Tengah, Prov. Maluku 97513</span></div>'+
  '</div><div class="hpsc-web">www.pln.co.id</div></div>';
}
function hpscCard(icKey, label, value){
  return '<div class="hpsc-card"><div class="hpsc-ic"><svg viewBox="0 0 24 24">'+HPSC_IC[icKey]+'</svg></div>'+
    '<div class="hpsc-ctx"><div class="cl">'+fkEsc(label)+'</div><div class="cv">'+fkEsc(value||'—')+'</div></div></div>';
}
function hpscPage(kicker, title, bodyHtml){
  return '<div class="hpsc-page">'+hpscHead(kicker,title)+'<div class="hpsc-body">'+bodyHtml+'</div>'+hpscFoot()+'</div>';
}
/* Cover 1 — indeks "Cover HPS" / Empat Dokumen + data pekerjaan */
function hpscCoverIndex(dp, tglHps, nomor, have){
  have = have || {hps:true, ana:true, jadwal:true, ref:true};
  const jenis=(dp.state&&dp.state.info&&dp.state.info.jenis_anggaran)||dp.jenis_anggaran||'';
  /* Hanya cantumkan bagian yang benar-benar ada dokumennya (tertaut Nama Pekerjaan),
     lalu bernomor ulang otomatis — agar daftar cocok dengan lembar yang tercetak. */
  const secs=[
    ['Perhitungan HPS','Dokumen HPS', !!have.hps],
    ['Analisa Harga Satuan','Dokumen analisa harga satuan', !!have.ana],
    ['Jadwal Pengadaan','Tahapan proses pengadaan', !!have.jadwal],
    ['Referensi Harga','Lampiran referensi harga', !!have.ref]
  ].filter(d=>d[2]);
  const docHtml = secs.length
    ? secs.map((d,i)=>'<div class="hpsc-doc"><div class="n">'+(i+1)+'</div><div class="tx"><b>'+d[0]+'</b><span>'+d[1]+'</span></div></div>').join('')
    : '<div class="hpsc-doc" style="grid-column:1 / -1"><div class="tx"><b style="color:#7c9297">Belum ada dokumen terkait</b><span>Tambahkan HPS, Analisa, Jadwal, atau Referensi untuk pekerjaan ini</span></div></div>';
  const mini=(cl,cv,extra)=>'<div class="hpsc-mini'+(extra?' '+extra:'')+'"><div class="cl">'+cl+'</div><div class="cv">'+cv+'</div></div>';
  const body=''+
    '<div class="hpsc-sec"><span class="bdg">A</span><span class="st">DAFTAR DOKUMEN</span></div>'+
    '<div class="hpsc-doclist">'+docHtml+'</div>'+
    '<div class="hpsc-sec" style="margin-top:8px"><span class="bdg">B</span><span class="st">DATA PEKERJAAN</span></div>'+
    hpscCard('work','PEKERJAAN', dp.nama_pekerjaan)+
    '<div class="hpsc-grid">'+
      mini('Lokasi Pekerjaan', fkEsc(dp.lokasi||'—'))+
      mini('Rencana Anggaran Biaya', hpscRpFull(dp.nilai), 'rp')+
      mini('No. Anggaran', fkEsc(dp.no_anggaran||'—'))+
      mini('Tgl. Anggaran', fkEsc(dp.tgl_anggaran?pnwDateLong(dp.tgl_anggaran):'—'))+
      mini('No. HPS', fkEsc(nomor||'—'))+
      mini('Tgl. HPS', fkEsc(tglHps?pnwDateLong(tglHps):'—'))+
      mini('Jenis Anggaran', fkEsc(jenis||'—'))+
      mini('Metode Pengadaan', fkEsc(dp.metode||'—'))+
    '</div>';
  return hpscPage('DOKUMEN HPS','Cover HPS', body);
}
/* Cover — HPS */
function hpscCoverHps(dp, nomor){
  const body=''+
    '<div class="hpsc-nomor"><div class="hpsc-ic" style="width:34px;height:34px"><svg viewBox="0 0 24 24">'+HPSC_IC.tag+'</svg></div><div><div class="lb">NOMOR</div><div class="vl">'+fkEsc(nomor||'—')+'</div></div></div>'+
    hpscCard('work','PEKERJAAN', dp.nama_pekerjaan)+
    hpscCard('loc','LOKASI', dp.lokasi);
  return hpscPage('DOKUMEN PENGADAAN','<span style="font-size:32px;white-space:nowrap">HARGA PERKIRAAN SENDIRI (HPS)</span>', body);
}
/* Cover — Review Pengadaan */
function hpscCoverReview(dp, hpsTotal, refNames, rok){
  const refHtml=(refNames&&refNames.length)? refNames.map((nm,i)=>'<div class="hpsc-ref"><div class="ic"><svg viewBox="0 0 24 24">'+HPSC_IC.bldg+'</svg></div><div class="nm">'+fkEsc(nm)+'</div><div class="rf">Ref '+(i+1)+'</div></div>').join('')
    : '<div class="hpsc-ref"><div class="nm" style="color:#7c9297;font-weight:700">Belum ada referensi harga</div></div>';
  const body=''+
    hpscCard('work','PEKERJAAN', dp.nama_pekerjaan)+
    '<div class="hpsc-sec"><span class="bdg">A</span><span class="st">HARGA (+ PPN 12%)</span></div>'+
    (function(){
      const rab = Number(dp.nilai)||0;
      const hps = Number(hpsTotal)||0;
      const selisih = rab - hps;                       // Rencana Anggaran Biaya - HPS
      const rp = n => (n ? Math.abs(n).toLocaleString('id-ID') : '-');
      // selisih negatif (HPS melebihi RAB) ditandai merah agar mudah terlihat
      const minus = selisih < 0;
      const selKelas = minus ? ' hpsc-money-minus' : '';
      const selTanda = (selisih && minus) ? '-' : '';
      return ''+
        '<div class="hpsc-money"><div class="k">Rencana Anggaran Biaya</div><div class="v"><small>Rp</small>'+(rab?rab.toLocaleString('id-ID'):'-')+'</div></div>'+
        '<div class="hpsc-money hi"><div class="k">HPS</div><div class="v"><small>Rp</small>'+(hps?hps.toLocaleString('id-ID'):'-')+'</div></div>'+
        '<div class="hpsc-money sel'+selKelas+'"><div class="k">Selisih <span class="sub">(Rencana Anggaran Biaya &minus; HPS)</span></div>'+
          '<div class="v"><small>Rp</small>'+selTanda+rp(selisih)+'</div></div>';
    })()+
    '<div class="hpsc-sec"><span class="bdg">B</span><span class="st">REFERENSI HARGA</span></div>'+
    '<div class="hpsc-reflist">'+refHtml+'</div>'+
    '<div class="hpsc-sec"><span class="bdg">C</span><span class="st">PENGGUNAAN ROK</span></div>'+
    (function(){
      const rokN=anaNum(rok);
      const inner = rokN>0
        ? '<div class="t">Penggunaan ROK sebesar '+anaPct(rokN)+'</div>'
        : '<div class="t">ROK tidak dipergunakan untuk pekerjaan ini</div>';
      return '<div class="hpsc-note"><div class="hpsc-ic" style="width:34px;height:34px"><svg viewBox="0 0 24 24">'+HPSC_IC.chart+'</svg></div><div>'+inner+'</div></div>';
    })();
  return hpscPage('ANALISA PENGADAAN','REVIEW PENGADAAN', body);
}
/* Cover — Jadwal / Referensi (pola sama) */
function hpscCoverSimple(kicker, title, dp, dokLabel){
  const body=''+
    '<div class="hpsc-nomor"><div class="hpsc-ic" style="width:34px;height:34px"><svg viewBox="0 0 24 24">'+HPSC_IC.tag+'</svg></div><div><div class="lb">TAHUN ANGGARAN</div><div class="vl">'+HPSC_YEAR+'</div></div></div>'+
    hpscCard('work','PEKERJAAN', dp.nama_pekerjaan)+
    hpscCard('loc','LOKASI', dp.lokasi)+
    hpscCard('doc','DOKUMEN', dokLabel);
  return hpscPage(kicker, title, body);
}
/* ============ SUMBER TUNGGAL DOKUMEN MODUL ============
   Rekap HPS TIDAK lagi menyusun ulang markup/CSS-nya sendiri. Ia memanggil
   fungsi dokumen mandiri (*StandaloneDocHtml) yang persis sama dipakai tombol
   "Cetak / PDF" tiap menu, lalu mengambil isi <body>-nya. Konsekuensinya:
   setiap perubahan pada preview/cetak sebuah menu otomatis ikut di Rekap HPS,
   tanpa perlu menyentuh kode Rekap HPS.
   - css : fungsi CSS tambahan milik modul (digabung ke hpscAllCss)
   - doc : membangun dokumen mandiri modul dari sebuah record tersimpan */
const HPSC_DOC_MODULES = {
  pnw:    { css: ()=>pnwExtraDocCss(), doc: null },
  rho:    { css: ()=>rhoExtraDocCss(),
            doc: rec=>{ const sv=rhoPreviewState; rhoPreviewState=rhoRecordToState(rec); const h=rhoStandaloneDocHtml(); rhoPreviewState=sv; return h; } },
  hps:    { css: ()=>hpsExtraDocCss(),
            doc: rec=>{ const sv=hpsPreviewState; hpsPreviewState=hpsRecordToState(rec); const h=hpsStandaloneDocHtml(); hpsPreviewState=sv; return h; } },
  ana:    { css: ()=>anaExtraDocCss(),
            doc: rec=>{ const sv=anaPreviewState; anaPreviewState=anaRecordToState(rec); const h=anaStandaloneDocHtml(anaPreviewSection); anaPreviewState=sv; return h; } },
  jadwal: { css: ()=>jpExtraDocCss(),
            doc: rec=>{ const sv=jpState; jpState=jpRecordToState(rec); const h=jpStandaloneDocHtml(); jpState=sv; return h; } }
};
/* Ambil isi <body> dari dokumen mandiri, lalu lepas pembungkusnya
   (tabel .fkl-page-wrap dan div .fkl-print-page) — Rekap HPS memasang
   pembungkusnya sendiri lewat hpscModulePage, jadi jangan sampai dobel. */
function hpscExtractDocFrag(html){
  const m=String(html||'').match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let frag = m ? m[1].trim() : '';
  /* 0) BUANG semua <script> dokumen mandiri (fklPageScript). Tanpa ini, script
     tertinggal setelah </table> membuat regex pembungkus di bawah GAGAL cocok
     (ter-anchor ke </table>$), sehingga fragmen tak terlepas — dokumennya lalu
     terbungkus ganda + membawa paginatornya sendiri yang bentrok dgn hpscPageScript,
     dan modul (Perhitungan HPS / Analisa / Jadwal) bisa hilang. Rekap HPS memaginasi
     sendiri lewat hpscPageScript, jadi pager modul memang tidak diperlukan. */
  frag = frag.replace(/<script[\s\S]*?<\/script>/gi, '').trim();
  // 1) lepas tabel pembungkus margin (thead/tfoot spacer) → ambil isi <tbody><tr><td>
  const mw = frag.match(/^<table class="fkl-page-wrap"[^>]*>[\s\S]*?<tbody>\s*<tr>\s*<td>([\s\S]*)<\/td>\s*<\/tr>\s*<\/tbody>[\s\S]*<\/table>$/i);
  if(mw) frag = mw[1].trim();
  // 2) lepas div halaman cetak
  const mp = frag.match(/^<div class="fkl-print-page"[^>]*>([\s\S]*)<\/div>$/i);
  return mp ? mp[1].trim() : frag;
}
function hpscModuleFrag(kind, rec){
  const mod=HPSC_DOC_MODULES[kind];
  if(!rec || !mod || !mod.doc) return '';
  try{ return hpscExtractDocFrag(mod.doc(rec)); }
  catch(e){ console.error('hpscModuleFrag',kind,e); return '<div class="hpsc-page"><div class="hpsc-body"><p style="padding:40px;color:#b02626">Gagal memuat dokumen '+kind+'.</p></div></div>'; }
}
function hpscModulePage(frag){
  return frag ? ('<div class="hpsc-modpage">'+
    '<table class="fkl-page-wrap">'+
      '<thead><tr><td><div class="fkl-vspace"></div></td></tr></thead>'+
      '<tbody><tr><td><div class="fkl-print-page">'+frag+'</div></td></tr></tbody>'+
      '<tfoot><tr><td><div class="fkl-vspace"></div></td></tr></tfoot>'+
    '</table></div>') : '';
}
function hpscAllCss(){
  /* Pakai fklDocBaseCss() (SAMA seperti dokumen mandiri) — bukan hanya textContent
     #fkl-doc-css. Bedanya ada di fklDocCssPatch() yang MEMUAT fklSheetCss(): tanpa
     itu, lembar hasil paginasi (.fkl-sheet) tak punya latar putih/ukuran A4/padding,
     sehingga isi modul (Jadwal, HPS, Analisa, RHO) tampil polos di atas latar abu
     dan tidak seragam dgn halaman cover. */
  const base=(typeof fklDocBaseCss==='function')
    ? fklDocBaseCss()
    : ((document.getElementById('fkl-doc-css')||{}).textContent||'');
  let x='';
  Object.keys(HPSC_DOC_MODULES).forEach(k=>{ try{ x+=HPSC_DOC_MODULES[k].css(); }catch(e){ console.error('hpscAllCss',k,e); } });
  return base + x + hpscCss() + '.hpsc-modpage{page-break-after:always;break-after:page}.hpsc-modpage:last-child{page-break-after:auto}';
}
/* Cari record modul yang cocok berdasarkan Nama Pekerjaan */
function hpscMatch(list, nama){
  const nm=String(nama||'').trim().toLowerCase(); if(!nm) return null;
  return (list||[]).find(r=>String(r.nama_pekerjaan||'').trim().toLowerCase()===nm) || null;
}
/* Ambil dokumen HPS yang diterbitkan lewat menu "Ambil Nomor" (records_penetapan),
   dicocokkan berdasarkan Nama Pekerjaan. Inilah tautan antara nomor & tanggal terbit
   HPS di Penetapan Nomor dengan yang tampil di Rekap HPS. Mengembalikan objek dokumen
   {no, tgl_terbit, ...} atau null bila belum ada. */
function hpscPenetapanHpsDoc(nama){ return fklPenetapanDoc(nama, ['HPS','T_HPS']); }
function hpscBuild(dp){
  const nama=dp.nama_pekerjaan;
  const hpsRec=hpscMatch(records_hps, nama);
  const anaRec=hpscMatch(records_ana, nama);
  const jadwalRec=hpscMatch(records_jadwal, nama);
  const rhoRec=hpscMatch(records_rho, nama);
  const penHps=hpscPenetapanHpsDoc(nama);   // dokumen HPS dari Penetapan Nomor (bila ada)
  // Hitung total HPS SEBENARNYA — sama seperti daftar "Lihat HPS": bila tertaut ke
  // Analisa (Umum) di-resync dulu dari analisa terkini, lalu total dihitung ulang dari
  // state (hpsSummary), bukan mengandalkan nilai_total tersimpan yang bisa basi.
  let hpsTotal=0;
  if(hpsRec){
    const stt=hpsRec.state||{}; const info=stt.info||{};
    const linkedUmum=!!(info.analisaId && info.analisaJenis==='Umum');
    if(linkedUmum && typeof hpsResyncLockedHarga==='function') hpsResyncLockedHarga(stt);
    hpsTotal = linkedUmum
      ? hpsSummary(stt).totT
      : ((hpsRec.nilai_total!=null)?hpsRec.nilai_total:hpsSummary(stt).totT);
  }
  const tglHps=(penHps&&penHps.tgl_terbit) || (hpsRec?hpsRec.tgl_hps:'');
  const nomor=(penHps&&penHps.no) || (hpsRec?((hpsRec.state&&hpsRec.state.info&&hpsRec.state.info.nomor)||hpsRec.nomor||''):'');
  let refNames=[];
  const anaS=(anaRec&&anaRec.state&&Array.isArray(anaRec.state.sumber))?anaRec.state.sumber:[];
  const rhoS=(rhoRec&&rhoRec.state&&Array.isArray(rhoRec.state.sumber))?rhoRec.state.sumber:[];
  (anaS.length?anaS:rhoS).forEach(x=>{ if(x&&String(x).trim()) refNames.push(String(x).trim()); });
  /* Tiap bagian (cover + dokumennya) DITERBITKAN HANYA bila datanya ada — tertaut
     ke Nama Pekerjaan yang sama. Tanpa data: cover & dokumen tidak dibuat sama sekali,
     sehingga tidak ada lagi lembar/kertas kosong di Rekap HPS. Cover HPS (indeks +
     Data Pekerjaan) tetap selalu tampil sebagai sampul utama. */
  const hasHps=!!hpsRec, hasAna=!!anaRec, hasJadwal=!!jadwalRec, hasRho=!!rhoRec;
  let pages='';
  pages+=hpscCoverIndex(dp, tglHps, nomor, {hps:hasHps, ana:hasAna, jadwal:hasJadwal, ref:hasRho}); // 1 — selalu
  if(hasHps){
    pages+=hpscCoverHps(dp, nomor);                                                                  // Cover Harga Perkiraan Sendiri
    pages+=hpscCoverReview(dp, hpsTotal, refNames, (anaRec&&anaRec.state)?anaNum(anaRec.state.rok):0); // Review Pengadaan
    pages+=hpscModulePage(hpscModuleFrag('hps', hpsRec));                                            // Dokumen Perhitungan HPS
  }
  if(hasAna) pages+=hpscModulePage(hpscModuleFrag('ana', anaRec));                                   // Dokumen Analisa Harga Satuan
  if(hasJadwal){
    pages+=hpscCoverSimple('RENCANA PELAKSANAAN','JADWAL PENGADAAN', dp, 'Jadwal & Tahapan Proses Pengadaan'); // Cover Jadwal Pengadaan
    pages+=hpscModulePage(hpscModuleFrag('jadwal', jadwalRec));                                      // Isi Jadwal Pengadaan
  }
  if(hasRho){
    pages+=hpscCoverSimple('SUMBER HARGA','REFERENSI HARGA', dp, 'Kumpulan Referensi Harga Barang / Jasa');    // Cover Referensi Harga
    pages+=hpscModulePage(hpscModuleFrag('rho', rhoRec));                                            // Dokumen Referensi Harga Online
  }
  return '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>&#8203;</title>'+
    fklDocFontLink()+'<style>'+hpscAllCss()+'</style></head><body>'+pages+
    /* Pecah tiap dokumen modul (.fkl-page-wrap) menjadi lembar A4 sungguhan, sama
       seperti cetak per-dokumen. Tanpa ini modul panjang menumpuk/berantakan. */
    hpscPageScript()+
    fklFitScript()+
    '</body></html>';
}
function hpsShowComposite(){
  const sel=document.getElementById('rekap-dp-select'); const id=sel?sel.value:'';
  if(!id){ toast('Pilih Nama Pekerjaan terlebih dahulu','warn'); return; }
  Promise.all([refreshDataDp(),refreshDataHps(),refreshDataAnalisa(),refreshDataJadwal(),refreshDataRho(),refreshDataPenetapan()]).then(()=>{
    const dp=(records_dp||[]).find(r=>String(r.id)===String(id));
    if(!dp){ toast('Data pekerjaan tidak ditemukan','warn'); return; }
    const html=hpscBuild(dp);
    hpscOpenPreview(html, dp.nama_pekerjaan);
  }).catch(err=>{ console.error(err); toast('Gagal memuat data: '+errMsg(err),'err'); });
}
/* Rekap HPS gabungan: HANYA pratinjau — fungsi Cetak / PDF dihilangkan. */
/* Rekap HPS gabungan: pratinjau + tombol Cetak / PDF khusus dokumen ini. */
function hpscOpenPreview(html, nama){
  const ov=document.getElementById('pn-preview-overlay'); if(!ov){ hpscPrintHtml(html); return; }
  const _mdl=ov.querySelector('.pn-preview-modal'); if(_mdl) _mdl.classList.remove('is-max');
  if(typeof pnPreviewResetMaxBtn==='function') pnPreviewResetMaxBtn();
  const titleEl=document.getElementById('pn-preview-title');
  if(titleEl) titleEl.textContent='Pratinjau — HPS: '+(nama||'');
  const body=document.getElementById('pn-preview-body');
  if(body){
    body.classList.add('fkl-preview-body');
    body.innerHTML='<iframe id="hpsc-preview-frame" title="Pratinjau HPS"></iframe>';
    const ifr=document.getElementById('hpsc-preview-frame');
    const doc=ifr.contentWindow.document; doc.open(); doc.write(html); doc.close();
  }
  // Tombol cetak modul lain dibersihkan agar tidak muncul dua tombol berdampingan
  const actions=document.querySelector('#pn-preview-overlay .pn-preview-head-actions');
  ['fkl-preview-print','pnw-preview-print','rho-preview-print','hps-preview-print','ana-preview-print','hpsc-preview-print'].forEach(bid=>{ const b=document.getElementById(bid); if(b) b.remove(); });
  if(actions){
    const btn=document.createElement('button');
    btn.id='hpsc-preview-print'; btn.className='btn btn-teal';
    btn.style.padding='8px 14px'; btn.style.fontSize='11px';
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>Cetak / PDF';
    btn.onclick=function(){ hpscPrintHtml(html); };
    actions.insertBefore(btn, actions.firstChild);
  }
  ov.classList.add('show');
}
/* Cetak Rekap HPS gabungan lewat iframe terisolasi.
   Iframe TIDAK dibuang lewat timer: dialog "Simpan sebagai PDF" masih memakainya,
   sehingga penghapusan dini membuat dialog tertutup sendiri. Pembersihan menunggu
   'afterprint', dengan cadangan event 'focus' bila browser tak mengirimkannya. */
function hpscPrintHtml(html){
  const old=document.getElementById('hpsc-print-frame'); if(old) old.remove();
  const ifr=document.createElement('iframe');
  ifr.id='hpsc-print-frame'; ifr.setAttribute('aria-hidden','true');
  ifr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(ifr);
  const doc=ifr.contentWindow.document; doc.open(); doc.write(html); doc.close();

  let sudahCetak=false, sudahBersih=false;
  const bersihkan=()=>{
    if(sudahBersih) return; sudahBersih=true;
    window.removeEventListener('focus', onFocus);
    setTimeout(()=>{ const f=document.getElementById('hpsc-print-frame'); if(f) f.remove(); }, 400);
  };
  const onFocus=()=>{ setTimeout(bersihkan, 600); };
  const go=()=>{
    if(sudahCetak) return; sudahCetak=true;      // cegah print() terpanggil dua kali
    const w=ifr.contentWindow;
    try{ w.onafterprint=bersihkan; }catch(e){}
    try{ w.addEventListener('afterprint', bersihkan); }catch(e){}
    window.addEventListener('focus', onFocus);
    const cetak=()=>{ withHiddenPageTitle(()=>{ try{ w.focus(); w.print(); }catch(e){ try{ window.print(); }catch(_){} } }); };
    /* Tunggu hpscPageScript selesai memecah modul menjadi lembar A4 (maks ~3 dtk),
       supaya yang tercetak adalah lembar rapi — bukan tata letak memanjang. */
    let sisaTunggu=3000;
    const tunggu=()=>{ let siap=false; try{ siap=!!(w && w.__hpscPaged); }catch(e){ siap=true; }
      if(siap || sisaTunggu<=0){ cetak(); return; } sisaTunggu-=60; setTimeout(tunggu,60); };
    tunggu();
  };
  const imgs=doc.images?Array.from(doc.images):[];
  if(imgs.length){ let n=imgs.length; const dec=()=>{ if(--n<=0) setTimeout(go,80); }; imgs.forEach(im=>{ if(im.complete) dec(); else { im.onload=dec; im.onerror=dec; } }); setTimeout(go,1500); }
  else setTimeout(go,150);
}

/* ================= AKHIR COMPOSITE HPS PDF ================= */

/* ---- Cetak / PDF rekap gabungan ---- */
function rekapExtraDocCss(){
  return ''+
  '.rekap-sec{font-weight:800;font-size:12px;color:#0d2a30;margin:14px 0 6px}'+
  'table.rekap-tbl{width:100%;border-collapse:collapse;margin:0 0 10px;border:1.5px solid #0b6a73}'+
  'table.rekap-tbl th,table.rekap-tbl td{border:1px solid #7d97ab;padding:6px 8px;font-size:9.5px;vertical-align:middle}'+
  'table.rekap-tbl thead th{background:#0E7C86;color:#fff;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:0;border-color:#5aa8ae;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  'table.rekap-tbl thead th:first-child{border-left-color:#0E7C86}'+
  'table.rekap-tbl thead th:last-child{border-right-color:#0E7C86}'+
  'table.rekap-tbl thead tr:last-child th{border-bottom:1.5px solid #0b6a73}'+
  'table.rekap-tbl td.no,table.rekap-tbl td.tgl{text-align:center;white-space:nowrap}'+
  'table.rekap-tbl td.num{text-align:right;white-space:nowrap}';
}
function rekapStandaloneDocHtml(dp, hpsList, anaList){
  const infoRow=(k,v)=>'<tr><td class="k">'+k+'</td><td class="s">:</td><td class="v" style="text-align:justify">'+fkEsc(v||'-')+'</td></tr>';
  const hpsBody = hpsList.length ? hpsList.map((r,i)=>'<tr>'+
      '<td class="no">'+(i+1)+'</td>'+
      '<td class="tgl">'+fkEsc(r.tgl_hps?pnwDateLong(r.tgl_hps):'-')+'</td>'+
      '<td class="no">'+(r.jumlah_item!=null?r.jumlah_item:'-')+'</td>'+
      '<td class="num">'+hpsRpDoc(r.nilai_total)+'</td>'+
    '</tr>').join('')
    : '<tr><td colspan="4" style="text-align:center;font-style:italic;color:#7d97ab">Belum ada data</td></tr>';
  const anaBody = anaList.length ? anaList.map((r,i)=>'<tr>'+
      '<td class="no">'+(i+1)+'</td>'+
      '<td class="tgl">'+fkEsc(r.tgl_analisa?pnwDateLong(r.tgl_analisa):'-')+'</td>'+
      '<td class="no">'+(r.jumlah_item!=null?r.jumlah_item:'-')+'</td>'+
      '<td class="num">'+hpsRpDoc(r.nilai_total)+'</td>'+
    '</tr>').join('')
    : '<tr><td colspan="4" style="text-align:center;font-style:italic;color:#7d97ab">Belum ada data</td></tr>';
  return fklDocShell(rekapExtraDocCss(), ''+
    '<div class="fkl-doc">'+
      '<div class="fkl-doc-head">'+
        '<div class="fkl-doc-logo"><img src="'+FKL_LOGO_SRC+'" alt="Logo PLN"></div>'+
        '<div class="fkl-doc-org">'+
          '<div class="l1">PT PLN (PERSERO)</div>'+
          '<div class="l2">UNIT PELAKSANA PELAYANAN PELANGGAN MASOHI</div>'+
          '<div class="l3">Jl. Abdullah Soulissa No 1, Masohi, Kec. Kota Masohi</div>'+
        '</div>'+
      '</div>'+
      '<div class="fkl-doc-band"></div>'+
      fklDocTitleBlock('REKAP HARGA PERKIRAAN SENDIRI', dp.nama_pekerjaan, ['HPS','T_HPS'])+
      '<div class="fkl-sec-h"><span class="rn">A</span>Data Pekerjaan</div>'+
      '<table class="fkl-info"><tbody>'+
        infoRow('Nama Pekerjaan', dp.nama_pekerjaan)+
        infoRow('Lokasi Pekerjaan', dp.lokasi)+
        infoRow('Rencana Anggaran Biaya', hpsRpDoc(dp.nilai))+
        infoRow('No. Anggaran', dp.no_anggaran)+
        infoRow('Tgl. Anggaran', dp.tgl_anggaran?pnwDateLong(dp.tgl_anggaran):'-')+
        infoRow('Metode Pengadaan', dp.metode)+
      '</tbody></table>'+
      '<div class="rekap-sec">B. Perhitungan HPS</div>'+
      '<table class="rekap-tbl"><thead><tr><th style="width:34px">No</th><th>Tgl. HPS</th><th style="width:90px">Jumlah Item</th><th style="width:150px">Nilai HPS (Rp)</th></tr></thead><tbody>'+hpsBody+'</tbody></table>'+
      '<div class="rekap-sec">C. Analisa Harga Satuan</div>'+
      '<table class="rekap-tbl"><thead><tr><th style="width:34px">No</th><th>Tgl. Analisa</th><th style="width:90px">Jumlah Item</th><th style="width:150px">Nilai (Rp)</th></tr></thead><tbody>'+anaBody+'</tbody></table>'+
    '</div>');
}
function rekapPrint(){
  const id=_rekapCurrentDpId; if(!id){ toast('Tampilkan data terlebih dahulu','warn'); return; }
  const dp=(records_dp||[]).find(r=>String(r.id)===String(id)); if(!dp){ toast('Data pekerjaan tidak ditemukan','warn'); return; }
  const {hpsList, anaList}=rekapRowsFor(id);
  const old=document.getElementById('rekap-print-frame'); if(old) old.remove();
  const ifr=document.createElement('iframe');
  ifr.id='rekap-print-frame';
  ifr.setAttribute('aria-hidden','true');
  ifr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(ifr);
  const doc=ifr.contentWindow.document;
  doc.open(); doc.write(rekapStandaloneDocHtml(dp, hpsList, anaList)); doc.close();
  const go=()=>fklWaitPaged(ifr, _go);
  const _go=()=>{ withHiddenPageTitle(()=>{ try{ ifr.contentWindow.focus(); ifr.contentWindow.print(); }catch(e){ try{ window.print(); }catch(_){} } }); setTimeout(()=>{ const f=document.getElementById('rekap-print-frame'); if(f) f.remove(); },1500); };
  const imgs=doc.images?Array.from(doc.images):[];
  if(imgs.length){ let n=imgs.length; const dec=()=>{ if(--n<=0) setTimeout(go,60); }; imgs.forEach(im=>{ if(im.complete) dec(); else { im.onload=dec; im.onerror=dec; } }); setTimeout(go,1600); }
  else setTimeout(go,120);
}

/* ---------- Migrasi otomatis (sekali jalan): Data Pekerjaan dari HPS/Analisa
   lama (yang belum punya dpId) dijadikan entri baru di menu Data Pekerjaan,
   lalu dokumen lama tsb ditautkan (dpId) ke entri barunya. Data pekerjaan
   dengan nama+no.anggaran+tgl.anggaran yang sama akan digabung jadi satu
   entri Data Pekerjaan (tidak dobel). ---------- */
const DP_MIGRATION_FLAG='dp_migration_v1_done';
async function dpMigrateOldRecords(){
  try{ if(localStorage.getItem(DP_MIGRATION_FLAG)) return; }catch(e){}
  try{
    await Promise.all([refreshDataDp(), refreshDataHps(), refreshDataAnalisa()]);
    const keyOf=info=>[String(info.nama||'').trim().toLowerCase(), String(info.no_anggaran||'').trim().toLowerCase(), String(info.tgl_anggaran||'')].join('|');
    const dpByKey={};
    (records_dp||[]).forEach(r=>{ const info=(r.state&&r.state.info)||{}; dpByKey[keyOf(info)]=r.id; });
    async function ensureDp(info){
      if(!String(info.nama||'').trim()) return null;
      const k=keyOf(info);
      if(dpByKey[k]) return dpByKey[k];
      const rec={
        nama_pekerjaan: info.nama||'', lokasi: info.lokasi||'', metode: info.metode||'',
        no_anggaran: info.no_anggaran||'', tgl_anggaran: info.tgl_anggaran||'',
        nilai: Number(info.nilai)||0,
        state: { info: { nama:info.nama||'', lokasi:info.lokasi||'', nilai:info.nilai||'', no_anggaran:info.no_anggaran||'', tgl_anggaran:info.tgl_anggaran||'', metode:info.metode||'' } }
      };
      const row=await StoreDp.create(rec);
      const id=row?row.id:null;
      if(id) dpByKey[k]=id;
      return id;
    }
    let changed=false;
    for(const r of (records_hps||[])){
      const st=(r.state&&typeof r.state==='object')?r.state:null; if(!st) continue;
      st.info=st.info||{}; if(st.info.dpId) continue;
      const dpId=await ensureDp(st.info); if(!dpId) continue;
      st.info.dpId=String(dpId); st.info.dpNama=st.info.nama||'';
      await StoreHps.update(r.id, {state: st}); changed=true;
    }
    for(const r of (records_ana||[])){
      const st=(r.state&&typeof r.state==='object')?r.state:null; if(!st) continue;
      st.info=st.info||{}; if(st.info.dpId) continue;
      const dpId=await ensureDp(st.info); if(!dpId) continue;
      st.info.dpId=String(dpId); st.info.dpNama=st.info.nama||'';
      await StoreAna.update(r.id, {state: st}); changed=true;
    }
    if(changed){ await refreshDataDp(); await refreshDataHps(); await refreshDataAnalisa(); }
    try{ localStorage.setItem(DP_MIGRATION_FLAG,'1'); }catch(e){}
  }catch(err){ console.error('Migrasi Data Pekerjaan gagal:', err); }
}

/* ##################### AKHIR MODUL REKAP HPS #################### */


/* =========================================================================
   MIGRASI SEKALI-JALAN: pindahkan SEMUA data yang masih tersimpan di
   localStorage (akibat fallback lokal pada versi lama) ke Supabase, lalu
   hapus kunci localStorage-nya. Setelah ini seluruh data hanya berada di
   Supabase sehingga dapat dilihat di semua perangkat.
   Kunci localStorage HANYA dihapus bila SEMUA baris pada modul itu berhasil
   dipindahkan (jika gagal, dibiarkan agar dicoba lagi saat dibuka berikutnya).
   ========================================================================= */
const LOCAL_DATA_MIGRATIONS = [
  { key:'dp_records_v1',      table:'data_pekerjaan',          cols:['nama_pekerjaan','lokasi','metode','no_anggaran','tgl_anggaran','nilai','state'] },
  { key:'hps_records_v1',     table:'harga_perkiraan_sendiri', cols:['nama_pekerjaan','lokasi','metode','jumlah_item','nilai_total','tgl_hps','tgl_input','state'] },
  { key:'analisa_records_v1', table:'analisa_harga_satuan',    cols:['nama_pekerjaan','lokasi','metode','jumlah_item','jumlah_referensi','nilai_total','tgl_analisa','tgl_input','state'] },
  { key:'rho_records_v1',     table:'referensi_harga_online',  cols:['nama_pekerjaan','lokasi','metode','jumlah_item','jumlah_referensi','tgl_input','state'] },
  { key:'jadwal_records_v1',  table:'jadwal_pelaksanaan',      cols:['nama_pekerjaan','tgl_mulai','tgl_selesai','jumlah_tahapan','state'] }
];
async function migrateLocalStorageToSupabase(){
  if(!(USE_SUPABASE && db)) return;   // tanpa Supabase, tidak ada tujuan migrasi
  let totalMoved=0;
  for(const m of LOCAL_DATA_MIGRATIONS){
    let arr=[];
    try{ const raw=localStorage.getItem(m.key); arr = raw ? JSON.parse(raw) : []; }catch(e){ arr=[]; }
    if(!Array.isArray(arr) || !arr.length){ try{ localStorage.removeItem(m.key); }catch(e){} continue; }
    let allOk=true;
    for(const row of arr){
      if(!row || typeof row!=='object') continue;
      const rec={};
      m.cols.forEach(c=>{ if(row[c]!==undefined) rec[c]=row[c]; });
      // Tautan dpId lama yang bersifat lokal (loc_...) dilepas agar bisa ditautkan
      // ulang oleh migrasi Data Pekerjaan setelah dipindah ke Supabase.
      if(rec.state && rec.state.info && typeof rec.state.info.dpId==='string' && rec.state.info.dpId.indexOf('loc_')===0){
        delete rec.state.info.dpId; delete rec.state.info.dpNama;
      }
      try{ const {error}=await db.from(m.table).insert(rec); if(error) throw error; totalMoved++; }
      catch(err){ console.error('Migrasi '+m.table+' gagal:', err&&err.message); allOk=false; break; }
    }
    if(allOk){ try{ localStorage.removeItem(m.key); }catch(e){} }
  }
  if(totalMoved>0){
    try{ toast(totalMoved+' data lokal berhasil dipindahkan ke Supabase','ok'); }catch(e){}
    try{ await Promise.all([refreshDataDp(),refreshDataHps(),refreshDataAnalisa(),refreshDataRho(),refreshDataJadwal()]); }catch(e){}
  }
}

/* Muat semua data awal. Karena async, tiap selesai memuat kita render ULANG
   halaman yang sedang aktif — mencegah tabel tampil KOSONG saat refresh
   (dulu data baru muncul setelah pindah menu). */
[ refreshData,        // SPBJ/Kontrak Rinci
  refreshDataPl,      // Pengadaan Langsung
  refreshDataTender,  // Tender
  refreshDataPenetapan,
  refreshDataKelengkapan,
  refreshDataPembukaan,
  refreshDataRho,
  refreshDataHps,
  refreshDataAnalisa,
  refreshDataJadwal
].forEach(function(fn){
  try{ var p=fn(); if(p && p.then) p.then(rerenderActiveView).catch(function(){}); }catch(e){}
});
migrateLocalStorageToSupabase().then(dpMigrateOldRecords);    // pindahkan data lokal ke Supabase (sekali jalan), lalu tautkan Data Pekerjaan lama
pnLoadConfig();         // muat konfigurasi nomor awal
// #3: Refresh TIDAK memaksa logout selama sesi masih dalam batas wajar.
// Sesi dipulihkan dari sessionStorage HANYA bila belum melewati batas umur
// sesi absolut (SESSION_MAX_MS) maupun batas idle (IDLE_LIMIT_MS) — inilah
// yang mencegah sesi "menggantung" berhari-hari (mis. karena browser
// memulihkan tab/sessionStorage lama saat dibuka kembali).
resetLoginForm();
(function restoreSession(){
  let role=null, uname=null, view=null;
  role=ssGet(ROLE_KEY); uname=ssGet(USER_KEY); view=ssGet(VIEW_KEY);
  const now=Date.now();
  const loginAt=parseInt(ssGet(LOGIN_TIME_KEY)||'0',10);
  const lastActiveAt=parseInt(ssGet(LAST_ACTIVE_KEY)||'0',10);
  const tooOldSession = loginAt>0 && (now-loginAt) > SESSION_MAX_MS;
  const tooLongIdle = IDLE_LOGOUT_ENABLED && lastActiveAt>0 && (now-lastActiveAt) > IDLE_LIMIT_MS;
  const hasRole = (role==='admin' || role==='user' || role==='guest' || role==='demo');
  if(hasRole && !tooOldSession && !tooLongIdle){
    currentUsername = uname || null;
    // Refresh: kembali ke halaman terakhir (data di halaman itu di-refresh), bukan ke dashboard.
    const allowed=['dashboard','list','list-pl','list-tender','pn-lihat','pn-ambil','form-kelengkapan','fkl-view','form-pembukaan','pnw-view','form-rho','rho-view','form-hps','hps-view','form-analisa','analisa-view','spk-susun','spk-view','spk-klausul'];
    const inputViews=['input','input-pl','input-tender'];
    const draft=getDraft();
    if(inputViews.includes(view)){
      // Masuk aplikasi dulu (tanpa pindah halaman), lalu pulihkan form dari draft
      // sehingga data yang sedang diketik / diubah TIDAK hilang saat refresh.
      enterApp(role, 'dashboard');
      const canInput = (role==='admin' || role==='user' || role==='demo');
      if(canInput && draft && draft.kind===view && restoreDraft(draft)){
        // berhasil dipulihkan (termasuk mode Ubah Data)
      }else{
        clearDraft();
        const inputOpener={ 'input':newRecord, 'input-pl':newRecordPl, 'input-tender':newRecordTender };
        inputOpener[view] && inputOpener[view]();
      }
    }else{
      const target = allowed.includes(view) ? view : 'dashboard';
      enterApp(role, target);   // langsung masuk aplikasi tanpa login ulang (filter default)
    }
  }else{
    if(hasRole && (tooOldSession || tooLongIdle)){
      // Sesi lama yang sudah kedaluwarsa → bersihkan & beri tahu, jangan dipulihkan diam-diam
      ssDel(ROLE_KEY); ssDel(USER_KEY); ssDel(VIEW_KEY); ssDel(DRAFT_KEY); ssDel(LOGIN_TIME_KEY); ssDel(LAST_ACTIVE_KEY);
      setTimeout(()=>toast('Sesi sebelumnya sudah berakhir, silakan masuk kembali','warn'), 350);
    }
    currentRole=null; currentUsername=null;   // belum ada sesi / sesi kedaluwarsa → tampilkan layar login
  }
})();
// close modal on overlay click
document.getElementById('confirm-overlay').addEventListener('click',e=>{ if(e.target.id==='confirm-overlay')closeConfirm(); });
document.getElementById('detail-overlay').addEventListener('click',e=>{ if(e.target.id==='detail-overlay')closeDetail(); });
document.getElementById('cp-overlay').addEventListener('click',e=>{ if(e.target.id==='cp-overlay')closeChangePass(); });
document.getElementById('pn-doc-overlay').addEventListener('click',e=>{ if(e.target.id==='pn-doc-overlay')pnDocModalCancel(); });
document.getElementById('hps-ana-overlay').addEventListener('click',e=>{ if(e.target.id==='hps-ana-overlay')closeHpsAnaPicker(); });
document.getElementById('dp-picker-overlay').addEventListener('click',e=>{ if(e.target.id==='dp-picker-overlay')closeDpPicker(); });
document.getElementById('pn-preview-overlay').addEventListener('click',e=>{ if(e.target.id==='pn-preview-overlay')closePnPreview(); });


