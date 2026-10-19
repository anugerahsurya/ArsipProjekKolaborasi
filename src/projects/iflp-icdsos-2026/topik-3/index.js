import literatur from './literatur.js'
import checkpoint from './checkpoint.js'

export default {
  id: 'topik-3',
  nomor: 3,
  ilustrasi: 'lapisan-indeks',
  judul: 'A Village-Level Informal Economy Index for West Sumatra: Combining Village Potential Statistics, Remote Sensing, and Published Labour Statistics',
  judulSingkat: 'Indeks ekonomi informal tingkat nagari dari PODES dan citra',
  subtema: '07 Big Data, Alternative Data, and Data Integration for Official Statistics',
  prosiding: 'Prosiding ICDSOS',

  ringkasan: [
    'Penelitian ini menyusun indeks komposit ekonomi informal untuk setiap desa, nagari, dan kelurahan di Sumatera Barat dari variabel fasilitas ekonomi PODES 2025. Komponennya: keberadaan pasar tanpa bangunan, warung, kelontong, dan industri mikro kecil dibandingkan dengan fasilitas formal seperti minimarket, bank, dan koperasi, ditambah akses kredit dan sumber penghasilan utama.',
    'Indeks divalidasi dari dua arah. Di tingkat kab/kota, rata-ratanya dibandingkan dengan persentase dan pendapatan pekerja informal dari tabel publikasi BPS. Di tingkat desa, indeks dibandingkan dengan cahaya malam dan kepadatan bangunan dari citra satelit. Analisis hotspot kemudian menunjukkan kantong ekonomi informal yang bisa menjadi sasaran program.',
  ],

  pertanyaan: [
    'Bagaimana menyusun indeks ekonomi informal tingkat desa dari variabel fasilitas PODES yang tersedia di semua desa?',
    'Apakah indeks tersebut sejalan dengan statistik informalitas resmi BPS di tingkat kab/kota dan dengan indikator citra satelit di tingkat desa?',
    'Di mana kantong ekonomi informal di Sumatera Barat, dan apa bedanya antara wilayah perkotaan dan perdesaan?',
  ],

  gap: [
    {
      judul: 'Ukuran ekonomi informal umumnya di tingkat negara',
      isi: 'Estimasi ekonomi informal (MIMIC, cahaya malam) kebanyakan untuk negara atau provinsi. Belum ada ukuran yang bisa turun sampai desa.',
      rujukan: ['schneider2010', 'medina2018', 'ohnsorge2022', 'ghosh2009'],
    },
    {
      judul: 'Statistik informalitas berbasis survei rumah tangga',
      isi: 'Ukuran resmi berasal dari survei angkatan kerja yang representatif sampai kab/kota. Sisi tempat usaha (pasar, warung, IMK) yang tercatat di PODES belum dimanfaatkan sebagai proksi informalitas.',
      rujukan: ['ilo2013', 'ilo2018', 'nazara2010', 'rothenberg2016'],
    },
    {
      judul: 'Indeks komposit jarang divalidasi ke luar',
      isi: 'Indeks wilayah di Indonesia biasanya berhenti di pembobotan PCA. Uji terhadap statistik resmi dan sumber independen seperti citra satelit jarang dilakukan, padahal itu yang membuat indeks bisa dipercaya.',
      rujukan: ['oecd2008', 'putri2022'],
    },
    {
      judul: 'Pola spasial informalitas tingkat desa belum dipetakan',
      isi: 'Belum ada analisis autokorelasi spasial (LISA, Getis-Ord) untuk kantong ekonomi informal di Sumatera Barat.',
      rujukan: ['anselin1995', 'getis1992'],
    },
  ],

  kerangka: {
    latar: [
      'Kebijakan formalisasi butuh tahu di mana ekonomi informal terkonsentrasi. Statistik resmi informalitas hanya tersedia sampai kab/kota, padahal program seperti Dana Desa, BUMDes, dan perluasan jaminan sosial bekerja di tingkat desa/nagari.',
      'PODES mencatat keberadaan dan jumlah fasilitas ekonomi di semua desa: pasar tanpa bangunan, warung, kelontong, IMK, minimarket, bank, koperasi, dan akses kredit. Variabel ini adalah jejak sisi usaha dari ekonomi informal yang bisa disusun menjadi indeks, lalu diuji dengan statistik resmi dan citra satelit.',
    ],
    rumusan: [
      'Belum ada ukuran ekonomi informal tingkat desa/nagari di Sumatera Barat.',
      'Variabel fasilitas PODES belum dimanfaatkan secara sistematis sebagai proksi informalitas.',
      'Belum diketahui apakah proksi tersebut konsisten dengan statistik resmi dan indikator citra.',
    ],
    tujuan: [
      'Menyusun indeks ekonomi informal tingkat desa dari variabel PODES 2025 mengikuti tahapan indeks komposit OECD/JRC.',
      'Menguji ketahanan indeks terhadap pilihan normalisasi dan pembobotan.',
      'Memvalidasi indeks terhadap tabel informalitas BPS (kab/kota) dan indikator citra (desa).',
      'Memetakan kantong ekonomi informal dengan LISA dan Getis-Ord Gi*.',
    ],
    manfaat: [
      'Bagi BPS: indikator turunan PODES yang bisa diperbarui setiap putaran PODES.',
      'Bagi pemerintah daerah dan Kemnaker: daftar nagari prioritas program formalisasi dan perlindungan sosial.',
      'Bagi akademik: kerangka validasi indeks wilayah dengan statistik resmi dan citra.',
    ],
    hipotesis: [
      'H1: Komponen fasilitas informal dan formal membentuk dimensi yang berbeda pada analisis faktor.',
      'H2: Rata-rata indeks per kab/kota berkorelasi positif dengan persentase pekerja informal dan negatif dengan pendapatan pekerja informal.',
      'H3: Di tingkat desa, indeks berkorelasi negatif dengan intensitas cahaya malam.',
      'H4: Nilai indeks membentuk klaster spasial yang signifikan (Moran\'s I positif).',
    ],
    alur: [
      { tahap: 'Data', item: ['PODES 2025: fasilitas ekonomi, kredit, sumber penghasilan', 'Tabel BPS: persentase dan pendapatan pekerja informal per kab/kota', 'Citra: cahaya malam, bangunan'] },
      { tahap: 'Indikator', item: ['Normalisasi per 1.000 keluarga', 'Winsorizing pencilan', 'Arah indikator diseragamkan'] },
      { tahap: 'Indeks', item: ['PCA dan bobot sama', 'Analisis sensitivitas bobot', 'Skor 0 sampai 100'] },
      { tahap: 'Validasi', item: ['Korelasi kab/kota dengan tabel BPS', 'Korelasi desa dengan citra', 'Perbandingan perkotaan dan perdesaan'] },
      { tahap: 'Peta', item: ['Moran\'s I, LISA, Getis-Ord Gi*', 'Daftar nagari prioritas'] },
    ],
    data: [
      { sumber: 'PODES 2025 (desa part 2)', isi: 'Fasilitas ekonomi, kredit, koperasi, sumber penghasilan', akses: 'Data milik BPS Sumbar' },
      { sumber: 'PODES 2025 (desa part 1)', isi: 'Jumlah keluarga (r501), status perkotaan/perdesaan', akses: 'Data milik BPS Sumbar' },
      { sumber: 'Tabel BPS Sumbar: penduduk bekerja menurut kab/kota dan status pekerjaan utama', isi: 'Persentase pekerja informal per kab/kota', akses: 'sumbar.bps.go.id' },
      { sumber: 'Tabel BPS Sumbar: rata-rata pendapatan bersih pekerja informal menurut kab/kota', isi: 'Validasi sisi pendapatan', akses: 'sumbar.bps.go.id' },
      { sumber: 'VIIRS DNB bulanan', isi: 'Radiansi cahaya malam per desa 2024', akses: 'Google Earth Engine' },
      { sumber: 'Google Open Buildings v3', isi: 'Kepadatan bangunan per desa', akses: 'Google Earth Engine' },
      { sumber: 'Batas desa Sumatera Barat', isi: 'Matriks bobot spasial dan peta', akses: 'BIG / BPS' },
    ],
    variabel: [
      { kode: 'r905dk2', nama: 'Jumlah pasar tanpa bangunan', peran: 'Informal (+)', olah: 'Per 1.000 keluarga' },
      { kode: 'r905ck2', nama: 'Jumlah pasar semi permanen', peran: 'Informal (+)', olah: 'Per 1.000 keluarga' },
      { kode: 'r905gk2', nama: 'Jumlah warung/kedai makanan minuman', peran: 'Informal (+)', olah: 'Per 1.000 keluarga' },
      { kode: 'r905jk2', nama: 'Jumlah toko/warung kelontong', peran: 'Informal (+)', olah: 'Per 1.000 keluarga' },
      { kode: 'r907a', nama: 'Jumlah industri mikro dan kecil', peran: 'Informal (+)', olah: 'Per 1.000 keluarga' },
      { kode: 'r905ek2', nama: 'Jumlah minimarket/swalayan', peran: 'Formal (-)', olah: 'Per 1.000 keluarga' },
      { kode: 'r905bk2', nama: 'Jumlah pasar permanen', peran: 'Formal (-)', olah: 'Per 1.000 keluarga' },
      { kode: 'r902a1-a3', nama: 'Jumlah bank (pemerintah, swasta, BPR)', peran: 'Formal (-)', olah: 'Dijumlah, per 1.000 keluarga' },
      { kode: 'r902b', nama: 'Jarak ke bank terdekat (km)', peran: 'Akses keuangan (+)', olah: 'Log(1 + jarak)' },
      { kode: 'r903a-d', nama: 'Jumlah koperasi aktif', peran: 'Formal (-)', olah: 'Dijumlah, per 1.000 keluarga' },
      { kode: 'r904a-d', nama: 'Fasilitas kredit (KUR, KKP-E, KUK, lainnya)', peran: 'Akses keuangan (-)', olah: 'Jumlah jenis kredit yang ada' },
      { kode: 'r906a', nama: 'Sumber penghasilan utama', peran: 'Struktur (+)', olah: 'Dummy pertanian' },
      { kode: 'r501a1+r501a2+r501b', nama: 'Jumlah keluarga', peran: 'Penyebut', olah: 'Normalisasi' },
      { kode: 'r105', nama: 'Status perkotaan/perdesaan', peran: 'Stratifikasi', olah: 'Analisis per strata' },
    ],
    metode: [
      { judul: 'Penyusunan indikator', isi: 'Indikator jumlah dinormalisasi per 1.000 keluarga, pencilan di-winsorize pada persentil 1 dan 99, arah indikator formal dibalik agar nilai tinggi berarti lebih informal.' },
      { judul: 'Pembobotan', isi: 'Mengikuti Handbook OECD/JRC: uji KMO dan Bartlett, PCA untuk bobot data-driven, dibandingkan dengan bobot sama. Skor akhir diskalakan 0 sampai 100.' },
      { judul: 'Sensitivitas', isi: 'Simulasi Monte Carlo atas bobot dan metode normalisasi (min-max vs z-score). Laporkan perubahan peringkat desa (median absolute rank shift).' },
      { judul: 'Validasi eksternal', isi: 'Rata-rata indeks tertimbang keluarga per kab/kota dikorelasikan (Spearman, n = 19) dengan persentase dan pendapatan pekerja informal. Di tingkat desa, indeks dikorelasikan dengan cahaya malam dan kepadatan bangunan.' },
      { judul: 'Analisis spasial', isi: 'Matriks bobot queen contiguity dari poligon desa. Global Moran\'s I, LISA (Anselin, 1995), dan Getis-Ord Gi* (Getis & Ord, 1992) untuk hotspot.' },
      { judul: 'Tipologi', isi: 'Kuadran indeks informal vs cahaya malam untuk membedakan informal perkotaan, informal perdesaan, formal perkotaan, dan desa sepi aktivitas.' },
    ],
    outline: [
      { bab: 'Abstract', isi: 'Masalah granularitas, data PODES, metode indeks komposit, hasil validasi, peta hotspot.' },
      { bab: '1. Introduction', isi: 'Informalitas dan kebijakan formalisasi, kebutuhan data tingkat desa, kontribusi.' },
      { bab: '2. Literature Review', isi: 'Pengukuran ekonomi informal, indeks komposit, cahaya malam, statistik spasial.' },
      { bab: '3. Data and Methods', isi: 'PODES, indikator, normalisasi, PCA, sensitivitas, validasi, analisis spasial.' },
      { bab: '4. Results', isi: 'Struktur faktor, distribusi indeks, hasil validasi, peta LISA dan Gi*, tipologi.' },
      { bab: '5. Discussion', isi: 'Makna kebijakan, keterbatasan proksi fasilitas, ecological fallacy.' },
      { bab: '6. Conclusion', isi: 'Temuan utama dan usulan indikator turunan PODES.' },
    ],
    keterbatasan: [
      'Indeks mengukur sisi tempat usaha, bukan status pekerjaan individu.',
      'Validasi kab/kota hanya 19 titik dan memakai definisi proksi.',
      'Jumlah fasilitas di PODES adalah laporan aparat desa dan bisa berbeda kualitasnya antar desa.',
    ],
  },

  literatur,
  checkpoint,
}
