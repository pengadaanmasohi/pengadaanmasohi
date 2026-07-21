/* ===== 06-tender.js (bagian 6/15, baris 4383-5499 dari app.js asli) =====
   Modul Tender (148 field) + multi-penyedia.
   WAJIB dimuat berurutan 01 s.d. 15 — jangan ubah urutannya. ===== */
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
      toast(spkImporMsg(toAdd.length, dupCount), spkImporTone(toAdd.length, dupCount), TOAST_MS_UPLOAD);
      // Data berhasil ditambahkan lewat template → langsung tampilkan loading &
      // kembali ke Daftar Monitoring Tender.
      if(toAdd.length){ ev.target.value=''; showView('list-tender','Memuat daftar'); return; }
    }catch(err){ console.error(err); toast('Gagal membaca file Excel','warn', TOAST_MS_UPLOAD); }
    ev.target.value='';
  };
  reader.readAsArrayBuffer(file);
}

