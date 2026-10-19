import literatur from './literatur.js'
import checkpoint from './checkpoint.js'

export default {
  id: 'topik-1',
  nomor: 1,
  ilustrasi: 'citra-ke-kelas',
  judul: "Satellite-Based Prediction of Village Livelihood Structure as an Early Indicator of Informality: Evidence from West Sumatra's Village Potential Statistics",
  judulSingkat: 'Prediksi struktur mata pencaharian nagari dari citra satelit',
  subtema: '08 Spatial Analytics, Remote Sensing, and Geospatial Intelligence',
  prosiding: 'Prosiding ICDSOS',

  ringkasan: [
    'Penelitian ini memakai PODES 2025 sebagai label (ground truth) dan citra satelit publik sebagai prediktor untuk menebak sumber penghasilan utama sebagian besar penduduk di setiap desa, nagari, dan kelurahan di Sumatera Barat. Labelnya r906a (pertanian, industri, jasa) dan r906b (subsektor pertanian).',
    'Hampir semua pekerja sektor pertanian berstatus informal, sehingga peta desa berbasis pertanian hasil prediksi bisa dibaca sebagai peta kantong informalitas. Peta ini dapat diperbarui setiap tahun dari citra tanpa menunggu PODES berikutnya. Hasil agregasinya per kabupaten/kota dibandingkan dengan persentase pekerja informal dari tabel publikasi BPS untuk menguji keterkaitannya dengan statistik resmi.',
  ],

  pertanyaan: [
    'Seberapa akurat fitur citra satelit publik memprediksi sumber penghasilan utama desa/nagari di Sumatera Barat bila divalidasi secara spasial?',
    'Fitur citra apa yang paling menentukan perbedaan desa pertanian dan non-pertanian, dan apakah polanya berbeda antara perkotaan dan perdesaan?',
    'Apakah proporsi desa pertanian hasil prediksi sejalan dengan persentase pekerja informal kabupaten/kota yang dipublikasikan BPS?',
  ],

  gap: [
    {
      judul: 'Target prediksi masih berupa kemiskinan, bukan struktur pekerjaan',
      isi: 'Studi citra satelit dan machine learning umumnya memprediksi indeks aset atau konsumsi rumah tangga. Struktur mata pencaharian dan informalitas belum banyak dijadikan target, padahal keduanya inti kebijakan ketenagakerjaan.',
      rujukan: ['jean2016', 'yeh2020', 'engstrom2021', 'steele2017'],
    },
    {
      judul: 'Studi Indonesia terpusat di Jawa dan level kabupaten/kecamatan',
      isi: 'Penelitian berbasis citra di Indonesia sebagian besar memetakan kemiskinan di Jawa Timur. Belum ada yang memakai PODES sebagai label tingkat desa untuk Sumatera Barat, yang punya unit pemerintahan nagari dan bentang alam pegunungan serta pesisir yang berbeda.',
      rujukan: ['putri2022', 'putri2023'],
    },
    {
      judul: 'Validasi acak membuat akurasi tampak lebih tinggi',
      isi: 'Sebagian besar studi memakai validasi silang acak. Untuk data spasial, cara ini memberi akurasi yang terlalu optimistis karena desa yang bertetangga saling mirip. Validasi leave-one-kabupaten-out jarang dilaporkan.',
      rujukan: ['ploton2020', 'meyer2021'],
    },
    {
      judul: 'Belum dihubungkan dengan statistik ketenagakerjaan resmi',
      isi: 'Hasil prediksi citra jarang diuji terhadap indikator ketenagakerjaan resmi. Penelitian ini mengaitkan hasil prediksi dengan persentase pekerja informal kabupaten/kota dari publikasi BPS.',
      rujukan: ['laporta2014', 'ilo2018', 'rothenberg2016'],
    },
  ],

  kerangka: {
    latar: [
      'Informalitas tenaga kerja di Indonesia masih tinggi dan paling besar di sektor pertanian. Program perlindungan sosial dan pelatihan kerja membutuhkan sasaran wilayah yang rinci, sementara statistik ketenagakerjaan resmi hanya tersedia sampai kabupaten/kota.',
      'PODES mencatat sumber penghasilan utama setiap desa, tetapi hanya dikumpulkan beberapa tahun sekali. Citra satelit tersedia rutin dan gratis: cahaya malam, tutupan lahan, kepadatan bangunan, dan topografi. Menggabungkan keduanya membuka peluang indikator struktur ekonomi desa yang bisa diperbarui di antara dua putaran PODES.',
    ],
    rumusan: [
      'Statistik informalitas resmi hanya tersedia sampai kabupaten/kota, sehingga kantong informalitas di tingkat nagari tidak terlihat.',
      'Belum diketahui seberapa jauh citra satelit publik mampu menangkap struktur mata pencaharian desa di Sumatera Barat.',
      'Belum ada uji keterkaitan antara hasil prediksi citra dengan indikator informalitas resmi BPS.',
    ],
    tujuan: [
      'Membangun model klasifikasi sumber penghasilan utama desa/nagari dari fitur citra satelit, dengan label PODES 2025.',
      'Mengukur akurasi model dengan validasi spasial dan membandingkannya dengan validasi acak.',
      'Mengidentifikasi fitur citra yang paling berpengaruh melalui SHAP.',
      'Menguji korelasi proporsi desa pertanian hasil prediksi dengan persentase pekerja informal kabupaten/kota.',
    ],
    manfaat: [
      'Bagi BPS: contoh pemanfaatan citra satelit untuk memperbarui indikator PODES di antara dua putaran pendataan.',
      'Bagi pemerintah daerah dan Kemnaker: peta kantong informalitas tingkat nagari untuk sasaran program jaminan sosial dan pelatihan.',
      'Bagi akademik: bukti performa model citra pada target struktur pekerjaan dengan validasi spasial.',
    ],
    hipotesis: [
      'H1: Model yang memakai fitur citra memprediksi desa pertanian dan non-pertanian jauh lebih baik daripada tebakan kelas mayoritas (balanced accuracy di atas 0,5).',
      'H2: Akurasi validasi leave-one-kabupaten-out lebih rendah daripada validasi acak.',
      'H3: Cahaya malam dan kepadatan bangunan adalah prediktor terkuat untuk desa non-pertanian.',
      'H4: Proporsi desa pertanian hasil prediksi berkorelasi positif dengan persentase pekerja informal kabupaten/kota.',
    ],
    alur: [
      { tahap: 'Data', item: ['PODES 2025 (label r906a, r906b, r105)', 'Batas desa Sumatera Barat', 'Citra satelit publik', 'Tabel BPS status pekerjaan per kab/kota'] },
      { tahap: 'Fitur', item: ['Zonal statistics per desa di Google Earth Engine', 'Cahaya malam, tutupan lahan, NDVI/NDBI, bangunan, lereng, jarak jalan'] },
      { tahap: 'Model', item: ['Random forest dan XGBoost', 'Validasi acak vs leave-one-kabupaten-out', 'SHAP'] },
      { tahap: 'Keluaran', item: ['Peta prediksi struktur mata pencaharian nagari', 'Korelasi dengan persentase pekerja informal (n = 19)'] },
      { tahap: 'Kebijakan', item: ['Sasaran perlindungan sosial pekerja informal', 'Pemutakhiran indikator antar-PODES'] },
    ],
    data: [
      { sumber: 'PODES 2025 (desa part 1 dan 2)', isi: 'Label dan variabel kontrol tingkat desa', akses: 'Data milik BPS Sumbar' },
      { sumber: 'Tabel BPS Sumbar: penduduk bekerja menurut kab/kota dan status pekerjaan utama', isi: 'Persentase pekerja informal per kab/kota (definisi proksi status pekerjaan)', akses: 'sumbar.bps.go.id' },
      { sumber: 'VIIRS DNB bulanan (NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG)', isi: 'Rata-rata dan total radiansi cahaya malam 2024', akses: 'Google Earth Engine' },
      { sumber: 'Dynamic World (GOOGLE/DYNAMICWORLD/V1)', isi: 'Proporsi lahan terbangun, tanaman, pohon, air 2024', akses: 'Google Earth Engine' },
      { sumber: 'ESA WorldCover v200', isi: 'Pembanding tutupan lahan 10 m', akses: 'Google Earth Engine' },
      { sumber: 'Sentinel-2 SR Harmonized', isi: 'Median NDVI dan NDBI 2024', akses: 'Google Earth Engine' },
      { sumber: 'Google Open Buildings v3', isi: 'Jumlah dan luas bangunan per km persegi', akses: 'Google Earth Engine' },
      { sumber: 'SRTM 30 m', isi: 'Rata-rata elevasi dan kemiringan lereng', akses: 'Google Earth Engine' },
      { sumber: 'OpenStreetMap (Geofabrik)', isi: 'Panjang jalan per km persegi, jarak ke jalan utama', akses: 'download.geofabrik.de' },
    ],
    variabel: [
      { kode: 'r906a', nama: 'Sumber penghasilan utama sebagian besar penduduk', peran: 'Label (Y)', olah: 'Biner: pertanian vs non-pertanian; varian tiga kelas sebagai analisis tambahan' },
      { kode: 'r906b', nama: 'Subsektor pertanian utama', peran: 'Label tambahan', olah: 'Analisis lanjutan untuk desa pertanian (pangan, perkebunan, perikanan)' },
      { kode: 'r105', nama: 'Status daerah perkotaan/perdesaan', peran: 'Stratifikasi', olah: 'Evaluasi akurasi per strata' },
      { kode: 'r301', nama: 'Status pemerintahan (desa, kelurahan, nagari)', peran: 'Deskriptif', olah: 'Profil hasil per jenis wilayah' },
      { kode: 'r302a', nama: 'Berbatasan dengan laut', peran: 'Kontrol', olah: 'Dummy pesisir' },
      { kode: 'r303a', nama: 'Lokasi terhadap kawasan hutan', peran: 'Kontrol', olah: 'Dummy di dalam/tepi hutan' },
      { kode: 'r802bk5', nama: 'Jarak ke kantor bupati/walikota (km)', peran: 'Model pembanding', olah: 'Dipakai di model citra + PODES' },
      { kode: 'r501a1+r501a2+r501b', nama: 'Jumlah keluarga', peran: 'Bobot', olah: 'Bobot saat agregasi ke kab/kota' },
    ],
    metode: [
      { judul: 'Unit analisis', isi: 'Seluruh desa, nagari, dan kelurahan di Sumatera Barat yang ada di PODES 2025 dan punya poligon batas. Desa tanpa poligon yang cocok dicatat sebagai keterbatasan.' },
      { judul: 'Ekstraksi fitur', isi: 'Zonal statistics per poligon desa di Google Earth Engine (reduceRegions): rata-rata, persentil 90, dan total untuk cahaya malam; proporsi kelas untuk Dynamic World; median NDVI/NDBI; kepadatan bangunan; elevasi dan lereng. Fitur jalan dihitung di QGIS/Python dari OSM.' },
      { judul: 'Model', isi: 'Random forest (Breiman, 2001) dan XGBoost dengan bobot kelas karena desa pertanian kemungkinan dominan. Dua spesifikasi: M1 hanya citra, M2 citra ditambah variabel PODES aksesibilitas.' },
      { judul: 'Validasi', isi: 'Validasi silang acak 5 lipatan dibandingkan dengan leave-one-kabupaten-out (19 lipatan). Metrik: balanced accuracy, macro-F1, AUC. Selisih kedua skema dilaporkan sebagai ukuran optimisme.' },
      { judul: 'Interpretasi', isi: 'SHAP untuk kepentingan fitur global dan contoh desa. Dibandingkan antara strata perkotaan dan perdesaan (r105).' },
      { judul: 'Keterkaitan dengan statistik resmi', isi: 'Proporsi desa pertanian hasil prediksi (dibobot jumlah keluarga) per kab/kota dikorelasikan dengan persentase pekerja informal dari tabel BPS memakai korelasi Spearman. Dengan n = 19, hasil dibaca sebagai indikasi, bukan uji kausal.' },
    ],
    outline: [
      { bab: 'Abstract', isi: 'Masalah, data (PODES 2025 + citra), metode, akurasi validasi spasial, korelasi dengan statistik informalitas.' },
      { bab: '1. Introduction', isi: 'Informalitas dan sektor pertanian, keterbatasan granularitas statistik resmi, peluang citra satelit, kontribusi.' },
      { bab: '2. Literature Review', isi: 'Citra untuk statistik sosial ekonomi, cahaya malam, tutupan lahan, validasi spasial, informalitas di Indonesia.' },
      { bab: '3. Data and Methods', isi: 'Wilayah studi, PODES, citra, rekayasa fitur, model, validasi, SHAP, agregasi.' },
      { bab: '4. Results', isi: 'Statistik deskriptif label, performa model per skema validasi, SHAP, peta prediksi, korelasi kab/kota.' },
      { bab: '5. Discussion', isi: 'Makna kebijakan, kelemahan label tingkat desa, ecological fallacy, potensi pemutakhiran tahunan.' },
      { bab: '6. Conclusion', isi: 'Temuan utama dan rekomendasi untuk BPS dan Kemnaker.' },
    ],
    keterbatasan: [
      'r906a adalah penilaian aparat desa tentang mayoritas penduduk, bukan hitungan pekerja.',
      'Korelasi tingkat kab/kota hanya 19 titik.',
      'Definisi informal pada tabel kab/kota memakai proksi status pekerjaan.',
    ],
  },

  literatur,
  checkpoint,
}
