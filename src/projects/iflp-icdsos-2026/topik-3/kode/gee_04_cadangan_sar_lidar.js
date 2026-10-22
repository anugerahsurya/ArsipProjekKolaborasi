// =====================================================================
// GEE 04 - Variabel cadangan pengganti Open Buildings v3 dan RWI
// Statistik zonal numerik: mean dan median. Jumlah (sum) untuk hitungan bangunan.
// Sentinel-1 SAR, GEDI (LiDAR antariksa), Open Buildings 2.5D Temporal,
// GHSL tinggi bangunan, dan cahaya malam per kapita. Tahun analisis 2025.
// =====================================================================
// DataWilayahDesa: FeatureCollection poligon desa dengan atribut 'iddesa'.

var TAHUN = 2025;
var mulai = ee.Date.fromYMD(TAHUN, 1, 1);
var akhir = mulai.advance(1, 'year');
var wilayah = DataWilayahDesa.geometry().bounds();
var desa = DataWilayahDesa.select(['iddesa']);

// Masker terbangun 2025 dari Dynamic World (dipakai ulang dari GEE 02)
var dwLabel = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
  .filterBounds(wilayah).filterDate(mulai, akhir).select('label').mode();
var terbangun = dwLabel.eq(6);
var pohon = dwLabel.eq(1);

// ---------- 1. Sentinel-1 SAR (IW, VV+VH), median 2025 ----------
var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(wilayah)
  .filterDate(mulai, akhir)
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  .select(['VV', 'VH'])
  .median(); // nilai dalam dB

var vv = s1.select('VV').rename('s1_vv_db');
var vh = s1.select('VH').rename('s1_vh_db');
var rasio = s1.select('VH').subtract(s1.select('VV')).rename('s1_vh_vv_db'); // VH/VV dalam dB
// Tekstur GLCM pada VV: dB -> skala 0-255 integer
var vvInt = s1.select('VV').unitScale(-25, 5).clamp(0, 1).multiply(255).toInt().rename('VV');
var vvTekstur = vvInt.glcmTexture({ size: 3 }).select(['VV_var', 'VV_contrast'])
  .rename(['s1_vv_glcm_var', 's1_vv_glcm_contrast']);
var sar = ee.Image.cat([vv, vh, rasio, vvTekstur]).updateMask(terbangun);

// ---------- 2. GEDI L2A (LiDAR antariksa), RH98, 2019-2025 ----------
// Footprint 25 m dan jarang; filter kualitas mengikuti panduan GEDI.
var gedi = ee.ImageCollection('LARSE/GEDI/GEDI02_A_002_MONTHLY')
  .filterBounds(wilayah)
  .filterDate('2019-04-01', akhir)
  .map(function (img) {
    var ok = img.select('quality_flag').eq(1)
      .and(img.select('degrade_flag').eq(0))
      .and(img.select('sensitivity').gt(0.95));
    return img.select('rh98').updateMask(ok);
  })
  .median();
var gediTerbangun = gedi.updateMask(terbangun).rename('gedi_rh98_terbangun'); // tinggi struktur di kawasan terbangun
var gediPohon = gedi.updateMask(pohon).rename('gedi_rh98_pohon');            // tinggi tajuk: kebun rakyat vs hutan
var gediAda = gedi.mask().rename('gedi_n_footprint');

// ---------- 3. Open Buildings 2.5D Temporal (2016-2023, 4 m) ----------
var obt = ee.ImageCollection('GOOGLE/Research/open-buildings-temporal/v1').filterBounds(wilayah);
// Stempel waktu tiap tahun bukan tepat 30 Juni 00:00 UTC, jadi filter per rentang tahun,
// bukan ee.Filter.eq pada inference_time_epoch_s (hasilnya koleksi kosong, citra tanpa band).
function obtTahun(th) {
  return obt.filterDate(th + '-01-01', (th + 1) + '-01-01').mosaic();
}
print('Jumlah tile Open Buildings Temporal 2023:', obt.filterDate('2023-01-01', '2024-01-01').size());
var ob2023 = obtTahun(2023);
var ob2016 = obtTahun(2016);
var obCount2023 = ob2023.select('building_fractional_count').rename('obt_jumlah_2023');
var obCount2016 = ob2016.select('building_fractional_count').rename('obt_jumlah_2016');
var obTinggi = ob2023.select('building_height').updateMask(ob2023.select('building_presence').gt(0.5))
  .rename('obt_tinggi_m');

