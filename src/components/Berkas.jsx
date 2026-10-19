import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ExternalLink, FileText, Link2, LoaderCircle, Presentation, Upload } from 'lucide-react'
import { stateKey } from '../lib/useProjectState.js'
import { waktuRelatif } from '../lib/format.js'

const MAKS_MB = 20

const SLOT = [
  { jenis: 'bahan_tayang', label: 'Bahan Tayang', ket: 'PDF slide presentasi', icon: Presentation },
  { jenis: 'artikel_final', label: 'File Artikel Final', ket: 'PDF artikel sesuai template', icon: FileText },
]

function SlotPdf({ slot, row, onUpload }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const Icon = slot.icon

  const kirim = async (file) => {
    if (!file) return
    if (file.type !== 'application/pdf') return toast.error('Berkas harus PDF')
    if (file.size > MAKS_MB * 1024 * 1024) return toast.error(`Ukuran maksimal ${MAKS_MB} MB`)
    setBusy(true)
    try {
      await onUpload(file)
      toast.success(`${slot.label} terunggah ke Google Drive`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div
      className={`slot ${drag ? 'is-drag' : ''} ${row ? 'is-filled' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        kirim(e.dataTransfer.files[0])
      }}
    >
      <div className="slot-head">
        <Icon size={20} aria-hidden="true" />
        <div>
          <h4>{slot.label}</h4>
          <p>{slot.ket}, maks {MAKS_MB} MB</p>
        </div>
      </div>

      {row ? (
        <a className="slot-file" href={row.url} target="_blank" rel="noreferrer">
          <span className="slot-name">{row.nama}</span>
          <span className="slot-meta">Diunggah {waktuRelatif(row.updatedAt)}</span>
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      ) : (
        <p className="slot-empty">Belum ada berkas. Tarik PDF ke sini atau pilih berkas.</p>
      )}

      <input ref={input} type="file" accept="application/pdf" hidden onChange={(e) => kirim(e.target.files[0])} />
      <button type="button" className="btn" onClick={() => input.current?.click()} disabled={busy}>
        {busy ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : <Upload size={16} aria-hidden="true" />}
        {busy ? 'Mengunggah' : row ? 'Ganti berkas' : 'Pilih PDF'}
      </button>
    </div>
  )
}

function SlotLink({ row, onSave }) {
  const [url, setUrl] = useState(row?.url || '')
  const [busy, setBusy] = useState(false)
  const valid = /^https?:\/\/\S+\.\S+/.test(url)

  const simpan = async (e) => {
    e.preventDefault()
    if (!valid) return toast.error('Tautan harus diawali http:// atau https://')
    setBusy(true)
    try {
      await onSave(url)
      toast.success('Link pengerjaan tersimpan')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={`slot ${row ? 'is-filled' : ''}`} onSubmit={simpan}>
      <div className="slot-head">
        <Link2 size={20} aria-hidden="true" />
        <div>
          <h4>Link Pengerjaan Artikel</h4>
          <p>Dokumen kolaborasi (Google Docs, Overleaf, dan sejenisnya)</p>
        </div>
      </div>
      {row && (
        <a className="slot-file" href={row.url} target="_blank" rel="noreferrer">
          <span className="slot-name">{row.url}</span>
          <span className="slot-meta">Diperbarui {waktuRelatif(row.updatedAt)}</span>
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      )}
      <div className="slot-row">
        <input
          type="url"
          inputMode="url"
          placeholder="https://docs.google.com/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-label="Link pengerjaan artikel"
          aria-invalid={url !== '' && !valid}
        />
        <button type="submit" className="btn" disabled={busy || !url || url === row?.url}>
          {busy ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : null}
          Simpan
        </button>
      </div>
    </form>
  )
}

export default function Berkas({ topic, berkas, onSave, loading }) {
  if (loading) return <div className="skeleton" style={{ height: 180 }} aria-busy="true" />
  return (
    <div className="slots">
      {SLOT.map((s) => (
        <SlotPdf key={s.jenis} slot={s} row={berkas[stateKey(topic.id, s.jenis)]} onUpload={(file) => onSave(topic.id, s.jenis, file)} />
      ))}
      <SlotLink row={berkas[stateKey(topic.id, 'link')]} onSave={(url) => onSave(topic.id, 'link', url)} />
      <p className="slots-note">
        Berkas disimpan di Google Drive, folder "Artikel Ilmiah Surya", dengan akses Pengomentar untuk siapa saja yang memiliki link.
      </p>
    </div>
  )
}
