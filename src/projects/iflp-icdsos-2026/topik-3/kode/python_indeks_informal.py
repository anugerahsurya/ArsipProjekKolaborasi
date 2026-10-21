"""
Indeks Ekonomi Informal Tingkat Desa - Sumatera Barat 2025 (Lembar 3)
Tahun analisis 2025, mengikuti PODES 2025.
Satu berkas Python untuk semua langkah di luar GEE dan R.

  BAGIAN A  PENGUMPULAN DATA
    a1_poi_jalan    POI Overture dan OSM, kerapatan jalan, jarak jaringan ke bank/pasar
    a2_rwi_ookla    Relative Wealth Index dan Ookla, interpolasi dasimetrik ke desa
    a3_cadangan_grdi  (cadangan) GRDI pengganti RWI, rata-rata berbobot penduduk
  BAGIAN B  PENGOLAHAN
    b1_indikator    PODES 2025, penggabungan semua sumber, normalisasi, arah indikator
    b2_indeks       PCA berjenjang, bobot entropi, agregasi, Monte Carlo
    (GW-PCA dijalankan di R: r_05_gwpca.R, di antara b2 dan b3)
    b3_validasi_kalibrasi  validasi kab/kota, validitas konvergen, kalibrasi top-down
    b4_spasial_tipologi    Moran's I, LISA, Gi*, tipologi, nagari prioritas

Urutan lengkap: gee_01, gee_02, gee_03 (Earth Engine) -> a1, a2 -> b1, b2 -> r_05 -> b3, b4.

Kebutuhan:
  pip install geopandas osmnx networkx pandas numpy pyarrow shapely overturemaps mercantile \
              exactextract rasterio scikit-learn factor_analyzer scipy statsmodels libpysal esda

DataWilayahDesa: GeoDataFrame poligon desa Sumatera Barat 2025 dengan kolom 'iddesa'
(10 digit, sama dengan kode PODES), CRS EPSG:4326.
Contoh: DataWilayahDesa = gpd.read_file("batas_desa_sumbar_2025.gpkg")[["iddesa", "geometry"]]
"""

import geopandas as gpd
import mercantile
import networkx as nx
import numpy as np
import osmnx as ox
import pandas as pd
import statsmodels.api as sm
from esda.getisord import G_Local
from esda.moran import Moran, Moran_Local
from exactextract import exact_extract
from factor_analyzer.factor_analyzer import calculate_bartlett_sphericity, calculate_kmo
from libpysal import weights
from scipy.optimize import brentq
from scipy.special import expit, logit
from scipy.stats import rankdata, spearmanr
from shapely import wkt
from shapely.geometry import box
from sklearn.decomposition import PCA
from statsmodels.stats.multitest import fdrcorrection

# =====================================================================
# BAGIAN A. PENGUMPULAN DATA
# =====================================================================

