/* ===== 01-data-inti.js (bagian 1/15, baris 1-1216 dari app.js asli) =====
   Definisi field, konfigurasi, state, Supabase, profil, auth/login, draft form, ganti sandi, pengaturan, auto-logout.
   WAJIB dimuat berurutan 01 s.d. 15 — jangan ubah urutannya. ===== */
/* ============================================================
   app.js — gabungan kedua blok <script> dari file asli,
   urutan dipertahankan: blok 1 (inti aplikasi) lalu blok 2 (modul SPK).
   Dimuat sebagai classic script (BUKAN type="module") karena HTML
   memakai 368 handler onclick="..." yang butuh fungsi global.
   ============================================================ */

/* ===================== BLOK 1: APLIKASI INTI ===================== */
/* ============ FIELD DEFINITIONS (mengikuti Data.xlsx) ============ */
/* Opsi Tahun (dipakai field "Tahun" + filter tahun) — rentang tetap 2024–2034 */
const TAHUN_OPTS = Array.from({length:11},(_,i)=>String(2024+i));
/* Kontrol "Tahun" yang tampil di kanan atas baris judul kelompok I. Informasi Pekerjaan.
   inputId = id elemen select agar konsisten dengan helper input tiap form. */
function yearControlHTML(inputId){
  const opts='<option value="">— Pilih —</option>'+TAHUN_OPTS.map(y=>`<option>${y}</option>`).join('');
  return `<div class="year-control"><label for="${inputId}">Tahun</label><select id="${inputId}">${opts}</select></div>`;
}
const FIELDS = [
  {key:'tahun',            label:'Tahun',                           input:'f_tahun',            type:'select', options:TAHUN_OPTS},
  {key:'no_prk',           label:'No. PRK',                         input:'f_no_prk',           type:'text', req:true, ph:'cth. 2025.MMU.AO-ADM.01.01'},
  {key:'no_anggaran',      label:'No. Anggaran',                    input:'f_no_anggaran',      type:'text', req:true, ph:'cth. 001/SKKO/GM.MMU/ADM.NIAGA/MSH/2025/R1'},
  {key:'no_pr',            label:'No. PR',                          input:'f_no_pr',            type:'text', ph:'cth. 3002518656'},
  {key:'no_po',            label:'No. PO',                          input:'f_no_po',            type:'text'},
  {key:'tgl_anggaran',     label:'Tgl. Anggaran',                   input:'f_tgl_anggaran',     type:'date', req:true},
  {key:'no_eproc',         label:'No. Eproc',                       input:'f_no_eproc',         type:'text', ph:'cth. EPROC-4230-20250319-4230-00001'},
  {key:'jenis_anggaran',   label:'Jenis Anggaran',                  input:'f_jenis_anggaran',   type:'select', options:['Operasi','Investasi'], req:true},
  {key:'bidang_pelaksana', label:'Bidang Pelaksana',                input:'f_bidang_pelaksana', type:'select', options:['Jaringan dan Konstruksi','Pembangkitan','Transaksi Energi Listrik','Niaga dan Pemasaran','Perencanaan','Keuangan dan Umum','Keselamatan, Kesehatan Kerja, Lingkungan dan Keamanan'], req:true},
  {key:'pelaksana_khs',    label:'Pelaksana KHS',                   input:'f_pelaksana_khs',    type:'text', ph:'cth. Kantor Pusat / UIW MMU / UP3 Masohi'},
  {key:'no_kontrak_khs',   label:'No. Kontrak KHS',                 input:'f_no_kontrak_khs',   type:'text'},
  {key:'tgl_terbit_khs',   label:'Tgl. Terbit Kontrak (KHS)',       input:'f_tgl_terbit_khs',   type:'date'},
  {key:'tgl_berakhir_khs', label:'Tgl. Berakhir Kontrak (KHS)',     input:'f_tgl_berakhir_khs', type:'date'},
  {key:'nama_pekerjaan_khs',label:'Nama Pekerjaan (KHS)',           input:'f_nama_pekerjaan_khs',type:'text'},
  {key:'lokasi_pekerjaan_khs',label:'Lokasi Pekerjaan (KHS)',       input:'f_lokasi_pekerjaan_khs',type:'text'},
  {key:'nilai_kontrak_khs',label:'Nilai Kontrak (KHS) (+ PPN)',     input:'f_nilai_kontrak_khs',type:'num'},
  {key:'no_spbj',          label:'No. SPBJ / Kontrak Rinci',        input:'f_no_spbj',          type:'text', req:true},
  {key:'nama_pekerjaan_kr',label:'Nama Pekerjaan (Kontrak Rinci)',  input:'f_nama_pekerjaan_kr',type:'text', req:true},
  {key:'lokasi_pekerjaan_kr',label:'Lokasi Pekerjaan (Kontrak Rinci)',input:'f_lokasi_pekerjaan_kr',type:'text', req:true},
  {key:'tgl_terbit_kr',    label:'Tgl. Terbit Kontrak Rinci',       input:'f_tgl_terbit_kr_date',type:'date', req:true},
  {key:'tgl_berakhir_kr',  label:'Tgl. Berakhir Kontrak Rinci',     input:'f_tgl_berakhir_kr',  type:'date', req:true},
  {key:'nilai_kontrak_kr', label:'Nilai Kontrak Rinci (+ PPN)',     input:'f_nilai_kontrak_kr', type:'num', req:true},
  {key:'nama_penyedia',    label:'Nama Penyedia',                   input:'f_nama_penyedia',    type:'text', req:true},
  {key:'alamat_penyedia',  label:'Alamat Penyedia',                 input:'f_alamat_penyedia',  type:'text', ph:'Alamat perusahaan penyedia'},
  {key:'status',           label:'Status',                          input:'f_status',           type:'select', options:['On Progress','Selesai'], req:true},
];
const GROUPS = [
  {title:'Informasi Umum', cols:4, keys:['tahun','no_prk','no_anggaran','tgl_anggaran','jenis_anggaran','no_eproc','no_pr','no_po','bidang_pelaksana','status']},
  {title:'Kesepakatan Harga Satuan (KHS)', cols:3, keys:['no_kontrak_khs','nama_pekerjaan_khs','lokasi_pekerjaan_khs','tgl_terbit_khs','tgl_berakhir_khs','nilai_kontrak_khs','pelaksana_khs']},
  {title:'SPBJ / Kontrak Rinci', cols:3, keys:['no_spbj','nama_pekerjaan_kr','lokasi_pekerjaan_kr','tgl_terbit_kr','tgl_berakhir_kr','nilai_kontrak_kr','nama_penyedia','alamat_penyedia']},
];
/* Snapshot tata letak awal KR (untuk "Kembalikan ke Default" pada Penyesuaian) */
const KR_SCHEMA_BASE = { fields: JSON.parse(JSON.stringify(FIELDS)), groups: JSON.parse(JSON.stringify(GROUPS)) };

