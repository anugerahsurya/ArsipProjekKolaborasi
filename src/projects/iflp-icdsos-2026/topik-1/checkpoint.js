export default [
  {
    fase: 'Persiapan data',
    langkah: [
      { id: 't1-01', judul: 'Siapkan PODES 2025 Sumbar', isi: 'Filter R101 = 13, gabungkan part 1 dan 2 lewat iddesa, cek missing pada r906a.', target: '2026-10-20' },
      { id: 't1-02', judul: 'Siapkan batas desa Sumbar', isi: 'Shapefile batas desa, samakan kode dengan iddesa, catat desa yang tidak cocok.', target: '2026-10-20' },
      { id: 't1-03', judul: 'Unduh tabel status pekerjaan per kab/kota', isi: 'Tabel BPS Sumbar 6 kategori, hitung persentase pekerja informal per kab/kota.', target: '2026-10-21' },
    ],
  },
  {
    fase: 'Ekstraksi citra',
    langkah: [
      { id: 't1-04', judul: 'Upload poligon desa ke GEE', isi: 'Asset FeatureCollection dengan kolom iddesa.', target: '2026-10-21' },
      { id: 't1-05', judul: 'Zonal statistics citra', isi: 'VIIRS 2024, Dynamic World 2024, NDVI/NDBI, Open Buildings, SRTM. Ekspor ke CSV.', target: '2026-10-22' },
      { id: 't1-06', judul: 'Fitur jalan dari OSM', isi: 'Kepadatan jalan dan jarak ke jalan utama per desa.', target: '2026-10-23' },
    ],
  },
  {
    fase: 'Pemodelan',
    langkah: [
      { id: 't1-07', judul: 'Gabung fitur dan label', isi: 'Satu tabel analisis, statistik deskriptif, cek ketimpangan kelas.', target: '2026-10-23' },
      { id: 't1-08', judul: 'Latih model M1 dan M2', isi: 'Random forest dan XGBoost dengan bobot kelas.', target: '2026-10-24' },
      { id: 't1-09', judul: 'Validasi acak vs spasial', isi: '5-fold acak dan leave-one-kabupaten-out. Tabel metrik.', target: '2026-10-25' },
      { id: 't1-10', judul: 'SHAP dan peta prediksi', isi: 'Grafik SHAP, peta probabilitas desa pertanian.', target: '2026-10-26' },
      { id: 't1-11', judul: 'Korelasi dengan statistik resmi', isi: 'Agregasi ke kab/kota, Spearman dengan persentase pekerja informal, scatter plot.', target: '2026-10-26' },
    ],
  },
  {
    fase: 'Penulisan dan submit',
    langkah: [
      { id: 't1-12', judul: 'Draf Data, Metode, dan Hasil', isi: 'Pakai template ICDSOS.', target: '2026-10-28' },
      { id: 't1-13', judul: 'Draf Pendahuluan, Tinjauan, Diskusi', isi: 'Isi dari tabel literatur dan research gap.', target: '2026-10-29' },
      { id: 't1-14', judul: 'Review internal tim', isi: 'Cek konsistensi angka, gambar, dan sitasi.', target: '2026-10-30' },
      { id: 't1-15', judul: 'Submit di proceedings.stis.ac.id', isi: 'Simpan bukti submit.', target: '2026-10-31' },
    ],
  },
]
