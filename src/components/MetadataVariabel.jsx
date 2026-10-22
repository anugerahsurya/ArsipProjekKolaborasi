import { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'

const KOLOM = [
  ['variabel', 'Variabel'],
  ['berkas', 'Berkas keluaran'],
  ['deskripsi', 'Deskripsi'],
  ['satuan', 'Satuan'],
  ['sumber', 'Sumber dan resolusi'],
  ['cara', 'Cara hitung'],
  ['zonal', 'Statistik zonal'],
  ['dimensi', 'Dimensi indeks'],
  ['status', 'Status'],
]

function keCsv(rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const head = KOLOM.map(([k]) => k).join(',')
  return [head, ...rows.map((r) => KOLOM.map(([k]) => esc(r[k])).join(','))].join('\n')
}

function unduh(rows) {
  // BOM supaya Excel membaca UTF-8 dengan benar
  const url = URL.createObjectURL(new Blob(['﻿' + keCsv(rows)], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'metadata_variabel.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function MetadataVariabel({ data }) {
  const rows = data.variabel
  const berkasList = useMemo(() => ['Semua', ...new Set(rows.map((r) => r.berkas))], [rows])
  const [berkas, setBerkas] = useState('Semua')
  const [q, setQ] = useState('')

  const tampil = rows.filter((r) => {
    if (berkas !== 'Semua' && r.berkas !== berkas) return false
    if (!q) return true
    return KOLOM.some(([k]) => String(r[k] || '').toLowerCase().includes(q.toLowerCase()))
  })

  return (
    <div className="meta-var">
      <div className="meta-head">
        <div>
          <h3>Metadata variabel</h3>
          <p className="note">{data.catatan}</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => unduh(rows)}>
          <Download size={16} aria-hidden="true" />
          Unduh CSV ({rows.length})
        </button>
      </div>

      <div className="lit-tools">
        <label className="meta-select">
          <span>Berkas</span>
          <select value={berkas} onChange={(e) => setBerkas(e.target.value)}>
            {berkasList.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="search">
          <Search size={16} aria-hidden="true" />
          <input type="search" placeholder="Cari nama variabel, sumber, satuan" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <div className="table-wrap">
        <table className="meta-table">
          <thead>
            <tr>
              <th scope="col">Variabel</th>
              <th scope="col">Deskripsi dan satuan</th>
              <th scope="col">Sumber dan resolusi</th>
              <th scope="col">Cara hitung</th>
              <th scope="col">Zonal</th>
              <th scope="col">Dimensi indeks</th>
            </tr>
          </thead>
          <tbody>
            {tampil.map((r) => (
              <tr key={`${r.berkas}-${r.variabel}`} className={`st-${r.status}`}>
                <td data-label="Variabel">
                  <code>{r.variabel}</code>
                  <span className="meta-file">{r.berkas}</span>
                  {r.status !== 'utama' && <span className="meta-badge">{r.status}</span>}
                </td>
                <td data-label="Deskripsi">
                  <span>{r.deskripsi}</span>
                  <span className="meta-unit">{r.satuan}</span>
                </td>
                <td data-label="Sumber">{r.sumber}</td>
                <td data-label="Cara hitung">{r.cara}</td>
                <td data-label="Zonal">{r.zonal}</td>
                <td data-label="Dimensi">{r.dimensi || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {tampil.length === 0 && <p className="empty">Tidak ada variabel yang cocok.</p>}
      </div>
    </div>
  )
}
