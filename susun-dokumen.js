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
     - TIDAK ada langkah "Pilih Klausul" — SELURUH klausul selalu dipakai.
     - Tidak ada Lampiran (BoQ tetap ditulis sebagai klausul biasa).
     - Nomor dokumen digenerate otomatis: 0001.TOR/DAN.01.03/F17060000/2026
       (format Penetapan Nomor, hanya kode depannya diganti "TOR").
   ============================================================================ */

/* ===================== 1. TETAPAN ===================== */
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
function torFormatNo(seq, klas, year){
  return torPad4(seq)+'.'+TOR_KODE+'/'+(klas||'DAN.01.03')+'/'+TOR_UNIT+'/'+(year||torYearNow());
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
    {k:'nama_pengguna', l:'Nama Pengguna Barang/Jasa', t:'text', lockedBy:'perubahan_pengguna', def:''},
    {k:'jabatan_pengguna', l:'Jabatan Pengguna Barang/Jasa', t:'text', lockedBy:'perubahan_pengguna', def:''},
    {k:'nama_direksi', l:'Nama Direksi Pekerjaan', t:'text', def:''},
    {k:'jabatan_direksi', l:'Jabatan Direksi Pekerjaan', t:'text', def:''},
    {k:'ada_pengawas', l:'Pengawas Pekerjaan?', t:'select', opts:['Ada','Tidak Ada'], reRender:true, def:''},
    {k:'nama_pengawas', l:'Nama Pengawas Pekerjaan', t:'text', lockedBy:'ada_pengawas', def:''},
    {k:'jabatan_pengawas', l:'Jabatan Pengawas Pekerjaan', t:'text', lockedBy:'ada_pengawas', def:''},
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
/* Seluruh klausul TOR selalu dipakai — tidak ada langkah "Pilih Klausul". */
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
    const raw=(d[f.k]!=null && d[f.k]!=='') ? d[f.k] : '';
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
  /* Sakelar pengunci (Perubahan Pengguna? / Pengawas Pekerjaan?): form
     digambar ulang supaya field di bawahnya langsung terbuka/terkunci. */
  if(f && f.reRender){ renderTorSusun(); return; }
  torRefreshAuto();
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
  ['tempat_tanggal','"Masohi, 5 Agustus 2026"']
];
function torFieldInput(f){
  const d=torState.data, v=d[f.k];
  /* Seluruh field selebar satu kolom -> 4 field per baris (--cols:4). */
  const span='';
  const dispDate=(x)=>{ const p=String(x||'').split('-'); return (p.length===3)?(p[2]+'/'+p[1]+'/'+p[0]):(x||''); };
  const locked=(disp,tip)=>'<div class="field"'+span+'><label>'+torLbl(f)+'</label>'+
    '<input type="text" id="tor-fld-'+f.k+'" value="'+fkEsc(disp)+'" readonly '+
    'style="background:#f3f5f7;color:#2b2f36;cursor:not-allowed" title="'+fkEsc(tip||'Terisi otomatis — tidak dapat diubah di sini')+'"></div>';

  if(f.auto) return locked(torAutoVal(f.auto, d),
    (f.auto==='no_dokumen') ? 'Nomor depan digenerate otomatis sesuai urutan dokumen (mulai 0001)' : '');
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
    '.tor-soon{padding:46px 20px;text-align:center;color:#7A828E}'+
    '.tor-soon svg{width:46px;height:46px;stroke:#B9C2CE;margin-bottom:12px}'+
    '.tor-soon b{display:block;font-size:15px;color:#2B3038;margin-bottom:6px}'+
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
  n=(n===2)?2:1;
  if(n===2){
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
  const stepper='<div class="spk-stepper">'+stp(1,'Data TOR/KAK')+'<div class="spk-stp-line"></div>'+stp(2,'Klausul TOR/KAK')+'</div>';

  const btnBatal='<button class="btn btn-red" onclick="torBatalClick()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg> Batal</button>';

  if(torStep===1){
    cont.innerHTML=
      stepper+
      TOR_FIELD_GROUPS.map(kartu).join('')+
      '<div class="jp-actions" style="justify-content:flex-end;margin-top:4px">'+
        btnBatal+
        '<button class="btn btn-teal" onclick="torGoStep(2)">Berikutnya: Klausul TOR/KAK <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>'+
      '</div>';
  }else{
    cont.innerHTML=
      stepper+
      '<div id="spk-klausul-content"></div>'+
      '<div class="jp-actions" style="justify-content:space-between;margin-top:4px">'+
        '<button class="btn btn-ghost" onclick="torGoStep(1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M11 6l-6 6 6 6"/></svg> Kembali</button>'+
        '<span style="display:flex;gap:10px">'+
          btnBatal+
          '<button class="btn btn-teal" onclick="torPreviewCurrent()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg> Pratinjau / Cetak</button>'+
          '<button class="btn btn-green" onclick="torSaveDokumen()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg> Simpan</button>'+
        '</span>'+
      '</div>';
    try{ renderSpkKlausul(); torRelabelKlausul(); }catch(e){ console.error(e); }
  }
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
    torSelectAll();
  }catch(e){ console.error('torBridgeKlausul:', e); }
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
      '<b>Seluruh klausul selalu dipakai</b> — tidak ada langkah pilih/centang klausul. '+
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

/* ===================== 11. PRATINJAU & CETAK ===================== */
let torPreviewData=null, torPreviewKlausul=null;
function torPreviewCurrent(){
  if(!torState){ toast('Data belum diisi','warn'); return; }
  torSyncNomor();
  const kl=torKlausulDok();
  if(!kl.length){ toast('Belum ada klausul untuk ditampilkan','warn'); return; }
  torOpenPreview(torState.data, kl);
}
function torPreviewRecord(id){
  const rec=(records_tor||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  torOpenPreview(rec.data||{}, (Array.isArray(rec.klausul)?rec.klausul:[]));
}
function torOpenPreview(data, klausul){
  torPreviewData=data; torPreviewKlausul=klausul;
  const ov=document.getElementById('pn-preview-overlay');
  if(!ov){ torPrint(); return; }
  const mdl=ov.querySelector('.pn-preview-modal'); if(mdl) mdl.classList.remove('is-max');
  if(typeof pnPreviewResetMaxBtn==='function') pnPreviewResetMaxBtn();
  const t=document.getElementById('pn-preview-title');
  if(t) t.textContent='Pratinjau — TOR/KAK: '+((data&&data.no_dokumen)||(data&&data.nama_pekerjaan)||'');
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
  const html=torDocHtml(data, kl);
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
  const doc=ifr.contentWindow.document; doc.open(); doc.write(torDocHtml(data, kl)); doc.close();
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
      '<td class="col-spk-aksi"><div class="fk-act">'+
        '<button class="fk-act-icon act-view" title="Pratinjau / Cetak" onclick="torPreviewRecord(\''+rid+'\')">'+ic('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>')+'</button>'+
        '<button class="fk-act-icon act-edit" title="Ubah" onclick="torEditRecord(\''+rid+'\')">'+ic('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>')+'</button>'+
        '<button class="fk-act-icon act-del" title="Hapus" onclick="torDeleteRecord(\''+rid+'\')">'+ic('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>')+'</button>'+
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

/* ===================== 14. MODUL MENYUSUL (RAB & PAKTA INTEGRITAS) ===================== */
function torSoonHtml(judul, ket){
  return '<div class="panel"><div class="tor-soon">'+
    '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'+
    '<b>'+fkEsc(judul)+'</b><div>'+fkEsc(ket)+'</div></div></div>';
}
function openRabView(){ showView('rab-view'); }
function renderRabView(){
  torEnsureStyle();
  const c=document.getElementById('rab-view-content'); if(!c) return;
  c.innerHTML=torSoonHtml('Dokumen RAB belum tersedia',
    'Modul Rencana Anggaran Biaya sedang disiapkan. Struktur & mesin dokumennya akan mengikuti Dokumen TOR/KAK.');
}
function openPaktaView(){ showView('pakta-view'); }
function renderPaktaView(){
  torEnsureStyle();
  const c=document.getElementById('pakta-view-content'); if(!c) return;
  c.innerHTML=torSoonHtml('Pakta Integritas belum tersedia',
    'Modul Pakta Integritas sedang disiapkan. Struktur & mesin dokumennya akan mengikuti Dokumen TOR/KAK.');
}

/* ===================== 15. INTEGRASI ROUTING =====================
   showView() di app.js tidak mengenal halaman baru ini. Alih-alih menyunting
   app.js, fungsinya DIBUNGKUS di sini: setelah halaman ditukar (2x rAF di
   dalam showView), render halaman TOR dijalankan & menu induk ditandai aktif. */
const TOR_VIEWS = { 'tor-view':'renderTorView', 'tor-susun':'renderTorSusun',
                    'rab-view':'renderRabView', 'pakta-view':'renderPaktaView' };
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