// ---------- 4. GHSL tinggi bangunan rata-rata (2018, 100 m) ----------
var ghsH = ee.Image('JRC/GHSL/P2023A/GHS_BUILT_H/2018').select('built_height').rename('ghs_tinggi_m');

// ---------- 5. Cahaya malam per kapita 2025 (pengganti RWI) ----------
var viirs = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG')
  .filterDate(mulai, akhir)
  .map(function (img) { return img.select('avg_rad').updateMask(img.select('cf_cvg').gt(0)).max(0); })
  .median();
var pop = ee.Image('JRC/GHSL/P2023A/GHS_POP/2025').select('population_count');
var ntlSum = viirs.multiply(ee.Image.pixelArea()).divide(250000).rename('ntl_sum_100m');

// ---------- 6. Statistik zonal ----------
// Numerik: mean dan median
var hasilSar = sar.addBands([gediTerbangun, gediPohon, ghsH]).reduceRegions({
  collection: desa,
  reducer: ee.Reducer.mean().combine({ reducer2: ee.Reducer.median(), sharedInputs: true }),
  scale: 25, tileScale: 8
});
var hasilGediN = gediAda.reduceRegions({ collection: desa, reducer: ee.Reducer.sum(), scale: 25, tileScale: 8 });
// Open Buildings Temporal: jumlah = jumlah fractional count piksel 4 m (berat; jalankan per kab/kota bila perlu)
var hasilObt = ee.Image.cat([obCount2023, obCount2016]).reduceRegions({
  collection: desa, reducer: ee.Reducer.sum(), scale: 4, tileScale: 16
}).map(function (f) {
  var n23 = ee.Number(f.get('obt_jumlah_2023'));
  var n16 = ee.Number(f.get('obt_jumlah_2016')).max(1);
  // laju pertumbuhan tahunan jumlah bangunan 2016-2023
  return f.set('obt_tumbuh_per_tahun', n23.divide(n16).pow(1 / 7).subtract(1));
});
var hasilObtTinggi = obTinggi.reduceRegions({
  collection: desa,
  reducer: ee.Reducer.mean().combine({ reducer2: ee.Reducer.median(), sharedInputs: true }),
  scale: 4, tileScale: 16
});
var hasilNtl = ee.Image.cat([ntlSum, pop.rename('pop')]).reduceRegions({
  collection: desa, reducer: ee.Reducer.sum(), scale: 100, tileScale: 4
}).map(function (f) {
  return f.set('ntl_per_kapita', ee.Number(f.get('ntl_sum_100m')).divide(ee.Number(f.get('pop')).max(1)).multiply(1000));
});

function ekspor(fc, kolom, nama) {
  Export.table.toDrive({ collection: fc, description: nama, fileFormat: 'CSV', selectors: ['iddesa'].concat(kolom) });
}
var kolomSar = [];
['s1_vv_db', 's1_vh_db', 's1_vh_vv_db', 's1_vv_glcm_var', 's1_vv_glcm_contrast',
  'gedi_rh98_terbangun', 'gedi_rh98_pohon', 'ghs_tinggi_m'].forEach(function (b) {
  kolomSar.push(b + '_mean'); kolomSar.push(b + '_median');
});
ekspor(hasilSar, kolomSar, 'gee04a_sar_gedi_' + TAHUN);
ekspor(hasilGediN.map(function (f) { return f.set('gedi_n_footprint', f.get('sum')); }), ['gedi_n_footprint'], 'gee04b_gedi_jumlah_footprint');
ekspor(hasilObt, ['obt_jumlah_2023', 'obt_jumlah_2016', 'obt_tumbuh_per_tahun'], 'gee04c_open_buildings_temporal');
ekspor(hasilObtTinggi.map(function (f) {
  return f.set({ obt_tinggi_m_mean: f.get('mean'), obt_tinggi_m_median: f.get('median') });
}), ['obt_tinggi_m_mean', 'obt_tinggi_m_median'], 'gee04d_obt_tinggi');
ekspor(hasilNtl, ['ntl_per_kapita'], 'gee04e_ntl_per_kapita_' + TAHUN);

Map.centerObject(DataWilayahDesa, 10);
Map.addLayer(vv, { min: -20, max: 5 }, 'Sentinel-1 VV (terbangun)');
Map.addLayer(obCount2023, { min: 0, max: 0.2, palette: ['ffffff', 'c51b8a'] }, 'Open Buildings Temporal 2023');
Map.addLayer(gedi, { min: 0, max: 30, palette: ['ffffcc', '006837'] }, 'GEDI RH98');