def a1_poi_jalan():
    """
    POI usaha (OSM dan Overture), kerapatan jalan, jarak jaringan ke bank/pasar.

    Kebutuhan:  pip install geopandas osmnx networkx pandas pyarrow shapely overturemaps
    Masukan:    DataWilayahDesa  -> GeoDataFrame poligon desa dengan kolom 'iddesa' (CRS EPSG:4326)
                gee01_cahaya_terbangun_penduduk_2025.csv (lon_popw, lat_popw, pop dari skrip GEE 01)
    Keluaran:   py01_poi_jalan.csv

    Unduh POI Overture sekali lewat terminal (bbox Sumatera Barat):
        overturemaps download --bbox=98.5,-3.6,101.95,1.0 -f geoparquet --type=place -o places_sumbar.parquet
    """
    # DataWilayahDesa = gpd.read_file("batas_desa_sumbar_2025.gpkg")[["iddesa", "geometry"]]
    CRS_METER = "EPSG:32747"  # UTM 47S, cocok untuk Sumatera Barat
    desa = DataWilayahDesa[["iddesa", "geometry"]].to_crs(4326)
    desa_m = desa.to_crs(CRS_METER)
    desa_m["luas_km2"] = desa_m.area / 1e6
    batas = desa.union_all()

    gee01 = pd.read_csv("gee01_cahaya_terbangun_penduduk_2025.csv", dtype={"iddesa": str})

    # ---------------------------------------------------------------------
    # 1. POI Overture: usaha kecil vs bermerek
    # ---------------------------------------------------------------------
    places = gpd.read_parquet("places_sumbar.parquet").to_crs(4326)
    places = places[places["confidence"] >= 0.5].copy()
    places["kategori"] = places["categories"].apply(lambda c: (c or {}).get("primary") or "")
    places["bermerek"] = places["brand"].apply(lambda b: bool(b) and bool((b.get("names") or {}).get("primary")))

    KATEGORI_KECIL = (
        "convenience_store", "grocery_store", "food_stand", "street_vendor", "restaurant", "cafe",
        "coffee_shop", "bakery", "market", "farmers_market", "clothing_store", "hardware_store",
        "beauty_salon", "barber", "laundry", "tailor", "motorcycle_repair", "auto_repair",
    )
    places["usaha_kecil"] = places["kategori"].str.contains("|".join(KATEGORI_KECIL), na=False) & ~places["bermerek"]

    pl = gpd.sjoin(places[["usaha_kecil", "bermerek", "geometry"]], desa, predicate="within")
    poi = pl.groupby("iddesa").agg(
        poi_total=("usaha_kecil", "size"),
        poi_kecil=("usaha_kecil", "sum"),
        poi_bermerek=("bermerek", "sum"),
    ).reset_index()

    # ---------------------------------------------------------------------
    # 2. POI OSM: toko dan fasilitas keuangan (pelengkap Overture)
    # ---------------------------------------------------------------------
    tags = {"shop": True, "amenity": ["marketplace", "bank", "atm", "restaurant", "cafe", "fast_food"]}
    osm = ox.features_from_polygon(batas, tags=tags)
    osm = osm.reset_index()[["shop", "amenity", "geometry"]].copy()
    osm["geometry"] = osm.geometry.representative_point()
    osm["osm_toko"] = osm["shop"].notna()
    osm["osm_bank_atm"] = osm["amenity"].isin(["bank", "atm"])
    osm["osm_pasar"] = osm["amenity"].eq("marketplace")
    osm_j = gpd.sjoin(osm, desa, predicate="within").groupby("iddesa")[["osm_toko", "osm_bank_atm", "osm_pasar"]].sum().reset_index()

    # Kernel density 500 m dari titik POI kecil, dievaluasi di titik representatif tiap desa
    # (mengurangi efek batas desa yang memotong pusat pasar).
    from sklearn.neighbors import KernelDensity

    pts = places[places["usaha_kecil"]].to_crs(CRS_METER)
    xy = np.c_[pts.geometry.x, pts.geometry.y]
    kde = KernelDensity(bandwidth=500, kernel="gaussian").fit(xy)
    cent = desa_m.copy()
    cent["geometry"] = desa_m.geometry.representative_point()
    dens = np.exp(kde.score_samples(np.c_[cent.geometry.x, cent.geometry.y])) * len(xy) * 1e6  # per km2
    kde_df = pd.DataFrame({"iddesa": desa_m["iddesa"], "kde_poi_kecil_km2": dens})

    # ---------------------------------------------------------------------
    # 3. Jaringan jalan OSM: kerapatan jalan dan jarak jaringan ke bank/pasar
    # ---------------------------------------------------------------------
    G = ox.graph_from_polygon(batas, network_type="drive", simplify=True)
    edges = ox.graph_to_gdfs(G, nodes=False).to_crs(CRS_METER)[["highway", "geometry"]]
    ruas = gpd.overlay(edges, desa_m[["iddesa", "geometry"]], how="intersection", keep_geom_type=True)
    ruas["km"] = ruas.length / 1000
    jalan = ruas.groupby("iddesa")["km"].sum().rename("jalan_km").reset_index()

    # Satu Dijkstra multi-sumber dari semua simpul bank: jarak tiap simpul ke bank terdekat.
    def jarak_ke_terdekat(G, titik_tujuan):
        simpul_tujuan = set(ox.distance.nearest_nodes(G, titik_tujuan.geometry.x, titik_tujuan.geometry.y))
        Gu = G.to_undirected()
        return nx.multi_source_dijkstra_path_length(Gu, simpul_tujuan, weight="length")

    bank = osm[osm["osm_bank_atm"]].to_crs(4326)
    pasar = osm[osm["osm_pasar"]].to_crs(4326)
    d_bank = jarak_ke_terdekat(G, bank)
    d_pasar = jarak_ke_terdekat(G, pasar)

    # Titik asal = sentroid berbobot penduduk dari GEE 01, bukan sentroid geometris.
    asal = gee01[["iddesa", "lon_popw", "lat_popw"]].dropna()
    simpul_asal = ox.distance.nearest_nodes(G, asal["lon_popw"], asal["lat_popw"])
    asal = asal.assign(
        jarak_bank_km=[d_bank.get(n, np.nan) / 1000 for n in simpul_asal],
        jarak_pasar_km=[d_pasar.get(n, np.nan) / 1000 for n in simpul_asal],
    )[["iddesa", "jarak_bank_km", "jarak_pasar_km"]]

    # ---------------------------------------------------------------------
    # 4. Gabungkan dan hitung indikator per luas atau per penduduk
    # ---------------------------------------------------------------------
    out = (
        desa_m[["iddesa", "luas_km2"]]
        .merge(gee01[["iddesa", "pop"]], on="iddesa", how="left")
        .merge(poi, on="iddesa", how="left")
        .merge(osm_j, on="iddesa", how="left")
        .merge(kde_df, on="iddesa", how="left")
        .merge(jalan, on="iddesa", how="left")
        .merge(asal, on="iddesa", how="left")
    )
    hitung = ["poi_total", "poi_kecil", "poi_bermerek", "osm_toko", "osm_bank_atm", "osm_pasar", "jalan_km"]
    out[hitung] = out[hitung].fillna(0)
    out["poi_kecil_per_1000pdd"] = 1000 * out["poi_kecil"] / out["pop"].clip(lower=1)
    out["pct_poi_bermerek"] = np.where(out["poi_total"] > 0, 100 * out["poi_bermerek"] / out["poi_total"], np.nan)
    out["kerapatan_jalan_km_km2"] = out["jalan_km"] / out["luas_km2"]
    out["flag_poi_kosong"] = (out["poi_total"] == 0).astype(int)  # penanda kelengkapan data
    out.to_csv("py01_poi_jalan.csv", index=False)
    print(out.describe().T)

