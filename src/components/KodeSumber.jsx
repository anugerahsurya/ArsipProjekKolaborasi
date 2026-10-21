import { useState } from 'react'
import { Check, Copy, Download } from 'lucide-react'

function unduh(nama, isi) {
  const url = URL.createObjectURL(new Blob([isi], { type: 'text/plain;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nama
  a.click()
  URL.revokeObjectURL(url)
}

function Berkas({ item, isi }) {
  const [tersalin, setTersalin] = useState(false)
  const salin = async () => {
    try {
      await navigator.clipboard.writeText(isi)
      setTersalin(true)
      setTimeout(() => setTersalin(false), 1600)
    } catch {
      /* clipboard tidak tersedia */
    }
  }
  const baris = isi.split('\n').length

  return (
    <details className="kode">
      <summary>
        <span className="kode-lang">{item.bahasa}</span>
        <span className="kode-title">{item.judul}</span>
        <span className="kode-meta num">{baris} baris</span>
      </summary>
      <div className="kode-bar">
        <code>{item.file}</code>
        <span className="kode-out">Keluaran: {item.keluaran}</span>
        <div className="kode-actions">
          <button type="button" className="btn-ghost" onClick={salin}>
            {tersalin ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            {tersalin ? 'Tersalin' : 'Salin'}
          </button>
          <button type="button" className="btn-ghost" onClick={() => unduh(item.file, isi)}>
            <Download size={15} aria-hidden="true" />
            Unduh
          </button>
        </div>
      </div>
      <pre className="kode-pre">
        <code>{isi}</code>
      </pre>
    </details>
  )
}

export default function KodeSumber({ kode, sumber }) {
  return (
    <div className="kode-list">
      {kode.berkas.map((item) =>
        sumber[item.file] ? (
          <Berkas key={item.file} item={item} isi={sumber[item.file]} />
        ) : (
          <p key={item.file} className="error">Berkas {item.file} tidak ditemukan di folder kode.</p>
        ),
      )}
    </div>
  )
}
