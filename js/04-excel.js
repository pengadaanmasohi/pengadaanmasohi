/* ===== 04-excel.js (bagian 4/15, baris 2548-3261 dari app.js asli) =====
   Template & unggah Excel, ekspor, kotak drag-drop, validasi format sel.
   WAJIB dimuat berurutan 01 s.d. 15 — jangan ubah urutannya. ===== */
/* ============ EXCEL: TEMPLATE & UPLOAD ============ */
/* Urutan kolom Excel (Template & Export) & pencocokan Upload mengikuti urutan
   tampilan pada form Input Pekerjaan, yaitu urutan field pada GROUPS.
   Field yang (karena alasan tertentu) tidak tercantum di GROUPS ditambahkan di akhir
   agar tidak ada data yang hilang. */
function orderedFields(fieldsArr, groupsArr){
  const byKey = {}; fieldsArr.forEach(f=>{ byKey[f.key]=f; });
  const out=[]; const seen=new Set();
  (groupsArr||[]).forEach(g=>{ (g.keys||[]).forEach(k=>{ const f=byKey[k]; if(f && !seen.has(k)){ out.push(f); seen.add(k); } }); });
  fieldsArr.forEach(f=>{ if(!seen.has(f.key)){ out.push(f); seen.add(f.key); } }); // sisa (jika ada)
  return out;
}
/* ============================================================
   RAPIKAN TEMPLATE (dipakai ketiga modul: SPBJ, PL, Tender)
   - Kolom "Harga Total (Tanpa PPN)" diisi RUMUS otomatis = Harga Barang + Harga Jasa
   - Kolom "Harga Total (Dengan PPN)" diisi RUMUS otomatis = Total Tanpa PPN × 111%
   - Kedua kolom Total DIKUNCI (cell protection) agar tak bisa diedit manual
   - Sel yang punya dropdown DISOROT warna kuning lembut
   - Baris judul dibekukan (freeze) + autofilter, lalu sheet diproteksi
   Catatan: untuk modul Tender, kolom Total per-penyedia (Penawaran & Kontrak)
   bersifat "bertumpuk" (banyak nilai dalam satu sel) sehingga tak bisa memakai
   satu rumus Excel — kolom itu dikunci & dikosongkan; totalnya dihitung otomatis
   oleh aplikasi saat data diimpor. */
function spkColLetterTpl(n){ let s=''; while(n>0){ const m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=(n-m-1)/26; } return s; }
/* Susun pesan "File Gagal Diupload : Format Tidak Sesuai" beserta daftar sel yang salah.
   cells: [{label,val,col}] ; xlRow: nomor baris di Excel. */
function spkFmtBadMsg(cells, xlRow){
  const show=cells.slice(0,8).map(b=>{
    const v=String(b.val==null?'':b.val).replace(/\s+/g,' ').trim().slice(0,30);
    return (b.col||'?')+xlRow+' — '+b.label+(v?(' ("'+v+'")'):' (kosong)');
  });
  let msg='File Gagal Diupload : Format Tidak Sesuai\nBaris '+xlRow+'. Sel bermasalah: '+show.join(' ; ');
  if(cells.length>8) msg+=' ; +'+(cells.length-8)+' sel lain';
  msg+='.';
  return msg;
}
/* Susun pesan "kolom wajib yang belum diisi" beserta sel-nya.
   keys: array key field wajib yang kosong ; map: key->indeks kolom ; fields: definisi field. */
/* Kunci duplikat KHUSUS IMPOR.
   Berbeda dari dupKey(): nilai penampung seperti "-", "—", "n/a", "belum",
   "tbd" DIANGGAP KOSONG, sehingga banyak baris yang belum punya nomor kontrak
   tidak saling dianggap duplikat lalu terbuang diam-diam. dupKey() sendiri
   sengaja tidak diubah karena juga dipakai pemeriksaan simpan manual. */
const SPK_DUP_KOSONG = ['-','--','---','n/a','na','n.a','tbd','tba','belum','belum ada','nihil','none','null','.',',','_'];
function dupKeyImport(v){
  const s = String(v==null?'':v).replace(/[\u2010-\u2015]/g,'-').trim().toLowerCase().replace(/\s+/g,' ');
  if(!s) return '';
  return SPK_DUP_KOSONG.includes(s) ? '' : s;
}
/* =====================================================================
   KUNCI DUPLIKAT: NAMA PEKERJAAN **ATAU** NOMOR KONTRAK/SPBJ
   Sebelumnya kuncinya digabung (nama + '|' + nomor), sehingga sebuah baris
   baru dianggap duplikat hanya bila KEDUANYA sama persis. Akibatnya data
   dengan nama pekerjaan yang sama tetapi nomor kontraknya diketik sedikit
   berbeda (atau sebaliknya) masih lolos dan menjadi data ganda.
   Kini keduanya menjadi kunci yang BERDIRI SENDIRI: cukup SALAH SATU sama
   dengan data tersimpan atau dengan baris lain di berkas yang sama, baris
   itu ditolak.
   Nilai penampung ("-", "n/a", "tbd", "belum", ...) tetap dianggap kosong
   lewat dupKeyImport(), jadi puluhan baris yang belum berkontrak tidak saling
   dianggap duplikat hanya karena kolom nomornya sama-sama diisi "-".
     opt.nomor      : nama kolom nomor (no_kontrak / no_spbj)
     opt.labelNomor : label kolom nomor untuk pesan
     opt.nama       : daftar kolom nama pekerjaan, dipakai yang pertama terisi
   ===================================================================== */
