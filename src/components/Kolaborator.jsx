import { useState } from 'react'
import { toast } from 'sonner'
import { LoaderCircle, Plus, UsersRound, X } from 'lucide-react'

export default function Kolaborator({ list, onAdd, onRemove, loading }) {
  const [nama, setNama] = useState('')
  const [busy, setBusy] = useState(false)

  const tambah = async (e) => {
    e.preventDefault()
    const n = nama.trim()
    if (!n) return
    if (list.some((x) => x.toLowerCase() === n.toLowerCase())) return toast.error(`${n} sudah ada di daftar`)
    setBusy(true)
    try {
      await onAdd(n)
      setNama('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const hapus = async (n) => {
    try {
      await onRemove(n)
      toast.success(`${n} dihapus dari kolaborator`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <section className="team" aria-labelledby="h-team">
      <div className="team-head">
        <UsersRound size={18} aria-hidden="true" />
        <h2 id="h-team">Kolaborator</h2>
        <span className="team-hint">Nama di sini menjadi pilihan PIC di checkpoint. Berlaku untuk semua topik di projek ini.</span>
      </div>
      <div className="team-body">
        {loading ? (
          <div className="skeleton" style={{ height: 32, width: 220 }} />
        ) : (
          <ul className="team-list">
            {list.map((n) => (
              <li key={n} className="person">
                <span>{n}</span>
                <button type="button" onClick={() => hapus(n)} aria-label={`Hapus ${n}`}>
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="team-empty">Belum ada kolaborator.</li>}
          </ul>
        )}
        <form className="team-form" onSubmit={tambah}>
          <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama kolaborator" aria-label="Nama kolaborator" maxLength={60} />
          <button type="submit" className="btn" disabled={busy || !nama.trim()}>
            {busy ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
            Tambah
          </button>
        </form>
      </div>
    </section>
  )
}
