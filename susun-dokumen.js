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
/* Jenis pengadaan yang otomatis mengikuti kode klasifikasi terpilih */
const TOR_KLAS_JENIS = {
  'DAN.01.01':'Barang', 'DAN.01.02':'Jasa', 'DAN.01.03':'Barang dan Jasa'
};
const TOR_BIDANG_OPTS = (typeof BIDANG_OPTS!=='undefined' && BIDANG_OPTS.length) ? BIDANG_OPTS
                      : ((typeof PN_BIDANG_OPTS!=='undefined') ? PN_BIDANG_OPTS : []);
const TOR_RISIKO_OPTS  = ['Risiko Rendah','Risiko Menengah','Risiko Tinggi'];
const TOR_ANGGARAN_OPTS= ['Investasi','Operasi'];
const TOR_METODE_OPTS  = ['Pengadaan Langsung','Penunjukan Langsung','Tender Terbatas','Tender Terbuka','Seleksi Umum','Seleksi Terbatas','Tender Cepat'];

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
    {k:'jenis_pengadaan', l:'Jenis Pengadaan', t:'select', opts:['Barang','Jasa','Barang dan Jasa'], def:''},
    {k:'metode_pengadaan', l:'Metode Pengadaan', t:'select', opts:TOR_METODE_OPTS, def:''},
    {k:'level_risiko', l:'Level Risiko Pekerjaan', t:'select', opts:TOR_RISIKO_OPTS, def:''},
    /* Jangka Waktu Pelaksanaan pindah ke sini dari kartu "Pelaksanaan &
       Pembayaran" yang dihapus. Terbilangnya tetap otomatis
       ({{jangka_waktu_terbilang}}) dan ikut tampil di sampul dokumen. */
    {k:'jangka_waktu', l:'Jangka Waktu Pelaksanaan (hari)', t:'number', def:''},
    /* Terbilangnya TIDAK dijadikan field — dihitung otomatis saat dokumen
       dibangun ({{nilai_pekerjaan_terbilang}}). */
    {k:'nilai_pekerjaan', l:'Perkiraan Nilai Pekerjaan (+ PPN)', t:'rupiah', def:''},
    /* Terbilang TIDAK disimpan sebagai data \u2014 ia diturunkan dari Perkiraan
       Nilai Pekerjaan lewat torAutoVal('terbilang_nilai'). Field ber-atribut
       `auto` digambar terkunci (readonly + cursor not-allowed) dan disegarkan
       torRefreshAuto() pada tiap ketikan rupiah, jadi angkanya mustahil
       tertinggal dari nilainya. Kode isiannya tetap {{nilai_pekerjaan_terbilang}}. */
    {k:'nilai_pekerjaan_terbilang', l:'Terbilang', t:'text', auto:'terbilang_nilai'},
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
     tidak lagi otomatis dianggap DAN.01.03. Jenis Pengadaan ikut kosong dan
     baru terisi sendiri begitu klasifikasinya dipilih (lihat torSet). */
  d.kode_klasifikasi=d.kode_klasifikasi||'';
  /* Pengguna Barang/Jasa: bawaan = data terakhir disimpan (lihat torApplyLastPengguna) */
  torApplyLastPengguna(d);
  d.jenis_pengadaan=d.kode_klasifikasi ? (TOR_KLAS_JENIS[d.kode_klasifikasi]||'') : '';
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
    if(kind==='terbilang_nilai')    return (d.nilai_pekerjaan!=='' && d.nilai_pekerjaan!=null) ? spkTerbilangRupiah(d.nilai_pekerjaan) : '';
    if(kind==='terbilang_jangka')   return d.jangka_waktu ? (spkTerbilang(d.jangka_waktu)+' Hari Kalender') : '';
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
  ctx.kode_unit         = TOR_UNIT;
  ctx.dok_label         = TOR_DOK_LABEL;
  ctx.dok_title         = TOR_DOK_TITLE;
  ctx.tgl_dokumen_pjg   = spkDateLong(d.tgl_dokumen);
  ctx.hari_dokumen      = spkDayName(d.tgl_dokumen);
  /* --- Nilai & terbilang ---
     Terbilang TIDAK lagi menjadi field isian: seluruhnya dihitung di sini,
     sehingga otomatis muncul di Pratinjau/Cetak lewat placeholder-nya. */
  ctx.nilai_pekerjaan           = (d.nilai_pekerjaan!==''&&d.nilai_pekerjaan!=null) ? spkRupiah(d.nilai_pekerjaan) : '';
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

