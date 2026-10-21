// =====================================================================
// GEE 02 - Sentinel-2 (indeks spektral dan tekstur) serta tutupan lahan
// Hasil: indeks spektral di kawasan terbangun, tekstur GLCM, proporsi lahan.
// =====================================================================
// DataWilayahDesa: FeatureCollection poligon desa dengan atribut 'iddesa'.

var TAHUN = 2024;
var mulai = ee.Date.fromYMD(TAHUN, 1, 1);
var akhir = mulai.advance(1, 'year');
var wilayah = DataWilayahDesa.geometry().bounds();

// ---------- 1. Komposit Sentinel-2 SR dengan masker awan Cloud Score+ ----------
var csPlus = ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED');
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(wilayah)
  .filterDate(mulai, akhir)
  .linkCollection(csPlus, ['cs'])
  .map(function (img) {
    return img.updateMask(img.select('cs').gte(0.6))
      .select(['B2', 'B3', 'B4', 'B8', 'B11', 'B12'])
      .divide(10000);
  })
  .median()
  .clip(wilayah);

// ---------- 2. Indeks spektral ----------
var ndvi = s2.normalizedDifference(['B8', 'B4']).rename('ndvi');     // (NIR - Red) / (NIR + Red)
var ndbi = s2.normalizedDifference(['B11', 'B8']).rename('ndbi');    // (SWIR1 - NIR) / (SWIR1 + NIR)
var mndwi = s2.normalizedDifference(['B3', 'B11']).rename('mndwi');  // (Green - SWIR1) / (Green + SWIR1)
var bsi = s2.expression(
  '((S + R) - (N + B)) / ((S + R) + (N + B))',
  { S: s2.select('B11'), R: s2.select('B4'), N: s2.select('B8'), B: s2.select('B2') }
).rename('bsi');                                                     // indeks tanah terbuka

// ---------- 3. Tekstur GLCM pada band NIR (10 m), jendela 3x3 piksel ----------
var nirInt = s2.select('B8').multiply(255).toInt();
var glcm = nirInt.glcmTexture({ size: 3 });
var tekstur = glcm.select(['B8_contrast', 'B8_var', 'B8_ent'])
  .rename(['glcm_contrast', 'glcm_var', 'glcm_ent']);

// ---------- 4. Masker kawasan terbangun dari Dynamic World ----------
var dw = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
  .filterBounds(wilayah)
  .filterDate(mulai, akhir);
var dwProb = dw.select(['built', 'crops', 'trees', 'grass', 'shrub_and_scrub', 'water', 'bare']).mean();
var dwLabel = dw.select('label').mode();
var maskTerbangun = dwLabel.eq(6); // 6 = built

// Indeks spektral dan tekstur hanya dihitung di piksel terbangun
var spektralTerbangun = ee.Image.cat([ndvi, ndbi, mndwi, bsi, tekstur]).updateMask(maskTerbangun);

// ---------- 5. Proporsi tutupan lahan (Dynamic World dan ESA WorldCover) ----------
var dwKelas = ee.Image.cat([
  dwLabel.eq(4).rename('dw_crops'),
  dwLabel.eq(1).rename('dw_trees'),
  dwLabel.eq(6).rename('dw_built'),
  dwLabel.eq(7).rename('dw_bare')
]);
var wc = ee.Image('ESA/WorldCover/v200/2021').select('Map');
var wcKelas = ee.Image.cat([
  wc.eq(40).rename('wc_cropland'),
  wc.eq(10).rename('wc_tree'),
  wc.eq(50).rename('wc_built')
]);

// ---------- 6. Statistik zonal per desa ----------
var redMean = ee.Reducer.mean();
var desa = DataWilayahDesa.select(['iddesa']);

var hasilSpektral = spektralTerbangun.reduceRegions({
  collection: desa, reducer: redMean, scale: 10, tileScale: 8
});
var hasilLahan = ee.Image.cat([dwKelas, wcKelas]).reduceRegions({
  collection: desa, reducer: redMean, scale: 10, tileScale: 8
}); // rata-rata dummy = proporsi luas desa

Export.table.toDrive({
  collection: hasilSpektral.select(['iddesa', 'ndvi', 'ndbi', 'mndwi', 'bsi',
    'glcm_contrast', 'glcm_var', 'glcm_ent'], null, false),
  description: 'gee02a_sentinel2_terbangun_' + TAHUN,
  fileFormat: 'CSV'
});
Export.table.toDrive({
  collection: hasilLahan.select(['iddesa', 'dw_crops', 'dw_trees', 'dw_built', 'dw_bare',
    'wc_cropland', 'wc_tree', 'wc_built'], null, false),
  description: 'gee02b_tutupan_lahan_' + TAHUN,
  fileFormat: 'CSV'
});

Map.centerObject(DataWilayahDesa, 9);
Map.addLayer(s2, { bands: ['B4', 'B3', 'B2'], min: 0, max: 0.3 }, 'Sentinel-2 RGB');
Map.addLayer(ndbi.updateMask(maskTerbangun), { min: -0.3, max: 0.3, palette: ['2c7bb6', 'ffffbf', 'd7191c'] }, 'NDBI terbangun');
Map.addLayer(tekstur.select('glcm_var').updateMask(maskTerbangun), { min: 0, max: 200 }, 'GLCM variance');
