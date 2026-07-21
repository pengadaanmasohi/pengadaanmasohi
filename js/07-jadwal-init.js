/* ===== 07-jadwal-init.js (bagian 7/15, baris 5500-6563 dari app.js asli) =====
   Hari libur & jadwal pelaksanaan, profil jadwal, pill indicator, INIT aplikasi.
   WAJIB dimuat berurutan 01 s.d. 15 — jangan ubah urutannya. ===== */
/* ============================================================
   ============  HARI LIBUR & JADWAL PELAKSANAAN  =============
   Filter hari kerja (melewati Sabtu, Minggu, & hari libur nasional
   yang diinput manual) untuk menyusun Jadwal Pelaksanaan Pekerjaan.
   Daftar hari libur disimpan di Supabase tabel `hari_libur`
   (kolom: id, tgl date, keterangan text) — bisa ditambah untuk
   tahun berapa pun ke depan, tidak dibatasi tahun berjalan saja.
   Jalankan skrip berikut sekali di Supabase SQL Editor:
     create table if not exists hari_libur (
       id bigint generated always as identity primary key,
       tgl date not null unique,
       keterangan text,
       created_at timestamptz default now()
     );
   ============================================================ */
const HL_TABLE = 'hari_libur';
let hariLibur = [];   // [{id, tgl:'YYYY-MM-DD', keterangan}]
let hlMap = {};        // {'YYYY-MM-DD': keterangan} — lookup cepat
const HARI_NAMA = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

function hlSupaReady(){ return !!(USE_SUPABASE && db); }
const StoreHariLibur = {
  async list(){
    if(!hlSupaReady()) return [];
    const {data,error}=await db.from(HL_TABLE).select('*').order('tgl',{ascending:true});
    if(error) throw error; return data||[];
  },
  async create(tgl, keterangan){
    if(!hlSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(HL_TABLE).insert({tgl, keterangan}).select();
    if(error) throw error; return data&&data[0];
  },
  async remove(id){
    if(!hlSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(HL_TABLE).delete().eq('id',id);
    if(error) throw error;
  }
};
async function refreshHariLibur(){
  try{ hariLibur = await StoreHariLibur.list(); }
  catch(err){ console.error(err); hariLibur = hariLibur||[]; toast('Gagal memuat data Hari Libur: '+errMsg(err),'err'); }
  hlMap = {}; hariLibur.forEach(r=>{ hlMap[String(r.tgl)] = r.keterangan||''; });
}

/* ---- Util tanggal (lokal, hindari pergeseran zona waktu) ---- */
function hlToISO(d){ const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0'); return y+'-'+m+'-'+day; }
function hlParseISO(s){ const p=String(s).split('-'); return new Date(Number(p[0]), Number(p[1])-1, Number(p[2])); }
function hlAddDays(d,n){ const r=new Date(d); r.setDate(r.getDate()+n); return r; }
/* Status satu tanggal: hari kerja, atau libur (Sabtu/Minggu/Nasional + keterangan) */
function hlDayStatus(d){
  const dow=d.getDay(); const iso=hlToISO(d);
  if(Object.prototype.hasOwnProperty.call(hlMap, iso)) return {kerja:false, label:'Libur Nasional', ket:hlMap[iso]};
  if(dow===0) return {kerja:false, label:'Minggu', ket:''};
  if(dow===6) return {kerja:false, label:'Sabtu', ket:''};
  return {kerja:true, label:'Hari Kerja', ket:''};
}

/* ---------- Halaman: Hari Libur Nasional & Cuti Bersama ---------- */
function openHariLibur(){ refreshHariLibur().then(()=>showView('hari-libur')); }
function hlEmptyRow(){
  return '<tr><td colspan="5"><div class="empty">'+
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>'+
    '<div>Belum ada data hari libur</div></div></td></tr>';
}
function renderHariLibur(){
  const cont=document.getElementById('hl-content'); if(!cont) return;
  const cnt=document.getElementById('hl-count'); if(cnt) cnt.textContent=hariLibur.length;

  const rows = hariLibur.length ? hariLibur.map((r,i)=>{
    const d=hlParseISO(r.tgl); const dow=d.getDay();
    return '<tr class="'+((dow===0||dow===6)?'hl-weekend':'')+'">'+
      '<td class="col-no">'+(i+1)+'</td>'+
      '<td class="col-date">'+fkEsc(pnwDateLong(r.tgl))+'</td>'+
      '<td>'+HARI_NAMA[dow]+'</td>'+
      '<td class="wrap-cell">'+fkEsc(r.keterangan||'—')+'</td>'+
      '<td style="text-align:center"><button class="fk-act fk-act-del fk-act-icon" title="Hapus" onclick="hlDelete(\''+r.id+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></td>'+
    '</tr>';
  }).join('') : hlEmptyRow();

  // Tata letak disamakan dengan form Input Data Pekerjaan:
  // form-card + form-flow (grid kolom), tombol aksi di pojok kanan bawah.
  cont.innerHTML = ''+
    '<div class="form-card">'+
      '<div class="form-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> Tambah Tanggal Libur</div>'+
      '<div class="hps-hint">Tanggal yang ditambahkan di sini akan dilompati saat perhitungan <b>hari kerja</b> pada Jadwal Pelaksanaan Pengadaan.</div>'+
      '<div class="form-flow hl-add-flow" style="--cols:4">'+
        '<div class="field" style="flex:0 1 200px"><label>Tanggal</label><input type="date" id="hl-tgl"></div>'+
        '<div class="field" style="flex:1 1 240px"><label>Keterangan</label><input type="text" id="hl-ket" placeholder="mis. Hari Kemerdekaan RI" onkeydown="if(event.key===\'Enter\'){event.preventDefault();hlAdd();}"></div>'+
        '<div class="field hl-add-btn-field" style="flex:0 0 auto"><button class="btn btn-teal" onclick="hlAdd()">'+
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Tambah Tanggal'+
        '</button></div>'+
      '</div>'+
    '</div>'+
    '<div class="hl-tpl-bar">'+
      '<div class="hl-tpl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>'+
      '<div class="hl-tpl-txt"><b>Template Pengisian Hari Libur</b><span>Unduh format Excel, isi data, lalu unggah kembali untuk menambah banyak data sekaligus</span></div>'+
      '<div class="hl-tpl-actions">'+
        '<button class="btn btn-amber" onclick="hlDownloadTemplate()">'+
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'+
          ' Download Template'+
        '</button>'+
        '<button class="btn btn-teal" onclick="openTplUpload({title:\'Unggah Template — Hari Libur\',accept:\'.xlsx,.xls\',hint:\'Hanya file Excel (.xlsx / .xls)\',onFile:function(f){hlHandleUpload({target:{files:[f],value:\'\'}});}})">'+
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'+
          ' Upload Template'+
        '</button>'+
      '</div>'+
    '</div>'+
    '<div class="panel" style="margin-top:16px">'+
      '<div class="table-wrap"><table>'+
        '<thead><tr><th class="col-no">No</th><th class="col-date">Tanggal</th><th>Hari</th><th>Keterangan</th><th style="text-align:center;width:80px">Aksi</th></tr></thead>'+
        '<tbody>'+rows+'</tbody>'+
      '</table></div>'+
    '</div>'+
    '<div class="jp-actions" style="justify-content:flex-end;margin-top:14px">'+
      '<button class="btn btn-red" onclick="hlBatalClick()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg> Batal</button>'+
    '</div>';
}
/* Tombol Batal pada Tentukan Hari Libur — kosongkan isian tambah tanggal lalu
   kembali ke halaman Lihat Jadwal (perubahan daftar sudah tersimpan otomatis). */
function hlBatalClick(){
  const tglEl=document.getElementById('hl-tgl'), ketEl=document.getElementById('hl-ket');
  if(tglEl) tglEl.value='';
  if(ketEl) ketEl.value='';
  openJadwalLihat();
}
async function hlAdd(){
  if(!requireInput()) return;
  const tglEl=document.getElementById('hl-tgl'), ketEl=document.getElementById('hl-ket');
  const tgl=tglEl?tglEl.value:''; const ket=(ketEl?ketEl.value:'').trim();
  if(!tgl){ toast('Pilih tanggal terlebih dahulu','warn'); return; }
  if(Object.prototype.hasOwnProperty.call(hlMap, tgl)){ toast('Tanggal ini sudah ada di daftar','warn'); return; }
  try{ await withActionLoader('Menyimpan', async()=>{ await StoreHariLibur.create(tgl, ket); await refreshHariLibur(); }); }
  catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'err'); return; }
  toast('Tanggal libur ditambahkan','ok');
  renderHariLibur();
}
function hlDelete(id){
  openConfirm({
    icon:'del', title:'Hapus Tanggal Libur', text:'Hapus tanggal ini dari daftar hari libur?',
    onYes:async()=>{
      try{ await withActionLoader('Menghapus', async()=>{ await StoreHariLibur.remove(id); await refreshHariLibur(); }); }
      catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'warn'); return; }
      toast('Tanggal libur dihapus','ok');
      renderHariLibur();
    }
  });
}