def a2_rwi_ookla():
    """
    Relative Wealth Index (Meta, grid 2,4 km) dan kecepatan internet Ookla (tile ~610 m)
    diturunkan ke desa dengan interpolasi areal dasimetrik berbobot penduduk.

    Kebutuhan:  pip install geopandas pandas pyarrow mercantile shapely exactextract rasterio
    Masukan:    DataWilayahDesa  -> GeoDataFrame poligon desa, kolom 'iddesa'
                idn_relative_wealth_index.csv (HDX: data.humdata.org, "Relative Wealth Index - Indonesia")
                ghs_pop_2025_100m_sumbar.tif  (raster penduduk GHS-POP 2025, ekspor dari skrip GEE 01)
    Keluaran:   py02_rwi_ookla.csv
    """
    RASTER_POP = "ghs_pop_2025_100m_sumbar.tif"
    desa = DataWilayahDesa[["iddesa", "geometry"]].to_crs(4326)
    xmin, ymin, xmax, ymax = desa.total_bounds


    def dasimetrik(sel: gpd.GeoDataFrame, kolom: list[str], bobot_tambahan: str | None = None) -> pd.DataFrame:
        """x_d = sum_c (pop_cd / sum_c pop_cd) * x_c ; pop_cd = penduduk di irisan sel c dan desa d."""
        iris = gpd.overlay(sel, desa, how="intersection", keep_geom_type=True)
        iris["pop_cd"] = exact_extract(RASTER_POP, iris, "sum", output="pandas")["sum"].fillna(0).values
        iris["w"] = iris["pop_cd"] * (iris[bobot_tambahan] if bobot_tambahan else 1)
        hasil = {}
        for k in kolom:
            num = (iris["w"] * iris[k]).groupby(iris["iddesa"]).sum()
            den = iris["w"].where(iris[k].notna()).groupby(iris["iddesa"]).sum()
            hasil[k] = num / den.replace(0, np.nan)
        return pd.DataFrame(hasil).reset_index()


    # ---------------------------------------------------------------------
    # 1. RWI: titik pusat quadkey zoom 14 -> poligon tile
    # ---------------------------------------------------------------------
    rwi = pd.read_csv("idn_relative_wealth_index.csv", dtype={"quadkey": str})
    rwi = rwi[(rwi.longitude.between(xmin, xmax)) & (rwi.latitude.between(ymin, ymax))].copy()
    rwi["geometry"] = [box(*mercantile.bounds(mercantile.quadkey_to_tile(q))) for q in rwi["quadkey"]]
    rwi = gpd.GeoDataFrame(rwi[["rwi", "error", "geometry"]], crs=4326)
    rwi_desa = dasimetrik(rwi, ["rwi"])

    # ---------------------------------------------------------------------
    # 2. Ookla Open Data, seluler, empat kuartal 2025 (rata-rata kecepatan berbobot jumlah tes)
    # ---------------------------------------------------------------------
    URL = "https://ookla-open-data.s3.amazonaws.com/parquet/performance/type={t}/year=2025/quarter={q}/2025-{m:02d}-01_performance_{t}_tiles.parquet"
    bagian = []
    for q, m in zip([1, 2, 3, 4], [1, 4, 7, 10]):
        df = pd.read_parquet(URL.format(t="mobile", q=q, m=m), columns=["tile", "avg_d_kbps", "avg_u_kbps", "tests"])
        bagian.append(df)
    ookla = pd.concat(bagian)
    ookla["geometry"] = ookla["tile"].apply(wkt.loads)
    ookla = gpd.GeoDataFrame(ookla.drop(columns="tile"), crs=4326).cx[xmin:xmax, ymin:ymax]
    # rata-rata empat kuartal per tile, berbobot jumlah tes
    ookla["d_x_t"] = ookla["avg_d_kbps"] * ookla["tests"]
    ookla["key"] = ookla.geometry.to_wkt()
    agg = ookla.groupby("key").agg(d_x_t=("d_x_t", "sum"), tests=("tests", "sum"))
    agg["unduh_mbps"] = agg["d_x_t"] / agg["tests"] / 1000
    agg = gpd.GeoDataFrame(agg.reset_index(), geometry=gpd.GeoSeries.from_wkt(agg.index), crs=4326)
    agg["log_tests"] = np.log1p(agg["tests"])
    ookla_desa = dasimetrik(agg[["unduh_mbps", "log_tests", "geometry"]], ["unduh_mbps"], bobot_tambahan="log_tests")

    # ---------------------------------------------------------------------
    # 3. Desa tanpa tile Ookla: isi dengan rata-rata 5 tetangga terdekat dan beri penanda
    # ---------------------------------------------------------------------
    out = desa[["iddesa"]].merge(rwi_desa, on="iddesa", how="left").merge(ookla_desa, on="iddesa", how="left")
    out["flag_ookla_imputasi"] = out["unduh_mbps"].isna().astype(int)
    cent = desa.to_crs("EPSG:32747").geometry.representative_point()
    xy = np.c_[cent.x, cent.y]
    ada = out["unduh_mbps"].notna().values
    from sklearn.neighbors import NearestNeighbors

    nn = NearestNeighbors(n_neighbors=5).fit(xy[ada])
    _, idx = nn.kneighbors(xy[~ada])
    out.loc[~ada, "unduh_mbps"] = out.loc[ada, "unduh_mbps"].values[idx].mean(axis=1)
    out["log_unduh_mbps"] = np.log1p(out["unduh_mbps"])
    out.to_csv("py02_rwi_ookla.csv", index=False)
    print(out.describe().T)

def a3_cadangan_grdi():
    """
    CADANGAN pengganti RWI: Global Gridded Relative Deprivation Index (GRDI v1, CIESIN 2022, 1 km).
    Nilai tinggi = deprivasi lebih tinggi. Diturunkan ke desa sebagai rata-rata berbobot penduduk 2025.

    Masukan:    DataWilayahDesa, povmap-grdi-v1.tif (unduh dari SEDAC/Earthdata, perlu akun Earthdata),
                ghs_pop_2025_100m_sumbar.tif (ekspor GEE 01)
    Keluaran:   a3_grdi.csv  -> gabungkan di b1_indikator bila RWI tidak dipakai
    """
    import rasterio
    from rasterio.warp import Resampling, reproject

    desa = DataWilayahDesa[["iddesa", "geometry"]].to_crs(4326)
    # Samakan grid GRDI (1 km) ke grid penduduk 100 m agar bobot penduduk bisa dipakai per sel
    with rasterio.open("ghs_pop_2025_100m_sumbar.tif") as pop_src, rasterio.open("povmap-grdi-v1.tif") as g_src:
        prof = pop_src.profile.copy()
        grdi_100 = np.full((pop_src.height, pop_src.width), np.nan, dtype="float32")
        reproject(
            source=rasterio.band(g_src, 1), destination=grdi_100,
            dst_transform=pop_src.transform, dst_crs=pop_src.crs,
            dst_nodata=np.nan, resampling=Resampling.nearest,
        )
    prof.update(dtype="float32", nodata=np.nan, count=1)
    with rasterio.open("grdi_100m_sumbar.tif", "w", **prof) as dst:
        dst.write(grdi_100, 1)

    # rata-rata berbobot penduduk: x_d = sum f*P*x / sum f*P (exactextract menghitung fraksi f)
    out = exact_extract("grdi_100m_sumbar.tif", desa, "weighted_mean",
                        weights="ghs_pop_2025_100m_sumbar.tif", output="pandas", include_cols=["iddesa"])
    out = out.rename(columns={"weighted_mean": "grdi"})
    out.to_csv("a3_grdi.csv", index=False)
    print(out.describe().T)

