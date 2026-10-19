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
2. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
3. Salin URL `/exec` ke `VITE_APPSCRIPT_URL` (di `.env` lokal dan di pengaturan Environment Variables Vercel/Netlify).

Saat pertama dipakai, script membuat folder "Artikel Ilmiah Surya" di Drive pemilik beserta spreadsheet databasenya. Berkas PDF dibagikan dengan akses Pengomentar untuk siapa saja yang memiliki link. Siapa pun yang tahu URL web app bisa menulis data, jadi URL-nya jangan disebar di luar tim.

## Menambah projek atau topik

Buat folder baru di `src/projects/<id-projek>/` berisi `project.js`, lalu satu subfolder per topik (`<id-topik>/index.js`, `literatur.js`, `checkpoint.js`). Contohnya ada di `src/projects/iflp-icdsos-2026/`. Projek yang sudah selesai ditandai dari halaman projek dan otomatis pindah ke bagian Arsip di beranda.

## Deploy

Vercel atau Netlify: build command `npm run build`, output `dist`. Aturan rewrite untuk routing sudah ada di `vercel.json` dan `public/_redirects`.
