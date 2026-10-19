import { useMemo, useState } from 'react'
import { ExternalLink, Search } from 'lucide-react'

export default function LiteratureTable({ items }) {
  const groups = useMemo(() => ['Semua', ...new Set(items.map((i) => i.kelompok))], [items])
  const [group, setGroup] = useState('Semua')
  const [q, setQ] = useState('')

  const rows = items.filter((it) => {
    if (group !== 'Semua' && it.kelompok !== group) return false
    if (!q) return true
    const s = `${it.penulis} ${it.judul} ${it.sumber} ${it.metode} ${it.relevansi}`.toLowerCase()
    return s.includes(q.toLowerCase())
  })

  return (
    <div className="lit">
      <div className="lit-tools">
        <div className="chips" role="group" aria-label="Kelompok literatur">
          {groups.map((g) => (
            <button key={g} type="button" className={`chip ${g === group ? 'is-on' : ''}`} aria-pressed={g === group} onClick={() => setGroup(g)}>
              {g}
            </button>
          ))}
        </div>
        <label className="search">
          <Search size={16} aria-hidden="true" />
          <input type="search" placeholder="Cari penulis, judul, metode" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <div className="table-wrap">
        <table className="lit-table">
          <thead>
            <tr>
              <th scope="col" className="c-no">No</th>
              <th scope="col">Penulis</th>
              <th scope="col">Judul dan sumber</th>
              <th scope="col">Metode / data</th>
              <th scope="col">Relevansi</th>
              <th scope="col" className="c-link">Tautan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((it) => (
              <tr key={it.id} id={`lit-${it.id}`}>
                <td className="c-no num" data-label="No">{items.indexOf(it) + 1}</td>
                <td data-label="Penulis">
                  <strong>{it.penulis}</strong>
                  <span className="lit-year num">{it.tahun}</span>
                </td>
                <td data-label="Judul">
                  <span className="lit-title">{it.judul}</span>
                  <span className="lit-source">
                    {it.sumber} · {it.jenis}
                  </span>
                </td>
                <td data-label="Metode">{it.metode}</td>
                <td data-label="Relevansi">{it.relevansi}</td>
                <td className="c-link" data-label="Tautan">
                  <a href={it.url} target="_blank" rel="noreferrer" className="icon-link" aria-label={`Buka ${it.judul}`}>
                    <ExternalLink size={16} aria-hidden="true" />
                    <span>Buka</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="empty">Tidak ada literatur yang cocok dengan pencarian ini.</p>}
      </div>
    </div>
  )
}
