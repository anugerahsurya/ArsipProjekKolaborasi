# Design

Dunia visual: lembar peta Rupa Bumi Indonesia (RBI). Setiap projek dan topik adalah satu lembar dengan garis tepi ganda (neatline), tick koordinat di tepi, dan koordinat sudut. Navigasi isi topik adalah legenda ("Keterangan").

## Warna

Latar putih (`--paper #ffffff`), panel sekunder `--paper-2 #f5f7f4`, tinta `--ink #1b2422`. Warna simbol peta: kontur `--contour #9a5b2e`, air `--water #2c6e9b` (tautan, fokus), vegetasi `--veg #3f7d4e` (selesai), jalan `--road #b8362b` (tenggat, peringatan). Masing-masing punya versi `-soft` untuk latar.

## Tipografi

Plus Jakarta Sans variabel untuk semua teks, angka tabular (`.num`) untuk tanggal, koordinat, dan hitungan. Monospace hanya untuk kode variabel PODES.

## Simbol status

Belum: kotak garis. Proses: kotak arsir sienna. Selesai: blok hijau dengan centang. Kemajuan ditampilkan sebagai skala batang peta, satu ruas per langkah.

## Komponen

Tombol bersudut 6px, hitam penuh atau garis. Kolom isian bergaris tipis, fokus biru air. Tabel berubah menjadi tumpukan baris di bawah 720px. Legenda menempel di samping pada layar lebar dan menjadi drawer (vaul) di bawah 960px. Notifikasi memakai sonner.

## Gerak

Easing `cubic-bezier(0.23, 1, 0.32, 1)`, 160 sampai 320 ms untuk perubahan status, tombol mengecil ke 0.97 saat ditekan, hover hanya pada perangkat dengan pointer halus. Satu momen utama: garis kontur tergambar di beranda. Ilustrasi topik muncul bertahap. Semua gerak dikurangi saat `prefers-reduced-motion`.