# =====================================================================
# BAGIAN B. PENGOLAHAN
# =====================================================================

def b1_indikator():
    """
    Variabel PODES 2025, penggabungan semua sumber, dan penyiapan indikator.

    Langkah: normalisasi per keluarga/penduduk -> winsorizing p1-p99 -> log untuk distribusi miring
             -> min-max 0-1 -> arah diseragamkan (nilai tinggi = lebih informal).
    Masukan:  podes2025_desa_p1.csv, podes2025_desa_p2.csv (BPS), keluaran GEE 01-03, Python 01-02
    Keluaran: indikator_desa.csv (siap untuk b2_indeks)
    """
    ID = "iddesa"
    rd = lambda f: pd.read_csv(f, dtype={ID: str})

    # ---------------------------------------------------------------------
    # 1. PODES: filter Sumatera Barat (R101 = 13) dan bentuk iddesa 10 digit
    # ---------------------------------------------------------------------
    p1 = pd.read_csv("podes2025_desa_p1.csv", dtype=str)
    p2 = pd.read_csv("podes2025_desa_p2.csv", dtype=str)
    for p in (p1, p2):
        p[ID] = p["r101"].str.zfill(2) + p["r102"].str.zfill(2) + p["r103"].str.zfill(3) + p["r104"].str.zfill(3)
    podes = p1.merge(p2, on=ID, suffixes=("", "_p2"))
    podes = podes[podes["r101"] == "13"].copy()

    num = lambda cols: podes[cols].apply(pd.to_numeric, errors="coerce").fillna(0)
    podes["keluarga"] = num(["r501a1", "r501a2", "r501b"]).sum(axis=1)
    podes["pasar_tanpa_bangunan"] = num(["r905dk2"]).sum(axis=1)
    podes["pasar_semi"] = num(["r905ck2"]).sum(axis=1)
    podes["pasar_permanen"] = num(["r905bk2"]).sum(axis=1)
    podes["warung_makan"] = num(["r905gk2"]).sum(axis=1)
    podes["kelontong"] = num(["r905jk2"]).sum(axis=1)
    podes["minimarket"] = num(["r905ek2"]).sum(axis=1)
    podes["imk"] = num(["r907a"]).sum(axis=1)
    podes["bank"] = num(["r902a1", "r902a2", "r902a3"]).sum(axis=1)
    podes["koperasi"] = num(["r903a", "r903b", "r903c", "r903d"]).sum(axis=1)
    podes["jenis_kredit"] = (num(["r904a", "r904b", "r904c", "r904d"]) == 1).sum(axis=1)  # 1 = ada
    podes["jarak_bank_podes_km"] = pd.to_numeric(podes["r902b"], errors="coerce")
    podes["dummy_pertanian"] = (podes["r906a"] == "1").astype(int)  # 1 = pertanian (cek kodebook)
    podes["perkotaan"] = (podes["r105"] == "1").astype(int)
    # Variabel pendidikan dan sinyal: ganti nama kolom sesuai metadata PODES 2025
    KOLOM_SMA_SMK = []   # contoh: ["r701...","r701..."]  (cek metadata)
    podes["sma_smk"] = num(KOLOM_SMA_SMK).sum(axis=1) if KOLOM_SMA_SMK else np.nan

    per_kk = ["pasar_tanpa_bangunan", "pasar_semi", "pasar_permanen", "warung_makan", "kelontong",
              "minimarket", "imk", "koperasi"]
    for c in per_kk:
        podes[f"{c}_per1000kk"] = 1000 * podes[c] / podes["keluarga"].clip(lower=1)

    # ---------------------------------------------------------------------
    # 2. Gabungkan dengan fitur geospasial
    # ---------------------------------------------------------------------
    df = (
        podes[[ID, "keluarga", "perkotaan", "dummy_pertanian", "bank", "jenis_kredit", "jarak_bank_podes_km", "sma_smk"]
              + [f"{c}_per1000kk" for c in per_kk]]
        .merge(rd("gee01_cahaya_terbangun_penduduk_2025.csv"), on=ID, how="left")
        .merge(rd("gee02a_sentinel2_terbangun_2025.csv"), on=ID, how="left")
        .merge(rd("gee02b_tutupan_lahan_2025.csv"), on=ID, how="left")
        .merge(rd("gee02c_modus_lahan_2025.csv"), on=ID, how="left")
        .merge(rd("gee01b_mean_median_2025.csv"), on=ID, how="left")
        .merge(rd("gee03_open_buildings.csv").replace(-1, np.nan), on=ID, how="left")
        .merge(rd("py01_poi_jalan.csv"), on=ID, how="left", suffixes=("", "_py01"))
        .merge(rd("py02_rwi_ookla.csv"), on=ID, how="left")
    )
    # Variabel cadangan (opsional): SAR, GEDI, Open Buildings Temporal, GRDI, cahaya per kapita.
    # Tambahkan ke INDIKATOR di bawah bila dipakai untuk menggantikan Open Buildings v3 atau RWI.
    import os
    for f in ["gee04a_sar_gedi_2025.csv", "gee04c_open_buildings_temporal.csv", "gee04d_obt_tinggi.csv",
              "gee04e_ntl_per_kapita_2025.csv", "a3_grdi.csv"]:
        if os.path.exists(f):
            df = df.merge(rd(f), on=ID, how="left")
    dewasa = df["pop"] * 0.65  # pendekatan penduduk 15+ bila tabel umur tidak dipakai
    df["bank_per10rb_dewasa"] = 1e4 * (df["bank"] + df["osm_bank_atm"]) / dewasa.clip(lower=1)  # SDG 8.10.1
    df["sma_smk_per1000_15_19"] = 1000 * df["sma_smk"] / df["pop_15_19_2025"].clip(lower=1)
    df["pct_lahan_tani"] = 100 * (df["dw_crops"].fillna(0) + df["wc_cropland"].fillna(0)) / 2

    # ---------------------------------------------------------------------
    # 3. Kamus indikator: dimensi dan arah (+1 = makin tinggi makin informal)
    # ---------------------------------------------------------------------
    INDIKATOR = {
        # dimensi 1 intensitas aktivitas
        "ntl_per_ha_terbangun": ("D1_intensitas", -1),
        "pct_nres": ("D1_intensitas", -1),
        # dimensi 2 morfologi bangunan dan tekstur citra
        "kepadatan_bangunan_km2": ("D2_morfologi", +1),
        "median_tapak_m2": ("D2_morfologi", -1),
        "pct_kecil_50": ("D2_morfologi", +1),
        "glcm_var_mean": ("D2_morfologi", +1),          # alternatif: glcm_var_median
        "ndvi_mean": ("D2_morfologi", -1),              # alternatif: ndvi_median
        # dimensi 3 struktur usaha
        "poi_kecil_per_1000pdd": ("D3_usaha", +1),
        "pct_poi_bermerek": ("D3_usaha", -1),
        "pasar_tanpa_bangunan_per1000kk": ("D3_usaha", +1),
        "warung_makan_per1000kk": ("D3_usaha", +1),
        "kelontong_per1000kk": ("D3_usaha", +1),
        "imk_per1000kk": ("D3_usaha", +1),
        "minimarket_per1000kk": ("D3_usaha", -1),
        # dimensi 4 aksesibilitas
        "menit_ke_kota_popw": ("D4_akses", +1),
        "jarak_pasar_km": ("D4_akses", +1),
        "kerapatan_jalan_km_km2": ("D4_akses", -1),
        "lereng_popw": ("D4_akses", +1),
        # dimensi 5 penduduk dan SDM
        "rasio_ketergantungan": ("D5_sdm", +1),
        "sma_smk_per1000_15_19": ("D5_sdm", -1),
        # dimensi 6 struktur lahan
        "pct_lahan_tani": ("D6_lahan", +1),
        "wc_tree": ("D6_lahan", +1),
        # dimensi 7 keuangan, kesejahteraan, digital
        "bank_per10rb_dewasa": ("D7_keuangan", -1),
        "jarak_bank_km": ("D7_keuangan", +1),
        "koperasi_per1000kk": ("D7_keuangan", -1),
        "jenis_kredit": ("D7_keuangan", -1),
        "rwi": ("D7_keuangan", -1),
        "log_unduh_mbps": ("D7_keuangan", -1),
        # --- cadangan, aktifkan bila menggantikan variabel utama ---
        # "obt_jumlah_2023": ("D2_morfologi", +1),        # pengganti kepadatan Open Buildings v3 (bagi luas desa)
        # "obt_tumbuh_per_tahun": ("D2_morfologi", +1),
        # "s1_vv_glcm_var_mean": ("D2_morfologi", +1),
        # "gedi_rh98_terbangun_median": ("D1_intensitas", -1),    # bangunan bertingkat = formal
        # "ghs_tinggi_m_mean": ("D1_intensitas", -1),
        # "grdi": ("D7_keuangan", +1),                    # pengganti RWI (deprivasi tinggi = informal)
        # "ntl_per_kapita": ("D7_keuangan", -1),
    }
    LOG = ["ntl_per_ha_terbangun", "kepadatan_bangunan_km2", "median_tapak_m2", "poi_kecil_per_1000pdd",
           "pasar_tanpa_bangunan_per1000kk", "warung_makan_per1000kk", "kelontong_per1000kk", "imk_per1000kk",
           "minimarket_per1000kk", "menit_ke_kota_popw", "jarak_pasar_km", "kerapatan_jalan_km_km2",
           "bank_per10rb_dewasa", "jarak_bank_km", "koperasi_per1000kk", "sma_smk_per1000_15_19", "glcm_var_mean"]


    def winsor(s, lo=0.01, hi=0.99):
        a, b = s.quantile([lo, hi])
        return s.clip(a, b)


    # Prediktor yang berlawanan arah dengan informalitas (arah -1) langsung di-inverse:
    #   z_inv = 1 - z   -> makin tinggi prediktor asli, makin rendah nilai yang masuk indeks.
    # Kolomnya diberi akhiran _inv agar jelas di tabel bobot dan di diagram.
    z = pd.DataFrame({ID: df[ID]})
    meta_rows = []
    for v, (dim, arah) in INDIKATOR.items():
        if v not in df or df[v].isna().all():
            print("lewati (tidak ada data):", v)
            continue
        x = df[v].astype(float)
        x = x.fillna(x.median())                  # imputasi median, catat jumlahnya
        x = winsor(x)
        if v in LOG:
            x = np.log1p(x.clip(lower=0))
        x = (x - x.min()) / (x.max() - x.min())   # min-max 0-1
        if arah > 0:
            z[v] = x
            meta_rows.append((v, dim, arah, v, False))
        else:
            z[f"{v}_inv"] = 1 - x                  # inverse eksplisit
            meta_rows.append((f"{v}_inv", dim, arah, v, True))

    meta = pd.DataFrame(meta_rows, columns=["indikator", "dimensi", "arah", "asal", "invers"])
    print("Prediktor yang di-inverse:", ", ".join(meta.loc[meta.invers, "asal"]))
    z = z.merge(df[[ID, "pop", "keluarga", "perkotaan"]], on=ID)
    z.to_csv("indikator_desa.csv", index=False)
    meta.to_csv("indikator_meta.csv", index=False)
    print(z.describe().T.round(3))

