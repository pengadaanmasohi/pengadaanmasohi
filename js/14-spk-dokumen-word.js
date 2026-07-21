/* ===== 14-spk-dokumen-word.js (bagian 14/15, baris 21982-24751 dari app.js asli) =====
   Dokumen SPK 5 bagian, ZIP, OOXML template Word, penomoran otomatis, modal klausul.
   WAJIB dimuat berurutan 01 s.d. 15 — jangan ubah urutannya. ===== */
/* =========================================================================
   DOKUMEN SPK — SATU KESATUAN (5 bagian)
     1) Cover Surat Perintah Kerja
     2) Daftar Isi
     3) Isi kontrak (kop & footer berulang; halaman tanda tangan 2 rangkap)
     4) Cover Lampiran SPK  (cover yang sama, judul "Lampiran SPK")
     5) Isi Lampiran        (format sama dengan dokumen Perhitungan HPS,
                             "Rencana Anggaran Biaya" -> "Nilai Pekerjaan")
   ========================================================================= */
const SPK_ALAMAT_1='Jl. Abdullah Soulissa No 1, Masohi, Kec. Kota Masohi';
const SPK_ALAMAT_2='Kab Maluku Tengah Prov. Maluku 97513  ·  www.pln.co.id';

/* ---------- Cover khusus PERJANJIAN/KONTRAK ----------
   Meniru sampul dokumen perjanjian cetak: bingkai, blok judul rata tengah, lalu
   daftar keterangan "Label : Nilai". Dipakai HANYA untuk bentuk PK; bentuk Surat
   Perintah Kerja tetap memakai spkCoverHtml() dengan desain modernnya.
   CATATAN: bingkai ornamen (motif) pada dokumen acuan berasal dari "Page Border
   Art" Word dan tidak bisa direproduksi setia dengan CSS tanpa berkas gambarnya.
   Di sini dipakai bingkai GARIS GANDA — bersih, tajam saat dicetak, dan tidak
   bergantung pada aset luar. */
function spkCoverPkHtml(data, ctx){
  const esc=fkEsc;
  const org  = spkOrgP1(ctx);
  const alamat = ctx.p1_alamat || SPK_ALAMAT_1;
  const baris=(k,v,extra)=>{
    const kosong=!(v && String(v).trim());
    return '<div class="r">'+
      '<span class="k">'+esc(k)+'</span><span class="s">:</span>'+
      '<span class="v'+(kosong?' kosong':'')+'">'+(kosong?'\u2014':esc(v))+
        (extra?('<span class="x">'+esc(extra)+'</span>'):'')+'</span>'+
    '</div>';
  };
  const terbilang = ctx.nilai_terbilang ? ('('+ctx.nilai_terbilang+')') : '';
  return ''+
  '<section class="spk-page spk-coverpk">'+
    '<div class="cpk-in">'+
      '<div class="cpk-org">'+esc(org)+'</div>'+
      '<div class="cpk-adr">'+esc(alamat)+'</div>'+
      '<div class="cpk-jd">'+esc(spkDokLabel(data))+'</div>'+
      '<div class="cpk-sb">ANTARA</div>'+
      '<div class="cpk-nm">'+esc(org)+'</div>'+
      '<div class="cpk-sb">DENGAN</div>'+
      '<div class="cpk-nm">'+esc(ctx.p2_nama_hormat||'\u2014')+'</div>'+
      '<div class="cpk-rule"></div>'+
      '<div class="cpk-grid">'+
        baris('Nomor Kontrak',  data.nomor_kontrak)+
        baris('Tanggal',        ctx.tanggal_kontrak_pjg)+
        baris('Pekerjaan',      data.nama_pekerjaan)+
        baris('Lokasi',         data.lokasi_pekerjaan)+
        baris('Nilai Pekerjaan',ctx.nilai_rp, terbilang)+
        baris('Pelaksana',      data.pelaksana)+
        baris('Sumber Dana',    ctx.sumber_dana_no, ctx.sumber_dana_tgl_pjg)+
        baris('Akhir Pekerjaan',ctx.akhir_pekerjaan_pjg)+
      '</div>'+
    '</div>'+
  '</section>';
}

/* ---------- Cover (dipakai untuk Cover SPK & Cover Lampiran) ---------- */
function spkCoverHtml(data, ctx, judulBaris){
  const esc=fkEsc;
  const logo = SPK_LOGO_SRC? '<img src="'+SPK_LOGO_SRC+'" alt="PLN">' : '';
  const unit = ctx.p1_nama_singkat || 'Unit Pelaksana Pelayanan Pelanggan Masohi';
  const fld=(k,v,cls)=>{
    const kosong = !(v && String(v).trim());
    return '<div class="f"><div class="fk">'+esc(k)+'</div>'+
      '<div class="fv'+(kosong?' kosong':'')+(cls?' '+cls:'')+'">'+(kosong?'—':esc(v))+'</div></div>';
  };
  const judulHtml = String(judulBaris||'').split(' ').map(w=>'<span>'+esc(w)+'</span>').join(' ');
  /* ---- SATU rancangan sampul untuk kedua Bentuk Kontrak ----
     Dahulu Perjanjian/Kontrak dibedakan (aksen navy, garis ganda, label PIHAK
     PERTAMA/KEDUA). Sekarang keduanya PERSIS SAMA; yang berbeda hanya JUDUL
     dokumen (baris jenis di kanan atas & judul besar) dan baris kecil metode
     pengadaan yang selalu mengambil nilai Metode Pengadaan dari data.
     Catatan riwayat rancangan lama: */
  /* ---- (lama) Varian cover per Bentuk Kontrak ----
     Susunan & tata letak SENGAJA dibuat mirip agar terlihat satu keluarga dokumen,
     namun dibedakan dengan jelas:
       Surat Perintah Kerja : aksen EMAS, chip emas, garis tunggal, label DARI/KEPADA
       Perjanjian/Kontrak   : aksen NAVY (+ garis emas kedua), chip navy, garis ganda,
                              label PIHAK PERTAMA/PIHAK KEDUA */
  const isPk = spkBentukOf(data)==='PK';
  const kind = spkDokLabel(data);   /* PERJANJIAN/KONTRAK atau SURAT PERINTAH KERJA */
  const lbl1 = 'DARI';
  const lbl2 = 'KEPADA';
  const no2  = (isPk && data.nomor_kontrak_p2) ? '<div class="ps">No. '+esc(data.nomor_kontrak_p2)+'</div>' : '';
  return ''+
  '<section class="spk-page spk-cover cv-spk">'+
    '<div class="cv-top">'+
      '<div class="cv-brand">'+logo+
        '<div class="cv-org"><span>PT PLN (PERSERO)</span><b>UP3 Masohi</b></div>'+
      '</div>'+
      '<div class="cv-kind">'+esc(kind)+'</div>'+
    '</div>'+
    '<div class="cv-rule"></div>'+
    '<div class="cv-accent"></div>'+
    '<div class="cv-eyebrow">'+esc(spkMetodeLabel(data))+'</div>'+
    '<h1 class="cv-title">'+judulHtml+'</h1>'+
    '<div class="cv-rule2"></div>'+
    '<div class="cv-parties">'+
      '<div class="p"><div class="pl">'+lbl1+'</div><div class="pn">PT PLN (Persero)</div><div class="ps">'+esc(unit)+'</div></div>'+
      '<div class="p"><div class="pl">'+lbl2+'</div><div class="pn">'+esc(ctx.p2_nama_hormat||'—')+'</div>'+no2+'</div>'+
    '</div>'+
    '<div class="cv-spacer"></div>'+
    '<div class="cv-grid">'+
      fld('NOMOR KONTRAK', data.nomor_kontrak)+
      fld('TANGGAL KONTRAK', ctx.tanggal_kontrak_pjg)+
      fld('PEKERJAAN', data.nama_pekerjaan)+
      fld('LOKASI', data.lokasi_pekerjaan)+
      fld('PELAKSANA', data.pelaksana)+
      fld('AKHIR PEKERJAAN', ctx.akhir_pekerjaan_pjg)+
      fld('SUMBER ANGGARAN', ctx.sumber_dana_no, 'fv-lastrow fv-fit')+
      fld('TANGGAL ANGGARAN', ctx.sumber_dana_tgl_pjg, 'fv-lastrow')+
    '</div>'+
    '<div class="cv-nilai">'+
      '<div class="l"><div class="fk">NILAI PEKERJAAN</div>'+
        '<div class="terb">('+esc(ctx.nilai_terbilang||'')+')</div></div>'+
      '<div class="r">'+esc(ctx.nilai_rp||'')+'</div>'+
    '</div>'+
    '<div class="cv-rule"></div>'+
    '<div class="cv-foot"><div>'+esc(SPK_ALAMAT_1)+'</div><div>'+esc(SPK_ALAMAT_2)+'</div></div>'+
  '</section>';
}

/* ---------- Daftar Isi ---------- */
/* SURAT PERINTAH KERJA: tampilan daftar isi SEPERTI SEMULA — kerapatan baris
   menyesuaikan jumlah klausul supaya muat satu lembar (di atas 28 pasal dipecah
   dua kolom lewat kelas d3).
   PERJANJIAN/KONTRAK: memakai rancangan kotak dua kolom (lihat spkTocHtml) dan
   TIDAK memakai kelas kerapatan ini; agar tetap satu halaman, barisnya
   diperkecil oleh muatkanToc() di spkPageScript. */
function spkTocDensity(n){
  n = Number(n)||0;
  if(n > 28) return ' d3';
  if(n > 22) return ' d2';
  if(n > 16) return ' d1';
  return '';
}
function spkTocHtml(data, klausul){
  const esc=fkEsc;
  const list=klausul||[];
  const isPk=spkBentukOf(data)==='PK';
  /* PENTING: pembungkus .spk-toc2 dan <span class="pg"> WAJIB dipertahankan pada
     KEDUA varian — nomorToc() di spkPageScript() mengisi nomor halaman lewat
     querySelectorAll(".spk-toc2 .pg"). */
  const rows=list.map((k,i)=>{
    const no=((i+1)<10 ? ('0'+(i+1)) : String(i+1));
    return '<div class="row"><span class="no">'+esc(no)+'</span>'+
      '<span class="nm">'+spkFmtJudulTitle(k.judul)+'</span>'+
      '<span class="dot"></span><span class="pg">\u2014</span></div>';
  }).join('');
  const kepala=
    '<div class="toc-accent"></div>'+
    '<div class="toc-head">'+
      '<h1>Daftar Isi</h1>'+
      '<div class="toc-meta"><b>'+esc(spkDokLabel(data))+'</b><span>'+esc(data.nomor_kontrak||'\u2014')+'</span></div>'+
    '</div>'+
    '<div class="toc-rule"></div>';
  /* PERJANJIAN/KONTRAK: seluruh baris dibungkus .toc-box (bingkai kotak) dan
     disusun DUA KOLOM (.toc-2k) yang dipisah garis tegak (column-rule). Karena
     kedua kolom diseimbangkan, tinggi garis tegak berhenti tepat di baris data
     terbawah. Daftar isi selalu satu halaman: bila barisnya banyak,
     muatkanToc() di spkPageScript memperkecil baris sampai muat. */
  if(isPk){
    return ''+
    '<section class="spk-page spk-tocpage">'+kepala+
      '<div class="toc-box"><div class="spk-toc2 toc-2k">'+rows+'</div></div>'+
    '</section>';
  }
  /* SURAT PERINTAH KERJA: PERSIS seperti semula — satu kolom, tanpa kotak,
     kerapatan baris diatur kelas d1/d2/d3 dari spkTocDensity. */
  return ''+
  '<section class="spk-page spk-tocpage">'+kepala+
    '<div class="spk-toc2'+spkTocDensity(list.length)+'">'+rows+'</div>'+
  '</section>';
}

/* ---------- Kop & footer berulang pada halaman isi ---------- */
/* Kop DAN kaki halaman kini SAMA untuk Surat Perintah Kerja maupun
   Perjanjian/Kontrak. Dahulu Perjanjian/Kontrak sengaja tanpa kop berulang
   (dan halaman isinya berbingkai); atas permintaan, perlakuan khusus itu
   dihapus sehingga kedua bentuk dokumen tampil identik — hanya nama dokumen
   pada kop yang berbeda. */
function spkRunHeadHtml(data){
  const esc=fkEsc;
  const logo = SPK_LOGO_SRC? '<img src="'+SPK_LOGO_SRC+'" alt="PLN">' : '';
  return '<div class="spk-rhd">'+
    '<div class="l">'+logo+'<div class="o"><span>PT PLN (PERSERO)</span><b>UP3 Masohi</b></div></div>'+
    '<div class="r"><b>'+esc(spkDokLabel(data))+'</b><span>'+esc(data.nomor_kontrak||'\u2014')+'</span></div>'+
  '</div>';
}
function spkRunFootHtml(){
  /* CSS (spkDocCss2) menata footer lewat .ft-row yang display:flex. Sebelumnya
     .l/.c/.r ditaruh langsung di .spk-rft tanpa .ft-row, sehingga ketiganya
     menumpuk rata kiri. Nomor halaman (.ft-pg) diisi oleh spkPageScript().
     CATATAN: kaki halaman SAMA untuk Surat Perintah Kerja maupun
     Perjanjian/Kontrak — yang ditiadakan pada Perjanjian/Kontrak hanyalah KOP
     berulang (lihat spkRunHeadHtml). */
  return '<div class="spk-rft">'+
    '<div class="ft-row">'+
      '<div class="l">PIHAK PERTAMA <span class="ln"></span></div>'+
      '<div class="c"><div class="ft-unit">UP3 MASOHI</div><div class="ft-pg">&#8203;</div></div>'+
      '<div class="r"><span class="ln"></span> PIHAK KEDUA</div>'+
    '</div>'+
  '</div>';
}

/* Nama PIHAK PERTAMA yang dipakai di SEMUA blok tanda tangan:
   "PT PLN (Persero) " + nama unit dari data (mail merge).
   Bila data unit kosong, dipakai cadangan "Unit Pelaksana Pelayanan Pelanggan Masohi".
   Bila nama unit dari data sudah diawali "PT PLN", tidak ditempeli lagi agar tak dobel. */
function spkOrgP1(ctx){
  const unit = String((ctx && ctx.p1_nama_singkat) || '').trim() || 'Unit Pelaksana Pelayanan Pelanggan Masohi';
  return /^PT\s*PLN/i.test(unit) ? unit : ('PT PLN (Persero) ' + unit);
}

/* ---------- Blok tanda tangan (1 rangkap) ---------- */
function spkSignBlockHtml(ctx, rangkap){
  const esc=fkEsc;
  /* Tabel tanda tangan dipecah menjadi DUA BARIS:
       baris 1 (sg-head) : "PIHAK …" + nama instansi
       baris 2 (sg-body) : nama wakil (bergaris bawah) + jabatan
     Tinggi baris tabel selalu sama untuk kedua kolom, sehingga nama & jabatan
     PIHAK KEDUA tetap SEJAJAR dengan PIHAK PERTAMA walau nama instansinya
     memakan jumlah baris yang berbeda (mis. 2 baris vs 3 baris). */
  return '<div class="spk-signpage">'+
    '<table class="spk-sign">'+
      '<tr class="sg-head">'+
        '<td><div class="role">PIHAK KEDUA</div><div class="org">'+esc(ctx.p2_nama_hormat||'')+'</div></td>'+
        '<td><div class="role">PIHAK PERTAMA</div><div class="org">'+esc(spkOrgP1(ctx))+'</div></td>'+
      '</tr>'+
      '<tr class="sg-body">'+
        '<td><div class="materai-slot" aria-hidden="true"></div><div class="nm">'+esc(ctx.p2_wakil||'')+'</div><div class="jab">'+esc(ctx.p2_jabatan||'')+'</div></td>'+
        '<td><div class="materai-slot" aria-hidden="true"></div><div class="nm">'+esc(ctx.p1_wakil||'')+'</div><div class="jab">'+esc(ctx.p1_jabatan||'')+'</div></td>'+
      '</tr>'+
    '</table>'+
  '</div>';
}

/* ---------- Blok tanda tangan LAMPIRAN ----------
   Sesuai contoh: dua kolom — PIHAK KEDUA (kiri) & PIHAK PERTAMA (kanan),
   dengan baris tanggal "Masohi, <tgl>" di atas kolom PIHAK PERTAMA. */
function spkLampSignBlockHtml(ctx, data){
  const esc=fkEsc;
  // Tanggal: "Masohi, 03 Juli 2026" (hari di-nol-depankan agar sama dengan contoh)
  let tglLamp='';
  const raw=(data && data.tanggal_kontrak) ? String(data.tanggal_kontrak) : '';
  const p=raw.split('-');
  if(p.length===3){ tglLamp=(('0'+(+p[2])).slice(-2))+' '+(SPK_BULAN[(+p[1])-1]||'')+' '+p[0]; }
  else{ tglLamp=String(ctx.tanggal_kontrak||''); }
  const kotaTtd = (data && data.kota_ttd) ? String(data.kota_ttd) : 'Masohi';
  const orgP1 = spkOrgP1(ctx);   /* sama dengan tanda tangan akhir SPK */
  /* Sama seperti tanda tangan SPK: dipecah menjadi baris kepala (tanggal +
     "PIHAK …" + nama instansi) dan baris nama/jabatan, agar kedua kolom SEJAJAR
     walau nama instansi PIHAK PERTAMA memakan lebih banyak baris. */
  return '<div class="spk-signpage spk-lampsign">'+
    '<table class="spk-sign">'+
      '<tr class="sg-head">'+
        // Kolom kiri: PIHAK KEDUA (penyedia). Baris tanggal dikosongkan (spacer) agar
        // kedua kolom sejajar dengan kolom kanan yang memuat tanggal.
        '<td><div class="ttd-date">&nbsp;</div>'+
          '<div class="role">PIHAK KEDUA</div>'+
          '<div class="org">'+esc(ctx.p2_nama_hormat||'')+'</div></td>'+
        // Kolom kanan: PIHAK PERTAMA (PLN), dengan tanggal di atas.
        '<td><div class="ttd-date">'+esc(kotaTtd)+', '+esc(tglLamp)+'</div>'+
          '<div class="role">PIHAK PERTAMA</div>'+
          '<div class="org">'+esc(orgP1)+'</div></td>'+
      '</tr>'+
      '<tr class="sg-body">'+
        '<td><div class="materai-slot" aria-hidden="true"></div><div class="nm">'+esc(ctx.p2_wakil||'')+'</div>'+
          '<div class="jab">'+esc(ctx.p2_jabatan||'')+'</div></td>'+
        '<td><div class="materai-slot" aria-hidden="true"></div><div class="nm">'+esc(ctx.p1_wakil||'')+'</div>'+
          '<div class="jab">'+esc(ctx.p1_jabatan||'')+'</div></td>'+
      '</tr>'+
    '</table>'+
  '</div>';
}

/* ---------- Lampiran: dokumen bergaya Perhitungan HPS ---------- */
function spkLampOfData(data){
  const L=(data && data.__lampiran && typeof data.__lampiran==='object') ? data.__lampiran : {items:[]};
  const items=Array.isArray(L.items)?L.items:[];
  return items.map(it=>spkLampNormItem(it));
}
/* Gaya penomoran Judul/Sub-Judul untuk dokumen Lampiran: diambil LANGSUNG dari
   record Perhitungan HPS yang tertaut, agar kolom No pada Lampiran SPK selalu
   identik dengan dokumen HPS — termasuk untuk kontrak lama yang disimpan sebelum
   setting ini ikut disalin ke __lampiran. Urutan sumber:
     1) record HPS yang tertaut (paling sahih; ikut bila HPS diubah),
     2) salinan pada __lampiran (bila record HPS tak ditemukan/ belum dimuat),
     3) default lama (judul tanpa nomor, sub-judul 'A') bila tidak tertaut sama sekali. */
function spkLampNumCfg(data){
  const L=((data&&data.__lampiran&&typeof data.__lampiran==='object')?data.__lampiran:{});
  const pick=(v)=>(['','A','a','I','i'].indexOf(v)>=0)?v:null;   // '' = sah (tanpa nomor)
  let hSt=null;
  try{
    const list=(typeof records_hps!=='undefined' && records_hps)?records_hps:[];
    /* hpsId adalah id RECORD HPS, sedangkan spkCariHps() mencocokkan dpId —
       jadi cari by-id dulu, baru fallback ke pencocokan dpId/nama. */
    let rec = L.hpsId ? (list.find(r=>String(r.id)===String(L.hpsId))||null) : null;
    if(!rec) rec = spkCariHps(data.__dpId, L.hpsNama||data.__dpNama||data.nama_pekerjaan);
    if(rec) hSt=hpsRecordToState(rec);
  }catch(e){ console.error('spkLampNumCfg:',e); }
  const jHps = hSt?pick(hSt.judulNum):null;
  const sHps = hSt?pick(hSt.subjudulNum):null;
  const jL   = pick(L.judulNum);
  const sL   = pick(L.subjudulNum);
  const tertaut = !!(hSt || L.hpsId);
  return {
    judulNum:    (jHps!=null)?jHps:((jL!=null)?jL:''),
    subjudulNum: (sHps!=null)?sHps:((sL!=null)?sL:(tertaut?'':'A'))
  };
}
function spkLampHpsState(data){
  const dp=(typeof records_dp!=='undefined' && Array.isArray(records_dp))
    ? records_dp.find(r=>String(r.id)===String(data.__dpId)) : null;
  const dinfo=(dp && dp.state && dp.state.info) ? dp.state.info : {};
  /* Info tetap dari kontrak (nama/lokasi/Nilai Pekerjaan) — bukan dari HPS. */
  const info={
    nama: data.nama_pekerjaan||'', lokasi: data.lokasi_pekerjaan||'',
    nilai: spkNum(data.nilai_pekerjaan),
    no_anggaran: data.no_anggaran||'', tgl_anggaran: data.tgl_anggaran||'',
    metode: dinfo.metode||'', pengguna: dinfo.pengguna || data.nama_pengguna || '',
    pejabat: dinfo.pejabat||'', tgl_hps: data.tanggal_kontrak||''
  };

  /* SUMBER UTAMA: record Perhitungan HPS yang tertaut. Dengan mengambil item,
     gaya nomor (judulNum/subjudulNum), DAN sakelar Judul/Sub-Judul (judulOn/
     subjudulOn) langsung dari HPS, penomoran judul & sub-judul pada Lampiran SPK
     SELALU identik dengan dokumen Perhitungan HPS — termasuk bila HPS diubah
     setelah kontrak dibuat. Pencocokan: by-id (hpsId) dulu, lalu dpId/nama. */
  let hSt=null;
  try{
    const L0=((data&&data.__lampiran&&typeof data.__lampiran==='object')?data.__lampiran:{});
    const list=(typeof records_hps!=='undefined' && records_hps)?records_hps:[];
    let rec = L0.hpsId ? (list.find(r=>String(r.id)===String(L0.hpsId))||null) : null;
    if(!rec) rec = spkCariHps(data.__dpId, L0.hpsNama||data.__dpNama||data.nama_pekerjaan);
    if(rec) hSt=hpsRecordToState(rec);
  }catch(e){ console.error('spkLampHpsState:',e); }
  if(hSt){
    const hItems=(Array.isArray(hSt.items)&&hSt.items.length)?hSt.items:[hpsBlankItem()];
    return {
      info,
      jumlahItem: hItems.length||1,
      judulOn: hSt.judulOn, judulNum: hSt.judulNum,
      subjudulOn: hSt.subjudulOn, subjudulNum: hSt.subjudulNum,
      items: hItems
    };
  }

  /* CADANGAN (HPS tak ditemukan / kontrak lama): pakai salinan beku pada
     __lampiran. Sakelar judul/sub-judul disimpulkan dari isi, gaya nomor dari
     spkLampNumCfg. */
  const items=spkLampOfData(data);
  const num=spkLampNumCfg(data);
  const anyJudul=items.some(it=>String(it.judul||'').trim()!=='');
  const anySub=items.some(it=>String(it.subjudul||'').trim()!=='');
  return {
    info,
    jumlahItem: items.length||1,
    judulOn: anyJudul?'Ya':'Tidak',
    judulNum: num.judulNum,
    subjudulOn: anySub?'Ya':'Tidak',
    subjudulNum: num.subjudulNum,
    items: items.length?items:[spkLampNormItem({})]
  };
}
/* Memakai pembangun dokumen HPS agar hasilnya PERSIS sama, lalu:
   - judul dokumen  -> LAMPIRAN SURAT PERINTAH KERJA
   - nomor dokumen  -> nomor kontrak
   - "Rencana Anggaran Biaya" -> "Nilai Pekerjaan" */
