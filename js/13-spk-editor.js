/* ===== 13-spk-editor.js (bagian 13/15, baris 15655-21981 dari app.js asli) =====
   BLOK 2 — SPK: pustaka klausul, penyusunan kontrak, editor WYSIWYG, penomoran/poin gaya Word.
   WAJIB dimuat berurutan 01 s.d. 15 — jangan ubah urutannya. ===== */
/* ===================== BLOK 2: MODUL PEMBUATAN KONTRAK (SPK) ===================== */
/* ===== MODUL PEMBUATAN KONTRAK (SPK) ===== */
/* Pustaka Klausul bawaan: 3 klausul kosong (KLAUSUL 1 s.d. 3).
   Isi tiap klausul berupa contoh pengisian (titik-titik sampai batas margin kanan,
   huruf samar/transparan) yang tinggal diganti lewat template Word. */
const SPK_KL_PLACEHOLDER = '<p class="kl0 spk-ph">Isi Klausul ................................................................................................................................................................................................</p>';
const SPK_KLAUSUL_SEED=[
  {urutan:10, judul:"KLAUSUL 1", isi:SPK_KL_PLACEHOLDER, aktif:true},
  {urutan:20, judul:"KLAUSUL 2", isi:SPK_KL_PLACEHOLDER, aktif:true},
  {urutan:30, judul:"KLAUSUL 3", isi:SPK_KL_PLACEHOLDER, aktif:true}
];
/* =========================================================================
   PEMBUATAN KONTRAK — SURAT PERINTAH KERJA (SPK)
   Menu: Pembuatan Kontrak > Surat Perintah Kerja
     - Penyusunan Kontrak (isi mail merge + pilih klausul + simpan)
     - Lihat Kontrak (daftar kontrak tersimpan + cetak/PDF + ubah + hapus)
     - Ubah Klausul Kontrak (pustaka klausul: tambah / ubah / urutkan / aktif)
   Penyimpanan: Supabase (tabel kontrak_spk & klausul_spk).
   ========================================================================= */

const SPK_LOGO_SRC = (typeof FKL_LOGO_SRC!=='undefined') ? FKL_LOGO_SRC : '';
const SPK_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const SPK_HARI  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

/* ---------- Skema field mail-merge (dikelompokkan per bagian) ---------- */
const SPK_DEF_LATAR="PT PLN (Persero) senantiasa berkomitmen untuk tidak hanya meningkatkan keandalan pasokan tenaga listrik, tetapi juga memastikan standar keamanan, keselamatan, dan kebersihan lingkungan kerja (K3L) di seluruh fasilitas kelistrikannya. Dalam pengoperasian instalasi vital seperti Gardu Hubung (GH) di area PLTD Kobisonta, aspek perlindungan aset dan keselamatan personel merupakan prioritas utama yang harus dipenuhi.\nGardu Hubung (GH) berfungsi sebagai simpul penting dalam mendistribusikan energi listrik. Fasilitas ini dilengkapi dengan berbagai peralatan tegangan menengah dan instalasi jaringan kabel yang sangat kompleks. Kabel-kabel distribusi tersebut umumnya ditempatkan pada jalur atau saluran kabel (cable trench) di area gardu. Saluran kabel yang terbuka atau tidak tertutup dengan standar yang baik sangat rentan terhadap berbagai risiko. Paparan cuaca, masuknya air atau kotoran, ancaman gigitan hewan pengerat, hingga risiko kerusakan mekanis akibat aktivitas di sekitarnya dapat memicu korsleting dan gangguan sistem. Selain itu, saluran kabel yang terbuka juga membahayakan keselamatan petugas operasi yang sedang melakukan pemeliharaan di area tersebut. Oleh karena itu, pengadaan Penutup Saluran Kabel yang kuat, presisi, dan aman menjadi sangat esensial.\nDi samping perlindungan terhadap jaringan kabel, Gardu Hubung juga merupakan zona berbahaya (tegangan menengah) yang memerlukan pembatasan akses secara ketat. Diperlukan batas fisik (perimeter) yang jelas untuk mencegah masuknya pihak-pihak yang tidak berkepentingan, melindungi aset dari potensi pencurian atau vandalisme, serta mencegah masuknya hewan liar yang berisiko menyebabkan gangguan hubung singkat (korsleting). Penggunaan Pagar Harmonika dinilai sangat efektif dan efisien untuk kebutuhan ini, karena materialnya yang kuat, tahan terhadap cuaca, namun tetap memberikan visibilitas yang baik untuk keperluan pengawasan visual (visual inspection) dari luar area gardu.\nMemperhatikan kondisi dan kebutuhan krusial tersebut, maka dipandang perlu untuk segera melaksanakan pekerjaan \"{{nama_pekerjaan}}\". Pekerjaan ini merupakan langkah preventif dan penyempurnaan infrastruktur pendukung Gardu Hubung, yang bertujuan untuk memaksimalkan keamanan aset, menjamin keselamatan personel, serta mendukung tercapainya keandalan operasional kelistrikan di wilayah kerja ULP Kobisonta secara berkelanjutan.";
const SPK_DEF_MASALAH="Berdasarkan tinjauan terhadap kondisi keamanan dan keselamatan operasional di area Gardu Hubung (GH) Kobisonta, terdapat beberapa isu utama yang memerlukan penanganan segera:\na. Kerentanan Saluran Kabel Terbuka: Jaringan kabel listrik yang berada di dalam trench (saluran kabel) memiliki risiko tinggi jika dibiarkan tanpa penutup yang memadai. Kondisi ini membuat kabel rentan terhadap genangan air, tumpukan kotoran/sampah, serta gangguan dari hama atau hewan pengerat (seperti tikus) yang dapat merusak isolasi kabel dan memicu korsleting. Selain itu, saluran yang terbuka juga merupakan bahaya (potensi tersandung/jatuh) bagi petugas PLN saat melakukan manuver atau pemeliharaan;\nb. Belum Optimalnya Pengamanan Perimeter (Batas Fisik): Area Gardu Hubung adalah zona instalasi tegangan menengah yang sangat berbahaya. Ketiadaan atau kurang memadainya pagar pembatas di sekitar area gardu memunculkan risiko masuknya warga sipil (pihak yang tidak berkepentingan), anak-anak, maupun hewan liar ke dalam area bertegangan. Hal ini tidak hanya mengancam keselamatan jiwa, tetapi juga meningkatkan risiko pencurian atau vandalisme terhadap aset-aset PLN.";
const SPK_DEF_MAKSUD="Adapun maksud dan tujuan dilaksanakannya pekerjaan ini adalah sebagai berikut:\n1. Maksud:\nMaksud dari pengadaan pekerjaan ini adalah untuk melaksanakan pembuatan dan pemasangan fasilitas pengamanan fisik tambahan di area Gardu Hubung (GH) Kobisonta. Pelaksanaan fisik tersebut difokuskan pada dua item utama, yaitu pembuatan Penutup Saluran Kabel (cable trench cover) dan instalasi Pagar Harmonika sebagai batas perimeter area gardu, yang dikerjakan sesuai dengan spesifikasi material, volume, dan standar teknis yang ditetapkan oleh PT PLN (Persero).\n2. Tujuan pengadaan ini adalah:\na. Pengamanan Aset Jaringan Kabel: Melindungi instalasi kabel kelistrikan di dalam saluran (trench) dari paparan langsung kondisi cuaca, genangan air, penumpukan kotoran, serta mencegah kerusakan fisik yang dapat ditimbulkan oleh gigitan hewan pengerat (hama).\nb. Peningkatan Keselamatan Kerja (K3): Menutup area saluran kabel yang terbuka agar tidak menjadi bahaya (risiko terperosok atau tersandung) bagi petugas atau teknisi PLN yang sedang melakukan inspeksi, pemeliharaan, maupun manuver jaringan di dalam area gardu.\nc. Pembatasan Akses (Perimeter Security): Membangun Pagar Harmonika sebagai batas fisik yang tegas untuk mencegah masuknya pihak-pihak yang tidak berkepentingan, warga sipil, maupun hewan liar ke dalam area bertegangan menengah, guna menghindari risiko kecelakaan ketenagalistrikan.\nd. Pencegahan Vandalisme dan Pencurian: Memberikan lapisan perlindungan ekstra untuk menekan risiko terjadinya pencurian material atau tindakan perusakan (vandalisme) terhadap aset-aset kelistrikan di area Gardu Hubung.\ne. Dukungan Keandalan Sistem: Melalui terciptanya lingkungan gardu yang aman, tertutup, dan terlindungi, diharapkan dapat meminimalisir potensi gangguan teknis yang bersumber dari faktor eksternal, sehingga keandalan suplai listrik kepada pelanggan ULP Kobisonta dapat terus terjaga.";
/* Skema field mail-merge — mengikuti Field Kontrak (Excel): 5 bidang.
   Semua nilai dikosongkan (def:''). Field otomatis (auto) tampil read-only
   & terisi sendiri; "Perubahan?" dropdown; field SK terkunci bila Perubahan≠Ya. */
/* Teks bawaan (default) Rincian Akta Pendirian & Rincian Akta Perubahan.
   Tetap dapat disunting bebas oleh pengguna pada form Data Mail Merge. */
const SPK_DEF_AKTA_PENDIRIAN = 'akta Notaris No. (no. akta..) tanggal (tgl. akta...) dibuat dihadapan Notaris (nama notaris...), yang disahkan berdasarkan Surat Keputusan Menteri Hukum dan Hak Asasi Manusia No. (no. SK...) tanggal (tgl SK...) beserta akta-akta Perubahannya';
const SPK_DEF_AKTA_PERUBAHAN = 'akta Notaris No. (no. akta...) tanggal (tgl. akta...) dibuat dihadapan Notaris (nama notaris...), yang disahkan berdasarkan Surat Keputusan Menteri Hukum dan Hak Asasi Manusia No. (no. SK...) tanggal (tgl. SK...)';
/* Field SK Pimpinan Unit — dipakai untuk fitur "default = data terakhir disimpan" */
const SPK_SK_KEYS = ['nama_pengguna','jabatan_pengguna','no_sk','tgl_sk','nama_unit','singkatan_unit','lokasi_unit'];

/* =========================================================================
   BENTUK KONTRAK — Surat Perintah Kerja (SPK) vs Perjanjian/Kontrak (PK)
   Satu tampilan Penyusunan Kontrak dipakai untuk dua bentuk dokumen.
   Pilihan tersimpan pada data.bentuk_kontrak ('SPK' | 'PK').
   Field ber-atribut only:'PK' hanya tampil pada Perjanjian/Kontrak,
   only:'SPK' hanya pada Surat Perintah Kerja; tanpa atribut = keduanya.
   Label alternatif memakai lPk (label saat Perjanjian/Kontrak).
   ========================================================================= */
/* Pilihan Metode Pengadaan untuk Perjanjian/Kontrak (tender) */
const SPK_METODE_PK_OPTS = ['Tender Terbatas','Tender Terbuka','Seleksi Umum','Seleksi Terbatas','Penunjukan Langsung','Tender Cepat'];
const SPK_BENTUK_OPTS = [
  {v:'SPK', l:'Surat Perintah Kerja'},
  {v:'PK',  l:'Perjanjian/Kontrak'}
];
/* Bentuk dari sebuah objek data (dipakai saat membangun dokumen) */
function spkBentukOf(data){ return (String((data&&data.bentuk_kontrak)||'').toUpperCase()==='PK') ? 'PK' : 'SPK'; }
/* Bentuk yang sedang aktif pada form Penyusunan Kontrak */
function spkBentuk(){ return spkBentukOf(spkState&&spkState.data); }
function spkIsPk(){ return spkBentuk()==='PK'; }
/* Nama dokumen — dipakai pada judul cover, daftar isi, kop berulang & bab isi */
function spkDokLabel(data){ return spkBentukOf(data)==='PK' ? 'PERJANJIAN/KONTRAK' : 'SURAT PERINTAH KERJA'; }
function spkDokTitle(data){ return spkBentukOf(data)==='PK' ? 'Perjanjian/Kontrak' : 'Surat Perintah Kerja'; }
function spkLampTitle(data){ return spkBentukOf(data)==='PK' ? 'Lampiran Perjanjian/Kontrak' : 'Lampiran Surat Perintah Kerja'; }
/* Baris kecil di atas judul cover = METODE PENGADAAN (mis. PENGADAAN LANGSUNG,
   TENDER, PENUNJUKAN LANGSUNG). Bila kosong dipakai bawaan sesuai bentuk. */
function spkMetodeLabel(data){
  var m=String((data&&data.metode_pengadaan)||'').trim();
  if(!m) m = (spkBentukOf(data)==='PK') ? 'Tender' : 'Pengadaan Langsung';
  return m.toUpperCase();
}

const SPK_FIELD_GROUPS = [
  { sec:'Informasi Pengadaan', fields:[
    {k:'nama_pekerjaan', l:'Nama Pekerjaan', t:'text', span:2, dpLock:true, def:''},
    {k:'lokasi_pekerjaan', l:'Lokasi Pekerjaan', t:'text', span:2, dpLock:true, def:''},
    /* Bidang Pelaksana: dropdown dengan opsi PERSIS sama dengan Monitoring
       (BIDANG_OPTS — Transaksi Energi Listrik, dll). Terisi otomatis & terkunci
       bila sebuah Data Pekerjaan tertaut; bila Data Pekerjaan belum mengisinya,
       dropdown tetap dapat dipilih manual di sini. */
    {k:'pelaksana', l:'Bidang Pelaksana', t:'select', opts:BIDANG_OPTS, dpLock:true, def:''},
    {k:'jenis_anggaran', l:'Jenis Anggaran', t:'text', dpLock:true, def:''},
    {k:'no_anggaran', l:'No. Anggaran', t:'text', span:2, dpLock:true, def:''},
    {k:'tgl_anggaran', l:'Tgl. Anggaran', t:'date', dpLock:true, def:''},
    /* Metode Pengadaan: Surat Perintah Kerja memakai isian teks (umumnya terisi
       otomatis "Pengadaan Langsung" dari Data Pekerjaan); Perjanjian/Kontrak
       memakai dropdown metode tender — opsi sama dengan Monitoring Tender. */
    {k:'metode_pengadaan', l:'Metode Pengadaan', t:'text', dpLock:true, only:'SPK', def:''},
    {k:'metode_pengadaan', l:'Metode Pengadaan', t:'select', opts:SPK_METODE_PK_OPTS, dpLock:true, only:'PK', def:''},
    {k:'no_rks', l:'No. RKS', t:'text', span:2, only:'PK', def:''},
    {k:'tgl_rks', l:'Tgl. RKS', t:'date', only:'PK', def:''},
    {k:'no_eproc', l:'No. Eproc', t:'text', span:2, def:''},
    {k:'pengumuman_awal', l:'Tgl. Pengumuman (awal)', t:'date', def:''},
    {k:'pengumuman_akhir', l:'Tgl. Pengumuman (akhir)', t:'date', def:''},
    {k:'no_bapj', l:'No. BA Penjelasan', t:'text', span:2, only:'PK', def:''},
    {k:'tgl_bapj', l:'Tgl. BA Penjelasan', t:'date', only:'PK', def:''},
    {k:'no_bapp', l:'No. BA Pembukaan Penawaran', lPk:'No. BA Pembukaan Penawaran Sampul 1', t:'text', span:2, def:''},
    {k:'tgl_bapp', l:'Tgl. BA Pembukaan Penawaran', lPk:'Tgl. BA Pembukaan Penawaran Sampul 1', t:'date', def:''},
    {k:'no_bae', l:'No. BA Evaluasi Penawaran', lPk:'No. BA Evaluasi Penawaran Sampul 1', t:'text', span:2, def:''},
    {k:'tgl_bae', l:'Tgl. BA Evaluasi Penawaran', lPk:'Tgl. BA Evaluasi Penawaran Sampul 1', t:'date', def:''},
    {k:'no_bapp2', l:'No. BA Pembukaan Penawaran Sampul 2', t:'text', span:2, only:'PK', def:''},
    {k:'tgl_bapp2', l:'Tgl. BA Pembukaan Penawaran Sampul 2', t:'date', only:'PK', def:''},
    {k:'no_bae2', l:'No. BA Evaluasi Penawaran Sampul 2', t:'text', span:2, only:'PK', def:''},
    {k:'tgl_bae2', l:'Tgl. BA Evaluasi Penawaran Sampul 2', t:'date', only:'PK', def:''},
    {k:'no_bakn', l:'No. BA Klarifikasi dan Negosiasi', t:'text', span:2, def:''},
    {k:'tgl_bakn', l:'Tgl. BA Klarifikasi dan Negosiasi', t:'date', def:''},
    {k:'no_bahp', l:'No. BA Hasil Pengadaan', t:'text', span:2, only:'PK', def:''},
    {k:'tgl_bahp', l:'Tgl. BA Hasil Pengadaan', t:'date', only:'PK', def:''},
    {k:'no_ucp', l:'No. Usulan Calon Pemenang', t:'text', span:2, only:'PK', def:''},
    {k:'tgl_ucp', l:'Tgl. Usulan Calon Pemenang', t:'date', only:'PK', def:''},
    {k:'no_penetapan', l:'No. Penetapan Penyedia Barang/Jasa', t:'text', span:2, only:'PK', def:''},
    {k:'tgl_penetapan', l:'Tgl. Penetapan Penyedia Barang/Jasa', t:'date', only:'PK', def:''},
    {k:'no_sppbj', l:'No. SPPBJ', t:'text', span:2, only:'PK', def:''},
    {k:'tgl_sppbj', l:'Tgl. SPPBJ', t:'date', only:'PK', def:''},
  ]},
  { sec:'Informasi Kontrak', fields:[
    {k:'nomor_kontrak', l:'No. Kontrak', lPk:'No. Kontrak PIHAK PERTAMA', t:'text', span:2, def:''},
    {k:'nomor_kontrak_p2', l:'No. Kontrak PIHAK KEDUA', t:'text', span:2, only:'PK', def:''},
    {k:'tanggal_kontrak', l:'Tgl. Awal Kontrak', t:'date', def:''},
    {k:'auto_terbilang_tgl', l:'Terbilang Tgl. Awal Kontrak', auto:'terbilang_tgl', span:2},
    {k:'auto_tgl_strip', l:'Tgl. Awal Kontrak (-)', auto:'tgl_strip'},
    {k:'tgl_akhir_kontrak', l:'Tgl. Akhir Kontrak', t:'date', auto:'tgl_akhir', def:''},
    {k:'nilai_pekerjaan', l:'Nilai Pekerjaan (+ PPN)', t:'rupiah', def:''},
    {k:'auto_terbilang_nilai', l:'Terbilang Nilai Pekerjaan', auto:'terbilang_nilai', span:2},
    {k:'jangka_waktu', l:'Jangka Waktu Pelaksanaan (hari)', t:'number', def:''},
    {k:'auto_terbilang_jangka', l:'Terbilang Jangka Waktu Pelaksanaan', auto:'terbilang_jangka', span:2},
  ]},
  { sec:'SK Pimpinan Unit', secPk:'Informasi PLN Unit', fields:[
    {k:'perubahan', l:'Perubahan?', t:'select', opts:['Ya','Tidak'], def:''},
    {k:'nama_pengguna', l:'Nama Pengguna', t:'text', span:2, lockedBy:'perubahan', def:''},
    {k:'jabatan_pengguna', l:'Jabatan', t:'text', lockedBy:'perubahan', def:''},
    {k:'no_sk', l:'No. Keputusan Direksi', t:'text', span:2, lockedBy:'perubahan', def:''},
    {k:'tgl_sk', l:'Tgl. Keputusan Direksi', t:'date', lockedBy:'perubahan', def:''},
    {k:'nama_unit', l:'Nama Unit', t:'text', span:2, lockedBy:'perubahan', def:'', ph:'cth. Unit Pelaksana Pelayanan Pelanggan Masohi'},
    {k:'singkatan_unit', l:'Singkatan Unit', t:'text', lockedBy:'perubahan', def:'', ph:'cth. UP3 Masohi'},
    {k:'lokasi_unit', l:'Lokasi Unit', t:'text', span:2, lockedBy:'perubahan', def:''},
    {k:'telp_unit', l:'Telepon Unit', t:'text', only:'PK', def:''},
    {k:'fax_unit', l:'Fax Unit', t:'text', only:'PK', def:''},
    {k:'email_unit', l:'Email Unit', t:'text', span:2, only:'PK', def:''},
  ]},
  { sec:'Informasi Penyedia', fields:[
    {k:'nama_perusahaan', l:'Nama Perusahaan', t:'text', span:2, def:''},
    {k:'auto_jenis_perusahaan', l:'Jenis Perusahaan', auto:'jenis_perusahaan', span:2},
    {k:'lokasi_perusahaan', l:'Lokasi Perusahaan', t:'text', span:2, def:''},
    {k:'nama_pimpinan', l:'Nama Pimpinan', t:'text', def:''},
    {k:'jabatan_pimpinan', l:'Jabatan Pimpinan', t:'text', def:''},
    {k:'no_rekening', l:'No. Rekening', t:'text', def:''},
    {k:'nama_bank', l:'Nama Bank', t:'text', span:2, def:''},
    {k:'pemilik_rekening', l:'Pemilik Rekening', t:'text', span:2, def:''},
    {k:'no_penawaran_penyedia', l:'No. Penawaran', t:'text', span:2, def:''},
    {k:'tgl_penawaran', l:'Tgl. Penawaran', t:'date', def:''},
    /* Akta Perubahan? — Ya: Rincian Akta Perubahan dapat diisi & "beserta akta-akta
       Perubahannya" ditulis pada Akta Pendirian. Selain Ya: Rincian Akta Perubahan
       terkunci dalam keadaan default (tidak tampil di pratinjau/cetak) & frasa
       "beserta akta-akta Perubahannya" pada Akta Pendirian dihapus. */
    {k:'telp_penyedia', l:'Telepon Penyedia', t:'text', only:'PK', def:''},
    {k:'fax_penyedia', l:'Fax Penyedia', t:'text', only:'PK', def:''},
    {k:'email_penyedia', l:'Email Penyedia', t:'text', span:2, only:'PK', def:''},
    {k:'ada_akta_perubahan', l:'Akta Perubahan?', t:'select', opts:['Ya','Tidak'], def:''},
    {k:'akta_pendirian', l:'Rincian Akta Pendirian', t:'textarea', span:2, hl:true, def:SPK_DEF_AKTA_PENDIRIAN},
    {k:'akta_perubahan', l:'Rincian Akta Perubahan', t:'textarea', span:2, hl:true, def:SPK_DEF_AKTA_PERUBAHAN},
  ]},
  { sec:'Pengendali Pekerjaan', fields:[
    {k:'jabatan_direksi', l:'Direksi Pekerjaan', t:'text', span:2, def:''},
    {k:'jabatan_pengawas', l:'Pengawas Pekerjaan', t:'text', span:2, def:''},
    {k:'jabatan_pengawas_lapangan', l:'Pengawas Lapangan', t:'text', span:2, only:'PK', def:''},
  ]},
  /* [DIHAPUS] Kartu "Uraian Pekerjaan (opsional)" — field Latar Belakang,
     Permasalahan, dan Maksud dan Tujuan beserta tombol "Isi Teks ..." dan kotak
     "Pratinjau kerapian" tidak lagi ditampilkan pada form Penyusunan Kontrak.
     Isi butir tersebut kini ditulis langsung pada Pustaka Klausul / dokumen Word
     klausul. Blok contoh (placeholder) di dalam klausul tetap otomatis dibuang
     oleh spkPruneKlausul() karena datanya kosong. */
];
/* daftar semua field (flat) */
const SPK_FIELDS_FLAT = SPK_FIELD_GROUPS.reduce((a,g)=>a.concat(g.fields),[]);

/* Teks tetap (statis) profil PT PLN (Persero) untuk PIHAK PERTAMA.
   Bukan field mail-merge — hanya bagian bercetak kuning pada dokumen yang
   menjadi input (nama wakil, jabatan, no. & tgl. Keputusan Direksi, nama unit,
   alamat unit). Bagian ini sama untuk semua kontrak. */
const SPK_P1_AKTA_PLN = "Perusahaan Berbadan Hukum yang merupakan Badan Usaha Milik Negara (BUMN) yang didirikan berdasarkan Akta Notaris No. 169 tanggal 30 Juli 1994 dibuat di hadapan Notaris SUTJIPTO, SH., yang disahkan berdasarkan Surat Keputusan Menteri Kehakiman Republik Indonesia No. C2-11.519.HT.01.01.TH'94 tanggal 1 Agustus 1994 beserta akta-akta perubahannya.";

/* ---------- Preamble (pembuka) — memakai placeholder ---------- */
const SPK_PREAMBLE_TPL =
 '<p class="kl0">Pada hari ini <b>{{hari_ttd}}, tanggal {{tgl_kontrak_terbilang}} ({{tgl_kontrak_num}})</b>, kami yang bertanda tangan dibawah ini :</p>'+
 '<div class="spk-party"><div class="spk-party-h"><span class="n">I.</span>PT PLN (PERSERO):</div>'+
 '<p class="spk-party-d">{{p1_akta}} Dalam hal ini diwakili oleh <b>{{p1_wakil}}</b> selaku {{p1_jabatan}} berdasarkan Keputusan Direksi PT PLN (Persero) Nomor: {{p1_sk}} tanggal {{p1_sk_tgl}}. Bertindak untuk dan atas nama PT PLN (Persero) {{p1_nama_singkat}} yang berkedudukan di {{p1_alamat}}, selanjutnya dalam Perjanjian ini disebut sebagai (<b>&ldquo;PIHAK PERTAMA&rdquo;</b>);</p></div>'+
 '<div class="spk-party"><div class="spk-party-h"><span class="n">II.</span>{{p2_nama}}:</div>'+
 '<p class="spk-party-d">{{p2_akta}} Dalam hal ini diwakili oleh <b>{{p2_wakil}}</b> selaku {{p2_jabatan}}{{p2_akta_jabatan}}. Bertindak untuk dan atas nama {{p2_nama_hormat}} yang berkedudukan di {{p2_alamat}}, selanjutnya dalam Perjanjian ini disebut sebagai (<b>&ldquo;PIHAK KEDUA&rdquo;</b>).</p></div>'+
 '<p class="kl0 spk-berdasar"><b><u>Berdasarkan :</u></b></p>'+
 '<p class="spk-dlist"><span class="n">1.</span>Undangan kepada Penyedia Barang/Jasa melalui E-Procurement dengan paket pengadaan Nomor: {{dasar_undangan_no}} pada tanggal {{dasar_undangan_tgl}};</p>'+
 '<p class="spk-dlist"><span class="n">2.</span>Surat Penawaran Harga <b>PIHAK KEDUA</b> Nomor: {{dasar_penawaran_no}} tanggal {{dasar_penawaran_tgl_pjg}};</p>'+
 '<p class="spk-dlist"><span class="n">3.</span>Berita Acara Pembukaan Penawaran Nomor: {{dasar_bapp_no}} tanggal {{dasar_bapp_tgl_pjg}};</p>'+
 '<p class="spk-dlist"><span class="n">4.</span>Berita Acara Evaluasi Penawaran Nomor: {{dasar_bae_no}} tanggal {{dasar_bae_tgl_pjg}};</p>'+
 '<p class="spk-dlist"><span class="n">5.</span>Berita Acara Klarifikasi dan Negosiasi Nomor: {{dasar_bakn_no}} tanggal {{dasar_bakn_tgl_pjg}}.</p>'+
 '<p class="kl0 spk-menugaskan">Maka dengan ini <b>PIHAK PERTAMA</b> menugaskan kepada <b>PIHAK KEDUA</b> untuk melaksanakan pekerjaan sebagaimana tersebut dalam ketentuan sebagai berikut :</p>';

/* ---------- Preamble PERJANJIAN/KONTRAK (bentuk tender) ----------
   Susunan mengikuti dokumen Perjanjian/Kontrak PLN:
     - kop nomor PIHAK PERTAMA & PIHAK KEDUA
     - kalimat pembuka (tempat & tanggal penandatanganan)
     - profil PIHAK PERTAMA & PIHAK KEDUA (sama dengan SPK)
     - "berpedoman pada" : dasar peraturan (tetap) + dokumen proses pengadaan
       (dinamis — butir yang datanya kosong otomatis dilewati & nomor dirapatkan)
     - kalimat penutup pembuka (memulai halaman baru, class spk-menugaskan) */
const SPK_PK_DASAR_TETAP = [
 'Undang-Undang No. 30 Tahun 2009 tanggal 23 September 2009 tentang Ketenagalistrikan.',
 'Peraturan Direksi PT PLN (Persero) No. 0018.P/DIR/2023 tanggal 07 Juli 2023 tentang Kebijakan Strategis Pengadaan Barang/Jasa PT PLN (Persero).',
 'Peraturan Direksi PT PLN (Persero) No. 0012.E/DIR/2023 tanggal 07 Juli 2023 tentang Standar Prosedur Pengadaan Barang/Jasa Lainnya.',
 'Peraturan Direksi PT PLN (Persero) No. 0254.P/DIR/2016 tentang (SPLN U1.006: 2015) Sistem manajemen Keselamatan Kontraktor (Contractor Safety Management System/CSMS) PT PLN (Persero).',
 'Peraturan Pelaksana PT PLN (Persero) No. 0033.E/DIR/2024 tanggal 31 Oktober 2024 tentang Standar Prosedur Pengelolaan Penyedia Barang/Jasa.',
 'Edaran Direksi PT PLN (Persero) No. 0001.E/DIR/2021 tanggal 02 Maret 2021 tentang Petunjuk Pelaksanaan Penggunaan Aplikasi e-Procurement PLN Dalam Pengadaan Barang/Jasa PT PLN (Persero).',
 'Peraturan Direksi PT PLN (Persero) No. 0121.P/DIR/2019 tentang Kebijakan Anti Fraud di PT PLN (Persero).',
 'Peraturan Direksi PT PLN (Persero) No. 0122.P/DIR/2019 tanggal 19 Agustus 2019 tentang Pengelolaan Konflik Kepentingan di Lingkungan PT PLN (Persero).',
 'Peraturan Direksi PT PLN (Persero) No. 004.P/DIR/2021 tanggal 19 Februari 2021 tentang Pedoman Jaminan di Lingkungan PT PLN (Persero).',
 'Peraturan Direksi PT PLN (Persero) No. 0002.P/DIR/2022 tanggal 20 Januari 2022 tentang Kebijakan Strategis Pedoman Penggunaan Produk Dalam Negeri di Lingkungan PT PLN (Persero).',
 'Edaran Direksi PT PLN (Persero) No. 0031.E/DIR/2022 tanggal 04 November 2022 tentang Standar Prosedur Pelaksanaan Penggunaan Produk Dalam Negeri di Lingkungan PT PLN (Persero).',
 'Edaran Direksi PT PLN (Persero) No. 0113/KEU.00.01/DIRKEU/2019 tanggal 08 Januari 2019 tentang Daftar Penerbit Jaminan Terseleksi.',
 'Peraturan Direksi PT PLN (Persero) No. 0048.P/DIR/2020 tanggal 01 Juli 2020 tentang Tata Kelola Anti Penyuapan di Lingkungan PT PLN (Persero).',
 'Edaran Direksi PT PLN (Persero) No. 0013.E/DIR/2020 tanggal 03 Juli 2020 tentang Pedoman Pelaksanaan Integrity Due Diligence di Lingkungan PT PLN (Persero).'
];
/* Dokumen proses pengadaan — pasangan (label, key nomor, key tanggal).
   Butir yang nomor & tanggalnya kosong tidak dicetak. */
/* nl = label baris nomor. Mengikuti dokumen acuan: umumnya "No. Dokumen",
   kecuali Sumber Anggaran yang memakai "No. SKKO/SKKI". Bila nl dikosongkan,
   dipakai "No. Dokumen". */
const SPK_PK_DASAR_DOK = [
 {l:'Sumber Anggaran',                              no:'no_anggaran',   tg:'tgl_anggaran', nl:'No. SKKO/SKKI'},
 {l:'Dokumen Rencana Kerja dan Syarat-syarat (RKS)', no:'no_rks',       tg:'tgl_rks'},
 {l:'__EPROC__',                                    no:'no_eproc',      tg:''},
 {l:'Berita Acara Penjelasan',                      no:'no_bapj',       tg:'tgl_bapj'},
 {l:'Berita Acara Pembukaan Penawaran Sampul Satu', no:'no_bapp',       tg:'tgl_bapp'},
 {l:'Berita Acara Evaluasi Penawaran Sampul Satu',  no:'no_bae',        tg:'tgl_bae'},
 {l:'Surat Penawaran Harga <b>PIHAK KEDUA</b>',     no:'no_penawaran_penyedia', tg:'tgl_penawaran'},
 {l:'Berita Acara Pembukaan Penawaran Sampul Dua',  no:'no_bapp2',      tg:'tgl_bapp2'},
 {l:'Berita Acara Evaluasi Penawaran Sampul Dua',   no:'no_bae2',       tg:'tgl_bae2'},
 {l:'Berita Acara Klarifikasi dan Negosiasi',       no:'no_bakn',       tg:'tgl_bakn'},
 {l:'Berita Acara Hasil Pengadaan',                 no:'no_bahp',       tg:'tgl_bahp'},
 {l:'Nota Dinas Usulan Calon Pemenang',             no:'no_ucp',        tg:'tgl_ucp'},
 {l:'Surat Penetapan Penyedia Barang/Jasa',         no:'no_penetapan',  tg:'tgl_penetapan'},
 {l:'Surat Penunjukan Penyedia Barang/Jasa (SPPBJ)',no:'no_sppbj',      tg:'tgl_sppbj'}
];
/* Susun template preamble Perjanjian/Kontrak sesuai data yang terisi */
function spkPreamblePkTpl(data){
  data=data||{};
  var esc=fkEsc, out='', n=0, i;
  /* --- kop nomor kedua belah pihak ---
     Dibungkus .spk-pkhead yang memberi jarak 18pt ke kalimat pembuka di
     bawahnya (tanpa garis pembatas). Kelas spk-keep membuat paginator
     memperlakukan blok ini sebagai satu kesatuan (lihat atom() di
     spkPageScript) sehingga kedua baris nomor tak pernah terpisah halaman. */
  out += '<div class="spk-pkhead spk-keep">'+
           '<div class="spk-pknum">'+
             '<div class="r"><span class="k">Nomor PIHAK PERTAMA</span><span class="s">:</span><span class="v">{{nomor_kontrak}}</span></div>'+
             '<div class="r"><span class="k">Nomor PIHAK KEDUA</span><span class="s">:</span><span class="v">{{nomor_kontrak_p2}}</span></div>'+
           '</div>'+
         '</div>';
  /* --- kalimat pembuka --- */
  out += '<p class="kl0">Perjanjian ini dibuat dan ditandatangani di PT PLN (Persero) {{p1_nama_singkat}} yang berlokasi di {{p1_alamat}} pada hari <b>{{hari_ttd}}, tanggal {{tgl_kontrak_terbilang}} ({{tgl_kontrak_num}})</b>, oleh dan antara :</p>';
  /* --- para pihak (sama dengan SPK) --- */
  out += '<div class="spk-party"><div class="spk-party-h"><span class="n">I.</span>PT PLN (PERSERO):</div>'+
         '<p class="spk-party-d">{{p1_akta}} Dalam hal ini diwakili oleh <b>{{p1_wakil}}</b> selaku {{p1_jabatan}} berdasarkan Keputusan Direksi PT PLN (Persero) Nomor: {{p1_sk}} tanggal {{p1_sk_tgl}}. Bertindak untuk dan atas nama PT PLN (Persero) {{p1_nama_singkat}} yang berkedudukan di {{p1_alamat}}, selanjutnya dalam Perjanjian ini disebut sebagai (<b>&ldquo;PIHAK PERTAMA&rdquo;</b>);</p></div>';
  out += '<div class="spk-party"><div class="spk-party-h"><span class="n">II.</span>{{p2_nama}}:</div>'+
         '<p class="spk-party-d">{{p2_akta}} Dalam hal ini diwakili oleh <b>{{p2_wakil}}</b> selaku {{p2_jabatan}}{{p2_akta_jabatan}}. Bertindak untuk dan atas nama {{p2_nama_hormat}} yang berkedudukan di {{p2_alamat}}, selanjutnya dalam Perjanjian ini disebut sebagai (<b>&ldquo;PIHAK KEDUA&rdquo;</b>).</p></div>';
  out += '<p class="kl0">Selanjutnya masing-masing disebut pihak dan secara bersama-sama disebut para pihak, terlebih dahulu menerangkan hal-hal sebagai berikut:</p>';
  /* "…melaksanakan proses Pengadaan <nama pekerjaan>". Bila nama pekerjaan sudah
     diawali kata "Pengadaan", kata itu tidak ditambahkan lagi agar tidak terbaca
     "Pengadaan Pengadaan …". */
  var _pgd = /^\s*pengadaan\b/i.test(String(data.nama_pekerjaan||'')) ? '' : 'Pengadaan ';
  out += '<p class="kl0 spk-berdasar"><b>PIHAK PERTAMA</b> telah melaksanakan proses <b>'+_pgd+'{{nama_pekerjaan}}</b>. Bahwa proses pengadaan tersebut berpedoman pada :</p>';
  /* --- dasar peraturan (tetap) --- */
  for(i=0;i<SPK_PK_DASAR_TETAP.length;i++){
    n++;
    out += '<p class="spk-dlist"><span class="n">'+n+'.</span>'+esc(SPK_PK_DASAR_TETAP[i])+'</p>';
  }
  /* --- dokumen proses pengadaan (dinamis) ---
     Semua butir ditulis dengan bentuk yang SAMA: baris judul, lalu rincian
     "No. … : …" dan "Tanggal : …" di bawahnya. Lebar kolom label dihitung dari
     label TERPANJANG yang benar-benar dipakai, sehingga seluruh tanda ":" pada
     daftar ini sejajar pada satu garis. */
  var dokItems=[];
  for(i=0;i<SPK_PK_DASAR_DOK.length;i++){
    var it=SPK_PK_DASAR_DOK[i];
    if(it.l==='__EPROC__'){                          // Pengumuman melalui portal e-Procurement
      var aw=String(data.pengumuman_awal||'').trim(), ak=String(data.pengumuman_akhir||'').trim();
      var vEp=String(data.no_eproc||'').trim();
      if(!aw && !ak && !vEp) continue;
      dokItems.push({ t:'Pengumuman Pengadaan Melalui Portal EPROC',
                      nl:'No. Eproc', np:(vEp?'{{no_eproc}}':''),
                      tp:((aw||ak)?'{{dasar_undangan_tgl}}':'') });
      continue;
    }
    var vNo=String(data[it.no]==null?'':data[it.no]).trim();
    var vTg=it.tg?String(data[it.tg]==null?'':data[it.tg]).trim():'';
    if(!vNo && !vTg) continue;                       // butir tanpa data dilewati
    dokItems.push({ t:it.l, nl:(it.nl||'No. Dokumen'), np:(vNo?'{{'+it.no+'}}':''),
                    tp:(vTg?'{{'+it.tg+'}}':'') });
  }
  /* Lebar kolom label = label terpanjang + jeda 0,3 cm (jatuh ke 2,3 cm bila
     pengukuran tak tersedia, mis. saat dijalankan di luar peramban). */
  var kw=2.3;
  try{
    var maxw=0;
    for(i=0;i<dokItems.length;i++){
      if(dokItems[i].np) maxw=Math.max(maxw, spkTextWidthCm(dokItems[i].nl));
      if(dokItems[i].tp) maxw=Math.max(maxw, spkTextWidthCm('Tanggal'));
    }
    if(maxw>0) kw=Math.round((maxw+0.3)*100)/100;
  }catch(e){}
  var kSty=' style="flex:0 0 '+kw+'cm;max-width:'+kw+'cm"';
  var kvRow=function(label, ph){
    return '<div class="spk-kv spk-dkv"><span class="k"'+kSty+'>'+esc(label)+'</span>'+
           '<span class="s">:</span><span class="v">'+ph+'</span></div>';
  };
  for(i=0;i<dokItems.length;i++){
    var d0=dokItems[i];
    n++;
    out += '<p class="spk-dlist"><span class="n">'+n+'.</span>'+d0.t+'</p>';
    if(d0.np) out += kvRow(d0.nl, d0.np);
    if(d0.tp) out += kvRow('Tanggal', d0.tp);
  }
  /* --- kalimat penutup pembuka (memulai halaman baru) --- */
  out += '<p class="kl0 spk-menugaskan">Bahwa berdasarkan hal-hal tersebut di atas, para pihak sepakat untuk mengadakan Perjanjian <b>{{nama_pekerjaan}}</b> dengan ketentuan-ketentuan sebagaimana tersebut dalam Pasal&ndash;pasal sebagai berikut :</p>';
  /* --- kotak nomor daftar "Berdasarkan" ---
     Daftar ini satu deret menerus (1..N), jadi aturan penomorannya sama dengan
     butir klausul: bila nomor terakhir sudah 2 digit (10., 11., … ) deret
     dirata-KANANkan dan lebar kotaknya dihitung dari nomor TERLEBAR supaya
     "10." tidak menempel/menabrak teksnya; bila seluruhnya 1 digit -> rata KIRI.
     Lebar bawaan CSS (0,6 cm) hanya cukup untuk 1 digit, karena itu ditimpa
     inline di sini. */
  var dlW=0.6, dlWb=0.6, dlRata=(n>=10)?'right':'left';
  try{
    var wN=spkPkTextWidthCm(String(n)+'.');
    if(wN>0) dlW=Math.max(0.6, Math.round((wN+SPK_NUM_GAP)*100)/100);
    /* kolom teks mengikuti nomor 1 DIGIT terlebar ("9."); nomor 2 digit
       menjulur ke kiri, jadi butir 1 digit tetap sejajar dgn daftar lain */
    var w9=spkPkTextWidthCm('9.');
    dlWb=(n>=10 && w9>0) ? Math.max(0.6, Math.round((w9+SPK_NUM_GAP)*100)/100) : dlW;
  }
  catch(e){ if(n>=10){ dlW=0.85; dlWb=0.6; } }
  if(!(dlW>0)) dlW=0.6;
  if(!(dlWb>0) || dlWb>dlW) dlWb=dlW;
  out = out.replace(/<p class="spk-dlist"><span class="n">/g,
    '<p class="spk-dlist" style="padding-left:'+dlWb.toFixed(2)+'cm;text-indent:-'+dlW.toFixed(2)+'cm">'+
    '<span class="n" style="width:'+dlW.toFixed(2)+'cm;min-width:'+dlW.toFixed(2)+'cm;'+
    'display:inline-block;box-sizing:border-box;padding-right:'+SPK_NUM_GAP+'cm;text-indent:0;'+
    'white-space:nowrap;overflow:visible;text-align:'+dlRata+'">');
  return out;
}

/* ---------- Util angka & tanggal ---------- */
function spkNum(v){ const n=Number(String(v==null?'':v).replace(/[^0-9.-]/g,'')); return isFinite(n)?n:0; }
function spkRupiah(v){ return 'Rp'+spkNum(v).toLocaleString('id-ID'); }
function spkTitleCase(s){ return String(s||'').replace(/\S+/g, w=> w.charAt(0).toUpperCase()+w.slice(1)); }
function spkTerbilang(n){ try{ return spkTitleCase(hpsTerbilangKata(Math.round(spkNum(n)))); }catch(e){ return ''; } }
function spkTerbilangRupiah(n){ try{ return spkTitleCase(hpsTerbilangKata(Math.round(spkNum(n)))+' rupiah'); }catch(e){ return ''; } }
function spkDateLong(iso){ if(!iso) return ''; const p=String(iso).split('-'); if(p.length!==3) return iso; const y=+p[0],m=+p[1],d=+p[2]; return d+' '+(SPK_BULAN[m-1]||'')+' '+y; }
function spkDateNum(iso){ if(!iso) return ''; const p=String(iso).split('-'); if(p.length!==3) return iso; return p[2]+' - '+p[1]+' - '+p[0]; }
function spkDayName(iso){ if(!iso) return ''; const p=String(iso).split('-'); if(p.length!==3) return ''; const dt=new Date(+p[0],+p[1]-1,+p[2]); return SPK_HARI[dt.getDay()]||''; }
function spkTglTerbilang(iso){ if(!iso) return ''; const p=String(iso).split('-'); if(p.length!==3) return iso; const d=+p[2],m=+p[1],y=+p[0];
  return spkTerbilang(d)+' bulan '+(SPK_BULAN[m-1]||'')+' tahun '+spkTerbilang(y); }
/* Tgl. Akhir Kontrak = Tgl. Awal Kontrak + Jangka Waktu Pelaksanaan (hari).
   Hasil ISO 'YYYY-MM-DD'. Kosong bila salah satu masukan belum ada/valid. */
function spkComputeTglAkhir(data){
  data=data||{};
  const iso=data.tanggal_kontrak;
  const hari=spkNum(data.jangka_waktu);
  if(!iso || !(hari>0)) return '';
  const p=String(iso).split('-'); if(p.length!==3) return '';
  const dt=new Date(+p[0], (+p[1])-1, +p[2]);
  if(isNaN(dt.getTime())) return '';
  dt.setDate(dt.getDate()+hari);
  const mm=('0'+(dt.getMonth()+1)).slice(-2), dd=('0'+dt.getDate()).slice(-2);
  return dt.getFullYear()+'-'+mm+'-'+dd;
}

/* Bangun konteks (semua placeholder final) dari data field */
function spkBuildCtx(data){
  const d=Object.assign({}, data||{});
  d.tgl_akhir_kontrak = spkComputeTglAkhir(d);   // selalu = Tgl. Awal + Jangka Waktu (hari)
  const ctx={};
  /* Semua field bertipe TANGGAL (mis. Tgl. Keputusan Direksi) diisi di form
     memakai pemilih tanggal (dd/mm/yyyy), namun saat masuk ke KLAUSUL/DOKUMEN
     kontrak selalu ditulis dalam format panjang Indonesia — mis. 14 Juli 2026.
     Nilai aslinya (ISO) tetap tersedia lewat placeholder {{key_iso}} bila perlu. */
  SPK_FIELDS_FLAT.forEach(f=>{
    const raw = (d[f.k]!=null && d[f.k]!=='') ? d[f.k] : '';
    if(f.t==='date'){ ctx[f.k]=spkDateLong(raw); ctx[f.k+'_iso']=raw; }
    else ctx[f.k]=raw;
  });
  // ---- Nilai otomatis (mengikuti Field Kontrak Excel) ----
  ctx.nilai_rp = spkRupiah(d.nilai_pekerjaan);
  ctx.nilai_terbilang = spkTerbilangRupiah(d.nilai_pekerjaan);
  ctx.jangka_waktu_hari = (d.jangka_waktu!=null && d.jangka_waktu!=='') ? d.jangka_waktu : '';
  ctx.jangka_waktu_terbilang = spkTerbilang(d.jangka_waktu);
  ctx.tanggal_kontrak_pjg = spkDateLong(d.tanggal_kontrak);
  ctx.akhir_pekerjaan = d.tgl_akhir_kontrak || '';
  ctx.akhir_pekerjaan_pjg = spkDateLong(d.tgl_akhir_kontrak);
  ctx.hari_ttd = spkDayName(d.tanggal_kontrak);
  ctx.tgl_kontrak_num = spkDateNum(d.tanggal_kontrak);
  ctx.tgl_kontrak_terbilang = spkTglTerbilang(d.tanggal_kontrak);

  // ---- Sumber dana & dasar pengadaan (alias placeholder klausul/preamble) ----
  ctx.sumber_dana_no = d.no_anggaran || '';
  ctx.sumber_dana_tgl = d.tgl_anggaran || '';
  ctx.sumber_dana_tgl_pjg = spkDateLong(d.tgl_anggaran);
  ctx.jenis_pengadaan = d.jenis_anggaran || '';
  ctx.dasar_undangan_no = d.no_eproc || '';
  ctx.dasar_undangan_tgl = (function(){ var a=spkDateLong(d.pengumuman_awal), b=spkDateLong(d.pengumuman_akhir); return (a&&b)?(a+' s/d '+b):(a||b||''); })();
  ctx.dasar_penawaran_no = d.no_penawaran_penyedia || d.no_penawaran || '';
  ctx.dasar_penawaran_tgl_pjg = spkDateLong(d.tgl_penawaran);
  ctx.dasar_bapp_no = d.no_bapp || '';
  ctx.dasar_bapp_tgl_pjg = spkDateLong(d.tgl_bapp);
  ctx.dasar_bae_no = d.no_bae || '';
  ctx.dasar_bae_tgl_pjg = spkDateLong(d.tgl_bae);
  ctx.dasar_bakn_no = d.no_bakn || '';
  ctx.dasar_bakn_tgl_pjg = spkDateLong(d.tgl_bakn);

  // ---- Bentuk dokumen (Surat Perintah Kerja / Perjanjian/Kontrak) ----
  ctx.bentuk_kontrak = spkBentukOf(d);
  ctx.dok_label = spkDokLabel(d);      // huruf besar — kop & bab isi
  ctx.dok_title = spkDokTitle(d);      // huruf judul — cover & daftar isi
  ctx.metode_label = spkMetodeLabel(d);
  // ---- Kontak PLN Unit & Penyedia (Perjanjian/Kontrak) ----
  ctx.p1_telp = d.telp_unit || ''; ctx.p1_fax = d.fax_unit || ''; ctx.p1_email = d.email_unit || '';
  ctx.p2_telp = d.telp_penyedia || ''; ctx.p2_fax = d.fax_penyedia || ''; ctx.p2_email = d.email_penyedia || '';

  // ---- PIHAK PERTAMA (dari bidang SK Pimpinan Unit) ----
  ctx.p1_wakil = String(d.nama_pengguna||'').toUpperCase();   // selalu UPPERCASE di dokumen
  ctx.nama_pengguna = ctx.p1_wakil;
  ctx.p1_jabatan = d.jabatan_pengguna || '';
  ctx.p1_sk = d.no_sk || '';
  ctx.p1_sk_tgl = spkDateLong(d.tgl_sk);            // tgl Keputusan Direksi (format panjang)
  ctx.p1_nama_singkat = d.nama_unit || d.singkatan_unit || '';
  ctx.p1_nama = String(d.nama_unit||'').toUpperCase();
  ctx.p1_alamat = d.lokasi_unit || '';
  ctx.p1_akta = SPK_P1_AKTA_PLN;                    // profil PT PLN — teks tetap (statis)

  // ---- PIHAK KEDUA (dari bidang Informasi Penyedia) ----
  ctx.p2_nama = String(d.nama_perusahaan||'').toUpperCase();
  ctx.p2_nama_hormat = d.nama_perusahaan || '';
  ctx.p2_wakil = d.nama_pimpinan || '';
  ctx.p2_jabatan = d.jabatan_pimpinan || '';
  ctx.p2_alamat = d.lokasi_perusahaan || '';
  var _jp = spkJenisPerusahaan(d.nama_perusahaan);
  /* --- Akta Perubahan? menentukan tampilan bagian akta PIHAK KEDUA ---
     _adaAP benar bila: dipilih "Ya", ATAU (kontrak lama tanpa field ini) Rincian
     Akta Perubahan sudah diisi bukan teks default -> supaya output kontrak lama
     tetap sama. */
  var _aprRaw = String(d.akta_perubahan||'');
  var _aprDefault = (_aprRaw.trim()==='' || _aprRaw.trim()===String(SPK_DEF_AKTA_PERUBAHAN).trim());
  var _adaAPsel = String(d.ada_akta_perubahan||'');
  var _adaAP = (_adaAPsel==='Ya') || (_adaAPsel==='' && !_aprDefault);
  var _ap = String(d.akta_pendirian||'').replace(/\s+$/,'');
  /* "yang didirikan berdasarkan" + titik akhir = TEMPLATE BAKU pratinjau (bukan teks
     input). Buang bila terlanjur diketik / tersimpan pada data lama, lalu pasang sekali
     di depan; "akta" huruf kecil; titik akhir dipasok template, bukan input. */
  _ap = _ap.replace(/^\s*yang didirikan berdasarkan\s+/i, '');
  _ap = _ap.replace(/^\s*Akta Notaris/, 'akta Notaris');           /* rapikan kapital "Akta" data lama */
  _ap = _ap.replace(/[Aa]kta\s*-\s*[Aa]kta/g, 'akta-akta');        /* "Akta - akta"/"Akta-akta" → "akta-akta" */
  /* Tanpa akta perubahan -> buang frasa "beserta akta-akta Perubahannya"
     (termasuk spasi sebelum "beserta"); titik/spasi akhir dirapikan di bawah. */
  if(!_adaAP) _ap = _ap.replace(/\s*beserta\s+akta-akta\s+perubahan(?:nya)?\b\.?/i, '');
  _ap = _ap.replace(/[.\s]+$/,'');                                 /* titik/spasi akhir dibuang: titik dari template */
  if(_ap) _ap = 'yang didirikan berdasarkan ' + _ap + '.';
  ctx.p2_akta = (_jp? _jp+' ':'') + _ap;
  /* Rincian Akta Perubahan hanya ditulis bila "Akta Perubahan? = Ya" DAN isinya
     bukan teks default. Bila tidak, kosong -> klausul " berdasarkan ..." pada
     preamble otomatis hilang (kata "berdasarkan" kini menjadi bagian dari nilai). */
  if(_adaAP && !_aprDefault){
    var _aprv = _aprRaw.replace(/^\s*berdasarkan\s+/i, '').replace(/^\s*Akta Notaris/, 'akta Notaris').replace(/[.\s]+$/,'');
    ctx.p2_akta_jabatan = ' berdasarkan ' + _aprv;
  }else{
    ctx.p2_akta_jabatan = '';
  }

  // ---- Pembayaran ----
  ctx.bank_nama = d.nama_bank || '';
  ctx.rekening_no = d.no_rekening || '';
  ctx.rekening_atas_nama = d.pemilik_rekening || '';

  // ---- Uraian pekerjaan (opsional): kosong bila tidak diisi, sehingga butir
  //      yang bersangkutan otomatis hilang dari dokumen & penomoran menyesuaikan.
  ctx.latar_belakang = spkNarasiHtml(d.latar_belakang);
  ctx.permasalahan   = spkNarasiHtml(d.permasalahan);
  ctx.maksud_tujuan  = spkNarasiHtml(d.maksud_tujuan);

  // === Kode = nama field: pastikan {{key}} langsung menghasilkan output siap-dokumen ===
  // (tanggal → format panjang, nilai → Rupiah, field otomatis → nilai terhitung).
  // Kode turunan lama (mis. sumber_dana_tgl_pjg) tetap tersedia demi kompatibilitas.
  ['tgl_anggaran','pengumuman_awal','pengumuman_akhir','tgl_bapp','tgl_bae','tgl_bakn','tanggal_kontrak','tgl_akhir_kontrak','tgl_penawaran'].forEach(function(k){ if(ctx[k]) ctx[k]=spkDateLong(ctx[k]); });
  ctx.nilai_pekerjaan = (d.nilai_pekerjaan!==''&&d.nilai_pekerjaan!=null) ? spkRupiah(d.nilai_pekerjaan) : '';
  ctx.auto_terbilang_tgl   = spkAutoVal('terbilang_tgl', d);
  ctx.auto_tgl_strip       = spkAutoVal('tgl_strip', d);
  ctx.auto_terbilang_nilai = spkAutoVal('terbilang_nilai', d);
  ctx.auto_terbilang_jangka= spkAutoVal('terbilang_jangka', d);
  ctx.auto_jenis_perusahaan= spkAutoVal('jenis_perusahaan', d);
  ctx.jenis_perusahaan     = ctx.auto_jenis_perusahaan;

  return ctx;
}
/* Ganti semua {{key}} pada template dengan nilai konteks (sisa placeholder dikosongkan bila tak dikenal, dibiarkan bila kosong) */
/* "Sembuhkan" placeholder {{key}} yang PECAH oleh Word menjadi beberapa run.
   Saat klausul diketik/ditempel di Microsoft Word lalu diunggah, satu placeholder
   seperti {{jangka_waktu_hari}} sering dipecah Word menjadi beberapa run terpisah
   (mis. akibat penanda ejaan pada kata ber-"_" atau pemberian tebal sebagian).
   Konverter .docx -> HTML membungkus TIAP run tersendiri dalam <b>/<i>/<u>,
   sehingga hasilnya bisa berupa <b>{{</b><b>jangka_waktu_hari</b><b>}}</b>.
   Bila ada tag di antara kurung & nama field, regex merge di bawah tidak cocok
   dan placeholder tampil apa adanya (mentah) di dokumen. Fungsi ini menyatukan
   kembali {{ ... }} yang terpotong tag/spasi menjadi {{key}} yang bersih —
   format tebal/miring di LUAR placeholder tetap dipertahankan. */
function spkHealPlaceholders(html){
  return String(html==null?'':html).replace(
    /\{(?:<[^>]*>|\s)*\{([\s\S]*?)\}(?:<[^>]*>|\s)*\}/g,
    function(m, inner){
      var key = inner.replace(/<[^>]*>/g,'').replace(/\s+/g,'');
      return /^[a-zA-Z0-9_]+$/.test(key) ? '{{'+key+'}}' : m;
    }
  );
}
function spkMerge(tpl, ctx){
  /* Jabatan Direksi & Pengawas Pekerjaan selalu dicetak TEBAL pada dokumen
     (hanya berlaku bila klausul memakai placeholder {{jabatan_direksi}} /
     {{jabatan_pengawas}}; nilai kosong tidak dibungkus <b>). */
  var SPK_BOLD_FIELDS = { jabatan_direksi:1, jabatan_pengawas:1 };
  /* Rapikan dulu placeholder yang terpecah oleh Word agar {{key}} kembali utuh
     sebelum dicocokkan & diganti nilainya. */
  tpl = spkHealPlaceholders(tpl);
  return String(tpl||'').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, function(m,k){
    if(Object.prototype.hasOwnProperty.call(ctx,k)){
      var val=(ctx[k]==null?'':String(ctx[k]));
      if(val && SPK_BOLD_FIELDS[k]) return '<b>'+val+'</b>';
      return val;
    }
    return m;
  });
}
/* Ubah SEMUA penulisan "Nomor:" -> "No." pada isi kontrak (klausul & uraian).
   Dijalankan pada tahap render SETELAH merge, sehingga mencakup teks tetap,
   default field, maupun klausul yg diketik pengguna. Cover/kop/lampiran tidak
   diproses. Cocokkan "Nomor" + spasi opsional + ":" (case-insensitive). */
function spkNomorToNo(html){
  return String(html==null?'':html).replace(/Nomor\s*:/gi, 'No.');
}
/* Tebalkan SEMUA tulisan "PIHAK PERTAMA" & "PIHAK KEDUA" pada ISI KLAUSUL.
   Dipakai HANYA pada tahap render isi klausul — preamble, kop, footer berjalan,
   lampiran, & blok tanda tangan TIDAK diproses. Spasi asli antar-kata
   dipertahankan (termasuk &nbsp;). Penebalan ganda (bila teks sudah berada di
   dalam <b>) tidak masalah: web me-render bold sekali, dan konversi ke Word
   menelusuri DOM sehingga <b> bersarang tetap dihitung bold sekali. */
function spkBoldPihak(html){
  return String(html==null?'':html).replace(/PIHAK(\s+)(PERTAMA|KEDUA)/g, '<b>PIHAK$1$2</b>');
}
/* ===== Miringkan (italic) istilah ASING pada ISI KLAUSUL SPK =====
   Kaidah PUEBI: kata/istilah bahasa asing yang BELUM diserap ditulis MIRING;
   kata serapan yang SUDAH baku (mis. "sistem", "aktivitas", "risiko", "standar",
   "dokumen", "kontrak", "konstruksi", "spesifikasi") ditulis BIASA. Karena itu
   daftar di bawah HANYA memuat istilah yang masih asing — JANGAN memasukkan kata
   serapan baku ke sini. Silakan tambah/kurangi sesuai istilah yang lazim di
   dokumen Anda; frasa (>1 kata) otomatis dicek lebih dulu agar utuh.
   CATATAN: fungsi ini HANYA dipanggil pada render ISI KLAUSUL SPK (dokumen &
   pratinjau editor klausul) — tidak menyentuh preamble, kop, lampiran, tanda
   tangan, maupun menu lain. */
var SPK_ASING = [
  /* --- Frasa --- */
  'term of reference','scope of work','value engineering','bill of quantity',
  'purchase order','delivery order','quality control','quality assurance',
  'visual inspection','as built drawing','shop drawing','spare part',
  'force majeure','cable trench','unit price','man power','on site','site manager',
  'general arrangement','test report','punch list','joint inspection',
  /* --- Kata tunggal --- */
  'online','offline','output','input','software','hardware','password','username',
  'email','website','browser','server','database','backup','update','upgrade',
  'download','upload','setting','layout','checklist','review','meeting','deadline',
  'timeline','feedback','briefing','workshop','training','maintenance','support',
  'supplier','quotation','testing','commissioning','trial','standby','shutdown',
  'startup','milestone','deliverable','tools','trench','genset','handover',
  'overmacht','aanwijzing',
  /* --- Tambahan frasa asing (kontrak pengadaan) --- */
  'kick off meeting','kick off','kickoff','toolbox meeting','safety briefing',
  'progress report','daily report','weekly report','monthly report',
  'provisional hand over','final hand over','defect liability period',
  'material on site','joint survey','mutual check','site engineer',
  'field engineer','project manager','defect liability',
  /* --- Tambahan kata tunggal asing --- */
  'invoice','schedule','subcontractor','warranty','retention','defect',
  'housekeeping','mockup','rework','punchlist','staging','breakdown',
  /* --- Tata kelola, kepatuhan & anti-penyuapan (lazim pada klausul Definisi,
     Integritas, dan Anti Penyuapan dokumen Perjanjian/Kontrak) --- */
  'integrity due diligence','due diligence','good corporate governance',
  'code of conduct','conflict of interest','anti bribery','anti-bribery',
  'know your customer','risk assessment','business partner','third party',
  'whistle blowing system','whistle blowing','whistleblowing','whistleblower',
  'compliance','bribery','fraud','screening','stakeholder','red flag',
  'management system','top management','awareness','commitment',
  /* --- Istilah asing yang lazim pada Nama Pekerjaan (dimiringkan hanya saat Nama
     Pekerjaan tertulis di dalam isi klausul; "and" disertakan agar frasa asing
     tampil miring utuh, mis. "Equipment Safety and Healthy") --- */
  'equipment','safety','healthy','health','and','of','for','the'
];
var SPK_ASING_RE = null;
/* Bangun (sekali) satu regex gabungan; frasa/kata terpanjang diuji lebih dulu. */
function spkAsingRe(){
  if(SPK_ASING_RE) return SPK_ASING_RE;
  if(!Array.isArray(SPK_ASING) || !SPK_ASING.length){ SPK_ASING_RE=/(?!)/g; return SPK_ASING_RE; }
  var terms = SPK_ASING.slice().sort(function(a,b){ return b.length-a.length; });
  var parts = terms.map(function(t){
    /* antar-kata pada frasa boleh dipisah spasi biasa atau &nbsp; */
    return String(t).trim().split(/\s+/).map(function(w){
      return w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    }).join('(?:\\s|&nbsp;)+');
  });
  try{ SPK_ASING_RE = new RegExp('\\b(?:'+parts.join('|')+')\\b','gi'); }
  catch(e){ SPK_ASING_RE = /(?!)/g; }
  return SPK_ASING_RE;
}
/* Bungkus setiap istilah asing dengan <i>…</i> pada ISI KLAUSUL. Hanya menyentuh
   TEKS di luar tag HTML (atribut/tag dibiarkan), dan melewati teks yang sudah
   berada di dalam <i> agar tidak ada italic bertumpuk. Nama dibedakan dari
   spkItalicAsing (formatter narasi) agar keduanya tidak saling menimpa. */
function spkKlItalicAsing(html){
  var s = String(html==null?'':html);
  if(!s) return s;
  var re = spkAsingRe(); re.lastIndex = 0;
  var depthI = 0;
  return s.replace(/<[^>]+>|[^<]+/g, function(chunk){
    if(chunk.charAt(0)==='<'){
      var tag = chunk.toLowerCase();
      if(tag==='<i>' || /^<i[\s>]/.test(tag)) depthI++;
      else if(/^<\/i\s*>/.test(tag)) depthI = Math.max(0, depthI-1);
      return chunk;
    }
    if(depthI>0) return chunk;                 /* sudah di dalam <i> → jangan dibungkus lagi */
    return chunk.replace(re, function(m){ return '<i>'+m+'</i>'; });
  });
}
/* Rapikan pola "Label / : / nilai" (tiga paragraf berurutan) menjadi satu baris
   sejajar seperti tampilan Word — dipakai pada blok Nama/Lokasi Pekerjaan dsb. */
function spkTidyKeyValue(html){
  var src=spkFixLH(html);                                    /* rapikan spasi baris lama dulu */
  /* Margin (spasi sebelum/sesudah) paragraf sumber DIBAWA ke baris .spk-kv, supaya
     jarak yang diatur pengguna (mis. 12 pt setelah "Lokasi") tidak hilang & tidak
     menyusut menjadi 4 pt bawaan CSS. */
  function kvSty(attr){
    var m=/style\s*=\s*"([^"]*)"/i.exec(attr||''); if(!m) return '';
    var keep=String(m[1]).match(/margin-(?:top|bottom)\s*:\s*[^;"]+/gi);
    return keep ? (' style="'+keep.join(';')+'"') : '';
  }
  return String(src||'').replace(
    /<p class="kl0"([^>]*)>([^<:]{1,45})<\/p>\s*<p class="kl0"[^>]*>:<\/p>\s*<p class="kl0"([^>]*)>([^<]*)<\/p>/g,
    function(m, aK, k, aV, v){
      var sty=kvSty(aV) || kvSty(aK);
      return '<div class="spk-kv"'+sty+'><span class="k">'+k+'</span>'+
             '<span class="s">:</span><span class="v">'+v+'</span></div>';
    }
  );
}

/* ================= PENYIMPANAN (Supabase) ================= */
const SPK_KONTRAK_TABLE='kontrak_spk';
const SPK_KLAUSUL_TABLE='klausul_spk';
let records_spk=[];       // daftar kontrak tersimpan
let records_klausul=[];   // pustaka klausul (aktif & non-aktif)
function spkSupaReady(){ return !!(typeof USE_SUPABASE!=='undefined' && USE_SUPABASE && typeof db!=='undefined' && db); }

const StoreSpkKontrak={
  async list(){ if(!spkSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(SPK_KONTRAK_TABLE).select('*').order('created_at',{ascending:false}); if(error) throw error; return data||[]; },
  async create(rec){ if(!spkSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(SPK_KONTRAK_TABLE).insert(rec).select(); if(error) throw error; return data&&data[0]; },
  async update(id,rec){ if(!spkSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(SPK_KONTRAK_TABLE).update(rec).eq('id',id); if(error) throw error; },
  async remove(id){ if(!spkSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(SPK_KONTRAK_TABLE).delete().eq('id',id); if(error) throw error; }
};
const StoreSpkKlausul={
  async list(){ if(!spkSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(SPK_KLAUSUL_TABLE).select('*').order('urutan',{ascending:true}); if(error) throw error; return data||[]; },
  async create(rec){ if(!spkSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {data,error}=await db.from(SPK_KLAUSUL_TABLE).insert(rec).select(); if(error) throw error; return data&&data[0]; },
  async update(id,rec){ if(!spkSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(SPK_KLAUSUL_TABLE).update(rec).eq('id',id); if(error) throw error; },
  async remove(id){ if(!spkSupaReady()) throw new Error('Koneksi Supabase tidak tersedia');
    const {error}=await db.from(SPK_KLAUSUL_TABLE).delete().eq('id',id); if(error) throw error; }
};

/* =========================================================================
   PUSTAKA KLAUSUL — MILIK MASING-MASING KONTRAK (bukan global lagi)
   -------------------------------------------------------------------------
   * Kontrak BARU  -> pustaka selalu mulai dari BAWAAN: 3 klausul kosong.
   * Kontrak lama  -> dibuka lewat "Ubah": pustaka dimuat dari kontrak itu
                      sendiri (disimpan di data.__klausulLib), sehingga
                      menyunting klausul kontrak A tidak mengubah kontrak B.
   * Profil Klausul (Simpan/Muat Profil) tetap menjadi cara memakai ulang
     satu set klausul yang sudah jadi di kontrak mana pun.
   Tabel klausul_spk TIDAK dipakai lagi sebagai pustaka kerja (isi lamanya
   otomatis diselamatkan menjadi profil "Pustaka Lama" — lihat migrasi di bawah).
   ========================================================================= */
function spkKlUid(){ return 'kl_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
/* Pustaka bawaan: 3 klausul kosong */
function spkKlDefault(){ return SPK_KLAUSUL_SEED.map(s=>Object.assign({id:spkKlUid()}, s)); }
function spkSeedInMemory(){ records_klausul = spkKlDefault(); }
/* Simpan pustaka yang sedang tampil KE DALAM kontrak yang sedang disusun */
function spkKlSync(){
  if(!spkState) return;
  spkState.data = spkState.data || {};
  try{ spkState.data.__klausulLib = JSON.parse(JSON.stringify(records_klausul||[])); }catch(e){}
}
/* Muat pustaka milik sebuah kontrak tersimpan (atau bawaan bila belum ada) */
function spkKlLoadFor(rec){
  let lib=null;
  if(rec){
    const d=(rec.data && typeof rec.data==='object') ? rec.data : {};
    if(Array.isArray(d.__klausulLib) && d.__klausulLib.length) lib=d.__klausulLib;
    else if(Array.isArray(rec.klausul) && rec.klausul.length){
      // kontrak lama (sebelum pustaka per-kontrak): pakai klausul yang tercetak
      lib=rec.klausul.map((k,i)=>({ id:String(k.id||spkKlUid()), judul:k.judul||'', isi:k.isi||'',
                                    isi_docx:k.isi_docx||'', urutan:(i+1)*10, aktif:true }));
    }
  }
  if(lib && lib.length){
    try{ records_klausul = JSON.parse(JSON.stringify(lib)).map(k=>Object.assign({}, k, {id:String(k.id||spkKlUid())})); }
    catch(e){ records_klausul = spkKlDefault(); }
  }else{
    records_klausul = spkKlDefault();
  }
}
async function refreshDataSpk(){
  try{ records_spk=await StoreSpkKontrak.list(); }
  catch(err){ console.error('SPK kontrak:',err); records_spk=records_spk||[]; }
}
/* Tidak lagi membaca tabel klausul_spk — pustaka mengikuti kontrak yang aktif. */
async function refreshDataKlausul(){
  if(spkState && spkState.data && Array.isArray(spkState.data.__klausulLib) && spkState.data.__klausulLib.length){
    try{ records_klausul = JSON.parse(JSON.stringify(spkState.data.__klausulLib)); }catch(e){}
  }else if(!Array.isArray(records_klausul) || !records_klausul.length){
    records_klausul = spkKlDefault();
  }
}
/* ---- Penyelamat SEKALI-JALAN ----
   Pustaka klausul lama yang masih tersimpan di tabel klausul_spk disalin menjadi
   sebuah Profil bernama "Pustaka Lama" agar tidak hilang & tetap bisa dimuat
   kapan saja lewat tombol "Muat Profil". Tabel aslinya TIDAK dihapus. */
async function spkKlMigrateLibraryToProfile(){
  try{
    if(localStorage.getItem('spk_kl_lib_to_profile_v1')==='1') return;
    let rows=[];
    try{ rows=await StoreSpkKlausul.list(); }catch(e){ return; }   // DB tak siap -> coba lagi lain kali
    const berisi=(rows||[]).some(r=>String(r.isi||'').replace(/<[^>]+>/g,'').trim().length>0);
    if(rows && rows.length && berisi){
      const sudahAda=(profilesGet('klausul')||[]).some(p=>String(p.name||'').toLowerCase()==='pustaka lama');
      if(!sudahAda){
        const items=rows.map((k,i)=>({ judul:String(k.judul||''), isi:String(k.isi||''),
          urutan:(Number(k.urutan)||((i+1)*10)), aktif:(k.aktif!==false), isi_docx:String(k.isi_docx||'') }));
        await profilesUpsert('klausul', { name:'Pustaka Lama', savedAt:Date.now(), items:items, count:items.length });
        toast('Pustaka klausul lama disimpan sebagai profil "Pustaka Lama"','ok');
      }
    }
    localStorage.setItem('spk_kl_lib_to_profile_v1','1');
  }catch(err){ console.error('spkKlMigrateLibraryToProfile:', err); }
}
async function spkInit(){
  records_klausul = spkKlDefault();
  await refreshDataSpk();
  await spkKlMigrateLibraryToProfile();
  try{ rerenderActiveView(); }catch(e){}
}

/* ================= STATE PENYUSUNAN ================= */
let spkEditId=null;
let spkState=null;
let spkStep=1;
/* SK Pimpinan Unit — ambil data dari kontrak TERAKHIR DISIMPAN (records_spk urut
   terbaru lebih dulu). Dipakai sebagai nilai bawaan pada kontrak baru sehingga
   tidak perlu mengetik ulang; hanya diubah bila "Perubahan?" = Ya.
   Nilai bawaan ini juga DISIMPAN sebagai cadangan lokal (localStorage) supaya
   tetap muncul walau daftar kontrak (records_spk) belum selesai dimuat dari
   Supabase saat form kontrak baru dibuka — mencegah default "kadang muncul
   kadang tidak". */
const SPK_SK_DEF_CACHE='spk_sk_def_v1';
function spkSkCacheSave(o){
  try{
    if(o && SPK_SK_KEYS.some(k=>String(o[k]||'').trim()!=='')){
      localStorage.setItem(SPK_SK_DEF_CACHE, JSON.stringify(o));
    }
  }catch(e){}
}
function spkSkCacheLoad(){
  try{
    const s=localStorage.getItem(SPK_SK_DEF_CACHE);
    if(!s) return null;
    const o=JSON.parse(s);
    return (o && typeof o==='object') ? o : null;
  }catch(e){ return null; }
}
function spkLastSkData(){
  const out={};
  const list=(typeof records_spk!=='undefined' && Array.isArray(records_spk))?records_spk:[];
  for(let i=0;i<list.length;i++){
    const d=(list[i] && list[i].data && typeof list[i].data==='object')?list[i].data:null;
    if(!d) continue;
    const ada=SPK_SK_KEYS.some(k=>String(d[k]||'').trim()!=='');
    if(!ada) continue;
    SPK_SK_KEYS.forEach(k=>{ out[k]=d[k]!=null?d[k]:''; });
    spkSkCacheSave(out);            // simpan cadangan lokal
    return out;
  }
  // records_spk belum siap / kosong -> pakai cadangan terakhir yang tersimpan lokal
  const cached=spkSkCacheLoad();
  return cached || out;
}
/* Terapkan nilai bawaan SK Pimpinan Unit (data terakhir disimpan) ke sebuah objek data */
function spkApplyLastSk(data){
  const last=spkLastSkData();
  SPK_SK_KEYS.forEach(k=>{ if(last[k]!=null && String(last[k]).trim()!=='') data[k]=last[k]; });
  return data;
}
function spkBlankState(){
  const data={};
  SPK_FIELDS_FLAT.forEach(f=>{ data[f.k]= (f.def!=null? f.def : ''); });
  data.bentuk_kontrak='SPK';                 // bawaan: Surat Perintah Kerja
  /* Selama "Akta Perubahan?" BELUM dipilih "Ya" (termasuk keadaan bawaan / belum
     dipilih), frasa "beserta akta-akta Perubahannya" beserta spasi sebelumnya
     TIDAK ditampilkan pada Rincian Akta Pendirian. */
  data.akta_pendirian = spkAktaPendirianSync(data.akta_pendirian, data.ada_akta_perubahan);
  // SK Pimpinan Unit: default = data terakhir disimpan
  spkApplyLastSk(data);
  // default: semua klausul aktif terpilih
  const sel=records_klausul.filter(k=>k.aktif!==false).map(k=>String(k.id));
  return { data:data, sel:sel };
}
function spkRecordToState(rec){
  const base=spkBlankState();
  const data=Object.assign({}, base.data, (rec && rec.data && typeof rec.data==='object')?rec.data:{});
  // Kompatibilitas kontrak lama (tanpa field "Akta Perubahan?"): simpulkan pilihannya
  // dari isi Rincian Akta Perubahan — sudah diisi (bukan default) -> "Ya", selain itu
  // "Tidak" — agar tampilan form & pratinjau tetap konsisten.
  // Kontrak lama (sebelum fitur Bentuk Kontrak) selalu Surat Perintah Kerja
  if(!data.bentuk_kontrak) data.bentuk_kontrak='SPK';
  if(!data.ada_akta_perubahan){
    const _apr=String(data.akta_perubahan||'').trim();
    data.ada_akta_perubahan = (_apr!=='' && _apr!==String(SPK_DEF_AKTA_PERUBAHAN).trim()) ? 'Ya' : 'Tidak';
  }
  // Selaraskan frasa "beserta akta-akta Perubahannya" saat kontrak lama dibuka
  if(typeof spkAktaPendirianSync==='function')
    data.akta_pendirian = spkAktaPendirianSync(data.akta_pendirian, data.ada_akta_perubahan);
  let sel;
  if(rec && Array.isArray(rec.klausul) && rec.klausul.length){ sel=rec.klausul.map(k=>String(k.id)); }
  else sel=base.sel;
  return { data:data, sel:sel };
}

/* ================================================================
   LAMPIRAN SPK (Langkah 4 Penyusunan Kontrak)
   ----------------------------------------------------------------
   Tampilan mengikuti "Perhitungan HPS — Hitung HPS" (tabel uraian +
   rekapitulasi), hanya bar "Pilih/Ganti Analisa & Lepas Pilihan"
   diganti bar "Download Template / Upload Template" (gaya Monitoring).

   Data lampiran DISIMPAN DI DALAM spkState.data.__lampiran sehingga ikut
   tersimpan pada kolom jsonb `data` milik tabel kontrak_spk — tanpa perlu
   menambah kolom baru di database.
   ================================================================ */
function spkLampBlankItem(){ return {judul:'', subjudul:'', uraian:'', sat:'', vol:'', hargaMat:'', hargaJasa:''}; }
function spkLampNormItem(c){
  c=c||{};
  return {
    judul:c.judul||'', subjudul:c.subjudul||'', uraian:c.uraian||'',
    sat:c.sat||'', vol:(c.vol!=null?c.vol:''),
    hargaMat:(c.hargaMat!=null?c.hargaMat:''), hargaJasa:(c.hargaJasa!=null?c.hargaJasa:'')
  };
}
/* Ambil (dan pastikan ada) objek lampiran pada state kontrak yang aktif */
function spkLamp(){
  if(!spkState) spkState=spkBlankState();
  const d=spkState.data;
  let L=d.__lampiran;
  if(!L || typeof L!=='object' || !Array.isArray(L.items) || !L.items.length){
    L = { jumlahItem:1, items:[spkLampBlankItem()], hpsId:'', hpsNama:'', _ok:true };
    d.__lampiran=L;
  }
  if(!L._ok){                       // record lama dari DB: normalkan sekali saja
    L.items=L.items.map(spkLampNormItem);
    L.hpsId=L.hpsId||''; L.hpsNama=L.hpsNama||'';
    L._ok=true;
  }
  L.jumlahItem=L.items.length;
  return L;
}
/* Struktur Lampiran (Judul, Sub-Judul, Uraian, Sat, Vol) terisi otomatis & TERKUNCI
   bila Lampiran tertaut ke sebuah Perhitungan HPS. Harga Barang/Jasa tetap manual,
   karena harga memang tidak diambil dari HPS. */
function spkLampLocked(){ const L=spkLamp(); return !!(L && L.hpsId); }

/* --- Hitungan (sama persis dengan Perhitungan HPS) --- */
function spkLampNum(v){ if(v===''||v==null) return 0; if(typeof v==='number') return v; const n=parseFloat(String(v).replace(/,/g,'.')); return isNaN(n)?0:n; }
function spkLampRp(n){ n=Math.round(spkLampNum(n)); return n>0 ? ('Rp '+n.toLocaleString('id-ID')) : '–'; }
/* ===== Harga desimal (kolom Harga Barang/Jasa Lampiran) =====
   Menerima nilai desimal gaya Indonesia: koma = desimal, titik = ribuan.
   Disimpan sebagai ANGKA (Number). Contoh: "4.950,75" -> 4950.75. */
function spkHargaParse(v){
  if(v==null||v==='') return '';
  if(typeof v==='number') return isNaN(v)?'':v;
  var s=String(v).trim().replace(/[^0-9.,]/g,'');
  if(s==='') return '';
  var num;
  if(s.indexOf(',')>=0){
    var idx=s.indexOf(',');
    var ip=s.slice(0,idx).replace(/\./g,'').replace(/[^0-9]/g,'');
    var dp=s.slice(idx+1).replace(/[^0-9]/g,'').slice(0,2);
    num=parseFloat((ip||'0')+(dp?('.'+dp):''));
  } else if(/^\d{1,3}(\.\d{3})+$/.test(s)){
    num=parseFloat(s.replace(/\./g,''));
  } else {
    num=parseFloat(s);
  }
  return isNaN(num)?'':num;
}
/* Tampilkan angka harga sebagai "Rp 4.950" atau "Rp 4.950,75" (desimal bila ada). */
function spkHargaText(v){
  var n=spkHargaParse(v);
  if(n===''||n==null||isNaN(n)) return '';
  var dec=Number.isInteger(n)?0:Math.min(2,(String(n).split('.')[1]||'').length);
  return 'Rp '+Number(n).toLocaleString('id-ID',{minimumFractionDigits:dec,maximumFractionDigits:dec});
}
function spkLampMat(it){ return Math.round(jsVolNum(it&&it.vol)*spkLampNum(it&&it.hargaMat)); }
function spkLampJasa(it){ return Math.round(jsVolNum(it&&it.vol)*spkLampNum(it&&it.hargaJasa)); }
function spkLampTotal(it){ return spkLampMat(it)+spkLampJasa(it); }
function spkLampSummary(){
  const L=spkLamp();
  let jM=0,jJ=0;
  (L.items||[]).forEach(it=>{ jM+=spkLampMat(it); jJ+=spkLampJasa(it); });
  const jT=jM+jJ;
  const dppM=Math.round(jM*11/12), dppJ=Math.round(jJ*11/12), dppT=Math.round(jT*11/12);
  const ppnM=Math.round(dppM*0.12), ppnJ=Math.round(dppJ*0.12), ppnT=Math.round(dppT*0.12);
  return {jM,jJ,jT, dppM,dppJ,dppT, ppnM,ppnJ,ppnT, totM:jM+ppnM, totJ:jJ+ppnJ, totT:jT+ppnT};
}

/* --- Bar Template (gaya sama dengan Monitoring / Hari Libur) --- */
function spkLampTplBarHtml(){
  return '<div class="hl-tpl-bar" style="margin-top:0">'+
    '<div class="hl-tpl-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>'+
    '<div class="hl-tpl-txt"><b>Template Pengisian Lampiran</b><span>Unduh format Excel, isi data, lalu unggah kembali untuk mengisi seluruh baris lampiran sekaligus</span></div>'+
    '<div class="hl-tpl-actions">'+
      '<button class="btn btn-amber" onclick="spkLampDownloadTemplate()">'+
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'+
        ' Download Template'+
      '</button>'+
      '<button class="btn btn-teal" onclick="document.getElementById(\'spk-lamp-file\').click()">'+
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'+
        ' Upload Template'+
      '</button>'+
    '</div>'+
    '<input type="file" id="spk-lamp-file" accept=".xlsx,.xls" style="display:none" onchange="spkLampHandleUpload(event)">'+
  '</div>';
}

/* --- Field "Jumlah Barang/Jasa" (menambah / mengurangi baris) --- */
function spkLampCountFieldHtml(){
  const L=spkLamp();
  const lock=spkLampLocked();
  let opts='';
  for(let i=1;i<=150;i++) opts+='<option value="'+i+'"'+(L.items.length===i?' selected':'')+'>'+i+'</option>';
  const note=lock
    ? '<div class="hps-lock-note"><span>&#128274;</span><span>Judul, Sub-Judul, Uraian Pekerjaan, Sat &amp; Vol terisi otomatis &amp; terkunci dari Perhitungan HPS: <b>'+fkEsc(L.hpsNama||'')+'</b>. Harga Barang &amp; Jasa tetap diisi manual.</span></div>'
    : '';
  return '<div class="form-flow" style="--cols:4;margin-bottom:14px">'+
    '<div class="field"><label>Jumlah Barang/Jasa</label>'+
      '<select id="spk-lamp-jumlah" onchange="spkLampOnJumlah(this)"'+(lock?' disabled':'')+'>'+opts+'</select>'+
    '</div>'+
  '</div>'+note;
}
function spkLampOnJumlah(el){
  if(spkLampLocked()) return;   // jumlah item mengikuti HPS terpilih
  const n=Math.max(1,Math.min(150,parseInt(el.value,10)||1));
  const L=spkLamp(); const cur=L.items.slice(); const next=[];
  for(let i=0;i<n;i++) next.push(spkLampNormItem(cur[i]));
  L.items=next; L.jumlahItem=n;
  renderSpkSusun();
}

/* --- Tabel Uraian Lampiran (kolom persis seperti Perhitungan HPS) --- */
function spkLampTableHtml(){
  const L=spkLamp();
  const lock=spkLampLocked();
  const dis=lock?' disabled':'';                 // Judul/Sub-Judul/Uraian/Sat/Vol ikut HPS
  const clsL=lock?' hps-cell-locked':'';         // konvensi kunci yang sama dengan tabel HPS
  /* Lebar kolom No mengikuti yang TERPANJANG antara judul kolom ("No", 2 huruf)
     dan nomor baris terbesar — memakai rumus yang sama dengan dokumen HPS/Analisa
     (jsKolPx). Nomor di sini berurutan 1..N (bukan per-kelompok seperti jsWalk),
     jadi panjang maksimumnya = jumlah digit N. Tanpa ini lebarnya tetap 62px:
     terlalu lega untuk 9 item, dan terlalu sempit bila item > 99. */
  const noLen=Math.max(2, String(L.items.length).length);
  const noPx=jsKolPx(noLen);
  const noStyle=' style="width:'+noPx+'px;min-width:'+noPx+'px;max-width:'+noPx+'px"';
  let rows='';
  L.items.forEach((it,i)=>{
    rows+='<tr>'+
      '<td class="c-no"'+noStyle+'>'+(i+1)+'</td>'+
      '<td class="c-kel'+clsL+'"><input type="text" data-i="'+i+'" placeholder="mis. JASA EDIT DFD" value="'+fkEsc(it.judul||'')+'" oninput="spkLampOn(this,\'judul\')"'+dis+'></td>'+
      '<td class="c-kel'+clsL+'"><input type="text" data-i="'+i+'" placeholder="mis. Edit/Drawing" value="'+fkEsc(it.subjudul||'')+'" oninput="spkLampOn(this,\'subjudul\')"'+dis+'></td>'+
      '<td class="c-ur'+clsL+'"><textarea data-i="'+i+'" rows="1" placeholder="Uraian pekerjaan / barang / jasa ke-'+(i+1)+'" oninput="spkLampOn(this,\'uraian\')"'+dis+'>'+fkEsc(it.uraian||'')+'</textarea></td>'+
      '<td class="c-sat'+clsL+'"><input type="text" data-i="'+i+'" placeholder="Bh" value="'+fkEsc(it.sat||'')+'" oninput="spkLampOn(this,\'sat\')"'+dis+'></td>'+
      '<td class="c-vol'+clsL+'"><input type="text" inputmode="decimal" data-i="'+i+'" placeholder="0" value="'+fkEsc(it.vol!=null?String(it.vol):'')+'" oninput="spkLampOnVol(this)"'+dis+'></td>'+
      '<td class="c-money"><input type="text" inputmode="decimal" data-i="'+i+'" placeholder="Rp" value="'+spkHargaText(it.hargaMat)+'" oninput="spkLampOnHarga(this,\'hargaMat\')"></td>'+
      '<td class="c-money"><input type="text" inputmode="decimal" data-i="'+i+'" placeholder="Rp" value="'+spkHargaText(it.hargaJasa)+'" oninput="spkLampOnHarga(this,\'hargaJasa\')"></td>'+
    '</tr>';
  });
  return '<div class="hps-uraian-wrap"><table class="hps-uraian spk-lamp-tbl"><thead>'+
    '<tr><th class="c-no"'+noStyle+'>No</th><th class="c-kel">Judul</th><th class="c-kel">Sub-Judul</th>'+
      '<th class="c-ur">Uraian Pekerjaan</th><th class="c-sat">Sat</th><th class="c-vol">Vol</th>'+
      '<th class="c-money">Harga Barang</th><th class="c-money">Harga Jasa</th></tr>'+
    '</thead><tbody>'+rows+'</tbody></table></div>';
}
function spkLampOn(el,key){ if(spkLampLocked()) return; const L=spkLamp(); const i=+el.dataset.i; if(L.items[i]) L.items[i][key]=el.value; }
function spkLampOnVol(el){
  if(spkLampLocked()) return;
  let v=el.value.replace(/[^0-9.,]/g,''); el.value=v;
  const L=spkLamp(); const i=+el.dataset.i;
  if(L.items[i]){ L.items[i].vol=(v===''?'':String(jsVolNum(v))); spkLampRecalcRow(i); }
}
function spkLampOnHarga(el,key){
  var raw=el.value;
  var sel=(el.selectionStart!=null)?el.selectionStart:raw.length;
  var sigBefore=raw.slice(0,sel).replace(/[^0-9,]/g,'').length;
  var s=raw.replace(/[^0-9.,]/g,'');
  var hasComma=s.indexOf(',')>=0, ip, dp='';
  if(hasComma){ var idx=s.indexOf(','); ip=s.slice(0,idx).replace(/\./g,'').replace(/[^0-9]/g,''); dp=s.slice(idx+1).replace(/[^0-9]/g,'').slice(0,2); }
  else { ip=s.replace(/\./g,'').replace(/[^0-9]/g,''); }
  var out, numStr;
  if(ip==='' && !hasComma){ out=''; numStr=''; }
  else { var ipFmt=(ip==='')?'0':Number(ip).toLocaleString('id-ID'); out='Rp '+ipFmt+(hasComma?(','+dp):''); numStr=(ip||'0')+(dp?('.'+dp):''); }
  el.value=out;
  var L=spkLamp(); var i=+el.dataset.i;
  if(L.items[i]){ var num=(numStr==='')?'':parseFloat(numStr); if(numStr!=='' && isNaN(num)) num=''; L.items[i][key]=num; spkLampRecalcRow(i); }
  var pos=out.length, seen=0;
  if(sigBefore===0){ pos=(out.indexOf('Rp ')===0)?3:0; }
  else { for(var c=0;c<out.length;c++){ if(/[0-9,]/.test(out[c])){ seen++; if(seen===sigBefore){ pos=c+1; break; } } } }
  try{ el.setSelectionRange(pos,pos); }catch(e){}
}
function spkLampRecalcRow(i){
  const L=spkLamp(); const it=L.items[i]; if(!it) return;
  const c=document.getElementById('spk-lamp-jt-'+i); if(c) c.innerHTML=spkLampRp(spkLampTotal(it));
  spkLampRenderSummary();
  spkSyncNilaiPekerjaan();   // Nilai Pekerjaan (+ PPN) mengikuti Total Lampiran (setelah PPN)
}
/* Nilai Pekerjaan (+ PPN) pada kartu "Informasi Kontrak" TERKUNCI dan selalu
   mengambil Total Nilai Lampiran (setelah PPN) = spkLampSummary().totT.
   Bila Lampiran belum berisi nilai (total 0), nilai tersimpan TIDAK ditimpa kosong
   agar kontrak lama tanpa Lampiran tidak kehilangan nilainya. Memperbarui state,
   field terkunci di layar, dan "Terbilang Nilai Pekerjaan". */
function spkSyncNilaiPekerjaan(){
  if(!spkState) return 0;
  var tot=0; try{ tot=spkLampSummary().totT||0; }catch(e){ tot=0; }
  if(tot>0) spkState.data.nilai_pekerjaan=tot;
  var el=document.getElementById('spk-fld-nilai_pekerjaan');
  if(el){
    var shown=(tot>0)?tot:spkNum(spkState.data.nilai_pekerjaan);
    el.value=(shown>0)?('Rp '+Number(shown).toLocaleString('id-ID')):'';
  }
  if(typeof spkRefreshAuto==='function') spkRefreshAuto();
  return tot;
}

/* --- Rekapitulasi (sama seperti Perhitungan HPS) --- */
function spkLampSummaryPanelHtml(){
  return '<div class="hps-sum-card" id="spk-lamp-sum-card">'+
    '<div class="hps-sum-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16M4 9h16M4 14h10M4 19h7"/></svg>Rekapitulasi Nilai Lampiran</div>'+
    '<div id="spk-lamp-sum-body"></div></div>';
}
function spkLampRenderSummary(){
  const body=document.getElementById('spk-lamp-sum-body'); if(!body) return;
  const s=spkLampSummary();
  const row=(lbl,mat,jasa,tot,cls)=>'<tr'+(cls?' class="'+cls+'"':'')+'>'+
    '<td class="lbl">'+lbl+'</td>'+
    '<td class="val">'+spkLampRp(mat)+'</td>'+
    '<td class="val">'+spkLampRp(jasa)+'</td>'+
    '<td class="val">'+spkLampRp(tot)+'</td></tr>';
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
    '<div class="hps-terbilang"><b>Terbilang :</b> '+fkEsc(spkTerbilangRupiah(s.totT))+'</div>';
}

/* --- Download / Upload Template Lampiran (Excel) --- */
async function spkLampDownloadTemplate(){
  if(typeof requireInput==='function' && !requireInput()) return;
  if(!window.ExcelJS){ toast('Library Excel belum termuat, coba lagi','warn'); return; }
  const L=spkLamp();
  const head=['Judul','Sub-Judul','Uraian Pekerjaan','Sat','Vol','Harga Barang','Harga Jasa'];
  const wb=new ExcelJS.Workbook();
  const ws=wb.addWorksheet('Data');
  ws.columns=[{width:26},{width:24},{width:46},{width:10},{width:12},{width:18},{width:18}];
  const thin={style:'thin', color:{argb:'FFBFCAD0'}};
  const allBorder={top:thin,left:thin,bottom:thin,right:thin};
  ws.addRow(head);
  const headRow=ws.getRow(1); headRow.height=30;
  for(let c=1;c<=head.length;c++){
    const cell=ws.getCell(1,c);
    cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0E7C86'}};
    cell.font={bold:true,color:{argb:'FFFFFFFF'},size:11};
    cell.alignment={vertical:'middle',horizontal:'center',wrapText:true};
    cell.border=allBorder;
  }
  // Isi baris dengan data lampiran yang sudah ada (mempermudah penyuntingan massal)
  const maxRow=Math.max(200, L.items.length+1);
  for(let r=2;r<=maxRow+1;r++){
    const it=L.items[r-2];
    for(let c=1;c<=head.length;c++){
      const cell=ws.getCell(r,c);
      cell.border=allBorder;
      cell.alignment={vertical:'middle',wrapText:(c===3)};
      if(r%2===1) cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF2F7F8'}};
    }
    if(it){
      ws.getCell(r,1).value=it.judul||'';
      ws.getCell(r,2).value=it.subjudul||'';
      ws.getCell(r,3).value=it.uraian||'';
      ws.getCell(r,4).value=it.sat||'';
      ws.getCell(r,5).value=(it.vol===''||it.vol==null)?'':jsVolNum(it.vol);
      ws.getCell(r,6).value=(it.hargaMat===''||it.hargaMat==null)?'':spkLampNum(it.hargaMat);
      ws.getCell(r,7).value=(it.hargaJasa===''||it.hargaJasa==null)?'':spkLampNum(it.hargaJasa);
    }
    ws.getCell(r,6).numFmt='#,##0';
    ws.getCell(r,7).numFmt='#,##0';
  }
  /* --- Sheet tambahan "Ringkasan Nilai" (INFORMASI SAJA) ---
     Berisi Total Nilai Pekerjaan Sebelum & Setelah PPN, dihitung dengan RUMUS
     yang mengikuti PERSIS rekap Lampiran di pratinjau:
       - nilai per baris dibulatkan dulu: ROUND(Vol×HargaBarang)+ROUND(Vol×HargaJasa)
       - Jumlah (sebelum PPN) = jumlah seluruh baris
       - DPP = ROUND(Jumlah × 11/12) ; PPN = ROUND(DPP × 12%)
       - Total (setelah PPN) = Jumlah + PPN
     Sheet ini TIDAK dibaca kembali oleh website (hanya sheet "Data" yang dibaca). */
  const lastRow=maxRow+1;
  const ws2=wb.addWorksheet('Ringkasan Nilai');
  ws2.columns=[{width:42},{width:24}];
  ws2.mergeCells('A1:B1');
  const tCell=ws2.getCell('A1');
  tCell.value='RINGKASAN NILAI PEKERJAAN';
  tCell.font={bold:true,color:{argb:'FFFFFFFF'},size:12};
  tCell.alignment={vertical:'middle',horizontal:'center'};
  tCell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0E7C86'}};
  ws2.getRow(1).height=26;
  ws2.mergeCells('A2:B2');
  const nCell=ws2.getCell('A2');
  nCell.value='Informasi tambahan — dihitung otomatis dari sheet "Data". Tidak termasuk Lampiran SPK di website.';
  nCell.font={italic:true,color:{argb:'FF6B7A80'},size:9};
  nCell.alignment={vertical:'middle',horizontal:'left',wrapText:true};
  ws2.getRow(2).height=24;
  const thin2={style:'thin',color:{argb:'FFBFCAD0'}};
  const bd2={top:thin2,left:thin2,bottom:thin2,right:thin2};
  const sumBefore=
    'SUMPRODUCT(ROUND(IFERROR(Data!$E$2:$E$'+lastRow+'*Data!$F$2:$F$'+lastRow+',0),0))'+
    '+SUMPRODUCT(ROUND(IFERROR(Data!$E$2:$E$'+lastRow+'*Data!$G$2:$G$'+lastRow+',0),0))';
  const mkRow=(r,label,formula,strong)=>{
    const a=ws2.getCell(r,1), b=ws2.getCell(r,2);
    a.value=label; a.font={bold:true,color:{argb: strong?'FF0E7C86':'FF1C1C1C'}}; a.alignment={vertical:'middle'};
    b.value={formula:formula}; b.numFmt='"Rp"#,##0'; b.font={bold:!!strong}; b.alignment={vertical:'middle',horizontal:'right'};
    if(strong){ a.fill=b.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFEAF6F7'}}; }
    a.border=b.border=bd2;
  };
  mkRow(4,'Total Nilai Pekerjaan (Sebelum PPN)', sumBefore, false);
  mkRow(5,'Total Nilai Pekerjaan (Setelah PPN)', 'B4+ROUND(ROUND(B4*11/12,0)*0.12,0)', true);
  const buf=await wb.xlsx.writeBuffer();
  const blob=new Blob([buf],{type:'application/octet-stream'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download='Template_Lampiran_SPK.xlsx';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
}
function spkLampHandleUpload(ev){
  if(typeof requireInput==='function' && !requireInput()){ ev.target.value=''; return; }
  const file=ev.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});
      const sheetName=wb.SheetNames.includes('Data')?'Data':wb.SheetNames[0];
      const sheetRows=XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{header:1,defval:''});
      if(sheetRows.length<2){ toast('File kosong / tidak ada data','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      const items=[];
      for(let r=1;r<sheetRows.length;r++){
        const row=sheetRows[r]||[];
        if(row.every(c=>String(c).trim()==='')) continue;
        items.push(spkLampNormItem({
          judul:String(row[0]==null?'':row[0]).trim(),
          subjudul:String(row[1]==null?'':row[1]).trim(),
          uraian:String(row[2]==null?'':row[2]).trim(),
          sat:String(row[3]==null?'':row[3]).trim(),
          vol:(String(row[4]).trim()==='')?'':String(jsVolNum(row[4])),
          hargaMat:(String(row[5]).trim()==='')?'':spkHargaParse(row[5]),
          hargaJasa:(String(row[6]).trim()==='')?'':spkHargaParse(row[6])
        }));
      }
      if(!items.length){ toast('Tidak ada baris data untuk diimpor','warn', TOAST_MS_UPLOAD); ev.target.value=''; return; }
      if(items.length>150){ toast('Maksimal 150 baris lampiran','warn'); ev.target.value=''; return; }
      const L=spkLamp();
      L.items=items; L.jumlahItem=items.length;
      renderSpkSusun();
      toast(items.length+' baris lampiran berhasil dimuat','ok');
    }catch(err){ console.error(err); toast('Gagal membaca file Excel','warn', TOAST_MS_UPLOAD); }
    ev.target.value='';
  };
  reader.readAsArrayBuffer(file);
}

/* ================= PILIH PEKERJAAN (Langkah 1 — Data Mail Merge) =================
   Sumber: Data Pekerjaan. Setelah dipilih, Lampiran (Judul/Sub-Judul/Uraian/Sat/Vol)
   terisi otomatis dari Perhitungan HPS pekerjaan yang sama. Harga Barang, Harga Jasa,
   & Jumlah Total SENGAJA tidak ikut terisi — diisi manual sesuai harga kontrak. */
function spkCariHps(dpId, nama){
  const list=(typeof records_hps!=='undefined' && records_hps)?records_hps:[];
  let rec=null;
  if(dpId) rec=list.find(r=>String((((r.state&&r.state.info)||{}).dpId)||'')===String(dpId))||null;
  if(!rec && nama){
    const nm=String(nama).trim().toLowerCase();
    rec=list.find(r=>String(r.nama_pekerjaan||'').trim().toLowerCase()===nm)||null;
  }
  return rec;
}
/* ---------- Tautan ke PENETAPAN NOMOR ----------
   Nomor & tanggal BA Pembukaan Penawaran, BA Evaluasi Penawaran, serta BA
   Klarifikasi dan Negosiasi diambil PERSIS dari nomor yang sudah ditetapkan pada
   menu Penetapan > Ambil Nomor (dicocokkan berdasarkan Nama Pekerjaan).
   Bila ditemukan, field-field tersebut terisi otomatis dan DIKUNCI. */
const SPK_PN_MAP = [
  {no:'no_bapp', tgl:'tgl_bapp', keys:['BAPP','T_BAPP','T_BAPP_S1']},
  {no:'no_bae',  tgl:'tgl_bae',  keys:['BAE','T_BAEP','T_BAEP_S1','T_BAEP_S2']},
  {no:'no_bakn', tgl:'tgl_bakn', keys:['BAKN']}
];
/* Pemetaan untuk PERJANJIAN/KONTRAK (tender): dokumen Sampul 1 & Sampul 2
   dipisah, ditambah Penjelasan, Hasil Pengadaan & Usulan Calon Pemenang.
   Field yang belum punya padanan di Penetapan Nomor (BA Pembukaan Penawaran
   Sampul 2, Penetapan Penyedia, SPPBJ) tetap diisi manual. */
const SPK_PN_MAP_PK = [
  {no:'no_bapj',  tgl:'tgl_bapj',  keys:['T_BAP','BAP']},
  {no:'no_bapp',  tgl:'tgl_bapp',  keys:['T_BAPP_S1','T_BAPP','BAPP']},
  {no:'no_bae',   tgl:'tgl_bae',   keys:['T_BAEP_S1','T_BAEP','BAE']},
  {no:'no_bae2',  tgl:'tgl_bae2',  keys:['T_BAEP_S2']},
  {no:'no_bakn',  tgl:'tgl_bakn',  keys:['T_BAKN','BAKN']},
  {no:'no_bahp',  tgl:'tgl_bahp',  keys:['T_BAHP']},
  {no:'no_ucp',   tgl:'tgl_ucp',   keys:['T_UCP']}
];
/* Pemetaan aktif mengikuti Bentuk Kontrak yang sedang dipilih */
function spkPnMap(){ return (spkBentuk()==='PK') ? SPK_PN_MAP_PK : SPK_PN_MAP; }
function spkPnDocs(nama){
  const key=String(nama||'').trim().toLowerCase();
  if(!key) return [];
  const rows=(typeof records_penetapan!=='undefined' && Array.isArray(records_penetapan))?records_penetapan:[];
  let docs=[];
  rows.filter(r=>String(r.nama_pekerjaan||'').trim().toLowerCase()===key)
      .forEach(r=>{ if(Array.isArray(r.dokumen)) docs=docs.concat(r.dokumen); });
  return docs;
}
/* Isi & kunci field BA dari Penetapan Nomor. Mengembalikan jumlah field terisi. */
function spkApplyPenetapan(nama){
  const d=spkState.data;
  const docs=spkPnDocs(nama);
  const lock=[];
  spkPnMap().forEach(m=>{
    let doc=null;
    for(let i=0;i<m.keys.length && !doc;i++) doc=docs.find(x=>String(x.key)===m.keys[i])||null;
    if(!doc) return;
    if(doc.no){ d[m.no]=doc.no; lock.push(m.no); }
    if(doc.tgl_terbit){ d[m.tgl]=doc.tgl_terbit; lock.push(m.tgl); }
  });
  d.__pnLock=lock;
  return lock.length;
}
function spkPnLocked(k){
  const d=(spkState&&spkState.data)||{};
  return Array.isArray(d.__pnLock) && d.__pnLock.indexOf(k)>=0;
}
async function spkApplyDp(rec){
  if(!spkState) spkState=spkBlankState();
  const d=spkState.data;
  const info=(rec.state&&rec.state.info)||{};
  d.__dpId=String(rec.id);
  d.__dpNama=rec.nama_pekerjaan||info.nama||'';
  // Isi field Mail Merge yang bersumber dari Data Pekerjaan (tetap dapat disunting)
  const nama=info.nama||rec.nama_pekerjaan||'';
  if(nama) d.nama_pekerjaan=nama;
  if(info.lokasi) d.lokasi_pekerjaan=info.lokasi;
  if(info.no_anggaran) d.no_anggaran=info.no_anggaran;
  if(info.tgl_anggaran) d.tgl_anggaran=info.tgl_anggaran;
  if(info.jenis_anggaran) d.jenis_anggaran=info.jenis_anggaran;
  // Bidang Pelaksana SELALU mengikuti Data Pekerjaan terpilih (dikosongkan bila
  // Data Pekerjaan tsb belum mengisinya, agar tidak membawa sisa pilihan lama).
  d.pelaksana = info.bidang_pelaksana || '';
  if(info.metode) d.metode_pengadaan=info.metode;
  // Nomor & tanggal BA (Pembukaan, Evaluasi, Klarifikasi & Negosiasi) dari Penetapan Nomor
  let pnCount=0;
  try{ await refreshDataPenetapan(); }catch(e){}
  try{ pnCount=spkApplyPenetapan(d.__dpNama); }catch(e){ console.error(e); }
  // Tarik Lampiran dari Perhitungan HPS (tanpa harga)
  try{ await refreshDataHps(); }catch(e){}
  const hpsRec=spkCariHps(d.__dpId, d.__dpNama);
  const L=spkLamp();
  if(hpsRec){
    const hSt=hpsRecordToState(hpsRec);
    const items=(hSt.items||[]).map(it=>spkLampNormItem({
      judul:it.judul||'', subjudul:it.subjudul||'', uraian:it.uraian||'',
      sat:it.sat||'', vol:(it.vol!=null?it.vol:''),
      hargaMat:'', hargaJasa:''      // harga tidak diambil dari HPS
    }));
    L.items = items.length?items:[spkLampBlankItem()];
    L.jumlahItem=L.items.length;
    L.hpsId=String(hpsRec.id);
    L.hpsNama=hpsRec.nama_pekerjaan||nama;
    // Ikuti pengaturan penomoran Judul/Sub-Judul dari HPS agar nomor pada
    // dokumen Lampiran SPK identik dengan dokumen HPS.
    L.judulOn    = (hSt.judulOn==='Ya')?'Ya':'Tidak';
    L.judulNum   = jsNumStyleOk(hSt.judulNum,'');
    L.subjudulOn = (hSt.subjudulOn==='Ya')?'Ya':'Tidak';
    L.subjudulNum= jsNumStyleOk(hSt.subjudulNum,'');
    toast('Data pekerjaan berhasil diterapkan — Lampiran terisi otomatis dari Perhitungan HPS','ok');
  }else{
    L.hpsId=''; L.hpsNama='';
    toast('Data pekerjaan berhasil diterapkan. Belum ada data HPS untuk pekerjaan ini — isi Lampiran manual.','warn');
  }
  if(pnCount) toast('Nomor & tanggal BA terisi otomatis dari Penetapan Nomor (terkunci)','ok');
  else toast('Belum ada nomor BA pada Penetapan untuk pekerjaan ini — isi manual','warn');
  renderSpkSusun();
}
/* Batalkan pilihan: tautan dilepas, isian yang sudah diketik TIDAK dihapus */
function spkLepasDp(){
  if(!spkState) return;
  const d=spkState.data;
  delete d.__dpId; delete d.__dpNama;
  delete d.__pnLock;                       // field BA dari Penetapan kembali terbuka
  const L=spkLamp(); L.hpsId=''; L.hpsNama='';
  delete L.judulOn; delete L.judulNum; delete L.subjudulOn; delete L.subjudulNum;
  renderSpkSusun();
  toast('Pilihan pekerjaan dibatalkan (isian tetap dipertahankan)','ok');
}

/* ================= HALAMAN: PENYUSUNAN KONTRAK ================= */
function openSpkSusun(){ if(!spkState) spkState=spkBlankState(); spkStep=1; renderSpkSusun(); showView('spk-susun'); }
async function spkNewKontrak(){
  spkEditId=null;
  // segarkan daftar kontrak agar default SK Pimpinan Unit = data TERAKHIR disimpan
  try{ await refreshDataSpk(); }catch(e){}
  // Pustaka klausul milik kontrak ini: SELALU mulai dari bawaan (3 klausul kosong)
  records_klausul = spkKlDefault();
  spkKlProfil.active=''; spkKlProfil.backup=null;
  spkPyProfil.active=''; spkPyProfil.backup=null;
  spkState=spkBlankState();
  spkKlSync();
  resetInputBaru('spk');           // kontrak baru: tanpa pilihan pekerjaan & tautan HPS
  spkStep=1; renderSpkSusun(); showView('spk-susun');
}

/* Nilai field otomatis (read-only) berdasarkan data induk */
function spkJenisPerusahaan(nama){
  var up=String(nama||'').trim().toUpperCase();
  if(!up) return '';
  if(/^PT\.?(\s|$)/.test(up)) return 'Perusahaan Berbadan Hukum';
  if(/^CV\.?(\s|$)/.test(up)) return 'Persekutuan Komanditer';
  if(/^FA\.?(\s|$)/.test(up)) return 'Persekutuan Firma';
  return '';
}
function spkAutoVal(kind, data){
  data=data||{};
  switch(kind){
    case 'terbilang_tgl': { var iso=data.tanggal_kontrak; if(!iso) return ''; var hr=spkDayName(iso); return (hr?hr+', ':'')+'tanggal '+spkTglTerbilang(iso); }
    case 'tgl_strip': return data.tanggal_kontrak? spkDateNum(data.tanggal_kontrak) : '';
    case 'tgl_akhir': { var isoA=spkComputeTglAkhir(data); if(!isoA) return ''; var qa=isoA.split('-'); return qa[2]+'/'+qa[1]+'/'+qa[0]; }
    case 'terbilang_nilai': return (data.nilai_pekerjaan!==''&&data.nilai_pekerjaan!=null)? spkTerbilangRupiah(data.nilai_pekerjaan) : '';
    case 'terbilang_jangka': return (data.jangka_waktu!==''&&data.jangka_waktu!=null&&spkNum(data.jangka_waktu)>0)? spkTerbilang(data.jangka_waktu) : '';
    case 'jenis_perusahaan': return spkJenisPerusahaan(data.nama_perusahaan);
    default: return '';
  }
}
/* Segarkan nilai semua field otomatis di DOM tanpa render ulang penuh */
function spkRefreshAuto(){
  if(!spkState) return;
  // Tgl. Akhir Kontrak dihitung otomatis (Tgl. Awal + Jangka Waktu) & disimpan ke state
  spkState.data.tgl_akhir_kontrak = spkComputeTglAkhir(spkState.data);
  SPK_FIELDS_FLAT.forEach(function(f){
    if(!f.auto) return;
    var el=document.getElementById('spk-fld-'+f.k);
    if(el) el.value=spkAutoVal(f.auto, spkState.data);
  });
}
const SPK_LOCK_OVL = '<span class="lock-overlay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Data terkunci</span>';
/* Label field Mail Merge — chip KODE placeholder ({{key}}) DIHILANGKAN dari tampilan
   agar form lebih bersih. Tautan klausul → data tetap memakai kode {{key}} di balik
   layar (tidak berubah); daftar lengkap nama field & kodenya ada di berkas Excel
   "Daftar Field & Chip Code Mail Merge SPK". */
function spkLbl(f){
  /* Sebagian field memakai nama berbeda pada Perjanjian/Kontrak (mis. "No. Kontrak"
     menjadi "No. Kontrak PIHAK PERTAMA"). Nama alternatif ditulis pada f.lPk. */
  return fkEsc((spkIsPk() && f.lPk) ? f.lPk : f.l);
}
function spkCopyCode(k){
  const t='{{'+k+'}}';
  try{ navigator.clipboard.writeText(t).then(function(){ toast('Kode '+t+' disalin','ok'); },function(){ toast('Kode: '+t,'info'); }); }
  catch(e){ toast('Kode: '+t,'info'); }
}
/* ===== Sorotan placeholder pada textarea Akta =====
   Teknik overlay: satu lapisan latar (backdrop) menampilkan salinan teks dengan
   bagian "( ... )" berwarna MERAH; textarea di atasnya dibuat transparan (kursor
   tetap terlihat). Begitu placeholder diganti — tanda kurung hilang — teksnya
   otomatis menjadi HITAM. CSS-nya disuntik sekali agar cukup ganti app.js saja. */
function spkAktaHlHtml(text){
  var esc=fkEsc(String(text==null?'':text));
  esc=esc.replace(/\([^)]*\)/g, function(m){ return '<span class="spk-hl-red">'+m+'</span>'; });
  if(/\n$/.test(esc)) esc+=' ';   // jaga tinggi baris terakhir bila diakhiri newline
  return esc || '&nbsp;';
}
function spkAktaHlAutoGrow(el){
  if(!el || el.offsetParent===null) return;   // lewati bila belum tampil (scrollHeight belum valid)
  el.style.height='auto';
  el.style.height=(el.scrollHeight+2)+'px';   // +2 = tebal border atas & bawah (border-box)
}
function spkAktaHlInput(el,k){
  spkSet(k, el.value);
  spkAktaHlAutoGrow(el);
  var bd=document.getElementById('spk-hlbd-'+k);
  if(bd) bd.innerHTML=spkAktaHlHtml(el.value);
}
/* Setel tinggi awal semua textarea bersorot agar pas isi. Ditunda ke frame berikutnya
   karena render bisa terjadi saat halaman masih tersembunyi (tinggi belum terukur). */
function spkHlInitAll(){
  var run=function(){ var els=document.querySelectorAll('.spk-hl-input'); for(var i=0;i<els.length;i++) spkAktaHlAutoGrow(els[i]); };
  if(typeof requestAnimationFrame==='function') requestAnimationFrame(run); else setTimeout(run,0);
}
function spkEnsureHlStyle(){
  if(document.getElementById('spk-hl-style')) return;
  var css=
    '.spk-hlwrap{position:relative;width:100%}'+
    '.spk-hlwrap .spk-hl-backdrop,.spk-hlwrap .spk-hl-input{'+
      "font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.55;"+
      'padding:10px 12px;border:1px solid transparent;border-radius:11px;'+
      'box-sizing:border-box;width:100%;margin:0;letter-spacing:normal;text-align:left;'+
      'white-space:pre-wrap;overflow-wrap:break-word;word-break:normal}'+
    '.spk-hlwrap .spk-hl-backdrop{position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;'+
      'pointer-events:none;overflow:hidden;background:linear-gradient(180deg,#ffffff,#fafdfe);color:#12242b}'+
    '.spk-hlwrap .spk-hl-backdrop .spk-hl-red{color:#E5484D;font-weight:600}'+
    '.spk-hlwrap .spk-hl-input{position:relative;z-index:2;display:block;resize:none;overflow:hidden;min-height:78px;'+
      'color:transparent;-webkit-text-fill-color:transparent;caret-color:#12242b;'+
      'background:transparent;border-color:#cdd9de;'+
      'box-shadow:0 1px 2px rgba(16,40,50,.06),inset 0 1px 0 rgba(255,255,255,.6)}'+
    '.spk-hlwrap .spk-hl-input:focus{outline:none;border-color:var(--teal);background:transparent;'+
      'box-shadow:0 0 0 3px rgba(14,124,134,.16),0 4px 12px rgba(14,124,134,.16)}'+
    '.spk-hlwrap:focus-within .spk-hl-backdrop{background:#fff}'+
    '.spk-hlwrap .spk-hl-input::selection{background:rgba(14,124,134,.20);color:transparent;-webkit-text-fill-color:transparent}'+
    '.spk-hlwrap .spk-hl-input::-moz-selection{background:rgba(14,124,134,.20);color:transparent}';
  var st=document.createElement('style'); st.id='spk-hl-style'; st.textContent=css;
  (document.head||document.documentElement).appendChild(st);
}
/* ===== Validasi No. Kontrak ganda (Penyusunan Kontrak — SPK) =====
   Bila No. Kontrak yang diketik SUDAH pernah disimpan/dipakai pada kontrak lain,
   field diberi bingkai merah + pesan "No. Kontrak sudah digunakan" di bawahnya.
   Kontrak yang sedang diedit (spkEditId) dikecualikan agar nomornya sendiri tidak
   dianggap ganda. Pembandingan tidak sensitif huruf besar/kecil & spasi tepi. */
function spkNoKontrakDup(val){
  var v=String(val==null?'':val).trim().toLowerCase();
  if(!v) return false;
  var list=(typeof records_spk!=='undefined'&&Array.isArray(records_spk))?records_spk:[];
  var editId=(typeof spkEditId!=='undefined')?spkEditId:null;
  for(var i=0;i<list.length;i++){
    var r=list[i]; if(!r) continue;
    if(editId!=null && String(r.id)===String(editId)) continue;
    if(String(r.nomor_kontrak||'').trim().toLowerCase()===v) return true;
  }
  return false;
}
function spkCheckNoKontrak(){
  var el=document.getElementById('spk-fld-nomor_kontrak');
  var msg=document.getElementById('spk-nokontrak-msg');
  if(!el) return false;
  var dup=spkNoKontrakDup(spkState?spkState.data.nomor_kontrak:'');
  if(dup){ el.classList.add('spk-dup-input'); if(msg) msg.style.display=''; }
  else{ el.classList.remove('spk-dup-input'); if(msg) msg.style.display='none'; }
  return dup;
}
function spkEnsureDupStyle(){
  if(document.getElementById('spk-dup-style')) return;
  var css=
    'input.spk-dup-input{border-color:#E5484D !important;background:#fff5f5 !important;'+
      'box-shadow:0 0 0 3px rgba(229,72,77,.15) !important}'+
    'input.spk-dup-input:focus{border-color:#E5484D !important;'+
      'box-shadow:0 0 0 3px rgba(229,72,77,.22) !important}'+
    '.spk-dup-msg{display:flex;align-items:center;gap:5px;margin-top:6px;'+
      'color:#E5484D;font-size:11.5px;font-weight:600;line-height:1.3}';
  var st=document.createElement('style'); st.id='spk-dup-style'; st.textContent=css;
  (document.head||document.documentElement).appendChild(st);
}
function spkFieldInput(f){
  const v = spkState.data[f.k];
  // 4 field per baris; kecuali Rincian Akta Pendirian & Perubahan yang 2 field per baris
  const span = (f.k==='akta_pendirian'||f.k==='akta_perubahan') ? ' style="flex:1 1 calc(50% - 15px)"'
             : (f.t==='narasi') ? ' style="flex:1 1 100%"' : '';
  // Field terkunci: nilai TETAP TAMPIL namun tidak dapat diedit (readonly). Tanggal
  // ditampilkan dd/mm/yyyy agar terbaca sebagai teks biasa.
  const spkDispDate=(x)=>{ const p=String(x||'').split('-'); return (p.length===3)?(p[2]+'/'+p[1]+'/'+p[0]):(x||''); };
  const lockedField=(disp)=> '<div class="field"'+span+'><label>'+spkLbl(f)+'</label>'+
    '<input type="text" id="spk-fld-'+f.k+'" value="'+fkEsc(disp)+'" readonly '+
    'style="background:#f3f5f7;color:#2b2f36;cursor:not-allowed" '+
    'title="Terisi otomatis — tidak dapat diubah di sini"></div>';
  // Nilai Pekerjaan (+ PPN): TERKUNCI, otomatis = Total Nilai Lampiran (setelah PPN).
  if(f.k==='nilai_pekerjaan'){
    var _tot=0; try{ _tot=spkLampSummary().totT||0; }catch(e){ _tot=0; }
    if(_tot>0) spkState.data.nilai_pekerjaan=_tot;
    var _nv=(_tot>0)?_tot:spkNum(spkState.data.nilai_pekerjaan);
    var _disp=(_nv>0)?('Rp '+Number(_nv).toLocaleString('id-ID')):'';
    return '<div class="field"'+span+'><label>'+spkLbl(f)+'</label>'+
      '<input type="text" id="spk-fld-'+f.k+'" value="'+fkEsc(_disp)+'" readonly '+
      'style="background:#f3f5f7;color:#2b2f36;cursor:not-allowed" '+
      'title="Terisi otomatis dari Total Nilai Lampiran (setelah PPN) — tidak dapat diubah di sini"></div>';
  }
  // No. Kontrak: tandai MERAH + pesan bila nomor sudah pernah disimpan/dipakai.
  if(f.k==='nomor_kontrak'){
    spkEnsureDupStyle();
    var _dupNK=spkNoKontrakDup(v);
    return '<div class="field"'+span+'><label>'+spkLbl(f)+'</label>'+
      '<input type="text" id="spk-fld-nomor_kontrak"'+(_dupNK?' class="spk-dup-input"':'')+' value="'+fkEsc(v||'')+'"'+(f.ph?(' placeholder="'+fkEsc(f.ph)+'"'):'')+' oninput="spkSet(\''+f.k+'\',this.value);spkCheckNoKontrak()">'+
      '<div class="spk-dup-msg" id="spk-nokontrak-msg"'+(_dupNK?'':' style="display:none"')+'>'+
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:13px;height:13px;flex:0 0 auto"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'+
        'No. Kontrak sudah digunakan</div>'+
    '</div>';
  }
  if(f.auto){
    // Field otomatis: nilai dihitung otomatis di belakang layar; tampil terbaca
    // namun tidak dapat diedit.
    const av = spkAutoVal(f.auto, spkState.data);
    return lockedField(av);
  }
  // Field yang terisi otomatis dari Penetapan Nomor (No./Tgl. BA) -> terkunci
  if(spkPnLocked(f.k)){
    return lockedField(f.t==='date'?spkDispDate(v):(v||''));
  }
  // Field yang terisi otomatis dari Data Pekerjaan (Nama/Lokasi/Bidang/Jenis/No. &
  // Tgl. Anggaran/Metode Pengadaan) -> terkunci selama sebuah Data Pekerjaan tertaut.
  // Pengecualian: bila Data Pekerjaan belum mengisi Bidang Pelaksana, field tidak
  // dikunci kosong — dropdown tetap ditampilkan agar dapat dipilih manual.
  if(f.dpLock && spkState.data.__dpId && !(f.k==='pelaksana' && !String(v||'').trim())){
    return lockedField(f.t==='date'?spkDispDate(v):(v||''));
  }
  if(f.t==='select'){
    const opts=(f.opts||[]).map(o=>'<option value="'+fkEsc(o)+'"'+((v===o)?' selected':'')+'>'+fkEsc(o)+'</option>').join('');
    const fn = (f.k==='perubahan') ? 'spkSetPerubahan(this.value)'
             : (f.k==='ada_akta_perubahan') ? 'spkSetAdaAktaPerubahan(this.value)'
             : 'spkSet(\''+f.k+'\',this.value);renderSpkSusun()';
    return '<div class="field"'+span+'><label>'+spkLbl(f)+'</label>'+
      '<select onchange="'+fn+'"><option value="">— pilih —</option>'+opts+'</select></div>';
  }
  if(f.lockedBy){
    const locked = String(spkState.data[f.lockedBy]||'')!=='Ya';
    if(locked){
      // Tampilkan nilai bawaan (data terakhir disimpan) — terbaca namun terkunci
      return lockedField(f.t==='date'?spkDispDate(v):(v||''));
    }
    // Terbuka: hormati tipe field. Tanggal -> pemilih tanggal (dd/mm/yyyy);
    // di dokumen/klausul nanti otomatis ditulis panjang (cth. 14 Juli 2026).
    if(f.t==='date'){
      return '<div class="field"'+span+'><label>'+spkLbl(f)+'</label>'+
        '<input type="date" id="spk-fld-'+f.k+'" value="'+fkEsc(v||'')+'" onchange="spkSet(\''+f.k+'\',this.value)"></div>';
    }
    return '<div class="field"'+span+'><label>'+spkLbl(f)+'</label>'+
      '<input type="text" id="spk-fld-'+f.k+'" value="'+fkEsc(v||'')+'"'+(f.ph?(' placeholder="'+fkEsc(f.ph)+'"'):'')+' oninput="spkSet(\''+f.k+'\',this.value)"></div>';
  }
  if(f.t==='textarea'){
    if(f.hl){
      // Rincian Akta Perubahan: hanya dapat diisi bila "Akta Perubahan? = Ya".
      // Selain itu -> DIKUNCI dalam keadaan default (readonly, kursor not-allowed,
      // tidak tampil di pratinjau/cetak).
      if(f.k==='akta_perubahan' && String(spkState.data.ada_akta_perubahan||'')!=='Ya'){
        spkEnsureHlStyle();
        const dv=SPK_DEF_AKTA_PERUBAHAN;
        return '<div class="field"'+span+'><label>'+spkLbl(f)+'</label>'+
          '<div class="spk-hlwrap">'+
            '<div class="spk-hl-backdrop" id="spk-hlbd-'+f.k+'" aria-hidden="true">'+spkAktaHlHtml(dv)+'</div>'+
            '<textarea class="spk-hl-input" rows="3" spellcheck="false" readonly '+
              'style="background:#f3f5f7;cursor:not-allowed" '+
              'title="Terisi otomatis — pilih Akta Perubahan? = Ya untuk mengisi">'+fkEsc(dv)+'</textarea>'+
          '</div></div>';
      }
      // Textarea dengan penanda placeholder: bagian "( ... )" ditampilkan MERAH
      // (belum diisi); setelah diganti isinya (tanda kurung hilang) menjadi HITAM.
      spkEnsureHlStyle();
      const val0=v||'';
      return '<div class="field"'+span+'><label>'+spkLbl(f)+'</label>'+
        '<div class="spk-hlwrap">'+
          '<div class="spk-hl-backdrop" id="spk-hlbd-'+f.k+'" aria-hidden="true">'+spkAktaHlHtml(val0)+'</div>'+
          '<textarea class="spk-hl-input" rows="3" spellcheck="false" '+
            'oninput="spkAktaHlInput(this,\''+f.k+'\')">'+fkEsc(val0)+'</textarea>'+
        '</div></div>';
    }
    return '<div class="field"'+span+'><label>'+spkLbl(f)+'</label><textarea rows="3" oninput="spkSet(\''+f.k+'\',this.value)">'+fkEsc(v||'')+'</textarea></div>';
  }
  if(f.t==='narasi'){
    var isiAda = String(v||'').replace(/<[^>]+>/g,'').trim()!=='';
    return '<div class="field"'+span+'><label>'+fkEsc(f.l)+' <span class="spk-narasi-hint">— klik tombol untuk membuka editor teks (kerapian sama dengan cetak)</span></label>'+
      '<button type="button" class="btn btn-teal btn-sm spk-narasi-openbtn" style="margin-bottom:8px" onclick="spkNarasiOpenEditor(\''+f.k+'\',\''+fkEscJs(f.l)+'\')">'+
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> '+(isiAda?'Ubah Teks '+fkEsc(f.l):'Isi Teks '+fkEsc(f.l))+'</button>'+
      '<div class="spk-narasi-prevwrap"><div class="spk-narasi-prevlabel">Pratinjau kerapian (mengikuti dokumen)</div><div class="spk-narasi-prev" id="spk-prev-'+f.k+'">'+spkNarasiPreviewHtml(v||'')+'</div></div>'+
    '</div>';
  }
  if(f.t==='date'){
    return '<div class="field"'+span+'><label>'+spkLbl(f)+'</label><input type="date" value="'+fkEsc(v||'')+'" onchange="spkSet(\''+f.k+'\',this.value)"></div>';
  }
  if(f.t==='number'){
    return '<div class="field"'+span+'><label>'+spkLbl(f)+'</label><input type="number" min="0" value="'+fkEsc(v==null?'':v)+'" oninput="spkSet(\''+f.k+'\',this.value)"></div>';
  }
  if(f.t==='rupiah'){
    const disp = (v!==''&&v!=null)? Number(spkNum(v)).toLocaleString('id-ID') : '';
    return '<div class="field"'+span+'><label>'+spkLbl(f)+'</label><input type="text" inputmode="numeric" placeholder="Rp" value="'+fkEsc(disp)+'" oninput="spkSetRupiah(\''+f.k+'\',this)"></div>';
  }
  return '<div class="field"'+span+'><label>'+spkLbl(f)+'</label><input type="text" value="'+fkEsc(v||'')+'"'+(f.ph?(' placeholder="'+fkEsc(f.ph)+'"'):'')+' oninput="spkSet(\''+f.k+'\',this.value)"></div>';
}
function spkSet(k,v){ if(!spkState) return; spkState.data[k]=v; spkRefreshAuto(); }
/* "Perubahan?" pada SK Pimpinan Unit:
   - Ya    -> field SK dibuka untuk diisi/diubah
   - Tidak -> field SK dikunci & dikembalikan ke data terakhir disimpan (default) */
function spkSetPerubahan(v){
  if(!spkState) return;
  spkState.data.perubahan=v;
  if(String(v)!=='Ya') spkApplyLastSk(spkState.data);
  spkRefreshAuto();
  renderSpkSusun();
}
/* "Akta Perubahan?" pada Informasi Penyedia:
   - Ya    -> field Rincian Akta Perubahan dibuka untuk diisi
   - selain Ya -> field dikunci & dikembalikan ke keadaan default (tak dipakai;
                  otomatis tidak tampil di pratinjau/cetak) */
function spkSetAdaAktaPerubahan(v){
  if(!spkState) return;
  spkState.data.ada_akta_perubahan=v;
  if(String(v)!=='Ya') spkState.data.akta_perubahan = SPK_DEF_AKTA_PERUBAHAN;
  /* Frasa "beserta akta-akta Perubahannya" pada Rincian Akta Pendirian mengikuti
     pilihan ini — ikut hilang/muncul di ISIAN FORM, bukan hanya di pratinjau.
     Tanpa akta perubahan: frasa beserta spasi sebelumnya dibuang sehingga teks
     berakhir pada tanggal SK Kemenkumham. */
  spkState.data.akta_pendirian = spkAktaPendirianSync(spkState.data.akta_pendirian, v);
  spkRefreshAuto();
  renderSpkSusun();
}
/* Selaraskan Rincian Akta Pendirian dengan pilihan "Akta Perubahan?" */
function spkAktaPendirianSync(teks, ada){
  var re = /\s*beserta\s+akta\s*-\s*akta\s+perubahan(?:nya)?\b\.?/i;
  var t=String(teks==null?'':teks);
  if(String(ada)==='Ya'){
    if(!re.test(t)) t = t.replace(/[.\s]+$/,'') + ' beserta akta-akta Perubahannya';
  }else{
    t = t.replace(re,'').replace(/\s+$/,'');   // frasa + spasi sebelumnya dibuang
  }
  return t;
}
function spkSetRupiah(k,el){
  const digits=String(el.value).replace(/[^0-9]/g,'');
  spkState.data[k]= digits? Number(digits) : '';
  const pos=el.selectionStart;
  el.value = digits? Number(digits).toLocaleString('id-ID') : '';
  try{ el.setSelectionRange(el.value.length, el.value.length); }catch(e){}
  spkRefreshAuto();
}
function spkToggleSel(id){
  id=String(id); const i=spkState.sel.indexOf(id);
  if(i>=0) spkState.sel.splice(i,1); else spkState.sel.push(id);
}
function spkSelAll(on){
  spkState.sel = on ? records_klausul.filter(k=>k.aktif!==false).map(k=>String(k.id)) : [];
  renderSpkSusun();
}
/* ===== Pemilih BENTUK KONTRAK (pojok kanan atas Penyusunan Kontrak) =====
   Satu tampilan dipakai untuk dua bentuk dokumen. Mengganti pilihan hanya
   mengubah field yang tampil, judul bagian, serta susunan cover/preamble —
   isian yang sudah diketik TIDAK dihapus. */
function spkEnsureBentukStyle(){
  if(document.getElementById('spk-bentuk-style')) return;
  var css=
    '.spk-bentuk-bar{display:flex;align-items:center;justify-content:flex-end;gap:12px;flex-wrap:wrap;margin:0 0 12px}'+
    /* Varian SEJAJAR: dipakai di dalam judul kartu "Informasi Pengadaan",
       berdampingan di sebelah kanan tombol Pilih Pekerjaan. */
    '.spk-bentuk-bar.is-inline{margin:0 0 0 10px;justify-content:flex-end;gap:10px}'+
    /* ---- Efek 3D (timbul) pada penanda & pemilih Bentuk Kontrak ---- */
    /* Penanda datar (tanpa efek timbul) — dipakai pada daftar Lihat Kontrak */
    '.spk-bentuk-tag{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:700;letter-spacing:.04em;'+
      'padding:6px 12px;border-radius:999px;border:1px solid transparent}'+
    '.spk-bentuk-tag.is-spk{background:#FDF3D4;color:#8A6A00;border-color:#F2D68A}'+
    '.spk-bentuk-tag.is-pk{background:#E8EFFA;color:#1B3A6B;border-color:#C3D2EA}'+
    '.spk-bentuk{display:inline-flex;align-items:center;gap:9px}'+
    '.spk-bentuk > span{font-size:11px;font-weight:800;letter-spacing:.06em;color:#5b6670;text-transform:uppercase}'+
    /* Tampilan DATAR: tanpa gradien, tanpa bayangan timbul, tanpa gerak saat ditekan. */
    '.spk-bentuk select{min-width:210px;font-size:12px;padding:9px 12px;border-radius:11px;border:1px solid #c3d1d7;'+
      'background:#ffffff;color:#12242b;font-weight:700;cursor:pointer;box-shadow:none;transition:border-color .16s ease}'+
    '.spk-bentuk select:hover{border-color:#a9bcc4;box-shadow:none;transform:none}'+
    '.spk-bentuk select:active{box-shadow:none;transform:none}'+
    '.spk-bentuk select:focus{outline:none;border-color:var(--teal);box-shadow:0 0 0 3px rgba(14,124,134,.18)}'+
    '@media (max-width:760px){.spk-bentuk-bar.is-inline{margin:8px 0 0;flex:1 1 100%}.spk-bentuk select{min-width:0;flex:1 1 auto}}';
  var st=document.createElement('style'); st.id='spk-bentuk-style'; st.textContent=css;
  (document.head||document.documentElement).appendChild(st);
}
/* inline=true -> dipakai di dalam judul kartu, sejajar tombol Pilih Pekerjaan */
function spkBentukBarHtml(inline){
  spkEnsureBentukStyle();
  var cur=spkBentuk();
  var opts=SPK_BENTUK_OPTS.map(function(o){
    return '<option value="'+o.v+'"'+(o.v===cur?' selected':'')+'>'+fkEsc(o.l)+'</option>';
  }).join('');
  /* Penanda (chip) nama bentuk DIHAPUS dari form — cukup dropdown-nya saja.
     Label teks "Bentuk Kontrak" juga dihapus; pilihan sudah jelas dari isi dropdown. */
  return '<div class="spk-bentuk-bar'+(inline?' is-inline':'')+'">'+
    '<label class="spk-bentuk">'+
      '<select aria-label="Bentuk Kontrak" title="Bentuk Kontrak" onchange="spkSetBentuk(this.value)">'+opts+'</select>'+
    '</label>'+
  '</div>';
}
function spkSetBentuk(v){
  if(!spkState) spkState=spkBlankState();
  var nv=(String(v||'').toUpperCase()==='PK')?'PK':'SPK';
  if(spkState.data.bentuk_kontrak===nv) return;
  spkState.data.bentuk_kontrak=nv;
  /* Pemetaan Penetapan Nomor berbeda antar bentuk — bila sebuah Data Pekerjaan
     tertaut, isian & kunci dihitung ulang agar sesuai bentuk yang baru. */
  try{
    var _d=spkState.data;
    if(_d.__dpNama){
      (_d.__pnLock||[]).forEach(function(k){ _d[k]=''; });
      spkApplyPenetapan(_d.__dpNama);
    }
  }catch(e){ console.error(e); }
  renderSpkSusun();
  toast('Bentuk kontrak: '+(nv==='PK'?'Perjanjian/Kontrak':'Surat Perintah Kerja'),'ok');
}
/* Field yang ditampilkan sesuai Bentuk Kontrak yang dipilih */
function spkFieldVisible(f){
  if(!f || !f.only) return true;
  return String(f.only).toUpperCase()===spkBentuk();
}
function renderSpkSusun(){
  const cont=document.getElementById('spk-susun-content'); if(!cont) return;
  if(!spkState) spkState=spkBlankState();
  // Bagian 1: form mail merge
  const groupsHtml = SPK_FIELD_GROUPS.map((g,gi)=>{
    const cols = 4;
    const fieldsHtml = g.fields.filter(spkFieldVisible).map(f=>{
      // paksa Rincian Akta Pendirian & Perubahan mulai baris baru bersama (2 field 1 baris)
      const brk = (f.k==='akta_pendirian') ? '<div style="flex:0 0 100%;height:0;margin:0;padding:0"></div>' : '';
      return brk + spkFieldInput(f);
    }).join('');
    // Tombol "Pilih Pekerjaan" (pojok kanan atas kartu pertama) — sama seperti pada
    // menu Harga Perkiraan Sendiri. Mengisi field mail merge & Lampiran dari HPS.
    /* Kartu pertama: tombol Pilih Pekerjaan, lalu pemilih Bentuk Kontrak
       tepat di sebelah kanannya (sejajar dalam satu baris judul kartu). */
    const pickBtn = (gi===0) ? (dpPickBtnHtml('spk')+spkBentukBarHtml(true)) : '';
    const secIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M4 4h16v16H4z" opacity="0"/><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>';
    // Kartu "Informasi Penyedia" mendapat bar Profil (Simpan / Muat / Batalkan) di kanan-atas.
    /* Judul bagian dapat berbeda pada Perjanjian/Kontrak (mis. "SK Pimpinan Unit"
       menjadi "Informasi PLN Unit") lewat properti secPk. */
    const secNama = (spkIsPk() && g.secPk) ? g.secPk : g.sec;
    const titleHtml = (g.sec==='Informasi Penyedia')
      ? '<div class="form-section-title" style="justify-content:space-between">'+
          '<span>'+secIcon+' '+fkEsc(secNama)+spkPyProfilTagHtml()+'</span>'+
          spkPyProfilBarHtml()+
        '</div>'
      : '<div class="form-section-title">'+secIcon+' '+fkEsc(secNama)+pickBtn+'</div>';
    return '<div class="form-card">'+
      titleHtml+
      '<div class="form-flow" style="--cols:'+cols+'">'+fieldsHtml+'</div>'+
    '</div>';
  }).join('');
  // Bagian 2: pilih klausul
  const aktif = records_klausul.filter(k=>k.aktif!==false);
  const selSet = new Set(spkState.sel.map(String));
  const klausulRows = aktif.length ? aktif.map((k,i)=>{
    const on = selSet.has(String(k.id));
    return '<label class="spk-kl-pick'+(on?' on':'')+'">'+
      '<input type="checkbox" '+(on?'checked':'')+' onchange="spkToggleSel(\''+fkEscJs(String(k.id))+'\');this.closest(\'.spk-kl-pick\').classList.toggle(\'on\',this.checked)">'+
      '<span class="spk-kl-no">'+(i+1)+'</span>'+
      '<span class="spk-kl-judul">'+(k.judul?spkJudulSan(k.judul):'(Tanpa judul)')+'</span>'+
    '</label>';
  }).join('') : '<div class="empty" style="padding:22px"><div>Belum ada klausul. Tambahkan lewat menu <b>Ubah Klausul Kontrak</b>.</div></div>';

  // Penanda langkah (stepper) — empat langkah: 1) Data Mail Merge, 2) Ubah Klausul Kontrak, 3) Pilih Klausul, 4) Lampiran
  const stp=(no,label)=> '<button type="button" class="spk-stp'+(spkStep===no?' active':(spkStep>no?' done':''))+'" onclick="spkGoStep('+no+')"><span class="spk-stp-no">'+(spkStep>no?'&#10003;':no)+'</span> '+label+'</button>';
  /* Pada Langkah 1 pemilih Bentuk Kontrak menyatu dengan judul kartu pertama;
     pada langkah lain (tanpa kartu tsb) tetap tampil sebagai bar di kanan atas. */
  const stepper =
    (spkStep===1 ? '' : spkBentukBarHtml())+
    '<div class="spk-stepper">'+
      stp(1,'Data Kontrak')+
      '<div class="spk-stp-line"></div>'+
      stp(2,'Ubah Klausul Kontrak')+
      '<div class="spk-stp-line"></div>'+
      stp(3,'Pilih Klausul')+
      '<div class="spk-stp-line"></div>'+
      stp(4,'Lampiran')+
    '</div>';

  if(spkStep===1){
    cont.innerHTML =
      stepper+
      groupsHtml+
      '<div class="jp-actions" style="justify-content:flex-end;margin-top:4px">'+
        '<button class="btn btn-red" onclick="spkBatalClick()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg> Batal</button>'+
        '<button class="btn btn-teal" onclick="spkGoStep(2)">Berikutnya: Ubah Klausul Kontrak <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>'+
      '</div>';
    spkHlInitAll();
    spkCheckNoKontrak();
  }else if(spkStep===2){
    cont.innerHTML =
      stepper+
      '<div id="spk-klausul-content"></div>'+
      '<div class="jp-actions" style="justify-content:space-between;margin-top:4px">'+
        '<button class="btn btn-ghost" onclick="spkGoStep(1)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M11 6l-6 6 6 6"/></svg> Kembali</button>'+
        '<span style="display:flex;gap:10px">'+
          '<button class="btn btn-red" onclick="spkBatalClick()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg> Batal</button>'+
          '<button class="btn btn-teal" onclick="spkGoStep(3)">Berikutnya: Pilih Klausul <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>'+
        '</span>'+
      '</div>';
    try{ renderSpkKlausul(); }catch(e){ console.error(e); }
  }else if(spkStep===3){
    cont.innerHTML =
      stepper+
      '<div class="form-card">'+
        '<div class="form-section-title" style="justify-content:space-between">'+
          '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg> Klausul Terpilih ('+selSet.size+' dari '+aktif.length+')</span>'+
          '<span class="spk-kl-tools"><button type="button" class="btn btn-ghost btn-sm" onclick="spkSelAll(true)">Pilih Semua</button><button type="button" class="btn btn-ghost btn-sm" onclick="spkSelAll(false)">Kosongkan</button></span>'+
        '</div>'+
        '<div class="spk-kl-list">'+klausulRows+'</div>'+
      '</div>'+
      '<div class="jp-actions" style="justify-content:space-between;margin-top:4px">'+
        '<button class="btn btn-ghost" onclick="spkGoStep(2)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M11 6l-6 6 6 6"/></svg> Kembali</button>'+
        '<span style="display:flex;gap:10px">'+
          '<button class="btn btn-red" onclick="spkBatalClick()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg> Batal</button>'+
          '<button class="btn btn-teal" onclick="spkGoStep(4)">Berikutnya: Lampiran <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>'+
        '</span>'+
      '</div>';
  }else{
    // ---------- Langkah 4: Lampiran ----------
    const L=spkLamp();
    cont.innerHTML =
      stepper+
      '<div class="form-card">'+
        '<div class="form-section-title">'+FKL_SEC_ICON+' Uraian Pekerjaan <span class="fkl-count-chip">'+L.items.length+' item</span></div>'+
        spkLampTplBarHtml()+
        spkLampTableHtml()+
        spkLampSummaryPanelHtml()+
      '</div>'+
      '<div class="jp-actions" style="justify-content:space-between;margin-top:4px">'+
        '<button class="btn btn-ghost" onclick="spkGoStep(3)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M11 6l-6 6 6 6"/></svg> Kembali</button>'+
        '<span style="display:flex;gap:10px">'+
          '<button class="btn btn-red" onclick="spkBatalClick()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg> Batal</button>'+
          '<button class="btn btn-teal" onclick="spkPreviewCurrent()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg> Pratinjau / Cetak</button>'+
          '<button class="btn btn-green" onclick="spkSaveKontrak()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg> '+(spkEditId?'Simpan Perubahan':'Simpan Kontrak')+'</button>'+
        '</span>'+
      '</div>';
    spkLampRenderSummary();
  }
}
/* Pindah antar langkah pada Penyusunan Kontrak */
function spkGoStep(n){
  n = (n===2?2:(n===3?3:(n===4?4:1)));
  if(n>=2){
    const nama=String((spkState&&spkState.data&&spkState.data.nama_pekerjaan)||'').trim();
    if(!nama){ toast('Isi Nama Pekerjaan terlebih dahulu sebelum lanjut','warn'); n=1; }
  }
  spkStep=n;
  renderSpkSusun();
  try{ window.scrollTo({top:0,left:0,behavior:'smooth'}); }catch(e){}
}

/* Tombol Batal pada Penyusunan Kontrak — sama seperti form lain: minta
   konfirmasi lalu mengosongkan seluruh isian (kembali ke Langkah 1). */
function spkBatalClick(){
  // Langsung kembali ke Daftar Susun Kontrak (spk-view) tanpa konfirmasi & tanpa notifikasi.
  spkEditId=null;
  spkState=spkBlankState();
  spkStep=1;
  showView('spk-view');
  try{ window.scrollTo({top:0,left:0,behavior:'auto'}); }catch(e){}
}

/* Kumpulkan klausul terpilih (snapshot judul+isi, sesuai urutan pustaka) */
function spkSelectedClauses(){
  const selSet=new Set((spkState.sel||[]).map(String));
  return records_klausul.filter(k=>k.aktif!==false && selSet.has(String(k.id)))
    .map(k=>({id:String(k.id), judul:k.judul||'', isi:k.isi||''}));
}

async function spkSaveKontrak(){
  if(typeof requireInput==='function' && !requireInput()) return;
  if(!spkState){ toast('Data belum diisi','warn'); return; }
  const nama=String(spkState.data.nama_pekerjaan||'').trim();
  if(!nama){ toast('Nama Pekerjaan wajib diisi','warn'); return; }
  // Pastikan Tgl. Akhir Kontrak = Tgl. Awal + Jangka Waktu tersimpan (walau form tak diedit)
  spkState.data.tgl_akhir_kontrak = spkComputeTglAkhir(spkState.data);
  const klausul=spkSelectedClauses();
  if(!klausul.length){ toast('Pilih minimal satu klausul kontrak','warn'); return; }
  spkKlSync();   // pustaka klausul ikut disimpan di dalam kontrak (data.__klausulLib)
  const rec={
    nomor_kontrak: String(spkState.data.nomor_kontrak||'').trim(),
    nama_pekerjaan: nama,
    tanggal: spkState.data.tanggal_kontrak || null,
    nilai: spkNum(spkState.data.nilai_pekerjaan),
    data: spkState.data,
    klausul: klausul
  };
  try{
    await withActionLoader('Menyimpan', async()=>{
      if(spkEditId) await StoreSpkKontrak.update(spkEditId, rec);
      else { const row=await StoreSpkKontrak.create(rec); if(row) spkEditId=row.id; }
      await refreshDataSpk();
    });
  }catch(err){ console.error(err); toast('Gagal menyimpan: '+errMsg(err),'err'); return; }
  toast('Kontrak berhasil disimpan','ok');
  // reset form ke default & alihkan ke Lihat Kontrak
  spkEditId=null; spkState=spkBlankState();
  spkViewPage=1; showView('spk-view');
}

/* ================= HALAMAN: LIHAT KONTRAK ================= */
let spkViewPage=1; const SPK_VIEW_PAGE_SIZE=8;
/* Loader ditampilkan LEBIH DULU agar animasi "Memuat" muncul selama refreshDataSpk()
   berjalan (sebelumnya showView baru dipanggil SETELAH fetch selesai, sehingga menu
   terasa menggantung tanpa animasi). renderSpkView tidak dipanggil manual: showView
   sudah memanggilnya lewat mapping halaman aktif, jadi tidak ada render ganda. */
function openSpkView(){
  if(!isAdmin()){ toast('Menu ini hanya untuk akun admin','warn'); return; }
  showLoader('Memuat');          // tampil sejak awal, bukan setelah fetch selesai
  /* records_hps ikut dimuat: penomoran Judul/Sub-Judul pada dokumen Lampiran
     dibaca dari record HPS yang tertaut (lihat spkLampNumCfg). Tanpa ini,
     kontrak lama akan jatuh ke default dan nomor judul tidak muncul. */
  Promise.all([refreshDataSpk(), refreshDataHps()])
    .then(()=>showView('spk-view'))
    .catch(err=>{ console.error(err); showView('spk-view'); });
}
function spkViewRows(){
  let rows=(records_spk||[]).slice();
  const fs=(document.getElementById('spk-view-search')?.value||'').toLowerCase().trim();
  if(fs) rows=rows.filter(r=>String(r.nama_pekerjaan||'').toLowerCase().includes(fs) || String(r.nomor_kontrak||'').toLowerCase().includes(fs));
  return rows;
}
function spkEmptyRow(){
  return '<tr><td colspan="6"><div class="empty">'+
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h5l2 3h9a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>'+
    '<div>Belum ada kontrak tersimpan</div></div></td></tr>';
}
/* Penanda kecil bentuk dokumen pada daftar Lihat Kontrak */
function spkBentukChip(rec){
  spkEnsureBentukStyle();
  var b=spkBentukOf(rec&&rec.data);
  return '<span class="spk-bentuk-tag '+(b==='PK'?'is-pk':'is-spk')+'" style="margin-left:8px;padding:3px 9px;font-size:10px">'+
    (b==='PK'?'Perjanjian/Kontrak':'SPK')+'</span>';
}
function renderSpkView(){
  const tb=document.getElementById('spk-view-body'); const pg=document.getElementById('spk-view-pagination'); const cEl=document.getElementById('spk-view-count');
  if(!tb) return;
  const rows=spkViewRows();
  if(cEl) cEl.textContent=rows.length;
  if(!rows.length){ tb.innerHTML=spkEmptyRow(); if(pg) pg.innerHTML=''; return; }
  const totalPages=Math.max(1,Math.ceil(rows.length/SPK_VIEW_PAGE_SIZE));
  if(spkViewPage>totalPages) spkViewPage=totalPages; if(spkViewPage<1) spkViewPage=1;
  const start=(spkViewPage-1)*SPK_VIEW_PAGE_SIZE;
  const pageRows=rows.slice(start,start+SPK_VIEW_PAGE_SIZE);
  tb.innerHTML=pageRows.map((r,i)=>{
    const rid=fkEsc(String(r.id));
    const nklausul = Array.isArray(r.klausul)? r.klausul.length : 0;
    return '<tr>'+
      '<td class="col-no">'+(start+i+1)+'</td>'+
      '<td class="wrap-cell">'+fkEsc(r.nomor_kontrak||'—')+spkBentukChip(r)+'</td>'+
      '<td class="wrap-cell col-nama-freeze">'+fkEsc(r.nama_pekerjaan||'—')+'</td>'+
      /* Tanggal ringkas dd/mm/yyyy (fmtDate) — spkDateLong() tetap dipakai di
         dalam dokumen SPK/Perjanjian yang memang menuntut format panjang. */
      '<td class="col-date">'+fkEsc(r.tanggal?fmtDate(r.tanggal):'—')+'</td>'+
      '<td class="col-nilai">'+fkEsc(r.nilai!=null?spkRupiah(r.nilai):'—')+'</td>'+
      '<td><div class="action-cell" style="justify-content:center">'+
        '<button class="act act-edit" title="Ubah" onclick="spkEditRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>'+
        '<button class="act act-view" title="Lihat" onclick="spkPreviewRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>'+
        '<button class="act act-del" title="Hapus" onclick="spkDeleteRecord(\''+rid+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>'+
      '</div></td>'+
    '</tr>';
  }).join('');
  if(pg){
    if(totalPages<=1){ pg.innerHTML=''; }
    else{
      let h='<button class="pg-btn" '+(spkViewPage<=1?'disabled':'')+' onclick="spkViewGoto('+(spkViewPage-1)+')">&#8249;</button>';
      for(let p=1;p<=totalPages;p++) h+='<button class="pg-btn '+(p===spkViewPage?'active':'')+'" onclick="spkViewGoto('+p+')">'+p+'</button>';
      h+='<button class="pg-btn" '+(spkViewPage>=totalPages?'disabled':'')+' onclick="spkViewGoto('+(spkViewPage+1)+')">&#8250;</button>';
      pg.innerHTML=h;
    }
  }
}
function spkViewGoto(p){ spkViewPage=p; renderSpkView(); }
function spkEditRecord(id){
  const rec=(records_spk||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  // Pustaka klausul dimuat dari kontrak ini sendiri (bukan pustaka global)
  spkKlLoadFor(rec);
  spkKlProfil.active=''; spkKlProfil.backup=null;
  spkPyProfil.active=''; spkPyProfil.backup=null;
  spkEditId=rec.id; spkState=spkRecordToState(rec); spkStep=1;
  spkKlSync();
  renderSpkSusun(); showView('spk-susun');
}
function spkDeleteRecord(id){
  if(typeof requireInput==='function' && !requireInput()) return;
  const rec=(records_spk||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  openConfirm({ icon:'del', title:'Hapus Kontrak', text:'Hapus kontrak "'+(rec.nama_pekerjaan||'')+'"?',
    onYes:async()=>{
      try{ await withActionLoader('Menghapus', async()=>{ await StoreSpkKontrak.remove(id); await refreshDataSpk(); }); }
      catch(err){ console.error(err); toast('Gagal menghapus: '+errMsg(err),'warn'); return; }
      toast('Kontrak dihapus','ok'); renderSpkView();
    }});
}
/* Pratinjau dari record tersimpan */
function spkPreviewRecord(id){
  const rec=(records_spk||[]).find(r=>String(r.id)===String(id)); if(!rec) return;
  spkOpenPreview(rec.data||{}, (Array.isArray(rec.klausul)?rec.klausul:[]));
}
/* Pratinjau dari form yang sedang disusun */
function spkPreviewCurrent(){
  if(!spkState){ toast('Data belum diisi','warn'); return; }
  const kl=spkSelectedClauses();
  if(!kl.length){ toast('Pilih minimal satu klausul untuk pratinjau','warn'); return; }
  spkOpenPreview(spkState.data, kl);
}

/* ============ SPASI BARIS: ARTI "1,15" DI WORD vs DI CSS ============
   Word menghitung penspasian baris dari TINGGI BARIS TUNGGAL font (ascent + descent
   + line gap), BUKAN dari ukuran hurufnya. Untuk Arial/Calibri/Inter tinggi baris
   tunggal itu ~1,15 em. Jadi di Word:
       "1,0  baris"  ~= 1,15 em
       "1,15 baris"  ~= 1,15 x 1,15 = 1,32 em
       "1,5  baris"  ~= 1,73 em
   Sementara CSS `line-height:1.15` berarti 1,15 x UKURAN HURUF = 1,15 em, yang
   sebenarnya sama dengan spasi TUNGGAL Word — bukan 1,15.
   Selama ini dokumen memakai line-height:1.15 sambil menyebutnya "1,15", padahal
   yang tercetak adalah spasi tunggal. Semua nilai kini dikonversi lewat SPK_LH_K
   supaya angka yang tertulis di aplikasi = angka yang sama di Word. */
/* K = TINGGI BARIS TUNGGAL font dokumen (em) = (typoAscender - typoDescender + lineGap) / unitsPerEm.
   Untuk Inter angkanya PASTI 1,21 -> dibaca dari metrik resmi berkas font yang ditanam di
   index.html: upm 2048, typoAsc 1984, typoDesc -494, lineGap 0 -> (1984+494+0)/2048 = 1,2100.
   NILAI DIKUNCI, tidak diukur saat runtime: pengukuran DOM memantulkan font yang kebetulan
   aktif, sehingga bila font gagal muat K diam-diam jatuh ke ~1,15 (Arial) dan jarak baris
   menyusut jadi spasi tunggal. Inter kini ditanam base64 (tak bisa gagal muat), jadi
   konstanta ini selalu benar. "1,15 baris" Word = 1,15 x 1,21 = 1,3915 line-height CSS. */
const SPK_LH_K = 1.21;                                   /* tinggi baris tunggal Inter (em) — TETAP */
const SPK_DOC_FONT = '"Inter Local","Inter","Segoe UI",Arial,sans-serif';
function spkFontK(fam, size){
  try{
    var d=document.getElementById('spk-lh-probe');
    if(!d){ d=document.createElement('div'); d.id='spk-lh-probe'; document.body.appendChild(d); }
    d.style.cssText='position:absolute;visibility:hidden;left:-9999px;top:0;white-space:nowrap;'+
      'margin:0;padding:0;border:0;line-height:normal;font-family:'+(fam||SPK_DOC_FONT)+
      ';font-size:'+(size||'11pt');
    d.textContent='Hg';
    var k=d.getBoundingClientRect().height/parseFloat(getComputedStyle(d).fontSize);
    return (k>1 && k<2) ? Math.round(k*1000)/1000 : null;
  }catch(e){ return null; }
}
/* Sebarkan --spk-lh ke CSS supaya style.css & CSS dokumen memakai angka yang sama.
   K TIDAK diukur ulang (lihat catatan SPK_LH_K); spkFontK() kini hanya untuk diagnostik. */
function spkLHInit(){
  try{ document.documentElement.style.setProperty('--spk-lh', spkLHCss(1.15)); }catch(e){}
  spkCekFontDok();
}
/* Diagnostik: pastikan Inter tertanam benar-benar aktif. Bila tidak, lebar teks berubah
   dan paginasi bisa bergeser — beri tahu di Console daripada gagal diam-diam. */
function spkCekFontDok(){
  try{
    if(!document.fonts || !document.fonts.check) return;
    /* PENTING: sebuah @font-face baru AKTIF setelah ada yang memakainya. Di
       halaman aplikasi ini tidak ada elemen yang memakai "Inter Local" (font itu
       dipakai di dalam iframe dokumen), sehingga document.fonts.check() selalu
       mengembalikan false dan memicu peringatan palsu. Karena itu font DIMINTA
       dulu lewat document.fonts.load(), baru diperiksa. Bila blok @font-face-nya
       memang hilang/rusak, load() gagal dan check() tetap false -> peringatan
       muncul sebagaimana mestinya. */
    var periksa=function(){
      if(!document.fonts.check('11pt "Inter Local"')){
        console.warn('[SPK] Font "Inter Local" tidak aktif. Blok <style id="spk-inter-face"> '+
          'di index.html mungkin terhapus/rusak. Jarak baris tetap benar (K dikunci 1,21), '+
          'tetapi bentuk & lebar huruf akan berbeda dari draft.');
        return;
      }
      spkCekFontK();
    };
    if(document.fonts.load) document.fonts.load('11pt "Inter Local"').then(periksa, periksa);
    else periksa();
  }catch(e){}
}
function spkCekFontK(){
  try{
    var k = spkFontK(SPK_DOC_FONT,'11pt');
    if(k && Math.abs(k - SPK_LH_K) > 0.02){
      console.warn('[SPK] K terukur ('+k+') menyimpang dari K Inter resmi ('+SPK_LH_K+'). '+
        'Berkas font mungkin bukan Inter. Jarak baris tetap memakai '+SPK_LH_K+'.');
    }
  }catch(e){}
}
try{
  if(document.fonts && document.fonts.ready && document.fonts.ready.then) document.fonts.ready.then(spkLHInit);
  else if(document.readyState!=='loading') spkLHInit();
  else document.addEventListener('DOMContentLoaded', spkLHInit);
}catch(e){}
function spkLHCss(word){                                  /* nilai Word -> line-height CSS */
  var n=parseFloat(word); if(isNaN(n)) return '';
  return String(Math.round(n*SPK_LH_K*1000)/1000);
}
/* ---- NORMALISASI SPASI BARIS LAMA -------------------------------------------
   Klausul yang tersimpan/di-impor sebelum koreksi K membawa inline
   line-height:1.15 (yang sebenarnya = spasi TUNGGAL Word) dan style inline itu
   MENGALAHKAN CSS dokumen. Nilai <=1,2 dianggap "1,15 gaya lama" lalu dikonversi ke
   nilai Word yang benar. Spasi "Pas/Exactly" (pt/px/cm/%) dan spasi >=1,5 dibiarkan. */
function spkFixLH(html){
  var s=String(html==null?'':html);
  if(!s || s.indexOf('line-height')<0) return s;
  try{
    var box=document.createElement('div'); box.innerHTML=s;
    var els=box.querySelectorAll('p,div,li,span'), i, lh, n;
    for(i=0;i<els.length;i++){
      lh=String((els[i].style && els[i].style.lineHeight)||'').trim();
      if(!lh || lh==='normal') continue;
      if(/(pt|px|cm|mm|in|%)$/i.test(lh)) continue;        /* spasi pas -> hormati */
      n=parseFloat(lh);
      if(!isNaN(n) && n<=1.2) els[i].style.lineHeight=spkLHCss(1.15);
    }
    return box.innerHTML;
  }catch(e){ return s; }
}
function spkLHWord(css){                                  /* line-height CSS -> nilai Word */
  var n=parseFloat(css); if(isNaN(n)) return null;
  return Math.round((n/SPK_LH_K)*100)/100;
}
/* ================= DOKUMEN KONTRAK (cover + daftar isi + isi) ================= */
/* Inter yang DI-HOST LOKAL — KHUSUS dokumen Susun Kontrak.
   Family diberi nama tersendiri ("Inter Local") supaya:
   - Tidak menyentuh/menimpa font menu lain (yang tetap pakai Plus Jakarta Sans / Inter Google).
   - Bila file lokal ada  -> teks memakai Inter lokal (jalan walau OFFLINE / Google diblokir).
   - Bila file lokal tidak ada -> otomatis jatuh ke "Inter" (Google), lalu Segoe UI/Arial.
   Taruh file .woff2 Inter di folder  fonts/  di samping index.html. */
function spkInterFontFace(){
  /* Inter DITANAM (base64) — identik dengan blok di index.html. Hasil Cetak/PDF dibuka di
     dokumen terpisah yang tidak mewarisi <style> halaman utama, jadi font harus disertakan
     di sini juga. Berkas tegak = variable font (wght 100-900): satu sumber untuk Regular,
     Medium, SemiBold, dan Bold. font-display:block mencegah kedip teks font cadangan yang
     bisa merusak paginasi saat cetak. */
  return ''+
  '@font-face{font-family:"Inter Local";font-style:normal;font-weight:100 900;font-display:block;'+
    'src:url(data:font/woff2;base64,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) format("woff2")}'+
  /* Berkas italic yang ditanam BUKAN variable font — hanya SATU berat (Regular ~400).
     Karena itu berat dinyatakan 400 (bukan 100 900). Bila dinyatakan 100 900, browser
     mengira berat 700 tersedia lalu memakai berkas 400 apa adanya (tanpa mempertebal),
     sehingga istilah asing yang dimiringkan pada JUDUL klausul (berat 700) tampil miring
     tetapi TIDAK tebal. Dengan berat 400, browser mensintesis tebal (faux-bold) untuk
     permintaan italic 700 → judul klausul kembali tebal seluruhnya. */
  '@font-face{font-family:"Inter Local";font-style:italic;font-weight:400;font-display:block;'+
    'src:url(data:font/woff2;base64,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) format("woff2")}';
}
/* =====================================================================
   KISI TATA LETAK PRATINJAU = KISI TEMPLATE .docx (SATU SUMBER)
   Seluruh angka inden/gantungan pada CSS dokumen di bawah TIDAK lagi
   ditulis manual, melainkan diturunkan dari SPK_DX (Surat Perintah Kerja)
   dan SPK_DX_PK (Perjanjian/Kontrak) — kisi yang sama persis dipakai
   spkStylesXml() saat membangun berkas .docx. Dengan begitu apa yang
   terlihat di Pratinjau = apa yang keluar di Microsoft Word, dan bila kisi
   diubah kelak, keduanya ikut berubah bersamaan.
     w:ind left=L hanging=H   ->  margin-left:(L - BASE)  text-indent:-H
     w:ind left=L firstLine=F ->  margin-left:(L - BASE)  text-indent:+F
   (BASE = inden dasar isi klausul; pada web sudah dipasang sebagai
    padding-left pembungkus .spk-cl, jadi nilai per-paragraf bersifat
    RELATIF terhadap BASE.)
   ===================================================================== */
function spkDxCm(tw){ return (Math.round(((+tw||0)/566.929)*1000)/1000)+'cm'; }
function spkDxGrid(bentuk){
  var D = (bentuk==='PK')
    ? ((typeof SPK_DX_PK!=='undefined') ? SPK_DX_PK : null)
    : ((typeof SPK_DX!=='undefined')    ? SPK_DX    : null);
  if(!D) D = { BASE:425, P_FIRST:425, L1:850, L1_HANG:425, L2:1276, L2_HANG:425,
               DESC:850, JUDUL_HANG:368, GAP:102 };
  var B=+D.BASE||0;
  return {
    raw:D,
    base:spkDxCm(B),                    /* inden dasar isi klausul          */
    first:spkDxCm(D.P_FIRST),           /* inden baris pertama paragraf     */
    l1:spkDxCm(D.L1-B),   h1:spkDxCm(D.L1_HANG),   /* butir tingkat-1       */
    l2:spkDxCm(D.L2-B),   h2:spkDxCm(D.L2_HANG),   /* butir tingkat-2       */
    desc:spkDxCm(D.DESC-B),             /* paragraf deskripsi               */
    jhang:spkDxCm(D.JUDUL_HANG),        /* gantungan nomor pada judul       */
    gap:spkDxCm(D.GAP||102),            /* jeda titik nomor -> teks         */
    /* Perataan nomor mengikuti tab stop template: SPK memakai tab KIRI,
       Perjanjian/Kontrak memakai tab KANAN (titik penutup nomor lurus). */
    numAlign:(D.PUSAT ? 'right' : 'left')
  };
}
function spkDocCss(){
  var D=spkDxGrid('SPK'), P=spkDxGrid('PK');
  return ''+
  spkInterFontFace()+
  /* Cover, Daftar Isi, & Kop dipertahankan seperti desain sebelumnya (navy).
     Hanya ISI kontrak yang dirapikan mengikuti tampilan Word (Arial). */
  '@page{size:A4 portrait;margin:0}'+
  '*{box-sizing:border-box}'+
  /* Variabel dokumen: --spk-lh = "1,15 baris" gaya Word = 1,15 x K Inter 1,21 = 1,3915.
     --spk-kv-gap = jarak bawaan baris "Label : nilai" bila tidak diatur sendiri. */
  ':root{--spk-lh:'+spkLHCss(1.15)+';--spk-kv-gap:4pt}'+
  'body{font-family:"Inter Local","Inter","Segoe UI",Arial,sans-serif;color:#1c1c1c;margin:0;font-size:11.5px;line-height:var(--spk-lh,1.3915)}'+
  '.spk-doc{counter-reset:spkcl}'+
  /* Penomoran judul klausul dibuat OTOMATIS (counter), bukan teks biasa */
  '.spk-clause{counter-increment:spkcl}'+
  '.spk-cl-h .n::before{content:counter(spkcl) "."}'+
  '.spk-page{page-break-after:always}'+
  '.spk-page:last-child{page-break-after:auto}'+
  /* Cover, Daftar Isi, Kop & judul SPK sekarang memakai desain MODERN pada
     spkDocCss2() (.spk-cover / .spk-tocpage / .spk-rhd / .spk-rft). Gaya navy
     lama (.spk-cv / .spk-hd / .spk-toc / .spk-title / .spk-subno) dihapus. */
  /* ====== ISI KONTRAK — dirapikan mengikuti Word (Arial) ======
     - Spasi baris & paragraf 1,15
     - Rata kanan-kiri (justify)
     - Judul klausul: penomoran + "tab", baris berikut menjorok mengikuti
       teks sesudah nomor (hanging indent)
     - Jarak dari akhir klausul ke judul klausul baru = 12 pt */
  /* ---- Penggaris (ruler) mengikuti Word ----
     Body Arial 11pt, spasi baris 1,15, rata kanan-kiri.
     Judul Pasal: nomor di margin, tab 0,75 cm ke teks (hanging 0,75 cm),
       jarak 12 pt sebelum tiap judul (spacing before Word).
     Isi klausul rata dengan TEKS judul (0,75 cm dari margin).
     Sub-klausul (X.1) & sub-sub (a. / X.1.1) memakai hanging tab 0,75 cm yang
       konsisten, bertingkat 0,75 cm tiap level — persis penggaris Word. */
  '.spk-clause{margin:0}'+
  '.spk-clause,.spk-clause *,.spk-cl,.spk-cl *,.spk-cl-h,.spk-cl-h *{font-family:"Inter Local","Inter","Segoe UI",Arial,sans-serif}'+
  /* Kotak nomor judul klausul dipersempit 0,75cm -> 0,65cm: cukup untuk nomor
     2 digit (mis. "15." = ~0,54cm pada Arial bold 11pt) plus sedikit jarak,
     sehingga judul lebih dekat ke nomornya. */
  /* Gaya Word "Klausul Judul" (SPK): ind left=JUDUL_HANG hanging=JUDUL_HANG,
     spacing before 240tw (12pt) / after 60tw (3pt) / line 276 (1,15). */
  '.spk-cl-h{font-weight:700;font-size:11pt;color:#000;line-height:'+spkLHCss(1.15)+';text-transform:uppercase;text-align:left;margin:12pt 0 3pt;padding-left:'+D.jhang+';text-indent:-'+D.jhang+';font-synthesis:weight style}'+
  /* Pastikan istilah asing yang dimiringkan pada judul ikut tebal (berkas italic hanya
     berat 400 → andalkan sintesis tebal browser). */
  '.spk-cl-h i,.spk-cl-h em{font-weight:inherit;font-synthesis:weight style}'+
  /* Kotak nomor judul = lebar gantungan template (JUDUL_HANG). Penomoran
     otomatis Word pada template rata KIRI (w:lvlJc left), jadi di layar pun
     rata kiri; min-width membuat nomor 2 digit melebar seperti tab Word. */
  '.spk-cl-h .n{display:inline-block;min-width:'+D.jhang+';text-indent:0;text-align:left;padding-right:0;box-sizing:border-box;white-space:nowrap}'+
  /* Perataan nomor tunggal 2 digit (mis. 10.) rata kanan -> titik sejajar */
  '.spk-clause .n.r,.spk-cl-h .n.r{text-align:'+D.numAlign+';padding-right:0;box-sizing:border-box}'+
  /* ANGKA TABULAR: di font proporsional, digit "1" lebih sempit dari "2" sehingga
     "4.1." dan "4.2." berbeda lebar dan titiknya tidak sejajar. tnum menyamakan
     lebar semua digit — persis seperti penomoran di Word. */
  '.spk-clause .n,.spk-cl-h .n,.spk-cl .n{font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1,"lnum" 1}'+
  /* ---------- POSISI JUDUL KLAUSUL MENGIKUTI BENTUK KONTRAK ----------
     Surat Perintah Kerja : nomor & judul RATA KIRI dalam satu baris
                            (mis. "1. DEFINISI") — perilaku bawaan di atas.
     Perjanjian/Kontrak   : RATA TENGAH dua baris seperti dokumen perjanjian
                            PLN — "PASAL 1" di baris pertama, judul di bawahnya.
     Untuk memakai penomoran biasa ("1.") pada Perjanjian/Kontrak, cukup ubah
     content di bawah menjadi: counter(spkcl) "." */
  /* Gaya Word "Klausul Pasal" + "Klausul Judul" (PK): keduanya rata TENGAH,
     ind left=0, spacing before 240tw (12pt) pada baris PASAL dan after 120tw
     (6pt) pada baris nama pasal; di antara keduanya tanpa jarak. */
  '.spk-doc.spk-pk .spk-cl-h{text-align:center;padding-left:0;text-indent:0;margin:12pt 0 6pt}'+
  '.spk-doc.spk-pk .spk-cl-h .n{display:block;width:auto;min-width:0;text-align:center;padding-right:0;'+
    'text-indent:0;margin:0}'+
  '.spk-doc.spk-pk .spk-cl-h .n::before{content:"PASAL " counter(spkcl)}'+
  /* Nomor 2 digit tak perlu perlakuan rata kanan saat judul di tengah */
  '.spk-doc.spk-pk .spk-cl-h .n.r{text-align:center;padding-right:0}'+
  '.spk-cl{margin:0;font-size:11pt;color:#000;line-height:'+spkLHCss(1.15)+'}'+
  /* Isi klausul menjorok SEDIKIT LEBIH KANAN dari teks judul (0,75cm judul -> 0,90cm
     isi). Selisih ~0,15cm membuat penomoran sub-klausul (mis. "5.1.", "8.1.") mulai
     sedikit masuk ke kanan dari teks judul klausul — bukan sejajar/keluar ke kiri. */
  /* Dasar isi klausul = w:ind left gaya "Klausul Isi" pada template (SPK 0,75 cm).
     Sebelumnya 0,90 cm sehingga seluruh isi klausul di layar bergeser 0,15 cm ke
     kanan dibanding hasil Word. */
  '.spk-clause .spk-cl{padding-left:'+D.base+'}'+
  /* PERJANJIAN/KONTRAK: isi klausul TIDAK menjorok terhadap judul. Judul (PASAL n
     + nama pasal) sudah rata tengah, sedangkan isi — baik paragraf bernomor
     ("1.", "a.") maupun teks biasa — dimulai tepat di batas margin kiri kertas
     dan berakhir di batas margin kanan. Bentuk Surat Perintah Kerja tetap
     memakai indentasi 0,9 cm seperti semula. */
  '.spk-doc.spk-pk .spk-clause .spk-cl{padding-left:'+P.base+'}'+
  /* ---- PERJANJIAN/KONTRAK: kisi SPK_DX_PK, sama persis dengan template ----
     Sebelumnya bentuk PK ikut memakai angka SPK (0,75 / 1,5 cm) sebagai
     nilai bawaan CSS, sehingga paragraf yang TIDAK tersentuh spkPkIndentStd()
     (mis. isi hasil unggahan template) tampil lebih menjorok daripada di Word. */
  '.spk-doc.spk-pk .spk-cl p.kl0{margin-left:0;text-indent:0}'+
  '.spk-doc.spk-pk .spk-cl p.kldesc{margin-left:'+P.desc+';text-indent:0}'+
  '.spk-doc.spk-pk .spk-cl p.kl1,.spk-doc.spk-pk .spk-cl p.kl1.spk-sl'+
    '{margin-left:'+P.l1+';text-indent:-'+P.h1+';padding-left:0}'+
  '.spk-doc.spk-pk .spk-cl p.kl2,.spk-doc.spk-pk .spk-cl p.kl2.spk-sl'+
    '{margin-left:'+P.l2+';text-indent:-'+P.h2+';padding-left:0}'+
  '.spk-doc.spk-pk .spk-cl p.klp{margin-left:0;text-indent:'+P.first+'}'+
  '.spk-doc.spk-pk .spk-cl p.klp1{margin-left:'+P.l1+';text-indent:'+P.first+'}'+
  '.spk-doc.spk-pk .spk-cl p.klp2{margin-left:'+P.l2+';text-indent:'+P.first+'}'+
  /* Tingkat-1 (angka) mengikuti tab KANAN template; tingkat-2 (huruf a./b.)
     tetap rata KIRI dengan jeda lebih rapat, seperti spkPkIndentStd(). */
  '.spk-doc.spk-pk .spk-cl p.kl1.spk-sl .n{min-width:'+P.h1+';width:auto;text-align:right;'+
    'padding-right:'+P.gap+';box-sizing:border-box}'+
  '.spk-doc.spk-pk .spk-cl p.kl2.spk-sl .n{min-width:'+P.h2+';width:auto;text-align:left;'+
    'padding-right:0.10cm;box-sizing:border-box}'+
  /* Butir bernomor yang BERADA DI BAWAH paragraf pengantar menjorok 0,5 cm dari
     teks pengantar. Dipakai padding-left (bukan margin-left) agar tidak bentrok
     dengan hanging indent per paragraf yang dipasang spkNumberFix(); seluruh blok
     butir bergeser ke kanan, sedangkan baris sambungannya tetap sejajar. */
  /* PERJANJIAN/KONTRAK: butir bernomor TIDAK lagi digeser 0,5 cm terhadap teks
     pengantar. Seluruh butir memakai INDEN STANDAR (lihat spkPkIndentStd):
     tingkat-1 mulai di batas margin, tingkat-2 (a./b.) mulai tepat di kolom TEKS
     tingkat-1. Bentuk Surat Perintah Kerja tidak terpengaruh. */
  '.spk-doc.spk-pk .spk-cl.spk-inlead p.kl1,.spk-doc.spk-pk .spk-cl.spk-inlead p.kl2{padding-left:0}'+
  '.spk-cl p{margin:0 0 6pt;text-align:justify;line-height:'+spkLHCss(1.15)+'}'+
  /* kl0 = paragraf biasa (sejajar teks judul); kldesc = deskripsi menjorok */
  '.spk-cl p.kl0{margin-left:0;text-indent:0}'+
  /* Contoh pengisian (placeholder): titik-titik sampai batas margin kanan, huruf samar */
  /* Placeholder klausul kosong: huruf HITAM (dulu samar/transparan). Blok ini tetap
     disaring keluar sebelum dicetak (spkIsPhBlock), jadi tidak muncul di PDF. */
  '.spk-cl p.spk-ph{color:#000;white-space:nowrap;overflow:hidden;text-align:left}'+
  '.spk-cl p.kldesc{margin-left:'+D.desc+';text-indent:0}'+
  /* Fallback bila nomor TIDAK ter-wrap (jarang): tetap hanging bertingkat */
  '.spk-cl p.kl1{margin-left:'+D.l1+';text-indent:-'+D.h1+'}'+
  '.spk-cl p.kl2{margin-left:'+D.l2+';text-indent:-'+D.h2+'}'+
  /* klp = paragraf narasi dengan indentasi baris pertama (0,75cm); klp1/klp2 = paragraf
     narasi yang berada di bawah butir 1./a. sehingga marjinnya ikut menjorok. */
  '.spk-cl p.klp{margin-left:0;text-indent:'+D.first+';text-align:justify}'+
  '.spk-cl p.klp1{margin-left:'+D.l1+';text-indent:'+D.first+';text-align:justify}'+
  '.spk-cl p.klp2{margin-left:'+D.l2+';text-indent:'+D.first+';text-align:justify}'+
  /* Paragraf ber-nomor (tunggal & majemuk) hasil spkNumberFix:
     hanging tab 0,75 cm dari margin level; kl2 bertingkat +0,75 cm dari kl1. */
  '.spk-cl p.kl1.spk-sl{margin-left:'+D.l1+';text-indent:-'+D.h1+';padding-left:0}'+
  '.spk-cl p.kl2.spk-sl{margin-left:'+D.l2+';text-indent:-'+D.h2+';padding-left:0}'+
  '.spk-cl p.spk-sl .n{display:inline-block;box-sizing:border-box;min-width:'+D.h1+';text-indent:0;text-align:'+D.numAlign+';white-space:nowrap}'+
  '.spk-cl p.kl2.spk-sl .n{min-width:'+D.h2+'}'+
  /* Label MAJEMUK (5.1. / 3.1.1. / 11.1.1.) -> lebar auto, jaga jarak >=0,75 cm
     tanpa menabrak teks; hanging otomatis mengikuti lebar label (via .spk-ml). */
  /* Label MAJEMUK (5.1. / 3.1.1.) di template .docx tetap memakai gaya
     "Klausul Butir 1" — kolomnya SAMA dengan butir tingkat-1, hanya kotak
     nomornya yang melebar bila labelnya panjang (min-width). Karena itu
     nilainya tidak lagi dipatok 1 cm / 1,75 cm sendiri. */
  '.spk-cl p.kl1.spk-ml{margin-left:'+D.l1+';text-indent:-'+D.h1+';padding-left:0}'+
  '.spk-cl p.kl2.spk-ml{margin-left:'+D.l1+';text-indent:-'+D.h1+';padding-left:0}'+
  '.spk-cl p.spk-ml .n.m{display:inline-block;box-sizing:border-box;min-width:'+D.h1+';'+
    'text-indent:0;text-align:'+D.numAlign+';white-space:nowrap}'+
  /* Token angka-majemuk yang di sumber ber-kelas kl2 (mis. "3.1.1.") -> paksa
     sejajar di tingkat-1 (0,75 cm) seperti Word; huruf a./b. tetap di 1,5 cm. */
  '.spk-cl p.kl2.spk-lv1{margin-left:'+D.l1+';text-indent:-'+D.h1+';padding-left:0}'+
  /* Baris "Label : nilai" agar sejajar seperti Word */
  '.spk-cl .spk-kv{display:flex;margin:0 0 var(--spk-kv-gap,4pt);line-height:'+spkLHCss(1.15)+'}'+
  '.spk-cl .spk-kv .k{flex:0 0 34%;max-width:34%}'+
  '.spk-cl .spk-kv .s{flex:0 0 auto;width:1.2em}'+
  '.spk-cl .spk-kv .v{flex:1;text-align:justify}'+
  /* Grup baris "Label : nilai" (lihat spkKvGroup). Memakai grid 3 kolom:
       kolom-1 = max-content -> selebar LABEL TERPANJANG saja,
       kolom-2 = tanda ":",  kolom-3 = nilai.
     Dengan begitu ":" berhenti persis di kanan label terpanjang + jeda kecil,
     tidak lagi terpaku pada 34% lebar. TANPA indentasi tambahan: badan klausul
     sudah menjorok sendiri, sehingga label sejajar dengan teks judul butir di
     atasnya (mis. "Pekerjaan" tepat di bawah "URAIAN PEKERJAAN"). */
  '.spk-cl .spk-kvgrp{display:grid;grid-template-columns:max-content max-content 1fr;'+
    'row-gap:3pt;margin:0 0 6pt 0}'+
  '.spk-cl .spk-kvgrp .spk-kv{display:contents}'+
  '.spk-cl .spk-kvgrp .spk-kv .k{flex:none;max-width:none;padding-right:0.5cm}'+
  '.spk-cl .spk-kvgrp .spk-kv .s{flex:none;width:auto;padding-right:0.3cm}'+
  '.spk-cl .spk-kvgrp .spk-kv .v{flex:none;text-align:justify}'+
  /* Blok PIHAK pada pembuka: label (I./II.) menggantung, deskripsi sejajar di bawah label */
  '.spk-cl .spk-party{margin:0 0 9pt}'+
  '.spk-cl .spk-party-h{font-weight:700;line-height:'+spkLHCss(1.15)+';padding-left:0.75cm;text-indent:-0.75cm;margin:0}'+
  '.spk-cl .spk-party-h .n{display:inline-block;width:0.75cm;text-indent:0}'+
  '.spk-cl .spk-party-d{margin:0;padding-left:0.75cm;text-align:justify;line-height:'+spkLHCss(1.15)+'}'+
  /* "Berdasarkan :" rata margin kiri (sejajar "Pada hari ini"), jarak 12 pt dari blok pihak */
  '.spk-cl p.spk-berdasar{margin-top:12pt;margin-left:0;padding-left:0}'+
  /* Daftar "Berdasarkan": nomor tunggal (1. a. I.) dengan jarak tab ~0,7 cm,
     baris sambungan sejajar teks di atasnya (mengikuti penggaris Word).
     Seluruh daftar digeser 0,5 cm ke kanan terhadap kalimat pengantar di atasnya
     ("…berpedoman pada :"), sama seperti butir bernomor di dalam klausul. */
  '.spk-cl p.spk-dlist{margin:0 0 4pt 0.5cm;padding-left:0.7cm;text-indent:-0.7cm;text-align:justify;line-height:'+spkLHCss(1.15)+'}'+
  '.spk-cl p.spk-dlist .n{display:inline-block;width:0.7cm;text-indent:0}'+
  /* Nomor/kode referensi panjang di daftar "Berdasarkan" boleh dipotong di titik
     mana pun agar mengisi baris justify secara rapat — sisa nomor turun ke baris
     berikutnya, sehingga tidak timbul celah spasi lebar di tengah baris. */
  '.spk-cl p.spk-dlist .refn{word-break:break-all}'+
  /* Rincian "Label : nilai" di bawah sebuah butir daftar "Berdasarkan"
     (No. Eproc / No. / Tanggal). Menjorok 1,2 cm = 0,5 cm pergeseran daftar
     + 0,7 cm lebar kotak nomor, sehingga sejajar dengan TEKS butir di atasnya,
     bukan dengan nomornya. */
  /* Pembungkus "jangan dipecah" (PK): butir daftar Berdasarkan + baris
     No./Tanggal miliknya. Tanpa gaya visual sama sekali — hanya penanda
     bagi paginator agar blok ini pindah halaman secara utuh. */
  '.spk-cl .spk-keep{margin:0;padding:0;border:0;background:none;break-inside:avoid;page-break-inside:avoid}'+
  '.spk-cl .spk-kv.spk-dkv{margin:0 0 4pt 1.2cm}'+
  /* PERJANJIAN/KONTRAK: daftar "Berdasarkan" memakai inden standar yang sama
     dengan butir klausul — penanda menjorok 0,35 cm dari teks paragraf
     pengantarnya, bukan 0,5 cm dengan kotak nomor selebar 0,7 cm. Baris
     No./Tanggal di bawahnya menggantung tepat di kolom teks butirnya. */
  '.spk-doc.spk-pk .spk-cl p.spk-dlist{margin:0 0 4pt 0.35cm;padding-left:0.6cm;text-indent:-0.6cm}'+
  '.spk-doc.spk-pk .spk-cl p.spk-dlist .n{width:0.6cm;text-align:right;box-sizing:border-box;padding-right:0.18cm}'+
  '.spk-doc.spk-pk .spk-cl .spk-kv.spk-dkv{margin:0 0 4pt 0.95cm}'+
  '.spk-cl .spk-kv.spk-dkv .k{flex:0 0 3.6cm;max-width:3.6cm}'+
  '.spk-cl .spk-kv.spk-dkv .s{flex:0 0 auto;width:0.6em}'+
  '.spk-cl .spk-kv.spk-dkv .v{flex:1 1 auto;text-align:left;overflow-wrap:anywhere;word-break:break-word}'+
  /* Kalimat penutup pembuka ("Maka dengan ini ... menugaskan ...") selalu dimulai
     pada halaman baru (halaman ke-2 isi), terpisah dari blok identitas PARA PIHAK
     dan daftar "Berdasarkan" pada halaman pertama. */
  '.spk-cl p.spk-menugaskan{break-before:page;page-break-before:always;margin-top:0}'+
  /* Bila paragraf "Maka dengan ini..." DISAMBUNG di lembar yang sama dengan daftar
     berita acara (karena daftarnya sudah lebih dari 1 lembar), beri jarak 12pt agar
     tidak menempel pada butir terakhir. Saat ia memulai lembar baru, jaraknya tetap 0
     supaya teks mulai persis di batas margin atas. */
  '.spk-cl.spk-joined,.spk-cl.spk-joined p.spk-menugaskan{margin-top:12pt}'+
  /* Blok tanda tangan akhir */
  '.spk-sign{margin-top:30px;width:100%;border-collapse:collapse}'+
  '.spk-sign td{width:50%;text-align:center;vertical-align:top;font-size:11pt;padding:4px}'+
  '.spk-sign .role{font-weight:700}.spk-sign .nm{font-weight:700;text-decoration:underline;margin-top:88px}'+
  /* Baris kepala (PIHAK … + nama instansi) dan baris nama/jabatan dipisah menjadi
     dua <tr>. Karena tinggi satu baris tabel berlaku sama untuk KEDUA kolom, blok
     nama & jabatan selalu mulai pada garis yang sama — tidak lagi melorot mengikuti
     panjang nama instansi masing-masing pihak. Ruang tanda tangan (88px) dijaga oleh
     margin-top .nm; padding antar-baris dinolkan agar jaraknya tetap seperti semula. */
  '.spk-sign tr.sg-head td{padding-bottom:0;vertical-align:top}'+
  '.spk-sign tr.sg-body td{padding-top:0;vertical-align:top}'+
  '.spk-sign tr.sg-head,.spk-sign tr.sg-body{break-inside:avoid;page-break-inside:avoid}'+
  /* Baris nama instansi di bawah "PIHAK PERTAMA" ditebalkan, sama seperti di Lampiran */
  /* Nama instansi dipecah menjadi baris-baris yang SEIMBANG panjangnya
     (text-wrap:balance), sehingga tidak ada baris pertama kepanjangan lalu baris
     kedua tinggal 2 kata. Dipakai cara ini—bukan <br> manual—agar tetap rapi
     berapa pun panjang nama unit yang masuk dari mail merge. */
  '.spk-sign .org{font-weight:700;line-height:'+spkLHCss(1.15)+';text-wrap:balance;text-align:center}'+
  /* Jabatan ditebalkan, seragam dengan tanda tangan Lampiran (.spk-lampsign .jab) */
  '.spk-sign .jab{color:#000;font-weight:700}'+
  /* ===== Seragamkan SELURUH teks ISI kontrak = Arial 11pt =====
     Mencakup preamble, semua klausul (judul & isi), daftar, blok pihak, baris
     "Label : nilai", dan blok tanda tangan. Ketebalan/format (bold, garis bawah)
     tetap dipertahankan; hanya jenis huruf & ukuran yang diseragamkan. */
  '.spk-flow .spk-cl,.spk-flow .spk-cl *,.spk-flow .spk-clause,.spk-flow .spk-clause *,.spk-flow .spk-cl-h,.spk-flow .spk-cl-h *,.spk-flow .spk-sign,.spk-flow .spk-sign *{font-family:"Inter Local","Inter","Segoe UI",Arial,sans-serif;font-size:11pt}'+
  /* ===== Tampilan PRATINJAU di layar (bukan cetak) =====
     Menampilkan tiap bagian sebagai lembar A4 putih (210×297mm) di atas latar
     abu-abu, dengan bayangan & margin dalam 12mm/15mm — meniru gaya pratinjau
     Rekap HPS agar terlihat rapi seperti hasil cetak. Blok ini HANYA berlaku di
     layar; saat mencetak, margin diatur oleh @page sehingga tidak berlipat. */
  '@media screen{'+
    'html,body{background:#54585c}'+
    'body{margin:0;padding:24px 0}'+
    '.spk-doc{margin:0 auto}'+
    '.spk-page{width:210mm;height:297mm;min-height:297mm;background:#fff;margin:0 auto 22px;padding:25.4mm;box-shadow:0 8px 30px rgba(10,20,28,.34);overflow:hidden}'+
    /* Lembar TABEL Lampiran SPK: margin lebih rapat supaya kolom-kolom harga muat */
    /* Cover (SPK & Lampiran) memakai margin yang sama dengan lembar tabel Lampiran:
       12mm atas/bawah, 15mm kiri/kanan — desain cover butuh bidang lebih lebar.
       Halaman isi kontrak & Daftar Isi tetap margin normal 2,54cm. */
    '.spk-page.spk-lampsheet,.spk-page.spk-cover{padding:12mm 15mm}'+
    '.spk-page.spk-flow{height:auto;overflow:visible}'+
  '}';
}
/* =========================================================================
   GAYA DOKUMEN SPK (bagian baru): Cover, Daftar Isi, Kop/Footer berulang,
   halaman tanda tangan, dan lembar Lampiran. Ditambahkan SETELAH spkDocCss()
   sehingga menimpa gaya lama bila ada yang bertabrakan.
   ========================================================================= */
function spkDocCss2(){
  const G="'Plus Jakarta Sans','Segoe UI',Arial,sans-serif";
  return ''+
  '@page{size:A4 portrait;margin:0}'+
  /* Halaman Lampiran memakai ukuran & margin yang SAMA dengan halaman kontrak:
     A4 portrait. CATATAN: halaman kontrak memakai margin NORMAL 2,54cm, sedangkan
     lembar TABEL Lampiran SPK memakai 12mm/15mm agar kolom harga muat. Aturan halaman
     khusus 15mm sudah dicabut — tidak diperlukan lagi setelah bug colgroup ganda
     pada paginator diperbaiki, sebab tabel kini melebar penuh dengan benar. */
  'html,body{background:#fff}'+
  '.spk-doc{counter-reset:spkcl}'+
  '.spk-page{position:relative;page-break-after:always;break-after:page}'+
  '.spk-page:last-child{page-break-after:auto;break-after:auto}'+
  /* ---------- COVER ----------
     Tinggi cover dibuat PERSIS setinggi bidang cover (297mm - 12mm - 12mm = 273mm),
     sehingga ukuran cover di pratinjau layar
     dan di hasil Cetak/PDF benar-benar sama (tidak ada sisa 8mm seperti semula). */
  '.spk-cover{font-family:'+G+';color:#201E1D;display:flex;flex-direction:column;min-height:273mm}'+
  '.spk-cover .cv-top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}'+
  '.spk-cover .cv-brand{display:flex;align-items:center;gap:16px}'+
  '.spk-cover .cv-brand img{height:56px;width:auto;display:block}'+
  /* Garis pemisah vertikal antara logo dan tulisan (terukur dari dokumen acuan:
     tinggi 46px, tebal 1px, #C7C7C7, jarak 16px dari logo). */
  '.spk-cover .cv-brand .cv-org{border-left:1px solid #C7C7C7;padding-left:16px}'+
  '.spk-cover .cv-org{line-height:1.35}'+
  /* Sedikit jarak antara "PT PLN (PERSERO)" dan "UP3 Masohi" agar tidak menempel */
  '.spk-cover .cv-org span{display:block;font-size:9px;letter-spacing:.2em;color:#8F8E8E;font-weight:700;margin-bottom:4px}'+
  '.spk-cover .cv-org b{display:block;font-size:16px;color:#201E1D;font-weight:800}'+
  '.spk-cover .cv-no{text-align:right;line-height:1.5}'+
  '.spk-cover .cv-no span{display:block;font-size:9px;letter-spacing:.2em;color:#8F8E8E;font-weight:700}'+
  '.spk-cover .cv-no b{display:block;font-size:12.5px;color:#201E1D;font-weight:800;letter-spacing:.02em}'+
  '.spk-cover .cv-no i{display:block;font-style:normal;font-size:11px;color:#8F8E8E;margin-top:2px}'+
  '.spk-cover .cv-rule{border-top:2px solid #201E1D;margin:13px 0 0}'+
  '.spk-cover .cv-rule2{border-top:2px solid #201E1D;margin:20px 0 0}'+
  /* Aksen kuning PLN sebagai pembuka blok judul */
  '.spk-cover .cv-accent{width:56px;border-top:4px solid #F6B40E;margin-top:38px}'+
  '.spk-cover .cv-eyebrow{margin-top:16px;font-size:9px;font-weight:700;letter-spacing:.22em;color:#1B3A6B}'+
  '.spk-cover .cv-title{margin:15px 0 0;font-size:60px;line-height:.98;font-weight:800;letter-spacing:-.03em;color:#1B3A6B;max-width:66%}'+
  '.spk-cover .cv-title span{display:inline}'+
  /* Kata terakhir judul diberi warna emas PLN sebagai aksen (mis. "Lampiran SPK",
     "Surat Perintah Kerja") agar judul lebih hidup namun tetap resmi. */
  '.spk-cover .cv-title span:last-child{color:#E0A200;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  /* DARI/KEPADA & grid data memakai RITME KOLOM YANG SAMA: dua blok 50% dengan
     celah 10px di tengah. Celah itulah pemisahnya — jadi garis vertikal atas dan
     bawah otomatis jatuh di titik yang persis sama (dulu beda karena yang satu
     pakai flex:1 + border-left, yang lain flex:0 0 50% + border-right). */
  '.spk-cover .cv-parties{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}'+
  '.spk-cover .cv-parties .p{flex:0 0 calc(50% - 5px);background:linear-gradient(135deg,#FAFBFE,#EDF2FB);border:1px solid #E3E9F3;border-left:3px solid #F6B40E;border-radius:8px;padding:14px 16px;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  '.spk-cover .cv-parties .pl{font-size:9px;font-weight:700;letter-spacing:.2em;color:#1B3A6B;margin-bottom:9px}'+
  '.spk-cover .cv-parties .pn{font-size:16px;font-weight:800;color:#201E1D;line-height:1.3}'+
  '.spk-cover .cv-parties .ps{font-size:11.5px;color:#8F8E8E;margin-top:3px}'+
  '.spk-cover .cv-spacer{flex:1 1 auto;min-height:14mm}'+
  '.spk-cover .cv-grid{display:flex;flex-wrap:wrap;gap:10px}'+
  '.spk-cover .cv-grid .f{flex:0 0 calc(50% - 5px);min-width:0;background:linear-gradient(135deg,#FAFBFE,#EDF2FB);border:1px solid #E3E9F3;border-left:3px solid #F6B40E;border-radius:8px;padding:12px 16px;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  '.spk-cover .fk{font-size:9px;font-weight:700;letter-spacing:.16em;color:#1B3A6B}'+
  /* Nilai dibuat RATA KIRI-KANAN agar blok teks panjang rapi bertepi lurus */
  '.spk-cover .fv{font-size:13px;font-weight:800;color:#201E1D;margin-top:7px;line-height:1.45;'+
    'text-align:justify;text-justify:inter-word;hyphens:none;overflow-wrap:anywhere}'+
  /* SUMBER ANGGARAN dijaga tetap 1 baris; bila terlalu panjang, ukuran fontnya
     dikecilkan otomatis oleh fitLastRow() sampai muat (min 8px), lalu ukuran itu
     diterapkan juga ke TANGGAL ANGGARAN agar sebaris seragam. */
  '.spk-cover .fv-fit{white-space:nowrap;overflow-wrap:normal;text-align:left}'+
  /* Baris terakhir paragraf justify tetap rata kiri (bawaan), dan nilai kosong dibuat redup */
  '.spk-cover .fv.kosong{color:#C2C6CC}'+
  '.spk-cover .cv-nilai{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;border-top:1px solid #E2E2E2;padding-top:12px;margin-top:0}'+
  '.spk-cover .cv-nilai .fk{font-size:9px;font-weight:700;letter-spacing:.16em;color:#F6B40E}'+
  '.spk-cover .cv-nilai .terb{font-size:11px;color:#C3D2EA;margin-top:6px}'+
  '.spk-cover .cv-nilai .r{font-size:26px;font-weight:800;color:#fff;white-space:nowrap}'+
  /* Panel nilai pekerjaan jadi titik fokus cover: gradasi biru tua PLN dengan
     aksen emas & teks terang, kontras kuat terhadap kartu data di atasnya. */
  '.spk-cover .cv-nilai{background:linear-gradient(135deg,#1B3A6B,#274E86);border-left:4px solid #F6B40E;border-radius:10px;padding:16px 18px;margin-top:10px;border-top:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  '.spk-cover .cv-foot{margin-top:14px;font-size:11px;color:#8F8E8E;line-height:1.7}'+
  /* ---------- VARIAN COVER: Surat Perintah Kerja vs Perjanjian/Kontrak ----------
     Kedua cover memakai kerangka yang sama; pembedanya warna aksen, bentuk garis,
     dan chip jenis dokumen di pojok kanan atas. */
  '.spk-cover .cv-top{position:relative}'+
  '.spk-cover .cv-kind{align-self:flex-start;font-size:9px;font-weight:800;letter-spacing:.18em;'+
    'padding:7px 12px;border-radius:999px;white-space:nowrap;'+
    '-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  /* SPK — aksen emas */
  '.spk-cover.cv-spk .cv-kind{background:#FDF3D4;color:#8A6A00;border:1px solid #F2D68A}'+
  /* PK — aksen navy + garis emas kedua + garis ganda di bawah judul */
  '.spk-cover.cv-pk .cv-kind{background:#1B3A6B;color:#fff;border:1px solid #1B3A6B}'+
  '.spk-cover.cv-pk .cv-accent{width:120px;border-top:4px solid #1B3A6B}'+
  '.spk-cover.cv-pk .cv-accent2{width:56px;border-top:4px solid #F6B40E;margin-top:5px}'+
  '.spk-cover.cv-pk .cv-eyebrow{color:#8A6A00}'+
  '.spk-cover.cv-pk .cv-title{color:#12304F}'+
  '.spk-cover.cv-pk .cv-title span:last-child{color:#12304F}'+
  '.spk-cover.cv-pk .cv-rule2{border-top:3px double #1B3A6B}'+
  '.spk-cover.cv-pk .cv-parties .p{border-left:3px solid #1B3A6B}'+
  '.spk-cover.cv-pk .cv-grid .f{border-left:3px solid #1B3A6B}'+
  '.spk-cover.cv-pk .cv-nilai{background:linear-gradient(135deg,#12304F,#1B3A6B);border-left:4px solid #F6B40E}'+
  /* ---------- Kop nomor kedua pihak (preamble Perjanjian/Kontrak) ----------
     Tampil POLOS: tanpa latar, bingkai, sudut membulat, maupun padding.
     Tata letak memakai table agar:
       - lebar kolom label MENEMPEL pada teks terpanjangnya, sehingga titik dua
         tidak melayang jauh (dulu kolom label dipatok 42% lebar halaman);
       - titik dua kedua baris tetap lurus satu sama lain;
       - seluruh blok berdiri di TENGAH lebar margin (margin:auto), sementara
         isinya sendiri tetap rata kiri. */
  /* Garis pembatas antara blok nomor kedua pihak dan kalimat pembuka.
     JARAK TOTAL dari baris "Nomor PIHAK KEDUA" ke kalimat "Perjanjian ini
     dibuat ..." = 18pt, dibagi rata: 9pt di atas garis (padding-bottom) dan
     9pt di bawahnya (margin-bottom), sehingga garis berada tepat di tengah
     jarak itu. Paragraf .kl0 sesudahnya bermargin-atas 0, jadi tidak ada
     margin yang runtuh (collapse) dan jaraknya benar-benar 18pt. */
  /* Jarak dari baris "Nomor PIHAK KEDUA" ke kalimat "Perjanjian ini dibuat ..."
     = 18pt. Garis pembatas SUDAH DIHAPUS atas permintaan; yang tersisa hanya
     jaraknya. Aman dari margin collapse karena `.spk-cl p` bermargin-atas 0.
     PENTING — kekhususan (specificity) selektor: `.spk-cl .spk-keep{margin:0;
     padding:0;border:0}` di spkDocCss() bernilai dua-kelas dan MENGALAHKAN
     `.spk-pkhead` yang satu kelas, berapa pun urutannya. Karena blok ini memang
     ber-class `spk-keep` (penanda bagi paginator), selektornya ditulis tiga
     kelas agar pasti menang. */
  '.spk-cl .spk-pkhead.spk-keep{margin:0 0 18pt}'+
  '.spk-pknum{display:table;margin:0 auto;padding:0;border:0;border-radius:0;background:none}'+
  '.spk-pknum .r{display:table-row;line-height:1.75}'+
  '.spk-pknum .k{display:table-cell;font-weight:700;white-space:nowrap;padding-right:0.45cm}'+
  '.spk-pknum .s{display:table-cell;padding-right:0.2cm}'+
  '.spk-pknum .v{display:table-cell;font-weight:700;white-space:nowrap}'+
  /* ---------- DAFTAR ISI ---------- */
  '.spk-tocpage{font-family:'+G+';color:#201E1D}'+
  '.spk-tocpage .toc-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px}'+
  '.spk-tocpage h1{margin:0;font-size:46px;font-weight:800;letter-spacing:-.025em;color:#201E1D}'+
  '.spk-tocpage .toc-meta{text-align:right;line-height:1.6}'+
  '.spk-tocpage .toc-meta b{display:block;font-size:9px;font-weight:700;letter-spacing:.18em;color:#1B3A6B}'+
  '.spk-tocpage .toc-meta span{display:block;font-size:8.5px;font-weight:700;letter-spacing:.14em;color:#1B3A6B}'+
  '.spk-tocpage .toc-accent{width:56px;border-top:4px solid #F6B40E;margin-bottom:14px}'+
  '.spk-tocpage .toc-rule{border-top:2px solid #201E1D;margin:16px 0 6px}'+
  /* ---- Kotak pembungkus + dua kolom bergaris tegak ----
     .toc-box  : bingkai kotak mengelilingi SELURUH data daftar isi.
     .toc-2k   : dua kolom; column-rule menjadi garis pemisah tegak yang
                 tingginya otomatis berhenti di baris data terbawah.
     Baris dijaga tidak terbelah antar-kolom (break-inside:avoid). */
  /* Bingkai luar & garis tegak sengaja SAMAR: tipis (0,8px) dan abu-abu muda
     (#D6DAE0, warna yang sama dengan titik-titik penuntun), supaya membingkai
     tanpa mencuri perhatian dari judul pasal. */
  '.spk-tocpage .toc-box{border:0.8px solid #D6DAE0;padding:6mm 6mm 5mm;margin-top:10px}'+
  '.spk-tocpage .spk-toc2.toc-2k{margin-top:0;column-count:2;column-gap:9mm;'+
    'column-rule:0.8px solid #D6DAE0;column-fill:balance}'+
  '.spk-tocpage .spk-toc2.toc-2k .row{break-inside:avoid;page-break-inside:avoid}'+
  '.spk-tocpage .spk-toc2.toc-2k .row:first-child{border-top:0}'+
  '.spk-tocpage .spk-toc2.toc-2k .row .nm{flex:1 1 auto;max-width:none}'+
  '.spk-tocpage .spk-toc2.toc-2k .row .dot{flex:0 1 auto;min-width:8px;margin:0 6px}'+
  /* Huruf sedikit DIPERBESAR dan jarak antar-baris DIRAPATKAN: padding baris
     17px -> 11px, huruf 14px -> 15px (nomor halaman 15px -> 16px). Nilai dasar
     ini HARUS sama dengan yang dipakai tocSkala() di spkPageScript, karena
     fungsi itu mengalikannya dengan faktor pengecilan bila daftar tak muat. */
  '.spk-tocpage .spk-toc2.toc-2k .row{padding:11px 2px;font-size:15px;line-height:1.3}'+
  '.spk-tocpage .spk-toc2.toc-2k .row .no{font-size:15px}'+
  '.spk-tocpage .spk-toc2.toc-2k .row .nm{font-size:15px}'+
  '.spk-tocpage .spk-toc2.toc-2k .row .pg{font-size:16px}'+
  '.spk-toc2{margin-top:4px}'+
  '.spk-toc2 .row:last-child{border-bottom:1px solid #E2E2E2}'+
  '.spk-toc2 .row{display:flex;align-items:baseline;gap:0;padding:17px 2px;border-top:1px solid #E2E2E2;border-bottom:0;font-size:14px}'+
  '.spk-toc2 .row:first-child{border-top:0}'+
  /* Nomor pasal memakai huruf & warna yang SAMA dengan judul di sebelahnya —
     pembeda cukup dari ketebalannya saja, sehingga daftar terlihat lebih tenang. */
  '.spk-toc2 .row .no{flex:0 0 auto;width:44px;font-weight:700;color:#201E1D;font-size:14px;font-variant-numeric:tabular-nums}'+
  '.spk-toc2 .row .nm{flex:0 0 auto;font-weight:600;color:#201E1D;font-size:14px;max-width:70%}'+
  '.spk-toc2 .row .nm i{font-style:italic}'+
  '.spk-toc2 .row .dot{flex:1;border-bottom:1.5px dotted #D6DAE0;transform:translateY(-3px);margin:0 14px}'+
  '.spk-toc2 .row .pg{flex:0 0 auto;font-weight:800;color:#1B3A6B;font-size:15px;min-width:2em;text-align:right;font-variant-numeric:tabular-nums}'+
  /* ---- Kerapatan Daftar Isi (otomatis, lihat spkTocDensity) ----
     d1/d2 = satu kolom dengan jarak baris makin rapat; d3 = dua kolom untuk
     dokumen berpasal banyak (mis. Perjanjian/Kontrak 43 pasal). Judul yang
     panjang boleh melipat ke baris kedua tanpa mendorong nomor halaman. */
  '.spk-tocpage .spk-toc2.d1 .row{padding:11px 2px;font-size:13px}'+
  '.spk-tocpage .spk-toc2.d1 .row .no{width:40px;font-size:15px}'+
  '.spk-tocpage .spk-toc2.d1 .row .nm{font-size:13px}'+
  '.spk-tocpage .spk-toc2.d1 .row .pg{font-size:14px}'+
  '.spk-tocpage .spk-toc2.d2 .row{padding:7px 2px;font-size:12px;line-height:1.25}'+
  '.spk-tocpage .spk-toc2.d2 .row .no{width:34px;font-size:13px}'+
  '.spk-tocpage .spk-toc2.d2 .row .nm{font-size:12px}'+
  '.spk-tocpage .spk-toc2.d2 .row .pg{font-size:12.5px}'+
  '.spk-tocpage .spk-toc2.d2 .row .dot{margin:0 9px}'+
  /* Dua kolom dengan garis pemisah vertikal yang membentang PENUH sampai dekat
     margin bawah — bukan hanya setinggi baris terakhir — sehingga daftar terbaca
     sebagai dua panel yang disengaja. 218mm = tinggi bidang cetak A4 (246,2mm)
     dikurangi blok judul "Daftar Isi" (±26mm). */
  '.spk-tocpage .spk-toc2.d3{column-count:2;column-gap:10mm;column-rule:1px solid #D6DAE0;'+
    'column-fill:balance;min-height:218mm;margin-top:2px}'+
  '.spk-tocpage .spk-toc2.d3 .row .no{width:26px;font-size:12px;font-weight:700;color:#201E1D}'+
  '.spk-tocpage .spk-toc2.d3 .row{display:flex;break-inside:avoid;page-break-inside:avoid;'+
    'padding:6.5px 1px;font-size:12px;line-height:1.25}'+
  '.spk-tocpage .spk-toc2.d3 .row .nm{flex:1 1 auto;max-width:none;font-size:12px}'+
  '.spk-tocpage .spk-toc2.d3 .row .dot{flex:0 1 20px;min-width:6px;margin:0 6px;transform:translateY(-2px)}'+
  '.spk-tocpage .spk-toc2.d3 .row .pg{font-size:12.5px;min-width:1.4em}'+
  /* Pada dua kolom, baris pertama tiap kolom tetap bergaris atas agar rata */
  '.spk-tocpage .spk-toc2.d3 .row:first-child{border-top:1px solid #E2E2E2}'+
  /* ---------- KOP & FOOTER BERULANG (halaman isi) ---------- */
  'table.spk-run{width:100%;border-collapse:collapse;border:0;background:transparent}'+
  'table.spk-run > thead > tr > td,table.spk-run > tbody > tr > td,table.spk-run > tfoot > tr > td{padding:0;border:0;background:transparent}'+
  /* ===== JARAK GARIS <-> TULISAN DIBUAT CERMIN (SIMETRIS) =====
     Kop : tulisan -12px- GARIS -16px- isi halaman
     Kaki: isi halaman -16px- GARIS -12px- tulisan
     Dulu kaki memakai padding-top 19px, jadi jarak garis->tulisan di bawah 7px lebih
     jauh daripada di atas. Sekarang keduanya 12px. */
  '.spk-rhd{display:flex;align-items:center;justify-content:space-between;gap:14px;padding-bottom:12px;border-bottom:2px solid #201E1D;margin-bottom:16px;font-family:'+G+'}'+
  '.spk-rhd .l{display:flex;align-items:center;gap:16px}'+
  '.spk-rhd img{height:47px;width:auto;display:block}'+
  /* Garis pemisah vertikal (tinggi 38px, tebal 1px, #C7C7C7, jarak 16px). */
  '.spk-rhd .l .o{border-left:1px solid #C7C7C7;padding-left:16px}'+
  '.spk-rhd .o{line-height:1.3}'+
  '.spk-rhd .o span{display:block;font-size:8.5px;letter-spacing:.2em;color:#8F8E8E;font-weight:700;margin-bottom:3px}'+
  '.spk-rhd .o b{display:block;font-size:14px;color:#201E1D;font-weight:800}'+
  '.spk-rhd .r{text-align:right;line-height:1.4}'+
  '.spk-rhd .r b{display:block;font-size:12px;font-weight:800;color:#201E1D;letter-spacing:.13em}'+
  '.spk-rhd .r span{display:block;font-size:10.5px;color:#8F8E8E;letter-spacing:.02em;margin-top:3px}'+
  '.spk-rft{border-top:2px solid #201E1D;margin-top:16px;padding-top:12px;font-family:'+G+'}'+
  '.spk-rft .ft-unit{text-align:center;font-size:9px;font-weight:700;letter-spacing:.2em;color:#8F8E8E;margin-bottom:8px}'+
  '.spk-rft .ft-rule{border-top:1px solid #E2E2E2;margin-bottom:12px}'+
  '.spk-rft .ft-row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;font-weight:700;color:#201E1D;letter-spacing:.01em}'+
  '.spk-rft .ln{display:inline-block;width:2.54cm;border-bottom:1px solid #201E1D;margin:0 10px;vertical-align:middle}'+
  '.spk-rft .c{font-weight:700;color:#201E1D;text-align:center;flex:0 0 auto}'+
  '.spk-rft .ft-row .ft-unit{margin-bottom:10px}'+
  '.spk-rft .ft-pg{font-size:11px;font-weight:800;color:#201E1D;letter-spacing:.02em}'+
  '.spk-rft .l,.spk-rft .r{white-space:nowrap}'+

  /* ==========================================================================
     PERJANJIAN/KONTRAK — HALAMAN ISI KLAUSUL
     Sejak penyeragaman, halaman isi Perjanjian/Kontrak memakai kop, kaki, dan
     bidang cetak yang PERSIS SAMA dengan Surat Perintah Kerja. Aturan khusus
     yang dahulu ada di sini — bingkai tipis mengelilingi bidang cetak, kaki
     tanpa garis & tanpa tulisan "UP3 MASOHI", serta tarikan margin -7mm di
     atas/bawah — SUDAH DIHAPUS. Gaya penomoran & indentasi klausul PK (di
     bagian atas berkas ini) tidak tersentuh.
     ========================================================================== */
  /* ---------- ISI: BAB & tanda tangan ---------- */
  /* Jarak dari blok judul (SURAT PERINTAH KERJA + nomor kontrak) ke teks pertama
     "Pada hari ini ..." = 12pt. */
  /* Judul "SURAT PERINTAH KERJA" + Nomor Kontrak (halaman 1 isi kontrak):
     WARNA HITAM, jenis huruf mengikuti ISI KONTRAK (Inter/Arial 11pt),
     dan garis pembatas antara judul dengan nomor kontrak juga HITAM. */
  /* ---------- KOP HALAMAN PERTAMA PERJANJIAN/KONTRAK ----------
     Rata tengah, huruf kapital, tebal. Baris penghubung (TENTANG/ANTARA/DENGAN)
     dibuat sedikit lebih kecil supaya nama pekerjaan & nama para pihak yang
     menonjol. Ditutup GARIS GANDA tepat sebelum blok nomor kedua belah pihak. */
  /* ==========================================================================
     SAMPUL & DAFTAR ISI — BENTUK PERJANJIAN/KONTRAK
     Gaya dokumen perjanjian cetak: bingkai, rata tengah, tanpa aksen warna.
     Semua selektor berdiri sendiri (.spk-coverpk / .toc-pk) sehingga desain
     Sampul & Daftar Isi Surat Perintah Kerja tidak tersentuh sama sekali.
     ========================================================================== */
  /* --- Sampul --- */
  /* Padding halaman disetel sendiri (bukan 25,4mm bawaan .spk-page, dan bukan
     12/15mm milik .spk-cover) supaya isi duduk rapi di dalam bingkai:
       bingkai luar 12mm, bingkai dalam 14,5mm, isi mulai 20mm -> jarak ~5,5mm.
     Spesifisitas (0,2,0) mengalahkan .spk-page (0,1,0) di dalam @media mana pun. */
  '.spk-page.spk-coverpk{padding:20mm}'+
  '.spk-coverpk{font-family:"Inter Local","Inter","Segoe UI",Arial,sans-serif;color:#000;'+
    'position:relative;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  /* Bingkai ganda: garis luar tebal + garis dalam tipis */
  '.spk-coverpk::before,.spk-coverpk::after{content:"";position:absolute;pointer-events:none;border:solid #000}'+
  '.spk-coverpk::before{top:12mm;right:12mm;bottom:12mm;left:12mm;border-width:2.5pt}'+
  '.spk-coverpk::after{top:14.5mm;right:14.5mm;bottom:14.5mm;left:14.5mm;border-width:.75pt}'+
  '.spk-coverpk .cpk-in{position:relative;z-index:1;padding:4mm 4mm 0}'+
  '.spk-coverpk .cpk-org{text-align:center;font-size:13pt;font-weight:800;letter-spacing:.02em;'+
    'text-transform:uppercase;line-height:'+spkLHCss(1.15)+';text-wrap:balance}'+
  '.spk-coverpk .cpk-adr{text-align:center;font-size:12pt;font-weight:700;margin-top:7mm;'+
    'line-height:'+spkLHCss(1.15)+';text-wrap:balance}'+
  '.spk-coverpk .cpk-jd{text-align:center;font-size:13pt;font-weight:800;letter-spacing:.03em;'+
    'text-transform:uppercase;margin-top:8mm;line-height:'+spkLHCss(1.15)+'}'+
  '.spk-coverpk .cpk-sb{text-align:center;font-size:12pt;font-weight:800;letter-spacing:.05em;'+
    'text-transform:uppercase;margin-top:7mm;line-height:'+spkLHCss(1.15)+'}'+
  '.spk-coverpk .cpk-nm{text-align:center;font-size:12.5pt;font-weight:800;letter-spacing:.01em;'+
    'text-transform:uppercase;margin-top:7mm;line-height:'+spkLHCss(1.15)+';text-wrap:balance}'+
  '.spk-coverpk .cpk-rule{margin:9mm 0 7mm;border-top:3px double #000;height:0}'+
  /* Daftar keterangan: kolom label - titik dua - nilai, sejajar seperti dokumen acuan */
  '.spk-coverpk .cpk-grid{display:grid;grid-template-columns:max-content max-content 1fr;'+
    'row-gap:5mm;column-gap:0;font-size:11.5pt;line-height:'+spkLHCss(1.15)+'}'+
  '.spk-coverpk .cpk-grid .r{display:contents}'+
  '.spk-coverpk .cpk-grid .k{padding-right:8mm}'+
  '.spk-coverpk .cpk-grid .s{padding-right:4mm}'+
  '.spk-coverpk .cpk-grid .v{text-align:justify}'+
  '.spk-coverpk .cpk-grid .v.kosong{color:#666}'+
  '.spk-coverpk .cpk-grid .v .x{display:block;margin-top:3mm}'+
  /* --- Daftar Isi --- */
  '.spk-tocpage.toc-pk{font-family:"Inter Local","Inter","Segoe UI",Arial,sans-serif;color:#000;position:relative}'+
  '.spk-tocpage.toc-pk::before{content:"";position:absolute;top:15mm;right:15mm;bottom:15mm;left:15mm;'+
    'border:1pt solid #000;pointer-events:none}'+
  '.spk-tocpage.toc-pk .tpk-h{position:relative;z-index:1;text-align:center;font-size:13pt;font-weight:800;'+
    'letter-spacing:.03em;text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:2px;'+
    'margin:0 0 9mm;line-height:'+spkLHCss(1.15)+'}'+
  '.spk-tocpage.toc-pk .spk-toc2{position:relative;z-index:1;margin-top:0}'+
  /* Baris polos: tanpa garis pemisah, hanya titik-titik penuntun */
  '.spk-tocpage.toc-pk .spk-toc2 .row{border:0;padding:0 0 4.2mm;font-size:11pt;align-items:baseline}'+
  '.spk-tocpage.toc-pk .spk-toc2 .row:first-child,.spk-tocpage.toc-pk .spk-toc2 .row:last-child{border:0}'+
  '.spk-tocpage.toc-pk .spk-toc2 .row .no{width:auto;min-width:20mm;font-size:11pt;font-weight:400;'+
    'color:#000;padding-right:3mm;white-space:nowrap}'+
  '.spk-tocpage.toc-pk .spk-toc2 .row .nm{font-size:11pt;font-weight:400;color:#000;max-width:74%;'+
    'text-transform:uppercase}'+
  '.spk-tocpage.toc-pk .spk-toc2 .row .dot{border-bottom:1px dotted #000;transform:translateY(-3px);margin:0 2mm}'+
  '.spk-tocpage.toc-pk .spk-toc2 .row .pg{font-size:11pt;font-weight:400;color:#000;min-width:2em}'+

  '.spk-judulpk{text-align:center;font-family:"Inter Local","Inter","Segoe UI",Arial,sans-serif;'+
    'color:#000;margin:0 0 10pt;padding-bottom:9pt;border-bottom:3px double #000;'+
    '-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  '.spk-judulpk .jd{font-size:12pt;font-weight:800;letter-spacing:.05em;text-transform:uppercase;line-height:'+spkLHCss(1.15)+'}'+
  '.spk-judulpk .sb{font-size:11pt;font-weight:700;letter-spacing:.06em;text-transform:uppercase;'+
    'line-height:'+spkLHCss(1.15)+';margin-top:9pt}'+
  '.spk-judulpk .nm{font-size:11.5pt;font-weight:800;letter-spacing:.03em;text-transform:uppercase;'+
    'line-height:'+spkLHCss(1.15)+';margin-top:9pt;text-wrap:balance}'+
  '.spk-bab{text-align:center;font-family:"Inter Local","Inter","Segoe UI",Arial,sans-serif;margin:0 0 12pt}'+
  '.spk-bab b{display:block;font-family:"Inter Local","Inter","Segoe UI",Arial,sans-serif;font-size:12pt;font-weight:800;color:#000;text-decoration:underline;text-decoration-color:#000;text-decoration-thickness:2px;text-underline-offset:5px;letter-spacing:.05em;text-transform:uppercase;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  '.spk-bab span{display:block;font-family:"Inter Local","Inter","Segoe UI",Arial,sans-serif;font-size:11pt;font-weight:700;color:#000;letter-spacing:.06em;margin-top:7px}'+
  /* Jarak dari kalimat "…kami yang bertanda tangan dibawah ini :" ke blok
     "I. PT PLN (PERSERO):" beserta uraiannya = 12 pt. */
  '.spk-cl p.kl0 + .spk-party{margin-top:12pt}'+
  /* Jarak antar blok PIHAK (I. PT PLN → II. Penyedia) = 12 pt */
  '.spk-cl .spk-party{margin-bottom:12pt}'+
  '.spk-signpage{page-break-before:always;break-before:page;padding-top:8mm}'+
  /* Jarak dari klausul terakhir ke blok tanda tangan = 24 pt */
  '.spk-signpage .spk-sign{margin-top:24pt}'+
  /* Ruang tanda tangan DIJAMIN cukup untuk MATERAI Rp10.000 (materai tempel ~21x24 mm,
     e-meterai ~22 mm). Slot ini mengunci tinggi 26 mm di KEDUA kolom (PIHAK KEDUA &
     PIHAK PERTAMA) sehingga materai muat tanpa menabrak nama/jabatan, dan kedua kolom
     tetap sejajar. Kotak panduan putus-putus + label hanya tampil di LAYAR; saat
     dicetak / diekspor PDF, slot menjadi ruang kosong tanpa garis maupun tulisan. */
  '.spk-signpage .spk-sign .materai-slot{width:24mm;height:0;margin:0 auto;box-sizing:border-box}'+
  
  '@media screen{'+
    '.spk-signpage .spk-sign .materai-slot{display:none}'+
    
  '}'+
  '@media print{'+
    '.spk-signpage .spk-sign .materai-slot{border:none}'+
    '.spk-signpage .spk-sign .materai-slot::after{content:""}'+
  '}'+
  /* ---------- LEMBAR LAMPIRAN (dokumen bergaya HPS) ---------- */
  '.spk-lampsheet{page-break-before:always;break-before:page}'+
  /* LEBAR ISI HALAMAN LAMPIRAN = LEBAR ISI HALAMAN DOKUMEN HPS.
       HPS : 210mm - 2 x 15,0mm = 180,0 mm
       SPK : 210mm - 2 x 25,4mm = 159,2 mm   (margin dokumen kontrak 2,54 cm)
     Selisih 20,8mm membuat tabel yang sama terjepit ~12% sehingga judul kolomnya
     pecah dan tabel terlihat gepeng. Margin negatif 10,4mm di kiri & kanan
     mengembalikan lebar isi Lampiran ke 180mm, identik dengan Perhitungan HPS.
     Berlaku di layar maupun cetak, dan ikut terpakai pada salinan halaman lanjutan. */
  '.spk-lampsheet .fkl-doc{padding:0;overflow:visible;background:transparent}'+
  /* Jarak dari baris "Lokasi Pekerjaan" (akhir tabel info) ke tabel rincian harga.
     Dulu jarak ini disumbang oleh judul seksi "B" (margin 22px) yang kini dihapus.
     :not(.spk-cont) => hanya tabel ASLI yang diberi jarak; salinan tabel pada
     halaman lanjutan (ditandai .spk-cont oleh paginator) tidak ikut terdorong. */
  '.spk-lampsheet table.hps-doc-tbl:not(.spk-cont){margin-top:12pt}'+
  /* Jaminan lebar: tabel rincian Lampiran (termasuk SALINANNYA di halaman lanjutan
     yang dibuat paginator, ditandai .spk-cont) memakai lebar & tata kolom yang
     sama persis dengan dokumen Perhitungan HPS. Tanpa ini, lembar yang memuat
     tabel utama bisa tampil lebih sempit daripada lembar blok Jumlah/DPP/PPn. */
  /* Jarak dari tabel total ke tanda tangan dipangkas separuh:
     padding 22px + margin 26px = 48px  ->  11px + 13px = 24px. */
  '.spk-lampsheet table.hps-doc-tbl tr.ttd-row > td{padding-top:11px}'+
  '.spk-lampsheet table.hps-doc-tbl,'+
  '.spk-lampsheet table.hps-doc-tbl.spk-cont{width:100%;table-layout:fixed;border-collapse:collapse}'+
  '.spk-lampsheet .fkl-doc,.spk-lampsheet .sh-bd > .fkl-doc{width:100%}'+
  /* Kolom label pada tabel info bawaan dokumen lebarnya 34% — jauh melebihi
     kebutuhan teks "Nama Pekerjaan"/"Lokasi Pekerjaan", sehingga titik dua dan
     nilainya terdorong jauh ke kanan. Dipersempit KHUSUS di Lampiran SPK
     (dokumen HPS & lainnya tetap 34%). */

  '.spk-lampsheet .fkl-doc-title{font-size:16px}'+
  /* Isi Lampiran memakai .fkl-doc yang punya padding bawaan 34px/40px. Di dalam
     lembar SPK jarak tepi sudah diatur padding halaman (12mm/15mm), jadi padding
     bawaan itu dinolkan — sama seperti dokumen HPS/Analisa yang berdiri sendiri,
     sehingga lebar tabel & tampilannya seragam di semua dokumen. */
  '.spk-sheet .fkl-doc,.spk-page .fkl-doc{padding:0;overflow:visible}'+
  /* Blok tanda tangan pada Lampiran: dua pihak (PIHAK KEDUA & PIHAK PERTAMA),
     tanggal di atas kolom PIHAK PERTAMA, nama bergaris bawah. */
  '.spk-lampsign{page-break-before:auto;break-before:auto;padding-top:0;margin-top:13px;break-inside:avoid;page-break-inside:avoid}'+
  '.spk-lampsign .spk-sign{margin-top:0}'+
  /* Tanda tangan LAMPIRAN mengikuti font & ukuran isi lampiran (.fkl-doc):
     'Plus Jakarta Sans' 12,5px warna #1a2b31 — sama seperti baris "Nama Pekerjaan".
     Sebelumnya dipaksa Arial 11pt sehingga terlihat berbeda sendiri. */
  '.spk-lampsign .spk-sign td{width:50%;text-align:center;vertical-align:top;padding:4px 6px;'+
    "font-family:'Plus Jakarta Sans','Segoe UI',sans-serif;font-size:12.5px;color:#1a2b31}"+
  '.spk-lampsign .ttd-date{min-height:1.2em;font-size:12.5px;margin-bottom:2px;color:#22343a;font-weight:500}'+
  /* SEMUA baris tanda tangan lampiran memakai ukuran & warna yang sama (12,5px).
     Sebelumnya ".role" diam-diam kena aturan bawaan HPS 'tr.ttd-row .role{font-size:12px}'
     — yang mulai berlaku sejak blok ini dipindah ke DALAM tabel — sehingga
     "PIHAK PERTAMA" (12px) terlihat lebih kecil dari "PT PLN (Persero)" (12,5px). */
  '.spk-lampsign .role{font-size:12.5px;font-weight:700;color:#1a2b31}'+
  '.spk-lampsign .org{font-size:12.5px;font-weight:700;color:#1a2b31;line-height:1.4;text-wrap:balance}'+
  '.spk-lampsign .nm{font-size:12.5px;font-weight:700;color:#1a2b31;text-decoration:underline;margin-top:78px}'+
  '.spk-lampsign .jab{font-size:12.5px;font-weight:700;color:#1a2b31}'+
  /* Penyeragaman TEGAS: setiap baris teks di kedua kolom tanda tangan lampiran
     (PIHAK KEDUA & PIHAK PERTAMA) memakai ukuran & tinggi baris yang sama persis,
     apa pun aturan bawaan yang mencoba menimpanya. */
  '.spk-lampsign .spk-sign td,'+
  '.spk-lampsign .spk-sign td > div{font-size:12.5px;line-height:1.35}'+
  /* Struktur dua baris (sg-head / sg-body) — lihat spkSignBlockHtml. Padding di
     pertemuan kedua baris dinolkan agar jarak vertikalnya persis seperti saat blok
     ini masih satu sel. */
  '.spk-lampsign .spk-sign tr.sg-head td{padding-bottom:0}'+
  '.spk-lampsign .spk-sign tr.sg-body td{padding-top:0}'+
  '.spk-lampsign .spk-sign td > div.ttd-date{font-weight:500}'+
  /* ---------- LEMBAR ISI HASIL PEMECAHAN HALAMAN (spkPageScript) ----------
     Isi kontrak & lampiran dipecah menjadi lembar A4 sungguhan: kop di atas,
     isi di tengah (tinggi tetap), footer paraf menempel di dasar lembar. */
  '.spk-sheet{display:flex;flex-direction:column;min-height:0;page-break-before:auto;break-before:auto}'+
  '.spk-sheet > .sh-hd{flex:0 0 auto}'+
  '.spk-sheet > .sh-bd{flex:1 1 auto;overflow:hidden}'+
  '.spk-sheet > .sh-ft{flex:0 0 auto;margin-top:auto}'+
  /* ---- KOP NAIK & KAKI TURUN MENDEKATI TEPI KERTAS ----
     HANYA berlaku pada bentuk PERJANJIAN/KONTRAK (.spk-doc.spk-pk). Bentuk
     Surat Perintah Kerja TIDAK tersentuh: kop & kakinya tetap pada bidang teks
     bermargin 25,4mm seperti semula.
     Pada Perjanjian/Kontrak kop ditarik NAIK dan kaki didorong TURUN sejauh
     13,4mm sehingga keduanya berhenti 12mm dari tepi kertas — masih menyisakan
     celah, dan simetris atas-bawah. Ruang 2 x 13,4mm yang terbebas dikembalikan
     ke tinggi badan halaman lewat EXPK di mk(), supaya jumlah baris per halaman
     tetap terhitung benar. Lembar Lampiran dikecualikan karena bidang cetaknya
     memang sudah bermargin 12mm. */
  '.spk-doc.spk-pk .spk-sheet:not(.spk-lampsheet) > .sh-hd{margin-top:-13.4mm}'+
  '.spk-doc.spk-pk .spk-sheet:not(.spk-lampsheet) > .sh-ft{margin-bottom:-13.4mm}'+
  /* ---- JUDUL KLAUSUL DI AWAL LEMBAR ----
     Blok pertama pada setiap lembar TIDAK boleh membawa "spasi sebelum" (judul klausul
     bawaannya 12 pt) karena akan mendorongnya turun dari margin atas. Sama seperti Word
     dengan opsi "Suppress Space Before after hard page break". Jarak dari kop ke judul
     cukup diatur oleh kop itu sendiri. */
  '.spk-sheet > .sh-bd > *:first-child{margin-top:0 !important}'+
  '.spk-sheet > .sh-bd > .spk-clause:first-child > .spk-cl-h:first-child{margin-top:0 !important;padding-top:0}'+
  '.spk-sheet > .sh-bd > .spk-clause:first-child > .spk-cl-h:first-child + .spk-cl{margin-top:0}'+
  '.spk-sheet > .sh-hd + .sh-bd{padding-top:0}'+
  /* halaman tanda tangan sudah berada pada lembarnya sendiri -> jangan paksa
     pindah halaman lagi (agar tidak muncul halaman kosong saat dicetak) */
  '.spk-sheet .spk-signpage{page-break-before:auto;break-before:auto;padding-top:0}'+
  /* klausul yang bersambung ke lembar berikutnya TIDAK menambah nomor klausul */
  '.spk-clause.spk-cont{counter-increment:none}'+
  '.spk-sheet .spk-cl,.spk-sheet .spk-cl *,.spk-sheet .spk-clause,.spk-sheet .spk-clause *,.spk-sheet .spk-cl-h,.spk-sheet .spk-cl-h *,.spk-sheet .spk-sign,.spk-sheet .spk-sign *{font-family:"Inter Local","Inter","Segoe UI",Arial,sans-serif;font-size:11pt}'+
  /* ---------- PRATINJAU DI LAYAR (lembar A4) ---------- */
  '@media screen{'+
    'html,body{background:#54585c;margin:0;padding:24px 0}'+
    '.spk-doc{margin:0 auto}'+
    '.spk-page{width:210mm;height:297mm;min-height:297mm;background:#fff;margin:0 auto 22px;padding:25.4mm;box-shadow:0 8px 30px rgba(10,20,28,.34);overflow:hidden}'+
    /* Lembar TABEL Lampiran SPK: margin lebih rapat supaya kolom-kolom harga muat */
    /* Cover (SPK & Lampiran) memakai margin yang sama dengan lembar tabel Lampiran:
       12mm atas/bawah, 15mm kiri/kanan — desain cover butuh bidang lebih lebar.
       Halaman isi kontrak & Daftar Isi tetap margin normal 2,54cm. */
    '.spk-page.spk-lampsheet,.spk-page.spk-cover{padding:12mm 15mm}'+
    '.spk-page.spk-flow{height:auto;overflow:visible}'+
    /* ===== PEMISAH HALAMAN DI PRATINJAU (seperti Rekap HPS) =====
       Lembar "isi" (spk-flow) tumbuh memanjang, jadi batas halaman fisik tidak
       terlihat. Lapisan .spk-guide (dibuat oleh spkPageScript) menggambar garis
       batas tepat di posisi tempat browser akan memotong halaman saat dicetak,
       plus label nomor halaman berikutnya. Hanya tampil di layar. */
    '.spk-guide{position:absolute;left:0;right:0;top:0;bottom:0;pointer-events:none;z-index:6}'+
    '.spk-guide .gband{position:absolute;left:-15mm;right:-15mm;height:16px;background:rgba(229,72,77,.09)}'+
    '.spk-guide .gl{position:absolute;left:-15mm;right:-15mm;height:0;border-top:1.5px dashed #E5484D}'+
    '.spk-guide .gl::after{content:attr(data-lbl);position:absolute;right:15mm;top:-8px;transform:translateY(-100%);background:#E5484D;color:#fff;font:800 9px/1.2 Arial,Helvetica,sans-serif;letter-spacing:.08em;padding:3px 8px;border-radius:5px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.25)}'+
    '.spk-guide .gl.top::after{right:auto;left:15mm;top:auto;bottom:-8px;transform:translateY(100%);background:#0E7C86}'+
  '}'+
  /* ---------- CETAK ---------- */
  '@media print{'+
    'html,body{background:#fff;margin:0;padding:0}'+
    /* ===== KOTAK HALAMAN SAMA PERSIS DENGAN PRATINJAU =====
       Dulu saat mencetak padding lembar dinolkan dan jarak tepi diserahkan ke
       @page{margin}. Akibatnya model kotaknya BEDA antara layar dan cetak: tinggi
       lembar (hasil paginator, diukur di layar) tidak lagi pas dengan area cetak,
       sehingga lembar tumpah sedikit -> muncul HALAMAN KOSONG di antara halaman isi,
       dan bila ada isi yang melebihi lebar area cetak, browser MENGECILKAN seluruh
       dokumen agar muat (hasil PDF terlihat 'terkompres').
       Kini @page{margin:0} dan tiap lembar tetap 210x297mm dengan padding sendiri
       (12mm atas/bawah, 15mm kiri/kanan) — persis seperti dokumen HPS (.hpsc-page).
       overflow:hidden menjamin lembar tidak pernah tumpah ke halaman berikutnya. */
    '.spk-page{width:210mm;height:297mm;min-height:297mm;margin:0;padding:25.4mm;box-shadow:none;overflow:hidden;page-break-after:always;break-after:page}'+
    /* Cover (SPK & Lampiran) memakai margin yang sama dengan lembar tabel Lampiran:
       12mm atas/bawah, 15mm kiri/kanan — desain cover butuh bidang lebih lebar.
       Halaman isi kontrak & Daftar Isi tetap margin normal 2,54cm. */
    '.spk-page.spk-lampsheet,.spk-page.spk-cover{padding:12mm 15mm}'+
    '.spk-page:last-child{page-break-after:auto;break-after:auto}'+
    /* Cadangan: bila paginator gagal jalan, lembar isi (.spk-flow) belum dipecah —
       biarkan memanjang & dipotong mesin cetak, jangan dipaksa 297mm. */
    '.spk-page.spk-flow{height:auto;min-height:0;overflow:visible}'+
    /* Tinggi lembar sudah ditentukan kotak halaman; min-height tak diperlukan lagi */
    '.spk-sheet{min-height:0}'+
    '.spk-cover{min-height:273mm}'+
    '.spk-guide{display:none!important}'+
    '.fkl-print-page{width:auto;min-height:0;margin:0;padding:0;box-shadow:none}'+
    'table.spk-run > thead{display:table-header-group}'+
    'table.spk-run > tfoot{display:table-footer-group}'+
    '.spk-signpage,.spk-rhd,.spk-rft{break-inside:avoid;page-break-inside:avoid}'+
    '.spk-cl-h{break-after:avoid;page-break-after:avoid}'+
  '}';
}
/* Membungkus penomoran di awal paragraf kl1/kl2 ke dalam <span class="n"> agar
   jarak nomor->teks SERAGAM mengikuti penggaris Word (tab 0,75 cm), baik untuk:
     - nomor TUNGGAL  : "1.", "10.", "a.", "I."
     - nomor MAJEMUK  : "5.1.", "3.1.1.", "11.1.1." dst.
   Aturan tampilan:
     - kl1 / kl2 -> ditandai .spk-sl (hanging tab konsisten dari margin levelnya)
   Perataan label majemuk selalu rata-kiri; nomor tunggal 2 digit (>=10) dibuat
   rata-kanan agar titik desimalnya sejajar dengan nomor 1 digit. Label majemuk
   memakai lebar kolom otomatis (min 0,75 cm) supaya "11.1.1." tetap mendapat
   jarak cukup tanpa menabrak teks. */
/* Jeda tetap antara nomor dan teks (cm). Cukup untuk tidak bertabrakan, tidak terlalu jauh. */
const SPK_NUM_GAP = 0.18;

/* =====================================================================
   KOLOM PENOMORAN BUTIR = KISI TEMPLATE .docx
   Sebelumnya lebar kotak nomor "memeluk" lebar teks nomornya (hug), sehingga
   kolom teks butir di layar (mis. 0,46 cm untuk "1.") tidak sama dengan hasil
   Word yang memakai gantungan TETAP dari gaya "Klausul Butir 1/2"
   (SPK 0,75 cm; Perjanjian/Kontrak 0,46 / 0,40 cm).
   spkNumCol() mengembalikan kolom yang benar untuk bentuk yang sedang aktif:
     w   = lebar kotak nomor  = hanging indent gaya butir,
     ml  = margin kiri paragraf = kolom teks butir - dasar isi klausul.
   Bila nomor ternyata LEBIH LEBAR dari kotak (mis. "11.10."), kotak dibiarkan
   melebar — persis perilaku tab stop Word yang terdorong ke perhentian
   berikutnya. Karena itu kotak dipasang memakai min-width, bukan width.
   ===================================================================== */
function spkNumCol(lvl2, hugCm){
  var D=(typeof spkDX==='function') ? spkDX() : null;
  hugCm=Math.max(0.4, +hugCm||0);
  if(!D) return { w:hugCm, ml:(lvl2?0.75:0)+hugCm, al:'left' };
  var cm=function(tw){ return Math.round(((+tw||0)/566.929)*100)/100; };
  var w  = cm(lvl2 ? D.L2_HANG : D.L1_HANG);
  var ml = cm((lvl2 ? D.L2 : D.L1) - D.BASE);
  return { w:Math.max(0.4,w), ml:Math.max(0,ml), al:(D.PUSAT?'right':'left') };
}

/* Perataan nomor daftar ANGKA per-KELOMPOK (aturan diminta user):
     - Penghitung SELURUHNYA 1 digit (mis. 1. .. 9. atau X.1 .. X.9) -> RATA KIRI.
     - Begitu ADA butir 2 digit dalam urutannya (…10., …11., atau 10., 11.) ->
       RATA KANAN + lebar kotak diseragamkan = nomor terpanjang, sehingga titik
       nomor & kolom teks SEMUA butir (1 & 2 digit) sejajar.
   Butir dari template Word (spk-wx): saat dirata-kanankan, margin-left asli Word
   DIPERTAHANKAN (kotak dilebarkan ke kiri lewat text-indent) -> tidak menimpa
   indent Word. Daftar HURUF (a. b. / I. II.) tidak disentuh sama sekali. */
function spkNumUniform(html){
  var s=String(html==null?'':html);
  if(s.indexOf('spk-sl')<0) return s;
  try{
    var box=document.createElement('div'); box.innerHTML=s;
    var ps=box.querySelectorAll('p.spk-sl'), grup={}, i, k, ubah=false;
    for(i=0;i<ps.length;i++){
      var p=ps[i], n=p.firstElementChild;
      if(!n || n.tagName!=='SPAN' || !n.classList || !n.classList.contains('n')) continue;
      var tok=String(n.textContent||'').replace(/[\s\u00A0]+/g,'');
      if(!tok || !/^(?:[0-9]+[.)])+$/.test(tok)) continue;         /* hanya nomor ANGKA */
      var w=spkTextWidthCm(tok); if(!(w>0)) continue;
      var lvl=(p.classList.contains('kl2')?'kl2':'kl1')+(p.classList.contains('spk-lv1')?'|lv1':'');
      k=lvl+'|'+tok.replace(/[0-9]+[.)]$/,'');                     /* "8.9." & "8.12." -> awalan "8." */
      if(!grup[k]) grup[k]={min:w, max:w, items:[]};
      if(w<grup[k].min) grup[k].min=w;
      if(w>grup[k].max) grup[k].max=w;
      grup[k].items.push({p:p, n:n, tok:tok});
    }
    for(k in grup){
      var g=grup[k];
      /* hasTwo = ada butir dengan penghitung terakhir 2 digit (>=10) -> grup dirata-kanankan.
         natW  = lebar hanging asli terlebar di grup (dari spkNumBox/spkNumberFix) supaya
                 jarak nomor->teks yang sudah ada tidak menyempit. */
      var hasTwo=false, natW=0;
      for(i=0;i<g.items.length;i++){
        var mm=/([0-9]+)[.)]$/.exec(g.items[i].tok||'');
        if(mm && mm[1].length>=2) hasTwo=true;
        var cw=parseFloat(g.items[i].n.style.width); if(cw>natW) natW=cw;
      }
      /* Lebar kotak nomor SERAGAM sekelompok. Titik tolaknya kini KOLOM KISI
         template .docx (spkNumCol), bukan lebar teks nomor; kotak hanya melebar
         bila nomor terpanjang memang tidak muat — persis tab stop Word yang
         terdorong. Karena semua butir dipatok lebar sama, titik penutup nomor
         1 & 2 digit tetap sejajar dan awal teksnya lurus. */
      var _lv2=!!(g.items[0] && g.items[0].p.classList.contains('kl2') &&
                  !g.items[0].p.classList.contains('spk-lv1'));
      var _colU=spkNumCol(_lv2, Math.round((g.max+SPK_NUM_GAP)*100)/100);
      var W=Math.max(0.4, _colU.w, Math.round((g.max+SPK_NUM_GAP)*100)/100);
      W=Math.round(W*100)/100;
      for(i=0;i<g.items.length;i++){
        var it=g.items[i];
        /* PERATAAN & KOLOM MENGIKUTI TEMPLATE .docx
           Gaya "Klausul Butir 1/2" memakai gantungan TETAP (spkNumCol) dan satu
           tab stop: SPK tab KIRI, Perjanjian/Kontrak tab KANAN. Lebar kotak
           diseragamkan sekelompok (W) supaya titik penutup nomor 1 & 2 digit
           lurus; bila W melebihi gantungan kisi, nomor mendorong teksnya ke
           kanan — sama seperti tab stop Word yang terdorong ke perhentian
           berikutnya. Baris sambungan tetap di kolom kisi (margin-left). */
        var isWx=!!(it.p.classList && it.p.classList.contains('spk-wx'));
        it.n.style.width='';
        it.n.style.minWidth=W.toFixed(2)+'cm';
        it.n.style.paddingRight=SPK_NUM_GAP+'cm';        /* jeda tetap nomor->teks */
        it.n.style.textAlign=_colU.al;
        it.n.style.overflow='visible';
        if(isWx){
          /* Isi dari template Word: PERTAHANKAN margin-left asli berkas .docx;
             kotak nomor hanya melebar ke KIRI lewat text-indent. */
          it.p.style.textIndent='-'+W.toFixed(2)+'cm';
        }else{
          it.p.style.marginLeft=_colU.ml.toFixed(2)+'cm';
          it.p.style.textIndent='-'+_colU.w.toFixed(2)+'cm';
        }
      }
      ubah=true;
    }
    return ubah ? box.innerHTML : s;
  }catch(e){ return s; }
}
/* Jaring pengaman BERBASIS DOM: pastikan SETIAP paragraf kl1/kl2 yang diawali nomor
   ANGKA (mis. "10.5.", "10.10.") memiliki kotak <span class="n">. Bekerja pada teks
   hasil parse (bukan regex mentah), jadi kebal terhadap: nomor tanpa spasi
   ("10.10.Petugas"), ada tag/entity setelah nomor, atau kelas tambahan pada paragraf.
   Yang SUDAH dikotakkan dilewati. Dipanggil sebelum spkNumUniform agar butir yang
   sebelumnya lolos ikut dikelompokkan & diseragamkan lebarnya. */
function spkBoxLeadNumDom(html){
  var s=String(html==null?'':html);
  if(s.indexOf('kl1')<0 && s.indexOf('kl2')<0) return s;
  try{
    var box=document.createElement('div'); box.innerHTML=s;
    var ps=box.querySelectorAll('p.kl1, p.kl2'), changed=false, i;
    for(i=0;i<ps.length;i++){
      var p=ps[i];
      var fe=p.firstElementChild;
      if(fe && fe.tagName==='SPAN' && fe.classList && fe.classList.contains('n')) continue;  /* sudah dikotakkan */
      /* text-node pertama yang berisi, DAN harus anak langsung <p> (bukan di dalam <i>/<b>) */
      var w=document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null, false), tn, first=null;
      while((tn=w.nextNode())){ if(tn.nodeValue && tn.nodeValue.replace(/[\s\u00A0]/g,'')){ first=tn; break; } }
      if(!first || first.parentNode!==p) continue;
      var mm=/^([\s\u00A0]*)((?:[0-9]+\.)+)([\s\u00A0]*)/.exec(first.nodeValue);
      if(!mm) continue;                                    /* tidak diawali nomor ANGKA bertingkat/tunggal */
      var tok=mm[2];
      first.nodeValue = first.nodeValue.slice(mm[0].length);
      var hug=Math.max(0.4, Math.round((spkTextWidthCm(tok)+SPK_NUM_GAP)*100)/100);
      var multi=/^(?:[0-9]+\.){2,}$/.test(tok);
      var _col2=spkNumCol(p.classList.contains('kl2') && !multi, hug);
      var span=document.createElement('span');
      span.className='n'+(multi?' m':'');
      span.setAttribute('style','min-width:'+_col2.w.toFixed(2)+'cm;display:inline-block;box-sizing:border-box;padding-right:'+SPK_NUM_GAP+'cm;text-indent:0;white-space:nowrap;overflow:visible;text-align:'+_col2.al);
      span.textContent=tok;
      p.insertBefore(span, p.firstChild);
      p.classList.add('spk-sl');
      if(multi){ p.classList.add('spk-ml'); if(p.classList.contains('kl2')) p.classList.add('spk-lv1'); }
      p.style.marginLeft=_col2.ml.toFixed(2)+'cm';
      p.style.textIndent='-'+_col2.w.toFixed(2)+'cm';
      changed=true;
    }
    return changed ? box.innerHTML : s;
  }catch(e){ return s; }
}
/* Klausul yang DIMULAI dengan paragraf pengantar (kl0) dan kemudian memuat butir
   bernomor (kl1/kl2) ditandai .spk-inlead, sehingga butir-butirnya menjorok sedikit
   terhadap teks pengantar di atasnya. Klausul yang langsung dibuka dengan butir
   bernomor tidak ditandai -> penomorannya tetap rata batas margin kiri. */
/* Baris-baris "Label : nilai" (.spk-kv) yang BERURUTAN dibungkus menjadi satu
   grup .spk-kvgrp. Gunanya dua: (1) grup diperlakukan sebagai blok utuh oleh
   pemecah halaman sehingga tidak pernah terbelah di antara barisnya; (2) lebar
   kolom label memakai grid max-content, sehingga tanda ":" berhenti tepat di
   sebelah kanan label TERPANJANG — bukan pada persentase tetap.
   Pembungkusnya dilewati saat konversi ke Word (spkHtmlToWordParas menyaring
   pembungkus yang berisi div/p), jadi keluarannya tetap tabel 3 kolom. */
/* =========================================================================
   URUTAN ABJAD PADA KLAUSUL "DEFINISI"
   Butir definisi selalu ditampilkan & diunduh dalam urutan A-Z menurut istilah
   yang didefinisikan (teks setelah nomor butir). Template yang diunggah dalam
   urutan acak otomatis dirapikan, lalu dinomori ulang 1..N.
   ========================================================================= */
function spkIsDefinisiJudul(judul){
  return /^definisi\b/i.test(spkJudulPlain(judul).replace(/^pasal\s*\d+\s*/i,''));
}
/* Istilah yang dipakai sebagai kunci urut: teks butir setelah token nomor,
   dibersihkan dari tanda baca pembuka. */
function spkDefKey(el){
  var t=String(el.textContent||'').replace(/\s+/g,' ').trim();
  t=t.replace(/^(?:\d+\.)+\s*/,'').replace(/^[^0-9A-Za-z\u00C0-\u024F]+/,'');
  return t.toLowerCase();
}
/* Tulis ulang nomor di awal sebuah butir kl1 menjadi `no`. Menangani dua bentuk:
   nomor masih teks biasa ("1. Adendum…") maupun sudah dikotakkan spkNumberFix
   (<span class="n">1.</span>). */
function spkDefSetNo(el, no){
  var first=el.firstElementChild;
  if(first && first.classList && first.classList.contains('n') && /^\d+\.$/.test(String(first.textContent||'').trim())){
    first.textContent=no+'.'; return;
  }
  var w=document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false), n;
  while((n=w.nextNode())){
    var v=n.nodeValue||'';
    if(/^\s*\d+\.\s*/.test(v)){ n.nodeValue=v.replace(/^\s*\d+\.\s*/, no+'. '); return; }
    if(v.replace(/\s/g,'')) return;                 /* teks lain lebih dulu -> tak ada nomor */
  }
}
function spkSortDefinisi(html){
  var src=String(html||'');
  if(!src) return src;
  var box=document.createElement('div');
  box.innerHTML=src;
  var kids=[], k=box.firstChild;
  while(k){ if(k.nodeType===1) kids.push(k); k=k.nextSibling; }
  var isItem=function(el){
    return el.tagName==='P' && el.classList && el.classList.contains('kl1') &&
           /^\s*(?:\d+\.)+\s*\S/.test(String(el.textContent||''));
  };
  /* Ambil DERET TERPANJANG butir bernomor yang berurutan — bagian lain
     (paragraf pengantar, catatan penutup) tidak ikut diacak posisinya. */
  var bs=-1, bl=0, i=0;
  while(i<kids.length){
    if(!isItem(kids[i])){ i++; continue; }
    var s=i; while(i<kids.length && isItem(kids[i])) i++;
    if((i-s)>bl){ bl=i-s; bs=s; }
  }
  if(bs<0 || bl<2) return src;
  var run=kids.slice(bs, bs+bl);
  var order=run.map(function(el, ix){ return {el:el, key:spkDefKey(el), ix:ix}; });
  order.sort(function(a,b){
    var c=a.key.localeCompare(b.key, 'id', {sensitivity:'base', numeric:true});
    return c!==0 ? c : (a.ix-b.ix);                 /* kunci sama -> urutan asal dipertahankan */
  });
  var anchor=run[bl-1].nextSibling;
  for(i=0;i<order.length;i++){
    spkDefSetNo(order[i].el, i+1);
    box.insertBefore(order[i].el, anchor);
  }
  return box.innerHTML;
}
/* Urutkan HANYA bila klausulnya memang klausul DEFINISI */
function spkSortDefinisiIf(judul, html){
  try{ return spkIsDefinisiJudul(judul) ? spkSortDefinisi(html) : html; }
  catch(e){ console.error(e); return html; }
}
function spkKvGroup(html){
  var one = '<div class="spk-kv(?:\\s[^"]*)?"[^>]*>[\\s\\S]*?<\\/div>';
  var re  = new RegExp('(?:' + one + '\\s*)+', 'g');
  return String(html||'').replace(re, function(m){
    return '<div class="spk-kvgrp">' + m + '</div>';
  });
}
function spkLeadIndentCls(html){
  var s = String(html||'');
  var m = s.match(/<p[^>]*\bclass="([^"]*)"/);
  if(!m) return '';
  if(!/\bkl0\b/.test(m[1])) return '';                  // pembuka bukan paragraf biasa
  return /<p[^>]*\bclass="[^"]*\bkl[12]\b/.test(s) ? ' spk-inlead' : '';
}
/* =========================================================================
   PERAPIAN KHUSUS BENTUK PERJANJIAN/KONTRAK (PK)
   Kedua fungsi di bawah HANYA dipanggil bila bentuk dokumen = PK.
   Bentuk Surat Perintah Kerja (SPK) sama sekali tidak melewati fungsi ini.
   Dijalankan SESUDAH spkNumberFix(), jadi setiap nomor sudah berupa
   <span class="n">…</span> di awal paragraf.
   ========================================================================= */

/* Lebar kotak nomor (cm), DIHITUNG ULANG dari teks penandanya sendiri.
   Lebar bawaan pada style TIDAK dipakai: spkNumUniform menyeragamkan lebar
   berdasarkan AWALAN nomor di seluruh klausul, sehingga kotak deret "1.1."–
   "1.9." ikut dilebarkan demi nomor dua digit seperti "2.16." yang berada jauh
   di bawahnya. Akibatnya jarak nomor ke teks tampak jauh padahal penomorannya
   hanya satu digit. Penyeragaman yang benar dilakukan per DERET di
   spkPkIndentStd, bukan per awalan. */
function spkPkNumW(sp){
  var t=String(sp&&sp.textContent||'').replace(/[\s\u00A0]+/g,'');
  var w=0;
  try{ w=spkPkTextWidthCm(t); }catch(e){ w=0; }
  if(!(w>0)){                                  /* pengukuran gagal: perkiraan kasar */
    var fb=parseFloat(sp && sp.style ? sp.style.width : '');
    if(fb>0) return fb;
    w=t.length*0.16;
  }
  return Math.max(0.4, Math.round((w+SPK_NUM_GAP)*100)/100);
}
/* Token nomor sebuah paragraf ('' bila paragraf tidak bernomor) */
function spkPkTok(p){
  var fe=p.firstElementChild;
  if(!fe || fe.tagName!=='SPAN' || !fe.classList || !fe.classList.contains('n')) return '';
  return String(fe.textContent||'').replace(/[\s\u00A0]+/g,'');
}

/* ---- (1) SUSUN ULANG NOMOR MAJEMUK DARI SILSILAHNYA ----
   Nomor majemuk ("2.1.") disusun ULANG SEPENUHNYA dari kedudukan butirnya,
   bukan disalin dari sumber. Dua cacat sekaligus tertangani:
     - awalannya sering memakai nomor Pasal ("9.1." padahal induknya butir "2.")
     - angka terakhirnya berlanjut dari induk sebelumnya ("2.10." padahal butir
       di bawah "2." baru yang pertama, seharusnya "2.1.")
   Cara kerjanya: jalur penomoran (path) diikuti sepanjang klausul. Begitu muncul
   butir tingkat-1 baru, hitungan anaknya otomatis mulai dari 1 lagi.
   Huruf a./b. dan bullet tidak mengubah jalur, sehingga penomoran majemuk tetap
   berlanjut benar meski diselingi daftar huruf.
   Pengaman: bila induk sebuah nomor majemuk TIDAK ada di klausul itu (mis. pasal
   yang memang langsung memakai "5.1.", "5.2."), jalur diambil dari nomor aslinya
   sehingga awalannya tidak diubah. */
function spkPkSubNumberFix(html){
  var s=String(html==null?'':html);
  if(s.indexOf('class="n')<0) return s;
  try{
    var box=document.createElement('div'); box.innerHTML=s;
    var ps=box.querySelectorAll('p'), i, jalur=[], ubah=false, refMap={}, numTerakhir=false;
    for(i=0;i<ps.length;i++){
      var p=ps[i], tok=spkPkTok(p);
      if(!tok) continue;
      var segs=spkPkSegs(tok);
      if(!segs){
        /* PENANDA HURUF YANG SEBENARNYA LANJUTAN DERET ANGKA.
           Sebagian klausul warisan menyelipkan butir berpenanda huruf (mis. "g.")
           tepat setelah butir bernomor (mis. "3.6.") padahal butir itu SETINGKAT
           dengannya, bukan sub-daftar — hasilnya penomoran tampak terputus.
           Penanda seperti itu dijadikan lanjutan deret angka: "3.6." -> "3.7.".
           PENGAMAN agar sub-daftar huruf yang SAH tidak ikut diubah:
             - hanya bila butir bernomor tepat sebelumnya ADA (numTerakhir),
             - penandanya BUKAN pembuka daftar (a. A. i. I.) — pembuka berarti
               memang sub-daftar baru di bawah butir itu,
             - begitu satu penanda pembuka ditemui, seluruh sisa daftar hurufnya
               dibiarkan (numTerakhir=false), jadi b. c. d. di bawahnya aman. */
        if(spkPkIsHuruf(tok) && numTerakhir && jalur.length && !/^[aAiI][.)]$/.test(tok)){
          var jl=jalur.slice(); jl[jl.length-1]=jl[jl.length-1]+1;
          var barH=jl.join('.')+'.';
          jalur=jl;
          p.firstElementChild.textContent=barH; ubah=true;
          continue;                             /* tetap dianggap butir bernomor */
        }
        numTerakhir=false;                      /* huruf / bullet: jalur tak berubah */
        continue;
      }
      numTerakhir=true;
      var d=segs.length;
      if(d===1){                                /* butir tingkat-1: dipakai apa adanya */
        jalur=[parseInt(segs[0],10)];
        continue;
      }
      if(jalur.length < d-1){                   /* induk tak ada -> hormati nomor asli */
        jalur=segs.map(Number);
        continue;
      }
      var idx=(jalur.length>=d) ? jalur[d-1]+1 : 1;   /* lanjut, atau mulai dari 1 */
      jalur=jalur.slice(0,d-1); jalur.push(idx);
      var baru=jalur.join('.')+'.';
      if(baru!==tok){
        refMap[tok.replace(/\.$/,'')]=baru.replace(/\.$/,'');
        p.firstElementChild.textContent=baru; ubah=true;
      }
    }
    /* rujukan di dalam kalimat mengikuti nomor butir yang baru */
    try{ if(spkRefRemap(box, refMap)) ubah=true; }catch(e){}
    return ubah ? box.innerHTML : s;
  }catch(e){ return s; }
}

/* ---- (2) INDEN STANDAR ----
   Dua hal DIPISAH, dan inilah kuncinya:

   (a) Jarak NOMOR -> TEKS mengikuti lebar nomor itu sendiri (hug: lebar nomor
       + jeda kecil). Nomor 1 digit tetap rapat dengan teksnya — TIDAK dipaksa
       selebar satu langkah inden.
   (b) Titik MULAI tiap tingkat memakai kisi tetap 0,75 cm:
         tingkat-1  "1."  penanda mulai di 0
         tingkat-2  "a."  penanda mulai di 0,75 cm
         tingkat-3  "-"   penanda mulai di 1,50 cm

   Hasilnya: teks tingkat-1 berhenti di ~0,43 cm sedangkan penanda "a." mulai
   di 0,75 cm — jadi "a." sedikit masuk ke kanan dari teks di atasnya, persis
   seperti acuan. Yang diperbaiki di sini hanya butir yang tingkatnya salah
   (mis. sub-poin tanda hubung) dan pergeseran ekstra 0,5 cm pada klausul yang
   diawali paragraf pengantar. */
var SPK_PK_STEP = 0.75;                 /* cadangan bila induk tak diketahui (cm) */
/* Jarak "sedikit masuk": seberapa jauh penanda ANAK melewati kolom TEKS induknya.
   Inilah satu-satunya angka tata letak di seluruh perapian ini. Semua posisi lain
   diturunkan darinya, sehingga hubungan induk-anak selalu terlihat sama —
   entah nomornya "1." yang sempit atau "2.1." yang lebar.
   Dipakai juga sebagai geseran daftar yang berada di bawah paragraf pengantar. */
var SPK_PK_LEAD = 0.35;                 /* jarak penanda anak dari teks induk (cm) */
/* Jeda penanda -> teks untuk daftar HURUF / bullet (a. b. i. - ●).
   Lebih rapat daripada jeda daftar ANGKA (SPK_NUM_GAP) karena kolomnya dipatok
   selebar penanda TERLEBAR di deret: pada huruf, "m." jauh lebih lebar daripada
   "i.", sehingga jeda 0,18 cm membuat huruf yang sempit terlihat jauh dari
   teksnya. Dengan 0,10 cm, lebar kolom huruf jatuh di sekitar 0,5 cm — sama
   seperti tab daftar huruf pada Word. */
var SPK_PK_GAP_HURUF = 0.10;            /* jeda penanda huruf/bullet -> teks (cm) */
/* PENGUKUR LEBAR KHUSUS PERJANJIAN/KONTRAK.
   spkTextWidthCm() mengukur dengan '11pt Arial', padahal isi kontrak dirender
   dengan Inter 11pt yang angkanya ~8% LEBIH LEBAR. Akibatnya kotak nomor 2 digit
   ("1.10.") kekecilan: nomornya meluber ke KANAN melewati padding dan memakan
   jeda ke teks — nomor 2 digit terlihat lebih rapat ke teksnya daripada nomor
   1 digit, dan titik penutupnya tidak lagi lurus.
   Di sini diukur dengan tumpukan font dokumen yang sebenarnya, lalu dilebihkan
   10% sebagai jaminan bila Inter belum termuat di dokumen aplikasi (canvas akan
   jatuh ke font pengganti yang lebih sempit).
   Kelebihan lebar TIDAK merusak tampilan: karena nomor dirata-kanankan dan jeda
   berasal dari padding, kelebihan itu hanya menambah ruang julur di sisi KIRI. */
var SPK_PK_MEAS_FONT = '11pt "Inter Local","Inter","Segoe UI",Arial,sans-serif';
var SPK_PK_MEAS_PAD  = 1.10;
function spkPkTextWidthCm(txt){
  if(!_spkMeasCanvas){ _spkMeasCanvas=document.createElement('canvas'); }
  var ctx=_spkMeasCanvas.getContext('2d');
  ctx.font=SPK_PK_MEAS_FONT;
  var w=(ctx.measureText(String(txt==null?'':txt)).width)*2.54/96;
  return w*SPK_PK_MEAS_PAD;
}
/* CADANGAN KIRI deret tingkat-1.
   Nomor 2 digit pada deret rata kanan menjulur ke KIRI dari kolom nomor 1 digit.
   Di tingkat-1 kolom itu berimpit dengan batas kertas, sedangkan badan lembar
   hasil paginasi (`.spk-sheet > .sh-bd`) ber-`overflow:hidden` — akibatnya angka
   puluhan terpotong ("10." terbaca "0."). Karena itu SELURUH deret tingkat-1
   dimulai sejauh satu lebar angka dari batas kertas, jadi ruang julur itu selalu
   tersedia. Diterapkan seragam ke semua Pasal supaya nomor 1 digit tetap sejajar,
   entah Pasal itu memuat nomor 2 digit atau tidak. */
var SPK_PK_RES_CACHE = null;
function spkPkReserve(){
  if(SPK_PK_RES_CACHE!=null) return SPK_PK_RES_CACHE;
  var w=0; try{ w=spkPkTextWidthCm('0'); }catch(e){ w=0; }
  if(!(w>0)) w=0.2;
  SPK_PK_RES_CACHE=Math.round(w*100)/100;
  return SPK_PK_RES_CACHE;
}

/* Pecah penanda angka menjadi ruas: "2.1." -> ["2","1"], "10)" -> ["10"].
   Mengembalikan null bila penanda bukan angka. */
function spkPkSegs(tok){
  if(!/^(?:[0-9]+\.)+$/.test(tok) && !/^[0-9]+\)$/.test(tok)) return null;
  var t=String(tok).replace(/\)$/,'.');
  var a=t.split('.').filter(function(x){ return x!==''; });
  return a.length ? a : null;
}
function spkPkIsHuruf(tok){
  return /^[A-Za-z][.)]$/.test(tok) || /^[ivxlcdmIVXLCDM]{2,4}[.)]$/.test(tok);
}
function spkPkIndentStd(html){
  var s=String(html==null?'':html);
  if(s.indexOf('class="n')<0) return s;
  try{
    var box=document.createElement('div'); box.innerHTML=s;
    var ps=box.querySelectorAll('p');
    var i, p, tok;

    /* --- Tahap 1: tentukan tingkat & lebar alami tiap butir ---
       Tingkat DITURUNKAN DARI SILSILAH NOMOR, bukan dari bentuk penandanya:
         "2."    -> tidak punya induk                       -> tingkat 1
         "2.1."  -> induknya "2." yang ada di atas          -> tingkat 2
         "a."    -> satu tingkat di bawah butir angka terakhir
         "-"     -> satu tingkat di bawah butir terakhir
       Bila induk sebuah nomor majemuk TIDAK ada di klausul itu (mis. pasal yang
       memang langsung memakai "5.1.", "5.2."), nomor itu dianggap tingkat 1
       sehingga tidak menjorok tanpa alasan. */
    var item=[], lvlNomor={}, tingkatHuruf=1, terakhir=1;
    for(i=0;i<ps.length;i++){
      p=ps[i]; tok=spkPkTok(p); if(!tok) continue;
      var L, segs=spkPkSegs(tok);
      if(segs){
        var kunci=segs.join('.')+'.';
        var indukKunci=segs.slice(0,-1).join('.')+'.';
        L=(segs.length>1 && lvlNomor[indukKunci]) ? lvlNomor[indukKunci]+1 : 1;
        lvlNomor[kunci]=L;
        tingkatHuruf=L+1;                 /* huruf di bawahnya turun satu tingkat */
        terakhir=L;
      } else if(spkPkIsHuruf(tok)){
        L=tingkatHuruf; terakhir=L;
      } else {
        L=terakhir+1;                     /* bullet / tanda hubung */
      }
      if(L>5) L=5;
      item.push({p:p, tok:tok, lvl:L, w:spkPkNumW(p.firstElementChild)});
    }

    /* --- Tahap 1b: titik awal daftar ---
       Bila klausul DIBUKA oleh paragraf pengantar (bukan butir bernomor), maka
       daftarnya menjorok LEAD terhadap pengantar itu — perlakuannya sama seperti
       "a." yang menjorok terhadap teks "1.". Klausul yang langsung dibuka dengan
       butir bernomor tetap mulai di batas margin.
       CATATAN: geseran ini dipakai SEKALI saja sebagai titik awal tingkat-1;
       tingkat berikutnya diturunkan dari kolom teks induknya, jadi sub-butir
       tidak pernah tergeser dua kali (inilah cacat geseran 0,5 cm yang lama). */
    var LEAD=0;
    for(i=0;i<ps.length;i++){
      var t0=(ps[i].textContent||'').replace(/[\s\u00A0]/g,'');
      if(!t0) continue;                                   /* lewati paragraf kosong */
      if(!spkPkTok(ps[i])) LEAD=SPK_PK_LEAD;               /* pembuka = teks biasa */
      break;
    }

    /* --- Tahap 2: kelompokkan menjadi DERET ---
       Satu deret = butir-butir setingkat yang berurutan di bawah induk yang sama.
       Tiap deret mencatat DERET INDUKNYA, karena posisinya nanti dihitung dari
       kolom teks induk itu — bukan dari kisi tetap. */
    var buka={}, deret=[];
    for(i=0;i<item.length;i++){
      var it=item[i], L=it.lvl, d;
      for(d in buka){ if(Number(d)>L) delete buka[d]; }   /* tutup deret yang lebih dalam */
      if(!buka[L]){
        buka[L]={lvl:L, items:[], induk:(buka[L-1]||null), W:0, base:0};
        deret.push(buka[L]);
      }
      buka[L].items.push(it);
    }

    /* --- Tahap 3: lebar kotak per deret ---
       Satu deret = SATU lebar kotak (yang terlebar), supaya kolom teks seluruh
       butir dalam deret itu sejajar — "f." yang glifnya sempit tidak lagi
       menarik teksnya ke kiri. */
    for(i=0;i<deret.length;i++){
      var g=deret[i], W=0, j;
      for(j=0;j<g.items.length;j++){ if(g.items[j].w>W) W=g.items[j].w; }
      /* Deret HURUF/bullet memakai jeda yang lebih rapat: lebar kotak dihitung
         ulang = lebar penanda terlebar + SPK_PK_GAP_HURUF (spkPkNumW sudah
         menambahkan SPK_NUM_GAP, jadi selisihnya dikurangkan). */
      var adaAngka=false;
      for(j=0;j<g.items.length;j++){ if(spkPkSegs(g.items[j].tok)){ adaAngka=true; break; } }
      g.gap = adaAngka ? SPK_NUM_GAP : SPK_PK_GAP_HURUF;
      if(!adaAngka) W = Math.max(0.4, W - (SPK_NUM_GAP - SPK_PK_GAP_HURUF));
      g.W=Math.round(W*100)/100;
      /* PERATAAN NOMOR PER DERET (aturan Perjanjian/Kontrak):
         SELURUH deret angka dirata-KANANkan, tanpa kecuali. Dulu deret yang
         seluruhnya 1 digit dirata-kirikan — akibatnya titik "9." tidak lurus
         dengan titik "10." dan jaraknya ke teks lebih jauh. Dengan rata kanan
         menyeluruh:
           - titik penutup SEMUA nomor (1 & 2 digit) lurus pada satu garis,
           - jarak titik -> teks TETAP (= padding kanan kotak) untuk semua butir,
           - nomor 2 digit memanjang ke KIRI, tidak pernah menggeser kolom teks.
         adaDua kini hanya dipakai untuk mencatat apakah deret memuat 2 digit
         (dipakai perhitungan lebar dasar g.Wb di bawah). */
      var adaDua=false;
      for(j=0;j<g.items.length;j++){
        var sgs=spkPkSegs(g.items[j].tok);
        if(sgs && String(sgs[sgs.length-1]).length>=2){ adaDua=true; break; }
      }
      g.rata = 'right';
      /* LEBAR DASAR (g.Wb) = lebar kotak yang dipakai untuk MENENTUKAN KOLOM TEKS,
         diambil dari nomor 1 DIGIT terlebar di deret ini. Kotaknya sendiri tetap
         selebar g.W (nomor terlebar), tetapi kelebihannya MENJULUR KE KIRI.
         Akibatnya: nomor 1 digit & kolom teks berhenti di tempat yang sama
         entah deret ini memuat nomor 2 digit atau tidak — sehingga penomoran
         antar-Pasal tetap sejajar, dan hanya nomor 2 digit yang keluar ke kiri
         (persis seperti penomoran rata kanan di Word). */
      var Wb=0;
      for(j=0;j<g.items.length;j++){
        var sg1=spkPkSegs(g.items[j].tok);
        if(sg1 && String(sg1[sg1.length-1]).length<=1 && g.items[j].w>Wb) Wb=g.items[j].w;
      }
      g.Wb = (Wb>0 && Wb<g.W) ? Math.round(Wb*100)/100 : g.W;
    }

    /* --- Tahap 4: posisi tiap deret ---
       Penanda anak diletakkan LEAD di sebelah kanan kolom TEKS induknya:
           base(anak) = base(induk) + lebar kotak induk + LEAD
       Dengan cara ini "sedikit masuk ke kanan" selalu terlihat sama, berapa pun
       lebar nomornya. Kisi tetap yang lama gagal justru di sini: saat kotak
       nomor induk melebar (mis. karena ada "2.1."), jarak itu menyusut sampai
       tampak sejajar. Deret ditelusuri berurutan sehingga induk selalu sudah
       terhitung lebih dulu. */
    for(i=0;i<deret.length;i++){
      var g2=deret[i];
      if(g2.induk) g2.base=g2.induk.base + (g2.induk.Wb||g2.induk.W) + SPK_PK_LEAD;   /* dari KOLOM TEKS induk */
      else if(g2.lvl===1) g2.base=(LEAD>0?LEAD:spkPkReserve());   /* geseran thd pengantar / cadangan julur */
      else g2.base=LEAD + (g2.lvl-1)*SPK_PK_STEP;        /* cadangan: induk tak ketemu */
      /* Pengaman: apa pun hasil hitungan di atas, ruang julur ke kiri harus muat
         supaya nomor tidak pernah terpotong tepi lembar. */
      var julur=g2.W-(g2.Wb||g2.W);
      if(g2.base<julur) g2.base=julur;
      g2.base=Math.round(g2.base*100)/100;
      for(var m=0;m<g2.items.length;m++){
        var q=g2.items[m], sp=q.p.firstElementChild;
        sp.style.width=g2.W.toFixed(2)+'cm';
        sp.style.minWidth=g2.W.toFixed(2)+'cm';
        /* Perataan penanda ANGKA mengikuti g2.rata (lihat Tahap 3): deret yang
           seluruhnya 1 digit -> rata KIRI; deret yang memuat nomor 2 digit
           (mis. "2.9." bersama "2.16.") -> rata KANAN supaya titik penutupnya
           lurus. Huruf & bullet selalu rata kiri. */
        sp.style.textAlign = spkPkSegs(q.tok) ? (g2.rata||'right') : 'left';
        sp.style.boxSizing='border-box';
        sp.style.paddingRight=(g2.gap||SPK_NUM_GAP)+'cm';   /* jeda ke teks (huruf lebih rapat) */
        /* Kolom teks dipatok g2.Wb; gantungan tetap g2.W, jadi selisihnya
           (nomor 2 digit) menjulur KE KIRI dari kolom nomor 1 digit. */
        q.p.style.marginLeft=(g2.base+(g2.Wb||g2.W)).toFixed(2)+'cm';
        q.p.style.textIndent='-'+g2.W.toFixed(2)+'cm';
        q.p.style.paddingLeft='0cm';
      }
    }

    /* --- Tahap 5: PARAGRAF LANJUTAN ---
       Paragraf tanpa penanda yang muncul SESUDAH sebuah butir adalah lanjutan
       penjelasan butir itu, jadi harus menggantung di kolom TEKS butir tersebut
       — bukan kembali ke batas margin. Sebelumnya hanya paragraf berkelas
       khusus (klp1/klp2/kldesc) yang ditangani, sehingga paragraf berkelas polos
       hasil paste Word terlihat lepas dari butirnya.
       Inden baris pertama bawaan Word juga dinolkan supaya baris pertamanya
       tidak menjorok sendiri.
       Paragraf yang berada SEBELUM butir pertama (pengantar klausul) tidak
       disentuh — ia memang milik klausul, bukan milik butir. */
    var kolomTeks=null;                       /* kolom teks butir terakhir (cm) */
    var semua=box.querySelectorAll('p'), z;
    for(z=0;z<semua.length;z++){
      var pz=semua[z];
      if(spkPkTok(pz)){                       /* butir bernomor: catat kolom teksnya */
        var ml=parseFloat(pz.style.marginLeft);
        if(ml>0 || ml===0) kolomTeks=ml;
        continue;
      }
      if(kolomTeks===null) continue;          /* masih di paragraf pengantar */
      if(pz.getAttribute && pz.getAttribute('data-h')==='1') continue;
      if(pz.classList && (pz.classList.contains('spk-cl-h')||pz.classList.contains('spk-party-h')||
         pz.classList.contains('spk-bab')||pz.classList.contains('spk-kv'))) continue;
      if(!(pz.textContent||'').replace(/[\s\u00A0]/g,'')) continue;   /* paragraf kosong */
      pz.style.marginLeft=kolomTeks.toFixed(2)+'cm';
      pz.style.textIndent='0cm';
      pz.style.paddingLeft='0cm';
    }
    return box.innerHTML;
  }catch(e){ return s; }
}

/* ---- (3) KOTAKKAN SEMUA PENANDA YANG MASIH BERUPA TEKS ----
   spkNumberFix() hanya mengenali penanda yang menempel PERSIS sesudah
   `<p class="kl1">` / `<p class="kl2">`. Begitu paragrafnya berkelas lain,
   membawa atribut tambahan, atau penandanya berada di dalam <b>/<span>,
   penanda itu tetap teks biasa — akibatnya indennya lolos dari perapian dan
   memakai margin bawaan Word (inilah yang membuat sebagian daftar terlihat
   berbeda sendiri). Di sini SEMUA bentuk penanda dikotakkan:
     1.  10.  2.1.  3.1.1.  1)   a.  b)  i.  IV.   -  –  —  dan simbol bullet
   Paragraf judul, placeholder, dan baris "Label : nilai" dikecualikan. */
var SPK_PK_BULLET = '\u25CF\u25CB\u25A0\u25C6\u27A4\u2713\u2726\u2022\u25E6\u2043\u2219\u203B\u2605\u2606\u2666\u2665\u25B8\u25AA\u2794\u21D2\u00BB\u2717\u2691';
function spkPkBoxMark(html){
  var s=String(html==null?'':html);
  if(s.indexOf('<p')<0) return s;
  try{
    var box=document.createElement('div'); box.innerHTML=s;
    var ps=box.querySelectorAll('p'), i, ubah=false;
    var reMark=new RegExp(
      '^([\\s\\u00A0]*)('+
        '(?:[0-9]+\\.)+'+                     /* 1.  10.  2.1.  3.1.1. */
        '|[0-9]+\\)'+                          /* 1)                    */
        '|[A-Za-z][.)]'+                       /* a.  b)  A.            */
        '|[ivxlcdmIVXLCDM]{2,4}[.)]'+          /* ii.  IV.              */
        '|[-\\u2013\\u2014]'+                  /* -  –  —               */
        '|['+SPK_PK_BULLET+']'+
      ')([\\s\\u00A0]+)'
    );
    for(i=0;i<ps.length;i++){
      var p=ps[i];
      /* lewati paragraf yang bukan butir daftar */
      if(p.getAttribute && p.getAttribute('data-h')==='1') continue;
      if(p.classList && (p.classList.contains('spk-ph')||p.classList.contains('spk-cl-h')||
         p.classList.contains('spk-party-h')||p.classList.contains('spk-bab')||
         p.classList.contains('spk-berdasar')||p.classList.contains('spk-kv'))) continue;
      var fe=p.firstElementChild;
      if(fe && fe.tagName==='SPAN' && fe.classList && fe.classList.contains('n')) continue;  /* sudah dikotakkan */
      /* teks pertama yang berisi HARUS anak langsung <p> agar penanda di dalam
         <b>/<i> milik kalimat tidak ikut terambil */
      var w=document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null, false), tn, first=null;
      while((tn=w.nextNode())){ if(tn.nodeValue && tn.nodeValue.replace(/[\s\u00A0]/g,'')){ first=tn; break; } }
      if(!first || first.parentNode!==p) continue;
      var mm=reMark.exec(first.nodeValue);
      if(!mm) continue;
      var tok=mm[2];
      /* lindungi singkatan yang menyerupai angka romawi / huruf berturut */
      if(/^(CV|CD|MM|DVD|DIV|MMC|LC|DC|ID|IL|IM)[.)]$/i.test(tok)) continue;
      first.nodeValue=first.nodeValue.slice(mm[0].length);
      var hug=Math.max(0.4, Math.round((spkTextWidthCm(tok)+SPK_NUM_GAP)*100)/100);
      var multi=/^(?:[0-9]+\.){2,}$/.test(tok);
      var isNum=/^(?:[0-9]+[.)])+$/.test(tok);
      var span=document.createElement('span');
      span.className='n'+(multi?' m':'');
      span.setAttribute('style','width:'+hug.toFixed(2)+'cm;display:inline-block;box-sizing:border-box;'+
        'padding-right:'+SPK_NUM_GAP+'cm;text-indent:0;white-space:nowrap;overflow:visible;'+
        'text-align:'+(isNum?'right':'left'));
      span.textContent=tok;
      p.insertBefore(span, p.firstChild);
      p.classList.add('spk-sl');
      ubah=true;
    }
    return ubah ? box.innerHTML : s;
  }catch(e){ return s; }
}

/* ---- (4) IKAT BUTIR DAFTAR "BERDASARKAN" DENGAN No./Tanggal-NYA ----
   Butir seperti "24. Berita Acara Klarifikasi dan Negosiasi" diikuti baris
   "No. : …" & "Tanggal : …" (.spk-kv.spk-dkv). Ketiganya dibungkus satu
   <div class="spk-keep"> yang oleh paginator diperlakukan sebagai blok utuh,
   jadi bila tidak muat, SELURUHNYA turun ke halaman berikutnya. */
function spkPkKeepDlist(html, isPk){
  if(!isPk) return html;
  var s=String(html==null?'':html);
  if(s.indexOf('spk-dkv')<0) return s;
  try{
    var box=document.createElement('div'); box.innerHTML=s;
    var kids=[], k=box.firstChild;
    while(k){ if(k.nodeType===1) kids.push(k); k=k.nextSibling; }
    var i=0, ubah=false;
    while(i<kids.length){
      var el=kids[i];
      var isBtr = el.tagName==='P' && el.classList && el.classList.contains('spk-dlist');
      if(!isBtr){ i++; continue; }
      var j=i+1, grup=[el];
      while(j<kids.length && kids[j].classList && kids[j].classList.contains('spk-dkv')){
        grup.push(kids[j]); j++;
      }
      if(grup.length<2){ i=j>i?j:i+1; continue; }      /* butir tanpa No./Tanggal -> biarkan */
      var wrap=document.createElement('div');
      wrap.className='spk-keep';
      box.insertBefore(wrap, el);
      for(var g=0; g<grup.length; g++) wrap.appendChild(grup[g]);
      ubah=true; i=j;
    }
    return ubah ? box.innerHTML : s;
  }catch(e){ return s; }
}

/* ---- (4b) IKAT LABEL "PIHAK PERTAMA/KEDUA" DENGAN ISIANNYA ----
   Pada klausul alamat/korespondensi, label berdiri sendiri di satu baris lalu
   diikuti baris-baris isiannya (nama unit, alamat, telepon, dsb.):

       PIHAK PERTAMA
       PT PLN (Persero) Unit Pelaksana Pelayanan Pelanggan Masohi
       Jl. Abdullah Soulissa No 1, Masohi, ... 97513

   Tanpa pengikat, paginator boleh memenggal di antara baris-baris itu sehingga
   label tertinggal sendirian di kaki halaman (atau isiannya pindah halaman).
   Di sini label + seluruh isiannya dibungkus satu <div class="spk-keep">, yang
   oleh paginator diperlakukan sebagai blok UTUH: bila tidak muat, seluruhnya
   turun ke halaman berikutnya.

   Yang dianggap "isian" hanyalah paragraf biasa yang mengikuti label secara
   berurutan. Pengumpulan BERHENTI begitu bertemu: butir bernomor, label PIHAK
   berikutnya, judul/kop klausul, atau paragraf kosong — jadi blok tidak pernah
   menelan sisa klausul. Dibatasi SPK_PK_KEEP_MAX baris sebagai pengaman.
   Hanya berlaku untuk bentuk Perjanjian/Kontrak. */
var SPK_PK_KEEP_MAX = 8;                 /* batas aman jumlah baris isian per label */
var SPK_PK_LBL_PIHAK = /^pihak\s+(pertama|kedua)\s*[:.]?$/i;
function spkPkIsLblPihak(el){
  if(!el || el.nodeType!==1) return false;
  var t=String(el.textContent||'').replace(/[\s\u00A0]+/g,' ').trim();
  return SPK_PK_LBL_PIHAK.test(t);
}
function spkPkKeepPihak(html, isPk){
  if(!isPk) return html;
  var s=String(html==null?'':html);
  if(!/pihak\s+(pertama|kedua)/i.test(s)) return s;
  try{
    var box=document.createElement('div'); box.innerHTML=s;
    var kids=[], k=box.firstChild;
    while(k){ if(k.nodeType===1) kids.push(k); k=k.nextSibling; }
    var i=0, ubah=false;
    while(i<kids.length){
      if(!spkPkIsLblPihak(kids[i])){ i++; continue; }
      var grup=[kids[i]], j=i+1;
      while(j<kids.length && grup.length<=SPK_PK_KEEP_MAX){
        var el=kids[j];
        if(el.tagName!=='P' && el.tagName!=='DIV') break;
        if(spkPkIsLblPihak(el)) break;                       /* label berikutnya */
        if(typeof spkPkTok==='function' && spkPkTok(el)) break;   /* butir bernomor */
        if(el.classList && (el.classList.contains('spk-cl-h')||
                            el.classList.contains('spk-bab')||
                            el.classList.contains('spk-keep'))) break;
        if(!String(el.textContent||'').replace(/[\s\u00A0]/g,'')) break;  /* baris kosong */
        grup.push(el); j++;
      }
      if(grup.length<2){ i++; continue; }                    /* label tanpa isian */
      var wrap=document.createElement('div');
      wrap.className='spk-keep';
      box.insertBefore(wrap, grup[0]);
      for(var g=0; g<grup.length; g++) wrap.appendChild(grup[g]);
      ubah=true; i=j;
    }
    return ubah ? box.innerHTML : s;
  }catch(e){ return s; }
}

/* ---- (5) SERAGAMKAN KATA RUJUKAN: "poin" -> "butir" ----
   Pada Perjanjian/Kontrak satuan terkecil disebut BUTIR. Sebagian klausul warisan
   menulis rujukan dengan kata "poin" (mis. "ayat 1 poin 37.2") sehingga dalam satu
   kalimat bisa muncul dua istilah untuk hal yang sama ("ayat 1 butir 37.1 … ayat 1
   poin 37.2"). Di sini kata itu diseragamkan menjadi "butir".
   Penggantian HANYA dilakukan bila kata tersebut benar-benar dipakai sebagai kata
   rujukan, yaitu langsung diikuti nomor ("poin 37.2", "poin 3"). Pemakaian biasa
   di dalam kalimat ("poin penting", "titik poin") tidak tersentuh. Bekerja pada
   simpul teks, bukan HTML mentah, jadi tidak mungkin mengubah nama kelas/atribut.
   Huruf besar di awal kata dipertahankan: "Poin 2" -> "Butir 2". */
function spkPkPoinToButir(html){
  var s=String(html==null?'':html);
  if(!/poin|point/i.test(s)) return s;
  try{
    var box=document.createElement('div'); box.innerHTML=s;
    var reI=/\b(poin|point)([\s\u00A0]+)(?=\d)/gi;
    var w=document.createTreeWalker(box, NodeFilter.SHOW_TEXT, null, false), n, nodes=[];
    while((n=w.nextNode())) nodes.push(n);
    var ubah=false;
    nodes.forEach(function(nd){
      var v=nd.nodeValue; if(!v) return;
      var out=v.replace(reI, function(m, kata, sp){
        var besar=/^[A-Z]/.test(kata);
        return (besar?'Butir':'butir')+sp;
      });
      if(out!==v){ nd.nodeValue=out; ubah=true; }
    });
    return ubah ? box.innerHTML : s;
  }catch(e){ return s; }
}
/* Pembungkus: dipakai di titik perakitan dokumen, hanya untuk bentuk PK */
function spkPkTidy(html, isPk){
  if(!isPk) return html;                 /* SPK: kembalikan apa adanya */
  /* Urutan penting: kotakkan penanda dulu supaya perbaikan nomor & inden
     bekerja pada SELURUH butir, termasuk yang lolos dari spkNumberFix.
     spkPkKeepPihak() dijalankan TERAKHIR: pembungkus <div class="spk-keep">
     mengubah susunan simpul, jadi ia dipasang sesudah seluruh perhitungan
     inden & penomoran selesai agar tidak mengganggu penelusuran saudara-simpul. */
  return spkPkKeepPihak(
           spkPkPoinToButir(spkPkIndentStd(spkPkSubNumberFix(spkPkBoxMark(html)))),
           isPk);
}

function spkNumberFix(html){
  /* Normalisasi: bila label nomor di AWAL paragraf kl1/kl2 langsung menempel ke teks
     tanpa spasi (mis. "10.10.Petugas" atau "11.1.2.Peristiwa"), sisipkan satu nbsp
     agar label tetap dikenali & dikotakkan seperti label yang berspasi. Idempotent:
     jika sudah ada spasi/nbsp sesudah label, lookahead gagal -> tak ada perubahan. */
  html = String(html||'').replace(
    /(<p class="(?:kl1|kl2)(?:\s[^"]*)?"(?:\s+[a-zA-Z-]+="[^"]*")*>)((?:[0-9]+\.)+)(?=[A-Za-zÀ-ÿ(])/g,
    '$1$2\u00A0'
  );
  html = String(html||'').replace(
    /<p class="(kl1|kl2)((?:\s[^"]*)?)"((?:\s+[a-zA-Z-]+="[^"]*")*)>((?:[0-9]+\.)+|[0-9]+\)|[A-Za-z][.)]|[ivxlcdmIVXLCDM]{2,4}[.)])(&nbsp;|\s)/g,
    function(m, cls, restCls, attrs, tok, sp){
      // Lindungi singkatan umum yang kebetulan tampak seperti angka romawi
      // (mis. "CV." "CD." "MM." "DVD.") agar tidak salah dianggap penomoran.
      if(/^(CV|CD|MM|DVD|DIV|MMC|LC|DC|ID|IL|IM)[.)]$/i.test(tok)) return m;
      const isSingleNum = /^[0-9]+\.$/.test(tok);          // "1." "10."
      const right = isSingleNum && parseInt(tok,10) >= 10; // 2 digit -> rata kanan
      const multi = /^(?:[0-9]+\.){2,}$/.test(tok);        // "5.1." "3.1.1."
      /* Mengikuti Word: token angka-majemuk (mis. "3.1.1.") selalu sejajar di
         tingkat-1 (marjin X.1), walau di sumber ditandai kl2; huruf (a./b.)
         tetap di tingkat berikutnya (kl2). Ditandai .spk-lv1 agar CSS memaksa
         marjin tingkat-1. */
      const forceLv1 = multi && cls === 'kl2';
      const cls2 = 'n' + (right ? ' r' : '') + (multi ? ' m' : '');
      const pcls = cls + (restCls||'') + ' spk-sl' + (multi ? ' spk-ml' : '') + (forceLv1 ? ' spk-lv1' : '');
      /* HUG: lebar kotak nomor = lebar nomor + jeda kecil (0,13 cm) sehingga jarak
         nomor->teks selalu rapat & seragam, baik rata kiri maupun kanan. Tiap paragraf
         punya hanging sendiri (margin-left/text-indent inline), jadi baris ke-2 sejajar
         tepat di bawah huruf pertama. Nomor 2 digit (8.10) otomatis mendorong teksnya
         sedikit ke kanan — natural seperti Word. */
      var hug=Math.max(0.4, Math.round((spkTextWidthCm(tok)+SPK_NUM_GAP)*100)/100);
      /* Kolom mengikuti kisi template .docx (bukan lebar teks nomor). */
      var _col=spkNumCol(cls==='kl2' && !forceLv1, hug);
      var ml=_col.ml.toFixed(2), ti=_col.w.toFixed(2);
      var a=attrs||'';
      var extra='margin-left:'+ml+'cm;text-indent:-'+ti+'cm';
      if(/\bstyle="/.test(a)) a=a.replace(/style="([^"]*)"/, 'style="'+extra+';$1"');
      else a=a+' style="'+extra+'"';
      /* white-space:nowrap -> nomor (mis. "8.10.") tidak pernah terpotong ke baris baru;
         padding 0,12 < jeda 0,14 -> ada sedikit ruang agar titik terakhir tak terdorong.
         RATA KANAN untuk semua nomor ANGKA (1. / 10. / 4.1. / 3.1.1.): pada font
         proporsional digit "1" lebih sempit dari "2", sehingga nomor yang dirata-kirikan
         berhenti di titik yang berbeda ("4.1." vs "4.2."). Dengan rata kanan, titik akhir
         nomor selalu sejajar dan jarak nomor->teks seragam — seperti penomoran Word.
         Huruf (a./b.) & simbol tetap rata kiri. */
      /* Angka -> RATA KANAN (titik sejajar untuk 1 & 2 digit). Huruf -> rata kiri.
         padding-right = jeda tetap, jadi nomor tidak pernah menempel/menabrak teks. */
      var isNum=/^(?:[0-9]+[.)])+$/.test(tok);
      /* min-width (bukan width): nomor yang lebih lebar dari kolom mendorong
         teksnya ke kanan, sama seperti tab stop Word yang terdorong.
         Perataan mengikuti tab template: SPK kiri, Perjanjian/Kontrak kanan. */
      var nstyle='min-width:'+ti+'cm;display:inline-block;box-sizing:border-box;padding-right:'+SPK_NUM_GAP+'cm;'+
        'text-indent:0;white-space:nowrap;overflow:visible;text-align:'+(isNum?_col.al:'left');
      /* Tanpa spasi literal setelah nomor: jarak diatur oleh kotak nomor. */
      return '<p class="'+pcls+'"'+a+'><span class="'+cls2+'" style="'+nstyle+'">'+tok+'</span>';
    }
  );
  /* Pada daftar "Berdasarkan" (spk-dlist) yang rata kanan-kiri (justify), nomor
     referensi panjang seperti "0019.BAPP.PL/DAN.01.03/F17060000/2026" atau
     "EPROC-4230-20260624-4230-00003" dibungkus <span class="refn"> agar boleh
     dipotong di karakter mana pun. Baris justify terisi rapat sampai tepi kanan,
     lalu sisa nomor turun ke baris berikutnya, sehingga tidak muncul celah spasi
     lebar di tengah baris. */
  /* Simbol poin (bullet) di awal paragraf kl2 -> bungkus <span class="n"> agar
     jarak simbol->teks seragam (tab 0,75 cm) seperti nomor. */
  html = html.replace(
    /<p class="kl2"((?:\s+[a-zA-Z-]+="[^"]*")*)>([\u25CF\u25CB\u25A0\u25C6\u27A4\u2713\u2013\u2726\u2022\u25E6\u2043\u2219\u203B\u2605\u2606\u2666\u2665\u25B8\u25AA\u2794\u21D2\u00BB\u2717\u2691])(&nbsp;|\u00A0|\s)/g,
    function(m, attrs, ch, sp){
      return '<p class="kl2 spk-sl"'+(attrs||'')+'><span class="n">'+ch+'</span>'+sp;
    }
  );
  html = spkBoxLeadNumDom(html);       /* jaring pengaman: kotakkan nomor yang lolos dari regex */
  html = spkNumUniform(html);          /* samakan lebar kotak untuk daftar 1 & 2 digit */
  html = spkBreakRefNumbers(html);
  return html;
}
/* Bungkus token "kode/nomor" (mengandung "/" atau rangkaian huruf-angka dengan
   "-"/"." menyambung) di dalam paragraf spk-dlist dengan <span class="refn">
   agar boleh dipotong di karakter mana pun saat baris justify perlu diisi rapat. */
function spkBreakRefNumbers(html){
  return String(html||'').replace(/<p class="spk-dlist">[\s\S]*?<\/p>/g, function(p){
    // Pisahkan tag <span class="n">..</span> di depan agar tidak ikut diproses.
    return p.replace(/(<span class="n">[\s\S]*?<\/span>)?([\s\S]*?)(<\/p>)/,
      function(_m, numSpan, body, end){
        const protectedBody = String(body).replace(
          /(^|[\s>(])([^\s<>]*(?:\/[^\s<>]+)+[^\s<>]*|[A-Za-z0-9]+(?:[.\-][A-Za-z0-9]+){2,})/g,
          function(mm, pre, tok){
            // Hanya lindungi NOMOR/KODE referensi, bukan kata biasa seperti
            // "Barang/Jasa" atau "s/d": syaratnya mengandung angka, ATAU token
            // sangat panjang (>=15 krkt) yang jelas bukan kata biasa.
            const hasDigit = /[0-9]/.test(tok);
            if(!hasDigit && tok.length < 15) return mm;
            return pre + '<span class="refn">' + tok + '</span>';
          }
        );
        return (numSpan||'') + protectedBody + end;
      }
    );
  });
}
/* Judul klausul: huruf kapital, aman-HTML, dan istilah asing dicetak miring
   (mis. FORCE MAJEURE, GOOD CORPORATE GOVERNANCE) — dipakai di Daftar Isi & judul klausul. */
const SPK_ITALIC_TERMS=['GOOD CORPORATE GOVERNANCE','FORCE MAJEURE'];
/* ---- Judul klausul boleh mengandung format MIRING/tebal/garis-bawah ----
   Judul disimpan sebagai HTML sederhana (hanya <i>/<em>/<b>/<strong>/<u>),
   sehingga bagian yang dimiringkan pada template Word (atau lewat tombol I di
   editor judul) tampil MIRING pula di website, Daftar Isi, dan cetakan. */
function spkJudulSan(j){
  var s=String(j==null?'':j);
  if(s.indexOf('<')<0) return fkEsc(s);                  // judul lama (teks polos)
  var box=document.createElement('div'); box.innerHTML=s;
  (function clean(node){
    var kids=Array.prototype.slice.call(node.childNodes);
    kids.forEach(function(c){
      if(c.nodeType===3) return;                          // teks
      if(c.nodeType!==1){ c.parentNode.removeChild(c); return; }
      clean(c);
      var tag=c.tagName.toLowerCase();
      if(tag==='i'||tag==='em'||tag==='b'||tag==='strong'||tag==='u'){
        while(c.attributes.length) c.removeAttribute(c.attributes[0].name);
        return;
      }
      while(c.firstChild) c.parentNode.insertBefore(c.firstChild, c);  // buka bungkus
      c.parentNode.removeChild(c);
    });
  })(box);
  return box.innerHTML;
}
function spkJudulPlain(j){
  var s=String(j==null?'':j);
  if(s.indexOf('<')<0) return s.trim();
  var box=document.createElement('div'); box.innerHTML=s;
  return String(box.textContent||'').replace(/\s+/g,' ').trim();
}
/* Ubah huruf pada seluruh simpul teks (tag <i>/<b>/<u> dipertahankan) */
/* Title case untuk JUDUL KLAUSUL (Daftar Isi & kop klausul):
   - kata sambung/depan tetap huruf kecil, kecuali kata pertama
   - huruf pertama diambil dari huruf sesungguhnya, sehingga "(force majeure)"
     menjadi "(Force Majeure)", bukan "(force Majeure)" */
var SPK_KATA_KECIL = ['dan','atau','di','ke','dari','untuk','pada','yang','dalam','dengan','oleh','serta','terhadap','antara','sebagai','the','of','in','and','a','an'];
function spkSmartTitleCase(s, awal){
  var kata=String(s||'').toLowerCase().split(/(\s+)/);
  var idx=(awal===false)?1:0;
  return kata.map(function(w){
    if(/^\s+$/.test(w) || !w) return w;
    var inti=w.replace(/[^a-z\u00e0-\u024f]/g,'');
    var pertama=(idx++===0);
    if(!pertama && SPK_KATA_KECIL.indexOf(inti)>=0) return w;
    return w.replace(/[a-z\u00e0-\u024f]/, function(c){ return c.toUpperCase(); });
  }).join('');
}
function spkJudulCase(html, mode){
  var box=document.createElement('div'); box.innerHTML=html;
  var w=document.createTreeWalker(box, NodeFilter.SHOW_TEXT, null, false), n;
  var awal=true;
  while((n=w.nextNode())){
    if(mode==='upper'){ n.nodeValue=n.nodeValue.toUpperCase(); }
    else { n.nodeValue=spkSmartTitleCase(n.nodeValue, awal); if(n.nodeValue.trim()) awal=false; }
  }
  return box.innerHTML;
}
function spkFmtJudul(judul){
  let s=spkJudulCase(spkJudulSan(judul),'upper');
  SPK_ITALIC_TERMS.forEach(t=>{ if(s.indexOf('<i>'+t)<0) s=s.split(t).join('<i>'+t+'</i>'); });
  return s;
}
/* Judul versi Title Case — dipakai pada Daftar Isi (mengikuti desain cover/daftar isi) */
function spkFmtJudulTitle(judul){
  let s=spkJudulCase(spkJudulSan(judul),'title');
  SPK_ITALIC_TERMS.forEach(t=>{
    const tc=spkTitleCase(t.toLowerCase());
    if(s.indexOf('<i>'+tc)<0) s=s.split(tc).join('<i>'+tc+'</i>');
  });
  return s;
}
/* ================= EDITOR WYSIWYG BERGAYA DOKUMEN SPK =================
   Menghasilkan HTML dengan kelas kl0/kl1/kl2/klp/klp1/klp2 yang identik dengan
   dokumen SPK, sehingga tampilan saat mengetik = pratinjau = cetak.
   Dipakai oleh: field narasi (Latar Belakang/Permasalahan/Maksud & Tujuan)
   dan editor Pustaka Klausul. */
var spkWE = { onSave:null, key:null, maximized:false };

/* --- Bangun kerangka modal editor (sekali saja) --- */
function spkWEEnsureOverlay(){
  var ov=document.getElementById('spk-we-overlay');
  if(ov) return ov;
  ov=document.createElement('div'); ov.id='spk-we-overlay'; ov.className='spk-ov';
  document.body.appendChild(ov);
  ov.addEventListener('click', function(e){ if(e.target.id==='spk-we-overlay') spkWEClose(); });
  return ov;
}

function spkWEToolbarHtml(){
  return '<div class="spk-we-toolbar">'+
    '<div class="spk-we-trow">'+
      '<div class="spk-we-grp">'+
        '<select id="spk-we-block" title="Gaya paragraf" onchange="spkWEBlock(this.value)">'+
          '<option value="kl0">Teks biasa</option>'+
          '<option value="klp">Paragraf (menjorok)</option>'+
          '<option value="kl1">Butir angka (1.)</option>'+
          '<option value="kl2">Butir huruf (a.)</option>'+
          '<option value="H">Judul klausul</option>'+
        '</select>'+
      '</div>'+
      '<span class="spk-we-sep"></span>'+
      '<div class="spk-we-grp">'+
        '<button type="button" title="Turunkan level (indent)" onmousedown="return spkWEmd(event)" onclick="spkWEIndent(1)">&#8677;</button>'+
        '<button type="button" title="Naikkan level" onmousedown="return spkWEmd(event)" onclick="spkWEIndent(-1)">&#8676;</button>'+
        '<span class="spk-we-bulwrap"><button type="button" id="spk-we-bulbtn" title="Daftar poin" onmousedown="return spkWEmd(event)" onclick="spkWEBulToggle(event)">&#8226;&#8801; <span style="font-size:9px;margin-left:1px">&#9662;</span></button></span>'+
        '<span class="spk-we-numwrap"><button type="button" id="spk-we-numbtn" title="Daftar bernomor" onmousedown="return spkWEmd(event)" onclick="spkWENumToggle(event)">1.&#8801; <span style="font-size:9px;margin-left:1px">&#9662;</span></button></span>'+
      '</div>'+
      '<span class="spk-we-sep"></span>'+
      '<div class="spk-we-grp">'+
        '<select id="spk-we-case" title="Ubah huruf" onchange="spkWECase(this.value)">'+
          '<option value="">Aa Huruf</option>'+
          '<option value="sentence">Kalimat</option>'+
          '<option value="upper">HURUF BESAR</option>'+
          '<option value="lower">huruf kecil</option>'+
          '<option value="cap">Kapital Awal</option>'+
        '</select>'+
        '<button type="button" id="spk-we-fp" title="Format Painter — Ctrl+Alt+C salin format, Ctrl+Alt+V tempel format (klik ganda: mode terkunci)" onmousedown="return spkWEmd(event)" onclick="spkWEPainterClick()" ondblclick="spkWEPainterSticky()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><path d="M18.4 2.6a2 2 0 0 1 2.8 2.8L12 14.6l-3.4-3.4Z"/><path d="M8.6 11.2 5.9 13.9a3 3 0 0 0-.8 2.9L3 21l4.2-2.1a3 3 0 0 0 2.9-.8l2.7-2.7Z"/></svg></button>'+
        '<button type="button" title="Bersihkan format" onmousedown="return spkWEmd(event)" onclick="spkWECmd(\'removeFormat\')">&#10006;</button>'+
        '<button type="button" id="spk-we-ph" title="Tandai sebagai CONTOH (transparan) — hanya panduan pengisian; tidak ikut tercetak, dan bila seluruh isi butir masih contoh, butir tersebut otomatis hilang &amp; penomoran menyesuaikan" onmousedown="return spkWEmd(event)" onclick="spkWETogglePh()">&#9675; Contoh</button>'+
      '</div>'+
    '</div>'+
    '<div class="spk-we-trow">'+
      '<div class="spk-we-grp">'+
        '<button type="button" title="Tebal" onmousedown="return spkWEmd(event)" onclick="spkWECmd(\'bold\')"><b>B</b></button>'+
        '<button type="button" title="Miring" onmousedown="return spkWEmd(event)" onclick="spkWECmd(\'italic\')"><i>I</i></button>'+
        '<button type="button" title="Garis bawah" onmousedown="return spkWEmd(event)" onclick="spkWECmd(\'underline\')"><u>U</u></button>'+
        '<button type="button" title="Coret" onmousedown="return spkWEmd(event)" onclick="spkWECmd(\'strikeThrough\')"><s>S</s></button>'+
        '<button type="button" title="Subscript" onmousedown="return spkWEmd(event)" onclick="spkWECmd(\'subscript\')">X&#8322;</button>'+
        '<button type="button" title="Superscript" onmousedown="return spkWEmd(event)" onclick="spkWECmd(\'superscript\')">X&#178;</button>'+
      '</div>'+
      '<span class="spk-we-sep"></span>'+
      '<div class="spk-we-grp">'+
        '<label class="spk-we-clabel" title="Warna teks"><span style="font-weight:700">A</span><input type="color" value="#e53935" oninput="spkWECmd(\'foreColor\',this.value)"></label>'+
        '<label class="spk-we-clabel" title="Warna stabilo"><span>&#9998;</span><input type="color" value="#fff59d" oninput="spkWECmd(\'hiliteColor\',this.value)"></label>'+
      '</div>'+
      '<span class="spk-we-sep"></span>'+
      '<div class="spk-we-grp">'+
        '<button type="button" title="Rata kiri" onmousedown="return spkWEmd(event)" onclick="spkWEAlign(\'left\')">&#9776;</button>'+
        '<button type="button" title="Rata tengah" onmousedown="return spkWEmd(event)" onclick="spkWEAlign(\'center\')">&#8801;</button>'+
        '<button type="button" title="Rata kanan" onmousedown="return spkWEmd(event)" onclick="spkWEAlign(\'right\')">&#9776;</button>'+
        '<button type="button" title="Rata kiri-kanan" onmousedown="return spkWEmd(event)" onclick="spkWEAlign(\'justify\')">&#9636;</button>'+
        '<span class="spk-we-lhwrap"><button type="button" id="spk-we-lhbtn" title="Spasi baris &amp; paragraf" onmousedown="return spkWEmd(event)" onclick="spkWELHToggle(event)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M3 6h13M3 12h13M3 18h13M20 8V4m0 0-2 2m2-2 2 2M20 16v4m0 0-2-2m2 2 2-2"/></svg> <span style="font-size:9px;margin-left:1px">&#9662;</span></button></span>'+
      '</div>'+
      '<span class="spk-we-sep"></span>'+
      '<div class="spk-we-grp">'+
        '<button type="button" title="Urungkan" onmousedown="return spkWEmd(event)" onclick="spkWECmd(\'undo\')">&#8630;</button>'+
        '<button type="button" title="Ulangi" onmousedown="return spkWEmd(event)" onclick="spkWECmd(\'redo\')">&#8631;</button>'+
      '</div>'+
      '<span class="spk-we-sep"></span>'+
      '<div class="spk-we-grp">'+
        '<label class="spk-we-check" title="Tampilkan / sembunyikan penggaris"><input type="checkbox" id="spk-we-rulertgl" checked onchange="spkWEToggleRuler(this.checked)"> Penggaris</label>'+
      '</div>'+
    '</div>'+
  '</div>'+
  '<div class="spk-we-rulerwrap" id="spk-we-rulerwrap"><div class="spk-we-ruletip" id="spk-we-ruletip"></div>'+
  '<div class="spk-we-ruler" id="spk-we-ruler"><svg id="spk-we-rulersvg" width="794" height="34"></svg></div></div>';
}

function spkWEmd(e){ e.preventDefault(); return false; }

/* --- Buka editor --- .
   opts = { title, html, placeholder, onSave(html) } */
function spkWEOpen(opts){
  opts=opts||{};
  spkWE.onSave = opts.onSave || null;
  var titleFieldHtml = opts.titleField
    ? '<div style="padding:12px 16px 4px;background:#fff;border-bottom:1px solid #eef1f3"><div class="field" style="margin:0"><label>'+fkEsc(opts.titleField.label||'Judul')+'</label>'+
        '<input type="text" id="spk-we-titleinput" value="'+fkEsc(opts.titleField.value||'')+'" placeholder="'+fkEsc(opts.titleField.placeholder||'')+'"></div></div>'
    : '';
  var ov=spkWEEnsureOverlay();
  ov.innerHTML=
    '<div class="spk-ov-modal spk-ov-we" id="spk-we-modal">'+
      '<div class="spk-ov-head spk-we-head" id="spk-we-head" onclick="spkWEHeadClick(event)" ondblclick="spkWEToggleMax()">'+
        '<span class="spk-ov-title">'+fkEsc(opts.title||'Editor Teks')+'</span>'+
        '<div class="spk-we-wbtns">'+
          '<button type="button" class="spk-we-wbtn" id="spk-we-minbtn" title="Perkecil (Minimize)" onclick="event.stopPropagation();spkWEMinimize()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg></button>'+
          '<button type="button" class="spk-we-wbtn" id="spk-we-maxbtn" title="Perbesar (Maximize)" onclick="event.stopPropagation();spkWEToggleMax()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="5" y="5" width="14" height="14" rx="1.5"/></svg></button>'+
          '<button type="button" class="spk-we-wbtn close" title="Tutup (Close)" onclick="event.stopPropagation();spkWEAskClose()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'+
        '</div>'+
      '</div>'+
      '<div class="spk-ov-body">'+
        titleFieldHtml+
        spkWEToolbarHtml()+
        '<div class="spk-we-pagearea"><div class="spk-we-page'+
          ((typeof spkIsPk==='function' && spkIsPk()) ? ' spk-pk' : '')+'">'+
          (opts.head ? '<div class="spk-we-clhead" id="spk-we-clhead"></div>' : '')+
          '<div class="spk-we-doc'+
            ((typeof spkIsPk==='function' && spkIsPk()) ? ' spk-pk' : '')+
            '" id="spk-we-doc" contenteditable="true" spellcheck="true" data-ph="'+fkEsc(opts.placeholder||'Mulai ketik di sini...')+'"></div>'+
        '</div></div>'+
      '</div>'+
      '<div class="spk-we-foot">'+
        '<span class="spk-we-status"><span id="spk-we-count">0 kata</span><span id="spk-we-pages">1 halaman</span><span>A4 &middot; Portrait &middot; Margin Normal (2,54 cm)</span>'+
          '<span class="spk-we-hint">Ctrl+Alt+C salin format &middot; Ctrl+Alt+V tempel format</span></span>'+
        '<button class="btn btn-green" onclick="spkWEDoSave()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg> Simpan</button>'+
      '</div>'+
    '</div>';
  spkWE.head = opts.head || null;
  var doc=document.getElementById('spk-we-doc');
  doc.innerHTML = spkWENormalizeIn(opts.html||'');
  spkWEHeadRender();
  /* nomor yang tersimpan dari sesi sebelumnya dikembalikan menjadi objek non-editable */
  Array.prototype.forEach.call(doc.querySelectorAll('p[data-nfmt] > span.n'), function(sp){
    sp.setAttribute('contenteditable','false');
    if(sp.style){ sp.style.userSelect='none'; }
    /* Hitung ulang lebar kotak nomor dengan rumus terbaru (lebih rapat) agar isi
       tersimpan lama ikut dirapikan: jarak nomor->teks menyempit & baris ke-2
       sejajar dengan huruf pertama teks seperti Microsoft Word. */
    try{
      var p=sp.parentNode; if(!p) return;
      var sty=p.getAttribute('data-nsty')||'dec';
      var fmt=p.getAttribute('data-nfmt')||'{n}';
      var idx=parseInt(p.getAttribute('data-nidx')||'0',10)||0;
      var align=(p.getAttribute('data-nalign')==='right')?'right':'left';
      var W=spkNFWidth([spkNFMark(sty, fmt, idx)]);
      var start=/\bkl2\b/.test(p.className||'')?0.75:0;
      sp.setAttribute('style', spkNFSpanStyle(W, align));
      p.style.marginLeft=(start+W).toFixed(2)+'cm';
      p.style.textIndent='-'+W.toFixed(2)+'cm';
      p.setAttribute('data-nw', W.toFixed(2));
    }catch(e){}
  });
  spkWEBindDoc(doc);
  ov.classList.remove('we-min');            // selalu mulai dari keadaan normal
  if(spkWE.maximized) ov.classList.add('we-max'); else ov.classList.remove('we-max');
  spkWEPainterMode(false); spkWEfp=null; spkWEfpSticky=false;
  ov.classList.add('show');
  try{ document.execCommand('defaultParagraphSeparator', false, 'p'); }catch(e){}
  spkWEDrawRuler();
  spkWECount();
  setTimeout(function(){ try{ doc.focus(); }catch(e){} spkWEDrawRuler(); spkWEPaginate(); }, 60);
}

/* Baris judul klausul pada kertas (pratinjau posisi, tidak dapat diedit).
   Memperlihatkan bahwa isi klausul sejajar dengan huruf sesudah nomor klausul. */
function spkWEHeadRender(){
  var el=document.getElementById('spk-we-clhead'); if(!el) return;
  var h=spkWE.head||{};
  var ti=document.getElementById('spk-we-titleinput');
  var judul = ti ? String(ti.value||'').trim() : String(h.judul||'').trim();
  var no = (h.no!=null && h.no!=='') ? String(h.no) : 'N';
  var pk = (typeof spkIsPk==='function' && spkIsPk());
  el.className = 'spk-we-clhead' + (pk ? ' spk-pk' : '');
  if(pk){
    /* Perjanjian/Kontrak: "PASAL n" di baris pertama, nama pasal di bawahnya,
       keduanya rata tengah — sama seperti tampilan Lihat. */
    el.innerHTML='<span class="n">PASAL '+fkEsc(no)+'</span>'+
      (judul ? fkEsc(judul) : '<span class="ph">NAMA PASAL</span>')+
      '<span class="spk-we-clhead-tag">(pratinjau — isi klausul di bawah ini mulai di batas margin kiri)</span>';
  }else{
    el.innerHTML='<span class="n">'+fkEsc(no)+'.</span>'+
      (judul ? fkEsc(judul) : '<span class="ph">JUDUL KLAUSUL</span>')+
      '<span class="spk-we-clhead-tag">(pratinjau — isi klausul di bawah ini sejajar dengan huruf sesudah nomor)</span>';
  }
  if(ti && !ti.__hdBound){
    ti.__hdBound=true;
    ti.addEventListener('input', spkWEHeadRender);
  }
}

function spkWEClose(){
  var ov=document.getElementById('spk-we-overlay');
  if(ov){ ov.classList.remove('show'); ov.classList.remove('we-min'); }
  spkWE.onSave=null; spkWEfp=null; spkWEfpSticky=false;
  try{ spkWEPainterMode(false); }catch(e){}
  try{ spkWENumClose(); }catch(e){} try{ spkWELHClose(); }catch(e){} try{ spkWEBulClose(); }catch(e){}
}

/* ---------- Kontrol jendela editor: Minimize / Maximize / Close ---------- */
/* Minimize: editor menyusut menjadi bilah di kanan bawah. Isi tulisan TIDAK hilang. */
function spkWEMinimize(){
  var ov=document.getElementById('spk-we-overlay'); if(!ov) return;
  try{ spkWENumClose(); }catch(e){} try{ spkWELHClose(); }catch(e){} try{ spkWEBulClose(); }catch(e){}
  ov.classList.add('we-min');
  var b=document.getElementById('spk-we-minbtn'); if(b) b.title='Kembalikan (Restore)';
}
/* Restore dari keadaan minimize */
function spkWERestore(){
  var ov=document.getElementById('spk-we-overlay'); if(!ov) return;
  ov.classList.remove('we-min');
  var b=document.getElementById('spk-we-minbtn'); if(b) b.title='Perkecil (Minimize)';
  var d=document.getElementById('spk-we-doc'); if(d){ try{ d.focus(); }catch(e){} }
  spkWEDrawRuler();
}
/* Klik pada bilah judul saat minimize = kembalikan */
function spkWEHeadClick(e){
  var ov=document.getElementById('spk-we-overlay');
  if(ov && ov.classList.contains('we-min')) spkWERestore();
}
/* Maximize / Restore ukuran */
function spkWEToggleMax(){
  var ov=document.getElementById('spk-we-overlay'); if(!ov) return;
  if(ov.classList.contains('we-min')){ spkWERestore(); return; }
  var on=!ov.classList.contains('we-max');
  ov.classList.toggle('we-max', on);
  spkWE.maximized=on;
  var b=document.getElementById('spk-we-maxbtn');
  if(b){
    b.title = on ? 'Kembalikan ukuran (Restore)' : 'Perbesar (Maximize)';
    b.innerHTML = on
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="4" y="8" width="12" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="5" y="5" width="14" height="14" rx="1.5"/></svg>';
  }
  setTimeout(function(){ spkWEDrawRuler(); spkWECount(); }, 30);
}
/* Tutup dengan konfirmasi bila ada isi (mencegah kehilangan tulisan) */
function spkWEAskClose(){
  var doc=document.getElementById('spk-we-doc');
  var isi = doc ? (doc.innerText||'').trim() : '';
  if(isi && !confirm('Tutup editor? Perubahan yang belum disimpan akan hilang.')) return;
  spkWEClose();
}

function spkWEDoSave(){
  var doc=document.getElementById('spk-we-doc'); if(!doc) return;
  var html=spkWESerialize(doc);
  var ti=document.getElementById('spk-we-titleinput');
  var title = ti ? String(ti.value||'').trim() : null;
  var cb=spkWE.onSave;
  spkWE.head=null;
  // Bila ada field judul dan judul kosong, jangan tutup — beri peringatan
  if(ti && !title){ if(typeof toast==='function') toast('Judul wajib diisi','warn'); ti.focus(); return; }
  spkWEClose();
  if(typeof cb==='function') cb(html, title);
}

/* --- Normalisasi HTML masuk: pastikan tiap blok teratas adalah <p class="klX"> --- */
function spkWENormalizeIn(html){
  html=String(html||'').trim();
  if(!html) return '<p class="kl0"><br></p>';
  var tmp=document.createElement('div'); tmp.innerHTML=html;
  // Jika isi hanya teks tanpa <p>, bungkus jadi satu paragraf
  if(!tmp.querySelector('p')){
    return '<p class="kl0">'+html+'</p>';
  }
  // Pastikan tiap <p> punya salah satu kelas kl*
  var ps=tmp.querySelectorAll('p');
  for(var i=0;i<ps.length;i++){
    var p=ps[i];
    if(!/\b(kl0|kl1|kl2|klp|klp1|klp2|kldesc)\b/.test(p.className)){
      p.className=(p.className? p.className+' ':'')+'kl0';
    }
    if(p.innerHTML.trim()==='') p.innerHTML='<br>';
  }
  return spkFixLH(tmp.innerHTML);      /* spasi baris lama (1,15 = tunggal) -> 1,15 gaya Word */
}

/* --- Serialisasi keluar: hasil HTML bersih dengan kelas dokumen kl* --- */
function spkWESerialize(doc){
  var tmp=document.createElement('div');
  tmp.innerHTML=doc.innerHTML;
  // Buang spacer paginasi (hanya bantuan tampilan editor, tak boleh ikut tersimpan)
  Array.prototype.slice.call(tmp.querySelectorAll('.spk-pagebreak')).forEach(function(s){ s.parentNode.removeChild(s); });
  // Buang atribut contenteditable sisa
  var all=tmp.querySelectorAll('[contenteditable]');
  for(var i=0;i<all.length;i++) all[i].removeAttribute('contenteditable');
  // Ubah <div> tak sengaja (dari perilaku browser) jadi <p class="kl0">
  var divs=tmp.querySelectorAll('div');
  for(var d=divs.length-1; d>=0; d--){
    var dv=divs[d];
    var np=document.createElement('p'); np.className='kl0'; np.innerHTML=dv.innerHTML;
    if(dv.style && dv.style.textAlign) np.style.textAlign=dv.style.textAlign;
    dv.parentNode.replaceChild(np, dv);
  }
  // Pastikan tiap <p> punya kelas kl*, pertahankan text-align bila diset pengguna
  var ps=tmp.querySelectorAll('p');
  for(var j=0;j<ps.length;j++){
    var pp=ps[j];
    if(!/\b(kl0|kl1|kl2|klp|klp1|klp2|kldesc)\b/.test(pp.className||'')){
      pp.className=((pp.className||'')+' kl0').trim();
    }
    // buang penanda judul internal (data-h) tapi biarkan style tebal/kapital
    pp.removeAttribute('data-h');
    // buang style kosong
    if(pp.getAttribute('style')==='') pp.removeAttribute('style');
  }
  return tmp.innerHTML.replace(/<br>\s*<\/p>/g,'</p>').trim();
}

/* Jalankan paginasi dengan penundaan (agar tidak berat saat mengetik cepat) */
var _spkPagTimer=null;
function spkWEPaginateSoon(){ clearTimeout(_spkPagTimer); _spkPagTimer=setTimeout(spkWEPaginate, 250); }
/* --- Ikat event pada kanvas --- */
/* ============ TEMPEL (PASTE) DARI WORD / WEB ============
   Sebelumnya editor tidak punya penangan paste, jadi HTML mentah Word masuk apa
   adanya. Word membawa serta:
     - style "text-transform:uppercase" / "mso-style-textoutline" (huruf KAPITAL
       hanyalah FORMAT, teks aslinya huruf biasa) -> teks tampak kapital semua,
     - margin-left / text-indent / mso-list bawaan Word -> indentasi kacau,
     - <span style="font-family:...;font-size:...">, kelas MsoNormal, dll.
   Semua itu dibuang. Yang dipertahankan hanya STRUKTUR PARAGRAF dan penekanan
   dasar (tebal / miring / garis bawah). Tiap paragraf lalu diberi kelas milik
   aplikasi ini:
     kl0 = teks biasa  -> SEJAJAR dengan teks judul klausul (sesudah nomor)
     kl1 = diawali "1." / "1.1" / "2)"  -> hanging indent 0,75cm
     kl2 = diawali "a." / "b)"          -> hanging indent bertingkat
   Dengan begitu isi klausul SELALU lurus dengan judulnya, apa pun sumber salinan. */
const SPK_WE_INLINE_KEEP={B:1,STRONG:1,I:1,EM:1,U:1,SUP:1,SUB:1};
function spkWEInlineHtml(node){
  var out='';
  for(var k=node.firstChild;k;k=k.nextSibling){
    if(k.nodeType===3){ out+=fkEsc(String(k.nodeValue||'').replace(/[\s\u00A0]+/g,' ')); continue; }
    if(k.nodeType!==1) continue;
    var t=k.tagName;
    if(t==='BR'){ out+=' '; continue; }
    var inner=spkWEInlineHtml(k);
    if(!inner.replace(/<[^>]+>/g,'').trim()) continue;
    if(SPK_WE_INLINE_KEEP[t]){
      var tag=(t==='STRONG')?'b':(t==='EM')?'i':t.toLowerCase();
      out+='<'+tag+'>'+inner+'</'+tag+'>';
    }else{
      out+=inner;                       /* span/font/div pembungkus -> buang tag, ambil isinya */
    }
  }
  return out;
}
/* HTML tempelan -> daftar potongan HTML per paragraf (tanpa style & kelas apa pun) */
/* ---- JARAK / SPASI PARAGRAF: IKUT WORD, BUKAN BAWAAN APLIKASI ----
   Aplikasi punya aturan bawaan (.spk-cl p{margin:0 0 6pt;line-height:1.15;text-align:justify}
   dan judul klausul spasi-sebelum 12pt). Aturan itu HANYA berlaku bila sumber tempelan
   tidak menyebut jaraknya sendiri. Word menyalin ukurannya secara inline pada tiap
   <p> (margin-top / margin-bottom / line-height / text-align, kadang lewat awalan
   mso-para-*), jadi nilai-nilai itu dibaca dan dipasang kembali sebagai style inline —
   style inline mengalahkan CSS bawaan, sehingga:
     - "spasi sebelum" & "spasi sesudah" persis seperti di Word,
     - spasi baris (1; 1,15; 1,5; ganda; atau nilai pt) persis seperti di Word,
     - perataan (kiri / tengah / kanan / rata kanan-kiri) persis seperti di Word.
   Yang TETAP ditata aplikasi hanyalah INDENTASI (kelas kl0/kl1/kl2), supaya isi klausul
   selalu lurus dengan teks judulnya. Nilai inline ini juga terbaca kembali oleh
   spkPPrFromCss() saat diekspor ke .docx, jadi bolak-balik Word <-> web tetap sama. */
function spkWECssPt(v){
  v=String(v==null?'':v).trim(); if(!v) return null;
  var m=/^(-?[\d.]+)\s*(pt|cm|mm|in|px|pc)?$/i.exec(v); if(!m) return null;
  var n=parseFloat(m[1]); if(isNaN(n)) return null;
  var u=(m[2]||'pt').toLowerCase();
  var f=(u==='cm')?28.3465:(u==='mm')?2.83465:(u==='in')?72:(u==='px')?0.75:(u==='pc')?12:1;
  return n*f;
}
function spkWEStyleOf(el){
  var raw=String((el && el.getAttribute && el.getAttribute('style'))||'').toLowerCase();
  if(!raw) return '';
  function amb(prop){
    var m=new RegExp('(?:^|;)\\s*'+prop+'\\s*:\\s*([^;]+)','i').exec(raw);
    return m ? m[1].trim() : '';
  }
  var out=[];
  var mt=amb('margin-top')||amb('mso-para-margin-top');
  var mb=amb('margin-bottom')||amb('mso-para-margin-bottom');
  var pt;
  pt=spkWECssPt(mt); if(pt!=null) out.push('margin-top:'+(Math.round(pt*10)/10)+'pt');
  pt=spkWECssPt(mb); if(pt!=null) out.push('margin-bottom:'+(Math.round(pt*10)/10)+'pt');
  var lh=amb('line-height');
  if(lh && lh!=='normal'){
    if(/%$/.test(lh)){
      var pv=parseFloat(lh);
      if(!isNaN(pv)) out.push('line-height:'+spkLHCss(pv/100));            /* Word 115% -> 1,15 baris */
    }else if(/^[\d.]+$/.test(lh)){
      out.push('line-height:'+spkLHCss(parseFloat(lh)));                    /* Word 1,5 baris */
    }else{
      var lp=spkWECssPt(lh);
      if(lp!=null) out.push('line-height:'+(Math.round(lp*10)/10)+'pt');    /* 13.5pt (spasi pas) */
    }
  }
  var ta=amb('text-align');
  if(/^(left|right|center|justify)$/.test(ta)) out.push('text-align:'+ta);
  return out.join(';');
}
function spkWEHtmlToBlocks(html){
  var host=document.createElement('div');
  host.innerHTML=String(html||'').replace(/<!--[\s\S]*?-->/g,'');
  ['style','script','meta','link','title','xml'].forEach(function(t){
    var e=host.getElementsByTagName(t);
    for(var i=e.length-1;i>=0;i--) e[i].parentNode.removeChild(e[i]);
  });
  var BLK=/^(P|DIV|LI|H1|H2|H3|H4|H5|H6|TD|TH|BLOCKQUOTE|PRE|SECTION|ARTICLE)$/;
  var blocks=[];
  (function walk(n){
    for(var k=n.firstChild;k;k=k.nextSibling){
      if(k.nodeType===3){
        var tx=String(k.nodeValue||'').replace(/[\s\u00A0]+/g,' ').trim();
        if(tx) blocks.push({h:fkEsc(tx), sty:''});
        continue;
      }
      if(k.nodeType!==1) continue;
      if(BLK.test(k.tagName)){
        var punyaBlok=false;
        for(var c=k.firstChild;c;c=c.nextSibling){ if(c.nodeType===1 && BLK.test(c.tagName)){ punyaBlok=true; break; } }
        if(punyaBlok){ walk(k); continue; }          /* pembungkus -> telusuri ke dalam */
        var h=spkWEInlineHtml(k).replace(/\s+/g,' ').trim();
        if(h.replace(/<[^>]+>/g,'').trim()) blocks.push({h:h, sty:spkWEStyleOf(k)});
        continue;
      }
      walk(k);                                       /* span/font/table/tbody/tr -> lanjut */
    }
  })(host);
  return blocks;
}
/* Potongan paragraf -> HTML kl0/kl1/kl2 (+ jarak spasi asli dari Word) */
function spkWEBlocksToHtml(blocks){
  var out=[];
  for(var i=0;i<blocks.length;i++){
    var b=blocks[i];
    if(typeof b==='string') b={h:b, sty:''};
    var h=String((b&&b.h)||'').trim();
    var teks=h.replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').trim();
    if(!teks) continue;
    var cls='kl0';                                   /* baku: sejajar teks judul klausul */
    if(/^\d+\.\d+(?:\.\d+)*\.?\s+/.test(teks) || /^\d+[.)]\s+/.test(teks)) cls='kl1';
    else if(/^[A-Za-z][.)]\s+/.test(teks)) cls='kl2';
    var sty=(b&&b.sty)?(' style="'+b.sty+'"'):'';
    out.push('<p class="'+cls+'"'+sty+'>'+h+'</p>');
  }
  return out.join('');
}
function spkWEOnPaste(e){
  var dt=(e && (e.clipboardData||window.clipboardData)); if(!dt) return;
  var html='', plain='';
  try{ html=dt.getData('text/html')||''; }catch(_){}
  try{ plain=dt.getData('text/plain')||dt.getData('Text')||''; }catch(_){}
  var out='';
  try{ if(html) out=spkWEBlocksToHtml(spkWEHtmlToBlocks(html)); }catch(err){ console.error(err); out=''; }
  if(!out && plain){
    var baris=spkCleanPasteText(plain).split('\n').filter(function(t){ return t.trim(); })
      .map(function(t){ return {h:fkEsc(t), sty:''}; });   /* teks polos: tak ada info spasi -> pakai bawaan dokumen */
    out=spkWEBlocksToHtml(baris);
  }
  if(!out) return;                                   /* tak ada teks -> biarkan bawaan */
  e.preventDefault();
  try{ document.execCommand('insertHTML', false, out); }
  catch(err2){ try{ document.execCommand('paste'); }catch(_){} }
  spkWECount(); spkWESyncBlockSelect(); spkWEPaginateSoon();
}
/* ---- Ubah huruf (untuk teks yang sumbernya MEMANG diketik kapital) ---- */
function spkWECaseText(t, mode){
  t=String(t==null?'':t);
  if(mode==='upper') return t.toUpperCase();
  if(mode==='lower') return t.toLowerCase();
  if(mode==='title'||mode==='cap') return t.toLowerCase().replace(/(^|[\s(\[\u201C"'\/\u2013\u2014-])([a-z\u00e0-\u00ff])/g,
    function(m,a,b){ return a+b.toUpperCase(); });
  if(mode==='sentence') return t.toLowerCase().replace(/(^\s*|[.!?:]\s+)([a-z\u00e0-\u00ff])/g,
    function(m,a,b){ return a+b.toUpperCase(); });
  return t;
}
function spkWECaseNode(root, mode){
  var w=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  var n;
  while((n=w.nextNode())){
    var p=n.parentNode;
    if(p && p.classList && p.classList.contains('n')) continue;   /* nomor otomatis: jangan diusik */
    n.nodeValue=spkWECaseText(n.nodeValue, mode);
  }
}
function spkWECase(mode){
  var sel0=document.getElementById('spk-we-case'); if(sel0) sel0.value='';
  if(!mode) return;
  var doc=document.getElementById('spk-we-doc'); if(!doc) return;
  var sel=window.getSelection(); if(!sel || !sel.rangeCount){ toast('Sorot dulu teks yang ingin diubah','warn'); return; }
  var r=sel.getRangeAt(0);
  if(!doc.contains(r.commonAncestorContainer)){ toast('Sorot dulu teks di dalam editor','warn'); return; }
  if(r.collapsed){
    /* tanpa sorotan -> berlaku untuk paragraf tempat kursor berada */
    var p=r.startContainer;
    while(p && p!==doc && !(p.nodeType===1 && /^(P|LI|DIV)$/.test(p.tagName))) p=p.parentNode;
    if(!p || p===doc){ toast('Sorot dulu teks yang ingin diubah','warn'); return; }
    spkWECaseNode(p, mode);
  }else{
    var box=document.createElement('div');
    box.appendChild(r.cloneContents());
    spkWECaseNode(box, mode);
    r.deleteContents();
    var frag=document.createDocumentFragment();
    while(box.firstChild) frag.appendChild(box.firstChild);
    r.insertNode(frag);
    sel.removeAllRanges();
  }
  spkWECount(); spkWEPaginateSoon();
}
function spkWEBindDoc(doc){
  doc.addEventListener('paste', spkWEOnPaste);
  doc.addEventListener('input', function(){ spkWECount(); spkWESyncBlockSelect(); spkWEPaginateSoon(); });
  doc.addEventListener('keyup', function(){ spkWEGuardNumCaret(); spkWESyncBlockSelect(); });
  doc.addEventListener('mouseup', function(){
    if(doc.classList.contains('fp-active')){ setTimeout(spkWEPainterApply,0); return; }
    setTimeout(spkWEGuardNumCaret, 0);
    spkWESyncBlockSelect();
  });
  /* kursor tidak boleh berhenti di dalam / sebelum nomor */
  doc.addEventListener('click', function(){ setTimeout(spkWEGuardNumCaret, 0); });
  // Enter di dalam paragraf: pertahankan kelas kl*; bila paragraf diawali penanda
  // nomor sah (1. / a. / i. / I. / 1)), buat nomor BERIKUTNYA secara otomatis.
  doc.addEventListener('keydown', function(e){
    if(e.key==='Escape'){ spkWEPainterMode(false); return; }
    /* --- AutoFormat: ketik "1." / "a." / "2.1." / "i)" lalu SPASI -> jadi penomoran --- */
    if((e.key===' '||e.key==='Spacebar'||e.code==='Space') && !e.ctrlKey && !e.altKey && !e.metaKey){
      if(spkWEAutoNumberOnSpace()){ e.preventDefault(); return; }
    }
    /* --- Backspace tepat setelah nomor otomatis -> batalkan penomoran --- */
    if(e.key==='Backspace' && !e.ctrlKey && !e.altKey && !e.metaKey){
      if(spkWECancelNumberOnBackspace()){ e.preventDefault(); return; }
    }
    /* --- Tab: lompat ke tab stop (L) berikutnya di penggaris, seperti Word --- */
    if(e.key==='Tab' && !e.ctrlKey && !e.altKey && !e.metaKey){
      e.preventDefault(); spkWEDoTab(e.shiftKey); return;
    }
    /* --- Format Painter: Ctrl+Alt+C (salin format) / Ctrl+Alt+V (tempel format) --- */
    if((e.ctrlKey||e.metaKey) && e.altKey && !e.shiftKey){
      var k=String(e.key||'').toLowerCase();
      if(k==='c'){ e.preventDefault(); spkWEPainterCopy(); return; }
      if(k==='v'){ e.preventDefault(); spkWEPainterPaste(); return; }
    }
    if(e.key==='Enter' && !e.shiftKey){
      var p=spkWECurrentP();
      /* --- Paragraf hasil 'Atur Format Nomor Baru': lanjutkan nomor otomatis --- */
      if(p && p.hasAttribute && p.hasAttribute('data-nfmt')){
        var nf=p.getAttribute('data-nfmt');
        var nsty=p.getAttribute('data-nsty')||'dec';
        var nidx=parseInt(p.getAttribute('data-nidx')||'0',10);
        var nalign=p.getAttribute('data-nalign')||'left';
        var nw=parseFloat(p.getAttribute('data-nw')||'0.75')||0.75;
        var ncls=(p.className.match(/\b(kl1|kl2)\b/)||[])[1]||'kl1';
        var nml=p.style.marginLeft, nti=p.style.textIndent;
        var isiKosong=((p.textContent||'').trim()===spkNFMark(nsty,nf,nidx).trim());
        var pRef=p;
        setTimeout(function(){
          var np=spkWECurrentP();
          if(isiKosong){                       // item kosong -> akhiri penomoran (spt Word)
            spkWEStripLeadingMarker(pRef); pRef.className='kl0';
            if(np && np!==pRef){ spkWEStripLeadingMarker(np); np.className='kl0'; np.style.marginLeft=''; np.style.textIndent=''; }
            spkWECount(); return;
          }
          if(np && np!==pRef){
            spkWEStripLeadingMarker(np);
            np.className=ncls;
            np.style.marginLeft=nml; np.style.textIndent=nti;
            np.removeAttribute('data-h'); np.style.fontWeight=''; np.style.textTransform='';
            var sp=spkWEMakeNumSpan(spkNFMark(nsty, nf, nidx+1), nw, nalign);
            np.insertBefore(sp, np.firstChild);
            np.setAttribute('data-nfmt', nf); np.setAttribute('data-nsty', nsty);
            np.setAttribute('data-nidx', String(nidx+1));
            np.setAttribute('data-nalign', nalign); np.setAttribute('data-nw', nw.toFixed(2));
            try{ var r=document.createRange(); r.setStartAfter(sp); r.collapse(true);
                 var sl=window.getSelection(); sl.removeAllRanges(); sl.addRange(r); }catch(e2){}
          }
          spkWECount();
        }, 0);
        return;
      }
      if(p){
        var cls=(p.className.match(/\b(kl0|kl1|kl2|klp|klp1|klp2|kldesc)\b/)||[])[1]||'kl0';
        var nextMk=spkWENextMarker(p);   // penanda berikutnya bila ada
        // Bila item bernomor tapi ISINYA kosong (hanya penanda) -> Enter mengakhiri list
        var plain=(p.textContent||'').trim();
        var mkNow=spkWECurrentMarker(p);
        var endList = mkNow && plain===mkNow.replace(/\s+$/,'');
        setTimeout(function(){
          var np=spkWECurrentP();
          if(np && np!==p){
            if(endList){ // hapus penanda di paragraf lama, jadikan kedua paragraf biasa
              spkWEStripLeadingMarker(p); p.className='kl0';
              np.className='kl0';
            } else {
              np.className=cls;
              if(nextMk){
                // sisipkan penanda berikutnya di awal paragraf baru
                np.innerHTML = nextMk+' '+np.innerHTML.replace(/^(<br>)?/,'');
              }
            }
            np.removeAttribute('data-h');
            np.style.fontWeight=''; np.style.textTransform='';
          }
          spkWECount();
        }, 0);
      }
    }
  });
}
/* Ambil penanda nomor di awal paragraf (mis. "3." "b." "iv." "2)") atau null */
function spkWECurrentMarker(p){
  var txt=(p.textContent||'');
  var m=txt.match(/^\s*((?:\d+\.)+|\d+\)|[A-Za-z][.)]|[ivxlcdmIVXLCDM]{2,4}[.)])\s/);
  if(!m) return null;
  var tok=m[1];
  if(/^(CV|CD|MM|DVD|DIV|MMC|LC|DC|ID|IL|IM)[.)]$/i.test(tok)) return null;
  return tok;
}
/* Hitung penanda BERIKUTNYA dari penanda saat ini (1.->2., a.->b., iv.->v., 2)->3)) */
function spkWENextMarker(p){
  var tok=spkWECurrentMarker(p); if(!tok) return null;
  var close = /\)$/.test(tok) ? ')' : '.';
  var core = tok.replace(/[.)]$/,'');
  // angka
  if(/^\d+$/.test(core)) return (parseInt(core,10)+1)+close;
  // angka majemuk (3.1.) -> naikkan segmen terakhir
  if(/^(?:\d+\.)+$/.test(tok)){
    var segs=tok.replace(/\.$/,'').split('.');
    segs[segs.length-1]=String(parseInt(segs[segs.length-1],10)+1);
    return segs.join('.')+'.';
  }
  // huruf tunggal NON-romawi -> alfabet (a->b). Huruf romawi tunggal (I,V,X,L,C,D,M
  // dan i,v,x,...) ditangani di blok romawi di bawah agar I.->II. bukan I.->J.
  if(/^[A-Za-z]$/.test(core) && !/^[ivxlcdmIVXLCDM]$/.test(core)){
    var up=/[A-Z]/.test(core);
    var code=core.toLowerCase().charCodeAt(0);
    var nx = code>=122 ? 'a' : String.fromCharCode(code+1);
    return (up?nx.toUpperCase():nx)+close;
  }
  // romawi (termasuk huruf romawi tunggal seperti I. / i. / V.)
  if(/^[ivxlcdm]{1,4}$/i.test(core)){
    var up2 = core===core.toUpperCase();
    var val=spkRomanToInt(core.toUpperCase());
    if(val>0){ var r=spkNumRoman(val+1); return (up2?r:r.toLowerCase())+close; }
  }
  return null;
}
function spkRomanToInt(s){
  var map={I:1,V:5,X:10,L:50,C:100,D:500,M:1000}, n=0, prev=0;
  for(var i=s.length-1;i>=0;i--){ var v=map[s[i]]||0; if(v<prev) n-=v; else { n+=v; prev=v; } }
  return n;
}

function spkWECmd(cmd,val){
  var doc=document.getElementById('spk-we-doc'); if(!doc) return;
  doc.focus();
  try{ document.execCommand(cmd,false,val||null); }catch(e){}
  spkWECount();
}

function spkWEAlign(dir){
  // Untuk dokumen SPK default justify; izinkan override per paragraf via style ringan
  var p=spkWECurrentP(); if(!p) return;
  p.style.textAlign = dir;
}

/* --- Cari <p> yang sedang aktif (tempat kursor) --- */
/* Blok paragraf editor = <p> DAN baris "Label : nilai" (.spk-kv, sebuah <div>).
   Tanpa ini, dialog Paragraf / spasi baris tidak pernah mengenai baris kv sehingga
   pengaturan 12 pt pada baris "Lokasi" tidak berpengaruh. */
const SPK_WE_BLK_SEL='p,.spk-kv';
function spkWEIsBlk(n){
  return !!(n && n.nodeType===1 && (n.tagName==='P' || (n.classList && n.classList.contains('spk-kv'))));
}
function spkWECurrentP(){
  var sel=window.getSelection(); if(!sel.rangeCount) return null;
  var node=sel.anchorNode; if(!node) return null;
  if(node.nodeType===3) node=node.parentNode;
  var doc=document.getElementById('spk-we-doc');
  while(node && node!==doc && !spkWEIsBlk(node)) node=node.parentNode;
  return spkWEIsBlk(node)? node : null;
}

/* Semua blok (p / baris kv) yang tersentuh seleksi */
function spkWESelectedPs(){
  var doc=document.getElementById('spk-we-doc'); if(!doc) return [];
  var sel=window.getSelection(); if(!sel.rangeCount) { var p=spkWECurrentP(); return p?[p]:[]; }
  var range=sel.getRangeAt(0);
  var ps=Array.prototype.slice.call(doc.querySelectorAll(SPK_WE_BLK_SEL));
  var hit=ps.filter(function(p){ return range.intersectsNode ? range.intersectsNode(p) : true; });
  if(!hit.length){ var c=spkWECurrentP(); if(c) hit=[c]; }
  return hit;
}

/* --- Terapkan gaya paragraf (dropdown) --- */
function spkWEBlock(val){
  var doc=document.getElementById('spk-we-doc'); if(!doc) return; doc.focus();
  var ps=spkWESelectedPs();
  ps.forEach(function(p){
    if(val==='H'){ p.className='kl0'; p.setAttribute('data-h','1'); p.style.fontWeight='700'; p.style.textTransform='uppercase'; p.style.textAlign='left'; }
    else { p.removeAttribute('data-h'); p.style.fontWeight=''; p.style.textTransform=''; p.style.textAlign=''; p.className=val; }
  });
  spkWECount();
}

/* --- Tandai / batalkan tanda "CONTOH" (transparan) pada paragraf terpilih ---
   Paragraf bertanda .spk-ph = contoh pengisian (panduan). Aturannya:
     - tidak pernah ikut tercetak pada dokumen;
     - bila SELURUH isi sebuah butir masih berupa contoh (datanya belum diisi),
       butir tersebut beserta judulnya otomatis dihilangkan dan penomoran butir
       sisanya digeser otomatis (mis. 1.4 menjadi 1.1). */
function spkWETogglePh(){
  var doc=document.getElementById('spk-we-doc'); if(!doc) return; doc.focus();
  var ps=spkWESelectedPs(); if(!ps.length) return;
  var on = !ps.every(function(p){ return p.classList.contains('spk-ph'); });
  ps.forEach(function(p){ p.classList.toggle('spk-ph', on); });
  spkWESyncBlockSelect();
  spkWECount();
}

/* Sinkronkan dropdown gaya dengan paragraf aktif */
function spkWESyncBlockSelect(){
  try{ spkWERulerSync(); }catch(e){}
  var pph=spkWECurrentP(), bph=document.getElementById('spk-we-ph');
  if(bph) bph.classList.toggle('active', !!(pph && pph.classList.contains('spk-ph')));
  var sel=document.getElementById('spk-we-block'); if(!sel) return;
  var p=spkWECurrentP(); if(!p) return;
  var cls=(p.className.match(/\b(kl0|kl1|kl2|klp|klp1|klp2)\b/)||[])[1]||'kl0';
  if(p.getAttribute('data-h')==='1') cls='H';
  sel.value=cls;
}

/* --- Indent naik/turun level (0,75cm) mengikuti kelas dokumen --- */
function spkWEIndent(dir){
  var doc=document.getElementById('spk-we-doc'); if(!doc) return; doc.focus();
  var order=['kl0','klp','kl1','kl2'];
  var ps=spkWESelectedPs();
  ps.forEach(function(p){
    var cur=(p.className.match(/\b(kl0|kl1|kl2|klp|klp1|klp2)\b/)||[])[1]||'kl0';
    // petakan klp1/klp2 ke level agar konsisten
    if(cur==='klp1') cur='kl1'; if(cur==='klp2') cur='kl2';
    var i=order.indexOf(cur); if(i<0) i=0;
    i=Math.max(0, Math.min(order.length-1, i+dir));
    p.className=order[i];
  });
  spkWESyncBlockSelect();
}

/* --- Ubah huruf --- */
/* --- Hitung kata --- */
function spkWECount(){
  var doc=document.getElementById('spk-we-doc'); var el=document.getElementById('spk-we-count');
  if(!doc||!el) return;
  var t=(doc.innerText||'').trim();
  el.textContent=(t? t.split(/\s+/).length : 0)+' kata';
  spkWEPageCount();
}
/* Jumlah halaman A4 (tinggi kertas 297mm = 1122,5px pada 96dpi) */
function spkWEPageCount(){
  var pg=document.querySelector('#spk-we-overlay .spk-we-page');
  var el=document.getElementById('spk-we-pages'); if(!pg||!el) return;
  var A4=297*96/25.4;                       // tinggi 1 halaman A4 dalam px
  var n=Math.max(1, Math.ceil((pg.scrollHeight-2)/A4));
  el.textContent=n+' halaman';
}

/* --- Paginasi ala Word ---
   Menyisipkan "spacer" tak-teredit di batas halaman sehingga paragraf yang akan
   melewati margin bawah otomatis TURUN ke area ketik halaman berikutnya (melompati
   zona margin bawah + margin atas). Tinggi area ketik per halaman = 297mm − 2×25,4mm
   = 246,2mm; awal area ketik tiap halaman = kelipatan 297mm (koordinat dari atas doc).
   Dijalankan setelah mengetik (debounce). Spacer dibuang saat menyimpan. */
var _spkPagBusy=false;
function spkWEPaginate(){
  var doc=document.getElementById('spk-we-doc'); if(!doc || _spkPagBusy) return;
  _spkPagBusy=true;
  try{
    // buang spacer lama
    Array.prototype.slice.call(doc.children).forEach(function(el){
      if(el.nodeType===1 && el.classList && el.classList.contains('spk-pagebreak')) doc.removeChild(el);
    });
    var PX=96/25.4, USABLE=246.2*PX, PAGE=297*PX;
    var kids=Array.prototype.slice.call(doc.children);
    for(var i=0;i<kids.length;i++){
      var b=kids[i]; if(b.nodeType!==1) continue;
      var docTop=doc.getBoundingClientRect().top;
      var r=b.getBoundingClientRect();
      var top=r.top-docTop, h=r.height;
      if(h>=USABLE) continue;                       // paragraf lebih tinggi dari 1 halaman -> biarkan
      var curPage=Math.floor((top+1)/PAGE);
      var pageEnd=curPage*PAGE+USABLE;
      if(top+h > pageEnd+1){                         // paragraf menembus margin bawah
        var gap=(curPage+1)*PAGE - top;             // dorong ke awal area ketik halaman berikut
        if(gap>1){
          var sp=document.createElement('div');
          sp.className='spk-pagebreak';
          sp.setAttribute('contenteditable','false');
          sp.style.cssText='height:'+Math.round(gap)+'px;margin:0;padding:0;border:0;list-style:none;pointer-events:none;-webkit-user-select:none;user-select:none';
          doc.insertBefore(sp, b);
        }
      }
    }
  }catch(e){}
  _spkPagBusy=false;
}

/* --- Toggle penggaris --- */
function spkWEToggleRuler(on){
  var w=document.getElementById('spk-we-rulerwrap'); if(w) w.classList.toggle('hidden', !on);
}

/* --- Gambar penggaris (skala 1-15, penanda cm) --- */
/* Ukuran dasar kertas untuk penggaris.
   OFF = indent tetap kanvas (isi klausul menjorok 0,75cm),
   L   = titik nol paragraf (batas margin + OFF), CW = lebar kolom teks. */
function spkWERulerGeom(){
  var PX=96/25.4;                 // px per mm (96 dpi)
  var W=Math.round(210*PX), M=Math.round(25.4*PX), CM=10*PX;
  var d=document.getElementById('spk-we-doc');
  var OFF=d ? (parseFloat(getComputedStyle(d).paddingLeft)||0) : 0;
  return { PX:PX, W:W, M:M, CM:CM, OFF:OFF, L:M+OFF, CW:(W-2*M)-OFF };
}
function spkWEDrawRuler(){
  var svg=document.getElementById('spk-we-rulersvg'); if(!svg) return;
  var g=spkWERulerGeom(), W=g.W, M=g.M, CM=g.CM;
  svg.setAttribute('width', W); svg.setAttribute('height', 34);
  svg.setAttribute('viewBox','0 0 '+W+' 34');
  var h='';
  // area margin (abu) + area ketik (putih)
  h+='<rect x="0" y="10" width="'+W+'" height="12" fill="#d5dbe0"/>';
  h+='<rect x="'+M+'" y="10" width="'+(W-2*M)+'" height="12" fill="#fff" stroke="#c3cbd2" stroke-width="1"/>';
  // skala cm dihitung dari batas margin kiri (0 = awal area ketik), seperti Word
  for(var cm=-2; cm<=18; cm++){
    var x=M+cm*CM; if(x<0||x>W) continue;
    h+='<line x1="'+x.toFixed(1)+'" y1="11" x2="'+x.toFixed(1)+'" y2="21" stroke="#8e99a2" stroke-width="1"/>';
    if(cm!==0) h+='<text x="'+x.toFixed(1)+'" y="9" text-anchor="middle" font-size="9" fill="#6f7a83" font-family="Arial">'+Math.abs(cm)+'</text>';
    var hx=x+CM/2; if(hx<W) h+='<line x1="'+hx.toFixed(1)+'" y1="14" x2="'+hx.toFixed(1)+'" y2="18" stroke="#aab3ba" stroke-width="1"/>';
  }
  h+='<line x1="0" y1="22" x2="'+W+'" y2="22" stroke="#c9d0d6" stroke-width="1"/>';
  // zona indent tetap isi klausul (0,75cm) — ditandai agar jelas
  if(g.OFF>0){
    h+='<rect x="'+M+'" y="10" width="'+g.OFF.toFixed(1)+'" height="12" fill="#e8eef1" stroke="#c3cbd2" stroke-width="1"/>';
    h+='<line x1="'+g.L.toFixed(1)+'" y1="10" x2="'+g.L.toFixed(1)+'" y2="22" stroke="#1d9e75" stroke-width="1.2"/>';
  }
  // ---- Penanda indentasi (dapat diseret) ----
  h+='<g class="spk-rm" id="spk-rm-first"><title>Indentasi baris pertama (seret)</title>'+
     '<polygon points="-6,2 6,2 0,10"/><rect x="-7" y="0" width="14" height="12" fill="transparent" stroke="none"/></g>';
  h+='<g class="spk-rm" id="spk-rm-hang"><title>Indentasi menggantung (seret)</title>'+
     '<polygon points="-6,30 6,30 0,22"/><rect x="-7" y="21" width="14" height="10" fill="transparent" stroke="none"/></g>';
  h+='<g class="spk-rm" id="spk-rm-left"><title>Indentasi kiri — menggeser keduanya (seret)</title>'+
     '<rect x="-6" y="30" width="12" height="4" rx="1"/></g>';
  h+='<g class="spk-rm" id="spk-rm-right"><title>Indentasi kanan (seret)</title>'+
     '<polygon points="-6,30 6,30 0,22"/><rect x="-7" y="21" width="14" height="13" fill="transparent" stroke="none"/></g>';
  h+='<g id="spk-tablayer"></g>';   // penanda tab (L) diisi oleh spkWERulerSync
  svg.innerHTML=h;
  spkWERulerBind();
  spkWERulerSync();
}

/* ---- Selaraskan posisi penanda dengan paragraf aktif ---- */
function spkWERulerSync(){
  var svg=document.getElementById('spk-we-rulersvg'); if(!svg) return;
  var g=spkWERulerGeom(), W=g.W, L=g.L, CW=g.CW;
  var p=spkWECurrentP();
  var ml=0, ti=0, mr=0;
  if(p){
    var cs=getComputedStyle(p);
    ml=parseFloat(cs.marginLeft)||0;
    ti=parseFloat(cs.textIndent)||0;
    mr=parseFloat(cs.marginRight)||0;
  }
  var xs={ first:L+ml+ti, hang:L+ml, left:L+ml, right:L+CW-mr };
  ['first','hang','left','right'].forEach(function(k){
    var el=document.getElementById('spk-rm-'+k);
    if(el) el.setAttribute('transform','translate('+Math.max(0,Math.min(W,xs[k])).toFixed(1)+',0)');
  });
  /* Gambar penanda tab kiri (L) milik paragraf aktif */
  var lay=document.getElementById('spk-tablayer');
  if(lay){
    var tabs=(p && p.getAttribute('data-tabs')||'').split(',').map(function(s){return parseFloat(s);}).filter(function(v){return !isNaN(v);});
    var hh='';
    tabs.forEach(function(cm){
      var x=g.M + cm*g.CM;
      hh+='<g class="spk-tab" data-cm="'+cm.toFixed(2)+'"><title>Tab kiri '+cm.toFixed(2).replace('.',',')+' cm (klik untuk hapus)</title>'
        +'<path d="M'+(x-3).toFixed(1)+' 11 L'+(x-3).toFixed(1)+' 21 L'+(x+4).toFixed(1)+' 21" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
        +'<rect x="'+(x-6).toFixed(1)+'" y="10" width="14" height="12" fill="transparent"/></g>';
    });
    lay.innerHTML=hh;
  }
}

/* ---- Seret penanda ---- */
var spkRuler=null;
function spkWERulerBind(){
  ['first','hang','left','right'].forEach(function(k){
    var el=document.getElementById('spk-rm-'+k); if(!el) return;
    el.addEventListener('mousedown', function(e){ spkWERulerDown(e,k); });
  });
  var svg=document.getElementById('spk-we-rulersvg');
  if(svg && !svg.__tabBound){ svg.__tabBound=true; svg.addEventListener('mousedown', spkWERulerAddTab); }
}
/* Klik kiri di badan penggaris -> tambah tab kiri (L). L yang sudah ada bisa DIGESER
   (bukan langsung hilang); untuk menghapus, tarik L keluar ke bawah penggaris. */
var spkTabDrag=null;
function spkWERulerAddTab(e){
  if(e.button!==0) return;
  var t=e.target;
  var tabG=t.closest?t.closest('.spk-tab'):null;
  var ps=spkWESelectedPs(); if(!ps.length){ var c=spkWECurrentP(); if(c) ps=[c]; }
  if(!ps.length) return;
  if(tabG){                                    // mulai GESER L (tidak dihapus saat digeser)
    e.preventDefault(); e.stopPropagation();
    var c0=parseFloat(tabG.getAttribute('data-cm'));
    spkTabDrag={ ps:ps, cur:c0, startX:spkWERulerXY(e), moved:false };
    document.addEventListener('mousemove', spkWETabMove, true);
    document.addEventListener('mouseup', spkWETabUp, true);
    return;
  }
  if(t.closest && t.closest('.spk-rm')) return;   // penanda indent punya handler sendiri
  var g=spkWERulerGeom(), W=g.W, M=g.M, CM=g.CM;
  var x=spkWERulerXY(e);
  if(x < M || x > W-M) return;                 // hanya di dalam area ketik
  e.preventDefault();
  var cm=Math.round(((x-M)/CM)*4)/4;           // snap 0,25 cm dari margin
  spkWEModifyTabs(function(list){ if(list.indexOf(cm)<0) list.push(cm); return list; });
}
function spkWETabSet(ps, oldCm, newCm){
  ps.forEach(function(p){
    var list=(p.getAttribute('data-tabs')||'').split(',').map(function(s){return parseFloat(s);}).filter(function(v){return !isNaN(v);});
    list=list.filter(function(v){ return Math.abs(v-oldCm)>0.01; });
    if(newCm!=null && list.indexOf(newCm)<0) list.push(newCm);
    list.sort(function(a,b){return a-b;});
    if(list.length) p.setAttribute('data-tabs', list.map(function(v){return v.toFixed(2);}).join(',')); else p.removeAttribute('data-tabs');
  });
  spkWEDrawRuler();
}
function spkWETabMove(e){
  if(!spkTabDrag) return; e.preventDefault();
  var g=spkWERulerGeom(), M=g.M, CM=g.CM, W=g.W;
  var xr=spkWERulerXY(e);
  if(Math.abs(xr - spkTabDrag.startX) > 3) spkTabDrag.moved=true;
  var x=Math.max(M, Math.min(W-M, xr));
  var cm=Math.round(((x-M)/CM)*4)/4;
  if(cm!==spkTabDrag.cur){ spkWETabSet(spkTabDrag.ps, spkTabDrag.cur, cm); spkTabDrag.cur=cm; }
}
function spkWETabUp(e){
  document.removeEventListener('mousemove', spkWETabMove, true);
  document.removeEventListener('mouseup', spkWETabUp, true);
  if(spkTabDrag){
    var svg=document.getElementById('spk-we-rulersvg');
    if(svg && e && e.clientY > svg.getBoundingClientRect().bottom + 16){
      spkWETabSet(spkTabDrag.ps, spkTabDrag.cur, null);   // ditarik keluar -> hapus
    }
  }
  spkTabDrag=null;
  var doc=document.getElementById('spk-we-doc'); if(doc){ try{ doc.focus(); }catch(_){} }
}
function spkWEModifyTabs(fn){
  var ps=spkWESelectedPs(); if(!ps.length){ var c=spkWECurrentP(); if(c) ps=[c]; }
  if(!ps.length) return;
  ps.forEach(function(p){
    var list=(p.getAttribute('data-tabs')||'').split(',').map(function(s){return parseFloat(s);}).filter(function(v){return !isNaN(v);});
    list=fn(list.slice());
    list.sort(function(a,b){return a-b;});
    if(list.length) p.setAttribute('data-tabs', list.map(function(v){return v.toFixed(2);}).join(','));
    else p.removeAttribute('data-tabs');
  });
  spkWEDrawRuler();
}
/* Posisi caret dalam cm dari margin kiri (0 penggaris) */
function spkWECaretCmFromMargin(){
  var sel=window.getSelection(); if(!sel.rangeCount) return null;
  var r=sel.getRangeAt(0).cloneRange(); r.collapse(true);
  var rect=r.getBoundingClientRect(); var x=rect.left;
  if(!rect.width && !rect.height && !rect.left){
    var node=sel.anchorNode; var el=(node&&node.nodeType===3)?node.parentNode:node;
    if(el && el.getBoundingClientRect) x=el.getBoundingClientRect().left; else return null;
  }
  var svg=document.getElementById('spk-we-rulersvg'); if(!svg) return null;
  var sr=svg.getBoundingClientRect(); var g=spkWERulerGeom();
  var scale=sr.width? g.W/sr.width : 1;
  return ((x - sr.left)*scale - g.M)/g.CM;
}
/* Sisipkan "tab" selebar wcm (cm) pada posisi caret */
function spkWEInsertTabSpace(wcm){
  var sel=window.getSelection(); if(!sel.rangeCount) return;
  var r=sel.getRangeAt(0); r.deleteContents();
  var sp=document.createElement('span');
  sp.className='spk-tabspace';
  sp.setAttribute('contenteditable','false');
  sp.style.cssText='display:inline-block;width:'+Math.max(0.05,wcm).toFixed(2)+'cm';
  sp.innerHTML='​';
  r.insertNode(sp);
  var nr=document.createRange(); nr.setStartAfter(sp); nr.collapse(true);
  sel.removeAllRanges(); sel.addRange(nr);
  try{ spkWECount(); }catch(e){}
}
/* Tab: lompat ke tab stop (L) berikutnya bila ada; jika tidak, tab default 1,27 cm */
function spkWEDoTab(back){
  var sel=window.getSelection(); if(!sel.rangeCount) return;
  if(back){
    var r=sel.getRangeAt(0); var node=r.startContainer, off=r.startOffset, prev=null;
    if(node.nodeType===1) prev=node.childNodes[off-1];
    else if(node.nodeType===3 && off===0) prev=node.previousSibling;
    if(prev && prev.nodeType===1 && prev.classList && prev.classList.contains('spk-tabspace')) prev.parentNode.removeChild(prev);
    return;
  }
  var p=spkWECurrentP();
  var tabs=(p && p.getAttribute('data-tabs')||'').split(',').map(function(s){return parseFloat(s);}).filter(function(v){return !isNaN(v);}).sort(function(a,b){return a-b;});
  var caretCm=spkWECaretCmFromMargin();
  var target=null;
  if(tabs.length && caretCm!=null){ for(var i=0;i<tabs.length;i++){ if(tabs[i] > caretCm+0.02){ target=tabs[i]; break; } } }
  var wcm;
  if(target!=null) wcm=target-caretCm;
  else if(caretCm!=null) wcm=(Math.floor(caretCm/1.27)+1)*1.27 - caretCm;
  else wcm=1.27;
  spkWEInsertTabSpace(wcm);
}
function spkWERulerXY(e){
  var svg=document.getElementById('spk-we-rulersvg'); if(!svg) return 0;
  var r=svg.getBoundingClientRect();
  var scale = r.width ? (spkWERulerGeom().W / r.width) : 1;   // jaga-jaga bila ruler diskalakan
  return (e.clientX - r.left) * scale;
}
function spkWERulerDown(e,k){
  e.preventDefault(); e.stopPropagation();          // jangan hilangkan seleksi di kanvas
  var ps=spkWESelectedPs();
  if(!ps.length){ var c=spkWECurrentP(); if(c) ps=[c]; }
  if(!ps.length) return;
  var cs=getComputedStyle(ps[0]);
  spkRuler={ k:k, ps:ps,
    ml:parseFloat(cs.marginLeft)||0,
    ti:parseFloat(cs.textIndent)||0,
    mr:parseFloat(cs.marginRight)||0 };
  var el=document.getElementById('spk-rm-'+k); if(el) el.classList.add('on');
  document.addEventListener('mousemove', spkWERulerMove, true);
  document.addEventListener('mouseup', spkWERulerUp, true);
  document.body.style.cursor='default';
  spkWERulerMove(e);
}
/* Konversi nilai panjang CSS (px/cm/mm/pt) menjadi cm. */
function spkLenToCm(v){
  v=String(v||''); var n=parseFloat(v); if(isNaN(n)) return null;
  if(/cm$/.test(v)) return n;
  if(/mm$/.test(v)) return n/10;
  if(/pt$/.test(v)) return n*2.54/72;
  return n*2.54/96;   // px (atau tanpa satuan) -> cm @96dpi
}
/* Ukur lebar teks (cm) pada Arial 11pt — untuk membatasi lebar kotak nomor. */
var _spkMeasCanvas=null;
function spkTextWidthCm(txt){
  if(!_spkMeasCanvas){ _spkMeasCanvas=document.createElement('canvas'); }
  var ctx=_spkMeasCanvas.getContext('2d'); ctx.font='11pt Arial';
  return (ctx.measureText(String(txt==null?'':txt)).width) * 2.54/96;
}
/* Setel lebar kotak nomor (span.n) = jarak gantung (cm) hasil seret penggaris, tapi
   tidak boleh lebih kecil dari lebar teks nomornya sendiri (agar nomor tak menabrak
   teks). Inilah yang membuat teks bisa DIRAPATKAN/DILEBARKAN dari nomor lewat penggaris. */
function spkWEFitNumBox(p, hangCm){
  var sp=p && p.querySelector(':scope > span.n'); if(!sp) return;
  var minCm=spkTextWidthCm(sp.textContent)+0.06;
  var w=Math.max(minCm, hangCm||0);
  sp.style.width=w.toFixed(2)+'cm';
}
function spkWERulerMove(e){
  if(!spkRuler) return;
  e.preventDefault();
  var g=spkWERulerGeom(), W=g.W, M=g.L, CM=g.CM, CW=g.CW;   // M = titik nol paragraf
  var st=spkRuler, k=st.k;
  var snap=function(px){ return Math.round((px/CM)*4)/4*CM; };   // kelipatan 0,25 cm
  var cmOf=function(px){ return Math.round((px/CM)*100)/100; };
  var x=Math.max(0, Math.min(W, spkWERulerXY(e)));
  var ml=st.ml, ti=st.ti, mr=st.mr, nml=ml, nti=ti, nmr=mr, info='';

  if(k==='right'){
    nmr=Math.max(0, Math.min(CW-CM*0.5, snap(CW-(x-M))));
    info='Indentasi kanan: '+cmOf(nmr).toFixed(2).replace('.',',')+' cm';
  } else if(k==='first'){
    nti=snap(x-M-ml);
    nti=Math.max(-M-ml, Math.min(CW-mr-CM*0.25-ml, nti));
    info='Baris pertama: '+cmOf(ml+nti).toFixed(2).replace('.',',')+' cm';
  } else if(k==='hang'){
    var fixFirst=ml+ti;                       // baris pertama tetap di tempat
    nml=Math.max(0, Math.min(CW-mr-CM*0.25, snap(x-M)));
    nti=fixFirst-nml;
    info='Menggantung: '+cmOf(nml).toFixed(2).replace('.',',')+' cm';
  } else {                                    // 'left' -> geser keduanya
    nml=Math.max(0, Math.min(CW-mr-CM*0.25, snap(x-M)));
    info='Indentasi kiri: '+cmOf(nml).toFixed(2).replace('.',',')+' cm';
  }

  st.ps.forEach(function(p){
    if(k==='right'){ p.style.marginRight=cmOf(nmr).toFixed(2)+'cm'; }
    else if(k==='first'){ p.style.textIndent=cmOf(nti).toFixed(2)+'cm'; spkWEFitNumBox(p, -cmOf(nti)); }
    else if(k==='hang'){ p.style.marginLeft=cmOf(nml).toFixed(2)+'cm'; p.style.textIndent=cmOf(nti).toFixed(2)+'cm'; spkWEFitNumBox(p, -cmOf(nti)); }
    else { p.style.marginLeft=cmOf(nml).toFixed(2)+'cm'; }   // 'left' geser dua-duanya, jarak nomor->teks tetap
  });
  var tip=document.getElementById('spk-we-ruletip');
  if(tip){ tip.textContent=info; tip.classList.add('show'); }
  spkWERulerSync();
}
function spkWERulerUp(){
  document.removeEventListener('mousemove', spkWERulerMove, true);
  document.removeEventListener('mouseup', spkWERulerUp, true);
  document.body.style.cursor='';
  var tip=document.getElementById('spk-we-ruletip'); if(tip) tip.classList.remove('show');
  ['first','hang','left','right'].forEach(function(k){
    var el=document.getElementById('spk-rm-'+k); if(el) el.classList.remove('on');
  });
  spkRuler=null;
  spkWECount();
  var doc=document.getElementById('spk-we-doc'); if(doc){ try{ doc.focus(); }catch(e){} }
}

/* ================= FORMAT PAINTER =================================
   Menyeragamkan penulisan: menyalin format KARAKTER (tebal/miring/garis
   bawah/coret/warna/stabilo/ukuran & jenis huruf) SEKALIGUS format PARAGRAF
   (kelas kl0/klp/kl1/kl2, perataan, spasi baris, indent) dari teks acuan,
   lalu menempelkannya ke teks/paragraf lain.
   Pintasan: Ctrl+Alt+C = salin format, Ctrl+Alt+V = tempel format.
   Klik tombol kuas = salin format & aktifkan kuas (sekali pakai).
   Klik GANDA tombol kuas = mode terkunci (bisa dipakai berkali-kali, Esc untuk berhenti). */
var spkWEfp=null;          // format tersimpan
var spkWEfpSticky=false;   // mode terkunci (seperti klik ganda Format Painter di Word)

function spkWEToast(msg,tipe){ try{ if(typeof toast==='function') toast(msg, tipe||'ok'); }catch(e){} }

/* --- Salin format dari posisi kursor / teks terpilih --- */
function spkWEPainterCapture(){
  var doc=document.getElementById('spk-we-doc'); if(!doc) return false;
  var sel=window.getSelection(); if(!sel.rangeCount) return false;
  var node=sel.anchorNode;
  if(node && node.nodeType===3) node=node.parentElement;
  if(!node || !doc.contains(node)) return false;
  var cs=getComputedStyle(node);
  var p=spkWECurrentP();
  var pcs=p?getComputedStyle(p):null;
  spkWEfp={
    /* format karakter */
    ch:{
      fontWeight:cs.fontWeight, fontStyle:cs.fontStyle,
      textDecoration:cs.textDecorationLine, color:cs.color,
      backgroundColor:cs.backgroundColor, fontSize:cs.fontSize, fontFamily:cs.fontFamily
    },
    /* format paragraf */
    par: p ? {
      cls:(p.className.match(/\b(kl0|kl1|kl2|klp|klp1|klp2|kldesc)\b/)||[])[1]||'kl0',
      isH:p.getAttribute('data-h')==='1',
      /* pakai nilai TERHITUNG sebagai cadangan agar indent penggaris, spasi baris &
         jarak paragraf tetap tersalin walau sumbernya diatur lewat CSS (bukan inline) */
      textAlign:p.style.textAlign||(pcs?pcs.textAlign:''),
      lineHeight:p.style.lineHeight||(pcs?pcs.lineHeight:''),
      marginTop:p.style.marginTop||(pcs?pcs.marginTop:''), marginBottom:p.style.marginBottom||(pcs?pcs.marginBottom:''),
      marginLeft:p.style.marginLeft||(pcs?pcs.marginLeft:''), textIndent:p.style.textIndent||(pcs?pcs.textIndent:''),
      marginRight:p.style.marginRight||(pcs?pcs.marginRight:''),
      fontWeight:p.style.fontWeight||'', textTransform:p.style.textTransform||''
    } : null,
    /* format PENOMORAN (bila paragraf acuan adalah daftar bernomor) */
    num: (p && p.hasAttribute && p.hasAttribute('data-nfmt')) ? {
      fmt:p.getAttribute('data-nfmt'),
      sty:p.getAttribute('data-nsty')||'dec',
      idx:parseInt(p.getAttribute('data-nidx')||'0',10)||0,
      align:p.getAttribute('data-nalign')||'left'
    } : null
  };
  return true;
}

/* --- Tempel format ke teks/paragraf tujuan ---
   Urutan: (1) format karakter pada teks yang diblok, lalu (2) format paragraf,
   lalu (3) PENOMORAN (nomor melanjutkan urutan daftar sebelumnya). */
function spkWEPainterApply(){
  var doc=document.getElementById('spk-we-doc');
  if(!spkWEfp || !doc){ return false; }
  var sel=window.getSelection(); if(!sel.rangeCount) return false;

  var ps=spkWESelectedPs();     // paragraf sasaran (dicatat sebelum DOM diubah)

  /* 1) format karakter -> hanya bila ada teks yang diblok */
  if(!sel.isCollapsed){
    var c=spkWEfp.ch;
    var range=sel.getRangeAt(0);
    var span=document.createElement('span');
    span.style.fontWeight=c.fontWeight;
    span.style.fontStyle=c.fontStyle;
    span.style.color=c.color;
    span.style.fontSize=c.fontSize;
    span.style.fontFamily=c.fontFamily;
    span.style.textDecoration=(c.textDecoration && c.textDecoration!=='none') ? c.textDecoration : 'none';
    if(c.backgroundColor && c.backgroundColor!=='rgba(0, 0, 0, 0)' && c.backgroundColor!=='transparent')
      span.style.backgroundColor=c.backgroundColor;
    try{
      var frag=range.extractContents();
      /* buang format lama di dalam potongan agar benar-benar seragam,
         TAPI jangan ikut menghapus penanda nomor <span class="n"> */
      Array.prototype.forEach.call(frag.querySelectorAll('span,b,strong,i,em,u,s,strike,font'), function(el){
        if(el.classList && el.classList.contains('n')) return;
        var parent=el.parentNode; while(el.firstChild) parent.insertBefore(el.firstChild, el); parent.removeChild(el);
      });
      span.appendChild(frag);
      range.insertNode(span);
      sel.removeAllRanges();
      var r2=document.createRange(); r2.selectNodeContents(span); sel.addRange(r2);
    }catch(e){}
  }

  /* 2) PENOMORAN DULU (agar indent/spasi yang disalin tidak tertimpa oleh penomoran) */
  var num=spkWEfp.num;
  if(num){
    var lastIdx=null;
    ps.forEach(function(p){
      spkWEStripLeadingMarker(p);                 // buang nomor lama (bila ada)
      var idx;
      if(lastIdx!==null) idx=lastIdx+1;           // beberapa paragraf sekaligus -> berurutan
      else {
        var pv=spkWEPrevNumIdx(p, num.sty, num.fmt);
        idx=(pv!==null)? pv : num.idx;            // lanjutkan daftar di atasnya
      }
      spkWENumberOne(p, num.sty, num.fmt, idx, num.align, true);
      lastIdx=idx;
    });
  } else {
    /* acuan bukan daftar bernomor -> nomor pada paragraf tujuan dihapus */
    ps.forEach(function(p){
      if(p.hasAttribute && p.hasAttribute('data-nfmt')) spkWEStripLeadingMarker(p);
    });
  }

  /* 3) format paragraf (indent penggaris + spasi baris + jarak paragraf) -> ditempel
     PALING AKHIR agar MENANG atas penomoran; lebar kotak nomor disamakan dgn hanging
     yang disalin sehingga jarak nomor->teks ikut sama dengan sumber. */
  if(spkWEfp.par){
    ps.forEach(function(p){
      var f=spkWEfp.par;
      if(!num) p.className=f.cls;                  // saat menyalin nomor, kelas kl1/kl2 sudah diatur penomoran
      if(f.isH) p.setAttribute('data-h','1'); else if(!num) p.removeAttribute('data-h');
      p.style.textAlign=f.textAlign||'';
      p.style.lineHeight=f.lineHeight||'';
      p.style.marginTop=f.marginTop||''; p.style.marginBottom=f.marginBottom||'';
      p.style.marginLeft=f.marginLeft||''; p.style.textIndent=f.textIndent||'';
      p.style.marginRight=f.marginRight||'';
      p.style.fontWeight=f.fontWeight||''; p.style.textTransform=f.textTransform||'';
      var hangCm=spkLenToCm(f.textIndent);
      if(hangCm!=null) spkWEFitNumBox(p, -hangCm);
    });
  }

  if(!spkWEfpSticky) spkWEPainterMode(false);
  spkWECount(); spkWESyncBlockSelect();
  try{ doc.focus(); }catch(e){}
  return true;
}

function spkWEPainterMode(on){
  var doc=document.getElementById('spk-we-doc'); var btn=document.getElementById('spk-we-fp');
  if(doc) doc.classList.toggle('fp-active', !!on);
  if(btn){ btn.classList.toggle('active', !!on); btn.classList.toggle('sticky', !!on && spkWEfpSticky); }
  if(!on) spkWEfpSticky=false;
}

/* Tombol kuas: salin format lalu aktifkan kuas (sekali pakai) */
function spkWEPainterClick(){
  if(spkWEPainterCapture()){ spkWEfpSticky=false; spkWEPainterMode(true); spkWEToast('Format disalin — blok teks tujuan untuk menempel','ok'); }
  else spkWEToast('Letakkan kursor pada teks acuan lebih dulu','warn');
}
/* Klik ganda: mode terkunci (berkali-kali) */
function spkWEPainterSticky(){
  if(spkWEPainterCapture()){ spkWEfpSticky=true; spkWEPainterMode(true); spkWEToast('Kuas format terkunci — tekan Esc untuk berhenti','ok'); }
}
/* Ctrl+Alt+C — HANYA menyalin format. Kuas TIDAK diaktifkan, sehingga format
   baru menempel ketika Ctrl+Alt+V ditekan (bukan saat mengklik/menyorot teks). */
function spkWEPainterCopy(){
  if(spkWEPainterCapture()){
    spkWEfpSticky=false;
    spkWEPainterMode(false);                    // pastikan kuas mati
    var adaNo = spkWEfp && spkWEfp.num;
    spkWEToast('Format disalin'+(adaNo?' (termasuk penomoran)':'')+' — tekan Ctrl+Alt+V untuk menempel','ok');
  } else spkWEToast('Letakkan kursor pada teks acuan lebih dulu','warn');
}
/* Ctrl+Alt+V */
function spkWEPainterPaste(){
  if(!spkWEfp){ spkWEToast('Belum ada format yang disalin (Ctrl+Alt+C)','warn'); return; }
  spkWEPainterApply();
  spkWEToast('Format diterapkan (Ctrl+Alt+V)','ok');
}

/* ================= PUSTAKA PENOMORAN (gaya Word) =================
   Menyisipkan nomor sebagai TEKS otomatis (1. 2. 3. / a. b. c. / I. II. III. /
   i. ii. iii. / A. B. C. / 1) 2) 3) dst.) ke tiap paragraf terpilih, memakai
   kelas kl1/kl2 sesuai level. Hasilnya sama persis dengan cetak SPK. */

/* Definisi gaya: fn(index0)-> penanda; pane = 'lib' (pustaka) atau 'doc' (multi-level) */
function spkNumRoman(n){
  var map=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  var s=''; n=n||0; for(var i=0;i<map.length;i++){ while(n>=map[i][0]){ s+=map[i][1]; n-=map[i][0]; } } return s;
}
function spkNumAlpha(n){ // 1->a, 26->z, 27->aa
  var s=''; n=n; while(n>0){ var r=(n-1)%26; s=String.fromCharCode(97+r)+s; n=Math.floor((n-1)/26); } return s;
}
var SPK_NUMSTYLES={
  'dec':   { label:'1. 2. 3.',  mk:function(i){return (i+1)+'.';},                 lvl:1 },
  'decp':  { label:'1) 2) 3)',  mk:function(i){return (i+1)+')';},                 lvl:1 },
  'romU':  { label:'I. II. III.',mk:function(i){return spkNumRoman(i+1)+'.';},      lvl:1 },
  'romL':  { label:'i. ii. iii.',mk:function(i){return spkNumRoman(i+1).toLowerCase()+'.';}, lvl:2 },
  'alpU':  { label:'A. B. C.',  mk:function(i){return spkNumAlpha(i+1).toUpperCase()+'.';}, lvl:2 },
  'alpL':  { label:'a. b. c.',  mk:function(i){return spkNumAlpha(i+1)+'.';},       lvl:2 },
  'alpUp': { label:'a) b) c)',  mk:function(i){return spkNumAlpha(i+1)+')';},       lvl:2 }
};

/* Pustaka (grid atas) mengikuti gambar: baris1 1./1)  ... disusun 3 kolom */
var SPK_NUMLIB=[
  {key:'none', none:true},
  {key:'dec'}, {key:'decp'},
  {key:'romU'},{key:'alpU'},{key:'alpUp'},
  {key:'alpL'},{key:'romL'}
];

/* State format nomor kustom (dibuat via 'Tetapkan Format Nomor Baru') */
var spkNumCustom=null; // {styleKey, fmt:'{n}.', align}

/* ============ Sasaran paragraf untuk dialog ============
   Saat dialog (Format Nomor / Paragraf) dibuka, fokus pindah ke input dialog
   sehingga seleksi di kanvas HILANG. Karena itu paragraf sasaran DISIMPAN dulu
   saat dialog dibuka, lalu dipakai kembali ketika tombol OK ditekan. */
var spkWETargets=null;
function spkWESaveTargets(){
  var ps=spkWESelectedPs();
  if(!ps.length){ var c=spkWECurrentP(); if(c) ps=[c]; }
  if(!ps.length){
    var doc=document.getElementById('spk-we-doc');
    if(doc){ var all=doc.querySelectorAll('p'); if(all.length) ps=[all[all.length-1]]; }
  }
  spkWETargets=ps.slice();
  return spkWETargets;
}
function spkWETakeTargets(){
  var doc=document.getElementById('spk-we-doc');
  var ps=(spkWETargets||[]).filter(function(p){ return doc && doc.contains(p); });
  spkWETargets=null;
  if(!ps.length) ps=spkWESelectedPs();
  if(!ps.length){ var c=spkWECurrentP(); if(c) ps=[c]; }
  if(!ps.length && doc){ var all=doc.querySelectorAll(SPK_WE_BLK_SEL); if(all.length) ps=[all[all.length-1]]; }
  return ps;
}
/* Kembalikan sorotan ke paragraf yang baru diproses */
function spkWESelectPs(ps){
  var doc=document.getElementById('spk-we-doc'); if(!doc||!ps||!ps.length) return;
  try{
    doc.focus();
    var r=document.createRange();
    var last=ps[ps.length-1];
    r.setStart(ps[0], 0);
    r.setEnd(last, last.childNodes.length);
    var sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
  }catch(e){}
}

/* ============ Inti penomoran (dipakai dialog Format Nomor Baru) ============ */
/* Angka dasar untuk item ke-i sesuai gaya angka */
function spkNFBase(sty, i){
  if(sty==='romU') return spkNumRoman(i+1);
  if(sty==='romL') return spkNumRoman(i+1).toLowerCase();
  if(sty==='alpU') return spkNumAlpha(i+1).toUpperCase();
  if(sty==='alpL'||sty==='alpUp') return spkNumAlpha(i+1);
  return String(i+1);
}
/* Bentuk penanda akhir: fmt '{n}.' / '1.{n}.' -> '1.a.' dst. */
function spkNFMark(sty, fmt, i){
  return String(fmt||'{n}').replace(/\{n\}/g, spkNFBase(sty, i));
}
/* Ubah teks yang diketik pengguna (mis. "1.a.") menjadi format ber-{n} otomatis:
   bagian yang sama dengan angka item-1 dianggap ANGKA OTOMATIS, sisanya teks biasa. */
function spkNFParse(txt, sty){
  txt=String(txt==null?'':txt);
  if(txt.indexOf('{n}')>=0) return txt;
  var base=spkNFBase(sty,0);                 // '1' / 'a' / 'A' / 'i' / 'I'
  var i=txt.lastIndexOf(base);               // kemunculan terakhir = pencacah
  if(i<0) return txt;                        // tanpa angka otomatis (nomor statis)
  return txt.slice(0,i)+'{n}'+txt.slice(i+base.length);
}
/* Lebar kotak nomor (cm): HUG = lebar nomor terlebar + jeda kecil seragam (0,13 cm)
   sehingga jarak nomor->teks selalu rapat. Nomor 2 digit (8.10) otomatis sedikit lebih
   lebar → teksnya bergeser ke kanan, natural seperti Word. */
function spkNFWidth(marks){
  var maxW=0;
  marks.forEach(function(m){ var w=spkTextWidthCm(m); if(w>maxW) maxW=w; });
  return Math.max(0.4, Math.round((maxW+0.14)*100)/100);
}
function spkNFSpanStyle(w, align){
  return 'display:inline-block;box-sizing:border-box;width:'+Number(w).toFixed(2)+'cm;'+
         'text-indent:0;padding-right:.12cm;white-space:nowrap;text-align:'+(align==='right'?'right':'left')+
         ';user-select:none;-webkit-user-modify:read-only';
}
/* Penanda nomor dibuat sebagai OBJEK yang tidak dapat diedit (seperti Word):
   kursor tidak bisa masuk ke dalam nomor, tidak ada spasi yang bisa di-backspace,
   dan Backspace tepat di belakang nomor akan menghapus penomorannya. */
function spkWEMakeNumSpan(mark, w, align){
  var sp=document.createElement('span');
  sp.className='n';
  sp.setAttribute('contenteditable','false');
  sp.setAttribute('style', spkNFSpanStyle(w, align));
  sp.textContent=mark;
  return sp;
}
/* Jaga posisi kursor: tidak boleh berada DI DALAM atau SEBELUM nomor */
function spkWEGuardNumCaret(){
  var doc=document.getElementById('spk-we-doc'); if(!doc) return;
  var sel=window.getSelection();
  if(!sel.rangeCount || !sel.isCollapsed) return;
  var r=sel.getRangeAt(0);
  var node=r.startContainer;
  if(!doc.contains(node)) return;
  var el=(node.nodeType===3)? node.parentNode : node;
  var sp=null;
  /* kursor di dalam nomor? */
  while(el && el!==doc){
    if(el.tagName==='SPAN' && el.classList && el.classList.contains('n')){ sp=el; break; }
    el=el.parentNode;
  }
  /* kursor tepat di awal paragraf (sebelum nomor)? */
  if(!sp && node.nodeType===1 && node.tagName==='P' && r.startOffset===0){
    var f=node.firstChild;
    if(f && f.nodeType===1 && f.tagName==='SPAN' && f.classList.contains('n')) sp=f;
  }
  if(!sp) return;
  try{
    var r2=document.createRange(); r2.setStartAfter(sp); r2.collapse(true);
    sel.removeAllRanges(); sel.addRange(r2);
  }catch(e){}
}
/* ============ AUTOFORMAT SAAT MENGETIK (seperti Word) ============
   Ketik penanda lalu SPASI di awal paragraf -> langsung menjadi penomoran:
     1.   2.   10.        -> angka       (level 1)
     1)   2)              -> angka kurung
     2.1.  3.2.1.         -> angka majemuk (level 1)
     a.   b.   c)         -> huruf       (level 2)
     i.   ii.  IV.        -> romawi
     1.a.                 -> majemuk campuran
   Nomor berikutnya otomatis muncul saat menekan Enter. */
function spkWEParseTypedMarker(tok){
  var m=String(tok||'').match(/^((?:\d+\.)*)([0-9]+|[A-Za-z]+)([.)])$/);
  if(!m) return null;
  var prefix=m[1], core=m[2], close=m[3], sty, idx;
  if(/^\d+$/.test(core)){
    var n=parseInt(core,10); if(!(n>=1 && n<=300)) return null;
    sty=(close===')')?'decp':'dec'; idx=n-1;
  } else if(/^[a-z]$/.test(core) && core!=='i'){          // huruf tunggal -> abjad (a. b. c.)
    sty=(close===')')?'alpUp':'alpL'; idx=core.charCodeAt(0)-97;
  } else if(/^[A-Z]$/.test(core) && core!=='I'){          // huruf besar tunggal -> abjad (A. B. C.)
    sty='alpU'; idx=core.charCodeAt(0)-65;
  } else if(/^[ivxlcdm]{1,4}$/.test(core) && spkRomanToInt(core.toUpperCase())>0){
    sty='romL'; idx=spkRomanToInt(core.toUpperCase())-1;  // i. ii. iii. iv.
  } else if(/^[IVXLCDM]{1,4}$/.test(core) && spkRomanToInt(core)>0){
    sty='romU'; idx=spkRomanToInt(core)-1;                // I. II. III.
  } else return null;
  if(idx<0 || idx>300) return null;
  var lvl2 = (!prefix) && (sty==='alpL'||sty==='alpUp'||sty==='romL');
  return { sty:sty, fmt:prefix+'{n}'+close, idx:idx, lvl2:lvl2 };
}
/* Terapkan nomor pada SATU paragraf mulai dari indeks tertentu */
function spkWENumberOne(p, sty, fmt, idx, align, noCaret){
  if(!p) return;
  var mk=spkNFMark(sty, fmt, idx);
  /* Lebar kotak nomor mengikuti nomor itu sendiri (rapat, sejajar Word). Angka
     1 digit s/d 3 digit tetap di lantai 0,75 cm sehingga indentasi tetap seragam. */
  var W=spkNFWidth([mk]);
  var cls = /\bkl2\b/.test(p.className||'') ? 'kl2' : 'kl1';
  p.className=cls;
  var start=(cls==='kl2')?0.75:0;
  p.style.marginLeft=(start+W).toFixed(2)+'cm';
  p.style.textIndent='-'+W.toFixed(2)+'cm';
  var sp=spkWEMakeNumSpan(mk, W, align||'left');
  p.insertBefore(sp, p.firstChild);
  p.setAttribute('data-nfmt', fmt);
  p.setAttribute('data-nsty', sty);
  p.setAttribute('data-nidx', String(idx));
  p.setAttribute('data-nalign', (align==='right')?'right':'left');
  p.setAttribute('data-nw', W.toFixed(2));
  if(noCaret) return;
  /* kursor tepat setelah nomor */
  try{
    var r=document.createRange(); r.setStartAfter(sp); r.collapse(true);
    var sl=window.getSelection(); sl.removeAllRanges(); sl.addRange(r);
  }catch(e){}
}
/* Cari nomor lanjutan dari paragraf bernomor sebelumnya (fmt & gaya sama) */
function spkWEPrevNumIdx(p, sty, fmt){
  var el=p.previousElementSibling;
  var guard=0;
  while(el && guard++<200){
    if(el.tagName==='P'){
      if(el.getAttribute('data-nfmt')===fmt && (el.getAttribute('data-nsty')||'dec')===sty){
        return (parseInt(el.getAttribute('data-nidx')||'0',10)||0)+1;   // lanjutkan daftar yang sama
      }
      /* Paragraf bernomor LAIN (mis. sub-daftar a./b./c. di antara 2.1 dan 2.2) -> LEWATI,
         supaya penomoran tetap melanjutkan daftar induk, bukan mengulang nomor sumber. */
      if(el.hasAttribute('data-nfmt')){ el=el.previousElementSibling; continue; }
      if((el.textContent||'').trim()!=='') return null;   // teks biasa -> daftar baru
    }
    el=el.previousElementSibling;
  }
  return null;
}
/* Dipanggil saat pengguna menekan SPASI: cek apakah teks sebelum kursor
   adalah penanda nomor yang sah dan berada di AWAL paragraf. */
function spkWEAutoNumberOnSpace(){
  var doc=document.getElementById('spk-we-doc'); if(!doc) return false;
  var p=spkWECurrentP(); if(!p) return false;
  if(p.hasAttribute && p.hasAttribute('data-nfmt')) return false;   // sudah bernomor
  if(p.getAttribute('data-h')==='1') return false;                  // judul klausul
  var sel=window.getSelection();
  if(!sel.rangeCount || !sel.isCollapsed) return false;
  var pos=sel.getRangeAt(0);
  if(!doc.contains(pos.startContainer)) return false;
  var r=document.createRange();
  r.selectNodeContents(p);
  try{ r.setEnd(pos.startContainer, pos.startOffset); }catch(e){ return false; }
  var before=r.toString();
  if(!/^\s*\S{1,10}$/.test(before)) return false;                   // hanya penanda, tanpa teks lain
  var info=spkWEParseTypedMarker(before.trim());
  if(!info) return false;
  /* hapus teks penanda yang tadi diketik, lalu pasang nomor sungguhan */
  try{ r.deleteContents(); }catch(e){ return false; }
  if(info.lvl2 && !/\bkl2\b/.test(p.className||'')) p.className='kl2';
  spkWENumberOne(p, info.sty, info.fmt, info.idx, 'left');
  spkWECount(); spkWESyncBlockSelect();
  return true;
}
/* Backspace tepat setelah nomor otomatis -> batalkan penomoran (seperti Word) */
function spkWECancelNumberOnBackspace(){
  var p=spkWECurrentP(); if(!p) return false;
  if(!(p.hasAttribute && p.hasAttribute('data-nfmt'))) return false;
  var sp=p.querySelector('span.n'); if(!sp) return false;
  var sel=window.getSelection(); if(!sel.rangeCount || !sel.isCollapsed) return false;
  /* Kursor berada tepat di belakang nomor (tidak ada teks lain sebelum kursor)
     -> Backspace menghapus PENOMORAN, bukan mengedit angkanya (persis Word). */
  var r=document.createRange();
  r.selectNodeContents(p);
  try{ r.setEnd(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset); }catch(e){ return false; }
  var sebelum=r.toString().replace(/\u00a0/g,' ');
  var nomor=(sp.textContent||'');
  if(sebelum.replace(/\s+/g,'') !== nomor.replace(/\s+/g,'')) return false;
  spkWEStripLeadingMarker(p);
  p.className='kl0';
  try{
    var r2=document.createRange(); r2.setStart(p,0); r2.collapse(true);
    var sl=window.getSelection(); sl.removeAllRanges(); sl.addRange(r2);
  }catch(e){}
  spkWECount(); spkWESyncBlockSelect();
  if(typeof spkWEToast==='function') spkWEToast('Penomoran dihapus','ok');
  return true;
}

/* Terapkan penomoran ke daftar paragraf: penanda dibuat sebagai <span class="n">,
   indentasi menggantung disesuaikan lebar nomor (persis perilaku Word). */
function spkWEApplyNumbering(ps, sty, fmt, align){
  if(!ps||!ps.length) return 0;
  var marks=ps.map(function(_,i){ return spkNFMark(sty, fmt, i); });
  var W=spkNFWidth(marks);
  ps.forEach(function(p, idx){
    spkWEStripLeadingMarker(p);
    var cls = /\bkl2\b/.test(p.className||'') ? 'kl2' : 'kl1';
    p.className=cls;
    var start = (cls==='kl2') ? 0.75 : 0;           // posisi awal penanda (cm)
    p.style.marginLeft=(start+W).toFixed(2)+'cm';
    p.style.textIndent='-'+W.toFixed(2)+'cm';
    var sp=spkWEMakeNumSpan(marks[idx], W, align);
    p.setAttribute('data-nfmt', fmt);
    p.setAttribute('data-nsty', sty);
    p.setAttribute('data-nidx', String(idx));
    p.setAttribute('data-nalign', align==='right'?'right':'left');
    p.setAttribute('data-nw', W.toFixed(2));
    p.insertBefore(sp, p.firstChild);
  });
  return ps.length;
}

function spkWENumToggle(e){
  if(e){ e.preventDefault(); e.stopPropagation(); }
  var wrap=document.querySelector('.spk-we-numwrap'); if(!wrap) return;
  var pop=document.getElementById('spk-we-numpop');
  if(pop && pop.classList.contains('show')){ spkWENumClose(); return; }
  spkWENumOpen();
}
function spkWENumOpen(){
  var wrap=document.querySelector('.spk-we-numwrap'); if(!wrap) return;
  var pop=document.getElementById('spk-we-numpop');
  if(!pop){ pop=document.createElement('div'); pop.id='spk-we-numpop'; pop.className='spk-we-numpop'; wrap.appendChild(pop); }
  pop.innerHTML=spkWENumPopHtml();
  pop.classList.add('show');
  // tutup saat klik di luar
  setTimeout(function(){ document.addEventListener('mousedown', spkWENumOutside, true); },0);
}
function spkWENumOutside(e){
  var pop=document.getElementById('spk-we-numpop');
  if(pop && !pop.contains(e.target) && e.target.id!=='spk-we-numbtn' && !(e.target.closest && e.target.closest('#spk-we-numbtn'))){
    spkWENumClose();
  }
}
function spkWENumClose(){
  var pop=document.getElementById('spk-we-numpop');
  if(pop) pop.classList.remove('show');
  document.removeEventListener('mousedown', spkWENumOutside, true);
}

function spkWENumCell(key){
  if(key==='none') return '<div class="spk-we-numcell none" onmousedown="return spkWEmd(event)" onclick="spkWENumApply(\'none\')">Tidak Ada</div>';
  var st=SPK_NUMSTYLES[key]; if(!st) return '';
  var rows='';
  for(var i=0;i<3;i++){
    rows+='<div class="ln"><span class="mk">'+st.mk(i)+'</span><span class="ba"></span></div>';
  }
  return '<div class="spk-we-numcell" onmousedown="return spkWEmd(event)" onclick="spkWENumApply(\''+key+'\')" title="'+st.label+'">'+rows+'</div>';
}
function spkWENumPopHtml(){
  var lib='';
  SPK_NUMLIB.forEach(function(it){ lib+=spkWENumCell(it.key); });
  var html=
    '<div class="spk-we-numsec">Pustaka Penomoran</div>'+
    '<div class="spk-we-numgrid">'+lib+'</div>'+
    '<div class="spk-we-numdiv"></div>'+
    '<div class="spk-we-numact">'+
      '<button type="button" class="spk-we-numactbtn" onmousedown="return spkWEmd(event)" onclick="spkWENumRemove()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg> Hapus Penomoran</button>'+
      '<button type="button" class="spk-we-numactbtn" onmousedown="return spkWEmd(event)" onclick="spkWENumNewFormat()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Tetapkan Format Nomor Baru…</button>'+
    '</div>';
  return html;
}

/* Terapkan gaya ke paragraf terpilih: sisipkan nomor sebagai teks di awal,
   set kelas level (kl1 untuk level-1, kl2 untuk level-2). Nomor lama dibersihkan. */
function spkWENumApply(key){
  spkWENumClose();
  var doc=document.getElementById('spk-we-doc'); if(!doc) return;
  var ps=spkWESelectedPs();
  if(!ps.length){ var c=spkWECurrentP(); if(c) ps=[c]; }
  if(!ps.length){ spkWEToast('Letakkan kursor pada paragraf yang akan diberi nomor','warn'); doc.focus(); return; }
  if(key==='none'){ spkWENumStripPs(ps); spkWECount(); doc.focus(); return; }
  var st=SPK_NUMSTYLES[key]; if(!st) return;
  var cls = st.lvl===2 ? 'kl2' : 'kl1';
  var idx=0;
  ps.forEach(function(p){
    spkWEStripLeadingMarker(p);
    var mk=st.mk(idx);
    p.className=cls;
    p.innerHTML=mk+' '+p.innerHTML;
    idx++;
  });
  spkWECount(); spkWESyncBlockSelect();
  try{ doc.focus(); }catch(e){}
}

/* Buang penomoran -> jadikan paragraf biasa (kl0) tanpa marker */
function spkWENumRemove(){
  spkWENumClose();
  var ps=spkWESelectedPs();
  spkWENumStripPs(ps);
  spkWECount();
}
function spkWENumStripPs(ps){
  ps.forEach(function(p){ spkWEStripLeadingMarker(p); p.className='kl0'; });
}
/* Hapus marker "1." / "a)" / "I." / "12.3.1." di awal paragraf bila ada */
function spkWEStripLeadingMarker(p){
  var h=p.innerHTML;
  // buang <span class="n" ...>...</span> di awal (hasil numberFix / penomoran editor) + spasi
  h=h.replace(/^\s*<span[^>]*class="n[^"]*"[^>]*>[\s\S]*?<\/span>\s*(&nbsp;|\s)?/i,'');
  // buang marker teks polos di awal: angka(majemuk)/berkurung/huruf/romawi + . atau ) + spasi
  h=h.replace(/^\s*((?:\d+\.)+|\d+\)|[A-Za-z][.)]|[ivxlcdmIVXLCDM]{2,4}[.)])\s+/,'');
  p.innerHTML=h;
  // bersihkan jejak penomoran otomatis
  if(p.hasAttribute && p.hasAttribute('data-nfmt')){
    p.removeAttribute('data-nfmt'); p.removeAttribute('data-nsty'); p.removeAttribute('data-nidx');
    p.removeAttribute('data-nalign'); p.removeAttribute('data-nw');
    p.style.marginLeft=''; p.style.textIndent='';
  }
}

/* ---- Modal 'Atur Format Nomor Baru' (gaya Word) ----
   Kolom "Format angka" diisi LANGSUNG seperti Word: ketik mis. 1.a. — bagian yang
   sama dengan angka item pertama (mis. "a") otomatis menjadi PENCACAH, sisanya
   ("1." dan ".") menjadi teks tetap. Boleh juga memakai {n} bila ingin eksplisit. */
var spkNF={ sty:'dec', fmt:'{n}.', align:'left' };

function spkWENumNewFormat(){
  spkWESaveTargets();          // <— PENTING: simpan paragraf sasaran sebelum fokus pindah
  spkWENumClose();
  var m=document.getElementById('spk-we-nfmodal');
  if(!m){ m=document.createElement('div'); m.id='spk-we-nfmodal'; m.className='spk-we-nfmodal'; document.body.appendChild(m);
    m.addEventListener('click', function(e){ if(e.target.id==='spk-we-nfmodal') spkWENFClose(); }); }
  var opts='';
  var order=['dec','romU','romL','alpU','alpL','decp','alpUp'];
  order.forEach(function(k){ opts+='<option value="'+k+'"'+(k===spkNF.sty?' selected':'')+'>'+SPK_NUMSTYLES[k].label+'</option>'; });
  var alignOpts='<option value="left"'+(spkNF.align==='left'?' selected':'')+'>Kiri</option>'+
                '<option value="right"'+(spkNF.align==='right'?' selected':'')+'>Kanan</option>';
  m.innerHTML=
    '<div class="spk-we-nfcard">'+
      '<div class="spk-we-nfhead"><span>Atur Format Nomor Baru</span><button class="btn btn-ghost btn-sm" onclick="spkWENFClose()">✕</button></div>'+
      '<div class="spk-we-nfbody">'+
        '<label>Gaya angka</label>'+
        '<select id="spk-nf-style" onchange="spkWENFStyle()">'+opts+'</select>'+
        '<label>Format angka</label>'+
        '<input type="text" id="spk-nf-fmt" value="'+fkEsc(spkNFMark(spkNF.sty, spkNF.fmt, 0))+'" oninput="spkWENFInput()" placeholder="mis. 1.a.  atau  (a)  atau  Pasal 1.">'+
        '<div id="spk-nf-note" style="font-size:11px;color:#8a97a2;margin-top:4px"></div>'+
        '<label>Perataan</label>'+
        '<select id="spk-nf-align" onchange="spkWENFAlign()">'+alignOpts+'</select>'+
        '<div class="spk-we-nfprev"><div class="pl">Pratinjau</div><div id="spk-nf-prev"></div></div>'+
      '</div>'+
      '<div class="spk-we-nffoot"><button class="btn btn-ghost btn-sm" onclick="spkWENFClose()">Batal</button><button class="btn btn-green btn-sm" onclick="spkWENFApply()">OK</button></div>'+
    '</div>';
  m.classList.add('show');
  spkWENFPrev();
  setTimeout(function(){ var el=document.getElementById('spk-nf-fmt'); if(el){ el.focus(); el.select(); } }, 40);
}
function spkWENFClose(){ var m=document.getElementById('spk-we-nfmodal'); if(m) m.classList.remove('show'); }

/* Ganti gaya angka: format tetap, hanya bagian pencacahnya ikut berubah (spt Word) */
function spkWENFStyle(){
  spkNF.sty=(document.getElementById('spk-nf-style')||{}).value||'dec';
  var el=document.getElementById('spk-nf-fmt');
  if(el) el.value=spkNFMark(spkNF.sty, spkNF.fmt, 0);
  spkWENFPrev();
}
/* Pengguna mengetik bebas pada kolom Format angka */
function spkWENFInput(){
  var el=document.getElementById('spk-nf-fmt'); if(!el) return;
  spkNF.fmt=spkNFParse(el.value, spkNF.sty);
  spkWENFPrev();
}
function spkWENFAlign(){
  spkNF.align=(document.getElementById('spk-nf-align')||{}).value||'left';
  spkWENFPrev();
}
/* Pratinjau: bagian angka otomatis diberi warna agar jelas mana yang bertambah */
function spkWENFPrev(){
  var box=document.getElementById('spk-nf-prev'); if(!box) return;
  var parts=String(spkNF.fmt||'{n}').split('{n}');
  var auto=parts.length>1;
  var h='';
  for(var i=0;i<3;i++){
    var mk = auto
      ? fkEsc(parts[0])+'<b style="color:#0E7C86">'+fkEsc(spkNFBase(spkNF.sty,i))+'</b>'+fkEsc(parts.slice(1).join('{n}'))
      : fkEsc(parts[0]);
    var st = spkNF.align==='right' ? 'text-align:right' : 'text-align:left';
    h+='<div class="rw"><span class="mk" style="min-width:52px;'+st+'">'+mk+'</span><span class="ba"></span></div>';
  }
  box.innerHTML=h;
  var note=document.getElementById('spk-nf-note');
  if(note){
    note.innerHTML = auto
      ? 'Ketik seperti di Word, mis. <code>1.a.</code> — bagian <b style="color:#0E7C86">berwarna</b> adalah angka otomatis yang bertambah, sisanya teks tetap.'
      : '<span style="color:#c0392b">Belum ada angka otomatis</span> — sisipkan angka gaya terpilih (mis. <code>'+fkEsc(spkNFBase(spkNF.sty,0))+'</code>) atau tulis <code>{n}</code>.';
  }
}
/* OK: langsung menjadi penomoran pada paragraf yang tadi dipilih */
function spkWENFApply(){
  var el=document.getElementById('spk-nf-fmt');
  if(el) spkNF.fmt=spkNFParse(el.value, spkNF.sty);
  spkNF.align=(document.getElementById('spk-nf-align')||{}).value||'left';
  spkWENFClose();
  var doc=document.getElementById('spk-we-doc'); if(!doc) return;
  var ps=spkWETakeTargets();
  if(!ps.length){ spkWEToast('Letakkan kursor / blok paragraf yang akan diberi nomor','warn'); try{doc.focus();}catch(e){} return; }
  spkWEApplyNumbering(ps, spkNF.sty, spkNF.fmt, spkNF.align);
  spkWESelectPs(ps);
  spkWECount(); spkWESyncBlockSelect();
  spkWEToast('Penomoran diterapkan — tekan Enter untuk nomor berikutnya','ok');
}

/* ================= SPASI BARIS & PARAGRAF (gaya Word) =================
   Dropdown cepat (1,0 / 1,15 / 1,5 / 2,0 / 2,5 / 3,0), opsi dialog Paragraf
   lengkap, serta hapus spasi sebelum/sesudah paragraf. Nilai disimpan sebagai
   style inline per paragraf (line-height, margin-top, margin-bottom, text-align)
   agar tampilan editor SAMA dengan cetak. */

function spkWELHToggle(e){
  if(e){ e.preventDefault(); e.stopPropagation(); }
  var pop=document.getElementById('spk-we-lhpop');
  if(pop && pop.classList.contains('show')){ spkWELHClose(); return; }
  spkWELHOpen();
}
function spkWELHOpen(){
  var wrap=document.querySelector('.spk-we-lhwrap'); if(!wrap) return;
  var pop=document.getElementById('spk-we-lhpop');
  if(!pop){ pop=document.createElement('div'); pop.id='spk-we-lhpop'; pop.className='spk-we-lhpop'; wrap.appendChild(pop); }
  var cur=spkWELHCurrent();
  /* label = angka Word, nilai = line-height CSS yang setara */
  var vals=[[spkLHCss(1),'1,0'],[spkLHCss(1.15),'1,15'],[spkLHCss(1.5),'1,5'],[spkLHCss(2),'2,0'],[spkLHCss(2.5),'2,5'],[spkLHCss(3),'3,0']];
  var html='';
  vals.forEach(function(v){
    var on=(cur && Math.abs(parseFloat(cur)-parseFloat(v[0]))<0.001)?' on':'';
    html+='<button type="button" class="spk-we-lhitem'+on+'" onmousedown="return spkWEmd(event)" onclick="spkWELHSet(\''+v[0]+'\')"><span class="ck">&#10003;</span>'+v[1]+'</button>';
  });
  html+='<div class="spk-we-lhdiv"></div>';
  html+='<button type="button" class="spk-we-lhitem" onmousedown="return spkWEmd(event)" onclick="spkWEParagraphDialog()"><span class="ck"></span>Opsi Penspasian Baris…</button>';
  html+='<div class="spk-we-lhdiv"></div>';
  html+='<button type="button" class="spk-we-lhitem" onmousedown="return spkWEmd(event)" onclick="spkWELHSpace(\'before\')"><span class="ck"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M12 5l-4 4M12 5l4 4M4 3h16"/></svg>Hapus Spasi Sebelum Paragraf</button>';
  html+='<button type="button" class="spk-we-lhitem" onmousedown="return spkWEmd(event)" onclick="spkWELHSpace(\'after\')"><span class="ck"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M12 19l-4-4M12 19l4-4M4 21h16"/></svg>Hapus Spasi Sesudah Paragraf</button>';
  pop.innerHTML=html;
  pop.classList.add('show');
  setTimeout(function(){ document.addEventListener('mousedown', spkWELHOutside, true); },0);
}
function spkWELHOutside(e){
  var pop=document.getElementById('spk-we-lhpop');
  if(pop && !pop.contains(e.target) && !(e.target.closest && e.target.closest('#spk-we-lhbtn'))){ spkWELHClose(); }
}
function spkWELHClose(){ var pop=document.getElementById('spk-we-lhpop'); if(pop) pop.classList.remove('show'); document.removeEventListener('mousedown', spkWELHOutside, true); }

/* line-height paragraf aktif (untuk tanda centang) */
function spkWELHCurrent(){
  var p=spkWECurrentP(); if(!p) return null;
  if(p.style && p.style.lineHeight) return p.style.lineHeight;
  return spkLHCss(1.15); // default dokumen = 1,15 gaya Word
}
function spkWELHSet(v){
  spkWELHClose();
  var ps=spkWESelectedPs();
  ps.forEach(function(p){ p.style.lineHeight=v; });
  var doc=document.getElementById('spk-we-doc'); if(doc){ try{ doc.focus(); }catch(e){} }
}
function spkWELHSpace(which){
  spkWELHClose();
  var ps=spkWESelectedPs();
  ps.forEach(function(p){ if(which==='before') p.style.marginTop='0'; else p.style.marginBottom='0'; });
  var doc=document.getElementById('spk-we-doc'); if(doc){ try{ doc.focus(); }catch(e){} }
}

/* ---- Dialog Paragraf lengkap ---- */
function spkWEParagraphDialog(){
  spkWELHClose();
  spkWESaveTargets();          // simpan sasaran sebelum fokus pindah ke dialog
  var p=spkWECurrentP();
  var m=document.getElementById('spk-we-nfmodal');
  if(!m){ m=document.createElement('div'); m.id='spk-we-nfmodal'; m.className='spk-we-nfmodal'; document.body.appendChild(m);
    m.addEventListener('click', function(e){ if(e.target.id==='spk-we-nfmodal') spkWENFClose(); }); }
  // nilai awal dari paragraf aktif
  var align = (p && p.style && p.style.textAlign) || 'justify';
  var lh = (p && p.style && p.style.lineHeight) || spkLHCss(1.15);
  var mt = spkWEPtVal((p && p.style && p.style.marginTop)||'', 0);
  var mb = spkWEPtVal((p && p.style && p.style.marginBottom)||'', 6);
  var ml = spkWECmVal((p && p.style && p.style.marginLeft)||'', 0);
  var mr = spkWECmVal((p && p.style && p.style.marginRight)||'', 0);
  var alignOpts=[['left','Kiri'],['center','Tengah'],['right','Kanan'],['justify','Rata Kiri-Kanan']]
    .map(function(o){return '<option value="'+o[0]+'"'+(o[0]===align?' selected':'')+'>'+o[1]+'</option>';}).join('');
  var lhOpts=[[spkLHCss(1),'1,0'],[spkLHCss(1.15),'1,15'],[spkLHCss(1.5),'1,5'],[spkLHCss(2),'2,0'],[spkLHCss(2.5),'2,5'],[spkLHCss(3),'3,0']]
    .map(function(o){return '<option value="'+o[0]+'"'+(Math.abs(parseFloat(o[0])-parseFloat(lh))<0.001?' selected':'')+'>'+o[1]+'</option>';}).join('');
  m.innerHTML=
    '<div class="spk-we-nfcard wide">'+
      '<div class="spk-we-nfhead"><span>Paragraf</span><button class="btn btn-ghost btn-sm" onclick="spkWENFClose()">✕</button></div>'+
      '<div class="spk-we-nfbody">'+
        '<div style="font-size:11px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:#5a6773;margin-bottom:4px">Umum</div>'+
        '<label>Perataan</label><select id="spk-pg-align">'+alignOpts+'</select>'+
        '<div style="font-size:11px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:#5a6773;margin:14px 0 4px">Indentasi</div>'+
        '<div class="row2"><div><label>Kiri (cm)</label><input type="number" step="0.25" min="0" id="spk-pg-ml" value="'+ml+'"></div>'+
          '<div><label>Kanan (cm)</label><input type="number" step="0.25" min="0" id="spk-pg-mr" value="'+mr+'"></div></div>'+
        '<div style="font-size:11px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:#5a6773;margin:14px 0 4px">Spasi</div>'+
        '<div class="row2"><div><label>Sebelum (pt)</label><input type="number" step="1" min="0" id="spk-pg-mt" value="'+mt+'"></div>'+
          '<div><label>Setelah (pt)</label><input type="number" step="1" min="0" id="spk-pg-mb" value="'+mb+'"></div>'+
          '<div><label>Jarak antarbaris</label><select id="spk-pg-lh">'+lhOpts+'</select></div></div>'+
        '<div class="spk-we-nfprev spk-we-pgprev" style="margin-top:14px"><div class="pl">Pratinjau</div>'+
          '<div class="rw" style="width:70%"></div><div class="rw" style="width:60%"></div>'+
          '<div id="spk-pg-prevline" class="rc" style="width:55%;background:#111;margin:8px auto"></div>'+
          '<div class="rw" style="width:65%"></div><div class="rw" style="width:72%"></div></div>'+
      '</div>'+
      '<div class="spk-we-nffoot"><button class="btn btn-ghost btn-sm" onclick="spkWENFClose()">Batal</button><button class="btn btn-green btn-sm" onclick="spkWEParagraphApply()">OK</button></div>'+
    '</div>';
  m.classList.add('show');
  // pratinjau perataan langsung
  var as=document.getElementById('spk-pg-align');
  var upd=function(){ var pv=document.getElementById('spk-pg-prevline'); if(!pv) return; var a=as.value;
    pv.style.margin = a==='center'?'8px auto':(a==='right'?'8px 0 8px auto':'8px auto 8px 0'); };
  if(as){ as.addEventListener('change', upd); upd(); }
}
/* util: ambil angka pt dari string "18pt"/"18px" (px->pt approx /1.333) */
function spkWEPtVal(s, def){
  if(!s) return def;
  var m=String(s).match(/([0-9.]+)\s*(pt|px)?/);
  if(!m) return def;
  var n=parseFloat(m[1]); if(m[2]==='px') n=Math.round(n/1.333);
  return isNaN(n)?def:n;
}
function spkWECmVal(s, def){
  if(!s) return def;
  var m=String(s).match(/([0-9.]+)\s*cm/);
  if(m) return parseFloat(m[1]);
  var mm=String(s).match(/([0-9.]+)\s*px/);
  if(mm) return Math.round(parseFloat(mm[1])/37.8*100)/100; // px->cm approx
  return def;
}
function spkWEParagraphApply(){
  var align=(document.getElementById('spk-pg-align')||{}).value||'justify';
  var lh=(document.getElementById('spk-pg-lh')||{}).value||spkLHCss(1.15);
  var mt=parseFloat((document.getElementById('spk-pg-mt')||{}).value||'0')||0;
  var mb=parseFloat((document.getElementById('spk-pg-mb')||{}).value||'0')||0;
  var ml=parseFloat((document.getElementById('spk-pg-ml')||{}).value||'0')||0;
  var mr=parseFloat((document.getElementById('spk-pg-mr')||{}).value||'0')||0;
  spkWENFClose();
  var doc=document.getElementById('spk-we-doc'); if(!doc) return;
  var ps=spkWETakeTargets(); if(!ps.length){ doc.focus(); return; }
  ps.forEach(function(p){
    p.style.textAlign = align;
    p.style.lineHeight = lh;
    p.style.marginTop = mt+'pt';
    p.style.marginBottom = mb+'pt';
    if(ml>0) p.style.marginLeft = ml+'cm'; else p.style.marginLeft='';
    if(mr>0) p.style.marginRight = mr+'cm'; else p.style.marginRight='';
  });
  spkWESelectPs(ps);
  spkWECount();
}

/* ================= PUSTAKA POIN (bullet, gaya Word) =================
   Menyisipkan simbol poin sebagai TEKS di awal paragraf kl2, agar tampilan
   editor SAMA dengan cetak SPK. */
var SPK_BULLETS=[
  {key:'disc', ch:'\u25CF'},   /* ● */
  {key:'circ', ch:'\u25CB'},   /* ○ */
  {key:'sq',   ch:'\u25A0'},   /* ■ */
  {key:'diam', ch:'\u25C6'},   /* ◆ */
  {key:'arrow',ch:'\u27A4'},   /* ➤ */
  {key:'check',ch:'\u2713'},   /* ✓ */
  {key:'dash', ch:'\u2013'},   /* – */
  {key:'star', ch:'\u2726'}    /* ✦ */
];
var spkBulCustom=null;

function spkWEBulToggle(e){
  if(e){ e.preventDefault(); e.stopPropagation(); }
  var pop=document.getElementById('spk-we-bulpop');
  if(pop && pop.classList.contains('show')){ spkWEBulClose(); return; }
  spkWEBulOpen();
}
function spkWEBulOpen(){
  var wrap=document.querySelector('.spk-we-bulwrap'); if(!wrap) return;
  var pop=document.getElementById('spk-we-bulpop');
  if(!pop){ pop=document.createElement('div'); pop.id='spk-we-bulpop'; pop.className='spk-we-bulpop'; wrap.appendChild(pop); }
  var cells='<div class="spk-we-bulcell none" onmousedown="return spkWEmd(event)" onclick="spkWEBulApply(\'none\')">Tidak Ada</div>';
  SPK_BULLETS.forEach(function(b){
    cells+='<div class="spk-we-bulcell" onmousedown="return spkWEmd(event)" onclick="spkWEBulApply(\''+b.ch+'\')">'+b.ch+'</div>';
  });
  if(spkBulCustom){ cells+='<div class="spk-we-bulcell" onmousedown="return spkWEmd(event)" onclick="spkWEBulApply(\''+spkBulCustom+'\')">'+fkEsc(spkBulCustom)+'</div>'; }
  pop.innerHTML=
    '<div class="spk-we-numsec">Pustaka Poin</div>'+
    '<div class="spk-we-bulgrid">'+cells+'</div>'+
    '<div class="spk-we-numdiv"></div>'+
    '<div class="spk-we-numact">'+
      '<button type="button" class="spk-we-numactbtn" onmousedown="return spkWEmd(event)" onclick="spkWEBulRemove()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg> Hapus Poin</button>'+
      '<button type="button" class="spk-we-numactbtn" onmousedown="return spkWEmd(event)" onclick="spkWEBulNew()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Tetapkan Poin Baru…</button>'+
    '</div>';
  pop.classList.add('show');
  setTimeout(function(){ document.addEventListener('mousedown', spkWEBulOutside, true); },0);
}
function spkWEBulOutside(e){
  var pop=document.getElementById('spk-we-bulpop');
  if(pop && !pop.contains(e.target) && !(e.target.closest && e.target.closest('#spk-we-bulbtn'))){ spkWEBulClose(); }
}
function spkWEBulClose(){ var pop=document.getElementById('spk-we-bulpop'); if(pop) pop.classList.remove('show'); document.removeEventListener('mousedown', spkWEBulOutside, true); }

/* Terapkan poin ke paragraf terpilih: sisipkan simbol di awal (kl2). */
function spkWEBulApply(ch){
  spkWEBulClose();
  var doc=document.getElementById('spk-we-doc'); if(!doc) return;
  var ps=spkWESelectedPs(); if(!ps.length){ doc.focus(); return; }
  if(ch==='none'){ spkWEBulStripPs(ps); spkWECount(); doc.focus(); return; }
  ps.forEach(function(p){
    spkWEStripLeadingBullet(p);
    spkWEStripLeadingMarker(p);
    p.className='kl2';
    p.innerHTML=ch+'\u00A0'+p.innerHTML;   /* simbol + spasi keras */
  });
  spkWECount(); spkWESyncBlockSelect();
  try{ doc.focus(); }catch(e){}
}
function spkWEBulRemove(){
  spkWEBulClose();
  var ps=spkWESelectedPs();
  spkWEBulStripPs(ps);
  spkWECount();
}
function spkWEBulStripPs(ps){
  ps.forEach(function(p){ spkWEStripLeadingBullet(p); p.className='kl0'; });
}
/* Hapus simbol poin di awal paragraf bila ada */
function spkWEStripLeadingBullet(p){
  var chars=SPK_BULLETS.map(function(b){return b.ch;});
  if(spkBulCustom) chars.push(spkBulCustom);
  var h=p.innerHTML;
  var esc=chars.map(function(c){return c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('|');
  if(esc){ h=h.replace(new RegExp('^\\s*(?:'+esc+')\\s*(&nbsp;|\\u00A0|\\s)?'), ''); }
  p.innerHTML=h;
}

/* 'Tetapkan Poin Baru' — pilih simbol dari daftar diperluas atau ketik sendiri */
function spkWEBulNew(){
  spkWEBulClose();
  var m=document.getElementById('spk-we-nfmodal');
  if(!m){ m=document.createElement('div'); m.id='spk-we-nfmodal'; m.className='spk-we-nfmodal'; document.body.appendChild(m);
    m.addEventListener('click', function(e){ if(e.target.id==='spk-we-nfmodal') spkWENFClose(); }); }
  var palette=['\u2022','\u25E6','\u2043','\u2219','\u203B','\u2605','\u2606','\u2666','\u2665','\u25B8','\u25AA','\u2794','\u21D2','\u00BB','\u2717','\u2691'];
  var cells=palette.map(function(c){
    return '<button type="button" class="spk-we-bulcell" style="font-size:18px" onmousedown="return spkWEmd(event)" onclick="spkWEBulPick(\''+c+'\')">'+c+'</button>';
  }).join('');
  m.innerHTML=
    '<div class="spk-we-nfcard">'+
      '<div class="spk-we-nfhead"><span>Tetapkan Poin Baru</span><button class="btn btn-ghost btn-sm" onclick="spkWENFClose()">✕</button></div>'+
      '<div class="spk-we-nfbody">'+
        '<label>Pilih simbol</label>'+
        '<div class="spk-we-bulgrid" style="grid-template-columns:repeat(8,1fr)">'+cells+'</div>'+
        '<label style="margin-top:12px">Atau ketik simbol sendiri</label>'+
        '<input type="text" id="spk-bul-custom" maxlength="3" placeholder="mis. → atau •" style="width:120px;text-align:center;font-size:16px">'+
        '<div class="spk-we-nfprev"><div class="pl">Pratinjau</div>'+
          '<div style="font:13px Arial;color:#1c2733"><span id="spk-bul-prev">\u2022</span>&nbsp; Contoh butir poin</div></div>'+
      '</div>'+
      '<div class="spk-we-nffoot"><button class="btn btn-ghost btn-sm" onclick="spkWENFClose()">Batal</button><button class="btn btn-green btn-sm" onclick="spkWEBulNewApply()">OK</button></div>'+
    '</div>';
  m.classList.add('show');
  var inp=document.getElementById('spk-bul-custom');
  if(inp){ inp.addEventListener('input', function(){ var pv=document.getElementById('spk-bul-prev'); if(pv) pv.textContent=inp.value||'\u2022'; }); }
}
function spkWEBulPick(ch){
  var inp=document.getElementById('spk-bul-custom'); if(inp) inp.value=ch;
  var pv=document.getElementById('spk-bul-prev'); if(pv) pv.textContent=ch;
}
function spkWEBulNewApply(){
  var inp=document.getElementById('spk-bul-custom');
  var ch=(inp && inp.value ? inp.value : '\u2022').trim() || '\u2022';
  spkBulCustom=ch;
  spkWENFClose();
  spkWEBulApply(ch);
}




/* Shortcut global Ctrl+Alt+C hanya saat editor terbuka.
   HANYA menyalin format (kuas TIDAK diaktifkan) — seperti Word, format baru menempel
   saat Ctrl+Alt+V ditekan, BUKAN saat mengklik teks. */
document.addEventListener('keydown', function(e){
  var ov=document.getElementById('spk-we-overlay');
  if(!ov || !ov.classList.contains('show')) return;
  if(e.ctrlKey && e.altKey && (e.key==='c'||e.key==='C')){ e.preventDefault(); spkWEPainterCopy(); }
  if(e.ctrlKey && e.altKey && (e.key==='v'||e.key==='V')){ e.preventDefault(); spkWEPainterPaste(); }
});


/* ====== Formatter narasi (Latar Belakang / Permasalahan / Maksud & Tujuan) ======
   Teks polos hasil paste dirapikan jadi paragraf ber-justify dengan indentasi baris
   pertama, plus penomoran a./b./c. (kl2) dan 1./2. (kl1) dengan hanging indent seperti
   Word. Istilah asing dicetak miring, teks dalam tanda kutip dicetak tebal.
   Penomoran a./1. dibiarkan polos di sini; spkNumberFix yang menata spasi nomor->teks. */
const SPK_ITALIC_ASING=['cable trench cover','cable trench','visual inspection','perimeter security','force majeure','good corporate governance','trench'];
function spkReEsc(t){ return String(t).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
function spkItalicAsing(html){
  var terms=SPK_ITALIC_ASING.slice().sort(function(a,b){return b.length-a.length;}).map(spkReEsc);
  if(!terms.length) return html;
  var re=new RegExp('\\b('+terms.join('|')+')\\b','gi');
  return html.replace(re, function(m){ return '<i>'+m+'</i>'; });
}
function spkBoldKutipan(html){
  html=html.replace(/&quot;([\s\S]*?)&quot;/g, function(m,inner){ return '<b>&quot;'+inner+'&quot;</b>'; });
  html=html.replace(/\u201C([\s\S]*?)\u201D/g, function(m,inner){ return '<b>\u201C'+inner+'\u201D</b>'; });
  return html;
}
function spkInlineFmt(text){ return spkBoldKutipan(spkItalicAsing(fkEsc(text))); }
function spkFormatNarasi(text){
  var lines=String(text||'').replace(/\r\n?/g,'\n').split('\n');
  var level=0, out=[];
  for(var idx=0; idx<lines.length; idx++){
    var t=lines[idx].trim();
    if(t==='') continue;
    var mMulti=t.match(/^(\d+\.\d+(?:\.\d+)*\.?)\s+/);
    var mNum=t.match(/^(\d+)[.)]\s+/);
    var mAlpha=t.match(/^([A-Za-z])[.)]\s+/);
    if(mMulti){
      level=1;
      out.push('<p class="kl1">'+spkInlineFmt(t.replace(/^(\S+)\s+/, mMulti[1]+' '))+'</p>');
    } else if(mNum){
      level=1;
      out.push('<p class="kl1">'+spkInlineFmt(t.replace(/^(\d+)[.)]\s+/, mNum[1]+'. '))+'</p>');
    } else if(mAlpha){
      level=2;
      out.push('<p class="kl2">'+spkInlineFmt(t.replace(/^([A-Za-z])[.)]\s+/, mAlpha[1].toLowerCase()+'. '))+'</p>');
    } else {
      var cls = level===2?'klp2':(level===1?'klp1':'klp');
      out.push('<p class="'+cls+'">'+spkInlineFmt(t)+'</p>');
    }
  }
  return out.join('');
}
/* Rapikan teks hasil paste: normalkan spasi & gabung baris yang terpotong (mis. dari
   PDF) selama bukan awal daftar dan paragraf sebelumnya belum diakhiri tanda baca. */
function spkCleanPasteText(raw){
  var lines=String(raw||'').replace(/\r\n?/g,'\n').split('\n');
  var paras=[];
  for(var i=0;i<lines.length;i++){
    var t=lines[i].replace(/[ \t]+/g,' ').trim();
    if(t===''){ if(paras.length && paras[paras.length-1]!=='') paras.push(''); continue; }
    var isMarker=/^(\d+\.\d+(?:\.\d+)*\.?|\d+[.)]|[A-Za-z][.)])\s+/.test(t);
    if(!paras.length || paras[paras.length-1]===''){ paras.push(t); continue; }
    var prev=paras[paras.length-1];
    if(!isMarker && !/[.:;!?)\]\u201D"]$/.test(prev)) paras[paras.length-1]=prev+' '+t;
    else paras.push(t);
  }
  while(paras.length && paras[paras.length-1]==='') paras.pop();
  return paras.join('\n');
}
function spkNarasiPreviewHtml(raw){
  var ctx={};
  try{ ctx=spkBuildCtx((typeof spkState!=='undefined'&&spkState&&spkState.data)||{}); }catch(e){}
  var html;
  // HTML dari editor WYSIWYG -> pakai apa adanya (hanya merge placeholder & rapikan nomor)
  if(/<p[\s>]/i.test(String(raw||''))) html=spkNumberFix(spkMerge(raw||'', ctx));
  else html=spkNumberFix(spkFormatNarasi(spkMerge(raw||'', ctx)));
  return html || '<div class="spk-narasi-empty">Belum ada teks. Klik tombol di atas untuk membuka editor.</div>';
}
function spkNarasiRefresh(k){
  var el=document.getElementById('spk-prev-'+k);
  if(el) el.innerHTML=spkNarasiPreviewHtml((spkState&&spkState.data&&spkState.data[k])||'');
}
function spkNarasiInput(el,k){ spkSet(k, el.value); spkNarasiRefresh(k); }
function spkNarasiPaste(el,k){
  setTimeout(function(){ el.value=spkCleanPasteText(el.value); spkSet(k, el.value); spkNarasiRefresh(k); },0);
}
/* Buka editor WYSIWYG untuk field narasi. Data lama (teks polos) dikonversi otomatis
   menjadi HTML kl* saat pertama dibuka, agar bisa disunting visual. */
function spkNarasiOpenEditor(k, label){
  var cur=(spkState&&spkState.data&&spkState.data[k])||'';
  var html;
  if(/<p[\s>]/i.test(String(cur))) html=cur;               // sudah HTML
  else html=spkFormatNarasi(String(cur||''));               // konversi teks lama -> HTML kl*
  spkWEOpen({
    title:'Editor Teks — '+(label||'Narasi'),
    head:{ no:1, judul:'URAIAN PEKERJAAN' },
    html:html,
    placeholder:'Ketik atau tempel isi '+(label||'')+' di sini...',
    onSave:function(outHtml){
      spkSet(k, outHtml);
      spkNarasiRefresh(k);
      // perbarui label tombol (Isi -> Ubah) tanpa render ulang penuh
      try{ renderSpkSusun(); }catch(e){}
    }
  });
}
/* =========================================================================
   PENOMORAN KLAUSUL DINAMIS
   Bila sebuah klausul berpindah posisi (mis. klausul 11 menjadi klausul 10),
   maka:
     - nomor butir di dalamnya   : 11.1  -> 10.1   (termasuk 11.1.1 -> 10.1.1)
     - rujukan di dalam kalimat  : "pada butir 11.1" -> "pada butir 10.1"
   Nomor klausul lama dideteksi dari awalan butir yang paling banyak dipakai di
   dalam isi klausul, lalu seluruh kemunculannya diganti dengan nomor barunya.
   Angka lain (mis. Rp11.000.000 atau tanggal) tidak ikut berubah.
   ========================================================================= */
function spkRenumberKlausul(html, newNo){
  var src=String(html||'');
  if(!src || !newNo) return src;
  var box=document.createElement('div'); box.innerHTML=src;
  /* 1) deteksi nomor klausul lama dari butir "X.Y" pada awal paragraf */
  var counts={}, blocks=box.querySelectorAll('p,div'), i, t, m;
  for(i=0;i<blocks.length;i++){
    t=String(blocks[i].textContent||'').replace(/\s+/g,' ').trim();
    m=/^(\d{1,2})\.(\d{1,2})(?!\d)/.exec(t);
    if(m) counts[m[1]]=(counts[m[1]]||0)+1;
  }
  var oldNo='', best=0;
  for(var k in counts){ if(counts[k]>best){ best=counts[k]; oldNo=k; } }
  if(!oldNo || String(oldNo)===String(newNo)) return src;
  /* 2) ganti "oldNo." -> "newNo." hanya pada pola nomor butir/rujukan butir */
  var re=new RegExp('(^|[^0-9.,A-Za-z])'+oldNo+'\\.(\\d{1,2})(?!\\d)','g');
  var w=document.createTreeWalker(box, NodeFilter.SHOW_TEXT, null, false), n, v;
  while((n=w.nextNode())){
    v=n.nodeValue;
    if(v && v.indexOf(oldNo+'.')>=0) n.nodeValue=v.replace(re, '$1'+newNo+'.$2');
  }
  return box.innerHTML;
}
/* =========================================================================
   ISIAN CONTOH (TRANSPARAN) + PENOMORAN BUTIR OTOMATIS  — BERLAKU SEMUA KLAUSUL
   Aturan:
     1) Blok CONTOH tidak pernah ikut tercetak. Yang dianggap contoh:
        - paragraf bertanda kelas .spk-ph (tombol "Contoh" pada editor);
        - teks panduan berpola "(Isi .....)" / "(Diisi .....)";
        - baris titik-titik saja;
        - blok yang menjadi KOSONG setelah mail-merge ({{kode}} tak terisi).
     2) Sebuah BUTIR (mis. "1.1. Latar Belakang") yang seluruh isinya masih
        contoh (datanya belum diisi) DIHAPUS beserta judulnya.
     3) Butir yang tersisa DINOMORI ULANG otomatis: 1.1, 1.2, 1.3 ... (termasuk
        sub-butir 1.1.1, 1.1.2 ...). Contoh: bila Latar Belakang, Permasalahan,
        dan Maksud & Tujuan tidak diisi, maka "1.4. Pedoman Pelaksanaan
        Pekerjaan" otomatis menjadi "1.1. Pedoman Pelaksanaan Pekerjaan".
     4) Bila judul butir cocok dengan field narasi (Latar Belakang /
        Permasalahan / Maksud dan Tujuan) dan datanya DIISI pada Data Mail
        Merge, isian tersebut otomatis menggantikan teks contohnya.
   ========================================================================= */
const SPK_NARASI_MAP=[
  {key:'latar_belakang', re:/latar\s*belakang/i},
  {key:'permasalahan',   re:/permasalahan|pemasalahan/i},
  {key:'maksud_tujuan',  re:/maksud/i}
];
const SPK_TOK_BUTIR=/^\s*(\d{1,2})\.(\d{1,2})\.?(?![\d.])/;        /* 1.1   */
const SPK_TOK_SUB  =/^\s*(\d{1,2})\.(\d{1,2})\.(\d{1,2})\.?(?!\d)/;/* 1.1.1 */

function spkBlkText(el){
  return String((el&&el.textContent)||'').replace(/\u00A0/g,' ').replace(/\s+/g,' ').trim();
}
/* Apakah blok ini sekadar CONTOH / kosong (tidak boleh tercetak)? */
function spkIsPhBlock(el){
  if(!el) return true;
  if(el.classList && el.classList.contains('spk-ph')) return true;
  if(el.__kvv) return false;                                    // nilai baris "Label : nilai" — jangan diusik
  var t=spkBlkText(el);
  if(t===':') return false;                                     // pemisah baris "Label : nilai"
  if(t==='') return true;                                       // kosong / merge kosong
  if(/^[.\u2026\u00B7\u2022\-\u2013\u2014_\s]+$/.test(t)) return true;   // hanya titik-titik
  if(/^[(\[]?\s*(isi|diisi|di\s*isi|contoh)\b/i.test(t) && /[.\u2026)\]]\s*$/.test(t)) return true;
  return false;
}
/* Nilai field narasi -> HTML paragraf dokumen (kl*) */
function spkNarasiHtml(v){
  var s=String(v==null?'':v);
  if(!s.replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').trim()) return '';
  return /<p[\s>]/i.test(s) ? s : spkFormatNarasi(s);
}
/* Tulis ulang nomor di awal paragraf (mis. "1.4." -> "1.1.") */
/* =========================================================================
   RUJUKAN SILANG ANTAR-BUTIR DALAM SATU PASAL
   Nomor butir disusun ulang otomatis (butir contoh dibuang di spkPruneKlausul,
   nomor majemuk disusun dari silsilah di spkPkSubNumberFix). Yang TIDAK ikut
   berubah dulu adalah angka yang DITULIS DI DALAM KALIMAT, mis. "sebagaimana
   diatur pada butir 2.8 Pasal ini" — begitu butir 2.5 dihapus, butir 2.8 menjadi
   2.7 sedangkan kalimatnya tetap menyebut 2.8 (menunjuk butir yang salah).
   Di sini rujukan itu ikut ditulis ulang memakai peta lama->baru yang dibuat
   oleh fungsi yang menomori ulang. Seluruh penggantian dilakukan SEKALI JALAN
   dari peta, jadi pergeseran berantai (2.8->2.7 sementara 2.7->2.6) tidak saling
   menimpa.
   Cakupan sengaja DIBATASI pada rujukan di dalam Pasal yang sama (sesuai
   pemakaian nyata) dan HANYA angka yang didahului kata rujukan (butir / angka /
   ayat / poin / sub-butir). Pembatasan kata rujukan ini penting supaya angka
   lain di dalam kalimat — nilai rupiah, tanggal, nomor surat — tidak pernah
   tersentuh. Rangkaian rujukan ikut tertangani: "butir 2.8, 2.9 dan 2.10".
   Rujukan ke butir yang DIHAPUS tidak diubah (tidak ada nomor penggantinya);
   angkanya dibiarkan apa adanya agar terlihat saat diperiksa.
   ========================================================================= */
var SPK_REF_KATA = '(?:butir|sub-?butir|angka|ayat|poin|point)';
/* Token nomor majemuk di AWAL sebuah blok, tanpa titik penutup: "2.8." -> "2.8" */
function spkTokOf(el){
  var t=String((el&&el.textContent)||'').replace(/[\s\u00A0]+/g,' ').trim();
  var m=/^(\d{1,2}(?:\.\d{1,2})+)\.?/.exec(t);
  return m ? m[1] : '';
}
function spkRefRemap(root, map){
  if(!root || !map) return false;
  var ada=false, kk; for(kk in map){ ada=true; break; }
  if(!ada) return false;
  var NUM='\\d{1,2}(?:\\.\\d{1,2})+\\.?';
  var SAMB='(?:,|dan\\/atau|dan|serta|s\\.?d\\.?|sampai dengan)';
  var re=new RegExp('('+SPK_REF_KATA+')([\\s\\u00A0]+)((?:'+NUM+')(?:[\\s\\u00A0]*'+SAMB+'[\\s\\u00A0]*'+NUM+')*)','gi');
  var reNum=new RegExp(NUM,'g');
  var w=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false), n, nodes=[];
  while((n=w.nextNode())) nodes.push(n);
  var ubah=false;
  nodes.forEach(function(nd){
    /* kotak nomor butir (<span class="n">) bukan rujukan — sudah ditangani sendiri */
    var q=nd.parentNode;
    while(q && q!==root){ if(q.classList && q.classList.contains('n')) return; q=q.parentNode; }
    var v=nd.nodeValue;
    if(!v || v.indexOf('.')<0) return;
    var out=v.replace(re, function(m, kata, sp, daftar){
      return kata+sp+daftar.replace(reNum, function(t){
        var titik=/\.$/.test(t), key=t.replace(/\.$/,'');
        return map[key] ? (map[key]+(titik?'.':'')) : t;
      });
    });
    if(out!==v){ nd.nodeValue=out; ubah=true; }
  });
  return ubah;
}
function spkSetTok(el, tok){
  var w=document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false), n, v;
  while((n=w.nextNode())){
    v=n.nodeValue;
    if(!v || !v.replace(/[\s\u00A0]/g,'')) continue;
    n.nodeValue = v.replace(/^([\s\u00A0]*)(\d{1,2}(?:\.\d{1,2})+\.?)([\s\u00A0]*)/,
      function(m,a,b,c){ return a+tok+(c && c.length ? c : ' '); });
    return;
  }
}
function spkPruneKlausul(html, klNo, data){
  var src=String(html||''); if(!src.trim()) return src;
  var box=document.createElement('div'); box.innerHTML=src;
  var blocks=Array.prototype.slice.call(box.children);
  if(!blocks.length) return src;

  /* Baris "Label : nilai" (3 paragraf berurutan) dipertahankan utuh, walau
     nilainya kosong — supaya perataan gaya Word (spkTidyKeyValue) tetap jalan. */
  blocks.forEach(function(el,idx){
    if(spkBlkText(el)===':' && blocks[idx+1]) blocks[idx+1].__kvv=true;
  });

  /* --- 1) Bangun struktur: [pre] + butir{head, kids:[blok | sub{head,body}]} --- */
  var pre=[], items=[], cur=null, sub=null;
  blocks.forEach(function(el){
    var t=spkBlkText(el);
    if(SPK_TOK_SUB.test(t)){
      if(cur){ sub={head:el, body:[]}; cur.kids.push({t:'sub', s:sub}); return; }
    } else if(SPK_TOK_BUTIR.test(t)){
      cur={head:el, kids:[]}; items.push(cur); sub=null; return;
    }
    if(!cur){ pre.push(el); return; }
    if(sub) sub.body.push(el); else cur.kids.push({t:'blk', el:el});
  });
  /* Klausul tanpa penomoran butir: cukup buang blok contohnya saja.
     (Bila seluruhnya contoh -> biarkan apa adanya: klausul memang belum diisi.) */
  if(!items.length){
    var keep=blocks.filter(function(e){ return !spkIsPhBlock(e); });
    if(!keep.length) return src;
    var o0=document.createElement('div');
    keep.forEach(function(e){ o0.appendChild(e); });
    return o0.innerHTML;
  }

  /* --- 2) Isi otomatis dari field narasi (bila judul butir cocok & data diisi) --- */
  items.forEach(function(it){
    var title=spkBlkText(it.head).replace(SPK_TOK_BUTIR,'').replace(/^[.\s:)\-]+/,'').trim();
    var key='';
    SPK_NARASI_MAP.forEach(function(m){ if(!key && m.re.test(title)) key=m.key; });
    var val = key ? spkNarasiHtml(data && data[key]) : '';
    if(!val) return;
    var holder=document.createElement('div'); holder.innerHTML=val;
    var news=Array.prototype.slice.call(holder.children).map(function(p){
      if(p.tagName!=='P'){ var np=document.createElement('p'); np.className='kl0'; np.innerHTML=p.innerHTML; return np; }
      if(!/\b(kl0|kl1|kl2|klp|klp1|klp2|kldesc)\b/.test(p.className||'')) p.className=((p.className||'')+' kl0').trim();
      p.classList.remove('spk-ph');
      return p;
    });
    var kids=[], placed=false;
    it.kids.forEach(function(k){
      if(k.t==='blk' && spkIsPhBlock(k.el)){
        if(!placed){ news.forEach(function(p){ kids.push({t:'blk', el:p}); }); placed=true; }
        return;                                     // teks contoh dibuang
      }
      kids.push(k);
    });
    if(!placed) news.forEach(function(p){ kids.push({t:'blk', el:p}); });
    it.kids=kids;
  });

  /* --- 3) Tentukan butir / sub-butir yang tidak terisi (dibuang) ---
     Sebuah butir dianggap "kosong" (hanya berisi teks contoh) dan DIBUANG bila
     tidak memiliki konten nyata. Deteksi diperkuat agar mencakup tiga bentuk
     penulisan contoh yang sebelumnya lolos:
       (a) tiap paragraf isi memang blok contoh   -> "(Isi ...)" berdiri sendiri;
       (b) contoh MENYATU pada paragraf JUDUL      -> "1.3. Maksud dan Tujuan (Isi ...)"
           dalam satu paragraf (tanpa paragraf isi terpisah);
       (c) contoh TERPECAH ke beberapa paragraf    -> gabungan isi tetap membentuk
           satu kalimat contoh "(Isi ....)".
     Butir yang benar-benar diisi (mis. narasi ditulis langsung di klausul) tetap
     dipertahankan. */
  var PH_START=/^[(\[]?\s*(isi|diisi|di\s*isi|contoh)\b/i;
  var PH_END=/[.…)\]]\s*$/;
  var PH_INLINE=/[(\[]\s*(isi|diisi|di\s*isi|contoh)\b[\s\S]*?[.…)\]]/i;
  items.forEach(function(it){
    it.kids.forEach(function(k){
      if(k.t!=='sub') return;
      var isi=k.s.body.filter(function(e){ return !spkIsPhBlock(e); });
      k.s.drop = (k.s.body.length>0 && isi.length===0);
      k.s.body = isi;
    });
    var blkKids=it.kids.filter(function(k){ return k.t==='blk'; });
    var subKept=it.kids.filter(function(k){ return k.t==='sub' && !k.s.drop; });
    var joined=blkKids.map(function(k){ return spkBlkText(k.el); }).join(' ').replace(/\s+/g,' ').trim();
    var everyBlkPh = blkKids.length>0 && blkKids.every(function(k){ return spkIsPhBlock(k.el); });
    var joinedPh   = joined!=='' && PH_START.test(joined) && PH_END.test(joined);            // (c)
    var headTx=spkBlkText(it.head).replace(SPK_TOK_SUB,'').replace(SPK_TOK_BUTIR,'');
    var headInlinePh = PH_INLINE.test(headTx);                                               // (b)
    var hasReal = subKept.length>0 || (blkKids.some(function(k){ return !spkIsPhBlock(k.el); }) && !joinedPh);
    var evidence = everyBlkPh || joinedPh || headInlinePh;                                    // (a)/(b)/(c)
    it.drop = !hasReal && evidence;
    // Sisakan hanya konten nyata (buang paragraf contoh & sub-butir kosong)
    it.kids = it.kids.filter(function(k){
      return (k.t==='sub') ? !k.s.drop : !spkIsPhBlock(k.el);
    });
    // Bila contoh menyatu di judul & butir dibuang, seluruh butir (judul+contoh) hilang.
  });

  /* --- 4) Susun ulang & nomori ulang otomatis --- */
  var out=document.createElement('div'), i=0, refMap={};
  pre.forEach(function(e){ if(!spkIsPhBlock(e)) out.appendChild(e); });
  items.forEach(function(it){
    if(it.drop) return;
    i++;
    var tokLama=spkTokOf(it.head), tokBaru=klNo+'.'+i;
    if(tokLama && tokLama!==tokBaru) refMap[tokLama]=tokBaru;
    spkSetTok(it.head, klNo+'.'+i+'.');
    out.appendChild(it.head);
    var j=0;
    it.kids.forEach(function(k){
      if(k.t==='blk'){ out.appendChild(k.el); return; }
      j++;
      var sLama=spkTokOf(k.s.head), sBaru=klNo+'.'+i+'.'+j;
      if(sLama && sLama!==sBaru) refMap[sLama]=sBaru;
      spkSetTok(k.s.head, klNo+'.'+i+'.'+j+'.');
      out.appendChild(k.s.head);
      k.s.body.forEach(function(e){ out.appendChild(e); });
    });
  });
  /* rujukan di dalam kalimat mengikuti penomoran baru */
  try{ spkRefRemap(out, refMap); }catch(e){}
  return out.innerHTML;
}