/* ============ FIELD DEFINITIONS PENGADAAN LANGSUNG (mengikuti Data_Untuk_Coding.xlsx) ============ */
const BIDANG_OPTS = ['Jaringan dan Konstruksi','Pembangkitan','Transaksi Energi Listrik','Niaga dan Pemasaran','Perencanaan','Keuangan dan Umum','Keselamatan, Kesehatan Kerja, Lingkungan dan Keamanan'];
const RISIKO_OPTS = ['Tidak Ada','Rendah','Moderat','Tinggi','Sangat Tinggi','Ekstrem'];
/* table:true => tampil di Tabel Daftar Pekerjaan; seluruh field selalu tampil di "Lihat" */
const FIELDS_PL = [
  // I. Informasi Pekerjaan
  {key:'tahun', label:'Tahun', type:'select', options:TAHUN_OPTS},
  {key:'nama_pekerjaan', label:'Nama Pekerjaan', type:'text', table:true, span:2, req:true},
  {key:'lokasi_pekerjaan', label:'Lokasi Pekerjaan', type:'text', req:true},
  {key:'jangka_waktu', label:'Jangka Waktu Pelaksanaan Pekerjaan', type:'text', req:true, ph:'..........(hari)'},
  {key:'bidang_pelaksana', label:'Bidang Pelaksana', type:'select', options:BIDANG_OPTS, table:true, req:true},
  {key:'level_risiko', label:'Level Risiko Pekerjaan', type:'select', options:RISIKO_OPTS, req:true},
  // II. Nota Dinas Pengadaan
  {key:'no_nota_dinas', label:'No. Nota Dinas', type:'text', req:true},
  {key:'tgl_nota_dinas', label:'Tgl. Nota Dinas', type:'date', req:true},
  // III. Dokumen Pengadaan
  {key:'tgl_terima_dok', label:'Tgl. Diterima Dokumen Pengadaan', type:'date'},
  {key:'ketersediaan_drp', label:'Ketersediaan DRP', type:'select', options:['Ada','Tidak Ada'], ctrl:true},
  {key:'no_drp', label:'No. DRP', type:'text', lock:'drp_tidak_ada'},
  {key:'tgl_drp', label:'Tgl. DRP', type:'date', lock:'drp_tidak_ada'},
  // IV. Rencana Anggaran Biaya
  {key:'rab_harga_barang', label:'RAB — Harga Barang', type:'num'},
  {key:'rab_harga_jasa', label:'RAB — Harga Jasa', type:'num'},
  {key:'rab_total_tanpa_ppn', label:'RAB — Harga Total (Tanpa PPN)', type:'num', auto:'sum'},
  {key:'rab_total_dengan_ppn', label:'RAB — Harga Total (Dengan PPN)', type:'num', auto:'ppn'},
  {key:'no_prk', label:'No. PRK', type:'text', ph:'cth. 2025.MMU.AO-ADM.01.01'},
  {key:'no_anggaran', label:'No. Anggaran', type:'text', ph:'cth. 001/SKKO/GM.MMU/ADM.NIAGA/MSH/2025/R1'},
  {key:'tgl_anggaran', label:'Tgl. Anggaran', type:'date'},
  {key:'jenis_anggaran', label:'Jenis Anggaran', type:'select', options:['Operasi','Investasi']},
  // V. Kriteria Pengadaan
  {key:'jenis_pengadaan', label:'Jenis Pengadaan', type:'select', options:['Barang','Jasa Lainnya','Jasa Konsultansi','Pekerjaan Konstruksi']},
  {key:'jenis_kontrak', label:'Jenis Perjanjian/Kontrak', type:'select', options:['Lumsum','Turn Key']},
  {key:'bidang_sub_bidang', label:'Bidang / Sub Bidang', type:'text', span:2, ph:'cth. Pengadaan Barang - Mekanikal dan Elektrikal'},
  // VI. Dokumen HPS
  {key:'no_hps', label:'No. HPS', type:'text'},
  {key:'tgl_hps', label:'Tgl. HPS', type:'date'},
  {key:'hps_harga_barang', label:'HPS — Harga Barang', type:'num'},
  {key:'hps_harga_jasa', label:'HPS — Harga Jasa', type:'num'},
  {key:'hps_total_tanpa_ppn', label:'HPS — Harga Total (Tanpa PPN)', type:'num', auto:'sum'},
  {key:'hps_total_dengan_ppn', label:'HPS — Harga Total (Dengan PPN)', type:'num', auto:'ppn'},
  // VII. Proses Pengadaan
  {key:'no_eproc', label:'No. Eproc', type:'text', ph:'cth. EPROC-4230-20250319-4230-00001'},
  {key:'tgl_pengumuman', label:'Tgl. Undangan', type:'date'},
  {key:'tgl_upload_dok_penawaran_awal', label:'Upload Dokumen Penawaran (Awal)', type:'date'},
  {key:'tgl_upload_dok_penawaran_akhir', label:'Upload Dokumen Penawaran (Akhir)', type:'date'},
  {key:'no_ba_pembukaan', label:'No. BA Pembukaan Penawaran', type:'text'},
  {key:'tgl_ba_pembukaan', label:'Tgl. BA Pembukaan Penawaran', type:'date'},
  {key:'no_ba_evaluasi', label:'No. BA Evaluasi Penawaran', type:'text'},
  {key:'tgl_ba_evaluasi', label:'Tgl. BA Evaluasi Penawaran', type:'date'},
  {key:'no_ba_klarifikasi', label:'No. BA Klarifikasi & Negosiasi', type:'text'},
  {key:'tgl_ba_klarifikasi', label:'Tgl. BA Klarifikasi & Negosiasi', type:'date'},
  {key:'negosiasi_pelaksanaan', label:'Negosiasi Jangka Waktu Pelaksanaan', type:'text', span:2, ph:'Jangka Waktu yang disepakati (hari)'},
  // VIII. Penawaran Harga
  {key:'no_penawaran', label:'No. Penawaran', type:'text'},
  {key:'tgl_penawaran', label:'Tgl. Penawaran', type:'date'},
  {key:'tawar_harga_barang', label:'Penawaran — Harga Barang', type:'num'},
  {key:'tawar_harga_jasa', label:'Penawaran — Harga Jasa', type:'num'},
  {key:'tawar_total_tanpa_ppn', label:'Penawaran — Harga Total (Tanpa PPN)', type:'num', auto:'sum'},
  {key:'tawar_total_dengan_ppn', label:'Penawaran — Harga Total (Dengan PPN)', type:'num', auto:'ppn'},
  // IX. Perjanjian/Kontrak
  {key:'no_kontrak', label:'No. Kontrak', type:'text', table:true},
  {key:'tgl_awal_kontrak', label:'Tgl. Awal Kontrak', type:'date', table:true},
  {key:'tgl_akhir_kontrak', label:'Tgl. Akhir Kontrak', type:'date', auto:'akhirkontrak'},
  {key:'kontrak_harga_barang', label:'Kontrak — Harga Barang', type:'num'},
  {key:'kontrak_harga_jasa', label:'Kontrak — Harga Jasa', type:'num'},
  {key:'kontrak_total_tanpa_ppn', label:'Kontrak — Harga Total (Tanpa PPN)', type:'num', auto:'sum'},
  {key:'kontrak_total_dengan_ppn', label:'Kontrak — Harga Total (Dengan PPN)', type:'num', auto:'ppn'},
  // X. Pengendali Pekerjaan
  {key:'direksi_pekerjaan', label:'Direksi Pekerjaan', type:'text'},
  {key:'pengawas_pekerjaan', label:'Pengawas Pekerjaan', type:'text'},
  // XI. Data Penyedia
  {key:'perusahaan', label:'Perusahaan', type:'text', table:true, span:2},
  {key:'alamat', label:'Alamat', type:'text'},
  {key:'nama_pic', label:'Nama PIC', type:'text'},
  {key:'no_telp_pic', label:'No. Telp PIC', type:'text'},
  {key:'npwp', label:'NPWP Perusahaan', type:'text'},
  {key:'email', label:'E-mail', type:'text'},
  {key:'pimpinan', label:'Pimpinan', type:'text', ph:'Nama pimpinan perusahaan'},
  {key:'jabatan', label:'Jabatan', type:'text'},
  {key:'bank', label:'Bank', type:'text'},
  {key:'no_rekening', label:'No. Rekening', type:'text'},
  {key:'pemilik_rekening', label:'Pemilik Rekening', type:'text'},
  // XII. Status Pengadaan
  {key:'tahapan', label:'Tahapan/Proses', type:'select', options:['Penyusunan HPS','Proses Pengadaan','Tandatangan Kontrak','Terkontrak','Gagal/Batal'], table:true, ctrl:true},
  {key:'kendala', label:'Kendala', type:'text', lock:'gagal_batal'},
  {key:'tindak_lanjut', label:'Tindak Lanjut', type:'text', span:2, lock:'gagal_batal'},
  // XIII. CSMS
  {key:'csms_jenis_dokumen', label:'Jenis Dokumen (CSMS)', type:'select', options:['Sertifikat','Berita Acara']},
  {key:'csms_level_risiko', label:'Level Risiko (CSMS)', type:'select', options:RISIKO_OPTS},
  {key:'csms_tgl_terbit', label:'Tgl. Terbit (CSMS)', type:'date'},
  {key:'csms_tgl_berakhir', label:'Tgl. Berakhir (CSMS)', type:'date', auto:'csms3thn'},
  // XIV. Data Lain-Lain
  {key:'norm_eproc', label:'Norm. Sistem Eproc', type:'text', ph:'cth. JASA-20160222-135'},
  {key:'nama_material_jasa', label:'Nama Material/Jasa', type:'text', ph:'cth. Komunikasi'},
  {key:'nomor_pr', label:'No. PR', type:'text', ph:'cth. 3002518656'},
  {key:'manajemen_kontrak', label:'Manajemen Kontrak', type:'select', options:['Sudah','Belum'], table:true},
];
const GROUPS_PL = [
  {title:'I. Informasi Pekerjaan', cols:3, keys:['tahun','nama_pekerjaan','lokasi_pekerjaan','jangka_waktu','bidang_pelaksana','level_risiko']},
  {title:'II. Nota Dinas Pengadaan', cols:3, keys:['no_nota_dinas','tgl_nota_dinas']},
  {title:'III. Dokumen Pengadaan', cols:3, keys:['tgl_terima_dok','ketersediaan_drp','no_drp','tgl_drp']},
  {title:'IV. Rencana Anggaran Biaya', cols:3, keys:['rab_harga_barang','rab_harga_jasa','rab_total_tanpa_ppn','rab_total_dengan_ppn','no_prk','no_anggaran','tgl_anggaran','jenis_anggaran']},
  {title:'V. Kriteria Pengadaan', cols:3, keys:['jenis_pengadaan','jenis_kontrak','bidang_sub_bidang']},
  {title:'VI. Dokumen HPS', cols:3, keys:['no_hps','tgl_hps','hps_harga_barang','hps_harga_jasa','hps_total_tanpa_ppn','hps_total_dengan_ppn']},
  {title:'VII. Proses Pengadaan', cols:3, keys:['no_eproc','tgl_pengumuman','tgl_upload_dok_penawaran_awal','tgl_upload_dok_penawaran_akhir','no_ba_pembukaan','tgl_ba_pembukaan','no_ba_evaluasi','tgl_ba_evaluasi','no_ba_klarifikasi','tgl_ba_klarifikasi','negosiasi_pelaksanaan']},
  {title:'VIII. Penawaran Harga', cols:3, keys:['no_penawaran','tgl_penawaran','tawar_harga_barang','tawar_harga_jasa','tawar_total_tanpa_ppn','tawar_total_dengan_ppn']},
  {title:'IX. Perjanjian/Kontrak', cols:3, keys:['no_kontrak','tgl_awal_kontrak','tgl_akhir_kontrak','kontrak_harga_barang','kontrak_harga_jasa','kontrak_total_tanpa_ppn','kontrak_total_dengan_ppn']},
  {title:'X. Pengendali Pekerjaan', cols:3, keys:['direksi_pekerjaan','pengawas_pekerjaan']},
  {title:'XI. Data Penyedia', cols:3, keys:['perusahaan','alamat','nama_pic','no_telp_pic','npwp','email','pimpinan','jabatan','bank','no_rekening','pemilik_rekening']},
  {title:'XII. Status Pengadaan', cols:3, keys:['tahapan','kendala','tindak_lanjut']},
  {title:'XIII. CSMS', cols:3, keys:['csms_jenis_dokumen','csms_level_risiko','csms_tgl_terbit','csms_tgl_berakhir']},
  {title:'XIV. Data Lain-Lain', cols:3, keys:['norm_eproc','nama_material_jasa','nomor_pr','manajemen_kontrak']},
];
const PL_TABLE_KEYS = FIELDS_PL.filter(f=>f.table).map(f=>f.key);
/* Snapshot tata letak awal (untuk fitur "Kembalikan ke Default" pada Penyesuaian) */
const PL_SCHEMA_BASE = { fields: JSON.parse(JSON.stringify(FIELDS_PL)), groups: JSON.parse(JSON.stringify(GROUPS_PL)) };

/* ============================================================
   KONFIGURASI SUPABASE  ← ISI DUA NILAI DI BAWAH INI
   Ambil dari Supabase: Settings → API
   ============================================================ */