function spkLampiranDocInner(data){
  let html='';
  const sv = (typeof hpsPreviewState!=='undefined') ? hpsPreviewState : null;
  try{
    hpsPreviewState = spkLampHpsState(data);
    html = hpsBuildDocHtml();
  }catch(e){ console.error(e); html='<div class="fkl-doc"><p>Lampiran belum dapat ditampilkan.</p></div>'; }
  finally{ hpsPreviewState = sv; }
  html = html.replace('HARGA PERKIRAAN SENDIRI (HPS)', 'LAMPIRAN '+spkDokLabel(data));
  html = html.replace(/<div class="fkl-doc-docno">[\s\S]*?<\/div>/,
    '<div class="fkl-doc-docno">'+fkEsc(data.nomor_kontrak||'\u2014')+'</div>');
  html = html.replace('>Rencana Anggaran Biaya<', '>Nilai Pekerjaan<');
  /* Blok "DATA PEKERJAAN" bawaan HPS memuat baris yang tidak relevan untuk Lampiran
     SPK (nilainya sudah tampil di cover & di tabel rincian). Baris berikut dibuang
     HANYA di Lampiran — dokumen Perhitungan HPS tidak terpengaruh. */
  ['Nilai Pekerjaan','Metode Pengadaan'].forEach(function(lbl){
    const pola = lbl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp('<tr>\\s*<td class="k">'+pola+'<\\/td>[\\s\\S]*?<\\/tr>'), '');
  });
  /* Judul seksi "A Data Pekerjaan" & "B Uraian Pekerjaan & Rincian Harga" juga
     dibuang di Lampiran: yang tersisa hanya Nama/Lokasi Pekerjaan + tabel harga. */
  html = html.replace(/<div class="fkl-sec-h">[\s\S]*?<\/div>/g, '');
  /* Ganti blok tanda tangan bawaan HPS (Pengguna Barang/Jasa & Pejabat Pelaksana)
     dengan blok tanda tangan LAMPIRAN dua pihak (PIHAK KEDUA & PIHAK PERTAMA).

     PENTING: tanda tangan ditulis ULANG DI DALAM <tr class="ttd-row"> yang sama,
     sehingga tetap berada di <tbody class="hps-tail"> bersama Jumlah / DPP /
     PPn / Jumlah Total / Terbilang. Sebelumnya baris itu DIHAPUS lalu tanda
     tangan ditempel di LUAR tabel, sehingga ikatannya putus: tanda tangan bisa
     pindah sendirian ke halaman berikutnya dan meninggalkan baris rekapnya.
     Dengan cara ini perilakunya sama persis dengan Perhitungan HPS. */
  try{
    const ctx=spkBuildCtx(data||{});
    const ttd=spkLampSignBlockHtml(ctx, data||{});
    html = html.replace(/<tr class="ttd-row">[\s\S]*?<\/table><\/td><\/tr>/,
      '<tr class="ttd-row"><td colspan="9">'+ttd+'</td></tr>');
  }catch(e){ console.error(e); }
  /* Pepatkan lebar kolom Sat & Vol agar hanya cukup untuk teks terpanjangnya
     (data atau judul kolom), lalu berikan seluruh sisanya ke Uraian Pekerjaan.
     Colgroup bawaan HPS ditimpa KHUSUS di Lampiran; dokumen HPS tidak terpengaruh. */
  try{
    const lampSt=spkLampHpsState(data||{});
    const cw=spkLampColPct(lampSt.items, jsCfg(lampSt));
    html = html.replace(/<colgroup>[\s\S]*?<\/colgroup>/,
      '<colgroup><col style="width:'+cw.no+'%"><col style="width:'+cw.ur+'%"><col style="width:'+cw.sat+'%"><col style="width:'+cw.vol+'%">'+
        '<col style="width:11%"><col style="width:11%"><col style="width:11%"><col style="width:11%"><col style="width:11%"></colgroup>');
  }catch(e){ console.error(e); }
  return html;
}

/* ---------- Skrip halaman: nomor halaman Daftar Isi + PEMISAH HALAMAN ----------
   Satu perhitungan dipakai untuk dua hal sekaligus, supaya tidak pernah beda:
     1) Nomor halaman pada Daftar Isi.
     2) Garis "batas halaman" pada pratinjau (lapisan .spk-guide), yang digambar
        tepat di titik tempat browser akan memotong halaman ketika dicetak.

   Cara hitung (mengikuti mesin cetak browser):
     - Tinggi area cetak A4 = 297mm - margin atas 12mm - margin bawah 12mm
       = 273mm  (lihat @page pada spkDocCss2).
     - Pada lembar isi (.spk-flow) kop & footer dipasang lewat <thead>/<tfoot>
       sehingga BERULANG di setiap halaman fisik. Jadi ruang isi per halaman
       = 273mm - tinggi <thead> - tinggi <tfoot>.
     - Batas halaman ke-k berada pada kelipatan k x ruang-isi, dihitung dari awal
       sel <tbody>. Untuk lembar tanpa kop/footer (Lampiran) ruang isi = 273mm.
   Garis hanya tampil di layar (@media print menyembunyikannya). */