/* ---------- Download / Upload Template Hari Libur (Excel) ---------- */
async function hlDownloadTemplate(){
  if(!requireInput()) return;
  if(!window.ExcelJS){ toast('Library Excel belum termuat, coba lagi','warn'); return; }
  const wb=new ExcelJS.Workbook();
  const ws=wb.addWorksheet('Data');
  ws.columns=[{width:18},{width:44}];
  const thin={style:'thin', color:{argb:'FFBFCAD0'}};
  const allBorder={top:thin,left:thin,bottom:thin,right:thin};
  ws.addRow(['Tanggal','Keterangan']);
  const headRow=ws.getRow(1); headRow.height=30;
  for(let c=1;c<=2;c++){
    const cell=ws.getCell(1,c);
    cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0E7C86'}};
    cell.font={bold:true,color:{argb:'FFFFFFFF'},size:11};
    cell.alignment={vertical:'middle',horizontal:'center'};
    cell.border=allBorder;
  }
  for(let r=2;r<=201;r++){
    for(let c=1;c<=2;c++){
      const cell=ws.getCell(r,c);
      cell.border=allBorder;
      cell.alignment={vertical:'middle'};
      if(r%2===1) cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF2F7F8'}};
    }
    ws.getCell(r,1).numFmt='dd/mm/yyyy';
  }
  const buf=await wb.xlsx.writeBuffer();
  const blob=new Blob([buf],{type:'application/octet-stream'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download='Template_Hari_Libur.xlsx';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
}
function hlHandleUpload(ev){
  if(!requireInput()){ ev.target.value=''; return; }
  const file=ev.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=async e=>{
    try{
      const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});
      const sheetName=wb.SheetNames.includes('Data')?'Data':wb.SheetNames[0];
      const ws=wb.Sheets[sheetName];
      const sheetRows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      if(sheetRows.length<2){ toast('File kosong / tidak ada data','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      const batch=[];
      for(let r=1;r<sheetRows.length;r++){
        const row=sheetRows[r]; if(!row || row.every(c=>String(c).trim()==='')) continue;
        const tglRaw=row[0], ketRaw=row[1];
        if(!isValidDateCell(tglRaw) || String(tglRaw).trim()===''){ toast('Data gagal diperbarui : format tanggal tidak sesuai','err', TOAST_MS_UPLOAD); ev.target.value=''; return; }
        const iso=normDate(tglRaw);
        batch.push({tgl:iso, keterangan:String(ketRaw||'').trim()});
      }
      if(batch.length===0){ toast('Tidak ada baris data untuk diimpor','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      const existKeys=new Set((hariLibur||[]).map(r=>String(r.tgl)));
      const seen=new Set(); const toAdd=[]; let dupCount=0;
      batch.forEach(rec=>{
        if(existKeys.has(rec.tgl) || seen.has(rec.tgl)){ dupCount++; return; }
        seen.add(rec.tgl); toAdd.push(rec);
      });
      if(toAdd.length){
        try{
          await withActionLoader('Mengimpor', async()=>{
            for(const rec of toAdd){ await StoreHariLibur.create(rec.tgl, rec.keterangan); }
            await refreshHariLibur();
          });
        }catch(err){ console.error(err); toast('Gagal mengimpor: '+errMsg(err),'warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      }
      if(dupCount>0) toast('Sebagian data ('+dupCount+') gagal ditambahkan : duplikat','err');
      else toast('Data berhasil ditambahkan','ok');
      renderHariLibur();
    }catch(err){ console.error(err); toast('Gagal membaca file Excel','warn', TOAST_MS_UPLOAD); }
    ev.target.value='';
  };
  reader.readAsArrayBuffer(file);
}

/* ---------- Halaman: Jadwal Pelaksanaan Pekerjaan (berbasis tahapan) ----------
   Tiap tahapan (Undangan Pengadaan, Pendaftaran, dst.) punya durasi sendiri
   (Hari/Jam/Menit). Awal tahap ke-2 dst secara DEFAULT otomatis mengikuti
   Akhir tahap sebelumnya (berurutan), tapi bisa di-override manual per
   tahap (mis. Pendaftaran ingin mulai bersamaan dengan Undangan Pengadaan).
   Perhitungan Akhir memakai jam kerja (Jam Kerja Mulai–Selesai) dan otomatis
   melompati Sabtu, Minggu, & hari libur nasional (dari modul Hari Libur). */
const JP_DEFAULT_TAHAPAN = [
  {nama:'Undangan Pengadaan',              awalTgl:'', awalJam:'08:00', akhirTgl:'', akhirJam:'15:00', ket:''},
  {nama:'Pendaftaran',                     awalTgl:'', awalJam:'08:00', akhirTgl:'', akhirJam:'15:00', ket:''},
  {nama:'Upload Dokumen Penawaran',        awalTgl:'', awalJam:'08:00', akhirTgl:'', akhirJam:'15:00', ket:''},
  {nama:'Pembukaan Dokumen Penawaran',     awalTgl:'', awalJam:'08:00', akhirTgl:'', akhirJam:'12:00', ket:''},
  {nama:'Evaluasi Penawaran',              awalTgl:'', awalJam:'08:00', akhirTgl:'', akhirJam:'10:30', ket:''},
  {nama:'Klarifikasi dan Negosiasi Harga', awalTgl:'', awalJam:'08:00', akhirTgl:'', akhirJam:'15:00', ket:''},
  {nama:'Penandatanganan Kontrak / SPK',   awalTgl:'', awalJam:'08:00', akhirTgl:'', akhirJam:'15:00', ket:''}
];
/* Normalkan satu tahapan ke bentuk baru (awal/akhir manual).
   Data lama memakai durasi hari/jam/menit — dikonversi lewat jpMigrateTahapan(). */
function jpTahapNorm(t){
  t=t||{};
  return {
    nama: t.nama||'',
    awalTgl: t.awalTgl||'', awalJam: t.awalJam||'08:00',
    akhirTgl: t.akhirTgl||'', akhirJam: t.akhirJam||'15:00',
    ket: t.ket||''
  };
}
let jpState = null;
let jpEditId = null;   // id data jadwal tersimpan yang sedang diubah (null = jadwal baru)
function jpBlankState(){
  return {
    namaPekerjaan:'', lokasi:'', nilai:'', noAnggaran:'', tglAnggaran:'', jenisAnggaran:'', metode:'',
    tglMulai:'', jamMulai:'08:00', profilName:'',
    profilLoaded:false,
    tahapan: JP_DEFAULT_TAHAPAN.map(t=>Object.assign({}, t))
  };
}
/* Ubah data tersimpan (records_jadwal) menjadi jpState siap-pakai */
function jpRecordToState(rec){
  const base=jpBlankState();
  const s=(rec && rec.state && typeof rec.state==='object') ? rec.state : {};
  const tahapan = jpMigrateTahapan(s, rec, base);
  const t0 = tahapan[0] || {};
  return {
    namaPekerjaan: s.namaPekerjaan || rec.nama_pekerjaan || '',
    lokasi: s.lokasi || '',
    nilai: (s.nilai!=null? s.nilai : ''),
    noAnggaran: s.noAnggaran || '',
    tglAnggaran: s.tglAnggaran || '',
    jenisAnggaran: s.jenisAnggaran || '',
    metode: s.metode || '',
    // Titik mulai: pakai nilai tersimpan, atau warisi dari Awal tahapan pertama (data lama)
    tglMulai: s.tglMulai || t0.awalTgl || '',
    jamMulai: s.jamMulai || t0.awalJam || '08:00',
    profilName: s.profilName || '',
    profilLoaded: false,
    tahapan: tahapan
  };
}
/* Data jadwal versi lama menyimpan durasi (hari/jam/menit) + tglMulai/jam kerja.
   Konversi sekali ke bentuk baru: tiap tahapan punya Awal & Akhir sendiri. */
function jpMigrateTahapan(s, rec, base){
  const arr = (Array.isArray(s.tahapan) && s.tahapan.length) ? s.tahapan : null;
  if(!arr) return base.tahapan;
  const sudahBaru = arr.some(t=>t && (t.awalTgl || t.akhirTgl));
  if(sudahBaru) return arr.map(jpTahapNorm);
  const tglMulai = s.tglMulai || (rec && rec.tgl_mulai) || '';
  const punyaDurasi = arr.some(t=>t && (t.hari!=null || t.jam!=null || t.menit!=null));
  if(!tglMulai || !punyaDurasi) return arr.map(jpTahapNorm);
  // hitung ulang memakai algoritma lama, lalu simpan hasilnya sebagai tanggal/jam
  const jkm = s.jamKerjaMulai || '08:00', jks = s.jamKerjaSelesai || '15:00';
  let cur = jpEnsureWorkStart(jpCombine(tglMulai, s.jamMulai || '08:00'));
  return arr.map(t=>{
    const awal = new Date(cur);
    const akhir = jpAddDurasi(awal, t.hari, t.jam, t.menit, jkm, jks);
    cur = new Date(akhir);
    return jpTahapNorm({
      nama: t.nama, ket: t.ket,
      awalTgl: hlToISO(awal),  awalJam: jpFmtJam(awal),
      akhirTgl: hlToISO(akhir), akhirJam: jpFmtJam(akhir)
    });
  });
}
/* editId diisi bila membuka jadwal yang sudah tersimpan (dari Lihat Jadwal / tombol Ubah) */
function openJadwalKerja(editId){
  refreshHariLibur().then(()=>{
    if(editId){
      const rec=(records_jadwal||[]).find(r=>String(r.id)===String(editId));
      jpEditId = rec ? rec.id : null;
      jpState = rec ? jpRecordToState(rec) : jpBlankState();
    }else{
      /* Input baru: selalu mulai bersih -> tanpa pilihan pekerjaan & tanpa profil */
      jpEditId = null;
      jpState = jpBlankState();
      resetInputBaru('jadwal');
    }
    showView('jadwal-kerja');
  });
}

/* ---- Util tanggal & jam kerja (memakai hlParseISO/hlDayStatus dari modul Hari Libur) ---- */
function jpTimeToMin(t){ const p=String(t||'0:0').split(':'); return (Number(p[0])||0)*60+(Number(p[1])||0); }
function jpCombine(dateStr, timeStr){
  const d=hlParseISO(dateStr); const p=String(timeStr||'0:0').split(':');
  d.setHours(Number(p[0])||0, Number(p[1])||0, 0, 0); return d;
}
function jpIsWorkDay(d){ return hlDayStatus(d).kerja; }
function jpNextWorkDay(d){ const r=new Date(d); do{ r.setDate(r.getDate()+1); }while(!jpIsWorkDay(r)); return r; }
function jpEnsureWorkStart(d){ let r=new Date(d); while(!jpIsWorkDay(r)) r.setDate(r.getDate()+1); return r; }
function jpAddDurasi(start, hari, jam, menit, jamKerjaMulai, jamKerjaSelesai){
  let cur=new Date(start);
  for(let i=0;i<(Number(hari)||0);i++) cur=jpNextWorkDay(cur);
  let remain=(Number(jam)||0)*60+(Number(menit)||0);
  const mulMin=jpTimeToMin(jamKerjaMulai), selMin=jpTimeToMin(jamKerjaSelesai);
  let guard=0;
  while(remain>0 && guard<5000){
    guard++;
    const curMin=cur.getHours()*60+cur.getMinutes();
    const avail=Math.max(0, selMin-curMin);
    if(remain<=avail){ cur=new Date(cur.getTime()+remain*60000); remain=0; }
    else{
      remain-=avail;
      cur=jpNextWorkDay(cur);
      cur.setHours(Math.floor(mulMin/60), mulMin%60, 0, 0);
    }
  }
  return cur;
}
function jpFmtDurasi(hari,jam,menit){
  const p=[]; if(hari) p.push(hari+' Hari'); if(jam) p.push(jam+' Jam'); if(menit) p.push(menit+' Menit');
  return p.length ? p.join(' ') : '0 Jam';
}
function jpFmtDT(d){
  if(!d) return '-';
  const pad=n=>String(n).padStart(2,'0');
  return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear()+'  '+pad(d.getHours())+':'+pad(d.getMinutes());
}
function jpFmtJam(d){ const pad=n=>String(n).padStart(2,'0'); return pad(d.getHours())+':'+pad(d.getMinutes()); }
/* ---- Util hari kerja (melompati Sabtu/Minggu & hari libur nasional) ---- */
function jpDateOnly(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function jpSameDate(a,b){ return a && b && jpDateOnly(a).getTime()===jpDateOnly(b).getTime(); }
/* Maju/mundur n hari kerja dari d (jam dipertahankan). n=0 -> tanggal sama.
   n negatif = mundur (dipakai profil untuk tahapan yang tumpang tindih). */
function jpAddWorkDays(d, n){
  const r=new Date(d); n=Number(n)||0; let sisa=Math.abs(n), arah=n<0?-1:1, guard=0;
  while(sisa>0 && guard<3000){ guard++; do{ r.setDate(r.getDate()+arah); }while(!jpIsWorkDay(r)); sisa--; }
  return r;
}
/* Berapa langkah hari kerja dari a ke b (tanggal saja).
   Hasil NEGATIF bila b sebelum a — agar jarak mundur/tumpang tindih ikut terekam. */
function jpWorkDaysBetween(a, b){
  if(!a || !b) return 0;
  let cur=jpDateOnly(a); const end=jpDateOnly(b); let n=0, guard=0;
  if(end.getTime() >= cur.getTime()){
    while(cur.getTime() < end.getTime() && guard<3000){ guard++; do{ cur.setDate(cur.getDate()+1); }while(!jpIsWorkDay(cur)); n++; }
    return n;
  }
  while(cur.getTime() > end.getTime() && guard<3000){ guard++; do{ cur.setDate(cur.getDate()-1); }while(!jpIsWorkDay(cur)); n--; }
  return n;
}
/* Format tanggal panjang: 10 Juli 2026 */
function jpFmtTglPanjang(d){ if(!d) return '—'; return d.getDate()+' '+(PNW_BULAN[d.getMonth()]||'')+' '+d.getFullYear(); }
/* Selisih dua tanggal -> {hari,jam,menit} (durasi kalender) */
function jpDiffDurasi(a, b){
  if(!a || !b) return null;
  let ms = b.getTime() - a.getTime(); if(ms<0) ms=0;
  const menitTotal = Math.round(ms/60000);
  return { hari: Math.floor(menitTotal/1440), jam: Math.floor((menitTotal%1440)/60), menit: menitTotal%60 };
}
function jpDTLocal(d){
  const pad=n=>String(n).padStart(2,'0');
  return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());
}
/* Hitung Awal/Akhir semua tahapan berdasarkan jpState saat ini */
function jpCompute(){
  const st=jpState; if(!st || !Array.isArray(st.tahapan)) return [];
  return st.tahapan.map(t=>{
    const awal  = t.awalTgl  ? jpCombine(t.awalTgl,  t.awalJam  || '00:00') : null;
    const akhir = t.akhirTgl ? jpCombine(t.akhirTgl, t.akhirJam || '00:00') : null;
    const d = jpDiffDurasi(awal, akhir);
    return Object.assign({}, t, {awal, akhir, hari:d?d.hari:0, jam:d?d.jam:0, menit:d?d.menit:0});
  });
}
/* Ada minimal satu tahapan dengan Awal & Akhir terisi? */
function jpAdaJadwal(){ return jpCompute().some(r=>r.awal && r.akhir); }

/* ---- Render halaman (form + tabel tahapan yang bisa diedit langsung) ---- */
function renderJadwalKerja(){
  const cont=document.getElementById('jk-content'); if(!cont) return;
  if(!jpState) jpState=jpBlankState();
  const st=jpState, rows=jpCompute();

  const bodyRows = st.tahapan.map((t,i)=>{
    const r = rows[i] || {awal:null, akhir:null};
    const hasKet = !!(t.ket && t.ket.trim());
    return '<tr class="'+(hasKet?'jp-row-hi':'')+'">'+
      '<td class="col-no">'+(i+1)+'</td>'+
      '<td><input type="text" class="jp-in-nama" value="'+fkEsc(t.nama)+'" oninput="jpSetTahap('+i+',\'nama\',this.value)"></td>'+
      '<td class="jp-dt">'+
        '<input type="date" class="jp-dt-tgl" value="'+fkEsc(t.awalTgl||'')+'" onchange="jpSetTahap('+i+',\'awalTgl\',this.value)">'+
        '<input type="time" class="jp-dt-jam" value="'+fkEsc(t.awalJam||'')+'" onchange="jpSetTahap('+i+',\'awalJam\',this.value)">'+
      '</td>'+
      '<td class="jp-dt">'+
        '<input type="date" class="jp-dt-tgl" value="'+fkEsc(t.akhirTgl||'')+'" onchange="jpSetTahap('+i+',\'akhirTgl\',this.value)">'+
        '<input type="time" class="jp-dt-jam" value="'+fkEsc(t.akhirJam||'')+'" onchange="jpSetTahap('+i+',\'akhirJam\',this.value)">'+
      '</td>'+
      '<td><input type="text" class="jp-in-ket" value="'+fkEsc(t.ket)+'" oninput="jpSetTahap('+i+',\'ket\',this.value)" placeholder="Keterangan (opsional)"></td>'+
      '<td class="jp-aksi">'+
        '<button type="button" title="Naik" onclick="jpMoveTahap('+i+',-1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 15l-6-6-6 6"/></svg></button>'+
        '<button type="button" title="Turun" onclick="jpMoveTahap('+i+',1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg></button>'+
        '<button type="button" title="Hapus" onclick="jpDelTahap('+i+')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>'+
      '</td>'+
    '</tr>';
  }).join('');

  // Kartu ringkasan: Rencana Terkontrak | Durasi Pengadaan | Aksi Profil Jadwal
  const awalSemua = rows.map(r=>r.awal).filter(Boolean);
  const akhirSemua = rows.map(r=>r.akhir).filter(Boolean);
  const mulai  = awalSemua.length  ? new Date(Math.min.apply(null, awalSemua.map(d=>d.getTime())))  : null;
  const selesai= akhirSemua.length ? new Date(Math.max.apply(null, akhirSemua.map(d=>d.getTime()))) : null;
  const totDur = jpDiffDurasi(mulai, selesai);
  const btnBatal = st.profilLoaded
    ? '<button type="button" class="jp-profil-btn is-cancel" title="Batalkan Profil" onclick="jpProfilCancel()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6 6 18M6 6l12 12"/></svg><span>Profil</span></button>'
    : '';
  const summaryHtml = ''+
    '<div class="jp-summary">'+
      '<div class="jp-summary-card"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg></div><div class="txt"><b>'+(selesai?fkEsc(jpFmtTglPanjang(selesai)):'—')+'</b><span>Rencana Terkontrak</span></div></div>'+
      '<div class="jp-summary-card"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg></div><div class="txt"><b>'+(totDur?fkEsc(jpFmtDurasi(totDur.hari,totDur.jam,totDur.menit)):'0 Jam')+'</b><span>Durasi Pengadaan</span></div></div>'+
      '<div class="jp-summary-card jp-profil-card">'+
        '<button type="button" class="jp-profil-btn is-save" title="Simpan Profil" onclick="jpProfilOpenSave()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg><span>Profil</span></button>'+
        '<button type="button" class="jp-profil-btn is-load" title="Muat Profil" onclick="jpProfilOpenLoad()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg><span>Profil</span></button>'+
        btnBatal+
      '</div>'+
    '</div>';

  cont.innerHTML = ''+
    '<div class="form-card">'+
      '<div class="form-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M4 4h5l2 3h9a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg> Data Pekerjaan'+dpPickBtnHtml('jadwal')+'</div>'+
      '<div class="form-flow" style="--cols:4">'+
        '<div class="field'+(st.dpId?' is-locked':'')+'" style="grid-column:span 4"><label>Nama Pekerjaan</label><input type="text" value="'+fkEsc(st.namaPekerjaan)+'"'+(st.dpId?' disabled':'')+' oninput="jpSet(\'namaPekerjaan\',this.value)"></div>'+
        '<div class="field'+(st.dpId?' is-locked':'')+'" style="grid-column:span 2"><label>Lokasi Pekerjaan</label><input type="text" value="'+fkEsc(st.lokasi||'')+'"'+(st.dpId?' disabled':'')+' onchange="jpSet(\'lokasi\',this.value)"></div>'+
        '<div class="field'+(st.dpId?' is-locked':'')+'"><label>Nilai Pekerjaan</label><input type="text" inputmode="numeric" placeholder="Rp" value="'+rupiahInputText(st.nilai)+'"'+(st.dpId?' disabled':'')+' oninput="onRupiahInput(this)" onchange="jpSetNilai(this)"></div>'+
        '<div class="field'+(st.dpId?' is-locked':'')+'"><label>No. Anggaran</label><input type="text" value="'+fkEsc(st.noAnggaran||'')+'"'+(st.dpId?' disabled':'')+' onchange="jpSet(\'noAnggaran\',this.value)"></div>'+
        '<div class="field'+(st.dpId?' is-locked':'')+'"><label>Tgl. Anggaran</label><input type="date" value="'+fkEsc(st.tglAnggaran||'')+'"'+(st.dpId?' disabled':'')+' onchange="jpSet(\'tglAnggaran\',this.value)"></div>'+
        '<div class="field'+(st.dpId?' is-locked':'')+'"><label>Jenis Anggaran</label><select'+(st.dpId?' disabled':'')+' onchange="jpSet(\'jenisAnggaran\',this.value)"><option value="">— Pilih —</option>'+FKL_JENIS_ANGGARAN.map(o=>'<option'+(st.jenisAnggaran===o?' selected':'')+'>'+fkEsc(o)+'</option>').join('')+'</select></div>'+
        '<div class="field'+(st.dpId?' is-locked':'')+'" style="grid-column:span 2"><label>Metode Pengadaan</label><select'+(st.dpId?' disabled':'')+' onchange="jpSet(\'metode\',this.value)"><option value="">— Pilih —</option>'+FKL_METODE.map(o=>'<option'+(st.metode===o?' selected':'')+'>'+fkEsc(o)+'</option>').join('')+'</select></div>'+
      '</div>'+
      '<div class="jp-start-row">'+
        '<div class="jp-start-lead"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/></svg> Titik Mulai Jadwal <span class="tag">Mengisi Awal tahapan pertama</span></div>'+
        '<div class="jp-start-field"><label>Tanggal Mulai</label><input type="date" value="'+fkEsc(st.tglMulai||'')+'" onchange="jpSetMulai(\'tglMulai\',this.value)"></div>'+
        '<div class="jp-start-field"><label>Jam Mulai</label><input type="time" value="'+fkEsc(st.jamMulai||'08:00')+'" onchange="jpSetMulai(\'jamMulai\',this.value)"></div>'+
        '<div class="jp-start-hint">Tanggal &amp; jam ini otomatis menjadi <b>Awal tahapan pertama</b>. Setelah terisi, klik <b>Muat Profil</b> agar seluruh jadwal tersusun otomatis — durasi &amp; hubungan antar tahapan mengikuti profil tersimpan, Sabtu/Minggu &amp; hari libur nasional otomatis dilewati. Bila sebuah profil sedang aktif, mengubah titik mulai langsung menghitung ulang seluruh jadwal.</div>'+
      '</div>'+
    '</div>'+
    summaryHtml+
    '<div class="panel" style="margin-top:16px">'+
      '<div class="table-wrap"><table class="jp-table">'+
        '<thead><tr><th class="col-no">No</th><th>Tahapan Pengadaan</th><th>Awal</th><th>Akhir</th><th>Keterangan</th><th style="width:104px">Aksi</th></tr></thead>'+
        '<tbody>'+bodyRows+'</tbody>'+
      '</table></div>'+
      '<div class="jp-actions">'+
        '<button class="btn btn-teal" onclick="jpAddTahap()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Tambah Tahapan</button>'+
        '<button class="btn btn-green" onclick="jpSaveRecord()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg> '+(jpEditId?'Simpan Perubahan':'Simpan Jadwal')+'</button>'+
        '<button class="btn btn-red" onclick="jpBatalClick()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg> Batal</button>'+
      '</div>'+
    '</div>';
}
function jpSet(key, val){ jpState[key]=val; renderJadwalKerja(); }
function jpSetNilai(el){ jpState.nilai=parseRupiah(el.value); }
function jpSetTahap(i, key, val){
  jpState.tahapan[i][key]=val;
  // Awal tahapan pertama <-> field Titik Mulai selalu selaras
  if(i===0 && key==='awalTgl') jpState.tglMulai=val;
  if(i===0 && key==='awalJam') jpState.jamMulai=val;
  renderJadwalKerja();
}
/* Titik Mulai Jadwal: mengisi Awal tahapan pertama; bila profil aktif -> hitung ulang semua */
function jpSetMulai(key, val){
  jpState[key]=val;
  if(jpState.tahapan && jpState.tahapan.length){
    if(key==='tglMulai') jpState.tahapan[0].awalTgl = val;
    if(key==='jamMulai') jpState.tahapan[0].awalJam = val;
  }
  if(jpState.profilLoaded && jpState.profilName && jpState.tglMulai){
    jpApplyProfil(jpState.profilName, {silent:true});   // sudah memanggil renderJadwalKerja()
  }else{
    renderJadwalKerja();
  }
}
function jpAddTahap(){ jpState.tahapan.push(jpTahapNorm({nama:'Tahapan Baru'})); renderJadwalKerja(); }
function jpDelTahap(i){
  if(jpState.tahapan.length<=1){ toast('Minimal harus ada 1 tahapan','warn'); return; }
  jpState.tahapan.splice(i,1); renderJadwalKerja();
}
function jpMoveTahap(i, dir){
  const j=i+dir; if(j<0 || j>=jpState.tahapan.length) return;
  const arr=jpState.tahapan; const tmp=arr[i]; arr[i]=arr[j]; arr[j]=tmp;
  renderJadwalKerja();
}

/* ================= PROFIL JADWAL (Simpan / Muat / Batalkan) =================
   Yang disimpan pada tiap tahapan HANYA: nama, Jam Awal, dan Durasi (Hari/Jam/Menit).
   Tanggal tidak ikut tersimpan — saat profil dimuat, tanggal dihitung ulang
   berurutan mulai dari Awal tahapan pertama yang sedang aktif. Disimpan di
   localStorage browser, terpisah dari data jadwal di Supabase. */
const JP_PROFIL_KEY='jp_jadwal_profiles_v1';
/* Profil Jadwal kini tersimpan di Supabase (cache: profileCache.jadwal). */
function jpProfilAll(){ return profilesGet('jadwal'); }
/* Snapshot profil = SIFAT jadwal, bukan tanggal mati. Tiap tahapan merekam:
   - nama & keterangan
   - awalJam (jam mulai tahapan)
   - awalRel: hubungan TANGGAL AWAL terhadap tahapan sebelumnya
       'anchor' : tahapan pertama (jadi titik acuan)
       'awal'   : tanggal awalnya SAMA dengan tanggal awal tahapan sebelumnya
                  (mis. Undangan & Pendaftaran mulai di tanggal yang sama)
       'akhir'  : tanggal awalnya SAMA dengan tanggal akhir tahapan sebelumnya (nyambung)
       'offset' : awalOffset hari kerja SETELAH akhir tahapan sebelumnya
   - hariKerja : jumlah hari kerja dari Awal ke Akhir tahapan itu
   - menitOffset: selisih jam pada hari yang sama (mis. 08:00->12:00 = 240 menit).
     Boleh negatif bila jam akhir lebih awal dari jam mulai.
   Dengan cara ini, "akhir Pendaftaran = 1 hari kerja sebelum akhir Upload Dokumen"
   ikut terekam sebagai: Upload mulai di akhir Pendaftaran, durasi 1 hari kerja. */
function jpProfilSnapshot(){
  const rows=jpCompute();
  const tahapan = rows.map((r,i)=>{
    const t={ nama:r.nama||'', ket:r.ket||'', awalJam:r.awalJam||'08:00', akhirJam:'', awalRel:'anchor', awalOffset:0, hariKerja:0, menitOffset:0 };
    if(r.awal && r.akhir){
      t.hariKerja = jpWorkDaysBetween(r.awal, r.akhir);
      t.akhirJam  = jpFmtJam(r.akhir);          /* Jam Akhir eksplisit — dibaca semua */
      const base = jpAddWorkDays(r.awal, t.hariKerja);
      t.menitOffset = Math.round((r.akhir.getTime() - base.getTime())/60000);
    }
    const prev = i>0 ? rows[i-1] : null;
    if(prev && r.awal){
      if(jpSameDate(r.awal, prev.awal))       t.awalRel='awal';
      else if(jpSameDate(r.awal, prev.akhir)) t.awalRel='akhir';
      else if(prev.akhir){ t.awalRel='offset'; t.awalOffset=jpWorkDaysBetween(prev.akhir, r.awal); }
      else t.awalRel='akhir';
    }else if(i>0){ t.awalRel='akhir'; }
    return t;
  });
  return { tahapan };
}
function jpProfilOverlay(inner){
  let ov=document.getElementById('pnw-profil-ov');
  if(!ov){ ov=document.createElement('div'); ov.id='pnw-profil-ov'; ov.className='pnw-profil-ov'; document.body.appendChild(ov); }
  ov.onclick=(e)=>{ if(e.target===ov) jpProfilClose(); };
  ov.innerHTML='<div class="pnw-profil-modal" role="dialog">'+inner+'</div>'; ov.style.display='flex';
}
function jpProfilClose(){ const ov=document.getElementById('pnw-profil-ov'); if(ov) ov.style.display='none'; }
function jpProfilOpenSave(){
  if(!jpState || !jpState.tahapan.length){ toast('Belum ada tahapan untuk disimpan','warn'); return; }
  const snap=jpProfilSnapshot(); const cnt=snap.tahapan.length;
  const list=jpProfilAll();
  const existing = list.length ? ('<div class="pnw-profil-existing">Profil tersimpan: '+list.map(p=>fkEsc(p.name)).join(' &middot; ')+'</div>') : '';
  jpProfilOverlay(
    '<div class="pnw-profil-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>Simpan Profil Jadwal</div>'+
    '<div class="pnw-profil-sub">Menyimpan <b>'+cnt+'</b> Tahapan Pengadaan dan membaca <b>semua</b> sifat jadwalnya: durasi Awal\u2192Akhir tiap tahapan (dalam <b>hari kerja</b>), jarak tanggal antar tahapan (menyambung / mulai bersamaan / berjarak N hari kerja, termasuk tumpang tindih), serta <b>Jam Awal</b> dan <b>Jam Akhir</b> setiap tahapan. Tanggal mati tidak ikut tersimpan \u2014 saat dimuat, semuanya dihitung ulang dari Titik Mulai.</div>'+
    '<input id="jp-profil-name" class="pnw-profil-input" type="text" placeholder="Nama profil (mis. Pengadaan Langsung Standar)" maxlength="60" onkeydown="if(event.key===\'Enter\')jpProfilDoSave()">'+
    existing+
    '<div class="pnw-profil-actions"><button type="button" class="btn btn-ghost" onclick="jpProfilClose()">Batal</button>'+
    '<button type="button" class="btn btn-teal" onclick="jpProfilDoSave()">Simpan Profil</button></div>'
  );
  setTimeout(()=>{ const el=document.getElementById('jp-profil-name'); if(el) el.focus(); },60);
}
async function jpProfilDoSave(){
  const el=document.getElementById('jp-profil-name'); const name=(el&&el.value||'').trim();
  if(!name){ toast('Isi nama profil dulu','warn'); if(el) el.focus(); return; }
  const snap=jpProfilSnapshot();
  snap.name=name; snap.savedAt=Date.now(); snap.count=snap.tahapan.length;
  if(await profilesUpsert('jadwal', snap)){ toast('Profil "'+name+'" tersimpan','ok'); jpProfilClose(); }
}
function jpProfilOpenLoad(){
  const list=jpProfilAll();
  if(!list.length){ toast('Belum ada profil. Simpan dulu lewat tombol "Simpan Profil".','warn'); return; }
  const items=list.slice().sort((a,b)=>(b.savedAt||0)-(a.savedAt||0)).map(p=>
    '<div class="pnw-profil-item"><div class="pnw-profil-item-info"><div class="pnw-profil-item-name">'+fkEsc(p.name)+'</div>'+
    '<div class="pnw-profil-item-meta">'+(p.count||0)+' tahapan</div></div>'+
    '<div class="pnw-profil-item-btns">'+profilActionBtns('jadwal',p.name)+'</div></div>'
  ).join('');
  jpProfilOverlay(
    '<div class="pnw-profil-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 11v6M9 14h6"/></svg>Muat Profil Jadwal'+profilUploadBtnHtml('jadwal')+'</div>'+
    '<div class="pnw-profil-sub">Tanggal dihitung ulang dari <b>Titik Mulai</b>, mengikuti sifat yang terekam (hari kerja, Sabtu/Minggu &amp; hari libur dilompati). <b>Jam bergeser relatif</b> mengikuti Jam Mulai \u2014 durasi jam tiap tahapan tetap (mendukung selisih zona WIB/WIT). <b>Isian saat ini akan diganti.</b></div>'+
    '<div class="pnw-profil-list">'+items+'</div>'+
    '<div class="pnw-profil-actions"><button type="button" class="btn btn-ghost" onclick="jpProfilClose()">Tutup</button></div>'
  );
}
async function jpProfilDoDelete(name){
  if(await profilesDelete('jadwal', name)){ toast('Profil "'+name+'" dihapus','ok'); if(jpProfilAll().length) jpProfilOpenLoad(); else jpProfilClose(); }
}
/* Terapkan profil: rekonstruksi tanggal dari SIFAT yang terekam.
   Titik acuan = tanggal Awal tahapan pertama yang sedang aktif di layar. */
/* Inti penerapan profil: rekonstruksi tanggal dari SIFAT yang terekam.
   Titik acuan = Tanggal/Jam Mulai (bila diisi), atau Awal tahapan pertama yang aktif.
   opts.silent=true -> tanpa toast/tutup modal (dipakai saat titik mulai diubah). */
function jpApplyProfil(name, opts){
  opts=opts||{};
  const p=jpProfilAll().find(x=>String(x.name)===String(name));
  if(!p || !Array.isArray(p.tahapan) || !p.tahapan.length){ if(!opts.silent) toast('Profil tidak ditemukan','warn'); return false; }
  const lama=jpState.tahapan||[];
  const tglAnchor = jpState.tglMulai || (lama[0] && lama[0].awalTgl) || '';
  const jamAnchor = jpState.jamMulai || (p.tahapan[0] && p.tahapan[0].awalJam) || '08:00';
  const jamProfil0 = (p.tahapan[0] && p.tahapan[0].awalJam) || '08:00';
  /* Pergeseran jam RELATIF (dukungan WIB/WIT): selisih Jam Mulai baru terhadap
     jam awal tahap pertama yang terekam diterapkan ke SEMUA jam awal & akhir,
     sehingga DURASI JAM tiap tahapan tetap. Contoh: profil dibuat 08:00-15:00
     (7 jam); dimuat dengan Jam Mulai 10:00 -> menjadi 10:00-17:00, dan tahap
     berikutnya yang terekam mulai 08:00 ikut menjadi 10:00. */
  const deltaMenit = jpTimeToMin(jamAnchor) - jpTimeToMin(jamProfil0);
  const hasil=[]; let prevAwal=null, prevAkhir=null;
  p.tahapan.forEach((t,i)=>{
    const jam = (i===0) ? jamProfil0 : (t.awalJam || '08:00');   // jam terekam; digeser deltaMenit di bawah
    // profil format lama (hari/jam/menit kalender) -> konversi seadanya
    const hariKerja   = (t.hariKerja!=null)   ? Number(t.hariKerja)   : Number(t.hari||0);
    const menitOffset = (t.menitOffset!=null) ? Number(t.menitOffset) : ((Number(t.jam)||0)*60 + (Number(t.menit)||0));
    if(!tglAnchor){                       // belum ada tanggal acuan -> hanya nama, keterangan & jam
      hasil.push(jpTahapNorm({nama:t.nama, ket:t.ket, awalJam:jam}));
      return;
    }
    // 1) tentukan TANGGAL awal berdasarkan relasi ke tahapan sebelumnya
    let awal;
    if(i===0 || !prevAwal){
      awal = jpCombine(tglAnchor, jam);
    }else if(t.awalRel==='awal'){
      awal = jpCombine(hlToISO(prevAwal), jam);                         // mulai bareng tahap sebelumnya
    }else if(t.awalRel==='offset'){
      awal = jpCombine(hlToISO(jpAddWorkDays(prevAkhir, t.awalOffset||0)), jam);
    }else{                                                              // 'akhir' (default): nyambung
      awal = jpCombine(hlToISO(prevAkhir), jam);
    }
    awal = jpEnsureWorkStart(awal);                                     // jangan jatuh di libur
    if(deltaMenit) awal.setMinutes(awal.getMinutes()+deltaMenit);           // geser jam relatif (WIB/WIT)
    // 2) akhir = maju N hari kerja, lalu pasang Jam Akhir yang terekam
    //    (profil lama tanpa akhirJam: geser memakai selisih menit)
    const akhir = jpAddWorkDays(awal, hariKerja);
    if(t.akhirJam){
      const ja=String(t.akhirJam).split(':');
      akhir.setHours(Number(ja[0])||0, Number(ja[1])||0, 0, 0);
      if(deltaMenit) akhir.setMinutes(akhir.getMinutes()+deltaMenit);       // durasi jam dipertahankan
    }else{
      akhir.setMinutes(akhir.getMinutes() + menitOffset);
    }
    prevAwal=new Date(awal); prevAkhir=new Date(akhir);
    hasil.push(jpTahapNorm({
      nama:t.nama, ket:t.ket, awalJam:jpFmtJam(awal),
      awalTgl: hlToISO(awal),
      akhirTgl: hlToISO(akhir), akhirJam: jpFmtJam(akhir)
    }));
  });
  jpState.tahapan = hasil;
  jpState.profilLoaded = true;   // tombol "Batalkan Profil" muncul
  jpState.profilName = name;     // diingat agar perubahan titik mulai bisa hitung ulang
  // selaraskan field Titik Mulai dengan hasil tahap pertama
  if(hasil[0]){ if(hasil[0].awalTgl) jpState.tglMulai=hasil[0].awalTgl; if(hasil[0].awalJam) jpState.jamMulai=hasil[0].awalJam; }
  renderJadwalKerja();
  return true;
}
function jpProfilDoLoad(name){
  if(jpApplyProfil(name, {silent:false})){
    jpProfilClose();
    if(!jpState.tglMulai){
      toast('Profil "'+name+'" dimuat — isi Tanggal & Jam Mulai agar tanggal tiap tahapan otomatis terhitung','warn');
    }else{
      toast('Profil "'+name+'" dimuat','ok');
    }
  }
}
/* Batalkan profil: tahapan kembali ke daftar default (titik mulai dipertahankan) */
function jpProfilCancel(){
  jpState.tahapan = JP_DEFAULT_TAHAPAN.map(t=>Object.assign({}, t));
  jpState.profilLoaded = false;  // tombol ikut hilang
  jpState.profilName = '';
  // pertahankan titik mulai pada Awal tahapan pertama default
  if(jpState.tahapan[0]){
    if(jpState.tglMulai) jpState.tahapan[0].awalTgl = jpState.tglMulai;
    if(jpState.jamMulai) jpState.tahapan[0].awalJam = jpState.jamMulai;
  }
  renderJadwalKerja();
  toast('Profil dibatalkan — tahapan dikembalikan ke default','ok');
}

/* ---- Cetak / PDF (dokumen mandiri bertema sama, meniru gaya tabel jadwal tahapan pengadaan) ---- */
function jpExtraDocCss(){
  return ''+
  '.jp-doc-nama{font-weight:800;font-size:12px;color:#0d2a30;margin-bottom:8px}'+
  '.jp-doc-wrap{margin:2px 0 8px}'+
  'table.jp-doc-tbl{width:100%;border-collapse:collapse;margin:0;border:1.5px solid #0b6a73}'+
  'table.jp-doc-tbl th,table.jp-doc-tbl td{border:1px solid #7d979c;padding:6px 9px;font-size:11px;line-height:1.35;vertical-align:middle}'+
  'table.jp-doc-tbl thead th{background:#0E7C86;color:#fff;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:0;border-color:#5aa8ae;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  'table.jp-doc-tbl thead th:first-child{border-left-color:#0E7C86}'+
  'table.jp-doc-tbl thead th:last-child{border-right-color:#0E7C86}'+
  'table.jp-doc-tbl thead tr:last-child th{border-bottom:1.5px solid #0b6a73}'+
  'table.jp-doc-tbl td.no,table.jp-doc-tbl td.awal,table.jp-doc-tbl td.akhir,table.jp-doc-tbl td.durasi{text-align:center;white-space:nowrap}'+
  'table.jp-doc-tbl tr.hi td{background:#f2ecd9;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  /* Tabel ringkasan (poin C): Durasi Pengadaan & Rencana Terkontrak */
  'table.jp-doc-sum{width:100%;border-collapse:collapse;margin:0;border:1.5px solid #0b6a73}'+
  'table.jp-doc-sum th,table.jp-doc-sum td{border:1px solid #7d979c;padding:6px 10px;font-size:11px;line-height:1.35;vertical-align:middle}'+
  'table.jp-doc-sum thead th{background:#0E7C86;color:#fff;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:0;border-color:#5aa8ae;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  'table.jp-doc-sum thead th:first-child{border-left-color:#0E7C86}'+
  'table.jp-doc-sum thead th:last-child{border-right-color:#0E7C86}'+
  'table.jp-doc-sum thead tr:last-child th{border-bottom:1.5px solid #0b6a73}'+
  'table.jp-doc-sum td.lbl{width:38%;font-weight:700;color:#0d2a30;background:#f6fafb;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  'table.jp-doc-sum td.val{text-align:center;font-weight:700;color:#0b3d42;white-space:nowrap}';
}
/* Isi dokumen Jadwal (dipakai pratinjau, cetak, & Rekap HPS lewat shell bersama) */
function jpBuildDocHtml(){
  const st=jpState; const rows=jpCompute();
  /* Blok Data Pekerjaan — gaya sama seperti dokumen pada menu Harga Perkiraan Sendiri */
  const fmtNilai=(st.nilai!==''&&st.nilai!=null)?('Rp '+Number(st.nilai).toLocaleString('id-ID')):'-';
  const infoRow=(k,v)=>'<tr><td class="k">'+k+'</td><td class="s">:</td><td class="v" style="text-align:justify">'+fkEsc(v||'-')+'</td></tr>';
  /* Ringkasan (poin C) — logika sama persis dengan kartu ringkasan di form:
     Rencana Terkontrak = Akhir tahapan terakhir; Durasi Pengadaan = selisih Awal
     tahapan pertama s.d. Akhir tahapan terakhir. */
  const awalSemua = rows.map(r=>r.awal).filter(Boolean);
  const akhirSemua = rows.map(r=>r.akhir).filter(Boolean);
  const mulai   = awalSemua.length  ? new Date(Math.min.apply(null, awalSemua.map(d=>d.getTime())))  : null;
  const selesai = akhirSemua.length ? new Date(Math.max.apply(null, akhirSemua.map(d=>d.getTime()))) : null;
  const totDur  = jpDiffDurasi(mulai, selesai);
  const durasiText = totDur ? jpFmtDurasi(totDur.hari, totDur.jam, totDur.menit) : '0 Jam';
  const terkontrakText = selesai ? jpFmtTglPanjang(selesai) : '—';
  const body=rows.map((r,i)=>{
    const hasKet=!!(r.ket && r.ket.trim());
    return '<tr'+(hasKet?' class="hi"':'')+'>'+
      '<td class="no">'+(i+1)+'</td>'+
      '<td class="nm">'+fkEsc(r.nama)+'</td>'+
      '<td class="awal">'+fkEsc(jpFmtDT(r.awal))+'</td>'+
      '<td class="akhir">'+fkEsc(jpFmtDT(r.akhir))+'</td>'+
      '<td class="durasi">'+fkEsc(jpFmtDurasi(r.hari,r.jam,r.menit))+'</td>'+
      '<td class="ket">'+fkEsc(r.ket||'')+'</td>'+
    '</tr>';
  }).join('');
  return ''+
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
      '<h1 class="fkl-doc-title">JADWAL PELAKSANAAN PEKERJAAN</h1>'+
      '<div class="fkl-doc-titlegap"></div>'+
      '<div class="fkl-sec-h"><span class="rn">A</span>Data Pekerjaan</div>'+
      '<table class="fkl-info"><tbody>'+
        infoRow('Nama Pekerjaan', st.namaPekerjaan)+
        infoRow('Lokasi Pekerjaan', st.lokasi)+
        infoRow('Rencana Anggaran Biaya', fmtNilai)+
        infoRow('No. Anggaran', st.noAnggaran)+
        infoRow('Tgl. Anggaran', st.tglAnggaran?pnwDateLong(st.tglAnggaran):'-')+
        infoRow('Jenis Anggaran', st.jenisAnggaran)+
        infoRow('Metode Pengadaan', st.metode)+
      '</tbody></table>'+
      '<div class="fkl-sec-h"><span class="rn">B</span>Tahapan Pengadaan</div>'+
      '<div class="jp-doc-wrap"><table class="jp-doc-tbl"><thead><tr><th class="no">No</th><th class="nm">Tahapan Pengadaan</th><th class="awal">Awal</th><th class="akhir">Akhir</th><th class="durasi">Durasi</th><th class="ket">Keterangan</th></tr></thead><tbody>'+body+'</tbody></table></div>'+
      '<div class="fkl-sec-h"><span class="rn">C</span>Durasi Pengadaan &amp; Rencana Terkontrak</div>'+
      '<div class="jp-doc-wrap"><table class="jp-doc-sum"><thead><tr><th class="lbl">Uraian</th><th class="val">Keterangan</th></tr></thead><tbody>'+
        '<tr><td class="lbl">Durasi Pengadaan</td><td class="val">'+fkEsc(durasiText)+'</td></tr>'+
        '<tr><td class="lbl">Rencana Terkontrak</td><td class="val">'+fkEsc(terkontrakText)+'</td></tr>'+
      '</tbody></table></div>'+
    '</div>';
}
function jpStandaloneDocHtml(){
  return fklDocShell(jpExtraDocCss(), jpBuildDocHtml());
}
function jpPrint(){
  if(!jpState || !jpAdaJadwal()){ toast('Isi Awal & Akhir minimal satu tahapan terlebih dahulu','warn'); return; }
  const old=document.getElementById('jp-print-frame'); if(old) old.remove();
  const ifr=document.createElement('iframe');
  ifr.id='jp-print-frame';
  ifr.setAttribute('aria-hidden','true');
  ifr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(ifr);
  const doc=ifr.contentWindow.document;
  doc.open(); doc.write(jpStandaloneDocHtml()); doc.close();
  const go=()=>fklWaitPaged(ifr, _go);
  const _go=()=>{
    withHiddenPageTitle(()=>{ try{ ifr.contentWindow.focus(); ifr.contentWindow.print(); }catch(e){ try{ window.print(); }catch(_){} } });
    setTimeout(()=>{ const f=document.getElementById('jp-print-frame'); if(f) f.remove(); }, 1500);
  };
  const imgs=doc.images ? Array.from(doc.images) : [];
  if(imgs.length){
    let n=imgs.length;
    const dec=()=>{ if(--n<=0) setTimeout(go,60); };
    imgs.forEach(im=>{ if(im.complete) dec(); else { im.onload=dec; im.onerror=dec; } });
    setTimeout(go, 1200);
  } else { setTimeout(go, 120); }
}

/* ---------- Penyimpanan Jadwal Pelaksanaan (Supabase + fallback lokal) ---------- */
const JP_TABLE='jadwal_pelaksanaan';
const JP_LS_KEY='jadwal_records_v1';
let records_jadwal=[];
let jpUseLocal=false;
function jpSupaReady(){ return !!(USE_SUPABASE && db); }
function jpLocalLoad(){ try{ const r=localStorage.getItem(JP_LS_KEY); records_jadwal=r?JSON.parse(r):[]; }catch(e){ records_jadwal=[]; } }
function jpLocalSave(){ /* dinonaktifkan: data hanya di Supabase */ }
function jpIsLocalId(id){ return String(id).indexOf('loc_')===0; }
const StoreJadwal={
  async list(){
    if(!jpSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(JP_TABLE).select('*').order('created_at',{ascending:false});
    if(error) throw error; return data||[];
  },
  async create(rec){
    if(!jpSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(JP_TABLE).insert(rec).select();
    if(error) throw error; return data&&data[0];
  },
  async update(rid, rec){
    if(!jpSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(JP_TABLE).update(rec).eq('id',rid);
    if(error) throw error;
  },
  async remove(rid){
    if(!jpSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(JP_TABLE).delete().eq('id',rid);
    if(error) throw error;
  }
};
async function refreshDataJadwal(){
  try{ records_jadwal=await StoreJadwal.list(); }
  catch(err){ console.error(err); records_jadwal=records_jadwal||[]; }
}
/* Simpan (atau perbarui) jadwal yang sedang disusun di halaman Tentukan Jadwal */
async function jpSaveRecord(){
  if(!requireInput()) return;
  if(!jpState || !String(jpState.namaPekerjaan||'').trim()){ toast('Nama Pekerjaan wajib diisi','warn'); return; }
  if(!jpAdaJadwal()){ toast('Isi Awal & Akhir minimal satu tahapan terlebih dahulu','warn'); return; }
  const rows=jpCompute();
  const awalSemua = rows.map(r=>r.awal).filter(Boolean);
  const akhirSemua = rows.map(r=>r.akhir).filter(Boolean);
  const mulaiPertama = awalSemua.length ? new Date(Math.min.apply(null, awalSemua.map(d=>d.getTime()))) : null;
  const akhirTerakhir = akhirSemua.length ? new Date(Math.max.apply(null, akhirSemua.map(d=>d.getTime()))) : null;
  const rec={
    nama_pekerjaan: (jpState.namaPekerjaan||'').trim(),
    tgl_mulai: mulaiPertama ? hlToISO(mulaiPertama) : null,
    tgl_selesai: akhirTerakhir ? hlToISO(akhirTerakhir) : null,
    jumlah_tahapan: jpState.tahapan.length,
    state: jpState
  };
  try{
    await withActionLoader('Menyimpan', async()=>{
      if(jpEditId) await StoreJadwal.update(jpEditId, rec);
      else{ const row=await StoreJadwal.create(rec); if(row) jpEditId=row.id; }
      await refreshDataJadwal();
    });
  }catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'err'); return; }
  toast('Jadwal berhasil disimpan','ok');
  // Reset form "Tentukan Jadwal" ke kondisi default agar siap untuk pengisian jadwal baru
  jpEditId = null;
  jpState = jpBlankState();
  renderJadwalKerja();
  // Alihkan otomatis ke halaman "Lihat Jadwal"
  jadwalViewPage = 1;
  showView('jadwal-view');
}

/* Tombol Batal pada Tentukan Jadwal — sama seperti form lain: minta konfirmasi,
   kosongkan isian, lalu kembali ke halaman Lihat Jadwal. */
function jpBatalClick(){
  openConfirm({
    icon:'back', title:'Batal',
    text:'Apakah anda yakin ingin membatalkan? Seluruh isian pada form Tentukan Jadwal akan dikosongkan.',
    onYes:function(){
      jpEditId=null;
      jpState=jpBlankState();
      renderJadwalKerja();
      jadwalViewPage=1;
      showView('jadwal-view');
      toast('Penyusunan jadwal dibatalkan — form dikosongkan','warn');
    }
  });
}

/* ================= LIHAT JADWAL ================= */
let jadwalViewPage=1;
const JADWAL_VIEW_PAGE_SIZE=8;
function jadwalViewRows(){
  let rows=(records_jadwal||[]).slice();
  const fs=(document.getElementById('jadwal-view-search')?.value||'').toLowerCase().trim();
  if(fs) rows=rows.filter(r=>String(r.nama_pekerjaan||'').toLowerCase().includes(fs));
  return rows;
}
function jadwalEmptyRow(){
  return '<tr><td colspan="6"><div class="empty">'+
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>'+
    '<div>Data tidak tersedia</div></div></td></tr>';
}
/* Durasi Pengadaan = rentang hari kalender dari Tgl. Mulai s.d. Rencana Terkontrak
   (inklusif kedua ujung). Dipakai menggantikan kolom "Jumlah Tahapan". */
function jadwalDurasiTxt(mulai, selesai){
  if(!mulai || !selesai) return '—';
  var a=new Date(String(mulai)+'T00:00:00'), b=new Date(String(selesai)+'T00:00:00');
  if(isNaN(a.getTime()) || isNaN(b.getTime())) return '—';
  var d=Math.round((b.getTime()-a.getTime())/86400000)+1;   // inklusif
  return d>0 ? (d+' hari') : '—';
}
/* Durasi Pengadaan lengkap (Hari + Jam + Menit) dari rentang waktu tahapan tersimpan
   — sama seperti kartu "Durasi Pengadaan" di halaman jadwal (memakai tanggal & jam).
   Awal = waktu-mulai paling awal; Akhir = waktu-akhir paling akhir.
   Fallback ke rentang hari kalender bila state/tahapan tak tersedia. */
function jadwalDurasiFull(r){
  try{
    const tah=(r && r.state && Array.isArray(r.state.tahapan)) ? r.state.tahapan : null;
    if(tah && tah.length){
      const awals=[], akhirs=[];
      tah.forEach(t=>{
        if(t && t.awalTgl){ const d=jpCombine(t.awalTgl, t.awalJam||'00:00'); if(d && !isNaN(d.getTime())) awals.push(d.getTime()); }
        if(t && t.akhirTgl){ const d=jpCombine(t.akhirTgl, t.akhirJam||'00:00'); if(d && !isNaN(d.getTime())) akhirs.push(d.getTime()); }
      });
      if(awals.length && akhirs.length){
        const dur=jpDiffDurasi(new Date(Math.min.apply(null,awals)), new Date(Math.max.apply(null,akhirs)));
        if(dur) return jpFmtDurasi(dur.hari, dur.jam, dur.menit);
      }
    }
  }catch(e){}
  return jadwalDurasiTxt(r && r.tgl_mulai, r && r.tgl_selesai);
}
function renderJadwalView(){
  const tb=document.getElementById('jadwal-view-body');
  const pg=document.getElementById('jadwal-view-pagination');
  const cEl=document.getElementById('jadwal-view-count');
  if(!tb) return;
  const rows=jadwalViewRows();
  if(cEl) cEl.textContent=rows.length;
  if(!rows.length){ tb.innerHTML=jadwalEmptyRow(); if(pg) pg.innerHTML=''; return; }
  const totalPages=Math.max(1,Math.ceil(rows.length/JADWAL_VIEW_PAGE_SIZE));
  if(jadwalViewPage>totalPages) jadwalViewPage=totalPages;
  if(jadwalViewPage<1) jadwalViewPage=1;
  const start=(jadwalViewPage-1)*JADWAL_VIEW_PAGE_SIZE;
  const pageRows=rows.slice(start,start+JADWAL_VIEW_PAGE_SIZE);
  tb.innerHTML=pageRows.map((r,i)=>{
    const rid=fkEsc(String(r.id));
    return '<tr>'+
      '<td class="col-no">'+(start+i+1)+'</td>'+
      '<td class="wrap-cell col-nama-freeze">'+fkEsc(r.nama_pekerjaan||'—')+'</td>'+
      '<td style="text-align:center">'+jadwalDurasiFull(r)+'</td>'+
      '<td class="col-date">'+fkEsc(r.tgl_mulai?pnwDateLong(r.tgl_mulai):'—')+'</td>'+
      '<td class="col-date">'+fkEsc(r.tgl_selesai?pnwDateLong(r.tgl_selesai):'—')+'</td>'+
      '<td><div class="action-cell" style="justify-content:center">'+
        '<button class="act act-edit" title="Ubah" onclick="openJadwalKerja(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>'+
        '<button class="act act-view" title="Lihat" onclick="jadwalPreviewRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>'+
        '<button class="act act-del" title="Hapus" onclick="jadwalDeleteRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>'+
      '</div></td>'+
    '</tr>';
  }).join('');
  if(pg){
    if(totalPages<=1){ pg.innerHTML=''; }
    else{
      let h='<button class="pg-btn" '+(jadwalViewPage<=1?'disabled':'')+' onclick="jadwalViewGoto('+(jadwalViewPage-1)+')">‹</button>';
      for(let p=1;p<=totalPages;p++) h+='<button class="pg-btn '+(p===jadwalViewPage?'active':'')+'" onclick="jadwalViewGoto('+p+')">'+p+'</button>';
      h+='<button class="pg-btn" '+(jadwalViewPage>=totalPages?'disabled':'')+' onclick="jadwalViewGoto('+(jadwalViewPage+1)+')">›</button>';
      pg.innerHTML=h;
    }
  }
}
function jadwalViewGoto(p){ jadwalViewPage=p; renderJadwalView(); }
function openJadwalLihat(){ refreshDataJadwal().then(()=>showView('jadwal-view')); }
/* Cetak/pratinjau PDF sebuah jadwal tersimpan tanpa mengubah jadwal yang sedang disusun */
function jadwalPreviewRecord(id){
  const rec=(records_jadwal||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  const backup=jpState;
  jpState=jpRecordToState(rec);
  jpPrint();
  jpState=backup;
}
function jadwalDeleteRecord(id){
  if(!requireInput()) return;
  const rec=(records_jadwal||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  openConfirm({
    icon:'del', title:'Hapus Jadwal', text:'Hapus jadwal "'+(rec.nama_pekerjaan||'')+'"?',
    onYes:async()=>{
      try{ await withActionLoader('Menghapus', async()=>{ await StoreJadwal.remove(id); await refreshDataJadwal(); }); }
      catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'warn'); return; }
      toast('Jadwal dihapus','ok'); renderJadwalView();
    }
  });
}

/* ============ SLIDING PILL INDICATOR (.fk-seg) ============
   Latar pil pada grup tab (SPBJ/Kontrak Rinci | Pengadaan Langsung | Tender,
   dan grup segmented lain yang memakai class .fk-seg) meluncur halus ke
   tombol aktif, alih-alih berpindah instan. Memakai MutationObserver agar
   otomatis sinkron kapan pun class "active" berubah di mana pun kode
   memicunya (openFkInput/openFkView/showView/newRecord*, dsb) tanpa perlu
   menyentuh setiap fungsi tersebut satu per satu. */
function fkSegSyncThumb(seg, animate){
  if(!seg) return;
  let thumb=seg.querySelector(':scope > .fk-seg-thumb');
  const activeBtn=seg.querySelector('.fk-seg-btn.active');
  if(!thumb){
    thumb=document.createElement('span');
    thumb.className='fk-seg-thumb no-anim';
    seg.insertBefore(thumb, seg.firstChild);
  }
  if(!activeBtn){ thumb.style.opacity='0'; return; }
  if(animate===false) thumb.classList.add('no-anim');
  thumb.style.opacity='1';
  // Sisipkan pil ~4px dari tepi tombol agar sudut membulatnya tidak menonjol
  // keluar dari sudut membulat kontainer (mis. tab paling kanan "Tender").
  const SEG_IN=4;
  thumb.style.width=Math.max(0,activeBtn.offsetWidth-SEG_IN*2)+'px';
  thumb.style.transform='translateX('+(activeBtn.offsetLeft+SEG_IN)+'px)';
  if(animate===false){
    // paksa reflow sekali lalu lepas kelas no-anim agar perubahan berikutnya kembali animasi
    void thumb.offsetWidth;
    thumb.classList.remove('no-anim');
  }
}
function fkSegSyncAll(animate){
  document.querySelectorAll('.fk-seg').forEach(seg=>fkSegSyncThumb(seg, animate));
}
(function initFkSegThumbs(){
  document.querySelectorAll('.fk-seg').forEach(seg=>{
    fkSegSyncThumb(seg, false);
    new MutationObserver(()=>fkSegSyncThumb(seg, true))
      .observe(seg, {subtree:true, attributes:true, attributeFilter:['class','style'], childList:true});
  });
  let rTO=null;
  window.addEventListener('resize', ()=>{ clearTimeout(rTO); rTO=setTimeout(()=>fkSegSyncAll(false), 120); });
})();

/* ============ INIT ============ */
showLoader();
pynRegisterAll();     // registrasi internal (fitur penyesuaian dinonaktifkan)
buildFormKr();      // bangun form SPBJ/Kontrak Rinci dari definisi field
buildFormPl();      // bangun form Pengadaan Langsung dari definisi field
buildFormTender();  // bangun form Tender dari definisi field
applyLocksTender(); // terapkan kunci awal
// Autosave draft: setiap perubahan pada form input/ubah disimpan ke sessionStorage
attachDraftAutosave('input','input');
attachDraftAutosave('input-pl','input-pl');
attachDraftAutosave('input-tender','input-tender');
renderDashboard();
renderTable();
renderTablePl();
renderTableTender();