const SUPABASE_URL = 'https://jpqfzbubrnznyqaniskm.supabase.co';   // contoh: https://abcd1234.supabase.co
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcWZ6YnVicm56bnlxYW5pc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MDUzNjEsImV4cCI6MjA5ODM4MTM2MX0.VfRB3H7zjhw0cHcQgFTqQYir1wtGaRmGIk709FaFBXs';    // anon public key (panjang, diawali eyJ...)
const TABLE = 'pekerjaan';

// Aktif otomatis bila kedua nilai sudah diisi (bukan placeholder)
const USE_SUPABASE = SUPABASE_URL.startsWith('http') && SUPABASE_KEY.length > 20;
let db = null;
if (USE_SUPABASE && window.supabase) {
  let cleanUrl = SUPABASE_URL.trim();
  try { cleanUrl = new URL(cleanUrl).origin; } catch(e){ cleanUrl = cleanUrl.replace(/\/+$/,''); }
  db = window.supabase.createClient(cleanUrl, SUPABASE_KEY.trim(), {
    auth: {
      // Login aplikasi memakai RPC verify_login (bukan Supabase Auth), jadi
      // client TIDAK boleh menyimpan/menyinkronkan sesi auth apa pun.
      // Ini memastikan tiap device benar-benar independen: login/logout di
      // satu perangkat tidak pernah mengeluarkan perangkat lain.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      multiTab: false
    }
  });
}

/* ============================================================================
   AKUN DUMMY / MODE UJI COBA (SANDBOX)  — ditambahkan untuk pengetesan aman.
   ---------------------------------------------------------------------------
   Tujuan: menyediakan satu akun "dummy" dengan AKSES PENUH (seperti admin)
   namun DIJAMIN TIDAK BISA MENGUBAH DATA yang sudah ada milik admin/user/tamu.

   Cara kerja:
   - Login akun dummy TIDAK menyentuh server sama sekali (tidak memanggil
     verify_login). Kredensial dicek murni di sisi klien (lihat doLogin).
   - Saat peran aktif = 'demo', variabel global `db` ditukar ke `demoDb`,
     sebuah TIRUAN client Supabase yang seluruhnya bekerja di MEMORI (RAM).
     demoDb tidak pernah membuka koneksi jaringan untuk operasi apa pun,
     sehingga MUSTAHIL menulis/menghapus/mengubah baris di database nyata.
   - Sandbox dimulai KOSONG setiap sesi. Semua tambah/ubah/hapus hanya
     tersimpan di memori sesi ini; hilang saat logout / refresh / tab ditutup.
   - Karena sandbox kosong, seluruh penomoran otomatis (mis. Penetapan Nomor)
     ikut dimulai dari 1 (diperkuat override pnBase/pnBaseFor untuk mode demo).
   ============================================================================ */
const realDb = db;                       // client Supabase asli (untuk admin/user/tamu)
let   demoDb = null;                      // tiruan in-memory untuk akun dummy
const DEMO_USER = 'dummy';               // username akun dummy
const DEMO_PASS = 'dummy2026';           // kata sandi akun dummy
function isDemo(){ return currentRole==='demo'; }

/* Bangun tiruan client Supabase yang bekerja penuh di memori.
   Mendukung pola rantai yang dipakai aplikasi:
     .from(t).select(cols).eq().not().order().limit()
     .from(t).insert(v).select()
     .from(t).update(v).eq()
     .from(t).delete().eq() / .delete().not('id','is',null)
     .from(t).upsert(v,{onConflict})
   Setiap objek yang dikembalikan bersifat "thenable" (bisa di-await) dan
   selalu resolve ke bentuk { data, error } seperti Supabase. */
function makeDemoDb(){
  const store = Object.create(null);                 // nama_tabel -> array baris (di memori)
  const tbl = (t)=> (store[t] || (store[t] = []));
  const genId = ()=> 'demo-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
  const nowISO = ()=> new Date().toISOString();

  function from(table){
    const q = { mode:'read', payload:null, opts:null, filters:[], nots:[], ins:[], order:null, limitN:null };
    const rows = tbl(table);

    const passEq  = (r)=> q.filters.every(([c,v])=> String(r[c]) === String(v));
    const passNot = (r)=> q.nots.every(([c,op,v])=> (op==='is' && v===null) ? (r[c]!=null) : true);
    const passIn  = (r)=> q.ins.every(([c,arr])=> (arr||[]).map(String).includes(String(r[c])));
    const matches = (r)=> passEq(r) && passNot(r) && passIn(r);

    function run(){
      try{
        if(q.mode==='insert'){
          const arr = Array.isArray(q.payload) ? q.payload : [q.payload];
          const created = arr.map(x=>{
            const row = Object.assign({}, x);
            if(row.id==null) row.id = genId();
            if(row.created_at==null) row.created_at = nowISO();
            if(row.updated_at==null) row.updated_at = nowISO();
            return row;
          });
          created.forEach(r=> rows.push(r));
          return { data: created.map(r=>Object.assign({}, r)), error:null };
        }
        if(q.mode==='update'){
          for(let i=0;i<rows.length;i++){ if(matches(rows[i])) rows[i] = Object.assign({}, rows[i], q.payload); }
          return { data:null, error:null };
        }
        if(q.mode==='upsert'){
          const arr = Array.isArray(q.payload) ? q.payload : [q.payload];
          const oc = (q.opts && q.opts.onConflict)
            ? String(q.opts.onConflict).split(',').map(s=>s.trim())
            : ['id'];
          arr.forEach(x=>{
            const idx = rows.findIndex(r=> oc.every(k=> String(r[k]) === String(x[k])));
            if(idx>=0) rows[idx] = Object.assign({}, rows[idx], x);
            else { const row = Object.assign({}, x); if(row.id==null) row.id = genId(); rows.push(row); }
          });
          return { data: arr.map(r=>Object.assign({}, r)), error:null };
        }
        if(q.mode==='delete'){
          for(let i=rows.length-1;i>=0;i--){ if(matches(rows[i])) rows.splice(i,1); }
          return { data:null, error:null };
        }
        // mode === 'read'
        let out = rows.filter(matches);
        if(q.order){
          const [c,o] = q.order; const asc = !(o && o.ascending===false);
          out = out.slice().sort((a,b)=>{
            let x=a[c], y=b[c]; if(x==null)x=''; if(y==null)y='';
            if(x<y) return asc?-1:1; if(x>y) return asc?1:-1; return 0;
          });
        }
        if(q.limitN!=null) out = out.slice(0, q.limitN);
        return { data: out.map(r=>Object.assign({}, r)), error:null };
      }catch(err){ return { data:null, error:err }; }
    }

    const api = {
      select(){ /* kolom diabaikan: kembalikan baris utuh, aman diakses per-nama */ return api; },
      insert(v){ q.mode='insert'; q.payload=v; return api; },
      update(v){ q.mode='update'; q.payload=v; return api; },
      upsert(v,opts){ q.mode='upsert'; q.payload=v; q.opts=opts; return api; },
      delete(){ q.mode='delete'; return api; },
      eq(c,v){ q.filters.push([c,v]); return api; },
      in(c,arr){ q.ins.push([c,arr]); return api; },
      not(c,op,v){ q.nots.push([c,op,v]); return api; },
      order(c,o){ q.order=[c,o]; return api; },
      limit(n){ q.limitN=n; return api; },
      then(res,rej){ return Promise.resolve(run()).then(res,rej); },
      catch(fn){ return Promise.resolve(run()).catch(fn); },
      finally(fn){ return Promise.resolve(run()).finally(fn); }
    };
    return api;
  }

  // ---- Tiruan Supabase Storage (unggah berkas & foto) di memori ----
  // Berkas yang diunggah akun dummy hanya disimpan di memori sesi & di-serve
  // via blob URL; TIDAK pernah diunggah ke bucket penyimpanan asli.
  const PLACEHOLDER_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const storageMem = Object.create(null);            // bucket -> { path -> {blob,url} }
  function bucket(name){
    const b = storageMem[name] || (storageMem[name] = Object.create(null));
    return {
      async upload(path, file){
        let url=null;
        try{ if(typeof URL!=='undefined' && URL.createObjectURL) url=URL.createObjectURL(file); }catch(e){}
        b[path] = { blob:file, url };
        return { data:{ path }, error:null };
      },
      async remove(paths){
        (paths||[]).forEach(p=>{ const o=b[p]; if(o&&o.url){ try{ URL.revokeObjectURL(o.url); }catch(e){} } delete b[p]; });
        return { data:{}, error:null };
      },
      async download(path){
        const o=b[path];
        return o ? { data:o.blob, error:null } : { data:null, error:{ message:'Berkas tidak ada di sandbox demo' } };
      },
      getPublicUrl(path){
        const o=b[path];
        return { data:{ publicUrl: (o && o.url) || PLACEHOLDER_IMG } };
      },
      async list(prefix){
        const pre = prefix ? String(prefix) : '';
        const names = Object.keys(b)
          .filter(p=> p.indexOf(pre)===0)
          .map(p=> ({ name: p.slice(pre.length).replace(/^\/+/,'') }));
        return { data:names, error:null };
      }
    };
  }
  const storage = { from: bucket };

  // RPC apa pun (verify_login/change_password) dinetralkan — tidak menyentuh server.
  const rpc = async ()=> ({ data:null, error:null });
  return { from, rpc, storage, __isDemo:true };
}

/* Tukar `db` sesuai peran: demo -> sandbox memori; lainnya -> Supabase asli.
   Sandbox selalu dibuat baru (kosong) setiap kali masuk sebagai demo. */
function setDbForRole(role){
  if(role==='demo'){ demoDb = makeDemoDb(); db = demoDb; }
  else { db = realDb; }
}

/* ============ STATE ============ */
let records = [];
let editingId = null;
let krReturnView = 'dashboard';
let seq = 1;
const STORE = 'monitoring_spbj_up3masohi';

/* Field tanggal & angka — untuk konversi '' → null sebelum kirim ke database */
const DATE_KEYS = FIELDS.filter(f=>f.type==='date').map(f=>f.key);
const NUM_KEYS  = FIELDS.filter(f=>f.type==='num').map(f=>f.key);