function spkPageScript(){
  /* Isi kontrak & lampiran DIPECAH menjadi lembar A4 sungguhan (.spk-sheet),
     sama seperti Cover & Daftar Isi. Tiap lembar membawa kop (spkRunHeadHtml)
     di atas dan footer paraf (spkRunFootHtml) di bawah, sehingga pada pratinjau
     batas kertas, kop, dan footer terlihat persis seperti hasil cetak.
     Nomor halaman pada Daftar Isi diisi dari nomor lembar yang sebenarnya. */
  var js=[
    '(function(){',
    'var DONE=false, TRY=0;',
    /* ISPK = dokumen berbentuk Perjanjian/Kontrak. Perilaku keep-together
       tambahan di bawah hanya berlaku bila ISPK true; Surat Perintah Kerja
       memakai perilaku lama tanpa perubahan. */
    'var ISPK=!!document.querySelector(".spk-doc.spk-pk");',
    'function mm2px(mm){var d=document.createElement("div");',
    ' d.style.cssText="position:absolute;visibility:hidden;left:-9999px;height:"+mm+"mm";',
    ' document.body.appendChild(d);var h=d.getBoundingClientRect().height;',
    ' d.parentNode.removeChild(d);return h;}',
    'function els(n){var o=[],k=n.firstChild;while(k){if(k.nodeType===1)o.push(k);k=k.nextSibling;}return o;}',
    'function hasCls(n,c){return n.classList&&n.classList.contains(c);}',
    /* blok yang TIDAK boleh dipecah (dipindah utuh ke lembar berikutnya) */
    'function atom(n){',
    ' if(n.nodeType!==1) return true;',
    ' var t=n.tagName;',
    ' if(t==="P"||t==="TR"||t==="IMG"||t==="BR"||t==="HR"||t==="LI"||t==="THEAD"||t==="TFOOT"||t==="COLGROUP") return true;',
    /* tbody.hps-tail = rekap (Jumlah/DPP/PPn/Total/Terbilang) + tanda tangan.
       Diperlakukan sebagai SATU blok utuh: bila tak cukup ruang, seluruhnya turun
       bersama ke halaman berikutnya — tanda tangan tidak pernah berdiri sendiri. */
    ' if(hasCls(n,"hps-tail")) return true;',
    ' if(hasCls(n,"spk-keep")||hasCls(n,"spk-pknum")) return true;',
    ' if(hasCls(n,"spk-cl-h")||hasCls(n,"spk-kv")||hasCls(n,"spk-kvgrp")||hasCls(n,"spk-party")||hasCls(n,"spk-bab")||hasCls(n,"spk-sign")||hasCls(n,"spk-sign-eyebrow")||hasCls(n,"spk-lampsign")) return true;',
    ' return els(n).length===0;',
    '}',
    /* Sub-judul = paragraf dengan penomoran BERTINGKAT di awal (mis. "1.1", "1.3",
       "2.2", "3.1.1") YANG BUKAN kalimat isi. Sengaja DIBATASI supaya kontrol
       keep-with-next TIDAK salah memindahkan:
         - nomor tunggal   : "1. Value kepada Pelanggan:"  (bukan sub-judul)
         - huruf           : "a. …", "b. …"                (bukan sub-judul)
         - kalimat pengantar: "… sebagai berikut:"         (tak berawalan nomor)
         - kalimat isi ber-nomor bertingkat: "5.1. Sanksi atau denda …."  (diakhiri
           tanda kalimat . ; , -> dianggap ISI, bukan judul)
       Judul asli seperti "1.3. Maksud dan Tujuan" atau "2.2. Hak dan Kewajiban PIHAK
       KEDUA:" tetap terdeteksi (berakhir huruf atau ":"). */
    'function isSubHead(n){',
    ' if(n.nodeType!==1 || n.tagName!=="P") return false;',
    ' if(hasCls(n,"spk-ph")||hasCls(n,"spk-sign-eyebrow")||hasCls(n,"spk-bab")) return false;',
    ' var tx=(n.textContent||"").replace(/^[\\s\\u00A0]+/,"").replace(/[\\s\\u00A0]+$/,"");',
    ' if(!/^\\d+\\.\\d+/.test(tx)) return false;',       /* harus penomoran bertingkat (X.Y ...) */
    ' if(!n.nextElementSibling) return false;',          /* harus ada isian di bawahnya */
    ' var last=tx.charAt(tx.length-1);',
    ' if(last==="."||last===";"||last===",") return false;',   /* kalimat ISI, bukan judul */
    ' return true;',
    '}',
    'function build(sec, PH, UID){',
    ' var run=sec.querySelector("table.spk-run");',
    ' var headHtml="", footHtml="";',
    ' var holder=document.createElement("div");',
    ' if(run){',
    '   var th=run.querySelector("thead > tr > td"), tf=run.querySelector("tfoot > tr > td"), tb=run.querySelector("tbody > tr > td");',
    '   headHtml=th?th.innerHTML:""; footHtml=tf?tf.innerHTML:"";',
    '   if(tb){ while(tb.firstChild) holder.appendChild(tb.firstChild); }',
    ' }else{ while(sec.firstChild) holder.appendChild(sec.firstChild); }',
    ' var extra=(" "+sec.className+" ").replace(" spk-page "," ").replace(" spk-flow "," ").replace(/\\s+/g," ").trim();',
    ' var sheets=[], body=null, stack=[];',
    /* MINCL = gerbang pengecekan: bila sisa ruang di bawah < ini, klausul diuji
       apakah muat utuh; jika tidak muat, DIUKUR berapa banyak isi yang tampak di bawah
       JUDUL klausul (lihat blok put()). MINBODY = tinggi minimum isi yang harus terlihat
       (~3 baris); bila kurang, seluruh klausul (judul + isi) digeser ke halaman
       berikutnya — judul klausul tak boleh tampil dengan hanya 1-2 baris isi. */
    ' var MINCL=mm2px(46);',
    ' var MINBODY=mm2px(18);',
    /* Runway minimum untuk SUB-JUDUL: bila sisa ruang di bawah kurang dari ini,
       sub-judul beserta isiannya digeser ke halaman berikutnya (menghindari sub-judul
       + hanya 1-2 baris isian yang menggantung di dasar halaman). */
    ' var MINSUBHEAD=mm2px(26);',
    ' function mk(){',
    '   var sh=document.createElement("section");',
    '   sh.className=("spk-page spk-sheet "+extra).trim();',
    '   var h=null,f=null;',
    '   if(headHtml){ h=document.createElement("div"); h.className="sh-hd"; h.innerHTML=headHtml; sh.appendChild(h); }',
    '   var b=document.createElement("div"); b.className="sh-bd"; sh.appendChild(b);',
    '   if(footHtml){ f=document.createElement("div"); f.className="sh-ft"; f.innerHTML=footHtml; sh.appendChild(f); }',
    '   sec.parentNode.insertBefore(sh, sec);',
    '   sheets.push(sh);',
    '   var hh=h?h.getBoundingClientRect().height:0;',
    '   var fh=f?f.getBoundingClientRect().height:0;',
    /* Tinggi badan lembar = PH dikurangi tinggi kop & kaki. Pada PERJANJIAN/
       KONTRAK ditambah ruang yang direbut margin negatif .sh-hd/.sh-ft
       (2 x 13,4mm = 26,8mm; lihat CSS "KOP NAIK & KAKI TURUN"); tanpa penambah
       ini tiap lembar menyisakan pita kosong setinggi 26,8mm di atas kaki
       halaman. Surat Perintah Kerja dan lembar Lampiran memakai perhitungan apa
       adanya karena margin negatif itu tidak berlaku padanya. */
    '   var EXPK=(ISPK && extra.indexOf("spk-lampsheet")<0) ? mm2px(26.8) : 0;',
    '   b.style.height=Math.max(80,(PH-hh-fh-6+EXPK))+"px";',
    '   b.style.overflow="hidden";',
    '   body=b;',
    '   for(var i=0;i<stack.length;i++){',
    '     var sl=stack[i].src.cloneNode(false);',
    '     sl.setAttribute("data-spksh", stack[i].uid);',
    '     if(sl.classList) sl.classList.add("spk-cont");',
    '     if(sl.tagName==="TABLE"){',
    '       var cg=stack[i].src.querySelector("colgroup"); if(cg) sl.appendChild(cg.cloneNode(true));',
    '       var td=stack[i].src.querySelector("thead");    if(td) sl.appendChild(td.cloneNode(true));',
    '     }',
    '     (i===0?body:stack[i-1].el).appendChild(sl);',
    '     stack[i].el=sl;',
    '   }',
    '   return body;',
    ' }',
    ' function tgt(){ return stack.length? stack[stack.length-1].el : body; }',
    ' function over(){ return body.scrollHeight > body.clientHeight+1; }',
    ' function kosong(){ return !((body.textContent||"").replace(/[\\s\\u00A0]/g,"")) && !body.querySelector("img,table"); }',
    ' function usedBottom(){ var k=els(body); if(!k.length) return 0; var bt=body.getBoundingClientRect().top; return k[k.length-1].getBoundingClientRect().bottom - bt; }',
    ' function remain(){ return body.clientHeight - usedBottom(); }',
    /* ==== PEMECAHAN PARAGRAF ANTAR-HALAMAN (alir seperti Word) ====
       Titik potong = batas kata (setelah spasi), tidak memotong di tengah kata
       maupun di dalam kotak nomor (span.n). Kepala tetap membawa nomor & indent
       gantung; ekor jadi lanjutan (text-indent:0, margin-atas 0) sejajar teks. */
    ' function wordPoints(p){',
    '   var pts=[], w=document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null, false), tn;',
    '   while(tn=w.nextNode()){',
    '     var inN=false, a=tn.parentNode;',
    '     while(a && a!==p){ if(a.classList && a.classList.contains("n")){ inN=true; break; } a=a.parentNode; }',
    '     if(inN) continue;',
    '     var v=tn.nodeValue||"";',
    '     for(var k=1;k<v.length;k++){ if(/[\\s\\u00A0]/.test(v.charAt(k-1)) && !/[\\s\\u00A0]/.test(v.charAt(k))) pts.push({node:tn, offset:k}); }',
    '   }',
    '   return pts;',
    ' }',
    /* Ukur jumlah baris sebuah blok teks (tinggi / tinggi-baris). Dipakai kendali
       orphan/widow di bawah agar tak ada butir/paragraf yang tersisa 1-2 baris di
       batas halaman. */
    ' function _lineH(el){ var s=getComputedStyle(el); var lh=parseFloat(s.lineHeight); if(!lh||isNaN(lh)){ var fs=parseFloat(s.fontSize); lh=(fs||11)*1.3; } return lh||14; }',
    ' function _nLines(el){ var lh=_lineH(el); var h=el.getBoundingClientRect().height; return Math.max(1, Math.round(h/lh)); }',
    ' function _measLines(el, t){ var vis=el.style.visibility; el.style.visibility="hidden"; t.appendChild(el); var n=_nLines(el); t.removeChild(el); el.style.visibility=vis; return n; }',
    ' function _measHeight(el, t){ var vis=el.style.visibility; el.style.visibility="hidden"; t.appendChild(el); var h=el.getBoundingClientRect().height; t.removeChild(el); el.style.visibility=vis; return h; }',
    /* Titik-potong yang JATUH TEPAT DI BATAS BARIS ALAMI. Dari semua batas kata
       (wordPoints), sisakan hanya kata yang MENGAWALI sebuah baris visual baru
       (top-nya turun dibanding kata sebelumnya). Memotong di sini membuat KEPALA
       selalu berisi baris-baris UTUH (bukan separuh baris), sehingga saat baris
       terakhir kepala di-justify penuh ia tampak wajar seperti Word — tidak ada
       2 kata yang direntangkan berjauhan. node ditempel sementara agar terukur. */
    ' function lineStartPoints(node, t){',
    '   var pts=wordPoints(node); if(!pts.length) return pts;',
    '   var reattach=(node.parentNode!==t); if(reattach) t.appendChild(node);',
    '   var out=[], prevTop=null, EPS=2;',
    '   for(var i=0;i<pts.length;i++){',
    '     var nd=pts[i].node, off=pts[i].offset, len=(nd.nodeValue||"").length;',
    '     if(off>=len) continue;',
    '     var r=document.createRange(); r.setStart(nd,off); r.setEnd(nd,off+1);',
    '     var rc=r.getClientRects(); if(!rc||!rc.length) continue;',
    '     var top=rc[0].top;',
    '     if(prevTop===null){ prevTop=top; continue; }',
    '     if(top>prevTop+EPS){ out.push(pts[i]); prevTop=top; }',
    '     else if(top>prevTop) prevTop=top;',
    '   }',
    '   if(reattach) t.removeChild(node);',
    '   return out;',
    ' }',
    ' function splitParaToFit(node, t){',
    /* MINHEAD = minimal baris yang WAJIB tersisa di dasar halaman ini (orphan).
       MINTAIL = minimal baris yang WAJIB ikut pindah ke halaman berikutnya (widow).
       -> tidak boleh ada butir/kalimat yang cuma menyisakan 1-2 baris di batas
          halaman; bila terjadi, seluruh butir/paragraf digeser utuh. */
    '   var MINHEAD=3, MINTAIL=2;',
    /* HANYA memotong di batas baris alami -> kepala berisi baris utuh, tak ada
       baris pendek yang direntangkan justify saat pindah halaman. */
    '   var pts=lineStartPoints(node, t); if(!pts.length) return null;',
    '   var lo=0, hi=pts.length-1, best=-1, guard=0;',
    '   while(lo<=hi && guard++<40){',
    '     var mid=(lo+hi)>>1, tmp=node.cloneNode(false), r=document.createRange();',
    '     r.setStart(node,0); r.setEnd(pts[mid].node, pts[mid].offset);',
    '     tmp.appendChild(r.cloneContents()); t.appendChild(tmp);',
    '     var fits=!over(); t.removeChild(tmp);',
    '     if(fits){ best=mid; lo=mid+1; } else { hi=mid-1; }',
    '   }',
    '   if(best<0) return null;',
    '   var best0=best;',
    '   function _cut(bi){',
    '     var head=node.cloneNode(false), rh=document.createRange();',
    '     rh.setStart(node,0); rh.setEnd(pts[bi].node, pts[bi].offset); head.appendChild(rh.cloneContents());',
    '     var tail=node.cloneNode(false), rt=document.createRange();',
    '     rt.setStart(pts[bi].node, pts[bi].offset); rt.setEnd(node, node.childNodes.length); tail.appendChild(rt.cloneContents());',
    '     return {head:head, tail:tail};',
    '   }',
    '   var ht=_cut(best);',
    '   if(!((ht.tail.textContent||"").replace(/[\\s\\u00A0]/g,""))) return null;',
    /* KENDALI WIDOW: bila hanya <MINTAIL baris yang pindah ke halaman berikutnya
       (mis. hanya kata "Perjanjian/Kontrak." pada butir 11.6), mundurkan titik
       potong agar minimal MINTAIL baris ikut pindah — kepala melepas baris
       terakhirnya. Berhenti bila kepala sudah mentok di awal. */
    '   var g2=0;',
    '   while(best>0 && g2++<80){',
    '     if(_measLines(ht.tail, t) >= MINTAIL) break;',
    '     best--; ht=_cut(best);',
    '   }',
    '   if(!((ht.tail.textContent||"").replace(/[\\s\\u00A0]/g,""))) return null;',
    /* KENDALI ORPHAN: bila hanya <MINHEAD baris yang tersisa di dasar halaman ini,
       jangan dipecah — pindahkan SELURUH butir/paragraf ke halaman berikutnya
       (return null -> pemanggil menaruhnya utuh di lembar baru). Kecuali bila
       paragraf memang lebih tinggi dari satu halaman penuh (mustahil utuh): tetap
       pecah pada titik-muat-maksimum supaya tak ada isi yang hilang. */
    '   if(_measLines(ht.head, t) < MINHEAD){',
    '     if(_measHeight(node, t) <= (body.clientHeight - 4)) return null;',
    '     ht=_cut(best0);',
    '     if(!((ht.tail.textContent||"").replace(/[\\s\\u00A0]/g,""))) return null;',
    '   }',
    '   ht.head.style.marginBottom="0"; if((node.style.textAlign||"")==="justify") ht.head.style.textAlignLast="justify";',
    '   ht.tail.style.textIndent="0"; ht.tail.style.marginTop="0";',
    '   t.appendChild(ht.head); return ht.tail;',
    ' }',
    /* ==== JUDUL BUTIR/AYAT YANG MENGGANTUNG DI DASAR HALAMAN ====
       Baris seperti "3. Sanksi-Sanksi" adalah JUDUL sebuah butir/ayat; isinya ada di
       paragraf berikutnya. Bila isi itu tidak muat lagi di halaman ini dan juga tidak
       bisa dipecah (kendali orphan), judulnya tertinggal SENDIRIAN di dasar halaman
       sementara isinya pindah ke halaman berikutnya. Di sini judul itu ikut diboyong
       supaya judul & isinya selalu berada di halaman yang sama.
       Syarat agar tidak salah boyong: paragraf terakhir di halaman ini harus
         - diawali nomor ("3.", "3)"),
         - TIDAK diakhiri tanda kalimat . ; ,  -> kalimat isi bukan judul,
         - pendek & hanya satu baris,
         - bukan satu-satunya isi halaman (kalau ditarik, halaman jadi kosong).
       Berlaku hanya untuk Perjanjian/Kontrak (ISPK); paginasi Surat Perintah Kerja
       tidak diubah. */
    ' function _numHead(c){',
    '   if(!c || c.nodeType!==1 || c.tagName!=="P") return false;',
    '   if(hasCls(c,"spk-cl-h")||hasCls(c,"spk-bab")||hasCls(c,"spk-party-h")||hasCls(c,"spk-ph")||hasCls(c,"spk-kv")||hasCls(c,"spk-sign-eyebrow")) return false;',
    '   var tx=(c.textContent||"").replace(/[\\s\\u00A0]+/g," ").replace(/^ /,"").replace(/ $/,"");',
    '   if(!/^\\d+(?:\\.\\d+)*[.)]/.test(tx)) return false;',
    '   if(/[.;,][\\s\\u00A0]*$/.test(tx)) return false;',
    '   if(tx.length>90) return false;',
    '   return _nLines(c)<=1;',
    ' }',
    ' function tarikJudulMenggantung(node){',
    '   if(!ISPK) return null;',
    '   if(node && node.nodeType===1 && (hasCls(node,"spk-clause")||hasCls(node,"spk-cl-h")||hasCls(node,"spk-bab"))) return null;',
    /* Judul bertingkat bisa MENUMPUK di dasar halaman (mis. "2." lalu "2.1."),
       jadi ditarik berturut-turut, maksimal 3 tingkat. */
    '   var out=[], g=0;',
    '   while(g++<3){',
    '     var kk=els(tgt());',
    '     if(kk.length<2) break;',
    '     var c=kk[kk.length-1];',
    '     if(!_numHead(c)) break;',
    '     c.parentNode.removeChild(c); out.unshift(c);',
    '   }',
    '   return out.length ? out : null;',
    ' }',
    /* Buka lembar baru SEKALIGUS memboyong judul yang menggantung. Dipakai di
       SEMUA titik yang memulai halaman baru karena isi tak muat. */
    ' function mkTarik(node){',
    '   var _j=tarikJudulMenggantung(node);',
    '   mk();',
    '   if(_j) for(var _i=0;_i<_j.length;_i++) tgt().appendChild(_j[_i]);',
    ' }',
    ' function put(node){',
    /* Penanda halaman baru: blok ber-class "spk-forcepage" (paragraf "Maka dengan ini
       PIHAK PERTAMA menugaskan...") memulai lembar baru HANYA bila bagian pembuka
       (identitas PARA PIHAK + daftar "Berdasarkan": nomor-nomor berita acara) masih
       muat dalam SATU lembar.

       Alasannya: bila daftar berita acara sendiri sudah tumpah ke lembar kedua,
       memaksa halaman baru lagi akan menyisakan lembar kedua yang nyaris kosong dan
       mendorong paragraf ini ke lembar ketiga. Maka dalam keadaan itu paragraf ini
       DISAMBUNG langsung setelah berita acara terakhir.
       sheets.length === 1  -> pembuka muat 1 lembar  -> paksa lembar baru
       sheets.length >= 2   -> pembuka sudah > 1 lembar -> sambung di lembar berjalan */
    '   if(node.nodeType===1 && hasCls(node,"spk-forcepage") && !kosong()){',
    '     if(sheets.length<=1){ mk(); }',
    '     else if(node.classList){ node.classList.add("spk-joined"); }',   /* disambung -> beri jarak */
    '   }',
    '   if(node.nodeType===1 && hasCls(node,"spk-signpage")){',
    '     if(!kosong() && body.querySelector(".spk-signpage")){ mk(); tgt().appendChild(node); return; }',
    '     var t0=tgt(); t0.appendChild(node); var fit0=!over(); t0.removeChild(node);',
    '     if(fit0){ t0.appendChild(node); return; }',
    '     var lastCl=null, kk=els(body);',
    '     if(kk.length){ var cand=kk[kk.length-1]; if(hasCls(cand,"spk-clause") && !hasCls(cand,"spk-cont")) lastCl=cand; }',
    '     if(lastCl) body.removeChild(lastCl);',
    '     mk();',
    '     if(lastCl) tgt().appendChild(lastCl);',
    '     tgt().appendChild(node);',
    '     return;',
    '   }',
    '   if(node.nodeType===1 && hasCls(node,"spk-clause") && !hasCls(node,"spk-cont") && !kosong() && remain()<MINCL){',
    '     var _tt=tgt(); _tt.appendChild(node); var _fit=!over(); var _push=false;',   /* klausul yang MUAT utuh di sisa ruang tak perlu digeser -> hindari ruang kosong sia-sia */
    '     if(!_fit){',
    /* Klausul akan terpotong ke halaman berikut. Ukur berapa banyak ISI yang tampak
       di bawah JUDUL klausul pada halaman ini. Bila < MINBODY (~3 baris), judul cuma
       akan ditemani 1-2 baris isi -> geser SELURUH klausul (judul + isi) ke halaman
       berikutnya. */
    '       var _h=node.querySelector(".spk-cl-h");',
    '       var _pb=body.getBoundingClientRect().top + body.clientHeight;',
    '       var _tb=_h ? _h.getBoundingClientRect().bottom : node.getBoundingClientRect().top;',
    '       if((_pb - _tb) < MINBODY) _push=true;',
    '     }',
    '     _tt.removeChild(node);',
    '     if(_push) mk();',
    '   }',
    /* KEEP-WITH-NEXT SUB-JUDUL: sub-judul (mis. "2.2. … :") yang muncul di
       tengah badan klausul tak boleh terdampar dengan hanya 1-2 baris isian di dasar
       halaman. Bila sisa ruang < MINSUBHEAD DAN sudah ada isian klausul di atasnya pada
       halaman ini (els(tgt())>0, jadi bukan judul klausul yang bakal ikut terdorong),
       mulai halaman baru dulu supaya sub-judul + isiannya tampil utuh & rapi. */
    '   if(node.nodeType===1 && node.tagName==="P" && isSubHead(node) && !kosong() && els(tgt()).length>0 && remain()<MINSUBHEAD){ mkTarik(node); }',
    /* KEEP-WITH-NEXT "Berdasarkan :" : judul daftar dasar (nomor-nomor berita acara)
       tak boleh terdampar sendirian di baris paling bawah halaman. Bila sisa ruang
       di bawah < MINSUBHEAD (tak cukup untuk judul + butir pertamanya), mulai halaman
       baru dulu -> "Berdasarkan :" menjadi teks awal di halaman berikutnya. */
    '   if(node.nodeType===1 && node.tagName==="P" && hasCls(node,"spk-berdasar") && !kosong() && remain()<MINSUBHEAD){ mkTarik(node); }',
    /* KEEP-TOGETHER BLOK "Label : nilai" (.spk-kvgrp — mis. Nama Rekening / Nomor
       Rekening / Bank pada pasal Tata Cara Pembayaran): blok ini tidak boleh
       terbelah. Bila sisa ruang di halaman ini tak cukup memuat SELURUH barisnya,
       blok digeser utuh ke halaman berikutnya, dan kalimat pengantar tepat di
       atasnya (yang diakhiri ":") ikut diboyong supaya tidak tertinggal sendirian
       di dasar halaman sebelumnya. */
    '   if(node.nodeType===1 && hasCls(node,"spk-kvgrp") && !kosong()){',
    '     var _kt=tgt(); _kt.appendChild(node); var _kfit=!over(); _kt.removeChild(node);',
    '     if(!_kfit){',
    /* Kumpulkan baris pengantar tepat di atas blok: kalimat berakhiran ":" DAN —
       khusus PK — JUDUL DOKUMEN bernomor (mis. "24. Berita Acara Klarifikasi dan
       Negosiasi") yang menaungi baris No./Tanggal. Semuanya ikut dipindah utuh
       ke lembar berikutnya supaya judul tidak tertinggal sendirian. */
    '       var _leads=[], _kk2=els(tgt()), _guard=0;',
    '       while(_kk2.length && _guard++<3){',
    '         var _cnd=_kk2[_kk2.length-1];',
    '         if(_cnd.tagName!=="P") break;',
    '         var _tx=(_cnd.textContent||"");',
    '         var _colon=/[:\\uFF1A][\\s\\u00A0]*$/.test(_tx);',
    '         var _judul=ISPK && (hasCls(_cnd,"spk-sl")||hasCls(_cnd,"kl1")||hasCls(_cnd,"kl2")) && !/[.;,][\\s\\u00A0]*$/.test(_tx);',
    '         if(!_colon && !_judul) break;',
    '         _cnd.parentNode.removeChild(_cnd); _leads.unshift(_cnd);',
    '         _kk2=els(tgt());',
    '       }',
    '       mk();',
    '       for(var _li=0;_li<_leads.length;_li++) tgt().appendChild(_leads[_li]);',
    '     }',
    '   }',
    '   var t=tgt();',
    '   t.appendChild(node);',
    '   if(!over()) return;',
    '   t.removeChild(node);',
    '   if(!atom(node)){',
    '     var uid=String(++UID.n);',
    '     var sl=node.cloneNode(false);',
    '     sl.setAttribute("data-spksh", uid);',
    '     t.appendChild(sl);',
    '     if(over() && !kosong()){ t.removeChild(sl); mkTarik(node); put(node); return; }',
    '     if(sl.tagName==="TABLE"){',
    '       var cg=node.querySelector("colgroup"); if(cg) sl.appendChild(cg.cloneNode(true));',
    '     }',
    '     stack.push({src:node, el:sl, uid:uid});',
    '     var kids=els(node);',
    '     var isTbl=(node.tagName==="TABLE");',
    '     for(var i=0;i<kids.length;i++){',
    '       var kd=kids[i];',
    /* <colgroup> SUDAH disalin ke cangkang di atas. Bila yang asli ikut ditempel,
       tabel jadi punya DUA colgroup -> jumlah kolom berlipat (9 jadi 18) -> isi
       terjepit ke separuh kiri dan tabel terlihat "gepeng". */
    '       if(isTbl && kd.tagName==="COLGROUP") continue;',
    /* <thead> DISALIN, bukan dipindah, supaya tabel ASLI tetap memilikinya dan
       mk() masih bisa mengulang kop tabel di halaman lanjutan. */
    '       if(isTbl && kd.tagName==="THEAD"){ tgt().appendChild(kd.cloneNode(true)); continue; }',
    '       put(kd);',
    '     }',
    '     stack.pop();',
    '     return;',
    '   }',
    '   if(node.nodeType===1 && node.tagName==="P" && !hasCls(node,"spk-cl-h") && !hasCls(node,"spk-party-h") && !hasCls(node,"spk-bab") && !hasCls(node,"spk-ph") && !hasCls(node,"spk-sign-eyebrow")){',   /* paragraf isi: pecah antar-halaman spy halaman terisi penuh (judul/kop dikecualikan) */
    '     try{ var _tail=splitParaToFit(node, t); if(_tail){ mk(); put(_tail); return; } }catch(_e){}',
    '   }',
    '   if(kosong()){ t.appendChild(node); return; }',   /* blok lebih tinggi dari 1 halaman */
    '   mkTarik(node);',
    '   tgt().appendChild(node);',
    ' }',
    ' mk();',
    ' var nodes=els(holder);',
    ' for(var i=0;i<nodes.length;i++) put(nodes[i]);',
    /* bersihkan cangkang & lembar yang kosong */
    ' for(var i=0;i<sheets.length;i++){',
    '   var shells=sheets[i].querySelectorAll("[data-spksh]");',
    '   for(var j=shells.length-1;j>=0;j--){',
    '     var e=shells[j];',
    '     if(!((e.textContent||"").replace(/[\\s\\u00A0]/g,"")) && !e.querySelector("img,table,td")) e.parentNode.removeChild(e);',
    '   }',
    ' }',
    ' for(var i=sheets.length-1;i>=0;i--){',
    '   var bd=sheets[i].querySelector(".sh-bd");',
    '   if(bd && !((bd.textContent||"").replace(/[\\s\\u00A0]/g,"")) && !bd.querySelector("img,table")) sheets[i].parentNode.removeChild(sheets[i]);',
    ' }',
    ' sec.parentNode.removeChild(sec);',
    '}',
    /* Blok pertama pada tiap lembar: buang spasi-sebelum (mis. judul klausul 12 pt)
       agar judul duduk PERSIS di margin atas, tidak terdorong ke bawah. Berlaku juga
       untuk paragraf yang membawa margin-top inline dari Word. */
    'function rapikanAtasLembar(){',
    ' var bd=document.querySelectorAll(".spk-doc .spk-page.spk-sheet > .sh-bd");',
    ' for(var i=0;i<bd.length;i++){',
    '   var k=bd[i].firstElementChild; if(!k) continue;',
    '   try{ k.style.marginTop="0"; }catch(e){}',
    '   var h=k.firstElementChild;',
    '   if(h && hasCls(h,"spk-cl-h")){ try{ h.style.marginTop="0"; h.style.paddingTop="0"; }catch(e2){} }',
    ' }',
    '}',
    /* klausul yang terpotong: hanya lembar PERTAMA yang menaikkan nomor klausul */
    'function tandaiLanjutan(){',
    ' var seen={}, cl=document.querySelectorAll(".spk-doc .spk-clause");',
    ' for(var i=0;i<cl.length;i++){',
    '   var u=cl[i].getAttribute("data-spksh")||("x"+i);',
    '   if(seen[u]) cl[i].classList.add("spk-cont"); else { cl[i].classList.remove("spk-cont"); seen[u]=1; }',
    ' }',
    '}',
    /* ==== DAFTAR ISI SELALU SATU HALAMAN ====
       Daftar isi disusun dua kolom di dalam kotak. Bila jumlah pasal membuat
       kotak melewati batas bawah lembar, seluruh baris DIPERKECIL bertahap
       (tinggi padding, ukuran huruf, lebar kolom nomor) sampai muat — bukan
       dipecah ke halaman lain. Skala mulai 1 dan turun 0,04 tiap langkah,
       dibatasi 0,42 supaya masih terbaca. Nilai dasar diambil dari CSS
       .toc-2k (baris: padding 11px/2px & 15px; .no lebar 44px; .pg 16px). */
    'function tocLimit(sec){',
    ' var cs=window.getComputedStyle(sec);',
    ' var pt=parseFloat(cs.paddingTop)||0, pb=parseFloat(cs.paddingBottom)||0;',
    ' return sec.clientHeight - pt - pb;',
    '}',
    'function tocMuat(sec, kotak, lim){',
    ' var cs=window.getComputedStyle(sec);',
    ' var atas=sec.getBoundingClientRect().top + (parseFloat(cs.paddingTop)||0);',
    ' return (kotak.getBoundingClientRect().bottom - atas) <= lim + 1;',
    '}',
    'function tocSkala(baris, f){',
    ' for(var i=0;i<baris.length;i++){',
    '   var r=baris[i];',
    '   r.style.padding=(11*f).toFixed(2)+"px 2px";',
    '   r.style.fontSize=(15*f).toFixed(2)+"px";',
    '   r.style.lineHeight="1.3";',
    '   var no=r.querySelector(".no"); if(no){ no.style.width=(44*f).toFixed(2)+"px"; no.style.fontSize=(15*f).toFixed(2)+"px"; }',
    '   var nm=r.querySelector(".nm"); if(nm){ nm.style.fontSize=(15*f).toFixed(2)+"px"; }',
    '   var pg=r.querySelector(".pg"); if(pg){ pg.style.fontSize=(16*f).toFixed(2)+"px"; }',
    '   var dt=r.querySelector(".dot"); if(dt){ dt.style.margin="0 "+(9*f).toFixed(2)+"px"; }',
    ' }',
    '}',
    'function muatkanTocSatu(sec){',
    ' var kotak=sec.querySelector(".toc-box"); if(!kotak) return;',
    ' var list=kotak.querySelector(".spk-toc2"); if(!list) return;',
    ' var baris=els(list); if(!baris.length) return;',
    ' var lim=tocLimit(sec); if(!lim || lim<80) return;',
    ' var f=1, jaga=0;',
    ' while(!tocMuat(sec, kotak, lim) && f>0.42 && jaga++<40){',
    '   f-=0.04; tocSkala(baris, f);',
    ' }',
    '}',
    'function muatkanToc(){',
    ' var hal=document.querySelectorAll(".spk-doc > .spk-page.spk-tocpage");',
    ' for(var i=0;i<hal.length;i++) muatkanTocSatu(hal[i]);',
    '}',
    /* nomor halaman Daftar Isi = nomor lembar ISI KONTRAK (SPK) tempat klausul
       dimulai. Lembar Lampiran TIDAK dihitung, agar konsisten dengan footer. */
    'function nomorToc(){',
    ' var sheets=document.querySelectorAll(".spk-doc > .spk-page.spk-sheet");',
    ' var pgs=document.querySelectorAll(".spk-toc2 .pg");',
    ' var k=0, n=0;',
    ' for(var i=0;i<sheets.length;i++){',
    '   if(hasCls(sheets[i],"spk-lampsheet")) continue;',
    '   n++;',
    '   var cls=sheets[i].querySelectorAll(".spk-clause:not(.spk-cont)");',
    '   for(var j=0;j<cls.length;j++){ if(pgs[k]) pgs[k].textContent=String(n); k++; }',
    ' }',
    '}',
    /* SUMBER ANGGARAN dijaga 1 baris: perkecil font (dari 13px, step 0,5, min 8px)
       hingga muat, lalu terapkan ukuran yang sama ke seluruh nilai baris terakhir
       (SUMBER & TANGGAL ANGGARAN) supaya seragam. Dijalankan setelah font siap. */
    'function fitLastRow(){',
    ' var covers=document.querySelectorAll(".spk-cover");',
    ' for(var c=0;c<covers.length;c++){',
    '   var fit=covers[c].querySelector(".fv-fit");',
    '   if(!fit) continue;',
    '   var size=13; fit.style.whiteSpace="nowrap"; fit.style.fontSize=size+"px";',
    '   var g=0;',
    '   while(fit.scrollWidth > fit.clientWidth+0.5 && g++<60){',
    '     size-=0.5; if(size<=8){ size=8; fit.style.fontSize="8px"; break; }',
    '     fit.style.fontSize=size+"px";',
    '   }',
    '   var row=covers[c].querySelectorAll(".fv-lastrow");',
    '   for(var r=0;r<row.length;r++) row[r].style.fontSize=size+"px";',
    ' }',
    '}',
    /* Nomor halaman footer: "N dari M" HANYA untuk lembar isi kontrak (SPK).
       Lembar Lampiran SPK tidak ikut dihitung, dan nomornya dikosongkan. */
    'function nomorFooter(){',
    ' var sh=document.querySelectorAll(".spk-doc > .spk-page.spk-sheet");',
    ' var body=[];',
    ' for(var i=0;i<sh.length;i++){ if(!hasCls(sh[i],"spk-lampsheet")) body.push(sh[i]); }',
    ' var tot=body.length;',
    ' for(var i=0;i<tot;i++){',
    '   var t=body[i].querySelector(".ft-pg");',
    '   if(t) t.textContent=(i+1)+" dari "+tot;',
    ' }',
    ' for(var i=0;i<sh.length;i++){',
    '   if(hasCls(sh[i],"spk-lampsheet")){ var t2=sh[i].querySelector(".ft-pg"); if(t2) t2.textContent=String.fromCharCode(8203); }',
    ' }',
    '}',
    'function jalan(){',
    ' if(DONE) return;',
    /* Tinggi area isi berbeda per jenis lembar:
         - halaman kontrak : margin normal 2,54cm -> 297 - 25,4 - 25,4 = 246,2mm
         - lembar Lampiran : margin 12mm          -> 297 - 12 - 12     = 273mm  */
    ' var PH=mm2px(246.2);',
    ' var PHL=mm2px(273);',
    ' if(!PH||PH<200){ if(TRY++<80) setTimeout(jalan,100); return; }',
    ' DONE=true;',
    ' var doc=document.querySelector(".spk-doc");',
    ' var backup=doc?doc.innerHTML:"";',
    ' try{',
    '   var UID={n:0};',
    '   var list=document.querySelectorAll(".spk-doc > .spk-page.spk-flow");',
    '   for(var i=0;i<list.length;i++) build(list[i], hasCls(list[i],"spk-lampsheet")?PHL:PH, UID);',
    '   muatkanToc();',
    '   tandaiLanjutan();',
    '   rapikanAtasLembar();',
    '   nomorToc();',
    '   nomorFooter();',
    '   fitLastRow();',
    ' }catch(e){',
    '   try{ console.error("spk paginate:", e); if(doc) doc.innerHTML=backup; }catch(_){}',
    ' }',
    ' try{ window.__spkPaged=true; }catch(e2){}',
    '}',
    /* Paginasi mengukur TINGGI teks. Bila dijalankan sebelum Plus Jakarta Sans
       selesai dimuat, tinggi terukur memakai font cadangan sehingga pemenggalan
       halaman & nomor Daftar Isi meleset. Karena itu tunggu font siap dulu. */
    'function mulai(){',
    ' try{',
    '   if(document.fonts && document.fonts.ready && document.fonts.ready.then){',
    '     document.fonts.ready.then(function(){ jalan(); });',
    '     setTimeout(jalan, 3000);',
    '     return;',
    '   }',
    ' }catch(e){}',
    ' jalan();',
    '}',
    'if(document.readyState==="loading") window.addEventListener("load", mulai); else mulai();',
    'window.addEventListener("load", mulai);',
    '})();'
  ].join('\n');
  return '<scr'+'ipt>'+js+'</scr'+'ipt>';
}
/* Nama lama tetap dipertahankan agar pemanggilan lain (bila ada) tidak rusak */
function spkTocScript(){ return spkPageScript(); }

function spkDocHtml(data, klausul){
  data=data||{};
  const ctx=spkBuildCtx(data);
  const esc=fkEsc;
  /* Penanda bentuk dokumen — HARUS dideklarasikan sebelum dipakai (dahulu
     dideklarasikan di bawah, sehingga pratinjau gagal karena TDZ). */
  const _isPkDoc = spkBentukOf(data)==='PK';
  /* 1) Sampul — SATU rancangan untuk kedua bentuk dokumen. Perjanjian/Kontrak
     dahulu memakai sampul tersendiri (spkCoverPkHtml); kini disamakan dengan
     Surat Perintah Kerja, yang berbeda hanya judulnya. */
  const cover = spkCoverHtml(data, ctx, spkDokTitle(data));
  // 2) Daftar Isi
  const toc=spkTocHtml(data, klausul);
  // 3) Isi kontrak (kop + footer berulang tiap halaman)
  const _tpl = (spkBentukOf(data)==='PK') ? spkPreamblePkTpl(data) : SPK_PREAMBLE_TPL;
  let preamble = spkNomorToNo(spkNumberFix(spkTidyKeyValue(spkMerge(_tpl, ctx))));
  /* PK: butir daftar "Berdasarkan" (mis. "24. Berita Acara Klarifikasi dan
     Negosiasi") diikat menjadi satu blok utuh dengan baris No./Tanggal miliknya,
     sehingga judul tidak pernah tertinggal sendirian di dasar halaman. */
  preamble = spkPkKeepDlist(preamble, _isPkDoc);
  /* Paragraf "Maka dengan ini PIHAK PERTAMA menugaskan..." harus MEMULAI halaman
     baru. CSS break-before:page tidak berpengaruh karena halaman isi dipecah oleh
     paginator JS (spkPageScript), bukan oleh mesin cetak. Karena itu paragraf ini
     dikeluarkan jadi blok tingkat atas ber-class "spk-forcepage", yang dikenali
     paginator sebagai penanda halaman baru. */
  let preambleAtas = preamble, preambleMenugaskan = '';
  const _iM = preamble.indexOf('spk-menugaskan');
  if(_iM > -1){
    const _p = preamble.lastIndexOf('<p', _iM);
    if(_p > -1){ preambleAtas = preamble.slice(0,_p); preambleMenugaskan = preamble.slice(_p); }
  }
  /* Bila sebuah klausul diawali PARAGRAF PENGANTAR (kl0) lalu disusul butir
     bernomor, butir-butir itu diberi indentasi kecil terhadap teks pengantar di
     atasnya — sesuai kelaziman dokumen Perjanjian/Kontrak. Klausul yang langsung
     dimulai dengan butir bernomor (mis. Pasal 1 DEFINISI) tetap rata margin. */
  const clausesHtml = (klausul||[]).map((k,i)=>{
    const inner = spkPkTidy(spkKvGroup(spkKlItalicAsing(spkBoldPihak(spkNomorToNo(spkNumberFix(spkTidyKeyValue(
        spkPruneKlausul(spkMerge(spkRenumberKlausul(spkSortDefinisiIf(k.judul, k.isi||''), i+1), ctx), i+1, data)
      )))))), _isPkDoc);
    return '<div class="spk-clause"><div class="spk-cl-h"><span class="n"></span>'+spkFmtJudul(k.judul)+'</div>'+
      '<div class="spk-cl'+spkLeadIndentCls(inner)+'">'+inner+'</div></div>';
  }).join('');
  /* Judul dokumen. Pada Perjanjian/Kontrak nomornya TIDAK ditulis lagi di sini,
     karena tepat di bawahnya sudah ada blok "Nomor PIHAK PERTAMA / PIHAK KEDUA"
     yang memuat nomor yang sama — kalau ditulis dua kali jadi kembar. Bentuk
     Surat Perintah Kerja tidak punya blok itu, jadi nomornya tetap ditampilkan. */
  const _babNo = (!_isPkDoc && data.nomor_kontrak) ? ('<span>'+esc(data.nomor_kontrak)+'</span>') : '';
  /* ---------- JUDUL DI HALAMAN PERTAMA ISI ----------
     Sama untuk kedua bentuk: satu baris judul dokumen bergaris bawah
     (.spk-bab). Blok kop Perjanjian/Kontrak yang lama (judul berlapis
     TENTANG/ANTARA/DENGAN + garis ganda pemisah) DIHAPUS atas permintaan;
     informasi itu sudah termuat pada Sampul. Nomor hanya ditulis pada Surat
     Perintah Kerja (lihat _babNo) karena pada Perjanjian/Kontrak nomor kedua
     pihak sudah tercantum tepat di bawahnya. */
  const isiBody=
    '<div class="spk-bab"><b>'+esc(spkDokLabel(data))+'</b>'+_babNo+'</div>'+
    '<div class="spk-cl">'+preambleAtas+'</div>'+
    (preambleMenugaskan ? '<div class="spk-cl spk-forcepage">'+preambleMenugaskan+'</div>' : '')+
    clausesHtml+
    spkSignBlockHtml(ctx,'1');   /* hanya 1 rangkap */
  const isi=
    '<section class="spk-page spk-flow" id="spk-flow">'+
      '<table class="spk-run"><thead><tr><td>'+spkRunHeadHtml(data)+'</td></tr></thead>'+
      '<tbody><tr><td>'+isiBody+'</td></tr></tbody>'+
      '<tfoot><tr><td>'+spkRunFootHtml()+'</td></tr></tfoot></table>'+
    '</section>';
  // 4) Cover Lampiran + 5) Isi Lampiran
  const coverLamp=spkCoverHtml(data, ctx, spkLampTitle(data));
  const lampiran='<section class="spk-page spk-flow spk-lampsheet">'+spkLampiranDocInner(data)+'</section>';

  return '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>&#8203;</title>'+
    (typeof fklDocFontLink==='function'?fklDocFontLink():'')+
    /* Font isi kontrak: Inter — sans modern & bersih untuk badan dokumen */
    '<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">'+
    '<style>'+
    (typeof fklDocBaseCss==='function'?fklDocBaseCss():'')+
    (typeof hpsExtraDocCss==='function'?hpsExtraDocCss():'')+
    spkDocCss()+spkDocCss2()+
    '</style></head><body><div class="spk-doc'+(spkBentukOf(data)==='PK'?' spk-pk':' spk-spk')+'">'+
      /* Auto-italic istilah asing diterapkan pada SELURUH konten dokumen Susun
         Kontrak (cover, daftar isi, kop/footer, preamble, klausul, tanda tangan,
         cover & isi lampiran) — bukan hanya isi klausul. Hanya menyentuh TEKS
         (di luar tag); <style> & paginator <script> berada di luar bungkus ini
         sehingga tidak tersentuh. Istilah yang sudah dibungkus <i> pada tahap
         klausul otomatis dilewati (tanpa italic bertumpuk). */
      spkKlItalicAsing(cover+toc+isi+coverLamp+lampiran)+
    '</div>'+spkPageScript()+fklFitScript()+'</body></html>';
}

