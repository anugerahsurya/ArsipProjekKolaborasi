# =====================================================================
# R 05 - Geographically Weighted PCA (opsi B) dengan paket GWmodel
# Menguji apakah bobot indikator berubah antar wilayah (pesisir, darek, Mentawai).
# Kebutuhan: install.packages(c("sf", "GWmodel", "dplyr", "readr"))
# Masukan:   DataWilayahDesa (sf poligon, kolom iddesa), indikator_desa.csv, indikator_meta.csv
# Keluaran:  gwpca_desa.csv (varians lokal PC1, indikator dominan, skor lokal)
# =====================================================================
library(sf)
library(GWmodel)
library(dplyr)
library(readr)

# DataWilayahDesa <- st_read("batas_desa_sumbar_2025.gpkg")
ind  <- read_csv("indikator_desa.csv", col_types = cols(iddesa = "c"))
meta <- read_csv("indikator_meta.csv")
vars <- meta$indikator

desa <- DataWilayahDesa |>
  select(iddesa) |>
  st_transform(32747) |>
  inner_join(ind, by = "iddesa")

# Titik representatif desa sebagai lokasi kernel
pt  <- st_point_on_surface(desa)
spdf <- as(pt, "Spatial")
# Standardisasi agar skala indikator setara
spdf@data[vars] <- scale(spdf@data[vars])

# Bandwidth adaptif (jumlah tetangga) dipilih dengan validasi silang
bw <- bw.gwpca(spdf, vars = vars, k = 3, robust = FALSE, adaptive = TRUE, kernel = "bisquare")
message("Bandwidth adaptif: ", bw, " desa tetangga")

gw <- gwpca(spdf, vars = vars, bw = bw, k = 3, adaptive = TRUE, kernel = "bisquare", scores = TRUE)

# Persentase varians lokal yang dijelaskan PC1
var_pc1 <- gw$local.PV[, 1]
# Indikator dengan loading terbesar (nilai mutlak) pada PC1 di tiap lokasi
lead <- apply(gw$loadings[, , 1], 1, function(x) vars[which.max(abs(x))])
# Skor lokal PC1 (arah diseragamkan: tanda mengikuti rata-rata loading positif)
skor <- sapply(seq_along(gw$gwpca.scores), function(i) {
  s <- gw$gwpca.scores[[i]][, 1]
  l <- gw$loadings[i, , 1]
  if (mean(l) < 0) -s[i] else s[i]
})

out <- tibble(iddesa = desa$iddesa, gwpca_var_pc1 = var_pc1, gwpca_indikator_dominan = lead,
              gwpca_skor_pc1 = skor)
write_csv(out, "gwpca_desa.csv")

# Uji Monte Carlo apakah variasi lokal signifikan (lambat; jalankan bila sempat)
# mc <- montecarlo.gwpca.2(spdf, vars = vars, k = 3, nsims = 99, adaptive = TRUE, bw = bw)
