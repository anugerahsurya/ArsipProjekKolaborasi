# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React (Vite), deploy ke Vercel/Netlify. Database checkpoint lewat Google Apps Script + Google Sheet; URL web app disimpan di env `VITE_APPSCRIPT_URL`, tanpa halaman konfigurasi.

## Users

Penulis (pegawai IPDS BPS Provinsi Sumatera Barat) dan tim penulisnya. Dipakai saat menyiapkan artikel ilmiah untuk call for paper: membaca kembali rancangan penelitian, membuka literatur, dan menandai kemajuan per langkah dengan PIC dan catatan.

## Product Purpose

Satu tempat untuk tiap projek artikel ilmiah: projek (konferensi/jurnal tujuan) berisi topik terpilih, dan tiap topik berisi overview, research gap, kerangka penelitian lengkap, tabel literatur dengan tautan, serta checkpoint pengerjaan yang tersimpan bersama untuk tim.

## Positioning

Dibuat untuk alur kerja statistisi BPS: data PODES, tabel publikasi BPS, dan citra satelit, dengan kode variabel nyata di dalam kerangka penelitiannya. Bisa dipakai ulang untuk projek berikutnya dengan menambah data projek/topik baru.

## Operating Context

Projek pertama: Joint International Conference IFLP & ICDSOS 2026 (Kemnaker, BPS, Polstat STIS), tema "Breaking the Informality Trap". Deadline paper 31 Oktober 2026, presentasi 8 Desember 2026. Topik terpilih: Topik 1 (prediksi struktur mata pencaharian nagari dari citra satelit) dan Topik 3 (indeks ekonomi informal tingkat nagari). Data: PODES 2025 (layout di folder Rangkiang), tabel BPS Sumbar, citra satelit publik. Tidak memakai SE2026 maupun mikrodata Sakernas.

## Capabilities and Constraints

- Hierarki: Projek > Topik > Detail.
- Checkpoint per langkah: status, PIC, catatan, waktu diperbarui; disimpan di Google Sheet lewat Apps Script.
- Font Plus Jakarta Sans (ditetapkan pengguna). Ikon dari library ikon web, bukan emoji.
- Responsif di semua ukuran layar.
- Tanpa emoji dan tanpa kata-kata khas AI di teks.

## Evidence on Hand

Referensi literatur sudah diverifikasi lewat Crossref/halaman penerbit. Belum ada hasil olah data; angka hasil tidak boleh dikarang.

## Product Principles

- Isi penelitian lebih penting daripada hiasan: kerangka, variabel, dan langkah harus bisa langsung dikerjakan.
- Kemajuan tim terlihat sekilas.
- Mudah ditambah projek dan topik baru tanpa mengubah komponen.
