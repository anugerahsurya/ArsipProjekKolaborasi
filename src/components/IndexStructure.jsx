import { useEffect, useRef, useState } from 'react'

// Diagram struktur indeks gaya SEM: variabel teramati (kotak) -> dimensi laten (elips) -> indeks (elips).
// Prediktor yang berlawanan arah ditandai garis merah putus-putus dan lencana "1 − z" (di-inverse).
const PF = ['pf-a', 'pf-b', 'pf-c', 'pf-d']
const LEBAR_MIN_SVG = 760

function tanda(v) {
  if (v.arah === 'Diuji') return { s: '?', t: 'Diuji dulu sebelum masuk indeks' }
  if (v.invers) return { s: '−', t: 'Makin tinggi makin formal, jadi di-inverse (1 − z)' }
  return { s: '+', t: 'Makin tinggi makin informal' }
}

const noDim = (d) => parseInt(d, 10) || 99
const namaDim = (d) => d.replace(/^\d+\.\s*/, '')

function useLebar() {
  const ref = useRef(null)
  const [w, setW] = useState(1000)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

// titik potong garis (pusat elips -> p) dengan tepi elips
function tepiElips(cx, cy, rx, ry, px, py) {
  const dx = px - cx
  const dy = py - cy
  const k = 1 / Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2 || 1)
  return [cx + dx * k, cy + dy * k]
}

function DiagramSvg({ dims, kelasOf }) {
  const BW = 290
  const BH = 26
  const ROW = 32
  const GAP = 16
  const DCX = 545
  const DRX = 104
  const DRY = 27
  const ICX = 865
  const IRX = 125
  const IRY = 62

  let y = 34
  const grup = dims.map(({ d, rows }) => {
    const items = rows.map((v) => {
      const it = { v, y }
      y += ROW
      return it
    })
    const cy = (items[0].y + items[items.length - 1].y) / 2 + BH / 2
    y += GAP
    return { d, items, cy }
  })
  const H = y - GAP + 14
  const icy = H / 2

  return (
    <svg className="sem-svg" viewBox={`0 0 1000 ${H}`} role="img" aria-label="Diagram struktur indeks: variabel, dimensi, dan indeks">
      <defs>
        <marker id="sem-panah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="sem-head" />
        </marker>
        <marker id="sem-panah-inv" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="sem-head is-inv" />
        </marker>
        <marker id="sem-panah-uji" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="sem-head is-test" />
        </marker>
      </defs>

      {grup.map(({ d, items, cy }) => (
        <g key={d}>
          {items.map(({ v, y: vy }) => {
            const tg = tanda(v)
            const uji = v.arah === 'Diuji'
            const my = vy + BH / 2
            const [ex, ey] = tepiElips(DCX, cy, DRX, DRY, BW, my)
            const kelas = uji ? 'is-test' : v.invers ? 'is-inv' : ''
            return (
              <g key={v.nama} className={`sem-var ${kelasOf(v.platform)} ${kelas}`}>
                <title>{`${v.nama} · ${v.sumber}${v.invers ? ' · di-inverse (1 − z)' : ''}`}</title>
                <line x1={BW} y1={my} x2={ex} y2={ey} className="sem-line" markerEnd={`url(#${uji ? 'sem-panah-uji' : v.invers ? 'sem-panah-inv' : 'sem-panah'})`} />
                <rect x="0" y={vy} width={BW} height={BH} rx="4" className="sem-box" />
                <rect x="0" y={vy} width="5" height={BH} rx="2" className="sem-accent" />
                <circle cx="19" cy={my} r="8.5" className="sem-sign" />
                <text x="19" y={my + 4} textAnchor="middle" className="sem-sign-t">{tg.s}</text>
                <text x="34" y={my + 4.5} className="sem-var-t">{v.singkat || v.nama}</text>
                {v.invers && (
                  <g>
                    <rect x={BW - 50} y={vy + 4} width="44" height={BH - 8} rx="9" className="sem-inv-badge" />
                    <text x={BW - 28} y={my + 4} textAnchor="middle" className="sem-inv-t">1 − z</text>
                  </g>
                )}
              </g>
            )
          })}
          {(() => {
            const [sx, sy] = [DCX + DRX, cy]
            const [ex, ey] = tepiElips(ICX, icy, IRX, IRY, sx, sy)
            return <line x1={sx} y1={sy} x2={ex} y2={ey} className="sem-line is-dim" markerEnd="url(#sem-panah)" />
          })()}
          <ellipse cx={DCX} cy={cy} rx={DRX} ry={DRY} className="sem-dim" />
          <text x={DCX} y={cy - 4} textAnchor="middle" className="sem-dim-no">{`S${noDim(d)} · ${items.length} variabel`}</text>
          <text x={DCX} y={cy + 13} textAnchor="middle" className="sem-dim-t">{namaDim(d)}</text>
        </g>
      ))}

      <ellipse cx={ICX} cy={icy} rx={IRX} ry={IRY} className="sem-index" />
      <text x={ICX} y={icy - 18} textAnchor="middle" className="sem-index-t">Indeks ekonomi</text>
      <text x={ICX} y={icy} textAnchor="middle" className="sem-index-t">informal desa</text>
      <text x={ICX} y={icy + 30} textAnchor="middle" className="sem-index-scale">0–100</text>
      <text x={ICX} y={icy + IRY + 22} textAnchor="middle" className="sem-cap">PCA atas S1–S{dims.length}</text>
      <text x={DCX} y={grup[0].cy - DRY - 10} textAnchor="middle" className="sem-cap">bobot PCA per dimensi</text>
    </svg>
  )
}

