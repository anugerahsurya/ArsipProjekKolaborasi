export default [
  {
    fase: 'Persiapan data',
    langkah: [
      { id: 't3-01', judul: 'Siapkan PODES 2025 Sumbar', isi: 'Filter R101 = 13, gabungkan part 1 dan 2, ambil variabel r905, r907a, r902, r903, r904, r906a, r501, r105.', target: '2026-10-20' },
      { id: 't3-02', judul: 'Unduh tabel informalitas BPS', isi: 'Status pekerjaan per kab/kota dan pendapatan pekerja informal per kab/kota.', target: '2026-10-20' },
      { id: 't3-03', judul: 'Siapkan batas desa dan fitur citra', isi: 'Poligon desa, cahaya malam dan kepadatan bangunan per desa dari GEE.', target: '2026-10-21' },
    ],
  },
  {
    fase: 'Penyusunan indeks',
    langkah: [
      { id: 't3-04', judul: 'Bangun indikator', isi: 'Normalisasi per 1.000 keluarga, winsorizing, samakan arah indikator.', target: '2026-10-22' },
      { id: 't3-05', judul: 'Uji kelayakan faktor', isi: 'Korelasi antar indikator, KMO, Bartlett.', target: '2026-10-22' },
      { id: 't3-06', judul: 'PCA dan bobot', isi: 'Bobot PCA dan bobot sama, skor 0 sampai 100.', target: '2026-10-23' },
      { id: 't3-07', judul: 'Analisis sensitivitas', isi: 'Monte Carlo bobot dan normalisasi, pergeseran peringkat.', target: '2026-10-24' },
    ],
  },
  {
    fase: 'Validasi dan spasial',
    langkah: [
      { id: 't3-08', judul: 'Validasi kab/kota', isi: 'Spearman indeks vs persentase dan pendapatan pekerja informal.', target: '2026-10-25' },
      { id: 't3-09', judul: 'Validasi desa dengan citra', isi: 'Korelasi indeks dengan cahaya malam dan kepadatan bangunan, per strata r105.', target: '2026-10-25' },
      { id: 't3-10', judul: "Moran's I, LISA, Gi*", isi: 'Peta klaster dan hotspot, daftar nagari prioritas.', target: '2026-10-26' },
      { id: 't3-11', judul: 'Tipologi kuadran', isi: 'Indeks informal vs cahaya malam.', target: '2026-10-27' },
    ],
  },
  {
    fase: 'Penulisan dan submit',
    langkah: [
      { id: 't3-12', judul: 'Draf Data, Metode, dan Hasil', isi: 'Pakai template ICDSOS.', target: '2026-10-28' },
      { id: 't3-13', judul: 'Draf Pendahuluan, Tinjauan, Diskusi', isi: 'Isi dari tabel literatur dan research gap.', target: '2026-10-29' },
      { id: 't3-14', judul: 'Review internal tim', isi: 'Cek konsistensi angka, peta, dan sitasi.', target: '2026-10-30' },
      { id: 't3-15', judul: 'Submit di proceedings.stis.ac.id', isi: 'Simpan bukti submit.', target: '2026-10-31' },
    ],
  },
]
