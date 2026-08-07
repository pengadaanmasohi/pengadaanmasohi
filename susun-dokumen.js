/* ============================================================================
   FILE: susun-dokumen.js  —  PENYUSUNAN DOKUMEN (Dokumen Pengadaan)
   ----------------------------------------------------------------------------
   Menu "Susun Kontrak" berubah menjadi "Penyusunan Dokumen" dengan dua cabang:
     1. Kontrak            -> modul lama (spk-view / spk-susun) di susun-kontrak.js
     2. Dokumen Pengadaan  -> Dokumen TOR/KAK  (modul ini)
                              Dokumen RAB      (menyusul)
                              Pakta Integritas (menyusul)

   WAJIB dimuat SETELAH susun-kontrak.js — seluruh mesin dokumen dipakai ulang:
     - CSS dokumen        : spkDocCss() + spkDocCss2() + spkClHeadCss()
     - Pipeline klausul   : spkMerge -> spkPruneKlausul -> spkNumberFix -> spkPkTidy
     - KISI INDEN         : spkClHeadW / spkKumpulHang / spkPkBoxMark / SPK_JH_OVR
       => inden TOR PERSIS mengikuti Surat Perintah Kerja (bungkus .spk-doc.spk-spk)
     - Paginator A4       : spkPageScript() + spkKisiScript()
     - Pustaka klausul    : renderSpkKlausul() + seluruh unggah/unduh template Word

   BEDA POKOK dengan Susun Kontrak:
     - Langkah "Pilih Klausul" memakai penanda `aktif` pada tiap klausul
       (Susun Kontrak memakai daftar id di spkState.sel).
     - Tidak ada Lampiran (BoQ tetap ditulis sebagai klausul biasa).
     - Nomor dokumen digenerate otomatis: 0001.TOR/DAN.01.03/F17060000/2026
       (format Penetapan Nomor, hanya kode depannya diganti "TOR").
   ============================================================================ */

/* ===================== 1. TETAPAN ===================== */
/* Lebar kotak isian kolom Judul pada tabel Susun RAB (px).
   Bawaan style.css `td.c-kel input` = 96px; 2,5x -> 240px. */
const TOR_RAB_JUDUL_W = 240;
/* Lebar minimum kolom "Jumlah Total (Rp)" pada cetakan RAB, dalam PERSEN
   lebar tabel — lihat alasannya di torRabDocHtml. */
const TOR_RAB_JT_MIN  = 11.5;
/* Jarak (px) dari baris nomor dokumen ke baris "Nama Pekerjaan" pada cetakan RAB. */
const TOR_RAB_GAP_NODOK = 16;
/* Lebar tiap kolom penanda tangan pada blok pengesahan (PERSEN lebar lembar).
   Dulu 33,33% (tiga kolom sama rata) sehingga nama panjang seperti
   "LUTHER RANSKIE WASILANE" (±159pt pada Arial tebal 11pt) pecah dua baris.
   44% dari lebar isi A4 (±451pt) = ±198pt, cukup untuk nama terpanjang yang
   wajar. Nilai HARUS di antara 33,4 dan 50: di bawah 33,4 kisi lima kolomnya
   (lihat torTtdCols) jadi negatif, di 50 celah tengahnya habis. */
const TOR_TTD_KOL_W   = 44;
/* Tepi dalam blok tanda tangan pada cetakan RAB (PERSEN lebar lembar).
   Lembar RAB (A4 tegak, padding 15mm) berisi 180mm = ±680px, jauh lebih lebar
   dari lembar TOR/KAK (±451pt), sehingga dua blok tanda tangan yang sama-sama
   44% terlihat terlempar ke pojok kiri & kanan. Padding kiri-kanan pada
   pembungkusnya menarik SELURUH isi (termasuk baris tanggal) ke tengah secara
   proporsional — jauh lebih sederhana daripada menambah sel penyeimbang.
   Batas amannya: sisa lebar kolom = 44% x (100-2t)% x 680px dikurangi padding
   sel 24px harus tetap di atas ±188px (lebar "LUTHER RANSKIE WASILANE" pada
   12,5px tebal). Pada t=9 sisanya ±221px. Lembar TOR/KAK TIDAK diberi tepi ini
   karena di sana cadangannya sudah tipis. */
const TOR_TTD_RAB_TEPI = 9;
/* ---- RUANG BUBUH TANDA TANGAN & CAP: SATU UKURAN UNTUK SEMUA DOKUMEN ----
   KETENTUAN 6 Agu 2026. Sebelumnya tiap dokumen memakai angkanya sendiri, dan
   ketiganya berbeda karena ditulis di berkas & satuan yang berbeda pula:

     TOR/KAK          .tor-ttd .sp        2.2cm   (susundokumen.js)
     RAB              tr.ttd-row .gap     66px    (hpsExtraDocCss di app.js,
                                                   ditumpangi dari HPS) = 1,75cm
                                                   + .nm{padding-top:5px}
     BoQ dlm klausul  .boq-ttd .sp        1.9cm   (susundokumen.js)

   Ketiganya kini memakai tetapan di bawah. RAB butuh perlakuan khusus: aturan
   milik HPS di app.js menambahkan padding atas 5px pada nama penanda tangan,
   sehingga jarak tampaknya menjadi 2,2cm + 5px. Padding itu DINOLKAN khusus
   untuk RAB (lihat torRabDocHtml) supaya jaraknya benar-benar sama, tanpa
   mengubah cetakan HPS yang memang sudah mapan. */
const TOR_TTD_RUANG_CM = 2.2;
/* ---- KISI KOLOM LEMBAR BoQ: SATU-SATUNYA SUMBER UKURAN ----
   KETENTUAN 6 Agu 2026 (berkas BoQ contoh dari pengguna). Angka di bawah adalah
   lebar kolom A..K dalam SATUAN LEBAR KOLOM EXCEL, disalin apa adanya dari
   lembar BoQ yang dikehendaki:

     A  3          kolom sela di tepi kiri (tabel tidak menempel pinggir)
     B  5          No.
     C  16.265625  paruh kiri Uraian — DI LUAR tabel dipakai sendirian sebagai
                   penampung label "Nama Pekerjaan :" / "Lokasi Pekerjaan :"
     D  23.6640625 paruh kanan Uraian (C+D = 39,93 = lebar kolom Uraian)
     E  5.73046875 Sat
     F  5.73046875 Vol
     G..K 12       Harga Satuan (2), Jumlah Harga (2), Jumlah Total

   Dipakai DUA KALI: apa adanya oleh berkas .xlsx (torBoqExcel) dan diubah
   menjadi persen oleh tabel BoQ di dalam klausul TOR/KAK (torBoqTabelHtml),
   sehingga lembar Excel dan klausul TOR mustahil berbeda bentuk. Bila kisi
   kolomnya digeser, CUKUP UBAH DI SINI. */
const TOR_BOQ_W = [3, 5, 16.265625, 23.6640625, 5.73046875, 5.73046875,
                   12, 12, 12, 12, 12];
/* Lebar badan tabel = B..K (kolom sela A tidak ikut tercetak sebagai tabel). */
const TOR_BOQ_W_TOT = TOR_BOQ_W.slice(1).reduce((a,b)=>a+b, 0);   /* 116,390625 */
/* Persen lebar sebuah kolom (atau gabungan kolom) terhadap badan tabel — dipakai
   colgroup tabel BoQ di klausul TOR supaya proporsinya sama dengan .xlsx. */
function torBoqPct(){
  var s=0; for(var i=0;i<arguments.length;i++) s+=TOR_BOQ_W[arguments[i]];
  return Math.round(s/TOR_BOQ_W_TOT*1000)/10;
}
/* Lebar blok tanda tangan penyedia pada lembar BoQ di dalam klausul TOR
   (PERSEN lebar badan klausul). Di berkas BoQ.xlsx blok itu menempati kolom
   I sampai K, jadi lebarnya DITURUNKAN dari kisi kolom di atas — bukan lagi
   angka tetap — supaya ikut menyesuaikan bila kolomnya digeser. */
const TOR_BOQ_TTD_W = torBoqPct(8,9,10);                          /* ±30,9% */
/* Jarak (pt) dari klausul Bill of Quantity ke klausul sesudahnya. Lihat aturan
   .tor-boq-cl di torDocCss untuk alasan jaraknya dipasang sebagai margin BAWAH. */
const TOR_BOQ_JARAK_PT = 24;
/* Jumlah BARIS KOSONG untuk membubuhkan tanda tangan & cap pada berkas
   BoQ.xlsx, yaitu antara baris "Nama Perusahaan" dan "(Nama Lengkap)".
   Ditambah satu baris pada 6 Agu 2026 (semula 3). Berlaku hanya untuk berkas
   Excel; blok tanda tangan BoQ di dalam klausul TOR memakai TOR_BOQ_TTD_W. */
const TOR_BOQ_TTD_RUANG = 4;
const TOR_TABLE   = 'dokumen_tor';
const TOR_KODE    = 'TOR';                                     /* kode dokumen di nomor */
const TOR_UNIT    = (typeof PN_UNIT!=='undefined') ? PN_UNIT : 'F17060000';
const TOR_PAGE_SIZE = 8;

/* Kode klasifikasi — SAMA dengan Penetapan Nomor (PN_KLAS_OPTS) */
const TOR_KLAS_OPTS = (typeof PN_KLAS_OPTS!=='undefined' && PN_KLAS_OPTS.length) ? PN_KLAS_OPTS : [
  {kode:'DAN.01.01', label:'DAN.01.01 — Pengadaan Barang'},
  {kode:'DAN.01.02', label:'DAN.01.02 — Pengadaan Jasa'},
  {kode:'DAN.01.03', label:'DAN.01.03 — Pengadaan Barang dan Jasa'}
];
/* Jenis pengadaan yang DITURUNKAN dari kode klasifikasi terpilih.
   Sejak field "Jenis Pengadaan" dihapus (6 Agu 2026) peta ini tidak lagi
   mengisi data tersimpan, melainkan dipakai torExtendCtx untuk menyediakan
   kode isian {{jenis_pengadaan}}. */
const TOR_KLAS_JENIS = {
  'DAN.01.01':'Barang', 'DAN.01.02':'Jasa', 'DAN.01.03':'Barang dan Jasa'
};
const TOR_BIDANG_OPTS = (typeof BIDANG_OPTS!=='undefined' && BIDANG_OPTS.length) ? BIDANG_OPTS
                      : ((typeof PN_BIDANG_OPTS!=='undefined') ? PN_BIDANG_OPTS : []);
const TOR_RISIKO_OPTS  = ['Risiko Rendah','Risiko Menengah','Risiko Tinggi'];
const TOR_ANGGARAN_OPTS= ['Investasi','Operasi'];
/* TOR_METODE_OPTS dihapus 6 Agu 2026 bersama field "Metode Pengadaan" \u2014
   tidak ada lagi yang memakainya di modul ini. */

/* ---- Identitas unit: BAKU, bukan isian ----
   Dulu tersedia sebagai kartu "Unit Pelaksana" pada form. Karena nilainya
   tidak pernah berubah untuk UP3 Masohi, ketiganya dijadikan tetapan supaya
   tidak ada peluang salah ketik dan formnya lebih pendek. Bila suatu saat
   aplikasi dipakai unit lain, cukup ubah tiga baris ini. */
const TOR_NAMA_UNIT      = 'Unit Pelaksana Pelayanan Pelanggan Masohi';
const TOR_SINGKATAN_UNIT = 'UP3 Masohi';
const TOR_LOKASI_UNIT    = (typeof SPK_ALAMAT_1!=='undefined' && SPK_ALAMAT_1) ? SPK_ALAMAT_1 : '';
const TOR_KOTA_TTD     = 'Masohi';   /* kota penandatanganan — tetap, bukan isian */
const TOR_JUDUL_BARIS1 = 'TERM OF REFERENCE (TOR)';
const TOR_JUDUL_BARIS2 = 'KERANGKA ACUAN KERJA (KAK)';
const TOR_DOK_LABEL    = 'TERM OF REFERENCE (TOR)/KERANGKA ACUAN KERJA (KAK)';
const TOR_KOP_LABEL    = 'TOR / KAK';   /* nama dokumen pada kop tiap lembar */
const TOR_PARAF_LABEL  = 'Paraf';       /* label kotak paraf di kaki lembar   */
const TOR_DOK_TITLE    = 'Dokumen TOR/KAK';

/* ===================== 1b. BAB — KISI PENOMORAN TEMPLATE WORD =====================
   Penomoran pada berkas Word TOR/KAK berasal dari numbering.xml:
     gaya "Judul 1"  -> upperRoman "%1."   =>  I.   II.   III.     (JUDUL BAB)
     gaya "Judul 2"  -> decimal   "I.%1."  =>  I.1  I.2  I.3 ...   (klausul bab I)
     gaya "Sub 3"    -> decimal   "II.%1." =>  II.1 II.2 II.3 ...  (klausul bab II)
   Judul bab ditulis TANPA kata "BAB" — persis seperti berkasnya ("I. PENDAHULUAN").

   Bab III (PENUTUP) pada lampiran TOR TIDAK memiliki sub-judul sama sekali:
   isinya langsung menempel di bawah judul bab. Karena itu bab III ditandai
   `tunggal:true` — bila hanya berisi SATU klausul, judul klausul itu DILEBUR
   menjadi judul bab ("III. PENUTUP") dan klausulnya tidak diberi nomor sub.
   Bila ternyata diisi lebih dari satu klausul, penomorannya otomatis kembali
   normal (III.1, III.2, ...) sehingga tidak ada isi yang kehilangan judul.

   Bab sebuah klausul disimpan pada `k.bab` (1/2/3) di pustaka klausul; klausul
   tanpa penanda ikut bab klausul di atasnya. Bab TIDAK PERNAH MUNDUR sepanjang
   urutan klausul, jadi susunan dokumen selalu berjalan I -> II -> III. */
const TOR_BAB = [
  {rom:'I',   nama:'PENDAHULUAN'},
  {rom:'II',  nama:'PETUNJUK TEKNIS'},
  {rom:'III', nama:'PENUTUP', tunggal:true}
];
/* Teks baku bab PENUTUP — disalin apa adanya dari lampiran TOR/KAK. Dipakai
   bila pustaka klausul TIDAK memuat klausul apa pun di bab III, sehingga bab
   Penutup + blok pengesahan SELALU tercetak tanpa perlu dibuat manual. Bila
   sebuah klausul memang ditaruh di bab III, isi klausul itulah yang dipakai
   dan teks baku ini dilewati. */
const TOR_PENUTUP_TEKS =
  'Demikian dokumen Term of Reference (TOR)/ Kerangka Acuan Kerja (KAK) ini disusun untuk '+
  'menjadi acuan dan pedoman bagi seluruh pihak yang terlibat dalam proses pengadaan '+
  'Barang/Jasa PT PLN (Persero), dan diharapkan dapat membantu dalam pelaksanaan pengadaan '+
  'yang efektif, efisien, dan transparan, serta memenuhi kebutuhan PT PLN (Persero) dengan '+
  'kualitas yang baik dan waktu yang tepat.';

/* Tebakan bab dari judul klausul. Dipakai HANYA untuk klausul yang belum punya
   penanda bab sendiri (dokumen/profil klausul lama), dan hanya boleh MEMAJUKAN
   bab — tidak pernah menariknya mundur. */
const TOR_BAB_TEBAK = [
  {b:2, re:/^\s*(petunjuk\s*teknis|lingkup\s*pekerjaan)\b/i},
  {b:3, re:/^\s*penutup\b/i}
];
function torJudulPolos(j){
  return String(j||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
}
function torBabTebak(judul){
  var t=torJudulPolos(judul), b=0;
  TOR_BAB_TEBAK.forEach(function(m){ if(!b && m.re.test(t)) b=m.b; });
  return b;
}
/* Nomor bab tiap klausul (1..TOR_BAB.length), dijamin tidak pernah mundur. */
function torBabPlan(list){
  var out=[], cur=1, n=TOR_BAB.length;
  (list||[]).forEach(function(k){
    var b=parseInt(k&&k.bab,10);
    if(!(b>=1 && b<=n)) b=torBabTebak(k&&k.judul);
    if(b>cur) cur=b;
    out.push(cur);
  });
  return out;
}
/* PETA PENOMORAN — satu sumber kebenaran yang dipakai bersama oleh Pustaka
   Klausul, Daftar Isi, dan badan dokumen, sehingga ketiganya tidak mungkin
   berbeda. Tiap entri: {bab, rom, babNama, urut, awal, lebur, no}. */
function torStruktur(list){
  list=list||[];
  var bab=torBabPlan(list), jml={}, idx={}, out=[];
  bab.forEach(function(b){ jml[b]=(jml[b]||0)+1; });
  for(var i=0;i<list.length;i++){
    var b=bab[i], B=TOR_BAB[b-1]||TOR_BAB[TOR_BAB.length-1];
    idx[b]=(idx[b]||0)+1;
    var lebur=!!(B.tunggal && jml[b]===1);      /* judul klausul dilebur ke judul bab */
    out.push({
      i:i, bab:b, rom:B.rom, babNama:B.nama, urut:idx[b],
      awal:(idx[b]===1), lebur:lebur,
      no: lebur ? B.rom : (B.rom+'.'+idx[b])
    });
  }
  return out;
}
/* Lebar kotak nomor (cm) = lebar label TERPANJANG + jeda tetap SPK_NUM_GAP,
   memakai alat ukur yang sama dengan Surat Perintah Kerja (spkClHeadW). Dengan
   begitu seluruh judul klausul rata pada satu kisi, persis tab stop Word. */
function torTokW(tok){
  var w=0; try{ w=spkPkTextWidthCm(String(tok)); }catch(e){ w=0; }
  /* Cadangan bila pengukur glif belum siap: ~0,16 cm per digit Inter tebal 11pt,
     titik dihitung setengahnya. Sengaja dibuat mendekati hasil ukur sebenarnya
     supaya kisi inden tidak melompat saat pengukur akhirnya tersedia. */
  if(!(w>0)){
    var s=String(tok), d=(s.match(/[^.]/g)||[]).length, dot=(s.match(/\./g)||[]).length;
    w=0.16*d + 0.08*dot;
  }
  return w*1.06;                             /* judul dicetak TEBAL -> beri kelonggaran */
}
function torBoxW(toks, cadangan){
  var m=0, arr=(toks && toks.length) ? toks : [cadangan||'1.'];
  arr.forEach(function(t){ var w=torTokW(t); if(w>m) m=w; });
  var gap=(typeof SPK_NUM_GAP!=='undefined') ? SPK_NUM_GAP : 0.18;
  return Math.max(0.4, Math.round((m+gap)*100)/100);
}
/* Klik lencana nomor di Pustaka Klausul -> klausul pindah ke bab berikutnya.
   Nilainya berputar: bab sekarang -> +1 -> ... -> kembali ke bab klausul di
   ATASNYA (artinya "ikut bab sebelumnya"). Karena tidak boleh mundur melewati
   klausul di atasnya, urutan bab dokumen selalu sah. */
function torBabPindah(id){
  if(typeof requireInput==='function' && !requireInput()) return;
  var list=(records_klausul||[]).filter(function(k){ return k && !k.sys; });
  var idx=-1, i;
  for(i=0;i<list.length;i++){ if(String(list[i].id)===String(id)){ idx=i; break; } }
  if(idx<0) return;
  var bab=torBabPlan(list);
  var prev=(idx>0)?bab[idx-1]:1;
  var next=bab[idx]+1;
  if(next>TOR_BAB.length) next=prev;
  if(next<prev) next=prev;
  list[idx].bab=next;
  try{ spkKlSync(); }catch(e){}
  try{ torSelectAll(); }catch(e){}
  renderSpkKlausul();
}

/* Klausul bawaan: 3 klausul kosong — sama persis dengan Susun Kontrak */
function torKlausulDefault(){
  var ph = (typeof SPK_KL_PLACEHOLDER!=='undefined') ? SPK_KL_PLACEHOLDER
         : '<p class="kl0 spk-ph">Isi Klausul ....................</p>';
  return [
    {id:torUid(), urutan:10, judul:'KLAUSUL 1', isi:ph, aktif:true},
    {id:torUid(), urutan:20, judul:'KLAUSUL 2', isi:ph, aktif:true},
    {id:torUid(), urutan:30, judul:'KLAUSUL 3', isi:ph, aktif:true}
  ];
}
function torUid(){ return 'kl_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

/* ===================== 2. PENYIMPANAN (Supabase) ===================== */
function torSupaReady(){ return !!(typeof USE_SUPABASE!=='undefined' && USE_SUPABASE && typeof db!=='undefined' && db); }
const StoreTor = {
  async list(){ if(!torSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(TOR_TABLE).select('*').order('created_at',{ascending:false});
    if(error) throw error; return data||[]; },
  async create(rec){ if(!torSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(TOR_TABLE).insert(rec).select(); if(error) throw error; return data&&data[0]; },
  async update(id,rec){ if(!torSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(TOR_TABLE).update(rec).eq('id',id); if(error) throw error; },
  async remove(id){ if(!torSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(TOR_TABLE).delete().eq('id',id); if(error) throw error; }
};

let records_tor = [];
let torEditId   = null;
let torState    = null;
let torStep     = 1;
let torViewPage = 1;

async function refreshDataTor(){
  try{ records_tor = await StoreTor.list(); }
  catch(err){ console.error('TOR:', err); records_tor = records_tor||[]; }
}

/* ===================== 3. PENOMORAN DOKUMEN =====================
   Format: 0001.TOR/DAN.01.03/F17060000/2026
     - 4 digit nomor urut (mulai 0001, gap-fill: nomor bekas hapus dipakai lagi)
     - kode dokumen "TOR"
     - kode klasifikasi (dropdown, sama dengan Penetapan Nomor)
     - kode unit UP3 Masohi (paten)
     - tahun dokumen (reset otomatis tiap tahun)
   ================================================================= */
function torPad4(n){ return String(Math.max(0, parseInt(n,10)||0)).padStart(4,'0'); }
function torYearNow(){ return new Date().getFullYear(); }
function torTodayISO(){
  const d=new Date(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
  return d.getFullYear()+'-'+m+'-'+day;
}
/* Nomor urut yang SUDAH terpakai pada tahun tertentu (dokumen yang sedang diubah dilewati) */
function torUsedSeqs(year){
  const set=new Set();
  (records_tor||[]).forEach(r=>{
    if(torEditId && String(r.id)===String(torEditId)) return;
    if(Number(r.tahun)!==Number(year)) return;
    const s=parseInt(r.no_urut,10);
    if(s>0) set.add(s);
  });
  return set;
}
/* Nomor berikutnya = terkecil >= 1 yang belum terpakai (mengisi celah bekas hapus) */
function torNextSeq(year){
  const used=torUsedSeqs(year);
  let n=1; while(used.has(n)) n++;
  return n;
}
function torFormatNo(seq, klas, year, kode){
  return torPad4(seq)+'.'+(kode||TOR_KODE)+'/'+(klas||'DAN.01.03')+'/'+TOR_UNIT+'/'+(year||torYearNow());
}
/* Nomor dokumen turunan untuk berkas SEINDUK (RAB, dsb).
   Nomor urut, kode klasifikasi, dan tahunnya SAMA dengan TOR \u2014 hanya kode
   dokumennya yang berganti, mis. 0001.TOR/... menjadi 0001.RAB/...  Diambil
   dari data yang tersimpan, jadi dokumen lama pun ternomori benar. */
function torNoDok(data, kode){
  data=data||{};
  const seq=parseInt(data.no_urut,10)||0;
  const th=parseInt(data.tahun_dokumen,10)||torYearNow();
  return torFormatNo(seq, data.kode_klasifikasi, th, kode);
}
/* Pasangan nomor untuk KOLOM "No. Dokumen" pada daftar (ketentuan 6 Agu 2026:
   "isinya No TOR/KAK dan RAB yang di-alt-enter").

   Nomor RAB DIHITUNG, bukan disimpan: ia seinduk dengan TOR — nomor urut, kode
   klasifikasi, dan tahunnya sama, hanya kode dokumennya berganti. Sumber
   utamanya rec.data (lewat torNoDok) supaya memakai jalur yang sama dengan
   nomor yang tercetak di dokumen RAB itu sendiri.

   CADANGANNYA menukar potongan ".TOR/" pada nomor yang tersimpan. Ini penting
   untuk baris daftar yang datanya belum termuat penuh (daftar hanya membawa
   ringkasan): tanpa cadangan itu kolomnya akan kosong sebelah. */
function torNoDokPasangan(rec){
  rec=rec||{};
  var tor=String(rec.no_dokumen||'').trim();
  var rab='';
  try{
    if(rec.data && (rec.data.no_urut||rec.data.no_dokumen)) rab=torNoDok(rec.data,'RAB');
  }catch(e){ rab=''; }
  if(!rab && tor) rab=tor.replace('.'+TOR_KODE+'/', '.RAB/');
  /* Bila penukaran tidak mengubah apa pun, nomornya tidak berpola TOR yang
     dikenali — lebih baik dikosongkan daripada menampilkan nomor keliru. */
  if(rab===tor) rab='';
  return { tor: tor || '\u2014', rab: rab };
}
/* Hitung ulang nomor urut & nomor dokumen pada state yang sedang disusun.
   Nomor urut dokumen TERSIMPAN tidak diubah (tetap milik dokumen itu). */
/* Tahun Anggaran & Sumber Dana diturunkan, bukan diketik.
   Dipanggil tiap kali form digambar & sebelum dokumen dibangun. */
function torSyncSumberDana(d){
  if(!d) return;
  const th = String(d.tahun_dokumen||torYearNow());
  d.tahun_anggaran = th;
  const jenis = String(d.jenis_anggaran||'').trim();
  d.sumber_dana = jenis ? ('APLN Tahun '+th+' Anggaran '+jenis) : '';
}
/* Rapikan daftar field berlapis: buang baris kosong di ekor, sisakan minimal 1,
   lalu satukan menjadi satu teks untuk placeholder {{key}}. */
/* PENTING: `trim` HANYA boleh true saat menyimpan / menghapus baris.
   Dulu fungsi ini selalu membuang baris kosong di ekor, padahal ia juga
   dipanggil setiap kali form digambar — akibatnya baris baru yang dibuat
   tombol "Tambah" (isinya masih kosong) langsung terbuang lagi sehingga
   field tidak pernah terlihat bertambah ke bawah. */
function torMultiSync(d, k, trim){
  let arr = Array.isArray(d[k+'_list']) ? d[k+'_list'].slice() : [String(d[k]||'')];
  if(trim){ while(arr.length>1 && String(arr[arr.length-1]||'').trim()==='') arr.pop(); }
  if(!arr.length) arr=[''];
  d[k+'_list'] = arr;
  d[k] = arr.map(x=>String(x||'').trim()).filter(Boolean).join('; ');
}
/* Rapikan SEMUA field berlapis — dipanggil sebelum menyimpan dokumen. */
function torMultiTrimAll(d){
  TOR_FIELDS_FLAT.forEach(f=>{ if(f.t==='multi') torMultiSync(d, f.k, true); });
}
function torSyncNomor(){
  if(!torState) return;
  const d=torState.data;
  const th=parseInt(d.tahun_dokumen,10)||torYearNow();
  d.tahun_dokumen=String(th);
  let seq=parseInt(d.no_urut,10)||0;
  const used=torUsedSeqs(th);
  if(!seq || used.has(seq)) seq=torNextSeq(th);
  d.no_urut=seq;
  d.no_dokumen=torFormatNo(seq, d.kode_klasifikasi, th);
}

/* ===================== 4. SKEMA FIELD (MAIL MERGE) =====================
   Kode placeholder = NAMA FIELD. Contoh: {{nama_pekerjaan}}, {{jangka_waktu}}.
   Field ber-atribut `auto` terisi sendiri & terkunci.
   ====================================================================== */
/* Pasangan label sakelar on/off. Sebuah field bertipe 'select' otomatis
   digambar sebagai SAKELAR bila daftar pilihannya tepat sepasang di sini
   (urutan bebas). Label pertama = keadaan ON. */
const TOR_SW_PAIRS = [['Ya','Tidak'], ['Ada','Tidak Ada']];

const TOR_FIELD_GROUPS = [
  { sec:'Informasi Pengadaan', fields:[
    {k:'nama_pekerjaan', l:'Nama Pekerjaan', t:'text', def:''},
    {k:'lokasi_pekerjaan', l:'Lokasi Pekerjaan', t:'text', def:''},
    /* Kode Klasifikasi diletakkan TEPAT SESUDAH Lokasi Pekerjaan.
       Mengubahnya langsung memperbarui No. Dokumen (lihat reNo). */
    {k:'kode_klasifikasi', l:'Kode Klasifikasi', t:'select',
      opts:TOR_KLAS_OPTS.map(o=>({v:o.kode, l:o.label})), reNo:true, def:''},
    {k:'pelaksana', l:'Bidang Pelaksana', t:'select', opts:TOR_BIDANG_OPTS, def:''},
    /* DIHAPUS 6 Agu 2026: "Jenis Pengadaan" & "Metode Pengadaan".
       Keduanya tidak dirujuk satu pun bagian dokumen TOR/KAK maupun Pakta
       Integritas. Nilai Jenis Pengadaan sendiri tidak pernah diketik — ia
       selalu ikut Kode Klasifikasi — jadi sekarang cukup DITURUNKAN di
       torExtendCtx dan tetap tersedia sebagai kode isian {{jenis_pengadaan}}
       tanpa memakan satu kotak isian di form. Metode Pengadaan dibuang
       seluruhnya karena tidak punya sumber lain (modul Pengadaan Langsung &
       Tender di app.js punya field bernama sama, tetapi itu record yang
       berbeda dan tidak tersentuh). */
    {k:'level_risiko', l:'Level Risiko Pekerjaan', t:'select', opts:TOR_RISIKO_OPTS, def:''},
    /* Jangka Waktu Pelaksanaan pindah ke sini dari kartu "Pelaksanaan &
       Pembayaran" yang dihapus. */
    {k:'jangka_waktu', l:'Jangka Waktu Pelaksanaan (hari)', t:'number', def:''},
    /* Terbilang jangka waktu: field TERKUNCI yang mengikuti pola Terbilang
       nilai di bawahnya — tidak disimpan sebagai data, melainkan dihitung
       ulang torRefreshAuto() pada tiap ketikan di kotak "Jangka Waktu".
       Isinya SENGAJA sama persis dengan {{jangka_waktu_terbilang}} (angka
       terbilang saja, tanpa "Hari Kalender") supaya yang terlihat di form =
       yang tercetak di klausul. Untuk versi berakhiran "Hari Kalender",
       klausul dapat memakai {{auto_terbilang_jangka}}. */
    {k:'jangka_waktu_terbilang', l:'Terbilang Jangka Waktu', t:'text', auto:'terbilang_jangka_polos'},
    /* ---- NILAI RAB: TERKUNCI, SELALU MENGIKUTI RAB ----
       KETENTUAN 6 Agu 2026. Semula "Perkiraan Nilai Pekerjaan (+ PPN)" berupa
       isian rupiah bebas, sehingga bisa berbeda dari Jumlah Total RAB pada
       langkah 4 \u2014 dan bila penyusun lupa memperbaruinya sesudah RAB diubah,
       dokumen mencetak angka usang.

       Sekarang field ini ber-atribut `auto`, jadi torFieldInput menggambarnya
       TERKUNCI (readonly + cursor not-allowed) dan torRefreshAuto menyegarkan
       isinya; angkanya diambil torAutoVal('nilai_rab') dari Jumlah Total RAB
       memakai hpsSummary() \u2014 fungsi yang sama dengan cetakan RAB, HPS, dan
       Pakta Integritas, jadi keempatnya mustahil berbeda.

       Kode isiannya TIDAK berubah ({{nilai_pekerjaan}}, {{nilai_hps}}, dst.)
       supaya klausul yang sudah terlanjur memakainya tetap terisi benar. */
    {k:'nilai_pekerjaan', l:'Nilai RAB', t:'rupiah', auto:'nilai_rab'},
    /* Terbilang TIDAK disimpan sebagai data \u2014 ia diturunkan dari Nilai RAB
       lewat torAutoVal('terbilang_nilai'). Field ber-atribut `auto` digambar
       terkunci (readonly + cursor not-allowed) dan disegarkan torRefreshAuto()
       setiap kali RAB berubah, jadi angkanya mustahil tertinggal dari nilainya.
       Kode isiannya tetap {{nilai_pekerjaan_terbilang}}. */
    {k:'nilai_pekerjaan_terbilang', l:'Terbilang Nilai RAB', t:'text', auto:'terbilang_nilai'},
  ]},
  /* ---------- Sumber Dana ----------
     Tahun Anggaran & Sumber Dana TIDAK lagi menjadi isian:
       tahun_anggaran -> tahun berjalan (= tahun pembuatan dokumen)
       sumber_dana    -> "APLN Tahun <tahun> Anggaran <Jenis Anggaran>",
                         ikut berubah begitu Jenis Anggaran diganti.
     Nomor PRK berlapis (boleh lebih dari satu), memakai pola yang sama dengan
     Bidang/Sub Bidang pada Monitoring — lihat torFieldInput t:'multi'. */
  { sec:'Sumber Dana', fields:[
    {k:'jenis_anggaran', l:'Jenis Anggaran', t:'select', opts:TOR_ANGGARAN_OPTS, reRender:true, def:''},
    {k:'no_anggaran', l:'No. Anggaran (SKKO/SKKI)', t:'text', def:''},
    {k:'tgl_anggaran', l:'Tgl. Anggaran', t:'date', def:''},
    {k:'no_prk', l:'Nomor PRK', t:'multi', def:'', ph:'cth. 2026.WMMU.4.003'},
  ]},
  /* ---------- Pengendali Pekerjaan ----------
     Dua sakelar mengunci isian di bawahnya, mengikuti pola "Perubahan?" pada
     Susun Kontrak:
       Perubahan Pengguna?  Ya -> Nama & Jabatan Pengguna dapat diisi
                            Tidak -> terkunci (nilai terakhir tetap terbaca)
       Pengawas Pekerjaan?  Ada -> Nama & Jabatan Pengawas dapat diisi
                            Tidak Ada -> terkunci; butir Pengawas otomatis
                                     hilang dari dokumen karena nilainya
                                     kosong. */
  { sec:'Pengendali Pekerjaan', fields:[
    {k:'perubahan_pengguna', l:'Perubahan Pengguna?', t:'select', opts:['Ya','Tidak'], reRender:true, def:''},
    {k:'nama_pengguna', l:'Nama Pengguna Barang/Jasa', t:'text', up:true, lockedBy:'perubahan_pengguna', def:''},
    {k:'jabatan_pengguna', l:'Jabatan Pengguna Barang/Jasa', t:'text', lockedBy:'perubahan_pengguna', def:''},
    /* NIP dipakai Pakta Integritas (baris "NIP : ..."), bukan oleh TOR/KAK. */
    {k:'nip_pengguna', l:'NIP Pengguna Barang/Jasa', t:'text', lockedBy:'perubahan_pengguna', def:'', ph:'cth. 7594128H'},
    {k:'nama_direksi', l:'Nama Direksi Pekerjaan', t:'text', up:true, def:''},
    {k:'jabatan_direksi', l:'Jabatan Direksi Pekerjaan', t:'text', def:''},
    {k:'nip_direksi', l:'NIP Direksi Pekerjaan', t:'text', def:'', ph:'cth. 9215934ZY'},
    {k:'ada_pengawas', l:'Pengawas Pekerjaan?', t:'select', opts:['Ada','Tidak Ada'], reRender:true, def:''},
    {k:'nama_pengawas', l:'Nama Pengawas Pekerjaan', t:'text', up:true, lockedBy:'ada_pengawas', def:''},
    {k:'jabatan_pengawas', l:'Jabatan Pengawas Pekerjaan', t:'text', lockedBy:'ada_pengawas', def:''},
  ]},
  /* ---------- Rencana Anggaran Biaya ----------
     Rangka RAB memakai ULANG model data HPS/Analisa Harga Satuan supaya tabel,
     penomoran, dan pengelompokannya berperilaku persis sama:
       jumlah_bj        -> hpsState.jumlahItem   (banyaknya baris barang/jasa)
       rab_judul_on     -> hpsState.judulOn      + rab_judul_num    -> judulNum
       rab_subjudul_on  -> hpsState.subjudulOn   + rab_subjudul_num -> subjudulNum
     Gaya penomoran mengikuti JS_NUM_STYLES di app.js ('' = tanpa nomor). */
  { sec:'Rencana Anggaran Biaya (RAB)', fields:[
    {k:'jumlah_bj', l:'Jumlah Barang/Jasa', t:'number', def:'', ph:'cth. 3'},
    /* Judul? & Sub-Judul? digambar sebagai SATU field masing-masing \u2014 sakelar
       Ya/Tidak di kanan judul, gaya penomoran di barisan bawahnya \u2014 mengikuti
       tata letak yang sama persis dengan Perhitungan HPS (hpsJudulFieldsHtml).
       `numKey` menunjuk kunci penyimpan gaya penomorannya. */
    {k:'rab_judul_on', l:'Judul?', t:'judulsw', numKey:'rab_judul_num', reRender:true, def:''},
    {k:'rab_judul_num', t:'hidden', def:''},
    {k:'rab_subjudul_on', l:'Sub-Judul?', t:'judulsw', numKey:'rab_subjudul_num', reRender:true, def:''},
    {k:'rab_subjudul_num', t:'hidden', def:''},
  ]},
  /* CATATAN: kartu "Pelaksanaan & Pembayaran" dan "Penyusun Dokumen" DIHAPUS
     (permintaan 5 Agu 2026). Satu-satunya isian yang dipertahankan dari kartu
     itu adalah Jangka Waktu Pelaksanaan, yang pindah ke Informasi Pengadaan.
     Kota & tanggal penandatanganan memang tidak pernah jadi field: kota tetap
     "Masohi", tanggalnya mengikuti tanggal pembuatan dokumen. */
];

/* Kembalikan [labelON, labelOFF] bila daftar pilihan tepat sepasang
   (urutan bebas); selain itu null — field tetap digambar sebagai dropdown. */
function torSwPair(opts){
  if(!Array.isArray(opts) || opts.length!==2) return null;
  const v = opts.map(o=>String((o && o.v!=null)?o.v:o));
  for(let i=0;i<TOR_SW_PAIRS.length;i++){
    const p=TOR_SW_PAIRS[i];
    if(v[0]===p[0] && v[1]===p[1]) return [p[0],p[1]];
    if(v[0]===p[1] && v[1]===p[0]) return [p[0],p[1]];
  }
  return null;
}
/* Label keadaan ON sebuah field sakelar (dipakai kunci lockedBy & konteks). */
function torSwOn(f){ const p=f?torSwPair(f.opts):null; return p?p[0]:'Ya'; }
function torSwOnOf(k){
  const f=TOR_FIELDS_FLAT.filter(x=>x.k===k)[0];
  return torSwOn(f);
}
const TOR_FIELDS_FLAT = TOR_FIELD_GROUPS.reduce((a,g)=>a.concat(g.fields),[]);

function torTahunOpts(){
  const y=new Date().getFullYear(), o=[];
  for(let i=y-2;i<=y+2;i++) o.push(String(i));
  return o;
}

/* ===================== 5. STATE ===================== */
/* ---- PENGGUNA BARANG/JASA: BAWAAN = DATA TERAKHIR DISIMPAN ----
   Meniru perilaku "Perubahan?" pada Penyusunan Dokumen Kontrak (spkApplyLastSk):
     Perubahan Pengguna? = Ya    -> Nama / Jabatan / NIP Pengguna bebas diubah
                         = Tidak -> ketiganya dikunci DAN dikembalikan ke data
                                    terakhir yang pernah disimpan.
   Sumbernya dokumen TOR tersimpan paling baru yang ketiga isiannya tidak kosong.
   Hasilnya dicadangkan ke localStorage supaya tetap terbaca saat daftar dokumen
   belum selesai dimuat (mis. dokumen pertama sesudah membuka aplikasi). */
const TOR_PENGGUNA_KEYS  = ['nama_pengguna','jabatan_pengguna','nip_pengguna'];
const TOR_PENGGUNA_CACHE = 'tor_pengguna_terakhir_v1';
function torPenggunaCacheSave(o){
  try{
    if(o && TOR_PENGGUNA_KEYS.some(k=>String(o[k]||'').trim()!==''))
      localStorage.setItem(TOR_PENGGUNA_CACHE, JSON.stringify(o));
  }catch(e){}
}
function torPenggunaCacheLoad(){
  try{
    const t=localStorage.getItem(TOR_PENGGUNA_CACHE);
    if(!t) return null;
    const o=JSON.parse(t);
    return (o && typeof o==='object') ? o : null;
  }catch(e){ return null; }
}
function torLastPengguna(){
  const out={};
  const list=(typeof records_tor!=='undefined' && Array.isArray(records_tor))?records_tor:[];
  for(let i=0;i<list.length;i++){
    const d=(list[i] && list[i].data && typeof list[i].data==='object')?list[i].data:null;
    if(!d) continue;
    if(!TOR_PENGGUNA_KEYS.some(k=>String(d[k]||'').trim()!=='')) continue;
    TOR_PENGGUNA_KEYS.forEach(k=>{ out[k]=(d[k]!=null?d[k]:''); });
    torPenggunaCacheSave(out);
    return out;
  }
  return torPenggunaCacheLoad() || out;
}
function torApplyLastPengguna(data){
  if(!data) return data;
  const last=torLastPengguna();
  TOR_PENGGUNA_KEYS.forEach(k=>{
    if(last[k]!=null && String(last[k]).trim()!=='') data[k]=last[k];
  });
  return data;
}

function torBlankState(){
  const d={};
  TOR_FIELDS_FLAT.forEach(f=>{
    if(f.auto) return;
    d[f.k]=(f.def!=null?f.def:'');
    if(f.t==='multi') d[f.k+'_list']=[''];        /* field berlapis: simpan daftarnya */
  });
  d.__doktype='TOR';
  d.bentuk_kontrak='SPK';          /* dipakai mesin SPK: tata letak & inden SPK */
  d.tahun_dokumen=String(torYearNow());
  /* Bawaan Kode Klasifikasi sengaja KOSONG ("— pilih —"): dokumen baru
     tidak lagi otomatis dianggap DAN.01.03. Kode isian {{jenis_pengadaan}}
     ikut kosong sampai klasifikasinya dipilih (diturunkan di torExtendCtx). */
  d.kode_klasifikasi=d.kode_klasifikasi||'';
  /* Pengguna Barang/Jasa: bawaan = data terakhir disimpan (lihat torApplyLastPengguna) */
  torApplyLastPengguna(d);
  d.tgl_dokumen=d.tgl_dokumen||torTodayISO();
  d.no_urut=0; d.no_dokumen='';
  d.__klausulLib=torKlausulDefault();
  const st={ data:d, sel:d.__klausulLib.map(k=>String(k.id)) };
  return st;
}
function torRecordToState(rec){
  const base=torBlankState();
  const d=Object.assign(base.data, (rec && rec.data && typeof rec.data==='object') ? rec.data : {});
  d.__doktype='TOR'; d.bentuk_kontrak='SPK';
  if(rec){
    if(rec.no_urut!=null) d.no_urut=rec.no_urut;
    if(rec.tahun!=null)   d.tahun_dokumen=String(rec.tahun);
    if(rec.no_dokumen)    d.no_dokumen=rec.no_dokumen;
  }
  let lib=null;
  if(Array.isArray(d.__klausulLib) && d.__klausulLib.length) lib=d.__klausulLib;
  else if(rec && Array.isArray(rec.klausul) && rec.klausul.length){
    lib=rec.klausul.map((k,i)=>{
      const o={id:String(k.id||torUid()), judul:k.judul||'', isi:k.isi||'', urutan:(i+1)*10, aktif:true};
      const b=parseInt(k.bab,10); if(b>=1 && b<=TOR_BAB.length) o.bab=b;   /* penanda bab ikut terbawa */
      return o;
    });
  }
  d.__klausulLib = (lib && lib.length) ? lib : torKlausulDefault();
  return { data:d, sel:d.__klausulLib.map(k=>String(k.id)) };
}
/* Segarkan torState.sel (daftar id klausul) mengikuti isi pustaka.
   CATATAN: sejak langkah "Pilih Klausul" ada, yang menentukan klausul tercetak
   adalah penanda `aktif` pada tiap klausul (lihat torKlausulDok), BUKAN `sel`.
   `sel` dipertahankan semata karena mesin Pustaka Klausul milik Susun Kontrak
   membacanya lewat spkState.sel. */
function torSelectAll(){
  if(!torState) return;
  const lib=torState.data.__klausulLib||[];
  torState.sel=lib.filter(k=>!(k&&k.sys)).map(k=>String(k.id));
}
function torKlausulDok(){
  if(!torState) return [];
  return (torState.data.__klausulLib||[])
    .filter(k=>k && !k.sys && k.aktif!==false)
    .map(k=>{
      const o={id:String(k.id), judul:k.judul||'', isi:k.isi||''};
      const b=parseInt(k.bab,10); if(b>=1 && b<=TOR_BAB.length) o.bab=b;   /* bab ikut tersimpan */
      return o;
    });
}

/* ===================== 6. NILAI OTOMATIS & KONTEKS ===================== */
function torAutoVal(kind, d){
  d=d||{};
  try{
    if(kind==='no_urut')            return d.no_urut ? torPad4(d.no_urut) : '';
    if(kind==='no_dokumen')         return d.no_dokumen || '';
    /* Nilai RAB = Jumlah Total RAB (sesudah PPn). Dihitung torPiNilai() supaya
       SATU sumber dengan Pakta Integritas: ia memakai hpsSummary() atas
       data.__rab, dan mundur ke angka tersimpan bila RAB masih kosong \u2014
       sehingga dokumen LAMA yang nilainya diketik manual tetap tercetak benar. */
    if(kind==='nilai_rab'){ var _n=torPiNilai(d); return _n>0 ? spkRupiah(_n) : ''; }
    if(kind==='terbilang_nilai'){ var _t=torPiNilai(d); return _t>0 ? spkTerbilangRupiah(_t) : ''; }
    if(kind==='terbilang_jangka')   return d.jangka_waktu ? (spkTerbilang(d.jangka_waktu)+' Hari Kalender') : '';
    /* Versi POLOS (tanpa "Hari Kalender") — dipakai field "Terbilang" di bawah
       Jangka Waktu Pelaksanaan, dan HARUS sama dengan ctx.jangka_waktu_terbilang
       di torExtendCtx supaya tampilan form = hasil cetak. */
    if(kind==='terbilang_jangka_polos') return d.jangka_waktu ? spkTerbilang(d.jangka_waktu) : '';
  }catch(e){}
  return '';
}
/* Tambahan konteks mail-merge KHUSUS dokumen TOR/KAK. Dipanggil dari tempelan
   spkBuildCtx di bawah, sehingga Pratinjau, Lihat Klausul & Cetak memakai
   konteks yang sama persis. */
function torExtendCtx(ctx, d){
  d=d||{};
  TOR_FIELDS_FLAT.forEach(f=>{
    if(f.auto) return;
    let raw=(d[f.k]!=null && d[f.k]!=='') ? d[f.k] : '';
    /* Nama orang selalu HURUF BESAR di dokumen \u2014 termasuk dokumen LAMA yang
       terlanjur tersimpan campur, karena diubah saat konteks dibangun, bukan
       saat disimpan. Berlaku untuk seluruh kode isian {{nama_*}} di klausul,
       bukan hanya blok pengesahan. */
    if(f.up) raw=String(raw).toUpperCase();
    if(f.t==='date'){ ctx[f.k]=spkDateLong(raw); ctx[f.k+'_iso']=raw; }
    else ctx[f.k]=raw;
  });
  /* --- Nomor & identitas dokumen --- */
  ctx.no_dokumen        = d.no_dokumen||'';
  ctx.no_urut           = d.no_urut ? torPad4(d.no_urut) : '';
  ctx.tahun_dokumen     = d.tahun_dokumen||String(torYearNow());
  ctx.kode_klasifikasi  = d.kode_klasifikasi||'';
  /* {{jenis_pengadaan}} DITURUNKAN dari Kode Klasifikasi, bukan lagi dari field
     isian yang dihapus 6 Agu 2026. Ditulis di sini supaya klausul lama yang
     terlanjur memakai kodenya tetap terisi tanpa perlu diedit. */
  ctx.jenis_pengadaan   = d.kode_klasifikasi ? (TOR_KLAS_JENIS[d.kode_klasifikasi]||'') : '';
  ctx.kode_unit         = TOR_UNIT;
  ctx.dok_label         = TOR_DOK_LABEL;
  ctx.dok_title         = TOR_DOK_TITLE;
  ctx.tgl_dokumen_pjg   = spkDateLong(d.tgl_dokumen);
  ctx.hari_dokumen      = spkDayName(d.tgl_dokumen);
  /* --- Nilai & terbilang ---
     Terbilang TIDAK lagi menjadi field isian: seluruhnya dihitung di sini,
     sehingga otomatis muncul di Pratinjau/Cetak lewat placeholder-nya. */
  /* {{nilai_pekerjaan}} kini SELALU Jumlah Total RAB (lihat catatan field
     'nilai_pekerjaan'). torPiNilai mundur ke angka tersimpan bila RAB kosong. */
  ctx.nilai_pekerjaan           = torAutoVal('nilai_rab', d);
  ctx.nilai_pekerjaan_rp        = ctx.nilai_pekerjaan;
  ctx.nilai_pekerjaan_terbilang = torAutoVal('terbilang_nilai', d);
  /* Alias lama — dipertahankan agar klausul yang terlanjur memakai
     {{nilai_hps}} tetap terisi. */
  ctx.nilai_hps            = ctx.nilai_pekerjaan;
  ctx.nilai_hps_rp         = ctx.nilai_pekerjaan;
  ctx.nilai_hps_terbilang  = ctx.nilai_pekerjaan_terbilang;
  ctx.jangka_waktu_hari       = (d.jangka_waktu!=null && d.jangka_waktu!=='') ? String(d.jangka_waktu) : '';
  ctx.jangka_waktu_terbilang  = d.jangka_waktu ? spkTerbilang(d.jangka_waktu) : '';
  ctx.auto_terbilang_nilai   = ctx.nilai_pekerjaan_terbilang;
  ctx.auto_terbilang_jangka  = torAutoVal('terbilang_jangka', d);
  ctx.auto_no_urut           = ctx.no_urut;
  /* --- Unit & pejabat --- */
  const unit = TOR_NAMA_UNIT;
  ctx.nama_unit       = unit;
  ctx.singkatan_unit  = TOR_SINGKATAN_UNIT;
  ctx.lokasi_unit     = TOR_LOKASI_UNIT;
  ctx.unit_lengkap    = /^PT\s*PLN/i.test(unit) ? unit : ('PT PLN (Persero) '+unit);
  /* Bentuk RINGKAS: "PT PLN (Persero) UP3 Masohi" \u2014 badan hukum + SINGKATAN
     unit, bukan nama panjangnya. Ditambahkan 6 Agu 2026 untuk baris
     "Satuan / Unit Kerja" pada Pakta Integritas, yang dengan nama panjang
     melipat jadi dua baris.
     SENGAJA menjadi kode isian BARU, bukan mengubah {{unit_lengkap}}: kode itu
     sudah dipakai klausul lain yang memang menghendaki nama panjangnya. */
  ctx.unit_singkat    = /^PT\s*PLN/i.test(TOR_SINGKATAN_UNIT)
                          ? TOR_SINGKATAN_UNIT
                          : ('PT PLN (Persero) '+TOR_SINGKATAN_UNIT);
  ctx.p1_nama_singkat = unit;
  ctx.p1_alamat       = TOR_LOKASI_UNIT;
  ctx.nama_pengguna = String(d.nama_pengguna||'').toUpperCase();
  ctx.p1_wakil      = ctx.nama_pengguna;
  ctx.p1_jabatan    = d.jabatan_pengguna||'';
  /* Direksi & Pengawas Pekerjaan.
     Bila "Pengawas Pekerjaan? = Tidak", kedua nilai Pengawas dikosongkan —
     butir yang memakai placeholder itu otomatis hilang dari dokumen dan
     penomorannya menyesuaikan (lihat spkPruneKlausul). */
  ctx.nama_direksi     = d.nama_direksi||'';
  ctx.jabatan_direksi  = d.jabatan_direksi||'';
  const _adaPengawas = String(d.ada_pengawas||'')==='Ada';
  ctx.nama_pengawas    = _adaPengawas ? (d.nama_pengawas||'') : '';
  ctx.jabatan_pengawas = _adaPengawas ? (d.jabatan_pengawas||'') : '';
  ctx.ada_pengawas     = _adaPengawas ? 'Ada' : 'Tidak Ada';
  /* NIP: dipakai Pakta Integritas, dan tersedia pula sebagai kode isian
     {{nip_pengguna}} / {{nip_direksi}} bila suatu saat perlu di klausul. */
  ctx.nip_pengguna = String(d.nip_pengguna||'').trim();
  ctx.nip_direksi  = String(d.nip_direksi ||'').trim();
  /* --- Kode isian LAMA (kartu "Pelaksanaan & Pembayaran" + "Penyusun Dokumen") ---
     Field-fieldnya sudah dihapus dari form karena nilainya kini ditulis
     LANGSUNG di teks klausul. Kodenya tetap dikenali di sini supaya:
       - dokumen lama yang datanya sudah tersimpan tetap tercetak benar, dan
       - klausul yang masih memuat kodenya tidak menampilkan {{...}} mentah,
         melainkan kosong (silakan ganti tulisannya di klausul). */
  ['masa_garansi','tahap_pembayaran','uang_muka','syarat_csms',
   'cara_pembayaran','denda_keterlambatan','denda_maksimal',
   'nama_penyusun','jabatan_penyusun'].forEach(k=>{
    if(ctx[k]==null) ctx[k] = (d[k]!=null ? d[k] : '');
  });
  ctx.masa_garansi_terbilang     = d.masa_garansi ? spkTerbilang(d.masa_garansi) : '';
  ctx.tahap_pembayaran_terbilang = d.tahap_pembayaran ? spkTerbilang(d.tahap_pembayaran) : '';
  ctx.auto_terbilang_garansi     = d.masa_garansi ? (ctx.masa_garansi_terbilang+' Bulan') : '';
  ctx.auto_terbilang_tahap       = d.tahap_pembayaran ? (ctx.tahap_pembayaran_terbilang+' Tahap') : '';
  ctx.penyusun_nama = String(d.nama_penyusun||'').toUpperCase();
  ctx.penyusun_jabatan = d.jabatan_penyusun||'';
  /* Kota tetap Masohi; tanggal tanda tangan = tanggal pembuatan dokumen. */
  ctx.kota_ttd       = TOR_KOTA_TTD;
  ctx.tgl_ttd        = spkDateLong(d.tgl_dokumen);
  ctx.tempat_tanggal = TOR_KOTA_TTD+', '+spkDateLong(d.tgl_dokumen);
  /* --- Sumber dana ---
     tahun_anggaran & sumber_dana diturunkan di sini juga, supaya dokumen yang
     dibuka lewat Pratinjau dari Daftar (tanpa membuka form) tetap benar. */
  torSyncSumberDana(d);
  ctx.tahun_anggaran      = d.tahun_anggaran||String(torYearNow());
  ctx.sumber_dana         = d.sumber_dana||'';
  ctx.sumber_dana_no      = d.no_anggaran||'';
  ctx.sumber_dana_tgl_pjg = spkDateLong(d.tgl_anggaran);
  /* Nomor PRK berlapis:
       {{no_prk}}       -> satu baris, dipisah "; "   (mis. "A; B; C")
       {{no_prk_baris}} -> satu nomor per baris (untuk daftar bernomor di Word)
       {{no_prk_1}}..   -> nomor ke-n bila ingin ditempatkan sendiri-sendiri */
  const _prk = Array.isArray(d.no_prk_list)
    ? d.no_prk_list.map(x=>String(x||'').trim()).filter(Boolean)
    : String(d.no_prk||'').split(';').map(x=>x.trim()).filter(Boolean);
  ctx.no_prk       = _prk.join('; ');
  ctx.no_prk_baris = _prk.join('<br>');
  _prk.forEach((v,i)=>{ ctx['no_prk_'+(i+1)]=v; });
  return ctx;
}

/* --- TEMPELAN spkBuildCtx: dokumen TOR mendapat konteksnya sendiri ---
   Diperlukan agar "Lihat Klausul" (spkClauseDocHtml) & seluruh pipeline SPK
   ikut mengenal placeholder milik TOR tanpa menyentuh susun-kontrak.js. */
(function(){
  if(typeof spkBuildCtx!=='function') return;
  var _asli = spkBuildCtx;
  window.spkBuildCtx = function(data){
    var ctx = _asli(data);
    try{ if(data && data.__doktype==='TOR') torExtendCtx(ctx, data); }catch(e){ console.error('torExtendCtx:', e); }
    return ctx;
  };
})();

/* ===================== 6b. SPASI DI SEKITAR TEKS MIRING TIDAK HILANG =====
   LAPORAN 6 Agu 2026: "beberapa kalimat, terutama yang italic, di template ada
   spasi tetapi saat dirender ke klausul kalimatnya nyambung"
   (mis. "melalui Online Single Submission" -> "melaluiOnline Single Submission").

   SEBABNYA. Pembaca .docx (spkWpText) membungkus SETIAP run Word tersendiri.
   Word kerap menyimpan spasi pemisah sebagai RUN SENDIRI dengan format yang
   sama seperti tetangganya — jadi spasi di sebelah kata miring keluar sebagai
   `<i> </i>`, dan spasi di sebelah kata tebal sebagai `<b> </b>`. Lalu pada
   spkMerge() (susun-kontrak.js) ada pembersih pembungkus hampa:

       out.replace(/<(b|i|u|strong|em)>\s*<\/\1>/gi, '')

   Pola `\s*` di situ IKUT MENELAN spasinya, sehingga pembungkus DAN spasinya
   terhapus sekaligus dan dua kata menempel. Gejalanya paling sering terlihat
   pada istilah asing karena istilah asing-lah yang dimiringkan.

   PENAWARNYA (fungsi di bawah): SEBELUM isi masuk spkMerge, spasi dipindahkan
   KELUAR dari pembungkus <b>/<i>/<u>/<strong>/<em>:
     - pembungkus yang isinya HANYA spasi   -> dibuka, spasinya jadi teks biasa;
     - spasi di TEPI DALAM pembungkus        -> dikeluarkan ke sebelahnya.
   Hasilnya: pembersih pembungkus hampa di spkMerge tetap bekerja (pembungkus
   yang benar-benar kosong, mis. `<b>{{kode_kosong}}</b>`, tetap terbuang) tanpa
   pernah ikut memakan spasi. Tampilan tebal/miring TIDAK berubah sama sekali —
   spasi memang tak punya bentuk miring.

   Dipasang sebagai tempelan spkMerge (pola yang sama dengan spkBuildCtx di
   atas) supaya berlaku untuk SELURUH dokumen — TOR/KAK, Surat Perintah Kerja,
   maupun Perjanjian/Kontrak — tanpa menyentuh susun-kontrak.js. */
function torSpasiAman(html){
  var s=String(html==null?'':html);
  if(s.indexOf('<')<0) return s;
  if(!/<(?:b|i|u|strong|em)\b/i.test(s)) return s;
  try{
    var box=document.createElement('div'); box.innerHTML=s;
    var els=box.querySelectorAll('b,i,u,strong,em'), i, el;
    /* Dari BELAKANG = dari pembungkus terdalam lebih dulu (urutan dokumen
       menempatkan induk sebelum anaknya), jadi membuka pembungkus luar tidak
       pernah membatalkan pekerjaan pada pembungkus di dalamnya. */
    for(i=els.length-1;i>=0;i--){
      el=els[i];
      if(!el.parentNode) continue;                       /* leluhurnya sudah dibuka */
      var teks=el.textContent||'';
      if(teks==='') continue;                            /* benar-benar kosong: biar spkMerge yang buang */
      if(!/[^\s\u00A0]/.test(teks)){                     /* isinya HANYA spasi -> buka bungkusnya */
        el.parentNode.insertBefore(document.createTextNode(teks), el);
        el.parentNode.removeChild(el);
        continue;
      }
      /* --- spasi di tepi DALAM dikeluarkan --- */
      var n1=el.firstChild;
      while(n1 && n1.nodeType===1) n1=n1.firstChild;
      if(n1 && n1.nodeType===3 && n1.nodeValue){
        var m1=/^[\s\u00A0]+/.exec(n1.nodeValue);
        if(m1){
          n1.nodeValue=n1.nodeValue.slice(m1[0].length);
          el.parentNode.insertBefore(document.createTextNode(m1[0]), el);
        }
      }
      var n2=el.lastChild;
      while(n2 && n2.nodeType===1) n2=n2.lastChild;
      if(n2 && n2.nodeType===3 && n2.nodeValue){
        var m2=/[\s\u00A0]+$/.exec(n2.nodeValue);
        if(m2){
          n2.nodeValue=n2.nodeValue.slice(0, n2.nodeValue.length-m2[0].length);
          if(el.nextSibling) el.parentNode.insertBefore(document.createTextNode(m2[0]), el.nextSibling);
          else el.parentNode.appendChild(document.createTextNode(m2[0]));
        }
      }
    }
    return box.innerHTML;
  }catch(e){ return s; }
}
/* ===================== 6c. JARAK BARIS "PT PLN (PERSERO)" PADA KOP =====================
   KETENTUAN 6 Agu 2026: pada kop dokumen (blok .fkl-doc-head — logo PLN, tiga
   baris identitas unit, lalu pita pemisah), baris "PT PLN (PERSERO)" dinaikkan
   sedikit sehingga ada jarak antara baris itu dengan "UNIT PELAKSANA PELAYANAN
   PELANGGAN MASOHI" di bawahnya. Sebelumnya ketiga baris hanya dipisahkan
   line-height 1,3 sehingga baris nama perusahaan tampak menempel ke baris unit.

   Dipasang sebagai tempelan fklDocCssPatch() — fungsi di app.js yang isinya
   memang "penyesuaian yang berlaku untuk SEMUA dokumen cetak". Dengan begitu
   satu perubahan ini langsung berlaku di SETIAP dokumen yang memakai kop
   tersebut (RAB, Pakta Integritas, HPS, Analisa, Jadwal, Form Kelengkapan,
   Dokumen Pengadaan, dst.) tanpa menyentuh app.js maupun index.html.

   Kop berjalan pada TOR/KAK memakai kerangka lain (.spk-rhd, dua baris rapat di
   sudut lembar), jadi tidak ikut berubah — memang bukan kop yang dimaksud. */
const TOR_KOP_L1_NAIK  = 2;   /* px — seberapa jauh "PT PLN (PERSERO)" naik */
const TOR_KOP_L1_JARAK = 4;   /* px — jarak yang dibuka ke baris di bawahnya */
function torKopCssPatch(){
  return '.fkl-doc-org .l1{margin-top:-'+TOR_KOP_L1_NAIK+'px;'+
    'margin-bottom:'+TOR_KOP_L1_JARAK+'px}';
}
(function(){
  if(typeof fklDocCssPatch!=='function') return;
  if(fklDocCssPatch.__torKop) return;                    /* jangan bertumpuk */
  var _asliPatch = fklDocCssPatch;
  var _tempel = function(){
    var css='';
    try{ css=_asliPatch.apply(null, arguments)||''; }catch(e){ css=''; }
    /* ditaruh SESUDAH aturan asal supaya menimpanya pada kekhususan yang sama */
    return css + torKopCssPatch();
  };
  _tempel.__torKop = true;
  window.fklDocCssPatch = _tempel;
})();

/* --- TEMPELAN spkMerge: spasi tepi diselamatkan sebelum penggabungan --- */
(function(){
  if(typeof spkMerge!=='function') return;
  if(spkMerge.__torSpasi) return;                        /* jangan bertumpuk */
  var _asliMerge = spkMerge;
  var _tempel = function(tpl, ctx){
    var t=tpl;
    try{ t=torSpasiAman(tpl); }catch(e){ t=tpl; }
    return _asliMerge(t, ctx);
  };
  _tempel.__torSpasi = true;
  window.spkMerge = _tempel;
})();

/* ===================== 7. FORM — ISIAN FIELD ===================== */
function torSet(k,v){
  if(!torState) return;
  torState.data[k]=v;
  const f=TOR_FIELDS_FLAT.filter(x=>x.k===k)[0];
  if(f && f.reNo){ torState.data.no_urut=0; torSyncNomor(); renderTorSusun(); return; }
  /* "Perubahan Pengguna?" dikembalikan ke Tidak -> Nama/Jabatan/NIP Pengguna
     dipulihkan ke data terakhir disimpan, bukan sekadar dikunci. Sama dengan
     spkSetPerubahan() pada Penyusunan Dokumen Kontrak. */
  if(k==='perubahan_pengguna' && String(v)!=='Ya') torApplyLastPengguna(torState.data);
  /* Sakelar pengunci (Perubahan Pengguna? / Pengawas Pekerjaan?): form
     digambar ulang supaya field di bawahnya langsung terbuka/terkunci. */
  if(f && f.reRender){ renderTorSusun(); return; }
  torRefreshAuto();
}
/* Sakelar pada field gabungan Judul?/Sub-Judul?.
   jsSwitchToggle() sudah menulis el.value menjadi 'Ya'/'Tidak' sebelum handler
   ini dipanggil, jadi di sini tinggal menyimpan & menggambar ulang supaya
   dropdown gaya penomorannya muncul/hilang. */
function torSwJudul(el){
  if(!torState || !el) return;
  const k=String(el.id||'').replace(/^tor-fld-/,'');
  if(!k) return;
  torState.data[k] = (String(el.value||'')==='Ya') ? 'Ya' : 'Tidak';
  renderTorSusun();
}
/* Dropdown gaya penomoran (— / A / a / I / i). Tidak menggambar ulang form:
   mengubahnya tidak mengubah struktur apa pun, dan menggambar ulang justru
   akan membuat dropdown menutup sendiri saat dipilih dengan papan ketik. */
function torSetNomorGaya(el){
  if(!torState || !el) return;
  const k=String(el.id||'').replace(/^tor-fld-/,'');
  if(!k) return;
  torState.data[k] = (typeof jsNumStyleOk==='function') ? jsNumStyleOk(el.value,'') : (el.value||'');
}

/* --- Field berlapis: ubah / tambah / hapus baris --- */
function torMultiSet(k,i,el){
  if(!torState) return;
  const d=torState.data;
  if(!Array.isArray(d[k+'_list'])) d[k+'_list']=[''];
  d[k+'_list'][i]=el.value;
  d[k]=d[k+'_list'].map(x=>String(x||'').trim()).filter(Boolean).join('; ');
}
function torMultiAdd(k){
  if(!torState) return;
  const d=torState.data;
  if(!Array.isArray(d[k+'_list'])) d[k+'_list']=[''];
  d[k+'_list'].push('');
  renderTorSusun();
  /* Fokus ke baris yang baru ditambahkan */
  try{
    const rows=document.querySelectorAll('#tor-ml-'+k+' input');
    if(rows.length) rows[rows.length-1].focus();
  }catch(e){}
}
function torMultiDel(k){
  if(!torState) return;
  const d=torState.data;
  const arr=Array.isArray(d[k+'_list'])?d[k+'_list']:[''];
  if(arr.length<=1){ toast('Minimal harus ada 1 isian','warn'); return; }
  arr.pop();                 /* buang PERSIS satu baris (tanpa merapikan ekor) */
  torMultiSync(d,k);
  renderTorSusun();
}
/* Simpan nama orang dalam HURUF BESAR. Nilai pada elemen input TIDAK ditulis
   ulang di sini — kalau ditulis ulang, kursor akan meloncat ke akhir setiap kali
   pengguna menyunting di tengah kata. Yang terlihat sudah besar berkat
   text-transform pada elemennya. */
function torSetUpper(k,el){
  if(!torState||!el) return;
  torState.data[k]=String(el.value||'').toUpperCase();
  torRefreshAuto();
}
function torSetRupiah(k,el){
  const n=String(el.value||'').replace(/[^0-9]/g,'');
  torState.data[k]= n? Number(n) : '';
  el.value = n? Number(n).toLocaleString('id-ID') : '';
  torRefreshAuto();
}
/* Sakelar berpindah HANYA saat diklik (tidak bereaksi saat tersentuh/hover). */
function torSwitchToggle(el){
  if(!el||!torState) return;
  const k   = el.getAttribute('data-k')||'';
  const on  = el.getAttribute('data-on')||'Ya';
  const off = el.getAttribute('data-off')||'Tidak';
  torSet(k, (String(torState.data[k]||'')===on) ? off : on);
}
/* Perbarui seluruh field otomatis tanpa menggambar ulang form */
function torRefreshAuto(){
  if(!torState) return;
  TOR_FIELDS_FLAT.forEach(f=>{
    if(!f.auto) return;
    const el=document.getElementById('tor-fld-'+f.k);
    if(el) el.value=torAutoVal(f.auto, torState.data);
  });
}
/* Label field. Chip kode {{key}} DIHAPUS dari tiap field supaya barisnya
   rapat & seragam; daftar lengkap kodenya dibuka lewat tombol "Kode Isian"
   di kepala Langkah 1 (lihat torKodeModal). */
function torLbl(f){ return fkEsc(f.l); }
/* Daftar seluruh kode mail-merge — pengganti chip per-field. */
function torKodeModal(){
  torEnsureStyle();
  const baris = TOR_FIELD_GROUPS.map(g=>
    '<div class="tor-kode-sec">'+fkEsc(g.sec)+'</div>'+
    g.fields.map(f=>'<div class="tor-kode-row"><span>'+fkEsc(f.l)+'</span>'+
      '<code onclick="torCopyCode(\''+fkEscJs(f.k)+'\')" title="Klik untuk menyalin">{{'+fkEsc(f.k)+'}}</code></div>').join('')
  ).join('') +
  '<div class="tor-kode-sec">Otomatis (tanpa isian)</div>'+
  TOR_KODE_AUTO.map(x=>'<div class="tor-kode-row"><span>'+fkEsc(x[1])+'</span>'+
    '<code onclick="torCopyCode(\''+fkEscJs(x[0])+'\')" title="Klik untuk menyalin">{{'+fkEsc(x[0])+'}}</code></div>').join('');
  let ov=document.getElementById('tor-kode-ov');
  if(!ov){ ov=document.createElement('div'); ov.id='tor-kode-ov'; ov.className='spk-ov'; document.body.appendChild(ov);
    ov.addEventListener('click', e=>{ if(e.target.id==='tor-kode-ov') torKodeClose(); }); }
  ov.innerHTML='<div class="spk-ov-modal" style="max-width:720px">'+
    '<div class="spk-ov-head"><span class="spk-ov-title">Kode Isian TOR/KAK</span>'+
      '<button class="btn btn-ghost btn-sm" onclick="torKodeClose()">Tutup</button></div>'+
    '<div class="spk-ov-body"><div class="tor-kode-hint">Tulis kode ini di dalam klausul (Word maupun editor). '+
      'Saat dokumen dibangun, kode diganti isian yang sesuai. Klik kode untuk menyalin.</div>'+
      '<div class="tor-kode-list">'+baris+'</div></div></div>';
  ov.classList.add('show');
}
/* Salin sebuah kode {{key}} ke papan klip (dipakai modal Kode Isian). */
function torCopyCode(k){
  const t='{{'+k+'}}';
  try{
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t);
    else { const ta=document.createElement('textarea'); ta.value=t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
    toast('Kode '+t+' disalin','ok');
  }catch(e){ toast('Gagal menyalin kode','err'); }
}
function torKodeClose(){ const ov=document.getElementById('tor-kode-ov'); if(ov) ov.classList.remove('show'); }
/* Kode yang terisi otomatis — tidak punya field isian sama sekali. */
const TOR_KODE_AUTO = [
  ['no_dokumen','No. Dokumen lengkap'],
  ['no_urut','Nomor urut 4 digit'],
  ['tahun_dokumen','Tahun dokumen'],
  ['tgl_dokumen','Tanggal dokumen (panjang)'],
  ['hari_dokumen','Nama hari tanggal dokumen'],
  /* nilai_pekerjaan_terbilang & jangka_waktu_terbilang TIDAK didaftar di sini:
     keduanya sudah tampil sebagai field "Terbilang" pada bagian Informasi
     Pengadaan, jadi mencantumkannya lagi membuat kodenya muncul dua kali. */
  ['jenis_pengadaan','Jenis pengadaan (ikut Kode Klasifikasi)'],
  ['auto_terbilang_jangka','Terbilang jangka waktu + "Hari Kalender"'],
  ['tahun_anggaran','Tahun anggaran (= tahun berjalan)'],
  ['sumber_dana','APLN Tahun … Anggaran Investasi/Operasi'],
  ['no_prk_baris','Nomor PRK, satu per baris'],
  ['nama_unit','Nama unit (baku)'],
  ['singkatan_unit','Singkatan unit (baku)'],
  ['lokasi_unit','Alamat unit (baku)'],
  ['unit_lengkap','PT PLN (Persero) + nama unit'],
  ['unit_singkat','PT PLN (Persero) + singkatan unit'],
  ['kota_ttd','Kota penandatanganan (Masohi)'],
  ['tgl_ttd','Tanggal tanda tangan = tanggal dokumen'],
  ['tempat_tanggal','"Masohi, 5 Agustus 2026"'],
  ['nip_pengguna','NIP Pengguna Barang/Jasa'],
  ['nip_direksi','NIP Direksi Pekerjaan']
];
function torFieldInput(f){
  const d=torState.data, v=d[f.k];
  /* Seluruh field selebar satu kolom -> 4 field per baris (--cols:4). */
  const span='';
  const dispDate=(x)=>{ const p=String(x||'').split('-'); return (p.length===3)?(p[2]+'/'+p[1]+'/'+p[0]):(x||''); };
  const locked=(disp,tip)=>'<div class="field"'+span+'><label>'+torLbl(f)+'</label>'+
    '<input type="text" id="tor-fld-'+f.k+'" value="'+fkEsc(disp)+'" readonly '+
    'style="background:#f3f5f7;color:#2b2f36;cursor:not-allowed'+(f.up?';text-transform:uppercase':'')+'" '+
    'title="'+fkEsc(tip||'Terisi otomatis — tidak dapat diubah di sini')+'"></div>';

  if(f.auto) return locked(torAutoVal(f.auto, d),
    (f.auto==='no_dokumen')      ? 'Nomor depan digenerate otomatis sesuai urutan dokumen (mulai 0001)' :
    (f.auto==='nilai_rab')       ? 'Terisi otomatis dari Jumlah Total RAB (langkah 4) \u2014 tidak dapat diubah di sini' :
    (f.auto==='terbilang_nilai') ? 'Terisi otomatis dari Nilai RAB' :
    (f.auto==='terbilang_jangka'|| f.auto==='terbilang_jangka_polos')
                                 ? 'Terisi otomatis dari Jangka Waktu Pelaksanaan' : '');
  /* Field yang dikunci oleh sebuah sakelar (lockedBy). Selama sakelarnya
     bukan "Ya", isian ditampilkan namun tidak dapat diubah — nilai yang
     sudah tersimpan tetap terbaca, tidak terlihat seolah terhapus. */
  if(f.lockedBy && String(d[f.lockedBy]||'')!==torSwOnOf(f.lockedBy))
    return locked(f.t==='date'?dispDate(v):(v||''),
      'Terkunci — pilih "'+(TOR_FIELDS_FLAT.filter(x=>x.k===f.lockedBy)[0]||{l:''}).l+' = '+torSwOnOf(f.lockedBy)+'" untuk mengisi');
  /* ---- Field BERLAPIS (t:'multi') ----
     Satu field dengan beberapa baris isian + tombol Tambah/Hapus, seperti
     Bidang/Sub Bidang & No. SPPBJ pada Monitoring. Tata letaknya dibuat
     sendiri di modul ini (kelas .tor-ml-*) supaya baris judulnya setinggi
     field biasa. Daftar isian disimpan di torState (bukan hanya di DOM),
     sehingga tidak hilang saat form digambar ulang. */
  /* Kunci penyimpan saja, tidak digambar (gaya penomoran Judul/Sub-Judul
     ditangani oleh field t:'judulsw' di atasnya). */
  if(f.t==='hidden') return '';
  /* ---- Field GABUNGAN Judul?/Sub-Judul? (t:'judulsw') ----
     Satu kotak berisi: judul field + sakelar Ya/Tidak di kanannya, lalu di
     bawahnya dropdown gaya penomoran saat sakelarnya ON, atau kotak nilai
     "Tidak" saat OFF. Seluruh potongannya MEMAKAI ULANG helper bersama di
     app.js (jsLabelSwitchHtml, jsNumSelectHtml, jsSwitchStateHtml) dan kelas
     .js-judul-field / .js-judul-row, jadi tampilannya dijamin sama dengan
     Perhitungan HPS tanpa menyalin satu baris CSS pun. */
  if(f.t==='judulsw'){
    const on=(String(v||'')==='Ya');
    return '<div class="field js-judul-field"'+span+'>'+
      jsLabelSwitchHtml(torLbl(f), 'tor-fld-'+f.k, (on?'Ya':'Tidak'), 'torSwJudul', 'data-nk="'+fkEsc(f.numKey||'')+'"')+
      '<div class="js-judul-row">'+
        (on ? jsNumSelectHtml('tor-fld-'+f.numKey, d[f.numKey]||'', 'torSetNomorGaya')
            : jsSwitchStateHtml('Tidak'))+
      '</div></div>';
  }
  if(f.t==='multi'){
    torMultiSync(d, f.k);            /* JANGAN dirapikan di sini — lihat torMultiSync */
    const arr=d[f.k+'_list'];
    const rows=arr.map((val,i)=>
      '<input type="text" value="'+fkEsc(val||'')+'"'+
      (f.ph?(' placeholder="'+fkEsc(f.ph)+'"'):'')+
      ' oninput="torMultiSet(\''+f.k+'\','+i+',this)">').join('');
    /* Judul tetap <label> biasa (bukan baris flex) supaya TINGGI-nya sama
       persis dengan field lain — kotak isian pertama jadi sejajar. Tombol
       Tambah/Hapus dipasang melayang (absolute) di sudut kanan atas field
       sehingga tidak ikut menambah tinggi baris judul. */
    return '<div class="field tor-ml">'+
        '<label>'+torLbl(f)+'</label>'+
        '<div class="tor-ml-act">'+
          '<button type="button" class="tor-ml-btn tor-ml-add" onclick="torMultiAdd(\''+f.k+'\')" title="Tambah isian">'+
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>Tambah</button>'+
          '<button type="button" class="tor-ml-btn tor-ml-del" onclick="torMultiDel(\''+f.k+'\')"'+(arr.length<=1?' disabled':'')+' title="Hapus isian terakhir">'+
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>Hapus</button>'+
        '</div>'+
        '<div class="tor-ml-list" id="tor-ml-'+f.k+'">'+rows+'</div>'+
      '</div>';
  }
  if(f.t==='select'){
    /* ---- Field pilihan berpasangan -> SAKELAR on/off ----
       Sakelar digambar sendiri di modul ini (bukan lewat jsLabelSwitchHtml)
       supaya: (a) pasangan labelnya bebas (Ya/Tidak, Ada/Tidak Ada), dan
       (b) tidak ada reaksi apa pun saat kursor lewat — keadaan hanya
       berpindah ketika tombolnya benar-benar DIKLIK. */
    const pair=torSwPair(f.opts);
    if(pair){
      const on=pair[0], off=pair[1];
      const isOn=(String(v||'')===on);
      return '<div class="field tor-swf"'+span+'>'+
        '<div class="tor-sw-head"><label>'+torLbl(f)+'</label>'+
          '<button type="button" class="tor-sw'+(isOn?' on':'')+'" id="tor-sw-'+f.k+'"'+
            ' data-k="'+f.k+'" data-on="'+fkEsc(on)+'" data-off="'+fkEsc(off)+'"'+
            ' role="switch" aria-checked="'+(isOn?'true':'false')+'"'+
            ' title="Klik untuk mengubah" onclick="torSwitchToggle(this)"><span class="kn"></span></button>'+
        '</div>'+
        '<div class="tor-sw-val'+(isOn?' on':'')+'"><span class="dt"></span>'+fkEsc(isOn?on:off)+'</div>'+
      '</div>';
    }
    const opts=(f.opts||[]).map(o=>{
      const ov=(o&&o.v!=null)?o.v:o, ol=(o&&o.l!=null)?o.l:o;
      return '<option value="'+fkEsc(ov)+'"'+((v===ov)?' selected':'')+'>'+fkEsc(ol)+'</option>';
    }).join('');
    return '<div class="field"'+span+'><label>'+torLbl(f)+'</label>'+
      '<select onchange="torSet(\''+f.k+'\',this.value)"><option value="">— pilih —</option>'+opts+'</select></div>';
  }
  if(f.t==='date')
    return '<div class="field"'+span+'><label>'+torLbl(f)+'</label>'+
      '<input type="date" value="'+fkEsc(v||'')+'" onchange="torSet(\''+f.k+'\',this.value)"></div>';
  if(f.t==='number')
    return '<div class="field"'+span+'><label>'+torLbl(f)+'</label>'+
      '<input type="number" min="0" value="'+fkEsc(v==null?'':v)+'" oninput="torSet(\''+f.k+'\',this.value)"></div>';
  if(f.t==='rupiah'){
    const disp=(v!==''&&v!=null)?Number(spkNum(v)).toLocaleString('id-ID'):'';
    return '<div class="field"'+span+'><label>'+torLbl(f)+'</label>'+
      '<input type="text" inputmode="numeric" placeholder="Rp" value="'+fkEsc(disp)+'" oninput="torSetRupiah(\''+f.k+'\',this)"></div>';
  }
  if(f.t==='textarea')
    return '<div class="field"'+span+'><label>'+torLbl(f)+'</label>'+
      '<textarea rows="3" oninput="torSet(\''+f.k+'\',this.value)">'+fkEsc(v||'')+'</textarea></div>';
  /* Field bertanda `up` (NAMA ORANG) selalu tampil & tersimpan HURUF BESAR.
     Dua lapis sengaja dipakai bersama:
       - text-transform:uppercase  -> yang TERLIHAT langsung besar saat mengetik
       - torSetUpper()             -> yang TERSIMPAN juga besar
     Lapis CSS saja tidak cukup: ia hanya mengubah tampilan, sedangkan nilai
     yang masuk ke database tetap seperti diketik. Lapis JS saja juga kurang
     nyaman: kursor bisa meloncat ke akhir bila nilai input ditulis ulang tiap
     ketukan, jadi input dibiarkan apa adanya dan CSS yang mengurus tampilannya. */
  if(f.up)
    return '<div class="field"'+span+'><label>'+torLbl(f)+'</label>'+
      '<input type="text" style="text-transform:uppercase" autocapitalize="characters" spellcheck="false"'+
      ' value="'+fkEsc(v||'')+'"'+(f.ph?(' placeholder="'+fkEsc(f.ph)+'"'):'')+
      ' oninput="torSetUpper(\''+f.k+'\',this)"></div>';
  return '<div class="field"'+span+'><label>'+torLbl(f)+'</label>'+
    '<input type="text" value="'+fkEsc(v||'')+'"'+(f.ph?(' placeholder="'+fkEsc(f.ph)+'"'):'')+' oninput="torSet(\''+f.k+'\',this.value)"></div>';
}

/* ===================== 8. HALAMAN: PENYUSUNAN TOR/KAK ===================== */
function torEnsureStyle(){
  if(document.getElementById('tor-style')) return;
  const css=
    /* ---- Sakelar on/off milik form TOR ----
       Tanpa aturan :hover sama sekali: tampilannya hanya berubah setelah
       diklik, tidak "bergetar"/berpindah saat tersentuh kursor. */
    '.tor-swf .tor-sw-head{display:flex;align-items:center;justify-content:space-between;gap:10px}'+
    'button.tor-sw{flex:0 0 auto;-webkit-appearance:none;appearance:none;position:relative;'+
      'width:44px;height:22px;padding:0;margin:0;border:0;border-radius:999px;background:#CBD5E1;'+
      'cursor:pointer;outline:none;transition:background-color .18s ease}'+
    'button.tor-sw .kn{position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;'+
      'background:#fff;box-shadow:0 1px 2px rgba(16,24,40,.25);transition:left .18s ease}'+
    'button.tor-sw.on{background:#2E8B84}'+
    'button.tor-sw.on .kn{left:25px}'+
    'button.tor-sw:disabled{opacity:.5;cursor:not-allowed}'+
    '.tor-sw-val{display:flex;align-items:center;gap:8px;min-height:37px;padding:0 12px;box-sizing:border-box;'+
      'border:1px solid #D9E1E7;border-radius:10px;background:#fff;font-size:12.5px;line-height:1.25;color:#98A2B3}'+
    '.tor-sw-val .dt{width:7px;height:7px;border-radius:50%;background:#C2CBD6}'+
    '.tor-sw-val.on{background:#EAF6F4;border-color:#BCE0DA;color:#1F5E58;font-weight:700}'+
    '.tor-sw-val.on .dt{background:#2E8B84}'+
    /* ---- Field berlapis (Nomor PRK) ----
       Tiap field DIPATOK ke sisi ATAS barisnya. Tanpa ini, saat baris Nomor
       PRK bertambah, seluruh field lain di baris yang sama ikut turun
       (kotaknya diregangkan setinggi field terpanjang lalu isinya menempel di
       bawah). Dengan align-self:flex-start, field lain tetap di atas dan
       Nomor PRK memanjang sendiri ke bawah. */
    '#tor-susun-content .form-flow{align-items:flex-start}'+
    '#tor-susun-content .form-flow > .field{align-self:flex-start}'+
    '.field.tor-ml{position:relative}'+
    '.tor-ml-act{position:absolute;top:-2px;right:0;display:flex;gap:6px;z-index:2}'+
    '.tor-ml-btn{-webkit-appearance:none;appearance:none;display:inline-flex;align-items:center;gap:4px;'+
      'height:20px;padding:0 8px;border:1px solid transparent;border-radius:6px;'+
      'font-size:10.5px;font-weight:800;line-height:1;cursor:pointer}'+
    '.tor-ml-btn svg{width:11px;height:11px}'+
    '.tor-ml-add{background:#2E8B84;color:#fff}'+
    '.tor-ml-del{background:#fff;color:#C4485A;border-color:#EFC9CF}'+
    '.tor-ml-btn:disabled{opacity:.45;cursor:not-allowed}'+
    '.tor-ml-list{display:flex;flex-direction:column;gap:8px}'+
    '.tor-ml-list input{width:100%}'+
    /* ---- Lencana nomor bab pada Pustaka Klausul TOR ----
       Lencana bawaan (.spk-klx-no) berukuran tetap 26x26 untuk angka tunggal;
       label bab seperti "II.10" butuh kotak yang melar. Dilingkupi
       #tor-susun-content supaya Pustaka Klausul milik Susun Kontrak TIDAK
       tersentuh sama sekali. */
    '#tor-susun-content .spk-klx-no{width:auto;min-width:34px;padding:0 8px;font-size:11.5px;'+
      'letter-spacing:.01em;font-variant-numeric:tabular-nums}'+
    '#tor-susun-content .spk-klx-no.tor-no{cursor:pointer;transition:background-color .15s ease}'+
    '#tor-susun-content .spk-klx-no.tor-no:hover{background:#1B4F63}'+
    /* Sekat bab: penanda visual awal tiap bab di daftar klausul */
    '#tor-susun-content .tor-babsep{display:flex;align-items:center;gap:10px;margin:16px 0 2px;'+
      'font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#1B3A6B}'+
    '#tor-susun-content .tor-babsep:first-child{margin-top:2px}'+
    '#tor-susun-content .tor-babsep::after{content:"";flex:1;height:1px;background:#DCE4EE}'+
    /* ---- Stepper Penyusunan Dokumen: RATA KIRI-KANAN ----
       Bawaannya .spk-stp-line{flex:1;max-width:120px} \u2014 batas 120px itu
       membuat rangkaian langkah berhenti di tengah dan menyisakan ruang kosong
       di kanan. Batasnya dilepas di sini supaya garis penghubung menyerap
       seluruh sisa lebar dan langkah terakhir mentok ke tepi kanan.
       DILINGKUPI #tor-susun-content: stepper Susun Kontrak yang hanya berisi
       dua langkah TIDAK ikut berubah \u2014 pada dua langkah, garis sepanjang itu
       justru terlihat menganga. */
    '#tor-susun-content .spk-stepper{gap:12px}'+
    '#tor-susun-content .spk-stp{flex:0 0 auto}'+
    '#tor-susun-content .spk-stp-line{max-width:none;min-width:24px}'+
    /* Daftar dokumen pada menu aksi */
    '.tor-dk-ov{position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;'+
      'background:rgba(12,28,38,.45);padding:20px}'+
    '.tor-dk-ov.show{display:flex}'+
    /* ---- GETARAN "TUTUP DULU" ----
       KETENTUAN 6 Agu 2026: mengklik di luar kotak TIDAK LAGI menutup pop-up.
       Sebagai gantinya kotaknya bergetar dan berbunyi, meniru jendela modal
       peramban — isyarat bahwa pop-up ini harus ditutup lebih dulu.

       Kenapa getaran mendatar, bukan sekadar kedipan: gerak mendatar singkat
       adalah bahasa "tidak bisa" yang sudah dikenal luas (sistem operasi
       memakainya untuk kata sandi salah), dan ia tidak mengubah tata letak
       sehingga tidak menggeser apa pun di dalam kotak.
       Jaraknya sengaja kecil (6px) dan cepat (0,4 detik) — cukup terasa,
       tidak sampai mengganggu.

       Tombol tutup ikut disorot cincin putih pada saat yang sama, supaya
       pengguna tidak hanya tahu "tidak bisa" tetapi juga TAHU HARUS KE MANA. */
    '@keyframes tor-dk-getar{'+
      '0%,100%{transform:translateX(0)}'+
      '15%{transform:translateX(-6px)}30%{transform:translateX(6px)}'+
      '45%{transform:translateX(-4px)}60%{transform:translateX(4px)}'+
      '75%{transform:translateX(-2px)}90%{transform:translateX(2px)}}'+
    '@keyframes tor-dk-sorot{'+
      '0%,100%{box-shadow:0 2px 7px rgba(4,26,32,.30)}'+
      '50%{box-shadow:0 0 0 4px rgba(255,255,255,.75),0 2px 7px rgba(4,26,32,.30)}}'+
    '.tor-dk-mdl.menolak{animation:tor-dk-getar .4s cubic-bezier(.36,.07,.19,.97) both}'+
    '.tor-dk-mdl.menolak .tor-dk-hd .x{animation:tor-dk-sorot .4s ease-in-out 2}'+
    /* Pengguna yang meminta gerak dikurangi tetap mendapat isyarat, hanya
       tanpa guncangan: cincin pada tombol tutup saja. */
    '@media (prefers-reduced-motion:reduce){'+
      '.tor-dk-mdl.menolak{animation:none}'+
      '.tor-dk-mdl.menolak .tor-dk-hd .x{animation:tor-dk-sorot .5s ease-in-out 2}}'+
    /* max-width + min-width:0 menahan lebar modal pada jatah overlay: tanpa
       keduanya, isi kepala yang panjang bisa MELEBARKAN modal sehingga tombol
       di kanan atas terdorong keluar layar. */
    '.tor-dk-mdl{width:min(560px,100%);max-width:100%;min-width:0;background:#fff;'+
      'border-radius:16px;overflow:hidden;box-shadow:0 24px 60px rgba(10,30,40,.28)}'+
    /* align-items:flex-start (bukan center): begitu nama pekerjaan melipat jadi
       dua-tiga baris, tombol Cetak & tutup TETAP menempel di sudut KANAN ATAS,
       tidak ikut melorot ke tengah tinggi kepala (ketentuan 6 Agu 2026). */
    /* ---- TOMBOL DIPAKU DI SUDUT KANAN ATAS ----
       KETENTUAN 6 Agu 2026: "panjang teks pekerjaan tidak akan menggeser posisi
       ikon cetak dan x ke depannya".

       Susunan flex (judul dan tombol sebagai dua kolom bersebelahan) TIDAK bisa
       menjamin itu: berapa pun penjagaan flex:none & min-width:0 yang dipasang,
       posisi tombol tetap merupakan HASIL dari lebar judul — satu nama tanpa
       spasi yang sangat panjang, atau lebar layar yang tidak terduga, masih bisa
       menggesernya. Karena itu kelompok tombol dikeluarkan dari aliran flex dan
       DIPAKU (position:absolute) ke sudut kanan atas kepala.

       Ruang untuk tombol dicadangkan lewat padding-kanan kepala (--dk-act),
       jadi judul berhenti tepat sebelum tombol dan tidak pernah menyelinap di
       bawahnya. Dengan cara ini letak tombol menjadi TETAP — sama sekali tidak
       bergantung pada isi judul. */
    '.tor-dk-hd{--dk-act:92px;position:relative;display:flex;flex-wrap:nowrap;'+
      'align-items:flex-start;gap:12px;padding:16px 18px;'+
      'padding-right:calc(18px + var(--dk-act));'+
      'background:linear-gradient(90deg,#0E7C86,#12A0A8);color:#fff}'+
    /* Judul MELIPAT, tombol TIDAK MENGECIL (ketentuan 6 Agu 2026: "tombol x
       sepertinya gepeng karena nama pekerjaan terlalu panjang"). Penyebabnya
       flex-shrink bawaan: tombol ikut menyusut saat judul mendesak. Kolom judul
       diberi flex:1 1 auto + min-width:0 supaya DIA yang melipat, sedangkan
       kelompok tombol dikunci flex:none.

       min-width:0 + overflow-wrap:anywhere adalah PASANGAN yang wajib: tanpa
       min-width:0 sebuah kata panjang (nama pekerjaan tanpa spasi) memaksa
       kolom judul melebihi jatahnya lalu MENDORONG tombol keluar layar;
       tanpa overflow-wrap:anywhere kata itu tidak mau dipenggal sama sekali. */
    '.tor-dk-hd .jd{flex:1 1 auto;min-width:0;max-width:100%}'+
    '.tor-dk-hd b{display:block;font-size:14px;line-height:1.35;'+
      'white-space:normal;overflow-wrap:anywhere;word-break:break-word}'+
    /* margin-top negatif tipis: menyamakan titik tengah tombol dengan titik
       tengah BARIS PERTAMA judul, supaya sudut kanan atas terlihat presisi. */
    /* ---- AKAR MASALAH "TOMBOL X TERPOTONG" ----
       style.css memakai kelas `.act` untuk TOMBOL AKSI di tabel:
         .act{width:30px;height:30px;display:grid;place-items:center;...}
       Pembungkus tombol di kepala modal ini kebetulan memakai nama kelas yang
       SAMA, sehingga ia ikut dipatok selebar 30px — padahal isinya dua tombol
       30px + jarak 10px = 70px. Kotaknya dijangkarkan 14px dari kanan, lalu
       isinya MELUBER 40px ke kanan dan tombol tutup terpotong tepi modal.
       Itu sebabnya gejalanya tidak muncul saat diuji tanpa style.css.
       width/height dinolkan (auto) di sini supaya pembungkusnya kembali
       selebar isinya. */
    '.tor-dk-hd .act{position:absolute;top:14px;right:14px;margin:0;'+
      'width:auto;height:auto;min-width:0;padding:0;border:0;background:none;'+
      'box-shadow:none;display:flex;align-items:center;gap:10px}'+
    /* IKON PUTIH POLOS (ketentuan 6 Agu 2026: "cetak dan x berwarna putih
       saja"): kotak latar rgba putih dihapus, yang tersisa hanya guratan
       ikonnya. Umpan balik sorot memakai opacity — tidak menambah warna baru. */
    /* ---- WARNA HIDUP, MENGIKUTI BAHASA TOMBOL AKSI DI TABEL ----
       KETENTUAN 6 Agu 2026. Gradasi yang dipakai SAMA PERSIS dengan tombol aksi
       pada tabel (style.css: .act-view teal->cyan, .act-del merah), termasuk
       pembagian perannya: mencetak = teal, menutup = merah. Dengan begitu merah
       selalu berarti "mengakhiri" di seluruh aplikasi.
       Sebelumnya keduanya putih polos tanpa latar — di atas kepala bergradasi
       teal, batas tombolnya nyaris tidak terlihat dan tombol tutup mudah
       terlewat. */
    /* KEPING PUTIH, IKON BERWARNA — bukan sebaliknya.
       Percobaan pertama memberi tombol latar teal (meniru .act-view di tabel).
       Hasilnya keliru: kepala modal ini SENDIRI bergradasi teal #0E7C86 -> #12A0A8,
       dan tombol di ujung kanan jatuh tepat di bagian paling terang gradasi itu —
       teal di atas teal, tombolnya nyaris lenyap. Warna yang bagus di atas latar
       putih (tabel) belum tentu bagus di atas latar teal.
       Karena itu dibalik: KEPINGNYA putih, IKONNYA yang berwarna. Kontrasnya
       maksimal di atas teal apa pun, dan bahasa warnanya tetap sama —
       teal = mencetak, merah = menutup. */
    '.tor-dk-hd .x,.tor-dk-hd .pr{border:0;'+
      'width:32px;height:32px;flex:0 0 32px;border-radius:9px;line-height:0;cursor:pointer;'+
      'display:flex;align-items:center;justify-content:center;padding:0;'+
      'color:#fff;box-shadow:0 2px 6px rgba(6,30,36,.30);'+
      'transition:filter .15s ease,box-shadow .2s ease}'+
    '.tor-dk-hd .pr{background:linear-gradient(135deg,#0E7C86,#16a9b5)}'+
    '.tor-dk-hd .x{background:linear-gradient(135deg,#D33A3A,#e25151)}'+
    '.tor-dk-hd .x:hover,.tor-dk-hd .pr:hover{filter:brightness(1.08);'+
      'box-shadow:0 4px 10px rgba(6,30,36,.36)}'+
    '.tor-dk-hd .x:focus-visible,.tor-dk-hd .pr:focus-visible{outline:2px solid #fff;outline-offset:2px}'+
    /* Kedua ikon berukuran & berketebalan gurat SAMA; warnanya diwarisi dari
       tombolnya lewat currentColor. Silang digambar sebagai SVG (lihat markup)
       supaya benar-benar di tengah kotak — karakter &times; punya sisi kosong
       yang berbeda menurut muka hurufnya. */
    '.tor-dk-hd .pr svg,.tor-dk-hd .x svg{width:15px;height:15px;display:block;'+
      'stroke:currentColor;fill:none;stroke-width:2}'+
    '.tor-dk-bd{padding:12px;display:flex;flex-direction:column;gap:8px;max-height:70vh;overflow:auto}'+
    '.tor-dk-row{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:12px 14px;'+
      'border:1px solid #E3EAF2;border-radius:12px;background:#fff;cursor:pointer;'+
      'transition:border-color .15s ease,background .15s ease}'+
    '.tor-dk-row:hover{border-color:#9FD0D6;background:#F6FCFC}'+
    '.tor-dk-row .ic{flex:none;width:34px;height:34px;border-radius:9px;background:#E6F4F5;color:#0E7C86;'+
      'display:flex;align-items:center;justify-content:center;font-size:16px}'+
    '.tor-dk-row .tx{flex:1;min-width:0}'+
    '.tor-dk-row .tx b{display:block;font-size:13px;color:#1B3A6B}'+
    '.tor-dk-row .tx i{display:block;font-style:normal;font-size:11px;color:#7A868F;margin-top:2px}'+
    '.tor-dk-row .go{flex:none;font-size:12px;color:#9AA6B0;font-weight:700}'+
    '.tor-dk-row.is-soon{opacity:.6;cursor:not-allowed}'+
    '.tor-dk-row.is-soon:hover{border-color:#E3EAF2;background:#fff}'+
    /* Tabel Susun RAB — menumpang seluruh gaya .hps-uraian milik HPS, hanya
       kolom "Jumlah (Rp)" yang baru (kolom hasil, tidak dapat diketik). */
    '.hps-uraian.tor-rab td.c-jt,.hps-uraian.tor-rab th.c-jt{white-space:nowrap;min-width:120px}'+
    /* Warna & perataan angka HANYA untuk sel isi — bukan sel judul, supaya
       kepala tabel tetap putih & rata tengah seperti kolom lainnya. */
    '.hps-uraian.tor-rab td.c-jt{text-align:right;font-variant-numeric:tabular-nums;'+
      'font-weight:700;color:#1B3A6B;background:#F7FCFC}'+
    /* KEPALA TABEL SERAGAM — tiga kolom sempat beda sendiri:
         - "NO"          : style.css menyatukan th.c-no & td.c-no dalam satu aturan
                           ber-`color:#0b6a73`, jadi judulnya ikut kebiruan.
         - "URAIAN PEKERJAAN": style.css memberi th.c-ur `text-align:left`.
         - "JUMLAH (RP)" : aturan .tor-rab di atas dulu mencakup th juga.
       Aturan ini dipatok ke `.tor-rab` saja (kekhususan 3 kelas > 2 kelas milik
       style.css) sehingga tabel HPS, Analisa, & Lampiran SPK tidak tersentuh. */
    'table.hps-uraian.tor-rab thead th{color:#fff;text-align:center}'+
    /* Kotak isian JUDUL dilebarkan 2,5x dari bawaan style.css (96px -> 240px).
       Tambahan lebarnya diambil dari kolom Uraian Pekerjaan: `td.c-ur` ber-
       `width:100%` sehingga ia yang mengalah lebih dulu, dan penyusutannya
       berhenti di `min-width:340px` milik th.c-ur (sisanya jadi geser mendatar
       di .hps-uraian-wrap). Kelas `c-judul`/`c-subjudul` sengaja dipisah dari
       `c-kel` supaya Sub-Judul TIDAK ikut melebar. */
    'table.hps-uraian.tor-rab td.c-judul input{min-width:'+TOR_RAB_JUDUL_W+'px}'+
    /* Daftar Pilih Klausul (langkah 3) */
    '.tor-pk-list{display:grid;grid-template-columns:1fr 1fr;gap:8px}'+
    '@media(max-width:760px){.tor-pk-list{grid-template-columns:1fr}}'+
    '.tor-pk-row{display:flex;align-items:center;gap:12px;padding:9px 12px;border:1px solid #E3EAF2;'+
      'border-radius:10px;background:#fff;cursor:pointer;transition:border-color .15s ease,background .15s ease}'+
    '.tor-pk-row.on{border-color:#BBD9DE;background:#F7FCFC}'+
    '.tor-pk-row input{width:16px;height:16px;flex:none;cursor:pointer;accent-color:#0E7C86}'+
    '.tor-pk-row .no{flex:none;min-width:44px;padding:2px 8px;border-radius:7px;background:#1B3A6B;color:#fff;'+
      'font-size:11.5px;font-weight:800;text-align:center;font-variant-numeric:tabular-nums}'+
    '.tor-pk-row:not(.on) .no{background:#C7CFD8}'+
    '.tor-pk-row .jd{font-size:13px;font-weight:700;color:#1B3A6B;text-transform:uppercase;letter-spacing:.01em}'+
    '.tor-pk-row:not(.on) .jd{color:#93A0AD;text-decoration:line-through}'+

    /* Modal "Kode Isian" — pengganti chip {{kode}} yang dulu menempel di
       tiap label field. */
    '.tor-kode-btn{gap:6px}'+
    '.tor-kode-hint{margin:0 0 12px;padding:10px 14px;border-radius:10px;background:#EEF4FF;'+
      'border:1px solid #D6E2F7;color:#1B3A6B;font-size:11.5px;line-height:1.6}'+
    '.tor-kode-list{display:flex;flex-direction:column;gap:2px}'+
    '.tor-kode-sec{margin:14px 0 6px;font-size:10px;font-weight:800;letter-spacing:.12em;'+
      'text-transform:uppercase;color:#7A828E}'+
    '.tor-kode-sec:first-child{margin-top:0}'+
    '.tor-kode-row{display:flex;align-items:center;justify-content:space-between;gap:14px;'+
      'padding:7px 10px;border-radius:8px}'+
    '.tor-kode-row:nth-child(odd){background:#F7F9FC}'+
    '.tor-kode-row>span{font-size:12px;color:#2B3038;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
    '.tor-kode-row>code{flex:0 0 auto;cursor:pointer;font-size:11px;font-weight:700;padding:3px 8px;'+
      'border-radius:6px;border:1px solid #D9DEE6;background:#fff;color:#1B3A6B;'+
      'font-family:ui-monospace,Menlo,Consolas,monospace}'+
    '.tor-kode-row>code:hover{background:#E9EFF8;border-color:#9FB6DA}';
  const st=document.createElement('style'); st.id='tor-style'; st.textContent=css;
  (document.head||document.documentElement).appendChild(st);
}

function openTorSusun(){
  if(!torState) torState=torBlankState();
  torStep=1; showView('tor-susun');
}
async function torNewDokumen(){
  torEditId=null;
  try{ await refreshDataTor(); }catch(e){}
  torState=torBlankState();
  torSyncNomor();
  torStep=1;
  showView('tor-susun');
}
function torEditRecord(id){
  const rec=(records_tor||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  torEditId=rec.id;
  torState=torRecordToState(rec);
  torSyncNomor();
  torStep=1;
  showView('tor-susun');
}
/* Tombol "Batal" pada SETIAP langkah penyusunan dokumen TOR/KAK.

   DISERAGAMKAN dengan modul lain (6 Agu 2026). Dulu fungsi ini langsung
   membuang seluruh isian tanpa bertanya — berbahaya, karena tombolnya
   bersebelahan dengan "Berikutnya" di keempat langkah. Sekarang memakai pola
   yang sama persis dengan pnwBatal/rhoBatal/dpBatal/hpsBatal:
     tanya dulu lewat openConfirm -> baru kosongkan -> beri kabar lewat toast.

   Toast-nya bernada 'err' (MERAH + ikon silang), bukan 'ok' (hijau + centang):
   membatalkan proses bukan keberhasilan, dan tanda centang hijau untuk
   pekerjaan yang justru dibuang membingungkan. Nada yang sama dipakai seluruh
   modul lain yang menampilkan pesan "Proses dibatalkan". */
function torBatalClick(){
  const lanjut=()=>{
    torEditId=null; torState=torBlankState(); torStep=1;
    showView('tor-view');
    toast('Proses dibatalkan','err');
  };
  if(typeof openConfirm==='function'){
    openConfirm({ icon:'del', title:'Batalkan Proses',
      text:'Batalkan proses ini? Data yang belum disimpan akan hilang.',
      onYes:lanjut });
    return;
  }
  lanjut();
}
function torGoStep(n){
  /* BUG LAMA: `n=(n===2)?2:1` — sisa dari masa alur ini masih 2 langkah.
     Akibatnya torGoStep(3) & torGoStep(4) diam-diam dipaksa jadi 1, sehingga
     tombol "Berikutnya: Pilih Klausul" terpental balik ke Langkah 1.
     Sekarang keempat langkah diterima, sama seperti spkGoStep(). */
  n=(n===2?2:(n===3?3:(n===4?4:1)));
  if(n>=2){
    const nama=String((torState&&torState.data&&torState.data.nama_pekerjaan)||'').trim();
    if(!nama){ toast('Isi Nama Pekerjaan terlebih dahulu sebelum lanjut','warn'); n=1; }
  }
  torStep=n; renderTorSusun();
  try{ window.scrollTo({top:0,left:0,behavior:'smooth'}); }catch(e){}
}

function renderTorSusun(){
  const cont=document.getElementById('tor-susun-content'); if(!cont) return;
  torEnsureStyle();
  if(!torState) torState=torBlankState();
  torSyncNomor();
  torSyncSumberDana(torState.data);
  /* Mesin klausul milik Susun Kontrak dipakai ulang: state & pustaka klausul
     diarahkan ke dokumen TOR yang sedang disusun (lihat torBridgeKlausul). */
  torBridgeKlausul();

  const secIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>';
  /* Tombol "Pilih Pekerjaan" DIHAPUS — seluruh isian ditulis langsung di sini.
     Kartu pertama membawa banner nomor dokumen (informasi, bukan isian) dan
     tombol "Kode Isian" pengganti chip {{kode}} per-field. */
  const kartu=(g,gi)=>{
    const isi=g.fields.map(torFieldInput).join('');
    const alat = (gi===0)
      ? '<button type="button" class="btn btn-ghost btn-sm tor-kode-btn" onclick="torKodeModal()">'+
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></svg> Kode Isian</button>'
      : '';
    const judul = alat
      ? '<div class="form-section-title" style="justify-content:space-between"><span>'+secIcon+' '+fkEsc(g.sec)+'</span>'+alat+'</div>'
      : '<div class="form-section-title">'+secIcon+' '+fkEsc(g.sec)+'</div>';
    return '<div class="form-card">'+
      judul+
      '<div class="form-flow" style="--cols:4">'+isi+'</div>'+
    '</div>';
  };

  const stp=(no,label)=>'<button type="button" class="spk-stp'+(torStep===no?' active':(torStep>no?' done':''))+'" onclick="torGoStep('+no+')">'+
    '<span class="spk-stp-no">'+(torStep>no?'&#10003;':no)+'</span> '+label+'</button>';
  /* Alur Dokumen Pengadaan:
       1. Data Pekerjaan   2. Ubah Klausul   3. Pilih Klausul   4. Susun RAB
     Pakta Integritas TIDAK berupa langkah isian: ia dibangkitkan otomatis dari
     data yang sudah masuk begitu dokumen disimpan. */
  const stepper='<div class="spk-stepper">'+
    stp(1,'Data Pekerjaan')+'<div class="spk-stp-line"></div>'+
    stp(2,'Ubah Klausul')+'<div class="spk-stp-line"></div>'+
    stp(3,'Pilih Klausul')+'<div class="spk-stp-line"></div>'+
    stp(4,'Susun RAB')+'</div>';

  const btnBatal='<button class="btn btn-red" onclick="torBatalClick()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg> Batal</button>';

  if(torStep===1){
    cont.innerHTML=
      stepper+
      TOR_FIELD_GROUPS.map(kartu).join('')+
      '<div class="jp-actions" style="justify-content:flex-end;margin-top:4px">'+
        btnBatal+
        '<button class="btn btn-teal" onclick="torGoStep(2)">Berikutnya: Ubah Klausul <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>'+
      '</div>';
  }else if(torStep===2){
    cont.innerHTML=
      stepper+
      '<div id="spk-klausul-content"></div>'+
      '<div class="jp-actions" style="justify-content:space-between;margin-top:4px">'+
        '<button class="btn btn-ghost" onclick="torGoStep(1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M11 6l-6 6 6 6"/></svg> Kembali</button>'+
        '<button class="btn btn-teal" onclick="torGoStep(3)">Berikutnya: Pilih Klausul <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>'+
      '</div>';
    try{ renderSpkKlausul(); }catch(e){ console.error(e); }
  }else if(torStep===3){
    cont.innerHTML=
      stepper+
      torPilihKlausulHtml()+
      '<div class="jp-actions" style="justify-content:space-between;margin-top:4px">'+
        '<button class="btn btn-ghost" onclick="torGoStep(2)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M11 6l-6 6 6 6"/></svg> Kembali</button>'+
        '<button class="btn btn-teal" onclick="torGoStep(4)">Berikutnya: Susun RAB <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>'+
      '</div>';
  }else{
    cont.innerHTML=
      stepper+
      torRabHtml()+
      '<div class="jp-actions" style="justify-content:space-between;margin-top:4px">'+
        '<button class="btn btn-ghost" onclick="torGoStep(3)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M11 6l-6 6 6 6"/></svg> Kembali</button>'+
        '<span style="display:flex;gap:10px">'+
          btnBatal+
          '<button class="btn btn-teal" onclick="torPreviewCurrent()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg> Pratinjau / Cetak</button>'+
          '<button class="btn btn-green" onclick="torSaveDokumen()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg> Simpan</button>'+
        '</span>'+
      '</div>';
    try{ torRabRenderSummary(); }catch(e){ console.error(e); }
  }
}

/* ===================== LANGKAH 4 — SUSUN RAB =====================
   RAB memakai ULANG seluruh mesin hitung HPS di app.js, bukan menyalinnya:
     hpsItemMat(it)  = Vol x Harga Barang   (dibulatkan)
     hpsItemJasa(it) = Vol x Harga Jasa     (dibulatkan)
     hpsItemTotal(it)= Barang + Jasa
     hpsSummary(st)  = Jumlah -> DPP (11/12) -> PPn 12% -> Jumlah Total
   Bedanya dengan Analisa Harga Satuan: TIDAK ada Referensi, Metode Perhitungan,
   maupun Metode (Semua Uraian) — harga diketik langsung, sekali saja.

   Barisnya disimpan di torState.data.__rab. Karena torSaveDokumen menyimpan
   seluruh objek data apa adanya (rec.data = d), RAB ikut tersimpan & termuat
   kembali tanpa perlu kolom tabel baru di Supabase.

   Banyaknya baris mengikuti isian "Jumlah Barang/Jasa" pada langkah 1. Data
   baris yang sudah terlanjur diisi TIDAK dibuang saat angka itu dikecilkan —
   hanya disembunyikan — sehingga menaikkannya kembali memulihkan isinya. */
function torRabBlankItem(){ return {judul:'', subjudul:'', uraian:'', sat:'', vol:'', hargaMat:'', hargaJasa:''}; }
function torRabCfg(){
  const d=(torState&&torState.data)||{};
  return {
    judulOn:    String(d.rab_judul_on||'')==='Ya',
    judulNum:   String(d.rab_judul_num||''),
    subjudulOn: String(d.rab_subjudul_on||'')==='Ya',
    subjudulNum:String(d.rab_subjudul_num||''),
    jml: Math.max(1, parseInt(d.jumlah_bj,10)||1)
  };
}
/* Simpanan mentah (boleh lebih panjang dari jumlah baris yang tampil) */
function torRabStore(){
  if(!torState) return [];
  if(!Array.isArray(torState.data.__rab)) torState.data.__rab=[];
  return torState.data.__rab;
}
/* Baris yang TAMPIL & ikut dihitung — tepat sebanyak Jumlah Barang/Jasa */
function torRabItems(){
  const st=torRabStore(), n=torRabCfg().jml;
  while(st.length<n) st.push(torRabBlankItem());
  return st.slice(0,n);
}
function torRabHtml(){
  const cfg=torRabCfg(), items=torRabItems(), esc=fkEsc;
  let rows='';
  items.forEach((it,i)=>{
    rows+='<tr>'+
      '<td class="c-no">'+(i+1)+'</td>'+
      (cfg.judulOn?('<td class="c-kel c-judul"><input type="text" data-i="'+i+'" placeholder="mis. PENGADAAN BARANG" value="'+esc(it.judul||'')+'" oninput="torRabSet(this,\'judul\')"></td>'):'')+
      (cfg.subjudulOn?('<td class="c-kel c-subjudul"><input type="text" data-i="'+i+'" placeholder="mis. Material Utama" value="'+esc(it.subjudul||'')+'" oninput="torRabSet(this,\'subjudul\')"></td>'):'')+
      '<td class="c-ur"><textarea data-i="'+i+'" rows="1" placeholder="Uraian barang / jasa ke-'+(i+1)+'" oninput="torRabSet(this,\'uraian\')">'+esc(it.uraian||'')+'</textarea></td>'+
      '<td class="c-sat"><input type="text" data-i="'+i+'" placeholder="Set" value="'+esc(it.sat||'')+'" oninput="torRabSet(this,\'sat\')"></td>'+
      '<td class="c-vol"><input type="text" inputmode="decimal" data-i="'+i+'" placeholder="0" value="'+esc(it.vol!=null?String(it.vol):'')+'" oninput="torRabOnVol(this)"></td>'+
      '<td class="c-money"><input type="text" inputmode="numeric" data-i="'+i+'" placeholder="Rp" value="'+rupiahInputText(it.hargaMat)+'" oninput="torRabOnRp(this,\'hargaMat\')"></td>'+
      '<td class="c-money"><input type="text" inputmode="numeric" data-i="'+i+'" placeholder="Rp" value="'+rupiahInputText(it.hargaJasa)+'" oninput="torRabOnRp(this,\'hargaJasa\')"></td>'+
      '<td class="c-jt" id="tor-rab-jt-'+i+'">'+hpsRp(hpsItemTotal(it))+'</td>'+
    '</tr>';
  });
  return '<div class="form-section">'+
    '<div class="form-section-title"><span>Susun RAB</span>'+
      '<span class="hps-chip">'+items.length+' barang/jasa</span></div>'+
    '<div class="hps-hint">Harga diketik langsung — tidak ada referensi maupun metode perhitungan. '+
      '<b>Jumlah</b> tiap baris = Vol \u00d7 (Harga Barang + Harga Jasa), lalu diringkas memakai rumus HPS '+
      '(DPP 11/12, PPn 12%). Banyaknya baris mengikuti <b>Jumlah Barang/Jasa</b> di langkah Data Pekerjaan.</div>'+
    torRabTplBarHtml()+
    '<div class="hps-uraian-wrap"><table class="hps-uraian tor-rab"><thead><tr>'+
      '<th class="c-no">No</th>'+
      (cfg.judulOn?'<th class="c-judul">Judul</th>':'')+
      (cfg.subjudulOn?'<th class="c-subjudul">Sub-Judul</th>':'')+
      '<th class="c-ur">Uraian Pekerjaan</th><th>Sat</th><th>Vol</th>'+
      '<th>Harga<br>Barang</th><th>Harga<br>Jasa</th><th class="c-jt">Jumlah<br>(Rp)</th>'+
    '</tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<div id="tor-rab-sum" class="hps-sum-wrap"></div>'+
  '</div>';
}
/* ---- Penyunting sel ---- */
function torRabItemAt(el){
  const i=parseInt(el&&el.dataset&&el.dataset.i,10);
  const st=torRabStore();
  return (i>=0 && st[i]) ? st[i] : null;
}
function torRabSet(el,key){
  const it=torRabItemAt(el); if(!it) return;
  it[key]=el.value;
}
function torRabOnVol(el){
  let v=String(el.value||'').replace(/[^0-9.,]/g,'');
  el.value=v;
  const it=torRabItemAt(el); if(!it) return;
  /* Ketikan dibiarkan apa adanya selagi mengetik (agar "2." atau "1,5" tidak
     terpotong); yang DISIMPAN hasil jsVolNum — persis perilaku HPS. */
  it.vol = (v==='' ? '' : String(jsVolNum(v)));
  torRabRecalc(el);
}
/* BUG LAMA: memakai `spkNum(el.value)` = Number(buang selain 0-9 . -).
   Begitu nilainya melewati ribuan, `rupiahInputText` menyisipkan TITIK sebagai
   pemisah ribuan ("Rp 1.850"); digit berikutnya membuat "1.8500" yang oleh
   Number() dibaca sebagai DESIMAL 1,85 -> angka menyusut jadi 1 digit.
   Sekarang memakai pasangan yang sama persis dengan tabel HPS (hpsOnHargaMat):
   `onRupiahInput` memformat sambil mengetik SEKALIGUS memulihkan posisi kursor,
   lalu `parseRupiah` membaca angkanya (koma = desimal, titik = ribuan). */
function torRabOnRp(el,key){
  onRupiahInput(el);
  const it=torRabItemAt(el); if(!it) return;
  it[key]=parseRupiah(el.value);
  torRabRecalc(el);
}
function torRabRecalc(el){
  const i=parseInt(el&&el.dataset&&el.dataset.i,10);
  const it=torRabStore()[i];
  const c=document.getElementById('tor-rab-jt-'+i);
  if(c && it) c.innerHTML=hpsRp(hpsItemTotal(it));
  torRabRenderSummary();
}
/* Ringkasan memakai hpsSummary apa adanya -> angka RAB dijamin sama persis
   dengan cara HPS menghitung, termasuk pembulatan tiap tahapnya. */
function torRabRenderSummary(){
  const box=document.getElementById('tor-rab-sum'); if(!box) return;
  const s=hpsSummary({items:torRabItems()});
  const row=(lbl,mat,jasa,tot,cls)=>'<tr'+(cls?' class="'+cls+'"':'')+'>'+
    '<td class="lbl">'+lbl+'</td><td class="val">'+hpsRp(mat)+'</td>'+
    '<td class="val">'+hpsRp(jasa)+'</td><td class="val">'+hpsRp(tot)+'</td></tr>';
  box.innerHTML='<table class="hps-sum"><thead><tr>'+
      '<td class="lbl">Uraian</td><td class="val">Barang</td>'+
      '<td class="val">Jasa</td><td class="val">Total</td></tr></thead><tbody>'+
      row('Jumlah', s.jM, s.jJ, s.jT)+
      row('DPP (11/12 \u00d7 Jumlah)', s.dppM, s.dppJ, s.dppT)+
      row('PPn 12% (12% \u00d7 DPP)', s.ppnM, s.ppnJ, s.ppnT)+
      row('Jumlah Total (Jumlah + PPn)', s.totM, s.totJ, s.totT, 'grand')+
    '</tbody></table>'+
    '<div class="hps-terbilang"><b>Terbilang :</b> '+fkEsc(hpsTerbilangRupiah(s.totT))+'</div>';
}
/* Total RAB — dipakai Pakta Integritas ("Perkiraan Pekerjaan") & BoQ */
function torRabTotal(){ try{ return hpsSummary({items:torRabItems()}).totT; }catch(e){ return 0; } }

/* ===== TEMPLATE PENGISIAN RAB (Excel) =====
   Pola & tampilannya SAMA dengan "Template Pengisian Analisa" di app.js
   (anaTemplateBarHtml / anaDownloadTemplate / anaHandleUpload), tetapi
   disalin-sesuaikan ke sini karena RAB berbeda bentuk:
     - TIDAK ada Referensi -> hanya SEPASANG kolom Harga Barang & Harga Jasa
     - kolom Judul / Sub-Judul hanya terbit bila sakelarnya "Ya"
     - banyaknya baris terikat field "Jumlah Barang/Jasa" (jumlah_bj), jadi
       mengunggah berkas dengan baris lebih banyak ikut MENAIKKAN angka itu.
   Berkasnya .xlsx (spreadsheet) — bukan .docx — karena isinya tabel harga,
   persis seperti template Analisa Harga Satuan pada gambar acuan. */
const TOR_RAB_MAX = 150;   /* pagar atas jumlah baris, setara ANA_MAX_ITEM */

/* Susunan kolom sheet "Data" — dipakai bersama oleh unduh & (sebagai acuan) unggah */
function torRabTplCols(){
  const cfg=torRabCfg();
  const cols=[{label:'No', w:6, kind:'no'}];
  if(cfg.judulOn)    cols.push({label:'Judul',     w:22, kind:'judul'});
  if(cfg.subjudulOn) cols.push({label:'Sub-Judul', w:22, kind:'subjudul'});
  cols.push({label:'Uraian Pekerjaan', w:44, kind:'uraian'});
  cols.push({label:'Sat',              w:10, kind:'sat'});
  cols.push({label:'Vol',              w:12, kind:'vol'});
  cols.push({label:'Harga Barang',     w:20, kind:'barang'});
  cols.push({label:'Harga Jasa',       w:20, kind:'jasa'});
  return cols;
}

function torRabTplBarHtml(){
  return '<div class="hl-tpl-bar" style="margin-top:4px">'+
    '<div class="hl-tpl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>'+
    '<div class="hl-tpl-txt"><b>Template Pengisian RAB</b><span>Unduh SATU file berisi <b>seluruh baris barang/jasa</b>, isi harganya, lalu unggah kembali.</span></div>'+
    '<div class="hl-tpl-actions">'+
      '<button type="button" class="btn btn-amber" onclick="torRabDownloadTemplate()">'+
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'+
        'Download Template</button>'+
      '<button type="button" class="btn btn-teal" onclick="document.getElementById(\'tor-rab-upload\').click()">'+
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'+
        'Upload Template</button>'+
    '</div>'+
    '<input type="file" id="tor-rab-upload" accept=".xlsx,.xls" style="display:none" onchange="torRabHandleUpload(event)">'+
  '</div>';
}

async function torRabDownloadTemplate(){
  if(typeof requireInput==='function' && !requireInput()) return;
  if(!window.ExcelJS){ toast('Library Excel belum termuat, coba lagi','warn'); return; }
  const d=(torState&&torState.data)||{};
  const namaPek=String(d.nama_pekerjaan||'').trim();
  const cols=torRabTplCols(), items=torRabItems(), n=items.length, NC=cols.length;

  const wb=new ExcelJS.Workbook();
  const wsD=wb.addWorksheet('Data');
  wsD.addRow(cols.map(c=>c.label));
  wsD.columns=cols.map(c=>({width:c.w||16}));

  const thin={style:'thin',color:{argb:'FFBFCAD0'}};
  const allBorder={top:thin,left:thin,bottom:thin,right:thin};

  const headRow=wsD.getRow(1); headRow.height=34;
  for(let c=1;c<=NC;c++){
    const cell=wsD.getCell(1,c);
    cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0E7C86'}};
    cell.font={bold:true,color:{argb:'FFFFFFFF'},size:10.5};
    cell.alignment={wrapText:true,vertical:'middle',horizontal:'center'};
    cell.border=allBorder;
  }
  for(let i=0;i<n;i++){
    const it=items[i]||{};
    const row=wsD.getRow(i+2);
    cols.forEach((c,ci)=>{
      const cell=row.getCell(ci+1);
      if(c.kind==='no') cell.value=i+1;
      else if(c.kind==='judul')    cell.value=it.judul||'';
      else if(c.kind==='subjudul') cell.value=it.subjudul||'';
      else if(c.kind==='uraian')   cell.value=it.uraian||'';
      else if(c.kind==='sat')      cell.value=it.sat||'';
      else if(c.kind==='vol')      cell.value=(it.vol!==''&&it.vol!=null)?jsVolNum(it.vol):'';
      else if(c.kind==='barang'){  const v=hpsNum(it.hargaMat);  cell.value=v>0?v:''; }
      else if(c.kind==='jasa'){    const v=hpsNum(it.hargaJasa); cell.value=v>0?v:''; }
    });
  }
  for(let rr=2;rr<=n+1;rr++){
    for(let c=1;c<=NC;c++){
      const cell=wsD.getCell(rr,c);
      cell.border=allBorder;
      const kind=cols[c-1].kind;
      if(kind==='no'||kind==='sat') cell.alignment={vertical:'middle',horizontal:'center'};
      else if(kind==='vol'){ cell.numFmt=ACCT_VOL; cell.alignment={vertical:'middle',horizontal:'center'}; }
      else if(kind==='barang'||kind==='jasa'){ cell.numFmt=ACCT_NODEC; cell.alignment={vertical:'middle',horizontal:'right'}; }
      else cell.alignment={vertical:'middle'};
      if(rr%2===1) cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF2F7F8'}};
    }
  }
  /* Bekukan baris judul + kolom struktur, supaya Uraian tetap terlihat saat
     menggeser ke kolom harga. */
  const cfg=torRabCfg();
  wsD.views=[{state:'frozen', xSplit:2+(cfg.judulOn?1:0)+(cfg.subjudulOn?1:0), ySplit:1}];

  const wsG=wb.addWorksheet('Petunjuk');
  wsG.columns=[{width:30},{width:90}];
  const petunjuk=[['PETUNJUK PENGISIAN RAB',''],['',''],
   ['Pekerjaan', namaPek||'\u2014'],
   ['Jumlah Barang/Jasa', String(n)+'  (mengikuti isian di langkah Data Pekerjaan)'],
   ['',''],
   ['No','Nomor urut baris. Jangan diubah \u2014 dipakai untuk mencocokkan baris.'],
   ...(cfg.judulOn?[['Judul','Judul kelompok pekerjaan. SELALU dicetak huruf besar semua pada dokumen. Kosongkan bila melanjutkan judul di atasnya.']]:[]),
   ...(cfg.subjudulOn?[['Sub-Judul','Sub-judul di bawah judul. Dicetak sesuai huruf besar/kecil yang diketik. Kosongkan bila melanjutkan sub-judul di atasnya.']]:[]),
   ['Uraian Pekerjaan','Nama barang/jasa/pekerjaan.'],
   ['Sat','Satuan (mis. Buah, Pack, m, unit).'],
   ['Vol','Volume. Ketik angka saja (mis. 10 atau 2.5).'],
   ['Harga Barang','Harga satuan barang/material. Ketik angka saja (mis. 150000).'],
   ['Harga Jasa','Harga satuan jasa. Ketik angka saja. Kosongkan bila tidak ada.'],
   ['',''],
   ['Perhitungan','Jumlah tiap baris = Vol \u00d7 (Harga Barang + Harga Jasa); ringkasannya memakai rumus HPS (DPP 11/12, PPn 12%).'],
   ['Catatan','Isi data mulai baris ke-2. Nilai 0/kosong diabaikan saat perhitungan.'],
   ['','Menambah baris di bawah baris terakhir otomatis MENAIKKAN Jumlah Barang/Jasa (maksimum '+TOR_RAB_MAX+' baris).'],
   ['','Jangan menghapus kolom No.']
  ];
  petunjuk.forEach(row=>wsG.addRow(row));
  wsG.getCell('A1').font={bold:true,size:14,color:{argb:'FF0E7C86'}};
  for(let rr=3;rr<=petunjuk.length;rr++){
    const a=wsG.getCell('A'+rr);
    if(String(a.value||'').trim()!=='') a.font={bold:true,color:{argb:'FF095E66'}};
    a.alignment={vertical:'top'};
    wsG.getCell('B'+rr).alignment={vertical:'top',wrapText:true};
  }

  try{
    const buf=await wb.xlsx.writeBuffer();
    const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob);
    const clean=x=>String(x||'').replace(/[\\/:*?"<>|]+/g,'_').replace(/\s+/g,'_').slice(0,40);
    const a=document.createElement('a');
    a.href=url; a.download='Template_RAB_'+(clean(namaPek)||'Pekerjaan')+'.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast('Template RAB diunduh \u2014 '+n+' baris barang/jasa','ok');
  }catch(err){ console.error(err); toast('Gagal membuat template: '+(typeof errMsg==='function'?errMsg(err):err),'warn'); }
}

function torRabHandleUpload(ev){
  if(typeof requireInput==='function' && !requireInput()){ ev.target.value=''; return; }
  if(!window.XLSX){ toast('Library Excel belum termuat, coba lagi','warn'); ev.target.value=''; return; }
  const file=ev.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      if(!torState) torState=torBlankState();
      const d=torState.data;
      const cfg=torRabCfg();
      const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});
      const sheetName=wb.SheetNames.includes('Data')?'Data':wb.SheetNames[0];
      const rows=XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{header:1,defval:''});
      if(rows.length<2){ toast('File kosong / tidak ada data','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      const head=rows[0].map(h=>String(h==null?'':h).trim().toLowerCase());

      let cNo=-1,cJud=-1,cSub=-1,cUr=-1,cSat=-1,cVol=-1,cMat=-1,cJasa=-1;
      head.forEach((h,ci)=>{
        if(h==='') return;
        if(cMat <0 && h.indexOf('harga')>=0 && (h.indexOf('barang')>=0||h.indexOf('material')>=0)){ cMat=ci; return; }
        if(cJasa<0 && h.indexOf('harga')>=0 && h.indexOf('jasa')>=0){ cJasa=ci; return; }
        if(cNo  <0 && h==='no'){ cNo=ci; return; }
        if(cSub <0 && (h.indexOf('sub-judul')>=0||h.indexOf('sub judul')>=0||h.indexOf('subjudul')>=0)){ cSub=ci; return; }
        if(cJud <0 && (h.indexOf('judul')>=0||h.indexOf('kelompok')>=0)){ cJud=ci; return; }
        if(cUr  <0 && h.indexOf('uraian')>=0){ cUr=ci; return; }
        if(cVol <0 && (h==='vol'||h.indexOf('volume')>=0)){ cVol=ci; return; }
        if(cSat <0 && (h==='sat'||h==='sat.'||h.indexOf('satuan')>=0)){ cSat=ci; return; }
      });
      /* Sakelar Judul/Sub-Judul "Tidak" -> kolomnya DIABAIKAN walau berkasnya
         masih memuatnya (mis. template lama). Tanpa penjagaan ini nilainya
         diam-diam masuk & muncul lagi begitu sakelarnya dinyalakan. */
      if(!cfg.judulOn)    cJud=-1;
      if(!cfg.subjudulOn) cSub=-1;
      if(cJud<0&&cSub<0&&cUr<0&&cMat<0&&cJasa<0){ toast('Header tidak dikenali. Gunakan template resmi.','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }

      const dataCols=[cJud,cSub,cUr,cSat,cVol,cMat,cJasa].filter(x=>x>=0);
      const dataRows=[];
      for(let rIdx=1;rIdx<rows.length;rIdx++){
        const row=rows[rIdx]; if(!row) continue;
        const kosong=dataCols.every(ci=> String(row[ci]==null?'':row[ci]).trim()==='');
        if(kosong) continue;
        let idx;
        if(cNo>=0){ const num=parseInt(String(row[cNo]==null?'':row[cNo]).replace(/[^\d]/g,''),10); idx=(num>=1)?(num-1):dataRows.length; }
        else idx=dataRows.length;
        dataRows.push({idx,row});
      }
      if(!dataRows.length){ toast('Tidak ada baris data untuk diimpor','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }

      /* Baris melebihi grid -> NAIKKAN "Jumlah Barang/Jasa" (bukan dibuang). */
      let maxIdx=0; dataRows.forEach(x=>{ if(x.idx>maxIdx) maxIdx=x.idx; });
      const perlu=Math.min(TOR_RAB_MAX, Math.max(cfg.jml, maxIdx+1));
      let ditambah=0;
      if(perlu!==cfg.jml){ ditambah=perlu-cfg.jml; d.jumlah_bj=String(perlu); }

      const store=torRabStore();
      while(store.length<perlu) store.push(torRabBlankItem());

      let terisi=0, dilewati=0;
      dataRows.forEach(x=>{
        if(x.idx<0 || x.idx>=perlu){ dilewati++; return; }
        const it=store[x.idx]; if(!it){ dilewati++; return; }
        const teks=ci=>String(x.row[ci]==null?'':x.row[ci]).trim();
        if(cJud >=0) it.judul   =teks(cJud);
        if(cSub >=0) it.subjudul=teks(cSub);
        if(cUr  >=0) it.uraian  =teks(cUr);
        if(cSat >=0) it.sat     =teks(cSat);
        if(cVol >=0){ const raw=x.row[cVol]; it.vol=(teks(cVol)===''?'':String(jsVolNum(raw))); }
        if(cMat >=0){ const raw=x.row[cMat];  it.hargaMat =(teks(cMat) ===''?'':parseRupiah(raw)); }
        if(cJasa>=0){ const raw=x.row[cJasa]; it.hargaJasa=(teks(cJasa)===''?'':parseRupiah(raw)); }
        terisi++;
      });

      renderTorSusun();
      let msg=terisi+' baris RAB diperbarui';
      if(ditambah>0) msg+=' \u2014 Jumlah Barang/Jasa dinaikkan jadi '+perlu;
      if(dilewati>0) msg+=' \u2014 '+dilewati+' baris dilewati (di luar jangkauan, maks '+TOR_RAB_MAX+')';
      toast(msg,'ok');
    }catch(err){ console.error(err); toast('Gagal membaca file Excel','warn', TOAST_MS_UPLOAD); }
    ev.target.value='';
  };
  reader.readAsArrayBuffer(file);
}

/* ===== LANGKAH 3 — PILIH KLAUSUL =====
   Menentukan klausul MANA dari pustaka yang ikut tercetak, lewat penanda
   `aktif` pada tiap klausul (torKlausulDok() sudah menyaring aktif!==false).
   Penomoran babnya memakai torStruktur atas klausul YANG AKTIF SAJA, sehingga
   nomor di layar ini sama persis dengan yang akan tercetak — mematikan sebuah
   klausul otomatis merapatkan nomor sesudahnya. */
function torPilihKlausulHtml(){
  const lib=(records_klausul||[]).filter(k=>k && !k.sys);
  const aktif=lib.filter(k=>k.aktif!==false);
  const str=torStruktur(aktif);
  const noOf={}; aktif.forEach((k,i)=>{ noOf[String(k.id)]=str[i]; });
  const baris=lib.map(k=>{
    const on=(k.aktif!==false), s=noOf[String(k.id)];
    return '<label class="tor-pk-row'+(on?' on':'')+'">'+
      '<input type="checkbox" '+(on?'checked':'')+' onchange="torKlausulAktif(\''+fkEsc(String(k.id))+'\',this.checked)">'+
      '<span class="no">'+(on&&s?fkEsc(s.no):'\u2013')+'</span>'+
      '<span class="jd">'+fkEsc(torJudulPolos(k.judul)||'(tanpa judul)')+'</span>'+
    '</label>';
  }).join('');
  /* Bentuk kartunya disamakan dengan Langkah 3 Penyusunan Kontrak:
     judul "Klausul Terpilih (N dari M)" + tombol Pilih Semua / Kosongkan. */
  return '<div class="form-card">'+
    '<div class="form-section-title" style="justify-content:space-between">'+
      '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg> '+
        'Klausul Terpilih ('+aktif.length+' dari '+lib.length+')</span>'+
      '<span class="spk-kl-tools">'+
        '<button type="button" class="btn btn-ghost btn-sm" onclick="torKlausulAktifSemua(true)">Pilih Semua</button>'+
        '<button type="button" class="btn btn-ghost btn-sm" onclick="torKlausulAktifSemua(false)">Kosongkan</button>'+
      '</span></div>'+
    '<div class="hps-hint">Hanya klausul yang tercentang yang ikut tercetak. '+
      'Nomornya sudah memakai penomoran bab yang sebenarnya, jadi angka di sini sama dengan hasil cetak. '+
      'Untuk menyunting isinya, kembali ke <b>Ubah Klausul</b>.</div>'+
    '<div class="tor-pk-list">'+(baris||'<div class="hps-hint">Pustaka klausul masih kosong.</div>')+'</div>'+
  '</div>';
}
function torKlausulAktif(id,on){
  if(typeof requireInput==='function' && !requireInput()) return;
  const k=(records_klausul||[]).find(x=>x && String(x.id)===String(id));
  if(!k) return;
  k.aktif=!!on;
  try{ spkKlSync(); }catch(e){}
  renderTorSusun();
}
function torKlausulAktifSemua(on){
  if(typeof requireInput==='function' && !requireInput()) return;
  (records_klausul||[]).forEach(k=>{ if(k && !k.sys) k.aktif=!!on; });
  try{ spkKlSync(); }catch(e){}
  renderTorSusun();
}

/* ---- Jembatan ke mesin Pustaka Klausul milik Susun Kontrak ----
   renderSpkKlausul() & seluruh fungsi spkKlausul* bekerja pada `records_klausul`
   dan menyalin hasilnya ke `spkState.data.__klausulLib` lewat spkKlSync().
   Dengan mengarahkan spkState ke torState, seluruh mesin itu (termasuk unduh /
   unggah template Word dan editor WYSIWYG) langsung bekerja untuk dokumen TOR
   TANPA menduplikasi kodenya. */
function torBridgeKlausul(){
  if(!torState) return;
  try{
    spkState = torState;
    if(!Array.isArray(torState.data.__klausulLib) || !torState.data.__klausulLib.length)
      torState.data.__klausulLib = torKlausulDefault();
    records_klausul = torState.data.__klausulLib;
    /* torSelectAll() TIDAK dipanggil lagi: pilihan klausul kini ditentukan
       pengguna di langkah 3. Yang belum pernah dipilih dianggap aktif. */
    (records_klausul||[]).forEach(k=>{ if(k && k.aktif===undefined) k.aktif=true; });
  }catch(e){ console.error('torBridgeKlausul:', e); }
}
/* Cuplikan isi klausul pada kartu pustaka.
   renderSpkKlausul() (milik Susun Kontrak) membuatnya dengan
   `isi.replace(/<[^>]+>/g,' ')` lalu fkEsc() — pembuang TAG, bukan pembaca HTML.
   Akibatnya ENTITAS (&nbsp; &amp; &quot; …) lolos apa adanya, lalu fkEsc()
   meng-escape tanda & di depannya sehingga di layar terbaca mentah
   "&nbsp;&nbsp;… Lingkup pekerjaan pada pengadaan ini …".
   Di sini cuplikan itu DIHITUNG ULANG memakai parser HTML browser sehingga
   entitas terbaca sebagai karakter aslinya (nbsp -> spasi biasa). Perbaikan
   ditempel dari sisi TOR saja lewat torRelabelKlausul(), jadi susun-kontrak.js
   TIDAK disentuh sama sekali. */
const TOR_PREV_MAX = 150;
function torPrevText(html){
  const mentah = String(html||'');
  try{
    const d=document.createElement('div');
    /* textContent merapatkan blok yang bersebelahan ("<p>Satu</p><p>Dua</p>"
       -> "SatuDua"), jadi batas antar-blok & <br> diberi spasi lebih dulu. */
    d.innerHTML=mentah
      .replace(/<br\s*\/?>/gi,' ')
      .replace(/<\/(p|div|li|tr|td|th|h[1-6]|blockquote|section|table)\s*>/gi,'$& ');
    return String(d.textContent||'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
  }catch(e){
    return mentah.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  }
}
function torPrevFix(row, rec){
  const pv=row && row.querySelector('.spk-klx-prev'); if(!pv) return;
  const t=torPrevText(rec && rec.isi);
  /* textContent: tak perlu escape manual & mustahil menyuntik markup. */
  pv.textContent = t.slice(0,TOR_PREV_MAX) + (t.length>TOR_PREV_MAX?'\u2026':'');
}
/* Setelah renderSpkKlausul(): sesuaikan istilah "SPK" -> "TOR/KAK" pada kartu,
   LALU tulis ulang lencana nomor mengikuti penomoran template Word (I.1, I.2,
   … II.1, … III) dan sisipkan sekat bab di atas klausul pertama tiap bab.
   Lencana nomor sekaligus menjadi tombol: mengkliknya memindahkan klausul itu
   ke bab berikutnya (lihat torBabPindah). */
function torRelabelKlausul(){
  try{
    /* PENJAGA MUTLAK: hanya bekerja bila wadah pustaka klausul memang bersarang
       di dalam halaman Penyusunan TOR/KAK. Pada halaman "Ubah Klausul Kontrak"
       milik Susun Kontrak, #spk-klausul-content berada di luar #tor-susun-content
       sehingga querySelector di bawah mengembalikan null dan fungsi ini langsung
       berhenti — mustahil menyentuh Pustaka Klausul SPK/PK walau spkState kebetulan
       masih mengarah ke dokumen TOR. */
    const cont=document.querySelector('#tor-susun-content #spk-klausul-content'); if(!cont) return;
    const t=cont.querySelector('.form-section-title > span');
    if(t) t.innerHTML=t.innerHTML.replace('Pustaka Klausul SPK','Pustaka Klausul TOR/KAK');
    const h=cont.querySelector('.hps-hint');
    if(h) h.innerHTML='Pustaka klausul ini <b>milik dokumen TOR/KAK yang sedang disusun</b>. '+
      'Klausul <b>mana</b> yang ikut tercetak ditentukan di langkah <b>Pilih Klausul</b>. '+
      'Penomorannya mengikuti template Word: <b>I.1, I.2 …</b> untuk bab <b>I. Pendahuluan</b> dan '+
      '<b>II.1, II.2 …</b> untuk bab <b>II. Petunjuk Teknis</b>; bab terakhir '+
      '(<b>III. Penutup</b>) tetap tanpa nomor sub seperti pada lampiran TOR. '+
      '<b>Klik lencana nomor</b> untuk memindahkan sebuah klausul ke bab berikutnya.';

    /* Daftar yang dirender renderSpkKlausul() = klausul non-sistem (dokumen TOR
       berbentuk SPK, jadi entri sistem "Uraian Peraturan" tidak ditampilkan),
       urutannya sama dengan urutan pustaka -> aman dipasangkan per indeks. */
    const list=(records_klausul||[]).filter(k=>k && !k.sys);
    const str=torStruktur(list);
    const rows=cont.querySelectorAll('.spk-klx-list > .spk-klx');
    for(let i=0;i<rows.length && i<str.length;i++){
      const s=str[i], row=rows[i];
      torPrevFix(row, list[i]);
      const no=row.querySelector('.spk-klx-no'); if(!no) continue;
      no.textContent=s.no;
      no.classList.add('tor-no');
      no.setAttribute('role','button');
      no.setAttribute('title', s.rom+'. '+s.babNama+' — klik untuk memindahkan klausul ini ke bab berikutnya');
      no.onclick=(function(kid){ return function(){ torBabPindah(kid); }; })(String(list[i].id));
      /* Sekat bab: satu baris judul bab di atas klausul pertama tiap bab. */
      const sdh=row.previousElementSibling;
      if(s.awal && row.parentNode && !(sdh && sdh.classList && sdh.classList.contains('tor-babsep'))){
        const sep=document.createElement('div');
        sep.className='tor-babsep';
        sep.innerHTML='<span>'+fkEsc(s.rom+'. '+s.babNama)+'</span>';
        row.parentNode.insertBefore(sep, row);
      }
    }
  }catch(e){ console.error('torRelabelKlausul:', e); }
}

/* ===================== 9. SIMPAN ===================== */
async function torSaveDokumen(){
  if(typeof requireInput==='function' && !requireInput()) return;
  if(!torState){ toast('Data belum diisi','warn'); return; }
  const d=torState.data;
  const nama=String(d.nama_pekerjaan||'').trim();
  if(!nama){ toast('Nama Pekerjaan wajib diisi','warn'); return; }
  /* Kode klasifikasi ikut membentuk nomor dokumen, jadi tidak boleh kosong. */
  if(!String(d.kode_klasifikasi||'').trim()){ toast('Kode Klasifikasi wajib dipilih','warn'); return; }
  torMultiTrimAll(d);          /* buang baris berlapis yang dibiarkan kosong */
  torSyncNomor();
  const klausul=torKlausulDok();
  if(!klausul.length){ toast('Dokumen harus memiliki minimal satu klausul','warn'); return; }
  const rec={
    no_dokumen: d.no_dokumen||'',
    no_urut: parseInt(d.no_urut,10)||0,
    tahun: parseInt(d.tahun_dokumen,10)||torYearNow(),
    kode_klasifikasi: d.kode_klasifikasi||'',
    nama_pekerjaan: nama,
    bidang_pelaksana: d.pelaksana||'',
    tanggal: d.tgl_dokumen||null,
    nilai: spkNum(d.nilai_pekerjaan),
    data: d,
    klausul: klausul
  };
  try{
    await withActionLoader('Menyimpan', async()=>{
      if(torEditId) await StoreTor.update(torEditId, rec);
      else { const row=await StoreTor.create(rec); if(row) torEditId=row.id; }
      await refreshDataTor();
    });
  }catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'err'); return; }
  /* Pesan BAKU keberhasilan menyimpan — pasangan dari toast('Proses
     dibatalkan','err') pada torBatalClick, dan sama dengan seluruh modul lain
     (ketentuan 6 Agu 2026). */
  toast('Proses berhasil disimpan','ok');
  torEditId=null; torState=torBlankState();
  torViewPage=1; showView('tor-view');
}

/* ===================== 10. DOKUMEN (cover + daftar isi + isi) ===================== */
/* CSS tambahan KHUSUS cover TOR — nomor dokumen di bawah judul TOR/KAK.
   Parameter wKl / wBab = lebar kotak nomor (cm) untuk judul klausul dan judul
   bab, dihitung di torDocHtml dari label TERPANJANG dokumen ini. */
function torDocCss(wKl, wBab){
  const WK=(wKl>0?wKl:0.65), WB=(wBab>0?wBab:0.55);
  const GAP=(typeof SPK_NUM_GAP!=='undefined') ? SPK_NUM_GAP : 0.18;
  /* Langkah inden tingkat 1 -> tingkat 2 = LEBAR KOTAK NOMOR BAB.
     Kotak nomor bab (.tor-babh .n) selebar WB dengan box-sizing:border-box,
     jadi teks "PENDAHULUAN" tepat mulai di WB. Dengan menggeser judul klausul
     sejauh WB, penanda "I.1." berdiri persis di bawah teks bab induknya —
     bukan di bawah penanda "I."-nya. Itulah pola inden bertingkat Word:
     penomoran tingkat 2 sejajar dengan TEKS tingkat 1, bukan dengan nomornya. */
  const LV2=WB;
  /* Lebar kisi blok pengesahan tanda tangan (lihat torTtdCols). */
  const _ttdW=torTtdCols();
  return ''+
  /* ================= PENOMORAN MENGIKUTI TEMPLATE WORD =================
     Bawaan mesin SPK menomori judul klausul lewat penghitung CSS
     (counter(spkcl) -> "1." "2." "3."). Dokumen TOR/KAK memakai penomoran
     berbab (I.1, I.2 … II.1 …) yang tidak bisa dihasilkan satu penghitung,
     jadi labelnya ditulis langsung ke atribut data-no pada <span class="n">
     dan dicetak lewat content:attr(). Keuntungan tambahan: saat paginator
     memindah judul klausul ke lembar berikutnya, labelnya ikut pindah apa
     adanya — tidak ada risiko penghitung meloncat. Aturan ini menang atas
     spkDocCss/spkClHeadCss karena kekhususannya lebih tinggi DAN dipasang
     paling akhir di <style> dokumen. Susun Kontrak tidak tersentuh. */
  '.spk-doc.spk-spk .spk-cl-h .n::before{content:attr(data-no)}'+
  /* ---- Inden bertingkat tingkat 1 -> tingkat 2 ----
     Judul bab ("I. PENDAHULUAN") mulai di batas margin; judul klausul
     ("I.1. OVERVIEW PEKERJAAN") digeser ke kanan sejauh kotak nomor bab,
     sehingga penanda "I.1." mulai tepat di bawah kata "PENDAHULUAN". Nilainya
     diturunkan dari WB, jadi ikut menyesuaikan bila label bab melebar
     ("VIII."). Judul bab dikecualikan lewat :not(.tor-babh). */
  '.spk-doc.spk-spk .spk-cl-h:not(.tor-babh){margin-left:'+LV2.toFixed(2)+'cm}'+
  /* ISI klausul ikut bergeser sejauh yang sama. Kalau hanya judulnya yang
     digeser, butir tingkat 3 & 4 di dalamnya tetap menempel di batas margin
     dan tampak terlepas dari judul induknya. Yang digeser BLOKNYA, bukan tiap
     tingkat sendiri-sendiri — jenjang 3 -> 4 di dalam blok sudah diatur
     spkPkIndentStd dan tidak boleh diutak-atik ulang, cukup ikut bergeser.

     BAB YANG JUDUL KLAUSULNYA DILEBUR (III. PENUTUP) ikut digeser sejauh yang
     sama lewat kelas .tor-babisi (6 Agu 2026). Dulu bab lebur sengaja
     dibiarkan rata dengan kotak nomor bab, sehingga kata "Demikian" berdiri
     tepat di bawah "III." dan terlihat terlepas dari judulnya. Sekarang ia
     mulai di bawah kata "PENUTUP" — aturan inden yang sama dengan klausul
     tingkat 2, sebab jaraknya memang sama-sama selebar kotak nomor bab (WB). */
  '.spk-doc.spk-spk .spk-clause.tor-lv2 > .spk-cl,'+
    '.spk-doc.spk-spk .spk-clause.tor-babisi > .spk-cl{margin-left:'+LV2.toFixed(2)+'cm}'+
  '.spk-doc.spk-spk .spk-cl-h{padding-left:'+WK.toFixed(2)+'cm;text-indent:-'+WK.toFixed(2)+'cm}'+
  '.spk-doc.spk-spk .spk-cl-h .n{min-width:'+WK.toFixed(2)+'cm;width:auto;text-align:left;'+
    'padding-right:'+GAP+'cm;box-sizing:border-box}'+
  /* ---- Judul bab (gaya "Judul 1" Word): "I. PENDAHULUAN" ----
     Ditulis TANPA kata "BAB", kotak nomornya lebih sempit (cukup untuk "III.")
     dan jarak atasnya 18pt = w:spacing before 360 twip pada template. */
  '.spk-doc.spk-spk .spk-cl-h.tor-babh{padding-left:'+WB.toFixed(2)+'cm;text-indent:-'+WB.toFixed(2)+'cm;'+
    'margin:18pt 0 4pt}'+
  '.spk-doc.spk-spk .spk-cl-h.tor-babh .n{min-width:'+WB.toFixed(2)+'cm;text-align:left;padding-right:'+GAP+'cm}'+
  /* Cangkang bab yang hanya berisi judul (bab I & II): tanpa jarak bawah, dan
     judul klausul pertama di bawahnya cukup diberi jarak kecil. */
  '.spk-doc.spk-spk .spk-clause.tor-babonly{margin-bottom:0}'+
  '.spk-doc.spk-spk .spk-clause.tor-babonly + .spk-clause > .spk-cl-h{margin-top:6pt}'+
  /* ================================================================
     SAMPUL & DAFTAR ISI TOR/KAK — rancangan "GARIS TEGAK"
     ----------------------------------------------------------------
     Kedua lembar TIDAK lagi memakai kelas .spk-cover / .spk-tocpage,
     sehingga seluruh gaya sampul Surat Perintah Kerja (cv-*) tidak lagi
     ikut terpasang dan tidak perlu ditimpa satu per satu. Yang masih
     dipertahankan HANYALAH pembungkus .spk-toc2 beserta anak
     .row/.no/.nm/.dot/.pg — nomorToc() di spkPageScript() mengisi nomor
     halaman lewat querySelectorAll(".spk-toc2 .pg"), jadi struktur itu
     wajib utuh. Susun Kontrak tidak tersentuh sama sekali.

     Ukuran memakai satuan pt (mengikuti berkas rancangan): tepi 56,7pt
     = 2 cm, batang tegak 24pt, jadi tepi kiri isi 80,7pt supaya jarak
     teks ke batang tetap 2 cm. */
  '.spk-page.tor-lembar{padding:0;position:relative;overflow:hidden;color:#14346B;'+
    'font-family:"Plus Jakarta Sans","Segoe UI",Arial,sans-serif;'+
    '-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  /* Batang tegak di tepi kiri kertas; ujung atasnya kuning setinggi 132pt. */
  '.tor-lembar .tor-bat{position:absolute;left:0;top:0;bottom:0;width:24pt;background:#14346B;'+
    '-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  '.tor-lembar .tor-bat::before{content:"";position:absolute;left:0;right:0;top:0;height:132pt;'+
    'background:#F6B21B;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  /* Bidang isi dipatok ke keempat tepi lembar (bukan height:100%) supaya
     margin-top:auto pada kaki halaman tetap mendorong kaki ke dasar kertas,
     apa pun model kotak yang berlaku di lembar induk. */
  '.tor-lembar .tor-isi{position:absolute;left:0;top:0;right:0;bottom:0;'+
    'display:flex;flex-direction:column;padding:56.7pt 56.7pt 56.7pt 80.7pt}'+

  /* ---------------------------------------------------- SAMPUL --------- */
  '.tor-cv .tor-kop{display:flex;align-items:center;gap:11pt}'+
  '.tor-cv .tor-kop img{height:40pt;width:auto;display:block}'+
  '.tor-cv .tor-kop-nm{font-size:10pt;font-weight:700;letter-spacing:.02em;line-height:1.15}'+
  /* Jarak 3,5pt memisahkan dua baris kop tanpa menambah tinggi baris kop:
     tinggi tumpukan teks ~24pt, masih di bawah tinggi logo (40pt). */
  '.tor-cv .tor-kop-sub{font-size:7.6pt;font-weight:500;letter-spacing:.16em;color:#7A8698;'+
    'margin-top:3.5pt;text-transform:uppercase}'+
  '.tor-cv .tor-kop-sp{flex:1}'+
  '.tor-cv .tor-th{display:flex;align-items:baseline;gap:6pt;border-radius:999pt;padding:5pt 13pt;'+
    'background:#14346B;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  '.tor-cv .tor-th span{font-size:7pt;font-weight:600;letter-spacing:.18em;opacity:.75}'+
  '.tor-cv .tor-th b{font-size:11pt;font-weight:700;letter-spacing:.02em}'+
  /* Garis pemisah di bawah kop DAN garis di atas kaki halaman sengaja ditulis
     sebagai SATU aturan: keduanya harus terlihat seragam, dan menyatukannya
     membuat perubahan berikutnya mustahil menyimpang di salah satu sisi. */
  '.tor-cv .tor-kop-g,.tor-cv .tor-kaki-g{height:.75pt;background:#E3E8F1;'+
    '-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  /* Jaraknya mencerminkan kaki halaman: di sana 16pt sebelum garis lalu 12pt
     sesudahnya. Di kop angkanya sedikit lebih longgar (15 / 26) karena yang
     mengikuti garis adalah blok judul, bukan satu baris teks. */
  '.tor-cv .tor-kop-g{margin-top:15pt}'+
  /* Rancangan ini TIDAK memakai garis kuning pendek di bawah judul — garis itu
     sudah diwakili ujung atas batang tegak, jadi nomor dokumen langsung
     menempel di bawah judul. */
  '.tor-cv .tor-judul{margin-top:26pt}'+
  '.tor-cv .tor-kelopak{font-size:8pt;font-weight:600;letter-spacing:.22em;color:#2F5698;margin-bottom:10pt}'+
  '.tor-cv h1.tor-tt{margin:0;font-size:29pt;font-weight:700;line-height:1.16;'+
    'letter-spacing:-.02em;color:#14346B}'+
  '.tor-cv h1.tor-tt i{font-style:italic}'+
  /* Nomor dokumen dibuat LENCANA berlatar kuning (warna yang sama dengan ujung
     batang tegak) supaya menjadi titik henti mata antara judul dan kotak
     keterangan. display:inline-block WAJIB — sebagai blok, latar kuningnya akan
     memanjang selebar kertas. Jaraknya ke kotak PEKERJAAN diatur di .tor-set. */
  '.tor-cv .tor-no{display:inline-block;margin-top:22pt;padding:5.5pt 12pt;border-radius:4pt;'+
    'background:#F6B21B;color:#14346B;font-size:10.5pt;font-weight:700;letter-spacing:.04em;'+
    'font-variant-numeric:tabular-nums;'+
    '-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  /* Kotak keterangan: garis tipis mengelilingi, garis atas tebal navy. */
  '.tor-cv .tor-set{margin-top:28pt;display:flex;flex-direction:column;gap:10pt}'+
  /* Garis atas 1,5pt = tepat DUA KALI garis pembatas lainnya (0,75pt) — cukup
     untuk menandai kepala kotak tanpa jadi balok. Nilai lama 2,5pt (3,3x)
     terbaca terlalu berat, apalagi warnanya navy pekat sedangkan tiga sisi
     lainnya abu muda. Angka ini juga sama dengan garis judul bab di Daftar
     Isi, jadi kedua halaman memakai satu bahasa garis. */
  '.tor-cv .ko{border:.75pt solid #E3E8F1;border-top:1.5pt solid #14346B;padding:9pt 13pt 10pt}'+
  '.tor-cv .ko-lb{font-size:7.2pt;font-weight:600;letter-spacing:.2em;color:#2F5698;margin-bottom:5pt}'+
  '.tor-cv .ko-isi{font-size:11.5pt;font-weight:700;line-height:1.42;color:#14346B}'+
  '.tor-cv .ko-isi.kosong{color:#C2C6CC;font-weight:600}'+
  '.tor-cv .tor-kisi{margin-top:10pt;display:grid;grid-template-columns:1fr 1fr;gap:10pt}'+
  '.tor-cv .ko.kecil .ko-isi{font-size:10pt}'+
  '.tor-cv .ko.lebar{grid-column:1 / -1}'+
  /* Terbilang sengaja MIRING & berbobot normal, bukan tebal seperti nilai di
     atasnya: ia pengulangan angka dalam bentuk kata, jadi tidak perlu bersaing
     perhatian. Berat 400 juga menghindari miring-tebal hasil sintesis. */
  '.tor-cv .ko.tor-terb .ko-isi{font-style:italic;font-weight:400;font-size:10pt}'+
  /* margin-top:auto mendorong kaki ke dasar kertas berapa pun panjang isinya. */
  '.tor-cv .tor-kaki{margin-top:auto;padding-top:16pt}'+
  '.tor-cv .tor-unit{margin-top:12pt;font-size:9.4pt;font-weight:700;line-height:1.45;'+
    'letter-spacing:.05em;text-transform:uppercase}'+
  /* Alamat kantor: keterangan, bukan judul — bobot normal & warna abu. */
  '.tor-cv .tor-alamat{margin-top:5pt;font-size:8pt;font-weight:400;line-height:1.55;'+
    'color:#7A8698;letter-spacing:.01em}'+
  '.tor-cv .tor-alamat b{font-weight:600;color:#2F5698}'+

  /* ------------------------------------------------ DAFTAR ISI --------- */
  '.tor-di .di-kop{display:flex;justify-content:space-between;align-items:baseline;gap:14pt;'+
    'font-size:7.4pt;font-weight:600;letter-spacing:.18em;color:#7A8698}'+
  '.tor-di .di-judul{margin:26pt 0 0;font-size:26pt;font-weight:700;letter-spacing:-.02em;color:#14346B}'+
  '.tor-di .di-rule{height:3pt;width:56pt;background:#F6B21B;border-radius:2pt;margin-top:11pt;'+
    '-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  /* Baris daftar isi. Seluruh gaya bawaan .spk-toc2 (garis pemisah tiap baris,
     kolom nomor 44px, titik-titik border-dotted) DINETRALKAN di sini. */
  '.tor-di .spk-toc2.tor-toc{margin-top:26pt}'+
  '.tor-di .spk-toc2.tor-toc .row{display:flex;align-items:baseline;border:0;margin:0;'+
    'padding:4.8pt 0 4.8pt 24pt;font-size:11pt;line-height:1.35;font-weight:400;color:#33415C}'+
  '.tor-di .spk-toc2.tor-toc .row:first-child,.tor-di .spk-toc2.tor-toc .row:last-child{border:0}'+
  /* Ukuran huruf anak baris dibuat mewarisi .row supaya pengaturan kerapatan
     (d1/d2/d3) cukup mengubah SATU nilai, tidak empat. */
  '.tor-di .spk-toc2.tor-toc .row .no,.tor-di .spk-toc2.tor-toc .row .nm,'+
    '.tor-di .spk-toc2.tor-toc .row .dot,.tor-di .spk-toc2.tor-toc .row .pg{font-size:inherit}'+
  '.tor-di .spk-toc2.tor-toc .row .no{flex:0 0 auto;width:40pt;font-weight:400;color:#33415C;'+
    'font-variant-numeric:tabular-nums}'+
  /* flex:0 0 auto WAJIB. Dengan flex-shrink aktif, span titik (yang isinya
     ratusan karakter) membuat peramban ikut menyusutkan judul di sebelahnya
     sampai tiap judul pecah jadi beberapa baris. Judul hanya boleh melipat
     bila memang melewati max-width. */
  '.tor-di .spk-toc2.tor-toc .row .nm{flex:0 0 auto;max-width:74%;font-weight:400;'+
    'color:#33415C;text-transform:none}'+
  /* Titik pemandu memakai karakter titik dari font yang SAMA dengan teksnya,
     persis seperti Word — bukan border-dotted, yang jarak & bentuk titiknya
     ditentukan peramban. direction:rtl membuat kelebihan titik terpotong di
     ujung KIRI, sehingga titik terakhir selalu utuh & rapat ke nomor halaman. */
  '.tor-di .spk-toc2.tor-toc .row .dot{flex:1 1 0;min-width:0;overflow:hidden;direction:rtl;'+
    'white-space:nowrap;border:0;transform:none;margin:0 7pt;color:#C3CCDA;letter-spacing:.08em}'+
  '.tor-di .spk-toc2.tor-toc .row .pg{flex:0 0 auto;min-width:1.6em;text-align:right;'+
    'font-weight:600;color:#14346B;font-variant-numeric:tabular-nums}'+
  /* Baris judul bab: tanpa latar, hanya garis atas tebal + nomor bab kuning
     gelap, sejalan dengan kotak bergaris di sampulnya. */
  '.tor-di .spk-toc2.tor-toc .row.bab{font-weight:700;text-transform:uppercase;letter-spacing:.04em;'+
    'border-top:1.5pt solid #14346B;padding:8pt 0 6pt;margin:14pt 0 4pt;color:#14346B}'+
  '.tor-di .spk-toc2.tor-toc .row.bab:first-child{margin-top:0}'+
  '.tor-di .spk-toc2.tor-toc .row.bab .no{width:34pt;font-weight:700;color:#B57C05}'+
  '.tor-di .spk-toc2.tor-toc .row.bab .nm{font-weight:700;color:#14346B;text-transform:uppercase;max-width:80%}'+
  '.tor-di .spk-toc2.tor-toc .row.bab .dot{visibility:hidden}'+
  '.tor-di .spk-toc2.tor-toc .row.bab .pg{font-weight:700}'+
  /* ---- Kerapatan otomatis (kelas dari torTocDensity, BUKAN spkTocDensity) ----
     Ambang bawaan milik SPK (d1 >16) memaksa daftar isi TOR/KAK mengecil pada
     18 baris, padahal tinggi lembar masih sisa banyak — itulah sebabnya
     hurufnya terlihat kekecilan. Ambang di torTocDensity dihitung ulang dari
     tinggi bidang isi (~638pt) supaya huruf baru turun saat memang perlu.
     Ukuran di bawah juga ikut naik; jarak baris bab dipangkas lebih dulu karena
     ia penyumbang tinggi terbesar. */
  '.tor-di .spk-toc2.tor-toc.d1{margin-top:22pt}'+
  '.tor-di .spk-toc2.tor-toc.d1 .row{padding:4pt 0 4pt 21pt;font-size:10pt}'+
  '.tor-di .spk-toc2.tor-toc.d1 .row .no{width:37pt}'+
  '.tor-di .spk-toc2.tor-toc.d1 .row.bab{padding:7pt 0 5pt;margin:12pt 0 3pt}'+
  '.tor-di .spk-toc2.tor-toc.d1 .row.bab .no{width:31pt}'+
  '.tor-di .spk-toc2.tor-toc.d2{margin-top:18pt}'+
  '.tor-di .spk-toc2.tor-toc.d2 .row{padding:2.9pt 0 2.9pt 18pt;font-size:9pt}'+
  '.tor-di .spk-toc2.tor-toc.d2 .row .no{width:33pt}'+
  '.tor-di .spk-toc2.tor-toc.d2 .row.bab{padding:6pt 0 4pt;margin:10pt 0 3pt}'+
  '.tor-di .spk-toc2.tor-toc.d2 .row.bab .no{width:28pt}'+
  '.tor-di .spk-toc2.tor-toc.d3{margin-top:14pt;column-count:1}'+
  '.tor-di .spk-toc2.tor-toc.d3 .row{padding:2pt 0 2pt 16pt;font-size:7.8pt}'+
  '.tor-di .spk-toc2.tor-toc.d3 .row .no{width:29pt}'+
  '.tor-di .spk-toc2.tor-toc.d3 .row.bab{padding:5pt 0 3.5pt;margin:8pt 0 2pt}'+
  '.tor-di .spk-toc2.tor-toc.d3 .row.bab .no{width:25pt}'+
  /* ---- Blok "Label : nilai" (Overview Pekerjaan) ----
     Baris ini berasal dari TABEL 2/3 kolom pada template Word; spkWTblToHtml
     menyalin lebar kolom Word apa adanya sebagai gaya sebaris pada <span
     class="k">. Bila kolom di berkas Word lebih sempit daripada label
     terpanjang ("Nilai Pekerjaan (+ PPN)"), labelnya melipat jadi dua baris.
     Di sini lebar kolom dilepas dan pelipatan dimatikan, sehingga kolom label
     kembali diukur oleh grid .spk-kvgrp (max-content) = selebar label
     TERPANJANG, dan seluruh tanda ":" tetap lurus satu garis.
     !important diperlukan karena yang ditimpa adalah gaya sebaris. */
  '.spk-cl .spk-kv .k{max-width:none !important;white-space:nowrap}'+
  '.spk-cl .spk-kvgrp .spk-kv .k{flex:none !important;padding-right:.5cm}'+
  /* Cadangan bila baris kv TIDAK sempat dikelompokkan (mis. disela paragraf):
     kolom persentase 34% diganti lebar isi supaya tetap tidak melipat. */
  '.spk-cl > .spk-kv .k{flex:0 0 auto !important;padding-right:.5cm}'+
  /* ---- Kaki halaman isi TOR/KAK ----
     Kop & kaki memakai kelas milik Surat Perintah Kerja (.spk-rhd / .spk-rft /
     .ft-row / .ln / .ft-unit / .ft-pg dari spkDocCss2) supaya tampilannya
     PERSIS sama. Satu-satunya beda: kotak paraf hanya SATU di sebelah kanan
     ("Paraf"), sedangkan SPK punya dua (PIHAK PERTAMA kiri + PIHAK KEDUA
     kanan). Kolom kiri tetap ada sebagai penyeimbang KOSONG berlebar sama
     (flex:1 1 0) supaya singkatan unit & nomor halaman tetap TEPAT di tengah
     lembar — bila kolom kiri dibuang, keduanya akan bergeser ke kiri. */
  '.spk-rft .ft-row.ft-tor .l,.spk-rft .ft-row.ft-tor .r{flex:1 1 0}'+
  '.spk-rft .ft-row.ft-tor .r{text-align:right}'+
  /* ---- Blok pengesahan tanda tangan (lihat torTtdHtml) ----
     Tata letaknya meniru tabel 3 kolom di akhir lampiran TOR: dua penanda
     tangan berdampingan, lalu pengesah di tengah bawah. Kolom .gap yang kosong
     dipertahankan sebagai penyeimbang supaya kolom pengesah benar-benar jatuh
     di tengah lembar. Nama TIDAK digarisbawahi — mengikuti berkas Word yang
     hanya menebalkannya. */
  '.tor-ttd{margin-top:24pt;font-size:11pt;line-height:'+spkLHCss(1.15)+';color:#000}'+
  /* Tempat & tanggal DUDUK DI ATAS kolom kanan dan rata tengah terhadapnya —
     bukan rata kanan lembar — supaya sejajar dengan penanda tangan di bawahnya. */
  '.tor-ttd .tgl{width:'+_ttdW.w+'%;margin:0 0 10pt auto;text-align:center}'+
  '.tor-ttd table.tt{width:100%;border-collapse:collapse;table-layout:fixed}'+
  /* padding:0 WAJIB tetap nol: sejak blok ini disusun EMPAT BARIS (cap /
     jabatan / ruang ttd / nama — lihat torTtdTabel), padding sel apa pun akan
     terhitung empat kali dan merenggangkan blok. vertical-align:top membuat
     jabatan satu baris menempel ke atas barisnya, sehingga selisih tingginya
     jatuh SEBAGAI RUANG KOSONG di bawah — bukan menggeser nama. */
  '.tor-ttd table.tt td{border:0;padding:0;vertical-align:top}'+
  '.tor-ttd td.kol{text-align:center}'+
  /* Lebar sel — lihat torTtdCols() untuk asal-usul angkanya.
     tt-a: sisi | celah | sisi   (44 + 12 + 44)
     tt-b: tepi | sisi  | tepi   (28 + 44 + 28)
     tanpa Pengawas -> sisi2 | sisi (56 + 44) */
  '.tor-ttd table.tt td.sisi{width:'+_ttdW.w+'%}'+
  '.tor-ttd table.tt td.celah{width:'+_ttdW.celah+'%}'+
  '.tor-ttd table.tt td.tepi{width:'+_ttdW.tepi+'%}'+
  '.tor-ttd table.tt td.sisi2{width:'+_ttdW.sisi2+'%}'+
  '.tor-ttd .cap{margin-bottom:2pt}'+
  '.tor-ttd .jab{font-weight:700}'+
  /* Ruang bubuh tanda tangan & cap */
  '.tor-ttd .sp{height:'+TOR_TTD_RUANG_CM+'cm}'+
  '.tor-ttd .nm{font-weight:700}'+
  /* Jarak antara tabel penanda tangan atas dengan tabel pengesah */
  '.tor-ttd table.tt.tt-b{margin-top:14pt}'+
  /* ---- Tabel Bill of Quantity di dalam klausul (lihat torBoqTabelHtml) ----
     Gaya tabelnya sendiri (warna kop, garis, baris rekap) sudah datang dari
     hpsExtraDocCss() yang ikut disisipkan torDocHtml, jadi di sini hanya
     posisinya yang diatur: lurus dengan kolom teks klausul (margin-left
     diwarisi dari .spk-cl), diberi jarak dari kalimat di atasnya, dan
     text-indent klausul dinolkan supaya tabel tidak tertarik menjorok. */
  /* ---- LEBAR BLOK BoQ = LEBAR BIDANG CETAK HALAMAN ----
     KETENTUAN 6 Agu 2026: "batas kanan tabel BoQ mengikuti margin yang telah
     ditentukan pada halaman". Badan klausul (.spk-cl) menjorok LV2 cm dari
     bidang cetak karena harus sejajar dengan teks judul bab; bila tabel 9 kolom
     ikut menjorok, sisi kirinya masuk ke dalam sedangkan sisi kanannya sudah
     mentok margin — tabelnya jadi sempit sebelah dan kolom harga terjepit.
     Jorokan itu ditarik balik dengan margin kiri NEGATIF sebesar LV2, lalu
     lebarnya ditambah sebanyak itu pula, sehingga blok BoQ terbentang PERSIS
     dari margin kiri sampai margin kanan halaman — sama seperti lembar
     BoQ.xlsx yang selama ini ditempel sebagai gambar. */
  '.spk-cl .tor-boq{margin:2pt 0 2pt -'+LV2.toFixed(2)+'cm;'+
    'width:calc(100% + '+LV2.toFixed(2)+'cm);max-width:none;text-indent:0;text-align:left}'+
  /* Tabel Pekerjaan/Lokasi tidak boleh melebar melewati bidang cetak walau
     nama pekerjaannya panjang — nilainya melipat, bukan meluber. */
  '.spk-cl .tor-boq table.boq-info{max-width:100%}'+
  /* ---- JARAK KLAUSUL BoQ KE KLAUSUL SESUDAHNYA ----
     KETENTUAN 6 Agu 2026: beri jarak TOR_BOQ_JARAK_PT (24 pt) supaya batas
     antara lembar BoQ dan klausul berikutnya terlihat jelas — tanpa jarak itu
     judul klausul berikutnya menempel ke garis bawah tabel.

     DIPASANG SEBAGAI MARGIN BAWAH PADA KLAUSUL BoQ, BUKAN MARGIN ATAS PADA
     KLAUSUL BERIKUTNYA. Inilah kunci syarat kedua ("saat klausul ini hanya muat
     satu halaman, jarak 24 pt itu tidak boleh mendorong klausul selanjutnya
     yang berada di awal halaman baru"):

       - klausul berikutnya SEHALAMAN dengan BoQ -> BoQ bukan anak terakhir,
         margin bawahnya ikut terhitung -> jarak 24 pt tampil, dan paginator pun
         memperhitungkannya saat menguji apakah klausul itu masih muat;
       - BoQ menutup halaman (klausul berikutnya mulai di halaman baru) -> BoQ
         menjadi anak TERAKHIR badan lembar, dan scrollHeight sebuah wadah
         ber-overflow:hidden TIDAK menghitung margin bawah anak terakhirnya.
         Jadi 24 pt itu lenyap dengan sendirinya: tidak menambah tinggi halaman,
         tidak membuat BoQ dinilai "tidak muat", dan tidak menggeser apa pun di
         halaman berikutnya.

     Kalau jaraknya ditaruh sebagai margin ATAS klausul berikutnya, di halaman
     baru ia akan tetap memakan 24 pt di puncak lembar saat paginasi berlangsung
     (rapikanAtasLembar baru menolkannya SESUDAH halaman dipecah), persis yang
     tidak dikehendaki. */
  '.spk-doc.spk-spk .spk-clause.tor-boq-cl{margin-bottom:'+TOR_BOQ_JARAK_PT+'pt}'+
  '.spk-cl .tor-boq table.hps-doc-tbl{margin:0}'+
  /* ---- Kepala lembar BoQ: kop penyedia + judul + Pekerjaan/Lokasi ---- */
  /* Semua ukuran huruf di blok ini WAJIB ber-!important dengan selektor yang
     lebih khusus: mesin dokumen SPK memaksa `.spk-doc .spk-cl *{font-size:11pt
     !important}` ke seluruh isi klausul. Pemilih `*` dipakai supaya anak-anak
     tiap blok (bukan hanya wadahnya) ikut terkena. */
  '.spk-cl .tor-boq .boq-kop{margin:0 0 6px}'+
  '.spk-cl .tor-boq .boq-kop,'+
  '.spk-cl .tor-boq .boq-kop *{font-size:9.2px !important}'+
  /* Ukuran kop & judul MENIRU PERBANDINGAN pada lembar .xlsx (ketentuan
     6 Agu 2026): di sana kop 16 dan judul 14 terhadap isi 11, jadi di sini
     9,2px dikalikan 16/11 dan 14/11. Ditulis sebagai perkalian, bukan angka
     jadi, supaya hubungannya dengan lembar Excel tetap terbaca. */
  '.spk-cl .tor-boq .boq-kop .kp{font-size:'+(Math.round(9.2*16/11*10)/10)+'px !important}'+
  '.spk-cl .tor-boq .boq-kop .jd{font-size:'+(Math.round(9.2*14/11*10)/10)+'px !important}'+
  '.spk-cl .tor-boq .boq-kop .kp{text-align:center;font-weight:700;color:#0070C0;'+
    'margin:0 0 10px;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  '.spk-cl .tor-boq .boq-kop .jd{text-align:center;font-weight:700;'+
    'text-decoration:underline;margin:0 0 10px}'+
  /* ---- Baris Nama Pekerjaan / Lokasi Pekerjaan ----
     Blok ini MENIRU PERILAKU FORMAT ANGKA `@\ * ":"` yang dipakai sel C6/C7 di
     lembar .xlsx. Yang ditiru bukan hanya hasil akhirnya, tetapi cara kerjanya:

       LABELNYA RATA KIRI, TITIK DUANYA YANG TERDORONG KE TEPI KANAN KOLOM.

     Sebab dalam format itu `*` berarti "ulangi karakter sesudahnya sampai
     selebar kolom" — karakter itu SPASI — sehingga teks tetap mulai dari kiri
     dan ":" terlempar ke ujung kanan. Jadi kedua label mulai pada satu garis
     lurus di kiri DAN titik duanya lurus di kanan. (Percobaan pertama memakai
     rata kanan pada labelnya: titik duanya memang lurus, tetapi awal kata
     "Nama" dan "Lokasi" jadi tidak sejajar — tidak sama dengan lembar Excel.)

     Lebar selnya DITURUNKAN dari kisi kolom lembar .xlsx (TOR_BOQ_W) supaya
     label berdiri tepat di atas kolom yang sama seperti di lembar Excel:
       td.pad = kolom B (kolom "No.")
       td.k   = kolom C, RATA KIRI — labelnya
       td.s   = titik dua, menempel di tepi kanan kolom C (peran `* ":"`)
       td.v   = sisanya (kolom D..K), tempat nilai boleh melipat.
     Tabelnya kini SELEBAR PENUH (dulu width:auto bermargin kiri 6%), karena
     lebar kolomnya sudah mengurus perataan itu sendiri. */
  '.spk-cl .tor-boq table.boq-info{border-collapse:collapse;table-layout:fixed;'+
    'width:100%;margin:0 0 8px}'+
  '.spk-cl .tor-boq table.boq-info td{border:0;padding:0 0 2px;vertical-align:top;'+
    'line-height:1.35}'+
  /* Titik dua menempati selnya sendiri di ujung kanan kolom C; lebarnya (1,6%)
     DIPOTONG dari kolom C supaya tepi kanan "label + :" tetap jatuh pas di
     batas kolom C/D. Labelnya sendiri RATA KIRI — lihat catatan di atas. */
  '.spk-cl .tor-boq table.boq-info td.pad{width:'+torBoqPct(1)+'%}'+
  '.spk-cl .tor-boq table.boq-info td.k{width:'+(Math.round((torBoqPct(2)-1.6)*10)/10)+'%;'+
    'font-weight:700;white-space:nowrap;text-align:left}'+
  '.spk-cl .tor-boq table.boq-info td.s{width:1.6%;text-align:right}'+
  '.spk-cl .tor-boq table.boq-info td.v{text-align:left;font-weight:700;'+
    'padding-left:.12cm;overflow-wrap:break-word}'+
  /* ---- Tanda tangan penyedia: paruh kanan lembar, rata tengah ---- */
  '.spk-cl .tor-boq .boq-ttd,'+
  '.spk-cl .tor-boq .boq-ttd *{font-size:9.2px !important}'+
  '.spk-cl .tor-boq .boq-ttd{width:'+TOR_BOQ_TTD_W+'%;margin:14px 0 0 auto;'+
    'text-align:center;line-height:1.4}'+
  '.spk-cl .tor-boq .boq-ttd .pr,'+
  '.spk-cl .tor-boq .boq-ttd .nm,'+
  '.spk-cl .tor-boq .boq-ttd .jb{font-weight:700}'+
  '.spk-cl .tor-boq .boq-ttd .nm{text-decoration:underline}'+
  /* Ruang bubuh tanda tangan & cap — SATU ukuran dengan TOR/KAK & RAB,
     lihat TOR_TTD_RUANG_CM. */
  '.spk-cl .tor-boq .boq-ttd .sp{height:'+TOR_TTD_RUANG_CM+'cm}'+
  /* UKURAN HURUF TABEL HARUS DITULIS ULANG DI SINI — DAN DENGAN !important.
     Mesin dokumen SPK memaksa SELURUH isi klausul memakai 11pt lewat aturan
     ber-!important (`.spk-doc .spk-cl *`, `.spk-flow .spk-cl *`,
     `.spk-sheet .spk-cl *` di spkDocCss/spkDocCss2). Tanpa penimpaan di sini,
     tabel 9 kolom ikut tercetak 11pt: judul kolom pecah di tengah kata dan
     kolom terakhir terpotong tepi kertas. Selektor di bawah lebih khusus
     daripada ketiganya, dan torDocCss() memang blok CSS terakhir. */
  '.spk-cl .tor-boq table.hps-doc-tbl,'+
  '.spk-cl .tor-boq table.hps-doc-tbl *{font-size:8.7px !important}'+
  '.spk-cl .tor-boq table.hps-doc-tbl th,'+
  '.spk-cl .tor-boq table.hps-doc-tbl td{line-height:1.3;padding:3px 5px}'+
  /* Judul kolom memenggal antar-KATA saja, bukan di tengah kata
     ("Barang" tidak boleh jadi "Bara/ng"). */
  '.spk-cl .tor-boq table.hps-doc-tbl thead th{overflow-wrap:break-word;'+
    'word-break:normal;hyphens:none}'+
  /* ===== SATU MUKA HURUF DI SELURUH BADAN KLAUSUL =====
     KETENTUAN 6 Agu 2026: nilai kode isian pada klausul PENGENDALI PEKERJAAN
     ({{jabatan_pengguna}}, {{jabatan_direksi}}, {{jabatan_pengawas}}) tercetak
     dengan muka huruf yang berbeda dari kalimat di sekitarnya.

     SEBABNYA ADA DI ISI KLAUSUL, BUKAN DI KODE. Teks klausul disalin-tempel
     dari template Word, dan Word membawa serta muka hurufnya sendiri pada
     potongan yang ditempel — biasanya sebagai atribut <font face="..."> atau
     gaya sebaris pada <span> yang MEMBUNGKUS placeholder itu. spkStripFontStyle
     sudah membuang sebagian besar di antaranya, tetapi tidak semua bentuk
     penulisan Word tertangkap, dan gaya sebaris selalu mengalahkan CSS biasa.

     Karena itu penyeragamannya dikerjakan di sini, di lapisan CSS PALING AKHIR
     dokumen TOR/KAK, dengan !important sehingga gaya sebaris peninggalan Word
     pun kalah. Cakupannya SENGAJA DIBATASI pada badan & judul klausul
     (.spk-cl / .spk-cl-h): sampul dan daftar isi TIDAK ikut karena keduanya
     memang memakai Plus Jakarta Sans. Daftar muka hurufnya disamakan persis
     dengan aturan .fkl-doc di torHpsDocCss, termasuk "Inter Local" (versi
     base64 yang ditanam spkInterFontFace) sebagai pilihan pertama supaya
     cetakan tetap benar walau jaringan mati. */
  '.spk-doc .spk-cl,.spk-doc .spk-cl *,'+
  '.spk-doc .spk-cl-h,.spk-doc .spk-cl-h *{'+
    'font-family:"Inter Local","Inter","Segoe UI",Arial,sans-serif !important}';
}
/* ---- Klausul OVERVIEW PEKERJAAN: tanpa cetak tebal ----
   Nilai "Direksi Pekerjaan" & "Pengawas Pekerjaan" tampil tebal karena template
   Word-nya memang menebalkan sel itu — bukan hasil olahan aplikasi. Karena
   blok Overview seluruhnya berupa data (bukan penegasan), penebalannya dibuang
   di sini: tag <b>/<strong> dilepas dan deklarasi font-weight tebal pada gaya
   sebaris dinolkan. Klausul lain TIDAK tersentuh. */
function torIsOverview(judul){
  var t=(typeof spkJudulPlain==='function') ? spkJudulPlain(judul) : String(judul||'');
  return /overview/i.test(t);
}
function torTanpaTebal(html){
  return String(html==null?'':html)
    .replace(/<\/?(?:b|strong)\b[^>]*>/gi,'')
    .replace(/font-weight\s*:\s*(?:bold(?:er)?|[5-9]00)\s*;?/gi,'');
}
/* ---- Sampul (rancangan "garis tegak") ----
   Tata letaknya memakai aliran normal (flex column) dengan kaki dikunci
   margin-top:auto, jadi nama pekerjaan boleh memanjang beberapa baris tanpa
   perlu kalibrasi ulang. Lembar TIDAK lagi memakai kelas .spk-cover: seluruh
   gayanya berdiri sendiri di torDocCss (lihat .tor-lembar / .tor-cv). */
function torCoverHtml(data, ctx){
  const esc=fkEsc;
  const logo=(typeof SPK_LOGO_SRC!=='undefined' && SPK_LOGO_SRC) ? '<img src="'+SPK_LOGO_SRC+'" alt="PLN">' : '';
  /* Kotak keterangan. Ruas kosong ditandai '—' dan diredupkan, bukan
     dihilangkan, supaya kisi dua kolom tidak berubah bentuk. */
  const ko=(label, nilai, cls)=>{
    const kosong=!(nilai && String(nilai).trim());
    return '<div class="ko'+(cls?' '+cls:'')+'">'+
      '<div class="ko-lb">'+esc(label)+'</div>'+
      '<div class="ko-isi'+(kosong?' kosong':'')+'">'+(kosong?'\u2014':esc(nilai))+'</div></div>';
  };
  /* Nomor PRK boleh lebih dari satu. Pemisahnya berbeda-beda tergantung dari
     mana nilainya datang (daftar berlapis pada form -> baris baru; ctx.no_prk
     -> titik koma), jadi keduanya diterima lalu ditampilkan satu per baris. */
  const prk=(Array.isArray(data.no_prk_list) ? data.no_prk_list : String(data.no_prk||'').split(/[\r\n;]+/))
    .map(x=>String(x||'').trim()).filter(Boolean);
  const prkHtml=prk.length ? prk.map(esc).join('<br>') : '';
  /* Baris kedua alamat sudah memuat "· www.pln.co.id"; alamat situsnya
     ditebalkan tanpa mengubah tetapan SPK_ALAMAT_2. */
  const al1=(typeof SPK_ALAMAT_1!=='undefined')?SPK_ALAMAT_1:'';
  const al2=(typeof SPK_ALAMAT_2!=='undefined')?SPK_ALAMAT_2:'';
  const alamat=esc(al1)+(al2?('<br>'+esc(al2).replace(/(www\.pln\.co\.id)/i,'<b>$1</b>')):'');
  const unit=ctx.unit_lengkap||'PT PLN (Persero) UP3 Masohi';
  return ''+
  '<section class="spk-page tor-lembar tor-cv">'+
    '<div class="tor-bat"></div>'+
    '<div class="tor-isi">'+
      '<div class="tor-kop">'+logo+
        '<div><div class="tor-kop-nm">PT PLN (PERSERO)</div>'+
          '<div class="tor-kop-sub">'+esc(TOR_SINGKATAN_UNIT)+'</div></div>'+
        '<div class="tor-kop-sp"></div>'+
        '<div class="tor-th"><span>TAHUN</span><b>'+esc(ctx.tahun_dokumen||'')+'</b></div>'+
      '</div>'+
      '<div class="tor-kop-g"></div>'+

      '<div class="tor-judul">'+
        '<div class="tor-kelopak">DOKUMEN PENGADAAN BARANG/JASA</div>'+
        '<h1 class="tor-tt"><i>Term of Reference</i> (TOR)<br>Kerangka Acuan Kerja (KAK)</h1>'+
        '<div class="tor-no">'+esc(data.no_dokumen||'\u2014')+'</div>'+
      '</div>'+

      '<div class="tor-set">'+
        ko('PEKERJAAN', data.nama_pekerjaan)+
        ko('LOKASI', data.lokasi_pekerjaan)+
      '</div>'+

      '<div class="tor-kisi">'+
        ko('BIDANG PELAKSANA', data.pelaksana, 'kecil lebar')+
        ko('NO. ANGGARAN', ctx.sumber_dana_no, 'kecil')+
        ko('TGL. ANGGARAN', ctx.sumber_dana_tgl_pjg, 'kecil')+
        /* Nomor PRK ditulis langsung (bukan lewat ko()) karena isinya sudah
           berupa HTML berbaris ganda yang tiap barisnya sudah diloloskan. */
        '<div class="ko kecil"><div class="ko-lb">NO. PRK</div>'+
          '<div class="ko-isi'+(prkHtml?'':' kosong')+'">'+(prkHtml||'\u2014')+'</div></div>'+
        ko('PERKIRAAN NILAI PEKERJAAN', ctx.nilai_pekerjaan, 'kecil')+
        ko('TERBILANG', ctx.nilai_pekerjaan_terbilang, 'kecil lebar tor-terb')+
      '</div>'+

      '<div class="tor-kaki">'+
        '<div class="tor-kaki-g"></div>'+
        '<div class="tor-unit">'+esc(unit)+'</div>'+
        '<div class="tor-alamat">'+alamat+'</div>'+
      '</div>'+
    '</div>'+
  '</section>';
}
/* ---- Kerapatan daftar isi TOR/KAK ----
   spkTocDensity() milik Susun Kontrak TIDAK dipakai di sini: ambangnya
   (d1 >16) dihitung untuk daftar pasal SPK yang tiap barisnya bergaris dan
   jauh lebih tinggi. Pada daftar isi TOR/KAK ambang itu membuat huruf mengecil
   terlalu dini. Angka di bawah diturunkan dari tinggi bidang isi lembar
   (297mm - 2 x 20mm, dikurangi kop + judul + garis ~ 90pt, sisa ~638pt) dibagi
   tinggi satu baris pada tiap ukuran, dengan cadangan ~5%.
   Baris bab ikut terhitung dalam n (lihat torTocHtml). */
function torTocDensity(n){
  n = Number(n)||0;
  if(n > 32) return ' d3';   /* 7,8pt */
  if(n > 26) return ' d2';   /* 9pt   */
  if(n > 20) return ' d1';   /* 10pt  */
  return '';                 /* 11pt  */
}
/* ---- Daftar Isi (struktur .spk-toc2 .pg WAJIB: diisi oleh paginator) ---- */
function torTocHtml(data, klausul){
  const esc=fkEsc, list=klausul||[];
  const str=torStruktur(list);
  /* PENTING: jumlah & urutan <span class="pg"> HARUS sama persis dengan jumlah
     & urutan .spk-clause di badan dokumen — paginator (nomorToc) mengisinya
     berpasangan menurut urutan. Judul bab I & II ikut berupa .spk-clause
     tersendiri, jadi ia pun mendapat satu baris daftar isi bernomor halaman. */
  let rows='', n=0;
  list.forEach((k,i)=>{
    const s=str[i];
    if(s.awal && !s.lebur){
      n++;
      rows+='<div class="row bab"><span class="no">'+esc(s.rom+'.')+'</span>'+
        '<span class="nm">'+esc(s.babNama)+'</span>'+
        '<span class="dot"></span><span class="pg">\u2014</span></div>';
    }
    n++;
    rows+='<div class="row'+(s.lebur?' bab':'')+'">'+
      /* Titik penutup label disamakan dengan judul di badan dokumen
         (data-no="II.3.") supaya daftar isi & isi terbaca satu gaya. */
      '<span class="no">'+esc(s.lebur?(s.rom+'.'):(s.no+'.'))+'</span>'+
      '<span class="nm">'+(s.lebur?esc(s.babNama):spkFmtJudulTitle(k.judul))+'</span>'+
      '<span class="dot"></span><span class="pg">\u2014</span></div>';
  });
  /* Bab PENUTUP otomatis (lihat torPenutupHtml) juga berupa satu .spk-clause di
     badan dokumen, jadi ia WAJIB punya barisnya sendiri di sini — kalau tidak,
     pasangan .pg <-> .spk-clause meleset satu dan seluruh nomor halaman daftar
     isi ikut bergeser. */
  if(!str.some(x=>x.bab===TOR_BAB.length)){
    const B=TOR_BAB[TOR_BAB.length-1];
    n++;
    rows+='<div class="row bab"><span class="no">'+esc(B.rom+'.')+'</span>'+
      '<span class="nm">'+esc(B.nama)+'</span>'+
      '<span class="dot"></span><span class="pg">\u2014</span></div>';
  }
  /* Titik pemandu ditulis sebagai KARAKTER titik (lihat aturan .dot pada
     torDocCss): kelebihannya dipotong di ujung kiri oleh direction:rtl +
     overflow:hidden, jadi jumlahnya cukup dibuat berlebih sekali saja. */
  const titik=new Array(221).join('.');
  rows=rows.split('<span class="dot"></span>').join('<span class="dot">'+titik+'</span>');
  return ''+
  '<section class="spk-page tor-lembar tor-di">'+
    '<div class="tor-bat"></div>'+
    '<div class="tor-isi">'+
      '<div class="di-kop"><span>'+esc(TOR_DOK_LABEL)+'</span>'+
        '<span>'+esc(TOR_SINGKATAN_UNIT.toUpperCase())+'</span></div>'+
      '<div class="di-judul">Daftar Isi</div>'+
      '<div class="di-rule"></div>'+
      '<div class="spk-toc2 tor-toc'+torTocDensity(n)+'">'+rows+'</div>'+
    '</div>'+
  '</section>';
}
/* ---- Kop & kaki berulang tiap lembar ----
   Struktur & nama kelasnya SAMA PERSIS dengan Surat Perintah Kerja
   (spkRunHeadHtml / spkRunFootHtml di susun-kontrak.js), sehingga seluruh
   gayanya diwarisi dari spkDocCss2 tanpa perlu disalin ulang. Yang berbeda
   hanya isinya:
     - kop  : nama dokumen "TOR / KAK" + nomor dokumen TOR
     - kaki : paraf hanya SATU di sebelah kanan ("Paraf"), bukan dua
              (PIHAK PERTAMA kiri + PIHAK KEDUA kanan) seperti SPK.
   Susun Kontrak TIDAK disentuh. */
function torRunHeadHtml(data){
  const esc=fkEsc;
  const logo=(typeof SPK_LOGO_SRC!=='undefined' && SPK_LOGO_SRC)?'<img src="'+SPK_LOGO_SRC+'" alt="PLN">':'';
  return '<div class="spk-rhd">'+
    '<div class="l">'+logo+'<div class="o"><span>PT PLN (PERSERO)</span><b>'+esc(TOR_SINGKATAN_UNIT)+'</b></div></div>'+
    '<div class="r"><b>'+esc(TOR_KOP_LABEL)+'</b><span>'+esc(data.no_dokumen||'\u2014')+'</span></div>'+
  '</div>';
}
function torRunFootHtml(data){
  const esc=fkEsc;
  /* .ft-pg WAJIB dipertahankan — diisi nomor halaman oleh spkPageScript().
     Kolom kiri sengaja KOSONG: ia cuma penyeimbang supaya kolom tengah tetap
     di tengah lembar (lihat aturan .ft-row.ft-tor pada torDocCss). */
  return '<div class="spk-rft">'+
    '<div class="ft-row ft-tor">'+
      '<div class="l"></div>'+
      '<div class="c"><div class="ft-unit">'+esc(TOR_SINGKATAN_UNIT.toUpperCase())+'</div>'+
        '<div class="ft-pg">&#8203;</div></div>'+
      '<div class="r"><span class="ln"></span> '+esc(TOR_PARAF_LABEL)+'</div>'+
    '</div>'+
  '</div>';
}
/* ---- BAB PENUTUP OTOMATIS ----
   Dibangun sebagai .spk-clause seperti klausul biasa supaya seluruh perlakuan
   paginator & penomoran halaman daftar isi berlaku sama. Hanya dipakai bila
   tidak ada klausul yang menempati bab III (lihat torStruktur). */
function torPenutupHtml(){
  const B=TOR_BAB[TOR_BAB.length-1];
  /* .tor-akhir — lihat torAkhirKeepScript. */
  return '<div class="spk-clause tor-babisi tor-akhir">'+
    '<div class="spk-cl-h tor-babh"><span class="n" data-no="'+fkEsc(B.rom)+'."></span>'+fkEsc(B.nama)+'</div>'+
    '<div class="spk-cl"><p class="kl0">'+fkEsc(TOR_PENUTUP_TEKS)+'</p></div>'+
  '</div>';
}
/* ---- Lebar kolom blok tanda tangan ----
   Blok ini terdiri dari DUA baris dengan pembagian kolom yang berbeda:
     baris atas  : penanda tangan KIRI (W) | celah | penanda tangan KANAN (W)
     baris bawah : pengesah TUNGGAL selebar W, tepat di TENGAH lembar
   Keduanya digambar sebagai DUA TABEL TERPISAH yang sama-sama selebar 100%,
   bukan satu tabel bercolspan. Alasannya dua:
     1. Tata letak tabel FIXED membagi lebar sel bercolspan RATA ke tiap kolom,
        jadi kisi asimetris (28|16|12|16|28) hanya bisa dinyatakan lewat <col> —
        dan pada kerangka dokumen RAB, lebar <col> kalah oleh aturan bawaan
        `tr.ttd-row .ttd td{width:50%}` milik app.js.
     2. Dengan dua tabel, tiap lebar ditulis langsung di selnya sehingga cukup
        dimenangkan lewat kekhususan selektor — jauh lebih mudah ditelusuri.
   Semua angka diturunkan dari satu nilai W supaya tetap simetris:
     sisi = W | celah = 100-2W | tepi = (100-W)/2 | sisi2 = 100-W  */
function torTtdCols(){
  const w=TOR_TTD_KOL_W;
  return { w:w, celah:(100-2*w), tepi:((100-w)/2), sisi2:(100-w) };
}
/* ---- BLOK PENGESAHAN TANDA TANGAN ----
   Susunannya mengikuti lampiran TOR/KAK (tabel 3 kolom di akhir dokumen):

       Masohi, <tanggal dokumen>          <- rata TENGAH atas kolom kanan
       Diperiksa oleh;                Disusun oleh;
       <jabatan direksi>              <jabatan pengawas>      (tebal)
       [ruang tanda tangan]
       <NAMA DIREKSI>                 <NAMA PENGAWAS>         (tebal)
                    Disahkan oleh;
                    <jabatan pengguna>                        (tebal)
                    [ruang tanda tangan]
                    <NAMA PENGGUNA>                           (tebal)

   Seluruh isinya diambil dari kartu "Pejabat Terkait" pada form — TIDAK ada
   nama yang ditanam di dalam kode, sehingga dokumen tetap benar saat pejabatnya
   berganti. Bila Pengawas Pekerjaan diisi "Tidak Ada", kolom kanan ditiadakan
   dan "Disusun oleh" jatuh ke Direksi Pekerjaan supaya tidak ada kotak tanda
   tangan tanpa nama.

   Lebar tiap kolom penanda tangan = TOR_TTD_KOL_W (44%), bukan sepertiga
   lembar, supaya nama panjang seperti "LUTHER RANSKIE WASILANE" muat satu
   baris. Kisi kolomnya dihitung torTtdCols().

   Kelas .spk-keep membuat paginator memperlakukan blok ini sebagai SATU
   kesatuan: bila sisa lembar tidak cukup, seluruhnya turun bersama ke lembar
   berikutnya — tanda tangan tidak pernah terpisah dari nama & jabatannya. */
function torTtdHtml(ctx){
  const esc=fkEsc;
  const nm=(v)=>String(v||'').trim().toUpperCase();
  const dirN=nm(ctx.nama_direksi),  dirJ=String(ctx.jabatan_direksi||'').trim();
  const pgwN=nm(ctx.nama_pengawas), pgwJ=String(ctx.jabatan_pengawas||'').trim();
  const pguN=nm(ctx.nama_pengguna), pguJ=String(ctx.jabatan_pengguna||'').trim();
  const adaPgw=!!(pgwN||pgwJ);
  /* Satu penanda tangan dinyatakan sebagai OBJEK, bukan potongan <td> jadi —
     karena tiap unsurnya (cap / jabatan / ruang / nama) kini tersebar ke BARIS
     yang berbeda, lihat torTtdTabel(). */
  const kolom=(cap,jab,nama)=>({cap:cap, jab:jab||'\u2014', nama:nama||'\u2014'});
  const gap=(cls)=>({gap:cls});
  const tabel=(cls,isi)=>torTtdTabel(cls,isi);
  /* Baris atas: dua penanda tangan bila ada Pengawas, satu bila tidak.
     Tanpa Pengawas, penanda tangan tunggal tetap jatuh di kolom KANAN dan
     penyeimbang kirinya selebar sisi+celah (kelas .sisi2). */
  const atas = adaPgw
    ? tabel('tt-a', [kolom('Diperiksa oleh;',dirJ,dirN), gap('celah'), kolom('Disusun oleh;',pgwJ,pgwN)])
    : tabel('tt-a', [gap('sisi2'), kolom('Disusun oleh;',dirJ,dirN)]);
  const bawah = tabel('tt-b', [gap('tepi'), kolom('Disahkan oleh;',pguJ,pguN), gap('tepi')]);
  return '<div class="tor-ttd spk-keep">'+
    '<div class="tgl">'+esc(ctx.tempat_tanggal||'')+'</div>'+
    atas+bawah+
  '</div>';
}
/* ---- KERANGKA TABEL PENANDA TANGAN: SATU UNSUR = SATU BARIS ----
   KETENTUAN 6 Agu 2026: "posisi nama di kiri dan kanan tidak sejajar secara
   horizontal ... ikuti saja posisi mana teks yang terdapat 2 baris pada
   jabatan sehingga namanya terdorong karena jarak".

   Sebelumnya tiap penanda tangan adalah SATU sel yang isinya ditumpuk
   (cap -> jabatan -> ruang -> nama). Begitu jabatan salah satu kolom melipat
   jadi dua baris, hanya nama DI KOLOM ITU yang ikut turun; kolom sebelahnya
   tetap di atas, sehingga kedua nama tidak sebaris.

   Sekarang unsur yang sama diletakkan pada BARIS TABEL yang sama: tinggi satu
   baris selalu = isi tertinggi di baris itu, jadi baris jabatan otomatis
   setinggi jabatan terpanjang dan baris nama SELALU mulai pada garis yang
   sama di kedua kolom. Berapa pun jumlah baris jabatannya (dua, tiga, ...)
   tidak perlu ditebak lagi — tidak ada tinggi yang dipatok di CSS.

   `kolom` = daftar penanda tangan/penyeimbang dari kiri ke kanan:
     {cap, jab, nama} -> sel penanda tangan   |   {gap:'celah'} -> sel kosong  */
function torTtdTabel(cls, kolom){
  const esc=fkEsc;
  const baris=(kls, isi)=>'<tr class="'+kls+'">'+kolom.map(function(k){
      return k.gap ? '<td class="gap '+k.gap+'"></td>'
                   : '<td class="kol sisi">'+isi(k)+'</td>';
    }).join('')+'</tr>';
  return '<table class="tt '+cls+'"><tbody>'+
    baris('br-cap', k=>'<div class="cap">'+esc(k.cap)+'</div>')+
    baris('br-jab', k=>'<div class="jab">'+esc(k.jab)+'</div>')+
    baris('br-sp',  k=>'<div class="sp"></div>')+
    baris('br-nm',  k=>'<div class="nm">'+esc(k.nama)+'</div>')+
  '</tbody></table>';
}
/* ===================== 10b. PERAPIAN KLAUSUL KHUSUS TOR/KAK =====================
   Dua ketentuan tata letak TOR/KAK yang BERBEDA dari Surat Perintah Kerja, jadi
   dikerjakan di sini (susun-kontrak.js tidak disentuh).

   (1) PENOMORAN SUB-BUTIR MENGIKUTI INDUKNYA — "1." lalu "1.1., 1.2., …"
       Laporan 6 Agu 2026 pada klausul II.7 KUALIFIKASI PENYEDIA BARANG/JASA:
       di bawah butir "1. Administrasi" sub-butirnya tercetak "7.1., 7.2., 7.3."
       (ikut nomor klausul) padahal seharusnya "1.1., 1.2., 1.3."; begitu pula
       di bawah butir "2." seharusnya "2.1., 2.2., …".
       Mesinnya SUDAH ADA di susun-kontrak.js: spkPkSubNumberFix() menyusun ulang
       nomor majemuk dari SILSILAH butirnya, bukan dari angka yang tertulis di
       template. Hanya saja spkPkTidy() memanggilnya PADA CABANG isPk saja —
       cabang !isPk (yang dipakai SPK dan, karena dipakai ulang, TOR/KAK) langsung
       ke spkPkIndentStd. Di sini fungsi itu dijalankan lebih dulu KHUSUS untuk
       TOR/KAK; dokumen SPK & PK tidak berubah perilakunya.
       spkPkBoxMark() dipanggil duluan karena spkPkSubNumberFix hanya mengenali
       penanda yang SUDAH dikotakkan (<span class="n">); memanggilnya dua kali
       aman — paragraf yang sudah punya kotak nomor dilewati.

   (2) TINGKAT TANPA PENOMORAN SEJAJAR JUDUL KLAUSUL
       Ketentuan 6 Agu 2026: bila sebuah tingkat hanya berupa TEKS tanpa
       penomoran sedangkan tingkat di bawahnya bernomor (mis. II.4 PENGENDALIAN
       PEKERJAAN: paragraf "Dalam rangka pengendalian pekerjaan …" lalu butir
       "1.", "a."), paragraf tanpa nomor itu dirender seperti KLAUSUL TANPA
       PENOMORAN — teksnya lurus dengan teks judul klausul, sehingga "Dalam
       rangka" sejajar dengan "PENGENDALIAN PEKERJAAN".
       spkPkIndentStd() sendiri sudah punya perlakuan itu, tetapi HANYA ketika
       klausulnya sama sekali tidak punya butir bernomor (_pureNarasi); bila ada
       butir bernomor, blok pengantar sengaja dijorokkan tipis SPK_PK_LEAD_JUDUL
       (0,15 cm) darinya. Di sini jorokan tipis itu dinolkan untuk TOR/KAK.
       Deret bernomor di bawahnya TIDAK ikut bergeser — titik tolaknya (LEAD)
       tetap dihitung spkPkIndentStd seperti biasa. */
function torJudulX(){
  var _D=(typeof spkDX==='function')?spkDX():null;
  if(typeof SPK_JH_OVR!=='undefined' && SPK_JH_OVR>0) return SPK_JH_OVR;
  return _D ? Math.round((_D.JUDUL_HANG/566.929)*100)/100 : 0.65;
}
/* Luruskan blok PENGANTAR (sebelum butir bernomor pertama) ke kolom teks judul. */
function torIntroSejajar(html, judulX){
  var s=String(html==null?'':html);
  if(!(judulX>0)) return s;
  try{
    var box=document.createElement('div'); box.innerHTML=s;
    var tepi=judulX.toFixed(2)+'cm', anak=box.children, i, el;
    for(i=0;i<anak.length;i++){
      el=anak[i];
      /* berhenti di butir bernomor PERTAMA — sisanya milik mesin inden */
      if(el.tagName==='P' && el.querySelector && el.querySelector('span.n')) break;
      if(!(el.textContent||'').replace(/[\s\u00A0]/g,'')) continue;      /* baris kosong */
      if(el.classList && (el.classList.contains('spk-cl-h')||el.classList.contains('spk-bab')||
         el.classList.contains('spk-ph'))) continue;
      el.style.marginLeft=tepi;
      el.style.paddingLeft='0cm';
      if(parseFloat(el.style.textIndent)<0) el.style.textIndent='0cm';
      if(typeof spkKvResetInner==='function') spkKvResetInner(el);
    }
    return box.innerHTML;
  }catch(e){ return s; }
}
/* ===================== INDEN BARIS PERTAMA PARAGRAF (ketentuan 7 Agu 2026) ====
   "Isi klausul yang terdiri dari BEBERAPA paragraf diberi inden baris pertama
   otomatis; klausul yang hanya SATU paragraf tidak perlu."

   Alasan aturannya tipografis: inden baris pertama adalah PENANDA PEMISAH antar
   paragraf. Kalau paragrafnya cuma satu, tidak ada yang perlu dipisahkan — inden
   di sana hanya membuat blok teks tampak menggantung tanpa sebab.

   TIDAK ADA CSS BARU. Kelas `klp` ("Paragraf (menjorok)") sudah ada sejak semula
   dengan inden P_FIRST = 425 twip = 0,75 cm, sudah terdaftar di SPK_CLS2STY
   sebagai gaya Word "Klausul Paragraf", dan sudah menjadi pilihan di editor
   klausul. Jadi yang dilakukan di sini hanya MENUKAR KELAS kl0 -> klp pada
   paragraf yang memenuhi syarat: hasilnya seragam dengan klausul yang diketik
   langsung di aplikasi, dan tetap kembali menjadi gaya "Klausul Paragraf" bila
   klausulnya diunduh ulang sebagai template Word.

   YANG DIHITUNG SEBAGAI "PARAGRAF" hanyalah paragraf PROSA (kelas kl0):
     - butir bernomor (kl1/kl2) tidak ikut — itu daftar, bukan paragraf, dan
       indennya sudah diatur mesin penomoran;
     - baris kosong dari Enter (data-blank) tidak ikut;
     - blok foto & paragraf tanpa teks tidak ikut — sebuah gambar bukan paragraf,
       dan menghitungnya akan membuat klausul satu-paragraf-plus-foto ikut
       terinden padahal seharusnya tidak;
     - baris "Label : nilai" (.spk-kv) berupa <div>, jadi memang tidak terjaring.

   Dijalankan SESUDAH spkPruneKlausul supaya paragraf contoh yang dibuang tidak
   ikut terhitung — kalau tidak, klausul berisi satu paragraf + satu contoh akan
   salah dinilai "dua paragraf". */
function torIndenParagraf(html){
  var s=String(html==null?'':html);
  if(s.indexOf('kl0')<0) return s;
  try{
    var box=document.createElement('div'); box.innerHTML=s;
    var anak=box.children, calon=[], i, el;
    for(i=0;i<anak.length;i++){
      el=anak[i];
      if(el.tagName!=='P') continue;
      if(!/\bkl0\b/.test(el.className||'')) continue;
      if(el.getAttribute('data-blank')==='1') continue;
      if(el.classList && (el.classList.contains('spk-blank')||el.classList.contains('spk-ph'))) continue;
      if(el.querySelector && el.querySelector('img')) continue;
      if(el.querySelector && el.querySelector('span.n')) continue;      /* butir bernomor terbungkus */
      if(!String(el.textContent||'').replace(/[\s ⁣]/g,'')) continue;
      calon.push(el);
    }
    if(calon.length<2) return s;                 /* satu paragraf -> tanpa inden */
    calon.forEach(function(p){
      p.className=String(p.className||'').replace(/\bkl0\b/,'klp').trim();
    });
    return box.innerHTML;
  }catch(e){ console.error('torIndenParagraf:', e); return s; }
}

function torKlTidy(html){
  var h=String(html==null?'':html);
  try{ h=spkPkSubNumberFix(spkPkBoxMark(h)); }catch(e){}
  var out=spkPkTidy(h, false);
  try{ out=torIntroSejajar(out, torJudulX()); }catch(e){}
  return out;
}

/* ===================== 9b. FOTO DI DALAM KLAUSUL TOR/KAK =====================
   Foto yang ditempel di klausul TIDAK PERNAH disimpan sebagai base64.

   Alasannya struktural, bukan selera: pustaka klausul TOR disalin ke DUA
   tempat yang keduanya kolom JSONB —
     1. `torState.data.__klausulLib`  (ikut tiap baris dokumen_tor), dan
     2. profil `app_profiles` kind 'klausul_tor'.
   Satu foto 300 KB yang ditulis base64 (~400 KB) akan tergandakan di setiap
   dokumen TOR yang pernah dibuat. Pola kegagalan itu sudah pernah terjadi pada
   foto RHO dan diselesaikan dengan cara yang sama: byte-nya pindah ke Storage,
   yang tersimpan di klausul hanya <img src="...">.

   Bucket `foto-tor` sengaja PUBLIK — persis alasan `foto-referensi`: atribut
   src <img> tidak bisa mengirim header Authorization, dan iframe cetak pun
   tidak. Isinya foto pendukung uraian pekerjaan, bukan dokumen rahasia.

   KUNCI OBJEK MEMBAWA SEGMEN 'foto-tor/' DI DEPAN — sama seperti seluruh
   berkas lain di aplikasi ini. r2XhrPut() menentukan bucket dari segmen
   pertama path lalu memakai SELURUH path sebagai kunci; memotong prefiksnya
   akan membuat setiap foto 404 tanpa satu pun pesan galat.

   Foto TIDAK diikat ke id dokumen: satu klausul bisa dipakai ulang di banyak
   dokumen dan bisa disalin lewat Profil Klausul, jadi masa hidupnya tidak
   sama dengan masa hidup dokumen. Kuncinya dikelompokkan per BULAN unggah
   supaya daftar bucket tetap terbaca. */
const TOR_FOTO_BUCKET = 'foto-tor';
const TOR_FOTO_PREFIX = 'foto-tor/';
const TOR_FOTO_BASE   = (typeof SB_STORAGE_URL!=='undefined' ? SB_STORAGE_URL : '') + '/object/public/' + TOR_FOTO_BUCKET;
/* Batas sisi terpanjang (px). Lebar teks lembar A4 bermargin 2,54 cm hanya
   ±16 cm; pada 300 dpi cetak itu setara ±1890 px, jadi 1800 px sudah melebihi
   kebutuhan resolusi tertinggi yang bisa ditampilkan halaman. */
const TOR_FOTO_MAX_PX   = 1800;
const TOR_FOTO_Q_START  = 0.88;
const TOR_FOTO_Q_MIN    = 0.62;
const TOR_FOTO_TARGET   = 400*1024;   /* target lunak per foto (~400 KB) */
const TOR_FOTO_MAX_MB   = 25;         /* penolakan berkas mentah yang tak masuk akal */
/* Jarak dari teks di atasnya ke foto (ketentuan 7 Agu 2026). Dipasang sebagai
   margin-ATAS; karena paragraf di atasnya bermargin-bawah 6pt dan margin CSS
   bersebelahan MENGGABUNG (ambil yang terbesar), hasil akhirnya tetap 6pt —
   bukan 12pt. */
const TOR_FOTO_JARAK_PT = 6;
/* Berapa baris teks di atas foto yang ikut diboyong bila foto tidak muat di
   sisa halaman. Ketentuan user: "pindahkan dengan teks baris diatasnya".
   Paragraf yang lebih tinggi dari ini dibiarkan terpenggal seperti biasa —
   memboyong paragraf 10 baris hanya demi menemani foto akan meninggalkan
   ruang kosong yang jauh lebih buruk daripada masalah yang diperbaiki. */
const TOR_FOTO_TARIK_BARIS = 3;

/* Benar hanya bila mesin klausul sedang dipinjam dokumen TOR/KAK. Seluruh
   fitur foto di bawah bergantung padanya, sehingga Susun Kontrak (SPK &
   Perjanjian/Kontrak) sama sekali tidak berubah perilakunya. */
function torFotoAktif(){
  try{
    if(typeof spkState!=='undefined' && spkState && spkState.data && spkState.data.__doktype==='TOR') return true;
    /* PENGERASAN 7 Agu 2026 — "foto template Word kadang hilang kadang muncul".
       Penjaga ini dulu HANYA membaca spkState. Padahal tautan spkState->torState
       dilepas oleh tambalan showView() begitu berpindah ke halaman ber-awalan
       'spk-' (lihat bagian 15), sedangkan pustaka klausul yang sedang disunting
       BISA saja masih milik dokumen TOR. Dalam keadaan itu seluruh jalur foto
       mati diam-diam: gambar di berkas .docx tidak pernah dibaca dan paragrafnya
       malah berubah menjadi baris kosong — tanpa satu pun pesan galat, sehingga
       berkas yang sama kadang membawa fotonya kadang tidak.

       Pemeriksaan cadangan memakai IDENTITAS OBJEK: pustaka yang sedang aktif
       harus benar-benar array milik torState. showView() menukarnya dengan
       spkKlDefault() saat melepas tautan, jadi pustaka Susun Kontrak tidak akan
       pernah lolos di sini. */
    if(typeof torState!=='undefined' && torState && torState.data &&
       typeof records_klausul!=='undefined' && records_klausul &&
       records_klausul === torState.data.__klausulLib) return true;
  }catch(e){}
  return false;
}
function torFotoUid(){
  try{ if(window.crypto && crypto.randomUUID) return crypto.randomUUID(); }catch(e){}
  return Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);
}
function torFotoUrl(path){
  var p=String(path||'').replace(/^\/+/,''); if(!p) return '';
  return TOR_FOTO_BASE + '/' + encStoragePath(p);
}
/* Kunci objek dari sebuah URL foto-tor (untuk penghapusan). '' bila bukan
   milik bucket ini. */
function torFotoPathDariUrl(url){
  var u=String(url||'');
  if(u.indexOf(TOR_FOTO_BASE+'/')!==0) return '';
  try{ return decodeURIComponent(u.slice(TOR_FOTO_BASE.length+1).split('?')[0]); }
  catch(e){ return ''; }
}

/* ---- Perkecil & kompres ----
   Selalu mempertahankan RASIO dan tidak pernah memperbesar. Kualitas JPEG
   diturunkan bertahap sampai di bawah target ukuran, seperti rhoEncodeCanvas.
   PNG kecil (mis. tangkapan layar berteks tajam) dibiarkan apa adanya karena
   JPEG justru merusaknya. */
function torFotoKompres(file){
  return new Promise(function(resolve){
    var asli={ blob:file, ext:(/png$/i.test(file.type||'')?'png':'jpg') };
    var url;
    try{ url=URL.createObjectURL(file); }catch(e){ resolve(asli); return; }
    var img=new Image();
    img.onload=function(){
      try{
        var w=img.naturalWidth||img.width||1, h=img.naturalHeight||img.height||1;
        var s=Math.min(1, TOR_FOTO_MAX_PX/Math.max(w,h));
        var pngKecil = /png/i.test(file.type||'') && s>=1 && file.size<=TOR_FOTO_TARGET;
        if(pngKecil){ URL.revokeObjectURL(url); resolve(asli); return; }
        var cw=Math.max(1,Math.round(w*s)), ch=Math.max(1,Math.round(h*s));
        var cv=document.createElement('canvas'); cv.width=cw; cv.height=ch;
        var cx=cv.getContext('2d');
        try{ cx.imageSmoothingQuality='high'; }catch(e){}
        /* Latar putih: foto ber-alpha (PNG) yang diubah ke JPEG akan berlatar
           HITAM tanpa ini — JPEG tidak punya kanal alpha. */
        cx.fillStyle='#fff'; cx.fillRect(0,0,cw,ch);
        cx.drawImage(img,0,0,cw,ch);
        var q=TOR_FOTO_Q_START, out=null;
        var coba=function(){
          cv.toBlob(function(bl){
            if(!bl){ URL.revokeObjectURL(url); resolve(asli); return; }
            out=bl;
            if(bl.size>TOR_FOTO_TARGET && q>TOR_FOTO_Q_MIN){
              q=Math.max(TOR_FOTO_Q_MIN, Math.round((q-0.08)*100)/100);
              coba(); return;
            }
            URL.revokeObjectURL(url);
            /* Hasil kompresi yang justru lebih besar dari aslinya dibuang. */
            resolve((out && out.size < file.size) ? { blob:out, ext:'jpg' } : asli);
          }, 'image/jpeg', q);
        };
        coba();
      }catch(err){ try{ URL.revokeObjectURL(url); }catch(e2){} resolve(asli); }
    };
    img.onerror=function(){ try{ URL.revokeObjectURL(url); }catch(e){} resolve(asli); };
    img.src=url;
  });
}
/* ---- KUNCI OBJEK = SIDIK JARI ISINYA (content-addressed) ----
   PERBAIKAN 7 Agu 2026. Dulu kuncinya `<bulan>/<uuid-acak>.<ext>`, sehingga
   FOTO YANG SAMA menghasilkan objek BARU setiap kali disisipkan: menimpa satu
   klausul dengan foto yang sama 4x meninggalkan 4 salinan byte-identik di
   bucket, dan tidak satu pun bisa dikenali sebagai kembaran yang lain.

   Sekarang nama berkas = SHA-256 dari byte yang benar-benar diunggah (hasil
   torFotoKompres, bukan berkas mentah — dua berkas mentah berbeda yang
   terkompres jadi byte yang sama memang layak menjadi satu objek). Isi sama =
   kunci sama, dan r2XhrPut sudah mengirim `x-upsert:true`, jadi unggahan
   berikutnya MENIMPA objek yang sudah ada alih-alih menambah objek baru.
   Efek sampingnya menguntungkan: <img src> yang tertulis di klausul pun
   identik, sehingga pustaka klausul tidak lagi menyimpan URL berbeda-beda
   untuk gambar yang sama.

   PENGELOMPOKAN PER BULAN DIGANTI 2 HURUF PERTAMA HASH. Pengelompokan bulan
   akan membatalkan dedup begitu berganti bulan (foto yang sama diunggah 1
   Sept menjadi objek kedua). Dua huruf heksadesimal membagi isi bucket ke
   256 map yang rata dan tetap terbaca, sekaligus membuat dedup berlaku
   SELAMANYA, bukan hanya dalam bulan berjalan.

   CADANGAN. crypto.subtle hanya tersedia di konteks aman (HTTPS/localhost).
   Bila tidak ada, jalur lama (bulan + uid acak) dipakai kembali — lebih baik
   menduplikasi objek daripada menolak unggahan. */
async function torFotoHash(blob){
  try{
    if(!(window.crypto && crypto.subtle && crypto.subtle.digest)) return '';
    var buf = blob.arrayBuffer ? await blob.arrayBuffer()
                               : await new Response(blob).arrayBuffer();
    var dg = await crypto.subtle.digest('SHA-256', buf);
    var b = new Uint8Array(dg), s = '';
    for(var i=0;i<b.length;i++) s += b[i].toString(16).padStart(2,'0');
    return s;
  }catch(e){ return ''; }
}
/* hash -> url, sepanjang sesi. Menekan unggahan berulang untuk foto yang sama
   (mis. satu template .docx yang memuat foto itu di beberapa tempat): tanpa ini
   byte-nya tetap dikirim ulang walau kuncinya sudah sama. */
var TOR_FOTO_SUDAH = Object.create(null);

/* Unggah satu foto -> { path, url }. Melempar bila sesi tidak ada. */
async function torFotoUpload(file){
  if(!(file && file.size)) throw new Error('Berkas foto kosong.');
  if(file.size > TOR_FOTO_MAX_MB*1024*1024)
    throw new Error('Ukuran foto melebihi '+TOR_FOTO_MAX_MB+' MB.');
  if(typeof fkAuthToken==='function' && !fkAuthToken())
    throw new Error('Sesi berkas tidak tersedia — silakan login ulang.');
  var kecil=await torFotoKompres(file);
  var hash=await torFotoHash(kecil.blob);
  var path;
  if(hash){
    var sudah=TOR_FOTO_SUDAH[hash];
    if(sudah) return sudah;                       /* byte identik -> objek yang sudah ada */
    path=TOR_FOTO_PREFIX+hash.slice(0,2)+'/'+hash+'.'+kecil.ext;
  }else{
    var d=new Date();
    var bulan=d.getFullYear()+String(d.getMonth()+1).padStart(2,'0');
    path=TOR_FOTO_PREFIX+bulan+'/'+torFotoUid()+'.'+kecil.ext;
  }
  await r2XhrPut(path, kecil.blob);
  var hasil={ path:path, url:torFotoUrl(path) };
  if(hash) TOR_FOTO_SUDAH[hash]=hasil;
  return hasil;
}

/* ---- Sisipkan ke editor klausul ----
   Paragraf foto dibuat SEBAGAI BLOK TERSENDIRI (<p class="kl0 tor-foto">),
   bukan gambar sebaris di tengah kalimat, karena seluruh aturan ukuran yang
   ditetapkan (batas kiri mengikuti teks di atasnya, batas kanan di margin)
   hanya bermakna untuk blok tersendiri.

   Inden awalnya DISALIN dari paragraf di atas kursor supaya tampilan editor
   sudah mendekati hasil cetak; nilai persisnya dihitung ulang di dokumen oleh
   torFotoFitScript(). */
function torFotoBlokHtml(url){
  return '<p class="kl0 tor-foto"><img src="'+fkEsc(url)+'" alt=""></p>';
}
function torFotoBlokSebelum(node){
  var p=node;
  while(p && !(p.nodeType===1 && /^(P|DIV|LI)$/.test(p.tagName))) p=p.parentNode;
  return p || null;
}
/* Samakan margin kiri paragraf foto dengan KOLOM TEKS paragraf di atasnya.
   Untuk paragraf ber-inden gantung (margin-left = base+W, text-indent = -W),
   kolom teksnya persis di tepi kiri kotak paragraf — jadi yang disalin adalah
   margin-left-nya, dan text-indent dinolkan. */
function torFotoIkutInden(pFoto, pAtas){
  if(!pFoto) return;
  try{
    pFoto.style.textIndent='0';
    pFoto.style.marginTop=TOR_FOTO_JARAK_PT+'pt';
    if(!pAtas) return;
    var cs=window.getComputedStyle(pAtas);
    if(cs && cs.marginLeft) pFoto.style.marginLeft=cs.marginLeft;
  }catch(e){}
}
function torFotoSisipkanHtml(url){
  var doc=document.getElementById('spk-we-doc'); if(!doc) return;
  var html=torFotoBlokHtml(url);
  try{ doc.focus(); }catch(e){}
  var sel=window.getSelection();
  var acuan=null;
  if(sel && sel.rangeCount && doc.contains(sel.getRangeAt(0).commonAncestorContainer))
    acuan=torFotoBlokSebelum(sel.getRangeAt(0).startContainer);
  var ok=false;
  try{ ok=document.execCommand('insertHTML', false, html); }catch(e){ ok=false; }
  if(!ok){
    var tmp=document.createElement('div'); tmp.innerHTML=html;
    var p=tmp.firstChild;
    if(acuan && acuan.parentNode) acuan.parentNode.insertBefore(p, acuan.nextSibling);
    else doc.appendChild(p);
  }
  /* Paragraf foto yang baru masuk = yang belum pernah ditandai. */
  var baru=doc.querySelector('p.tor-foto:not([data-torf])');
  if(baru){
    baru.setAttribute('data-torf','1');
    torFotoIkutInden(baru, baru.previousElementSibling || acuan);
  }
  try{ spkWECount(); }catch(e){}
  try{ spkWEPaginateSoon(); }catch(e){}
}
/* Tombol "Sisipkan Foto" pada toolbar editor klausul. */
function torFotoPilih(){
  if(!torFotoAktif()){ toast('Sisip foto hanya tersedia pada Dokumen TOR/KAK','warn'); return; }
  var inp=document.getElementById('tor-foto-file');
  if(!inp){
    inp=document.createElement('input');
    inp.type='file'; inp.id='tor-foto-file'; inp.accept='image/*'; inp.multiple=true;
    inp.style.display='none';
    inp.addEventListener('change', function(ev){
      var fs=Array.prototype.slice.call((ev.target && ev.target.files) || []);
      ev.target.value='';
      torFotoTerima(fs);
    });
    document.body.appendChild(inp);
  }
  inp.click();
}
/* Jalur bersama tombol Sisipkan Foto & tempel (Ctrl+V). */
async function torFotoTerima(files){
  var fs=(files||[]).filter(function(f){ return f && /^image\//i.test(f.type||''); });
  if(!fs.length){ toast('Tidak ada gambar yang bisa disisipkan','warn'); return; }
  for(var i=0;i<fs.length;i++){
    try{
      var hasil=await withActionLoader('Mengunggah foto'+(fs.length>1?(' '+(i+1)+'/'+fs.length):''),
        function(){ return torFotoUpload(fs[i]); });
      torFotoSisipkanHtml(hasil.url);
    }catch(err){
      console.error('torFotoTerima:', err);
      toast('Gagal mengunggah foto: '+errMsg(err),'err');
      return;
    }
  }
  toast(fs.length>1 ? (fs.length+' foto disisipkan') : 'Foto disisipkan','ok');
}

/* ===================== 10c. BoQ SELALU UTUH DALAM SATU HALAMAN =====================
   KETENTUAN 6 Agu 2026: "BoQ ditampilkan di satu halaman penuh; apabila tidak
   muat, dialihkan ke halaman berikutnya".

   Paginator (spkPageScript) sudah punya mekanismenya: blok ber-kelas `spk-keep`
   diperlakukan ATOM — tidak pernah dipenggal, dan bila sisa ruang di halaman
   berjalan tidak cukup, seluruhnya dipindah ke halaman berikutnya.

   MENGAPA KELASNYA DIPASANG LEWAT SKRIP, BUKAN LANGSUNG DI HTML.
   Pada paginator itu, blok atom yang ternyata LEBIH TINGGI daripada satu
   halaman tidak punya jalan keluar: ia ditempel apa adanya ke lembar kosong
   (lihat cabang `if(kosong())` di put()), sedangkan badan lembar ber-
   `overflow:hidden` — jadi kelebihannya TERPOTONG DIAM-DIAM. Untuk BoQ, itu
   berarti baris-baris terakhir beserta rekap & tanda tangannya bisa raib tanpa
   peringatan — bahaya nyata pada dokumen pengadaan.

   Karena itu tinggi blok DIUKUR dulu di peramban:
     muat dalam satu halaman  -> diberi `spk-keep` (pindah utuh, sesuai
                                 permintaan);
     lebih tinggi dari halaman -> `spk-keep` DILEPAS, blok kembali boleh
                                 terpenggal seperti sebelumnya — kepala tabel
                                 diulang di halaman lanjutan dan rekap +
                                 tanda tangan tetap menyatu (tbody.hps-tail
                                 sudah atom sejak semula).

   Tinggi halaman dihitung dengan rumus yang SAMA PERSIS dengan spkPageScript:
   246,2mm (A4 dikurangi margin 2,54cm) + 26,8mm yang direbut kembali oleh
   margin negatif kop/kaki, dikurangi tinggi kop & kaki berjalan.

   Skrip ini WAJIB diletakkan SEBELUM spkPageScript di dalam <body>: keduanya
   menunggu document.fonts.ready, dan callback promise berjalan menurut urutan
   pendaftaran — jadi pengukuran di sini selalu selesai sebelum halaman dipecah. */
function torBoqFitScript(){
  var js=[
    '(function(){',
    'var SUDAH=false;',
    'function mm2px(mm){var d=document.createElement("div");',
    ' d.style.cssText="position:absolute;visibility:hidden;left:-9999px;height:"+mm+"mm";',
    ' document.body.appendChild(d);var h=d.getBoundingClientRect().height;',
    ' d.parentNode.removeChild(d);return h;}',
    'function jalan(){',
    ' if(SUDAH) return;',
    ' try{',
    '  var bq=document.querySelectorAll(".spk-doc .tor-boq");',
    '  if(!bq.length){ SUDAH=true; return; }',
    /* 246,2 + 26,8 — lihat PH & EXPK di spkPageScript */
    '  var PH=mm2px(273);',
    '  if(!PH||PH<200) return;',                       /* CSS/font belum siap: tunggu panggilan berikutnya */
    '  var hh=0, fh=0;',
    '  var sec=document.querySelector(".spk-doc .spk-page.spk-flow");',
    '  if(sec){',
    '   var run=sec.querySelector("table.spk-run");',
    '   if(run){',
    '    var th=run.querySelector("thead > tr > td"), tf=run.querySelector("tfoot > tr > td");',
    '    if(th) hh=th.getBoundingClientRect().height;',
    '    if(tf) fh=tf.getBoundingClientRect().height;',
    '   }',
    '  }',
    /* CADANGAN 8mm. Tinggi kop & kaki di sini diukur dari sel <td> di dalam
       table.spk-run, sedangkan paginator memakai tinggi <div class="sh-hd/ft">
       hasil salinan sel itu — keduanya berdekatan tapi tidak identik (terukur
       selisih ~18px pada BoQ yang panjangnya pas-pasan, dan blok itu lalu
       terpotong diam-diam). Ambang sengaja dibuat PELIT: salah menilai "tidak
       muat" hanya membuat BoQ terpenggal seperti perilaku lama, sedangkan
       salah menilai "muat" berarti barisnya hilang dari dokumen. */
    '  var muat=PH-hh-fh-6-mm2px(8);',
    '  for(var i=0;i<bq.length;i++){',
    '   var h=bq[i].getBoundingClientRect().height;',
    '   if(h>0 && h<=muat) bq[i].classList.add("spk-keep");',
    '   else bq[i].classList.remove("spk-keep");',
    '  }',
    '  SUDAH=true;',
    ' }catch(e){ SUDAH=true; try{ console.error("tor boq fit:", e); }catch(_){} }',
    '}',
    'function pasang(){',
    ' try{',
    '  if(document.fonts && document.fonts.ready && document.fonts.ready.then){',
    '   document.fonts.ready.then(jalan);',
    '   setTimeout(jalan, 2900);',                     /* cadangan, mendahului 3000ms milik paginator */
    '   return;',
    '  }',
    ' }catch(e){}',
    ' jalan();',
    '}',
    'if(document.readyState==="loading") window.addEventListener("load", pasang); else pasang();',
    '})();'
  ].join('\n');
  return '<scr'+'ipt>'+js+'</scr'+'ipt>';
}

/* ===================== 10d. PENUTUP SELALU MENEMANI TANDA TANGAN =====================
   KETENTUAN 6 Agu 2026: "jika bagian tanda tangan terpisah di halaman sendiri,
   maka Bab III. PENUTUP ikut bergeser bersamanya ke halaman itu."

   MASALAHNYA. Blok tanda tangan (.tor-ttd) sudah ber-kelas `spk-keep`, jadi ia
   tidak pernah terpenggal — bila sisa lembar tidak cukup, SELURUHNYA turun ke
   lembar berikutnya. Tetapi Bab III PENUTUP di atasnya adalah blok terpisah dan
   biasanya pendek, sehingga ia tetap tertinggal di dasar lembar sebelumnya:
   lembar terakhir lalu berisi tanda tangan SENDIRIAN — persis yang tidak
   dikehendaki.

   CARANYA. Sebelum halaman dipecah, klausul bab terakhir (.tor-akhir) dan blok
   tanda tangan DIBUNGKUS menjadi SATU <div class="spk-keep">. Bagi paginator
   bungkus itu satu blok utuh: kalau muat ia tetap di lembar berjalan, kalau
   tidak keduanya turun BERSAMA. Tidak ada logika baru yang ditambahkan ke
   paginator.

   MENGAPA DIUKUR DULU, TIDAK LANGSUNG DIBUNGKUS DI HTML. Alasannya sama persis
   dengan torBoqFitScript: pada spkPageScript, blok atom yang LEBIH TINGGI
   daripada satu lembar ditempel apa adanya ke lembar kosong, sedangkan badan
   lembar ber-`overflow:hidden` — kelebihannya TERPOTONG DIAM-DIAM. Bab Penutup
   yang panjang (mis. beberapa klausul) bisa saja tidak muat bersama tanda
   tangan; dalam keadaan itu pembungkusnya TIDAK dipasang sama sekali, dan
   keduanya kembali berperilaku seperti sebelumnya (tanda tangan tetap utuh
   berkat `spk-keep` miliknya sendiri).

   DAFTAR ISI TIDAK TERGANGGU. nomorToc() mencari `.spk-clause:not(.spk-cont)`
   dengan querySelectorAll — pencarian KETURUNAN, bukan anak langsung — sehingga
   klausul yang berpindah ke dalam pembungkus tetap terhitung, tetap pada urutan
   yang sama, dan tetap terbaca sebagai isi lembar tempat pembungkus itu berada.

   Skrip ini WAJIB berjalan SEBELUM spkPageScript. Keduanya menunggu
   document.fonts.ready dan callback promise dijalankan menurut urutan
   pendaftaran, jadi cukup dengan menaruh <script> ini lebih dulu di <body>. */
function torAkhirKeepScript(){
  var js=[
    '(function(){',
    'var SUDAH=false;',
    'function mm2px(mm){var d=document.createElement("div");',
    ' d.style.cssText="position:absolute;visibility:hidden;left:-9999px;height:"+mm+"mm";',
    ' document.body.appendChild(d);var h=d.getBoundingClientRect().height;',
    ' d.parentNode.removeChild(d);return h;}',
    'function jalan(){',
    ' if(SUDAH) return;',
    ' try{',
    '  var sec=document.querySelector(".spk-doc .spk-page.spk-flow");',
    '  if(!sec){ SUDAH=true; return; }',
    '  var ttd=sec.querySelector(".tor-ttd");',
    '  var awal=sec.querySelector(".spk-clause.tor-akhir");',
    '  if(!ttd || !awal){ SUDAH=true; return; }',
    /* Keduanya HARUS bersaudara-kandung di wadah yang sama; bila tidak,
       memindahkannya berarti mengubah susunan dokumen — lebih baik mundur. */
    '  if(awal.parentNode!==ttd.parentNode){ SUDAH=true; return; }',
    /* Kumpulkan berurutan dari klausul bab terakhir sampai blok tanda tangan.
       Ditelusuri lewat nextElementSibling (bukan querySelectorAll) supaya yang
       terbawa PASTI bersambung — tidak ada unsur asing yang terlewat di
       tengahnya, dan tidak ada yang tertinggal di lembar sebelumnya. */
    '  var isi=[], n=awal, aman=0;',
    '  while(n && aman++<200){ isi.push(n); if(n===ttd) break; n=n.nextElementSibling; }',
    '  if(isi[isi.length-1]!==ttd){ SUDAH=true; return; }',
    /* 246,2 + 26,8 — lihat PH & EXPK di spkPageScript, sama dengan torBoqFitScript */
    '  var PH=mm2px(273);',
    '  if(!PH||PH<200) return;',                       /* CSS/font belum siap: tunggu panggilan berikutnya */
    '  var hh=0, fh=0;',
    '  var run=sec.querySelector("table.spk-run");',
    '  if(run){',
    '   var th=run.querySelector("thead > tr > td"), tf=run.querySelector("tfoot > tr > td");',
    '   if(th) hh=th.getBoundingClientRect().height;',
    '   if(tf) fh=tf.getBoundingClientRect().height;',
    '  }',
    /* Cadangan 8mm — alasannya sama dengan torBoqFitScript: tinggi kop & kaki
       di sini diukur dari <td> table.spk-run, sedangkan paginator memakai
       salinannya (.sh-hd/.sh-ft) yang tidak persis sama. Ambangnya PELIT:
       salah menilai "tidak muat" hanya membuat Penutup tetap seperti perilaku
       lama, sedangkan salah menilai "muat" berarti isinya terpotong. */
    '  var muat=PH-hh-fh-6-mm2px(8);',
    '  var atas=isi[0].getBoundingClientRect().top;',
    '  var bawah=ttd.getBoundingClientRect().bottom;',
    '  var h=bawah-atas;',
    '  if(h>0 && h<=muat){',
    '   var box=document.createElement("div");',
    '   box.className="spk-keep tor-akhir-keep";',
    '   isi[0].parentNode.insertBefore(box, isi[0]);',
    '   for(var i=0;i<isi.length;i++) box.appendChild(isi[i]);',
    '  }',
    '  SUDAH=true;',
    ' }catch(e){ SUDAH=true; try{ console.error("tor akhir keep:", e); }catch(_){} }',
    '}',
    'function pasang(){',
    ' try{',
    '  if(document.fonts && document.fonts.ready && document.fonts.ready.then){',
    '   document.fonts.ready.then(jalan);',
    '   setTimeout(jalan, 2900);',                     /* cadangan, mendahului 3000ms milik paginator */
    '   return;',
    '  }',
    ' }catch(e){}',
    ' jalan();',
    '}',
    'if(document.readyState==="loading") window.addEventListener("load", pasang); else pasang();',
    '})();'
  ].join('\n');
  return '<scr'+'ipt>'+js+'</scr'+'ipt>';
}


/* ===================== 10e. UKURAN & POSISI FOTO DI DOKUMEN =====================
   ATURAN yang ditetapkan (7 Agu 2026), diterapkan seluruhnya di sini:

     batas KIRI  = batas kiri TEKS paragraf di atasnya. Bila paragraf itu
                   bernomor, yang diikuti adalah TEKSNYA, bukan nomornya.
     batas KANAN = margin kanan halaman.
     jarak ATAS  = 6 pt dari teks di atasnya.
     batas BAWAH = mengikuti rasio asli foto.

   MENGAPA "batas kiri paragraf" SAMA DENGAN "kolom teksnya".
   Paragraf bernomor di dokumen ini memakai inden GANTUNG: margin-left =
   base + W (W = lebar kotak nomor) dan text-indent = -W. Artinya kotak
   paragraf mulai di kolom TEKS, sedangkan nomor menjulur ke kiri keluar dari
   kotak itu lewat text-indent negatif. Jadi getBoundingClientRect().left
   sebuah paragraf SUDAH merupakan kolom teksnya — nomor tidak pernah ikut
   terhitung. Hal yang sama berlaku untuk paragraf ber-inden baris pertama
   (klp): baris kedua dan seterusnya rata di tepi kotak.

   MENGAPA DIUKUR DI PERAMBAN, BUKAN DIHITUNG DI CSS.
   Lebar kotak nomor tidak tetap: ia dihitung ulang per deret oleh
   spkKisiScript/spkPkIndentStd sesuai nomor terlebar di deret itu. Nilai
   akhirnya baru ada setelah gaya & font termuat, jadi satu-satunya sumber
   yang benar adalah pengukuran nyata. Karena itu skrip ini WAJIB diletakkan
   SESUDAH spkKisiScript dan SEBELUM spkPageScript: ketiganya menunggu
   document.fonts.ready dan callback promise berjalan menurut urutan
   pendaftaran.

   BATAS KANAN & RASIO. Lebar foto dibatasi max-width:100% terhadap paragraf
   yang tepi kirinya sudah digeser ke kolom teks — sisi kanan paragraf itu
   sendiri adalah margin kanan halaman. Tinggi dibiarkan auto sehingga rasio
   asli terjaga: foto yang lebih sempit dari ruang yang tersedia TIDAK
   diregangkan sampai mentok margin (sesuai ketentuan), foto yang lebih lebar
   diperkecil proporsional.

   TIDAK MUAT DI SISA HALAMAN -> PINDAH BERSAMA TEKS DI ATASNYA.
   Foto beserta paragraf di atasnya dibungkus <div class="spk-keep">, yang oleh
   paginator (spkPageScript -> atom()) diperlakukan sebagai satu blok utuh:
   bila sisa ruang tidak cukup, seluruhnya turun ke lembar berikutnya.

   DUA PENGAMAN yang tidak boleh dilepas:
   (a) Paragraf di atasnya hanya ikut diboyong bila TINGGINYA WAJAR (<= ±3
       baris). Memboyong paragraf sepuluh baris hanya demi menemani foto akan
       meninggalkan lubang kosong yang jauh lebih buruk daripada masalah yang
       sedang diperbaiki.
   (b) Blok ber-spk-keep yang LEBIH TINGGI dari satu halaman ditempel apa
       adanya ke lembar kosong oleh paginator, sedangkan badan lembar
       ber-overflow:hidden — kelebihannya TERPOTONG DIAM-DIAM. Karena itu
       tinggi diukur lebih dulu; foto yang melampaui tinggi halaman DIPERKECIL
       (max-height) sampai muat, dan pembungkus keep baru dipasang setelah
       dipastikan cukup. Lebih baik foto sedikit lebih kecil daripada sebagian
       gambarnya hilang tanpa peringatan. */
function torFotoDocCss(){
  return (
  /* text-indent dipaksa 0: paragraf foto bisa mewarisi inden gantung dari
     kelas kl1/kl2 yang tersalin saat disisipkan di editor. */
  '.spk-cl p.tor-foto{margin-top:'+TOR_FOTO_JARAK_PT+'pt;text-indent:0;text-align:left}'+
  '.spk-cl p.tor-foto img{display:block;width:auto;height:auto;max-width:100%}'+
  /* Kotak nomor tidak pernah relevan pada paragraf foto. */
  '.spk-cl p.tor-foto span.n{display:none}'+
  '.tor-foto-keep{margin:0;padding:0}'
  );
}
function torFotoFitScript(){
  var js=[
    '(function(){',
    'var SUDAH=false;',
    'var JARAK='+TOR_FOTO_JARAK_PT+';',
    'function mm2px(mm){var d=document.createElement("div");',
    ' d.style.cssText="position:absolute;visibility:hidden;left:-9999px;height:"+mm+"mm";',
    ' document.body.appendChild(d);var h=d.getBoundingClientRect().height;',
    ' d.parentNode.removeChild(d);return h;}',
    'function pt2px(pt){return pt/72*96;}',
    /* Blok pemilik gambar = leluhur terdekat yang menjadi anak langsung .spk-cl
       (atau paragraf tempat gambar berada, mana yang lebih dulu ditemui). */
    'function blokOf(img, cl){',
    ' var n=img.parentNode;',
    ' while(n && n!==cl && n.parentNode!==cl) n=n.parentNode;',
    ' return (n && n!==cl) ? n : null;',
    '}',
    /* Teks blok TANPA menghitung gambar. Blok yang masih berisi kalimat
       dibiarkan apa adanya: aturan ukuran ini hanya untuk foto yang berdiri
       sebagai blok tersendiri. */
    'function adaTeks(b){ return !!String(b.textContent||"").replace(/[\\s\\u00A0]/g,""); }',
    /* Saudara SEBELUMNYA yang benar-benar tampil (lewati blok kosong & foto). */
    'function sebelum(b){',
    ' var p=b.previousElementSibling;',
    ' while(p){',
    '  if(!(p.classList&&p.classList.contains("tor-foto")) && p.getBoundingClientRect().height>0.5) return p;',
    '  p=p.previousElementSibling;',
    ' }',
    ' return null;',
    '}',
    'function jalan(){',
    ' if(SUDAH) return;',
    ' try{',
    '  var doc=document.querySelector(".spk-doc"); if(!doc){ SUDAH=true; return; }',
    '  var imgs=doc.querySelectorAll(".spk-cl img");',
    '  if(!imgs.length){ SUDAH=true; return; }',
    /* Tinggi halaman: 246,2 + 26,8 mm — rumus yang sama dengan spkPageScript,
       torBoqFitScript, dan torAkhirKeepScript. */
    '  var PH=mm2px(273);',
    '  if(!PH||PH<200) return;',                       /* gaya belum siap -> tunggu panggilan berikutnya */
    '  var sec=doc.querySelector(".spk-page.spk-flow");',
    '  var hh=0, fh=0;',
    '  var run=sec?sec.querySelector("table.spk-run"):null;',
    '  if(run){',
    '   var th=run.querySelector("thead > tr > td"), tf=run.querySelector("tfoot > tr > td");',
    '   if(th) hh=th.getBoundingClientRect().height;',
    '   if(tf) fh=tf.getBoundingClientRect().height;',
    '  }',
    /* Cadangan 8mm: kop & kaki di sini diukur dari <td> table.spk-run,
       sedangkan paginator memakai salinannya (.sh-hd/.sh-ft) yang tidak persis
       sama tingginya. Ambang sengaja PELIT — salah menilai "muat" berarti
       gambar terpotong diam-diam. */
    '  var MUAT=PH-hh-fh-6-mm2px(8);',
    '  var MINKEEP=mm2px(14);',                        /* ±3 baris, patokan yang sama dengan paginator */
    '  var daftar=[], i;',
    '  for(i=0;i<imgs.length;i++){',
    '   var im=imgs[i];',
    '   var cl=im.closest?im.closest(".spk-cl"):null; if(!cl) continue;',
    '   var b=blokOf(im, cl); if(!b) continue;',
    '   if(adaTeks(b)) continue;',                     /* gambar menyatu dengan kalimat -> jangan diusik */
    '   if(b.classList) b.classList.add("tor-foto");',
    '   if(daftar.indexOf(b)<0) daftar.push(b);',
    '  }',
    '  for(i=0;i<daftar.length;i++){',
    '   var blok=daftar[i];',
    '   var gb=blok.querySelector("img"); if(!gb) continue;',
    '   gb.style.display="block"; gb.style.width="auto"; gb.style.height="auto";',
    '   gb.style.maxWidth="100%"; gb.style.maxHeight="none";',
    '   blok.style.textIndent="0";',
    '   blok.style.marginTop=JARAK+"pt";',
    /* --- BATAS KIRI --- */
    '   blok.style.marginLeft="0px";',
    '   var alam=blok.getBoundingClientRect().left;',   /* tepi kiri alami di dalam .spk-cl */
    '   var atas=sebelum(blok);',
    '   var kolom=atas?atas.getBoundingClientRect().left:alam;',
    '   var geser=kolom-alam;',
    '   if(!(geser>0.5)) geser=0;',
    '   blok.style.marginLeft=geser.toFixed(2)+"px";',
    /* --- BATAS BAWAH: rasio dijaga; hanya diperkecil bila melampaui halaman --- */
    '   var ruang=MUAT-pt2px(JARAK);',
    '   if(ruang>40 && gb.getBoundingClientRect().height>ruang){',
    '    gb.style.maxHeight=Math.floor(ruang)+"px";',
    '   }',
    /* --- PINDAH BERSAMA TEKS DI ATASNYA --- */
    '   var pasangan=null;',
    '   if(atas && atas.parentNode===blok.parentNode && atas.getBoundingClientRect().height<=MINKEEP)',
    '    pasangan=atas;',
    '   var mulai=pasangan||blok;',
    '   var tinggi=blok.getBoundingClientRect().bottom-mulai.getBoundingClientRect().top;',
    '   if(pasangan && tinggi>MUAT){ pasangan=null; mulai=blok;',
    '    tinggi=blok.getBoundingClientRect().bottom-blok.getBoundingClientRect().top; }',
    '   if(tinggi>0 && tinggi<=MUAT){',
    '    var box=document.createElement("div");',
    '    box.className="spk-keep tor-foto-keep";',
    '    mulai.parentNode.insertBefore(box, mulai);',
    '    if(pasangan) box.appendChild(pasangan);',
    '    box.appendChild(blok);',
    '   }',
    '  }',
    '  SUDAH=true;',
    ' }catch(e){ SUDAH=true; try{ console.error("tor foto fit:", e); }catch(_){} }',
    '}',
    'function pasang(){',
    ' try{',
    '  if(document.fonts && document.fonts.ready && document.fonts.ready.then){',
    '   document.fonts.ready.then(jalan);',
    '   setTimeout(jalan, 2900);',                     /* cadangan, mendahului 3000ms milik paginator */
    '   return;',
    '  }',
    ' }catch(e){}',
    ' jalan();',
    '}',
    'if(document.readyState==="loading") window.addEventListener("load", pasang); else pasang();',
    '})();'
  ].join('\n');
  return '<scr'+'ipt>'+js+'</scr'+'ipt>';
}

/* ---- Dokumen lengkap ----
   Pipeline & KISI INDEN dipakai ulang dari Surat Perintah Kerja (bungkus
   .spk-doc.spk-spk), sehingga inden klausul TOR = inden SPK. */
function torDocHtml(data, klausul, opts){
  data=data||{}; klausul=klausul||[]; opts=opts||{};
  /* ---- MODE FOKUS (7 Agu 2026) ----
     opts.focusId diisi -> hanya SATU klausul yang dirakit, tanpa sampul, daftar
     isi, penutup, dan tanda tangan. Dipakai popup "Lihat Klausul" pada dokumen
     TOR/KAK.

     KUNCINYA: `klausul` yang masuk tetap DAFTAR PENUH. Nomor bab/klausul
     (torStruktur) dan kisi lebar kotak nomor (wKl/wBab) dihitung dari daftar
     penuh itu, lalu hanya blok yang dipilih yang ikut dikeluarkan — sehingga
     nomor & inden di pratinjau klausul PERSIS sama dengan di dokumen. Dulu
     popup ini memakai spkClauseDocHtml milik Susun Kontrak yang menomori
     klausul secara berurut 1,2,3... sehingga "II.1." tampil sebagai "7.". */
  const fokus=(opts.focusId!=null) ? String(opts.focusId) : null;
  const ctx=spkBuildCtx(data);
  /* Peta bab/nomor dokumen ini — dipakai bersama daftar isi (torTocHtml). */
  const str=torStruktur(klausul);
  /* Titik tolak inden isi = lebar kotak nomor judul dokumen ini (dinamis).
     Diukur dari label TERPANJANG ("II.10." dst), bukan dari jumlah klausul,
     karena label TOR bukan lagi angka tunggal. */
  const wKl  = torBoxW(str.filter(s=>!s.lebur).map(s=>s.no+'.'), '1.');
  const wBab = torBoxW(str.filter(s=>s.awal||s.lebur).map(s=>s.rom+'.'), 'I.');
  try{ SPK_JH_OVR = wKl; }catch(e){ SPK_JH_OVR=0; }
  /* spkRenumberKlausul SENGAJA TIDAK dipakai di sini: fungsi itu menulis ulang
     butir "X.Y" mengikuti NOMOR URUT klausul, sementara pada TOR/KAK nomor
     klausul berbentuk "II.3" dan butir di dalamnya bernomor mulai 1 lagi
     (persis lampiran TOR Word). Nomor butir dibiarkan apa adanya dari template. */
  const pre=klausul.map((k,i)=> spkKvGroup(spkKlItalicAsing(spkBoldPihak(spkNomorToNo(spkNumberFix(spkTidyKeyValue(
      torIndenParagraf(spkStripFontStyle(spkPruneKlausul(spkMerge(
        torIsOverview(k.judul) ? torTanpaTebal(spkSortDefinisiIf(k.judul, k.isi||''))
                               : spkSortDefinisiIf(k.judul, k.isi||''),
        ctx), str[i].urut, data)))
    )))))));
  try{ SPK_HANG_OVR = spkKumpulHang(pre.map(function(x){ try{ return spkPkBoxMark(x); }catch(e2){ return x; } })); }
  catch(e){ SPK_HANG_OVR=null; }
  /* Judul bab dibungkus .spk-clause tersendiri (bukan sekadar <div> bebas) agar
     seluruh perlakuan paginator untuk judul klausul otomatis berlaku juga
     padanya: tidak pernah tertinggal sendirian di dasar lembar, dan ikut
     terhitung saat nomor halaman daftar isi diisi. */
  const babHead=(s)=>'<div class="spk-cl-h tor-babh"><span class="n" data-no="'+fkEsc(s.rom)+'."></span>'+
    fkEsc(s.babNama)+'</div>';
  const clauses=klausul.map((k,i)=>{
    const s=str[i];
    if(fokus!=null && String(k.id)!==fokus) return '';
    let inner=torKlTidy(pre[i]);
    /* ---- Klausul BILL OF QUANTITY ----
       Isinya dibangkitkan seluruhnya dari RAB (torBoqBlokHtml), sehingga selalu
       mengikuti RAB tanpa perlu menempel gambar lagi.

       TEKS KLAUSULNYA SENDIRI TIDAK IKUT KE DOKUMEN (ketentuan 6 Agu 2026:
       "hapus tulisan Sesuai RAB (tanpa nilai)"). Penyusun bebas menulis catatan
       di klausul itu pada template Word (mis. "Data mengikuti dokumen Bill of
       Quantity.xlsx"); catatannya tetap tersimpan di pustaka klausul dan tetap
       terbaca di template .docx maupun di "Lihat Klausul", tetapi TIDAK pernah
       masuk ke badan dokumen.

       DIBUANG, BUKAN SEKADAR DISEMBUNYIKAN (perbaikan 6 Agu 2026). Percobaan
       pertama membungkusnya dengan .tor-boq-nota ber-display:none. Tampilannya
       memang benar, tetapi teks itu masih ada di DOM — dan itu merusak NOMOR
       HALAMAN DAFTAR ISI: saat blok BoQ pindah ke lembar berikutnya, cangkang
       .spk-clause yang ditinggalkan di lembar sebelumnya masih berisi teks
       catatan, sehingga tidak terhapus oleh pembersih cangkang kosong di
       paginator dan tetap terhitung oleh nomorToc() — daftar isi menunjuk
       lembar yang salah (BoQ tertulis hal. 1 padahal tercetak di hal. 2).
       Dengan teksnya benar-benar tidak diikutkan, cangkang itu kosong,
       terhapus sendiri, dan nomor daftar isi kembali tepat.

       Bila RAB masih kosong, teks klausul TETAP dicetak seperti biasa supaya
       klausulnya tidak tampil kosong sama sekali. */
    let klBoq=false;
    if(torIsBoq(k.judul)){
      let blok='';
      try{ blok=torBoqBlokHtml(data); }catch(eB){ console.error('torBoqBlokHtml:', eB); }
      if(blok){ inner=blok; klBoq=true; }
    }
    let out='';
    /* .tor-akhir = penanda bahwa klausul ini milik BAB TERAKHIR (III. PENUTUP).
       Dipakai torAkhirKeepScript untuk menyatukannya dengan blok tanda tangan
       — lihat catatan lengkapnya di sana. Ditempelkan ke SEMUA bentuk cangkang
       bab itu (judul bab tersendiri maupun klausulnya) supaya bab yang berisi
       lebih dari satu klausul pun ikut terbawa utuh. */
    const akhir = (s.bab===TOR_BAB.length) ? ' tor-akhir' : '';
    /* Bab I & II: judul bab berdiri sendiri di atas klausul pertamanya. */
    if(s.awal && !s.lebur && fokus==null) out+='<div class="spk-clause tor-babonly'+akhir+'">'+babHead(s)+'</div>';
    /* Bab bertanda `tunggal` yang hanya berisi satu klausul (III. PENUTUP):
       judul klausul DILEBUR jadi judul bab, isinya langsung menempel — sama
       seperti lampiran TOR Word. */
    const head = s.lebur ? babHead(s)
      : '<div class="spk-cl-h"><span class="n" data-no="'+fkEsc(s.no)+'."></span>'+spkFmtJudul(k.judul)+'</div>';
    /* Bab lebur (III. PENUTUP) memakai .tor-babisi; klausul biasa .tor-lv2.
       Keduanya digeser sejauh WB, bedanya hanya asal judulnya. */
    /* .tor-boq-cl = penanda klausul BILL OF QUANTITY. Dipakai torDocCss untuk
       memberi JARAK BAWAH 24 pt ke klausul sesudahnya — lihat catatannya di
       sana (termasuk alasan jaraknya dipasang sebagai margin BAWAH, bukan
       margin atas pada klausul berikutnya). */
    out+='<div class="spk-clause'+(s.lebur?' tor-babisi':' tor-lv2')+(klBoq?' tor-boq-cl':'')+akhir+'">'+head+
      '<div class="spk-cl'+spkLeadIndentCls(inner)+'">'+inner+'</div></div>';
    return out;
  }).join('');
  SPK_HANG_OVR=null; SPK_JH_OVR=0;

  /* Bab PENUTUP: dipakai dari pustaka bila ada klausul di bab terakhir,
     selain itu dibangkitkan otomatis dari teks baku lampiran TOR. */
  const babAkhir=TOR_BAB.length;
  const adaPenutup=str.some(s=>s.bab===babAkhir);
  /* Judul "TERM OF REFERENCE (TOR)/KERANGKA ACUAN KERJA (KAK)" + nomor dokumen
     yang dahulu dicetak di kepala badan dokumen DIBUANG: keduanya sudah tampil
     di sampul dan di kop yang berulang tiap lembar, jadi di sini hanya
     mengulang. Halaman isi kini langsung dibuka oleh judul bab I. */
  const isiBody= fokus!=null ? clauses :
    clauses+
    (adaPenutup ? '' : torPenutupHtml())+
    torTtdHtml(ctx);
  const isi=
    '<section class="spk-page spk-flow" id="spk-flow">'+
      '<table class="spk-run"><thead><tr><td>'+torRunHeadHtml(data)+'</td></tr></thead>'+
      '<tbody><tr><td>'+isiBody+'</td></tr></tbody>'+
      '<tfoot><tr><td>'+torRunFootHtml(data)+'</td></tr></tfoot></table>'+
    '</section>';

  const body='<div class="spk-doc spk-spk">'+
    spkKlItalicAsing((fokus!=null ? '' : (torCoverHtml(data,ctx)+torTocHtml(data,klausul)))+isi)+
  '</div>';

  return '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width, initial-scale=1"><title>&#8203;</title>'+
    (typeof fklDocFontLink==='function'?fklDocFontLink():'')+
    '<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">'+
    '<style>'+
    (typeof fklDocBaseCss==='function'?fklDocBaseCss():'')+
    (typeof hpsExtraDocCss==='function'?hpsExtraDocCss():'')+
    spkDocCss()+spkDocCss2()+spkClHeadCss(klausul.length,false)+torDocCss(wKl, wBab)+torFotoDocCss()+
    '</style></head><body><div id="spk-docs">'+body+'</div>'+
    /* torBoqFitScript & torAkhirKeepScript WAJIB mendahului spkPageScript —
       lihat catatan di masing-masing fungsi. */
    torBoqFitScript()+torAkhirKeepScript()+spkKisiScript()+torFotoFitScript()+spkPageScript()+fklFitScript()+'</body></html>';
}

/* ===================== 11a. KOP & KERANGKA GAYA HPS =====================
   Dokumen RAB dan Pakta Integritas TIDAK memakai mesin dokumen SPK (sampul +
   kop berulang tiap lembar). Keduanya memakai kerangka HPS: satu kop di kepala
   dokumen, lalu isi mengalir. Kopnya MENGAMBIL ULANG potongan yang sama persis
   dengan hpsBuildDocHtml() di app.js \u2014 logo, tiga baris identitas unit, pita
   pemisah, judul + nomor dokumen \u2014 sehingga tiga dokumen ini seragam. */
function torKopHtml(){
  return '<div class="fkl-doc-head">'+
      '<div class="fkl-doc-logo"><img src="'+FKL_LOGO_SRC+'" alt="Logo PLN"></div>'+
      '<div class="fkl-doc-org">'+
        '<div class="l1">PT PLN (PERSERO)</div>'+
        '<div class="l2">UNIT PELAKSANA PELAYANAN PELANGGAN MASOHI</div>'+
        '<div class="l3">Jl. Abdullah Soulissa No 1, Masohi, Kec. Kota Masohi</div>'+
      '</div>'+
    '</div>'+
    '<div class="fkl-doc-band"></div>';
}
/* Blok judul dokumen: judul di tengah + garis bawah + nomor dokumen di bawahnya.
   Memakai kelas bawaan .fkl-doc-title.has-rule dan .fkl-doc-docno supaya garis
   & jaraknya persis sama dengan dokumen cetak lain. Nomor boleh dikosongkan \u2014
   Pakta Integritas memang tidak bernomor pada berkas acuannya. */
function torJudulDokHtml(judul, nomor){
  return '<h1 class="fkl-doc-title has-rule">'+fkEsc(judul)+'</h1>'+
    (nomor ? '<div class="fkl-doc-docno">'+fkEsc(nomor)+'</div>' : '')+
    '<div class="fkl-doc-titlegap"></div>';
}
/* Blok tanda tangan gaya HPS \u2014 dipakai RAB & Pakta Integritas. */
/* CATATAN 6 Agu 2026: sejak blok tanda tangan Pakta Integritas diganti
   (.pi-sign), fungsi ini TIDAK dipakai modul mana pun lagi. Dipertahankan
   karena bentuk dua-kolomnya bisa diperlukan dokumen berikutnya. */
function torTtdHpsHtml(kiri, kanan){
  const esc=fkEsc, sel=(o)=> o ? ('<td><div class="hps-topgap"></div>'+
      '<div class="role">'+esc(o.cap||'')+'</div>'+
      '<div class="role2">'+esc(o.jab||'\u2014')+'</div>'+
      '<div class="gap"></div>'+
      '<div class="nm nm-up">'+esc(String(o.nama||'(..........................)').toUpperCase())+'</div></td>')
    : '<td></td>';
  return '<table class="ttd"><tbody><tr>'+sel(kiri)+sel(kanan)+'</tr></tbody></table>';
}

/* Blok tanda tangan RAB \u2014 FORMASI-nya mengikuti dokumen TOR/KAK
   (lihat torTtdHtml): tanggal rata tengah di atas kolom kanan, lalu tabel
     baris 1 : "Diperiksa oleh;" (Direksi)  +  "Disusun oleh;" (Pengawas)
     baris 2 : "Disahkan oleh;" (Pengguna) di TENGAH
   Bila Pengawas Pekerjaan tidak ada, baris 1 menyusut jadi satu penanda
   tangan "Disusun oleh;" milik Direksi \u2014 persis aturan di torTtdHtml.
   Yang dipakai ulang dari gaya HPS hanyalah TAMPILAN selnya (.hps-topgap /
   .role / .role2 / .gap / .nm) supaya menyatu dengan cetakan RAB; kelas
   .tor-ttd milik mesin dokumen SPK sengaja TIDAK dipakai karena CSS-nya
   tidak ikut termuat pada kerangka dokumen gaya HPS. */
function torTtdRabHtml(data){
  const esc=fkEsc, up=v=>String(v||'').trim().toUpperCase();
  const dirN=up(data.nama_direksi),  dirJ=String(data.jabatan_direksi||'').trim();
  const pgwN=up(data.nama_pengawas), pgwJ=String(data.jabatan_pengawas||'').trim();
  const pguN=up(data.nama_pengguna), pguJ=String(data.jabatan_pengguna||'').trim();
  const adaPgw=!!(pgwN||pgwJ);
  const kol=(cap,jab,nama)=>({cap:cap, jab:jab||'\u2014',
                              nama:nama||'(..........................)'});
  const kosong=(cls)=>({gap:cls});
  /* SATU UNSUR = SATU BARIS, alasannya sama persis dengan torTtdTabel() pada
     TOR/KAK: jabatan dua baris di salah satu kolom tidak boleh membuat nama di
     kolom itu turun sendirian. Kerangkanya ditulis ulang di sini (bukan memakai
     torTtdTabel) karena nama kelasnya berbeda — RAB menumpang gaya sel milik
     HPS (.hps-topgap/.role/.role2/.gap/.nm), bukan gaya .tor-ttd. */
  const tabel=(cls,kolom)=>{
    const baris=(isi)=>'<tr>'+kolom.map(function(k){
        return k.gap ? '<td class="kosong '+k.gap+'"></td>'
                     : '<td class="sisi">'+isi(k)+'</td>';
      }).join('')+'</tr>';
    return '<table class="ttd ttd3 '+cls+'"><tbody>'+
      baris(k=>'<div class="hps-topgap"></div>')+
      baris(k=>'<div class="role">'+esc(k.cap)+'</div>')+
      baris(k=>'<div class="role2">'+esc(k.jab)+'</div>')+
      baris(k=>'<div class="gap"></div>')+
      baris(k=>'<div class="nm nm-up">'+esc(k.nama)+'</div>')+
    '</tbody></table>';
  };
  const atas = adaPgw
    ? tabel('ttd-a', [kol('Diperiksa oleh;',dirJ,dirN), kosong('celah'), kol('Disusun oleh;',pgwJ,pgwN)])
    : tabel('ttd-a', [kosong('sisi2'), kol('Disusun oleh;',dirJ,dirN)]);
  const bawah = tabel('ttd-b', [kosong('tepi'), kol('Disahkan oleh;',pguJ,pguN), kosong('tepi')]);
  const tgl=TOR_KOTA_TTD+', '+(typeof spkDateLong==='function'?spkDateLong(data.tgl_dokumen):'');
  return '<div class="rab-ttd">'+
    '<div class="ttd-date rab-tgl">'+esc(tgl)+'</div>'+
    atas+bawah+'</div>';
}

/* ===================== 11d. DOKUMEN RAB =====================
   Tabel & rekapnya SENGAJA dibuat sebangun dengan cetakan HPS (hpsBuildDocHtml)
   supaya dua dokumen itu terbaca sebagai satu keluarga: sembilan kolom dengan
   baris nomor rumus (7 = 4 x 5, 8 = 4 x 6, 9 = 7 + 8), rekap Jumlah / DPP /
   PPn 12% / Jumlah Total, terbilang, lalu tanda tangan \u2014 semuanya di dalam
   <tbody class="hps-tail"> agar tidak pernah terpisah dari angkanya.

   Bedanya dengan HPS: blok "Data Pekerjaan" hanya memuat Nama Pekerjaan dan
   Lokasi Pekerjaan. Angka-angkanya dihitung memakai fungsi HPS yang sama, jadi
   RAB dan HPS mustahil berbeda hasil. */
function torRabDocHtml(data){
  data=data||{};
  const esc=fkEsc;
  const items=(Array.isArray(data.__rab)?data.__rab:[]).slice(0,
      Math.max(1, parseInt(data.jumlah_bj,10)||((Array.isArray(data.__rab)&&data.__rab.length)||1)));
  const cfg={
    judulOn:    String(data.rab_judul_on||'')==='Ya',
    judulNum:   String(data.rab_judul_num||''),
    subjudulOn: String(data.rab_subjudul_on||'')==='Ya',
    subjudulNum:String(data.rab_subjudul_num||'')
  };
  const infoRow=(k,v)=>'<tr><td class="k">'+k+'</td><td class="s">:</td>'+
    '<td class="v" style="text-align:justify">'+esc(v||'-')+'</td></tr>';
  /* Baris judul / sub-judul memakai penelusur yang sama dengan HPS (jsWalk),
     sehingga gaya penomoran yang dipilih di langkah 1 berlaku identik. */
  const grpRow=(cls,no,txt,it)=>{
    if(!it) return '<tr class="'+cls+'"><td class="no">'+esc(no)+'</td>'+
      '<td class="gname" colspan="8">'+esc(txt)+'</td></tr>';
    return '<tr class="'+cls+' has-val"><td class="no">'+esc(no)+'</td>'+
      '<td class="gname ur">'+esc(txt)+'</td>'+
      '<td class="st">'+esc(String(it.sat||'-'))+'</td>'+
      '<td class="vl">'+esc(String(jsVolDoc(it.vol)))+'</td>'+
      '<td class="num">'+hpsRpDoc(it.hargaMat)+'</td>'+
      '<td class="num">'+hpsRpDoc(it.hargaJasa)+'</td>'+
      '<td class="num">'+hpsRpDoc(hpsItemMat(it))+'</td>'+
      '<td class="num">'+hpsRpDoc(hpsItemJasa(it))+'</td>'+
      '<td class="num tot">'+hpsRpDoc(hpsItemTotal(it))+'</td></tr>';
  };
  let bodyRows='';
  jsWalk(items, cfg, {
    judul:(no,txt,it)=>{ bodyRows+=grpRow('grp',no,txt,it); },
    sub:  (no,txt,it)=>{ bodyRows+=grpRow('grp sub',no,txt,it); },
    item: (noInGroup,it,idx)=>{
      bodyRows+='<tr>'+
        '<td class="no">'+noInGroup+'</td>'+
        '<td class="ur">'+esc((it.uraian&&String(it.uraian).trim())?it.uraian:('Barang/Jasa '+(idx+1)))+'</td>'+
        '<td class="st">'+esc(String(it.sat||'-'))+'</td>'+
        '<td class="vl">'+esc(String(jsVolDoc(it.vol)))+'</td>'+
        '<td class="num">'+hpsRpDoc(it.hargaMat)+'</td>'+
        '<td class="num">'+hpsRpDoc(it.hargaJasa)+'</td>'+
        '<td class="num">'+hpsRpDoc(hpsItemMat(it))+'</td>'+
        '<td class="num">'+hpsRpDoc(hpsItemJasa(it))+'</td>'+
        '<td class="num tot">'+hpsRpDoc(hpsItemTotal(it))+'</td></tr>';
    }
  });
  const sm=hpsSummary({items:items});
  const sumRow=(lbl,mat,jasa,tot,cls)=>'<tr class="sum'+(cls?' '+cls:'')+'">'+
    '<td class="sum-lbl" colspan="6">'+lbl+'</td>'+
    '<td class="num">'+hpsRpDoc(mat)+'</td><td class="num">'+hpsRpDoc(jasa)+'</td>'+
    '<td class="num">'+hpsRpDoc(tot)+'</td></tr>';
  const ttdRow='<tr class="ttd-row"><td colspan="9">'+torTtdRabHtml(data)+'</td></tr>';
  const _cw=jsHpsColPct(items, cfg, jsHpsHargaPct(String(hpsRpDoc(sm.totT)||'').length));
  /* Kolom TERAKHIR ("Jumlah Total (Rp)") dilebarkan tersendiri, tidak ikut
     `_cw.hg` yang dipakai kelima kolom harga. Sebabnya `jsHpsHargaPct` mengukur
     dari PANJANG ANGKA, jadi pada nilai kecil ia turun ke lantai 9% (~61px) —
     terlalu sempit untuk tulisan "Jumlah Total" sehingga judulnya pecah tiga
     baris ("Jumlah / Total / (Rp)"). Yang dikehendaki: "Jumlah Total" SATU
     baris dengan "(Rp)" di bawahnya (pemenggalan hanya dari <br>).
     TOR_RAB_JT_MIN = perkiraan lebar "Jumlah Total" pada font tebal 8,7px
     (~12 huruf x 5,4px) + padding sel 10px + garis 2px, dibagi lebar isi
     dokumen ~680px. Tambahannya diambil dari kolom Uraian Pekerjaan. */
  const _jt = Math.max(_cw.hg, TOR_RAB_JT_MIN);
  const _ur = Math.max(14, Math.round((_cw.ur - (_jt - _cw.hg))*10)/10);
  const tbl='<table class="hps-doc-tbl">'+
    '<colgroup><col style="width:'+_cw.no+'%"><col style="width:'+_ur+'%"><col style="width:'+_cw.sat+'%">'+
      '<col style="width:'+_cw.vol+'%"><col style="width:'+_cw.hg+'%"><col style="width:'+_cw.hg+'%">'+
      '<col style="width:'+_cw.hg+'%"><col style="width:'+_cw.hg+'%"><col style="width:'+_jt+'%"></colgroup>'+
    '<thead>'+
      '<tr><th class="no" rowspan="2">No</th><th class="ur" rowspan="2">Uraian Pekerjaan</th>'+
        '<th class="st" rowspan="2">Sat</th><th class="vl" rowspan="2">Vol</th>'+
        '<th colspan="2">Harga Satuan</th><th colspan="2">Jumlah Harga</th>'+
        '<th class="jt" rowspan="2">Jumlah Total<br>(Rp)</th></tr>'+
      '<tr><th>Barang (Rp)</th><th>Jasa (Rp)</th><th>Barang (Rp)</th><th>Jasa (Rp)</th></tr>'+
      '<tr class="numh"><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td>'+
        '<td>7 = 4 x 5</td><td>8 = 4 x 6</td><td>9 = 7 + 8</td></tr>'+
    '</thead><tbody>'+bodyRows+'</tbody>'+
    '<tbody class="hps-tail">'+
      sumRow('Jumlah', sm.jM, sm.jJ, sm.jT)+
      sumRow('DPP', sm.dppM, sm.dppJ, sm.dppT)+
      sumRow('PPn 12%', sm.ppnM, sm.ppnJ, sm.ppnT)+
      sumRow('Jumlah Total', sm.totM, sm.totJ, sm.totT, 'grand')+
      '<tr class="terb"><td colspan="9"><b>Terbilang :</b> '+esc(hpsTerbilangRupiah(sm.totT))+'</td></tr>'+
      ttdRow+
    '</tbody></table>';
  /* Urutan halaman RAB (permintaan 6 Agu 2026 \u2014 TANPA penanda bagian A/B):
       kop \u2192 judul dokumen di tengah + garis bawah + nomor
           \u2192 Nama & Lokasi Pekerjaan \u2192 tabel rincian.
     Dua baris '.fkl-sec-h' ("A Data Pekerjaan" & "B Uraian Pekerjaan &
     Rincian Harga") DIBUANG: dokumen ini hanya punya satu bagian, jadi
     penomoran bagian justru membingungkan. */
  const isi='<div class="fkl-doc pnw-doc hps-doc">'+
    torKopHtml()+
    '<div class="rab-jd">'+torJudulDokHtml('RENCANA ANGGARAN BIAYA (RAB)', torNoDok(data,'RAB'))+'</div>'+
    '<table class="fkl-info rab-info"><tbody>'+
      infoRow('Nama Pekerjaan', data.nama_pekerjaan)+
      infoRow('Lokasi Pekerjaan', data.lokasi_pekerjaan)+
    '</tbody></table>'+
    tbl+
  '</div>';
  const _ttdW=torTtdCols();
  return fklDocShell(hpsExtraDocCss()+
    '.rab-jd{margin:16px 0 4px}'+
    /* Jarak dari baris NOMOR DOKUMEN ke baris "Nama Pekerjaan" (ketentuan
       6 Agu 2026: "ditambahkan jaraknya sedikit biar kelihatan rapi").
       Sebelumnya 6px sehingga nomor dokumen tampak menempel ke blok data
       pekerjaan di bawahnya. */
    '.rab-jd .fkl-doc-titlegap{height:'+TOR_RAB_GAP_NODOK+'px}'+
    /* Jarak Nama/Lokasi Pekerjaan ke tabel rincian */
    'table.fkl-info.rab-info{margin-bottom:12px}'+
    /* --- Tanda tangan formasi TOR/KAK pada cetakan RAB ---
       Digambar sebagai DUA tabel (.ttd-a atas, .ttd-b bawah), lihat torTtdCols.
       KEKHUSUSAN adalah inti bagian ini: app.js memasang
         `tr.ttd-row .ttd td{width:50%}`                (0,2,1)
         `tr.ttd-row .ttd-date{...;margin:0 0 6px}`     (0,2,1)
       Selektor di bawah sengaja dibuat lebih khusus dari itu — kalau tidak,
       lebar sel & `margin-left:auto` pada baris tanggal DIABAIKAN diam-diam
       dan tata letaknya balik jadi tiga kolom sama rata. */
    'tr.ttd-row .ttd.ttd3{table-layout:fixed;width:100%}'+
    /* Tepi dalam menarik kedua blok tanda tangan (dan baris tanggal) ke tengah
       lembar RAB yang lebar — lihat TOR_TTD_RAB_TEPI. Karena semua lebar di
       bawah dinyatakan dalam persen, isinya menyusut proporsional dan letak
       tanggal tetap berimpit dengan kolom "Disusun oleh". */
    'tr.ttd-row .rab-ttd{padding-left:'+TOR_TTD_RAB_TEPI+'%;padding-right:'+TOR_TTD_RAB_TEPI+'%}'+
    /* ---- RUANG BUBUH TANDA TANGAN: SAMA DENGAN TOR/KAK ----
       KETENTUAN 6 Agu 2026 (lihat TOR_TTD_RUANG_CM). Aturan bawaan datang
       dari hpsExtraDocCss() di app.js: `.hps-foot .gap,tr.ttd-row .gap`
       (kekhususan 0,2,0) setinggi 66px = 1,75cm, DITAMBAH padding atas 5px
       pada nama penanda tangan. Dua-duanya ditimpa di sini dengan selektor
       yang lebih khusus (0,3,0, memakai .rab-ttd) supaya:
         - hanya cetakan RAB yang berubah — dokumen HPS & Analisa Harga
           Satuan yang menumpang aturan yang sama TIDAK ikut tergeser;
         - jaraknya PERSIS TOR_TTD_RUANG_CM, bukan sekian cm + 5px. */
    'tr.ttd-row .rab-ttd .gap{height:'+TOR_TTD_RUANG_CM+'cm}'+
    'tr.ttd-row .rab-ttd .nm{padding-top:0}'+
    'tr.ttd-row .ttd.ttd3 td.sisi{width:'+_ttdW.w+'%}'+
    'tr.ttd-row .ttd.ttd3 td.celah{width:'+_ttdW.celah+'%}'+
    'tr.ttd-row .ttd.ttd3 td.tepi{width:'+_ttdW.tepi+'%}'+
    'tr.ttd-row .ttd.ttd3 td.sisi2{width:'+_ttdW.sisi2+'%}'+
    'tr.ttd-row .ttd.ttd3 td.kosong{padding:0}'+
    'tr.ttd-row .ttd.ttd3.ttd-b{margin-top:10px}'+
    /* Tempat & tanggal rata tengah DI ATAS kolom kanan, sama seperti TOR/KAK. */
    'tr.ttd-row .rab-ttd .rab-tgl{text-align:center;width:'+_ttdW.w+'%;'+
      'margin-left:auto;margin-right:0}'+
    /* "Jumlah Total" satu baris; satu-satunya pemenggalan datang dari <br>
       sebelum "(Rp)". Menimpa aturan bawaan thead th{overflow-wrap:break-word}. */
    'table.hps-doc-tbl thead th.jt{white-space:nowrap;overflow-wrap:normal;word-break:keep-all}', isi);
}

/* ===================== 11b. PAKTA INTEGRITAS =====================
   Dua dokumen dari SATU cetakan yang sama; yang membedakan hanya penanda
   tangan & kotak centang mana yang dicontreng:
     peran 'pengguna' -> Pengguna Barang/Jasa (nama/jabatan/NIP Pengguna)
     peran 'direksi'  -> Direksi Pekerjaan    (nama/jabatan/NIP Direksi)
   Seluruh isinya diambil dari data yang SUDAH masuk di langkah 1, kecuali
   "Perkiraan Pekerjaan" yang diambil dari JUMLAH TOTAL RAB (langkah 4) karena
   angka itu lebih mutakhir daripada taksiran awal. Bila RAB masih kosong,
   nilainya jatuh kembali ke Perkiraan Nilai Pekerjaan pada langkah 1. */
const TOR_PI_PERAN = [
  ['perencana','Pejabat Perencana Pengadaan'],
  ['pelaksana','Pejabat Pelaksana Pengadaan'],
  ['direksi',  'Direksi Pekerjaan'],
  ['pengguna', 'Pengguna Barang/Jasa']
];
const TOR_PI_KOMITMEN = [
  'Mematuhi seluruh ketentuan Sistem Manajemen Anti Penyuapan (SMAP), termasuk namun tidak terbatas pada SNI ISO 37001:2025, peraturan perundang-undangan yang berlaku, serta kebijakan internal perusahaan terkait anti penyuapan, gratifikasi, konflik kepentingan, dan pengadaan barang/jasa.',
  'Tidak melakukan, tidak menjanjikan, tidak menawarkan, dan tidak memberikan suap, gratifikasi ilegal, komisi, hadiah, atau bentuk keuntungan tidak sah lainnya, baik secara langsung maupun tidak langsung, kepada pihak mana pun yang terkait dengan proyek ini.',
  'Tidak menerima atau meminta suap, gratifikasi ilegal, hadiah, fasilitas, atau keuntungan apa pun yang dapat mempengaruhi atau patut diduga mempengaruhi independensi, objektivitas, dan profesionalitas sebelum, selama / setelah proses pengadaan barang/jasa.',
  'Menghindari dan mengungkapkan konflik kepentingan, baik yang bersifat aktual, potensial, maupun yang dapat dipersepsikan, dengan menyampaikan secara tertulis kepada atasan langsung dan/atau fungsi kepatuhan apabila terdapat hubungan pribadi, keuangan, atau kepentingan lain dengan penyedia atau pihak terkait proyek.',
  'Menjamin proses pengadaan dilaksanakan secara transparan, objektif, adil, dan akuntabel, berdasarkan prinsip value for money, kepatuhan, dan integritas.',
  'Tidak menyalahgunakan kewenangan, jabatan, atau informasi yang dimiliki untuk kepentingan pribadi, keluarga, kelompok, atau pihak lain.',
  'Melaporkan setiap indikasi pelanggaran SMAP, termasuk dugaan penyuapan, gratifikasi, kecurangan, atau pelanggaran etika lainnya yang diketahui selama proses proyek melalui mekanisme Whistleblowing System (WBS) perusahaan.',
  'Bersedia bekerja sama dalam proses audit, monitoring, dan investigasi yang dilakukan oleh Perusahaan melalui auditor internal sesuai kewenangannya.',
  'Bertanggung jawab secara pribadi atas kebenaran pernyataan ini dan memahami bahwa pelanggaran terhadap Pakta Integritas ini dapat dikenakan sanksi disiplin pegawai sesuai ketentuan yang berlaku.'
];
const TOR_PI_TUTUP = [
  'Pakta Integritas ini saya tandatangani dengan penuh kesadaran, tanpa paksaan dari pihak mana pun, sebagai bentuk komitmen pribadi terhadap penerapan integritas dan pencegahan penyuapan dalam setiap proyek.',
  'Pakta Integritas ini berlaku sejak tanggal ditandatangani dan menjadi bagian yang tidak terpisahkan dari dokumen proyek/paket pekerjaan yang bersangkutan.'
];
/* ---- KERTAS, MARGIN & HURUF PAKTA INTEGRITAS ----
   KETENTUAN 6 Agu 2026: Pakta Integritas memakai huruf yang SAMA dengan isi
   klausul TOR/KAK — jenis maupun ukurannya — serta kertas A4 bermargin normal.

   Sebelumnya dokumen ini mewarisi kerangka cetak umum: huruf 'Plus Jakarta Sans'
   (lihat .fkl-doc di index.html) dengan margin 15mm kiri-kanan & 12mm atas-bawah,
   sedangkan isi klausul TOR/KAK memakai Inter 11pt bermargin 2,54cm. Dua dokumen
   dari satu paket pengadaan jadi terlihat berbeda huruf.

   Aman ditulis sebagai penimpaan biasa: fklDocShell() menghasilkan BERKAS HTML
   MANDIRI untuk tiap dokumen, dan CSS ini hanya disisipkan pada berkas Pakta
   Integritas — dokumen lain (RAB, HPS, Jadwal, Form Kelengkapan, dsb.) tidak
   tersentuh sama sekali.

   Muka huruf Inter DITANAM ulang lewat spkInterFontFace() karena berkas ini
   dokumen terpisah yang tidak mewarisi <style> halaman aplikasi — persis
   sebagaimana torDocHtml melakukannya untuk TOR/KAK. */
/* Jarak antar-baris blok "label : nilai" — berlaku untuk KEDUA blok
   (Nama/NIP/Jabatan dan Satuan Kerja s.d. No. PRK), pt. */
/* JARAK BAKU seluruh dokumen Pakta Integritas (pt): antar-baris "label :
   nilai", antar-paragraf, antar-butir komitmen, dan jarak tiap blok ke blok
   berikutnya. Ketentuan 6 Agu 2026: "semua jarak ini 6 pt" — jadi satu tetapan
   ini saja yang menentukan, tidak ada lagi angka piksel tersebar. */
const TOR_PI_JARAK_BARIS_PT = 6;
/* Jarak PEMISAH BLOK pada Pakta Integritas (pt). Ketentuan 6 Agu 2026:
   "line spacing before/after menjadi 12 pt" untuk blok pilihan peran —
     before : sebelum baris "dalam hal ini sebagai :"
     after  : sesudah pilihan terakhir ("Pengguna Barang/Jasa")
   Dipakai HANYA untuk memisahkan blok itu dari bagian di atas & bawahnya.
   Jarak antar-baris di DALAM blok (keempat pilihan peran) sengaja TIDAK ikut —
   pengguna meminta "spacing teks-teks di gambar tetap seperti ini". */
const TOR_PI_JARAK_BLOK_PT = 12;
/* Margin KIRI-KANAN lembar Pakta Integritas (mm) = padding `.spk-page` pada isi
   klausul TOR/KAK, supaya lebar kolom teks kedua dokumen persis sama. */
const TOR_PI_MARGIN_MM = 25.4;
/* Margin ATAS-BAWAH lembar Pakta Integritas (mm).
   KETENTUAN 6 Agu 2026: "margin atas dan bawah saja pada Pakta Integritas
   mengikuti margin atas dan bawah pada Form Pembukaan Penawaran". Form itu
   memakai kerangka cetak umum `.fkl-sheet` yang ber-padding 12mm atas-bawah
   (lihat fklSheetCss() di app.js), jadi angka di bawah HARUS sama dengannya.
   Margin kiri-kanan TIDAK ikut berubah — tetap 25,4mm mengikuti TOR/KAK. */
const TOR_PI_MARGIN_TB_MM = 12;
/* Jeda kotak nomor -> teks pada daftar komitmen (cm). SENGAJA lebih longgar
   dari SPK_NUM_GAP milik TOR/KAK (ketentuan 6 Agu 2026: "penomoran pada Pakta
   Integritas agak sedikit jauh dari teksnya"). Lebar kotak nomor & inden blok
   "label : nilai" ikut terhitung dari angka ini, jadi cukup diubah di sini. */
const TOR_PI_NUM_GAP_CM = 0.30;
/* INDEN BLOK BERNOMOR (cm) — jarak kolom NOMOR dari margin kiri.
   KETENTUAN 6 Agu 2026: "inden penomoran pada Pakta Integritas terlalu ke
   kanan, geser sedikit ke kiri". Sebelumnya nilai ini dipinjam dari
   SPK_PK_LEAD_JUDUL milik TOR/KAK; sekarang jadi tetapan sendiri supaya bisa
   digeser tanpa menyentuh dokumen lain. 0 = nomor lurus dengan tepi kiri
   paragraf pengantar "Dengan ini saya menyatakan dan berkomitmen untuk:".
   Naikkan angkanya bila suatu saat ingin dijorokkan lagi. */
const TOR_PI_INDEN_CM = 0;
/* Ruang kosong untuk membubuhkan tanda tangan, antara baris "Masohi, <tanggal>"
   dan nama penanda tangan (pt). Dilonggarkan 6 Agu 2026 ("berikan sedikit ruang
   dari baris Masohi, tanggal ke nama pegawai"). */
const TOR_PI_TTD_TINGGI_PT = 66;
/* Jarak dari paragraf penutup terakhir ke baris "Masohi, <tanggal>" (pt).
   Semula 14px (~10,5pt) — hampir sama dengan jarak antar-paragraf biasa,
   sehingga blok tanda tangan terlihat menempel pada kalimat di atasnya.
   Ketentuan 6 Agu 2026: "berikan sedikit jarak antara teks terakhir dengan
   Masohi". Satuannya pt (bukan px) supaya seirama dengan jarak lain di
   dokumen ini yang memang memakai pt. */
const TOR_PI_JARAK_TTD_PT = 22;
function torPiKertasCss(){
  var LH=(typeof spkLHCss==='function') ? (spkLHCss(1.15)||'1.39') : '1.39';
  /* Lebar kotak nomor diukur dengan fungsi yang SAMA dengan spkNumberFix pada
     TOR/KAK; hanya jedanya yang dilonggarkan (TOR_PI_NUM_GAP_CM). */
  var GAP=TOR_PI_NUM_GAP_CM;
  var W=Math.round((0.26+GAP)*100)/100;
  try{ if(typeof spkNumTokWidthCm==='function')
        W=Math.max(0.4, Math.round((spkNumTokWidthCm('1.')+GAP)*100)/100); }catch(e){}
  /* M = margin kiri-kanan, MT = margin atas-bawah (dua-duanya beda sumber,
     lihat tetapannya). BD = tinggi badan lembar = 297mm - margin atas - bawah. */
  var M=TOR_PI_MARGIN_MM, MT=TOR_PI_MARGIN_TB_MM, BD=Math.round((297-2*MT)*100)/100;
  /* Inden kolom NOMOR diambil dari tetapan sendiri (TOR_PI_INDEN_CM), bukan
     lagi dari SPK_PK_LEAD_JUDUL milik TOR/KAK — lihat catatan pada tetapannya. */
  var LEAD=TOR_PI_INDEN_CM;
  var KOL=Math.round((LEAD+W)*100)/100;
  /* LEBAR KOLOM LABEL SERAGAM untuk KEDUA blok "label : nilai" (ketentuan
     6 Agu 2026: "titik : pada Nama, NIP dan Jabatan sejajar dengan titik :
     Satuan / Unit Kerja"). Keduanya tabel terpisah, jadi shrink-to-fit
     menghasilkan lebar berbeda \u2014 label terpanjang blok atas cuma "Jabatan".
     Lebarnya dihitung SEKALI dari label TERPANJANG di antara semua label,
     memakai pengukur teks 11pt Inter yang sama dengan mesin inden TOR/KAK,
     lalu dipakai oleh dua-duanya. Menambah/mengubah label cukup di daftar ini. */
  var LABEL=['Nama','NIP','Jabatan','Satuan / Unit Kerja','Nama Pekerjaan',
             'Perkiraan Pekerjaan','No. Anggaran','No. PRK'];
  var WL=4.05;
  try{
    if(typeof spkPkTextWidthCm==='function'){
      var mx=0; LABEL.forEach(function(t){ var w=spkPkTextWidthCm(t); if(w>mx) mx=w; });
      if(mx>0) WL=Math.round((mx+0.18)*100)/100;
    }
  }catch(e){}
  return ''+
    (typeof spkInterFontFace==='function' ? spkInterFontFace() : '')+
    /* --- jenis huruf: seluruh dokumen memakai Inter --- */
    '.fkl-doc,.fkl-doc *{font-family:"Inter Local","Inter","Segoe UI",Arial,sans-serif}'+
    /* --- ukuran & spasi baris ISI = isi klausul TOR/KAK (11pt) ---
       Kop, judul dokumen, dan sub-judul SMAP sengaja TIDAK diikutkan: ketiganya
       elemen kepala yang ukurannya memang dirancang sendiri, sama seperti judul
       klausul pada TOR/KAK yang juga bukan 11pt. */
    '.fkl-doc .pi-p,.fkl-doc .pi-tb td,.fkl-doc .pi-ol li,'+
    '.fkl-doc .pi-ck,.fkl-doc .pi-tgl,.fkl-doc .pi-nm{font-size:11pt;line-height:'+LH+'}'+
    /* --- WARNA HURUF HITAM ---
       Kerangka cetak umum memakai abu-abu kebiruan (#22343a untuk isi, #54666c
       untuk label, #7c8a8f untuk baris alamat). Pada Pakta Integritas seluruh
       tulisan dihitamkan (ketentuan 6 Agu 2026). KOP DIKECUALIKAN: tiga baris
       identitas unit adalah bagian dari kepala surat dan warnanya memang bagian
       dari rancangannya — sama persis dengan dokumen lain yang memakai kop itu. */
    '.fkl-doc,.fkl-doc *{color:#000}'+
    '.fkl-doc .fkl-doc-head .l1{color:#0E7C86}'+
    '.fkl-doc .fkl-doc-head .l2{color:#22343a}'+
    '.fkl-doc .fkl-doc-head .l3{color:#7c8a8f}'+
    /* --- DAFTAR KOMITMEN: GEOMETRI PENOMORAN = TOR/KAK ---
       Ketentuan 6 Agu 2026: "jarak dari penomoran ke teks, inden bertingkat di
       Pakta Integritas sama seperti pada TOR/KAK".

       Pada TOR/KAK tiap butir memakai KOTAK NOMOR selebar W: nomornya
       dirata-KANANkan di dalam kotak dan kotak itu ber-padding-kanan SPK_NUM_GAP,
       sehingga jarak nomor->teks SELALU sama berapa pun lebar angkanya, dan
       baris ke-2 menggantung tepat di bawah huruf pertama (margin-left:W dengan
       text-indent:-W). Di sini pola itu ditiru persis memakai penghitung CSS,
       dengan W & jeda diambil dari fungsi ukur yang SAMA (spkNumTokWidthCm +
       SPK_NUM_GAP) supaya kedua dokumen tidak mungkin berbeda.

       <ol> bawaan tidak dipakai lagi (list-style:none): penanda bawaan peramban
       rata kiri dan jaraknya ke teks ikut melar mengikuti lebar angka. */
    '.fkl-doc .pi-tb{width:calc(100% - '+KOL+'cm);margin-left:'+KOL+'cm;table-layout:fixed}'+
    '.fkl-doc .pi-tb td.l{width:'+WL+'cm;white-space:nowrap}'+
    '.fkl-doc .pi-tb td.s{width:.3cm;white-space:nowrap}'+
    '.fkl-doc .pi-tb td.v{width:auto}'+
    '.fkl-doc .pi-ol{list-style:none;margin:0 0 8px;padding:0}'+
    /* GANTUNGAN DENGAN FLEX (perbaikan 6 Agu 2026: "baris selanjutnya tidak
       sejajar dengan teks baris pertama sesudah penomoran"). Cara lama
       memakai text-indent negatif + kotak ::before inline-block: begitu glif
       nomornya sedikit lebih lebar dari kotaknya, kotak itu MELAR dan baris
       pertama terdorong ke kanan, sementara baris lanjutan tetap di kolom
       lama \u2014 keduanya jadi tidak lurus. Dengan flex, penanda menjadi
       kolom tersendiri berlebar TETAP dan seluruh teks butir (baris pertama
       maupun lanjutannya) berada dalam satu kolom yang sama, jadi mustahil
       melenceng berapa pun lebar angkanya. */
    '.fkl-doc .pi-ol li{margin:0 0 5px;text-align:justify;'+
      'display:flex;align-items:flex-start;'+
      'margin-left:'+KOL+'cm;text-indent:0;padding-left:0}'+
    '.fkl-doc .pi-ol li .pin{'+
      'flex:0 0 '+W+'cm;box-sizing:border-box;width:'+W+'cm;padding-right:'+GAP+'cm;'+
      'text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}'+
    /* --- KERTAS & MARGIN: DISAMAKAN DENGAN ISI KLAUSUL TOR/KAK (6 Agu 2026) ---
       Ketentuan pengguna: "margin pada Pakta Integritas sama seperti pada isian
       klausul TOR/KAK". Lembar isi TOR/KAK adalah `.spk-page.spk-sheet` yang
       ber-padding 25,4mm, sedangkan kerangka cetak umum memakai 12mm/15mm —
       itulah sebabnya baris Pakta Integritas terlihat lebih lebar.

       BACA INI SEBELUM MENGUBAH ANGKANYA. Percobaan terdahulu menaikkan margin
       lewat padding `.fkl-sheet` SAJA, dan hasilnya blok "Masohi, ..." serta
       baris tanda tangan HILANG dari cetakan. Sebabnya: fklPageScript (app.js)
       menghitung tinggi badan lembar dari tetapan `PH=mm2px(273)` (297-12-12)
       lalu memasangnya SEBARIS pada `.fkl-sheet-bd`. Begitu padding lembar
       dinaikkan, kotaknya menyusut tetapi paginator tetap menata isi untuk
       273mm, dan selisihnya terpotong diam-diam oleh `overflow:hidden`.

       KUNCI PERBAIKANNYA: tinggi `.fkl-sheet-bd` ikut diturunkan lewat CSS
       `!important` — yang MENGALAHKAN gaya sebaris buatan paginator. Paginator
       memutuskan lembar penuh lewat `body.scrollHeight > body.clientHeight`,
       jadi ia otomatis mengikuti tinggi baru ini; tak ada satu baris pun app.js
       yang perlu diubah. Padding ATAS+BAWAH lembar + tinggi badan HARUS selalu
       berjumlah 297mm, karena itu keduanya diturunkan dari SATU tetapan yang
       sama: TOR_PI_MARGIN_TB_MM. TOR_PI_MARGIN_MM kini hanya mengatur sisi
       kiri-kanan dan TIDAK ikut menentukan tinggi badan lembar.
       Sisa 6px meniru kelonggaran yang sudah dipakai paginator (PH-6). */
    '.fkl-sheet{padding:'+MT+'mm '+M+'mm !important}'+
    '.fkl-sheet-bd{height:calc('+BD+'mm - 6px) !important}'+
    /* --- BLOK TANDA TANGAN (ketentuan 6 Agu 2026) ---
       Baris "Yang menyatakan," + jabatan DIBUANG. Yang tersisa hanya
       "Masohi, <tanggal>", ruang tanda tangan, lalu NAMA penanda tangan dengan
       HURUF BESAR SEMUA — nama yang sama dengan blok identitas di kepala
       dokumen. `display:table` membuat blok menyusut selebar barisnya yang
       terpanjang, `margin-left:auto` menempelkan sisi kanannya ke margin, dan
       `text-align:center` membuat tanggal & nama lurus satu kolom. */
    '.fkl-doc .pi-sign{display:table;margin:'+TOR_PI_JARAK_TTD_PT+'pt 0 0 auto;text-align:center;'+
      'max-width:100%;'+
      'page-break-inside:avoid;break-inside:avoid}'+
    '.fkl-doc .pi-sign .pi-tgl{text-align:center;margin:0;white-space:nowrap}'+
    '.fkl-doc .pi-ttdgap{height:'+TOR_PI_TTD_TINGGI_PT+'pt}'+
    /* white-space:normal (dulu nowrap) + max-width:100% di atas: NAMA PANJANG
       melipat ke baris berikutnya alih-alih meluber melewati margin kanan.
       Sisi kanan blok TETAP menempel margin (margin-left:auto), dan karena
       "Masohi, <tanggal>" berada di dalam blok yang sama dengan text-align
       center, tanggal itu OTOMATIS ikut bergeser agar rata tengah terhadap
       nama — berapa pun panjang namanya (ketentuan 6 Agu 2026). */
    '.fkl-doc .pi-nm{text-transform:uppercase;white-space:normal;'+
      'overflow-wrap:break-word;word-break:normal}'+
    '';
}

/* Penanda tangan sesuai peran */
function torPiOrang(data, peran){
  const d=data||{};
  if(peran==='direksi') return {nama:d.nama_direksi||'', jab:d.jabatan_direksi||'', nip:d.nip_direksi||''};
  /* Pejabat Pelaksana Pengadaan — dipakai Pakta Integritas pada dokumen SPK &
     Perjanjian/Kontrak. Sumbernya kelompok field "Pejabat Pelaksana Pengadaan"
     pada langkah Data Kontrak (lihat SPK_PLS_KEYS di susun-kontrak.js). */
  if(peran==='pelaksana') return {nama:d.nama_pelaksana||'', jab:d.jabatan_pelaksana||'', nip:d.nip_pelaksana||''};
  return {nama:d.nama_pengguna||'', jab:d.jabatan_pengguna||'', nip:d.nip_pengguna||''};
}
function torPiJudul(peran){
  if(peran==='direksi')   return 'Pakta Integritas Direksi Pekerjaan';
  if(peran==='pelaksana') return 'Pakta Integritas Pejabat Pelaksana Pengadaan';
  return 'Pakta Integritas Pengguna Barang/Jasa';
}
/* Benar bila pakta sedang dibangun untuk dokumen SPK / Perjanjian-Kontrak,
   bukan TOR/KAK. Dibaca dari data yang dikirim, BUKAN dari spkState — satu
   dokumen bisa dicetak dari daftar tanpa pernah dibuka di form. */
function torPiUntukKontrak(data){
  try{ return !!(data && data.__doktype!=='TOR'); }catch(e){ return false; }
}
/* Perkiraan Pekerjaan: utamakan Jumlah Total RAB, mundur ke taksiran awal. */
function torPiNilai(data){
  let n=0;
  try{ const it=(data&&Array.isArray(data.__rab))?data.__rab:[]; if(it.length) n=hpsSummary({items:it}).totT; }catch(e){ n=0; }
  if(!(n>0)) n=spkNum(data&&data.nilai_pekerjaan)||0;
  return n;
}
function torPiDocHtml(data, peran){
  data=data||{};
  const esc=fkEsc, ctx=spkBuildCtx(data), org=torPiOrang(data,peran);
  const rp=(n)=> n>0 ? ('Rp'+Number(n).toLocaleString('id-ID')) : '\u2014';
  /* "Pada hari ini, <Hari>, tanggal <dd> bulan <Bulan> tahun <yyyy>" —
     seluruhnya diturunkan dari Tgl. Dokumen, tidak ada isian baru. */
  const tg=String(data.tgl_dokumen||'').slice(0,10);
  const HARI=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const BLN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  let pembuka='Pada hari ini, \u2014, Saya yang bertanda tangan di bawah ini:';
  if(/^\d{4}-\d{2}-\d{2}$/.test(tg)){
    const dt=new Date(tg+'T00:00:00');
    pembuka='Pada hari ini, '+HARI[dt.getDay()]+', tanggal '+dt.getDate()+
      ' bulan '+BLN[dt.getMonth()]+' tahun '+dt.getFullYear()+', Saya yang bertanda tangan di bawah ini:';
  }
  const brs=(l,v)=>'<tr><td class="l">'+esc(l)+'</td><td class="s">:</td><td class="v">'+v+'</td></tr>';
  const prk=String(data.no_prk||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const cek=TOR_PI_PERAN.map(pr=>'<span class="pi-ck">'+
      '<span class="bx">'+(pr[0]===peran?'\u2611':'\u2610')+'</span>'+esc(pr[1])+'</span>').join('');
  const angg = esc(data.no_anggaran||'\u2014') +
    (data.tgl_anggaran ? '<br>Tanggal, '+esc(spkDateLong(data.tgl_anggaran)) : '');
  const isi='<div class="fkl-doc pnw-doc hps-doc pi-doc">'+
    torKopHtml()+
    torJudulDokHtml('PAKTA INTEGRITAS','')+
    '<div class="pi-sub">SISTEM MANAJEMEN ANTI PENYUAPAN (SMAP)</div>'+
    '<p class="pi-p">'+esc(pembuka)+'</p>'+
    '<table class="pi-tb"><tbody>'+
      brs('Nama', esc(org.nama||'\u2014'))+
      brs('NIP', esc(org.nip||'\u2014'))+
      brs('Jabatan', esc(org.jab||'\u2014'))+
    '</tbody></table>'+
    /* .pi-sbg = penanda baris pengantar blok pilihan peran; dipakai
       torPiKertasCss untuk memberi jarak 12 pt di atasnya. */
    '<p class="pi-p pi-sbg">dalam hal ini sebagai :</p>'+
    '<div class="pi-cks">'+cek+'</div>'+
    '<table class="pi-tb pi-tb2"><tbody>'+
      /* Bentuk RINGKAS (ketentuan 6 Agu 2026): "PT PLN (Persero) UP3 Masohi".
         Nama panjangnya membuat baris ini melipat jadi dua baris sementara
         seluruh baris lain di blok ini cukup satu baris. */
      brs('Satuan / Unit Kerja', esc(ctx.unit_singkat||TOR_SINGKATAN_UNIT||''))+
      brs('Nama Pekerjaan', esc(data.nama_pekerjaan||'\u2014'))+
      /* TIGA BARIS TERAKHIR BERBEDA MENURUT BENTUK DOKUMEN (7 Agu 2026).
         TOR/KAK belum punya kontrak, jadi yang bermakna di sana adalah taksiran
         nilai beserta sumber dananya: Perkiraan Pekerjaan, No. Anggaran, No. PRK.
         Pada SPK & Perjanjian/Kontrak ketiganya sudah tergantikan oleh angka
         dan nomor yang PASTI — persis seperti berkas acuan "PI PJ LAKSDA":
         Nilai Pekerjaan, No. Kontrak, lalu tanggal kontraknya.
         Selebihnya (kop, blok identitas, pilihan peran, 9 butir komitmen, dua
         paragraf penutup, dan blok tanda tangan) SAMA PERSIS untuk keduanya —
         itulah sebabnya satu fungsi ini dipakai bersama, bukan disalin. */
      (torPiUntukKontrak(data)
        ? ( brs('Nilai Pekerjaan', esc(rp(spkNum(data.nilai_pekerjaan)||0)))+
            brs('No. Kontrak', esc(data.nomor_kontrak||'\u2014'))+
            brs('Tanggal', esc(data.tanggal_kontrak?spkDateLong(data.tanggal_kontrak):'\u2014')) )
        : ( brs('Perkiraan Pekerjaan', esc(rp(torPiNilai(data))))+
            brs('No. Anggaran', angg)+
            brs('No. PRK', prk.length?prk.map(esc).join('<br>'):'\u2014') ))+
    '</tbody></table>'+
    '<p class="pi-p">selanjutnya disebut PIHAK YANG MENANDATANGANI PAKTA INTEGRITAS.</p>'+
    '<p class="pi-p">Dengan ini saya menyatakan dan berkomitmen untuk:</p>'+
    /* Nomor ditulis LANGSUNG di markup, bukan lewat penghitung CSS: paginator
       menyalin cangkang <ol> ke lembar lanjutan, dan counter-reset pada salinan
       itu membuat penomoran mulai dari 1 lagi di halaman berikutnya. */
    '<ol class="pi-ol">'+TOR_PI_KOMITMEN.map((t,i)=>'<li><span class="pin">'+(i+1)+'.</span>'+esc(t)+'</li>').join('')+'</ol>'+
    TOR_PI_TUTUP.map(t=>'<p class="pi-p">'+esc(t)+'</p>').join('')+
    /* Blok tanda tangan: tanggal -> ruang tanda tangan -> NAMA (huruf besar).
       Nama diambil dari `org` yang sama dengan blok identitas di kepala
       dokumen, jadi mustahil berbeda dengan baris "Nama" di atas. */
    '<div class="pi-sign">'+
      '<div class="pi-tgl">'+esc(ctx.tempat_tanggal||'')+'</div>'+
      '<div class="pi-ttdgap"></div>'+
      '<div class="pi-nm">'+esc(String(org.nama||'\u2014').toUpperCase())+'</div>'+
    '</div>'+
  '</div>';
  return fklDocShell(hpsExtraDocCss()+torPiKertasCss()+
    /* ---- JUDUL & SUB-JUDUL SATU TINGKAT (ketentuan 6 Agu 2026) ----
       "PAKTA INTEGRITAS" dan "SISTEM MANAJEMEN ANTI PENYUAPAN (SMAP)" adalah
       satu tingkat, jadi UKURAN HURUFNYA SAMA \u2014 sub-judul mewarisi ukuran
       .fkl-doc-title (bukan lagi 11px). Jaraknya: judul -> sub-judul 3 pt,
       sub-judul -> baris berikutnya 12 pt. Garis bawah tetap hanya di bawah
       judul, sesuai rancangan .fkl-doc-title.has-rule. */
    /* Garis bawah pada "PAKTA INTEGRITAS" DIBUANG (ketentuan 6 Agu 2026):
       judul & sub-judul adalah satu kesatuan, garis itu justru memisahkan
       keduanya. padding-bawah bawaan .has-rule ikut dinolkan supaya jarak
       3 pt benar-benar 3 pt. */
    '.fkl-doc .fkl-doc-title.has-rule{margin:0 auto 3pt;border-bottom:0;padding-bottom:0}'+
    /* Blok "label : nilai": menjorok KOL (= kolom teks butir bernomor) supaya
       lurus dengan daftar komitmen, kolom label selebar label TERPANJANG di
       antara KEDUA blok (WL) sehingga titik duanya sebaris, dan sisi kanan
       tabel tetap berhenti di margin. */
    '.fkl-doc .pi-sub{text-align:center;font-weight:800;font-size:19px;'+
      'line-height:1.28;letter-spacing:.6px;text-transform:uppercase;'+
      'margin:0 0 12pt}'+
    '.fkl-doc .fkl-doc-titlegap{height:0}'+
    /* ---- SATU JARAK UNTUK SELURUH DOKUMEN: TOR_PI_JARAK_BARIS_PT (6 pt) ----
       KETENTUAN 6 Agu 2026: "semua jarak ini 6 pt". Sebelumnya tiap blok
       memakai angkanya sendiri dalam PIKSEL dan hasilnya tidak seragam:
         .pi-p     6px = 4,5 pt      .pi-ol li 5px = 3,75 pt
         .pi-cks   9px = 6,75 pt     .pi-tb / .pi-ol 8px = 6 pt (kebetulan pas)
       Sekarang semuanya memakai tetapan yang sama dengan jarak baris
       "label : nilai", ditulis dalam pt supaya nilainya terbaca apa adanya. */
    '.pi-p{margin:0 0 '+TOR_PI_JARAK_BARIS_PT+'pt;text-align:justify}'+
    '.pi-tb{border-collapse:collapse;margin:0 0 '+TOR_PI_JARAK_BARIS_PT+'pt}'+
    /* Jarak antar-baris 6 pt berlaku untuk KEDUA blok "label : nilai"
       (ketentuan 6 Agu 2026: "jarak dari Nama, NIP dan Jabatan masing-masing
       baris adalah 6 pt"). Sebelumnya blok atas dipatok 1px sementara blok
       bawah sudah 6 pt, sehingga keduanya tidak seirama. */
    '.pi-tb td{border:0;padding:0 0 '+TOR_PI_JARAK_BARIS_PT+'pt;vertical-align:top}'+
    /* ---- KOLOM NILAI RATA KIRI-KANAN (ketentuan 6 Agu 2026) ----
       Nilai yang panjang ("Satuan / Unit Kerja", "Nama Pekerjaan") melipat ke
       baris kedua. Dengan rata kiri, baris pertamanya berhenti sebelum margin
       kanan sehingga tepi kanan blok ini terlihat bergerigi dibanding paragraf
       di sekitarnya yang sudah rata kiri-kanan (.pi-p / .pi-ol li).
       Dengan justify, baris yang MELIPAT direnggangkan sampai mentok margin
       kanan; baris terakhir dan baris yang diakhiri <br> (mis. "No. Anggaran"
       yang disusul barisan Tanggal) tetap rata kiri karena begitulah perilaku
       bawaan justify — jadi nilai satu baris seperti "Rp248.418.000" TIDAK
       ikut direnggangkan. Label & titik dua sengaja tidak disentuh. */
    '.pi-tb td.v{text-align:justify}'+
    /* ---- BLOK "Satuan / Unit Kerja" s.d. "No. PRK" ----
       Jarak antar-baris 2 pt, dan kolom ":" DIRAPATKAN ke kiri hingga hampir
       menempel label terpanjang ("Perkiraan Pekerjaan"). Caranya bukan menebak
       lebar dalam cm (label bisa berubah), melainkan width:1% + nowrap pada
       tabel selebar 100%: kolom label MENYUSUT tepat selebar label terpanjang,
       lalu seluruh sisa lebar diberikan ke kolom nilai. Pola yang sama dipakai
       fklDocCssPatch() untuk tabel .fkl-info di dokumen cetak lain. */
    /* Blok "label : nilai" MENJOROK SEDIKIT dari paragraf di atasnya (ketentuan
       6 Agu 2026: "agak sedikit masuk ke kanan ... agar terlihat cantik").
       Besarnya = kolom teks butir bernomor (LEAD + lebar kotak nomor), jadi
       label-labelnya lurus dengan teks daftar komitmen di bawah \u2014 bukan
       angka pilihan bebas. Lebar tabel dikurangi sebanyak itu supaya sisi
       kanannya tetap berhenti tepat di margin. */
    /* (.pi-tb2 tak perlu aturan sendiri lagi: jarak 6 pt sudah di .pi-tb td) */
    /* KETENTUAN 6 Agu 2026: keempat pilihan peran TIDAK lagi dibagi dua kolom
       kiri-kanan (dua baris), melainkan SATU kolom berisi empat baris berurutan
       ke bawah — lebih mudah dibaca dan tanda centangnya sejajar dalam satu
       garis lurus. flex-direction:column menggantikan flex-wrap + flex:0 0 45%. */
    /* `gap` = jarak ANTAR-PILIHAN peran; sengaja tetap rapat (3px) karena
       keempatnya satu kesatuan pilihan, bukan alinea terpisah. Yang diseragamkan
       ke 6 pt adalah jarak blok ini ke bagian berikutnya (margin bawah). */
    /* BLOK PILIHAN PERAN — jarak 12 pt di atas & di bawahnya.
       Jarak ATAS dipasang pada baris pengantarnya (.pi-sbg), bukan pada blok
       ini, supaya kalimat "dalam hal ini sebagai :" ikut terdorong bersama
       daftarnya — keduanya satu kesatuan.
       Margin bawah .pi-tb di atasnya (6 pt) TIDAK ditambahkan: margin blok yang
       bersebelahan MENYATU dan diambil yang terbesar, jadi hasilnya tepat
       12 pt, bukan 18 pt. */
    '.pi-p.pi-sbg{margin-top:'+TOR_PI_JARAK_BLOK_PT+'pt}'+
    '.pi-cks{display:flex;flex-direction:column;align-items:flex-start;'+
      'gap:3px;margin:0 0 '+TOR_PI_JARAK_BLOK_PT+'pt 1cm}'+
    '.pi-ck{flex:0 0 auto;display:flex;gap:6px;align-items:flex-start}'+
    '.pi-ck .bx{font-size:1.15em;line-height:1}'+
    '.pi-ol{margin:0 0 '+TOR_PI_JARAK_BARIS_PT+'pt;padding-left:1.05cm}'+
    '.pi-ol li{margin:0 0 '+TOR_PI_JARAK_BARIS_PT+'pt;text-align:justify}'+
    /* Gaya blok tanda tangan (.pi-sign/.pi-tgl/.pi-ttdgap/.pi-nm)
       ditulis di torPiKertasCss bersama margin lembar. */
    ''
  , isi);
}

/* ===================== 11. PRATINJAU & CETAK ===================== */
let torPreviewData=null, torPreviewKlausul=null;
let torPreviewMode='tor';   /* 'tor' | 'pi-pengguna' | 'pi-direksi' */
function torPreviewCurrent(){
  if(!torState){ toast('Data belum diisi','warn'); return; }
  torSyncNomor();
  const kl=torKlausulDok();
  if(!kl.length){ toast('Belum ada klausul untuk ditampilkan','warn'); return; }
  torPreviewMode='tor';
  torOpenPreview(torState.data, kl);
}
/* Satu pintu untuk seluruh jenis dokumen: pratinjau, Cetak/PDF, dan unduhan PDF
   memakai fungsi ini, sehingga menambah jenis dokumen baru cukup di SATU tempat. */
function torDokHtmlAktif(data, kl){
  if(torPreviewMode==='rab')         return torRabDocHtml(data);
  if(torPreviewMode==='pi-pengguna') return torPiDocHtml(data,'pengguna');
  if(torPreviewMode==='pi-direksi')  return torPiDocHtml(data,'direksi');
  return torDocHtml(data, kl||[]);
}
function torPreviewRecord(id, mode){
  const rec=(records_tor||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  torPreviewMode=mode||'tor';
  torOpenPreview(rec.data||{}, (Array.isArray(rec.klausul)?rec.klausul:[]));
}
function torOpenPreview(data, klausul){
  torPreviewData=data; torPreviewKlausul=klausul;
  const ov=document.getElementById('pn-preview-overlay');
  if(!ov){ torPrint(); return; }
  const mdl=ov.querySelector('.pn-preview-modal'); if(mdl) mdl.classList.remove('is-max');
  if(typeof pnPreviewResetMaxBtn==='function') pnPreviewResetMaxBtn();
  const t=document.getElementById('pn-preview-title');
  const _jd = (torPreviewMode==='pi-pengguna') ? torPiJudul('pengguna')
            : (torPreviewMode==='pi-direksi')  ? torPiJudul('direksi')
            : (torPreviewMode==='rab')         ? 'RAB'
            : 'TOR/KAK';
  if(t) t.textContent='Pratinjau \u2014 '+_jd+': '+((data&&data.no_dokumen)||(data&&data.nama_pekerjaan)||'');
  const body=document.getElementById('pn-preview-body');
  if(body){
    body.classList.add('fkl-preview-body');
    body.innerHTML='<iframe id="fkl-preview-frame" title="Pratinjau TOR/KAK"></iframe>';
    torPreviewRender();
  }
  const actions=document.querySelector('#pn-preview-overlay .pn-preview-head-actions');
  /* Tombol sisipan modul lain dibersihkan lewat penolong bersama di app.js
     (pnPreviewClearActions). Daftar id yang dulu ditulis tangan di sini selalu
     tertinggal begitu ada modul pratinjau baru, sehingga tombol "Cetak / PDF"
     modul sebelumnya tersisa dan tampil dua kali. */
  if(typeof pnPreviewClearActions==='function') pnPreviewClearActions();
  if(actions){
    const btn=document.createElement('button');
    btn.id='tor-preview-print'; btn.className='btn btn-teal';
    btn.style.padding='8px 14px'; btn.style.fontSize='11px';
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>Cetak / PDF';
    /* Teksnya disembunyikan (tombol kini ikon saja, lihat #pn-preview-ikon
       di index.html), jadi judulnya dipindah ke atribut title supaya
       maksudnya tetap terbaca saat disorot. */
    btn.title='Cetak / PDF';
    btn.onclick=function(){ torPrint(); };
    actions.insertBefore(btn, actions.firstChild);
  }
  ov.classList.add('show');
}
function torPreviewRender(){
  const ifr=document.getElementById('fkl-preview-frame'); if(!ifr) return;
  const data=torPreviewData||{}, kl=torPreviewKlausul||[];
  const html=torDokHtmlAktif(data, kl);
  const doc=ifr.contentWindow.document; doc.open(); doc.write(html); doc.close();
  try{
    if(typeof docPdfUpgrade==='function'){
      const nm='TOR-KAK - '+((data&&data.no_dokumen)||(data&&data.nama_pekerjaan)||'');
      docPdfUpgrade('fkl-preview-frame', function(){ return html; }, nm.replace(/[\\/:*?"<>|]/g,'-')+'.pdf');
    }
  }catch(e){ console.warn('torPreviewRender/pdf:', e); }
}
function torPrint(){
  const data=torPreviewData||{}, kl=torPreviewKlausul||[];
  const old=document.getElementById('tor-print-frame'); if(old) old.remove();
  const ifr=document.createElement('iframe'); ifr.id='tor-print-frame'; ifr.setAttribute('aria-hidden','true');
  ifr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(ifr);
  const doc=ifr.contentWindow.document; doc.open(); doc.write(torDokHtmlAktif(data, kl)); doc.close();
  const go=()=>{
    const run=()=>{ try{ ifr.contentWindow.focus(); ifr.contentWindow.print(); }catch(e){ try{ window.print(); }catch(_){} } };
    if(typeof withHiddenPageTitle==='function') withHiddenPageTitle(run); else run();
    setTimeout(()=>{ const f=document.getElementById('tor-print-frame'); if(f) f.remove(); }, 1500);
  };
  let printed=false;
  const goPaged=(sisa)=>{
    if(printed) return;
    let siap=false;
    try{ siap=!!(ifr.contentWindow && ifr.contentWindow.__spkPaged); }catch(e){ siap=true; }
    if(siap||sisa<=0){ printed=true; go(); return; }
    setTimeout(()=>goPaged(sisa-60),60);
  };
  const imgs=doc.images?Array.from(doc.images):[];
  if(imgs.length){ let n=imgs.length; const dec=()=>{ if(--n<=0) setTimeout(()=>goPaged(3000),60); };
    imgs.forEach(im=>{ if(im.complete) dec(); else{ im.onload=dec; im.onerror=dec; } });
    setTimeout(()=>goPaged(3000),1200);
  } else setTimeout(()=>goPaged(3000),120);
}

/* ===================== 12. HALAMAN: DAFTAR DOKUMEN TOR/KAK ===================== */
function openTorView(){
  showView('tor-view','Memuat');
  refreshDataTor().then(()=>{ try{ renderTorView(); }catch(e){ console.error(e); } });
}
function torViewRows(){
  const fs=(document.getElementById('tor-view-search')?.value||'').toLowerCase().trim();
  let rows=(records_tor||[]).slice();
  if(fs) rows=rows.filter(r=>
    String(r.no_dokumen||'').toLowerCase().includes(fs) ||
    String(r.nama_pekerjaan||'').toLowerCase().includes(fs) ||
    String(r.bidang_pelaksana||'').toLowerCase().includes(fs));
  return rows;
}
/* ===================== 11d. KLAUSUL BILL OF QUANTITY (BoQ) =====================
   KETENTUAN 6 Agu 2026. Klausul "II.8 BILL OF QUANTITY (BoQ)" di template Word
   hanya berisi kalimat "Sesuai RAB (tanpa nilai)"; isi sesungguhnya selama ini
   berupa TEMPELAN GAMBAR tangkapan layar berkas BoQ Excel. Akibatnya setiap kali
   RAB diubah, gambar itu harus ditempel ulang — dan bila lupa, TOR mencetak angka
   yang sudah usang.

   Sekarang tabelnya DIBANGKITKAN dari data yang sama dengan berkas BoQ Excel
   (torBoqExcel), jadi klausul ini SELALU mengikuti RAB tanpa perlu disentuh:
     - sumber baris   : data.__rab sepanjang "Jumlah Barang/Jasa" (jumlah_bj)
     - penomoran      : jsWalk + cfg judul/sub-judul yang sama persis
     - harga satuan   : SELALU 0 -> tampil "-" (BoQ = RAB tanpa nilai)
     - rekap          : Jumlah / DPP / PPn 12% / Jumlah Total, semuanya 0
     - terbilang      : mengikuti Jumlah Total (nol)
   Susunan kolom, urutan baris, dan nama judul kolomnya sengaja disalin dari
   torBoqExcel() supaya tabel di TOR dan berkas .xlsx yang diunduh penyedia tidak
   mungkin berbeda. Bila kolom di torBoqExcel diubah, ubah juga di sini.

   TIDAK PERLU KODE ISIAN. Klausulnya dikenali dari JUDULNYA (torIsBoq), lalu
   tabel disisipkan tepat SESUDAH teks klausul. Alasannya: <table> tidak sah
   berada di dalam <p>, sehingga menaruhnya lewat placeholder {{...}} di tengah
   paragraf akan dipecah peramban dan merusak inden klausul. */
function torIsBoq(judul){
  var t=(typeof spkJudulPlain==='function') ? spkJudulPlain(judul) : String(judul||'');
  t=String(t||'').replace(/[\s\u00A0]+/g,' ').trim();
  return /bill\s*of\s*quantity/i.test(t) || /(^|[^a-z])bo\s*q([^a-z]|$)/i.test(t);
}
/* Baris RAB yang ikut tercetak — SAMA dengan torBoqExcel() */
function torBoqItems(data){
  var semua=(data && Array.isArray(data.__rab)) ? data.__rab : [];
  var n=Math.max(1, parseInt((data||{}).jumlah_bj,10) || semua.length || 1);
  return semua.slice(0, n);
}
function torBoqCfg(data){
  var d=data||{};
  return {
    judulOn:    String(d.rab_judul_on||'')==='Ya',
    judulNum:   String(d.rab_judul_num||''),
    subjudulOn: String(d.rab_subjudul_on||'')==='Ya',
    subjudulNum:String(d.rab_subjudul_num||'')
  };
}
function torBoqTabelHtml(data){
  data=data||{};
  var items=torBoqItems(data);
  if(!items.length) return '';
  var esc=fkEsc, cfg=torBoqCfg(data);
  var NOL=hpsRpDoc(0);                       /* "-" (format accounting, sama dgn BoQ .xlsx) */
  /* Baris judul / sub-judul: bila baris itu SEKALIGUS membawa Sat/Vol (item
     tanpa Uraian), kolom angkanya ikut diisi — persis perilaku torBoqExcel. */
  var grpRow=function(cls,no,txt,it){
    if(!it) return '<tr class="'+cls+'"><td class="no">'+esc(no)+'</td>'+
      '<td class="gname" colspan="8">'+esc(txt)+'</td></tr>';
    return '<tr class="'+cls+' has-val"><td class="no">'+esc(no)+'</td>'+
      '<td class="gname ur">'+esc(txt)+'</td>'+
      '<td class="st">'+esc(String(it.sat||'-'))+'</td>'+
      '<td class="vl">'+esc(String(jsVolDoc(it.vol)))+'</td>'+
      '<td class="num">'+NOL+'</td><td class="num">'+NOL+'</td>'+
      '<td class="num">'+NOL+'</td><td class="num">'+NOL+'</td>'+
      '<td class="num tot">'+NOL+'</td></tr>';
  };
  var bodyRows='';
  jsWalk(items, cfg, {
    judul:function(no,txt,it){ bodyRows+=grpRow('grp',no,txt,it); },
    sub:  function(no,txt,it){ bodyRows+=grpRow('grp sub',no,txt,it); },
    item: function(noInGroup,it,idx){
      bodyRows+='<tr>'+
        '<td class="no">'+noInGroup+'</td>'+
        '<td class="ur">'+esc((it.uraian&&String(it.uraian).trim())?it.uraian:('Barang/Jasa '+(idx+1)))+'</td>'+
        '<td class="st">'+esc(String(it.sat||'-'))+'</td>'+
        '<td class="vl">'+esc(String(jsVolDoc(it.vol)))+'</td>'+
        '<td class="num">'+NOL+'</td><td class="num">'+NOL+'</td>'+
        '<td class="num">'+NOL+'</td><td class="num">'+NOL+'</td>'+
        '<td class="num tot">'+NOL+'</td></tr>';
    }
  });
  var sumRow=function(lbl,cls){
    return '<tr class="sum'+(cls?' '+cls:'')+'">'+
      '<td class="sum-lbl" colspan="6">'+esc(lbl)+'</td>'+
      '<td class="num">'+NOL+'</td><td class="num">'+NOL+'</td><td class="num">'+NOL+'</td></tr>';
  };
  /* ---- LEBAR KOLOM: SALINAN PERSIS KISI LEMBAR .xlsx ----
     KETENTUAN 6 Agu 2026: "format BoQ di klausul BoQ dalam TOR/KAK mengikuti
     tampilan BoQ terbaru". Sebelumnya lebar kolom di sini dihitung sendiri oleh
     jsHpsColPct() — cara yang sama dengan cetakan RAB — sehingga tabel di TOR
     dan berkas .xlsx yang diunduh penyedia berbeda proporsi meski isinya sama.

     Sekarang persentase tiap kolom DITURUNKAN dari TOR_BOQ_W, yaitu kisi kolom
     yang dipakai berkas .xlsx itu sendiri (torBoqPct mengubah satuan lebar
     kolom Excel menjadi persen terhadap badan tabel B..K). Jadi menggeser satu
     kolom di TOR_BOQ_W otomatis menggeser kolom yang sama di KEDUA tempat, dan
     keduanya mustahil berbeda lagi. Kolom Uraian = gabungan C+D, sama seperti
     di lembar Excel. */
  var _wNo =torBoqPct(1), _wUr=torBoqPct(2,3), _wSat=torBoqPct(4), _wVol=torBoqPct(5),
      _wHrg=torBoqPct(6), _wTot=torBoqPct(10);
  return ''+
    '<table class="hps-doc-tbl">'+
    '<colgroup><col style="width:'+_wNo+'%"><col style="width:'+_wUr+'%"><col style="width:'+_wSat+'%">'+
      '<col style="width:'+_wVol+'%"><col style="width:'+_wHrg+'%"><col style="width:'+_wHrg+'%">'+
      '<col style="width:'+_wHrg+'%"><col style="width:'+_wHrg+'%"><col style="width:'+_wTot+'%"></colgroup>'+
    '<thead>'+
      /* "No." bertitik — sama persis dengan kepala kolom di lembar .xlsx. */
      '<tr><th class="no" rowspan="2">No.</th><th class="ur" rowspan="2">Uraian Pekerjaan</th>'+
        '<th class="st" rowspan="2">Sat</th><th class="vl" rowspan="2">Vol</th>'+
        '<th colspan="2">Harga Satuan</th><th colspan="2">Jumlah Harga</th>'+
        '<th class="jt" rowspan="2">Jumlah Total<br>(Rp)</th></tr>'+
      '<tr><th>Barang (Rp)</th><th>Jasa (Rp)</th><th>Barang (Rp)</th><th>Jasa (Rp)</th></tr>'+
      '<tr class="numh"><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td>'+
        '<td>7 = 4 x 5</td><td>8 = 4 x 6</td><td>9 = 7 + 8</td></tr>'+
    '</thead><tbody>'+bodyRows+'</tbody>'+
    '<tbody class="hps-tail">'+
      sumRow('Jumlah')+sumRow('DPP')+sumRow('PPn 12%')+sumRow('Jumlah Total','grand')+
      '<tr class="terb"><td colspan="9"><b>Terbilang :</b> '+esc(hpsTerbilangRupiah(0))+'</td></tr>'+
    '</tbody></table>';
}
/* ---- BLOK BoQ UTUH (kop -> judul -> Pekerjaan/Lokasi -> tabel -> tanda tangan) ----
   KETENTUAN 6 Agu 2026: "klausul BoQ bukan hanya tabel tapi keseluruhan seperti
   pada gambar". Yang dimaksud gambar adalah TAMPILAN BERKAS BoQ.xlsx yang selama
   ini ditempel sebagai gambar ke dalam klausul. Jadi seluruh bagian lembar itu
   dibangun ulang di sini, urut & sama persis dengan torBoqExcel():

     (KOP PERUSAHAAN)            — biru, tebal, rata tengah (tempat kop penyedia)
     Bill of Quantity (BoQ)      — tebal, bergaris bawah, rata tengah
     Nama Pekerjaan / Lokasi
     Pekerjaan                   — dua baris "label : nilai"
     tabel rincian               — torBoqTabelHtml()
     blok tanda tangan penyedia  — Kota/Kabupaten,....., Tanggal..... /
                                   Nama Perusahaan / (Nama Lengkap) / Jabatan

   Isinya diambil dari data dokumen yang sama, jadi berubah otomatis mengikuti
   RAB & identitas pekerjaan. Bila susunan di torBoqExcel diubah, ubah juga di
   sini supaya tampilan di TOR dan berkas .xlsx tetap kembar. */
function torBoqBlokHtml(data){
  data=data||{};
  var tbl=torBoqTabelHtml(data);
  if(!tbl) return '';
  var esc=fkEsc;
  /* Baris "label : nilai" — MENIRU LEMBAR .xlsx (ketentuan 6 Agu 2026):
       td.pad  sel kosong selebar kolom B, supaya label mulai sejajar kolom C;
       td.k    label, selebar kolom C dan DIRATAKAN KE KANAN sehingga titik dua
               kedua baris jatuh pada satu garis lurus — di lembar Excel hal ini
               dikerjakan oleh format angka `@\ * ":"`, di sini oleh lebar sel
               yang diambil dari kisi kolom yang sama (lihat .boq-info di
               torDocCss);
       td.v    nilainya, mulai di kolom D dan boleh melipat sampai kolom K. */
  var baris=function(k,v){
    return '<tr><td class="pad"></td><td class="k">'+esc(k)+'</td>'+
      '<td class="s">:</td><td class="v">'+esc(v||'-')+'</td></tr>';
  };
  /* Blok tanda tangan penyedia — di berkas .xlsx menempati kolom I s.d. K
     (paruh kanan lembar) dan rata tengah di dalamnya; di sini ditiru dengan
     kotak selebar TOR_BOQ_TTD_W% yang didorong ke kanan — persentase itu
     dihitung dari kisi kolom .xlsx yang sama (lihat TOR_BOQ_W). .spk-keep
     menjaga blok ini tidak pernah terpenggal paginator. */
  var ttd='<div class="boq-ttd spk-keep">'+
      '<div class="tg">Kota/Kabupaten,....., Tanggal.....</div>'+
      '<div class="pr">Nama Perusahaan</div>'+
      '<div class="sp"></div>'+
      '<div class="nm">(Nama Lengkap)</div>'+
      '<div class="jb">Jabatan</div>'+
    '</div>';
  return '<div class="tor-boq">'+
      '<div class="boq-kop spk-keep">'+
        '<div class="kp">(KOP PERUSAHAAN)</div>'+
        '<div class="jd">Bill of Quantity (BoQ)</div>'+
        '<table class="boq-info"><tbody>'+
          baris('Nama Pekerjaan', data.nama_pekerjaan)+
          baris('Lokasi Pekerjaan', data.lokasi_pekerjaan)+
        '</tbody></table>'+
      '</div>'+
      tbl+ttd+
    '</div>';
}

/* ===================== 11e. BILL OF QUANTITY (EXCEL) =====================
   Berkas .xlsx yang SUDAH BERUMUS \u2014 penyedia tinggal mengisi Harga Satuan
   (kolom 5 & 6), sisanya menghitung sendiri. Rumusnya cermin persis
   hpsSummary() di app.js supaya BoQ, RAB, dan HPS tak mungkin beda hasil:
       kolom 7 = Vol x Harga Material          (ROUND ke rupiah penuh)
       kolom 8 = Vol x Harga Jasa              (ROUND)
       kolom 9 = 7 + 8
       Jumlah  = SUM kolom
       DPP     = ROUND(Jumlah x 11/12)
       PPn 12% = ROUND(DPP x 0,12)
       Jml Tot = Jumlah + PPn                  (bukan DPP + PPn)

   Harga sengaja DIKOSONGKAN meski RAB sudah berisi angka: berkas ini untuk
   diisi penyedia. Angka Vol, Sat, dan uraian tetap dibawa dari RAB. */
const TOR_BOQ_TERBILANG =
  '="Terbilang  :  "&PROPER(IF({C}=0;"nol";IF({C}<0;"minus ";"")&SUBSTITUTE(TRIM(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(IF(--MID(TEXT(ABS({C});"000000000000000");1;3)=0;"";MID(TEXT(ABS({C});"000000000000000");1;1)&" ratus "&MID(TEXT(ABS({C});"000000000000000");2;1)&" puluh "&MID(TEXT(ABS({C});"000000000000000");3;1)&" trilyun ")&IF(--MID(TEXT(ABS({C});"000000000000000");4;3)=0;"";MID(TEXT(ABS({C});"000000000000000");4;1)&" ratus "&MID(TEXT(ABS({C});"000000000000000");5;1)&" puluh "&MID(TEXT(ABS({C});"000000000000000");6;1)&" milyar ")&IF(--MID(TEXT(ABS({C});"000000000000000");7;3)=0;"";MID(TEXT(ABS({C});"000000000000000");7;1)&" ratus "&MID(TEXT(ABS({C});"000000000000000");8;1)&" puluh "&MID(TEXT(ABS({C});"000000000000000");9;1)&" juta ")&IF(--MID(TEXT(ABS({C});"000000000000000");10;3)=0;"";IF(--MID(TEXT(ABS({C});"000000000000000");10;3)=1;"*";MID(TEXT(ABS({C});"000000000000000");10;1)&" ratus "&MID(TEXT(ABS({C});"000000000000000");11;1)&" puluh ")&MID(TEXT(ABS({C});"000000000000000");12;1)&" ribu ")&IF(--MID(TEXT(ABS({C});"000000000000000");13;3)=0;"";MID(TEXT(ABS({C});"000000000000000");13;1)&" ratus "&MID(TEXT(ABS({C});"000000000000000");14;1)&" puluh "&MID(TEXT(ABS({C});"000000000000000");15;1));1;"satu");2;"dua");3;"tiga");4;"empat");5;"lima");6;"enam");7;"tujuh");8;"delapan");9;"sembilan");"0 ratus";"");"0 puluh";"");"satu puluh 0";"sepuluh");"satu puluh satu";"sebelas");"satu puluh dua";"dua belas");"satu puluh tiga";"tiga belas");"satu puluh empat";"empat belas");"satu puluh lima";"lima belas");"satu puluh enam";"enam belas");"satu puluh tujuh";"tujuh belas");"satu puluh delapan";"delapan belas");"satu puluh sembilan";"sembilan belas");"satu ratus";"seratus");"*satu ribu";"seribu");0;""));" ";" "))&" rupiah")';
/* Berkas .xlsx SELALU menyimpan rumus dengan pemisah koma, apa pun bahasa
   Excel yang membukanya. Rumus di atas ditulis memakai titik koma (seperti
   yang tampil di Excel Indonesia), jadi diterjemahkan di sini. Aman disapu
   rata karena tidak satu pun teks di dalamnya memuat titik koma. */
function torBoqTerbilangRumus(cellTotal){
  return TOR_BOQ_TERBILANG.split('{C}').join(cellTotal).replace(/;/g, ',').replace(/^=/,'');
}
async function torBoqExcel(id){
  const rec=(records_tor||[]).find(r=>String(r.id)===String(id));
  if(!rec){ toast('Dokumen tidak ditemukan','warn'); return; }
  if(typeof ExcelJS==='undefined'){ toast('Pustaka Excel belum termuat','err'); return; }
  const data=rec.data||{};
  const semua=Array.isArray(data.__rab)?data.__rab:[];
  const items=semua.slice(0, Math.max(1, parseInt(data.jumlah_bj,10)||semua.length||1));
  if(!items.length){ toast('RAB masih kosong','warn'); return; }
  const cfg={
    judulOn:    String(data.rab_judul_on||'')==='Ya',
    judulNum:   String(data.rab_judul_num||''),
    subjudulOn: String(data.rab_subjudul_on||'')==='Ya',
    subjudulNum:String(data.rab_subjudul_num||'')
  };
  try{
    await withActionLoader('Menyiapkan BoQ', async()=>{
      const wb=new ExcelJS.Workbook();
      /* ---- PENGATURAN CETAK ----
         KETENTUAN 6 Agu 2026: mengikuti berkas BoQ contoh — "Fit to page"
         MATI (fitToPage:false), jadi lembar dicetak pada skala 100% apa adanya.
         fitToHeight:0 ("halaman ke bawah: otomatis") tetap ditulis supaya
         pengaturannya identik dengan berkas contoh. */
      const ws=wb.addWorksheet('BoQ',{pageSetup:{paperSize:9,orientation:'portrait',fitToPage:false,fitToHeight:0,margins:{left:0.4,right:0.4,top:0.5,bottom:0.5,header:0.2,footer:0.2}}});
      /* ---- TAMPILAN LEMBAR: TANPA GARIS KISI ----
         Hanya tampilan bawaan yang dimatikan (showGridLines), BUKAN garis
         tabel: garis tabel datang dari border tiap sel (kotak) sehingga tetap
         terlihat dan tetap ikut tercetak. */
      ws.views=[{showGridLines:false}];
      /* ---- KISI KOLOM ----
         Angkanya TIDAK ditulis di sini melainkan di tetapan TOR_BOQ_W (lihat
         catatan lengkapnya di sana), karena kisi yang sama juga dipakai tabel
         BoQ di dalam klausul TOR/KAK. Ringkasnya:
           A : kolom sela di tepi kiri — tabel tidak menempel ke pinggir lembar.
           C : DI LUAR tabel menjadi penampung label "Nama Pekerjaan :" /
               "Lokasi Pekerjaan :"; DI DALAM tabel selalu digabung dengan D
               sehingga kolom Uraian Pekerjaan utuh (C+D) dan tidak ada kolom
               kosong yang mengganggu.
         Nomor kolom FISIK dipakai di seluruh fungsi di bawah lewat tetapan K_*
         supaya penambahan/pemindahan kolom berikutnya cukup diubah di sini. */
      ws.columns=TOR_BOQ_W.map(function(w){ return {width:w}; });
      const K_NO=2, K_URA=3, K_URA2=4, K_SAT=5, K_VOL=6,
            K_HB=7, K_HJ=8, K_JB=9, K_JJ=10, K_TOT=11;
      const K_KIRI=K_NO, K_KANAN=K_TOT;          /* batas kiri-kanan tabel */
      /* Huruf kolom untuk RUMUS — diturunkan dari nomor di atas, jadi mustahil
         tertinggal bila kisi kolom digeser lagi. */
      const HRF=(n)=>String.fromCharCode(64+n);
      const L_VOL=HRF(K_VOL), L_HB=HRF(K_HB), L_HJ=HRF(K_HJ),
            L_JB=HRF(K_JB),   L_JJ=HRF(K_JJ), L_TOT=HRF(K_TOT);
      /* ---- TINGGI BARIS ----
         KETENTUAN 6 Agu 2026 (berkas BoQ contoh dari pengguna) — tiga ukuran
         saja, dan ini MENGGANTI rancangan lama (20 / 6 tipis / 15):

           T_SELA  16,05  SELURUH baris di luar tabel: baris sela paling atas,
                          kop, judul, Nama Pekerjaan/Lokasi, ruang & blok tanda
                          tangan. Juga dipakai baris penomoran kolom
                          ("1, 2, 3, …") — baris tipis 6 DIBATALKAN karena pada
                          berkas contoh baris itu setinggi baris biasa.
           T_BARIS 18     baris tabel: kepala, isi satu baris, rekap, terbilang.
           T_URA   20     dipakai HANYA bila teks Uraian melipat, sebagai
                          KELIPATAN (2 baris teks -> 40, 3 baris -> 60).

         Kenapa baris melipat memakai 20 dan bukan 18: tinggi baris gabungan
         (merge) TIDAK dapat dihitung sendiri oleh Excel, jadi harus ditaksir di
         sini — 20 per baris teks memberi sedikit kelonggaran sehingga huruf
         berkait bawah (g, y, j) tidak terpangkas garis sel. */
      const T_SELA=16.05, T_BARIS=18, T_URA=20;
      const tinggi=(r,h)=>{ ws.getRow(r).height=(h==null?T_SELA:h); };
      /* Perkiraan jumlah baris teks pada kolom Uraian (lebar gabungan C+D,
         dikurangi 2 untuk tepi dalam sel). */
      const LEBAR_URA=Math.round(TOR_BOQ_W[2]+TOR_BOQ_W[3])-2;
      const barisTeks=(txt)=>{
        const s=String(txt==null?'':txt);
        let n=0;
        s.split(/\r?\n/).forEach(function(seg){
          n += Math.max(1, Math.ceil(seg.length/LEBAR_URA));
        });
        return Math.max(1, n);
      };
      /* Tinggi baris isi tabel: satu baris teks -> T_BARIS, melipat -> kelipatan
         T_URA. Dipakai baris judul, sub-judul, dan barang/jasa. */
      const tinggiIsi=(txt)=>{ const n=barisTeks(txt); return n<=1 ? T_BARIS : T_URA*n; };
      /* ---- Palet & garis: SALINAN PERSIS gaya cetak RAB (hpsExtraDocCss,
         selektor table.hps-doc-tbl di app.js). Bila warna di sana diubah,
         ubah juga di sini supaya BoQ tetap kembar dengan RAB. ---- */
      const TIPIS={style:'thin',color:{argb:'FF7D979C'}};   /* td border #7d979c */
      const kotak={top:TIPIS,left:TIPIS,bottom:TIPIS,right:TIPIS};
      const C_KOP='FF0E7C86',  T_KOP='FFFFFFFF';            /* thead th        */
      const C_NUMH='FFE7F2F3', T_NUMH='FF0B3D42';           /* thead tr.numh   */
      const C_GRP='FFDCECEE',  C_SUB='FFEEF5F6', T_GRP='FF0B3D42';
      const C_SUM='FFF2F7F8',  T_SUML='FF0D2A30', T_SUMN='FF0B3D42';
      const C_TOT='FFE7F6EC',  T_TOT='FF0D7A3F';            /* tr.sum.grand    */
      const C_TERB='FFFBFDF4', T_TERB='FF22343A';           /* tr.terb         */
      /* "Semuanya format accounting tanpa desimal" (permintaan user):
         nol tampil sebagai "-" dan angka rata pada kolomnya, sama seperti
         ACCT_NODEC yang dipakai template Excel lain di aplikasi ini. */
      const RP='_(* #,##0_);_(* (#,##0);_(* "-"_);_(@_)';
      const isi=(argb)=>({type:'pattern',pattern:'solid',fgColor:{argb:argb}});
      const tulis=(r,c,v,opt)=>{ const cell=ws.getCell(r,c); if(v!=null) cell.value=v;
        if(opt&&opt.b) cell.font=Object.assign({bold:true},opt.font||{});
        else if(opt&&opt.font) cell.font=opt.font;
        cell.alignment=Object.assign({vertical:'middle',wrapText:true},(opt&&opt.al)||{});
        if(opt&&opt.box) cell.border=kotak;
        if(opt&&opt.fmt) cell.numFmt=opt.fmt;
        if(opt&&opt.bg) cell.fill=isi(opt.bg);
        return cell; };
      /* Warnai seluruh lebar tabel sekaligus (sel kosong pun ikut, supaya pita
         warnanya utuh seperti di cetakan RAB). Kolom sela A sengaja DILEWATI. */
      const warnai=(r,bg)=>{ for(let c=K_KIRI;c<=K_KANAN;c++){ const cell=ws.getCell(r,c);
        cell.fill=isi(bg); cell.border=kotak; } };
      /* Sel Uraian selalu gabungan C+D — lihat catatan kisi kolom di atas. */
      const gabungUraian=(r)=>{ ws.mergeCells(r,K_URA,r,K_URA2); };
      /* ---- Baris sela paling atas (ketentuan 6 Agu 2026) ---- */
      tinggi(1);
      let R=2;
      /* --- Kepala ---
         Ukuran huruf mengikuti berkas BoQ contoh: kop penyedia 16, judul
         lembar 14 bergaris bawah (semula keduanya 12). */
      ws.mergeCells(R,K_KIRI,R,K_KANAN);
      tulis(R,K_KIRI,'(KOP PERUSAHAAN)',{b:true,al:{horizontal:'center'},font:{bold:true,size:16,color:{argb:'FF0070C0'}}}); tinggi(R); R++;
      tinggi(R); R++;
      ws.mergeCells(R,K_KIRI,R,K_KANAN);
      tulis(R,K_KIRI,'Bill of Quantity (BoQ)',{b:true,al:{horizontal:'center'},font:{bold:true,size:14,underline:true}}); tinggi(R); R++;
      tinggi(R); R++;
      /* --- Nama Pekerjaan & Lokasi Pekerjaan: DUA sel per baris ---
         KETENTUAN 6 Agu 2026 (berkas BoQ contoh). Riwayat singkatnya: mula-mula
         label ada di kolom Uraian yang lebar dan ":" di kolom terpisah, jadi
         jarak label ke nilainya menganga; lalu label + ":" disatukan di sel
         gabungan B+C yang diratakan ke kanan.

         Sekarang caranya berbeda lagi dan JAUH LEBIH RAPI:
           - label ditulis SENDIRIAN di kolom C (bukan gabungan B+C), dan
           - titik duanya TIDAK diketik, melainkan datang dari FORMAT ANGKA
             `@\ * ":"`. Dalam format angka Excel, `*` berarti "ulangi karakter
             sesudahnya sampai selebar kolom" — di sini karakter itu SPASI,
             lalu ditutup ":". Hasilnya titik dua selalu menempel PERSIS di
             tepi kanan kolom C, berapa pun panjang labelnya, sehingga ":"
             kedua baris mustahil tidak lurus dan tidak perlu disetel manual.
           - nilainya menempati sel gabungan D s.d. K dengan indent 1 karakter.
         Labelnya juga diperjelas menjadi "Nama Pekerjaan" & "Lokasi Pekerjaan"
         (semula "Pekerjaan" & "Lokasi"). */
      const FMT_TDUA='@\\ * ":"';
      const infoBaris=(label,nilai)=>{
        tulis(R,K_URA,label,{b:true,al:{horizontal:'center'},fmt:FMT_TDUA});
        ws.mergeCells(R,K_URA2,R,K_KANAN);
        tulis(R,K_URA2,nilai||'-',{b:true,al:{horizontal:'left',indent:1}});
        tinggi(R); R++;
      };
      infoBaris('Nama Pekerjaan',   data.nama_pekerjaan);
      infoBaris('Lokasi Pekerjaan', data.lokasi_pekerjaan);
      tinggi(R); R++;
      /* --- Kepala tabel (tiga baris, sama dengan cetakan HPS) --- */
      const H=R;
      ws.mergeCells(H,K_NO,H+1,K_NO);
      ws.mergeCells(H,K_URA,H+1,K_URA2);          /* Uraian: 2 kolom x 2 baris */
      ws.mergeCells(H,K_SAT,H+1,K_SAT); ws.mergeCells(H,K_VOL,H+1,K_VOL);
      ws.mergeCells(H,K_HB,H,K_HJ);     ws.mergeCells(H,K_JB,H,K_JJ);
      ws.mergeCells(H,K_TOT,H+1,K_TOT);
      const tengah={horizontal:'center',vertical:'middle',wrapText:true};
      const fKop={bold:true,color:{argb:T_KOP}};
      const kop=(r,c,t)=>tulis(r,c,t,{al:tengah,box:true,bg:C_KOP,font:fKop});
      /* Judul kolom "Barang (Rp)" (bukan "Material") agar 100% sama dengan
         cetakan RAB & dokumen HPS. */
      warnai(H,C_KOP); warnai(H+1,C_KOP);
      kop(H,K_NO,'No.');  kop(H,K_URA,'Uraian Pekerjaan'); kop(H,K_SAT,'Sat'); kop(H,K_VOL,'Vol');
      kop(H,K_HB,'Harga Satuan'); kop(H,K_JB,'Jumlah Harga'); kop(H,K_TOT,'Jumlah Total\n(Rp)');
      kop(H+1,K_HB,'Barang (Rp)'); kop(H+1,K_HJ,'Jasa (Rp)');
      kop(H+1,K_JB,'Barang (Rp)'); kop(H+1,K_JJ,'Jasa (Rp)');
      tinggi(H,T_BARIS); tinggi(H+1,T_BARIS);
      warnai(H+2,C_NUMH); gabungUraian(H+2);
      [[K_NO,'1'],[K_URA,'2'],[K_SAT,'3'],[K_VOL,'4'],[K_HB,'5'],[K_HJ,'6'],
       [K_JB,'7 = 4 x 5'],[K_JJ,'8 = 4 x 6'],[K_TOT,'9 = 7 + 8']].forEach(([c,t])=>{
        tulis(H+2,c,t,{al:tengah,box:true,bg:C_NUMH,font:{bold:true,italic:true,color:{argb:T_NUMH}}}); });
      tinggi(H+2);            /* baris penomoran kolom: setinggi baris biasa */
      R=H+3;
      /* --- Baris isi (judul / sub-judul / barang), penomoran = jsWalk --- */
      const barisAngka=[];
      const kosongkan=(r)=>{ for(let c=K_KIRI;c<=K_KANAN;c++) tulis(r,c,null,{box:true}); };
      /* Rumusnya dibiarkan POLOS (tanpa pembungkus IF(...)="") supaya hasilnya
         angka 0, bukan teks kosong \u2014 format accounting-lah yang menampilkan
         nol sebagai "-" persis seperti kolom harga di cetakan RAB. */
      /* RUMUS TANPA ROUND (ketentuan 6 Agu 2026, mengikuti berkas BoQ contoh).
         Semula tiap perkalian dibungkus ROUND(...,0) supaya angka BoQ mustahil
         berbeda satu rupiah pun dengan RAB & HPS. Pengguna memilih rumus polos
         seperti pada berkas contoh: pembulatan diserahkan sepenuhnya kepada
         format accounting (RP) yang menampilkan angka tanpa desimal. */
      const rumusBaris=(r,bg)=>{
        const o={al:{horizontal:'right'},box:true,fmt:RP,bg:bg};
        tulis(r,K_JB,{formula:L_VOL+r+'*'+L_HB+r},o);
        tulis(r,K_JJ,{formula:L_VOL+r+'*'+L_HJ+r},o);
        /* Kolom Jumlah Total tebal & bertinta gelap \u2014 sama seperti td.num.tot di RAB. */
        tulis(r,K_TOT,{formula:L_JB+r+'+'+L_JJ+r},
          {al:{horizontal:'right'},box:true,fmt:RP,bg:bg,font:{bold:true,color:{argb:T_GRP}}});
      };
      /* Harga satuan Barang & Jasa SELALU 0 (permintaan user): BoQ = RAB tanpa
         harga. Nilainya angka 0, bukan sel kosong, supaya rumus di kolom
         Jumlah Harga & Jumlah Total ikut menghasilkan 0 dan tampil "-". */
      const hargaNol=(r,bg)=>{
        tulis(r,K_HB,0,{al:{horizontal:'right'},box:true,fmt:RP,bg:bg});
        tulis(r,K_HJ,0,{al:{horizontal:'right'},box:true,fmt:RP,bg:bg});
      };
      jsWalk(items, cfg, {
        judul:(no,txt,it)=>{ kosongkan(R); warnai(R,C_GRP); gabungUraian(R);
          const f={bold:true,color:{argb:T_GRP}};
          const t=String(txt||'').toUpperCase();
          tulis(R,K_NO,no,{al:{horizontal:'center'},box:true,bg:C_GRP,font:f});
          tulis(R,K_URA,t,{box:true,bg:C_GRP,font:f});
          if(it){ tulis(R,K_SAT,it.sat||'',{al:{horizontal:'center'},box:true,bg:C_GRP,font:f});
                  tulis(R,K_VOL,jsVolNum(it.vol)||null,{al:{horizontal:'center'},box:true,bg:C_GRP,font:f});
                  hargaNol(R,C_GRP); rumusBaris(R,C_GRP); barisAngka.push(R); }
          tinggi(R, tinggiIsi(t)); R++; },
        sub:(no,txt,it)=>{ kosongkan(R); warnai(R,C_SUB); gabungUraian(R);
          const f={bold:true,italic:true,color:{argb:T_GRP}};
          const t='   '+txt;
          tulis(R,K_NO,no,{al:{horizontal:'center'},box:true,bg:C_SUB,font:f});
          tulis(R,K_URA,t,{box:true,bg:C_SUB,font:f});
          if(it){ tulis(R,K_SAT,it.sat||'',{al:{horizontal:'center'},box:true,bg:C_SUB,font:f});
                  tulis(R,K_VOL,jsVolNum(it.vol)||null,{al:{horizontal:'center'},box:true,bg:C_SUB,font:f});
                  hargaNol(R,C_SUB); rumusBaris(R,C_SUB); barisAngka.push(R); }
          tinggi(R, tinggiIsi(t)); R++; },
        item:(noInGroup,it,idx)=>{ kosongkan(R); gabungUraian(R);
          const t=(it.uraian&&String(it.uraian).trim())?it.uraian:('Barang/Jasa '+(idx+1));
          tulis(R,K_NO,noInGroup,{al:{horizontal:'center'},box:true});
          tulis(R,K_URA,t,{box:true});
          tulis(R,K_SAT,it.sat||'',{al:{horizontal:'center'},box:true});
          tulis(R,K_VOL,jsVolNum(it.vol)||null,{al:{horizontal:'center'},box:true});
          hargaNol(R); rumusBaris(R); barisAngka.push(R);
          tinggi(R, tinggiIsi(t)); R++; }
      });
      const r1=H+3, r2=R-1;
      /* --- Rekap: cermin hpsSummary() --- */
      const rekap=(label, fB, fJ, fT, tebal)=>{
        const bg=tebal?C_TOT:C_SUM, tl=tebal?T_TOT:T_SUML, tn=tebal?T_TOT:T_SUMN;
        warnai(R,bg);
        ws.mergeCells(R,K_KIRI,R,K_HJ);
        tulis(R,K_KIRI,label,{al:{horizontal:'right'},box:true,bg:bg,font:{bold:true,color:{argb:tl}}});
        [[K_JB,fB],[K_JJ,fJ],[K_TOT,fT]].forEach(([c,f])=>
          tulis(R,c,{formula:f},{al:{horizontal:'right'},box:true,fmt:RP,bg:bg,
            font:{bold:true,color:{argb:tn}}}));
        tinggi(R,T_BARIS); R++;
      };
      const rJml=R;
      /* Kolom Jumlah Total pada baris "Jumlah" MENJUMLAHKAN DUA SEL DI KIRINYA
         (Barang + Jasa), bukan menjumlahkan kolom Jumlah Total ke bawah —
         mengikuti berkas BoQ contoh. Hasilnya sama, tetapi rumusnya lebih mudah
         ditelusuri penyedia yang memeriksa lembar ini. */
      rekap('Jumlah','SUM('+L_JB+r1+':'+L_JB+r2+')','SUM('+L_JJ+r1+':'+L_JJ+r2+')','SUM('+L_JB+R+':'+L_JJ+R+')');
      const rDpp=R;
      rekap('DPP','('+L_JB+rJml+'*11/12)','('+L_JJ+rJml+'*11/12)','('+L_TOT+rJml+'*11/12)');
      const rPpn=R;
      rekap('PPn 12%',L_JB+rDpp+'*0.12',L_JJ+rDpp+'*0.12',L_TOT+rDpp+'*0.12');
      const rTot=R;
      rekap('Jumlah Total',L_JB+rJml+'+'+L_JB+rPpn,L_JJ+rJml+'+'+L_JJ+rPpn,L_TOT+rJml+'+'+L_TOT+rPpn, true);
      /* --- Terbilang: rumus yang mengikuti sel Jumlah Total --- */
      warnai(R,C_TERB);
      ws.mergeCells(R,K_KIRI,R,K_KANAN);
      tulis(R,K_KIRI,{formula:torBoqTerbilangRumus(L_TOT+rTot)},
        {al:{horizontal:'left'},box:true,bg:C_TERB,font:{bold:true,color:{argb:T_TERB}}});
      tinggi(R,T_BARIS);
      /* --- Tanda tangan penyedia ---
         TOR_BOQ_TTD_RUANG = jumlah baris kosong untuk membubuhkan tanda tangan
         & cap. Ditambah satu baris pada 6 Agu 2026 atas permintaan pengguna. */
      /* Tiga baris sela antara Terbilang dan blok tanda tangan \u2014 tingginya
         ikut diseragamkan supaya tidak ada baris "bawaan" di tengah lembar. */
      for(let i=0;i<3;i++){ R++; tinggi(R); }
      const ttdBaris=(teks,opt)=>{ ws.mergeCells(R,K_JB,R,K_KANAN);
        tulis(R,K_JB,teks,opt); tinggi(R); R++; };
      ttdBaris('Kota/Kabupaten,....., Tanggal.....',{al:{horizontal:'center'}});
      ttdBaris('Nama Perusahaan',{b:true,al:{horizontal:'center'}});
      for(let i=0;i<TOR_BOQ_TTD_RUANG;i++){ tinggi(R); R++; }
      ttdBaris('(Nama Lengkap)',{b:true,al:{horizontal:'center'},font:{bold:true,underline:true}});
      ttdBaris('Jabatan',{b:true,al:{horizontal:'center'}});
      const nm=('BoQ - '+(data.nama_pekerjaan||'Pekerjaan')).replace(/[\\/:*?"<>|]/g,'-').slice(0,90);
      const buf=await wb.xlsx.writeBuffer();
      const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a'); a.href=url; a.download=nm+'.xlsx';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });
  }catch(err){ console.error(err); toast('Gagal membuat BoQ: '+errMsg(err),'err'); }
}

/* ===================== 11c. DAFTAR DOKUMEN (MENU AKSI) =====================
   Satu pekerjaan menghasilkan beberapa dokumen sekaligus, jadi tombol mata pada
   daftar tidak lagi langsung membuka TOR melainkan memunculkan pilihan dokumen
   — pola yang sama dengan Dokumen Pengadaan (dpengOpenDocList).

   Daftar jenisnya ditaruh pada SATU tetapan supaya menambah dokumen baru cukup
   menambah satu baris di sini + satu cabang di torDokHtmlAktif(). */
const TOR_DOK_MENU = [
  {mode:'tor',         nama:'Dokumen TOR/KAK',                     ket:'Kerangka Acuan Kerja lengkap dengan klausul & pengesahan'},
  {mode:'rab',         nama:'Dokumen RAB',                         ket:'Rencana Anggaran Biaya \u2014 tabel & rekap gaya HPS'},
  {mode:'pi-pengguna', nama:'Pakta Integritas Pengguna Barang/Jasa',ket:'SMAP \u2014 ditandatangani Pengguna Barang/Jasa'},
  {mode:'pi-direksi',  nama:'Pakta Integritas Direksi Pekerjaan',   ket:'SMAP \u2014 ditandatangani Direksi Pekerjaan'},
  {mode:'boq',         nama:'Bill of Quantity (Excel)',             ket:'Berkas .xlsx berumus \u2014 harga diisi penyedia'}
];
function torOpenDokList(id){
  const rec=(records_tor||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  const esc=fkEsc, rid=fkEscJs(String(rec.id));
  const baris=TOR_DOK_MENU.map(m=>{
    const dis=m.belum?' is-soon':'';
    const act=m.belum
      ? 'toast(\'' + esc(m.nama) + ' belum tersedia\',\'warn\')'
      : 'torDokPilih(\'' + rid + '\',\'' + m.mode + '\')';
    return '<button type="button" class="tor-dk-row'+dis+'" onclick="'+act+'">'+
      '<span class="ic">'+(m.mode==='boq'?'\u25A6':'\u25A4')+'</span>'+
      '<span class="tx"><b>'+esc(m.nama)+'</b><i>'+esc(m.ket)+'</i></span>'+
      '<span class="go">'+(m.belum?'segera':'\u203A')+'</span></button>';
  }).join('');
  let ov=document.getElementById('tor-dk-ov');
  if(!ov){
    ov=document.createElement('div'); ov.id='tor-dk-ov'; ov.className='tor-dk-ov';
    /* Dulu: mengklik latar langsung menutup pop-up. Sekarang DITOLAK — lihat
       torDokListTolak() dan catatan @keyframes tor-dk-getar di torViewCss. */
    ov.addEventListener('mousedown', function(e){
      if(e.target!==ov) return;
      /* Klik KEDUA di latar akan ditafsirkan Chrome sebagai "pilih kata" dan
         memunculkan gelembung Google Terjemahan. Perilaku bawaannya ditahan
         supaya seleksi itu tidak pernah terbentuk. */
      if(e.detail>1) e.preventDefault();
      torDokListTolak();
    });
    document.body.appendChild(ov);
  }
  /* Nomor dokumen TIDAK lagi ditampilkan di bawah nama pekerjaan (ketentuan
     6 Agu 2026) \u2014 nomornya sudah tercetak di tiap dokumen. */
  ov.innerHTML='<div class="tor-dk-mdl">'+
    '<div class="tor-dk-hd">'+
      '<div class="jd"><b>'+esc(rec.nama_pekerjaan||'Dokumen Pengadaan')+'</b></div>'+
      '<div class="act">'+
        '<button type="button" class="pr" onclick="torCetakGabung(\''+rid+'\')" '+
          'title="Cetak gabungan: TOR/KAK + RAB + kedua Pakta Integritas" '+
          'aria-label="Cetak gabungan">'+TOR_IC_CETAK+'</button>'+
        '<button type="button" class="x" onclick="torCloseDokList()" '+
          'title="Tutup" aria-label="Tutup">'+TOR_IC_TUTUP+'</button>'+
      '</div>'+
    '</div>'+
    '<div class="tor-dk-bd">'+baris+'</div></div>';
  ov.classList.add('show');
}
/* Penolakan klik-di-luar untuk pop-up ini MEMAKAI MESIN BERSAMA di app.js
   (bunyiTolak + tolakTutupModal + pasangTolakTutup). Dulu mesinnya ditulis
   ulang di sini; sesudah modal pratinjau & modal "Lihat" ikut memakainya,
   menyimpan dua salinan hanya membuat keduanya berpeluang berbeda perilaku.
   Cadangan sederhana disediakan seandainya app.js belum termuat. */
function torDokListTolak(){
  var ov=document.getElementById('tor-dk-ov'); if(!ov) return;
  if(typeof tolakTutupModal==='function'){ tolakTutupModal(ov); return; }
  var mdl=ov.querySelector('.tor-dk-mdl'); if(!mdl) return;
  mdl.classList.remove('menolak'); void mdl.offsetWidth; mdl.classList.add('menolak');
  clearTimeout(mdl.__tolakT);
  mdl.__tolakT=setTimeout(function(){ mdl.classList.remove('menolak'); }, 900);
}
function torCloseDokList(){ const ov=document.getElementById('tor-dk-ov'); if(ov) ov.classList.remove('show'); }

/* ===================== 11c-b. CETAK GABUNGAN =====================
   KETENTUAN 6 Agu 2026: satu tombol untuk mencetak TOR/KAK + RAB + KEDUA Pakta
   Integritas sekaligus (BoQ .xlsx tidak ikut — ia berkas Excel, bukan cetakan).

   MASALAHNYA: keempat berkas itu memakai DUA mesin cetak yang berbeda —
   TOR/KAK memakai mesin dokumen SPK (.spk-doc + spkPageScript), sedangkan RAB &
   Pakta Integritas memakai kerangka cetak umum (.fkl-print-page + fklPageScript).
   Menggabungkan mentah-mentah tidak bisa: gaya keduanya saling menimpa (mis.
   aturan huruf/margin khusus Pakta Integritas akan ikut mengubah RAB), dan tiap
   pemecah halaman hanya mengenali dokumen PERTAMA yang ditemuinya.

   CARANYA: tiap dokumen dibiarkan PAGINASI SENDIRI di dalam bingkai tersembunyi
   miliknya, seperti saat dicetak satuan. Sesudah selesai, hasilnya DIPANEN:
     - seluruh aturan CSS-nya dibaca lewat CSSOM lalu SELEKTORNYA DIBERI AWALAN
       kelas pembungkus dokumen itu (.cetak-d1, .cetak-d2, ...), sehingga gaya
       satu dokumen mustahil bocor ke dokumen lain;
     - badan halamannya disalin TANPA <script> (paginasinya sudah selesai —
       kalau ikut, skripnya jalan lagi dan menata ulang dokumen yang sudah jadi).
   Berkas gabungan lalu berisi lembar-lembar A4 yang sudah matang, siap dicetak
   dalam satu perintah. */
const TOR_GABUNG_MODE = ['tor','rab','pi-pengguna','pi-direksi'];
/* Silang penutup — SVG, bukan karakter &times;: kotak pandang 24x24 yang
   simetris membuat titik tengahnya pasti, dan ketebalan guratnya sama persis
   dengan ikon cetak di sebelahnya. */
const TOR_IC_TUTUP =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '+
  'stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
const TOR_IC_CETAK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '+
  'stroke-linecap="round" stroke-linejoin="round">'+
  '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>'+
  '<rect x="6" y="14" width="12" height="8"/></svg>';
/* Beri AWALAN pada seluruh selektor sebuah daftar aturan CSS. @font-face, @page,
   dan @keyframes dibiarkan apa adanya (tak punya selektor elemen).

   `sudah` (opsional) = Set penampung @font-face yang SUDAH pernah ditulis. Muka
   huruf Inter ditanam sebagai base64 (spkInterFontFace) dan dipakai oleh TOR/KAK
   maupun kedua Pakta Integritas, jadi tanpa penyaring ini berkas gabungan memuat
   blok base64 yang sama beberapa kali (ratusan KB percuma, memperlambat pratinjau
   cetak). Aturannya identik, jadi cukup yang pertama. */
function torCssBerawalan(rules, pfx, sudah){
  var out='';
  for(var i=0;i<rules.length;i++){
    var r=rules[i];
    try{
      if(r.type===1){                                   /* CSSStyleRule */
        var sel=String(r.selectorText||'').split(',').map(function(x){
          x=x.trim();
          if(!x) return x;
          if(x==='html'||x==='body'||x===':root') return pfx;
          if(/^(html|body)\b/.test(x)) return pfx+x.replace(/^(html|body)/,'');
          return pfx+' '+x;
        }).join(',');
        out+=sel+'{'+r.style.cssText+'}';
      }else if(r.type===4){                             /* CSSMediaRule */
        out+='@media '+r.media.mediaText+'{'+torCssBerawalan(r.cssRules, pfx, sudah)+'}';
      }else if(r.type===12){                            /* CSSSupportsRule */
        out+='@supports '+r.conditionText+'{'+torCssBerawalan(r.cssRules, pfx, sudah)+'}';
      }else if(r.type===5){                             /* CSSFontFaceRule */
        var ff=r.cssText;
        if(sudah){ if(sudah.has(ff)) continue; sudah.add(ff); }
        out+=ff;
      }else{
        out+=r.cssText;                                 /* @page, @keyframes, dst. */
      }
    }catch(e){}
  }
  return out;
}
/* Kumpulkan <link rel="stylesheet"> dari sebuah dokumen bingkai.

   PENTING — INI SUMBER BEDA TAMPILAN CETAK GABUNGAN vs SATUAN: berkas gaya dari
   domain lain (Google Fonts) TIDAK bisa dibaca lewat CSSOM — `ss.cssRules`
   melempar SecurityError, sehingga aturan @font-face 'Plus Jakarta Sans' & 'Inter'
   (Google) diam-diam hilang saat dipanen. Inter selamat karena ada versi tertanam
   base64 ("Inter Local"), tetapi Plus Jakarta Sans — yang dipakai sampul & daftar
   isi TOR/KAK, kop/kaki halaman, serta seluruh dokumen RAB — jatuh ke Segoe UI /
   Arial. Karena itu <link>-nya dibawa APA ADANYA ke berkas gabungan. */
function torPanenLink(d){
  var out=[], el=d.querySelectorAll('link[rel~="stylesheet"],link[rel~="preconnect"]');
  for(var i=0;i<el.length;i++){
    try{ if(el[i].getAttribute('href')) out.push(el[i].outerHTML); }catch(e){}
  }
  return out;
}
/* Panen satu bingkai yang paginasinya sudah selesai */
function torPanenBingkai(ifr, kelas, sudahFF){
  var w=ifr.contentWindow, d=w.document, css='';
  var ss=d.styleSheets;
  for(var i=0;i<ss.length;i++){
    var rl=null; try{ rl=ss[i].cssRules; }catch(e){ rl=null; }
    if(rl) css+=torCssBerawalan(rl, '.'+kelas, sudahFF);
  }
  var body=d.body.cloneNode(true);
  var sc=body.querySelectorAll('script');
  for(var j=sc.length-1;j>=0;j--) sc[j].parentNode.removeChild(sc[j]);
  return {css:css, html:body.innerHTML, links:torPanenLink(d)};
}
/* Tunggu paginasi sebuah bingkai selesai (kedua mesin cetak). */
function torTungguPaginasi(ifr, sisa, lanjut){
  var siap=false;
  try{
    var w=ifr.contentWindow, d=w.document;
    siap = !!w.__spkPaged || !!d.querySelector('.fkl-sheet') ||
           (!d.querySelector('.spk-page.spk-flow') && !d.querySelector('.fkl-print-page'));
  }catch(e){ siap=true; }
  if(siap || sisa<=0){ setTimeout(lanjut, 80); return; }
  setTimeout(function(){ torTungguPaginasi(ifr, sisa-80, lanjut); }, 80);
}
/* Tunggu seluruh muka huruf pada sebuah bingkai selesai dimuat, lalu jalankan
   `lanjut`. Selalu dijalankan tepat SEKALI, walau document.fonts tak tersedia,
   walau pemuatan gagal, dan walau melewati batas waktu. */
function torTungguFont(ifr, batas, lanjut){
  var jalan=false;
  var go=function(){ if(jalan) return; jalan=true; setTimeout(lanjut, 60); };
  setTimeout(go, Math.max(300, batas|0));
  try{
    var d=ifr.contentWindow.document;
    if(d.fonts && d.fonts.ready && d.fonts.ready.then) d.fonts.ready.then(go, go);
    else setTimeout(go, 400);
  }catch(e){ setTimeout(go, 400); }
}
function torCetakGabung(id){
  var rec=(records_tor||[]).find(function(r){ return String(r.id)===String(id); });
  if(!rec){ toast('Dokumen tidak ditemukan','warn'); return; }
  torCloseDokList();
  var data=rec.data||{}, kl=(Array.isArray(rec.klausul)?rec.klausul:[]);
  var simpan=torPreviewMode;
  var doks=TOR_GABUNG_MODE.map(function(m){
    torPreviewMode=m;
    try{ return torDokHtmlAktif(data, kl); }catch(e){ console.error('cetak gabungan/'+m+':', e); return ''; }
  }).filter(Boolean);
  torPreviewMode=simpan;
  if(!doks.length){ toast('Tidak ada dokumen untuk dicetak','warn'); return; }
  var wadah=document.getElementById('tor-gabung-wrap');
  if(wadah) wadah.remove();
  wadah=document.createElement('div'); wadah.id='tor-gabung-wrap';
  wadah.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;overflow:hidden;visibility:hidden';
  document.body.appendChild(wadah);
  var bingkai=doks.map(function(html){
    var f=document.createElement('iframe');
    f.style.cssText='width:1200px;height:1600px;border:0';
    wadah.appendChild(f);
    var d=f.contentWindow.document; d.open(); d.write(html); d.close();
    return f;
  });
  var pesan=(typeof withActionLoader==='function');
  var selesai=function(){
    var css='', isi='', link='', sudahFF=new Set(), sudahLink=new Set();
    bingkai.forEach(function(f,i){
      var k='cetak-d'+(i+1);
      var p; try{ p=torPanenBingkai(f, k, sudahFF); }catch(e){ console.error('panen:', e); return; }
      css+=p.css;
      (p.links||[]).forEach(function(t){ if(!sudahLink.has(t)){ sudahLink.add(t); link+=t; } });
      isi+='<div class="cetak-doc '+k+'">'+p.html+'</div>';
    });
    wadah.remove();
    if(!isi){ toast('Gagal menyiapkan cetak gabungan','err'); return; }
    /* Cadangan bila panen <link> gagal (mis. bingkai keburu dibongkar): muka huruf
       yang dipakai keempat dokumen tetap dijamin ada. */
    if(!link && typeof fklDocFontLink==='function') link=fklDocFontLink();
    var html='<!DOCTYPE html><html lang="id"><head><meta charset="utf-8">'+
      '<title>&#8203;</title>'+link+'<style>'+css+
      'html,body{margin:0;padding:0;background:#fff}'+
      '.cetak-doc{break-after:page;page-break-after:always}'+
      '.cetak-doc:last-child{break-after:auto;page-break-after:auto}'+
      '</style></head><body>'+isi+'</body></html>';
    var old=document.getElementById('tor-print-frame'); if(old) old.remove();
    var ifr=document.createElement('iframe'); ifr.id='tor-print-frame';
    ifr.setAttribute('aria-hidden','true');
    ifr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(ifr);
    var d=ifr.contentWindow.document; d.open(); d.write(html); d.close();
    /* Muka huruf dari <link> diunduh dari jaringan, jadi mencetak setelah jeda tetap
       saja bisa kebagian huruf cadangan. Tunggu document.fonts.ready (dibatasi 3
       detik supaya tak menggantung bila Google Fonts diblokir). */
    torTungguFont(ifr, 3000, function(){
      var run=function(){ try{ ifr.contentWindow.focus(); ifr.contentWindow.print(); }
                          catch(e){ try{ window.print(); }catch(_){} } };
      if(typeof withHiddenPageTitle==='function') withHiddenPageTitle(run); else run();
      setTimeout(function(){ var f=document.getElementById('tor-print-frame'); if(f) f.remove(); }, 1500);
    });
  };
  var sisa=bingkai.length;
  bingkai.forEach(function(f){
    torTungguPaginasi(f, 6000, function(){ if(--sisa<=0) selesai(); });
  });
  if(pesan) try{ toast('Menyiapkan cetak gabungan…','ok'); }catch(e){}
}
function torDokPilih(id, mode){
  torCloseDokList();
  /* BoQ bukan dokumen cetak melainkan UNDUHAN .xlsx, jadi tidak lewat pratinjau. */
  if(mode==='boq'){ torBoqExcel(id); return; }
  torPreviewRecord(id, mode);
}

/* Ikon kolom Aksi — mengambil tetapan milik Dokumen Pengadaan agar seragam.
   Cadangan dipakai hanya bila app.js belum sempat termuat. */
const TOR_IC_CADANGAN = {
  VIEW:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  EDIT:'<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  DEL :'<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>'
};
function torIcAksi(k){
  try{
    const v = (k==='EDIT') ? DPENG_IC_EDIT : (k==='DEL') ? DPENG_IC_DEL : DPENG_IC_VIEW;
    if(typeof v==='string' && v) return v;
  }catch(e){}
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'+TOR_IC_CADANGAN[k]+'</svg>';
}

function renderTorView(){
  torEnsureStyle();
  const tb=document.getElementById('tor-view-body'); if(!tb) return;
  const pg=document.getElementById('tor-view-pagination');
  const cEl=document.getElementById('tor-view-count');
  const rows=torViewRows();
  if(cEl) cEl.textContent=String(rows.length);
  const total=Math.max(1, Math.ceil(rows.length/TOR_PAGE_SIZE));
  if(torViewPage>total) torViewPage=total;
  const slice=rows.slice((torViewPage-1)*TOR_PAGE_SIZE, torViewPage*TOR_PAGE_SIZE);
  if(!slice.length){
    tb.innerHTML='<tr><td colspan="7"><div class="empty" style="padding:26px"><div>Belum ada dokumen TOR/KAK.</div></div></td></tr>';
    if(pg) pg.innerHTML=''; return;
  }
  const ic=(p)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'+p+'</svg>';
  tb.innerHTML=slice.map((r,i)=>{
    const no=(torViewPage-1)*TOR_PAGE_SIZE+i+1;
    const rid=fkEscJs(String(r.id));
    return '<tr>'+
      '<td class="col-no">'+no+'</td>'+
      /* Dua nomor bertumpuk (TOR/KAK di atas, RAB di bawah) dengan sedikit
         ruang di antaranya. Gaya ditulis sebaris, bukan lewat style.css,
         supaya perubahan ini cukup pada satu berkas. */
      '<td class="col-spk-nokon">'+(function(){
          var n=torNoDokPasangan(r);
          return '<div style="display:flex;flex-direction:column;gap:4px">'+
            '<b>'+fkEsc(n.tor)+'</b>'+
            (n.rab ? '<b>'+fkEsc(n.rab)+'</b>' : '')+
          '</div>';
        })()+'</td>'+
      '<td class="col-nama-freeze">'+fkEsc(r.nama_pekerjaan||'—')+'</td>'+
      '<td>'+fkEsc(r.bidang_pelaksana||'—')+'</td>'+
      /* Tanggal pada TABEL DAFTAR memakai bentuk pendek dd/mm/yyyy (ketentuan
         6 Agu 2026). fmtDate() milik app.js dipakai ulang — bukan disalin —
         supaya daftar ini seragam dengan daftar Susun Kontrak & lainnya.
         spkDateLong (bentuk panjang) tetap dipakai DI DALAM dokumen. */
      '<td class="col-date">'+fkEsc(r.tanggal?fmtDate(r.tanggal):'—')+'</td>'+
      '<td class="col-nilai">'+(r.nilai?('Rp '+Number(r.nilai).toLocaleString('id-ID')):'—')+'</td>'+
      /* Kolom AKSI DISERAGAMKAN dengan Dokumen Pengadaan (5 Agu 2026):
         urutan Ubah \u2192 Lihat \u2192 Hapus, pembungkus .action-cell, tombol
         berkelas .act, dan ikonnya MEMAKAI ULANG tetapan DPENG_IC_* di app.js
         \u2014 bukan disalin \u2014 supaya bila ikon Dokumen Pengadaan diubah,
         daftar ini ikut berubah sendiri dan keduanya mustahil berbeda. */
      '<td><div class="action-cell" style="justify-content:center">'+
        '<button class="act act-edit" title="Ubah" onclick="torEditRecord(\''+rid+'\')">'+torIcAksi('EDIT')+'</button>'+
        '<button class="act act-view" title="Lihat Dokumen" onclick="torOpenDokList(\''+rid+'\')">'+torIcAksi('VIEW')+'</button>'+
        '<button class="act act-del" title="Hapus" onclick="torDeleteRecord(\''+rid+'\')">'+torIcAksi('DEL')+'</button>'+
      '</div></td>'+
    '</tr>';
  }).join('');
  if(typeof revealTbody==='function') revealTbody(tb);
  if(pg){
    /* ---- PAGINASI DAFTAR: DISERAGAMKAN DENGAN SUSUN KONTRAK (SPK) ----
       KETENTUAN 6 Agu 2026: "logika pagination di SPK terapkan juga di dokumen
       TOR/KAK". Tiga hal yang sebelumnya tidak ada di sini dan disalin dari
       renderSpkView():
         - tombol MUNDUR (\u2039) & MAJU (\u203a) di kiri-kanan deretan nomor;
         - keduanya `disabled` saat sudah di halaman pertama/terakhir, jadi
           tidak bisa diklik ke halaman yang tidak ada;
         - kelas `pg-btn` pada SETIAP tombol \u2014 tanpa itu tombol di sini
           tidak mendapat gaya bakunya dan terlihat berbeda dari daftar SPK. */
    if(total<=1){ pg.innerHTML=''; }
    else{
      let h='<button class="pg-btn" '+(torViewPage<=1?'disabled':'')+' onclick="torViewGoto('+(torViewPage-1)+')">&#8249;</button>';
      for(let p=1;p<=total;p++) h+='<button class="pg-btn '+(p===torViewPage?'active':'')+'" onclick="torViewGoto('+p+')">'+p+'</button>';
      h+='<button class="pg-btn" '+(torViewPage>=total?'disabled':'')+' onclick="torViewGoto('+(torViewPage+1)+')">&#8250;</button>';
      pg.innerHTML=h;
    }
  }
}
/* Pagar rentang \u2014 tombol \u2039/\u203a memang sudah `disabled` di ujung,
   tetapi torViewGoto juga dipanggil dari tempat lain; renderTorView menjepit
   torViewPage ke halaman terakhir, jadi cukup jaga batas bawahnya di sini. */
function torViewGoto(p){ torViewPage=Math.max(1, parseInt(p,10)||1); renderTorView(); }
function torDeleteRecord(id){
  if(typeof requireInput==='function' && !requireInput()) return;
  const r=(records_tor||[]).find(x=>String(x.id)===String(id)); if(!r) return;
  openConfirm({ icon:'del', title:'Hapus Dokumen TOR/KAK',
    text:'Hapus dokumen "'+(r.no_dokumen||r.nama_pekerjaan||'')+'"? Nomor urutnya akan tersedia kembali untuk dokumen berikutnya.',
    onYes: async()=>{
      try{
        await withActionLoader('Menghapus', async()=>{ await StoreTor.remove(id); await refreshDataTor(); });
        toast('Dokumen dihapus','ok'); renderTorView();
      }catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'err'); }
    }});
}

/* ===================== 13. CATATAN: TANPA TAUTAN DATA PEKERJAAN =====================
   Tombol "Pilih Pekerjaan" SENGAJA tidak dipakai pada Dokumen TOR/KAK — seluruh
   isian diketik langsung. Karena itu modul 'tor' TIDAK didaftarkan ke
   DP_USE_TARGETS milik app.js, dan tidak ada pembungkus dpPickerSelect /
   dpTargetPicked / dpCancelPick di berkas ini. Bila suatu saat tautan itu
   dikehendaki, yang perlu ditambahkan: satu entri DP_USE_TARGETS.tor, tiga
   pembungkus tersebut, tombol dpPickBtnHtml('tor') pada kartu Informasi
   Pengadaan, dan atribut dpLock:true pada field yang ikut terkunci. */

/* ===================== 15. INTEGRASI ROUTING =====================
   showView() di app.js tidak mengenal halaman baru ini. Alih-alih menyunting
   app.js, fungsinya DIBUNGKUS di sini: setelah halaman ditukar (2x rAF di
   dalam showView), render halaman TOR dijalankan & menu induk ditandai aktif. */
/* Halaman rab-view & pakta-view DIHAPUS (5 Agu 2026): RAB kini menjadi langkah 4
   penyusunan, dan Pakta Integritas terbit otomatis \u2014 keduanya diakses lewat
   tombol "Lihat" pada daftar, bukan menu tersendiri. */
const TOR_VIEWS = { 'tor-view':'renderTorView', 'tor-susun':'renderTorSusun' };
(function(){
  if(typeof showView!=='function') return;
  var _sv=showView;
  window.showView=function(name){
    /* Mesin klausul dipakai bergantian oleh Kontrak & TOR lewat spkState.
       Saat berpindah ke halaman Kontrak, tautan ke torState DILEPAS supaya
       Susun Kontrak tidak pernah mewarisi data dokumen TOR. */
    try{
      if(String(name||'').indexOf('spk-')===0 && typeof spkState!=='undefined' && spkState && spkState===torState){
        spkState=null; records_klausul=spkKlDefault();
      }
    }catch(e){}
    var r=_sv.apply(this, arguments);
    if(TOR_VIEWS[name]){
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ setTimeout(function(){
        try{
          /* Menu "Dokumen TOR/KAK" tetap aktif saat halaman penyusunan dibuka */
          var target=(name==='tor-susun')?'tor-view':name;
          document.querySelectorAll('#topnav .topnav-item, #topnav .topnav-link').forEach(function(l){
            if(l.dataset.view===target) l.classList.add('active');
          });
          var fn=TOR_VIEWS[name];
          if(typeof window[fn]==='function') window[fn]();
        }catch(e){ console.error('TOR route:', e); }
      },0); }); });
    }
    return r;
  };
})();
(function(){
  if(typeof rerenderActiveView!=='function') return;
  var _rr=rerenderActiveView;
  window.rerenderActiveView=function(){
    try{
      var v=document.querySelector('.view.active');
      if(v){
        var nm=v.id.replace(/^view-/,'');
        if(TOR_VIEWS[nm]){ var fn=TOR_VIEWS[nm]; if(typeof window[fn]==='function'){ window[fn](); return; } }
      }
    }catch(e){}
    return _rr.apply(this, arguments);
  };
})();

/* ===================== 17. TAMBALAN MESIN KLAUSUL BERSAMA =====================
   Pustaka Klausul dipinjam utuh dari Susun Kontrak. Tombol-tombolnya (Naikkan,
   Turunkan, Hapus, + Klausul, Simpan/Muat Profil, Simpan pada editor) memanggil
   renderSpkKlausul() LANGSUNG — bukan lewat renderTorSusun() — sehingga setelah
   ditekan, lencana nomor kembali menjadi "1, 2, 3 ..." dan judul kartu kembali
   berbunyi "Pustaka Klausul SPK".

   Ketiga tambalan di bawah menutup celah itu TANPA menyentuh susun-kontrak.js:
     1) renderSpkKlausul   -> selalu disusul torRelabelKlausul() saat dokumen
                              yang sedang disusun bertipe TOR.
     2) spkKlProfilSnapshot-> ikut merekam penanda bab (k.bab) ke dalam profil.
     3) spkKlProfilWrite   -> mengembalikan penanda bab saat profil dimuat.
   Tanpa (2) & (3), susunan bab hilang begitu pustaka klausul disimpan sebagai
   Profil lalu dipanggil lagi — seluruh klausul akan jatuh ke bab I (kecuali
   yang judulnya masih tertebak oleh TOR_BAB_TEBAK).

   Semuanya memakai penjaga __tor supaya aman bila berkas ini termuat dua kali,
   dan seluruhnya HANYA aktif untuk dokumen TOR (spkState.data.__doktype). Susun
   Kontrak berjalan apa adanya. */
(function(){
  /* Benar hanya bila mesin klausul sedang dipinjam oleh dokumen TOR/KAK
     (lihat torBridgeKlausul: spkState diarahkan ke torState). */
  function torPinjam(){
    try{ return !!(typeof spkState!=='undefined' && spkState && spkState.data && spkState.data.__doktype==='TOR'); }
    catch(e){ return false; }
  }

  if(typeof renderSpkKlausul==='function' && !renderSpkKlausul.__tor){
    var _render=renderSpkKlausul;
    window.renderSpkKlausul=function(){
      var r=_render.apply(this, arguments);
      if(torPinjam()){ try{ torRelabelKlausul(); }catch(e){ console.error('torRelabel:', e); } }
      return r;
    };
    window.renderSpkKlausul.__tor=1;
  }

  if(typeof spkKlProfilSnapshot==='function' && !spkKlProfilSnapshot.__tor){
    var _snap=spkKlProfilSnapshot;
    window.spkKlProfilSnapshot=function(){
      var out=_snap.apply(this, arguments);
      try{
        (records_klausul||[]).forEach(function(k,i){
          var b=parseInt(k&&k.bab,10);
          if(out && out[i] && b>=1 && b<=TOR_BAB.length) out[i].bab=b;
        });
      }catch(e){}
      return out;
    };
    window.spkKlProfilSnapshot.__tor=1;
  }


  /* ---- 5. Popup "Lihat Klausul" memakai penomoran DOKUMEN TOR/KAK ----
     LAPORAN 7 Agu 2026: judul klausul di popup tertulis "7. LINGKUP PEKERJAAN"
     padahal di pratinjau dokumen klausul yang sama bernomor "II.1.".

     SEBAB: spkKlausulView() merender lewat spkClauseDocHtml() milik Susun
     Kontrak. Di sana nomor judul dibangkitkan CSS counter dari KEDUDUKAN
     klausul dalam daftar (1, 2, 3, ...), sedangkan TOR/KAK bernomor
     <bab romawi>.<urut dalam bab> yang hanya diketahui torStruktur(). Kopnya
     pun ikut milik SPK ("SURAT PERINTAH KERJA") karena spkRunHeadHtml yang
     dipakai.

     Keduanya sembuh sekaligus dengan mengalihkan pembangkitan dokumen ke
     torDocHtml() mode fokus — jalur yang SAMA PERSIS dengan pratinjau dokumen,
     jadi nomor, kop, kisi inden, dan CSS-nya tidak mungkin berbeda lagi.

     DAFTAR KLAUSUL DIBANGUN ULANG DI SINI, argumen `klausul` dari pemanggil
     sengaja diabaikan. Alasannya: spkKlausulView menyusun daftarnya lewat
     spkSelectedClauses() yang membaca spkState.sel — mekanisme pemilihan milik
     SPK. TOR memakai penanda `aktif` per klausul, sehingga sel selalu kosong
     dan daftar mundur ke seluruh pustaka TANPA membawa penanda `bab`. Tanpa
     bab, torStruktur() menaruh semuanya di bab I dan nomornya salah lagi. */
  function torBasisKlausul(fokusId){
    var lib=(records_klausul||[]).filter(function(k){ return k && !k.sys; });
    var salin=function(k){
      var o={ id:String(k.id), judul:k.judul||'', isi:k.isi||'' };
      var b=parseInt(k.bab,10); if(b>=1 && b<=TOR_BAB.length) o.bab=b;
      return o;
    };
    var basis=lib.filter(function(k){ return k.aktif!==false; }).map(salin);
    if(fokusId==null) return basis;
    var ada=basis.some(function(x){ return String(x.id)===String(fokusId); });
    if(ada) return basis;
    /* Klausul yang sedang dilihat belum tercentang di Langkah 3. Disisipkan
       pada KEDUDUKAN PUSTAKANYA supaya nomornya tetap masuk akal — sama seperti
       yang dilakukan spkKlausulView untuk SPK. */
    var pos=-1; for(var i=0;i<lib.length;i++){ if(String(lib[i].id)===String(fokusId)){ pos=i; break; } }
    if(pos<0) return basis;
    var idx=0; for(var j=0;j<pos;j++){ if(lib[j].aktif!==false) idx++; }
    basis.splice(idx, 0, salin(lib[pos]));
    return basis;
  }
  if(typeof spkClauseDocHtml==='function' && !spkClauseDocHtml.__tor){
    var _cdh=spkClauseDocHtml;
    window.spkClauseDocHtml=function(data, klausul, opts){
      if(!torPinjam()) return _cdh.apply(this, arguments);
      try{
        var fokus=(opts && opts.focusId!=null) ? String(opts.focusId) : null;
        return torDocHtml((data||{}), torBasisKlausul(fokus), { focusId:fokus });
      }catch(e){
        console.error('torClauseDoc:', e);
        return _cdh.apply(this, arguments);      /* mundur aman ke jalur lama */
      }
    };
    window.spkClauseDocHtml.__tor=1;
  }

  if(typeof spkKlProfilWrite==='function' && !spkKlProfilWrite.__tor){
    var _write=spkKlProfilWrite;
    window.spkKlProfilWrite=function(items){
      /* Fungsi aslinya async & MEMBUAT ULANG seluruh objek klausul (id baru),
         jadi penanda bab dipasang kembali SESUDAH ia selesai, berpasangan
         menurut indeks — urutan items dijamin sama dengan hasilnya. */
      return Promise.resolve(_write.apply(this, arguments)).then(function(res){
        try{
          (items||[]).forEach(function(it,i){
            var b=parseInt(it&&it.bab,10);
            if(records_klausul[i] && b>=1 && b<=TOR_BAB.length) records_klausul[i].bab=b;
          });
          spkKlSync();
        }catch(e){}
        return res;
      });
    };
    window.spkKlProfilWrite.__tor=1;
  }
})();


/* ===================== 15b. FOTO: TEMPELAN KE MESIN KLAUSUL =====================
   Seluruh dukungan foto dipasang dari SINI sebagai tempelan, bukan dengan
   menyunting susun-kontrak.js. Alasannya sama dengan tempelan bab di atas:
   modul Susun Kontrak dipelihara sebagai unit yang bisa diambil utuh dari
   versi lain, jadi fitur khas TOR/KAK tidak boleh menumpang di dalamnya.

   Tiap tempelan berpenjaga __torf supaya aman bila berkas ini termuat dua
   kali, dan seluruhnya bersyarat torFotoAktif() — Surat Perintah Kerja &
   Perjanjian/Kontrak berjalan persis seperti sebelumnya. */
(function(){

  /* ---- 1. Tombol "Sisipkan Foto" pada toolbar editor klausul ---- */
  if(typeof spkWEToolbarHtml==='function' && !spkWEToolbarHtml.__torf){
    var _tb=spkWEToolbarHtml;
    var TOMBOL=
      '<span class="spk-we-sep"></span>'+
      '<div class="spk-we-grp">'+
        '<button type="button" id="tor-we-foto" title="Sisipkan Foto — bisa juga langsung tempel (Ctrl+V) dari papan klip" '+
        'onmousedown="return spkWEmd(event)" onclick="torFotoPilih()">'+
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" style="width:15px;height:15px">'+
          '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/>'+
          '<path d="m21 16-4.5-4.5L9 19"/></svg> Foto</button>'+
      '</div>';
    /* Penanda sisip = grup "Penggaris" pada baris toolbar kedua. Dipilih karena
       string-nya khas & hanya muncul sekali; bila suatu saat berubah, tombol
       cukup tidak tampil — tidak ada yang rusak. */
    var TANDA='<div class="spk-we-grp"><label class="spk-we-check" title="Tampilkan / sembunyikan penggaris">';
    window.spkWEToolbarHtml=function(){
      var h=_tb.apply(this, arguments);
      try{
        if(torFotoAktif() && h.indexOf(TANDA)>=0) h=h.replace(TANDA, TOMBOL+TANDA);
      }catch(e){}
      return h;
    };
    window.spkWEToolbarHtml.__torf=1;
  }

  /* ---- 2. Tempel (Ctrl+V) gambar dari papan klip ----
     Penangan asli (spkWEOnPaste) membaca text/html & text/plain saja; gambar
     di papan klip tidak punya keduanya, sehingga tempelan gambar selama ini
     berakhir tanpa hasil.

     Pendengar dipasang pada INDUK kanvas dengan capture=true, BUKAN pada
     kanvasnya sendiri. Sebabnya halus tapi menentukan: pada elemen yang
     menjadi target peristiwa, pendengar capture & bubble dijalankan menurut
     URUTAN PENDAFTARAN — jadi pendengar di kanvas akan selalu berjalan
     SESUDAH milik editor. Pendaftaran di leluhur membuat fase capture betul-
     betul mendahuluinya, sehingga stopPropagation() sempat mencegah penangan
     asli menyisipkan apa pun. */
  if(typeof spkWEBindDoc==='function' && !spkWEBindDoc.__torf){
    var _bind=spkWEBindDoc;
    window.spkWEBindDoc=function(doc){
      var r=_bind.apply(this, arguments);
      try{
        var induk=doc && doc.parentNode;
        if(induk && !induk.__torfPaste){
          induk.__torfPaste=1;
          induk.addEventListener('paste', function(e){
            if(!torFotoAktif()) return;
            var dt=e.clipboardData||window.clipboardData; if(!dt) return;
            var fs=[], i;
            if(dt.files && dt.files.length){
              for(i=0;i<dt.files.length;i++) fs.push(dt.files[i]);
            }else if(dt.items){
              for(i=0;i<dt.items.length;i++){
                var it=dt.items[i];
                if(it && it.kind==='file' && /^image\//i.test(it.type||'')){
                  var f=it.getAsFile(); if(f) fs.push(f);
                }
              }
            }
            fs=fs.filter(function(f){ return f && /^image\//i.test(f.type||''); });
            if(!fs.length) return;                 /* tempelan teks biasa -> biarkan penangan asli */
            e.preventDefault(); e.stopPropagation();
            torFotoTerima(fs);
          }, true);
        }
      }catch(e){}
      return r;
    };
    window.spkWEBindDoc.__torf=1;
  }

  /* ---- 3a. Foto ikut terbaca sebagai ISI oleh mesin pemangkas klausul ----
     PERBAIKAN 7 Agu 2026 — "foto muncul saat unggah klausul, hilang sesudahnya".

     GEJALANYA. Pratinjau di dalam popup unggah (spkKlDocPreview) menampilkan
     isi klausul APA ADANYA, jadi fotonya terlihat. Pratinjau DOKUMEN memanggil
     spkPruneKlausul() lebih dulu — dan di sanalah fotonya lenyap. Itu sebabnya
     foto "sempat muncul di awal lalu hilang".

     SEBABNYA. spkPruneKlausul memutuskan sebuah butir bernomor layak dibuang
     dengan menggabungkan TEKS seluruh paragraf isinya (`joined`) lalu menguji
     apakah gabungan itu berbentuk kalimat contoh "(Isi ....)". Paragraf yang
     isinya hanya <img> tidak menyumbang teks sama sekali, sehingga pada butir
     yang teks contohnya BELUM diganti, `joined` tetap terbaca sebagai contoh
     murni — butir dinyatakan kosong dan DIBUANG SELURUHNYA, foto ikut terbawa.
     Terverifikasi: butir "3.1. Uraian Pekerjaan" + "(Isi uraian pekerjaan.)" +
     foto -> keluaran spkPruneKlausul tidak lagi memuat <img>.

     CARANYA. spkBlkText() — SATU-SATUNYA pembaca teks yang dipakai
     spkPruneKlausul & spkIsPhBlock (6 pemanggilan, seluruhnya di dua fungsi
     itu) — menambahkan U+2063 INVISIBLE SEPARATOR pada blok yang memuat
     gambar. Idiom yang sama persis dengan tambalan spkWpText di atas: bukan
     spasi, jadi lolos dari setiap .replace(/\s+/g,'') di pipeline, dan tidak
     pernah tampak di layar. Akibatnya `joined` tidak lagi berakhir dengan
     tanda titik/kurung, uji "kalimat contoh" gagal sebagaimana mestinya, dan
     butir yang memuat foto selalu dihitung sebagai butir berisi.

     Penanda ditempel di UJUNG supaya penguji yang ber-JANGKAR AWAL tidak
     terganggu: SPK_TOK_BUTIR / SPK_TOK_SUB tetap mengenali "3.1." di awal
     paragraf yang juga memuat gambar sebaris. */
  if(typeof spkBlkText==='function' && !spkBlkText.__torf){
    var _blk=spkBlkText;
    window.spkBlkText=function(el){
      var t=_blk.apply(this, arguments);
      try{ if(el && el.querySelector && el.querySelector('img')) return String(t||'')+'\u2063'; }catch(e){}
      return t;
    };
    window.spkBlkText.__torf=1;
  }

  /* ---- 3b. Foto yang menempel pada JUDUL BUTIR dipisah jadi blok sendiri ----
     Celah terakhir dari kelas kesalahan yang sama, dan satu-satunya yang tidak
     bisa ditutup lewat spkBlkText: spkPruneKlausul menilai "butir ini hanya
     berisi contoh" dari paragraf ISI-nya saja (`everyBlkPh`), tidak pernah dari
     paragraf JUDUL-nya. Foto yang ditempel SEBARIS di judul butir — mis.
     "<p class=kl1>3.1. Uraian <img></p>" dengan isi yang teks contohnya belum
     diganti — karena itu tetap ikut terbuang bersama butirnya.

     Fotonya DIPINDAH ke paragraf tersendiri tepat di bawah judul, bukan
     dipertahankan sebaris. Itu memang bentuk yang sudah ditetapkan untuk foto
     di dokumen ini (lihat torFotoBlokHtml bagian 9b: "Paragraf foto dibuat
     SEBAGAI BLOK TERSENDIRI ... karena seluruh aturan ukuran yang ditetapkan
     hanya bermakna untuk blok tersendiri"), sehingga pemisahan ini sekaligus
     menyeragamkan foto yang masuk dari Word dengan foto yang disisipkan lewat
     tombol. Setelah dipisah, butirnya punya satu blok isi yang BUKAN contoh,
     jadi `everyBlkPh` bernilai salah dan butirnya bertahan.

     Hanya paragraf yang BENAR-BENAR judul butir yang disentuh (diawali penanda
     "3.1." / "a." menurut SPK_TOK_BUTIR & SPK_TOK_SUB — mesin pengenal yang
     sama dengan yang dipakai spkPruneKlausul), sehingga gambar sebaris di
     paragraf biasa tidak berubah tempat. */
  if(typeof spkPruneKlausul==='function' && !spkPruneKlausul.__torf){
    var _prune=spkPruneKlausul;
    window.spkPruneKlausul=function(html, klNo, data){
      var s=String(html==null?'':html);
      try{
        if(s.indexOf('<img')>=0 && typeof SPK_TOK_BUTIR!=='undefined' && typeof SPK_TOK_SUB!=='undefined'){
          var box=document.createElement('div'); box.innerHTML=s;
          var ubah=false, ps=Array.prototype.slice.call(box.children);
          for(var i=0;i<ps.length;i++){
            var p=ps[i];
            if(!p.querySelector || !p.querySelector('img')) continue;
            var tx=String(p.textContent||'').replace(/ /g,' ').replace(/\s+/g,' ').trim();
            if(!tx) continue;                                   /* sudah blok foto tersendiri */
            if(!(SPK_TOK_BUTIR.test(tx) || SPK_TOK_SUB.test(tx))) continue;   /* bukan judul butir */
            var np=document.createElement('p');
            np.className='kl0 tor-foto';
            /* appendChild MEMINDAHKAN simpul, jadi gambarnya lepas dari judul
               dan tidak pernah tergandakan. */
            Array.prototype.slice.call(p.querySelectorAll('img'))
              .forEach(function(im){ np.appendChild(im); });
            p.parentNode.insertBefore(np, p.nextSibling);
            ubah=true;
          }
          if(ubah) s=box.innerHTML;
        }
      }catch(e){ console.error('tor prune foto:', e); }
      return _prune.call(this, s, klNo, data);
    };
    window.spkPruneKlausul.__torf=1;
  }

  /* ---- 3. Paragraf berisi FOTO bukan "blok contoh" ----
     spkIsPhBlock() menilai kosong/tidaknya sebuah blok dari TEKS-nya saja,
     sehingga paragraf yang isinya hanya <img> terbaca kosong lalu dibuang
     spkPruneKlausul() — foto akan hilang dari dokumen tanpa pesan apa pun.
     Berlaku untuk SEMUA bentuk dokumen dengan sengaja: membuang gambar
     diam-diam tidak pernah menjadi perilaku yang diinginkan di mana pun. */
  if(typeof spkIsPhBlock==='function' && !spkIsPhBlock.__torf){
    var _ph=spkIsPhBlock;
    window.spkIsPhBlock=function(el){
      try{ if(el && el.querySelector && el.querySelector('img')) return false; }catch(e){}
      return _ph.apply(this, arguments);
    };
    window.spkIsPhBlock.__torf=1;
  }

  /* ---- 4. Gambar dari template .docx ----
     Jalur baca Word (spkWpText) hanya membaca w:t / w:tab / w:br, sehingga
     w:drawing (gambar modern) & w:pict (gambar warisan) diabaikan — gambar
     pada template hilang di web meski byte .docx aslinya tetap tersimpan di
     rec.isi_docx dan muncul kembali saat template diunduh. Beda perilaku itu
     menyesatkan; di sini gambarnya benar-benar ikut masuk.

     Prosesnya dua tahap karena unggahan bersifat async sedangkan pembaca XML
     sinkron:
       tahap 1 (sinkron) : gambar ditulis sebagai penanda <img data-torwrid>
       tahap 2 (async)   : byte media diambil dari zip, diunggah, penanda
                           ditukar dengan URL-nya.
     Berkas .zip hasil bacaan disimpan sebentar lewat tempelan spkUnzip —
     spkKlDocReadFile membongkarnya sendiri di dalam dan tidak menyediakan
     jalan lain untuk melihat isi word/media. */
  var R_NS='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  var _zipTerakhir=null;

  if(typeof spkUnzip==='function' && !spkUnzip.__torf){
    var _unzip=spkUnzip;
    window.spkUnzip=function(){
      return Promise.resolve(_unzip.apply(this, arguments)).then(function(z){
        try{ if(z && z['word/document.xml']) _zipTerakhir=z; }catch(e){}
        return z;
      });
    };
    window.spkUnzip.__torf=1;
  }

  /* rId gambar di dalam satu paragraf Word, menurut urutan kemunculannya. */
  function torWRid(p){
    var out=[];
    try{
      var all=p.getElementsByTagName('*');
      for(var i=0;i<all.length;i++){
        var n=all[i], ln=n.localName, id='';
        if(ln==='blip')          id=n.getAttributeNS(R_NS,'embed')||n.getAttribute('r:embed')||'';
        else if(ln==='imagedata')id=n.getAttributeNS(R_NS,'id')   ||n.getAttribute('r:id')   ||'';
        if(id && out.indexOf(id)<0) out.push(id);
      }
    }catch(e){}
    return out;
  }
  if(typeof spkWpText==='function' && !spkWpText.__torf){
    var _wp=spkWpText;
    window.spkWpText=function(p){
      var t=_wp.apply(this, arguments);
      try{
        if(!torFotoAktif()) return t;
        var ids=torWRid(p);
        if(!ids.length) return t;
        for(var i=0;i<ids.length;i++) t.html += '<img data-torwrid="'+fkEsc(ids[i])+'" alt="">';
        /* U+2063 (INVISIBLE SEPARATOR) — bukan spasi, jadi lolos dari
           .replace(/\s+/g,'').trim() di seluruh penyaring "paragraf kosong"
           tanpa pernah tampak di layar. Tanpa ini paragraf yang isinya hanya
           gambar dianggap baris kosong dan dibuang sebelum sempat dirender. */
        t.plain = (t.plain||'') + '\u2063';
      }catch(e){}
      return t;
    };
    window.spkWpText.__torf=1;
  }

  function torMimeDari(nama){
    var e=String(nama||'').toLowerCase().split('.').pop();
    if(e==='png') return 'image/png';
    if(e==='gif') return 'image/gif';
    if(e==='bmp') return 'image/bmp';
    if(e==='webp')return 'image/webp';
    if(e==='tif'||e==='tiff') return 'image/tiff';
    if(e==='emf'||e==='wmf')  return '';     /* metafile: peramban tak bisa membacanya */
    return 'image/jpeg';
  }
  /* Peta rId -> berkas media di dalam zip */
  function torRelsMedia(zip){
    var peta={};
    try{
      var rel=zip && zip['word/_rels/document.xml.rels']; if(!rel) return peta;
      var xml=new TextDecoder().decode(rel);
      var d=new DOMParser().parseFromString(xml,'application/xml');
      var rs=d.getElementsByTagName('Relationship');
      for(var i=0;i<rs.length;i++){
        var id=rs[i].getAttribute('Id')||'';
        var tgt=String(rs[i].getAttribute('Target')||'').replace(/^\/+/,'');
        if(!id || !/media\//i.test(tgt)) continue;
        peta[id]='word/'+tgt.replace(/^word\//i,'');
      }
    }catch(e){}
    return peta;
  }
  /* Tukar seluruh penanda <img data-torwrid> dengan URL hasil unggahan.
     Penanda yang gagal diunggah DIBUANG, bukan dibiarkan jadi gambar rusak. */
  async function torFotoDariDocx(html, zip){
    var s=String(html||'');
    if(s.indexOf('data-torwrid')<0) return s;
    var box=document.createElement('div'); box.innerHTML=s;
    var tags=box.querySelectorAll('img[data-torwrid]');
    if(!tags.length) return s;
    var peta=torRelsMedia(zip), cache={}, i;
    for(i=0;i<tags.length;i++){
      var im=tags[i], rid=im.getAttribute('data-torwrid')||'';
      /* CACHE DIPATOK PADA BERKAS MEDIA, BUKAN rId (perbaikan 7 Agu 2026).
         Word membuat relationship BARU setiap kali sebuah gambar disisipkan,
         tetapi seluruhnya menunjuk ke satu berkas yang sama di word/media/.
         Satu foto yang ditempel 4x di template berarti 4 rId dengan target
         identik — dengan kunci rId, cache-nya selalu meleset dan byte yang
         sama diunggah 4 kali. Kunci sekarang nama berkas medianya, sehingga
         satu berkas = satu unggahan, apa pun jumlah rId yang menunjuknya.
         (rId dipakai sebagai kunci cadangan hanya bila relationship-nya tidak
         terpetakan — di sana memang tidak ada yang bisa dibandingkan.) */
      var kunci=peta[rid] || ('#'+rid);
      var url=cache[kunci];
      if(url===undefined){
        url='';
        try{
          var nama=peta[rid], byte=nama?zip[nama]:null, mime=nama?torMimeDari(nama):'';
          if(byte && mime){
            var bl=new Blob([byte], {type:mime});
            bl.name=nama.split('/').pop();
            url=(await torFotoUpload(bl)).url;
          }
        }catch(err){ console.error('foto .docx:', err); url=''; }
        cache[kunci]=url;
      }
      if(url){ im.removeAttribute('data-torwrid'); im.setAttribute('src', url); im.setAttribute('alt',''); }
      else if(im.parentNode){ im.parentNode.removeChild(im); }
    }
    /* Paragraf yang gambarnya gagal diunggah kini benar-benar kosong -> buang,
       supaya tidak menyisakan baris hampa di tengah klausul. */
    var ps=box.querySelectorAll('p');
    for(i=0;i<ps.length;i++){
      var pp=ps[i];
      if(pp.querySelector('img')) continue;
      if(pp.getAttribute('data-blank')==='1') continue;
      if(!String(pp.textContent||'').replace(/[\s\u00A0\u2063]/g,'') && pp.parentNode) pp.parentNode.removeChild(pp);
    }
    return box.innerHTML;
  }

  if(typeof spkKlDocReadFile==='function' && !spkKlDocReadFile.__torf){
    var _baca=spkKlDocReadFile;
    window.spkKlDocReadFile=async function(file){
      _zipTerakhir=null;
      var r=await _baca.apply(this, arguments);
      try{
        if(!torFotoAktif()) return r;
        if(!_zipTerakhir || !spkKlDoc || String(spkKlDoc.isi||'').indexOf('data-torwrid')<0) return r;
        var zip=_zipTerakhir;
        var jml=(String(spkKlDoc.isi).match(/data-torwrid/g)||[]).length;
        spkKlDoc.isi = await withActionLoader('Mengunggah '+jml+' gambar dari template',
          function(){ return torFotoDariDocx(spkKlDoc.isi, zip); });
        try{ spkKlDocHead(); spkKlDocPreview(); }catch(e){}
        toast(jml>1 ? (jml+' gambar template ikut disimpan') : 'Gambar template ikut disimpan','ok');
      }catch(err){ console.error('spkKlDocReadFile foto:', err); }
      finally{ _zipTerakhir=null; }
      return r;
    };
    window.spkKlDocReadFile.__torf=1;
  }
})();

/* ===================== 16. INIT ===================== */
async function torInit(){
  try{ await refreshDataTor(); }catch(e){}
  try{
    var v=document.querySelector('.view.active');
    if(v && TOR_VIEWS[v.id.replace(/^view-/,'')]) rerenderActiveView();
  }catch(e){}
}
try{ torInit(); }catch(e){ console.error('torInit:', e); }