def b2_indeks():
    """
    Penyusunan indeks tanpa label: PCA berjenjang (opsi A), bobot entropi (opsi D),
    agregasi aritmetik/geometrik, skala 0-100, dan analisis sensitivitas Monte Carlo.

    Kebutuhan:  pip install pandas numpy scikit-learn factor_analyzer scipy
    Masukan:    indikator_desa.csv, indikator_meta.csv (dari b1_indikator)
    Keluaran:   indeks_desa.csv, bobot_indikator.csv, sensitivitas.csv
    """
    ID = "iddesa"
    z = pd.read_csv("indikator_desa.csv", dtype={ID: str})
    meta = pd.read_csv("indikator_meta.csv")
    dims = meta.groupby("dimensi")["indikator"].apply(list).to_dict()
    X_all = z[meta["indikator"]].values

    # ---------------------------------------------------------------------
    # 1. Kelayakan analisis faktor
    # ---------------------------------------------------------------------
    chi2, p = calculate_bartlett_sphericity(X_all)
    _, kmo_total = calculate_kmo(X_all)
    print(f"Bartlett chi2={chi2:.1f}, p={p:.3g}; KMO={kmo_total:.3f} (layak bila > 0,6)")


    # ---------------------------------------------------------------------
    # 2. Bobot PCA (OECD/JRC): komponen dengan eigenvalue > 1, bobot = loading^2 x porsi varians
    #    w_j = sum_m (lambda_m / sum lambda) a_jm^2 , lalu dinormalisasi agar sum w_j = 1
    # ---------------------------------------------------------------------
    def bobot_pca(X):
        Xs = (X - X.mean(0)) / X.std(0, ddof=1)
        pca = PCA().fit(Xs)
        lam = pca.explained_variance_
        m = max(1, int((lam > 1).sum()))
        load = pca.components_[:m].T * np.sqrt(lam[:m])          # loading a_jm
        w = (load**2 * (lam[:m] / lam[:m].sum())).sum(axis=1)
        return w / w.sum(), pca.explained_variance_ratio_[:m].sum()


    # ---------------------------------------------------------------------
    # 3. Bobot entropi: e_j = -(1/ln n) sum_d p_dj ln p_dj ; w_j = (1-e_j) / sum (1-e_j)
    # ---------------------------------------------------------------------
    def bobot_entropi(X):
        P = (X + 1e-9) / (X + 1e-9).sum(0)
        e = -(P * np.log(P)).sum(0) / np.log(len(X))
        d = 1 - e
        return d / d.sum()


    def susun_indeks(z, w_ind, w_dim=None, agregasi="aritmetik"):
        sub = {}
        for d, cols in dims.items():
            w = np.array([w_ind[c] for c in cols])
            sub[d] = z[cols].values @ (w / w.sum())
        S = pd.DataFrame(sub)
        v = np.ones(S.shape[1]) / S.shape[1] if w_dim is None else np.array([w_dim[d] for d in S.columns])
        if agregasi == "aritmetik":
            I = S.values @ v
        else:  # geometrik, mengurangi kompensasi antar dimensi
            I = np.exp(np.log(S.values.clip(1e-3)) @ v)
        I = 100 * (I - I.min()) / (I.max() - I.min())
        return S, I


    rows, w_pca, w_ent = [], {}, {}
    for d, cols in dims.items():
        X = z[cols].values
        wp, var = bobot_pca(X) if len(cols) > 1 else (np.array([1.0]), 1.0)
        we = bobot_entropi(X) if len(cols) > 1 else np.array([1.0])
        kmo_d = calculate_kmo(X)[1] if len(cols) > 2 else np.nan
        for c, a, b in zip(cols, wp, we):
            w_pca[c], w_ent[c] = a, b
            rows.append({"dimensi": d, "indikator": c, "bobot_pca": a, "bobot_entropi": b,
                         "varians_dijelaskan": var, "kmo_dimensi": kmo_d})
    pd.DataFrame(rows).to_csv("bobot_indikator.csv", index=False)

    # Bobot antar dimensi dari PCA atas sub-indeks
    S_pca, _ = susun_indeks(z, w_pca)
    wd, _ = bobot_pca(S_pca.values)
    w_dim = dict(zip(S_pca.columns, wd))

    S_pca, I_pca = susun_indeks(z, w_pca, w_dim)                       # utama
    _, I_eq = susun_indeks(z, {c: 1 for c in meta.indikator})          # bobot sama
    _, I_ent = susun_indeks(z, w_ent)                                  # entropi
    _, I_geo = susun_indeks(z, w_pca, w_dim, agregasi="geometrik")     # geometrik

    out = pd.concat([z[[ID, "pop", "perkotaan"]], S_pca.mul(100).add_prefix("sub_")], axis=1)
    out["indeks_pca"], out["indeks_sama"], out["indeks_entropi"], out["indeks_geometrik"] = I_pca, I_eq, I_ent, I_geo
    print(out[["indeks_pca", "indeks_sama", "indeks_entropi", "indeks_geometrik"]].corr(method="spearman").round(3))

    # ---------------------------------------------------------------------
    # 4. Sensitivitas Monte Carlo: bobot Dirichlet di sekitar bobot PCA, normalisasi, agregasi
    #    Laporkan median |R_d^(s) - R_d^(0)| dan selang persentil 5-95 skor tiap desa
    # ---------------------------------------------------------------------
    rng = np.random.default_rng(2026)
    R0 = rankdata(-I_pca)
    skor_sim, geser = [], []
    for s in range(1000):
        w_s = {}
        for d, cols in dims.items():
            alpha = 50 * np.array([w_pca[c] for c in cols]) + 1e-3
            for c, w in zip(cols, rng.dirichlet(alpha)):
                w_s[c] = w
        v_s = dict(zip(w_dim, rng.dirichlet(50 * np.array(list(w_dim.values())))))
        zs = z.copy()
        if rng.random() < 0.5:  # ganti min-max dengan z-score yang dipetakan ke 0-1 lewat CDF normal
            from scipy.stats import norm
            zs[meta.indikator] = norm.cdf((z[meta.indikator] - z[meta.indikator].mean()) / z[meta.indikator].std())
        _, I_s = susun_indeks(zs, w_s, v_s, agregasi="aritmetik" if rng.random() < 0.5 else "geometrik")
        skor_sim.append(I_s)
        geser.append(np.median(np.abs(rankdata(-I_s) - R0)))
    skor_sim = np.array(skor_sim)
    out["indeks_p05"], out["indeks_p95"] = np.percentile(skor_sim, [5, 95], axis=0)
    print(f"Median pergeseran peringkat: {np.median(geser):.1f} desa dari {len(z)} "
          f"({100 * np.median(geser) / len(z):.1f}%; target < 10%)")
    pd.DataFrame({"simulasi": range(len(geser)), "median_geser_peringkat": geser}).to_csv("sensitivitas.csv", index=False)
    out.to_csv("indeks_desa.csv", index=False)