/* ---------- Pratinjau & Cetak ----------
   Memakai modal pratinjau bersama (pn-preview-overlay) yang sama persis dengan
   Rekap HPS: header dengan tombol Perbesar + Cetak/PDF + tutup, isi berupa iframe. */
let spkPreviewData=null, spkPreviewKlausul=null;

function spkOpenPreview(data, klausul){
  spkPreviewData=data; spkPreviewKlausul=klausul;
  const html=spkDocHtml(data, klausul);
  const ov=document.getElementById('pn-preview-overlay');
  if(!ov){ spkPrint(); return; }   // fallback: langsung cetak bila modal tak ada
  const _mdl=ov.querySelector('.pn-preview-modal'); if(_mdl) _mdl.classList.remove('is-max');
  if(typeof pnPreviewResetMaxBtn==='function') pnPreviewResetMaxBtn();
  const titleEl=document.getElementById('pn-preview-title');
  if(titleEl) titleEl.textContent='Pratinjau — '+spkDokTitle(data)+': '+((data&&data.nomor_kontrak)||(data&&data.nama_pekerjaan)||'');
  const body=document.getElementById('pn-preview-body');
  if(body){
    body.classList.add('fkl-preview-body');
    body.innerHTML='<iframe id="fkl-preview-frame" title="Pratinjau SPK"></iframe>';
    const ifr=document.getElementById('fkl-preview-frame');
    const doc=ifr.contentWindow.document; doc.open(); doc.write(html); doc.close();
  }
  // Sisipkan tombol Cetak/PDF khusus SPK ke header modal bersama (hapus tombol modul lain)
  const actions=document.querySelector('#pn-preview-overlay .pn-preview-head-actions');
  ['fkl-preview-print','pnw-preview-print','rho-preview-print','hps-preview-print','ana-preview-print','hpsc-preview-print','spk-preview-print'].forEach(bid=>{ const b=document.getElementById(bid); if(b) b.remove(); });
  if(actions){
    const btn=document.createElement('button');
    btn.id='spk-preview-print'; btn.className='btn btn-teal';
    btn.style.padding='8px 14px'; btn.style.fontSize='11px';
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>Cetak / PDF';
    btn.onclick=function(){ spkPrint(); };
    actions.insertBefore(btn, actions.firstChild);
  }
  ov.classList.add('show');
}
function spkClosePreview(){ if(typeof closePnPreview==='function') closePnPreview(); }
function spkPrint(){
  const data=spkPreviewData||{}, klausul=spkPreviewKlausul||[];
  const old=document.getElementById('spk-print-frame'); if(old) old.remove();
  const ifr=document.createElement('iframe'); ifr.id='spk-print-frame'; ifr.setAttribute('aria-hidden','true');
  ifr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(ifr);
  const doc=ifr.contentWindow.document; doc.open(); doc.write(spkDocHtml(data, klausul)); doc.close();
  const go=()=>{
    const run=()=>{ try{ ifr.contentWindow.focus(); ifr.contentWindow.print(); }catch(e){ try{ window.print(); }catch(_){} } };
    if(typeof withHiddenPageTitle==='function') withHiddenPageTitle(run); else run();
    setTimeout(()=>{ const f=document.getElementById('spk-print-frame'); if(f) f.remove(); }, 1500);
  };
  /* Tunggu sampai isi selesai dipecah menjadi lembar A4 (spkPageScript) agar
     hasil cetak sama persis dengan pratinjau. */
  let printed=false;
  const goPaged=(sisa)=>{
    if(printed) return;
    let siap=false;
    try{ siap=!!(ifr.contentWindow && ifr.contentWindow.__spkPaged); }catch(e){ siap=true; }
    if(siap || sisa<=0){ printed=true; go(); return; }
    setTimeout(()=>goPaged(sisa-60), 60);
  };
  const imgs=doc.images?Array.from(doc.images):[];
  if(imgs.length){ let n=imgs.length; const dec=()=>{ if(--n<=0) setTimeout(()=>goPaged(3000),60); }; imgs.forEach(im=>{ if(im.complete) dec(); else{ im.onload=dec; im.onerror=dec; } }); setTimeout(()=>goPaged(3000),1200); }
  else setTimeout(()=>goPaged(3000),120);
}

/* ================= HALAMAN: UBAH KLAUSUL KONTRAK ================= */
function openSpkKlausul(){ refreshDataKlausul().then(()=>{ renderSpkKlausul(); showView('spk-klausul'); }); }
function renderSpkKlausul(){
  const cont=document.getElementById('spk-klausul-content'); if(!cont) return;
  const list=records_klausul.slice();
  const last=list.length-1;
  const rows = list.length ? list.map((k,i)=>{
    const kid=fkEscJs(String(k.id));
    const off = (k.aktif===false);
    const preview = String(k.isi||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,150);
    return '<div class="spk-klx'+(off?' off':'')+'">'+
      '<div class="spk-klx-no">'+(i+1)+'</div>'+
      '<div class="spk-klx-main"><div class="spk-klx-judul">'+(k.judul?spkJudulSan(k.judul):'(Tanpa judul)')+(off?' <span class="spk-badge-off">non-aktif</span>':'')+'</div>'+
        '<div class="spk-klx-prev">'+fkEsc(preview)+(preview.length>=150?'…':'')+'</div></div>'+
      '<div class="spk-klx-act">'+
        '<button class="act act-mv" title="Naikkan" '+(i===0?'disabled':'')+' onclick="spkKlausulMove(\''+kid+'\',-1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>'+
        '<button class="act act-mv" title="Turunkan" '+(i===last?'disabled':'')+' onclick="spkKlausulMove(\''+kid+'\',1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12l7 7 7-7"/></svg></button>'+
        '<button class="act act-edit" title="Ubah" onclick="spkKlausulEdit(\''+kid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>'+
        '<button class="act act-view" title="Lihat" onclick="spkKlausulView(\''+kid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>'+
        '<button class="act act-del" title="Hapus" onclick="spkKlausulDelete(\''+kid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>'+
      '</div>'+
    '</div>';
  }).join('') : '<div class="empty" style="padding:26px"><div>Belum ada klausul.</div></div>';
  /* Bar tombol: Simpan Profil | Muat Profil | Batalkan Pilihan (HANYA bila profil dipakai) | Tambah Klausul */
  const aktifProfil = spkKlProfil.active;
  // "Batalkan Pilihan" hanya tampil saat sebuah profil sedang dimuat. Menekannya
  // mengembalikan pustaka klausul ke keadaan bawaan (default). Tanpa profil aktif,
  // tombol ini tidak ditampilkan sama sekali.
  const btnBatal = aktifProfil
    ? '<button type="button" class="jp-profil-btn is-cancel" title="Batalkan profil yang dimuat &amp; kembalikan pustaka klausul ke bawaan" onclick="spkKlProfilCancel()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6 6 18M6 6l12 12"/></svg><span>Profil</span></button>'
    : '';
  const tagProfil = aktifProfil
    ? '<span class="spk-klprof-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:13px;height:13px"><path d="M20 6 9 17l-5-5"/></svg>Profil: '+fkEsc(aktifProfil)+'</span>'
    : '';
  cont.innerHTML=
    '<div class="form-card">'+
      '<div class="form-section-title" style="justify-content:space-between">'+
        '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg> Pustaka Klausul SPK '+tagProfil+'</span>'+
        '<span class="spk-klbar">'+
          '<button type="button" class="jp-profil-btn is-save" title="Simpan Profil" onclick="spkKlProfilOpenSave()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg><span>Profil</span></button>'+
          '<button type="button" class="jp-profil-btn is-load" title="Muat Profil" onclick="spkKlProfilOpenLoad()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg><span>Profil</span></button>'+
          btnBatal+
          '<button class="btn btn-green" title="Tambah Klausul" onclick="spkKlausulNew()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Klausul</button>'+
        '</span>'+
      '</div>'+
      '<div class="hps-hint" style="margin:0 0 12px">Pustaka klausul ini <b>milik kontrak yang sedang disusun</b>. Menyunting, menambah, atau menghapus klausul di sini <b>tidak mengubah kontrak lain</b>. Kontrak baru selalu dimulai dari 3 klausul kosong — pakai <b>Muat Profil</b> untuk memanggil set klausul yang sudah jadi.</div>'+
      '<div class="spk-klx-list">'+rows+'</div>'+
    '</div>';
}

/* ================= PROFIL PUSTAKA KLAUSUL =================
   Profil = rekaman seluruh isi Pustaka Klausul (judul + isi + urutan + aktif),
   disimpan di penyimpanan peramban (localStorage) seperti Profil Jadwal.
   - Simpan Profil     : merekam pustaka klausul saat ini dengan sebuah nama
   - Muat Profil       : mengganti pustaka klausul dengan isi profil terpilih
   - Batalkan Pilihan  : mengembalikan pustaka klausul ke keadaan sebelum profil dimuat
   ========================================================= */
const SPK_KL_PROFIL_KEY='spk_klausul_profiles_v1';
var spkKlProfil={ active:'', backup:null };
/* Profil Klausul SPK kini tersimpan di Supabase (cache: profileCache.klausul). */
function spkKlProfilAll(){ return profilesGet('klausul'); }
function spkKlProfilSnapshot(){
  return (records_klausul||[]).map(function(k,i){
    return { judul:String(k.judul||''), isi:String(k.isi||''), urutan:(Number(k.urutan)||((i+1)*10)), aktif:(k.aktif!==false), isi_docx:String(k.isi_docx||'') };
  });
}
function spkKlProfilOverlay(inner){
  let ov=document.getElementById('pnw-profil-ov');
  if(!ov){ ov=document.createElement('div'); ov.id='pnw-profil-ov'; ov.className='pnw-profil-ov'; document.body.appendChild(ov); }
  ov.onclick=(e)=>{ if(e.target===ov) spkKlProfilClose(); };
  ov.innerHTML='<div class="pnw-profil-modal" role="dialog">'+inner+'</div>'; ov.style.display='flex';
}
function spkKlProfilClose(){ const ov=document.getElementById('pnw-profil-ov'); if(ov) ov.style.display='none'; }
function spkKlProfilOpenSave(){
  const snap=spkKlProfilSnapshot();
  if(!snap.length){ toast('Belum ada klausul untuk disimpan','warn'); return; }
  const list=spkKlProfilAll();
  const existing = list.length ? ('<div class="pnw-profil-existing">Profil tersimpan: '+list.map(p=>fkEsc(p.name)).join(' &middot; ')+'</div>') : '';
  spkKlProfilOverlay(
    '<div class="pnw-profil-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>Simpan Profil Klausul</div>'+
    '<div class="pnw-profil-sub">Menyimpan <b>'+snap.length+'</b> klausul (judul, isi, urutan, status aktif) sebagai satu profil yang dapat dimuat kembali kapan saja.</div>'+
    '<input id="spk-klprofil-name" class="pnw-profil-input" type="text" placeholder="Nama profil (mis. SPK Konstruksi Standar)" maxlength="60" onkeydown="if(event.key===\'Enter\')spkKlProfilDoSave()">'+
    existing+
    '<div class="pnw-profil-actions"><button type="button" class="btn btn-ghost" onclick="spkKlProfilClose()">Batal</button>'+
    '<button type="button" class="btn btn-teal" onclick="spkKlProfilDoSave()">Simpan Profil</button></div>'
  );
  setTimeout(function(){ const el=document.getElementById('spk-klprofil-name'); if(el) el.focus(); },60);
}
async function spkKlProfilDoSave(){
  const el=document.getElementById('spk-klprofil-name'); const name=(el&&el.value||'').trim();
  if(!name){ toast('Isi nama profil dulu','warn'); if(el) el.focus(); return; }
  const snap={ name:name, savedAt:Date.now(), items:spkKlProfilSnapshot() };
  snap.count=snap.items.length;
  if(await profilesUpsert('klausul', snap)){ toast('Profil "'+name+'" tersimpan','ok'); spkKlProfilClose(); }
}
function spkKlProfilOpenLoad(){
  const list=spkKlProfilAll();
  if(!list.length){ toast('Belum ada profil. Simpan dulu lewat tombol "Simpan Profil".','warn'); return; }
  const items=list.slice().sort((a,b)=>(b.savedAt||0)-(a.savedAt||0)).map(p=>
    '<div class="pnw-profil-item"><div class="pnw-profil-item-info"><div class="pnw-profil-item-name">'+fkEsc(p.name)+'</div>'+
    '<div class="pnw-profil-item-meta">'+(p.count||(p.items?p.items.length:0))+' klausul</div></div>'+
    '<div class="pnw-profil-item-btns">'+profilActionBtns('klausul',p.name)+'</div></div>'
  ).join('');
  spkKlProfilOverlay(
    '<div class="pnw-profil-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 11v6M9 14h6"/></svg>Muat Profil Klausul'+profilUploadBtnHtml('klausul')+'</div>'+
    '<div class="pnw-profil-sub">Pustaka klausul saat ini akan <b>diganti</b> oleh isi profil. Keadaan sebelumnya disimpan sementara sehingga dapat dikembalikan lewat <b>Batalkan Pilihan</b>.</div>'+
    '<div class="pnw-profil-list">'+items+'</div>'
  );
}
async function spkKlProfilDoDelete(name){
  if(await profilesDelete('klausul', name)){ toast('Profil "'+name+'" dihapus','ok'); if(spkKlProfilAll().length) spkKlProfilOpenLoad(); else spkKlProfilClose(); }
}
/* Tulis ulang seluruh pustaka klausul dari daftar item (hapus semua -> buat ulang) */
async function spkKlProfilWrite(items){
  records_klausul = (items||[]).map((it,i)=>{
    const recW={ id:spkKlUid(), judul:it.judul||'', isi:it.isi||'',
                 urutan:(Number(it.urutan)||((i+1)*10)), aktif:(it.aktif!==false) };
    if(it.isi_docx) recW.isi_docx=String(it.isi_docx);
    return recW;
  });
  spkKlSync();
  // pilihan klausul pada kontrak yang sedang disusun mengikuti pustaka yang baru
  if(spkState) spkState.sel = records_klausul.filter(k=>k.aktif!==false).map(k=>String(k.id));
}
function spkKlProfilDoLoad(name){
  if(typeof requireInput==='function' && !requireInput()) return;
  const p=spkKlProfilAll().find(x=>String(x.name)===String(name));
  if(!p || !Array.isArray(p.items) || !p.items.length){ toast('Profil tidak ditemukan','warn'); return; }
  const backup=spkKlProfilSnapshot();
  (async()=>{
    try{ await withActionLoader('Memuat profil', async()=>{ await spkKlProfilWrite(p.items); }); }
    catch(err){ console.error(err); toast('Gagal memuat profil: '+errMsg(err),'err'); return; }
    spkKlProfil.active=name; spkKlProfil.backup=backup;
    spkKlProfilClose(); renderSpkKlausul();
    toast('Profil "'+name+'" dimuat','ok');
  })();
}
/* "Batalkan Pilihan" -> pustaka klausul kembali ke KEADAAN BAWAAN:
   3 klausul (KLAUSUL 1 s.d. 3) berisi contoh pengisian "Isi Klausul ......" */
function spkKlProfilCancel(){
  openConfirm({ icon:'warn', title:'Batalkan Pilihan Profil',
    text:'Pustaka klausul akan dikembalikan ke keadaan bawaan: 3 klausul (KLAUSUL 1, KLAUSUL 2, KLAUSUL 3) dengan contoh pengisian. Lanjutkan?',
    onYes:async()=>{
      try{ await withActionLoader('Mengembalikan ke bawaan', async()=>{ await spkKlProfilWrite(SPK_KLAUSUL_SEED.map(s=>Object.assign({},s))); }); }
      catch(err){ console.error(err); toast('Gagal mengembalikan: '+errMsg(err),'err'); return; }
      spkKlProfil.active=''; spkKlProfil.backup=null;
      renderSpkKlausul(); toast('Pustaka klausul kembali ke bawaan (3 klausul)','ok');
    }});
}
/* "Kembalikan ke Bawaan" — tersedia SETIAP saat (tanpa perlu profil dimuat).
   Mengganti seluruh isi Pustaka Klausul dengan keadaan bawaan:
   3 klausul kosong (KLAUSUL 1, KLAUSUL 2, KLAUSUL 3). */
function spkKlausulResetDefault(){
  if(typeof requireInput==='function' && !requireInput()) return;
  openConfirm({ icon:'warn', title:'Kembalikan ke Bawaan',
    text:'Seluruh isi Pustaka Klausul saat ini akan DIGANTI dengan keadaan bawaan: 3 klausul kosong (KLAUSUL 1, KLAUSUL 2, KLAUSUL 3). Klausul yang ada sekarang akan dihapus. Lanjutkan?',
    onYes:async()=>{
      try{ await withActionLoader('Mengembalikan ke bawaan', async()=>{ await spkKlProfilWrite(SPK_KLAUSUL_SEED.map(s=>Object.assign({},s))); }); }
      catch(err){ console.error(err); toast('Gagal mengembalikan: '+errMsg(err),'err'); return; }
      spkKlProfil.active=''; spkKlProfil.backup=null;
      renderSpkKlausul(); toast('Pustaka klausul kembali ke bawaan (3 klausul kosong)','ok');
    }});
}

/* ================= PROFIL INFORMASI PENYEDIA =================
   Profil = rekaman seluruh field "Informasi Penyedia" (nama perusahaan, lokasi,
   pimpinan, rekening, penawaran, akta pendirian & perubahan). Disimpan di Supabase
   pada tabel profil yang SAMA (app_profiles) dengan kind='penyedia' — TIDAK perlu
   tabel/skrip SQL baru. Cache: profileCache.penyedia.
   - Simpan Profil    : merekam data penyedia saat ini dengan sebuah nama
   - Muat Profil      : mengisi field penyedia dari profil terpilih (data lama dibackup)
   - Batalkan Pilihan : mengembalikan data penyedia ke keadaan sebelum profil dimuat
   Kontrak baru tetap mulai dari tampilan bawaan (field kosong + teks akta default).
   ============================================================= */
const SPK_PY_PROFIL_KIND='penyedia';
var spkPyProfil={ active:'', backup:null };
/* Daftar key field yang termasuk "Informasi Penyedia" (kecuali field otomatis).
   No. Penawaran & Tgl. Penawaran DIKECUALIKAN: keduanya spesifik per-kontrak,
   bukan bagian identitas penyedia yang dipakai ulang antar-kontrak. */
