/* =========================================================
   app.js — Dialog "Unggah Klausul Kontrak"
   Perubahan utama: tombol Simpan langsung menyimpan lalu
   menutup dialog. Tidak ada dialog konfirmasi kedua.
   ========================================================= */

const state = {
  open: false,
  layout: "Surat Perintah Kerja",
  fileName: null,
  saving: false, // pengaman agar tidak tersimpan dua kali
};

/* ---------- Referensi elemen ---------- */
const overlay = document.getElementById("overlay");
const dialog = document.getElementById("dialog");
const btnBuka = document.getElementById("btn-buka");
const btnTutup = document.getElementById("btn-tutup");
const btnBatal = document.getElementById("btn-batal");
const btnSimpan = document.getElementById("btn-simpan");
const btnTemplate = document.getElementById("btn-template");
const inputBerkas = document.getElementById("input-berkas");
const pilihanTataLetak = document.getElementById("tata-letak");
const barisTerunggah = document.getElementById("baris-terunggah");
const namaBerkas = document.getElementById("nama-berkas");
const wadahToast = document.getElementById("toast");

let pemicuTerakhir = null; // untuk mengembalikan fokus setelah dialog ditutup

/* ---------- Buka / tutup dialog ---------- */
function bukaDialog() {
  pemicuTerakhir = document.activeElement;
  state.open = true;
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add("tampil"));
  document.body.style.overflow = "hidden";
  btnTemplate.focus();
}

function tutupDialog() {
  state.open = false;
  overlay.classList.remove("tampil");
  document.body.style.overflow = "";
  setTimeout(() => {
    overlay.hidden = true;
  }, 160);
  if (pemicuTerakhir) pemicuTerakhir.focus();
}

/* =========================================================
   INI BAGIAN YANG BERUBAH
   Sebelumnya di sini ada confirm() / dialog konfirmasi kedua
   yang membuat pop-up menumpuk. Sekarang: simpan → tutup →
   toast. Konfirmasi menimpa berkas ditangani inline di dalam
   dialog, bukan dengan membuka jendela baru.
   ========================================================= */
async function simpan() {
  if (state.saving) return; // cegah klik ganda
  if (!state.fileName) {
    tampilkanGalat("Pilih berkas .docx terlebih dahulu.");
    return;
  }

  state.saving = true;
  btnSimpan.disabled = true;
  btnSimpan.textContent = "Menyimpan…";

  try {
    await kirimKeServer({
      layout: state.layout,
      fileName: state.fileName,
    });

    tutupDialog(); // tutup dulu, jangan tumpuk jendela
    tampilkanToast("Klausul tersimpan"); // notifikasi ringan, bukan modal
    resetForm();
  } catch (err) {
    // Kegagalan pun tidak membuka pop-up baru — pesan tampil di dalam dialog
    tampilkanGalat("Gagal menyimpan. Periksa koneksi lalu coba lagi.");
    console.error(err);
  } finally {
    state.saving = false;
    btnSimpan.disabled = false;
    btnSimpan.textContent = "Simpan";
  }
}

/* Ganti isi fungsi ini dengan panggilan API milikmu */
function kirimKeServer(payload) {
  return new Promise((resolve) => setTimeout(() => resolve(payload), 600));
}

/* ---------- Umpan balik ---------- */
function tampilkanToast(pesan) {
  wadahToast.textContent = pesan;
  wadahToast.classList.add("tampil");
  clearTimeout(wadahToast._timer);
  wadahToast._timer = setTimeout(
    () => wadahToast.classList.remove("tampil"),
    2600
  );
}

function tampilkanGalat(pesan) {
  let el = document.getElementById("galat");
  el.textContent = pesan;
  el.hidden = false;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => (el.hidden = true), 4000);
}

function resetForm() {
  state.fileName = null;
  inputBerkas.value = "";
  barisTerunggah.hidden = true;
}

/* ---------- Kejadian ---------- */
btnBuka.addEventListener("click", bukaDialog);
btnTutup.addEventListener("click", tutupDialog);
btnBatal.addEventListener("click", tutupDialog);

// type="button" pada markup + preventDefault di sini mencegah form
// ter-submit dua kali (penyebab umum pop-up muncul dobel)
btnSimpan.addEventListener("click", (e) => {
  e.preventDefault();
  simpan();
});

btnTemplate.addEventListener("click", () => inputBerkas.click());

inputBerkas.addEventListener("change", (e) => {
  const berkas = e.target.files[0];
  if (!berkas) return;
  state.fileName = berkas.name;
  namaBerkas.textContent = berkas.name;
  barisTerunggah.hidden = false;
});

pilihanTataLetak.addEventListener("change", (e) => {
  state.layout = e.target.value;
});

// Tutup dengan Esc, dan klik di luar kartu
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state.open && !state.saving) tutupDialog();
});
overlay.addEventListener("mousedown", (e) => {
  if (e.target === overlay && !state.saving) tutupDialog();
});
