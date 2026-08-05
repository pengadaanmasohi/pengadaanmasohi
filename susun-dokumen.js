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
const TOR_DOK_TITLE    = 'Dokumen TOR/KAK';

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
const TOR_DEF_DENDA      = '1‰ (satu permil) per hari keterlambatan';
const TOR_DEF_DENDA_MAKS = '5% (lima persen) dari nilai Perjanjian/Kontrak';
const TOR_DEF_BAYAR      = 'transfer (Bilyet Giro) ke rekening bank Penyedia Barang/Jasa';

const TOR_FIELD_GROUPS = [
  { sec:'Informasi Pengadaan', fields:[
    /* Kode Klasifikasi pindah ke sini dari kartu "Identitas Dokumen" yang
       dihapus. Mengubahnya langsung memperbarui No. Dokumen (lihat reNo). */
    {k:'kode_klasifikasi', l:'Kode Klasifikasi', t:'select',
      opts:TOR_KLAS_OPTS.map(o=>({v:o.kode, l:o.label})), reNo:true, def:'DAN.01.03'},
    {k:'nama_pekerjaan', l:'Nama Pekerjaan', t:'text', def:''},
    {k:'lokasi_pekerjaan', l:'Lokasi Pekerjaan', t:'text', def:''},
    {k:'pelaksana', l:'Bidang Pelaksana', t:'select', opts:TOR_BIDANG_OPTS, def:''},
    {k:'jenis_pengadaan', l:'Jenis Pengadaan', t:'select', opts:['Barang','Jasa','Barang dan Jasa'], def:''},
    {k:'metode_pengadaan', l:'Metode Pengadaan', t:'select', opts:TOR_METODE_OPTS, def:''},
    {k:'level_risiko', l:'Level Risiko Pekerjaan', t:'select', opts:TOR_RISIKO_OPTS, def:''},
    /* Terbilangnya TIDAK dijadikan field — dihitung otomatis saat dokumen
       dibangun ({{nilai_pekerjaan_terbilang}}). */
    {k:'nilai_pekerjaan', l:'Perkiraan Nilai Pekerjaan (+ PPN)', t:'rupiah', def:''},
  ]},
  { sec:'Sumber Dana', fields:[
    {k:'jenis_anggaran', l:'Jenis Anggaran', t:'select', opts:TOR_ANGGARAN_OPTS, def:''},
    {k:'tahun_anggaran', l:'Tahun Anggaran', t:'text', def:'', ph:'cth. 2026'},
    {k:'sumber_dana', l:'Sumber Dana', t:'text', def:'', ph:'cth. APLN Tahun 2026 Anggaran Investasi'},
    {k:'no_anggaran', l:'No. Anggaran (SKKO/SKKI)', t:'text', def:''},
    {k:'tgl_anggaran', l:'Tgl. Anggaran', t:'date', def:''},
    {k:'no_prk', l:'Nomor PRK', t:'text', def:'', ph:'cth. 2026.WMMU.4.003'},
  ]},
  /* ---------- Pengendali Pekerjaan ----------
     Dua sakelar mengunci isian di bawahnya, mengikuti pola "Perubahan?" pada
     Susun Kontrak:
       Perubahan Pengguna?  Ya -> Nama & Jabatan Pengguna dapat diisi
                            Tidak -> terkunci (nilai terakhir tetap terbaca)
       Pengawas Pekerjaan?  Ya -> Nama & Jabatan Pengawas dapat diisi
                            Tidak -> terkunci; butir Pengawas otomatis hilang
                                     dari dokumen karena nilainya kosong. */
  { sec:'Pengendali Pekerjaan', fields:[
    {k:'perubahan_pengguna', l:'Perubahan Pengguna?', t:'select', opts:['Ya','Tidak'], reRender:true, def:''},
    {k:'nama_pengguna', l:'Nama Pengguna Barang/Jasa', t:'text', lockedBy:'perubahan_pengguna', def:''},
    {k:'jabatan_pengguna', l:'Jabatan Pengguna Barang/Jasa', t:'text', lockedBy:'perubahan_pengguna', def:''},
    {k:'nama_direksi', l:'Nama Direksi Pekerjaan', t:'text', def:''},
    {k:'jabatan_direksi', l:'Jabatan Direksi Pekerjaan', t:'text', def:''},
    {k:'ada_pengawas', l:'Pengawas Pekerjaan?', t:'select', opts:['Ya','Tidak'], reRender:true, def:''},
    {k:'nama_pengawas', l:'Nama Pengawas Pekerjaan', t:'text', lockedBy:'ada_pengawas', def:''},
    {k:'jabatan_pengawas', l:'Jabatan Pengawas Pekerjaan', t:'text', lockedBy:'ada_pengawas', def:''},
  ]},
  { sec:'Pelaksanaan & Pembayaran', fields:[
    {k:'jangka_waktu', l:'Jangka Waktu Pelaksanaan (hari)', t:'number', def:''},
    {k:'masa_garansi', l:'Masa Garansi (bulan)', t:'number', def:''},
    {k:'tahap_pembayaran', l:'Jumlah Tahap Pembayaran', t:'number', def:''},
    {k:'uang_muka', l:'Uang Muka?', t:'select', opts:['Ya','Tidak'], def:''},
    {k:'syarat_csms', l:'Wajib Sertifikat CSMS?', t:'select', opts:['Ya','Tidak'], def:''},
    {k:'cara_pembayaran', l:'Cara Pembayaran', t:'text', def:TOR_DEF_BAYAR},
    {k:'denda_keterlambatan', l:'Denda Keterlambatan', t:'text', def:TOR_DEF_DENDA},
    {k:'denda_maksimal', l:'Denda Maksimal', t:'text', def:TOR_DEF_DENDA_MAKS},
  ]},
  /* Kota & tanggal penandatanganan TIDAK lagi jadi field: kota tetap "Masohi",
     tanggalnya mengikuti tanggal pembuatan dokumen (lihat torExtendCtx). */
  { sec:'Penyusun Dokumen', fields:[
    {k:'nama_penyusun', l:'Nama Penyusun', t:'text', def:''},
    {k:'jabatan_penyusun', l:'Jabatan Penyusun', t:'text', def:''},
  ]},
];
const TOR_FIELDS_FLAT = TOR_FIELD_GROUPS.reduce((a,g)=>a.concat(g.fields),[]);