const SPK_PY_PROFIL_EXCLUDE = ['no_penawaran_penyedia','tgl_penawaran'];
function spkPyProfilFields(){
  const g=(SPK_FIELD_GROUPS||[]).find(x=>x.sec==='Informasi Penyedia');
  return g ? g.fields.filter(f=>!f.auto && SPK_PY_PROFIL_EXCLUDE.indexOf(f.k)<0).map(f=>f.k) : [];
}
function spkPyProfilAll(){ return profilesGet(SPK_PY_PROFIL_KIND); }
function spkPyProfilSnapshot(){
  const d=(spkState&&spkState.data)||{}; const out={};
  spkPyProfilFields().forEach(k=>{ out[k]=(d[k]!=null? d[k] : ''); });
  return out;
}
/* Isi field penyedia dari sebuah objek nilai lalu segarkan tampilan & field otomatis. */
function spkPyProfilApply(vals){
  if(!spkState || !vals) return;
  spkPyProfilFields().forEach(k=>{ if(Object.prototype.hasOwnProperty.call(vals,k)) spkState.data[k]=vals[k]; });
  spkRefreshAuto();
  renderSpkSusun();
}
/* Tag "Profil: <nama>" di sebelah judul section (muncul saat profil sedang dimuat). */
function spkPyProfilTagHtml(){
  return spkPyProfil.active
    ? '<span class="spk-klprof-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:13px;height:13px"><path d="M20 6 9 17l-5-5"/></svg>Profil: '+fkEsc(spkPyProfil.active)+'</span>'
    : '';
}
/* Bar tombol Simpan / Muat / (Batalkan) di kanan-atas kartu Informasi Penyedia. */
function spkPyProfilBarHtml(){
  const btnBatal = spkPyProfil.active
    ? '<button type="button" class="jp-profil-btn is-cancel" title="Kembalikan data penyedia ke keadaan sebelum profil dimuat" onclick="spkPyProfilCancel()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6 6 18M6 6l12 12"/></svg><span>Profil</span></button>'
    : '';
  return '<span class="spk-klbar">'+
    '<button type="button" class="jp-profil-btn is-save" title="Simpan Profil" onclick="spkPyProfilOpenSave()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg><span>Profil</span></button>'+
    '<button type="button" class="jp-profil-btn is-load" title="Muat Profil" onclick="spkPyProfilOpenLoad()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg><span>Profil</span></button>'+
    btnBatal+
  '</span>';
}
function spkPyProfilOverlay(inner){
  let ov=document.getElementById('pnw-profil-ov');
  if(!ov){ ov=document.createElement('div'); ov.id='pnw-profil-ov'; ov.className='pnw-profil-ov'; document.body.appendChild(ov); }
  ov.onclick=(e)=>{ if(e.target===ov) spkPyProfilClose(); };
  ov.innerHTML='<div class="pnw-profil-modal" role="dialog">'+inner+'</div>'; ov.style.display='flex';
}
function spkPyProfilClose(){ const ov=document.getElementById('pnw-profil-ov'); if(ov) ov.style.display='none'; }
function spkPyProfilOpenSave(){
  const snap=spkPyProfilSnapshot();
  const adaIsi=Object.keys(snap).some(k=>String(snap[k]||'').trim()!=='');
  if(!adaIsi){ toast('Isi data penyedia dulu sebelum menyimpan profil','warn'); return; }
  const list=spkPyProfilAll();
  const existing = list.length ? ('<div class="pnw-profil-existing">Profil tersimpan: '+list.map(p=>fkEsc(p.name)).join(' &middot; ')+'</div>') : '';
  spkPyProfilOverlay(
    '<div class="pnw-profil-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>Simpan Profil Penyedia</div>'+
    '<div class="pnw-profil-sub">Menyimpan seluruh data <b>Informasi Penyedia</b> (nama perusahaan, lokasi, pimpinan, rekening, penawaran, akta) sebagai satu profil yang dapat dimuat kembali kapan saja.</div>'+
    '<input id="spk-pyprofil-name" class="pnw-profil-input" type="text" placeholder="Nama profil (mis. PT Seram Indo Pratama)" maxlength="60" onkeydown="if(event.key===\'Enter\')spkPyProfilDoSave()">'+
    existing+
    '<div class="pnw-profil-actions"><button type="button" class="btn btn-ghost" onclick="spkPyProfilClose()">Batal</button>'+
    '<button type="button" class="btn btn-teal" onclick="spkPyProfilDoSave()">Simpan Profil</button></div>'
  );
  setTimeout(function(){ const el=document.getElementById('spk-pyprofil-name'); if(el) el.focus(); },60);
}
async function spkPyProfilDoSave(){
  const el=document.getElementById('spk-pyprofil-name'); const name=(el&&el.value||'').trim();
  if(!name){ toast('Isi nama profil dulu','warn'); if(el) el.focus(); return; }
  const snap={ name:name, savedAt:Date.now(), data:spkPyProfilSnapshot() };
  if(await profilesUpsert(SPK_PY_PROFIL_KIND, snap)){ toast('Profil "'+name+'" tersimpan','ok'); spkPyProfilClose(); }
}
function spkPyProfilOpenLoad(){
  const list=spkPyProfilAll();
  if(!list.length){ toast('Belum ada profil penyedia. Simpan dulu lewat tombol "Simpan Profil".','warn'); return; }
  const items=list.slice().sort((a,b)=>(b.savedAt||0)-(a.savedAt||0)).map(function(p){
    const sub=fkEsc((p.data&&p.data.nama_perusahaan)||p.name);
    return '<div class="pnw-profil-item"><div class="pnw-profil-item-info"><div class="pnw-profil-item-name">'+fkEsc(p.name)+'</div>'+
      '<div class="pnw-profil-item-meta">'+sub+'</div></div>'+
      '<div class="pnw-profil-item-btns">'+profilActionBtns('penyedia',p.name)+'</div></div>';
  }).join('');
  spkPyProfilOverlay(
    '<div class="pnw-profil-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 11v6M9 14h6"/></svg>Muat Profil Penyedia'+profilUploadBtnHtml('penyedia')+'</div>'+
    '<div class="pnw-profil-sub">Data <b>Informasi Penyedia</b> saat ini akan <b>diganti</b> oleh isi profil. Keadaan sebelumnya disimpan sementara sehingga dapat dikembalikan lewat <b>Batalkan Pilihan</b>.</div>'+
    '<div class="pnw-profil-list">'+items+'</div>'
  );
}
async function spkPyProfilDoDelete(name){
  if(await profilesDelete(SPK_PY_PROFIL_KIND, name)){ toast('Profil "'+name+'" dihapus','ok'); if(spkPyProfilAll().length) spkPyProfilOpenLoad(); else spkPyProfilClose(); }
}
function spkPyProfilDoLoad(name){
  if(typeof requireInput==='function' && !requireInput()) return;
  const p=spkPyProfilAll().find(x=>String(x.name)===String(name));
  if(!p || !p.data){ toast('Profil tidak ditemukan','warn'); return; }
  const backup=spkPyProfilSnapshot();
  spkPyProfil.active=name; spkPyProfil.backup=backup;   // set sebelum render agar tag & tombol Batalkan muncul
  spkPyProfilApply(p.data);
  spkPyProfilClose();
  toast('Profil "'+name+'" dimuat','ok');
}
/* "Batalkan Pilihan" -> kembalikan data penyedia ke keadaan sebelum profil dimuat. */
function spkPyProfilCancel(){
  const bk=spkPyProfil.backup;
  spkPyProfil.active=''; spkPyProfil.backup=null;
  if(bk) spkPyProfilApply(bk); else renderSpkSusun();
  toast('Data penyedia dikembalikan seperti sebelum profil dimuat','ok');
}
function spkKlausulMove(id, dir){
  if(typeof requireInput==='function' && !requireInput()) return;
  const i=records_klausul.findIndex(k=>String(k.id)===String(id)); if(i<0) return;
  const j=i+dir; if(j<0||j>=records_klausul.length) return;
  // Tukar posisi lalu tulis ulang urutan (10,20,30, ...) agar selalu konsisten
  const arr=records_klausul.slice();
  const tmp=arr[i]; arr[i]=arr[j]; arr[j]=tmp;
  arr.forEach((k,n)=>{ k.urutan=(n+1)*10; });
  records_klausul=arr;
  spkKlSync();
  renderSpkKlausul();
}
function spkKlausulToggle(id){
  const k=records_klausul.find(x=>String(x.id)===String(id)); if(!k) return;
  k.aktif = !(k.aktif!==false);
  if(spkState){
    const on=(k.aktif!==false), sid=String(k.id);
    const i=spkState.sel.indexOf(sid);
    if(on && i<0) spkState.sel.push(sid);
    if(!on && i>=0) spkState.sel.splice(i,1);
  }
  spkKlSync();
  renderSpkKlausul();
}
function spkKlausulDelete(id){
  if(typeof requireInput==='function' && !requireInput()) return;
  const k=records_klausul.find(x=>String(x.id)===String(id)); if(!k) return;
  openConfirm({ icon:'del', title:'Hapus Klausul', text:'Hapus klausul "'+spkJudulPlain(k.judul)+'"? (hanya pada kontrak ini)',
    onYes:()=>{
      records_klausul = records_klausul.filter(x=>String(x.id)!==String(id));
      records_klausul.forEach((x,n)=>{ x.urutan=(n+1)*10; });
      if(spkState){ const i=spkState.sel.indexOf(String(id)); if(i>=0) spkState.sel.splice(i,1); }
      spkKlSync();
      toast('Klausul dihapus','ok'); renderSpkKlausul();
    }});
}
/* ---- Modal editor klausul ---- */
/* "+ Klausul" -> langsung tambah klausul baru default (nomor lanjutan otomatis
   dari posisi, isi teks default), TANPA membuka popup unggah. Template .docx bisa
   diunggah menyusul lewat tombol Ubah pada klausul tersebut. */
function spkKlausulNew(){
  if(typeof requireInput==='function' && !requireInput()) return;
  try{
    var maxU=(records_klausul||[]).reduce(function(m,x){ return Math.max(m, Number(x.urutan)||0); },0);
    var recNew={ id:spkKlUid(), judul:'KLAUSUL', isi:SPK_KL_PLACEHOLDER, urutan:maxU+10, aktif:true };
    records_klausul.push(recNew);
    if(spkState && Array.isArray(spkState.sel)) spkState.sel.push(String(recNew.id));   // langsung terpilih
    spkKlSync();
  }catch(err){ console.error(err); toast('Gagal menambah klausul: '+errMsg(err),'err'); return; }
  toast('Klausul baru ditambahkan','ok');
  renderSpkKlausul();
}
function spkKlausulEdit(id){ const k=records_klausul.find(x=>String(x.id)===String(id)); spkKlausulOpenEditor(k||null); }
/* =====================================================================
   PUSTAKA KLAUSUL — TEMPLATE WORD (.docx)
   Editor teks dihilangkan. Isi klausul kini disunting lewat Microsoft Word:
     1) Unduh Template (.docx)  -> A4, Portrait, Margin Normal (2,54 cm), Inter 11
     2) Ketik isi klausul di Word
     3) Unggah Template (.docx) -> isi otomatis dibaca & disimpan
   Teks yang diketik pada template berada DI BAWAH judul klausul dan SEJAJAR
   dengan huruf sesudah nomor klausul (menjorok 0,75 cm dari margin).
   ===================================================================== */

/* ---- Ukuran (twips: 1 cm = 566,93 twips; 1 inci = 1440) ---- */
var SPK_DX = {
  A4_W:11906, A4_H:16838,      // A4 portrait
  MARGIN:1440,                 // margin Normal Word = 2,54 cm
  IND:425,                     // 0,75 cm  (sejajar teks sesudah nomor klausul)
  IND_JUDUL:368,               // 0,65 cm  (jarak nomor -> teks pada JUDUL klausul;
                               //           pas untuk nomor 2 digit, mis. "15.")
  IND2:850,                    // 1,50 cm
  IND3:1276,                   // 2,25 cm
  /* --- nama seragam yang dipakai pembangun gaya (nilai SPK, TIDAK BERUBAH) --- */
  BASE:425,                    // dasar isi klausul
  P_FIRST:425,                 // inden baris pertama paragraf narasi
  L1:850,  L1_HANG:425,        // butir tingkat-1
  L2:1276, L2_HANG:425,        // butir tingkat-2
  DESC:850,                    // paragraf deskripsi
  JUDUL_HANG:368,              // gantungan nomor pada judul klausul
  PUSAT:false                  // judul rata KIRI satu baris ("1. DEFINISI")
};

/* =====================================================================
   KISI INDENTASI KHUSUS BENTUK PERJANJIAN/KONTRAK
   Salinan tata letak "Lihat klausul — Perjanjian/Kontrak". Acuan di layar
   (spkPkIndentStd) menghitung kolomnya secara terukur:
     dasar isi klausul    : 0 cm  (mulai tepat di batas margin kiri kertas)
     cadangan julur kiri  : ~0,20 cm  (spkPkReserve = lebar satu angka)
     kotak nomor "1."     : ~0,46 cm  (lebar nomor + SPK_NUM_GAP 0,18)
     kolom teks tingkat-1 : 0,20 + 0,46          = 0,66 cm
     penanda "a."         : kolom teks induk + SPK_PK_LEAD 0,35 = 1,01 cm
     kotak huruf "a."     : ~0,40 cm  (lebar penanda + SPK_PK_GAP_HURUF 0,10)
     kolom teks tingkat-2 : 1,01 + 0,40          = 1,41 cm
   Word tidak dapat mengukur ulang saat dokumen dibuka, jadi angka terukur itu
   DIBEKUKAN menjadi kisi tetap di bawah. Selisihnya terhadap layar < 0,03 cm.
   Bentuk Surat Perintah Kerja tetap memakai SPK_DX di atas — tidak tersentuh.
   ===================================================================== */
var SPK_DX_PK = {
  A4_W:11906, A4_H:16838,
  MARGIN:1440,
  IND:0, IND_JUDUL:0, IND2:374, IND3:799,
  BASE:0,                      // 0 cm    — isi klausul mulai di batas margin kiri
  P_FIRST:425,                 // 0,75 cm — inden baris pertama paragraf narasi
  L1:374,  L1_HANG:261,        // 0,66 cm / 0,46 cm — butir "1." / "1.1."
  L2:799,  L2_HANG:227,        // 1,41 cm / 0,40 cm — butir "a." / "b."
  DESC:374,                    // 0,66 cm — sejajar kolom teks tingkat-1
  GAP:102,                     // 0,18 cm — jeda TETAP titik nomor -> teks (SPK_NUM_GAP)
  JUDUL_HANG:0,
  PUSAT:true                   // judul rata TENGAH dua baris ("PASAL 1" + nama pasal)
};

/* Kisi yang berlaku untuk bentuk yang sedang aktif pada form Penyusunan Kontrak.
   Dipakai SELURUH pembangun template .docx, sehingga Surat Perintah Kerja
   menghasilkan berkas yang sama persis seperti sebelumnya.

   CATATAN PENTING — kenapa ada SPK_DX_OVR:
   spkIsPk() membaca spkState.data.bentuk_kontrak, dan spkBlankState() memberi
   nilai bawaan 'SPK'. Pustaka Klausul bisa dibuka TANPA ada kontrak yang sedang
   disusun (state masih kosong), sehingga template Perjanjian/Kontrak terlanjur
   dibangun memakai kisi SPK — inden tingkat-2 jadi sejajar dengan teks di
   atasnya, bukan sedikit masuk ke kanan. Karena itu pemilih bentuk pada popup
   template menyetel SPK_DX_OVR secara eksplisit selama berkas dibangun/dibaca,
   dan spkIsPk() hanya dipakai sebagai nilai bawaan. */
var SPK_DX_OVR = null;                   // 'PK' | 'SPK' | null (ikut spkIsPk())
function spkDX(){
  if(SPK_DX_OVR==='PK')  return SPK_DX_PK;
  if(SPK_DX_OVR==='SPK') return SPK_DX;
  return (typeof spkIsPk==='function' && spkIsPk()) ? SPK_DX_PK : SPK_DX;
}
/* Jalankan fn() dengan kisi bentuk tertentu, lalu kembalikan seperti semula. */
function spkWithDX(bentuk, fn){
  var prev=SPK_DX_OVR;
  SPK_DX_OVR=(bentuk==='PK'||bentuk==='SPK')?bentuk:null;
  try{ return fn(); } finally{ SPK_DX_OVR=prev; }
}