/* Bersihkan record agar cocok dengan tipe kolom Postgres */
/* ---- Koersi nilai agar aman untuk kolom bertipe di Postgres ----
   - Angka: kosong / NaN -> null (bukan "NaN") supaya kolom numeric tidak error.
   - Tanggal: hanya menerima format YYYY-MM-DD; selain itu -> null supaya
     kolom date tidak menolak (penyebab umum error 400 saat simpan/ubah). */
function toDbNum(v){
  if(v===''||v===undefined||v===null) return null;
  const n = typeof v==='number' ? v : Number(String(v).replace(/[^0-9.-]/g,''));
  return Number.isFinite(n) ? n : null;
}
function toDbDate(v){
  if(v===''||v===undefined||v===null) return null;
  const s=String(v).trim();
  if(!s) return null;
  // input type=date selalu YYYY-MM-DD; terima juga bila ada bagian waktu
  const m=s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}
/* Bersihkan satu field sesuai tipenya (dipakai ketiga tabel) */
function cleanFieldValue(f, rec){
  let v = rec[f.key];
  if(v===''||v===undefined) return null;
  if(f.type==='num')  return toDbNum(v);
  if(f.type==='date') return toDbDate(v);
  return v;
}
function cleanForDb(rec){
  const o={};
  FIELDS.forEach(f=>{ o[f.key]=cleanFieldValue(f, rec); });
  return o;
}

/* ============ STORE: Supabase ============ */
const Store = {
  async list(){
    const {data,error}=await db.from(TABLE).select('*').order('created_at',{ascending:false});
    if(error) throw error;
    return (data||[]).map(r=>{
      FIELDS.forEach(f=>{ if(f.type==='num'&&r[f.key]!=null) r[f.key]=Number(r[f.key]); if(r[f.key]==null)r[f.key]=''; });
      return r;
    });
  },
  async create(rec){
    const {data,error}=await db.from(TABLE).insert(cleanForDb(rec)).select();
    if(error) throw error; return data[0];
  },
  async bulkCreate(arr){
    const {data,error}=await db.from(TABLE).insert(arr.map(cleanForDb)).select();
    if(error) throw error; return data;
  },
  async update(rid,rec){
    const {error}=await db.from(TABLE).update(cleanForDb(rec)).eq('id',rid);
    if(error) throw error;
  },
  async remove(rid){
    const {error}=await db.from(TABLE).delete().eq('id',rid);
    if(error) throw error;
  },
  async removeAll(){
    const {error}=await db.from(TABLE).delete().not('id','is',null);
    if(error) throw error;
  }
};
/* Data pekerjaan sepenuhnya disimpan di Supabase; localStorage tidak dipakai lagi. */
function lsPersist(arr){ /* no-op: penyimpanan lokal dinonaktifkan */ }

/* ============ STORE: PROFIL (Supabase, tersinkron antar-perangkat) ============
   Profil Jadwal, Persyaratan, & Klausul SPK dulu hanya tersimpan di localStorage
   sehingga hilang saat logout / pindah perangkat. Sekarang disimpan di tabel
   Supabase "app_profiles" (lihat SQL terlampir) dengan cache di memori agar
   pemanggilan lama yang sinkron (mis. jpProfilAll()) tetap bekerja.
   Kolom tabel: kind (text), name (text), payload (jsonb), updated_at (timestamptz).
   PRIMARY KEY (kind, name). */
const PROFILE_TABLE = 'app_profiles';
/* Cache per-jenis profil. Diisi saat login (profilesLoadAll) & write-through saat simpan. */
const profileCache = { jadwal: [], syarat: [], klausul: [], penyedia: [] };
let profilesReady = false;
/* Muat semua profil dari Supabase ke cache. Dipanggil sekali setelah login.
   Bila gagal (tabel belum dibuat / offline), cache tetap kosong & aplikasi
   berjalan normal — profil hanya tidak tersinkron sampai koneksi/ tabel siap. */
async function profilesLoadAll(){
  profilesReady = false;
  if(!(USE_SUPABASE && db)){ profilesReady=true; return; }
  try{
    const {data,error}=await db.from(PROFILE_TABLE).select('kind,name,payload').order('updated_at',{ascending:false});
    if(error) throw error;
    profileCache.jadwal=[]; profileCache.syarat=[]; profileCache.klausul=[]; profileCache.penyedia=[];
    (data||[]).forEach(row=>{
      const k=row.kind; if(!profileCache[k]) return;
      let obj=row.payload;
      if(typeof obj==='string'){ try{ obj=JSON.parse(obj); }catch(e){ obj=null; } }
      if(obj && typeof obj==='object'){ if(obj.name==null) obj.name=row.name; profileCache[k].push(obj); }
    });
  }catch(err){
    console.error('Gagal memuat profil dari Supabase:', err);
  }finally{ profilesReady=true; }
  // Migrasi satu kali: profil lama yang masih tersimpan di localStorage diunggah
  // ke Supabase agar tidak hilang & mulai tersinkron antar-perangkat.
  try{ await profilesMigrateFromLocal(); }catch(e){ console.error('Migrasi profil lokal gagal:', e); }
}
async function profilesMigrateFromLocal(){
  if(!(USE_SUPABASE && db)) return;
  const MIG_FLAG='app_profiles_migrated_v1';
  try{ if(localStorage.getItem(MIG_FLAG)) return; }catch(e){ return; }
  const map=[['jadwal','jp_jadwal_profiles_v1'],['syarat','pnw_syarat_profiles_v1'],['klausul','spk_klausul_profiles_v1']];
  let migrated=0;
  for(const [kind,key] of map){
    let arr=[]; try{ const r=localStorage.getItem(key); arr=r?JSON.parse(r):[]; }catch(e){ arr=[]; }
    if(!Array.isArray(arr)) continue;
    for(const obj of arr){
      if(!obj || !obj.name) continue;
      // Jangan timpa profil server yang sudah ada dengan nama sama
      const exists=(profileCache[kind]||[]).some(p=>String(p.name).toLowerCase()===String(obj.name).toLowerCase());
      if(exists) continue;
      if(await profilesUpsert(kind, obj)) migrated++;
    }
  }
  try{ localStorage.setItem(MIG_FLAG,'1'); }catch(e){}
  if(migrated>0) toast(migrated+' profil lama dipindahkan ke server & kini tersinkron','ok');
}
/* Baca profil dari cache (sinkron). */
function profilesGet(kind){ return (profileCache[kind]||[]).slice(); }
/* Simpan/replace SATU profil (upsert) ke Supabase + cache. */
async function profilesUpsert(kind, obj){
  const name=String(obj&&obj.name||'').trim(); if(!name) return false;
  const arr=profileCache[kind]||(profileCache[kind]=[]);
  const idx=arr.findIndex(p=>String(p.name).toLowerCase()===name.toLowerCase());
  if(idx>=0) arr[idx]=obj; else arr.push(obj);
  if(USE_SUPABASE && db){
    try{
      const {error}=await db.from(PROFILE_TABLE)
        .upsert({ kind, name, payload:obj, updated_at:new Date().toISOString() }, { onConflict:'kind,name' });
      if(error) throw error;
    }catch(err){ console.error('Gagal menyimpan profil ke Supabase:', err); toast('Profil gagal tersimpan ke server: '+errMsg(err),'err'); return false; }
  }
  return true;
}
/* Hapus SATU profil dari Supabase + cache. */
async function profilesDelete(kind, name){
  const arr=profileCache[kind]||[];
  const i=arr.findIndex(p=>String(p.name)===String(name));
  if(i>=0) arr.splice(i,1);
  if(USE_SUPABASE && db){
    try{
      const {error}=await db.from(PROFILE_TABLE).delete().eq('kind',kind).eq('name',String(name));
      if(error) throw error;
    }catch(err){ console.error('Gagal menghapus profil di Supabase:', err); toast('Profil gagal dihapus di server: '+errMsg(err),'err'); return false; }
  }
  return true;
}

/* Ambil pesan error Supabase yang paling informatif */
function errMsg(err){
  if(!err) return 'kesalahan tidak diketahui';
  const parts=[err.message, err.details, err.hint].filter(Boolean);
  const msg = parts.length ? parts.join(' — ') : (err.code || String(err));
  return msg;
}

function seedSamples(){
  seq = 4;
  return [
    {id:id(),no_prk:'PRK-2024-014',no_eproc:'EP-100245',jenis_anggaran:'Investasi',bidang_pelaksana:'Jaringan dan Konstruksi',tahun_terbit_kr:'2024',no_kontrak_khs:'KHS-014/UP3MSH/2024',tgl_terbit_khs:'2024-02-10',tgl_berakhir_khs:'2024-12-31',nama_pekerjaan_khs:'Pemeliharaan Jaringan Distribusi 20kV',lokasi_pekerjaan_khs:'Masohi',nilai_kontrak_khs:1450000000,no_spbj:'SPBJ-014/2024',nama_pekerjaan_kr:'Penggantian Konduktor Penyulang Amahai',lokasi_pekerjaan_kr:'Amahai, Maluku Tengah',tgl_terbit_kr:'2024-03-01',tgl_berakhir_kr:'2024-08-30',nilai_kontrak_kr:780000000,nama_penyedia:'PT Listrik Mandiri Maluku',status:'Selesai'},
    {id:id(),no_prk:'PRK-2025-007',no_eproc:'EP-100312',jenis_anggaran:'Operasi',bidang_pelaksana:'Transaksi Energi Listrik',tahun_terbit_kr:'2025',no_kontrak_khs:'KHS-007/UP3MSH/2025',tgl_terbit_khs:'2025-01-15',tgl_berakhir_khs:'2025-12-31',nama_pekerjaan_khs:'Pemeliharaan Meter Transaksi',lokasi_pekerjaan_khs:'Masohi',nilai_kontrak_khs:620000000,no_spbj:'SPBJ-007/2025',nama_pekerjaan_kr:'Penggantian AMR Pelanggan Tegangan Menengah',lokasi_pekerjaan_kr:'Masohi Kota',tgl_terbit_kr:'2025-02-20',tgl_berakhir_kr:'2025-07-20',nilai_kontrak_kr:310000000,nama_penyedia:'CV Energi Nusantara',status:'On Progress'},
    {id:id(),no_prk:'PRK-2025-021',no_eproc:'EP-100388',jenis_anggaran:'Investasi',bidang_pelaksana:'Perencanaan',tahun_terbit_kr:'2025',no_kontrak_khs:'KHS-021/UP3MSH/2025',tgl_terbit_khs:'2025-03-05',tgl_berakhir_khs:'2025-12-31',nama_pekerjaan_khs:'Survey dan Perencanaan Jaringan Baru',lokasi_pekerjaan_khs:'Maluku Tengah',nilai_kontrak_khs:425000000,no_spbj:'SPBJ-021/2025',nama_pekerjaan_kr:'Perencanaan Perluasan JTM Wilayah Tehoru',lokasi_pekerjaan_kr:'Tehoru',tgl_terbit_kr:'2025-04-10',tgl_berakhir_kr:'2025-09-10',nilai_kontrak_kr:198000000,nama_penyedia:'PT Karya Survey Indonesia',status:'On Progress'},
  ];
}
function id(){ return 'w'+(seq++)+'_'+Date.now().toString(36); }