function spkDupNama(rec, opt){
  for(const k of (opt.nama||[])){ const v=dupKeyImport(rec[k]); if(v) return v; }
  return '';
}
function spkDupKeys(rec, opt){
  const out=[];
  const nama=spkDupNama(rec, opt);
  const nomor=dupKeyImport(rec[opt.nomor]);
  if(nama)  out.push({ k:'nama|'+nama,  by:'Nama Pekerjaan' });
  if(nomor) out.push({ k:'no|'+nomor,   by:(opt.labelNomor||'No. Kontrak') });
  return out;                              /* kosong -> tak ada dasar banding */
}
/* Kompatibilitas: pemakaian lama spkDupKey(rec,opt).key masih berjalan. */
function spkDupKey(rec, opt){
  const ks=spkDupKeys(rec, opt);
  return { key: ks.map(x=>x.k).join('||'),
           by:  ks.map(x=>x.by).join(' / ') };
}
/* ---------------------------------------------------------------------
   Saring satu batch hasil unggahan template terhadap:
     a) seluruh data yang sudah tersimpan, dan
     b) baris-baris sebelumnya di berkas yang sama.
   Mengembalikan { toAdd, dupRows } — dupRows menyebut baris Excel, dasar
   pembandingnya, dan asal bentrokannya untuk ditampilkan di notifikasi.
   --------------------------------------------------------------------- */
function spkDupSaring(batch, existing, opt){
  const exist=new Map();
  (existing||[]).forEach(function(r){
    spkDupKeys(r,opt).forEach(function(x){ if(!exist.has(x.k)) exist.set(x.k,'data tersimpan'); });
  });
  const seen=new Map(), toAdd=[], dupRows=[];
  (batch||[]).forEach(function(rec){
    const keys=spkDupKeys(rec,opt);
    let hit=null;
    for(const x of keys){
      if(exist.has(x.k)){ hit={by:x.by, asal:exist.get(x.k)}; break; }
      if(seen.has(x.k)){  hit={by:x.by, asal:'baris '+seen.get(x.k)}; break; }
    }
    if(hit){
      const noTxt=String(rec[opt.nomor]||'').trim();
      let nmTxt=''; for(const k of (opt.nama||[])){ if(String(rec[k]||'').trim()){ nmTxt=String(rec[k]).trim(); break; } }
      dupRows.push({ row:rec.__xlRow, by:hit.by, asal:hit.asal,
                     no:(noTxt||nmTxt||'-') });
      return;
    }
    keys.forEach(function(x){ seen.set(x.k, rec.__xlRow); });
    toAdd.push(rec);
  });
  return { toAdd:toAdd, dupRows:dupRows };
}
/* Pemeriksaan duplikat untuk SIMPAN MANUAL (satu record vs daftar tersimpan).
   Mengembalikan keterangan bentrokan, atau null bila aman. */
function spkDupCek(rec, daftar, opt, selfId){
  const keys=spkDupKeys(rec,opt);
  if(!keys.length) return null;
  for(const r of (daftar||[])){
    if(selfId!=null && String(r.id)===String(selfId)) continue;
    const lain=spkDupKeys(r,opt).map(function(x){ return x.k; });
    for(const x of keys){ if(lain.indexOf(x.k)>=0) return { by:x.by }; }
  }
  return null;
}
/* =====================================================================
   NOTIFIKASI HASIL UNGGAH TEMPLATE — RINGKAS DUA BARIS
     <n> Data pekerjaan berhasil ditambahkan
     <m> Data pekerjaan tidak berhasil ditambahkan : data sudah ada
   Baris yang tidak bentrok TETAP masuk; hanya baris duplikat yang dilewati.
   Rincian baris Excel mana saja yang dilewati tidak lagi ditulis di layar —
   tetap tercatat di console (console.warn) untuk penelusuran bila perlu.
   ===================================================================== */
function spkImporMsg(okCount, dupCount){
  const baris=[];
  if(okCount>0)  baris.push(okCount+" Data pekerjaan berhasil ditambahkan");
  if(dupCount>0) baris.push(dupCount+" Data pekerjaan tidak berhasil ditambahkan : data sudah ada");
  return baris.join("\n");
}
/* Nada notifikasi: hijau bila semua masuk, kuning bila sebagian, merah bila
   tidak ada satu pun yang bisa ditambahkan. */
