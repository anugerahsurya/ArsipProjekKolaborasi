// =====================================================================
// GEE 01 - Cahaya malam, luas terbangun, penduduk, aksesibilitas, lereng
// Jalankan di code.earthengine.google.com. Hasil: satu tabel per desa.
// Tahun analisis 2025, mengikuti PODES 2025.
// Statistik zonal: variabel numerik diberi mean dan median (akhiran _mean, _median);
// jumlah (sum) hanya untuk besaran ekstensif yang dipakai menghitung rasio.
// =====================================================================
// DataWilayahDesa: FeatureCollection poligon desa Sumatera Barat 2025
// dengan atribut 'iddesa' (10 digit, sama dengan kode PODES).
// Contoh: var DataWilayahDesa = ee.FeatureCollection('projects/<akun>/assets/desa_sumbar_2025');

var TAHUN = 2025;
var mulai = ee.Date.fromYMD(TAHUN, 1, 1);
var akhir = mulai.advance(1, 'year');

// ---------- 1. Cahaya malam VIIRS (median bulanan, piksel tanpa observasi dibuang) ----------
var viirs = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG')
  .filterDate(mulai, akhir)
  .map(function (img) {
    return img.select('avg_rad').updateMask(img.select('cf_cvg').gt(0)).max(0);
  })
  .median()
  .rename('ntl');

// ---------- 2. GHSL R2023A epoch 2025: luas terbangun total dan non-hunian (m2 per sel 100 m) ----------
var built = ee.Image('JRC/GHSL/P2023A/GHS_BUILT_S/2025');
var builtTotal = built.select('built_surface').rename('built_m2');
var builtNres = built.select('built_surface_nres').rename('built_nres_m2');

// ---------- 3. Penduduk 2025 (GHS-POP) dan struktur umur ----------
// Jumlah penduduk memakai GHS-POP epoch 2025 (100 m).
var pop = ee.Image('JRC/GHSL/P2023A/GHS_POP/2025').select('population_count').rename('pop');

// Struktur umur WorldPop hanya tersedia sampai 2020, jadi dipakai sebagai proporsi
// (porsi kelompok umur di desa), lalu dikalikan jumlah penduduk 2025.
var umur = ee.ImageCollection('WorldPop/GP/100m/pop_age_sex')
  .filter(ee.Filter.eq('country', 'IDN'))
  .filter(ee.Filter.eq('year', 2020))
  .first();
function jumlahBand(prefixUmur) {
  var nama = [];
  prefixUmur.forEach(function (u) { nama.push('M_' + u); nama.push('F_' + u); });
  return umur.select(nama).reduce(ee.Reducer.sum());
}
var muda = jumlahBand(['0', '1', '5', '10']).rename('pop_0_14');
var produktif = jumlahBand(['15', '20', '25', '30', '35', '40', '45', '50', '55', '60']).rename('pop_15_64');
var tua = jumlahBand(['65', '70', '75', '80']).rename('pop_65p');
var remaja = jumlahBand(['15']).rename('pop_15_19');
var umurTotal = umur.select('population').rename('pop_wp2020');

// ---------- 4. Aksesibilitas (Weiss dkk. 2018, rilis tunggal 2015) dan lereng ----------
var akses = ee.Image('Oxford/MAP/accessibility_to_cities_2015_v1_0').select('accessibility').rename('menit_ke_kota');
var lereng = ee.Terrain.slope(ee.Image('USGS/SRTMGL1_003')).rename('lereng');

// ---------- 5. Gabungkan pada grid 100 m ----------
// Perkalian dengan penduduk untuk rata-rata berbobot penduduk: sum(pop*x)/sum(pop)
var lonlat = ee.Image.pixelLonLat();
var stack = ee.Image.cat([
  builtTotal, builtNres, pop, muda, produktif, tua, remaja, umurTotal,
  viirs.multiply(pop).rename('ntl_x_pop'),
  akses.multiply(pop).rename('akses_x_pop'),
  lereng.multiply(pop).rename('lereng_x_pop'),
  lonlat.select('longitude').multiply(pop).rename('lon_x_pop'),
  lonlat.select('latitude').multiply(pop).rename('lat_x_pop'),
  // jumlah radiansi: tiap sel 100 m mewakili sekitar 1/25 piksel VIIRS (kira-kira 500 m)
  viirs.multiply(ee.Image.pixelArea()).divide(250000).rename('ntl_sum'),
  ee.Image.pixelArea().rename('luas_m2')
]);