async function refreshData(){
  try{ records = await Store.list(); }
  catch(err){ console.error(err); toast('Gagal memuat data: '+errMsg(err),'warn'); records=records||[]; }
  fillYearFilters();
  renderDashboard(); renderTable();
  hideLoader();
}

/* Isi opsi filter Penyedia dari data (unik), pertahankan pilihan saat ini */
function fillPenyediaFilter(){
  const sel=document.getElementById('filter-penyedia');
  if(!sel) return;
  const cur=sel.value;
  const names=[...new Set(records.map(r=>r.nama_penyedia).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));
  sel.innerHTML='<option value="">Semua Penyedia</option>'+names.map(n=>`<option>${n}</option>`).join('');
  if(names.includes(cur)) sel.value=cur;
}

/* Ambil TAHUN dari Tgl. Terbit Kontrak Rinci (format YYYY-MM-DD) */
/* Tahun sebuah record untuk filter: pakai field "Tahun" bila terisi (4 digit),
   selain itu turunkan dari tanggal (kompatibilitas data lama). */
function yearOf(r, fallbackDate){
  const t=String((r&&r.tahun)||'').trim();
  if(/^\d{4}$/.test(t)) return t;
  const p=String(fallbackDate||'').split('-');
  return (p[0]&&p[0].length===4)?p[0]:'';
}
function contractYear(r){
  return yearOf(r, r.tgl_terbit_kr);
}
/* Komparator daftar pekerjaan:
   1) Urut berdasarkan Tahun (terbaru → lama). Tanpa tahun ditaruh paling bawah.
   2) Dalam tahun yang sama: pekerjaan yang MEMILIKI no. kontrak lebih dulu,
      pekerjaan TANPA no. kontrak berada di urutan paling akhir tahun tersebut.
      (Tahun bersifat independen — kontrak di tahun lain tidak menggeser urutan
       pekerjaan tanpa kontrak di tahun berikutnya.)
   3) Tie-break dalam kelompok yang sama: berdasarkan tanggal (terbaru → lama).
   Parameter:
     getYear(r)     -> string tahun record
     hasKontrak(r)  -> boolean apakah punya no. kontrak
     getDate(r)     -> string tanggal ISO untuk tie-break
*/
function makeWorkComparator(getYear, hasKontrak, getDate){
  return (a,b)=>{
    const ya=getYear(a)||'', yb=getYear(b)||'';
    if(ya!==yb){
      if(!ya) return 1;      // tanpa tahun -> paling bawah
      if(!yb) return -1;
      return ya>yb ? -1 : 1; // tahun terbaru lebih dulu
    }
    // tahun sama: yang punya no. kontrak lebih dulu
    const ka=hasKontrak(a)?1:0, kb=hasKontrak(b)?1:0;
    if(ka!==kb) return kb-ka; // punya kontrak (1) sebelum tanpa kontrak (0)
    // tie-break: tanggal terbaru lebih dulu
    const da=getDate(a)||'', db=getDate(b)||'';
    if(!da && !db) return 0;
    if(!da) return 1;
    if(!db) return -1;
    return da>db ? -1 : da<db ? 1 : 0;
  };
}
/* Isi opsi filter Tahun (Dashboard + Monitoring) dengan rentang tetap 2024–2034, pertahankan pilihan */
function fillYearFilters(){
  const years=Array.from({length:11},(_,i)=>String(2024+i)); // 2024..2034
  ['filter-tahun','dash-filter-tahun','filter-pl-tahun','filter-tender-tahun','fk-input-tahun','fk-view-tahun'].forEach(id=>{
    const sel=document.getElementById(id); if(!sel) return;
    const cur=sel.value;
    sel.innerHTML='<option value="">Semua Tahun</option>'+years.map(y=>`<option>${y}</option>`).join('');
    sel.value = years.includes(cur) ? cur : '';
  });
}

/* ============ AUTH / LOGIN ============ */
/* Username & kata sandi disimpan sepenuhnya di Supabase (tabel "app_users",
   lihat supabase_auth.sql). Verifikasi lewat function verify_login(); tidak ada
   kredensial yang disimpan di file ini. */
let currentRole = null;
let currentUsername = null;
const ROLE_KEY = 'mon_role';
const USER_KEY = 'mon_user';
const VIEW_KEY = 'mon_view';   // halaman terakhir (untuk dipulihkan saat refresh)
const DRAFT_KEY = 'mon_draft'; // draft form input/edit (dipulihkan saat refresh)
const LOGIN_TIME_KEY = 'mon_login_time';   // timestamp login — dasar batas umur sesi absolut
const LAST_ACTIVE_KEY = 'mon_last_active'; // timestamp aktivitas terakhir — dasar auto-logout idle
/* Penyimpanan sesi HANYA di sessionStorage.
   sessionStorage otomatis terhapus saat tab/browser ditutup, sehingga
   pengguna otomatis logout ketika browser ditutup. Sesi tetap dipulihkan
   saat halaman di-refresh (F5) selama tab tidak ditutup.
   localStorage lama (jika ada) langsung dibersihkan agar tidak memulihkan sesi. */
try{ localStorage.removeItem('mon_role'); localStorage.removeItem('mon_user'); localStorage.removeItem('mon_view'); localStorage.removeItem('fkl_state_v2'); localStorage.removeItem('fkl_records_v1'); localStorage.removeItem('pnw_state_v1'); localStorage.removeItem('pnw_records_v1'); }catch(e){}
function ssSet(k,v){ try{ sessionStorage.setItem(k,v); }catch(e){} }
function ssGet(k){ try{ return sessionStorage.getItem(k); }catch(e){ return null; } }
function ssDel(k){ try{ sessionStorage.removeItem(k); }catch(e){} }
/* ===== Draft form (agar data tidak hilang saat refresh di halaman input/ubah) =====
   Menyimpan isi form yang sedang diketik/diubah ke sessionStorage, lalu
   memulihkannya kembali setelah halaman di-refresh (termasuk mode Ubah Data). */
function saveDraft(kind){
  try{
    let rec, editingRef, returnRef, title;
    if(kind==='input'){        rec=readForm();       editingRef=editingId;       returnRef=krReturnView;     title=document.getElementById('input-title').textContent; }
    else if(kind==='input-pl'){rec=readFormPl();     editingRef=editingIdPl;     returnRef=plReturnView;     title=document.getElementById('input-pl-title').textContent; }
    else if(kind==='input-tender'){rec=readFormTender(); editingRef=editingIdTender; returnRef=tenderReturnView; title=document.getElementById('input-tender-title').textContent; }
    else return;
    ssSet(DRAFT_KEY, JSON.stringify({ kind, editingId:editingRef||null, returnView:returnRef||'dashboard', title, rec }));
  }catch(e){}
}
function clearDraft(){ ssDel(DRAFT_KEY); }
function getDraft(){ try{ const s=ssGet(DRAFT_KEY); return s?JSON.parse(s):null; }catch(e){ return null; } }
/* Pasang listener input/change pada sebuah view agar setiap perubahan tersimpan */
function attachDraftAutosave(viewId, kind){
  const root=document.getElementById('view-'+viewId); if(!root) return;
  const handler=()=>saveDraft(kind);
  root.addEventListener('input', handler, true);
  root.addEventListener('change', handler, true);
}
/* Pulihkan form (input baru / ubah) dari draft setelah refresh */
function restoreDraft(d){
  if(!d) return false;
  try{
    if(d.kind==='input'){
      editingId=d.editingId||null; krReturnView=d.returnView||'dashboard'; buildFormKr();
      fillForm(d.rec);
      const editing=!!editingId;
      document.getElementById('input-title').textContent = d.title || (editing?'Ubah Data Pekerjaan':'Input Kontrak Rinci');
      document.getElementById('edit-banner').style.display = editing?'flex':'none';
      if(editing) document.getElementById('edit-banner-text').textContent='Mode Ubah Data';
      document.getElementById('io-tpl-kr').style.display = editing?'none':'';
      showView('input', null, true);
    }else if(d.kind==='input-pl'){
      editingIdPl=d.editingId||null; plReturnView=d.returnView||'dashboard';
      fillFormPl(d.rec);
      const editing=!!editingIdPl;
      document.getElementById('input-pl-title').textContent = d.title || (editing?'Ubah Data Pekerjaan':'Input Pekerjaan');
      document.getElementById('edit-banner-pl').style.display = editing?'flex':'none';
      if(editing) document.getElementById('edit-banner-pl-text').textContent='Mode Ubah Data';
      document.getElementById('io-tpl-pl').style.display = editing?'none':'';
      showView('input-pl', null, true);
    }else if(d.kind==='input-tender'){
      editingIdTender=d.editingId||null; tenderReturnView=d.returnView||'dashboard';
      fillFormTender(d.rec);
      const editing=!!editingIdTender;
      document.getElementById('input-tender-title').textContent = d.title || (editing?'Ubah Data Pekerjaan':'Input Pekerjaan Tender');
      document.getElementById('edit-banner-tender').style.display = editing?'flex':'none';
      if(editing) document.getElementById('edit-banner-tender-text').textContent='Mode Ubah Data';
      document.getElementById('io-tpl-tender').style.display = editing?'none':'';
      showView('input-tender', null, true);
    }else return false;
    return true;
  }catch(e){ return false; }
}
/* Format angka "Accounting" tanpa simbol Rp & tanpa desimal (dipakai di template & export Excel) */
const ACCT_NODEC = '_(* #,##0_);_(* (#,##0);_(* "-"_);_(@_)';
/* Format akuntansi untuk kolom Volume: pemisah ribuan + 2 desimal tetap (sehingga
   pemisah desimal tidak pernah menggantung seperti pada '#,##0.###'), nilai nol
   tampil sebagai "-". Padding "_(" dan "_)" khas Accounting sengaja TIDAK dipakai:
   spasi semu itu membuat isi sel tidak pernah benar-benar berada di tengah. */