def b3_validasi_kalibrasi():
    """
    Validasi eksternal di tingkat kab/kota dan kalibrasi top-down (opsi E).

    Tidak ada label informalitas di tingkat desa. Karena itu:
      (1) validitas eksternal: rata-rata indeks berbobot penduduk per kab/kota vs tabel BPS (n = 19);
      (2) validitas konvergen: indeks geospasial-saja vs indeks PODES-saja di tingkat desa;
      (3) kalibrasi: indeks diubah menjadi estimasi proporsi pekerja informal desa yang
          rata-ratanya sama persis dengan angka resmi kab/kota (benchmarking logit).

    Kebutuhan:  pip install pandas numpy scipy statsmodels
    Masukan:    indeks_desa.csv (b2_indeks), indikator_desa.csv, indikator_meta.csv,
                tabel_bps_informal_kabkota.csv (kolom: kdkab, pct_informal, pendapatan_informal)
    Keluaran:   validasi_kabkota.csv, estimasi_proporsi_desa.csv
    """
    ID = "iddesa"
    ix = pd.read_csv("indeks_desa.csv", dtype={ID: str})
    ix["kdkab"] = ix[ID].str[:4]
    bps = pd.read_csv("tabel_bps_informal_kabkota.csv", dtype={"kdkab": str})

    # ---------------------------------------------------------------------
    # 1. Validitas eksternal kab/kota: I_k = sum_d P_d I_d / sum_d P_d
    # ---------------------------------------------------------------------
    wavg = lambda g, c: np.average(g[c], weights=g["pop"].clip(lower=1))
    kab = ix.groupby("kdkab").apply(lambda g: pd.Series({
        c: wavg(g, c) for c in ["indeks_pca", "indeks_sama", "indeks_entropi", "indeks_geometrik"]
    })).reset_index().merge(bps, on="kdkab")

    hasil = []
    for c in ["indeks_pca", "indeks_sama", "indeks_entropi", "indeks_geometrik"]:
        r1, p1 = spearmanr(kab[c], kab["pct_informal"])
        r2, p2 = spearmanr(kab[c], kab["pendapatan_informal"])
        hasil.append({"versi": c, "rho_pct_informal": r1, "p1": p1, "rho_pendapatan": r2, "p2": p2})
    val = pd.DataFrame(hasil)
    print(val.round(3))  # target: rho_pct_informal >= 0,6 dan rho_pendapatan negatif
    val.to_csv("validasi_kabkota.csv", index=False)

    # Interval kepercayaan bootstrap untuk rho (n kecil)
    rng = np.random.default_rng(1)
    boot = [spearmanr(*kab.sample(len(kab), replace=True, random_state=int(rng.integers(1_000_000_000)))[["indeks_pca", "pct_informal"]].T.values)[0]
            for _ in range(2000)]
    print("rho indeks_pca, IK 95%:", np.nanpercentile(boot, [2.5, 97.5]).round(3))

    # ---------------------------------------------------------------------
    # 2. Validitas konvergen: indeks dari sumber geospasial saja vs PODES saja
    # ---------------------------------------------------------------------
    z = pd.read_csv("indikator_desa.csv", dtype={ID: str})
    meta = pd.read_csv("indikator_meta.csv")
    podes_vars = [v for v, a in zip(meta.indikator, meta.asal) if a.endswith("_per1000kk") or a in ("jenis_kredit",)]
    geo_vars = [v for v in meta.indikator if v not in podes_vars]
    r, p = spearmanr(z[geo_vars].mean(axis=1), z[podes_vars].mean(axis=1))
    print(f"Konvergen geospasial vs PODES: rho={r:.3f} (p={p:.2g})")

    # ---------------------------------------------------------------------
    # 3. Kalibrasi top-down. Model agregat: logit(P_k) = a + b * Ibar_k (n = 19, cek LOOCV)
    # ---------------------------------------------------------------------
    kab["logit_P"] = logit(kab["pct_informal"] / 100)
    Xk = sm.add_constant(kab["indeks_pca"] / 100)
    fit = sm.OLS(kab["logit_P"], Xk).fit()
    print(fit.summary().tables[1])

    loo = []
    for i in range(len(kab)):
        m = sm.OLS(kab["logit_P"].drop(i), Xk.drop(i)).fit()
        loo.append(expit(m.predict(Xk.iloc[[i]]).iloc[0]) * 100)
    kab["pred_loo"] = loo
    rmse = np.sqrt(np.mean((kab["pred_loo"] - kab["pct_informal"]) ** 2))
    print(f"LOOCV RMSE kab/kota: {rmse:.2f} poin persen")

    # Prediksi awal desa: logit(p_d) = a + b * I_d
    a, b = fit.params
    ix["p_awal"] = expit(a + b * ix["indeks_pca"] / 100)


    # Benchmarking: cari delta_k agar sum_d w_d expit(logit p_d + delta_k) / sum_d w_d = P_k
    def benchmark(g):
        P_k = bps.set_index("kdkab").loc[g.name, "pct_informal"] / 100
        w = g["pop"].clip(lower=1).values
        lp = logit(g["p_awal"].clip(1e-4, 1 - 1e-4).values)
        f = lambda d: np.average(expit(lp + d), weights=w) - P_k
        delta = brentq(f, -10, 10)
        return pd.Series(100 * expit(lp + delta), index=g.index)


    ix["est_pct_informal"] = ix.groupby("kdkab", group_keys=False).apply(benchmark)
    cek = ix.groupby("kdkab").apply(lambda g: np.average(g["est_pct_informal"], weights=g["pop"].clip(lower=1)))
    print("Selisih maksimum dengan angka resmi (harus ~0):",
          np.abs(cek.values - bps.set_index("kdkab").loc[cek.index, "pct_informal"].values).max())
    ix[[ID, "kdkab", "indeks_pca", "indeks_p05", "indeks_p95", "est_pct_informal"]].to_csv(
        "estimasi_proporsi_desa.csv", index=False)