/* ===================== 7. FORM — ISIAN FIELD ===================== */
function torSet(k,v){
  if(!torState) return;
  torState.data[k]=v;
  if(k==='kode_klasifikasi'){
    /* Kembali ke "— pilih —" -> Jenis Pengadaan ikut dikosongkan. */
    torState.data.jenis_pengadaan = v ? (TOR_KLAS_JENIS[v]||'') : '';
  }
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
  ['nilai_pekerjaan_terbilang','Terbilang perkiraan nilai pekerjaan'],
  ['jangka_waktu_terbilang','Terbilang jangka waktu'],
  ['tahun_anggaran','Tahun anggaran (= tahun berjalan)'],
  ['sumber_dana','APLN Tahun … Anggaran Investasi/Operasi'],
  ['no_prk_baris','Nomor PRK, satu per baris'],
  ['nama_unit','Nama unit (baku)'],
  ['singkatan_unit','Singkatan unit (baku)'],
  ['lokasi_unit','Alamat unit (baku)'],
  ['unit_lengkap','PT PLN (Persero) + nama unit'],
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
    (f.auto==='terbilang_nilai') ? 'Terisi otomatis dari Perkiraan Nilai Pekerjaan' :
    (f.auto==='terbilang_jangka')? 'Terisi otomatis dari Jangka Waktu Pelaksanaan' : '');
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
    '.tor-dk-mdl{width:min(560px,100%);background:#fff;border-radius:16px;overflow:hidden;'+
      'box-shadow:0 24px 60px rgba(10,30,40,.28)}'+
    '.tor-dk-hd{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;'+
      'background:linear-gradient(90deg,#0E7C86,#12A0A8);color:#fff}'+
    '.tor-dk-hd b{display:block;font-size:14px}'+
    '.tor-dk-hd i{display:block;font-style:normal;font-size:11.5px;opacity:.85;margin-top:2px}'+
    '.tor-dk-hd .x{border:0;background:rgba(255,255,255,.18);color:#fff;width:28px;height:28px;'+
      'border-radius:8px;font-size:18px;line-height:1;cursor:pointer;flex:none}'+
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
function torBatalClick(){
  torEditId=null; torState=torBlankState(); torStep=1;
  showView('tor-view');
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
  toast('Dokumen TOR/KAK berhasil disimpan','ok');
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
  /* ---- Daftar isi ----
     Kolom nomor dilebarkan (bawaan 44px pas untuk "01", tidak untuk "II.10")
     dan baris judul bab ditebalkan supaya susunannya terbaca sekali lihat. */
  '.spk-tocpage .spk-toc2.tor-toc .row .no{width:58px}'+
  '.spk-tocpage .spk-toc2.tor-toc.d1 .row .no{width:52px}'+
  '.spk-tocpage .spk-toc2.tor-toc.d2 .row .no{width:46px}'+
  '.spk-tocpage .spk-toc2.tor-toc.toc-2k .row .no{width:46px}'+
  '.spk-toc2.tor-toc .row.bab .no,.spk-toc2.tor-toc .row.bab .nm{font-weight:800;color:#1B3A6B;text-transform:uppercase}'+
  '.spk-cover.cv-tor .cv-title{font-size:44px;max-width:82%}'+
  '.spk-cover.cv-tor .cv-title .l2{display:block;color:#E0A200;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  /* Nomor dokumen tepat DI BAWAH tulisan TOR/KAK */
  '.spk-cover.cv-tor .cv-docno{margin-top:14px;display:inline-flex;align-items:center;gap:10px;'+
    'padding:9px 16px;border-radius:9px;background:#1B3A6B;color:#fff;border-left:4px solid #F6B40E;'+
    '-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  '.spk-cover.cv-tor .cv-docno span{font-size:9px;font-weight:700;letter-spacing:.2em;color:#C3D2EA}'+
  '.spk-cover.cv-tor .cv-docno b{font-size:15px;font-weight:800;letter-spacing:.02em}'+
  '.spk-cover.cv-tor .cv-kind{background:#E6F0FF;color:#1B3A6B;border:1px solid #BFD4F2}'+
  '.spk-cover.cv-tor .cv-unit{margin-top:16px;text-align:center;font-size:13px;font-weight:800;color:#1B3A6B;line-height:1.6}'+
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
  '.tor-ttd .tgl{text-align:right;margin-bottom:10pt}'+
  '.tor-ttd table.tt{width:100%;border-collapse:collapse;table-layout:fixed}'+
  '.tor-ttd table.tt td{border:0;padding:0;vertical-align:top}'+
  '.tor-ttd td.kol{text-align:center}'+
  '.tor-ttd td.gap{width:33.33%}'+
  '.tor-ttd .cap{margin-bottom:2pt}'+
  '.tor-ttd .jab{font-weight:700}'+
  /* Ruang bubuh tanda tangan & cap */
  '.tor-ttd .sp{height:2.2cm}'+
  '.tor-ttd .nm{font-weight:700}'+
  /* Jarak antara baris penanda tangan atas dengan baris pengesah */
  '.tor-ttd table.tt tr + tr td{padding-top:14pt}';
}
/* ---- Sampul ---- */
function torCoverHtml(data, ctx){
  const esc=fkEsc;
  const logo=(typeof SPK_LOGO_SRC!=='undefined' && SPK_LOGO_SRC) ? '<img src="'+SPK_LOGO_SRC+'" alt="PLN">' : '';
  const fld=(k,v,cls)=>{
    const kosong=!(v && String(v).trim());
    return '<div class="f"><div class="fk">'+esc(k)+'</div>'+
      '<div class="fv'+(kosong?' kosong':'')+(cls?' '+cls:'')+'">'+(kosong?'—':esc(v))+'</div></div>';
  };
  const unit=ctx.unit_lengkap||'PT PLN (Persero) UP3 Masohi';
  return ''+
  '<section class="spk-page spk-cover cv-spk cv-tor">'+
    '<div class="cv-top">'+
      '<div class="cv-brand">'+logo+
        '<div class="cv-org"><span>PT PLN (PERSERO)</span><b>'+esc(TOR_SINGKATAN_UNIT)+'</b></div>'+
      '</div>'+
      '<div class="cv-kind">DOKUMEN PENGADAAN</div>'+
    '</div>'+
    '<div class="cv-rule"></div>'+
    '<div class="cv-accent"></div>'+
    '<div class="cv-eyebrow">'+esc(String(data.metode_pengadaan||'PENGADAAN LANGSUNG').toUpperCase())+'</div>'+
    /* Judul TOR/KAK dua baris ... */
    '<h1 class="cv-title"><span>'+esc(TOR_JUDUL_BARIS1)+'</span><span class="l2">'+esc(TOR_JUDUL_BARIS2)+'</span></h1>'+
    /* ... dan TEPAT DI BAWAHNYA nomor dokumen (0001.TOR/DAN.01.03/F17060000/2026) */
    '<div class="cv-docno"><span>NOMOR</span><b>'+esc(data.no_dokumen||'—')+'</b></div>'+
    '<div class="cv-rule2"></div>'+
    '<div class="cv-parties">'+
      '<div class="p"><div class="pl">PEKERJAAN</div><div class="pn">'+esc(data.nama_pekerjaan||'—')+'</div></div>'+
      '<div class="p"><div class="pl">LOKASI</div><div class="pn">'+esc(data.lokasi_pekerjaan||'—')+'</div></div>'+
    '</div>'+
    '<div class="cv-spacer"></div>'+
    '<div class="cv-grid">'+
      fld('BIDANG PELAKSANA', data.pelaksana)+
      fld('JENIS PENGADAAN', data.jenis_pengadaan)+
      fld('METODE PENGADAAN', data.metode_pengadaan)+
      fld('LEVEL RISIKO', data.level_risiko)+
      fld('JANGKA WAKTU', ctx.auto_terbilang_jangka ? ((data.jangka_waktu||'')+' ('+ctx.jangka_waktu_terbilang+') Hari Kalender') : '')+
      fld('TANGGAL DOKUMEN', ctx.tgl_dokumen_pjg)+
      fld('SUMBER ANGGARAN', ctx.sumber_dana_no, 'fv-lastrow fv-fit')+
      fld('TANGGAL ANGGARAN', ctx.sumber_dana_tgl_pjg, 'fv-lastrow')+
    '</div>'+
    '<div class="cv-nilai">'+
      '<div class="l"><div class="fk">PERKIRAAN NILAI PEKERJAAN</div>'+
        '<div class="terb">('+esc(ctx.nilai_pekerjaan_terbilang||'')+')</div></div>'+
      '<div class="r">'+esc(ctx.nilai_pekerjaan||'')+'</div>'+
    '</div>'+
    '<div class="cv-unit">'+esc(unit)+'</div>'+
    '<div class="cv-rule"></div>'+
    '<div class="cv-foot"><div>'+esc((typeof SPK_ALAMAT_1!=='undefined')?SPK_ALAMAT_1:'')+'</div>'+
      '<div>'+esc((typeof SPK_ALAMAT_2!=='undefined')?SPK_ALAMAT_2:'')+'</div></div>'+
  '</section>';
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
      '<span class="no">'+esc(s.lebur?(s.rom+'.'):s.no)+'</span>'+
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
  return ''+
  '<section class="spk-page spk-tocpage">'+
    '<div class="toc-accent"></div>'+
    '<div class="toc-head"><h1>Daftar Isi</h1>'+
      '<div class="toc-meta"><b>'+esc(TOR_DOK_LABEL)+'</b><span>'+esc(data.no_dokumen||'\u2014')+'</span></div>'+
    '</div>'+
    '<div class="toc-rule"></div>'+
    '<div class="spk-toc2 tor-toc'+spkTocDensity(n)+'">'+rows+'</div>'+
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
  return '<div class="spk-clause">'+
    '<div class="spk-cl-h tor-babh"><span class="n" data-no="'+fkEsc(B.rom)+'."></span>'+fkEsc(B.nama)+'</div>'+
    '<div class="spk-cl"><p class="kl0">'+fkEsc(TOR_PENUTUP_TEKS)+'</p></div>'+
  '</div>';
}
/* ---- BLOK PENGESAHAN TANDA TANGAN ----
   Susunannya mengikuti lampiran TOR/KAK (tabel 3 kolom di akhir dokumen):

       Masohi, <tanggal dokumen>                    <- rata kanan
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
  const kolom=(cap,jab,nama)=>'<td class="kol">'+
      '<div class="cap">'+esc(cap)+'</div>'+
      '<div class="jab">'+esc(jab||'\u2014')+'</div>'+
      '<div class="sp"></div>'+
      '<div class="nm">'+esc(nama||'\u2014')+'</div>'+
    '</td>';
  /* Baris atas: dua penanda tangan bila ada Pengawas, satu bila tidak. */
  const atas = adaPgw
    ? '<tr>'+kolom('Diperiksa oleh;',dirJ,dirN)+'<td class="gap"></td>'+kolom('Disusun oleh;',pgwJ,pgwN)+'</tr>'
    : '<tr><td class="gap"></td><td class="gap"></td>'+kolom('Disusun oleh;',dirJ,dirN)+'</tr>';
  return '<div class="tor-ttd spk-keep">'+
    '<div class="tgl">'+esc(ctx.tempat_tanggal||'')+'</div>'+
    '<table class="tt"><tbody>'+atas+
      '<tr><td class="gap"></td>'+kolom('Disahkan oleh;',pguJ,pguN)+'<td class="gap"></td></tr>'+
    '</tbody></table>'+
  '</div>';
}
/* ---- Dokumen lengkap ----
   Pipeline & KISI INDEN dipakai ulang dari Surat Perintah Kerja (bungkus
   .spk-doc.spk-spk), sehingga inden klausul TOR = inden SPK. */