/* ================= ZIP (tulis: metode Store + CRC32) ================= */
var SPK_ZIPDATE = ((2020-1980)<<9) | (1<<5) | 1;   // tanggal DOS yang sah (1 Jan 2020)
var SPK_CRCT=null;
function spkCrcTable(){
  if(SPK_CRCT) return SPK_CRCT;
  var t=new Uint32Array(256), c, n, k;
  for(n=0;n<256;n++){ c=n; for(k=0;k<8;k++){ c = (c&1) ? (0xEDB88320 ^ (c>>>1)) : (c>>>1); } t[n]=c>>>0; }
  SPK_CRCT=t; return t;
}
function spkCrc32(u8){
  var t=spkCrcTable(), c=0xFFFFFFFF;
  for(var i=0;i<u8.length;i++){ c = t[(c ^ u8[i]) & 0xFF] ^ (c>>>8); }
  return (c ^ 0xFFFFFFFF)>>>0;
}
function spkZipBuild(files){
  var enc=new TextEncoder(), parts=[], central=[], offset=0, i;
  for(i=0;i<files.length;i++){
    var nameB=enc.encode(files[i].name), data=files[i].data, crc=spkCrc32(data);
    var lh=new Uint8Array(30+nameB.length), dv=new DataView(lh.buffer);
    dv.setUint32(0,0x04034b50,true); dv.setUint16(4,20,true); dv.setUint16(6,0,true);
    dv.setUint16(8,0,true); dv.setUint16(10,0,true); dv.setUint16(12,SPK_ZIPDATE,true);
    dv.setUint32(14,crc,true); dv.setUint32(18,data.length,true); dv.setUint32(22,data.length,true);
    dv.setUint16(26,nameB.length,true); dv.setUint16(28,0,true);
    lh.set(nameB,30); parts.push(lh); parts.push(data);
    var ch=new Uint8Array(46+nameB.length), cv=new DataView(ch.buffer);
    cv.setUint32(0,0x02014b50,true); cv.setUint16(4,20,true); cv.setUint16(6,20,true);
    cv.setUint16(8,0,true); cv.setUint16(10,0,true); cv.setUint16(12,0,true); cv.setUint16(14,SPK_ZIPDATE,true);
    cv.setUint32(16,crc,true); cv.setUint32(20,data.length,true); cv.setUint32(24,data.length,true);
    cv.setUint16(28,nameB.length,true); cv.setUint16(30,0,true); cv.setUint16(32,0,true);
    cv.setUint16(34,0,true); cv.setUint16(36,0,true); cv.setUint32(38,0,true);
    cv.setUint32(42,offset,true); ch.set(nameB,46); central.push(ch);
    offset += lh.length + data.length;
  }
  var cdSize=0; for(i=0;i<central.length;i++) cdSize+=central[i].length;
  var end=new Uint8Array(22), ev=new DataView(end.buffer);
  ev.setUint32(0,0x06054b50,true); ev.setUint16(4,0,true); ev.setUint16(6,0,true);
  ev.setUint16(8,files.length,true); ev.setUint16(10,files.length,true);
  ev.setUint32(12,cdSize,true); ev.setUint32(16,offset,true); ev.setUint16(20,0,true);
  return new Blob(parts.concat(central,[end]), {type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}

/* ================= ZIP (baca: Store + Deflate) ================= */
async function spkInflateRaw(u8){
  if(typeof DecompressionStream==='undefined')
    throw new Error('Peramban ini belum mendukung pembacaan .docx. Gunakan Chrome/Edge/Firefox versi terbaru.');
  var st=new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  var ab=await new Response(st).arrayBuffer();
  return new Uint8Array(ab);
}
async function spkUnzip(buf){
  var u8=new Uint8Array(buf), dv=new DataView(buf), eo=-1, i;
  for(i=u8.length-22; i>=0 && i>u8.length-22-65558; i--){ if(dv.getUint32(i,true)===0x06054b50){ eo=i; break; } }
  if(eo<0) throw new Error('Berkas bukan .docx yang sah (struktur ZIP tidak ditemukan).');
  var n=dv.getUint16(eo+10,true), p=dv.getUint32(eo+16,true), out={}, jobs=[], dec=new TextDecoder();
  for(i=0;i<n;i++){
    if(dv.getUint32(p,true)!==0x02014b50) break;
    var method=dv.getUint16(p+10,true);
    var csize=dv.getUint32(p+20,true);
    var nlen=dv.getUint16(p+28,true), xlen=dv.getUint16(p+30,true), clen=dv.getUint16(p+32,true);
    var lho=dv.getUint32(p+42,true);
    var name=dec.decode(u8.subarray(p+46,p+46+nlen));
    var lnlen=dv.getUint16(lho+26,true), lxlen=dv.getUint16(lho+28,true);
    var start=lho+30+lnlen+lxlen, raw=u8.subarray(start,start+csize);
    (function(nm,mt,rw){
      jobs.push((async function(){ out[nm] = (mt===0) ? rw : await spkInflateRaw(rw); })());
    })(name, method, raw);
    p += 46+nlen+xlen+clen;
  }
  await Promise.all(jobs);
  return out;
}

/* ================= OOXML: penyusun template ================= */
function spkXmlEsc(s){
  return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
/* kelas HTML dokumen SPK  <->  Style (gaya) paragraf Word.
   PENTING: Word/LibreOffice menulis ulang styleId berdasarkan NAMA gaya setiap kali
   dokumen disimpan (mis. id "Petunjuk" bernama "Petunjuk Template" berubah menjadi
   "PetunjukTemplate"). Karena itu pencocokan dilakukan pada NAMA gaya yang sudah
   dinormalkan (huruf kecil, tanpa spasi/tanda baca) — bukan pada styleId mentah. */
var SPK_CLS2STY = { kl0:'KlausulIsi', klp:'KlausulParagraf', klp1:'KlausulParagraf1', klp2:'KlausulParagraf2',
                    kl1:'KlausulButir1', kl2:'KlausulButir2', kldesc:'KlausulDeskripsi' };
var SPK_STY2CLS = { klausulisi:'kl0', klausulparagraf:'klp', klausulparagraf1:'klp1', klausulparagraf2:'klp2',
                    klausulbutir1:'kl1', klausulbutir2:'kl2', klausuldeskripsi:'kldesc' };
function spkStyNorm(s){ return String(s==null?'':s).toLowerCase().replace(/[^a-z0-9]/g,''); }

function spkStyXml(id, name, ind, extraP, extraR){
  return '<w:style w:type="paragraph" w:customStyle="1" w:styleId="'+id+'">'+
    '<w:name w:val="'+name+'"/><w:basedOn w:val="Normal"/><w:qFormat/>'+
    '<w:pPr>'+(ind||'')+(extraP||'')+'</w:pPr>'+
    (extraR ? '<w:rPr>'+extraR+'</w:rPr>' : '')+
  '</w:style>';
}
function spkStylesXml(){
  var D=spkDX();
  var tab1='<w:tabs><w:tab w:val="left" w:pos="'+D.L1+'"/></w:tabs>';
  var tab2='<w:tabs><w:tab w:val="left" w:pos="'+D.L2+'"/></w:tabs>';
  var tabH='<w:tabs><w:tab w:val="left" w:pos="'+D.JUDUL_HANG+'"/></w:tabs>';
  /* PERJANJIAN/KONTRAK — NOMOR BUTIR RATA KANAN.
     Word tidak bisa merata-kanankan nomor yang diketik manual lewat inden saja,
     jadi dipakai dua tab stop:
       tab KANAN di (kolom teks - jeda) -> titik penutup semua nomor lurus,
       tab KIRI  di kolom teks          -> awal teks semua butir sejajar.
     Isi barisnya menjadi: TAB + "1." + TAB + teks (lihat spkHtmlToWordParas).
     Hasilnya sama seperti tampilan layar: "9." dan "10." titiknya satu garis,
     jarak titik -> teks tetap, nomor 2 digit memanjang ke KIRI. */
  if(D.PUSAT){
    tab1='<w:tabs><w:tab w:val="right" w:pos="'+(D.L1-D.GAP)+'"/>'+
         '<w:tab w:val="left" w:pos="'+D.L1+'"/></w:tabs>';
  }
  /* --- Gaya judul klausul ---
     SPK : satu baris rata KIRI, nomor menggantung  -> persis seperti semula.
     PK  : dua baris rata TENGAH — "PASAL n" (gaya Klausul Pasal, bernomor
           otomatis) lalu nama pasal (gaya Klausul Judul) di bawahnya. */
  var judulSty = D.PUSAT
    ? spkStyXml('KlausulPasal','Klausul Pasal','<w:ind w:left="0" w:firstLine="0"/>',
        '<w:spacing w:before="240" w:after="0" w:line="276" w:lineRule="auto"/><w:jc w:val="center"/>',
        '<w:b/><w:caps/>')+
      spkStyXml('KlausulJudul','Klausul Judul','<w:ind w:left="0" w:firstLine="0"/>',
        '<w:spacing w:before="0" w:after="120" w:line="276" w:lineRule="auto"/><w:jc w:val="center"/>',
        '<w:b/><w:caps/>')
    : spkStyXml('KlausulJudul','Klausul Judul',
        '<w:ind w:left="'+D.JUDUL_HANG+'" w:hanging="'+D.JUDUL_HANG+'"/>',
        tabH+'<w:spacing w:before="240" w:after="60" w:line="276" w:lineRule="auto"/><w:jc w:val="left"/>',
        '<w:b/><w:caps/>');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
  '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'+
    '<w:docDefaults><w:rPrDefault><w:rPr>'+
      '<w:rFonts w:ascii="Inter" w:hAnsi="Inter" w:eastAsia="Inter" w:cs="Inter"/>'+
      '<w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="id-ID"/>'+
    '</w:rPr></w:rPrDefault>'+
    '<w:pPrDefault><w:pPr>'+
      '<w:spacing w:after="120" w:line="276" w:lineRule="auto"/><w:jc w:val="both"/>'+
    '</w:pPr></w:pPrDefault></w:docDefaults>'+
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>'+
    judulSty+
    /* Isi klausul: SPK menjorok 0,75 cm; PK mulai tepat di batas margin kiri */
    spkStyXml('KlausulIsi','Klausul Isi','<w:ind w:left="'+D.BASE+'"/>','','')+
    spkStyXml('KlausulParagraf','Klausul Paragraf','<w:ind w:left="'+D.BASE+'" w:firstLine="'+D.P_FIRST+'"/>','','')+
    spkStyXml('KlausulButir1','Klausul Butir 1','<w:ind w:left="'+D.L1+'" w:hanging="'+D.L1_HANG+'"/>',tab1,'')+
    spkStyXml('KlausulButir2','Klausul Butir 2','<w:ind w:left="'+D.L2+'" w:hanging="'+D.L2_HANG+'"/>',tab2,'')+
    spkStyXml('KlausulDeskripsi','Klausul Deskripsi','<w:ind w:left="'+D.DESC+'"/>','','')+
    spkStyXml('KlausulParagraf1','Klausul Paragraf 1','<w:ind w:left="'+D.L1+'" w:firstLine="'+D.P_FIRST+'"/>','','')+
    spkStyXml('KlausulParagraf2','Klausul Paragraf 2','<w:ind w:left="'+D.L2+'" w:firstLine="'+D.P_FIRST+'"/>','','')+
    spkStyXml('PetunjukTemplate','Petunjuk Template','<w:ind w:left="0"/>',
      '<w:spacing w:after="60" w:line="240" w:lineRule="auto"/><w:jc w:val="left"/>',
      '<w:i/><w:color w:val="808080"/><w:sz w:val="18"/><w:szCs w:val="18"/>')+
  '</w:styles>';
}
/* Penomoran OTOMATIS Word untuk baris judul klausul (bukan angka yang diketik).
   SPK : daftar desimal "1." dengan hanging indent 0,65 cm  -> seperti semula.
   PK  : teks tingkat "PASAL 1" tanpa tab pengekor (w:suff nothing) supaya
         nomornya benar-benar berada di tengah baris.
   w:start disetel ke nomor klausul agar angkanya sesuai posisinya di pustaka. */
function spkNumberingXml(startNo){
  var D=spkDX(), st=Math.max(1, parseInt(startNo,10)||1);
  var lvl = D.PUSAT
    ? '<w:lvlText w:val="PASAL %1"/><w:lvlJc w:val="left"/><w:suff w:val="nothing"/>'+
      '<w:pPr><w:ind w:left="0" w:firstLine="0"/></w:pPr>'
    : '<w:lvlText w:val="%1."/><w:lvlJc w:val="left"/>'+
      '<w:pPr><w:ind w:left="'+D.JUDUL_HANG+'" w:hanging="'+D.JUDUL_HANG+'"/></w:pPr>';
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
  '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'+
    '<w:abstractNum w:abstractNumId="0">'+
      '<w:multiLevelType w:val="singleLevel"/>'+
      '<w:lvl w:ilvl="0">'+
        '<w:start w:val="'+st+'"/>'+
        '<w:numFmt w:val="decimal"/>'+
        lvl+
      '</w:lvl>'+
    '</w:abstractNum>'+
    '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>'+
  '</w:numbering>';
}
function spkRunXml(t, f){
  var rp = f ? ((f.b?'<w:b/>':'')+(f.i?'<w:i/>':'')+(f.u?'<w:u w:val="single"/>':'')+(f.c?'<w:color w:val="'+f.c+'"/>':'')) : '';
  var rpr = rp ? ('<w:rPr>'+rp+'</w:rPr>') : '';
  if(t==='\t') return '<w:r>'+rpr+'<w:tab/></w:r>';
  if(t==='\n') return '<w:r>'+rpr+'<w:br/></w:r>';
  return '<w:r>'+rpr+'<w:t xml:space="preserve">'+spkXmlEsc(t)+'</w:t></w:r>';
}
function spkPXml(styleId, runsXml){
  return '<w:p><w:pPr><w:pStyle w:val="'+styleId+'"/></w:pPr>'+(runsXml||'')+'</w:p>';
}
/* Paragraf dengan pengaturan LANGSUNG (indent, spasi, perataan) — dipakai agar
   template yang diunduh mengikuti PERSIS format template terakhir yang diunggah. */
function spkPXml2(styleId, pPrExtra, runsXml){
  return '<w:p><w:pPr><w:pStyle w:val="'+styleId+'"/>'+(pPrExtra||'')+'</w:pPr>'+(runsXml||'')+'</w:p>';
}
/* ---- Satuan: cm/pt (CSS) -> twip (Word) ---- */
function spkCmTw(cm){ return Math.round((parseFloat(cm)||0)*566.929); }
function spkPtTw(pt){ return Math.round((parseFloat(pt)||0)*20); }
function spkCssLen(v, unit){
  v=String(v||'').trim(); if(!v) return null;
  var m=new RegExp('^(-?[0-9.]+)'+unit+'$').exec(v);
  return m ? parseFloat(m[1]) : null;
}
/* Style inline hasil pembacaan .docx (WYSIWYG) -> <w:ind>/<w:spacing>/<w:jc> Word.
   Margin kiri pada web bersifat RELATIF terhadap dasar klausul 0,75 cm, maka
   nilainya dikembalikan ke ukuran Word dengan menambahkan SPK_WX_BASE. */
function spkPPrFromCss(el){
  var st=el && el.style ? el.style : null;
  if(!st) return '';
  var hasInd=false, base=spkWxBase(), left=base, hang=0, first=0;
  var ml=spkCssLen(st.marginLeft,'cm');
  if(ml!=null){ left=base+spkCmTw(ml); hasInd=true; }
  var ti=spkCssLen(st.textIndent,'cm');
  if(ti!=null){ hasInd=true; if(ti<0) hang=spkCmTw(-ti); else if(ti>0) first=spkCmTw(ti); }
  var ind='';
  if(hasInd){
    ind='<w:ind w:left="'+Math.max(0,left)+'"'+
        (hang>0?(' w:hanging="'+hang+'"'):'')+
        (first>0?(' w:firstLine="'+first+'"'):'')+'/>';
  }
  var sp='', before=null, after=null, line=null, rule='auto';
  var mt=spkCssLen(st.marginTop,'pt'); if(mt!=null) before=spkPtTw(mt);
  var mb=spkCssLen(st.marginBottom,'pt'); if(mb!=null) after=spkPtTw(mb);
  var lh=String(st.lineHeight||'').trim();
  if(lh){
    var lhPt=spkCssLen(lh,'pt');
    if(lhPt!=null){ line=spkPtTw(lhPt); rule='exact'; }
    /* w:line 240 = 1 baris Word. line-height CSS dibagi SPK_LH_K dulu agar
       "1,15" di web tetap terbaca "1,15" di Word (bukan 1,32). */
    else if(/^[0-9.]+$/.test(lh)){ line=Math.round((parseFloat(lh)/SPK_LH_K)*240); rule='auto'; }
  }
  if(before!=null||after!=null||line!=null){
    sp='<w:spacing'+(before!=null?(' w:before="'+before+'"'):'')+
       (after!=null?(' w:after="'+after+'"'):'')+
       (line!=null?(' w:line="'+line+'" w:lineRule="'+rule+'"'):'')+'/>';
  }
  var jc='', ta=String(st.textAlign||'').trim();
  var jm={justify:'both',center:'center',right:'right',left:'left'};
  if(jm[ta]) jc='<w:jc w:val="'+jm[ta]+'"/>';
  /* Tab stop tepat pada posisi teks (setelah nomor) agar jarak nomor->teks sama.
     PERJANJIAN/KONTRAK: ditambah tab KANAN di (kolom teks - jeda) supaya nomor
     yang diketik manual ikut rata kanan — titik penutupnya lurus untuk 1 maupun
     2 digit, persis seperti tampilan di layar. */
  var tabs='';
  if(hang>0){
    var _D=spkDX();
    tabs = _D.PUSAT
      ? '<w:tabs><w:tab w:val="right" w:pos="'+Math.max(0,left-_D.GAP)+'"/>'+
        '<w:tab w:val="left" w:pos="'+Math.max(0,left)+'"/></w:tabs>'
      : '<w:tabs><w:tab w:val="left" w:pos="'+Math.max(0,left)+'"/></w:tabs>';
  }
  return tabs+ind+sp+jc;
}
/* Kumpulkan "run" (potongan teks + format) dari sebuah node HTML */
function spkCollectRuns(node, fmt, out){
  var f={b:!!fmt.b,i:!!fmt.i,u:!!fmt.u,c:(fmt.c||'')};
  if(node.nodeType===3){ var t=node.nodeValue; if(t) out.push({t:t,f:f}); return; }
  if(node.nodeType!==1) return;
  var tag=(node.tagName||'').toLowerCase();
  if(tag==='br'){ out.push({t:'\n',f:f}); return; }
  if(tag==='b'||tag==='strong') f.b=true;
  if(tag==='i'||tag==='em') f.i=true;
  if(tag==='u') f.u=true;
  if(node.classList && node.classList.contains('n')){       // kotak nomor (1. / a.)
    var nt=String(node.textContent||'').trim();
    if(nt){ out.push({t:nt,f:f}); out.push({t:'\t',f:f}); }
    return;
  }
  var ch=node.childNodes;
  for(var i=0;i<ch.length;i++) spkCollectRuns(ch[i], f, out);
}
var SPK_NUMTOK = /^((?:\d+\.)+|\d+\)|[A-Za-z][.)])[\s\u00a0]+/;
/* Kumpulan run (teks+format) dari potongan HTML -> XML run Word */
function spkRunsFromHtml(html){
  var box=document.createElement('div'); box.innerHTML=String(html||'');
  var runs=[]; spkCollectRuns(box, {}, runs);
  var rx='', j; for(j=0;j<runs.length;j++){ if(runs[j].t!=='') rx+=spkRunXml(runs[j].t, runs[j].f); }
  return rx;
}
/* Sel tabel: paragraf gaya "Klausul Isi" tanpa indent kiri (rata tabel) */
function spkKvCellXml(w, runsXml, sp){
  sp=sp||{};
  var spc='<w:spacing w:before="'+(+sp.before||0)+'" w:after="'+(+sp.after||0)+'"/>';
  return '<w:tc><w:tcPr><w:tcW w:w="'+w+'" w:type="dxa"/></w:tcPr>'+
    '<w:p><w:pPr><w:pStyle w:val="KlausulIsi"/>'+spc+'<w:ind w:left="0"/></w:pPr>'+(runsXml||'')+'</w:p></w:tc>';
}
/* Baris spk-kv (label:nilai) -> tabel 3 kolom borderless, sejajar isi klausul
   (menjorok 0,75 cm). Kolom: label | : | nilai. Round-trip dari tampilan web. */
function spkKvTableXml(rows){
  var W1=1247, W2=283, W3=7000, i;
  var borders='<w:tblBorders>'+
    ['top','left','bottom','right','insideH','insideV'].map(function(s){
      return '<w:'+s+' w:val="none" w:sz="0" w:space="0" w:color="auto"/>'; }).join('')+
    '</w:tblBorders>';
  var pr='<w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblInd w:w="'+spkWxBase()+'" w:type="dxa"/>'+borders+
    '<w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/>'+
    '<w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr>';
  var grid='<w:tblGrid><w:gridCol w:w="'+W1+'"/><w:gridCol w:w="'+W2+'"/><w:gridCol w:w="'+W3+'"/></w:tblGrid>';
  var trs='';
  for(i=0;i<rows.length;i++){
    var sp=rows[i].sp||{};                                  /* spasi baris kv (twips) */
    trs+='<w:tr>'+
      spkKvCellXml(W1, spkRunsFromHtml(rows[i].k), sp)+
      spkKvCellXml(W2, spkRunXml(':',{}), sp)+
      spkKvCellXml(W3, spkRunsFromHtml(rows[i].v), sp)+
    '</w:tr>';
  }
  return '<w:tbl>'+pr+grid+trs+'</w:tbl>';
}
/* HTML klausul  ->  paragraf Word (sesuai gaya/indentasi template) */
function spkHtmlToWordParas(html){
  var box=document.createElement('div');
  box.innerHTML=String(html||'');
  var blocks=box.querySelectorAll('p,div');
  var xml='', i, j, kvRun=[];
  var flushKv=function(){ if(kvRun.length){ xml+=spkKvTableXml(kvRun); kvRun=[]; } };
  for(i=0;i<blocks.length;i++){
    var el=blocks[i];
    /* baris "Label : nilai" -> kumpulkan lalu keluarkan sebagai tabel */
    if(el.classList && el.classList.contains('spk-kv')){
      var kEl=el.querySelector('.k'), vEl=el.querySelector('.v');
      var _tw=function(v){ var n=spkWECssPt(v); return n==null?0:Math.round(n*20); };  /* pt -> twips */
      kvRun.push({ k:kEl?kEl.innerHTML:'', v:vEl?vEl.innerHTML:'',
                   sp:{ before:_tw(el.style.marginTop), after:_tw(el.style.marginBottom) } });
      continue;
    }
    if(el.querySelector && el.querySelector('p,div')) continue;   // lewati pembungkus
    flushKv();                                                    // akhiri blok kv sebelum paragraf lain
    var cls='kl0', cl=(el.className||'').split(/\s+/);
    for(j=0;j<cl.length;j++){ if(SPK_CLS2STY[cl[j]]){ cls=cl[j]; break; } }
    var isPh=!!(el.classList && el.classList.contains('spk-ph'));   // contoh pengisian
    var runs=[]; spkCollectRuns(el, isPh?{c:'BFBFBF'}:{}, runs);
    /* nomor yang masih berupa teks biasa ("1.1. Teks") -> nomor + TAB + teks */
    if((cls==='kl1'||cls==='kl2') && runs.length && runs[0].t && runs[0].t.indexOf('\t')<0){
      var m=SPK_NUMTOK.exec(runs[0].t);
      if(m){
        var rest=runs[0].t.slice(m[0].length);
        var f0=runs[0].f;
        runs.splice(0,1,{t:m[1],f:f0},{t:'\t',f:f0},{t:rest,f:f0});
      }
    }
    /* PERJANJIAN/KONTRAK: nomor ANGKA dirata-kanankan lewat tab stop kanan.
       Caranya menyisipkan satu TAB SEBELUM nomor, sehingga urutan barisnya
       menjadi  TAB -> nomor (berhenti rata kanan) -> TAB -> teks.
       Penanda HURUF (a. b.) tetap rata kiri seperti semula, jadi tidak disentuh. */
    if(spkDX().PUSAT && cls==='kl1' && runs.length && runs[0].t!=='\t' &&
       /^(?:(?:[0-9]+\.)+|[0-9]+\))$/.test(String(runs[0].t||'').trim())){
      runs.unshift({t:'\t', f:runs[0].f});
    }
    var rx='';
    for(j=0;j<runs.length;j++){ if(runs[j].t!=='') rx+=spkRunXml(runs[j].t, runs[j].f); }
    /* Format (indent, jarak baris, jarak paragraf, perataan) diambil dari style inline
       hasil unggahan terakhir -> template yang diunduh SAMA dengan yang diunggah. */
    xml += spkPXml2(SPK_CLS2STY[cls]||'KlausulIsi', spkPPrFromCss(el), rx);
  }
  flushKv();
  return xml;
}
/* Berkas template .docx siap unduh */
function spkDocxTemplateBlob(judul, isiHtml, noKl){
  var enc=new TextEncoder(), D=spkDX(), PK=!!D.PUSAT;
  var guide=function(t){ return spkPXml('PetunjukTemplate', spkRunXml(t,{})); };
  var numPr='<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>';
  var judulRuns = spkJudulPlain(judul) ? spkRunsFromHtml(spkJudulSan(judul))
                                       : spkRunXml(PK?'NAMA PASAL':'JUDUL KLAUSUL',{});
  /* SPK : SATU baris — nomor otomatis + judul, rata kiri (seperti semula).
     PK  : DUA baris rata tengah — "PASAL n" (bernomor otomatis, tanpa teks)
           lalu nama pasal di bawahnya, persis seperti tampilan Lihat. */
  var judulXml = PK
    ? spkPXml2('KlausulPasal', numPr, '') + spkPXml('KlausulJudul', judulRuns)
    : spkPXml2('KlausulJudul', numPr, judulRuns);
  var body =
    guide('PETUNJUK (baris abu-abu ini otomatis DIABAIKAN saat diunggah — boleh dibiarkan):')+
    guide('1) Ketik isi klausul HANYA di bawah baris judul. Halaman sudah diatur A4, Portrait, margin Normal 2,54 cm, huruf Inter 11.')+
    guide('2) Gunakan Style Word: "Klausul Isi" (teks biasa), "Klausul Butir 1" (nomor 1.1.), "Klausul Butir 2" (huruf a.), "Klausul Paragraf" (paragraf menjorok).')+
    guide('3) Penomoran butir boleh memakai penomoran otomatis Word ATAU diketik manual (mis. 1.1. / a.) lalu TAB — keduanya terbaca sama persis.')+
    (PK
      ? guide('4) Baris "PASAL n" memakai penomoran otomatis Word dan rata tengah — jangan diketik ulang; cukup ubah NAMA PASAL pada baris di bawahnya.')
      : guide('4) Nomor judul klausul memakai penomoran otomatis Word (bukan angka yang diketik) — cukup ubah teks judulnya saja.'))+
    guide('5) Placeholder seperti {{nama_pekerjaan}}, {{nilai_rp}}, {{jangka_waktu_hari}} tetap boleh dipakai.')+
    judulXml;
  var isi=spkHtmlToWordParas(isiHtml);
  body += isi || spkPXml('KlausulIsi','');
  /* Word mensyaratkan paragraf setelah tabel: jika isi berakhir dengan tabel,
     tambahkan satu paragraf kosong sebelum sectPr agar berkas tetap sah. */
  if(/<\/w:tbl>\s*$/.test(body)) body += spkPXml('KlausulIsi','');
  var docXml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+
      body+
      '<w:sectPr><w:pgSz w:w="'+D.A4_W+'" w:h="'+D.A4_H+'" w:orient="portrait"/>'+
      '<w:pgMar w:top="'+D.MARGIN+'" w:right="'+D.MARGIN+'" w:bottom="'+D.MARGIN+'" w:left="'+D.MARGIN+'" w:header="708" w:footer="708" w:gutter="0"/>'+
      '</w:sectPr>'+
    '</w:body></w:document>';
  var ct='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
    '<Default Extension="xml" ContentType="application/xml"/>'+
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'+
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'+
    '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>'+
    '</Types>';
  var rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'+
    '</Relationships>';
  var drels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'+
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>'+
    '</Relationships>';
  return spkZipBuild([
    {name:'[Content_Types].xml', data:enc.encode(ct)},
    {name:'_rels/.rels',         data:enc.encode(rels)},
    {name:'word/document.xml',   data:enc.encode(docXml)},
    {name:'word/_rels/document.xml.rels', data:enc.encode(drels)},
    {name:'word/styles.xml',     data:enc.encode(spkStylesXml())},
    {name:'word/numbering.xml',  data:enc.encode(spkNumberingXml(noKl||1))}
  ]);
}

/* ================= OOXML: pembaca template ================= */
var SPK_W_NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
function spkWOn(el, name){                      // <w:b/> aktif? (w:val="0"/"false" = mati)
  var n=el.getElementsByTagNameNS(SPK_W_NS,name)[0];
  if(!n) return false;
  var v=n.getAttributeNS(SPK_W_NS,'val');
  return !(v==='0'||v==='false');
}
/* Ambang penentu tingkat butir. Diturunkan dari kisi bentuk aktif supaya
   nilai 700/1100 (kisi SPK) tidak salah membaca kisi PK yang lebih rapat:
     SPK -> tingkat-1 850, tingkat-2 1276  => ambang ~1063 / dasar 425
     PK  -> tingkat-1 374, tingkat-2  799  => ambang ~586  / dasar 0    */
function spkIndClass(left, hang, first){
  left=+left||0; hang=+hang||0; first=+first||0;
  var D=spkDX(), lv1=700, lv2=1100;                  // ambang SPK — TIDAK BERUBAH
  if(D.PUSAT){                                       // kisi PK yang lebih rapat
    lv2=Math.round((D.L1+D.L2)/2);                   // ~586
    lv1=Math.round((D.BASE+D.L1)/2);                 // ~187
  }
  if(hang>0) return (left>=lv2) ? 'kl2' : 'kl1';
  if(first>0) return (left>=lv2) ? 'klp2' : (left>=lv1 ? 'klp1' : 'klp');
  return (left>=lv1) ? 'kldesc' : 'kl0';
}
/* ===== FORMAT WORD APA ADANYA (WYSIWYG) =====
   Indentasi, jarak antar baris (line spacing), jarak antar paragraf
   (spacing before/after), jarak nomor->teks (hanging indent), dan perataan
   dibaca LANGSUNG dari berkas .docx (docDefaults -> rantai gaya basedOn ->
   definisi penomoran -> pengaturan langsung paragraf, persis urutan Word),
   lalu dibawa sebagai style inline agar tampilan web = tampilan Word. */
/* Dasar klausul dalam twips. SPK = 425 (0,75 cm) seperti semula; PK = 0 karena
   isi klausul Perjanjian/Kontrak mulai tepat di batas margin kiri. Dipakai DUA
   ARAH (tulis: spkPPrFromCss, baca: spkParaCss) sehingga bolak-balik tetap pas. */
var SPK_WX_BASE = 425;                                   // dasar klausul SPK (twips)
function spkWxBase(){ var D=spkDX(); return (D && D.BASE!=null) ? D.BASE : SPK_WX_BASE; }
function spkTwCm(tw){ return Math.round((+tw||0)/566.929*100)/100; }
function spkTwPt(tw){ return Math.round((+tw||0)/20*10)/10; }
/* Baca <w:pPr> -> {ind:{left,hanging,firstLine}, sp:{before,after,line,lineRule}, jc} */
function spkReadPPr(pPr){
  var o={ind:{},sp:{},jc:''};
  if(!pPr) return o;
  var ind=pPr.getElementsByTagNameNS(SPK_W_NS,'ind')[0];
  if(ind){
    var L=ind.getAttributeNS(SPK_W_NS,'left'); if(L==null||L==='') L=ind.getAttributeNS(SPK_W_NS,'start');
    var H=ind.getAttributeNS(SPK_W_NS,'hanging'), F=ind.getAttributeNS(SPK_W_NS,'firstLine');
    if(L!=null&&L!=='') o.ind.left=+L;
    if(H!=null&&H!==''){ o.ind.hanging=+H; o.ind.firstLine=0; }
    else if(F!=null&&F!==''){ o.ind.firstLine=+F; o.ind.hanging=0; }
  }
  var sp=pPr.getElementsByTagNameNS(SPK_W_NS,'spacing')[0];
  if(sp){
    var b=sp.getAttributeNS(SPK_W_NS,'before'), a=sp.getAttributeNS(SPK_W_NS,'after');
    var l=sp.getAttributeNS(SPK_W_NS,'line'),  lr=sp.getAttributeNS(SPK_W_NS,'lineRule');
    if(b!=null&&b!=='') o.sp.before=+b;
    if(a!=null&&a!=='') o.sp.after=+a;
    if(l!=null&&l!==''){ o.sp.line=+l; o.sp.lineRule=lr||'auto'; }
  }
  var jc=pPr.getElementsByTagNameNS(SPK_W_NS,'jc')[0];
  if(jc) o.jc=jc.getAttributeNS(SPK_W_NS,'val')||'';
  return o;
}
/* docDefaults + seluruh gaya paragraf dari word/styles.xml */
function spkStylePropMap(stylesXml){
  var res={def:{ind:{},sp:{after:120,line:276,lineRule:'auto'},jc:'both'},sty:{}};
  if(!stylesXml) return res;
  try{
    var sd=new DOMParser().parseFromString(stylesXml,'application/xml');
    var dPr=sd.getElementsByTagNameNS(SPK_W_NS,'pPrDefault')[0];
    if(dPr){
      var d=spkReadPPr(dPr.getElementsByTagNameNS(SPK_W_NS,'pPr')[0]);
      res.def={ ind:d.ind,
        sp:Object.assign({before:0,after:0,line:240,lineRule:'auto'}, d.sp),
        jc:d.jc||'' };
    }
    var st=sd.getElementsByTagNameNS(SPK_W_NS,'style');
    for(var i=0;i<st.length;i++){
      if((st[i].getAttributeNS(SPK_W_NS,'type')||'')!=='paragraph') continue;
      var id=st[i].getAttributeNS(SPK_W_NS,'styleId')||'';
      var bo=st[i].getElementsByTagNameNS(SPK_W_NS,'basedOn')[0];
      var pPr=null, kids=st[i].childNodes;
      for(var k=0;k<kids.length;k++){ if(kids[k].nodeType===1&&kids[k].localName==='pPr'){ pPr=kids[k]; break; } }
      var o=spkReadPPr(pPr); o.basedOn=bo?(bo.getAttributeNS(SPK_W_NS,'val')||''):'';
      res.sty[id]=o;
    }
  }catch(e){}
  return res;
}
/* Properti efektif sebuah gaya: docDefaults -> rantai basedOn */
function spkStyleChain(map, sid){
  var chain=[], seen={}, id=sid;
  while(id && map.sty[id] && !seen[id]){ seen[id]=1; chain.unshift(map.sty[id]); id=map.sty[id].basedOn; }
  var eff={ ind:Object.assign({},map.def.ind), sp:Object.assign({},map.def.sp), jc:map.def.jc||'' };
  for(var i=0;i<chain.length;i++){
    Object.assign(eff.ind, chain[i].ind);
    Object.assign(eff.sp,  chain[i].sp);
    if(chain[i].jc) eff.jc=chain[i].jc;
  }
  return eff;
}
/* Definisi level penomoran (numId+ilvl) -> objek lvl (fmt, text, ind, ...) */
function spkNumLvl(numbering, numId, ilvl){
  var absId=numbering.numToAbs[numId];
  var levels=(absId!=null)?numbering.abs[absId]:null;
  return levels ? (levels[String(+ilvl||0)]||levels[+ilvl||0]||null) : null;
}
/* Karakter simbol daftar (font Symbol/Wingdings) -> karakter web */
function spkBulletChar(s){
  s=String(s||'').replace(/%\d/g,'').trim(); if(!s) return '\u2022';
  var map={'\uF0B7':'\u2022','\uF0A7':'\u25AA','\uF0A8':'\u25AB','\uF0D8':'\u27A2',
           '\uF076':'\u2756','\uF0FC':'\u2713','\uF0B4':'\u2717','\uF0E0':'\u2192','\uF0A0':'\u25CF'};
  var c=s.charAt(0);
  if(map[c]) return map[c];
  if(c.charCodeAt(0)>=0xF000) return '\u2022';
  return s;
}
/* Properti efektif -> style inline. Margin kiri dihitung RELATIF terhadap
   dasar klausul (0,75 cm) karena kontainer .spk-cl sudah menjorok 0,75 cm. */
