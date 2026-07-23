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

/* ============ NAVIGATION ============ */
/* Loader transisi elegan (overlay .route-loader dengan orbit + inti PLN berdenyut).
   Ditampilkan saat berpindah halaman/menu dan saat next/previous pada data monitoring. */
let _loaderShownAt=0;
function showLoader(msg){
  const l=document.getElementById('route-loader'); if(!l) return;
  if(msg){ const t=l.querySelector('.rl-text'); if(t) t.textContent=msg; }
  _loaderShownAt=Date.now();
  l.classList.add('show');
}
function hideLoader(){
  const l=document.getElementById('route-loader'); if(!l) return;
  l.classList.remove('show');
}
/* Loader untuk aksi async (hapus/simpan) — tampilkan loader dengan durasi minimum agar animasi terlihat halus */
async function withActionLoader(msg, action, minMs=650){
  showLoader(msg);
  const t0=Date.now();
  try{
    return await action();
  } finally {
    const wait=Math.max(0, minMs-(Date.now()-t0));
    setTimeout(hideLoader, wait);
  }
}
/* Loader singkat untuk aksi sinkron (mis. pindah halaman, buka detail, next/prev).
   Menampilkan animasi "Memuat" lalu menjalankan action, dengan durasi minimum agar animasi sempat terlihat. */
function withQuickLoader(msg, action, ms=520){
  showLoader(msg);
  const t0=Date.now();
  // Jalankan action di frame berikutnya agar overlay sempat ter-render (transisi masuk mulus)
  requestAnimationFrame(()=>{ requestAnimationFrame(()=>{
    let ok=true;
    try{ action(); }
    catch(e){ ok=false; console.error(e); }
    const wait=Math.max(0, ms-(Date.now()-t0));
    setTimeout(hideLoader, wait);
  }); });
}

/* Picu ulang animasi reveal pada isi tabel (dipanggil setelah tbody diisi) */
function revealTbody(tb){
  if(!tb) return;
  tb.classList.remove('tbody-reveal');
  void tb.offsetWidth; // reflow agar animasi dapat dimainkan ulang
  tb.classList.add('tbody-reveal');
}

let routeTimer=null;
/* #5: Kembalikan semua filter monitoring (Bidang, Status, Tahun, Cari) ke default
   setiap kali pindah halaman. Hanya membersihkan nilai; render dilakukan oleh showView. */
function resetAllFilters(){
  // Filter select & kotak cari yang default-nya kosong
  ['filter-bidang','filter-status','filter-tahun','filter-search',
   'filter-pl-bidang','filter-pl-tahapan','filter-pl-tahun','filter-pl-search',
   'filter-tender-bidang','filter-tender-tahapan','filter-tender-tahun','filter-tender-search',
   'fk-input-bidang','fk-input-search','fk-view-bidang','fk-view-search',
   'pn-lihat-search','fkl-view-search',
   'dash-filter-anggaran','dash-filter-tahun','dash-filter-periode','dash-filter-metode'
  ].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  // Filter dashboard "Jenis Pekerjaan" kembali ke default (SPBJ / Kontrak Rinci)
  const dj=document.getElementById('dash-filter-jenis'); if(dj) dj.value='kr';
  const dmw=document.getElementById('dash-metode-wrap'); if(dmw) dmw.style.display='none';
  // Reset nomor halaman setiap tabel ke 1
  if(typeof currentPage!=='undefined') currentPage=1;
  if(typeof currentPagePl!=='undefined') currentPagePl=1;
  if(typeof currentPageTender!=='undefined') currentPageTender=1;
  if(typeof fkState!=='undefined'){ fkState.input.page=1; fkState.view.page=1; }
  if(typeof pnState!=='undefined' && pnState.lihat) pnState.lihat.page=1;
  if(typeof fklViewPage!=='undefined') fklViewPage=1;
  // Sembunyikan kembali kotak Drag & Drop unggah template setiap pindah halaman
  ['kr','pl','tender'].forEach(c=>{ const d=document.getElementById('io-dz-'+c); if(d) d.classList.remove('show','drag'); });
}

function showView(name, loaderMsg, noLoader){
  if(PYN_REG.pl.active && name!=='input-pl') exitPenyesuaianPl(); if(PYN_REG.kr.active && name!=='input') exitPenyesuaianKr(); if(PYN_REG.tender.active && name!=='input-tender') exitPenyesuaianTender();
  closeMobileNav();
  // Animasi "Memuat" halus pada setiap perpindahan halaman/menu
  // (#2: dilewati saat masuk dari login — cukup animasi "Selamat Datang").
  if(!noLoader) showLoader(loaderMsg||'Memuat');
  const t0=Date.now();
  const doSwap=()=>{
    try{
        document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
        document.getElementById('view-'+name).classList.add('active');
        ssSet(VIEW_KEY, name);   // ingat halaman aktif utk refresh (sessionStorage)
        // Draft form hanya relevan di halaman input/ubah; bersihkan bila pindah ke halaman lain
        if(name!=='input' && name!=='input-pl' && name!=='input-tender') clearDraft();
        // active state untuk Dashboard (nav-link) maupun item di dalam grup (nav-item)
        // Monitoring (link tunggal, data-view="list") menggabungkan Daftar Pekerjaan
        // & Input Pekerjaan, jadi tetap aktif untuk kedua kelompok view.
        const monitorViews=['list','list-pl','list-tender','input','input-pl','input-tender'];
        const inputViews=['input','input-pl','input-tender'];
        document.querySelectorAll('.topnav-link, .topnav-item').forEach(l=>{
          let on = l.dataset.view===name;
          if(l.dataset.view==='list' && monitorViews.includes(name)) on=true; // Monitoring induk tetap aktif
          if(l.dataset.view==='input' && inputViews.includes(name)) on=true;  // (kompatibilitas) Input Pekerjaan induk tetap aktif
          if(l.dataset.view==='fk-view' && (name==='fk-view'||name==='fk-input')) on=true; // File Kontrak induk tetap aktif
          if(l.dataset.view==='dp-view' && (name==='dp-view'||name==='form-dp')) on=true; // Data Pekerjaan induk tetap aktif
          if(l.dataset.view==='fkl-view' && (name==='fkl-view'||name==='form-kelengkapan')) on=true; // Kelengkapan induk tetap aktif
          if(l.dataset.view==='pnw-view' && (name==='pnw-view'||name==='form-pembukaan')) on=true; // Pembukaan Penawaran induk tetap aktif
          if(l.dataset.view==='rho-view' && (name==='rho-view'||name==='form-rho')) on=true; // Referensi Harga Online induk tetap aktif
          if(l.dataset.view==='analisa-view' && (name==='analisa-view'||name==='form-analisa')) on=true; // Analisa Harga Satuan induk tetap aktif
          if(l.dataset.view==='hps-view' && (name==='hps-view'||name==='form-hps')) on=true; // Perhitungan HPS induk tetap aktif
          if(l.dataset.view==='pn-lihat' && (name==='pn-lihat'||name==='pn-ambil')) on=true; // Penetapan (menu tunggal) tetap aktif saat Ambil Nomor
          if(l.dataset.view==='jadwal-view' && (name==='jadwal-view'||name==='jadwal-kerja'||name==='hari-libur')) on=true; // Jadwal (menu tunggal) tetap aktif saat Tentukan Jadwal / Hari Libur
          if(l.dataset.view==='track-view' && (name==='track-view'||name==='track-kelola')) on=true; // Tracking Pengadaan induk tetap aktif saat Kelola Tracking
          if(l.dataset.view==='spk-view' && (name==='spk-view'||name==='spk-susun'||name==='spk-klausul')) on=true; // Susun Kontrak (menu induk) tetap aktif saat Penyusunan Kontrak / Ubah Klausul
          l.classList.toggle('active', on);
        });
        // tandai & buka grup yang memuat view aktif (akordeon tetap terbuka)
        const monitorAll=['list','list-pl','list-tender','input','input-pl','input-tender'];
        document.querySelectorAll('.topnav-group').forEach(grp=>{
          let has=[...grp.querySelectorAll('.topnav-item')].some(it=>it.dataset.view===name);
          if(name==='form-dp') has = has || [...grp.querySelectorAll('.topnav-item')].some(it=>it.dataset.view==='dp-view');
          if(name==='form-kelengkapan') has = has || [...grp.querySelectorAll('.topnav-item')].some(it=>it.dataset.view==='fkl-view');
          if(name==='form-pembukaan') has = has || [...grp.querySelectorAll('.topnav-item')].some(it=>it.dataset.view==='pnw-view');
          if(name==='form-rho') has = has || [...grp.querySelectorAll('.topnav-item')].some(it=>it.dataset.view==='rho-view');
          if(name==='form-analisa') has = has || [...grp.querySelectorAll('.topnav-item')].some(it=>it.dataset.view==='analisa-view');
          if(name==='form-hps') has = has || [...grp.querySelectorAll('.topnav-item')].some(it=>it.dataset.view==='hps-view');
          if(name==='jadwal-kerja'||name==='hari-libur') has = has || [...grp.querySelectorAll('.topnav-item')].some(it=>it.dataset.view==='jadwal-view'); // Jadwal (menu tunggal): grup induk tetap terbuka saat Tentukan Jadwal / Hari Libur
          if(name==='track-kelola') has = has || [...grp.querySelectorAll('.topnav-item')].some(it=>it.dataset.view==='track-view'); // Tracking: grup Monitoring tetap terbuka saat Kelola Tracking
          // Grup Monitoring mencakup Input Pekerjaan (input/-pl/-tender) & Daftar Pekerjaan (list/-pl/-tender)
          if(grp.dataset.group==='monitor' && monitorAll.includes(name)) has=true;
          grp.classList.toggle('has-active', has);
          grp.classList.remove('open');
        });
        if(typeof closeFkSubs==='function') closeFkSubs();
        window.scrollTo({top:0,left:0,behavior:'smooth'});
        resetAllFilters();   // #5: filter di-reset ke default setiap pindah halaman
        if(name==='dashboard') renderDashboard();
        if(name==='list') renderTable();
        if(name==='list-pl') renderTablePl();
        if(name==='list-tender') renderTableTender();
        if(name==='fk-input') renderFkInput();
        if(name==='fk-view') renderFkView();
        if(name==='pn-ambil') renderPnAmbil();
        if(name==='pn-lihat') renderPnLihat();
        if(name==='form-kelengkapan') renderFormKelengkapan();
        if(name==='fkl-view') renderFklView();
        if(name==='form-pembukaan') renderPnwForm();
        if(name==='pnw-view') renderPnwView();
        if(name==='form-rho') renderRhoForm();
        if(name==='rho-view') renderRhoView();
        if(name==='form-dp') renderDpForm();
        if(name==='dp-view') renderDpView();
        if(name==='form-hps') renderHpsForm();
        if(name==='hps-view') renderHpsView();
        if(name==='form-analisa') renderAnalisaForm();
        if(name==='analisa-view') renderAnalisaView();
        if(name==='jadwal-kerja') renderJadwalKerja();
        if(name==='jadwal-view') renderJadwalView();
        if(name==='spk-susun' && typeof renderSpkSusun==='function') renderSpkSusun();
        if(name==='spk-view' && typeof renderSpkView==='function') renderSpkView();
        if(name==='spk-klausul' && typeof renderSpkKlausul==='function') renderSpkKlausul();
        if(name==='hari-libur') renderHariLibur();
        if(name==='rekap-hps') renderRekapHps();
        if(name==='track-view') renderTrackView();
        if(name==='track-kelola') renderTrackKelola();
        if(typeof fkSegSyncAll==='function') fkSegSyncAll(false);   // reposisi pil segmented setelah halaman baru terlihat
    }catch(err){ console.error('showView error:', err); }
    if(!noLoader){ const wait=Math.max(0, 460-(Date.now()-t0)); setTimeout(hideLoader, wait); }
  };
  requestAnimationFrame(()=>{ requestAnimationFrame(doSwap); });
}

/* Render ulang HALAMAN yang sedang aktif — dipakai setelah data selesai dimuat
   secara async saat refresh, agar tabel tidak tampil kosong (data baru muncul
   tanpa perlu pindah menu dulu). */
function rerenderActiveView(){
  try{
    var v=document.querySelector('.view.active'); if(!v) return;
    var name=v.id.replace(/^view-/,'');
    var R={
      'dashboard':'renderDashboard','list':'renderTable','list-pl':'renderTablePl','list-tender':'renderTableTender',
      'fk-input':'renderFkInput','fk-view':'renderFkView','pn-ambil':'renderPnAmbil','pn-lihat':'renderPnLihat',
      'form-kelengkapan':'renderFormKelengkapan','fkl-view':'renderFklView','form-pembukaan':'renderPnwForm',
      'pnw-view':'renderPnwView','form-rho':'renderRhoForm','rho-view':'renderRhoView','form-dp':'renderDpForm',
      'dp-view':'renderDpView','form-hps':'renderHpsForm','hps-view':'renderHpsView','form-analisa':'renderAnalisaForm',
      'analisa-view':'renderAnalisaView','jadwal-kerja':'renderJadwalKerja','jadwal-view':'renderJadwalView',
      'spk-susun':'renderSpkSusun','spk-view':'renderSpkView','spk-klausul':'renderSpkKlausul',
      'hari-libur':'renderHariLibur','rekap-hps':'renderRekapHps',
      'track-view':'renderTrackView','track-kelola':'renderTrackKelola'
    };
    var fn=R[name];
    if(fn && typeof window[fn]==='function') window[fn]();
  }catch(e){ console.error('rerenderActiveView:', e); }
}

/* ============ NAV (top bar dropdown) ============ */
function toggleTopGroup(ev,g){
  if(ev) ev.stopPropagation();
  document.querySelectorAll('.topnav-group').forEach(el=>{
    if(el.dataset.group===g) el.classList.toggle('open');
    else el.classList.remove('open');
  });
  closeFkSubs();   // setiap kali membuka/menutup grup, submenu bertingkat direset
}
/* Buka/tutup submenu bertingkat (mis. Input Data / Lihat Data, atau grup di dalam
   Harga Perkiraan Sendiri) — hanya menutup submenu SEBAYA (sama induk), agar
   submenu induk yang sedang terbuka tidak ikut tertutup saat anaknya diklik. */
function toggleFkSub(ev, sub){
  if(ev) ev.stopPropagation();
  const target=document.querySelector('.topnav-sub[data-sub="'+sub+'"]'); if(!target) return;
  const parent=target.parentElement;
  Array.from(parent.children).forEach(el=>{
    if(!el.classList || !el.classList.contains('topnav-sub')) return;
    if(el===target){ el.classList.toggle('open'); navAdjustFlyout(el); }
    else{ el.classList.remove('open'); el.querySelectorAll('.topnav-sub.open').forEach(s=>s.classList.remove('open')); }
  });
}
function closeFkSubs(){ document.querySelectorAll('.topnav-sub.open').forEach(el=>el.classList.remove('open')); }
document.addEventListener('click',e=>{
  if(!e.target.closest('.topnav-group')){ document.querySelectorAll('.topnav-group.open').forEach(el=>el.classList.remove('open')); closeFkSubs(); }
});
/* Bila flyout akan meluber keluar layar di sisi kanan, buka ke sisi kiri sebagai gantinya. */
function navAdjustFlyout(subEl){
  const dropdown=subEl.querySelector(':scope > .topnav-subdrop'); if(!dropdown) return;
  if(!subEl.classList.contains('open')){ dropdown.classList.remove('flip-left'); return; }
  dropdown.classList.remove('flip-left');
  const rect=dropdown.getBoundingClientRect();
  if(rect.right > window.innerWidth - 8) dropdown.classList.add('flip-left');
}
/* ============ HOVER UNTUK MEMBUKA MENU (di sebelah kanan, bertingkat) ============
   Menu tetap bisa dibuka dengan klik (untuk perangkat sentuh); di perangkat dengan
   mouse (hover:hover & pointer:fine) menu juga terbuka otomatis saat kursor berada
   di atasnya, dan submenu berikutnya selalu terbuka di sebelah kanan submenu induk,
   berlaku untuk seluruh tingkat kedalaman menu. */
(function initNavHover(){
  const canHover=()=>window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const timers=new WeakMap();
  function clearT(el){ const t=timers.get(el); if(t){ clearTimeout(t); timers.delete(el); } }
  document.querySelectorAll('.topnav-group').forEach(group=>{
    group.addEventListener('mouseenter',()=>{
      if(!canHover()) return;
      clearT(group);
      document.querySelectorAll('.topnav-group').forEach(el=>{ if(el!==group){ el.classList.remove('open'); } });
      group.classList.add('open');
    });
    group.addEventListener('mouseleave',()=>{
      if(!canHover()) return;
      clearT(group);
      timers.set(group, setTimeout(()=>{ group.classList.remove('open'); closeFkSubs(); }, 180));
    });
  });
  document.querySelectorAll('.topnav-sub').forEach(sub=>{
    sub.addEventListener('mouseenter',()=>{
      if(!canHover()) return;
      clearT(sub);
      const parent=sub.parentElement;
      Array.from(parent.children).forEach(el=>{
        if(el===sub || !el.classList || !el.classList.contains('topnav-sub')) return;
        el.classList.remove('open');
        el.querySelectorAll('.topnav-sub.open').forEach(s=>s.classList.remove('open'));
      });
      sub.classList.add('open');
      navAdjustFlyout(sub);
    });
    sub.addEventListener('mouseleave',()=>{
      if(!canHover()) return;
      clearT(sub);
      timers.set(sub, setTimeout(()=>{
        sub.classList.remove('open');
        sub.querySelectorAll('.topnav-sub.open').forEach(s=>s.classList.remove('open'));
      }, 180));
    });
  });
})();
/* ============ MENU MOBILE ============ */
function toggleMobileNav(){
  const nav=document.getElementById('topnav'), bd=document.getElementById('topnav-backdrop');
  const open=nav.classList.toggle('open'); if(bd) bd.classList.toggle('show', open);
  document.body.classList.toggle('nav-open', open);
}
function closeMobileNav(){
  const nav=document.getElementById('topnav'), bd=document.getElementById('topnav-backdrop');
  if(nav) nav.classList.remove('open'); if(bd) bd.classList.remove('show');
  document.body.classList.remove('nav-open');
}

/* ============ FORM HELPERS ============ */
/* ---- Bangun form input SPBJ/Kontrak Rinci dari FIELDS/GROUPS (dinamis) ---- */
const KR_SECTION_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>';
function krInputId(f){ return (f && f.input) ? f.input : ('f_'+ (typeof f==='string'?f:f.key)); }
function buildFormKr(){
  const cont=document.getElementById('work-form-fields'); if(!cont) return;
  let html='';
  GROUPS.forEach((g,gi)=>{
    const cols=pynGroupCols(g);
    let titleExtra='';
    if(gi===0 && g.keys.includes('tahun')){
      const tf=FIELDS.find(x=>x.key==='tahun');
      titleExtra=`<div class="title-controls">${yearControlHTML(krInputId(tf))}</div>`;
    }
    html+=`<div class="form-card"><div class="form-section-title">${KR_SECTION_ICON}${g.title}${titleExtra}</div><div class="form-flow" style="--cols:${cols}">`;
    g.keys.forEach(k=>{
      if(gi===0 && k==='tahun') return; // Tahun sudah dipindah ke baris judul
      const f=FIELDS.find(x=>x.key===k); if(!f) return;
      const id=krInputId(f);
      const req=f.req?' <span class="req">*</span>':'';
      const pxw=fieldPxStyle(f);
      const ph=f.ph?` placeholder="${f.ph}"`:'';
      let ctl='';
      if(f.type==='select') ctl=`<select id="${id}"><option value="">— Pilih —</option>${(f.options||[]).map(o=>`<option>${o}</option>`).join('')}</select>`;
      else if(f.type==='num'){
        if(f.auto==='sum'||f.auto==='ppn') ctl=`<input id="${id}" type="text" inputmode="numeric" placeholder="Rp" readonly>`;
        else if(/_harga_(barang|jasa)$/.test(f.key)){ const pfx=f.key.replace(/_harga_(barang|jasa)$/,''); ctl=`<input id="${id}" type="text" inputmode="numeric" placeholder="Rp" oninput="onHargaInput(this,'${pfx}','kr')">`; }
        else ctl=`<input id="${id}" type="text" inputmode="numeric" placeholder="Rp" oninput="onRupiahInput(this)">`;
      }
      else if(f.type==='date') ctl=`<input id="${id}" type="date">`;
      else ctl=`<input id="${id}" type="text"${ph}>`;
      const note=f.auto==='sum'?AUTO_NOTE:(f.auto==='ppn'?PPN_NOTE:'');
      html+=`<div class="field${pxw.cls}"${pxw.style} id="wrap_${id}"><label>${f.label}${req}${note?' ':''}${note}</label>${ctl}</div>`;
    });
    html+=`</div></div>`;
  });
  cont.innerHTML=html;
}
function clearForm(){
  FIELDS.forEach(f=>{ const el=document.getElementById(krInputId(f)); if(el) el.value=''; });
  clearFormErrorsKr();
}
function fillForm(rec){
  FIELDS.forEach(f=>{ const el=document.getElementById(krInputId(f)); if(el) el.value = f.type==='num' ? rupiahInputText(rec[f.key]) : (rec[f.key]!=null ? rec[f.key] : ''); });
  refreshAutoTotals(FIELDS, krInputId);
}
function readForm(){
  const rec={};
  FIELDS.forEach(f=>{
    const el=document.getElementById(krInputId(f));
    let v = el ? el.value.trim() : '';
    if(f.type==='num') v = parseRupiah(v);
    rec[f.key]=v;
  });
  // Harga Total (Tanpa PPN) = Barang + Jasa; Harga Total (Dengan PPN) = Tanpa PPN × 111%
  FIELDS.forEach(f=>{
    if(f.auto==='sum'){ const p=f.key.replace(/_total_tanpa_ppn$/,''); const b=Number(rec[p+'_harga_barang'])||0,j=Number(rec[p+'_harga_jasa'])||0; rec[f.key]=(b+j)>0?(b+j):''; }
  });
  FIELDS.forEach(f=>{
    if(f.auto==='ppn'){ const base=Number(rec[f.key.replace(/_total_dengan_ppn$/,'_total_tanpa_ppn')])||0; rec[f.key]=base>0?ppnFromBase(base):''; }
  });
  return rec;
}
function newRecord(){
  if(!requireInput()) return;
  if(PYN_REG.kr.active) exitPenyesuaianKr();
  editingId=null; krReturnView='dashboard'; buildFormKr(); clearForm();
  document.getElementById('input-title').textContent='Input Kontrak Rinci';
  document.getElementById('edit-banner').style.display='none';
  document.getElementById('io-tpl-kr').style.display='';
  showView('input'); saveDraft('input');
}
function editRecord(rid){
  if(!requireInput()) return;
  if(PYN_REG.kr.active) exitPenyesuaianKr();
  const rec=records.find(r=>r.id===rid); if(!rec) return;
  editingId=rid; krReturnView='list'; buildFormKr(); fillForm(rec);
  document.getElementById('input-title').textContent='Ubah Data Pekerjaan';
  const b=document.getElementById('edit-banner'); b.style.display='flex';
  document.getElementById('edit-banner-text').textContent='Mode Ubah Data';
  document.getElementById('io-tpl-kr').style.display='none';
  showView('input','Memuat'); saveDraft('input');
}

/* ============ CONFIRM MODAL ============ */
const ICONS={
  save:`<svg viewBox="0 0 24 24" fill="none" stroke="#1E9E5A" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>`,
  back:`<svg viewBox="0 0 24 24" fill="none" stroke="#D33A3A" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  del:`<svg viewBox="0 0 24 24" fill="none" stroke="#D33A3A" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  warn:`<svg viewBox="0 0 24 24" fill="none" stroke="#C98A00" stroke-width="2.1"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/></svg>`
};
const ICON_BG={save:'#d8f0e3',back:'#fbe0e0',del:'#fbe0e0',warn:'#fdf0d6'};
/* sfxNone:true -> tombol "Ya" tidak membunyikan nada klik, dipakai oleh
   konfirmasi Keluar yang sudah punya nada sesi sendiri. Penanda dipasang
   per-pemakaian & selalu dibersihkan, karena modal ini dipakai bersama
   (hapus data, dll) yang tetap butuh nada klik normal. */
function openConfirm({icon,title,text,onYes,sfxNone}){
  document.getElementById('confirm-icon').innerHTML=ICONS[icon];
  document.getElementById('confirm-icon').style.background=ICON_BG[icon];
  document.getElementById('confirm-title').textContent=title;
  document.getElementById('confirm-text').textContent=text;
  const yes=document.getElementById('confirm-yes');
  if(sfxNone) yes.dataset.sfx='none'; else delete yes.dataset.sfx;
  yes.onclick=()=>{ closeConfirm(); onYes(); };
  document.getElementById('confirm-overlay').classList.add('show');
}
function closeConfirm(){ document.getElementById('confirm-overlay').classList.remove('show'); }

/* SIMPAN */
/* Kunci pembanding duplikat (No. SPBJ / No. Kontrak), tahan spasi & huruf besar/kecil */
function dupKey(v){ return String(v||'').trim().toLowerCase(); }

/* Bersihkan penanda error pada form KR */
function clearFormErrorsKr(){
  FIELDS.forEach(f=>{ const w=document.getElementById('wrap_'+krInputId(f)); if(w) w.classList.remove('field-error'); });
}
/* Validasi field wajib KR; kembalikan daftar key yang kosong */
function validateRequiredKr(rec){
  const missing=[];
  FIELDS.forEach(f=>{
    if(!f.req) return;
    const v=rec[f.key];
    const empty = (v==null) || (String(v).trim()==='') || (f.type==='num' && (v===0 || v==='0'));
    if(empty) missing.push(f.key);
  });
  return missing;
}
function askSave(){
  if(!requireInput()) return;
  const rec=readForm();
  clearFormErrorsKr();
  const missing=validateRequiredKr(rec);
  if(missing.length){
    missing.forEach(k=>{ const f=FIELDS.find(x=>x.key===k); const w=f&&document.getElementById('wrap_'+krInputId(f)); if(w) w.classList.add('field-error'); });
    const firstWrap=document.getElementById('wrap_'+krInputId(FIELDS.find(x=>x.key===missing[0])));
    if(firstWrap) firstWrap.scrollIntoView({behavior:'smooth',block:'center'});
    toast('Data gagal disimpan, lengkapi data terlebih dahulu','warn');
    return;
  }
  /* Duplikat: cukup Nama Pekerjaan ATAU No. SPBJ yang sama dengan data lain. */
  {
    const bentrok=spkDupCek(rec, records,
      {nomor:'no_spbj', labelNomor:'No. SPBJ', nama:['nama_pekerjaan_kr','nama_pekerjaan_khs']},
      editingId);
    if(bentrok){ toast('Tidak bisa menambahkan 1 data : Duplikat\nSudah ada data dengan '+bentrok.by+' yang sama.','err'); return; }
  }
  openConfirm({
    icon:'save', title:'Simpan Data',
    text:'Apakah anda yakin ingin menyimpan data pekerjaan?',
    onYes:doSave
  });
}
async function doSave(){
  const rec=readForm();
  try{
    if(editingId){
      await Store.update(editingId, rec);
      toast('Data berhasil diperbarui','ok');
    }else{
      await Store.create(rec);
      toast('Data berhasil disimpan','ok');
    }
  }catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'warn'); return; }
  const back = editingId ? krReturnView : 'dashboard';
  editingId=null; clearForm(); clearDraft();
  await refreshData();
  showView(back);
}

/* KEMBALI */
function askCancel(){
  const back = editingId ? krReturnView : 'dashboard';
  openConfirm({
    icon:'back', title:'Batalkan',
    text:'Apakah anda yakin ingin membatalkan data pekerjaan?',
    onYes:()=>{ editingId=null; clearForm(); clearDraft(); showView(back); }
  });
}

/* HAPUS */
function askDelete(rid){
  if(!requireInput()) return;
  const rec=records.find(r=>r.id===rid);
  openConfirm({
    icon:'del', title:'Hapus Data',
    text:'Apakah anda yakin ingin menghapus data pekerjaan?',
    onYes:async()=>{
      try{
        await withActionLoader('Menghapus', async()=>{ await Store.remove(rid); await refreshData(); });
      }catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'warn'); return; }
      toast('Data berhasil dihapus','ok');
    }
  });
}

/* HAPUS SEMUA (KR) — menghapus seluruh data pada tabel monitoring Kontrak Rinci.
   #1: akun user punya kontrol penuh di modul SPBJ/Kontrak, termasuk Hapus Semua. */
function askDeleteAll(){
  if(!requireInput()) return;
  if(!records || records.length===0){ toast('Tidak ada data untuk dihapus','warn'); return; }
  openConfirm({
    icon:'del', title:'Hapus Semua Data',
    text:'Apakah anda yakin ingin menghapus semua data pekerjaan?',
    onYes:async()=>{
      try{
        await withActionLoader('Menghapus', async()=>{ await Store.removeAll(); await refreshData(); });
      }catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'warn'); return; }
      currentPage=1; renderTable();
      toast('Semua data berhasil dihapus','ok');
    }
  });
}

/* ============ DETAIL MODAL (Lihat) ============ */
function viewRecord(rid){
  const rec=records.find(r=>r.id===rid); if(!rec) return;
  let html='';
  GROUPS.forEach(g=>{
    let rows='';
    g.keys.forEach(k=>{
      const f=FIELDS.find(x=>x.key===k);
      rows+=`<div class="detail-row"><span class="dk">${f.label}</span><span class="dv">${fmtMulti(rec[k],f.type)||'—'}</span></div>`;
    });
    html+=detailGroupHTML(g.title, rows);
  });
  document.getElementById('detail-title').textContent='Detail Pekerjaan';
  document.getElementById('detail-body').innerHTML=html;
  withQuickLoader('Memuat', ()=>document.getElementById('detail-overlay').classList.add('show'));
}
/* #5: Bungkus judul + baris dalam satu kartu tabel ber-border */
function detailGroupHTML(title, rowsHtml){
  return `<div class="detail-group"><div class="detail-grp-title">${title}</div>${rowsHtml}</div>`;
}
function closeDetail(){ document.getElementById('detail-overlay').classList.remove('show'); }

/* ============ FORMATTERS ============ */
function fmt(v,type){
  if(v==null||v==='') return '';
  if(type==='num') return rupiah(v);
  if(type==='date') return fmtDate(v);
  return String(v);
}
function rupiah(n){ if(n===''||n==null||isNaN(n))return''; return 'Rp '+Number(n).toLocaleString('id-ID'); }
/* Tampilan detail: bila nilai teks memuat >1 baris dalam satu sel (Alt+Enter),
   tampilkan sebagai daftar bernomor (1., 2., ...) — sama seperti Bidang/Sub Bidang.
   Nilai satu baris atau tipe angka/tanggal tetap diformat normal lewat fmt(). */
function fmtMulti(v,type){
  if(v==null||v==='') return '';
  if(type==='num'||type==='date') return fmt(v,type);
  const lines=String(v).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if(lines.length<=1) return fmt(v,type);
  return lines.map((s,i)=>`<span class="stack-line"><b class="stack-no">${i+1}.</b> ${s}</span>`).join('');
}
/* ---- Format currency Rupiah pada INPUT (tanpa desimal) ---- */
/* Ambil angka mentah (integer, tanpa desimal) dari string/Number apa pun; '' bila kosong */
function parseRupiah(str){
  if(str==null||str==='') return '';
  if(typeof str==='number'){ return isNaN(str)?'':Math.round(str); }
  let s=String(str).trim();
  if(s==='') return '';
  // format Indonesia: koma = desimal -> buang bagian setelah koma
  s=s.split(',')[0];
  const digits=s.replace(/[^\d]/g,'');   // sisakan digit ribuan saja
  if(digits==='') return '';
  return parseInt(digits,10);
}
/* Tampilkan nilai sebagai "Rp 1.500.000" untuk ditaruh di value input */
function rupiahInputText(v){
  const n=parseRupiah(v);
  if(n==='') return '';
  return 'Rp '+Number(n).toLocaleString('id-ID');
}
/* Handler oninput: format sambil mengetik, jaga posisi kursor tetap wajar */
function onRupiahInput(el){
  const raw=el.value;
  const digits=raw.replace(/[^\d]/g,'');
  if(digits===''){ el.value=''; return; }
  // hitung jumlah digit sebelum kursor (untuk memulihkan posisi)
  const selStart=el.selectionStart||raw.length;
  const digitsBefore=raw.slice(0,selStart).replace(/[^\d]/g,'').length;
  const formatted='Rp '+Number(parseInt(digits,10)).toLocaleString('id-ID');
  el.value=formatted;
  // pulihkan kursor: cari posisi setelah 'digitsBefore' digit
  let seen=0, pos=formatted.length;
  for(let i=0;i<formatted.length;i++){ if(/\d/.test(formatted[i])){ seen++; if(seen===digitsBefore){ pos=i+1; break; } } }
  try{ el.setSelectionRange(pos,pos); }catch(e){}
}
/* Tarif PPN: Harga Total (Dengan PPN) = Harga Total (Tanpa PPN) × 111%. */
const PPN_RATE = 1.11;
function ppnFromBase(base){ const b=Number(base)||0; return b>0 ? Math.round(b*PPN_RATE) : 0; }
/* #12: Harga Total (Tanpa PPN) = Harga Barang + Harga Jasa (otomatis, tak bisa diedit).
   Harga Total (Dengan PPN) = Harga Total (Tanpa PPN) × 111% (otomatis, tak bisa diedit).
   Diberikan prefix (mis. 'rab','hps','tawar','kontrak','hpe') dan fungsi pembentuk id input,
   hitung total lalu tulis ke input total dalam format Rupiah. */
function computeAutoTotal(prefix, idOf){
  const bEl=document.getElementById(idOf(prefix+'_harga_barang'));
  const jEl=document.getElementById(idOf(prefix+'_harga_jasa'));
  const tEl=document.getElementById(idOf(prefix+'_total_tanpa_ppn'));
  const pEl=document.getElementById(idOf(prefix+'_total_dengan_ppn'));
  const b=parseRupiah(bEl?bEl.value:'')||0;
  const j=parseRupiah(jEl?jEl.value:'')||0;
  const sum=b+j;
  if(tEl) tEl.value = sum>0 ? ('Rp '+Number(sum).toLocaleString('id-ID')) : '';
  if(pEl){ const withPpn=ppnFromBase(sum); pEl.value = withPpn>0 ? ('Rp '+Number(withPpn).toLocaleString('id-ID')) : ''; }
}
/* Handler oninput untuk field Harga Barang/Harga Jasa: format Rupiah lalu perbarui total.
   prefix diturunkan dari key field (mis. 'rab_harga_barang' -> 'rab'). */
function onHargaInput(el, prefix, formKind){
  onRupiahInput(el);
  const idOf = formKind==='tender' ? tenderInputId : (formKind==='kr' ? krInputId : plInputId);
  computeAutoTotal(prefix, idOf);
}
/* Perbarui seluruh total otomatis pada sebuah form (dipanggil saat fill/clear). */
function refreshAutoTotals(fields, idOf){
  const done=new Set();
  fields.forEach(f=>{
    if(f.auto==='sum' && /_total_tanpa_ppn$/.test(f.key)){
      const prefix=f.key.replace(/_total_tanpa_ppn$/,'');
      if(!done.has(prefix)){ done.add(prefix); computeAutoTotal(prefix, idOf); }
    }
  });
}
/* #12: Untuk file Excel — kolom (1-based) -> huruf kolom Excel (A, B, ..., AA). */
function xlsxCol(n){ let s=''; while(n>0){ const m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=Math.floor((n-1)/26); } return s; }
/* Bangun peta: index kolom (1-based) untuk tiap key field dalam sebuah daftar fields. */
function fieldColMap(fields){ const m={}; fields.forEach((f,i)=>{ m[f.key]=i+1; }); return m; }
/* Kolom yang WAJIB berformat teks di Excel agar angka depan (mis. 0 pada 083x, no. rekening, no. dokumen) & format NPWP tidak berubah. */
const FORCE_TEXT_KEYS = ['no_telp_pic','npwp','no_telp','no_rekening','norm_eproc','no_eproc','no_pr','nomor_pr','no_po'];
function isForceTextKey(key){ return FORCE_TEXT_KEYS.includes(key); }
/* Terapkan rumus otomatis (Barang + Jasa) ke sel total pada baris data Excel.
   ws: worksheet ExcelJS; fields: daftar field terurut sesuai kolom; rowNum: nomor baris data. */
function applyExcelAutoFormula(ws, fields, colMap, rowNum){
  fields.forEach((f)=>{
    if(f.auto==='sum' && /_total_tanpa_ppn$/.test(f.key)){
      const prefix=f.key.replace(/_total_tanpa_ppn$/,'');
      const bCol=colMap[prefix+'_harga_barang'], jCol=colMap[prefix+'_harga_jasa'], tCol=colMap[f.key];
      if(bCol&&jCol&&tCol){
        const cell=ws.getCell(rowNum,tCol);
        cell.value={formula:`${xlsxCol(bCol)}${rowNum}+${xlsxCol(jCol)}${rowNum}`};
        cell.numFmt=ACCT_NODEC;
      }
    }
    if(f.auto==='ppn' && /_total_dengan_ppn$/.test(f.key)){
      const baseKey=f.key.replace(/_total_dengan_ppn$/,'_total_tanpa_ppn');
      const baseCol=colMap[baseKey], pCol=colMap[f.key];
      if(baseCol&&pCol){
        const cell=ws.getCell(rowNum,pCol);
        cell.value={formula:`ROUND(${xlsxCol(baseCol)}${rowNum}*${PPN_RATE},0)`};
        cell.numFmt=ACCT_NODEC;
      }
    }
  });
}
function fmtDate(s){ if(!s)return''; const p=s.split('-'); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:s; }
function statusPill(s){
  if(s==='Selesai') return '<span class="pill pill-kontrak">Selesai</span>';
  if(s==='On Progress') return '<span class="pill pill-prog">On Progress</span>';
  return s||'—';
}

/* ============ TABLE ============ */
function getFilteredRecords(){
  const fb=document.getElementById('filter-bidang').value;
  const fst=document.getElementById('filter-status')?.value||'';
  const ftEl=document.getElementById('filter-tahun');
  const ft=ftEl?ftEl.value:'';
  const fs=document.getElementById('filter-search').value.toLowerCase().trim();
  return records.filter(r=>{
    if(fb && r.bidang_pelaksana!==fb) return false;
    if(fst && r.status!==fst) return false;
    if(ft && contractYear(r)!==ft) return false;
    if(fs){
      const hay=[r.no_prk,r.no_anggaran,r.no_eproc,r.no_spbj,r.nama_pekerjaan_kr,r.nama_pekerjaan_khs,r.nama_penyedia].join(' ').toLowerCase();
      if(!hay.includes(fs)) return false;
    }
    return true;
  }).sort(makeWorkComparator(
    r=>contractYear(r),
    r=>!!String(r.no_spbj||'').trim(),
    r=>r.tgl_terbit_kr
  ));
}
let currentPage = 1;
const PAGE_SIZE = 10;

function renderTable(){
  let rows=getFilteredRecords();
  const total=rows.length;
  document.getElementById('list-count').textContent=total;
  const tb=document.getElementById('table-body');
  const pg=document.getElementById('pagination');
  if(total===0){
    tb.innerHTML=`<tr><td colspan="10"><div class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
      <div>Data tidak tersedia</div>
    </div></td></tr>`;
    pg.innerHTML='';
    return;
  }
  const totalPages=Math.max(1,Math.ceil(total/PAGE_SIZE));
  if(currentPage>totalPages) currentPage=totalPages;
  if(currentPage<1) currentPage=1;
  const start=(currentPage-1)*PAGE_SIZE;
  const pageRows=rows.slice(start,start+PAGE_SIZE);

  tb.innerHTML=pageRows.map((r,i)=>`
    <tr>
      <td class="col-no">${start+i+1}</td>
      <td class="wrap-cell col-nama-freeze">${r.nama_pekerjaan_kr||'—'}</td>
      <td class="col-kontrak">${r.no_spbj||'—'}</td>
      <td class="cell-center col-date">${fmtDate(r.tgl_terbit_kr)||'—'}</td>
      <td class="cell-center col-date">${fmtDate(r.tgl_berakhir_kr)||'—'}</td>
      <td class="col-bidang">${r.bidang_pelaksana||'—'}</td>
      <td class="col-penyedia">${r.nama_penyedia||'—'}</td>
      <td class="col-nilai">${rupiah(r.nilai_kontrak_kr)||'—'}</td>
      <td class="cell-center">${statusPill(r.status)}</td>
      <td>
        <div class="action-cell">
          ${canInput()?`<button class="act act-edit" title="Ubah" onclick="editRecord('${r.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
          </button>`:''}
          <button class="act act-view" title="Lihat" onclick="viewRecord('${r.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          ${canInput()?`<button class="act act-del" title="Hapus" onclick="askDelete('${r.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>`:''}
        </div>
      </td>
    </tr>`).join('');

  revealTbody(tb);
  renderPagination(currentPage,totalPages);
}

function renderPagination(page,totalPages){
  const el=document.getElementById('pagination');
  if(totalPages<=1){ el.innerHTML=''; return; }
  const want=new Set([1,totalPages,page-1,page,page+1]);
  const list=[...want].filter(p=>p>=1&&p<=totalPages).sort((a,b)=>a-b);
  let html=`<button class="pg-btn" ${page===1?'disabled':''} onclick="goToPage(${page-1})">‹ Sebelumnya</button>`;
  let prev=0;
  list.forEach(p=>{
    if(p-prev>1) html+=`<span class="pg-ellipsis">…</span>`;
    html+=`<button class="pg-btn pg-num ${p===page?'active':''}" onclick="goToPage(${p})">${p}</button>`;
    prev=p;
  });
  html+=`<button class="pg-btn" ${page===totalPages?'disabled':''} onclick="goToPage(${page+1})">Berikutnya ›</button>`;
  el.innerHTML=html;
}
function goToPage(p){
  currentPage=p;
  withQuickLoader('Memuat', ()=>{
    renderTable();
    document.querySelector('#view-list .panel').scrollIntoView({behavior:'smooth',block:'nearest'});
  }, 550);
}
function resetFilters(){
  document.getElementById('filter-bidang').value='';
  const st=document.getElementById('filter-status'); if(st) st.value='';
  const t=document.getElementById('filter-tahun'); if(t) t.value='';
  document.getElementById('filter-search').value='';
  currentPage=1;
  renderTable();
}

/* ============ DASHBOARD ============ */
/* ============================================================
   DASHBOARD — mendukung 3 jenis data:
   'kr'     = SPBJ / Kontrak Rinci   (variabel: records)
   'pl'     = Pengadaan Langsung     (variabel: records_pl)
   'tender' = Tender                 (variabel: records_tender)
   ============================================================ */

/* Ambil TAHUN dari sebuah record sesuai jenis data */
function dashYear(r, jenis){
  let fallback='';
  if(jenis==='kr')      fallback = r.tgl_terbit_kr || '';
  else                  fallback = r.tgl_awal_kontrak || r.tgl_anggaran || r.tgl_nota_dinas || r.tgl_nd_rendan || '';
  return yearOf(r, fallback);
}

/* Nilai pekerjaan (nilai kontrak, + PPN) sesuai jenis data */
function dashNilai(r, jenis){
  if(jenis==='kr') return Number(r.nilai_kontrak_kr)||0;
  return Number(r.kontrak_total_dengan_ppn)||0;   // PL & Tender
}

/* Total HPS (dengan PPN) sesuai jenis data */
function dashHPS(r){ return Number(r.hps_total_dengan_ppn)||0; }
/* Total RAB (dengan PPN) sesuai jenis data */
function dashRAB(r){ return Number(r.rab_total_dengan_ppn)||0; }

/* Tanggal acuan sebuah record (ISO YYYY-MM-DD) — sumbernya sama dengan penentu Tahun. */
function dashDate(r, jenis){
  if(jenis==='kr') return r.tgl_terbit_kr || '';
  return r.tgl_awal_kontrak || r.tgl_anggaran || r.tgl_nota_dinas || r.tgl_nd_rendan || '';
}
/* Bulan (1..12) dari tanggal acuan; 0 bila tak diketahui. */
function dashMonth(r, jenis){
  const p=String(dashDate(r,jenis)||'').split('-');
  const m=parseInt(p[1],10);
  return (m>=1&&m<=12)?m:0;
}
/* Apakah record termasuk periode terpilih.
   TW I=Jan-Mar, TW II=Apr-Jun, TW III=Jul-Sep, TW IV=Okt-Des,
   SM I=Jan-Jun (TW I+II), SM II=Jul-Des (TW III+IV). */
function inPeriode(r, jenis, periode){
  if(!periode) return true;
  const m=dashMonth(r,jenis);
  if(!m) return false;                 // tanpa bulan → tak masuk periode tertentu
  switch(periode){
    case 'TW I':   return m>=1  && m<=3;
    case 'TW II':  return m>=4  && m<=6;
    case 'SM I':   return m>=1  && m<=6;
    case 'TW III': return m>=7  && m<=9;
    case 'TW IV':  return m>=10 && m<=12;
    case 'SM II':  return m>=7  && m<=12;
    default:       return true;
  }
}


/* Transisi halus saat berpindah Jenis Data pada Dashboard */
let dashSwitchTimer=null;
function changeDashJenis(){
  const c=document.getElementById('dash-content');
  if(!c){ renderDashboard(); return; }
  c.classList.remove('dash-in');
  c.classList.add('dash-out');
  clearTimeout(dashSwitchTimer);
  dashSwitchTimer=setTimeout(()=>{
    renderDashboard();
    c.classList.remove('dash-out');
    void c.offsetWidth;   // paksa reflow agar animasi masuk terpicu ulang
    c.classList.add('dash-in');
  }, 240);
}

/* #6: Kategori "On Progress" = SEMUA tahapan selain Terkontrak & Gagal/Batal.
   Kategori ini hanya untuk dashboard & filter; tampilan status di monitoring
   tetap menampilkan nilai asli field/kolom pada Input Pekerjaan. */
const ONPROGRESS_TAHAPAN = ['Penyusunan HPS','Proses Pengadaan','Tandatangan Kontrak'];
function isOnProgressTahapan(t){ return t!=='Terkontrak' && t!=='Gagal/Batal'; }
function matchTahapanFilter(rowTahapan, filterVal){
  if(!filterVal) return true;
  if(filterVal==='On Progress') return isOnProgressTahapan(rowTahapan);
  return rowTahapan===filterVal;
}
/* Ikon SVG untuk kartu KPI dashboard (dipilih dari label kartu) */
function cardIcon(k){
  const P='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
  const key=String(k||'').toLowerCase();
  if(key.includes('total'))       return P+'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>';
  if(key.includes('terkontrak'))  return P+'<path d="M20 6 9 17l-5-5"/></svg>';
  if(key.includes('progress'))    return P+'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  if(key.includes('gagal'))       return P+'<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/></svg>';
  if(key.includes('rab'))         return P+'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>';
  if(key.includes('hps'))         return P+'<path d="M3 3v18h18"/><path d="m7 14 3-3 3 3 5-6"/></svg>';
  if(key.includes('nilai'))       return P+'<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.2A2.5 2.5 0 0 1 12 8c1.4 0 2.5.9 2.5 2s-1.1 2-2.5 2-2.5.9-2.5 2 1.1 2 2.5 2a2.5 2.5 0 0 0 2.5-1.2"/></svg>';
  return P+'<rect x="3" y="4" width="18" height="16" rx="2"/></svg>';
}
/* ============================================================
   EFEK 3D KARTU DASHBOARD — miring mengikuti kursor
   Memakai event delegation pada #view-dashboard, BUKAN listener per-kartu:
   kartu dibuat ulang (innerHTML=...) setiap ganti filter Jenis/Anggaran/Tahun,
   sehingga listener yang ditempel langsung akan hilang setiap render.

   Sudut dihitung dari posisi kursor relatif terhadap titik tengah kartu:
   kursor di kanan -> tepi kanan "masuk" (rotateY positif), kursor di atas ->
   tepi atas masuk (rotateX positif). Nilai dikirim ke CSS lewat variabel
   --rx/--ry/--gx/--gy; seluruh transform-nya dikerjakan CSS.

   Diselaraskan ke frame layar (requestAnimationFrame) agar tidak menghitung
   ulang lebih cepat daripada layar menggambar.

   Perangkat sentuh dilewati: tidak ada kursor untuk diikuti, dan efek hover
   akan "nyangkut" setelah jari diangkat. */
const TILT_MAX=7;         // derajat maksimum — di atas ini teks mulai terlihat miring
let _tiltEl=null, _tiltRaf=0, _tiltPend=null;

function dashTiltSupported(){
  try{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  }catch(e){ return false; }
}
function dashTiltApply(){
  _tiltRaf=0;
  const p=_tiltPend; if(!p||!p.el) return;
  const {el,x,y,w,h}=p;
  const px=(x/w)-0.5, py=(y/h)-0.5;          // -0.5 .. 0.5
  el.style.setProperty('--ry', ( px*TILT_MAX*2).toFixed(2)+'deg');
  el.style.setProperty('--rx', (-py*TILT_MAX*2).toFixed(2)+'deg');
  el.style.setProperty('--lift','-6px');
  el.style.setProperty('--gx', ((x/w)*100).toFixed(1)+'%');
  el.style.setProperty('--gy', ((y/h)*100).toFixed(1)+'%');
}
function dashTiltReset(el){
  if(!el) return;
  el.classList.remove('tilt-on','tilt-move');
  el.style.removeProperty('--rx'); el.style.removeProperty('--ry');
  el.style.removeProperty('--lift');
  el.style.removeProperty('--gx'); el.style.removeProperty('--gy');
}
function initDashTilt(){
  const root=document.getElementById('view-dashboard');
  if(!root || root.__tiltReady) return;
  root.__tiltReady=true;

  root.addEventListener('pointermove',function(ev){
    if(!dashTiltSupported()) return;
    if(ev.pointerType && ev.pointerType!=='mouse') return;
    const card=ev.target.closest ? ev.target.closest('.cards .card') : null;
    if(!card){ if(_tiltEl){ dashTiltReset(_tiltEl); _tiltEl=null; } return; }
    if(card!==_tiltEl){
      if(_tiltEl) dashTiltReset(_tiltEl);
      _tiltEl=card;
      card.classList.add('tilt-on');
      // tilt-move dipasang di frame berikutnya: biarkan transisi masuk
      // berjalan dulu, baru gerakannya dibuat instan mengikuti kursor.
      requestAnimationFrame(()=>{ if(_tiltEl===card) card.classList.add('tilt-move'); });
    }
    const r=card.getBoundingClientRect();
    _tiltPend={el:card, x:ev.clientX-r.left, y:ev.clientY-r.top, w:r.width, h:r.height};
    if(!_tiltRaf) _tiltRaf=requestAnimationFrame(dashTiltApply);
  }, {passive:true});

  // pointerleave tidak menyala saat kursor pindah antar kartu di dalam root,
  // jadi kondisi "keluar kartu" ditangani pointermove di atas.
  root.addEventListener('pointerleave',function(){
    if(_tiltEl){ dashTiltReset(_tiltEl); _tiltEl=null; }
  }, {passive:true});
}

/* ============================================================
   EFEK SUARA HOVER DASHBOARD — bunyi halus saat kursor mengenai tiap bagian
   (kartu statistik & baris bar). Nada DISINTESIS lewat Web Audio API (tanpa
   file audio). AudioContext hanya bisa berbunyi setelah ada interaksi pengguna
   (kebijakan browser), jadi di-"unlock" pada gesture pertama (klik/tekan). */
let _dashAC=null, _dashSoundPart=null, _dashSoundT=0, _dashMuted=false;
function dashAC(){
  if(_dashAC) return _dashAC;
  try{ var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null; _dashAC=new AC(); }catch(e){ return null; }
  return _dashAC;
}
function dashAudioUnlock(){ var c=dashAC(); if(c && c.state==='suspended'){ try{ c.resume(); }catch(e){} } }
['pointerdown','keydown','click','touchstart'].forEach(function(ev){
  try{ document.addEventListener(ev, dashAudioUnlock, {passive:true}); }catch(e){}
});
function dashBlip(freq){
  if(_dashMuted) return;
  var c=dashAC(); if(!c) return;
  if(c.state==='suspended'){ try{ c.resume(); }catch(e){} }
  try{
    var t=c.currentTime;
    var o=c.createOscillator(), g=c.createGain();
    o.type='sine';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq*0.82, t+0.09);   /* glide turun tipis → terasa "tik" lembut */
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t+0.008);            /* pelan & tidak mengganggu */
    g.gain.exponentialRampToValueAtTime(0.0001, t+0.13);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t+0.16);
  }catch(e){}
}
/* Suara "sapuan cahaya" (whoosh + kilau) — cocok dgn efek shine bergerak pada
   area brand (logo + MONITORING PENGADAAN). Noise berfilter bandpass menyapu
   naik (seperti cahaya melintas) + 2 nada tinggi lembut sebagai kilau. */
function dashSweep(){
  if(_dashMuted) return;
  var c=dashAC(); if(!c) return;
  if(c.state==='suspended'){ try{ c.resume(); }catch(e){} }
  try{
    var t=c.currentTime, dur=0.5;
    var n=Math.floor(c.sampleRate*dur);
    var buf=c.createBuffer(1,n,c.sampleRate), d=buf.getChannelData(0);
    for(var i=0;i<n;i++){ d[i]=(Math.random()*2-1)*Math.pow(1-i/n,1.4); }   /* noise meredup */
    var src=c.createBufferSource(); src.buffer=buf;
    var bp=c.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=1.1;
    bp.frequency.setValueAtTime(480,t);
    bp.frequency.exponentialRampToValueAtTime(3200,t+dur);                    /* sapuan naik */
    var ng=c.createGain();
    ng.gain.setValueAtTime(0.0001,t);
    ng.gain.exponentialRampToValueAtTime(0.045,t+0.07);
    ng.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    src.connect(bp); bp.connect(ng); ng.connect(c.destination);
    src.start(t); src.stop(t+dur);
    [[1046,0.0],[1568,0.07]].forEach(function(p){                            /* kilau */
      var o=c.createOscillator(), g=c.createGain();
      o.type='sine'; o.frequency.setValueAtTime(p[0],t+p[1]);
      g.gain.setValueAtTime(0.0001,t+p[1]);
      g.gain.exponentialRampToValueAtTime(0.028,t+p[1]+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001,t+p[1]+0.26);
      o.connect(g); g.connect(c.destination);
      o.start(t+p[1]); o.stop(t+p[1]+0.3);
    });
  }catch(e){}
}
function initDashSound(){
  var root=document.getElementById('view-dashboard');
  if(!root || root.__soundReady) return;
  root.__soundReady=true;
  /* Bagian yang berbunyi: kartu statistik + DUA panel grafik ("Pekerjaan per
     Bidang" & "Nilai Pekerjaan per Bidang"). Baris bidang pelaksana (.bar-row)
     TIDAK lagi berbunyi — cukup saat berpindah antar dua panel tersebut. */
  var SEL='#dash-cards .card, #dash-nilai .card, .split > .panel';
  root.addEventListener('pointerover', function(ev){
    if(ev.pointerType && ev.pointerType!=='mouse') return;          /* lewati sentuh */
    var part=ev.target.closest ? ev.target.closest(SEL) : null;
    if(!part || part===_dashSoundPart) return;                      /* hanya saat pindah ke bagian baru */
    _dashSoundPart=part;
    var now=(window.performance&&performance.now)?performance.now():Date.now();
    if(now-_dashSoundT<40) return;                                  /* redam bila terlalu cepat */
    _dashSoundT=now;
    /* Efek suara hover dashboard DINONAKTIFKAN atas permintaan pengguna.
       (dulu: dashBlip(part.classList.contains('panel') ? 520 : 664)) */
  }, {passive:true});
  root.addEventListener('pointerout', function(ev){
    var to=ev.relatedTarget;
    if(!to || !(to.closest && to.closest(SEL))) _dashSoundPart=null; /* keluar bagian → boleh berbunyi lagi saat masuk */
  }, {passive:true});
}

/* ============================================================
   EFEK 3D + SUARA HOVER MENU ATAS (topnav)
   Setiap item menu (link, trigger grup, item dropdown) memiringkan diri
   mengikuti kursor (tilt perspektif + terangkat/translateZ) dan mengeluarkan
   bunyi halus saat kursor mengenainya. Memakai delegasi event pada #topnav
   (item bisa muncul/hilang menurut peran), dan mesin audio yang sama dgn
   dashboard (dashBlip). Sentuh & prefers-reduced-motion dilewati untuk tilt. */
const TN_SEL='.topnav-link, .topnav-trigger, .topnav-item, .topnav-subtrigger';
const TN_TILT=10;
let _tnEl=null, _tnRaf=0, _tnPend=null, _tnSoundEl=null;
function topnavFxSupported(){
  try{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  }catch(e){ return false; }
}
function topnavTiltApply(){
  _tnRaf=0; var p=_tnPend; if(!p||!p.el) return;
  var px=(p.x/p.w)-0.5, py=(p.y/p.h)-0.5;                 /* -0.5 .. 0.5 */
  var ry=(px*TN_TILT*2).toFixed(2), rx=(-py*TN_TILT*2).toFixed(2);
  p.el.style.transform='perspective(520px) translateY(-3px) translateZ(10px) rotateX('+rx+'deg) rotateY('+ry+'deg)';
}
function topnavTiltReset(el){ if(el) el.style.transform=''; }
function initTopnavFx(){
  /* Area brand (logo + judul) — bunyi "sapuan cahaya" saat kursor mencapainya,
     selaras dengan efek shine yang menyapu. pointerenter = sekali saat masuk. */
  var brand=document.querySelector('.topbar-brand');
  if(brand && !brand.__fxReady){
    brand.__fxReady=true;
    brand.addEventListener('pointerenter', function(ev){
      if(ev.pointerType && ev.pointerType!=='mouse') return;
      /* Efek suara "sapuan cahaya" pada logo DINONAKTIFKAN atas permintaan pengguna. */
    });
  }
  var root=document.getElementById('topnav');
  if(!root || root.__fxReady) return;
  root.__fxReady=true;
  /* Suara saat masuk item menu baru */
  root.addEventListener('pointerover', function(ev){
    if(ev.pointerType && ev.pointerType!=='mouse') return;
    var it=ev.target.closest ? ev.target.closest(TN_SEL) : null;
    if(!it || it===_tnSoundEl) return;
    _tnSoundEl=it;
    /* Bunyi saat kursor MELEWATI item menu atas DINONAKTIFKAN — hanya klik yang berbunyi. */
  }, {passive:true});
  root.addEventListener('pointerout', function(ev){
    var to=ev.relatedTarget;
    if(!to || !(to.closest && to.closest(TN_SEL))) _tnSoundEl=null;
  }, {passive:true});
  /* Tilt 3D mengikuti kursor */
  root.addEventListener('pointermove', function(ev){
    if(!topnavFxSupported()) return;
    if(ev.pointerType && ev.pointerType!=='mouse') return;
    var it=ev.target.closest ? ev.target.closest(TN_SEL) : null;
    if(!it){ if(_tnEl){ topnavTiltReset(_tnEl); _tnEl=null; } return; }
    if(it!==_tnEl){ if(_tnEl) topnavTiltReset(_tnEl); _tnEl=it; }
    var r=it.getBoundingClientRect();
    _tnPend={el:it, x:ev.clientX-r.left, y:ev.clientY-r.top, w:r.width, h:r.height};
    if(!_tnRaf) _tnRaf=requestAnimationFrame(topnavTiltApply);
  }, {passive:true});
  root.addEventListener('pointerleave', function(){
    if(_tnEl){ topnavTiltReset(_tnEl); _tnEl=null; }
  }, {passive:true});
}
/* ============================================================
   EFEK 3D + SUARA TAB SEGMEN (SPBJ/Kontrak Rinci · Pengadaan Langsung · Tender)
   - Hover: bunyi "tik" halus.
   - Pilih (klik): chime konfirmasi 2 nada + animasi "pop 3D" (tab terangkat &
     menekan dalam perspektif). Delegasi pada document agar mencakup semua
     kontrol .fk-seg di berbagai halaman. */
let _segHoverEl=null;
function segSelectSound(){
  if(_dashMuted) return;
  var c=dashAC(); if(!c) return;
  if(c.state==='suspended'){ try{ c.resume(); }catch(e){} }
  try{
    var t=c.currentTime;
    [[523.25,0],[783.99,0.07]].forEach(function(p){       /* C5 → G5: konfirmasi lembut */
      var o=c.createOscillator(), g=c.createGain();
      o.type='triangle'; o.frequency.setValueAtTime(p[0],t+p[1]);
      g.gain.setValueAtTime(0.0001,t+p[1]);
      g.gain.exponentialRampToValueAtTime(0.06,t+p[1]+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001,t+p[1]+0.24);
      o.connect(g); g.connect(c.destination);
      o.start(t+p[1]); o.stop(t+p[1]+0.28);
    });
  }catch(e){}
}
function initSegFx(){
  if(document.__segFxReady) return; document.__segFxReady=true;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('pointerover', function(ev){
    if(ev.pointerType && ev.pointerType!=='mouse') return;
    var b=ev.target.closest ? ev.target.closest('.fk-seg-btn') : null;
    if(!b || b===_segHoverEl) return;
    _segHoverEl=b;
    if(!b.classList.contains('active')) try{ dashBlip(600); }catch(e){}
  }, {passive:true});
  document.addEventListener('pointerout', function(ev){
    var to=ev.relatedTarget;
    if(!to || !(to.closest && to.closest('.fk-seg-btn'))) _segHoverEl=null;
  }, {passive:true});
  document.addEventListener('click', function(ev){
    var b=ev.target.closest ? ev.target.closest('.fk-seg-btn') : null;
    if(!b) return;
    try{ segSelectSound(); }catch(e){}
    if(!reduce){
      b.classList.remove('seg-pop'); void b.offsetWidth; b.classList.add('seg-pop');
      b.addEventListener('animationend', function h(e){
        if(e.animationName==='segPop'){ b.classList.remove('seg-pop'); b.removeEventListener('animationend',h); }
      });
    }
  });
}
if(typeof document!=='undefined'){
  if(document.readyState!=='loading'){ try{ initTopnavFx(); initSegFx(); }catch(e){} }
  else document.addEventListener('DOMContentLoaded', function(){ try{ initTopnavFx(); initSegFx(); }catch(e){} });
}

function renderDashboard(){
  initDashTilt();
  initDashSound();
  const jEl=document.getElementById('dash-filter-jenis');
  const jenis = jEl ? jEl.value : 'kr';
  const ftEl=document.getElementById('dash-filter-tahun');
  const ft=ftEl?ftEl.value:'';
  const faEl=document.getElementById('dash-filter-anggaran');
  const fa=faEl?faEl.value:'';
  const fpEl=document.getElementById('dash-filter-periode');
  const fp=fpEl?fpEl.value:'';   // Periode: TW I/II/III/IV atau SM I/II

  // #2: Filter Metode Pengadaan hanya tampil & berlaku untuk jenis Tender
  const metodeWrap=document.getElementById('dash-metode-wrap');
  const fmEl=document.getElementById('dash-filter-metode');
  if(metodeWrap) metodeWrap.style.display = (jenis==='tender') ? '' : 'none';
  const fm=(jenis==='tender' && fmEl) ? fmEl.value : '';

  // Pilih sumber data sesuai jenis
  const src = jenis==='pl' ? (records_pl||[])
            : jenis==='tender' ? (records_tender||[])
            : jenis==='pl_tender' ? [...(records_pl||[]), ...(records_tender||[])]
            : (records||[]);
  let data = ft ? src.filter(r=>dashYear(r,jenis)===ft) : src;
  if(fa) data = data.filter(r=>r.jenis_anggaran===fa);
  if(fm) data = data.filter(r=>r.metode_pengadaan===fm);
  if(fp) data = data.filter(r=>inPeriode(r,jenis,fp));

  // Subtitle & label status
  const meta = {
    kr:     {label:'SPBJ / Kontrak Rinci', title:'Kontrak Rinci',       sub:'Ringkasan monitoring SPBJ / Kontrak Rinci UP3 Masohi'},
    pl:     {label:'Pengadaan Langsung',   title:'Pengadaan Langsung',  sub:'Ringkasan monitoring Pengadaan Langsung UP3 Masohi'},
    tender: {label:'Tender',               title:'Tender',              sub:'Ringkasan monitoring Tender UP3 Masohi'},
    pl_tender:{label:'PL & Tender',        title:'PL & Tender',         sub:'Ringkasan monitoring Pengadaan Langsung & Tender UP3 Masohi'},
  }[jenis];
  const titleEl=document.getElementById('dash-title'); if(titleEl) titleEl.textContent = meta && meta.title ? ('Dashboard '+meta.title) : 'Dashboard';
  const subEl=document.getElementById('dash-subtitle'); if(subEl) subEl.textContent=meta.sub;

  const total=data.length;

  // Hitung status: KR pakai field 'status' (On Progress/Selesai);
  // PL & Tender pakai 'tahapan' (Terkontrak / Gagal/Batal / lainnya = On Progress)
  let terkontrak, prog, gagal;
  if(jenis==='kr'){
    // #5: SPBJ selain "Selesai" dikategorikan On Progress
    terkontrak = data.filter(r=>r.status==='Selesai').length;
    prog       = total - terkontrak;
    gagal      = 0;
  }else{
    // #6: selain Terkontrak & Gagal/Batal masuk On Progress
    terkontrak = data.filter(r=>r.tahapan==='Terkontrak').length;
    gagal      = data.filter(r=>r.tahapan==='Gagal/Batal').length;
    prog       = total - terkontrak - gagal;
  }
  const nilai=Math.round(data.reduce((s,r)=>s+dashNilai(r,jenis),0));
  const totRAB=Math.round(data.reduce((s,r)=>s+dashRAB(r),0));
  const totHPS=Math.round(data.reduce((s,r)=>s+dashHPS(r),0));

  // Kartu ringkasan (baris status)
  const cards=[
    {k:'Total Pekerjaan', v:total, sub:ft?`Tahun ${ft}`:'Seluruh data pekerjaan', c:'var(--teal)'},
    {k:'Terkontrak',      v:terkontrak, sub:jenis==='kr'?'Sudah selesai / terkontrak':'Sudah terkontrak', c:'var(--green)'},
    {k:'On Progress',     v:prog, sub:'Sedang berjalan', c:'var(--yellow)'},
  ];
  if(jenis!=='kr'){
    cards.push({k:'Gagal / Batal', v:gagal, sub:'Pengadaan gagal / dibatalkan', c:'var(--red)'});
    // Nilai Pekerjaan dipindah ke baris atas → baris atas jadi 5 kartu (baris nilai juga 5)
    cards.push({k:'Nilai Pekerjaan', v:rupiah(nilai)||'Rp 0', sub:'Akumulasi nilai kontrak', c:'var(--teal-dark)', vs:'font-size:18px;line-height:1.2;word-break:break-word'});
  }else{
    // KR tidak punya RAB/HPS → Nilai Pekerjaan tetap di baris status
    cards.push({k:'Nilai Pekerjaan', v:rupiah(nilai)||'Rp 0', sub:'Akumulasi nilai pekerjaan', c:'var(--teal-dark)', vs:'font-size:18px;line-height:1.2;word-break:break-word'});
  }

  const dashCardsEl=document.getElementById('dash-cards');
  dashCardsEl.classList.toggle('cards-5', cards.length>=5);   // 5 kartu → grid 5 kolom
  dashCardsEl.innerHTML=cards.map(c=>`
    <div class="card" style="--card-accent:${c.c}"><div class="accent" style="background:${c.c}"></div>
      <div class="card-head">
        <div class="card-ic" style="--ic:${c.c}">${cardIcon(c.k)}</div>
        <div class="k">${c.k}</div>
      </div>
      <div class="v" style="${c.vs||''}">${c.v}</div><div class="sub">${c.sub}</div>
    </div>`).join('');

  // Baris nilai (khusus PL & Tender): Nilai RAB, Nilai HPS, Nilai Pekerjaan, Efisiensi Kontrak vs HPS
  const nilaiRow=document.getElementById('dash-nilai');
  if(nilaiRow){
    if(jenis==='kr'){
      nilaiRow.style.display='none';
      nilaiRow.innerHTML='';
    }else{
      nilaiRow.style.display='';
      const vNum='font-size:18px;line-height:1.2;word-break:break-word';
      const nilaiCards=[
        {k:'Nilai RAB',       v:rupiah(totRAB)||'Rp 0', sub:'Akumulasi RAB', c:'var(--cyan)', vs:vNum},
        {k:'Nilai HPS',       v:rupiah(totHPS)||'Rp 0', sub:'Akumulasi HPS', c:'var(--yellow)', vs:vNum},
      ].map(c=>`
        <div class="card" style="--card-accent:${c.c}"><div class="accent" style="background:${c.c}"></div>
          <div class="card-head">
            <div class="card-ic" style="--ic:${c.c}">${cardIcon(c.k)}</div>
            <div class="k">${c.k}</div>
          </div>
          <div class="v" style="${c.vs||''}">${c.v}</div><div class="sub">${c.sub}</div>
        </div>`).join('');
      nilaiRow.innerHTML = nilaiCards + efisiensiCardHTML(data, totRAB, totHPS, nilai);
    }
  }

  // Grafik per Bidang Pelaksana
  const bidangList=['Jaringan dan Konstruksi','Pembangkitan','Transaksi Energi Listrik','Niaga dan Pemasaran','Perencanaan','Keuangan dan Umum','Keselamatan, Kesehatan Kerja, Lingkungan dan Keamanan'];
  renderBars('chart-bidang','bidang_pelaksana',bidangList,data,{jenis});
  renderBars('chart-anggaran','bidang_pelaksana',bidangList,data,{jenis,sum:true});

  // ✦ Animasi masuk megah + angka menghitung naik (khusus saat baru login)
  if(window.__grandDashEntrance){
    window.__grandDashEntrance=false;
    playGrandDashEntrance();
  }
}

/* Animasi masuk dashboard yang mewah: konten muncul dari blur→fokus,
   kartu naik bertahap, lalu angka besar "menghitung naik" (count up). */
function playGrandDashEntrance(){
  const c=document.getElementById('dash-content');
  if(!c) return;
  // Hindari tumpang tindih dengan animasi pageReveal pada section dashboard
  const sec=document.getElementById('view-dashboard');
  if(sec){ sec.style.animation='none'; sec.classList.add('dash-grand-on'); }
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  c.classList.remove('dash-in','dash-grand');
  void c.offsetWidth;                  // reflow agar animasi terpicu ulang
  c.classList.add('dash-grand');
  c.addEventListener('animationend',function h(e){
    if(e.target===c){
      c.classList.remove('dash-grand');
      if(sec){ sec.style.animation=''; sec.classList.remove('dash-grand-on'); }   // pulihkan
      c.removeEventListener('animationend',h);
    }
  });
  if(reduce) return;
  // Count-up untuk angka bilangan bulat pada kartu (bukan nilai Rupiah)
  const vEls=c.querySelectorAll('#dash-cards .card .v, #dash-nilai .card .v');
  vEls.forEach(el=>{
    const raw=(el.textContent||'').trim();
    if(!/^\d+$/.test(raw)) return;      // hanya angka bulat murni (lewati "Rp ...", persen, dst)
    const target=parseInt(raw,10);
    if(target<=0){ el.textContent='0'; return; }
    const dur=900, start=performance.now();
    const ease=t=>1-Math.pow(1-t,3);    // easeOutCubic
    el.textContent='0';
    function step(now){
      const p=Math.min(1,(now-start)/dur);
      el.textContent=String(Math.round(ease(p)*target));
      if(p<1) requestAnimationFrame(step);
      else el.textContent=String(target);
    }
    requestAnimationFrame(step);
  });
}

/* Kartu Efisiensi — tiga kotak terpisah:
     1) Efisiensi Kontrak vs RAB   = (RAB − Kontrak) / RAB
     2) Efisiensi Kontrak vs HPS   = (HPS − Kontrak) / HPS
     3) Efisiensi HPS vs RAB       = (RAB − HPS)     / RAB
   Pola sama: penghematan = Basis − Pembanding ; persen = penghematan / Basis × 100. */
function efisiensiCardHTML(data, totRAB, totHPS, nilaiPekerjaan){
  const sPek = Number(nilaiPekerjaan)||0;  // Nilai Pekerjaan (akumulasi nilai kontrak)
  const sRAB = Number(totRAB)||0;          // Nilai RAB (akumulasi)
  const sHPS = Number(totHPS)||0;          // Nilai HPS (akumulasi)

  // Satu kartu efisiensi: basis dibandingkan terhadap pembanding
  function card(judul, basis, pembanding, subteks){
    const b = Number(basis)||0, p = Number(pembanding)||0;
    if(b<=0){
      return `<div class="card efisiensi-card" style="--card-accent:var(--green)"><div class="accent" style="background:var(--green)"></div>
        <div class="k">${judul}</div>
        <div class="eff-empty">Data tidak tersedia</div></div>`;
    }
    const hemat = Math.round(b - p);         // penghematan = Basis − Pembanding
    const pct   = (b - p) / b * 100;         // persen = penghematan / Basis × 100
    const barW  = Math.max(0, Math.min(100, pct));
    return `<div class="card efisiensi-card" style="--card-accent:var(--green)"><div class="accent" style="background:var(--green)"></div>
      <div class="k">${judul}</div>
      <div class="eff-pct">${pct.toFixed(2)}<span>%</span></div>
      <div class="eff-bar"><div class="eff-bar-fill" style="width:${barW}%"></div></div>
      <div class="eff-rp">${rupiah(hemat)||'Rp 0'}<small>${subteks}</small></div>
    </div>`;
  }

  return card('Efisiensi HPS vs RAB',     sRAB, sHPS, 'penghematan HPS terhadap RAB')
       + card('Efisiensi Kontrak vs RAB', sRAB, sPek, 'penghematan terhadap RAB')
       + card('Efisiensi Kontrak vs HPS', sHPS, sPek, 'penghematan terhadap HPS');
}

function renderBars(elId,key,cats,data,opts){
  data=data||[]; opts=opts||{};
  const jenis=opts.jenis||'kr';
  const el=document.getElementById(elId); if(!el) return;
  if(data.length===0){ el.innerHTML='<div class="empty" style="padding:20px">Data tidak tersedia</div>'; return; }
  const rows=cats.map(c=>{
    const subset=data.filter(r=>r[key]===c);
    const val=opts.sum ? Math.round(subset.reduce((s,r)=>s+dashNilai(r,jenis),0)) : subset.length;
    return {c,val};
  });
  const max=Math.max(1,...rows.map(x=>x.val));
  el.innerHTML=rows.map(x=>`
    <div class="bar-row">
      <span class="lbl" title="${x.c}">${x.c}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${x.val/max*100}%"></div></div>
      <span class="num${opts.sum?' num-rp':''}">${opts.sum?(rupiah(x.val)||'Rp 0'):x.val}</span>
    </div>`).join('');
}

/* Efisiensi Harga (memakai nilai TOTAL DENGAN PPN untuk HPS, RAB, dan Kontrak):
   1) Nilai Kontrak terhadap HPS  = Σ Kontrak / Σ HPS  (semakin kecil semakin efisien)
   2) Nilai HPS terhadap RAB      = Σ HPS / Σ RAB
   Ditampilkan sebagai persentase. */
function renderEfisiensi(elId, data){
  const el=document.getElementById(elId); if(!el) return;
  let sKontrak=0, sHPS=0, sRAB=0, sHPSforRAB=0;
  data.forEach(r=>{
    const k=Number(r.kontrak_total_dengan_ppn)||0; // Kontrak (dengan PPN)
    const h=dashHPS(r);                              // HPS (dengan PPN)
    const b=dashRAB(r);                              // RAB (dengan PPN)
    if(k>0&&h>0){ sKontrak+=k; sHPS+=h; }            // pasangan Kontrak–HPS
    if(h>0&&b>0){ sRAB+=b; sHPSforRAB+=h; }          // pasangan HPS–RAB
  });

  const rows=[];
  if(sHPS>0){
    const pct=sKontrak/sHPS*100;
    const hemat=Math.round(sHPS-sKontrak); // penghematan (HPS − Kontrak), dengan PPN
    rows.push({c:'Nilai Kontrak terhadap HPS', pct, note:`Efisiensi ${Math.round(100-pct)}% · ${rupiah(hemat)||'Rp 0'}`});
  }
  if(sRAB>0){
    const pct=sHPSforRAB/sRAB*100;
    const hemat=Math.round(sRAB-sHPSforRAB); // penghematan (RAB − HPS), dengan PPN
    rows.push({c:'Nilai HPS terhadap RAB', pct, note:`Efisiensi ${Math.round(100-pct)}% · ${rupiah(hemat)||'Rp 0'}`});
  }
  if(rows.length===0){
    el.innerHTML='<div class="empty" style="padding:20px">Data tidak tersedia</div>';
    return;
  }
  const max=Math.max(100,...rows.map(x=>x.pct));
  el.innerHTML=rows.map(x=>`
    <div class="bar-row">
      <span class="lbl" title="${x.c}">${x.c}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${x.pct/max*100}%"></div></div>
      <span class="num">${Math.round(x.pct)}%</span>
    </div>
    <div style="font-size:10px;color:var(--green-dark);margin:-6px 0 12px 212px">${x.note}</div>`).join('');
}
function ringkasRupiah(n){
  if(n>=1e9) return 'Rp '+(n/1e9).toLocaleString('id-ID',{maximumFractionDigits:2})+' M';
  if(n>=1e6) return 'Rp '+(n/1e6).toLocaleString('id-ID',{maximumFractionDigits:1})+' Jt';
  return 'Rp '+n.toLocaleString('id-ID');
}

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
                     nama:nmTxt, nomor:noTxt,
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
/* =====================================================================
   POP UP HASIL UNGGAH TEMPLATE (bertahan sampai tombol \u00d7 ditekan)
   Dipakai modul Monitoring/Kontrak Rinci, Pengadaan Langsung, & Tender.
   Isi pop up:
     • "<n> Data pekerjaan berhasil ditambahkan"  + daftar nama pekerjaan
     • "<m> Data pekerjaan tidak berhasil ditambahkan : data sudah ada"
       + daftar nama pekerjaan beserta alasannya
   Bagian yang jumlahnya 0 TIDAK ditampilkan. Warna kepala pop up mengikuti
   aturan lama (spkImporTone): hijau bila semua masuk, kuning bila sebagian,
   merah bila tidak ada satu pun yang bisa ditambahkan.
   ===================================================================== */
function spkImporNama(rec, opt){
  var nm=(opt&&opt.nama)||[];
  for(var i=0;i<nm.length;i++){
    var v=String(rec[nm[i]]==null?'':rec[nm[i]]).trim();
    if(v) return v;
  }
  var no=String((opt&&opt.nomor)?(rec[opt.nomor]||''):'').trim();
  return no || '(Tanpa nama pekerjaan)';
}
/* Rangkum hasil saringan menjadi dua daftar siap tampil */
function spkImporHasil(toAdd, dupRows, opt){
  return {
    ok: (toAdd||[]).map(function(r){
          return { nama:spkImporNama(r,opt), row:r.__xlRow }; }),
    dup:(dupRows||[]).map(function(d){
          return { nama:(String(d.nama||'').trim()||String(d.no||'').trim()||'(Tanpa nama pekerjaan)'),
                   row:d.row, by:d.by, asal:d.asal }; })
  };
}
var IMP_IC_OK  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
var IMP_IC_DUP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>';
function spkImporSecHtml(kind, jml, judul, items, ikon){
  var li=items.map(function(x){
    var ket=[];
    if(x.row) ket.push('baris '+x.row);
    if(x.by)  ket.push(x.by+' sama dengan '+(x.asal||'data lain'));
    return '<li>'+fkEsc(x.nama)+
      (ket.length?('<span class="imp-note">'+fkEsc(ket.join(' \u2022 '))+'</span>'):'')+'</li>';
  }).join('');
  return '<div class="imp-sec '+kind+'">'+
    '<div class="imp-sec-h">'+ikon+'<span><span class="imp-n">'+jml+'</span> '+judul+'</span></div>'+
    '<ol class="imp-list">'+li+'</ol></div>';
}
function spkImporModalClose(){
  var ov=document.getElementById('imp-res-overlay');
  if(ov) ov.classList.remove('show');
}
/* hasil : { ok:[...], dup:[...] }  dari spkImporHasil()
   modul : nama modul untuk judul pop up (mis. 'Monitoring')
   tunda : true bila dipanggil bersamaan dengan perpindahan halaman, agar
           pop up muncul setelah animasi "Memuat" selesai. */
function spkImporModal(hasil, modul, tunda){
  var ok=(hasil&&hasil.ok)||[], dup=(hasil&&hasil.dup)||[];
  var tone=spkImporTone(ok.length, dup.length);
  var ov=document.getElementById('imp-res-overlay');
  var body=document.getElementById('imp-res-body');
  var head=document.getElementById('imp-res-head');
  var ttl=document.getElementById('imp-res-title');
  if(!ov || !body){   /* cadangan: bila markup belum tersedia, pakai notifikasi lama */
    toast(spkImporMsg(ok.length, dup.length), tone, TOAST_MS_UPLOAD); return;
  }
  var html='';
  /* Bagian dengan jumlah 0 tidak ditampilkan sama sekali. */
  if(ok.length)  html+=spkImporSecHtml('imp-ok',  ok.length,
                    'Data pekerjaan berhasil ditambahkan', ok, IMP_IC_OK);
  if(dup.length) html+=spkImporSecHtml('imp-dup', dup.length,
                    'Data pekerjaan tidak berhasil ditambahkan : data sudah ada', dup, IMP_IC_DUP);
  if(!html) html='<div class="imp-empty">Tidak ada data yang diproses.</div>';
  body.innerHTML=html;
  if(ttl)  ttl.textContent='Hasil Unggah Template'+(modul?(' \u2014 '+modul):'');
  if(head){ head.classList.remove('tone-ok','tone-warn','tone-err'); head.classList.add('tone-'+tone); }
  body.scrollTop=0;
  if(tunda) setTimeout(function(){ ov.classList.add('show'); }, 560);
  else ov.classList.add('show');
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
      /* Hasil unggah ditampilkan lewat POP UP yang bertahan (ditutup dengan
         tombol \u00d7 di kanan atas), bukan notifikasi sekilas. */
      const _hasilKr=spkImporHasil(toAdd, dupRows, DUPOPT_KR);
      // Data berhasil ditambahkan lewat template → langsung tampilkan loading &
      // kembali ke Daftar Monitoring (showView sudah memunculkan animasi "Memuat").
      if(toAdd.length){
        ev.target.value='';
        showView('list','Memuat daftar');
        spkImporModal(_hasilKr,'Monitoring',true);
        return;
      }
      spkImporModal(_hasilKr,'Monitoring');
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

/* ============================================================
   ============  PENGADAAN LANGSUNG (PL)  =====================
   ============================================================ */
const TABLE_PL = 'pengadaan_langsung';      // tabel Supabase untuk Pengadaan Langsung
const STORE_PL = 'monitoring_pl_up3masohi'; // (tidak dipakai lagi — data di Supabase)
let records_pl = [];
let editingIdPl = null;
let plReturnView = 'dashboard';
let seqPl = 1;
let useSupaPl = USE_SUPABASE;               // Pengadaan Langsung disimpan di Supabase (tabel: pengadaan_langsung)
function idPl(){ return 'p'+(seqPl++)+'_'+Date.now().toString(36); }
function plInputId(key){ return 'pl_'+key; }

function cleanForDbPl(rec){
  const o={};
  FIELDS_PL.forEach(f=>{ o[f.key]=cleanFieldValue(f, rec); });
  // Simpan field multi-nilai independen sebagai JSON (kolom jsonb)
  o.bidang_sub_bidang_list = Array.isArray(rec.bidang_sub_bidang_list) ? rec.bidang_sub_bidang_list : null;
  return o;
}
function lsListPl(){ return []; }               /* penyimpanan lokal dinonaktifkan */
function lsPersistPl(arr){ /* no-op */ }         /* data PL hanya di Supabase */

const Store_PL = {
  async list(){
    const {data,error}=await db.from(TABLE_PL).select('*').order('created_at',{ascending:false});
    if(error) throw error;
    return (data||[]).map(r=>{ FIELDS_PL.forEach(f=>{ if(f.type==='num'&&r[f.key]!=null)r[f.key]=Number(r[f.key]); if(r[f.key]==null && !isIndepKeyPl(f.key))r[f.key]=''; }); if(r.bidang_sub_bidang_list==null) delete r.bidang_sub_bidang_list; return r; });
  },
  async create(rec){
    const {data,error}=await db.from(TABLE_PL).insert(cleanForDbPl(rec)).select(); if(error) throw error; return data[0];
  },
  async bulkCreate(arr){
    const {data,error}=await db.from(TABLE_PL).insert(arr.map(cleanForDbPl)).select(); if(error) throw error; return data;
  },
  async update(rid,rec){
    const {error}=await db.from(TABLE_PL).update(cleanForDbPl(rec)).eq('id',rid); if(error) throw error;
  },
  async remove(rid){
    const {error}=await db.from(TABLE_PL).delete().eq('id',rid); if(error) throw error;
  },
  async removeAll(){
    const {error}=await db.from(TABLE_PL).delete().not('id','is',null); if(error) throw error;
  }
};

function seedSamplesPl(){
  seqPl=3;
  return [
    {id:idPl(),nama_pekerjaan:'Pengadaan Material AMR Pelanggan TM',lokasi_pekerjaan:'Masohi Kota',jangka_waktu:'60 hari kalender',bidang_pelaksana:'Transaksi Energi Listrik',level_risiko:'Rendah',no_nota_dinas:'ND-014/2025',jenis_anggaran:'Operasi',jenis_pengadaan:'Barang',jenis_kontrak:'Lumsum',bidang_sub_bidang:'Pengadaan Barang - Mekanikal dan Elektrikal',bidang_sub_bidang_list:['Pengadaan Barang - Mekanikal dan Elektrikal'],no_prk:'2025.MMU.AO-ADM.01.01',no_anggaran:'001/SKKO/GM.MMU/ADM.NIAGA/MSH/2025/R1',nomor_pr:'3002518656',no_eproc:'EPROC-4230-20250319-4230-00001',no_kontrak:'PL-014/UP3MSH/2025',tgl_awal_kontrak:'2025-03-12',tgl_akhir_kontrak:'2025-05-11',kontrak_total_dengan_ppn:185000000,perusahaan:'CV Energi Nusantara',nama_pic:'Rudi Hartono',tahapan:'Terkontrak',manajemen_kontrak:'Sudah'},
    {id:idPl(),nama_pekerjaan:'Pengadaan Jasa Kebersihan Kantor UP3',lokasi_pekerjaan:'Masohi',jangka_waktu:'1 tahun',bidang_pelaksana:'Keuangan dan Umum',level_risiko:'Tidak Ada',no_nota_dinas:'ND-021/2025',jenis_anggaran:'Operasi',jenis_pengadaan:'Jasa Lainnya',jenis_kontrak:'Lumsum',bidang_sub_bidang:'Jasa Lainnya / Kebersihan',bidang_sub_bidang_list:['Jasa Lainnya / Kebersihan'],no_eproc:'EP-200210',no_kontrak:'',tgl_awal_kontrak:'',perusahaan:'PT Bersih Maluku',tahapan:'Proses Pengadaan',manajemen_kontrak:'Belum'},
  ];
}

async function refreshDataPl(){
  try{ records_pl = await Store_PL.list(); }
  catch(err){ console.error(err); records_pl = records_pl||[]; toast('Gagal memuat data Pengadaan Langsung dari Supabase: '+errMsg(err),'err'); }
  renderTablePl();
  if(document.getElementById('dash-filter-jenis')?.value==='pl') renderDashboard();
}

/* ============================================================
   HELPER BERSAMA PENYESUAIAN (dipakai KR, PL, Tender)
   Model: setiap kelompok punya `cols` (1..5) = jumlah kolom bidang.
          setiap field bisa punya `widthPx` = lebar tetap (pixel).
          Field tanpa widthPx mengisi 1 kolom (flex).
   ============================================================ */
const PYN_COLS_MAX=5;
/* Semua form Input Pekerjaan memakai 4 kolom seragam dengan lebar field sama */
const FORM_COLS_FIXED=4;
function pynGroupCols(g){ return FORM_COLS_FIXED; }
/* Lebar px efektif sebuah field. Migrasi otomatis dari span lama (1/2/3) -> null (pakai kolom). */
function fieldWidthPx(f){ const w=parseInt(f&&f.widthPx,10); return (!isNaN(w)&&w>0)?w:null; }
/* Kembalikan {cls, style} untuk elemen .field pada container .form-flow.
   Prioritas: widthPx (pixel tetap) > span legacy (mengisi N kolom) > auto (1 kolom). */
function fieldPxStyle(f){
  /* Semua field berukuran sama (mengisi 1 kolom dari 4). Lebar px & span
     legacy diabaikan agar tata letak seragam. */
  return {cls:'', style:''};
}

/* ---- Bangun form input PL secara dinamis dari FIELDS_PL/GROUPS_PL ---- */
const PL_SECTION_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>';
const PL_LOCK_RULES = {
  gagal_batal: r => r.tahapan !== 'Gagal/Batal',
  drp_tidak_ada: r => r.ketersediaan_drp !== 'Ada',
};
/* ===== Field multi-nilai INDEPENDEN untuk Pengadaan Langsung =====
   Format & ukuran mengikuti field Bidang/Sub Bidang pada Tender (tombol
   +Tambah / Hapus sendiri, tiap isian punya baris input tersendiri). */
const INDEP_MULTI_KEYS_PL = ['bidang_sub_bidang'];
function isIndepKeyPl(key){ return INDEP_MULTI_KEYS_PL.includes(key); }
function indepListElPl(key){ return document.getElementById('indeplist_pl_'+key); }
function makeIndepRowPl(val){
  const row=document.createElement('div'); row.className='indep-row';
  const inp=document.createElement('input'); inp.type='text'; inp.value=(val!=null?val:'');
  inp.placeholder='cth. Pengadaan Barang - Mekanikal dan Elektrikal';
  row.appendChild(inp); return row;
}
function setIndepValuesPl(key,arr){
  const el=indepListElPl(key); if(!el) return;
  el.innerHTML='';
  const vals=(Array.isArray(arr)&&arr.length)?arr:[''];
  vals.forEach(v=>el.appendChild(makeIndepRowPl(v)));
  updateIndepDelStatePl(key);
}
function indepValuesPl(key){
  const el=indepListElPl(key); if(!el) return [];
  let arr=[...el.querySelectorAll('input')].map(i=>i.value.trim());
  while(arr.length>1 && arr[arr.length-1]==='') arr.pop();
  return arr;
}
function addIndepRowPl(key){
  const el=indepListElPl(key); if(!el) return;
  const row=makeIndepRowPl(''); el.appendChild(row);
  updateIndepDelStatePl(key); row.querySelector('input').focus();
}
function removeIndepRowPl(key){
  const el=indepListElPl(key); if(!el) return;
  const rows=el.querySelectorAll('.indep-row');
  if(rows.length<=1){ toast('Minimal harus ada 1 isian','warn'); return; }
  rows[rows.length-1].remove();
  updateIndepDelStatePl(key);
}
function updateIndepDelStatePl(key){
  const btn=document.getElementById('indepdel_pl_'+key); const el=indepListElPl(key);
  if(btn&&el) btn.disabled=el.querySelectorAll('.indep-row').length<=1;
}
/* HTML satu field multi-nilai independen (PL) — kelas & ukuran sama seperti Tender */
function indepFieldHTMLPl(f){
  const pxw=fieldPxStyle(f);
  const req=f.req?' <span class="req">*</span>':'';
  return `<div class="field${pxw.cls} indep-field field-wide15"${pxw.style} id="wrap_${plInputId(f.key)}">
    <div class="indep-head">
      <label>${f.label}${req}</label>
      <div class="indep-actions">
        <button type="button" class="indep-add" onclick="addIndepRowPl('${f.key}')" title="Tambah isian">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M12 5v14M5 12h14"/></svg>Tambah
        </button>
        <button type="button" class="indep-del-btn" id="indepdel_pl_${f.key}" onclick="removeIndepRowPl('${f.key}')" title="Hapus isian terakhir">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>Hapus
        </button>
      </div>
    </div>
    <div class="indep-list" id="indeplist_pl_${f.key}"></div>
  </div>`;
}
/* Nilai sel Excel untuk field multi-nilai independen (PL) */
function indepCellValuePl(rec,key){
  const list=Array.isArray(rec[key+'_list'])?rec[key+'_list'].filter(x=>x!=null&&x!==''):[];
  if(list.length>1) return list.join('\n');
  let v=list.length?list[0]:rec[key];
  return (v==null||v==='')?'':v;
}

function buildFormPl(){
  const cont=document.getElementById('form-pl-fields'); if(!cont) return;
  let html='';
  GROUPS_PL.forEach((g,gi)=>{
    const cols=pynGroupCols(g);
    let titleExtra='';
    if(gi===0 && g.keys.includes('tahun')){
      titleExtra=`<div class="title-controls">${yearControlHTML(plInputId('tahun'))}</div>`;
    }
    html+=`<div class="form-card"><div class="form-section-title">${PL_SECTION_ICON}${g.title}${titleExtra}</div><div class="form-flow" style="--cols:${cols}">`;
    g.keys.forEach(k=>{
      if(gi===0 && k==='tahun') return; // Tahun sudah dipindah ke baris judul
      const f=FIELDS_PL.find(x=>x.key===k); if(!f) return;
      if(isIndepKeyPl(k)){ html+=indepFieldHTMLPl(f); return; }
      const id=plInputId(k);
      const req=f.req?' <span class="req">*</span>':'';
      const pxw=fieldPxStyle(f);
      const onCtrl=f.ctrl?' onchange="applyLocksPl()"':'';
      const ph=f.ph?` placeholder="${f.ph}"`:'';
      let ctl='';
      if(f.type==='select') ctl=`<select id="${id}"${onCtrl}><option value="">— Pilih —</option>${(f.options||[]).map(o=>`<option>${o}</option>`).join('')}</select>`;
      else if(f.type==='num'){
        if(f.auto==='sum'||f.auto==='ppn') ctl=`<input id="${id}" type="text" inputmode="numeric" placeholder="Rp" readonly>`;
        else if(/_harga_(barang|jasa)$/.test(f.key)){ const pfx=f.key.replace(/_harga_(barang|jasa)$/,''); ctl=`<input id="${id}" type="text" inputmode="numeric" placeholder="Rp" oninput="onHargaInput(this,'${pfx}','pl')"${onCtrl}>`; }
        else ctl=`<input id="${id}" type="text" inputmode="numeric" placeholder="Rp" oninput="onRupiahInput(this)"${onCtrl}>`;
      }
      else if(f.type==='date') ctl=`<input id="${id}" type="date"${onCtrl}>`;
      else ctl=`<input id="${id}" type="text"${ph}${onCtrl}>`;
      const note=f.auto==='sum'?AUTO_NOTE:(f.auto==='ppn'?PPN_NOTE:(f.lock?LOCK_NOTE:''));
      html+=`<div class="field${pxw.cls}"${pxw.style} id="wrap_${id}"><label>${f.label}${req}${note?' ':''}${note}</label>${ctl}</div>`;
    });
    html+=`</div></div>`;
  });
  cont.innerHTML=html;
  INDEP_MULTI_KEYS_PL.forEach(k=>setIndepValuesPl(k,['']));
  applyLocksPl();
}
function isLockedPl(field, vals){
  if(!field.lock) return false;
  const rule = PL_LOCK_RULES[field.lock];
  return rule ? rule(vals) : false;
}
function applyLocksPl(){
  const vals=readFormPl();
  FIELDS_PL.forEach(f=>{
    if(!f.lock) return;
    const el=document.getElementById(plInputId(f.key));
    const wrap=document.getElementById('wrap_'+plInputId(f.key));
    if(!el||!wrap) return;
    const locked=isLockedPl(f,vals);
    el.disabled=locked;
    wrap.classList.toggle('locked',locked);
    if(locked){ el.value=''; wrap.classList.remove('field-error'); }
  });
}

/* ---- Form helpers PL ---- */
function clearFormPl(){ FIELDS_PL.forEach(f=>{ if(isIndepKeyPl(f.key)){ const w=document.getElementById('wrap_'+plInputId(f.key)); if(w){w.classList.remove('locked');w.classList.remove('field-error');} return; } const el=document.getElementById(plInputId(f.key)); if(el){el.value='';if(f.auto!=='sum')el.disabled=false;} const w=document.getElementById('wrap_'+plInputId(f.key)); if(w){w.classList.remove('locked');w.classList.remove('field-error');} }); INDEP_MULTI_KEYS_PL.forEach(k=>setIndepValuesPl(k,[''])); refreshAutoTotals(FIELDS_PL, plInputId); applyLocksPl(); }
function fillFormPl(rec){ FIELDS_PL.forEach(f=>{ if(isIndepKeyPl(f.key)) return; const el=document.getElementById(plInputId(f.key)); if(el)el.value = f.type==='num' ? rupiahInputText(rec[f.key]) : (rec[f.key]!=null ? rec[f.key] : ''); }); INDEP_MULTI_KEYS_PL.forEach(k=>{ const list=(Array.isArray(rec[k+'_list'])&&rec[k+'_list'].length)?rec[k+'_list']:((rec[k]!=null&&rec[k]!=='')?[rec[k]]:['']); setIndepValuesPl(k,list); }); refreshAutoTotals(FIELDS_PL, plInputId); applyLocksPl(); }
function readFormPl(){ const rec={}; FIELDS_PL.forEach(f=>{ if(isIndepKeyPl(f.key)) return; const el=document.getElementById(plInputId(f.key)); let v=el?el.value.trim():''; if(f.type==='num') v=parseRupiah(v); rec[f.key]=v; }); FIELDS_PL.forEach(f=>{ if(f.auto==='sum'){ const p=f.key.replace(/_total_tanpa_ppn$/,''); const b=Number(rec[p+'_harga_barang'])||0,j=Number(rec[p+'_harga_jasa'])||0; rec[f.key]=(b+j)>0?(b+j):''; } }); FIELDS_PL.forEach(f=>{ if(f.auto==='ppn'){ const base=Number(rec[f.key.replace(/_total_dengan_ppn$/,'_total_tanpa_ppn')])||0; rec[f.key]=base>0?ppnFromBase(base):''; } }); INDEP_MULTI_KEYS_PL.forEach(k=>{ const list=indepValuesPl(k); rec[k+'_list']=list; rec[k]=list[0]||''; }); return rec; }
function newRecordPl(){
  if(!requireInput()) return;
  if(PYN_REG.pl.active) exitPenyesuaianPl();
  editingIdPl=null; plReturnView='dashboard'; clearFormPl();
  document.getElementById('input-pl-title').textContent='Input Pekerjaan';
  document.getElementById('edit-banner-pl').style.display='none';
  document.getElementById('io-tpl-pl').style.display='';
  showView('input-pl'); saveDraft('input-pl');
}
function editRecordPl(rid){
  if(!requireAdmin()) return;
  if(PYN_REG.pl.active) exitPenyesuaianPl();
  const rec=records_pl.find(r=>r.id===rid); if(!rec) return;
  editingIdPl=rid; plReturnView='list-pl'; fillFormPl(rec);
  document.getElementById('input-pl-title').textContent='Ubah Data Pekerjaan';
  const b=document.getElementById('edit-banner-pl'); b.style.display='flex';
  document.getElementById('edit-banner-pl-text').textContent='Mode Ubah Data';
  document.getElementById('io-tpl-pl').style.display='none';
  showView('input-pl','Memuat'); saveDraft('input-pl');
}

/* ---- Validasi field wajib PL ---- */
function clearFormErrorsPl(){
  FIELDS_PL.forEach(f=>{ const w=document.getElementById('wrap_'+plInputId(f.key)); if(w) w.classList.remove('field-error'); });
}
/* Field wajib yang kosong (field terkunci dikecualikan) */
function missingRequiredPl(rec){
  const missing=[];
  FIELDS_PL.forEach(f=>{
    if(!f.req) return;
    if(isLockedPl(f,rec)) return;           // field terkunci => tidak wajib
    const v=rec[f.key];
    const empty = (v==null) || (String(v).trim()==='') || (f.type==='num' && (v===0 || v==='0'));
    if(empty) missing.push(f.key);
  });
  return missing;
}

/* ---- Simpan / Batal / Hapus PL ---- */
function askSavePl(){
  if(!requireInput()) return;
  const rec=readFormPl();
  clearFormErrorsPl();
  const missing=missingRequiredPl(rec);
  if(missing.length){
    missing.forEach(k=>{ const w=document.getElementById('wrap_'+plInputId(k)); if(w) w.classList.add('field-error'); });
    const firstWrap=document.getElementById('wrap_'+plInputId(missing[0]));
    if(firstWrap) firstWrap.scrollIntoView({behavior:'smooth',block:'center'});
    toast('Data gagal disimpan, lengkapi data terlebih dahulu','warn');
    return;
  }
  /* Duplikat: cukup Nama Pekerjaan ATAU No. Kontrak yang sama dengan data lain. */
  {
    const bentrok=spkDupCek(rec, records_pl,
      {nomor:'no_kontrak', labelNomor:'No. Kontrak', nama:['nama_pekerjaan']}, editingIdPl);
    if(bentrok){ toast('Tidak bisa menambahkan 1 data : Duplikat\nSudah ada data dengan '+bentrok.by+' yang sama.','err'); return; }
  }
  openConfirm({icon:'save',title:'Simpan Data',text:'Apakah anda yakin ingin menyimpan data pekerjaan?',onYes:doSavePl});
}
async function doSavePl(){
  const rec=readFormPl();
  try{
    if(editingIdPl){ await Store_PL.update(editingIdPl,rec); toast('Data berhasil diperbarui','ok'); }
    else{ await Store_PL.create(rec); toast('Data berhasil disimpan','ok'); }
  }catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'warn'); return; }
  editingIdPl=null; clearFormPl(); clearDraft();
  await refreshDataPl();
  showView('list-pl');
}
function askCancelPl(){
  const back = editingIdPl ? plReturnView : 'dashboard';
  openConfirm({icon:'back',title:'Batalkan',text:'Apakah anda yakin ingin membatalkan data pekerjaan?',
    onYes:()=>{ editingIdPl=null; clearFormPl(); clearDraft(); showView(back); }});
}
function askDeletePl(rid){
  if(!requireAdmin()) return;
  openConfirm({icon:'del',title:'Hapus Data',text:'Apakah anda yakin ingin menghapus data pekerjaan?',
    onYes:async()=>{
      try{ await withActionLoader('Menghapus', async()=>{ await Store_PL.remove(rid); await refreshDataPl(); }); }
      catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'warn'); return; }
      toast('Data berhasil dihapus','ok');
    }});
}
/* HAPUS SEMUA (Pengadaan Langsung) */
function askDeleteAllPl(){
  if(!requireAdmin()) return;
  if(!records_pl || records_pl.length===0){ toast('Tidak ada data untuk dihapus','warn'); return; }
  openConfirm({icon:'del',title:'Hapus Semua Data',
    text:'Apakah anda yakin ingin menghapus semua data pekerjaan?',
    onYes:async()=>{
      try{ await withActionLoader('Menghapus', async()=>{ await Store_PL.removeAll(); await refreshDataPl(); }); }
      catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'warn'); return; }
      currentPagePl=1; renderTablePl();
      toast('Semua data berhasil dihapus','ok');
    }});
}

/* ============================================================
   PENYESUAIAN FORM — MESIN GENERIK (dipakai KR, PL, Tender)
   Atur per kelompok: JUMLAH KOLOM (1..5), nama kelompok.
   Atur per field: nama, LEBAR (pixel), tipe (khusus field baru),
                   urutan via DRAG & DROP (juga antar-kelompok),
                   hapus & tambah field. (persistensi lokal dinonaktifkan)
   ============================================================ */
function pynEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ---- Registry per jenis form ----
   Setiap jenis mendaftarkan: state flag, referensi FIELDS/GROUPS,
   base snapshot, locked keys, id elemen, judul, builder & fill. */
const PYN_REG = {};
function pynRegister(cfg){ PYN_REG[cfg.id]=cfg; cfg.active=false; cfg.work=null; }

/* ---- Persistensi ---- (localStorage dinonaktifkan; skema tidak disimpan lokal) */
function pynLoadSaved(reg){ return null; }
function pynPersist(reg,schema){ /* no-op: tidak menyimpan ke localStorage */ }
/* Ganti ISI array FIELDS & GROUPS in-place (referensi tetap) */
function pynApplySchema(reg,schema){
  if(!schema||!Array.isArray(schema.fields)||!Array.isArray(schema.groups)) return;
  const F=reg.fields, G=reg.groups;
  F.length=0; schema.fields.forEach(f=>F.push({...f}));
  G.length=0; schema.groups.forEach(g=>{ const ng={title:g.title, keys:[...g.keys]}; if(g.cols!=null)ng.cols=g.cols; if(g.pnw)ng.pnw=true; G.push(ng); });
}
function pynApplySaved(reg){ const s=pynLoadSaved(reg); if(s) pynApplySchema(reg,s); }

/* ---- Konversi schema <-> salinan kerja (grup berisi objek field) ---- */
function pynBuildWork(schema){
  const byKey={}; schema.fields.forEach(f=>byKey[f.key]={...f});
  return { groups: schema.groups.map(g=>({ title:g.title, cols:(g.cols!=null?g.cols:3), pnw:!!g.pnw, fields:g.keys.map(k=>byKey[k]).filter(Boolean) })) };
}
function pynCurrentSchema(reg){
  return { fields: reg.fields.map(f=>({...f})),
           groups: reg.groups.map(g=>{ const ng={title:g.title, keys:[...g.keys]}; ng.cols=(g.cols!=null?g.cols:3); if(g.pnw)ng.pnw=true; return ng; }) };
}
function pynFlatten(w){
  const fields=[], groups=[];
  w.groups.forEach(g=>{
    const keys=[];
    g.fields.forEach(f=>{ const nf={...f}; if(nf.type==='select'&&!Array.isArray(nf.options)) nf.options=[]; fields.push(nf); keys.push(nf.key); });
    const ng={ title:(g.title||'').trim()||'Kelompok', keys }; ng.cols=pynGroupCols(g); if(g.pnw)ng.pnw=true;
    groups.push(ng);
  });
  return { fields, groups };
}

/* ---- Kompatibilitas nama lama (PL) ---- */
function buildWorkSchemaFrom(schema){ return pynBuildWork(schema); }

/* ---- Masuk / keluar mode ---- */
function pynSetButtons(reg){
  const s=document.getElementById(reg.saveLabelId);
  const b=document.getElementById(reg.cancelLabelId);
  if(s) s.textContent = reg.active ? 'Simpan Penyesuaian' : 'Simpan';
  if(b) b.textContent = reg.active ? 'Batal' : (reg.cancelDefault||'Batal');
}
function pynStart(id){
  const reg=PYN_REG[id]; if(!reg) return;
  if(!requireAdmin()) return;
  reg.active=true;
  reg.work=pynBuildWork(pynCurrentSchema(reg));
  document.getElementById(reg.titleId).textContent='Penyesuaian Form — '+reg.label;
  const bn=document.getElementById(reg.bannerId); bn.style.display='flex'; bn.classList.add('penyesuaian');
  document.getElementById(reg.bannerTextId).textContent='Mode Penyesuaian — atur nama field, lebar (px), jumlah kolom, dan urutan (seret)';
  const pb=document.getElementById(reg.btnId); if(pb) pb.style.display='none';
  pynSetButtons(reg);
  pynRender(id);
  window.scrollTo({top:0,behavior:'smooth'});
}
function pynExit(id){
  const reg=PYN_REG[id]; if(!reg) return;
  reg.active=false; reg.work=null;
  const pb=document.getElementById(reg.btnId); if(pb) pb.style.display='';
  const bn=document.getElementById(reg.bannerId); if(bn) bn.classList.remove('penyesuaian');
  pynSetButtons(reg);
  reg.rebuild();
  reg.afterExit && reg.afterExit();
}
function pynSimpanClick(id){ const reg=PYN_REG[id]; if(reg&&reg.active) pynSave(id); else PYN_REG[id].onSave(); }
function pynBatalClick(id){ const reg=PYN_REG[id]; if(reg&&reg.active) pynCancel(id); else PYN_REG[id].onCancel(); }
function pynCancel(id){
  openConfirm({icon:'back',title:'Batalkan Penyesuaian',text:'Buang semua perubahan penyesuaian yang belum disimpan?',
    onYes:()=>{ pynExit(id); toast('Penyesuaian dibatalkan','ok'); }});
}
function pynSave(id){
  const reg=PYN_REG[id]; const w=reg.work; if(!w) return;
  let total=0; const keys=new Set();
  for(const g of w.groups){
    if(!(g.title||'').trim()){ toast('Nama kelompok tidak boleh kosong','warn'); return; }
    for(const f of g.fields){
      if(!(f.label||'').trim()){ toast('Nama field tidak boleh kosong','warn'); return; }
      if(f.type==='select' && (!Array.isArray(f.options)||f.options.length===0)){ toast('Field pilihan "'+f.label+'" harus punya minimal 1 opsi','warn'); return; }
      if(keys.has(f.key)){ toast('Terdapat field ganda — periksa kembali','warn'); return; }
      keys.add(f.key); total++;
    }
  }
  if(total===0){ toast('Minimal harus ada satu field','warn'); return; }
  for(const rk of (reg.lockedKeys||[])){ if(!keys.has(rk)){ toast('Field wajib tidak boleh dihapus','warn'); return; } }
  openConfirm({icon:'save',title:'Simpan Penyesuaian',text:'Terapkan & simpan tata letak form ini? Perubahan berlaku pada form input, detail, template & ekspor Excel.',
    onYes:()=>{ const schema=pynFlatten(w); pynApplySchema(reg,schema); pynPersist(reg,schema); toast('Penyesuaian form berhasil disimpan','ok'); pynExit(id); }});
}

/* ---- Ikon editor ---- */
const PYN_ICON_GRP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>';
const PYN_ICON_TRASH='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
const PYN_ICON_PLUS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>';
const PYN_ICON_RESET='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';
const PYN_ICON_GRIP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>';
const PYN_TYPE_LABEL={text:'Teks',num:'Angka',date:'Tanggal',select:'Pilihan'};
function pynTypeOpts(t){ return ['text','num','date','select'].map(x=>`<option value="${x}"${x===t?' selected':''}>${PYN_TYPE_LABEL[x]}</option>`).join(''); }
function pynColsOpts(c){ let o=''; for(let i=1;i<=PYN_COLS_MAX;i++){ o+=`<option value="${i}"${i===c?' selected':''}>${i} Kolom</option>`; } return o; }

/* ---- Render editor generik ---- */
let PYN_CUR=null; // id form yang sedang diedit (untuk handler drag)
function pynRender(id){
  const reg=PYN_REG[id]; PYN_CUR=id;
  const cont=document.getElementById(reg.fieldsContId); if(!cont||!reg.work) return;
  const lockedKeys=reg.lockedKeys||[];
  let html=`<div class="pyn-help">Atur <b>jumlah kolom</b> tiap bidang (1–5), ubah <b>nama field</b>, <b>lebar field (px)</b>, <b>nama kelompok</b>, ubah <b>urutan</b> dengan <b>menyeret</b> ikon ⠿ (bisa antar-kelompok), serta <b>hapus/tambah</b> field & kelompok. Field bertanda 🔒 wajib. Kosongkan lebar px agar field mengikuti jumlah kolom bidang.</div>`;
  html+=`<div class="pyn-toolbar">
    <button class="pyn-tool" onclick="pynAddGroup('${id}')">${PYN_ICON_PLUS} Tambah Kelompok</button>
    <button class="pyn-tool" onclick="pynResetDefault('${id}')">${PYN_ICON_RESET} Kembalikan ke Default</button>
  </div>`;
  reg.work.groups.forEach((g,gi)=>{
    const groupHasLocked=g.fields.some(f=>lockedKeys.includes(f.key));
    const cols=pynGroupCols(g);
    html+=`<div class="pyn-group">
      <div class="pyn-group-head">
        ${PYN_ICON_GRP}
        <input class="pyn-gtitle" value="${pynEsc(g.title)}" oninput="pynSetGroupTitle('${id}',${gi},this.value)" placeholder="Nama Kelompok Field">
        ${g.pnw?'<span class="pyn-type" title="Kelompok data per penyedia">per penyedia</span>':''}
        <span class="pyn-cols">Kolom <select onchange="pynSetCols('${id}',${gi},this.value)">${pynColsOpts(cols)}</select></span>
        <span class="pyn-count">${g.fields.length} field</span>
        ${groupHasLocked?'':`<button class="pyn-gdel" title="Hapus Kelompok" onclick="pynDeleteGroup('${id}',${gi})">${PYN_ICON_TRASH}</button>`}
      </div>
      <div class="pyn-fields${g.fields.length?'':' empty-drop'}" data-gi="${gi}"
           ondragover="pynDragOver(event,${gi})" ondrop="pynDrop(event,${gi})" ondragleave="pynDragLeave(event)">`;
    g.fields.forEach((f,fi)=>{
      const locked=lockedKeys.includes(f.key);
      const isCustom=!!f.custom;
      const wpx=fieldWidthPx(f);
      html+=`<div class="pyn-field" draggable="true" data-gi="${gi}" data-fi="${fi}"
              ondragstart="pynDragStart(event,${gi},${fi})" ondragend="pynDragEnd(event)"
              ondragover="pynFieldDragOver(event,${gi},${fi})" ondrop="pynDrop(event,${gi},${fi})">
        <div class="pyn-frow">
        <span class="pyn-grip" title="Seret untuk memindahkan / mengubah urutan">${PYN_ICON_GRIP}</span>
        <input class="pyn-label" id="pyn-lbl-${id}-${gi}-${fi}" value="${pynEsc(f.label)}" oninput="pynSetLabel('${id}',${gi},${fi},this.value)" placeholder="Nama Field">
        <span class="pyn-pxwrap">Lebar <input class="pyn-pxw" type="number" min="0" step="10" value="${wpx!=null?wpx:''}" placeholder="auto" oninput="pynSetWidthPx('${id}',${gi},${fi},this.value)"> px</span>
        ${isCustom
          ? `<select class="pyn-typesel" onchange="pynSetType('${id}',${gi},${fi},this.value)">${pynTypeOpts(f.type)}</select>`
          : `<span class="pyn-type">${PYN_TYPE_LABEL[f.type]||f.type}</span>`}
        ${(isCustom&&f.type==='select')
          ? `<input class="pyn-opts" value="${pynEsc((f.options||[]).join(', '))}" oninput="pynSetOptions('${id}',${gi},${fi},this.value)" placeholder="Opsi (pisah dengan koma)">`
          : ''}
        ${isCustom?`<span class="pyn-custom-badge">baru</span>`:''}
        ${locked
          ? `<span class="pyn-lock" title="Field wajib">🔒</span>`
          : ``}
        </div>
      </div>`;
    });
    html+=`</div>
    </div>`;
  });
  cont.innerHTML=html;
}

/* ---- Handler editor generik ---- */
function pynWork(id){ return PYN_REG[id].work; }
function pynSetGroupTitle(id,gi,val){ pynWork(id).groups[gi].title=val; }
function pynSetCols(id,gi,val){ let c=parseInt(val,10); if(isNaN(c)||c<1)c=1; if(c>PYN_COLS_MAX)c=PYN_COLS_MAX; pynWork(id).groups[gi].cols=c; }
function pynSetLabel(id,gi,fi,val){ pynWork(id).groups[gi].fields[fi].label=val; }
function pynSetWidthPx(id,gi,fi,val){ const f=pynWork(id).groups[gi].fields[fi]; const w=parseInt(val,10); if(isNaN(w)||w<=0) delete f.widthPx; else f.widthPx=w; }
function pynSetType(id,gi,fi,val){ const f=pynWork(id).groups[gi].fields[fi]; f.type=val; if(val==='select'&&!Array.isArray(f.options)) f.options=[]; if(val!=='select') delete f.options; pynRender(id); }
function pynSetOptions(id,gi,fi,val){ pynWork(id).groups[gi].fields[fi].options = val.split(',').map(s=>s.trim()).filter(Boolean); }
function pynAddField(id,gi){
  const key='custom_'+Date.now().toString(36)+Math.floor(Math.random()*1000).toString(36);
  pynWork(id).groups[gi].fields.push({key,label:'',type:'text',custom:true});
  const fi=pynWork(id).groups[gi].fields.length-1;
  pynRender(id);
  setTimeout(()=>{ const el=document.getElementById(`pyn-lbl-${id}-${gi}-${fi}`); if(el) el.focus(); },0);
}
function pynDeleteField(id,gi,fi){
  const reg=PYN_REG[id]; const f=pynWork(id).groups[gi].fields[fi];
  if((reg.lockedKeys||[]).includes(f.key)){ toast('Field wajib tidak dapat dihapus','warn'); return; }
  openConfirm({icon:'del',title:'Hapus Field',text:`Hapus field "${f.label||'(tanpa nama)'}" dari form? Data yang sudah tersimpan tidak akan hilang.`,
    onYes:()=>{ pynWork(id).groups[gi].fields.splice(fi,1); pynRender(id); }});
}
function pynAddGroup(id){ pynWork(id).groups.push({title:'Kelompok Baru', cols:3, fields:[]}); pynRender(id); window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}); }
function pynDeleteGroup(id,gi){
  const reg=PYN_REG[id]; const g=pynWork(id).groups[gi];
  if(g.fields.some(f=>(reg.lockedKeys||[]).includes(f.key))){ toast('Kelompok berisi field wajib — tidak dapat dihapus','warn'); return; }
  openConfirm({icon:'del',title:'Hapus Kelompok',text:`Hapus kelompok "${g.title||'(tanpa nama)'}" beserta ${g.fields.length} field di dalamnya?`,
    onYes:()=>{ pynWork(id).groups.splice(gi,1); pynRender(id); }});
}
function pynResetDefault(id){
  const reg=PYN_REG[id];
  openConfirm({icon:'back',title:'Kembalikan ke Default',text:'Kembalikan seluruh field & kelompok ke tata letak awal? (Baru tersimpan setelah Anda klik Simpan Penyesuaian.)',
    onYes:()=>{ reg.work=pynBuildWork(JSON.parse(JSON.stringify(reg.base))); pynRender(id); toast('Dikembalikan ke default — jangan lupa Simpan','ok'); }});
}

/* ---- DRAG & DROP untuk urutan field (juga antar-kelompok) ---- */
let PYN_DRAG=null; // {gi,fi}
function pynDragStart(ev,gi,fi){ PYN_DRAG={gi,fi}; ev.dataTransfer.effectAllowed='move'; try{ev.dataTransfer.setData('text/plain',gi+':'+fi);}catch(e){} const el=ev.currentTarget; setTimeout(()=>el.classList.add('dragging'),0); }
function pynDragEnd(ev){ PYN_DRAG=null; document.querySelectorAll('.pyn-field.dragging').forEach(e=>e.classList.remove('dragging')); document.querySelectorAll('.pyn-field.drop-before,.pyn-field.drop-after').forEach(e=>e.classList.remove('drop-before','drop-after')); document.querySelectorAll('.pyn-fields.drag-over').forEach(e=>e.classList.remove('drag-over')); }
function pynFieldDragOver(ev,gi,fi){
  if(!PYN_DRAG) return; ev.preventDefault(); ev.stopPropagation(); ev.dataTransfer.dropEffect='move';
  const el=ev.currentTarget; const r=el.getBoundingClientRect(); const after=(ev.clientY-r.top)>r.height/2;
  el.classList.toggle('drop-after',after); el.classList.toggle('drop-before',!after);
}
function pynDragOver(ev,gi){ if(!PYN_DRAG) return; ev.preventDefault(); ev.dataTransfer.dropEffect='move'; const cont=ev.currentTarget; if(cont.classList.contains('pyn-fields')) cont.classList.add('drag-over'); }
function pynDragLeave(ev){ const cont=ev.currentTarget; cont.classList&&cont.classList.remove('drag-over'); }
function pynDrop(ev,gi,fi){
  if(!PYN_DRAG) return; ev.preventDefault(); ev.stopPropagation();
  const id=PYN_CUR; const w=pynWork(id); if(!w) return;
  const src=PYN_DRAG; const from=w.groups[src.gi]; if(!from) { pynDragEnd(ev); return; }
  const moved=from.fields[src.fi]; if(!moved){ pynDragEnd(ev); return; }
  // tentukan indeks target
  let targetGi=gi, targetFi;
  if(fi==null){ targetFi=w.groups[targetGi].fields.length; } // drop di area kosong -> akhir
  else{
    const el=ev.currentTarget && ev.currentTarget.classList.contains('pyn-field')?ev.currentTarget:null;
    let after=false;
    if(el){ const r=el.getBoundingClientRect(); after=(ev.clientY-r.top)>r.height/2; }
    targetFi=fi+(after?1:0);
  }
  // hapus dari sumber
  from.fields.splice(src.fi,1);
  // koreksi indeks bila sumber & target grup sama dan penghapusan menggeser posisi
  if(src.gi===targetGi && src.fi<targetFi) targetFi--;
  const to=w.groups[targetGi];
  if(targetFi<0)targetFi=0; if(targetFi>to.fields.length)targetFi=to.fields.length;
  to.fields.splice(targetFi,0,moved);
  PYN_DRAG=null;
  pynRender(id);
}

/* ============================================================
   REGISTRASI PENYESUAIAN untuk KR (SPBJ), PL, dan TENDER
   Dipanggil saat INIT (setelah seluruh definisi FIELDS/GROUPS ada).
   ============================================================ */
function pynRegisterAll(){
pynRegister({
  id:'kr', label:'SPBJ / Kontrak Rinci', storeKey:'kr_schema_v1',
  fields:FIELDS, groups:GROUPS, base:KR_SCHEMA_BASE,
  lockedKeys:['jenis_anggaran','bidang_pelaksana'],
  titleId:'input-title', bannerId:'edit-banner', bannerTextId:'edit-banner-text',
  btnId:'btn-penyesuaian-kr', fieldsContId:'work-form-fields',
  saveLabelId:'btn-simpan-kr-label', cancelLabelId:'btn-batal-kr-label', cancelDefault:'Batal',
  rebuild:buildFormKr,
  onSave:askSave, onCancel:askCancel,
  afterExit:()=>{
    const bn=document.getElementById('edit-banner');
    if(editingId){
      const rec=records.find(r=>r.id===editingId);
      document.getElementById('input-title').textContent='Ubah Data Pekerjaan';
      bn.style.display='flex';
      document.getElementById('edit-banner-text').textContent='Mode Ubah Data';
      if(rec) fillForm(rec);
    }else{
      document.getElementById('input-title').textContent='Input Kontrak Rinci';
      bn.style.display='none';
    }
  }
});
pynRegister({
  id:'pl', label:'Pengadaan Langsung', storeKey:'pl_schema_v1',
  fields:FIELDS_PL, groups:GROUPS_PL, base:PL_SCHEMA_BASE,
  lockedKeys:['nama_pekerjaan','bidang_pelaksana'],
  titleId:'input-pl-title', bannerId:'edit-banner-pl', bannerTextId:'edit-banner-pl-text',
  btnId:'btn-penyesuaian-pl', fieldsContId:'form-pl-fields',
  saveLabelId:'btn-simpan-pl-label', cancelLabelId:'btn-batal-pl-label', cancelDefault:'Batal',
  rebuild:buildFormPl,
  onSave:askSavePl, onCancel:askCancelPl,
  afterExit:()=>{
    const bn=document.getElementById('edit-banner-pl');
    if(editingIdPl){
      const rec=records_pl.find(r=>r.id===editingIdPl);
      document.getElementById('input-pl-title').textContent='Ubah Data Pekerjaan';
      bn.style.display='flex';
      document.getElementById('edit-banner-pl-text').textContent='Mode Ubah Data';
      if(rec) fillFormPl(rec);
    }else{
      document.getElementById('input-pl-title').textContent='Input Pekerjaan';
      bn.style.display='none';
    }
  }
});
pynRegister({
  id:'tender', label:'Tender', storeKey:'tender_schema_v1',
  fields:FIELDS_TENDER, groups:GROUPS_TENDER, base:TENDER_SCHEMA_BASE,
  lockedKeys:['nama_pekerjaan','bidang_pelaksana'],
  titleId:'input-tender-title', bannerId:'edit-banner-tender', bannerTextId:'edit-banner-tender-text',
  btnId:'btn-penyesuaian-tender', fieldsContId:'form-tender-fields',
  saveLabelId:'btn-simpan-tender-label', cancelLabelId:'btn-batal-tender-label', cancelDefault:'Batal',
  rebuild:()=>{ buildFormTender(); applyLocksTender(); },
  onSave:askSaveTender, onCancel:askCancelTender,
  afterExit:()=>{
    const bn=document.getElementById('edit-banner-tender');
    if(editingIdTender){
      const rec=records_tender.find(r=>r.id===editingIdTender);
      document.getElementById('input-tender-title').textContent='Ubah Data Pekerjaan';
      bn.style.display='flex';
      document.getElementById('edit-banner-tender-text').textContent='Mode Ubah Data';
      if(rec) fillFormTender(rec);
    }else{
      document.getElementById('input-tender-title').textContent='Input Pekerjaan Tender';
      bn.style.display='none';
    }
  }
});
} /* akhir pynRegisterAll */

/* ---- Wrapper kompatibilitas (dipakai onclick HTML & boot) ---- */
function startPenyesuaianPl(){ pynStart('pl'); }
function exitPenyesuaianPl(){ pynExit('pl'); }
function plSimpanClick(){ pynSimpanClick('pl'); }
function plBatalClick(){ pynBatalClick('pl'); }
function applySavedSchemaPl(){ pynApplySaved(PYN_REG.pl); }
function startPenyesuaianKr(){ pynStart('kr'); }
function exitPenyesuaianKr(){ pynExit('kr'); }
function krSimpanClick(){ pynSimpanClick('kr'); }
function krBatalClick(){ pynBatalClick('kr'); }
function applySavedSchemaKr(){ pynApplySaved(PYN_REG.kr); }
function startPenyesuaianTender(){ pynStart('tender'); }
function exitPenyesuaianTender(){ pynExit('tender'); }
function tenderSimpanClick(){ pynSimpanClick('tender'); }
function tenderBatalClick(){ pynBatalClick('tender'); }
function applySavedSchemaTender(){ pynApplySaved(PYN_REG.tender); }

/* ---- Detail (Lihat) PL — menampilkan SELURUH field ---- */
function viewRecordPl(rid){
  const rec=records_pl.find(r=>r.id===rid); if(!rec) return;
  let html='';
  GROUPS_PL.forEach(g=>{
    let rows='';
    g.keys.forEach(k=>{
      const f=FIELDS_PL.find(x=>x.key===k);
      if(isIndepKeyPl(k)){
        const list=(Array.isArray(rec[k+'_list'])&&rec[k+'_list'].length)?rec[k+'_list']:((rec[k]!=null&&rec[k]!=='')?[rec[k]]:[]);
        const shown=list.filter(x=>x!=null&&x!=='');
        const dv=shown.length ? (shown.length>1 ? shown.map((v,i)=>`<span class="stack-line"><b class="stack-no">${i+1}.</b> ${v}</span>`).join('') : shown[0]) : '—';
        rows+=`<div class="detail-row"><span class="dk">${f.label}</span><span class="dv">${dv}</span></div>`;
      }else{
        rows+=`<div class="detail-row"><span class="dk">${f.label}</span><span class="dv">${fmtMulti(rec[k],f.type)||'—'}</span></div>`;
      }
    });
    html+=detailGroupHTML(g.title, rows);
  });
  document.getElementById('detail-title').textContent='Detail Pekerjaan';
  document.getElementById('detail-body').innerHTML=html;
  withQuickLoader('Memuat', ()=>document.getElementById('detail-overlay').classList.add('show'));
}

/* ---- Pills status PL ---- */
function tahapanPill(s){
  if(!s) return '—';
  /* "Tandatangan Kontrak" berwarna sendiri (biru) & sengaja dipecah 2 baris
     lewat <br>: sel tabel ber-white-space:nowrap sehingga pemenggalan otomatis
     tidak jalan; .pill-ttd di style.css mengembalikan white-space:normal. */
  if(s==='Tandatangan Kontrak')
    return '<span class="pill pill-ttd">Tandatangan<br>Kontrak</span>';
  const cls = (s==='Terkontrak') ? 'pill-kontrak'
            : (s==='Gagal/Batal') ? 'pill-batal' : 'pill-prog';
  return `<span class="pill ${cls}">${s}</span>`;
}
function mkPill(s){
  if(s==='Sudah') return '<span class="pill pill-kontrak">Sudah</span>';
  if(s==='Belum') return '<span class="pill pill-prog">Belum</span>';
  return s||'—';
}

/* ---- Tabel PL ---- */
function getFilteredRecordsPl(){
  const fb=document.getElementById('filter-pl-bidang').value;
  const ftp=document.getElementById('filter-pl-tahapan').value;
  const fyr=document.getElementById('filter-pl-tahun')?.value||'';
  const fs=document.getElementById('filter-pl-search').value.toLowerCase().trim();
  return records_pl.filter(r=>{
    if(fb && r.bidang_pelaksana!==fb) return false;
    if(!matchTahapanFilter(r.tahapan, ftp)) return false;
    if(fyr && yearOf(r, r.tgl_awal_kontrak)!==fyr) return false;
    if(fs){
      const hay=[r.nama_pekerjaan,r.no_kontrak,r.perusahaan,r.no_prk,r.no_eproc,r.no_nota_dinas].join(' ').toLowerCase();
      if(!hay.includes(fs)) return false;
    }
    return true;
  }).sort(makeWorkComparator(
    r=>yearOf(r, r.tgl_awal_kontrak),
    r=>!!String(r.no_kontrak||'').trim(),
    r=>r.tgl_awal_kontrak
  ));
}
let currentPagePl=1;
function renderTablePl(){
  let rows=getFilteredRecordsPl();
  const total=rows.length;
  const cEl=document.getElementById('list-pl-count'); if(cEl) cEl.textContent=total;
  const tb=document.getElementById('table-pl-body');
  const pg=document.getElementById('pagination-pl');
  if(!tb) return;
  if(total===0){
    tb.innerHTML=`<tr><td colspan="10"><div class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
      <div>Data tidak tersedia</div>
    </div></td></tr>`;
    if(pg) pg.innerHTML='';
    return;
  }
  const totalPages=Math.max(1,Math.ceil(total/PAGE_SIZE));
  if(currentPagePl>totalPages) currentPagePl=totalPages;
  if(currentPagePl<1) currentPagePl=1;
  const start=(currentPagePl-1)*PAGE_SIZE;
  const pageRows=rows.slice(start,start+PAGE_SIZE);

  tb.innerHTML=pageRows.map((r,i)=>`
    <tr>
      <td class="col-no">${start+i+1}</td>
      <td class="wrap-cell col-nama-freeze">${r.nama_pekerjaan||'—'}</td>
      <td class="col-kontrak">${r.no_kontrak||'—'}</td>
      <td class="cell-center col-date">${fmtDate(r.tgl_awal_kontrak)||'—'}</td>
      <td class="cell-center col-date">${fmtDate(r.tgl_akhir_kontrak)||'—'}</td>
      <td class="col-bidang">${r.bidang_pelaksana||'—'}</td>
      <td class="col-penyedia">${r.perusahaan||'—'}</td>
      <td class="col-nilai">${rupiah(r.kontrak_total_dengan_ppn)||'—'}</td>
      <td class="cell-center">${tahapanPill(r.tahapan)}</td>
      <td>
        <div class="action-cell">
          ${isAdmin()?`<button class="act act-edit" title="Ubah" onclick="editRecordPl('${r.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
          </button>`:''}
          <button class="act act-view" title="Lihat" onclick="viewRecordPl('${r.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          ${isAdmin()?`<button class="act act-del" title="Hapus" onclick="askDeletePl('${r.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>`:''}
        </div>
      </td>
    </tr>`).join('');

  revealTbody(tb);
  renderPaginationPl(currentPagePl,totalPages);
}
function renderPaginationPl(page,totalPages){
  const el=document.getElementById('pagination-pl');
  if(!el) return;
  if(totalPages<=1){ el.innerHTML=''; return; }
  const want=new Set([1,totalPages,page-1,page,page+1]);
  const list=[...want].filter(p=>p>=1&&p<=totalPages).sort((a,b)=>a-b);
  let html=`<button class="pg-btn" ${page===1?'disabled':''} onclick="goToPagePl(${page-1})">‹ Sebelumnya</button>`;
  let prev=0;
  list.forEach(p=>{
    if(p-prev>1) html+=`<span class="pg-ellipsis">…</span>`;
    html+=`<button class="pg-btn pg-num ${p===page?'active':''}" onclick="goToPagePl(${p})">${p}</button>`;
    prev=p;
  });
  html+=`<button class="pg-btn" ${page===totalPages?'disabled':''} onclick="goToPagePl(${page+1})">Berikutnya ›</button>`;
  el.innerHTML=html;
}
function goToPagePl(p){ currentPagePl=p; withQuickLoader('Memuat', ()=>{ renderTablePl(); document.querySelector('#view-list-pl .panel').scrollIntoView({behavior:'smooth',block:'nearest'}); }, 550); }
function resetFiltersPl(){
  ['filter-pl-bidang','filter-pl-tahapan','filter-pl-tahun','filter-pl-search'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  currentPagePl=1; renderTablePl();
}

/* ---- Template & Export & Upload Excel PL ---- */
async function downloadTemplatePl(){
  if(!requireInput()) return;
  if(!window.ExcelJS){ toast('Library Excel belum termuat, coba lagi','warn'); return; }
  const COLS = orderedFields(FIELDS_PL, GROUPS_PL);
  const OPSI={}; COLS.forEach(f=>{ if(f.type==='select') OPSI[f.key]=f.options; });

  const wb=new ExcelJS.Workbook();
  const dropKeys=Object.keys(OPSI);
  const colLetter=n=>{ let s=''; while(n>0){ const m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=(n-m-1)/26; } return s; };
  const opsiRange={};
  dropKeys.forEach((k,ci)=>{ const L=colLetter(ci+1); opsiRange[k]=`Opsi!$${L}$2:$${L}$${OPSI[k].length+1}`; });

  const wsD=wb.addWorksheet('Data');
  wsD.addRow(COLS.map(f=>f.label));
  wsD.columns=COLS.map(f=>({width:Math.max(16,f.label.length+2)}));
  const thin={style:'thin',color:{argb:'FFBFCAD0'}};
  const allBorder={top:thin,left:thin,bottom:thin,right:thin};
  const headRow=wsD.getRow(1); headRow.height=32;
  for(let c=1;c<=COLS.length;c++){
    const cell=wsD.getCell(1,c);
    cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0E7C86'}};
    cell.font={bold:true,color:{argb:'FFFFFFFF'},size:11};
    cell.alignment={wrapText:true,vertical:'middle',horizontal:'center'};
    cell.border=allBorder;
  }
  for(let r=2;r<=251;r++){ for(let c=1;c<=COLS.length;c++){ const cell=wsD.getCell(r,c); cell.border=allBorder; cell.alignment={vertical:'middle'}; if(r%2===1) cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF2F7F8'}}; } }
  COLS.forEach((f,idx)=>{ const c=idx+1;
    if(f.type==='date'){ for(let r=2;r<=251;r++) wsD.getCell(r,c).numFmt='dd/mm/yyyy'; }
    if(f.type==='num'){ for(let r=2;r<=251;r++){ wsD.getCell(r,c).numFmt=ACCT_NODEC; wsD.getCell(r,c).alignment={vertical:'middle',horizontal:'right'}; } }
    if(isForceTextKey(f.key)){ for(let r=2;r<=251;r++) wsD.getCell(r,c).numFmt='@'; }
  });
  // #12: Harga Total (Tanpa PPN) diisi manual sebagai nilai (tanpa rumus). Format currency Rupiah tanpa desimal sudah diterapkan di atas.

  const wsO=wb.addWorksheet('Opsi');
  dropKeys.forEach((k,ci)=>{ const f=COLS.find(x=>x.key===k); wsO.getCell(1,ci+1).value=f.label; OPSI[k].forEach((v,ri)=>wsO.getCell(ri+2,ci+1).value=v); });
  wsO.state='hidden';

  const ROWS=250;
  COLS.forEach((f,idx)=>{ if(!OPSI[f.key]) return; const L=colLetter(idx+1);
    for(let r=2;r<=ROWS+1;r++){ wsD.getCell(`${L}${r}`).dataValidation={type:'list',allowBlank:true,formulae:[opsiRange[f.key]],showErrorMessage:true,errorTitle:'Pilihan tidak valid',error:'Silakan pilih salah satu nilai dari daftar dropdown.'}; }
  });

  const wsG=wb.addWorksheet('Petunjuk');
  wsG.columns=[{width:30},{width:80}];
  [['PETUNJUK PENGISIAN — PENGADAAN LANGSUNG',''],['',''],
   ['Tahun','WAJIB diisi pada setiap baris. Bila ada satu baris saja yang kosong, seluruh berkas ditolak.'],
   ['No. Kontrak','Tidak boleh kembar — baris dengan nomor yang sama ditolak. Boleh dikosongkan bila kontrak belum terbit (tanda "-" juga dianggap kosong).'],
   ['Bidang Pelaksana','Pilih dari dropdown (7 bidang)'],
   ['Level Risiko / Level Risiko (CSMS)','Pilih dari dropdown: Tidak Ada s/d Ekstrem'],
   ['Jenis Anggaran','Pilih: Operasi / Investasi'],
   ['Jenis Pengadaan','Pilih: Barang / Jasa Lainnya / Jasa Konsultansi / Pekerjaan Konstruksi'],
   ['Jenis Perjanjian/Kontrak','Pilih: Lumsum / Turn Key'],
   ['Bidang / Sub Bidang','Isi bidang/sub bidang. Untuk lebih dari satu, pisahkan tiap isian dengan baris baru (Alt+Enter) dalam satu sel.'],
   ['Tahapan/Proses','Pilih: Penyusunan HPS / Proses Pengadaan / Tandatangan Kontrak / Terkontrak / Gagal/Batal'],
   ['Kendala & Tindak Lanjut','Diisi hanya bila Tahapan/Proses = Gagal/Batal'],
   ['Harga Total (Tanpa PPN)','Terisi otomatis = Harga Barang + Harga Jasa (jangan diedit manual)'],
   ['Jenis Dokumen (CSMS)','Pilih: Sertifikat / Berita Acara'],
   ['Negosiasi Jangka Waktu Pelaksanaan','Isi jangka waktu yang disepakati dalam HARI. Boleh "60" atau "60 hari kalender" \u2014 angka diambil dari kata pertama.'],
   ['Tgl. Akhir Kontrak','Terisi otomatis = Tgl. Awal Kontrak + Negosiasi Jangka Waktu Pelaksanaan (sel abu-abu, jangan diedit manual).'],
   ['Tgl. Berakhir (CSMS)','Terisi otomatis = Tgl. Terbit (CSMS) + 3 tahun kalender (sel abu-abu, jangan diedit manual).'],
   ['Manajemen Kontrak','Pilih: Sudah / Belum'],
   ['Format Tanggal','Kolom tanggal berformat dd/mm/yyyy (mis. 31/01/2025).'],
   ['Nilai/Harga','Kolom nilai berformat Rupiah. Ketik angka saja (mis. 100000000).'],
   ['','Isi data mulai baris ke-2. Jangan menghapus sheet "Opsi".'],
  ].forEach(r=>wsG.addRow(r));
  wsG.getCell('A1').font={bold:true,size:14,color:{argb:'FF0E7C86'}};
  for(let r=3;r<=18;r++){ wsG.getCell(`A${r}`).font={bold:true,color:{argb:'FF095E66'}}; }

  // Rapikan: rumus+kunci Total, sorot dropdown, proteksi sheet
  await spkFinishTemplate(wsD, COLS, OPSI, null, ROWS);

  try{
    const buf=await wb.xlsx.writeBuffer();
    const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='Template_Pengadaan_Langsung_UP3_Masohi.xlsx';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }catch(err){ console.error(err); toast('Gagal membuat template: '+errMsg(err),'warn'); }
}

async function exportExcelPl(){
  if(!window.ExcelJS){ toast('Library Excel belum termuat, coba lagi','warn'); return; }
  const COLS = orderedFields(FIELDS_PL, GROUPS_PL);
  const rows=getFilteredRecordsPl();
  if(rows.length===0){ toast('Tidak ada data untuk diekspor','warn'); return; }
  const wb=new ExcelJS.Workbook();
  const ws=wb.addWorksheet('Daftar Pengadaan Langsung');
  ws.addRow(['No', ...COLS.map(f=>f.label)]);
  rows.forEach((r,ri)=>{ ws.addRow([ri+1, ...COLS.map(f=>{ if(isIndepKeyPl(f.key)) return indepCellValuePl(r,f.key); let v=r[f.key]; if(f.auto==='sum'){ const p=f.key.replace(/_total_tanpa_ppn$/,''); const b=Number(r[p+'_harga_barang'])||0, j=Number(r[p+'_harga_jasa'])||0; const t=b+j; return t>0?t:''; } if(f.auto==='ppn'){ const p=f.key.replace(/_total_dengan_ppn$/,''); const b=Number(r[p+'_harga_barang'])||0, j=Number(r[p+'_harga_jasa'])||0; const t=b+j; return t>0?ppnFromBase(t):''; } if(v===''||v==null) return ''; if(f.type==='num') return Number(v); if(f.type==='date') return fmtDate(v); return v; })]); });
  autoLayoutSheet(ws, [{key:'__no__',label:'No',type:'no'}, ...COLS], rows.length, {
    topAlign: (f)=> isIndepKeyPl(f.key)
  });
  try{
    const buf=await wb.xlsx.writeBuffer();
    const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='Daftar_Pengadaan_Langsung_UP3_Masohi.xlsx';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }catch(err){ console.error(err); toast('Gagal export Excel: '+errMsg(err),'warn'); }
}

function handleUploadPl(ev){
  if(!requireInput()){ ev.target.value=''; return; }
  const file=ev.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=async e=>{
    try{
      const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});
      const sheetName=wb.SheetNames.includes('Data') ? 'Data' : wb.SheetNames[0];
      const ws=wb.Sheets[sheetName];
      const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      if(rows.length<2){ toast('File kosong / tidak ada data','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      const head=rows[0].map(h=>String(h).trim());
      const map={};
      head.forEach((h,i)=>{ const f=FIELDS_PL.find(x=>x.label.toLowerCase()===h.toLowerCase()); if(f)map[f.key]=i; });
      if(Object.keys(map).length===0){ toast('Header tidak dikenali. Gunakan template Pengadaan Langsung.','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      const batch=[];
      for(let r=1;r<rows.length;r++){
        const row=rows[r]; if(!row || row.every(c=>String(c).trim()===''))continue;
        const rec={};
        let fmtBad=false; const fmtBadCells=[];
        FIELDS_PL.forEach(f=>{
          const raw=map[f.key]!=null ? row[map[f.key]] : '';
          const c=coerceCell(f,raw);
          if(!c.ok){ fmtBad=true; fmtBadCells.push({label:f.label,val:raw,col:(map[f.key]!=null?spkColLetterTpl(map[f.key]+1):'?')}); }
          rec[f.key]=c.value;
        });
        if(fmtBad){
          const xlRow=r+1;
          console.warn('[SPK] Upload Pengadaan Langsung — Format Tidak Sesuai di baris '+xlRow+':', fmtBadCells);
          toast(spkFmtBadMsg(fmtBadCells, xlRow),'err', TOAST_MS_UPLOAD);
          ev.target.value=''; return;
        }
        // #12: pastikan Harga Total (Tanpa PPN) = Harga Barang + Harga Jasa
        FIELDS_PL.forEach(f=>{ if(f.auto==='sum'){ const p=f.key.replace(/_total_tanpa_ppn$/,''); const b=Number(rec[p+'_harga_barang'])||0, j=Number(rec[p+'_harga_jasa'])||0; rec[f.key]=(b+j)>0?(b+j):''; } });
        // Harga Total (Dengan PPN) = Harga Total (Tanpa PPN) × 111%
        FIELDS_PL.forEach(f=>{ if(f.auto==='ppn'){ const base=Number(rec[f.key.replace(/_total_dengan_ppn$/,'_total_tanpa_ppn')])||0; rec[f.key]=base>0?ppnFromBase(base):''; } });
        // Field multi-nilai independen: pecah baris (Alt+Enter dalam satu sel) menjadi daftar
        INDEP_MULTI_KEYS_PL.forEach(k=>{ const raw=String(rec[k]!=null?rec[k]:''); const list=raw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean); rec[k+'_list']=list; rec[k]=list[0]||''; });
        if(!String(rec.tahun||'').trim()){ const xlRow=r+1; console.warn('[SPK] Upload Pengadaan Langsung — kolom Tahun kosong di baris '+xlRow); toast(spkMissingMsg(['tahun'], map, FIELDS_PL, xlRow),'warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
        { const miss=missingRequiredPl(rec); if(miss.length){ const xlRow=r+1; console.warn('[SPK] Upload Pengadaan Langsung — kolom wajib kosong di baris '+xlRow+':', miss); toast(spkMissingMsg(miss, map, FIELDS_PL, xlRow),'warn', TOAST_MS_UPLOAD); ev.target.value=''; return; } }
        rec.__xlRow = r+1;   // nomor baris di Excel, dipakai pesan duplikat
        batch.push(rec);
      }
      if(batch.length===0){ toast('Tidak ada baris data untuk diimpor','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      const DUPOPT_K={nomor:'no_kontrak', labelNomor:'No. Kontrak', nama:['nama_pekerjaan']};
      const _sar=spkDupSaring(batch, records_pl, DUPOPT_K);
      const toAdd=_sar.toAdd, dupRows=_sar.dupRows;
      const dupCount=dupRows.length;
      if(dupCount) console.warn('[SPK] Upload Pengadaan Langsung — baris dilewati (duplikat Nama Pekerjaan / No. Kontrak):', dupRows);
      if(toAdd.length){
        try{ await Store_PL.bulkCreate(toAdd); }
        catch(err){ console.error(err); toast('Gagal mengimpor: '+errMsg(err),'warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
        await refreshDataPl();
      }
      /* Hasil unggah ditampilkan lewat POP UP yang bertahan (ditutup dengan
         tombol \u00d7 di kanan atas), bukan notifikasi sekilas. */
      const _hasilPl=spkImporHasil(toAdd, dupRows, DUPOPT_K);
      // Data berhasil ditambahkan lewat template → langsung tampilkan loading &
      // kembali ke Daftar Monitoring Pengadaan Langsung.
      if(toAdd.length){
        ev.target.value='';
        showView('list-pl','Memuat daftar');
        spkImporModal(_hasilPl,'Pengadaan Langsung',true);
        return;
      }
      spkImporModal(_hasilPl,'Pengadaan Langsung');
    }catch(err){ console.error(err); toast('Gagal membaca file Excel','warn', TOAST_MS_UPLOAD); }
    ev.target.value='';
  };
  reader.readAsArrayBuffer(file);
}

/* ============ TOAST ============ */
let toastT;
/* Durasi tampil notifikasi (ms). Peringatan gagal unggah template dibuat lebih
   lama karena isinya perlu dibaca: nomor baris, nama kolom, atau daftar baris
   duplikat. toast(msg, kind, dur) menerima durasi khusus per pemanggilan. */
const TOAST_MS_DEFAULT = 2800;
const TOAST_MS_UPLOAD  = 5000;
/* ============================================================
   BUNYI NOTIFIKASI (Web Audio API — tanpa file audio eksternal)
   Nada dibangkitkan langsung oleh browser, jadi tidak ada aset yang perlu
   diunduh dan tidak menambah waktu muat.

   Dipasang di dalam toast(), sehingga SEMUA notifikasi yang sudah ada ikut
   berbunyi sesuai jenisnya — termasuk berhasil/gagal upload dan berhasil/gagal
   simpan data — tanpa perlu menyentuh 353 pemanggilan toast() satu per satu.

     ok   -> dua nada naik (C6→E6), terdengar "selesai"
     warn -> satu nada sedang, menahan perhatian
     err  -> dua nada turun (A4→D4), terdengar "gagal"

   Browser melarang audio berbunyi sebelum pengguna berinteraksi dengan halaman
   (autoplay policy). AudioContext karena itu dibuat SAAT DIBUTUHKAN, bukan saat
   halaman dimuat, lalu dipakai ulang. Bila masih 'suspended' (mis. notifikasi
   muncul sebelum ada klik), resume() dipanggil dan kegagalannya diabaikan —
   notifikasi visual tetap tampil apa pun yang terjadi pada audio. */
const SFX_KEY='fkl_sfx_off';
let _sfxCtx=null;
function sfxEnabled(){ try{ return localStorage.getItem(SFX_KEY)!=='1'; }catch(e){ return true; } }
function sfxSetEnabled(on){
  try{ on ? localStorage.removeItem(SFX_KEY) : localStorage.setItem(SFX_KEY,'1'); }catch(e){}
  if(on) sfxPlay('ok');   // umpan balik langsung saat dinyalakan
}
function sfxToggle(){ const on=!sfxEnabled(); sfxSetEnabled(on); return on; }
/* Satu nada: osilator + amplop naik-turun agar tidak terdengar "klik" di ujungnya. */
function _sfxTone(ctx, freq, startAt, dur, peak){
  const osc=ctx.createOscillator(), gain=ctx.createGain();
  osc.type='sine'; osc.frequency.setValueAtTime(freq, startAt);
  // Amplop: senyap -> peak (attack 12ms) -> meluruh halus ke senyap.
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt+0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt+dur);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(startAt); osc.stop(startAt+dur+0.02);
}
function sfxPlay(kind){
  if(!sfxEnabled()) return;
  try{
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    if(!_sfxCtx) _sfxCtx=new AC();
    const ctx=_sfxCtx;
    if(ctx.state==='suspended') ctx.resume().catch(()=>{});
    const t0=ctx.currentTime+0.01;
    if(kind==='err'){            // turun: A4 -> D4
      _sfxTone(ctx, 440.00, t0,       0.16, 0.16);
      _sfxTone(ctx, 293.66, t0+0.14,  0.30, 0.16);
    }else if(kind==='warn'){     // satu nada sedang
      _sfxTone(ctx, 523.25, t0,       0.20, 0.13);
    }else{                       // ok — naik: C6 -> E6
      _sfxTone(ctx, 1046.50, t0,      0.11, 0.11);
      _sfxTone(ctx, 1318.51, t0+0.10, 0.20, 0.11);
    }
  }catch(e){ /* audio tidak tersedia: notifikasi visual tetap jalan */ }
}

/* --- Nada klik menu ---------------------------------------------------------
   Sangat singkat & pelan: dipicu jauh lebih sering daripada notifikasi, jadi
   sengaja dibuat nyaris tak terasa agar tidak melelahkan di pemakaian harian. */
function sfxClick(){
  if(!sfxEnabled()) return;
  try{
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    if(!_sfxCtx) _sfxCtx=new AC();
    const ctx=_sfxCtx;
    if(ctx.state==='suspended') ctx.resume().catch(()=>{});
    _sfxTone(ctx, 2000, ctx.currentTime+0.005, 0.035, 0.05);
  }catch(e){}
}

/* --- Nada masuk & keluar ----------------------------------------------------
   Mengiringi animasi "Selamat Datang" (playLoginAnim) dan animasi keluar
   (performLogout), yang masing-masing berdurasi ± 1,3 detik. Nadanya dibuat
   lebih panjang & bertingkat daripada nada notifikasi biasa supaya terasa
   sebagai penanda babak, bukan sekadar umpan balik.

     masuk  -> arpeggio NAIK   C5-E5-G5-C6 (terbuka, menyambut)
     keluar -> arpeggio TURUN  C6-G5-E5-C5 (menutup, kebalikannya) */
function sfxSession(kind){
  if(!sfxEnabled()) return;
  try{
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    if(!_sfxCtx) _sfxCtx=new AC();
    const ctx=_sfxCtx;
    if(ctx.state==='suspended') ctx.resume().catch(()=>{});
    const t0=ctx.currentTime+0.02;
    const naik=[523.25, 659.25, 783.99, 1046.50];        // C5 E5 G5 C6
    const nada=(kind==='out')?naik.slice().reverse():naik;
    nada.forEach((f,i)=>{
      const last=(i===nada.length-1);
      _sfxTone(ctx, f, t0+i*0.13, last?0.42:0.20, 0.10);
    });
  }catch(e){}
}

/* --- Nada putaran gear ------------------------------------------------------
   Mengiringi ikon roda gigi (⚙) saat menu Pengaturan dibuka/ditutup dan ikonnya
   berputar. Bunyinya dirancang "mekanis" singkat: derau tersaring bandpass yang
   menyapu naik lalu turun (kesan roda berputar sesaat) + beberapa "tik" gigi
   roda yang halus. Dibuat pelan agar tidak mengganggu, dan tetap menghormati
   sakelar SFX (sfxEnabled). AudioContext dipakai ulang dari nada lain. */
let _sfxGearLast=-1;
function sfxGear(){
  if(!sfxEnabled()) return;
  try{
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    if(!_sfxCtx) _sfxCtx=new AC();
    const ctx=_sfxCtx;
    if(ctx.state==='suspended') ctx.resume().catch(()=>{});
    // Jeda: cegah bunyi menumpuk saat kursor bergerak-gerak di atas gear atau
    // saat hover langsung disusul klik (hover + buka menu).
    const nowT=ctx.currentTime;
    if(_sfxGearLast>=0 && (nowT-_sfxGearLast)<0.28) return;
    _sfxGearLast=nowT;
    const t0=ctx.currentTime+0.01;
    const dur=0.24;
    // Whir: derau putih tersaring bandpass yang frekuensinya menyapu naik-turun.
    const frames=Math.max(1, Math.floor(ctx.sampleRate*dur));
    const buf=ctx.createBuffer(1, frames, ctx.sampleRate);
    const data=buf.getChannelData(0);
    for(let i=0;i<frames;i++) data[i]=(Math.random()*2-1);
    const src=ctx.createBufferSource(); src.buffer=buf;
    const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=6;
    bp.frequency.setValueAtTime(650, t0);
    bp.frequency.linearRampToValueAtTime(1550, t0+dur*0.45);
    bp.frequency.linearRampToValueAtTime(520, t0+dur);
    const wg=ctx.createGain();
    wg.gain.setValueAtTime(0.0001, t0);
    wg.gain.exponentialRampToValueAtTime(0.05, t0+0.03);
    wg.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    src.connect(bp); bp.connect(wg); wg.connect(ctx.destination);
    src.start(t0); src.stop(t0+dur+0.02);
    // Ratchet: deretan "tik" pendek seperti gigi roda yang lewat satu per satu.
    const n=7;
    for(let i=0;i<n;i++){
      const tt=t0+0.02+i*(dur*0.85/n);
      _sfxTone(ctx, 1350+i*55, tt, 0.02, 0.028);
    }
  }catch(e){}
}

function toast(msg,kind,dur){
  const t=document.getElementById('toast');
  const k = kind==='warn' ? 'warn' : (kind==='err'||kind==='fail') ? 'err' : 'ok';
  sfxPlay(k);
  const ic = k==='warn'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/></svg>'
    : k==='err'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  t.classList.remove('toast-ok','toast-warn','toast-err');
  t.classList.add('toast-'+k);
  /* Pesan bisa terdiri dari beberapa BARIS (dipisah "\n"), mis. hasil unggah
     template: "2 Data pekerjaan berhasil ditambahkan" lalu "3 Data pekerjaan
     tidak berhasil ditambahkan : data sudah ada". Karena isinya dipasang lewat
     innerHTML, "\n" mentah hanya menjadi spasi biasa sehingga kedua kalimat
     menyambung jadi satu baris — di sini diterjemahkan menjadi <br>.
     Kelas .multi dipakai agar ikon tetap sejajar baris pertama, bukan melayang
     di tengah blok teks. */
  const baris = String(msg==null?'':msg).split(/\r?\n/);
  t.classList.toggle('toast-multi', baris.length>1);
  t.innerHTML=ic+'<span>'+baris.join('<br>')+'</span>';
  t.classList.add('show'); clearTimeout(toastT);
  const ms = (typeof dur==='number' && dur>0) ? dur : TOAST_MS_DEFAULT;
  toastT=setTimeout(()=>t.classList.remove('show'),ms);
}


/* ============================================================
   ====================  TENDER MODULE  =======================
   148 field mengikuti sheet "Tender" pada Data_Untuk_Coding.xlsx
   ============================================================ */
const ANGKA_1_20 = Array.from({length:20},(_,i)=>String(i+1));
const PENYEDIA_1_20 = Array.from({length:20},(_,i)=>String(i+1)+' Perusahaan');
const PESERTA_LULUS_1_20 = Array.from({length:20},(_,i)=>String(i+1)+' Perusahaan');
const TINDAK_LANJUT_OPTS = ['Serah Terima','Amandemen','Dikembalikan','Proses Klaim'];

/* table:true => tampil di tabel Monitoring; seluruh field selalu tampil di "Lihat".
   lock:'<rule>' => terkunci otomatis sesuai aturan pada TENDER_LOCK_RULES. */
const FIELDS_TENDER = [
  // I. Informasi Pekerjaan
  {key:'tahun', label:'Tahun', type:'select', options:TAHUN_OPTS},
  {key:'nama_pekerjaan', label:'Nama Pekerjaan', type:'text', table:true, span:2, req:true},
  {key:'lokasi_pekerjaan', label:'Lokasi Pekerjaan', type:'text', req:true},
  {key:'jangka_waktu', label:'Jangka Waktu Pelaksanaan Pekerjaan', type:'text', req:true, ph:'..........(hari)'},
  {key:'bidang_pelaksana', label:'Bidang Pelaksana', type:'select', options:BIDANG_OPTS, table:true, req:true},
  {key:'level_risiko', label:'Level Risiko Pekerjaan', type:'select', options:RISIKO_OPTS, req:true},
  // II. Nota Dinas Pengadaan
  {key:'no_nd_rendan', label:'No. Nota Dinas Rendan', type:'text'},
  {key:'tgl_nd_rendan', label:'Tgl. Nota Dinas Rendan', type:'date'},
  {key:'no_nd_laksda', label:'No. Nota Dinas Laksda', type:'text'},
  {key:'tgl_nd_laksda', label:'Tgl. Nota Dinas Laksda', type:'date'},
  // III. Dokumen Pengadaan
  {key:'tgl_terima_dok', label:'Tgl. Diterima Dokumen Pengadaan', type:'date', req:true},
  {key:'ketersediaan_drp', label:'Ketersediaan DRP', type:'select', options:['Ada','Tidak Ada'], ctrl:true, req:true},
  {key:'no_drp', label:'No. DRP', type:'text', lock:'drp_tidak_ada', req:true},
  {key:'tgl_drp', label:'Tgl. DRP', type:'date', lock:'drp_tidak_ada', req:true},
  // IV. Dokumen RKS
  {key:'no_rks', label:'No. RKS', type:'text', req:true},
  {key:'tgl_rks', label:'Tgl. RKS', type:'date', req:true},
  {key:'addendum_rks', label:'Addendum RKS', type:'select', options:['Ada','Tidak Ada'], ctrl:true, req:true},
  {key:'no_add_rks', label:'No. Addendum RKS', type:'text', lock:'add_rks', req:true},
  {key:'tgl_add_rks', label:'Tgl. Addendum RKS', type:'date', lock:'add_rks', req:true},
  // V. Dokumen HPE
  {key:'no_hpe', label:'No. HPE', type:'text'},
  {key:'tgl_hpe', label:'Tgl. HPE', type:'date', req:true},
  {key:'hpe_harga_barang', label:'HPE — Harga Barang', type:'num'},
  {key:'hpe_harga_jasa', label:'HPE — Harga Jasa', type:'num'},
  {key:'hpe_total_tanpa_ppn', label:'HPE — Harga Total (Tanpa PPN)', type:'num', auto:'sum'},
  {key:'hpe_total_dengan_ppn', label:'HPE — Harga Total (Dengan PPN)', type:'num', auto:'ppn'},
  // VI. Rencana Anggaran Biaya
  {key:'rab_harga_barang', label:'RAB — Harga Barang', type:'num'},
  {key:'rab_harga_jasa', label:'RAB — Harga Jasa', type:'num'},
  {key:'rab_total_tanpa_ppn', label:'RAB — Harga Total (Tanpa PPN)', type:'num', auto:'sum'},
  {key:'rab_total_dengan_ppn', label:'RAB — Harga Total (Dengan PPN)', type:'num', auto:'ppn'},
  {key:'no_prk', label:'No. PRK', type:'text', req:true, ph:'cth. 2025.MMU.AO-ADM.01.01'},
  {key:'no_anggaran', label:'No. Anggaran', type:'text', req:true, ph:'cth. 001/SKKO/GM.MMU/ADM.NIAGA/MSH/2025/R1'},
  {key:'tgl_anggaran', label:'Tgl. Anggaran', type:'date', req:true},
  {key:'jenis_anggaran', label:'Jenis Anggaran', type:'select', options:['Operasi','Investasi'], req:true},
  // VII. Kriteria Pengadaan
  {key:'jenis_pengadaan', label:'Jenis Pengadaan', type:'select', options:['Barang','Jasa Lainnya','Jasa Konsultansi','Pekerjaan Konstruksi','Alih Daya'], req:true},
  {key:'metode_pengadaan', label:'Metode Pengadaan', type:'select', options:['Tender Terbatas','Tender Terbuka','Seleksi Umum','Seleksi Terbatas','Penunjukan Langsung','Tender Cepat'], table:true, ctrl:true, req:true},
  {key:'kualifikasi', label:'Kualifikasi', type:'select', options:['Pascakualifikasi','Prakualifikasi'], ctrl:true, req:true},
  {key:'metode_penyampaian', label:'Metode Penyampaian', type:'select', options:['1 Tahap 1 Sampul','1 Tahap 2 Sampul','2 Tahap'], ctrl:true, req:true},
  {key:'metode_evaluasi', label:'Metode Evaluasi', type:'select', options:['Sistem Gugur','Sistem Nilai','Sistem Kualitas','Sistem Biaya Terendah','Sistem Kualitas dan Biaya'], req:true},
  {key:'jenis_kontrak', label:'Jenis Perjanjian/Kontrak', type:'select', options:['Lumsum','Turn Key','Gabungan','Waktu Penugasan','Kontrak Payung'], req:true},
  {key:'bidang_sub_bidang', label:'Bidang / Sub Bidang', type:'text', span:2, ph:'cth. Pengadaan Barang - Mekanikal dan Elektrikal'},
  // VIII. Dokumen HPS
  {key:'no_hps', label:'No. HPS', type:'text'},
  {key:'tgl_hps', label:'Tgl. HPS', type:'date'},
  {key:'hps_harga_barang', label:'HPS — Harga Barang', type:'num'},
  {key:'hps_harga_jasa', label:'HPS — Harga Jasa', type:'num'},
  {key:'hps_total_tanpa_ppn', label:'HPS — Harga Total (Tanpa PPN)', type:'num', auto:'sum'},
  {key:'hps_total_dengan_ppn', label:'HPS — Harga Total (Dengan PPN)', type:'num', auto:'ppn'},
  // IX. Proses Pascakualifikasi
  {key:'no_eproc', label:'No. Eproc', type:'text', ph:'cth. EPROC-4230-20250319-4230-00001'},
  {key:'tgl_pengumuman', label:'Tgl. Pengumuman / Undangan', type:'date'},
  {key:'peserta_mendaftar', label:'Peserta Mendaftar', type:'select', options:PENYEDIA_1_20},
  {key:'bayar_rks', label:'Bayar RKS', type:'select', options:PENYEDIA_1_20},
  {key:'biaya_rks', label:'Biaya RKS', type:'num'},
  {key:'tgl_pendaftaran_download_awal', label:'Pendaftaran & Download RKS (Awal)', type:'date'},
  {key:'tgl_pendaftaran_download_akhir', label:'Pendaftaran & Download RKS (Akhir)', type:'date'},
  {key:'no_ba_penjelasan', label:'No. BA Penjelasan', type:'text'},
  {key:'tgl_ba_penjelasan', label:'Tgl. BA Penjelasan', type:'date'},
  {key:'tgl_upload_dok_awal', label:'Upload Dokumen Penawaran (Awal)', type:'date'},
  {key:'tgl_upload_dok_akhir', label:'Upload Dokumen Penawaran (Akhir)', type:'date'},
  {key:'no_ba_buka_s1', label:'No. BA Pembukaan Sampul Satu', type:'text', lock:'tender_cepat'},
  {key:'tgl_ba_buka_s1', label:'Tgl. BA Pembukaan Sampul Satu', type:'date', lock:'tender_cepat'},
  {key:'no_ba_eval_s1', label:'No. BA Evaluasi Sampul Satu', type:'text', lock:'tender_cepat'},
  {key:'tgl_ba_eval_s1', label:'Tgl. BA Evaluasi Sampul Satu', type:'date', lock:'tender_cepat'},
  {key:'no_ba_eval_kualifikasi', label:'No. BA Evaluasi Kualifikasi', type:'text', lock:'terbatas'},
  {key:'tgl_ba_eval_kualifikasi', label:'Tgl. BA Evaluasi Kualifikasi', type:'date', lock:'terbatas'},
  {key:'tgl_pemberitahuan_s1', label:'Tgl. Pemberitahuan Sampul Satu', type:'date', lock:'tender_cepat'},
  {key:'peserta_lulus_s1', label:'Peserta Lulus Sampul Satu', type:'select', options:PESERTA_LULUS_1_20, lock:'tender_cepat'},
  {key:'no_ba_buka_s2', label:'No. BA Pembukaan Sampul Dua', type:'text', lock:'s2'},
  {key:'tgl_ba_buka_s2', label:'Tgl. BA Pembukaan Sampul Dua', type:'date', lock:'s2'},
  {key:'no_ba_eval_s2', label:'No. BA Evaluasi Sampul Dua', type:'text', lock:'s2'},
  {key:'tgl_ba_eval_s2', label:'Tgl. BA Evaluasi Sampul Dua', type:'date', lock:'s2'},
  {key:'no_ba_bukti_kualifikasi', label:'No. BA Pembuktian Kualifikasi', type:'text', lock:'terbatas'},
  {key:'tgl_ba_bukti_kualifikasi', label:'Tgl. BA Pembuktian Kualifikasi', type:'date', lock:'terbatas'},
  {key:'no_ba_klarifikasi', label:'No. BA Klarifikasi & Negosiasi', type:'text'},
  {key:'tgl_ba_klarifikasi', label:'Tgl. BA Klarifikasi & Negosiasi', type:'date'},
  {key:'negosiasi_pelaksanaan', label:'Negosiasi Jangka Waktu Pelaksanaan', type:'text', span:2, ph:'Jangka Waktu yang disepakati (hari)'},
  {key:'no_ba_hasil', label:'No. BA Hasil Pengadaan', type:'text'},
  {key:'tgl_ba_hasil', label:'Tgl. BA Hasil Pengadaan', type:'date'},
  {key:'no_ucp', label:'No. Usulan Calon Pemenang', type:'text'},
  {key:'tgl_ucp', label:'Tgl. Usulan Calon Pemenang', type:'date'},
  {key:'no_penetapan_pemenang', label:'No. Penetapan Pemenang', type:'text'},
  {key:'tgl_penetapan_pemenang', label:'Tgl. Penetapan Pemenang', type:'date'},
  {key:'tgl_pengumuman_pemenang', label:'Tgl. Pengumuman Pemenang', type:'date'},
  {key:'jumlah_pemenang', label:'Jumlah Pemenang', type:'select', options:PESERTA_LULUS_1_20},
  {key:'tgl_sanggah_awal', label:'Masa Sanggah (Awal)', type:'date'},
  {key:'tgl_sanggah_akhir', label:'Masa Sanggah (Akhir)', type:'date'},
  {key:'status_sanggah', label:'Status Sanggah', type:'select', options:['Ada','Tidak Ada']},
  {key:'no_sppbj', label:'No. Penunjukan Penyedia', type:'text'},
  {key:'tgl_sppbj', label:'Tgl. Penunjukan Penyedia', type:'date'},
  {key:'no_cda', label:'No. Contract Discussion Agreement', type:'text', lock:'cda_tidak_ada'},
  {key:'tgl_cda', label:'Tgl. Contract Discussion Agreement', type:'date', lock:'cda_tidak_ada'},
  {key:'status_cda', label:'Status Contract Discussion Agreement', type:'select', options:['Ada','Tidak Ada'], ctrl:true},
  // X. Penawaran Harga
  {key:'no_penawaran', label:'No. Penawaran', type:'text'},
  {key:'tgl_penawaran', label:'Tgl. Penawaran', type:'date'},
  {key:'tawar_harga_barang', label:'Penawaran — Harga Barang', type:'num'},
  {key:'tawar_harga_jasa', label:'Penawaran — Harga Jasa', type:'num'},
  {key:'tawar_total_tanpa_ppn', label:'Penawaran — Harga Total (Tanpa PPN)', type:'num', auto:'sum'},
  {key:'tawar_total_dengan_ppn', label:'Penawaran — Harga Total (Dengan PPN)', type:'num', auto:'ppn'},
  // XI. Perjanjian/Kontrak
  {key:'no_kontrak', label:'No. Kontrak', type:'text', table:true},
  {key:'tgl_awal_kontrak', label:'Tgl. Awal Kontrak', type:'date', table:true},
  {key:'tgl_akhir_kontrak', label:'Tgl. Akhir Kontrak', type:'date'},
  {key:'kontrak_harga_barang', label:'Kontrak — Harga Barang', type:'num'},
  {key:'kontrak_harga_jasa', label:'Kontrak — Harga Jasa', type:'num'},
  {key:'kontrak_total_tanpa_ppn', label:'Kontrak — Harga Total (Tanpa PPN)', type:'num', auto:'sum'},
  {key:'kontrak_total_dengan_ppn', label:'Kontrak — Harga Total (Dengan PPN)', type:'num', auto:'ppn', table:true},
  // XII. Pengendali Pekerjaan
  {key:'direksi_pekerjaan', label:'Direksi Pekerjaan', type:'text'},
  {key:'pengawas_pekerjaan', label:'Pengawas Pekerjaan', type:'text'},
  {key:'pengawas_lapangan', label:'Pengawas Lapangan', type:'text'},
  // XIII. Data Penyedia
  {key:'perusahaan', label:'Perusahaan', type:'text', table:true, span:2},
  {key:'alamat', label:'Alamat', type:'text', span:2},
  {key:'nama_pic', label:'Nama PIC', type:'text'},
  {key:'no_telp_pic', label:'No. Telp PIC', type:'text'},
  {key:'npwp', label:'NPWP Perusahaan', type:'text'},
  {key:'email', label:'E-mail', type:'text'},
  {key:'pimpinan', label:'Pimpinan', type:'text', ph:'Nama pimpinan perusahaan'},
  {key:'jabatan', label:'Jabatan', type:'text'},
  {key:'bank', label:'Bank', type:'text'},
  {key:'no_rekening', label:'No. Rekening', type:'text'},
  {key:'pemilik_rekening', label:'Pemilik Rekening', type:'text'},
  // XIV. Jaminan Penawaran
  {key:'jp_dipersyaratkan', label:'Jaminan Penawaran Dipersyaratkan', type:'select', options:['Ada','Tidak Ada'], ctrl:true},
  {key:'jp_no', label:'No. Jaminan Penawaran', type:'text', lock:'jaminan_penawaran'},
  {key:'jp_tgl_terbit', label:'Tgl. Terbit Jaminan Penawaran', type:'date', lock:'jaminan_penawaran'},
  {key:'jp_tgl_berlaku', label:'Tgl. Berlaku Jaminan Penawaran', type:'date', lock:'jaminan_penawaran'},
  {key:'jp_tgl_berakhir', label:'Tgl. Berakhir Jaminan Penawaran', type:'date', lock:'jaminan_penawaran'},
  {key:'jp_nilai', label:'Nilai Jaminan Penawaran', type:'num', lock:'jaminan_penawaran'},
  {key:'jp_eguarantee', label:'Input E-Guarantee (Penawaran)', type:'select', options:['Sudah','Belum'], lock:'jaminan_penawaran'},
  {key:'jp_tindak_lanjut', label:'Tindak Lanjut (Penawaran)', type:'select', options:TINDAK_LANJUT_OPTS, lock:'jaminan_penawaran'},
  // XV. Jaminan Pelaksanaan
  {key:'jl_dipersyaratkan', label:'Jaminan Pelaksanaan Dipersyaratkan', type:'select', options:['Ada','Tidak Ada'], ctrl:true},
  {key:'jl_no', label:'No. Jaminan Pelaksanaan', type:'text', lock:'jaminan_pelaksanaan'},
  {key:'jl_tgl_terbit', label:'Tgl. Terbit Jaminan Pelaksanaan', type:'date', lock:'jaminan_pelaksanaan'},
  {key:'jl_tgl_berlaku', label:'Tgl. Berlaku Jaminan Pelaksanaan', type:'date', lock:'jaminan_pelaksanaan'},
  {key:'jl_tgl_berakhir', label:'Tgl. Berakhir Jaminan Pelaksanaan', type:'date', lock:'jaminan_pelaksanaan'},
  {key:'jl_nilai', label:'Nilai Jaminan Pelaksanaan', type:'num', lock:'jaminan_pelaksanaan'},
  {key:'jl_eguarantee', label:'Input E-Guarantee (Pelaksanaan)', type:'select', options:['Sudah','Belum'], lock:'jaminan_pelaksanaan'},
  {key:'jl_tindak_lanjut', label:'Tindak Lanjut (Pelaksanaan)', type:'select', options:TINDAK_LANJUT_OPTS, lock:'jaminan_pelaksanaan'},
  // XVI. Proses Prakualifikasi
  {key:'pk_undangan', label:'Undangan Kualifikasi', type:'date', lock:'prakualifikasi'},
  {key:'pk_download', label:'Download Dokumen Kualifikasi', type:'date', lock:'prakualifikasi'},
  {key:'pk_upload', label:'Upload Dokumen Aplikasi Kualifikasi', type:'date', lock:'prakualifikasi'},
  {key:'pk_no_ba_eval', label:'No. BA Evaluasi Dokumen', type:'text', lock:'prakualifikasi'},
  {key:'pk_tgl_ba_eval', label:'Tgl. BA Evaluasi Dokumen', type:'date', lock:'prakualifikasi'},
  {key:'pk_no_ba_bukti', label:'No. BA Pembuktian Kualifikasi', type:'text', lock:'prakualifikasi'},
  {key:'pk_tgl_ba_bukti', label:'Tgl. BA Pembuktian Kualifikasi', type:'date', lock:'prakualifikasi'},
  {key:'pk_no_penetapan', label:'No. Penetapan Kualifikasi', type:'text', lock:'prakualifikasi'},
  {key:'pk_tgl_penetapan', label:'Tgl. Penetapan Kualifikasi', type:'date', lock:'prakualifikasi'},
  {key:'pk_status_sanggah', label:'Status Sanggah Kualifikasi', type:'select', options:['Ada','Tidak Ada'], lock:'prakualifikasi', ctrl:true},
  {key:'pk_tgl_sanggah', label:'Tgl. Sanggah Kualifikasi', type:'date', lock:'pk_sanggah_tidak_ada'},
  // XVII. Status Pengadaan
  {key:'tahapan', label:'Tahapan/Proses', type:'select', options:['Penyusunan HPS','Proses Pengadaan','Tandatangan Kontrak','Terkontrak','Gagal/Batal'], table:true, ctrl:true},
  {key:'kendala', label:'Kendala', type:'text', span:2, lock:'gagal_batal'},
  {key:'tindak_lanjut', label:'Tindak Lanjut', type:'text', span:2, lock:'gagal_batal'},
  // XVIII. CSMS
  {key:'csms_jenis_dokumen', label:'Jenis Dokumen (CSMS)', type:'select', options:['Sertifikat','Berita Acara']},
  {key:'csms_level_risiko', label:'Level Risiko (CSMS)', type:'select', options:RISIKO_OPTS},
  {key:'csms_tgl_terbit', label:'Tgl. Terbit (CSMS)', type:'date'},
  {key:'csms_tgl_berakhir', label:'Tgl. Berakhir (CSMS)', type:'date'},
  // XIX. Data Lain-Lain
  {key:'norm_eproc', label:'Norm. Sistem Eproc', type:'text', ph:'cth. JASA-20160222-135'},
  {key:'nama_material_jasa', label:'Nama Material/Jasa', type:'text', span:2, ph:'cth. Komunikasi'},
  {key:'nomor_pr', label:'No. PR', type:'text', ph:'cth. 3002518656'},
  {key:'manajemen_kontrak', label:'Manajemen Kontrak', type:'select', options:['Sudah','Belum']},
];
const GROUPS_TENDER = [
  {title:'I. Informasi Pekerjaan', cols:3, keys:['tahun','nama_pekerjaan','lokasi_pekerjaan','jangka_waktu','bidang_pelaksana','level_risiko']},
  {title:'II. Nota Dinas Pengadaan', cols:3, keys:['no_nd_rendan','tgl_nd_rendan','no_nd_laksda','tgl_nd_laksda']},
  {title:'III. Dokumen Pengadaan', cols:3, keys:['tgl_terima_dok','ketersediaan_drp','no_drp','tgl_drp']},
  {title:'IV. Dokumen RKS', cols:3, keys:['no_rks','tgl_rks','addendum_rks','no_add_rks','tgl_add_rks']},
  {title:'V. Dokumen HPE', cols:3, keys:['no_hpe','tgl_hpe','hpe_harga_barang','hpe_harga_jasa','hpe_total_tanpa_ppn','hpe_total_dengan_ppn']},
  {title:'VI. Rencana Anggaran Biaya', cols:3, keys:['rab_harga_barang','rab_harga_jasa','rab_total_tanpa_ppn','rab_total_dengan_ppn','no_prk','no_anggaran','tgl_anggaran','jenis_anggaran']},
  {title:'VII. Kriteria Pengadaan', cols:3, keys:['jenis_pengadaan','metode_pengadaan','kualifikasi','metode_penyampaian','metode_evaluasi','jenis_kontrak','bidang_sub_bidang']},
  {title:'VIII. Dokumen HPS', cols:3, keys:['no_hps','tgl_hps','hps_harga_barang','hps_harga_jasa','hps_total_tanpa_ppn','hps_total_dengan_ppn']},
  {title:'IX. Proses Pascakualifikasi', cols:3, keys:['no_eproc','tgl_pengumuman','peserta_mendaftar','bayar_rks','biaya_rks','tgl_pendaftaran_download_awal','tgl_pendaftaran_download_akhir','no_ba_penjelasan','tgl_ba_penjelasan','tgl_upload_dok_awal','tgl_upload_dok_akhir','no_ba_buka_s1','tgl_ba_buka_s1','no_ba_eval_s1','tgl_ba_eval_s1','no_ba_eval_kualifikasi','tgl_ba_eval_kualifikasi','tgl_pemberitahuan_s1','peserta_lulus_s1','no_ba_buka_s2','tgl_ba_buka_s2','no_ba_eval_s2','tgl_ba_eval_s2','no_ba_bukti_kualifikasi','tgl_ba_bukti_kualifikasi','no_ba_klarifikasi','tgl_ba_klarifikasi','negosiasi_pelaksanaan','no_ba_hasil','tgl_ba_hasil','no_ucp','tgl_ucp','no_penetapan_pemenang','tgl_penetapan_pemenang','tgl_pengumuman_pemenang','jumlah_pemenang','tgl_sanggah_awal','tgl_sanggah_akhir','status_sanggah','no_sppbj','tgl_sppbj','no_cda','tgl_cda','status_cda']},
  {title:'X. Penawaran Harga', cols:3, pnw:true, keys:['no_penawaran','tgl_penawaran','tawar_harga_barang','tawar_harga_jasa','tawar_total_tanpa_ppn','tawar_total_dengan_ppn']},
  {title:'XI. Perjanjian/Kontrak', cols:3, pnw:true, keys:['no_kontrak','tgl_awal_kontrak','tgl_akhir_kontrak','kontrak_harga_barang','kontrak_harga_jasa','kontrak_total_tanpa_ppn','kontrak_total_dengan_ppn']},
  {title:'XII. Pengendali Pekerjaan', cols:3, keys:['direksi_pekerjaan','pengawas_pekerjaan','pengawas_lapangan']},
  {title:'XIII. Data Penyedia', cols:3, pnw:true, keys:['perusahaan','alamat','nama_pic','no_telp_pic','npwp','email','pimpinan','jabatan','bank','no_rekening','pemilik_rekening']},
  {title:'XIV. Jaminan Penawaran', cols:3, pnw:true, keys:['jp_dipersyaratkan','jp_no','jp_tgl_terbit','jp_tgl_berlaku','jp_tgl_berakhir','jp_nilai','jp_eguarantee','jp_tindak_lanjut']},
  {title:'XV. Jaminan Pelaksanaan', cols:3, pnw:true, keys:['jl_dipersyaratkan','jl_no','jl_tgl_terbit','jl_tgl_berlaku','jl_tgl_berakhir','jl_nilai','jl_eguarantee','jl_tindak_lanjut']},
  {title:'XVI. Proses Prakualifikasi', cols:3, keys:['pk_undangan','pk_download','pk_upload','pk_no_ba_eval','pk_tgl_ba_eval','pk_no_ba_bukti','pk_tgl_ba_bukti','pk_no_penetapan','pk_tgl_penetapan','pk_status_sanggah','pk_tgl_sanggah']},
  {title:'XVII. Status Pengadaan', cols:3, keys:['tahapan','kendala','tindak_lanjut']},
  {title:'XVIII. CSMS', cols:3, pnw:true, keys:['csms_jenis_dokumen','csms_level_risiko','csms_tgl_terbit','csms_tgl_berakhir']},
  {title:'XIX. Data Lain-Lain', cols:3, keys:['norm_eproc','nama_material_jasa','nomor_pr','manajemen_kontrak']},
];
/* #6: Field wajib Tender hanya untuk kelompok data I–II
   (I. Informasi Pekerjaan & II. Nota Dinas Pengadaan). Field lain tidak wajib.
   'tahun' dikecualikan karena dipindah ke baris judul (bukan field biasa). */
(function(){
  const reqKeys=new Set();
  [0,1].forEach(i=>{ (GROUPS_TENDER[i] && GROUPS_TENDER[i].keys || []).forEach(k=>reqKeys.add(k)); });
  reqKeys.delete('tahun');
  FIELDS_TENDER.forEach(f=>{ f.req = reqKeys.has(f.key); });
})();
/* Snapshot tata letak awal Tender (untuk "Kembalikan ke Default") */
const TENDER_SCHEMA_BASE = { fields: JSON.parse(JSON.stringify(FIELDS_TENDER)), groups: JSON.parse(JSON.stringify(GROUPS_TENDER)) };

/* Aturan kunci otomatis — dievaluasi terhadap nilai form yang sedang aktif */
const TERBATAS_SET = ['Tender Terbatas','Seleksi Terbatas','Penunjukan Langsung','Tender Cepat'];
const TENDER_LOCK_RULES = {
  add_rks:            r => r.addendum_rks !== 'Ada',
  tender_cepat:       r => r.metode_pengadaan === 'Tender Cepat',
  /* Semua field S2 terkunci bila Tender Cepat ATAU metode penyampaian 1 Tahap 1 Sampul */
  s2:                 r => r.metode_pengadaan === 'Tender Cepat' || r.metode_penyampaian === '1 Tahap 1 Sampul',
  /* #2: Evaluasi & Pembuktian Kualifikasi (Pascakualifikasi) tetap dapat diinput saat
     Penunjukan Langsung; tetap terkunci untuk metode terbatas lainnya & Tender Cepat. */
  terbatas:           r => TERBATAS_SET.includes(r.metode_pengadaan) && r.metode_pengadaan !== 'Penunjukan Langsung',
  jaminan_penawaran:  r => r.jp_dipersyaratkan !== 'Ada',
  jaminan_pelaksanaan:r => r.jl_dipersyaratkan !== 'Ada',
  prakualifikasi:     r => r.kualifikasi !== 'Prakualifikasi',
  /* Tgl. Sanggah Kualifikasi terkunci bila Pascakualifikasi ATAU Status Sanggah selain "Ada" */
  pk_sanggah_tidak_ada: r => r.kualifikasi !== 'Prakualifikasi' || r.pk_status_sanggah !== 'Ada',
  /* Kendala & Tindak Lanjut hanya terbuka bila Tahapan = Gagal/Batal */
  gagal_batal:        r => r.tahapan !== 'Gagal/Batal',
  drp_tidak_ada:      r => r.ketersediaan_drp !== 'Ada',
  /* No. & Tgl. CDA terkunci bila Status CDA selain "Ada" */
  cda_tidak_ada:      r => r.status_cda !== 'Ada',
};
function isLockedTender(field, vals){
  if(!field.lock) return false;
  const rule = TENDER_LOCK_RULES[field.lock];
  return rule ? rule(vals) : false;
}

/* ---- Label dinamis Tender ----
   Bila Metode Penyampaian = "1 Tahap 1 Sampul", istilah "Sampul Satu" pada
   BA Pembukaan & BA Evaluasi berubah menjadi "Penawaran"
   (mis. "No. BA Pembukaan Sampul Satu" -> "No. BA Pembukaan Penawaran"). */
const TENDER_S1_PENAWARAN_KEYS = ['no_ba_buka_s1','tgl_ba_buka_s1','no_ba_eval_s1','tgl_ba_eval_s1'];
function tenderFieldLabel(field, vals){
  let label = field.label;
  if(field && TENDER_S1_PENAWARAN_KEYS.includes(field.key)
     && vals && vals.metode_penyampaian === '1 Tahap 1 Sampul'){
    label = label.replace(/Sampul Satu/gi, 'Penawaran');
  }
  return label;
}
/* Seksi "Proses Prakualifikasi" — dikenali dari key pk_* (pk_undangan) */
function isPrakualifikasiSection(g){
  return !!(g && Array.isArray(g.keys) && g.keys.includes('pk_undangan'));
}

/* ---- Store Tender (Supabase) ---- */
const TABLE_TENDER = 'tender';
const STORE_TENDER = 'monitoring_tender_up3masohi';
let records_tender = [];
let editingIdTender = null;
let tenderReturnView = 'dashboard';
let seqTender = 1;
let useSupaTender = USE_SUPABASE;
function idTender(){ return 't'+(seqTender++)+'_'+Date.now().toString(36); }
function tenderInputId(key){ return 't_'+key; }

function cleanForDbTender(rec){
  const o={};
  FIELDS_TENDER.forEach(f=>{ o[f.key]=cleanFieldValue(f, rec); });
  // Simpan struktur multi-penyedia & field multi-nilai sebagai JSON (kolom jsonb)
  o.penyedia_layers = Array.isArray(rec.penyedia_layers) ? rec.penyedia_layers : null;
  o.bidang_sub_bidang_list = Array.isArray(rec.bidang_sub_bidang_list) ? rec.bidang_sub_bidang_list : null;
  o.no_sppbj_list = Array.isArray(rec.no_sppbj_list) ? rec.no_sppbj_list : null;
  return o;
}
function lsListTender(){ return []; }             /* penyimpanan lokal dinonaktifkan */
function lsPersistTender(arr){ /* no-op */ }        /* data Tender hanya di Supabase */

const Store_TENDER = {
  async list(){
    const {data,error}=await db.from(TABLE_TENDER).select('*').order('created_at',{ascending:false});
    if(error) throw error;
    return (data||[]).map(r=>{
      FIELDS_TENDER.forEach(f=>{ if(f.type==='num'&&r[f.key]!=null)r[f.key]=Number(r[f.key]); if(r[f.key]==null)r[f.key]=''; });
      if(!Array.isArray(r.penyedia_layers)) r.penyedia_layers = r.penyedia_layers || undefined;
      if(r.bidang_sub_bidang_list==null) delete r.bidang_sub_bidang_list;
      if(r.no_sppbj_list==null) delete r.no_sppbj_list;
      return r;
    });
  },
  async create(rec){
    const {data,error}=await db.from(TABLE_TENDER).insert(cleanForDbTender(rec)).select(); if(error) throw error; return data[0];
  },
  async bulkCreate(arr){
    const {data,error}=await db.from(TABLE_TENDER).insert(arr.map(cleanForDbTender)).select(); if(error) throw error; return data;
  },
  async update(rid,rec){
    const {error}=await db.from(TABLE_TENDER).update(cleanForDbTender(rec)).eq('id',rid); if(error) throw error;
  },
  async remove(rid){
    const {error}=await db.from(TABLE_TENDER).delete().eq('id',rid); if(error) throw error;
  },
  async removeAll(){
    const {error}=await db.from(TABLE_TENDER).delete().not('id','is',null); if(error) throw error;
  }
};

function seedSamplesTender(){
  seqTender=3;
  return [
    {id:idTender(),nama_pekerjaan:'Pembangunan Jaringan SUTM Wilayah Masohi',lokasi_pekerjaan:'Masohi & sekitarnya',jangka_waktu:'180 hari kalender',bidang_pelaksana:'Jaringan dan Konstruksi',level_risiko:'Tinggi',jenis_pengadaan:'Pekerjaan Konstruksi',metode_pengadaan:'Tender Terbuka',kualifikasi:'Pascakualifikasi',jenis_kontrak:'Lumsum',addendum_rks:'Tidak Ada',jp_dipersyaratkan:'Iya',jl_dipersyaratkan:'Iya',bidang_sub_bidang:'Konstruksi Jaringan Distribusi / SUTM',bidang_sub_bidang_list:['Konstruksi Jaringan Distribusi / SUTM','Konstruksi Jaringan Distribusi / SUTR'],no_sppbj:'SPPBJ-031/UP3MSH/2025',tgl_sppbj:'2025-04-01',no_kontrak:'TDR-007/UP3MSH/2025',tgl_awal_kontrak:'2025-04-10',tgl_akhir_kontrak:'2025-10-07',kontrak_total_dengan_ppn:2750000000,perusahaan:'PT Karya Listrik Maluku',nama_pic:'Andi Saputra',jp_no:'JP-1182/2025',jl_no:'JL-2204/2025',tahapan:'Terkontrak',manajemen_kontrak:'Sudah',
      penyedia_layers:[
        {no_penawaran:'PNW-001/KLM/2025',tgl_penawaran:'2025-03-20',tawar_harga_barang:1800000000,tawar_harga_jasa:700000000,tawar_total_tanpa_ppn:2500000000,tawar_total_dengan_ppn:2750000000,bidang_sub_bidang:'Konstruksi Jaringan Distribusi / SUTM',no_sppbj:'SPPBJ-031/UP3MSH/2025',tgl_sppbj:'2025-04-01',no_kontrak:'TDR-007/UP3MSH/2025',tgl_awal_kontrak:'2025-04-10',tgl_akhir_kontrak:'2025-10-07',kontrak_total_tanpa_ppn:2500000000,kontrak_total_dengan_ppn:2750000000,perusahaan:'PT Karya Listrik Maluku',alamat:'Jl. Geser No. 12, Masohi',nama_pic:'Andi Saputra',no_telp_pic:'0812-4455-7788',npwp:'01.234.567.8-941.000',email:'pengadaan@karyalistrik.co.id',pimpinan:'Ir. Rudi Hartono',jabatan:'Direktur Utama',bank:'Bank Mandiri',no_rekening:'142-00-1234567-8',pemilik_rekening:'PT Karya Listrik Maluku',jp_dipersyaratkan:'Iya',jp_no:'JP-1182/2025',jp_tgl_terbit:'2025-03-18',jp_tgl_berlaku:'2025-03-18',jp_tgl_berakhir:'2025-06-18',jp_nilai:55000000,jp_eguarantee:'Sudah',jp_tindak_lanjut:'Dikembalikan',jl_dipersyaratkan:'Iya',jl_no:'JL-2204/2025',jl_tgl_terbit:'2025-04-08',jl_tgl_berlaku:'2025-04-08',jl_tgl_berakhir:'2025-10-14',jl_nilai:137500000,jl_eguarantee:'Sudah',csms_jenis_dokumen:'Sertifikat CSMS',csms_level_risiko:'Tinggi',csms_tgl_terbit:'2025-01-15',csms_tgl_berakhir:'2027-01-15'},
        {no_penawaran:'PNW-014/MJU/2025',tgl_penawaran:'2025-03-21',tawar_harga_barang:1850000000,tawar_harga_jasa:740000000,tawar_total_tanpa_ppn:2590000000,tawar_total_dengan_ppn:2849000000,bidang_sub_bidang:'Konstruksi Jaringan Distribusi / SUTM-SUTR',no_sppbj:'',tgl_sppbj:'',perusahaan:'PT Maju Jaya Utama',alamat:'Jl. Trans Seram KM 4, Masohi',nama_pic:'Budi Santoso',no_telp_pic:'0813-9911-2233',npwp:'02.876.543.2-941.000',email:'tender@majujaya.co.id',pimpinan:'H. Slamet Riyadi',jabatan:'Direktur',bank:'Bank BRI',no_rekening:'0392-01-009988-50-1',pemilik_rekening:'PT Maju Jaya Utama',jp_dipersyaratkan:'Iya',jp_no:'JP-1190/2025',jp_tgl_terbit:'2025-03-19',jp_tgl_berlaku:'2025-03-19',jp_tgl_berakhir:'2025-06-19',jp_nilai:55000000,jp_eguarantee:'Sudah',jp_tindak_lanjut:'Dicairkan',csms_jenis_dokumen:'Sertifikat CSMS',csms_level_risiko:'Moderat',csms_tgl_terbit:'2024-11-02',csms_tgl_berakhir:'2026-11-02'}
      ]},
    {id:idTender(),nama_pekerjaan:'Pengadaan Trafo Distribusi 100 kVA',lokasi_pekerjaan:'Gudang UP3 Masohi',jangka_waktu:'90 hari kalender',bidang_pelaksana:'Transaksi Energi Listrik',level_risiko:'Moderat',jenis_pengadaan:'Barang',metode_pengadaan:'Tender Cepat',kualifikasi:'Pascakualifikasi',jenis_kontrak:'Lumsum',addendum_rks:'Tidak Ada',jp_dipersyaratkan:'Tidak',jl_dipersyaratkan:'Iya',no_kontrak:'',perusahaan:'PT Sumber Trafo Nusantara',tahapan:'Proses Pengadaan',manajemen_kontrak:'Belum'},
  ];
}

async function refreshDataTender(){
  try{ records_tender = await Store_TENDER.list(); }
  catch(err){ console.error(err); records_tender = records_tender||[]; toast('Gagal memuat data Tender dari Supabase: '+errMsg(err),'err'); }
  renderTableTender();
  if(document.getElementById('dash-filter-jenis')?.value==='tender') renderDashboard();
}

/* ============ Layer multi-penyedia (data per penyedia) ============ */
/* Seksi yang sepenuhnya milik tiap penyedia (ditampilkan via tab navigasi) */
const PENYEDIA_SECTION_TITLES=['X. Penawaran Harga','XI. Perjanjian/Kontrak','XIII. Data Penyedia','XIV. Jaminan Penawaran','XV. Jaminan Pelaksanaan','XVIII. CSMS'];
/* Field per-penyedia yang berada di seksi campuran, ditampilkan BERTUMPUK
   (N kotak sesuai jumlah penyedia). Saat ini: No. SPPBJ. */
const PENYEDIA_STACK_FIELDS=['no_sppbj'];
/* Field multi-nilai yang BERDIRI SENDIRI (tombol +Tambah/Hapus sendiri,
   tidak terkait jumlah penyedia). Tgl. SPPBJ tetap nilai tunggal. */
const INDEP_MULTI_KEYS=['bidang_sub_bidang'];
const MAX_PENYEDIA=30;
function isPenyediaSection(g){ return g && (g.pnw===true || PENYEDIA_SECTION_TITLES.includes(g.title)); }
/* Kumpulan seluruh key per-penyedia (seksi tab + field bertumpuk) */
const PENYEDIA_KEYS=(()=>{ const s=new Set(); GROUPS_TENDER.forEach(g=>{ if(isPenyediaSection(g)) g.keys.forEach(k=>s.add(k)); }); PENYEDIA_STACK_FIELDS.forEach(k=>s.add(k)); return [...s]; })();
/* Kolom yang ditumpuk dalam satu sel Excel (per penyedia ATAU multi-nilai independen) */
function isStackKey(key){ return PENYEDIA_KEYS.includes(key) || INDEP_MULTI_KEYS.includes(key); }

let penyediaLayers=[penyediaEmpty()];
let penyediaActive=0;
function penyediaEmpty(){ const o={}; PENYEDIA_KEYS.forEach(k=>o[k]=''); return o; }
/* baca input seksi tab (lewati field bertumpuk yang ditangani terpisah) */
function readPenyediaInputs(){
  const o={};
  PENYEDIA_KEYS.forEach(k=>{
    if(PENYEDIA_STACK_FIELDS.includes(k)) return;
    const f=FIELDS_TENDER.find(x=>x.key===k);
    const el=document.getElementById(tenderInputId(k));
    let v=el?el.value.trim():'';
    if(f&&f.type==='num') v=parseRupiah(v);
    o[k]=v;
  });
  ['tawar','kontrak'].forEach(p=>{ if(FIELDS_TENDER.some(f=>f.key===p+'_total_tanpa_ppn'&&f.auto==='sum')){ const b=Number(o[p+'_harga_barang'])||0,j=Number(o[p+'_harga_jasa'])||0; o[p+'_total_tanpa_ppn']=(b+j)>0?(b+j):''; } });
  ['tawar','kontrak'].forEach(p=>{ if(FIELDS_TENDER.some(f=>f.key===p+'_total_dengan_ppn'&&f.auto==='ppn')){ const base=Number(o[p+'_total_tanpa_ppn'])||0; o[p+'_total_dengan_ppn']=base>0?ppnFromBase(base):''; } });
  return o;
}
function writePenyediaInputs(o){
  PENYEDIA_KEYS.forEach(k=>{ if(PENYEDIA_STACK_FIELDS.includes(k)) return; const f=FIELDS_TENDER.find(x=>x.key===k); const el=document.getElementById(tenderInputId(k)); if(el) el.value=(f&&f.type==='num')?rupiahInputText(o&&o[k]):((o&&o[k]!=null)?o[k]:''); });
  computeAutoTotal('tawar', tenderInputId);
  computeAutoTotal('kontrak', tenderInputId);
}
/* simpan input aktif (seksi tab) + seluruh kotak field bertumpuk ke penyediaLayers */
function commitActivePenyedia(){
  if(penyediaLayers[penyediaActive]) Object.assign(penyediaLayers[penyediaActive], readPenyediaInputs());
  PENYEDIA_STACK_FIELDS.forEach(k=>readStackField(k));
}
/* ---- Field per-penyedia bertumpuk (mis. No. SPPBJ) ---- */
function stackListEl(key){ return document.getElementById('stacklist_'+key); }
function renderStackField(key){
  const el=stackListEl(key); if(!el) return;
  const multi=penyediaLayers.length>1;
  el.innerHTML='';
  penyediaLayers.forEach((lay,i)=>{
    const row=document.createElement('div'); row.className='indep-row';
    if(multi){ const no=document.createElement('b'); no.className='stack-input-no'; no.textContent=(i+1)+'.'; row.appendChild(no); }
    const inp=document.createElement('input'); inp.type='text'; inp.value=(lay&&lay[key]!=null)?lay[key]:''; inp.setAttribute('data-idx',i);
    row.appendChild(inp); el.appendChild(row);
  });
}
function renderStackFields(){ PENYEDIA_STACK_FIELDS.forEach(k=>renderStackField(k)); }
function readStackField(key){
  const el=stackListEl(key); if(!el) return;
  el.querySelectorAll('input').forEach(inp=>{ const i=+inp.getAttribute('data-idx'); if(penyediaLayers[i]) penyediaLayers[i][key]=inp.value.trim(); });
}
/* ---- Tab navigasi + sinkron dropdown Jumlah Penyedia ---- */
function renderPenyediaTabs(){
  const n=penyediaLayers.length, multi=n>1;
  if(penyediaActive>n-1) penyediaActive=0;
  document.querySelectorAll('[data-penyedia-bar]').forEach(bar=>{ bar.style.display=multi?'flex':'none'; });
  document.querySelectorAll('.pnw-tabs[data-penyedia-tabs]').forEach(tabs=>{
    tabs.innerHTML=multi?penyediaLayers.map((_,i)=>
      `<button type="button" class="pnw-tab${i===penyediaActive?' active':''}" onclick="switchPenyediaLayer(${i})" title="Penyedia ${i+1}"><span class="pnw-no">${i+1}</span></button>`
    ).join(''):'';
  });
  document.querySelectorAll('.pp-tag').forEach(t=>{ t.style.display=multi?'inline-flex':'none'; });
  const sel=document.getElementById('tender-jumlah-penyedia'); if(sel && String(n)!==sel.value) sel.value=String(n);
}
function switchPenyediaLayer(i){
  if(i===penyediaActive) return;
  commitActivePenyedia();
  penyediaActive=i;
  writePenyediaInputs(penyediaLayers[i]);
  renderPenyediaTabs();
  applyLocksTender();
}
/* Atur jumlah penyedia dari dropdown */
function setJumlahPenyedia(val){
  let n=parseInt(val,10); if(isNaN(n)||n<1)n=1; if(n>MAX_PENYEDIA)n=MAX_PENYEDIA;
  commitActivePenyedia();
  if(n>penyediaLayers.length){ while(penyediaLayers.length<n) penyediaLayers.push(penyediaEmpty()); }
  else if(n<penyediaLayers.length){ penyediaLayers.length=n; }
  if(penyediaActive>n-1) penyediaActive=0;
  writePenyediaInputs(penyediaLayers[penyediaActive]);
  renderStackFields();
  renderPenyediaTabs();
  applyLocksTender();
}
function setPenyediaLayers(arr){
  penyediaLayers=(Array.isArray(arr)&&arr.length)
    ? arr.map(o=>{ const e=penyediaEmpty(); PENYEDIA_KEYS.forEach(k=>{ if(o&&o[k]!=null)e[k]=o[k]; }); return e; })
    : [penyediaEmpty()];
  penyediaActive=0;
  writePenyediaInputs(penyediaLayers[0]);
  renderStackFields();
  renderPenyediaTabs();
}
/* Bangun layer penyedia dari sebuah record (sekaligus migrasi dari penawaran_layers lama) */
function penyediaLayersFromRecord(rec){
  if(Array.isArray(rec.penyedia_layers)&&rec.penyedia_layers.length) return rec.penyedia_layers;
  if(Array.isArray(rec.penawaran_layers)&&rec.penawaran_layers.length){
    const PNW=['no_penawaran','tgl_penawaran','tawar_harga_barang','tawar_harga_jasa','tawar_total_tanpa_ppn','tawar_total_dengan_ppn'];
    return rec.penawaran_layers.map((p,idx)=>{
      const e=penyediaEmpty();
      PNW.forEach(k=>{ if(p[k]!=null)e[k]=p[k]; });
      if(idx===0) PENYEDIA_KEYS.forEach(k=>{ if(e[k]===''&&rec[k]!=null)e[k]=rec[k]; });
      return e;
    });
  }
  const e=penyediaEmpty(); PENYEDIA_KEYS.forEach(k=>{ if(rec[k]!=null)e[k]=rec[k]; });
  return [e];
}
/* HTML bar tab penyedia (navigasi saja; tampil hanya bila >1 penyedia) */
function penyediaBarHTML(){
  return `<div class="pnw-bar" data-penyedia-bar style="display:none">
    <span class="pnw-bar-label">Penyedia:</span>
    <div class="pnw-tabs" data-penyedia-tabs></div>
  </div>`;
}
/* HTML field per-penyedia bertumpuk (mis. No. SPPBJ) — jumlah kotak = jumlah penyedia */
function stackFieldHTML(f){
  const pxw=fieldPxStyle(f);
  const req=f.req?' <span class="req">*</span>':'';
  return `<div class="field${pxw.cls}"${pxw.style} id="wrap_${tenderInputId(f.key)}">
    <label>${f.label}${req}</label>
    <div class="indep-list" id="stacklist_${f.key}"></div>
  </div>`;
}
/* Nilai sel Excel untuk field per-penyedia: bila >1 penyedia, semua nilai
   ditumpuk dalam SATU sel dipisah baris baru (gaya Alt+Enter). */
function penyediaCellValue(rec,key,ftype){
  const layers=penyediaLayersFromRecord(rec);
  const totalOf=(l)=>{ const m=key.match(/^(.*)_total_tanpa_ppn$/); if(!m) return null; const p=m[1]; return (parseRupiah(l[p+'_harga_barang'])||0)+(parseRupiah(l[p+'_harga_jasa'])||0); };
  const ppnOf=(l)=>{ const m=key.match(/^(.*)_total_dengan_ppn$/); if(!m) return null; const p=m[1]; const base=(parseRupiah(l[p+'_harga_barang'])||0)+(parseRupiah(l[p+'_harga_jasa'])||0); return base>0?ppnFromBase(base):0; };
  const isAutoTotal=/_total_tanpa_ppn$/.test(key);
  const isPpnTotal=/_total_dengan_ppn$/.test(key);
  if(layers.length<=1){
    if(isAutoTotal){ const t=totalOf(layers[0]||rec); return t>0?t:''; }
    if(isPpnTotal){ const t=ppnOf(layers[0]||rec); return t>0?t:''; }
    let v=rec[key]; if(v===''||v==null) return '';
    return ftype==='date'?fmtDate(v):(ftype==='num'?Number(v):v);
  }
  if(isAutoTotal) return layers.map(l=>{ const t=totalOf(l); return t>0?String(t):''; }).join('\n');
  if(isPpnTotal) return layers.map(l=>{ const t=ppnOf(l); return t>0?String(t):''; }).join('\n');
  return layers.map(l=>{ let v=l[key]; if(v==null||v==='') return ''; return ftype==='date'?fmtDate(v):String(v); }).join('\n');
}
/* Tampilan sel tabel layar untuk kolom per-penyedia: tiap penyedia satu baris. */
function stackPenyediaHtml(rec,key){
  const layers=penyediaLayersFromRecord(rec);
  const vals=layers.map(l=>(l[key]!=null&&l[key]!=='')?String(l[key]):'—');
  if(vals.length<=1) return vals[0]||'—';
  return vals.map((v,i)=>`<span class="stack-line"><b class="stack-no">${i+1}.</b> ${v}</span>`).join('');
}
/* Versi nilai (Rp) untuk field angka per-penyedia (mis. Nilai Kontrak dengan PPN) */
function stackPenyediaRupiah(rec,key){
  const layers=penyediaLayersFromRecord(rec);
  const vals=layers.map(l=>{ const n=Number(l[key])||0; return n>0?(rupiah(n)||'—'):'—'; });
  if(vals.length<=1) return vals[0]||'—';
  return vals.map((v,i)=>`<span class="stack-line"><b class="stack-no">${i+1}.</b> ${v}</span>`).join('');
}

/* ===== Field multi-nilai INDEPENDEN (Bidang/Sub Bidang, No. SPPBJ) =====
   Tiap field punya daftar isian sendiri, dengan tombol +Tambah/Hapus di kanan judul.
   Tidak terkait jumlah penyedia dan tidak saling memengaruhi antar field. */
function indepListEl(key){ return document.getElementById('indeplist_'+key); }
function makeIndepRow(val){
  const row=document.createElement('div'); row.className='indep-row';
  const inp=document.createElement('input'); inp.type='text'; inp.value=(val!=null?val:'');
  inp.placeholder='cth. Pengadaan Barang - Mekanikal dan Elektrikal';
  row.appendChild(inp); return row;
}
function setIndepValues(key,arr){
  const el=indepListEl(key); if(!el) return;
  el.innerHTML='';
  const vals=(Array.isArray(arr)&&arr.length)?arr:[''];
  vals.forEach(v=>el.appendChild(makeIndepRow(v)));
  updateIndepDelState(key);
}
function indepValues(key){
  const el=indepListEl(key); if(!el) return [];
  let arr=[...el.querySelectorAll('input')].map(i=>i.value.trim());
  while(arr.length>1 && arr[arr.length-1]==='') arr.pop();
  return arr;
}
function addIndepRow(key){
  const el=indepListEl(key); if(!el) return;
  const row=makeIndepRow(''); el.appendChild(row);
  updateIndepDelState(key); row.querySelector('input').focus();
}
function removeIndepRow(key){
  const el=indepListEl(key); if(!el) return;
  const rows=el.querySelectorAll('.indep-row');
  if(rows.length<=1){ toast('Minimal harus ada 1 isian','warn'); return; }
  rows[rows.length-1].remove();
  updateIndepDelState(key);
}
function updateIndepDelState(key){
  const btn=document.getElementById('indepdel_'+key); const el=indepListEl(key);
  if(btn&&el) btn.disabled=el.querySelectorAll('.indep-row').length<=1;
}
/* HTML satu field multi-nilai independen */
function indepFieldHTML(f){
  const pxw=fieldPxStyle(f);
  const req=f.req?' <span class="req">*</span>':'';
  return `<div class="field${pxw.cls} indep-field field-wide15"${pxw.style} id="wrap_${tenderInputId(f.key)}">
    <div class="indep-head">
      <label>${f.label}${req}</label>
      <div class="indep-actions">
        <button type="button" class="indep-add" onclick="addIndepRow('${f.key}')" title="Tambah isian">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M12 5v14M5 12h14"/></svg>Tambah
        </button>
        <button type="button" class="indep-del-btn" id="indepdel_${f.key}" onclick="removeIndepRow('${f.key}')" title="Hapus isian terakhir">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>Hapus
        </button>
      </div>
    </div>
    <div class="indep-list" id="indeplist_${f.key}"></div>
  </div>`;
}
/* Nilai sel Excel untuk field multi-nilai independen */
function indepCellValue(rec,key){
  const list=Array.isArray(rec[key+'_list'])?rec[key+'_list'].filter(x=>x!=null&&x!==''):[];
  if(list.length>1) return list.join('\n');
  let v=list.length?list[0]:rec[key];
  return (v==null||v==='')?'':v;
}

/* ---- Bangun form input Tender dari FIELDS_TENDER/GROUPS_TENDER ---- */
const TENDER_SECTION_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>';
const LOCK_NOTE='<span class="lock-overlay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Data terkunci</span>';
const AUTO_NOTE='<span class="lock-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="width:10px;height:10px"><path d="M5 12h14M12 5v14"/></svg>Otomatis (Barang + Jasa)</span>';
const PPN_NOTE='<span class="lock-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="width:10px;height:10px"><path d="M5 12h14M12 5v14"/></svg>Otomatis (Tanpa PPN × 111%)</span>';
function buildFormTender(){
  const cont=document.getElementById('form-tender-fields'); if(!cont) return;
  let html='';
  GROUPS_TENDER.forEach((g,gi)=>{
    const isPnw=isPenyediaSection(g);
    const cols=pynGroupCols(g);
    let titleExtra=isPnw?'<span class="pp-tag">per penyedia</span>':'';
    if(gi===0){
      // Kelompok I. Informasi Pekerjaan: Tahun di kiri, Jumlah Penyedia di kanan (gap 30px)
      let yearHtml = g.keys.includes('tahun') ? yearControlHTML(tenderInputId('tahun')) : '';
      let opts=''; for(let i=1;i<=MAX_PENYEDIA;i++){ opts+=`<option value="${i}"${i===1?' selected':''}>${i} Penyedia</option>`; }
      const jpHtml=`<div class="jp-control"><label for="tender-jumlah-penyedia">Jumlah Penyedia</label><select id="tender-jumlah-penyedia" onchange="setJumlahPenyedia(this.value)">${opts}</select></div>`;
      titleExtra+=`<div class="title-controls">${yearHtml}${jpHtml}</div>`;
    }
    html+=`<div class="form-card"><div class="form-section-title">${TENDER_SECTION_ICON}${g.title}${titleExtra}</div>`;
    if(isPnw) html+=penyediaBarHTML();
    html+=`<div class="form-flow" style="--cols:${cols}">`;
    g.keys.forEach(k=>{
      if(gi===0 && k==='tahun') return; // Tahun sudah dipindah ke baris judul
      const f=FIELDS_TENDER.find(x=>x.key===k); if(!f) return;
      if(INDEP_MULTI_KEYS.includes(k)){ html+=indepFieldHTML(f); return; }
      if(PENYEDIA_STACK_FIELDS.includes(k)){ html+=stackFieldHTML(f); return; }
      const id=tenderInputId(k);
      const pxw=fieldPxStyle(f);
      const req=f.req?' <span class="req">*</span>':'';
      const onCtrl=f.ctrl?' onchange="applyLocksTender()"':'';
      const ph=f.ph?` placeholder="${f.ph}"`:'';
      let ctl='';
      if(f.type==='select') ctl=`<select id="${id}"${onCtrl}><option value="">— Pilih —</option>${(f.options||[]).map(o=>`<option>${o}</option>`).join('')}</select>`;
      else if(f.type==='num'){
        if(f.auto==='sum'||f.auto==='ppn') ctl=`<input id="${id}" type="text" inputmode="numeric" placeholder="Rp" readonly>`;
        else if(/_harga_(barang|jasa)$/.test(f.key)){ const pfx=f.key.replace(/_harga_(barang|jasa)$/,''); ctl=`<input id="${id}" type="text" inputmode="numeric" placeholder="Rp" oninput="onHargaInput(this,'${pfx}','tender')"${onCtrl}>`; }
        else ctl=`<input id="${id}" type="text" inputmode="numeric" placeholder="Rp" oninput="onRupiahInput(this)"${onCtrl}>`;
      }
      else if(f.type==='date') ctl=`<input id="${id}" type="date"${onCtrl}>`;
      else ctl=`<input id="${id}" type="text"${ph}${onCtrl}>`;
      const note=f.auto==='sum'?AUTO_NOTE:(f.auto==='ppn'?PPN_NOTE:(f.lock?LOCK_NOTE:''));
      const labelText=`<span class="fld-label-text" data-fk="${f.key}">${tenderFieldLabel(f,{})}</span>`;
      html+=`<div class="field${pxw.cls}"${pxw.style} id="wrap_${id}"><label>${labelText}${req}${note?' ':''}${note}</label>${ctl}</div>`;
    });
    html+=`</div></div>`;
  });
  cont.innerHTML=html;
  penyediaLayers=[penyediaEmpty()]; penyediaActive=0; renderStackFields(); renderPenyediaTabs();
  INDEP_MULTI_KEYS.forEach(k=>setIndepValues(k,['']));
}

/* Terapkan kunci otomatis sesuai nilai field pengendali */
function readTenderFlat(){ const rec={}; FIELDS_TENDER.forEach(f=>{ const el=document.getElementById(tenderInputId(f.key)); let v=el?el.value.trim():''; if(f.type==='num') v=parseRupiah(v); rec[f.key]=v; }); ['hpe','rab','hps'].forEach(p=>{ if(FIELDS_TENDER.some(f=>f.key===p+'_total_tanpa_ppn'&&f.auto==='sum')){ const b=Number(rec[p+'_harga_barang'])||0,j=Number(rec[p+'_harga_jasa'])||0; rec[p+'_total_tanpa_ppn']=(b+j)>0?(b+j):''; } }); FIELDS_TENDER.forEach(f=>{ if(f.auto==='ppn'){ const base=Number(rec[f.key.replace(/_total_dengan_ppn$/,'_total_tanpa_ppn')])||0; rec[f.key]=base>0?ppnFromBase(base):''; } }); return rec; }
function applyLocksTender(){
  const vals=readTenderFlat();
  FIELDS_TENDER.forEach(f=>{
    if(!f.lock) return;
    const el=document.getElementById(tenderInputId(f.key));
    const wrap=document.getElementById('wrap_'+tenderInputId(f.key));
    if(!el||!wrap) return;
    const locked=isLockedTender(f,vals);
    el.disabled=locked;
    wrap.classList.toggle('locked',locked);
    if(locked){ el.value=''; wrap.classList.remove('field-error'); }
  });
  refreshTenderDynamicLabels(vals);
}
/* Perbarui label BA Sampul Satu -> BA Penawaran mengikuti Metode Penyampaian */
function refreshTenderDynamicLabels(vals){
  const cont=document.getElementById('form-tender-fields'); if(!cont) return;
  TENDER_S1_PENAWARAN_KEYS.forEach(k=>{
    const f=FIELDS_TENDER.find(x=>x.key===k); if(!f) return;
    const span=cont.querySelector('.fld-label-text[data-fk="'+k+'"]');
    if(span) span.textContent=tenderFieldLabel(f,vals);
  });
}

/* ---- Form helpers Tender ---- */
function clearFormTender(){ FIELDS_TENDER.forEach(f=>{ const el=document.getElementById(tenderInputId(f.key)); if(el){el.value='';if(f.auto!=='sum')el.disabled=false;} const w=document.getElementById('wrap_'+tenderInputId(f.key)); if(w){w.classList.remove('locked');w.classList.remove('field-error');} }); ['hpe','rab','hps'].forEach(p=>computeAutoTotal(p,tenderInputId)); setPenyediaLayers([]); INDEP_MULTI_KEYS.forEach(k=>setIndepValues(k,[''])); }
function fillFormTender(rec){ FIELDS_TENDER.forEach(f=>{ const el=document.getElementById(tenderInputId(f.key)); if(el)el.value = f.type==='num' ? rupiahInputText(rec[f.key]) : (rec[f.key]!=null ? rec[f.key] : ''); });
  setPenyediaLayers(penyediaLayersFromRecord(rec));
  /* migrasi data lama: No. SPPBJ yang dulu independen -> per penyedia */
  if(Array.isArray(rec.no_sppbj_list) && rec.no_sppbj_list.some(v=>v) && !penyediaLayers.some(l=>l.no_sppbj)){
    rec.no_sppbj_list.forEach((v,i)=>{ if(penyediaLayers[i]) penyediaLayers[i].no_sppbj=v||''; });
    renderStackField('no_sppbj');
  }
  INDEP_MULTI_KEYS.forEach(k=>{ const list=(Array.isArray(rec[k+'_list'])&&rec[k+'_list'].length)?rec[k+'_list']:((rec[k]!=null&&rec[k]!=='')?[rec[k]]:['']); setIndepValues(k,list); });
  ['hpe','rab','hps'].forEach(p=>computeAutoTotal(p,tenderInputId));
  applyLocksTender(); }
function readFormTender(){ const rec=readTenderFlat();
  commitActivePenyedia();
  const layers=penyediaLayers.map(o=>({...o}));
  rec.penyedia_layers=layers;
  PENYEDIA_KEYS.forEach(k=>{ rec[k]=layers[0]&&layers[0][k]!=null?layers[0][k]:''; });
  INDEP_MULTI_KEYS.forEach(k=>{ const list=indepValues(k); rec[k+'_list']=list; rec[k]=list[0]||''; });
  return rec; }
function newRecordTender(){
  if(!requireInput()) return;
  if(PYN_REG.tender.active) exitPenyesuaianTender();
  editingIdTender=null; tenderReturnView='dashboard'; clearFormTender(); applyLocksTender();
  document.getElementById('input-tender-title').textContent='Input Pekerjaan Tender';
  document.getElementById('edit-banner-tender').style.display='none';
  document.getElementById('io-tpl-tender').style.display='';
  showView('input-tender'); saveDraft('input-tender');
}
function editRecordTender(rid){
  if(!requireAdmin()) return;
  if(PYN_REG.tender.active) exitPenyesuaianTender();
  const rec=records_tender.find(r=>r.id===rid); if(!rec) return;
  editingIdTender=rid; tenderReturnView='list-tender'; fillFormTender(rec);
  document.getElementById('input-tender-title').textContent='Ubah Data Pekerjaan';
  const b=document.getElementById('edit-banner-tender'); b.style.display='flex';
  document.getElementById('edit-banner-tender-text').textContent='Mode Ubah Data';
  document.getElementById('io-tpl-tender').style.display='none';
  showView('input-tender','Memuat'); saveDraft('input-tender');
}

/* ---- Validasi field wajib Tender ---- */
function clearFormErrorsTender(){
  FIELDS_TENDER.forEach(f=>{ const w=document.getElementById('wrap_'+tenderInputId(f.key)); if(w) w.classList.remove('field-error'); });
}
/* Field wajib yang kosong (field terkunci dikecualikan). Hanya kelompok data I–II. */
function missingRequiredTender(rec){
  const missing=[];
  FIELDS_TENDER.forEach(f=>{
    if(!f.req) return;
    if(isLockedTender(f,rec)) return;        // field terkunci => tidak wajib
    const v=rec[f.key];
    const empty = (v==null) || (String(v).trim()==='') || (f.type==='num' && (v===0 || v==='0'));
    if(empty) missing.push(f.key);
  });
  return missing;
}

/* ---- Simpan / Batal / Hapus Tender ---- */
function askSaveTender(){
  if(!requireInput()) return;
  const rec=readFormTender();
  clearFormErrorsTender();
  const missing=missingRequiredTender(rec);
  if(missing.length){
    missing.forEach(k=>{ const w=document.getElementById('wrap_'+tenderInputId(k)); if(w) w.classList.add('field-error'); });
    const firstWrap=document.getElementById('wrap_'+tenderInputId(missing[0]));
    if(firstWrap) firstWrap.scrollIntoView({behavior:'smooth',block:'center'});
    toast('Data gagal disimpan, lengkapi data terlebih dahulu','warn');
    return;
  }
  /* Duplikat: cukup Nama Pekerjaan ATAU No. Kontrak yang sama dengan data lain. */
  {
    const bentrok=spkDupCek(rec, records_tender,
      {nomor:'no_kontrak', labelNomor:'No. Kontrak', nama:['nama_pekerjaan']}, editingIdTender);
    if(bentrok){ toast('Tidak bisa menambahkan 1 data : Duplikat\nSudah ada data dengan '+bentrok.by+' yang sama.','err'); return; }
  }
  openConfirm({icon:'save',title:'Simpan Data',text:'Apakah anda yakin ingin menyimpan data pekerjaan Tender?',onYes:doSaveTender});
}
async function doSaveTender(){
  const rec=readFormTender();
  try{
    if(editingIdTender){ await Store_TENDER.update(editingIdTender,rec); toast('Data berhasil diperbarui','ok'); }
    else{ await Store_TENDER.create(rec); toast('Data berhasil disimpan','ok'); }
  }catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'warn'); return; }
  editingIdTender=null; clearFormTender(); clearDraft();
  await refreshDataTender();
  showView('list-tender');
}
function askCancelTender(){
  const back = editingIdTender ? tenderReturnView : 'dashboard';
  openConfirm({icon:'back',title:'Batalkan',text:'Apakah anda yakin ingin membatalkan data pekerjaan?',
    onYes:()=>{ editingIdTender=null; clearFormTender(); clearDraft(); showView(back); }});
}
function askDeleteTender(rid){
  if(!requireAdmin()) return;
  openConfirm({icon:'del',title:'Hapus Data',text:'Apakah anda yakin ingin menghapus data pekerjaan Tender?',
    onYes:async()=>{
      try{ await withActionLoader('Menghapus', async()=>{ await Store_TENDER.remove(rid); await refreshDataTender(); }); }
      catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'warn'); return; }
      toast('Data berhasil dihapus','ok');
    }});
}
/* HAPUS SEMUA (Tender) */
function askDeleteAllTender(){
  if(!requireAdmin()) return;
  if(!records_tender || records_tender.length===0){ toast('Tidak ada data untuk dihapus','warn'); return; }
  openConfirm({icon:'del',title:'Hapus Semua Data',
    text:'Apakah anda yakin ingin menghapus semua data pekerjaan?',
    onYes:async()=>{
      try{ await withActionLoader('Menghapus', async()=>{ await Store_TENDER.removeAll(); await refreshDataTender(); }); }
      catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'warn'); return; }
      currentPageTender=1; renderTableTender();
      toast('Semua data berhasil dihapus','ok');
    }});
}

/* ---- Detail (Lihat) Tender — seluruh field ---- */
function viewRecordTender(rid){
  const rec=records_tender.find(r=>r.id===rid); if(!rec) return;
  const layers=penyediaLayersFromRecord(rec);
  let html='';
  GROUPS_TENDER.forEach(g=>{
    // Bila Kualifikasi = Pascakualifikasi, seksi "Proses Prakualifikasi" tidak ditampilkan
    if(isPrakualifikasiSection(g) && rec.kualifikasi==='Pascakualifikasi') return;
    if(isPenyediaSection(g)){
      const multi = layers.length > 1;   // label & jumlah penyedia hanya bila >1 penyedia
      let rows='';
      layers.forEach((lay,idx)=>{
        if(multi) rows+=`<div class="detail-row detail-penyedia"><span class="dk">Penyedia ${idx+1}</span><span class="dv"></span></div>`;
        g.keys.forEach(k=>{ const f=FIELDS_TENDER.find(x=>x.key===k); rows+=`<div class="detail-row"><span class="dk">${tenderFieldLabel(f,rec)}</span><span class="dv">${fmtMulti(lay[k],f.type)||'—'}</span></div>`; });
      });
      html+=detailGroupHTML(multi ? `${g.title} — ${layers.length} penyedia` : g.title, rows);
      return;
    }
    let rows='';
    g.keys.forEach(k=>{
      const f=FIELDS_TENDER.find(x=>x.key===k);
      if(INDEP_MULTI_KEYS.includes(k)){
        const list=(Array.isArray(rec[k+'_list'])&&rec[k+'_list'].length)?rec[k+'_list']:((rec[k]!=null&&rec[k]!=='')?[rec[k]]:[]);
        const shown=list.filter(x=>x!=null&&x!=='');
        const dv=shown.length ? (shown.length>1 ? shown.map((v,i)=>`<span class="stack-line"><b class="stack-no">${i+1}.</b> ${v}</span>`).join('') : shown[0]) : '—';
        rows+=`<div class="detail-row"><span class="dk">${tenderFieldLabel(f,rec)}</span><span class="dv">${dv}</span></div>`;
      }else if(PENYEDIA_STACK_FIELDS.includes(k)){
        const list=layers.map(l=>l[k]);
        const dv=(list.length>1) ? list.map((v,i)=>`<span class="stack-line"><b class="stack-no">${i+1}.</b> ${(v!=null&&v!=='')?v:'—'}</span>`).join('') : (fmt(list[0],f.type)||'—');
        rows+=`<div class="detail-row"><span class="dk">${tenderFieldLabel(f,rec)}</span><span class="dv">${dv}</span></div>`;
      }else{
        rows+=`<div class="detail-row"><span class="dk">${tenderFieldLabel(f,rec)}</span><span class="dv">${fmtMulti(rec[k],f.type)||'—'}</span></div>`;
      }
    });
    html+=detailGroupHTML(g.title, rows);
  });
  document.getElementById('detail-title').textContent='Detail Pekerjaan';
  document.getElementById('detail-body').innerHTML=html;
  withQuickLoader('Memuat', ()=>document.getElementById('detail-overlay').classList.add('show'));
}

/* ---- Tabel Monitoring Tender ---- */
function getFilteredRecordsTender(){
  const fb=document.getElementById('filter-tender-bidang').value;
  const ftp=document.getElementById('filter-tender-tahapan').value;
  const fyr=document.getElementById('filter-tender-tahun')?.value||'';
  const fs=document.getElementById('filter-tender-search').value.toLowerCase().trim();
  return records_tender.filter(r=>{
    if(fb && r.bidang_pelaksana!==fb) return false;
    if(!matchTahapanFilter(r.tahapan, ftp)) return false;
    if(fyr && yearOf(r, r.tgl_awal_kontrak)!==fyr) return false;
    if(fs){
      const hay=[r.nama_pekerjaan,r.no_kontrak,r.perusahaan,r.no_prk,r.no_eproc,r.no_rks].join(' ').toLowerCase();
      if(!hay.includes(fs)) return false;
    }
    return true;
  }).sort(makeWorkComparator(
    r=>yearOf(r, r.tgl_awal_kontrak),
    r=>{
      if(String(r.no_kontrak||'').trim()) return true;
      const layers=Array.isArray(r.penyedia_layers)?r.penyedia_layers:[];
      return layers.some(l=>String((l&&l.no_kontrak)||'').trim());
    },
    r=>r.tgl_awal_kontrak
  ));
}
let currentPageTender=1;
function renderTableTender(){
  let rows=getFilteredRecordsTender();
  const total=rows.length;
  const cEl=document.getElementById('list-tender-count'); if(cEl) cEl.textContent=total;
  const tb=document.getElementById('table-tender-body');
  const pg=document.getElementById('pagination-tender');
  if(!tb) return;
  if(total===0){
    tb.innerHTML=`<tr><td colspan="10"><div class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
      <div>Data tidak tersedia</div>
    </div></td></tr>`;
    if(pg) pg.innerHTML='';
    return;
  }
  const totalPages=Math.max(1,Math.ceil(total/PAGE_SIZE));
  if(currentPageTender>totalPages) currentPageTender=totalPages;
  if(currentPageTender<1) currentPageTender=1;
  const start=(currentPageTender-1)*PAGE_SIZE;
  const pageRows=rows.slice(start,start+PAGE_SIZE);

  tb.innerHTML=pageRows.map((r,i)=>`
    <tr>
      <td class="col-no">${start+i+1}</td>
      <td class="wrap-cell col-nama-freeze">${r.nama_pekerjaan||'—'}</td>
      <td class="wrap-penyedia col-kontrak">${stackPenyediaHtml(r,'no_kontrak')}</td>
      <td class="cell-center col-date">${fmtDate(r.tgl_awal_kontrak)||'—'}</td>
      <td class="cell-center col-date">${fmtDate(r.tgl_akhir_kontrak)||'—'}</td>
      <td class="col-bidang">${r.bidang_pelaksana||'—'}</td>
      <td class="col-penyedia">${stackPenyediaHtml(r,'perusahaan')}</td>
      <td class="wrap-penyedia col-nilai">${stackPenyediaRupiah(r,'kontrak_total_dengan_ppn')}</td>
      <td class="cell-center">${r.metode_pengadaan||'—'}</td>
      <td class="cell-center">${tahapanPill(r.tahapan)}</td>
      <td>
        <div class="action-cell">
          ${isAdmin()?`<button class="act act-edit" title="Ubah" onclick="editRecordTender('${r.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
          </button>`:''}
          <button class="act act-view" title="Lihat" onclick="viewRecordTender('${r.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          ${isAdmin()?`<button class="act act-del" title="Hapus" onclick="askDeleteTender('${r.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>`:''}
        </div>
      </td>
    </tr>`).join('');

  revealTbody(tb);
  renderPaginationTender(currentPageTender,totalPages);
}
function renderPaginationTender(page,totalPages){
  const el=document.getElementById('pagination-tender');
  if(!el) return;
  if(totalPages<=1){ el.innerHTML=''; return; }
  const want=new Set([1,totalPages,page-1,page,page+1]);
  const list=[...want].filter(p=>p>=1&&p<=totalPages).sort((a,b)=>a-b);
  let html=`<button class="pg-btn" ${page===1?'disabled':''} onclick="goToPageTender(${page-1})">‹ Sebelumnya</button>`;
  let prev=0;
  list.forEach(p=>{
    if(p-prev>1) html+=`<span class="pg-ellipsis">…</span>`;
    html+=`<button class="pg-btn pg-num ${p===page?'active':''}" onclick="goToPageTender(${p})">${p}</button>`;
    prev=p;
  });
  html+=`<button class="pg-btn" ${page===totalPages?'disabled':''} onclick="goToPageTender(${page+1})">Berikutnya ›</button>`;
  el.innerHTML=html;
}
function goToPageTender(p){ currentPageTender=p; withQuickLoader('Memuat', ()=>{ renderTableTender(); document.querySelector('#view-list-tender .panel').scrollIntoView({behavior:'smooth',block:'nearest'}); }, 550); }
function resetFiltersTender(){
  ['filter-tender-bidang','filter-tender-tahapan','filter-tender-tahun','filter-tender-search'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  currentPageTender=1; renderTableTender();
}

/* ---- Template & Export & Upload Excel Tender ---- */
async function downloadTemplateTender(){
  if(!requireInput()) return;
  if(!window.ExcelJS){ toast('Library Excel belum termuat, coba lagi','warn'); return; }
  const COLS = orderedFields(FIELDS_TENDER, GROUPS_TENDER);
  const OPSI={}; COLS.forEach(f=>{ if(f.type==='select') OPSI[f.key]=f.options; });

  const wb=new ExcelJS.Workbook();
  const dropKeys=Object.keys(OPSI);
  const colLetter=n=>{ let s=''; while(n>0){ const m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=(n-m-1)/26; } return s; };
  const opsiRange={};
  dropKeys.forEach((k,ci)=>{ const L=colLetter(ci+1); opsiRange[k]=`Opsi!$${L}$2:$${L}$${OPSI[k].length+1}`; });

  const wsD=wb.addWorksheet('Data');
  wsD.addRow(COLS.map(f=>f.label));
  wsD.columns=COLS.map(f=>({width:Math.max(16,f.label.length+2)}));
  const thin={style:'thin',color:{argb:'FFBFCAD0'}};
  const allBorder={top:thin,left:thin,bottom:thin,right:thin};
  const headRow=wsD.getRow(1); headRow.height=34;
  for(let c=1;c<=COLS.length;c++){
    const cell=wsD.getCell(1,c);
    const pp=isStackKey(COLS[c-1].key);
    cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:pp?'FF0E9E8E':'FF0E7C86'}};
    cell.font={bold:true,color:{argb:'FFFFFFFF'},size:11};
    cell.alignment={wrapText:true,vertical:'middle',horizontal:'center'};
    cell.border=allBorder;
  }
  for(let r=2;r<=251;r++){ for(let c=1;c<=COLS.length;c++){ const cell=wsD.getCell(r,c); const pp=isStackKey(COLS[c-1].key); cell.border=allBorder; cell.alignment=pp?{wrapText:true,vertical:'top'}:{vertical:'middle'}; if(r%2===1) cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF2F7F8'}}; } }
  COLS.forEach((f,idx)=>{ const c=idx+1;
    if(f.type==='date'){ for(let r=2;r<=251;r++) wsD.getCell(r,c).numFmt='dd/mm/yyyy'; }
    if(f.type==='num'){ for(let r=2;r<=251;r++){ wsD.getCell(r,c).numFmt=ACCT_NODEC; wsD.getCell(r,c).alignment={vertical:'middle',horizontal:'right'}; } }
    if(isForceTextKey(f.key)){ for(let r=2;r<=251;r++) wsD.getCell(r,c).numFmt='@'; }
  });
  // #12: Harga Total (Tanpa PPN) diisi manual sebagai nilai (tanpa rumus). Format currency Rupiah tanpa desimal.
  const colMapTdT=fieldColMap(COLS);
  ['hpe','rab','hps'].forEach(p=>{ const tC=colMapTdT[p+'_total_tanpa_ppn']; if(tC){ for(let r=2;r<=251;r++){ const cell=wsD.getCell(r,tC); cell.numFmt=ACCT_NODEC; cell.alignment={vertical:'middle',horizontal:'right'}; } } });

  const wsO=wb.addWorksheet('Opsi');
  dropKeys.forEach((k,ci)=>{ const f=COLS.find(x=>x.key===k); wsO.getCell(1,ci+1).value=f.label; OPSI[k].forEach((v,ri)=>wsO.getCell(ri+2,ci+1).value=v); });
  wsO.state='hidden';

  const ROWS=250;
  COLS.forEach((f,idx)=>{ if(!OPSI[f.key]) return; const L=colLetter(idx+1);
    for(let r=2;r<=ROWS+1;r++){ wsD.getCell(`${L}${r}`).dataValidation={type:'list',allowBlank:true,formulae:[opsiRange[f.key]],showErrorMessage:true,errorTitle:'Pilihan tidak valid',error:'Silakan pilih salah satu nilai dari daftar dropdown.'}; }
  });

  const wsG=wb.addWorksheet('Petunjuk');
  wsG.columns=[{width:34},{width:84}];
  [['PETUNJUK PENGISIAN — TENDER',''],['',''],
   ['Bidang Pelaksana','Pilih dari dropdown (7 bidang)'],
   ['Tahun','WAJIB diisi pada setiap baris. Bila ada satu baris saja yang kosong, seluruh berkas ditolak.'],
   ['No. Kontrak','Tidak boleh kembar — baris dengan nomor yang sama ditolak. Boleh dikosongkan bila kontrak belum terbit (tanda "-" juga dianggap kosong).'],
   ['Level Risiko / Level Risiko (CSMS)','Pilih dari dropdown: Tidak Ada s/d Ekstrem'],
   ['Addendum RKS','Pilih: Ada / Tidak Ada. Bila selain "Ada", No./Tgl. Addendum RKS dikosongkan.'],
   ['Metode Pengadaan','Tender Terbatas / Tender Terbuka / Seleksi Umum / Seleksi Terbatas / Penunjukan Langsung / Tender Cepat'],
   ['Kualifikasi','Pascakualifikasi / Prakualifikasi. Bila Pascakualifikasi, bagian Proses Prakualifikasi dikosongkan.'],
   ['Jaminan Penawaran / Pelaksanaan','Dipersyaratkan: Ada / Tidak Ada. Bila selain "Ada", seluruh detail jaminan terkait terkunci & dikosongkan.'],
   ['Tahapan/Proses','Penyusunan HPS / Proses Pengadaan / Tandatangan Kontrak / Terkontrak / Gagal/Batal'],
   ['Kendala & Tindak Lanjut','Diisi hanya bila Tahapan/Proses = Gagal/Batal'],
   ['Negosiasi Jangka Waktu Pelaksanaan','Isi jangka waktu yang disepakati (hari)'],
   ['Format Tanggal','Kolom tanggal berformat dd/mm/yyyy (mis. 31/01/2025).'],
   ['Nilai/Harga','Kolom nilai berformat Rupiah. Ketik angka saja (mis. 100000000).'],
   ['Harga Total (Tanpa PPN)','Terisi otomatis = Harga Barang + Harga Jasa (jangan diedit manual).'],
   ['KOLOM BERTUMPUK (judul hijau muda)','Boleh berisi >1 nilai dalam SATU sel. Tekan ALT+ENTER untuk pindah baris di dalam sel; nilai ke-2 dst berada di bawah nilai pertama.'],
   ['Kolom per penyedia','Seksi X, XI, XIII, XIV, XV, XVIII + No. Penunjukan Penyedia. Jumlah baris = jumlah penyedia; urutan baris harus sama antar kolom (baris ke-1 = Penyedia 1, dst).'],
   ['Kolom independen','Bidang/Sub Bidang — boleh banyak nilai, jumlahnya bebas dan tidak terkait jumlah penyedia. Tgl. Penunjukan Penyedia hanya satu nilai.'],
   ['Contoh sel Perusahaan','PT Karya Listrik Maluku ⏎(Alt+Enter) PT Maju Jaya Utama'],
   ['','Isi data mulai baris ke-2. Jangan menghapus sheet "Opsi".'],
  ].forEach(r=>wsG.addRow(r));
  wsG.getCell('A1').font={bold:true,size:14,color:{argb:'FF0E7C86'}};
  for(let r=3;r<=19;r++){ wsG.getCell(`A${r}`).font={bold:true,color:{argb:'FF095E66'}}; }

  // Rapikan: rumus+kunci Total (HPE/RAB/HPS), sorot dropdown, proteksi sheet.
  // Total per-penyedia (Penawaran/Kontrak) dikunci-kosong; dihitung app saat impor.
  await spkFinishTemplate(wsD, COLS, OPSI, isStackKey, ROWS);

  try{
    const buf=await wb.xlsx.writeBuffer();
    const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='Template_Tender_UP3_Masohi.xlsx';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }catch(err){ console.error(err); toast('Gagal membuat template: '+errMsg(err),'warn'); }
}

async function exportExcelTender(){
  if(!window.ExcelJS){ toast('Library Excel belum termuat, coba lagi','warn'); return; }
  const COLS = orderedFields(FIELDS_TENDER, GROUPS_TENDER);
  const rows=getFilteredRecordsTender();
  if(rows.length===0){ toast('Tidak ada data untuk diekspor','warn'); return; }
  const wb=new ExcelJS.Workbook();
  const ws=wb.addWorksheet('Monitoring Tender');
  ws.addRow(['No', ...COLS.map(f=>f.label)]);
  const colMapTd=fieldColMap(COLS);
  const FLAT_AUTO=['hpe','rab','hps'];
  const isFlatAutoTotal=(k)=>FLAT_AUTO.some(p=>k===p+'_total_tanpa_ppn');
  const isFlatPpnTotal=(k)=>FLAT_AUTO.some(p=>k===p+'_total_dengan_ppn');
  rows.forEach((r,ri)=>{ ws.addRow([ri+1, ...COLS.map(f=>{
    if(isFlatAutoTotal(f.key)){ const p=f.key.replace(/_total_tanpa_ppn$/,''); const b=Number(r[p+'_harga_barang'])||0, j=Number(r[p+'_harga_jasa'])||0; const t=b+j; return t>0?t:''; }
    if(isFlatPpnTotal(f.key)){ const p=f.key.replace(/_total_dengan_ppn$/,''); const b=Number(r[p+'_harga_barang'])||0, j=Number(r[p+'_harga_jasa'])||0; const t=b+j; return t>0?ppnFromBase(t):''; }
    if(PENYEDIA_KEYS.includes(f.key)) return penyediaCellValue(r,f.key,f.type);
    if(INDEP_MULTI_KEYS.includes(f.key)) return indepCellValue(r,f.key);
    let v=r[f.key]; if(v===''||v==null) return ''; if(f.type==='num') return Number(v); if(f.type==='date') return fmtDate(v); return v;
  })]);
  });
  autoLayoutSheet(ws, [{key:'__no__',label:'No',type:'no'}, ...COLS], rows.length, {
    headerFill: (f)=> isStackKey(f.key) ? 'FF0E9E8E' : 'FF0E7C86',
    topAlign:   (f)=> isStackKey(f.key)
  });
  try{
    const buf=await wb.xlsx.writeBuffer();
    const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='Monitoring_Tender_UP3_Masohi.xlsx';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }catch(err){ console.error(err); toast('Gagal export Excel: '+errMsg(err),'warn'); }
}

function handleUploadTender(ev){
  if(!requireInput()){ ev.target.value=''; return; }
  const file=ev.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=async e=>{
    try{
      const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});
      const sheetName=wb.SheetNames.includes('Data') ? 'Data' : wb.SheetNames[0];
      const ws=wb.Sheets[sheetName];
      const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      if(rows.length<2){ toast('File kosong / tidak ada data','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      const head=rows[0].map(h=>String(h).trim());
      const map={};
      head.forEach((h,i)=>{ const f=FIELDS_TENDER.find(x=>x.label.toLowerCase()===h.toLowerCase()); if(f)map[f.key]=i; });
      if(Object.keys(map).length===0){ toast('Header tidak dikenali. Gunakan template Tender.','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      const PNW_SET=new Set(PENYEDIA_KEYS);
      const batch=[];
      for(let r=1;r<rows.length;r++){
        const row=rows[r]; if(!row || row.every(c=>String(c).trim()===''))continue;
        const rec={};
        const layerLines={}; let maxLayers=1;
        let fmtBad=false; const fmtBadCells=[];
        const noteBad=(f,val)=>{ fmtBad=true; fmtBadCells.push({label:f.label, key:f.key, val:val, col:(map[f.key]!=null?spkColLetterTpl(map[f.key]+1):'?')}); };
        FIELDS_TENDER.forEach(f=>{
          let raw=map[f.key]!=null ? row[map[f.key]] : '';
          raw=raw==null?'':raw;
          if(PNW_SET.has(f.key)){
            let lines=String(raw).split(/\r?\n/).map(s=>s.trim());
            while(lines.length>1 && lines[lines.length-1]==='') lines.pop();
            lines.forEach(ln=>{ if(!coerceCell(f,ln).ok) noteBad(f,ln); });
            layerLines[f.key]=lines;
            if(lines.length>maxLayers) maxLayers=lines.length;
          }else if(INDEP_MULTI_KEYS.includes(f.key)){
            let lines=String(raw).split(/\r?\n/).map(s=>s.trim());
            while(lines.length>1 && lines[lines.length-1]==='') lines.pop();
            rec[f.key+'_list']=lines;
            rec[f.key]=lines[0]||'';
          }else{
            const c=coerceCell(f,raw);
            if(!c.ok) noteBad(f,raw);
            rec[f.key]=c.value;
          }
        });
        if(fmtBad){
          const xlRow=r+1;
          console.warn('[SPK] Upload Tender — Format Tidak Sesuai di baris '+xlRow+':', fmtBadCells);
          toast(spkFmtBadMsg(fmtBadCells, xlRow),'err', TOAST_MS_UPLOAD);
          ev.target.value=''; return;
        }
        const layers=[];
        for(let i=0;i<maxLayers;i++){
          const lay={};
          PENYEDIA_KEYS.forEach(k=>{
            const f=FIELDS_TENDER.find(x=>x.key===k);
            let cell=(layerLines[k]&&layerLines[k][i]!=null)?layerLines[k][i]:'';
            if(f.type==='num'){ const n=Number(String(cell).replace(/[^\d.-]/g,'')); cell=isNaN(n)?'':n; }
            else if(f.type==='date'){ cell=normDate(cell); }
            else cell=String(cell).trim();
            lay[k]=cell;
          });
          layers.push(lay);
        }
        rec.penyedia_layers=layers;
        PENYEDIA_KEYS.forEach(k=>{ rec[k]=layers[0]&&layers[0][k]!=null?layers[0][k]:''; });
        // #12: Harga Total (Tanpa PPN) = Barang + Jasa — total flat (HPE/RAB/HPS) di rec, total per-penyedia (tawar/kontrak) di tiap layer
        ['hpe','rab','hps'].forEach(p=>{ const b=Number(rec[p+'_harga_barang'])||0, j=Number(rec[p+'_harga_jasa'])||0; if(FIELDS_TENDER.some(f=>f.key===p+'_total_tanpa_ppn'&&f.auto==='sum')) rec[p+'_total_tanpa_ppn']=(b+j)>0?(b+j):''; });
        ['hpe','rab','hps'].forEach(p=>{ if(FIELDS_TENDER.some(f=>f.key===p+'_total_dengan_ppn'&&f.auto==='ppn')){ const base=Number(rec[p+'_total_tanpa_ppn'])||0; rec[p+'_total_dengan_ppn']=base>0?ppnFromBase(base):''; } });
        layers.forEach(lay=>{ ['tawar','kontrak'].forEach(p=>{ const b=Number(lay[p+'_harga_barang'])||0, j=Number(lay[p+'_harga_jasa'])||0; if(lay[p+'_total_tanpa_ppn']!==undefined) lay[p+'_total_tanpa_ppn']=(b+j)>0?(b+j):''; if(lay[p+'_total_dengan_ppn']!==undefined){ const base=Number(lay[p+'_total_tanpa_ppn'])||0; lay[p+'_total_dengan_ppn']=base>0?ppnFromBase(base):''; } }); });
        PENYEDIA_KEYS.forEach(k=>{ rec[k]=layers[0]&&layers[0][k]!=null?layers[0][k]:''; });
        if(!String(rec.tahun||'').trim()){ const xlRow=r+1; console.warn('[SPK] Upload Tender — kolom Tahun kosong di baris '+xlRow); toast(spkMissingMsg(['tahun'], map, FIELDS_TENDER, xlRow),'warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
        { const miss=missingRequiredTender(rec); if(miss.length){ const xlRow=r+1; console.warn('[SPK] Upload Tender — kolom wajib kosong di baris '+xlRow+':', miss); toast(spkMissingMsg(miss, map, FIELDS_TENDER, xlRow),'warn', TOAST_MS_UPLOAD); ev.target.value=''; return; } }
        rec.__xlRow = r+1;   // nomor baris di Excel, dipakai pesan duplikat
        batch.push(rec);
      }
      if(batch.length===0){ toast('Tidak ada baris data untuk diimpor','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      const DUPOPT_K={nomor:'no_kontrak', labelNomor:'No. Kontrak', nama:['nama_pekerjaan']};
      const _sar=spkDupSaring(batch, records_tender, DUPOPT_K);
      const toAdd=_sar.toAdd, dupRows=_sar.dupRows;
      const dupCount=dupRows.length;
      if(dupCount) console.warn('[SPK] Upload Tender — baris dilewati (duplikat Nama Pekerjaan / No. Kontrak):', dupRows);
      if(toAdd.length){
        try{ await Store_TENDER.bulkCreate(toAdd); }
        catch(err){ console.error(err); toast('Gagal mengimpor: '+errMsg(err),'warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
        await refreshDataTender();
      }
      /* Hasil unggah ditampilkan lewat POP UP yang bertahan (ditutup dengan
         tombol \u00d7 di kanan atas), bukan notifikasi sekilas. */
      const _hasilTd=spkImporHasil(toAdd, dupRows, DUPOPT_K);
      // Data berhasil ditambahkan lewat template → langsung tampilkan loading &
      // kembali ke Daftar Monitoring Tender.
      if(toAdd.length){
        ev.target.value='';
        showView('list-tender','Memuat daftar');
        spkImporModal(_hasilTd,'Tender',true);
        return;
      }
      spkImporModal(_hasilTd,'Tender');
    }catch(err){ console.error(err); toast('Gagal membaca file Excel','warn', TOAST_MS_UPLOAD); }
    ev.target.value='';
  };
  reader.readAsArrayBuffer(file);
}

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

/* ============================================================
   ==================  PENETAPAN NOMOR  =======================
   Ambil & Lihat nomor dokumen pengadaan (Pengadaan Langsung / Tender).
   - Tanggal terbit otomatis = tanggal saat penetapan.
   - Penomoran berjalan dengan "gap-fill": nomor yang DIHAPUS akan
     tersedia lagi (dipakai ulang oleh penetapan berikutnya).
   - Dokumen utama (HPS, BA Pembukaan, BA Evaluasi, BA Klarifikasi)
     berbagi satu urutan (default lanjut dari 0019 -> 0020).
     Berita Acara Penjelasan punya urutan sendiri (opsional).
   - Disimpan di Supabase tabel `penetapan_nomor` (+ file base64) dan
     `penetapan_config` (nomor awal per modul & tahun).
   Jalankan skrip: penetapan_nomor_supabase_up3masohi.sql
   ============================================================ */
const PN_TABLE = 'penetapan_nomor';
const PN_CFG_TABLE = 'penetapan_config';
const PN_MAX_MB = 15;
const PN_UNIT = 'F17060000';   // kode unit UP3 Masohi (paten)

const PN_BIDANG_OPTS = [
  'Jaringan dan Konstruksi','Pembangkitan','Transaksi Energi Listrik',
  'Niaga dan Pemasaran','Perencanaan','Keuangan dan Umum',
  'Keselamatan, Kesehatan Kerja, Lingkungan dan Keamanan'
];
const PN_KLAS_OPTS = [
  {kode:'DAN.01.01', label:'DAN.01.01 — Pengadaan Barang'},
  {kode:'DAN.01.02', label:'DAN.01.02 — Pengadaan Jasa'},
  {kode:'DAN.01.03', label:'DAN.01.03 — Pengadaan Barang dan Jasa'}
];

/* Definisi dokumen per modul.
   counter:'main' -> berbagi satu urutan | 'bap' -> urutan tersendiri.
   optional:true   -> hanya digenerate bila dipilih (Menggunakan Penjelasan = Ya). */
const PN_DOCS = {
  pl: [
    {key:'HPS',  code:'HPS',     label:'Harga Perkiraan Sendiri (HPS)',          counter:'hps'},
    {key:'BAP',  code:'BAP.PL',  label:'Berita Acara Penjelasan',                counter:'bap', optional:true},
    {key:'BAPP', code:'BAPP.PL', label:'Berita Acara Pembukaan Penawaran',       counter:'main'},
    {key:'BAE',  code:'BAEP.PL', label:'Berita Acara Evaluasi Penawaran',        counter:'main'},
    {key:'BAKN', code:'BAKN.PL', label:'Berita Acara Klarifikasi dan Negosiasi', counter:'main'}
  ],
  /* Tender: dipilih via checklist. HPS berbagi urutan dengan HPS Pengadaan Langsung
     (counter:'hps' lintas modul); dokumen lain berbagi urutan 'main' milik tender. */
  tender: [
    {key:'T_HPS',      code:'HPS',       label:'Harga Perkiraan Sendiri',                            counter:'hps'},
    {key:'T_BAP',      code:'BAP',       label:'Pemberian Penjelasan',                               counter:'main'},
    {key:'T_BAPP',     code:'BAPP',      label:'Pembukaan Penawaran',                                counter:'main'},
    {key:'T_BAPP_S1',  code:'BAPP.S1',   label:'Pembukaan Penawaran Sampul Satu',                    counter:'main'},
    {key:'T_BAEP',     code:'BAEP',      label:'Evaluasi Penawaran',                                 counter:'main'},
    {key:'T_BAEP_S1',  code:'BAEP.S1',   label:'Evaluasi Penawaran Sampul Satu',                     counter:'main'},
    {key:'T_BAEK',     code:'BAEK',      label:'Evaluasi Dokumen Aplikasi Kualifikasi',              counter:'main'},
    {key:'T_BAEP_S2',  code:'BAEP.S2',   label:'Evaluasi Penawaran Sampul Dua',                      counter:'main'},
    {key:'T_BAPK',     code:'BAPK',      label:'Pembuktian Kualifikasi',                             counter:'main'},
    {key:'T_BAKN',     code:'BAKN',      label:'Klarifikasi dan Negosiasi',                          counter:'main'},
    {key:'T_BAHP',     code:'BAHP',      label:'Hasil Pengadaan',                                    counter:'main'},
    {key:'T_UCP',      code:'UCP',       label:'Usulan Calon Pemenang',                              counter:'main'},
    {key:'T_CDA',      code:'CDA',       label:'Contract Discussion Agreement',                      counter:'main'},
    {key:'T_BAEK_PRA', code:'BAEK.PRA',  label:'Evaluasi Dokumen Aplikasi Kualifikasi (Prakualifikasi)', counter:'main'},
    {key:'T_BAPK_PRA', code:'BAPK.PRA',  label:'Pembuktian Kualifikasi (Prakualifikasi)',            counter:'main'}
  ]
};
/* Label jenis dokumen untuk tabel Lihat Nomor (per key) */
const PN_JENIS = {
  HPS:'Harga Perkiraan Sendiri', BAP:'Pemberian Penjelasan', BAPP:'Pembukaan Penawaran', BAE:'Evaluasi Penawaran', BAKN:'Klarifikasi & Negosiasi',
  T_HPS:'Harga Perkiraan Sendiri', T_BAP:'Pemberian Penjelasan', T_BAPP:'Pembukaan Penawaran',
  T_BAPP_S1:'Pembukaan Penawaran Sampul Satu', T_BAEP:'Evaluasi Penawaran', T_BAEP_S1:'Evaluasi Penawaran Sampul Satu',
  T_BAEK:'Evaluasi Dokumen Aplikasi Kualifikasi', T_BAEP_S2:'Evaluasi Penawaran Sampul Dua', T_BAPK:'Pembuktian Kualifikasi',
  T_BAKN:'Klarifikasi & Negosiasi', T_BAHP:'Hasil Pengadaan', T_UCP:'Usulan Calon Pemenang', T_CDA:'Contract Discussion Agreement',
  T_BAEK_PRA:'Evaluasi Dokumen Aplikasi Kualifikasi (Prakualifikasi)', T_BAPK_PRA:'Pembuktian Kualifikasi (Prakualifikasi)'
};
/* Nomor terakhir terpakai (base) default -> nomor berikut = base + 1.
   Dokumen utama melanjutkan dari 0019; Penjelasan mulai dari 0. */
const PN_BASE_DEFAULT = { main:19, bap:0, hps:19 };
let pnConfig = {};   // { 'pl|2026': {main:19, bap:0}, ... }

const PN_MODULES = {
  pl:     {label:'Pengadaan Langsung'},
  tender: {label:'Tender'}
};

let records_penetapan = [];
const pnState = { ambil:{modul:'pl'}, lihat:{modul:'pl', page:1}, lastResult:null };
const PN_PAGE_SIZE = 5;   // Lihat Nomor menampilkan maksimal 5 pekerjaan per halaman

/* Ikon */
const PN_DOC_ICON  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h4"/></svg>';
const PN_COPY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const PN_CHECK_ICON= '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>';
const PN_WARN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/></svg>';
const PN_HASH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M10.6 12.2l-1 5.4M14 12.2l-1 5.4M8.6 14.2h6M8.2 16.2h6"/></svg>';

/* ---- Store Supabase ---- */
const StorePenetapan = {
  async list(){
    if(!(USE_SUPABASE && db)) return [];
    const {data,error} = await db.from(PN_TABLE)
      .select('id,modul,tahun,tgl_terbit,nama_pekerjaan,bidang_pelaksana,kode_klasifikasi,unit,menggunakan_penjelasan,dokumen,nama_file,ukuran,mime,created_at')
      .order('created_at',{ascending:false});
    if(error) throw error; return data||[];
  },
  async insert(row){
    const {data,error} = await db.from(PN_TABLE).insert(row).select();
    if(error) throw error; return data && data[0];
  },
  async getFile(id){
    const {data,error} = await db.from(PN_TABLE).select('nama_file,mime,data_base64').eq('id',id).limit(1);
    if(error) throw error; return (data && data[0]) || null;
  },
  async setFile(id, file){
    const {error} = await db.from(PN_TABLE).update(file).eq('id',id);
    if(error) throw error;
  },
  /* Simpan seluruh array dokumen (menampung file & tgl_terbit per nomor). */
  async setDokumen(id, dokumen){
    if(!(USE_SUPABASE && db)) return;
    const {error} = await db.from(PN_TABLE).update({dokumen}).eq('id',id);
    if(error) throw error;
  },
  /* Ambil array dokumen lengkap (termasuk file base64 per nomor). */
  async getDokumen(id){
    if(!(USE_SUPABASE && db)) return null;
    const {data,error} = await db.from(PN_TABLE).select('dokumen').eq('id',id).limit(1);
    if(error) throw error; return (data && data[0]) ? data[0].dokumen : null;
  },
  async remove(id){
    const {error} = await db.from(PN_TABLE).delete().eq('id',id);
    if(error) throw error;
  }
};

async function refreshDataPenetapan(){
  try{ records_penetapan = await StorePenetapan.list(); }
  catch(err){ console.error(err); records_penetapan = records_penetapan||[]; toast('Gagal memuat data Penetapan Nomor: '+errMsg(err),'err'); }
  if(document.getElementById('view-pn-lihat')?.classList.contains('active')) renderPnLihat();
}
async function pnLoadConfig(){
  pnConfig = {};
  if(!(USE_SUPABASE && db)) return;
  try{
    const {data,error} = await db.from(PN_CFG_TABLE).select('modul,tahun,base');
    if(error) throw error;
    (data||[]).forEach(r=>{ pnConfig[r.modul+'|'+r.tahun] = r.base || {}; });
  }catch(err){ /* tabel opsional; abaikan bila belum dibuat */ }
}

/* ---- Util nomor ---- */
function pnYear(){ return new Date().getFullYear(); }
function pnTodayISO(){ const d=new Date(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return d.getFullYear()+'-'+m+'-'+day; }
function pnPad4(n){ return String(n).padStart(4,'0'); }
function pnFormatNo(seq, code, klas, unit, year){ return pnPad4(seq)+'.'+code+'/'+klas+'/'+unit+'/'+year; }
function pnBase(modul, counter, year){
  if(isDemo()) return 0;   // Akun dummy: penomoran selalu dimulai dari 1
  const c = pnConfig[modul+'|'+year];
  if(c && c[counter]!=null && !isNaN(c[counter])) return parseInt(c[counter],10);
  return PN_BASE_DEFAULT[counter]!=null ? PN_BASE_DEFAULT[counter] : 0;
}
/* Penentu "counter" untuk penomoran:
   - Dokumen HPS (counter asli 'hps') -> tetap 'hps' (pool bersama PL + Tender).
   - Dokumen lain -> memakai KEY-nya sendiri, sehingga setiap jenis dokumen
     memiliki urutan nomor yang terpisah (tidak saling menumpuk). */
function pnSeqCounter(d){
  if(!d) return 'main';
  return d.counter==='hps' ? 'hps' : ('k:'+d.key);
}
/* Kumpulan nomor urut yang sudah dipakai untuk (modul, counter, tahun).
   counter 'hps' bersifat lintas modul: berbagi satu urutan antara HPS Pengadaan
   Langsung dan HPS Tender. Counter 'k:<key>' -> hanya dokumen dengan key tersebut. */
function pnUsedSeqs(modul, counter, year){
  const set = new Set();
  const addFrom=(mod, keys)=>{
    records_penetapan.forEach(r=>{
      if(r.modul!==mod) return;
      if(Number(r.tahun)!==Number(year)) return;
      const arr = Array.isArray(r.dokumen)?r.dokumen:[];
      arr.forEach(d=>{ if(keys.includes(d.key) && d.seq!=null) set.add(Number(d.seq)); });
    });
  };
  if(counter==='hps'){
    // Kolam nomor bersama: seluruh dokumen ber-counter 'hps' (HPS PL + HPS Tender).
    const plHpsKeys=(PN_DOCS.pl||[]).filter(d=>d.counter==='hps').map(d=>d.key);
    addFrom('pl', plHpsKeys);
    const tHpsKeys=(PN_DOCS.tender||[]).filter(d=>d.counter==='hps').map(d=>d.key);
    addFrom('tender', tHpsKeys);
    return set;
  }
  if(counter && counter.indexOf('k:')===0){
    // Urutan terpisah per jenis dokumen (berdasarkan key).
    const key=counter.slice(2);
    addFrom(modul, [key]);
    return set;
  }
  const keys = (PN_DOCS[modul]||[]).filter(d=>d.counter===counter).map(d=>d.key);
  addFrom(modul, keys);
  return set;
}
/* Base per counter:
   - 'hps'        -> pool bersama PL+Tender, mulai dari 20 (base 19).
   - 'k:<key>' PL -> setiap dokumen PL mulai dari 20 (base 19), kecuali Penjelasan mulai 1.
   - 'k:<key>' Tender -> setiap dokumen Tender mulai dari 1 (base 0).
   Semua dapat di-override manual lewat pnConfig, dan reset per tahun otomatis. */
function pnBaseFor(modul, counter, year){
  if(isDemo()) return 0;   // Akun dummy: seluruh jenis nomor dimulai dari 1
  if(counter==='hps'){
    const cPl=pnConfig['pl|'+year], cTn=pnConfig['tender|'+year];
    if(cPl && cPl.hps!=null && !isNaN(cPl.hps)) return parseInt(cPl.hps,10);
    if(cTn && cTn.hps!=null && !isNaN(cTn.hps)) return parseInt(cTn.hps,10);
    return PN_BASE_DEFAULT.hps!=null ? PN_BASE_DEFAULT.hps : 19;
  }
  if(counter && counter.indexOf('k:')===0){
    const key=counter.slice(2);
    const c = pnConfig[modul+'|'+year];
    if(c && c[counter]!=null && !isNaN(c[counter])) return parseInt(c[counter],10);
    if(modul==='tender') return 0;                 // Tender mulai dari 1
    if(key==='BAP') return 0;                       // Penjelasan (PL) mulai dari 1
    return 19;                                      // Dokumen PL lain mulai dari 20
  }
  if(modul==='tender'){
    const c = pnConfig[modul+'|'+year];
    if(c && c[counter]!=null && !isNaN(c[counter])) return parseInt(c[counter],10);
    return 0;
  }
  return pnBase(modul,counter,year);
}
/* Nomor berikutnya = terkecil > base yang belum terpakai (mengisi celah bekas hapus) */
function pnNextSeq(modul, counter, year){
  const base = pnBaseFor(modul,counter,year);
  const used = pnUsedSeqs(modul,counter,year);
  let n = base + 1;
  while(used.has(n)) n++;
  return n;
}

/* ---- Navigasi ---- */
function openPnAmbil(modul){
  if(!PN_MODULES[modul]) modul='pl';
  if(pnState.ambil.modul!==modul) pnState.lastResult=null;
  pnState.ambil.modul=modul;
  resetInputBaru('pn');            // input baru: pilihan pekerjaan dibatalkan
  showView('pn-ambil');
}
function openPnLihat(){
  // Tabel gabungan: Pengadaan Langsung + Tender ditampilkan bersama.
  showView('pn-lihat');
}
function pnMarkActive(mode, modul){
  document.querySelectorAll('.topnav-item[data-view="pn-'+mode+'"]').forEach(b=>{
    b.classList.toggle('active', b.dataset.modul===modul);
  });
  const seg=document.getElementById('pn-'+mode+'-seg');
  if(seg) seg.querySelectorAll('.fk-seg-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.modul===modul);
  });
}

/* ---- Render halaman Ambil Nomor (gabungan Pengadaan Langsung + Tender) ---- */
function renderPnAmbil(){
  pnMarkActive('ambil', pnState.ambil.modul);
  const cont=document.getElementById('pn-ambil-content'); if(!cont) return;
  const hasDocs=((PN_DOCS.pl&&PN_DOCS.pl.length)||(PN_DOCS.tender&&PN_DOCS.tender.length));
  if(hasDocs){
    cont.innerHTML = pnAmbilUnifiedFormHtml();
    pnBuildDocModal();
    if(pnState.lastResult) pnRenderResult(pnState.lastResult);
  }else{
    cont.innerHTML = pnPendingHtml('Pengadaan');
  }
}
/* Checklist gabungan: dikelompokkan menjadi Bagian I (Pengadaan Langsung) & II (Tender) */
function pnDocGroupHtml(no, title, arr){
  const items=(arr||[]).map((d,i)=>{
    return '<label class="pn-check-item">' +
      '<input type="checkbox" class="pn-doc-check" value="'+fkEsc(d.key)+'" onchange="pnDocUpdateCount()">' +
      '<span class="pn-check-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></span>' +
      '<span class="pn-check-label">'+(i+1)+'. '+fkEsc(PN_JENIS[d.key]||d.label)+'</span>' +
    '</label>';
  }).join('');
  return '<div class="pn-doc-group">'+
    '<div class="pn-doc-group-title">'+fkEsc(title)+'</div>'+
    '<div class="pn-check-grid">'+items+'</div>'+
  '</div>';
}
function pnBuildDocModal(){
  const list=document.getElementById('pn-doc-modal-list'); if(!list) return;
  list.classList.add('pn-doc-grouped');
  list.innerHTML = pnDocGroupHtml('I', 'Pengadaan Langsung', PN_DOCS.pl) +
                   pnDocGroupHtml('II', 'Tender', PN_DOCS.tender);
  const sub=document.getElementById('pn-doc-modal-sub');
  if(sub) sub.textContent = 'Centang dokumen (Pengadaan Langsung dan/atau Tender) yang akan diterbitkan nomornya';
  const allBtn=document.querySelector('#pn-doc-overlay .pn-check-all'); if(allBtn) allBtn.textContent='Pilih Semua';
  pnDocUpdateCount();
}
/* Snapshot centang saat modal dibuka (untuk fungsi Batal) */
let pnDocSnapshot=null;
function pnDocModalOpen(){
  pnDocSnapshot=[...document.querySelectorAll('.pn-doc-check')].map(b=>b.checked);
  const ov=document.getElementById('pn-doc-overlay'); if(ov) ov.classList.add('show');
}
/* Simpan: minimal satu dokumen harus dicentang. Jika tidak, tampilkan pesan gagal
   dan tetap berada di halaman Pilih Dokumen (modal tidak ditutup). */
function pnDocModalSave(){
  const checked=document.querySelectorAll('.pn-doc-check:checked').length;
  if(!checked){ toast('Data gagal disimpan : Pilih salah satu dokumen','err'); return; }
  pnDocUpdateCount();
  const ov=document.getElementById('pn-doc-overlay'); if(ov) ov.classList.remove('show');
}
/* Batal: kembalikan centang ke kondisi saat modal dibuka, lalu tutup (tanpa notifikasi) */
function pnDocModalCancel(){
  const boxes=[...document.querySelectorAll('.pn-doc-check')];
  if(pnDocSnapshot) boxes.forEach((b,i)=>{ if(i<pnDocSnapshot.length) b.checked=pnDocSnapshot[i]; });
  const allOn=boxes.length>0 && boxes.every(b=>b.checked);
  const allBtn=document.querySelector('#pn-doc-overlay .pn-check-all'); if(allBtn) allBtn.textContent=allOn?'Kosongkan':'Pilih Semua';
  pnDocUpdateCount();
  const ov=document.getElementById('pn-doc-overlay'); if(ov) ov.classList.remove('show');
}
function pnDocModalHide(){ const ov=document.getElementById('pn-doc-overlay'); if(ov) ov.classList.remove('show'); }
function pnDocUpdateCount(){
  const n=document.querySelectorAll('.pn-doc-check:checked').length;
  const c=document.getElementById('pn-doc-count');
  if(c){ c.textContent=n; c.style.display = n>0 ? '' : 'none'; }
}
function pnDocToggleAll(){
  const boxes=[...document.querySelectorAll('.pn-doc-check')];
  const allOn=boxes.length>0 && boxes.every(b=>b.checked);
  boxes.forEach(b=>{ b.checked=!allOn; });
  const btn=document.querySelector('.pn-check-all'); if(btn) btn.textContent=allOn?'Pilih Semua':'Kosongkan';
  pnDocUpdateCount();
}
/* Tautkan Data Pekerjaan ke halaman Ambil Nomor → nama pekerjaan dikunci agar
   PERSIS sama dengan yang dipakai di Rekap HPS, sehingga nomor HPS yang diambil di
   sini otomatis terhubung ke pekerjaan tersebut pada Rekap HPS (dicocokkan by nama). */
function pnApplyDp(rec){
  if(!rec) return;
  const kv=(document.getElementById('pn-uni-klas')||{}).value||'';
  pnState.ambil.dpId=String(rec.id);
  pnState.ambil.dpNama=rec.nama_pekerjaan||((rec.state&&rec.state.info&&rec.state.info.nama))||'';
  renderPnAmbil();
  const kEl=document.getElementById('pn-uni-klas'); if(kEl && kv) kEl.value=kv;
  toast('Data pekerjaan berhasil diterapkan','ok');
}
function pnLepasDp(){
  const kv=(document.getElementById('pn-uni-klas')||{}).value||'';
  delete pnState.ambil.dpId; delete pnState.ambil.dpNama;
  renderPnAmbil();
  const kEl=document.getElementById('pn-uni-klas'); if(kEl && kv) kEl.value=kv;
  toast('Pilihan pekerjaan dibatalkan','ok');
}
function pnAmbilUnifiedFormHtml(){
  const klasOpts   = PN_KLAS_OPTS.map(o=>'<option value="'+o.kode+'">'+o.label+'</option>').join('');
  const linked = !!(pnState.ambil && pnState.ambil.dpId);
  const dpNama = linked ? (pnState.ambil.dpNama||'') : '';
  const namaField = linked
    ? '<input id="pn-uni-nama" type="text" class="rho-input-locked" value="'+fkEsc(dpNama)+'" readonly title="Nama mengikuti Data Pekerjaan terpilih">'
    : '<input id="pn-uni-nama" type="text">';
  return '' +
  '<div class="form-card">' +
    '<div class="form-section-title">'+KR_SECTION_ICON+'Data Pekerjaan'+dpPickBtnHtml('pn')+'</div>' +
    '<div class="form-flow" style="--cols:3">' +
      '<div class="field"><label>Nama Pekerjaan <span class="req">*</span></label>'+namaField+'</div>' +
      '<div class="field"><label>Kode Klasifikasi <span class="req">*</span></label><select id="pn-uni-klas"><option value="">— Pilih —</option>'+klasOpts+'</select></div>' +
      '<div class="field pn-doc-bar-field"><label>&nbsp;</label>' +
        '<div class="pn-doc-bar">' +
          '<button type="button" class="btn btn-teal pn-doc-toggle" id="pn-doc-toggle" onclick="pnDocModalOpen()">' +
            PN_DOC_ICON+'<span>Dokumen</span>' +
            '<span class="pn-doc-count" id="pn-doc-count" style="display:none">0</span>' +
            '<svg class="pn-doc-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg>' +
          '</button>' +
          '<button class="btn btn-indigo pn-doc-save" type="button" onclick="pnAmbil()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>Ambil Nomor</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div id="pn-ambil-result"></div>' +
  '<div class="jp-actions" style="justify-content:flex-end;margin-top:14px">' +
    '<button class="btn btn-red" onclick="pnAmbilBatalClick()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg> Batal</button>' +
  '</div>';
}
/* Tombol Batal pada Ambil Nomor — minta konfirmasi, kosongkan isian formulir,
   lalu kembali ke halaman Lihat Nomor. Nomor yang SUDAH diterbitkan tetap
   tersimpan dan tidak terpengaruh. */
function pnAmbilBatalClick(){
  openConfirm({
    icon:'back', title:'Batal',
    text:'Apakah anda yakin ingin membatalkan? Isian formulir Ambil Nomor akan dikosongkan (nomor yang sudah diterbitkan tetap tersimpan).',
    onYes:function(){
      delete pnState.ambil.dpId; delete pnState.ambil.dpNama;
      pnState.lastResult=null;
      const nEl=document.getElementById('pn-uni-nama'); if(nEl) nEl.value='';
      const kEl=document.getElementById('pn-uni-klas'); if(kEl) kEl.value='';
      document.querySelectorAll('.pn-doc-check').forEach(function(c){ c.checked=false; });
      if(typeof pnDocUpdateCount==='function'){ try{ pnDocUpdateCount(); }catch(e){} }
      openPnLihat('pl');
    }
  });
}
function pnPendingHtml(label){
  return '<div class="panel pn-pending"><div class="empty">' + PN_WARN_ICON +
    '<div class="pn-pending-title">Penomoran ' + fkEsc(label) + ' belum dikonfigurasi</div>' +
    '<div class="pn-pending-desc">Daftar jenis dokumen dan kode penomoran untuk ' + fkEsc(label) +
    ' belum ditentukan. Silakan beri tahu daftar dokumen beserta kodenya (seperti HPS, BAP.PL, BAPP.PL, dst pada Pengadaan Langsung) agar menu ini dapat diaktifkan.</div>' +
    '</div></div>';
}

/* Cari record pekerjaan yang sudah ada (berdasarkan nama pekerjaan, modul & tahun).
   Nomor dokumen untuk nama pekerjaan yang sama akan ditumpuk pada baris tersebut. */
function pnFindWork(modul, nama, year){
  const key=String(nama||'').trim().toLowerCase();
  return records_penetapan.find(r=>
    r.modul===modul &&
    Number(r.tahun)===Number(year) &&
    String(r.nama_pekerjaan||'').trim().toLowerCase()===key
  );
}
/* ---- Ambil nomor (Pengadaan Langsung) — hanya dokumen yang dicentang ---- */
/* ---- Ambil nomor (gabungan Pengadaan Langsung + Tender) ----
   Dokumen yang dicentang dipisahkan menurut modul asalnya (PL / Tender),
   lalu tiap kelompok diterbitkan nomornya pada baris pekerjaan modul tersebut. */
function pnDocModulOf(key){
  if((PN_DOCS.pl||[]).some(d=>d.key===key)) return 'pl';
  if((PN_DOCS.tender||[]).some(d=>d.key===key)) return 'tender';
  return null;
}
async function pnIssueForModul(modul, nama, klas, checkedKeys, year, unit, today){
  const existing=pnFindWork(modul, nama, year);
  let klasUsed=klas;
  const usePj = (modul==='pl') && checkedKeys.includes('BAP');
  if(existing){
    const exKlas=String(existing.kode_klasifikasi||'');
    if(exKlas && exKlas!==klas){ const e=new Error('kode klasifikasi'); e.pnKlas=true; throw e; }
    klasUsed=exKlas || klas;
    const existingKeys=new Set((Array.isArray(existing.dokumen)?existing.dokumen:[]).map(d=>String(d.key)));
    const dup=checkedKeys.some(k=>existingKeys.has(String(k)));
    if(dup){ const e=new Error('data sudah ada'); e.pnDup=true; throw e; }
  }
  const seqCache={};
  const getSeq=(counter)=>{ if(seqCache[counter]==null) seqCache[counter]=pnNextSeq(modul,counter,year); return seqCache[counter]; };
  const newDocs=(PN_DOCS[modul]||[])
    .filter(d=> checkedKeys.includes(d.key))
    .map(d=>{
      const seq=getSeq(pnSeqCounter(d));
      return {key:d.key, code:d.code, label:d.label, seq, no:pnFormatNo(seq,d.code,klasUsed,unit,year),
              tgl_terbit:today, file:null};
    });
  if(existing){
    const merged=(Array.isArray(existing.dokumen)?existing.dokumen.slice():[]).concat(newDocs);
    if(usePj) existing.menggunakan_penjelasan=true;
    await StorePenetapan.setDokumen(existing.id, merged);
    existing.dokumen=merged;
    return Object.assign({modul}, existing);
  }else{
    const row={ modul, tahun:year, tgl_terbit:today,
      nama_pekerjaan:nama, kode_klasifikasi:klas, unit,
      menggunakan_penjelasan:usePj, dokumen:newDocs };
    const saved=await StorePenetapan.insert(row);
    if(saved) records_penetapan.unshift(saved); else records_penetapan.unshift(row);
    return saved ? Object.assign({modul}, saved) : Object.assign({modul}, row);
  }
}
async function pnAmbil(){
  if(!requireInput()) return;
  const el = id => document.getElementById(id);
  const nama = (el('pn-uni-nama') ? el('pn-uni-nama').value : '').trim();
  const klas = el('pn-uni-klas') ? el('pn-uni-klas').value : '';
  const checkedKeys = [...document.querySelectorAll('.pn-doc-check:checked')].map(b=>b.value);
  if(!nama){ toast('Nama Pekerjaan wajib diisi','warn'); el('pn-uni-nama') && el('pn-uni-nama').focus(); return; }
  if(!klas){ toast('Kode Klasifikasi wajib dipilih','warn'); return; }
  if(!checkedKeys.length){ toast('Pilih minimal satu dokumen untuk diterbitkan nomornya','warn'); return; }
  const plKeys=checkedKeys.filter(k=>pnDocModulOf(k)==='pl');
  const tnKeys=checkedKeys.filter(k=>pnDocModulOf(k)==='tender');

  let ok=false; const results=[];
  try{
    await withActionLoader('Menetapkan nomor', async()=>{
      await refreshDataPenetapan();           // sinkron dulu agar nomor tidak bentrok
      const year=pnYear(), unit=PN_UNIT, today=pnTodayISO();
      if(plKeys.length) results.push(await pnIssueForModul('pl', nama, klas, plKeys, year, unit, today));
      if(tnKeys.length) results.push(await pnIssueForModul('tender', nama, klas, tnKeys, year, unit, today));
    });
    ok=true;
  }catch(err){
    if(err && err.pnKlas){ toast('Gagal menetapkan nomor; kode klasifikasi','err'); return; }
    if(err && err.pnDup){ toast('Gagal menetapkan nomor; data sudah ada','err'); return; }
    console.error(err); toast('Gagal menetapkan nomor: '+errMsg(err),'err'); return;
  }
  if(!ok) return;
  toast('Nomor berhasil ditetapkan','ok');
  // kosongkan isian agar siap penetapan berikutnya (nama dipertahankan bila
  // sedang tertaut ke Data Pekerjaan agar tautan ke Rekap HPS tetap konsisten)
  const pnLinked=!!(pnState.ambil && pnState.ambil.dpId);
  if(el('pn-uni-nama') && !pnLinked) el('pn-uni-nama').value='';
  if(el('pn-uni-klas')) el('pn-uni-klas').value='';
  document.querySelectorAll('.pn-doc-check').forEach(b=>b.checked=false);
  const allBtn=document.querySelector('.pn-check-all'); if(allBtn) allBtn.textContent='Pilih Semua';
  pnDocUpdateCount();
  pnDocModalHide();
  pnState.lastResult = results;
  pnRenderResult(results);
}
function pnRenderResult(res){
  const box=document.getElementById('pn-ambil-result'); if(!box || !res) return;
  const list = Array.isArray(res) ? res.filter(Boolean) : [res];
  if(!list.length) return;
  const cardFor=(r)=>{
    const docs=Array.isArray(r.dokumen)?r.dokumen:[];
    // hanya tampilkan dokumen dari penetapan terbaru? Tampilkan seluruh dokumen pada baris tsb.
    const items=docs.map(d=>
      '<div class="pn-doc-card">' +
        '<div class="pn-doc-ic">'+PN_DOC_ICON+'</div>' +
        '<div class="pn-doc-meta"><div class="pn-doc-label">'+fkEsc(d.label)+'</div><div class="pn-doc-no">'+fkEsc(d.no)+'</div></div>' +
        '<button class="pn-copy" title="Salin" onclick="pnCopy(this,\''+fkEsc(d.no)+'\')">'+PN_COPY_ICON+'</button>' +
      '</div>').join('');
    const modLabel = (PN_MODULES[r.modul] ? PN_MODULES[r.modul].label : r.modul);
    return '<div class="form-card pn-result">' +
        '<div class="form-section-title">'+PN_CHECK_ICON+'Nomor Ditetapkan — '+fkEsc(modLabel)+' · '+fkEsc(r.nama_pekerjaan||'')+'</div>' +
        items +
      '</div>';
  };
  box.innerHTML = list.map(cardFor).join('');
  box.scrollIntoView({behavior:'smooth', block:'nearest'});
}
function pnCopy(btn, text){
  const done=()=>{ if(btn){ btn.classList.add('pn-copied'); setTimeout(()=>btn.classList.remove('pn-copied'),1200); } toast('Nomor disalin','ok'); };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(()=>pnFallbackCopy(text,done));
  }else pnFallbackCopy(text,done);
}
function pnFallbackCopy(text, cb){
  try{ const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.focus(); ta.select(); document.execCommand('copy'); ta.remove(); cb&&cb(); }catch(e){}
}

/* ---- Halaman Lihat Nomor ---- */
function pnClearLihatFilters(){
  const s=document.getElementById('pn-lihat-search'); if(s) s.value='';
}
function pnFilterLihat(){ pnState.lihat.page=1; renderPnLihat(); }
function pnResetLihat(){ pnClearLihatFilters(); pnState.lihat.page=1; renderPnLihat(); }
function pnLihatRows(){
  // Gabungan seluruh modul (Pengadaan Langsung + Tender)
  let rows=(records_penetapan||[]).slice();
  const fs=(document.getElementById('pn-lihat-search')?.value||'').toLowerCase().trim();
  if(fs) rows=rows.filter(r=>String(r.nama_pekerjaan||'').toLowerCase().includes(fs));
  return rows;
}
/* Badge metode pengadaan untuk tabel Lihat Nomor gabungan */
function pnMetodeBadge(modul){
  const isT = String(modul)==='tender';
  return '<span class="pn-metode-badge '+(isT?'pn-badge-tender':'pn-badge-pl')+'">'+
    (isT?'Tender':'Pengadaan Langsung')+'</span>';
}
function renderPnLihat(){
  const sec=document.getElementById('view-pn-lihat');
  // Tabel gabungan memakai layout auto agar label jenis dokumen (PL & Tender) tidak terpotong.
  if(sec){ sec.classList.add('pn-modul-tender'); sec.classList.remove('pn-modul-pl'); }
  const tb=document.getElementById('pn-lihat-body');
  const pg=document.getElementById('pn-lihat-pagination');
  const cEl=document.getElementById('pn-lihat-count');
  if(!tb) return;
  const rows=pnLihatRows();
  if(cEl) cEl.textContent=rows.length;
  const total=rows.length;
  if(total===0){ tb.innerHTML=pnEmptyRow(); if(pg) pg.innerHTML=''; return; }
  const st=pnState.lihat;
  const totalPages=Math.max(1,Math.ceil(total/PN_PAGE_SIZE));
  if(st.page>totalPages) st.page=totalPages;
  if(st.page<1) st.page=1;
  const start=(st.page-1)*PN_PAGE_SIZE;
  const pageRows=rows.slice(start,start+PN_PAGE_SIZE);
  tb.innerHTML=pageRows.map((r,i)=>{
    const nama=r.nama_pekerjaan||'—';
    return '<tr>' +
      '<td class="col-no">'+(start+i+1)+'</td>' +
      '<td class="wrap-cell col-nama-freeze">'+fkEsc(nama)+'</td>' +
      '<td class="pn-col-jenis">'+pnJenisCellHtml(r)+'</td>' +
      '<td class="pn-col-nomor">'+pnNomorCellHtml(r)+'</td>' +
      '<td class="pn-col-tgl">'+pnTglCellHtml(r)+'</td>' +
      '<td class="pn-col-aksi">'+pnActionCellHtml(r)+'</td>' +
    '</tr>';
  }).join('');
  revealTbody(tb);
  pnRenderPagination(st.page, totalPages, pg);
}
function pnEmptyRow(){
  return '<tr><td colspan="6"><div class="empty">'+PN_HASH_ICON+'<div>Data tidak tersedia</div></div></td></tr>';
}
function pnJenisCellHtml(r){
  const docs=Array.isArray(r.dokumen)?r.dokumen:[];
  if(!docs.length) return '—';
  return '<div class="pn-nomor-list">'+docs.map(d=>
    '<div class="pn-nomor-item pn-jenis-item">' +
      '<span class="pn-nomor-jenis">'+fkEsc(PN_JENIS[d.key]||d.label||'')+'</span>' +
    '</div>').join('')+'</div>';
}
function pnNomorCellHtml(r){
  const docs=Array.isArray(r.dokumen)?r.dokumen:[];
  if(!docs.length) return '—';
  return '<div class="pn-nomor-list">'+docs.map(d=>
    '<div class="pn-nomor-item">' +
      '<span class="pn-nomor-val">'+fkEsc(d.no)+'</span>' +
      '<button class="pn-copy" title="Salin" onclick="pnCopy(this,\''+fkEsc(d.no)+'\')">'+PN_COPY_ICON+'</button>' +
    '</div>').join('')+'</div>';
}
/* Tgl. Terbit per masing-masing nomor dokumen */
function pnTglCellHtml(r){
  const docs=Array.isArray(r.dokumen)?r.dokumen:[];
  if(!docs.length) return '—';
  return '<div class="pn-nomor-list">'+docs.map(d=>{
    const tgl=fmtDate(d.tgl_terbit!=null?d.tgl_terbit:r.tgl_terbit)||'—';
    return '<div class="pn-nomor-item pn-tgl-item"><span class="pn-tgl-val">'+tgl+'</span></div>';
  }).join('')+'</div>';
}
/* Aksi (unggah/lihat/unduh/hapus) per masing-masing nomor dokumen */
function pnActionCellHtml(r){
  const docs=Array.isArray(r.dokumen)?r.dokumen:[];
  if(!docs.length) return '—';
  const allow=canInput();
  const upIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v13"/></svg>';
  const eyeIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
  const delIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>';
  const rid=fkEsc(String(r.id));
  return '<div class="pn-nomor-list">'+docs.map(d=>{
    const dk=fkEsc(String(d.key));
    const hasFile=!!(d.file && d.file.nama_file);
    const up = allow ? '<button class="act act-up" title="'+(hasFile?'Ganti File':'Unggah File')+'" onclick="pnUpload(\''+rid+'\',\''+dk+'\',this)">'+upIcon+'</button>' : '';
    const lihat = hasFile
      ? '<button class="act act-view" title="Lihat File" onclick="pnPreview(\''+rid+'\',\''+dk+'\')">'+eyeIcon+'</button>'
      : '<button class="act act-view" title="Belum ada file" disabled>'+eyeIcon+'</button>';
    const del = allow ? '<button class="act act-del" title="Hapus Nomor" onclick="pnDelete(\''+rid+'\',\''+dk+'\',this)">'+delIcon+'</button>' : '';
    return '<div class="pn-nomor-item pn-aksi-item"><div class="pn-actions">'+up+lihat+del+'</div></div>';
  }).join('')+'</div>';
}
/* Cari dokumen dalam record berdasarkan key */
function pnFindDoc(r, key){
  const docs=Array.isArray(r.dokumen)?r.dokumen:[];
  return docs.find(d=>String(d.key)===String(key));
}
function pnRenderPagination(page, totalPages, el){
  if(!el) return;
  if(totalPages<=1){ el.innerHTML=''; return; }
  const want=new Set([1,totalPages,page-1,page,page+1]);
  const list=[...want].filter(p=>p>=1&&p<=totalPages).sort((a,b)=>a-b);
  let html='<button class="pg-btn" '+(page===1?'disabled':'')+' onclick="pnGoToLihatPage('+(page-1)+')">‹ Sebelumnya</button>';
  let prev=0;
  list.forEach(p=>{
    if(p-prev>1) html+='<span class="pg-ellipsis">…</span>';
    html+='<button class="pg-btn pg-num '+(p===page?'active':'')+'" onclick="pnGoToLihatPage('+p+')">'+p+'</button>';
    prev=p;
  });
  html+='<button class="pg-btn" '+(page===totalPages?'disabled':'')+' onclick="pnGoToLihatPage('+(page+1)+')">Berikutnya ›</button>';
  el.innerHTML=html;
}
function pnGoToLihatPage(p){
  pnState.lihat.page=p;
  withQuickLoader('Memuat', ()=>{ renderPnLihat(); document.querySelector('#view-pn-lihat .panel')?.scrollIntoView({behavior:'smooth',block:'nearest'}); }, 480);
}

/* ---- Lihat / Pratinjau file lampiran ---- */
let pnPreviewCtx=null;   // {url, name}
/* Ambil array dokumen terkini (dari cache; muat dari server bila file belum ter-cache) */
async function pnEnsureDokumen(r){
  const docs=Array.isArray(r.dokumen)?r.dokumen:[];
  const needFetch=docs.some(d=>d.file && d.file.nama_file && !d.file.data_base64);
  if(needFetch){
    const fresh=await StorePenetapan.getDokumen(r.id);
    if(Array.isArray(fresh)){ r.dokumen=fresh; return fresh; }
  }
  return docs;
}
async function pnPreview(id, key){
  const r=records_penetapan.find(x=>String(x.id)===String(id)); if(!r) return;
  let d=pnFindDoc(r,key);
  if(!d || !d.file || !d.file.nama_file){ toast('Belum ada file untuk dipratinjau','warn'); return; }
  const titleEl=document.getElementById('pn-preview-title');
  const bodyEl=document.getElementById('pn-preview-body');
  if(titleEl) titleEl.textContent=d.file.nama_file;
  pnCleanupPreview();
  const _mdl=document.querySelector('#pn-preview-overlay .pn-preview-modal'); if(_mdl) _mdl.classList.remove('is-max');
  pnPreviewResetMaxBtn();
  if(bodyEl) bodyEl.innerHTML='<div class="pn-preview-nofile">Memuat pratinjau…</div>';
  document.getElementById('pn-preview-overlay').classList.add('show');
  try{
    await pnEnsureDokumen(r);
    d=pnFindDoc(r,key);
    const f=d && d.file;
    if(!f || !f.data_base64){ if(bodyEl) bodyEl.innerHTML=pnPreviewNoFileHtml(f&&f.nama_file,'File tidak tersedia.'); return; }
    const mime=f.mime||'application/octet-stream';
    const url=URL.createObjectURL(fkB64ToBlob(f.data_base64, mime));
    pnPreviewCtx={url, name:f.nama_file||'file'};
    const nm=(f.nama_file||'').toLowerCase();
    const isPdf=mime.includes('pdf')||nm.endsWith('.pdf');
    const isImg=mime.indexOf('image/')===0||/\.(png|jpe?g|gif|webp|bmp)$/.test(nm);
    if(!bodyEl) return;
    if(isPdf){ bodyEl.innerHTML='<iframe title="Pratinjau PDF"></iframe>'; bodyEl.querySelector('iframe').src=url; }
    else if(isImg){ bodyEl.innerHTML='<img alt="Pratinjau gambar">'; bodyEl.querySelector('img').src=url; }
    else{ bodyEl.innerHTML=pnPreviewNoFileHtml(pnPreviewCtx.name,'Jenis file ini tidak dapat dipratinjau. Silakan unduh untuk membukanya.'); }
  }catch(err){ console.error('pnPreview:',err); if(bodyEl) bodyEl.innerHTML=pnPreviewNoFileHtml(d&&d.file&&d.file.nama_file,'Gagal memuat file: '+errMsg(err)); }
}
function pnPreviewNoFileHtml(name, msg){
  return '<div class="pn-preview-nofile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg><div class="fn">'+fkEsc(name||'')+'</div><div style="margin-top:6px;font-size:11.5px">'+fkEsc(msg||'')+'</div></div>';
}
function pnPreviewToggleMax(){
  const modal=document.querySelector('#pn-preview-overlay .pn-preview-modal');
  if(!modal) return;
  const on=modal.classList.toggle('is-max');
  const label=document.getElementById('pn-preview-max-label');
  if(label) label.textContent = on ? 'Perkecil' : 'Perbesar';
  const icon=document.getElementById('pn-preview-max-icon');
  if(icon){
    icon.innerHTML = on
      ? '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>'   // minimize
      : '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>';  // maximize
  }
}
function pnCleanupPreview(){ if(pnPreviewCtx && pnPreviewCtx.url){ try{ URL.revokeObjectURL(pnPreviewCtx.url); }catch(e){} } pnPreviewCtx=null; }
function pnPreviewResetMaxBtn(){
  const lbl=document.getElementById('pn-preview-max-label'); if(lbl) lbl.textContent='Perbesar';
  const icon=document.getElementById('pn-preview-max-icon');
  if(icon) icon.innerHTML='<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>';  // maximize
}
function closePnPreview(){ const ov=document.getElementById('pn-preview-overlay'); if(ov) ov.classList.remove('show'); const modal=ov&&ov.querySelector('.pn-preview-modal'); if(modal) modal.classList.remove('is-max'); pnPreviewResetMaxBtn(); const b=document.getElementById('pn-preview-body'); if(b){ b.innerHTML=''; b.classList.remove('fkl-preview-body'); b.classList.remove('has-tabs'); } const fp=document.getElementById('fkl-preview-print'); if(fp) fp.remove(); const pp=document.getElementById('pnw-preview-print'); if(pp) pp.remove(); const rp=document.getElementById('rho-preview-print'); if(rp) rp.remove(); const hp=document.getElementById('hps-preview-print'); if(hp) hp.remove(); const cp=document.getElementById('hpsc-preview-print'); if(cp) cp.remove(); const ap=document.getElementById('ana-preview-print'); if(ap) ap.remove(); const sp=document.getElementById('spk-preview-print'); if(sp) sp.remove(); if(typeof fklPreviewState!=='undefined') fklPreviewState=null; if(typeof pnwPreviewState!=='undefined') pnwPreviewState=null; if(typeof rhoPreviewState!=='undefined') rhoPreviewState=null; if(typeof hpsPreviewState!=='undefined') hpsPreviewState=null; if(typeof anaPreviewState!=='undefined') anaPreviewState=null; pnCleanupPreview(); }

/* ---- Upload / Download / Hapus lampiran (per masing-masing nomor dokumen) ---- */
let pnUploadCtx=null;
function pnUpload(id, key, btn){
  if(!requireInput()) return;
  const inp=document.getElementById('pn-file-input'); if(!inp) return;
  pnUploadCtx={id, key, btn}; inp.value=''; inp.click();
}
async function pnHandleFileSelected(file){
  const ctx=pnUploadCtx; pnUploadCtx=null;
  if(!ctx || !file) return;
  const {id, key, btn}=ctx;
  const isPdf = (file.type==='application/pdf') || /\.pdf$/i.test(file.name||'');
  if(!isPdf){ toast('File harus dalam bentuk PDF','warn'); return; }
  if(file.size > PN_MAX_MB*1048576){ toast('Ukuran file melebihi batas '+PN_MAX_MB+' MB','warn'); return; }
  const r=records_penetapan.find(x=>String(x.id)===String(id));
  if(!r){ toast('Data tidak ditemukan','warn'); return; }
  if(btn) btn.classList.add('is-busy');
  pnUploadProgressOpen(file.name);
  // progres semu untuk fase simpan (menuju 95%)
  let creep=null;
  try{
    // Fase baca file: 0 -> 70%
    const b64=await fkFileToBase64Progress(file, frac=>{ pnUploadProgressSet(frac*70); });
    pnUploadProgressSet(72);
    // pastikan array dokumen lengkap (agar file lain tidak hilang saat update)
    await pnEnsureDokumen(r);
    const docs=(Array.isArray(r.dokumen)?r.dokumen:[]).map(d=>{
      if(String(d.key)!==String(key)) return d;
      return Object.assign({}, d, { file:{ nama_file:file.name, mime:file.type||'application/pdf', ukuran:file.size, data_base64:b64 } });
    });
    // fase simpan: naikkan perlahan 72 -> 95 selama menunggu server
    let p=72; creep=setInterval(()=>{ p=Math.min(95,p+2); pnUploadProgressSet(p); }, 120);
    await StorePenetapan.setDokumen(id, docs);
    clearInterval(creep); creep=null;
    r.dokumen=docs;
    pnUploadProgressDone(()=>{ toast('File berhasil diunggah','ok'); renderPnLihat(); });
  }catch(err){
    if(creep) clearInterval(creep);
    pnUploadProgressClose();
    console.error(err); toast('Gagal mengunggah file: '+errMsg(err),'err');
    if(btn) btn.classList.remove('is-busy');
  }
}
async function pnDownload(id, key, btn){
  if(btn) btn.classList.add('is-busy');
  try{
    const r=records_penetapan.find(x=>String(x.id)===String(id));
    if(!r){ toast('Data tidak ditemukan','warn'); return; }
    await pnEnsureDokumen(r);
    const d=pnFindDoc(r,key);
    const f=d && d.file;
    if(!f || !f.data_base64){ toast('File tidak tersedia','warn'); return; }
    const blob=fkB64ToBlob(f.data_base64, f.mime);
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=f.nama_file||'lampiran-penetapan';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
  }catch(err){ console.error('pnDownload:', err); toast('Gagal mengunduh file: '+errMsg(err),'warn'); }
  finally{ if(btn) btn.classList.remove('is-busy'); }
}
/* Hapus satu nomor dokumen. Nomor yang dihapus kembali tersedia (gap-fill).
   Jika dokumen terakhir dalam record, seluruh record ikut terhapus. */
function pnDelete(id, key, btn){
  if(!requireInput()) return;
  const r=records_penetapan.find(x=>String(x.id)===String(id));
  if(!r){ toast('Data tidak ditemukan','warn'); return; }
  const d=pnFindDoc(r,key);
  const docs=Array.isArray(r.dokumen)?r.dokumen:[];
  const jenis=d ? (PN_JENIS[d.key]||d.label||'') : '';
  const isLast=docs.length<=1;
  openConfirm({
    icon:'del', title:'Hapus Nomor',
    text:'Apakah anda yakin ingin menghapus nomor dokumen?',
    onYes:async()=>{
      try{
        if(isLast){
          await withActionLoader('Menghapus', async()=>{ await StorePenetapan.remove(id); });
          records_penetapan=records_penetapan.filter(x=>String(x.id)!==String(id));
        }else{
          await pnEnsureDokumen(r);
          const next=(Array.isArray(r.dokumen)?r.dokumen:[]).filter(x=>String(x.key)!==String(key));
          await withActionLoader('Menghapus', async()=>{ await StorePenetapan.setDokumen(id, next); });
          r.dokumen=next;
        }
      }catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'warn'); return; }
      toast('Nomor berhasil dihapus','ok');
      renderPnLihat();
    }
  });
}
(function(){
  const inp=document.getElementById('pn-file-input');
  if(inp) inp.addEventListener('change', e=>{ const f=e.target.files&&e.target.files[0]; pnHandleFileSelected(f); });
})();


/* (Modul Pembuatan Kontrak dihapus) */

/* ==================================================================
   FORM — KELENGKAPAN DOKUMEN PENGADAAN (Pengadaan Langsung & Tender)
   Alur wizard 3 langkah:
     1) Data Pekerjaan  → [Batal] [Selanjutnya]
     2) Pilih Dokumen (gabungan Wajib+Tambahan) → [Batal] [Kembali] [Selanjutnya]
     3) Kelengkapan Dokumen (Ada / Tidak Ada) → [Batal] [Sebelumnya] [Simpan & Lihat]
   Simpan & Lihat → Pratinjau PDF elegan:
     "FORM PEMERIKSAAN KELENGKAPAN DOKUMEN PENGADAAN"
   ================================================================== */
const FKL_JENIS_ANGGARAN = ['Investasi','Operasi'];
const FKL_METODE = ['Pengadaan Langsung','Tender Terbuka','Tender Terbatas','Seleksi Umum','Seleksi Terbatas','Penunjukan Langsung','Tender Cepat'];
const FKL_DOCS = {
  pl:{ label:'Pengadaan Langsung',
    wajib:[
      'ND Pelaksanaan Pengadaan',
      'Dokumen Rencana Pengadaan (DRP)',
      'Dokumen TOR/KAK',
      'Dokumen RAB',
      'Surat Anggaran',
      'Risiko Pekerjaan',
      'Pakta Integritas Pengguna',
      'Pakta Integritas Direksi Pekerjaan'
    ],
    tambahan:[
      'Spesifikasi Teknis',
      'Gambar Pekerjaan',
      'Referensi Harga',
      'Kajian Kelayakan Proyek',
      'Kajian Risiko'
    ]
  },
  tender:{ label:'Tender',
    wajib:[
      'Inisialisasi Pengadaan',
      'ND Pelaksanaan Pengadaan',
      'ND Perencanaan Pengadaan',
      'Dokumen Rencana Pengadaan (DRP)',
      'Dokumen Kualifikasi',
      'Dokumen Tender/RKS',
      'Dokumen TOR/KAK',
      'Dokumen RAB',
      'Dokumen HPE',
      'Surat Anggaran',
      'Risiko Pekerjaan',
      'Pakta Integritas Pengguna',
      'Pakta Integritas Direksi Pekerjaan'
    ],
    tambahan:[
      'Spesifikasi Teknis',
      'Gambar Pekerjaan',
      'Referensi Harga',
      'Kajian Kelayakan Proyek',
      'Kajian Risiko'
    ]
  }
};
/* Gabungan dokumen (Wajib + Tambahan) untuk langkah "Pilih Dokumen".
   Diambil dari modul Tender sesuai permintaan (superset terlengkap). */
function fklDocPool(){
  const t = FKL_DOCS.tender;
  const seen = {}; const pool = [];
  t.wajib.concat(t.tambahan).forEach(nama=>{
    if(!seen[nama]){ seen[nama]=true; pool.push(nama); }
  });
  return pool;
}
const FKL_INFO_FIELDS=[
  {key:'nama',          label:'Nama Pekerjaan',      type:'text', span:2},
  {key:'lokasi',        label:'Lokasi Pekerjaan',    type:'text', span:2},
  {key:'nilai',         label:'Nilai Pekerjaan',     type:'num'},
  {key:'no_anggaran',   label:'No. Anggaran',        type:'text'},
  {key:'tgl_anggaran',  label:'Tgl. Anggaran',       type:'date'},
  {key:'jenis_anggaran',label:'Jenis Anggaran',      type:'select', options:FKL_JENIS_ANGGARAN},
  {key:'metode',        label:'Metode Pengadaan',    type:'select', span:2, options:FKL_METODE},
  {key:'menyerahkan',   label:'Yang Menyerahkan',    type:'text', ph:'Nama pegawai'},
  {key:'menerima',      label:'Yang Menerima',       type:'text', ph:'Nama pegawai'},
  {key:'tgl_terima',    label:'Tgl. Terima Dokumen', type:'date'}
];
let fklModul='pl';
let fklStep=1;               // 1 = Data, 2 = Pilih Dokumen, 3 = Kelengkapan
const FKL_STATE_KEY='fkl_state_v2';
/* State per modul:
   info   : { key: value }
   pilih  : { "Nama Dokumen": true|false }   (dipilih untuk diperiksa)
   ada    : { "Nama Dokumen": true|false }   (hasil pemeriksaan: Ada / Tidak Ada) */
function fklBlankState(){ return { info:{}, pilih:{}, ada:{} }; }
let fklState = { pl:fklBlankState(), tender:fklBlankState() };
/* Buffer wizard bersifat transien: disimpan di sessionStorage (ikut hilang saat
   tab ditutup), konsisten dengan draft form lain. TIDAK memakai localStorage. */
(function fklLoadState(){
  try{ const raw=ssGet(FKL_STATE_KEY); if(raw){ const o=JSON.parse(raw); if(o&&o.pl&&o.tender) fklState=o; } }catch(e){}
})();
function fklSaveState(){ try{ ssSet(FKL_STATE_KEY, JSON.stringify(fklState)); }catch(e){} }

/* ==================================================================
   Penyimpanan data Kelengkapan — SEPENUHNYA di Supabase
   (tabel `kelengkapan_dokumen`). Tidak ada fallback localStorage.
   ================================================================== */
const FKL_TABLE='kelengkapan_dokumen';
const FKL_RECS_KEY='fkl_records_v1';   // kunci lama (hanya untuk migrasi & pembersihan)
let records_kelengkapan = [];
let fklEditId = null;          // id record yang sedang diubah (null = tambah baru)
let fklPreviewState = null;    // state khusus untuk pratinjau record tersimpan

function fklSupaReady(){ return !!(USE_SUPABASE && db); }

const StoreKelengkapan = {
  async list(){
    if(!fklSupaReady()) return [];
    const {data,error}=await db.from(FKL_TABLE).select('*').order('created_at',{ascending:false});
    if(error) throw error;
    return data||[];
  },
  async create(rec){
    if(!fklSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(FKL_TABLE).insert(rec).select();
    if(error) throw error; return data&&data[0];
  },
  async update(rid, rec){
    if(!fklSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(FKL_TABLE).update(rec).eq('id',rid);
    if(error) throw error;
  },
  async remove(rid){
    if(!fklSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(FKL_TABLE).delete().eq('id',rid);
    if(error) throw error;
  }
};

/* Pembersihan kunci lama: seluruh data kini di Supabase. Fungsi ini TIDAK
   membaca atau memindahkan data apa pun dari localStorage — hanya menghapus
   sisa kunci penyimpanan lokal versi lama agar tidak menumpuk. Aman & idempotent. */
async function fklMigrateLocalToSupabase(){
  try{
    localStorage.removeItem(FKL_RECS_KEY);   // 'fkl_records_v1' (Kelengkapan versi lama)
  }catch(e){}
}
async function refreshDataKelengkapan(){
  try{
    await fklMigrateLocalToSupabase();   // pindahkan sisa data lokal (jika ada) ke Supabase
    records_kelengkapan = await StoreKelengkapan.list();
  }catch(err){
    console.error(err); records_kelengkapan = records_kelengkapan||[];
    toast('Gagal memuat data Kelengkapan: '+errMsg(err),'err');
  }
}

/* ---- Input Data (wizard). editId opsional untuk mode ubah ---- */
function openFklInput(editId){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  fklPreviewState=null;
  if(editId){
    const rec=records_kelengkapan.find(r=>String(r.id)===String(editId));
    fklEditId = rec ? rec.id : null;
    fklState[fklModul] = rec ? fklRecordToState(rec) : fklBlankState();
  }else{
    fklEditId = null;
    fklState[fklModul] = fklBlankState();
    resetInputBaru('fkl');
  }
  fklSaveState();
  fklStep=1; showView('form-kelengkapan');
}
/* Alias lama */
function openFormKelengkapan(){ openFklInput(); }

/* ---- Lihat Data ---- */
function openFklView(){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  refreshDataKelengkapan().then(()=>showView('fkl-view'));
}
function openFormPembukaan(){ openPnwInput(); }

/* Konversi record tersimpan -> state wizard */
function fklRecordToState(rec){
  return {
    info: (rec && rec.info && typeof rec.info==='object') ? Object.assign({}, rec.info) : {},
    pilih:(rec && rec.pilih && typeof rec.pilih==='object') ? Object.assign({}, rec.pilih) : {},
    ada:  (rec && rec.ada && typeof rec.ada==='object') ? Object.assign({}, rec.ada) : {}
  };
}

function fklMarkActive(){
  document.querySelectorAll('.topnav-item[data-view="form-kelengkapan"]').forEach(b=>{
    b.classList.add('active');
  });
}

const FKL_SEC_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>';

/* ---------- Stepper header ---------- */
function fklStepperHtml(){
  const steps=[['1','Data Pekerjaan'],['2','Pilih Dokumen'],['3','Kelengkapan']];
  return '<div class="fkl-stepper">'+steps.map((s,i)=>{
    const n=i+1;
    const cls = n<fklStep ? 'done' : (n===fklStep ? 'active' : '');
    const mark = n<fklStep
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>'
      : s[0];
    const line = i<steps.length-1 ? '<div class="fkl-step-line '+(n<fklStep?'done':'')+'"></div>' : '';
    return '<div class="fkl-step '+cls+'"><div class="fkl-step-dot">'+mark+'</div><div class="fkl-step-name">'+s[1]+'</div></div>'+line;
  }).join('')+'</div>';
}

/* ---------- Field input ---------- */
const FKL_DP_LOCK_KEYS=['nama','lokasi','nilai','no_anggaran','tgl_anggaran','jenis_anggaran','metode'];
function fklIsLocked(key){ const st=fklState[fklModul]; return !!(st && st.info && st.info.dpId) && FKL_DP_LOCK_KEYS.indexOf(key)>=0; }
function fklInfoInputHtml(f){
  const id='fkl-'+f.key;
  const span=f.span?(' style="grid-column:span '+f.span+'"'):'';
  const locked=fklIsLocked(f.key); const dis=locked?' disabled':'';
  let ctl;
  if(f.type==='select') ctl='<select id="'+id+'"'+dis+' onchange="fklOnInfoChange()"><option value="">— Pilih —</option>'+(f.options||[]).map(o=>'<option>'+fkEsc(o)+'</option>').join('')+'</select>';
  else if(f.type==='num') ctl='<input id="'+id+'" type="text" inputmode="numeric" placeholder="Rp"'+dis+' oninput="onRupiahInput(this)" onchange="fklOnInfoChange()">';
  else if(f.type==='date') ctl='<input id="'+id+'" type="date"'+dis+' onchange="fklOnInfoChange()">';
  else ctl='<input id="'+id+'" type="text"'+dis+(f.ph?' placeholder="'+fkEsc(f.ph)+'"':'')+' oninput="fklOnInfoChange()">';
  return '<div class="field'+(locked?' is-locked':'')+'"'+span+'><label>'+fkEsc(f.label)+'</label>'+ctl+(locked?DP_LOCK_BADGE:'')+'</div>';
}

/* ---------- Langkah 2: pilih dokumen ---------- */
function fklPilihHtml(){
  const pool=fklDocPool(), st=fklState[fklModul];
  return pool.map((nama,i)=>{
    const on=!!st.pilih[nama];
    return '<label class="fkl-check">'+
      '<input type="checkbox" data-nama="'+fkEsc(nama)+'" '+(on?'checked':'')+' onchange="fklOnPilih(this)">'+
      '<span class="pn-check-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></span>'+
      '<span class="fkl-num">'+(i+1)+'</span>'+
      '<span class="fkl-lbl">'+fkEsc(nama)+'</span>'+
    '</label>';
  }).join('');
}

/* ---------- Langkah 3: hasil pemeriksaan (Ada / Tidak Ada) ---------- */
function fklSelectedDocs(){
  const st=fklActiveState();
  return fklDocPool().filter(nama=>st.pilih[nama]);
}
function fklAdaHtml(){
  const st=fklState[fklModul], list=fklSelectedDocs();
  if(!list.length) return '<div class="fkl-empty-note">Belum ada dokumen yang dipilih. Kembali ke langkah <b>Pilih Dokumen</b> untuk memilih berkas yang akan diperiksa.</div>';
  return '<div class="fkl-ada-list">'+list.map((nama,i)=>{
    const val=st.ada[nama];                 // true=Ada, false=Tidak Ada, undefined=belum
    const yes=val===true, no=val===false;
    return '<div class="fkl-ada-row">'+
      '<span class="fkl-ada-num">'+(i+1)+'</span>'+
      '<span class="fkl-ada-name">'+fkEsc(nama)+'</span>'+
      '<span class="fkl-ada-opts">'+
        '<button type="button" class="fkl-ada-btn ada'+(yes?' on':'')+'" onclick="fklSetAda(\''+fkEsc(nama).replace(/'/g,"\\'")+'\',true)">'+
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M20 6 9 17l-5-5"/></svg>Ada</button>'+
        '<button type="button" class="fkl-ada-btn no'+(no?' on':'')+'" onclick="fklSetAda(\''+fkEsc(nama).replace(/'/g,"\\'")+'\',false)">'+
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M18 6 6 18M6 6l12 12"/></svg>Tidak Ada</button>'+
      '</span>'+
    '</div>';
  }).join('')+'</div>';
}

/* ---------- Render utama ---------- */
function renderFormKelengkapan(){
  fklMarkActive();
  const def=FKL_DOCS[fklModul];
  const tt=document.getElementById('fkl-title'); if(tt) tt.textContent='Kelengkapan Dokumen Pengadaan'+(fklEditId?' — Ubah Data':' — Input Data');
  const sub=document.getElementById('fkl-sub');
  const cont=document.getElementById('fkl-content'); if(!cont) return;
  const st=fklState[fklModul];
  let html=fklStepperHtml();

  if(fklStep===1){
    if(sub) sub.textContent='Langkah 1 dari 3 — Lengkapi data pekerjaan';
    html+='<div class="form-card"><div class="form-section-title">'+KR_SECTION_ICON+'Data Pekerjaan'+dpPickBtnHtml('fkl')+'</div><div class="form-flow" style="--cols:4">';
    html+=FKL_INFO_FIELDS.map(fklInfoInputHtml).join('');
    html+='</div></div>';
    html+='<div class="fkl-actions"><div class="fkl-actions-right">'+
      '<button class="btn btn-red" onclick="fklBatal()">'+FKL_IC_X+'Batal</button>'+
      '<button class="btn btn-teal" onclick="fklNext()">Selanjutnya'+FKL_IC_NEXT+'</button>'+
    '</div></div>';
  }
  else if(fklStep===2){
    if(sub) sub.textContent='Langkah 2 dari 3 — Pilih dokumen yang akan diperiksa';
    const sel=fklSelectedDocs().length;
    html+='<div class="form-card"><div class="form-section-title">'+FKL_SEC_ICON+'Pilih Dokumen '+
      '<span class="fkl-count-chip">'+sel+' dipilih</span></div>'+
      '<div class="fkl-hint">Centang dokumen yang perlu diperiksa kelengkapannya (gabungan Dokumen Wajib &amp; Dokumen Tambahan).</div>'+
      '<div class="fkl-checkgrid" style="--rows:'+Math.ceil(fklDocPool().length/2)+'">'+fklPilihHtml()+'</div>'+
    '</div>';
    html+='<div class="fkl-actions"><div class="fkl-actions-right">'+
        '<button class="btn btn-red" onclick="fklBatal()">'+FKL_IC_X+'Batal</button>'+
        '<button class="btn btn-light" onclick="fklBack()">'+FKL_IC_BACK+'Kembali</button>'+
        '<button class="btn btn-teal" onclick="fklNext()">Selanjutnya'+FKL_IC_NEXT+'</button>'+
    '</div></div>';
  }
  else{
    if(sub) sub.textContent='Langkah 3 dari 3 — Tandai ketersediaan tiap dokumen';
    html+='<div class="form-card"><div class="form-section-title">'+FKL_SEC_ICON+'Kelengkapan Dokumen</div>'+
      '<div class="fkl-hint">Tandai tiap dokumen: <b>Ada</b> atau <b>Tidak Ada</b>.</div>'+
      fklAdaHtml()+
    '</div>';
    html+='<div class="form-card"><div class="form-section-title">'+FKL_SEC_ICON+'Ringkasan Pemeriksaan</div><div id="fkl-status"></div></div>';
    html+='<div class="fkl-actions"><div class="fkl-actions-right">'+
        '<button class="btn btn-red" onclick="fklBatal()">'+FKL_IC_X+'Batal</button>'+
        '<button class="btn btn-light" onclick="fklBack()">'+FKL_IC_BACK+'Sebelumnya</button>'+
        '<button class="btn btn-green" onclick="fklSimpan()">'+FKL_IC_SAVE+'Simpan</button>'+
    '</div></div>';
  }

  cont.innerHTML=html;

  if(fklStep===1){
    FKL_INFO_FIELDS.forEach(f=>{
      const el=document.getElementById('fkl-'+f.key); if(!el) return;
      const v=st.info[f.key];
      el.value = (f.type==='num') ? rupiahInputText(v) : (v!=null?v:'');
    });
  }
  if(fklStep===3) fklUpdateStatus();
}

/* ---------- Ikon tombol ---------- */
const FKL_IC_X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M18 6 6 18M6 6l12 12"/></svg>';
const FKL_IC_NEXT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:15px;height:15px"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const FKL_IC_BACK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:15px;height:15px"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>';
const FKL_IC_SAVE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>';

/* ---------- Interaksi data ---------- */
function fklOnInfoChange(){
  const st=fklState[fklModul];
  FKL_INFO_FIELDS.forEach(f=>{
    if(fklIsLocked(f.key)) return;
    const el=document.getElementById('fkl-'+f.key); if(!el) return;
    st.info[f.key] = (f.type==='num') ? parseRupiah(el.value) : el.value.trim();
  });
  fklSaveState();
}
function fklOnPilih(el){
  const st=fklState[fklModul];
  st.pilih[el.dataset.nama]=el.checked;
  fklSaveState();
  const chip=document.querySelector('.fkl-count-chip');
  if(chip) chip.textContent=fklSelectedDocs().length+' dipilih';
}
function fklSelectAll(on){
  const st=fklState[fklModul];
  fklDocPool().forEach(nama=>{ st.pilih[nama]=on; });
  fklSaveState(); renderFormKelengkapan();
}
function fklSetAda(nama, val){
  const st=fklState[fklModul];
  st.ada[nama] = (st.ada[nama]===val) ? undefined : val;  // klik lagi = batalkan pilihan
  if(st.ada[nama]===undefined) delete st.ada[nama];
  fklSaveState(); renderFormKelengkapan();
}

/* ---------- Ringkasan status (langkah 3) ---------- */
function fklCountAda(){
  const st=fklActiveState(), list=fklSelectedDocs();
  let ada=0, tidak=0, belum=0;
  list.forEach(nama=>{
    if(st.ada[nama]===true) ada++;
    else if(st.ada[nama]===false) tidak++;
    else belum++;
  });
  return {ada,tidak,belum,total:list.length, lengkap:(list.length>0 && ada===list.length)};
}
function fklUpdateStatus(){
  const box=document.getElementById('fkl-status'); if(!box) return;
  const c=fklCountAda();
  const pct = c.total ? Math.round(c.ada/c.total*100) : 0;
  const badge = c.lengkap
    ? '<span class="fkl-status-badge ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg>DOKUMEN LENGKAP</span>'
    : '<span class="fkl-status-badge no"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 6 6 18M6 6l12 12"/></svg>DOKUMEN TIDAK LENGKAP</span>';
  box.innerHTML='<div class="fkl-status-card">'+badge+
    '<div class="fkl-status-meta">Ada: <b>'+c.ada+'</b> &nbsp;•&nbsp; Tidak Ada: <b>'+c.tidak+'</b> &nbsp;•&nbsp; Belum ditandai: <b>'+c.belum+'</b><br>Hasil pemeriksaan dinyatakan <b>LENGKAP</b> bila seluruh dokumen berstatus <b>Ada</b>.</div>'+
    '<div class="fkl-prog"><div class="fkl-prog-bar"><div class="fkl-prog-fill" style="width:'+pct+'%"></div></div><div class="fkl-prog-txt">'+pct+'% dokumen tersedia</div></div>'+
  '</div>';
}

/* ---------- Navigasi wizard ---------- */
function fklNext(){
  if(fklStep===1){
    fklOnInfoChange();
    fklStep=2; renderFormKelengkapan(); fklScrollTop(); return;
  }
  if(fklStep===2){
    if(!fklSelectedDocs().length){ toast('Pilih minimal satu dokumen','warn'); return; }
    fklStep=3; renderFormKelengkapan(); fklScrollTop(); return;
  }
}
function fklBack(){
  if(fklStep>1){ fklStep--; renderFormKelengkapan(); fklScrollTop(); }
}
function fklScrollTop(){
  const v=document.getElementById('view-form-kelengkapan');
  if(v) v.scrollIntoView({behavior:'smooth',block:'start'});
}
function fklBatal(){
  openConfirm({ icon:'del', title:'Batalkan Proses',
    text:'Batalkan proses ini? Data yang belum disimpan akan hilang.',
    onYes:()=>{
      fklEditId=null; fklState[fklModul]=fklBlankState(); fklSaveState();
      fklStep=1; openFklView(); toast('Proses dibatalkan','ok');
    }
  });
}

/* ==================================================================
   SIMPAN DATA KELENGKAPAN → alihkan ke Lihat Data
   ================================================================== */
async function fklSimpan(){
  if(!requireInput()) return;
  const st=fklState[fklModul]; const info=st.info||{};
  const nama=String(info.nama||'').trim();
  if(!nama){ toast('Nama Pekerjaan wajib diisi','warn'); fklStep=1; renderFormKelengkapan(); return; }
  const c=fklCountAda();
  const doSave=async()=>{
    const rec={
      nama_pekerjaan:nama,
      tgl_terima:info.tgl_terima||'',
      metode:info.metode||'',
      info:Object.assign({},info),
      pilih:Object.assign({},st.pilih||{}),
      ada:Object.assign({},st.ada||{})
    };
    let ok=false;
    try{
      await withActionLoader(fklEditId?'Menyimpan perubahan':'Menyimpan', async()=>{
        if(fklEditId) await StoreKelengkapan.update(fklEditId, rec);
        else await StoreKelengkapan.create(rec);
        await refreshDataKelengkapan();
      });
      ok=true;
    }catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'err'); return; }
    if(!ok) return;
    toast(fklEditId?'Data berhasil diperbarui':'Data berhasil disimpan','ok');
    // #6: kosongkan seluruh isian input agar siap data baru
    fklEditId=null; fklState[fklModul]=fklBlankState(); fklSaveState(); fklStep=1;
    // #5: alihkan ke Lihat Data
    showView('fkl-view');
  };
  if(c.belum>0){
    openConfirm({ icon:'warn', title:'Masih Ada yang Belum Ditandai',
      text:c.belum+' dokumen belum ditandai Ada/Tidak Ada. Tetap simpan?',
      onYes:doSave });
    return;
  }
  doSave();
}

/* ==================================================================
   LIHAT DATA — daftar record kelengkapan tersimpan
   ================================================================== */
let fklViewPage=1;
const FKL_VIEW_PAGE_SIZE=8;
function fklMetodeShort(m){ return m||'—'; }
function fklViewRows(){
  let rows=(records_kelengkapan||[]).slice();
  const fs=(document.getElementById('fkl-view-search')?.value||'').toLowerCase().trim();
  if(fs) rows=rows.filter(r=>String(r.nama_pekerjaan||(r.info&&r.info.nama)||'').toLowerCase().includes(fs));
  return rows;
}
function fklEmptyRow(){
  return '<tr><td colspan="6"><div class="empty">'+
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>'+
    '<div>Data tidak tersedia</div></div></td></tr>';
}
function renderFklView(){
  const tb=document.getElementById('fkl-view-body');
  const pg=document.getElementById('fkl-view-pagination');
  const cEl=document.getElementById('fkl-view-count');
  if(!tb) return;
  const rows=fklViewRows();
  if(cEl) cEl.textContent=rows.length;
  if(!rows.length){ tb.innerHTML=fklEmptyRow(); if(pg) pg.innerHTML=''; return; }
  const totalPages=Math.max(1,Math.ceil(rows.length/FKL_VIEW_PAGE_SIZE));
  if(fklViewPage>totalPages) fklViewPage=totalPages;
  if(fklViewPage<1) fklViewPage=1;
  const start=(fklViewPage-1)*FKL_VIEW_PAGE_SIZE;
  const pageRows=rows.slice(start,start+FKL_VIEW_PAGE_SIZE);
  tb.innerHTML=pageRows.map((r,i)=>{
    const info=r.info||{};
    const nama=r.nama_pekerjaan||info.nama||'—';
    const lokasi=(info.lokasi!=null?String(info.lokasi):'').trim();
    const tgl=r.tgl_terima||info.tgl_terima||'';
    const metode=r.metode||info.metode||'';
    const rid=fkEsc(String(r.id));
    return '<tr>'+
      '<td class="col-no">'+(start+i+1)+'</td>'+
      '<td class="wrap-cell col-nama-freeze">'+fkEsc(nama)+'</td>'+
      '<td class="fkl-col-lokasi">'+fkEsc(lokasi||'—')+'</td>'+
      '<td class="col-date">'+fkEsc(tgl?fklDateLong(tgl):'—')+'</td>'+
      '<td>'+fkEsc(fklMetodeShort(metode))+'</td>'+
      '<td><div class="action-cell" style="justify-content:center">'+
        '<button class="act act-edit" title="Ubah" onclick="openFklInput(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>'+
        '<button class="act act-view" title="Lihat" onclick="fklPreviewRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>'+
        '<button class="act act-del" title="Hapus" onclick="fklDeleteRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>'+
      '</div></td>'+
    '</tr>';
  }).join('');
  if(pg){
    if(totalPages<=1){ pg.innerHTML=''; }
    else{
      let h='<button class="pg-btn" '+(fklViewPage<=1?'disabled':'')+' onclick="fklViewGoto('+(fklViewPage-1)+')">‹</button>';
      for(let p=1;p<=totalPages;p++) h+='<button class="pg-btn '+(p===fklViewPage?'active':'')+'" onclick="fklViewGoto('+p+')">'+p+'</button>';
      h+='<button class="pg-btn" '+(fklViewPage>=totalPages?'disabled':'')+' onclick="fklViewGoto('+(fklViewPage+1)+')">›</button>';
      pg.innerHTML=h;
    }
  }
}
function fklViewGoto(p){ fklViewPage=p; renderFklView(); }
/* Lihat (Pratinjau PDF) sebuah record tanpa mengubah buffer input */
function fklPreviewRecord(id){
  const rec=records_kelengkapan.find(r=>String(r.id)===String(id)); if(!rec) return;
  fklPreviewState = fklRecordToState(rec);
  fklOpenPreview();
}
/* Hapus record */
function fklDeleteRecord(id){
  if(!requireInput()) return;
  const rec=records_kelengkapan.find(r=>String(r.id)===String(id)); if(!rec) return;
  openConfirm({ icon:'del', title:'Hapus Data',
    text:'Hapus data kelengkapan "'+(rec.nama_pekerjaan||(rec.info&&rec.info.nama)||'')+'"?',
    onYes:async()=>{
      try{
        await withActionLoader('Menghapus', async()=>{ await StoreKelengkapan.remove(id); await refreshDataKelengkapan(); });
      }catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'err'); return; }
      toast('Data dihapus','ok'); renderFklView();
    }
  });
}

/* Tanggal numerik: "2026-07-06" -> "06/07/2026" */
const FKL_BULAN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
function fklDateLong(s){
  if(!s) return '';
  const p=String(s).split('-'); if(p.length!==3) return s;
  const y=p[0], m=parseInt(p[1],10), d=p[2];
  if(!(m>=1&&m<=12)) return s;
  return d+'/'+p[1]+'/'+y;
}
/* Logo PLN resmi (di-embed sebagai PNG) */
const FKL_LOGO_SRC='data:image/png;base64,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YYQxWCxgXCxtODi04aBkZQRBEEYUm2ivpd1FcQc13qNGCCLJgiAIIy7JHi6Kl2UpBEEQWgRlLVosY0EQhBawlAVBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARhLKCwVk2M31RZebs/gJHcC/J+tMIbrrjhRsWNN1p5z1vjXKiJs/es4lZ0/B+3wrJllptuMnIoBWEEz6A8iN8XlyXbOqEvg5M20Da+frsoCkmXqjw/q4pSBoh2eCAtsZpFWBQWJvBmucFqDl03iTbHIcwN0zoUIapqXC/g2jlb5fiNMt9dn0PVOshOjobvhxQh1a4JKyWUKoy5NXrYumwrThreH5KcC6+rqrh927/jZ66mXg1QDQtyvFy/VR1FCWvzKLUR9LvY6E1Qy3DC17l66rpBX7PEOizDcpOaOJZzw2q5u7ebmnkIx52NCSNQw3F7MjieR1R/lbndl3CyCsCqCf0gHBWRedjl/PND7tz2ObzsjVTLdZQarrNvARetN2C9BVyTXc0NVrf8GbNWo5Th9sLREN4HuCjMsHgVLAYv5RFWHnCByaTSUwkD0Hp8bTyl4t9JadBO/N/WQr0Mkd3MHdteRemHCdUDTOl4nvNV2HwzboQJJcx1pVHMxE9Po16N12zIN56BVBrKwXRRxZagnVRqCvVafD6GCxNBrmMq+W1fxdpruRWVCNsYeBCHPorZeD5EZnjsFJOci3plqguEBHWLiSJM6Iyr7aaUhfh/sUui+UTSuP5UPP98tHM+5fyN9Pa9wB29t2GqS1Dq7aYwg50wfi9LEO+F0GCH4bakMAR1DQSihS3xhkcEYXL2o+E9+4WeiEzH1dze82kWT/oGS6zDYhW1/BIZLNoGBHUXay3DE3dLzoUKXBQKpRQKNUzX1FGV5Mb/tv9XwrolCkyi1g5++iQc9yTKfJEf99yCMV9DqVebroyxsHn2fbXivUDzz6EWgP7vL7TCA3jkzr61DvWKxfP+D3dueZSr1WtNt8CYOBlKYS3Dci6sbb4PesJuxnhhHVAOWEu1bCjnI7TuJtP+abT7FD/Of4Ul781msYqwduKkCArCcJw3Exq8VBeR+jpLrN8UI6GJliWId0sc1FAOUWgp5yMUbWRyf4jf+RR39P0mSsWui9iNIQjCnp8zh2oxItd1Lnrrn6KU6U9FbTFuTP70nBoQjpTzQMRlp5azcogiS6k3Qrv7kc58mx/nf8iSdVNRyrDEOrJQgrCXmlMtGrzUX3J73+nJ7bOFdag+ogUtIsjvJ8xKO4Q1Q6VoyOR+jVTHI/xw/WksVpGIsiDs5W00CsH10yjzTZZsbONGcV2IIO/+BtIopSn1RjjukeTa7+O2zVeLKAvCXh8pTbUYke04DuX+DTe1sOtCBLllN5FDvRwBXfiZW1iy7WMsVhE3POzK4gjCHhvKmkoxIp3+fW7feqkYOCLIe7OLYheGMT6Z1H9z69bF3HR+KBtJEPZckTFRHK/R7r9xr53KIgw33DChNUkEeW+uW1FgiCIP3/82SzZfIE93QdhLKzmoRGTaDqK67R9QynLUjRPalyyCvC+irJ0Mfur73LbpkNh9ISlxgrCHEuRQyUf42d/gtm0fnejGjQjIvohyvRKRysxEef/FkvcygESLBWFPsVZhIouj/5kf9xwwkY0bEeR9E2WHciGkrfMsdO4vJVosCHt3kAhrhnTbNCLzr9xwg+YoJmRlrIjHPu8lHCp5g+f/D3689czWT3QXhJaUoth1ke24guP+8LMsVtFENG5EOPZdkRVRBF7Kx6i/51fWi8suxXUhCHt8loKqQbt/y+1bj56IrgsR5KG5ccWJ7pm2M1nV+3FuUoYlsraCsMd6FAUWP90B6pvc+0Yq/ueJY9yIaAwVljgwoe2fcv/6HIswEuAThD22bhwqxYhc53yqU/5sohk3IshDd9vS1MqWVNsRFNO/hlJWAnyCsJe6VC0aHO/P+Ul+/kSKy4zsL2mtHbYP7OhP9VAKrLFY8xmWWJ/FYiULwl6co7gBkeOliMw3uNd2TJQGRCPbh8Fx1bD1FTURGGOTQYTJw2akJ6AoTbVs8VMnEPadB10PcKt12HHatSAI73+UNLVSRFvXMRS2/W9umvwHHDX+z9LICnIU5cHWh3y6tUWhyOGnfTzfwRiolcGaKJ4IMpIbCYOfdggKHwUeYBkyUVkQ9k6UHcoFg5f6PLf33c916h6WLHFYvHjcivIICHI8iCq2kO2vU3efwgvSBHboZmk5KELdja3OJaiegFUXojiLTIdDJW/jl6BHylpW1KuAvYQl+aksVpuTmVkizIKwxzdfA65WqOBr/GTDr7hq+iZusHq8ToQfWQtZ6/Us7tg8TN99DfAKcA/wv7mz7zQqhT/A8T4KCsK6icc0jYDbIqhbUpkZVKvnALcnwT1xWwjCHh8nFbcoyHXuT8n+E0p9jCVWx6lw48/IGVlBtpGPtYp//3eXdeuGUKBujP84KplmvBjD1eoZ4GPc0XM72vkaqcwMamWD0sMvygqD6zuoysXA7SwSt4Ug7JProlKISGU/ym3b7uN69b14Evz4M3JGVpAN8aDQJUsMn/rUEF45btrxn5YscWARXKvu4PZtK1HqJ/iZ/alVLHrY3ReKsA5KncF/v5NGqaq4LQRhX4w5q4gCi+v8I7f1PsH16u3x6LoYv7l9ixdHLFYRD1uX6ya9RL32YaKwiOcPf4qcTQQZewi59gMTI17S3wRhH8xkwrollZuKMv/GEutw1K3j7kyN/2Tr81XIw9Zl0ZRniOp/hZfSMMwuBKUUJjKksmm0Ogbod6cIgrC3mqzjBkTtl+H1/j6LF4+73skTo5LsPOJKn3zhG5QLL+FnNdYO91XH4nqg3aPkJAnCkJ0qTb1iUM7fcNe248ZbFd/EEOS4jFnx2/Oq4HwdRzMi9qqxoMxhAJKPLAhDdPsMA/DTbdTsN/lvm+bWW8dN7+SJ02thUVLBp+p3US5swfF0XHI9bE9yFVcP2gP6gw9SRi0IQ+K6qBYj2rpOp2PbX7B48bjpnTxxBFkpi7WK66atB/0UfoYBZdbD8POIy7mVnspRPe2JSAuCMFTaVStGuP6XuG3bOePFdTGxupHd+EgcAFD2mWF3WTQsZGs6cFKxIN94o1jIgjBEFhZhpHBcD63iBkRgx3pD+4klyEedF9uoyrxOGMQBguHEGFAqg6q0J08EOUeCMHSarKmVI7IdR1Lp+TuUsmM9m2liCXKjYs6qddSrFqXUsDkSFGANYNMoNyt6LAjDcc60Q7UQ4fmf5o7NC1msxnQq3ARzWTT+4vVibR01nCnJqrljMMqTkyMIw3YTjdv6Kv+r3F6cOZan9UzQiRY2QuuA4bOPE0W2Fu2AMWkAbr1VfMiCMAxmMkHVkMnNhfo/j+VpPRNTkHVdYUbC+a8U1oAygRwaQRjWQx03IErnPsxtPb81Vl0XE9NlEbk5sOm4cGO4jNYkx9kai+/UAVi0SBLfBGHYLr5WEdYtjv5HftJ78FhMhZtYgnxrw7GrpuGlNNZYhqtmz5KIvapjTW3QA0EQhOG4kca9yNPZSYTmayyxTnzmx44/eWIJ8rJH4jdGmXl4/vAWhiT7A6gS6KIcFkEYCUXTmkohIttxMc62P45dF2NH5yaYy+K8RID1SQz38BCl4oCetSV8nU8sZHFZCMKwuy7Q1MoG17+R2zedyGIVjZWCkQkkyFahlOFhm8ZEZxLW42q6YdwVaAdQW5nV3ienRJjYImlHzhhRShEF4Po5tPcNltgMN8JYSIWbOIK8hHgO19beM/D8w6hX7PDO2FMWRwOs4WQVcIPVMjFEmJAoBY6rRlaUtaZWish0nIra+lcoZcZCKtxE6vZmQVmU+R1SWQ3D7D/GgnJA8RYgDeqFiSvG1gREYU8iyiOrb9ViRCr9BW7vuWAsZF1MDEFessRBKcOSLafieIuoFOyI/O7WAmq5nEphYouytsCNmHADXsqOnKWsFFGo0I6HVl/jbtvNjTe2tOti/AvyDVazaJFhyas+jv5nvHQqnhaihtN/HJvH1aLBRC/H/3arHExh4mGNxfV8tH4Cwxfx02rYs5t2cF2UI7Lth1Pd+v9x000t7boY34K8xDrclEy6dmZ/hWzHmdSKETC8FTwW8HwwZj1tTmwhL1pk5HQKExJjQNHN9ZO+R6nnXjIdDtZGIyfKSlMuRKSyn+SOnmtbuYpv/AmytQprNUusw2IV8a3nXX7c969ksp+hkjexY3e4NwAG1wfUUi7t2oa1SgJ6woQmCOOguut8nmpxE66vk3aII+O6MCbuLaPUV1myZTaLMa2YCueO6E9zVCyULHNYMgz6tAiLUoZGy6Af956EVf8f6eyHqBQMw558PHgPAA8n3goNRHIqhQmL60SgLAt5h9u2/TGe+wNMYEYsM18pTb0WkeuYjcn/C6jrOWpJ/JCgdYylkRXkgAKLVTSs4vTd9TnacieD+XVQv0Y6k6VSiEbEMo4tdIvWDqVCDdwHARlwKggNvmU9rlc/5LYtl9HW/XHKvVGSsD8SouxQLkRk2q7j1k2fZNG0/4hv0q1jLI2sIKOu4Y7CoRCkUHrorivGZlFqFpjDQJ2ItoeTbodKESoFg9Ij5y9SypDKasrF53il7TWwiptEkAUh5vnYrXhH8QtUCvPxMvOoV83w1gQMMpg0Yd3gpf+OO/t+ydVqRf8Q4gkhyAOyGVLpG2KvgT+0LX2UA1qBsRAFUK9CuS/ColF6hP1ENq4UUizhJmWavmxBEKD7pDjLYXH7Jm7f9vtY+1O0bqTCDX86mlKKoGbJdkyiXPga37KX0Z00tG+BOM/IWsj1yvD4jNSg76piX7FyRqEUw+B4mnJhK5G5A4BFSHaFIAykkeVwnbqH27d+nVzX5yn1RiN2k1VJA6Jcx4ewPV/g+kl/l2RdjLrhNMLWo9KoYfiIS+IaH6MYObWWVFYBS1g8ZS1WyqUFYacsSrIcppv/SaXwKqmcgzUjZ7xYNLWSwfP+its3n9IqVXxadsaQabGNn7zFCtivA9L/WBB27Tqw3AicNbUA9c8S1QMcd+SaECmlCENw/Qw43+D+9bmdNiCq2ygpJBNBHlsbDEOmXWHCH3Ld5FexrRMoEIQWFeU4xnLNtMcIgr8j3aZHvIqvWozIdZ5EMXUDN+2kAZHrhTByr0kEeaisY8dTVIu9ZJz/O5YmFAjCqLsurNVMnvR/KPc9TaptZF0XqFiUvdQfc/uWi0a7d7II8pC8pzZOdTPRP3B510osKilQEQQBBWYXsZ1GjOV8VUWpzxDWirj+yLouokihtYt2vsZ9vZO4EcuNo9OdUQR5383jiHSbQ7lvKW7ln+P0Gck7FoSGtYLWYE36g10X3S9Sq96Inxlh14WKGxBlOg6hGP09Sln+fXS0UQR5X10V2lUE9SrafJarZpdjc0AyKwRhj1iMYckSB6Z8hXL+ATLtI9yASDtU8hGpzO9w69bFfEoFIshj7uGvIlJZTVj7c66e8gxLrCOuCkHYS0t62SLLYhXh6s9Rq2zF8xUjGFBLGpNZXPefua28P1i1S1eLCHLLWcchuU6XUt9/c92UryQ18SLGgrC3NCpbF3a9hal/EcfTMJLuP6UJq4ZMbhZUvgrKYqqWEXQniyDvtRh3uZQK92NKn8NaFVfkiatCEPaJRcSifO2U/6JSvI1su4M1I1hBp+PeybnOq7it57dw0z0Md/90EeQhsIwr+Seo2F9j8dxK4r4QMRaEfTZSlWUZFmsVxv4RleJavLQzcr2TUWAVQdXi8GWIzgBbGKmGdCLIuy/EFghp63IpFx4mX1zIx7p6ZJq0IAyD6+JWdNJ+4A9QqjGXb+RcF0ENHH8qqH8C0pgoTpETQW4FMTYGpSDb4VLqu4Vi5Up+c87WVmrbJwjjikYDomu776BW/k8y7Q6Ykcy6iLvCOe4haKdzpH60CPIHWcXWRPhZjeNAKf/XXNv9EX5jZknEWBCGmWU3Jq4L90tU8m/gZ524r8RIibJShIFlBH+kCPKu1ThCa0Vbl0MUvkkQXMF13TckqTFKxFgQhtt1cZMBFIu7tgGfxUQhjmNHrIqvIcojiAjy9hYxSTJ6pt0BQsrFfyPiLK6ffG+cZ4wE8ARh5ASxUcX3EPXqV0i3jWSAb8Rx5R23FotFYXEch3TOoVqy1Ko/Rau/Y2Hn0wAy+UMQRonGhGifGyj3XUC67URqpZGbkymCPMxWcNxrIrZylXZIZRSOC5VikWrpHkLzLa7vfLgpxIswKBFjQRglM9lyo1UoVeaO3s8Q1B5FOz4msoNGxIkg77EYmpFvvNNwL1iFReM4CsdTeD5YC5ViQLX8Atr5CTb4MddMWZ68VgUoEWJBaCHXxbXqWW7f9jdkO/6WSj5iBIs2xp8gp3OaERwAHecvJg/QKIKgCmFQJjKrCOqvYs3jGPUYr3a91AzS3WA1NyYbAOnaJggtQ6N38vP8Pat6LybTfi6VvBn5QcbjRZBrpYdRajNWOcMudsaAVhUgj2ULxqzFcVahnHcJ+1Y3K+waLLEOy7DcpAw3yd4XhBa0ki03WMVNKuDO/GcJqk/geJ1EoR3pbIgxLMi238+joj/lmqnPt8RvfoPVHIViURLQk4CdILQ+jQZEV6vXuHXzX9LW9W9UCuPGdTGyFrLWaW6wmlnPO6w7afgF8Ebg1u1aNS3DciNW2mQKwhhlcdKA6Hq+zh29l5DtuJJyPkKN/ayLkRVkk7gElixRfOrk4RfEm/bw3wVBGAu+C8sya1msLLdt+32qpVPx/GkEdYNSY9qfLIUhgiCMPRqui+snrSKyf4J2FFr1p7OKIAuCIIwgH04aEF3f9UOqpR+Q6RjhidUiyIIgjE2lGXrL1dLfgKg99SeUC+/iZ8Z0abUIsiAIw4gFpcEqb1i+/U03xb2TL2nfRGR+P26Vq8es60IEWRCEYdVjtAar/GH7GY3eyYsm3U1Q+3rSO3lMWsnSXEgYjUOqKOCwxBqWoTjKjv2KyLjfiVR27tr0s8O+/jfcoInUX1IpnEcqdzTV0pir4hNBFkYYBcqGnK+qshbC0G0rZVlkNTepPm7b9jmi8EG062KiMVXFJ4IsjKxlHAWAmsmPe/8XxkQoxkHJqwblf5drsqu54QadNFYXRppbG1kX6pfcuvXLtHf9JeXeMdWmUwRZGEkrRhGFoPUM0rm/Hg9PmNjiV5Df9gSwmqOOUvJGjyKNBkTf5m9xei8k3XY6leKYcV2IIAsjj4ks5fx4sCJjRVYKfB3IG9sirgtrFb+tqvy45zPUqk/gemmicEz0TpYsC2FUTk18jRzrH/T/PVJiGbfO9mqMfXqRqP5X+FkNjAkDQARZEITx6bpYYh0mT/kXSn0PJqlwLd/RUQRZEITx6bpYhuV8FZJyP0e9shXH1yM6sVoEWRAEIaHRgOjKzjcJ6l/C9VWrt90VQRYEYfyyWEVYq7l+yv+jUrqNTLuDbV3XhQiyIAjjmxsBrMKN/pBqaQ1eWmNbswGRCLIgCOObm5RhCZqrp64jMn+EUgqtbTxeTgRZEARhZGk0ILq++3Zq5f+Msy5az0oWQRYEYWIQV/EptPdnVApv4GedVnNdiCALgjAxiLvxKa7t3Iric5goJK6obhnXhQiyIAgTSZTjVLiru35OWP8KmXbdSq4LEWRBECYWizDcYDW57hsp971AKtcys/hEkAVBmGhWcuyiuESViMxnCOpVHJdWqOITQRYEYeLRqOJbNOUZwtr/JpXTqNFvQCSCLAjCxGQRhiVLHLZO/jLlvl+Sbht114X0QxYEYWIS9062KBVw69bPUq8+geN1EIWjNvZJLGRBEIZR9LAoBdakW1SUE9fF5GUE4V+QyqjRdF2IIAuCMPwY1bq38f4qvm9Qzt9FpmPUeie7xJ30IywG7NCb6Yp4pEr802RMeosfm2QvWOSt2rO97dixt2AWO6xnv39P0QoBs/dlGZbFyrCk5w+plU7DTU0lqIcjYrRaDGDBGhdUhrTnEKUdhmUOYGMQJFDrE591q+IqRUgb6Wy8D5RcnnZ7b2sFleIY3NvKJ+04BGkHPUyDmU2kSbtQwWvppWhkXSxW73Db5j8m2/kDHG9k3lNjNGkfKmRdiH5CPr8eY2pYM/SnUGmLNQpcsGYtAIsWyZj0VqO3VKEt/TVKvVOICFFGZsTt7t5WWuHr1WNmbz9yXvwatX6Gnvx/YE1lWM5+vEaGviCFjV5pWqIt67pIel0o9UNu3zwL5R4M1IZtbQauUb7uo3np/wezoA2LMsqtywAAAABJRU5ErkJggg==';

function fklActiveState(){ return fklPreviewState || fklState[fklModul]; }
function fklBuildDocHtml(){
  const def=FKL_DOCS[fklModul], st=fklActiveState(), info=st.info||{};
  const list=fklSelectedDocs(), c=fklCountAda();
  const fmtNilai = (info.nilai!=='' && info.nilai!=null && info.nilai!=='') ? 'Rp '+Number(info.nilai).toLocaleString('id-ID') : '-';
  const tglTerima = info.tgl_terima ? pnwDateLong(info.tgl_terima) : '..........................';
  const infoRow=(k,v)=>'<tr><td class="k">'+k+'</td><td class="s">:</td><td class="v" style="text-align:justify">'+fkEsc(v||'-')+'</td></tr>';

  const chkRows=list.map((nama,i)=>{
    const val=st.ada[nama];
    const cell = val===true
      ? '<span class="pill ada">Ada</span>'
      : (val===false ? '<span class="pill no">Tidak Ada</span>' : '<span class="pill nn">–</span>');
    const ketDok = (st.ket && st.ket[nama]) ? String(st.ket[nama]) : '';
    return '<tr><td class="no">'+(i+1)+'</td><td class="nm">'+fkEsc(nama)+'</td><td class="ck">'+cell+'</td><td class="kt">'+fkEsc(ketDok)+'</td></tr>';
  }).join('');

  const hasilLengkap = c.lengkap;
  // Hasil Pemeriksaan (poin C) — bergaya sama seperti tabel pada Pembukaan Penawaran.
  const hasilStatus = hasilLengkap
    ? '<span class="pill ada">Lengkap</span>'
    : '<span class="pill no">Tidak Lengkap</span>';
  const hasilKet = hasilLengkap
    ? 'Seluruh dokumen yang diperiksa dinyatakan lengkap'
    : ('Terdapat '+c.tidak+' dari '+c.total+' dokumen yang tidak ada'+(c.belum?(' ('+c.belum+' belum ditandai)'):''));
  const hasilNama = (info.nama && String(info.nama).trim()) ? String(info.nama) : 'Kelengkapan Dokumen Pengadaan';
  const hasilBlock = '<table class="fkl-chk pnw-hasil"><thead><tr>'+
    '<th class="no">No</th><th class="nm">Nama Pekerjaan</th>'+
    '<th class="ck">Hasil Pemeriksaan</th><th class="kt">Keterangan</th>'+
    '</tr></thead><tbody>'+
    '<tr><td class="no">1</td><td class="nm">'+fkEsc(hasilNama)+'</td><td class="ck">'+hasilStatus+'</td><td class="kt">'+fkEsc(hasilKet)+'</td></tr>'+
    '</tbody></table>';

  return ''+
  '<div class="fkl-doc fkl-kd-doc">'+
    '<div class="fkl-doc-head">'+
      '<div class="fkl-doc-logo">'+
        '<img src="'+FKL_LOGO_SRC+'" alt="Logo PLN">'+
      '</div>'+
      '<div class="fkl-doc-org">'+
        '<div class="l1">PT PLN (PERSERO)</div>'+
        '<div class="l2">UNIT PELAKSANA PELAYANAN PELANGGAN MASOHI</div>'+
        '<div class="l3">Jl. Abdullah Soulissa No 1, Masohi, Kec. Kota Masohi</div>'+
      '</div>'+
    '</div>'+
    '<div class="fkl-doc-band"></div>'+
    '<h1 class="fkl-doc-title">FORM PEMERIKSAAN KELENGKAPAN<br>DOKUMEN PENGADAAN</h1>'+
    '<div class="fkl-doc-titlegap"></div>'+

    '<div class="fkl-sec-h"><span class="rn">A</span>Data Pekerjaan</div>'+
    '<table class="fkl-info"><tbody>'+
      infoRow('Nama Pekerjaan', info.nama)+
      infoRow('Lokasi Pekerjaan', info.lokasi)+
      infoRow('Nilai Pekerjaan', fmtNilai)+
      infoRow('No. Anggaran', info.no_anggaran)+
      infoRow('Tgl. Anggaran', info.tgl_anggaran?pnwDateLong(info.tgl_anggaran):'-')+
      infoRow('Jenis Anggaran', info.jenis_anggaran)+
      infoRow('Metode Pengadaan', info.metode)+
    '</tbody></table>'+

    '<div class="fkl-sec-h"><span class="rn">B</span>Kelengkapan Dokumen</div>'+
    '<table class="fkl-chk fkl-chk-b"><thead><tr><th class="no">No</th><th class="nm">Jenis Dokumen</th><th class="ck"><span class="ck-main">Kelengkapan Dokumen</span></th><th class="kt">Keterangan</th></tr></thead><tbody>'+
      (chkRows||'<tr><td colspan="4" class="empty">Data tidak tersedia</td></tr>')+
    '</tbody></table>'+

    '<div class="fkl-doc-tail">'+
    '<div class="fkl-sec-h"><span class="rn">C</span>Hasil Pemeriksaan</div>'+
    hasilBlock+

    '<div class="fkl-doc-foot">'+
      '<div class="ttd-date">Masohi, '+fkEsc(tglTerima)+'</div>'+
      '<table class="ttd"><tbody><tr>'+
        '<td><div class="role">Yang Menyerahkan,</div><div class="gap"></div><div class="nm">'+fkEsc(info.menyerahkan||'(..........................)')+'</div></td>'+
        '<td><div class="role">Yang Menerima,</div><div class="gap"></div><div class="nm">'+fkEsc(info.menerima||'(..........................)')+'</div></td>'+
      '</tr></tbody></table>'+
    '</div>'+
    '</div>'+
  '</div>';
}

/* ============ SHELL DOKUMEN BERSAMA ============
   SATU tempat yang membentuk kerangka dokumen (doctype, <style>, pembungkus
   .fkl-print-page). Dipakai oleh SEMUA modul, dan dokumen yang sama itu pula
   yang ditulis ke iframe pratinjau MAUPUN iframe cetak. Karena pratinjau dan
   Cetak/PDF membaca hasil fungsi yang sama, perubahan di satu sisi pasti ikut
   di sisi lain — tidak mungkin melenceng.
   - extraCss  : CSS tambahan milik modul (boleh kosong)
   - innerHtml : isi dokumen (biasanya <div class="fkl-doc">…</div>)  */
/* ---------- Nomor dokumen (dari menu "Ambil Nomor" / Penetapan Nomor) ----------
   Dicocokkan lewat Nama Pekerjaan + kode dokumen. Dipakai pada baris "Nomor :"
   di bawah garis judul, seragam untuk seluruh dokumen. */
function fklPenetapanDoc(nama, codes){
  const nm=String(nama||'').trim().toLowerCase(); if(!nm) return null;
  const want=(codes&&codes.length?codes:['HPS']).map(c=>String(c).toUpperCase());
  const list=(typeof records_penetapan!=='undefined' && records_penetapan) ? records_penetapan : [];
  for(const c of want){
    for(const r of list){
      if(String(r.nama_pekerjaan||'').trim().toLowerCase()!==nm) continue;
      const docs=Array.isArray(r.dokumen)?r.dokumen:[];
      const hit=docs.find(d=>String(d.code||'').toUpperCase()===c || String(d.key||'').toUpperCase()===c);
      if(hit && (hit.no || hit.tgl_terbit)) return hit;
    }
  }
  return null;
}
function fklDocNomorText(nama, codes){
  const doc=fklPenetapanDoc(nama, codes);
  const no=(doc&&doc.no)?String(doc.no).trim():'';
  return 'Nomor : '+(no||'..........................');
}
/* Blok judul seragam: JUDUL → garis bawah → Nomor dokumen → jarak */
function fklDocTitleBlock(titleHtml, nama, codes){
  return '<h1 class="fkl-doc-title has-rule">'+titleHtml+'</h1>'+
    '<div class="fkl-doc-docno">'+fkEsc(fklDocNomorText(nama, codes))+'</div>'+
    '<div class="fkl-doc-titlegap"></div>';
}

function fklDocBaseCss(){
  const el=document.getElementById('fkl-doc-css');
  return (el?el.textContent:'') + fklDocCssPatch();
}
/* Penyesuaian yang berlaku untuk SEMUA dokumen cetak (HPS, Lampiran SPK, Jadwal,
   Kelengkapan, dll) tanpa perlu menyunting index.html.

   Kolom label pada blok "A DATA PEKERJAAN" semula dipatok width:34% — jauh lebih
   lebar dari kebutuhan, sehingga titik dua & nilainya terdorong ke tengah.
   Dengan width:1% + white-space:nowrap pada tabel width:100%, kolom label
   MENYUSUT tepat selebar teks label terpanjang ("Metode Pengadaan" / "Nama
   Pekerjaan"), lalu sisa ruang seluruhnya diberikan ke kolom nilai. */
function fklDocCssPatch(){
  return ''+
    'table.fkl-info td.k{width:1%;white-space:nowrap;padding-right:14px}'+
    'table.fkl-info td.s{width:1%;white-space:nowrap}'+
    /* Huruf awal label (mis. "Nama Pekerjaan") disejajarkan dengan huruf awal teks
       JUDUL seksi ("Uraian/Data Pekerjaan"). Judul menjorok sejauh lebar huruf
       seksi ("A") + jarak 10px; padding-kiri 19px menempatkan label tepat di bawah
       huruf awal judul. Hanya berlaku pada tabel info yang PERSIS di bawah judul
       seksi, jadi blok tanpa judul (mis. Lampiran SPK) tidak ikut terindent. */
    '.fkl-sec-h + table.fkl-info td.k{padding-left:19px}'+
    /* Pembungkus cetak cukup dipusatkan. JANGAN dipatok table-layout:fixed —
       .fkl-print-page di dalamnya sudah ber-width:210mm sehingga pembungkus tidak
       pernah melebar karena isinya, sedangkan mengubah cara <table> ini dihitung
       membuat paginator salah mengukur dan batal memecah halaman. */
    'table.fkl-page-wrap{margin:0 auto}'+
    fklSheetCss();
}
/* ===================== LEMBAR A4 BERSAMA (WYSIWYG) =====================
   SEMUA dokumen cetak (Kelengkapan, Jadwal, Penawaran, Evaluasi, HPS, Analisa
   Harga, Rekap) dipecah menjadi lembar A4 sungguhan oleh fklPageScript(), persis
   seperti dokumen SPK. Kuncinya: KOTAK HALAMAN YANG SAMA di layar dan di cetak —
   210x297mm dengan padding 12mm (atas/bawah) & 15mm (kiri/kanan), @page{margin:0}.

   Sebelumnya pratinjau hanya menampilkan SATU lembar memanjang dan pemenggalan
   halaman baru terjadi saat dicetak (dikerjakan mesin cetak browser). Akibatnya
   pratinjau tidak pernah memperlihatkan hasil yang sebenarnya: batas halaman,
   baris yang terpotong, atau tabel yang pindah halaman baru terlihat di PDF.
   Dengan lembar sungguhan, apa yang tampil di pratinjau = apa yang tercetak. */
function fklSheetCss(){
  return ''+
  '.fkl-sheet{position:relative;box-sizing:border-box;width:210mm;height:297mm;background:#fff;'+
    'margin:0 auto 16px;padding:12mm 15mm;box-shadow:0 10px 30px rgba(20,50,60,.18);overflow:hidden;'+
    'page-break-after:always;break-after:page}'+
  '.fkl-sheet:last-child{page-break-after:auto;break-after:auto;margin-bottom:0}'+
  '.fkl-sheet-bd{overflow:hidden}'+
  /* Isi dokumen sudah dibatasi oleh padding lembar -> padding bawaan .fkl-doc dinolkan */
  '.fkl-sheet .fkl-doc{padding:0;overflow:visible}'+
  '@media print{'+
    /* ===== TANPA HEADER/FOOTER BAWAAN BROWSER =====
       margin:0 pada @page membuat mesin cetak tidak punya ruang untuk menempelkan
       header/footer bawaannya (judul halaman, URL, tanggal, "Halaman 1 dari N").
       Jarak tepi dokumen SEPENUHNYA berasal dari padding lembar (12mm/15mm), jadi
       hasil cetak tetap punya margin yang benar tanpa tulisan tambahan browser.
       Aturan ini ditulis ulang di sini (bukan hanya di index.html) agar setiap
       dokumen membawanya sendiri, apa pun urutan CSS-nya. */
    '@page{size:A4 portrait;margin:0}'+
    'html,body{background:#fff;margin:0;padding:0}'+
    /* Lembar TIDAK berubah bentuk saat dicetak: ukuran, padding, dan pemenggalannya
       sama persis dengan pratinjau, sehingga PDF tidak pernah "terkompres" atau
       menyisipkan halaman kosong. */
    '.fkl-sheet{margin:0;box-shadow:none;page-break-after:always;break-after:page}'+
    '.fkl-sheet:last-child{page-break-after:auto;break-after:auto}'+
  '}';
}
/* Dokumen Cetak/PDF adalah dokumen HTML MANDIRI (iframe/window baru). Font yang
   dimuat di halaman utama TIDAK diwariskan ke sana, sehingga 'Plus Jakarta Sans'
   sebelumnya selalu jatuh ke Segoe UI/Arial. Link berikut memuat font itu langsung
   di dalam dokumen cetak. */
function fklDocFontLink(){
  return '<link rel="preconnect" href="https://fonts.googleapis.com">'+
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'+
    '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">';
}
/* ---------- PENYESUAIAN LAYAR SEMPIT (HP/TABLET) ----------
   Lembar A4 selebar 210mm (±794px) lebih lebar dari layar HP sehingga pratinjau
   terpotong di sisi kanan. Skrip ini menskalakan SELURUH dokumen agar pas selebar
   layar (seperti PDF viewer), dan mengembalikannya ke 100% saat dicetak — hasil
   cetak/PDF tidak berubah sama sekali. Dipakai oleh semua dokumen pratinjau. */
function fklFitScript(){
  return '<style>@media print{body{zoom:1!important;transform:none!important;width:auto!important}}</style>'+
  '<scr'+'ipt>(function(){'+
  'var Z=(window.CSS&&CSS.supports&&CSS.supports("zoom","1"));'+
  'function fit(){'+
    'var b=document.body;if(!b)return;'+
    'b.style.zoom="";b.style.transform="";b.style.width="";'+
    'var sh=document.querySelector(".fkl-sheet,.spk-page,.hpsc-page,.fkl-print-page,.spk-doc");'+
    'if(!sh)return;'+
    'var w=sh.offsetWidth;if(!w)return;'+
    /* JANGAN pakai scrollWidth di sini: scrollWidth body >= lebar jendela >
       lebar lembar, jadi syarat sw>w+2 SELALU benar di desktop dan semua
       dokumen ikut di-zoom 0.99xx (terverifikasi di Chromium 21 Jul 2026).
       Luberan tabel ditangani fklFitTblScript, bukan penskala pratinjau. */
    'var vw=document.documentElement.clientWidth;'+
    'if(vw>=w+2)return;'+
    'var s=(vw-10)/w;if(s<=0)return;'+
    'if(Z){b.style.zoom=s;}'+
    'else{b.style.transformOrigin="top left";b.style.transform="scale("+s+")";b.style.width=(vw/s)+"px";}'+
  '}'+
  'window.addEventListener("resize",fit);'+
  'window.addEventListener("orientationchange",fit);'+
  'window.addEventListener("load",fit);'+
  'setTimeout(fit,120);setTimeout(fit,500);setTimeout(fit,1500);setTimeout(fit,3200);'+
  'window.addEventListener("beforeprint",function(){var b=document.body;b.style.zoom="";b.style.transform="";b.style.width="";});'+
  'window.addEventListener("afterprint",fit);'+
  '})();</scr'+'ipt>';
}
/* ---------- TABEL LEBAR DIPASKAN KE BIDANG CETAK ----------
   Sebagian tabel dokumen tidak bisa menyempit lagi: kolom harga HPS ber-nowrap,
   dan tabel AHSP Analisa menambah SATU KOLOM untuk setiap sumber Referensi. Bila
   lebar minimumnya melewati bidang cetak (180mm), isinya terpotong oleh
   .fkl-sheet{overflow:hidden} — inilah gejala "isi tidak sesuai halaman".
   Skrip ini mengukur lebar minimum tiap tabel, lalu HANYA yang kelewat lebar
   dikecilkan UKURAN HURUFNYA bertahap (lantai 6px) sampai muat. Sengaja TIDAK
   memakai zoom: zoom membuat pengukuran tinggi milik paginator jadi kacau,
   sehingga pemecahan halaman batal dan dokumen kembali ke satu lembar panjang
   (gejala: isi meluber ke kanan + muncul lembar putih kosong di Rekap HPS).
   Tabel yang sudah muat tidak disentuh sama sekali.
   WAJIB dipasang SEBELUM paginator, supaya tinggi baris yang dipakai memecah
   halaman sudah tinggi yang sebenarnya (setelah dikecilkan). */
function fklFitTblScript(){
  const js=[
    '(function(){',
    'var SEL="table.hps-doc-tbl,table.ana-doc-tbl";',
    'var MINPX=6;',
    /* Bidang cetak = lebar isi lembar (210mm dikurangi padding kiri-kanan). */
    'function bidang(t){',
    ' var n=t.parentNode;',
    ' while(n && n.nodeType===1){',
    '  if(n.classList && (n.classList.contains("fkl-doc")||n.classList.contains("fkl-print-page")||n.classList.contains("fkl-sheet"))){',
    '   var cs=getComputedStyle(n);',
    '   var w=n.clientWidth-(parseFloat(cs.paddingLeft)||0)-(parseFloat(cs.paddingRight)||0);',
    '   if(w>40) return w;',
    '  }',
    '  n=n.parentNode;',
    ' }',
    ' return t.parentNode ? t.parentNode.clientWidth : 0;',
    '}',
    /* Lebar TERSEMPIT yang masih mungkin bagi tabel ini pada ukuran huruf sekarang. */
    'function ukurMin(t){',
    ' var w=t.style.width, tl=t.style.tableLayout;',
    ' t.style.tableLayout="auto"; t.style.width="min-content";',
    ' var m=t.getBoundingClientRect().width;',
    ' t.style.width=w; t.style.tableLayout=tl;',
    ' return m;',
    '}',
    /* PENTING: aturan asal menulis font-size LANGSUNG pada th/td
       (table.hps-doc-tbl th,td{font-size:8.7px}), jadi font-size yang dipasang
       pada elemen <table> TIDAK DIWARISI sel — dulu skrip ini tidak berefek
       sama sekali. Karena itu ukurannya ditulis lewat <style> tersendiri yang
       menargetkan th/td tabel tsb (penanda data-fkfit) dengan !important. */
    'function gaya(t,i){',
    ' var tag="f"+i, id="fkfit-"+tag;',
    ' t.setAttribute("data-fkfit", tag);',
    ' var st=document.getElementById(id);',
    ' if(!st){ st=document.createElement("style"); st.id=id; (document.head||document.body).appendChild(st); }',
    ' st.__tag=tag; return st;',
    '}',
    'function pakaiFont(st,f){',
    ' var sel="table[data-fkfit="+st.__tag+"]";',
    ' st.textContent=sel+" th,"+sel+" td{font-size:"+f+"px !important}";',
    '}',
    /* Ukuran huruf dasar dibaca dari SEL pertama, bukan dari <table>. */
    'function pxFont(t){ var c=t.querySelector("td,th")||t; var v=parseFloat(getComputedStyle(c).fontSize); return (v>0)?v:8.7; }',
    'function paskan(){',
    ' var ts=[].slice.call(document.querySelectorAll(SEL));',
    ' for(var i=0;i<ts.length;i++){',
    '  var t=ts[i];',
    '  try{',
    '   var st=gaya(t,i); st.textContent="";',
    '   var avail=bidang(t); if(!(avail>40)) continue;',
    '   var min=ukurMin(t); if(!(min>0) || min<=avail+1) continue;',
    '   var f0=pxFont(t);',
    /* Kecilkan bertahap; tiap putaran diukur ulang karena padding & garis sel
       tidak ikut mengecil, jadi perbandingannya tidak lurus. Maksimal 8 putaran. */
    '   var f=f0;',
    '   for(var k=0;k<8 && min>avail+1;k++){',
    '    var f2=f*(avail/min);',
    '    if(f2>f-0.15) f2=f-0.15;',
    '    if(f2<MINPX) f2=MINPX;',
    '    if(f2>=f) break;',
    '    f=Math.round(f2*100)/100;',
    '    pakaiFont(st,f);',
    '    min=ukurMin(t);',
    '    if(f<=MINPX) break;',
    '   }',
    '  }catch(e){}',
    ' }',
    '}',
    /* Ukuran huruf baru benar setelah font dokumen selesai dimuat — sama seperti
       paginator. Callback ini didaftarkan LEBIH DULU dari paginator (tag skripnya
       lebih awal), jadi tabel sudah dipaskan sebelum halaman dipecah. */
    'function mulai(){ try{ paskan(); }catch(e){} }',
    'mulai();',
    'try{',
    ' if(document.fonts && document.fonts.ready && document.fonts.ready.then){',
    '  document.fonts.ready.then(function(){ mulai(); });',
    ' }',
    '}catch(e){}',
    '})();'
  ].join('');
  return '<scr'+'ipt>'+js+'<\/scr'+'ipt>';
}
function fklDocShell(extraCss, innerHtml){
  return '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width, initial-scale=1">'+
    '<title>&#8203;</title>'+fklDocFontLink()+
    '<style>'+fklDocBaseCss()+(extraCss||'')+'</style></head><body>'+
    '<table class="fkl-page-wrap">'+
      '<thead><tr><td><div class="fkl-vspace"></div></td></tr></thead>'+
      '<tbody><tr><td><div class="fkl-print-page">'+innerHtml+'</div></td></tr></tbody>'+
      '<tfoot><tr><td><div class="fkl-vspace"></div></td></tr></tfoot>'+
    '</table>'+
    fklFitTblScript()+
    fklPageScript()+
    fklFitScript()+
    '</body></html>';
}

/* Menunggu paginasi (fklPageScript) selesai sebelum mencetak, supaya hasil cetak
   memakai lembar yang SAMA dengan yang dilihat di pratinjau. Bila skrip gagal atau
   terlalu lama (>3 detik), cetak tetap dijalankan memakai tata letak memanjang
   bawaan (fkl-page-wrap) — jadi tombol Cetak tidak pernah macet. */
function fklWaitPaged(ifr, fn, sisa){
  if(sisa==null) sisa=3000;
  let siap=false;
  try{ siap = !!(ifr && ifr.contentWindow && ifr.contentWindow.__fklPaged); }
  catch(e){ siap=true; }
  if(siap || sisa<=0){ fn(); return; }
  setTimeout(()=>fklWaitPaged(ifr, fn, sisa-60), 60);
}

/* ---------- Pemecah halaman bersama (dijalankan DI DALAM dokumen cetak) ----------
   Mengubah satu lembar memanjang (.fkl-print-page) menjadi deretan lembar A4
   (.fkl-sheet) setinggi 273mm area isi (297mm - 12mm - 12mm).

   Aturan pemenggalan MENGIKUTI CSS yang sudah ada di tiap dokumen:
     - break-inside:avoid  -> blok dipindah utuh ke lembar berikutnya (tanda tangan,
       baris tabel, tbody rekap HPS, kartu evaluasi, dll)
     - break-before:page   -> blok selalu memulai lembar baru
   Tabel yang terpotong otomatis mengulang <thead> & <colgroup> di lembar lanjutan.
   Bila terjadi galat apa pun, dokumen DIKEMBALIKAN ke bentuk semula sehingga
   pencetakan tetap berjalan seperti sebelumnya. */
function fklPageScript(){
  const js=[
    '(function(){',
    'var DONE=false;',
    'function mm2px(mm){var d=document.createElement("div");',
    ' d.style.cssText="position:absolute;visibility:hidden;left:-9999px;height:"+mm+"mm";',
    ' document.body.appendChild(d);var h=d.getBoundingClientRect().height;',
    ' d.parentNode.removeChild(d);return h;}',
    'function els(n){var o=[],k=n.firstChild;while(k){if(k.nodeType===1)o.push(k);k=k.nextSibling;}return o;}',
    'function sty(n,p){try{var c=getComputedStyle(n);return c[p]||"";}catch(e){return "";}}',
    'function utuh(n){var v=sty(n,"breakInside")||sty(n,"pageBreakInside");return v==="avoid";}',
    'function halamanBaru(n){var v=sty(n,"breakBefore")||sty(n,"pageBreakBefore");return v==="page"||v==="always";}',
    /* blok yang TIDAK boleh dipecah: dipindah utuh ke lembar berikutnya */
    'function atom(n){',
    ' if(n.nodeType!==1) return true;',
    ' var t=n.tagName;',
    ' if(t==="P"||t==="TR"||t==="IMG"||t==="BR"||t==="HR"||t==="LI"||t==="THEAD"||t==="TFOOT"||t==="COLGROUP") return true;',
    /* SVG (ikon, grafik) bukan HTML biasa: selalu diperlakukan utuh */
    ' if(n.namespaceURI && n.namespaceURI!=="http://www.w3.org/1999/xhtml") return true;',
    /* Penjaga eksplisit: rekap HPS (Jumlah/DPP/PPn/Total/Terbilang) + tanda tangan
       berada dalam satu <tbody class="hps-tail">. Beberapa versi Chrome MENGABAIKAN
       break-inside:avoid pada <tbody> (getComputedStyle mengembalikan "auto"),
       sehingga utuh() gagal mengenalinya dan tanda tangan bisa berdiri sendiri di
       halaman berikutnya, meninggalkan angka rekapnya. Dikunci lewat KELAS agar
       selalu dipindah utuh — sama seperti penjaga di spkPageScript. */
    ' if(n.classList && (n.classList.contains("hps-tail")||n.classList.contains("ttd-row")||n.classList.contains("rho-doc-item")||n.classList.contains("fkl-doc-tail"))) return true;',
    ' if(utuh(n)) return true;',
    ' return els(n).length===0;',
    '}',
    'function bangun(){',
    ' var wrap=document.querySelector("table.fkl-page-wrap"); if(!wrap) return false;',
    ' var page=wrap.querySelector(".fkl-print-page"); if(!page) return false;',
    ' var PH=mm2px(273); if(!PH||PH<200) return false;',
    ' var MINH=mm2px(22);',              /* ruang minimum agar sebuah judul seksi boleh dimulai */
    ' var sheets=[], body=null, stack=[];',
    ' function mk(){',
    '   var sh=document.createElement("section"); sh.className="fkl-sheet";',
    '   var b=document.createElement("div"); b.className="fkl-sheet-bd";',
    '   b.style.height=Math.max(80,PH-2)+"px";',
    '   sh.appendChild(b);',
    '   wrap.parentNode.insertBefore(sh, wrap);',   /* harus di DOM agar tinggi terukur */
    '   sheets.push(sh); body=b;',
    /* bangun ulang "cangkang" pembungkus (mis. div.fkl-doc, table, tbody) di lembar baru */
    '   for(var i=0;i<stack.length;i++){',
    '     var sl=stack[i].src.cloneNode(false);',
    '     if(sl.tagName==="TABLE"){',
    '       var cg=stack[i].src.querySelector("colgroup"); if(cg) sl.appendChild(cg.cloneNode(true));',
    '       var th=stack[i].src.querySelector("thead");    if(th) sl.appendChild(th.cloneNode(true));',
    '     }',
    '     (i===0?body:stack[i-1].el).appendChild(sl);',
    '     stack[i].el=sl;',
    '   }',
    '   return body;',
    ' }',
    ' function tgt(){ return stack.length? stack[stack.length-1].el : body; }',
    ' function penuh(){ return body.scrollHeight > body.clientHeight+1; }',
    ' function kosong(){ return !((body.textContent||"").replace(/[\\s\\u00A0]/g,"")) && !body.querySelector("img,table,svg"); }',
    ' function pakaiBawah(){ var k=els(body); if(!k.length) return 0; var bt=body.getBoundingClientRect().top; return k[k.length-1].getBoundingClientRect().bottom - bt; }',
    ' function sisa(){ return body.clientHeight - pakaiBawah(); }',
    ' function taruh(node){',
    '   if(node.nodeType===1 && halamanBaru(node) && !kosong()) mk();',
    /* judul seksi jangan sampai berdiri sendiri di dasar lembar */
    '   if(node.nodeType===1 && node.classList && node.classList.contains("fkl-sec-h") && !kosong() && sisa()<MINH) mk();',
    '   var t=tgt();',
    '   t.appendChild(node);',
    '   if(!penuh()) return;',
    '   t.removeChild(node);',
    '   if(!atom(node)){',
    '     var sl=node.cloneNode(false);',
    '     t.appendChild(sl);',
    '     if(penuh() && !kosong()){ t.removeChild(sl); mk(); taruh(node); return; }',
    '     if(sl.tagName==="TABLE"){ var cg=node.querySelector("colgroup"); if(cg) sl.appendChild(cg.cloneNode(true)); }',
    '     stack.push({src:node, el:sl});',
    '     var kids=els(node), isTbl=(node.tagName==="TABLE");',
    '     for(var i=0;i<kids.length;i++){',
    '       var kd=kids[i];',
    '       if(isTbl && kd.tagName==="COLGROUP") continue;',
    /* <thead> DISALIN (bukan dipindah) supaya bisa diulang di lembar lanjutan */
    '       if(isTbl && kd.tagName==="THEAD"){ tgt().appendChild(kd.cloneNode(true)); continue; }',
    '       taruh(kd);',
    '     }',
    '     stack.pop();',
    '     return;',
    '   }',
    '   if(kosong()){ t.appendChild(node); return; }',   /* blok lebih tinggi dari 1 lembar */
    '   mk(); tgt().appendChild(node);',
    ' }',
    ' mk();',
    ' var nodes=els(page);',
    ' for(var i=0;i<nodes.length;i++) taruh(nodes[i]);',
    /* buang lembar & cangkang yang akhirnya kosong */
    ' for(var i=sheets.length-1;i>=0;i--){',
    '   var bd=sheets[i].querySelector(".fkl-sheet-bd");',
    '   if(bd && !((bd.textContent||"").replace(/[\\s\\u00A0]/g,"")) && !bd.querySelector("img,table,svg")) sheets[i].parentNode.removeChild(sheets[i]);',
    ' }',
    ' if(!document.querySelector(".fkl-sheet")) return false;',
    ' wrap.parentNode.removeChild(wrap);',
    ' return true;',
    '}',
    'function jalan(){',
    ' if(DONE) return; DONE=true;',
    ' var wrap=document.querySelector("table.fkl-page-wrap");',
    ' var cadangan=wrap?wrap.outerHTML:"";',
    ' try{',
    '   if(!bangun()){',
    /* gagal membentuk lembar -> pulihkan bentuk semula (cetak memanjang seperti dulu) */
    '     var sh=document.querySelectorAll(".fkl-sheet");',
    '     for(var i=sh.length-1;i>=0;i--) sh[i].parentNode.removeChild(sh[i]);',
    '     var w2=document.querySelector("table.fkl-page-wrap");',
    '     if(w2 && cadangan) w2.outerHTML=cadangan;',
    '   }',
    ' }catch(e){',
    '   try{',
    '     console.error("fkl paginate:", e);',
    '     var sh2=document.querySelectorAll(".fkl-sheet");',
    '     for(var j=sh2.length-1;j>=0;j--) sh2[j].parentNode.removeChild(sh2[j]);',
    '     var w3=document.querySelector("table.fkl-page-wrap");',
    '     if(w3 && cadangan) w3.outerHTML=cadangan;',
    '   }catch(_){}',
    ' }',
    ' try{ window.__fklPaged=true; }catch(e2){}',
    '}',
    /* Tinggi teks baru benar setelah font & gambar (logo) selesai dimuat. */
    'function mulai(){',
    ' try{',
    '   if(document.fonts && document.fonts.ready && document.fonts.ready.then){',
    '     document.fonts.ready.then(function(){ jalan(); });',
    '     setTimeout(jalan, 2500);',
    '     return;',
    '   }',
    ' }catch(e){}',
    ' jalan();',
    '}',
    'if(document.readyState==="complete") mulai(); else window.addEventListener("load", mulai);',
    '})();'
  ].join('\n');
  return '<script>'+js+'<\/script>';
}

/* ---------- Paginator Rekap HPS (multi-modul) ----------
   Rekap HPS menggabungkan beberapa dokumen modul; tiap modul dibungkus dalam
   <table.fkl-page-wrap> tersendiri. fklPageScript() hanya memaginasi SATU wrap
   (yang pertama), jadi tidak bisa dipakai apa adanya. hpscPageScript() memakai
   mesin pemenggal yang SAMA persis (bangunSatu), lalu menjalankannya untuk SETIAP
   wrap. Halaman sampul (.hpsc-page) tak tersentuh; hanya modul yang dipecah menjadi
   lembar A4 (.fkl-sheet) sehingga seluruh Rekap menjadi kartu A4 yang seragam dan
   tidak lagi bertumpuk/berantakan. Bila terjadi galat pada satu modul, modul itu
   dikembalikan ke bentuk semula tanpa mengganggu modul lain. */
function hpscPageScript(){
  const js=[
    '(function(){',
    'var DONE=false;',
    'function mm2px(mm){var d=document.createElement("div");',
    ' d.style.cssText="position:absolute;visibility:hidden;left:-9999px;height:"+mm+"mm";',
    ' document.body.appendChild(d);var h=d.getBoundingClientRect().height;',
    ' d.parentNode.removeChild(d);return h;}',
    'function els(n){var o=[],k=n.firstChild;while(k){if(k.nodeType===1)o.push(k);k=k.nextSibling;}return o;}',
    'function sty(n,p){try{var c=getComputedStyle(n);return c[p]||"";}catch(e){return "";}}',
    'function utuh(n){var v=sty(n,"breakInside")||sty(n,"pageBreakInside");return v==="avoid";}',
    'function halamanBaru(n){var v=sty(n,"breakBefore")||sty(n,"pageBreakBefore");return v==="page"||v==="always";}',
    'function atom(n){',
    ' if(n.nodeType!==1) return true;',
    ' var t=n.tagName;',
    ' if(t==="P"||t==="TR"||t==="IMG"||t==="BR"||t==="HR"||t==="LI"||t==="THEAD"||t==="TFOOT"||t==="COLGROUP") return true;',
    ' if(n.namespaceURI && n.namespaceURI!=="http://www.w3.org/1999/xhtml") return true;',
    ' if(n.classList && (n.classList.contains("hps-tail")||n.classList.contains("ttd-row")||n.classList.contains("rho-doc-item")||n.classList.contains("fkl-doc-tail"))) return true;',
    ' if(utuh(n)) return true;',
    ' return els(n).length===0;',
    '}',
    /* Pecah SATU wrap menjadi lembar A4. Mengembalikan jumlah lembar (0=gagal). */
    'function bangunSatu(wrap){',
    ' var page=wrap.querySelector(".fkl-print-page"); if(!page) return 0;',
    ' var PH=mm2px(273); if(!PH||PH<200) return 0;',
    ' var MINH=mm2px(22);',
    ' var sheets=[], body=null, stack=[];',
    ' function mk(){',
    '   var sh=document.createElement("section"); sh.className="fkl-sheet";',
    '   var b=document.createElement("div"); b.className="fkl-sheet-bd";',
    '   b.style.height=Math.max(80,PH-2)+"px";',
    '   sh.appendChild(b);',
    '   wrap.parentNode.insertBefore(sh, wrap);',
    '   sheets.push(sh); body=b;',
    '   for(var i=0;i<stack.length;i++){',
    '     var sl=stack[i].src.cloneNode(false);',
    '     if(sl.tagName==="TABLE"){',
    '       var cg=stack[i].src.querySelector("colgroup"); if(cg) sl.appendChild(cg.cloneNode(true));',
    '       var th=stack[i].src.querySelector("thead");    if(th) sl.appendChild(th.cloneNode(true));',
    '     }',
    '     (i===0?body:stack[i-1].el).appendChild(sl);',
    '     stack[i].el=sl;',
    '   }',
    '   return body;',
    ' }',
    ' function tgt(){ return stack.length? stack[stack.length-1].el : body; }',
    ' function penuh(){ return body.scrollHeight > body.clientHeight+1; }',
    ' function kosong(){ return !((body.textContent||"").replace(/[\\s\\u00A0]/g,"")) && !body.querySelector("img,table,svg"); }',
    ' function pakaiBawah(){ var k=els(body); if(!k.length) return 0; var bt=body.getBoundingClientRect().top; return k[k.length-1].getBoundingClientRect().bottom - bt; }',
    ' function sisa(){ return body.clientHeight - pakaiBawah(); }',
    ' function taruh(node){',
    '   if(node.nodeType===1 && halamanBaru(node) && !kosong()) mk();',
    '   if(node.nodeType===1 && node.classList && node.classList.contains("fkl-sec-h") && !kosong() && sisa()<MINH) mk();',
    '   var t=tgt();',
    '   t.appendChild(node);',
    '   if(!penuh()) return;',
    '   t.removeChild(node);',
    '   if(!atom(node)){',
    '     var sl=node.cloneNode(false);',
    '     t.appendChild(sl);',
    '     if(penuh() && !kosong()){ t.removeChild(sl); mk(); taruh(node); return; }',
    '     if(sl.tagName==="TABLE"){ var cg=node.querySelector("colgroup"); if(cg) sl.appendChild(cg.cloneNode(true)); }',
    '     stack.push({src:node, el:sl});',
    '     var kids=els(node), isTbl=(node.tagName==="TABLE");',
    '     for(var i=0;i<kids.length;i++){',
    '       var kd=kids[i];',
    '       if(isTbl && kd.tagName==="COLGROUP") continue;',
    '       if(isTbl && kd.tagName==="THEAD"){ tgt().appendChild(kd.cloneNode(true)); continue; }',
    '       taruh(kd);',
    '     }',
    '     stack.pop();',
    '     return;',
    '   }',
    '   if(kosong()){ t.appendChild(node); return; }',
    '   mk(); tgt().appendChild(node);',
    ' }',
    ' mk();',
    ' var nodes=els(page);',
    ' for(var i=0;i<nodes.length;i++) taruh(nodes[i]);',
    ' for(var i=sheets.length-1;i>=0;i--){',
    '   var bd=sheets[i].querySelector(".fkl-sheet-bd");',
    '   if(bd && !((bd.textContent||"").replace(/[\\s\\u00A0]/g,"")) && !bd.querySelector("img,table,svg")) sheets[i].parentNode.removeChild(sheets[i]);',
    ' }',
    ' if(!sheets.length) return 0;',
    ' wrap.parentNode.removeChild(wrap);',
    ' return sheets.length;',
    '}',
    'function jalan(){',
    ' if(DONE) return; DONE=true;',
    ' var wraps=[].slice.call(document.querySelectorAll("table.fkl-page-wrap"));',
    ' for(var w=0; w<wraps.length; w++){',
    '   var wrap=wraps[w]; if(!wrap||!wrap.parentNode) continue;',
    '   var induk=wrap.parentNode, cadangan=wrap.outerHTML;',
    '   try{',
    '     if(!bangunSatu(wrap)){',
    '       var sh=induk.querySelectorAll(".fkl-sheet");',
    '       for(var i=sh.length-1;i>=0;i--) sh[i].parentNode.removeChild(sh[i]);',
    '       if(induk.querySelector("table.fkl-page-wrap")===null && cadangan){ induk.insertAdjacentHTML("afterbegin", cadangan); }',
    '     }',
    '   }catch(e){',
    '     try{',
    '       console.error("hpsc paginate:", e);',
    '       var sh2=induk.querySelectorAll(".fkl-sheet");',
    '       for(var j=sh2.length-1;j>=0;j--) sh2[j].parentNode.removeChild(sh2[j]);',
    '       if(induk.querySelector("table.fkl-page-wrap")===null && cadangan){ induk.insertAdjacentHTML("afterbegin", cadangan); }',
    '     }catch(_){}',
    '   }',
    ' }',
    ' try{ window.__hpscPaged=true; window.__fklPaged=true; }catch(e2){}',
    '}',
    'function mulai(){',
    ' try{',
    '   if(document.fonts && document.fonts.ready && document.fonts.ready.then){',
    '     document.fonts.ready.then(function(){ jalan(); });',
    '     setTimeout(jalan, 2500);',
    '     return;',
    '   }',
    ' }catch(e){}',
    ' jalan();',
    '}',
    'if(document.readyState==="complete") mulai(); else window.addEventListener("load", mulai);',
    '})();'
  ].join('\n');
  return '<script>'+js+'<\/script>';
}


/* Bangun HTML dokumen lengkap (mandiri) untuk pratinjau iframe & cetak */
/* Teks URAIAN poin B (Kelengkapan Dokumen) & C (Hasil Pemeriksaan) pada Form
   Pemeriksaan Kelengkapan Dokumen Pengadaan dinaikkan ke 12px (permintaan
   21 Jul 2026; bawaan #fkl-doc-css 11px). Hanya dokumen ini (.fkl-kd-doc) —
   dokumen lain yang memakai kerangka .fkl-doc tidak tersentuh. */
function fklKdDocCss(){
  return '.fkl-kd-doc .fkl-chk tbody td{font-size:12px}'+
         '.fkl-kd-doc .hasil .hs{font-size:12px}';
}
function fklStandaloneDocHtml(){
  return fklDocShell(fklKdDocCss(), fklBuildDocHtml());
}

function fklOpenPreview(){
  const ov=document.getElementById('pn-preview-overlay'); if(!ov) return;
  const _mdl3=ov.querySelector('.pn-preview-modal'); if(_mdl3) _mdl3.classList.remove('is-max');
  pnPreviewResetMaxBtn();
  const titleEl=document.getElementById('pn-preview-title');
  if(titleEl) titleEl.textContent='Pratinjau — Form Pemeriksaan Kelengkapan Dokumen';
  const body=document.getElementById('pn-preview-body');
  if(body){
    body.classList.add('fkl-preview-body');
    body.innerHTML='<iframe id="fkl-preview-frame" title="Pratinjau Dokumen"></iframe>';
    const ifr=document.getElementById('fkl-preview-frame');
    const doc=ifr.contentWindow.document;
    doc.open(); doc.write(fklStandaloneDocHtml()); doc.close();
  }
  /* Tombol aksi pada header pratinjau: sisipkan tombol Cetak khusus FKL bila belum ada */
  const actions=document.querySelector('#pn-preview-overlay .pn-preview-head-actions');
  { const _c=document.getElementById('hpsc-preview-print'); if(_c) _c.remove(); }
  const _oldPnw=document.getElementById('pnw-preview-print'); if(_oldPnw) _oldPnw.remove();
  const _oldHpsc=document.getElementById('hpsc-preview-print'); if(_oldHpsc) _oldHpsc.remove();
  if(actions && !document.getElementById('fkl-preview-print')){
    const btn=document.createElement('button');
    btn.id='fkl-preview-print'; btn.className='btn btn-teal';
    btn.style.padding='8px 14px'; btn.style.fontSize='11px';
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>Cetak / PDF';
    btn.onclick=fklPrint;
    actions.insertBefore(btn, actions.firstChild);
  }
  ov.classList.add('show');
}

/* Bantu cetak: browser (Chrome/Edge) memakai judul TAB UTAMA (bukan judul
   dokumen di dalam iframe tersembunyi) untuk header cetak/PDF, sehingga
   "Monitoring Pengadaan Masohi" tetap muncul walau <title> iframe sudah
   dikosongkan. Judul TIDAK dikosongkan dengan string kosong/spasi biasa,
   karena Chrome menganggapnya "tanpa judul" lalu menggantinya dengan nama
   domain (mis. "pengadaan-masohi.com") pada header cetak — bukan blank.
   Dipakai karakter zero-width space (tak kasat mata, tapi tetap dianggap
   "ada judul") supaya header cetak benar-benar tidak menampilkan tulisan
   apa pun selain tanggal & jam cetak. Fungsi ini menyembunyikan sementara
   judul tab utama selama proses cetak berlangsung, lalu mengembalikannya
   setelah selesai. Dipakai oleh semua fungsi *Print() dokumen (fkl, pnw,
   rho, hps, ana, jk) agar konsisten di semua PDF. */
const APP_PAGE_TITLE='Monitoring Pengadaan Masohi';
function withHiddenPageTitle(fn){
  const ZW='\u200B';
  // Judul tab aplikasi dijaga SELALU tampil (tidak pernah dikosongkan). Header cetak
  // tetap bersih karena tiap dokumen dicetak lewat iframe yang sudah punya <title>
  // zero-width sendiri, jadi judul tab induk tak perlu diubah saat mencetak. Ini juga
  // mencegah bug lama: tab jadi kosong permanen bila proses restore gagal.
  if(!document.title || document.title===ZW) document.title=APP_PAGE_TITLE;
  try{ fn(); }
  finally{
    if(!document.title || document.title===ZW) document.title=APP_PAGE_TITLE;
    setTimeout(()=>{ if(!document.title || document.title===ZW) document.title=APP_PAGE_TITLE; }, 1500);
  }
}
/* Cetak dokumen (mencetak isi dokumen yang sama dengan pratinjau) */
function fklPrint(){
  // Buat iframe terisolasi agar isi dokumen pasti tercetak (tidak terpengaruh overlay/aplikasi)
  const old=document.getElementById('fkl-print-frame'); if(old) old.remove();
  const ifr=document.createElement('iframe');
  ifr.id='fkl-print-frame';
  ifr.setAttribute('aria-hidden','true');
  ifr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(ifr);
  const doc=ifr.contentWindow.document;
  doc.open(); doc.write(fklStandaloneDocHtml()); doc.close();
  const go=()=>fklWaitPaged(ifr, _go);
  const _go=()=>{
    withHiddenPageTitle(()=>{ try{ ifr.contentWindow.focus(); ifr.contentWindow.print(); }catch(e){ try{ window.print(); }catch(_){} } });
    setTimeout(()=>{ const f=document.getElementById('fkl-print-frame'); if(f) f.remove(); }, 1500);
  };
  const imgs=doc.images ? Array.from(doc.images) : [];
  if(imgs.length){
    let n=imgs.length;
    const dec=()=>{ if(--n<=0) setTimeout(go,60); };
    imgs.forEach(im=>{ if(im.complete) dec(); else { im.onload=dec; im.onerror=dec; } });
    setTimeout(go, 1200);
  } else { setTimeout(go, 120); }
}


/* ####################### MODUL PEMBUKAAN PENAWARAN ####################### */
/* ==================================================================
   MODUL PEMBUKAAN PENAWARAN
   Alur 4 langkah:
     1. Data Pekerjaan  (+ jumlah & nama penyedia, pejabat pelaksana)
     2. Pilihan Kategori (1 grup utk 1 Sampul, 2 grup utk 2 Sampul/2 Tahap)
     3. Pengisian Persyaratan (baris persyaratan per kategori, bisa tambah/hapus)
     4. Pemeriksaan Kelengkapan (per penyedia: Ada/Tidak Ada + Keterangan)
   Simpan -> Lihat Hasil Pemeriksaan + cetak PDF.
   Pola menyalin modul Kelengkapan (FKL): stepper, form-card, fkl-actions,
   fkl-check, fkl-ada, dokumen cetak (kop PLN), penyimpanan Supabase.
   ================================================================== */

const PNW_METODE = ['Pengadaan Langsung','Tender Terbuka','Tender Terbatas','Seleksi Umum','Seleksi Terbatas','Penunjukan Langsung','Tender Cepat'];
const PNW_JENIS_ANGGARAN = ['Investasi','Operasi'];
const PNW_PENYAMPAIAN = ['1 Tahap 1 Sampul','1 Tahap 2 Sampul','2 Tahap'];
/* Kategori dokumen penawaran */
const PNW_KATEGORI = ['Data Administrasi','Data Teknis','Keuangan','Jaminan Penawaran','Penawaran Harga'];
/* Kategori Penawaran Harga terkunci: 3 item wajib, tidak bisa ditambah/kurang */
const PNW_HARGA_LOCK = ['Surat Penawaran','Nilai RAB','Jangka Waktu Pelaksanaan'];

/* Field data pekerjaan (langkah 1). Penyedia & pejabat ditangani terpisah. */
const PNW_INFO_FIELDS = [
  {key:'nama',          label:'Nama Pekerjaan',        type:'text', span:2},
  {key:'lokasi',        label:'Lokasi Pekerjaan',      type:'text', span:2},
  {key:'nilai',         label:'Rencana Anggaran Biaya', type:'num'},
  {key:'no_anggaran',   label:'No. Anggaran',          type:'text'},
  {key:'tgl_anggaran',  label:'Tgl. Anggaran',         type:'date'},
  {key:'jenis_anggaran',label:'Jenis Anggaran',        type:'select', options:PNW_JENIS_ANGGARAN},
  {key:'metode',        label:'Metode Pengadaan',      type:'select', options:PNW_METODE},
  {key:'penyampaian',   label:'Metode Penyampaian Dokumen', type:'select', span:2, options:PNW_PENYAMPAIAN}
];

/* ---------- State ----------
   info      : { key:value }  data pekerjaan
   penyedia  : ['Nama A', ...] sepanjang jumlah
   pejabat   : nama pejabat pelaksana pengadaan (utk ttd)
   pilih     : { s1:{kategori:true}, s2:{kategori:true} }  kategori dicentang per sampul
   syarat    : { s1:{ kategori:[ 'baris', ... ] }, s2:{...} }  daftar persyaratan
   periksa   : { s1:{ penyediaIdx:{ 'kat||baris': {ada:bool, ket:str} } }, s2:{...} }
*/
function pnwBlankState(){
  return { info:{}, penyedia:[''], pejabat:'', pilih:{s1:{},s2:{}}, syarat:{s1:{},s2:{}}, periksa:{s1:{},s2:{}}, profilLoaded:false };
}
let pnwState = pnwBlankState();
let pnwStep = 1;               // 1..4
let pnwActiveSampul = 's1';    // langkah 4: sampul yang sedang diperiksa
let pnwActivePenyedia = 0;     // langkah 4: indeks penyedia yang sedang diperiksa
let pnwEditId = null;
let pnwPreviewState = null;    // utk pratinjau record tersimpan
let pnwPreviewSampul = 's1';   // sampul aktif saat cetak/pratinjau

const PNW_STATE_KEY = 'pnw_state_v1';
function pnwLoadState(){ try{ const raw=ssGet(PNW_STATE_KEY); if(raw){ const o=JSON.parse(raw); if(o&&o.info) pnwState=o; } }catch(e){} }
function pnwSaveState(){ try{ ssSet(PNW_STATE_KEY, JSON.stringify(pnwState)); }catch(e){} }
pnwLoadState();

/* Sampul: apakah pekerjaan memakai 2 sampul (2 Sampul / 2 Tahap) */
function pnwIsTwoSampul(st){ const p=(st||pnwState).info.penyampaian||''; return p==='1 Tahap 2 Sampul' || p==='2 Tahap'; }
function pnwSampulList(st){ return pnwIsTwoSampul(st) ? ['s1','s2'] : ['s1']; }
function pnwSampulLabel(sk){ return sk==='s2' ? 'Sampul Dua' : 'Sampul Satu'; }
/* Judul grup kategori di langkah 2 */
function pnwKategoriTitle(st, sk){
  if(!pnwIsTwoSampul(st)) return 'Pilihan Kategori Dokumen';
  return 'Pilihan Kategori Dokumen ' + (sk==='s2' ? 'Sampul Dua' : 'Sampul Satu');
}

/* ---------- Penyimpanan Supabase ---------- */
const PNW_TABLE = 'pembukaan_penawaran';
let records_pembukaan = [];
function pnwSupaReady(){ return !!(USE_SUPABASE && db); }
const StorePembukaan = {
  async list(){
    if(!pnwSupaReady()) return [];
    const {data,error}=await db.from(PNW_TABLE).select('*').order('created_at',{ascending:false});
    if(error) throw error; return data||[];
  },
  async create(rec){
    if(!pnwSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(PNW_TABLE).insert(rec).select();
    if(error) throw error; return data&&data[0];
  },
  async update(rid, rec){
    if(!pnwSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(PNW_TABLE).update(rec).eq('id',rid);
    if(error) throw error;
  },
  async remove(rid){
    if(!pnwSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(PNW_TABLE).delete().eq('id',rid);
    if(error) throw error;
  }
};
async function refreshDataPembukaan(){
  try{ records_pembukaan = await StorePembukaan.list(); }
  catch(err){ console.error(err); records_pembukaan = records_pembukaan||[]; toast('Gagal memuat data Pembukaan Penawaran: '+errMsg(err),'err'); }
}

/* ---------- Buka form / lihat data ---------- */
function openPnwInput(editId){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  pnwPreviewState=null;
  if(editId){
    const rec=records_pembukaan.find(r=>String(r.id)===String(editId));
    pnwEditId = rec ? rec.id : null;
    pnwState = rec ? pnwRecordToState(rec) : pnwBlankState();
  }else{
    pnwEditId = null; pnwState = pnwBlankState();
    resetInputBaru('pnw');
  }
  pnwStep=1; pnwActiveSampul='s1'; pnwActivePenyedia=0;
  pnwSaveState(); showView('form-pembukaan');
}
function openPnwView(){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  refreshDataPembukaan().then(()=>showView('pnw-view'));
}
function pnwRecordToState(rec){
  const base=pnwBlankState();
  const s=(rec&&rec.state&&typeof rec.state==='object')?rec.state:{};
  return {
    info:  Object.assign({}, base.info,  s.info||{}),
    penyedia: Array.isArray(s.penyedia)&&s.penyedia.length ? s.penyedia.slice() : [''],
    pejabat: s.pejabat||'',
    pilih: { s1:Object.assign({}, (s.pilih&&s.pilih.s1)||{}), s2:Object.assign({}, (s.pilih&&s.pilih.s2)||{}) },
    syarat:{ s1:Object.assign({}, (s.syarat&&s.syarat.s1)||{}), s2:Object.assign({}, (s.syarat&&s.syarat.s2)||{}) },
    periksa:{ s1:Object.assign({}, (s.periksa&&s.periksa.s1)||{}), s2:Object.assign({}, (s.periksa&&s.periksa.s2)||{}) }
  };
}
function pnwActiveState(){ return pnwPreviewState || pnwState; }
function pnwMarkActive(){ document.querySelectorAll('.topnav-item[data-view="form-pembukaan"]').forEach(b=>b.classList.add('active')); }

/* ---------- Stepper ---------- */
function pnwStepperHtml(){
  const steps=[['1','Data Pekerjaan'],['2','Pilihan Kategori'],['3','Pengisian Persyaratan'],['4','Pemeriksaan']];
  return '<div class="fkl-stepper">'+steps.map((s,i)=>{
    const n=i+1;
    const cls = n<pnwStep ? 'done' : (n===pnwStep ? 'active' : '');
    const mark = n<pnwStep
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>'
      : s[0];
    const line = i<steps.length-1 ? '<div class="fkl-step-line '+(n<pnwStep?'done':'')+'"></div>' : '';
    return '<div class="fkl-step '+cls+'"><div class="fkl-step-dot">'+mark+'</div><div class="fkl-step-name">'+s[1]+'</div></div>'+line;
  }).join('')+'</div>';
}

/* ================= LANGKAH 1: DATA PEKERJAAN ================= */
const PNW_DP_LOCK_KEYS=['nama','lokasi','nilai','no_anggaran','tgl_anggaran','jenis_anggaran','metode'];
function pnwIsLocked(key){ return !!(pnwState.info && pnwState.info.dpId) && PNW_DP_LOCK_KEYS.indexOf(key)>=0; }
function pnwInfoInputHtml(f){
  const id='pnw-'+f.key;
  const span=f.span?(' style="grid-column:span '+f.span+'"'):'';
  const locked=pnwIsLocked(f.key); const dis=locked?' disabled':'';
  let ctl;
  if(f.type==='select'){
    const extra = f.key==='penyampaian' ? ' onchange="pnwOnPenyampaianChange()"' : ' onchange="pnwOnInfoChange()"';
    ctl='<select id="'+id+'"'+dis+extra+'><option value="">— Pilih —</option>'+(f.options||[]).map(o=>'<option>'+fkEsc(o)+'</option>').join('')+'</select>';
  }
  else if(f.type==='num') ctl='<input id="'+id+'" type="text" inputmode="numeric" placeholder="Rp"'+dis+' oninput="onRupiahInput(this)" onchange="pnwOnInfoChange()">';
  else if(f.type==='date') ctl='<input id="'+id+'" type="date"'+dis+' onchange="pnwOnInfoChange()">';
  else ctl='<input id="'+id+'" type="text"'+dis+' oninput="pnwOnInfoChange()">';
  return '<div class="field'+(locked?' is-locked':'')+'"'+span+'><label>'+fkEsc(f.label)+'</label>'+ctl+(locked?DP_LOCK_BADGE:'')+'</div>';
}
function pnwPenyediaFieldsHtml(){
  const st=pnwState, n=st.penyedia.length;
  let opts=''; for(let i=1;i<=20;i++) opts+='<option value="'+i+'"'+(i===n?' selected':'')+'>'+i+' Penyedia</option>';
  let html='<div class="field"><label>Jumlah Penyedia</label><select id="pnw-jumlah" onchange="pnwOnJumlahChange(this)">'+opts+'</select></div>';
  html+='<div class="field" style="grid-column:span 3"><label>Nama Pejabat Pelaksana Pengadaan</label><input id="pnw-pejabat" type="text" placeholder="Nama pejabat pelaksana" oninput="pnwOnPejabatChange(this)"></div>';
  return html;
}
function pnwPenyediaListHtml(){
  const st=pnwState;
  const rows=st.penyedia.map((nm,i)=>{
    return '<div class="field"><label>Nama Penyedia '+(i+1)+'</label>'+
      '<input type="text" data-pidx="'+i+'" placeholder="Nama penyedia ke-'+(i+1)+'" oninput="pnwOnPenyediaNama(this)" value="'+fkEsc(nm||'')+'"></div>';
  }).join('');
  return '<div class="form-flow" style="--cols:3">'+rows+'</div>';
}

/* ================= LANGKAH 2: PILIHAN KATEGORI ================= */
function pnwKategoriGroupHtml(sk){
  const st=pnwState, sel=st.pilih[sk]||{};
  const kategoriList=pnwKategoriUntukSampul(st,sk);
  const two=pnwIsTwoSampul(st);
  const items=kategoriList.map((kat)=>{
    const idx=PNW_KATEGORI.indexOf(kat);           // nomor tetap sesuai urutan asli
    const on=!!sel[kat];
    // Penawaran Harga pada Sampul Dua (2 sampul): otomatis terpilih & terkunci
    const autoLock = two && sk==='s2' && kat==='Penawaran Harga';
    const checked = autoLock ? true : on;
    const attrs = autoLock ? 'checked disabled' : (checked?'checked':'');
    return '<label class="fkl-check'+(autoLock?' is-locked':'')+'">'+
      '<input type="checkbox" data-sk="'+sk+'" data-kat="'+fkEsc(kat)+'" '+attrs+' onchange="pnwOnPilih(this)">'+
      '<span class="pn-check-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></span>'+
      '<span class="fkl-num">'+(idx+1)+'</span>'+
      '<span class="fkl-lbl">'+fkEsc(kat)+'</span>'+
    '</label>';
  }).join('');
  const cnt=kategoriList.filter(k=>sel[k]).length;
  return '<div class="form-card"><div class="form-section-title">'+FKL_SEC_ICON+fkEsc(pnwKategoriTitle(st,sk))+
    ' <span class="fkl-count-chip">'+cnt+' dipilih</span></div>'+
    '<div class="fkl-checkgrid" style="--rows:'+Math.ceil(kategoriList.length/2)+'">'+items+'</div></div>';
}

/* ================= LANGKAH 3: PENGISIAN PERSYARATAN ================= */
function pnwSelectedKategori(st, sk){ const sel=(st||pnwState).pilih[sk]||{}; return PNW_KATEGORI.filter(k=>sel[k]); }
/* Daftar kategori yang DITAMPILKAN sebagai pilihan pada satu sampul.
   Untuk metode 2 sampul/2 tahap: "Penawaran Harga" hanya ada di Sampul Dua,
   sehingga dikeluarkan dari daftar pilihan Sampul Satu. */
function pnwKategoriUntukSampul(st, sk){
  st=st||pnwState;
  if(pnwIsTwoSampul(st)){
    if(sk==='s1') return PNW_KATEGORI.filter(k=>k!=='Penawaran Harga');  // Sampul Satu: tanpa Penawaran Harga
    return ['Penawaran Harga'];                                          // Sampul Dua: HANYA Penawaran Harga
  }
  return PNW_KATEGORI.slice();
}
/* Terapkan aturan Penawaran Harga:
   - 2 sampul/2 tahap: Sampul Dua otomatis memilih "Penawaran Harga" (terkunci),
     dan Sampul Satu tidak boleh memilih "Penawaran Harga". */
function pnwEnforceHargaRule(st){
  st=st||pnwState;
  if(pnwIsTwoSampul(st)){
    // Sampul Dua HANYA berisi "Penawaran Harga" (kategori lain dibersihkan)
    st.pilih.s2 = { 'Penawaran Harga': true };
    // "Penawaran Harga" dikeluarkan dari Sampul Satu
    if(st.pilih.s1) delete st.pilih.s1['Penawaran Harga'];
  }
}
/* pastikan tiap kategori terpilih punya array syarat (default 3 baris, Penawaran Harga terkunci) */
function pnwEnsureSyarat(){
  const st=pnwState;
  pnwEnforceHargaRule(st);
  pnwSampulList(st).forEach(sk=>{
    st.syarat[sk]=st.syarat[sk]||{};
    pnwSelectedKategori(st,sk).forEach(kat=>{
      if(kat==='Penawaran Harga'){ st.syarat[sk][kat]=PNW_HARGA_LOCK.slice(); return; }
      if(!Array.isArray(st.syarat[sk][kat])) st.syarat[sk][kat]=['','',''];
    });
    // buang kategori yang tak lagi dipilih
    Object.keys(st.syarat[sk]).forEach(kat=>{ if(!pnwSelectedKategori(st,sk).includes(kat)) delete st.syarat[sk][kat]; });
  });
}
function pnwSyaratGroupHtml(sk){
  const st=pnwState, kats=pnwSelectedKategori(st,sk);
  if(!kats.length) return '';
  const head = pnwIsTwoSampul(st) ? '<div class="pnw-sampul-band">'+fkEsc(pnwSampulLabel(sk))+'</div>' : '';
  const cards=kats.map(kat=>{
    const locked = kat==='Penawaran Harga';
    const arr = st.syarat[sk][kat]||[];
    const rows=arr.map((val,i)=>{
      if(locked){
        return '<div class="pnw-syarat-row locked"><span class="pnw-syarat-no">'+(i+1)+'</span>'+
          '<input type="text" value="'+fkEsc(val)+'" readonly>'+
          '<span class="pnw-lock-badge">Terkunci</span></div>';
      }
      return '<div class="pnw-syarat-row"><span class="pnw-syarat-no">'+(i+1)+'</span>'+
        '<input type="text" data-sk="'+sk+'" data-kat="'+fkEsc(kat)+'" data-i="'+i+'" placeholder="Uraian persyaratan" value="'+fkEsc(val)+'" oninput="pnwOnSyaratInput(this)">'+
        '<button type="button" class="pnw-syarat-del" title="Hapus baris" onclick="pnwSyaratDel(\''+sk+'\',\''+fkEscJs(kat)+'\','+i+')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button></div>';
    }).join('');
    const addBtn = locked ? '' : '<button type="button" class="pnw-syarat-add" onclick="pnwSyaratAdd(\''+sk+'\',\''+fkEscJs(kat)+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>Tambah Persyaratan</button>';
    const lockNote = locked ? '<div class="pnw-lock-note">Kategori Penawaran Harga terkunci: Surat Penawaran, Nilai RAB, dan Jangka Waktu Pelaksanaan.</div>' : '';
    return '<div class="pnw-kat-card"><div class="pnw-kat-head">'+fkEsc(kat)+'</div>'+lockNote+
      '<div class="pnw-syarat-list">'+rows+'</div>'+addBtn+'</div>';
  }).join('');
  return head+cards;
}
function pnwSyaratAdd(sk,kat){ const st=pnwState; st.syarat[sk]=st.syarat[sk]||{}; st.syarat[sk][kat]=st.syarat[sk][kat]||[]; st.syarat[sk][kat].push(''); pnwSaveState(); renderPnwForm(); }
function pnwSyaratDel(sk,kat,i){ const st=pnwState; const arr=st.syarat[sk][kat]||[]; if(arr.length<=1){ toast('Minimal satu baris persyaratan','warn'); return; } arr.splice(i,1); pnwSaveState(); renderPnwForm(); }
function pnwOnSyaratInput(el){ const st=pnwState; const sk=el.dataset.sk, kat=el.dataset.kat, i=+el.dataset.i; st.syarat[sk]=st.syarat[sk]||{}; st.syarat[sk][kat]=st.syarat[sk][kat]||[]; st.syarat[sk][kat][i]=el.value; pnwSaveState(); }

/* ================= TEMPLATE EXCEL PERSYARATAN (Unduh / Unggah) =================
   Satu sheet per kategori (per sampul bila metode 2 sampul). Tiap sheet memuat
   metadata Sampul & Kategori pada baris 1-2 (dipakai saat membaca ulang), lalu
   tabel "No | Uraian Persyaratan" mulai baris 5. Jumlah baris bebas — pembacaan
   berjalan sampai baris terakhir yang terisi, jadi 100+ persyaratan pun terbaca.
   Kategori "Penawaran Harga" ikut dicetak sebagai rujukan, tetapi diabaikan saat
   unggah karena isinya terkunci. */
const PNW_XLS_MIN_ROWS = 3;      // baris uraian kosong bawaan tiap sheet
function pnwXlsSheetName(twoSampul, sk, kat){
  var nm = (twoSampul ? (sk==='s2'?'S2 - ':'S1 - ') : '') + kat;
  return nm.replace(/[\[\]\*\?\/\\:]/g,'-').slice(0,31);
}
function pnwXlsNorm(v){ return String(v==null?'':v).toLowerCase().replace(/[^a-z0-9]+/g,''); }
function pnwXlsFindKategori(v){
  var n=pnwXlsNorm(v); if(!n) return null;
  for(var i=0;i<PNW_KATEGORI.length;i++){ if(pnwXlsNorm(PNW_KATEGORI[i])===n) return PNW_KATEGORI[i]; }
  return null;
}
async function pnwXlsTemplate(){
  try{
    if(typeof ExcelJS==='undefined'){ toast('Pustaka Excel belum termuat. Muat ulang halaman.','warn'); return; }
    pnwEnsureSyarat();
    var st=pnwState, two=pnwIsTwoSampul(st);
    var wb=new ExcelJS.Workbook();
    wb.creator='Monitoring Pengadaan UP3 Masohi';
    var sheets=0;
    pnwSampulList(st).forEach(function(sk){
      pnwSelectedKategori(st,sk).forEach(function(kat){
        var locked = (kat==='Penawaran Harga');
        var arr=(st.syarat[sk]&&st.syarat[sk][kat])?st.syarat[sk][kat].slice():[];
        while(arr.length < PNW_XLS_MIN_ROWS) arr.push('');
        var ws=wb.addWorksheet(pnwXlsSheetName(two,sk,kat));
        ws.columns=[{width:6},{width:110}];
        ws.getCell('A1').value='Sampul';   ws.getCell('B1').value=pnwSampulLabel(sk);
        ws.getCell('A2').value='Kategori'; ws.getCell('B2').value=kat;
        ['A1','A2'].forEach(function(a){ ws.getCell(a).font={bold:true,color:{argb:'FF095E66'}}; });
        ['B1','B2'].forEach(function(a){ ws.getCell(a).font={bold:true}; });
        ws.getCell('A4').value='No'; ws.getCell('B4').value='Uraian Persyaratan';
        ['A4','B4'].forEach(function(a){
          var c=ws.getCell(a);
          c.font={bold:true,color:{argb:'FFFFFFFF'}};
          c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0E7C86'}};
          c.alignment={vertical:'middle',horizontal:a==='A4'?'center':'left'};
        });
        var border={top:{style:'thin',color:{argb:'FFBFD6D8'}},left:{style:'thin',color:{argb:'FFBFD6D8'}},
                    bottom:{style:'thin',color:{argb:'FFBFD6D8'}},right:{style:'thin',color:{argb:'FFBFD6D8'}}};
        arr.forEach(function(v,i){
          var r=5+i;
          ws.getCell(r,1).value=i+1;
          ws.getCell(r,2).value=String(v==null?'':v);
          ws.getCell(r,1).alignment={horizontal:'center',vertical:'middle'};
          ws.getCell(r,2).alignment={vertical:'middle',wrapText:true};
          ws.getCell(r,2).numFmt='@';
          ws.getCell(r,1).border=border; ws.getCell(r,2).border=border;
          if(i%2===1){ [1,2].forEach(function(c){ ws.getCell(r,c).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF2F7F8'}}; }); }
        });
        if(locked){
          ws.getCell('D1').value='Kategori terkunci — perubahan pada sheet ini diabaikan saat diunggah.';
          ws.getCell('D1').font={italic:true,color:{argb:'FFB35A00'}};
        }
        ws.views=[{state:'frozen',ySplit:4}];
        sheets++;
      });
    });
    if(!sheets){ toast('Belum ada kategori dipilih. Kembali ke langkah Pilihan Kategori.','warn'); return; }
    var wsG=wb.addWorksheet('Petunjuk');
    wsG.columns=[{width:24},{width:96}];
    [['PETUNJUK PENGISIAN',''],['',''],
     ['Satu sheet = satu kategori','Nama sheet & sel B2 menandai kategorinya. Jangan ubah baris 1-2.'],
     ['Menambah persyaratan','Ketik saja pada baris berikutnya di kolom B. Jumlah baris bebas (100+ boleh).'],
     ['Menghapus persyaratan','Kosongkan sel di kolom B. Baris kosong otomatis diabaikan.'],
     ['Kolom No','Boleh dibiarkan — penomoran ditata ulang oleh aplikasi.'],
     ['Penawaran Harga','Terkunci di aplikasi. Sheet-nya hanya rujukan dan diabaikan saat unggah.'],
     ['Sheet baru','Sheet tambahan diabaikan kecuali sel B2 berisi nama kategori yang dikenal.']
    ].forEach(function(r){ wsG.addRow(r); });
    wsG.getCell('A1').font={bold:true,size:14,color:{argb:'FF0E7C86'}};
    for(var r=3;r<=8;r++) wsG.getCell('A'+r).font={bold:true,color:{argb:'FF095E66'}};

    var buf=await wb.xlsx.writeBuffer();
    var blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a'); a.href=url;
    a.download='Template_Persyaratan_Pembukaan_Penawaran.xlsx';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast('Template persyaratan diunduh ('+sheets+' kategori)','ok');
  }catch(err){ console.error('pnwXlsTemplate:',err); try{ toast('Gagal membuat template: '+errMsg(err),'warn'); }catch(e){} }
}
function pnwXlsUpload(){
  var run=function(f){ pnwXlsRead(f); };
  try{
    if(typeof openTplUpload==='function'){
      openTplUpload({ title:'Unggah Template — Persyaratan Penawaran', accept:'.xlsx,.xls',
                      hint:'Hanya file Excel (.xlsx / .xls)', onFile:run });
      return;
    }
  }catch(e){}
  var inp=document.createElement('input'); inp.type='file'; inp.accept='.xlsx,.xls';
  inp.onchange=function(){ if(inp.files&&inp.files[0]) run(inp.files[0]); };
  inp.click();
}
function pnwXlsRead(file){
  if(!file) return;
  if(typeof XLSX==='undefined'){ toast('Pustaka Excel belum termuat. Muat ulang halaman.','warn'); return; }
  if(!/\.(xlsx|xls)$/i.test(file.name||'')){ toast('Berkas harus berformat Excel (.xlsx / .xls)','warn', TOAST_MS_UPLOAD); return; }
  var rd=new FileReader();
  rd.onload=function(e){
    try{
      var wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});
      var st=pnwState, two=pnwIsTwoSampul(st);
      var hasil={}, nKat=0, nRow=0, dilewati=[];
      wb.SheetNames.forEach(function(name){
        var ws=wb.Sheets[name]; if(!ws) return;
        var rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
        if(!rows.length) return;
        var cell=function(r,c){ return (rows[r]&&rows[r][c]!=null)?String(rows[r][c]).trim():''; };

        /* kategori: utamakan metadata B2, lalu nama sheet */
        var kat=null;
        if(pnwXlsNorm(cell(1,0))==='kategori') kat=pnwXlsFindKategori(cell(1,1));
        if(!kat) kat=pnwXlsFindKategori(String(name).replace(/^s[12]\s*-\s*/i,''));
        if(!kat){ if(pnwXlsNorm(name)!=='petunjuk') dilewati.push(name); return; }
        if(kat==='Penawaran Harga') return;   // terkunci

        /* sampul: metadata B1, lalu awalan nama sheet */
        var sk='s1';
        if(two){
          var sv=pnwXlsNorm(cell(0,0))==='sampul' ? pnwXlsNorm(cell(0,1)) : '';
          if(sv.indexOf('dua')>=0 || sv==='s2' || /^s2\s*-/i.test(name)) sk='s2';
        }
        if(two && sk==='s1' && kat==='Penawaran Harga') return;

        /* cari baris header "Uraian", lalu baca seluruh baris di bawahnya */
        var hdr=-1, colU=1;
        for(var r=0;r<Math.min(rows.length,30);r++){
          for(var c=0;c<(rows[r]||[]).length;c++){
            if(pnwXlsNorm(rows[r][c]).indexOf('uraian')===0){ hdr=r; colU=c; break; }
          }
          if(hdr>=0) break;
        }
        if(hdr<0){ hdr=3; colU=1; }
        var list=[];
        for(var r2=hdr+1;r2<rows.length;r2++){
          var v=(rows[r2]&&rows[r2][colU]!=null)?String(rows[r2][colU]).trim():'';
          if(v) list.push(v);
        }
        if(!list.length) return;
        hasil[sk]=hasil[sk]||{}; hasil[sk][kat]=list;
        nKat++; nRow+=list.length;
      });

      if(!nKat){ toast('Tidak ada kategori yang dikenali di berkas ini','warn', TOAST_MS_UPLOAD); return; }
      Object.keys(hasil).forEach(function(sk){
        st.pilih[sk]=st.pilih[sk]||{};
        st.syarat[sk]=st.syarat[sk]||{};
        Object.keys(hasil[sk]).forEach(function(kat){
          st.pilih[sk][kat]=true;
          st.syarat[sk][kat]=hasil[sk][kat];
        });
      });
      pnwEnforceHargaRule(st);
      pnwEnsureSyarat();
      pnwSaveState();
      try{ renderPnwForm(); }catch(e){}
      var msg=nKat+' kategori & '+nRow+' persyaratan dimuat';
      if(dilewati.length) msg+=' (sheet dilewati: '+dilewati.slice(0,3).join(', ')+(dilewati.length>3?'…':'')+')';
      toast(msg,'ok');
    }catch(err){ console.error('pnwXlsRead:',err); try{ toast('Gagal membaca berkas: '+errMsg(err),'warn', TOAST_MS_UPLOAD); }catch(e){} }
  };
  rd.onerror=function(){ try{ toast('Gagal membaca berkas','warn'); }catch(e){} };
  rd.readAsArrayBuffer(file);
}

/* ================= PROFIL PERSYARATAN (Simpan / Muat) =================
   Menyimpan daftar kategori + uraian persyaratan agar tidak perlu diketik ulang
   untuk pengadaan dengan persyaratan yang sama. Disimpan di localStorage browser
   (bertahan antar-sesi), terpisah dari data pekerjaan yang tersimpan di Supabase. */
const PNW_PROFIL_KEY='pnw_syarat_profiles_v1';
/* Profil Persyaratan kini tersimpan di Supabase (cache: profileCache.syarat). */
function pnwProfilAll(){ return profilesGet('syarat'); }
function pnwProfilSnapshot(){ const st=pnwState; return { pilih: JSON.parse(JSON.stringify(st.pilih||{})), syarat: JSON.parse(JSON.stringify(st.syarat||{})) }; }
function pnwProfilCount(snap){ let n=0; Object.values((snap&&snap.syarat)||{}).forEach(katObj=>Object.values(katObj||{}).forEach(arr=>{ (arr||[]).forEach(v=>{ if(String(v==null?'':v).trim()) n++; }); })); return n; }
function pnwProfilOverlay(inner){
  let ov=document.getElementById('pnw-profil-ov');
  if(!ov){ ov=document.createElement('div'); ov.id='pnw-profil-ov'; ov.className='pnw-profil-ov'; document.body.appendChild(ov); ov.onclick=(e)=>{ if(e.target===ov) pnwProfilClose(); }; }
  ov.innerHTML='<div class="pnw-profil-modal" role="dialog">'+inner+'</div>'; ov.style.display='flex';
}
function pnwProfilClose(){ const ov=document.getElementById('pnw-profil-ov'); if(ov) ov.style.display='none'; }
function pnwProfilOpenSave(){
  const cnt=pnwProfilCount(pnwProfilSnapshot());
  if(!cnt){ toast('Belum ada uraian persyaratan untuk disimpan','warn'); return; }
  const list=pnwProfilAll();
  const existing = list.length ? ('<div class="pnw-profil-existing">Profil tersimpan: '+list.map(p=>fkEsc(p.name)).join(' &middot; ')+'</div>') : '';
  pnwProfilOverlay(
    '<div class="pnw-profil-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>Simpan Profil Persyaratan</div>'+
    '<div class="pnw-profil-sub">Menyimpan <b>'+cnt+'</b> uraian persyaratan (beserta kategori terpilih) agar bisa dipakai lagi tanpa mengetik ulang.</div>'+
    '<input id="pnw-profil-name" class="pnw-profil-input" type="text" placeholder="Nama profil (mis. Pengadaan Barang Standar)" maxlength="60" onkeydown="if(event.key===\'Enter\')pnwProfilDoSave()">'+
    existing+
    '<div class="pnw-profil-actions"><button type="button" class="btn btn-ghost" onclick="pnwProfilClose()">Batal</button>'+
    '<button type="button" class="btn btn-teal" onclick="pnwProfilDoSave()">Simpan Profil</button></div>'
  );
  setTimeout(()=>{ const el=document.getElementById('pnw-profil-name'); if(el) el.focus(); },60);
}
async function pnwProfilDoSave(){
  const el=document.getElementById('pnw-profil-name'); const name=(el&&el.value||'').trim();
  if(!name){ toast('Isi nama profil dulu','warn'); if(el) el.focus(); return; }
  const snap=pnwProfilSnapshot(); snap.name=name; snap.savedAt=Date.now(); snap.count=pnwProfilCount(snap);
  if(await profilesUpsert('syarat', snap)){ toast('Profil "'+name+'" tersimpan','ok'); pnwProfilClose(); }
}
function pnwProfilOpenLoad(){
  const list=pnwProfilAll();
  if(!list.length){ toast('Belum ada profil. Simpan dulu lewat tombol "Simpan Profil".','warn'); return; }
  const items=list.slice().sort((a,b)=>(b.savedAt||0)-(a.savedAt||0)).map(p=>
    '<div class="pnw-profil-item"><div class="pnw-profil-item-info"><div class="pnw-profil-item-name">'+fkEsc(p.name)+'</div>'+
    '<div class="pnw-profil-item-meta">'+(p.count||0)+' persyaratan</div></div>'+
    '<div class="pnw-profil-item-btns">'+profilActionBtns('syarat',p.name)+'</div></div>'
  ).join('');
  pnwProfilOverlay(
    '<div class="pnw-profil-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>Muat Profil Persyaratan'+profilUploadBtnHtml('syarat')+'</div>'+
    '<div class="pnw-profil-sub">Pilih profil untuk mengisi uraian persyaratan. <b>Isian saat ini akan diganti.</b></div>'+
    '<div class="pnw-profil-list">'+items+'</div>'+
    '<div class="pnw-profil-actions"><button type="button" class="btn btn-ghost" onclick="pnwProfilClose()">Tutup</button></div>'
  );
}
function pnwProfilDoLoad(name){
  const p=pnwProfilAll().find(x=>String(x.name)===String(name)); if(!p){ toast('Profil tidak ditemukan','warn'); return; }
  pnwState.pilih = JSON.parse(JSON.stringify(p.pilih||{}));
  pnwState.syarat = JSON.parse(JSON.stringify(p.syarat||{}));
  pnwState.profilLoaded = true;   // tombol "Batalkan Profil" hanya tampil setelah profil dimuat
  pnwEnsureSyarat(); pnwSaveState(); pnwProfilClose(); renderPnwForm();
  toast('Profil "'+name+'" dimuat','ok');
}
async function pnwProfilDoDelete(name){
  if(await profilesDelete('syarat', name)){ toast('Profil "'+name+'" dihapus','ok'); if(pnwProfilAll().length) pnwProfilOpenLoad(); else pnwProfilClose(); }
}
/* Batalkan profil: kosongkan kembali uraian persyaratan ke tampilan default */
function pnwProfilCancel(){
  const st=pnwState;
  st.syarat={};
  st.profilLoaded=false;         // tombol "Batalkan Profil" ikut hilang
  pnwEnsureSyarat();
  pnwSaveState(); renderPnwForm();
  toast('Profil dibatalkan — isian dikembalikan ke default','ok');
}

/* ================= LANGKAH 4: PEMERIKSAAN ================= */
/* kunci pemeriksaan per baris persyaratan */
function pnwRowKey(kat, baris){ return kat+'||'+baris; }
/* Dropdown pilihan penyedia (sesuai Nama Penyedia yang diisi) */
function pnwPenyediaSelectHtml(){
  const st=pnwState;
  const opts=st.penyedia.map((nm,i)=>{
    const label=(nm&&nm.trim())?nm:('Penyedia '+(i+1));
    return '<option value="'+i+'"'+(i===pnwActivePenyedia?' selected':'')+'>'+fkEsc(label)+'</option>';
  }).join('');
  return '<div class="pnw-penyedia-select">'+
    '<svg class="pnw-sel-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'+
    '<select id="pnw-penyedia-select" onchange="pnwOnPenyediaSelect(this)">'+opts+'</select>'+
    '<svg class="pnw-sel-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg>'+
  '</div>';
}
function pnwOnPenyediaSelect(el){ pnwActivePenyedia=Math.max(0,parseInt(el.value,10)||0); renderPnwForm(); }
/* (dipertahankan utk kompatibilitas — tidak lagi dipakai di UI) */
function pnwPenyediaTabsHtml(){ return pnwPenyediaSelectHtml(); }
function pnwSampulTabsHtml(){
  const st=pnwState; if(!pnwIsTwoSampul(st)) return '';
  return '<div class="pnw-sampul-tabs">'+pnwSampulList(st).map(sk=>{
    const on = sk===pnwActiveSampul;
    return '<button type="button" class="pnw-stab'+(on?' on':'')+'" onclick="pnwSetSampul(\''+sk+'\')">'+
      '<span class="pnw-stab-dot"></span>Pembukaan Penawaran '+pnwSampulLabel(sk)+'</button>';
  }).join('')+'</div>';
}
/* Ringkasan progres pemeriksaan penyedia aktif (Ada / Tidak Ada / Belum) */
function pnwProgressPenyedia(){
  const st=pnwState, sk=pnwActiveSampul, pidx=pnwActivePenyedia;
  let ada=0,tidak=0,belum=0,total=0;
  pnwSelectedKategori(st,sk).forEach(kat=>{
    (st.syarat[sk][kat]||[]).forEach(baris=>{
      total++; const c=pnwGetPeriksa(sk,pidx,kat,baris);
      if(c.ada===true) ada++; else if(c.ada===false) tidak++; else belum++;
    });
  });
  return {ada,tidak,belum,total,pct: total?Math.round((ada+tidak)/total*100):0};
}
/* Panel pemeriksaan (hero header mewah + dropdown + tabel) */
function pnwPeriksaPanelHtml(){
  const st=pnwState, info=st.info||{};
  const two=pnwIsTwoSampul(st);
  const namaP=(st.penyedia[pnwActivePenyedia]&&st.penyedia[pnwActivePenyedia].trim())?st.penyedia[pnwActivePenyedia]:('Penyedia '+(pnwActivePenyedia+1));
  const pg=pnwProgressPenyedia();
  const subJudul = two ? ('Pembukaan Penawaran '+pnwSampulLabel(pnwActiveSampul)) : 'Pembukaan Penawaran';
  const metaChips = ''+
    (info.metode?'<span class="pnw-hero-chip">'+fkEsc(info.metode)+'</span>':'')+
    (info.penyampaian?'<span class="pnw-hero-chip">'+fkEsc(info.penyampaian)+'</span>':'')+
    '<span class="pnw-hero-chip">'+(two?'Dua Sampul':'Satu Sampul')+'</span>';

  let html='<div class="pnw-panel">';
  // HERO
  html+='<div class="pnw-hero">'+
    '<div class="pnw-hero-glow"></div>'+
    '<div class="pnw-hero-main">'+
      '<div class="pnw-hero-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg></div>'+
      '<div class="pnw-hero-text">'+
        '<div class="pnw-hero-kicker">Pemeriksaan Kelengkapan Dokumen Penawaran</div>'+
        '<div class="pnw-hero-title">'+fkEsc(info.nama||'Pekerjaan')+'</div>'+
        '<div class="pnw-hero-meta">'+metaChips+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="pnw-hero-picker">'+
      '<span class="pnw-picker-lbl">Pilihan Penyedia</span>'+
      pnwPenyediaSelectHtml()+
    '</div>'+
  '</div>';
  // SUB-BAR: sampul aktif + progres penyedia
  html+='<div class="pnw-subbar">'+
    '<div class="pnw-subbar-left"><span class="pnw-subbar-title">'+fkEsc(subJudul)+'</span>'+
      '<span class="pnw-active-penyedia"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'+fkEsc(namaP)+'</span>'+
    '</div>'+
    '<div class="pnw-progress"><div class="pnw-progress-stats">'+
        '<span class="pnw-pstat ada">Ada '+pg.ada+'</span>'+
        '<span class="pnw-pstat no">Tidak Ada '+pg.tidak+'</span>'+
        '<span class="pnw-pstat belum">Belum '+pg.belum+'</span>'+
      '</div>'+
      '<div class="pnw-progress-bar"><div class="pnw-progress-fill" style="width:'+pg.pct+'%"></div></div>'+
    '</div>'+
  '</div>';
  if(two) html+=pnwSampulTabsHtml();
  html+=pnwPeriksaTableHtml();
  html+='</div>';
  return html;
}
function pnwSetSampul(sk){ pnwActiveSampul=sk; renderPnwForm(); }
function pnwSetPenyedia(i){ pnwActivePenyedia=i; renderPnwForm(); }
/* nilai pemeriksaan satu baris — pakai state aktif: pnwPreviewState (saat pratinjau
   record tersimpan) atau pnwState (saat sedang mengisi form). Sebelumnya fungsi ini
   selalu membaca pnwState, sehingga pratinjau/PDF record tersimpan selalu tampil "–"
   walau data Ada/Tidak Ada sudah dipilih & tersimpan di record. */
function pnwGetPeriksa(sk, pidx, kat, baris){
  const st=pnwActiveState(); const p=st.periksa[sk]||{}; const pp=p[pidx]||{}; return pp[pnwRowKey(kat,baris)]||{};
}
function pnwSetAda(sk, pidx, kat, baris, val){
  const st=pnwState; st.periksa[sk]=st.periksa[sk]||{}; st.periksa[sk][pidx]=st.periksa[sk][pidx]||{};
  const k=pnwRowKey(kat,baris); const cur=st.periksa[sk][pidx][k]||{};
  cur.ada = (cur.ada===val)? undefined : val;
  st.periksa[sk][pidx][k]=cur; pnwSaveState();
  // Perbarui tampilan secara in-place agar posisi scroll TIDAK bergeser.
  // Hanya lakukan bila baris yang diklik memang sedang tampil (penyedia & sampul aktif).
  if(sk===pnwActiveSampul && pidx===pnwActivePenyedia && pnwPatchAdaRow(k, cur.ada)){
    pnwPatchProgress();
    return;
  }
  // fallback (mis. kondisi tak terduga): render ulang penuh
  renderPnwForm();
}
/* Perbarui satu baris (tombol Ada/Tidak Ada + warna baris) tanpa render ulang.
   Mengembalikan true bila baris ditemukan & diperbarui. */
function pnwPatchAdaRow(rk, ada){
  const cont=document.getElementById('pnw-content'); if(!cont) return false;
  const tr=cont.querySelector('tr[data-rk="'+(window.CSS&&CSS.escape?CSS.escape(rk):rk.replace(/"/g,'\\"'))+'"]');
  if(!tr){
    // fallback pencarian manual bila selector attr gagal (karakter khusus)
    const rows=cont.querySelectorAll('tr[data-rk]');
    let found=null; rows.forEach(r=>{ if(r.getAttribute('data-rk')===rk) found=r; });
    if(!found) return false;
    return pnwApplyRowState(found, ada);
  }
  return pnwApplyRowState(tr, ada);
}
function pnwApplyRowState(tr, ada){
  tr.classList.remove('is-ada','is-no');
  if(ada===true) tr.classList.add('is-ada');
  else if(ada===false) tr.classList.add('is-no');
  const btnAda=tr.querySelector('.fkl-ada-btn.ada');
  const btnNo =tr.querySelector('.fkl-ada-btn.no');
  if(btnAda) btnAda.classList.toggle('on', ada===true);
  if(btnNo)  btnNo.classList.toggle('on', ada===false);
  return true;
}
/* Perbarui ringkasan progres penyedia aktif (angka + bar) tanpa render ulang. */
function pnwPatchProgress(){
  const cont=document.getElementById('pnw-content'); if(!cont) return;
  const pg=pnwProgressPenyedia();
  const sAda=cont.querySelector('.pnw-pstat.ada');   if(sAda) sAda.textContent='Ada '+pg.ada;
  const sNo =cont.querySelector('.pnw-pstat.no');    if(sNo)  sNo.textContent='Tidak Ada '+pg.tidak;
  const sBl =cont.querySelector('.pnw-pstat.belum'); if(sBl)  sBl.textContent='Belum '+pg.belum;
  const fill=cont.querySelector('.pnw-progress-fill');if(fill) fill.style.width=pg.pct+'%';
}
function pnwSetKet(el){
  const st=pnwState; const sk=el.dataset.sk, pidx=+el.dataset.pidx, kat=el.dataset.kat, baris=el.dataset.baris;
  st.periksa[sk]=st.periksa[sk]||{}; st.periksa[sk][pidx]=st.periksa[sk][pidx]||{};
  const k=pnwRowKey(kat,baris); const cur=st.periksa[sk][pidx][k]||{}; cur.ket=el.value;
  st.periksa[sk][pidx][k]=cur; pnwSaveState();
}
function pnwPeriksaTableHtml(){
  const st=pnwState, sk=pnwActiveSampul, pidx=pnwActivePenyedia;
  const kats=pnwSelectedKategori(st,sk);
  if(!kats.length) return '<div class="fkl-empty-note">Belum ada kategori dokumen untuk sampul ini.</div>';
  let rows='';
  kats.forEach((kat,ki)=>{
    const arr=st.syarat[sk][kat]||[];
    rows+='<tr class="pnw-cat-row"><td colspan="4"><span class="pnw-cat-idx">'+(ki+1)+'</span><span class="pnw-cat-name">'+fkEsc(kat)+'</span></td></tr>';
    arr.forEach((baris,i)=>{
      const uraian = baris && baris.trim() ? baris : '(persyaratan '+(i+1)+')';
      const cur=pnwGetPeriksa(sk,pidx,kat,baris);
      const yes=cur.ada===true, no=cur.ada===false;
      const rowCls = yes ? 'is-ada' : (no ? 'is-no' : '');
      // Kolom Keterangan khusus untuk kategori Penawaran Harga (baris terkunci)
      const isRAB = (kat==='Penawaran Harga' && baris==='Nilai RAB');
      const isJangka = (kat==='Penawaran Harga' && baris==='Jangka Waktu Pelaksanaan');
      let ketPh='Tambahkan keterangan…', ketOn='oninput="pnwSetKet(this)"', ketMode='';
      if(isRAB){ ketPh='Isi Nilai Penawaran (dengan PPN)'; ketOn='oninput="onRupiahInput(this);pnwSetKet(this)"'; ketMode=' inputmode="numeric"'; }
      else if(isJangka){ ketPh='Isi jangka waktu pelaksanaan'; }
      const ketCell='<td class="pnw-ket"><input type="text"'+ketMode+' placeholder="'+fkEsc(ketPh)+'" data-sk="'+sk+'" data-pidx="'+pidx+'" data-kat="'+fkEsc(kat)+'" data-baris="'+fkEsc(baris)+'" value="'+fkEsc(cur.ket||'')+'" '+ketOn+'></td>';
      const rkAttr = 'data-rk="'+fkEsc(pnwRowKey(kat,baris))+'"';
      rows+='<tr class="'+rowCls+'" '+rkAttr+'>'+
        '<td class="pnw-no">'+(i+1)+'</td>'+
        '<td class="pnw-uraian">'+fkEsc(uraian)+'</td>'+
        '<td class="pnw-ck">'+
          '<span class="fkl-ada-opts">'+
            '<button type="button" class="fkl-ada-btn ada'+(yes?' on':'')+'" onclick="pnwSetAda(\''+sk+'\','+pidx+',\''+fkEscJs(kat)+'\',\''+fkEscJs(baris)+'\',true)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M20 6 9 17l-5-5"/></svg>Ada</button>'+
            '<button type="button" class="fkl-ada-btn no'+(no?' on':'')+'" onclick="pnwSetAda(\''+sk+'\','+pidx+',\''+fkEscJs(kat)+'\',\''+fkEscJs(baris)+'\',false)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M18 6 6 18M6 6l12 12"/></svg>Tidak Ada</button>'+
          '</span>'+
        '</td>'+
        ketCell+
      '</tr>';
    });
  });
  return '<div class="table-wrap pnw-table-wrap"><table class="pnw-periksa-table"><thead><tr>'+
    '<th class="pnw-no">No</th><th class="pnw-uraian">Uraian Persyaratan</th>'+
    '<th class="pnw-ck">Kelengkapan Dokumen</th><th class="pnw-ket">Keterangan</th>'+
    '</tr></thead><tbody>'+rows+'</tbody></table></div>';
}

/* ================= RENDER UTAMA ================= */
function renderPnwForm(){
  pnwMarkActive();
  pnwEnsureSyarat();
  const tt=document.getElementById('pnw-title'); if(tt) tt.textContent='Pembukaan Penawaran'+(pnwEditId?' — Ubah Data':' — Input Data');
  const sub=document.getElementById('pnw-sub');
  const cont=document.getElementById('pnw-content'); if(!cont) return;
  const st=pnwState;
  let html=pnwStepperHtml();

  if(pnwStep===1){
    if(sub) sub.textContent='Langkah 1 dari 4 — Lengkapi data pekerjaan & penyedia';
    html+='<div class="form-card"><div class="form-section-title">'+KR_SECTION_ICON+'Data Pekerjaan'+dpPickBtnHtml('pnw')+'</div><div class="form-flow" style="--cols:4">';
    html+=PNW_INFO_FIELDS.map(pnwInfoInputHtml).join('');
    html+=pnwPenyediaFieldsHtml();
    html+='</div>';
    html+='</div>';
    html+='<div class="form-card"><div class="form-section-title">'+FKL_SEC_ICON+'Nama Penyedia</div>'+pnwPenyediaListHtml()+'</div>';
    html+=pnwActionsHtml({back:false});
  }
  else if(pnwStep===2){
    if(sub) sub.textContent='Langkah 2 dari 4 — Pilih kategori dokumen yang diperiksa';
    pnwSampulList(st).forEach(sk=>{ html+=pnwKategoriGroupHtml(sk); });
    html+=pnwActionsHtml({back:true});
  }
  else if(pnwStep===3){
    if(sub) sub.textContent='Langkah 3 dari 4 — Isi uraian persyaratan tiap kategori';
    let body='';
    pnwSampulList(st).forEach(sk=>{ body+=pnwSyaratGroupHtml(sk); });
    if(!body) body='<div class="fkl-empty-note">Belum ada kategori dipilih. Kembali ke langkah <b>Pilihan Kategori</b>.</div>';
    html+='<div class="form-card"><div class="form-section-title pnw-syarat-title">'+
        '<span class="pnw-syarat-title-txt">'+FKL_SEC_ICON+'Pengisian Persyaratan</span>'+
        '<span class="pnw-profil-bar">'+
          '<button type="button" class="btn btn-amber pnw-profil-btn" title="Simpan Profil" onclick="pnwProfilOpenSave()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>Profil</button>'+
          '<button type="button" class="btn btn-teal pnw-profil-btn" title="Muat Profil" onclick="pnwProfilOpenLoad()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>Profil</button>'+
          '<button type="button" class="btn btn-green pnw-profil-btn" title="Unduh template Excel persyaratan" onclick="pnwXlsTemplate()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>Template</button>'+
          '<button type="button" class="btn btn-light pnw-profil-btn" title="Unggah template Excel persyaratan" onclick="pnwXlsUpload()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 8l5-5 5 5"/><path d="M12 3v12"/></svg>Unggah</button>'+
          (st.profilLoaded ? '<button type="button" class="btn btn-red pnw-profil-btn" onclick="pnwProfilCancel()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>Batalkan Profil</button>' : '')+
        '</span>'+
      '</div>'+body+'</div>';
    html+=pnwActionsHtml({back:true});
  }
  else{
    if(sub) sub.textContent='Langkah 4 dari 4 — Pemeriksaan kelengkapan dokumen penawaran';
    html+=pnwPeriksaPanelHtml();
    html+=pnwActionsHtml({back:true, save:true});
  }
  cont.innerHTML=html;

  // isi ulang nilai field langkah 1
  if(pnwStep===1){
    PNW_INFO_FIELDS.forEach(f=>{
      const el=document.getElementById('pnw-'+f.key); if(!el) return;
      const v=st.info[f.key];
      el.value = (f.type==='num') ? rupiahInputText(v) : (v!=null?v:'');
    });
    const pj=document.getElementById('pnw-pejabat'); if(pj) pj.value=st.pejabat||'';
  }
}
function pnwPenyampaianNoteText(){
  const p=pnwState.info.penyampaian||'';
  if(p==='1 Tahap 1 Sampul') return 'Metode 1 Tahap 1 Sampul: seluruh dokumen dijadikan satu file PDF dan satu tahapan pemeriksaan.';
  if(p==='1 Tahap 2 Sampul' || p==='2 Tahap') return 'Metode '+p+': dokumen dipisah menjadi dua sampul/tahapan — Sampul Satu dan Sampul Dua, masing-masing dengan pemeriksaan & file PDF terpisah.';
  return 'Pilih metode penyampaian untuk menentukan jumlah sampul/tahapan pemeriksaan.';
}
function pnwActionsHtml(o){
  o=o||{};
  // Batal (merah) berdampingan dengan tombol navigasi di pojok kanan
  let right='<button class="btn btn-red" onclick="pnwBatal()">'+FKL_IC_X+'Batal</button>';
  if(o.back) right+='<button class="btn btn-light" onclick="pnwBack()">'+FKL_IC_BACK+(pnwStep===4?'Sebelumnya':'Kembali')+'</button>';
  if(o.save) right+='<button class="btn btn-green" onclick="pnwSimpan()">'+FKL_IC_SAVE+'Simpan</button>';
  else right+='<button class="btn btn-teal" onclick="pnwNext()">Selanjutnya'+FKL_IC_NEXT+'</button>';
  return '<div class="fkl-actions"><div class="fkl-actions-right">'+right+'</div></div>';
}

/* ---------- Interaksi langkah 1 ---------- */
function pnwOnInfoChange(){
  const st=pnwState;
  PNW_INFO_FIELDS.forEach(f=>{
    if(pnwIsLocked(f.key)) return;
    const el=document.getElementById('pnw-'+f.key); if(!el) return;
    st.info[f.key] = (f.type==='num') ? parseRupiah(el.value) : el.value.trim();
  });
  pnwSaveState();
}
function pnwOnPenyampaianChange(){
  pnwOnInfoChange();
}
function pnwOnJumlahChange(el){
  const n=Math.max(1,Math.min(20,parseInt(el.value,10)||1));
  const st=pnwState; const cur=st.penyedia.slice();
  const next=[]; for(let i=0;i<n;i++) next.push(cur[i]||'');
  st.penyedia=next;
  if(pnwActivePenyedia>=n) pnwActivePenyedia=n-1;
  pnwSaveState(); renderPnwForm();
}
function pnwOnPenyediaNama(el){ const i=+el.dataset.pidx; pnwState.penyedia[i]=el.value; pnwSaveState(); }
function pnwOnPejabatChange(el){ pnwState.pejabat=el.value; pnwSaveState(); }

/* ---------- Interaksi langkah 2 ---------- */
function pnwOnPilih(el){
  const st=pnwState, sk=el.dataset.sk, kat=el.dataset.kat;
  st.pilih[sk]=st.pilih[sk]||{}; st.pilih[sk][kat]=el.checked;
  pnwEnforceHargaRule(st);   // pertahankan aturan: Harga otomatis di Sampul Dua & tidak ada di Sampul Satu
  pnwSaveState();
  const chip=el.closest('.form-card').querySelector('.fkl-count-chip');
  if(chip){ const list=pnwKategoriUntukSampul(st,sk); const c=list.filter(k=>st.pilih[sk][k]).length; chip.textContent=c+' dipilih'; }
}

/* ---------- Navigasi ---------- */
function pnwNext(){
  const st=pnwState;
  if(pnwStep===1){
    pnwOnInfoChange();
    if(!String(st.info.nama||'').trim()){ toast('Nama Pekerjaan wajib diisi','warn'); return; }
    if(!st.info.penyampaian){ toast('Pilih Metode Penyampaian Dokumen','warn'); return; }
    pnwStep=2;
  } else if(pnwStep===2){
    let any=false; pnwSampulList(st).forEach(sk=>{ if(pnwSelectedKategori(st,sk).length) any=true; });
    if(!any){ toast('Pilih minimal satu kategori dokumen','warn'); return; }
    pnwEnsureSyarat(); pnwStep=3;
  } else if(pnwStep===3){
    pnwActiveSampul='s1'; pnwActivePenyedia=0; pnwStep=4;
  }
  renderPnwForm(); pnwScrollTop();
}
function pnwBack(){ if(pnwStep>1){ pnwStep--; renderPnwForm(); pnwScrollTop(); } }
function pnwScrollTop(){ const v=document.getElementById('view-form-pembukaan'); if(v) v.scrollIntoView({behavior:'smooth',block:'start'}); }
function pnwBatal(){
  openConfirm({ icon:'del', title:'Batalkan Proses',
    text:'Batalkan proses ini? Data yang belum disimpan akan hilang.',
    onYes:()=>{ pnwEditId=null; pnwState=pnwBlankState(); pnwSaveState(); pnwStep=1; openPnwView(); toast('Proses dibatalkan','ok'); }
  });
}

/* ---------- Simpan ---------- */
/* Progres pemeriksaan SATU sampul: berapa baris seluruhnya & berapa yang sudah
   ditandai (Ada/Tidak Ada). Dipakai untuk mengizinkan Sampul Dua disimpan kosong. */
function pnwSampulProgres(sk, st){
  st = st || pnwActiveState();
  const kats=pnwSelectedKategori(st,sk);
  let total=0, isi=0;
  (st.penyedia||[]).forEach((_,pidx)=>{
    kats.forEach(kat=>{ ((st.syarat[sk]||{})[kat]||[]).forEach(baris=>{
      total++;
      const c=pnwGetPeriksa(sk,pidx,kat,baris);
      if(c.ada===true || c.ada===false) isi++;
    }); });
  });
  return { total:total, isi:isi, belum:total-isi, kosong:(isi===0) };
}
/* Sampul yang WAJIB lengkap saat menyimpan.
   Sampul Satu selalu wajib. Sampul Dua hanya wajib bila SUDAH mulai diperiksa —
   bila masih kosong sama sekali, dokumen tetap boleh disimpan (Sampul Satu & Dua
   memang lazim dibuka pada hari yang berbeda) dan dapat dilengkapi kemudian. */
function pnwSampulWajib(st){
  st = st || pnwActiveState();
  return pnwSampulList(st).filter(sk=>{
    if(sk!=='s2') return true;
    return !pnwSampulProgres(sk, st).kosong;
  });
}
/* Sampul yang sudah punya isi — dipakai untuk dokumen gabungan (cetak/pratinjau) */
function pnwSampulTerisi(st){
  st = st || pnwActiveState();
  const ada=pnwSampulList(st).filter(sk=>{
    const p=pnwSampulProgres(sk, st);
    return p.total>0 && p.isi>0;
  });
  return ada.length ? ada : ['s1'];
}
function pnwCountBelum(){
  const st=pnwState; let belum=0;
  pnwSampulWajib(st).forEach(sk=>{
    const kats=pnwSelectedKategori(st,sk);
    st.penyedia.forEach((_,pidx)=>{
      kats.forEach(kat=>{ (st.syarat[sk][kat]||[]).forEach(baris=>{ const c=pnwGetPeriksa(sk,pidx,kat,baris); if(c.ada!==true && c.ada!==false) belum++; }); });
    });
  });
  return belum;
}
/* Cari lokasi (sampul + penyedia) pertama yang masih memiliki baris belum ditandai.
   Mengembalikan {sk, pidx, nama} atau null bila semua sudah lengkap. */
function pnwFirstBelum(){
  const st=pnwState;
  const sampuls=pnwSampulWajib(st);
  for(let s=0;s<sampuls.length;s++){
    const sk=sampuls[s];
    const kats=pnwSelectedKategori(st,sk);
    for(let pidx=0;pidx<st.penyedia.length;pidx++){
      for(const kat of kats){
        for(const baris of (st.syarat[sk][kat]||[])){
          const c=pnwGetPeriksa(sk,pidx,kat,baris);
          if(c.ada!==true && c.ada!==false){
            const nama=(st.penyedia[pidx]&&st.penyedia[pidx].trim())?st.penyedia[pidx]:('Penyedia '+(pidx+1));
            return {sk, pidx, nama};
          }
        }
      }
    }
  }
  return null;
}
async function pnwSimpan(){
  if(!requireInput()) return;
  const st=pnwState; const info=st.info||{};
  const nama=String(info.nama||'').trim();
  if(!nama){ toast('Nama Pekerjaan wajib diisi','warn'); pnwStep=1; renderPnwForm(); return; }
  const jenisDok = pnwIsTwoSampul(st) ? 'Dua Sampul' : 'Satu Sampul';
  const doSave=async()=>{
    const rec={
      nama_pekerjaan:nama,
      lokasi: info.lokasi||'',
      metode: info.metode||'',
      penyampaian: info.penyampaian||'',
      jenis_dokumen: jenisDok,
      tgl_periksa: (new Date()).toISOString().slice(0,10),
      state: JSON.parse(JSON.stringify(st))
    };
    let ok=false;
    try{
      await withActionLoader(pnwEditId?'Menyimpan perubahan':'Menyimpan', async()=>{
        if(pnwEditId) await StorePembukaan.update(pnwEditId, rec);
        else await StorePembukaan.create(rec);
        await refreshDataPembukaan();
      });
      ok=true;
    }catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'err'); return; }
    if(!ok) return;
    toast(pnwEditId?'Data berhasil diperbarui':'Data berhasil disimpan','ok');
    // Beritahu bila Sampul Dua sengaja dibiarkan kosong (boleh dilengkapi kemudian)
    if(pnwIsTwoSampul(st) && pnwSampulProgres('s2', st).kosong){
      setTimeout(()=>toast('Sampul Dua belum diperiksa — dapat dilengkapi kemudian lewat tombol Ubah','warn'), 900);
    }
    pnwEditId=null; pnwState=pnwBlankState(); pnwSaveState(); pnwStep=1;
    showView('pnw-view');
  };
  const belum=pnwCountBelum();
  if(belum>0){
    // Tolak simpan: seluruh pemeriksaan (setiap penyedia) harus lengkap dulu.
    const loc=pnwFirstBelum();
    toast('Data gagal disimpan, lengkapi pemeriksaan terlebih dahulu','err');
    if(loc){
      // arahkan langsung ke sampul & penyedia yang masih ada baris belum ditandai
      pnwActiveSampul=loc.sk; pnwActivePenyedia=loc.pidx;
      if(pnwStep!==4){ pnwStep=4; }
      renderPnwForm(); pnwScrollTop();
    }
    return;
  }
  doSave();
}

/* ================= LIHAT HASIL PEMERIKSAAN ================= */
let pnwViewPage=1;
const PNW_VIEW_PAGE_SIZE=8;
function pnwViewRows(){
  let rows=(records_pembukaan||[]).slice();
  const fs=(document.getElementById('pnw-view-search')?.value||'').toLowerCase().trim();
  if(fs) rows=rows.filter(r=>String(r.nama_pekerjaan||(r.state&&r.state.info&&r.state.info.nama)||'').toLowerCase().includes(fs));
  return rows;
}
function pnwEmptyRow(){
  return '<tr><td colspan="7"><div class="empty">'+
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16a1 1 0 0 1 1 1v3H3V5a1 1 0 0 1 1-1Z"/><path d="M3 8v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8"/><path d="M9 13h6"/></svg>'+
    '<div>Data tidak tersedia</div></div></td></tr>';
}
function renderPnwView(){
  const tb=document.getElementById('pnw-view-body');
  const pg=document.getElementById('pnw-view-pagination');
  const cEl=document.getElementById('pnw-view-count');
  if(!tb) return;
  const rows=pnwViewRows();
  if(cEl) cEl.textContent=rows.length;
  if(!rows.length){ tb.innerHTML=pnwEmptyRow(); if(pg) pg.innerHTML=''; return; }
  const totalPages=Math.max(1,Math.ceil(rows.length/PNW_VIEW_PAGE_SIZE));
  if(pnwViewPage>totalPages) pnwViewPage=totalPages;
  if(pnwViewPage<1) pnwViewPage=1;
  const start=(pnwViewPage-1)*PNW_VIEW_PAGE_SIZE;
  const pageRows=rows.slice(start,start+PNW_VIEW_PAGE_SIZE);
  tb.innerHTML=pageRows.map((r,i)=>{
    const stt=r.state||{}; const info=stt.info||{};
    const nama=r.nama_pekerjaan||info.nama||'—';
    const lokasi=(r.lokasi||info.lokasi||'').trim();
    const metode=r.metode||info.metode||'';
    const jenis=r.jenis_dokumen||(pnwIsTwoSampul(stt)?'Dua Sampul':'Satu Sampul');
    const tgl=r.tgl_periksa||'';
    const two = jenis==='Dua Sampul';
    const rid=fkEsc(String(r.id));
    // Satu baris per data. Tombol Lihat membuka DOKUMEN GABUNGAN (Sampul Satu +
    // Sampul Dua, halaman terpisah). Sampul Dua yang belum diperiksa ditandai.
    const s2Kosong = two ? pnwSampulProgres('s2', stt).kosong : false;
    const jenisCell = two
      ? ('Dua Sampul' + (s2Kosong ? '<span class="pnw-s2-tag">Sampul Dua belum diisi</span>' : ''))
      : 'Satu Sampul';
    const actions='<div class="action-cell" style="justify-content:center">'+
        '<button class="act act-edit" title="Ubah" onclick="openPnwInput(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>'+
        '<button class="act act-view" title="Lihat" onclick="pnwPreviewRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>'+
        '<button class="act act-del" title="Hapus" onclick="pnwDeleteRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>'+
      '</div>';
    return '<tr>'+
      '<td class="col-no">'+(start+i+1)+'</td>'+
      '<td class="wrap-cell col-nama-freeze">'+fkEsc(nama)+'</td>'+
      '<td class="fkl-col-lokasi">'+fkEsc(lokasi||'—')+'</td>'+
      '<td>'+fkEsc(metode||'—')+'</td>'+
      '<td class="pnw-jd-cell">'+jenisCell+'</td>'+
      '<td class="col-date">'+fkEsc(tgl?pnwDateLong(tgl):'—')+'</td>'+
      '<td>'+actions+'</td>'+
    '</tr>';
  }).join('');
  if(pg){
    if(totalPages<=1){ pg.innerHTML=''; }
    else{
      let h='<button class="pg-btn" '+(pnwViewPage<=1?'disabled':'')+' onclick="pnwViewGoto('+(pnwViewPage-1)+')">‹</button>';
      for(let p=1;p<=totalPages;p++) h+='<button class="pg-btn '+(p===pnwViewPage?'active':'')+'" onclick="pnwViewGoto('+p+')">'+p+'</button>';
      h+='<button class="pg-btn" '+(pnwViewPage>=totalPages?'disabled':'')+' onclick="pnwViewGoto('+(pnwViewPage+1)+')">›</button>';
      pg.innerHTML=h;
    }
  }
}
function pnwViewGoto(p){ pnwViewPage=p; renderPnwView(); }
function pnwPreviewRecord(id){
  const rec=records_pembukaan.find(r=>String(r.id)===String(id)); if(!rec) return;
  pnwPreviewState = pnwRecordToState(rec);
  pnwOpenPreview();
}
function pnwDeleteRecord(id){
  if(!requireInput()) return;
  const rec=records_pembukaan.find(r=>String(r.id)===String(id)); if(!rec) return;
  openConfirm({ icon:'del', title:'Hapus Data',
    text:'Hapus data pembukaan penawaran "'+(rec.nama_pekerjaan||(rec.state&&rec.state.info&&rec.state.info.nama)||'')+'"?',
    onYes:async()=>{
      try{ await withActionLoader('Menghapus', async()=>{ await StorePembukaan.remove(id); await refreshDataPembukaan(); }); }
      catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'err'); return; }
      toast('Data dihapus','ok'); renderPnwView();
    }
  });
}
const PNW_BULAN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
function pnwDateLong(s){ if(!s) return ''; const p=String(s).split('-'); if(p.length!==3) return s; const y=p[0],m=parseInt(p[1],10),d=p[2]; return d+' '+(PNW_BULAN[m-1]||'')+' '+y; }

/* Keterangan "Jangka Waktu Pelaksanaan" tampil dengan satuan hari (mis. 60 -> "60 hari") */
function pnwFmtKet(kat, baris, ket){
  let v = (ket==null) ? '' : String(ket).trim();
  if(!v) return '';
  if(kat==='Penawaran Harga' && baris==='Jangka Waktu Pelaksanaan' && /^\d+([.,]\d+)?$/.test(v)) v += ' hari';
  return v;
}

/* ================= DOKUMEN PDF ================= */
/* Bangun dokumen satu sampul (utk penyampaian 1 sampul, atau salah satu sampul) */
function pnwBuildDocHtml(sk){
  const st=pnwActiveState(); const info=st.info||{};
  const two=pnwIsTwoSampul(st);
  const kats=pnwSelectedKategori(st,sk);
  const fmtNilai = (info.nilai!=='' && info.nilai!=null) ? 'Rp '+Number(info.nilai).toLocaleString('id-ID') : '-';
  const tglDoc = st.__tgl ? pnwDateLong(st.__tgl) : pnwDateLong((new Date()).toISOString().slice(0,10));
  const infoRow=(k,v)=>'<tr><td class="k">'+k+'</td><td class="s">:</td><td class="v" style="text-align:justify">'+fkEsc(v||'-')+'</td></tr>';

  // Per penyedia: satu blok tabel
  const penyBlocks = st.penyedia.map((nm,pidx)=>{
    const namaP=(nm&&nm.trim())?nm:('Penyedia '+(pidx+1));
    let rows='';
    kats.forEach(kat=>{
      rows+='<tr class="cat"><td colspan="4">'+fkEsc(kat)+'</td></tr>';
      (st.syarat[sk][kat]||[]).forEach((baris,i)=>{
        const uraian=baris&&baris.trim()?baris:('(persyaratan '+(i+1)+')');
        const c=pnwGetPeriksa(sk,pidx,kat,baris);
        const cell = c.ada===true ? '<span class="pill ada">Ada</span>' : (c.ada===false ? '<span class="pill no">Tidak Ada</span>' : '<span class="pill nn">–</span>');
        rows+='<tr><td class="no">'+(i+1)+'</td><td class="nm">'+fkEsc(uraian)+'</td><td class="ck">'+cell+'</td><td class="kt">'+fkEsc(pnwFmtKet(kat,baris,c.ket))+'</td></tr>';
      });
    });
    if(!rows) rows='<tr><td colspan="4" class="empty">Data tidak tersedia</td></tr>';
    return '<div class="pnw-penyedia-block">'+
      '<div class="pnw-penyedia-name">'+fkEsc(namaP.toUpperCase())+'</div>'+
      '<table class="fkl-chk"><thead><tr><th class="no">No</th><th class="nm">Uraian Persyaratan</th><th class="ck">Kelengkapan Dokumen</th><th class="kt">Keterangan</th></tr></thead><tbody>'+rows+'</tbody></table>'+
    '</div>';
  }).join('');

  // Hasil Pemeriksaan: rekap kelengkapan dokumen penawaran per penyedia
  const hasilRows = st.penyedia.map((nm,pidx)=>{
    const namaP=(nm&&nm.trim())?nm:('Penyedia '+(pidx+1));
    let total=0, kurang=0;
    kats.forEach(kat=>{
      (st.syarat[sk][kat]||[]).forEach(baris=>{
        total++;
        const c=pnwGetPeriksa(sk,pidx,kat,baris);
        if(c.ada===false) kurang++;
      });
    });
    const lengkap = (total>0 && kurang===0);
    const status = lengkap ? '<span class="pill ada">Lengkap</span>' : '<span class="pill no">Tidak Lengkap</span>';
    const ket = lengkap ? 'Seluruh dokumen penawaran dinyatakan lengkap' : ('Terdapat '+kurang+' dari '+total+' dokumen yang tidak lengkap');
    return '<tr><td class="no">'+(pidx+1)+'</td><td class="nm">'+fkEsc(namaP.toUpperCase())+'</td><td class="ck">'+status+'</td><td class="kt">'+ket+'</td></tr>';
  }).join('');
  const hasilBlock = '<table class="fkl-chk pnw-hasil"><thead><tr>'+
    '<th class="no">No</th><th class="nm">Nama Penyedia</th>'+
    '<th class="ck">Hasil Pemeriksaan</th><th class="kt">Keterangan</th>'+
    '</tr></thead><tbody>'+(hasilRows||'<tr><td colspan="4" class="empty">Data tidak tersedia</td></tr>')+'</tbody></table>';

  const judul = two
    ? 'FORM PEMBUKAAN PENAWARAN<br>'+pnwSampulLabel(sk).toUpperCase()
    : 'FORM PEMBUKAAN PENAWARAN';

  return ''+
  '<div class="fkl-doc pnw-doc">'+
    '<div class="fkl-doc-head">'+
      '<div class="fkl-doc-logo"><img src="'+FKL_LOGO_SRC+'" alt="Logo PLN"></div>'+
      '<div class="fkl-doc-org">'+
        '<div class="l1">PT PLN (PERSERO)</div>'+
        '<div class="l2">UNIT PELAKSANA PELAYANAN PELANGGAN MASOHI</div>'+
        '<div class="l3">Jl. Abdullah Soulissa No 1, Masohi, Kec. Kota Masohi</div>'+
      '</div>'+
    '</div>'+
    '<div class="fkl-doc-band"></div>'+
    '<h1 class="fkl-doc-title">'+judul+'</h1>'+
    '<div class="fkl-doc-titlegap"></div>'+

    '<div class="fkl-sec-h"><span class="rn">A</span>Data Pekerjaan</div>'+
    '<table class="fkl-info"><tbody>'+
      infoRow('Nama Pekerjaan', info.nama)+
      infoRow('Lokasi Pekerjaan', info.lokasi)+
      infoRow('Rencana Anggaran Biaya', fmtNilai)+
      infoRow('No. Anggaran', info.no_anggaran)+
      infoRow('Tgl. Anggaran', info.tgl_anggaran?pnwDateLong(info.tgl_anggaran):'-')+
      infoRow('Jenis Anggaran', info.jenis_anggaran)+
      infoRow('Metode Pengadaan', info.metode)+
    '</tbody></table>'+

    '<div class="fkl-sec-h"><span class="rn">B</span>Pemeriksaan Kelengkapan Dokumen Penawaran</div>'+
    penyBlocks+

    '<div class="fkl-doc-tail">'+
    '<div class="fkl-sec-h"><span class="rn">C</span>Hasil Pemeriksaan</div>'+
    hasilBlock+

    '<div class="fkl-doc-foot">'+
      '<div class="ttd-date">Masohi, '+fkEsc(tglDoc)+'</div>'+
      '<table class="ttd ttd-single"><tbody><tr>'+
        '<td><div class="role">Diperiksa oleh,</div><div class="role2">Pejabat Pelaksana Pengadaan</div><div class="gap"></div><div class="nm nm-up">'+fkEsc(st.pejabat?String(st.pejabat).trim().toUpperCase():'(..........................)')+'</div></td>'+
      '</tr></tbody></table>'+
    '</div>'+
    '</div>'+
  '</div>';
}
/* Dokumen mandiri: GABUNGAN seluruh sampul yang sudah terisi.
   Sampul Satu & Sampul Dua digabung dalam satu berkas, masing-masing mulai di
   halaman baru. Bila Sampul Dua belum diperiksa, hanya Sampul Satu yang dicetak. */
function pnwStandaloneDocHtml(){
  const st=pnwActiveState();
  const list = pnwIsTwoSampul(st) ? pnwSampulTerisi(st) : ['s1'];
  const isi = list.map(sk=>pnwBuildDocHtml(sk)).join('');
  return fklDocShell(pnwExtraDocCss(), isi);
}
function pnwExtraDocCss(){
  return ''+
  /* Dokumen gabungan: tiap sampul berikutnya SELALU mulai di halaman baru.
     Di layar (pratinjau) diberi garis pemisah agar batas antar form terlihat. */
  '.pnw-doc + .pnw-doc{page-break-before:always;break-before:page}'+
  /* Pemisah antar-penyedia berlaku di LAYAR MAUPUN CETAK. Dulu dibedakan (di cetak
     dihapus), sehingga tinggi isi di pratinjau tidak sama dengan hasil cetak. */
  '.pnw-doc + .pnw-doc{margin-top:26px;padding-top:26px;border-top:2px dashed #cbd5d8}'+
  '.pnw-penyedia-block{margin:6px 0 14px}'+
  '.pnw-penyedia-name{font-family:"Plus Jakarta Sans",sans-serif;font-weight:800;font-size:12px;letter-spacing:.4px;color:#0b3d42;background:#e3f2f3;border:1px solid #bfe0e2;border-radius:6px;padding:6px 10px;margin-bottom:6px;text-transform:uppercase}'+
  '.fkl-chk td.kt,.fkl-chk th.kt{width:22%;text-align:left}'+
  /* Baris judul kategori persyaratan — dibedakan jelas dari isi persyaratan */
  '.fkl-chk tr.cat td{background:#e3f2f3;color:#0b3d42;font-weight:800;font-size:11.5px;text-transform:uppercase;letter-spacing:.8px;padding:7px 12px 7px 14px;border-top:1.5px solid #0b6a73;border-bottom:1px solid #9fc7cb;border-right:none;position:relative;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  '.fkl-chk tr.cat td::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:#0E7C86}'+
  '.fkl-chk tr.cat:first-child td{border-top:none}'+
  '.fkl-chk tr.cat + tr td{border-top:none}'+
  '.ttd.ttd-single{width:auto}'+
  '.ttd.ttd-single td{width:280px;text-align:center;vertical-align:top;padding-top:4px}'+
  /* Teks URAIAN poin B (Pemeriksaan Kelengkapan Dokumen Penawaran) & C (Hasil
     Pemeriksaan) dinaikkan ke 12px (permintaan 21 Jul 2026; bawaan 11px). */
  '.pnw-doc .fkl-chk tbody tr:not(.cat) td{font-size:12px}'+   /* baris kategori (tr.cat) tetap 11,5px */
  '.pnw-doc .hasil .hs{font-size:12px}'+
  '.pnw-doc .fkl-chk thead th{text-align:center;white-space:normal;line-height:1.22;vertical-align:middle}'+
  '.pnw-doc .fkl-chk:not(.pnw-hasil) th.ck,.pnw-doc .fkl-chk:not(.pnw-hasil) td.ck{width:112px}'+
  '.pnw-doc .fkl-chk:not(.pnw-hasil) .pill{min-width:0;padding:3px 8px}'+
  '.pnw-hasil{margin-top:2px;table-layout:fixed}'+
  '.pnw-doc .pnw-hasil th.no,.pnw-doc .pnw-hasil td.no{width:34px}'+
  '.pnw-doc .pnw-hasil th.ck,.pnw-doc .pnw-hasil td.ck{width:136px}'+
  /* Kolom Nama Penyedia dipersempit 35% (52% -> 34%); sisa ruangnya dialihkan ke
     kolom Keterangan (22% -> 40%) agar teks keterangan tidak terpecah sempit. */
  '.pnw-doc .pnw-hasil th.nm,.pnw-doc .pnw-hasil td.nm{width:34%}'+
  '.pnw-doc .pnw-hasil th.kt,.pnw-doc .pnw-hasil td.kt{width:40%}'+
  '.pnw-doc .pnw-hasil td.nm{white-space:normal;word-break:break-word;overflow-wrap:break-word}'+
  '.pnw-doc .pnw-hasil td.kt{white-space:normal}'+
  /* ---- Tanda tangan diselaraskan agar MENYATU dengan isi dokumen ----
     Sebelumnya nama pejabat memakai bobot 800 & ukuran 12,5px sehingga terlihat
     seperti jenis huruf yang berbeda dan lebih besar dari label di atasnya.
     Kini SELURUH elemen (tanggal, "Diperiksa oleh,", "Pejabat Pelaksana
     Pengadaan", dan nama) memakai satu jenis huruf yang sama (Plus Jakarta Sans
     ditetapkan eksplisit) dengan skala ukuran seragam 12px dan tangga bobot yang
     rapi (label 600 -> jabatan 700 -> nama 700). */
  '.fkl-doc-foot .ttd-date,'+
  '.fkl-doc-foot .ttd .role,'+
  '.fkl-doc-foot .ttd .role2,'+
  '.fkl-doc-foot .ttd .nm{font-family:"Plus Jakarta Sans","Segoe UI",sans-serif}'+
  '.fkl-doc-foot .ttd-date{font-size:12px;font-weight:600;color:#22343a}'+
  '.fkl-doc-foot .ttd .role{font-size:12px;font-weight:600;letter-spacing:.2px;color:#22343a}'+
  '.ttd .role2{font-size:12px;font-weight:700;line-height:1.3;letter-spacing:.2px;color:#0d2a30;margin-top:1px}'+
  '.fkl-doc-foot .ttd .nm{font-size:12px;font-weight:700;letter-spacing:.3px;color:#0d2a30;padding-top:5px}';
}
function pnwOpenPreview(){
  const ov=document.getElementById('pn-preview-overlay'); if(!ov) return;
  const _mdl=ov.querySelector('.pn-preview-modal'); if(_mdl) _mdl.classList.remove('is-max');
  if(typeof pnPreviewResetMaxBtn==='function') pnPreviewResetMaxBtn();
  const titleEl=document.getElementById('pn-preview-title');
  const _st=pnwActiveState();
  const two=pnwIsTwoSampul(_st);
  if(titleEl){
    let sub='';
    if(two){
      const isi=pnwSampulTerisi(_st);
      sub = (isi.length>1) ? ' (Sampul Satu & Sampul Dua)' : (' ('+pnwSampulLabel(isi[0])+')');
    }
    titleEl.textContent='Pratinjau — Form Pembukaan Penawaran'+sub;
  }
  const body=document.getElementById('pn-preview-body');
  if(body){
    body.classList.add('fkl-preview-body');
    body.innerHTML='<iframe id="pnw-preview-frame" title="Pratinjau Dokumen"></iframe>';
    const ifr=document.getElementById('pnw-preview-frame');
    const doc=ifr.contentWindow.document; doc.open(); doc.write(pnwStandaloneDocHtml()); doc.close();
  }
  const actions=document.querySelector('#pn-preview-overlay .pn-preview-head-actions');
  { const _c=document.getElementById('hpsc-preview-print'); if(_c) _c.remove(); }
  // hapus tombol cetak FKL bila ada agar tidak bentrok
  const oldFkl=document.getElementById('fkl-preview-print'); if(oldFkl) oldFkl.remove();
  if(actions && !document.getElementById('pnw-preview-print')){
    const btn=document.createElement('button');
    btn.id='pnw-preview-print'; btn.className='btn btn-teal';
    btn.style.padding='8px 14px'; btn.style.fontSize='11px';
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>Cetak / PDF';
    btn.onclick=pnwPrint;
    actions.insertBefore(btn, actions.firstChild);
  }
  ov.classList.add('show');
}
function pnwPrint(){
  const old=document.getElementById('pnw-print-frame'); if(old) old.remove();
  const ifr=document.createElement('iframe');
  ifr.id='pnw-print-frame'; ifr.setAttribute('aria-hidden','true');
  ifr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(ifr);
  const doc=ifr.contentWindow.document; doc.open(); doc.write(pnwStandaloneDocHtml()); doc.close();
  const go=()=>fklWaitPaged(ifr, _go);
  const _go=()=>{ withHiddenPageTitle(()=>{ try{ ifr.contentWindow.focus(); ifr.contentWindow.print(); }catch(e){ try{ window.print(); }catch(_){} } }); setTimeout(()=>{ const f=document.getElementById('pnw-print-frame'); if(f) f.remove(); },1500); };
  const imgs=doc.images?Array.from(doc.images):[];
  if(imgs.length){ let n=imgs.length; const dec=()=>{ if(--n<=0) setTimeout(go,60); }; imgs.forEach(im=>{ if(im.complete) dec(); else { im.onload=dec; im.onerror=dec; } }); setTimeout(go,1200); }
  else setTimeout(go,120);
}
/* helper: escape utk string dalam atribut onclick JS */
function fkEscJs(s){ return String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/\n/g,' '); }

/* ##################### AKHIR MODUL PEMBUKAAN PENAWARAN #################### */

/* ####################################################################### */
/* ################## MODUL REFERENSI HARGA ONLINE (RHO) ################## */
/* ####################################################################### */

/* Field data pekerjaan (langkah 1). Sama seperti Pembukaan Penawaran namun
   tanpa Metode Penyampaian Dokumen & tanpa Nama Pejabat Pelaksana. */
const RHO_INFO_FIELDS = [
  {key:'nama',          label:'Nama Pekerjaan',            type:'text', span:2},
  {key:'lokasi',        label:'Lokasi Pekerjaan',          type:'text', span:2},
  {key:'nilai',         label:'Rencana Anggaran Biaya', type:'num'},
  {key:'no_anggaran',   label:'No. Anggaran',              type:'text'},
  {key:'tgl_anggaran',  label:'Tgl. Anggaran',             type:'date'},
  {key:'jenis_anggaran',label:'Jenis Anggaran',            type:'select', options:PNW_JENIS_ANGGARAN},
  {key:'metode',        label:'Metode Pengadaan',          type:'select', options:PNW_METODE}
];

/* ---------- State ----------
   info      : { key:value } data pekerjaan
   jumlahRef : jumlah kolom referensi (1..10)
   items     : ['Nama barang', ...] sepanjang Jumlah Barang/Jasa (1..150)
   refs      : { itemIdx:[ {foto,link,harga,berat,ongkir}, ... ] }  panjang = jumlahRef
*/
function rhoBlankState(){ return { info:{}, jumlahRef:1, items:[''], sumber:[''], refs:{}, ongkirMode:'beda', ongkirSama:'' }; }
let rhoState = rhoBlankState();
let rhoStep = 1;              // 1..2
let rhoEditId = null;
let rhoRevealPick = false;    // true sekali setelah "Pilih Data Pekerjaan" → animasi reveal
let rhoPreviewState = null;   // utk pratinjau record tersimpan

const RHO_STATE_KEY = 'rho_state_v1';
function rhoLoadState(){ try{ const raw=ssGet(RHO_STATE_KEY); if(raw){ const o=JSON.parse(raw); if(o&&o.info) rhoState=o; } }catch(e){} }
function rhoSaveState(){ try{ ssSet(RHO_STATE_KEY, JSON.stringify(rhoState)); }catch(e){} }
rhoLoadState();
function rhoActiveState(){ return rhoPreviewState || rhoState; }
function rhoMarkActive(){ document.querySelectorAll('.topnav-item[data-view="form-rho"]').forEach(b=>b.classList.add('active')); }

/* Pastikan struktur refs sesuai jumlah item & jumlah referensi */
function rhoEnsureRefs(){
  const st=rhoState;
  if(!st.refs || typeof st.refs!=='object' || Array.isArray(st.refs)) st.refs={};
  const K=Math.max(1,Math.min(10, parseInt(st.jumlahRef,10)||1)); st.jumlahRef=K;
  if(!Array.isArray(st.items) || !st.items.length) st.items=[''];
  if(!Array.isArray(st.sumber)) st.sumber=[];
  { const curS=st.sumber.slice(); st.sumber=[]; for(let r=0;r<K;r++) st.sumber.push(curS[r]!=null?curS[r]:''); }
  if(st.ongkirMode!=='sama') st.ongkirMode='beda';
  if(st.ongkirSama==null) st.ongkirSama='';
  st.items.forEach((_,i)=>{
    const arr=Array.isArray(st.refs[i])?st.refs[i]:[];
    const next=[];
    for(let r=0;r<K;r++){ const c=arr[r]||{}; next.push({foto:c.foto||'', fotoPath:c.fotoPath||'', link:c.link||'', harga:(c.harga!=null?c.harga:''), berat:(c.berat!=null?c.berat:''), ongkir:(c.ongkir!=null?c.ongkir:'')}); }
    st.refs[i]=next;
  });
  Object.keys(st.refs).forEach(k=>{ if(parseInt(k,10)>=st.items.length) delete st.refs[k]; });
  if(st.ongkirMode==='sama') rhoSyncOngkirSama();   // pastikan sel baru ikut terisi nilai ongkir seragam
}
/* Terapkan nilai Harga Ongkir (1 Kg) ke SEMUA sel Ongkos Kirim (dipakai saat Penetapan Ongkir = Sama) */
function rhoSyncOngkirSama(){
  const st=rhoState; const v=st.ongkirSama;
  Object.keys(st.refs).forEach(i=>{ (st.refs[i]||[]).forEach(c=>{ c.ongkir=v; }); });
}

/* ---------- Penyimpanan (Supabase + fallback lokal) ---------- */
const RHO_TABLE = 'referensi_harga_online';
const RHO_LS_KEY = 'rho_records_v1';
let records_rho = [];
let rhoUseLocal = false;   // menjadi true bila Supabase tak tersedia / tabel belum dibuat
function rhoSupaReady(){ return !!(USE_SUPABASE && db); }
function rhoLocalLoad(){ try{ const r=localStorage.getItem(RHO_LS_KEY); records_rho = r?JSON.parse(r):[]; }catch(e){ records_rho=[]; } }
function rhoLocalSave(){ /* dinonaktifkan: data hanya di Supabase */ }
function rhoIsLocalId(id){ return String(id).indexOf('loc_')===0; }
const StoreRho = {
  async list(){
    if(!rhoSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(RHO_TABLE).select('*').order('created_at',{ascending:false});
    if(error) throw error; return data||[];
  },
  async create(rec){
    if(!rhoSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(RHO_TABLE).insert(rec).select();
    if(error) throw error; return data&&data[0];
  },
  async update(rid, rec){
    if(!rhoSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(RHO_TABLE).update(rec).eq('id',rid);
    if(error) throw error;
  },
  async remove(rid){
    if(!rhoSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(RHO_TABLE).delete().eq('id',rid);
    if(error) throw error;
  }
};
async function refreshDataRho(){
  try{ records_rho = await StoreRho.list(); }
  catch(err){ console.error(err); records_rho = records_rho||[]; }
}

/* ---- Foto produk di Supabase Storage (bukan base64 di kolom state) ----
   Solusi permanen agar baris DB ringan: foto diunggah ke bucket publik lalu
   yang disimpan di state hanya URL-nya. Aman mundur: bila bucket belum dibuat
   / upload gagal, pemanggil mempertahankan base64 sebagai cadangan. */
const RHO_BUCKET = 'rho-foto';   // WAJIB dibuat sebagai bucket PUBLIC di Supabase Storage
function rhoUid(){ try{ if(window.crypto&&crypto.randomUUID) return 'rho_'+crypto.randomUUID(); }catch(e){} return 'rho_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10); }
function rhoIsDataUrl(s){ return typeof s==='string' && s.indexOf('data:image')===0; }
function rhoIsHttpUrl(s){ return typeof s==='string' && /^https?:\/\//i.test(s); }
function rhoDataUrlToBlob(dataUrl){
  const s=String(dataUrl||''); const i=s.indexOf(',');
  const meta=(i>=0?s.slice(0,i):''); const b64=(i>=0?s.slice(i+1):s);
  const mime=(meta.match(/data:([^;]+)/)||[])[1]||'image/jpeg';
  return fkB64ToBlob(b64, mime);
}
const StoreRhoFoto = {
  async uploadDataUrl(dataUrl, path){
    if(!rhoSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const blob=rhoDataUrlToBlob(dataUrl);
    const up=await db.storage.from(RHO_BUCKET).upload(path, blob, {contentType:blob.type||'image/jpeg', upsert:true});
    if(up.error) throw up.error;
    const pub=db.storage.from(RHO_BUCKET).getPublicUrl(path);
    const url=pub&&pub.data&&pub.data.publicUrl;
    if(!url) throw new Error('URL publik tidak tersedia');
    return {url, path};
  },
  async removeFolder(key){
    if(!rhoSupaReady()||!key) return;
    try{
      const ls=await db.storage.from(RHO_BUCKET).list(key,{limit:1000});
      if(ls&&!ls.error&&Array.isArray(ls.data)&&ls.data.length){
        await db.storage.from(RHO_BUCKET).remove(ls.data.map(o=>key+'/'+o.name));
      }
    }catch(e){ console.error('Bersihkan folder foto gagal',e); }
  }
};

/* ---------- Buka form / lihat data ---------- */
function openRhoInput(editId){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  rhoPreviewState=null;
  if(editId){
    const rec=(records_rho||[]).find(r=>String(r.id)===String(editId));
    rhoEditId = rec ? rec.id : null;
    rhoState = rec ? rhoRecordToState(rec) : rhoBlankState();
  }else{
    rhoEditId=null; rhoState=rhoBlankState();
    resetInputBaru('rho');
  }
  rhoStep=1; rhoEnsureRefs(); rhoSaveState(); showView('form-rho');
}
function openRhoView(){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  refreshDataRho().then(()=>showView('rho-view'));
}
function rhoRecordToState(rec){
  const base=rhoBlankState();
  const s=(rec&&rec.state&&typeof rec.state==='object')?rec.state:{};
  const st={
    info: Object.assign({}, base.info, s.info||{}),
    jumlahRef: Math.max(1,Math.min(10, parseInt(s.jumlahRef,10)||1)),
    items: (Array.isArray(s.items)&&s.items.length)?s.items.slice():[''],
    sumber: Array.isArray(s.sumber)?s.sumber.slice():[''],
    refs: {},
    ongkirMode: s.ongkirMode==='sama' ? 'sama' : 'beda',
    ongkirSama: s.ongkirSama!=null ? s.ongkirSama : ''
  };
  if(s.refs && typeof s.refs==='object'){
    Object.keys(s.refs).forEach(k=>{
      if(Array.isArray(s.refs[k])) st.refs[k]=s.refs[k].map(c=>({foto:c.foto||'', fotoPath:c.fotoPath||'', link:c.link||'', harga:(c.harga!=null?c.harga:''), berat:(c.berat!=null?c.berat:''), ongkir:(c.ongkir!=null?c.ongkir:'')}));
    });
  }
  return st;
}

/* ---------- Stepper ---------- */
function rhoStepperHtml(){
  const steps=[['1','Data Pekerjaan'],['2','Pengisian Referensi']];
  return '<div class="fkl-stepper">'+steps.map((s,i)=>{
    const n=i+1;
    const cls = n<rhoStep ? 'done' : (n===rhoStep ? 'active' : '');
    const mark = n<rhoStep ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>' : s[0];
    const line = i<steps.length-1 ? '<div class="fkl-step-line '+(n<rhoStep?'done':'')+'"></div>' : '';
    return '<div class="fkl-step '+cls+'"><div class="fkl-step-dot">'+mark+'</div><div class="fkl-step-name">'+s[1]+'</div></div>'+line;
  }).join('')+'</div>';
}

/* ================= LANGKAH 1: DATA PEKERJAAN ================= */
/* Field bersama (sumber dari Data Pekerjaan) yang dikunci saat sebuah Data
   Pekerjaan dipilih — sama seperti Perhitungan HPS & Analisa Harga Satuan.
   DP_SHARED_KEYS dirujuk saat pemanggilan (bukan saat definisi) karena modul
   Data Pekerjaan berada setelah blok ini. */
function rhoIsLocked(key){ return !!(rhoState.info && rhoState.info.dpId) && DP_SHARED_KEYS.indexOf(key)>=0; }
function rhoInfoInputHtml(f){
  const id='rho-'+f.key;
  const locked=rhoIsLocked(f.key);
  const span=f.span?(' style="grid-column:span '+f.span+'"'):'';
  const dis = locked ? ' disabled' : '';
  let ctl;
  if(f.type==='select'){
    ctl='<select id="'+id+'"'+dis+' onchange="rhoOnInfoChange()"><option value="">— Pilih —</option>'+(f.options||[]).map(o=>'<option>'+fkEsc(o)+'</option>').join('')+'</select>';
  }
  else if(f.type==='num') ctl='<input id="'+id+'" type="text" inputmode="numeric" placeholder="Rp"'+dis+' oninput="onRupiahInput(this)" onchange="rhoOnInfoChange()">';
  else if(f.type==='date') ctl='<input id="'+id+'" type="date"'+dis+' onchange="rhoOnInfoChange()">';
  else ctl='<input id="'+id+'" type="text"'+dis+' oninput="rhoOnInfoChange()">';
  return '<div class="field'+(locked?' is-locked':'')+'"'+span+'><label>'+fkEsc(f.label)+'</label>'+ctl+(locked?DP_LOCK_BADGE:'')+'</div>';
}
function rhoCountFieldsHtml(){
  const st=rhoState;
  let refOpts=''; for(let i=1;i<=10;i++)  refOpts+='<option value="'+i+'"'+(i===st.jumlahRef?' selected':'')+'>'+i+' Referensi</option>';
  let itmOpts=''; for(let i=1;i<=150;i++) itmOpts+='<option value="'+i+'"'+(i===st.items.length?' selected':'')+'>'+i+' Item</option>';
  return '<div class="field"><label>Jumlah Referensi</label><select id="rho-jumlahref" onchange="rhoOnJumlahRefChange(this)">'+refOpts+'</select></div>'+
         '<div class="field"><label>Jumlah Barang/Material</label><select id="rho-jumlahitem" onchange="rhoOnJumlahItemChange(this)">'+itmOpts+'</select></div>';
}
function rhoItemListHtml(){
  const st=rhoState;
  const many=st.items.length>1;
  const rows=st.items.map((nm,i)=>'<div class="rho-item-row"><span class="rho-item-no">'+(i+1)+'</span>'+
    '<input type="text" data-i="'+i+'" placeholder="Nama barang/material ke-'+(i+1)+'" value="'+fkEsc(nm||'')+'" oninput="rhoOnItemNama(this)">'+
    '<button type="button" class="rho-item-del" title="Hapus barang/material ini"'+(many?'':' disabled')+' onclick="rhoDeleteItem('+i+')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg></button></div>').join('');
  return '<div class="rho-item-list">'+rows+'</div>';
}
/* Label kolom referensi: nama sumber yg diinput (fallback "Referensi N") */
function rhoRefLabel(r){ const st=rhoActiveState(); const v=(st.sumber&&st.sumber[r]!=null)?String(st.sumber[r]).trim():''; return v?v:('Referensi '+(r+1)); }
/* Daftar input Nama Referensi (jumlah mengikuti Jumlah Referensi) */
function rhoSumberListHtml(){
  const st=rhoState; const K=st.jumlahRef; if(!Array.isArray(st.sumber)) st.sumber=[];
  let rows='';
  for(let r=0;r<K;r++){ rows+='<div class="rho-item-row"><span class="rho-item-no">'+(r+1)+'</span>'+
    '<input type="text" data-r="'+r+'" placeholder="Nama referensi ke-'+(r+1)+' (mis. Shopee, e-Katalog)" value="'+fkEsc(st.sumber[r]||'')+'" oninput="rhoOnSumber(this)"></div>'; }
  return '<div class="rho-item-list">'+rows+'</div>';
}
function rhoOnSumber(el){ const r=+el.dataset.r; const st=rhoState; if(!Array.isArray(st.sumber)) st.sumber=[]; st.sumber[r]=el.value; rhoSaveState(); }
function rhoOnInfoChange(){
  const st=rhoState;
  RHO_INFO_FIELDS.forEach(f=>{ if(rhoIsLocked(f.key)) return; const el=document.getElementById('rho-'+f.key); if(!el) return; st.info[f.key]=(f.type==='num')?parseRupiah(el.value):el.value.trim(); });
  rhoSaveState();
}
/* Bar wajib "Pilih Data Pekerjaan" — sumber nama/lokasi/nilai/no.anggaran/tgl.anggaran/metode. */
function rhoDpBarHtml(){
  const info=rhoState.info||{};
  const dipilih = info.dpId ? String(info.dpNama||info.nama||'').trim() : '';
  const sub = dipilih
    ? ('Data pekerjaan terisi otomatis & terkunci dari: <b style="color:var(--teal-dark)">'+fkEsc(dipilih)+'</b>')
    : 'Opsional — pilih Data Pekerjaan agar kolom Nama/Lokasi/Nilai/No. Anggaran/Tgl. Anggaran/Metode terisi otomatis, atau isi manual pada kolom di bawah.';
  let btns='<button type="button" class="btn btn-teal" style="padding:8px 14px;font-size:11.5px" onclick="rhoPilihDp()">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M4 4h5l2 3h9a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>'+(dipilih?'Ganti Data Pekerjaan':'Pilih Data Pekerjaan')+'</button>';
  if(dipilih) btns+='<button type="button" class="btn btn-unpick" style="padding:8px 14px;font-size:11.5px" onclick="rhoLepasDp()">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M18 6 6 18M6 6l12 12"/></svg>Lepas Pilihan</button>';
  return '<div class="hps-analisa-bar">'+
    '<div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h5l2 3h9a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg></div>'+
    '<div class="tx"><b>Pilih Data Pekerjaan</b><span>'+sub+'</span></div>'+btns+
  '</div>';
}
function rhoPilihDp(){ openDpPicker('rho'); }
/* Dipanggil oleh dpPickerSelect() saat sebuah Data Pekerjaan dipilih untuk RHO */
function rhoApplyDp(rec){
  const st=rhoState; st.info=st.info||{};
  const info=(rec.state&&rec.state.info)||{};
  DP_SHARED_KEYS.forEach(k=>{ st.info[k]=(info[k]!=null?info[k]:''); });
  st.info.dpId=String(rec.id);
  st.info.dpNama=rec.nama_pekerjaan||info.nama||'';
  rhoSaveState();
  rhoRevealPick=true;   // pemicu animasi reveal konten di bawah tombol
  renderRhoForm();
  toast('Data pekerjaan berhasil diterapkan','ok');
}
/* Lepas pilihan Data Pekerjaan → kembali ke kondisi belum dipilih (wajib pilih ulang) */
function rhoLepasDp(){
  const st=rhoState; if(!st.info) return;
  delete st.info.dpId; delete st.info.dpNama;
  DP_SHARED_KEYS.forEach(k=>{ st.info[k]=''; });
  rhoSaveState(); renderRhoForm();
  toast('Pilihan Data Pekerjaan dilepas','ok');
}
function rhoOnJumlahRefChange(el){
  const n=Math.max(1,Math.min(10,parseInt(el.value,10)||1));
  rhoState.jumlahRef=n; rhoEnsureRefs(); rhoSaveState(); renderRhoForm();
}
function rhoOnJumlahItemChange(el){
  const n=Math.max(1,Math.min(150,parseInt(el.value,10)||1));
  const st=rhoState; const cur=st.items.slice(); const next=[]; for(let i=0;i<n;i++) next.push(cur[i]||'');
  st.items=next; rhoEnsureRefs(); rhoSaveState(); renderRhoForm();
}
function rhoOnItemNama(el){ const i=+el.dataset.i; rhoState.items[i]=el.value; rhoSaveState(); }
/* Hapus satu barang/material. Setelah dihapus, Jumlah Barang/Material otomatis
   berkurang (mengikuti panjang daftar terbaru) dan struktur referensi ikut digeser. */
function rhoDeleteItem(i){
  const st=rhoState;
  if(!Array.isArray(st.items)) return;
  i=parseInt(i,10); if(isNaN(i)||i<0||i>=st.items.length) return;
  if(st.items.length<=1){ toast('Minimal harus ada 1 barang/material','warn'); return; }
  const nama=String(st.items[i]||'').trim();
  const doDel=()=>{
    // Geser referensi: buang key i, key > i turun satu tingkat.
    const oldRefs=(st.refs&&typeof st.refs==='object')?st.refs:{};
    const newRefs={};
    st.items.forEach((_,idx)=>{
      if(idx<i) newRefs[idx]=oldRefs[idx];
      else if(idx>i) newRefs[idx-1]=oldRefs[idx];
    });
    st.items.splice(i,1);
    st.refs=newRefs;
    rhoEnsureRefs(); rhoSaveState(); renderRhoForm();
    toast('Barang/material dihapus','ok');
  };
  if(nama){
    openConfirm({icon:'del',title:'Hapus Barang/Material',text:'Hapus "'+nama+'" dari daftar? Jumlah Barang/Material akan menyesuaikan.',onYes:doDel});
  }else{
    doDel();
  }
}

/* ================= LANGKAH 2: PENGISIAN REFERENSI ================= */
function rhoNum(v){ if(v===''||v==null) return 0; if(typeof v==='number') return v; const n=parseFloat(String(v).replace(/,/g,'.')); return isNaN(n)?0:n; }
function rhoRp(n){ n=Math.round(rhoNum(n)); return n>0 ? ('Rp '+n.toLocaleString('id-ID')) : '–'; }
function rhoBeratText(v){ return (v==null||v==='') ? '' : String(v); }
function rhoCalcEst(i,r){ const st=rhoActiveState(); const c=(st.refs&&st.refs[i]&&st.refs[i][r])?st.refs[i][r]:{}; return Math.round(rhoNum(c.berat)*rhoNum(c.ongkir)); }
function rhoCalcTot(i,r){ const st=rhoActiveState(); const c=(st.refs&&st.refs[i]&&st.refs[i][r])?st.refs[i][r]:{}; return Math.round(rhoNum(c.harga)+rhoCalcEst(i,r)); }
function rhoRecalcCell(i,r){ const e=document.getElementById('rho-est-'+i+'-'+r); if(e) e.textContent=rhoRp(rhoCalcEst(i,r)); const t=document.getElementById('rho-tot-'+i+'-'+r); if(t) t.textContent=rhoRp(rhoCalcTot(i,r)); }

function rhoFotoInnerEmpty(){
  return '<div class="rho-foto-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span>Klik lalu tempel<br>(Ctrl + V)</span></div>';
}
function rhoFotoInnerImg(url,i,r){
  return '<img src="'+url+'" alt="Foto produk"><div class="rho-foto-actions"><button type="button" title="Hapus foto" onclick="rhoClearFoto(event,'+i+','+r+')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button></div>';
}
function rhoFotoCellHtml(i,r){
  const st=rhoState; const cell=(st.refs[i]&&st.refs[i][r])?st.refs[i][r]:{}; const foto=cell.foto||'';
  const inner = foto ? rhoFotoInnerImg(foto,i,r) : rhoFotoInnerEmpty();
  return '<div class="rho-foto-cell'+(foto?' has-img':'')+'" id="rho-foto-'+i+'-'+r+'" data-i="'+i+'" data-r="'+r+'" tabindex="0" onclick="rhoFotoClick(this)">'+inner+'</div>';
}
function rhoItemMatrixHtml(i){
  const st=rhoState; const K=st.jumlahRef; const name=(st.items[i]&&st.items[i].trim())?st.items[i]:('Barang/Material '+(i+1));
  const cells=st.refs[i]||[];
  // Berat barang seragam: samakan seluruh referensi dengan Referensi 1 (hanya Ref 1 yang bisa diedit).
  if(cells.length){ const b0=(cells[0]&&cells[0].berat!=null)?cells[0].berat:''; for(let r=1;r<K;r++){ if(cells[r]) cells[r].berat=b0; } }
  let head='<thead><tr><th class="rho-c-lbl">Uraian</th>';
  for(let r=0;r<K;r++) head+='<th>'+fkEsc(rhoRefLabel(r))+'</th>';
  head+='</tr></thead>';
  let body='<tbody>';
  // baris 1: Nama Barang/Material (otomatis dari langkah 1)
  body+='<tr class="rho-namarow"><td class="rho-c-lbl">Nama Barang/Material</td><td colspan="'+K+'">'+fkEsc(name)+'</td></tr>';
  // Foto Produk
  body+='<tr><td class="rho-c-lbl">Foto Produk<span class="rho-c-sub">Salin gambar/printscreen lalu tempel</span></td>';
  for(let r=0;r<K;r++) body+='<td>'+rhoFotoCellHtml(i,r)+'</td>';
  body+='</tr>';
  // Link Produk
  body+='<tr><td class="rho-c-lbl">Link Produk</td>';
  for(let r=0;r<K;r++){ const v=cells[r]?(cells[r].link||''):''; body+='<td><input type="text" id="rho-link-'+i+'-'+r+'" data-i="'+i+'" data-r="'+r+'" placeholder="https://..." value="'+fkEsc(v)+'" oninput="rhoOnLink(this)"></td>'; }
  body+='</tr>';
  // Harga Satuan
  body+='<tr><td class="rho-c-lbl">Harga Satuan</td>';
  for(let r=0;r<K;r++){ const v=cells[r]?cells[r].harga:''; body+='<td><input type="text" inputmode="numeric" id="rho-harga-'+i+'-'+r+'" data-i="'+i+'" data-r="'+r+'" placeholder="Rp" value="'+rupiahInputText(v)+'" oninput="rhoOnMoney(this,\'harga\')"></td>'; }
  body+='</tr>';
  // Berat Barang (kg) — hanya Referensi 1 dapat diisi; referensi lain terkunci & mengikuti Referensi 1
  body+='<tr><td class="rho-c-lbl">Berat Barang<span class="rho-c-sub">dalam kilogram (kg)</span></td>';
  for(let r=0;r<K;r++){ const v=cells[r]?cells[r].berat:''; const lk=r>0; body+='<td><input type="text" inputmode="decimal" id="rho-berat-'+i+'-'+r+'" data-i="'+i+'" data-r="'+r+'" placeholder="kg" value="'+fkEsc(rhoBeratText(v))+'"'+(lk?' disabled class="rho-input-locked"':'')+' oninput="rhoOnBerat(this)"></td>'; }
  body+='</tr>';
  // Ongkos Kirim (1 kg)
  body+='<tr><td class="rho-c-lbl">Ongkos Kirim<span class="rho-c-sub">per 1 kg</span></td>';
  { const locked=st.ongkirMode==='sama';
    for(let r=0;r<K;r++){ const v=cells[r]?cells[r].ongkir:''; body+='<td><input type="text" inputmode="numeric" id="rho-ongkir-'+i+'-'+r+'" data-i="'+i+'" data-r="'+r+'" placeholder="Rp" value="'+rupiahInputText(v)+'"'+(locked?' disabled class="rho-input-locked"':'')+' oninput="rhoOnMoney(this,\'ongkir\')"></td>'; }
  }
  body+='</tr>';
  // Estimasi Ongkos Kirim (otomatis)
  body+='<tr class="rho-autorow"><td class="rho-c-lbl">Estimasi Ongkir<span class="rho-c-sub">Berat × Ongkir</span></td>';
  for(let r=0;r<K;r++) body+='<td><span class="rho-auto-val" id="rho-est-'+i+'-'+r+'">'+rhoRp(rhoCalcEst(i,r))+'</span></td>';
  body+='</tr>';
  // Harga Total (otomatis)
  body+='<tr class="rho-autorow rho-totrow"><td class="rho-c-lbl">Harga Total<span class="rho-c-sub">Harga Satuan + Estimasi Ongkir</span></td>';
  for(let r=0;r<K;r++) body+='<td><span class="rho-auto-val rho-total-val" id="rho-tot-'+i+'-'+r+'">'+rhoRp(rhoCalcTot(i,r))+'</span></td>';
  body+='</tr>';
  body+='</tbody>';
  return '<div class="rho-item-card"><div class="rho-item-head"><span class="rho-h-no">'+(i+1)+'</span><span class="rho-h-name">'+fkEsc(name)+'</span><span class="rho-h-tag">'+K+' Referensi</span></div>'+
    '<div class="rho-matrix-wrap"><table class="rho-matrix">'+head+body+'</table></div></div>';
}
function rhoOngkirBarHtml(){
  const st=rhoState; const isSama=st.ongkirMode==='sama';
  return '<div class="rho-ongkir-bar">'+
    '<div class="field"><label>Penetapan Ongkir</label>'+
      '<select id="rho-ongkirmode" onchange="rhoOnOngkirModeChange(this)">'+
        '<option value="beda"'+(isSama?'':' selected')+'>Berbeda</option>'+
        '<option value="sama"'+(isSama?' selected':'')+'>Sama</option>'+
      '</select>'+
    '</div>'+
    '<div class="field'+(isSama?'':' locked')+'"><label>Harga Ongkir (1 Kg)</label>'+
      '<input type="text" inputmode="numeric" id="rho-ongkirsama" placeholder="Rp" value="'+rupiahInputText(st.ongkirSama)+'"'+(isSama?'':' disabled')+' oninput="rhoOnOngkirSamaChange(this)"></div>'+
  '</div>';
}
function rhoOnOngkirModeChange(el){
  const st=rhoState;
  st.ongkirMode = el.value==='sama' ? 'sama' : 'beda';
  if(st.ongkirMode==='sama') rhoSyncOngkirSama();
  else st.ongkirSama='';   // Berbeda → Harga Ongkir (1 Kg) terkunci tanpa isian
  rhoSaveState();
  renderRhoForm();
}
function rhoOnOngkirSamaChange(el){
  onRupiahInput(el);
  const st=rhoState;
  st.ongkirSama=parseRupiah(el.value);
  if(st.ongkirMode==='sama'){
    rhoSyncOngkirSama();
    Object.keys(st.refs).forEach(k=>{ const i=+k; (st.refs[i]||[]).forEach((c,r)=>{
      const inp=document.getElementById('rho-ongkir-'+i+'-'+r); if(inp) inp.value=rupiahInputText(c.ongkir);
      rhoRecalcCell(i,r);
    }); });
  }
  rhoSaveState();
}
function rhoPanelHtml(){
  const st=rhoState;
  let html=rhoOngkirBarHtml();
  html+='<div class="rho-hint">Tempel foto produk dengan cara: klik kotak foto lalu tekan <b>Ctrl + V</b> (bisa hasil <i>print screen</i> atau salinan gambar dari halaman produk). Foto akan otomatis diseragamkan ukurannya. Kolom <b>Estimasi Ongkir</b> dan <b>Harga Total</b> terisi otomatis.</div>';
  html+='<div class="rho-panel">';
  st.items.forEach((nm,i)=>{ html+=rhoItemMatrixHtml(i); });
  html+='</div>';
  return html;
}

/* Interaksi langkah 2 (tanpa render ulang penuh agar fokus & scroll terjaga) */
function rhoOnLink(el){ const i=+el.dataset.i,r=+el.dataset.r; if(rhoState.refs[i]&&rhoState.refs[i][r]){ rhoState.refs[i][r].link=el.value; rhoSaveState(); } }
function rhoOnMoney(el,key){ onRupiahInput(el); const i=+el.dataset.i,r=+el.dataset.r; if(rhoState.refs[i]&&rhoState.refs[i][r]){ rhoState.refs[i][r][key]=parseRupiah(el.value); rhoSaveState(); rhoRecalcCell(i,r); } }
function rhoOnBerat(el){
  let v=el.value.replace(/[^0-9.,]/g,'').replace(/,/g,'.');
  const parts=v.split('.'); if(parts.length>2) v=parts[0]+'.'+parts.slice(1).join('');
  el.value=v;
  const i=+el.dataset.i; const st=rhoState; if(!st.refs[i]) return;
  // Berat sama untuk semua referensi: terapkan nilai ke seluruh referensi item ini,
  // perbarui input yang terkunci, lalu hitung ulang estimasi & total tiap referensi.
  const K=st.jumlahRef;
  for(let rr=0;rr<K;rr++){
    if(!st.refs[i][rr]) continue;
    st.refs[i][rr].berat=v;
    if(rr!==+el.dataset.r){ const inp=document.getElementById('rho-berat-'+i+'-'+rr); if(inp) inp.value=v; }
    rhoRecalcCell(i,rr);
  }
  rhoSaveState();
}

/* ---- Foto: fokus, tempel (paste), normalisasi ukuran, hapus ----
   Gambar disimpan UTUH (100% dari clipboard) tanpa dipotong (crop) dan tanpa
   diperbesar. Rasio asli dipertahankan; hanya diperkecil bila melebihi batas
   sisi terpanjang agar ukuran data tetap wajar. Saat ditampilkan/dicetak kotak
   memakai object-fit:contain sehingga seluruh gambar terlihat. */
function rhoFotoClick(el){ try{ el.focus(); }catch(e){} }
/* ---------- Kompresi foto ----------
   Foto produk hanya ditampilkan pada sel ~150px dan di PDF ~150px, jadi tidak perlu
   resolusi besar. Kita perkecil sisi terpanjang & pakai kualitas JPEG adaptif:
   mulai dari kualitas tinggi lalu turunkan bertahap sampai di bawah target ukuran. */
const RHO_IMG_MAX=1000;                 // batas sisi terpanjang (px) — hanya memperkecil, tak pernah memperbesar
const RHO_IMG_TARGET_BYTES=130*1024;    // target lunak ukuran per foto (~130 KB)
const RHO_IMG_Q_START=0.82;             // kualitas awal
const RHO_IMG_Q_MIN=0.55;               // kualitas minimum

/* Perkiraan ukuran byte dari sebuah data URL (base64). */
function rhoDataUrlBytes(u){
  if(!u || typeof u!=='string') return 0;
  const i=u.indexOf(','); const b=i>=0?u.slice(i+1):u;
  return Math.floor(b.length*0.75);
}
/* Encode canvas ke JPEG dengan kualitas adaptif agar di bawah target ukuran. */
function rhoEncodeCanvas(cv){
  let q=RHO_IMG_Q_START;
  let out=cv.toDataURL('image/jpeg',q);
  while(rhoDataUrlBytes(out)>RHO_IMG_TARGET_BYTES && q>RHO_IMG_Q_MIN){
    q=Math.max(RHO_IMG_Q_MIN, Math.round((q-0.1)*100)/100);
    out=cv.toDataURL('image/jpeg',q);
  }
  return out;
}
/* Perkecil + kompres sebuah sumber gambar (data URL / blob URL) menjadi JPEG ringan. */
function rhoNormalizeImage(src, cb){
  const img=new Image();
  img.onload=function(){
    try{
      let w=img.width||1, h=img.height||1;
      // Jangan pernah memperbesar: skala <= 1. Perkecil hanya bila melebihi batas.
      const s=Math.min(1, RHO_IMG_MAX/Math.max(w,h));
      w=Math.max(1,Math.round(w*s)); h=Math.max(1,Math.round(h*s));
      const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
      const ctx=cv.getContext('2d');
      try{ ctx.imageSmoothingQuality='high'; }catch(e){}
      ctx.drawImage(img,0,0,w,h);   // seluruh gambar, tanpa dipotong
      cb(rhoEncodeCanvas(cv));
    }catch(err){ cb(src); }
  };
  img.onerror=function(){ cb(src); };
  img.src=src;
}
/* Kompres ulang sebuah data URL foto yang SUDAH tersimpan.
   Kembalikan hasil hanya bila benar-benar lebih kecil, agar foto yang sudah ringan
   tidak diproses ulang (menghindari penurunan kualitas & penulisan sia-sia). */
function rhoRecompressStored(dataUrl){
  return new Promise(resolve=>{
    if(!dataUrl || typeof dataUrl!=='string' || dataUrl.indexOf('data:image')!==0){ resolve(dataUrl); return; }
    const before=rhoDataUrlBytes(dataUrl);
    rhoNormalizeImage(dataUrl, function(out){
      const after=rhoDataUrlBytes(out);
      // Terima hasil hanya bila menyusut minimal 5%.
      if(out && out.indexOf('data:image')===0 && after>0 && after < before*0.95){ resolve(out); }
      else resolve(dataUrl);
    });
  });
}
function rhoSetFoto(i,r,url){
  const st=rhoState; if(!st.refs[i]||!st.refs[i][r]) return;
  st.refs[i][r].foto=url; rhoSaveState();
  const cell=document.getElementById('rho-foto-'+i+'-'+r);
  if(cell){ cell.classList.add('has-img'); cell.innerHTML=rhoFotoInnerImg(url,i,r); }
  toast('Foto produk ditempel','ok');
}
function rhoClearFoto(e,i,r){
  if(e){ e.stopPropagation(); e.preventDefault(); }
  const st=rhoState; if(st.refs[i]&&st.refs[i][r]){ st.refs[i][r].foto=''; st.refs[i][r].fotoPath=''; rhoSaveState(); }
  const cell=document.getElementById('rho-foto-'+i+'-'+r);
  if(cell){ cell.classList.remove('has-img'); cell.innerHTML=rhoFotoInnerEmpty(); }
}
/* Listener tempel global: hanya aktif saat form RHO langkah 2 & sebuah sel foto sedang fokus */
function rhoGlobalPaste(e){
  const view=document.getElementById('view-form-rho');
  if(!view || !view.classList.contains('active') || rhoStep!==2) return;
  const cell=(document.activeElement && document.activeElement.closest) ? document.activeElement.closest('.rho-foto-cell') : null;
  if(!cell) return;
  const dt=e.clipboardData || window.clipboardData; if(!dt) return;
  let file=null;
  if(dt.items){ for(let k=0;k<dt.items.length;k++){ const it=dt.items[k]; if(it.kind==='file' && it.type && it.type.indexOf('image')===0){ file=it.getAsFile(); break; } } }
  if(!file && dt.files && dt.files.length){ for(let k=0;k<dt.files.length;k++){ const f=dt.files[k]; if(f.type && f.type.indexOf('image')===0){ file=f; break; } } }
  if(!file){ toast('Clipboard tidak berisi gambar. Salin gambar / print screen, lalu tempel lagi.','warn'); return; }
  e.preventDefault();
  const i=+cell.dataset.i, r=+cell.dataset.r;
  const reader=new FileReader();
  reader.onload=function(){ rhoNormalizeImage(reader.result, function(url){ rhoSetFoto(i,r,url); }); };
  reader.readAsDataURL(file);
}
document.addEventListener('paste', rhoGlobalPaste);

/* ---------- Render form ---------- */
function renderRhoForm(){
  rhoMarkActive();
  rhoEnsureRefs();
  const tt=document.getElementById('rho-title'); if(tt) tt.textContent='Referensi Harga Online'+(rhoEditId?' — Ubah Data':' — Input Data');
  const sub=document.getElementById('rho-sub');
  const cont=document.getElementById('rho-content'); if(!cont) return;
  const st=rhoState;
  // Sama seperti HPS/Analisa: field Data Pekerjaan bersumber dari "Pilih Data
  // Pekerjaan". Saat Ubah Data (rhoEditId aktif) selalu ditampilkan penuh walau
  // record lama belum tertaut dpId. rev1/rev2 = animasi reveal sekali setelah pilih.
  const showBody = true;
  const rev1 = (rhoRevealPick && showBody) ? ' dp-reveal dp-reveal-d1' : '';
  const rev2 = (rhoRevealPick && showBody) ? ' dp-reveal dp-reveal-d2' : '';
  let html=rhoStepperHtml();
  if(rhoStep===1){
    if(sub) sub.textContent='Langkah 1 dari 2 — Lengkapi data pekerjaan & daftar barang/jasa';
    html+='<div class="form-card"><div class="form-section-title">'+KR_SECTION_ICON+'Data Pekerjaan'+dpPickBtnHtml('rho')+'</div>';
    if(showBody){
      html+='<div class="form-flow'+rev1+'" style="--cols:4">';
      html+=RHO_INFO_FIELDS.map(rhoInfoInputHtml).join('');
      html+=rhoCountFieldsHtml();
      html+='</div>';
    }
    html+='</div>';
    if(showBody){
      html+='<div class="form-card"><div class="form-section-title">'+FKL_SEC_ICON+'Nama Referensi <span class="fkl-count-chip">'+st.jumlahRef+' referensi</span></div>'+
        '<div class="rho-hint">Isi nama tiap sumber referensi (mis. Shopee, Tokopedia, e-Katalog). Nama ini menjadi judul kolom pada tabel Pengisian Referensi &amp; dokumen PDF. Jumlah kotak mengikuti <b>Jumlah Referensi</b>.</div>'+
        rhoSumberListHtml()+'</div>';
    }
    if(showBody){
      html+='<div class="form-card'+rev2+'"><div class="form-section-title">'+FKL_SEC_ICON+'Nama Barang/Material <span class="fkl-count-chip">'+st.items.length+' item</span></div>'+
        '<div class="rho-hint">Isi nama tiap barang/material. Jumlah baris mengikuti pilihan <b>Jumlah Barang/Material</b>. Klik ikon <b>hapus</b> di kanan baris untuk menghapus item — jumlah akan menyesuaikan otomatis.</div>'+
        rhoItemListHtml()+'</div>';
    }
    html+=rhoActionsHtml({back:false});
  } else {
    if(sub) sub.textContent='Langkah 2 dari 2 — Isi referensi harga tiap barang/jasa';
    html+=rhoPanelHtml();
    html+=rhoActionsHtml({back:true, save:true});
  }
  cont.innerHTML=html;
  rhoRevealPick=false;   // animasi reveal hanya dijalankan sekali
  if(rhoStep===1){
    RHO_INFO_FIELDS.forEach(f=>{ const el=document.getElementById('rho-'+f.key); if(!el) return; const v=st.info[f.key]; el.value=(f.type==='num')?rupiahInputText(v):(v!=null?v:''); });
  }
}
function rhoActionsHtml(o){
  o=o||{};
  // Batal (merah) berdampingan dengan tombol navigasi di pojok kanan
  let right='<button class="btn btn-red" onclick="rhoBatal()">'+FKL_IC_X+'Batal</button>';
  if(o.back) right+='<button class="btn btn-light" onclick="rhoBack()">'+FKL_IC_BACK+'Kembali</button>';
  if(o.save) right+='<button class="btn btn-green" onclick="rhoSimpan()">'+FKL_IC_SAVE+'Simpan &amp; Lihat PDF</button>';
  else right+='<button class="btn btn-teal" onclick="rhoNext()">Selanjutnya'+FKL_IC_NEXT+'</button>';
  return '<div class="fkl-actions"><div class="fkl-actions-right">'+right+'</div></div>';
}

/* ---------- Navigasi ---------- */
function rhoNext(){
  const st=rhoState;
  if(rhoStep===1){
    rhoOnInfoChange();
    if(!String(st.info.nama||'').trim()){ toast('Nama Pekerjaan wajib diisi','warn'); return; }
    rhoEnsureRefs(); rhoStep=2;
  }
  renderRhoForm(); rhoScrollTop();
}
function rhoBack(){ if(rhoStep>1){ rhoStep--; renderRhoForm(); rhoScrollTop(); } }
function rhoScrollTop(){ const v=document.getElementById('view-form-rho'); if(v) v.scrollIntoView({behavior:'smooth',block:'start'}); }
function rhoBatal(){
  openConfirm({ icon:'del', title:'Batalkan Proses',
    text:'Batalkan proses ini? Data yang belum disimpan akan hilang.',
    onYes:()=>{ rhoEditId=null; rhoState=rhoBlankState(); rhoSaveState(); rhoStep=1; openRhoView(); toast('Proses dibatalkan','ok'); }
  });
}

/* ---------- Simpan ---------- */
async function rhoSimpan(){
  if(!requireInput()) return;
  const st=rhoState; const info=st.info||{}; const nama=String(info.nama||'').trim();
  if(!nama){ toast('Nama Pekerjaan wajib diisi','warn'); rhoStep=1; renderRhoForm(); return; }
  rhoEnsureRefs();
  // ---- Unggah foto ke Storage: ganti data-URL (base64) menjadi URL ringan ----
  // Membuat baris DB kecil sehingga Simpan & Muat jauh lebih cepat. Bila Supabase
  // belum siap / bucket belum ada / upload gagal → base64 dipertahankan (cadangan).
  if(rhoSupaReady()){
    if(!st.info.fotoKey) st.info.fotoKey=rhoUid();
    const key=st.info.fotoKey;
    const jobs=[];
    Object.keys(st.refs).forEach(k=>{ (st.refs[k]||[]).forEach((c,r)=>{ if(c&&rhoIsDataUrl(c.foto)) jobs.push({i:+k, r:r, c:c}); }); });
    if(jobs.length){
      let done=0, failed=0;
      showLoader('Menyiapkan unggah foto…');
      for(const job of jobs){
        done++; showLoader('Mengunggah foto '+done+' / '+jobs.length+'…');
        const path=key+'/r'+job.r+'_i'+job.i+'.jpg';
        try{
          const res=await StoreRhoFoto.uploadDataUrl(job.c.foto, path);
          job.c.foto=res.url+'?v='+Date.now();   // cache-bust saat foto ditimpa
          job.c.fotoPath=path;
        }catch(err){ console.error('Upload foto gagal',path,err); failed++; /* biarkan base64 sebagai cadangan */ }
        await new Promise(r=>setTimeout(r,0));
      }
      hideLoader();
      if(failed>0) toast(failed+' foto gagal diunggah — disimpan sebagai gambar tertanam (cadangan). Pastikan bucket "'+RHO_BUCKET+'" ada & publik.','warn');
    }
  }
  const rec={
    nama_pekerjaan: nama,
    lokasi: info.lokasi||'',
    metode: info.metode||'',
    jumlah_item: st.items.length,
    jumlah_referensi: st.jumlahRef,
    tgl_input: (new Date()).toISOString().slice(0,10),
    state: JSON.parse(JSON.stringify(st))
  };
  let saved=null;
  try{
    await withActionLoader(rhoEditId?'Menyimpan perubahan':'Menyimpan', async()=>{
      if(rhoEditId){ await StoreRho.update(rhoEditId, rec); }
      else { saved=await StoreRho.create(rec); }
      await refreshDataRho();
    });
  }catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'err'); return; }
  toast(rhoEditId?'Data berhasil diperbarui':'Data berhasil disimpan','ok');
  const savedId = rhoEditId || (saved && saved.id);
  rhoEditId=null; rhoState=rhoBlankState(); rhoSaveState(); rhoStep=1;
  showView('rho-view');
  // Tampilkan pratinjau PDF dokumen yang baru disimpan
  setTimeout(()=>{ if(savedId!=null) rhoPreviewRecord(savedId); }, 420);
}

/* ---------- Kompres foto yang sudah tersimpan ----------
   Menjelajah semua record RHO, mengompres ulang setiap foto (data URL) yang masih
   berukuran besar, lalu menyimpan kembali ke Supabase. Aman dijalankan berulang:
   foto yang sudah ringan otomatis dilewati. */
function rhoFmtKB(bytes){ return (bytes/1024).toFixed(0)+' KB'; }
async function rhoKompresFotoTersimpan(){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  const recs=(records_rho||[]).slice();
  let totalFoto=0;
  recs.forEach(rec=>{
    const s=rec&&rec.state;
    if(s&&s.refs&&typeof s.refs==='object'){
      Object.keys(s.refs).forEach(k=>{ (s.refs[k]||[]).forEach(c=>{ if(c&&typeof c.foto==='string'&&c.foto.indexOf('data:image')===0) totalFoto++; }); });
    }
  });
  if(!totalFoto){ toast('Tidak ada foto tersimpan untuk dikompres','warn'); return; }
  openConfirm({
    icon:'save',
    title:'Kompres Foto Tersimpan',
    text:'Ditemukan '+totalFoto+' foto pada data tersimpan. Foto akan dikompres agar lebih ringan lalu disimpan ulang. Lanjutkan?',
    onYes:async()=>{
      let done=0, changedRecords=0, bytesBefore=0, bytesAfter=0;
      showLoader('Menyiapkan kompresi foto…');
      try{
        for(const rec of recs){
          const s=rec&&rec.state;
          if(!s||!s.refs||typeof s.refs!=='object') continue;
          let recChanged=false;
          for(const k of Object.keys(s.refs)){
            const arr=s.refs[k]; if(!Array.isArray(arr)) continue;
            for(const c of arr){
              if(!c||typeof c.foto!=='string'||c.foto.indexOf('data:image')!==0) continue;
              const before=rhoDataUrlBytes(c.foto);
              showLoader('Mengompres foto '+(done+1)+' / '+totalFoto+'…');
              const out=await rhoRecompressStored(c.foto);
              const after=rhoDataUrlBytes(out);
              bytesBefore+=before; bytesAfter+=after;
              if(out!==c.foto){ c.foto=out; recChanged=true; }
              done++;
              // Beri jeda kecil agar UI/loader sempat ter-update.
              await new Promise(r=>setTimeout(r,0));
            }
          }
          if(recChanged){
            showLoader('Menyimpan data '+rec.nama_pekerjaan+'…');
            try{ await StoreRho.update(rec.id, { state: JSON.parse(JSON.stringify(s)) }); changedRecords++; }
            catch(err){ console.error('Gagal simpan record',rec.id,err); }
          }
        }
        await refreshDataRho();
        renderRhoView();
      }catch(err){ console.error(err); hideLoader(); toast('Terjadi kesalahan saat kompresi: '+errMsg(err),'err'); return; }
      hideLoader();
      const saved=Math.max(0,bytesBefore-bytesAfter);
      if(changedRecords>0){
        toast('Selesai. '+done+' foto diperiksa, '+changedRecords+' data diperbarui. Hemat '+rhoFmtKB(saved)+' (dari '+rhoFmtKB(bytesBefore)+' menjadi '+rhoFmtKB(bytesAfter)+').','ok');
      }else{
        toast('Selesai. '+done+' foto diperiksa — semuanya sudah ringan, tidak ada yang perlu dikompres.','ok');
      }
    }
  });
}

/* ---------- Migrasi foto lama (base64) ke Supabase Storage ----------
   Menjelajah semua record RHO, mengunggah setiap foto yang masih data-URL (base64)
   ke bucket Storage, lalu mengganti nilai foto pada state menjadi URL ringan &
   menyimpannya kembali. Membuat baris DB jauh lebih kecil sehingga Simpan/Muat cepat.
   Aman diulang: foto yang sudah berupa URL otomatis dilewati. Bila sebuah upload
   gagal, base64-nya dipertahankan (tidak ada data yang hilang). */
async function rhoMigrasiFotoStorage(){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  if(!rhoSupaReady()){ toast('Koneksi Supabase tidak tersedia','warn'); return; }
  const recs=(records_rho||[]).slice();
  let totalFoto=0;
  recs.forEach(rec=>{
    const s=rec&&rec.state;
    if(s&&s.refs&&typeof s.refs==='object'){
      Object.keys(s.refs).forEach(k=>{ (s.refs[k]||[]).forEach(c=>{ if(c&&rhoIsDataUrl(c.foto)) totalFoto++; }); });
    }
  });
  if(!totalFoto){ toast('Tidak ada foto tertanam (base64). Semua foto sudah di Storage.','ok'); return; }
  openConfirm({
    icon:'save',
    title:'Migrasi Foto ke Storage',
    text:'Ditemukan '+totalFoto+' foto yang masih tertanam di data (base64). Foto akan diunggah ke Storage ("'+RHO_BUCKET+'") lalu data dibuat ringan. Pastikan bucket sudah dibuat & publik. Lanjutkan?',
    onYes:async()=>{
      let done=0, changedRecords=0, failed=0, bytesBefore=0, bytesAfter=0;
      showLoader('Menyiapkan migrasi foto…');
      try{
        for(const rec of recs){
          const s=rec&&rec.state;
          if(!s||!s.refs||typeof s.refs!=='object') continue;
          if(!s.info||typeof s.info!=='object') s.info={};
          if(!s.info.fotoKey) s.info.fotoKey=rhoUid();
          const key=s.info.fotoKey;
          let recChanged=false;
          for(const k of Object.keys(s.refs)){
            const arr=s.refs[k]; if(!Array.isArray(arr)) continue;
            for(let r=0;r<arr.length;r++){
              const c=arr[r];
              if(!c||!rhoIsDataUrl(c.foto)) continue;
              done++; showLoader('Mengunggah foto '+done+' / '+totalFoto+'…');
              const before=rhoDataUrlBytes(c.foto); bytesBefore+=before;
              const path=key+'/r'+r+'_i'+k+'.jpg';
              try{
                const res=await StoreRhoFoto.uploadDataUrl(c.foto, path);
                c.foto=res.url+'?v='+Date.now(); c.fotoPath=path;
                bytesAfter+=String(res.url).length;
                recChanged=true;
              }catch(err){ console.error('Migrasi foto gagal',path,err); failed++; bytesAfter+=before; /* pertahankan base64 */ }
              await new Promise(res=>setTimeout(res,0));
            }
          }
          if(recChanged){
            showLoader('Menyimpan data '+(rec.nama_pekerjaan||'')+'…');
            try{ await StoreRho.update(rec.id, { state: JSON.parse(JSON.stringify(s)) }); changedRecords++; }
            catch(err){ console.error('Gagal simpan record',rec.id,err); failed++; }
          }
        }
        await refreshDataRho();
        renderRhoView();
      }catch(err){ console.error(err); hideLoader(); toast('Terjadi kesalahan saat migrasi: '+errMsg(err),'err'); return; }
      hideLoader();
      const saved=Math.max(0,bytesBefore-bytesAfter);
      if(changedRecords>0 && failed===0){
        toast('Selesai. '+done+' foto dipindah ke Storage, '+changedRecords+' data diringankan. Hemat ~'+rhoFmtKB(saved)+'.','ok');
      }else if(changedRecords>0 && failed>0){
        toast('Selesai sebagian. '+changedRecords+' data diringankan, '+failed+' foto gagal (tetap tertanam sebagai cadangan). Cek bucket "'+RHO_BUCKET+'".','warn');
      }else{
        toast('Tidak ada yang berhasil dipindah. Pastikan bucket "'+RHO_BUCKET+'" sudah dibuat & publik.','err');
      }
    }
  });
}

/* ================= LIHAT HARGA ================= */
let rhoViewPage=1;
const RHO_VIEW_PAGE_SIZE=8;
function rhoDateLong(s){ return pnwDateLong(s); }
function rhoViewRows(){
  let rows=(records_rho||[]).slice();
  const fs=(document.getElementById('rho-view-search')?.value||'').toLowerCase().trim();
  if(fs) rows=rows.filter(r=>String(r.nama_pekerjaan||(r.state&&r.state.info&&r.state.info.nama)||'').toLowerCase().includes(fs));
  return rows;
}
function rhoEmptyRow(){
  return '<tr><td colspan="8"><div class="empty">'+
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/></svg>'+
    '<div>Data tidak tersedia</div></div></td></tr>';
}
function renderRhoView(){
  const tb=document.getElementById('rho-view-body');
  const pg=document.getElementById('rho-view-pagination');
  const cEl=document.getElementById('rho-view-count');
  if(!tb) return;
  const rows=rhoViewRows();
  if(cEl) cEl.textContent=rows.length;
  if(!rows.length){ tb.innerHTML=rhoEmptyRow(); if(pg) pg.innerHTML=''; return; }
  const totalPages=Math.max(1,Math.ceil(rows.length/RHO_VIEW_PAGE_SIZE));
  if(rhoViewPage>totalPages) rhoViewPage=totalPages;
  if(rhoViewPage<1) rhoViewPage=1;
  const start=(rhoViewPage-1)*RHO_VIEW_PAGE_SIZE;
  const pageRows=rows.slice(start,start+RHO_VIEW_PAGE_SIZE);
  tb.innerHTML=pageRows.map((r,i)=>{
    const stt=r.state||{}; const info=stt.info||{};
    const nama=r.nama_pekerjaan||info.nama||'—';
    const lokasi=(r.lokasi||info.lokasi||'').trim();
    const metode=r.metode||info.metode||'';
    const ji=(r.jumlah_item!=null)?r.jumlah_item:((stt.items&&stt.items.length)||0);
    const jr=(r.jumlah_referensi!=null)?r.jumlah_referensi:(stt.jumlahRef||0);
    const tgl=r.tgl_input||'';
    const rid=fkEsc(String(r.id));
    return '<tr>'+
      '<td class="col-no">'+(start+i+1)+'</td>'+
      '<td class="wrap-cell col-nama-freeze">'+fkEsc(nama)+'</td>'+
      '<td class="fkl-col-lokasi">'+fkEsc(lokasi||'—')+'</td>'+
      '<td>'+fkEsc(metode||'—')+'</td>'+
      '<td style="text-align:center">'+ji+'</td>'+
      '<td style="text-align:center">'+jr+'</td>'+
      '<td class="col-date">'+fkEsc(tgl?rhoDateLong(tgl):'—')+'</td>'+
      '<td><div class="action-cell" style="justify-content:center">'+
        '<button class="act act-edit" title="Ubah" onclick="openRhoInput(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>'+
        '<button class="act act-view" title="Lihat" onclick="rhoPreviewRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>'+
        '<button class="act act-del" title="Hapus" onclick="rhoDeleteRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>'+
      '</div></td>'+
    '</tr>';
  }).join('');
  if(pg){
    if(totalPages<=1){ pg.innerHTML=''; }
    else{
      let h='<button class="pg-btn" '+(rhoViewPage<=1?'disabled':'')+' onclick="rhoViewGoto('+(rhoViewPage-1)+')">‹</button>';
      for(let p=1;p<=totalPages;p++) h+='<button class="pg-btn '+(p===rhoViewPage?'active':'')+'" onclick="rhoViewGoto('+p+')">'+p+'</button>';
      h+='<button class="pg-btn" '+(rhoViewPage>=totalPages?'disabled':'')+' onclick="rhoViewGoto('+(rhoViewPage+1)+')">›</button>';
      pg.innerHTML=h;
    }
  }
}
function rhoViewGoto(p){ rhoViewPage=p; renderRhoView(); }
function rhoPreviewRecord(id){
  const rec=(records_rho||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  rhoPreviewState=rhoRecordToState(rec);
  rhoOpenPreview();
}
function rhoDeleteRecord(id){
  if(!requireInput()) return;
  const rec=(records_rho||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  openConfirm({ icon:'del', title:'Hapus Data',
    text:'Hapus data referensi harga "'+(rec.nama_pekerjaan||(rec.state&&rec.state.info&&rec.state.info.nama)||'')+'"?',
    onYes:async()=>{
      const fotoKey=(rec&&rec.state&&rec.state.info&&rec.state.info.fotoKey)||null;
      try{ await withActionLoader('Menghapus', async()=>{ await StoreRho.remove(id); await refreshDataRho(); }); }
      catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'err'); return; }
      if(fotoKey) StoreRhoFoto.removeFolder(fotoKey);   // bersihkan objek foto (best-effort)
      toast('Data dihapus','ok'); renderRhoView();
    }
  });
}

/* ================= DOKUMEN PDF ================= */
function rhoBuildDocHtml(){
  const st=rhoActiveState(); const info=st.info||{};
  const fmtNilai=(info.nilai!==''&&info.nilai!=null)?('Rp '+Number(info.nilai).toLocaleString('id-ID')):'-';
  const infoRow=(k,v)=>'<tr><td class="k">'+k+'</td><td class="s">:</td><td class="v" style="text-align:justify">'+fkEsc(v||'-')+'</td></tr>';
  const K=Math.max(1,Math.min(10, parseInt(st.jumlahRef,10)||1));

  const itemBlocks=(st.items||[]).map((nm,i)=>{
    const name=(nm&&nm.trim())?nm:('Barang/Material '+(i+1));
    const cells=(st.refs && st.refs[i])?st.refs[i]:[];
    let th='<tr><th class="lbl">Uraian</th>';
    for(let r=0;r<K;r++) th+='<th>'+fkEsc(rhoRefLabel(r))+'</th>';
    th+='</tr>';
    let rowFoto='<tr><td class="lbl">Foto Produk</td>';
    for(let r=0;r<K;r++){ const f=cells[r]?cells[r].foto:''; rowFoto+='<td class="foto">'+(f?'<img class="rho-pdf-foto" src="'+f+'">':'<span class="rho-pdf-foto-empty">–</span>')+'</td>'; }
    rowFoto+='</tr>';
    let rowLink='<tr><td class="lbl">Link Produk</td>';
    for(let r=0;r<K;r++){ const v=cells[r]?(cells[r].link||''):''; rowLink+='<td class="lnk">'+(v?('<a href="'+fkEsc(v)+'">'+fkEsc(v)+'</a>'):'-')+'</td>'; }
    rowLink+='</tr>';
    const money=(key,label)=>{ let h='<tr><td class="lbl">'+label+'</td>'; for(let r=0;r<K;r++){ const v=cells[r]?cells[r][key]:''; h+='<td class="num">'+rhoRp(v)+'</td>'; } return h+'</tr>'; };
    let rowBerat='<tr><td class="lbl">Berat Barang (kg)</td>';
    for(let r=0;r<K;r++){ const v=cells[r]?cells[r].berat:''; const n=rhoNum(v); rowBerat+='<td class="num">'+(n>0?(fkEsc(String(v))+' kg'):'-')+'</td>'; }
    rowBerat+='</tr>';
    let rowEst='<tr class="auto"><td class="lbl">Estimasi Ongkir</td>';
    for(let r=0;r<K;r++) rowEst+='<td class="num">'+rhoRp(rhoCalcEst(i,r))+'</td>';
    rowEst+='</tr>';
    let rowTot='<tr class="auto tot"><td class="lbl">Harga Total</td>';
    for(let r=0;r<K;r++) rowTot+='<td class="num">'+rhoRp(rhoCalcTot(i,r))+'</td>';
    rowTot+='</tr>';
    return '<div class="rho-doc-item"><div class="rho-doc-item-h"><span class="rn">'+(i+1)+'</span>'+fkEsc(name)+'</div>'+
      '<table class="rho-doc-tbl"><thead>'+th+'</thead><tbody>'+rowFoto+rowLink+money('harga','Harga Satuan')+rowBerat+money('ongkir','Ongkos Kirim (1 kg)')+rowEst+rowTot+'</tbody></table></div>';
  }).join('');

  return ''+
  '<div class="fkl-doc pnw-doc rho-doc">'+
    '<div class="fkl-doc-head">'+
      '<div class="fkl-doc-logo"><img src="'+FKL_LOGO_SRC+'" alt="Logo PLN"></div>'+
      '<div class="fkl-doc-org">'+
        '<div class="l1">PT PLN (PERSERO)</div>'+
        '<div class="l2">UNIT PELAKSANA PELAYANAN PELANGGAN MASOHI</div>'+
        '<div class="l3">Jl. Abdullah Soulissa No 1, Masohi, Kec. Kota Masohi</div>'+
      '</div>'+
    '</div>'+
    '<div class="fkl-doc-band"></div>'+
    '<h1 class="fkl-doc-title">REFERENSI HARGA ONLINE</h1>'+
    '<div class="fkl-doc-titlegap"></div>'+
    '<div class="fkl-sec-h"><span class="rn">A</span>Data Pekerjaan</div>'+
    '<table class="fkl-info"><tbody>'+
      infoRow('Nama Pekerjaan', info.nama)+
      infoRow('Lokasi Pekerjaan', info.lokasi)+
      infoRow('Rencana Anggaran Biaya', fmtNilai)+
      infoRow('No. Anggaran', info.no_anggaran)+
      infoRow('Tgl. Anggaran', info.tgl_anggaran?pnwDateLong(info.tgl_anggaran):'-')+
      infoRow('Jenis Anggaran', info.jenis_anggaran)+
      infoRow('Metode Pengadaan', info.metode)+
    '</tbody></table>'+
    '<div class="fkl-sec-h"><span class="rn">B</span>Referensi Harga</div>'+
    itemBlocks+
  '</div>';
}
function rhoExtraDocCss(){
  return ''+
  '.rho-doc-item{margin:10px 0 16px;break-inside:avoid;page-break-inside:avoid;-webkit-column-break-inside:avoid}'+
  '.rho-doc-item-h{break-after:avoid;page-break-after:avoid}'+
  'table.rho-doc-tbl{break-inside:avoid;page-break-inside:avoid}'+
  '.rho-doc-item-h{display:flex;align-items:center;gap:8px;font-family:"Plus Jakarta Sans",sans-serif;font-weight:800;font-size:12px;color:#0b3d42;background:#e3f2f3;border:1px solid #bfe0e2;border-radius:6px;padding:6px 10px;margin-bottom:6px;text-transform:uppercase}'+
  '.rho-doc-item-h .rn{flex:0 0 auto;color:#0b3d42;font-family:"Plus Jakarta Sans",sans-serif;font-weight:800;font-size:12px;line-height:1;background:none;border:0;padding:0;margin:0}'+
  '.rho-doc,.rho-doc *{-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  'table.rho-doc-tbl{width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:4px;border:1px solid #0b6a73}'+
  'table.rho-doc-tbl th,table.rho-doc-tbl td{border:1px solid #cfe0e3;padding:5px 7px;font-size:10px;vertical-align:middle;word-wrap:break-word;overflow-wrap:anywhere}'+
  'table.rho-doc-tbl thead th{background:#0E7C86;color:#fff;font-weight:800;text-transform:uppercase;letter-spacing:.2px;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  'table.rho-doc-tbl thead th.lbl,table.rho-doc-tbl td.lbl{width:118px}'+
  'table.rho-doc-tbl td.lbl{text-align:left}'+
  'table.rho-doc-tbl thead th.lbl{text-align:center}'+
  'table.rho-doc-tbl td.lbl{background:#f1f6f7;color:#0b3d42;font-weight:700}'+
  'table.rho-doc-tbl thead th.lbl{background:#0b6a73;color:#fff}'+
  'table.rho-doc-tbl td.num{text-align:right;font-weight:700;white-space:nowrap}'+
  'table.rho-doc-tbl td.foto{text-align:center;padding:3px}'+
  'table.rho-doc-tbl td.lnk{font-size:8.5px;word-break:break-all}'+
  'table.rho-doc-tbl td.lnk a{color:#0b6a73;text-decoration:none}'+
  'table.rho-doc-tbl tr.auto td{background:#fbfdf4}'+
  'table.rho-doc-tbl tr.tot td{background:#eef8f1;color:#0d7a3f;font-weight:800}'+
  '.rho-pdf-foto{width:100%;max-width:150px;height:92px;object-fit:contain;object-position:center;background:#fff;display:block;margin:0 auto}'+
  '.rho-pdf-foto-empty{color:#9aabb0;font-style:italic;font-size:9px}';
}
function rhoStandaloneDocHtml(){
  return fklDocShell(rhoExtraDocCss(), rhoBuildDocHtml());
}
function rhoOpenPreview(){
  const ov=document.getElementById('pn-preview-overlay'); if(!ov) return;
  const _mdl=ov.querySelector('.pn-preview-modal'); if(_mdl) _mdl.classList.remove('is-max');
  if(typeof pnPreviewResetMaxBtn==='function') pnPreviewResetMaxBtn();
  const titleEl=document.getElementById('pn-preview-title');
  if(titleEl) titleEl.textContent='Pratinjau — Referensi Harga Online';
  const body=document.getElementById('pn-preview-body');
  if(body){
    body.classList.add('fkl-preview-body');
    body.innerHTML='<iframe id="rho-preview-frame" title="Pratinjau Dokumen"></iframe>';
    const ifr=document.getElementById('rho-preview-frame');
    const doc=ifr.contentWindow.document; doc.open(); doc.write(rhoStandaloneDocHtml()); doc.close();
  }
  const actions=document.querySelector('#pn-preview-overlay .pn-preview-head-actions');
  { const _c=document.getElementById('hpsc-preview-print'); if(_c) _c.remove(); }
  const oldFkl=document.getElementById('fkl-preview-print'); if(oldFkl) oldFkl.remove();
  const oldPnw=document.getElementById('pnw-preview-print'); if(oldPnw) oldPnw.remove();
  if(actions && !document.getElementById('rho-preview-print')){
    const btn=document.createElement('button');
    btn.id='rho-preview-print'; btn.className='btn btn-teal';
    btn.style.padding='8px 14px'; btn.style.fontSize='11px';
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>Cetak / PDF';
    btn.onclick=rhoPrint;
    actions.insertBefore(btn, actions.firstChild);
  }
  ov.classList.add('show');
}
function rhoPrint(){
  const old=document.getElementById('rho-print-frame'); if(old) old.remove();
  const ifr=document.createElement('iframe');
  ifr.id='rho-print-frame'; ifr.setAttribute('aria-hidden','true');
  ifr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(ifr);
  const doc=ifr.contentWindow.document; doc.open(); doc.write(rhoStandaloneDocHtml()); doc.close();
  const go=()=>fklWaitPaged(ifr, _go);
  const _go=()=>{ withHiddenPageTitle(()=>{ try{ ifr.contentWindow.focus(); ifr.contentWindow.print(); }catch(e){ try{ window.print(); }catch(_){} } }); setTimeout(()=>{ const f=document.getElementById('rho-print-frame'); if(f) f.remove(); },1500); };
  const imgs=doc.images?Array.from(doc.images):[];
  if(imgs.length){ let n=imgs.length; const dec=()=>{ if(--n<=0) setTimeout(go,60); }; imgs.forEach(im=>{ if(im.complete) dec(); else { im.onload=dec; im.onerror=dec; } }); setTimeout(go,1600); }
  else setTimeout(go,120);
}

/* ##################### AKHIR MODUL REFERENSI HARGA ONLINE #################### */


/* ####################################################################### */
/* ################# MODUL DATA PEKERJAAN (MASTER TERPUSAT) ############### */
/* Data Pekerjaan (Nama, Lokasi, Nilai, No. Anggaran, Tgl. Anggaran, Metode
   Pengadaan) kini diisi & disimpan SEKALI di sini, lalu dipakai bersama oleh
   Perhitungan HPS maupun Analisa Harga Satuan lewat "Pilih Data Pekerjaan"
   (nilai disalin/snapshot ke masing-masing dokumen saat dipilih, sehingga
   dokumen yang sudah tersimpan tidak berubah walau Data Pekerjaan induknya
   diubah/dihapus di kemudian hari). */
/* ####################################################################### */

const DP_INFO_FIELDS = [
  {key:'nama',         label:'Nama Pekerjaan',            type:'text', span:2},
  {key:'lokasi',       label:'Lokasi Pekerjaan',          type:'text', span:2},
  {key:'nilai',        label:'Rencana Anggaran Biaya', type:'num'},
  {key:'no_anggaran',  label:'No. Anggaran',              type:'text'},
  {key:'tgl_anggaran', label:'Tgl. Anggaran',             type:'date'},
  {key:'jenis_anggaran',label:'Jenis Anggaran',           type:'select', options:['Operasi','Investasi']},
  {key:'metode',       label:'Metode Pengadaan',          type:'select', options:PNW_METODE},
  /* Bidang Pelaksana — opsi sama persis dengan Monitoring (BIDANG_OPTS) */
  {key:'bidang_pelaksana', label:'Bidang Pelaksana',      type:'select', span:2, options:BIDANG_OPTS},
  {key:'pengguna',     label:'Nama Pengguna (Manager)',            type:'text', span:2},
  {key:'pejabat',      label:'Nama Pejabat Pelaksana Pengadaan',   type:'text', span:2}
];
/* Kunci field yang dipakai bersama oleh HPS & Analisa (sumbernya dari Data Pekerjaan) */
const DP_SHARED_KEYS = DP_INFO_FIELDS.map(f=>f.key);
const DP_LOCK_BADGE='<span class="lock-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Dari Data Pekerjaan</span>';

function dpBlankState(){ return { info:{} }; }
let dpState = dpBlankState();
let dpEditId = null;

const DP_TABLE='data_pekerjaan';
const DP_LS_KEY='dp_records_v1';
let records_dp=[];
let dpUseLocal=false;
function dpSupaReady(){ return !!(USE_SUPABASE && db); }
function dpLocalLoad(){ try{ const r=localStorage.getItem(DP_LS_KEY); records_dp=r?JSON.parse(r):[]; }catch(e){ records_dp=[]; } }
function dpLocalSave(){ /* dinonaktifkan: data hanya di Supabase */ }
function dpIsLocalId(id){ return String(id).indexOf('loc_')===0; }
const StoreDp={
  async list(){
    if(!dpSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(DP_TABLE).select('*').order('created_at',{ascending:false});
    if(error) throw error; return data||[];
  },
  async create(rec){
    if(!dpSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(DP_TABLE).insert(rec).select();
    if(error) throw error; return data&&data[0];
  },
  async update(rid, rec){
    if(!dpSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(DP_TABLE).update(rec).eq('id',rid);
    if(error) throw error;
  },
  async remove(rid){
    if(!dpSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(DP_TABLE).delete().eq('id',rid);
    if(error) throw error;
  }
};
async function refreshDataDp(){
  try{ records_dp=await StoreDp.list(); }
  catch(err){ console.error(err); records_dp=records_dp||[]; }
}
function dpRecordToState(rec){
  const s=(rec&&rec.state&&typeof rec.state==='object')?rec.state:{};
  const info={};
  DP_SHARED_KEYS.forEach(k=>{ info[k]=(s.info&&s.info[k]!=null)?s.info[k]:(rec[k]!=null?rec[k]:''); });
  return { info };
}
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
/* Lebar SATU kolom harga (persen) menurut panjang angka terpanjang yang akan
   dicetak di sana. Bidang cetak dokumen = 180mm (~680px), font 8,7px sehingga
   satu digit ~5,2px, ditambah padding+garis sel ~12px. Dibatasi 9%-14%: 11%
   yang dulu dipatok mati membuat nominal miliaran (nowrap) meluber sehingga
   tabel jadi lebih lebar dari kertas. */
function jsHpsHargaPct(len){
  const px = Math.round(Number(len||0)*5.2) + 12;
  return Math.max(9, Math.min(14, Math.round(px/680*1000)/10));
}
function jsHpsColPct(items,cfg,hargaPct){
  const L=jsSatVolLen(items);
  const no =jsKolPct(jsNoLen(items,cfg));
  const sat=jsKolPct(L.satLen);
  const vol=jsKolPct(L.volLen);
  const hg =(hargaPct!=null&&!isNaN(hargaPct)) ? Number(hargaPct) : 11;   // satu kolom harga
  const ur =Math.max(14, Math.round((100 - no - sat - vol - hg*5)*10)/10); // lima kolom harga
  return {no, ur, sat, vol, hg};
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
/* ===== SAKELAR (SWITCH) YA / TIDAK =====
   Menggantikan dropdown "Ya/Tidak". Sakelar ditempatkan di sebelah KANAN judul
   field: posisi ON berarti "Ya", posisi OFF berarti "Tidak".
   Elemen yang dipakai adalah <button>, yang secara bawaan sudah memiliki
   properti .value — sehingga SELURUH handler lama yang membaca el.value
   (mis. hpsOnJudulOn, anaOnRokOn, ...) tetap bekerja tanpa perubahan. */
function jsSwitchHtml(id,val,handler,extra){
  var on=jsOn(val);
  return '<button type="button" class="js-switch'+(on?' is-on':'')+'"'+
    (id?(' id="'+id+'"'):'')+' value="'+(on?'Ya':'Tidak')+'" role="switch"'+
    ' aria-checked="'+(on?'true':'false')+'" aria-label="Ya / Tidak"'+
    ' title="'+(on?'Ya (aktif) — klik untuk mematikan':'Tidak (nonaktif) — klik untuk mengaktifkan')+'"'+
    (extra?(' '+extra):'')+
    ' onclick="jsSwitchToggle(this,\''+handler+'\')"><span class="sw-knob"></span></button>';
}
/* Selaraskan tampilan sakelar dengan nilainya (dipakai setelah handler jalan,
   karena sebagian handler membatalkan perubahan dengan menulis ulang el.value) */
function jsSwitchSync(el){
  if(!el) return;
  var on=(el.value==='Ya');
  el.classList.toggle('is-on',on);
  el.setAttribute('aria-checked',on?'true':'false');
  el.setAttribute('title',on?'Ya (aktif) \u2014 klik untuk mematikan':'Tidak (nonaktif) \u2014 klik untuk mengaktifkan');
}
function jsSwitchToggle(el,handler){
  if(!el) return;
  el.value=(el.value==='Ya')?'Tidak':'Ya';
  jsSwitchSync(el);
  try{ var fn=window[handler]; if(typeof fn==='function') fn(el); }catch(e){ console.error(e); }
  jsSwitchSync(el);
}
/* Judul field + sakelar di sebelah kanannya */
function jsLabelSwitchHtml(lbl,id,val,handler,extra){
  return '<div class="lbl-switch"><label>'+lbl+'</label>'+
    jsSwitchHtml(id,val,handler,extra)+'</div>';
}
/* Kotak nilai pengganti dropdown (dipakai bila tidak ada kontrol pendamping) */
function jsSwitchStateHtml(val){
  var on=jsOn(val);
  return '<div class="sw-state'+(on?' is-on':'')+'">'+(on?'Ya':'Tidak')+'</div>';
}
/* Kompatibilitas nama lama — kini mengembalikan sakelar, bukan dropdown */
function jsYaTidakHtml(id,val,handler){ return jsSwitchHtml(id,val,handler); }

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
  const dis=locked?'data-locked="1"':'';
  /* Ya/Tidak kini berupa SAKELAR di sebelah kanan judul field. */
  const f=(lbl,idOn,vOn,hOn,idN,vN,hN)=>
    '<div class="field js-judul-field'+(locked?' is-locked':'')+'">'+
      jsLabelSwitchHtml(lbl,idOn,vOn,hOn,dis)+
      '<div class="js-judul-row">'+
        (jsOn(vOn)?jsNumSelectHtml(idN,vN,hN):jsSwitchStateHtml(vOn))+'</div>'+
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

  /* Angka terpanjang di kolom harga = Jumlah Total (nilai terbesar di tabel).
     Lebar kolom harga dihitung dari situ, bukan dipatok 11%. */
  const _hgLen=String(hpsRpDoc(s.totT)||'').length;
  const _cw=jsHpsColPct(st.items, cfg, jsHpsHargaPct(_hgLen));
  const tbl=
    '<table class="hps-doc-tbl">'+
      // Lebar Sat & Vol mengikuti data terpanjang; sisanya jadi milik kolom Uraian.
      '<colgroup><col style="width:'+_cw.no+'%"><col style="width:'+_cw.ur+'%"><col style="width:'+_cw.sat+'%"><col style="width:'+_cw.vol+'%">'+
        '<col style="width:'+_cw.hg+'%"><col style="width:'+_cw.hg+'%"><col style="width:'+_cw.hg+'%">'+
        '<col style="width:'+_cw.hg+'%"><col style="width:'+_cw.hg+'%"></colgroup>'+
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
  /* Ya/Tidak kini berupa SAKELAR di sebelah kanan judul field. */
  return '<div class="field js-judul-field">'+
      '<div class="lbl-switch"><label id="ana-rok-label">ROK? (maks '+rokMax+'%)</label>'+
        jsSwitchHtml('ana-rokon',st.rokOn,'anaOnRokOn')+'</div>'+
      '<div class="js-judul-row">'+
        (rokOn?('<input class="js-numbox js-num2" id="ana-rok" type="text" inputmode="decimal" maxlength="5" placeholder="0" title="Maksimal '+rokMax+'% ('+(st.jenis==='Konstruksi'?'Pekerjaan Konstruksi':'Pekerjaan Umum')+')" value="'+fkEsc(rokVal)+'" oninput="anaOnRok(this)">'):jsSwitchStateHtml(st.rokOn))+
      '</div></div>'+
    '<div class="field js-judul-field">'+
      jsLabelSwitchHtml('Inflasi?','ana-inflasi',st.inflasi,'anaOnInflasi')+
      '<div class="js-judul-row">'+
        (infOn?('<input class="js-numbox js-num4" id="ana-inflasi-nilai" type="text" inputmode="decimal" maxlength="6" placeholder="0" title="Nilai inflasi (%)" value="'+fkEsc(infNilai)+'" oninput="anaOnInflasiNilai(this)">'):jsSwitchStateHtml(st.inflasi))+
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
  /* Ya/Tidak kini berupa SAKELAR di sebelah kanan judul field. */
  const f=(lbl,idOn,vOn,hOn,idN,vN,hN)=>
    '<div class="field js-judul-field">'+jsLabelSwitchHtml(lbl,idOn,vOn,hOn)+
      '<div class="js-judul-row">'+
        (jsOn(vOn)?jsNumSelectHtml(idN,vN,hN):jsSwitchStateHtml(vOn))+'</div></div>';
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
  /* JALUR UTAMA — BERBASIS DOM (perbaikan 21 Jul 2026).
     Jalur regex lama GAGAL DIAM-DIAM: setelah <script> dibuang masih tersisa
     tag <style> milik fklFitScript (skrip itu diawali <style>@media print...),
     sehingga regex pembungkus yang ter-anchor ke <\/table>$ tak pernah cocok.
     Akibatnya fragmen tetap membawa .fkl-page-wrap + .fkl-print-page sendiri,
     hpscModulePage membungkus SEKALI LAGI, dan paginator memecah struktur
     ganda: .fkl-print-page 210mm terjebak di bidang lembar 180mm -> isi
     terpotong kanan + lembar putih kosong (Rekap HPS "hancur").
     <template> aman: skrip di dalamnya tidak pernah tereksekusi. */
  try{
    const tpl=document.createElement('template');
    tpl.innerHTML=frag;
    tpl.content.querySelectorAll('script,style,link').forEach(n=>n.remove());
    const pp=tpl.content.querySelector('.fkl-print-page');
    if(pp) return pp.innerHTML.trim();
    /* Tak ada .fkl-print-page: kembalikan isi bersih (tanpa script/style/link) */
    const dv=document.createElement('div');
    dv.appendChild(tpl.content.cloneNode(true));
    if(dv.innerHTML.trim()) return dv.innerHTML.trim();
  }catch(e){ console.warn('hpscExtractDocFrag DOM path gagal, pakai regex cadangan', e); }
  /* CADANGAN — regex lama, kini juga membuang <style> & <link> */
  frag = frag.replace(/<script[\s\S]*?<\/script>/gi, '')
             .replace(/<style[\s\S]*?<\/style>/gi, '')
             .replace(/<link[^>]*>/gi, '').trim();
  const mw = frag.match(/^<table class="fkl-page-wrap"[^>]*>[\s\S]*?<tbody>\s*<tr>\s*<td>([\s\S]*)<\/td>\s*<\/tr>\s*<\/tbody>[\s\S]*<\/table>$/i);
  if(mw) frag = mw[1].trim();
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
  /* Halaman modul dikunci selebar A4 & dipusatkan, PERSIS seperti halaman sampul
     .hpsc-page (210mm; margin:0 auto). Tanpa ini .hpsc-modpage selebar <body>
     sedangkan pembungkus di dalamnya bisa melebar, sehingga lembar modul tidak
     sebaris dengan sampul (gejala "halaman bergeser ke kanan"). */
  return base + x + hpscCss() +
    '.hpsc-modpage{page-break-after:always;break-after:page}.hpsc-modpage:last-child{page-break-after:auto}'+
    '.hpsc-modpage{width:210mm;margin-left:auto;margin-right:auto}'+
    '.hpsc-modpage table.fkl-page-wrap{margin-left:auto;margin-right:auto}'+
    '.hpsc-modpage .fkl-print-page,.hpsc-modpage .fkl-sheet{margin-left:auto;margin-right:auto}'+
    /* Jaring pengaman: bila paginasi sebuah modul GAGAL, dokumennya dikembalikan
       ke satu lembar panjang .fkl-print-page yang ber-min-height:297mm — inilah
       asal "lembar putih kosong" di Rekap HPS. Di Rekap tingginya cukup mengikuti
       isi, sehingga kegagalan tidak lagi meninggalkan kertas kosong. */
    '.hpsc-modpage .fkl-print-page{min-height:0}';
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
/* RHO dianggap ADA hanya bila record-nya benar-benar punya isi — item terisi,
   sumber terisi, atau kartu referensi berisi (foto/link/harga). Record RHO yang
   kosong (pernah dibuat lalu tak diisi) TIDAK memunculkan bagian Referensi Harga
   di Rekap HPS maupun daftar dokumen pada Cover HPS. */
function hpscRhoAdaIsi(rec){
  if(!rec) return false;
  const s=(rec.state&&typeof rec.state==='object')?rec.state:{};
  const isi=v=>v!=null&&String(v).trim()!=='';
  if(Array.isArray(s.items) && s.items.some(isi)) return true;
  if(Array.isArray(s.sumber) && s.sumber.some(isi)) return true;
  if(s.refs && typeof s.refs==='object'){
    for(const k of Object.keys(s.refs)){
      const a=s.refs[k];
      if(Array.isArray(a) && a.some(c=>c&&(isi(c.foto)||isi(c.fotoPath)||isi(c.link)||isi(c.harga)))) return true;
    }
  }
  return false;
}
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
  const hasHps=!!hpsRec, hasAna=!!anaRec, hasJadwal=!!jadwalRec, hasRho=hpscRhoAdaIsi(rhoRec);
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
    /* Paskan dulu tabel yang lebih lebar dari kertas (HPS/Analisa), baru dipecah
       jadi lembar A4 — supaya tinggi baris yang dipakai memecah halaman benar. */
    fklFitTblScript()+
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