def b4_spasial_tipologi():
    """
    Autokorelasi spasial (Moran's I, LISA, Getis-Ord Gi*) dan tipologi kuadran.

    Kebutuhan:  pip install geopandas libpysal esda pandas numpy statsmodels
    Masukan:    DataWilayahDesa (GeoDataFrame, kolom iddesa), indeks_desa.csv,
                gee01_cahaya_terbangun_penduduk_2025.csv (ntl_popw untuk sumbu aktivitas)
    Keluaran:   spasial_tipologi_desa.csv, nagari_prioritas.csv
    """
    ID = "iddesa"
    ix = pd.read_csv("indeks_desa.csv", dtype={ID: str})
    g1 = pd.read_csv("gee01_cahaya_terbangun_penduduk_2025.csv", dtype={ID: str})
    gdf = DataWilayahDesa[[ID, "geometry"]].to_crs("EPSG:32747").merge(ix, on=ID).merge(g1[[ID, "ntl_popw"]], on=ID)
    gdf = gdf.reset_index(drop=True)

    # ---------------------------------------------------------------------
    # 1. Matriks bobot: queen contiguity; desa pulau tanpa tetangga diberi 2 tetangga terdekat
    # ---------------------------------------------------------------------
    wq = weights.Queen.from_dataframe(gdf, use_index=False)
    if wq.islands:
        wk = weights.KNN.from_dataframe(gdf.set_geometry(gdf.representative_point()), k=2)
        wq = weights.w_union(wq, wk)
    wq.transform = "r"

    y = gdf["indeks_pca"].values

    # ---------------------------------------------------------------------
    # 2. Global Moran's I dan LISA (999 permutasi, koreksi FDR)
    # ---------------------------------------------------------------------
    mi = Moran(y, wq, permutations=999)
    print(f"Moran's I = {mi.I:.3f}, p (permutasi) = {mi.p_sim:.4f}")

    lisa = Moran_Local(y, wq, permutations=999, seed=2026)
    sig = fdrcorrection(lisa.p_sim, alpha=0.05)[0]
    label = {1: "HH", 2: "LH", 3: "LL", 4: "HL"}
    gdf["lisa"] = np.where(sig, pd.Series(lisa.q).map(label), "Tidak signifikan")

    # ---------------------------------------------------------------------
    # 3. Getis-Ord Gi* (star=True memasukkan desa itu sendiri)
    # ---------------------------------------------------------------------
    gi = G_Local(y, wq, star=True, permutations=999, seed=2026)
    sig_gi = fdrcorrection(gi.p_sim, alpha=0.05)[0]
    gdf["gi_z"] = gi.Zs
    gdf["hotspot"] = np.select([sig_gi & (gi.Zs > 0), sig_gi & (gi.Zs < 0)], ["Hotspot", "Coldspot"], "Tidak signifikan")

    # ---------------------------------------------------------------------
    # 4. Tipologi kuadran: indeks informal vs intensitas aktivitas (cahaya malam berbobot penduduk)
    #    Batas kuadran = median provinsi. Sub-indeks tertinggi menjadi tuas kebijakan.
    # ---------------------------------------------------------------------
    akt = np.log1p(gdf["ntl_popw"])
    hi_inf = gdf["indeks_pca"] >= gdf["indeks_pca"].median()
    hi_akt = akt >= akt.median()
    gdf["tipologi"] = np.select(
        [hi_inf & hi_akt, hi_inf & ~hi_akt, ~hi_inf & hi_akt],
        ["Informal perkotaan", "Informal perdesaan", "Formal perkotaan"],
        "Desa sepi aktivitas",
    )
    sub_cols = [c for c in gdf.columns if c.startswith("sub_")]
    gdf["tuas_dominan"] = gdf[sub_cols].idxmax(axis=1).str.replace("sub_", "")

    out = gdf.drop(columns="geometry")
    out.to_csv("spasial_tipologi_desa.csv", index=False)

    # Nagari prioritas: tipologi informal, berada di hotspot atau klaster HH
    prio = out[out["tipologi"].str.startswith("Informal") & ((out["hotspot"] == "Hotspot") | (out["lisa"] == "HH"))]
    prio.sort_values("indeks_pca", ascending=False)[[ID, "indeks_pca", "tipologi", "tuas_dominan", "lisa", "hotspot"]] \
        .to_csv("nagari_prioritas.csv", index=False)
    print(out.groupby(["tipologi", "hotspot"]).size().unstack(fill_value=0))

if __name__ == "__main__":
    # DataWilayahDesa = gpd.read_file("batas_desa_sumbar_2025.gpkg")[["iddesa", "geometry"]]
    LANGKAH = ["a1", "a2", "b1", "b2", "b3", "b4"]  # tambahkan "a3" bila memakai variabel cadangan
    peta = {"a1": a1_poi_jalan, "a2": a2_rwi_ookla, "a3": a3_cadangan_grdi, "b1": b1_indikator,
            "b2": b2_indeks, "b3": b3_validasi_kalibrasi, "b4": b4_spasial_tipologi}
    for s in LANGKAH:
        print(f"=== {s} ===")
        peta[s]()