// Reducer 'sum' di GEE otomatis memberi bobot fraksi piksel yang masuk poligon.
var hasil = stack.reduceRegions({
  collection: DataWilayahDesa.select(['iddesa']),
  reducer: ee.Reducer.sum(),
  scale: 100,
  tileScale: 4
}).map(function (f) {
  var p = ee.Number(f.get('pop')).max(1);
  var luas = ee.Number(f.get('luas_m2'));
  var b = ee.Number(f.get('built_m2'));
  return f.set({
    ntl_popw: ee.Number(f.get('ntl_x_pop')).divide(p),
    ntl_per_ha_terbangun: ee.Number(f.get('ntl_sum')).divide(b.divide(10000).max(0.01)),
    pct_terbangun: b.divide(luas).multiply(100),
    pct_nres: ee.Number(f.get('built_nres_m2')).divide(b.max(1)).multiply(100),
    kepadatan_pdd: p.divide(luas.divide(1e6)),
    rasio_ketergantungan: ee.Number(f.get('pop_0_14')).add(f.get('pop_65p'))
      .divide(ee.Number(f.get('pop_15_64')).max(1)).multiply(100),
    // penduduk 15-19 tahun 2025 = porsi WorldPop 2020 x penduduk GHS-POP 2025
    pop_15_19_2025: ee.Number(f.get('pop_15_19')).divide(ee.Number(f.get('pop_wp2020')).max(1)).multiply(p),
    menit_ke_kota_popw: ee.Number(f.get('akses_x_pop')).divide(p),
    lereng_popw: ee.Number(f.get('lereng_x_pop')).divide(p),
    // sentroid berbobot penduduk, dipakai untuk jarak jaringan jalan di Python
    lon_popw: ee.Number(f.get('lon_x_pop')).divide(p),
    lat_popw: ee.Number(f.get('lat_x_pop')).divide(p)
  });
});

// ---------- 6. Mean dan median per desa untuk variabel numerik per piksel ----------
var numerik = ee.Image.cat([
  viirs.rename('ntl'),
  akses,
  lereng,
  builtTotal.divide(ee.Image.pixelArea()).multiply(100).rename('pct_terbangun_px'),
  builtNres.divide(builtTotal.max(1)).multiply(100).updateMask(builtTotal.gt(0)).rename('pct_nres_px'),
  pop.divide(ee.Image.pixelArea().divide(1e6)).rename('kepadatan_pdd_px')
]);
var hasilMeanMedian = numerik.reduceRegions({
  collection: DataWilayahDesa.select(['iddesa']),
  reducer: ee.Reducer.mean().combine({ reducer2: ee.Reducer.median(), sharedInputs: true }),
  scale: 100,
  tileScale: 4
});
Export.table.toDrive({
  collection: hasilMeanMedian,
  description: 'gee01b_mean_median_' + TAHUN,
  fileFormat: 'CSV',
  selectors: ['iddesa', 'ntl_mean', 'ntl_median', 'menit_ke_kota_mean', 'menit_ke_kota_median',
    'lereng_mean', 'lereng_median', 'pct_terbangun_px_mean', 'pct_terbangun_px_median',
    'pct_nres_px_mean', 'pct_nres_px_median', 'kepadatan_pdd_px_mean', 'kepadatan_pdd_px_median']
});

Export.table.toDrive({
  collection: hasil.select(['iddesa', 'pop', 'pop_15_19_2025', 'ntl_popw', 'ntl_per_ha_terbangun',
    'pct_terbangun', 'pct_nres', 'kepadatan_pdd', 'rasio_ketergantungan',
    'menit_ke_kota_popw', 'lereng_popw', 'lon_popw', 'lat_popw'], null, false),
  description: 'gee01_cahaya_terbangun_penduduk_' + TAHUN,
  fileFormat: 'CSV'
});

// Raster penduduk 2025 untuk interpolasi dasimetrik di Python (a2_rwi_ookla)
Export.image.toDrive({
  image: pop.clip(DataWilayahDesa.geometry().bounds()).toFloat(),
  description: 'ghs_pop_2025_100m_sumbar',
  region: DataWilayahDesa.geometry().bounds(),
  scale: 100,
  crs: 'EPSG:4326',
  maxPixels: 1e10
});

Map.centerObject(DataWilayahDesa, 8);
Map.addLayer(viirs, { min: 0, max: 20, palette: ['000000', 'ffcc00', 'ffffff'] }, 'VIIRS ' + TAHUN);
Map.addLayer(builtTotal.selfMask(), { min: 0, max: 10000, palette: ['fde0dd', 'c51b8a'] }, 'Terbangun GHSL');