function torDocHtml(data, klausul){
  data=data||{}; klausul=klausul||[];
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
      spkStripFontStyle(spkPruneKlausul(spkMerge(spkSortDefinisiIf(k.judul, k.isi||''), ctx), str[i].urut, data))
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
    const s=str[i], inner=spkPkTidy(pre[i], false);
    let out='';
    /* Bab I & II: judul bab berdiri sendiri di atas klausul pertamanya. */
    if(s.awal && !s.lebur) out+='<div class="spk-clause tor-babonly">'+babHead(s)+'</div>';
    /* Bab bertanda `tunggal` yang hanya berisi satu klausul (III. PENUTUP):
       judul klausul DILEBUR jadi judul bab, isinya langsung menempel — sama
       seperti lampiran TOR Word. */
    const head = s.lebur ? babHead(s)
      : '<div class="spk-cl-h"><span class="n" data-no="'+fkEsc(s.no)+'."></span>'+spkFmtJudul(k.judul)+'</div>';
    out+='<div class="spk-clause">'+head+
      '<div class="spk-cl'+spkLeadIndentCls(inner)+'">'+inner+'</div></div>';
    return out;
  }).join('');
  SPK_HANG_OVR=null; SPK_JH_OVR=0;

  /* Bab PENUTUP: dipakai dari pustaka bila ada klausul di bab terakhir,
     selain itu dibangkitkan otomatis dari teks baku lampiran TOR. */
  const babAkhir=TOR_BAB.length;
  const adaPenutup=str.some(s=>s.bab===babAkhir);
  const isiBody=
    '<div class="spk-bab"><b>'+fkEsc(TOR_DOK_LABEL)+'</b><span>'+fkEsc(data.no_dokumen||'')+'</span></div>'+
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
    spkKlItalicAsing(torCoverHtml(data,ctx)+torTocHtml(data,klausul)+isi)+
  '</div>';

  return '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width, initial-scale=1"><title>&#8203;</title>'+
    (typeof fklDocFontLink==='function'?fklDocFontLink():'')+
    '<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">'+
    '<style>'+
    (typeof fklDocBaseCss==='function'?fklDocBaseCss():'')+
    (typeof hpsExtraDocCss==='function'?hpsExtraDocCss():'')+
    spkDocCss()+spkDocCss2()+spkClHeadCss(klausul.length,false)+torDocCss(wKl, wBab)+
    '</style></head><body><div id="spk-docs">'+body+'</div>'+
    spkKisiScript()+spkPageScript()+fklFitScript()+'</body></html>';
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
   (lihat torTtdHtml): tanggal rata kanan, lalu tabel 3 kolom berisi
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
  const kol=(cap,jab,nama)=>'<td><div class="hps-topgap"></div>'+
      '<div class="role">'+esc(cap)+'</div>'+
      '<div class="role2">'+esc(jab||'\u2014')+'</div>'+
      '<div class="gap"></div>'+
      '<div class="nm nm-up">'+esc(nama||'(..........................)')+'</div></td>';
  const kosong='<td class="kosong"></td>';
  const atas = adaPgw
    ? '<tr>'+kol('Diperiksa oleh;',dirJ,dirN)+kosong+kol('Disusun oleh;',pgwJ,pgwN)+'</tr>'
    : '<tr>'+kosong+kosong+kol('Disusun oleh;',dirJ,dirN)+'</tr>';
  const tgl=TOR_KOTA_TTD+', '+(typeof spkDateLong==='function'?spkDateLong(data.tgl_dokumen):'');
  return '<div class="rab-ttd">'+
    '<div class="ttd-date rab-tgl">'+esc(tgl)+'</div>'+
    '<table class="ttd ttd3"><tbody>'+atas+
      '<tr>'+kosong+kol('Disahkan oleh;',pguJ,pguN)+kosong+'</tr>'+
    '</tbody></table></div>';
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
  return fklDocShell(hpsExtraDocCss()+
    '.rab-jd{margin:16px 0 4px}'+
    '.rab-jd .fkl-doc-titlegap{height:6px}'+
    /* Jarak Nama/Lokasi Pekerjaan ke tabel rincian */
    'table.fkl-info.rab-info{margin-bottom:12px}'+
    /* --- Tanda tangan 3 kolom (formasi TOR/KAK) ---
       `tr.ttd-row .ttd td{width:50%}` bawaan gaya HPS dibuat untuk DUA kolom,
       jadi varian .ttd3 memakai sepertiga lebar & kolom penyeimbang kosong. */
    'tr.ttd-row .ttd.ttd3 td{width:33.33%}'+
    'tr.ttd-row .ttd.ttd3 td.kosong{padding:0}'+
    'tr.ttd-row .ttd.ttd3 tr + tr td{padding-top:10px}'+
    '.rab-ttd .rab-tgl{text-align:right;margin:0 12px 6px 0}'+
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
/* Penanda tangan sesuai peran */
function torPiOrang(data, peran){
  const d=data||{};
  if(peran==='direksi') return {nama:d.nama_direksi||'', jab:d.jabatan_direksi||'', nip:d.nip_direksi||''};
  return {nama:d.nama_pengguna||'', jab:d.jabatan_pengguna||'', nip:d.nip_pengguna||''};
}
function torPiJudul(peran){
  return 'Pakta Integritas '+(peran==='direksi'?'Direksi Pekerjaan':'Pengguna Barang/Jasa');
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
  const isi='<div class="fkl-doc pnw-doc hps-doc">'+
    torKopHtml()+
    torJudulDokHtml('PAKTA INTEGRITAS','')+
    '<div class="pi-sub">SISTEM MANAJEMEN ANTI PENYUAPAN (SMAP)</div>'+
    '<p class="pi-p">'+esc(pembuka)+'</p>'+
    '<table class="pi-tb"><tbody>'+
      brs('Nama', esc(org.nama||'\u2014'))+
      brs('NIP', esc(org.nip||'\u2014'))+
      brs('Jabatan', esc(org.jab||'\u2014'))+
    '</tbody></table>'+
    '<p class="pi-p">dalam hal ini sebagai :</p>'+
    '<div class="pi-cks">'+cek+'</div>'+
    '<table class="pi-tb"><tbody>'+
      brs('Satuan/ Unit Kerja', esc(ctx.unit_lengkap||TOR_NAMA_UNIT||''))+
      brs('Nama Pekerjaan', esc(data.nama_pekerjaan||'\u2014'))+
      brs('Perkiraan Pekerjaan', esc(rp(torPiNilai(data))))+
      brs('No. Anggaran', angg)+
      brs('No. PRK', prk.length?prk.map(esc).join('<br>'):'\u2014')+
    '</tbody></table>'+
    '<p class="pi-p">selanjutnya disebut PIHAK YANG MENANDATANGANI PAKTA INTEGRITAS.</p>'+
    '<p class="pi-p">Dengan ini saya menyatakan dan berkomitmen untuk:</p>'+
    '<ol class="pi-ol">'+TOR_PI_KOMITMEN.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ol>'+
    TOR_PI_TUTUP.map(t=>'<p class="pi-p">'+esc(t)+'</p>').join('')+
    '<div class="pi-tgl">'+esc(ctx.tempat_tanggal||'')+'</div>'+
    '<div class="pi-ttd">'+torTtdHpsHtml(null,
      {cap:'Yang menyatakan,', jab:org.jab, nama:org.nama})+'</div>'+
  '</div>';
  return fklDocShell(hpsExtraDocCss()+
    '.pi-sub{text-align:center;font-weight:700;font-size:11px;margin:-4px 0 10px;letter-spacing:.02em}'+
    '.pi-p{margin:0 0 6px;text-align:justify}'+
    '.pi-tb{border-collapse:collapse;margin:0 0 8px}'+
    '.pi-tb td{border:0;padding:1px 0;vertical-align:top}'+
    '.pi-tb td.l{width:4.6cm}.pi-tb td.s{width:.45cm}'+
    '.pi-cks{display:flex;flex-wrap:wrap;gap:3px 18px;margin:0 0 9px 1cm}'+
    '.pi-ck{flex:0 0 45%;display:flex;gap:6px;align-items:flex-start}'+
    '.pi-ck .bx{font-size:1.15em;line-height:1}'+
    '.pi-ol{margin:0 0 8px;padding-left:1.05cm}'+
    '.pi-ol li{margin:0 0 5px;text-align:justify}'+
    '.pi-tgl{text-align:right;margin:14px 0 0}'+
    '.pi-ttd{page-break-inside:avoid;break-inside:avoid}'+
    '.pi-ttd table.ttd{width:100%}'
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
  ['fkl-preview-print','pnw-preview-print','rho-preview-print','hps-preview-print','ana-preview-print',
   'hpsc-preview-print','spk-preview-print','spk-preview-khs','tor-preview-print'].forEach(bid=>{
    const b=document.getElementById(bid); if(b) b.remove();
  });
  if(actions){
    const btn=document.createElement('button');
    btn.id='tor-preview-print'; btn.className='btn btn-teal';
    btn.style.padding='8px 14px'; btn.style.fontSize='11px';
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>Cetak / PDF';
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
      const ws=wb.addWorksheet('BoQ',{pageSetup:{paperSize:9,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:0.4,right:0.4,top:0.5,bottom:0.5,header:0.2,footer:0.2}}});
      ws.columns=[{width:5},{width:44},{width:7},{width:7},{width:15},{width:15},{width:15},{width:15},{width:16}];
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
      /* Warnai seluruh 9 kolom sebuah baris sekaligus (sel kosong pun ikut,
         supaya pita warnanya utuh seperti di cetakan RAB). */
      const warnai=(r,bg)=>{ for(let c=1;c<=9;c++){ const cell=ws.getCell(r,c);
        cell.fill=isi(bg); cell.border=kotak; } };
      let R=1;
      /* --- Kepala --- */
      ws.mergeCells(R,1,R,9);
      tulis(R,1,'(KOP PERUSAHAAN)',{b:true,al:{horizontal:'center'},font:{bold:true,size:12,color:{argb:'FF0070C0'}}}); R+=2;
      ws.mergeCells(R,1,R,9);
      tulis(R,1,'Bill of Quantity (BoQ)',{b:true,al:{horizontal:'center'},font:{bold:true,size:12,underline:true}}); R+=2;
      tulis(R,2,'Pekerjaan',{b:true}); tulis(R,3,':'); ws.mergeCells(R,4,R,9);
      tulis(R,4,data.nama_pekerjaan||'-'); R++;
      tulis(R,2,'Lokasi',{b:true}); tulis(R,3,':'); ws.mergeCells(R,4,R,9);
      tulis(R,4,data.lokasi_pekerjaan||'-'); R+=2;
      /* --- Kepala tabel (tiga baris, sama dengan cetakan HPS) --- */
      const H=R;
      ws.mergeCells(H,1,H+1,1); ws.mergeCells(H,2,H+1,2);
      ws.mergeCells(H,3,H+1,3); ws.mergeCells(H,4,H+1,4);
      ws.mergeCells(H,5,H,6);   ws.mergeCells(H,7,H,8);   ws.mergeCells(H,9,H+1,9);
      const tengah={horizontal:'center',vertical:'middle',wrapText:true};
      const fKop={bold:true,color:{argb:T_KOP}};
      const kop=(r,c,t)=>tulis(r,c,t,{al:tengah,box:true,bg:C_KOP,font:fKop});
      /* Judul kolom "Barang (Rp)" (bukan "Material") agar 100% sama dengan
         cetakan RAB & dokumen HPS. */
      warnai(H,C_KOP); warnai(H+1,C_KOP);
      kop(H,1,'No.');  kop(H,2,'Uraian Pekerjaan'); kop(H,3,'Sat'); kop(H,4,'Vol');
      kop(H,5,'Harga Satuan'); kop(H,7,'Jumlah Harga'); kop(H,9,'Jumlah Total\n(Rp)');
      ['','','','','Barang (Rp)','Jasa (Rp)','Barang (Rp)','Jasa (Rp)',''].forEach((t,i)=>{
        kop(H+1,i+1,t||null); });
      warnai(H+2,C_NUMH);
      ['1','2','3','4','5','6','7 = 4 x 5','8 = 4 x 6','9 = 7 + 8'].forEach((t,i)=>{
        tulis(H+2,i+1,t,{al:tengah,box:true,bg:C_NUMH,font:{bold:true,italic:true,color:{argb:T_NUMH}}}); });
      R=H+3;
      /* --- Baris isi (judul / sub-judul / barang), penomoran = jsWalk --- */
      const barisAngka=[];
      const kosongkan=(r)=>{ for(let c=1;c<=9;c++) tulis(r,c,null,{box:true}); };
      /* Rumusnya dibiarkan POLOS (tanpa pembungkus IF(...)="") supaya hasilnya
         angka 0, bukan teks kosong \u2014 format accounting-lah yang menampilkan
         nol sebagai "-" persis seperti kolom harga di cetakan RAB. */
      const rumusBaris=(r,bg)=>{
        const o={al:{horizontal:'right'},box:true,fmt:RP,bg:bg};
        tulis(r,7,{formula:'ROUND(D'+r+'*E'+r+',0)'},o);
        tulis(r,8,{formula:'ROUND(D'+r+'*F'+r+',0)'},o);
        /* Kolom 9 tebal & bertinta gelap \u2014 sama seperti td.num.tot di RAB. */
        tulis(r,9,{formula:'G'+r+'+H'+r},
          {al:{horizontal:'right'},box:true,fmt:RP,bg:bg,font:{bold:true,color:{argb:T_GRP}}});
      };
      /* Harga satuan Barang & Jasa SELALU 0 (permintaan user): BoQ = RAB tanpa
         harga. Nilainya angka 0, bukan sel kosong, supaya rumus di kolom 7-9
         ikut menghasilkan 0 dan tampil "-" oleh format accounting. */
      const hargaNol=(r,bg)=>{
        tulis(r,5,0,{al:{horizontal:'right'},box:true,fmt:RP,bg:bg});
        tulis(r,6,0,{al:{horizontal:'right'},box:true,fmt:RP,bg:bg});
      };
      jsWalk(items, cfg, {
        judul:(no,txt,it)=>{ kosongkan(R); warnai(R,C_GRP);
          const f={bold:true,color:{argb:T_GRP}};
          tulis(R,1,no,{al:{horizontal:'center'},box:true,bg:C_GRP,font:f});
          tulis(R,2,String(txt||'').toUpperCase(),{box:true,bg:C_GRP,font:f});
          if(it){ tulis(R,3,it.sat||'',{al:{horizontal:'center'},box:true,bg:C_GRP,font:f});
                  tulis(R,4,jsVolNum(it.vol)||null,{al:{horizontal:'center'},box:true,bg:C_GRP,font:f});
                  hargaNol(R,C_GRP); rumusBaris(R,C_GRP); barisAngka.push(R); }
          R++; },
        sub:(no,txt,it)=>{ kosongkan(R); warnai(R,C_SUB);
          const f={bold:true,italic:true,color:{argb:T_GRP}};
          tulis(R,1,no,{al:{horizontal:'center'},box:true,bg:C_SUB,font:f});
          tulis(R,2,'   '+txt,{box:true,bg:C_SUB,font:f});
          if(it){ tulis(R,3,it.sat||'',{al:{horizontal:'center'},box:true,bg:C_SUB,font:f});
                  tulis(R,4,jsVolNum(it.vol)||null,{al:{horizontal:'center'},box:true,bg:C_SUB,font:f});
                  hargaNol(R,C_SUB); rumusBaris(R,C_SUB); barisAngka.push(R); }
          R++; },
        item:(noInGroup,it,idx)=>{ kosongkan(R);
          tulis(R,1,noInGroup,{al:{horizontal:'center'},box:true});
          tulis(R,2,(it.uraian&&String(it.uraian).trim())?it.uraian:('Barang/Jasa '+(idx+1)),{box:true});
          tulis(R,3,it.sat||'',{al:{horizontal:'center'},box:true});
          tulis(R,4,jsVolNum(it.vol)||null,{al:{horizontal:'center'},box:true});
          hargaNol(R); rumusBaris(R); barisAngka.push(R);
          R++; }
      });
      const r1=H+3, r2=R-1;
      /* --- Rekap: cermin hpsSummary() --- */
      const rekap=(label, f7, f8, f9, tebal)=>{
        const bg=tebal?C_TOT:C_SUM, tl=tebal?T_TOT:T_SUML, tn=tebal?T_TOT:T_SUMN;
        warnai(R,bg);
        ws.mergeCells(R,1,R,6);
        tulis(R,1,label,{al:{horizontal:'right'},box:true,bg:bg,font:{bold:true,color:{argb:tl}}});
        [[7,f7],[8,f8],[9,f9]].forEach(([c,f])=>
          tulis(R,c,{formula:f},{al:{horizontal:'right'},box:true,fmt:RP,bg:bg,
            font:{bold:true,color:{argb:tn}}}));
        R++;
      };
      const rJml=R;
      rekap('Jumlah','SUM(G'+r1+':G'+r2+')','SUM(H'+r1+':H'+r2+')','SUM(I'+r1+':I'+r2+')');
      const rDpp=R;
      rekap('DPP','ROUND(G'+rJml+'*11/12,0)','ROUND(H'+rJml+'*11/12,0)','ROUND(I'+rJml+'*11/12,0)');
      const rPpn=R;
      rekap('PPn 12%','ROUND(G'+rDpp+'*0.12,0)','ROUND(H'+rDpp+'*0.12,0)','ROUND(I'+rDpp+'*0.12,0)');
      const rTot=R;
      rekap('Jumlah Total','G'+rJml+'+G'+rPpn,'H'+rJml+'+H'+rPpn,'I'+rJml+'+I'+rPpn, true);
      /* --- Terbilang: rumus yang mengikuti sel Jumlah Total --- */
      warnai(R,C_TERB);
      ws.mergeCells(R,1,R,9);
      tulis(R,1,{formula:torBoqTerbilangRumus('I'+rTot)},
        {al:{horizontal:'left'},box:true,bg:C_TERB,font:{bold:true,color:{argb:T_TERB}}});
      /* --- Tanda tangan penyedia --- */
      R+=3;
      ws.mergeCells(R,6,R,9); tulis(R,6,'Kota/Kabupaten,....., Tanggal.....',{al:{horizontal:'center'}}); R++;
      ws.mergeCells(R,6,R,9); tulis(R,6,'Nama Perusahaan',{b:true,al:{horizontal:'center'}}); R+=4;
      ws.mergeCells(R,6,R,9); tulis(R,6,'(Nama Lengkap)',{b:true,al:{horizontal:'center'},font:{bold:true,underline:true}}); R++;
      ws.mergeCells(R,6,R,9); tulis(R,6,'Jabatan',{b:true,al:{horizontal:'center'}});
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
    ov.addEventListener('mousedown', function(e){ if(e.target===ov) torCloseDokList(); });
    document.body.appendChild(ov);
  }
  ov.innerHTML='<div class="tor-dk-mdl">'+
    '<div class="tor-dk-hd"><div><b>'+esc(rec.nama_pekerjaan||'Dokumen Pengadaan')+'</b>'+
      '<i>'+esc(rec.no_dokumen||'')+'</i></div>'+
      '<button type="button" class="x" onclick="torCloseDokList()" aria-label="Tutup">\u00d7</button></div>'+
    '<div class="tor-dk-bd">'+baris+'</div></div>';
  ov.classList.add('show');
}
function torCloseDokList(){ const ov=document.getElementById('tor-dk-ov'); if(ov) ov.classList.remove('show'); }
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
      '<td class="col-spk-nokon"><b>'+fkEsc(r.no_dokumen||'—')+'</b></td>'+
      '<td class="col-nama-freeze">'+fkEsc(r.nama_pekerjaan||'—')+'</td>'+
      '<td>'+fkEsc(r.bidang_pelaksana||'—')+'</td>'+
      '<td class="col-date">'+fkEsc(r.tanggal?spkDateLong(r.tanggal):'—')+'</td>'+
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
    if(total<=1){ pg.innerHTML=''; }
    else{
      let h='';
      for(let p=1;p<=total;p++) h+='<button class="'+(p===torViewPage?'active':'')+'" onclick="torViewGoto('+p+')">'+p+'</button>';
      pg.innerHTML=h;
    }
  }
}
function torViewGoto(p){ torViewPage=p; renderTorView(); }
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

/* ===================== 16. INIT ===================== */
async function torInit(){
  try{ await refreshDataTor(); }catch(e){}
  try{
    var v=document.querySelector('.view.active');
    if(v && TOR_VIEWS[v.id.replace(/^view-/,'')]) rerenderActiveView();
  }catch(e){}
}
try{ torInit(); }catch(e){ console.error('torInit:', e); }