const ACCT_VOL = '#,##0.00;-#,##0.00;"-";@';
/* Akun dummy (demo) memperoleh AKSES PENUH setara admin di seluruh UI,
   namun setiap tulis-data hanya mengenai sandbox memori (lihat makeDemoDb). */
function isAdmin(){ return currentRole==='admin' || currentRole==='demo'; }
function canInput(){ return currentRole==='admin' || currentRole==='user' || currentRole==='demo'; }
function requireAdmin(){ if(!isAdmin()){ toast('Hanya admin yang dapat melakukan tindakan ini','warn'); return false; } return true; }
function requireInput(){ if(!canInput()){ toast('Anda tidak memiliki akses untuk menambah data','warn'); return false; } return true; }

/* Hak ubah File Kontrak per-modul (unggah / hapus file):
   - admin & demo : kontrol penuh di semua modul (kr / pl / tender)
   - user         : kontrol penuh HANYA di SPBJ / Kontrak Rinci (kr);
                    di Pengadaan Langsung & Tender hanya boleh melihat
   - lainnya (tamu): tidak boleh mengubah */
function fkCanModify(modul){
  if(currentRole==='admin' || currentRole==='demo') return true;
  if(currentRole==='user') return modul==='kr';
  return false;
}
function fkRequireModify(modul){
  if(!fkCanModify(modul)){ toast('Anda hanya dapat melihat file kontrak pada bagian ini','warn'); return false; }
  return true;
}

/* #12: Login satu halaman — username + kata sandi. Dua akun: Admin & User.
   Peran ditentukan otomatis dari kombinasi username + kata sandi yang cocok. */