function spkParaCss(eff, noInd){
  var css='';
  if(!noInd){
    var left=+eff.ind.left||0, hang=+eff.ind.hanging||0, first=+eff.ind.firstLine||0;
    css+='margin-left:'+spkTwCm(left-spkWxBase())+'cm;';
    if(hang>0) css+='text-indent:-'+spkTwCm(hang)+'cm;';
    else if(first>0) css+='text-indent:'+spkTwCm(first)+'cm;';
    else css+='text-indent:0;';
  }
  css+='margin-top:'+spkTwPt(eff.sp.before||0)+'pt;';
  css+='margin-bottom:'+spkTwPt(eff.sp.after||0)+'pt;';
  var line=+eff.sp.line||240, lr=eff.sp.lineRule||'auto';
  /* Word "auto" (kelipatan) -> line-height CSS DENGAN koreksi SPK_LH_K, sama seperti
     isi kontrak lainnya, supaya "1,15" di Word tampil "1,15" di web (bukan spasi tunggal). */
  css+='line-height:'+((lr==='auto') ? (Math.round(line/240*SPK_LH_K*1000)/1000) : (spkTwPt(line)+'pt'))+';';
  if(eff.jc){
    var jm={both:'justify',center:'center',right:'right',left:'left',start:'left',end:'right'};
    if(jm[eff.jc]) css+='text-align:'+jm[eff.jc]+';';
  }
  return css;
}
/* Kotak nomor = PERSIS seperti Word:
     - RATA KANAN (w:lvlJc=right): lebar kotak TETAP selebar hanging Word. Nomor
       ditempel ke sisi kanan kotak; nomor yang lebih panjang (8.10.) memanjang KE KIRI,
       bukan mendorong teks. Jadi kolom teks semua butir sama, dan titik nomor sejajar.
     - RATA KIRI (bawaan): lebar MINIMAL selebar hanging; bila nomornya lebih lebar
       (mis. "3.1.4."), kotak melebar dan teks terdorong — sama seperti Word.
   Perataan diambil dari w:lvlJc pada numbering.xml, bukan tebakan aplikasi. */
function spkNumBox(txt, hangCm, jc){
  var isNum=/^(?:[0-9]+[.)])+$/.test(String(txt||'').trim());
  /* ANGKA -> selalu RATA KANAN dengan lebar kotak TETAP (= hanging Word):
       - kolom teks semua butir SAMA (tidak pernah terdorong nomor 2 digit),
       - nomor 2 digit yang lebih panjang memanjang KE KIRI, bukan menabrak teks,
       - titik akhir nomor sejajar untuk 1 digit maupun 2 digit.
     HURUF / simbol (a. b. / bullet) -> rata kiri dengan lebar kotak TETAP (= hanging
     Word), sama seperti cabang ANGKA, supaya awal teks SEMUA butir sejajar walau
     lebar hurufnya berbeda (mis. "l." sempit vs "m."/"n." lebih lebar). */
  var gap=SPK_NUM_GAP+'cm';                     /* jeda tetap nomor -> teks */
  if(isNum){
    return '<span class="n" style="display:inline-block;width:'+hangCm+'cm;box-sizing:border-box;'+
      'padding-right:'+gap+';text-indent:0;white-space:nowrap;overflow:visible;text-align:right">'+txt+'</span>';
  }
  /* RATA KIRI (bawaan): kotak LEBAR TETAP = hanging. Nomor rata kiri di dalam kotak;
     awal teks butir selalu sejajar (di posisi hanging) tanpa terdorong oleh huruf
     yang lebih lebar. Bila nomor lebih lebar dari kotak, ia meluber ke kanan
     (overflow:visible) — sama seperti tab hanging-indent di Word. */
  var al=(jc==='right'||jc==='end')?'right':((jc==='center')?'center':'left');
  return '<span class="n" style="display:inline-block;width:'+hangCm+'cm;box-sizing:border-box;'+
    'padding-right:'+gap+';text-indent:0;white-space:nowrap;overflow:visible;text-align:'+al+'">'+txt+'</span>';
}
/* Peta styleId -> NAMA gaya (dinormalkan) dari word/styles.xml */
function spkStyleNameMap(stylesXml){
  var map={};
  if(!stylesXml) return map;
  try{
    var sd=new DOMParser().parseFromString(stylesXml,'application/xml');
    var st=sd.getElementsByTagNameNS(SPK_W_NS,'style');
    for(var i=0;i<st.length;i++){
      var id=st[i].getAttributeNS(SPK_W_NS,'styleId')||'';
      var nm=st[i].getElementsByTagNameNS(SPK_W_NS,'name')[0];
      map[id] = spkStyNorm(nm ? (nm.getAttributeNS(SPK_W_NS,'val')||'') : id);
    }
  }catch(e){}
  return map;
}
/* Teks + format (b/i/u) sebuah paragraf Word */
function spkWpText(p){
  var rs=p.getElementsByTagNameNS(SPK_W_NS,'r'), out='', plain='', j, k;
  for(j=0;j<rs.length;j++){
    var r=rs[j], rPr=r.getElementsByTagNameNS(SPK_W_NS,'rPr')[0];
    var b=rPr?spkWOn(rPr,'b'):false, it=rPr?spkWOn(rPr,'i'):false, un=rPr?spkWOn(rPr,'u'):false;
    var txt='', kids=r.childNodes;
    for(k=0;k<kids.length;k++){
      var c=kids[k]; if(c.nodeType!==1) continue;
      var ln=c.localName;
      if(ln==='t') txt += (c.textContent||'');
      else if(ln==='tab') txt += '\t';
      else if(ln==='br') txt += '\n';
    }
    if(!txt) continue;
    plain += txt;
    var seg=fkEsc(txt).replace(/\n/g,'<br>');
    if(un) seg='<u>'+seg+'</u>';
    if(it) seg='<i>'+seg+'</i>';
    if(b)  seg='<b>'+seg+'</b>';
    out += seg;
  }
  return { html:out, plain:plain.replace(/\s+/g,' ').trim() };
}
/* Teks (html+plain) sebuah SEL tabel: gabungkan seluruh paragraf di dalamnya */
function spkWTcText(tc){
  var ps=tc.getElementsByTagNameNS(SPK_W_NS,'p'), html='', plain='', j;
  for(j=0;j<ps.length;j++){
    var t=spkWpText(ps[j]);
    if(j>0){ if(html) html+='<br>'; if(plain) plain+=' '; }
    html+=t.html; plain+=t.plain;
  }
  return { html:html.replace(/\t/g,' '), plain:plain.replace(/\s+/g,' ').trim() };
}
/* Tabel Word -> HTML klausul. Baris "label | : | nilai" (3 kolom) atau
   "label | nilai" (2 kolom) dijadikan baris spk-kv yang SEJAJAR seperti Word.
   Bentuk tabel lain digabung antar-kolom menjadi satu paragraf biasa. */
function spkWTblToHtml(tbl){
  var trs=tbl.getElementsByTagNameNS(SPK_W_NS,'tr'), html='', i, j;
  /* Lebar kolom asli dari Word -> posisi titik dua & nilai SAMA PERSIS dengan
     tabel yang Anda buat (bukan lebar tetap yang membuat jaraknya jauh). */
  var gc=tbl.getElementsByTagNameNS(SPK_W_NS,'gridCol');
  var twCm=function(tw){ tw=+tw||0; return tw>0 ? (Math.round(tw/566.93*100)/100)+'cm' : ''; };
  var kw=gc.length>0 ? twCm(gc[0].getAttributeNS(SPK_W_NS,'w')) : '';
  var sw=gc.length>1 ? twCm(gc[1].getAttributeNS(SPK_W_NS,'w')) : '';
  var kStyle=kw?(' style="flex:0 0 '+kw+';max-width:'+kw+'"'):'';
  var sStyle=sw?(' style="flex:0 0 '+sw+';width:'+sw+'"'):'';
  for(i=0;i<trs.length;i++){
    var tcs=[], kids=trs[i].childNodes;
    for(j=0;j<kids.length;j++){ if(kids[j].nodeType===1 && kids[j].localName==='tc') tcs.push(kids[j]); }
    if(!tcs.length) continue;
    var cells=[]; for(j=0;j<tcs.length;j++) cells.push(spkWTcText(tcs[j]));
    var filled=0; for(j=0;j<cells.length;j++){ if(cells[j].plain!=='') filled++; }
    if(!filled) continue;                                        // baris kosong -> lewati
    /* Spasi sebelum/sesudah (w:spacing) paragraf di dalam baris tabel Word DIBACA dan
       dipasang sebagai style inline pada .spk-kv -> 12 pt di Word tetap 12 pt di web. */
    var wps=trs[i].getElementsByTagNameNS(SPK_W_NS,'p'), aft=0, bef=0, q, qPr, qSp;
    for(q=0;q<wps.length;q++){
      qPr=wps[q].getElementsByTagNameNS(SPK_W_NS,'pPr')[0];
      qSp=qPr?spkReadPPr(qPr).sp:{};
      if(qSp.after!=null)  aft=Math.max(aft, +qSp.after||0);
      if(qSp.before!=null) bef=Math.max(bef, +qSp.before||0);
    }
    var rowSty='';
    if(bef) rowSty+='margin-top:'+spkTwPt(bef)+'pt;';
    if(aft) rowSty+='margin-bottom:'+spkTwPt(aft)+'pt;';
    rowSty = rowSty ? (' style="'+rowSty+'"') : '';
    if(cells.length===3 && cells[1].plain===':'){                // label | : | nilai
      html+='<div class="spk-kv"'+rowSty+'><span class="k"'+kStyle+'>'+cells[0].html+'</span>'+
            '<span class="s"'+sStyle+'>:</span><span class="v">'+cells[2].html+'</span></div>';
    }else if(cells.length===2){                                  // label | nilai
      html+='<div class="spk-kv"'+rowSty+'><span class="k"'+kStyle+'>'+cells[0].html+'</span>'+
            '<span class="s"'+sStyle+'>:</span><span class="v">'+cells[1].html+'</span></div>';
    }else{                                                       // tabel lain -> gabung kolom
      var parts=[]; for(j=0;j<cells.length;j++){ if(cells[j].html) parts.push(cells[j].html); }
      html+='<p class="kl0">'+parts.join(' ')+'</p>';
    }
  }
  return html;
}
/* ================= Penomoran OTOMATIS Word (word/numbering.xml) =================
   Word menyimpan nomor daftar (1.1., a., 1., dst.) SECARA OTOMATIS \u2014 bukan sebagai
   teks. Bagian ini membaca definisi & menghitung nomornya persis seperti Word,
   lalu menyuntikkannya sebagai teks agar tampil sama di website. */
function spkRoman(n){
  var m=[[1000,'m'],[900,'cm'],[500,'d'],[400,'cd'],[100,'c'],[90,'xc'],[50,'l'],
         [40,'xl'],[10,'x'],[9,'ix'],[5,'v'],[4,'iv'],[1,'i']], s=''; n=+n||0;
  for(var i=0;i<m.length;i++){ while(n>=m[i][0]){ s+=m[i][1]; n-=m[i][0]; } } return s;
}
function spkNumFmt(n, fmt){
  n=+n||0;
  if(fmt==='lowerLetter') return String.fromCharCode(97+((n-1)%26));
  if(fmt==='upperLetter') return String.fromCharCode(65+((n-1)%26));
  if(fmt==='lowerRoman')  return spkRoman(n);
  if(fmt==='upperRoman')  return spkRoman(n).toUpperCase();
  if(fmt==='decimalZero') return (n<10?'0':'')+n;
  return String(n);                                          // decimal
}
function spkParseNumbering(xml){
  var numToAbs={}, abs={};
  if(!xml) return {numToAbs:numToAbs, abs:abs};
  try{
    var d=new DOMParser().parseFromString(xml,'application/xml'), i, j;
    var an=d.getElementsByTagNameNS(SPK_W_NS,'abstractNum');
    for(i=0;i<an.length;i++){
      var aid=an[i].getAttributeNS(SPK_W_NS,'abstractNumId'); abs[aid]={};
      var lvls=an[i].getElementsByTagNameNS(SPK_W_NS,'lvl');
      for(j=0;j<lvls.length;j++){
        var il=lvls[j].getAttributeNS(SPK_W_NS,'ilvl');
        var nf=lvls[j].getElementsByTagNameNS(SPK_W_NS,'numFmt')[0];
        var lt=lvls[j].getElementsByTagNameNS(SPK_W_NS,'lvlText')[0];
        var st=lvls[j].getElementsByTagNameNS(SPK_W_NS,'start')[0];
        var li=spkReadPPr(lvls[j].getElementsByTagNameNS(SPK_W_NS,'pPr')[0]);
        /* PERATAAN NOMOR dari Word (w:lvlJc): left / center / right.
           Inilah yang membuat nomor 1 digit & 2 digit sejajar di Word. */
        var lj=lvls[j].getElementsByTagNameNS(SPK_W_NS,'lvlJc')[0];
        abs[aid][il]={
          fmt:  nf?(nf.getAttributeNS(SPK_W_NS,'val')||'decimal'):'decimal',
          text: lt?(lt.getAttributeNS(SPK_W_NS,'val')||''):'',
          start:st?(parseInt(st.getAttributeNS(SPK_W_NS,'val'),10)||1):1,
          jc:   lj?(lj.getAttributeNS(SPK_W_NS,'val')||'left'):'left',
          ind:  li.ind||{}
        };
      }
    }
    var nums=d.getElementsByTagNameNS(SPK_W_NS,'num');
    for(i=0;i<nums.length;i++){
      var nid=nums[i].getAttributeNS(SPK_W_NS,'numId');
      var ab=nums[i].getElementsByTagNameNS(SPK_W_NS,'abstractNumId')[0];
      numToAbs[nid]= ab?(ab.getAttributeNS(SPK_W_NS,'val')||''):'';
    }
  }catch(e){}
  return {numToAbs:numToAbs, abs:abs};
}
/* Mesin penghitung: state counter per numId, menaikkan level & mereset sub-level
   persis seperti Word. Mengembalikan teks nomor jadi (mis. "1.2." atau "a."). */
function spkNumberer(numbering){
  var counters={};
  return function(numId, ilvl){
    var absId=numbering.numToAbs[numId];
    var levels=(absId!=null)?numbering.abs[absId]:null;
    if(!levels) return '';
    ilvl=+ilvl||0;
    if(!counters[numId]) counters[numId]=[];
    var c=counters[numId];
    var lv=levels[ilvl]||{fmt:'decimal',text:'%'+(ilvl+1)+'.',start:1};
    if(lv.fmt==='bullet') return spkBulletChar(lv.text);   // simbol poin (•, -, ▪ ...)
    if(c[ilvl]==null) c[ilvl]=lv.start; else c[ilvl]=c[ilvl]+1;
    for(var d=ilvl+1; d<c.length; d++) c[d]=null;            // reset sub-level lebih dalam
    var txt=lv.text||('%'+(ilvl+1)+'.');
    txt=txt.replace(/%(\d)/g, function(m,g){
      var idx=(+g)-1, lvd=levels[idx]||{fmt:'decimal',start:1};
      var val=(c[idx]!=null)?c[idx]:lvd.start;
      return spkNumFmt(val, lvd.fmt);
    });
    return txt;
  };
}
/* word/document.xml -> { judul, html } dalam format kelas dokumen SPK (kl0/kl1/kl2/...) */
function spkWordXmlToKlausul(xmlText, stylesXml, numberingXml){
  var doc=new DOMParser().parseFromString(xmlText,'application/xml');
  if(doc.getElementsByTagName('parsererror').length) throw new Error('Isi dokumen tidak dapat dibaca.');
  var body=doc.getElementsByTagNameNS(SPK_W_NS,'body')[0];
  if(!body) throw new Error('Struktur dokumen Word tidak dikenali.');
  var nameOf=spkStyleNameMap(stylesXml);
  var propMap=spkStylePropMap(stylesXml);
  var numbering=spkParseNumbering(numberingXml);
  var nextNum=spkNumberer(numbering);
  /* --- Lintasan 1: kumpulkan blok level-atas BERURUTAN (paragraf & tabel) ---
     Penting: tabel Word (mis. blok "Nama : nilai") ikut dibaca sebagai satu
     kesatuan, bukan diratakan jadi paragraf lepas yang menyatu. */
  var blocks=[], kids=body.childNodes, i;
  for(i=0;i<kids.length;i++){
    var nd=kids[i]; if(nd.nodeType!==1) continue;
    var ln=nd.localName;
    if(ln==='p'){
      var pPr=nd.getElementsByTagNameNS(SPK_W_NS,'pPr')[0];
      var styEl=pPr?pPr.getElementsByTagNameNS(SPK_W_NS,'pStyle')[0]:null;
      var sid=styEl?(styEl.getAttributeNS(SPK_W_NS,'val')||''):'';
      /* cocokkan lewat NAMA gaya (tahan terhadap penulisan ulang styleId oleh Word) */
      var key=nameOf[sid] || spkStyNorm(sid);
      /* baca penomoran otomatis (numPr) bila ada */
      var np=pPr?pPr.getElementsByTagNameNS(SPK_W_NS,'numPr')[0]:null;
      var numId='', ilvl='0';
      if(np){
        var ni=np.getElementsByTagNameNS(SPK_W_NS,'numId')[0];
        var il=np.getElementsByTagNameNS(SPK_W_NS,'ilvl')[0];
        numId= ni?(ni.getAttributeNS(SPK_W_NS,'val')||''):'';
        ilvl=  il?(il.getAttributeNS(SPK_W_NS,'val')||'0'):'0';
      }
      blocks.push({t:'p', p:nd, pPr:pPr, sid:sid, key:key, numId:numId, ilvl:ilvl});
    }else if(ln==='tbl'){
      blocks.push({t:'tbl', el:nd, key:''});
    }
  }
  var judulAt=-1;
  for(i=0;i<blocks.length;i++){ if(blocks[i].t==='p' && blocks[i].key==='klausuljudul'){ judulAt=i; break; } }
  /* --- Lintasan 2: bangun HTML klausul --- */
  var html='', judul='';
  for(i=0;i<blocks.length;i++){
    if(judulAt>=0 && i<judulAt) continue;                   // apa pun di atas judul -> abaikan
    var b=blocks[i];
    if(b.t==='tbl'){ html+=spkWTblToHtml(b.el); continue; } // tabel -> baris spk-kv sejajar
    var key=b.key;
    if(key.indexOf('petunjuk')===0) continue;               // baris petunjuk -> abaikan
    /* Baris "PASAL n" pada template Perjanjian/Kontrak hanyalah penomoran
       otomatis Word tanpa teks. Nomor pasal dibangun ulang oleh aplikasi dari
       urutan klausul, jadi baris ini tidak ikut menjadi isi. */
    if(key==='klausulpasal') continue;
    var t=spkWpText(b.p);
    if(key==='klausuljudul'){                               // baris judul klausul
      if(!judul){
        /* Format huruf (miring/tebal/garis bawah) pada judul DIPERTAHANKAN.
           Judul di template pakai gaya "Klausul Judul" ber-efek All Caps (w:caps):
           di Word tampak HURUF BESAR walau yang diketik huruf kecil/campuran, tapi
           teks mentah .docx menyimpan huruf aslinya. Agar tampilan web = tampilan
           Word (dan seragam dgn kop klausul yg memang selalu kapital), judul
           dinaikkan ke huruf besar -- tag <i>/<b>/<u> tetap dipertahankan. */
        var jh=String(t.html||'').replace(/\t/g,' ')
          .replace(/^((?:<(?:b|i|u)>)*)\s*((?:\d+\.)+|\d+[.)])[\s\u00a0]*/, '$1');
        judul = spkJudulCase(spkJudulSan(jh),'upper').replace(/^\s+|\s+$/g,'');
        if(!spkJudulPlain(judul)) judul='';
      }
      continue;
    }
    /* nomor OTOMATIS Word (dihitung berurutan, meski teksnya kosong tetap sah) */
    var numStr='';
    if(b.numId && b.numId!=='0'){ numStr=nextNum(b.numId, b.ilvl); }
    if(!t.plain && !numStr) continue;                       // baris benar-benar kosong -> lewati
    /* === properti EFEKTIF paragraf, persis urutan Word:
       docDefaults -> rantai gaya (basedOn) -> definisi penomoran -> pPr langsung === */
    var eff=spkStyleChain(propMap, b.sid);
    var lvlDef2=null;
    if(b.numId && b.numId!=='0'){
      var lvlDef=spkNumLvl(numbering, b.numId, b.ilvl);
      lvlDef2=lvlDef;
      if(lvlDef && lvlDef.ind){
        if(lvlDef.ind.left!=null) eff.ind.left=lvlDef.ind.left;
        if(lvlDef.ind.hanging!=null){ eff.ind.hanging=lvlDef.ind.hanging; if(lvlDef.ind.hanging>0) eff.ind.firstLine=0; }
        if(lvlDef.ind.firstLine!=null && lvlDef.ind.firstLine>0){ eff.ind.firstLine=lvlDef.ind.firstLine; eff.ind.hanging=0; }
      }
    }
    var dir=spkReadPPr(b.pPr);
    Object.assign(eff.ind, dir.ind); Object.assign(eff.sp, dir.sp); if(dir.jc) eff.jc=dir.jc;
    var cls=SPK_STY2CLS[key];
    if(!cls){ cls=spkIndClass(eff.ind.left, eff.ind.hanging, eff.ind.firstLine); }
    var out=t.html;
    var hangCm=spkTwCm(eff.ind.hanging||0);
    var wrapped=false, plainNumFallback=false;
    if(numStr){
      /* paragraf bernomor otomatis: nomor ditaruh dalam kotak selebar hanging
         indent Word -> jarak nomor->teks & baris lanjutan SAMA seperti Word. */
      if(cls!=='kl1' && cls!=='kl2') cls=((+b.ilvl)>=1)?'kl2':'kl1';
      if(hangCm>=0.2){
        var lvlJc=(lvlDef2 && lvlDef2.jc) ? lvlDef2.jc : 'left';   /* perataan nomor dari Word */
        out=spkNumBox(spkXmlEsc(numStr), hangCm, lvlJc)+out.replace(/^[\t ]+/,'');
        wrapped=true;
      }else{
        out=spkXmlEsc(numStr)+' '+out;
        plainNumFallback=true;
      }
    }else{
      /* nomor yang DIKETIK manual (mis. "2.1." lalu TAB/spasi) di paragraf
         yang punya hanging indent -> perlakukan sama seperti nomor otomatis */
      var mm=/^((?:<(?:b|i|u)>)*)[\t ]*((?:\d+\.)+|\d+\)|[A-Za-z][.)])[\t\u00a0 ]+/.exec(out);
      if(mm && hangCm>=0.2 && !/^(CV|CD|MM|DVD|DIV|MMC|LC|DC|ID|IL|IM)[.)]$/i.test(mm[2])){
        if(cls!=='kl1' && cls!=='kl2') cls=((+eff.ind.left||0)>=1100)?'kl2':'kl1';
        out=mm[1]+spkNumBox(mm[2], hangCm, (lvlDef2&&lvlDef2.jc)||'left')+out.slice(mm[0].length);
        wrapped=true;
      }else{
        if(cls==='kl0'||cls==='kldesc'){                    // deteksi nomor yang diketik manual
          if(/^[\t ]*(?:\d+\.)+[\s\u00a0]/.test(t.plain)) cls='kl1';
          else if(/^[\t ]*[A-Za-z][.)][\s\u00a0]/.test(t.plain)) cls='kl2';
          if(cls==='kl1'||cls==='kl2') plainNumFallback=true;
        }
        /* Huruf masuk (spasi di awal) tanpa first-line indent dari Word ->
           jadikan indentasi baris pertama 0,75 cm yang seragam. */
        var lead=out.match(/^([ \u00a0]+)/);
        if(lead && !(eff.ind.hanging>0)){
          if(!(eff.ind.firstLine>0)) eff.ind.firstLine=spkDX().P_FIRST;
          out=out.slice(lead[1].length);
          if(cls==='kldesc'||cls==='kl0') cls='klp';
        }
      }
    }
    out=out.replace(/\t/g,' ');
    /* rapikan spasi bekas TAB sesudah nomor menjadi satu spasi */
    out=out.replace(/^(\s*(?:(?:\d+\.)+|\d+\)|[A-Za-z][.)]))[ \u00a0]{2,}/, '$1 ');
    /* Style inline dari Word. Bila nomor dibiarkan polos (fallback), indentasi
       diserahkan ke spkNumberFix agar kotak nomornya tetap rapi. */
    var css=spkParaCss(eff, plainNumFallback);
    if(plainNumFallback){
      html += '<p class="'+cls+'" style="'+css+'">'+out+'</p>';
    }else{
      html += '<p class="'+cls+' spk-wx'+(wrapped?' spk-sl':'')+'" style="'+css+'">'+out+'</p>';
    }
  }
  return { judul:judul, html:html };
}