function torTahunOpts(){
  const y=new Date().getFullYear(), o=[];
  for(let i=y-2;i<=y+2;i++) o.push(String(i));
  return o;
}

/* ===================== 5. STATE ===================== */
function torBlankState(){
  const d={};
  TOR_FIELDS_FLAT.forEach(f=>{ if(!f.auto) d[f.k]=(f.def!=null?f.def:''); });
  d.__doktype='TOR';
  d.bentuk_kontrak='SPK';          /* dipakai mesin SPK: tata letak & inden SPK */
  d.tahun_dokumen=String(torYearNow());
  d.kode_klasifikasi=d.kode_klasifikasi||'DAN.01.03';
  d.jenis_pengadaan=TOR_KLAS_JENIS[d.kode_klasifikasi]||'';
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
    lib=rec.klausul.map((k,i)=>({id:String(k.id||torUid()), judul:k.judul||'', isi:k.isi||'', urutan:(i+1)*10, aktif:true}));
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
    .map(k=>({id:String(k.id), judul:k.judul||'', isi:k.isi||''}));
}

/* ===================== 6. NILAI OTOMATIS & KONTEKS ===================== */
function torAutoVal(kind, d){
  d=d||{};
  try{
    if(kind==='no_urut')            return d.no_urut ? torPad4(d.no_urut) : '';
    if(kind==='no_dokumen')         return d.no_dokumen || '';
    if(kind==='terbilang_nilai')    return (d.nilai_pekerjaan!=='' && d.nilai_pekerjaan!=null) ? spkTerbilangRupiah(d.nilai_pekerjaan) : '';
    if(kind==='terbilang_jangka')   return d.jangka_waktu ? (spkTerbilang(d.jangka_waktu)+' Hari Kalender') : '';
    if(kind==='terbilang_garansi')  return d.masa_garansi ? (spkTerbilang(d.masa_garansi)+' Bulan') : '';
    if(kind==='terbilang_tahap')    return d.tahap_pembayaran ? (spkTerbilang(d.tahap_pembayaran)+' Tahap') : '';
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
  ctx.masa_garansi_terbilang  = d.masa_garansi ? spkTerbilang(d.masa_garansi) : '';
  ctx.tahap_pembayaran_terbilang = d.tahap_pembayaran ? spkTerbilang(d.tahap_pembayaran) : '';
  ctx.auto_terbilang_nilai   = ctx.nilai_pekerjaan_terbilang;
  ctx.auto_terbilang_jangka  = torAutoVal('terbilang_jangka', d);
  ctx.auto_terbilang_garansi = torAutoVal('terbilang_garansi', d);
  ctx.auto_terbilang_tahap   = torAutoVal('terbilang_tahap', d);
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
  const _adaPengawas = String(d.ada_pengawas||'')==='Ya';
  ctx.nama_pengawas    = _adaPengawas ? (d.nama_pengawas||'') : '';
  ctx.jabatan_pengawas = _adaPengawas ? (d.jabatan_pengawas||'') : '';
  ctx.ada_pengawas     = _adaPengawas ? 'Ya' : 'Tidak';
  ctx.penyusun_nama = String(d.nama_penyusun||'').toUpperCase();
  ctx.penyusun_jabatan = d.jabatan_penyusun||'';
  /* Kota tetap Masohi; tanggal tanda tangan = tanggal pembuatan dokumen. */
  ctx.kota_ttd       = TOR_KOTA_TTD;
  ctx.tgl_ttd        = spkDateLong(d.tgl_dokumen);
  ctx.tempat_tanggal = TOR_KOTA_TTD+', '+spkDateLong(d.tgl_dokumen);
  /* --- Sumber dana --- */
  ctx.sumber_dana_no      = d.no_anggaran||'';
  ctx.sumber_dana_tgl_pjg = spkDateLong(d.tgl_anggaran);
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
    const j=TOR_KLAS_JENIS[v]; if(j) torState.data.jenis_pengadaan=j;
  }
  const f=TOR_FIELDS_FLAT.filter(x=>x.k===k)[0];
  if(f && f.reNo){ torState.data.no_urut=0; torSyncNomor(); renderTorSusun(); return; }
  /* Sakelar pengunci (Perubahan Pengguna? / Pengawas Pekerjaan?): form
     digambar ulang supaya field di bawahnya langsung terbuka/terkunci. */
  if(f && f.reRender){ renderTorSusun(); return; }
  torRefreshAuto();
}
function torSetRupiah(k,el){
  const n=String(el.value||'').replace(/[^0-9]/g,'');
  torState.data[k]= n? Number(n) : '';
  el.value = n? Number(n).toLocaleString('id-ID') : '';
  torRefreshAuto();
}
function torSwitchChange(el){
  if(!el||!torState) return;
  torSet(el.getAttribute('data-k')||'', (el.value==='Ya')?'Ya':'Tidak');
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
  ['masa_garansi_terbilang','Terbilang masa garansi'],
  ['tahap_pembayaran_terbilang','Terbilang tahap pembayaran'],
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
  if(f.lockedBy && String(d[f.lockedBy]||'')!=='Ya')
    return locked(f.t==='date'?dispDate(v):(v||''),
      'Terkunci — pilih "'+(TOR_FIELDS_FLAT.filter(x=>x.k===f.lockedBy)[0]||{l:''}).l+' = Ya" untuk mengisi');
  if(f.t==='select'){
    const isYT=Array.isArray(f.opts)&&f.opts.length===2&&
      f.opts.map(o=>String((o&&o.v)||o).toLowerCase()).sort().join('|')==='tidak|ya';
    if(isYT && typeof jsLabelSwitchHtml==='function'){
      const on=(String(v||'')==='Ya')?'Ya':'Tidak';
      return '<div class="field"'+span+'>'+
        jsLabelSwitchHtml(torLbl(f),'tor-sw-'+f.k,on,'torSwitchChange','data-k="'+f.k+'"')+
        '<div class="sw-row">'+jsSwitchStateHtml(on)+'</div></div>';
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
    '.tor-nohint{margin:0 0 12px;padding:10px 14px;border-radius:10px;background:#EEF4FF;border:1px solid #D6E2F7;'+
      'color:#1B3A6B;font-size:11.5px;line-height:1.6}'+
    '.tor-nohint b{font-weight:800}'+
    '.tor-nobox{display:inline-flex;align-items:center;gap:8px;padding:4px 10px;border-radius:8px;'+
      'background:#fff;border:1px dashed #9FB6DA;font-weight:800;letter-spacing:.02em}'+
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
      (gi===0 ? torNomorHintHtml() : '')+
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
function torNomorHintHtml(){
  const d=torState.data;
  return '<div class="tor-nohint">Nomor dokumen dibuat otomatis mengikuti pola <b>Penetapan Nomor</b>, '+
    'hanya kode depannya diganti <b>TOR</b>. Nomor urut dimulai dari <b>0001</b> dan berjalan sesuai urutan dokumen '+
    '(nomor bekas hapus otomatis dipakai ulang, serta di-<i>reset</i> tiap ganti tahun).<br>'+
    'Nomor dokumen ini: <span class="tor-nobox">'+fkEsc(d.no_dokumen||'—')+'</span></div>';
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
/* Setelah renderSpkKlausul(): sesuaikan istilah "SPK" -> "TOR/KAK" pada kartu */
function torRelabelKlausul(){
  try{
    const cont=document.getElementById('spk-klausul-content'); if(!cont) return;
    const t=cont.querySelector('.form-section-title > span');
    if(t) t.innerHTML=t.innerHTML.replace('Pustaka Klausul SPK','Pustaka Klausul TOR/KAK');
    const h=cont.querySelector('.hps-hint');
    if(h) h.innerHTML='Pustaka klausul ini <b>milik dokumen TOR/KAK yang sedang disusun</b>. '+
      '<b>Seluruh klausul selalu dipakai</b> — tidak ada langkah pilih/centang klausul. '+
      'Dokumen baru selalu dimulai dari 3 klausul kosong; pakai <b>Muat Profil</b> untuk memanggil set klausul yang sudah jadi.';
  }catch(e){}
}

/* ===================== 9. SIMPAN ===================== */
async function torSaveDokumen(){
  if(typeof requireInput==='function' && !requireInput()) return;
  if(!torState){ toast('Data belum diisi','warn'); return; }
  const d=torState.data;
  const nama=String(d.nama_pekerjaan||'').trim();
  if(!nama){ toast('Nama Pekerjaan wajib diisi','warn'); return; }
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
/* CSS tambahan KHUSUS cover TOR — nomor dokumen di bawah judul TOR/KAK. */
function torDocCss(){
  return ''+
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
  /* Kop & kaki halaman isi TOR */
  '.spk-rft .ft-tor{display:flex;justify-content:space-between;align-items:center;width:100%}'+
  '.spk-rft .ft-tor .u{font-size:8.5pt;font-weight:700;letter-spacing:.06em;color:#5B6472}'+
  /* Blok tanda tangan penyusun TOR */
  '.tor-sign{margin-top:22pt;display:flex;justify-content:flex-end}'+
  '.tor-sign .bx{min-width:7.5cm;text-align:center;font-size:11pt;line-height:1.5}'+
  '.tor-sign .bx .sp{height:2.1cm}'+
  '.tor-sign .bx .nm{font-weight:700;text-decoration:underline;text-underline-offset:3px}';
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
  const rows=list.map((k,i)=>{
    const no=((i+1)<10?('0'+(i+1)):String(i+1));
    return '<div class="row"><span class="no">'+esc(no)+'</span>'+
      '<span class="nm">'+spkFmtJudulTitle(k.judul)+'</span>'+
      '<span class="dot"></span><span class="pg">\u2014</span></div>';
  }).join('');
  return ''+
  '<section class="spk-page spk-tocpage">'+
    '<div class="toc-accent"></div>'+
    '<div class="toc-head"><h1>Daftar Isi</h1>'+
      '<div class="toc-meta"><b>'+esc(TOR_DOK_LABEL)+'</b><span>'+esc(data.no_dokumen||'\u2014')+'</span></div>'+
    '</div>'+
    '<div class="toc-rule"></div>'+
    '<div class="spk-toc2'+spkTocDensity(list.length)+'">'+rows+'</div>'+
  '</section>';
}
/* ---- Kop & kaki berulang tiap lembar ---- */
function torRunHeadHtml(data){
  const esc=fkEsc;
  const logo=(typeof SPK_LOGO_SRC!=='undefined' && SPK_LOGO_SRC)?'<img src="'+SPK_LOGO_SRC+'" alt="PLN">':'';
  return '<div class="spk-rhd">'+
    '<div class="l">'+logo+'<div class="o"><span>PT PLN (PERSERO)</span><b>'+esc(TOR_SINGKATAN_UNIT)+'</b></div></div>'+
    '<div class="r"><b>TOR / KAK</b><span>'+esc(data.no_dokumen||'\u2014')+'</span></div>'+
  '</div>';
}
function torRunFootHtml(data){
  const esc=fkEsc;
  /* .ft-pg WAJIB dipertahankan — diisi nomor halaman oleh spkPageScript(). */
  return '<div class="spk-rft">'+
    '<div class="ft-row"><div class="ft-tor">'+
      '<span class="u">'+esc(TOR_SINGKATAN_UNIT.toUpperCase())+'</span>'+
      '<span class="ft-pg">&#8203;</span>'+
      '<span class="u">TOR / KAK</span>'+
    '</div></div>'+
  '</div>';
}
/* ---- Blok tanda tangan penyusun ---- */
function torSignHtml(ctx){
  const esc=fkEsc;
  return '<div class="tor-sign spk-keep"><div class="bx">'+
    '<div>'+esc(ctx.tempat_tanggal||'')+'</div>'+
    '<div>'+esc(ctx.penyusun_jabatan||'')+'</div>'+
    '<div class="sp"></div>'+
    '<div class="nm">'+esc(ctx.penyusun_nama||'')+'</div>'+
  '</div></div>';
}
/* ---- Dokumen lengkap ----
   Pipeline & KISI INDEN dipakai ulang dari Surat Perintah Kerja (bungkus
   .spk-doc.spk-spk), sehingga inden klausul TOR = inden SPK. */
function torDocHtml(data, klausul){
  data=data||{}; klausul=klausul||[];
  const ctx=spkBuildCtx(data);
  /* Titik tolak inden isi = lebar kotak nomor judul dokumen ini (dinamis) */
  try{ SPK_JH_OVR = spkClHeadW(klausul.length); }catch(e){ SPK_JH_OVR=0; }
  const pre=klausul.map((k,i)=> spkKvGroup(spkKlItalicAsing(spkBoldPihak(spkNomorToNo(spkNumberFix(spkTidyKeyValue(
      spkStripFontStyle(spkPruneKlausul(spkMerge(spkRenumberKlausul(spkSortDefinisiIf(k.judul, k.isi||''), i+1), ctx), i+1, data))
    )))))));
  try{ SPK_HANG_OVR = spkKumpulHang(pre.map(function(x){ try{ return spkPkBoxMark(x); }catch(e2){ return x; } })); }
  catch(e){ SPK_HANG_OVR=null; }
  const clauses=klausul.map((k,i)=>{
    const inner=spkPkTidy(pre[i], false);
    return '<div class="spk-clause"><div class="spk-cl-h"><span class="n"></span>'+spkFmtJudul(k.judul)+'</div>'+
      '<div class="spk-cl'+spkLeadIndentCls(inner)+'">'+inner+'</div></div>';
  }).join('');
  SPK_HANG_OVR=null; SPK_JH_OVR=0;

  const isiBody=
    '<div class="spk-bab"><b>'+fkEsc(TOR_DOK_LABEL)+'</b><span>'+fkEsc(data.no_dokumen||'')+'</span></div>'+
    clauses+
    torSignHtml(ctx);
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
    spkDocCss()+spkDocCss2()+spkClHeadCss(klausul.length,false)+torDocCss()+
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

/* ===================== 16. INIT ===================== */
async function torInit(){
  try{ await refreshDataTor(); }catch(e){}
  try{
    var v=document.querySelector('.view.active');
    if(v && TOR_VIEWS[v.id.replace(/^view-/,'')]) rerenderActiveView();
  }catch(e){}
}
try{ torInit(); }catch(e){ console.error('torInit:', e); }