function resetLoginForm(){
  ['login-user','login-pass'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  const e=document.getElementById('login-error'); if(e) e.textContent='';
}
function togglePass(inputId,iconId){
  const i=document.getElementById(inputId); const ic=document.getElementById(iconId);
  if(i.type==='password'){ i.type='text'; ic.innerHTML='<path d="M9.9 4.2A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-2.2 3.2M6.3 6.3A18 18 0 0 0 2 11s3.5 7 10 7a9 9 0 0 0 4.5-1.2"/><path d="m2 2 20 20"/>'; }
  else{ i.type='password'; ic.innerHTML='<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'; }
}
function showLoginError(msg){ const e=document.getElementById('login-error'); if(e) e.textContent=msg; }
async function doLogin(){
  const u=(document.getElementById('login-user').value||'').trim();
  const p=document.getElementById('login-pass').value||'';
  if(!u || !p){ showLoginError('Username dan kata sandi wajib diisi.'); return; }
  const uname=u.toLowerCase();
  showLoginError('');
  // === AKUN DUMMY (MODE UJI COBA) ===
  // Dicek murni di sisi klien; TIDAK menghubungi server sama sekali. Masuk sebagai
  // peran 'demo' dengan akses penuh, tetapi seluruh datanya berjalan di sandbox
  // memori sehingga tidak dapat mempengaruhi data admin/user/tamu yang sudah ada.
  if(uname===DEMO_USER && p===DEMO_PASS){
    currentUsername = DEMO_USER;
    ssSet(ROLE_KEY, 'demo'); ssSet(USER_KEY, DEMO_USER);
    ssSet(LOGIN_TIME_KEY, String(Date.now())); ssSet(LAST_ACTIVE_KEY, String(Date.now()));
    playLoginAnim('demo', ()=>enterApp('demo'));
    return;
  }
  if(!(USE_SUPABASE && db)){ showLoginError('Koneksi Supabase belum siap. Coba lagi sesaat.'); return; }
  // Verifikasi ke Supabase: function verify_login mengembalikan 'admin'/'user' atau NULL.
  // Kata sandi TIDAK pernah diunduh ke browser & tidak ada kredensial di file HTML.
  let role=null;
  try{
    const {data,error}=await db.rpc('verify_login',{ p_username:uname, p_password:p });
    if(error) throw error;
    role = data || null;
  }catch(err){
    console.error(err);
    showLoginError('Gagal terhubung ke server. Periksa koneksi lalu coba lagi.');
    return;
  }
  if(!role){ showLoginError('Username atau kata sandi salah.'); return; }
  currentUsername = uname;
  ssSet(ROLE_KEY, role); ssSet(USER_KEY, uname);
  ssSet(LOGIN_TIME_KEY, String(Date.now())); ssSet(LAST_ACTIVE_KEY, String(Date.now()));
  playLoginAnim(role, ()=>enterApp(role));
}
/* Masuk sebagai Tamu (tanpa kata sandi) */
function doLoginGuest(){
  showLoginError('');
  currentUsername = null;
  ssSet(ROLE_KEY, 'guest'); ssDel(USER_KEY);
  ssSet(LOGIN_TIME_KEY, String(Date.now())); ssSet(LAST_ACTIVE_KEY, String(Date.now()));
  playLoginAnim('guest', ()=>enterApp('guest'));
}
/* ====== GANTI KATA SANDI (via Supabase) ====== */
function openChangePass(){
  if(currentRole==='guest' || currentRole==='demo' || !currentUsername){ toast('Fitur ini hanya untuk akun admin/user','warn'); return; }
  ['cp-old','cp-new','cp-new2'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  const err=document.getElementById('cp-error'); if(err) err.textContent='';
  const sub=document.getElementById('cp-sub'); if(sub) sub.textContent='Perbarui kata sandi untuk akun "'+currentUsername+'".';
  document.getElementById('cp-overlay').classList.add('show');
  setTimeout(()=>{ const f=document.getElementById('cp-old'); if(f) f.focus(); }, 60);
}
function closeChangePass(){ document.getElementById('cp-overlay').classList.remove('show'); }
async function submitChangePass(){
  const err=document.getElementById('cp-error');
  const setErr=m=>{ if(err) err.textContent=m; };
  if(!currentUsername){ setErr('Sesi tidak dikenali, silakan login ulang.'); return; }
  const oldP=document.getElementById('cp-old').value||'';
  const newP=document.getElementById('cp-new').value||'';
  const new2=document.getElementById('cp-new2').value||'';
  if(!oldP || !newP || !new2){ setErr('Semua kolom wajib diisi.'); return; }
  if(newP.length<6){ setErr('Kata sandi baru minimal 6 karakter.'); return; }
  if(newP!==new2){ setErr('Konfirmasi kata sandi baru tidak sama.'); return; }
  if(newP===oldP){ setErr('Kata sandi baru harus berbeda dari yang lama.'); return; }
  if(!(USE_SUPABASE && db)){ setErr('Ganti kata sandi memerlukan koneksi Supabase.'); return; }
  const btn=document.getElementById('cp-submit');
  if(btn){ btn.disabled=true; btn.textContent='Menyimpan…'; }
  try{
    const {data,error}=await db.rpc('change_password',{ p_username:currentUsername, p_old:oldP, p_new:newP });
    if(error) throw error;
    if(data===true){
      closeChangePass();
      toast('Kata sandi berhasil diperbarui','ok');
    }else{
      setErr('Kata sandi lama salah.');
    }
  }catch(e){
    console.error(e);
    setErr('Gagal menghubungi server. Coba lagi.');
  }finally{
    if(btn){ btn.disabled=false; btn.textContent='Simpan'; }
  }
}
function playLoginAnim(role, done){
  const anim=document.getElementById('login-anim');
  // Sembunyikan layar login di balik overlay agar transisi mulus
  const loginScreen=document.getElementById('login-screen');
  if(loginScreen) loginScreen.style.display='none';
  // Subteks sesuai peran
  const subs={admin:'Masuk sebagai Admin',user:'Masuk sebagai User',guest:'Masuk sebagai Tamu',demo:'Masuk sebagai Dummy (Uji Coba)'};
  const sub=document.getElementById('login-anim-sub');
  if(sub) sub.textContent=subs[role]||'';
  const finish=()=>{
    done&&done();                              // masuk ke aplikasi (enterApp)
    if(anim){
      anim.classList.add('fade-out');
      setTimeout(()=>{ anim.classList.remove('show','fade-out'); }, 500);
    }
  };
  if(anim){
    anim.classList.remove('fade-out');
    anim.classList.add('show');
    sfxSession('in');           // arpeggio naik, seiring animasi "Selamat Datang"
    setTimeout(finish, 2000);   // mainkan animasi ± 2 detik sebelum masuk aplikasi
  }else{
    finish();
  }
}
/* Muat ulang SELURUH data sesuai koneksi peran yang aktif.
   Penting untuk akun dummy: saat halaman pertama dimuat, aplikasi sudah mengisi
   array data dengan DATA ASLI (memakai koneksi Supabase asli, sebelum login).
   Tanpa muat-ulang ini, dummy akan menampilkan sisa data asli tersebut. Dengan
   memanggil ini setelah `db` ditukar ke sandbox, seluruh array dibaca ulang dari
   sandbox kosong sehingga dummy benar-benar bersih. Untuk admin/user/tamu, ini
   memastikan data asli kembali termuat (mis. setelah keluar dari sesi dummy). */
function reloadAllDataForRole(){
  try{ if(typeof pnLoadConfig==='function') pnLoadConfig(); }catch(e){}
  [ refreshData, refreshDataPl, refreshDataTender, refreshDataPenetapan,
    refreshDataKelengkapan, refreshDataPembukaan, refreshDataRho,
    refreshDataHps, refreshDataAnalisa, refreshDataJadwal
  ].forEach(function(fn){
    try{ var p=fn(); if(p && p.then) p.then(rerenderActiveView).catch(function(){}); }catch(e){}
  });
}
function enterApp(role, view){
  currentRole=role;
  setDbForRole(role);   // demo -> sandbox memori (kosong); lainnya -> Supabase asli
  reloadAllDataForRole();   // baca ulang data agar sesuai koneksi peran (dummy = kosong)
  if(typeof fkResetCache==='function') fkResetCache();
  applyRole(role);
  document.getElementById('login-screen').style.display='none';
  document.getElementById('topbar-user').style.display='flex';
  resetLoginForm();
  window.__grandDashEntrance = true;   // tandai: tampilkan animasi masuk megah utk dashboard
  showView(view||'dashboard', null, true);   // #2: tanpa loader "Memuat" (hanya animasi selamat datang)
  startIdleTimer();   // mulai hitung mundur auto-logout 5 menit idle
  // Muat profil (Jadwal/Persyaratan/Klausul) dari Supabase agar tersinkron antar-perangkat
  try{ profilesLoadAll(); }catch(e){ console.error(e); }
}
function applyRole(role){
  // Peran 'demo' memperoleh set menu yang sama persis dengan admin (akses penuh).
  const navRole = (role==='demo') ? 'admin' : role;
  document.querySelectorAll('.topnav-link[data-role], .topnav-item[data-role], .topnav-sub[data-role], .btn[data-role], .fk-seg-btn[data-role], .mod-seg[data-role]').forEach(l=>{
    const roles=l.getAttribute('data-role').split(' ');
    const ok=roles.includes(navRole);
    if(l.classList.contains('role-keepspace')){
      // Sembunyikan tanpa mengubah tata letak (mis. Hapus Semua) → tombol Reset tetap di posisinya.
      l.style.display=''; l.style.visibility = ok ? '' : 'hidden';
    }else{
      l.style.visibility=''; l.style.display = ok ? '' : 'none';
    }
  });
  // Sembunyikan grup menu (mis. Input Pekerjaan) bila tidak ada item yang tampil untuk peran ini
  document.querySelectorAll('.topnav-group').forEach(g=>{
    const items=g.querySelectorAll('.topnav-item');
    if(!items.length) return;
    const anyVisible=[...items].some(it=>it.style.display!=='none');
    g.style.display = anyVisible ? '' : 'none';
  });
  const labels={admin:'Admin',user:'User',guest:'Tamu',demo:'Dummy (Uji Coba)'};
  document.getElementById('user-label').textContent = labels[role]||'—';
  const ROLE_ICONS={
    admin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>',
    guest:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    demo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>'
  };
  const ic=document.getElementById('user-role-ic');
  if(ic){ ic.className='user-role-ic '+(role||''); ic.innerHTML=ROLE_ICONS[role]||''; }
  // Tombol Ganti Kata Sandi hanya untuk admin/user (punya akun) & saat Supabase aktif.
  // Akun dummy (demo) tidak punya akun server → sembunyikan.
  const cpBtn=document.getElementById('btn-change-pass');
  if(cpBtn) cpBtn.style.display = (role!=='guest' && role!=='demo' && USE_SUPABASE) ? '' : 'none';
  // "Bersihkan Daftar Kontrak" HANYA untuk admin (akun dummy/demo diperlakukan
  // sama seperti admin agar bisa diuji di sandbox tanpa menyentuh data nyata).
  const bkBtn=document.getElementById('btn-bersih-kontrak');
  if(bkBtn) bkBtn.style.display = (role==='admin' || role==='demo') ? '' : 'none';
  renderTable();
  renderTablePl();
  renderTableTender();
}
/* ====== MENU PENGATURAN (gear) ====== */
/* Ikon & label tombol "Bunyi Notifikasi" mengikuti kondisi tersimpan. */
function syncSfxBtn(){
  const on=(typeof sfxEnabled==='function')?sfxEnabled():true;
  const ic=document.getElementById('sfx-ic'), lb=document.getElementById('sfx-lbl');
  if(ic) ic.innerHTML = on
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>';
  if(lb) lb.textContent = on ? 'Bunyi Notifikasi: Aktif' : 'Bunyi Notifikasi: Nonaktif';
}
/* Menu sengaja TIDAK ditutup: pengguna langsung mendengar nada uji & melihat
   labelnya berubah, jadi bisa mencoba nyala/mati beberapa kali. */
function onToggleSfx(){
  if(typeof sfxToggle==='function') sfxToggle();
  syncSfxBtn();
}
function toggleSettingsMenu(e){
  if(e) e.stopPropagation();
  const w=document.getElementById('settings-wrap'); if(!w) return;
  const open=w.classList.toggle('open');
  if(typeof sfxGear==='function') sfxGear();   // efek suara mengiringi putaran gear
  if(open) syncSfxBtn();
  const g=document.getElementById('settings-gear'); if(g) g.setAttribute('aria-expanded', open?'true':'false');
  const m=document.getElementById('settings-menu'); if(m) m.setAttribute('aria-hidden', open?'false':'true');
}
function closeSettingsMenu(){
  const w=document.getElementById('settings-wrap'); if(!w||!w.classList.contains('open')) return;
  w.classList.remove('open');
  const g=document.getElementById('settings-gear'); if(g) g.setAttribute('aria-expanded','false');
  const m=document.getElementById('settings-menu'); if(m) m.setAttribute('aria-hidden','true');
}

/* ============ BERSIHKAN DAFTAR KONTRAK (khusus admin) ============
   Menu di Pengaturan untuk menghapus massal daftar kontrak, dipisah per JENIS
   (SPBJ/Kontrak Rinci, Pengadaan Langsung, Tender) dan per TAHUN (2024–2034
   atau "Semua Tahun"). Tahun tiap record dihitung dengan logika yang SAMA
   seperti tampilan monitoring — memakai field "Tahun" bila terisi, jika tidak
   diturunkan dari tanggal kontrak — sehingga data lama tanpa field tahun tetap
   terjaring persis seperti yang tampak di layar.
   Fungsi merujuk Store_PL/Store_TENDER/TABLE_* dsb. secara lazy (dipanggil saat
   diklik), jadi aman meski definisi store berada jauh di bawah dalam berkas. */
function bkCatInfo(cat){
  switch(cat){
    case 'kr':     return {label:'SPBJ / Kontrak Rinci', table:TABLE,        removeAll:()=>Store.removeAll(),        refresh:refreshData,        rows:()=>records,        yearFn:r=>contractYear(r)};
    case 'pl':     return {label:'Pengadaan Langsung',   table:TABLE_PL,     removeAll:()=>Store_PL.removeAll(),     refresh:refreshDataPl,     rows:()=>records_pl,     yearFn:r=>yearOf(r,r.tgl_awal_kontrak)};
    case 'tender': return {label:'Tender',               table:TABLE_TENDER, removeAll:()=>Store_TENDER.removeAll(), refresh:refreshDataTender, rows:()=>records_tender, yearFn:r=>yearOf(r,r.tgl_awal_kontrak)};
  }
  return null;
}
function openBersihKontrak(){
  const catSel=document.getElementById('bersih-cat');
  const ySel=document.getElementById('bersih-year');
  if(ySel){
    const now=String(new Date().getFullYear());
    ySel.innerHTML = TAHUN_OPTS.map(y=>`<option value="${y}">${y}</option>`).join('')
      + '<option value="__all__">Semua Tahun</option>';
    ySel.value = TAHUN_OPTS.includes(now) ? now : TAHUN_OPTS[0];
  }
  if(catSel) catSel.value='kr';
  const ov=document.getElementById('bersih-overlay'); if(ov) ov.classList.add('show');
}
function closeBersihKontrak(){
  const ov=document.getElementById('bersih-overlay'); if(ov) ov.classList.remove('show');
}
/* Baca pilihan, hitung jumlah data terdampak, lalu minta konfirmasi Ya/Tidak. */
function confirmBersihKontrak(){
  const cat=(document.getElementById('bersih-cat')||{}).value;
  const year=(document.getElementById('bersih-year')||{}).value;
  const info=bkCatInfo(cat); if(!info) return;
  const all=(year==='__all__' || year==='');
  const rows=info.rows()||[];
  const count = all ? rows.length : rows.filter(r=>String(info.yearFn(r))===String(year)).length;
  if(count===0){ toast('Tidak ada data untuk dihapus','warn'); return; }
  const scope = all ? `${info.label} (semua tahun)` : `${info.label} tahun ${year}`;
  closeBersihKontrak();
  openConfirm({
    icon:'del', title:'Bersihkan Daftar Kontrak',
    text:`Ingin menghapus semua daftar kontrak ${scope}? ${count} data akan dihapus dan tidak dapat dikembalikan.`,
    onYes:()=>doBersihKontrak(cat, year)
  });
}
async function doBersihKontrak(cat, year){
  const info=bkCatInfo(cat); if(!info) return;
  const all=(year==='__all__' || year==='');
  try{
    await withActionLoader('Menghapus', async()=>{
      if(all){
        await info.removeAll();
      }else{
        const ids=(info.rows()||[])
          .filter(r=>String(info.yearFn(r))===String(year))
          .map(r=>r.id).filter(v=>v!=null);
        // Hapus per-batch (maks 100 id/permintaan) agar aman untuk URL PostgREST.
        for(let i=0;i<ids.length;i+=100){
          const chunk=ids.slice(i,i+100);
          const {error}=await db.from(info.table).delete().in('id', chunk);
          if(error) throw error;
        }
      }
      await info.refresh();
    });
  }catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'warn'); return; }
  if(cat==='kr'){ currentPage=1; renderTable(); }
  toast('Daftar kontrak berhasil dibersihkan','ok');
}
// Tutup menu saat klik di luar atau tekan Escape
document.addEventListener('click',function(ev){
  const w=document.getElementById('settings-wrap');
  if(w && w.classList.contains('open') && !w.contains(ev.target)) closeSettingsMenu();
});

