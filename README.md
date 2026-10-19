# ArsipProjekKolaborasi

Web Projek Artikel Ilmiah: arsip dan lembar kerja tim untuk artikel ilmiah. Strukturnya Projek > Topik > Detail. Tiap topik berisi ringkasan, research gap, kerangka penelitian, tabel literatur, checkpoint pengerjaan, dan berkas (bahan tayang, artikel final, link kolaborasi).

Dibuat dengan React + Vite. Data checkpoint dan berkas disimpan lewat Google Apps Script ke Google Sheet dan Google Drive.

## Menjalankan

```
npm install
npm run dev
```

Salin `.env.example` menjadi `.env`, lalu isi `VITE_APPSCRIPT_URL`. Tanpa variabel ini web tetap jalan, tetapi checkpoint hanya tersimpan di browser dan unggah berkas tidak aktif.

## Apps Script

1. Buka script.google.com, buat project baru, tempel isi `appscript/Code.gs`.
2. Pilih fungsi `setup` di toolbar, klik Run, lalu izinkan akses Drive dan Sheets. Langkah ini wajib. Tanpa otorisasi, web menampilkan "Apps Script tidak bisa dihubungi" (sebelumnya "Failed to fetch").
3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
4. Salin URL yang berakhiran `/exec` (bukan `/dev`) ke `VITE_APPSCRIPT_URL` di `.env` lokal dan di Environment Variables Vercel/Netlify, lalu redeploy web. Vite membaca env saat build, jadi env yang ditambah setelah build belum terpakai.
5. Cek dengan membuka URL `/exec` di browser. Jika muncul `{"ok":true,...}`, backend siap.

Setiap kali `Code.gs` diubah, buat versi baru: Deploy > Manage deployments > Edit > Version: New version. URL tetap sama.

Saat pertama dipakai, script membuat folder "Artikel Ilmiah Surya" di Drive pemilik beserta spreadsheet databasenya. Berkas PDF dibagikan dengan akses Pengomentar untuk siapa saja yang memiliki link. Siapa pun yang tahu URL web app bisa menulis data, jadi URL-nya jangan disebar di luar tim.

## Menambah projek atau topik

Template ada di folder `templates/`. Setiap template punya kunci `_prompt` berisi instruksi siap pakai.

1. Buka `templates/project.template.json` (untuk projek baru) atau `templates/topik.template.json` (untuk topik baru).
2. Isi bagian `<<...>>` di `_prompt` dengan informasi call for paper, ide topik, dan metadata data. Lalu tempel seluruh isi file ke Claude atau AI lain.
3. Simpan jawabannya sebagai `src/projects/<id-projek>/project.json` atau `src/projects/<id-projek>/<id-topik>/topik.json`. Nama folder harus sama dengan `id` di dalam JSON.
4. Cek literatur yang dihasilkan, karena tautan tetap perlu diverifikasi. Setelah itu jalankan `npm run dev` atau push, dan topik langsung muncul di web.

Contoh yang sudah terisi ada di `src/projects/iflp-icdsos-2026/`. Id langkah checkpoint jangan diganti setelah dipakai, karena statusnya tersimpan di Sheet dengan id itu. Projek yang sudah selesai ditandai dari halaman projek dan otomatis pindah ke bagian Arsip di beranda.

## Deploy

Vercel atau Netlify: build command `npm run build`, output `dist`. Aturan rewrite untuk routing sudah ada di `vercel.json` dan `public/_redirects`.