function DiagramPohon({ dims, kelasOf }) {
  return (
    <div className="sem-tree">
      <div className="sem-root">
        <span>Indeks ekonomi informal desa</span>
        <strong className="num">0–100</strong>
      </div>
      <ul className="sem-branches">
        {dims.map(({ d, rows }) => (
          <li key={d} className="sem-branch">
            <div className="sem-node">
              <span className="sem-node-no num">S{noDim(d)}</span>
              {namaDim(d)}
            </div>
            <ul className="sem-leaves">
              {rows.map((v) => {
                const tg = tanda(v)
                const uji = v.arah === 'Diuji'
                return (
                  <li key={v.nama} className={`sem-leaf ${kelasOf(v.platform)} ${uji ? 'is-test' : v.invers ? 'is-inv' : ''}`} title={v.sumber}>
                    <span className="ix-sign" title={tg.t}>{tg.s}</span>
                    <span className="sem-leaf-t">{v.singkat || v.nama}</span>
                    {v.invers && <span className="sem-inv">1 − z</span>}
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function IndexStructure({ variabel, keluaran }) {
  const [ref, lebar] = useLebar()
  const platforms = [...new Set(variabel.map((v) => v.platform))]
  const kelasOf = (pf) => PF[platforms.indexOf(pf)] || 'pf-a'
  const sumbu = variabel.filter((v) => v.arah === 'Sumbu tipologi')
  const masuk = variabel.filter((v) => v.arah !== 'Sumbu tipologi')
  const dims = [...new Set(masuk.map((v) => v.dimensi))]
    .sort((a, b) => noDim(a) - noDim(b))
    .map((d) => ({ d, rows: masuk.filter((v) => v.dimensi === d) }))
  const nInv = masuk.filter((v) => v.invers).length

  return (
    <figure className="ix" ref={ref}>
      <div className="ix-legend" aria-label="Keterangan diagram">
        {platforms.map((pf) => (
          <span key={pf} className={`ix-key ${kelasOf(pf)}`}>
            <span className="ix-swatch" aria-hidden="true" />
            {pf}
          </span>
        ))}
        <span className="ix-key">
          <span className="ix-sign">+</span> searah informal
        </span>
        <span className="ix-key">
          <span className="key-inv" aria-hidden="true" />
          <span className="ix-sign">−</span> di-inverse (1 − z), {nInv} variabel
        </span>
        <span className="ix-key">
          <span className="ix-sign">?</span> diuji
        </span>
      </div>

      {lebar >= LEBAR_MIN_SVG ? <DiagramSvg dims={dims} kelasOf={kelasOf} /> : <DiagramPohon dims={dims} kelasOf={kelasOf} />}

      {keluaran?.length > 0 && (
        <ol className="ix-out">
          {keluaran.map((k) => (
            <li key={k.tahap} className="ix-out-step">
              <span className="ix-out-title">{k.tahap}</span>
              <span className="ix-out-text">{k.isi}</span>
              {k.tahap.startsWith('Tipologi') && sumbu.length > 0 && (
                <span className="ix-out-text">
                  Sumbu aktivitas: <strong>{sumbu.map((v) => v.singkat || v.nama).join(', ')}</strong> (tidak masuk indeks)
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
      <figcaption className="note">
        Kotak adalah variabel teramati, elips adalah dimensi (sub-indeks) dan indeks. Panah merah putus-putus menandai prediktor yang
        makin tinggi makin formal, sehingga di-inverse (1 − z) sebelum masuk indeks. Arahkan kursor ke kotak untuk melihat sumber datanya.
      </figcaption>
    </figure>
  )
}