/* Nada klik untuk menu & tombol.
   Dipasang sebagai SATU listener global (fase capture) alih-alih ditempel pada
   tiap onclick: menu memakai handler yang berbeda-beda (showView, openDpView,
   openFklView, ...), dan cara ini otomatis mencakup menu yang ditambah nanti.
   Fase capture dipakai agar nada tetap berbunyi walau handler lain memanggil
   stopPropagation() (mis. toggleTopGroup / toggleSettingsMenu).

   DIKECUALIKAN: tombol masuk & keluar. Keduanya sudah punya nada sesi sendiri
   (arpeggio naik/turun via sfxSession), jadi nada klik akan bertabrakan dengannya.
   Tombol "Keluar" dikecualikan lewat .settings-item.danger, dan pilihan "Ya" pada
   modal konfirmasi keluar lewat penanda data-sfx="none" yang dipasang saat modal
   itu dibuka (lihat openConfirm). */
document.addEventListener('click',function(ev){
  if(typeof sfxClick!=='function') return;
  const el=ev.target && ev.target.closest ? ev.target.closest(
    '.topnav-link,.topnav-item,.topnav-trigger,.settings-item,.settings-gear,.btn,.login-btn') : null;
  if(!el) return;
  if(el.disabled) return;
  if(el.classList.contains('login-btn')) return;              // masuk -> sfxSession('in')
  if(el.matches('.settings-item.danger')) return;             // keluar -> sfxSession('out')
  if(el.classList.contains('settings-gear')) return;          // gear -> sfxGear() sendiri (suara putaran)
  if(el.dataset && el.dataset.sfx==='none') return;           // "Ya" pada konfirmasi keluar
  sfxClick();
}, true);
document.addEventListener('keydown',function(ev){ if(ev.key==='Escape') closeSettingsMenu(); });

/* Efek suara saat KURSOR mengenai gear (hover), mengiringi ikon yang berputar.
   Delegasi di document memakai 'mouseover' + closest agar tetap berfungsi walau
   markup gear berubah; jeda di dalam sfxGear() mencegah bunyi bertubi-tubi.
   Catatan: karena aturan autoplay browser, bunyi hover baru aktif setelah
   pengguna berinteraksi (klik) pertama kali dengan halaman. */
document.addEventListener('mouseover',function(ev){
  const t=ev.target && ev.target.closest ? ev.target.closest('.settings-gear') : null;
  if(!t) return;
  // Hanya saat BENAR-BENAR masuk ke area gear (bukan bergerak antar anak elemennya).
  if(ev.relatedTarget && t.contains(ev.relatedTarget)) return;
  if(typeof sfxGear==='function') sfxGear();
});

/* Memicu ulang animasi zoom-out pada kartu login (dipakai saat login screen
   ditampilkan kembali, mis. setelah logout — CSS animation tidak otomatis
   terulang saat elemen hanya di-show kembali). */
function replayLoginZoom(){
  const card=document.querySelector('#login-screen .login-card');
  if(!card) return;
  card.classList.remove('go');
  card.classList.add('replay');
  // paksa reflow agar animasi benar-benar dijalankan ulang
  void card.offsetWidth;
  card.classList.add('go');
}
function performLogout(){
  stopIdleTimer();   // hentikan pemantauan idle
  const anim=document.getElementById('logout-anim');
  const finish=()=>{
    ssDel(ROLE_KEY); ssDel(USER_KEY); ssDel(VIEW_KEY); ssDel(DRAFT_KEY); ssDel(LOGIN_TIME_KEY); ssDel(LAST_ACTIVE_KEY);
    currentRole=null; currentUsername=null;
    db = realDb; demoDb = null;   // buang sandbox demo & kembalikan koneksi Supabase asli
    try{ resetAllFilters(); }catch(e){}
    document.getElementById('topbar-user').style.display='none';
    document.getElementById('login-screen').style.display='flex';
    replayLoginZoom();
    resetLoginForm();
    if(anim){
      anim.classList.add('fade-out');
      setTimeout(()=>{ anim.classList.remove('show','fade-out'); }, 450);
    }
  };
  if(anim){
    anim.classList.remove('fade-out');
    anim.classList.add('show');
    sfxSession('out');          // arpeggio turun, seiring animasi keluar
    setTimeout(finish, 2000);   // mainkan animasi ± 2 detik sebelum ke layar login
  }else{
    finish();
  }
}
function logout(){
  openConfirm({
    icon:'back', title:'Keluar',
    text:'Apakah anda yakin ingin keluar?',
    sfxNone:true,          // "Ya" langsung disusul nada keluar (sfxSession('out'))
    onYes:performLogout
  });
}

/* ============ AUTO LOGOUT (IDLE + BATAS UMUR SESI) ============
   Dua lapis keamanan seperti situs-situs resmi lain:
   1) IDLE_LIMIT_MS  — bila tidak ada aktivitas sama sekali (mouse/keyboard/
      sentuh/scroll) selama durasi ini, muncul modal peringatan mundur
      (IDLE_WARNING_MS) sebelum otomatis logout.
   2) SESSION_MAX_MS — batas umur sesi absolut sejak login, walau pengguna
      terus aktif maupun tab tidak pernah ditutup. Ini yang memperbaiki kasus
      "refresh setelah 1 hari tapi masih ke-load" — dicek ulang setiap kali
      halaman dimuat/refresh (lihat restoreSession di akhir file), sehingga
      sesi lama otomatis dianggap kedaluwarsa meski sessionStorage sempat
      terbawa oleh fitur "pulihkan tab" milik browser.
   Ubah nilai di bawah ini sesuai kebutuhan. */
const IDLE_LOGOUT_ENABLED = true;
const IDLE_LIMIT_MS   = 4 * 60 * 1000;    // 4 menit tanpa aktivitas → tampilkan peringatan
const IDLE_WARNING_MS = 60 * 1000;        // + 60 detik hitung mundur → logout otomatis tepat di menit ke-5
const SESSION_MAX_MS  = 12 * 60 * 60 * 1000; // sesi maksimal 12 jam sejak login

let _idleTimer = null;
let _idleCountdownIv = null;
let _idleWarningShowing = false;
let _idleListenersBound = false;
let _lastActiveWriteAt = 0;
const _idleActivityEvents = ['mousemove','mousedown','keydown','touchstart','touchmove','scroll','wheel','click'];

function _sessionExpiredByAge(){
  const t=parseInt(ssGet(LOGIN_TIME_KEY)||'0',10);
  return t>0 && (Date.now()-t) > SESSION_MAX_MS;
}
function _forceExpireLogout(msg){
  hideIdleWarning();
  stopIdleTimer();
  try{ closeConfirm(); }catch(e){}
  toast(msg,'warn');
  performLogout();
}
/* Muncul saat benar-benar tidak ada aktivitas selama IDLE_LIMIT_MS */
function _onIdleTimeout(){
  if(!currentRole) return;
  showIdleWarning();
}
/* Dipanggil oleh setiap event aktivitas pengguna — throttle penulisan
   storage & pengecekan umur sesi agar tidak membebani (mousemove sangat sering). */
function _resetIdleTimer(){
  if(!IDLE_LOGOUT_ENABLED || !currentRole || _idleWarningShowing) return;
  const now=Date.now();
  if(now-_lastActiveWriteAt > 2000){
    _lastActiveWriteAt=now;
    ssSet(LAST_ACTIVE_KEY, String(now));
    if(_sessionExpiredByAge()){ _forceExpireLogout('Sesi Anda telah mencapai batas maksimal 12 jam, silakan masuk kembali'); return; }
  }
  if(_idleTimer) clearTimeout(_idleTimer);
  _idleTimer=setTimeout(_onIdleTimeout, IDLE_LIMIT_MS);
}
/* Modal peringatan "Sesi Akan Berakhir" dengan hitung mundur real-time */
function showIdleWarning(){
  _idleWarningShowing=true;
  if(_idleTimer){ clearTimeout(_idleTimer); _idleTimer=null; }
  const ov=document.getElementById('idle-warn-overlay');
  if(!ov){ _forceExpireLogout('Sesi berakhir otomatis karena tidak ada aktivitas'); return; }
  let remain=Math.round(IDLE_WARNING_MS/1000);
  const cEl=document.getElementById('idle-warn-count'); if(cEl) cEl.textContent=remain;
  ov.classList.add('show');
  if(_idleCountdownIv) clearInterval(_idleCountdownIv);
  _idleCountdownIv=setInterval(()=>{
    remain--;
    if(cEl) cEl.textContent=Math.max(0,remain);
    if(remain<=0){
      clearInterval(_idleCountdownIv); _idleCountdownIv=null;
      _forceExpireLogout('Sesi berakhir otomatis karena tidak ada aktivitas');
    }
  },1000);
}
function hideIdleWarning(){
  _idleWarningShowing=false;
  const ov=document.getElementById('idle-warn-overlay'); if(ov) ov.classList.remove('show');
  if(_idleCountdownIv){ clearInterval(_idleCountdownIv); _idleCountdownIv=null; }
}
/* Tombol "Tetap Masuk" pada modal peringatan */
function idleStayLoggedIn(){
  hideIdleWarning();
  if(_sessionExpiredByAge()){ _forceExpireLogout('Sesi Anda telah mencapai batas maksimal 12 jam, silakan masuk kembali'); return; }
  _lastActiveWriteAt=Date.now();
  ssSet(LAST_ACTIVE_KEY, String(_lastActiveWriteAt));
  toast('Sesi diperpanjang','ok');
  if(_idleTimer) clearTimeout(_idleTimer);
  _idleTimer=setTimeout(_onIdleTimeout, IDLE_LIMIT_MS);
}
function startIdleTimer(){
  if(!IDLE_LOGOUT_ENABLED){ stopIdleTimer(); return; }
  if(!_idleListenersBound){
    _idleActivityEvents.forEach(ev=>document.addEventListener(ev, _resetIdleTimer, {passive:true}));
    // Aktivitas di tab lain / kembali fokus juga dihitung sebagai aktivitas
    window.addEventListener('focus', _resetIdleTimer);
    document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) _resetIdleTimer(); });
    _idleListenersBound = true;
  }
  _lastActiveWriteAt=Date.now();
  ssSet(LAST_ACTIVE_KEY, String(_lastActiveWriteAt));
  if(_idleTimer) clearTimeout(_idleTimer);
  _idleTimer=setTimeout(_onIdleTimeout, IDLE_LIMIT_MS);
}
function stopIdleTimer(){
  if(_idleTimer){ clearTimeout(_idleTimer); _idleTimer=null; }
  hideIdleWarning();
}

