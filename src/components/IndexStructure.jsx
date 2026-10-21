import { Fragment } from 'react'

// Struktur indeks: variabel (diwarnai menurut platform) -> dimensi (sub-indeks) -> indeks -> keluaran.
const PLATFORM_KELAS = ['pf-a', 'pf-b', 'pf-c', 'pf-d']

function tanda(arah = '') {
  if (arah === 'Sumbu') return { s: '↔', t: 'Sumbu tipologi, tidak masuk indeks' }
  const plus = arah.includes('(+)')
  const minus = arah.includes('(-)')
  if (plus && minus) return { s: '±', t: 'Arah campuran' }
  if (plus) return { s: '+', t: 'Makin tinggi makin informal' }
  if (minus) return { s: '−', t: 'Makin tinggi makin formal (arah dibalik)' }
  if (arah.startsWith('Campuran')) return { s: '±', t: 'Arah campuran' }
  return { s: '?', t: 'Diuji dulu sebelum masuk indeks' }
}

function nomorDimensi(d) {
  return parseInt(d, 10) || 99
}

function Chip({ v, kelas }) {
  const tg = tanda(v.arah)
  const diuji = v.arah === 'Diuji'
  return (
    <li className={`ix-chip ${kelas} ${diuji ? 'is-test' : ''}`} title={`${v.nama} · ${v.sumber}`}>
      <span className="ix-sign" title={tg.t} aria-label={tg.t}>
        {tg.s}
      </span>
      {v.singkat || v.nama}
    </li>
  )
}

export default function IndexStructure({ variabel, keluaran }) {
  const platforms = [...new Set(variabel.map((v) => v.platform))]
  const kelasOf = (pf) => PLATFORM_KELAS[platforms.indexOf(pf)] || 'pf-a'
  const sumbu = variabel.filter((v) => v.arah === 'Sumbu tipologi')
  const masuk = variabel.filter((v) => v.arah !== 'Sumbu tipologi')
  const dims = [...new Set(masuk.map((v) => v.dimensi))].sort((a, b) => nomorDimensi(a) - nomorDimensi(b))

  return (
    <figure className="ix">
      <div className="ix-legend" aria-label="Keterangan warna dan tanda">
        {platforms.map((pf) => (
          <span key={pf} className={`ix-key ${kelasOf(pf)}`}>
            <span className="ix-swatch" aria-hidden="true" />
            {pf}
          </span>
        ))}
        <span className="ix-key">
          <span className="ix-sign">+</span> informal
        </span>
        <span className="ix-key">
          <span className="ix-sign">−</span> formal
        </span>
        <span className="ix-key">
          <span className="ix-sign">?</span> diuji
        </span>
      </div>

      <div className="ix-grid">
        <div className="ix-head ix-c1">Variabel</div>
        <div className="ix-head ix-c3">Dimensi (sub-indeks)</div>
        <div className="ix-head ix-c5">Indeks</div>

        {dims.map((d, i) => {
          const rows = masuk.filter((v) => v.dimensi === d)
          const r = { gridRow: i + 2 }
          return (
            <Fragment key={d}>
              <ul className="ix-chips ix-c1" style={r}>
                {rows.map((v) => (
                  <Chip key={v.nama} v={v} kelas={kelasOf(v.platform)} />
                ))}
              </ul>
              <span className="ix-link ix-c2" style={r} aria-hidden="true" />
              <div className="ix-dim ix-c3" style={r}>
                <span className="ix-dim-no num">S{nomorDimensi(d)}</span>
                <span className="ix-dim-name">{d.replace(/^\d+\.\s*/, '')}</span>
                <span className="ix-dim-meta num">{rows.length} variabel · bobot PCA</span>
              </div>
              <span className="ix-link ix-c4" style={r} aria-hidden="true" />
            </Fragment>
          )
        })}

        <div className="ix-bracket" style={{ gridRow: `2 / ${dims.length + 2}` }} aria-hidden="true" />
        <div className="ix-index ix-c5" style={{ gridRow: `2 / ${dims.length + 2}` }}>
          <span className="ix-index-label">Indeks ekonomi informal desa</span>
          <span className="ix-index-scale num">0–100</span>
          <span className="ix-index-note">PCA atas sub-indeks S1–S{dims.length}, tanpa label desa</span>
        </div>
      </div>

      {keluaran?.length > 0 && (
        <ol className="ix-out">
          {keluaran.map((k) => (
            <li key={k.tahap} className="ix-out-step">
              <span className="ix-out-title">{k.tahap}</span>
              <span className="ix-out-text">{k.isi}</span>
              {k.tahap.startsWith('Tipologi') && sumbu.length > 0 && (
                <ul className="ix-chips">
                  {sumbu.map((v) => (
                    <Chip key={v.nama} v={{ ...v, arah: 'Sumbu' }} kelas={kelasOf(v.platform)} />
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
      <figcaption className="note">
        Arahkan kursor ke variabel untuk melihat nama lengkap dan sumbernya. Rincian rumus, literatur, dan skrip ada di tabel di bawah.
      </figcaption>
    </figure>
  )
}