function spkImporTone(okCount, dupCount){
  if(okCount>0 && dupCount>0) return "warn";
  return okCount>0 ? "ok" : "err";
}
function spkMissingMsg(keys, map, fields, xlRow){
  const byKey={}; (fields||[]).forEach(f=>{ byKey[f.key]=f; });
  const show=keys.slice(0,8).map(k=>{
    const f=byKey[k]||{label:k};
    const col=(map && map[k]!=null)?spkColLetterTpl(map[k]+1):'?';
    return col+xlRow+' — '+(f.label||k);
  });
  let msg='File Gagal Diupload : Ada Kolom Wajib Yang Belum Diisi\nBaris '+xlRow+'. Lengkapi sel: '+show.join(' ; ');
  if(keys.length>8) msg+=' ; +'+(keys.length-8)+' kolom lain';
  msg+='.';
  return msg;
}
async function spkFinishTemplate(wsD, COLS, OPSI, isStackFn, ROWS){
  ROWS = ROWS || 250;
  const lastRow = ROWS + 1;
  const colOf = {}; COLS.forEach((f,i)=>{ colOf[f.key]=i+1; });
  const DROP_FILL = {type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF3C4'}}; // kuning lembut → sel dropdown
  const LOCK_FILL = {type:'pattern',pattern:'solid',fgColor:{argb:'FFE9ECEF'}}; // abu-abu → sel terkunci (rumus)
  // 1) Semua sel isian tidak terkunci (boleh diisi) + sorot sel dropdown
  for(let idx=0; idx<COLS.length; idx++){
    const c=idx+1; const f=COLS[idx]; const isDrop=!!(OPSI && OPSI[f.key]);
    for(let r=2;r<=lastRow;r++){
      const cell=wsD.getCell(r,c);
      cell.protection={locked:false};
      if(isDrop) cell.fill=DROP_FILL;
    }
  }
  // 1b) NOTIFIKASI MERAH: bila sel dropdown diisi nilai di luar daftar (mis. akibat
  //     copy-paste yang melewati validasi), sel otomatis berubah merah via conditional
  //     formatting. COUNTIF(<daftar Opsi>, sel)=0 berarti nilai tidak dikenal.
  const dropKeys = OPSI ? Object.keys(OPSI) : [];
  const opsiRangeOf = {};
  dropKeys.forEach((k,ci)=>{ const L=spkColLetterTpl(ci+1); opsiRangeOf[k]=`Opsi!$${L}$2:$${L}$${(OPSI[k]?OPSI[k].length:0)+1}`; });
  let cfPrio = 1;
  dropKeys.forEach((k)=>{
    const c=colOf[k]; if(!c) return;
    const DL=spkColLetterTpl(c);
    const redEdge={style:'thin',color:{argb:'FF9C0006'}};
    try{
      wsD.addConditionalFormatting({
        ref:`${DL}2:${DL}${lastRow}`,
        rules:[{
          type:'expression', priority:cfPrio++,
          formulae:[`AND(${DL}2<>"",COUNTIF(${opsiRangeOf[k]},${DL}2)=0)`],
          style:{ fill:{type:'pattern',pattern:'solid',bgColor:{argb:'FFFFC7CE'}},
                  font:{color:{argb:'FF9C0006'},bold:true},
                  border:{top:redEdge,left:redEdge,bottom:redEdge,right:redEdge} }
        }]
      });
    }catch(e){ console.warn('[SPK] conditional format gagal utk '+k+':',e); }
  });
  // 1c) TAHUN WAJIB: sel Tahun disorot MERAH bila barisnya sudah diisi tetapi
  //     kolom Tahun dibiarkan kosong. Aturan ini keras — saat diunggah, satu
  //     baris tanpa Tahun membatalkan SELURUH berkas. Sorotan ini agar
  //     ketahuan sejak di Excel, bukan setelah ditolak aplikasi.
  const thC = colOf['tahun'];
  if(thC){
    const LT = spkColLetterTpl(thC);
    const LAST = spkColLetterTpl(COLS.length);
    const redEdge2={style:'thin',color:{argb:'FF9C0006'}};
    try{
      wsD.addConditionalFormatting({
        ref:`${LT}2:${LT}${lastRow}`,
        rules:[{
          type:'expression', priority:cfPrio++,
          formulae:[`AND(COUNTA($A2:$${LAST}2)>0,${LT}2="")`],
          style:{ fill:{type:'pattern',pattern:'solid',bgColor:{argb:'FFFFC7CE'}},
                  font:{color:{argb:'FF9C0006'},bold:true},
                  border:{top:redEdge2,left:redEdge2,bottom:redEdge2,right:redEdge2} }
        }]
      });
    }catch(e){ console.warn('[SPK] conditional format Tahun gagal:',e); }
  }
  // 2) Kolom Total → rumus otomatis + terkunci
  COLS.forEach((f)=>{
    const tC=colOf[f.key]; if(!tC) return;
    const stacked = (typeof isStackFn==='function') && isStackFn(f.key);
    if(f.auto==='sum'){
      const p=f.key.replace(/_total_tanpa_ppn$/,'');
      const bC=colOf[p+'_harga_barang'], jC=colOf[p+'_harga_jasa'];
      for(let r=2;r<=lastRow;r++){
        const cell=wsD.getCell(r,tC);
        if(!stacked && bC && jC){
          const LB=spkColLetterTpl(bC), LJ=spkColLetterTpl(jC);
          cell.value={formula:`IF(N(${LB}${r})+N(${LJ}${r})=0,"",N(${LB}${r})+N(${LJ}${r}))`};
        } else { cell.value=null; }
        cell.numFmt=ACCT_NODEC; cell.alignment={vertical:'middle',horizontal:'right'};
        cell.protection={locked:true}; cell.fill=LOCK_FILL;
      }
    } else if(f.auto==='akhirkontrak'){
      /* Tgl. Akhir Kontrak = Tgl. Awal Kontrak + Negosiasi Jangka Waktu Pelaksanaan.
         Kolom negosiasi berupa teks bebas ("60", "60 hari kalender"), jadi angkanya
         diambil dari KATA PERTAMA sel tersebut. Bila kata pertama bukan angka,
         hasilnya dikosongkan (tidak memunculkan galat #VALUE!). */
      const aC=colOf['tgl_awal_kontrak'], nC=colOf['negosiasi_pelaksanaan'];
      for(let r=2;r<=lastRow;r++){
        const cell=wsD.getCell(r,tC);
        if(!stacked && aC && nC){
          const LA=spkColLetterTpl(aC), LN=spkColLetterTpl(nC);
          cell.value={formula:`IF(OR(${LA}${r}="",${LN}${r}=""),"",IFERROR(${LA}${r}+VALUE(TRIM(LEFT(SUBSTITUTE(TRIM(${LN}${r}&"")," ",REPT(" ",100)),100))),""))`};
        } else { cell.value=null; }
        cell.numFmt='dd/mm/yyyy'; cell.alignment={vertical:'middle'};
        cell.protection={locked:true}; cell.fill=LOCK_FILL;
      }
    } else if(f.auto==='csms3thn'){
      /* Tgl. Berakhir (CSMS) = Tgl. Terbit (CSMS) + 3 tahun kalender.
         EDATE(...,36) mempertahankan tanggal yang sama tiga tahun berikutnya dan
         menangani 29 Februari dengan benar (jatuh ke 28 Februari). */
      const tgC=colOf['csms_tgl_terbit'];
      for(let r=2;r<=lastRow;r++){
        const cell=wsD.getCell(r,tC);
        if(!stacked && tgC){
          const LT=spkColLetterTpl(tgC);
          cell.value={formula:`IF(${LT}${r}="","",EDATE(${LT}${r},36))`};
        } else { cell.value=null; }
        cell.numFmt='dd/mm/yyyy'; cell.alignment={vertical:'middle'};
        cell.protection={locked:true}; cell.fill=LOCK_FILL;
      }
    } else if(f.auto==='ppn'){
      const p=f.key.replace(/_total_dengan_ppn$/,'');
      const tt=colOf[p+'_total_tanpa_ppn'];
      for(let r=2;r<=lastRow;r++){
        const cell=wsD.getCell(r,tC);
        if(!stacked && tt){
          const LT=spkColLetterTpl(tt);
          cell.value={formula:`IF(${LT}${r}="","",${LT}${r}*1.11)`};
        } else { cell.value=null; }
        cell.numFmt=ACCT_NODEC; cell.alignment={vertical:'middle',horizontal:'right'};
        cell.protection={locked:true}; cell.fill=LOCK_FILL;
      }
    }
  });
  // 3) Header terkunci, bekukan baris judul, autofilter
  for(let c=1;c<=COLS.length;c++) wsD.getCell(1,c).protection={locked:true};
  wsD.views=[{state:'frozen',ySplit:1}];
  try{ wsD.autoFilter={from:{row:1,column:1},to:{row:1,column:COLS.length}}; }catch(e){}
  // 4) Proteksi sheet — hanya sel terkunci (Total & header) yang tak bisa diedit
  try{
    await wsD.protect('', {selectLockedCells:true,selectUnlockedCells:true,formatCells:true,
      formatColumns:true,formatRows:true,insertRows:true,deleteRows:true,sort:true,autoFilter:true});
  }catch(e){ console.warn('[SPK] proteksi sheet gagal (template tetap dibuat):',e); }
}
async function downloadTemplate(){
  if(!requireInput()) return;
  // Pakai ExcelJS agar bisa membuat dropdown (data validation) asli di Excel.
  if(!window.ExcelJS){ toast('Library Excel belum termuat, coba lagi','warn'); return; }
  const COLS = orderedFields(FIELDS, GROUPS);

  // Opsi dropdown template diambil LANGSUNG dari definisi field input (satu sumber),
  // sehinga dropdown pada Template selalu sama dengan dropdown pada form Input.
  const OPSI = {};
  FIELDS.forEach(f=>{ if(f.type==='select' && Array.isArray(f.options) && f.options.length) OPSI[f.key]=f.options; });

  const wb = new ExcelJS.Workbook();
  const dropKeys = Object.keys(OPSI);
  const colLetter = n => { let s=''; while(n>0){ const m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=(n-m-1)/26; } return s; };
  const opsiRange = {};                               // key -> 'Opsi!$A$2:$A$4'
  dropKeys.forEach((k,ci)=>{
    const L = colLetter(ci+1);
    opsiRange[k] = `Opsi!$${L}$2:$${L}$${OPSI[k].length+1}`;
  });

  // --- Sheet Data (utama, harus paling depan) ---
  const wsD = wb.addWorksheet('Data');
  const headers = COLS.map(f=>f.label);
  wsD.addRow(headers);
  wsD.columns = COLS.map(f=>({width:Math.max(16,f.label.length+2)}));

  // Border tipis abu-abu
  const thin = {style:'thin', color:{argb:'FFBFCAD0'}};
  const allBorder = {top:thin,left:thin,bottom:thin,right:thin};

  // Judul tabel (baris 1) — warna teal PLN, teks putih tebal
  const headRow = wsD.getRow(1);
  headRow.height = 32;
  for(let c=1;c<=COLS.length;c++){
    const cell = wsD.getCell(1,c);
    cell.fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FF0E7C86'}};
    cell.font = {bold:true,color:{argb:'FFFFFFFF'},size:11};
    cell.alignment = {wrapText:true,vertical:'middle',horizontal:'center'};
    cell.border = allBorder;
  }
  // Border + zebra pada area isian (baris 2..151)
  for(let r=2;r<=251;r++){
    for(let c=1;c<=COLS.length;c++){
      const cell = wsD.getCell(r,c);
      cell.border = allBorder;
      cell.alignment = {vertical:'middle'};
      if(r%2===1) cell.fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FFF2F7F8'}};
    }
  }
  // Format kolom: tanggal = date, nilai = Rupiah tanpa desimal
  COLS.forEach((f,idx)=>{
    const c=idx+1;
    if(f.type==='date'){ for(let r=2;r<=251;r++) wsD.getCell(r,c).numFmt='dd/mm/yyyy'; }
    if(f.type==='num'){  for(let r=2;r<=251;r++){ wsD.getCell(r,c).numFmt=ACCT_NODEC; wsD.getCell(r,c).alignment={vertical:'middle',horizontal:'right'}; } }
    if(isForceTextKey(f.key)){ for(let r=2;r<=251;r++) wsD.getCell(r,c).numFmt='@'; }
  });

  // --- Sheet Opsi (sumber dropdown, disembunyikan) ---
  const wsO = wb.addWorksheet('Opsi');
  dropKeys.forEach((k,ci)=>{
    const f = FIELDS.find(x=>x.key===k);
    wsO.getCell(1,ci+1).value = f.label;
    OPSI[k].forEach((v,ri)=> wsO.getCell(ri+2,ci+1).value = v);
  });
  wsO.state = 'hidden';

  // Pasang dropdown pada kolom terkait, baris 2..501
  const ROWS = 250;
  COLS.forEach((f,idx)=>{
    if(!OPSI[f.key]) return;
    const L = colLetter(idx+1);
    for(let r=2;r<=ROWS+1;r++){
      wsD.getCell(`${L}${r}`).dataValidation = {
        type:'list', allowBlank:true,
        formulae:[opsiRange[f.key]],
        showErrorMessage:true,
        errorTitle:'Pilihan tidak valid',
        error:'Silakan pilih salah satu nilai dari daftar dropdown.'
      };
    }
  });

  // --- Sheet Petunjuk ---
  const wsG = wb.addWorksheet('Petunjuk');
  wsG.columns=[{width:26},{width:82}];
  [['PETUNJUK PENGISIAN',''],['',''],
   ['Tahun','WAJIB diisi pada setiap baris. Bila ada satu baris saja yang kosong, seluruh berkas ditolak.'],
   ['Jenis Anggaran','Pilih dari dropdown: Operasi / Investasi'],
   ['Bidang Pelaksana','Pilih dari dropdown (7 bidang)'],
   ['Status','Pilih dari dropdown: On Progress / Selesai'],
   ['Format Tanggal','Kolom tanggal sudah berformat dd/mm/yyyy. Ketik tanggal langsung (mis. 31/01/2025).'],
   ['Nilai','Kolom nilai sudah berformat Rupiah tanpa desimal. Ketik angka saja (mis. 100000000).'],
   ['','Isi data mulai baris ke-2. Jangan menghapus sheet "Opsi".'],
  ].forEach(r=>wsG.addRow(r));
  const gTitle = wsG.getCell('A1');
  gTitle.font = {bold:true,size:14,color:{argb:'FF0E7C86'}};
  for(let r=3;r<=9;r++){ wsG.getCell(`A${r}`).font={bold:true,color:{argb:'FF095E66'}}; }

  // Rapikan: sorot dropdown, kunci & proteksi (modul SPBJ tidak punya kolom Total)
  await spkFinishTemplate(wsD, COLS, OPSI, null, ROWS);

  // unduh
  try{
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download='Template_Monitoring_SPBJ_UP3_Masohi.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }catch(err){ console.error(err); toast('Gagal membuat template: '+errMsg(err),'warn'); }
}

/* ============ RAPIKAN TAMPILAN SHEET HASIL EXPORT ============
   Dipakai oleh export Monitoring (SPBJ), Pengadaan Langsung, dan Tender.
   Mengatur: lebar kolom presisi (dari isi data), wrap text, tinggi baris
   otomatis, border, header berwarna, zebra, freeze header + autofilter,
   dan perataan (teks kiri, tanggal tengah, angka kanan).
   - ws      : worksheet ExcelJS (baris 1 = header, baris 2..n = data)
   - cols    : array field terurut { key, label, type }
   - dataRows: jumlah baris data (tidak termasuk header)
   - opts    : { headerFill(f,ci)->argb, topAlign(f,ci)->bool } (opsional) */
function autoLayoutSheet(ws, cols, dataRows, opts){
  opts = opts || {};
  const MIN_W = 12;         // lebar minimum kolom (karakter)
  const MAX_W = 45;         // lebar maksimum sebelum teks di-wrap
  const MAX_W_NUM = 20;     // batas kolom angka
  const MAX_W_DATE = 14;    // batas kolom tanggal
  const HEADER_H = 34;      // tinggi baris header
  const LINE_H = 15;        // perkiraan tinggi 1 baris teks (pt)
  const MAX_LINES = 6;      // batas jumlah baris wrap per sel

  const thin = {style:'thin', color:{argb:'FFBFCAD0'}};
  const allBorder = {top:thin,left:thin,bottom:thin,right:thin};

  // 1) Tentukan lebar tiap kolom dari teks terpanjang (header + isi data)
  const widths = cols.map((f,ci)=>{
    if(f.type==='no'){ return Math.max(String(dataRows).length+2, 5); }   // kolom No urut: sempit
    let max = String(f.label||'').length;
    for(let r=2;r<=dataRows+1;r++){
      const v = ws.getCell(r,ci+1).value;
      if(v==null) continue;
      const s = (typeof v==='object' && v.formula!==undefined) ? '' : String(v);
      // untuk teks multi-baris (Alt+Enter) ukur baris terpanjang; multi-kata per potongan
      const parts = s.split(/\r?\n/);
      let longest = 0;
      parts.forEach(p=>{ p.split(/\s+/).forEach(w=>{ if(w.length>longest) longest=w.length; }); if(p.length>longest && p.length<=MAX_W) longest=p.length; });
      const len = Math.max(Math.min(s.length, MAX_W), longest);
      if(len>max) max = len;
    }
    let cap = MAX_W;
    if(f.type==='num') cap = MAX_W_NUM;
    else if(f.type==='date') cap = MAX_W_DATE;
    return Math.min(Math.max(max+2, MIN_W), cap);
  });
  ws.columns = widths.map(w=>({width:w}));

  // 2) Header
  const headRow = ws.getRow(1); headRow.height = HEADER_H;
  for(let c=1;c<=cols.length;c++){
    const cell = ws.getCell(1,c);
    const fill = (opts.headerFill && opts.headerFill(cols[c-1], c-1)) || 'FF0E7C86';
    cell.fill = {type:'pattern',pattern:'solid',fgColor:{argb:fill}};
    cell.font = {bold:true,color:{argb:'FFFFFFFF'},size:11};
    cell.alignment = {wrapText:true,vertical:'middle',horizontal:'center'};
    cell.border = allBorder;
  }

  // 3) Data: border, wrap, format, zebra, perataan, dan tinggi baris otomatis
  for(let r=2;r<=dataRows+1;r++){
    let maxLines = 1;
    for(let c=1;c<=cols.length;c++){
      const f = cols[c-1];
      const cell = ws.getCell(r,c);
      cell.border = allBorder;
      const top = opts.topAlign && opts.topAlign(f, c-1);
      let horizontal = 'left';                 // teks default rata kiri
      if(f.type==='no'){
        cell.numFmt = '0'; horizontal = 'center';   // kolom No urut, rata tengah
      } else if(f.type==='num'){
        if(typeof cell.value==='number') cell.numFmt = ACCT_NODEC;
        horizontal = 'right';                   // angka rata kanan
      } else if(f.type==='date'){
        cell.numFmt = '@'; horizontal = 'center';
      } else if(isForceTextKey(f.key)){
        cell.numFmt = '@';
      }
      cell.alignment = {vertical: top?'top':'middle', horizontal, wrapText:true};
      if(r%2===1) cell.fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FFF2F7F8'}};

      // hitung perkiraan jumlah baris wrap pada sel ini
      const v = cell.value;
      if(v!=null && !(typeof v==='object')){
        const s = String(v);
        // baris nyata (Alt+Enter) + wrap otomatis per baris
        const explicit = s.split(/\r?\n/);
        let lines = 0;
        explicit.forEach(p=>{ lines += Math.max(1, Math.ceil(p.length / Math.max(1, widths[c-1]-1))); });
        lines = Math.min(MAX_LINES, Math.max(1, lines));
        if(lines>maxLines) maxLines = lines;
      }
    }
    ws.getRow(r).height = Math.min(LINE_H*MAX_LINES, LINE_H*maxLines + 4);
  }

  // 4) Freeze header saja (tanpa autofilter agar tabel export tidak otomatis terfilter)
  ws.views = [{state:'frozen', ySplit:1}];
}

/* ============ EXPORT EXCEL (data, format seperti template) ============ */
async function exportExcel(){
  if(!window.ExcelJS){ toast('Library Excel belum termuat, coba lagi','warn'); return; }
  const COLS = orderedFields(FIELDS, GROUPS);
  const rows = getFilteredRecords();
  if(rows.length===0){ toast('Tidak ada data untuk diekspor','warn'); return; }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Daftar Pekerjaan');
  const NO_COL = {key:'__no__', label:'No', type:'no'};
  const headers = COLS.map(f=>f.label);
  ws.addRow(['No', ...headers]);
  rows.forEach((r,ri)=>{
    ws.addRow([ri+1, ...COLS.map(f=>{
      let v=r[f.key];
      if(f.auto==='sum'){ const p=f.key.replace(/_total_tanpa_ppn$/,''); const b=Number(r[p+'_harga_barang'])||0, j=Number(r[p+'_harga_jasa'])||0; const t=b+j; return t>0?t:''; }
      if(f.auto==='ppn'){ const p=f.key.replace(/_total_dengan_ppn$/,''); const b=Number(r[p+'_harga_barang'])||0, j=Number(r[p+'_harga_jasa'])||0; const t=b+j; return t>0?ppnFromBase(t):''; }
      if(v===''||v==null) return '';
      if(f.type==='num') return Number(v);
      if(f.type==='date') return fmtDate(v);
      return v;
    })]);
  });
  // Rapikan tampilan: lebar kolom presisi, wrap text, tinggi baris otomatis
  autoLayoutSheet(ws, [NO_COL, ...COLS], rows.length);

  try{
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download='Daftar_Pekerjaan_SPBJ_UP3_Masohi.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }catch(err){ console.error(err); toast('Gagal export Excel: '+errMsg(err),'warn'); }
}

/* ============ KOTAK DRAG & DROP UNGGAH TEMPLATE (KR / PL / Tender) ============
   Tombol "Upload Template" tidak langsung membuka dialog berkas, melainkan
   menampilkan kotak Drag & Drop; di bawahnya ada tombol "Browse File" untuk
   membuka dialog pilih berkas. Berkas yang dijatuhkan/dipilih diproses oleh
   handler unggah yang sudah ada (handleUpload / handleUploadPl / handleUploadTender)
   melalui event tiruan { target:{ files:[file], value:'' } }. */
const IO_INPUT_ID = { kr:'xlsx-upload', pl:'xlsx-upload-pl', tender:'xlsx-upload-tender' };
function ioTplPick(cat){
  const d=document.getElementById('io-dz-'+cat); if(!d) return;
  ioTplBindDrop(cat);
  d.classList.add('show');
  try{ d.scrollIntoView({behavior:'smooth', block:'nearest'}); }catch(e){}
}
function ioTplHide(cat){
  const d=document.getElementById('io-dz-'+cat); if(d) d.classList.remove('show','drag');
}
function ioTplBrowse(cat){
  const f=document.getElementById(IO_INPUT_ID[cat]); if(f){ f.value=''; f.click(); }
}
function ioTplDispatch(cat, file){
  if(!file) return;
  if(!/\.(xlsx|xls)$/i.test(file.name||'')){ toast('Berkas harus berformat Excel (.xlsx / .xls)','warn', TOAST_MS_UPLOAD); return; }
  const ev={ target:{ files:[file], value:'' } };   // tiruan event agar handler lama tetap dipakai
  if(cat==='kr') handleUpload(ev);
  else if(cat==='pl') handleUploadPl(ev);
  else if(cat==='tender') handleUploadTender(ev);
}
function ioTplBindDrop(cat){
  const d=document.getElementById('io-dz-'+cat); if(!d || d._ioBound) return; d._ioBound=true;
  const stop=e=>{ e.preventDefault(); e.stopPropagation(); };
  d.addEventListener('dragover',  e=>{ stop(e); d.classList.add('drag'); });
  d.addEventListener('dragenter', e=>{ stop(e); d.classList.add('drag'); });
  d.addEventListener('dragleave', e=>{ stop(e); d.classList.remove('drag'); });
  d.addEventListener('drop', e=>{
    stop(e); d.classList.remove('drag');
    const f=e.dataTransfer && e.dataTransfer.files ? e.dataTransfer.files[0] : null;
    ioTplDispatch(cat, f);
  });
}

function handleUpload(ev){
  if(!requireInput()){ ev.target.value=""; return; }
  const file=ev.target.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=async e=>{
    try{
      const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});
      const sheetName = wb.SheetNames.includes('Data') ? 'Data' : wb.SheetNames[0];
      const ws=wb.Sheets[sheetName];
      const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      if(rows.length<2){ toast('File kosong / tidak ada data','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      const head=rows[0].map(h=>String(h).trim());
      const map={};
      head.forEach((h,i)=>{ const f=FIELDS.find(x=>x.label.toLowerCase()===h.toLowerCase()); if(f)map[f.key]=i; });
      if(Object.keys(map).length===0){ toast('Header tidak dikenali. Gunakan template resmi.','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      const batch=[];
      for(let r=1;r<rows.length;r++){
        const row=rows[r]; if(!row || row.every(c=>String(c).trim()===''))continue;
        const rec={};
        let fmtBad=false; const fmtBadCells=[];
        FIELDS.forEach(f=>{
          const raw = map[f.key]!=null ? row[map[f.key]] : '';
          const c=coerceCell(f,raw);
          if(!c.ok){ fmtBad=true; fmtBadCells.push({label:f.label,val:raw,col:(map[f.key]!=null?spkColLetterTpl(map[f.key]+1):'?')}); }
          rec[f.key]=c.value;
        });
        if(fmtBad){
          const xlRow=r+1;
          console.warn('[SPK] Upload SPBJ — Format Tidak Sesuai di baris '+xlRow+':', fmtBadCells);
          toast(spkFmtBadMsg(fmtBadCells, xlRow),'err', TOAST_MS_UPLOAD);
          ev.target.value=''; return;
        }
        if(!String(rec.tahun||'').trim()){ const xlRow=r+1; console.warn('[SPK] Upload SPBJ/Kontrak Rinci — kolom Tahun kosong di baris '+xlRow); toast(spkMissingMsg(['tahun'], map, FIELDS, xlRow),'warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
        { const miss=validateRequiredKr(rec); if(miss.length){ const xlRow=r+1; console.warn('[SPK] Upload SPBJ — kolom wajib kosong di baris '+xlRow+':', miss); toast(spkMissingMsg(miss, map, FIELDS, xlRow),'warn', TOAST_MS_UPLOAD); ev.target.value=''; return; } }
        rec.__xlRow = r+1;   // nomor baris di Excel, dipakai pesan duplikat
        batch.push(rec);
      }
      if(batch.length===0){ toast('Tidak ada baris data untuk diimpor','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      // Saring duplikat: Nama Pekerjaan ATAU No. SPBJ yang sama dengan data
      // tersimpan maupun dengan baris lain di berkas yang sama.
      const DUPOPT_KR={nomor:'no_spbj', labelNomor:'No. SPBJ', nama:['nama_pekerjaan_kr','nama_pekerjaan_khs']};
      const _sar=spkDupSaring(batch, records, DUPOPT_KR);
      const toAdd=_sar.toAdd, dupRows=_sar.dupRows;
      const dupCount=dupRows.length;
      if(dupCount) console.warn('[SPK] Upload SPBJ/Kontrak Rinci — baris dilewati (duplikat Nama Pekerjaan / No. SPBJ):', dupRows);
      if(toAdd.length){
        try{ await Store.bulkCreate(toAdd); }
        catch(err){ console.error(err); toast('Gagal mengimpor: '+errMsg(err),'warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
        await refreshData();
      }
      toast(spkImporMsg(toAdd.length, dupCount), spkImporTone(toAdd.length, dupCount), TOAST_MS_UPLOAD);
      // Data berhasil ditambahkan lewat template → langsung tampilkan loading &
      // kembali ke Daftar Monitoring (showView sudah memunculkan animasi "Memuat").
      if(toAdd.length){ ev.target.value=''; showView('list','Memuat daftar'); return; }
    }catch(err){ console.error(err); toast('Gagal membaca file Excel','warn', TOAST_MS_UPLOAD); }
    ev.target.value='';
  };
  reader.readAsArrayBuffer(file);
}
function normDate(v){
  if(v==='')return'';
  if(typeof v==='number'){ const d=XLSX.SSF.parse_date_code(v); if(d)return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`; }
  const s=String(v).trim();
  // Angka seri tanggal Excel yang terbaca sebagai TEKS (mis. "45821" dari kolom
  // per-penyedia yang di-String()-kan). Ambang >=10000 agar tahun 4 digit spt "2025"
  // TIDAK ikut dianggap seri tanggal. 2958465 = 31/12/9999 (batas maksimum Excel).
  if(/^\d+(\.\d+)?$/.test(s)){ const n=Number(s); if(n>=10000 && n<=2958465 && typeof XLSX!=='undefined' && XLSX.SSF){ const d=XLSX.SSF.parse_date_code(n); if(d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`; } }
  let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if(m)return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/); if(m)return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  // Tanggal teks (mis. "11 Juni 2026", "03 Mei 2026", "11-Jun-26", "2 Jul. 2026").
  // Excel tak mengenali nama bulan Indonesia; diterjemahkan sendiri di sini agar teks hasil
  // paste otomatis menjadi tanggal saat di-upload. Pemisah bisa spasi/tanda hubung/titik,
  // dan tahun boleh 2 atau 4 digit (mis. "26" -> 2026).
  const bln={jan:1,januari:1,feb:2,pebruari:2,februari:2,mar:3,maret:3,apr:4,april:4,mei:5,
    jun:6,juni:6,jul:7,juli:7,agu:8,ags:8,agt:8,agustus:8,sep:9,sept:9,september:9,
    okt:10,oct:10,oktober:10,nov:11,nop:11,november:11,des:12,dec:12,desember:12};
  const sNorm=s.replace(/[.\-\/]/g,' ').replace(/\s+/g,' ').trim();
  m=sNorm.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})$/);
  if(m){
    const mo=bln[m[2].toLowerCase()];
    if(mo){
      let yr=m[3]; if(yr.length<=2){ const yy=parseInt(yr,10); yr=String(yy<70?2000+yy:1900+yy); }
      return `${yr}-${String(mo).padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    }
  }
  return s;
}

/* ===== Validasi format sel Excel saat Upload =====
   Dipakai ketiga modul (SPBJ/KR, PL, Tender). Bila sebuah sel berisi nilai
   yang tidak sesuai (bukan salah satu opsi dropdown, atau format tanggal/angka
   tidak valid) maka upload dibatalkan dengan pesan:
   "Data gagal diperbarui : format tidak sesuai". */
function isValidNumCell(v){
  if(typeof v==='number') return isFinite(v);
  let s=String(v).trim(); if(s==='') return true;      // kosong ditangani cek wajib
  s=s.replace(/rp/gi,'').trim();
  if(/[a-z]/i.test(s)) return false;                    // ada huruf → bukan angka
  const cleaned=s.replace(/[^\d.\-]/g,'');
  if(cleaned===''||cleaned==='-'||cleaned==='.') return false;
  return !isNaN(Number(cleaned));
}
function isValidDateCell(v){
  if(v===''||v==null) return true;                      // kosong ditangani cek wajib
  const iso=normDate(v);
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if(!m) return false;
  const y=+m[1], mo=+m[2], d=+m[3];
  if(mo<1||mo>12||d<1||d>31) return false;
  const dt=new Date(y,mo-1,d);
  return dt.getFullYear()===y && dt.getMonth()===mo-1 && dt.getDate()===d;
}
/* Cocokkan nilai dengan opsi dropdown (abaikan spasi & kapitalisasi).
   Kembalikan opsi kanonik bila cocok, '' bila kosong, atau null bila tidak cocok. */
function matchOption(v, opts){
  const s=String(v==null?'':v).trim(); if(s==='') return '';
  const hit=(opts||[]).find(o=>String(o).trim().toLowerCase()===s.toLowerCase());
  return hit==null ? null : hit;
}
/* Validasi + normalisasi 1 sel menurut tipe field.
   Kembalikan {ok:boolean, value:any}. ok=false → format tidak sesuai. */
function coerceCell(f, raw){
  raw=(raw==null)?'':raw;
  if(f.type==='select' && Array.isArray(f.options) && f.options.length){
    const mo=matchOption(raw,f.options);
    if(mo===null) return {ok:false, value:String(raw).trim()};
    return {ok:true, value:mo};
  }
  if(f.type==='num'){
    if(!isValidNumCell(raw)) return {ok:false, value:''};
    const n=Number(String(raw).replace(/[^\d.\-]/g,'')); return {ok:true, value:isNaN(n)?'':n};
  }
  if(f.type==='date'){
    if(!isValidDateCell(raw)) return {ok:false, value:''};
    return {ok:true, value:normDate(raw)};
  }
  return {ok:true, value:String(raw).trim()};
}

