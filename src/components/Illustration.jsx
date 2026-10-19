import { useMemo } from 'react'

function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const FALSE_COLOR = ['#b8323f', '#d25a5f', '#8e2433', '#c94452', '#9fb3b8', '#c9d3d5', '#1f4e6e']

function CitraKeKelas() {
  const { cells, bars, hexes } = useMemo(() => {
    const r = rng(11)
    const cells = Array.from({ length: 64 }, (_, i) => {
      const x = i % 8
      const y = Math.floor(i / 8)
      const urban = (x - 5.5) ** 2 + (y - 2) ** 2 < 5 + r() * 3
      const water = y > 5 && x < 3 + r() * 2
      const c = water ? 6 : urban ? 4 + Math.floor(r() * 2) : Math.floor(r() * 4)
      return { x, y, c }
    })
    const bars = ['Cahaya malam', 'Bangunan', 'Lahan tanam', 'NDVI', 'Lereng'].map((l) => ({ l, w: 0.3 + r() * 0.7 }))
    const hexes = []
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        hexes.push({ row, col, agri: !((col - 3.4) ** 2 + (row - 1.2) ** 2 < 3.2) || r() > 0.85 })
      }
    }
    return { cells, bars, hexes }
  }, [])

  const hexPath = (cx, cy, s) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i + Math.PI / 6
      return `${i ? 'L' : 'M'}${(cx + s * Math.cos(a)).toFixed(1)} ${(cy + s * Math.sin(a)).toFixed(1)}`
    }).join(' ') + 'Z'

  return (
    <svg className="illus" viewBox="0 0 640 300" role="img" aria-label="Alur: piksel citra satelit diringkas menjadi fitur per desa, lalu model memberi kelas pertanian atau non-pertanian untuk setiap desa">
      <defs>
        <pattern id="hatch-veg" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="5" fill="var(--veg-soft)" />
          <line x1="0" y1="0" x2="0" y2="5" stroke="var(--veg)" strokeWidth="1.6" />
        </pattern>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0L10 5L0 10z" fill="var(--ink)" />
        </marker>
      </defs>

      <g transform="translate(20 34)">
        <text className="illus-label" x="0" y="-12">Citra komposit</text>
        {cells.map((c, i) => (
          <rect key={i} className="illus-pop" style={{ '--i': i % 8 + c.y }} x={c.x * 22} y={c.y * 22} width="22" height="22" fill={FALSE_COLOR[c.c]} />
        ))}
        <rect x="0" y="0" width="176" height="176" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
        <text className="illus-note" x="0" y="196">Piksel 10 sampai 500 m</text>
      </g>

      <line x1="206" y1="122" x2="244" y2="122" stroke="var(--ink)" strokeWidth="1.5" markerEnd="url(#arrow)" />

      <g transform="translate(254 34)">
        <text className="illus-label" x="0" y="-12">Fitur per desa</text>
        {bars.map((b, i) => (
          <g key={b.l} transform={`translate(0 ${i * 35})`}>
            <text className="illus-note" x="0" y="10">{b.l}</text>
            <rect x="0" y="16" width="130" height="8" fill="var(--line)" />
            <rect className="illus-grow" style={{ '--i': i }} x="0" y="16" width={130 * b.w} height="8" fill="var(--contour)" />
          </g>
        ))}
      </g>

      <line x1="400" y1="122" x2="438" y2="122" stroke="var(--ink)" strokeWidth="1.5" markerEnd="url(#arrow)" />

      <g transform="translate(456 40)">
        <text className="illus-label" x="0" y="-18">Kelas per nagari</text>
        {hexes.map((h, i) => {
          const s = 17
          const cx = s + h.col * s * 1.732 + (h.row % 2) * s * 0.866
          const cy = s + h.row * s * 1.5
          return (
            <path
              key={i}
              className="illus-pop"
              style={{ '--i': 6 + h.col + h.row }}
              d={hexPath(cx, cy, s - 1)}
              fill={h.agri ? 'url(#hatch-veg)' : 'var(--contour)'}
              stroke="var(--ink)"
              strokeWidth="1"
            />
          )
        })}
        <g transform="translate(0 150)">
          <rect x="0" y="0" width="14" height="10" fill="url(#hatch-veg)" stroke="var(--ink)" />
          <text className="illus-note" x="20" y="9">Pertanian</text>
          <rect x="0" y="18" width="14" height="10" fill="var(--contour)" stroke="var(--ink)" />
          <text className="illus-note" x="20" y="27">Non-pertanian</text>
        </g>
      </g>
    </svg>
  )
}

function LapisanIndeks() {
  const layers = useMemo(() => {
    const r = rng(23)
    const n = 6
    const grid = (fn) => Array.from({ length: n * n }, (_, i) => fn(i % n, Math.floor(i / n)))
    const center = (x, y) => Math.max(0, 1 - Math.hypot(x - 3.6, y - 2.2) / 4.2)
    return [
      { nama: 'Fasilitas PODES', ket: 'pasar, warung, IMK, bank', cells: grid((x, y) => ({ x, y, v: r() })), jenis: 'titik' },
      { nama: 'Cahaya malam', ket: 'VIIRS per desa', cells: grid((x, y) => ({ x, y, v: center(x, y) * (0.7 + r() * 0.3) })), jenis: 'raster' },
      { nama: 'Indeks informal', ket: 'skor 0 sampai 100', cells: grid((x, y) => ({ x, y, v: Math.min(1, (1 - center(x, y)) * 0.8 + r() * 0.3) })), jenis: 'indeks' },
    ]
  }, [])

  const s = 22
  const ramp = (v) => `color-mix(in oklab, var(--contour) ${Math.round(v * 100)}%, white)`
  const light = (v) => `color-mix(in oklab, #f2c14e ${Math.round(v * 100)}%, #1b2422)`

  return (
    <svg className="illus" viewBox="0 0 640 320" role="img" aria-label="Tiga lapisan data ditumpuk: fasilitas ekonomi PODES, cahaya malam, dan indeks ekonomi informal per desa">
      {layers.map((l, li) => (
        <g key={l.nama} className="illus-layer" style={{ '--i': li }}>
          <g transform={`translate(200 ${20 + li * 84}) matrix(0.866 0.5 -0.866 0.5 0 0)`}>
            <rect x="0" y="0" width={s * 6} height={s * 6} fill="#fff" stroke="var(--ink)" strokeWidth="1.5" />
            {l.cells.map((c, i) =>
              l.jenis === 'titik' ? (
                <circle key={i} cx={c.x * s + s / 2} cy={c.y * s + s / 2} r={1.5 + c.v * 5} fill="var(--water)" opacity={c.v > 0.35 ? 1 : 0.25} />
              ) : (
                <rect key={i} x={c.x * s} y={c.y * s} width={s} height={s} fill={l.jenis === 'raster' ? light(c.v) : ramp(c.v)} stroke="#fff" strokeWidth="0.6" />
              ),
            )}
          </g>
          <line x1="330" y1={86 + li * 84} x2="398" y2={86 + li * 84} stroke="var(--ink)" strokeWidth="1" strokeDasharray="3 3" />
          <text className="illus-label" x="406" y={82 + li * 84}>{l.nama}</text>
          <text className="illus-note" x="406" y={98 + li * 84}>{l.ket}</text>
        </g>
      ))}
    </svg>
  )
}

export default function Illustration({ jenis }) {
  if (jenis === 'citra-ke-kelas') return <CitraKeKelas />
  if (jenis === 'lapisan-indeks') return <LapisanIndeks />
  return null
}