/* ================= MODAL: UBAH / TAMBAH KLAUSUL (via template Word) ================= */
var spkKlDoc = { rec:null, isi:'', no:1, fileName:'', dirty:false, docx:'', bentuk:'' };

/* Bentuk tata letak yang dipakai popup template. Diambil dari pilihan pengguna
   bila sudah ada, kalau belum mengikuti bentuk yang sedang aktif. */
function spkKlDocBentuk(){
  var el=document.getElementById('spk-kldoc-bentuk');
  if(el && el.value) return (el.value==='PK')?'PK':'SPK';
  if(spkKlDoc.bentuk) return spkKlDoc.bentuk;
  return (typeof spkIsPk==='function' && spkIsPk()) ? 'PK' : 'SPK';
}
function spkKlDocPk(){ return spkKlDocBentuk()==='PK'; }
/* Ganti bentuk -> pratinjau & kop ikut menyesuaikan */
function spkKlDocBentukUbah(){
  var el=document.getElementById('spk-kldoc-bentuk');
  spkKlDoc.bentuk = (el && el.value==='PK') ? 'PK' : 'SPK';
  try{ spkKlDocHead(); spkKlDocPreview(); }catch(e){}
}

function spkKlausulOpenEditor(k){
  var isEdit=!!(k && k.id);
  var noKl=1;
  try{
    var aktif=(records_klausul||[]).filter(function(x){ return x.aktif!==false; })
      .sort(function(a,b){ return (Number(a.urutan)||0)-(Number(b.urutan)||0); });
    var i=isEdit? aktif.findIndex(function(x){ return String(x.id)===String(k.id); }) : -1;
    noKl=(i>=0)?(i+1):(aktif.length+1);
  }catch(e){}
  spkKlDoc={ rec:isEdit?k:null, isi:isEdit?String(k.isi||''):'', no:noKl, fileName:'', dirty:false,
             docx:(isEdit && k && k.isi_docx)?String(k.isi_docx):'',
             bentuk:((typeof spkIsPk==='function' && spkIsPk())?'PK':'SPK') };

  var ov=document.getElementById('spk-kldoc-ov');
  if(!ov){
    ov=document.createElement('div'); ov.id='spk-kldoc-ov'; ov.className='spk-ov';
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e){ if(e.target.id==='spk-kldoc-ov') spkKlDocAskClose(); });
  }
  ov.innerHTML=
    '<div class="spk-ov-modal spk-ov-we" style="height:auto;max-height:92vh;width:min(530px,96vw)">'+
      '<div class="spk-ov-head spk-we-head">'+
        '<span class="spk-ov-title">Unggah Klausul Kontrak</span>'+
        '<div class="spk-we-wbtns">'+
          '<button type="button" class="spk-we-wbtn close" title="Tutup" onclick="spkKlDocAskClose()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'+
        '</div>'+
      '</div>'+
      '<div class="spk-ov-body">'+
        '<div class="spk-kldoc-top">'+
          /* Judul klausul otomatis mengikuti judul pada template .docx (tebal & miring ikut terbawa) — disimpan tersembunyi */
          '<div id="spk-kldoc-judul" class="spk-kldoc-jinput" contenteditable="true" spellcheck="false" style="display:none">'+(isEdit?spkJudulSan(k.judul||''):'')+'</div>'+
          '<div class="spk-kldoc-tools">'+
            '<button type="button" class="btn btn-teal btn-sm" onclick="spkKlDocDownload()">'+
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg> Download Template (.docx)</button>'+
            '<input type="file" id="spk-kldoc-file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="display:none" onchange="spkKlDocUpload(event)">'+
            /* Pemilih bentuk tata letak template. Nilai bawaan mengikuti bentuk
               yang sedang aktif, tetapi tetap bisa diubah — sebab Pustaka Klausul
               boleh dibuka tanpa kontrak yang sedang disusun (state bawaannya
               'SPK'), dan tanpa pemilih ini template Perjanjian/Kontrak akan
               terbangun memakai kisi inden SPK. */
            '<label class="spk-kldoc-bentuk">Tata letak'+
              '<select id="spk-kldoc-bentuk" onchange="spkKlDocBentukUbah()">'+
                '<option value="SPK"'+(spkKlDocPk()?'':' selected')+'>Surat Perintah Kerja</option>'+
                '<option value="PK"'+(spkKlDocPk()?' selected':'')+'>Perjanjian/Kontrak</option>'+
              '</select></label>'+
            '<span class="spk-kldoc-meta" id="spk-kldoc-meta"></span>'+
          '</div>'+
          /* Kotak Unggah File: telusuri berkas + Drag and drop (selalu tampil) */
          '<div class="spk-kldoc-dz show" id="spk-kldoc-dz" onclick="spkKlDocBrowse()">'+
            '<svg class="spk-kldoc-dzic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+
              '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/></svg>'+
            '<div class="t">Seret &amp; letakkan berkas .docx di sini</div>'+
            '<div class="s">atau <b>klik untuk menelusuri</b> berkas</div>'+
            '<div class="s2">Hanya berkas Word (.docx)</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="spk-we-foot">'+
        '<span class="spk-we-status">'+
          '<span>A4 &middot; Portrait &middot; Margin Normal (2,54 cm) &middot; Arial 11</span></span>'+
        '<div style="display:flex;gap:8px">'+
          '<button class="btn btn-ghost btn-sm" onclick="spkKlDocAskClose()">Batal</button>'+
          '<button class="btn btn-green" onclick="spkKlDocSave()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg> Simpan</button>'+
        '</div>'+
      '</div>'+
    '</div>';
  ov.classList.add('show');
  spkKlDocBindDrop();
  spkKlDocHead(); spkKlDocPreview();
  setTimeout(function(){ var el=document.getElementById('spk-kldoc-judul'); if(el) el.focus(); },60);
}
function spkKlDocJudul(){
  var el=document.getElementById('spk-kldoc-judul');
  return el ? spkJudulSan(String(el.innerHTML||'').replace(/<br\s*\/?>/gi,' ').trim()) : '';
}
function spkKlDocJudulPlain(){ return spkJudulPlain(spkKlDocJudul()); }
/* Miringkan bagian judul yang dipilih (tombol I / Ctrl+I) */
function spkKlDocItalic(){
  var el=document.getElementById('spk-kldoc-judul'); if(!el) return;
  el.focus();
  try{ document.execCommand('italic'); }catch(e){}
  spkKlDocHead();
}
function spkKlDocHead(){
  var el=document.getElementById('spk-kldoc-head'); if(!el) return;
  var jd=spkKlDocJudul();
  el.innerHTML='<span class="n">'+fkEsc(String(spkKlDoc.no))+'.</span>'+
    (spkJudulPlain(jd)?spkFmtJudul(jd):'<span class="ph">JUDUL KLAUSUL</span>')+
    '<span class="spk-we-clhead-tag">(pratinjau — isi klausul di bawah ini sejajar dengan huruf sesudah nomor)</span>';
}
function spkKlDocPreview(){
  var isi=String(spkKlDoc.isi||'');
  /* Area pratinjau sudah dihilangkan; tetap perbarui elemen bila ada. */
  var el=document.getElementById('spk-kldoc-prev');
  if(el){
    if(!isi.replace(/<[^>]+>/g,'').trim()){
      el.innerHTML='<p class="kl0 spk-kldoc-empty">Belum ada isi klausul. Unduh template, ketik isinya di Microsoft Word, lalu unggah kembali berkas .docx di sini.</p>';
    }else{
      var h=isi; try{ h=spkNumberFix(spkTidyKeyValue(isi)); }catch(e){}
      el.innerHTML=h;
    }
  }
  var c=document.getElementById('spk-kldoc-count');
  if(c){
    var w=String(isi).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
    c.textContent=(w?w.split(' ').length:0)+' kata';
  }
  var m=document.getElementById('spk-kldoc-meta');
  if(m){
    if(spkKlDoc.fileName){
      m.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;vertical-align:-2px;color:#12805c"><path d="M20 6 9 17l-5-5"/></svg> Terunggah: <b>'+fkEsc(spkKlDoc.fileName)+'</b>';
    }else if(spkKlDoc.docx){
      m.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;vertical-align:-2px;color:#12805c"><path d="M20 6 9 17l-5-5"/></svg> Berkas .docx tersimpan';
    }else{
      m.innerHTML = spkKlDoc.rec ? 'Isi klausul saat ini dipakai.' : '';
    }
  }
}
/* Tombol "Upload Template" -> tampilkan kotak Drag & Drop di bawahnya */
function spkKlDocPick(){
  var dz=document.getElementById('spk-kldoc-dz'); if(!dz) return;
  dz.classList.add('show');
  try{ dz.scrollIntoView({behavior:'smooth', block:'nearest'}); }catch(e){}
}
function spkKlDocDzHide(){ var dz=document.getElementById('spk-kldoc-dz'); if(dz){ dz.classList.remove('show','drag'); } }
/* Klik pada kotak -> buka dialog pilih berkas */
function spkKlDocBrowse(){ var f=document.getElementById('spk-kldoc-file'); if(f){ f.value=''; f.click(); } }
function spkKlDocDownload(){
  try{
    var jd=spkKlDocJudul(), jp=spkJudulPlain(jd);
    var nm='Template Klausul'+(jp?(' - '+jp):' Baru');
    nm=nm.replace(/[\\/:*?"<>|]+/g,'-').slice(0,90)+'.docx';
    var blob;
    /* Bila ada berkas .docx ASLI (dari unggahan / tersimpan di record), kembalikan
       apa adanya agar penomoran & jarak spasi baris SAMA PERSIS dengan saat diunggah.
       Hanya bila belum pernah ada unggahan, template dibangun ulang dari isi HTML.
       PENGECUALIAN: klausul DEFINISI selalu dibangun ulang dari isi HTML yang sudah
       diurutkan A-Z, sehingga template yang diunduh ikut tersusun menurut abjad. */
    var _isDef = spkIsDefinisiJudul(jd);
    if(spkKlDoc.docx && !_isDef){
      blob=new Blob([spkB642u8(spkKlDoc.docx)], {type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
    }else{
      blob=spkWithDX(spkKlDocBentuk(), function(){
        return spkDocxTemplateBlob(jd, spkSortDefinisiIf(jd, spkKlDoc.isi), spkKlDoc.no);
      });
    }
    var a=document.createElement('a'), url=URL.createObjectURL(blob);
    a.href=url; a.download=nm; document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); },800);
    toast('Template Word diunduh','ok');
  }catch(err){ console.error(err); toast('Gagal membuat template: '+errMsg(err),'err'); }
}
function spkKlDocUpload(ev){
  var f=ev && ev.target && ev.target.files ? ev.target.files[0] : null;
  if(f) spkKlDocReadFile(f);
}
async function spkKlDocReadFile(file){
  if(!/\.docx$/i.test(file.name||'')){ toast('Berkas harus berformat .docx','warn'); return; }
  try{
    await withActionLoader('Membaca template', async function(){
      var buf=await file.arrayBuffer();
      var zip=await spkUnzip(buf);
      var xml=zip['word/document.xml'];
      if(!xml) throw new Error('word/document.xml tidak ditemukan — berkas bukan dokumen Word (.docx).');
      var dec=new TextDecoder();
      var sty=zip['word/styles.xml'] ? dec.decode(zip['word/styles.xml']) : '';
      var num=zip['word/numbering.xml'] ? dec.decode(zip['word/numbering.xml']) : '';
      var res=spkWithDX(spkKlDocBentuk(), function(){
        return spkWordXmlToKlausul(dec.decode(xml), sty, num);
      });
      if(!res.html) throw new Error('Tidak ada isi klausul yang terbaca pada template.');
      /* Klausul DEFINISI selalu dirapikan ke urutan A-Z begitu selesai dibaca,
         apa pun urutan pada berkas yang diunggah. Judul dari template dipakai
         bila ada; bila tidak, judul yang sedang aktif di form. */
      var _jdUp = res.judul || spkKlDocJudul();
      res.html = spkSortDefinisiIf(_jdUp, res.html);
      spkKlDoc.isi=res.html; spkKlDoc.fileName=file.name; spkKlDoc.dirty=true;
      /* Simpan BYTE ASLI berkas .docx (base64). Saat template diunduh kembali,
         berkas asli inilah yang dikembalikan apa adanya sehingga penomoran,
         jarak spasi baris, dan seluruh struktur SAMA PERSIS dengan saat diunggah. */
      try{ spkKlDoc.docx = spkAb2b64(buf); }catch(e){ spkKlDoc.docx=''; }
      /* Nama klausul SELALU disamakan dengan judul pada template (bila template
         memuat baris judul). Format miring/tebal/garis bawah pada judul ikut
         terbawa sehingga tampil sama di pustaka klausul & dokumen SPK. */
      if(res.judul){ var j=document.getElementById('spk-kldoc-judul'); if(j) j.innerHTML=spkJudulSan(res.judul); }
    });
  }catch(err){ console.error(err); toast('Gagal membaca .docx: '+errMsg(err),'err'); return; }
  spkKlDocDzHide();
  spkKlDocHead(); spkKlDocPreview();
  toast('Isi klausul berhasil dibaca dari template','ok');
}
/* ArrayBuffer/Uint8Array <-> base64 (untuk menyimpan berkas .docx asli) */
function spkAb2b64(buf){
  var u8=(buf instanceof Uint8Array)?buf:new Uint8Array(buf), s='', CH=0x8000;
  for(var i=0;i<u8.length;i+=CH){ s+=String.fromCharCode.apply(null, u8.subarray(i,i+CH)); }
  return btoa(s);
}
function spkB642u8(b64){
  var bin=atob(String(b64||'')), n=bin.length, u8=new Uint8Array(n);
  for(var i=0;i<n;i++) u8[i]=bin.charCodeAt(i);
  return u8;
}
function spkKlDocBindDrop(){
  var stop=function(e){ e.preventDefault(); e.stopPropagation(); };
  /* Kotak Drag & Drop */
  var dz=document.getElementById('spk-kldoc-dz');
  if(dz){
    dz.addEventListener('dragover', function(e){ stop(e); dz.classList.add('drag'); });
    dz.addEventListener('dragenter', function(e){ stop(e); dz.classList.add('drag'); });
    dz.addEventListener('dragleave', function(e){ stop(e); dz.classList.remove('drag'); });
    dz.addEventListener('drop', function(e){
      stop(e); dz.classList.remove('drag');
      var f=e.dataTransfer && e.dataTransfer.files ? e.dataTransfer.files[0] : null;
      if(f) spkKlDocReadFile(f);
    });
  }
  /* Menjatuhkan berkas ke area kertas juga diterima (kotak otomatis terbuka) */
  var z=document.getElementById('spk-kldoc-drop');
  if(z){
    z.addEventListener('dragover', function(e){ e.preventDefault(); z.classList.add('spk-kldoc-hover'); });
    z.addEventListener('dragleave', function(){ z.classList.remove('spk-kldoc-hover'); });
    z.addEventListener('drop', function(e){
      e.preventDefault(); z.classList.remove('spk-kldoc-hover');
      var f=e.dataTransfer && e.dataTransfer.files ? e.dataTransfer.files[0] : null;
      if(f) spkKlDocReadFile(f);
    });
  }
}
function spkKlDocClose(){ var ov=document.getElementById('spk-kldoc-ov'); if(ov) ov.classList.remove('show'); }
function spkKlDocAskClose(){
  if(spkKlDoc.dirty){
    openConfirm({ icon:'warn', title:'Tutup Tanpa Menyimpan?', text:'Isi klausul hasil unggahan belum disimpan. Tutup saja?',
      onYes:function(){ spkKlDocClose(); }});
    return;
  }
  spkKlDocClose();
}
function spkKlDocSave(){
  var jd=spkKlDocJudul();
  if(!spkJudulPlain(jd)){ toast('Judul klausul wajib diisi','warn'); return; }
  var isi=String(spkKlDoc.isi||'');
  if(!isi.replace(/<[^>]+>/g,'').trim()){ toast('Isi klausul masih kosong — unggah template .docx terlebih dahulu','warn'); return; }
  if(typeof requireInput==='function' && !requireInput()) return;
  var k=spkKlDoc.rec;
  var docxVal=spkKlDoc.docx||'';   // byte .docx asli (base64) bila ada unggahan
  try{
    if(k && k.id){
      var cur=records_klausul.find(function(x){ return String(x.id)===String(k.id); });
      if(cur){ cur.judul=jd; cur.isi=isi; if(docxVal) cur.isi_docx=docxVal; }
    }else{
      var maxU=records_klausul.reduce(function(m,x){ return Math.max(m, Number(x.urutan)||0); },0);
      var recNew={id:spkKlUid(), judul:jd, isi:isi, urutan:maxU+10, aktif:true};
      if(docxVal) recNew.isi_docx=docxVal;
      records_klausul.push(recNew);
      if(spkState) spkState.sel.push(String(recNew.id));   // klausul baru langsung terpilih
    }
    spkKlSync();
  }catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'err'); return; }
  spkKlDoc.dirty=false; spkKlDocClose();
  toast('Klausul disimpan','ok'); renderSpkKlausul();
}
/* Lihat klausul: pratinjau isi persis seperti dokumen (read-only). */
function spkKlausulView(id){
  const k=records_klausul.find(x=>String(x.id)===String(id)); if(!k) return;
  let ctx={};
  try{ ctx=spkBuildCtx((spkState&&spkState.data)||{}); }catch(e){}
  // nomor klausul mengikuti posisinya di pustaka -> butir & rujukan ikut menyesuaikan
  const noKl=(records_klausul.findIndex(x=>String(x.id)===String(id))+1)||1;
  let inner='';
  try{ inner=spkKlItalicAsing(spkBoldPihak(spkNumberFix(spkTidyKeyValue(spkMerge(spkRenumberKlausul(k.isi||'', noKl), ctx))))); }
  catch(e){ inner=String(k.isi||''); }
  let ov=document.getElementById('spk-klausul-view-ov');
  if(!ov){ ov=document.createElement('div'); ov.id='spk-klausul-view-ov'; ov.className='spk-ov'; document.body.appendChild(ov);
    ov.addEventListener('click', e=>{ if(e.target.id==='spk-klausul-view-ov') spkKlausulViewClose(); }); }
  var _pk=(typeof spkIsPk==='function' && spkIsPk());
  /* Kop klausul mengikuti gaya judul pada template .docx:
       SPK : satu baris rata KIRI — nomor otomatis + judul, gantungan 0,65 cm
             (w:ind left=368 hanging=368), jarak sesudah 3 pt (w:after=60).
       PK  : dua baris rata TENGAH — "PASAL n" lalu nama pasal, jarak sesudah
             6 pt (w:after=120) dan tanpa jarak di antara kedua barisnya. */
  var _kop = k.judul
    ? (_pk
        ? '<p class="spk-cl-h" style="font-weight:700;text-transform:uppercase;text-align:center;padding-left:0;text-indent:0;margin:0 0 6pt">'+
            '<span class="n" style="display:block;width:auto;min-width:0;padding-right:0;text-indent:0;text-align:center;white-space:nowrap;margin:0">PASAL '+fkEsc(String(noKl))+'</span>'+
            spkFmtJudul(k.judul)+'</p>'
        : '<p class="spk-cl-h" style="font-weight:700;text-transform:uppercase;text-align:left;padding-left:0.65cm;text-indent:-0.65cm;margin:0 0 3pt">'+
            '<span class="n" style="display:inline-block;box-sizing:border-box;min-width:0.65cm;padding-right:0;text-indent:0;text-align:left;white-space:nowrap">'+fkEsc(String(noKl))+'.</span>'+
            spkFmtJudul(k.judul)+'</p>')
    : '';
  ov.innerHTML=
    '<div class="spk-ov-modal spk-ov-we">'+
      '<div class="spk-ov-head"><span class="spk-ov-title">Lihat Klausul — '+spkJudulPlain(k.judul)+'</span>'+
        '<div style="display:flex;gap:8px"><button class="btn btn-teal btn-sm" onclick="spkKlausulViewToEdit(\''+fkEscJs(String(k.id))+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> Ubah</button>'+
        '<button class="btn btn-ghost btn-sm" onclick="spkKlausulViewClose()">Tutup</button></div></div>'+
      '<div class="spk-ov-body">'+
        '<div class="spk-we-pagearea"><div class="spk-we-page'+(_pk?' spk-pk':'')+'">'+
          '<div class="spk-cl">'+_kop+inner+'</div>'+
        '</div></div>'+
      '</div>'+
    '</div>';
  ov.classList.add('show');
}
function spkKlausulViewClose(){ const ov=document.getElementById('spk-klausul-view-ov'); if(ov) ov.classList.remove('show'); }
function spkKlausulViewToEdit(id){ spkKlausulViewClose(); spkKlausulEdit(id); }

try{ if(typeof spkInit==="function") spkInit(); }catch(e){ console.error("spkInit:",e); }

