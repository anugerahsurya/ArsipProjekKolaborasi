// =====================================================================
// GEE 03 - Morfologi bangunan dari Google Open Buildings v3
// Hasil per desa: jumlah bangunan, kepadatan, median luas tapak,
// proporsi bangunan kecil (< 50 m2), dan proporsi bangunan besar (> 500 m2).
// Open Buildings v3 adalah rilis tunggal (citra hingga 2023), dipakai sebagai kondisi terdekat 2025.
// =====================================================================
// DataWilayahDesa: FeatureCollection poligon desa dengan atribut 'iddesa'.

var KEYAKINAN_MIN = 0.70;

var bangunan = ee.FeatureCollection('GOOGLE/Research/open-buildings/v3/polygons')
  .filterBounds(DataWilayahDesa.geometry().bounds())
  .filter(ee.Filter.gte('confidence', KEYAKINAN_MIN));

var hasil = DataWilayahDesa.select(['iddesa']).map(function (desa) {
  var geom = desa.geometry();
  var b = bangunan.filterBounds(geom);
  var luas = b.aggregate_array('area_in_meters');
  var n = b.size();
  var luasDesaKm2 = geom.area(10).divide(1e6);
  var statistik = ee.Dictionary(ee.Algorithms.If(
    n.gt(0),
    ee.Dictionary({
      mean_tapak_m2: luas.reduce(ee.Reducer.mean()),
      median_tapak_m2: luas.reduce(ee.Reducer.median()),
      total_tapak_m2: luas.reduce(ee.Reducer.sum()),
      pct_kecil_50: b.filter(ee.Filter.lt('area_in_meters', 50)).size().divide(n).multiply(100),
      pct_besar_500: b.filter(ee.Filter.gt('area_in_meters', 500)).size().divide(n).multiply(100)
    }),
    // desa tanpa bangunan diberi -1, ubah menjadi NA di Python
    ee.Dictionary({ mean_tapak_m2: -1, median_tapak_m2: -1, total_tapak_m2: 0, pct_kecil_50: -1, pct_besar_500: -1 })
  ));
  return desa.set(statistik).set({
    jumlah_bangunan: n,
    kepadatan_bangunan_km2: n.divide(luasDesaKm2)
  }).setGeometry(null);
});

// Satu provinsi bisa berisi jutaan bangunan. Bila task gagal karena memori,
// jalankan per kab/kota: DataWilayahDesa.filter(ee.Filter.stringStartsWith('iddesa', '1371')).
Export.table.toDrive({
  collection: hasil,
  description: 'gee03_open_buildings',
  fileFormat: 'CSV',
  selectors: ['iddesa', 'jumlah_bangunan', 'kepadatan_bangunan_km2', 'mean_tapak_m2', 'median_tapak_m2',
    'total_tapak_m2', 'pct_kecil_50', 'pct_besar_500']
});

Map.centerObject(DataWilayahDesa, 12);
Map.addLayer(bangunan, { color: 'c51b8a' }, 'Open Buildings');
