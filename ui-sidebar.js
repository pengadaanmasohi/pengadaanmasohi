/* ============================================================
   ui-sidebar.js — pelengkap tata letak SIDEBAR
   Dimuat PALING AKHIR (sesudah app-lain.js).

   Isi:
     1. Ciutkan/lebarkan sidebar (+ ingat pilihan terakhir)
     2. Tooltip nama menu saat sidebar menciut
     3. Jejak halaman (breadcrumb) di bilah atas
     4. Tombol LAYAR PENUH pada modal pratinjau file

   Tidak ada satu pun fungsi lama yang ditimpa, kecuali
   closePnPreview yang DIBUNGKUS (fungsi aslinya tetap dipanggil).
   ============================================================ */
(function(){
'use strict';

/* ---------- 1. Sidebar melebar mengikuti kursor ----------
   Keadaan diam = rail ikon. Kursor menyentuh sidebar -> melebar penuh
   (melayang di atas isi halaman, konten tidak bergeser). Kursor pergi ->
   menciut sendiri setelah jeda singkat supaya tidak berkedip saat kursor
   sekadar melintas. Tidak ada lagi tombol ciutkan manual. */
var HOVER_OUT_MS=260;
function isSmall(){ return window.matchMedia('(max-width:1024px)').matches; }
function noHover(){ return window.matchMedia('(hover:none)').matches; }

/* Tombol ☰ di bilah atas hanya dipakai layar kecil (laci geser). */
window.toggleSidebar=function(){
  if(typeof toggleMobileNav==='function') toggleMobileNav();
};

function initHoverSidebar(){
  var el=document.getElementById('sidebar-shell'); if(!el) return;
  var t=null;
  function open(){ if(isSmall()||noHover()) return; clearTimeout(t); el.classList.add('is-open'); }
  function close(now){
    clearTimeout(t);
    t=setTimeout(function(){
      el.classList.remove('is-open');
      /* grup yang terlanjur terbuka ikut ditutup supaya rapi saat menciut */
      el.querySelectorAll('.topnav-group.open').forEach(function(g){ g.classList.remove('open'); });
      el.querySelectorAll('.topnav-sub.open').forEach(function(s){ s.classList.remove('open'); });
      if(typeof openActiveBranch==='function') openActiveBranch();
    }, now?0:HOVER_OUT_MS);
  }
  el.addEventListener('mouseenter',open);
  el.addEventListener('mouseleave',function(){ close(false); });
  /* Navigasi papan ketik (Tab) juga harus bisa membukanya */
  el.addEventListener('focusin',open);
  el.addEventListener('focusout',function(e){
    if(!el.contains(e.relatedTarget)) close(false);
  });
  window.addEventListener('resize',function(){ if(isSmall()) el.classList.remove('is-open'); });
}

/* ---------- 2. Tooltip nama menu (dipakai CSS lewat data-tip) ---------- */
function labelOf(btn){
  if(!btn) return '';
  var sp=btn.querySelector('.sub-label');
  if(sp) return sp.textContent.trim();
  var t='';
  for(var i=0;i<btn.childNodes.length;i++){
    var n=btn.childNodes[i];
    if(n.nodeType===3) t+=n.textContent;
  }
  return t.replace(/\s+/g,' ').trim();
}
/* Judul menu tetap dipasang sebagai title -> berguna saat rail masih menciut
   dan pengguna berhenti sejenak di atas sebuah ikon. */
function setTips(){
  document.querySelectorAll('#topnav .topnav-link, #topnav .topnav-trigger').forEach(function(b){
    var t=labelOf(b); if(t && !b.title) b.title=t;
  });
}

/* ---------- 3. Jejak halaman di bilah atas ---------- */
/* Nama halaman yang ditampilkan di bilah atas bila judul di dalam halaman
   kurang cocok dijadikan jejak (mis. tiga daftar dokumen yang dibedakan lewat
   tab SPBJ / Pengadaan Langsung / Tender, bukan lewat menu). */
var VIEW_TITLE={
  'view-list'       :'Dokumen Kontrak Rinci',
  'view-list-pl'    :'Dokumen Pengadaan Langsung',
  'view-list-tender':'Dokumen Tender'
};
/* Judul halaman tanpa angka lencana jumlah data ("Daftar Kontrak Rinci 2"
   -> "Daftar Kontrak Rinci"). */
function headingText(h){
  if(!h) return '';
  var c=h.cloneNode(true);
  c.querySelectorAll('.count-badge').forEach(function(b){ b.remove(); });
  return c.textContent.replace(/\s+/g,' ').trim();
}

function updateCrumb(){
  var now=document.getElementById('crumb-now'), path=document.getElementById('crumb-path');
  if(!now) return;
  var act=document.querySelector('#topnav .topnav-item.active') ||
          document.querySelector('#topnav .topnav-link.active');
  var label='', trail=[];
  if(act){
    label=labelOf(act);
    var node=act.parentElement;
    while(node && node.id!=='topnav'){
      if(node.classList){
        if(node.classList.contains('topnav-sub')){
          var st=node.querySelector(':scope > .topnav-subtrigger');
          if(st) trail.unshift(labelOf(st));
        }
        if(node.classList.contains('topnav-group')){
          var gt=node.querySelector(':scope > .topnav-trigger');
          if(gt) trail.unshift(labelOf(gt));
        }
      }
      node=node.parentElement;
    }
  }
  /* Nama khusus per halaman menang atas nama menu */
  var vw=document.querySelector('.view.active');
  if(vw && VIEW_TITLE[vw.id]) label=VIEW_TITLE[vw.id];
  if(!label) label=headingText(document.querySelector('.view.active h2'))||'Dashboard';
  now.textContent=label||'Dashboard';
  if(path) path.textContent=trail.join(' › ');
  document.title=(label?label+' · ':'')+'Monitoring Pengadaan Masohi';
}
/* Menu aktif diubah dari banyak tempat di app.js (showView, *MarkActive, dst.).
   Daripada menambal semuanya, cukup pantau perubahan kelas di dalam #topnav. */
function watchActive(){
  var nav=document.getElementById('topnav'); if(!nav) return;
  var t=null;
  new MutationObserver(function(){
    clearTimeout(t); t=setTimeout(updateCrumb,60);
  }).observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
}

/* ---------- 3b. Label bagian ikut tersembunyi bila isinya kosong ----------
   applyRole() menyembunyikan menu khusus admin. Bila seluruh isi satu bagian
   tersembunyi (mis. akun Tamu), labelnya ikut disembunyikan agar tak menggantung. */
function syncSections(){
  var nav=document.getElementById('topnav'); if(!nav) return;
  var kids=Array.prototype.slice.call(nav.children);
  kids.forEach(function(el,i){
    if(!el.classList || !el.classList.contains('side-sec')) return;
    var visible=false;
    for(var k=i+1;k<kids.length;k++){
      var n=kids[k];
      if(n.classList && n.classList.contains('side-sec')) break;
      if(getComputedStyle(n).display!=='none'){ visible=true; break; }
    }
    el.style.display = visible ? '' : 'none';
  });
}
/* applyRole() menyembunyikan grup menu SEBELUM menyetel tombol Ganti Kata Sandi
   & Bersihkan Daftar Kontrak, jadi grup "Pengaturan" bisa tertinggal tampil
   walau seluruh isinya sudah disembunyikan. Dihitung ulang di sini, sesudahnya. */
function syncGroups(){
  document.querySelectorAll('#topnav .topnav-group').forEach(function(g){
    var items=g.querySelectorAll('.topnav-item');
    if(!items.length) return;
    var any=Array.prototype.some.call(items,function(it){
      return getComputedStyle(it).display!=='none';
    });
    g.style.display = any ? '' : 'none';
  });
}
function hookRole(){
  var orig=window.applyRole;
  if(typeof orig!=='function') return;
  window.applyRole=function(){
    var r=orig.apply(this,arguments);
    try{ syncGroups(); syncSections(); }catch(e){}
    return r;
  };
}

/* ---------- 3c. Grup menu ikut terbuka mengikuti halaman aktif ----------
   Hanya dijalankan saat BERPINDAH halaman (showView), bukan pada setiap
   perubahan kelas — supaya grup yang sengaja ditutup pengguna tetap tertutup. */
function openActiveBranch(){
  var act=document.querySelector('#topnav .topnav-item.active');
  if(!act) return;
  var node=act.parentElement;
  while(node && node.id!=='topnav'){
    if(node.classList && (node.classList.contains('topnav-group')||node.classList.contains('topnav-sub'))){
      node.classList.add('open');
    }
    node=node.parentElement;
  }
}
function hookShowView(){
  var orig=window.showView;
  if(typeof orig!=='function') return;
  window.showView=function(){
    var r=orig.apply(this,arguments);
    setTimeout(openActiveBranch,260);
    return r;
  };
}

/* ---------- 4. Layar penuh pada modal pratinjau file ---------- */
var IC_ENTER='<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7.5 7.5"/><path d="M3 21l7.5-7.5"/>';
var IC_EXIT ='<path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/>';

function fsEl(){ return document.fullscreenElement || document.webkitFullscreenElement || null; }
function fsSupported(){
  var e=document.documentElement;
  return !!(e.requestFullscreen || e.webkitRequestFullscreen);
}
window.pnPreviewToggleFullscreen=function(){
  var m=document.querySelector('#pn-preview-overlay .pn-preview-modal'); if(!m) return;
  if(fsEl()){
    var ex=document.exitFullscreen||document.webkitExitFullscreen;
    if(ex) ex.call(document);
    return;
  }
  var req=m.requestFullscreen||m.webkitRequestFullscreen;
  if(!req){ if(typeof toast==='function') toast('Peramban ini tidak mendukung layar penuh','warn'); return; }
  var p=req.call(m);
  if(p && p.catch) p.catch(function(){
    if(typeof toast==='function') toast('Layar penuh tidak dapat dibuka','warn');
  });
};
function syncFsBtn(){
  var on=!!fsEl();
  var btn=document.getElementById('pn-preview-fs');
  var lbl=document.getElementById('pn-preview-fs-label');
  var ic=document.getElementById('pn-preview-fs-icon');
  if(btn){ btn.classList.toggle('is-on',on); btn.title=(on?'Keluar dari layar penuh':'Layar Penuh')+' (F)'; }
  if(lbl) lbl.textContent = on ? 'Keluar Layar Penuh' : 'Layar Penuh';
  if(ic) ic.innerHTML = on ? IC_EXIT : IC_ENTER;
}
function initFs(){
  if(!fsSupported()){
    var b=document.getElementById('pn-preview-fs'); if(b) b.style.display='none';
    return;
  }
  document.addEventListener('fullscreenchange',syncFsBtn);
  document.addEventListener('webkitfullscreenchange',syncFsBtn);

  /* Pintasan: tekan F saat pratinjau terbuka */
  document.addEventListener('keydown',function(e){
    if(e.key!=='f' && e.key!=='F') return;
    if(e.ctrlKey||e.metaKey||e.altKey) return;
    var ov=document.getElementById('pn-preview-overlay');
    if(!ov || !ov.classList.contains('show')) return;
    var t=e.target, tag=t&&t.tagName;
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||(t&&t.isContentEditable)) return;
    e.preventDefault();
    window.pnPreviewToggleFullscreen();
  });

  /* Menutup pratinjau harus ikut keluar dari layar penuh */
  var orig=window.closePnPreview;
  if(typeof orig==='function'){
    window.closePnPreview=function(){
      if(fsEl()){ var ex=document.exitFullscreen||document.webkitExitFullscreen; if(ex) try{ ex.call(document); }catch(e){} }
      return orig.apply(this,arguments);
    };
  }
  syncFsBtn();
}

/* ---------- start ---------- */
function init(){
  setTips();
  initHoverSidebar();
  watchActive();
  hookRole();
  hookShowView();
  syncGroups();
  openActiveBranch();
  syncSections();
  updateCrumb();
  initFs();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();

})();
